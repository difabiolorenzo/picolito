function nextSentence(close_sentence_list) {
    if (game.cycle_id < game.sentence_amount - 1) {
        game.cycle_id++;
        retrieve(game.cycle_id);

        updateGameBackgroundColor();
        updateGameCycle();
        
        if (close_sentence_list == true) {
            displaySentenceList(true);
        } else {
            updateSentenceList()
        }
    }
}

function previousSentence() {
    if (game.cycle_id > 0) {
        game.cycle_id--;
        goToSpecificSentence(game.cycle_id)
    }
}

function goToSpecificSentence(position) {
    game.cycle_id = position;
    
    updateGameCycle();
    updateGameBackgroundColor();
    retrieve(position);
    displaySentenceList(true);
}

function convertPendingDBTaffy() {
    // game.database = TAFFY(game.pending_db)
    game.database = TAFFY(game.pending_db)
    // game.pending_db = game.pending_db.concat(
}

function getMinPlayer() {
    if (game.gamemode == "war" && game.player_list.length >= 3) {
        game.max_player_number = 3;
    } else if (game.gamemode != "war" && game.player_list.length >= 4) {
        game.max_player_number = 4;
    } else {
        game.max_player_number = game.player_list.length;
    }
}

function retrieve(sentence_id) {
    //generate or retrieve
    if (game.sentence_history[game.cycle_id] == undefined || game.sentence_history[game.cycle_id].sentence == "none") {
        switch (game.gamemode) {
            case "default":
                generatePicoloSentences();
                break
            case "silly":
                generatePicoloSentences();
                break
            case "bar":
                generatePicoloSentences();
                break
            case "hot":
                generatePicoloSentences();
                break
            case "war":
                generatePicoloSentences();
                break
            case "mix":
                generatePicoloSentences();
                break
            case "never_popular":
                generateNeverDoneSentences();
                break
            case "never_party":
                generateNeverDoneSentences();
                break
            case "never_hot":
                generateNeverDoneSentences();
                break
            case "never_mix":
                generateNeverDoneSentences();
                break
            case "weakest_link":
                generateWeakestLink();
                break
            default:
            break
        }

    } else {
        var sentence_requested = game.sentence_history[sentence_id];
        displaySentence(sentence_requested.sentence, sentence_requested.color, sentence_requested.pack_name, sentence_requested.answer);
        updateGameCycle();
    }
}

function displaySentence(sentence, color, pack_name, answer) {
    ingame_sentence.className = "";
    ingame_answer.className = "";
    ingame_title.className = "";
    ingame_gamemode_information.innerHTML = "";

    setTimeout(function() {
        if (game.animation == true) {
            ingame_sentence.className = "animation_text_change";
            ingame_title.className = "animation_text_change";
            ingame_answer.className = "animation_text_change";
            if (game.weakest_link.hide_answer == true) {
                ingame_answer.className += " answer-hided";
            }
        }
        document.getElementById("ingame_sentence").innerHTML = sentence;
        if (color == "dark_blue") {
            document.getElementById("ingame_answer").innerHTML = answer;
        }
    }, 0);

    if (color == "yellow") {
        ingame_title.innerText = global.current_language_strings.virus;
    } else {
        ingame_title.innerText = "";
    }

    if (game.gamemode == "mix" || game.gamemode == "never_mix") {
        ingame_gamemode_information.innerHTML = pack_name;
    }
}

function randomPercentage() {
    while (random_percent == 0 || random_percent == 100 || random_percent == undefined) {
        var random_percent = Math.floor(Math.random() * 100);
    }
    return random_percent;
}

