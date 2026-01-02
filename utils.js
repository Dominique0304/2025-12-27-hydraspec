// --- UTILITY FUNCTIONS ---

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
                setStatus("Fichier CSV invalide");
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
                setStatus("Pas assez de données valides dans le fichier");
            }
        } catch (err) {
            console.error("Erreur lors du parsing CSV:", err);
            setStatus("Erreur lors du chargement du fichier");
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
        setStatus(`Chargement de ${file.name}...`);

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
            updateAllInterface();
        } else {
            // Fallback
            updateTimeChart();
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

        setStatus(`Fichier chargé : ${project.name}`);

        return project;

    } catch (error) {
        console.error("❌ Erreur lors du chargement CSV :", error);
        setStatus(`Erreur : ${error.message}`);
    }
}

// ⚠️ REMOVED: handleProjectUpload - Now handled by loadHSP() in hsp-manager.js

// --- EXPORT SYSTEM ---
// ⚠️ REMOVED: initSaveProject - Now handled by saveHSP()/exportToHSP() in hsp-manager.js

function initExportData() {
    if (!appState.fullDataTime.length) {
        alert("Aucune donnée.");
        return;
    }
    appState.currentExportAction = 'exportCsv';
    prepareFilename();
    openModal('filenameModal');
    setupExportButton(); // S'assurer que le bouton est configuré
}

function initCaptureScreenshot() {
    if (!appState.fullDataTime.length) {
        alert("Aucune donnée.");
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
        setStatus("Veuillez entrer un nom de fichier");
        return;
    }

    console.log("🔄 Début export - Action:", appState.currentExportAction, "Nom:", name);

    try {
        // ⚠️ REMOVED: 'save' action - Now handled by hsp-manager.js
        if (appState.currentExportAction === 'exportCsv') {
            performExportCsv(name);
        } else if (appState.currentExportAction === 'exportPng') {
            performCapture(name);
        } else {
            console.error("❌ Action inconnue:", appState.currentExportAction);
            setStatus("Erreur: type d'export inconnu");
            return;
        }

        closeModal('filenameModal');
        console.log("✅ Export terminé avec succès");

    } catch (error) {
        console.error("❌ Erreur lors de l'export:", error);
        setStatus("Erreur lors de l'export");
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

        setStatus(`Fichier CSV exporté : ${appState.availableColumns.length} canaux, ${endIdx} points`);

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

        setStatus("Fichier CSV exporté (1 canal, toutes les données, format européen).");
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
        
        setStatus("Préparation de la capture...");
        
        html2canvas(elementToCapture, {
            scale: 1.5,
            useCORS: true,
            backgroundColor: getComputedStyle(document.body).backgroundColor
        }).then(canvas => {
            // Convertir le canvas en Blob
            canvas.toBlob(blob => {
                downloadBlob(blob, `${filename}.png`);
                setStatus("Capture réussie!");
            }, 'image/png');
        }).catch(err => {
            console.error(err);
            setStatus("Erreur: " + err.message);
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
                setStatus("Capture simplifiée effectuée");
            }, 'image/png');
        });
    } catch (error) {
        console.error("❌ Échec capture simplifiée:", error);
        setStatus("Échec complet de la capture");
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
            setStatus(`Fichier sauvegardé: ${name}`);
            return handle; // Retourner le fileHandle pour stockage
        } catch (err) {
            // Si l'utilisateur annule, ne rien faire
            if (err.name === 'AbortError') {
                console.log('❌ Sauvegarde annulée par l\'utilisateur');
                setStatus('Sauvegarde annulée');
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
