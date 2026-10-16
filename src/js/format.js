// Formatage et chaîne de transformation des phrases : tokens, gorgées, quotes,
// sanitisation, modificateur de phrase et listes (format.js).
// Dépend de rien de particulier (lit game/global au moment de l'appel).

function replaceAt(string, index, replace, length) {
    if (typeof string !== "string") return "";

    // length doit être un nombre
    length = Number(length) || 0;

    return (
        string.substring(0, index) +
        replace +
        string.substring(index + length)
    );
}

function getLastCharacter(text) {
    return text.substr(text.length - 1, 1);
}

function getActualBackgroundColorByHistory() {
    if (game.cycle_id >= 0 && game.sentence_history[game.cycle_id] != undefined) {
        return game.sentence_history[game.cycle_id].color;
    } else {
        return "black";
    }
}

function addHistoryItem({
    posOffset=undefined,
    original_sentence=undefined,
    sentence_keys=undefined,
    formatted_sentence=undefined,
    key=undefined,
    type=undefined,
    family=undefined,
    color=undefined,
    pack_id=undefined,
    validated=undefined,
    infos=undefined,
}
) {
    const sentence_history_item = {
        original_sentence: original_sentence,
        sentence_keys: sentence_keys,
        formatted_sentence: formatted_sentence,
        key: key,
        type: type,
        family: family,
        color : color,
        pack_id : pack_id,
        validated : validated,
        infos : infos,
    }

    // Une suite (posOffset > 0) n'est pas écrite d'avance dans l'historique : elle attend dans la
    // file des suites et prend place, à son échéance, entre deux cartes (playPendingSuite, picolito.js).
    if (posOffset > 0) {
        getPendingSuites().push({ due: game.cycle_id + posOffset, item: { ...sentence_history_item, is_suite: true } });
        return;
    }
    game.sentence_history[game.cycle_id] = sentence_history_item;
}

// File des suites en attente : [{ due, item }], due = carte à partir de laquelle la suite peut passer.
function getPendingSuites() {
    if (!Array.isArray(game.pending_suites)) game.pending_suites = [];
    return game.pending_suites;
}

function randomSip() {
    const sip_min = game.sip.min;
    const sip_max = game.sip.max;
    const step = sip_max - sip_min;

    const random_sip = Math.floor(rng() * (step + 1)) + sip_min;

    return random_sip;
}

