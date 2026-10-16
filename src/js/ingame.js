// Navigation de jeu : inits des modes, chargement des bases, page de jeu,
// indicateur de cycle, options et boutons de navigation.
// Dépend de dbmanager.js (DBManager), qpuc.js (initQpucManche),
// weakest_link.js (initWeakestLink) et du moteur picolito.js.

function displayPage(page) {
    const pages = ["menu", "picolito", "question_pour_un_champion", "weakest_link"]

    for (let i in pages) {
        document.getElementById(pages[i]).classList.add("d-none");
    }
    const page_el = document.getElementById(page);
    page_el.classList.remove("d-none");
    page_el.classList.add("page_transition");
    page_el.addEventListener("animationend", () => page_el.classList.remove("page_transition"), { once: true });
    page_el.focus();
}

function setBackgroundStyleColor(value) {
    const element = document.getElementById("picolito");
    element.classList.add("page", "dark_affected");
    ["je_n_ai_jamais", "black", "qpuc", ...Object.keys(FAMILIES).map(f => "family-" + f)].forEach(c => element.classList.remove(c));
    element.classList.add(value);
}

async function initPicolo() {
    // Cherche la première instance de packs car nous savons que nous n'utilisons qu'un seul mode
    // Plusieurs sera avec initMix
    const pack_id = game.current_gamemode.packs[0].pack_id
    const pack_source = game.current_gamemode.packs[0].pack_source
    
    const data = await loadDatabase({pack_id: pack_id, source: pack_source})
    // Chargement direct dans current_gamemode.packs (plus de buffer pending_db)
    game.current_gamemode.packs = data ? [data] : [];

    setMaxPlayerNumber()
    displayPage('picolito');

    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", false);

    updateWarTeamOptionDisplay(game.gamemode == "picolo_war");

    warnLanguageMismatchIfNeeded();
}

async function initJeNaiJamais() {
    // Cherche la première instance de packs car nous savons que nous n'utilisons qu'un seul mode
    // Plusieurs sera avec initMix
    const pack_id = game.current_gamemode.packs[0].pack_id
    const pack_source = game.current_gamemode.packs[0].pack_source
    
    const data = await loadDatabase({pack_id: pack_id, source: pack_source})
    // Chargement direct dans current_gamemode.packs (plus de buffer pending_db)
    game.current_gamemode.packs = data ? [data] : [];

    displayPage('picolito');

    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", false);

    warnLanguageMismatchIfNeeded();
}

async function initMix() {
    // A CONCATENER game.mix_gamemode_list_picolo et je_n_ai_jamais
    if (global.debug==true) console.log("gamemode_mix", game.mix_gamemode_list_picolo)
    const loadedPacks = await Promise.all(game.mix_gamemode_list_picolo.map(pack => loadDatabase({pack_id: pack.pack_id, source: pack.pack_source})))
    // Chargement direct dans current_gamemode.packs (plus de buffer pending_db)
    game.current_gamemode.packs = loadedPacks.filter(Boolean);

    setMaxPlayerNumber()
    displayPage('picolito');
    
    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", true);

    warnLanguageMismatchIfNeeded();
}

async function initQuestionPourUnChampion() {
    // Plusieurs packs possibles : même principe que initMix
    const packs = game.current_gamemode.packs
    if (global.debug==true) console.log("gamemode question_pour_un_champion", packs)
    const loadedPacks = await Promise.all(packs.map(pack => loadDatabase({pack_id: pack.pack_id, source: pack.pack_source})))
    // Chargement direct dans current_gamemode.packs (plus de buffer pending_db)
    game.current_gamemode.packs = loadedPacks.filter(Boolean);

    initQpucManche();

    setMaxPlayerNumber()
    displayPage('picolito');

    displayIngameOptionPanel(true)
    manageIngameOptionDisplay({option: "start", display: true});

    manageNavDisplay("quit",true);
    manageNavDisplay("restart",false);
    manageNavDisplay("navigation_arrows", true);

    warnLanguageMismatchIfNeeded();
}

function listStoredDatabase() {
    const local_storage_keys = JSON.parse(localStorage.getItem("db:index:external"))

    for (let i = 0; i < local_storage_keys.length; i++) {
        if (global.debug==true) console.log(local_storage_keys[i])
    }
}

