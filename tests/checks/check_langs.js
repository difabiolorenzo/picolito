#!/usr/bin/env node
// Picolito — Vérification de la parité des dictionnaires d'interface (sans build).
// Loads les 14 dictionnaires (fr, it, en + da, de, es, fi, ja, ko, nb, nl, pt, ru, sv),
// contrôle : même jeu de clés que FR, cohérence des placeholders (%s / %d / {name}),
// clés France-vides cohérentes (hors FR), et enregistrement dans lang.js.
// Usage : node tests/checks/check_langs.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const LANG_DIR = path.join(ROOT, "src", "js", "lang");
const LANGS = ["fr", "da", "de", "en", "es", "fi", "it", "ja", "ko", "nb", "nl", "pt", "ru", "sv"];

function load(lang) {
    const file = path.join(LANG_DIR, `${lang}.js`);
    const src = fs.readFileSync(file, "utf8");
    const script = src.replace(/\bconst\s+LANGUAGE_[A-Z]{2}\s*=\s*/, "globalThis.LANGUAGE_TMP = ");
    const store = { globalThis: global };
    (0, eval)("(function(){" + script + "; return globalThis.LANGUAGE_TMP;})()");
    const dict = globalThis.LANGUAGE_TMP;
    delete globalThis.LANGUAGE_TMP;
    if (!dict || typeof dict !== "object") throw new Error(`${lang}.js : dictionnaire introuvable`);
    return dict;
}

// Clés dont les tokens sont substitués par le JS (format.js / lang.js / players.js / qpuc.js)
const PLACEHOLDER_KEYS = {
    file_protocol_warning_text: ["%s"],
    qpuc_q4_turn: ["%s"],
    qpuc_q4_timer: ["%s"],
    qpuc_q4_streak: ["%s"],
    qpuc_q4_next: ["%s"],
    qpuc_manche_won: ["%s"],
    qpuc_wrong_sip: ["%s", "%d"],
    mix_qpuc_wrong_answer_sips: ["%s"],
    player_team_select: ["{name}"],
    player_deleted_undo: ["{name}"]
};

// Clés vides volontairement hors FR (prévention française : site + numéro d'appel)
const BLANK_OUTSIDE_FR = [
    "prevention_information_website_text",
    "prevention_information_website",
    "prevention_call_text",
    "prevention_number",
    "prevention_number_modality"
];

const source = load("fr");
const sourceKeys = Object.keys(source);

let failures = 0;
const fail = (lang, msg) => { failures++; console.log(`ERREUR [${lang}] : ${msg}`); };

for (const lang of LANGS) {
    try {
        const dict = load(lang);

        // 1. Même jeu de clés que FR
        const keys = Object.keys(dict);
        if (keys.length !== sourceKeys.length) {
            fail(lang, `${keys.length} clés vs ${sourceKeys.length} en FR`);
        }
        for (const k of sourceKeys) {
            if (!(k in dict)) fail(lang, `clé manquante : ${k}`);
        }
        if (lang !== "fr") {
            for (const k of keys) {
                if (!sourceKeys.includes(k)) fail(lang, `clé inconnue : ${k}`);
            }
        }

        // 2. Valeurs définies + pas de "undefined"
        for (const k of sourceKeys) {
            const v = dict[k];
            if (typeof v !== "string") fail(lang, `clé non-chaîne : ${k}`);
            else if (v === "undefined" || v.includes("undefined")) fail(lang, `clé littérale "undefined" : ${k}`);
        }

        // 3. Placeholders préservés
        for (const [k, tokens] of Object.entries(PLACEHOLDER_KEYS)) {
            const v = dict[k];
            if (lang !== "fr" && BLANK_OUTSIDE_FR.includes(k)) continue;
            for (const t of tokens) {
                if (!v.includes(t)) fail(lang, `placeholder "${t}" absent de la clé ${k}`);
            }
        }

        // 4. Clés France vides dans les langues additionnelles (ex. site + n° d'appel).
        //    FR les renseigne ; EN les vide et IT les localise (choix historiques non contrôlés ici).
        if (!["fr", "en", "it"].includes(lang)) {
            for (const k of BLANK_OUTSIDE_FR) {
                if (dict[k] !== "") fail(lang, `clé ${k} non vide (à vider dans les langues additionnelles)`);
            }
        } else if (lang === "fr") {
            for (const k of BLANK_OUTSIDE_FR) {
                if (dict[k] === "") fail("fr", `clé ${k} vidée (FR ne doit pas l'être)`);
            }
        }
    } catch (e) {
        failures++;
        console.log(`ERREUR [${lang}] : ${e.message}`);
    }
}

// 5. lang.js : les 14 dictionnaires sont enregistrés et chargés avant lang.js
const langjs = fs.readFileSync(path.join(ROOT, "src", "js", "lang.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
for (const lang of LANGS) {
    const cst = `LANGUAGE_${lang.toUpperCase()}`;
    if (lang === "fr" || lang === "it" || lang === "en") continue;
    // Recherche littérale de la clé dans le mapping `xx: LANGUAGE_XX` et dans la liste des scripts
    if (!new RegExp(`${lang}:\\s*${cst}`).test(langjs)) fail("lang.js", `dictionnaire ${lang} non enregistré dans la map language`);
    if (!indexHtml.includes(`./src/js/lang/${lang}.js`)) fail("index.html", `<script> ./src/js/lang/${lang}.js manquant`);
}

const langCount = (langjs.match(/LANGUAGE_[A-Z]{2}/g) || []).filter((v, i, a) => a.indexOf(v) === i).length;
if (langCount !== 14) fail("lang.js", `${langCount} dictionnaires référencés attendu : 14`);

console.log(`check_langs : ${failures === 0 ? "tous les tests passent." : failures + " erreur(s)"}`);
process.exit(failures === 0 ? 0 : 1);