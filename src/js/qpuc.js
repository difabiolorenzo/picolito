// Mode Question pour un Champion : navigation/menus (depuis main.js) et
// mini-moteur de manches + génération de cartes + modificateur de phrase
// (depuis picolito.js).
// Dépend de format.js (textReplacer/applyTextModifiers/randomSip), de
// picolito.js (displaySentence...) et de ingame.js (updateDatabaseIndicator).

function selectQpucGamemodeType(gamemode_type_id) {
    game.qpuc.selected_gamemode_type = gamemode_type_id;
    game.qpuc.selected_packs = [];

    // On prépare les BDD cochées par défaut (celles de la langue d'affichage)
    renderQpucMenu();

    displayPage('question_pour_un_champion');
}

// Ajout/retrait d'un pack dans la sélection QPUC (depuis les checkboxes de la page jeu)

function updateSelectedQpucPack(element) {
    if (element.checked == true) {
        const exists = game.qpuc.selected_packs.some(p => p.pack_id === element.pack_id);
        if (!exists) {
            game.qpuc.selected_packs.push({ pack_id: element.pack_id, pack_source: element.pack_source });
        }
    } else {
        game.qpuc.selected_packs = game.qpuc.selected_packs.filter(p => p.pack_id !== element.pack_id);
    }
    document.getElementById("question_pour_un_champion_start_button").disabled = game.qpuc.selected_packs.length == 0;
}

// Tout cocher / tout décocher dans le menu QPUC

function toggleAllQpucPacks(checked) {
    document.querySelectorAll("#question_pour_un_champion_db_list input[type=checkbox]").forEach(cb => {
        cb.checked = checked;
        updateSelectedQpucPack({ checked: checked, pack_id: cb.dataset.packId, pack_source: cb.dataset.packSource });
    });
}

// Rendu de la page QPUC : rappel du type + listage des BDD activables

function renderQpucMenu() {
    const db_list = document.getElementById("question_pour_un_champion_db_list");
    if (!db_list) return;

    const type = game.qpuc.gamemode_types.find(t => t.id === game.qpuc.selected_gamemode_type);
    document.getElementById("question_pour_un_champion_selected_type").textContent = type ? global.current_language_strings[type.key] : "";

    const allDBs = DBManager.getAll().filter(db => db.gamemode == "question_pour_un_champion");

    db_list.innerHTML = allDBs.map(getQpucPackCheckboxTemplate).join("");

    const startButton = document.getElementById("question_pour_un_champion_start_button");
    if (startButton) startButton.disabled = game.qpuc.selected_packs.length == 0;
}

function getQpucPackCheckboxTemplate(db) {
    const pack_id = escapeHTML(db.id);
    const pack_source = escapeHTML(db.source);
    const pack_name = escapeHTML(db.pack_name);
    const checked = game.qpuc.selected_packs.some(p => p.pack_id === db.id) ? "checked" : "";

    let additionalData = "";
    if (pack_source != "vanilla" || game.only_display_current_language_databases == false) {
        additionalData = `<div class="d-flex justify-content-end">
                ${getLanguageBadgeHTML(db)}
                <span class="badge bg-dark m-1">${getSourceLabel(db.source)}</span>
            </div>`;
    }

    return `
        <div class="form-check form-switch col-12 col-sm-6 col-xl-4 col-xxl-3">
            <input class="form-check-input" type="checkbox" id="qpuc-${pack_id}-checkbox" ${checked}
                   data-pack-id="${pack_id}" data-pack-source="${pack_source}"
                   onclick="updateSelectedQpucPack({checked: this.checked, pack_id: '${pack_id}', pack_source: '${pack_source}'})">
            <div class="d-flex w-100 justify-content-between">
                <label class="form-check-label" for="qpuc-${pack_id}-checkbox">${pack_name}</label>
                <div class="d-flex justify-content-end gap-1">
                    ${additionalData}
                </div>
            </div>
        </div>`;
}

