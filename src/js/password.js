function initPassword() {
    game.password.word_index = -1;
    game.password.word_to_find_left = undefined;
    game.password.word_status = [];
    game.password.words = [];

    manageIngameOptionDisplay(false, 'password', 'flex')
    manageIngameOptionDisplay(false, 'password_rule', 'none')
    manageIngameOptionDisplay(false, 'password_recap', 'none')
    updateGameBackgroundColor("password");

    button_password_invalidate.disabled = true;
    button_password_pass.disabled = true;
    button_password_validate.disabled = true;

    password_ingame_status.innerHTML = "..."
    password_ingame_display.innerHTML = "..."
    password_ingame_display.classList.remove("password-changing-word");

    initializeWords();
}

const indexesOf = (arr, item) => arr.reduce((acc, v, i) => (v === item && acc.push(i), acc),[]);

async function fetchWords() {
    try {
        const response = await fetch('https://trouve-mot.fr/api/random/' + game.password.word_to_find_amount);
        const data = await response.json();
        var word_arr = [];
        for (var i=0; i<data.length; i++) {
            word_arr.push(data[i].name.toUpperCase())
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
    game.password.word_index = -1;
    game.password.word_to_find_left = game.password.words.length;

    passwordGenerateWordList();

    password_ingame_status.innerHTML = "";
    game.password.word_status = [];
    for (var i=0; i<game.password.words.length; i++) {
        game.password.word_status.push(0)
        password_ingame_status.innerHTML += "<span class='word_indicator'></span>"
    }
    
    console.log("words", game.password.words)
}

function displayRecap() {
    password_recap.innerHTML = "";
    for (var i=0; i<game.password.words.length; i++) {
        switch (game.password.word_status[i]) {
            case 1:
                var modifier = " correct"
            break;
            case 2:
                var modifier = " disabled"
            break;
            case 3:
                var modifier = " pass"
            break;
            default:
                var modifier = ""
            break;
        }
        password_recap.innerHTML += "<div class='recap_word password-shield'><span class='word_indicator" + modifier + "'></span> " + game.password.words[i] + "</div>"
    }
    manageIngameOptionDisplay(true, 'password_recap', 'block')
    manageNavDisplay("restart",true)
}

function passwordGenerateWordList() {
    game.password.word_index++;
    if (game.password.word_index == 0) {
        button_password_validate.style.display = "inline-block";
        button_password_pass.style.display = "inline-block";
        button_password_invalidate.style.display = "inline-block";
        
        password_ingame_display.style.display = "flex";
        password_ingame_status.style.display = "flex";
    }
    if (game.password.word_index > game.password.words.length) {
        password_ingame_display.innerHTML = "..."
        initializeWords();
        return;
    }
    password_ingame_display.innerHTML = game.password.words[game.password.word_index];
}

function passwordValidate() {
    password_ingame_status.childNodes[game.password.word_index].classList.add("correct")
    game.password.word_status[game.password.word_index] = 1;
    game.password.word_to_find_left--;
    passwordUnlockWord()
}

function passwordPass() {
    password_ingame_status.childNodes[game.password.word_index].classList.add("pass")
    game.password.word_status[game.password.word_index] = 3;
    passwordUnlockWord()
}

function passwordInvalidate() {
    password_ingame_status.childNodes[game.password.word_index].classList.add("disabled")
    game.password.word_status[game.password.word_index] = 2;
    game.password.word_to_find_left--;
    passwordUnlockWord()
}

function passwordUnlockWord() {
    password_ingame_display.classList.remove("password-changing-word");
    setTimeout(function() { password_ingame_display.classList.add("password-changing-word"); }, 1);
    setTimeout(function() { password_ingame_display.innerHTML = game.password.words[game.password.word_index]; }, 250)
    
    if (game.password.words.length == game.password.word_index+1) {
        if (game.password.word_to_find_left == 0) {
            displayRecap();
        } else {
            console.log("display word passed", game.password.word_status, game.password.words)
            displayRecap();
        }
    }
    game.password.word_index++;
}