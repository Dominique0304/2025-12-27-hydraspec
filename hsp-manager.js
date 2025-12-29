/**
 * HSP-MANAGER.JS
 * Système complet de gestion des fichiers .HSP (HydraSpec Pro)
 *
 * Format .HSP :
 * - Sauvegarde COMPLÈTE de l'état d'un projet
 * - Tous les canaux avec configurations
 * - Annotations avec positions
 * - Intervalles avec positions
 * - Curseurs, zoom, paramètres FFT
 * - Canaux calculés/lissés (paramètres uniquement)
 */

// ========================================
// EXPORT VERS .HSP (CSV → HSP)
// ========================================

/**
 * Exporte le projet actif vers un fichier .HSP
 * Uniquement disponible si le projet est de type CSV
 */
function exportToHSP() {
    const projectManager = window.projectManager;
    if (!projectManager) {
        alert("Système de projets non initialisé");
        return;
    }

    const project = projectManager.getActive();

    if (!project) {
        alert("Aucun projet actif");
        return;
    }

    if (project.fileType === 'hsp') {
        alert("Ce fichier est déjà au format .HSP. Utilisez 'Enregistrer' ou 'Enregistrer sous'.");
        return;
    }

    // Générer un nom par défaut basé sur le nom du CSV
    let defaultName = project.fileName ? project.fileName.replace(/\.csv$/i, '') : project.name;
    const fileName = prompt("Nom du fichier .HSP:", defaultName);

    if (!fileName) return; // Annulé

    // Sauvegarder
    performHSPSave(project, fileName, true); // true = export (nouveau fichier)
}

// ========================================
// SAUVEGARDE .HSP
// ========================================

/**
 * Enregistre le projet HSP actuel (sans dialogue)
 * Uniquement disponible si projet de type HSP et déjà sauvegardé
 */
function saveHSP() {
    const projectManager = window.projectManager;
    if (!projectManager) {
        alert("Système de projets non initialisé");
        return;
    }

    const project = projectManager.getActive();

    if (!project) {
        alert("Aucun projet actif");
        return;
    }

    if (project.fileType !== 'hsp') {
        alert("Ce projet n'est pas un fichier .HSP. Utilisez 'Exporter vers .HSP'.");
        return;
    }

    if (!project.fileName) {
        // Fichier jamais sauvegardé, utiliser "Enregistrer sous"
        saveHSPAs();
        return;
    }

    // Sauvegarder avec le nom existant
    performHSPSave(project, project.fileName.replace(/\.hsp$/i, ''), false);
}

/**
 * Enregistre le projet HSP avec un nouveau nom (dialogue)
 */
function saveHSPAs() {
    const projectManager = window.projectManager;
    if (!projectManager) {
        alert("Système de projets non initialisé");
        return;
    }

    const project = projectManager.getActive();

    if (!project) {
        alert("Aucun projet actif");
        return;
    }

    if (project.fileType !== 'hsp') {
        alert("Ce projet n'est pas un fichier .HSP. Utilisez 'Exporter vers .HSP'.");
        return;
    }

    // Demander le nom
    const defaultName = project.fileName ? project.fileName.replace(/\.hsp$/i, '') : project.name;
    const fileName = prompt("Nom du fichier .HSP:", defaultName);

    if (!fileName) return; // Annulé

    // Sauvegarder
    performHSPSave(project, fileName, true); // true = nouveau nom
}

// ========================================
// SAUVEGARDE DIRECTE (File System Access API)
// ========================================

/**
 * Sauvegarde directement dans un fileHandle existant (sans boîte de dialogue)
 * Compatible Chrome/Edge uniquement
 * @param {Blob} blob - Données à écrire
 * @param {FileSystemFileHandle} fileHandle - Handle du fichier
 * @param {string} fileName - Nom du fichier (pour les logs)
 * @returns {Promise<boolean>} true si succès, false si échec
 */
async function saveDirectToHandle(blob, fileHandle, fileName) {
    try {
        console.log(`💾 Sauvegarde directe (sans dialogue): ${fileName}`);

        // Vérifier les permissions
        const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
            // Demander la permission si nécessaire
            const newPermission = await fileHandle.requestPermission({ mode: 'readwrite' });
            if (newPermission !== 'granted') {
                console.warn('⚠️ Permission refusée pour écrire dans le fichier');
                return false;
            }
        }

        // Écrire le fichier
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        console.log(`✅ Fichier sauvegardé directement: ${fileName}`);
        setStatus(`✅ Sauvegarde directe: ${fileName}`);
        return true;

    } catch (error) {
        console.error(`❌ Erreur sauvegarde directe:`, error);
        return false;
    }
}

