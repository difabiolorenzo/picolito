#!/usr/bin/env node
// Test d'originalité des packs réécrits (refonte des bases, voir docs/dev/reflexion/refonte_des_bases.md §4.3).
// Compare chaque phrase d'un pack `schema: 2` aux anciennes bases et aux sources tierces de la même
// langue, et signale celles qui en sont trop proches : une réécriture doit être une phrase neuve,
// pas une paraphrase.
//
// Usage :
//   node tests/checks/check_originality.js <pack.json> [pack2.json ...] [options]
//   node tests/checks/check_originality.js --all          # tous les packs `schema: 2` de src/db
//
// Options :
//   --seuil N       similarité (0-1) à partir de laquelle une phrase est signalée (défaut 0.5,
//                   à recalibrer sur le pack pilote)
//   --inclusion N   part des trigrammes de la phrase retrouvés dans une même ancienne phrase,
//                   à partir de laquelle elle est signalée (défaut 0.85)
//   --top N         affiche aussi les N phrases les plus proches, même sous le seuil (calibrage)
//   --json          sortie JSON
//
// Références (dossier docs/ ignoré par git, donc absent d'un clone du dépôt) :
//   docs/dev/sources/anciennes_bases/**/*.json     copie des bases d'origine
//   docs/dev/sources/nouveau_je_n_ai_jamais/*.js   phrases d'un site tiers
// Sans références, le contrôle des packs est sauté avec un avertissement (code 0).
// Un auto-test de la mesure est lancé à chaque exécution.
//
// Mesure : trigrammes de caractères après normalisation (minuscules, sans accents, sans ponctuation,
// sans tokens %s / %t / %1 / $), pondérés par leur rareté dans les références de la langue.
// Similarité = coefficient de Dice pondéré (voir la classe Corpus).
// Les phrases de moins de 40 caractères normalisés ne donnent qu'un avertissement : sur une phrase
// aussi courte, un seul mot partagé suffit à faire monter le score, et elle est rarement protégeable.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const DB_DIR = path.join(ROOT, "src", "db");
const REF_PACKS_DIR = path.join(ROOT, "docs", "dev", "sources", "anciennes_bases");
const REF_THIRD_PARTY_DIR = path.join(ROOT, "docs", "dev", "sources", "nouveau_je_n_ai_jamais");
const MIN_LENGTH = 40;   // en dessous (caractères normalisés), une phrase trop proche n'est qu'un avertissement
const RARE_GRAMS = 8;    // trigrammes les plus rares d'une phrase utilisés pour présélectionner
const CANDIDATES = 200;  // références présélectionnées avant le calcul exact

// ---------- Options ----------
const args = process.argv.slice(2);
function option(name, fallback) {
    const i = args.indexOf(name);
    if (i === -1) return fallback;
    const v = Number(args[i + 1]);
    if (!Number.isFinite(v)) { console.error(`Valeur invalide pour ${name}`); process.exit(1); }
    return v;
}
const SEUIL = option("--seuil", 0.5);
const INCLUSION = option("--inclusion", 0.85);
const TOP = option("--top", 0);
const AS_JSON = args.includes("--json");
const VALUED = new Set(["--seuil", "--inclusion", "--top"]);
let files = args.filter((a, i) => !a.startsWith("--") && !VALUED.has(args[i - 1]));

