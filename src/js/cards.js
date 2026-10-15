// Modèle interne des cartes (refonte des bases, voir docs/dev/reflexion/refonte_des_bases.md
// §4.6 et §5.8). Tout pack, ancien format ou `schema: 2`, est converti vers ce modèle au
// chargement : le moteur n'en connaît qu'un, et anciens et nouveaux packs se jouent ensemble.
//
// Carte du modèle :
//   id       : identifiant de la carte (schema 2) ou "<pack_id>:<index>" (ancien pack)
//   pack_id  : pack d'origine
//   type     : type du catalogue (types.js) ; family : sa famille
//   text     : texte à remplir (joueurs %1, %2… ; ancien pack : %s)
//   players  : joueurs nécessaires pour jouer la carte
//   suites   : [{ texts: [{ text, players }], offset_min, offset_max }]
//              une suite tire l'un de ses textes ; offset = décalage en cartes (1 = carte suivante)
//   infos    : lignes d'information (ou undefined)
//   legacy   : true pour une carte d'ancien pack (tokens %s)
//
// Dépend de types.js. Pas encore utilisé par le moteur (nouveau tirage : commit suivant).

// Plus grand numéro de joueur %N d'un texte (0 si aucun).
function maxPlayerToken(text) {
    let max = 0;
    for (const m of String(text ?? "").matchAll(/%(\d+)/g)) max = Math.max(max, Number(m[1]));
    return max;
}

// `text` d'une suite : un texte ou une liste de textes.
function suiteTextList(value) {
    if (Array.isArray(value)) return value.filter((t) => typeof t === "string");
    return typeof value === "string" ? [value] : [];
}

// Convertit un pack vers le modèle. Renvoie { cards, problems } : `problems` liste ce qui n'a pas
// pu être converti (la carte concernée est écartée, le reste du pack reste jouable).
function normalizePack(pack) {
    const problems = [];
    if (!pack || !Array.isArray(pack.db)) return { cards: [], problems: ["pack sans db"] };
    if (pack.schema === 2) return { cards: normalizeSchema2Cards(pack, problems), problems };
    if (pack.gamemode === "je_n_ai_jamais") return { cards: normalizeLegacyNeverCards(pack), problems };
    if (pack.gamemode === "picolo" || pack.gamemode === "war") return { cards: normalizeLegacyPicoloCards(pack, problems), problems };
    return { cards: [], problems: [`gamemode « ${pack.gamemode} » sans modèle de cartes`] };
}

function normalizeSchema2Cards(pack, problems) {
    const cards = [];
    for (const card of pack.db) {
        const def = getCardType(card && card.type);
        if (!def) { problems.push(`carte ${card && card.id} : type inconnu « ${card && card.type} »`); continue; }
        const suites = (Array.isArray(card.suites) ? card.suites : []).map((s) => ({
            texts: suiteTextList(s && s.text).map((text) => ({ text, players: maxPlayerToken(text) })),
            offset_min: s.offset_min ?? Math.min(def.suite_offset.min, s.offset_max ?? Infinity),
            offset_max: s.offset_max ?? Math.max(def.suite_offset.max, s.offset_min ?? 0)
        })).filter((s) => s.texts.length > 0);
        const players = card.joueurs ?? Math.max(maxPlayerToken(card.text), ...suites.flatMap((s) => s.texts.map((t) => t.players)));
        cards.push({
            id: card.id, pack_id: pack.id, type: card.type, family: def.family,
            text: card.text, players, suites, infos: card.infos, legacy: false
        });
    }
    return cards;
}

function normalizeLegacyNeverCards(pack) {
    return pack.db.map((entry, index) => ({
        id: `${pack.id}:${index}`, pack_id: pack.id, type: "collectif_bois_si", family: getFamilyOfType("collectif_bois_si"),
        text: entry.text, players: 0, suites: [], infos: entry.infos, legacy: true
    }));
}

// Ancien format : les suites sont des entrées séparées (parent_key = key de la carte, même type) ;
// chaque variante garde son nb_players.
function normalizeLegacyPicoloCards(pack, problems) {
    const alternatives = new Map(); // "type\0key" -> [{ text, players }]
    const mains = [];
    pack.db.forEach((entry, index) => {
        if (entry.parent_key) {
            const k = `${entry.type}\u0000${entry.parent_key}`;
            if (!alternatives.has(k)) alternatives.set(k, []);
            alternatives.get(k).push({ text: entry.text, players: parseInt(entry.nb_players, 10) || 0 });
        } else {
            mains.push({ entry, index });
        }
    });
    const used = new Set();
    const cards = [];
    for (const { entry, index } of mains) {
        const type = legacyTypeToCardType(entry.type, pack.id);
        if (!type) { problems.push(`entrée ${index} : ancien type « ${entry.type} » sans correspondance`); continue; }
        let players = parseInt(entry.nb_players, 10) || 0;
        const suites = [];
        if (entry.key) {
            const k = `${entry.type}\u0000${entry.key}`;
            const texts = alternatives.get(k);
            if (!texts) {
                problems.push(`entrée ${index} : suite « ${entry.key} » introuvable (carte gardée sans suite)`);
            } else {
                used.add(k);
                const offset = getCardType(type).suite_offset;
                suites.push({ texts, offset_min: offset.min, offset_max: offset.max });
                // Jouable seulement si au moins une variante de la suite l'est.
                players = Math.max(players, Math.min(...texts.map((t) => t.players)));
            }
        }
        cards.push({
            id: `${pack.id}:${index}`, pack_id: pack.id, type, family: getFamilyOfType(type),
            text: entry.text, players, suites, infos: entry.infos, legacy: true
        });
    }
    for (const k of alternatives.keys()) {
        if (!used.has(k)) problems.push(`suite orpheline « ${k.split("\u0000")[1]} » (type ${k.split("\u0000")[0]}) : aucune carte ne la déclenche`);
    }
    return cards;
}
