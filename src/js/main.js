function init() {
    player_list = [];

    // generateRandomPlayer();
    defaultVariables();
    // goGamePage()
}

function generateRandomPlayer() {
    function randomHex(hex) {
        return (Math.random()*hex<<0).toString(16)
    }
    for (var i = 0; i < Math.floor(Math.random() * 10); i++ ) {
        var randomUUID = (randomHex(0xFFFFFFFF))
        player_list.push(randomUUID)
    }
}

function defaultVariables() {
    game = {
        started: false,
        cycle_state: 0,
        gamemode: "default",

        sip: { min: 1, max: 5 },
        type_info : [
            ["blue", 0.65, [1, 8, 9, 10, 13, 15, 16, 18, 19, 24, 25]],
            ["red", 0.05, [5, 6, 7]],
            ["green", 0.25, [4, 11, 12, 14, 17, 20, 21, 22, 23]],
            ["yellow", 0.05, [2, 3]]
        ],
        type_used_by_gamemode: [
            ["bar", [1, 2, 4, 17, 18, 19, 20, 21, 22]],
            ["default", [1, 2, 3, 4, 5, 14, 15, 23, 24, 25]],
            ["hot", [1, 2, 3, 4, 7, 14, 23, 24, 25]],
            ["silly", [1, 2, 3, 4, 6, 14, 23, 24, 25]],
            ["war", [8, 9, 10, 11, 12, 13]]
        ],
        nb_players_info: [   //"bar", "default", "hot", "silly", "war"
            ["bar", [0,1,2], [1,3], ["X"], [0,1], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [2,3], [0,1,2,3], [1,2], [1,2,3], [1], [1], [1], ["X"], ["X"], ["X"]],
            ["default", [0,1,2,3,4], [1,2,3,4], [0,1], [0,1,2,3], [0,1,2,3,4], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2], [2], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2,3], [3], [0,1,2,3,4]],
            ["hot", [0,1,2,3,4,5], [1,2], [0], [0,1,2], ["X"], ["X"], [1,2], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2,3], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2], [3,4], [0,1,2]],
            ["silly", [0,1,2,3,4], [0,1,2], [0], [1,2,3], ["X"], [0,1,2,3], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2,3,4], [3,4], [0,1,2]],
            ["war", ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2], [0], [2,3], [0,1], [0,1], [0,1], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"]]
        ],
        sentence_history: [],
        held_key: "",
        holding_key: false,

        sentence_amont: 50,
        have_down_drinked: false,
        virus_active: false,
        virus_end: undefined,
        allow_shot: true,
        player_disavantaged: false
    }
}

function addDatabases(gamemode, language) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = "./src/js/db/" + gamemode + "_" + language + ".js";    

    document.getElementsByTagName('head')[0].appendChild(script);
}

function replaceAt(string, index, replace, lenght) {
    return string.substring(0, index) + replace + string.substring(index+lenght + 1);
}

function displayPage(page) {
    document.getElementById('disclaimer').style = 'display:none';
    document.getElementById('menu').style = 'display:none';
    document.getElementById('gamemode').style = 'display:none';
    document.getElementById('game').style = 'display:none';

    document.getElementById(page).style = 'display:block';
}

function addPlayer() {
    var player_name = document.getElementById("player_input").value;
    if (player_name.length > 0 && player_name.length <= 50) {

        //prevent name start by spaces
        var start_by_space = true;
        for (var i = 0 ; i < player_name.length ; i++) {
            if (player_name.charAt(i) == " ") {
            } else {
                start_by_space = false;
                player_name = player_name.substr(i, player_name.length-i);
                if (player_name.length != 0) {
                    //add button with player name
                    document.getElementById("player_list").innerHTML += "<button id='player_button_" + player_list.length + "' class='btn btn-danger' onclick='removePlayer(this)'>" + player_name + " <span class='glyphicon glyphicon-remove' aria-hidden='true'></span></button>";

                    player_list.push(player_name);
                }
                break;
            }
        }
    }
    document.getElementById("player_input").value = "";
    document.getElementById("player_input").focus();

    updateHTMLPlayerCount();
}

