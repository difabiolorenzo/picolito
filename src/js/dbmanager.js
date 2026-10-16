// Gestionnaire de bases de données : cache localStorage unifié (db:<id>),
// catalogue, explorateur, menus de sélection de packs (DBManager).
// Dépend de main.js (showToast) et de cookie.js.

const DBManager = {
    // Catalogue unifié (source de vérité) : entrées vanilla + externes, chacune taguée `source`
    catalog: [],

    loaded: [], // Bases chargées en mémoire (optionnel)

    // ---- Initialisation ----
    async init() {
        // Construire le catalogue : vanilla (constante module) + externes (index localStorage)
        const vanilla = game.vanilla_db_index || [];
        const external = JSON.parse(localStorage.getItem("db:index:external") || "[]");

        this.catalog = [
            ...vanilla.map(db => ({ ...db, source: "vanilla" })),
            ...external.map(db => ({ ...db, source: "external" }))
        ].map(db => this.checkAvailability(db));

        return this.catalog;
    },

    // ---- Récupérer une entrée du catalogue par id (option : source) ----
    getById(id, source = null) {
        return this.catalog.find(db => db.id === id && (source === null || db.source === source)) || null;
    },

    // ---- Persister l'index externe dans localStorage ----
    persistExternalIndex() {
        localStorage.setItem("db:index:external", JSON.stringify(this.catalog.filter(d => d.source === "external")));
    },

    // ---- Toutes les DB ----
    // Packs expérimentaux (réécriture des bases en cours) : visibles seulement si le réglage
    // show_experimental_packs est activé (voir docs/dev/reflexion/refonte_des_bases.md §6.1).
    getAll() {
        let list = this.catalog;
        if (game.show_experimental_packs !== true) {
            list = list.filter(db => db.experimental !== true);
        }
        if (game.only_display_current_language_databases) {
            list = list.filter(db => db.language === global.current_language);
        }
        return list;
    },

    // ---- Vérifier la disponibilité d'une base (statique, sans requête réseau) ----
    checkAvailability(db) {
        return { ...db, available: !!db.url || this.loadLocal(db) != null };
    },

    // ---- Clé localStorage d'une base (pattern unique db:<id> depuis v0.37) ----
    storageKey(db) {
        return `db:${db.id}`;
    },

    // ---- Fetch JSON avec timeout ----
    async fetchJson(url, timeoutMs = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) throw new Error(`Requête échouée (${res.status})`);
            return await res.json();
        } finally {
            clearTimeout(timeoutId);
        }
    },

    // ---- Enrichir les entrées d'un pack (sanitisation + métadonnées) ----
    decorateEntries(data, db) {
        if (!Array.isArray(data.db)) return;
        for (const entry of data.db) {
            if (!entry) continue;
            if (db.source === "external") {
                // QPUC et Maillon Faible injectent question/reponse en innerHTML (audit 5d)
                ["text", "question", "reponse"].forEach(field => {
                    if (typeof entry[field] === "string") {
                        entry[field] = sanitizeExternalText(entry[field]);
                    }
                });
            }
            entry.pack_id = data.id;
            entry.bdd_id = data.id; // compat ancien cache localStorage
            entry.gamemode_type = data.gamemode;
        }
    },

    // ---- Mettre à jour le catalogue après un téléchargement ----
    updateIndexAfterDownload(db, data) {
        const indexData = {
            id: data.id,
            version: data.version,
            url: db.url,
            gamemode: data.gamemode,
            language: data.language,
            pack_name: data.pack_name,
            pack_description: data.pack_description,
            filters: data.filters,
            experimental: data.experimental === true,
            available: true,
            source: db.source
        };

        const idx = this.catalog.findIndex(e => e.id === db.id && e.source === db.source);
        if (idx !== -1) this.catalog[idx] = indexData;
        else this.catalog.push(indexData);

        // Seuls les packs externes sont persistés dans l'index localStorage
        if (db.source === "external") this.persistExternalIndex();
    },

    // ---- Charger depuis localStorage (avec migration one-shot des clés legacy vanilla:<id> / external:<id>) ----
    loadLocal(db) {
        const stored = localStorage.getItem(this.storageKey(db));
        if (stored != null) {
            try { return JSON.parse(stored); } catch { return null; }
        }

        const legacyKey = db.source ? `${db.source}:${db.id}` : null;
        if (legacyKey && legacyKey !== this.storageKey(db)) {
            const legacy = localStorage.getItem(legacyKey);
            if (legacy != null) {
                localStorage.setItem(this.storageKey(db), legacy);
                localStorage.removeItem(legacyKey);
                try { return JSON.parse(legacy); } catch { return null; }
            }
        }

        return null;
    },

    // ---- Télécharger une base ----
    async download(db) {
        const data = await this.fetchJson(db.url);

        // Ajout dans chaque ligne de l'id du pack et du mode de jeu
        this.decorateEntries(data, db);

        // Sauvegarder la base complète
        localStorage.setItem(this.storageKey(db), JSON.stringify(data));

        // Mettre à jour l'index
        this.updateIndexAfterDownload(db, data);

        return { data, version: data.version };
    },

    // ---- Rafraîchir une base ----
    async refresh(db) {
        const localData = this.loadLocal(db);
        if (!localData) {
            const result = await this.download(db);
            return { updated: true, from: "—", to: result.version };
        }

        let remoteData;
        try {
            remoteData = await this.fetchJson(db.url);
        } catch (err) {
            console.warn(`Mise à jour impossible pour ${db.id} : ${err.message}`);
            return { updated: false, version: localData.version };
        }

        if (remoteData.version !== localData.version) {
            this.decorateEntries(remoteData, db);
            localStorage.setItem(this.storageKey(db), JSON.stringify(remoteData));

            // ➕ Mettre à jour la version dans le catalogue + l'index externe
            if (db.source === "external") {
                const idx = this.catalog.findIndex(e => e.id === db.id && e.source === "external");
                if (idx !== -1) {
                    this.catalog[idx].version = remoteData.version;
                    this.persistExternalIndex();
                }
            }

            return { updated: true, from: localData.version, to: remoteData.version };
        }

        return { updated: false, version: localData.version };
    },


    // ---- Supprimer du localStorage ----
    unload(db) {
        localStorage.removeItem(this.storageKey(db));
    },

    // ---- Supprimer complètement une base externe ----
    forget(db) {
        this.unload(db);
        if (db.source === "external") {
            this.catalog = this.catalog.filter(e => !(e.id === db.id && e.source === "external"));
            this.persistExternalIndex();
        }
    }
};