function getRandomColor() {
    var available_color_probability = [];
    if (game.shot_enabled == true && game.shot_sentence_id_start_min <= game.cycle_id && game.shot_remaining > 0 && game.gamemode != "war") {
        available_color_probability.push(["red", game.filter.color_probability.red])
    }
    if (game.virus_enabled == true && game.virus_sentence_id_start_min <= game.cycle_id && game.virus_remaining > 0 && game.gamemode != "war") {
        available_color_probability.push(["yellow", game.filter.color_probability.yellow])
    }
    if (game.cycle_id < game.sentence_amount - 2) {
        available_color_probability.push(["green", game.filter.color_probability.green])
    }
    available_color_probability.push(["blue", game.filter.color_probability.blue])

    available_color_probability.sort( function(a, b) { return a[1] - b[1]; } );

    var random_percent = randomPercentage();

    //filter color probability by random_percent
    var color = "";
    var random_probability_step = 0;
    var random_probability_next_step = 0;
    for (var i = 0; i < available_color_probability.length; i++) {
        random_probability_next_step = random_probability_next_step + available_color_probability[i][1];
        if ( (random_percent > random_probability_step && random_percent < random_probability_next_step) || (random_percent > random_probability_next_step) || (random_percent > random_probability_step)) {
            color = available_color_probability[i][0];
        }
        random_probability_step = random_probability_next_step;
    }
    return color;
}

function getRandomType() {
    if (game.gamemode == "mix") {
        var possible_type = ["bar", "default", "hot", "silly"]
        var percentage = randomPercentage()
        var gamemode = possible_type[Math.floor(percentage/(100/4))]
    } else {
        var gamemode = game.gamemode;
    }

    if (game.max_player_number != -1) {
        var type_by_gamemode = [];
        var max_player_number_by_gamemode = [];
        switch (gamemode) {
            case "bar":
                type_by_gamemode = game.filter.type_by_gamemode.bar;            
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.bar;            
                break;
            case "default":
                type_by_gamemode = game.filter.type_by_gamemode.default;
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.default;
                break;
            case "hot":
                type_by_gamemode = game.filter.type_by_gamemode.hot;
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.hot;
                break;
            case "silly":
                type_by_gamemode = game.filter.type_by_gamemode.silly;
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.silly;
                break;
            case "war":
                type_by_gamemode = game.filter.type_by_gamemode.war;
                max_player_number_by_gamemode = game.filter.max_player_number_by_gamemode.war;
                break;
        }

        var color = getRandomColor();
        var type_by_color = []
        switch (color) {
            case "blue":
                type_by_color = game.filter.type_by_color.blue;            
                break;
            case "red":
                type_by_color = game.filter.type_by_color.red;
                break;
            case "green":
                type_by_color = game.filter.type_by_color.green;
                break;
            case "yellow":
                type_by_color = game.filter.type_by_color.yellow;
                break;
        }

        var color_gamemode_matching_type = []
        for (var i in type_by_gamemode) {
            for (var j in type_by_color) {
                if (type_by_gamemode[i] == type_by_color[j]) {
                    if (game.social_posting_enabled == false && type_by_gamemode[i] == 15) {
                        console.log(`SOCIAL POSTING DISABLED`)
                    } else {
                        color_gamemode_matching_type.push(type_by_gamemode[i]);
                    }
                }
            }
        }

        var potential_type = []
        for (var i in color_gamemode_matching_type) {
            var checking_cg_matching_type = color_gamemode_matching_type[i];
            var checking_mp_by_gamemode = max_player_number_by_gamemode[checking_cg_matching_type-1];
            if (checking_mp_by_gamemode.length != 0) {
                for (var j in checking_mp_by_gamemode) {
                    if (checking_mp_by_gamemode[j] <= game.max_player_number) {
                        potential_type.push(checking_cg_matching_type)
                    }
                }
            }
        }
    
        var random_type_index = Math.floor(Math.random() * potential_type.length);
        var selected_type = potential_type[random_type_index];

        return [color, selected_type, potential_type];
    } else {
        getMinPlayer()
        getRandomType()
    }
}


