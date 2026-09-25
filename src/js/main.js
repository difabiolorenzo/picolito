// First function called when #body is loaded
function init() {
    // checkBrowserColorScheme();
    defaultVariables();
    setLanguageString();
    updateCurrentLanguageString("fr");
    game.team_1 = global.current_language_strings.team_default_name_0;
    game.team_2 = global.current_language_strings.team_default_name_1;
    retrieveCookie();
    loadPlayerListFromCookie(); // Charger les joueurs depuis les cookies
    attachExternalDBFileInputListener(); // Attaché une seule fois (ne pas déplacer dans updateHTMLSettingsByVar)

    refreshDBList();
    
    if (global.debug == true) { devOverrideSettings() }

    displaySafetyAndCookieModal();
    warnFileProtocol();
    registerServiceWorker();
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) { return; }
    if (location.protocol !== "http:" && location.protocol !== "https:") { return; }
    navigator.serviceWorker.register("./sw.js").catch(() => { /* SW indisponible : hors-ligne non garanti */ });
}

function devOverrideSettings() {
    document.getElementById("gamename_menu").innerHTML = "dev" + game.picolito_version.toUpperCase();
    
    displayPage("menu")
    global.remind_warning_panel = false;
    // DEBUG_carthage(true)
    if (game.player_list == "") { DEBUG_RandomPlayer(4) }
}

function warnFileProtocol() {
    if (location.protocol !== "file:") { return; }
    global.modal_file_protocol_warning.show();
}

const VANILLA_DB_INDEX = [
    // Picolo
    {   
        "gamemode":"picolo",
        "id":"picolo_default_fr",
        "pack_name": "Before - 🥴",
        "pack_description": "Le mode de jeu parfait pour s'ambiancer en soirées.\nSoyez prêts, car Picolito ne vous fera pas de cadeaux.",
        "url":"./src/db/picolo/default_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_default_en",
        "pack_name": "Getting Started - 🥴",
        "pack_description": "The perfect way to start the party and add some fun to your night.\nGet ready, picolo shows no mercy.",
        "url":"./src/db/picolo/default_en.json",
        "language":"en"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_default_it",
        "pack_name": "Pre-Party - 🥴",
        "pack_description": "La modalità ideale per ambientarsi.\nTenetevi pronti perchè Picolo non farà regali.",
        "url":"./src/db/picolo/default_it.json",
        "language":"it"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_silly_fr",
        "pack_name": "On est débiles - 🤪",
        "pack_description": "Si vous êtes déjà bien entamés et cons comme vos pieds, ce pack est fait pour vous.\nAttention, public averti.",
        "url":"./src/db/picolo/silly_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_silly_en",
        "pack_name": "Getting Crazy - 🤪",
        "pack_description": "If you want the night to get even more ridiculous, this game is for you.\nHope you've got a decent buzz going.",
        "url":"./src/db/picolo/silly_en.json",
        "language":"en"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_silly_it",
        "pack_name": "Siamo scemi - 🤪",
        "pack_description": "Se volete che la notte sia ancora più pazza, questo gioco fa per voi. Solo per i giocatori più selvaggi!",
        "url":"./src/db/picolo/silly_it.json",
        "language":"it"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_bar_fr",
        "pack_name": "Bar - 🍻",
        "pack_description": "Si vous êtes prêt à retourner le bar, c'est le mode de jeu parfait.\nAttention, il ne faut pas avoir peur du ridicule.",
        "url":"./src/db/picolo/bar_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_bar_en",
        "pack_name": "Bar - 🍻",
        "pack_description": "If you're ready to turn the bar upside down, this is the perfect game.\nBe prepared to face ridicule.",
        "url":"./src/db/picolo/bar_en.json",
        "language":"en"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_bar_it",
        "pack_name": "Bar - 🍻",
        "pack_description": "Se siete pronti a mettere il bar sottosopra allora avete lo spirito giusto per fare questio gioco.\nAttenzione: vietato vergognarsi !",
        "url":"./src/db/picolo/bar_it.json",
        "language":"it"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_hot_fr",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Orienté questions coquines, soyez prêts à dévoiler vos secrets les mieux gardés.\nEst-ce que ça va pécho ce soir?",
        "url":"./src/db/picolo/hot_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_hot_en",
        "pack_name": "Caliente - 🍆",
        "pack_description": "Time to get a little naughty.\nBe prepared to reveal your best-kept secrets",
        "url":"./src/db/picolo/hot_en.json",
        "language":"en"
    },
    {   
        "gamemode":"picolo",
        "id":"picolo_hot_it",
        "pack_name": "Hot - 🍆",
        "pack_description": "Domande maliziose, tenetevi pronti a divulgare i vostri segreti più intimi.\nQualcuno limonerà stasera ?",
        "url":"./src/db/picolo/hot_it.json",
        "language":"it"
    },
    // Mode équipe « guerre » (réactivé le 2026-09-20, cf. doc/equipes_war_spec.md)
    {   
        "gamemode":"war",
        "id":"picolo_war_fr",
        "pack_name": "Guerre - 🌩",
        "pack_description": "Affrontez-vous en équipe! Soyez solidaires et n'ayez aucune pitié...\nCe soir c'est la guerre!",
        "url":"./src/db/picolo/war_fr.json",
        "language":"fr"
    },
    {   
        "gamemode":"war",
        "id":"picolo_war_en",
        "pack_name": "War - 🌩",
        "pack_description": "The perfect way to start the party and add some fun to your night.\nGet ready, picolo shows no mercy.",
        "url":"./src/db/picolo/war_en.json",
        "language":"en"
    },
    {   
        "gamemode":"war",
        "id":"picolo_war_it",
        "pack_name": "Guerra - 🌩",
        "pack_description": "Sfidatevi a squadre ! Siate solidali a non abbiate nessuna pietà per i vostri avversari...\nStasera è guerra !",
        "url":"./src/db/picolo/war_it.json",
        "language":"it"
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
    },

    // Question pour un Picton
    {
        "gamemode": "question_pour_un_champion",
        "gamemode": "question_pour_un_champion",
        "id": "question_pour_un_picton_fr",
        "language": "fr",
        "pack_name": "Question pour un Picton",
        "pack_description": "Questions sur les alcools, cocktails, bières, vins, spiritueux, prévention, histoire et culture !",
        "url": "./src/db/questions/question_pour_un_picton/question_pour_un_picton.json"
    },
    {
        "gamemode": "question_pour_un_champion",
        "id": "question_pour_un_champion_fr",
        "language": "fr",
        "pack_name": "Question pour un Champion",
        "pack_description": "Pack complet des séries 1 à 51, condensé 2005-2015 et co-rédigé 2024 des jeux joués aux clubs de Paris 2 et de Saint-Germain-en-Laye",
        "url": "./src/db/questions/question_pour_un_champion/question_pour_un_champion_fr.json"
    }
];

const MIX_ALLOWED_QUESTION_TYPES = ["question_picolito", "neuf_points_gagnants"];

function defaultVariables() {
    global = {
        current_language: "fr",
        debug: false,
        dark_mode: "bright",
        cookie_expiration_delay: 15,
        audio : {
            weakest_link_amb_60: undefined,
            weakest_link_amb_end: undefined,
            qpuc_timer: undefined,
            qpuc_jingle_fin: undefined,
            qpuc_passage_de_main: undefined,
            qpuc_points: undefined,
            qpuc_qualif: undefined,
            qpuc_sound_110: undefined,
            qpuc_buzzer: undefined,
            qpuc_timeout: undefined,
            qpuc_wrong_answer: undefined
        },
        audio_enabled: true,

        modal_player_menu: new bootstrap.Modal(document.getElementById('modal_modal_player_menu')),
        modal_sentence_modifier: new bootstrap.Modal(document.getElementById('modal_sentence_modifier')),
        modal_safety_and_cookie_modal: new bootstrap.Modal(document.getElementById('modal_safety_and_cookie_modal')),
        modal_sentence_list: new bootstrap.Modal(document.getElementById('modal_sentence_list')),
        modal_external_db: new bootstrap.Modal(document.getElementById('modal_external_db')),
        modal_file_protocol_warning: new bootstrap.Modal(document.getElementById('modal_file_protocol_warning'), { backdrop: "static", keyboard: false }),
        modal_confirm: new bootstrap.Modal(document.getElementById('modal_confirm'))
    }

    game = {
        picolito_version: "0.37.1",
        vanilla_db_index: VANILLA_DB_INDEX,

        mix_gamemode_list_picolo: [],

        player_list: [],
        max_player_number: -1,

        team_1: "",
        team_2: "",

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
        mix_gamemode_probability: {
            picolo: 0,
            je_n_ai_jamais: 0,
            question_pour_un_champion: 0
        },
        weakest_link: {
            stop_at_max_chain: true, 
            max_chain: 6,
            tie_behaviour: "weakest", //strongest_link, arbitrary, both, weakest
            difficulty_default_value: "progressive",
            difficulty_selected: "progressive",
            current_player_index: 0,
            chain: 0,
            bank: 0,
            time: 60,
            questions_asked: 0,
            timer: null,
            text_size: "normal", // normal, small, big
            fade_out_time: 2500 
        },
        qpuc: {
            gamemode_types: [
                { id: "neuf_points_gagnants", key: "qpuc_gamemode_type_neuf_points_gagnants" },
                { id: "quatre_a_la_suite", key: "qpuc_gamemode_type_quatre_a_la_suite" },
                { id: "face_a_face", key: "qpuc_gamemode_type_face_a_face" },
                { id: "jeu_decisif", key: "qpuc_gamemode_type_jeu_decisif" }
            ],
            selected_gamemode_type: null,
            selected_packs: [],
            // Mini-moteur de manches à points (Neuf points gagnants / Quatre à la suite)
            manche: null,            // type de manche effectif en jeu ou null (mode carte classique)
            answer_revealed: false,  // réponse de la carte courante révélée ?
            answer_display: "click", // click = réponse cachée (révélée au clic), visible = réponse directement affichée
            scores: {},              // { nom_joueur: points (NPG) | meilleure série (4QAS) }
            q4_timer: null,          // setInterval du chrono 4QAS
            q4_remaining: 40,        // secondes restantes du tour en cours
            q4_streak: 0,            // série de bonnes réponses en cours du tour
            q4_player_index: 0       // index du joueur dont c'est le tour
        }
    }
    updateHTMLSettingsByVar()
}

