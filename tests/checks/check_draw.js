#!/usr/bin/env node
// Tirage des cartes Picolo / Guerre (generatePicoloSentences, src/js/picolito.js ; organigramme :
// docs/dev/reflexion/refonte_des_bases.md §5.6). Simule des parties à graine fixe et vérifie :
//   - les conditions des familles : Règle et Cul-sec pas avant leur carte minimale, au plus leur compteur
//     par partie, jamais en Guerre ; pas de Manche sur les 2 dernières cartes ;
//   - aucune carte ne revient dans une partie ; aucune carte ne nomme plus de joueurs qu'il n'y en a ;
//     à 0 joueur, plusieurs familles restent jouables (cartes sans joueur nommé) ;
//   - le réglage social_posting_enabled ;
//   - les proportions : familles ≈ family_probability, packs à égalité, types d'une famille à égalité ;
//   - un ancien pack et un pack schema 2 se jouent ensemble.
// Sortie : une ligne « OK : … » par assertion, arrêt (exit 1) sur le premier échec.
"use strict";

const fs = require("fs");
const path = require("path");
const { loadApp, buildGame } = require("../_harness.js");

const ROOT = path.join(__dirname, "..", "..");
function ok(label) { console.log(`OK : ${label}`); }
function fail(label) { console.log(`ERREUR : ${label}`); process.exit(1); }
function check(cond, label) { if (cond) ok(label); else fail(label); }
const readPack = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));

loadApp();
console.warn = () => {};

// Joue `games` parties de `length` cartes ; renvoie les cartes principales tirées (suites exclues).
function play({ files, players = 4, games = 40, length = 50, settings = {}, war = false, seed = "draw" }) {
    const packs = files.map(readPack);
    const game = buildGame({ packs, players: Array.from({ length: players }, (_, i) => `J${i + 1}`) });
    if (war) game.gamemode = "picolo_war";
    game.current_gamemode.database_length = 100000;
    Object.assign(game.picolito, { virus_enabled: true, virus_sentence_id_start_min: 10, chug_enabled: true, chug_minimum_cycle_start: 20 }, settings);
    const out = [];
    for (let g = 0; g < games; g++) {
        setSeed(`${seed}-${g}`);
        game.cycle_id = -1;
        game.sentence_history = [];
        game.played_cards = new Set();
        game.pending_suites = [];
        game.picolito.virus_remaining = settings.virus_remaining ?? 1;
        game.picolito.chug_remaining = settings.chug_remaining ?? 1;
        for (let n = 0; n < length; n++) {
            incrementCycleID();
            const h = game.sentence_history[game.cycle_id];
            if (!h || h.formatted_sentence == "none" || h.is_suite) continue;
            out.push({ game: g, cycle: game.cycle_id, family: h.family, type: h.type, pack_id: h.pack_id, key: h.key });
        }
    }
    return { out, packs };
}
const share = (list, pred) => list.filter(pred).length / (list.length || 1);
const count = (list, key) => list.reduce((m, x) => (m[x[key]] = (m[x[key]] || 0) + 1, m), {});

// ---- Règles des familles ----
{
    const { out } = play({ files: ["src/db/picolo/default_fr.json"], games: 120 });
    check(out.length > 0 && out.every((c) => c.family && CARD_TYPES[c.type] && CARD_TYPES[c.type].family === c.family), `${out.length} cartes tirées, famille et type du catalogue`);
    check(out.every((c) => c.family !== "regle" || c.cycle >= 10), "Règle jamais avant la carte 10");
    check(out.every((c) => c.family !== "cul_sec" || c.cycle >= 20), "Cul-sec jamais avant la carte 20");
    const perGame = (fam) => Math.max(...Object.values(count(out.filter((c) => c.family === fam), "game")));
    check(perGame("regle") === 1 && perGame("cul_sec") === 1, "au plus une Règle et un Cul-sec par partie (compteurs à 1)");
    check(out.every((c) => c.family !== "manche" || c.cycle < 48), "pas de Manche sur les 2 dernières cartes");
    const keys = out.map((c) => `${c.game}|${c.pack_id}|${c.key}`);
    check(new Set(keys).size === keys.length, "aucune carte ne revient dans une même partie");
    const off = play({ files: ["src/db/picolo/default_fr.json"], games: 30, settings: { virus_enabled: false, chug_enabled: false } }).out;
    check(off.every((c) => c.family !== "regle" && c.family !== "cul_sec"), "Règle et Cul-sec désactivés par leur réglage");
}
{
    const { out } = play({ files: ["src/db/picolo/war_fr.json"], games: 40, war: true });
    check(out.length > 0 && out.every((c) => c.family !== "regle" && c.family !== "cul_sec"), "Guerre : ni Règle ni Cul-sec");
}

