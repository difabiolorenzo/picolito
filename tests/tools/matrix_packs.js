// Re-genere un « semblable » de excel.png : matrice des liens entre les
// familles de packs Picolo, les types (1-25 et types nommes), les actions et
// les couleurs.
//
//   node tests/tools/matrix_packs.js             # tableau console
//   node tests/tools/matrix_packs.js --html       # + écrit tests/output/matrix_packs.html (ouvrable)
//
// Lecture : src/db/picolo/{bar,default,hot,silly,war}_*.json
//   - colonnes de gauche : type, interpretation, nature (familles), couleurs
//   - colonnes de droite  : valeurs exactes de player_count declenchees par
//     family (union sur les filters, triees, ex. « 0,1,2 »), ou « X » quand
//     l'action n'est pas applicable a ce mode.
//   - en note (hors cellules) : types declares dans filters sans phrase dans
//     la db, avec les langues concernees (derive du mapping de types,
//     cf. version 0.37.2 tache 1).
// La table INTERPRETATIONS est a maintenir (draft issu des phrases FR reelles).
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const DB_DIR = path.join(ROOT, "src", "db", "picolo");
const FAMILIES = ["bar", "default", "hot", "silly", "war"];

// Draft des interpretations (a completer/valider).
const INTERPRETATIONS = {
    1: "Action",
    2: "Action hot / contrainte",
    3: "Regle / obligation collective",
    4: "Devinez qui / jeu de mots",
    5: "Cul sec",
    6: "Cul sec / humiliation",
    7: "Cul sec / action hot",
    8: "Guerre : question (gorgees en jeu)",
    9: "Guerre : duel de mots",
    10: "Guerre : combat de blabla",
    11: "Guerre : defi sport",
    12: "Guerre : liste / vocabulaire",
    13: "Guerre : comparaison physique",
    14: "Devinez qui / vote",
    15: "Social (ancien numero, = social_posting)",
    16: "Bar : devinez qui",
    17: "Bar : commande / tournee",
    18: "Bar : action osee",
    19: "Bar : defi / sous-fifre",
    20: "Bar : trouver une personne",
    21: "Bar : marque / gage",
    22: "Bar : dessine et fais deviner",
    23: "Devinez qui / Noir ou Blanc",
    24: "Jugement / devinez qui selon",
    25: "Genre / distribue ou bois",
    virus_individual: "Virus individuel",
    virus_global: "Virus global",
    social_posting: "Publication reseau social",
};

const COLOR_FR = { blue: "bleu", yellow: "jaune", green: "vert", red: "rouge" };

// Teintes de fond pour les cellules « type » et « couleurs » du rendu HTML.
const CSS_COLOR = { bleu: "#cfe0ff", jaune: "#ffe9ad", vert: "#c9e8c9", rouge: "#ffd0d0" };

function loadFamily(fam) {
    const filters = {}; // type -> { colors:Set, min, max }
    const dbMiss = {};  // type -> Set(langues) sans phrase dans la db
    const files = fs.readdirSync(DB_DIR)
        .filter((f) => f.startsWith(fam + "_") && f.endsWith(".json"))
        .sort();
    for (const f of files) {
        const lang = f.replace(/^[a-z]+_(.+?)\.json$/, "$1");
        const p = JSON.parse(fs.readFileSync(path.join(DB_DIR, f), "utf8"));
        for (const ft of Object.values(p.filters || {})) {
            const t = String(ft.type);
            const cur = (filters[t] = filters[t] || { colors: new Set(), players: new Set() });
            if (ft.color) cur.colors.add(ft.color);
            for (const nb of ft.player_count || []) cur.players.add(nb);
        }
        const have = new Set((p.db || []).map((e) => String(e.type)));
        for (const t of Object.keys(filters)) {
            if (!have.has(t)) (dbMiss[t] = dbMiss[t] || new Set()).add(lang);
        }
    }
    return { filters, dbMiss };
}

function typeSort(a, b) {
    const na = /^\d+$/.test(a), nb = /^\d+$/.test(b);
    if (na && nb) return Number(a) - Number(b);
    if (na) return -1;
    if (nb) return 1;
    return a.localeCompare(b);
}