function resetVariables() {
    game.db = {};

    game.cycle_id = -1;
    game.picolito.virus_remaining = 1;
    game.picolito.chug_remaining = game.picolito.chug_amount;
    game.questions = undefined;

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
    input_weakest_link_difficulty_default_value.value = game.weakest_link.difficulty_default_value;
    input_weakest_link_difficulty_selected.value = game.weakest_link.difficulty_selected;
    input_weakest_link_text_size.value = game.weakest_link.text_size;
    input_weakest_link_soundtrack.checked = global.audio_enabled;
    input_qpuc_answer_display.value = game.qpuc.answer_display;
    
    picolito_version_safety.innerHTML = `Picolito ${game.picolito_version}`;
    picolito_version_menu.innerHTML = `Picolito ${game.picolito_version}`;

    document.getElementById("input_show_only_current_language_db").checked = game.only_display_current_language_databases;

    displayPage('menu');
}

function attachExternalDBFileInputListener() {
    // Input ajout fichier bases de données — attaché une seule fois dans init()
    // (updateHTMLSettingsByVar() est appelée par defaultVariables() ET retrieveCookie()
    // ce qui dupliquait le listener → import fichier traité deux fois)
    const input = document.getElementById("external_db_file_input");
    input.addEventListener("change", async () => {
        if (input.files && input.files[0]) {
            await addDBData({ file: input.files[0] });
            input.value = "";
        }
    });
}

function displaySafetyAndCookieModal() {
    if (global.remind_warning_panel == true || global.remind_warning_panel == undefined) { global.modal_safety_and_cookie_modal.show(); }
}

function checkBrowserColorScheme(force_bright) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches == true || force_bright == false) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    } else {
        document.documentElement.setAttribute("data-bs-theme", "light");
    }
}

function changeDarkModeSettings(value) {
    // data-bs-theme est la source unique du thème (Bootstrap 5.3 + CSS custom)
    let theme = "light";
    if (value == "system") {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches == true) {
            theme = "dark";
        }
        global.dark_mode = "system";
    } else if (value == "bright") {
        global.dark_mode = "bright";
    } else {
        global.dark_mode = "dark";
        theme = "dark";
    }
    document.documentElement.setAttribute("data-bs-theme", theme);
}

function changeSipSettings(setting, value) {
    // Prévention pour ne pas avoir de paramètres avec des minimum plus grand que maximum
    value = parseInt(value)
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

function changeWeakestLinkDifficultyDefaultValue(value) {
    game.weakest_link.difficulty_default_value = value;
    game.weakest_link.difficulty_selected = value;
    input_weakest_link_difficulty_default_value.value = value;
    input_weakest_link_difficulty_selected.value = value;
    input_weakest_link_difficulty_menu.value = value;
}

function changeWeakestLinkDifficultySelected(value) {
    game.weakest_link.difficulty_selected = value;
    input_weakest_link_difficulty_selected.value = value;
    input_weakest_link_difficulty_menu.value = value;
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
    const pages = ["menu", "picolito", "question_pour_un_champion", "weakest_link"]

    for (let i in pages) {
        document.getElementById(pages[i]).classList.add("d-none");
    }
    const page_el = document.getElementById(page);
    page_el.classList.remove("d-none");
    page_el.classList.add("page_transition");
    page_el.addEventListener("animationend", () => page_el.classList.remove("page_transition"), { once: true });
    page_el.focus();
}

function addPlayer(player_name) {
    const trimmed_name = String(player_name || "").trim();
    if (trimmed_name == "") {
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
    game.player_list.push({ id, player_name: trimmed_name, team: "null" });
    refreshPlayerList();
    document.getElementById("menu_player_input").value = "";
    document.getElementById("menu_player_input").focus();
}

function refreshTeamCounters() {
    const container = document.getElementById("menu_player_counters");
    if (!container) { return; }

    const total = game.player_list.length;
    const team_mode = menu_player_switch_team_mode.checked;
    const unassigned_label = global.current_language_strings.player_unassigned;
    const players_label = global.current_language_strings.players_capitalized;

    const team_data = [
        { cls: "team_badge_1", label: game.team_1 },
        { cls: "team_badge_2", label: game.team_2 },
        { cls: "team_badge_neutral", label: unassigned_label }
    ];

    const team_badges = team_data.map(team =>
        `<span class="badge rounded-pill ${team.cls}">${escapeHTML(team.label)} : ${countTeamPlayers(team.cls)}</span>`
    ).join("");

    container.innerHTML =
        `<span class="badge rounded-pill bg-secondary">${escapeHTML(players_label)} : ${total}</span>` +
        (team_mode ? team_badges : "");
}

function countTeamPlayers(badge_class) {
    const key_map = { team_badge_1: "team_1", team_badge_2: "team_2", team_badge_neutral: "unassigned" };
    const target = key_map[badge_class];

    if (target === "unassigned") {
        return game.player_list.filter(player => player.team !== "team_1" && player.team !== "team_2").length;
    }
    return game.player_list.filter(player => player.team === target).length;
}

function refreshPlayerList() {
    const playerListElement = document.getElementById("menu_player_list");
    playerListElement.innerHTML = "";

    playerListElement.innerHTML = game.player_list.map(player => getPlayerRowTemplate(player)).join("");
    storePlayerListCookie();
    refreshTeamCounters();
}

function getPlayerRowTemplate(player) {
    const team = player.team;
    const team_mode = menu_player_switch_team_mode.checked;
    const is_assigned = team_mode && (team == "team_1" || team == "team_2");
    const team_name = team == "team_1" ? game.team_1 : team == "team_2" ? game.team_2 : "";
    const unassigned_label = global.current_language_strings.player_unassigned;
    const remove_label = global.current_language_strings.player_remove;
    const team_select_aria = (global.current_language_strings.player_team_select || "").replace("{name}", player.player_name);

    return `
        <div id="player_item_${player.id}" class="d-flex flex-row justify-content-between align-items-center mb-3 gap-2">
            <div class="input-group flex-grow-1" style="flex-basis: 0;">
                <span class="input-group-text team_name_dot ${is_assigned ? "team_badge_" + team.replace("team_", "") : "team_badge_neutral"}"><span class="team_badge_dot"></span></span>
                <input id="player_name_input_${player.id}" type="text" class="form-control" maxlength="50" value="${escapeHTML(player.player_name)}"
                       onchange="setPlayerName(${player.id}, this.value)"
                       onkeydown="if(event.key === 'Enter'){this.blur();}">
            </div>
            <div class="d-flex align-items-center flex-shrink-0">
                ${team_mode
                    ? `<select class="form-select team_select" onchange="assignPlayerToTeam(${player.id}, this.value)" aria-label="${escapeHTML(team_select_aria)}">
                        <option value="null" ${!is_assigned ? "selected" : ""}>${escapeHTML(unassigned_label)}</option>
                        <option value="team_1" ${team == "team_1" ? "selected" : ""}>${escapeHTML(game.team_1)}</option>
                        <option value="team_2" ${team == "team_2" ? "selected" : ""}>${escapeHTML(game.team_2)}</option>
                    </select>`
                    : ""}
                <button class="btn btn-danger" onclick="removePlayer(${player.id})" title="${escapeHTML(remove_label)}" aria-label="${escapeHTML(remove_label)}">
                    <i class="bi me-2 bi-trash"></i>
                </button>
            </div>
        </div>`;
}

function refreshTeamDisplay() {
    const team_mode = menu_player_switch_team_mode.checked;
    document.getElementById("menu_player_team_placeholder").classList.toggle("d-none", !team_mode);
    document.getElementById("menu_player_auto_balance").classList.toggle("d-none", !team_mode);
    document.getElementById("menu_player_team_1_name").value = game.team_1;
    document.getElementById("menu_player_team_2_name").value = game.team_2;
    refreshPlayerList();
}

function setTeamName(team_id, value) {
    const is_team_1 = team_id == "team_1";
    const default_name = is_team_1
        ? global.current_language_strings.team_default_name_0
        : global.current_language_strings.team_default_name_1;
    const clean_name = String(value || "").trim();
    game[is_team_1 ? "team_1" : "team_2"] = clean_name !== "" ? clean_name : default_name;
    refreshTeamDisplay();
    storeSettingsCookie();
}

const pending_undeletes = [];

function removePlayer(id) {
    const index = game.player_list.findIndex(player => player.id === id);
    if (index === -1) { return; }
    const [removed] = game.player_list.splice(index, 1);
    refreshPlayerList();
    storePlayerListCookie();
    const undo_id = "undo_player_" + removed.id + "_" + Date.now();
    for (let i = pending_undeletes.length - 1; i >= 0; i--) {
        if (pending_undeletes[i].player.id === removed.id) { pending_undeletes.splice(i, 1); }
    }
    pending_undeletes.push({ undo_id, player: removed });
    showUndoToast(removed, undo_id);
}

function showUndoToast(player, undo_id) {
    const container = document.getElementById("toast_container");
    if (!container) { return; }
    const toast = document.createElement("div");
    toast.className = "toast align-items-center bg-dark text-white border-0";
    toast.setAttribute("role", "alert");
    toast.innerHTML = `<div class="d-flex align-items-center">
            <div class="toast-body"></div>
            <button type="button" class="btn btn-link btn-sm text-info me-2" data-undo="${undo_id}">${escapeHTML(global.current_language_strings.player_undo)}</button>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    const body = toast.querySelector(".toast-body");
    body.textContent = (global.current_language_strings.player_deleted_undo || "").replace("{name}", player.player_name);
    toast.querySelector("[data-undo]").addEventListener("click", () => restoreDeletedPlayer(undo_id));
    container.appendChild(toast);
    const bootstrapToast = new bootstrap.Toast(toast, { delay: 6000 });
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
    bootstrapToast.show();
}

function restoreDeletedPlayer(undo_id) {
    const item = pending_undeletes.find(entry => entry.undo_id === undo_id);
    if (!item) { return; }
    const restored = item.player;
    pending_undeletes.splice(pending_undeletes.indexOf(item), 1);
    if (game.player_list.some(player => player.id === restored.id)) {
        restored.id = game.player_list.length > 0 ? game.player_list[game.player_list.length - 1].id + 1 : 1;
    }
    game.player_list.push(restored);
    refreshPlayerList();
    storePlayerListCookie();
    const toast = document.querySelector(`[data-undo="${undo_id}"]`)?.closest(".toast");
    if (toast) { bootstrap.Toast.getOrCreateInstance(toast).hide(); }
}

function setPlayerName(id, value) {
    const player = game.player_list.find(player => player.id === id);
    if (!player) { return; }
    const clean_name = String(value || "").trim();
    if (clean_name !== "") {
        player.player_name = clean_name;
    }
    refreshPlayerList();
}

function autoBalanceTeams() {
    if (game.player_list.length === 0) { return; }
    const target = Math.ceil(game.player_list.length / 2);
    // Répartition aléatoire équilibrée : on re-mélange TOUS les joueurs
    // (même déjà assignés), équipe 1 = ceil(n/2), équipe 2 = le reste.
    const shuffled = game.player_list
        .map((player, index) => ({ player, index, rand: Math.random() }))
        .sort((a, b) => a.rand - b.rand || a.index - b.index)
        .map(entry => entry.player);
    shuffled.forEach((player, i) => {
        player.team = i < target ? "team_1" : "team_2";
    });
    refreshPlayerList();
    storePlayerListCookie();
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
    if (game.cycle_id >= 0 && game.sentence_history[game.cycle_id] != undefined) {
        return game.sentence_history[game.cycle_id].color;
    } else {
        return "black";
    }
}

function setBackgroundStyleColor(value) {
    const element = document.getElementById("picolito");
    element.classList.add("page", "dark_affected");
    ["blue", "red", "yellow", "green", "je_n_ai_jamais", "black", "qpuc"].forEach(c => element.classList.remove(c));
    element.classList.add(value);
}

async function initPicolo() {
    // Cherche la première instance de packs car nous savons que nous n'utilisons qu'un seul mode
    // Plusieurs sera avec initMix
    const pack_id = game.current_gamemode.packs[0].pack_id
    const pack_source = game.current_gamemode.packs[0].pack_source
    
    const data = await loadDatabase({pack_id: pack_id, source: pack_source})
    // Chargement direct dans current_gamemode.packs (plus de buffer pending_db)
    game.current_gamemode.packs = data ? [data] : [];

    setMaxPlayerNumber()
    displayPage('picolito');

    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", false);

    updateWarTeamOptionDisplay(game.gamemode == "picolo_war");

    warnLanguageMismatchIfNeeded();
}

async function initJeNaiJamais() {
    // Cherche la première instance de packs car nous savons que nous n'utilisons qu'un seul mode
    // Plusieurs sera avec initMix
    const pack_id = game.current_gamemode.packs[0].pack_id
    const pack_source = game.current_gamemode.packs[0].pack_source
    
    const data = await loadDatabase({pack_id: pack_id, source: pack_source})
    // Chargement direct dans current_gamemode.packs (plus de buffer pending_db)
    game.current_gamemode.packs = data ? [data] : [];

    displayPage('picolito');

    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", false);

    warnLanguageMismatchIfNeeded();
}

async function initMix() {
    // A CONCATENER game.mix_gamemode_list_picolo et je_n_ai_jamais
    if (global.debug==true) console.log("gamemode_mix", game.mix_gamemode_list_picolo)
    const loadedPacks = await Promise.all(game.mix_gamemode_list_picolo.map(pack => loadDatabase({pack_id: pack.pack_id, source: pack.pack_source})))
    // Chargement direct dans current_gamemode.packs (plus de buffer pending_db)
    game.current_gamemode.packs = loadedPacks.filter(Boolean);

    setMaxPlayerNumber()
    displayPage('picolito');
    
    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", true);

    warnLanguageMismatchIfNeeded();
}

async function initQuestionPourUnChampion() {
    // Plusieurs packs possibles : même principe que initMix
    const packs = game.current_gamemode.packs
    if (global.debug==true) console.log("gamemode question_pour_un_champion", packs)
    const loadedPacks = await Promise.all(packs.map(pack => loadDatabase({pack_id: pack.pack_id, source: pack.pack_source})))
    // Chargement direct dans current_gamemode.packs (plus de buffer pending_db)
    game.current_gamemode.packs = loadedPacks.filter(Boolean);

    initQpucManche();

    setMaxPlayerNumber()
    displayPage('picolito');

    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", true);

    warnLanguageMismatchIfNeeded();
}

function listStoredDatabase() {
    const local_storage_keys = JSON.parse(localStorage.getItem("db:index:external"))

    for (let i = 0; i < local_storage_keys.length; i++) {
        if (global.debug==true) console.log(local_storage_keys[i])
    }
}

// Charge une base depuis le cache localStorage (clé unifiée db:<id>) ou la télécharge.
// Retourne le pack (objet complet) ou `null` en cas d'échec. Plus de buffer `pending_db` :
// les inits placent le résultat directement dans `game.current_gamemode.packs`.
async function loadDatabase({ pack_id = null, source = "vanilla" }) {
    try {
        const dbIndex = DBManager.getById(pack_id, source);
        if (!dbIndex) {
            throw new Error(`Aucune base trouvée avec l'id "${source}:${pack_id}" dans le catalogue.`);
        }

        // Si la base est disponible dans le localStorage → on la renvoie directement
        let storedData = DBManager.loadLocal(dbIndex);
        if (!storedData) {
            await DBManager.download(dbIndex); // Attend le téléchargement
            refreshDBList();

            // On relit le localStorage après téléchargement
            storedData = DBManager.loadLocal(dbIndex);
        } else {
            // Check-auto de version (max 1 toutes les 6h) : met à jour le cache si la base a changé
            const DB_VERSION_CHECK_DELAY = 6 * 60 * 60 * 1000;
            const lastCheck = parseInt(localStorage.getItem(`db:check:${dbIndex.id}`) || "0", 10);
            if (Date.now() - lastCheck >= DB_VERSION_CHECK_DELAY) {
                localStorage.setItem(`db:check:${dbIndex.id}`, Date.now());
                await DBManager.refresh(dbIndex);
                storedData = DBManager.loadLocal(dbIndex);
            }
        }

        if (storedData) {
            // if (global.debug==true) console.log(`Base "${storedData.pack_name}" (${pack_id}) chargée depuis le localStorage.`);
            return storedData;
        }
        return null;
    } catch (error) {
        console.warn(`Impossible de charger la base "${source}:${pack_id}" :`, error.message);
        return null;
    }
}