// ---------- Mesure ----------
function normalize(text) {
    return String(text)
        .replace(/\\\$/g, " ")              // dollar littéral
        .replace(/%(?:s|t|\d+)/g, " ")      // joueurs et équipes
        .replace(/\$/g, " ")                // gorgées
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

function trigrams(norm) {
    const set = new Set();
    const padded = " " + norm + " ";
    for (let i = 0; i + 3 <= padded.length; i++) set.add(padded.slice(i, i + 3));
    return set;
}

// Corpus de référence d'une langue. Chaque trigramme est pondéré par sa rareté dans le corpus
// (log(1 + N / df)) : les formules du jeu (« bois $ gorgées », « chaque fois que ») pèsent peu,
// les mots distinctifs beaucoup. Similarité = Dice pondéré ; inclusion = part pondérée des
// trigrammes de la nouvelle phrase retrouvés dans l'ancienne.
class Corpus {
    constructor(refs) {
        this.refs = refs.map((r) => ({ ...r, norm: normalize(r.text) })).filter((r) => r.norm.length > 0);
        this.index = new Map();
        this.refs.forEach((r, i) => {
            r.grams = trigrams(r.norm);
            for (const g of r.grams) {
                if (!this.index.has(g)) this.index.set(g, []);
                this.index.get(g).push(i);
            }
        });
        const n = this.refs.length || 1;
        this.maxWeight = Math.log(1 + n);
        this.weight = (g) => { const l = this.index.get(g); return l ? Math.log(1 + n / l.length) : this.maxWeight; };
        for (const r of this.refs) { r.total = 0; for (const g of r.grams) r.total += this.weight(g); }
    }

    closest(text) {
        const norm = normalize(text);
        const grams = trigrams(norm);
        let total = 0;
        const counts = new Map();
        for (const g of grams) total += this.weight(g);
        // Présélection : les références qui partagent les trigrammes les plus rares de la phrase.
        // Une copie les contient tous, donc arrive en tête ; le calcul exact se fait ensuite.
        const rarest = [...grams].filter((g) => this.index.has(g))
            .sort((x, y) => this.index.get(x).length - this.index.get(y).length)
            .slice(0, RARE_GRAMS);
        for (const g of rarest) for (const i of this.index.get(g)) counts.set(i, (counts.get(i) || 0) + this.weight(g));
        const candidates = [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, CANDIDATES);
        let best = { dice: 0, inclusion: 0, ref: null };
        for (const [i] of candidates) {
            const r = this.refs[i];
            let shared = 0;
            for (const g of grams) if (r.grams.has(g)) shared += this.weight(g);
            const dice = (2 * shared) / (total + r.total);
            const inclusion = shared / (total || 1);
            if (dice > best.dice) best = { dice, inclusion, ref: r };
            if (inclusion > best.inclusion && dice >= best.dice - 0.05) best = { dice, inclusion, ref: r };
        }
        return { norm, ...best };
    }
}

// ---------- Auto-test ----------
function selfTest() {
    const checks = [];
    const expect = (label, ok) => { checks.push({ label, ok }); };
    const corpus = new Corpus([
        "%s, ramène le numéro d'une personne inconnue ou bois $ gorgées",
        "%s raconte une blague ou boit $ gorgées",
        "%s est le clodo de la soirée ! Tu bois $ gorgées à chaque fois qu'un joueur te parle",
        "%s, mime un animal ou bois $ gorgées",
        "Chaque fois que quelqu'un rit, %s boit $ gorgées",
        "%s, chante le refrain d'une chanson ou bois $ gorgées",
        "Ceux qui ont déjà menti à leurs parents boivent $ gorgées",
        "%s, fais dix pompes ou bois $ gorgées"
    ].map((text) => ({ text, source: "auto-test" })));
    const copy = corpus.closest("%1, RAMENE le numéro d'une personne inconnue, ou bois $ gorgées !");
    expect("copie (tokens, casse, accents, ponctuation ignorés) : similarité 1", copy.dice > 0.999);
    const para = corpus.closest("%1, rapporte le numéro de téléphone d'un inconnu, sinon tu bois $ gorgées");
    const fresh = corpus.closest("%1 imite le bruit de la machine à café jusqu'à ce que quelqu'un rie, sinon bois $ gorgées");
    expect("phrase neuve reprenant seulement les formules du jeu : sous 0.4", fresh.dice < 0.4);
    expect("paraphrase nettement plus proche qu'une phrase neuve (écart ≥ 0.15)", para.dice - fresh.dice >= 0.15);
    if (process.env.ORIGINALITY_DEBUG) console.error({ copy: copy.dice, para: para.dice, fresh: fresh.dice });
    return checks;
}

// ---------- Références ----------
function walk(dir, ext, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, ext, out);
        else if (e.name.endsWith(ext)) out.push(p);
    }
    return out.sort();
}

function textsOf(entry) {
    const out = [];
    const add = (v) => {
        if (typeof v === "string") out.push(v);
        else if (Array.isArray(v)) v.forEach(add);
    };
    if (!entry || typeof entry !== "object") { add(entry); return out; }
    add(entry.text);
    add(entry.question);
    if (Array.isArray(entry.suites)) entry.suites.forEach((s) => add(s && s.text));
    return out;
}

