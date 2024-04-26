// First function called when #body is loaded
function init() {
    checkBrowserColorScheme();
    defaultVariables();
    setLanguageString();
    updateCurrentLanguageString("fr")
    filterVariables();
    retrieveCookie();
    if (global.dev_mode == true) { devOverrideSettings() }
    hideLandingPage()
}

function devOverrideSettings() {
    document.getElementById("gamename_menu").innerHTML = global.picolito_version;
    addPlayer("Ricard", "cookie");
    addPlayer("Bertrude", "cookie");
    addPlayer("Zolande", "cookie");
    addPlayer("Alpipignoux", "cookie");

    displayPage("gamemode")
    global.display_landing_page_delay = 0;
}

function defaultVariables() {
    global = {
        current_language: "fr",
        dev_mode: false,
        dark_mode: "bright",
        picolito_version: "0.33.4",
        cookie_expiration_delay: 30,
        weakestLinkTimer: undefined,
        audio : {
            weakest_link_amb_60: undefined,
            weakest_link_amb_end: undefined
        },
        audio_enabled: true,
        cookie_settings_value : [],
        display_landing_page_delay : 1500,
        use_cache_storage: false
    }

    game = {
        filter: {
            // Sentences of type 1 is used in "default", "hot", "bar", "mix" and "silly"
            type_by_gamemode: {
                default: [1, 2, 3, 4, 5, 14, 15, 23, 24, 25],
                hot: [1, 2, 3, 4, 7, 14, 23, 24, 25],
                bar: [1, 2, 4, 16, 17, 18, 19, 20, 21, 22],
                silly: [1, 2, 3, 4, 6, 14, 23, 24, 25],
                mix: [1, 2, 3, 4, 5, 6, 7, 14, 15, 16, 17, 18, 19, 20, 21, 25, 23, 24, 25],
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
            empty_type: [] //when all sentences have been picked
        },

        pending_db: [],
        stored_db: {},

        multiple_database: {
            mix: ["default", "hot", "bar", "silly"],
            never_mix: ["never_popular", "never_hot", "never_party"]
        },

        player_list: [],
        max_player_number: -1,

        team_1: "EQUIPE# 1",
        team_2: "EQUIPE# 2",
        team_1_player_list: [],
        team_2_player_list: [],

        sip: { min: 1, max: 4 },
        started: false,
        cycle_id: -1,
        gamemode: "default",
        display_indicator: false,
        display_color_indicator: true,
        animation: true,

        sentence_history: [],   //sentence_history_item = { sentence,key,type,nature }
        sentence_amount: 50,

        chug_enabled: true,
        chug_amount: 1,
        chug_sentence_id_start_min: 10, // chug start to appear after sentence_id X

        virus_enabled: true,
        virus_remaining: 1, // virus can occur X times (still overlap...)
        virus_end_min: 3,   // virus can end after X more sentence_id minimum
        virus_end_max: 6,   // virus can end after X more sentence_id maximum
        virus_sentence_id_start_min: 5, // virus start to appear after sentence_id X

        social_posting_enabled: false,

        weakest_link: {
            stop_at_max_chain: true, 
            max_chain: 6,
            tie_behaviour: "weakest", //strongest_link, arbitrary, both, weakest
            chain: 0,
            alphabetically_ordered_player: [],
            bank: 0,
            time: 60,
            player_analytics: {
                correct: [],
                wrong: [],
                bank_saved: [],
                potential_bank_lost: [],
                answer_time: [],
                avegarge_answer_time: []
            },
            hide_answer: false
        },
        password: {
            currentIndex: -1,
            word_to_find_left: undefined,
            word_status: [],
            word_to_find_amount: 5,
            words: [], // Array to store the fetched words
            style: 2016
        }
    }
    updateHTMLSettingsByVar()
}

function resetVariables() {
    game.db = {};

    game.team_1_player_list = [];
    game.team_2_player_list = [];

    game.started = false;
    game.filter.empty_type = [];
    game.cycle_id = -1;
    game.virus_remaining = 1;
    game.chug_remaining = game.chug_amount;
    game.database = undefined;
    game.pending_db = [];

    game.sentence_history = [];

    game_cycle_count.innerHTML = "-";

    game.weakest_link.chain = 0;
    game.weakest_link.alphabetically_ordered_player = [];
    game.weakest_link.bank = 0;
    game.weakest_link.player_turn_index = -1;
}

function updateHTMLSettingsByVar() {
    input_team_1.value = game.team_1;
    input_team_2.value = game.team_2;

    input_chug_enabled.checked = game.chug_enabled;
    input_virus_enabled.checked = game.virus_enabled;
    input_social_posting_enabled.checked = game.social_posting_enabled;

    input_sip_min.value = game.sip.min;
    input_sip_max.value = game.sip.max;
    input_potential_chug = game.chug_amount;

    input_color_display_settings.checked = game.display_color_indicator;
    input_color_display_animation.checked = game.animation;

    input_dark_mode_settings.value = global.dark_mode;
    changeDarkModeSettings(global.dark_mode)

    input_weakest_link_tie.value = game.weakest_link.tie_behaviour;

    if (game.weakest_link.stop_at_max_chain == false) {
        input_weakest_link_max_chain.value = "none";
    } else {
        input_weakest_link_max_chain.value = game.weakest_link.max_chain;
    }
    input_weakest_link_soundtrack.checked = global.audio_enabled;
    input_weakest_link_hide_answer.checked = game.weakest_link.hide_answer;

    select_settings_password_amount.value = game.password.word_to_find_amount;
    select_settings_password_style.value = game.password.style;
    
    picolito_version_safety.innerHTML = `Picolito ${global.picolito_version}`;
    picolito_version_menu.innerHTML = `Picolito ${global.picolito_version}`;

    if (global.remind_warning_panel == false) {
        displayPage('menu');
    } else {
        displayPage('disclaimer');
    }    
}

function hideLandingPage() {
    document.getElementById("landing").classList.add("fadout-landing");
    if (global.display_landing_page_delay > 0 ) {
        setTimeout(function() {
            document.getElementById('landing').style.display = 'none';
        }, (global.display_landing_page_delay));
    } else {
        document.getElementById('landing').style.display = 'none';
    }
}

function checkBrowserColorScheme(force_bright) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches == true || force_bright == false) {
        document.body.classList.value = "dark_mode";
    } else {
        document.body.classList.value = "bright_mode";
    }


}

