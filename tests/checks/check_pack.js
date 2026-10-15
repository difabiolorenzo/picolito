// Audit statique d'un pack JSON : coherence schema vs moteur de generation.
//
// Exemples :
//   node tests/checks/check_pack.js src/db/picolo/war_fr.json
//   node tests/checks/check_pack.js --all           # tous les packs de src/db/**/*.json
//   node tests/checks/check_pack.js src/db/picolo/default_en.json src/db/je_n_ai_jamais/popular_en.json
//
// Schémas supportés :
//   schema 2         -> { schema:2, id, gamemode, language, version, experimental?, pack_name, pack_description,
//                         db:[{id, type, text, suites?, joueurs?, infos?}] }
//                       (docs/dev/reflexion/refonte_des_bases.md §4.6) ; parité des `id` entre langues
//   anciens packs, par gamemode :
//   picolo / war     -> { filters:[...], db:[{type,text,key,parent_key,nb_players,language}] }
//   je_n_ai_jamais   -> { gamemode, db:[{text}] }
//   maillon_faible   -> { gamemode, db:[{question,reponse,difficulty}] }
//   question_pour_un_champion -> { gamemode, db:[{series,type,question,reponse,(points)}] }
//
// Vérifie :
//   - schema general (id, gamemode, db) et champs obligatoires selon le type de pack
//   - couverture : types des filters presents dans la db (picolo uniquement)
//   - phrases-suite (key != "") : clés orphelines, buckets nb_players manquants
//     (jouabilité des suites vérifiée à partir du nombre de joueurs où le parent est atteignable)
//   - distribution des tokens %t / %s / $
//   Une sortie en erreurs signalées "ERREUR" fait quitter avec un code ≠ 0.
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const DB_DIR = path.join(ROOT, "src", "db");

function usage() {
    console.log("Usage: node tests/checks/check_pack.js <pack.json> [pack2.json ...] | --all");
    process.exit(1);
}

function collectAllPacks() {
    const out = [];
    (function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(p);
            else if (entry.name.endsWith(".json")) out.push(p);
        }
    })(DB_DIR);
    return out.sort();
}

let files = process.argv.slice(2).filter(a => !a.startsWith("--"));
if (process.argv.includes("--all")) files = collectAllPacks();
if (files.length == 0) usage();
for (const f of files) {
    if (!fs.existsSync(f)) { console.error(`Pack introuvable : ${f}`); process.exit(1); }
}

let globalErrors = 0;
let exitCode = 0;

