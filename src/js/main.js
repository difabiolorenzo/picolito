function init() {
    player_list = [];

    // generateRandomPlayer(Math.floor(Math.random() * 10))
    defaultVariables()
    filterVariables()
    // dev()
}

function dev() {
    displayPage('menu')
    createRecapSentenceIndicator()
    goGamePage()
}

function generateRandomPlayer(nb_players) {
    function randomHex(hex) {
        return (Math.random()*hex<<0).toString(16)
    }
    for (var i = 0; i < nb_players; i++ ) {
        var randomUUID = (randomHex(0xFFFFFFFF))
        player_list.push(randomUUID)
    }
}

function defaultVariables() {
    game = {
        sip: { min: 2, max: 5 },
        type_info : [
            ["blue", 55, [1, 8, 9, 10, 13, 15, 16, 18, 19, 24, 25]],
            ["red", 5, [5, 6, 7]],
            ["green", 15, [4, 11, 12, 14, 17, 20, 21, 22, 23]],
            ["yellow", 25, [2, 3]]
        ],
        type_used_by_gamemode: [
            ["bar", [1, 2, 4, 17, 18, 19, 20, 21, 22]],
            ["default", [1, 2, 3, 4, 5, 14, 15, 23, 24, 25]],
            ["hot", [1, 2, 3, 4, 7, 14, 23, 24, 25]],
            ["silly", [1, 2, 3, 4, 6, 14, 23, 24, 25]],
            ["war", [8, 9, 10, 11, 12, 13]]
        ],
        nb_players_info: [
            ["bar", [0,1,2], [1,3], ["X"], [0,1], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [2,3], [0,1,2,3], [1,2], [1,2,3], [1], [1], [1], ["X"], ["X"], ["X"]],
            ["default", [0,1,2,3,4], [1,2,3,4], [0,1], [0,1,2,3], [0,1,2,3,4], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2], [2], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2,3], [3], [0,1,2,3,4]],
            ["hot", [0,1,2,3,4,5], [1,2], [0], [0,1,2], ["X"], ["X"], [1,2], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2,3], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2], [3,4], [0,1,2]],
            ["silly", [0,1,2,3,4], [0,1,2], [0], [1,2,3], ["X"], [0,1,2,3], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2,3,4], [3,4], [0,1,2]],
            ["war", ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], [0,1,2], [0], [2,3], [0,1], [0,1], [0,1], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"], ["X"]]
        ],

        started: false,
        cycle_state: 0,
        gamemode: "default",
        display_indicator: false,

        sentence_history: [],
        sentence_amount: 50,

        down_drinking_actived: true,
        down_drinking_triggered: false,
        down_drinking_cycle_state_start_min: 10,                     // down_drinking start to appear after cycle_state X

        virus_actived: true,
        virus_amount: 1,
        virus_triggered: false,
        virus_end_min: 5,                                           // virus can end after X more cycle_state minimum
        virus_end_max: 12,                                          // virus can end after X more cycle_state maximum
        virus_cycle_state_start_min: 3,                             // virus start to appear after cycle_state X
    }
}

function create_script_element(script_src) {
    var headTag = document.getElementsByTagName("head").item(0);
    var scriptTag = document.createElement("script");
    scriptTag.src = script_src;
    headTag.appendChild(scriptTag);
}
 
function hopper(array, nature) {
    var probability = []
    for (var i in array) {
        if (array[i][0] == nature) {
            probability = array[i][1]
            array.splice(i, 1)
        }
    }
    
    for (var i in array) {
        array[i][1] = array[i][1] + (probability / array.length)
    }
}

function filterVariables() {
    if (game.down_drinking_actived == false) {
        //delete and share red probability into others colors
        hopper(game.type_info, "red")
    }
    if (game.virus_actived == false) {
        //delete and share yellow probability into others colors
        hopper(game.type_info, "yellow")
    }
}

// function addDatabases(gamemode, language) {
//     var script = document.createElement('script');
//     script.type = 'text/javascript';
//     script.src = "./src/js/db/" + gamemode + "_" + language + ".js";    

//     document.getElementsByTagName('head')[0].appendChild(script);
// }

function replaceAt(string, index, replace, length) {
    return string.substring(0, index) + replace + string.substring(index+length + 1);
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
    document.getElementById("game_cycle_count").innerHTML = game.cycle_state + "/" + game.sentence_amount
}

function updateHTMLBackgroundColor() {
    if (game.sentence_history[game.cycle_state - 1] == undefined) {
        previousSentence()
    } else {
        document.getElementById("game").className = "page " + game.sentence_history[game.cycle_state-1].nature
    }

}

function goGamePage() {
    create_script_element("./src/js/db/" + game.gamemode + "_fr.js")

    if (game.started == false) {
        game.started = true;
        nextSentence();
        updateHTMLGameCycleCount();
    }
    displayPage('game');
}

function createRecapSentenceIndicator() {
    game.display_indicator = true;
    var recap_sentences_html = ""
    for (var i = 0; i < game.sentence_amount; i++) {
        recap_sentences_html += "<td id='recap_sentences_cell_" + i + "' style='background-color:grey;'></td>"
    }
    document.getElementById("recapSentences").innerHTML = "<tbody><tr>"+ recap_sentences_html + "</tr></tbody>"

}

function exitGame() {
    defaultVariables();
    displayPage('menu')
}

function updateGameCycle() {
    if (game.cycle_state > 1) {
        document.getElementById("game_cycle_previous_button").className = "btn btn-secondary btn-info"
        document.getElementById("game_cycle_previous_button").disabled = false
    } else {
        document.getElementById("game_cycle_previous_button").className = "btn btn-secondary"
        document.getElementById("game_cycle_previous_button").disabled = true
    }

    if (game.cycle_state == game.sentence_amount) {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary"
        document.getElementById("game_cycle_next_button").disabled = true
    } else {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary btn-info"
        document.getElementById("game_cycle_next_button").disabled = false
    }
}

function addHistoryItem(posOffset, sentence, key, type, nature) {
    if (posOffset > 0) {
        for (var i = 0; i < posOffset; i++) {
            game.sentence_history.push({sentence:"none"});
        }
    }

    var sentence_history_item = {
        sentence: sentence,
        key: key,
        type: type,
        nature : nature
    }

    if (game.display_indicator == true) {
        document.getElementById("recap_sentences_cell_" + ((game.cycle_state - 1) + posOffset)).style = "background-color: var(--picolo_" + sentence_history_item.nature + ")"
    }

    if (game.sentence_history[game.cycle_state] == undefined) {
        game.sentence_history.push(sentence_history_item);
    } else if (game.sentence_history[game.cycle_state].sentence == "none") {
        game.sentence_history[(game.cycle_state - 1) + posOffset] = sentence_history_item
    }
}

function checkBuggySituation(sentence_history_item) {
    while (game.sentence_history[game.cycle_state - 1] == undefined) {
        game.cycle_state--
    }
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