function generatePicoloSentences() {
    var get_random_color_type = getRandomType();
    var color = get_random_color_type[0];
    var type = get_random_color_type[1];        // text
    var max_player = game.max_player_number;
    console.log(get_random_color_type, color, "type", type, "max_player", max_player);

    var request = [];
    var key = "";
    var sentence = "";
    var database_id = "";
    var pack_name = "";
    var color = ""
    var type = ""
    var max_player = game.max_player_number;

    function setVariables() {
        var get_random_color_type = getRandomType();
        color = get_random_color_type[0];
        type = get_random_color_type[1];        // text
        console.log(get_random_color_type, color, "type", type, "max_player", max_player);
    }
    setVariables()

    function getSentence(use_parent_key, selected_nb_players, selected_type) {
        if (use_parent_key == false) {
            return game.database().filter({nb_players:selected_nb_players, type:selected_type, parent_key:""}).get();
        } else {
            return game.database().filter({nb_players:selected_nb_players, type:selected_type, parent_key:key}).get();
        }
    }

    //get sentence from lower nb_player to max_player
    for (var i=0; i<= max_player; i++) {
        var addind_request = getSentence(false, i.toString(), type.toString()); //getSentence(use_parent_key, selected_nb_players, selected_type)
        request.push(...addind_request);
    }
    if (request.length == 0) {
        game.filter.empty_type.push(type)
        alert("REPICK TYPE");
    }

    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        sentence = textReplacer(request[random_int].text);
        pack_name = request[random_int].pack_name;
        if (request[random_int].key != "") { key = request[random_int].key; }
        console.log(random_int, sentence, pack_name);

        //remove sentence from db
        game.database().filter({___id:database_id}).remove();
        console.log(database_id, "picolo removed")
    }

    getRandomSentence()
    updateGameBackgroundColor(color);
    displaySentence(sentence, color, pack_name);
    addHistoryItem(0, database_id, sentence, key, type, color, pack_name, undefined);

    if (key != "") {
        request = [];
        sentence = "";
        database_id = "";
        pack_name = "";
        
        console.log(request)

        //get sentence from lower nb_player
        for (var i = 0; i <= max_player; i++) {
            var addind_request = getSentence(true, i.toString(), type.toString())
            request.push(...addind_request)
        }
        getRandomSentence()

        if (color == "yellow") {
            game.virus_remaining--;
            random_virus_end = Math.floor(Math.random() * (game.virus_end_max - game.virus_end_min)) + game.virus_end_min;

            console.log("game_cycle end virus", random_virus_end)
            console.log(sentence, "key", key, "type", type)
            addHistoryItem(random_virus_end, database_id, sentence, key, type, color, pack_name, undefined);

            game.virus_established_start = game.cycle_id;
            game.virus_established_end = game.cycle_id + random_virus_end;

        } else if (color == "blue" || color == "green" ) {
            addHistoryItem(1, database_id, sentence, key, type, color, pack_name, undefined);
        }

    }

    //disable down drinking if trigerred
    //shot_remaining-- if more than 1 down drinking is set
    if (color == "red") {
        game.shot_remaining--;
    }
}

function generateNeverDoneSentences() {
    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        sentence = textReplacer(request[random_int].text);
        pack_name = request[random_int].pack_name;
        if (request[random_int].key != "") { key = request[random_int].key; }
        console.log(random_int, sentence)

        //remove sentence from db
        game.database().filter({___id:database_id}).remove();
        console.log(database_id, "never_done removed")
    }
    var request = game.database().get();
    
    getRandomSentence()
    updateGameBackgroundColor("never_done");
    displaySentence(sentence, "never_done", pack_name);
    addHistoryItem(0, database_id, sentence, undefined, undefined, "never_done", pack_name, undefined);
}

function generateWeakestLink() {
    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        sentence = request[random_int].text;
        answer = request[random_int].answer;
        pack_name = request[random_int].pack_name;
        if (request[random_int].key != "") { key = request[random_int].key; }

        //remove sentence from db
        game.database().filter({___id:database_id}).remove();
    }

    var request = game.database().get();
    
    getRandomSentence()

    updateGameBackgroundColor("dark_blue");
    displaySentence(sentence, "dark_blue", pack_name, answer);
    addHistoryItem(0, database_id, sentence, undefined, undefined, "dark_blue", pack_name, answer);
}

