
// First function called when #body is loaded
function init() {
    checkBrowserColorScheme();
    defaultVariables();
    filterVariables();
    setLanguageString();
    global.current_language_strings = language.fr;
}

// Used when testing to avoid clicking x menus, get 4 players, etc...
function dev_override_settings() {
    toggleDarkMode(true);
    displayPage("menu")
    removeAllPlayers()
    generateRandomPlayer(4)
    toggleSettingsPage()
}

function defaultVariables() {
    global = {
        default_language: true,
        current_language: "fr",
        dev_mode: false,
        settings_status: "masked",
        picolito_version: "0.28",
        debug_random_player: 0,
    }

    game = {
        filter: {
            // Sentences of type 1 is used in "default", "hot", "bar" and "silly"
            type_by_gamemode: {
                default: [1, 2, 3, 4, 5, 14, 15, 23, 24, 25],
                hot: [1, 2, 3, 4, 7, 14, 23, 24, 25],
                bar: [1, 2, 4, 17, 18, 19, 20, 21, 22],
                silly: [1, 2, 3, 4, 6, 14, 23, 24, 25],
                war: [8, 9, 10, 11, 12, 13]
            },
            // For .default[0], maximum players can be 0, 1, 2, 3 or 4 players (when there is more than 4 players, player count is noted 4)
            max_player_number_by_gamemode: {
                default: [[0,1,2,3,4], [1,2,3,4], [0,1], [0,1,2,3], [0,1,2,3,4], [], [], [], [], [], [], [], [], [0,1,2], [2], [], [], [], [], [], [], [], [0,1,2,3], [3], [0,1,2,3,4]],
                hot: [[0,1,2,3,4,5], [1,2], [0], [0,1,2], [], [], [1,2], [], [], [], [], [], [], [0,1,2,3], [], [], [], [], [], [], [], [], [0,1,2], [3,4], [0,1,2]],
                bar: [[0,1,2], [1,3], [], [0,1], [], [], [], [], [], [], [], [], [], [], [], [2,3], [0,1,2,3], [1,2], [1,2,3], [1], [1], [1], [], [], []],
                silly: [[0,1,2,3,4], [0,1,2], [0], [1,2,3], [], [0,1,2,3], [], [], [], [], [], [], [], [0,1], [], [], [], [], [], [], [], [], [0,1,2,3,4], [3,4], [0,1,2]],
                war: [[], [], [], [], [], [], [], [0,1,2], [0], [2,3], [0,1], [0,1], [0,1], [], [], [], [], [], [], [], [], [], [], [], []]
            },
            // Senteces of type 1 is blue, 2 and 3 is yellow, 4 is green, etc...
            type_by_color: {
                blue: [1, 8, 9, 10, 13, 15, 16, 18, 19, 24, 25],
                red: [5, 6, 7],
                green: [4, 11, 12, 14, 17, 20, 21, 22, 23],
                yellow: [2, 3]
            },
            // % of chance for picking specific colors (70% to pick blue typed sentences)
            color_probability: {
                blue: 70,
                red: 5,
                green: 20,
                yellow: 5
            },
        },

        // Dummy DB used to pick sentences one by one
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

        sip: { min: 1, max: 3 },
        started: false,
        cycle_id: -1,
        gamemode: "default",
        display_indicator: false,
        display_color_indicator: true,
        animation: true,

        sentence_history: [],                               //sentence_history_item = { sentence,key,type,nature }
        sentence_amount: 50,

        shot_enabled: true,
        shot_amount: 1,
        shot_sentence_id_start_min: 10,            // shot start to appear after sentence_id X

        virus_enabled: true,
        virus_remaining: 1,                                 // virus can occur X times (still overlap...)
        virus_end_min: 5,                                   // virus can end after X more sentence_id minimum
        virus_end_max: 8,                                  // virus can end after X more sentence_id maximum
        virus_sentence_id_start_min: 5,                     // virus start to appear after sentence_id X

        social_posting_enabled: false,

        unlucky_player_3: false,
        unlucky_player_3_weight: 0.2
    }

    if (global.dev_mode == true) {
        dev_override_settings()
    }

    input_team_1.value = game.team_1;
    input_team_2.value = game.team_2;

    input_shot_enabled.checked = game.shot_enabled;
    input_virus_enabled.checked = game.virus_enabled;
    input_social_posting_enabled.checked = game.social_posting_enabled;

    input_sip_min.value = game.sip.min;
    input_sip_max.value = game.sip.max;
    
    game.shot_remaining = game.shot_amount;

    input_unlucky_player_3_settings.value = game.unlucky_player_3

    picolito_version.innerHTML = `Picolito ${global.picolito_version}`;
}

