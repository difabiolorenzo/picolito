function nextSentence(close_sentence_list) {
    if (game.cycle_id < game.sentence_amount - 1) {
        game.cycle_id++;
        retrieve(game.cycle_id);

        updateHTMLBackgroundColor();
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
    updateHTMLBackgroundColor();
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
        console.log(game.sentence_history[sentence_id])
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
    ingame_gamemode_information.innerHTML = pack_name;
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

    function requestEveryMinPlayer() {
        //get sentence from lower nb_player to max_player
        for (var i=0; i<= max_player; i++) {
            var addind_request = getSentence(false, i.toString(), type.toString()); //getSentence(use_parent_key, selected_nb_players, selected_type)
            request.push(...addind_request);
        }
        if (request.length == 0) {
            game.filter.empty_type.push(type)
            alert("REPICK TYPE");
        }
    }
    requestEveryMinPlayer()


    
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

    updateHTMLBackgroundColor(color);
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

    updateHTMLBackgroundColor("purple");
    displaySentence(sentence, "purple", pack_name);
    addHistoryItem(0, database_id, sentence, undefined, undefined, "purple", pack_name, undefined);
}

function generateWeakestLink() {
    function getRandomSentence() {
        var random_int = Math.floor(Math.random() * Math.floor(request.length));
        database_id = request[random_int].___id;
        sentence = request[random_int].text;
        answer = request[random_int].answer;
        pack_name = request[random_int].pack_name;
        if (request[random_int].key != "") { key = request[random_int].key; }
        // console.log(random_int, sentence, answer)

        //remove sentence from db
        game.database().filter({___id:database_id}).remove();
        // console.log(database_id, "weakest link removed")
    }

    var request = game.database().get();
    
    getRandomSentence()

    updateHTMLBackgroundColor("dark_blue");
    displaySentence(sentence, "dark_blue", pack_name, answer);
    addHistoryItem(0, database_id, sentence, undefined, undefined, "dark_blue", pack_name, answer);
}

function initWeakestLink() {
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

    game.weakest_link.player_analytics.correct = [];
    game.weakest_link.player_analytics.wrong = [];
    game.weakest_link.player_analytics.bank_times = [];
    game.weakest_link.player_analytics.bank_saved = [];
    game.weakest_link.player_analytics.bank_lost = [];
    game.weakest_link.player_analytics.answer_time = [];
    for (var i in game.player_list) {
        game.weakest_link.player_analytics.correct.push(0)
        game.weakest_link.player_analytics.wrong.push(0)
        game.weakest_link.player_analytics.bank_times.push(0)
        game.weakest_link.player_analytics.bank_saved.push(0)
        game.weakest_link.player_analytics.bank_lost.push(0)
        game.weakest_link.player_analytics.answer_time.push([])
    }

    ingame_weakest_link_end_time.innerHTML = weakestLinkCalcTime(game.weakest_link.time, true)
    if (game.weakest_link.time == 60) { playsound() }
    
    // date to compare how fast first question is awnsered
    game.weakest_link.time_game_started = new Date();

    game.weakest_link.alphabetically_ordered_player = game.weakest_link.alphabetically_ordered_player.concat(game.player_list);
    game.weakest_link.alphabetically_ordered_player = game.weakest_link.alphabetically_ordered_player.sort()
    
    weakestLinkNextPlayer()

    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;
    ingame_weakest_link_score_bank.innerHTML = game.weakest_link.bank;

    game.weakest_link.current_time = game.weakest_link.time;
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
    game.weakest_link.analytics_potential_chain_lost += game.weakest_link.chain;

    game.weakest_link.chain = 0;
    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;

    weakestLinkTimestampStep()

    weakestLinkNextPlayer()
    nextSentence()
}

function weakestLinkBank() {
    game.weakest_link.player_analytics.bank_saved[game.weakest_link.player_turn_index] += game.weakest_link.chain;
    game.weakest_link.player_analytics.bank_times[game.weakest_link.player_turn_index]++;
    
    game.weakest_link.bank += game.weakest_link.chain;
    game.weakest_link.chain = 0

    ingame_weakest_link_score_sip.innerHTML = game.weakest_link.chain;
    ingame_weakest_link_score_bank.innerHTML = game.weakest_link.bank;
}

function weakestLinkTimestampStep() {
    if (game.player_list.length > 2) {
        function compareTimestamp(date_1, date_2) {
            var diff_time = Math.abs(date_2 - date_1);
    
            return diff_time;
    
            // const date1 = new Date('7/13/2010');
            // const date2 = new Date('12/15/2010');
            // const diffTime = Math.abs(date2 - date1);
            // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            // console.log(diffTime + " milliseconds");
            // console.log(diffDays + " days");
        }
        
        var timestamp = new Date()
        game.sentence_history[game.cycle_id].timestamp = timestamp
    
        if (game.cycle_id > 0) {
            console.log(game.cycle_id)
            var previous_sentence_timestamp = game.sentence_history[game.cycle_id-1].timestamp
            var diff_time_calculated = compareTimestamp(previous_sentence_timestamp, timestamp)
            game.weakest_link.player_analytics.answer_time[game.weakest_link.player_turn_index].push(diff_time_calculated)
        } else {
            var diff_time_calculated = compareTimestamp(game.weakest_link.time_game_started, timestamp)
            game.weakest_link.player_analytics.answer_time[game.weakest_link.player_turn_index].push(diff_time_calculated)
        }
        console.log(diff_time_calculated)
    }
}

function weakestLinkNextPlayer() {
    if (game.player_list.length >= 2) {
        if (game.weakest_link.player_turn_index+1 == game.player_list.length) {
            game.weakest_link.player_turn_index = 0;
        } else {
            game.weakest_link.player_turn_index++
        }
        ingame_weakest_link_current_player.innerHTML = game.weakest_link.alphabetically_ordered_player[game.weakest_link.player_turn_index].toUpperCase();
    }
}

function weakestLinkInitVote() {
    game.weakest_link.player_vote_index = 0;
    weakestLinkDisplayNextVote()
    game.weakest_link.vote = [];
    
    game.weakest_link.vote_amount = [];
    for (var i in game.player_list) {
        game.weakest_link.vote_amount.push(0)
    }
}

function weakestLinkDisplayVote() {
    ingame_weakest_link_current_player_voting.innerHTML = game.weakest_link.alphabetically_ordered_player[game.weakest_link.player_vote_index]
    function updateBallotList() {
            weakest_link_player_vote_ballot.innerHTML = ""
            
            var ul_head = `<ul class="list-group list-group-flush"></ul>`;
            var ul_end = "</ul>";
            var html_inner = "";
    
            for (var i in game.weakest_link.alphabetically_ordered_player) {
                var player_name = game.weakest_link.alphabetically_ordered_player[i]
                if (i != game.weakest_link.player_vote_index) {
                    html_inner += `<li class="list-group-item sentence-list" onclick="weakestLinkVotePlayer(${i})">${player_name}</li>`;
                }
            }
            weakest_link_player_vote_ballot.innerHTML = ul_head + html_inner + ul_end;
    }
    updateBallotList()
    manageIngameOptionDisplay(true, "weakest_link_vote", "flex")
    manageIngameOptionDisplay(true, "weakest_link_next_vote", "none")
}

function weakestLinkVotePlayer(player_id) {
    game.weakest_link.vote.push(player_id);
    game.weakest_link.vote_amount[player_id]++;

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

    var i = game.weakest_link.player_vote_index
    ingame_weakest_link_next_player_voting.innerHTML = game.weakest_link.alphabetically_ordered_player[i]
}

function weakestLinkEndVoting() {
    function displayVoteResult() {
        weakest_link_vote_result.innerHTML = ""
        
        var ul_head = `<ul class="list-group list-group-flush"></ul>`;
        var ul_end = "</ul>";
        var html_inner = "";

        for (var i in game.weakest_link.alphabetically_ordered_player) {
            var player_name = game.weakest_link.alphabetically_ordered_player[i]
            var vote_amount = game.weakest_link.vote_amount[i]
            var voted_player = game.weakest_link.alphabetically_ordered_player[game.weakest_link.vote[i]]
            if (i != game.weakest_link.player_vote_index) {
                html_inner += `<li class="list-group-item player-vote-button"><span class="player_voting">${player_name} (${vote_amount})<a> </a><a id="text_weakest_link_player_vote_against">${global.current_language_strings.weakest_link_vote_against}</a><a> </a></span>${voted_player}</li>`;
            }
        }
        weakest_link_vote_result.innerHTML = ul_head + html_inner + ul_end;
    }
    displayVoteResult()

    function determineEliminatedPlayer() {
        var average_answer_time = []
        for (var i = 0; i < game.weakest_link.vote.length; i++) {
            var player_array = game.weakest_link.player_analytics.answer_time[i]
            var average = player_array => player_array.reduce((a, b) => a + b) / player_array.length;
            average_answer_time.push(average)
        }

        var vote_count = []
        for (var i = 0; i < game.weakest_link.vote.length; i++) {
            vote_count.push([i, game.weakest_link.vote_amount[i], game.weakest_link.alphabetically_ordered_player[i]])
        }

        vote_count.sort(function(a, b) {
            return b[1] - a[1];
        });
        if (vote_count[1][1] == vote_count[0][1]) {
            console.log("égalité")
        }
        game.weakest_link.weakest_link = vote_count[0][2];
        ingame_weakest_link_eliminated.innerHTML = game.weakest_link.weakest_link
    }
    determineEliminatedPlayer()

    ingame_weakest_link_end_analytics_correct.innerHTML = game.weakest_link.analytics_correct
    ingame_weakest_link_end_analytics_potential_chain.innerHTML = game.weakest_link.analytics_potential_chain_lost
    ingame_weakest_link_end_analytics_errors.innerHTML = game.weakest_link.analytics_wrong
    ingame_weakest_link_end_penality_count.innerHTML = game.weakest_link.bank

    if (game.weakest_link.bank == 0) {
        alert.log("zero en banque, hasard?")
    }

    console.log(text_ingame_weakest_link_analytics_strongest_link,
        text_ingame_weakest_link_analytics_weakest_link == game.weakest_link.weakest_link)

    manageIngameOptionDisplay(true, "weakest_link_vote", "none")
    manageIngameOptionDisplay(true, "weakest_link_vote_end", "flex")
}
function weakestLinkChrono() {
    if (game.weakest_link.current_time == 1) {
        clearInterval(global.weakestLinkTimer);
        if (game.player_list.length > 2 ) {
            weakestLinkInitVote()
        } else {
            manageIngameOptionDisplay(true, 'replay', 'block')
        }
    }
    game.weakest_link.current_time--;
    weakestLinkCalcTime();
}

function weakestLinkCalcTime(time, returnFunc) {
    if (time == undefined) {
        var time = game.weakest_link.current_time
    }

    var min = Math.floor(time/60)
    var sec = Math.floor(time%60)
    if (sec < 10) {
        sec = "0" + sec;
    }
    ingame_weakest_link_time.innerHTML = min + ":" + sec

    if (returnFunc == true) {
        return min + ":" + sec;
    }
}