// Lancement de la partie QPUC avec les packs cochés

function startQpucGame() {
    if (game.qpuc.selected_packs.length == 0) return;
    selectGame({ gamemode_type: "question_pour_un_champion", packs: game.qpuc.selected_packs, qpuc_type: game.qpuc.selected_gamemode_type });
}

function buildQpucSentenceMarkup(player_sentence, question_sentence, answer, visible, sips) {
    const card = document.getElementById("qpuc_sentence_template").content.cloneNode(true);

    card.querySelector(".qpuc_player").innerHTML = player_sentence;
    card.querySelector(".qpuc_question").innerHTML = question_sentence;

    const answer_el = card.querySelector(".qpuc_reponse");
    answer_el.textContent = answer;
    answer_el.classList.toggle("d-none", !visible);

    const sips_el = card.querySelector(".qpuc_sips");
    if (sips != null) {
        sips_el.textContent = sips;
        sips_el.classList.remove("d-none");
    } else {
        sips_el.remove();
    }

    const reveal_el = card.querySelector(".qpuc_reveal_btn");
    reveal_el.setAttribute("aria-label", global.current_language_strings.qpuc_reveal_answer);
    reveal_el.classList.toggle("d-none", visible);

    const holder = document.createElement("div");
    holder.appendChild(card);
    return holder.innerHTML;
}

function generateQuestionPourUnChampionSentences(preferred_pack_id=null, allowed_types=null, forced_player=null) {
    // Aucune base de données
    const packs = game.current_gamemode.packs.filter(e => (e.gamemode == "question_pour_un_champion"))
    if (packs.length == 0) {
        console.error("Aucune base de données \"Question pour un Champion\"");
        return;
    }
    if (global.debug==true) console.log(packs)

    // Selection du pack (fallback sur l'ensemble si la manche n'a plus de question du type)
    let candidates = packs;
    if (allowed_types != null && Array.isArray(allowed_types)) {
        candidates = packs.filter(e => e.db.some(q => allowed_types.includes(q.type)));
        if (candidates.length == 0) {
            candidates = packs;
        }
    }

    let pack_id;
    if (preferred_pack_id != null && candidates.some(e => e.id == preferred_pack_id)) {
        pack_id = preferred_pack_id;
    } else if (preferred_pack_id != null) {
        const preferred = candidates.filter(e => e.id == preferred_pack_id);
        if (preferred.length == 0) { return; }
        pack_id = preferred[0].id;
    } else {
        const ran = Math.floor(rng() * candidates.length)
        pack_id = candidates[ran].id;
    }
    const pack = candidates.filter(e => (e.id == pack_id))[0]

    if (global.debug==true) console.log(pack_id, "===pack_id===");

    // Selection des questions du pack
    let db = pack.db

    // Filtre par type de question si demandé (ex. Mix restreint ou manche choisie)
    if (allowed_types != null && Array.isArray(allowed_types)) {
        const filtered = db.filter(e => allowed_types.includes(e.type));
        db = filtered.length > 0 ? filtered : db;
    }

    if (global.debug==true) console.log(pack)

    // Le pack séléctionné a-t-il encore des lignes ?
    const database_line_count = db.length;
    if (database_line_count == 0) { return; }

    let formatted_sentence = "";
    let original_sentence = "";
    let keys = [];

    function getRandomSentence() {
        const random_int = Math.floor(rng() * Math.floor(db.length));

        const entry = db[random_int];
        // %s : un joueur est désigné pour répondre à la question (tirage aléatoire, ou joueur forcé en 4QAS).
        // Le joueur et la question sont générés séparément pour être affichés dans des éléments distincts.
        const player_replacer = textReplacer(`%s`);
        const question_replacer = textReplacer(entry.question);
        original_sentence = `%s - ${entry.question}`;
        keys = player_replacer.keys.concat(question_replacer.keys);

        let player_sentence;
        if (forced_player != null) {
            const player_key = keys.find(k => k.type == "player");
            if (player_key) { player_key.value = forced_player; }
            player_sentence = applyTextModifiers(`%s`, keys.filter(k => k.type == "player"));
        } else {
            player_sentence = player_replacer.formatted_sentence;
        }

        // Question affichée, réponse cachée (révélée au clic) ou directement visible selon le réglage
        const visible = isQpucAnswerAlwaysVisible();
        const sips = game.current_gamemode.gamemode_type == "mix"
            ? global.current_language_strings.mix_qpuc_wrong_answer_sips.replace("%s", randomSip())
            : null;
        formatted_sentence = buildQpucSentenceMarkup(player_sentence, question_replacer.formatted_sentence, entry.reponse, visible, sips);
        pack_id = entry.pack_id ?? entry.bdd_id ?? pack.id; // bdd_id = compat ancien cache

        //remove question from db
        if (global.debug==true) console.log(random_int, formatted_sentence, "question \"question pour un champion\" supprimée")
        db.splice(random_int, 1);
    }

    getRandomSentence()
    game.qpuc.answer_revealed = isQpucAnswerAlwaysVisible();
    updateDatabaseIndicator(pack_id)
    displaySentence(formatted_sentence, "qpuc", pack_id);
    addHistoryItem(
        {
            posOffset: 0,
            original_sentence: original_sentence,
            sentence_keys: keys,
            formatted_sentence: formatted_sentence,
            type: "question_pour_un_champion",
            color: "qpuc",
            pack_id: pack_id,
            validated: false
        }
    );
    updateQpucScoreButtons();

    // La manche "Quatre à la suite" démarre son chrono dès la première carte
    if (game.qpuc.manche == "quatre_a_la_suite" && game.started == true) {
        startQ4Turn();
    }
}