function resetVariables() {
    game.db = {};                                             //All database

    game.team_1_player_list = [];
    game.team_2_player_list = [];

    game.started = false;
    game.cycle_id = -1;
    game.gamemode = "default";
    game.virus_remaining = 1;
    game.shot_remaining = game.shot_amount;
    game.database = undefined;

    game.sentence_history = [];                               //sentence_history_item = { sentence,key,type,nature }

    game_cycle_count.innerHTML = "-";
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
    document.body.classList.toggle('bright_mode');
    if (document.body.classList[0] == "dark_mode") { input_dark_mode_settings.checked = true}

    if (value_forced == true) {
        document.body.classList.value = "dark_mode";
        input_dark_mode_settings.checked = true;
    } else if (value_forced == false) {
        document.body.classList.value = "bright_mode";
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

function changeDownDrinking(value) {
    game.shot_amount = parseInt(value);
    game.shot_remaining = parseInt(value);
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
    if (game.shot_enabled == false) {
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

function addPlayer(player_name, html_origin) {
    if (player_name == undefined) {
        if (html_origin == "menu") {
            var player_name = manu_player_input.value;
        } else if (html_origin == "ingame") {
            var player_name = ingame_player_input.value;
        }
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
                    document.getElementById("menu_player_list").innerHTML += `<button id="menu_player_button_${game.player_list.length}" class="btn btn-danger" onclick="removePlayer('${player_name}', this.id, 'menu')"> ${player_name} ✖ <span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>`;
                    document.getElementById("ingame_player_list").innerHTML += `<button id="ingame_player_button_${game.player_list.length}" class="btn btn-danger" onclick="removePlayer('${player_name}', this.id, 'ingame')"> ${player_name} ✖ <span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>`;

                    game.player_list.push(player_name);
                }
                break;
            }
        }
    }
    if (html_origin == "menu") {
        manu_player_input.focus();
    } else if (html_origin == "ingame") {
        ingame_player_input.focus();
    }

    ingame_player_input.value = "";
    manu_player_input.value = "";

    updatePlayerCount();
}

function generateRandomPlayer(nb_players) {
    function randomHex(hex) {
        return (Math.random()*hex<<0).toString(16);
    }
    for (var i = 0; i < nb_players; i++ ) {
        var randomUUID = (randomHex(0xFFFFFFFF));
        addPlayer("J#"+ (game.player_list.length+1))
    }
}

function removePlayer(player_name, html_element_id, location) {
    var player_id = getIDFromString(html_element_id)
    //remove button
    document.getElementById("menu_player_button_" + player_id).remove();
    document.getElementById("ingame_player_button_" + player_id).remove();

    leaveTeam(game.player_list[player_id])
    for (var i in game.player_list) {
        if (player_name == game.player_list[i]) {
            game.player_list.splice(i, 1)
        }
    }
    updatePlayerCount();
}

function removeAllPlayers() {
    menu_player_list.innerHTML = "";
    ingame_player_list.innerHTML = "";
    game.player_list = [];
    updatePlayerCount();
}

function updatePlayerCount() {
    if (game.player_list.length > 1) {
        text_gamemode_player_singular.style.display = "none"
        text_gamemode_player_plural.style.display = "initial"
    } else {
        text_gamemode_player_singular.style.display = "initial"
        text_gamemode_player_plural.style.display = "none"
    }

    document.getElementById("text_gamemode_player_number").innerHTML = game.player_list.length;
    getMinPlayer()
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
    } else if (game.gamemode == "dice") {
        displayPage('game');
        manageOptionDisplay("dice", true);
        manageNavDisplay("navigation_arrows", false);
        manageNavDisplay("players", false);
    } else if (game.gamemode == "card") {
        displayPage('game');
        manageOptionDisplay("card", true);
        manageNavDisplay("navigation_arrows", false);
        manageNavDisplay("players", false);
    } else {
        if (game.started == false) {
            game.started = true;
            createScriptElement("./src/js/db/" + game.gamemode + "_" + global.current_language + ".js")
            if (typeof db === "function") {
                initGame()
                retrieveDB()
                updateGameCycle();
                displaySentenceList(true);
            }
        }
        displayPage('game');
        manageOptionDisplay("start", true);
    }
}