function buildMatrix() {
    const famData = {};
    for (const fam of FAMILIES) famData[fam] = loadFamily(fam);
    const types = new Set();
    for (const fam of FAMILIES) for (const t of Object.keys(famData[fam].filters)) types.add(t);
    const rows = [];
    for (const t of [...types].sort(typeSort)) {
        const cells = [];
        const colors = new Set();
        const missing = new Set();
        for (const fam of FAMILIES) {
            const f = famData[fam].filters[t];
            let c = "X";
            if (f) {
                c = [...f.players].sort((a, b) => a - b).join(",");
                for (const col of f.colors) colors.add(col);
            }
            for (const l of (famData[fam].dbMiss[t] || [])) missing.add(l);
            cells.push(c);
        }
        const cell = {};
        FAMILIES.forEach((fam, i) => (cell[fam] = cells[i]));
        const nature = FAMILIES.filter((fam) => cell[fam] !== "X").sort((a, b) => FAMILIES.indexOf(a) - FAMILIES.indexOf(b));
        rows.push({
            type: t,
            interpretation: INTERPRETATIONS[t] || "?",
            nature: nature.join(","),
            colors: [...colors].map((c) => COLOR_FR[c] || c).join(",") || "-",
            fams: cell,
            missing: [...missing].sort(),
        });
    }
    return rows;
}

function pad(s, w) {
    s = String(s);
    return s.length >= w ? s : s + " ".repeat(w - s.length);
}

function renderText(rows) {
    const w = { type: 18, interp: 34, nature: 22, colors: 10 };
    const famW = 12;
    const line = (r) =>
        pad(r.type, w.type) + pad(r.interpretation, w.interp) +
        pad(r.nature, w.nature) + pad(r.colors, w.colors) +
        FAMILIES.map((f) => pad(r.fams[f], famW)).join("");
    const sep = "-".repeat(w.type + w.interp + w.nature + w.colors + famW * FAMILIES.length);
    const header = pad("type", w.type) + pad("interpretations", w.interp) +
        pad("nature", w.nature) + pad("couleurs", w.colors) +
        FAMILIES.map((f) => pad(f, famW)).join("");
    console.log(header);
    console.log(sep);
    for (const r of rows) console.log(line(r));
    console.log(sep);
    console.log("Valeurs = joueurs touches (player_count des filters, union par famille). « X » : non applicable a ce mode.");
    const traced = rows.filter((r) => r.missing.length);
    if (traced.length) {
        console.log("Trace (type declare sans phrase dans la db, tache 1) :");
        for (const r of traced) console.log(`  ${pad(r.type, 16)} ${r.missing.join(", ")}`);
    }
}

function renderHtml(rows) {
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const th = (s) => `<th>${esc(s)}</th>`;
    const td = (s, dark) => `<td${dark ? ' class="x"' : ""}>${esc(s)}</td>`;
    const colCell = (text, colorLabel) => {
        const c = String(colorLabel).split(",")[0];
        return `<td${CSS_COLOR[c] ? ` class="bg-${c}"` : ""}>${esc(text)}</td>`;
    };
    const head = FAMILIES.map((f) => th(f)).join("");
    const traced = rows.filter((r) => r.missing.length);
    const tracedHtml = traced.length
        ? `<h3>Trace (type declare sans phrase dans la db, tache 1)</h3>\n<ul>\n` +
          traced.map((r) => ` <li><b>${esc(r.type)}</b> : ${esc(r.missing.join(", "))}</li>\n`).join("") +
          `</ul>\n`
        : "";
    let body = "";
    for (const r of rows) {
        const fams = FAMILIES.map((f) => (r.fams[f] === "X" ? td("X", true) : td(r.fams[f]))).join("");
        body += `<tr>${colCell(r.type, r.colors)}${td(r.interpretation)}${td(r.nature)}${colCell(r.colors, r.colors)}${fams}</tr>\n`;
    }
    return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<title>Matrice Picolo (semblable de excel.png)</title>
<style>
body{font-family:sans-serif;margin:24px}
table{border-collapse:collapse}
th,td{border:1px solid #999;padding:5px 9px;text-align:center;font-size:13px}
th{background:#eee}
td.x{background:#222;color:#fff}
td:first-child{font-weight:bold}
.bg-bleu{background:#cfe0ff}.bg-jaune{background:#ffe9ad}
.bg-vert{background:#c9e8c9}.bg-rouge{background:#ffd0d0}
</style></head>
<body><h2>Matrice Picolo — types / actions / couleurs / nb_players par famille</h2>
<table><tr><th>type</th><th>interpretations</th><th>nature</th><th>couleurs</th>${head}</tr>
${body}</table>
<p style="color:#666">Valeurs = joueurs touches (player_count des filters, union par famille). « X » sur fond sombre : non applicable a ce mode.</p>
${tracedHtml}
</body></html>`;
}

const useHtml = process.argv.includes("--html");
const rows = buildMatrix();
renderText(rows);
if (useHtml) {
    const out = path.join(__dirname, "..", "output", "matrix_packs.html");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, renderHtml(rows));
    console.log("HTML ecrit :", out);
}
process.exit(0);