function showExperimentalPacks() {
    const input = document.getElementById("input_show_experimental_packs")
    game.show_experimental_packs = input.checked
    // Réglage désactivé : un pack expérimental déjà coché dans le Mix est retiré de la sélection
    if (game.show_experimental_packs !== true) {
        const isExperimental = (entry) => DBManager.getById(entry.pack_id, entry.pack_source)?.experimental === true;
        // (le Mix range ses packs de tous les modes dans mix_gamemode_list_picolo)
        game.mix_gamemode_list_picolo = (game.mix_gamemode_list_picolo || []).filter(entry => !isExperimental(entry));
    }
    storeSettingsCookie()
    refreshDBList()
}

// Badge « Expérimental » d'un pack (vide sinon).
function getExperimentalBadgeHTML(db) {
    if (db.experimental !== true) return "";
    return `<span class="badge bg-warning text-dark m-1">${escapeHTML(global.current_language_strings.experimental_badge)}</span>`;
}

function onlyDisplayCurrentLanguageDB() {
    const input = document.getElementById("input_show_only_current_language_db")
    game.only_display_current_language_databases = input.checked
    storeSettingsCookie()
    refreshDBList()
}

async function refreshDBList() {

    const modal_db_list = document.getElementById("modal_db_list");
    await DBManager.init();
    const allDBs = DBManager.getAll();

    modal_db_list.innerHTML = allDBs.map(getDBListItemTemplate).join("");

    // Met à jour les boutons des menus principaux
    updateGamemodeMenuButton(allDBs);

    // Met à jour la liste des bases de données déjà chargé dans l'explorateur
    databaseExplorerRefresh(allDBs);

    // Met à jour la liste des modes de jeu dans Mix
    updateMixGamemodeMenuList(allDBs);
}

