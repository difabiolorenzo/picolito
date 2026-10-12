// Gestion des joueurs, des équipes (mode guerre) et de l'annulation de suppression.
// Utilise format.js (escapeHTML) et cookie.js (storePlayerListCookie).

function addPlayer(player_name) {
    const trimmed_name = String(player_name || "").trim();
    if (trimmed_name == "") {
        return;
    }
    // DEV MODE
    if (menu_player_input.value.toLowerCase() == "lyoko") {
        menu_player_input.value = "";
        global.modal_player_menu.hide()

        DEBUG_carthage(true);
        return;
    }
    if (menu_player_input.value.toLowerCase() == "terre") {
        menu_player_input.value = "";
        global.modal_player_menu.hide()

        DEBUG_carthage(false);
        return;
    }

    const id = game.player_list.length > 0 ? game.player_list[game.player_list.length - 1].id + 1 : 1;
    game.player_list.push({ id, player_name: trimmed_name, team: "null" });
    refreshPlayerList();
    document.getElementById("menu_player_input").value = "";
    document.getElementById("menu_player_input").focus();
}

function refreshTeamCounters() {
    const container = document.getElementById("menu_player_counters");
    if (!container) { return; }

    const total = game.player_list.length;
    const team_mode = game.team_mode;
    const unassigned_label = global.current_language_strings.player_unassigned;
    const players_label = global.current_language_strings.players_capitalized;

    const team_data = [
        { cls: "team_badge_1", label: game.team_1 },
        { cls: "team_badge_2", label: game.team_2 },
        { cls: "team_badge_neutral", label: unassigned_label }
    ];

    const team_badges = team_data.map(team =>
        `<span class="badge rounded-pill ${team.cls}">${escapeHTML(team.label)} : ${countTeamPlayers(team.cls)}</span>`
    ).join("");

    container.innerHTML =
        `<span class="badge rounded-pill bg-secondary">${escapeHTML(players_label)} : ${total}</span>` +
        (team_mode ? team_badges : "");
}

function countTeamPlayers(badge_class) {
    const key_map = { team_badge_1: "team_1", team_badge_2: "team_2", team_badge_neutral: "unassigned" };
    const target = key_map[badge_class];

    if (target === "unassigned") {
        return game.player_list.filter(player => player.team !== "team_1" && player.team !== "team_2").length;
    }
    return game.player_list.filter(player => player.team === target).length;
}

function refreshPlayerList() {
    const playerListElement = document.getElementById("menu_player_list");
    playerListElement.innerHTML = "";

    playerListElement.innerHTML = game.player_list.map(player => getPlayerRowTemplate(player)).join("");
    storePlayerListCookie();
    refreshTeamCounters();
}

function getPlayerRowTemplate(player) {
    const team = player.team;
    const team_mode = game.team_mode;
    const is_assigned = team_mode && (team == "team_1" || team == "team_2");
    const team_name = team == "team_1" ? game.team_1 : team == "team_2" ? game.team_2 : "";
    const unassigned_label = global.current_language_strings.player_unassigned;
    const remove_label = global.current_language_strings.player_remove;
    const team_select_aria = (global.current_language_strings.player_team_select || "").replace("{name}", player.player_name);

    return `
        <div id="player_item_${player.id}" class="d-flex flex-row justify-content-between align-items-center mb-3 gap-2">
            <div class="input-group flex-grow-1" style="flex-basis: 0;">
                <span class="input-group-text team_name_dot ${is_assigned ? "team_badge_" + team.replace("team_", "") : "team_badge_neutral"}"><span class="team_badge_dot"></span></span>
                <input id="player_name_input_${player.id}" type="text" class="form-control" maxlength="50" value="${escapeHTML(player.player_name)}"
                       onchange="setPlayerName(${player.id}, this.value)"
                       onkeydown="if(event.key === 'Enter'){this.blur();}">
            </div>
            <div class="d-flex align-items-center flex-shrink-0">
                ${team_mode
                    ? `<select class="form-select team_select" onchange="assignPlayerToTeam(${player.id}, this.value)" aria-label="${escapeHTML(team_select_aria)}">
                        <option value="null" ${!is_assigned ? "selected" : ""}>${escapeHTML(unassigned_label)}</option>
                        <option value="team_1" ${team == "team_1" ? "selected" : ""}>${escapeHTML(game.team_1)}</option>
                        <option value="team_2" ${team == "team_2" ? "selected" : ""}>${escapeHTML(game.team_2)}</option>
                    </select>`
                    : ""}
                <button class="btn btn-danger" onclick="removePlayer(${player.id})" title="${escapeHTML(remove_label)}" aria-label="${escapeHTML(remove_label)}">
                    <i class="bi me-2 bi-trash"></i>
                </button>
            </div>
        </div>`;
}

