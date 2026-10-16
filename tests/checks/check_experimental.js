#!/usr/bin/env node
// Packs expérimentaux (docs/dev/reflexion/refonte_des_bases.md §6.1) : un pack réécrit est livré à côté
// de l'ancien avec "experimental": true, et n'apparaît que si le réglage show_experimental_packs est activé.
// Vérifie :
//   - le réglage : enregistré (SETTINGS_SCHEMA), désactivé par défaut ;
//   - concordance du champ experimental entre VANILLA_DB_INDEX (catalog.js) et le fichier du pack ;
//   - DBManager.getAll() : packs expérimentaux cachés réglage désactivé, visibles activé, filtre de langue conservé ;
//   - le champ experimental survit à la mise à jour du catalogue après téléchargement ;
//   - le badge « Expérimental » ;
//   - désactiver le réglage retire un pack expérimental déjà coché dans le Mix.
// Sortie : une ligne « OK : … » par assertion, arrêt (exit 1) sur le premier échec.
"use strict";

const fs = require("fs");
const path = require("path");
const { loadApp, buildGame } = require("../_harness.js");

const ROOT = path.join(__dirname, "..", "..");
function ok(label) { console.log(`OK : ${label}`); }
function fail(label) { console.log(`ERREUR : ${label}`); process.exit(1); }
function check(cond, label) { if (cond) ok(label); else fail(label); }

loadApp();
globalThis.updateHTMLSettingsByVar = () => {};
defaultVariables();

// ---- Réglage ----
const entry = SETTINGS_SCHEMA.find((e) => e.key === "show_experimental_packs");
check(entry && entry.type === "boolean" && entry.default === false && entry.path.join(".") === "game.show_experimental_packs", "réglage show_experimental_packs enregistré, désactivé par défaut");
check(game.show_experimental_packs === false, "valeur par défaut du jeu : désactivé");

// ---- Concordance catalogue <-> fichiers ----
const mismatches = [];
let experimentalCount = 0;
for (const db of VANILLA_DB_INDEX) {
    const file = path.join(ROOT, db.url);
    if (!fs.existsSync(file)) { mismatches.push(`${db.id} : fichier ${db.url} introuvable`); continue; }
    const pack = JSON.parse(fs.readFileSync(file, "utf8"));
    if ((db.experimental === true) !== (pack.experimental === true)) mismatches.push(`${db.id} : catalogue ${db.experimental === true} / fichier ${pack.experimental === true}`);
    if (pack.experimental === true) experimentalCount++;
}
check(mismatches.length === 0, mismatches.length ? `champ experimental différent : ${mismatches.join(" ; ")}` : `champ experimental identique dans catalog.js et les fichiers (${VANILLA_DB_INDEX.length} packs, ${experimentalCount} expérimental(aux))`);

// ---- Filtre ----
buildGame({ packs: [] });
global.current_language_strings.experimental_badge = "Expérimental";
Object.assign(game, { only_display_current_language_databases: true, show_experimental_packs: false, mix_gamemode_list_picolo: [] });
DBManager.catalog = [
    { id: "picolo_bar_fr", language: "fr", gamemode: "picolo", source: "vanilla" },
    { id: "picolo_bar_v2_fr", language: "fr", gamemode: "picolo", source: "vanilla", experimental: true },
    { id: "picolo_bar_v2_en", language: "en", gamemode: "picolo", source: "vanilla", experimental: true }
];
const ids = () => DBManager.getAll().map((d) => d.id).join(",");
check(ids() === "picolo_bar_fr", "réglage désactivé : pack expérimental caché");
game.show_experimental_packs = true;
check(ids() === "picolo_bar_fr,picolo_bar_v2_fr", "réglage activé : pack expérimental visible, filtre de langue conservé");
game.only_display_current_language_databases = false;
check(ids() === "picolo_bar_fr,picolo_bar_v2_fr,picolo_bar_v2_en", "toutes langues : tous les packs");

DBManager.updateIndexAfterDownload({ id: "picolo_bar_v2_fr", url: "x", source: "vanilla" }, { id: "picolo_bar_v2_fr", version: 2, gamemode: "picolo", language: "fr", experimental: true });
check(DBManager.getById("picolo_bar_v2_fr", "vanilla").experimental === true, "champ experimental conservé après téléchargement");

check(getExperimentalBadgeHTML({ experimental: true }).includes("Expérimental") && getExperimentalBadgeHTML({}) === "", "badge « Expérimental » seulement sur un pack expérimental");

// ---- Mix : désactiver le réglage retire un pack expérimental déjà coché ----
globalThis.storeSettingsCookie = () => {};
globalThis.refreshDBList = () => {};
game.mix_gamemode_list_picolo = [{ pack_id: "picolo_bar_fr", pack_source: "vanilla" }, { pack_id: "picolo_bar_v2_fr", pack_source: "vanilla" }];
document.getElementById("input_show_experimental_packs").checked = false;
showExperimentalPacks();
check(game.show_experimental_packs === false && game.mix_gamemode_list_picolo.map((e) => e.pack_id).join(",") === "picolo_bar_fr", "réglage désactivé : pack expérimental retiré de la sélection du Mix");