function getSourceLabel(source) {
    return global.current_language_strings["db_manager_source_" + source] ?? source;
}

function getDBListItemTemplate(db) {
    const source = escapeHTML(db.source);
    const pack_id = escapeHTML(db.id);
    const local = DBManager.loadLocal(db);
    const localVersion = local?.version || "—";
    const cacheBadge = local ? `<span class="badge border text-dark m-1">${global.current_language_strings.db_manager_cached}</span>` : ``;
    const stateBadge = db.available ? `` : `<span class="badge border text-danger m-1">${global.current_language_strings.db_manager_unavailable}</span>`;
    const packDescription = db.pack_description ? `<span class="db-description" title="${escapeHTML(db.pack_description)}">${escapeHTML(db.pack_description)}</span>` : "";
    const actionBtnClass = local ? "btn-secondary" : "btn-success";
    const actionBtnIcon = local ? "bi-arrow-clockwise" : "bi-cloud-arrow-down";
    const actionBtnLabel = local
        ? global.current_language_strings.db_manager_refresh
        : global.current_language_strings.db_manager_load;
    const unloadBtn = local
        ? `<button class="btn btn-secondary" onclick="unloadDBFromManager('${pack_id}', '${source}')"><i class="bi me-2 bi-folder-x"></i> ${global.current_language_strings.db_manager_unload}</button>`
        : "";
    const forgetBtn = db.source === "external"
        ? `<button class="btn btn-dark" onclick="forgetDBFromManager('${pack_id}', '${source}')"><i class="bi me-2 bi-x-circle"></i> ${global.current_language_strings.db_manager_delete}</button>`
        : "";

    return `
        <li id="db-li-${source}-${pack_id}" class="list-group-item db-list-item d-flex flex-column">
            <div class="db-header d-flex flex-column">
                <div class="d-flex flex-column">
                    <strong class="db-title">${escapeHTML(db.pack_name || db.id)}</strong>
                    ${packDescription}
                    <div class="d-flex flex-wrap mt-1">
                        <span class="badge border m-1 ${db.source === "vanilla" ? "text-dark" : "text-info"}">${getSourceLabel(db.source)}</span>
                        <span class="badge border text-dark m-1">v${escapeHTML(localVersion)}</span>
                        ${cacheBadge}
                        ${getExperimentalBadgeHTML(db)}
                        ${getLanguageBadgeHTML(db)}
                        ${stateBadge}
                    </div>
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-secondary" ${db.available ? "" : "disabled"} onclick="downloadDBFromManager('${pack_id}', '${source}')">
                    <i class="bi me-2 bi-download"></i> ${global.current_language_strings.db_manager_download_file}
                </button>
                <button class="btn ${actionBtnClass} btn-action" ${db.available ? "" : "disabled"} onclick="refreshLoadDBFromManager('${pack_id}', '${source}')">
                    <i class="bi me-2 ${actionBtnIcon}"></i> ${actionBtnLabel}
                </button>
                ${unloadBtn}
                ${forgetBtn}
            </div>
        </li>`;
}

function unloadDBFromManager(pack_id, pack_source) {
    const db = DBManager.getById(pack_id, pack_source);
    if (!db) return;
    DBManager.unload(db);
    refreshDBList();
}

function forgetDBFromManager(pack_id, pack_source) {
    const db = DBManager.getById(pack_id, pack_source);
    if (!db) return;
    showConfirmModal(
        `${global.current_language_strings.delete_definitive} ${db.id} ?`,
        () => { DBManager.forget(db); refreshDBList(); },
        global.current_language_strings.db_manager_delete
    );
}

