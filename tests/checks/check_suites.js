#!/usr/bin/env node
// Suites en attente (file des suites, src/js/format.js et picolito.js ; voir
// docs/dev/reflexion/refonte_des_bases.md §5.6). Simule des parties à graine fixe et vérifie :
//   - aucune suite n'est perdue : chaque carte à suite voit sa suite jouée une fois, avant la fin ;
//   - avant la fin de base, une suite ne passe jamais avant son échéance, et un retard ne vient que
//     d'autres suites (collision : la seconde passe après) ;
//   - après la dernière carte de base, plus de nouveau tirage : seules les suites en attente sont jouées,
//     et la longueur annoncée (getGameLength) est la longueur réelle de la partie ;
//   - anciens packs : une ancienne règle (virus) se termine 2 à 4 cartes plus tard, une autre suite
//     à la carte suivante (hors retard dû à une collision).
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
console.warn = () => {};

// Pack schema 2 de test : 60 défis, un tiers sans suite, un tiers suite à la carte suivante,
// un tiers suite à 1-3 cartes : beaucoup de collisions.
const testPack = {
    schema: 2, id: "picolo_essai_v2_fr", gamemode: "picolo", language: "fr", version: 1, pack_name: "Essai", pack_description: "Test",
    db: Array.from({ length: 60 }, (_, i) => {
        const id = `essai_${String(i + 1).padStart(4, "0")}`;
        const card = { id, type: "action_defi", text: `%1, carte ${id}` };
        if (i % 3 === 1) card.suites = [{ text: `%1, suite de ${id}` }];
        if (i % 3 === 2) card.suites = [{ text: `%1, suite de ${id}`, offset_min: 1, offset_max: 3 }];
        return card;
    })
};

// Joue une partie jusqu'au bout (longueur annoncée), renvoie l'historique et la longueur de base.
function playGame(packs, { seed, base, settings = {} }) {
    const game = buildGame({ packs: packs.map((p) => JSON.parse(JSON.stringify(p))), players: ["A", "B", "C", "D"] });
    game.current_gamemode.database_length = 100000;
    game.max_sentence_amount = base;
    Object.assign(game.picolito, settings);
    game.played_cards = new Set();
    game.pending_suites = [];
    setSeed(seed);
    let guard = 0;
    while (game.cycle_id + 1 < getGameLength() && guard++ < 1000) incrementCycleID();
    return { history: game.sentence_history, base, pending: getPendingSuites().length, announced: getGameLength() };
}

let games = 0, suitesSeen = 0, delayed = 0, extended = 0;
for (let g = 0; g < 300; g++) {
    const base = 10 + (g % 15);
    const { history, pending, announced } = playGame([testPack], {
        seed: `suites-${g}`, base,
        settings: { family_probability: { action: 100, parole: 0, collectif: 0, manche: 0, regle: 0, cul_sec: 0 } }
    });
    games++;
    if (pending !== 0) fail(`partie ${g} : ${pending} suite(s) jamais jouée(s)`);
    if (history.length !== announced) fail(`partie ${g} : longueur réelle ${history.length} ≠ annoncée ${announced}`);
    if (history.some((h) => !h)) fail(`partie ${g} : trou dans l'historique`);
    if (history.length > base) extended++;
    history.forEach((h, pos) => {
        if (pos >= base && !h.is_suite) fail(`partie ${g} : nouvelle carte tirée après la fin de base (position ${pos + 1})`);
        if (h.is_suite) return;
        const card = testPack.db.find((c) => c.id === h.key);
        if (!card.suites) return;
        const where = history.findIndex((x, i) => i > pos && x.is_suite && x.key === h.key);
        if (where < 0) fail(`partie ${g} : suite de ${h.key} perdue`);
        suitesSeen++;
        const min = card.suites[0].offset_min ?? 1, max = card.suites[0].offset_max ?? 1;
        if (where < base) {
            if (where < pos + min) fail(`partie ${g} : suite de ${h.key} avant son échéance`);
            if (where > pos + max) {
                delayed++;
                // échéance tirée dans [min, max] : à partir de pos + max, seules d'autres suites peuvent la retarder
                for (let i = pos + max; i < where; i++) if (!history[i].is_suite) fail(`partie ${g} : suite de ${h.key} retardée sans collision`);
            }
        }
    });
}
ok(`${games} parties, ${suitesSeen} suites : aucune perdue, jamais avant leur échéance`);
check(delayed > 0, `collisions : ${delayed} suite(s) décalée(s) après une autre suite, jamais sans raison`);
check(extended > 0, `prolongation : ${extended} partie(s) prolongée(s) par des suites, sans nouveau tirage, longueur annoncée exacte`);

// Anciens packs : décalages par défaut
const def = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "db", "picolo", "default_fr.json"), "utf8"));
const gaps = { regle: [], autre: [] };
for (let g = 0; g < 200; g++) {
    const { history } = playGame([def], { seed: `virus-${g}`, base: 50, settings: { virus_enabled: true, virus_sentence_id_start_min: 10, virus_remaining: 1, chug_enabled: false } });
    history.forEach((h, pos) => {
        if (h.is_suite) return;
        const where = history.findIndex((x, i) => i > pos && x.is_suite && x.key === h.key && x.pack_id === h.pack_id);
        if (where < 0 || where >= 50) return; // après la fin de base, une suite passe tout de suite
        const between = history.slice(pos + 1, where).filter((x) => x.is_suite).length; // retard dû à d'autres suites
        (h.family === "regle" ? gaps.regle : gaps.autre).push(where - pos - between);
    });
}
check(gaps.regle.length > 0 && gaps.regle.every((d) => d >= 2 && d <= 4), `anciennes règles : fin 2 à 4 cartes plus tard (${gaps.regle.length} règles)`);
check(gaps.autre.length > 0 && gaps.autre.every((d) => d === 1), `anciennes suites hors règle : carte suivante (${gaps.autre.length} suites)`);
