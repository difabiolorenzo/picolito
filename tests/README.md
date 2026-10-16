# Tests hors navigateur -- outillage

Outils Node minimaux (aucun depôt npm, aucun framework) pour valider le projet
sans ouvrir le navigateur : simulation de parties, audit de la cohérence des
packs DB, et tests ciblés (joueurs/équipes, sanitisation XSS, token `$`, i18n).
Réutilise le code source réel via un stubbing DOM minimal — **ce ne sont pas des
tests unitaires classiques**, mais un moyen de faire des parties simulées et de
vérifier des comportements isolés. Depuis le découpage 0.37.2 (tâche 6),
`_harness.js` charge tous les modules de `src/js/` dans l'ordre du navigateur.

```
tests/
├── README.md               ← ce fichier
├── run_all.js              ← lance toutes les vérifications (à utiliser par défaut)
├── _harness.js             ← stubs DOM + chargement des sources + état de jeu
├── checks/                 ← validateurs ré-exécutables (lecture seule)
│   ├── generate_sentences.js   simulateur de parties (CLI)
│   ├── check_pack.js           audit statique d'un pack (multi-schémas, --all)
│   ├── check_ids.js            vérification croisée des ids HTML/JS/CSS
│   ├── check_infos.js          test encart d'information des phrases
│   ├── check_langs.js          parité des 14 dictionnaires d'interface
│   ├── check_originality.js    originalité des packs réécrits (schema 2)
│   ├── check_rng.js            tirage seedé : pas de Math.random(), parties rejouables
│   ├── check_types.js          catalogue des types et familles (src/js/types.js)
│   ├── check_cards.js          modèle interne des cartes (src/js/cards.js) et format schema 2
│   ├── check_fill.js           remplissage des joueurs : %1/%2, suites, %t
│   ├── check_draw.js           tirage par familles : règles, proportions, packs mélangés
│   ├── check_suites.js         suites en attente : aucune perdue, collisions, prolongation
│   ├── check_never.js          Je n'ai jamais sur le modèle de cartes, Mix
│   ├── check_experimental.js   packs expérimentaux : réglage, filtre, badge
│   ├── check_sanitize.js       test sanitisation XSS des BDD externes
│   ├── check_token_escape.js   test token `$` / slash-dollar
│   └── smoke_player_teams.js   smoke test modale joueurs/équipes (CLI)
├── fixtures/               ← packs d'exemple au format schema 2 (jamais chargés par le jeu)
├── tools/
│   ├── matrix_packs.js         matrice types / actions / couleurs par famille (CLI, --html)
│   ├── next_id.js              prochain identifiant de carte libre (packs schema 2)
│   └── retired_ids.json        identifiants de cartes supprimées, jamais réutilisés
└── output/                 ← artefacts générés (ignoré par git)
```

## Prérequis

- Node.js (testé avec Node 26) — pas d'installation requise.

## 0. Tout vérifier

```bash
node tests/run_all.js
```

Lance les 16 checks de `checks/` et vérifie que les scripts de `index.html` et le
`PRECACHE` de `sw.js` sont identiques et dans le même ordre. Code de sortie ≠ 0
si une vérification échoue.

## 1. Simuler une partie

```bash
node tests/checks/generate_sentences.js <pack.json> [pack2.json ...] [options]
```

Options :

| Option | Défaut | Description |
|---|---|---|
| `--players N` | 3 | Nombre de joueurs (noms auto « Joueur 1..N ») |
| `--count N` | 30 | Phrases générées (les sessions sont rejouées à la fin du pack) |
| `--team1 X` | Equipe 1 | Nom de l'équipe 1 (remplace le token `%t`) |
| `--team2 X` | Equipe 2 | Nom de l'équipe 2 |
| `--seed X` | aléatoire | Graine du tirage : la même graine rejoue exactement la même partie (la graine utilisée est affichée en tête de sortie) |
| `--json` | — | Sortie machine-readable (stdout) |
| `--raw` | — | Affiche le HTML brut au lieu du texte nettoyé |
| `--debug` | — | Active les logs internes (`game.debug = true`) |