function databaseExplorerRefresh(allDBs) {
    // Affiche dans le select les bases de données chargées en mémoire (localStorage) pour l'explorateur de base de données.
    const select = document.getElementById("db_explorer_list_select");

    // Filtrer les bases de données pour n'afficher que celles qui sont chargées en mémoire
    const loadedDBs = allDBs.filter(db => DBManager.loadLocal(db));

    const defaultOption = createOption({ id: "", pack_name: global.current_language_strings.db_manager_select_db, gamemode: "" }, true);

    const gamemodeLabels = {
        picolo: global.current_language_strings.picolo,
        je_n_ai_jamais: global.current_language_strings.je_n_ai_jamais,
        maillon_faible: global.current_language_strings.nav_menu_link_weakest_link,
        question_pour_un_champion: global.current_language_strings.nav_menu_link_question_pour_un_champion
    };

    const groups = new Map();
    for (const db of loadedDBs) {
        const gamemode = db.gamemode || "others";
        if (!groups.has(gamemode)) groups.set(gamemode, []);
        groups.get(gamemode).push({
            id: db.id,
            pack_name: db.pack_name,
            gamemode: db.gamemode
        });
    }

    const optgroups = [...groups.entries()].map(([gamemode, dbs]) => `
        <optgroup label="${escapeHTML(gamemodeLabels[gamemode] || gamemode)}">
            ${dbs.map(db => createOption(db)).join("")}
        </optgroup>`).join("");

    select.innerHTML = defaultOption + optgroups;

    function createOption(db, is_default = false) {
        const label = escapeHTML(db.pack_name);
        const value = is_default ? "" : `${escapeHTML(db.id)}:${escapeHTML(db.gamemode)}`;
        return `<option value="${value}">${label}</option>`;
    }
}

