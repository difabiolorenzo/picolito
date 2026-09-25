const PICOLITO_URL = "https://difabiolorenzo.github.io/picolito/";

function setLanguageString() {
    global.lang_fr = "Français";
    global.lang_da = "Dansk";
    global.lang_de = "Deutsch";
    global.lang_en = "English";
    global.lang_es = "Español";
    global.lang_fi = "Suomalainen";
    global.lang_it = "Italiano";
    global.lang_ja = "日本語";
    global.lang_ko = "한국인";
    global.lang_nb = "Novegian";
    global.lang_nl = "Nederlands";
    global.lang_pt = "Português";
    global.lang_ru = "Русский";
    global.lang_sv = "Svensk";

    document.getElementById("text_menu_lang_en").innerHTML = global.lang_en;
    document.getElementById("text_menu_lang_fr").innerHTML = global.lang_fr;
    document.getElementById("text_menu_lang_it").innerHTML = global.lang_it;

    language = {
        fr: LANGUAGE_FR,
        it: LANGUAGE_IT,
        en: LANGUAGE_EN
    };
}

function updateCurrentLanguageString(lang) {
    input_language.value = lang
    switch (lang) {
        case "fr":
            global.current_language_strings = language.fr;
            global.current_language = "fr";
            break;
        case "it":
            global.current_language_strings = language.it;
            global.current_language = "it";
            break;
        // Seuls FR et IT ont un dictionnaire dédié ; toute autre langue retombe sur EN (default).
        default:
            global.current_language_strings = language.en;
            global.current_language = "en";
            break;
    }

    document.documentElement.lang = global.current_language;
    updateHTMLLanguageStrings()
}