function getQpucQuestionTypes() {
    const manche = game.current_gamemode.qpuc_type ?? game.qpuc.selected_gamemode_type;
    if (manche == null) return null;
    return [manche];
}

// Joueur dont c'est le tour en "Quatre à la suite" (null en mode carte classique)

function getQpucTurnPlayer() {
    if (game.qpuc.manche != "quatre_a_la_suite") return null;
    const player = game.player_list[game.qpuc.q4_player_index];
    return player ? player.player_name : null;
}

// Initialise le moteur selon la manche choisie au menu (appelé par initQuestionPourUnChampion)

function initQpucManche() {
    preloadSound("qpuc");

    const manche = game.current_gamemode.qpuc_type ?? game.qpuc.selected_gamemode_type;
    const scored_manches = ["neuf_points_gagnants", "quatre_a_la_suite"];
    game.qpuc.manche = scored_manches.includes(manche) ? manche : null;
    if (game.qpuc.manche == "quatre_a_la_suite" && game.player_list.length == 0) {
        // Sans joueur enregistré, pas de tours : on retombe sur le mode carte classique
        game.qpuc.manche = null;
    }
    game.qpuc.scores = {};
    game.qpuc.q4_streak = 0;
    game.qpuc.q4_remaining = 40;
    game.qpuc.q4_player_index = 0;

    if (game.qpuc.q4_timer) {
        clearInterval(game.qpuc.q4_timer);
        game.qpuc.q4_timer = null;
    }

    const panel = document.getElementById("qpuc_score_panel");
    if (panel) panel.classList.toggle("d-none", game.qpuc.manche == null);

    const type = game.qpuc.gamemode_types.find(t => t.id === game.qpuc.manche);
    const title = document.getElementById("qpuc_score_title");
    if (title) title.textContent = type && game.qpuc.manche != null ? global.current_language_strings[type.key] : "";

    if (game.qpuc.manche != null) {
        game.player_list.forEach(p => game.qpuc.scores[p.player_name] = 0);
    }

    updateQpucScorePanel();
}

// Réinitialise le moteur (fin/remise à zéro de la manche, sortie de partie)