// Références d'une langue (les packs sans champ `language` comptent pour toutes les langues).
function loadReferences(language) {
    const refs = [];
    for (const file of walk(REF_PACKS_DIR, ".json")) {
        const pack = JSON.parse(fs.readFileSync(file, "utf8"));
        if (pack.language && pack.language !== language) continue;
        const source = path.relative(ROOT, file).replace(/\\/g, "/");
        for (const entry of pack.db || []) for (const text of textsOf(entry)) refs.push({ text, source });
    }
    const third = path.join(REF_THIRD_PARTY_DIR, language + ".js");
    if (fs.existsSync(third)) {
        const raw = fs.readFileSync(third, "utf8");
        const source = path.relative(ROOT, third).replace(/\\/g, "/");
        try {
            const groups = JSON.parse(raw.slice(raw.indexOf("[")).replace(/;\s*$/, ""));
            for (const g of groups) for (const text of g.content || []) refs.push({ text, source });
        } catch (e) { console.error(`Référence illisible, ignorée : ${source} (${e.message})`); }
    }
    return refs;
}

// ---------- Exécution ----------
const report = { selfTest: selfTest(), packs: [], skipped: null };
let errors = report.selfTest.filter((c) => !c.ok).length;

if (args.includes("--all")) {
    files = walk(DB_DIR, ".json").filter((f) => {
        try { return JSON.parse(fs.readFileSync(f, "utf8")).schema === 2; } catch { return false; }
    });
}
for (const f of files) {
    if (!fs.existsSync(f)) { console.error(`Pack introuvable : ${f}`); process.exit(1); }
}

if (files.length > 0 && !fs.existsSync(REF_PACKS_DIR)) {
    report.skipped = "références absentes (docs/dev/sources/anciennes_bases/) : contrôle des packs sauté";
} else {
    const corpora = new Map(); // langue -> Corpus
    for (const file of files) {
        const pack = JSON.parse(fs.readFileSync(file, "utf8"));
        const language = pack.language || "fr";
        if (!corpora.has(language)) corpora.set(language, new Corpus(loadReferences(language)));
        const corpus = corpora.get(language);
        const result = { file: path.relative(ROOT, path.resolve(file)).replace(/\\/g, "/"), language, references: corpus.refs.length, checked: 0, flagged: [], warnings: [], top: [] };
        const all = [];
        for (const entry of pack.db || []) {
            for (const text of textsOf(entry)) {
                result.checked++;
                const c = corpus.closest(text);
                if (!c.ref) continue;
                const item = { id: entry.id ?? null, text, dice: +c.dice.toFixed(3), inclusion: +c.inclusion.toFixed(3), closest: c.ref.text, source: c.ref.source };
                all.push(item);
                const tooClose = c.dice >= SEUIL || c.inclusion >= INCLUSION;
                if (tooClose && c.norm.length >= MIN_LENGTH) result.flagged.push(item);
                else if (tooClose) result.warnings.push(item);
            }
        }
        if (TOP > 0) result.top = all.sort((x, y) => y.dice - x.dice).slice(0, TOP);
        errors += result.flagged.length;
        report.packs.push(result);
    }
}

if (AS_JSON) {
    console.log(JSON.stringify({ seuil: SEUIL, inclusion: INCLUSION, ...report }, null, 2));
} else {
    for (const c of report.selfTest) console.log(`${c.ok ? "OK" : "ERREUR"} : auto-test, ${c.label}`);
    if (files.length === 0) console.log("Aucun pack `schema: 2` à contrôler.");
    if (report.skipped) console.log(`AVERTISSEMENT : ${report.skipped}`);
    for (const p of report.packs) {
        console.log(`\n${p.file} (${p.language}, ${p.references} phrases de référence) : ${p.checked} phrase(s), ${p.flagged.length} trop proche(s), ${p.warnings.length} avertissement(s)`);
        const show = (label, item) => {
            console.log(`  ${label} ${item.id ?? "?"}  similarité ${item.dice}  inclusion ${item.inclusion}`);
            console.log(`    nouvelle : ${item.text}`);
            console.log(`    ancienne : ${item.closest}   [${item.source}]`);
        };
        p.flagged.forEach((i) => show("ERREUR :", i));
        p.warnings.forEach((i) => show("AVERTISSEMENT (phrase courte) :", i));
        if (p.top.length) { console.log(`  --- ${p.top.length} plus proches ---`); p.top.forEach((i) => show("·", i)); }
    }
    console.log(errors ? `\n${errors} erreur(s) (seuil ${SEUIL}, inclusion ${INCLUSION}).` : "\nAucune phrase trop proche.");
}
process.exit(errors ? 1 : 0);
