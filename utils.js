// --- UTILITY FUNCTIONS ---

// --- BOUTON TEST (TEMPORAIRE) ---
function testButtonClick() {
    const version = "V 25/01/2026";
    const lastCommit = "3af81b1 - fix: Sauvegarde SnapPoints/Intervals depuis tableaux globaux";
    const branche = "claude/check-progress-eQYEt";
    const timestamp = new Date().toLocaleString('fr-FR');

    const message = `✅ Code synchronisé !

Version: ${version}
Branche: ${branche}
Dernier commit: ${lastCommit}
Heure: ${timestamp}

Si vous voyez ce message, vous avez bien le dernier code !`;

    alert(message);
    console.log("🧪 Test Button - Code synchronisé :", {
        version,
        branche,
        lastCommit,
        timestamp
    });
}

// --- FILE HANDLING ---
function handleFileUpload(input) {
    console.log("📂 handleFileUpload() appelée");

    // Vérifier si le système POO est actif
    if (typeof projectManager !== 'undefined' && projectManager !== null) {
        console.log("✅ Système POO actif - Utilisation de handleFileUpload_POO()");
        return handleFileUpload_POO(input);
    }

    // ANCIEN CODE (fallback si POO non actif)
    console.log("⚠️ Système POO inactif - Utilisation de l'ancien code");

    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n').filter(l => l.trim());

            if (lines.length < 2) {
                setStatus(t("status.invalid_csv"));
                return;
            }

            // METTRE À JOUR LE TITRE AVEC LE NOM DU FICHIER
            const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
            setAcquisitionTitle(fileNameWithoutExtension);

            // Détection du séparateur
            const firstLine = lines[0];
            let separator = firstLine.includes(';') ? ';' :
                firstLine.includes(',') ? ',' :
                    firstLine.includes('\t') ? '\t' : ';';

            // Vérifier l'en-tête
            const hasHeader = isNaN(parseFloat(firstLine.split(separator)[0]));

            // Extraire les noms de colonnes
            let columnNames = [];
            let startLine = 0;

            if (hasHeader) {
                columnNames = firstLine.split(separator).map(part => part.trim());
                startLine = 1;
                console.log("Colonnes détectées:", columnNames);
            } else {
                const firstData = lines[0].split(separator);
                columnNames = ['Temps'];
                for (let i = 1; i < firstData.length; i++) {
                    columnNames.push(`Colonne ${i}`);
                }
            }

            // Préparer le stockage des données
            const allData = Array.from({ length: columnNames.length }, () => []);
            let validLines = 0;

            // Parser les données
            for (let i = startLine; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const parts = line.split(separator);
                if (parts.length >= columnNames.length) {
                    let isValid = true;

                    for (let j = 0; j < columnNames.length; j++) {
                        const val = parseFloat(parts[j].replace(',', '.'));
                        if (isNaN(val)) {
                            isValid = false;
                            break;
                        }
                        allData[j].push(val);
                    }

                    if (isValid) validLines++;
                }
            }

            if (validLines > 1) {
                // CONFIGURER L'ÉTAT
                appState.columnNames = columnNames;
                appState.allColumnData = allData;
                appState.availableColumns = [];

                // Préparer les colonnes disponibles (sauf temps)
                for (let i = 1; i < columnNames.length; i++) {
                    let label = columnNames[i].replace(/\[.*?\]/g, '').trim();
                    const unitMatch = columnNames[i].match(/\[(.*?)\]/);
                    if (unitMatch && !label.includes('(')) {
                        label += ` (${unitMatch[1]})`;
                    }

                    appState.availableColumns.push({
                        index: i,
                        name: columnNames[i],
                        label: label
                    });
                }

                appState.currentColumnIndex = 0;

                // Configurer les données temps
                const timeData = allData[0];

                // Convertir secondes → millisecondes
                const timeInMs = timeData.map(t => t * 1000);
                appState.fullDataTime = new Float32Array(timeInMs);

                // CALCULER L'INCRÉMENT ET Fs
                if (timeData.length >= 2) {
                    // Calcul de l'incrément moyen (en secondes)
                    let totalDiff = 0;
                    let count = 0;

                    for (let i = 1; i < timeData.length; i++) {
                        const diff = timeData[i] - timeData[i - 1];
                        if (diff > 0) {
                            totalDiff += diff;
                            count++;
                        }
                    }

                    const avgIncrementSec = count > 0 ? totalDiff / count : 0.001;
                    const avgIncrementMs = avgIncrementSec * 1000;

                    // Calculer Fs
                    appState.fs = 1000 / avgIncrementMs;
                    appState.timeIncrement = avgIncrementMs / 1000;

                    // Mettre à jour l'interface
                    document.getElementById('display-fs-config').textContent = appState.fs.toFixed(1) + " Hz";
                    document.getElementById('manual-step-config').value = avgIncrementMs.toFixed(1);
                    document.getElementById('display-increment-config').textContent = avgIncrementMs.toFixed(1) + " ms";
                } else {
                    // Valeurs par défaut
                    appState.fs = 1000;
                    appState.timeIncrement = 0.001;
                    document.getElementById('display-fs-config').textContent = "1000.0 Hz";
                    document.getElementById('manual-step-config').value = "1.0";
                    document.getElementById('display-increment-config').textContent = "1.0 ms";
                }

                // Charger la première colonne par défaut
                loadColumnData(0);

            } else {
                setStatus(t("status.not_enough_data"));
            }
        } catch (err) {
            console.error("Erreur lors du parsing CSV:", err);
            setStatus(t("status.file_load_error"));
        }
    };
    reader.readAsText(file);
}