function setTeamMode(enabled) {
    game.team_mode = enabled === true;
    refreshTeamDisplay();
    storeSettingsCookie();
}

// Affiche/masque les contrôles d'équipe sans re-rendre la liste (sûr à l'init, avant le chargement des joueurs)
function applyTeamModeVisibility() {
    const team_mode = game.team_mode;
    document.getElementById("menu_player_team_placeholder").classList.toggle("d-none", !team_mode);
    document.getElementById("menu_player_auto_balance").classList.toggle("d-none", !team_mode);
    document.getElementById("menu_player_team_1_name").value = game.team_1;
    document.getElementById("menu_player_team_2_name").value = game.team_2;
}

function refreshTeamDisplay() {
    applyTeamModeVisibility();
    refreshPlayerList();
}

function setTeamName(team_id, value) {
    const is_team_1 = team_id == "team_1";
    const default_name = is_team_1
        ? global.current_language_strings.team_default_name_0
        : global.current_language_strings.team_default_name_1;
    const clean_name = String(value || "").trim();
    game[is_team_1 ? "team_1" : "team_2"] = clean_name !== "" ? clean_name : default_name;
    refreshTeamDisplay();
    storeSettingsCookie();
}

const pending_undeletes = [];

function removePlayer(id) {
    const index = game.player_list.findIndex(player => player.id === id);
    if (index === -1) { return; }
    const [removed] = game.player_list.splice(index, 1);
    refreshPlayerList();
    storePlayerListCookie();
    const undo_id = "undo_player_" + removed.id + "_" + Date.now();
    for (let i = pending_undeletes.length - 1; i >= 0; i--) {
        if (pending_undeletes[i].player.id === removed.id) { pending_undeletes.splice(i, 1); }
    }
    pending_undeletes.push({ undo_id, player: removed });
    showUndoToast(removed, undo_id);
}

function showUndoToast(player, undo_id) {
    const container = document.getElementById("toast_container");
    if (!container) { return; }
    const toast = document.createElement("div");
    toast.className = "toast align-items-center bg-dark text-white border-0";
    toast.setAttribute("role", "alert");
    toast.innerHTML = `<div class="d-flex align-items-center">
            <div class="toast-body"></div>
            <button type="button" class="btn btn-link btn-sm text-info me-2" data-undo="${undo_id}">${escapeHTML(global.current_language_strings.player_undo)}</button>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    const body = toast.querySelector(".toast-body");
    body.textContent = (global.current_language_strings.player_deleted_undo || "").replace("{name}", player.player_name);
    toast.querySelector("[data-undo]").addEventListener("click", () => restoreDeletedPlayer(undo_id));
    container.appendChild(toast);
    const bootstrapToast = new bootstrap.Toast(toast, { delay: 6000 });
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
    bootstrapToast.show();
}

function restoreDeletedPlayer(undo_id) {
    const item = pending_undeletes.find(entry => entry.undo_id === undo_id);
    if (!item) { return; }
    const restored = item.player;
    pending_undeletes.splice(pending_undeletes.indexOf(item), 1);
    if (game.player_list.some(player => player.id === restored.id)) {
        restored.id = game.player_list.length > 0 ? game.player_list[game.player_list.length - 1].id + 1 : 1;
    }
    game.player_list.push(restored);
    refreshPlayerList();
    storePlayerListCookie();
    const toast = document.querySelector(`[data-undo="${undo_id}"]`)?.closest(".toast");
    if (toast) { bootstrap.Toast.getOrCreateInstance(toast).hide(); }
}

function setPlayerName(id, value) {
    const player = game.player_list.find(player => player.id === id);
    if (!player) { return; }
    const clean_name = String(value || "").trim();
    if (clean_name !== "") {
        player.player_name = clean_name;
    }
    refreshPlayerList();
}

function autoBalanceTeams() {
    if (game.player_list.length === 0) { return; }
    const target = Math.ceil(game.player_list.length / 2);
    // Répartition aléatoire équilibrée : on re-mélange TOUS les joueurs
    // (même déjà assignés), équipe 1 = ceil(n/2), équipe 2 = le reste.
    const shuffled = game.player_list
        .map((player, index) => ({ player, index, rand: Math.random() }))
        .sort((a, b) => a.rand - b.rand || a.index - b.index)
        .map(entry => entry.player);
    shuffled.forEach((player, i) => {
        player.team = i < target ? "team_1" : "team_2";
    });
    refreshPlayerList();
    storePlayerListCookie();
}

function assignPlayerToTeam(id, team) {
    const player = game.player_list.find(player => player.id === id);
    if (player) {
        player.team = team;
    }
    refreshPlayerList();
}