function escapeHTML(text) {
    return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function sanitizeExternalText(text) {
    return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getSpanClasses() {
    if (game.display_color_indicator == true) {
        return {
            sip: "span_highlight span_sip",
            player: "span_highlight span_player",
            team: "span_highlight span_team"
        };
    }
    return { sip: "", player: "", team: "" };
}

// Attribution des joueurs et de l'équipe d'une carte, partagée avec sa suite :
//   players[i] = index (dans player_name_list) du joueur %{i+1}, et du (i+1)-ème %s d'un ancien pack ;
//   team       = équipe de tous les %t.
// Ainsi « %1 est le serveur » puis « %1 rend son tablier » désignent le même joueur, et pour un ancien
// pack le n-ième %s d'une suite reprend le n-ième joueur de la carte (voir refonte_des_bases.md §5.8).
function newTokenAssignment() {
    return { players: [], team: undefined };
}

function applyTokens(template, player_name_list, teams, spanClasses, assignment = newTokenAssignment()) {
    const keys = [];
    let is_modified = false;
    let legacy_rank = 0; // rang du prochain %s dans ce texte

    // Joueur de la position `slot` : déjà attribué, sinon tiré parmi les joueurs pas encore attribués.
    const playerAt = (slot) => {
        if (assignment.players[slot] === undefined) {
            const used = new Set(assignment.players.filter((i) => i !== undefined));
            const free = player_name_list.map((_, i) => i).filter((i) => !used.has(i));
            if (free.length === 0) return '[joueur]';
            assignment.players[slot] = free[Math.floor(rng() * free.length)];
        }
        return player_name_list[assignment.players[slot]] ?? '[joueur]';
    };

    // Un backslash-dollar (\$) est un dollar littéral, protégé du remplacement de token.
    const DOLLAR_PLACEHOLDER = '\uE000';
    const masked = template.replace(/\\\$/g, DOLLAR_PLACEHOLDER);

    const formatted = masked.replace(/%\d+|%s|\$|%t/g, token => {
        let value;
        let html;

        if (token !== '%s' && token !== '%t' && token !== '$') {
            // %1, %2… : joueur numéroté (packs schema 2)
            value = playerAt(Number(token.slice(1)) - 1);
            html = `<span class='test ${spanClasses.player}'>${escapeHTML(value)}</span>`;
            keys.push({ type: 'player', value });
            is_modified = true;
            return html;
        }

        switch (token) {
            case '%s': {
                // ancien format : le n-ième %s du texte est le joueur n de l'attribution
                value = playerAt(legacy_rank++);
                html = `<span class='test ${spanClasses.player}'>${escapeHTML(value)}</span>`;
                keys.push({ type: 'player', value });
                is_modified = true;
                return html;
            }

            case '$': {
                value = randomSip();
                html = `<span class='${spanClasses.sip}'>${value}</span>`;
                keys.push({ type: 'sip', value });
                is_modified = true;
                return html;
            }

            case '%t': {
                if (assignment.team === undefined) assignment.team = rng() < 0.5 ? "team_1" : "team_2";
                value = teams[assignment.team];
                html = `<span class='${spanClasses.team}'>${escapeHTML(value)}</span>`;
                keys.push({ type: 'team', value });
                is_modified = true;
                return html;
            }

            default:
                return token;
        }
    });

    return { formatted: formatted.replace(/\uE000/g, '$'), keys, is_modified, assignment };
}

function applyQuotes(formatted, quotesIndicator) {
    const quoteStyles = {
        italic: 'fst-italic',
        underline: 'text-decoration-underline',
        highlight: 'bg-yellow text-black',
        white_on_black: 'bg-black text-light',
        black_on_white: 'bg-light text-black'
    };

    if (quotesIndicator !== 'none' && quoteStyles[quotesIndicator]) {
        return formatted.replace(
            /"([^"]+)"/g,
            `<span class="quotes_highlight ${quoteStyles[quotesIndicator]}">$1</span>`
        );
    }
    return formatted;
}

// `assignment` (facultatif) : attribution des joueurs et de l'équipe à réutiliser, celle de la carte
// quand on remplit sa suite. Le résultat renvoie l'attribution utilisée (`assignment`).
function textReplacer(text, assignment = newTokenAssignment()) {
    if (text == undefined) {
        console.error("La phrase n'est pas définie. (textReplacer)");
        return { original_sentence: "", keys: [], formatted_sentence: "", is_modified: false, assignment };
    }

    const original_sentence = text;
    const spanClasses = getSpanClasses();
    const player_name_list = game.player_list.map(player => player.player_name);

    // Remplacement des tokens dynamiques avec suivi des clés
    const tokenResult = applyTokens(
        original_sentence,
        player_name_list,
        { team_1: game.team_1 || "TEAM1", team_2: game.team_2 || "TEAM2" },
        spanClasses,
        assignment
    );

    // Gestion des guillemets
    const formatted_sentence = applyQuotes(tokenResult.formatted, game.quotes_indicator);

    return {
        original_sentence: original_sentence,
        keys: tokenResult.keys,
        formatted_sentence: formatted_sentence,
        is_modified: tokenResult.is_modified,
        assignment: tokenResult.assignment
    };
}

// Encart d'information optionnel d'une phrase (champ DB `infos`) : bouton de
// révélation + liste cachée par défaut. Retourne "" si aucune info n'est fournie.
// Le markup est inséré directement dans #ingame_sentence (pattern bouton « ? » QPUC).