// ========================================
// SAUVEGARDE EFFECTIVE
// ========================================

/**
 * Effectue la sauvegarde du projet en .HSP
 * @param {Project} project - Projet à sauvegarder
 * @param {string} fileName - Nom du fichier (sans extension)
 * @param {boolean} isNewFile - true si export ou "Enregistrer sous"
 */
async function performHSPSave(project, fileName, isNewFile) {
    console.log("💾 Sauvegarde HSP:", fileName);

    // CRITIQUE: Sauvegarder l'état actuel AVANT l'export
    if (typeof saveAllToolsState === 'function') {
        saveAllToolsState(project);
        console.log("✅ État des outils sauvegardé avant export HSP");
    }

    // Préparer les données à sauvegarder
    const hspData = {
        version: "2.0.0",
        date: new Date().toISOString(),

        // Informations de base
        projectName: project.name,
        fileType: "hsp",

        // État du projet
        state: {
            // Données brutes
            fs: project.state.fs,
            fullDataTime: Array.from(project.state.fullDataTime),
            fullDataPressure: Array.from(project.state.fullDataPressure),

            // Multi-canaux : TOUTES les données
            allColumnData: project.state.allColumnData ?
                project.state.allColumnData.map(col => Array.from(col)) : [],
            availableColumns: project.state.availableColumns || [],
            columnNames: project.state.columnNames || [],
            channelConfig: project.state.channelConfig || [],
            currentColumnIndex: project.state.currentColumnIndex || 0,
            xAxisChannel: project.state.xAxisChannel || 0,
            yAxisLabel: project.state.yAxisLabel || "",

            // Curseurs
            cursorStart: project.state.cursorStart,
            cursorEnd: project.state.cursorEnd,

            // Paramètres
            timeIncrement: project.state.timeIncrement,
            chartFontSize: project.state.chartFontSize,

            // Zoom X/Y (à récupérer depuis les graphiques)
            zoomState: getChartZoomState(project),

            // Paramètres FFT (à implémenter selon votre système FFT)
            fftParams: {
                // windowType, overlap, etc.
            }
        },

        // Annotations
        annotations: project.toolsState.annotations || [],

        // Intervalles
        intervals: project.toolsState.intervals || [],

        // Diff/Canal (intervalles de différence entre canaux)
        diffCanal: project.toolsState.diffCanal || { intervals: [], nextId: 1 },

        // Marqueurs (SnapPoints)
        snapPoints: project.toolsState.snapPoints || [],

        // Canaux calculés/lissés (paramètres seulement, pas les données)
        calculatedChannels: project.toolsState.calculatedChannels || [],
        smoothedChannels: project.toolsState.smoothedChannels || [],

        // Notes utilisateur (depuis project.toolsState pour cohérence multi-projets)
        notes: project.toolsState.notes || ""
    };

    console.log("💾 Données HSP préparées:", {
        channels: hspData.state.allColumnData.length,
        annotations: hspData.annotations.length,
        intervals: hspData.intervals.length,
        diffCanal: hspData.diffCanal.intervals.length,
        toolsState_annotations: project.toolsState.annotations?.length || 0,
        toolsState_intervals: project.toolsState.intervals?.length || 0,
        toolsState_diffCanal: project.toolsState.diffCanal?.intervals?.length || 0,
        dataPoints: hspData.state.fullDataTime.length
    });

    // Créer le blob
    const blob = new Blob([JSON.stringify(hspData, null, 2)], { type: "application/json" });

    // STRATÉGIE DE SAUVEGARDE :
    // 1. Si on a un fileHandle ET qu'on ne demande pas un nouveau fichier → Sauvegarde directe (pas de dialogue)
    // 2. Sinon → Utiliser downloadBlob (avec dialogue)
    let savedSuccessfully = false;

    if (!isNewFile && project.fileHandle && 'createWritable' in FileSystemFileHandle.prototype) {
        // Tentative de sauvegarde directe (sans dialogue)
        console.log("🎯 Tentative de sauvegarde directe avec fileHandle existant");
        savedSuccessfully = await saveDirectToHandle(blob, project.fileHandle, `${fileName}.hsp`);
    }

    // Fallback : Si sauvegarde directe a échoué OU si nouveau fichier, utiliser downloadBlob
    if (!savedSuccessfully) {
        if (!isNewFile && project.fileHandle) {
            console.warn("⚠️ Sauvegarde directe échouée, utilisation du fallback downloadBlob");
        }
        const handle = await downloadBlob(blob, `${fileName}.hsp`);

        // Si downloadBlob retourne un handle (File System Access API), le stocker
        if (handle && !isNewFile) {
            project.fileHandle = handle;
            console.log("✅ FileHandle stocké pour prochaine sauvegarde directe");
        }
    }

    // Mettre à jour les informations du projet
    if (isNewFile) {
        project.setFileInfo('hsp', `${fileName}.hsp`);
        project.name = fileName; // Mettre à jour le nom du projet
    }
    project.markSaved();

    // Mettre à jour l'interface
    updateProjectTabs();

    setStatus(`✅ Fichier ${fileName}.hsp sauvegardé`);
}

