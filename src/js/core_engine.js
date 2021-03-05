function nextSentence() {
    if (game.cycle_id < game.sentence_amount - 1) {
        game.cycle_id++;
        
        retrieve(game.cycle_id);

        updateHTMLBackgroundColor();
        updateGameCycle();
        displaySentenceList(true);
    }
}

function previousSentence() {
    if (game.cycle_id > 0) {
        game.cycle_id--;
        goToSpecificSentence(game.cycle_id)
    }
}

function goToSpecificSentence(position) {
    game.cycle_id = position;
    
    updateGameCycle();
    updateHTMLBackgroundColor();
    updateRecapSentenceIndicator(position, game.sentence_history[position].color);
    retrieve(position);
    displaySentenceList(true);
}

function retrieveDB() {
    game.database = TAFFY(db().get())
}

function getMinPlayer() {
    if (game.gamemode == "war" && game.player_list.length >= 3) {
        game.max_player_number = 3;
    } else if (game.gamemode != "war" && game.player_list.length >= 4) {
        game.max_player_number = 4;
    } else {
        game.max_player_number = game.player_list.length;
    }
    console.log("min player", game.max_player_number)
}

function retrieve(sentence_id) {
    //generate or retrieve
    if (game.sentence_history[game.cycle_id] == undefined || game.sentence_history[game.cycle_id].sentence == "none") {
        generate();
    } else {
        var sentence_requested = game.sentence_history[sentence_id];
        document.getElementById("ingame_sentence").innerHTML = sentence_requested.sentence;
        updateGameCycle();
    }
}

function getRandomColor() {
    var available_color_probability = [];
    if (game.down_drinking_enabled == true && game.down_drinking_sentence_id_start_min <= game.cycle_id && game.down_drinking_triggered == false && game.gamemode != "war") {
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

    //random percentage
    while (random_percent == 0 || random_percent == 1 || random_percent == undefined) {
        var random_percent = Math.round(Math.random() * 100);
    }

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
    if (game.max_player_number != -1) {
        var type_by_gamemode = [];
        var max_player_number_by_gamemode = [];
        switch (game.gamemode) {
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
            default:
        }

        var color_gamemode_matching_type = []
        for (var i in type_by_gamemode) {
            for (var j in type_by_color) {
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
        for (var i in color_gamemode_matching_type) {
            var checking_cg_matching_type = color_gamemode_matching_type[i]
            var checking_mp_by_gamemode = max_player_number_by_gamemode[checking_cg_matching_type-1];
            if (checking_mp_by_gamemode.length != 0) {
                for (var j in checking_mp_by_gamemode) {
                    if (checking_mp_by_gamemode[j] <= game.max_player_number) {
                        potential_type.push(checking_cg_matching_type)
                    }
                }
            }
        }
    
        var random_type_index = Math.floor(Math.random() * potential_type.length);
        var selected_type = potential_type[random_type_index];

        return [color, selected_type];
    } else {
        getMinPlayer()
        getRandomType()
    }
}

function generate() {
    console.clear()
    var get_random_color_type = getRandomType();
    var color = get_random_color_type[0];
    var type = get_random_color_type[1];        // text
    var max_player = game.max_player_number;
    console.log(get_random_color_type, color, type, max_player)

    function getSentence(use_parent_key, selected_nb_players, selected_type) {
        if (use_parent_key == false) {
            return game.database().filter({nb_players:selected_nb_players, type:selected_type, parent_key:""}).get();
        } else {
            return game.database().filter({nb_players:selected_nb_players, type:selected_type, parent_key:key}).get();
        }
    }

    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        sentence = textReplacer(request[random_int].text);
        console.log(request[random_int].key)
        if (request[random_int].key != "") { key = request[random_int].key; }
        console.log(random_int, sentence)

        //remove sentence from db
        game.database().filter({___id:database_id}).remove();
        console.log(database_id, "removed")
    }

    var request = []
    var key = "";
    var sentence = "";
    var database_id = "";

    //get sentence from lower nb_player
    for (var i = 0; i <= max_player; i++) {
        var addind_request = getSentence(false, i.toString(), type.toString())
        request.push(...addind_request)
    }
    getRandomSentence()
    console.log("request", request)
    console.log(color, "type", type, "max_player", max_player, "key", key)
    console.log(color, "type", type, "max_player", max_player, "key", key)

    updateHTMLBackgroundColor(color);
    document.getElementById("ingame_sentence").innerHTML = sentence;
    addHistoryItem(0, database_id, sentence, key, type, color);

    if (key != "") {
        request = [];
        sentence = "";
        database_id = "";
        
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
            addHistoryItem(random_virus_end, database_id, sentence, key, type, color);

            game.virus_established_start = game.cycle_id;
            game.virus_established_end = game.cycle_id + random_virus_end;

        } else if (color == "blue" || color == "green" ) {
            addHistoryItem(1, database_id, sentence, key, type, color);
        }

    }

    //disable down drinking if trigerred
    if (color == "red") {
        game.down_drinking_triggered = true;
    }
}