// First function called when #body is loaded
function init() {
    // checkBrowserColorScheme();
    defaultVariables();
    setLanguageString();
    updateCurrentLanguageString("fr");
    filterVariables();
    retrieveCookie();
    loadPlayerListFromCookie(); // Charger les joueurs depuis les cookies

    refreshDBList();
    
    if (global.debug == true) { devOverrideSettings() }
    displaySafetyAndCookieModal();
}

function devOverrideSettings() {
    document.getElementById("gamename_menu").innerHTML = "dev" + game.picolito_version.toUpperCase();
    // if (getCookie("player_list").length == 0) { DEBUG_RandomPlayer(4) }
    displayPage("menu")
    global.remind_warning_panel = false;

    // setTimeout(function() {
    //     updateSelectedMixGamemode( { gamemode_type: "picolo", bdd_id: "picolo_default_fr", bdd_source: "vanilla" } );
    //     updateSelectedMixGamemode( { gamemode_type: "picolo", bdd_id: "picolo_silly_fr", bdd_source: "vanilla" } );
    // }, 250);
    // setTimeout(function() {
    //     selectMixGamemode()
    // }, 500)

    // selectGame (
    //     {
    //         gamemode_type: "picolo",
    //         bdd_data: [ 
    //             {
    //                 bdd_id: "picolo_default_fr",
    //                 bdd_source: "vanilla"
    //             }
    //         ]
    //     }
    // )
    
    // document.getElementById("bootstrap-overlay").href = "./src/css/barium.css"
    // selectGame("weakest_link")
}

function defaultVariables() {
    global = {
        current_language: "fr",
        debug: false,
        dark_mode: "bright",
        cookie_expiration_delay: 15,
        audio : {
            weakest_link_amb_60: undefined,
            weakest_link_amb_end: undefined
        },
        audio_enabled: true,
        cookie_settings_value : [],

        modal_player_menu: new bootstrap.Modal(document.getElementById('modal_modal_player_menu')),
        modal_sentence_modifier: new bootstrap.Modal(document.getElementById('modal_sentence_modifier')),
        modal_safety_and_cookie_modal: new bootstrap.Modal(document.getElementById('modal_safety_and_cookie_modal')),
        modal_sentence_list: new bootstrap.Modal(document.getElementById('modal_sentence_list')),
        modal_external_db: new bootstrap.Modal(document.getElementById('modal_external_db'))
    }

    game = {
        picolito_version: "0.36.0",
        vanilla_db_index: [
            // Picolo
            {   
                "gamemode":"picolo",
                "id":"picolo_default_fr",
                "pack_name": "Before - 🥴",
                "pack_description": "Le mode de jeu parfait pour s'ambiancer en soirées.\nSoyez prêts, car Picolito ne vous fera pas de cadeaux.",
                "url":"./src/db/picolo/picolo_default_fr.json",
                "language":"fr"
            },
            {   
                "gamemode":"picolo",
                "id":"picolo_default_en",
                "pack_name": "Getting Started - 🥴",
                "pack_description": "The perfect way to start the party and add some fun to your night.\nGet ready, picolo shows no mercy.",
                "url":"./src/db/picolo/picolo_default_en.json",
                "language":"en"
            },
            {   
                "gamemode":"picolo",
                "id":"picolo_silly_fr",
                "pack_name": "On est débiles - 🤪",
                "pack_description": "Si vous êtes déjà bien entamés et cons comme vos pieds, ce pack est fait pour vous.\nAttention, public averti.",
                "url":"./src/db/picolo/picolo_silly_fr.json",
                "language":"fr"
            },
            {   
                "gamemode":"picolo",
                "id":"picolo_silly_en",
                "pack_name": "Getting Crazy - 🤪",
                "pack_description": "If you want the night to get even more ridiculous, this game is for you.\nHope you've got a decent buzz going.",
                "url":"./src/db/picolo/picolo_silly_en.json",
                "language":"en"
            },
            {   
                "gamemode":"picolo",
                "id":"picolo_bar_fr",
                "pack_name": "Bar - 🍻",
                "pack_description": "Si vous êtes prêt à retourner le bar, c'est le mode de jeu parfait.\nAttention, il ne faut pas avoir peur du ridicule.",
                "url":"./src/db/picolo/picolo_bar_fr.json",
                "language":"fr"
            },
            {   
                "gamemode":"picolo",
                "id":"picolo_bar_en",
                "pack_name": "Bar - 🍻",
                "pack_description": "If you're ready to turn the bar upside down, this is the perfetect game.\nBe prepared to face ridicule.",
                "url":"./src/db/picolo/picolo_bar_en.json",
                "language":"en"
            },
            {   
                "gamemode":"picolo",
                "id":"picolo_hot_fr",
                "pack_name": "Caliente - 🍆",
                "pack_description": "Orienté questions coquines, soyez prêts à dévoiler vos secrets les mieux gardés.\nEst-ce que ça va pécho ce soir?",
                "url":"./src/db/picolo/picolo_hot_fr.json",
                "language":"fr"
            },
            {   
                "gamemode":"picolo",
                "id":"picolo_hot_en",
                "pack_name": "Caliente - 🍆",
                "pack_description": "Time to get a little naughty.\nBe prepare to reveal your best-kept secrets",
                "url":"./src/db/picolo/picolo_hot_en.json",
                "language":"en"
            },
            

            // Je N'ai Jamais
            {   
                "gamemode":"je_n_ai_jamais",
                "id":"je_n_ai_jamais_popular_fr",
                "pack_name": "Populaire - ⭐",
                "url":"./src/db/je_n_ai_jamais/popular_fr.json",
                "language":"fr"
            },
            {   
                "gamemode":"je_n_ai_jamais",
                "id":"je_n_ai_jamais_popular_en",
                "pack_name": "Popular - ⭐",
                "url":"./src/db/je_n_ai_jamais/popular_en.json",
                "language":"en"
            },
            {   
                "gamemode":"je_n_ai_jamais",
                "id":"je_n_ai_jamais_party_fr",
                "pack_name": "Fête - 🎉",
                "url":"./src/db/je_n_ai_jamais/party_fr.json",
                "language":"fr"
            },
            {   
                "gamemode":"je_n_ai_jamais",
                "id":"je_n_ai_jamais_party_en",
                "pack_name": "Party - 🎉",
                "url":"./src/db/je_n_ai_jamais/party_en.json",
                "language":"en"
            },
            {   
                "gamemode":"je_n_ai_jamais",
                "id":"je_n_ai_jamais_hot_fr",
                "pack_name": "Coquin & Sexy - 💋",
                "url":"./src/db/je_n_ai_jamais/hot_fr.json",
                "language":"fr"
            },
            {   
                "gamemode":"je_n_ai_jamais",
                "id":"je_n_ai_jamais_hot_en",
                "pack_name": "Dirty & Sex - 💋",
                "url":"./src/db/je_n_ai_jamais/hot_en.json",
                "language":"en"
            },

            // Maillon Faible
            {   
                "gamemode":"maillon_faible",
                "id":"maillon_faible_fr",
                "pack_name": "Le Maillon Faible",
                "url":"./src/db/questions/maillon_faible/maillon_faible.json",
                "language":"fr"
            }
        ],
        
        pending_db: [],

        mix_gamemode_list_picolo: [],

        player_list: [],
        max_player_number: -1,

        team_1: "EQUIPE# 1",
        team_2: "EQUIPE# 2",

        sip: {
            min: 1,
            max: 3
        },
        started: false,
        cycle_id: -1,
        gamemode: "picolo_default",
        gamemode_type: "text",
        display_color_indicator: true,
        quotes_indicator: "underline",   //none, italic, underline, highlight, white_on_black, black_on_white
        animation: true,

        only_display_current_language_databases: true,

        sentence_history: [],   //sentence_history_item = { sentence,key,type,nature }
        max_sentence_amount: 50,

        picolito : {
            chug_enabled: true,
            chug_amount: 1,
            chug_minimum_cycle_start: 20, // chug start to appear after sentence_id X

            virus_enabled: true,
            virus_remaining: 1, // virus can occur X times, can overlap
            virus_end_min: 2,   // virus can end after X more sentence_id minimum
            virus_end_max: 4,   // virus can end after X more sentence_id maximum
            virus_sentence_id_start_min: 10, // virus start to appear after sentence_id X
    
            social_posting_enabled: false,

            color_probability: {
                blue: 70,
                red: 5,
                green: 20,
                yellow: 5
            },

            // can_alter_player_name_in_sentence: true,
            // can_alter_sip_in_sentence: true,
        },
        weakest_link: {
            stop_at_max_chain: true, 
            max_chain: 6,
            tie_behaviour: "weakest", //strongest_link, arbitrary, both, weakest
            current_player_index: 0,
            chain: 0,
            bank: 0,
            time: 60
        }
    }
    updateHTMLSettingsByVar()
}

