function incrementCycleID() {
    const sentence_count = game.current_gamemode.database_length

    if (game.cycle_id <= sentence_count) {
        game.cycle_id++;
        retrieve(game.cycle_id);
        setBackgroundStyleColor(getActualBackgroundColorByHistory())
    }
    updateGameCycleIndicator();
}

function decrementCycleID() {
    if (game.cycle_id > 0) {
        game.cycle_id--;
        goToSpecificSentence(game.cycle_id)
    }
    setBackgroundStyleColor(getActualBackgroundColorByHistory())
}

function goToSpecificSentence(position) {
    game.cycle_id = position;
    updateGameCycleIndicator();
    retrieve(position);
    setBackgroundStyleColor(getActualBackgroundColorByHistory())

    global.modal_sentence_list.hide()
}

function setMaxPlayerNumber() {
    const player_count = game.player_list.length

    game.max_player_number = player_count;

    if (player_count >= 4) {
        game.max_player_number = 4;
    }
    
    if (game.gamemode == "picolo_war") {
        if (player_count >= 3) {
            game.max_player_number = 3;
        }
    }

    return game.max_player_number;
}

function retrieve(sentence_id) {
    // Generation si l'historique ne trouve rien, sinon fonction retrieve
    if (game.sentence_history[game.cycle_id] == undefined || game.sentence_history[game.cycle_id].formatted_sentence == "none") {
        switch (game.current_gamemode.gamemode_type) {
            case "picolo": generatePicoloSentences(); break;
            case "war": generatePicoloSentences(); break;
            case "je_n_ai_jamais": generateJeNaiJamaisSentences(); break;
            case "mix": generateMixSentences(); break;
            case "question_pour_un_champion": generateQuestionPourUnChampionSentences(null, getQpucQuestionTypes(), getQpucTurnPlayer()); break;
            default: break;
        }
    } else {
        const sentence_requested = game.sentence_history[sentence_id];
        displaySentence(sentence_requested.formatted_sentence, sentence_requested.color, sentence_requested.pack_id, sentence_requested.answer);
        updateGameCycleIndicator();
    }

    if (game.current_gamemode.gamemode_type == "question_pour_un_champion") {
        resetQpucSentenceReveal();
    }
}

function displaySentence(sentence, color, pack_id, answer) {
    document.getElementById("ingame_sentence").className = "";

    setTimeout(function () {
        if (game.animation == true) {
            ingame_sentence.className = "animation_text_change";
        }
        document.getElementById("ingame_sentence").innerHTML = sentence;
    }, 0);

    if (color == "yellow") { displayPicoloVirusTitle() } else { hidePicoloVirusTitle() }
}

function displayPicoloVirusTitle() { document.getElementById("text_ingame_title").style.display = ""; }
function hidePicoloVirusTitle() { document.getElementById("text_ingame_title").style.display = "none"; }

// Prise en compte des probabilités et paramètres pour choisir la couleur
function getColor() {
    const colors = [
        { color: "red", probability: game.picolito.color_probability.red, condition: game.picolito.chug_enabled && game.picolito.chug_minimum_cycle_start <= game.cycle_id && game.picolito.chug_remaining > 0 && game.gamemode != "picolo_war" },
        { color: "yellow", probability: game.picolito.color_probability.yellow, condition: game.picolito.virus_enabled && game.picolito.virus_sentence_id_start_min <= game.cycle_id && game.picolito.virus_remaining > 0 && game.gamemode != "picolo_war" },
        { color: "green", probability: game.picolito.color_probability.green, condition: game.cycle_id < game.max_sentence_amount - 2 },
        { color: "blue", probability: game.picolito.color_probability.blue, condition: true }
    ];

    const available = colors.filter(c => c.condition);
    const total = available.reduce((s, c) => s + c.probability, 0);
    if (total <= 0) return null; // ou une valeur par défaut

    const randomValue = Math.random() * total; // [0, total)
    let cumulative = 0;
    const selected = available.find(c => {
        cumulative += c.probability;
        return randomValue < cumulative;
    });

    let selected_color;
    if (selected) {
        selected_color = selected.color;
    } else {
        selected_color = available[available.length - 1].color;
    }

    return { selected: selected_color, available: available };
}

