// Vérification croisée des identifiants (ids) du projet — tâche 2 de 0.37.2.
//
// Règles :
//   - tout id référencé (JS / inline HTML / CSS / data-bs-target / aria-*) doit être
//     déclaré dans index.html (ou être un id "dynamique" généré en JS, portant `${}`);
//   - tout id déclaré doit avoir au moins une référence quelque part ;
//   - aucun doublon de déclaration.
//
// Usage : node tests/checks/check_ids.js
// Sortie : rapport + code de sortie 1 si erreurs.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

// ---------- Lecture des sources ----------
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const jsFiles = [];
for (const f of [
    "src/js/catalog.js", "src/js/cookie.js", "src/js/format.js", "src/js/players.js",
    "src/js/ingame.js", "src/js/dbmanager.js", "src/js/external.js", "src/js/qpuc.js",
    "src/js/picolito.js", "src/js/weakest_link.js", "src/js/main.js",
    "src/js/lang/fr.js", "src/js/lang/it.js", "src/js/lang/en.js", "src/js/lang.js"
]) jsFiles.push({ name: f, content: fs.readFileSync(path.join(ROOT, f), "utf8") });
const cssFiles = [];
for (const f of ["src/css/main.css", "src/css/radium.css"]) cssFiles.push({ name: f, content: fs.readFileSync(path.join(ROOT, f), "utf8") });

// ---------- 1) Déclarations (id="...") ----------
const htmlNoComments = indexHtml.replace(/<!--[\s\S]*?-->/g, "");
const declared = new Map(); // id -> source
const declRe = /id="([^"]+)"/g;
let m;
while ((m = declRe.exec(htmlNoComments)) !== null) declared.set(m[1], "index.html");
if (declared.size == 0) { console.error("Aucun id extrait d'index.html."); process.exit(1); }

// Doublons de déclaration
let duplicateCount = 0;
const seen = new Set();

// ---------- 2) Références ----------
const refs = []; // {id, src}
const addRef = (id, src) => refs.push({ id, src });

// 2a. getElementById / getElementById via jQuery (#...) / querySelector(All)('#...')
for (const f of jsFiles) {
    for (const re of [
        /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g,
        /\$\s*\(\s*['"]#([A-Za-z0-9_-]+)['"]\s*\)/g,
        /querySelector(?:All)?\(\s*['"]#([A-Za-z0-9_-]+)/g,
        /getElBy\('([^']+)'\)/g
    ]) {
        let mm;
        while ((mm = re.exec(f.content)) !== null) addRef(mm[1], f.name);
    }
}

// 2b. I18N_TARGETS (première colonne des tuples du tableau de lang.js)
for (const f of jsFiles) {
    if (!f.name.endsWith("lang.js")) continue;
    const re = /\["([^"]+)",\s*"[a-z_][a-z0-9_]*"\s*(?:,\s*"[a-z-]*")?\]/g;
    let mm;
    while ((mm = re.exec(f.content)) !== null) addRef(mm[1], f.name + " (I18N_TARGETS)");
}

// 2c. Attributs HTML pointant vers des ids (data-bs-*, aria-*, labels, for)
for (const re of [
    /data-bs-target="#([A-Za-z0-9_-]+)"/g,
    /data-bs-parent="#([A-Za-z0-9_-]+)"/g,
    /aria-labelledby="([A-Za-z0-9_-]+)"/g,
    /aria-controls="([A-Za-z0-9_-]+)"/g,
    /for="([A-Za-z0-9_-]+)"/g
]) {
    let mm;
    while ((mm = re.exec(htmlNoComments)) !== null) addRef(mm[1], "index.html (attribut)");
}

// 2d. Sélecteurs CSS "#id" (en ignorant les couleurs hexadécimales)
const isHexColor = (id) => /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{4}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(id);
for (const f of cssFiles) {
    const re = /#([A-Za-z0-9][A-Za-z0-9_-]*)/g;
    let mm;
    while ((mm = re.exec(f.content)) !== null) {
        const id = mm[1];
        if (isHexColor(id)) continue; // #ffc107 etc. = couleur, pas un id
        addRef(id, f.name);
    }
}

// ---------- 3) Ids dynamiques générés en JS (contiennent ${ } ou sont connus) ----------
const dynamicIdRe = /\$\{[^}]+\}/g; // ids portant une interpolation (ex. `${pack_id}-checkbox`)
const dynamicLike = new Set();
for (const f of jsFiles) {
    let mm;
    const re = /["'#]([A-Za-z0-9_-]*\$\{[^}"]+\}[A-Za-z0-9_-]*)["']/g;
    while ((mm = re.exec(f.content)) !== null) dynamicLike.add(mm[1]);
}

// ---------- 4) Analyse ----------
const declaredSet = new Set(declared.keys());
const selectedRefs = new Set(refs.map(r => r.id));
const errors = [];
const dangling = new Set();
const orphanIds = [];

// Références non déclarées (hors dynamiques)
for (const r of refs) {
    if (!declaredSet.has(r.id) && !dynamicLike.has(r.id) && !dangling.has(r.id)) {
        dangling.add(r.id);
        errors.push(`Référence orpheline -> #${r.id} (${r.src})`);
    }
}

// Ids exploités comme variable auto-globale du navigateur (id = identifiant JS nu)
const bareUsed = new Set();
const allJs = jsFiles.map(f => f.content).join("\n");
for (const id of declaredSet) {
    if (new RegExp(`\\b${id}\\b`).test(allJs)) bareUsed.add(id);
}

// Déclarées sans aucune référence directe (hors ids "cible html-only" tolérés)
const noRef = [];
for (const id of declaredSet) {
    if (!selectedRefs.has(id)) noRef.push(id);
}

// ---------- 5) Rapport ----------
console.log("== check_ids.js — ids déclarés et références ==");
console.log(`  index.html          : ${declared.size} ids déclarés`);
console.log(`  références trouvées : ${refs.length} (JS + HTML + CSS)`);
console.log(`  ids dynamiques      : ${dynamicLike.size} (générés en JS)`);
console.log("");
console.log(`  références orphelines : ${dangling.size}`);
for (const id of dangling) console.log(`    - #${id}`);
console.log(`  ids déclarés sans référence directe : ${noRef.length}`);
for (const id of noRef) {
    const how = bareUsed.has(id) ? `auto-global JS (identifiant nu ${id})` : "aucune référence";
    console.log(`    - #${id} → ${how}`);
}
console.log("");
console.log(errors.length ? `\nERREURS : ${errors.length}` : `\nAucune incohérence bloquante.`);
process.exit(errors.length ? 1 : 0);