/**
 * Version POO du chargement CSV
 * Crée un nouveau projet avec les données du fichier
 */
async function handleFileUpload_POO(input) {
    console.log("📂 handleFileUpload_POO() - Chargement avec système POO");

    const file = input.files[0];
    if (!file) return;

    try {
        setStatus(t("status.loading_file", {name: file.name}));

        console.log(`📂 Création du projet depuis : ${file.name}`);

        // Créer un nouveau projet depuis le CSV
        const project = await projectManager.createProjectFromCSV(file);

        console.log(`✅ CSV chargé dans le projet : ${project.name}`);
        console.log(`   - ${project.state.fullDataTime.length} points`);
        console.log(`   - Fs: ${project.state.fs.toFixed(1)} Hz`);
        console.log(`   - ${project.state.availableColumns.length} canaux`);

        // Mettre à jour le titre de l'acquisition
        setAcquisitionTitle(project.name);

        // Mettre à jour l'interface
        if (typeof updateAllInterface === 'function') {
            updateAllInterface(true); // Chargement initial CSV = fermer freq/spectro
        } else {
            // Fallback
            updateTimeChart(true); // Chargement initial CSV = fermer freq/spectro
            updateStats();
            performAnalysis();
            updateSpectrogram();
        }

        // Ouvrir le configurateur, appliquer auto-groupé, puis fermer (invisible pour l'utilisateur)
        setTimeout(() => {
            if (typeof openChannelConfig === 'function' && typeof closeChannelConfig === 'function') {
                console.log("🔧 Auto-config: Ouverture du configurateur...");
                openChannelConfig();

                // Attendre que le DOM soit prêt, puis appliquer auto-groupé PENDANT que c'est ouvert
                setTimeout(() => {
                    if (typeof autoPresetYScales === 'function') {
                        console.log("📊 Application du preset 'Auto Groupé' (configurateur ouvert)...");
                        autoPresetYScales();
                    }

                    // Centrer les curseurs
                    setTimeout(() => {
                        if (typeof centerCursors === 'function') {
                            console.log("🎯 Centrage des curseurs...");
                            centerCursors();
                        }

                        // Fermer le configurateur après tout
                        setTimeout(() => {
                            closeChannelConfig();
                            console.log("✅ Auto-config terminée (configurateur fermé)");
                        }, 100);
                    }, 100);
                }, 200);
            }
        }, 300);

        setStatus(t("status.file_loaded", {name: project.name}));

        return project;

    } catch (error) {
        console.error("❌ Erreur lors du chargement CSV :", error);
        setStatus(t("status.error_msg", {msg: error.message}));
    }
}

// ⚠️ REMOVED: handleProjectUpload - Now handled by loadHSP() in hsp-manager.js

// --- EXPORT SYSTEM ---
// ⚠️ REMOVED: initSaveProject - Now handled by saveHSP()/exportToHSP() in hsp-manager.js

function initExportData() {
    if (!appState.fullDataTime.length) {
        alert(t("dialogs.no_data"));
        return;
    }
    appState.currentExportAction = 'exportCsv';
    prepareFilename();
    openModal('filenameModal');
    setupExportButton(); // S'assurer que le bouton est configuré
}

function initCaptureScreenshot() {
    if (!appState.fullDataTime.length) {
        alert(t("dialogs.no_data"));
        return;
    }
    appState.currentExportAction = 'exportPng';
    prepareFilename();
    openModal('filenameModal');
    setupExportButton(); // S'assurer que le bouton est configuré
}

function prepareFilename() {
    const now = new Date();
    const d = now.toISOString().slice(0, 10);
    const t = now.toTimeString().slice(0, 8).replace(/:/g, "-");
    let note = "data";
    const notesVal = document.getElementById('user-notes').value;
    if (notesVal && notesVal.trim()) {
        note = notesVal.split('\n')[0].replace(/[^a-z0-9_\- ]/gi, '').substring(0, 200);
    }
    document.getElementById('export-filename').value = `${d}_${t}_${note}`;
}

// ✅ CORRECTION : Gestion robuste du bouton d'export
function setupExportButton() {
    const exportBtn = document.getElementById('confirm-export-btn');
    if (exportBtn) {
        // Nettoyer les anciens événements
        exportBtn.replaceWith(exportBtn.cloneNode(true));

        // Réattacher le nouvel événement
        const newBtn = document.getElementById('confirm-export-btn');
        newBtn.onclick = function () {
            handleExportConfirm();
        };

        console.log("✅ Bouton d'export configuré");
    } else {
        console.log("⏳ Bouton pas encore disponible, réessai...");
        setTimeout(setupExportButton, 100);
    }
}

