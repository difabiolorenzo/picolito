function incrementCycleID() {
    // Les suites en attente peuvent prolonger la partie au-delà de la base de cartes
    const sentence_count = Math.max(game.current_gamemode.database_length, getGameLength())

    if (game.cycle_id <= sentence_count) {
        game.cycle_id++;
        retrieve(game.cycle_id);
        setBackgroundStyleColor(getActualBackgroundColorByHistory())
    }
    updateGameCycleIndicator();
}

function decrementCycleID() {
    if (game.cycle_id > 0) {
        game.cycle_id--;
        goToSpecificSentence(game.cycle_id)
    }
    setBackgroundStyleColor(getActualBackgroundColorByHistory())
}

function goToSpecificSentence(position) {
    game.cycle_id = position;
    updateGameCycleIndicator();
    retrieve(position);
    setBackgroundStyleColor(getActualBackgroundColorByHistory())

    global.modal_sentence_list.hide()
}

function setMaxPlayerNumber() {
    const player_count = game.player_list.length

    game.max_player_number = player_count;

    if (player_count >= 4) {
        game.max_player_number = 4;
    }

    if (game.gamemode == "picolo_war") {
        if (player_count >= 3) {
            game.max_player_number = 3;
        }
    }

    return game.max_player_number;
}

function retrieve(sentence_id) {
    // Generation si l'historique ne trouve rien, sinon fonction retrieve
    if (game.sentence_history[game.cycle_id] == undefined || game.sentence_history[game.cycle_id].formatted_sentence == "none") {
        // Une suite arrivée à échéance passe avant tout nouveau tirage
        if (playPendingSuite(game.cycle_id)) return;
        // Écran de fin d'une partie Picolo / Guerre / Mix : plus de tirage (la carte précédente reste affichée)
        const type = game.current_gamemode.gamemode_type;
        if ((type == "picolo" || type == "war" || type == "mix") && game.cycle_id >= getGameLength()) return;
        switch (game.current_gamemode.gamemode_type) {
            case "picolo": generatePicoloSentences(); break;
            case "war": generatePicoloSentences(); break;
            case "je_n_ai_jamais": generateJeNaiJamaisSentences(); break;
            case "mix": generateMixSentences(); break;
            case "question_pour_un_champion": generateQuestionPourUnChampionSentences(null, getQpucQuestionTypes(), getQpucTurnPlayer()); break;
            default: break;
        }
    } else {
        const sentence_requested = game.sentence_history[sentence_id];
        displaySentence(sentence_requested.formatted_sentence, sentence_requested.color, sentence_requested.pack_id, sentence_requested.answer);
        updateGameCycleIndicator();
    }

    if (game.current_gamemode.gamemode_type == "question_pour_un_champion") {
        resetQpucSentenceReveal();
    }
}

// ---------- Suites en attente (refonte_des_bases.md §5.6, décision « file d'attente ») ----------
// Longueur de base d'une partie : 50 cartes (max_sentence_amount), ou moins si les packs en ont moins.
function getBaseGameLength() {
    return Math.min(game.current_gamemode.database_length, game.max_sentence_amount);
}

// Après la dernière carte de base, plus de nouveau tirage : les suites en attente sont jouées l'une
// après l'autre, quelle que soit leur échéance (une règle se termine toujours).
// Renvoie true si une suite a été affichée à la position `cycle`.
function playPendingSuite(cycle) {
    const queue = getPendingSuites();
    const at_end = cycle >= getBaseGameLength();
    let index = -1;
    queue.forEach((pending, i) => {
        if ((at_end || pending.due <= cycle) && (index < 0 || pending.due < queue[index].due)) index = i;
    });
    if (index < 0) return false;
    const { item } = queue.splice(index, 1)[0];
    game.sentence_history[cycle] = item;
    updateDatabaseIndicator(item.pack_id);
    displaySentence(item.formatted_sentence, item.color, item.pack_id);
    return true;
}

