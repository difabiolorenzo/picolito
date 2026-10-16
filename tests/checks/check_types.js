#!/usr/bin/env node
// Cohérence du catalogue des types et des familles (src/js/types.js, voir
// docs/dev/reflexion/refonte_des_bases.md §5).
// Vérifie :
//   - familles : probabilités entières qui totalisent 100, clé i18n, réglages référencés existants ;
//   - types : famille connue, joueurs minimum, poids, décalage par défaut des suites, réglage existant ;
//   - chaque famille a au moins un type et ses couleurs dans src/css/main.css ;
//   - anciens packs : chaque type utilisé dans src/db/picolo (toutes langues) a un nouveau type connu.
// Sortie : une ligne « OK : … » par assertion, arrêt (exit 1) sur le premier échec.
"use strict";

const fs = require("fs");
const path = require("path");
const { loadApp } = require("../_harness.js");

const ROOT = path.join(__dirname, "..", "..");

function ok(label) { console.log(`OK : ${label}`); }
function fail(label) { console.log(`ERREUR : ${label}`); process.exit(1); }
function check(cond, label) { if (cond) ok(label); else fail(label); }

loadApp();
// Réglages par défaut réels (main.js) ; la mise à jour de l'interface n'est pas simulée par le harnais.
globalThis.updateHTMLSettingsByVar = () => {};
defaultVariables();
resetVariables(); // compteurs de partie (chug_remaining, virus_remaining)
const settings = game.picolito;

// ---- Familles ----
const families = Object.keys(FAMILIES);
const total = families.reduce((s, f) => s + FAMILIES[f].probability, 0);
check(families.every((f) => Number.isInteger(FAMILIES[f].probability) && FAMILIES[f].probability >= 0), "probabilités des familles entières et positives");
check(total === 100, `probabilités des familles : total ${total} = 100`);
check(families.every((f) => FAMILIES[f].label_key === "family_" + f), "clé i18n family_<famille> pour chaque famille");
for (const f of families) {
    const def = FAMILIES[f];
    for (const key of ["enabled_setting", "min_cycle_setting", "counter"]) {
        if (def[key] !== undefined) check(def[key] in settings, `famille ${f} : réglage ${key} = game.picolito.${def[key]} existe`);
    }
}
check(new Set(families.map((f) => FAMILIES[f].order)).size === families.length, "ordre des familles sans doublon");

// Affichage : chaque famille a ses couleurs (src/css/main.css) — fond, liste des phrases, mode sombre.
const css = fs.readFileSync(path.join(ROOT, "src", "css", "main.css"), "utf8");
for (const f of families) {
    const missing = [`--family_${f}:`, `--family_${f}_dark:`, `div#picolito.family-${f} {`, `.sentence-list-family-${f} {`, `div#picolito.dark_affected.family-${f} div#ingame_sentence`]
        .filter((sel) => !css.includes(sel));
    check(missing.length === 0, missing.length ? `famille ${f} : CSS manquant ${missing.join(", ")}` : `famille ${f} : couleurs CSS (fond, liste, mode sombre)`);
}

// ---- Types ----
const types = Object.keys(CARD_TYPES);
for (const t of types) {
    const def = CARD_TYPES[t];
    const problems = [];
    if (!/^[a-z]+(_[a-z]+)+$/.test(t)) problems.push("nom (minuscules, mots séparés par _)");
    if (!FAMILIES[def.family]) problems.push(`famille inconnue « ${def.family} »`);
    else if (!t.startsWith(def.family + "_") && t !== def.family) problems.push(`nom ne commençant pas par sa famille « ${def.family} »`);
    if (!Number.isInteger(def.min_players) || def.min_players < 0) problems.push("min_players");
    if (!(typeof def.weight === "number" && def.weight > 0)) problems.push("weight");
    const o = def.suite_offset;
    if (!o || !Number.isInteger(o.min) || !Number.isInteger(o.max) || o.min < 1 || o.min > o.max) problems.push("suite_offset");
    if (def.setting !== undefined && typeof settings[def.setting] !== "boolean") problems.push(`réglage game.picolito.${def.setting} absent`);
    check(problems.length === 0, problems.length ? `type ${t} : ${problems.join(", ")}` : `type ${t} (${def.family})`);
}
for (const f of families) check(getTypesOfFamily(f).length > 0, `famille ${f} : ${getTypesOfFamily(f).length} type(s)`);
check(JSON.stringify(defaultFamilyProbability()) === JSON.stringify(Object.fromEntries(families.map((f) => [f, FAMILIES[f].probability]))), "defaultFamilyProbability() reprend les probabilités du catalogue");

// ---- Correspondance des anciens packs ----
check(Object.values(LEGACY_TYPE_MAP).every((t) => CARD_TYPES[t]), "table ancien type -> nouveau type : cibles toutes connues");
check(Object.values(LEGACY_TYPE_MAP_BY_PACK).every((m) => Object.values(m).every((t) => CARD_TYPES[t])), "corrections par pack : cibles toutes connues");
check(packFamilyFromId("picolo_bar_fr") === "bar" && packFamilyFromId("picolo_bar_v2_fr") === "bar" && packFamilyFromId("picolo_war_fr") === "war"
    && packFamilyFromId("je_n_ai_jamais_party_fr") === "party" && packFamilyFromId("je_n_ai_jamais_party_v2_fr") === "party"
    && packFamilyFromId("question_pour_un_champion_fr") === null && packFamilyFromId("x") === null, "famille de pack déduite de l'identifiant");
check(legacyTypeToCardType(4, "picolo_bar_fr") === "manche_jeu" && legacyTypeToCardType("4", "picolo_default_fr") === "manche_categorie", "type 4 : manche_jeu dans bar, manche_categorie ailleurs");

const dir = path.join(ROOT, "src", "db", "picolo");
const unmapped = [];
let cards = 0;
const perFamily = {};
for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
    const pack = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
    if (pack.schema === 2) continue;
    for (const entry of pack.db || []) {
        cards++;
        const t = legacyTypeToCardType(entry.type, pack.id);
        if (!t) unmapped.push(`${name} : type ${entry.type}`);
        else perFamily[CARD_TYPES[t].family] = (perFamily[CARD_TYPES[t].family] || 0) + 1;
    }
}
check(unmapped.length === 0, unmapped.length ? `anciens types sans correspondance : ${[...new Set(unmapped)].slice(0, 10).join(" ; ")}` : `${cards} cartes d'anciens packs, toutes avec un nouveau type`);
console.log("Répartition des anciens packs par famille : " + families.map((f) => `${f} ${perFamily[f] || 0}`).join(", "));