function resetQpucManche() {
    if (game.qpuc.q4_timer) {
        clearInterval(game.qpuc.q4_timer);
        game.qpuc.q4_timer = null;
    }
    game.qpuc.manche = null;
    game.qpuc.answer_revealed = false;
    game.qpuc.scores = {};
    game.qpuc.q4_remaining = 40;
    game.qpuc.q4_streak = 0;
    game.qpuc.q4_player_index = 0;

    const panel = document.getElementById("qpuc_score_panel");
    if (panel) panel.classList.add("d-none");
}

function isQpucAnswerAlwaysVisible() {
    return game.qpuc != null && game.qpuc.answer_display == "visible";
}

// Réinitialise l'état de révélation quand une carte QPUC est (re)placée dans le flux

function resetQpucSentenceReveal() {
    const answer = document.querySelector("#ingame_sentence .qpuc_reponse");
    if (answer == null) return;
    const reveal_btn = document.querySelector("#ingame_sentence .qpuc_reveal_btn");
    if (isQpucAnswerAlwaysVisible()) {
        answer.classList.remove("d-none");
        if (reveal_btn) reveal_btn.classList.add("d-none");
        game.qpuc.answer_revealed = true;
    } else {
        answer.classList.add("d-none");
        if (reveal_btn) reveal_btn.classList.remove("d-none");
        game.qpuc.answer_revealed = false;
    }
    updateQpucScoreButtons();
}

// La carte courante porte-t-elle une réponse QPUC cachée ?

function isQpucHighlightedSentence() {
    return document.querySelector("#ingame_sentence .qpuc_reponse") != null;
}

// Révèle la réponse de la carte courante (premier clic en mode QPUC et Mix)

function revealQpucAnswer() {
    const allowed_gamemodes = ["question_pour_un_champion", "mix"];
    if (!allowed_gamemodes.includes(game.current_gamemode.gamemode_type)) return;

    const answer = document.querySelector("#ingame_sentence .qpuc_reponse");
    if (answer == null) return;

    answer.classList.remove("d-none");
    const reveal_btn = document.querySelector("#ingame_sentence .qpuc_reveal_btn");
    if (reveal_btn) reveal_btn.classList.add("d-none");
    game.qpuc.answer_revealed = true;

    updateQpucScoreButtons();
}

// Affichage du panneau de score (scores, tour, chrono)

function updateQpucScorePanel() {
    const panel = document.getElementById("qpuc_score_panel");
    if (panel == null) return;
    if (game.qpuc.manche == null) {
        panel.classList.add("d-none");
        return;
    }
    panel.classList.remove("d-none");

    const is_q4 = game.qpuc.manche == "quatre_a_la_suite";
    const tiles_holder = document.getElementById("qpuc_players_scores");
    const bar_holder = document.getElementById("qpuc_progression_bar");
    const timer = document.getElementById("qpuc_score_timer");
    const text = document.getElementById("qpuc_score_text");

    if (tiles_holder) {
        const show_tiles = game.qpuc.manche == "neuf_points_gagnants";
        tiles_holder.classList.toggle("d-none", !show_tiles);
        if (show_tiles) tiles_holder.innerHTML = renderQpucPlayersTiles();
    }

    if (bar_holder) {
        bar_holder.classList.toggle("d-none", !is_q4);
        if (is_q4) bar_holder.innerHTML = renderQpucProgressionBar();
    }

    if (timer) {
        if (is_q4 && game.started == true) {
            timer.classList.remove("d-none");
            timer.textContent = global.current_language_strings.qpuc_q4_timer.replace("%s", formatQpucTime(game.qpuc.q4_remaining));
            timer.classList.toggle("qpuc_timer_danger", game.qpuc.q4_remaining <= 10);
        } else {
            timer.classList.add("d-none");
        }
    }

    if (text) {
        if (is_q4) {
            const current_player = escapeHTML(getQpucTurnPlayer() || "?");
            const streak = global.current_language_strings.qpuc_q4_streak.replace("%s", game.qpuc.q4_streak);
            text.innerHTML = global.current_language_strings.qpuc_q4_turn.replace("%s", current_player) + " — " + streak;
        } else {
            const player_names = Object.keys(game.qpuc.scores);
            text.innerHTML = player_names.map(n => escapeHTML(n) + ": " + game.qpuc.scores[n]).join(" · ") || "&nbsp;";
        }
    }

    updateQpucScoreButtons();
}

