// First function called when #body is loaded
function init() {
    checkBrowserColorScheme();
    defaultVariables();
    setLanguageString();
    password_generateAmountSelector();
    updateCurrentLanguageString("fr")
    filterVariables();
    retrieveCookie();
    loadPlayerListFromCookie(); // Charger les joueurs depuis les cookies
    if (global.debug == true) { devOverrideSettings() }
    displaySafetyAndCookieModal();
}

function devOverrideSettings() {
    document.getElementById("gamename_menu").innerHTML = global.picolito_version + " - dev";
    if (getCookie("player_list").length == 0) { DEBUG_RandomPlayer(4) }
    displayPage("menu")
    global.remind_warning_panel = false;
    // game.password.style = "password_2025";

    radio_settings_password_mode_preview.checked = true

    // selectGamemode("password");
}

function defaultVariables() {
    global = {
        current_language: "fr",
        debug: false,
        dark_mode: "bright",
        picolito_version: "0.34.2",
        cookie_expiration_delay: 15,
        audio : {
            weakest_link_amb_60: undefined,
            weakest_link_amb_end: undefined
        },
        audio_enabled: true,
        cookie_settings_value : [],
        use_cache_storage: false,
        portrait_mode: false,

        modal_player_menu: new bootstrap.Modal(document.getElementById('modal_modal_player_menu')),
        modal_sentence_modifier: new bootstrap.Modal(document.getElementById('modal_sentence_modifier')),
        modal_safety_and_cookie_modal: new bootstrap.Modal(document.getElementById('modal_safety_and_cookie_modal')),
        modal_sentence_list: new bootstrap.Modal(document.getElementById('modal_sentence_list')),
        modal_password_preview: new bootstrap.Modal(document.getElementById('modal_password_preview'))
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
            // Sentences of type 1 is blue, 2 and 3 is yellow, 4 is green, etc...
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

        mix_gamemode_list_picolo: [],  //["default", "hot", "bar", "silly"]
        mix_gamemode_list_never_done: [],  //["never_popular", "never_hot", "never_party"]

        player_list: [], //{ id: 1, name: "Alice", team: null },
        max_player_number: -1,

        team_1: "EQUIPE# 1",
        team_2: "EQUIPE# 2",
        team_1_player_list: [],
        team_2_player_list: [],

        sip: { min: 1, max: 4 },
        started: false,
        cycle_id: -1,
        gamemode: "default",
        gamemode_type: "text",
        display_indicator: false,
        display_color_indicator: true,
        animation: true,

        sentence_history: [],   //sentence_history_item = { sentence,key,type,nature }
        sentence_amount: 50,

        picolito : {
            chug_enabled: true,
            chug_amount: 1,
            chug_sentence_id_start_min: 10, // chug start to appear after sentence_id X

            virus_enabled: true,
            virus_remaining: 1, // virus can occur X times, can overlap
            virus_end_min: 3,   // virus can end after X more sentence_id minimum
            virus_end_max: 6,   // virus can end after X more sentence_id maximum
            virus_sentence_id_start_min: 10, // virus start to appear after sentence_id X
    
            social_posting_enabled: false,

            // can_alter_player_name_in_sentence: true,
            // can_alter_sip_in_sentence: true,
        },
        weakest_link: {
            weakestLinkTimer: undefined,
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
                average_answer_time: []
            },
            hide_answer: false
        },
        password: {
            currentIndex: -1,
            word_to_find_left: undefined,
            word_status: [],
            words: [], // Array to store the fetched words
            style: "password_2016",
            word_to_find_amount: 5,
            word_to_find_min: 1,
            word_to_find_max: 10,
            mode: "preview", //"preview", "direct"
            hide_hint_after_seconds: 3,
            db_source: "trouve_mot_api", // "trouve_mot_api", "local"
        },
        tenzi: {
            // Init by tenzi.js
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
    game.picolito.virus_remaining = 1;
    game.chug_remaining = game.picolito.chug_amount;
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
    input_chug_enabled.checked = game.picolito.chug_enabled;
    input_virus_enabled.checked = game.picolito.virus_enabled;
    input_social_posting_enabled.checked = game.picolito.social_posting_enabled;

    input_sip_min.value = game.sip.min;
    input_sip_max.value = game.sip.max;
    input_potential_chug = game.picolito.chug_amount;

    input_color_display_settings.checked = game.display_color_indicator;
    input_color_display_animation.checked = game.animation;

    input_dark_mode_settings.value = global.dark_mode;
    changeDarkModeSettings(global.dark_mode)

    input_settings_landscape.checked = global.portrait_mode;
    changePortraitModeSettings(global.portrait_mode)

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

    displayPage('menu');
}

function displaySafetyAndCookieModal() {
    if (global.remind_warning_panel == true || global.remind_warning_panel == undefined) { global.modal_safety_and_cookie_modal.show(); }
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

        // A CHANGER
        // Une seule valeur pour changer l'affichage, sinon, par default: bright_mode
    } else if (value == "bright") {
        document.body.classList.add("bright_mode")
        document.body.classList.remove("dark_mode")
        global.dark_mode = "bright";
    } else {
        document.body.classList.add("dark_mode")
        document.body.classList.remove("bright_mode")
        global.dark_mode = "dark";
    }
}

