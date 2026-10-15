#!/usr/bin/env node
// Donne le ou les prochains identifiants de carte libres d'une famille de pack (packs `schema: 2`).
// Format d'un id : <famille>_<numéro sur 4 chiffres>, par exemple bar_0042
// (voir docs/dev/reflexion/refonte_des_bases.md §4.6.5).
//
// Usage :
//   node tests/tools/next_id.js <famille> [nombre]
//   node tests/tools/next_id.js bar          ->  bar_0043
//   node tests/tools/next_id.js bar 5        ->  bar_0043 … bar_0047
//
// Le prochain numéro suit le plus grand numéro déjà utilisé par cette famille, toutes langues
// confondues, en comptant les ids retirés (tests/tools/retired_ids.json) : un id n'est jamais réutilisé.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const DB_DIR = path.join(ROOT, "src", "db");
const RETIRED = path.join(__dirname, "retired_ids.json");

const [family, countArg] = process.argv.slice(2);
if (!family || !/^[a-z][a-z0-9]*$/.test(family)) {
    console.error("Usage : node tests/tools/next_id.js <famille> [nombre]   (famille en minuscules, ex. bar)");
    process.exit(1);
}
const count = countArg === undefined ? 1 : Number(countArg);
if (!Number.isInteger(count) || count < 1) { console.error("Le nombre doit être un entier ≥ 1."); process.exit(1); }

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (e.name.endsWith(".json")) out.push(p);
    }
    return out;
}

const pattern = new RegExp("^" + family + "_(\\d{4})$");
let max = 0;
const consider = (id) => {
    const m = pattern.exec(String(id));
    if (m) max = Math.max(max, Number(m[1]));
};

for (const file of walk(DB_DIR)) {
    let pack;
    try { pack = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
    if (pack.schema !== 2) continue;
    for (const card of pack.db || []) consider(card.id);
}
if (fs.existsSync(RETIRED)) {
    for (const id of JSON.parse(fs.readFileSync(RETIRED, "utf8")).ids || []) consider(id);
}

if (max + count > 9999) { console.error(`Plus assez de numéros libres pour la famille « ${family} » (dernier : ${max}).`); process.exit(1); }
for (let i = 1; i <= count; i++) console.log(`${family}_${String(max + i).padStart(4, "0")}`);