function generatePicoloSentences(preferred_pack_id=null) {
    // Aucune base de données
    const packs = game.current_gamemode.packs.filter(e => (e.gamemode == "picolo" || e.gamemode == "war"))
    if (packs.length == 0) {
        console.error("Aucune base de données");
        return;
    }
    if (global.debug==true) console.log(packs)

    // Selection
    let pack_id;
    if (preferred_pack_id != null) {
        // Base de donnée séléctionnée
        pack_id = preferred_pack_id;
    } else {
        // Base de donnée aléatoire
        const ran = Math.floor(Math.random() * packs.length)
        pack_id = packs[ran].id;
    }
    const pack = packs.filter(e => (e.id == pack_id))[0]
    if (global.debug==true) console.log(pack_id, "===pack_id===")

    updateDatabaseIndicator(pack_id)
    const filters = pack.filters;
    if (!Array.isArray(filters)) {
        console.warn(`Pack "${pack_id}" sans tableau "filters" valide.`);
        return;
    }
    const db = pack.db;
    
    // La base séléctionnée a-t-elle encore des lignes ?
    const database_line_count = db.length;
    if (database_line_count == 0) { return; }

    // Nombre de joueurs
    const player_count = game.player_list.length;

    // Types
    // Liste des types de `types_and_player_count` compatibles avec la couleur
    function getTypesAndPlayerCount(color) {
        const types_and_player_count = filters
            .filter(item => item.color === color);

        // Types compatibles (min player_count <= nb joueurs)
        const filtered = types_and_player_count.filter(obj => {
            const minPlayer = Math.min(...obj.player_count);
            return minPlayer <= player_count;
        });

        return { filtered, available: types_and_player_count };
    }

    function getRandomTypeWithSentences(color) {
        // Avoir la liste des "type" en format string
        const filtered = getTypesAndPlayerCount(color).filtered.map(obj => ({
            ...obj,
            type: String(obj.type)
        }));

        let types_with_sentences = filtered.filter(entry => {
            return db.some(e => e.type == entry.type);
        });

        // Suppression du type "social_posting" (social_posting)
        if (game.picolito.social_posting_enabled == false) {
            types_with_sentences = types_with_sentences.filter(entry => entry.type != "social_posting" && entry.type != 15);
        }

        if (types_with_sentences.length === 0) {
            console.warn("Aucun type filtré ne possède de phrases.");
            return null;
        }

        const randomIndex = Math.floor(Math.random() * types_with_sentences.length);
        return types_with_sentences[randomIndex].type;
    }

    let color_data = getColor();
    if (global.debug==true) console.log(color_data);
    const selected_color = color_data.selected;
    if (selected_color == null) {
        console.warn("Les conditions ne sont pas réunies pour générer une couleur.");
        return;
    }
    if (global.debug==true) console.log(selected_color)

    // Cul sec : uniquement si un type de phrase rouge existe réellement
    let selected_type = getRandomTypeWithSentences(selected_color);
    if (selected_type == null) {
        console.warn(`Aucune phrase disponible pour la couleur "${selected_color}". Cul-sec non consommé.`);
        return;
    }
    if (selected_color == "red") { game.picolito.chug_remaining--; }
    
    function getRandomSentence(type) {
        // Construction de la liste des potentielles phrases
        let request = [];
        // Filtre pour le nombre de joueur et en dessous

        if (global.debug==true) console.log(type);

        for (let i=0; i < player_count + 1; i++) {
            const array_by_player_count = db.filter(e => e.type == type.toString() && e.parent_key == "" && e.nb_players == i.toString());
            request.push(array_by_player_count);
        }

        // Concatenne les arrays
        request = request.flat();

        if (request.length == 0) {
            console.warn(`Aucune phrase ne peux être générée. (type: ${type})`);
            return;
        }

        const random_int = Math.floor(Math.random() * Math.floor(request.length));
        return request[random_int];
    }

    function getSentenceByKey(key) {
        // Construction de la liste des potentielles phrases
        let request = [];
        // Filtre pour le nombre de joueur et en dessous
        for (let i=0; i < player_count + 1; i++) {
            request.push(...db.filter(e => e.type == selected_type.toString() && e.parent_key == key && e.nb_players == i.toString()));
        }
        
        if (request.length == 0) {
            console.warn(`Aucune phrase ne peux être générée. (type: ${selected_type}, key: ${key})`);
            return;
        }

        const random_int = Math.floor(Math.random() * Math.floor(request.length));
        return request[random_int];
    }

    // Génération phrase
    // Ajout d'une phrase (et des suite(s) éventuelles) à l'historique
    function pushHistoryItem(sentence_text_data, sentence_data, posOffset) {
        addHistoryItem({
            posOffset: posOffset,
            original_sentence: sentence_text_data.original_sentence,
            sentence_keys: sentence_text_data.keys,
            formatted_sentence: sentence_text_data.formatted_sentence,
            key: sentence_data.key,
            type: selected_type,
            color: selected_color,
            pack_id: pack_id
        });
    }

    const sentence_data = getRandomSentence(selected_type);
    if (sentence_data == undefined) {
        console.warn(`Aucune phrase ne peux être générée. (type: ${selected_type})`);
        // Cul-sec consommé sans phrase : on ne l'affiche pas comme utilisé
        if (selected_color == "red") { game.picolito.chug_remaining++; }
        return;
    }
    if (global.debug==true) console.log(sentence_data)
    const sentence_text_data = textReplacer(sentence_data.text)
        //formatted_sentence
        //is_modified
        //keys
        //original_sentence


    displaySentence(sentence_text_data.formatted_sentence, selected_color, pack_id);
    pushHistoryItem(sentence_text_data, sentence_data, 0);
    
    if (global.debug==true) console.log("key", sentence_data.key)

    if (sentence_data.key != "") {
        const extra_sentence_data = getSentenceByKey(sentence_data.key)
        if (extra_sentence_data == undefined) {
            // Suite introuvable : on conserve la phrase principale sans faire planter la partie
            console.warn(`Suite introuvable pour la clé "${sentence_data.key}" (type ${selected_type}). Phrase principale conservée.`);
        } else {
            if (global.debug==true) console.log("sentence_data.key", sentence_data.key)
            if (global.debug==true) console.log("extra_sentence_data", extra_sentence_data)
            const extra_sentence_text_data = textReplacer(extra_sentence_data.text)

            // VIRUS ou suite d'une phrase
            if (selected_color == "yellow") {
                if (global.debug==true) console.log("VIRUS ou suite d'une phrase");
                game.picolito.virus_remaining--;
                const random_virus_end = Math.floor(Math.random() * (game.picolito.virus_end_max - game.picolito.virus_end_min + 1)) + game.picolito.virus_end_min;
                
                pushHistoryItem(extra_sentence_text_data, extra_sentence_data, random_virus_end);
                if (global.debug==true) console.log("random_virus_end", random_virus_end);
            } else {
                pushHistoryItem(extra_sentence_text_data, extra_sentence_data, 1);
            }
        }
    }
}

