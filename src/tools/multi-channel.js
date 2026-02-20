// =====================================
// SYSTÈME DE CONFIGURATION MULTI-CANAUX
// =====================================

// Couleurs par défaut pour les canaux
const DEFAULT_CHANNEL_COLORS = [
    '#FF0000',  // Rouge
    '#0000FF',  // Bleu
    '#00FF00',  // Vert
    '#FF8C00',  // Orange
    '#FF00FF',  // Magenta
    '#00FFFF',  // Cyan
    '#FFD700',  // Or
    '#8B00FF'   // Violet
];

/**
 * Créer ou obtenir le canal fantôme pour les annotations flottantes
 * Ce canal invisible permet aux annotations de rester affichées même quand tous les canaux sont masqués
 * @returns {Object} La configuration du canal fantôme
 */
function getOrCreatePhantomChannel() {
    // Vérifier si le canal fantôme existe déjà
    const existingPhantom = appState.channelConfig?.find(c => c.isPhantom === true);
    if (existingPhantom) {
        console.log("✅ Canal fantôme déjà présent (ID=" + existingPhantom.index + ")");
        return existingPhantom;
    }

    // Créer le canal fantôme
    const phantomChannel = {
        index: -1,                           // ID négatif impossible pour un canal normal
        name: "__PHANTOM__",                 // Nom interne (ne pas traduire)
        label: "Annotations flottantes",     // Label affiché (si besoin)
        unit: "",
        visible: false,                      // TOUJOURS invisible
        color: '#CCCCCC',                   // Gris (jamais affiché)
        lineWidth: 0,
        yAxisPosition: 'left',
        yMin: 0,                            // Plage fixe large
        yMax: 1000,                         // Ajustable si annotations hors plage
        yAxisID: 'yPhantom',                // Échelle Y dédiée
        showFFT: false,
        isPhantom: true,                    // FLAG CRITIQUE pour filtrage
        isCalculated: false,
        isSmoothing: false,
        isDerivative: false
    };

    // Ajouter à la configuration
    if (!appState.channelConfig) {
        appState.channelConfig = [];
    }
    appState.channelConfig.push(phantomChannel);

    console.log("👻 Canal fantôme créé pour annotations flottantes");
    return phantomChannel;
}

// Initialiser la configuration des canaux
function initChannelConfig() {
    console.log("🎨 Initialisation de la configuration multi-canaux");

    if (!appState.availableColumns || appState.availableColumns.length === 0) {
        console.log("⚠️ Aucun canal disponible");
        return;
    }

    // Créer la configuration par défaut pour chaque canal
    appState.channelConfig = appState.availableColumns.map((col, index) => ({
        index: col.index,
        name: col.name,
        label: col.label,
        unit: col.unit || "",
        visible: true, // TOUS les canaux sont visibles par défaut
        color: DEFAULT_CHANNEL_COLORS[index % DEFAULT_CHANNEL_COLORS.length],
        lineWidth: 0.5,  // Épaisseur de ligne par défaut
        yAxisPosition: index === 0 ? 'left' : 'right',  // Premier à gauche, autres à droite
        yMin: null,  // Auto
        yMax: null,  // Auto
        yAxisID: `y${index}`,
        showFFT: index === 0  // Seul le premier canal affiche la FFT par défaut
    }));

    console.log("✅ Configuration initialisée pour", appState.channelConfig.length, "canaux");
}

// Ouvrir la modale de configuration
function openChannelConfig(silent = false) {
    const modal = document.getElementById('channel-config-modal');
    if (!modal) {
        console.error("❌ Modale de configuration non trouvée");
        return;
    }

    // Mettre à jour le contenu de la modale
    updateChannelConfigUI();

    // Mettre à jour l'aperçu CSV (uniquement pour fichiers CSV)
    const csvPreviewSection = document.getElementById('csv-preview-section');
    const filePreviewTextarea = document.getElementById('file-preview-text');

    const project = getActiveProject();
    const isCSV = project && project.fileType === 'csv';

    if (csvPreviewSection) {
        csvPreviewSection.style.display = isCSV ? 'block' : 'none';
    }

    if (filePreviewTextarea && isCSV) {
        filePreviewTextarea.value = appState.rawFilePreview || '';
    }

    // Gérer l'affichage du conteneur "Ajouter des unités aux colonnes" (uniquement pour fichiers CSV)
    const unitsInfoSection = document.getElementById('units-info-section');
    if (unitsInfoSection) {
        unitsInfoSection.style.display = isCSV ? 'block' : 'none';
    }

    // Restaurer le pas (ms) depuis le projet
    const manualStepInput = document.getElementById('manual-step-config');
    if (manualStepInput && project && project.state.timeIncrement !== undefined) {
        const stepMs = (project.state.timeIncrement * 1000).toFixed(2);
        manualStepInput.value = stepMs;

        // Mettre à jour les champs d'affichage associés
        const displayFsConfig = document.getElementById('display-fs-config');
        const displayIncrementConfig = document.getElementById('display-increment-config');
        const displayNConfig = document.getElementById('display-n-config');

        if (displayFsConfig) {
            displayFsConfig.textContent = project.state.fs.toFixed(1) + " Hz";
        }
        if (displayIncrementConfig) {
            displayIncrementConfig.textContent = stepMs + " ms";
        }
        if (displayNConfig && project.state.fullDataTime) {
            displayNConfig.textContent = project.state.fullDataTime.length;
        }

        console.log(`🔄 Pas (ms) restauré : ${stepMs} ms (Fs: ${project.state.fs.toFixed(1)} Hz, N: ${project.state.fullDataTime?.length})`);
    }

    // Synchroniser les champs min(s) et max(s) avec l'axe X actuel
    syncZoomInputsWithChart();

    // Initialiser les écouteurs d'événements pour les presets globaux
    initPresetListeners();

    // Configurer le drag and drop de la modale
    setupModalDrag();

    modal.style.display = 'flex';

    // Mode silencieux : rendre invisible mais garder le DOM actif
    if (silent) {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    } else {
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
    }
}

// Fermer la modale
function closeChannelConfig(silent = false) {
    const modal = document.getElementById('channel-config-modal');
    if (modal) {
        // En mode silencieux, restaurer d'abord l'opacité avant de masquer
        if (silent) {
            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
        }
        modal.style.display = 'none';
    }
}