const I18N_TARGETS = [
    // [id de l'élément, clé du dictionnaire, propriété à assigner (défaut : "innerHTML")]
    ["text_herge_bt", "herge_bt"],
    ["herge_bt_deny", "herge_bt_deny"],
    ["herge_bt_accept", "herge_bt_accept"],
    ["text_prevention_warning", "prevention_warning"],
    ["text_prevention_text_0", "prevention_text_0"],
    ["text_prevention_text_1", "prevention_text_1"],
    ["text_prevention_text_2", "prevention_text_2"],
    ["text_prevention_text_3", "prevention_text_3"],
    ["text_prevention_information_website_text", "prevention_information_website_text"],
    ["text_prevention_information_website", "prevention_information_website"],
    ["text_prevention_call_text", "prevention_call_text"],
    ["text_prevention_number", "prevention_number"],
    ["text_prevention_number_modality", "prevention_number_modality"],
    ["file_protocol_warning_title", "file_protocol_warning_title"],
    ["file_protocol_warning_text", "file_protocol_warning_text"],
    ["file_protocol_warning_ok", "file_protocol_warning_ok"],
    ["text_ingame_title", "virus", "innerText"],
    ["nav_menu_link_mix", "nav_menu_link_mix"],
    ["nav_menu_link_picolo", "nav_menu_link_picolo"],
    ["nav_menu_link_never", "nav_menu_link_never"],
    ["nav_menu_link_weakest_link", "nav_menu_link_weakest_link"],
    ["nav_menu_link_question_pour_un_champion", "nav_menu_link_question_pour_un_champion"],
    ["nav_menu_link_password", "nav_menu_link_password"],
    ["text_prevention_panel", "prevention_panel"],
    ["text_modal_sentence_modifier", "modal_sentence_modifier"],
    ["modal_sentence_modifier_end_debug", "modal_sentence_modifier_end_debug"],
    ["modal_sentence_modifier_next_button", "next_sentence"],
    ["modal_sentence_modifier_modify_button", "modify"],
    ["modal_sentence_list_title", "modal_sentence_list_title"],
    ["text_modal_player_menu_title", "players_capitalized"],
    ["menu_player_switch_team_mode_text", "team_mode"],
    ["menu_player_switch_team_mode_alert", "team_mode_alert"],
    ["menu_player_team_name_title", "team_name"],
    ["text_show_only_current_language_db", "show_only_current_language_db"],
    ["text_modal_external_db_link", "databases"],
    ["external_db_input", "external_db_link", "placeholder"],
    ["text_db_manager_db_manager", "db_manager_db_list"],
    ["text_db_manager_text_list", "db_manager_text_list"],
    ["text_db_manager_import_export", "db_manager_import_export"],
    ["text_db_import_url", "external_db_import_link"],
    ["text_db_import_file", "external_db_import_file"],
    ["text_db_manager_model", "db_manager_text_model"],
    ["modal_external_db_download_picolo_template", "external_db_download_picolo_template"],
    ["modal_external_db_download_je_n_ai_jamais_template", "external_db_download_je_n_ai_jamais_template"],
    ["text_modal_settings", "settings"],
    ["text_settings_picolo", "picolo"],
    ["text_settings_chug", "settings_chug"],
    ["text_settings_virus", "settings_virus"],
    ["text_settings_social", "settings_social_posting"],
    ["text_settings_min_sip", "settings_min_sip"],
    ["text_settings_sip_min", "sip_s"],
    ["text_settings_max_sip", "settings_max_sip"],
    ["text_settings_sip_max", "sip_s"],
    ["text_settings_display", "settings_display"],
    ["text_settings_language", "settings_language"],
    ["text_settings_dark_theme", "settings_dark_theme"],
    ["text_settings_darkmode_system", "settings_darkmode_system"],
    ["text_settings_darkmode_light", "settings_darkmode_light"],
    ["text_settings_darkmode_dark", "settings_darkmode_dark"],
    ["text_settings_information_highlight", "settings_information_highlight"],
    ["text_settings_quotes_visualization", "settings_quotes_visualization"],
    ["text_settings_quotes_visualization_none", "settings_quotes_visualization_none"],
    ["text_settings_quotes_visualization_italic", "settings_quotes_visualization_italic"],
    ["text_settings_quotes_visualization_underline", "settings_quotes_visualization_underline"],
    ["text_settings_quotes_visualization_highlight", "settings_quotes_visualization_highlight"],
    ["text_settings_quotes_visualization_white_on_black", "settings_quotes_visualization_white_on_black"],
    ["text_settings_quotes_visualization_black_on_white", "settings_quotes_visualization_black_on_white"],
    ["text_settings_animation", "settings_animation"],
    ["text_settings_others", "settings_others"],
    ["text_settings_save_settings", "settings_save_settings"],
    ["text_settings_delete_cookies", "settings_delete_all_cookies"],
    ["text_settings_information_signal_bug", "settings_report_bug"],
    ["text_settings_weakest_link", "settings_weakest_link"],
    ["text_settings_weakest_link_tie", "settings_weakest_link_tie"],
    ["text_settings_weakest_link_tie_strongest_link", "settings_weakest_link_tie_strongest_link"],
    ["text_settings_weakest_link_tie_weakest", "settings_weakest_link_tie_weakest"],
    ["text_input_weakest_link_soundtrack", "settings_weakest_link_soundtrack"],
    ["text_settings_weakest_link_max_chain", "settings_weakest_link_max_chain"],
    ["input_weakest_link_difficulty_default_value_progressive", "weakest_link_difficulty_progressive"],
    ["input_weakest_link_difficulty_selected_progressive", "weakest_link_difficulty_progressive"],
    
    ["input_weakest_link_max_chain_none", "settings_weakest_link_max_chain_none"],
    ["text_settings_weakest_link_difficulty_default_value", "settings_weakest_link_difficulty_default_value"],
    ["text_settings_weakest_link_difficulty_selected", "settings_weakest_link_difficulty_selected"],
    ["text_menu_weakest_link_difficulty", "menu_weakest_link_difficulty"],
    ["text_settings_weakest_link_text_size", "weakest_link_text_size"],
    ["input_weakest_link_text_size_small", "weakest_link_text_size_small"],
    ["input_weakest_link_text_size_normal", "weakest_link_text_size_normal"],
    ["input_weakest_link_text_size_big", "weakest_link_text_size_big"],
    ["text_settings_qpuc", "settings_qpuc"],
    ["text_settings_qpuc_answer_display", "settings_qpuc_answer_display"],
    ["text_settings_qpuc_answer_display_click", "settings_qpuc_answer_display_click"],
    ["text_settings_qpuc_answer_display_visible", "settings_qpuc_answer_display_visible"],
    ["text_settings_credits", "settings_credits"],
    ["text_gamemode_picolo", "picolo"],
    ["gamemode_picolo_db_list", "loading"],
    ["text_gamemode_je_n_ai_jamais", "je_n_ai_jamais"],
    ["text_gamemode_mix", "gamemode_mix"],
    ["text_gamemode_mix_subtitle", "gamemode_mix_subtitle"],
    ["gamodemode_mix_section_slider_picolo_probability_label", "gamemode_mix_probability"],
    ["gamodemode_mix_section_slider_je_n_ai_jamais_probability_label", "gamemode_mix_probability"],
    ["gamodemode_mix_section_slider_question_pour_un_champion_probability_label", "gamemode_mix_probability"],
    ["button_update_mix_gamemode_list", "next"],
    ["gamodemode_mix_section_title_picolo", "picolo"],
    ["gamodemode_mix_section_title_je_n_ai_jamais", "je_n_ai_jamais"],
    ["gamodemode_mix_section_title_question_pour_un_champion", "question_pour_un_champion"],
    ["text_gamemode_weakest_link_title", "gamemode_weakest_link_title"],
    ["text_gamemode_weakest_link_subtitle_1", "gamemode_weakest_link_subtitle_1"],
    ["text_gamemode_weakest_link_minimum_requirement", "weakest_link_minimum_requierement"],
    ["button_gamemode_weakest_link_start", "start"],
    ["text_gamemode_question_pour_un_champion_title", "gamemode_question_pour_un_champion_title"],
    ["text_gamemode_question_pour_un_champion_subtitle_1", "gamemode_question_pour_un_champion_subtitle_1"],
    ["qpuc_gamemode_type_neuf_points_gagnants", "qpuc_gamemode_type_neuf_points_gagnants"],
    ["qpuc_gamemode_type_quatre_a_la_suite", "qpuc_gamemode_type_quatre_a_la_suite"],
    ["qpuc_gamemode_type_face_a_face", "qpuc_gamemode_type_face_a_face"],
    ["qpuc_gamemode_type_jeu_decisif", "qpuc_gamemode_type_jeu_decisif"],
    ["qpuc_select_all", "qpuc_select_all"],
    ["qpuc_deselect_all", "qpuc_deselect_all"],
    ["qpuc_launch", "qpuc_launch"],
    ["qpuc_validate_good", "qpuc_validate_good"],
    ["qpuc_validate_bad", "qpuc_validate_bad"],
    ["text_gamemode_title_password", "gamemode_title_password"],
    ["text_gamemode_password_subtitle_1", "gamemode_password_subtitle_1"],
    ["text_gamemode_password_subtitle_2", "gamemode_password_subtitle_2"],
    ["text_gamemode_password_visit", "visit_website"],
    ["text_gamemode_password_warning_1", "gamemode_password_warning_1"],
    ["text_gamemode_password_warning_2", "gamemode_password_warning_2"],
    ["text_game_quit_topbar", "quit"],
    ["text_game_ready", "ready"],
    ["text_game_teams_ready", "game_team_modify"],
    ["text_game_teams_replay", "game_team_modify"],
    ["text_game_quit_ready", "back_to_menu"],
    ["text_game_start_button", "start"],
    ["text_game_endgame", "end_game"],
    ["text_game_quit", "quit"],
    ["text_game_restart", "restart"],
    ["text_game_restart_topbar", "restart"],
    ["menu_player_input", "enter_player_name", "placeholder"],
    ["menu_player_input_label", "enter_player_name"],
    ["external_db_input_label", "external_db_import_link"],
    ["text_menu_add", "add", "title"],
    ["text_weakest_link_rule_header", "weakest_link_rule_header"],
    ["text_weakest_link_rule_1", "weakest_link_rule_1"],
    ["text_weakest_link_rule_3", "weakest_link_rule_3"],
    ["text_weakest_link_rule_2", "weakest_link_rule_2"],
    ["text_weakest_link_rule_4", "weakest_link_rule_4"],
    ["weakest_link_stop_button", "quit"],
    ["weakest_link_start_button", "start"],
    ["weakest_link_quit_button", "quit"],
    ["weakest_link_question", "weakest_link_question"],
    ["weakest_link_reponse", "weakest_link_reponse"],
    ["weakest_link_text_smaller", "weakest_link_text_smaller", "aria-label"],
    ["weakest_link_text_bigger", "weakest_link_text_bigger", "aria-label"],
    ["skip_to_content", "accessibility_skip_link"],
    ["picolito_settings_collapse_header", "settings", "aria-label"],
    ["text_menu_add_player", "add_player", "aria-label"],
    ["picolito_advanced_settings_collapse_header", "databases", "aria-label"],
    ["external_db_add_button", "add", "aria-label"],
    ["text_game_player_menu", "players_capitalized", "aria-label"],
    ["game_cycle_previous_button", "previous_sentence", "aria-label"],
    ["game_cycle_next_button", "next_sentence", "aria-label"],
    ["meta_description", "meta_description", "content"],
    ["text_gamemode_menu", "gamemode", "title"],
    ["ingame_weakest_link_text_sip", "weakest_link_sip"],
    ["ingame_weakest_link_text_bank", "weakest_link_bank"],
    ["ingame_weakest_link_text_time", "weakest_link_time"],
    ["ingame_weakest_link_current_button_correct", "weakest_link_correct"],
    ["ingame_weakest_link_current_button_wrong", "weakest_link_wrong"],
    ["ingame_weakest_link_current_button_bank", "weakest_link_bank"],
    ["text_weakest_link_game_ended", "end_game"],
    ["ingame_weakest_link_text_questions_asked", "weakest_link_questions_asked"],
    ["weakest_link_ending_answer_button", "weakest_link_ending_answer_show"],
    ["weakest_link_restart_same_button", "weakest_link_restart_same"],
    ["weakest_link_restart_choose_button", "weakest_link_restart_choose"],
    ["menu_player_auto_balance_text", "team_balance_auto"],
    ["menu_player_close", "done"]


];

function updateHTMLLanguageStrings() {
    for (const [id, key, property = "innerHTML"] of I18N_TARGETS) {
        const el = document.getElementById(id);
        if (el) {
            let value = global.current_language_strings[key];
            if (key == "file_protocol_warning_text") {
                value = value.replace(/%s/g, `<a href="${PICOLITO_URL}" target="_blank" rel="noopener">${PICOLITO_URL}</a>`);
            }
            el[property] = value;
        } else {
            console.warn(`updateHTMLLanguageStrings : élément #${id} introuvable`);
        }
    }

    refreshDBList();
}