function generateMixSentences() {
    // Si plusieurs modes dans mix alors traitement spécifiques

    const packs_by_mode = {
        // Les packs "war" (mode équipe) participent à la lane picolo du Mix
        picolo: game.current_gamemode.packs.filter(e => (e.gamemode == "picolo" || e.gamemode == "war")),
        je_n_ai_jamais: game.current_gamemode.packs.filter(e => (e.gamemode == "je_n_ai_jamais")),
        question_pour_un_champion: game.current_gamemode.packs.filter(e => (e.gamemode == "question_pour_un_champion"))
    };

    // Le Mix (pour l'instant) ne mélange que les types de question autorisés
    function hasAllowedQpucQuestion(pack) {
        return pack.db.some(e => !e.type || MIX_ALLOWED_QUESTION_TYPES.includes(e.type));
    }
    packs_by_mode.question_pour_un_champion = packs_by_mode.question_pour_un_champion.filter(hasAllowedQpucQuestion);

    // Modes éligibles : au moins une phrase restante dans un des packs du mode
    const eligible_modes = Object.keys(packs_by_mode).filter(g => {
        return packs_by_mode[g].some(pack => pack.db.length > 0);
    });

    if (eligible_modes.length == 0) { return; }

    let selected_mode;
    if (eligible_modes.length == 1) {
        selected_mode = eligible_modes[0];
    } else {
        const weights = eligible_modes.map(g => game.mix_gamemode_probability[g] || 0);
        const total = weights.reduce((sum, w) => sum + w, 0);

        if (total <= 0) {
            // Fallback équiprobable si aucun poids n'est défini
            selected_mode = eligible_modes[Math.floor(Math.random() * eligible_modes.length)];
        } else {
            const random_value = Math.random() * total;
            let cumulative = 0;
            selected_mode = eligible_modes.find((g, i) => {
                cumulative += weights[i];
                return random_value < cumulative;
            });
            if (!selected_mode) { selected_mode = eligible_modes[eligible_modes.length - 1]; }
        }
    }

    function randomPicoloID() {
        const packs = packs_by_mode.picolo.filter(pack => pack.db.length > 0);
        generatePicoloSentences(packs[Math.floor(Math.random() * packs.length)].id);
        if (global.debug==true) console.log("generation picolo sentence mix")
    }

    function randomJeNaiJamaisID() {
        const packs = packs_by_mode.je_n_ai_jamais.filter(pack => pack.db.length > 0);
        generateJeNaiJamaisSentences(packs[Math.floor(Math.random() * packs.length)].id);
        if (global.debug==true) console.log("generation je_n_ai_jamais sentence mix")
    }

    function randomQuestionPourUnChampionID() {
        const packs = packs_by_mode.question_pour_un_champion.filter(pack => pack.db.length > 0);
        generateQuestionPourUnChampionSentences(packs[Math.floor(Math.random() * packs.length)].id, MIX_ALLOWED_QUESTION_TYPES);
        if (global.debug==true) console.log("generation question_pour_un_champion sentence mix")
    }

    switch (selected_mode) {
        case "picolo": randomPicoloID(); break;
        case "je_n_ai_jamais": randomJeNaiJamaisID(); break;
        case "question_pour_un_champion": randomQuestionPourUnChampionID(); break;
    }

    return;
}