// Mettre à jour l'interface de configuration
function updateChannelConfigUI() {
    const tbody = document.getElementById('channel-config-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Filtrer les canaux fantômes (ne pas les afficher dans l'UI)
    const visibleChannels = appState.channelConfig.filter(c => !c.isPhantom);

    // Ajouter une ligne pour chaque canal (sauf fantômes)
    visibleChannels.forEach((config, uiIndex) => {
        const row = document.createElement('tr');

        // Stocker l'index global pour mapper correctement aux lignes du tableau
        const globalIndex = appState.channelConfig.indexOf(config);
        row.setAttribute('data-global-index', globalIndex);
        console.log(`📋 Ligne UI ${uiIndex} → Canal global ${globalIndex} (${config.label})`);

        // Checkbox visible
        const visibleCell = document.createElement('td');
        const visibleCheck = document.createElement('input');
        visibleCheck.type = 'checkbox';
        visibleCheck.checked = config.visible;
        visibleCheck.style.width = '22px';
        visibleCheck.style.height = '22px';
        visibleCheck.style.cursor = 'pointer';
        visibleCheck.onchange = (e) => {
            config.visible = e.target.checked;

            // Si on décoche Visible, décocher aussi FFT et griser la ligne
            if (!e.target.checked) {
                config.showFFT = false;
                fftCheck.checked = false;
                fftCheck.disabled = true;
                row.style.opacity = '0.5';
            } else {
                fftCheck.disabled = false;
                row.style.opacity = '1';
            }

            // Synchroniser avec les autres tableaux
            if (typeof updateCanalQuickView === 'function') {
                updateCanalQuickView();
            }
            if (typeof updateFFTCanalQuickView === 'function') {
                updateFFTCanalQuickView();
            }

            updateTimeChart();
            performAnalysis(); // Mettre à jour le graphique FFT
        };
        visibleCell.appendChild(visibleCheck);

        // Nom du canal (modifiable)
        const nameCell = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = config.label;
        nameInput.style.width = '100%';
        nameInput.style.fontWeight = 'bold';
        nameInput.style.padding = '4px';
        nameInput.style.background = 'var(--input-bg)';
        nameInput.style.color = 'var(--text-main)';
        nameInput.style.border = '1px solid var(--border-color)';
        nameInput.style.borderRadius = '4px';
        nameInput.onchange = (e) => {
            config.label = e.target.value;
            config.name = e.target.value;
            updateTimeChart();
        };
        nameCell.appendChild(nameInput);

        // Couleur
        const colorCell = document.createElement('td');
        colorCell.style.textAlign = 'center';
        colorCell.style.padding = '8px';

        // Créer un bouton coloré au lieu d'un input type="color"
        const colorBtn = document.createElement('div');
        colorBtn.dataset.colorValue = config.color;
        colorBtn.style.width = '50px';
        colorBtn.style.height = '30px';
        colorBtn.style.backgroundColor = config.color;
        colorBtn.style.border = '2px solid var(--border-color)';
        colorBtn.style.borderRadius = '4px';
        colorBtn.style.cursor = 'pointer';
        colorBtn.onclick = function() {
            openAdvancedColorPicker(this.dataset.colorValue, (color) => {
                this.dataset.colorValue = color;
                config.color = color;
                updateTimeChart();
                performAnalysis(); // Mettre à jour le graphique FFT
            }, this);
        };
        colorCell.appendChild(colorBtn);

        // Checkbox L (Left)
        const leftCell = document.createElement('td');
        leftCell.style.textAlign = 'center';
        const leftCheck = document.createElement('input');
        leftCheck.type = 'checkbox';
        leftCheck.checked = config.yAxisPosition === 'left';
        leftCheck.style.width = '22px';
        leftCheck.style.height = '22px';
        leftCheck.style.cursor = 'pointer';
        leftCheck.title = 'Axe Y à gauche';
        leftCheck.onchange = (e) => {
            if (e.target.checked) {
                config.yAxisPosition = 'left';
                rightCheck.checked = false;
            } else {
                // Si on décoche L et que R n'est pas coché, masquer l'axe
                if (!rightCheck.checked) {
                    config.yAxisPosition = 'hidden';
                }
            }

            // Synchroniser avec les autres tableaux
            if (typeof updateCanalQuickView === 'function') {
                updateCanalQuickView();
            }

            updateTimeChart();
            performAnalysis();
        };
        leftCell.appendChild(leftCheck);

        // Checkbox R (Right)
        const rightCell = document.createElement('td');
        rightCell.style.textAlign = 'center';
        const rightCheck = document.createElement('input');
        rightCheck.type = 'checkbox';
        rightCheck.checked = config.yAxisPosition === 'right';
        rightCheck.style.width = '22px';
        rightCheck.style.height = '22px';
        rightCheck.style.cursor = 'pointer';
        rightCheck.title = 'Axe Y à droite';
        rightCheck.onchange = (e) => {
            if (e.target.checked) {
                config.yAxisPosition = 'right';
                leftCheck.checked = false;
            } else {
                // Si on décoche R et que L n'est pas coché, masquer l'axe
                if (!leftCheck.checked) {
                    config.yAxisPosition = 'hidden';
                }
            }

            // Synchroniser avec les autres tableaux
            if (typeof updateCanalQuickView === 'function') {
                updateCanalQuickView();
            }

            updateTimeChart();
            performAnalysis();
        };
        rightCell.appendChild(rightCheck);

        // Créer d'abord le preset selector (on en aura besoin dans les événements Y Min/Max)
        const presetSelect = document.createElement('select');
        presetSelect.style.width = '50px';
        presetSelect.style.padding = '4px';
        presetSelect.style.background = 'var(--input-bg)';
        presetSelect.style.color = 'var(--text-main)';
        presetSelect.style.border = '1px solid var(--border-color)';
        presetSelect.style.borderRadius = '4px';
        presetSelect.style.cursor = 'pointer';

        // Options
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '--';
        presetSelect.appendChild(noneOption);

        for (let i = 1; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            presetSelect.appendChild(option);
        }

        // Y Min
        const yMinCell = document.createElement('td');
        const yMinInput = document.createElement('input');
        yMinInput.type = 'number';
        yMinInput.step = '0.1';
        yMinInput.placeholder = 'Auto';
        yMinInput.value = config.yMin !== null ? config.yMin : '';
        yMinInput.style.width = '60px';
        yMinInput.onchange = (e) => {
            const newValue = e.target.value === '' ? null : parseFloat(e.target.value);
            config.yMin = newValue;
            console.log(`📊 Y Min modifié pour ${config.label}: ${newValue}`);

            // Vérifier si les valeurs correspondent encore à un preset
            let matchesPreset = false;
            for (let i = 1; i <= 5; i++) {
                const presetYMinElem = document.getElementById(`preset${i}-ymin`);
                const presetYMaxElem = document.getElementById(`preset${i}-ymax`);

                if (presetYMinElem && presetYMaxElem) {
                    const presetYMin = parseFloat(presetYMinElem.value);
                    const presetYMax = parseFloat(presetYMaxElem.value);
                    const currentYMin = config.yMin;
                    const currentYMax = config.yMax;

                    if (currentYMin === presetYMin && currentYMax === presetYMax) {
                        matchesPreset = true;
                        break;
                    }
                }
            }

            // Si ne correspond à aucun preset, réinitialiser à "--"
            if (!matchesPreset) {
                presetSelect.value = '';
            }

            // Mettre à jour le graphique (appliquera Ymin/Ymax du canal X si nécessaire)
            updateTimeChart();
        };
        yMinCell.appendChild(yMinInput);

        // Y Max
        const yMaxCell = document.createElement('td');
        const yMaxInput = document.createElement('input');
        yMaxInput.type = 'number';
        yMaxInput.step = '0.1';
        yMaxInput.placeholder = 'Auto';
        yMaxInput.value = config.yMax !== null ? config.yMax : '';
        yMaxInput.style.width = '60px';
        yMaxInput.onchange = (e) => {
            const newValue = e.target.value === '' ? null : parseFloat(e.target.value);
            config.yMax = newValue;
            console.log(`📊 Y Max modifié pour ${config.label}: ${newValue}`);

            // Vérifier si les valeurs correspondent encore à un preset
            let matchesPreset = false;
            for (let i = 1; i <= 5; i++) {
                const presetYMinElem = document.getElementById(`preset${i}-ymin`);
                const presetYMaxElem = document.getElementById(`preset${i}-ymax`);

                if (presetYMinElem && presetYMaxElem) {
                    const presetYMin = parseFloat(presetYMinElem.value);
                    const presetYMax = parseFloat(presetYMaxElem.value);
                    const currentYMin = config.yMin;
                    const currentYMax = config.yMax;

                    if (currentYMin === presetYMin && currentYMax === presetYMax) {
                        matchesPreset = true;
                        break;
                    }
                }
            }

            // Si ne correspond à aucun preset, réinitialiser à "--"
            if (!matchesPreset) {
                presetSelect.value = '';
            }

            // Mettre à jour le graphique (appliquera Ymin/Ymax du canal X si nécessaire)
            updateTimeChart();
        };
        yMaxCell.appendChild(yMaxInput);

        // Checkbox FFT
        const fftCell = document.createElement('td');
        fftCell.style.textAlign = 'center';
        const fftCheck = document.createElement('input');
        fftCheck.type = 'checkbox';
        fftCheck.checked = config.showFFT;
        fftCheck.style.width = '22px';
        fftCheck.style.height = '22px';
        fftCheck.style.cursor = 'pointer';
        fftCheck.onchange = (e) => {
            config.showFFT = e.target.checked;

            // Synchroniser vers les autres tableaux
            if (typeof updateCanalQuickView === 'function') {
                updateCanalQuickView();
            }
            if (typeof updateFFTCanalQuickView === 'function') {
                updateFFTCanalQuickView();
            }

            performAnalysis();
        };
        fftCell.appendChild(fftCheck);

        // Vérifier si les valeurs actuelles correspondent à un preset
        let initialPreset = '';
        if (config.yMin !== null && config.yMax !== null) {
            for (let i = 1; i <= 5; i++) {
                const presetYMin = parseFloat(document.getElementById(`preset${i}-ymin`).value);
                const presetYMax = parseFloat(document.getElementById(`preset${i}-ymax`).value);

                if (config.yMin === presetYMin && config.yMax === presetYMax) {
                    initialPreset = i.toString();
                    break;
                }
            }
        }
        presetSelect.value = initialPreset;

        // Preset selector (événement onchange)
        presetSelect.onchange = (e) => {
            const presetNum = e.target.value;
            if (presetNum) {
                const yMin = parseFloat(document.getElementById(`preset${presetNum}-ymin`).value);
                const yMax = parseFloat(document.getElementById(`preset${presetNum}-ymax`).value);

                // Mettre à jour les champs
                yMinInput.value = yMin;
                yMaxInput.value = yMax;

                // Mettre à jour la config
                config.yMin = yMin;
                config.yMax = yMax;

                updateTimeChart();
            }
        };

        // Preset cell
        const presetCell = document.createElement('td');
        presetCell.style.textAlign = 'center';
        presetCell.appendChild(presetSelect);

        row.appendChild(visibleCell);
        row.appendChild(nameCell);
        row.appendChild(colorCell);
        row.appendChild(leftCell);
        row.appendChild(rightCell);
        row.appendChild(yMinCell);
        row.appendChild(yMaxCell);
        row.appendChild(fftCell);
        row.appendChild(presetCell);

        // Appliquer l'état initial si le canal n'est pas visible
        if (!config.visible) {
            fftCheck.disabled = true;
            row.style.opacity = '0.5';
        }

        tbody.appendChild(row);
    });

    // Configurer la navigation par flèches dans le tableau
    setupArrowKeyNavigation();

    // Mettre à jour le sélecteur d'axe X
    updateXAxisSelector();
}