// Catalogue des types et modèle de cartes du jeu (src/js/types.js, cards.js), chargés tels quels.
const model = (() => {
    const ctx = vm.createContext({});
    for (const f of ["src/js/types.js", "src/js/cards.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
    return vm.runInContext("({ CARD_TYPES, PACK_ID_PATTERN, packFamilyFromId, normalizePack, maxPlayerToken })", ctx);
})();
const RETIRED_IDS = (() => {
    const f = path.join(ROOT, "tests", "tools", "retired_ids.json");
    return new Set(fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).ids || [] : []);
})();
const schema2Packs = []; // { file, pack } pour le contrôle de parité entre langues

function audit(file) {
    const pack = JSON.parse(fs.readFileSync(file, "utf8"));
    const db = Array.isArray(pack.db) ? pack.db : (Array.isArray(pack) ? pack : []);
    const gamemode = pack.gamemode;
    const errors = [];
    const err = (msg) => { errors.push(msg); globalErrors++; };

    console.log(`== ${path.relative(ROOT, file)} ==`);
    console.log(`id=${pack.id || "?"} | gamemode=${gamemode || "?"} | langue=${pack.language || "?"} | version=${pack.version || "?"} | phrases=${db.length}${pack.schema ? ` | schema=${pack.schema}` : ""}`);
    console.log("");

    if (pack.schema !== undefined) {
        if (pack.schema === 2) { auditSchema2(pack, err); schema2Packs.push({ file, pack }); }
        else err(`schema ${JSON.stringify(pack.schema)} inconnu (attendu : 2, ou absent pour un ancien pack)`);
        if (errors.length) exitCode = 1;
        printErrors(errors);
        return;
    }

    // --- 1) Schéma général selon le type de pack ---
    console.log("1) SCHEMA");
    const required = {
        "picolo": ["text", "type"],
        "war": ["text", "type"],
        "je_n_ai_jamais": ["text"],
        "maillon_faible": ["question", "reponse", "difficulty"],
        "question_pour_un_champion": ["question"]
    }[gamemode] || ["text"];

    const optionalField = {
        "question_pour_un_champion": ["reponse"]
    }[gamemode] || [];

    const missingField = new Set();
    let optionalEmpty = 0;
    let infosCount = 0;
    for (const e of db) {
        if (!e) { err("entrée null dans db"); continue; }
        for (const field of required) {
            if (e[field] === undefined || e[field] === null || e[field] === "") {
                missingField.add(field + " (ex. " + String(e.question || e.text || "").slice(0, 40) + ")");
            }
        }
        for (const field of optionalField) {
            if (e[field] === undefined || e[field] === null || e[field] === "") optionalEmpty++;
        }
        // Champ `infos` (encart d'information de phrase) : optionnel, structure validée si présent
        if (e.infos !== undefined && e.infos !== null) {
            infosCount++;
            const inf = e.infos;
            if (!Array.isArray(inf) || inf.length == 0 || inf.some(line => typeof line != "string" || line.trim() == "")) {
                err(`entrée avec "infos" invalide (doit être un tableau de textes non vides) : ${String(e.text || e.question || "").slice(0, 40)}`);
            }
        }
        if (gamemode === "picolo" || gamemode === "war") {
            if (e.type !== undefined && e.type != e.type) err(`type non string (t${typeof e.type})`);
        }
        if (gamemode === "maillon_faible") {
            const d = parseInt(e.difficulty, 10);
            if (isNaN(d) || d < 1 || d > 4) missingField.add(`difficulty hors 1-4 (${e.difficulty})`);
        }
    }
    const uniqueMissing = [...missingField].slice(0, 10).join(", ");
    if (uniqueMissing) err(`champs requis absents/vides : ${uniqueMissing}`);
    else console.log("  champs obligatoires présents.");
    if (optionalEmpty > 0 && optionalField.length) {
        console.log(`  avertissement : ${optionalEmpty} entrée(s) avec champ optionnel "${optionalField[0]}" vide.`);
    }
    if (infosCount > 0) {
        console.log(`  ${infosCount} entrée(s) avec encart "infos" (structure valide).`);
    }

    if (gamemode === "maillon_faible") {
        const dup = db.length - new Set(db.map(q => q.question)).size;
        if (dup > 0) err(`${dup} question(s) en double`);
    }

    if (gamemode !== "picolo" && gamemode !== "war") {
        // --- 2) Schéma simple : contrôle des doublons de texte (JNJ) / pas de filters ---
        console.log("");
        console.log("2) DOUBLONS");
        const keyFn = (e) => (gamemode === "question_pour_un_champion" ? e.question + "\u0000" + e.reponse : (e.text || e.question));
        const set = new Set();
        let dup = 0;
        for (const e of db) { const k = keyFn(e); if (set.has(k)) dup++; else set.add(k); }
        console.log(dup === 0 ? "  aucun doublon." : `  ${dup} doublon(s) (clé ${gamemode === "question_pour_un_champion" ? "question+reponse" : "texte/question"})`);
        console.log("");
        console.log("3) RAPPEL schéma (moteur)");
        const schema = {
            "je_n_ai_jamais": "db : [{text, infos?}]",
            "maillon_faible": "db : [{question, reponse, difficulty(1-4)}]",
            "question_pour_un_champion": "db : [{series, type, question, reponse, points?}]"
        }[gamemode] || "db : [{text}]";
        console.log(`  ${schema}`);
        printErrors(errors);
        return;
    }

    // --- 2) Couverture filters vs db (picolo/war) ---
    const filters = pack.filters || [];
    console.log("2) COUVERTURE filters vs db");
    const dbTypes = new Set(db.map((e) => String(e.type)));
    const filterTypes = new Set(filters.map((f) => String(f.type)));
    const missingInDb = [...filterTypes].filter((t) => !dbTypes.has(t));
    const orphanFilterTypes = [...dbTypes].filter((t) => !filterTypes.has(t));
    if (missingInDb.length) err(`types filters sans phrases : ${missingInDb.join(", ")}`);
    if (orphanFilterTypes.length) err(`types de phrases non référencés dans filters : ${orphanFilterTypes.join(", ")}`);
    console.log(`  types filters sans phrases dans la db : ${missingInDb.length ? missingInDb.join(", ") : "aucun"}`);
    console.log(`  types de phrases non référencés dans filters : ${orphanFilterTypes.length ? orphanFilterTypes.join(", ") : "aucun"}`);
    console.log("");

    // --- 3) Distribution types + tokens ---
    console.log("3) DISTRIBUTION par type");
    const byType = {};
    for (const e of db) {
        const t = String(e.type);
        const b = (byType[t] = byType[t] || { n: 0, t: 0, s: 0, dollar: 0, nb: {} });
        b.n++;
        if (e.text.includes("%t")) b.t++;
        if (e.text.includes("%s")) b.s++;
        if (e.text.includes("$")) b.dollar++;
        b.nb[e.nb_players] = (b.nb[e.nb_players] || 0) + 1;
    }
    for (const [t, b] of Object.entries(byType)) {
        const minPlayers = filters.filter((f) => String(f.type) == t).map((f) => Math.min(...f.player_count));
        const maxPlayers = filters.filter((f) => String(f.type) == t).map((f) => Math.max(...f.player_count));
        console.log(`  type ${t.padEnd(3)} n=${b.n.toString().padEnd(4)} %t=${b.t.toString().padEnd(4)} %s=${b.s.toString().padEnd(4)} $=${b.dollar.toString().padEnd(4)} nb_players={${Object.entries(b.nb).map(([k, v]) => `${k}:${v}`).join(", ")}}${minPlayers.length ? ` joueurs filter:min${Math.min(...minPlayers)}-max${Math.max(...maxPlayers)}` : ""}`);
    }
    console.log("");

    // --- 4) Phrases-suite (key != "") : clés orphelines / buckets manquants ---
    console.log("4) PHRASES-SUITE (key != \"\")");
    const keyed = db.filter((e) => e.key && e.key !== "");
    if (keyed.length == 0) {
        console.log("  aucune phrase-suite.");
    } else {
        let orphans = 0;
        let bucket0Missing = 0;
        let incompat = 0;
        for (const e of keyed) {
            const fups = db.filter((x) => String(x.type) == String(e.type) && x.parent_key == e.key);
            if (fups.length == 0) { orphans++; console.log(`  ORPHELIN : parent t${e.type} key="${e.key}" (aucune suite) | ${e.text.slice(0, 60)}`); continue; }
            if (!fups.some((x) => x.nb_players == "0")) bucket0Missing++;
            // Une suite "jamais jouable" n'est un vrai souci que si le parent lui-meme est
            // atteignable a ce nombre de joueurs ; sinon la chaine ne se declenche jamais
            // (faux positif, ex. cyclop-silly : parent nb=3 et suites nb=3).
            for (let p = 2; p <= 4; p++) {
                if (parseInt(e.nb_players, 10) > p) continue;
                const fupNbs = new Set(fups.map((x) => x.nb_players));
                if (![...fupNbs].some((n) => parseInt(n) <= p)) {
                    incompat++;
                    if (incompat <= 5) console.log(`  INCOMPAT ? parent t${e.type} key="${e.key}" nb=${e.nb_players} suites nb=${[...fupNbs].join(",")} (parent jouable a ${p} joueurs, aucune suite jouable)`);
                    break;
                }
            }
        }
        if (orphans) err(`${orphans} clé(s) orpheline(s)`);
        console.log(`  parents avec suite : ${keyed.length}`);
        console.log(`  clés orphelines : ${orphans}`);
        console.log(`  suites sans variante nb_players=0 (cause de l'ancien crash getSentenceByKey) : ${bucket0Missing}`);
        console.log(`  suites jamais jouables (2-4 joueurs) : ${incompat}`);
    }
    console.log("");

    // --- 5) Rappel du schema attendu par le moteur ---
    console.log("5) RAPPEL schéma (moteur picolito.js)");
    console.log("  filters : [{type, player_count[], color: blue|green|yellow|red}]");
    console.log("  db      : [{type, text, key, parent_key, nb_players, language, infos?}]");
    console.log("  infos   : optionnel, encart d'information de phrase (string[] non vide, <= 8 lignes affichées)");
    console.log("  nb_players  : 0..N (joueurs impliqués) — la phrase est jouable si nb_players <= joueurs en partie, ");
    console.log("                la suite s'obtient par la clé dans les memes buckets 0..joueurs.");

    if (errors.length) exitCode = 1;
    printErrors(errors);
}

// ---------- Packs `schema: 2` ----------
// Tout ce qui règle le tirage vit dans le catalogue (types.js) : un pack ne fournit que des cartes.
// D'où des listes fermées de champs, qui refusent famille, poids, couleur, filters, anciens champs…
const SCHEMA2_HEADER_FIELDS = new Set(["schema", "id", "gamemode", "language", "version", "experimental", "pack_name", "pack_description", "db"]);
const SCHEMA2_CARD_FIELDS = new Set(["id", "type", "text", "suites", "joueurs", "infos"]);
const SCHEMA2_SUITE_FIELDS = new Set(["text", "offset_min", "offset_max"]);
const SCHEMA2_GAMEMODES = ["picolo", "war", "je_n_ai_jamais"];

function playerNumbers(text) {
    return new Set([...String(text).matchAll(/%(\d+)/g)].map((m) => Number(m[1])));
}

function auditSchema2(pack, err) {
    const db = Array.isArray(pack.db) ? pack.db : [];
    console.log("1) EN-TÊTE");
    const extraHeader = Object.keys(pack).filter((k) => !SCHEMA2_HEADER_FIELDS.has(k));
    if (extraHeader.length) err(`champs d'en-tête non autorisés : ${extraHeader.join(", ")} (le tirage se règle dans src/js/types.js, pas dans un pack)`);
    if (!SCHEMA2_GAMEMODES.includes(pack.gamemode)) err(`gamemode « ${pack.gamemode} » non géré par le schema 2 (${SCHEMA2_GAMEMODES.join(", ")})`);
    const m = model.PACK_ID_PATTERN.exec(String(pack.id));
    if (!m || m[2] !== "2") err(`id « ${pack.id} » : format attendu {picolo|je_n_ai_jamais}_{famille}_v2_{langue}`);
    else if (m[3] !== pack.language) err(`id « ${pack.id} » : langue ${m[3]} ≠ champ language ${pack.language}`);
    if (!Number.isInteger(pack.version) || pack.version < 1) err(`version : entier ≥ 1 attendu (${JSON.stringify(pack.version)})`);
    if (pack.experimental !== undefined && typeof pack.experimental !== "boolean") err("experimental : booléen attendu");
    for (const k of ["pack_name", "pack_description"]) if (typeof pack[k] !== "string" || pack[k].trim() === "") err(`${k} : texte non vide attendu`);
    if (!Array.isArray(pack.db) || db.length === 0) err("db : liste de cartes non vide attendue");
    console.log(`  famille de pack : ${model.packFamilyFromId(pack.id) ?? "?"}${pack.experimental ? " | expérimental" : ""}`);

    console.log("2) CARTES");
    const family = model.packFamilyFromId(pack.id);
    const idPattern = family ? new RegExp("^" + family + "_\\d{4}$") : null;
    const seenIds = new Set();
    const seenTexts = new Set();
    let dupTexts = 0;
    const byType = {};
    for (const [i, card] of db.entries()) {
        const where = `carte ${card && card.id ? card.id : "#" + i}`;
        if (!card || typeof card !== "object") { err(`${where} : objet attendu`); continue; }
        const extra = Object.keys(card).filter((k) => !SCHEMA2_CARD_FIELDS.has(k));
        if (extra.length) err(`${where} : champs non autorisés ${extra.join(", ")}`);
        // id
        if (typeof card.id !== "string" || (idPattern && !idPattern.test(card.id))) err(`${where} : id attendu au format ${family}_0000`);
        else if (seenIds.has(card.id)) err(`${where} : id en double`);
        else if (RETIRED_IDS.has(card.id)) err(`${where} : id retiré (tests/tools/retired_ids.json), jamais réutilisé`);
        seenIds.add(card.id);
        // type
        const def = model.CARD_TYPES[card.type];
        if (!def) { err(`${where} : type inconnu « ${card.type} »`); continue; }
        if (pack.gamemode === "je_n_ai_jamais" && card.type !== "collectif_bois_si") err(`${where} : un pack Je n'ai jamais ne contient que des cartes collectif_bois_si`);
        byType[card.type] = (byType[card.type] || 0) + 1;
        // texte et tokens
        if (typeof card.text !== "string" || card.text.trim() === "") { err(`${where} : text non vide attendu`); continue; }
        if (seenTexts.has(card.text)) dupTexts++;
        seenTexts.add(card.text);
        const suites = card.suites === undefined ? [] : card.suites;
        if (!Array.isArray(suites)) { err(`${where} : suites doit être une liste`); continue; }
        if (suites.length > 1) err(`${where} : une seule suite par carte pour l'instant (${suites.length})`);
        const suiteTexts = [];
        for (const [j, s] of suites.entries()) {
            const sw = `${where}, suite ${j + 1}`;
            if (!s || typeof s !== "object") { err(`${sw} : objet attendu`); continue; }
            const extraS = Object.keys(s).filter((k) => !SCHEMA2_SUITE_FIELDS.has(k));
            if (extraS.length) err(`${sw} : champs non autorisés ${extraS.join(", ")}`);
            const texts = typeof s.text === "string" ? [s.text] : Array.isArray(s.text) ? s.text : null;
            if (!texts || texts.length === 0 || texts.some((t) => typeof t !== "string" || t.trim() === "")) err(`${sw} : text = texte ou liste de textes non vides`);
            else suiteTexts.push(...texts);
            const min = s.offset_min ?? def.suite_offset.min, max = s.offset_max ?? def.suite_offset.max;
            for (const k of ["offset_min", "offset_max"]) if (s[k] !== undefined && (!Number.isInteger(s[k]) || s[k] < 1)) err(`${sw} : ${k} entier ≥ 1 attendu`);
            if (Number.isInteger(min) && Number.isInteger(max) && min > max) err(`${sw} : offset_min (${min}) > offset_max (${max})`);
        }
        const allTexts = [card.text, ...suiteTexts];
        for (const t of allTexts) {
            if (/%s/.test(t)) err(`${where} : token %s de l'ancien format (utiliser %1, %2…) : « ${t.slice(0, 50)} »`);
            const bad = t.match(/%(?![0-9t])[A-Za-z]/g);
            if (bad) err(`${where} : token inconnu ${[...new Set(bad)].join(" ")}`);
            if (/%t/.test(t) && pack.gamemode !== "war") err(`${where} : %t (équipe) seulement dans un pack de gamemode war`);
        }
        const mainNums = playerNumbers(card.text);
        const all = new Set(allTexts.flatMap((t) => [...playerNumbers(t)]));
        const max = Math.max(0, ...all);
        for (let n = 1; n <= max; n++) if (!all.has(n)) { err(`${where} : %${n} manquant alors que %${max} est utilisé (numéroter les joueurs à partir de %1, sans trou)`); break; }
        for (const t of suiteTexts) for (const n of playerNumbers(t)) if (!mainNums.has(n)) err(`${where} : la suite utilise %${n}, absent de la carte`);
        if (card.joueurs !== undefined && (!Number.isInteger(card.joueurs) || card.joueurs < max)) err(`${where} : joueurs entier ≥ ${max} (plus grand %N) attendu`);
        if (card.infos !== undefined && (!Array.isArray(card.infos) || card.infos.length === 0 || card.infos.some((l) => typeof l !== "string" || l.trim() === ""))) err(`${where} : infos = liste de lignes non vides`);
    }
    const normalized = model.normalizePack(pack);
    for (const p of normalized.problems) err(`conversion : ${p}`);
    console.log(`  ${db.length} carte(s), ${normalized.cards.length} convertie(s) | avec suite : ${normalized.cards.filter((c) => c.suites.length).length}${dupTexts ? ` | avertissement : ${dupTexts} texte(s) en double` : ""}`);
    const byFamily = {};
    for (const c of normalized.cards) byFamily[c.family] = (byFamily[c.family] || 0) + 1;
    console.log(`  par famille : ${Object.entries(byFamily).map(([f, n]) => `${f} ${n}`).join(", ") || "-"}`);
    console.log(`  par type    : ${Object.entries(byType).map(([t, n]) => `${t} ${n}`).join(", ") || "-"}`);
    const players = {};
    for (const c of normalized.cards) players[c.players] = (players[c.players] || 0) + 1;
    console.log(`  joueurs requis : ${Object.entries(players).map(([p, n]) => `${p}:${n}`).join(", ")}`);
}

// Chaque langue d'une même famille de pack schema 2 doit avoir exactement les mêmes cartes que le
// français (mêmes id, même type, même nombre de suites, mêmes joueurs) : les traductions ne dérivent plus.
function auditSchema2Parity() {
    const groups = new Map();
    for (const { file, pack } of schema2Packs) {
        const key = `${pack.gamemode}:${model.packFamilyFromId(pack.id)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({ file, pack });
    }
    if (groups.size === 0) return;
    console.log("== Parité des langues (schema 2) ==");
    for (const [key, list] of groups) {
        const ref = list.find((x) => x.pack.language === "fr") || list[0];
        const describe = (pack) => new Map((pack.db || []).map((c) => [c.id, `${c.type}|${(c.suites || []).length}|${c.joueurs ?? Math.max(0, ...[c.text, ...(c.suites || []).flatMap((s) => [].concat(s.text))].map((t) => model.maxPlayerToken(t)))}`]));
        const refMap = describe(ref.pack);
        const problems = [];
        for (const other of list) {
            if (other === ref) continue;
            const map = describe(other.pack);
            const lang = other.pack.language;
            const missing = [...refMap.keys()].filter((id) => !map.has(id));
            const extra = [...map.keys()].filter((id) => !refMap.has(id));
            const differ = [...refMap.keys()].filter((id) => map.has(id) && map.get(id) !== refMap.get(id));
            if (missing.length) problems.push(`${lang} : ${missing.length} carte(s) absente(s) (${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""})`);
            if (extra.length) problems.push(`${lang} : ${extra.length} carte(s) en trop (${extra.slice(0, 5).join(", ")}${extra.length > 5 ? "…" : ""})`);
            if (differ.length) problems.push(`${lang} : ${differ.length} carte(s) dont le type, les suites ou les joueurs diffèrent de ${ref.pack.language} (${differ.slice(0, 5).join(", ")}${differ.length > 5 ? "…" : ""})`);
        }
        const langs = list.map((x) => x.pack.language).sort().join(", ");
        if (problems.length) {
            for (const p of problems) { console.log(`  ERREUR ${key} : ${p}`); globalErrors++; }
            exitCode = 1;
        } else {
            console.log(`  ${key} : ${list.length} langue(s) (${langs}), ${refMap.size} carte(s), identiques à ${ref.pack.language}.`);
        }
    }
    console.log("");
}

function printErrors(errors) {
    if (errors.length) {
        console.log("");
        console.log("ERREURS :");
        for (const e of errors) console.log(`  - ${e}`);
        console.log("");
    }
}

for (const f of files) {
    try {
        audit(f);
    } catch (e) {
        console.error(`== ${f} ==\nERREUR d'exécution : ${e.message}`);
        globalErrors++;
        exitCode = 1;
    }
}

auditSchema2Parity();

console.log(`[bilan] packs audités : ${files.length} | erreurs : ${globalErrors}`);
process.exit(exitCode);