function changeDarkModeSettings(value) {
    if (value == "system") {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches == true) {
            document.body.classList.value = "dark_mode";
        } else {
            document.body.classList.value = "bright_mode";
        }
        global.dark_mode = "system";
    } else if (value == "bright") {
        document.body.classList.value = "bright_mode";
        global.dark_mode = "bright";
    } else {
        document.body.classList.value = "dark_mode";
        global.dark_mode = "dark";
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
}

function changeDownDrinking(value) {
    game.chug_amount = parseInt(value);
    game.chug_remaining = parseInt(value);
}

function changeWeakestLinkTieBehaviour(value) {
    game.weakest_link.tie_behaviour = value;
    input_weakest_link_tie.value = value;
}

function changeWeakestLinkMaxChain(value) {
    if (value == "none") {
        game.weakest_link.stop_at_max_chain = false;
    } else {
        game.weakest_link.stop_at_max_chain = true;
        game.weakest_link.max_chain = parseInt(value);
    }
}

function createScriptElement(script_src) {
    var headTag = document.getElementsByTagName("head").item(0);
    var scriptTag = document.createElement("script");
    scriptTag.src = script_src;
    headTag.appendChild(scriptTag);
}

function hopper(array, nature) {
    var probability = [];
    for (var i = 0; i < array.length; i++) {
        if (array[i][0] == nature) {
            probability = array[i][1];
            array.splice(i, 1);
        }
    }
    
    for (var i = 0; i < array.length; i++) {
        array[i][1] = array[i][1] + (probability / array.length);
    }
}

function filterVariables() {
    if (game.chug_enabled == false) {
        //delete and share red probability into others colors
        hopper(game.type_by_color, "red");
    }
    if (game.virus_enabled == false) {
        //delete and share yellow probability into others colors
        hopper(game.type_by_color, "yellow");
    }
}

function replaceAt(string, index, replace, length) {
    return string.substring(0, index) + replace + string.substring((index+length)+1);
}