function buildSentenceInfosMarkup(infos) {
    if (!Array.isArray(infos) || infos.length == 0) return "";

    const lines = infos.slice(0, 8)
        .map(line => `<li>${escapeHTML(line)}</li>`)
        .join("");

    // event.stopPropagation() : la zone #ingame_sentence avance sur clic
    return `
        <div class="sentence_infos fs-4">
            <button type="button" class="sentence_infos_reveal_btn" aria-label="${escapeHTML(global.current_language_strings.sentence_infos_reveal)}"
                onclick="event.stopPropagation(); toggleSentenceInfos()">${escapeHTML(global.current_language_strings.sentence_infos_reveal)}</button>
            <ul class="sentence_infos_content d-none">${lines}</ul>
        </div>`;
}

function toggleSentenceInfos() {
    const content = document.querySelector("#ingame_sentence .sentence_infos_content");
    if (content) { content.classList.toggle("d-none"); }
}

function applyTextModifiers(original_sentence, keys) {
    let html_span_sip;
    let html_span_player;
    let html_span_team;
    let html_span_end;
    if (game.display_color_indicator == true) {
        html_span_sip = "<span class=\"span_sip\">";
        html_span_player = "<span class=\"span_player\">";
        html_span_team = "<span class=\"span_team\">";
        html_span_end = "</span>";
    } else {
        html_span_sip = "";
        html_span_player = "";
        html_span_team = "";
        html_span_end = "";
    }

    // Un backslash-dollar (\$) est un dollar littéral, protégé du remplacement de token.
    const DOLLAR_PLACEHOLDER = '\uE000';
    let formatted_sentence = original_sentence.replace(/\\\$/g, DOLLAR_PLACEHOLDER);

    keys.forEach(modifier => {
        switch (modifier.type) {
            case 'sip':
                formatted_sentence = formatted_sentence.replace('$', html_span_sip + escapeHTML(modifier.value) + html_span_end);
                break;
            case 'player':
                formatted_sentence = formatted_sentence.replace('%s', html_span_player + escapeHTML(modifier.value) + html_span_end);
                break;
            case 'team':
                formatted_sentence = formatted_sentence.replace('%t', html_span_team + escapeHTML(modifier.value) + html_span_end);
                break;
        }
    });
    
    return formatted_sentence.replace(/\uE000/g, '$');
}

function settingsTextPreview() {
    const text = `Qu'elles sont "jolies" les $ petites fleurs de %s`;
    const formatted_text = textReplacer(text).formatted_sentence
    document.getElementById("text_settings_quotes_visualization_playground").innerHTML = formatted_text;
}

function displaySentenceList() {
    global.modal_sentence_list.show();
    modal_sentence_list_content.innerHTML = "";

    let html_element = "";
    for (let i = 0; i < game.sentence_history.length; i++) {
        const color = game.sentence_history[i].color;
        const sentence = game.sentence_history[i].formatted_sentence;

        if (sentence == "none") { break; }

        html_element += `
            <tr onclick="goToSpecificSentence(${i})" tabindex="0">
                <th scope="row" >${i + 1}</th>
                <td class="sentence-list-item sentence-list-${color}">${sentence}</td>
            </tr>
        `;
    }
    modal_sentence_list_content.innerHTML = html_element;
}

function displaySipModifierModal() {
    global.modal_sentence_modifier.show();
    document.getElementById("modal_sentence_modifier_sentence").innerHTML = game.sentence_history[game.cycle_id].formatted_sentence;
}

window.addEventListener("keydown", function(event) {
    if (game.started == true) {
        switch (event.key) {
            case "ArrowLeft":
                decrementCycleID();
                break;
            case "ArrowRight":
                incrementCycleID();
                break;
        }
    }
  }, true);

// Confirmation de retour ou de sortie de la page
window.addEventListener('beforeunload', function(e) {
    if (game.started == true) {
        e.preventDefault();
        // Chrome
        e.returnValue = '';
    }
});

