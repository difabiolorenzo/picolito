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

function defaultVariables() {
    global = {
        current_language: "fr",
        debug: false,
        dark_mode: "bright",
        cookie_expiration_delay: 30,
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

        modal_player_menu: new bootstrap.Modal(document.getElementById('modal_player_menu')),
        modal_sentence_modifier: new bootstrap.Modal(document.getElementById('modal_sentence_modifier')),
        safety_and_cookie_modal: new bootstrap.Modal(document.getElementById('safety_and_cookie_modal')),
        modal_sentence_list: new bootstrap.Modal(document.getElementById('modal_sentence_list')),
        modal_external_db: new bootstrap.Modal(document.getElementById('modal_external_db')),
        modal_file_protocol_warning: new bootstrap.Modal(document.getElementById('modal_file_protocol_warning'), { backdrop: "static", keyboard: false }),
        modal_confirm: new bootstrap.Modal(document.getElementById('modal_confirm'))
    }

    game = {
        picolito_version: "0.37.4.1",
        vanilla_db_index: VANILLA_DB_INDEX,

        mix_gamemode_list_picolo: [],

        player_list: [],
        max_player_number: -1,

        team_1: "",
        team_2: "",
        team_mode: false,

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
        ingame_font: "default",   // clé de INGAME_FONTS

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
    changeIngameFont(game.ingame_font);

    picolito_version_safety.innerHTML = `Picolito ${game.picolito_version}`;
    picolito_version_menu.innerHTML = `Picolito ${game.picolito_version}`;

    document.getElementById("input_show_only_current_language_db").checked = game.only_display_current_language_databases;

    menu_player_switch_team_mode.checked = game.team_mode;
    applyTeamModeVisibility();

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
    if (global.remind_warning_panel == true || global.remind_warning_panel == undefined) { global.safety_and_cookie_modal.show(); }
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

function changeClearInformationSettings(value) {
    game.display_color_indicator = value;
    document.getElementById("input_color_display_settings").checked = value;

    settingsTextPreview()
}

function changeQuotesVisualization(value) {
    game.quotes_indicator = value;

    settingsTextPreview()
}

// Polices du texte en jeu (@font-face dans main.css) ; null = police par défaut du thème
const INGAME_FONTS = {
    default: null,
    outfit: "'Outfit', sans-serif",
    cascadia_mono: "'Cascadia Mono', monospace"
};

function changeIngameFont(value) {
    if (!Object.prototype.hasOwnProperty.call(INGAME_FONTS, value)) { value = "default"; }
    game.ingame_font = value;
    document.getElementById("input_ingame_font").value = value;

    const family = INGAME_FONTS[value];
    if (family) {
        document.documentElement.style.setProperty("--ingame-font-family", family);
    } else {
        document.documentElement.style.removeProperty("--ingame-font-family");
    }
}

function changeQpucAnswerDisplay(value) {
    game.qpuc.answer_display = value;
    document.getElementById("input_qpuc_answer_display").value = value;
    if (isQpucHighlightedSentence()) {
        resetQpucSentenceReveal();
    }
}

function DEBUG_RandomPlayer(amount) {
    const groland_names = ["Ricard","Bertrude","Zolande","Alpipignoux","Fifrelin","Anisette","Migreline","Giclette","Fanchon","Patimbert","Flinflin","Pantoufline","Childibert","Tringolin","Mimeline","Fricadène","Monique"];
    for (let i=0; i<amount; i++) {
        const random = Math.round(rng() * (groland_names.length-1))
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
        // document.getElementById("debug_tools_placeholder").classList.remove("d-none");
        document.getElementById("debug_button_add_player").classList.remove("d-none");
        document.getElementById("debug_button_quit_debug").classList.remove("d-none");

        // Modèle de base de données 
        document.getElementById("db_manager_experimental_section").classList.remove("d-none");

        // QPUC 
        document.getElementById("mix_db_section_qpuc").classList.remove("d-none");
        document.getElementById("nav_menu_qpuc").classList.remove("d-none");
        document.getElementById("settings_qpuc_section").classList.remove("d-none");

    } else {
        game.debug = false;
        showToast("Retour vers le passé.", "bg-warning text-dark border-0");

        global.modal_player_menu.hide()

        document.getElementById("gamename_menu").innerHTML = "PICOLITO";
        // document.getElementById("debug_tools_placeholder").classList.add("d-none");
        document.getElementById("debug_button_add_player").classList.add("d-none");
        document.getElementById("debug_button_quit_debug").classList.add("d-none");

        // Modèle de base de données
        document.getElementById("db_manager_experimental_section").classList.add("d-none");

        // QPUC 
        document.getElementById("mix_db_section_qpuc").classList.add("d-none");
        document.getElementById("nav_menu_qpuc").classList.add("d-none");
        document.getElementById("settings_qpuc_section").classList.add("d-none");
    }
}

// ===================== DBManager =====================
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
