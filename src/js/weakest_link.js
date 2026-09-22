// MAILLON FAIBLE v2

async function initWeakestLink() {
    // Chargement direct de la base (plus de buffer pending_db)
    const data = await loadDatabase({pack_id: "maillon_faible_fr", source: "vanilla"});

    // Aucune base de données chargée (échec de téléchargement, file://, etc.)
    if (!data) {
        showToast(global.current_language_strings.db_load_error);
        displayPage("menu");
        return;
    }

    game.questions = data.db;
    
    displayPage("weakest_link");

    game.weakest_link.difficulty_selected = game.weakest_link.difficulty_default_value;
    input_weakest_link_difficulty_menu.value = game.weakest_link.difficulty_selected;

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
    game.weakest_link.questions_asked = 0;
}

function quitWeakestLink() {
    stopsound("weakest_link_amb_60")
    stopsound("weakest_link_amb_end")

    document.getElementById("weakest_link_content").classList.add("d-none")
    document.getElementById("weakest_link_menu").classList.remove("d-none")
    document.getElementById("weakest_link_stop_button").classList.add("d-none")

    document.getElementById("weakest_link_ending").classList.add("d-none")

    clearInterval(game.weakest_link.timer)
}

function startWeakestLink() {
    // affichage
    document.getElementById("weakest_link_content").classList.remove("d-none")
    document.getElementById("weakest_link_menu").classList.add("d-none")
    document.getElementById("weakest_link_stop_button").classList.remove("d-none")

    weakestLinkChangeTextSize(game.weakest_link.text_size)

    // score et temps
    document.getElementById("ingame_weakest_link_score_sip").innerHTML = game.weakest_link.chain;
    document.getElementById("ingame_weakest_link_score_bank").innerHTML = game.weakest_link.bank;
    document.getElementById("ingame_weakest_link_time").innerHTML = "0:00";
    document.getElementById("ingame_weakest_link_score_questions_asked").innerHTML = game.weakest_link.questions_asked || 0;

    // chrono    
    game.weakest_link.current_time = game.weakest_link.time ;
    weakestLinkCalcTime();
    preloadSound("weakest_link");
    playsound("weakest_link_amb_60");
    game.weakest_link.timer = setInterval(function() { weakestLinkChrono() }, 1000);

    // premier tour : joueur 0 (un seul tirage, bouclier affiché)
    let first_player = game.weakest_link.player_list[0];
    weakestLinkChangeNameShield(first_player.player_name.toUpperCase(), true);
    generateWeakestLinkSentence()
}

function endWeakestLink() {
    stopsound("weakest_link_amb_60")

    weakestLinkMoveQuestionToEnding();

    document.getElementById("weakest_link_content").classList.add("d-none");
    document.getElementById("weakest_link_ending").classList.remove("d-none");

    weakestLinkChangeNameShield("", false)
    calculateWeakestAndStrongestLinks();
    endWeakestLinkAnalytics();
    getLooserByAnalyticsWeakestLink();
}

async function restartWeakestLink(mode) {
    stopsound("weakest_link_amb_60")
    stopsound("weakest_link_amb_end")

    if (game.weakest_link.timer) { clearInterval(game.weakest_link.timer); }

    document.getElementById("weakest_link_ending").classList.add("d-none");

    if (mode === "choose") {
        // Nouvelle partie : retour au menu de difficulté (stats et questions réinitialisés)
        await initWeakestLink();
        document.getElementById("weakest_link_menu").classList.remove("d-none");
        document.getElementById("weakest_link_content").classList.add("d-none");
        document.getElementById("weakest_link_stop_button").classList.add("d-none");
        return;
    }

    // mode "same" : relance immédiate en conservant la difficulté du run terminé
    const difficulty = game.weakest_link.difficulty_selected;
    await initWeakestLink();
    game.weakest_link.difficulty_selected = difficulty
    input_weakest_link_difficulty_menu.value = difficulty
    startWeakestLink();
}

function weakestLinkMoveQuestionToEnding() {
    document.getElementById("weakest_link_ending_question_text").innerHTML = document.getElementById("weakest_link_question").innerHTML;
    document.getElementById("weakest_link_ending_answer_text").innerHTML = document.getElementById("weakest_link_reponse").innerHTML;

    document.getElementById("weakest_link_ending_answer_block").classList.add("d-none");
    weakestLinkEndingAnswerButtonLabel(false);
}

function weakestLinkEndingAnswerButtonLabel(visible) {
    document.getElementById("weakest_link_ending_answer_button").innerHTML =
        visible
            ? global.current_language_strings.weakest_link_ending_answer_hide
            : global.current_language_strings.weakest_link_ending_answer_show;
}

function toggleWeakestLinkEndingAnswer() {
    const block = document.getElementById("weakest_link_ending_answer_block");
    const is_hidden = block.classList.contains("d-none");

    if (is_hidden) { block.classList.remove("d-none"); } else { block.classList.add("d-none"); }

    weakestLinkEndingAnswerButtonLabel(is_hidden);
}