// Longueur de la partie : base + cartes ajoutées par les suites qui tomberont après la dernière carte
// de base. Chaque suite prend la première place libre à partir de son échéance (après la fin de base :
// à la suite) ; deux suites dues en même temps passent l'une après l'autre.
function getGameLength() {
    const base = getBaseGameLength();
    // Suites déjà jouées après la fin de base
    let last = -1;
    for (let i = base; i < game.sentence_history.length; i++) {
        if (game.sentence_history[i] && game.sentence_history[i].is_suite) last = i;
    }
    // Suites encore en attente
    const queue = [...getPendingSuites()].sort((a, b) => a.due - b.due);
    const taken = new Set();
    for (const pending of queue) {
        let slot = Math.max(Math.min(pending.due, base), game.cycle_id + 1);
        while (taken.has(slot)) slot++;
        taken.add(slot);
        last = Math.max(last, slot);
    }
    return Math.max(base, last + 1);
}

function displaySentence(sentence, color, pack_id, answer) {
    document.getElementById("ingame_sentence").className = "";

    setTimeout(function () {
        if (game.animation == true) {
            ingame_sentence.className = "animation_text_change";
        }
        document.getElementById("ingame_sentence").innerHTML = sentence;
    }, 0);

    displayFamilyTitle(familyOfDisplayColor(color));
}

// Nom de la famille au-dessus de la phrase (cartes Picolo / Guerre / Mix), caché sinon.
function displayFamilyTitle(family) {
    const title = document.getElementById("text_ingame_title");
    if (family && FAMILIES[family]) {
        title.textContent = global.current_language_strings[FAMILIES[family].label_key] || family;
        title.classList.remove("d-none");
    } else {
        title.classList.add("d-none");
        title.textContent = "";
    }
}

// ---------- Tirage d'une carte Picolo / Guerre ----------
// Voir docs/dev/reflexion/refonte_des_bases.md §5.6 (organigramme) : FAMILLE (probabilités réglables)
// -> PACK (uniforme parmi ceux qui ont la famille) -> TYPE (pondéré par le poids du catalogue)
// -> CARTE (uniforme parmi les cartes jouables). Les packs, anciens ou schema 2, sont lus à travers
// le modèle de cartes (cards.js) ; les règles du tirage viennent du catalogue (types.js).

// Classe d'affichage d'une famille (fond de l'écran, liste des phrases : src/css/main.css).
// Les couleurs ne vivent que dans le CSS : type -> famille -> classe -> couleur.
const familyDisplayColor = (family) => "family-" + family;
const familyOfDisplayColor = (color) => (typeof color == "string" && color.startsWith("family-")) ? color.slice(7) : null;

// Cartes d'un pack, converties une fois par objet pack (sans modifier le pack).
const PACK_CARDS_CACHE = new WeakMap();
function getPackCards(pack) {
    if (!PACK_CARDS_CACHE.has(pack)) {
        const { cards, problems } = normalizePack(pack);
        if (problems.length) console.warn(`Pack "${pack.id}" : ${problems.length} entrée(s) non convertie(s)`, problems);
        PACK_CARDS_CACHE.set(pack, cards);
    }
    return PACK_CARDS_CACHE.get(pack);
}

// Cartes déjà jouées dans la partie (une carte ne revient pas). Remis à zéro par startGame.
function getPlayedCards() {
    if (!(game.played_cards instanceof Set)) game.played_cards = new Set();
    return game.played_cards;
}
const playedKey = (card) => `${card.pack_id}|${card.id}`;

function isCardPlayable(card, player_count) {
    return card.players <= player_count && !getPlayedCards().has(playedKey(card));
}

// Type autorisé par le catalogue et les réglages (indépendamment des cartes).
// Le nombre de joueurs se juge carte par carte (card.players, isCardPlayable) et non par type :
// beaucoup de cartes ne nomment personne (« Trinquons ensemble ! ») et se jouent à 0 ou 1 joueur.
function isTypeAllowed(type, player_count) {
    const def = CARD_TYPES[type];
    if (!def) return false;
    if (def.setting && game.picolito[def.setting] !== true) return false;
    return true;
}

// Types possibles d'une famille dans un pack : autorisés, avec au moins une carte jouable.
function getPossibleTypes(pack, family, player_count) {
    const cards = getPackCards(pack);
    return getTypesOfFamily(family).filter(type =>
        isTypeAllowed(type, player_count) && cards.some(c => c.type === type && isCardPlayable(c, player_count))
    );
}