function initWeakestLink() {
// LA PLUPART DES REFENCES A DES IDENTIFIANTS POUR GERER LES JOUEURS NE REFLETENT PAS game.player_list
// MAIS UNE VERSION DES IDENTIFIANTS TRIES ALPHABETIQUEMENT
// EXEMPLE : game.player_list = ["Be", "Re", "Ar"]
// LES IDENTIFIANTS UTILISER SERONT 0 POUR DESIGNER "Ar", 1 pour "Be", 2 pour "Re" (RESPECTIVEMENT 2, 0 et 1)
// SOLUTION game.player_list[game.weakest_link.player_id_alphabetically_sorted[x]]

    ingame_weakest_link_current_player.style.display = ""
    ingame_weakest_link_score_sip.innerHTML = "-"
    ingame_weakest_link_score_bank.innerHTML = "-"
    ingame_weakest_link_current_player.innerHTML = "-";

    if (game.player_list.length < 2) {
            alert("nb player 0-1")
            manageIngameOptionDisplay(false, 'weakest_link', 'flex')
            ingame_weakest_link_current_player.style.display = "none"
    } else {
        manageIngameOptionDisplay(false, 'weakest_link', 'flex')
    }

    game.weakest_link.player_turn_index = -1;
    game.weakest_link.analytics_correct = 0;
    game.weakest_link.analytics_wrong = 0;
    game.weakest_link.analytics_potential_chain_lost = 0;
    // game.weakest_link.player_id_played = [];
    
    game.weakest_link.vote = []

    game.weakest_link.player_analytics.correct = [];
    game.weakest_link.player_analytics.wrong = [];
    game.weakest_link.player_analytics.bank_saved = [];
    game.weakest_link.player_analytics.potential_bank_lost = [];
    game.weakest_link.player_analytics.answer_time = [];
    game.weakest_link.player_analytics.avegarge_answer_time = []; 

    for (var i in game.player_list) {
        game.weakest_link.player_analytics.correct.push(0)
        game.weakest_link.player_analytics.wrong.push(0)
        game.weakest_link.player_analytics.bank_saved.push(0)
        game.weakest_link.player_analytics.potential_bank_lost.push(0)
        game.weakest_link.player_analytics.answer_time.push([0])
    }
    
    // date to compare how fast first question is awnsered
    game.weakest_link.time_game_started = new Date();

    game.weakest_link.alphabetically_ordered_player = game.weakest_link.alphabetically_ordered_player.concat(game.player_list);
    game.weakest_link.alphabetically_ordered_player = game.weakest_link.alphabetically_ordered_player.sort()

    game.weakest_link.player_id_alphabetically_sorted = game.player_list.map((_, index) => index).sort((a, b) => game.player_list[a].localeCompare(game.player_list[b]));

    weakestLinkNextPlayer()

    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;
    ingame_weakest_link_score_bank.innerHTML = game.weakest_link.bank;
    
    game.weakest_link.current_time = game.weakest_link.time;

    weakestLinkCalcTime();
    weakestLinkChrono()
    if (game.weakest_link.time == 60) { playsound("weakest_link_amb_60") }

    global.weakestLinkTimer = setInterval(function() {weakestLinkChrono()}, 1000);
}

function weakestLinkCorrect() {
    game.weakest_link.chain++;

    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;

    game.weakest_link.analytics_correct++;
    game.weakest_link.player_analytics.correct[game.weakest_link.player_turn_index]++;

    weakestLinkTimestampStep()

    weakestLinkNextPlayer();
    nextSentence();
}

function weakestLinkWrong() {
    //todo supp analytics_wrong pour une somme global en fin de jeu
    game.weakest_link.analytics_wrong++;
    game.weakest_link.player_analytics.wrong[game.weakest_link.player_turn_index]++;
    game.weakest_link.player_analytics.potential_bank_lost[game.weakest_link.player_turn_index] += game.weakest_link.chain;
    game.weakest_link.analytics_potential_chain_lost += game.weakest_link.chain;

    game.weakest_link.chain = 0;
    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;

    weakestLinkTimestampStep()
    weakestLinkNextPlayer()
    nextSentence()
}

