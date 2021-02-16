function init() {
    defaultVariables();
    filterVariables();
}

function dev_override_settings() {
    displayPage("menu")
    removeAllPlayers()
    generateRandomPlayer(4)
    game.display_indicator = true;
    // game.down_drinking_enabled = false;
    // game.virus_enabled = false;
    // game.social_posting_enabled = false;
}

function defaultVariables() {
    global = {
        settings_status: "masked",
        current_language: "fr",
        dev_mode: false,
    },
    tips = {            //fr
        painters: [""],
        asian_capital: [""],
        countries: [""],
        writers: [""],
        mathematicians: [""],
        physicists: [""],
        philosophers: [""]
    }
    game = {
        filter: {
            color_probability: {
                blue: 55,
                red: 5,
                green: 20,
                yellow: 20
            },
            type_by_color: {
                blue: [1, 8, 9, 10, 13, 15, 16, 18, 19, 24, 25],
                red: [5, 6, 7],
                green: [4, 11, 12, 14, 17, 20, 21, 22, 23],
                yellow: [2, 3]
            },
            type_by_gamemode: {
                bar: [1, 2, 4, 17, 18, 19, 20, 21, 22],
                default: [1, 2, 3, 4, 5, 14, 15, 23, 24, 25],
                hot: [1, 2, 3, 4, 7, 14, 23, 24, 25],
                silly: [1, 2, 3, 4, 6, 14, 23, 24, 25],
                war: [8, 9, 10, 11, 12, 13]
            },
            max_player_number_by_gamemode: {
                bar: [[0,1,2], [1,3], [], [0,1], [], [], [], [], [], [], [], [], [], [], [], [2,3], [0,1,2,3], [1,2], [1,2,3], [1], [1], [1], [], [], []],
                default: [[0,1,2,3,4], [1,2,3,4], [0,1], [0,1,2,3], [0,1,2,3,4], [], [], [], [], [], [], [], [], [0,1,2], [2], [], [], [], [], [], [], [], [0,1,2,3], [3], [0,1,2,3,4]],
                hot: [[0,1,2,3,4,5], [1,2], [0], [0,1,2], [], [], [1,2], [], [], [], [], [], [], [0,1,2,3], [], [], [], [], [], [], [], [], [0,1,2], [3,4], [0,1,2]],
                silly: [[0,1,2,3,4], [0,1,2], [0], [1,2,3], [], [0,1,2,3], [], [], [], [], [], [], [], [0,1], [], [], [], [], [], [], [], [], [0,1,2,3,4], [3,4], [0,1,2]],
                war: [[], [], [], [], [], [], [], [0,1,2], [0], [2,3], [0,1], [0,1], [0,1], [], [], [], [], [], [], [], [], [], [], [], []]
            },
        },
        
        db: {},                                             //All database

        player_list: [],
        max_player_number: -1,

        sip: { min: 2, max: 5 },
        started: false,
        cycle_id: -1,
        gamemode: "default",
        display_indicator: false,

        sentence_history: [],                               //sentence_history_item = { sentence,key,type,nature }
        sentence_amount: 50,

        down_drinking_enabled: true,
        down_drinking_triggered: false,
        down_drinking_sentence_id_start_min: 10,            // down_drinking start to appear after sentence_id X

        virus_enabled: true,
        virus_triggered: false,
        virus_end_min: 5,                                   // virus can end after X more sentence_id minimum
        virus_end_max: 12,                                  // virus can end after X more sentence_id maximum
        virus_sentence_id_start_min: 5,                     // virus start to appear after sentence_id X

        social_posting_enabled: false,
    }

    if (global.dev_mode == true) {
        dev_override_settings()
    }

    input_display_indicator.checked = game.display_indicator;
    input_down_drinking_enabled.checked = game.down_drinking_enabled;
    input_virus_enabled.checked = game.virus_enabled;
    input_social_posting_enabled.checked = game.social_posting_enabled;
    input_sip_min.value = game.sip.min;
    input_sip_max.value = game.sip.max;

    updateRecapSentenceIndicator();
    if (global.settings_status == "visible") {
        toggleSettingsPage()
    }
}

function toggleDisplayIndicator(force) {
    game.display_indicator = force;
    updateRecapSentenceIndicator();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark_mode')
}

function changeSipSettings(setting, value) {
    //prevent settings to be incoherent (ex: min_sip = 8 && max_sip == 4)
}

