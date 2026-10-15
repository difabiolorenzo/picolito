// Tirage pseudo-aléatoire unique du jeu (docs/dev/reflexion/systeme_filtres.md §7.7).
// Tout tirage du jeu passe par rng() : avec une graine fixe, une partie se rejoue à l'identique
// (diagnostic de bug, tests). Ne jamais appeler Math.random() ailleurs : tests/checks/check_rng.js le refuse.
//
// Graine : ?seed=<texte> dans l'URL fixe la graine de chaque partie (la même partie à chaque lancement) ;
// sans paramètre, une graine neuve est tirée à chaque partie (Date.now()) : le jeu se comporte comme avant.
// La graine de la partie en cours est dans game.seed (affichée en console en mode debug).
// Dépend de rien ; chargé en premier.

const RNG = { seed: null, url_seed: null, next: null };

// PRNG mulberry32 : rapide, période 2^32, largement suffisant pour un jeu de cartes.
function mulberry32(state) {
    return function () {
        state |= 0;
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Graine texte -> entier 32 bits (FNV-1a), pour accepter n'importe quelle graine (« soiree-du-12 »).
function seedToInt(seed) {
    let h = 0x811c9dc5;
    for (const c of String(seed)) {
        h ^= c.codePointAt(0);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

function setSeed(seed) {
    RNG.seed = String(seed);
    RNG.next = mulberry32(seedToInt(RNG.seed));
    return RNG.seed;
}

// Nombre dans [0, 1), comme Math.random().
function rng() {
    return RNG.next();
}

// Graine d'une nouvelle partie : celle de l'URL si elle est fixée, sinon une graine neuve.
function newGameSeed() {
    return setSeed(RNG.url_seed ?? Date.now());
}

(function initSeed() {
    try {
        if (typeof location !== "undefined" && location.search) {
            const value = new URLSearchParams(location.search).get("seed");
            if (value) RNG.url_seed = value;
        }
    } catch (e) { /* URL illisible : graine neuve */ }
    newGameSeed();
})();
