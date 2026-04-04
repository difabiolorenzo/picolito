// MAILLON FAIBLE v2

// function functionPromesse() {
//   return new Promise((resolve) => {
//     console.log("functionPromesse résolue")
//   });
// }

// async function asyncCall() {
//   console.log("functionPromesse");
//   const result = await functionPromesse();
//   console.log(result);
// }

// asyncCall();

function initWeakestLink() {
    // Efface la base latente
    game.pending_db = [];

    testStoredDatabase({bdd_id: "maillon_faible_fr", source: "vanilla"});
    game.database = TAFFY(game.pending_db[0].db);
    
    displayPage("weakest_link");

    game.weakest_link.player_list = game.player_list
        .map(player => ({ player_name: player.player_name, team: player.team }))
        .sort((a, b) => a.player_name.localeCompare(b.player_name, "fr", { sensitivity: "base" }));
    game.weakest_link.current_player_index = 0;

    for (let i in game.weakest_link.player_list) {
        let player = game.weakest_link.player_list[i];

        player.useful_bank = 0;
        player.useless_bank = 0;
        player.saved_in_bank = 0;
        player.correct = 0;
        player.potential_chain_lost = 0;
        player.wrong = 0;
    }

    game.weakest_link.current_player_index = 0;
    game.weakest_link.chain = 0;
    game.weakest_link.bank = 0;

    game.weakest_link.time = 60
}

function quitWeakestLink() {
    document.getElementById("weakest_link_content").classList.add("d-none")
    document.getElementById("weakest_link_menu").classList.remove("d-none")
    document.getElementById("weakest_link_stop_button").classList.add("d-none")

    document.getElementById("weakest_link_content").classList.add("d-none")
    document.getElementById("weakest_link_ending").classList.add("d-none")

    clearInterval(weakestLinkTimer)
}

function startWeakestLink() {
    // affichage
    document.getElementById("weakest_link_content").classList.remove("d-none")
    document.getElementById("weakest_link_menu").classList.add("d-none")
    document.getElementById("weakest_link_stop_button").classList.remove("d-none")
    document.getElementById("weakest_link_content").classList.remove("d-none")

    // score et temps
    document.getElementById("ingame_weakest_link_score_sip").innerHTML = game.weakest_link.chain;
    document.getElementById("ingame_weakest_link_score_bank").innerHTML = game.weakest_link.bank;
    document.getElementById("ingame_weakest_link_time").innerHTML = "0:00";

    // question
    generateWeakestLinkSentence()

    // chrono    
    game.weakest_link.current_time = game.weakest_link.time ;
    weakestLinkCalcTime();
    // if (game.weakest_link.time == 60) { playsound("weakest_link_amb_60") }
    weakestLinkTimer = setInterval(function() { weakestLinkChrono() }, 1000);
    
    weakestLinkNextPlayer()
}

function endWeakestLink() {
    document.getElementById("weakest_link_content").classList.add("d-none");
    document.getElementById("weakest_link_ending").classList.remove("d-none");

    weakestLinkChangeNameShield("", false)
    endWeakestLinkAnalytics();
    calculateWeakestAndStrongestLinks();
    getLooserByAnalyticsWeakestLink();
}