function createScriptElement(script_src) {
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
        hopper(game.type_by_color, "red");
    }
    if (game.virus_enabled == false) {
        //delete and share yellow probability into others colors
        hopper(game.type_by_color, "yellow");
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

function generateRandomPlayer(nb_players) {
    function randomHex(hex) {
        return (Math.random()*hex<<0).toString(16);
    }
    for (var i = 0; i < nb_players; i++ ) {
        var randomUUID = (randomHex(0xFFFFFFFF));
        addPlayer("JOUEUR#"+ (i+1))
        // addPlayer(randomUUID);
    }
}

function removePlayer(html_player_button) {
    var player_id = html_player_button.id.substring(14);
    game.player_list.splice(player_id, 1);
    //remove button
    html_player_button.remove();

    updateHTMLPlayerCount();
}

function removeAllPlayers() {
    player_list.innerHTML = "";
    game.player_list = [];
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
    document.getElementById("game_cycle_count").innerHTML = (game.cycle_id + 1) + "/" + game.sentence_amount;
}

function updateHTMLBackgroundColor(forced_color) {
    if (forced_color != undefined) {
        document.getElementById("game").className = "page dark_affected " + forced_color;
    } else {
        if (game.sentence_history.length == 0) {
            document.getElementById("game").className = "page blue"
        } else {
            document.getElementById("game").className = "page dark_affected " + game.sentence_history[game.cycle_id].color;
        }
    }
}

function updateHTMLIndicator(pos, color) {
    if (game.display_indicator == true || game.cycle_id == -1) {
        document.getElementById("recap_sentences_cell_" + pos).style = "background-color: var(--picolo_" + color + ")";
        document.getElementById("recap_sentences_cell_" + pos).onclick = "goToSpecificSentence(" + pos + ")";
    }
}

function initGame() {
    getMinPlayer()
    if (game.started == false) {
        
        game.started = true;
        createScriptElement("./src/js/db/" + game.gamemode + "_" + global.current_language + ".js")
        if (typeof db === "function") {
            initGame()
            retrieveDB()
            nextSentence();
            updateHTMLGameCycleCount();
            updateRecapSentenceIndicator();
        }
    }
    displayPage('game');
}

function exitGame() {
    document.getElementById("ingame_sentence").innerHTML = "";  // reset HTML sentence display
    game.sentence_history = [];                          // reset history
    defaultVariables()                                          //reset settings
    updateHTMLGameCycleCount()                                  // reset cycle count
    updateHTMLBackgroundColor();

    displayPage('menu');
}

function lunchSelectedGamemode(selected_gamemode) {
    selectGamemode(selected_gamemode);
    initGame();
}

function selectGamemode(selected_gamemode) {
    //this function only to add a console.log and purify HTML
    game.gamemode = selected_gamemode;
    console.log("/gamemode", selected_gamemode);
}

function updateGameCycle() {
    if (game.cycle_id > 0) {
        document.getElementById("game_cycle_previous_button").className = "btn btn-secondary btn-info";
        document.getElementById("game_cycle_previous_button").disabled = false;
    } else {
        document.getElementById("game_cycle_previous_button").className = "btn btn-secondary";
        document.getElementById("game_cycle_previous_button").disabled = true;
    }

    if (game.cycle_id == game.sentence_amount) {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary";
        document.getElementById("game_cycle_next_button").disabled = true;
    } else {
        document.getElementById("game_cycle_next_button").className = "btn btn-secondary btn-info";
        document.getElementById("game_cycle_next_button").disabled = false;
    }
}

function addHistoryItem(posOffset, database_id, sentence, key, type, color) {

    var offset_sentence_id = (game.cycle_id) + posOffset;
    if (posOffset > 0) {
        for (var i = 0; i < posOffset; i++) {
            var sentence_history_content = {
                id: "A0000000000000",
                sentence:"none"
            }
            game.sentence_history.push(sentence_history_content);
        }
    }
    var sentence_history_item = {
        database_id: database_id,
        sentence: sentence,
        key: key,
        type: type,
        color : color
    }
    updateHTMLIndicator((game.cycle_id) + posOffset, sentence_history_item.color);        

    if (game.sentence_history[game.cycle_id] == undefined) {
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

// function setCookie(cname, cvalue, exdays) {
//     var d = new Date();
//     d.setTime(d.getTime() + (exdays*24*60*60*1000));
//     var expires = "expires="+ d.toUTCString();
//     document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
// }

// function getCookie(cname) {
//     var name = cname + "=";
//     var decodedCookie = decodeURIComponent(document.cookie);
//     var ca = decodedCookie.split(';');
//     for(var i = 0; i <ca.length; i++) {
//       var c = ca[i];
//       while (c.charAt(0) == ' ') {
//         c = c.substring(1);
//       }
//       if (c.indexOf(name) == 0) {
//         return c.substring(name.length, c.length);
//       }
//     }
//     return "";
// }

// function deleteCookie(cname) {
//     document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
// }

// function deleteAllCookies() {
//     console.log("player_list cookie deleted")
//     deleteCookie("player_list")
//     console.log("settings cookie deleted")
//     deleteCookie("settings")
// }

// function savePlayerList() {
//     deleteCookie("player_list")
//     setCookie("player_list", game.player_list)
//     console.log(getCookie("player_list"))
// }