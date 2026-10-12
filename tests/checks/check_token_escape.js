// Vérifie le correctif 5c : le backslash-dollar (\$) est un dollar littéral protégé du token $.
// Corrige le cas des phrases réelles contenant des dollars (popular_en), le cas hybride
// (default_en "earning only \\$10 ... drinks $ times") et les suffixes de langues (fi/nb/ru).
// Usage : node tests/checks/check_token_escape.js
"use strict";

const { loadApp, buildGame, stripHtml } = require("../_harness.js");

loadApp();
buildGame({ sip: { min: 3, max: 3 }, players: ["Alice", "Bob", "Carl"] });

const claims = [];
let failures = 0;

function check(name, actual, expected, mode) {
    const a = actual && actual.__playerAgnostic === true ? (mode === "html" ? actual : stripHtml(actual)) : (mode === "html" ? actual : stripHtml(actual));
    const ok = a === expected;
    if (!ok) failures++;
    claims.push(`${ok ? "OK  " : "FAIL"} ${name}\n     actual:   ${JSON.stringify(stripHtml(actual))}\n     expected: ${JSON.stringify(expected)}`);
    return ok;
}

// Compare le rendu en normalisant le joueur %s (choix aléatoire).
function expectedWithPlayer(playerNames, expectedPlayersIndependent) {
    // expectedPlayersIndependent contient déjà la structure ; on vérifie par regex ci-dessous.
    throw new Error("non utilisé");
}

function checkPattern(name, actual, pattern, mode) {
    const a = mode === "html" ? actual : stripHtml(actual);
    const ok = pattern.test(a);
    if (!ok) failures++;
    claims.push(`${ok ? "OK  " : "FAIL"} ${name}\n     actual:   ${JSON.stringify(a)}\n     pattern:  ${pattern}`);
    return ok;
}

// ----- \}$ protégé : dollars littéraux -----
{
    // popular_en.json:686 → "spent over \$100"
    const r1 = applyTokens("Never have I ever spent over \\$100 on a game or game items.", ["Alice", "Bob"], { team_1: "T1", team_2: "T2" }, { sip: "span_sip", player: "span_player", team: "span_team" });
    check("popular_en:686 \$100 reste littéral (applyTokens)", r1.formatted, "Never have I ever spent over $100 on a game or game items.");
    check("popular_en:686 aucune clé sip générée", r1.keys.length, 0, "html");

    // popular_en.json:701 → "higher value than \$10."
    const r2 = applyTokens("Never have I ever stole something with a higher value than \\$10.", ["Alice", "Bob"], { team_1: "T1", team_2: "T2" }, { sip: "span_sip", player: "span_player", team: "span_team" });
    check("popular_en:701 \$10 reste littéral (applyTokens)", r2.formatted, "Never have I ever stole something with a higher value than $10.");
    check("popular_en:701 aucune clé sip générée", r2.keys.length, 0, "html");
}

// ----- Cas hybride : \$10 littéral + token $ dans la même phrase -----
{
    const original = "For or against living eternally while earning only \\$10 a day? Everyone vote at the same time, losing group drinks $ times";
    const classMap = { sip: "span_sip", player: "span_player", team: "span_team" };
    const r = applyTokens(original, ["Alice", "Bob"], { team_1: "T1", team_2: "T2" }, classMap);

    // Le rendu texte : "$10" littéral + un nombre de gorgées
    const text = stripHtml(r.formatted);
    check("default_en:898 hybride \$10 + $ (texte)", text, "For or against living eternally while earning only $10 a day? Everyone vote at the same time, losing group drinks 3 times");
    check("default_en:898 hybride = 1 clé sip", r.keys.length, 1, "html");

    // Re-render via applyTextModifiers : le \$ doit rester protégé
    const re = applyTextModifiers(original, r.keys);
    const reText = stripHtml(re);
    check("default_en:898 re-render applyTextModifiers", reText, "For or against living eternally while earning only $10 a day? Everyone vote at the same time, losing group drinks 3 times");
}

// ----- $-sip supprimé (décision utilisateur) -----
{
    const c = { sip: "span_sip", player: "span_player", team: "span_team" };
    const r = applyTokens("%s must keep walking, you get a $ penalty each time you stop!", ["Alice", "Bob"], { team_1: "T1", team_2: "T2" }, c);
    checkPattern("default_en:301 $ penalty (texte)", r.formatted, /^(Alice|Bob) must keep walking, you get a 3 penalty each time you stop!$/);
    check("default_en:301 = 2 clés (player+sip)", r.keys.length, 2, "html");
}

// ----- Suffixes de langue légitimes (inchangés, régression) -----
{
    const c = { sip: "span_sip", player: "span_player", team: "span_team" };
    // fi : $n collé = suffixe grammatical finnois
    const r = applyTokens("%s palaa takaisin tulevaisuuteen! Sinun on puhuttava futuurissa, tai saat $n huikan sakot!", ["Alice", "Bob"], { team_1: "T1", team_2: "T2" }, c);
    checkPattern("default_fi:251 $n suffixe finnois", r.formatted, /^(Alice|Bob) palaa takaisin tulevaisuuteen! Sinun on puhuttava futuurissa, tai saat 3n huikan sakot!$/);

    // nb : $ slurker après suppression de la virgule
    const r2 = applyTokens("Verten deler ut $ slurker. Hvis det ikke finnes noen vert, skal %s dele dem ut", ["Alice", "Bob"], { team_1: "T1", team_2: "T2" }, c);
    checkPattern("default_nb:1585 $ slurker", r2.formatted, /^Verten deler ut 3 slurker\. Hvis det ikke finnes noen vert, skal (Alice|Bob) dele dem ut$/);

    // ru : $ глотка(ов)
    const r3 = applyTokens("ты делаешь $ глотка(ов), $, если нечетное!", ["Alice", "Bob"], { team_1: "T1", team_2: "T2" }, c);
    check("default_ru $ глотка(ов) double token", r3.formatted, "ты делаешь 3 глотка(ов), 3, если нечетное!");
    check("default_ru = 2 clés sip", r3.keys.length, 2, "html");
}

// ----- textReplacer end-to-end (phrase sans toucher à la couleur) -----
{
    globalThis.game.display_color_indicator = true;
    globalThis.game.quotes_indicator = "none";
    const template = "Never have I ever spent over \\$100 on a game or game items.";
    const res = textReplacer(template);
    check("textReplacer \$100 littéral (texte)", res.formatted_sentence, "Never have I ever spent over $100 on a game or game items.");
    if (res.is_modified === false) {
        claims.push(`OK   textReplacer \$100 is_modified=false\n     actual:   false\n     expected: false`);
    } else {
        failures++;
        claims.push(`FAIL textReplacer \$100 is_modified=false\n     actual:   ${JSON.stringify(res.is_modified)}\n     expected: false`);
    }
}

console.log(claims.join("\n"));
console.log("\n" + (failures === 0 ? "Tous les tests passent ✔" : `${failures} échec(s) ✘`));
process.exit(failures === 0 ? 0 : 1);