/**
 * Récupère l'état de zoom des graphiques
 */
function getChartZoomState(project) {
    const chart = project.state.charts?.time;
    if (!chart) return null;

    return {
        xMin: chart.options.scales.x.min,
        xMax: chart.options.scales.x.max,
        // Y scales (multi-axes)
        yScales: Object.keys(chart.scales)
            .filter(key => key.startsWith('y'))
            .map(key => ({
                id: key,
                min: chart.options.scales[key].min,
                max: chart.options.scales[key].max
            }))
    };
}

// ========================================
// OUVERTURE FICHIER (File System Access API)
// ========================================

/**
 * Ouvre un fichier .HSP avec File System Access API (Chrome/Edge)
 * Stocke le fileHandle pour permettre la sauvegarde directe
 */
async function openHSPWithPicker() {
    // Vérifier le support de l'API
    if (!('showOpenFilePicker' in window)) {
        console.warn('⚠️ showOpenFilePicker non supporté, fallback vers input file');
        // Fallback : cliquer sur l'input file classique
        document.getElementById('projectInput').click();
        return;
    }

    try {
        // Ouvrir la boîte de dialogue
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'Fichiers HydraSpec Pro',
                accept: { 'application/json': ['.hsp'] }
            }],
            multiple: false
        });

        // Lire le fichier
        const file = await fileHandle.getFile();

        // Charger le projet
        const project = await loadHSPFromFile(file);

        // IMPORTANT : Stocker le fileHandle pour la sauvegarde directe
        if (project) {
            project.fileHandle = fileHandle;
            console.log(`✅ FileHandle stocké pour ${file.name} - Sauvegarde directe activée`);
        }

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('❌ Erreur lors de l\'ouverture:', err);
            alert('Erreur lors de l\'ouverture du fichier');
        }
    }
}

// ========================================
// CHARGEMENT .HSP
// ========================================

/**
 * Charge un fichier .HSP depuis un <input type="file"> (fallback)
 * @param {File} file - Fichier sélectionné via input
 */
async function loadHSP(file) {
    return loadHSPFromFile(file);
}

/**
 * Fonction interne pour charger un fichier HSP
 * @param {File} file - Fichier à charger
 * @returns {Promise<Project>} Projet créé
 */
async function loadHSPFromFile(file) {
    console.log("📂 Chargement HSP:", file.name);

    const projectManager = window.projectManager;
    if (!projectManager) {
        alert("Système de projets non initialisé");
        return Promise.reject("ProjectManager non disponible");
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function(e) {
            try {
                const hspData = JSON.parse(e.target.result);

                console.log("📊 HSP chargé - Version:", hspData.version);

                // Créer un nouveau projet
                const projectName = hspData.projectName || file.name.replace(/\.hsp$/i, '');
                const project = projectManager.createProject(projectName);

                // Définir les informations de fichier
                project.setFileInfo('hsp', file.name);

                // Restaurer l'état COMPLET
                await restoreProjectFromHSP(project, hspData);

                // Activer le projet
                projectManager.switchTo(project.id);

                // Mettre à jour l'interface
                updateAllInterface();

                // Appliquer auto-config comme pour un CSV
                setTimeout(() => {
                    applyAutoConfig();
                }, 300);

                setStatus(`✅ Fichier ${file.name} chargé`);
                resolve(project);

            } catch (error) {
                console.error("❌ Erreur chargement HSP:", error);
                alert("Erreur lors du chargement du fichier .HSP");
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error("Erreur de lecture du fichier"));
        };

        reader.readAsText(file);
    });
}

