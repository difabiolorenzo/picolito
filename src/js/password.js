function initPassword() {
    game.password.word_to_find_left = undefined;
    game.password.word_status = [];
    game.password.words = [];

    manageIngameOptionDisplay(false, 'password', 'flex');
    manageIngameOptionDisplay(false, 'password_rule', 'none');
    manageIngameOptionDisplay(false, 'password_recap', 'none');
    
    if (game.password.style == "2009") {
        setBackgroundColor("password_2009");
    } else if (game.password.style == "2016") {
        setBackgroundColor("password_2016");
    }
    
    button_password_invalidate.disabled = true;
    button_password_pass.disabled = true;
    button_password_validate.disabled = true;

    password_ingame_status.innerHTML = "...";
    password_ingame_display.innerHTML = "...";

    initializeWords();
}

const indexesOf = (arr, item) => arr.reduce((acc, v, i) => (v === item && acc.push(i), acc),[]);

async function fetchWords() {
    try {
        const response = await fetch('https://trouve-mot.fr/api/random/' + game.password.word_to_find_amount);
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
        console.error('Error fetching trouve-mot.fr data:', error);
        return [];
    }
}

async function initializeWords() {
    game.password.words = await fetchWords();
    password_ingame_status.innerHTML = "";
    game.password.word_status = [];
    game.password.word_to_find = [];

    for (var i = 0; i < game.password.words.length; i++) {
        game.password.word_status.push(0)
        game.password.word_to_find.push([game.password.words[i][0], i])   //words = [["MOT1", 0],["MOT2", 1]...]
        password_ingame_status.innerHTML += "<span class='word_indicator'></span>"
    }
    console.log("word_to_find", game.password.word_to_find)

    passwordDisplayNextWord()
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
    game.password.word_to_find.shift()
    passwordDisplayNextWord()   
}

function passwordInvalidate() {
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.remove("highlighted");
    
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.add("disabled")
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.remove("pass");
    game.password.word_status[game.password.word_to_find[0][1]] = 2;
    game.password.word_to_find.shift()
    passwordDisplayNextWord()
}

function passwordPass() {
    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.remove("highlighted");

    password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.add("pass")
    game.password.word_status[game.password.word_to_find[0][1]] = 3;
    game.password.word_to_find.push([game.password.word_to_find[0][0],game.password.word_to_find[0][1]])
    game.password.word_to_find.shift()
    passwordDisplayNextWord()
}

function passwordDisplayNextWord() {
    if (game.password.word_to_find.length == 0) {
        password_displayRecap();
    } else {
        password_ingame_display.classList.remove("password-changing-word");
        setTimeout(function() { password_ingame_display.classList.add("password-changing-word"); }, 1);
        setTimeout(function() { password_ingame_display.innerHTML = game.password.word_to_find[0][0]; }, 250)
        password_ingame_status.childNodes[game.password.word_to_find[0][1]].classList.add("highlighted")
    }
}

function password_displayRecap() {
    password_recap.innerHTML = "";
    for (var i = 0; i < game.password.words.length; i++) {
        switch (game.password.word_status[i]) {
            case 1:
                var modifier = "correct"
            break;
            case 2:
                var modifier = "disabled"
            break;
            case 3:
                var modifier = "pass"
            break;
            default:
                var modifier = ""
            break;
        }
        password_recap.innerHTML += `<div class='recap_word password-shield'><div></div><span class='word_indicator ${modifier}'></span>${game.password.words[i]}</div>`
    }
    manageIngameOptionDisplay(true, 'password_recap', 'block')
    manageNavDisplay("restart",true)
}

function passwordWordAmountRemove() {
    game.password.word_to_find_amount--;
    passwordWordAmountRefreshOption()
}

function passwordWordAmountAdd() {
    game.password.word_to_find_amount++;
    passwordWordAmountRefreshOption()
}

function passwordWordAmountRefreshOption() {
    if (game.password.word_to_find_amount > 1) {
        document.getElementById("password_button_option_remove_word_amount").disabled = false;
    } else {
        document.getElementById("password_button_option_remove_word_amount").disabled = true;
    }
    if (game.password.word_to_find_amount < 10) {
        document.getElementById("password_button_option_add_word_amount").disabled = false;
    } else {
        document.getElementById("password_button_option_add_word_amount").disabled = true;
    }
    document.getElementById("password_button_option_word_amount").value = game.password.word_to_find_amount;
}