function startGame() {

    // Aucune base de données chargée (échec de téléchargement, file://, etc.)
    if (game.current_gamemode.packs.length == 0) {
        showToast(global.current_language_strings.db_load_error);
        return;
    }

    game.started = true;

    manageNavDisplay("navigation_arrows", true);

    displayIngameOptionPanel(false);
    manageIngameOptionDisplay({option: "start", display: false});

    // Les packs sont déjà chargés par les inits, plus de copie (ni de buffer pending_db)
    // Les packs utilisent des Arrays natifs (packs[i].db)
    if (global.debug==true) console.log(game.current_gamemode.packs)

    // Longueur maximale possible
    game.current_gamemode.database_length = calcCombineDatabasesPossibleLenght();

    incrementCycleID();
}

function exitGame() {
    if (game.gamemode == "weakest_link") {
        stopsound("weakest_link_amb_60")

        if (game.weakest_link.timer) { clearInterval(game.weakest_link.timer) }
    }

    setBackgroundStyleColor("black");
    document.getElementById("text_ingame_title").style.display = "none";
    document.getElementById("text_ingame_title").innerHTML = "";

    displaySentence("", undefined); // reset HTML sentence display

    // Réinitialisation des indicateurs dans la ingame_topbar
    document.getElementById("picolito_gamemode_infos").innerHTML = "";
    document.getElementById("picolito_bdd_infos").innerHTML = "";

    updateGameCycleIndicator(); // reset cycle count
    resetVariables();
    game.current_gamemode = {};

    picolitoNavigationButtonsDisplay("previous", false)
    picolitoNavigationButtonsDisplay("game_cyle", false)
    picolitoNavigationButtonsDisplay("next", false)

    displayIngameOptionPanel(false)
    manageIngameOptionDisplay({option: "start", display: false});
    manageIngameOptionDisplay({option: "replay", display: false});

    manageNavDisplay("navigation_arrows", false);
    manageNavDisplay("players", true);
    manageNavDisplay("restart",false);

    updateWarTeamOptionDisplay(false);

    displayPage('menu');

    game.mix_gamemode_list_picolo = [];
    document.getElementById("button_update_mix_gamemode_list").disabled = true;
    document.getElementById("gamemode_mix_picolo").querySelectorAll("input[type=checkbox]").forEach(checkbox => checkbox.checked = false);
    document.getElementById("gamemode_mix_je_n_ai_jamais").querySelectorAll("input[type=checkbox]").forEach(checkbox => checkbox.checked = false);
    document.getElementById("gamemode_mix_question_pour_un_champion").querySelectorAll("input[type=checkbox]").forEach(checkbox => checkbox.checked = false);
    ["picolo", "je_n_ai_jamais", "question_pour_un_champion"].forEach(g => updateMixGamemodeDisplaySlider(g, "hide"));

    // Reset de la sélection QPUC et du mini-moteur de manches
    game.qpuc.selected_gamemode_type = null;
    game.qpuc.selected_packs = [];
    game.qpuc.manche = null;
    game.qpuc.answer_revealed = false;
    game.qpuc.scores = {};
    game.qpuc.q4_remaining = 40;
    game.qpuc.q4_streak = 0;
    game.qpuc.q4_player_index = 0;
    if (game.qpuc.q4_timer) {
        clearInterval(game.qpuc.q4_timer);
        game.qpuc.q4_timer = null;
    }
    const qpuc_score_panel = document.getElementById("qpuc_score_panel");
    if (qpuc_score_panel) qpuc_score_panel.classList.add("d-none");

    game.started = false;
}