function changePortraitModeSettings(value) {
    global.portrait_mode = value;
    if (value == true) {
        document.body.classList.add("portrait_mode_enabled")
    } else {
        document.body.classList.remove("portrait_mode_enabled")
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
    game.picolito.chug_amount = parseInt(value);
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
    scriptTag.type = "text/javascript";
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
    if (game.picolito.chug_enabled == false) {
        //delete and share red probability into others colors
        hopper(game.type_by_color, "red");
    }
    if (game.picolito.virus_enabled == false) {
        //delete and share yellow probability into others colors
        hopper(game.type_by_color, "yellow");
    }
}

function replaceAt(string, index, replace, length) {
    return string.substring(0, index) + replace + string.substring((index+length)+1);
}

function displayPage(page) {
    var pages = ["menu", "game"]

    for (var i in pages) {
        document.getElementById(pages[i]).style.display = 'none';
    }
    document.getElementById(page).style.display = 'block';
}

function addPlayer(player_name) {
    if (player_name == "" || player_name == undefined) {
        return;
    }
    // DEV MODE
    if (menu_player_input.value.toLowerCase() == "lyoko") {
        menu_player_input.value = "";
        DEBUG_carthage(true);
        return;
    }
    if (menu_player_input.value.toLowerCase() == "terre") {
        menu_player_input.value = "";
        DEBUG_carthage(false);
        return;
    }

    const id = game.player_list.length > 0 ? game.player_list[game.player_list.length - 1].id + 1 : 1;
    game.player_list.push({ id, player_name, team: "null" });
    refreshPlayerList();
    document.getElementById("menu_player_input").value = "";
}

function refreshPlayerList() {
    const playerListElement = document.getElementById("menu_player_list");
    playerListElement.innerHTML = "";

    var team_mode = menu_player_switch_team_mode.checked;   

    game.player_list.forEach(player => {
        var listItem = "";
        var team = player.team;
        var team_class = "";
        if ((team == "team_1" || team == "team_2") && team_mode == true) {
            team_class = "bg-" + player.team;
        } else {

        }
        listItem += `<li class="list-group-item d-flex justify-content-between align-items-center col-12 ${team_class}">`;
        listItem += `<span>${player.player_name}</span>`;
        listItem += `<div>`;
        if (team_mode == true) {
            console.log(player.team)
            if (player.team == "null") {
                listItem += `<button class="btn btn-primary btn-sm bg-team_1" onclick="assignPlayerToTeam(${player.id}, 'team_1')">
                            <i class="bi bi-people"></i>
                        </button>
                        <button class="btn btn-primary btn-sm bg-team_2" onclick="assignPlayerToTeam(${player.id}, 'team_2')">
                            <i class="bi bi-people"></i>
                        </button>`;
            }
            if (player.team == "team_1") {
                listItem += `<button class="btn btn-primary btn-sm bg-team_2" onclick="assignPlayerToTeam(${player.id}, 'team_2')">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>`;
            }
            if (player.team == "team_2") {
                listItem += `<button class="btn btn-primary btn-sm bg-team_1" onclick="assignPlayerToTeam(${player.id}, 'team_1')">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>`;
            }
        }
        listItem += `<button class="btn btn-primary btn-sm" onclick="editPlayerNameModal(${player.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="removePlayer(${player.id})">
                        <i class="bi bi-trash"></i>
                    </button>`;
        listItem += `</div>`;
        listItem += `</li>`;
        playerListElement.innerHTML += listItem;
    });
    storePlayerListCookie();
}

function refreshTeamDisplay() {
    if (menu_player_switch_team_mode.checked) {
        document.getElementById("menu_player_team_1_name").innerHTML = game.team_1;
        document.getElementById("menu_player_team_2_name").innerHTML = game.team_2;
    
        document.getElementById("menu_player_team_placeholder").classList.remove("d-none")
    } else {
        document.getElementById("menu_player_team_placeholder").classList.add("d-none")
    }
    
    refreshPlayerList()
}

function removePlayer(html_element_id) {
    game.player_list = game.player_list.filter(player => player.id !== html_element_id);
    refreshPlayerList();
}

function editPlayerNameModal(id) {
    const player = game.player_list.find(player => player.id === id);
    console.log(player)
    if (player) {
        const newName = prompt("Enter new name:", player.player_name);
        if (newName) {
            player.player_name = newName;
            refreshPlayerList();
        }
    }
}

function editTeamName(team) {
    if (team == "team_1") {
        var team_name = game.team_1;
        document.getElementById("menu_player_team_1_name").innerHTML = promptTeamName(team_name);
    }
    if (team == "team_2") {
        var team_name = game.team_2;
        document.getElementById("menu_player_team_2_name").innerHTML = promptTeamName(team_name);
    }

    function promptTeamName(old_name) {
        const newName = prompt("Enter new name:", old_name);
        if (newName) { return newName; }
    }
}

function assignPlayerToTeam(id, team) {
    const player = game.player_list.find(player => player.id === id);
    if (player) {
        player.team = team;
    }
    refreshPlayerList();
}

function getLastCharacter(text) {
    return text.substr(text.length - 1, 1);
}

function getActualBackgroundColorByHistory() {
    if ( game.cycle_id >= 0 ) {
        return game.sentence_history[game.cycle_id].color;
    } else {
        return "black";
    }
}

function setBackgroundStyleColor(value) {
    document.getElementById("game").className = "page dark_affected " + value;
}

function initGame(direct_launch) {
    // à convertir en switch?
    text_ingame_title.innerHTML = "";

    addPotentialPortraitDisplayMarker("landscape")
    displayTenziGame(false)

    getMinPlayer()

    if (game.gamemode == "war") {
        if (game.player_list.length >= 2) {
            updateTeamSelectionTable();
        }
    }
    if (game.gamemode == "weakest_link") {
        initGameWeakestLink();
    }
    if (game.gamemode == "password") {
        if (window.navigator.onLine == true) {
            initGamePassword()
        } else {
            alert(global.current_language_strings.password_internet_requierement)
            return;
        }
    }
    if (game.gamemode == "tenzi") {
        initGameTenzi();
    } else {
        if (game.started == false) {
            game.started = true;
            checkDatabase();
        }
        displayPage('game');
        manageIngameOptionDisplay(true, "start", "block");
        manageNavDisplay("quit",true);
        manageNavDisplay("restart",false);
        manageNavDisplay("navigation_arrows", true);

        if (game.gamemode == "mix" ) {
            createGamemodeDBindicator();
        }
    }
    if (game.gamemode_type == "picolo" || game.mix_gamemode_list_picolo.length > 0) {
        global.modal_player_menu.show();
    }

    if (direct_launch == true) { startGame() }
}

function initGameWeakestLink() {
    checkDatabase();
    manageIngameOptionDisplay(true, "weakest_link", true);
    manageIngameOptionDisplay(true, "start", "block");
    manageIngameOptionDisplay(true, "weakest_link_rule", "block");
    manageNavDisplay("players", false);
    manageNavDisplay("restart", false);
    preloadSound("weakest_link");
    weakestLinkCalcTime();
    displayPage('game');
}
function initGamePassword() {
    addPotentialPortraitDisplayMarker("portrait");
    manageIngameOptionDisplay(true, "password", true);
    manageIngameOptionDisplay(true, "start", "block");
    manageIngameOptionDisplay(true, "password_rule", "block");
    manageNavDisplay("players", false);
    manageNavDisplay("restart", false);
    manageNavDisplay("navigation_arrows", false);
    displayPage('game');
}
function initGameTenzi() {
    manageNavDisplay("navigation_arrows", false);
    manageNavDisplay("players", false);
    manageNavDisplay("restart", false);
    displayPage('game');
    displayTenziGame(true)
    initTenzi();
}

function checkDatabase() {
    // Vérifie si la base de données demandée n'est pas déjà appelé dans 
    if (game.gamemode == "mix") {
        // A CONCATENER game.mix_gamemode_list_picolo et never_done
        console.log("gamemode_mix", game.mix_gamemode_list_picolo, game.mix_gamemode_list_never_done)
        for (var i = 0; i < game.mix_gamemode_list_picolo.length; i++) {
            testStoredDatabase(game.mix_gamemode_list_picolo[i], global.current_language);         
        }
        for (var i = 0; i < game.mix_gamemode_list_never_done.length; i++) {
            testStoredDatabase(game.mix_gamemode_list_never_done[i], global.current_language);         
        }
    } else {
        testStoredDatabase(game.gamemode, global.current_language)
    }
}

function testStoredDatabase(gamemode, lang) {
    try {
        if (game.stored_db && game.stored_db[gamemode + "_" + lang]) {
            // DB exists, concat to pending_db
            game.pending_db = game.pending_db.concat(game.stored_db[gamemode + "_" + lang])
        } else {
            // Calling file gamemode_lang.js
            createScriptElement("./src/js/db/" + gamemode + "_" + lang + ".js");
        }
    } catch (error) {
        if (error instanceof TypeError) {
            console.log(error.message);
        } else {
            throw error;
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
        game.password.word_to_find_amount = document.querySelector('input[name="password_word_amount_selector_radio"]:checked').value;

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
    if (game.weakest_link.weakestLinkTimer != undefined) { clearInterval(game.weakest_link.weakestLinkTimer) }

    setBackgroundStyleColor("black");
    hidePicoloVirusTitle()
    displaySentence("", undefined); // reset HTML sentence display

    updateGameCycleIndicator();                                  // reset cycle count
    resetVariables();

    manageNavigationButton("previous", false)
    manageNavigationButton("game_cyle", false)
    manageNavigationButton("next", false)

    manageIngameOptionDisplay(false, 'start', 'none')
    manageIngameOptionDisplay(false, 'replay', 'none')
    manageIngameOptionDisplay(false, 'weakest_link', 'none')
    manageIngameOptionDisplay(false, 'weakest_link_vote', 'none')
    manageIngameOptionDisplay(false, 'weakest_link_next_vote', 'none')
    manageIngameOptionDisplay(false, 'weakest_link_vote_end', 'none')
    manageIngameOptionDisplay(false, 'weakest_link_rule', 'none')
    manageIngameOptionDisplay(false, "password", 'none');
    manageIngameOptionDisplay(false, "password_rule", 'none');
    manageIngameOptionDisplay(false, "password_recap", 'none');
    
    manageNavDisplay("navigation_arrows", true);
    manageNavDisplay("players", true);
    manageNavDisplay("restart",false);

    displayPage('menu');

    ingame_answer.innerHTML = "";
}

function restartGame() {
    exitGame();
    selectGamemode(game.gamemode, true);
}

function selectGamemode(selected_gamemode, direct_launch) {
    game.gamemode = selected_gamemode;
    if (selected_gamemode == "weakest_link" && game.player_list.length <= 3) {
        alert(global.current_language_strings.weakest_link_minimum_requierement);
        return;
    }
    switch (selected_gamemode) {
        case "default": game.gamemode_type = "picolo"; break;
        case "silly": game.gamemode_type = "picolo"; break;
        case "bar": game.gamemode_type = "picolo"; break;
        case "hot": game.gamemode_type = "picolo"; break;
        case "war": game.gamemode_type = "picolo"; break;
        case "never_popular": game.gamemode_type = "never_done"; break;
        case "never_hot": game.gamemode_type = "never_done"; break;
        case "never_party": game.gamemode_type = "never_done"; break;
        case "weakest_link": game.gamemode_type = "weakest_link"; break;
        case "password": game.gamemode_type = "password"; break;
        case "tenzi": game.gamemode_type = "tenzi"; break;
        case "mix": game.gamemode_type = "mix"; break;
    }
    console.log("gamemode_type", game.gamemode_type)
    if (selected_gamemode == "mix") {
        setMixGamemodeDatabase();
    }
    
    initGame(direct_launch);
}

function setMixGamemodeDatabase() {
    // Pour toutes les checkbox cochées, mise en tableau des valeurs correspondantes 
    var checkboxes_picolo = document.getElementById("custom_mix_gamemode_picolo_section").querySelectorAll('input[type=checkbox]:checked')
    var checkboxes_neverdone = document.getElementById("custom_mix_gamemode_never_done_section").querySelectorAll('input[type=checkbox]:checked')

    game.mix_gamemode_list_picolo = [];
    game.mix_gamemode_list_never_done = [];

    for (var i = 0; i < checkboxes_picolo.length; i++) {
        game.mix_gamemode_list_picolo.push(checkboxes_picolo[i].value)
    }
    for (var i = 0; i < checkboxes_neverdone.length; i++) {
        game.mix_gamemode_list_never_done.push(checkboxes_neverdone[i].value)
    }
}

function updateMixGamemodeForm() {
    var checkboxes_picolo = document.getElementById("custom_mix_gamemode_picolo_section").querySelectorAll('input[type=checkbox]:checked')
    var checkboxes_neverdone = document.getElementById("custom_mix_gamemode_never_done_section").querySelectorAll('input[type=checkbox]:checked')

    if ((checkboxes_picolo.length + checkboxes_neverdone.length) == 0) {
        document.getElementById("button_update_mix_gamemode_list").disabled = true;
    } else {
        document.getElementById("button_update_mix_gamemode_list").disabled = false;
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
    } else {
        ingame_option.style.display = "none";
    }

    if (option_identifier != undefined && option_display_value != undefined) {
        switch(option_identifier) {
            case "start": var selected_option = start_ingame_option; break;
            case "replay": var selected_option = replay_ingame_option; break;
            case "weakest_link": var selected_option = ingame_weakest_link; break;
            case "weakest_link_vote": var selected_option = weakest_link_vote_ingame_option; break;
            case "weakest_link_next_vote": var selected_option = weakest_link_next_vote_ingame_option; break;
            case "weakest_link_vote_end": var selected_option = weakest_link_vote_end_ingame_option; break;
            case "weakest_link_rule": var selected_option = weakest_link_rule; break;
            case "password": var selected_option = ingame_password; break;
            case "password_rule": var selected_option = password_rule; break;
            case "password_recap": var selected_option = password_recap; break;
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

function addPotentialPortraitDisplayMarker(value) {
    game_content.classList.remove("portrait-mode");
    if (value == "landscape") {
        game_content.classList.add("portrait-mode");
    } else if (value == "portrait") {
        game_content.classList.remove("portrait-mode");
    }
}

function updateGameCycleIndicator() {
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

function addHistoryItem(posOffset, database_id, original_sentence, sentence_keys, formatted_sentence, key, type, color, pack_name, answer) {

    var offset_sentence_id = (game.cycle_id) + posOffset;
    if (posOffset > 0) {
        for (var i = 0; i < posOffset; i++) {
            var sentence_history_content = {
                id: "A0000000000000",
                formatted_sentence:"none"
            }
            game.sentence_history.push(sentence_history_content);
        }
    }
    var sentence_history_item = {
        database_id: database_id,
        original_sentence: original_sentence,
        sentence_keys: sentence_keys,
        formatted_sentence: formatted_sentence,
        key: key,
        type: type,
        color : color,
        pack_name : pack_name,
        answer : answer
    }
    if (game.sentence_history[game.cycle_id] == undefined) {
        game.sentence_history.push(sentence_history_item);
    } else if (game.sentence_history[offset_sentence_id].formatted_sentence == "none") {
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
    const original_sentence = text;
    const keys = [];
    let formatted_sentence = text;
    var is_modified = false;

    if (game.display_color_indicator == true) {
        var html_span_sip = "<span class=\" span_highlight span_sip\">";
        var html_span_player = "<span class=\" span_highlight span_player\">";
        var html_span_team = "<span class=\" span_highlight span_team\">";
        var html_span_end = "</span>";
    } else {
        var html_span_sip = "";
        var html_span_player = "";
        var html_span_team = "";
        var html_span_end = "";
    }

    // retrieve all player names
    var player_name_list = [];
    for (var i = 0; i < game.player_list.length; i++) { player_name_list.push(game.player_list[i].player_name) }

    for (var i = 0; i < formatted_sentence.length; i++) {
        if (formatted_sentence.charAt(i) == "$") {
            const sip = randomSip();
            formatted_sentence = replaceAt(formatted_sentence, i, html_span_sip + sip + html_span_end, 0);
            keys.push({ type: 'sip', value: sip });
            is_modified = true;
        }
        // change %s by random player
        if (formatted_sentence.charAt(i) == "%" && formatted_sentence.charAt(i + 1) == "s") {
            var random_player_index = Math.floor(Math.random() * player_name_list.length);
            var random_player = player_name_list[random_player_index];
            player_name_list.splice(random_player_index, 1);
            formatted_sentence = replaceAt(formatted_sentence, i, html_span_player + random_player + html_span_end, 1);
            keys.push({ type: 'player', value: random_player });
            is_modified = true;
        }
        // change %t by team
        if (formatted_sentence.charAt(i) == "%" && formatted_sentence.charAt(i + 1) == "t") {
            const team = Math.random() < 0.5 ? game.team_1 : game.team_2;
            formatted_sentence = replaceAt(formatted_sentence, i, html_span_team + team + html_span_end, 1);
            keys.push({ type: 'team', value: team });
            is_modified = true;
        }
    }

    return {
        original_sentence: original_sentence,
        keys: keys,
        formatted_sentence: formatted_sentence,
        is_modified: is_modified
    };
}

function applyTextModifiers(original_sentence, keys) {
    let formatted_sentence = original_sentence;

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

    keys.forEach(modifier => {
        switch (modifier.type) {
            case 'sip':
                formatted_sentence = formatted_sentence.replace('$', html_span_sip + modifier.value + html_span_end);
                break;
            case 'player':
                formatted_sentence = formatted_sentence.replace('%s', html_span_player + modifier.value + html_span_end);
                break;
            case 'team':
                formatted_sentence = formatted_sentence.replace('%t', html_span_team + modifier.value + html_span_end);
                break;
        }
    });

    return formatted_sentence;
}

function displaySentenceList() {
    global.modal_sentence_list.show();
    modal_sentence_list_content.innerHTML = "";

    var html_element = "";
    for (var i = 0; i < game.sentence_history.length; i++) {
        var color = game.sentence_history[i].color;
        var sentence = game.sentence_history[i].formatted_sentence;

        if (sentence != "none") {
            var sentence_index = parseInt(i)+1;
            html_element += `<li class="list-group-item sentence-list border-color-${color} text-color-${color}" onclick="goToSpecificSentence(${i})">${sentence_index}. ${sentence}</li>`;
        } else {
            break;
        }
    }
    modal_sentence_list_content.innerHTML = html_element;
}

function displayTenziGame(force_ingame) {
    if (force_ingame == true) {
        document.getElementById("tenzi_game").style.display = "block";
    } else {
        document.getElementById("tenzi_game").style.display = "none";
    }
}

function displaySipModifierModal() {
    global.modal_sentence_modifier.show();
    document.getElementById("modal_sentence_modifier_sentence").innerHTML = game.sentence_history[game.cycle_id].formatted_sentence;
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

function manageMenuTab(element) {
    const menu_tab_nav = document.getElementById("menu_tab_nav")
    const value = element.getAttribute("value")
    for (var i in menu_tab_nav.children) {
        if (menu_tab_nav.children[i].children) {
            menu_tab_nav.children[i].children[0].classList.remove("active")
        }
    }

    $('#gamemode_collapse_main').collapse('hide')
    $('#gamemode_collapse_picolo').collapse('hide')
    $('#gamemode_collapse_never').collapse('hide')
    $('#gamemode_collapse_other').collapse('hide')

    switch (value) {
        case "main":
            document.getElementById("nav_menu_link_main").classList.add("active")
            $('#gamemode_collapse_main').collapse('show')
        break;
        case "picolo":
            document.getElementById("nav_menu_link_picolo").classList.add("active")
            $('#gamemode_collapse_picolo').collapse('show')
        break;
        case "never":
            document.getElementById("nav_menu_link_never").classList.add("active")
            $('#gamemode_collapse_never').collapse('show')
        break;
        case "other":
            document.getElementById("nav_menu_link_other").classList.add("active")
            $('#gamemode_collapse_other').collapse('show')
        break;
    }    
    return;
}

function displayweakestLinkDisplayVote() {
    displayPage("weakest_link_vote")
}

window.addEventListener("keydown", function(event) {
    if (game.started == true) {
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

// Confirmation de retour ou de sortie de la page
window.addEventListener('beforeunload', function(e) {
    if (game.started == true) {
        e.preventDefault();
        // Chrome
        e.returnValue = '';
    }
});

function DEBUG_RandomPlayer(amount) {
    var groland_names = ["Ricard","Bertrude","Zolande","Alpipignoux","Fifrelin","Anisette","Migreline","Giclette","Fanchon","Patimbert","Flinflin","Pantoufline","Childibert","Tringolin","Mimeline","Fricadène","Monique"];
    for (var i=0; i<amount; i++) {
        var random = Math.round(Math.random() * (groland_names.length-1))
        addPlayer(groland_names[random]);
        groland_names.splice(random, 1);
    }
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
            global.remind_warning_panel = false;
        }
        storeSettingsCookie()
    }
    
    displayPage('menu')
    getCookie("settings")
}

function password_generateAmountSelector() {
    selector = document.getElementById("password_word_amount_selector")
    selector.innerHTML = ""

    for (var i = game.password.word_to_find_min; i <= game.password.word_to_find_max; i++) {
        selector.innerHTML += `<input id="password_word_amount_selector_radio_${i}" name="password_word_amount_selector_radio" value="${i}" class="radio isHidden" name="password_word_amount_selector_radio" type="radio">`
        selector.innerHTML += `<label for="password_word_amount_selector_radio_${i}" class="password_label">${i}</label>`
    }   

    document.getElementById("password_word_amount_selector_radio_" + game.password.word_to_find_amount).checked = true;
}

function createGamemodeDBindicator() {
    // Ici on peuple l'indicateur de base de donnée dans le mode de jeu mix.
    // Les deux bases sont séparées pour les choisir 1 fois sur deux 
    // Boucle pour ajouer un bouton pour chacune.
    ingame_gamemode_information_mix_indicator_db.innerHTML = ""

    for (var i in game.mix_gamemode_list_picolo) {
        var id = game.mix_gamemode_list_picolo[i];
        var display_name = game.mix_gamemode_list_picolo[i];

        var element = "<button type=\"button\" value=\"" + id + "\"class=\"btn\" id=\"ingame_gamemode_information_mix_indicator_" + id + "\" disabled>" + display_name +"</button>"
        document.getElementById("ingame_gamemode_information_mix_indicator_db").innerHTML += element;
    }
    for (var i in game.mix_gamemode_list_never_done) {
        var id = game.mix_gamemode_list_never_done[i];
        var display_name = game.mix_gamemode_list_never_done[i];

        var element = "<button type=\"button\" value=\"" + id + "\"class=\"btn\" id=\"ingame_gamemode_information_mix_indicator_" + id + "\" disabled>" + display_name +"</button>"
        document.getElementById("ingame_gamemode_information_mix_indicator_db").innerHTML += element;
    }
}

function selectGamemodeDBIndicator(id) {
    for (var i=0; i<ingame_gamemode_information_mix_indicator_db.children.length; i++) {
        document.getElementById("ingame_gamemode_information_mix_indicator_db").children[i].classList.remove("mix-btn-indicator")
        console.log(ingame_gamemode_information_mix_indicator_db.children[i].value)
        if (id == ingame_gamemode_information_mix_indicator_db.children[i].value) {
            var selected_id_selected = i
            // On selection la valeur de l'enfant n° X pour avoir le nom de la base de donnée
        }
    }

    // Une fois trouver sa position dans le nombre de base de données, on le selectionne    
    document.getElementById("ingame_gamemode_information_mix_indicator_db").children[selected_id_selected].classList.add("mix-btn-indicator")
}

function DEBUG_carthage(debug) {
    if (debug == true) {
        game.debug = true;
        global.modal_player_menu.hide()
        document.getElementById("gamename_menu").innerHTML = "CODE LYOKOLITO";
        document.getElementById("debug_tools_placeholder").style.display = "block";
        alert("Bienvenue à Carthage.");
    } else {
        game.debug = false;
        global.modal_player_menu.hide()
        document.getElementById("gamename_menu").innerHTML = "PICOLITO";
        document.getElementById("debug_tools_placeholder").style.display = "none";
        alert("Retour vers le passé.");
    }
}

function DEBUG_weakestlink_add5sec() {
    if (global.debug == true) {
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


//     fr
// en
// da
// de
// es
// fi
// it
// ja
// ko
// nb
// nl
// pt
// ru
// sv

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