// Charge une base depuis le cache localStorage (clé unifiée db:<id>) ou la télécharge.
// Retourne le pack (objet complet) ou `null` en cas d'échec. Plus de buffer `pending_db` :
// les inits placent le résultat directement dans `game.current_gamemode.packs`.

async function loadDatabase({ pack_id = null, source = "vanilla" }) {
    try {
        const dbIndex = DBManager.getById(pack_id, source);
        if (!dbIndex) {
            throw new Error(`Aucune base trouvée avec l'id "${source}:${pack_id}" dans le catalogue.`);
        }

        // Si la base est disponible dans le localStorage → on la renvoie directement
        let storedData = DBManager.loadLocal(dbIndex);
        if (!storedData) {
            await DBManager.download(dbIndex); // Attend le téléchargement
            refreshDBList();

            // On relit le localStorage après téléchargement
            storedData = DBManager.loadLocal(dbIndex);
        } else {
            // Check-auto de version (max 1 toutes les 6h) : met à jour le cache si la base a changé
            const DB_VERSION_CHECK_DELAY = 6 * 60 * 60 * 1000;
            const lastCheck = parseInt(localStorage.getItem(`db:check:${dbIndex.id}`) || "0", 10);
            if (Date.now() - lastCheck >= DB_VERSION_CHECK_DELAY) {
                localStorage.setItem(`db:check:${dbIndex.id}`, Date.now());
                await DBManager.refresh(dbIndex);
                storedData = DBManager.loadLocal(dbIndex);
            }
        }

        if (storedData) {
            // if (global.debug==true) console.log(`Base "${storedData.pack_name}" (${pack_id}) chargée depuis le localStorage.`);
            return storedData;
        }
        return null;
    } catch (error) {
        console.warn(`Impossible de charger la base "${source}:${pack_id}" :`, error.message);
        return null;
    }
}

function startGame() {

    // Aucune base de données chargée (échec de téléchargement, file://, etc.)
    if (game.current_gamemode.packs.length == 0) {
        showToast(global.current_language_strings.db_load_error);
        return;
    }

    game.started = true;

    // Graine de la partie (rng.js) : fixe si ?seed= dans l'URL, sinon neuve
    game.seed = newGameSeed();
    game.played_cards = new Set();   // cartes déjà jouées (picolito.js)
    game.pending_suites = [];        // suites en attente (format.js, picolito.js)
    if (global.debug==true) console.log("seed", game.seed);

    manageNavDisplay("navigation_arrows", true);

    displayIngameOptionPanel(false);
    manageIngameOptionDisplay({option: "start", display: false});

    // Les packs sont déjà chargés par les inits, plus de copie (ni de buffer pending_db)
    // Les packs utilisent des Arrays natifs (packs[i].db)
    if (global.debug==true) console.log(game.current_gamemode.packs)

    // Longueur maximale possible
    game.current_gamemode.database_length = calcCombineDatabasesPossibleLenght();

    incrementCycleID();
}