function calculateWeakestAndStrongestLinks() {
    // Le tri doit se faire sur le nombre de bonnes réponses, puis sur les réponses utiles en banque, 
    // puis sur les réponses sauvées en banque, puis sur les réponses inutiles en banque, 
    // puis sur les réponses potentiellement perdues, puis sur les mauvaises réponses
    const players = game.weakest_link.player_list;
    
    if (!players || players.length === 0) {
        return;
    }

    // Réinitialisation des flags
    players.forEach(p => {
        p.is_weakest_link = false;
        p.is_strongest_link = false;
    });

    // Cas spécial : un seul joueur
    if (players.length === 1) {
        players[0].is_weakest_link = true;
        players[0].is_strongest_link = true;
        return;
    }

    // ==================== MAILLON FAIBLE ====================
    let weakest_ref = players.reduce((min, player) => {
        if (player.correct < min.correct) return player;
        if (player.correct > min.correct) return min;

        if (player.useful_bank < min.useful_bank) return player;
        if (player.useful_bank > min.useful_bank) return min;

        if (player.saved_in_bank < min.saved_in_bank) return player;
        if (player.saved_in_bank > min.saved_in_bank) return min;

        if (player.useless_bank > min.useless_bank) return player;
        if (player.useless_bank < min.useless_bank) return min;

        if (player.potential_chain_lost > min.potential_chain_lost) return player;
        if (player.potential_chain_lost < min.potential_chain_lost) return min;

        if (player.wrong > min.wrong) return player;
        // égalité totale → on garde le min actuel
        return min;
    });

    // ==================== MAILLON FORT ====================
    let strongest_ref = players.reduce((max, player) => {
        if (player.correct > max.correct) return player;
        if (player.correct < max.correct) return max;

        if (player.useful_bank > max.useful_bank) return player;
        if (player.useful_bank < max.useful_bank) return max;

        if (player.saved_in_bank > max.saved_in_bank) return player;
        if (player.saved_in_bank < max.saved_in_bank) return max;

        if (player.useless_bank < max.useless_bank) return player;
        if (player.useless_bank > max.useless_bank) return max;

        if (player.potential_chain_lost < max.potential_chain_lost) return player;
        if (player.potential_chain_lost > max.potential_chain_lost) return max;

        if (player.wrong < max.wrong) return player;
        // égalité totale → on garde le max actuel
        return max;
    });

    // ==================== MARQUAGE DES ÉGALITÉS ====================
    players.forEach(player => {
        // Maillon faible : tous ceux qui ont exactement les mêmes stats que weakest_ref
        if (player.correct === weakest_ref.correct &&
            player.useful_bank === weakest_ref.useful_bank &&
            player.saved_in_bank === weakest_ref.saved_in_bank &&
            player.useless_bank === weakest_ref.useless_bank &&
            player.potential_chain_lost === weakest_ref.potential_chain_lost &&
            player.wrong === weakest_ref.wrong) {
            player.is_weakest_link = true;
        }

        // Maillon fort : tous ceux qui ont exactement les mêmes stats que strongest_ref
        if (player.correct === strongest_ref.correct &&
            player.useful_bank === strongest_ref.useful_bank &&
            player.saved_in_bank === strongest_ref.saved_in_bank &&
            player.useless_bank === strongest_ref.useless_bank &&
            player.potential_chain_lost === strongest_ref.potential_chain_lost &&
            player.wrong === strongest_ref.wrong) {
            player.is_strongest_link = true;
        }
    });
}

function getLooserByAnalyticsWeakestLink() {
    const weakest_players = game.weakest_link.player_list.filter(p => p.is_weakest_link);
    const strongest_players = game.weakest_link.player_list.filter(p => p.is_strongest_link);

    const tie_behaviour = game.weakest_link.tie_behaviour;

    function strongestLinkBehaviour() {
        const player = strongest_players[0]; // on sait que length === 1 grâce au if
        document.getElementById("text_weakest_link_tie_beaviour_rule").innerHTML = 
            `${player.player_name}, ${global.current_language_strings.weakest_link_tie_behaviour_strongest_link_decides}`;
        console.log("strongest link behaviour applied", player.player_name);
    }

    function weakestLinkBehaviour() {
        const player = weakest_players[0]; // on sait que length === 1 grâce au if
        document.getElementById("text_weakest_link_tie_beaviour_rule").innerHTML = 
            `${player.player_name} ${global.current_language_strings.weakest_link_tie_behaviour_text_is_weakest_link}`;
        console.log("weakest link behaviour applied", player.player_name);
    }

    function randomWeakestLinkPlayer() {
        const random_index = Math.floor(Math.random() * weakest_players.length);
        const selected_player = weakest_players[random_index];
        document.getElementById("text_weakest_link_tie_beaviour_rule").innerHTML = 
            `${selected_player.player_name} ${global.current_language_strings.weakest_link_tie_behaviour_randomly_selected}`;
        console.log("random weakest link player selected", selected_player.player_name);
    }

    if (tie_behaviour === "strongest_link" && strongest_players.length == 1) {
        strongestLinkBehaviour();
        return;
    }
    if (tie_behaviour === "weakest" && weakest_players.length == 1) {
        weakestLinkBehaviour();
        return;
    }
    
    randomWeakestLinkPlayer()
}

function endWeakestLinkAnalytics() {
    const analytics_element = document.getElementById("weakest_link_analytics")
    analytics_element.innerHTML = ""

    for (let i in game.weakest_link.player_list) {
        let player = game.weakest_link.player_list[i];
        let status = "text-muted";
        
        if (player.is_weakest_link) { status = "text-danger"; }
        if (player.is_strongest_link) { status = "text-success"; }

        analytics_element.innerHTML += `<div class="
        col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3 col-xxl-3">
            <div class="card text-black p-3">
                <h3 class="fw-bold ${status}">${player.player_name}</h3>
                <span>${global.current_language_strings.weakest_link_vote_correct} : <span class="fw-bold text-success">${player.correct}</span></span>
                
                <span>${global.current_language_strings.weakest_link_vote_useful_bank} : <span class="fw-bold text-success">${player.useful_bank}</span></span>
                <span>${global.current_language_strings.weakest_link_vote_useless_bank} : <span class="fw-bold">${player.useless_bank}</span></span>
                <span>${global.current_language_strings.weakest_link_vote_saved_in_bank} : <span class="fw-bold text-success">${player.saved_in_bank}</span></span>
                
                <span>${global.current_language_strings.weakest_link_vote_potential_chain_lost} : <span class="fw-bold text-danger">${player.potential_chain_lost}</span></span>
                <span>${global.current_language_strings.weakest_link_vote_wrong} : <span class="fw-bold text-danger">${player.wrong}</span></span>
            </div>
        </div>`
    }
}

