// Smoke test hors navigateur des fonctions de gestion joueurs/équipes (modale).
// Usage : node tests/checks/smoke_player_teams.js
// Vérifie : trim/ajout, désassignation (null), auto-balance, renommage équipe effectif (C1/C2), undo suppression.
"use strict";

const { loadApp, buildGame } = require("../_harness.js");

loadApp();
const document = globalThis.document;

buildGame({ players: [], team1: "Les Rouges", team2: "Les Bleus" });
globalThis.global.cookie_expiration_delay = 365;
globalThis.global.current_language_strings = {
    team_default_name_0: "Equipe 1",
    team_default_name_1: "Equipe 2",
    players_capitalized: "Joueurs",
    player_unassigned: "Non assigné",
    player_rename: "Renommer",
    player_remove: "Supprimer",
    player_deleted_undo: "{name} supprimé",
    player_undo: "Annuler",
    player_team_select: "Équipe de {name}"
};

globalThis.game.player_list = [
    { id: 1, player_name: "Alice", team: "null" },
    { id: 2, player_name: "Bob", team: "team_1" },
    { id: 3, player_name: "Carl", team: "team_2" }
];
globalThis.game.team_1 = "Les Rouges";
globalThis.game.team_2 = "Les Bleus";

globalThis.menu_player_input = document.getElementById("menu_player_input");
globalThis.menu_player_input.value = "";
globalThis.menu_player_switch_team_mode = document.getElementById("menu_player_switch_team_mode");
globalThis.menu_player_switch_team_mode.checked = true;
globalThis.game.team_mode = true;

function assert(cond, label) {
    if (!cond) { console.error("ECHEC : " + label); process.exit(1); }
    console.log("OK : " + label);
}

addPlayer(" Zed ");
assert(game.player_list.length === 4, "addPlayer ajoute (4 joueurs)");
assert(game.player_list[3].player_name === "Zed", "nom trimé");
assert(game.player_list[3].team === "null", "nouveau joueur non assigné");

const count_before = game.player_list.length;
addPlayer("   ");
assert(game.player_list.length === count_before, "blanc seul refusé");

assignPlayerToTeam(2, "null");
assert(game.player_list.find(p => p.id === 2).team === "null", "désassignation (null) acceptée");
assignPlayerToTeam(2, "team_1");

autoBalanceTeams();
const c1 = game.player_list.filter(p => p.team === "team_1").length;
const c2 = game.player_list.filter(p => p.team === "team_2").length;
assert(c1 === 2 && c2 === 2, "auto-balance 2/2 (c1=" + c1 + ", c2=" + c2 + ")");
assert(game.player_list.filter(p => p.team === "null").length === 0, "plus aucun non assigné après équilibrage");

setTeamName("team_1", "   Geeks   ");
assert(game.team_1 === "Geeks", "setTeamName trie et met à jour game.team_1 (C1)");
assert(document.getElementById("menu_player_team_1_name").value === "Geeks", "input équipe 1 mis à jour");

setTeamName("team_1", "   ");
assert(game.team_1 === "Equipe 1", "nom vide → défaut langue (C2)");

const origNow = Date.now;
Date.now = () => 1234567890;
removePlayer(1);
Date.now = origNow;
assert(!game.player_list.some(p => p.id === 1), "joueur supprimé");
restoreDeletedPlayer("undo_player_1_1234567890");
assert(game.player_list.some(p => p.id === 1 && p.player_name === "Alice" && p.team === game.player_list.find(x => x.id === 1).team), "undo restaure le joueur (id conservé)");

// --- Cas limites ---
// Suppression du dernier joueur restant : la liste doit devenir vide sans crash.
Date.now = () => 9999;
for (const p of game.player_list.slice()) removePlayer(p.id);
Date.now = origNow;
assert(game.player_list.length === 0, "liste vide après suppression de tous les joueurs");
Date.now = () => 9999;
restoreDeletedPlayer("undo_player_1_9999");
Date.now = origNow;
assert(game.player_list.length === 1, "undo restaure un joueur sur liste vide");
assert(game.player_list[0].id === 1, "id du premier joueur conservé après restauration");

// Empilement de plusieurs undo avec ids écrasés : l'id doit être régénéré pour éviter les collisions.
const base_count = game.player_list.length;
Date.now = () => 8888;
removePlayer(game.player_list[0].id);
addPlayer("Zorro");
removePlayer(globalThis.game.player_list.find(p => p.player_name === "Zorro").id);
Date.now = origNow;
assert(game.player_list.every(p => new Set(game.player_list.map(x => x.id)).has(p.id) && game.player_list.filter(x => x.id === p.id).length === 1), "ids uniques après plusieurs suppressions puis ajout");
assert(game.player_list.filter(p => p.player_name === "Zorro").length === 0, "ajout puis suppression immédiate nette");

// autoBalanceTeams sur liste vide : pas de crash, équipes inchangées.
const t1v_before = game.team_1, t2v_before = game.team_2;
autoBalanceTeams();
assert(game.team_1 === t1v_before && game.team_2 === t2v_before, "autoBalanceTeams sur liste vide sans crash");

// autoBalanceTeams avec effectif impair : répartition 1/2 du tot.
addPlayer("Un");
addPlayer("Deux");
addPlayer("Trois");
autoBalanceTeams();
const entries = game.player_list.map(p => p.team);
assert(entries.filter(t => t === "team_1").length === 2 && entries.filter(t => t === "team_2").length === 1, "auto-balance 3 joueurs -> 2/1 (c1=" + entries.filter(t => t === "team_1").length + ", c2=" + entries.filter(t => t === "team_2").length + ")");

// setPlayerName avec valeur vide : conserve l'ancien nom.
const name_before = game.player_list.find(p => p.player_name === "Un").player_name;
setPlayerName(game.player_list.find(p => p.player_name === "Un").id, "   ");
assert(game.player_list.find(p => p.player_name === "Un").player_name === name_before, "nom vide refusé par setPlayerName");

// assignPlayerToTeam sur un id inexistant : pas de crash.
assignPlayerToTeam(4242, "team_1");
assert(true, "assignPlayerToTeam id inconnu sans crash");

// removePlayer sur un id inexistant : pas de crash.
removePlayer(4242);
assert(true, "removePlayer id inconnu sans crash");

// Mode équipes : porté par game.team_mode (persisté via SETTINGS_SCHEMA), plus par le DOM.
setTeamMode(false);
assert(game.team_mode === false, "setTeamMode(false) met à jour game.team_mode");
assert(!getPlayerRowTemplate(game.player_list[0]).includes("team_select"), "mode équipes coupé : pas de sélecteur d'équipe");
setTeamMode(true);
assert(game.team_mode === true, "setTeamMode(true) met à jour game.team_mode");
assert(getPlayerRowTemplate(game.player_list[0]).includes("team_select"), "mode équipes actif : sélecteur d'équipe affiché");

console.log("Tous les tests passent.");