function handleExportConfirm() {
    const name = document.getElementById('export-filename').value;
    if (!name) {
        setStatus(t("status.please_enter_filename"));
        return;
    }

    console.log("🔄 Début export - Action:", appState.currentExportAction, "Nom:", name);

    try {
        // ⚠️ REMOVED: 'save' action - Now handled by hsp-manager.js
        if (appState.currentExportAction === 'exportCsv') {
            performExportCsv(name);
        } else if (appState.currentExportAction === 'exportPng') {
            performCapture(name);
        } else if (appState.currentExportAction === 'exportPdf') {
            captureAsPDF(name);
        } else {
            console.error("❌ Action inconnue:", appState.currentExportAction);
            setStatus(t("status.unknown_export_type"));
            return;
        }

        closeModal('filenameModal');
        console.log("✅ Export terminé avec succès");

    } catch (error) {
        console.error("❌ Erreur lors de l'export:", error);
        setStatus(t("status.export_error"));
    }
}

// ⚠️ REMOVED: performSaveProject - Now handled by performHSPSave() in hsp-manager.js

async function performExportCsv(filename) {
    // Exporter TOUTES les données (pas seulement entre les curseurs)
    const startIdx = 0;
    const endIdx = appState.fullDataTime.length;

    // Vérifier si nous avons des données multi-canaux
    const hasMultiChannel = appState.allColumnData &&
                           appState.availableColumns &&
                           appState.availableColumns.length > 0;

    let content = "";

    if (hasMultiChannel) {
        // MODE MULTI-CANAUX : Exporter toutes les colonnes
        console.log(`📊 Export multi-canaux : ${appState.availableColumns.length} canaux`);

        // Construire le header avec tous les noms de colonnes
        const timeColName = "Zeit [s]";
        const columnNames = appState.availableColumns.map(col => {
            // Utiliser le label original de la colonne (ex: "S1: P1 [bar]")
            return col.label + (col.unit ? ` [${col.unit}]` : '');
        });

        content = timeColName + ";" + columnNames.join(";") + "\n";

        // Exporter les données ligne par ligne
        for (let i = startIdx; i < endIdx; i++) {
            // Temps en secondes avec format européen (virgule)
            const timeInSeconds = (appState.fullDataTime[i] / 1000).toFixed(3).replace('.', ',');

            // Toutes les valeurs des colonnes avec format européen
            const values = appState.availableColumns.map(col => {
                const value = appState.allColumnData[col.index][i];
                return value.toFixed(2).replace('.', ',');
            });

            content += timeInSeconds + ";" + values.join(";") + "\n";
        }

        setStatus(t("status.csv_exported", {channels: appState.availableColumns.length, points: endIdx}));

    } else {
        // MODE MONO-CANAL : Export simple (compatibilité)
        console.log("📊 Export mono-canal");

        const timeColName = "Zeit [s]";
        const pressureColName = appState.yAxisLabel || "S1: P1 [bar]";

        content = `${timeColName};${pressureColName}\n`;

        for (let i = startIdx; i < endIdx; i++) {
            const timeInSeconds = (appState.fullDataTime[i] / 1000).toFixed(3).replace('.', ',');
            const pressure = appState.fullDataPressure[i].toFixed(2).replace('.', ',');
            content += `${timeInSeconds};${pressure}\n`;
        }

        setStatus(t("status.csv_exported_european"));
    }

    await downloadBlob(new Blob([content], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
}

function performCapture(filename) {
    // Fermer toutes les modales
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
   
    // Attendre
    setTimeout(() => {
        // Capturer uniquement la zone principale sans la sidebar
        const mainContent = document.querySelector('.plots-area');
        const elementToCapture = mainContent || document.body;
        
        setStatus(t("status.preparing_capture"));
        
        html2canvas(elementToCapture, {
            scale: 1.5,
            useCORS: true,
            backgroundColor: getComputedStyle(document.body).backgroundColor
        }).then(canvas => {
            // Convertir le canvas en Blob
            canvas.toBlob(blob => {
                downloadBlob(blob, `${filename}.png`);
                setStatus(t("status.capture_success"));
            }, 'image/png');
        }).catch(err => {
            console.error(err);
            setStatus(t("status.error_msg", {msg: err.message}));
        });
    }, 500);
}

// Fonction de secours pour capture simple
function attemptSimpleCapture(filename) {
    console.log("🔄 Tentative de capture simplifiée...");
    
    try {
        // Capture simple du body sans options complexes
        html2canvas(document.body, {
            scale: 1,
            useCORS: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            canvas.toBlob(blob => {
                downloadBlob(blob, `${filename}_simple.png`);
                setStatus(t("status.simplified_capture_done"));
            }, 'image/png');
        });
    } catch (error) {
        console.error("❌ Échec capture simplifiée:", error);
        setStatus(t("status.capture_total_failure"));
    }
}

async function downloadBlob(blob, name) {
    // Essayer d'utiliser l'API File System Access si disponible
    if ('showSaveFilePicker' in window) {
        try {
            // Extraire l'extension du nom de fichier
            const extension = name.split('.').pop();

            // Définir les types de fichiers acceptés
            const accepts = {};
            if (extension === 'hsp') {
                accepts['application/json'] = ['.hsp'];
            } else if (extension === 'csv') {
                accepts['text/csv'] = ['.csv'];
            } else if (extension === 'png') {
                accepts['image/png'] = ['.png'];
            } else if (extension === 'pdf') {
                accepts['application/pdf'] = ['.pdf'];
            }

            // Afficher le dialogue "Enregistrer sous"
            const handle = await window.showSaveFilePicker({
                suggestedName: name,
                types: [{
                    description: `Fichier ${extension.toUpperCase()}`,
                    accept: accepts
                }]
            });

            // Écrire le fichier
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();

            console.log(`✅ Fichier sauvegardé avec succès: ${name}`);
            setStatus(t("status.file_saved", {name}));
            return handle; // Retourner le fileHandle pour stockage
        } catch (err) {
            // Si l'utilisateur annule, ne rien faire
            if (err.name === 'AbortError') {
                console.log('❌ Sauvegarde annulée par l\'utilisateur');
                setStatus(t("status.save_cancelled"));
                return null;
            }
            // Sinon, utiliser le fallback
            console.warn('⚠️ showSaveFilePicker a échoué, utilisation du fallback:', err);
        }
    }

    // Fallback: téléchargement automatique (comportement actuel)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`📥 Fichier téléchargé (fallback): ${name}`);
    return null; // Pas de fileHandle en mode fallback
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function () {
    console.log("🚀 Initialisation des exports...");
    setupExportButton();
});

// Événement pour le bouton de confirmation d'export
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('confirm-export-btn').addEventListener('click', function () {
        const name = document.getElementById('export-filename').value;
        if (!name) return;

        if (appState.currentExportAction === 'save') performSaveProject(name);
        else if (appState.currentExportAction === 'exportCsv') performExportCsv(name);
        else if (appState.currentExportAction === 'exportPng') performCapture(name);

        closeModal('filenameModal');
    });
});