function removePlayer(player_button) {
    var player_id = player_button.id.substring(14);
    player_list.splice(player_id, 1);
    //remove button
    player_button.remove();

    updateHTMLPlayerCount();
}

function updateHTMLPlayerCount() {
    document.getElementById("player_number").innerHTML = player_list.length + " joueur(s)";
}

function updateHTMLGameCycleCount() {
    document.getElementById("game_cycle_count").innerHTML = game.cycle_state + "/" + game.sentence_amont
}

function updateHTMLBackgroundColor() {
    document.getElementById("game").className = "page " + game.sentence_history[game.cycle_state-1].nature
}

function goGamePage() {
    if (game.started == false) {
        game.started = true;
        nextSentence();
        updateHTMLGameCycleCount();
    }
    displayPage('game');
}

function exitGame() {
    defaultVariables();
    displayPage('menu')
}

function nextSentence() {
    if (game.cycle_state < game.sentence_amont) {
        game.cycle_state++;
        checkGameCycle()
        updateHTMLGameCycleCount()

        //nb_players_max
        if (player_list.length > 4) {
            var nb_players_max = 4;
        } else {
            var nb_players_max = player_list.length;
        }

        //generate or retrieve
        if (game.sentence_history[game.cycle_state] == undefined) {
            generate(nb_players_max);
        } else {
            retrieve(game.cycle_state);
        }
        updateHTMLBackgroundColor()
    }
}

function previousSentence() {
    game.cycle_state--;
    checkGameCycle()
    updateHTMLGameCycleCount()
    updateHTMLBackgroundColor()

    retrieve( game.cycle_state - 1 )
}

function checkGameCycle() {
    if (game.cycle_state > 1) {
        document.getElementById("game_cycle_previous_button").className = "btn btn-secondary btn-info"
        document.getElementById("game_cycle_previous_button").disabled = false
    } else {
        document.getElementById("game_cycle_previous_button").className = "btn btn-secondary"
        document.getElementById("game_cycle_previous_button").disabled = true
    }

    if (game.cycle_state == game.sentence_amont) {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary"
        document.getElementById("game_cycle_next_button").disabled = true
    } else {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary btn-info"
        document.getElementById("game_cycle_next_button").disabled = false
    }
}

function generate(nb_players_max) {
    
    while (request == undefined) {
        var get_type = getType(nb_players_max);
        var type = get_type[0];
        var nb_players = get_type[1];
        var sentence_nature = get_type[2];
    
        var request = db().filter({nb_players:nb_players.toString(), type:type}).get();
        // console.log("request", request)
        var random = Math.floor(Math.random() * Math.floor(request.length));
        var sentence = brigadier(request[random].text);
    }

    document.getElementById("ingame_sentence").innerHTML = sentence;

    var sentence_history_item = {
        id: game.cycle_state,
        sentence: sentence,
        type: type,
        nature : sentence_nature
    }
    game.sentence_history.push(sentence_history_item);
}

function retrieve(sentence_id) {
    var sentence_requested = game.sentence_history[sentence_id]
    document.getElementById("ingame_sentence").innerHTML = sentence_requested.sentence;
    updateHTMLGameCycleCount()
}