// Configurer la navigation par flèches dans le tableau
function setupArrowKeyNavigation() {
    const tbody = document.getElementById('channel-config-tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.forEach((row, rowIndex) => {
        // Obtenir tous les inputs et selects éditables de la ligne
        const inputs = Array.from(row.querySelectorAll('input[type="number"], select'));

        inputs.forEach((input, colIndex) => {
            input.addEventListener('keydown', (e) => {
                let handled = false;

                switch(e.key) {
                    case 'ArrowUp':
                        // Aller à la ligne du dessus, même colonne
                        if (rowIndex > 0) {
                            const targetRow = rows[rowIndex - 1];
                            const targetInputs = Array.from(targetRow.querySelectorAll('input[type="number"], select'));
                            if (targetInputs[colIndex]) {
                                targetInputs[colIndex].focus();
                                handled = true;
                            }
                        }
                        break;

                    case 'ArrowDown':
                        // Aller à la ligne du dessous, même colonne
                        if (rowIndex < rows.length - 1) {
                            const targetRow = rows[rowIndex + 1];
                            const targetInputs = Array.from(targetRow.querySelectorAll('input[type="number"], select'));
                            if (targetInputs[colIndex]) {
                                targetInputs[colIndex].focus();
                                handled = true;
                            }
                        }
                        break;

                    case 'ArrowLeft':
                        // Aller au champ précédent dans la même ligne
                        if (colIndex > 0) {
                            inputs[colIndex - 1].focus();
                            handled = true;
                        }
                        break;

                    case 'ArrowRight':
                        // Aller au champ suivant dans la même ligne
                        if (colIndex < inputs.length - 1) {
                            inputs[colIndex + 1].focus();
                            handled = true;
                        }
                        break;
                }

                if (handled) {
                    e.preventDefault();
                }
            });
        });
    });
}

// =====================================
// GESTION DYNAMIQUE DE L'AXE X
// =====================================

/**
 * Obtenir les informations sur l'axe X actuel
 * @returns {Object} Configuration de l'axe X
 */
function getXAxisInfo() {
    if (appState.xAxisChannel === 0) {
        // Axe X = Temps
        return {
            channelIndex: 0,
            data: appState.fullDataTime,
            unit: 's',           // Unité affichée (secondes)
            unitSymbol: 'ms',    // Unité interne (millisecondes)
            label: 'Temps',
            scale: 1000,         // Facteur de conversion (interne → affiché)
            isTime: true,
            isMonotone: true
        };
    } else {
        // Axe X = Canal utilisateur
        const colIndex = appState.xAxisChannel - 1;
        const col = appState.availableColumns[colIndex];

        if (!col) {
            console.error(`❌ Canal X invalide: index ${appState.xAxisChannel}`);
            return getXAxisInfo.call({xAxisChannel: 0}); // Fallback sur Temps
        }

        const data = appState.allColumnData[col.index];

        return {
            channelIndex: appState.xAxisChannel,
            dataIndex: col.index,    // Index réel dans allColumnData et channelConfig
            data: data,
            unit: col.unit || '',
            unitSymbol: col.unit || '',
            label: col.label || col.name || `Canal ${appState.xAxisChannel}`,
            scale: 1,            // Pas de conversion (unité native)
            isTime: false,
            isMonotone: null     // À valider
        };
    }
}

/**
 * Mettre à jour les labels des champs Min/Max selon l'axe X
 */
function updateXAxisLabels() {
    const xInfo = getXAxisInfo();

    // Mettre à jour les labels dans index.html
    const minLabel = document.querySelector('label[for="zoom-min"]');
    const maxLabel = document.querySelector('label[for="zoom-max"]');

    if (minLabel) {
        minLabel.innerHTML = `<i class="fas fa-compress-arrows-alt"></i> <span data-i18n="labels.min_x">Min (${xInfo.unit}):</span>`;
    }
    if (maxLabel) {
        maxLabel.innerHTML = `<i class="fas fa-expand-arrows-alt"></i> <span data-i18n="labels.max_x">Max (${xInfo.unit}):</span>`;
    }

    console.log(`📊 Labels axe X mis à jour: ${xInfo.unit}`);
}

/**
 * Valider que le canal X est monotone croissant
 * @param {Array} data - Données du canal X
 * @returns {Object} {valid: boolean, error: string}
 */
function validateXAxisMonotony(data) {
    if (!data || data.length < 2) {
        return { valid: true };
    }

    // Vérifier NaN/Infinity
    for (let i = 0; i < data.length; i++) {
        if (!isFinite(data[i])) {
            return {
                valid: false,
                error: `Le canal X contient des valeurs invalides (NaN/Infinity) à l'indice ${i}`
            };
        }
    }

    // Vérifier monotonie croissante
    let nonMonotoneCount = 0;
    for (let i = 1; i < data.length; i++) {
        if (data[i] < data[i-1]) {
            nonMonotoneCount++;
            if (nonMonotoneCount > 10) break; // Limiter le comptage
        }
    }

    if (nonMonotoneCount > 0) {
        return {
            valid: false,
            error: `Le canal X n'est pas monotone croissant (${nonMonotoneCount}+ inversions détectées)`
        };
    }

    return { valid: true };
}

/**
 * Masquer/afficher les outils selon si l'axe X est temporel
 * Seuls les marqueurs (SnapPoints) restent visibles si X ≠ Temps
 * @param {boolean} isTime - True si l'axe X est le temps
 */
function toggleToolsVisibility(isTime) {
    // Liste des outils à masquer si X ≠ Temps
    const toolsToHide = [
        'cursors-section',       // Curseurs verticaux
        'intervals-section',     // Intervalles
        'measure-section',       // Measure tool
        'ruler-section',         // Ruler tool
        'diff-canal-section',    // Diff canal tool
        'track-section'          // Track tool
    ];

    toolsToHide.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = isTime ? '' : 'none';
        }
    });

    // Afficher un message si des outils sont masqués
    if (!isTime) {
        console.log(`⚠️ Certains outils sont masqués car l'axe X n'est pas temporel`);
    }
}

/**
 * Désactiver la FFT si l'axe X n'est pas le temps
 * @param {boolean} isTime - True si l'axe X est le temps
 */
function toggleFFTVisibility(isTime) {
    const fftSection = document.getElementById('fft-section');
    const spectrogramSection = document.getElementById('spectrogram-section');

    if (fftSection) {
        if (isTime) {
            fftSection.style.display = '';
            fftSection.style.opacity = '1';
        } else {
            fftSection.style.display = 'none';
            console.log(`⚠️ FFT désactivée: nécessite un axe X temporel`);
        }
    }

    if (spectrogramSection) {
        if (isTime) {
            spectrogramSection.style.display = '';
            spectrogramSection.style.opacity = '1';
        } else {
            spectrogramSection.style.display = 'none';
            console.log(`⚠️ Spectrogramme désactivé: nécessite un axe X temporel`);
        }
    }

    // Afficher un avertissement à l'utilisateur
    if (!isTime) {
        setStatus('ℹ️ FFT/Spectrogramme désactivés avec axe X non-temporel', 'info');
    }
}

/**
 * Appliquer le zoom de l'axe X depuis Ymin/Ymax du canal X sélectionné
 * Appelé quand X ≠ Temps
 */
function applyXAxisZoomFromChannel() {
    const xInfo = getXAxisInfo();
    if (xInfo.isTime) return; // Ne rien faire si X = Temps

    const chart = appState.charts.time;
    if (!chart) return;

    // Trouver le canal X dans channelConfig en utilisant le dataIndex
    const xChannelConfig = appState.channelConfig.find(cfg => cfg.index === xInfo.dataIndex);

    if (!xChannelConfig) {
        console.warn(`⚠️ Configuration du canal X (dataIndex ${xInfo.dataIndex}) introuvable`);
        return;
    }

    // Utiliser Ymin/Ymax du canal X pour contrôler l'axe X
    if (xChannelConfig.yMin !== null && xChannelConfig.yMax !== null) {
        chart.options.scales.x.min = xChannelConfig.yMin * xInfo.scale;
        chart.options.scales.x.max = xChannelConfig.yMax * xInfo.scale;
        console.log(`✅ Axe X contrôlé par Ymin/Ymax du canal ${xInfo.label}: ${xChannelConfig.yMin} à ${xChannelConfig.yMax} ${xInfo.unit}`);
    } else {
        // Si Ymin/Ymax ne sont pas définis, utiliser les données complètes
        if (xInfo.data && xInfo.data.length > 0) {
            const dataMin = Math.min(...xInfo.data);
            const dataMax = Math.max(...xInfo.data);
            chart.options.scales.x.min = dataMin;
            chart.options.scales.x.max = dataMax;
            console.log(`📐 Axe X auto (canal ${xInfo.label}): ${(dataMin / xInfo.scale).toFixed(2)} à ${(dataMax / xInfo.scale).toFixed(2)} ${xInfo.unit}`);
        }
    }

    chart.update('none');
}