function exitGame() {
    if (game.gamemode == "weakest_link") {
        stopsound("weakest_link_amb_60")

        if (game.weakest_link.timer) { clearInterval(game.weakest_link.timer) }
    }

    setBackgroundStyleColor("black");
    document.getElementById("text_ingame_title").classList.add("d-none");
    document.getElementById("text_ingame_title").innerHTML = "";

    displaySentence("", undefined); // reset HTML sentence display

    // Réinitialisation des indicateurs dans la ingame_topbar
    document.getElementById("picolito_gamemode_infos").innerHTML = "";
    document.getElementById("picolito_bdd_infos").innerHTML = "";

    updateGameCycleIndicator(); // reset cycle count
    resetVariables();
    game.current_gamemode = {};

    picolitoNavigationButtonsDisplay("previous", false)
    picolitoNavigationButtonsDisplay("game_cyle", false)
    picolitoNavigationButtonsDisplay("next", false)

    displayIngameOptionPanel(false)
    manageIngameOptionDisplay({option: "start", display: false});
    manageIngameOptionDisplay({option: "replay", display: false});

    manageNavDisplay("navigation_arrows", false);
    manageNavDisplay("players", true);
    manageNavDisplay("restart",false);

    updateWarTeamOptionDisplay(false);

    displayPage('menu');

    game.mix_gamemode_list_picolo = [];
    document.getElementById("mix_db_update_button").disabled = true;
    document.getElementById("gamemode_mix_picolo_db_list").querySelectorAll("input[type=checkbox]").forEach(checkbox => checkbox.checked = false);
    document.getElementById("gamemode_mix_je_n_ai_jamais_db_list").querySelectorAll("input[type=checkbox]").forEach(checkbox => checkbox.checked = false);
    document.getElementById("gamemode_mix_question_pour_un_champion_db_list").querySelectorAll("input[type=checkbox]").forEach(checkbox => checkbox.checked = false);
    ["picolo", "je_n_ai_jamais", "question_pour_un_champion"].forEach(g => updateMixGamemodeDisplaySlider(g, "hide"));

    // Reset de la sélection QPUC et du mini-moteur de manches
    game.qpuc.selected_gamemode_type = null;
    game.qpuc.selected_packs = [];
    game.qpuc.manche = null;
    game.qpuc.answer_revealed = false;
    game.qpuc.scores = {};
    game.qpuc.q4_remaining = 40;
    game.qpuc.q4_streak = 0;
    game.qpuc.q4_player_index = 0;
    if (game.qpuc.q4_timer) {
        clearInterval(game.qpuc.q4_timer);
        game.qpuc.q4_timer = null;
    }
    const qpuc_score_panel = document.getElementById("qpuc_score_panel");
    if (qpuc_score_panel) qpuc_score_panel.classList.add("d-none");

    game.started = false;
}

function calcCombineDatabasesPossibleLenght() {
    const packs = game.current_gamemode.packs
    let length = 0;

    for (let i in packs) {
        const pack = packs[i];
        if (pack.gamemode == "picolo" || pack.gamemode == "war") {
            // Cartes jouables selon le catalogue, les réglages et le nombre de joueurs (picolito.js)
            length += countPlayablePicoloCards(pack, game.player_list.length);
        } else {
            length += pack.db.length;
        }
    }

    return length;
}

function updateDatabaseIndicator(pack_id) {
    const pack = game.current_gamemode.packs.filter(bdd => bdd.id === pack_id)[0];
    if (pack == undefined) { return; }

    let gamemode_type = "";
    switch (pack.gamemode) {
        case "picolo":
        case "war":
            gamemode_type = global.current_language_strings.picolo;
            break;
        case "je_n_ai_jamais":
            gamemode_type = global.current_language_strings.je_n_ai_jamais;
            break;
        case "question_pour_un_champion":
            gamemode_type = global.current_language_strings.question_pour_un_champion;
            break;
        default: break;
    }
    document.getElementById("picolito_gamemode_infos").innerHTML = gamemode_type;
    document.getElementById("picolito_bdd_infos").innerHTML = pack.pack_name;
}

function restartGame() {
    let gamemode_type = game.current_gamemode.gamemode_type;
    // Récupère la manche QPUC (Neuf points gagnants / Quatre à la suite) avant que
    // exitGame() ne la remette à null (game.qpuc.selected_gamemode_type = null)
    const qpuc_type = game.current_gamemode.qpuc_type ?? game.qpuc.selected_gamemode_type;
    // Reconstruction des descripteurs {pack_id, pack_source} depuis les packs chargés
    let packs = game.current_gamemode.packs.map(pack => ({
        pack_id: pack.id,
        pack_source: pack.pack_source ?? (DBManager.catalog.some(e => e.id === pack.id && e.source === "external") ? "external" : "vanilla")
    }));

    // Réinitialisation des variables du jeu
    exitGame();

    selectGame(
        {
            gamemode_type : gamemode_type,
            packs : packs,
            restart : true,
            qpuc_type : qpuc_type
        }
    );
}

