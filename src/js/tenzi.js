function initTenzi() {
    setBackgroundStyleColor("tenzi");
    game.tenzi.dice_amount = 16;

    game.tenzi.die_data = []
    for (var i=0; i<game.tenzi.dice_amount; i++) {
        // 0 == valeur
        // true/false dès_est_disponible 
        game.tenzi.die_data.push([0, true])
    }
    game.tenzi.locked_dice_number = undefined;
    game.tenzi.choose_state = true;
    game.tenzi.remaining_die = game.tenzi.dice_amount;
    game.tenzi.dice_matching_in_this_try = false;
    game.tenzi.remaining_try = 3;
    game.tenzi.display_hint = true;

    TryTenzi()
    setTenziTryCount(3)
}

function ResetTenzi() {
    initTenzi()
    unlockTenziGame()
}

function TryTenzi() {
    for (var i=0; i<game.tenzi.dice_amount; i++) {
        dice_available_state = game.tenzi.die_data[i][1]
        if (dice_available_state == true) {
            var random_dice_number = Math.round(Math.random() * 5) + 1;
            game.tenzi.die_data[i][0] = random_dice_number
        }
    }

    if (game.tenzi.choose_state == false) {
        decreaseTenziTryCount();
    }
    displayTenziDie();

    if (game.tenzi.remaining_try == 0) {
        lockTenziGame();
    }
}

function displayTenziDie() {
    tenzi_html_content = document.getElementById("tenzi_dice_placeholder")
    tenzi_html_content.innerHTML = "";

    for (var i=0; i<game.tenzi.dice_amount; i++) {
        //Affichage de la valeur du dés N° i et de son activité ou non
        dice_number = game.tenzi.die_data[i][0]
        dice_available_state = game.tenzi.die_data[i][1]

        if (dice_available_state == true) {
            if (dice_number == game.tenzi.locked_dice_number && game.tenzi.display_hint == true) {
                var class_hint = "class=\"dice_hint\"";
            } else {
                var class_hint = "";
            }
            // Dès disponible
            tenzi_html_content.innerHTML += "<div id=\"tenzi_dice\" " + class_hint + " value=\"" + dice_number + "\" onclick=\"selectTenziDice("+ i +")\">" + dice_number + "</div>"
        } else {
            // Dès validé
            tenzi_html_content.innerHTML += "<div id=\"tenzi_dice\" class=\"dice_locked\">" + dice_number + "</div>"
        }
    }
}

function selectTenziDice(id) {
    // Si les données dans la case 1 est vrai alors validation de selection si premier tour

    if (game.tenzi.die_data[id][1] == true) {
        if (game.tenzi.choose_state == true || ( game.tenzi.choose_state == false && game.tenzi.die_data[id][0] == game.tenzi.locked_dice_number)) {
            game.tenzi.die_data[id][1] = false;
            tenzi_dice_placeholder.children[id].classList = "dice_locked";
            
            // Si dès séléctionner dans ce tour
            game.tenzi.dice_matching_in_this_try = true;
            game.tenzi.remaining_die--;
            setTenziTryCount(3);

            // Premier tour
            if (game.tenzi.choose_state == true) {
                game.tenzi.choose_state = false;
                game.tenzi.locked_dice_number = game.tenzi.die_data[id][0];
            } 

            unlockTenziGame()
        }
    }
}

function setTenziTryCount(value) {
    game.tenzi.remaining_try = value;
    document.getElementById("tenzi_progress").value = value
}

function decreaseTenziTryCount() {
    game.tenzi.remaining_try--;
    document.getElementById("tenzi_progress").value = game.tenzi.remaining_try;
}

function lockTenziGame() {
    document.getElementById("button_tenzi_try").disabled = true;
}

function unlockTenziGame() {
    document.getElementById("button_tenzi_try").disabled = false;
}