// Initialiser le système de réorganisation des sections
document.addEventListener('DOMContentLoaded', function () {
    if (typeof initSectionReorder === 'function') {
        initSectionReorder();
    }
});

// --- GESTION DES COLONNES MULTIPLES ---

function loadCurrentColumnData() {
    if (!appState.availableColumns.length) return;

    const currentCol = appState.availableColumns[appState.currentColumnIndex];
    const columnData = appState.allColumnData[currentCol.index];

    appState.fullDataPressure = new Float32Array(columnData);
    appState.yAxisLabel = currentCol.label;

    console.log("Chargement colonne:", currentCol.label, "données:", columnData.length);

    updateTimeChart();
    updateStats();
    performAnalysis();
    updateSpectrogram();
}

function updateColumnSelector() {
    const selector = document.getElementById('column-selector');
    const row = document.getElementById('column-selector-row');

    if (!selector || !row) {
        console.error("Élément selecteur non trouvé!");
        return;
    }

    if (appState.availableColumns.length > 1) {
        row.style.display = 'flex';
        selector.innerHTML = '';

        appState.availableColumns.forEach((col, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = col.label;
            selector.appendChild(option);
        });

        selector.value = appState.currentColumnIndex;
        console.log("Sélecteur mis à jour avec", appState.availableColumns.length, "colonnes");
    } else {
        row.style.display = 'none';
    }
}

function changeCurrentColumn(index) {
    if (index >= 0 && index < appState.availableColumns.length) {
        appState.currentColumnIndex = index;
        loadCurrentColumnData();
        
        // ✅ NOUVEAU : Mettre à jour l'affichage des annotations
        if (typeof updateAnnotationsDisplay === 'function') {
            updateAnnotationsDisplay();
        }
    }
}
function calculateFsFromTimeData(timeData) {
    if (timeData.length < 2) return 1000; // Valeur par défaut

    // Calculer la différence moyenne entre échantillons
    let totalDiff = 0;
    let validPairs = 0;

    for (let i = 1; i < timeData.length; i++) {
        const diff = timeData[i] - timeData[i - 1];
        if (diff > 0) {
            totalDiff += diff;
            validPairs++;
        }
    }

    if (validPairs === 0 || totalDiff === 0) return 1000;

    const avgDiffMs = (totalDiff / validPairs) * 1000; // en ms
    return avgDiffMs > 0 ? 1000 / avgDiffMs : 1000;
}

// --- GESTION EXCLUSIVITÉ DES OUTILS ---
// Désactiver tous les outils sauf celui spécifié
function deactivateOtherTools(currentTool) {
    // Liste des outils et leurs fonctions de désactivation
    const tools = {
        'annotation': () => {
            if (typeof isCreatingAnnotation !== 'undefined' && isCreatingAnnotation) {
                toggleAnnotationMode();
            }
        },
        'interval': () => {
            if (typeof isCreatingInterval !== 'undefined' && isCreatingInterval) {
                activateIntervalMode(); // Toggle pour désactiver
            }
        },
        'measure': () => {
            if (typeof measureState !== 'undefined' && measureState.active) {
                toggleMeasureTool();
            }
        },
        'diffcanal': () => {
            if (typeof diffCanalState !== 'undefined' && diffCanalState.active) {
                toggleDiffCanalTool();
            }
        },
        'ruler': () => {
            if (typeof rulerState !== 'undefined' && rulerState.active) {
                toggleRulerTool();
            }
        },
        'track': () => {
            if (typeof trackState !== 'undefined' && trackState.active) {
                toggleTrackTool();
            }
        },
        'pan': () => {
            if (typeof panState !== 'undefined' && panState.active) {
                togglePanTool();
            }
        }
    };

    // Désactiver tous les outils sauf celui en cours
    for (const [toolName, deactivateFn] of Object.entries(tools)) {
        if (toolName !== currentTool) {
            try {
                deactivateFn();
            } catch (e) {
                // Ignorer les erreurs si l'outil n'est pas chargé
            }
        }
    }
}

