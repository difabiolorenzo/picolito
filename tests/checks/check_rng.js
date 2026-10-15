#!/usr/bin/env node
// Tirage seedé (src/js/rng.js, voir docs/dev/reflexion/systeme_filtres.md §7.7).
// Vérifie :
//   1. qu'aucun fichier de src/js n'appelle Math.random() en dehors de rng.js : un appel oublié
//      casserait la reproductibilité des parties sans que rien ne le signale ;
//   2. que le générateur est déterministe : même graine -> même suite, graine différente -> autre suite ;
//   3. qu'une partie simulée se rejoue à l'identique avec la même graine (Picolo, Je n'ai jamais, Mix).
// Sortie : une ligne « OK : … » par assertion, arrêt (exit 1) sur le premier échec.
"use strict";

const fs = require("fs");
const path = require("path");
const { loadApp, buildGame, stripHtml } = require("../_harness.js");

const ROOT = path.join(__dirname, "..", "..");

function ok(label) { console.log(`OK : ${label}`); }
function fail(label) { console.log(`ERREUR : ${label}`); process.exit(1); }
function check(cond, label) { if (cond) ok(label); else fail(label); }

// 1. Aucun Math.random() hors de rng.js
function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (e.name.endsWith(".js")) out.push(p);
    }
    return out;
}
const offenders = [];
for (const file of walk(path.join(ROOT, "src", "js"))) {
    if (path.basename(file) === "rng.js") continue;
    fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
        if (/Math\.random\s*\(/.test(line)) offenders.push(`${path.relative(ROOT, file).replace(/\\/g, "/")}:${i + 1}`);
    });
}
check(offenders.length === 0, offenders.length ? `Math.random() hors de rng.js : ${offenders.join(", ")}` : "aucun Math.random() hors de src/js/rng.js");

// 2. Déterminisme du générateur
loadApp();
const draw = (seed, n) => { setSeed(seed); return Array.from({ length: n }, () => rng()); };
const a = draw("soiree", 20), b = draw("soiree", 20), c = draw("autre", 20);
check(JSON.stringify(a) === JSON.stringify(b), "même graine : même suite de nombres");
check(JSON.stringify(a) !== JSON.stringify(c), "graine différente : suite différente");
check(a.every((x) => x >= 0 && x < 1), "valeurs dans [0, 1)");
check(draw(42, 3).join() === draw("42", 3).join(), "graine nombre ou texte équivalentes (42 et \"42\")");

// 3. Parties simulées rejouables
function play(files, seed, count = 40) {
    const packs = files.map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8")));
    const game = buildGame({ packs, players: ["Alice", "Bob", "Carl", "Dora"] });
    setSeed(seed);
    const origWarn = console.warn;
    console.warn = () => {};
    const out = [];
    try {
        for (let n = 0; n < count && game.cycle_id + 1 < game.current_gamemode.database_length; n++) {
            incrementCycleID();
            const h = game.sentence_history[game.cycle_id];
            out.push(h ? stripHtml(h.formatted_sentence) : "");
        }
    } finally {
        console.warn = origWarn;
    }
    return out;
}
const scenarios = [
    ["Picolo", ["src/db/picolo/default_fr.json", "src/db/picolo/bar_fr.json"]],
    ["Je n'ai jamais", ["src/db/je_n_ai_jamais/party_fr.json"]],
    ["Mix", ["src/db/picolo/hot_fr.json", "src/db/je_n_ai_jamais/hot_fr.json"]]
];
for (const [label, files] of scenarios) {
    const first = play(files, "replay-test");
    const again = play(files, "replay-test");
    const other = play(files, "autre-graine");
    check(first.length > 0 && JSON.stringify(first) === JSON.stringify(again), `${label} : même graine, même partie (${first.length} cartes)`);
    check(JSON.stringify(first) !== JSON.stringify(other), `${label} : graine différente, partie différente`);
}
