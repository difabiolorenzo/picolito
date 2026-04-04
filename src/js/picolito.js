function incrementCycleID() {
    const bdd_length = game.current_gamemode.database_length

    if (game.cycle_id <= bdd_length) {
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

function getMinPlayer() {
    const player_count = game.player_list.length

    game.max_player_number = player_count;

    if (player_count >= 4) {
        game.max_player_number = 4;
    }
    
    if (game.gamemode == "war") {
        if (player_count >= 3) {
            game.max_player_number = 3;
        }
    }
    return;
}

function retrieve(sentence_id) {
    // Generation si l'historique ne trouve rien, sinon fonction retrieve
    if (game.sentence_history[game.cycle_id] == undefined || game.sentence_history[game.cycle_id].formatted_sentence == "none") {
        switch (game.current_gamemode.gamemode_type) {
            case "picolo": generatePicoloSentences(); break;
            case "external_db_picolo": generatePicoloExternalDBSentences(); break;
            case "je_n_ai_jamais": generateJeNaiJamaisSentences(); break;
            case "mix": generateMixSentences(); break;
            default: break;
        }
    } else {
        var sentence_requested = game.sentence_history[sentence_id];
        displaySentence(sentence_requested.formatted_sentence, sentence_requested.color, sentence_requested.pack_name, sentence_requested.answer);
        updateGameCycleIndicator();
    }
}

function displaySentence(sentence, color, pack_name, answer) {
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

function generatePicoloSentences(preferred_bdd_id=null) {
    // Aucune base de données
    const db_collection = game.current_gamemode.bdd_data.filter(e => (e.gamemode == "picolo"))
    if (db_collection.length == 0) {
        console.error("Aucune base de données");
        return;
    }
    console.log(db_collection)

    // Selection
    if (preferred_bdd_id != null) { 
        // Base de donnée séléctionnée
        var bdd_id = preferred_bdd_id;
    } else {
        // Base de donnée aléatoire
        let ran = Math.floor(Math.random() * db_collection.length)
        var bdd_id = db_collection[ran].id;
    }
    var bdd_data = db_collection.filter(e => (e.id == bdd_id))[0]

    // Highlight de la base de données dans la barre du bas
    selectIngameDatabaseIndicator(bdd_id)

    // Filtres par base de données
    const filters = bdd_data.filters;

    // Selection de la base de données de la base de données :} (les phrases de la BDD)
    var db = bdd_data.db;
    
    // La base séléctionnée a-t-elle encore des lignes ?
    const database_line_count = db().count();
    if (database_line_count == 0) { return; }

    // Couleur
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

        selected ? selected.color : available[available.length - 1].color;

        return {selected: selected.color, available: available}
    }

    // Nombre de joueurs
    const player_count = game.player_list.length;

    // Types
    // Liste des types de `types_and_player_count` compatibles avec la couleur
    function getTypesAndPlayerCount(color) {
        const types_and_player_count = game.current_gamemode.bdd_data[0].filters
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
            return db().filter({ type: entry.type }).count() > 0;
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
    console.log(color_data);
    const selected_color = color_data.selected;
    if (selected_color == null) {
        console.warn("Les conditions ne sont pas réunnies pour générer une couleur.");
        return;
    }
    console.log(selected_color)

    // Cul sec
    if (selected_color == "red") { game.picolito.chug_remaining--; }

    const selected_type = getRandomTypeWithSentences(selected_color);
    
    function getRandomSentence(type) {
        // Construction de la liste des potentielles phrases
        let request = [];
        // Filtre pour le nombre de joueur et en dessous

        console.log(type);

        for (var i=0; i < player_count + 1; i++) {
            const array_by_player_count = db().filter({ type: type.toString(), parent_key: "", nb_players: i.toString()}).get();
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
        for (var i=0; i < player_count + 1; i++) {
            request.push(db().filter({ type: selected_type.toString(), parent_key: "", nb_players: i.toString(), parent_key: key}).get());
        }
        
        if (request[0].length == 0) {
            console.warn(`Aucune phrase ne peux être générée. (type: ${selected_type}, key: ${key})`);
            return;
        }

        const random_int = Math.floor(Math.random() * Math.floor(request[0].length));
        return request[0][random_int];
    }

    // Génération phrase
    const sentence_data = getRandomSentence(selected_type);
    console.log(sentence_data)
    const sentence_text_data = textReplacer(sentence_data.text)
        //formatted_sentence
        //is_modified
        //keys
        //original_sentence


    displaySentence(sentence_text_data.formatted_sentence, selected_color, bdd_id);
    addHistoryItem(
        {
            posOffset: 0,
            database_id: bdd_id,
            original_sentence: sentence_text_data.original_sentence,
            sentence_keys: sentence_text_data.keys,
            formatted_sentence: sentence_text_data.formatted_sentence,
            key: sentence_data.key,
            type: selected_type,
            color: selected_color,
            pack_name: bdd_id
        }
    );
    
    console.log("key", sentence_data.key)

    if (sentence_data.key != "") {
        const extra_sentence_data = getSentenceByKey(sentence_data.key)
        console.log("sentence_data.key", sentence_data.key)
        console.log("extra_sentence_data", extra_sentence_data)
        const extra_sentence_text_data = textReplacer(extra_sentence_data.text)

        // VIRUS ou suite d'une phrase
        if (selected_color == "yellow") {
            console.log("VIRUS ou suite d'une phrase");
            game.picolito.virus_remaining--;
            const random_virus_end = Math.floor(Math.random() * (game.picolito.virus_end_max - game.picolito.virus_end_min)) + game.picolito.virus_end_min;
            
            addHistoryItem(
                {
                    posOffset: random_virus_end,
                    database_id: bdd_id,
                    original_sentence: extra_sentence_text_data.original_sentence,
                    sentence_keys: extra_sentence_text_data.keys,
                    formatted_sentence: extra_sentence_text_data.formatted_sentence,
                    key: extra_sentence_data.key,
                    type: selected_type,
                    color: selected_color,
                    pack_name: bdd_id
                }
            );
            console.log("random_virus_end", random_virus_end);
        } else {
            addHistoryItem(
                {
                    posOffset: 1,
                    database_id: bdd_id,
                    original_sentence: extra_sentence_text_data.original_sentence,
                    sentence_keys: extra_sentence_text_data.keys,
                    formatted_sentence: extra_sentence_text_data.formatted_sentence,
                    key: extra_sentence_data.key,
                    type: selected_type,
                    color: selected_color,
                    pack_name: bdd_id
                }
            );
        }
    }
}

function generateMixSentences() {
    // Si plusieurs modes dans mix alors traitement spécifiques
    
    const picolo_db_data = game.current_gamemode.bdd_data.filter(e => (e.gamemode == "picolo"));
    const je_n_ai_jamais_db_data = game.current_gamemode.bdd_data.filter(e => (e.gamemode == "je_n_ai_jamais"));
    
    // Les deux modes, alors choix aléatoire
    if (picolo_db_data.length > 0 && je_n_ai_jamais_db_data.length > 0) {
        if (Math.random() >= 0.5) {
            randomPicoloID();
            console.log("generation picolo sentence mix")
        } else {
            randomJeNaiJamaisID();
            console.log("generation je_n_ai_jamais sentence mix")
        }
    } else {
        if (picolo_db_data.length > 0) {
            randomPicoloID();
        }
        if (je_n_ai_jamais_db_data.length > 0) {
            randomJeNaiJamaisID();
        }
    }

    function randomPicoloID() {
        let random = Math.floor(Math.random() * picolo_db_data.length);
        generatePicoloSentences(picolo_db_data[random].id);
    }

    function randomJeNaiJamaisID() {
        let random = Math.floor(Math.random() * je_n_ai_jamais_db_data.length);
        generateJeNaiJamaisSentences(je_n_ai_jamais_db_data[random].id);
    }

    return;
}

function generateJeNaiJamaisSentences(preferred_bdd_id=null) {
    // Aucune base de données
    const db_collection = game.current_gamemode.bdd_data.filter(e => (e.gamemode == "je_n_ai_jamais"))
    if (db_collection.length == 0) {
        console.error("Aucune base de données \"Je n'ai Jamais\"");
        return;
    }
    console.log(db_collection)

    // Selection
    if (preferred_bdd_id != null) { 
        // Base de donnée séléctionnée
        var bdd_id = preferred_bdd_id;
    } else {
        // Base de donnée aléatoire
        let ran = Math.floor(Math.random() * db_collection.length)
        var bdd_id = db_collection[ran].id;
    }
    var bdd_data = db_collection.filter(e => (e.id == bdd_id))[0]

    console.log(bdd_id, "===bdd_id===");

    // Selection de la base de données de la base de données :} (les phrases de la BDD)
    var db = bdd_data.db

    console.log(bdd_data)
    
    // La base séléctionnée a-t-elle encore des lignes ?
    const database_line_count = db().count();
    if (database_line_count == 0) { return; }

    var request = [];
    var formatted_sentence = "";
    var original_sentence = "";
    var request_id = "";
    var bdd_id = "";

    // BDD ID
    const je_n_ai_jamais_db_data = game.current_gamemode.bdd_data.filter(e => (e.gamemode == "je_n_ai_jamais"));
    bdd_id = je_n_ai_jamais_db_data[Math.floor(Math.random() * je_n_ai_jamais_db_data.length)].id;

    console.log(je_n_ai_jamais_db_data)
    console.log(bdd_id)

    // const db = TAFFY(game.current_gamemode.bdd_data.filter(e => (e.id == bdd_id)))

    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        request_id = request[random_int].___id;

        var text_replacer_data = textReplacer(request[random_int].text)
        formatted_sentence = text_replacer_data.formatted_sentence;
        original_sentence = text_replacer_data.original_sentence;

        formatted_sentence = textReplacer(request[random_int].text).formatted_sentence;
        bdd_id = request[random_int].bdd_id;

        //remove sentence from db
        console.log(random_int, formatted_sentence, "phrase \"je n'ai jamais\" supprimée")
        db().filter({ ___id: request_id }).remove();
    }

    var request = db().get();

    getRandomSentence()
    displaySentence(formatted_sentence, "je_n_ai_jamais", bdd_id);
    addHistoryItem(
        {
            posOffset: 0,
            database_id: bdd_id,
            original_sentence: original_sentence,
            formatted_sentence: formatted_sentence,
            type: "je_n_ai_jamais",
            color: "je_n_ai_jamais",
            pack_name: bdd_id
        }
    );
}

function userActionClickSentence() {
    const gamemode_type = game.current_gamemode.gamemode_type;
    if (game.started == true && (
        gamemode_type == "picolo" || 
        gamemode_type == "external_db_picolo" || 
        gamemode_type == "je_n_ai_jamais" || 
        gamemode_type == "mix")
    ) {
        if (game.debug == true) {
            showSentenceModifierModal();
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
        
        var key = game.sentence_history[game.cycle_id].sentence_keys;
        var element = "";
        for (var i=0; i < game.sentence_history[game.cycle_id].sentence_keys.length; i++) {
            if (key[i].type == "player") {
                var element_label_text = global.current_language_strings.player_capitalized
                var option_element = ""
                for (var j=0; j < game.player_list.length; j++) {
                    var selected = ""
                    if (game.player_list[j].player_name == key[i].value) { selected = "selected" }
                    option_element += `<option ${selected} value="${game.player_list[j].player_name}">${game.player_list[j].player_name}</option>`;
                }
            }
            if (key[i].type == "sip") {
                var element_label_text = global.current_language_strings.sip
                var option_element = ""
                for (var j=game.sip.min; j <= game.sip.max; j++) {
                    var selected = ""
                    if (j == key[i].value) {
                        selected = "selected"
                    }
                    option_element += `<option ${selected} value="${j}">${j}</option>`;
                }
            }
            if (key[i].type == "team") {
                var element_label_text = global.current_language_strings.team
                if (key[i].value == game.team_1) { team_1_selected = "selected"} else {team_1_selected = ""}
                if (key[i].value == game.team_2) { team_2_selected = "selected"} else {team_2_selected = ""}
                var option_element = ""
                option_element += `<option ${team_1_selected} value="${game.team_1}">${game.team_1}</option>`;
                option_element += `<option ${team_2_selected} value="${game.team_2}">${game.team_2}</option>`;
            }

            element += `<div class="form-group">
            <label for="modal_sentence_modifier_player_${i}">${element_label_text}</label>
            <div class="input-group mb-3">
            <select class="form-control col-md-6" id="modal_sentence_modifier_player_${i}" name="modal_sentence_modifier_player_${i}" onchange="game.sentence_modifier[${i}].value = this.value">`;
            element += option_element;
            element += `</select>
                        <div class="input-group-append"><button class="btn btn-outline-secondary"
                            onclick="game.sentence_modifier[${i}].value = '${key[i].value}'; document.getElementById('modal_sentence_modifier_player_${i}').value = '${key[i].value}'"
                            type="button">${global.current_language_strings.reinitialize}</button></div>
                        </div></div>`;
        }
        document.getElementById("modal_sentence_modifier_value_placeholder").innerHTML = element;
    } else {
        incrementCycleID();
    }
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