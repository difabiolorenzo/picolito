// Test de l'encart d'information de phrase (tâche 3) : buildSentenceInfosMarkup + toggle.
// Usage : node tests/checks/check_infos.js
"use strict";

const { loadApp, buildGame, getGenerator, stripHtml } = require("../_harness.js");

loadApp();
buildGame({ players: ["Alice", "Bob"], packs: [] });

function assert(cond, msg) {
    if (!cond) { console.error("FAIL : " + msg); process.exit(1); }
    console.log("OK   : " + msg);
}

// --- 1) Aucune info / champ absent -> pas de markup ---
const none = buildSentenceInfosMarkup(undefined);
assert(none === "", "buildSentenceInfosMarkup(undefined) rend une chaîne vide");
assert(buildSentenceInfosMarkup([]) === "", "buildSentenceInfosMarkup([]) rend une chaîne vide");

// --- 2) Info présente -> bouton + liste cachée par défaut ---
const markup = buildSentenceInfosMarkup(["Ligne 1 <b>xss</b>", "Ligne 2"]);
assert(markup.includes("sentence_infos_reveal_btn"), "le bouton de révélation est généré");
assert(markup.includes("sentence_infos_content d-none"), "le contenu est caché par défaut");
assert(markup.includes("&lt;b&gt;xss&lt;/b&gt;"), "le contenu est échappé HTML (XSS)");
assert(markup.includes("Ligne 2"), "la seconde ligne est présente");
assert(markup.includes("stopPropagation"), "le clic du bouton ne déclenche pas l'avancement de la phrase");
assert(!markup.includes("undefined"), "aucun artefact 'undefined' dans le markup");

// --- 3) Maximum : la liste est tronquée à 8 lignes ---
const long = buildSentenceInfosMarkup(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]);
assert((long.match(/<li>/g) || []).length === 8, "le nombre de <li> est borné à 8");

// --- 4) Toggle : masqué -> visible -> masqué ---
const doc_stub = globalThis.document;
const content_el = doc_stub.getElementById("ingame_sentence_infos_test");
content_el._class.add("d-none");
doc_stub.querySelector = () => content_el;
toggleSentenceInfos();
assert(!content_el.classList.contains("d-none"), "toggleSentenceInfos révèle le contenu");
toggleSentenceInfos();
assert(content_el.classList.contains("d-none"), "toggleSentenceInfos re-masque le contenu");

// --- 5) Rendue dans une production complète (war_fr) ---
const fs = require("fs");
const pack = JSON.parse(fs.readFileSync("src/db/picolo/war_fr.json", "utf8"));
const rois = pack.db.find(e => e.infos && Array.isArray(e.infos) && e.infos.length > 0);
assert(rois != null, "le pack war_fr contient un exemple avec infos");
const html = textReplacer(rois.text).formatted_sentence + buildSentenceInfosMarkup(rois.infos);
assert(html.includes("sentence_infos_reveal_btn"), "l'exemple rois_de_france intègre le bouton");
assert(stripHtml(html).includes("Clovis Ier"), "le texte des infos survit au nettoyage UI");

console.log("");
console.log("check_infos : tous les tests passent.");