// ---- Joueurs et réglages ----
{
    const { out, packs } = play({ files: ["src/db/picolo/default_fr.json"], players: 1, games: 40 });
    const cards = new Map(getPackCards(packs[0]).map((c) => [c.id, c]));
    check(out.every((c) => cards.get(c.key).players <= 1), "1 joueur : aucune carte nommant plus d'un joueur");
    // Sans joueur enregistré, les cartes qui ne nomment personne se jouent, dans toutes les familles
    // (régression : le minimum de joueurs par type ne laissait que Collectif).
    const zero = play({ files: ["src/db/picolo/default_fr.json"], players: 0, games: 30 }).out;
    const zeroFamilies = new Set(zero.map((c) => c.family));
    check(zero.length > 0 && zero.every((c) => cards.get(c.key).players === 0) && zeroFamilies.size >= 3, `0 joueur : seulement des cartes sans joueur nommé, ${zeroFamilies.size} familles (${[...zeroFamilies].join(", ")})`);
    const without = play({ files: ["src/db/picolo/default_fr.json"], games: 40 }).out;
    const withSP = play({ files: ["src/db/picolo/default_fr.json"], games: 40, settings: { social_posting_enabled: true } }).out;
    check(!without.some((c) => c.type === "action_social_posting") && withSP.some((c) => c.type === "action_social_posting"), "action_social_posting seulement si social_posting_enabled");
}

// ---- Proportions (Règle et Cul-sec désactivés pour mesurer les 4 autres familles) ----
{
    const { out } = play({ files: ["src/db/picolo/default_fr.json"], games: 80, length: 40, settings: { virus_enabled: false, chug_enabled: false } });
    const p = defaultFamilyProbability();
    const total = p.action + p.parole + p.collectif + p.manche;
    const report = [];
    let good = true;
    for (const f of ["action", "parole", "collectif", "manche"]) {
        const got = share(out, (c) => c.family === f), want = p[f] / total;
        report.push(`${f} ${(got * 100).toFixed(1)} % (attendu ${(want * 100).toFixed(1)})`);
        if (Math.abs(got - want) > 0.04) good = false;
    }
    check(good, `familles ≈ probabilités sur ${out.length} cartes : ${report.join(", ")}`);
    const collectif = out.filter((c) => c.family === "collectif");
    const types = count(collectif, "type");
    const shares = Object.values(types).map((n) => n / collectif.length);
    check(Object.keys(types).length >= 2 && shares.every((s) => Math.abs(s - 1 / shares.length) < 0.06), `types d'une famille à égalité (poids 1) : Collectif ${JSON.stringify(types)}`);
}
{
    const { out } = play({ files: ["src/db/picolo/default_fr.json", "src/db/picolo/bar_fr.json"], games: 80, length: 40, settings: { virus_enabled: false, chug_enabled: false } });
    const action = out.filter((c) => c.family === "action");
    const bar = share(action, (c) => c.pack_id === "picolo_bar_fr");
    check(Math.abs(bar - 0.5) < 0.06, `packs à égalité pour une famille qu'ils ont tous les deux : Action ${(bar * 100).toFixed(1)} % bar / ${(100 - bar * 100).toFixed(1)} % default`);
}

// ---- Ancien pack + pack schema 2 ----
{
    const files = ["src/db/picolo/bar_fr.json", "tests/fixtures/picolo_exemple_v2_fr.json"];
    const { out } = play({ files, games: 30, length: 30 });
    const fromExample = out.filter((c) => c.pack_id === "picolo_exemple_v2_fr");
    check(fromExample.length > 0 && out.some((c) => c.pack_id === "picolo_bar_fr"), `ancien pack et pack schema 2 dans la même partie (${fromExample.length} cartes d'exemple)`);
    check(fromExample.every((c) => /^exemple_\d{4}$/.test(c.key)), "cartes schema 2 identifiées par leur id");
}