// Mettre à jour le sélecteur d'axe X
function updateXAxisSelector() {
    const select = document.getElementById('x-axis-channel-select');
    if (!select) return;

    select.innerHTML = '';

    // Option temps (par défaut)
    const timeOption = document.createElement('option');
    timeOption.value = '0';
    timeOption.textContent = 'Temps (ms)';
    select.appendChild(timeOption);

    // Filtrer les canaux valides (exclure fantômes, canaux supprimés et canaux invalides)
    const validColumns = appState.availableColumns.filter(col => {
        // Vérifier que la colonne existe et n'est pas un fantôme
        if (!col || col.isPhantom) return false;

        // Vérifier que les données existent
        if (col.index === undefined || !appState.allColumnData[col.index]) return false;

        // CRITIQUE: Vérifier que le canal existe aussi dans channelConfig
        // Un canal dans availableColumns mais pas dans channelConfig a été supprimé
        const existsInChannelConfig = appState.channelConfig.some(cfg => cfg.index === col.index);
        if (!existsInChannelConfig) {
            console.warn(`⚠️ Canal X orphelin détecté: ${col.label} (index ${col.index}) - existe dans availableColumns mais pas dans channelConfig`);
            return false;
        }

        return true;
    });

    // Dédoublonner par index (clé unique) pour éviter les doublons
    const seenIndices = new Set();
    const uniqueColumns = validColumns.filter(col => {
        if (seenIndices.has(col.index)) {
            console.warn(`⚠️ Canal X doublon détecté: ${col.label} (index ${col.index})`);
            return false;
        }
        seenIndices.add(col.index);
        return true;
    });

    console.log(`📊 Canal X: ${validColumns.length} canaux valides, ${uniqueColumns.length} uniques`);

    // Options pour chaque canal valide et unique
    uniqueColumns.forEach((col) => {
        const option = document.createElement('option');
        // Utiliser l'index dans availableColumns + 1 (car 0 = temps)
        const originalIndex = appState.availableColumns.indexOf(col);
        option.value = (originalIndex + 1).toString();
        // Utiliser channelConfig.label qui reflète les modifications de l'utilisateur (avec unités)
        const channelCfg = appState.channelConfig.find(cfg => cfg.index === col.index);
        option.textContent = channelCfg ? channelCfg.label : col.label;
        select.appendChild(option);
    });

    // Vérifier si le canal X actuel est toujours valide
    if (appState.xAxisChannel > 0) {
        const currentXColumn = appState.availableColumns[appState.xAxisChannel - 1];
        if (!currentXColumn || currentXColumn.isPhantom || !appState.allColumnData[currentXColumn.index]) {
            console.warn(`⚠️ Canal X actuel (${appState.xAxisChannel}) invalide, réinitialisation à Temps`);
            appState.xAxisChannel = 0;
        }
    }

    select.value = appState.xAxisChannel.toString();
    select.onchange = (e) => {
        const newChannelIndex = parseInt(e.target.value);
        appState.xAxisChannel = newChannelIndex;

        // Masquer automatiquement le canal sélectionné comme axe X (s'il n'est pas Temps)
        if (newChannelIndex > 0 && appState.channelConfig) {
            const xCol = appState.availableColumns[newChannelIndex - 1];
            if (xCol) {
                const xChanConfig = appState.channelConfig.find(cfg => cfg.index === xCol.index);
                if (xChanConfig) {
                    xChanConfig.visible = false;
                    xChanConfig.yAxisPosition = 'hidden';
                    console.log(`👁️ Canal X "${xChanConfig.label}" masqué dans l'affichage Y`);
                }
            }
            // Rafraîchir l'interface du configurateur pour refléter le changement
            updateChannelConfigUI();
        }

        // Mettre à jour les labels des champs Min/Max
        updateXAxisLabels();

        // Valider la monotonie du nouveau canal X
        const xInfo = getXAxisInfo();
        const validation = validateXAxisMonotony(xInfo.data);
        if (!validation.valid) {
            console.warn(`⚠️ ${validation.error}`);
            setStatus(`⚠️ ${validation.error}`, 'warning');
        }

        // Gérer la visibilité des outils selon le type d'axe X
        toggleToolsVisibility(xInfo.isTime);

        // Gérer la visibilité de la FFT
        toggleFFTVisibility(xInfo.isTime);

        // Mettre à jour le graphique (appliquera Ymin/Ymax du canal X si nécessaire)
        updateTimeChart();

        console.log(`📊 Canal X changé: ${xInfo.label} (${xInfo.unit})`);
    };

    // Initialiser les labels et visibilité des outils au chargement
    updateXAxisLabels();
    const xInfo = getXAxisInfo();
    toggleToolsVisibility(xInfo.isTime);
    toggleFFTVisibility(xInfo.isTime);
}

// Appliquer la configuration et fermer
function applyChannelConfig() {
    console.log("✅ Configuration des canaux appliquée");

    // IMPORTANT : Sauvegarder la config dans le projet actif
    // MAIS exclure le canal fantôme (sera recréé automatiquement au chargement)
    const project = typeof getActiveProject === 'function' ? getActiveProject() : null;
    if (project && appState.channelConfig) {
        const configToSave = appState.channelConfig.filter(c => !c.isPhantom);
        project.state.channelConfig = JSON.parse(JSON.stringify(configToSave));
        console.log(`💾 Configuration sauvegardée dans le projet : ${project.name} (${configToSave.length} canaux, fantôme exclu)`);

        // Sauvegarder le pas (ms) configuré manuellement
        const manualStepInput = document.getElementById('manual-step-config');
        if (manualStepInput) {
            const stepValue = parseFloat(manualStepInput.value);
            if (stepValue > 0) {
                // CRUCIAL : Recalculer fullDataTime avec le nouveau pas
                // Cela met à jour appState.fs, appState.fullDataTime, appState.timeIncrement
                if (typeof updateFsFromStep === 'function') {
                    updateFsFromStep();
                }

                // Synchroniser les valeurs recalculées dans project.state
                project.state.timeIncrement = appState.timeIncrement;
                project.state.fs = appState.fs;
                project.state.fullDataTime = appState.fullDataTime;

                console.log(`💾 Pas (ms) sauvegardé et recalculé : ${stepValue} ms (${project.state.timeIncrement} s, fs=${project.state.fs.toFixed(1)} Hz)`);
            }
        }
    }

    updateTimeChart();
    closeChannelConfig();
}

// Réinitialiser la configuration par défaut
function resetChannelConfig() {
    if (!confirm(t('dialogs.confirm_reset_channels'))) {
        return;
    }

    // Réinitialiser
    initChannelConfig();
    updateChannelConfigUI();
    updateTimeChart();

    console.log("🔄 Configuration réinitialisée");
}

