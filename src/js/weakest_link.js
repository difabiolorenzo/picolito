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
    
        for (var i = 0; i < game.player_list.length; i++) {
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
        for (var i = 0; i < game.player_list.length; i++) {
            game.weakest_link.vote_count.push(0)
        }
    }
    
    function weakestLinkDisplayVote() {
        ingame_weakest_link_current_player_voting.innerHTML = game.weakest_link.alphabetically_ordered_player[game.weakest_link.player_vote_index]
        function updateBallotList() {
                weakest_link_player_vote_ballot.innerHTML = ""
                var ul_head = "";
                var html_inner = "";
        
                for (var i = 0; i < game.weakest_link.alphabetically_ordered_player.length; i++) {
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
        }
    
        //determ who's strongest link
        if (game.weakest_link.tie_behaviour == "weakest") { 
            // player_ratio_sorted[game.weakest_link.weakest_link_id].pop()
        }
        game.weakest_link.strongest_link_id = player_ratio_sorted.sort(sortPlayerStrongest)[0][0]
        
        // each player stats
        var ul_head = "";
        var vote_result_innerHTML = "";
    
        for (var i = 0; i < game.weakest_link.alphabetically_ordered_player.length; i++) {
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
    
        weakest_link_vote_end_analytics_table.innerHTML = "";
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
                <td><button id="text_weakest_link_vote_quit" type="submit" class="btn btn-primary" onclick="exitGame()">Quitter</button></p></td>
            </tr>`;
        weakest_link_vote_end_analytics_table.innerHTML = analytics_table_innerHTML;
    
        //display loser
        switch (game.weakest_link.tie_behaviour) {
            case "strongest_link" :
            break;
            case "arbitrary" :
            break;
            case "both" :
                var behaviour_both_innerHTML = ""
                for (var i = 0; i < most_voted_player.length; i++) { 
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