function calcCombineDatabasesPossibleLenght() {
    const packs = game.current_gamemode.packs
    let length = 0;

    for (let i in packs) {
        const pack = packs[i];
        if (pack.gamemode == "picolo" || pack.gamemode == "war") {
            length += countPlayablePicoloMainSentences(pack);
        } else {
            length += pack.db.length;
        }
    }

    return length;
}

function countPlayablePicoloMainSentences(pack) {
    const player_count = game.player_list.length;
    const is_war = game.gamemode == "picolo_war";
    const filters = Array.isArray(pack.filters) ? pack.filters : [];

    // Types dont la couleur est active selon la variante et les réglages,
    // et compatibles avec le nombre de joueurs (mêmes conditions que getColor/getTypesAndPlayerCount)
    const usable_types = filters
        .filter(filter => {
            if (!Array.isArray(filter.player_count)) return true;
            return Math.min(...filter.player_count) <= player_count;
        })
        .filter(filter => {
            if (is_war && (filter.color == "red" || filter.color == "yellow")) return false;
            if (filter.color == "red" && !game.picolito.chug_enabled) return false;
            if (filter.color == "yellow" && !game.picolito.virus_enabled) return false;
            return true;
        })
        .map(filter => filter.type.toString())
        .filter(type => {
            if (!game.picolito.social_posting_enabled && (type == "social_posting" || type == "15")) return false;
            return true;
        });

    // Seules les phrases principales comptent (une suite suit sa carte, sans consommer de cycle à part)
    return pack.db.filter(entry =>
        entry.parent_key == "" &&
        Number(entry.nb_players) <= player_count &&
        usable_types.includes(entry.type.toString())
    ).length;
}

function updateDatabaseIndicator(pack_id) {
    const pack = game.current_gamemode.packs.filter(bdd => bdd.id === pack_id)[0];
    if (pack == undefined) { return; }

    let gamemode_type = "";
    switch (pack.gamemode) {
        case "picolo":
        case "war":
            gamemode_type = global.current_language_strings.picolo;
            break;
        case "je_n_ai_jamais":
            gamemode_type = global.current_language_strings.je_n_ai_jamais;
            break;
        case "question_pour_un_champion":
            gamemode_type = global.current_language_strings.question_pour_un_champion;
            break;
        default: break;
    }
    document.getElementById("picolito_gamemode_infos").innerHTML = gamemode_type;
    document.getElementById("picolito_bdd_infos").innerHTML = pack.pack_name;
}

function restartGame() {
    let gamemode_type = game.current_gamemode.gamemode_type;
    // Récupère la manche QPUC (Neuf points gagnants / Quatre à la suite) avant que
    // exitGame() ne la remette à null (game.qpuc.selected_gamemode_type = null)
    const qpuc_type = game.current_gamemode.qpuc_type ?? game.qpuc.selected_gamemode_type;
    // Reconstruction des descripteurs {pack_id, pack_source} depuis les packs chargés
    let packs = game.current_gamemode.packs.map(pack => ({
        pack_id: pack.id,
        pack_source: pack.pack_source ?? (DBManager.catalog.some(e => e.id === pack.id && e.source === "external") ? "external" : "vanilla")
    }));

    // Réinitialisation des variables du jeu
    exitGame();

    selectGame(
        {
            gamemode_type : gamemode_type,
            packs : packs,
            restart : true,
            qpuc_type : qpuc_type
        }
    );
}

async function selectGame({gamemode_type, packs=[], restart=false, qpuc_type=null}) {
    // Appelé depuis le menu avec selectGame({ gamemode_type:gamemode_type, packs: [ {pack_id:pack_id, pack_source:pack_source}] })
    game.current_gamemode = {
        gamemode_type: gamemode_type,
        packs: packs,
        restart: restart,
        qpuc_type: qpuc_type
    };
    
    switch (gamemode_type) {
        case "picolo": game.gamemode = "picolo"; await initPicolo(); break;
        case "je_n_ai_jamais": game.gamemode = "je_n_ai_jamais"; await initJeNaiJamais(); break;
        case "mix": game.gamemode = "mix"; await initMix(); break;
        case "weakest_link":
            game.gamemode = "weakest_link";
            if (game.player_list.length >= 2) {
                await initWeakestLink();
            } else {
                showToast(global.current_language_strings.weakest_link_minimum_player_requierement)
                global.modal_player_menu.show();
                return;
            }
            break;
        case "question_pour_un_champion" :
            game.gamemode = "question_pour_un_champion";
            await initQuestionPourUnChampion();
            break;
        case "war":
            game.gamemode = "picolo_war";
            if (game.player_list.length >= 2) {
                await initPicolo();
            } else {
                showToast(global.current_language_strings.gamemode_picolo_war_minimum_requierement)
                global.modal_player_menu.show();
                return;
            }
            break;
        default: console.warn(`Gamemode "${gamemode_type}" non reconnu.`); break;
    }

    if (restart == true) {
        startGame();
    }
}

function selectMixGamemode() {
    // initMix();
    selectGame({gamemode_type:"mix"})
    return;
}

// ---- Mode Question pour un Champion (QPUC) ----

// Navigation : choix d'un type de mode depuis le menu principal, puis ouverture de la page QPUC
function selectQpucGamemodeType(gamemode_type_id) {
    game.qpuc.selected_gamemode_type = gamemode_type_id;
    game.qpuc.selected_packs = [];

    // On prépare les BDD cochées par défaut (celles de la langue d'affichage)
    renderQpucMenu();

    displayPage('question_pour_un_champion');
}

// Ajout/retrait d'un pack dans la sélection QPUC (depuis les checkboxes de la page jeu)
function updateSelectedQpucPack(element) {
    if (element.checked == true) {
        const exists = game.qpuc.selected_packs.some(p => p.pack_id === element.pack_id);
        if (!exists) {
            game.qpuc.selected_packs.push({ pack_id: element.pack_id, pack_source: element.pack_source });
        }
    } else {
        game.qpuc.selected_packs = game.qpuc.selected_packs.filter(p => p.pack_id !== element.pack_id);
    }
    document.getElementById("question_pour_un_champion_start_button").disabled = game.qpuc.selected_packs.length == 0;
}

// Tout cocher / tout décocher dans le menu QPUC
function toggleAllQpucPacks(checked) {
    document.querySelectorAll("#question_pour_un_champion_db_list input[type=checkbox]").forEach(cb => {
        cb.checked = checked;
        updateSelectedQpucPack({ checked: checked, pack_id: cb.dataset.packId, pack_source: cb.dataset.packSource });
    });
}

// Rendu de la page QPUC : rappel du type + listage des BDD activables
function renderQpucMenu() {
    const db_list = document.getElementById("question_pour_un_champion_db_list");
    if (!db_list) return;

    const type = game.qpuc.gamemode_types.find(t => t.id === game.qpuc.selected_gamemode_type);
    document.getElementById("question_pour_un_champion_selected_type").textContent = type ? global.current_language_strings[type.key] : "";

    const allDBs = DBManager.getAll().filter(db => db.gamemode == "question_pour_un_champion");

    db_list.innerHTML = allDBs.map(getQpucPackCheckboxTemplate).join("");

    const startButton = document.getElementById("question_pour_un_champion_start_button");
    if (startButton) startButton.disabled = game.qpuc.selected_packs.length == 0;
}

function getQpucPackCheckboxTemplate(db) {
    const pack_id = escapeHTML(db.id);
    const pack_source = escapeHTML(db.source);
    const pack_name = escapeHTML(db.pack_name);
    const checked = game.qpuc.selected_packs.some(p => p.pack_id === db.id) ? "checked" : "";

    let additionalData = "";
    if (pack_source != "vanilla" || game.only_display_current_language_databases == false) {
        additionalData = `<div class="d-flex justify-content-end">
                ${getLanguageBadgeHTML(db)}
                <span class="badge bg-dark m-1">${getSourceLabel(db.source)}</span>
            </div>`;
    }

    return `
        <div class="form-check form-switch col-12 col-sm-6 col-xl-4 col-xxl-3">
            <input class="form-check-input" type="checkbox" id="qpuc-${pack_id}-checkbox" ${checked}
                   data-pack-id="${pack_id}" data-pack-source="${pack_source}"
                   onclick="updateSelectedQpucPack({checked: this.checked, pack_id: '${pack_id}', pack_source: '${pack_source}'})">
            <div class="d-flex w-100 justify-content-between">
                <label class="form-check-label" for="qpuc-${pack_id}-checkbox">${pack_name}</label>
                <div class="d-flex justify-content-end gap-1">
                    ${additionalData}
                </div>
            </div>
        </div>`;
}

// Lancement de la partie QPUC avec les packs cochés
function startQpucGame() {
    if (game.qpuc.selected_packs.length == 0) return;
    selectGame({ gamemode_type: "question_pour_un_champion", packs: game.qpuc.selected_packs, qpuc_type: game.qpuc.selected_gamemode_type });
}

function updateSelectedMixGamemode(element) {
    if (global.debug==true) console.log(element)
    
    // ajout d'element dans game.mix_gamemode_list_picolo ou suppression en fonction de la checkbox (checked)
    if (element.checked == true) {
        game.mix_gamemode_list_picolo.push({ pack_id: element.pack_id, pack_source: element.pack_source });
        if (global.debug==true) console.log(`Ajout de ${element.pack_id} (${element.gamemode_type}) dans ${game.mix_gamemode_list_picolo}`)
    } else {
        let index = game.mix_gamemode_list_picolo.findIndex(e => e.pack_id === element.pack_id);
        game.mix_gamemode_list_picolo.splice(index, 1);
        if (global.debug==true) console.log(`Suppression de ${element.pack_id} (${element.gamemode_type}) dans ${game.mix_gamemode_list_picolo}`)
    }

    // ajout d'element dans game.mix_gamemode_list_picolo ou rien s'il est déjà présent


    // if (element.gamemode_type == "picolo") {
    //     if (global.debug==true) console.log(element.pack_id, element.gamemode_type + " dans " + game.mix_gamemode_list_picolo)
        
    //     // ajout d'element dans game.mix_gamemode_list_picolo ou rien s'il est déjà présent
    //     const index = game.mix_gamemode_list_picolo.findIndex(e => e.pack_id === element.pack_id);
    //     if (index === -1) {
    //         game.mix_gamemode_list_picolo.push({ pack_id: element.pack_id, pack_source: element.pack_source });
    //     } else {
    //         game.mix_gamemode_list_picolo.splice(index, 1);
    //     }
    // }
    // if (element.gamemode_type == "je_n_ai_jamais") {        
    //     // ajout d'element dans game.mix_gamemode_list_je_n_ai_jamais ou rien s'il est déjà présent
    //     const index = game.mix_gamemode_list_je_n_ai_jamais.findIndex(e => e.pack_id === element.pack_id);
    //     if (index === -1) {
    //         game.mix_gamemode_list_je_n_ai_jamais.push({ pack_id: element.pack_id, pack_source: element.pack_source });
    //     } else {
    //         game.mix_gamemode_list_je_n_ai_jamais.splice(index, 1);
    //     }
    // }

    if (global.debug==true) console.log("mix_gamemode_list_picolo", game.mix_gamemode_list_picolo)

    if (game.mix_gamemode_list_picolo.length > 0) {
        document.getElementById("button_update_mix_gamemode_list").disabled = false;
    } else {
        document.getElementById("button_update_mix_gamemode_list").disabled = true;
    }

    refreshMixProbabilitySliders();
}

