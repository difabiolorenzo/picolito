#!/usr/bin/env node
// Lance toutes les vérifications du projet et affiche un bilan.
// Usage : node tests/run_all.js        (code de sortie != 0 si un check échoue)

"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const CHECKS = [
    ["Ordre des scripts (index.html ≡ sw.js)", null],
    ["Identifiants HTML/JS/CSS", ["tests/checks/check_ids.js"]],
    ["Parité des 14 dictionnaires", ["tests/checks/check_langs.js"]],
    ["Audit de tous les packs", ["tests/checks/check_pack.js", "--all"]],
    ["Sanitisation XSS", ["tests/checks/check_sanitize.js"]],
    ["Échappement du token $", ["tests/checks/check_token_escape.js"]],
    ["Encart d'information", ["tests/checks/check_infos.js"]],
    ["Joueurs / équipes", ["tests/checks/smoke_player_teams.js"]],
    ["Originalité des packs réécrits", ["tests/checks/check_originality.js", "--all"]],
    ["Tirage seedé (rng)", ["tests/checks/check_rng.js"]],
    ["Catalogue des types et familles", ["tests/checks/check_types.js"]],
    ["Format schema 2 et modèle de cartes", ["tests/checks/check_cards.js"]],
    ["Remplissage des joueurs (%1, suites)", ["tests/checks/check_fill.js"]],
];

// Les scripts locaux de index.html doivent être pré-cachés par sw.js, dans le même ordre.
function checkScriptOrder() {
    const html = fs.readFileSync(path.join(root, "index.html"), "utf8")
        .replace(/<!--[\s\S]*?-->/g, "");
    const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
    const scripts = [...html.matchAll(/<script[^>]*src="\.\/([^"]+)"/g)].map((m) => m[1]);
    const precache = [...sw.matchAll(/"\.\/(src\/js\/[^"]+)"/g)].map((m) => m[1]);
    if (scripts.join("|") === precache.join("|")) return { ok: true };
    const missing = scripts.filter((s) => !precache.includes(s));
    const extra = precache.filter((s) => !scripts.includes(s));
    let detail = "ordre différent";
    if (missing.length) detail = "absents de PRECACHE : " + missing.join(", ");
    if (extra.length) detail += " ; en trop dans PRECACHE : " + extra.join(", ");
    return { ok: false, detail };
}

let failures = 0;
for (const [label, args] of CHECKS) {
    let ok, detail = "";
    if (args === null) {
        ({ ok, detail = "" } = checkScriptOrder());
    } else {
        const r = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
        ok = r.status === 0;
        if (!ok) detail = ((r.stdout || "") + (r.stderr || "")).trim().split("\n").slice(-5).join("\n      ");
    }
    console.log(`${ok ? "OK    " : "ÉCHEC "} ${label}${detail ? "\n      " + detail : ""}`);
    if (!ok) failures++;
}
console.log(failures ? `\n${failures} vérification(s) en échec.` : "\nTout est vert.");
process.exit(failures ? 1 : 0);