function displayPage(page) {
    // document.getElementById('landing').style.display = 'none';
    document.getElementById('disclaimer').style.display = 'none';
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gamemode').style.display = 'none';
    document.getElementById('team_selection').style.display = 'none';
    document.getElementById('game').style.display = 'none';
    document.getElementById('extract').style.display = 'none';

    if (page == "disclaimer") {
        document.getElementById(page).style.display = 'flex';
    } else {
        document.getElementById(page).style.display = 'block';
    }
}

function addPlayer(player_name, html_origin) {
    if ((manu_player_input.value == "scipio" || manu_player_input.value == "SCIPIO") && html_origin == "menu") {
        manu_player_input.value = "";
        DEBUG_carthage(true);
        return;
    }
    if ((manu_player_input.value == "terre" || manu_player_input.value == "TERRE") && html_origin == "menu") {
        manu_player_input.value = "";
        DEBUG_carthage(false);
        return;
    }
    if (player_name == undefined && html_origin == "menu") {
        var player_name = manu_player_input.value;
        if (manu_player_input.value == "") { return; }
    } else if (player_name == undefined && html_origin == "ingame") {
        var player_name = ingame_player_input.value;
        if (ingame_player_input.value == "") { return; }
    }

    if (player_name.length > 0 && player_name.length <= 50) {
        var start_by_space = true; //prevent name start by spaces
        for (var i = 0; i < player_name.length; i++) {
            if (player_name.charAt(i) == " ") {
            } else {
                start_by_space = false;
                player_name = player_name.substr(i, player_name.length-i);
                if (player_name.length != 0) {
                    //add button with player name
                    document.getElementById("menu_player_list").innerHTML += `<button id="menu_player_button_${game.player_list.length}" class="btn btn-primary" onclick="removePlayer('${player_name}', this.id, 'menu')"> ${player_name}</button>`;
                    document.getElementById("ingame_player_list").innerHTML += `<button id="ingame_player_button_${game.player_list.length}" class="btn btn-primary" onclick="removePlayer('${player_name}', this.id, 'ingame')"> ${player_name}</button>`;

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
    
    if (html_origin != "cookie") { storePlayerListCookie(); }
    
}

function removePlayer(player_name, html_element_id) {
    var player_id = getIDFromString(html_element_id)
    //remove button
    document.getElementById("menu_player_button_" + player_id).remove();
    document.getElementById("ingame_player_button_" + player_id).remove();

    leaveTeam(game.player_list[player_id])
    for (var i = 0; i < game.player_list.length; i++) {
        if (player_name == game.player_list[i]) {
            game.player_list.splice(i, 1)
        }
    }
    updatePlayerCount();
    storePlayerListCookie();
}

function updatePlayerCount() {
    if (game.player_list.length > 1) {
        document.getElementById("text_gamemode_player_number").innerHTML = game.player_list.length + " " + global.current_language_strings.player_plural;
    } else {
        document.getElementById("text_gamemode_player_number").innerHTML = game.player_list.length + " " + global.current_language_strings.player_singular;
    }
    
    getMinPlayer()
}

function getIDFromString(text) {
    return text.substr(text.length - 1, 1);
}

function updateGameBackgroundColor(forced_color) {
    if (forced_color != undefined) {
        document.getElementById("game").className = "page dark_affected " + forced_color;
    } else {
        if (game.sentence_history.length == 0) {
            document.getElementById("game").className = "page blue"
        } else {
            if (game.sentence_history[game.cycle_id].color == undefined) {
                var color = "blue";
            } else {
                var color = game.sentence_history[game.cycle_id].color;
            }
            document.getElementById("game").className = "page dark_affected " + color;
        }
    }
}

function initGame(select_team, direct_launch) {
    // à convertir en switch?

    manageingameDisplayRotation("landscape")

    getMinPlayer()
    if (game.gamemode == "war" && select_team == true) {
        if (game.player_list.length >= 2) {
            displayPage('team_selection');
            updateTeamSelectionTable();
        }
    } else if (game.gamemode == "weakest_link") {
        checkDatabase();
        displayPage('game');
        manageIngameOptionDisplay(true, "weakest_link", true);
        manageIngameOptionDisplay(true, "start", "block");
        manageIngameOptionDisplay(true, "weakest_link_rule", "block");
        manageNavDisplay("players", false);
        manageNavDisplay("restart", false);
        preloadSound("weakest_link")
        weakestLinkCalcTime()
        if (direct_launch == true) { startGame() }
    } else if (game.gamemode == "password") {
        manageingameDisplayRotation("portrait")
        displayPage('game');
        manageIngameOptionDisplay(true, "password", true);
        manageIngameOptionDisplay(true, "start", "block");
        manageIngameOptionDisplay(true, "password_rule", "block");
        manageNavDisplay("players", false);
        manageNavDisplay("restart", false);
        manageNavDisplay("navigation_arrows", false);
        if (direct_launch == true) { startGame() }
    } else {
        if (game.started == false) {
            game.started = true;
            checkDatabase();
        }
        displayPage('game');
        manageIngameOptionDisplay(true, "start", "block");
        manageNavDisplay("quit",true)
        manageNavDisplay("restart",false)
        manageNavDisplay("navigation_arrows", true)
        if (direct_launch == true) { startGame() }
    }
}

function checkDatabase() {
    if (game.gamemode == "mix") {
        for (var i = 0; i < game.multiple_database.mix.length; i++) {
            testStoredDatabase(game.multiple_database.mix[i], global.current_language)
        }
    } else if (game.gamemode == "never_mix") {
        for (var i = 0; i < game.multiple_database.never_mix.length; i++) {
            testStoredDatabase(game.multiple_database.never_mix[i], global.current_language)
        }
    } else {
        testStoredDatabase(game.gamemode, global.current_language)
    }

    function testStoredDatabase(gamemode, lang) {
        try {
            if (game.stored_db && game.stored_db[gamemode + "_" + lang]) {
                // DB exists, concat to pending_db
                var myObj = game.stored_db[gamemode + "_" + lang];
                game.pending_db = game.pending_db.concat(game.stored_db[gamemode + "_" + lang])
            } else {
                // Calling file gamemode_lang.js
                createScriptElement("./src/js/db/" + gamemode + "_" + lang + ".js");
            }
        } catch (error) {
            if (error instanceof TypeError) {
                console.log(error.message);
                // Ajouter ici la logique de traitement de l'erreur
            } else {
                throw error;
            }
        }
    }
}

function startGame() {
    if (game.gamemode != "password") {
        convertPendingDBTaffy();
        if (game.gamemode == "weakest_link") { 
            initWeakestLink()
        } else {
            manageNavDisplay("navigation_arrows", true)
        }
        nextSentence();
    } else {
        if (window.navigator.onLine == true) {
            initPassword()
        } else {
            alert(global.current_language_strings.password_internet_requierement)
            return;
        }
    }

    manageIngameOptionDisplay(false, "start", "none");
}

function exitGame() {
    if (game.gamemode == "weakest_link") { stopsound("weakest_link_amb_60") }
    if (global.weakestLinkTimer != undefined) { clearInterval(global.weakestLinkTimer) }

    displaySentenceList(true);  // Force closing of sentence list ingame
    displaySentence("", undefined); // reset HTML sentence display

    updateGameCycle();                                  // reset cycle count
    resetVariables();
    updateGameBackgroundColor();

    manageIngameOptionDisplay(false, 'player_option', 'none')
    manageIngameOptionDisplay(false, 'start', 'none')
    manageIngameOptionDisplay(false, 'replay', 'none')
    manageIngameOptionDisplay(false, 'weakest_link', 'none')
    manageIngameOptionDisplay(false, 'weakest_link_vote', 'none')
    manageIngameOptionDisplay(false, 'weakest_link_next_vote', 'none')
    manageIngameOptionDisplay(false, 'weakest_link_vote_end', 'none')
    manageIngameOptionDisplay(false, 'weakest_link_rule', 'none')
    manageIngameOptionDisplay(true, "password", 'none');
    manageIngameOptionDisplay(true, "password_rule", 'none');
    manageIngameOptionDisplay(true, "password_recap", 'none');
    
    manageNavDisplay("navigation_arrows", true);
    manageNavDisplay("players", true);
    manageNavDisplay("restart",false);

    displayPage('gamemode');

    ingame_answer.innerHTML = "";
    document.getElementById("text_team_selection_next").disabled = true;
}

function restartGame() {
    exitGame();
    selectGamemode(game.gamemode, true);
}

function selectGamemode(selected_gamemode, direct_launch) {
    if (selected_gamemode == "weakest_link" && game.player_list.length <= 3) {
        alert(global.current_language_strings.weakest_link_minimum_requierement);
    } else {
        if (selected_gamemode == "password") {
            passwordWordAmountRefreshOption();
        }
        game.gamemode = selected_gamemode;
        initGame(true, direct_launch);
        manageNavDisplay("navigation_arrows", false);
    }
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
    } else if (display == false) {
        selected_button.disabled = true;
    }
}

function manageIngameOptionDisplay(display_option_panel, option_identifier, option_display_value) {
    var option_status = ingame_option.style.display

    if (display_option_panel == true) {
        ingame_option.style.display = "flex";
    } else if (display_option_panel == false) {
        //only close playeroption if game not started
        if (game.cycle_id == -1 && option_identifier == "player_option") {
            ingame_player_option.style.display = "none";
        } else {
            ingame_option.style.display = "none";
        }
    }

    if (option_identifier != undefined && option_display_value != undefined) {
        switch(option_identifier) {
            case "player_option":
            var selected_option = ingame_player_option;
                break;
            case "start":
            var selected_option = start_ingame_option;
                break;
            case "replay":
            var selected_option = replay_ingame_option;
                break;
            case "weakest_link":
                var selected_option = ingame_weakest_link;
                break;
            case "weakest_link_vote":
                var selected_option = weakest_link_vote_ingame_option;
                break;
            case "weakest_link_next_vote":
                var selected_option = weakest_link_next_vote_ingame_option;
                break;
            case "weakest_link_vote_end":
                var selected_option = weakest_link_vote_end_ingame_option;
                break;
            case "weakest_link_rule":
                var selected_option = weakest_link_rule;
                break;
            case "password":
                var selected_option = ingame_password;
                break;
            case "password_rule":
                var selected_option = password_rule;
                break;
            case "password_recap":
                var selected_option = password_recap;
                break;
            default:
                break;
        }
        selected_option.style.display = option_display_value;
    }
}

function manageNavDisplay(navigation_option, display) {
    switch(navigation_option) {
        case "navigation_arrows":
            var selected_navigation_option = navigation_arrows;
            break;
        case "players":
            var selected_navigation_option = text_game_player_menu;
            break;
        case "quit":
            var selected_navigation_option = text_game_quit_topbar;
            break;
        case "restart":
            var selected_navigation_option = text_game_restart_topbar;
            break;
        default:
            break;
    }

    if (display == true) {
        selected_navigation_option.style.display = "inline-flex";
        selected_navigation_option.style.justifycontent = "center";
    } else if (display == false) {
        selected_navigation_option.style.display = "none";
    }
}

function manageingameDisplayRotation(value) {
    game_content.classList.remove("landscape-in-portrait");
    if (value == "landscape") {
        game_content.classList.add("landscape-in-portrait");
    } else if (value == "portrait") {
        game_content.classList.remove("landscape-in-portrait");
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
        manageIngameOptionDisplay(true, "start", "block")
    } else {
        manageIngameOptionDisplay(false, "start", "none")
    }
    // retry
    if (game.cycle_id == game.sentence_amount - 1) {
        manageIngameOptionDisplay(true, "replay", "block")
    } else {
        manageIngameOptionDisplay(false, "replay", "none")
    }
}

function addHistoryItem(posOffset, database_id, sentence, key, type, color, pack_name, answer) {

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
        color : color,
        pack_name : pack_name,
        answer : answer
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
    for (var i = 0; i < game.player_list.length; i++) { player_name_list.push(game.player_list[i]) }

    for (var i = 0; i < text.length; i++) {
        if (text.charAt(i) == "$") {
            text = replaceAt(text, i, html_span_sip + randomSip() + html_span_end, 0);
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
            if (Math.random() < 0.5 == true) { //choose between TEAM 1 and 2
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
        updateGameBackgroundColor()
    } else {
        ingame_text.style.display = "none";
        sentence_list.style.display = "block";
        updateGameBackgroundColor("black")
        updateSentenceList()
    }
}

function updateSentenceList(mode) {
    if (mode == "clear") {
        sentence_list.innerHTML = ""
    } else {
        var ul_head = "";
        var html_inner = "";

        for (var i = 0; i < game.sentence_history.length; i++) {
            var color = game.sentence_history[i].color;
            var sentence = game.sentence_history[i].sentence;

            if (sentence != "none") {
                var sentence_index = parseInt(i)+1;
                html_inner += `<li class="list-group-item sentence-list ${color}" onclick="goToSpecificSentence(${i})">${sentence_index}. ${sentence}</li>`;
            } else {
                break;
            }
        }
        sentence_list.innerHTML = ul_head + html_inner + "</ul>";
    }
}

function updateTeamSelectionTable() {
    team_selection_table = team_selection_table

    //clear
    team_selection_table.children[1].innerHTML = ""

    function selectingPlayerCell(index) {
        var player_name = game.player_list[index]
        var player_input = `<td>${player_name}</td>`
        var select_team_1_button = `<td><button class="btn btn-success" onclick="changeTeam(this.parentElement.parentElement.id, 'team_1')">`+ global.current_language_strings.team_select +`</button></td>`
        var select_team_2_button = `<td><button class="btn btn-success" onclick="changeTeam(this.parentElement.parentElement.id, 'team_2')">`+ global.current_language_strings.team_select +`</button></td>`
        return `<tr id="player_id_team_selection_${index}">` + player_input + select_team_1_button + select_team_2_button + "<tr>";
    }
    for (var i = 0; i < game.player_list.length; i++) {
        var test1 = selectingPlayerCell(i);
        team_selection_table.children[1].innerHTML += test1;
    }
}

function leaveTeam(player_name) {
    if (game.team_1_player_list.length > 0) {
        for (var i = 0; i < game.team_1_player_list.length; i++) {
            if (player_name == game.team_1_player_list[i]) {
                game.team_1_player_list.splice(i, 1);
                break
            }
        }
    }
    if (game.team_2_player_list.length > 0) {
        for (var i = 0; i < game.team_2_player_list.length; i++) {
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

    var change_team_1_button = `<td><button class="btn btn-primary" onclick="changeTeam(this.parentElement.parentElement.id, 'team_1')">`+ global.current_language_strings.team_change +`</button></td>`
    var change_team_2_button = `<td><button class="btn btn-primary" onclick="changeTeam(this.parentElement.parentElement.id, 'team_2')">`+ global.current_language_strings.team_change +`</button></td>`

    if (team == "team_1") {
        html_id.children[1].innerHTML = `✅`;
        html_id.children[2].innerHTML = change_team_2_button;
        game.team_1_player_list.push(player_name)
    } else {
        html_id.children[1].innerHTML = change_team_1_button;
        html_id.children[2].innerHTML = `✅`;
        game.team_2_player_list.push(player_name)
    }

    var team_1_lenght = game.team_1_player_list.length
    var team_2_lenght = game.team_2_player_list.length
    var player_list_length = game.player_list.length

    // Update team selection next button
    if (team_1_lenght + team_2_lenght == game.player_list.length && (team_1_lenght > 0 && team_2_lenght > 0) ) {
        document.getElementById("text_team_selection_next").disabled = false
    } else {
        document.getElementById("text_team_selection_next").disabled = true
    }
}

function displayweakestLinkDisplayVote() {
    displayPage("weakest_link_vote")
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

function DEBUG_RandomPlayer() {
    addPlayer("J" + "#" + (game.player_list.length+1) + "_" + (Math.random()*0xFFFF).toString(16));
}

function parseBoolean(value) {
    return bool_value = value == 'true';
}

function alertRandomPlayer() {
    if (game.player_list.length > 0) {
        var random_int = Math.floor(Math.random() * game.player_list.length);
        var random_player = game.player_list[random_int];
        alert_random_player_button.innerHTML = random_player;
    }
}

function preloadSound(specific) {
    if (global.audio_enabled == true) {
        if (specific == "all" || specific == "weakest_link") {
            global.audio.weakest_link_amb_60 = new Audio('./src/audio/weakest_link_question_amb_60.mp3');
            global.audio.weakest_link_amb_60.loop = false;
            global.audio.weakest_link_amb_end = new Audio('./src/audio/weakest_link_question_amb_end.mp3');
            global.audio.weakest_link_amb_end.loop = false;
        }
    }
}

function playsound(sound) {
    if (global.audio_enabled == true) {
        switch (sound) {
            case "weakest_link_amb_60":
                global.audio.weakest_link_amb_60.currentTime = 0;
                global.audio.weakest_link_amb_60.play(); 
            break; 
            case "weakest_link_amb_end":
                global.audio.weakest_link_amb_end.currentTime = 0;
                global.audio.weakest_link_amb_end.play(); 
            break; 
            default:
            break;
        }
    }
}

function stopsound(sound) {
    if (global.audio_enabled == true) {
        global.audio.weakest_link_amb_60.pause(); 
        switch (sound) {
            case "weakest_link_amb_60":
                global.audio.weakest_link_amb_60.pause();  
            break; 
            case "weakest_link_amb_end":
                global.audio.weakest_link_amb_60.pause(); 
            break; 
            default:
            break;
        } 
    } 
}

function manageHergeBTChoice(cookie_choice, remind_me_later) {
    if (cookie_choice == true) {
        global.accept_cookie = true;
        global.remind_warning_panel = true;
        if (remind_me_later == false) {
            // console.log("Ne plus afficher")
            global.remind_warning_panel = false;
        }
        storeSettingsCookie()
    }
    
    displayPage('menu')
    getCookie("settings")
}

// Prevent reload
window.addEventListener('beforeunload', function(e) {
    // Cancel the event
    e.preventDefault();
    // Chrome requires returnValue to be set
    e.returnValue = '';
});

function copyTriviaTable() {
    var urlField = document.querySelector('#opentdb_table');
    var range = document.createRange();  
    range.selectNode(urlField);
    window.getSelection().addRange(range);
    
    document.execCommand('copy');
}

function iniTriviaData(nb) {
    game.weakest_link.database_opentdb = []
    getTriviaData(nb).then(data => {
        var object = data
        console.log(object)
        game.weakest_link.database_opentdb = data
        displayTriviaData()
    });
}

function displayTriviaData() {
    var extractHTML = ""
    for (var i = 0; i < game.weakest_link.database_opentdb.length; i++) {
        var object = game.weakest_link.database_opentdb[i]
        extractHTML += `<tr><td>${object.category}</td><td>type</td><td>${object.difficulty}</td><td>${object.question}</td><td>${object.correct_answer}</td><td>${object.incorrect_answers}</td>`
    }
    document.getElementById("opentdb_table_body").innerHTML += extractHTML

    // {
    //     "category": "General Knowledge",
    //     "type": "boolean",
    //     "difficulty": "medium",
    //     "question": "The US emergency hotline is 911 because of the September 11th terrorist attacks.",
    //     "correct_answer": "False",
    //     "incorrect_answers": ["True"]
    // }
}

async function getTriviaData(questionCount) {
    // Vérifiez si le nombre de questions est dans la plage autorisée
    if (questionCount < 1 || questionCount > 50) {
        console.error('Le nombre de questions doit être compris entre 1 et 50.');
        return;
    }

    // Construisez l'URL avec le nombre de questions
    const url = `https://opentdb.com/api.php?amount=${questionCount}&category=9`;

    try {
        // Faites une requête à l'API
        const response = await fetch(url);

        // Vérifiez si la requête a réussi
        if (!response.ok) {
            console.error('Erreur lors de la récupération des données:', response.status);
            return;
        }

        // Convertissez la réponse en JSON
        const data = await response.json();

        // Affichez les résultats dans la console
        console.log(data.results);
        return data.results;
        
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
    }
}

function DEBUG_carthage(debug) {
    if (debug == true) {
        document.getElementById("gamename_menu").innerHTML = "CODE LYOKOLITO";
        document.getElementById("gamename_menu").style = "background-color: #061f01; color: #0079d2; text-shadow: 0 0 BLACK; font-family: courier;"
        checkBrowserColorScheme(false)
        document.getElementById("debug_tools_placeholder").style.display = "block";
        
        alert("Bienvenue à Carthage.");
    } else {
        document.getElementById("gamename_menu").innerHTML = "PICOLITO";
        document.getElementById("gamename_menu").style = ""
        checkBrowserColorScheme()
        document.getElementById("debug_tools_placeholder").style.display = "none";
        
        alert("Retour vers le passé.");
    }
}

function DEBUG_weakestlink_add5sec() {
    if (global.dev_mode == true) {
        var current_time_player = global.audio.weakest_link_amb_60.currentTime;
        var current_time = game.weakest_link.current_time;
    
        if ((current_time - 5) >= 5) {
            global.audio.weakest_link_amb_60.currentTime = current_time_player + 5;
            game.weakest_link.current_time = current_time - 5;
        }
    
        weakestLinkCalcTime();
    }
}

function DEBUG_ImportCSV() {
    var formFile = document.getElementById('input_csv');

    if (!formFile.files) {
        console.log("This browser doesn't seem to support the `files` property of file inputs.");
    } else if (!formFile.files[0]) {
        console.log("No file selected.");
    } else {
        // console.log("Import CSV called.")
        let file = formFile.files[0];
        let fr = new FileReader();
        fr.onload = receivedText;
        fr.readAsText(file);

        function receivedText() {
            // console.log("RESULT", fr.result);
            // console.log(fr);

            var csv_result = fr.result;
            csvJSON(csv_result)
            // console.log(csv_result)
        // Do additional processing here
        }
    }
}

//     {cycle_state:"false",
//     type:"8",
//     text:"Team %t: What is %s's zodiac sign? If you're right,
//     the other team drinks $ times. Otherwise, you drink!",
//     ...
//     key:"",
//     parent_key:"",
//     pack_name:"war",
//     language:"en",
//     nb_players:"1"
// },

function csvJSON(csv) {
    function removeQuote(text) {
        return text.substring(1,text.length-1)
    }
    var lines=csv.split("\n");
    var result = [];
    for (var i=0; i<lines.length; i++) {
        var obj = {};
        // Mise en tableau de la ligne séparé des virgules
        var currentline=lines[i].split(",");
        var text = [];
        if (currentline.length == 8) {
            text.push(currentline[2]);
        } else {
            for (var j=0; j<currentline.length-7; j++) {
                text.push(currentline[j+2])
            }
        }
        obj["text"] = removeQuote(text.join(''));
        obj["cycle_state"] = removeQuote(currentline[0]);
        console.log(currentline[0])
        obj["type"] = removeQuote(currentline[1]);
        obj["key"] = removeQuote(currentline[currentline.length-5]);
        obj["parent_key"] = removeQuote(currentline[currentline.length-4]);
        obj["pack_name"] = removeQuote(currentline[currentline.length-3]);
        obj["language"] = removeQuote(currentline[currentline.length-2]);
        obj["nb_players"] = removeQuote(currentline[currentline.length-1]);
        
        var lang = removeQuote(currentline[currentline.length-2])
        var gamemode = removeQuote(currentline[currentline.length-3])
        
        result.push(obj);
    }
    console.log(result)
}
    // Le CSV n'est pas régulier, ne pas prendre la première variable
    // var headers=lines[0].split(",");

//IndexedDB API, remplacement des cookies

// const request = window.indexedDB.open("PicolitoData", 1);
// request.onerror = (event) => {
//     // Do something with request.errorCode!
//     console.log(request.errorCode)
// };
//   request.onsuccess = (event) => {
//     // Do something with request.result!
//     console.log(request.result)
// };

// let db;
// const request = indexedDB.open("MyTestDatabase");
// request.onerror = (event) => {
//     console.error("Why didn't you allow my web app to use IndexedDB?!");
// };
// request.onsuccess = (event) => {
// db = event.target.result;
// };


// Service Woker, Mise en cache
if ('serviceWorker' in navigator && window.origin != "null" && window.matchMedia('(display-mode: standalone)').matches) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) {
        if(reg.installing)
            console.log('Service worker installing');
        else if(reg.waiting)
            console.log('Service worker installed');
        else if(reg.active)
            console.log('Service worker active');

    }).catch(function(error) {
        // registration failed
        console.log('Registration failed with ' + error);
    });
};