function testNewFilters() {
    var filter_old = {
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
        }
    };

    var filter_new = []
    var colors = ["blue", "red", "yellow", "green"]

    for (var i = 1; i<26; i++ ) {
        var color = undefined;
        for (var j in colors) {
            if (type_by_color[colors[j]].includes(i)) {
                color = colors[j]
            }
        }

        // social_posting == 15
        
        filter_new.push({"type": i, "color": color })
    }

    console.log(filter_new)
}

function resetVariables() {
    game.db = {};

    game.cycle_id = -1;
    game.picolito.virus_remaining = 1;
    game.picolito.chug_remaining = game.picolito.chug_amount;
    game.database = undefined;
    game.pending_db = [];

    game.sentence_history = [];

    game_cycle_count.innerHTML = "-";
}

function updateHTMLSettingsByVar() {
    game.picolito.chug_remaining = game.picolito.chug_amount;

    document.getElementById("input_chug_enabled").checked = game.picolito.chug_enabled;
    document.getElementById("input_virus_enabled").checked = game.picolito.virus_enabled;
    document.getElementById("input_social_posting_enabled").checked = game.picolito.social_posting_enabled;

    changeSipSettings('min', game.sip.min);
    changeSipSettings('max', game.sip.max);
    input_potential_chug = game.picolito.chug_amount;

    changeClearInformationSettings(game.display_color_indicator);
    
    document.getElementById("input_quotes_visualization").value = game.quotes_indicator;
    changeQuotesVisualization(game.quotes_indicator);

    document.getElementById("input_color_display_animation").checked = game.animation;

    document.getElementById("input_dark_mode_settings").value = global.dark_mode;
    changeDarkModeSettings(global.dark_mode);

    input_weakest_link_tie.value = game.weakest_link.tie_behaviour;

    if (game.weakest_link.stop_at_max_chain == false) {
        input_weakest_link_max_chain.value = "none";
    } else {
        input_weakest_link_max_chain.value = game.weakest_link.max_chain;
    }
    input_weakest_link_soundtrack.checked = global.audio_enabled;
    
    picolito_version_safety.innerHTML = `Picolito ${game.picolito_version}`;
    picolito_version_menu.innerHTML = `Picolito ${game.picolito_version}`;

    document.getElementById("input_show_only_current_language_db").checked = input_show_only_current_language_db;

    // Input ajout fichier bases de données
    const input = document.getElementById("external_db_file_input");
        input.addEventListener("change", () => {
            if (input.files && input.files[0]) {
                addDBData({ file: input.files[0] });
            }
        }
    );

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

function changeSipSettings(setting, value) {
    // Prévention pour ne pas avoir de paramètres avec des minimum plus grand que maximum
    var value = parseInt(value)
    const slider_min = document.getElementById("slider_sip_min");
    const slider_sip_min_value = document.getElementById("slider_sip_min_value");

    const slider_max = document.getElementById("slider_sip_max");
    const slider_sip_max_value = document.getElementById("slider_sip_max_value");

    function updateMinValue(min_value) {
        game.sip.min = min_value;

        slider_min.value = game.sip.min;
        slider_sip_min_value.innerHTML = min_value;
    }

    function updateMaxValue(max_value) {
        game.sip.max = max_value;

        slider_max.value = game.sip.max;
        slider_sip_max_value.innerHTML = max_value;
    }

    if (setting == "min") {
        updateMinValue(value)
        if (value > game.sip.max) {
            updateMaxValue(value)
        }
    } else if (setting == "max") {
        updateMaxValue(value)
        if (value < game.sip.min) {
            updateMinValue(value)
        }
    }
}

function changeDownDrinking(value) {
    game.picolito.chug_amount = parseInt(value);
    game.picolito.chug_remaining = parseInt(value);
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
        hopper(game.type_by_color, "picolo_red");
    }
    if (game.picolito.virus_enabled == false) {
        //delete and share yellow probability into others colors
        hopper(game.type_by_color, "picolo_yellow");
    }
}

function replaceAt(string, index, replace, length) {
    if (typeof string !== "string") return "";

    // length doit être un nombre
    length = Number(length) || 0;

    return (
        string.substring(0, index) +
        replace +
        string.substring(index + length)
    );
}


function displayPage(page) {
    var pages = ["menu", "picolito", "weakest_link"]

    for (let i in pages) {
        document.getElementById(pages[i]).classList.add("d-none");
    }
    document.getElementById(page).classList.remove("d-none");
}