// Mettre à jour le graphique temporel avec multi-canaux
function updateTimeChartMultiChannel() {
    const chart = appState.charts.time;

    if (!chart || !appState.channelConfig || appState.channelConfig.length === 0) {
        console.log("⚠️ Pas de configuration multi-canaux, utilisation du mode simple");
        return false; // Retourner false pour utiliser le mode simple
    }

    console.log("🎨 Mise à jour du graphique en mode multi-canaux");

    // Obtenir les canaux visibles
    const visibleChannels = appState.channelConfig.filter(config => config.visible);

    if (visibleChannels.length === 0) {
        console.log("⚠️ Aucun canal visible - effacement du graphique");
        // Effacer complètement le graphique
        chart.data.labels = [];
        chart.data.datasets = [];

        // CRITIQUE: Même sans canaux visibles, créer l'échelle yPhantom
        // pour que les annotations flottantes restent affichées
        const phantomChannel = appState.channelConfig.find(c => c.isPhantom);
        if (phantomChannel) {
            // Supprimer les anciennes échelles
            const oldScales = Object.keys(chart.options.scales).filter(key => key !== 'x');
            oldScales.forEach(key => {
                delete chart.options.scales[key];
            });

            // Créer SEULEMENT l'échelle yPhantom
            chart.options.scales.yPhantom = {
                type: 'linear',
                position: 'hidden',
                display: false,
                min: phantomChannel.yMin !== null ? phantomChannel.yMin : 0,
                max: phantomChannel.yMax !== null ? phantomChannel.yMax : 1000,
                grid: {
                    display: false
                }
            };
            console.log("👻 Échelle yPhantom créée (aucun canal visible, annotations flottantes seulement)");
        }

        chart.update('none');
        return true; // Retourner true car on a bien géré le cas multi-canaux
    }

    // Déterminer les données de l'axe X
    const xInfo = getXAxisInfo();
    let xData;
    if (appState.xAxisChannel === 0) {
        // Utiliser le temps
        xData = appState.fullDataTime;
    } else {
        // Utiliser un autre canal
        const xChannelIndex = appState.availableColumns[appState.xAxisChannel - 1].index;
        xData = appState.allColumnData[xChannelIndex];
    }

    // ========================================
    // FILTRAGE TEMPOREL UNIVERSEL
    // ========================================
    // Min(s)/Max(s) filtrent TOUJOURS temporellement, peu importe le canal X

    let visibleStartIndex = 0;
    let visibleEndIndex = xData.length - 1;
    let visibleXData;

    // Récupérer les valeurs Min(s)/Max(s)
    const zoomMinInput = document.getElementById('zoom-min');
    const zoomMaxInput = document.getElementById('zoom-max');

    if (zoomMinInput && zoomMaxInput) {
        const tMin = parseFloat(zoomMinInput.value);
        const tMax = parseFloat(zoomMaxInput.value);

        if (!isNaN(tMin) && !isNaN(tMax)) {
            const timeData = appState.fullDataTime;
            const tMinMs = tMin * 1000; // Convertir en ms
            const tMaxMs = tMax * 1000;

            // Trouver les indices temporels dans fullDataTime
            visibleStartIndex = timeData.findIndex(t => t >= tMinMs);
            visibleEndIndex = timeData.findIndex(t => t > tMaxMs);

            if (visibleStartIndex === -1) visibleStartIndex = 0;
            if (visibleEndIndex === -1) visibleEndIndex = timeData.length - 1;

            console.log(`⏱️ Filtrage temporel: ${tMin}s à ${tMax}s (indices ${visibleStartIndex} à ${visibleEndIndex}, ${visibleEndIndex - visibleStartIndex + 1} points)`);
        }
    }

    // Extraire la plage temporellement filtrée
    visibleXData = xData.slice(visibleStartIndex, visibleEndIndex + 1);

    // ========================================
    // ZOOM SPATIAL (seulement si X ≠ Temps)
    // ========================================

    if (!xInfo.isTime) {
        // X ≠ Temps: appliquer aussi le zoom spatial via Ymin/Ymax du canal X
        const xMin = chart.options.scales.x.min;
        const xMax = chart.options.scales.x.max;

        if (xMin !== undefined && xMax !== undefined && xMin !== null && xMax !== null) {
            // Trouver les indices dans la plage déjà filtrée temporellement
            const spatialStartIndex = visibleXData.findIndex(x => x >= xMin);
            const spatialEndIndex = visibleXData.findIndex(x => x > xMax);

            let finalStartIndex = spatialStartIndex !== -1 ? spatialStartIndex : 0;
            let finalEndIndex = spatialEndIndex !== -1 ? spatialEndIndex : visibleXData.length - 1;

            // Ajuster les indices globaux
            visibleStartIndex += finalStartIndex;
            visibleEndIndex = visibleStartIndex + (finalEndIndex - finalStartIndex);

            // Re-extraire avec les indices finaux
            visibleXData = xData.slice(visibleStartIndex, visibleEndIndex + 1);

            console.log(`🔍 Zoom spatial X: ${(xMin / xInfo.scale).toFixed(2)} à ${(xMax / xInfo.scale).toFixed(2)} ${xInfo.unit}`);
            console.log(`📊 Plage finale: indices ${visibleStartIndex} à ${visibleEndIndex} (${visibleXData.length} points)`);
        } else {
            console.log(`📊 Pas de zoom spatial: ${visibleXData.length} points`);
        }
    } else {
        // X = Temps: pas de zoom spatial supplémentaire
        console.log(`📊 X=Temps: ${visibleXData.length} points après filtrage temporel`);
    }

    // Calculer le downsampling sur la PLAGE VISIBLE uniquement
    let downsampleStep = 1;
    const maxDisplayPoints = 15000;

    if (visibleXData.length > maxDisplayPoints) {
        downsampleStep = Math.ceil(visibleXData.length / maxDisplayPoints);
        console.log(`⚡ Downsampling: 1 point sur ${downsampleStep} (${visibleXData.length} → ${Math.ceil(visibleXData.length / downsampleStep)} points)`);
    } else {
        console.log(`✅ Pas de downsampling nécessaire (${visibleXData.length} points < ${maxDisplayPoints})`);
    }

    const downsampledX = downsampleStep > 1
        ? visibleXData.filter((_, i) => i % downsampleStep === 0)
        : Array.from(visibleXData);

    // Créer les datasets pour chaque canal visible
    chart.data.labels = downsampledX;
    chart.data.datasets = visibleChannels.map(config => {
        const fullChannelData = appState.allColumnData[config.index];

        // Extraire la même plage visible pour les données Y
        const visibleChannelData = fullChannelData.slice(visibleStartIndex, visibleEndIndex + 1);

        // Appliquer le downsampling
        const downsampledY = downsampleStep > 1
            ? visibleChannelData.filter((_, i) => i % downsampleStep === 0)
            : Array.from(visibleChannelData);

        return {
            label: config.label,
            data: downsampledY,
            borderColor: config.color,
            backgroundColor: config.color + '20',
            borderWidth: config.lineWidth,
            pointRadius: 0,
            fill: false,
            yAxisID: config.yAxisID
        };
    });

    // ========================================
    // AJUSTEMENT DE L'AXE X
    // ========================================

    if (xInfo.isTime) {
        // X = Temps: ajuster l'axe X pour afficher la plage filtrée
        if (visibleXData.length > 0) {
            chart.options.scales.x.min = visibleXData[0];
            chart.options.scales.x.max = visibleXData[visibleXData.length - 1];
            console.log(`✅ Axe X ajusté (temps): ${(visibleXData[0] / 1000).toFixed(3)}s à ${(visibleXData[visibleXData.length - 1] / 1000).toFixed(3)}s`);
        }
    } else {
        // X ≠ Temps: l'axe X est contrôlé par Ymin/Ymax du canal X
        const xChannelConfig = appState.channelConfig.find(cfg => cfg.index === xInfo.dataIndex);

        console.log(`🔍 Recherche config pour canal X: dataIndex=${xInfo.dataIndex}, trouvé=`, xChannelConfig);

        if (xChannelConfig && xChannelConfig.yMin !== null && xChannelConfig.yMax !== null) {
            // Utiliser Ymin/Ymax du canal X pour l'axe X
            chart.options.scales.x.min = xChannelConfig.yMin * xInfo.scale;
            chart.options.scales.x.max = xChannelConfig.yMax * xInfo.scale;
            console.log(`✅ Axe X contrôlé par Ymin/Ymax du canal ${xInfo.label}: ${xChannelConfig.yMin} à ${xChannelConfig.yMax} ${xInfo.unit}`);
        } else {
            // Si Ymin/Ymax ne sont pas définis, utiliser les données filtrées
            if (visibleXData.length > 0) {
                chart.options.scales.x.min = Math.min(...visibleXData);
                chart.options.scales.x.max = Math.max(...visibleXData);
                console.log(`📐 Axe X auto (canal ${xInfo.label}): ${(Math.min(...visibleXData) / xInfo.scale).toFixed(2)} à ${(Math.max(...visibleXData) / xInfo.scale).toFixed(2)} ${xInfo.unit}`);
            }
        }
    }

    // Label de l'axe X
    if (appState.xAxisChannel === 0) {
        chart.options.scales.x.title.text = 'Temps (ms)';
    } else {
        const xChannelConfig = appState.availableColumns[appState.xAxisChannel - 1];
        chart.options.scales.x.title.text = xChannelConfig.label + (xChannelConfig.unit ? ` (${xChannelConfig.unit})` : '');
    }

    // 💾 SAUVEGARDER LES ZOOMS Y ACTUELS AVANT DE SUPPRIMER LES ÉCHELLES
    const savedYZooms = {};
    Object.keys(chart.options.scales).forEach(key => {
        if (key !== 'x' && chart.options.scales[key]) {
            savedYZooms[key] = {
                min: chart.options.scales[key].min,
                max: chart.options.scales[key].max
            };
        }
    });
    console.log("💾 Zooms Y sauvegardés:", savedYZooms);

    // Supprimer les anciennes échelles Y
    const oldScales = Object.keys(chart.options.scales).filter(key => key !== 'x');
    oldScales.forEach(key => {
        delete chart.options.scales[key];
    });

    // Créer les échelles Y pour chaque canal visible
    visibleChannels.forEach((config, index) => {
        const channelData = appState.allColumnData[config.index];

        // Calculer min/max
        let yMin, yMax;

        // ✅ PRIORITÉ 1: Valeurs définies par l'utilisateur (config modal)
        if (config.yMin !== null && config.yMax !== null) {
            yMin = config.yMin;
            yMax = config.yMax;
            console.log(`✅ Utilisation valeurs config pour ${config.yAxisID}:`, {yMin, yMax});
        }
        // ✅ PRIORITÉ 2: Zoom sauvegardé (changement visibilité canal)
        else if (savedYZooms[config.yAxisID]) {
            yMin = savedYZooms[config.yAxisID].min;
            yMax = savedYZooms[config.yAxisID].max;
            console.log(`🔓 Zoom Y restauré pour ${config.yAxisID}:`, {yMin, yMax});
        }
        // ✅ PRIORITÉ 3: Calcul automatique
        else {
            const dataMin = Math.min(...channelData);
            const dataMax = Math.max(...channelData);
            const range = dataMax - dataMin;
            yMin = dataMin - range * 0.1;
            yMax = dataMax + range * 0.1;
            console.log(`📐 Calcul auto pour ${config.yAxisID}:`, {yMin, yMax});
        }

        // Créer l'échelle Y
        chart.options.scales[config.yAxisID] = {
            type: 'linear',
            position: config.yAxisPosition,
            display: config.yAxisPosition !== 'hidden',
            min: yMin,
            max: yMax,
            grid: {
                color: '#333',
                drawOnChartArea: config.yAxisPosition === 'left' // Seulement la première échelle affiche la grille
            },
            ticks: {
                color: config.color,
                font: {
                    size: window.chartFontSize,
                    weight: 'normal'
                }
            },
            title: {
                display: true,
                text: config.label + (config.unit ? ` (${config.unit})` : ''),
                color: config.color,
                font: {
                    size: window.chartFontSize,
                    weight: 'normal'
                },
                rotation: (() => {
                    const rot = -270;  // -270° pour lire de bas en haut (tous les axes)
                    console.log(`[Multi-Channel] Axe Y "${config.label}" - Position: ${config.yAxisPosition} - Rotation: ${rot}°`);
                    return rot;
                })()
            }
        };
    });

    // IMPORTANT: Créer une échelle 'y' pour compatibilité avec curseurs et annotations
    // Cette échelle est un alias de la première échelle visible
    if (visibleChannels.length > 0) {
        const firstChannel = visibleChannels[0];
        const firstChannelData = appState.allColumnData[firstChannel.index];

        // Calculer min/max pour la première échelle
        let yMin, yMax;
        if (firstChannel.yMin !== null && firstChannel.yMax !== null) {
            yMin = firstChannel.yMin;
            yMax = firstChannel.yMax;
        } else {
            const dataMin = Math.min(...firstChannelData);
            const dataMax = Math.max(...firstChannelData);
            const range = dataMax - dataMin;
            yMin = firstChannel.yMin !== null ? firstChannel.yMin : dataMin - range * 0.1;
            yMax = firstChannel.yMax !== null ? firstChannel.yMax : dataMax + range * 0.1;
        }

        // Créer l'échelle 'y' pour compatibilité
        chart.options.scales.y = {
            type: 'linear',
            position: 'left',
            display: false, // Cachée car on affiche déjà y0
            min: yMin,
            max: yMax
        };
    }

    // CRITIQUE: Créer l'échelle yPhantom pour les annotations flottantes
    // Cette échelle doit TOUJOURS exister, même si le canal fantôme est invisible
    const phantomChannel = appState.channelConfig.find(c => c.isPhantom);
    if (phantomChannel) {
        chart.options.scales.yPhantom = {
            type: 'linear',
            position: 'hidden',  // Complètement cachée
            display: false,      // Pas affichée
            min: phantomChannel.yMin !== null ? phantomChannel.yMin : 0,
            max: phantomChannel.yMax !== null ? phantomChannel.yMax : 1000,
            grid: {
                display: false
            }
        };
        console.log("👻 Échelle yPhantom créée pour annotations flottantes (0 à 1000)");
    }

    chart.update();

    // Mettre à jour les annotations
    if (typeof updateAnnotationsDisplay === 'function') {
        setTimeout(updateAnnotationsDisplay, 50);
    }

    return true; // Mode multi-canaux activé
}