// Tuiles de score par joueur (manche 9 points gagnants) — style qpucJS

function renderQpucPlayersTiles() {
    const player_names = Object.keys(game.qpuc.scores);
    if (player_names.length == 0) return "";
    const current_item = game.sentence_history[game.cycle_id];
    const current_player = current_item ? getQpucDesignatedPlayer(current_item) : null;
    return player_names.map(name => {
        const tile_class = ["qpuc_player_tile", name == current_player ? "qpuc_tile_current" : "qpuc_tile_idle"];
        return `<div class="${tile_class.join(" ")}"><span class="qpuc_player_name">${escapeHTML(name)}</span><span class="qpuc_player_score">${game.qpuc.scores[name]}</span></div>`;
    }).join("");
}

// Barre de progression "Quatre à la suite" (cellules 4→0) — style qpucJS

function renderQpucProgressionBar() {
    let html = "";
    for (let value = 4; value >= 0; value--) {
        let cls = "qpuc_progression_cell";
        if (game.qpuc.q4_streak > value) cls += " qpuc_cell_passed";
        if (game.qpuc.q4_streak == value) cls += " qpuc_cell_selected";
        html += `<div class="${cls}"><p class="qpuc_progression_value">${value}</p></div>`;
    }
    return html;
}

// Active/désactive les boutons de validation selon l'état de révélation

function updateQpucScoreButtons() {
    const enabled = game.qpuc.manche != null && game.qpuc.answer_revealed == true;
    const good = document.getElementById("qpuc_validate_good");
    const bad = document.getElementById("qpuc_validate_bad");
    if (good) good.disabled = !enabled;
    if (bad) bad.disabled = !enabled;
}

// Validation d'une réponse par le groupe (moteur à points)

function validateQpucAnswer(correct) {
    if (game.qpuc.manche == null) return;
    if (game.qpuc.answer_revealed == false) return;

    const history_item = game.sentence_history[game.cycle_id];
    if (history_item == null || history_item.validated == true) {
        incrementCycleID();
        return;
    }
    history_item.validated = true;

    if (game.qpuc.manche == "neuf_points_gagnants") {
        const player = getQpucDesignatedPlayer(history_item);
        if (correct == true && player != null) {
            game.qpuc.scores[player] = (game.qpuc.scores[player] || 0) + 1;
            playsound("qpuc_points");
            updateQpucScorePanel();
            if (game.qpuc.scores[player] >= 9) {
                playsound("qpuc_qualif");
                showQpucMancheWon(player);
                resetQpucManche();
                incrementCycleID();
                return;
            }
        } else if (correct == false) {
            playsound("qpuc_wrong_answer");
            applyQpucWrongPenalty(player);
        }
    }

    if (game.qpuc.manche == "quatre_a_la_suite") {
        if (correct == true) {
            game.qpuc.q4_streak++;
            playsound("qpuc_points");
            updateQpucScorePanel();
            if (game.qpuc.q4_streak >= 4) {
                playsound("qpuc_qualif");
                showQpucMancheWon(getQpucTurnPlayer());
                resetQpucManche();
                incrementCycleID();
                return;
            }
        } else {
            game.qpuc.q4_streak = 0;
            playsound("qpuc_wrong_answer");
            updateQpucScorePanel();
            applyQpucWrongPenalty(getQpucTurnPlayer());
        }
    }

    incrementCycleID();
}

// Joueur désigné par la carte courante (clé %s de l'historique)