function refreshMixProbabilitySliders() {
    const mix_gamemodes = ["picolo", "je_n_ai_jamais", "question_pour_un_champion"];
    const active_modes = mix_gamemodes.filter(g =>
        document.querySelectorAll(`#gamemode_mix_${g} input[type=checkbox]:checked`).length > 0
    );

    mix_gamemodes.forEach(g => {
        const visible = active_modes.includes(g) && active_modes.length >= 2;
        updateMixGamemodeDisplaySlider(g, visible ? "display" : "hide");
    });

    if (active_modes.length >= 2) {
        const others = active_modes.filter(g => g != "question_pour_un_champion");
        const other_weight = active_modes.includes("question_pour_un_champion")
            ? Math.floor(90 / others.length)
            : Math.floor(100 / active_modes.length);

        active_modes.forEach(g => {
            const weight = g == "question_pour_un_champion"
                ? 100 - other_weight * others.length
                : other_weight;

            game.mix_gamemode_probability[g] = weight;
            document.getElementById(`gamodemode_mix_section_slider_${g}_probability`).value = weight;
            document.getElementById(`gamodemode_mix_section_slider_${g}_probability_value`).innerHTML = weight;
        });
    }
}

function picolitoNavigationButtonsDisplay(button, display=false) {
    let selected_button;
    switch (button) {
        case "previous" : selected_button = document.getElementById("game_cycle_previous_button"); break;
        case "next" : selected_button = document.getElementById("game_cycle_next_button"); break;
        case "game_cyle" : selected_button = document.getElementById("game_cycle_count"); break;
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
    let selected_option;
    switch (option) {
        case "start" : selected_option = document.getElementById("start_ingame_option"); break;
        case "replay" : selected_option = document.getElementById("replay_ingame_option"); break;
        default: break;
    }

    if (display == true) {
        selected_option.style.display = "block";
    } else {
        selected_option.style.display = "none";
    }
}

function updateWarTeamOptionDisplay(display) {
    const ids = ["text_game_teams_ready", "text_game_teams_replay"];
    for (const id of ids) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = display ? "inline-flex" : "none";
        }
    }
}

function manageNavDisplay(navigation_option=null, display=false) {
    let selected_navigation_option;
    switch(navigation_option) {
        case "navigation_arrows": selected_navigation_option = document.getElementById("navigation_arrows"); break;
        case "players": selected_navigation_option = document.getElementById("text_game_player_menu"); break;
        case "quit": selected_navigation_option = document.getElementById("text_game_quit_topbar"); break;
        case "restart": selected_navigation_option = document.getElementById("text_game_restart_topbar"); break;
        default: break;
    }

    if (display == true) {
        selected_navigation_option.style.display = "inline-flex";
        selected_navigation_option.style.justifyContent = "center";
    } else {
        selected_navigation_option.style.display = "none";
    }
}

function updateGameCycleIndicator() {
    const database_length = game.current_gamemode.database_length;

    let max_sentences;
    if (database_length < game.max_sentence_amount) {
        max_sentences = database_length;
    } else {
        max_sentences = game.max_sentence_amount;
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
    original_sentence=undefined,
    sentence_keys=undefined,
    formatted_sentence=undefined,
    key=undefined,
    type=undefined,
    color=undefined,
    pack_id=undefined,
    validated=undefined,
}
) {
    const offset_sentence_id = (game.cycle_id) + posOffset;
    if (posOffset > 0) {
        for (let i = 0; i < posOffset; i++) {
            const sentence_history_content = {
                id: "A0000000000000",
                formatted_sentence:"none"
            }
            game.sentence_history.push(sentence_history_content);
        }
    }
    const sentence_history_item = {
        original_sentence: original_sentence,
        sentence_keys: sentence_keys,
        formatted_sentence: formatted_sentence,
        key: key,
        type: type,
        color : color,
        pack_id : pack_id,
        validated : validated,
    }

    if (game.sentence_history[game.cycle_id] == undefined) {
        game.sentence_history.push(sentence_history_item);
    } else if (game.sentence_history[offset_sentence_id].formatted_sentence == "none") {
        game.sentence_history[offset_sentence_id] = sentence_history_item;
    }
}

function randomSip() {
    const sip_min = game.sip.min;
    const sip_max = game.sip.max;
    const step = sip_max - sip_min;

    const random_sip = Math.floor(Math.random() * (step + 1)) + sip_min;

    return random_sip;
}

function escapeHTML(text) {
    return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function sanitizeExternalText(text) {
    return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getSpanClasses() {
    if (game.display_color_indicator == true) {
        return {
            sip: "span_highlight span_sip",
            player: "span_highlight span_player",
            team: "span_highlight span_team"
        };
    }
    return { sip: "", player: "", team: "" };
}

function applyTokens(template, player_name_list, teams, spanClasses) {
    const keys = [];
    const availablePlayers = [...player_name_list];
    let is_modified = false;

    // Un backslash-dollar (\$) est un dollar littéral, protégé du remplacement de token.
    const DOLLAR_PLACEHOLDER = '\uE000';
    const masked = template.replace(/\\\$/g, DOLLAR_PLACEHOLDER);

    const formatted = masked.replace(/%s|\$|%t/g, token => {
        let value;
        let html;

        switch (token) {
            case '%s': {
                const index = Math.floor(Math.random() * availablePlayers.length);
                value = availablePlayers.splice(index, 1)[0] ?? '[joueur]';
                html = `<span class='test ${spanClasses.player}'>${escapeHTML(value)}</span>`;
                keys.push({ type: 'player', value });
                is_modified = true;
                return html;
            }

            case '$': {
                value = randomSip();
                html = `<span class='${spanClasses.sip}'>${value}</span>`;
                keys.push({ type: 'sip', value });
                is_modified = true;
                return html;
            }

            case '%t': {
                value = Math.random() < 0.5 ? teams.team_1 : teams.team_2;
                html = `<span class='${spanClasses.team}'>${escapeHTML(value)}</span>`;
                keys.push({ type: 'team', value });
                is_modified = true;
                return html;
            }

            default:
                return token;
        }
    });

    return { formatted: formatted.replace(/\uE000/g, '$'), keys, is_modified };
}

function applyQuotes(formatted, quotesIndicator) {
    const quoteStyles = {
        italic: 'fst-italic',
        underline: 'text-decoration-underline',
        highlight: 'bg-yellow text-black',
        white_on_black: 'bg-black text-light',
        black_on_white: 'bg-light text-black'
    };

    if (quotesIndicator !== 'none' && quoteStyles[quotesIndicator]) {
        return formatted.replace(
            /"([^"]+)"/g,
            `<span class="quotes_highlight ${quoteStyles[quotesIndicator]}">$1</span>`
        );
    }
    return formatted;
}

function textReplacer(text) {
    if (text == undefined) {
        console.error("La phrase n'est pas définie. (textReplacer)");
        return { original_sentence: "", keys: [], formatted_sentence: "", is_modified: false };
    }

    const original_sentence = text;
    const spanClasses = getSpanClasses();
    const player_name_list = game.player_list.map(player => player.player_name);

    // Remplacement des tokens dynamiques avec suivi des clés
    const tokenResult = applyTokens(
        original_sentence,
        player_name_list,
        { team_1: game.team_1 || "TEAM1", team_2: game.team_2 || "TEAM2" },
        spanClasses
    );

    // Gestion des guillemets
    const formatted_sentence = applyQuotes(tokenResult.formatted, game.quotes_indicator);

    return {
        original_sentence: original_sentence,
        keys: tokenResult.keys,
        formatted_sentence: formatted_sentence,
        is_modified: tokenResult.is_modified
    };
}

