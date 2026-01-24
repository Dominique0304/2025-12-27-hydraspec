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
    visibleChannels.forEach((config, index) => {
        const row = document.createElement('tr');

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
            config.yMin = e.target.value === '' ? null : parseFloat(e.target.value);

            // Vérifier si les valeurs correspondent encore à un preset
            let matchesPreset = false;
            for (let i = 1; i <= 5; i++) {
                const presetYMin = parseFloat(document.getElementById(`preset${i}-ymin`).value);
                const presetYMax = parseFloat(document.getElementById(`preset${i}-ymax`).value);
                const currentYMin = config.yMin;
                const currentYMax = config.yMax;

                if (currentYMin === presetYMin && currentYMax === presetYMax) {
                    matchesPreset = true;
                    break;
                }
            }

            // Si ne correspond à aucun preset, réinitialiser à "--"
            if (!matchesPreset) {
                presetSelect.value = '';
            }

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
            config.yMax = e.target.value === '' ? null : parseFloat(e.target.value);

            // Vérifier si les valeurs correspondent encore à un preset
            let matchesPreset = false;
            for (let i = 1; i <= 5; i++) {
                const presetYMin = parseFloat(document.getElementById(`preset${i}-ymin`).value);
                const presetYMax = parseFloat(document.getElementById(`preset${i}-ymax`).value);
                const currentYMin = config.yMin;
                const currentYMax = config.yMax;

                if (currentYMin === presetYMin && currentYMax === presetYMax) {
                    matchesPreset = true;
                    break;
                }
            }

            // Si ne correspond à aucun preset, réinitialiser à "--"
            if (!matchesPreset) {
                presetSelect.value = '';
            }

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

    // Options pour chaque canal
    appState.availableColumns.forEach((col, index) => {
        const option = document.createElement('option');
        option.value = (index + 1).toString();
        option.textContent = col.label;
        select.appendChild(option);
    });

    select.value = appState.xAxisChannel.toString();
    select.onchange = (e) => {
        appState.xAxisChannel = parseInt(e.target.value);
        updateTimeChart();
    };
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
        chart.update('none');
        return true; // Retourner true car on a bien géré le cas multi-canaux
    }

    // Déterminer les données de l'axe X
    let xData;
    if (appState.xAxisChannel === 0) {
        // Utiliser le temps
        xData = appState.fullDataTime;
    } else {
        // Utiliser un autre canal
        const xChannelIndex = appState.availableColumns[appState.xAxisChannel - 1].index;
        xData = appState.allColumnData[xChannelIndex];
    }

    // Downsampling si nécessaire
    let downsampleStep = 1;
    if (xData.length > 15000) {
        downsampleStep = Math.ceil(xData.length / 15000);
    }

    const downsampledX = downsampleStep > 1 ? xData.filter((_, i) => i % downsampleStep === 0) : Array.from(xData);

    // Créer les datasets pour chaque canal visible
    chart.data.labels = downsampledX;
    chart.data.datasets = visibleChannels.map(config => {
        const channelData = appState.allColumnData[config.index];
        const downsampledY = downsampleStep > 1 ? channelData.filter((_, i) => i % downsampleStep === 0) : Array.from(channelData);

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

    // ✅ CONSERVER LE ZOOM X ACTUEL (ne pas réinitialiser)
    // On ne modifie pas chart.options.scales.x.min/max
    // Le zoom actuel est déjà présent dans le graphique
    console.log("✅ Zoom X conservé:", {
        min: chart.options.scales.x.min,
        max: chart.options.scales.x.max
    });

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
            yMinInput.onchange = () => updateChannelsWithPreset(i);
            yMaxInput.onchange = () => updateChannelsWithPreset(i);
        }
    }
}