// Fermer tous les accordéons d'outils sauf celui spécifié (pour exclusivité visuelle)
function closeOtherToolAccordions(currentToolId) {
    const toolAccordions = [
        { id: 'ruler', contentId: 'ruler-results', iconId: 'ruler-accordion-icon' },
        { id: 'track', contentId: 'track-results', iconId: 'track-accordion-icon' },
        { id: 'measure', contentId: 'measure-results', iconId: 'measure-accordion-icon' },
        { id: 'snappoint', contentId: 'snappoint-content', iconId: 'snappoint-accordion-icon' },
        { id: 'interval', contentId: 'interval-content', iconId: 'interval-accordion-icon' },
        { id: 'diffcanal', contentId: 'diff-canal-content', iconId: 'diff-canal-accordion-icon' },
        { id: 'smoothing', contentId: 'smoothing-content', iconId: 'smoothing-toggle-icon' },
        { id: 'calculated', contentId: 'calculated-channel-content', iconId: 'calculated-channel-toggle-icon' }
    ];

    toolAccordions.forEach(tool => {
        if (tool.id !== currentToolId) {
            const content = document.getElementById(tool.contentId);
            if (content && content.style.display !== 'none') {
                content.style.display = 'none';
                if (tool.iconId) {
                    const icon = document.getElementById(tool.iconId);
                    if (icon) {
                        icon.classList.remove('fa-chevron-up');
                        icon.classList.add('fa-chevron-down');
                    }
                }
            }
        }
    });
}

// Fermer TOUS les accordéons principaux sauf celui spécifié
function closeAllMainAccordions(exceptTool) {
    const mainAccordions = [
        {
            tool: 'annotation',
            contentId: 'annotations-content',
            iconId: 'annotations-toggle-icon'
        },
        {
            tool: 'canal',
            contentId: 'canal-content',
            iconId: 'canal-toggle-icon',
            // Sous-accordéons de Canal
            subAccordions: [
                { contentId: 'smoothing-content', iconId: 'smoothing-toggle-icon' },
                { contentId: 'derivative-content', iconId: 'derivative-toggle-icon' },
                { contentId: 'calculated-channel-content', iconId: 'calculated-channel-toggle-icon' }
            ]
        },
        {
            tool: 'fft',
            contentId: 'fft-content',
            iconId: 'fft-toggle-icon'
        },
        {
            tool: 'spectro',
            contentId: 'spectro-content',
            iconId: 'spectro-toggle-icon'
        },
        {
            tool: 'pan',
            contentId: 'pan-content',
            iconId: 'pan-toggle-icon'
        },
        {
            tool: 'tools',
            contentId: 'tools-content',
            iconId: 'tools-toggle-icon',
            // Sous-accordéons de Outils
            subAccordions: [
                { contentId: 'interval-content', iconId: 'interval-accordion-icon' },
                { contentId: 'diff-canal-content', iconId: null }
            ]
        }
    ];

    mainAccordions.forEach(accordion => {
        if (accordion.tool !== exceptTool) {
            // Fermer l'accordéon principal
            const content = document.getElementById(accordion.contentId);
            const icon = document.getElementById(accordion.iconId);

            if (content) content.style.display = 'none';
            if (icon) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }

            // Fermer aussi les sous-accordéons si présents
            if (accordion.subAccordions) {
                accordion.subAccordions.forEach(sub => {
                    const subContent = document.getElementById(sub.contentId);
                    const subIcon = document.getElementById(sub.iconId);

                    if (subContent) subContent.style.display = 'none';
                    if (subIcon) {
                        subIcon.classList.remove('fa-chevron-up');
                        subIcon.classList.add('fa-chevron-down');
                    }
                });
            }
        }
    });
}

// =====================================
// EXPORT PDF
// =====================================

function initCapturePDF() {
    if (!appState.fullDataTime.length) {
        alert(t("dialogs.no_data_export"));
        return;
    }
    appState.currentExportAction = 'exportPdf';
    prepareFilename();
    openModal('filenameModal');
    setupExportButton();
}

function captureAsPDF(filename) {
    console.log("📄 Début de l'export PDF...");
    setStatus(t("status.generating_pdf"));

    // Initialiser jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('landscape', 'mm', 'a4');

    // Définir les métadonnées
    pdf.setProperties({
        title: `Analyse HydraSpec - ${filename}`,
        subject: 'Analyse spectrale et temporelle',
        author: 'HydraSpec Pro v1.4.0',
        keywords: 'FFT, spectrogramme, analyse signal, HydraSpec',
        creator: 'HydraSpec Pro'
    });

    // Page 1: Page de résumé
    createPDFSummaryPage(pdf, filename);

    // Page 2: Graphique temporel
    pdf.addPage();
    capturePDFTimeDomain(pdf, filename);
}