// Conditions d'une famille portées par le catalogue (réglage, carte minimale, compteur, Guerre, fin de partie).
function isFamilyActive(family) {
    const def = FAMILIES[family];
    const settings = game.picolito;
    if (def.enabled_setting && settings[def.enabled_setting] !== true) return false;
    if (def.min_cycle_setting && game.cycle_id < settings[def.min_cycle_setting]) return false;
    if (def.counter && !(settings[def.counter] > 0)) return false;
    if (def.war === false && game.gamemode == "picolo_war") return false;
    if (def.not_in_last && game.cycle_id >= game.max_sentence_amount - def.not_in_last) return false;
    return true;
}

function getFamilyProbability() {
    return game.picolito.family_probability || defaultFamilyProbability();
}

// Tirage pondéré d'un élément de `items` selon `weightOf` (null si la liste est vide).
function weightedPick(items, weightOf) {
    if (items.length == 0) return null;
    const weights = items.map(item => Math.max(0, Number(weightOf(item)) || 0));
    const total = weights.reduce((s, w) => s + w, 0);
    if (total <= 0) return items[Math.floor(rng() * items.length)];
    const r = rng() * total;
    let cumulative = 0;
    for (let i = 0; i < items.length; i++) {
        cumulative += weights[i];
        if (r < cumulative) return items[i];
    }
    return items[items.length - 1];
}

// Famille tirée parmi les familles actives présentes dans au moins un pack (étapes 1-2).
// Une famille sans carte jouable n'est jamais tirée : le repli (§5.6) est ainsi implicite.
function getFamily(packs, player_count) {
    const families = Object.keys(FAMILIES).filter(family =>
        isFamilyActive(family) && packs.some(pack => getPossibleTypes(pack, family, player_count).length > 0)
    );
    const probability = getFamilyProbability();
    return weightedPick(families, family => probability[family]);
}

// Nombre de cartes jouables d'un pack au lancement (indicateur « Carte N / M »).
function countPlayablePicoloCards(pack, player_count) {
    return getPackCards(pack).filter(card => {
        const def = FAMILIES[card.family];
        if (!def || !isTypeAllowed(card.type, player_count) || card.players > player_count) return false;
        if (def.enabled_setting && game.picolito[def.enabled_setting] !== true) return false;
        if (def.war === false && game.gamemode == "picolo_war") return false;
        return true;
    }).length;
}

// Le pack a-t-il encore une carte jouable ? Picolo / Guerre / Je n'ai jamais : via le modèle de cartes
// (types autorisés, cartes pas encore jouées) ; packs de questions : questions restantes.
function hasPlayableCards(pack) {
    if (pack.gamemode == "picolo" || pack.gamemode == "war" || pack.gamemode == "je_n_ai_jamais") {
        const player_count = game.player_list.length;
        return getPackCards(pack).some(c => isTypeAllowed(c.type, player_count) && isCardPlayable(c, player_count));
    }
    return Array.isArray(pack.db) && pack.db.length > 0;
}

