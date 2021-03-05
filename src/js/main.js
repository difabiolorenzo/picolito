function init() {
    defaultVariables();
    filterVariables();
}

function dev_override_settings() {
    displayPage("menu")
    removeAllPlayers()
    generateRandomPlayer(4)
    game.display_indicator = true;
    toggleDisplayIndicator(true)
    // game.down_drinking_enabled = false;
    // game.virus_enabled = false;
    // game.social_posting_enabled = false;

    lunchSelectedGamemode("default")
}

function defaultVariables(reinit) {
    global = {
        current_language: "fr",
        dev_mode: false,
        settings_status: "masked",
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
                blue: 70,
                red: 5,
                green: 20,
                yellow: 5
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
        
        db: {},                                             //Full database for GAMEMODE_LANG.js ; is an TAFFY()

        player_list: [],
        max_player_number: -1,

        team_1: "EQUIPE# 1",
        team_2: "EQUIPE# 2",
        team_1_player_list: [],
        team_2_player_list: [],

        random_team_name: {
            fr: ["les Pastis", "les Binouses", "les 8·6", "les Brindillettes", "les Pinards", "les Poivrots", "les Gnôles", "les Pochards", "les Pictons", "les Bibines", "les Lichettes", "les Vinasses", "les Soulards", "les Allumés", "les Soiffard", "les Avaloirs", "les Vitriols", "les Bandeurs", "les Berlingots", "les Bistouquettes", "les Chagattes", "les Queues", "les Braquemards", "les Engins", "les Burnes", "les Limeurs", "les Tringlés", "les Croupions", "les Bougres", "les Inverti"],
        },

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
        virus_remaining: 1,                                 // virus can occur X times (still overlap...)
        virus_end_min: 5,                                   // virus can end after X more sentence_id minimum
        virus_end_max: 12,                                  // virus can end after X more sentence_id maximum
        virus_sentence_id_start_min: 5,                     // virus start to appear after sentence_id X

        social_posting_enabled: false,
    }

    checkBrowserColorScheme()

    if (global.dev_mode == true) {
        dev_override_settings()
    }

    input_team_1.value = game.team_1;
    input_team_2.value = game.team_2;

    input_display_indicator.checked = game.display_indicator;

    input_down_drinking_enabled.checked = game.down_drinking_enabled;
    input_virus_enabled.checked = game.virus_enabled;
    input_social_posting_enabled.checked = game.social_posting_enabled;

    input_sip_min.value = game.sip.min;
    input_sip_max.value = game.sip.max;
}

function resetVariables() {
    game.db = {};                                             //All database

    game.team_1_player_list = [];
    game.team_2_player_list = [];

    game.started = false;
    game.cycle_id = -1;
    game.gamemode = "default";
    game.virus_remaining = 1;
    game.database = undefined;

    game.sentence_history = [];                               //sentence_history_item = { sentence,key,type,nature }

    if (game.display_indicator == true) {
        createRecapSentenceIndicator();
    }

    game_cycle_count.innerHTML = "-";
}

function toggleDisplayIndicator(force) {
    game.display_indicator = force;
    createRecapSentenceIndicator();
}

function checkBrowserColorScheme() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches == true) {
        toggleDarkMode(true);
    } else {
        toggleDarkMode(false);
    }
}

function toggleDarkMode(value_forced) {
    document.body.classList.toggle('dark_mode');
    if (document.body.classList[0] == "dark_mode") { input_dark_mode_settings.checked = true}

    if (value_forced == true) {
        document.body.classList.value = "dark_mode";
        input_dark_mode_settings.checked = true;
    } else if (value_forced == false) {
        document.body.classList.value = " ";
        input_dark_mode_settings.checked = false;
    }
}

