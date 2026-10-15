#!/usr/bin/env node
// Modèle interne des cartes et format `schema: 2` (src/js/cards.js, tests/checks/check_pack.js ;
// voir docs/dev/reflexion/refonte_des_bases.md §4.6 et §5.8).
// Vérifie :
//   1. la conversion de tous les anciens packs (Picolo, Guerre, Je n'ai jamais) vers le modèle :
//      aucune carte perdue, suites rattachées, décalages par défaut du type ;
//   2. la conversion du pack d'exemple tests/fixtures/picolo_exemple_v2_*.json ;
//   3. que check_pack.js accepte le pack d'exemple (français + anglais identiques) et refuse un pack
//      invalide et une traduction incomplète.
// Sortie : une ligne « OK : … » par assertion, arrêt (exit 1) sur le premier échec.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { loadApp } = require("../_harness.js");

const ROOT = path.join(__dirname, "..", "..");
const FIXTURES = path.join(ROOT, "tests", "fixtures");

function ok(label) { console.log(`OK : ${label}`); }
function fail(label) { console.log(`ERREUR : ${label}`); process.exit(1); }
function check(cond, label) { if (cond) ok(label); else fail(label); }
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

loadApp();

// ---- 1. Anciens packs ----
let packs = 0, cards = 0, suites = 0, alternatives = 0;
const problems = [];
for (const dir of ["picolo", "je_n_ai_jamais"]) {
    const full = path.join(ROOT, "src", "db", dir);
    for (const name of fs.readdirSync(full).filter((n) => n.endsWith(".json")).sort()) {
        const pack = read(path.join(full, name));
        if (pack.schema === 2) continue;
        const res = normalizePack(pack);
        packs++;
        problems.push(...res.problems.map((p) => `${name} : ${p}`));
        const expectedMains = dir === "je_n_ai_jamais" ? pack.db.length : pack.db.filter((e) => !e.parent_key).length;
        const expectedAlts = dir === "je_n_ai_jamais" ? 0 : pack.db.filter((e) => e.parent_key).length;
        const gotAlts = res.cards.reduce((s, c) => s + c.suites.reduce((t, su) => t + su.texts.length, 0), 0);
        if (res.cards.length !== expectedMains || gotAlts !== expectedAlts) fail(`${name} : ${res.cards.length}/${expectedMains} cartes, ${gotAlts}/${expectedAlts} variantes de suite`);
        if (res.cards.some((c) => !CARD_TYPES[c.type] || c.family !== CARD_TYPES[c.type].family)) fail(`${name} : type ou famille invalide`);
        cards += res.cards.length;
        suites += res.cards.filter((c) => c.suites.length).length;
        alternatives += gotAlts;
    }
}
check(problems.length === 0, problems.length ? `problèmes de conversion : ${problems.slice(0, 5).join(" ; ")}` : `${packs} anciens packs convertis sans problème`);
ok(`${cards} cartes, dont ${suites} avec suite (${alternatives} variantes de suite) : aucune entrée perdue`);

const def = normalizePack(read(path.join(ROOT, "src", "db", "picolo", "default_fr.json"))).cards;
const virus = def.find((c) => c.type === "regle_joueur" && c.suites.length);
check(virus && virus.suites[0].offset_min === 2 && virus.suites[0].offset_max === 4, "ancienne règle (virus) : suite à 2-4 cartes, comme virus_end_min/max");
const nextCard = def.find((c) => c.family !== "regle" && c.suites.length);
check(nextCard && nextCard.suites[0].offset_min === 1 && nextCard.suites[0].offset_max === 1, "ancienne suite hors règle : carte suivante");
check(def.every((c) => c.legacy === true && /^picolo_default_fr:\d+$/.test(c.id)), "anciennes cartes : legacy et id <pack>:<index>");
const bar = normalizePack(read(path.join(ROOT, "src", "db", "picolo", "bar_fr.json"))).cards;
const barRaw = read(path.join(ROOT, "src", "db", "picolo", "bar_fr.json")).db;
check(bar.filter((c) => barRaw[Number(c.id.split(":")[1])].type == 4).every((c) => c.type === "manche_jeu"), "bar : ancien type 4 -> manche_jeu");
const never = normalizePack(read(path.join(ROOT, "src", "db", "je_n_ai_jamais", "party_fr.json"))).cards;
check(never.every((c) => c.type === "collectif_bois_si" && c.players === 0), "Je n'ai jamais : cartes collectif_bois_si, sans joueur nommé");
check(normalizePack(read(path.join(ROOT, "src", "db", "questions", "maillon_faible", "maillon_faible.json"))).cards.length === 0, "pack de questions : pas de carte (hors modèle)");