function showSentenceModifierModal() {
    if (game.sentence_history[game.cycle_id].sentence_keys.length > 0) {
        global.modal_sentence_modifier.show();
        document.getElementById("modal_sentence_modifier_sentence").innerHTML = game.sentence_history[game.cycle_id].formatted_sentence;
        document.getElementById("modal_sentence_modifier_value_placeholder").innerHTML = "";
        
        //copie de des clés de la phrase actuelle
        game.sentence_modifier = JSON.parse(JSON.stringify(game.sentence_history[game.cycle_id].sentence_keys));
        
        const key = game.sentence_history[game.cycle_id].sentence_keys;
        let element = "";
        let element_label_text;
        let option_element;
        for (let i=0; i < game.sentence_history[game.cycle_id].sentence_keys.length; i++) {
            if (key[i].type == "player") {
                element_label_text = global.current_language_strings.player_capitalized
                option_element = ""
                for (let j=0; j < game.player_list.length; j++) {
                    let selected = ""
                    if (game.player_list[j].player_name == key[i].value) { selected = "selected" }
                    option_element += `<option ${selected} value="${escapeHTML(game.player_list[j].player_name)}">${escapeHTML(game.player_list[j].player_name)}</option>`;
                }
            }
            if (key[i].type == "sip") {
                element_label_text = global.current_language_strings.sip
                option_element = ""
                for (let j=game.sip.min; j <= game.sip.max; j++) {
                    let selected = ""
                    if (j == key[i].value) {
                        selected = "selected"
                    }
                    option_element += `<option ${selected} value="${j}">${j}</option>`;
                }
            }
            if (key[i].type == "team") {
                element_label_text = global.current_language_strings.team
                if (key[i].value == game.team_1) { team_1_selected = "selected"} else {team_1_selected = ""}
                if (key[i].value == game.team_2) { team_2_selected = "selected"} else {team_2_selected = ""}
                option_element = ""
                option_element += `<option ${team_1_selected} value="${escapeHTML(game.team_1)}">${escapeHTML(game.team_1)}</option>`;
                option_element += `<option ${team_2_selected} value="${escapeHTML(game.team_2)}">${escapeHTML(game.team_2)}</option>`;
            }

            element += `<div class="form-group">
            <label for="modal_sentence_modifier_player_${i}">${element_label_text}</label>
            <div class="input-group mb-3">
            <select class="form-control col-md-6" id="modal_sentence_modifier_player_${i}" name="modal_sentence_modifier_player_${i}" onchange="game.sentence_modifier[${i}].value = this.value">`;
            element += option_element;
            element += `</select>
                        <div class="input-group-append"><button class="btn btn-outline-secondary"
                            onclick="resetSentenceModifier(${i})"
                            type="button">${global.current_language_strings.reinitialize}</button></div>
                        </div></div>`;
        }
        document.getElementById("modal_sentence_modifier_value_placeholder").innerHTML = element;
    } else {
        incrementCycleID();
    }
}

function resetSentenceModifier(index) {
    const original = game.sentence_history[game.cycle_id].sentence_keys[index].value;
    game.sentence_modifier[index].value = original;
    document.getElementById("modal_sentence_modifier_player_" + index).value = original;
}

function rewriteSentence() {
    // Remplace les valeur actuelle de game.sentence_history[game.cycle_id].sentence_keys par les nouvelles valeurs de sentence_modifier
    // Puis actualise la phrase en la passant dans textReplacer pour obtenir la phrase modifiée
    // Affiche la nouvelle phrase
    function replaceObjectContent(target, source) {
        Object.keys(target).forEach(key => {
            delete target[key];
        });
        Object.assign(target, source);
    }
    replaceObjectContent(game.sentence_history[game.cycle_id].sentence_keys, game.sentence_modifier);
    let formatted = applyTextModifiers(game.sentence_history[game.cycle_id].original_sentence, game.sentence_history[game.cycle_id].sentence_keys)
    // L'encart d'information est conservé lors de la réécriture de la phrase
    formatted += buildSentenceInfosMarkup(game.sentence_history[game.cycle_id].infos);
    game.sentence_history[game.cycle_id].formatted_sentence = formatted;
    document.getElementById("ingame_sentence").innerHTML = formatted
}