/**
 * Restaure l'état complet d'un projet depuis les données HSP
 */
async function restoreProjectFromHSP(project, hspData) {
    console.log("🔄 Restauration du projet depuis HSP...");

    // Restaurer les données brutes
    project.state.fs = hspData.state.fs;
    project.state.fullDataTime = new Float32Array(hspData.state.fullDataTime);
    project.state.fullDataPressure = new Float32Array(hspData.state.fullDataPressure);

    // Restaurer MULTI-CANAUX
    if (hspData.state.allColumnData && hspData.state.allColumnData.length > 0) {
        project.state.allColumnData = hspData.state.allColumnData.map(col => new Float32Array(col));
        project.state.availableColumns = hspData.state.availableColumns || [];
        project.state.columnNames = hspData.state.columnNames || [];
        project.state.channelConfig = hspData.state.channelConfig || [];
        project.state.currentColumnIndex = hspData.state.currentColumnIndex || 0;
        project.state.xAxisChannel = hspData.state.xAxisChannel || 0;
        project.state.yAxisLabel = hspData.state.yAxisLabel || "";

        console.log("✅ Multi-canaux restauré:", project.state.allColumnData.length, "canaux");
    }

    // Restaurer curseurs
    project.state.cursorStart = hspData.state.cursorStart;
    project.state.cursorEnd = hspData.state.cursorEnd;

    // Restaurer paramètres
    project.state.timeIncrement = hspData.state.timeIncrement || 1.0;
    project.state.chartFontSize = hspData.state.chartFontSize || 12;

    // Restaurer annotations
    if (hspData.annotations) {
        project.toolsState.annotations = hspData.annotations;
        console.log("✅ Annotations restaurées:", hspData.annotations.length);
    }

    // Restaurer intervalles
    if (hspData.intervals) {
        project.toolsState.intervals = hspData.intervals;
        console.log("✅ Intervalles restaurés:", hspData.intervals.length);
    }

    // Restaurer notes dans toolsState (seront synchronisées au DOM par restoreAllToolsState)
    if (hspData.notes) {
        project.toolsState.notes = hspData.notes;
        console.log(`✅ Notes restaurées (${hspData.notes.length} caractères)`);
    }

    // Restaurer Diff/Canal
    if (hspData.diffCanal) {
        project.toolsState.diffCanal = hspData.diffCanal;
        console.log(`✅ Diff/Canal restaurés (${hspData.diffCanal.intervals?.length || 0} intervalles)`);
    }

    // Restaurer Marqueurs (SnapPoints)
    if (hspData.snapPoints) {
        project.toolsState.snapPoints = hspData.snapPoints;
        console.log(`✅ Marqueurs restaurés (${hspData.snapPoints.length} marqueurs)`);
    }

    // Restaurer zoom (sera appliqué après création des graphiques)
    if (hspData.state.zoomState) {
        project.state.savedZoomState = hspData.state.zoomState;
    }

    console.log("✅ Projet restauré depuis HSP");
}

/**
 * Applique la configuration automatique (zoom, auto-groupé, etc.)
 */
function applyAutoConfig() {
    if (typeof openChannelConfig === 'function' && typeof closeChannelConfig === 'function') {
        console.log("🔧 Auto-config HSP...");
        openChannelConfig(true); // Mode silencieux

        setTimeout(() => {
            if (typeof autoPresetYScales === 'function') {
                autoPresetYScales();
            }

            // Réinitialiser zoom X
            const chart = appState.charts.time;
            if (chart && appState.fullDataTime.length) {
                const t = appState.fullDataTime;
                const zoomMinInput = document.getElementById('zoom-min');
                const zoomMaxInput = document.getElementById('zoom-max');
                if (zoomMinInput && zoomMaxInput) {
                    zoomMinInput.value = (t[0] / 1000).toFixed(3);
                    zoomMaxInput.value = (t[t.length - 1] / 1000).toFixed(3);
                }
                chart.options.scales.x.min = t[0];
                chart.options.scales.x.max = t[t.length - 1];
                chart.update('none');
            }

            // Centrer curseurs
            setTimeout(() => {
                if (typeof centerCursors === 'function') {
                    centerCursors();
                }

                setTimeout(() => {
                    closeChannelConfig(true);
                    console.log("✅ Auto-config HSP terminée");
                }, 100);
            }, 100);
        }, 200);
    }
}