function updateMixGamemodeDisplaySlider(gamemode, value) {
    let html_element_id = "";

    switch (gamemode) {
        case "picolo":
            html_element_id = "gamodemode_mix_section_slider_picolo_probability_placeholder"
            break;
        case "je_n_ai_jamais":
            html_element_id = "gamodemode_mix_section_slider_je_n_ai_jamais_probability_placeholder"
            break;
        case "question_pour_un_champion":
            html_element_id = "gamodemode_mix_section_slider_question_pour_un_champion_probability_placeholder"
            break;
    }

    if (value == "hide") { document.getElementById(html_element_id).classList.add("d-none") }
    if (value == "display") { document.getElementById(html_element_id).classList.remove("d-none") }
}

function updateMixGamemodeProbability(gamemode, value) {
    const modes = ["picolo", "je_n_ai_jamais", "question_pour_un_champion"];
    const others_sum = modes.filter(g => g != gamemode)
        .reduce((sum, g) => sum + game.mix_gamemode_probability[g], 0);

    let new_value = parseInt(value);
    if (isNaN(new_value) || new_value < 0) { new_value = 0; }

    // La somme des sliders ne doit pas dépasser 100
    if (others_sum + new_value > 100) { new_value = Math.max(0, 100 - others_sum); }

    game.mix_gamemode_probability[gamemode] = new_value;
    document.getElementById(`gamodemode_mix_section_slider_${gamemode}_probability`).value = new_value;
    document.getElementById(`gamodemode_mix_section_slider_${gamemode}_probability_value`).innerHTML = new_value;
}

// Remplit le gabarit HTML de la carte QPUC (#qpuc_sentence_template) et retourne son markup
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
        const ran = Math.floor(Math.random() * candidates.length)
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
        const random_int = Math.floor(Math.random() * Math.floor(db.length));

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

function generateJeNaiJamaisSentences(preferred_pack_id=null) {
    // Aucune base de données
    const packs = game.current_gamemode.packs.filter(e => (e.gamemode == "je_n_ai_jamais"))
    if (packs.length == 0) {
        console.error("Aucune base de données \"Je n'ai Jamais\"");
        return;
    }
    if (global.debug==true) console.log(packs)

    // Selection
    let pack_id;
    if (preferred_pack_id != null) { 
        // Base de donnée séléctionnée
        pack_id = preferred_pack_id;
    } else {
        // Base de donnée aléatoire
        const ran = Math.floor(Math.random() * packs.length)
        pack_id = packs[ran].id;
    }
    const pack = packs.filter(e => (e.id == pack_id))[0]

    if (global.debug==true) console.log(pack_id, "===pack_id===");

    // Selection des phrases du pack
    const db = pack.db

    if (global.debug==true) console.log(pack)
    
    // Le pack séléctionné a-t-il encore des lignes ?
    const database_line_count = db.length;
    if (database_line_count == 0) { return; }

    const request = db;
    let formatted_sentence = "";
    let original_sentence = "";

    // pack_id ? est-ce utile car déjà appelé un peu en haut ?
    function getRandomSentence() {
        const random_int = Math.floor(Math.random() * Math.floor(request.length));

        const text_replacer_data = textReplacer(request[random_int].text)
        formatted_sentence = text_replacer_data.formatted_sentence;
        original_sentence = text_replacer_data.original_sentence;

        formatted_sentence = textReplacer(request[random_int].text).formatted_sentence;
        pack_id = request[random_int].pack_id ?? request[random_int].bdd_id; // bdd_id = compat ancien cache

        //remove sentence from db
        if (global.debug==true) console.log(random_int, formatted_sentence, "phrase \"je n'ai jamais\" supprimée")
        db.splice(random_int, 1);
    }

    getRandomSentence()
    updateDatabaseIndicator(pack_id)
    displaySentence(formatted_sentence, "je_n_ai_jamais", pack_id);
    addHistoryItem(
        {
            posOffset: 0,
            original_sentence: original_sentence,
            formatted_sentence: formatted_sentence,
            type: "je_n_ai_jamais",
            color: "je_n_ai_jamais",
            pack_id: pack_id
        }
    );
}

// ---- QPUC : mini-moteur de manches à points (Neuf points gagnants / Quatre à la suite) ----

// Types de question autorisés pour le tirage QPUC (filtre par manche choisie au menu)
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
    game.sentence_history[game.cycle_id].formatted_sentence = applyTextModifiers(game.sentence_history[game.cycle_id].original_sentence, game.sentence_history[game.cycle_id].sentence_keys)
    document.getElementById("ingame_sentence").innerHTML = game.sentence_history[game.cycle_id].formatted_sentence
}
