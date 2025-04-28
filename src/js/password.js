function initPassword() {
    game.password.word_to_find_left = undefined;
    game.password.word_status = [];
    game.password.words = [];

    manageIngameOptionDisplay(false, 'password', 'flex');
    manageIngameOptionDisplay(false, 'password_rule', 'none');
    manageIngameOptionDisplay(false, 'password_recap', 'none');

    setBackgroundStyleColor(game.password.style);
    
    button_password_invalidate.disabled = true;
    button_password_pass.disabled = true;
    button_password_validate.disabled = true;

    password_ingame_status.innerHTML = "...";
    password_ingame_display.innerHTML = "...";

    initializeWords();
}

const indexesOf = (arr, item) => arr.reduce((acc, v, i) => (v === item && acc.push(i), acc),[]);

async function fetchWordsfromAPI() {
    const PASSWORD_WEBSITE_API = 'https://trouve-mot.fr/api/random/';
    try {
        const response = await fetch(PASSWORD_WEBSITE_API + game.password.word_to_find_amount);
        const data = await response.json();
        var word_arr = [];
        for (var i = 0; i < data.length; i++) {
            word_arr.push([data[i].name.toUpperCase()])
        }
        if (word_arr.length > 0) {
            button_password_invalidate.disabled = false;
            button_password_pass.disabled = false;
            button_password_validate.disabled = false;
        }
        return word_arr;
    } catch (error) {
        console.error('Error fetching ' + PASSWORD_WEBSITE_API + ' data:', error);
        return [];
    }
}

async function fetchWordsLocal() {
    if (global.current_language == "fr") {
        if (game.stored_db.password_fr == undefined) {
            testStoredDatabase("password", "fr")
        }
    } else {
        alert("not fr")
    }
    

    var word_arr = [];
    for (var i = 0; i < game.stored_db.password_fr.length; i++) {
        word_arr.push([game.stored_db.password_fr[i].toUpperCase()])
    }
    if (word_arr.length > 0) {
        button_password_invalidate.disabled = false;
        button_password_pass.disabled = false;
        button_password_validate.disabled = false;
    }
    return word_arr;
}

async function initializeWords() {
    if (game.password.db_source == "trouve_mot_api") {
        game.password.words = await fetchWordsfromAPI();
    }
    if (game.password.db_source == "local") {
        game.password.words = await fetchWordsLocal();
    }

    if (game.password.words.length == 0) {
        alert("Aucun mot trouvé");
        return;
    }
    password_ingame_status.innerHTML = "";
    game.password.word_status = [];
    game.password.word_to_find = [];

    for (var i = 0; i < game.password.words.length; i++) {
        game.password.word_status.push(0);
        game.password.word_to_find.push([game.password.words[i][0], i]);   //words = [["MOT1", 0],["MOT2", 1]...]
        password_ingame_status.innerHTML += "<span class='word_indicator'></span>";
    }
    passwordDisplayNextWord();

    // MODE PREVIEW
    if (document.querySelector('input[name="radio_settings_password_mode"]:checked').value == "preview") {
        var list = document.getElementById("modal_password_preview_list");
        list.innerHTML = "";
        for (var i in game.password.words) {
            list.innerHTML += "<div class='password-shield'><div></div><span class='word_indicator'></span>" + game.password.words[i][0] + "</div>";
        }
        global.modal_password_preview.show();
        // Disparition du menu modal après game.password.hide_hint_after_seconds secondes

        //timer
        var timer = game.password.hide_hint_after_seconds
        if (game.password.words.length > 5) {
            timer = timer + (game.password.words.length / 5)
        }
        setTimeout(function() {
            // global.modal_password_preview.hide();
            document.getElementById("modal_password_preview_list").innerHTML = `<h1>${global.current_language_strings.modal_password_preview_ended}</h1>`
        }, timer * 1000);
    }
}

async function wikipediaDescription(word) {
    try {
        const response = await fetch('https://en.wiktionary.org/w/api.php?action=query&format=json&prop=extracts&titles=' + word);
        const data = await response.json();
        var result = [];
        for (var i in data.pages) {
            result.push(data.pages[i].excerpt)
        }
        return result;
    } catch (error) {
        console.error('Error fetching fr.wiktionary.org/w/rest.php/v1/search/page?q= data:', error);
        return [];
    }
}

function passwordGenerateWordList() {
    if (game.password.word_to_find.length > 0) {
        password_ingame_display.innerHTML = game.password.words[game.password.word_to_find[0][0]];
    }  
}

function passwordValidate() {
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.remove("highlighted");
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.add("correct")
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.remove("pass");
    game.password.word_status[game.password.word_to_find[0][1]] = 1;
    game.password.word_to_find.shift();
    passwordDisplayNextWord();
}

function passwordInvalidate() {
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.remove("highlighted");
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.add("disabled")
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.remove("pass");
    game.password.word_status[game.password.word_to_find[0][1]] = 2;
    game.password.word_to_find.shift();
    passwordDisplayNextWord();
}

function passwordPass() {
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.remove("highlighted");
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.add("pass");
    game.password.word_status[game.password.word_to_find[0][1]] = 3;
    game.password.word_to_find.push([game.password.word_to_find[0][0],game.password.word_to_find[0][1]])
    game.password.word_to_find.shift();
    passwordDisplayNextWord();
}

function passwordDisplayNextWord() {
    if (game.password.word_to_find.length == 0) {
        password_displayRecap();
    } else {
        password_ingame_display.classList.remove("password-changing-word");
        setTimeout(function() { password_ingame_display.classList.add("password-changing-word"); }, 1);
        setTimeout(function() { password_ingame_display.innerHTML = game.password.word_to_find[0][0]; }, 250)
        password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.add("highlighted");;
    }
}

function password_displayRecap() {
    password_recap_placeholder.innerHTML = "";
    for (var i = 0; i < game.password.words.length; i++) {
        switch (game.password.word_status[i]) {
            case 1:
                var modifier = "correct";
            break;
            case 2:
                var modifier = "disabled";
            break;
            case 3:
                var modifier = "pass";
            break;
            default:
                var modifier = "";
            break;
        }
        password_recap_placeholder.innerHTML += `<div class='recap_word password-shield'><div></div><span class='word_indicator ${modifier}'></span>${game.password.words[i]}</div>`
    }
    manageIngameOptionDisplay(true, 'password_recap', 'block');
    manageNavDisplay("restart",true);
}

function get_password_word_amount_selector_value() {
    var selected = document.querySelector('input[name="password_word_amount"]:checked');
    if (selected) {
        return selected.value;
    } else {
        return null;
    }
}