function createPDFSummaryPage(pdf, filename) {
    // Titre principal
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RAPPORT D\'ANALYSE SPECTRALE', 148.5, 20, { align: 'center' });

    // Informations générales
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR');

    let y = 40;
    pdf.text(`Fichier: ${filename}`, 20, y);
    y += 7;
    pdf.text(`Date d'analyse: ${dateStr} à ${timeStr}`, 20, y);
    y += 7;

    // Informations sur les données
    pdf.setFont('helvetica', 'bold');
    y += 5;
    pdf.text('CARACTÉRISTIQUES DES DONNÉES:', 20, y);
    pdf.setFont('helvetica', 'normal');
    y += 7;

    pdf.text(`• Nombre d'échantillons: ${appState.fullDataTime.length}`, 25, y);
    y += 6;

    if (appState.fs) {
        pdf.text(`• Fréquence d'échantillonnage: ${appState.fs.toFixed(2)} Hz`, 25, y);
        y += 6;
    }

    const duration = (appState.fullDataTime[appState.fullDataTime.length - 1] - appState.fullDataTime[0]) / 1000;
    pdf.text(`• Durée totale: ${duration.toFixed(3)} secondes`, 25, y);
    y += 10;

    // Notes utilisateur
    const notesElement = document.getElementById('user-notes');
    if (notesElement && notesElement.value.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('NOTES:', 20, y);
        pdf.setFont('helvetica', 'normal');
        y += 7;

        const notes = notesElement.value.trim();
        const lines = pdf.splitTextToSize(notes, 257);
        pdf.text(lines, 25, y);
    }

    // Pied de page
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('HydraSpec Pro v1.4.0', 20, 200);
    pdf.text(`Page 1/${pdf.internal.getNumberOfPages()}`, 270, 200);
    pdf.setTextColor(0, 0, 0);
}

function capturePDFTimeDomain(pdf, filename) {
    // Titre
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DOMAINE TEMPOREL', 148.5, 15, { align: 'center' });

    // Capturer le graphique temporel
    const timeContainer = document.getElementById('time-container');
    if (timeContainer && uiState.timeVisible) {
        html2canvas(timeContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: getComputedStyle(document.body).backgroundColor
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 10, 25, 277, 140);

            // Ajouter les graphiques fréquentiels s'ils sont visibles
            if (uiState.freqVisible) {
                pdf.addPage();
                capturePDFFrequencyDomain(pdf, filename);
            } else if (uiState.spectroVisible) {
                pdf.addPage();
                capturePDFSpectrogram(pdf, filename);
            } else {
                // Finaliser et sauvegarder
                finalizePDF(pdf, filename);
            }
        }).catch(err => {
            console.error("❌ Erreur capture temps:", err);
            setStatus(t("status.time_graph_capture_error"), 'error');
        });
    } else {
        // Pas de graphique temporel, passer au suivant
        if (uiState.freqVisible) {
            capturePDFFrequencyDomain(pdf, filename);
        } else if (uiState.spectroVisible) {
            capturePDFSpectrogram(pdf, filename);
        } else {
            finalizePDF(pdf, filename);
        }
    }
}

function capturePDFFrequencyDomain(pdf, filename) {
    // Titre
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DOMAINE FRÉQUENTIEL (FFT)', 148.5, 15, { align: 'center' });

    const freqContainer = document.getElementById('freq-container');
    if (freqContainer) {
        html2canvas(freqContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: getComputedStyle(document.body).backgroundColor
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 10, 25, 277, 140);

            // Ajouter le spectrogramme s'il est visible
            if (uiState.spectroVisible) {
                pdf.addPage();
                capturePDFSpectrogram(pdf, filename);
            } else {
                finalizePDF(pdf, filename);
            }
        }).catch(err => {
            console.error("❌ Erreur capture fréquence:", err);
            if (uiState.spectroVisible) {
                pdf.addPage();
                capturePDFSpectrogram(pdf, filename);
            } else {
                finalizePDF(pdf, filename);
            }
        });
    } else {
        if (uiState.spectroVisible) {
            capturePDFSpectrogram(pdf, filename);
        } else {
            finalizePDF(pdf, filename);
        }
    }
}

function capturePDFSpectrogram(pdf, filename) {
    // Titre
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SPECTROGRAMME STFT', 148.5, 15, { align: 'center' });

    const spectroContainer = document.getElementById('spectro-container');
    if (spectroContainer) {
        html2canvas(spectroContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: getComputedStyle(document.body).backgroundColor
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 10, 25, 277, 140);

            finalizePDF(pdf, filename);
        }).catch(err => {
            console.error("❌ Erreur capture spectrogramme:", err);
            finalizePDF(pdf, filename);
        });
    } else {
        finalizePDF(pdf, filename);
    }
}

