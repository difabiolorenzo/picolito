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
            // L'encart d'information éventuel est collé au texte de la phrase
            formatted_sentence: sentence_text_data.formatted_sentence + buildSentenceInfosMarkup(sentence_data.infos),
            key: sentence_data.key,
            type: selected_type,
            color: selected_color,
            pack_id: pack_id,
            infos: sentence_data.infos
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
            html_element_id = "gamemode_mix_section_slider_picolo_probability_placeholder"
            break;
        case "je_n_ai_jamais":
            html_element_id = "gamemode_mix_section_slider_je_n_ai_jamais_probability_placeholder"
            break;
        case "question_pour_un_champion":
            html_element_id = "gamemode_mix_section_slider_question_pour_un_champion_probability_placeholder"
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
    document.getElementById(`gamemode_mix_section_slider_${gamemode}_probability`).value = new_value;
    document.getElementById(`gamemode_mix_section_slider_${gamemode}_probability_value`).innerHTML = new_value;
}

// Remplit le gabarit HTML de la carte QPUC (#qpuc_sentence_template) et retourne son markup
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
    let sentence_infos = undefined;

    // pack_id ? est-ce utile car déjà appelé un peu en haut ?
    function getRandomSentence() {
        const random_int = Math.floor(Math.random() * Math.floor(request.length));

        const text_replacer_data = textReplacer(request[random_int].text)
        formatted_sentence = text_replacer_data.formatted_sentence;
        original_sentence = text_replacer_data.original_sentence;

        formatted_sentence = textReplacer(request[random_int].text).formatted_sentence;
        pack_id = request[random_int].pack_id ?? request[random_int].bdd_id; // bdd_id = compat ancien cache
        // Encart d'information optionnel (champ DB `infos`)
        sentence_infos = request[random_int].infos;
        formatted_sentence += buildSentenceInfosMarkup(sentence_infos);

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
            pack_id: pack_id,
            infos: sentence_infos
        }
    );
}

// ---- QPUC : mini-moteur de manches à points (Neuf points gagnants / Quatre à la suite) ----

// Types de question autorisés pour le tirage QPUC (filtre par manche choisie au menu)