// =====================================
// GESTION DES PRESETS GLOBAUX
// =====================================

// Initialiser les écouteurs d'événements pour les presets globaux
function initPresetListeners() {
    for (let i = 1; i <= 5; i++) {
        const yMinInput = document.getElementById(`preset${i}-ymin`);
        const yMaxInput = document.getElementById(`preset${i}-ymax`);

        if (yMinInput && yMaxInput) {
            // Éviter d'ajouter plusieurs fois les mêmes écouteurs
            // Utiliser une IIFE pour capturer correctement la valeur de i
            yMinInput.onchange = ((presetNum) => {
                return () => updateChannelsWithPreset(presetNum);
            })(i);
            yMaxInput.onchange = ((presetNum) => {
                return () => updateChannelsWithPreset(presetNum);
            })(i);
        }
    }
}

// Mettre à jour tous les canaux qui utilisent un preset donné
function updateChannelsWithPreset(presetNum) {
    const newYMin = parseFloat(document.getElementById(`preset${presetNum}-ymin`).value);
    const newYMax = parseFloat(document.getElementById(`preset${presetNum}-ymax`).value);

    // Parcourir tous les canaux et mettre à jour ceux qui utilisent ce preset
    appState.channelConfig.forEach((config, globalIndex) => {
        // Ignorer les canaux fantômes (pas dans le tableau UI)
        if (config.isPhantom) return;

        // Trouver la ligne correspondante via data-global-index
        const table = document.getElementById('channel-config-tbody');
        if (table) {
            const row = Array.from(table.rows).find(r => r.getAttribute('data-global-index') === globalIndex.toString());
            if (row) {
                // Il y a 1 select par ligne: le Preset
                const selects = row.querySelectorAll('select');
                const presetSelect = selects[0]; // Le premier (et seul) select est celui du preset

                if (presetSelect && presetSelect.value === presetNum.toString()) {
                    // Ce canal utilise ce preset, mettre à jour ses valeurs
                    config.yMin = newYMin;
                    config.yMax = newYMax;

                    // Mettre à jour les champs d'entrée visuellement
                    const yMinInput = row.querySelectorAll('input[type="number"]')[0];
                    const yMaxInput = row.querySelectorAll('input[type="number"]')[1];
                    if (yMinInput) yMinInput.value = newYMin;
                    if (yMaxInput) yMaxInput.value = newYMax;
                }
            }
        }
    });

    // Mettre à jour le graphique
    updateTimeChart();
}