function weakestLinkBank() {
    game.weakest_link.player_analytics.bank_saved[game.weakest_link.player_turn_index] += game.weakest_link.chain;
    
    game.weakest_link.bank += game.weakest_link.chain;
    game.weakest_link.chain = 0

    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;
    ingame_weakest_link_score_bank.innerHTML = game.weakest_link.bank;

    if (game.weakest_link.stop_at_max_chain == true && game.weakest_link.bank >= game.weakest_link.max_chain) {
        stopsound("weakest_link_amb_60");playsound("weakest_link_amb_end")
        weakestLinkEndQuestion()
    }
}

function weakestLinkTimestampStep() {
    if (game.player_list.length > 2) {
        function compareTimestamp(date_1, date_2) {
            var diff_time = Math.abs(date_2 - date_1);
            return diff_time;
        }
        
        var timestamp = new Date()
        game.sentence_history[game.cycle_id].timestamp = timestamp
    
        if (game.cycle_id > 0) {
            var previous_sentence_timestamp = game.sentence_history[game.cycle_id-1].timestamp
            var diff_time_calculated = compareTimestamp(previous_sentence_timestamp, timestamp)
            game.weakest_link.player_analytics.answer_time[game.weakest_link.player_turn_index].push(diff_time_calculated)
        } else {
            var diff_time_calculated = compareTimestamp(game.weakest_link.time_game_started, timestamp)
            game.weakest_link.player_analytics.answer_time[game.weakest_link.player_turn_index].push(diff_time_calculated)
        }
    }
}

function weakestLinkNextPlayer() {
    if (game.player_list.length >= 2) {
        if (game.weakest_link.player_turn_index+1 == game.player_list.length) {
            game.weakest_link.player_turn_index = 0;
        } else {
            game.weakest_link.player_turn_index++
        }
        ingame_weakest_link_current_player.className = "weakest_link_shield_player"
        
        setTimeout(function() {
            ingame_weakest_link_current_player.className = "weakest_link_shield_player changing_weakest_link_player"
        }, 1)
        setTimeout(function() {
            ingame_weakest_link_current_player.innerHTML = game.weakest_link.alphabetically_ordered_player[game.weakest_link.player_turn_index].toUpperCase();
        
        }, 250)
    }
}

function weakestLinkInitVote() {
    game.weakest_link.player_vote_index = 0;
    weakestLinkDisplayNextVote()
    game.weakest_link.vote = [];

    manageNavDisplay("quit",true)
    manageNavDisplay("restart",true)
    
    game.weakest_link.vote_count = [];
    for (var i in game.player_list) {
        game.weakest_link.vote_count.push(0)
    }
}

function weakestLinkDisplayVote() {
    ingame_weakest_link_current_player_voting.innerHTML = game.weakest_link.alphabetically_ordered_player[game.weakest_link.player_vote_index]
    function updateBallotList() {
            weakest_link_player_vote_ballot.innerHTML = ""
            var ul_head = "";
            var html_inner = "";
    
            for (var i in game.weakest_link.alphabetically_ordered_player) {
                var player_name = game.weakest_link.alphabetically_ordered_player[i]
                if (i != game.weakest_link.player_vote_index) {
                    html_inner += `<li class="list-group-item sentence-list weakest-link-vote-button" onclick="weakestLinkVotePlayer(${i})">${player_name}</li>`;
                }
            }
            weakest_link_player_vote_ballot.innerHTML = ul_head + html_inner + "</ul>";
    }
    updateBallotList()
    manageIngameOptionDisplay(true, "weakest_link_vote", "flex")
    manageIngameOptionDisplay(true, "weakest_link_next_vote", "none")
}

function weakestLinkVotePlayer(player_id) {
    game.weakest_link.vote.push(player_id);
    game.weakest_link.vote_count[player_id]++;

    game.weakest_link.player_vote_index++;
    if (game.weakest_link.player_vote_index < game.player_list.length) {
        weakestLinkDisplayNextVote()
    } else {
        weakestLinkEndVoting()
    }
}

