#!/usr/bin/env node
// Mode Je n'ai jamais sur le modèle de cartes (generateJeNaiJamaisSentences, src/js/picolito.js ;
// voir docs/dev/reflexion/refonte_des_bases.md §5.5 : le « je n'ai jamais » est le type collectif_bois_si).
// Vérifie :
//   - chaque phrase sort une seule fois par partie et le pack n'est pas modifié (pack.db intact) ;
//   - pack épuisé : plus de tirage ; nouvelle partie (played_cards remis à zéro) : phrases de nouveau jouables ;
//   - le texte n'est rempli qu'une fois (gorgées affichées = gorgées enregistrées) ;
//   - un ancien pack et un pack schema 2 (collectif_bois_si) se jouent ensemble ;
//   - Mix : quand le pack Je n'ai jamais est épuisé, le Mix continue avec Picolo, sans carte vide.
// Sortie : une ligne « OK : … » par assertion, arrêt (exit 1) sur le premier échec.
"use strict";

const fs = require("fs");
const path = require("path");
const { loadApp, buildGame, stripHtml } = require("../_harness.js");

const ROOT = path.join(__dirname, "..", "..");
function ok(label) { console.log(`OK : ${label}`); }
function fail(label) { console.log(`ERREUR : ${label}`); process.exit(1); }
function check(cond, label) { if (cond) ok(label); else fail(label); }
const readPack = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));

loadApp();
console.warn = () => {};

function newGame(packs, seed) {
    const game = buildGame({ packs, players: ["Alice", "Bob", "Carl"] });
    game.current_gamemode.database_length = 100000;
    game.max_sentence_amount = 100000;
    game.played_cards = new Set();
    game.pending_suites = [];
    setSeed(seed);
    return game;
}
function playN(game, n) {
    for (let i = 0; i < n; i++) incrementCycleID();
    return game.sentence_history.filter(Boolean);
}

// ---- Ancien pack : chaque phrase une fois, pack intact ----
const party = readPack("src/db/je_n_ai_jamais/party_fr.json");
const size = party.db.length;
let game = newGame([party], "never-1");
let hist = playN(game, size + 5);
const played = hist.filter((h) => h.formatted_sentence && h.formatted_sentence !== "none");
check(played.length === size, `party_fr : ${played.length}/${size} phrases jouées, puis plus de tirage`);
check(new Set(played.map((h) => h.key)).size === size, "chaque phrase une seule fois");
check(party.db.length === size, "pack.db intact (plus de retrait des phrases)");
check(played.every((h) => h.color === "je_n_ai_jamais" && h.family === undefined && h.pack_id === "je_n_ai_jamais_party_fr"), "affichage Je n'ai jamais inchangé (couleur, pas de pastille), pack d'origine");
game = newGame([party], "never-2");
check(playN(game, 3).length === 3, "nouvelle partie : phrases de nouveau jouables");

// ---- Pack schema 2 + remplissage unique ----
const essai = {
    schema: 2, id: "je_n_ai_jamais_essai_v2_fr", gamemode: "je_n_ai_jamais", language: "fr", version: 1,
    pack_name: "Essai", pack_description: "Test",
    db: Array.from({ length: 6 }, (_, i) => ({ id: `essai_${String(i + 1).padStart(4, "0")}`, type: "collectif_bois_si", text: `Je n'ai jamais fait le test ${i + 1}, sinon $ gorgées` }))
};
game = newGame([essai, party], "never-3");
hist = playN(game, 60);
const fromEssai = hist.filter((h) => h.pack_id === "je_n_ai_jamais_essai_v2_fr");
check(fromEssai.length > 0 && hist.some((h) => h.pack_id === "je_n_ai_jamais_party_fr"), `ancien pack et pack schema 2 ensemble (${fromEssai.length} phrases schema 2)`);
const consistent = fromEssai.every((h) => {
    const sips = h.sentence_keys.filter((k) => k.type === "sip").map((k) => String(k.value));
    return sips.length === 1 && stripHtml(h.formatted_sentence).includes(`sinon ${sips[0]} gorgées`);
});
check(consistent, "texte rempli une seule fois : gorgées affichées = gorgées enregistrées");

// ---- Mix : Je n'ai jamais épuisé ----
const tiny = { ...essai, id: "je_n_ai_jamais_mini_v2_fr", db: essai.db.slice(0, 3).map((c, i) => ({ ...c, id: `mini_${String(i + 1).padStart(4, "0")}` })) };
const picolo = readPack("src/db/picolo/bar_fr.json");
game = newGame([tiny, picolo], "never-mix");
game.current_gamemode.gamemode_type = "mix";
game.gamemode = "mix";
game.mix_gamemode_probability = { picolo: 20, je_n_ai_jamais: 80, question_pour_un_champion: 0 };
hist = game.sentence_history;
for (let i = 0; i < 40; i++) incrementCycleID();
const all = hist.slice(0, 40);
check(all.length === 40 && all.every((h) => h && h.formatted_sentence && h.formatted_sentence !== "none"), "Mix : 40 cartes, aucune vide");
check(all.filter((h) => h.color === "je_n_ai_jamais").length === 3, "Mix : les 3 phrases Je n'ai jamais une fois chacune, puis seulement Picolo");