function finalizePDF(pdf, filename) {
    // Ajouter les numéros de page sur toutes les pages
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i}/${pageCount}`, 270, 200);
    }

    // Convertir le PDF en Blob et utiliser downloadBlob pour la boîte de dialogue native
    const blob = pdf.output('blob');
    downloadBlob(blob, `${filename}.pdf`);
    setStatus(t("status.pdf_export_success"), 'success');
    closeModal('filenameModal');
}

// ========================================
// COPIE GRAPHIQUE DANS LE PRESSE-PAPIER
// ========================================

/**
 * Ajoute les notes utilisateur en dessous d'un canvas
 * @param {HTMLCanvasElement} sourceCanvas - Canvas source (graphiques)
 * @returns {HTMLCanvasElement} Canvas avec notes ajoutées ou canvas original si pas de notes
 */
async function addNotesToCanvas(sourceCanvas) {
    // Récupérer le texte des notes
    const notesTextarea = document.getElementById('user-notes');
    const notesText = notesTextarea ? notesTextarea.value.trim() : '';

    // Si pas de notes, retourner le canvas tel quel
    if (!notesText) {
        return sourceCanvas;
    }

    console.log(`📝 Ajout des notes au canvas (${notesText.length} caractères)`);

    // Créer un canvas temporaire pour mesurer le texte
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Configuration du texte
    const fontSize = 24; // Taille de police adaptée pour scale 2
    const lineHeight = fontSize * 1.4;
    const padding = 40;
    const maxWidth = sourceCanvas.width - (padding * 2);

    tempCtx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;

    // Fonction pour découper le texte en lignes (word wrap)
    function wrapText(text, maxWidth) {
        const lines = [];
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            if (!paragraph.trim()) {
                lines.push('');
                continue;
            }

            const words = paragraph.split(' ');
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = tempCtx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }

            if (currentLine) {
                lines.push(currentLine);
            }
        }

        return lines;
    }

    // Découper le texte en lignes
    const wrappedLines = wrapText(notesText, maxWidth);

    // Calculer la hauteur nécessaire pour la section notes
    const titleHeight = fontSize * 1.6;
    const textHeight = wrappedLines.length * lineHeight;
    const notesHeight = padding + titleHeight + textHeight + padding;

    // Créer le canvas final avec la hauteur augmentée
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = sourceCanvas.width;
    finalCanvas.height = sourceCanvas.height + notesHeight;

    const ctx = finalCanvas.getContext('2d');

    // Copier le canvas source (graphiques) en haut
    ctx.drawImage(sourceCanvas, 0, 0);

    // Dessiner le fond de la section notes
    const bgColor = getComputedStyle(document.body).backgroundColor;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, sourceCanvas.height, finalCanvas.width, notesHeight);

    // Dessiner une ligne de séparation
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, sourceCanvas.height + padding / 2);
    ctx.lineTo(finalCanvas.width - padding, sourceCanvas.height + padding / 2);
    ctx.stroke();

    // Dessiner le titre "Notes :"
    const textColor = getComputedStyle(document.body).color;
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
    ctx.fillText(t("notes") || "Notes :", padding, sourceCanvas.height + padding + titleHeight);

    // Dessiner le texte des notes
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
    let yPosition = sourceCanvas.height + padding + titleHeight + lineHeight;

    for (const line of wrappedLines) {
        ctx.fillText(line, padding, yPosition);
        yPosition += lineHeight;
    }

    console.log(`✅ Notes ajoutées : ${wrappedLines.length} ligne(s), hauteur +${notesHeight}px`);

    return finalCanvas;
}

/**
 * Copie tous les graphiques visibles dans le presse-papier
 * Capture le domaine temporel, fréquentiel et spectrogramme s'ils sont ouverts
 * Utilise html2canvas pour capturer les conteneurs complets (avec titres, etc.)
 */
async function copyChartsToClipboard() {
    try {
        // Vérifier qu'il y a des données
        if (!appState.fullDataTime || appState.fullDataTime.length === 0) {
            alert(t("dialogs.no_data") || "Aucune donnée à copier");
            return;
        }

        // Vérifier le support de l'API Clipboard
        if (!navigator.clipboard || !navigator.clipboard.write) {
            console.warn("⚠️ API Clipboard non supportée, téléchargement de l'image à la place");
            await fallbackDownloadCharts();
            return;
        }

        setStatus(t("status.copying_chart") || "Copie des graphiques...");

        // Identifier les conteneurs visibles
        const timeContainer = document.getElementById('time-container');
        const freqContainer = document.getElementById('freq-container');
        const spectroContainer = document.getElementById('spectro-container');

        const visibleContainers = [];
        if (timeContainer && !timeContainer.classList.contains('hidden')) {
            visibleContainers.push({ element: timeContainer, name: 'Temps' });
        }
        if (freqContainer && !freqContainer.classList.contains('hidden')) {
            visibleContainers.push({ element: freqContainer, name: 'Fréquence' });
        }
        if (spectroContainer && !spectroContainer.classList.contains('hidden')) {
            visibleContainers.push({ element: spectroContainer, name: 'Spectrogramme' });
        }

        if (visibleContainers.length === 0) {
            alert(t("dialogs.no_chart") || "Aucun graphique visible");
            return;
        }

        console.log(`📊 Capture de ${visibleContainers.length} graphique(s) : ${visibleContainers.map(c => c.name).join(', ')}`);

        // Capturer chaque conteneur visible avec html2canvas
        const captures = [];
        for (const container of visibleContainers) {
            try {
                const canvas = await html2canvas(container.element, {
                    backgroundColor: getComputedStyle(document.body).backgroundColor,
                    scale: 2, // Qualité 2x pour meilleure résolution
                    logging: false,
                    useCORS: true
                });
                captures.push(canvas);
                console.log(`✅ Capturé : ${container.name} (${canvas.width}x${canvas.height})`);
            } catch (err) {
                console.error(`❌ Erreur capture ${container.name}:`, err);
            }
        }

        if (captures.length === 0) {
            throw new Error("Aucun graphique n'a pu être capturé");
        }

        // Créer un canvas composite qui combine toutes les captures verticalement
        const compositeCanvas = document.createElement('canvas');
        const ctx = compositeCanvas.getContext('2d');

        // Calculer dimensions du canvas composite
        const maxWidth = Math.max(...captures.map(c => c.width));
        const totalHeight = captures.reduce((sum, c) => sum + c.height, 0);
        compositeCanvas.width = maxWidth;
        compositeCanvas.height = totalHeight;

        // Remplir le fond avec la couleur de fond du document
        ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
        ctx.fillRect(0, 0, maxWidth, totalHeight);

        // Dessiner chaque capture l'une au-dessus de l'autre
        let yOffset = 0;
        for (const canvas of captures) {
            ctx.drawImage(canvas, 0, yOffset);
            yOffset += canvas.height;
        }

        console.log(`✅ Canvas composite créé : ${compositeCanvas.width}x${compositeCanvas.height}`);

        // Ajouter les notes si elles existent
        const finalCanvas = await addNotesToCanvas(compositeCanvas);

        // Convertir le canvas final en Blob PNG
        finalCanvas.toBlob(async (blob) => {
            if (!blob) {
                throw new Error("Impossible de créer le Blob");
            }

            try {
                // Créer un ClipboardItem avec le Blob
                const item = new ClipboardItem({ 'image/png': blob });

                // Copier dans le presse-papier
                await navigator.clipboard.write([item]);

                const graphCount = visibleContainers.length;
                const graphNames = visibleContainers.map(c => c.name).join(', ');
                setStatus(
                    t("status.charts_copied")?.replace('{count}', graphCount).replace('{names}', graphNames) ||
                    `✅ ${graphCount} graphique(s) copié(s) dans le presse-papier !`,
                    'success'
                );

                // Feedback visuel temporaire sur le bouton
                const copyBtn = document.querySelector('[onclick="copyChartsToClipboard()"]');
                if (copyBtn) {
                    const originalHTML = copyBtn.innerHTML;
                    const originalColor = copyBtn.style.color;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> <span data-i18n="menu.copied">Copié !</span>';
                    copyBtn.style.color = 'var(--accent-green)';

                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.color = originalColor;
                    }, 2000);
                }

            } catch (clipboardError) {
                console.error("❌ Erreur copie presse-papier:", clipboardError);

                // Si l'API Clipboard échoue, proposer le téléchargement
                const download = confirm(
                    (t("dialogs.clipboard_failed") ||
                    "Impossible de copier dans le presse-papier.\n\nVoulez-vous télécharger l'image à la place ?")
                );

                if (download) {
                    await fallbackDownloadCharts();
                } else {
                    setStatus(t("status.copy_cancelled") || "Copie annulée");
                }
            }
        }, 'image/png', 1.0); // Qualité PNG maximale

    } catch (error) {
        console.error("❌ Erreur lors de la copie:", error);
        alert((t("dialogs.copy_error") || "Erreur lors de la copie des graphiques") + ":\n" + error.message);
        setStatus(t("status.copy_failed") || "Échec de la copie");
    }
}

/**
 * Fallback : télécharge l'image composite si la copie dans le presse-papier échoue
 */
async function fallbackDownloadCharts() {
    try {
        // Identifier les conteneurs visibles
        const timeContainer = document.getElementById('time-container');
        const freqContainer = document.getElementById('freq-container');
        const spectroContainer = document.getElementById('spectro-container');

        const visibleContainers = [];
        if (timeContainer && !timeContainer.classList.contains('hidden')) {
            visibleContainers.push(timeContainer);
        }
        if (freqContainer && !freqContainer.classList.contains('hidden')) {
            visibleContainers.push(freqContainer);
        }
        if (spectroContainer && !spectroContainer.classList.contains('hidden')) {
            visibleContainers.push(spectroContainer);
        }

        if (visibleContainers.length === 0) {
            alert(t("dialogs.no_chart") || "Aucun graphique visible");
            return;
        }

        // Capturer chaque conteneur visible avec html2canvas
        const captures = [];
        for (const container of visibleContainers) {
            try {
                const canvas = await html2canvas(container, {
                    backgroundColor: getComputedStyle(document.body).backgroundColor,
                    scale: 2,
                    logging: false,
                    useCORS: true
                });
                captures.push(canvas);
            } catch (err) {
                console.error("❌ Erreur capture:", err);
            }
        }

        if (captures.length === 0) {
            throw new Error("Aucun graphique n'a pu être capturé");
        }

        // Créer un canvas composite
        const compositeCanvas = document.createElement('canvas');
        const ctx = compositeCanvas.getContext('2d');

        const maxWidth = Math.max(...captures.map(c => c.width));
        const totalHeight = captures.reduce((sum, c) => sum + c.height, 0);
        compositeCanvas.width = maxWidth;
        compositeCanvas.height = totalHeight;

        ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
        ctx.fillRect(0, 0, maxWidth, totalHeight);

        let yOffset = 0;
        for (const canvas of captures) {
            ctx.drawImage(canvas, 0, yOffset);
            yOffset += canvas.height;
        }

        // Ajouter les notes si elles existent
        const finalCanvas = await addNotesToCanvas(compositeCanvas);

        // Générer un nom de fichier avec timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const filename = `HydraSpec_Graphiques_${timestamp}.png`;

        // Convertir le canvas final en Data URL
        const dataURL = finalCanvas.toDataURL('image/png', 1.0);

        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.click();

        setStatus(t("status.chart_downloaded") || "✅ Graphiques téléchargés", 'success');

    } catch (error) {
        console.error("❌ Erreur téléchargement fallback:", error);
        alert((t("dialogs.download_failed") || "Impossible de télécharger l'image") + ":\n" + error.message);
    }
}

// Rétrocompatibilité : alias pour l'ancienne fonction
async function copyTimeChartToClipboard() {
    return copyChartsToClipboard();
}