async function selectGame({gamemode_type, packs=[], restart=false, qpuc_type=null}) {
    // Appelé depuis le menu avec selectGame({ gamemode_type:gamemode_type, packs: [ {pack_id:pack_id, pack_source:pack_source}] })
    game.current_gamemode = {
        gamemode_type: gamemode_type,
        packs: packs,
        restart: restart,
        qpuc_type: qpuc_type
    };
    
    switch (gamemode_type) {
        case "picolo": game.gamemode = "picolo"; await initPicolo(); break;
        case "je_n_ai_jamais": game.gamemode = "je_n_ai_jamais"; await initJeNaiJamais(); break;
        case "mix": game.gamemode = "mix"; await initMix(); break;
        case "weakest_link":
            game.gamemode = "weakest_link";
            if (game.player_list.length >= 2) {
                await initWeakestLink();
            } else {
                showToast(global.current_language_strings.weakest_link_minimum_player_requierement)
                global.modal_player_menu.show();
                return;
            }
            break;
        case "question_pour_un_champion" :
            game.gamemode = "question_pour_un_champion";
            await initQuestionPourUnChampion();
            break;
        case "war":
            game.gamemode = "picolo_war";
            if (game.player_list.length >= 2) {
                await initPicolo();
            } else {
                showToast(global.current_language_strings.gamemode_picolo_war_minimum_requierement)
                global.modal_player_menu.show();
                return;
            }
            break;
        default: console.warn(`Gamemode "${gamemode_type}" non reconnu.`); break;
    }

    if (restart == true) {
        startGame();
    }
}

function selectMixGamemode() {
    // initMix();
    selectGame({gamemode_type:"mix"})
    return;
}

// ---- Mode Question pour un Champion (QPUC) ----

// Navigation : choix d'un type de mode depuis le menu principal, puis ouverture de la page QPUC

function updateSelectedMixGamemode(element) {
    if (global.debug==true) console.log(element)
    
    // ajout d'element dans game.mix_gamemode_list_picolo ou suppression en fonction de la checkbox (checked)
    if (element.checked == true) {
        game.mix_gamemode_list_picolo.push({ pack_id: element.pack_id, pack_source: element.pack_source });
        if (global.debug==true) console.log(`Ajout de ${element.pack_id} (${element.gamemode_type}) dans ${game.mix_gamemode_list_picolo}`)
    } else {
        let index = game.mix_gamemode_list_picolo.findIndex(e => e.pack_id === element.pack_id);
        game.mix_gamemode_list_picolo.splice(index, 1);
        if (global.debug==true) console.log(`Suppression de ${element.pack_id} (${element.gamemode_type}) dans ${game.mix_gamemode_list_picolo}`)
    }

    // ajout d'element dans game.mix_gamemode_list_picolo ou rien s'il est déjà présent


    // if (element.gamemode_type == "picolo") {
    //     if (global.debug==true) console.log(element.pack_id, element.gamemode_type + " dans " + game.mix_gamemode_list_picolo)
        
    //     // ajout d'element dans game.mix_gamemode_list_picolo ou rien s'il est déjà présent
    //     const index = game.mix_gamemode_list_picolo.findIndex(e => e.pack_id === element.pack_id);
    //     if (index === -1) {
    //         game.mix_gamemode_list_picolo.push({ pack_id: element.pack_id, pack_source: element.pack_source });
    //     } else {
    //         game.mix_gamemode_list_picolo.splice(index, 1);
    //     }
    // }
    // if (element.gamemode_type == "je_n_ai_jamais") {        
    //     // ajout d'element dans game.mix_gamemode_list_je_n_ai_jamais ou rien s'il est déjà présent
    //     const index = game.mix_gamemode_list_je_n_ai_jamais.findIndex(e => e.pack_id === element.pack_id);
    //     if (index === -1) {
    //         game.mix_gamemode_list_je_n_ai_jamais.push({ pack_id: element.pack_id, pack_source: element.pack_source });
    //     } else {
    //         game.mix_gamemode_list_je_n_ai_jamais.splice(index, 1);
    //     }
    // }

    if (global.debug==true) console.log("mix_gamemode_list_picolo", game.mix_gamemode_list_picolo)

    if (game.mix_gamemode_list_picolo.length > 0) {
        document.getElementById("mix_db_update_button").disabled = false;
    } else {
        document.getElementById("mix_db_update_button").disabled = true;
    }

    refreshMixProbabilitySliders();
}

