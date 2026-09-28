// Import / export de bases de données externes (URL, fichier) et téléchargements.
// Dépend de dbmanager.js (DBManager) et de main.js (showToast).

function externalDBLinkFromtTextInput() {
    const input = document.getElementById('external_db_input');
    const value = input.value.trim();

    input.value = ''; // vide le champ input
    input.focus();

    if (value.toLowerCase() == "miiiranda") {
        DEBUG_miiiranda_db_bundle();
        return;
    }

    if (value !== '' && value.match(/\.json(\?.*)?$/i)) {
        if (global.debug==true) console.log('Valeur entrée :', value);
        addDBData( { url: value, vanilla: false} ); // game.gamemode_type = "mix";
    
    }
}

function DEBUG_miiiranda_db_bundle() {
    async function loadUrlList() {
    const response = await fetch("https://gist.githubusercontent.com/difabiolorenzo/accab6224cbaf58a274f9497eeaed79e/raw/0fb82a051c13bfff5ebf658302ee4fa7e67a1657/gistfile1.txt");
    const text = await response.text();

    // Nettoyage + transformation en tableau
    const url_list = text
        .split(",")                // sépare par virgule
        .map(url => url.trim())   // enlève espaces + retours ligne
        .map(url => url.replace(/["']/g, "")) // enlève les guillemets
        .filter(url => url.length > 0); // enlève les lignes vides

        return url_list;
    }

    // utilisation
    loadUrlList().then(url_list => {
        addDBData( { urls: url_list} );
        global.modal_external_db.show()
    });
}

async function addDBData({ url = null, urls = null, file = null, vanilla = false }) {
    try {

        // Si on reçoit un tableau d'URLs
        if (urls && Array.isArray(urls)) {
            for (const singleUrl of urls) {
                await addDBData({ url: singleUrl, vanilla }); // appel récursif
            }
            return; // important pour ne pas continuer plus bas
        }

        let data;

        if (url) {
            // Chargement depuis URL
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP erreur ${response.status} (${url})`);
            data = await response.json();
            data.url = url;
        } else if (file) {
            // Chargement depuis fichier local
            const fileText = await file.text();
            data = JSON.parse(fileText);
            data.url = null;
        } else {
            throw new Error("Aucune source fournie (url, urls ou file).");
        }

        data.vanilla = vanilla;

        // Nettoyage XSS : échappement du texte des BDD externes (text + question + reponse,
        // car QPUC et Maillon Faible injectent question/reponse en innerHTML — cf. audit 5d)
        if (!vanilla && Array.isArray(data.db)) {
            data.db.forEach(entry => {
                if (!entry) return;
                ["text", "question", "reponse"].forEach(field => {
                    if (typeof entry[field] === "string") {
                        entry[field] = sanitizeExternalText(entry[field]);
                    }
                });
            });
        }

        const indexData = {
            id: data.id,
            pack_name: data.pack_name,
            pack_description: data.pack_description,
            gamemode: data.gamemode,
            language: data.language,
            version: data.version,
            url: data.url,
            source: "external"
        };

        const existingIndex = DBManager.catalog.findIndex(db => db.id === data.id && db.source === "external");

        if (existingIndex !== -1) {
            const existingDB = DBManager.catalog[existingIndex];
            if (data.version > existingDB.version) {
                DBManager.catalog[existingIndex] = indexData;
                if (global.debug==true) console.log(`Index mis à jour : ${data.id} (v${existingDB.version} → v${data.version})`);
            } else {
                if (global.debug==true) console.log(`Index ignoré : ${data.id} (v${data.version} <= v${existingDB.version})`);
            }
        } else {
            DBManager.catalog.push(indexData);
            if (global.debug==true) console.log(`Nouvel index ajouté : ${data.id} (v${data.version})`);
        }

        // Persist index externe + cache unifié (db:<id>)
        DBManager.persistExternalIndex();
        localStorage.setItem(`db:${data.id}`, JSON.stringify(data));

        refreshDBList();

        if (file) {
            setExternalDBFileStatus("success", global.current_language_strings.external_db_import_success + data.id);
        }

    } catch (err) {
        console.error("Erreur lors du chargement de la base :", err);
        if (file) {
            setExternalDBFileStatus("error", global.current_language_strings.external_db_import_error + err.message);
        } else {
            showToast(`Erreur : ${err.message}`);
        }
    }
}

function setExternalDBFileStatus(type, message) {
    const el = document.getElementById("external_db_file_status");
    if (!el) return;
    el.textContent = message;
    el.className = type === "success" ? "text-success mt-1" : "text-danger mt-1";
}

function downloadCustomDBPicoloTamplate() {
    const template = {
        version: 1,
        gamemode: "picolo",
        id: "",
        language: "",
        pack_name: "",
        pack_description: "",
        db: [
            { text: "" }
        ]
    };
    downloadFileJSON(template, "template_picolo_bdd")
}

function downloadCustomDBNeverDoneTamplate() {
    const template = {
        version: 1,
        gamemode: "je_n_ai_jamais",
        id: "",
        language: "",
        pack_name: "",
        pack_description: "",
        db: [
            { text: "" }
        ]
    };

    downloadFileJSON(template, "template_je_n_ai_jamais_bdd")
}

function downloadFileJSON(object, filename) {
    const jsonStr = JSON.stringify(object, null, 4); // bien formatté
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Crée un lien temporaire pour déclencher le téléchargement
    const a = document.createElement("a");
    a.href = url;
    a.download = filename+".json";
    a.click();

    URL.revokeObjectURL(url); // Libère l'URL après téléchargement
}

async function downloadDBFromManager(pack_id, pack_source) {
    const db = DBManager.getById(pack_id, pack_source);
    if (!db) { return; }
    let data = DBManager.loadLocal(db);
    if (!data) {
        if (!db.url) {
            showToast(`Aucun cache ni URL pour ${db.id}.`);
            return;
        }
        try {
            data = await DBManager.fetchJson(db.url);
        } catch (err) {
            showToast(`Erreur (${db.id}) : ${err.message}`);
            return;
        }
    }
    downloadFileJSON(cleanDBExport(data), data.id || db.id);
}

function cleanDBExport(data) {
    const clean = { ...data };
    clean.db = (Array.isArray(data.db) ? data.db : []).map(entry => {
        const copy = { ...entry };
        delete copy.pack_id;
        delete copy.bdd_id;
        delete copy.gamemode_type;
        return copy;
    });
    return clean;
}