function getQpucDesignatedPlayer(history_item) {
    const keys = history_item.sentence_keys || [];
    const player_key = keys.find(k => k.type == "player");
    return player_key ? player_key.value : null;
}

// Pénalité "mauvaise réponse" : le répondant boit des gorgées aléatoires

function applyQpucWrongPenalty(player) {
    const penalty = randomSip();
    const template = global.current_language_strings.qpuc_wrong_sip;
    showToast(template.replace("%s", escapeHTML(player || "?")).replace("%d", penalty));
}

// Message de victoire de manche

function showQpucMancheWon(player_name) {
    showToast(global.current_language_strings.qpuc_manche_won.replace("%s", escapeHTML(player_name || "?")));
}

// Démarre le chrono d'un tour "Quatre à la suite" (40 secondes)

function startQ4Turn() {
    if (game.qpuc.q4_timer != null) return;
    game.qpuc.q4_remaining = 40;
    game.qpuc.q4_streak = 0;
    playsound("qpuc_timer");
    updateQpucScorePanel();

    game.qpuc.q4_timer = setInterval(() => {
        game.qpuc.q4_remaining--;
        updateQpucScorePanel();
        if (game.qpuc.q4_remaining <= 0) {
            clearInterval(game.qpuc.q4_timer);
            game.qpuc.q4_timer = null;
            playsound("qpuc_timeout");
            endQ4Turn();
        }
    }, 1000);
}

// Fin du tour 4QAS (chrono écoulé) : meilleure série enregistrée, joueur suivant

function endQ4Turn() {
    if (game.player_list.length == 0) {
        resetQpucManche();
        return;
    }

    const current_player = getQpucTurnPlayer();
    if (current_player != null) {
        game.qpuc.scores[current_player] = Math.max(game.qpuc.scores[current_player] || 0, game.qpuc.q4_streak);
    }
    updateQpucScorePanel();

    const next_index = (game.qpuc.q4_player_index + 1) % game.player_list.length;
    if (next_index == 0) {
        // Chaque joueur a joué son tour : la meilleure série l'emporte
        const winner_name = Object.keys(game.qpuc.scores).reduce((a, b) => game.qpuc.scores[a] >= game.qpuc.scores[b] ? a : b, Object.keys(game.qpuc.scores)[0]);
        showQpucMancheWon(winner_name);
        resetQpucManche();
        return;
    }

    game.qpuc.q4_player_index = next_index;
    game.qpuc.q4_remaining = 40;
    game.qpuc.q4_streak = 0;
    updateQpucScorePanel();
    showToast(global.current_language_strings.qpuc_q4_next.replace("%s", escapeHTML(getQpucTurnPlayer() || "?")));
}

function formatQpucTime(total_seconds) {
    const min_length = Math.floor(total_seconds / 60);
    const sec_length = Math.floor(total_seconds % 60);
    return `${min_length}:${String(sec_length).padStart(2, "0")}`;
}

function userActionClickSentence() {
    const gamemode_type = game.current_gamemode.gamemode_type;
    if (game.started == true && (
        gamemode_type == "picolo" || 
        gamemode_type == "war" || 
        gamemode_type == "je_n_ai_jamais" || 
        gamemode_type == "mix" ||
        gamemode_type == "question_pour_un_champion")
    ) {
        if (game.debug == true) {
            showSentenceModifierModal();
        } else if (gamemode_type == "question_pour_un_champion" && game.qpuc.answer_revealed == false && isQpucHighlightedSentence()) {
            // Premier clic en mode QPUC : on révèle la réponse avant de passer à la phrase suivante
            revealQpucAnswer();
        } else if (gamemode_type == "mix" && game.qpuc.answer_revealed == false && !isQpucAnswerAlwaysVisible() && isQpucHighlightedSentence()) {
            // Premier clic en mode Mix sur une carte QPUC : on révèle la réponse avant de passer à la phrase suivante
            revealQpucAnswer();
        } else {
            incrementCycleID();
        }
    }
}
