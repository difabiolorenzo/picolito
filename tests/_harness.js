// Harness minimal pour tester les moteurs de génération de phrases hors navigateur.
// Stub DOM + chargement de main.js / picolito.js / cookie.js + constructeur d'état de jeu.
// Usage : via generate_sentences.js ou check_pack.js (ne pas exécuter directement).
"use strict";

const fs = require("fs");
const path = require("path");

function makeEl() {
    const el = {
        className: "",
        innerHTML: "",
        style: {},
        checked: false,
        disabled: false,
        children: [],
        nodeType: 1,
        dataset: {},
        parentElement: null,
        _class: new Set(),
        classList: {
            add(...c) { c.forEach((x) => el._class.add(x)); },
            remove(...c) { c.forEach((x) => el._class.delete(x)); },
            contains(c) { return el._class.has(c); },
            toggle(cls, force) {
                const shouldAdd = force === undefined ? !el._class.has(cls) : !!force;
                if (shouldAdd) { el._class.add(cls); } else { el._class.delete(cls); }
            }
        },
        addEventListener() {},
        setAttribute() {},
        getAttribute() { return null; },
        querySelector() { return makeEl(); },
        querySelectorAll() { return []; },
        appendChild() {},
        removeChild() {},
        append() {},
        prepend() {},
        remove() {},
        closest() { return makeEl(); },
        focus() {},
        blur() {},
        click() {},
        scrollIntoView() {},
        insertAdjacentHTML() {},
        hide() {},
        show() {}
    };
    return el;
}

function setupStubs() {
    const els = {};
    const document = {
        getElementById(id) { if (!els[id]) els[id] = makeEl(); return els[id]; },
        createElement() { return makeEl(); },
        createTextNode(t) { return t; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        addEventListener() {},
        cookie: "",
        body: makeEl()
    };
    document.documentElement = makeEl();
    document.head = makeEl();
    document.body._class = new Set();
    document.body.classList = {
        add(...c) { c.forEach((x) => document.body._class.add(x)); },
        remove(...c) { c.forEach((x) => document.body._class.delete(x)); }
    };

    globalThis.document = document;
    globalThis.window = { addEventListener() {}, matchMedia() { return { matches: false }; } };
    Object.defineProperty(globalThis, "navigator", { value: { userAgent: "", language: "fr" }, configurable: true });
    globalThis.localStorage = (() => {
        const store = {};
        return {
            getItem(k) { return store[k] ?? null; },
            setItem(k, v) { store[k] = String(v); },
            removeItem(k) { delete store[k]; }
        };
    })();
    globalThis.location = { protocol: "http:", href: "http://localhost/" };
    globalThis.bootstrap = { Modal: class { constructor() {} show() {} hide() {} }, Toast: class { constructor() {} show() {} } };
    return document;
}

function loadApp() {
    setupStubs();
    const ROOT = path.join(__dirname, "..");
    const pieces = [
        "src/js/catalog.js",
        "src/js/cookie.js",
        "src/js/format.js",
        "src/js/players.js",
        "src/js/ingame.js",
        "src/js/dbmanager.js",
        "src/js/external.js",
        "src/js/qpuc.js",
        "src/js/picolito.js",
        "src/js/weakest_link.js",
        "src/js/main.js"
    ].map((f) => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n");
    // `const DBManager` resterait dans l'environnement de l'indirect eval (inaccessible) :
    // on le re-déclare `var` pour qu'il atterrisse sur globalThis (transformation test-only).
    let source = pieces.replace("const DBManager = {", "var DBManager = {");
    (0, eval)(source);
    // Références navigateur-global utilisées par le code (éléments par id)
    globalThis.ingame_sentence = globalThis.document.getElementById("ingame_sentence");
    // Éléments des réglages (auto-globals navigateur) utilisés par defaultVariables()/updateHTMLSettingsByVar()
    const settings_globals = ["input_weakest_link_tie", "input_weakest_link_max_chain", "input_weakest_link_difficulty_default_value", "input_weakest_link_difficulty_selected", "input_weakest_link_text_size", "input_weakest_link_soundtrack", "input_qpuc_answer_display", "picolito_version_safety", "picolito_version_menu", "input_potential_chug", "game_cycle_count"];
    for (const id of settings_globals) {
        globalThis[id] = globalThis.document.getElementById(id);
    }
}

// Construit un état de jeu minimal reproduisant l'environnement d'un lancement.
function buildGame({ packs = [], players = ["Alice", "Bob", "Carl"], team1 = "Equipe 1", team2 = "Equipe 2", sip = { min: 1, max: 3 } }) {
    globalThis.global = {
        current_language: "fr",
        current_language_strings: { picolo: "Picolo", je_n_ai_jamais: "Je n'ai jamais", question_pour_un_champion: "QPUC", sentence_infos_reveal: "Plus d'infos" }
    };
    const database_length = packs.reduce((s, p) => s + (p.db ? p.db.length : 0), 0);
    const gamemode_type = deduceGamemodeType(packs);
    globalThis.game = {
        debug: false,
        gamemode: gamemode_type == "war" ? "picolo_war" : gamemode_type,
        current_gamemode: {
            gamemode_type: gamemode_type,
            packs: packs,
            database_length: database_length
        },
        player_list: players.map((name) => ({ player_name: name })),
        team_1: team1,
        team_2: team2,
        mix_gamemode_probability: {
            picolo: 50,
            je_n_ai_jamais: 50,
            question_pour_un_champion: 0
        },
        picolito: {
            chug_enabled: true,
            chug_remaining: 1,
            chug_minimum_cycle_start: 20,
            virus_enabled: false,
            virus_remaining: 1,
            virus_sentence_id_start_min: 10,
            social_posting_enabled: false,
            color_probability: { blue: 70, red: 5, green: 20, yellow: 5 },
            chug_amount: 1
        },
        cycle_id: -1,
        max_sentence_amount: 50,
        sentence_history: [],
        quotes_indicator: "none",
        animation: false,
        display_color_indicator: true,
        sip: sip,
        started: true,
        picolito_version: "0.37"
    };
    return globalThis.game;
}

// Type de gamemode déduit des packs (mix si plusieurs categories, sinon le mode commun).
function deduceGamemodeType(packs) {
    const types = [...new Set(packs.map((p) => p.gamemode))];
    if (types.length > 1) return "mix";
    return types[0] || "picolo";
}

// Générateur correspondant au gamemode courant.
function getGenerator(game) {
    const type = game.current_gamemode.gamemode_type;
    if (type == "picolo" || type == "war") return () => generatePicoloSentences();
    if (type == "je_n_ai_jamais") return () => generateJeNaiJamaisSentences();
    if (type == "question_pour_un_champion") {
        throw new Error("Mode 'question_pour_un_champion' non supporté par cet outil (mini-moteur de manches requis).");
    }
    if (type == "mix") return () => generateMixSentences();
    throw new Error(`Gamemode "${type}" non géré.`);
}

function stripHtml(html) {
    return String(html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

module.exports = { loadApp, buildGame, getGenerator, stripHtml, makeEl };