function weakestLinkDisplayNextVote() {
    manageIngameOptionDisplay(true, "weakest_link_vote", "none")
    manageIngameOptionDisplay(true, "weakest_link_next_vote", "flex")
    manageIngameOptionDisplay(true, "weakest_link_rule", "none");

    var i = game.weakest_link.player_vote_index
    ingame_weakest_link_next_player_voting.innerHTML = game.weakest_link.alphabetically_ordered_player[i]
}

function weakestLinkEndVoting() {
    manageNavDisplay("quit",false);
    manageNavDisplay("restart",false);

    var highest_vote = 0;
    var most_voted_player = []; //player_id
    var tie = undefined;
    var player_ratio = [] //id, ratio(correct-wrong),awnsering_time

    for (var i = 0; i < game.weakest_link.vote.length; i++) {
        //avegarge_answer_time
        var raw_average_anwser_time = game.weakest_link.player_analytics.answer_time[i]
        var avegarge_answer_time = raw_average_anwser_time.reduce((a, b) => a + b) / raw_average_anwser_time.length;
        var average_anwser_time_sec = (avegarge_answer_time-(avegarge_answer_time%10)) / 1000;
        game.weakest_link.player_analytics.avegarge_answer_time.push(average_anwser_time_sec)

        //vote count
        var vote_count = game.weakest_link.vote_count[i]
        if (vote_count > highest_vote) {
            highest_vote = vote_count
            most_voted_player = [];
            most_voted_player.push([i, game.weakest_link.player_analytics.correct[i] - game.weakest_link.player_analytics.wrong[i], game.weakest_link.player_analytics.avegarge_answer_time[i], game.weakest_link.alphabetically_ordered_player[i]])
            tie = undefined
        } else if (vote_count == highest_vote && vote_count > 0) {
            most_voted_player.push([i, game.weakest_link.player_analytics.correct[i] - game.weakest_link.player_analytics.wrong[i], game.weakest_link.player_analytics.avegarge_answer_time[i], game.weakest_link.alphabetically_ordered_player[i]])
            var tie = true
        }  
        
        //player ratio
        player_ratio.push([i, game.weakest_link.player_analytics.correct[i] - game.weakest_link.player_analytics.wrong[i], game.weakest_link.player_analytics.avegarge_answer_time[i], game.weakest_link.alphabetically_ordered_player[i]])
    }
    console.log(most_voted_player)

    //ratio (give strongest_link, weakest_link(if_tie)) (Thx ChatGPT)
    function sortPlayerWeakest(a, b) {
        // Tri par nombre de points de manière décroissante
        if (a[1] < b[1]) { return -1; } else if (a[1] > b[1]) { return 1; }
        // En cas d'égalité des points, tri par temps de réponse de manière croissante
        if (a[2] > b[2]) { return -1; } else if (a[2] < b[2]) { return 1; }
        return null; // Les éléments sont égaux
    }
    function sortPlayerStrongest(a, b) {
        // Tri par nombre de points de manière croissante
        if (a[1] > b[1]) { return -1; } else if (a[1] < b[1]) { return 1; }
        // En cas d'égalité des points, tri par temps de réponse de manière croissante
        if (a[2] < b[2]) { return -1; } else if (a[2] > b[2]) { return 1; }
        return null; // Les éléments sont égaux
    }

    var player_ratio_sorted = [];
    player_ratio_sorted = player_ratio.slice();

    //determ one weakest link ()
    if (tie == true && game.weakest_link.tie_behaviour == "weakest") {
        var most_voted_player_sorted = [];
        most_voted_player_sorted = most_voted_player.slice();
        game.weakest_link.weakest_link_id = most_voted_player_sorted.sort(sortPlayerWeakest)[0][0]
        console.log(game.weakest_link.alphabetically_ordered_player[game.weakest_link.weakest_link_id], game.weakest_link.weakest_link_id,"weakest")
    }

    //determ who's strongest link
    if (game.weakest_link.tie_behaviour == "weakest") { 
        console.log(player_ratio_sorted, game.weakest_link.weakest_link_id)
            player_ratio_sorted[game.weakest_link.weakest_link_id].pop() }
    game.weakest_link.strongest_link_id = player_ratio_sorted.sort(sortPlayerStrongest)[0][0]
    console.log(game.weakest_link.alphabetically_ordered_player[game.weakest_link.strongest_link_id], game.weakest_link.strongest_link_id, "strongest")
    
    // each player stats
    var ul_head = "";
    var vote_result_innerHTML = "";

    for (var i in game.weakest_link.alphabetically_ordered_player) {
        var player_name = game.weakest_link.alphabetically_ordered_player[i]
        var vote_count = game.weakest_link.vote_count[i]
        var voted_player = game.weakest_link.alphabetically_ordered_player[game.weakest_link.vote[i]]
        var average_anwser_time_sec = game.weakest_link.player_analytics.avegarge_answer_time[i]
        var potential_bank_lost = game.weakest_link.player_analytics.potential_bank_lost[i];
        var bank_saved = game.weakest_link.player_analytics.bank_saved[i];
        var correct = game.weakest_link.player_analytics.correct[i];
        var wrong = game.weakest_link.player_analytics.wrong[i];

        var html_space = "<a> </a>";
        var text_vote_against = global.current_language_strings.weakest_link_vote_against;

        vote_result_innerHTML += '<li class="list-group-item player-recap-vote">'
        vote_result_innerHTML += `<p class="player_voting">${player_name}<a>`;
        vote_result_innerHTML += `<p class="player_analytics"><span class="player_analytics_wheat">${player_name}</span>${html_space}<a>${text_vote_against}</a>${html_space}</span>${voted_player}</p>`;
        if (vote_count > 0) {
            vote_result_innerHTML += `<p class="player_analytics"><span class="player_analytics_orange">${vote_count}</span>${html_space}${text_vote_against}</p>`;
        } else {
            vote_result_innerHTML += `<p class="player_analytics">${vote_count}${html_space}${text_vote_against}</p>`;
        }
        if (correct > 0) {vote_result_innerHTML += `<p class="player_analytics"><span class="player_analytics_green">${correct}</span> bonne(s) réponse(s)</p>`;}
        if (wrong > 0) {vote_result_innerHTML += `<p class="player_analytics"><span class="player_analytics_red">${wrong}</span> mauvaise(s) réponse(s)></p>`;}
        if (average_anwser_time_sec > 0) {vote_result_innerHTML += `<p class="player_analytics">Temps de réponse moyen: <span class="player_analytics_wheat">${average_anwser_time_sec}</span> sec.</p>`;}
        if (bank_saved > 0) {vote_result_innerHTML += `<p class="player_analytics">Sauve <span class="player_analytics_green">${bank_saved}</span> gorgées en banque</p>`;}
        if (potential_bank_lost > 0) {vote_result_innerHTML += `<p class="player_analytics">Fait perdre <span class="player_analytics_red">${potential_bank_lost}</span> gorgées potentielles en banque</p>`;}
        vote_result_innerHTML += `</li>`;
    }
    weakest_link_vote_result.innerHTML =  ul_head + vote_result_innerHTML + "</ul>"; 

    weakest_link_vote_end_analytics_table.innerHTML = ""
    analytics_table_innerHTML = `<tr>
            <td id="text_ingame_weakest_link_analytics_time">Temps</td>
            <td id="text_ingame_weakest_link_analytics_correct">Bonne réponse</td>
            <td id="text_ingame_weakest_link_analytics_potential">Potentielle bonne réponse</td>
            <td id="text_ingame_weakest_link_analytics_wrong">Mauvaise réponse</td>
            <td id="text_ingame_weakest_link_analytics_bank">Banque</td>
            <td id="text_ingame_weakest_link_analytics_strongest_link">Maillon Fort</td>
        </tr>
        <tr>
            <td id="ingame_weakest_link_end_time" class="weakest_link_vote_analytics_data">${weakestLinkCalcTime(game.weakest_link.time, true)}</td>
            <td id="ingame_weakest_link_end_analytics_correct" class="weakest_link_vote_analytics_data">${game.weakest_link.analytics_correct}</td>
            <td id="ingame_weakest_link_end_analytics_potential_chain" class="weakest_link_vote_analytics_data">${game.weakest_link.analytics_potential_chain_lost}</td>
            <td id="ingame_weakest_link_end_analytics_errors" class="weakest_link_vote_analytics_data">${game.weakest_link.analytics_wrong}</td>
            <td id="ingame_weakest_link_end_penality_count" class="weakest_link_vote_analytics_data">${game.weakest_link.bank}</td>
            <td id="ingame_weakest_link_end_analytics_strongest_link" class="weakest_link_vote_analytics_data player_analytics_green">${game.weakest_link.alphabetically_ordered_player[game.weakest_link.strongest_link_id]}</td>
        </tr>
        <tr>
            <td colspan="5"><p id="weakest_link_loser_text_placeholder" class="no-margin"></p></td>
            <td><button id="text_weakest_link_vote_quit" type="submit" class="btn btn-warning" onclick="exitGame()">Quitter</button></p></td>
        </tr>`;
    weakest_link_vote_end_analytics_table.innerHTML = analytics_table_innerHTML

    
game.weakest_link.strongest_link_id

    //display loser
    switch (game.weakest_link.tie_behaviour) {
        case "strongest_link" :
        break;
        case "arbitrary" :
        break;
        case "both" :
            var behaviour_both_innerHTML = ""
            for (var i in most_voted_player) { 
                behaviour_both_innerHTML += most_voted_player[i][3];

                if (i == most_voted_player.length-2 && i < most_voted_player.length) {
                    behaviour_both_innerHTML += " et "
                } else if (i < most_voted_player.length-1) {
                    behaviour_both_innerHTML += ", "
                }
            }
            weakest_link_loser_text_placeholder.innerHTML = behaviour_both_innerHTML + " sont les maillons faibles. Au reboire."
        break;
        case "weakest" :
            weakest_link_loser_text_placeholder.innerHTML = `<span class="player_analytics_orange">${game.weakest_link.alphabetically_ordered_player[game.weakest_link.weakest_link_id]}</span><a> </a><a>vous êtes le maillon faible. Au reboire.</a>`
        break;
    }
    // EMPTY BANK
    if (game.weakest_link.bank == 0) {
        var penality = weakestLinkRandomPenalityInit();
        weakest_link_loser_text_placeholder.innerHTML += `<br><a>Banque vide, nombre de pénalité tirée aléatoirement:</a><a> </a><span class="player_analytics_orange">${penality}</span>`
    } else {
        weakest_link_loser_text_placeholder.innerHTML += `<br><a>Nombre de gorgées en jeu:</a><a> </a><span class="player_analytics_orange">${game.weakest_link.bank}</span>`
    }
    
    manageIngameOptionDisplay(true, "weakest_link_vote", "none")
    manageIngameOptionDisplay(true, "weakest_link_vote_end", "flex")
}

function weakestLinkRandomPenalityInit() {
    return Math.floor(Math.random() * (game.sip.max - game.sip.min)) + game.sip.min;
}

function weakestLinkChrono() {
    if (game.weakest_link.current_time <= 1) {
        weakestLinkEndQuestion();
    }
    game.weakest_link.current_time--;
    weakestLinkCalcTime();
}

function weakestLinkEndQuestion() {
    clearInterval(global.weakestLinkTimer);
    if (game.player_list.length > 2 ) {
        weakestLinkInitVote()
    } else { manageIngameOptionDisplay(true, 'replay', 'block') }
}

function weakestLinkCalcTime(time, returnFunc) {
    if (time == undefined) { var time = game.weakest_link.current_time }

    var min = Math.floor(time/60)
    var sec = Math.floor(time%60)
    if (sec < 10) { sec = "0" + sec; }
    ingame_weakest_link_time.innerHTML = min + ":" + sec

    if (returnFunc == true) { return min + ":" + sec; }
}