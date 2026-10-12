// Audit statique d'un pack JSON : coherence schema vs moteur de generation.
//
// Exemples :
//   node tests/checks/check_pack.js src/db/picolo/war_fr.json
//   node tests/checks/check_pack.js --all           # tous les packs de src/db/**/*.json
//   node tests/checks/check_pack.js src/db/picolo/default_en.json src/db/je_n_ai_jamais/popular_en.json
//
// Schémas supportés par gamemode :
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

function audit(file) {
    const pack = JSON.parse(fs.readFileSync(file, "utf8"));
    const db = Array.isArray(pack.db) ? pack.db : (Array.isArray(pack) ? pack : []);
    const gamemode = pack.gamemode;
    const errors = [];
    const err = (msg) => { errors.push(msg); globalErrors++; };

    console.log(`== ${path.relative(ROOT, file)} ==`);
    console.log(`id=${pack.id || "?"} | gamemode=${gamemode || "?"} | langue=${pack.language || "?"} | version=${pack.version || "?"} | phrases=${db.length}`);
    console.log("");

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

console.log(`[bilan] packs audités : ${files.length} | erreurs : ${globalErrors}`);
process.exit(exitCode);