function changeSipSettings(setting, value) {
    //prevent settings to be incoherent (ex: min_sip = 8 && max_sip == 4)
    var value = parseInt(value)

    if (setting == "min") {
        game.sip.min = value;
        if (value > game.sip.max) {
            game.sip.max = value;
        }
    } else if (setting == "max") {
        game.sip.max = value;
        if (value < game.sip.min) {
            game.sip.min = value;
        }
    }

    //update HTML
    input_sip_min.value = game.sip.min;
    input_sip_max.value = game.sip.max;
    // console.log(`changeSipSettings(${setting}, ${value}) - ${game.sip.min} - ${game.sip.max}`);
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
    document.getElementById('team_selection').style.display = 'none';
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
                    document.getElementById("player_list").innerHTML += `<button id="player_button_${game.player_list.length}" class="btn btn-danger" onclick="removePlayer('${player_name}', this.id, 'main_page')"> ${player_name} ✖ <span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>`;

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
        addPlayer("J#"+ (i+1))
        // addPlayer(randomUUID);
    }
}

function removePlayer(player_name, html_element_id, location) {
    var player_id = getIDFromString(html_element_id)

    //remove button
    if (location == "team_selection_page") {
        document.getElementById("player_id_team_selection_" + player_id).remove();
    }
    document.getElementById("player_button_" + player_id).remove();

    leaveTeam(game.player_list[player_id])

    for (var i in game.player_list) {
        if (player_name == game.player_list[i]) {
            game.player_list.splice(i, 1)
        }
    }
    
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

function getIDFromString(text) {
    return text.substr(text.length - 1, 1);
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

function initGame(select_team) {
    getMinPlayer()
    if (game.gamemode == "war" && select_team == true) {
        displayPage('team_selection');
        updateTeamSelectiontable();
    } else {
        if (game.started == false) {
            game.started = true;
            createScriptElement("./src/js/db/" + game.gamemode + "_" + global.current_language + ".js")
            if (typeof db === "function") {
                initGame()
                retrieveDB()
                updateGameCycle();
            }
        }
        displayPage('game');
        manageOptionDisplay("start", true);
    }
}

function exitGame() {
    document.getElementById("ingame_sentence").innerHTML = "";  // reset HTML sentence display

    updateGameCycle();                                  // reset cycle count
    resetVariables();
    updateHTMLBackgroundColor();

    displayPage('menu');
}

function lunchSelectedGamemode(selected_gamemode) {
    selectGamemode(selected_gamemode);
    if (selected_gamemode == "war") {
        initGame(true);
    } else {
        initGame();
    }
}

function restart(gamemode) {
    exitGame();
    lunchSelectedGamemode(gamemode);
}

function selectGamemode(selected_gamemode) {
    //this function only to add a console.log and purify HTML
    game.gamemode = selected_gamemode;
    console.log("/gamemode", selected_gamemode);
}

function manageNavigationButton(button, display) {
    if (button == "previous") {
        var selected_button = game_cycle_previous_button;
    } else if (button == "next") {
        var selected_button = game_cycle_next_button;
    } else if (button == "game_cyle") {
        var selected_button = game_cycle_count;
    }

    if (display == true) {
        selected_button.disabled = false;
        selected_button.className = "btn btn-secondary btn-info";
    } else if (display == false) {
        selected_button.disabled = true;
        selected_button.className = "btn btn-secondary";
    }
}

function manageOptionDisplay(option, display) {
    if (option == "start") {
        var selected_option = start_ingame_option;
    } else if (option == "replay") {
        var selected_option = replay_ingame_option;
    }

    if (display == true) {
        ingame_option.style.display = "block"
        selected_option.style.display = "block"
    } else if (display == false) {
        ingame_option.style.display = "none"
        selected_option.style.display = "none"
    }
}

function updateGameCycle() {
    //previous
    if (game.cycle_id > 0) {
        manageNavigationButton("previous", true)
    } else {
        manageNavigationButton("previous", false)
    }
    //game count
    if (game.cycle_id >= 0) {
        manageNavigationButton("game_cyle", true)
        document.getElementById("game_cycle_count").innerHTML = (game.cycle_id + 1) + "/" + game.sentence_amount;
    } else {
        manageNavigationButton("game_cyle", false)
        document.getElementById("game_cycle_count").innerHTML = "-";
    }
    //next
    if (game.cycle_id < game.sentence_amount - 1 && game.cycle_id >= 0) {
        manageNavigationButton("next", true)
    } else {
        manageNavigationButton("next", false)
    }
    //start
    if (game.cycle_id < 0) {
        manageOptionDisplay("start", true)
    } else {
        manageOptionDisplay("start", false)
    }
    // retry
    if (game.cycle_id == game.sentence_amount - 1) {
        manageOptionDisplay("replay", true)
    } else {
        manageOptionDisplay("replay", false)
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
    if (game.display_indicator == true) { updateRecapSentenceIndicator((game.cycle_id) + posOffset, sentence_history_item.color); }     

    if (game.sentence_history[game.cycle_id] == undefined) {
        game.sentence_history.push(sentence_history_item);
    } else if (game.sentence_history[offset_sentence_id].sentence == "none") {
        game.sentence_history[offset_sentence_id] = sentence_history_item;
    }
}

function randomSip() {
    var sip_min = game.sip.min;
    var sip_max = game.sip.max;
    var step = sip_max - sip_min;

    var random_sip = Math.floor(Math.random() * (step + 1)) + sip_min;

    return random_sip;
}

function textReplacer(text) {

    var html_span_sip = "<span class=\"span_sip\">";
    var html_span_player = "<span class=\"span_player\">";
    var html_span_team = "<span class=\"span_team\">";
    var html_span_end = "</span>";

    // retrieve all player name
    var player_name_list = [];
    for (var i = 0 ; i < game.player_list.length ; i++) { player_name_list.push(game.player_list[i]) }

    for (var i = 0 ; i < text.length ; i++) {
        // change $ by random sip
        if (text.charAt(i) == "$") {
            var random_sip = randomSip();
            text = replaceAt(text, i, html_span_sip + random_sip + html_span_end, 0);
        }
        // change %s by random player
        if (text.charAt(i) == "%" && text.charAt(i+1) == "s") {
            
            var random_player_index = Math.floor(Math.random() * player_name_list.length);
            var random_player = player_name_list[random_player_index];
            player_name_list.splice(random_player_index,1);

            text = replaceAt(text, i, html_span_player + random_player + html_span_end, 1);
        }
        // change %t by team
        if (text.charAt(i) == "%" && text.charAt(i+1) == "t") {
            if (Math.random() < 0.5 == true) {
                text = replaceAt(text, i, html_span_team + game.team_1 + html_span_end, 1);
            } else {
                text = replaceAt(text, i, html_span_team + game.team_2 + html_span_end, 1);
            }
            
        }
    }
    return text;
}

function createRecapSentenceIndicator() {
    var html_recap_sentences = document.getElementById("html_recap_sentences")
    var html_recap_sentences_elements = "";

    html_recap_sentences.innerHTML = "";
    
    if (game.display_indicator == true) {
        for (var i = 0; i < game.sentence_amount; i++) {
            html_recap_sentences_elements += `<td class="recap_sentences_cell" id="recap_sentences_cell_${i}" style="background-color:grey;"></td>`;
        }
        html_recap_sentences.innerHTML = `<tbody><tr>${html_recap_sentences_elements}</tr></tbody>`;
    }
}

function updateRecapSentenceIndicator(pos, color) {
    for (var i = 0; i < game.sentence_amount; i++) {
        document.getElementById("recap_sentences_cell_" + i).className = `recap_sentences_cell`;
    }
    if (game.display_indicator == true || game.cycle_id == -1) {
        document.getElementById("recap_sentences_cell_" + pos).style = `background-color: var(--picolo_${color})`;
        document.getElementById("recap_sentences_cell_" + pos).onclick = `goToSpecificSentence(${pos})`;
        document.getElementById("recap_sentences_cell_" + pos).className = `recap_sentences_cell active_recap_sentences_cell`;
    }
}

function displaySentenceList(force_ingame) {
    var ingame_text = document.getElementById("ingame_text");
    var sentence_list = document.getElementById("sentence_list");

    if (force_ingame == true || ingame_text.style.display == "none") {
        ingame_text.style.display = "block";
        sentence_list.style.display = "none";
        updateHTMLBackgroundColor()
    } else {
        ingame_text.style.display = "none";
        sentence_list.style.display = "block";
        updateHTMLBackgroundColor("black")
        updateSentenceList()
    }
}

function updateSentenceList(mode) {
    if (mode == "clear") {
        sentence_list.innerHTML = ""
    } else {
        var ul_head = `<ul class="list-group list-group-flush"></ul>`;
        var ul_end = "</ul>";
        var html_inner = "";

        for (var i in game.sentence_history) {
            var color = game.sentence_history[i].color;
            var sentence = game.sentence_history[i].sentence;

            if (sentence != "none") {
                html_inner += `<li class="list-group-item sentence-list ${color}" onclick="goToSpecificSentence(${i})">${sentence}</li>`;
            } else {
                break;
            }
        }
        sentence_list.innerHTML = ul_head + html_inner + ul_end;
    }
}

function updateTeamSelectiontable() {
    team_selection_table = team_selection_table

    //clear
    team_selection_table.children[1].innerHTML = ""

    function selectingPlayerCell(index) {
        var player_name = game.player_list[index]
        var player_input = `<td>${player_name}</td>`
        var select_team_1_button = `<td><button class="btn btn-success" onclick="changeTeam(this.parentElement.parentElement.id, 'team_1')">Selectionner</button></td>`
        var select_team_2_button = `<td><button class="btn btn-success" onclick="changeTeam(this.parentElement.parentElement.id, 'team_2')">Selectionner</button></td>`
        var delete_button = `<td><button class="btn btn-danger" onclick="removePlayer('${player_name}', this.parentElement.parentElement.id, 'team_selection_page')">Supprimer</button></td>`

        return `<tr id="player_id_team_selection_${index}">` + player_input + select_team_1_button + select_team_2_button + delete_button + "<tr>";
    }
    for (var i in game.player_list) {
        var test1 = selectingPlayerCell(i);
        team_selection_table.children[1].innerHTML += test1;
    }

    updateTeamSelectionNextButton()
}

function leaveTeam(player_name) {
    if (game.team_1_player_list.length > 0) {
        for (var i in game.team_1_player_list) {
            if (player_name == game.team_1_player_list[i]) {
                game.team_1_player_list.splice(i, 1);
                break
            }
        }
    }
    if (game.team_2_player_list.length > 0) {
        for (var i in game.team_2_player_list) {
            if (player_name == game.team_2_player_list[i]) {
                game.team_2_player_list.splice(i, 1);
                break
            }
        }
    }
}

function changeTeam(html_id, team) {
    var html_id = document.getElementById(html_id)
    var player_name = game.player_list[getIDFromString(html_id.id)]

    leaveTeam(player_name)

    var change_team_1_button = `<td><button class="btn btn-warning" onclick="changeTeam(this.parentElement.parentElement.id, 'team_1')">Changer</button></td>`
    var change_team_2_button = `<td><button class="btn btn-warning" onclick="changeTeam(this.parentElement.parentElement.id, 'team_2')">Changer</button></td>`

    if (team == "team_1") {
        html_id.children[1].innerHTML = `✅`;
        html_id.children[2].innerHTML = change_team_2_button;
        game.team_1_player_list.push(player_name)
    } else {
        html_id.children[1].innerHTML = change_team_1_button;
        html_id.children[2].innerHTML = `✅`;
        game.team_2_player_list.push(player_name)
    }

    updateTeamSelectionNextButton()
}

function updateTeamSelectionNextButton() {
    var team_1_lenght = game.team_1_player_list.length
    var team_2_lenght = game.team_2_player_list.length
    var player_list_length = game.player_list.length

    if (team_1_lenght > 0 && team_2_lenght > 0 && (team_1_lenght + team_2_lenght == player_list_length)) {
        document.getElementById("button_next_team_selection").disabled = false;
    } else {
        document.getElementById("button_next_team_selection").disabled = true;
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