const WL_STAT_FIELDS = ["correct", "useful_bank", "saved_in_bank", "useless_bank", "potential_chain_lost", "wrong"];

function wlCompareStats(a, b, mode) {
    const dirs = mode === "weakest"
        ? ["low", "low", "low", "high", "high", "high"]
        : ["high", "high", "high", "low", "low", "low"];

    for (let i = 0; i < WL_STAT_FIELDS.length; i++) {
        const key = WL_STAT_FIELDS[i];
        if (a[key] === b[key]) continue;
        const prefer = dirs[i];
        return prefer === "low" ? (a[key] < b[key] ? -1 : 1) : (a[key] > b[key] ? -1 : 1);
    }
    return 0;
}

function wlPlayersEqual(a, b) {
    return WL_STAT_FIELDS.every(key => a[key] === b[key]);
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

    // MAILLON FAIBLE
    const weakest_ref = players.reduce((min, player) => (wlCompareStats(player, min, "weakest") < 0 ? player : min));

    // MAILLON FORT
    const strongest_ref = players.reduce((max, player) => (wlCompareStats(player, max, "strongest") < 0 ? player : max));

    // MARQUAGE DES ÉGALITÉS
    players.forEach(player => {
        // Maillon faible : tous ceux qui ont exactement les mêmes stats que weakest_ref
        if (wlPlayersEqual(player, weakest_ref)) {
            player.is_weakest_link = true;
        }

        // Maillon fort : tous ceux qui ont exactement les mêmes stats que strongest_ref
        if (!player.is_weakest_link && wlPlayersEqual(player, strongest_ref)) {
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
            `<span class="fw-bold">${escapeHTML(player.player_name)}</span>, ${global.current_language_strings.weakest_link_tie_behaviour_strongest_link_decides}`;
        if (global.debug==true) console.log("strongest link behaviour applied", player.player_name);
    }

    function weakestLinkBehaviour() {
        const player = weakest_players[0]; // on sait que length === 1 grâce au if
            document.getElementById("text_weakest_link_tie_beaviour_rule").innerHTML = 
            `<span class="fw-bold">${escapeHTML(player.player_name)}</span> ${global.current_language_strings.weakest_link_tie_behaviour_text_is_weakest_link}`;
        if (global.debug==true) console.log("weakest link behaviour applied", player.player_name);
    }

    function randomWeakestLinkPlayer() {
        const candidates = weakest_players.length > 0 ? weakest_players : game.weakest_link.player_list;
        const random_index = Math.floor(Math.random() * candidates.length);
        const selected_player = candidates[random_index];
        document.getElementById("text_weakest_link_tie_beaviour_rule").innerHTML = 
            `<span class="fw-bold">${escapeHTML(selected_player.player_name)}</span> ${global.current_language_strings.weakest_link_tie_behaviour_randomly_selected}`;
        if (global.debug==true) console.log("random weakest link player selected", selected_player.player_name);
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

    const statBold = value => value >= 1 ? "fw-bold" : "";

    const cards = [];
    for (let i in game.weakest_link.player_list) {
            let player = game.weakest_link.player_list[i];
            let status = "text-muted";
            
            if (player.is_weakest_link) { status = "text-danger"; }
            if (player.is_strongest_link) { status = "text-success"; }
    
            let bonus_score_text_color = "";
            let malus_score_text_color = "";
    
            let correct_text_color = ""
            let useful_bank_text_color = ""
            let useless_bank_text_color = ""
            let saved_in_bank_text_color = ""
            let potential_chain_lost_text_color = ""
            let wrong_text_color = ""
    
            if (player.correct > 0) {correct_text_color = "text-success"}
            if (player.useful_bank > 0) {useful_bank_text_color = "text-success"}
            if (player.saved_in_bank > 0) {saved_in_bank_text_color = "text-success"}
            if (player.useless_bank > 0) {useless_bank_text_color = "text-danger"}
            if (player.potential_chain_lost > 0) {potential_chain_lost_text_color = "text-danger"}
            if (player.wrong > 0) {wrong_text_color = "text-danger"}
    
            cards.push(`<div 
                class="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3 col-xxl-3 p-1">
                <div class="card text-black p-3">
                    <h3 class="fw-bold ${status}">${escapeHTML(player.player_name)}</h3>
                    <span>${global.current_language_strings.weakest_link_vote_correct} : <span class="${statBold(player.correct)} ${correct_text_color}">${player.correct}</span></span>
                    
                    <span>${global.current_language_strings.weakest_link_vote_useful_bank} : <span class="${statBold(player.useful_bank)} ${useful_bank_text_color}">${player.useful_bank}</span></span>
                    <span>${global.current_language_strings.weakest_link_vote_useless_bank} : <span class="${statBold(player.useless_bank)} ${useless_bank_text_color}">${player.useless_bank}</span></span>
                    <span>${global.current_language_strings.weakest_link_vote_saved_in_bank} : <span class="${statBold(player.saved_in_bank)} ${saved_in_bank_text_color}">${player.saved_in_bank}</span></span>
                    
                    <span>${global.current_language_strings.weakest_link_vote_potential_chain_lost} : <span class="${statBold(player.potential_chain_lost)} ${potential_chain_lost_text_color}">${player.potential_chain_lost}</span></span>
                    <span>${global.current_language_strings.weakest_link_vote_wrong} : <span class="${statBold(player.wrong)} ${wrong_text_color}">${player.wrong}</span></span>
                </div>
            </div>`)
    }
    analytics_element.innerHTML = cards.join("");
}

function generateWeakestLinkSentence() {
    let random_int = "";
    let question = "";
    let reponse = "";

    // Seuil de difficulté selon le mode choisi
    let difficulty = game.weakest_link.difficulty_selected || game.weakest_link.difficulty_default_value || "progressive";
    if (difficulty == "progressive") {
        let chain = game.weakest_link.chain || 0;
        if (chain < 5) difficulty = 1;
        else if (chain < 10) difficulty = 2;
        else difficulty = 4;
    } else {
        difficulty = parseInt(difficulty);
    }

    // Pool de questions filtré par difficulté
    let request = game.questions.filter(q => (q.difficulty || 1) <= difficulty);

    // Fallback : plus de question au niveau demandé → toutes les questions restantes
    if (request.length == 0) {
        request = game.questions;
    }

    // Tirage de la question/réponse
    function getRandomSentence() {
        // Garde anti-crash : plus de question disponible
        if (request.length == 0) {
            document.getElementById("weakest_link_question").innerHTML = "";
            document.getElementById("weakest_link_reponse").innerHTML = "";
            return;
        }

        random_int = Math.floor(Math.random() * Math.floor(request.length));
        question = request[random_int].question;
        reponse = request[random_int].reponse;

        // remove sentence from db
        let question_index = game.questions.indexOf(request[random_int]);
        if (question_index > -1) {
            game.questions.splice(question_index, 1);
        }
    }

    // Lancement
    getRandomSentence()

    // Affichage en jeu
    document.getElementById("weakest_link_question").innerHTML = question;
    document.getElementById("weakest_link_reponse").innerHTML = reponse;

    // Compteur de questions posées
    if (question !== "") {
        game.weakest_link.questions_asked++;
        document.getElementById("ingame_weakest_link_score_questions_asked").innerHTML = game.weakest_link.questions_asked;
    }
}

function weakestLinkChrono() {
    if (game.weakest_link.current_time <= 0) {
        clearInterval(game.weakest_link.timer);
        endWeakestLink()
        return
    }
    game.weakest_link.current_time--;
    weakestLinkCalcTime();
}

function weakestLinkCalcTime() {
    const time = game.weakest_link.current_time;

    const min = Math.floor(time/60)
    let sec = Math.floor(time%60)
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
        stopsound("weakest_link_amb_60");playsound("weakest_link_amb_end")
        clearInterval(game.weakest_link.timer);
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
        element.classList.remove("changing_weakest_link_player");
        setTimeout(function() { element.classList.add("changing_weakest_link_player") }, 1);
        setTimeout(function() {element.innerHTML = escapeHTML(name);}, 250);
    } else {
        element.innerHTML = escapeHTML(name);
    }
}

function weakestLinkTextSmaller() {
    switch (game.weakest_link.text_size) {
        case "big":  
            weakestLinkChangeTextSize("normal");
            break;
        case "normal":
            weakestLinkChangeTextSize("small");
            break;
    }
}

function weakestLinkTextBigger() {
    switch (game.weakest_link.text_size) {
        case "small":
            weakestLinkChangeTextSize("normal");
            break;
        case "normal":
            weakestLinkChangeTextSize("big");
            break;
    }
}

function weakestLinkChangeTextSize(size) {
    const size_classes = ["fs-1", "fs-3", "fs-6"];
    const target_class = size == "small" ? "fs-6" : size == "big" ? "fs-1" : "fs-3";
    game.weakest_link.text_size = size;
    for (const size_class of size_classes) {
        document.getElementById("weakest_link_question").classList.remove(size_class);
        document.getElementById("weakest_link_reponse").classList.remove(size_class);
    }
    document.getElementById("weakest_link_question").classList.add(target_class);
    document.getElementById("weakest_link_reponse").classList.add(target_class);
    document.getElementById("input_weakest_link_text_size").value = size;
}

function DEBUG_weakestlink_add5sec() {
    if (global.debug == true) {
        const current_time_player = global.audio.weakest_link_amb_60.currentTime;
        const current_time = game.weakest_link.current_time;
    
        if ((current_time - 5) >= 5) {
            global.audio.weakest_link_amb_60.currentTime = current_time_player + 5;
            game.weakest_link.current_time = current_time - 5;
        }
        weakestLinkCalcTime();
    }
}