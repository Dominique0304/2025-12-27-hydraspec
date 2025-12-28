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
    const project = projectManager.getActiveProject();

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
    const project = projectManager.getActiveProject();

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
    const project = projectManager.getActiveProject();

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

        // Canaux calculés/lissés (paramètres seulement, pas les données)
        calculatedChannels: project.toolsState.calculatedChannels || [],
        smoothedChannels: project.toolsState.smoothedChannels || [],

        // Notes utilisateur
        notes: document.getElementById('user-notes') ?
            document.getElementById('user-notes').value : ""
    };

    console.log("💾 Données HSP préparées:", {
        channels: hspData.state.allColumnData.length,
        annotations: hspData.annotations.length,
        intervals: hspData.intervals.length,
        dataPoints: hspData.state.fullDataTime.length
    });

    // Créer le blob et télécharger
    const blob = new Blob([JSON.stringify(hspData, null, 2)], { type: "application/json" });
    await downloadBlob(blob, `${fileName}.hsp`);

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
// CHARGEMENT .HSP
// ========================================

/**
 * Charge un fichier .HSP
 */
async function loadHSP(file) {
    console.log("📂 Chargement HSP:", file.name);

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
                projectManager.switchProject(project.id);

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

    // Restaurer notes
    if (hspData.notes && document.getElementById('user-notes')) {
        document.getElementById('user-notes').value = hspData.notes;
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
    const project = projectManager.getActiveProject();
    return project && project.isModified;
}

/**
 * Demande à l'utilisateur s'il veut sauvegarder avant de fermer
 * @returns {Promise<boolean>} true si on peut continuer, false si annulé
 */
async function promptSaveBeforeClose() {
    const project = projectManager.getActiveProject();

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
    const project = projectManager.getActiveProject();

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
window.hasUnsavedChanges = hasUnsavedChanges;
window.promptSaveBeforeClose = promptSaveBeforeClose;
window.updateFileMenuButtons = updateFileMenuButtons;

console.log("✅ HSP Manager chargé");
