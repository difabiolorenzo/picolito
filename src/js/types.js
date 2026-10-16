// Catalogue des types de cartes et des familles (refonte des bases, voir
// docs/dev/reflexion/refonte_des_bases.md §5).
//
// Hiérarchie : type (porté par la carte) -> famille (ce catalogue) -> couleur (CSS seulement).
// Tout ce qui règle le tirage vit ici, jamais dans les packs : famille, poids, nombre minimal
// de joueurs, décalage par défaut des suites, réglage qui active le type. Les packs ne fournissent
// que des cartes, et plusieurs packs joués ensemble suivent les mêmes règles.
//
// Dépend de rien ; chargé après rng.js et avant catalog.js. Pas encore utilisé par le moteur :
// le nouveau tirage arrive dans un commit suivant (voir docs/TODO.md).

// ---- Familles ----
// probability    : poids par défaut du tirage de la famille (réglable par les joueurs, total 100).
// enabled_setting, min_cycle_setting, counter : clés de game.picolito qui conditionnent la famille
//                  (famille activée, carte minimale d'apparition, compteur restant).
// war            : false = jamais en mode Guerre.
// not_in_last    : nombre de dernières cartes de la partie où la famille ne sort pas
//                  (transposition de l'ancienne règle « pas de vert sur les 2 dernières cartes »).
// label_key      : clé i18n du nom de la famille (ajoutée aux 14 dictionnaires avec l'affichage).
const FAMILIES = Object.freeze({
    action:    Object.freeze({ order: 1, probability: 25, label_key: "family_action" }),
    parole:    Object.freeze({ order: 2, probability: 30, label_key: "family_parole" }),
    collectif: Object.freeze({ order: 3, probability: 25, label_key: "family_collectif" }),
    manche:    Object.freeze({ order: 4, probability: 10, label_key: "family_manche", not_in_last: 2 }),
    regle:     Object.freeze({ order: 5, probability: 5,  label_key: "family_regle",
                               enabled_setting: "virus_enabled", min_cycle_setting: "virus_sentence_id_start_min", counter: "virus_remaining", war: false }),
    cul_sec:   Object.freeze({ order: 6, probability: 5,  label_key: "family_cul_sec",
                               enabled_setting: "chug_enabled", min_cycle_setting: "chug_minimum_cycle_start", counter: "chug_remaining", war: false })
});

// ---- Types ----
// family       : famille du type.
// min_players  : indication de rédaction (joueurs que nomme en général une carte de ce type) ;
//                le tirage ne s'en sert pas, il juge chaque carte par le nombre de joueurs qu'elle nomme.
// weight       : poids du type dans le tirage au sein de sa famille (1 = même chance que les autres).
// suite_offset : décalage par défaut d'une suite, en cartes ({min, max}, 1 = carte suivante) ;
//                une suite peut le remplacer par offset_min / offset_max.
// setting      : clé booléenne de game.picolito qui doit être vraie pour que le type soit possible.
const NEXT_CARD = Object.freeze({ min: 1, max: 1 });
const RULE_DURATION = Object.freeze({ min: 2, max: 4 });