function refreshExplorerList(db) {
    // Affichage des phrase de la base de données sélectionnée dans l'explorateur de base de données (pack_source:pack_id)
    const db_explorer_list_list = document.getElementById("db_explorer_list_list");

    const [db_id, gamemode] = db.split(":");

    const db_data = getDBFromLocalStorage(db_id);
    if (!db_data) {
        db_explorer_list_list.innerHTML = `<li class="list-group-item db-list-item">Erreur lors du chargement de la base de données.</li>`;
        return;
    }

    const columns = getExplorerColumns(gamemode, db_data);

    const table = `
        <table class="table table-striped">
            <thead><tr>${columns.map(column => `<th>${escapeHTML(column.label)}</th>`).join("")}</tr></thead>
            <tbody>${db_data.map(entry => `<tr>${columns.map(column => `<td>${escapeHTML(entry[column.key])}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>`;

    db_explorer_list_list.innerHTML = table;
}

function getExplorerColumns(gamemode, db_data) {
    const L = global.current_language_strings;
    const columnsByGamemode = {
        picolo: [["type", L.db_manager_col_type], ["text", L.db_manager_col_text], ["key", L.db_manager_col_key], ["parent_key", L.db_manager_col_parent_key]],
        je_n_ai_jamais: [["text", L.db_manager_col_text]],
        maillon_faible: [["question", L.db_manager_col_question], ["reponse", L.db_manager_col_answer], ["difficulty", L.db_manager_col_difficulty]],
        question_pour_un_champion: [["series", L.db_manager_col_series], ["type", L.db_manager_col_type], ["theme", L.db_manager_col_theme], ["question", L.db_manager_col_question], ["reponse", L.db_manager_col_answer]]
    };

    const columns = columnsByGamemode[gamemode];
    if (columns) return columns.map(([key, label]) => ({ key, label }));

    const sample = db_data[0] || {};
    return Object.keys(sample).map(key => ({ key, label: key }));
}

function getDBFromLocalStorage(db_id) {
    const allDBs = DBManager.getAll();
    for (const db of allDBs) {
        if (db.id == db_id) {
            return DBManager.loadLocal(db).db;
        }
    }
    return null;
}

function updateGamemodeMenuButton(allDBs) {
    // allDBs provient de refreshDBList()
    // NB : le mode QPUC n'affiche plus ses BDD ici (boutons de types à la place).
    // Les BDD QPUC sont désormais listées et activables dans la page "question_pour_un_champion".

    const je_n_ai_jamais_list = document.getElementById("gamemode_je_n_ai_jamais_db_list");
    const picolo_list = document.getElementById("gamemode_picolo_db_list");

    je_n_ai_jamais_list.innerHTML = allDBs
        .filter(db => db.gamemode === "je_n_ai_jamais")
        .map(getGamemodePackCardTemplate)
        .join("");
    picolo_list.innerHTML = allDBs
        .filter(db => db.gamemode === "picolo" || db.gamemode === "war")
        .map(getGamemodePackCardTemplate)
        .join("");
}

function getGamemodePackCardTemplate(db) {
    const pack_id = escapeHTML(db.id);
    const pack_source = escapeHTML(db.source);
    const gamemode_type = escapeHTML(db.gamemode);
    const pack_name = escapeHTML(db.pack_name);
    const pack_description = db.pack_description ? `<p>${escapeHTML(db.pack_description)}</p>` : ``;

    let additionalData = "";
    if (db.source != "vanilla" || game.only_display_current_language_databases == false) {
        additionalData = `<div class="d-flex justify-content-end">
                ${getLanguageBadgeHTML(db)}
                <span class="badge bg-dark m-1">${getSourceLabel(db.source)}</span>
                <span class="badge bg-dark m-1">${gamemode_type}</span>
            </div>`;
    }

    return `
        <div class="col-12 col-sm-6 col-xl-4 col-xxl-3 mb-4">
            <button class="btn btn-primary gamemode_${gamemode_type}_section w-100 h-100" onclick="startGamemodeFromCard('${pack_id}', '${pack_source}', '${gamemode_type}')">
                <div class="d-flex justify-content-between flex-column">
                    <h4 class="fw-bold h4 text-center w-100">${pack_name}</h4>
                    ${db.experimental === true ? `<div class="d-flex justify-content-center">${getExperimentalBadgeHTML(db)}</div>` : ``}
                    ${pack_description}
                    ${additionalData}
                </div>
            </button>
        </div>`;
}

function startGamemodeFromCard(pack_id, pack_source, gamemode_type) {
    selectGame({
        gamemode_type: gamemode_type,
        packs: [{ pack_id: pack_id, pack_source: pack_source }]
    });
}

function updateMixGamemodeMenuList(allDBs) {
    // allDBs provient de refreshDBList()

    const gamemode_to_list = [
        ["picolo", "gamemode_mix_picolo_db_list"],
        ["war", "gamemode_mix_picolo_db_list"],
        ["je_n_ai_jamais", "gamemode_mix_je_n_ai_jamais_db_list"],
        ["question_pour_un_champion", "gamemode_mix_question_pour_un_champion_db_list"]
    ];

    for (const [list_id, template_id] of gamemode_to_list) {
        document.getElementById(template_id).innerHTML = "";
    }

    for (const db of allDBs) {
        const html = getMixGamemodeSwitchTemplate(db);
        for (const [list_id, template_id] of gamemode_to_list) {
            if (db.gamemode == list_id) {
                document.getElementById(template_id).insertAdjacentHTML("beforeend", html);
            }
        }
    }
    return;
}

function getMixGamemodeSwitchTemplate(db) {
    const pack_id = escapeHTML(db.id);
    const pack_source = escapeHTML(db.source);
    const gamemode_type = escapeHTML(db.gamemode);
    const pack_name = escapeHTML(db.pack_name);

    let additionalData = "";
    if (pack_source != "vanilla" || game.only_display_current_language_databases == false) {
        additionalData = `<div class="d-flex justify-content-end">
                ${getLanguageBadgeHTML(db)}
                <span class="badge bg-dark m-1" title="${escapeHTML(db.url)}">${getSourceLabel(db.source)}</span>
            </div>`;
    }

    return `
        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="${pack_id}-checkbox"
                   onclick="updateSelectedMixGamemode({checked: this.checked, gamemode_type: '${gamemode_type}', pack_id: '${pack_id}', pack_source: '${pack_source}'})">
            <div class="d-flex w-100 justify-content-between">
                <label class="form-check-label" for="${pack_id}-checkbox">${pack_name}</label>
                <div class="d-flex justify-content-end gap-1">
                    ${getExperimentalBadgeHTML(db)}
                    ${additionalData}
                </div>
            </div>
        </div>`;
}
