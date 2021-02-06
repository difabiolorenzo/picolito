function nextSentence() {
    if (game.sentence_id == -1) {
        startGame();
    }
    if (game.sentence_id < game.sentence_amount - 1) {
        game.sentence_id++;
        
        retrieve(game.sentence_id);

        updateHTMLBackgroundColor();
        updateHTMLGameCycleCount();
        updateGameCycle();
        displaySentenceList(true);
    }
}

function previousSentence() {
    if (game.sentence_id > 0) {
        game.sentence_id--;
        goToSpecificSentence(game.sentence_id)
    }
}

function goToSpecificSentence(position) {
    game.sentence_id = position;
    var color = game.sentence_history[position].nature;
    
    updateGameCycle();
    updateHTMLGameCycleCount();
    updateHTMLBackgroundColor();
    updateHTMLIndicator(position, color);
    retrieve(position);
    displaySentenceList(true);
}

function checkMaxPlayerNumber() {
    if (game.gamemode == "war" && game.player_list.length >= 3) {
        return 3;
    } else if (game.gamemode != "war" && game.player_list.length >= 4) {
        return 4;
    } else {
        return game.player_list.length;
    }
}

function retrieve(sentence_id) {
    //generate or retrieve
    if (game.sentence_history[game.sentence_id] == undefined || game.sentence_history[game.sentence_id].sentence == "none") {
        generate(checkMaxPlayerNumber());
    } else {
        var sentence_requested = game.sentence_history[sentence_id];
        document.getElementById("ingame_sentence").innerHTML = sentence_requested.sentence;
        updateHTMLGameCycleCount();
    }
}

function getNature() {
    //sorting raw default type data
    var available_nature_probability = [];
    for (var i in game.type_info) {
        if (game.type_info[i][0] == "red" && game.down_drinking_enabled == true && game.down_drinking_sentence_id_start_min <= game.sentence_id && game.down_drinking_triggered == false) {
            available_nature_probability.push(game.type_info[i]);
        }
        if (game.type_info[i][0] == "yellow" && game.virus_enabled == true && game.virus_sentence_id_start_min <= game.sentence_id && game.virus_triggered == false) {
            available_nature_probability.push(game.type_info[i]);
        }
        if (game.type_info[i][0] == "blue" || game.type_info[i][0] == "green") {
            available_nature_probability.push(game.type_info[i]);
        }
    }
    available_nature_probability.sort( function(a, b) { return a[1] - b[1]; } );
    return available_nature_probability;
}

function getType(nb_players_max) {
    //prevent overlaping viruses end
    var posible_virus = false;

    if ((game.sentence_history[game.sentence_id] == undefined || game.sentence_history[game.sentence_id].sentence == "none") && game.sentence_id < game.sentence_amount) {
        posible_virus = true;
    }

    var available_nature_probability = getNature();
    console.log("sorting probability", available_nature_probability)

    //random between 0 and 1
    while (random_probability == 0 || random_probability == 1 || random_probability == undefined) {
        var random_probability = Math.round(Math.random() * 100);
    }
    console.log("random", random_probability)

    //get type by random number
    var selected_type = [];
    var sentence_nature = "";
    var random_probability_step = 0;
    var random_probability_next_step = 0;
    for (var i = 0; i < available_nature_probability.length; i++) {
        random_probability_next_step = random_probability_next_step + available_nature_probability[i][1];
        if ( (random_probability > random_probability_step && random_probability < random_probability_next_step) || (random_probability > random_probability_next_step)) {
            sentence_nature = available_nature_probability[i][0];
            selected_type = available_nature_probability[i];
        }
        random_probability_step = random_probability_next_step;
    }

    //get type by selected gamemode
    var possible_type_by_gamemode = [];
    var useable_type_by_gamemode = [];

    for (var i in game.type_used_by_gamemode) {
        if (game.gamemode == game.type_used_by_gamemode[i][0]) {
            possible_type_by_gamemode = game.type_used_by_gamemode[i];
        }
    }
    console.log("possible_type_by_gamemode", possible_type_by_gamemode)

    for (var i in possible_type_by_gamemode[1]) {
        for (var j in selected_type[2]) {
            if (possible_type_by_gamemode[1][i] == selected_type[2][j]) {
                useable_type_by_gamemode.push(possible_type_by_gamemode[1][i]);
            }
        }
    }
    console.log("useable_type_by_gamemode", useable_type_by_gamemode)

    // get nb_players by gamemode
    var nb_players_by_type = []
    for (var i in useable_type_by_gamemode) {
        for (var j in game.nb_players_info) {
            if (game.nb_players_info[j][0] == game.gamemode) {
                nb_players_by_type.push([useable_type_by_gamemode[i], game.nb_players_info[j][useable_type_by_gamemode[i]]]);
            }
        }
    }
    console.log("nb_players_by_type", nb_players_by_type)

    //select type by compatible nb_players in nb_players_by_type
    var possible_type = []
    for (var i in nb_players_by_type) {
        var possible_type_nb_players = [];
        for (var j in nb_players_by_type[i][1]) {
            if (nb_players_by_type[i][1][j] <= nb_players_max) {
                // console.log(nb_players_max, nb_players_by_type[i][0], nb_players_by_type[i][1][j]);
                possible_type_nb_players.push(nb_players_by_type[i][1][j]);
            }
        }
        if (possible_type_nb_players.length != 0) {
            possible_type.push([nb_players_by_type[i][0], possible_type_nb_players]);
        }
    }
    console.log("possible_type", possible_type)

    //random mode and random player number by that selected mode
    var selection_type_index = Math.floor(Math.random() * possible_type.length);
    var selected_type = possible_type[selection_type_index][0].toString();

    var selection_nb_players_index = Math.floor(Math.random() * possible_type[selection_type_index][1].length);
    var selected_nb_players = possible_type[selection_type_index][1][selection_nb_players_index].toString();

    var data = [selected_type, selected_nb_players, sentence_nature];
    return data;
}

function generate(nb_players_max) {
    var get_type = getType(nb_players_max);
    var type = get_type[0];
    var nb_players = get_type[1];
    var sentence_nature = get_type[2];

    var request = db().filter({nb_players:nb_players, type:type, parent_key:""}).get();
    var random = Math.floor(Math.random() * Math.floor(request.length));
    var key = request[random].key;
    var sentence = textReplacer(request[random].text);

    document.getElementById("ingame_sentence").innerHTML = sentence;
    addHistoryItem(0, sentence, key, type, sentence_nature);

    //generate other sentence if key is something
    if (key != "") {

        request = db().filter({nb_players:nb_players, type:type, parent_key:key}).get();
        random = Math.floor(Math.random() * Math.floor(request.length));
        sentence = textReplacer(request[random].text);


        if (sentence_nature == "yellow") {
            game.virus_triggered = true;
            randomEndVirus = Math.floor(Math.random() * (game.virus_end_max - game.virus_end_min)) + game.virus_end_min;

            request = db().filter({nb_players:nb_players, type:type, parent_key:key}).get();
            random = Math.floor(Math.random() * Math.floor(request.length));
            sentence = textReplacer(request[random].text);

            console.log("end virus: " + sentence)

            console.log(randomEndVirus, sentence, key, type, sentence_nature)
            addHistoryItem(randomEndVirus, sentence, key, type, sentence_nature);

        } else if (sentence_nature == "blue" || sentence_nature == "green" ) {
            addHistoryItem(0, sentence, key, type, sentence_nature);
        }
    }

    //disable down drinking after once
    if (sentence_nature == "red") {
        game.down_drinking_triggered = true;
    }
}