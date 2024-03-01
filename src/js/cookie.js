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
    for(var i = 0; i <ca.length; i++) {
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
        game.shot_enabled,
        game.virus_enabled,
        game.social_posting_enabled,
        game.sip.min,
        game.sip.max,
        game.shot_amount,
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
    getSettingsCookie()
}

function getStoredPlayerListCookie() {
    var stored_players = getCookie("player_list").split(",");
    for (var i=0; i<stored_players.length; i++) {
        addPlayer(stored_players[i], "cookie");
    }
}

function getSettingsCookie() {
    if (getCookie("settings") != "") {
        var settings = getCookie("settings").split(",");
        game.display_color_indicator = JSON.parse(settings[0]);
        game.animation = JSON.parse(settings[1]);
    
        game.shot_enabled = JSON.parse(settings[2]);
        game.virus_enabled = JSON.parse(settings[3]);
        game.social_posting_enabled = JSON.parse(settings[4]);
        game.sip.min = parseInt(settings[5]);
        game.sip.max = parseInt(settings[6]);
        game.shot_amount = parseInt(settings[7]);
        global.dark_mode = settings[8];
        global.accept_cookie = parseBoolean(settings[9]);
        global.remind_warning_panel = parseBoolean(settings[10]);
        game.weakest_link.tie_behaviour = settings[11];
        global.audio_enabled = settings[12];
        game.weakest_link.stop_at_max_chain = settings[13];
        game.weakest_link.max_chain = settings[14];
        game.weakest_link.hide_answer = settings[15];
        game.password.word_to_find_amount = settings[16];

        updateHTMLSettingsByVar();
    }
}

function DEBUG_cookies_list() {

}