// Auto-preset intelligent des échelles Y selon les unités
function autoPresetYScales() {
    console.log("🎯 Auto-Preset: Analyse des canaux...");

    // Fonction pour extraire l'unité du label (ex: "Pression (bar)" -> "bar")
    function extractUnit(label) {
        const match = label.match(/\(([^)]+)\)/);
        return match ? match[1] : '';
    }

    // Définir les seuils pour les canaux en "bar"
    const barThresholds = [40, 60, 100, 160, 250, 400, 600];

    // Définir les seuils pour les canaux en "mA"
    const maThresholds = [1000, 1500, 2000, 2500];

    // Définir les seuils génériques pour les canaux sans unité spécifique
    const defaultThresholds = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

    // Fonction pour trouver le Ymax approprié selon les seuils
    function findAppropriateYMax(maxValue, thresholds) {
        for (let threshold of thresholds) {
            if (maxValue <= threshold) {
                return threshold;
            }
        }
        // Si au-delà du dernier seuil, retourner le dernier
        return thresholds[thresholds.length - 1];
    }

    // Grouper les canaux par unité
    const barChannels = [];
    const maChannels = [];
    const otherChannels = [];

    console.log(`🔍 Nombre total de canaux: ${appState.channelConfig.length}`);

    appState.channelConfig.forEach((config, globalIndex) => {
        // Ignorer les canaux fantômes (pas dans le tableau UI)
        if (config.isPhantom) {
            console.log(`\n👻 Canal ${globalIndex}: Fantôme ignoré`);
            return;
        }

        console.log(`\n🔎 Canal ${globalIndex}: ${config.name || config.label}`);
        console.log(`  Label: "${config.label}"`);

        // Trouver la ligne correspondante via data-global-index
        const table = document.getElementById('channel-config-tbody');
        if (!table) {
            console.log(`  ❌ Table non trouvée`);
            return;
        }

        const row = Array.from(table.rows).find(r => r.getAttribute('data-global-index') === globalIndex.toString());
        if (!row) {
            console.log(`  ❌ Ligne non trouvée pour globalIndex ${globalIndex}`);
            return;
        }

        const visibleCheckbox = row.querySelector('input[type="checkbox"]');
        const presetSelect = row.querySelector('select');

        console.log(`  Checkbox trouvée: ${!!visibleCheckbox}, Checked: ${visibleCheckbox?.checked}`);
        console.log(`  Select trouvé: ${!!presetSelect}, Valeur: "${presetSelect?.value}"`);

        const isVisible = visibleCheckbox && visibleCheckbox.checked;
        const hasNoPreset = presetSelect && (presetSelect.value === '--' || presetSelect.value === '');

        console.log(`  isVisible: ${isVisible}, hasNoPreset: ${hasNoPreset}`);

        if (isVisible && hasNoPreset) {
            // Extraire l'unité du label (entre parenthèses)
            const unit = extractUnit(config.label || config.name || '');
            console.log(`  ✅ Canal éligible! Unité extraite = "${unit}"`);

            if (unit === 'bar') {
                barChannels.push({ config, globalIndex });
                console.log(`  📊 Ajouté aux canaux bar`);
            } else if (unit === 'mA') {
                maChannels.push({ config, globalIndex });
                console.log(`  📊 Ajouté aux canaux mA`);
            } else {
                // Ajouter aux canaux génériques (sans unité spécifique)
                otherChannels.push({ config, globalIndex });
                console.log(`  📊 Ajouté aux canaux sans unité spécifique (sera traité avec seuils par défaut)`);
            }
        } else {
            console.log(`  ❌ Canal non éligible (visible=${isVisible}, noPreset=${hasNoPreset})`);
        }
    });

    console.log(`📊 Canaux bar trouvés: ${barChannels.length}`);
    console.log(`📊 Canaux mA trouvés: ${maChannels.length}`);
    console.log(`📊 Canaux sans unité spécifique trouvés: ${otherChannels.length}`);

    // Traiter les canaux "bar"
    if (barChannels.length > 0) {
        // Trouver la valeur max parmi tous les canaux bar
        let maxBarValue = 0;
        barChannels.forEach(({ config }) => {
            const data = appState.allColumnData[config.index];
            if (data && data.length > 0) {
                const channelMax = Math.max(...data);
                if (channelMax > maxBarValue) {
                    maxBarValue = channelMax;
                }
            }
        });

        const yMax = findAppropriateYMax(maxBarValue, barThresholds);
        console.log(`✅ Canaux bar: Max mesuré = ${maxBarValue.toFixed(2)}, Ymax appliqué = ${yMax}`);

        // Appliquer Ymin=0 et Ymax à tous les canaux bar
        barChannels.forEach(({ config, globalIndex }) => {
            config.yMin = 0;
            config.yMax = yMax;

            // Mettre à jour l'interface
            const table = document.getElementById('channel-config-tbody');
            if (table) {
                const row = Array.from(table.rows).find(r => r.getAttribute('data-global-index') === globalIndex.toString());
                if (row) {
                    const yMinInput = row.querySelectorAll('input[type="number"]')[0];
                    const yMaxInput = row.querySelectorAll('input[type="number"]')[1];
                    if (yMinInput) yMinInput.value = 0;
                    if (yMaxInput) yMaxInput.value = yMax;
                }
            }
        });
    }

    // Traiter les canaux "mA"
    if (maChannels.length > 0) {
        // Trouver la valeur max parmi tous les canaux mA
        let maxMaValue = 0;
        maChannels.forEach(({ config }) => {
            const data = appState.allColumnData[config.index];
            if (data && data.length > 0) {
                const channelMax = Math.max(...data);
                if (channelMax > maxMaValue) {
                    maxMaValue = channelMax;
                }
            }
        });

        const yMax = findAppropriateYMax(maxMaValue, maThresholds);
        console.log(`✅ Canaux mA: Max mesuré = ${maxMaValue.toFixed(2)}, Ymax appliqué = ${yMax}`);

        // Appliquer Ymin=0 et Ymax à tous les canaux mA
        maChannels.forEach(({ config, globalIndex }) => {
            config.yMin = 0;
            config.yMax = yMax;

            // Mettre à jour l'interface
            const table = document.getElementById('channel-config-tbody');
            if (table) {
                const row = Array.from(table.rows).find(r => r.getAttribute('data-global-index') === globalIndex.toString());
                if (row) {
                    const yMinInput = row.querySelectorAll('input[type="number"]')[0];
                    const yMaxInput = row.querySelectorAll('input[type="number"]')[1];
                    if (yMinInput) yMinInput.value = 0;
                    if (yMaxInput) yMaxInput.value = yMax;
                }
            }
        });
    }

    // Traiter les canaux sans unité spécifique
    if (otherChannels.length > 0) {
        // Trouver la valeur max parmi tous les canaux sans unité
        let maxOtherValue = 0;
        otherChannels.forEach(({ config }) => {
            const data = appState.allColumnData[config.index];
            if (data && data.length > 0) {
                const channelMax = Math.max(...data);
                if (channelMax > maxOtherValue) {
                    maxOtherValue = channelMax;
                }
            }
        });

        const yMax = findAppropriateYMax(maxOtherValue, defaultThresholds);
        console.log(`✅ Canaux sans unité: Max mesuré = ${maxOtherValue.toFixed(2)}, Ymax appliqué = ${yMax}`);

        // Appliquer Ymin=0 et Ymax à tous les canaux sans unité
        otherChannels.forEach(({ config, globalIndex }) => {
            config.yMin = 0;
            config.yMax = yMax;

            // Mettre à jour l'interface
            const table = document.getElementById('channel-config-tbody');
            if (table) {
                const row = Array.from(table.rows).find(r => r.getAttribute('data-global-index') === globalIndex.toString());
                if (row) {
                    const yMinInput = row.querySelectorAll('input[type="number"]')[0];
                    const yMaxInput = row.querySelectorAll('input[type="number"]')[1];
                    if (yMinInput) yMinInput.value = 0;
                    if (yMaxInput) yMaxInput.value = yMax;
                }
            }
        });
    }

    // Mettre à jour le graphique
    const totalChannels = barChannels.length + maChannels.length + otherChannels.length;
    if (totalChannels > 0) {
        updateTimeChart();
        const statusParts = [];
        if (barChannels.length > 0) statusParts.push(`${barChannels.length} bar`);
        if (maChannels.length > 0) statusParts.push(`${maChannels.length} mA`);
        if (otherChannels.length > 0) statusParts.push(`${otherChannels.length} sans unité`);
        setStatus(`✅ Auto-Preset appliqué : ${statusParts.join(', ')}`);
    } else {
        setStatus('ℹ️ Auto-Preset : Aucun canal éligible (vérifiez que les canaux sont visibles et sans preset)', 'warning');
    }
}

// Reset zoom complet : dézoomer X au maximum + Auto Groupé sur Y
function resetZoomAndAutoGroup() {
    console.log("🔄 Reset zoom complet : X + Auto Groupé");

    // Obtenir les infos du canal X actuel
    const xInfo = getXAxisInfo();

    // 1. Réinitialiser les champs Min(s)/Max(s) avec les données TEMPORELLES
    const zoomMinInput = document.getElementById('zoom-min');
    const zoomMaxInput = document.getElementById('zoom-max');
    if (zoomMinInput && zoomMaxInput && appState.fullDataTime && appState.fullDataTime.length) {
        const timeData = appState.fullDataTime;
        zoomMinInput.value = (timeData[0] / 1000).toFixed(3); // Convertir ms → s
        zoomMaxInput.value = (timeData[timeData.length - 1] / 1000).toFixed(3);
        console.log(`🔍 Filtrage temporel réinitialisé: ${zoomMinInput.value}s à ${zoomMaxInput.value}s`);
    }

    // 2. Si X ≠ Temps, réinitialiser aussi Ymin/Ymax du canal X
    if (!xInfo.isTime) {
        const xChannelConfig = appState.channelConfig.find(cfg => cfg.index === xInfo.dataIndex);
        if (xChannelConfig) {
            // Réinitialiser à null pour mode auto
            xChannelConfig.yMin = null;
            xChannelConfig.yMax = null;
            console.log(`🔍 Ymin/Ymax du canal ${xInfo.label} réinitialisés (auto)`);
        }
    }

    // 3. Appliquer Auto Groupé sur les axes Y (cela appellera updateTimeChart qui utilisera les valeurs des inputs)
    autoPresetYScales();
}