function refreshMixProbabilitySliders() {
    const mix_gamemodes = ["picolo", "je_n_ai_jamais", "question_pour_un_champion"];
    const active_modes = mix_gamemodes.filter(g =>
        document.querySelectorAll(`#gamemode_mix_${g} input[type=checkbox]:checked`).length > 0
    );

    mix_gamemodes.forEach(g => {
        const visible = active_modes.includes(g) && active_modes.length >= 2;
        updateMixGamemodeDisplaySlider(g, visible ? "display" : "hide");
    });

    if (active_modes.length >= 2) {
        const others = active_modes.filter(g => g != "question_pour_un_champion");
        const other_weight = active_modes.includes("question_pour_un_champion")
            ? Math.floor(90 / others.length)
            : Math.floor(100 / active_modes.length);

        active_modes.forEach(g => {
            const weight = g == "question_pour_un_champion"
                ? 100 - other_weight * others.length
                : other_weight;

            game.mix_gamemode_probability[g] = weight;
            document.getElementById(`gamemode_mix_section_slider_${g}_probability`).value = weight;
            document.getElementById(`gamemode_mix_section_slider_${g}_probability_value`).innerHTML = weight;
        });
    }
}

function picolitoNavigationButtonsDisplay(button, display=false) {
    let selected_button;
    switch (button) {
        case "previous" : selected_button = document.getElementById("game_cycle_previous_button"); break;
        case "next" : selected_button = document.getElementById("game_cycle_next_button"); break;
        case "game_cyle" : selected_button = document.getElementById("game_cycle_count"); break;
        default : break;
    }

    if (display == true) {
        selected_button.disabled = false;
    } else if (display == false) {
        selected_button.disabled = true;
    }
}

function displayIngameOptionPanel(value) {
    const panel = document.getElementById("ingame_option_screens")
    panel.classList.toggle("d-none", value != true); // display: flex vient de main.css
}

function manageIngameOptionDisplay({ option = null, display = false }) {    
    let selected_option;
    switch (option) {
        case "start" : selected_option = document.getElementById("ingame_ready_screen"); break;
        case "replay" : selected_option = document.getElementById("ingame_replay_screen"); break;
        default: break;
    }

    selected_option.classList.toggle("d-none", display != true);
}

function updateWarTeamOptionDisplay(display) {
    const ids = ["text_game_teams_ready", "text_game_teams_replay"];
    for (const id of ids) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.toggle("d-none", !display);
        }
    }
}

function manageNavDisplay(navigation_option=null, display=false) {
    let selected_navigation_option;
    switch(navigation_option) {
        case "navigation_arrows": selected_navigation_option = document.getElementById("navigation_arrows"); break;
        case "players": selected_navigation_option = document.getElementById("text_game_player_menu"); break;
        case "quit": selected_navigation_option = document.getElementById("text_game_quit_topbar"); break;
        case "restart": selected_navigation_option = document.getElementById("text_game_restart_topbar"); break;
        default: break;
    }

    if (display == true) {
        selected_navigation_option.style.display = "inline-flex";
        selected_navigation_option.style.justifyContent = "center";
    } else {
        selected_navigation_option.style.display = "none";
    }
}

function updateGameCycleIndicator() {
    // 50 cartes (ou moins), prolongées par les suites en attente (picolito.js)
    const max_sentences = getGameLength();
    //previous
    if (game.cycle_id > 0) {
        picolitoNavigationButtonsDisplay("previous", true);
    } else {
        picolitoNavigationButtonsDisplay("previous", false);
    }
    //game count
    if (game.cycle_id >= 0) {
        picolitoNavigationButtonsDisplay("game_cyle", true)
        if (game.cycle_id >= max_sentences) {
            document.getElementById("game_cycle_count").innerHTML = global.current_language_strings.end;
        } else {
            document.getElementById("game_cycle_count").innerHTML = (game.cycle_id + 1) + "/" + max_sentences;
        }
    } else {
        picolitoNavigationButtonsDisplay("game_cyle", false)
        document.getElementById("game_cycle_count").innerHTML = "-";
    }
    //next
    if (game.cycle_id < max_sentences && game.cycle_id >= 0) {
        picolitoNavigationButtonsDisplay("next", true);
    } else {
        picolitoNavigationButtonsDisplay("next", false);
    }
    //start
    if (game.cycle_id < 0) {
        displayIngameOptionPanel(true)
        manageIngameOptionDisplay({option: "start", display: true});
    } else {
        displayIngameOptionPanel(false)
        manageIngameOptionDisplay({option: "start", display: false});
    }
    // retry
    if (game.cycle_id >= max_sentences) {
        displayIngameOptionPanel(true)
        manageIngameOptionDisplay({option: "replay", display: true});
    } else {
        displayIngameOptionPanel(false)
        manageIngameOptionDisplay({option: "replay", display: false});

    }
}
