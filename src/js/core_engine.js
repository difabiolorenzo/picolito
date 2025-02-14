function nextSentence() {
    if (game.cycle_id < game.sentence_amount - 1) {
        game.cycle_id++;
        retrieve(game.cycle_id);

        updateGameCycle();
    }
    hideDisplaySentenceList();
}

function previousSentence() {
    if (game.cycle_id > 0) {
        game.cycle_id--;
        goToSpecificSentence(game.cycle_id)
    }
    hideDisplaySentenceList();
}

function goToSpecificSentence(position) {
    game.cycle_id = position;
    updateGameCycle();
    setBackgroundColor(getBackgroundColorByHistory())
    retrieve(position);
    hideDisplaySentenceList();
}

function convertPendingDBTaffy() {
    // game.database = TAFFY(game.pending_db)
    game.database = TAFFY(game.pending_db)
    // game.pending_db = game.pending_db.concat(
}

function getMinPlayer() {
    if (game.gamemode == "war" && game.player_list.length >= 3) {
        game.max_player_number = 3;
    } else if (game.gamemode != "war" && game.player_list.length >= 4) {
        game.max_player_number = 4;
    } else {
        game.max_player_number = game.player_list.length;
    }
}

function retrieve(sentence_id) {
    // Generation si l'historique ne trouve rien, sinon fonction retrieve
    if (game.sentence_history[game.cycle_id] == undefined || game.sentence_history[game.cycle_id].sentence == "none") {
        switch (game.gamemode) {
            case "default":
                generatePicoloSentences();
                break;
            case "silly":
                generatePicoloSentences();
                break;
            case "bar":
                generatePicoloSentences();
                break;
            case "hot":
                generatePicoloSentences();
                break;
            case "war":
                generatePicoloSentences();
                break;
            case "mix":
                generateMixSentences();
                break;
            case "never_popular":
                generateNeverDoneSentences();
                break;
            case "never_party":
                generateNeverDoneSentences();
                break;
            case "never_hot":
                generateNeverDoneSentences();
                break;
            case "weakest_link":
                generateWeakestLink();
                break;
            default:
            break;
        }
    } else {
        var sentence_requested = game.sentence_history[sentence_id];
        displaySentence(sentence_requested.sentence, sentence_requested.color, sentence_requested.pack_name, sentence_requested.answer);
        updateGameCycle();
    }
}

function generateMixSentences() {
    // Si plusieurs modes dans mix alors traitement spécifiques
    if (game.mix_gamemode_list_picolo.length > 0 && game.mix_gamemode_list_never_done.length > 0) {
        // Une chance sur deux d'avoir une phrase Picolo ou Je N'ai Jamais
        if (Math.random() >= 0.5) {
            generatePicoloSentences(true);
            console.log("generation picolo sentence mix")
        } else {
            generateNeverDoneSentences(true);
            console.log("generation never_done sentence mix")
        }
        // exitGame();
    } else {
        // Si aucun mode "game.mix_gamemode_list_picolo" alors "je n'ai jamais"
        if (game.mix_gamemode_list_picolo.length > 0) {
            generatePicoloSentences();
        } else {
            generateNeverDoneSentences();
        }
    }
}

function displaySentence(sentence, color, pack_name, answer) {
    ingame_sentence.className = "";
    ingame_answer.className = "";
    ingame_title.className = "";

    setTimeout(function() {
        if (game.animation == true) {
            ingame_sentence.className = "animation_text_change";
            ingame_title.className = "animation_text_change";
            ingame_answer.className = "animation_text_change";
            if (game.weakest_link.hide_answer == true) {
                ingame_answer.className += " answer-hided";
            }
        }
        document.getElementById("ingame_sentence").innerHTML = sentence;
        if (color == "weakest_link") {
            document.getElementById("ingame_answer").innerHTML = answer;
        }
    }, 0);

    if (color == "yellow") {
        ingame_title.innerText = global.current_language_strings.virus;
    } else {
        ingame_title.innerText = "";
    }

    if (game.gamemode == "mix" && sentence != "") {
        selectGamemodeDBIndicator(pack_name)
    }
    
}

function randomPercentage() {
    while (random_percent == 0 || random_percent == 100 || random_percent == undefined) {
        var random_percent = Math.floor(Math.random() * 100);
    }
    return random_percent;
}