Exemples :

```bash
# Partie guerre FR à 2 joueurs
node tests/checks/generate_sentences.js src/db/picolo/war_fr.json --players 2 --count 40

# Partie Picolo classique à 4 joueurs
node tests/checks/generate_sentences.js src/db/picolo/default_fr.json --players 4 --count 50

# Sortie JSON vers un fichier (fidèle UTF-8, contourne la pagination console)
node tests/checks/generate_sentences.js src/db/picolo/war_fr.json --players 3 --count 200 --json > resultat.json
```

La sortie terminal affiche une entrée par phrase : position, famille (action/parole/…, ou couleur pour Je n'ai jamais),
texte (avec le nom du joueur/équipe réellement remplacés), et `[suite]` pour les
phrases qui sont la continuité d'une carte précédente. Le pied de bilan indique le
nombre d'**erreurs** (exceptions levées par le moteur : à rapporter comme bug) et
d'**avertissements** (suite introuvable, etc.).

Les modes supportés : `picolo`, `war`, `je_n_ai_jamais`, `mix`. `question_pour_un_champion`
n'est pas simulable (mini-moteur de manches requis) — l'outil le signale.

## 2. Auditer un pack (données)

```bash
node tests/checks/check_pack.js <pack.json> [pack2.json ...] | --all
```

`--all` audite tous les packs de `src/db/**/*.json` (79 fichiers : 66 picolo/war,
6 je n'ai jamais, 1 maillon faible, 2 question pour un champion).

Un pack `schema: 2` (nouveau format, `docs/dev/reflexion/refonte_des_bases.md` §4.6) est vérifié selon ses propres règles :

- **en-tête** : liste fermée de champs (`schema`, `id`, `gamemode`, `language`, `version`, `experimental`, `pack_name`, `pack_description`, `db`) ; tout autre champ (`filters`, poids, couleur…) est refusé, car le tirage se règle dans `src/js/types.js` ; `id` au format `{picolo|je_n_ai_jamais}_{famille}_v2_{langue}` ;
- **cartes** : champs `id`, `type`, `text`, `suites`, `joueurs`, `infos` seulement ; `id` au format `{famille}_0000`, unique, absent de `tests/tools/retired_ids.json` ; type du catalogue (`collectif_bois_si` seul dans un pack Je n'ai jamais) ; joueurs `%1`, `%2`… numérotés sans trou, `%s` refusé, `%t` réservé aux packs `war` ; une seule suite, dont `text` est un texte ou une liste, dont les joueurs existent dans la carte, et dont `offset_min` ≤ `offset_max` ; `joueurs` ≥ plus grand `%N` ;
- **parité des langues** : chaque langue d'une même famille a exactement les mêmes cartes que le français (mêmes `id`, même type, même nombre de suites, mêmes joueurs).

Pour les anciens packs, le schéma vérifié dépend du `gamemode` :

| Gamemode | Schéma db | Contrôles spécifiques |
|---|---|---|
| `picolo` / `war` | `{filters, db:[{type,text,key,parent_key,nb_players}]}` | couverture filters↔db, distribution types/tokens, phrases-suite |
| `je_n_ai_jamais` | `db:[{text}]` | doublons de texte |
| `maillon_faible` | `db:[{question,reponse,difficulty(1-4)}]` | doublons de question, difficulty valide |
| `question_pour_un_champion` | `db:[{series,type,question,reponse,points?}]` | doublons (clé `question+reponse`, les paires QCM/texte ne sont pas des doublons), `reponse` vide = avertissement |

Pour `picolo`/`war`, vérifie aussi les **phrases-suite** (`key != ""`) : clés
orphelines, suites sans variante `nb_players=0`, suites jamais jouables à 2-4
joueurs. Ces contrôles correspondent aux causes d'un crash corrigé le 2026-09-20
(`getSentenceByKey` dans `picolito.js`).

Un « avertissement » (ex. `reponse` vide dans QPUC) n'est pas une erreur ;
un message `ERREUR :` fait quitter le script avec un code ≠ 0.

```bash
node tests/checks/check_pack.js src/db/picolo/war_fr.json
node tests/checks/check_pack.js --all
```

## 3. Smoke test modale joueurs/équipes

```bash
node tests/checks/smoke_player_teams.js
```

Vérifie les fonctions de gestion des joueurs et des équipes ajoutées avec la
refonte UI/UX du 2026-09-20 : trim à l'ajout,
désassignation (`team: "null"`), auto-équilibrage, renommage d'équipe **effectif**
(`setTeamName` met à jour `game.team_X`, ex-bug C1), nom vide → défaut de langue
(ex-bug C2), suppression + undo, et cas limites (suppression de tous les joueurs,
id régénérés lors d'un undo sur liste vide, auto-balance avec effectif impair,
ids inconnus sans crash). Sortie : une ligne « OK : … » par assertion, arrêt
immédiat (`exit 1`) sur le premier échec.

## 4. Test sanitisation XSS des BDD externes

```bash
node tests/checks/check_sanitize.js
```

Couvre le correctif 5d (2026-09-25) : `sanitizeExternalText` (échappement
`<` `>` `&` sans double-échappement), `escapeHTML` (guillemets inclus),
`DBManager.decorateEntries` (sanitisation `text`/`question`/`reponse` des packs
externes uniquement — les packs vanilla restent inchangés), `addDBData` par
import fichier (le XSS d'un pack externe est neutralisé avant mise en cache
`db:<id>`), et `getSourceLabel` (libellé i18n avec fallback sur l'identifiant).

## 5. Test token `$` / slash-dollar

```bash
node tests/checks/check_token_escape.js
```

Couvre le correctif 5c (2026-09-25) : le token `$` rend une gorgée, un dollar
littéral est échappé `\$` dans la chaîne décodée (JSON `\\$`), les suffixes
grammaticaux collés restent intacts, et le placeholder `\uE000` n'est pas
restauré en double-dollar.

## 6. Test encart d'information des phrases (tâche 3, 0.37.2)

```bash
node tests/checks/check_infos.js
```

Couvre l'encart `infos` (champ DB optionnel `string[]` caché par défaut) :
`buildSentenceInfosMarkup` (pas de markup si absent, bouton + liste `d-none`,
échappement HTML/XSS, `event.stopPropagation()`, troncature à 8 lignes),
`toggleSentenceInfos` (révéler/masquer via `d-none`), et la production réelle
sur le pack `war_fr.json` (« les rois de France »). Sortie : une ligne
« OK : … » par assertion, arrêt (`exit 1`) sur le premier échec.

## 7. Vérification croisée des ids (tâche 2, 0.37.2)

```bash
node tests/checks/check_ids.js
```

Établit **l'état des lieux des ids** : ids déclarés dans `index.html` (hors
commentaires) vs **références** dans le JS (`getElementById`, `querySelector(#…)`,
jQuery `$('#…')`, `I18N_TARGETS`, attributs `data-bs-target`/`aria-*`/`for`), les
sélecteurs CSS `#…` (couleurs hexadécimales exclues) et les **auto-globales**
navigateur (id utilisé comme identifiant JS nu). Rapporte :
- les **références orphelines** (id référencé jamais déclaré — exemple trouvé :
  4 sélecteurs CSS ciblant d'anciens ids, corrigés en 0.37.2) ;
- les **ids déclarés sans référence directe**, avec leur nature
  (auto-global JS ou inerte) ;
- les **doublons** de déclaration.

Code de sortie ≠ 0 si des références orphelines subsistent.

## 8. Parité des dictionnaires d'interface (langues UI)

```bash
node tests/checks/check_langs.js
```

Charge les **14 dictionnaires** (`fr`, `it`, `en` + `da`, `de`, `es`, `fi`,
`ja`, `ko`, `nb`, `nl`, `pt`, `ru`, `sv`) et vérifie :
- le **même jeu de clés** que `fr.js` (sans clé manquante ni inconnue, soit les
  mêmes 234 clés partout) ;
- les **placeholders préservés** (`%s`, `%d` via `qpuc.js` ; `{name}` via
  `players.js` ; le `%s` de `file_protocol_warning_text`) dans les clés qui
  reçoivent une substitution ;
- les **clés France vides** (`prevention_*` : site + n° d'appel) dans les
  11 langues additionnelles (FR les renseigne, EN les vide, IT les localise :
  ce sont des choix historiques non contrôlés ici) ;
- l'**enregistrement** des 14 dictionnaires dans la map `language` de
  `lang.js` et le `<script>` correspondant dans `index.html`.

Code de sortie ≠ 0 dès la première incohérence.

## 9. Matrice types / actions / couleurs

```bash
node tests/tools/matrix_packs.js              # tableau console
node tests/tools/matrix_packs.js --html       # + écrit tests/output/matrix_packs.html (ouvrable)
```

Génère le tableau de conception des packs (types × actions × couleurs) en lisant les packs
`src/db/picolo/{bar,default,hot,silly,war}_*.json` :
- colonnes de gauche : `type` (1-25 + types nommés), `interprétations` (table
  `INTERPRETATIONS` embarquée, à maintenir), `nature` (familles concernées),
  `couleurs` ;
- colonnes de droite : valeurs exactes de `player_count` déclenchées par famille
  (`0,1,2`…), ou **X** sur fond sombre quand l'action n'est pas applicable à ce
  mode.
- En note sous le tableau : les types déclarés dans `filters` sans phrase dans
  la `db` (avec les langues concernées — suit la correction du mapping de
  types, version 0.37.2 tâche 1).
- Le rendu HTML colore les cellules `type` et `couleurs` de la teinte
  correspondante (bleu/jaune/vert/rouge).

## 10. Originalité des packs réécrits

```bash
node tests/checks/check_originality.js <pack.json> [pack2.json ...] [--seuil 0.5] [--inclusion 0.85] [--top N] [--json]
node tests/checks/check_originality.js --all     # tous les packs `schema: 2` de src/db (lancé par run_all.js)
```

Chantier de réécriture des bases (`docs/dev/reflexion/refonte_des_bases.md` §4.3) : compare chaque phrase d'un pack `schema: 2` (texte de la carte et de ses suites) aux phrases d'origine de la même langue, et signale celles qui en sont trop proches. Références : `docs/dev/sources/anciennes_bases/` (copie des bases d'origine) et `docs/dev/sources/nouveau_je_n_ai_jamais/` (site tiers). `docs/` étant ignoré par git, ces références n'existent que sur le poste de travail : sans elles, le contrôle des packs est sauté avec un avertissement.

Mesure : trigrammes de caractères après normalisation (minuscules, sans accents, ponctuation ni tokens `%s` `%t` `%1` `$`), pondérés par leur rareté dans les références, pour que les formules du jeu (« bois $ gorgées ») pèsent peu. Une phrase est en **erreur** si sa similarité (Dice pondéré) atteint `--seuil` ou si `--inclusion` de ses trigrammes se retrouvent dans une même ancienne phrase ; une phrase de moins de 40 caractères ne donne qu'un avertissement (un seul mot partagé y fait monter le score, et une phrase aussi courte est rarement protégeable). `--top N` liste les N phrases les plus proches, même sous le seuil, pour calibrer. Repères mesurés : copie = 1 ; paraphrase proche ≈ 0,55 ; phrase neuve reprenant les formules du jeu ≈ 0,35-0,4. Seuil par défaut 0,5, à recalibrer sur le pack pilote. Un auto-test de la mesure tourne à chaque exécution.

## 11. Prochain identifiant de carte

```bash
node tests/tools/next_id.js <famille> [nombre]     # ex. node tests/tools/next_id.js bar 5
```

Donne les prochains `id` libres d'une famille de pack (`bar_0043`…) : plus grand numéro déjà utilisé dans les packs `schema: 2`, toutes langues confondues, en comptant `tests/tools/retired_ids.json`. Un id n'est jamais réutilisé : à chaque suppression d'une carte, ajouter son id dans ce fichier.

## 12. Tirage seedé

```bash
node tests/checks/check_rng.js
```

Tout tirage du jeu passe par `rng()` (`src/js/rng.js`, chargé en premier ; voir `docs/dev/reflexion/systeme_filtres.md` §7.7). Vérifie qu'aucun fichier de `src/js/` n'appelle `Math.random()` en dehors de `rng.js` (un appel oublié casserait la reproductibilité sans que rien ne le signale), que le générateur est déterministe, et qu'une partie simulée (Picolo, Je n'ai jamais, Mix) se rejoue à l'identique avec la même graine. Dans le navigateur, `?seed=<texte>` dans l'URL fixe la graine de chaque partie ; sans paramètre, une graine neuve est tirée à chaque partie. La graine de la partie en cours est dans `game.seed` (affichée en console en mode debug).

## 13. Catalogue des types et familles

```bash
node tests/checks/check_types.js
```

Cohérence de `src/js/types.js` (`docs/dev/reflexion/refonte_des_bases.md` §5) : probabilités des familles (entières, total 100), clés i18n `family_<famille>`, couleurs de chaque famille dans `src/css/main.css` (fond, liste des phrases, mode sombre), réglages de `game.picolito` référencés par les familles et les types (vérifiés sur les vraies valeurs par défaut de `main.js`), famille, joueurs minimum, poids et décalage par défaut de chaque type, au moins un type par famille. Vérifie aussi que chaque type utilisé par les anciens packs `src/db/picolo` (toutes langues) a un nouveau type dans la table de correspondance, et affiche la répartition par famille qui en résulte.

## 14. Modèle interne des cartes et format schema 2

```bash
node tests/checks/check_cards.js
```

Tout pack, ancien format ou `schema: 2`, est converti par `normalizePack` (`src/js/cards.js`) vers un modèle unique de cartes (`id`, `type`, `family`, `text`, `players`, `suites`, `infos`, `legacy`). Vérifie la conversion de tous les anciens packs Picolo, Guerre et Je n'ai jamais (aucune carte ni variante de suite perdue, décalages par défaut du type : 2 à 4 cartes pour une ancienne règle, carte suivante sinon), celle du pack d'exemple `tests/fixtures/picolo_exemple_v2_fr.json`, et que `check_pack.js` accepte ce pack (français et anglais identiques) mais refuse un pack invalide (12 erreurs attendues) et une traduction incomplète.

## 15. Remplissage des joueurs

```bash
node tests/checks/check_fill.js
```

`textReplacer` (`src/js/format.js`) remplit un texte avec une **attribution** des joueurs et de l'équipe, qu'il renvoie et qu'on lui repasse pour remplir la suite d'une carte. Vérifie : `%1`, `%2`… désignent toujours le même joueur et deux numéros deux joueurs différents ; une suite reprend les joueurs et l'équipe de sa carte ; pour un ancien pack, le n-ième `%s` d'une suite reprend le n-ième joueur de la carte et les `%s` en plus sont des joueurs nouveaux (corrige « X est le pilier de bar » suivi de « Y n'est plus le pilier de bar ») ; un seul `%t` par carte et sa suite ; « [joueur] » quand il n'y a pas assez de joueurs ; et, en partie simulée, qu'une suite nomme bien les joueurs de sa carte.

## 16. Tirage par familles

```bash
node tests/checks/check_draw.js
```

Tirage d'une carte Picolo / Guerre (`generatePicoloSentences`, `src/js/picolito.js`) selon l'organigramme de `docs/dev/reflexion/refonte_des_bases.md` §5.6 : famille (probabilités `game.picolito.family_probability`), puis pack (uniforme parmi ceux qui ont la famille), puis type (pondéré par le poids du catalogue), puis carte (uniforme parmi les cartes jouables). Simule des parties à graine fixe et vérifie : Règle et Cul-sec pas avant leur carte minimale, au plus leur compteur par partie, jamais en Guerre, désactivables ; pas de Manche sur les 2 dernières cartes ; aucune carte ne revient dans une partie ; aucune carte ne nomme plus de joueurs qu'il n'y en a, et à 0 joueur plusieurs familles restent jouables ; `social_posting_enabled` ; proportions des familles (± 4 points), des packs et des types (à égalité) ; un ancien pack et un pack schema 2 dans la même partie.

## 17. Suites en attente

```bash
node tests/checks/check_suites.js
```

Une suite n'est plus écrite d'avance dans l'historique : `addHistoryItem` (`src/js/format.js`) la place dans une file (`game.pending_suites`) avec son échéance, et `retrieve` (`src/js/picolito.js`) la joue entre deux cartes quand vient son tour, avant tout nouveau tirage. Deux suites dues en même temps passent l'une après l'autre ; après la dernière carte de base (50 par défaut), plus de nouveau tirage : les suites en attente sont jouées à la suite, et `getGameLength()` donne la longueur prolongée (indicateur « N / M »). Vérifie sur 300 parties simulées : aucune suite perdue, jamais avant son échéance, retard seulement dû à d'autres suites, rien d'autre que des suites après la fin de base, longueur annoncée exacte ; et, sur les anciens packs, une règle (virus) qui se termine 2 à 4 cartes plus tard et une autre suite à la carte suivante.

## 18. Je n'ai jamais

```bash
node tests/checks/check_never.js
```

Le mode Je n'ai jamais (`generateJeNaiJamaisSentences`, `src/js/picolito.js`) tire des cartes `collectif_bois_si` du modèle de cartes, anciens packs convertis ou packs `schema: 2`, et garde les cartes jouées dans `game.played_cards` au lieu de retirer les phrases du pack. Vérifie : chaque phrase une seule fois par partie, `pack.db` intact, plus de tirage une fois le pack épuisé et phrases de nouveau jouables à la partie suivante ; affichage inchangé (couleur Je n'ai jamais, pas de pastille de famille) ; texte rempli une seule fois (gorgées affichées = gorgées enregistrées) ; ancien pack et pack schema 2 ensemble ; et, dans le Mix, qu'un pack Je n'ai jamais épuisé laisse la place à Picolo sans carte vide (`hasPlayableCards`).

## 19. Packs expérimentaux

```bash
node tests/checks/check_experimental.js
```

Un pack réécrit est livré à côté de l'ancien avec `"experimental": true` (dans son fichier **et** dans son entrée de `VANILLA_DB_INDEX`, `src/js/catalog.js`) ; il n'apparaît que si le réglage `show_experimental_packs` (gestionnaire de bases, désactivé par défaut) est activé (`docs/dev/reflexion/refonte_des_bases.md` §6.1). Vérifie : réglage enregistré et désactivé par défaut ; champ `experimental` identique dans le catalogue et dans chaque fichier ; `DBManager.getAll()` cache ou montre les packs expérimentaux sans perdre le filtre de langue ; le champ survit à la mise à jour du catalogue après téléchargement ; badge « Expérimental » ; désactiver le réglage retire un pack expérimental déjà coché dans le Mix.

## Notes

- Le harnais transforme les `const` de premier niveau des sources en `var` pour les rendre accessibles aux tests (dans le navigateur, les scripts les partagent déjà).
- Le stubbing DOM est minimal : les éléments liés par id sont des objets factices ;
  seuls sont exercés les chemins qui touchent `game` et quelques `document.getElementById`.
- Encodage : les fichiers sont lus/écrits en UTF-8. Sur une console Windows à la
  pagination limitée (mojibake des accents), préférer `--json > fichier.json`.
- Le bout du bilan « erreurs » ne doit pas être confondu avec un échec du script :
  une partie simulée qui génère des phrases sans exception est un succès.

## Contexte

Cet outillage a été créé pour reproduire hors navigateur le bug de lancement du
mode « guerre » (crash `getSentenceByKey` sur la clé `champion-friend`), puis
étendu au fil des versions 0.37.x.