// Mettre à jour tous les canaux qui utilisent un preset donné
function updateChannelsWithPreset(presetNum) {
    const newYMin = parseFloat(document.getElementById(`preset${presetNum}-ymin`).value);
    const newYMax = parseFloat(document.getElementById(`preset${presetNum}-ymax`).value);

    // Parcourir tous les canaux et mettre à jour ceux qui utilisent ce preset
    appState.channelConfig.forEach((config, index) => {
        // Trouver le sélecteur de preset pour ce canal
        const table = document.getElementById('channel-config-tbody');
        if (table && table.rows[index]) {
            // Il y a 1 select par ligne: le Preset
            const selects = table.rows[index].querySelectorAll('select');
            const presetSelect = selects[0]; // Le premier (et seul) select est celui du preset

            if (presetSelect && presetSelect.value === presetNum.toString()) {
                // Ce canal utilise ce preset, mettre à jour ses valeurs
                config.yMin = newYMin;
                config.yMax = newYMax;

                // Mettre à jour les champs d'entrée visuellement
                const yMinInput = table.rows[index].querySelectorAll('input[type="number"]')[0];
                const yMaxInput = table.rows[index].querySelectorAll('input[type="number"]')[1];
                if (yMinInput) yMinInput.value = newYMin;
                if (yMaxInput) yMaxInput.value = newYMax;
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

    console.log(`🔍 Nombre total de canaux: ${appState.channelConfig.length}`);

    appState.channelConfig.forEach((config, index) => {
        console.log(`\n🔎 Canal ${index}: ${config.name || config.label}`);
        console.log(`  Label: "${config.label}"`);

        // Vérifier les conditions: visible ET preset="--"
        const table = document.getElementById('channel-config-tbody');
        if (!table) {
            console.log(`  ❌ Table non trouvée`);
            return;
        }

        if (!table.rows[index]) {
            console.log(`  ❌ Ligne ${index} non trouvée dans la table`);
            return;
        }

        const visibleCheckbox = table.rows[index].querySelector('input[type="checkbox"]');
        const presetSelect = table.rows[index].querySelector('select');

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
                barChannels.push({ config, index });
                console.log(`  📊 Ajouté aux canaux bar`);
            } else if (unit === 'mA') {
                maChannels.push({ config, index });
                console.log(`  📊 Ajouté aux canaux mA`);
            } else {
                console.log(`  ⚠️ Unité "${unit}" non reconnue (ni bar ni mA)`);
            }
        } else {
            console.log(`  ❌ Canal non éligible (visible=${isVisible}, noPreset=${hasNoPreset})`);
        }
    });

    console.log(`📊 Canaux bar trouvés: ${barChannels.length}`);
    console.log(`📊 Canaux mA trouvés: ${maChannels.length}`);

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
        barChannels.forEach(({ config, index }) => {
            config.yMin = 0;
            config.yMax = yMax;

            // Mettre à jour l'interface
            const table = document.getElementById('channel-config-tbody');
            if (table && table.rows[index]) {
                const yMinInput = table.rows[index].querySelectorAll('input[type="number"]')[0];
                const yMaxInput = table.rows[index].querySelectorAll('input[type="number"]')[1];
                if (yMinInput) yMinInput.value = 0;
                if (yMaxInput) yMaxInput.value = yMax;
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
        maChannels.forEach(({ config, index }) => {
            config.yMin = 0;
            config.yMax = yMax;

            // Mettre à jour l'interface
            const table = document.getElementById('channel-config-tbody');
            if (table && table.rows[index]) {
                const yMinInput = table.rows[index].querySelectorAll('input[type="number"]')[0];
                const yMaxInput = table.rows[index].querySelectorAll('input[type="number"]')[1];
                if (yMinInput) yMinInput.value = 0;
                if (yMaxInput) yMaxInput.value = yMax;
            }
        });
    }

    // Mettre à jour le graphique
    if (barChannels.length > 0 || maChannels.length > 0) {
        updateTimeChart();
        setStatus(`✅ Auto-Preset appliqué : ${barChannels.length} canaux bar, ${maChannels.length} canaux mA`);
    } else {
        setStatus('ℹ️ Auto-Preset : Aucun canal éligible (vérifiez que les canaux sont visibles et sans preset)', 'warning');
    }
}

// Reset zoom complet : dézoomer X au maximum + Auto Groupé sur Y
function resetZoomAndAutoGroup() {
    console.log("🔄 Reset zoom complet : X + Auto Groupé");

    // 1. Réinitialiser les champs de zoom X (important pour que updateTimeChart utilise la plage complète)
    const zoomMinInput = document.getElementById('zoom-min');
    const zoomMaxInput = document.getElementById('zoom-max');
    if (zoomMinInput && zoomMaxInput && appState.fullDataTime.length) {
        const t = appState.fullDataTime;
        zoomMinInput.value = (t[0] / 1000).toFixed(3); // Convertir ms en s
        zoomMaxInput.value = (t[t.length - 1] / 1000).toFixed(3);
        console.log("🔍 Zoom X réinitialisé: " + zoomMinInput.value + " à " + zoomMaxInput.value + " sec");
    }

    // 2. Réinitialiser directement le zoom X du graphique
    const chart = appState.charts.time;
    if (chart && appState.fullDataTime.length) {
        const t = appState.fullDataTime;
        chart.options.scales.x.min = t[0];
        chart.options.scales.x.max = t[t.length - 1];
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

    appState.channelConfig.forEach((config, index) => {
        // Vérifier les conditions: visible ET preset=""
        const table = document.getElementById('channel-config-tbody');
        if (!table || !table.rows[index]) return;

        const visibleCheckbox = table.rows[index].querySelector('input[type="checkbox"]');
        const presetSelect = table.rows[index].querySelector('select');

        const isVisible = visibleCheckbox && visibleCheckbox.checked;
        const hasNoPreset = presetSelect && (presetSelect.value === '--' || presetSelect.value === '');

        if (isVisible && hasNoPreset) {
            // Extraire l'unité du label
            const unit = extractUnit(config.label || config.name || '');

            if (unit === 'bar' || unit === 'mA') {
                // Trouver la valeur max pour CE canal spécifique
                const data = appState.allColumnData[config.index];
                if (data && data.length > 0) {
                    const channelMax = Math.max(...data);
                    const thresholds = (unit === 'bar') ? barThresholds : maThresholds;
                    const yMax = findAppropriateYMax(channelMax, thresholds);

                    console.log(`📊 Canal ${config.name}: unité=${unit}, max=${channelMax.toFixed(2)}, Ymax appliqué=${yMax}`);

                    // Appliquer Ymin=0 et Ymax à CE canal
                    config.yMin = 0;
                    config.yMax = yMax;

                    // Mettre à jour l'interface
                    const yMinInput = table.rows[index].querySelectorAll('input[type="number"]')[0];
                    const yMaxInput = table.rows[index].querySelectorAll('input[type="number"]')[1];
                    if (yMinInput) yMinInput.value = 0;
                    if (yMaxInput) yMaxInput.value = yMax;

                    if (unit === 'bar') barCount++;
                    else maCount++;
                }
            }
        }
    });

    // Mettre à jour le graphique
    if (barCount > 0 || maCount > 0) {
        updateTimeChart();
        setStatus(`✅ Auto-Preset Canal appliqué : ${barCount} canaux bar, ${maCount} canaux mA (individuellement)`);
    } else {
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

    // Appliquer à tous les canaux
    appState.channelConfig.forEach(config => {
        config.lineWidth = lineWidth;
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
    const zoomMinInput = document.getElementById('zoom-min');
    const zoomMaxInput = document.getElementById('zoom-max');

    if (!zoomMinInput || !zoomMaxInput) {
        console.warn('⚠️ Champs zoom-min ou zoom-max non trouvés');
        return;
    }

    // Récupérer le graphique time
    const chart = appState.charts?.time;
    if (!chart || !chart.scales || !chart.scales.x) {
        console.warn('⚠️ Graphique ou échelle X non disponible');
        return;
    }

    // Récupérer les valeurs min et max de l'axe X (en ms)
    const xScale = chart.scales.x;
    const minMs = xScale.min;
    const maxMs = xScale.max;

    // Convertir en secondes et mettre à jour les champs
    zoomMinInput.value = (minMs / 1000).toFixed(3);
    zoomMaxInput.value = (maxMs / 1000).toFixed(3);

    console.log(`✅ Champs zoom synchronisés: ${zoomMinInput.value}s - ${zoomMaxInput.value}s`);
}
