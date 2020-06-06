function init() {
    gamemode = "default"
    player_list = [];

    defaultVariables();
    goGamePage()
}

function defaultVariables() {
    game = {
        started: false,
        cycle_state: 0,

        settings: {
            sentence_amont: 50
        },
        sip: { min: 1, max: 5 },
        probability: { default: 1, blue: 0.6, red: 0.05, green: 0.3, yellow: 0.25 },
        nature: { blue: [1, 8, 10, 13, 15, 16, 18, 19, 24, 25], red: [5, 6, 7], green: [4, 11, 12, 14, 17, 20, 21, 25, 23], yellow: [2, 3] },

        sentence_history: [],

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
    document.getElementById("game_cycle_count").innerHTML = game.cycle_state + "/" + game.settings.sentence_amont
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

function nextSentence(){
    if (game.cycle_state < game.settings.sentence_amont) {
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
    }
}

function previousSentence() {
    game.cycle_state--;
    checkGameCycle()
    updateHTMLGameCycleCount()

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

    if (game.cycle_state == game.settings.sentence_amont) {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary"
        document.getElementById("game_cycle_next_button").disabled = true
    } else {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary btn-info"
        document.getElementById("game_cycle_next_button").disabled = false
    }
}

function generate(nb_players_max) {
    
    var type = getType();
    var nature = "blue";
    
    if (nb_players_max > 0) {
        var nb_players = Math.floor(Math.random() * nb_players_max) + 1
    } else {
        var nb_players = 0
    }

    var request = default_fr().filter({nb_players:nb_players.toString(), type:type.toString()}).get();
    var random = Math.floor(Math.random() * Math.floor(request.length));
    var sentence = brigadier(request[random].text);

    document.getElementById("ingame_sentence").innerHTML = sentence;

    document.getElementById("game").className = "page " + nature;

    var sentence_history_item = {
        id: game.cycle_state,
        sentence: sentence,
        type: type,
        nature: nature
    }
    game.sentence_history.push(sentence_history_item);
}

function retrieve(sentence_id) {
    var sentence_requested = game.sentence_history[sentence_id]
    document.getElementById("ingame_sentence").innerHTML = sentence_requested.sentence;
    updateHTMLGameCycleCount()
}

function getType() {

    var nature_probability = [];
    for (var i in game.probability) { nature_probability.push([i, game.probability[i]]); }
    nature_probability.sort( function(a, b) { return a[1] - b[1]; } );
    console.log(nature_probability)

    // var random_type_probability = 1 - Math.round(Math.random() * 100) / 100
    // console.log(random_type_probability)

    for (var i = 0; i < nature_probability; i++) {
    }

    // if (Math.random() <= 0.66) { }
    // if (Math.random() >= 0.5) console.log("type vert");

    var type = 1;
    return type;
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