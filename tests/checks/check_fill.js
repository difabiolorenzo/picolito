#!/usr/bin/env node
// Remplissage des textes (textReplacer, src/js/format.js ; voir docs/dev/reflexion/refonte_des_bases.md §5.8).
// Vérifie :
//   - %1, %2… : le même numéro désigne le même joueur, deux numéros deux joueurs différents ;
//   - une suite remplie avec l'attribution de sa carte reprend ses joueurs et son équipe ;
//   - anciens packs : le n-ième %s d'une suite reprend le n-ième joueur de la carte, les %s en plus
//     sont des joueurs nouveaux (corrige « X est le pilier de bar » / « Y n'est plus le pilier de bar ») ;
//   - %t : une seule équipe par carte et sa suite ;
//   - pas assez de joueurs : « [joueur] » ;
//   - en partie simulée (ancien pack à suite), la suite nomme les joueurs de sa carte.
// Sortie : une ligne « OK : … » par assertion, arrêt (exit 1) sur le premier échec.
"use strict";

const { loadApp, buildGame } = require("../_harness.js");

function ok(label) { console.log(`OK : ${label}`); }
function fail(label) { console.log(`ERREUR : ${label}`); process.exit(1); }
function check(cond, label) { if (cond) ok(label); else fail(label); }
const names = (res) => res.keys.filter((k) => k.type === "player").map((k) => k.value);
const teamsOf = (res) => res.keys.filter((k) => k.type === "team").map((k) => k.value);

loadApp();
const PLAYERS = ["Alice", "Bob", "Carl", "Dora", "Eve"];
buildGame({ packs: [], players: PLAYERS, team1: "Rouges", team2: "Bleus" });

for (let seed = 0; seed < 50; seed++) {
    setSeed("fill-" + seed);
    // %1 / %2
    const card = textReplacer("%1 parle à %2, puis %1 se tait");
    const [a, b, a2] = names(card);
    if (!(a === a2 && a !== b)) fail(`%1 répété ≠ même joueur ou %1 = %2 (graine ${seed}) : ${names(card)}`);
    const suite = textReplacer("%2 répond à %1", card.assignment);
    if (!(names(suite)[0] === b && names(suite)[1] === a)) fail(`suite schema 2 : joueurs différents de la carte (graine ${seed})`);
    // anciens packs
    const old = textReplacer("%s est marié(e) à %s");
    const oldSuite = textReplacer("%s et %s divorcent, %s console", old.assignment);
    const [m1, m2] = names(old), [d1, d2, extra] = names(oldSuite);
    if (!(d1 === m1 && d2 === m2 && extra !== m1 && extra !== m2)) fail(`ancienne suite : ${names(old)} -> ${names(oldSuite)} (graine ${seed})`);
    const none = textReplacer("Combien de partenaires ? La suite arrive");
    const after = textReplacer("%s et %s distribuent", none.assignment);
    if (new Set(names(after)).size !== 2) fail(`suite sans joueur dans la carte : joueurs non distincts (graine ${seed})`);
    // %t
    const t = textReplacer("Équipe %t, l'équipe %t commence");
    const ts = textReplacer("Équipe %t gagne", t.assignment);
    const all = [...teamsOf(t), ...teamsOf(ts)];
    if (!(new Set(all).size === 1 && ["Rouges", "Bleus"].includes(all[0]))) fail(`%t : équipes différentes dans une carte et sa suite (graine ${seed}) : ${all}`);
}
ok("%1 répété = même joueur, %1 ≠ %2 (50 graines)");
ok("suite schema 2 : mêmes joueurs que la carte, dans n'importe quel ordre");
ok("ancienne suite : n-ième %s = n-ième joueur de la carte, %s en plus = nouveau joueur");
ok("ancienne carte sans joueur : la suite tire des joueurs distincts");
ok("%t : même équipe dans une carte et sa suite");

check(textReplacer("%s seul").assignment.players.length === 1 && textReplacer("Sans joueur").assignment.players.length === 0, "attribution renvoyée par textReplacer");
buildGame({ packs: [], players: ["Solo"] });
const short = textReplacer("%1 et %2");
check(names(short)[0] === "Solo" && names(short)[1] === "[joueur]", "pas assez de joueurs : « [joueur] »");

// Partie simulée : ancien pack minimal à une carte et sa suite.
const pack = {
    id: "picolo_essai_fr", gamemode: "picolo", language: "fr", version: 1,
    filters: [{ type: 1, player_count: [0, 1, 2, 3, 4], color: "blue" }],
    db: [
        { type: "1", text: "%s est le pilier de bar, %s le surveille", key: "pilier", parent_key: "", nb_players: "2" },
        { type: "1", text: "%s n'est plus le pilier de bar, merci %s", key: "", parent_key: "pilier", nb_players: "2" },
        { type: "1", text: "Carte de remplissage", key: "", parent_key: "", nb_players: "0" }
    ]
};
let checked = 0;
for (let seed = 0; seed < 30; seed++) {
    const game = buildGame({ packs: [JSON.parse(JSON.stringify(pack))], players: PLAYERS });
    game.picolito.color_probability = { blue: 100, red: 0, green: 0, yellow: 0 };
    setSeed("partie-" + seed);
    for (let n = 0; n < 2; n++) incrementCycleID();
    const hist = game.sentence_history.filter((h) => h && h.formatted_sentence !== "none");
    const main = hist.find((h) => /pilier de bar, /.test(h.original_sentence));
    const follow = hist.find((h) => /n'est plus/.test(h.original_sentence));
    if (!main || !follow) continue;
    const p = main.sentence_keys.filter((k) => k.type === "player").map((k) => k.value);
    const q = follow.sentence_keys.filter((k) => k.type === "player").map((k) => k.value);
    if (!(p[0] === q[0] && p[1] === q[1])) fail(`partie simulée : carte ${p} / suite ${q} (graine ${seed})`);
    checked++;
}
check(checked > 0, `partie simulée : la suite nomme les joueurs de sa carte (${checked} parties)`);