function getRandomColor() {
    var available_color_probability = [];
    if (game.chug_enabled == true && game.chug_sentence_id_start_min <= game.cycle_id && game.chug_remaining > 0 && game.gamemode != "war") {
        available_color_probability.push(["red", game.filter.color_probability.red])
    }
    if (game.virus_enabled == true && game.virus_sentence_id_start_min <= game.cycle_id && game.virus_remaining > 0 && game.gamemode != "war") {
        available_color_probability.push(["yellow", game.filter.color_probability.yellow])
    }
    if (game.cycle_id < game.sentence_amount - 2) {
        available_color_probability.push(["green", game.filter.color_probability.green])
    }
    available_color_probability.push(["blue", game.filter.color_probability.blue])

    available_color_probability.sort( function(a, b) { return a[1] - b[1]; } );

    var random_percent = randomPercentage();

    //filter color probability by random_percent
    var color = "";
    var random_probability_step = 0;
    var random_probability_next_step = 0;
    for (var i = 0; i < available_color_probability.length; i++) {
        random_probability_next_step = random_probability_next_step + available_color_probability[i][1];
        if ( (random_percent > random_probability_step && random_percent < random_probability_next_step) || (random_percent > random_probability_next_step) || (random_percent > random_probability_step)) {
            color = available_color_probability[i][0];
        }
        random_probability_step = random_probability_next_step;
    }
    return color;
}

function getRandomType() {
    if (game.gamemode == "mix") {
        var possible_type = ["bar", "default", "hot", "silly"]
        var percentage = randomPercentage()
        var gamemode = possible_type[Math.floor(percentage/(100/4))]
    } else {
        var gamemode = game.gamemode;
    }

    if (game.max_player_number != -1) {
        var type_by_gamemode = [];
        var max_player_number_by_gamemode = [];
        switch (gamemode) {
            case "bar":
                type_by_gamemode = game.filter.type_by_gamemode.bar;            
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.bar;            
                break;
            case "default":
                type_by_gamemode = game.filter.type_by_gamemode.default;
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.default;
                break;
            case "hot":
                type_by_gamemode = game.filter.type_by_gamemode.hot;
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.hot;
                break;
            case "silly":
                type_by_gamemode = game.filter.type_by_gamemode.silly;
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.silly;
                break;
            case "war":
                type_by_gamemode = game.filter.type_by_gamemode.war;
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.war;
                break;
        }

        var color = getRandomColor();
        var type_by_color = []
        switch (color) {
            case "blue":
                type_by_color = game.filter.type_by_color.blue;            
                break;
            case "red":
                type_by_color = game.filter.type_by_color.red;
                break;
            case "green":
                type_by_color = game.filter.type_by_color.green;
                break;
            case "yellow":
                type_by_color = game.filter.type_by_color.yellow;
                break;
        }

        var color_gamemode_matching_type = []
        for (var i = 0; i < type_by_gamemode.length; i++) {
            for (var j = 0; i < type_by_color.length; i++) {
                if (type_by_gamemode[i] == type_by_color[j]) {
                    if (game.social_posting_enabled == false && type_by_gamemode[i] == 15) {
                        console.log(`SOCIAL POSTING DISABLED`)
                    } else {
                        color_gamemode_matching_type.push(type_by_gamemode[i]);
                    }
                }
            }
        }

        var potential_type = []
        for (var i = 0; i < color_gamemode_matching_type.length; i++) {
            var checking_cg_matching_type = color_gamemode_matching_type[i];
            var checking_mp_by_gamemode = max_player_number_by_gamemode[checking_cg_matching_type-1];
            if (checking_mp_by_gamemode.length != 0) {
                for (var j = 0; i < checking_mp_by_gamemode.length; i++) {
                    if (checking_mp_by_gamemode[j] <= game.max_player_number) {
                        potential_type.push(checking_cg_matching_type)
                    }
                }
            }
        }
    
        var random_type_index = Math.floor(Math.random() * potential_type.length);
        var selected_type = potential_type[random_type_index];

        return [color, selected_type, potential_type];
    } else {
        getMinPlayer()
        getRandomType()
    }
}