function applyTextModifiers(original_sentence, keys) {
    let html_span_sip;
    let html_span_player;
    let html_span_team;
    let html_span_end;
    if (game.display_color_indicator == true) {
        html_span_sip = "<span class=\"span_sip\">";
        html_span_player = "<span class=\"span_player\">";
        html_span_team = "<span class=\"span_team\">";
        html_span_end = "</span>";
    } else {
        html_span_sip = "";
        html_span_player = "";
        html_span_team = "";
        html_span_end = "";
    }

    // Un backslash-dollar (\$) est un dollar littéral, protégé du remplacement de token.
    const DOLLAR_PLACEHOLDER = '\uE000';
    let formatted_sentence = original_sentence.replace(/\\\$/g, DOLLAR_PLACEHOLDER);

    keys.forEach(modifier => {
        switch (modifier.type) {
            case 'sip':
                formatted_sentence = formatted_sentence.replace('$', html_span_sip + escapeHTML(modifier.value) + html_span_end);
                break;
            case 'player':
                formatted_sentence = formatted_sentence.replace('%s', html_span_player + escapeHTML(modifier.value) + html_span_end);
                break;
            case 'team':
                formatted_sentence = formatted_sentence.replace('%t', html_span_team + escapeHTML(modifier.value) + html_span_end);
                break;
        }
    });
    
    return formatted_sentence.replace(/\uE000/g, '$');
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

function changeQpucAnswerDisplay(value) {
    game.qpuc.answer_display = value;
    document.getElementById("input_qpuc_answer_display").value = value;
    if (isQpucHighlightedSentence()) {
        resetQpucSentenceReveal();
    }
}

function settingsTextPreview() {
    const text = `Qu'elles sont "jolies" les $ petites fleurs de %s`;
    const formatted_text = textReplacer(text).formatted_sentence
    document.getElementById("text_settings_quotes_visualization_playground").innerHTML = formatted_text;
}

function displaySentenceList() {
    global.modal_sentence_list.show();
    modal_sentence_list_content.innerHTML = "";

    let html_element = "";
    for (let i = 0; i < game.sentence_history.length; i++) {
        const color = game.sentence_history[i].color;
        const sentence = game.sentence_history[i].formatted_sentence;

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
    const groland_names = ["Ricard","Bertrude","Zolande","Alpipignoux","Fifrelin","Anisette","Migreline","Giclette","Fanchon","Patimbert","Flinflin","Pantoufline","Childibert","Tringolin","Mimeline","Fricadène","Monique"];
    for (let i=0; i<amount; i++) {
        const random = Math.round(Math.random() * (groland_names.length-1))
        addPlayer(groland_names[random]);
        groland_names.splice(random, 1);
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
        if (specific == "all" || specific == "qpuc") {
            const qpuc_sounds = {
                qpuc_timer: './src/audio/clock_effect.mp3',
                qpuc_jingle_fin: './src/audio/jingle_fin.mp3',
                qpuc_passage_de_main: './src/audio/passage_de_main.mp3',
                qpuc_points: './src/audio/points.mp3',
                qpuc_qualif: './src/audio/qualif.mp3',
                qpuc_sound_110: './src/audio/sound_110.mp3',
                qpuc_buzzer: './src/audio/sound_114_buzzer.mp3',
                qpuc_timeout: './src/audio/timeout.mp3',
                qpuc_wrong_answer: './src/audio/wrong_answer.mp3',
            };
            for (const [key, src] of Object.entries(qpuc_sounds)) {
                if (typeof Audio == "undefined") break;
                global.audio[key] = new Audio(src);
                global.audio[key].loop = false;
            }
        }
    }
}

function playsound(sound) {
    if (global.audio_enabled == true) {
        let audio = null;
        switch (sound) {
            case "weakest_link_amb_60":
                audio = global.audio.weakest_link_amb_60;
                break;
            case "weakest_link_amb_end":
                audio = global.audio.weakest_link_amb_end;
                break;
            case "qpuc_timer":
                audio = global.audio.qpuc_timer;
                break;
            case "qpuc_jingle_fin":
                audio = global.audio.qpuc_jingle_fin;
                break;
            case "qpuc_passage_de_main":
                audio = global.audio.qpuc_passage_de_main;
                break;
            case "qpuc_points":
                audio = global.audio.qpuc_points;
                break;
            case "qpuc_qualif":
                audio = global.audio.qpuc_qualif;
                break;
            case "qpuc_sound_110":
                audio = global.audio.qpuc_sound_110;
                break;
            case "qpuc_buzzer":
                audio = global.audio.qpuc_buzzer;
                break;
            case "qpuc_timeout":
                audio = global.audio.qpuc_timeout;
                break;
            case "qpuc_wrong_answer":
                audio = global.audio.qpuc_wrong_answer;
                break;
            default:
                break;
        }
        if (audio != null) {
            if (audio._fadeInterval) { clearInterval(audio._fadeInterval); delete audio._fadeInterval; }
            audio.volume = 1;
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("Audio play failed:", e));
        }
    }
}

function fadeOutSound(audio) {
    if (audio == undefined || audio.paused) { return; }
    if (audio._fadeInterval) { clearInterval(audio._fadeInterval); }

    const steps = 20;
    const start_volume = audio.volume;
    let i = 0;
    audio._fadeInterval = setInterval(() => {
        i++;
        if (i >= steps) {
            clearInterval(audio._fadeInterval);
            delete audio._fadeInterval;
            audio.pause();
            audio.currentTime = 0;
            audio.volume = start_volume;
        } else {
            audio.volume = start_volume * (1 - (i / steps));
        }
    }, game.weakest_link.fade_out_time / steps);
}

function stopsound(sound) {
    if (global.audio_enabled == true) {
        switch (sound) {
            case "weakest_link_amb_60":
                fadeOutSound(global.audio.weakest_link_amb_60);
                break;
            case "weakest_link_amb_end":
                fadeOutSound(global.audio.weakest_link_amb_end);
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
    } else {
        global.accept_cookie = false;
        global.remind_warning_panel = false;
        storeSettingsCookie()
    }
    
    displayPage('menu')
}

function DEBUG_carthage(debug) {
    if (debug) {
        game.debug = true;
        showToast("Bienvenue à Carthage.", "bg-success text-white border-0");
        document.getElementById("gamename_menu").innerHTML = "CODE LYOKOLITO";
        // document.getElementById("debug_tools_placeholder").style.display = "block";
        document.getElementById("debug_button_add_player").classList.remove("d-none");
        document.getElementById("debug_button_quit_debug").classList.remove("d-none");

        // Modèle de base de données 
        document.getElementById("db_manager_modal_experimental_settings").classList.remove("d-none");
        
        // QPUC 
        document.getElementById("mix_db_section_qpuc").classList.remove("d-none");
        document.getElementById("nav_menu_qpuc").classList.remove("d-none");
        document.getElementById("settings_qpuc_section").classList.remove("d-none");

        
    } else {
        game.debug = false;
        showToast("Retour vers le passé.", "bg-warning text-dark border-0");

        global.modal_player_menu.hide()

        document.getElementById("gamename_menu").innerHTML = "PICOLITO";
        // document.getElementById("debug_tools_placeholder").style.display = "none";
        document.getElementById("debug_button_add_player").classList.add("d-none");
        document.getElementById("debug_button_quit_debug").classList.add("d-none");

        // Modèle de base de données
        document.getElementById("db_manager_modal_experimental_settings").classList.add("d-none");

        // QPUC 
        document.getElementById("mix_db_section_qpuc").classList.add("d-none");
        document.getElementById("nav_menu_qpuc").classList.add("d-none");
        document.getElementById("settings_qpuc_section").classList.add("d-none");
    }
}

// ===================== DBManager =====================
const DBManager = {
    // Catalogue unifié (source de vérité) : entrées vanilla + externes, chacune taguée `source`
    catalog: [],

    loaded: [], // Bases chargées en mémoire (optionnel)

    // ---- Initialisation ----
    async init() {
        // Construire le catalogue : vanilla (constante module) + externes (index localStorage)
        const vanilla = game.vanilla_db_index || [];
        const external = JSON.parse(localStorage.getItem("db:index:external") || "[]");

        this.catalog = [
            ...vanilla.map(db => ({ ...db, source: "vanilla" })),
            ...external.map(db => ({ ...db, source: "external" }))
        ].map(db => this.checkAvailability(db));

        return this.catalog;
    },

    // ---- Récupérer une entrée du catalogue par id (option : source) ----
    getById(id, source = null) {
        return this.catalog.find(db => db.id === id && (source === null || db.source === source)) || null;
    },

    // ---- Persister l'index externe dans localStorage ----
    persistExternalIndex() {
        localStorage.setItem("db:index:external", JSON.stringify(this.catalog.filter(d => d.source === "external")));
    },

    // ---- Toutes les DB ----
    getAll() {
        if (game.only_display_current_language_databases) {
            return this.catalog.filter(db => db.language === global.current_language);
        }
        return this.catalog;
    },

    // ---- Vérifier la disponibilité d'une base (statique, sans requête réseau) ----
    checkAvailability(db) {
        return { ...db, available: !!db.url || this.loadLocal(db) != null };
    },

    // ---- Clé localStorage d'une base (pattern unique db:<id> depuis v0.37) ----
    storageKey(db) {
        return `db:${db.id}`;
    },

    // ---- Fetch JSON avec timeout ----
    async fetchJson(url, timeoutMs = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) throw new Error(`Requête échouée (${res.status})`);
            return await res.json();
        } finally {
            clearTimeout(timeoutId);
        }
    },

    // ---- Enrichir les entrées d'un pack (sanitisation + métadonnées) ----
    decorateEntries(data, db) {
        if (!Array.isArray(data.db)) return;
        for (const entry of data.db) {
            if (!entry) continue;
            if (db.source === "external") {
                // QPUC et Maillon Faible injectent question/reponse en innerHTML (audit 5d)
                ["text", "question", "reponse"].forEach(field => {
                    if (typeof entry[field] === "string") {
                        entry[field] = sanitizeExternalText(entry[field]);
                    }
                });
            }
            entry.pack_id = data.id;
            entry.bdd_id = data.id; // compat ancien cache localStorage
            entry.gamemode_type = data.gamemode;
        }
    },

    // ---- Mettre à jour le catalogue après un téléchargement ----
    updateIndexAfterDownload(db, data) {
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

        const idx = this.catalog.findIndex(e => e.id === db.id && e.source === db.source);
        if (idx !== -1) this.catalog[idx] = indexData;
        else this.catalog.push(indexData);

        // Seuls les packs externes sont persistés dans l'index localStorage
        if (db.source === "external") this.persistExternalIndex();
    },

    // ---- Charger depuis localStorage (avec migration one-shot des clés legacy vanilla:<id> / external:<id>) ----
    loadLocal(db) {
        const stored = localStorage.getItem(this.storageKey(db));
        if (stored != null) {
            try { return JSON.parse(stored); } catch { return null; }
        }

        const legacyKey = db.source ? `${db.source}:${db.id}` : null;
        if (legacyKey && legacyKey !== this.storageKey(db)) {
            const legacy = localStorage.getItem(legacyKey);
            if (legacy != null) {
                localStorage.setItem(this.storageKey(db), legacy);
                localStorage.removeItem(legacyKey);
                try { return JSON.parse(legacy); } catch { return null; }
            }
        }

        return null;
    },

    // ---- Télécharger une base ----
    async download(db) {
        const data = await this.fetchJson(db.url);

        // Ajout dans chaque ligne de l'id du pack et du mode de jeu
        this.decorateEntries(data, db);

        // Sauvegarder la base complète
        localStorage.setItem(this.storageKey(db), JSON.stringify(data));

        // Mettre à jour l'index
        this.updateIndexAfterDownload(db, data);

        return { data, version: data.version };
    },

    // ---- Rafraîchir une base ----
    async refresh(db) {
        const localData = this.loadLocal(db);
        if (!localData) {
            const result = await this.download(db);
            return { updated: true, from: "—", to: result.version };
        }

        let remoteData;
        try {
            remoteData = await this.fetchJson(db.url);
        } catch (err) {
            console.warn(`Mise à jour impossible pour ${db.id} : ${err.message}`);
            return { updated: false, version: localData.version };
        }

        if (remoteData.version !== localData.version) {
            this.decorateEntries(remoteData, db);
            localStorage.setItem(this.storageKey(db), JSON.stringify(remoteData));

            // ➕ Mettre à jour la version dans le catalogue + l'index externe
            if (db.source === "external") {
                const idx = this.catalog.findIndex(e => e.id === db.id && e.source === "external");
                if (idx !== -1) {
                    this.catalog[idx].version = remoteData.version;
                    this.persistExternalIndex();
                }
            }

            return { updated: true, from: localData.version, to: remoteData.version };
        }

        return { updated: false, version: localData.version };
    },


    // ---- Supprimer du localStorage ----
    unload(db) {
        localStorage.removeItem(this.storageKey(db));
    },

    // ---- Supprimer complètement une base externe ----
    forget(db) {
        this.unload(db);
        if (db.source === "external") {
            this.catalog = this.catalog.filter(e => !(e.id === db.id && e.source === "external"));
            this.persistExternalIndex();
        }
    }
};