// ---- 2. Pack d'exemple schema 2 ----
const ex = normalizePack(read(path.join(FIXTURES, "picolo_exemple_v2_fr.json")));
const byId = Object.fromEntries(ex.cards.map((c) => [c.id, c]));
check(ex.problems.length === 0 && ex.cards.length === 7, "pack d'exemple : 7 cartes converties");
check(byId.exemple_0002.players === 3 && byId.exemple_0002.family === "parole", "joueurs déduits du plus grand %N (exemple_0002 : 3)");
check(byId.exemple_0003.suites[0].offset_min === 2 && byId.exemple_0003.suites[0].offset_max === 4, "suite sans décalage : décalage par défaut du type (règle : 2-4)");
check(byId.exemple_0004.suites[0].offset_min === 5 && byId.exemple_0004.suites[0].offset_max === 8 && byId.exemple_0004.suites[0].texts.length === 2, "suite à variantes et décalage personnalisé (5-8)");
check(byId.exemple_0005.players === 0 && byId.exemple_0007.players === 1 && byId.exemple_0007.infos.length === 1, "carte sans joueur nommé ; champ joueurs ; infos");
check(ex.cards.every((c) => c.legacy === false), "cartes schema 2 : legacy false");

// ---- 3. check_pack.js ----
const checkPack = (...files) => spawnSync(process.execPath, [path.join(ROOT, "tests", "checks", "check_pack.js"), ...files], { encoding: "utf8" });
const good = checkPack(path.join(FIXTURES, "picolo_exemple_v2_fr.json"), path.join(FIXTURES, "picolo_exemple_v2_en.json"));
check(good.status === 0 && /identiques à fr/.test(good.stdout), "check_pack : pack d'exemple accepté, français et anglais identiques");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "picolito-cards-"));
try {
    const bad = {
        schema: 2, id: "picolo_mauvais_v2_fr", gamemode: "picolo", language: "fr", version: 1,
        pack_name: "Mauvais", pack_description: "Pack invalide", filters: [],
        db: [
            { id: "mauvais_0001", type: "action_defi", text: "%s fait un truc", nb_players: "1" },
            { id: "mauvais_0001", type: "type_inconnu", text: "Doublon" },
            { id: "x_1", type: "parole_juge", text: "%2 et %3 se jugent" },
            { id: "mauvais_0004", type: "regle_joueur", text: "%1 a une règle", suites: [{ text: "%2 la termine", offset_min: 4, offset_max: 2 }, { text: "en trop" }] },
            { id: "mauvais_0005", type: "collectif_vote", text: "Équipe %t vote", weight: 3 }
        ]
    };
    const badFile = path.join(tmp, "picolo_mauvais_v2_fr.json");
    fs.writeFileSync(badFile, JSON.stringify(bad));
    const r = checkPack(badFile);
    const expected = [
        "champs d'en-tête non autorisés : filters",
        "champs non autorisés nb_players",
        "token %s de l'ancien format",
        "id en double",
        "type inconnu « type_inconnu »",
        "id attendu au format mauvais_0000",
        "%1 manquant alors que %3 est utilisé",
        "une seule suite par carte",
        "offset_min (4) > offset_max (2)",
        "la suite utilise %2, absent de la carte",
        "%t (équipe) seulement dans un pack de gamemode war",
        "champs non autorisés weight"
    ];
    const missing = expected.filter((e) => !r.stdout.includes(e));
    check(r.status !== 0 && missing.length === 0, missing.length ? `check_pack : erreurs attendues non signalées : ${missing.join(" | ")}` : `check_pack : pack invalide refusé (${expected.length} erreurs attendues signalées)`);

    const en = read(path.join(FIXTURES, "picolo_exemple_v2_en.json"));
    en.db = en.db.filter((c) => c.id !== "exemple_0006");
    en.db.find((c) => c.id === "exemple_0001").type = "action_duel";
    const enFile = path.join(tmp, "picolo_exemple_v2_en.json");
    fs.writeFileSync(enFile, JSON.stringify(en));
    const p = checkPack(path.join(FIXTURES, "picolo_exemple_v2_fr.json"), enFile);
    check(p.status !== 0 && /1 carte\(s\) absente\(s\) \(exemple_0006\)/.test(p.stdout) && /diffèrent de fr \(exemple_0001\)/.test(p.stdout), "check_pack : traduction incomplète ou divergente refusée");
} finally {
    fs.rmSync(tmp, { recursive: true, force: true });
}
