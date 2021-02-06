function init() {
    defaultVariables();
    filterVariables();
}

function dev_override_settings() {
    game.display_indicator = true;
    // game.down_drinking_enabled = false;
    // game.virus_enabled = false;
    global.always_display_disclaimer = false;
}

function generateRandomPlayer(nb_players) {
    function randomHex(hex) {
        return (Math.random()*hex<<0).toString(16);
    }
    for (var i = 0; i < nb_players; i++ ) {
        var randomUUID = (randomHex(0xFFFFFFFF));

        addPlayer(randomUUID);
    }
}

function defaultVariables() {
    global = {
        settings_status: "masked",
        always_display_disclaimer: true,
        current_language: "fr",
        dev_mode: true,
    },
    game = {
        type_info : [
            ["blue", 55, [1, 8, 9, 10, 13, 15, 16, 18, 19, 24, 25]],
            ["red", 5, [5, 6, 7]],
            ["green", 20, [4, 11, 12, 14, 17, 20, 21, 22, 23]],
            ["yellow", 20, [2, 3]]
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

        player_list: [],

        sip: { min: 2, max: 5 },
        started: false,
        sentence_id: -1,
        gamemode: "default",
        display_indicator: false,

        sentence_history: [],
        sentence_amount: 50,

        down_drinking_enabled: true,
        down_drinking_triggered: false,
        down_drinking_sentence_id_start_min: 10,                     // down_drinking start to appear after sentence_id X

        virus_enabled: true,
        virus_triggered: false,
        virus_end_min: 5,                                           // virus can end after X more sentence_id minimum
        virus_end_max: 12,                                          // virus can end after X more sentence_id maximum
        virus_sentence_id_start_min: 5,                             // virus start to appear after sentence_id X
    }

    if (global.dev_mode == true) {
        // dev_override_settings()
    }

    input_display_indicator.checked = game.display_indicator;
    input_down_drinking_enabled.checked = game.down_drinking_enabled;
    input_virus_enabled.checked = game.virus_enabled;

    updateRecapSentenceIndicator();
    if (global.settings_status == "visible") {
        toggleSettingsPage()
    }
}

function lunchSelectedGamemode(selected_gamemode) {
    selectGamemode(selected_gamemode);
    initGame();
}

function selectGamemode(selected_gamemode) {
    //this function only to add a console.log and purify HTML
    game.gamemode = selected_gamemode;
    console.log(selected_gamemode);
}

function toggleDisplayIndicator(force) {
    game.display_indicator = force;
    updateRecapSentenceIndicator();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark_mode')
}

function create_script_element(script_src) {
    var headTag = document.getElementsByTagName("head").item(0);
    var scriptTag = document.createElement("script");
    scriptTag.src = script_src;
    headTag.appendChild(scriptTag);
}
 
function hopper(array, nature) {
    var probability = [];
    for (var i in array) {
        if (array[i][0] == nature) {
            probability = array[i][1];
            array.splice(i, 1);
        }
    }
    
    for (var i in array) {
        array[i][1] = array[i][1] + (probability / array.length);
    }
}

function filterVariables() {
    if (game.down_drinking_enabled == false) {
        //delete and share red probability into others colors
        hopper(game.type_info, "red");
    }
    if (game.virus_enabled == false) {
        //delete and share yellow probability into others colors
        hopper(game.type_info, "yellow");
    }
}

function replaceAt(string, index, replace, length) {
    return string.substring(0, index) + replace + string.substring(index+length + 1);
}

function displayPage(page) {
    document.getElementById('disclaimer').style.display = 'none';
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gamemode').style.display = 'none';
    document.getElementById('game').style.display = 'none';

    document.getElementById(page).style.display = 'block';
}

function toggleSettingsPage() {
    if (global.settings_status == "masked") {
        global.settings_status = "visible";

        document.getElementById("button_menu_settings").style.display = "none";
        document.getElementById("button_menu_links").style.display = "initial";
        document.getElementById("menu_links").style.display = "none";
        document.getElementById("settings").style.display = "initial";
    } else {
        global.settings_status = "masked";
        
        document.getElementById("button_menu_settings").style.display = "initial";
        document.getElementById("button_menu_links").style.display = "none";
        document.getElementById("menu_links").style.display = "initial";
        document.getElementById("settings").style.display = "none";
    }
}

function addPlayer(player_name) {
    if (player_name == undefined) {
        var player_name = document.getElementById("player_input").value;
    }

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
                    document.getElementById("player_list").innerHTML += "<button id='player_button_" + game.player_list.length + "' class='btn btn-danger' onclick='removePlayer(this)'>" + player_name + " ✖ <span class='glyphicon glyphicon-remove' aria-hidden='true'></span></button>";

                    game.player_list.push(player_name);
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
    game.player_list.splice(player_id, 1);
    //remove button
    player_button.remove();

    updateHTMLPlayerCount();
}

function updateHTMLPlayerCount() {
    if (game.player_list.length > 1) {
        var text = " joueurs";
    } else {
        var text = " joueur";
    }

    document.getElementById("player_number").innerHTML = game.player_list.length + text;
}

function updateHTMLGameCycleCount() {
    document.getElementById("game_cycle_count").innerHTML = (game.sentence_id + 1) + "/" + game.sentence_amount;
}

function updateHTMLBackgroundColor() {
    if (game.sentence_history.length == 0) {
        document.getElementById("game").className = "page blue"
    } else if (game.sentence_history[game.sentence_id] == undefined) {
        previousSentence();
    } else {
        document.getElementById("game").className = "page " + game.sentence_history[game.sentence_id].nature;
    }

}

function updateHTMLIndicator(pos, color) {
    if (game.display_indicator == true) {
        document.getElementById("recap_sentences_cell_" + pos).style = "background-color: var(--picolo_" + color + ")";
        document.getElementById("recap_sentences_cell_" + pos).onclick = "console.log(this)";
    }
}

function initGame() {

    if (game.started == false) {
        game.started = true;
        
        create_script_element("./src/js/db/" + game.gamemode + "_" + global.current_language + ".js")
        if (typeof db === "function") {
            initGame()
            nextSentence(); //DB requested
            updateHTMLGameCycleCount();
            updateRecapSentenceIndicator();
        }
    }
    displayPage('game');
}

function startGame() {
    document.getElementById('game_cycle_next_button').innerHTML = '>';
}

function exitGame() {
    document.getElementById("ingame_sentence").innerHTML = "";  // reset HTML sentence display
    game.sentence_history = [];                          // reset history
    defaultVariables()                                          //reset settings
    updateHTMLGameCycleCount()                                  // reset cycle count
    updateHTMLBackgroundColor();

    displayPage('menu');
}

function updateGameCycle() {
    if (game.sentence_id > 0) {
        document.getElementById("game_cycle_previous_button").className = "btn btn-secondary btn-info";
        document.getElementById("game_cycle_previous_button").disabled = false;
    } else {
        document.getElementById("game_cycle_previous_button").className = "btn btn-secondary";
        document.getElementById("game_cycle_previous_button").disabled = true;
    }

    if (game.sentence_id == game.sentence_amount) {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary";
        document.getElementById("game_cycle_next_button").disabled = true;
    } else {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary btn-info";
        document.getElementById("game_cycle_next_button").disabled = false;
    }
}

function addHistoryItem(posOffset, sentence, key, type, nature) {

    var offset_sentence_id = (game.sentence_id) + posOffset;
    console.log(posOffset, sentence, key, type, nature)
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
    updateHTMLIndicator((game.sentence_id) + posOffset, sentence_history_item.nature);        

    if (game.sentence_history[game.sentence_id] == undefined) {
        game.sentence_history.push(sentence_history_item);
    } else if (game.sentence_history[offset_sentence_id].sentence == "none") {
        game.sentence_history[offset_sentence_id] = sentence_history_item;
    }
}

function textReplacer(text) {
    // retrieve all player name
    var player_name_list = [];
    for (var i = 0 ; i < game.player_list.length ; i++) { player_name_list.push(game.player_list[i]) }

    for (var i = 0 ; i < text.length ; i++) {
        // change $ by random sip
        if (text.charAt(i) == "$") {
            var random_sip = Math.floor(Math.random() * (game.sip.max - game.sip.min) + game.sip.min);
            text = replaceAt(text, i, random_sip, 0);
        }
        // change %s by random player
        if (text.charAt(i) == "%" && text.charAt(i+1) == "s") {
            
            var random_player_index = Math.floor(Math.random() * player_name_list.length);
            var random_player = player_name_list[random_player_index];
            player_name_list.splice(random_player_index,1);

            var random_sip = Math.floor(Math.random() * (game.sip.max - game.sip.min) + game.sip.min);
            text = replaceAt(text, i, random_player, 1);
        }
    }
    return text;
}

function updateRecapSentenceIndicator() {
    var html_recap_sentences = document.getElementById("html_recap_sentences")
    var html_recap_sentences_elements = "";
    html_recap_sentences.innerHTML = "";
    
    if (game.display_indicator == true) {
        for (var i = 0; i < game.sentence_amount; i++) {
            html_recap_sentences_elements += "<td id='recap_sentences_cell_" + i + "' style='background-color:grey;'></td>";
        }
        html_recap_sentences.innerHTML = "<tbody><tr>"+ html_recap_sentences_elements + "</tr></tbody>";
    }
}

function displaySentenceList(force_ingame) {
    var ingame_text = document.getElementById("ingame_text");
    var sentence_list = document.getElementById("sentence_list");

    if (force_ingame == true || ingame_text.style.display == "none") {
        ingame_text.style.display = "block";
        sentence_list.style.display = "none";
    } else {
        ingame_text.style.display = "none";
        sentence_list.style.display = "block";
    }
}

window.addEventListener("keydown", function(event) {
    if ( game.started == true ) {
        switch (event.key) {
            case "ArrowLeft":
                previousSentence();
                break;
            case "ArrowRight":
                nextSentence();
                break;
        }
    }
  }, true);