function generatePicoloSentences(preferred_pack_id=null) {
    const all_packs = game.current_gamemode.packs.filter(e => (e.gamemode == "picolo" || e.gamemode == "war"));
    if (all_packs.length == 0) {
        console.error("Aucune base de données");
        return;
    }
    // Pack imposé (Mix) : le tirage se limite à lui
    const packs = preferred_pack_id != null ? all_packs.filter(e => e.id == preferred_pack_id) : all_packs;
    if (packs.length == 0) {
        console.warn(`Pack imposé introuvable : ${preferred_pack_id}`);
        return;
    }
    const player_count = game.player_list.length;

    // 1-2. Famille
    const family = getFamily(packs, player_count);
    if (family == null) {
        console.warn("Aucune famille possible : plus de carte jouable dans les packs sélectionnés.");
        return;
    }
    // 3. Pack : uniforme parmi ceux qui ont cette famille
    const supporters = packs.filter(pack => getPossibleTypes(pack, family, player_count).length > 0);
    const pack = supporters[Math.floor(rng() * supporters.length)];
    // 4. Type : pondéré par le poids du catalogue
    const type = weightedPick(getPossibleTypes(pack, family, player_count), t => CARD_TYPES[t].weight);
    // 5. Carte : uniforme parmi les cartes jouables de ce type
    const candidates = getPackCards(pack).filter(c => c.type === type && isCardPlayable(c, player_count));
    const card = candidates[Math.floor(rng() * candidates.length)];
    if (global.debug==true) console.log("tirage", { family, pack: pack.id, type, card });

    // 8. Compteurs (règle, cul-sec) et carte jouée
    getPlayedCards().add(playedKey(card));
    const counter = FAMILIES[family].counter;
    if (counter) game.picolito[counter]--;

    const color = familyDisplayColor(family);
    function pushHistoryItem(text_data, posOffset, infos) {
        addHistoryItem({
            posOffset: posOffset,
            original_sentence: text_data.original_sentence,
            sentence_keys: text_data.keys,
            // L'encart d'information éventuel est collé au texte de la phrase
            formatted_sentence: text_data.formatted_sentence + buildSentenceInfosMarkup(infos),
            key: card.id,
            type: type,
            family: family,
            color: color,
            pack_id: pack.id,
            infos: infos
        });
    }

    // 6. Remplissage, affichage
    updateDatabaseIndicator(pack.id);
    const text_data = textReplacer(card.text);
    displaySentence(text_data.formatted_sentence, color, pack.id);
    pushHistoryItem(text_data, 0, card.infos);

    // 7. Suite : un texte jouable parmi ses variantes, mêmes joueurs que la carte, au décalage prévu
    if (card.suites.length > 0) {
        const suite = card.suites[0];
        const texts = suite.texts.filter(t => t.players <= player_count);
        if (texts.length == 0) {
            console.warn(`Suite sans variante jouable à ${player_count} joueur(s) (carte ${card.id}). Carte conservée.`);
            return;
        }
        const suite_text = texts[Math.floor(rng() * texts.length)].text;
        const offset = suite.offset_min + Math.floor(rng() * (suite.offset_max - suite.offset_min + 1));
        pushHistoryItem(textReplacer(suite_text, text_data.assignment), offset, undefined);
    }
}

function generateMixSentences() {
    // Si plusieurs modes dans mix alors traitement spécifiques

    const packs_by_mode = {
        // Les packs "war" (mode équipe) participent à la lane picolo du Mix
        picolo: game.current_gamemode.packs.filter(e => (e.gamemode == "picolo" || e.gamemode == "war")),
        je_n_ai_jamais: game.current_gamemode.packs.filter(e => (e.gamemode == "je_n_ai_jamais")),
        question_pour_un_champion: game.current_gamemode.packs.filter(e => (e.gamemode == "question_pour_un_champion"))
    };

    // Le Mix (pour l'instant) ne mélange que les types de question autorisés
    function hasAllowedQpucQuestion(pack) {
        return pack.db.some(e => !e.type || MIX_ALLOWED_QUESTION_TYPES.includes(e.type));
    }
    packs_by_mode.question_pour_un_champion = packs_by_mode.question_pour_un_champion.filter(hasAllowedQpucQuestion);

    // Modes éligibles : au moins une carte (ou question) encore jouable dans un des packs du mode
    const eligible_modes = Object.keys(packs_by_mode).filter(g => {
        return packs_by_mode[g].some(pack => hasPlayableCards(pack));
    });

    if (eligible_modes.length == 0) { return; }

    let selected_mode;
    if (eligible_modes.length == 1) {
        selected_mode = eligible_modes[0];
    } else {
        const weights = eligible_modes.map(g => game.mix_gamemode_probability[g] || 0);
        const total = weights.reduce((sum, w) => sum + w, 0);

        if (total <= 0) {
            // Fallback équiprobable si aucun poids n'est défini
            selected_mode = eligible_modes[Math.floor(rng() * eligible_modes.length)];
        } else {
            const random_value = rng() * total;
            let cumulative = 0;
            selected_mode = eligible_modes.find((g, i) => {
                cumulative += weights[i];
                return random_value < cumulative;
            });
            if (!selected_mode) { selected_mode = eligible_modes[eligible_modes.length - 1]; }
        }
    }

    function randomPicoloID() {
        const packs = packs_by_mode.picolo.filter(pack => hasPlayableCards(pack));
        generatePicoloSentences(packs[Math.floor(rng() * packs.length)].id);
        if (global.debug==true) console.log("generation picolo sentence mix")
    }

    function randomJeNaiJamaisID() {
        const packs = packs_by_mode.je_n_ai_jamais.filter(pack => hasPlayableCards(pack));
        generateJeNaiJamaisSentences(packs[Math.floor(rng() * packs.length)].id);
        if (global.debug==true) console.log("generation je_n_ai_jamais sentence mix")
    }

    function randomQuestionPourUnChampionID() {
        const packs = packs_by_mode.question_pour_un_champion.filter(pack => hasPlayableCards(pack));
        generateQuestionPourUnChampionSentences(packs[Math.floor(rng() * packs.length)].id, MIX_ALLOWED_QUESTION_TYPES);
        if (global.debug==true) console.log("generation question_pour_un_champion sentence mix")
    }

    switch (selected_mode) {
        case "picolo": randomPicoloID(); break;
        case "je_n_ai_jamais": randomJeNaiJamaisID(); break;
        case "question_pour_un_champion": randomQuestionPourUnChampionID(); break;
    }

    return;
}