function generateWeakestLinkSentence() {
    let random_int = "";
    let database_id = "";
    let question = "";
    let reponse = "";

    // Tirage de la question/réponse
    function getRandomSentence() {
        random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        question = request[random_int].question;
        reponse = request[random_int].reponse;

        //remove sentence from db
        game.database().filter({ ___id: database_id }).remove();
    }

    // Lancement
    let request = game.database().get();
    getRandomSentence()

    // Affichage en jeu
    document.getElementById("weakest_link_question").innerHTML = question;
    document.getElementById("weakest_link_reponse").innerHTML = reponse;
}

function weakestLinkChrono() {
    if (game.weakest_link.current_time <= 0) {
        clearInterval(weakestLinkTimer);
        endWeakestLink()
        return
    }
    game.weakest_link.current_time--;
    weakestLinkCalcTime();
}

function weakestLinkCalcTime() {
    const time = game.weakest_link.current_time;

    var min = Math.floor(time/60)
    var sec = Math.floor(time%60)
    if (sec < 10) { sec = "0" + sec; }
    document.getElementById("ingame_weakest_link_time").innerHTML = min + ":" + sec
}
    
function weakestLinkCorrect() {
    // Statistiques joueur
    let player = game.weakest_link.player_list[game.weakest_link.current_player_index];
    player.correct++;

    // Chaine
    game.weakest_link.chain++;
    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;

    weakestLinkNextPlayer();
}

function weakestLinkWrong() {
    // Statistiques joueur
    let player = game.weakest_link.player_list[game.weakest_link.current_player_index]; 
    player.potential_chain_lost += game.weakest_link.chain;
    player.wrong++;

    game.weakest_link.chain = 0;
    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;

    weakestLinkNextPlayer()
}

function weakestLinkBank() {
    // game.weakest_link.player_analytics.bank_saved[game.weakest_link.player_turn_index] += game.weakest_link.chain;
    
    // Statistiques joueur
    let player = game.weakest_link.player_list[game.weakest_link.current_player_index]; 
    if (game.weakest_link.chain > 0) { // banque utile
        player.useful_bank++;
        player.saved_in_bank = game.weakest_link.chain;
    } else { // banque inutile
        player.useless_bank++;
    }

    game.weakest_link.bank += game.weakest_link.chain;
    game.weakest_link.chain = 0;

    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;
    ingame_weakest_link_score_bank.innerHTML = game.weakest_link.bank;

    if (game.weakest_link.stop_at_max_chain == true && game.weakest_link.bank >= game.weakest_link.max_chain) {
        // stopsound("weakest_link_amb_60");playsound("weakest_link_amb_end")
        clearInterval(weakestLinkTimer);
        endWeakestLink();
    }
}

function weakestLinkNextPlayer() {
    if (game.weakest_link.current_player_index + 1 == game.player_list.length) {
        game.weakest_link.current_player_index = 0;
    } else {
        game.weakest_link.current_player_index++;
    }  

    let player_id = game.weakest_link.current_player_index;
    let player_name = game.weakest_link.player_list[player_id].player_name;
    weakestLinkChangeNameShield(player_name.toUpperCase(), true)

    generateWeakestLinkSentence();
}

function weakestLinkChangeNameShield(name, animation) {
    const element = document.getElementById("ingame_weakest_link_current_player");
    
    if (animation == true) {
        // Animation bouclier
        element.className = "weakest_link_shield_player"
        setTimeout(function() { element.className = "weakest_link_shield_player changing_weakest_link_player" }, 1);
        setTimeout(function() {element.innerHTML = name;}, 250);
    } else {
        element.innerHTML = name;
    }

}

function DEBUG_weakestlink_add5sec() {
    if (global.debug == true) {
        var current_time_player = global.audio.weakest_link_amb_60.currentTime;
        var current_time = game.weakest_link.current_time;
    
        if ((current_time - 5) >= 5) {
            global.audio.weakest_link_amb_60.currentTime = current_time_player + 5;
            game.weakest_link.current_time = current_time - 5;
        }
    
        weakestLinkCalcTime();
    }
}