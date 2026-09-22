function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    const jsonValue = JSON.stringify(value); // Convertir en JSON
    document.cookie = name + "=" + jsonValue + ";" + expires + ";path=/";
}

function deleteCookie(cookie_name) {
    document.cookie = cookie_name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function deleteAllCookies() {
    deleteCookie("player_list")
    deleteCookie("settings")
}
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
            const value = cookie.substring(name.length + 1);
            try {
                return JSON.parse(value); // Tenter de parser comme JSON
            } catch (error) {
                // console.error(`Erreur lors du parsing du cookie ${name} :`, error);
                return value; // Retourner la valeur brute si ce n'est pas du JSON
            }
        }
    }
    return null;
}
function modifyCookie(cookie_name, edited_value, days) {
    deleteCookie(cookie_name);
    setCookie(cookie_name, edited_value, days);
}

function storePlayerListCookie() {
    setCookie("player_list", game.player_list, global.cookie_expiration_delay);
}

function loadPlayerListFromCookie() {
    const storedPlayers = getCookie("player_list");
    if (storedPlayers && Array.isArray(storedPlayers)) {
        game.player_list = storedPlayers;
        refreshPlayerList();
    } else if (storedPlayers) {
        clearCorruptedCookies();
    }
}

function storePlayerListLocalStorage() {
    localStorage.setItem("player_list", JSON.stringify(game.player_list));
}

function loadPlayerListFromLocalStorage() {
    const storedPlayers = localStorage.getItem("player_list");
    if (storedPlayers) {
        try {
            const parsedPlayers = JSON.parse(storedPlayers);
            if (Array.isArray(parsedPlayers)) {
                game.player_list = parsedPlayers;
                refreshPlayerList();
            } else {
                localStorage.removeItem("player_list");
            }
        } catch (error) {
            localStorage.removeItem("player_list");
        }
    }
}

// ---- Réglages persistés ----

const SETTINGS_VERSION = 2;

// Source de vérité unique des réglages : clé du cookie, chemin d'accès dans game/global, type, défaut et index legacy (format v0.36)
const SETTINGS_SCHEMA = [
    { key: "display_color_indicator",                path: ["game", "display_color_indicator"],                  type: "boolean", default: true,        legacy_index: 0  },
    { key: "animation",                              path: ["game", "animation"],                                type: "boolean", default: true,        legacy_index: 1  },
    { key: "chug_enabled",                           path: ["game", "picolito", "chug_enabled"],                 type: "boolean", default: true,        legacy_index: 2  },
    { key: "virus_enabled",                          path: ["game", "picolito", "virus_enabled"],                type: "boolean", default: true,        legacy_index: 3  },
    { key: "social_posting_enabled",                 path: ["game", "picolito", "social_posting_enabled"],       type: "boolean", default: false,       legacy_index: 4  },
    { key: "sip_min",                                path: ["game", "sip", "min"],                               type: "int",     default: 1,          legacy_index: 5  },
    { key: "sip_max",                                path: ["game", "sip", "max"],                               type: "int",     default: 3,          legacy_index: 6  },
    { key: "chug_amount",                            path: ["game", "picolito", "chug_amount"],                  type: "int",     default: 1,          legacy_index: 7  },
    { key: "dark_mode",                              path: ["global", "dark_mode"],                              type: "string",  default: "bright",   legacy_index: 8  },
    { key: "accept_cookie",                          path: ["global", "accept_cookie"],                          type: "boolean", default: false,       legacy_index: 9  },
    { key: "remind_warning_panel",                   path: ["global", "remind_warning_panel"],                   type: "boolean", default: false,       legacy_index: 10 },
    { key: "weakest_link_tie_behaviour",             path: ["game", "weakest_link", "tie_behaviour"],            type: "string",  default: "weakest",   legacy_index: 11 },
    { key: "audio_enabled",                          path: ["global", "audio_enabled"],                          type: "boolean", default: true,        legacy_index: 12 },
    { key: "weakest_link_stop_at_max_chain",         path: ["game", "weakest_link", "stop_at_max_chain"],        type: "boolean", default: true,        legacy_index: 13 },
    { key: "weakest_link_max_chain",                 path: ["game", "weakest_link", "max_chain"],                type: "int",     default: 6,          legacy_index: 14 },
    { key: "weakest_link_difficulty_default_value",  path: ["game", "weakest_link", "difficulty_default_value"], type: "string",  default: "progressive", legacy_index: 15 },
    { key: "weakest_link_text_size",                 path: ["game", "weakest_link", "text_size"],                type: "string",  default: "normal",    legacy_index: 16 },
    { key: "qpuc_answer_display",                    path: ["game", "qpuc", "answer_display"],                 type: "string",  default: "click",    legacy_index: 17 },
    { key: "team_1_name",                            path: ["game", "team_1"],                                type: "string",  default: "Team 1",   legacy_index: undefined },
    { key: "team_2_name",                            path: ["game", "team_2"],                                type: "string",  default: "Team 2",   legacy_index: undefined },
];

function parseBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") return value.toLowerCase() === "true" || value === "1";
    return false;
}

function getByPath(path) {
    let current = window;
    for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
        if (current === undefined) return undefined;
    }
    return current;
}

function setByPath(path, value) {
    let current = window;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
}

function coerceValue(value, type, fallback) {
    switch (type) {
        case "boolean":
            return parseBoolean(value);
        case "int": {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? fallback : parsed;
        }
        case "string":
            return typeof value === "string" && value !== "" ? value : fallback;
    }
    return fallback;
}

function storeSettingsCookie() {
    const settings = {};
    for (const entry of SETTINGS_SCHEMA) {
        settings[entry.key] = getByPath(entry.path);
    }
    modifyCookie("settings", { version: SETTINGS_VERSION, settings }, global.cookie_expiration_delay);
}

function retrieveCookie() {
    setSettingsValuesByCookies();
}

function clearCorruptedCookies() {
    deleteCookie("player_list");
}

// Convertit l'ancien format positionnel (tableau v0.36 ou chaîne virgule) vers un objet clé/valeur
function migrateLegacySettings(legacyValues) {
    const settings = {};
    for (const entry of SETTINGS_SCHEMA) {
        if (entry.legacy_index !== undefined && legacyValues[entry.legacy_index] !== undefined) {
            settings[entry.key] = legacyValues[entry.legacy_index];
        }
    }
    return settings;
}

function setSettingsValuesByCookies() {
    const stored = getCookie("settings");
    if (stored == null) return; // aucun cookie → défauts conservés

    let settingsObj;
    if (Array.isArray(stored)) {
        // Format legacy v0.36 : tableau indexé par position
        settingsObj = migrateLegacySettings(stored);
    } else if (typeof stored === "string") {
        // Format legacy pré-JSON : chaîne séparée par des virgules
        settingsObj = migrateLegacySettings(stored.split(","));
    } else if (stored && typeof stored === "object" && stored.settings && typeof stored.settings === "object" && !Array.isArray(stored.settings)) {
        settingsObj = stored.settings;
    }

    if (!settingsObj) {
        // Modèle inconnu ou incompatible → alerte puis réinitialisation (migration vers 0.37)
        showToast(global.current_language_strings.cookie_settings_incompatible);
        deleteCookie("settings");
        return;
    }

    for (const entry of SETTINGS_SCHEMA) {
        const value = settingsObj[entry.key];
        if (value === undefined) continue; // valeur absente → défaut conservé
        setByPath(entry.path, coerceValue(value, entry.type, entry.default));
    }

    game.weakest_link.difficulty_selected = game.weakest_link.difficulty_default_value;
    updateHTMLSettingsByVar();
}

function displayCookieList() {
    let html_content = "";
    for (const entry of SETTINGS_SCHEMA) {
        const value = getByPath(entry.path);
        html_content += "<p><code>" + entry.key + " : <span class=\"cookie_var\">" + value + "</span></code></p>";
    }
    herge_bt_display_cookies_placeholder.innerHTML = html_content;
}