function onlyDisplayCurrentLanguageDB() {
    const input = document.getElementById("input_show_only_current_language_db")
    game.only_display_current_language_databases = input.checked
    refreshDBList()
}

async function refreshDBList() {

    const modal_db_list = document.getElementById("modal_db_list");
    await DBManager.init();
    const allDBs = DBManager.getAll();

    modal_db_list.innerHTML = allDBs.map(getDBListItemTemplate).join("");

    // Met à jour les boutons des menus principaux
    updateGamemodeMenuButton(allDBs);

    // Met à jour la liste des bases de données déjà chargé dans l'explorateur
    databaseExplorerRefresh(allDBs);

    // Met à jour la liste des modes de jeu dans Mix
    updateMixGamemodeMenuList(allDBs);
}

function getSourceLabel(source) {
    return global.current_language_strings["db_manager_source_" + source] ?? source;
}

function getDBListItemTemplate(db) {
    const source = escapeHTML(db.source);
    const pack_id = escapeHTML(db.id);
    const local = DBManager.loadLocal(db);
    const localVersion = local?.version || "—";
    const cacheBadge = local ? `<span class="badge border text-dark m-1">${global.current_language_strings.db_manager_cached}</span>` : ``;
    const stateBadge = db.available ? `` : `<span class="badge border text-danger m-1">${global.current_language_strings.db_manager_unavailable}</span>`;
    const packDescription = db.pack_description ? `<span class="db-description" title="${escapeHTML(db.pack_description)}">${escapeHTML(db.pack_description)}</span>` : "";
    const actionBtnClass = local ? "btn-secondary" : "btn-success";
    const actionBtnIcon = local ? "bi-arrow-clockwise" : "bi-cloud-arrow-down";
    const actionBtnLabel = local
        ? global.current_language_strings.db_manager_refresh
        : global.current_language_strings.db_manager_load;
    const unloadBtn = local
        ? `<button class="btn btn-secondary" onclick="unloadDBFromManager('${pack_id}', '${source}')"><i class="bi me-2 bi-folder-x"></i> ${global.current_language_strings.db_manager_unload}</button>`
        : "";
    const forgetBtn = db.source === "external"
        ? `<button class="btn btn-dark" onclick="forgetDBFromManager('${pack_id}', '${source}')"><i class="bi me-2 bi-x-circle"></i> ${global.current_language_strings.db_manager_delete}</button>`
        : "";

    return `
        <li id="db-li-${source}-${pack_id}" class="list-group-item db-list-item d-flex flex-column">
            <div class="db-header d-flex flex-column">
                <div class="d-flex flex-column">
                    <strong class="db-title">${escapeHTML(db.pack_name || db.id)}</strong>
                    ${packDescription}
                    <div class="d-flex flex-wrap mt-1">
                        <span class="badge border m-1 ${db.source === "vanilla" ? "text-dark" : "text-info"}">${getSourceLabel(db.source)}</span>
                        <span class="badge border text-dark m-1">v${escapeHTML(localVersion)}</span>
                        ${cacheBadge}
                        ${getLanguageBadgeHTML(db)}
                        ${stateBadge}
                    </div>
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-secondary" ${db.available ? "" : "disabled"} onclick="downloadDBFromManager('${pack_id}', '${source}')">
                    <i class="bi me-2 bi-download"></i> ${global.current_language_strings.db_manager_download_file}
                </button>
                <button class="btn ${actionBtnClass} btn-action" ${db.available ? "" : "disabled"} onclick="refreshLoadDBFromManager('${pack_id}', '${source}')">
                    <i class="bi me-2 ${actionBtnIcon}"></i> ${actionBtnLabel}
                </button>
                ${unloadBtn}
                ${forgetBtn}
            </div>
        </li>`;
}

async function refreshLoadDBFromManager(pack_id, pack_source) {
    const db = DBManager.getById(pack_id, pack_source);
    if (!db) return;
    const local = DBManager.loadLocal(db);
    try {
        if (!local) await DBManager.download(db);
        else await DBManager.refresh(db);
        refreshDBList();
    } catch (err) { showToast(`Erreur (${db.id}) : ${err.message}`); }
}

function unloadDBFromManager(pack_id, pack_source) {
    const db = DBManager.getById(pack_id, pack_source);
    if (!db) return;
    DBManager.unload(db);
    refreshDBList();
}

function forgetDBFromManager(pack_id, pack_source) {
    const db = DBManager.getById(pack_id, pack_source);
    if (!db) return;
    showConfirmModal(
        `${global.current_language_strings.delete_definitive} ${db.id} ?`,
        () => { DBManager.forget(db); refreshDBList(); },
        global.current_language_strings.db_manager_delete
    );
}

function databaseExplorerRefresh(allDBs) {
    // Affiche dans le select les bases de données chargées en mémoire (localStorage) pour l'explorateur de base de données.
    const select = document.getElementById("db_explorer_list_select");

    // Filtrer les bases de données pour n'afficher que celles qui sont chargées en mémoire
    const loadedDBs = allDBs.filter(db => DBManager.loadLocal(db));

    const defaultOption = createOption({ id: "", pack_name: global.current_language_strings.db_manager_select_db, gamemode: "" }, true);

    const gamemodeLabels = {
        picolo: global.current_language_strings.picolo,
        je_n_ai_jamais: global.current_language_strings.je_n_ai_jamais,
        maillon_faible: global.current_language_strings.nav_menu_link_weakest_link,
        question_pour_un_champion: global.current_language_strings.nav_menu_link_question_pour_un_champion
    };

    const groups = new Map();
    for (const db of loadedDBs) {
        const gamemode = db.gamemode || "others";
        if (!groups.has(gamemode)) groups.set(gamemode, []);
        groups.get(gamemode).push({
            id: db.id,
            pack_name: db.pack_name,
            gamemode: db.gamemode
        });
    }

    const optgroups = [...groups.entries()].map(([gamemode, dbs]) => `
        <optgroup label="${escapeHTML(gamemodeLabels[gamemode] || gamemode)}">
            ${dbs.map(db => createOption(db)).join("")}
        </optgroup>`).join("");

    select.innerHTML = defaultOption + optgroups;

    function createOption(db, is_default = false) {
        const label = escapeHTML(db.pack_name);
        const value = is_default ? "" : `${escapeHTML(db.id)}:${escapeHTML(db.gamemode)}`;
        return `<option value="${value}">${label}</option>`;
    }
}

