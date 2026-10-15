// Simulateur de parties hors navigateur : génère des phrases à partir d'un ou plusieurs packs JSON.
//
// Exemples :
//   node tests/checks/generate_sentences.js src/db/picolo/war_fr.json --players 2 --count 40
//   node tests/checks/generate_sentences.js src/db/picolo/war_fr.json src/db/picolo/default_fr.json --players 4 --count 60 --json
//
// Options :
//   --players N     nombre de joueurs (defaut 3, noms automatiques Joueur 1..N)
//   --count N       nombre de phrases a generer (defaut 30, sessions replayees)
//   --team1 TEXTE   nom de l'equipe 1 (defaut "Equipe 1")
//   --team2 TEXTE   nom de l'equipe 2 (defaut "Equipe 2")
//   --json          sortie JSON machine-readable sur stdout
//   --raw           affiche le HTML brut des phrases (defaut : texte nettoye)
//   --debug         active les logs internes (game.debug = true)
"use strict";

const fs = require("fs");
const path = require("path");
const { loadApp, buildGame, getGenerator, stripHtml } = require("../_harness.js");

function usage() {
    console.log("Usage: node tests/checks/generate_sentences.js <pack.json> [pack2.json ...] [options]");
    console.log("Options: --players N --count N --team1 X --team2 Y --seed X --json --raw --debug");
    process.exit(1);
}

function parseArgs(argv) {
    const files = [];
    const opts = { players: 3, count: 30, team1: "Equipe 1", team2: "Equipe 2", seed: null, json: false, raw: false, debug: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        const next = () => argv[++i];
        if (a == "--players") opts.players = parseInt(next(), 10);
        else if (a == "--count") opts.count = parseInt(next(), 10);
        else if (a == "--team1") opts.team1 = next();
        else if (a == "--team2") opts.team2 = next();
        else if (a == "--seed") opts.seed = next();
        else if (a == "--json") opts.json = true;
        else if (a == "--raw") opts.raw = true;
        else if (a == "--debug") opts.debug = true;
        else if (a.startsWith("--")) usage();
        else files.push(a);
    }
    if (files.length == 0) usage();
    for (const f of files) {
        if (!fs.existsSync(f)) { console.error(`Pack introuvable : ${f}`); process.exit(1); }
    }
    return { files, opts };
}

const { files, opts } = parseArgs(process.argv.slice(2));
const packs = files.map((f) => JSON.parse(fs.readFileSync(f, "utf8")));

loadApp();
const players = Array.from({ length: opts.players }, (_, i) => `Joueur ${i + 1}`);
const game = buildGame({ packs, players, team1: opts.team1, team2: opts.team2 });
game.debug = opts.debug;
// Graine du tirage (rng.js) : fixée par --seed pour rejouer exactement la même partie
game.seed = setSeed(opts.seed ?? Date.now());

getGenerator(game); // valide que le mode est supporté
const errors = [];
const entries = [];
let warnings = 0;

const origWarn = console.warn;
console.warn = (m) => { warnings++; };

function newSession() {
    game.cycle_id = -1;
    game.sentence_history = [];
}

newSession();
function consecutive() {
    let count = 0;
    for (let i = game.sentence_history.length - 1; i >= 0 && game.sentence_history[i] && game.sentence_history[i].formatted_sentence != "none"; i--) count++;
    return count;
}
for (let n = 0; n < opts.count; n++) {
    if (game.cycle_id + 1 >= game.current_gamemode.database_length) newSession(); // fin de pack : on relance une session
    const was_prefilled = !!(game.sentence_history[game.cycle_id + 1] && game.sentence_history[game.cycle_id + 1].formatted_sentence != "none");
    try {
        incrementCycleID();
        const h = game.sentence_history[game.cycle_id];
        if (h == null || h.formatted_sentence == "none") {
            errors.push({ position: n + 1, reason: "phrase vide (none)" });
            continue;
        }
        entries.push({
            position: n + 1,
            cycle_id: game.cycle_id,
            color: h.color,
            type: h.type,
            text: opts.raw ? h.formatted_sentence : stripHtml(h.formatted_sentence),
            is_followup: was_prefilled
        });
    } catch (e) {
        errors.push({ position: n + 1, reason: e.message });
    }
}
console.warn = origWarn;

if (opts.json) {
    console.log(JSON.stringify({
        packs: files,
        seed: game.seed,
        players: players,
        gamemode_type: game.current_gamemode.gamemode_type,
        gamemode: game.gamemode,
        database_length: game.current_gamemode.database_length,
        entries: entries,
        errors: errors,
        warnings: warnings,
        followups: entries.filter((e) => e.is_followup).length
    }, null, 2));
} else {
    console.log(`Pack(s) : ${files.join(", ")}`);
    console.log(`Mode    : ${game.gamemode} (${game.current_gamemode.gamemode_type}) — BDD ${game.current_gamemode.database_length} phrases`);
    console.log(`Joueurs : ${players.join(", ")}`);
    console.log(`Equipes : ${opts.team1} / ${opts.team2}`);
    console.log(`Graine  : ${game.seed} (rejouer : --seed ${game.seed})`);
    console.log("");
    for (const e of entries) {
        console.log(`${String(e.position).padStart(3)}) [${(e.color || "-").padEnd(6)}] ${e.text}${e.is_followup ? "  [suite]" : ""}`);
    }
    console.log("");
    const suites = entries.filter((e) => e.is_followup).length;
    console.log(`Generees : ${entries.length} | [suite] : ${suites} | erreurs : ${errors.length} | avertissements : ${warnings}`);
    if (errors.length) {
        console.log("");
        console.log("Erreurs :");
        for (const e of errors) console.log(`  #${e.position} : ${e.reason}`);
    }
}