// Auto-preset intelligent par CANAL (applique individuellement à chaque canal)
function autoPresetYScalesPerChannel() {
    console.log("🎯 Auto-Preset Canal: Analyse par canal individuel...");

    // Fonction pour extraire l'unité du label (ex: "Pression (bar)" -> "bar")
    function extractUnit(label) {
        const match = label.match(/\(([^)]+)\)/);
        return match ? match[1] : '';
    }

    // Définir les seuils pour les canaux en "bar"
    const barThresholds = [40, 60, 100, 160, 250, 400, 600];

    // Définir les seuils pour les canaux en "mA"
    const maThresholds = [1000, 1500, 2000, 2500];

    // Définir les seuils génériques pour les canaux sans unité spécifique
    const defaultThresholds = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

    // Fonction pour trouver le Ymax approprié selon les seuils
    function findAppropriateYMax(maxValue, thresholds) {
        for (let threshold of thresholds) {
            if (maxValue <= threshold) {
                return threshold;
            }
        }
        // Si au-delà du dernier seuil, retourner le dernier
        return thresholds[thresholds.length - 1];
    }

    let barCount = 0;
    let maCount = 0;
    let otherCount = 0;

    console.log(`🔍 Nombre total de canaux: ${appState.channelConfig.length}`);

    appState.channelConfig.forEach((config, globalIndex) => {
        // Ignorer les canaux fantômes (pas dans le tableau UI)
        if (config.isPhantom) {
            console.log(`\n👻 Canal ${globalIndex}: Fantôme ignoré`);
            return;
        }

        console.log(`\n🔎 Canal ${globalIndex}: ${config.name || config.label}`);
        console.log(`  Label: "${config.label}"`);

        // Trouver la ligne correspondante via data-global-index
        const table = document.getElementById('channel-config-tbody');
        if (!table) {
            console.log(`  ❌ Table non trouvée`);
            return;
        }

        const row = Array.from(table.rows).find(r => r.getAttribute('data-global-index') === globalIndex.toString());
        if (!row) {
            console.log(`  ❌ Ligne non trouvée pour globalIndex ${globalIndex}`);
            return;
        }

        const visibleCheckbox = row.querySelector('input[type="checkbox"]');
        const presetSelect = row.querySelector('select');

        console.log(`  Checkbox trouvée: ${!!visibleCheckbox}, Checked: ${visibleCheckbox?.checked}`);
        console.log(`  Select trouvé: ${!!presetSelect}, Valeur: "${presetSelect?.value}"`);

        const isVisible = visibleCheckbox && visibleCheckbox.checked;
        const hasNoPreset = presetSelect && (presetSelect.value === '--' || presetSelect.value === '');

        console.log(`  isVisible: ${isVisible}, hasNoPreset: ${hasNoPreset}`);

        if (isVisible && hasNoPreset) {
            // Extraire l'unité du label
            const unit = extractUnit(config.label || config.name || '');
            console.log(`  ✅ Canal éligible! Unité extraite = "${unit}"`);

            // Trouver la valeur max pour CE canal spécifique
            const data = appState.allColumnData[config.index];
            console.log(`  Données du canal: ${data ? data.length + ' points' : 'AUCUNE'}`);

            if (data && data.length > 0) {
                const channelMax = Math.max(...data);

                // Déterminer les seuils à utiliser selon l'unité
                let thresholds;
                if (unit === 'bar') {
                    thresholds = barThresholds;
                } else if (unit === 'mA') {
                    thresholds = maThresholds;
                } else {
                    thresholds = defaultThresholds;
                }

                const yMax = findAppropriateYMax(channelMax, thresholds);

                console.log(`  📊 Canal ${config.name}: unité=${unit || 'aucune'}, max=${channelMax.toFixed(2)}, Ymax appliqué=${yMax}`);

                // Appliquer Ymin=0 et Ymax à CE canal
                config.yMin = 0;
                config.yMax = yMax;

                // Mettre à jour l'interface
                const yMinInput = row.querySelectorAll('input[type="number"]')[0];
                const yMaxInput = row.querySelectorAll('input[type="number"]')[1];
                if (yMinInput) yMinInput.value = 0;
                if (yMaxInput) yMaxInput.value = yMax;

                // Compter les canaux traités
                if (unit === 'bar') barCount++;
                else if (unit === 'mA') maCount++;
                else otherCount++;

                console.log(`  ✅ Appliqué: yMin=0, yMax=${yMax}`);
            } else {
                console.log(`  ⚠️ Pas de données pour ce canal`);
            }
        } else {
            console.log(`  ❌ Canal non éligible (visible=${isVisible}, noPreset=${hasNoPreset})`);
        }
    });

    console.log(`\n📊 Résumé: ${barCount} canaux bar, ${maCount} canaux mA, ${otherCount} canaux sans unité traités`);

    // Mettre à jour le graphique
    const totalCount = barCount + maCount + otherCount;
    if (totalCount > 0) {
        console.log(`🔄 Mise à jour du graphique...`);
        updateTimeChart();
        const statusParts = [];
        if (barCount > 0) statusParts.push(`${barCount} bar`);
        if (maCount > 0) statusParts.push(`${maCount} mA`);
        if (otherCount > 0) statusParts.push(`${otherCount} sans unité`);
        setStatus(`✅ Auto-Preset Canal appliqué : ${statusParts.join(', ')} (individuellement)`);
    } else {
        console.log(`⚠️ Aucun canal éligible trouvé`);
        setStatus('ℹ️ Auto-Preset Canal : Aucun canal éligible', 'warning');
    }
}

// =====================================
// DRAG AND DROP DE LA MODALE
// =====================================

function setupModalDrag() {
    const modalContent = document.getElementById('channel-config-modal-content');
    const header = document.getElementById('channel-config-modal-header');

    if (!modalContent || !header) {
        console.warn("⚠️ Éléments de drag and drop non trouvés");
        return;
    }

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Centrer la modale au premier affichage si pas encore positionnée
    if (!modalContent.style.left || modalContent.style.left === '0px') {
        // Attendre que la modale soit rendue pour obtenir les bonnes dimensions
        setTimeout(() => {
            const rect = modalContent.getBoundingClientRect();
            xOffset = (window.innerWidth - rect.width) / 2;
            yOffset = Math.max(50, (window.innerHeight - rect.height) / 2);
            modalContent.style.left = xOffset + 'px';
            modalContent.style.top = yOffset + 'px';
        }, 10);
    } else {
        // Récupérer la position actuelle
        xOffset = parseInt(modalContent.style.left) || 0;
        yOffset = parseInt(modalContent.style.top) || 0;
    }

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            // Limiter le déplacement pour garder la modale visible
            const maxX = window.innerWidth - 100; // Au moins 100px visible
            const maxY = window.innerHeight - 50; // Au moins 50px visible
            const minY = -50; // Permettre de monter jusqu'à -50px (garder le header visible)

            if (currentX < -modalContent.offsetWidth + 100) currentX = -modalContent.offsetWidth + 100;
            if (currentX > maxX) currentX = maxX;
            if (currentY < minY) currentY = minY;
            if (currentY > maxY) currentY = maxY;

            setTranslate(currentX, currentY, modalContent);
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.left = xPos + 'px';
        el.style.top = yPos + 'px';
    }
}

// =====================================
// PARAMÈTRES GLOBAUX
// =====================================

// Mettre à jour l'épaisseur de trait pour toutes les courbes
function updateGlobalLineWidth() {
    const lineWidth = parseFloat(document.getElementById('global-line-width').value) || 0.5;

    // Appliquer à tous les canaux (sauf fantômes)
    appState.channelConfig.forEach(config => {
        if (!config.isPhantom) {
            config.lineWidth = lineWidth;
        }
    });

    // Mettre à jour le graphique temporel
    updateTimeChart();

    // Mettre à jour le graphique FFT
    performAnalysis();

    console.log(`✅ Épaisseur de trait globale mise à jour: ${lineWidth}`);
}

// =====================================
// GESTION DES ONGLETS
// =====================================

// Changer d'onglet dans le configurateur
function switchConfigTab(tabName) {
    console.log(`🔄 Changement d'onglet vers: ${tabName}`);

    // Masquer tous les contenus d'onglets
    const allTabs = document.querySelectorAll('.config-tab-content');
    allTabs.forEach(tab => {
        tab.style.display = 'none';
    });

    // Retirer la classe active de tous les boutons
    const allButtons = document.querySelectorAll('.config-tab-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Afficher l'onglet sélectionné
    const selectedTab = document.getElementById('tab-content-' + tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    } else {
        console.error(`❌ Onglet non trouvé: ${tabName}`);
    }

    // Activer le bouton correspondant
    const selectedButton = document.getElementById('tab-btn-' + tabName);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    console.log(`✅ Onglet ${tabName} activé`);
}

// Synchroniser les champs min(s) et max(s) avec les valeurs actuelles de l'axe X
function syncZoomInputsWithChart() {
    const chart = appState.charts?.time;
    if (!chart || !chart.scales || !chart.scales.x) {
        console.warn('⚠️ Graphique ou échelle X non disponible');
        return;
    }

    const xInfo = getXAxisInfo();
    const xScale = chart.scales.x;
    const minInternal = xScale.min;
    const maxInternal = xScale.max;

    if (xInfo.isTime) {
        // X = Temps: synchroniser Min(s)/Max(s) avec l'axe X
        const zoomMinInput = document.getElementById('zoom-min');
        const zoomMaxInput = document.getElementById('zoom-max');

        if (zoomMinInput && zoomMaxInput) {
            zoomMinInput.value = (minInternal / xInfo.scale).toFixed(3);
            zoomMaxInput.value = (maxInternal / xInfo.scale).toFixed(3);
            console.log(`✅ Min(s)/Max(s) synchronisés avec axe X: ${zoomMinInput.value}s - ${zoomMaxInput.value}s`);
        }
    } else {
        // X ≠ Temps: synchroniser Ymin/Ymax du canal X avec l'axe X
        const xChannelConfig = appState.channelConfig.find(cfg => cfg.index === xInfo.dataIndex);

        if (xChannelConfig) {
            const minValue = minInternal / xInfo.scale;
            const maxValue = maxInternal / xInfo.scale;

            // Mettre à jour la config
            xChannelConfig.yMin = minValue;
            xChannelConfig.yMax = maxValue;

            // Mettre à jour les champs d'entrée visuellement
            const table = document.getElementById('channel-config-tbody');
            if (table) {
                const globalIndex = appState.channelConfig.indexOf(xChannelConfig);
                const row = Array.from(table.rows).find(r => r.getAttribute('data-global-index') === globalIndex.toString());
                if (row) {
                    const yMinInput = row.querySelectorAll('input[type="number"]')[0];
                    const yMaxInput = row.querySelectorAll('input[type="number"]')[1];
                    if (yMinInput) yMinInput.value = minValue.toFixed(1);
                    if (yMaxInput) yMaxInput.value = maxValue.toFixed(1);
                }
            }

            console.log(`✅ Ymin/Ymax du canal ${xInfo.label} synchronisés avec axe X: ${minValue.toFixed(2)} - ${maxValue.toFixed(2)} ${xInfo.unit}`);
        }
    }
}