const CARD_TYPES = Object.freeze({
    action_defi:           Object.freeze({ family: "action",    min_players: 1, weight: 1, suite_offset: NEXT_CARD }),
    action_duel:           Object.freeze({ family: "action",    min_players: 2, weight: 1, suite_offset: NEXT_CARD }),
    action_inconnu:        Object.freeze({ family: "action",    min_players: 1, weight: 1, suite_offset: NEXT_CARD }),
    action_social_posting: Object.freeze({ family: "action",    min_players: 1, weight: 1, suite_offset: NEXT_CARD, setting: "social_posting_enabled" }),
    parole_question:       Object.freeze({ family: "parole",    min_players: 1, weight: 1, suite_offset: NEXT_CARD }),
    parole_juge:           Object.freeze({ family: "parole",    min_players: 3, weight: 1, suite_offset: NEXT_CARD }),
    parole_devine:         Object.freeze({ family: "parole",    min_players: 2, weight: 1, suite_offset: NEXT_CARD }),
    collectif_bois_si:     Object.freeze({ family: "collectif", min_players: 0, weight: 1, suite_offset: NEXT_CARD }),
    collectif_vote:        Object.freeze({ family: "collectif", min_players: 2, weight: 1, suite_offset: NEXT_CARD }),
    collectif_designe:     Object.freeze({ family: "collectif", min_players: 3, weight: 1, suite_offset: NEXT_CARD }),
    manche_categorie:      Object.freeze({ family: "manche",    min_players: 2, weight: 1, suite_offset: NEXT_CARD }),
    manche_jeu:            Object.freeze({ family: "manche",    min_players: 2, weight: 1, suite_offset: NEXT_CARD }),
    regle_joueur:          Object.freeze({ family: "regle",     min_players: 1, weight: 1, suite_offset: RULE_DURATION }),
    regle_globale:         Object.freeze({ family: "regle",     min_players: 0, weight: 1, suite_offset: RULE_DURATION }),
    cul_sec:               Object.freeze({ family: "cul_sec",   min_players: 1, weight: 1, suite_offset: NEXT_CARD })
});

// ---- Anciens packs (format sans `schema`) ----
// Correspondance approximative ancien type -> nouveau type, le temps que les anciens packs soient
// remplacés. Un ancien type mélangeant plusieurs mécaniques va dans la plus fréquente
// (type 1 -> action_defi, type 23 -> manche_jeu). Le type 4 change de sens dans le pack `bar`.
const LEGACY_TYPE_MAP = Object.freeze({
    "1": "action_defi",
    "2": "regle_joueur",
    "3": "regle_globale",
    "4": "manche_categorie",
    "5": "cul_sec",
    "6": "cul_sec",
    "7": "cul_sec",
    "8": "parole_question",
    "9": "manche_jeu",
    "10": "action_duel",
    "11": "action_duel",
    "12": "manche_categorie",
    "13": "collectif_bois_si",
    "14": "collectif_vote",
    "15": "action_social_posting",
    "16": "parole_devine",
    "17": "action_inconnu",
    "18": "action_inconnu",
    "19": "action_defi",
    "20": "action_inconnu",
    "21": "action_defi",
    "22": "action_inconnu",
    "23": "manche_jeu",
    "24": "parole_juge",
    "25": "collectif_bois_si",
    "social_posting": "action_social_posting",
    "virus_individual": "regle_joueur",
    "virus_global": "regle_globale"
});
const LEGACY_TYPE_MAP_BY_PACK = Object.freeze({
    bar: Object.freeze({ "4": "manche_jeu" })
});

// Famille de pack d'un identifiant : picolo_bar_fr -> bar, picolo_bar_v2_fr -> bar,
// je_n_ai_jamais_party_v2_fr -> party (null pour un autre format, ex. les packs de questions).
const PACK_ID_PATTERN = /^(?:picolo|je_n_ai_jamais)_([a-z0-9]+)(?:_v(\d+))?_([a-z]{2})$/;
function packFamilyFromId(pack_id) {
    const m = PACK_ID_PATTERN.exec(String(pack_id ?? ""));
    return m ? m[1] : null;
}

// Nouveau type d'une carte d'un ancien pack (null si inconnu).
function legacyTypeToCardType(legacy_type, pack_id) {
    const key = String(legacy_type);
    const by_pack = LEGACY_TYPE_MAP_BY_PACK[packFamilyFromId(pack_id)];
    return (by_pack && by_pack[key]) || LEGACY_TYPE_MAP[key] || null;
}

function getCardType(type) {
    return CARD_TYPES[type] ?? null;
}

function getFamilyOfType(type) {
    return CARD_TYPES[type]?.family ?? null;
}

// Types d'une famille, dans l'ordre du catalogue.
function getTypesOfFamily(family) {
    return Object.keys(CARD_TYPES).filter((t) => CARD_TYPES[t].family === family);
}

// Probabilités par défaut des familles (copie modifiable pour game.picolito).
function defaultFamilyProbability() {
    return Object.fromEntries(Object.entries(FAMILIES).map(([f, def]) => [f, def.probability]));
}
