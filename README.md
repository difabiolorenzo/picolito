# Picolito

Application web reprenant le principe de **Picolo**. Jeu de boire en ligne depuis le navigateur (téléphone ou ordinateur) sans installation.

Disponible en ligne : https://difabiolorenzo.github.io/picolito/

Ceci est un projet personnel débuté vers 2019 pour corriger quelques problèmes du jeu original :
- Les phrases sur les réseaux sociaux
  `Bertrude, poste une phrase débile (sur l'app sociale de ton choix) contenant les mots ...`
- Aucun retour arrière possible.
- Pas de personnalisation des paramètres
- L'affichage de virus

# Prévention

L'abus d'alcool est dangereux pour la santé. Pour plus d'information sur l'alcool et l'alcoolisme:
- rendez vous sur [alcool-info-service.fr](https://www.alcool-info-service.fr/)
- ou appeler le `0 980 980 930` _de 8h à 2h, appel non surtaxé_

En poursuivant, vous confirmez être responsables des éventuelles conséquences que pourrait engendrer l'utilisation de Picolito. Prenez soin de vous et des autres.

L'application n'utilise que des données locales (cookies + `localStorage`) : liste des joueurs, noms d'équipe et réglages. Aucune donnée personnelle n'est collectée.

# Modes de jeu

## Picolo

Chaque partie de `Picolo` compte jusqu'à 50 phrases ayant une couleur prédéfinie indiquant son objectif :

### Probabilités

* `Bleu` :
	- Possède arbitrairement **70%** d'apparition.
	- Ce sont des actions, des questions, etc...
* `Vert` :
	- Possède arbitrairement **20%** d'apparition.
	- Peuvent être des sondages de groupe, des jeux, etc...
* `Jaune` / `Virus` :
	- Possède arbitrairement **5%** d'apparition.
	- Est un virus appliqué à un ou des joueur(s).
	- Apparaissent après le 10ème tour. Ils se terminent dans les 2 à 4 suivants.
* `Rouge` / `Cul secs`
	- Possède arbitrairement **5%** d'apparition.
	- Oblige un ou des joueur(s) à finir son verre.
	- Apparaissent après le 20ème tour.

Les virus et les culs-secs peuvent être désactivés dans les réglages, ainsi que le nombre de gorgées minimum et maximum.

## Picolo — Guerre (mode équipe)

Les joueurs sont répartis en **2 équipes** (noms personnalisables), affichées à l'écran des joueurs. Les phrases sont tournées vers les équipes (tokens `%t`/`%s` remplacés par les noms).
- Minimum **2 joueurs** pour lancer une partie.
- Les culs-secs et les virus sont **désactivés** : seules les couleurs bleue et verte apparaissent.
- Un sélecteur d'équipe est disponible dans le modificateur de phrase.

## Je n'ai jamais

Si vous avez déjà fait, vous en tirez les conséquences.

## Maillon Faible

Le but est de former une chaîne de bonnes réponses consécutives (6 par défaut) durant le temps de la manche (60 secondes).
C'est la personne dont le prénom est le premier dans l'ordre alphabétique qui débute la manche.
Lorsque la personne répond correctement à la question posée, l'animateur dit « Correct ».
Si le joueur ne trouve pas ou répond incorrectement, la chaîne retombe à 0.
Néanmoins, les candidats peuvent dire « Banque » après que leur prénom ait été prononcé, le nombre de bonnes réponses est alors mis en banque.
Après la fin de chaque manche, les joueurs votent pour la personne dite « Maillon faible ».

Réglages : difficulté des questions (niveaux 1 à 4, ou « progressive » : la chaîne fait monter la difficulté), chaîne maximale ou pas de maximum, comportement en cas d'égalité lors du vote (le maillon fort décide, maillon faible systématique, ou tirage aléatoire).

## Mix

Alternance aléatoire de questions de plusieurs modes (Picolo, Je n'ai jamais, Question pour un Champion selon les packs cochés). Les probabilités de chaque mode sont réglables par curseurs (sliders) dans le menu Mix.

# Packs de phrases

Les bases de données sont organisées en **packs** : chaque pack est identifié par un `id` (ex. `picolo_default_fr`) et mis en cache dans `localStorage`.

## Picolo

| Pack | Nom affiché |
|---|---|
| Défaut | Before - 🥴 / Getting Started - 🥴 |
| On est débiles | Silly / Getting Crazy - 🤪 |
| Bar | Bar - 🍻 |
| Caliente | Hot - 🍆 |
| Guerre | War - 🌩 |

## Je n'ai jamais

| Pack | Nom affiché |
|---|---|
| Populaire | Popular - ⭐ |
| Fête | Party - 🎉 |
| Coquin | Dirty & Sex - 💋 |

## Quiz

| Pack | Nom affiché |
|---|---|
| Maillon Faible | Le Maillon Faible |

## Langues

- L'**interface** est traduite en **FR / IT / EN** (sélecteur dans le menu).
- Les **packs** sont fournis en FR et EN (le pack Guerre est aussi en IT), les fichiers de base couvrant **14 langues** (`da`, `de`, `en`, `es`, `fi`, `fr`, `it`, `ja`, `ko`, `nb`, `nl`, `pt`, `ru`, `sv`).
- Réglage « Afficher seulement la base de données dans la langue d'affichage » pour filtrer les packs.

## Bases de données externes

- Import d'une base de données externe via **URL** (bouton « + » à côté de « Base de données »), mise en cache dans `localStorage`.
- Un gestionnaire permet de télécharger, recharger, décharger ou oublier chaque pack, d'explorer son contenu et de filtrer par langue.

# Réglages

- Animations, indicateur de couleur, **mode sombre**.
- Nombre de gorgées **minimum / maximum**, désactivation des virus / culs-secs, publications sur les réseaux sociaux.
- Chaîne maximum du Maillon Faible, difficulté, comportement en cas d'égalité.
- Réponse QPUC : cachée au clic ou directement visible.
- Probabilités des modes au Mix.
- Noms des joueurs, des équipes et réglages **sauvegardés** (cookies).

# Installation & usage

## En ligne

Rendez-vous sur https://difabiolorenzo.github.io/picolito/

## Hors-ligne (PWA)

Picolito est une **Progressive Web App** :
- Installable comme application (`Manifest.webmanifest`).
- Fonctionne **hors-ligne** grâce à un service worker (`sw.js`) : réseau d'abord, repli sur le cache (CDN Bootstrap/jQuery inclus).
- L'installation est proposée dans « Réglages » (icetone d'installation).

## En local (développement)

```bash
python -m http.server 8000
# puis http://localhost:8000/
```

> **`file://` n'est pas supporté à froid** : ouvrir `index.html` directement ne permet pas de charger les packs (`fetch()` bloqué sur ce protocole). Seul le contenu déjà en cache fonctionne, et l'import de BDD distante reste soumis au CORS. Un avertissement s'affiche dans ce cas (protocole `file://`).

Aucune commande de build/test/lint. Pour lancer : servir un serveur HTTP statique (voir plus haut).

# Développement

Projet en **vanilla JavaScript** (aucun build step, aucun framework de test, pas de npm/webpack/vite). Bootstrap 5.1.3, jQuery 3.5.1, Popper et Bootstrap Icons via CDN.

# Différences entre les versions

- Les modes `On est débiles`, `Bar` et `Caliente` sont débloqués
- Intégration de `Je n'ai jamais` aux modes de jeu
- Il n'est pas possible d'ajouter des règles personnalisées
- Possibilité d'ajouter des bases de données externes
- Mode `Mix` pour jouer avec les différents types de jeux
- Retours sur les phrases précédentes
- Possibilité de désactiver les virus, les culs-secs et les publications sur les réseaux sociaux
- Possibilité de changer le nombre de gorgées minimum et maximum
- Distinction des informations (joueurs, nombre de gorgées, équipes, textes en guillemets)
- Sauvegarde des noms de joueurs, des noms des équipes et des paramètres
- Mode équipe « Guerre »
- PWA : installation et fonctionnement hors-ligne (service worker)

# Licence / remerciements

Projet personnel, non affilié à l'application originale **Picolo** (marmelapp.com). Packs de phrases « Je n'ai jamais » inspirés de psycatgames.com