function refreshExplorerList(db) {
    // Affichage des phrase de la base de données sélectionnée dans l'explorateur de base de données (pack_source:pack_id)
    const db_explorer_list_list = document.getElementById("db_explorer_list_list");

    const [db_id, gamemode] = db.split(":");

    const db_data = getDBFromLocalStorage(db_id);
    if (!db_data) {
        db_explorer_list_list.innerHTML = `<li class="list-group-item db-list-item">Erreur lors du chargement de la base de données.</li>`;
        return;
    }

    const columns = getExplorerColumns(gamemode, db_data);

    const table = `
        <table class="table table-striped">
            <thead><tr>${columns.map(column => `<th>${escapeHTML(column.label)}</th>`).join("")}</tr></thead>
            <tbody>${db_data.map(entry => `<tr>${columns.map(column => `<td>${escapeHTML(entry[column.key])}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>`;

    db_explorer_list_list.innerHTML = table;
}

function getExplorerColumns(gamemode, db_data) {
    const L = global.current_language_strings;
    const columnsByGamemode = {
        picolo: [["type", L.db_manager_col_type], ["text", L.db_manager_col_text], ["key", L.db_manager_col_key], ["parent_key", L.db_manager_col_parent_key]],
        je_n_ai_jamais: [["text", L.db_manager_col_text]],
        maillon_faible: [["question", L.db_manager_col_question], ["reponse", L.db_manager_col_answer], ["difficulty", L.db_manager_col_difficulty]],
        question_pour_un_champion: [["series", L.db_manager_col_series], ["type", L.db_manager_col_type], ["theme", L.db_manager_col_theme], ["question", L.db_manager_col_question], ["reponse", L.db_manager_col_answer]]
    };

    const columns = columnsByGamemode[gamemode];
    if (columns) return columns.map(([key, label]) => ({ key, label }));

    const sample = db_data[0] || {};
    return Object.keys(sample).map(key => ({ key, label: key }));
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
    // NB : le mode QPUC n'affiche plus ses BDD ici (boutons de types à la place).
    // Les BDD QPUC sont désormais listées et activables dans la page "question_pour_un_champion".

    const je_n_ai_jamais_list = document.getElementById("gamemode_je_n_ai_jamais_db_list");
    const picolo_list = document.getElementById("gamemode_picolo_db_list");

    je_n_ai_jamais_list.innerHTML = allDBs
        .filter(db => db.gamemode === "je_n_ai_jamais")
        .map(getGamemodePackCardTemplate)
        .join("");
    picolo_list.innerHTML = allDBs
        .filter(db => db.gamemode === "picolo" || db.gamemode === "war")
        .map(getGamemodePackCardTemplate)
        .join("");
}

function getGamemodePackCardTemplate(db) {
    const pack_id = escapeHTML(db.id);
    const pack_source = escapeHTML(db.source);
    const gamemode_type = escapeHTML(db.gamemode);
    const pack_name = escapeHTML(db.pack_name);
    const pack_description = db.pack_description ? `<p>${escapeHTML(db.pack_description)}</p>` : ``;

    let additionalData = "";
    if (db.source != "vanilla" || game.only_display_current_language_databases == false) {
        additionalData = `<div class="d-flex justify-content-end">
                ${getLanguageBadgeHTML(db)}
                <span class="badge bg-dark m-1">${getSourceLabel(db.source)}</span>
                <span class="badge bg-dark m-1">${gamemode_type}</span>
            </div>`;
    }

    return `
        <div class="col-12 col-sm-6 col-xl-4 col-xxl-3 mb-4">
            <button class="btn btn-primary gamemode_${gamemode_type}_section w-100 h-100" onclick="startGamemodeFromCard('${pack_id}', '${pack_source}', '${gamemode_type}')">
                <div class="d-flex justify-content-between flex-column">
                    <h4 class="fw-bold h4 text-center w-100">${pack_name}</h4>
                    ${pack_description}
                    ${additionalData}
                </div>
            </button>
        </div>`;
}

function startGamemodeFromCard(pack_id, pack_source, gamemode_type) {
    selectGame({
        gamemode_type: gamemode_type,
        packs: [{ pack_id: pack_id, pack_source: pack_source }]
    });
}

function updateMixGamemodeMenuList(allDBs) {
    // allDBs provient de refreshDBList()

    const gamemode_to_list = [
        ["picolo", "gamemode_mix_picolo"],
        ["war", "gamemode_mix_picolo"],
        ["je_n_ai_jamais", "gamemode_mix_je_n_ai_jamais"],
        ["question_pour_un_champion", "gamemode_mix_question_pour_un_champion"]
    ];

    for (const [list_id, template_id] of gamemode_to_list) {
        document.getElementById(template_id).innerHTML = "";
    }

    for (const db of allDBs) {
        const html = getMixGamemodeSwitchTemplate(db);
        for (const [list_id, template_id] of gamemode_to_list) {
            if (db.gamemode == list_id) {
                document.getElementById(template_id).insertAdjacentHTML("beforeend", html);
            }
        }
    }
    return;
}

function getMixGamemodeSwitchTemplate(db) {
    const pack_id = escapeHTML(db.id);
    const pack_source = escapeHTML(db.source);
    const gamemode_type = escapeHTML(db.gamemode);
    const pack_name = escapeHTML(db.pack_name);

    let additionalData = "";
    if (pack_source != "vanilla" || game.only_display_current_language_databases == false) {
        additionalData = `<div class="d-flex justify-content-end">
                ${getLanguageBadgeHTML(db)}
                <span class="badge bg-dark m-1" title="${escapeHTML(db.url)}">${getSourceLabel(db.source)}</span>
            </div>`;
    }

    return `
        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="${pack_id}-checkbox"
                   onclick="updateSelectedMixGamemode({checked: this.checked, gamemode_type: '${gamemode_type}', pack_id: '${pack_id}', pack_source: '${pack_source}'})">
            <div class="d-flex w-100 justify-content-between">
                <label class="form-check-label" for="${pack_id}-checkbox">${pack_name}</label>
                <div class="d-flex justify-content-end gap-1">
                    ${additionalData}
                </div>
            </div>
        </div>`;
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
        if (global.debug==true) console.log('Valeur entrée :', value);
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

        // Nettoyage XSS : échappement du texte des BDD externes (text + question + reponse,
        // car QPUC et Maillon Faible injectent question/reponse en innerHTML — cf. audit 5d)
        if (!vanilla && Array.isArray(data.db)) {
            data.db.forEach(entry => {
                if (!entry) return;
                ["text", "question", "reponse"].forEach(field => {
                    if (typeof entry[field] === "string") {
                        entry[field] = sanitizeExternalText(entry[field]);
                    }
                });
            });
        }

        const indexData = {
            id: data.id,
            pack_name: data.pack_name,
            pack_description: data.pack_description,
            gamemode: data.gamemode,
            language: data.language,
            version: data.version,
            url: data.url,
            source: "external"
        };

        const existingIndex = DBManager.catalog.findIndex(db => db.id === data.id && db.source === "external");

        if (existingIndex !== -1) {
            const existingDB = DBManager.catalog[existingIndex];
            if (data.version > existingDB.version) {
                DBManager.catalog[existingIndex] = indexData;
                if (global.debug==true) console.log(`Index mis à jour : ${data.id} (v${existingDB.version} → v${data.version})`);
            } else {
                if (global.debug==true) console.log(`Index ignoré : ${data.id} (v${data.version} <= v${existingDB.version})`);
            }
        } else {
            DBManager.catalog.push(indexData);
            if (global.debug==true) console.log(`Nouvel index ajouté : ${data.id} (v${data.version})`);
        }

        // Persist index externe + cache unifié (db:<id>)
        DBManager.persistExternalIndex();
        localStorage.setItem(`db:${data.id}`, JSON.stringify(data));

        refreshDBList();

        if (file) {
            setExternalDBFileStatus("success", global.current_language_strings.external_db_import_success + data.id);
        }

    } catch (err) {
        console.error("Erreur lors du chargement de la base :", err);
        if (file) {
            setExternalDBFileStatus("error", global.current_language_strings.external_db_import_error + err.message);
        } else {
            showToast(`Erreur : ${err.message}`);
        }
    }
}

function setExternalDBFileStatus(type, message) {
    const el = document.getElementById("external_db_file_status");
    if (!el) return;
    el.textContent = message;
    el.className = type === "success" ? "text-success mt-1" : "text-danger mt-1";
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

async function downloadDBFromManager(pack_id, pack_source) {
    const db = DBManager.getById(pack_id, pack_source);
    if (!db) { return; }
    let data = DBManager.loadLocal(db);
    if (!data) {
        if (!db.url) {
            showToast(`Aucun cache ni URL pour ${db.id}.`);
            return;
        }
        try {
            data = await DBManager.fetchJson(db.url);
        } catch (err) {
            showToast(`Erreur (${db.id}) : ${err.message}`);
            return;
        }
    }
    downloadFileJSON(cleanDBExport(data), data.id || db.id);
}

function cleanDBExport(data) {
    const clean = { ...data };
    clean.db = (Array.isArray(data.db) ? data.db : []).map(entry => {
        const copy = { ...entry };
        delete copy.pack_id;
        delete copy.bdd_id;
        delete copy.gamemode_type;
        return copy;
    });
    return clean;
}

function showToast(message, className = "bg-danger text-white border-0") {
    const container = document.getElementById("toast_container");
    if (!container) { alert(message); return; }

    const toast = document.createElement("div");
    toast.className = `toast align-items-center ${className}`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${escapeHTML(message)}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    container.appendChild(toast);

    const bootstrapToast = new bootstrap.Toast(toast, { delay: 5000 });
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
    bootstrapToast.show();
}

function showConfirmModal(message, onConfirm, ok_label) {
    const message_el = document.getElementById("modal_confirm_message");
    const ok_btn = document.getElementById("modal_confirm_ok");
    const cancel_btn = document.getElementById("modal_confirm_cancel");
    if (!message_el || !ok_btn || !cancel_btn || !global.modal_confirm) {
        if (onConfirm && window.confirm(message)) { onConfirm(); }
        return;
    }
    message_el.textContent = message;
    ok_btn.textContent = ok_label || global.current_language_strings.modal_confirm_ok;
    cancel_btn.textContent = global.current_language_strings.modal_confirm_cancel;
    ok_btn.onclick = () => {
        global.modal_confirm.hide();
        if (onConfirm) { onConfirm(); }
    };
    global.modal_confirm.show();
}

function convertLangCodeToLanguage(lang) {
    switch(lang) {
        case "fr": return global.lang_fr;
        case "da": return global.lang_da;
        case "de": return global.lang_de;
        case "en": return global.lang_en;
        case "es": return global.lang_es;
        case "fi": return global.lang_fi;
        case "it": return global.lang_it;
        case "ja": return global.lang_ja;
        case "ko": return global.lang_ko;
        case "nb": return global.lang_nb;
        case "nl": return global.lang_nl;
        case "pt": return global.lang_pt;
        case "ru": return global.lang_ru;
        case "sv": return global.lang_sv;
        default: return global.current_language_strings.other;
    }
}

// ---- Signalisation des BDD hors langue d'affichage ----

// Vrai si la BDD est dans une langue différente de la langue d'affichage
function isLanguageMismatch(db) {
    return db != null && db.language != null && db.language !== global.current_language;
}

// Badge de langue coloré + icône éventuelle, selon la concordance
function getLanguageBadgeHTML(db) {
    const lang = convertLangCodeToLanguage(db.language ?? "");
    if (isLanguageMismatch(db)) {
        return `<span class="badge bg-warning border text-dark m-1" title="${escapeHTML(global.current_language_strings.database_language_mismatch_warning)}">
                    <i class="bi me-2 bi-exclamation-triangle"></i> ${escapeHTML(lang)}</span>`;
    }
    return `<span class="badge border text-dark m-1">${escapeHTML(lang)}</span>`;
}

// Toast d'avertissement au lancement si une BDD sélectionnée est hors langue
function warnLanguageMismatchIfNeeded() {
    const mismatched = game.current_gamemode.packs.filter(p => isLanguageMismatch(p));
    if (mismatched.length > 0) {
        showToast(global.current_language_strings.database_language_mismatch_toast, "bg-warning text-dark border-0");
    }
}