function generatePicoloSentences(use_mix_gamemode_data) {
    var request = [];
    var key = "";
    var sentence = "";
    var database_id = "";
    var pack_name = "";
    var color = ""
    var type = ""
    var max_player = game.max_player_number;

    var get_random_color_type = getRandomType();
    color = get_random_color_type[0];
    type = get_random_color_type[1];
    console.clear()
    console.log(get_random_color_type, color, "type", type, "max_player", max_player);

    function getSentence(use_parent_key, selected_nb_players, selected_type) {
        if (use_parent_key == false) {
            var parent_key_string = "";
        } else {
            var parent_key_string = key;
        }

        if (use_mix_gamemode_data == true) {
            // Choix aleatoire du mode de jeu selon la liste des modes choisi
            var random_picolo_mix_gamemode_list = game.mix_gamemode_list_picolo[Math.floor(Math.random() * game.mix_gamemode_list_picolo.length)];
            return game.database().filter({nb_players:selected_nb_players, type:selected_type, pack_name:random_picolo_mix_gamemode_list, parent_key:parent_key_string}).get();
        } else {
            return game.database().filter({nb_players:selected_nb_players, type:selected_type, parent_key:""}).get();
        }
    }

    //get sentence from lower nb_player to max_player
    for (var i=0; i<= max_player; i++) {
        var addind_request = getSentence(false, i.toString(), type.toString()); //getSentence(use_parent_key, selected_nb_players, selected_type)
        request.push(...addind_request);
    }
    if (request.length == 0) {
        game.filter.empty_type.push(type)
        console.log("REPICK TYPE");
        return;
    }

    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        sentence = textReplacer(request[random_int].text);
        pack_name = request[random_int].pack_name;
        if (request[random_int].key != "") { key = request[random_int].key; }
        console.log(random_int, sentence, pack_name);

        //remove sentence from db
        game.database().filter({___id:database_id}).remove();
        console.log(database_id, "picolo removed")
    }

    getRandomSentence()
    setBackgroundColor(color);
    displaySentence(sentence, color, pack_name);
    addHistoryItem(0, database_id, sentence, key, type, color, pack_name, undefined);

    if (key != "") {
        request = [];
        sentence = "";
        database_id = "";
        pack_name = "";
        
        console.log(request)

        //get sentence from lower nb_player
        for (var i = 0; i <= max_player; i++) {
            var addind_request = getSentence(true, i.toString(), type.toString())
            request.push(...addind_request)
        }
        getRandomSentence()

        if (color == "yellow") {
            game.virus_remaining--;
            random_virus_end = Math.floor(Math.random() * (game.virus_end_max - game.virus_end_min)) + game.virus_end_min;

            console.log("game_cycle end virus", random_virus_end)
            console.log(sentence, "key", key, "type", type)
            addHistoryItem(random_virus_end, database_id, sentence, key, type, color, pack_name, undefined);

            game.virus_established_start = game.cycle_id;
            game.virus_established_end = game.cycle_id + random_virus_end;

        } else if (color == "blue" || color == "green" ) {
            addHistoryItem(1, database_id, sentence, key, type, color, pack_name, undefined);
        }

    }

    // Remove one remaining chug
    if (color == "red") {
        game.chug_remaining--;
    }
}

function generateNeverDoneSentences(use_mix_gamemode_data) {
    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        sentence = textReplacer(request[random_int].text);
        pack_name = request[random_int].pack_name;
        if (request[random_int].key != "") { key = request[random_int].key; }
        console.log(random_int, sentence)

        //remove sentence from db
        game.database().filter({___id:database_id}).remove();
        console.log(database_id, pack_name, "never_done removed")
    }
    
    if (use_mix_gamemode_data == true) {
        // Choix aleatoire du mode de jeu selon la liste des modes choisi
        var random_never_done_mix_gamemode_list = game.mix_gamemode_list_never_done[Math.floor(Math.random() * game.mix_gamemode_list_never_done.length)];
        var request =  game.database().filter({pack_name:random_never_done_mix_gamemode_list}).get();
    } else {
        var request =  game.database().get();
    }
    
    getRandomSentence()
    setBackgroundColor("never_done");
    displaySentence(sentence, "never_done", pack_name);
    addHistoryItem(0, database_id, sentence, undefined, undefined, "never_done", pack_name, undefined);
}

function generateWeakestLink() {
    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        sentence = request[random_int].text;
        answer = request[random_int].answer;
        pack_name = request[random_int].pack_name;
        if (request[random_int].key != "") { key = request[random_int].key; }

        //remove sentence from db
        game.database().filter({___id:database_id}).remove();
    }

    var request = game.database().get();
    getRandomSentence()

    setBackgroundColor("weakest_link");
    displaySentence(sentence, "weakest_link", pack_name, answer);
    addHistoryItem(0, database_id, sentence, undefined, undefined, "dark_blue", pack_name, answer);
}