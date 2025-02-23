function setCookie(cookie_name, cookie_value) {
    var d = new Date();
    d.setTime(d.getTime() + ( global.cookie_expiration_delay*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    // console.log(cookie_name + "=" + cookie_value + ";" + expires + ";path=/;")
    document.cookie = cookie_name + "=" + cookie_value + ";" + expires + ";path=/;";
}

function deleteCookie(cookie_name) {
    document.cookie = cookie_name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function deleteAllCookies() {
    deleteCookie("player_list")
    deleteCookie("settings")
}

function getCookie(cookie_name) {
    var name = cookie_name + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i in ca) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

function modifyCookie(cookie_name, edited_value) {
    deleteCookie(cookie_name);
    setCookie(cookie_name, edited_value);
}

function storePlayerListCookie() {
    if (getCookie("player_list") == '') {
        setCookie("player_list", game.player_list);
    } else {
        modifyCookie("player_list", game.player_list)
    }
}

function storeSettingsCookie() {
    var settings = [
        game.display_color_indicator,
        game.animation,
        game.picolito.chug_enabled,
        game.picolito.virus_enabled,
        game.picolito.social_posting_enabled,
        game.sip.min,
        game.sip.max,
        game.picolito.chug_amount,
        global.dark_mode,
        global.accept_cookie,
        global.remind_warning_panel,
        game.weakest_link.tie_behaviour,
        global.audio_enabled,
        game.weakest_link.stop_at_max_chain,
        game.weakest_link.max_chain,
        game.weakest_link.hide_answer,
        game.password.word_to_find_amount,
        game.password.style
    ]

    if (getCookie("settings") == '') {
        setCookie("settings", settings);
    } else {
        modifyCookie("settings", settings)
    }
}

function retrieveCookie() {
    getStoredPlayerListCookie();
    setSettingsValuesByCookies();
}

function getStoredPlayerListCookie() {
    var stored_players = getCookie("player_list").split(",");
    for (var i = 0; i < stored_players.length; i++) {
        addPlayer(stored_players[i], "cookie");
    }
}

function setSettingsValuesByCookies() {
    if (getCookie("settings") != "") {
        var cookie_settings_value = getCookie("settings").split(",");
        global.cookie_settings_value = cookie_settings_value;

        game.display_color_indicator = JSON.parse(cookie_settings_value[0]);
        game.animation = JSON.parse(cookie_settings_value[1]);
        game.picolito.chug_enabled = JSON.parse(cookie_settings_value[2]);
        game.picolito.virus_enabled = JSON.parse(cookie_settings_value[3]);
        game.picolito.social_posting_enabled = JSON.parse(cookie_settings_value[4]);
        game.sip.min = parseInt(cookie_settings_value[5]);
        game.sip.max = parseInt(cookie_settings_value[6]);
        game.picolito.chug_amount = parseInt(cookie_settings_value[7]);
        global.dark_mode = cookie_settings_value[8];
        global.accept_cookie = parseBoolean(cookie_settings_value[9]);
        global.remind_warning_panel = parseBoolean(cookie_settings_value[10]);
        game.weakest_link.tie_behaviour = cookie_settings_value[11];
        global.audio_enabled = cookie_settings_value[12];
        game.weakest_link.stop_at_max_chain = cookie_settings_value[13];
        game.weakest_link.max_chain = cookie_settings_value[14];
        game.weakest_link.hide_answer = cookie_settings_value[15];
        game.password.word_to_find_amount = cookie_settings_value[16];
        game.password.style = cookie_settings_value[17];

        updateHTMLSettingsByVar();
    }
}

function displayCookieList() {
    var settings_name = [
        "game.display_color_indicator",
        "game.animation",
        "game.picolito.chug_enabled",
        "game.picolito.virus_enabled",
        "game.picolito.social_posting_enabled",
        "game.sip.min",
        "game.sip.max",
        "game.picolito.chug_amount",
        "global.dark_mode",
        "global.accept_cookie",
        "global.remind_warning_panel",
        "game.weakest_link.tie_behaviour",
        "global.audio_enabled",
        "game.weakest_link.stop_at_max_chain",
        "game.weakest_link.max_chain",
        "game.weakest_link.hide_answer",
        "game.password.word_to_find_amount",
        "game.password.style"
    ];

    global.cookie_settings_value = getCookie("settings").split(",");
    var html_content = "";
    for (var i = 0; i < global.cookie_settings_value.length; i++) {
        html_content += "<p><code>" + settings_name[i] + " : <span class=\"cookie_var\">" + global.cookie_settings_value[i] + "<span></code></p>"
    }

    herge_bt_display_cookies_placeholder.innerHTML = html_content;
}