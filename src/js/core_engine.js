function nextSentence(close_sentence_list) {
    if (game.cycle_id < game.sentence_amount - 1) {
        game.cycle_id++;
        retrieve(game.cycle_id);

        updateHTMLBackgroundColor();
        updateGameCycle();
        
        if (close_sentence_list == true) {
            displaySentenceList(true);
        } else {
            updateSentenceList()
        }
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
    retrieve(position);
    displaySentenceList(true);
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
    //generate or retrieve
    if (game.sentence_history[game.cycle_id] == undefined || game.sentence_history[game.cycle_id].sentence == "none") {
        if (game.gamemode == "never_popular" || game.gamemode == "never_party" || game.gamemode == "never_hot"|| game.gamemode == "never_mix") {
            generateNeverDoneSentences();
        } else {
            generatePicoloSentences();
        }
    } else {
        var sentence_requested = game.sentence_history[sentence_id];
        displaySentence(sentence_requested.sentence, sentence_requested.color, sentence_requested.pack_name);
        updateGameCycle();
    }
}

function displaySentence(sentence, color, pack_name) {
    ingame_sentence.className = ""
    ingame_title.className = ""
    ingame_gamemode_information.innerHTML = "";

    setTimeout(function() {
        if (game.animation == true) {
            ingame_sentence.className = "animation_text_change";
            ingame_title.className = "animation_text_change";
        }
        document.getElementById("ingame_sentence").innerHTML = sentence;
    }, 0);
    
    if (color == "yellow") {
        ingame_title.innerText = global.current_language_strings.virus;
    } else {
        ingame_title.innerText = "";
    }
    ingame_gamemode_information.innerHTML = pack_name;
}

function randomPercentage() {
    while (random_percent == 0 || random_percent == 100 || random_percent == undefined) {
        var random_percent = Math.floor(Math.random() * 100);
    }
    return random_percent;
}

function getRandomColor() {
    var available_color_probability = [];
    if (game.shot_enabled == true && game.shot_sentence_id_start_min <= game.cycle_id && game.shot_remaining > 0 && game.gamemode != "war") {
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
            var checking_cg_matching_type = color_gamemode_matching_type[i];
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

        return [color, selected_type, potential_type];
    } else {
        getMinPlayer()
        getRandomType()
    }
}

function generateNeverDoneSentences() {

    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        sentence = textReplacer(request[random_int].text);
        pack_name = request[random_int].pack_name;
        if (request[random_int].key != "") { key = request[random_int].key; }
        console.log(random_int, sentence)

        //remove sentence from db
        game.database().filter({___id:database_id}).remove();
        console.log(database_id, "never_done removed")
    }

    var request = game.database().get();
    
    getRandomSentence()

    updateHTMLBackgroundColor("purple");
    displaySentence(sentence, "purple", pack_name);
    addHistoryItem(0, database_id, sentence, undefined, undefined, "purple", pack_name);
}

function generatePicoloSentences() {
    var get_random_color_type = getRandomType();
    var color = get_random_color_type[0];
    var type = get_random_color_type[1];        // text
    var max_player = game.max_player_number;
    console.log(get_random_color_type, color, "type", type, "max_player", max_player);

    var request = [];
    var key = "";
    var sentence = "";
    var database_id = "";
    var pack_name = "";
    var color = ""
    var type = ""
    var max_player = game.max_player_number;

    function setVariables() {
        var get_random_color_type = getRandomType();
        color = get_random_color_type[0];
        type = get_random_color_type[1];        // text
        console.log(get_random_color_type, color, "type", type, "max_player", max_player);
    }
    setVariables()

    function getSentence(use_parent_key, selected_nb_players, selected_type) {
        if (use_parent_key == false) {
            return game.database().filter({nb_players:selected_nb_players, type:selected_type, parent_key:""}).get();
        } else {
            return game.database().filter({nb_players:selected_nb_players, type:selected_type, parent_key:key}).get();
        }
    }

    function requestEveryMinPlayer() {
        //get sentence from lower nb_player to max_player
        for (var i=0; i<= max_player; i++) {
            var addind_request = getSentence(false, i.toString(), type.toString()); //getSentence(use_parent_key, selected_nb_players, selected_type)
            request.push(...addind_request);
        }
        if (request.length == 0) {
            console.log("REPICK TYPE", type)
            game.filter.empty_type.push(type)
            alert("REPICK TYPE");
        }
    }
    requestEveryMinPlayer()


    
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

    updateHTMLBackgroundColor(color);
    displaySentence(sentence, color, pack_name);
    addHistoryItem(0, database_id, sentence, key, type, color, pack_name);

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
            addHistoryItem(random_virus_end, database_id, sentence, key, type, color, pack_name);

            game.virus_established_start = game.cycle_id;
            game.virus_established_end = game.cycle_id + random_virus_end;

        } else if (color == "blue" || color == "green" ) {
            addHistoryItem(1, database_id, sentence, key, type, color, pack_name);
        }

    }

    //disable down drinking if trigerred
    //shot_remaining-- if more than 1 down drinking is set
    if (color == "red") {
        game.shot_remaining--;
    }
}

function randomDiceUnicode() {
    function randomUnicode() {
        array = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
        return array[Math.floor(Math.random() * array.length)];
    }
    function changeDice(dice) {
        dice.innerHTML = randomUnicode();
    }

    var min_timing = 300;
    var step_timing = 150;
    setTimeout(function(){ changeDice(dice_0) }, Math.floor(Math.random() * step_timing) + min_timing );
    setTimeout(function(){ changeDice(dice_1) }, Math.floor(Math.random() * step_timing) + min_timing );
    setTimeout(function(){ changeDice(dice_0) }, Math.floor(Math.random() * step_timing) + min_timing );
    setTimeout(function(){ changeDice(dice_1) }, Math.floor(Math.random() * step_timing) + min_timing );
    setTimeout(function(){ changeDice(dice_0) }, Math.floor(Math.random() * step_timing) + min_timing );
    setTimeout(function(){ changeDice(dice_1) }, Math.floor(Math.random() * step_timing) + min_timing );
    setTimeout(function(){ changeDice(dice_0) }, Math.floor(Math.random() * step_timing) + min_timing );
    setTimeout(function(){ changeDice(dice_1) }, Math.floor(Math.random() * step_timing) + min_timing );
}

function randomCardUnicode() {
    var card_spade = ["🂡","🂢","🂣","🂤","🂥","🂦","🂧","🂨","🂩","🂪","🂫","🂬","🂭","🂮"];
    var card_heart = ["🂱","🂲","🂳","🂴","🂵","🂶","🂷","🂸","🂹","🂺","🂻","🂼","🂽","🂾"];
    var card_club = ["🃑","🃒","🃓","🃔","🃕","🃖","🃗","🃘","🃙","🃚","🃛","🃜","🃝","🃞"];
    var card_diamond = ["🃁","🃂","🃃","🃄","🃅","🃆","🃇","🃈","🃉","🃊","🃋","🃌","🃍","🃎"];
    var card_sign = [card_spade, card_heart, card_club, card_diamond];

    var random_sign = card_sign[Math.floor(Math.random()*card_sign.length)]
    var random_card = random_sign[Math.floor(Math.random()*random_sign.length)]
    card_placeolder.innerHTML = random_card
}