function addPlayer(player_name) {
    if (player_name == "" || player_name == undefined) {
        return;
    }
    // DEV MODE
    if (menu_player_input.value.toLowerCase() == "lyoko") {
        menu_player_input.value = "";
        global.modal_player_menu.hide()

        DEBUG_carthage(true);
        return;
    }
    if (menu_player_input.value.toLowerCase() == "terre") {
        menu_player_input.value = "";
        global.modal_player_menu.hide()

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
        const newName = prompt(global.current_language_strings.enter_player_name, player.player_name);
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
        const newName = prompt(global.current_language_strings.enter_player_name, old_name);
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
    document.getElementById("picolito").className = "page dark_affected " + value;
}

function initPicolo() {
    // Cherche la première instance de bdd_data car nous savons que nous n'utilisons qu'un seul mode
    // Plusieurs sera avec initMix
    const bdd_id = game.current_gamemode.bdd_data[0].bdd_id
    const bdd_source = game.current_gamemode.bdd_data[0].bdd_source
    
    testStoredDatabase({bdd_id: bdd_id, source: bdd_source})

    getMinPlayer()
    displayPage('picolito');

    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", false);
}

function initJeNaiJamais() {
    // Cherche la première instance de bdd_data car nous savons que nous n'utilisons qu'un seul mode
    // Plusieurs sera avec initMix
    const bdd_id = game.current_gamemode.bdd_data[0].bdd_id
    const bdd_source = game.current_gamemode.bdd_data[0].bdd_source
    
    testStoredDatabase({bdd_id: bdd_id, source: bdd_source})

    displayPage('picolito');

    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", false);
}

function initMix() {
    // A CONCATENER game.mix_gamemode_list_picolo et je_n_ai_jamais
    console.log("gamemode_mix", game.mix_gamemode_list_picolo)
    for (var i in game.mix_gamemode_list_picolo) {
        testStoredDatabase({bdd_id: game.mix_gamemode_list_picolo[i].bdd_id, source: game.mix_gamemode_list_picolo[i].bdd_source})       
    }

    getMinPlayer()
    displayPage('picolito');
    
    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", true);
}

function listStoredDatabase() {
    const local_storage_keys = JSON.parse(localStorage.getItem("db:index:external"))

    for (let i = 0; i < local_storage_keys.length; i++) {
        console.log(local_storage_keys[i])
    }
}

async function testStoredDatabase({ bdd_id = null, lang = null, source = "vanilla" }) {
    try {
        const storedKey = `${source}:${bdd_id}`;
        let storedData = localStorage.getItem(storedKey);

        // Si la base n'existe pas dans le localStorage → on la télécharge
        if (!storedData) {
            const dbIndex =
                source === "vanilla"
                    ? DBManager.indexes.vanilla.find(db => db.id === bdd_id)
                    : DBManager.indexes.external.find(db => db.id === bdd_id);

            console.log(`${source}:${bdd_id}`)
            
            if (!dbIndex) {
                throw new Error(`Aucune base trouvée avec l'id "${storedKey}" dans les indexes.`);
            }

            await DBManager.download(dbIndex); // Attend le téléchargement
            refreshDBList();

            // On relit le localStorage après téléchargement
            storedData = localStorage.getItem(storedKey);
        }

        // Si la base est disponible dans le localStorage → on la charge dans pending_db
        if (storedData) {
            const db = JSON.parse(storedData);
            game.pending_db = game.pending_db.concat(db);
            console.log(`Base "${db.pack_name}" (${bdd_id}) chargée depuis le localStorage.`);
        }
    } catch (error) {
        if (error instanceof TypeError) {
            console.warn("Erreur de type :", error.message);
        } else {
            throw error;
        }
    }
}

function startGame() {

    game.started = true;

    manageNavDisplay("navigation_arrows", true);

    displayIngameOptionPanel(false);
    manageIngameOptionDisplay({option: "start", display: false});

    //Copie des données de game.pending_db vers game.current_gamemode.bdd_data
    game.current_gamemode.bdd_data = [];
    game.current_gamemode.bdd_data.push(...game.pending_db.map(e => ({...e})));

    // Conversion vers TAFFY
    const bdd = game.current_gamemode.bdd_data;
    for (let i in bdd) {
        bdd[i].db = TAFFY(bdd[i].db);
        console.log(bdd[i])
    }

    // Affichages des infos BDD dans la ingame_bottombar
    createIngameDatabaseIndicator()

    // Longueur maximale possible
    game.current_gamemode.database_length = calcCombineDatabasesPossibleLenght();

    incrementCycleID();
}

function exitGame() {
    if (game.gamemode == "weakest_link") {
        stopsound("weakest_link_amb_60")

        // parce qu'il ne comprend pas que le timer puisse ne pas exister mais aussi "ne pas exister"...
        if (weakestLinkTimer != undefined || typeof weakestLinkTimer != "undefined") { clearInterval(weakestLinkTimer) }
    }

    setBackgroundStyleColor("black");
    document.getElementById("text_ingame_title").style.display = "none";
    document.getElementById("text_ingame_title").innerHTML = "";

    displaySentence("", undefined); // reset HTML sentence display

    // Affichages des infos BDD dans la ingame_bottombar
    document.getElementById("ingame_bdd_infos").innerHTML = "";

    updateGameCycleIndicator(); // reset cycle count
    resetVariables();
    game.pending_db = [];
    game.current_gamemode = {};

    picolitoNavigationButtonsDisplay("previous", false)
    picolitoNavigationButtonsDisplay("game_cyle", false)
    picolitoNavigationButtonsDisplay("next", false)

    displayIngameOptionPanel(false)
    manageIngameOptionDisplay({option: "start", display: false});
    manageIngameOptionDisplay({option: "replay", display: false});

    manageNavDisplay("navigation_arrows", true);
    manageNavDisplay("players", true);
    manageNavDisplay("restart",false);

    displayPage('menu');

    game.mix_gamemode_list_picolo = [];
    document.getElementById("button_update_mix_gamemode_list").disabled = true;
    document.getElementById("gamemode_mix_picolo").querySelectorAll("input[type=checkbox]").forEach(checkbox => checkbox.checked = false);
    document.getElementById("gamemode_mix_je_n_ai_jamais").querySelectorAll("input[type=checkbox]").forEach(checkbox => checkbox.checked = false);

    game.started = false;
}

function calcCombineDatabasesPossibleLenght() {
    const bdd_data = game.current_gamemode.bdd_data
    let length = 0;

    for (let i in bdd_data) { length += bdd_data[i].db().count(); }
    
    console.warn(`Cette fonction retourne bêtement la longueur de toutes les bases séléctionnées. (${length}) (à prévoire de prendre en compte les limite de certains types ex: virus, cul sec, suites de phrases)`);
    return length;
}

function createIngameDatabaseIndicator() {
    const bdd_data = game.current_gamemode.bdd_data;
    const bdd_infos_html = document.getElementById("ingame_bdd_infos");

    console.log(bdd_data)

    bdd_infos_html.innerHTML = "";
    for (let i in bdd_data) {
        const bdd = bdd_data[i];
        var function_used = "";

        if (bdd.gamemode == "picolito") {function_used = "generatePicoloSentences"}
        if (bdd.gamemode == "je_n_ai_jamais") {function_used = "generateJeNaiJamaisSentences"}

        bdd_infos_html.innerHTML += `<span class="badge bg-dark" id="ingame_bdd_infos_bdd_${bdd.id}" onclick="${function_used}('${bdd.id}')">${bdd.pack_name}</span>`;
    }
}

function selectIngameDatabaseIndicator(bdd_id) {
    const bdd_data = game.current_gamemode.bdd_data;
    for (let i in bdd_data) {
        const bdd = bdd_data[i];
        const element = document.getElementById(`ingame_bdd_infos_bdd_${bdd.id}`);
        if (bdd.id == bdd_id) {
            element.classList.add("border");
        } else {
            element.classList.remove("border");
        }
    }
}

function restartGame() {
    exitGame();
    selectGame(
        {
            gamemode_type : game.current_gamemode.gamemode_type,
            bdd_data : game.current_gamemode.bdd_data,
            restart : true
        }
    );
}

function selectGame({gamemode_type, bdd_data=[], restart=false}) {
    // Appelé depuis le menu avec selectGame({ gamemode_type:gamemode_type, bdd_data: [ {bdd_id:bdd_id, bdd_source:bdd_source}] })
    game.current_gamemode = {
        gamemode_type: gamemode_type,
        bdd_data: [bdd_data],
        restart: restart
    };
    
    switch (gamemode_type) {
        case "picolo": initPicolo(); break;
        case "je_n_ai_jamais": initJeNaiJamais(); break;
        case "mix": initMix(); break;
        case "weakest_link":
            if (game.player_list.length >= 2) {
                initWeakestLink();
            } else {
                alert(global.current_language_strings.weakest_link_minimum_player_requierement)
                return;
            }
            break;
    }

    if (restart == true) {
        startGame();
    }

    // if (game.gamemode == "war") {
    //     if (game.player_list.length >= 2) {
    //         updateTeamSelectionTable();
    //     }
    // }
}

function selectMixGamemode() {
    // initMix();
    selectGame({gamemode_type:"mix"})
    return;
}

function updateSelectedMixGamemode(element) {
    console.log(element)
    
    // ajout d'element dans game.mix_gamemode_list_picolo ou suppression en fonction de la checkbox (checked)
    if (element.checked == true) {
        game.mix_gamemode_list_picolo.push({ bdd_id: element.bdd_id, bdd_source: element.bdd_source });
        console.log(`Ajout de ${element.bdd_id} (${element.gamemode_type}) dans ${game.mix_gamemode_list_picolo}`)
    } else {
        let index = game.mix_gamemode_list_picolo.findIndex(e => e.bdd_id === element.bdd_id);
        game.mix_gamemode_list_picolo.splice(index, 1);
        console.log(`Suppression de ${element.bdd_id} (${element.gamemode_type}) dans ${game.mix_gamemode_list_picolo}`)
    }

    // ajout d'element dans game.mix_gamemode_list_picolo ou rien s'il est déjà présent


    // if (element.gamemode_type == "picolo") {
    //     console.log(element.bdd_id, element.gamemode_type + " dans " + game.mix_gamemode_list_picolo)
        
    //     // ajout d'element dans game.mix_gamemode_list_picolo ou rien s'il est déjà présent
    //     var index = game.mix_gamemode_list_picolo.findIndex(e => e.bdd_id === element.bdd_id);
    //     if (index === -1) {
    //         game.mix_gamemode_list_picolo.push({ bdd_id: element.bdd_id, bdd_source: element.bdd_source });
    //     } else {
    //         game.mix_gamemode_list_picolo.splice(index, 1);
    //     }
    // }
    // if (element.gamemode_type == "je_n_ai_jamais") {        
    //     // ajout d'element dans game.mix_gamemode_list_je_n_ai_jamais ou rien s'il est déjà présent
    //     var index = game.mix_gamemode_list_je_n_ai_jamais.findIndex(e => e.bdd_id === element.bdd_id);
    //     if (index === -1) {
    //         game.mix_gamemode_list_je_n_ai_jamais.push({ bdd_id: element.bdd_id, bdd_source: element.bdd_source });
    //     } else {
    //         game.mix_gamemode_list_je_n_ai_jamais.splice(index, 1);
    //     }
    // }

    console.log("mix_gamemode_list_picolo", game.mix_gamemode_list_picolo)

    if (game.mix_gamemode_list_picolo.length > 0) {
        document.getElementById("button_update_mix_gamemode_list").disabled = false;
    } else {
        document.getElementById("button_update_mix_gamemode_list").disabled = true;
    }
}

function picolitoNavigationButtonsDisplay(button, display=false) {
    switch (button) {
        case "previous" : var selected_button = document.getElementById("game_cycle_previous_button"); break;
        case "next" : var selected_button = document.getElementById("game_cycle_next_button"); break;
        case "game_cyle" : var selected_button = document.getElementById("game_cycle_count"); break;
        default : break;
    }

    if (display == true) {
        selected_button.disabled = false;
    } else if (display == false) {
        selected_button.disabled = true;
    }
}

function displayIngameOptionPanel(value) {
    const panel = document.getElementById("ingame_option")
    if (value == true) {
        panel.style.display = "flex";
    } else {
        panel.style.display = "none";
    }
}

function manageIngameOptionDisplay({ option = null, display = false }) {    
    switch (option) {
        case "start" : var selected_option = document.getElementById("start_ingame_option"); break;
        case "replay" : var selected_option = document.getElementById("replay_ingame_option"); break;
        default: break;
    }

    if (display == true) {
        selected_option.style.display = "block";
    } else {
        selected_option.style.display = "none";
    }
}

function manageNavDisplay(navigation_option=null, display=false) {
    switch(navigation_option) {
        case "navigation_arrows": var selected_navigation_option = document.getElementById("navigation_arrows"); break;
        case "players": var selected_navigation_option = document.getElementById("text_game_player_menu"); break;
        case "quit": var selected_navigation_option = document.getElementById("text_game_quit_topbar"); break;
        case "restart": var selected_navigation_option = document.getElementById("text_game_restart_topbar"); break;
        default: break;
    }

    if (display == true) {
        selected_navigation_option.style.display = "inline-flex";
        selected_navigation_option.style.justifycontent = "center";
    } else {
        selected_navigation_option.style.display = "none";
    }
}

function updateGameCycleIndicator() {
    const database_length = game.current_gamemode.database_length;

    if (database_length < game.max_sentence_amount) {
        var max_sentences = database_length;
    } else {
        var max_sentences = game.max_sentence_amount;
    }
    //previous
    if (game.cycle_id > 0) {
        picolitoNavigationButtonsDisplay("previous", true);
    } else {
        picolitoNavigationButtonsDisplay("previous", false);
    }
    //game count
    if (game.cycle_id >= 0) {
        picolitoNavigationButtonsDisplay("game_cyle", true)
        if (game.cycle_id >= max_sentences) {
            document.getElementById("game_cycle_count").innerHTML = global.current_language_strings.end;
        } else {
            document.getElementById("game_cycle_count").innerHTML = (game.cycle_id + 1) + "/" + max_sentences;
        }
    } else {
        picolitoNavigationButtonsDisplay("game_cyle", false)
        document.getElementById("game_cycle_count").innerHTML = "-";
    }
    //next
    if (game.cycle_id < max_sentences && game.cycle_id >= 0) {
        picolitoNavigationButtonsDisplay("next", true);
    } else {
        picolitoNavigationButtonsDisplay("next", false);
    }
    //start
    if (game.cycle_id < 0) {
        displayIngameOptionPanel(true)
        manageIngameOptionDisplay({option: "start", display: true});
    } else {
        displayIngameOptionPanel(false)
        manageIngameOptionDisplay({option: "start", display: false});
    }
    // retry
    if (game.cycle_id >= max_sentences) {
        displayIngameOptionPanel(true)
        manageIngameOptionDisplay({option: "replay", display: true});
    } else {
        displayIngameOptionPanel(false)
        manageIngameOptionDisplay({option: "replay", display: false});

    }
}

function addHistoryItem({
    posOffset=undefined,
    database_id=undefined,
    original_sentence=undefined,
    sentence_keys=undefined,
    formatted_sentence=undefined,
    key=undefined,
    type=undefined,
    color=undefined,
    pack_name=undefined,
}
) {
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
    let formatted_sentence = text;
    var is_modified = false;

    // Variables des balises "indicateurs"
    let html_span_sip_class = "";
    let html_span_player_class = "";
    let html_span_team_class = "";

    if (game.display_color_indicator == true) {
        html_span_sip_class = "span_highlight span_sip";
        html_span_player_class = "span_highlight span_player";
        html_span_team_class = "span_highlight span_team";
    }

    // retrieve all player names
    let player_name_list = game.player_list.map(player => player.player_name);

    function formatSentence(
            template,
            player_name_list,
            teams,
            quotesIndicator
        ) {
        const keys = [];
        let formatted = template;

        // Copie pour éviter de modifier l'original
        const availablePlayers = [...player_name_list];

        if (formatted == undefined) {
            console.error("La phrase n'est pas définie. (formatted)")
            return;
        }

        // 1️⃣ Remplacement des tokens dynamiques avec suivi des clés
        formatted = formatted.replace(/%s|\$|%t/g, token => {
            let value; // valeur brute
            let html;  // valeur HTML injectée

            switch (token) {
                case '%s': {
                    // Sélection aléatoire d'un joueur et suppression de la liste
                    const index = Math.floor(Math.random() * availablePlayers.length);
                    value = availablePlayers.splice(index, 1)[0] ?? '[joueur]';
                    html = `<span class='test ${html_span_player_class}'>${value}</span>`;

                    // Enregistrement pour modification ultérieure 
                    keys.push({ type: 'player', value });
                    is_modified = true;
                    return html;
                }

                case '$': {
                    value = randomSip();
                    html = `<span class='${html_span_sip_class}'>${value}</span>`;
                    keys.push({ type: 'sip', value });
                    is_modified = true;
                    return html;
                }

                case '%t': {
                    value = Math.random() < 0.5 ? teams.team_1 : teams.team_2;
                    html = `<span class='${html_span_team_class}'>${value}</span>`;
                    keys.push({ type: 'team', value });
                    is_modified = true;
                    return html;
                }

                default:
                    return token;
            }
        });

        // 2️⃣ Gestion des guillemets
        const quoteStyles = {
            italic: 'fst-italic',
            underline: 'text-decoration-underline',
            highlight: 'bg-yellow text-black',
            white_on_black: 'bg-black text-light',
            black_on_white: 'bg-light text-black'
        };

        if (quotesIndicator !== 'none' && quoteStyles[quotesIndicator]) {
            formatted = formatted.replace(
            /"([^"]+)"/g,
            `<span class="quotes_highlight ${quoteStyles[quotesIndicator]}">$1</span>`
            );
        }

        return {
            formatted_sentence: formatted,
            keys
        };
    }
    
    // switch(game.quotes_indicator) {
    //     case "none" :
    //     break;
    //     case "italic" :
    //         formatted_sentence = formatted_sentence.replace(/"([^"]+)"/g, '<span class="quotes_highlight fst-italic">$1</span>');
    //     break;
    //     case "underline" :
    //         formatted_sentence = formatted_sentence.replace(/"([^"]+)"/g, '<span class="quotes_highlight text-decoration-underline">$1</span>');
    //     break;
    //     case "highlight" :
    //         formatted_sentence = formatted_sentence.replace(/"([^"]+)"/g, '<span class="quotes_highlight bg-yellow text-black">$1</span>');
    //     break;
    //     case "white_on_black" :
    //         formatted_sentence = formatted_sentence.replace(/"([^"]+)"/g, '<span class="quotes_highlight bg-black text-light">$1</span>');
    //     break;
    //     case "black_on_white" :
    //         formatted_sentence = formatted_sentence.replace(/"([^"]+)"/g, '<span class="quotes_highlight bg-light text-black">$1</span>');
    //     break;
    // }


    // for (var i = 0; i < formatted_sentence.length; i++) {
    //     if (formatted_sentence.charAt(i) == "$") {
    //         const sip = randomSip();
    //         formatted_sentence = replaceAt(formatted_sentence, i, html_span_sip + sip + html_span_end, 0);
    //         keys.push({ type: 'sip', value: sip });
    //         is_modified = true;
    //     }
    //     // change %s by random player
    //     if (formatted_sentence.charAt(i) == "%" && formatted_sentence.charAt(i + 1) == "s") {
    //         var random_player_index = Math.floor(Math.random() * player_name_list.length);
    //         var random_player = player_name_list[random_player_index];
    //         player_name_list.splice(random_player_index, 1);
    //         formatted_sentence = replaceAt(formatted_sentence, i, html_span_player + random_player + html_span_end, 1);
    //         keys.push({ type: 'player', value: random_player });
    //         is_modified = true;
    //     }
    //     // change %t by team
    //     if (formatted_sentence.charAt(i) == "%" && formatted_sentence.charAt(i + 1) == "t") {
    //         const team = Math.random() < 0.5 ? game.team_1 : game.team_2;
    //         formatted_sentence = replaceAt(formatted_sentence, i, html_span_team + team + html_span_end, 1);
    //         keys.push({ type: 'team', value: team });
    //         is_modified = true;
    //     }
    // }
    
    const result = formatSentence(
        formatted_sentence,
        player_name_list,
        { team_1: 'TEAM1', team_2: 'TEAM2' },
        game.quotes_indicator
    );

    return {
        original_sentence: original_sentence,
        keys: result.keys,
        formatted_sentence: result.formatted_sentence,
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

function changeClearInformationSettings(value) {
    game.display_color_indicator = value;
    document.getElementById("input_color_display_settings").checked = value;

    settingsTextPreview()
}

function changeQuotesVisualization(value) {
    game.quotes_indicator = value;

    settingsTextPreview()
}

function settingsTextPreview() {
    const text = `Qu'elles sont "jolies" les $ petites fleurs de %s`;
    const formatted_text = textReplacer(text).formatted_sentence
    document.getElementById("text_settings_quotes_visualization_playground").innerHTML = formatted_text;
}

function displaySentenceList() {
    global.modal_sentence_list.show();
    modal_sentence_list_content.innerHTML = "";

    var html_element = "";
    for (var i = 0; i < game.sentence_history.length; i++) {
        var color = game.sentence_history[i].color;
        var sentence = game.sentence_history[i].formatted_sentence;

        if (sentence == "none") { break; }

        html_element += `
            <tr onclick="goToSpecificSentence(${i})" tabindex="0">
                <th scope="row" >${i + 1}</th>
                <td class="sentence-list-item sentence-list-${color}">${sentence}</td>
            </tr>
        `;
    }
    modal_sentence_list_content.innerHTML = html_element;
}

function displaySipModifierModal() {
    global.modal_sentence_modifier.show();
    document.getElementById("modal_sentence_modifier_sentence").innerHTML = game.sentence_history[game.cycle_id].formatted_sentence;
}

function displayweakestLinkDisplayVote() {
    displayPage("weakest_link_vote")
}

window.addEventListener("keydown", function(event) {
    if (game.started == true) {
        switch (event.key) {
            case "ArrowLeft":
                decrementCycleID();
                break;
            case "ArrowRight":
                incrementCycleID();
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
                // global.audio.weakest_link_amb_60.currentTime = 0;
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

function DEBUG_carthage(debug) {
    if (debug == true) {
        game.debug = true;
        alert("Bienvenue à Carthage.");

        document.getElementById("gamename_menu").innerHTML = "CODE LYOKOLITO";
        // document.getElementById("debug_tools_placeholder").style.display = "block";
        document.getElementById("debug_button_add_player").classList.remove("d-none");
        document.getElementById("debug_button_quit_debug").classList.remove("d-none");

        document.getElementById("ingame_bdd_infos").classList.remove("d-none");
        
        // Section 
        document.getElementById("db_manager_modal_experimental_settings").classList.remove("d-none");
    } else {
        game.debug = false;
        alert("Retour vers le passé.");

        global.modal_player_menu.hide()

        document.getElementById("gamename_menu").innerHTML = "PICOLITO";
        // document.getElementById("debug_tools_placeholder").style.display = "none";
        document.getElementById("debug_button_add_player").classList.add("d-none");
        document.getElementById("debug_button_quit_debug").classList.add("d-none");

        document.getElementById("ingame_bdd_infos").classList.add("d-none");
        
        document.getElementById("db_manager_modal_experimental_settings").classList.add("d-none");
    }
}

// ===================== DBManager =====================
const DBManager = {
    indexes: {
        vanilla: [],
        external: []
    },

    loaded: [], // Bases chargées en mémoire (optionnel)

    // ---- Initialisation ----
    async init() {
        // Charger les index vanilla et externes
        this.indexes.vanilla = game.vanilla_db_index || [];
        this.indexes.external = JSON.parse(localStorage.getItem("db:index:external") || "[]");

        // Vérifier les URLs pour toutes les bases (en parallèle)
        const all = [
            ...this.indexes.vanilla.map(db => ({ ...db, source: "vanilla" })),
            ...this.indexes.external.map(db => ({ ...db, source: "external" }))
        ];

        const checked = await Promise.all(all.map(db => this.checkAvailability(db)));

        // Répartir les résultats dans les index (toujours toutes les bases)
        this.indexes.vanilla = checked.filter(d => d.source === "vanilla");
        this.indexes.external = checked.filter(d => d.source === "external");

        return checked;
    },

    // ---- Fusionner toutes les DB ----
    getAll() {
        if (game.only_display_current_language_databases) {
            return [
                ...this.indexes.vanilla.filter(db => db.language === global.current_language),
                ...this.indexes.external.filter(db => db.language === global.current_language)
            ].map(db => ({ ...db, source: db.source }));
        } else {
            return [
                ...this.indexes.vanilla,
                ...this.indexes.external
            ].map(db => ({ ...db, source: db.source }));
        }
    },

    // ---- Vérifier la disponibilité d'une base ----
    async checkAvailability(db) {
        if (!db.url) return { ...db, available: false };
        try {
            const res = await fetch(db.url, { method: "HEAD", cache: "no-store" });
            return { ...db, available: res.ok };
        } catch {
            return { ...db, available: false };
        }
    },

    // ---- Charger depuis localStorage ----
    loadLocal(db) {
        const key = db.source === "vanilla"
            ? `vanilla:${db.id}`
            : `external:${db.id}`; // modification ici

        const stored = localStorage.getItem(key);
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    },

    // ---- Télécharger une base ----
    async download(db) {
        const res = await fetch(db.url);
        if (!res.ok) throw new Error(`Impossible de télécharger ${db.id}`);
        let data = await res.json();

        const key = db.source === "vanilla"
            ? `vanilla:${db.id}`
            : `external:${db.id}`;

        // Ajout dans chaque ligne de l'id de la bdd et du mode de jeu
        for (let i in data.db) {
            let entry = data.db[i];
            entry.bdd_id = data.id;
            entry.gamemode_type = data.gamemode;
        }

        // Sauvegarder la base complète
        localStorage.setItem(key, JSON.stringify(data));

        // ➕ Mettre à jour l'index
        const indexData = {
            id: data.id,
            version: data.version,
            url: db.url,
            gamemode: data.gamemode,
            language: data.language,
            pack_name: data.pack_name,
            pack_description: data.pack_description,
            filters: data.filters,
            available: true,
            source: db.source
        };

        if (db.source === "vanilla") {
            const idx = this.indexes.vanilla.findIndex(e => e.id === db.id);
            if (idx !== -1) this.indexes.vanilla[idx] = indexData;
            else this.indexes.vanilla.push(indexData);
        } else {
            const idx = this.indexes.external.findIndex(e => e.id === db.id);
            if (idx !== -1) this.indexes.external[idx] = indexData;
            else this.indexes.external.push(indexData);
            localStorage.setItem("db:index:external", JSON.stringify(this.indexes.external));
        }

        return { data, version: data.version };
    },

    // ---- Rafraîchir une base ----
    async refresh(db) {
        const localData = this.loadLocal(db);
        if (!localData) {
            const result = await this.download(db);
            return { updated: true, from: "—", to: result.version };
        }

        const res = await fetch(db.url);
        if (!res.ok) throw new Error("Impossible d’accéder à la version distante.");
        const remoteData = await res.json();

        const key = db.source === "vanilla"
            ? `vanilla:${db.id}`
            : `external:${db.id}`;

        if (remoteData.version !== localData.version) {
            localStorage.setItem(key, JSON.stringify(remoteData));

            // ➕ Mettre à jour la version dans l’index
            if (db.source === "external") {
                const idx = this.indexes.external.findIndex(e => e.id === db.id);
                if (idx !== -1) {
                    this.indexes.external[idx].version = remoteData.version;
                    localStorage.setItem("db:index:external", JSON.stringify(this.indexes.external));
                }
            }

            return { updated: true, from: localData.version, to: remoteData.version };
        }

        return { updated: false, version: localData.version };
    },


    // ---- Supprimer du localStorage ----
    unload(db) {
        const key = db.source === "vanilla"
            ? `vanilla:${db.id}`
            : `external:${db.id}`;
        localStorage.removeItem(key);
    },

    // ---- Supprimer complètement une base externe ----
    forget(db) {
        this.unload(db);
        if (db.source === "external") {
            this.indexes.external = this.indexes.external.filter(e => e.id !== db.id);
            localStorage.setItem("db:index:external", JSON.stringify(this.indexes.external));
        }
    }
};

function onlyDisplayCurrentLanguageDB() {
    const input = document.getElementById("input_show_only_current_language_db")
    game.only_display_current_language_databases = input.checked
    refreshDBList()
}

async function refreshDBList() {
    console.log("refreshDBList appelé encore une fois ???")

    const modal_db_list = document.getElementById("modal_db_list");
    await DBManager.init();
    const allDBs = DBManager.getAll();
    
    const existingLis = new Map();
    for (const li of modal_db_list.children) {
        existingLis.set(li.id, li);
    }

    const currentIds = new Set();

    for (const db of allDBs) {
        const liId = `db-li-${db.source}-${db.id}`;
        currentIds.add(liId);

        let li = existingLis.get(liId);
        if (!li) {
            // Crée le li uniquement s'il n'existe pas
            li = document.createElement("li");
            li.id = liId;
            li.className = "list-group-item d-flex align-items-start";

            const header = document.createElement("div");
            header.className = "db-header d-flex w-100 justify-content-between flex-column mb-1";
            li.appendChild(header);

            const actions = document.createElement("div");
            actions.className = "btn-group";
            li.appendChild(actions);

            modal_db_list.appendChild(li);
        }

        // Mettre à jour le contenu (header + boutons)
        updateDBListItem(li, db);
    }

    // Met à jour les bontons des menus principaux
    updateGamemodeMenuButton(allDBs);

    // Met à jour la liste des bases de données déjà chargé dans l'explorateur
    databaseExplorerRefresh(allDBs);

    // Met à jour la liste des modes de jeu dans Mix
    updateMixGamemodeMenuList(allDBs);

    // Supprimer les <li> qui ne sont plus dans la liste filtrée
    for (const li of Array.from(modal_db_list.children)) {
        if (!currentIds.has(li.id)) li.remove();
    }
}

// Fonction pour mettre à jour le contenu d'un <li>
function updateDBListItem(li, db) {
    const local = DBManager.loadLocal(db);
    const localVersion = local?.version || "—";

    const header = li.querySelector(".db-header");
    const stateBadge = db.available ? `` : `<span class="badge bg-danger">indisponible</span>`;
    const packDescription = db.pack_description ? `<span>${db.pack_description}</span>` : "";
    const language = convertLangCodeToLanguage(db.language)
    header.innerHTML = `
        <div class="d-flex flex-column">
            <strong>${db.pack_name || db.id}</strong>
            ${packDescription}
        </div>
        <div>
            <span class="badge ${db.source === "vanilla" ? "bg-secondary" : "bg-info"}">${db.source}</span>
            <span class="badge bg-secondary">v${localVersion}</span>
            ${stateBadge}
            <span class="badge bg-secondary">${language}</span>
        </div>
    `;

    const actions = li.querySelector(".btn-group");
    actions.innerHTML = "";

    const actionBtn = document.createElement("button");
    actionBtn.className = `btn ${local ? "btn-outline-success" : "btn-success"} btn-action`;
    actionBtn.innerHTML = local
        ? `<i class="bi bi-arrow-clockwise"></i>`
        : `<i class="bi bi-cloud-arrow-down"></i>`;
    actionBtn.disabled = !db.available;
    actionBtn.onclick = async () => {
        try {
            if (!local) await DBManager.download(db);
            else await DBManager.refresh(db);
            refreshDBList();
        } catch (err) { alert(`❌ Erreur (${db.id}) : ${err.message}`); }
    };
    actions.appendChild(actionBtn);

    if (local) {
        const unloadBtn = document.createElement("button");
        unloadBtn.innerHTML = `<i class="bi bi-folder-x"></i>`;
        unloadBtn.className = "btn btn-secondary";
        unloadBtn.onclick = () => { DBManager.unload(db); refreshDBList(); };
        actions.appendChild(unloadBtn);
    }

    if (db.source === "external") {
        const forgetBtn = document.createElement("button");
        forgetBtn.className = "btn btn-dark";
        forgetBtn.innerHTML = `<i class="bi bi-x-circle"></i>`;
        forgetBtn.onclick = () => {
            if (confirm(`${global.current_language_strings.delete_definitive} ${db.id} ?`)) {
                DBManager.forget(db);
                refreshDBList();
            }
        };
        actions.appendChild(forgetBtn);
    }
}

function databaseExplorerRefresh(allDBs) {
    // Affiche dans le select les bases de données chargées en mémoire (localStorage) pour l'explorateur de base de données.    const select = document.getElementById("db_explorer_list_select");
    // La liste tri par gamemode puis par source, les gamemode sont séparés pas un optgroup
    
    const select = document.getElementById("db_explorer_list_select");
    select.innerHTML = "";

    // Filtrer les bases de données pour n'afficher que celles qui sont chargées en mémoire
    const loadedDBs = allDBs.filter(db => DBManager.loadLocal(db));

    var picolo_gamemode = [];
    var je_n_ai_jamais_gamemode = [];

    for (const db of loadedDBs) {
        if (db.gamemode == "picolo") {
            picolo_gamemode.push(
                {
                    id: db.id,
                    pack_name: db.pack_name,
                    db_source: db.source,
                    gamemode: db.gamemode
            });
        }
        if (db.gamemode == "je_n_ai_jamais") {
            je_n_ai_jamais_gamemode.push(
                {
                    id: db.id,
                    pack_name: db.pack_name,
                    db_source: db.source,
                    gamemode: db.gamemode
            });
        }
    }

    const default_unselected_option = document.createElement("option");
    default_unselected_option.text = global.current_language_strings.db_manager_select_db;
    select.appendChild(default_unselected_option);

    const optgroup_picolo = document.createElement("optgroup");
    optgroup_picolo.label = global.current_language_strings.picolo;
    select.appendChild(optgroup_picolo);
    for (const db of picolo_gamemode) {
        optgroup_picolo.appendChild(createOption(db));
    }

    const optgroup_je_n_ai_jamais = document.createElement("optgroup");
    optgroup_je_n_ai_jamais.label = global.current_language_strings.je_n_ai_jamais;
    select.appendChild(optgroup_je_n_ai_jamais);
    for (const db of je_n_ai_jamais_gamemode) {
        optgroup_je_n_ai_jamais.appendChild(createOption(db));
    }

    function createOption(db, gamemode) {
        const option = document.createElement("option");
        option.value = `${db.id}:${db.gamemode}`;
        option.text = db.pack_name;
        option.dataset.source = db.db_source;
        return option;
    }
}

function refreshExplorerList(db) {
    // Affichage des phrase de la base de données sélectionnée dans l'explorateur de base de données (db_source:db.id)
    const db_explorer_list_list = document.getElementById("db_explorer_list_list");
    db_explorer_list_list.innerHTML = "";

    const [db_id, gamemode] = db.split(":");

    const db_data = getDBFromLocalStorage(db_id);
    if (!db_data) {
        db_explorer_list_list.innerHTML = `<li class="list-group-item">Erreur lors du chargement de la base de données.</li>`;
        return;
    }
    if (db_data) {
        // Creation d'un entête pour la liste en fonction du gamemode
        // Picolo : type | text | key | parent_key
        // Je n'ai Jamais : text
        
        const table = document.createElement("table");
        table.className = "table table-striped";
        
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        if (gamemode == "picolo") {
            ["Type", "Texte", "Clé", "Clé parente"].forEach(columnName => {
                const th = document.createElement("th");
                th.textContent = columnName;
                headerRow.appendChild(th);
            });
        }
        if (gamemode == "je_n_ai_jamais") {
            ["Texte"].forEach(columnName => {
                const th = document.createElement("th");
                th.textContent = columnName;
                headerRow.appendChild(th);
            });
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);
        db_explorer_list_list.appendChild(table);

        // Affichage des phrases
        const tbody = document.createElement("tbody");
        for (const entry of db_data) {
            const row = document.createElement("tr");

            if (gamemode == "picolo") {
                const typeCell = document.createElement("td");
                typeCell.textContent = entry.type;
                row.appendChild(typeCell);
            }

            const textCell = document.createElement("td");
            textCell.textContent = entry.text;
            row.appendChild(textCell);
            
            if (gamemode == "picolo") {
                const keyCell = document.createElement("td");
                keyCell.textContent = entry.key || "";
                row.appendChild(keyCell);

                const parentKeyCell = document.createElement("td");
                parentKeyCell.textContent = entry.parent_key || "";
                row.appendChild(parentKeyCell);
            }
            
            tbody.appendChild(row);
        }

        table.appendChild(tbody);
        db_explorer_list_list.appendChild(table);
    }
}

function getDBFromLocalStorage(db_id) {
    const allDBs = DBManager.getAll();
    for (const db of allDBs) {
        if (db.id == db_id) {
            return DBManager.loadLocal(db).db;
        }
    }
    return null;
}

function updateGamemodeMenuButton(allDBs) {
    // allDBs provient de refreshDBList()

    const je_n_ai_jamais_list = document.getElementById("gamemode_je_n_ai_jamais_db_list")
    const picolo_list = document.getElementById("gamemode_picolo_db_list")

    // Rien d'affiché dans la liste
    je_n_ai_jamais_list.innerHTML = ""
    picolo_list.innerHTML = ""

    for (const db of allDBs) {
        const bdd_id = db.id;
        const gamemode_type = db.gamemode;
        const pack_name = db.pack_name;
        const pack_description = db.pack_description;
        const language = db.language;
        // const vanilla = db.vanilla;
        const bdd_source = db.source;

        const actionDiv = document.createElement("div");
        actionDiv.className = `col-12 col-sm-6 col-xl-4 col-xxl-3`;

        const actionBtn = document.createElement("button");
        actionBtn.className = `btn btn-primary gamemode_${gamemode_type}_section w-100 h-100`;
        const description = pack_description ? `<p>${pack_description}</p>` : ``;

        let addiontionnalData = ""
        if (bdd_source != "vanilla" || game.only_display_current_language_databases == false) {
            addiontionnalData = `<div class="d-flex justify-content-end">
                    <span class="badge bg-dark m-1">${language}</span>
                    <span class="badge bg-dark m-1">${bdd_source}</span>
                    <span class="badge bg-dark m-1">${gamemode_type}</span>
                </div>`;
        } else { addiontionnalData = ``; }

        actionBtn.innerHTML = `
            <div class="d-flex justify-content-between flex-column">
                <h4 id="text_gamemode_title_never_popular" 
                    class="fw-bold h4 text-center w-100">${pack_name}</h4>
                ${description}
                ${addiontionnalData}
            </div>`;
        actionBtn.onclick = function() {
            selectGame(
                {
                    gamemode_type:gamemode_type,
                    bdd_data:
                        {   
                            bdd_id:bdd_id,
                            bdd_source:bdd_source
                        }
                }
            )
        }

        actionDiv.appendChild(actionBtn);

        if (gamemode_type == "picolo") {
            picolo_list.appendChild(actionDiv);
        }

        if (gamemode_type == "je_n_ai_jamais") {
            je_n_ai_jamais_list.appendChild(actionDiv);
        }
    }
    return;
}

function updateMixGamemodeMenuList(allDBs) {
    // allDBs provient de refreshDBList()
    
    const picolo_list = document.getElementById("gamemode_mix_picolo")
    const je_n_ai_jamais_list = document.getElementById("gamemode_mix_je_n_ai_jamais")

    // Rien d'affiché dans la liste
    je_n_ai_jamais_list.innerHTML = ""
    picolo_list.innerHTML = ""

    for (const db of allDBs) {
        const bdd_id = db.id;
        const gamemode_type = db.gamemode;
        const pack_name = db.pack_name;
        // const pack_description = db.pack_description;
        const language = db.language;
        // const vanilla = db.vanilla;
        const bdd_source = db.source;

        const actionDiv = document.createElement("div");
        actionDiv.className = `form-check form-switch`;

        const repartitionDiv = document.createElement("div");
        repartitionDiv.className = `d-flex w-100 justify-content-between`;

        const additionnalDiv = document.createElement("div");
        actionDiv.className = `form-check form-switch`;
        
        let addiontionnalData = ""
        if (bdd_source != "vanilla" || game.only_display_current_language_databases == false) {
            addiontionnalData = `<div class="d-flex justify-content-end">
                    <span class="badge bg-dark m-1">${language}</span>
                    <span class="badge bg-dark m-1" title="${db.url}">externe</span>
                </div>`;
        } else { addiontionnalData = ``; }
        additionnalDiv.innerHTML = addiontionnalData;

        const actionLabel = document.createElement("label");
        actionLabel.className = `form-check-label`;
        actionLabel.setAttribute("for",`${bdd_id}-checkbox`);
        actionLabel.appendChild(document.createTextNode(pack_name));

        const actionInput = document.createElement("input");
        actionInput.className = `form-check-input`;
        actionInput.setAttribute("id",`${bdd_id}-checkbox`);
        actionInput.setAttribute("type","checkbox");

        actionInput.onclick = function() {
            updateSelectedMixGamemode(
                {
                    checked: actionInput.checked,
                    gamemode_type:gamemode_type,
                    bdd_id:bdd_id,
                    bdd_source:bdd_source
                }
            )
        }

        repartitionDiv.appendChild(actionLabel);
        repartitionDiv.appendChild(additionnalDiv);

        actionDiv.appendChild(actionInput);
        actionDiv.appendChild(repartitionDiv);

        if (gamemode_type == "picolo") {
            picolo_list.appendChild(actionDiv);
        }

        if (gamemode_type == "je_n_ai_jamais") {
            je_n_ai_jamais_list.appendChild(actionDiv);
        }
    }
    return;
}

function externalDBLinkFromtTextInput() {
    const input = document.getElementById('external_db_input');
    const value = input.value.trim();

    input.value = ''; // vide le champ input
    input.focus();

    if (value.toLowerCase() == "miiiranda") {
        DEBUG_miiiranda_db_bundle();
        return;
    }

    if (value !== '' && value.match(/\.json(\?.*)?$/i)) {
        console.log('Valeur entrée :', value);
        addDBData( { url: value, vanilla: false} ); // game.gamemode_type = "mix";
    
    }
}

function DEBUG_miiiranda_db_bundle() {
    async function loadUrlList() {
    const response = await fetch("https://gist.githubusercontent.com/difabiolorenzo/accab6224cbaf58a274f9497eeaed79e/raw/0fb82a051c13bfff5ebf658302ee4fa7e67a1657/gistfile1.txt");
    const text = await response.text();

    // Nettoyage + transformation en tableau
    const url_list = text
        .split(",")                // sépare par virgule
        .map(url => url.trim())   // enlève espaces + retours ligne
        .map(url => url.replace(/["']/g, "")) // enlève les guillemets
        .filter(url => url.length > 0); // enlève les lignes vides

        return url_list;
    }

    // utilisation
    loadUrlList().then(url_list => {
        addDBData( { urls: url_list} );
        global.modal_external_db.show()
    });
}

async function addDBData({ url = null, urls = null, file = null, vanilla = false }) {
    try {

        // Si on reçoit un tableau d'URLs
        if (urls && Array.isArray(urls)) {
            for (const singleUrl of urls) {
                await addDBData({ url: singleUrl, vanilla }); // appel récursif
            }
            return; // important pour ne pas continuer plus bas
        }

        let data;

        if (url) {
            // Chargement depuis URL
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP erreur ${response.status} (${url})`);
            data = await response.json();
            data.url = url;
        } else if (file) {
            // Chargement depuis fichier local
            const fileText = await file.text();
            data = JSON.parse(fileText);
            data.url = null;
        } else {
            throw new Error("Aucune source fournie (url, urls ou file).");
        }

        data.vanilla = vanilla;

        const indexData = {
            id: data.id,
            pack_name: data.pack_name,
            pack_description: data.pack_description,
            gamemode: data.gamemode,
            language: data.language,
            version: data.version,
            url: data.url,
            vanilla: false
        };

        const existingIndex = DBManager.indexes.external.findIndex(db => db.id === data.id);

        if (existingIndex !== -1) {
            const existingDB = DBManager.indexes.external[existingIndex];
            if (data.version > existingDB.version) {
                DBManager.indexes.external[existingIndex] = indexData;
                console.log(`Index mis à jour : ${data.id} (v${existingDB.version} → v${data.version})`);
            } else {
                console.log(`Index ignoré : ${data.id} (v${data.version} <= v${existingDB.version})`);
            }
        } else {
            DBManager.indexes.external.push(indexData);
            console.log(`Nouvel index ajouté : ${data.id} (v${data.version})`);
        }

        localStorage.setItem("db:index:external", JSON.stringify(DBManager.indexes.external));
        localStorage.setItem(`external:${data.id}`, JSON.stringify(data));

        refreshDBList();

    } catch (err) {
        console.error("Erreur lors du chargement de la base :", err);
        alert(`Erreur : ${err.message}`);
    }
}

function downloadCustomDBPicoloTamplate() {
    const template = {
        version: 1,
        gamemode: "picolo",
        id: "",
        language: "",
        pack_name: "",
        pack_description: "",
        db: [
            { text: "" }
        ]
    };
    downloadFileJSON(template, "template_picolo_bdd")
}

function downloadCustomDBNeverDoneTamplate() {
    const template = {
        version: 1,
        gamemode: "je_n_ai_jamais",
        id: "",
        language: "",
        pack_name: "",
        pack_description: "",
        db: [
            { text: "" }
        ]
    };

    downloadFileJSON(template, "template_je_n_ai_jamais_bdd")
}

function downloadFileJSON(object, filename) {
    const jsonStr = JSON.stringify(object, null, 4); // bien formatté
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Crée un lien temporaire pour déclencher le téléchargement
    const a = document.createElement("a");
    a.href = url;
    a.download = filename+".json";
    a.click();

    URL.revokeObjectURL(url); // Libère l'URL après téléchargement
}

function convertLangCodeToLanguage(lang) {
    switch(lang) {
        case "fr": return global.current_language_strings.lang_fr;
        case "da": return global.current_language_strings.lang_da;
        case "de": return global.current_language_strings.lang_de;
        case "en": return global.current_language_strings.lang_en;
        case "es": return global.current_language_strings.lang_es;
        case "fi": return global.current_language_strings.lang_fi;
        case "it": return global.current_language_strings.lang_it;
        case "ja": return global.current_language_strings.lang_ja;
        case "ko": return global.current_language_strings.lang_ko;
        case "nb": return global.current_language_strings.lang_nb;
        case "nl": return global.current_language_strings.lang_nl;
        case "pt": return global.current_language_strings.lang_pt;
        case "ru": return global.current_language_strings.lang_ru;
        case "sv": return global.current_language_strings.lang_sv;
        default: return global.current_language_strings.other;
    }
}