function updateMixGamemodeDisplaySlider(gamemode, value) {
    let html_element_id = "";

    switch (gamemode) {
        case "picolo":
            html_element_id = "gamemode_mix_section_slider_picolo_probability_placeholder"
            break;
        case "je_n_ai_jamais":
            html_element_id = "gamemode_mix_section_slider_je_n_ai_jamais_probability_placeholder"
            break;
        case "question_pour_un_champion":
            html_element_id = "gamemode_mix_section_slider_question_pour_un_champion_probability_placeholder"
            break;
    }

    if (value == "hide") { document.getElementById(html_element_id).classList.add("d-none") }
    if (value == "display") { document.getElementById(html_element_id).classList.remove("d-none") }
}

function updateMixGamemodeProbability(gamemode, value) {
    const modes = ["picolo", "je_n_ai_jamais", "question_pour_un_champion"];
    const others_sum = modes.filter(g => g != gamemode)
        .reduce((sum, g) => sum + game.mix_gamemode_probability[g], 0);

    let new_value = parseInt(value);
    if (isNaN(new_value) || new_value < 0) { new_value = 0; }

    // La somme des sliders ne doit pas dépasser 100
    if (others_sum + new_value > 100) { new_value = Math.max(0, 100 - others_sum); }

    game.mix_gamemode_probability[gamemode] = new_value;
    document.getElementById(`gamemode_mix_section_slider_${gamemode}_probability`).value = new_value;
    document.getElementById(`gamemode_mix_section_slider_${gamemode}_probability_value`).innerHTML = new_value;
}

// Remplit le gabarit HTML de la carte QPUC (#qpuc_sentence_template) et retourne son markup
// Je n'ai jamais : cartes collectif_bois_si du modèle de cartes (anciens packs convertis ou schema 2).
// Une carte ne revient pas dans la partie (game.played_cards) ; le pack n'est pas modifié.
function generateJeNaiJamaisSentences(preferred_pack_id=null) {
    const all_packs = game.current_gamemode.packs.filter(e => (e.gamemode == "je_n_ai_jamais"));
    if (all_packs.length == 0) {
        console.error("Aucune base de données \"Je n'ai Jamais\"");
        return;
    }
    const player_count = game.player_list.length;
    const packs = (preferred_pack_id != null ? all_packs.filter(e => e.id == preferred_pack_id) : all_packs)
        .filter(pack => hasPlayableCards(pack));
    if (packs.length == 0) { return; }

    const pack = packs[Math.floor(rng() * packs.length)];
    const candidates = getPackCards(pack).filter(c => c.type === "collectif_bois_si" && isCardPlayable(c, player_count));
    const card = candidates[Math.floor(rng() * candidates.length)];
    getPlayedCards().add(playedKey(card));
    if (global.debug==true) console.log("je n'ai jamais", pack.id, card);

    const text_data = textReplacer(card.text);
    const formatted_sentence = text_data.formatted_sentence + buildSentenceInfosMarkup(card.infos);

    updateDatabaseIndicator(pack.id);
    displaySentence(formatted_sentence, "je_n_ai_jamais", pack.id);
    addHistoryItem(
        {
            posOffset: 0,
            original_sentence: text_data.original_sentence,
            sentence_keys: text_data.keys,
            formatted_sentence: formatted_sentence,
            key: card.id,
            type: "je_n_ai_jamais",
            color: "je_n_ai_jamais",
            pack_id: pack.id,
            infos: card.infos
        }
    );
}

// ---- QPUC : mini-moteur de manches à points (Neuf points gagnants / Quatre à la suite) ----

// Types de question autorisés pour le tirage QPUC (filtre par manche choisie au menu)