function getType(nb_players_max) {

    //sorting raw default type data
    var probability_list = [];
    for (var i in game.type_info) {
        probability_list.push(game.type_info[i])
    }
    probability_list.sort( function(a, b) { return a[1] - b[1]; } );

    //random between 0 and 1
    while (random_probability == 0 || random_probability == 1 || random_probability == undefined) {
        var random_probability = 1 - Math.round(Math.random() * 100) / 100
    }

    //get type by random number
    var selected_type = []
    var sentence_nature = ""
    var random_probability_step = 0;
    var random_probability_next_step = 0;
    for (var i = 0; i < probability_list.length; i++) {

        random_probability_next_step = random_probability_next_step + probability_list[i][1];

        if (random_probability > random_probability_step && random_probability < random_probability_next_step) {
            sentence_nature = probability_list[i][0]
            selected_type = probability_list[i]
        }
        random_probability_step = random_probability_next_step;
    }

    //get type by selected gamemode
    var possible_type_by_gamemode
    var useable_type_by_gamemode = []
    for (var i in game.type_used_by_gamemode) {
        if (game.gamemode == game.type_used_by_gamemode[i][0]) {
            possible_type_by_gamemode = game.type_used_by_gamemode[i]
            break;
        }
    }

    for (var i in possible_type_by_gamemode[1]) {
        for (var j in selected_type[2]) {
            if (possible_type_by_gamemode[1][i] == selected_type[2][j]) {
                useable_type_by_gamemode.push(possible_type_by_gamemode[1][i])
            }
        }
    }

    // get nb_players by gamemode
    var nb_players_by_type = []
    for (var i in useable_type_by_gamemode) {
        for (var j in game.nb_players_info) {
            if (game.nb_players_info[j][0] == game.gamemode) {
                nb_players_by_type.push([useable_type_by_gamemode[i], game.nb_players_info[j][useable_type_by_gamemode[i]]])
            }
        }
    }

    //select type by compatible nb_players in nb_players_by_type
    var possible_type = []
    for (var i in nb_players_by_type) {
        var possible_type_nb_players = []
        for (var j in nb_players_by_type[i][1]) {
            if (nb_players_by_type[i][1][j] <= nb_players_max) {
                // console.log(nb_players_max, nb_players_by_type[i][0], nb_players_by_type[i][1][j])
                possible_type_nb_players.push(nb_players_by_type[i][1][j])
            }
        }
        if (possible_type_nb_players.length != 0) {
            possible_type.push([nb_players_by_type[i][0], possible_type_nb_players])
        }
    }

    //random mode and random player number by that selected mode
    var selection_type_index = Math.floor(Math.random() * possible_type.length)
    var selected_type = possible_type[selection_type_index][0].toString()

    var selection_nb_players_index = Math.floor(Math.random() * possible_type[selection_type_index][1].length)
    var selected_nb_players = possible_type[selection_type_index][1][selection_nb_players_index]
    
    // var type = useable_type_by_gamemode[Math.floor(Math.random() * useable_type_by_gamemode.length)].toString()

    //type selection from possible_type
    // var selected_type_index = Math.floor(Math.random() * possible_type.length)
    // var selected_type = (possible_type[selected_type_index][0]).toString()
    // var selected_nb_players = Math.floor(Math.random() * (possible_type[selected_type_index][1][1] - possible_type[selected_type_index][1][0])) + possible_type[selected_type_index][1][0]

    var data = [selected_type, selected_nb_players, sentence_nature]
    // console.log("data", data)

    return data;
}

function brigadier(text) {
    // retrieve all player name
    var player_name_list = []
    for (var i = 0 ; i < player_list.length ; i++) { player_name_list.push(player_list[i]) }

    for (var i = 0 ; i < text.length ; i++) {
        // change $ by random sip
        if (text.charAt(i) == "$") {
            var random_sip = Math.floor(Math.random() * (game.sip.max - game.sip.min) + game.sip.min)
            text = replaceAt(text, i, random_sip, 0);
        }
        // change %s by random player
        if (text.charAt(i) == "%" && text.charAt(i+1) == "s") {
            
            var random_player_index = Math.floor(Math.random() * player_name_list.length)
            var random_player = player_name_list[random_player_index]
            player_name_list.splice(random_player_index,1)

            var random_sip = Math.floor(Math.random() * (game.sip.max - game.sip.min) + game.sip.min)
            text = replaceAt(text, i, random_player, 1)
        }
    }
    return text;
}