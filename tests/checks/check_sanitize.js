// Test hors navigateur de la sanitisasion XSS liée à l'import de BDD externes
// (correctif 5d, audit) + libellés sources i18n.
//
// Vérifie :
//   - sanitizeExternalText : échappement < > & (et pas de double-échappement)
//   - escapeHTML : échappement complet (y compris guillemets)
//   - DBManager.decorateEntries : sanitisasion text/question/reponse pour packs externes,
//     inchangés pour packs vanilla
//   - addDBData (import fichier) : le XSS d'un pack externe est neutralisé à l'import
//   - getSourceLabel : libellé i18n avec fallback sur l'identifiant
//
// Usage : node tests/checks/check_sanitize.js
"use strict";

const { loadApp, buildGame } = require("../_harness.js");

loadApp();
buildGame({ packs: [] });
const document = globalThis.document;

globalThis.global.current_language_strings = {
    db_manager_source_vanilla: "Intégré",
    db_manager_source_external: "Externe"
};

function assert(cond, label) {
    if (!cond) { console.error("ECHEC : " + label); process.exit(1); }
    console.log("OK : " + label);
}

// --- 1) sanitizeExternalText ---
const evil = '<script>alert("xss")</script>\'&';
const s = sanitizeExternalText(evil);
assert(s === "&lt;script&gt;alert(\"xss\")&lt;/script&gt;'&amp;", "sanitizeExternalText échappe < > &");
assert(sanitizeExternalText("salut $ <3") === "salut $ &lt;3", "sanitizeExternalText préserve $ et les accents");
assert(sanitizeExternalText(null) === "", "sanitizeExternalText(null) → chaîne vide");

// Pas de double-échappement sur du texte déjà propre
assert(sanitizeExternalText("déjà sain & propre") === "déjà sain &amp; propre", "sanitizeExternalText échappe une fois seulement");

// --- 2) escapeHTML ---
assert(escapeHTML('<a href="x">&\'</a>') === "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;", "escapeHTML échappe tout (guillemets inclus)");

// --- 3) getSourceLabel ---
assert(getSourceLabel("vanilla") === "Intégré", "getSourceLabel vanilla → libellé i18n");
assert(getSourceLabel("external") === "Externe", "getSourceLabel external → libellé i18n");
assert(getSourceLabel("inconnu") === "inconnu", "getSourceLabel inconnu → fallback identifiant");

// --- 4) DBManager.decorateEntries (sanitisasion à la volée) ---
const packExternal = {
    id: "xss_external_test",
    gamemode: "je_n_ai_jamais",
    db: [{ text: "<img onerror=alert(1)> texte <b>gras</b>" }]
};
const ext = JSON.parse(JSON.stringify(packExternal));
DBManager.decorateEntries(ext, { source: "external" });
assert(ext.db[0].text === "&lt;img onerror=alert(1)&gt; texte &lt;b&gt;gras&lt;/b&gt;", "decorateEntries external : text sanitizé");
assert(ext.db[0].pack_id === "xss_external_test", "decorateEntries injecte pack_id");
assert(ext.db[0].gamemode_type === "je_n_ai_jamais", "decorateEntries injecte gamemode_type");

// QPUC / Maillon Faible : question et reponse doivent aussi être sanitizés (innerHTML)
const qpucExternal = {
    id: "xss_qpuc_test",
    gamemode: "question_pour_un_champion",
    db: [{ series: "S1", type: "face_a_face", question: "<script>mauvais()</script>Q?", reponse: "A <b>bonne</b>" }]
};
const qp = JSON.parse(JSON.stringify(qpucExternal));
DBManager.decorateEntries(qp, { source: "external" });
assert(qp.db[0].question === "&lt;script&gt;mauvais()&lt;/script&gt;Q?", "decorateEntries external : question sanitizée");
assert(qp.db[0].reponse === "A &lt;b&gt;bonne&lt;/b&gt;", "decorateEntries external : reponse sanitizée");

// Vanilla : aucun échappement (les packs du dépôt sont fiables)
const vanillaPack = {
    id: "picolo_default_fr",
    gamemode: "picolo",
    db: [{ type: "1", text: "<em>mise en forme</em> & légitime" }]
};
const vp = JSON.parse(JSON.stringify(vanillaPack));
DBManager.decorateEntries(vp, { source: "vanilla" });
assert(vp.db[0].text === "<em>mise en forme</em> & légitime", "decorateEntries vanilla : texte inchangé");

// --- 5) addDBData (import fichier) : neutralisation à l'import ---
globalThis.refreshDBList = () => {};
globalThis.setExternalDBFileStatus = () => {};
globalThis.fetch = undefined;

const xssPack = {
    id: "xss_import_test",
    gamemode: "maillon_faible",
    version: 1,
    pack_name: "XSS",
    pack_description: "",
    language: "fr",
    db: [{ question: "<script>alert(document.cookie)</script>Q", reponse: "<b>X</b>" }]
};

(async () => {
    await addDBData({ file: { text: async () => JSON.stringify(xssPack) } });
    const cached = JSON.parse(localStorage.getItem("db:xss_import_test"));
    assert(!!cached, "addDBData stocke le pack dans db:<id>");
    assert(cached.db[0].question === "&lt;script&gt;alert(document.cookie)&lt;/script&gt;Q", "addDBData external : question XSS neutralisée");
    assert(cached.db[0].reponse === "&lt;b&gt;X&lt;/b&gt;", "addDBData external : reponse sanitizée");
    assert(cached.url === null, "addDBData import fichier : url = null");

    console.log("Tous les tests passent.");
})();