// ========================================
// GESTION DES MODIFICATIONS
// ========================================

/**
 * Vérifie si le projet actif a des modifications non sauvegardées
 * @returns {boolean}
 */
function hasUnsavedChanges() {
    const projectManager = window.projectManager;
    if (!projectManager) return false;

    const project = projectManager.getActive();
    return project && project.isModified;
}

/**
 * Demande à l'utilisateur s'il veut sauvegarder avant de fermer
 * @returns {Promise<boolean>} true si on peut continuer, false si annulé
 */
async function promptSaveBeforeClose() {
    const projectManager = window.projectManager;
    if (!projectManager) return true;

    const project = projectManager.getActive();

    if (!project || !project.isModified) {
        return true; // Pas de modifications, on peut continuer
    }

    const response = confirm(
        `Le fichier "${project.fileName || project.name}" a été modifié.\n\n` +
        `Voulez-vous enregistrer les modifications ?`
    );

    if (response) {
        // L'utilisateur veut sauvegarder
        if (project.fileType === 'hsp') {
            await saveHSP();
            return true;
        } else {
            // Fichier CSV, demander export
            const exportResponse = confirm(
                "Ce fichier est au format CSV. Voulez-vous l'exporter en .HSP ?"
            );
            if (exportResponse) {
                await exportToHSP();
            }
            return true;
        }
    }

    // L'utilisateur ne veut pas sauvegarder
    return true;
}

// ========================================
// MISE À JOUR DE L'INTERFACE
// ========================================

/**
 * Met à jour l'état des boutons du menu Fichier
 * Appelé à chaque changement de projet actif
 */
function updateFileMenuButtons() {
    // Accéder au projectManager global
    const projectManager = window.projectManager;
    if (!projectManager) {
        console.warn("⚠️ ProjectManager non disponible");
        return;
    }

    const project = projectManager.getActive();

    const btnSaveHSP = document.getElementById('btn-save-hsp');
    const btnSaveHSPAs = document.getElementById('btn-save-hsp-as');
    const btnExportToHSP = document.getElementById('btn-export-to-hsp');

    if (!project) {
        // Aucun projet : tout désactivé
        if (btnSaveHSP) btnSaveHSP.disabled = true;
        if (btnSaveHSPAs) btnSaveHSPAs.disabled = true;
        if (btnExportToHSP) btnExportToHSP.disabled = true;
        return;
    }

    if (project.fileType === 'hsp') {
        // Projet HSP : activer Save/SaveAs, désactiver Export
        if (btnSaveHSP) btnSaveHSP.disabled = false;
        if (btnSaveHSPAs) btnSaveHSPAs.disabled = false;
        if (btnExportToHSP) btnExportToHSP.disabled = true;
    } else if (project.fileType === 'csv') {
        // Projet CSV : désactiver Save/SaveAs, activer Export
        if (btnSaveHSP) btnSaveHSP.disabled = true;
        if (btnSaveHSPAs) btnSaveHSPAs.disabled = true;
        if (btnExportToHSP) btnExportToHSP.disabled = false;
    } else {
        // Type inconnu : tout désactiver
        if (btnSaveHSP) btnSaveHSP.disabled = true;
        if (btnSaveHSPAs) btnSaveHSPAs.disabled = true;
        if (btnExportToHSP) btnExportToHSP.disabled = true;
    }

    console.log(`🎛️ Boutons menu mis à jour - Type: ${project.fileType}`);
}

// Exporter les fonctions globalement
window.exportToHSP = exportToHSP;
window.saveHSP = saveHSP;
window.saveHSPAs = saveHSPAs;
window.loadHSP = loadHSP;
window.openHSPWithPicker = openHSPWithPicker;
window.hasUnsavedChanges = hasUnsavedChanges;
window.promptSaveBeforeClose = promptSaveBeforeClose;
window.updateFileMenuButtons = updateFileMenuButtons;

console.log("✅ HSP Manager chargé");