function exitGame() {
    displaySentence("", undefined); // reset HTML sentence display

    updateGameCycle();                                  // reset cycle count
    resetVariables();
    updateHTMLBackgroundColor();
    toggleIngamePlayerList("none");

    manageOptionDisplay("start", false);
    manageOptionDisplay("replay", false);
    manageOptionDisplay("dice", false);
    manageOptionDisplay("card", false);
    
    manageNavDisplay("navigation_arrows", true);
    manageNavDisplay("players", true);

    displayPage('menu');
}

function launchSelectedGamemode(selected_gamemode) {
    selectGamemode(selected_gamemode);
    if (selected_gamemode == "war") {
        initGame(true);
    } else {
        initGame();
    }
}

function restart(gamemode) {
    exitGame();
    launchSelectedGamemode(gamemode);
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
    } else if (option == "dice") {
        var selected_option = dice_ingame_option;
    } else if (option == "card") {
        var selected_option = card_ingame_option;
    }

    if (display == true) {
        ingame_option.style.display = "block"
        selected_option.style.display = "block"
    } else if (display == false) {
        ingame_option.style.display = "none"
        selected_option.style.display = "none"
    }
}

function manageNavDisplay(navigation_option, display) {
    if (navigation_option == "navigation_arrows") {
        var selected_navigation_option = navigation_arrows;
    } else if (navigation_option == "players") {
        var selected_navigation_option = text_game_player_menu;
    }

    if (display == true) {
        selected_navigation_option.style.display = "inline-flex"
    } else if (display == false) {
        selected_navigation_option.style.display = "none"
    }
}

function toggleIngamePlayerList(forced_value) {
    var status = ingame_player_option.style.display
    if (status == "block") {
        ingame_player_option.style.display = "none"
    } else if (status == "none") {
        ingame_player_option.style.display = "block"

        if (game.gamemode == "war") {
            ingame_player_add.style.display = "none"
            ingame_player_team_1.style.display = "block"
            ingame_player_team_2.style.display = "block"
        } else {
            ingame_player_add.style.display = "block"
            ingame_player_team_1.style.display = "none"
            ingame_player_team_2.style.display = "none"
        }
    }
 
    ingame_player_option.style.display = forced_value
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

    if (game.display_color_indicator == true) {
        var html_span_sip = "<span class=\"span_sip\">";
        var html_span_player = "<span class=\"span_player\">";
        var html_span_team = "<span class=\"span_team\">";
        var html_span_end = "</span>";
    } else {
        var html_span_sip = "";
        var html_span_player = "";
        var html_span_team = "";
        var html_span_end = "";
    }


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
                
            if (game.unlucky_player_3 == true && game.player_list.length >= 3) {
                var random = Math.random();
                if (random <= game.unlucky_player_3_weight) {
                    console.log("malchance J3")
                    var random_player = player_name_list[2];
                    player_name_list.splice(2,1);
                } else {
                    var random_player_index = Math.floor(Math.random() * player_name_list.length);
                    var random_player = player_name_list[random_player_index];
                    player_name_list.splice(random_player_index,1);
                }
            } else {
                var random_player_index = Math.floor(Math.random() * player_name_list.length);
                var random_player = player_name_list[random_player_index];
                player_name_list.splice(random_player_index,1);
            }

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

    toggleIngamePlayerList("none");
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
        var select_team_1_button = `<td><button class="btn btn-success" onclick="changeTeam(this.parentElement.parentElement.id, 'team_1')">`+ global.current_language_strings.team_select +`</button></td>`
        var select_team_2_button = `<td><button class="btn btn-success" onclick="changeTeam(this.parentElement.parentElement.id, 'team_2')">`+ global.current_language_strings.team_select +`</button></td>`
        var delete_button = `<td><button class="btn btn-danger" onclick="removePlayer('${player_name}', this.parentElement.parentElement.id, 'team_selection_page')">`+ global.current_language_strings.team_delete +`</button></td>`

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

    var change_team_1_button = `<td><button class="btn btn-warning" onclick="changeTeam(this.parentElement.parentElement.id, 'team_1')">`+ global.current_language_strings.team_change +`</button></td>`
    var change_team_2_button = `<td><button class="btn btn-warning" onclick="changeTeam(this.parentElement.parentElement.id, 'team_2')">`+ global.current_language_strings.team_change +`</button></td>`

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

function DEBUG_RandomPlayer() {
    global.debug_random_player++

    if (global.debug_random_player == 2) {
        generateRandomPlayer(1)
        global.debug_random_player = 0
    }
}

function alertRandomPlayer() {
    if (game.player_list.length > 0) {
        var random_int = Math.floor(Math.random() * game.player_list.length);
        var random_player = game.player_list[random_int];
        alert(random_player);
    }
}