// =====================================
// SYSTÈME DE CANAL CALCULÉ
// =====================================

// Fonctions helper pour le color picker
function getCalculatedChannelColor() {
    const colorBtn = document.getElementById('calculated-channel-color-btn');
    return colorBtn ? colorBtn.dataset.colorValue : '#FF00FF';
}

function setCalculatedChannelColor(color) {
    const colorBtn = document.getElementById('calculated-channel-color-btn');
    if (colorBtn) {
        colorBtn.dataset.colorValue = color;
        colorBtn.style.backgroundColor = color;
    }
}

// Stockage des canaux calculés
if (!appState.calculatedChannels) {
    appState.calculatedChannels = [];
}

// État de l'édition
let currentEditingCalculatedChannelId = null;
let currentEditingCylinderGroupId = null;

// Toggle accordion
function toggleCalculatedChannel() {
    const content = document.getElementById('calculated-channel-content');
    const icon = document.getElementById('calculated-channel-toggle-icon');

    if (content && icon) {
        const isVisible = content.style.display !== 'none';

        if (!isVisible) {
            // Désactiver les autres outils
            if (typeof deactivateOtherTools === 'function') {
                deactivateOtherTools('calculated');
            }

            // Fermer les autres sous-accordéons d'Outils
            if (typeof closeOtherToolAccordions === 'function') {
                closeOtherToolAccordions('calculated');
            }
        }

        content.style.display = isVisible ? 'none' : 'block';
        icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    }
}

// Toggle aide formule
function toggleFormulaHelp() {
    const help = document.getElementById('formula-help');

    if (help) {
        const isVisible = help.style.display !== 'none';
        help.style.display = isVisible ? 'none' : 'block';
    }
}

// Toggle aide vérin
function toggleCylinderHelp() {
    const help = document.getElementById('cylinder-help');

    if (help) {
        const isVisible = help.style.display !== 'none';
        help.style.display = isVisible ? 'none' : 'block';
    }
}

// Basculer entre formule et vérin
function toggleCalculatedType() {
    const typeSelect = document.getElementById('calculated-type');
    const formulaFields = document.getElementById('formula-fields');
    const cylinderFields = document.getElementById('cylinder-fields');

    if (!typeSelect || !formulaFields || !cylinderFields) return;

    const type = typeSelect.value;

    if (type === 'formula') {
        formulaFields.style.display = 'block';
        cylinderFields.style.display = 'none';
    } else if (type === 'cylinder') {
        formulaFields.style.display = 'none';
        cylinderFields.style.display = 'block';

        // Peupler la liste des canaux de vitesse
        populateCylinderVelocityChannel();
    }
}

// Peupler la liste des canaux de vitesse pour le calcul vérin
function populateCylinderVelocityChannel() {
    const select = document.getElementById('cylinder-velocity-channel');
    if (!select) return;

    // Vider la liste
    select.innerHTML = '<option value="">-- Sélectionner --</option>';

    // Ajouter tous les canaux disponibles
    if (appState.availableColumns && appState.availableColumns.length > 0) {
        appState.availableColumns.forEach(col => {
            const option = document.createElement('option');
            option.value = col.index;
            option.textContent = col.label || col.name;
            select.appendChild(option);
        });
    }
}

// =====================================
// CALCULS HYDRAULIQUES VÉRIN
// =====================================

// Convertir l'unité de vitesse en mm/s
function convertVelocityToMmPerSec(value, unit) {
    const unitLower = unit.toLowerCase().trim();

    // Détection des unités courantes
    if (unitLower === 'mm/s' || unitLower === 'mm/sec') {
        return value;
    } else if (unitLower === 'cm/s' || unitLower === 'cm/sec') {
        return value * 10;
    } else if (unitLower === 'm/s' || unitLower === 'm/sec') {
        return value * 1000;
    } else if (unitLower === 'dm/s' || unitLower === 'dm/sec') {
        return value * 100;
    } else if (unitLower.includes('mm')) {
        return value; // Par défaut mm/s
    } else if (unitLower.includes('cm')) {
        return value * 10;
    } else if (unitLower.includes('m') && !unitLower.includes('mm')) {
        return value * 1000;
    } else {
        // Unité inconnue, on suppose mm/s
        console.warn(`Unité "${unit}" non reconnue, utilisation de mm/s par défaut`);
        return value;
    }
}

// Calculer les débits vérin
function calculateCylinderFlows(velocityData, pistonDiameter, rodDiameter, velocityUnit) {
    const Dp = pistonDiameter; // mm
    const Dt = rodDiameter;    // mm

    // Surfaces en mm²
    const Sp = Math.PI * Math.pow(Dp, 2) / 4;           // Surface piston
    const Sa = Math.PI * (Math.pow(Dp, 2) - Math.pow(Dt, 2)) / 4; // Surface annulaire

    // Tableaux de résultat
    const pistonFlow = [];
    const rodFlow = [];

    // Calcul pour chaque point
    for (let i = 0; i < velocityData.length; i++) {
        const velocity = velocityData[i];

        // Convertir la vitesse en mm/s
        const velocityMmPerSec = convertVelocityToMmPerSec(velocity, velocityUnit);

        // Débit en mm³/s
        const Qp_mm3s = Sp * velocityMmPerSec;
        const Qt_mm3s = Sa * velocityMmPerSec;

        // Conversion mm³/s → L/min
        // 1 L = 1 000 000 mm³, 1 min = 60 s
        // Donc : L/min = mm³/s × 60 / 1 000 000
        const Qp_Lmin = Qp_mm3s * 60 / 1000000;
        const Qt_Lmin = Qt_mm3s * 60 / 1000000;

        pistonFlow.push(Qp_Lmin);
        rodFlow.push(Qt_Lmin);
    }

    return {
        pistonFlow: pistonFlow,
        rodFlow: rodFlow
    };
}

// =====================================
// PARSEUR DE FORMULES MATHÉMATIQUES
// =====================================

class FormulaParser {
    constructor(channels) {
        this.channels = channels; // { S1: data[], S2: data[], ... }
        this.constants = {
            'Pi': Math.PI,
            'e': Math.E
        };
        this.functions = {
            'sqrt': Math.sqrt,
            'sqr': (x) => x * x,
            'ln': Math.log,
            'log': Math.log10,
            'abs': Math.abs,
            'sin': Math.sin,
            'cos': Math.cos,
            'tan': Math.tan,
            'asin': Math.asin,
            'acos': Math.acos,
            'atan': Math.atan
        };
    }

    // Évaluer la formule pour tous les points
    evaluate(formula) {
        try {
            // Normaliser la formule : convertir les références de canaux en majuscules
            // Chercher tous les patterns s1, s2, etc. et les convertir en S1, S2, etc.
            let processedFormula = formula.replace(/\bs(\d+)\b/gi, (match, num) => 'S' + num);

            // Remplacer les constantes (insensible à la casse)
            for (const [name, value] of Object.entries(this.constants)) {
                const regex = new RegExp('\\b' + name + '\\b', 'gi');
                processedFormula = processedFormula.replace(regex, value.toString());
            }

            // Trouver la longueur minimale parmi tous les canaux
            const channelNames = Object.keys(this.channels);
            if (channelNames.length === 0) {
                throw new Error('Aucun canal disponible');
            }

            const minLength = Math.min(...channelNames.map(name => this.channels[name].length));
            const result = new Array(minLength);

            // Calculer pour chaque point
            for (let i = 0; i < minLength; i++) {
                // Créer un contexte pour ce point
                const context = {};
                for (const channelName of channelNames) {
                    context[channelName] = this.channels[channelName][i];
                }

                // Évaluer la formule pour ce point
                result[i] = this.evaluatePoint(processedFormula, context);
            }

            return result;
        } catch (error) {
            throw new Error(`Erreur de calcul: ${error.message}`);
        }
    }

    // Évaluer la formule pour un point spécifique
    evaluatePoint(formula, context) {
        try {
            // Remplacer les noms de canaux par leurs valeurs
            let expr = formula;
            for (const [name, value] of Object.entries(context)) {
                const regex = new RegExp('\\b' + name + '\\b', 'g');
                expr = expr.replace(regex, `(${value})`);
            }

            // Remplacer ^ par **
            expr = expr.replace(/\^/g, '**');

            // Créer une fonction qui a accès aux fonctions mathématiques
            const funcNames = Object.keys(this.functions);
            const funcValues = Object.values(this.functions);

            // Créer une fonction dynamique avec les fonctions math dans le scope
            const evaluator = new Function(...funcNames, `return ${expr}`);

            // Évaluer avec les fonctions
            return evaluator(...funcValues);
        } catch (error) {
            throw new Error(`Expression invalide: ${error.message}`);
        }
    }
}

// =====================================
// CRÉATION DE CANAUX VÉRIN
// =====================================

function createCylinderChannels() {
    try {
        // Récupérer les paramètres
        const velocityChannelIndex = parseInt(document.getElementById('cylinder-velocity-channel').value);
        let name = document.getElementById('calculated-channel-name').value.trim();
        const pistonDiameter = parseFloat(document.getElementById('cylinder-piston-diameter').value);
        const rodDiameter = parseFloat(document.getElementById('cylinder-rod-diameter').value);
        const velocityUnit = document.getElementById('cylinder-velocity-unit').value.trim();
        const showPiston = document.getElementById('cylinder-show-piston').checked;
        const showRod = document.getElementById('cylinder-show-rod').checked;
        const color = getCalculatedChannelColor();

        // Validation
        if (isNaN(velocityChannelIndex) || velocityChannelIndex < 0) {
            alert('Veuillez sélectionner un canal de vitesse');
            return;
        }

        if (isNaN(pistonDiameter) || pistonDiameter <= 0) {
            alert('Veuillez entrer un diamètre de piston valide (> 0)');
            return;
        }

        if (isNaN(rodDiameter) || rodDiameter < 0) {
            alert('Veuillez entrer un diamètre de tige valide (>= 0)');
            return;
        }

        if (rodDiameter >= pistonDiameter) {
            alert('Le diamètre de la tige doit être inférieur au diamètre du piston');
            return;
        }

        if (!velocityUnit) {
            alert('Veuillez spécifier l\'unité de vitesse');
            return;
        }

        // Générer un nom automatique si nécessaire
        if (!name) {
            name = 'Vérin';
        }

        // Récupérer les données de vitesse
        const velocityData = appState.allColumnData[velocityChannelIndex];
        if (!velocityData || velocityData.length === 0) {
            alert('Données de vitesse introuvables');
            return;
        }

        // Calculer les débits
        const {pistonFlow, rodFlow} = calculateCylinderFlows(
            velocityData,
            pistonDiameter,
            rodDiameter,
            velocityUnit
        );

        // Mode édition ou création ?
        const isEditMode = currentEditingCylinderGroupId !== null;
        let cylinderGroupId, pistonIndex, rodIndex, yAxisIndex;

        if (isEditMode) {
            // MODE ÉDITION
            cylinderGroupId = currentEditingCylinderGroupId;

            // Trouver les canaux existants
            const existingPiston = appState.calculatedChannels.find(
                ch => ch.cylinderGroupId === cylinderGroupId && ch.cylinderSide === 'piston'
            );
            const existingRod = appState.calculatedChannels.find(
                ch => ch.cylinderGroupId === cylinderGroupId && ch.cylinderSide === 'rod'
            );

            if (!existingPiston || !existingRod) {
                alert('Erreur: canaux vérin introuvables');
                currentEditingCylinderGroupId = null;
                return;
            }

            pistonIndex = existingPiston.dataIndex;
            rodIndex = existingRod.dataIndex;

            // Récupérer l'axe Y existant
            const pistonConfig = appState.channelConfig.find(cfg => cfg.calculatedId === existingPiston.id);
            yAxisIndex = pistonConfig ? parseInt(pistonConfig.yAxisID.replace('y', '')) : 0;

            // Mettre à jour les données
            appState.allColumnData[pistonIndex] = new Float32Array(pistonFlow);
            appState.allColumnData[rodIndex] = new Float32Array(rodFlow);

            // Mettre à jour les objets calculatedChannels
            existingPiston.baseName = name;
            existingPiston.name = `${name} - Piston`;
            existingPiston.color = color;
            existingPiston.pistonDiameter = pistonDiameter;
            existingPiston.rodDiameter = rodDiameter;
            existingPiston.velocityUnit = velocityUnit;
            existingPiston.sourceChannelIndex = velocityChannelIndex;
            existingPiston.visible = showPiston;

            existingRod.baseName = name;
            existingRod.name = `${name} - Annulaire`;
            existingRod.color = color;
            existingRod.pistonDiameter = pistonDiameter;
            existingRod.rodDiameter = rodDiameter;
            existingRod.velocityUnit = velocityUnit;
            existingRod.sourceChannelIndex = velocityChannelIndex;
            existingRod.visible = showRod;

            // Mettre à jour channelConfig
            const pistonConfigIndex = appState.channelConfig.findIndex(cfg => cfg.calculatedId === existingPiston.id);
            if (pistonConfigIndex !== -1) {
                appState.channelConfig[pistonConfigIndex].name = existingPiston.name;
                appState.channelConfig[pistonConfigIndex].label = existingPiston.name;
                appState.channelConfig[pistonConfigIndex].color = color;
                appState.channelConfig[pistonConfigIndex].visible = showPiston;
            }

            const rodConfigIndex = appState.channelConfig.findIndex(cfg => cfg.calculatedId === existingRod.id);
            if (rodConfigIndex !== -1) {
                appState.channelConfig[rodConfigIndex].name = existingRod.name;
                appState.channelConfig[rodConfigIndex].label = existingRod.name;
                appState.channelConfig[rodConfigIndex].color = color;
                appState.channelConfig[rodConfigIndex].visible = showRod;
            }

            // Mettre à jour availableColumns
            const pistonAvailIndex = appState.availableColumns.findIndex(col => col.calculatedId === existingPiston.id);
            if (pistonAvailIndex !== -1) {
                appState.availableColumns[pistonAvailIndex].name = existingPiston.name;
                appState.availableColumns[pistonAvailIndex].label = existingPiston.name;
            }

            const rodAvailIndex = appState.availableColumns.findIndex(col => col.calculatedId === existingRod.id);
            if (rodAvailIndex !== -1) {
                appState.availableColumns[rodAvailIndex].name = existingRod.name;
                appState.availableColumns[rodAvailIndex].label = existingRod.name;
            }

            // Réinitialiser le mode édition
            currentEditingCylinderGroupId = null;

            console.log(`✅ Canaux vérin mis à jour: ${name}`);
            setStatus(`Canaux vérin "${name}" mis à jour avec succès`);

        } else {
            // MODE CRÉATION
            cylinderGroupId = Date.now();

            // Trouver le prochain index d'axe Y disponible
            yAxisIndex = 0;
            const existingIndices = appState.channelConfig.map(cfg => {
                const match = cfg.yAxisID.match(/y(\d+)/);
                return match ? parseInt(match[1]) : 0;
            });
            if (existingIndices.length > 0) {
                yAxisIndex = Math.max(...existingIndices) + 1;
            }

            // Créer les 2 canaux avec le MÊME axe Y
            pistonIndex = appState.allColumnData.length;
            rodIndex = appState.allColumnData.length + 1;

            // Ajouter les données
            appState.allColumnData.push(new Float32Array(pistonFlow));
            appState.allColumnData.push(new Float32Array(rodFlow));

            // Créer les objets de canal calculé
            const pistonChannel = {
                id: cylinderGroupId + '_piston',
                type: 'cylinder',
                cylinderGroupId: cylinderGroupId,
                cylinderSide: 'piston',
                baseName: name,
                name: `${name} - Piston`,
                color: color,
                dataIndex: pistonIndex,
                pistonDiameter: pistonDiameter,
                rodDiameter: rodDiameter,
                velocityUnit: velocityUnit,
                sourceChannelIndex: velocityChannelIndex,
                visible: showPiston
            };

            const rodChannel = {
                id: cylinderGroupId + '_rod',
                type: 'cylinder',
                cylinderGroupId: cylinderGroupId,
                cylinderSide: 'rod',
                baseName: name,
                name: `${name} - Annulaire`,
                color: color,
                dataIndex: rodIndex,
                pistonDiameter: pistonDiameter,
                rodDiameter: rodDiameter,
                velocityUnit: velocityUnit,
                sourceChannelIndex: velocityChannelIndex,
                visible: showRod
            };

            appState.calculatedChannels.push(pistonChannel);
            appState.calculatedChannels.push(rodChannel);

            // Ajouter à availableColumns
            appState.availableColumns.push({
                index: pistonIndex,
                name: pistonChannel.name,
                label: pistonChannel.name,
                unit: "L/min",
                isCylinder: true,
                calculatedId: pistonChannel.id
            });

            appState.availableColumns.push({
                index: rodIndex,
                name: rodChannel.name,
                label: rodChannel.name,
                unit: "L/min",
                isCylinder: true,
                calculatedId: rodChannel.id
            });

            // Ajouter à channelConfig (MÊME axe Y)
            appState.channelConfig.push({
                index: pistonIndex,
                name: pistonChannel.name,
                label: pistonChannel.name,
                unit: "L/min",
                visible: showPiston,
                color: color,
                lineWidth: 1.5,
                yAxisPosition: 'right',
                yMin: null,
                yMax: null,
                yAxisID: `y${yAxisIndex}`, // Même axe Y
                showFFT: false,
                isCylinder: true,
                calculatedId: pistonChannel.id,
                cylinderGroupId: cylinderGroupId
            });

            appState.channelConfig.push({
                index: rodIndex,
                name: rodChannel.name,
                label: rodChannel.name,
                unit: "L/min",
                visible: showRod,
                color: color,
                lineWidth: 1.5,
                yAxisPosition: 'right',
                yMin: null,
                yMax: null,
                yAxisID: `y${yAxisIndex}`, // Même axe Y
                showFFT: false,
                isCylinder: true,
                calculatedId: rodChannel.id,
                cylinderGroupId: cylinderGroupId
            });

            console.log(`✅ Canaux vérin créés: ${name} - Piston et ${name} - Annulaire`);
            setStatus(`Canaux vérin "${name}" créés avec succès`);
        }

        // Réinitialiser le formulaire
        document.getElementById('cylinder-velocity-channel').value = '';
        document.getElementById('calculated-channel-name').value = '';
        document.getElementById('cylinder-piston-diameter').value = '';
        document.getElementById('cylinder-rod-diameter').value = '';
        document.getElementById('cylinder-velocity-unit').value = 'mm/s';
        document.getElementById('cylinder-show-piston').checked = true;
        document.getElementById('cylinder-show-rod').checked = true;

        // Réinitialiser le bouton
        const createBtn = document.querySelector('button[onclick="createCalculatedChannel()"]');
        if (createBtn) {
            createBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Créer';
        }

        // Mettre à jour les graphiques et listes
        updateCalculatedChannelsList();
        updateTimeChart();
        updateChannelConfigUI();

        // Rafraîchir les listes des autres outils
        if (typeof updateCanalQuickView === 'function') {
            updateCanalQuickView();
        }
        if (typeof populateSmoothedChannelSelector === 'function') {
            populateSmoothedChannelSelector();
        }
        if (typeof populateDerivativeSourceChannels === 'function') {
            populateDerivativeSourceChannels();
        }

    } catch (error) {
        console.error('Erreur lors de la création des canaux vérin:', error);
        alert(`Erreur: ${error.message}`);
    }
}

// =====================================
// CRÉATION DE CANAL CALCULÉ
// =====================================

function createCalculatedChannel() {
    try {
        // Détecter le type de calcul
        const typeSelect = document.getElementById('calculated-type');
        const type = typeSelect ? typeSelect.value : 'formula';

        // Si type vérin, déléguer à la fonction spécialisée
        if (type === 'cylinder') {
            createCylinderChannels();
            return;
        }

        // Sinon, traitement formule classique
        const formula = document.getElementById('calculated-formula').value.trim();
        let name = document.getElementById('calculated-channel-name').value.trim();
        const color = getCalculatedChannelColor();

        if (!formula) {
            alert(t('dialogs.please_enter_formula'));
            return;
        }

        // Mode édition : modifier un canal existant
        if (currentEditingCalculatedChannelId) {
            updateExistingCalculatedChannel(currentEditingCalculatedChannelId, formula, name, color);
            return;
        }

        // Préparer les données des canaux pour le parser (uniquement les canaux non calculés)
        const channelData = {};
        let channelIndex = 1;

        if (!appState.channelConfig || appState.channelConfig.length === 0) {
            alert('Aucun canal disponible. Veuillez charger des données d\'abord.');
            return;
        }

        if (!appState.allColumnData) {
            alert('Données non disponibles. Veuillez charger un fichier d\'abord.');
            return;
        }

        appState.channelConfig.forEach((config) => {
            // Exclure les canaux calculés pour éviter les dépendances circulaires
            if (!config.isCalculated) {
                const columnData = appState.allColumnData[config.index];
                if (columnData && columnData.length > 0) {
                    const channelKey = 'S' + channelIndex;
                    channelData[channelKey] = columnData;
                    channelIndex++;
                }
            }
        });

        if (Object.keys(channelData).length === 0) {
            alert(t('dialogs.no_valid_channels'));
            return;
        }

        // Parser et calculer
        const parser = new FormulaParser(channelData);
        const calculatedData = parser.evaluate(formula);

        // Générer un nom automatique si nécessaire
        if (!name) {
            name = formula + ' Calculé';

            // Vérifier les doublons et ajouter un index
            let index = 1;
            let baseName = name;
            while (appState.channelConfig.some(cfg => cfg.name === name) ||
                   appState.calculatedChannels.some(ch => ch.name === name)) {
                name = baseName + ' ' + index;
                index++;
            }
        }

        // Trouver le prochain index d'axe Y disponible
        let yAxisIndex = 0;
        const existingIndices = appState.channelConfig.map(cfg => {
            const match = cfg.yAxisID.match(/y(\d+)/);
            return match ? parseInt(match[1]) : 0;
        });
        if (existingIndices.length > 0) {
            yAxisIndex = Math.max(...existingIndices) + 1;
        }

        // Trouver le prochain index disponible dans allColumnData
        const nextDataIndex = appState.allColumnData.length;

        // Stocker les données calculées dans allColumnData
        appState.allColumnData.push(calculatedData);

        // Ajouter le canal calculé à l'état
        const calculatedChannel = {
            id: Date.now(),
            formula: formula,
            name: name,
            color: color,
            dataIndex: nextDataIndex
        };
        appState.calculatedChannels.push(calculatedChannel);

        // Ajouter à availableColumns (IMPORTANT pour les sélecteurs)
        appState.availableColumns.push({
            index: nextDataIndex,
            name: name,
            label: name,
            unit: "",
            isCalculated: true,
            calculatedId: calculatedChannel.id
        });

        // Ajouter à la configuration multi-canaux
        appState.channelConfig.push({
            index: nextDataIndex, // Index dans allColumnData
            name: name,
            label: name,
            unit: "",
            visible: true,
            color: color,
            lineWidth: 1.5,
            yAxisPosition: 'right',
            yMin: null,
            yMax: null,
            yAxisID: `y${yAxisIndex}`,
            showFFT: false,
            isCalculated: true,
            calculatedId: calculatedChannel.id
        });

        // Mettre à jour les graphiques
        updateTimeChart();
        updateChannelConfigUI();

        // Si c'était une édition, réinitialiser le mode édition
        if (currentEditingCalculatedChannelId) {
            currentEditingCalculatedChannelId = null;

            // Restaurer le bouton
            const createBtn = document.querySelector('button[onclick="createCalculatedChannel()"]');
            if (createBtn) {
                createBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Créer';
            }
        }

        // Réinitialiser le formulaire
        document.getElementById('calculated-formula').value = '';
        document.getElementById('calculated-channel-name').value = '';
        setCalculatedChannelColor('#FF00FF');

        // Mettre à jour la liste des canaux calculés
        updateCalculatedChannelsList();

        // Rafraîchir les listes des canaux sources dans les autres outils
        if (typeof populateSmoothedChannelSelector === 'function') {
            populateSmoothedChannelSelector();
        }
        if (typeof populateDerivativeSourceChannels === 'function') {
            populateDerivativeSourceChannels();
        }

        setStatus(t("status.calculated_channel_created", {name}));
        console.log('✅ Canal calculé créé:', name);
    } catch (error) {
        alert(t('dialogs.error_msg', {msg: error.message}));
        console.error('❌ Erreur création canal calculé:', error);
    }
}

// =====================================
// MISE À JOUR DE CANAL CALCULÉ EXISTANT
// =====================================

function updateExistingCalculatedChannel(channelId, formula, name, color) {
    try {
        const channel = appState.calculatedChannels.find(ch => ch.id === channelId);
        if (!channel) {
            alert(t('dialogs.calculated_channel_not_found'));
            return;
        }

        // Préparer les données des canaux pour le parser
        const channelData = {};
        let channelIndex = 1;

        appState.channelConfig.forEach((config) => {
            // Exclure les canaux calculés ET le canal en cours d'édition
            if (!config.isCalculated || config.calculatedId === channelId) {
                if (config.calculatedId !== channelId) {
                    const columnData = appState.allColumnData[config.index];
                    if (columnData && columnData.length > 0) {
                        const channelKey = 'S' + channelIndex;
                        channelData[channelKey] = columnData;
                        channelIndex++;
                    }
                }
            }
        });

        if (Object.keys(channelData).length === 0) {
            alert(t('dialogs.no_valid_channels'));
            return;
        }

        // Parser et calculer avec la nouvelle formule
        const parser = new FormulaParser(channelData);
        const calculatedData = parser.evaluate(formula);

        // Générer un nom automatique si nécessaire
        if (!name) {
            name = formula + ' Calculé';

            let index = 1;
            let baseName = name;
            while ((appState.channelConfig.some(cfg => cfg.name === name && cfg.calculatedId !== channelId)) ||
                   (appState.calculatedChannels.some(ch => ch.name === name && ch.id !== channelId))) {
                name = baseName + ' ' + index;
                index++;
            }
        }

        // Mettre à jour les données dans allColumnData
        const configIndex = appState.channelConfig.findIndex(cfg => cfg.calculatedId === channelId);
        if (configIndex !== -1) {
            const dataIndex = appState.channelConfig[configIndex].index;
            appState.allColumnData[dataIndex] = calculatedData;

            // Mettre à jour la config
            appState.channelConfig[configIndex].name = name;
            appState.channelConfig[configIndex].label = name;
            appState.channelConfig[configIndex].color = color;
        }

        // Mettre à jour le canal calculé
        channel.formula = formula;
        channel.name = name;
        channel.color = color;

        // Mettre à jour les graphiques
        updateTimeChart();
        updateChannelConfigUI();

        // Réinitialiser le mode édition
        currentEditingCalculatedChannelId = null;

        // Restaurer le bouton
        const createBtn = document.querySelector('button[onclick="createCalculatedChannel()"]');
        if (createBtn) {
            createBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Créer';
        }

        // Réinitialiser le formulaire
        document.getElementById('calculated-formula').value = '';
        document.getElementById('calculated-channel-name').value = '';
        setCalculatedChannelColor('#FF00FF');

        // Mettre à jour la liste
        updateCalculatedChannelsList();

        setStatus(t("status.calculated_channel_updated", {name}));
        console.log('✅ Canal calculé mis à jour:', name);
    } catch (error) {
        alert(t('dialogs.error_msg', {msg: error.message}));
        console.error('❌ Erreur mise à jour canal calculé:', error);
    }
}

// =====================================
// GESTION DE LA LISTE DES CANAUX CALCULÉS
// =====================================

function updateCalculatedChannelsList() {
    const listContainer = document.getElementById('calculated-channels-list');
    const itemsContainer = document.getElementById('calculated-channels-items');

    if (!listContainer || !itemsContainer) return;

    if (!appState.calculatedChannels || appState.calculatedChannels.length === 0) {
        listContainer.style.display = 'none';
        return;
    }

    listContainer.style.display = 'block';
    itemsContainer.innerHTML = '';

    // Tracker les groupes de vérins déjà affichés
    const displayedCylinderGroups = new Set();

    appState.calculatedChannels.forEach(channel => {
        // Si c'est un canal vérin
        if (channel.type === 'cylinder' && channel.cylinderGroupId) {
            // Si ce groupe a déjà été affiché, on passe
            if (displayedCylinderGroups.has(channel.cylinderGroupId)) {
                return;
            }

            // Marquer ce groupe comme affiché
            displayedCylinderGroups.add(channel.cylinderGroupId);

            // Trouver les deux canaux du groupe (piston et tige)
            const pistonChannel = appState.calculatedChannels.find(
                ch => ch.cylinderGroupId === channel.cylinderGroupId && ch.cylinderSide === 'piston'
            );
            const rodChannel = appState.calculatedChannels.find(
                ch => ch.cylinderGroupId === channel.cylinderGroupId && ch.cylinderSide === 'rod'
            );

            if (!pistonChannel || !rodChannel) return;

            // Créer l'élément groupé pour le vérin
            const item = document.createElement('div');
            item.style.cssText = 'margin-bottom:8px; padding:8px; background:var(--bg-secondary); border-radius:4px; border-left:4px solid ' + channel.color;

            const pistonVisible = pistonChannel.visible !== false ? 'Visible' : 'Masqué';
            const rodVisible = rodChannel.visible !== false ? 'Visible' : 'Masqué';

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <div style="font-weight:bold; color:var(--text-main); font-size:0.9em;">
                        <i class="fas fa-cog" style="margin-right:4px;"></i>Vérin: ${channel.baseName || 'Vérin'}
                    </div>
                    <div style="display:flex; gap:4px;">
                        <button onclick="editCylinderChannel('${channel.cylinderGroupId}')"
                                style="padding:4px 8px; background:var(--accent-blue); color:white; border:none; border-radius:3px; cursor:pointer; font-size:0.75em;"
                                title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteCylinderChannel('${channel.cylinderGroupId}')"
                                style="padding:4px 8px; background:var(--accent-red); color:white; border:none; border-radius:3px; cursor:pointer; font-size:0.75em;"
                                title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div style="font-size:0.75em; color:var(--text-muted); line-height:1.6;">
                    <div style="margin-bottom:2px;">
                        <i class="fas fa-circle" style="color:${pistonChannel.color}; margin-right:4px; font-size:0.6em;"></i>
                        <strong>Piston (A):</strong> ${pistonChannel.name} - ${pistonVisible}
                    </div>
                    <div style="margin-bottom:4px;">
                        <i class="fas fa-circle" style="color:${rodChannel.color}; margin-right:4px; font-size:0.6em;"></i>
                        <strong>Annulaire (B):</strong> ${rodChannel.name} - ${rodVisible}
                    </div>
                    <div style="margin-top:4px; padding-top:4px; border-top:1px solid var(--border-color);">
                        Ø Piston: ${channel.pistonDiameter} mm | Ø Tige: ${channel.rodDiameter} mm | Unité: ${channel.velocityUnit}
                    </div>
                </div>
            `;

            itemsContainer.appendChild(item);

        } else {
            // Canal formule classique - affichage individuel
            const item = document.createElement('div');
            item.style.cssText = 'margin-bottom:8px; padding:8px; background:var(--bg-secondary); border-radius:4px; border-left:4px solid ' + channel.color;

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <div style="font-weight:bold; color:var(--text-main); font-size:0.9em;">
                        ${channel.name}
                    </div>
                    <div style="display:flex; gap:4px;">
                        <button onclick="editCalculatedChannel(${channel.id})"
                                style="padding:4px 8px; background:var(--accent-blue); color:white; border:none; border-radius:3px; cursor:pointer; font-size:0.75em;"
                                title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteCalculatedChannel(${channel.id})"
                                style="padding:4px 8px; background:var(--accent-red); color:white; border:none; border-radius:3px; cursor:pointer; font-size:0.75em;"
                                title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div style="font-size:0.75em; color:var(--text-muted);">
                    Formule: <span style="font-family:monospace; color:var(--accent-blue);">${channel.formula}</span>
                </div>
            `;

            itemsContainer.appendChild(item);
        }
    });
}

// Éditer un canal calculé existant
function editCalculatedChannel(channelId) {
    const channel = appState.calculatedChannels.find(ch => ch.id === channelId);
    if (!channel) {
        setStatus(t("status.calculated_channel_not_found"));
        return;
    }

    // Activer le mode édition
    currentEditingCalculatedChannelId = channelId;

    // Remplir le formulaire avec les valeurs actuelles
    document.getElementById('calculated-formula').value = channel.formula;
    document.getElementById('calculated-channel-name').value = channel.name;
    setCalculatedChannelColor(channel.color);

    // Changer le texte du bouton
    const createBtn = document.querySelector('button[onclick="createCalculatedChannel()"]');
    if (createBtn) {
        createBtn.innerHTML = '<i class="fas fa-check"></i> Sauvegarder';
    }

    setStatus(t("status.editing_channel", {name: channel.name}));
}

// Supprimer un canal calculé
function deleteCalculatedChannel(channelId, silent = false) {
    const channelIndex = appState.calculatedChannels.findIndex(ch => ch.id === channelId);
    if (channelIndex === -1) {
        if (!silent) setStatus(t("status.calculated_channel_not_found"));
        return;
    }

    const channel = appState.calculatedChannels[channelIndex];
    const channelName = channel.name;

    // Supprimer du tableau des canaux calculés
    appState.calculatedChannels.splice(channelIndex, 1);

    // Trouver et supprimer de channelConfig
    const configIndex = appState.channelConfig.findIndex(cfg => cfg.calculatedId === channelId);
    if (configIndex !== -1) {
        const dataIndex = appState.channelConfig[configIndex].index;

        // Supprimer de channelConfig
        appState.channelConfig.splice(configIndex, 1);

        // Supprimer de allColumnData
        appState.allColumnData.splice(dataIndex, 1);

        // Mettre à jour les indices des autres canaux
        appState.channelConfig.forEach(cfg => {
            if (cfg.index > dataIndex) {
                cfg.index--;
            }
        });

        // Mettre à jour les indices dans calculatedChannels
        appState.calculatedChannels.forEach(ch => {
            if (ch.dataIndex > dataIndex) {
                ch.dataIndex--;
            }
        });
    }

    // Mettre à jour l'interface
    updateCalculatedChannelsList();
    updateChannelConfigUI();
    updateTimeChart();
    updateAvailableChannelsList();

    // Rafraîchir la liste des canaux sous l'accordéon "Canal"
    if (typeof updateCanalQuickView === 'function') {
        updateCanalQuickView();
    }
    if (typeof updateFFTCanalQuickView === 'function') {
        updateFFTCanalQuickView();
    }

    // Rafraîchir les listes des canaux sources dans les autres outils
    if (typeof populateSmoothedChannelSelector === 'function') {
        populateSmoothedChannelSelector();
    }
    if (typeof populateDerivativeSourceChannels === 'function') {
        populateDerivativeSourceChannels();
    }

    if (!silent) setStatus(t("status.calculated_channel_deleted", {name: channelName}));
}

// Éditer un canal vérin (groupe piston + tige)
function editCylinderChannel(cylinderGroupId) {
    // Trouver les canaux du groupe
    const pistonChannel = appState.calculatedChannels.find(
        ch => ch.cylinderGroupId === cylinderGroupId && ch.cylinderSide === 'piston'
    );
    const rodChannel = appState.calculatedChannels.find(
        ch => ch.cylinderGroupId === cylinderGroupId && ch.cylinderSide === 'rod'
    );

    if (!pistonChannel || !rodChannel) {
        setStatus("Erreur: Canaux vérin introuvables");
        return;
    }

    // Passer en mode vérin
    const typeSelect = document.getElementById('calculated-type');
    if (typeSelect) {
        typeSelect.value = 'cylinder';
        toggleCalculatedType();
    }

    // Remplir le formulaire avec les valeurs actuelles
    document.getElementById('cylinder-velocity-channel').value = pistonChannel.sourceChannelIndex;
    document.getElementById('cylinder-piston-diameter').value = pistonChannel.pistonDiameter;
    document.getElementById('cylinder-rod-diameter').value = pistonChannel.rodDiameter;
    document.getElementById('cylinder-velocity-unit').value = pistonChannel.velocityUnit;
    document.getElementById('cylinder-show-piston').checked = pistonChannel.visible !== false;
    document.getElementById('cylinder-show-rod').checked = rodChannel.visible !== false;
    document.getElementById('calculated-channel-name').value = pistonChannel.baseName || 'Vérin';
    setCalculatedChannelColor(pistonChannel.color);

    // Activer le mode édition
    currentEditingCylinderGroupId = cylinderGroupId;

    // Changer le texte du bouton
    const createBtn = document.querySelector('button[onclick="createCalculatedChannel()"]');
    if (createBtn) {
        createBtn.innerHTML = '<i class="fas fa-check"></i> Sauvegarder';
    }

    setStatus("Édition du vérin " + (pistonChannel.baseName || 'Vérin'));
}

// Supprimer un canal vérin (groupe piston + tige)
function deleteCylinderChannel(cylinderGroupId) {
    // Trouver les deux canaux du groupe
    const pistonChannel = appState.calculatedChannels.find(
        ch => ch.cylinderGroupId === cylinderGroupId && ch.cylinderSide === 'piston'
    );
    const rodChannel = appState.calculatedChannels.find(
        ch => ch.cylinderGroupId === cylinderGroupId && ch.cylinderSide === 'rod'
    );

    if (!pistonChannel || !rodChannel) {
        setStatus("Erreur: Canaux vérin introuvables");
        return;
    }

    const baseName = pistonChannel.baseName || 'Vérin';

    // Supprimer les deux canaux dans l'ordre inverse (rod puis piston)
    // pour éviter les problèmes de réindexation
    const rodId = rodChannel.id;
    const pistonId = pistonChannel.id;

    // Supprimer rod en premier
    deleteCalculatedChannel(rodId, true);

    // Puis supprimer piston
    deleteCalculatedChannel(pistonId, true);

    // Mettre à jour l'interface
    updateCalculatedChannelsList();
    updateChannelConfigUI();
    updateTimeChart();
    updateAvailableChannelsList();

    // Rafraîchir la liste des canaux sous l'accordéon "Canal"
    if (typeof updateCanalQuickView === 'function') {
        updateCanalQuickView();
    }
    if (typeof updateFFTCanalQuickView === 'function') {
        updateFFTCanalQuickView();
    }

    // Rafraîchir les listes des canaux sources dans les autres outils
    if (typeof populateSmoothedChannelSelector === 'function') {
        populateSmoothedChannelSelector();
    }
    if (typeof populateDerivativeSourceChannels === 'function') {
        populateDerivativeSourceChannels();
    }

    setStatus("Canaux vérin supprimés: " + baseName);
}

// =====================================
// INTERFACE
// =====================================

function updateAvailableChannelsList() {
    const listEl = document.getElementById('available-channels-list');
    if (!listEl) return;

    if (!appState.channelConfig || appState.channelConfig.length === 0) {
        listEl.innerHTML = '<span style="color:var(--text-muted); font-style:italic;">Aucun canal chargé</span>';
        return;
    }

    const validChannels = appState.channelConfig.filter(cfg => !cfg.isCalculated);

    if (validChannels.length === 0) {
        listEl.innerHTML = '<span style="color:var(--text-muted); font-style:italic;">Aucun canal disponible</span>';
        return;
    }

    const channelItems = validChannels.map((cfg, index) => {
        const channelKey = 'S' + (index + 1);
        return `<div style="display:inline-block; margin:3px 8px 3px 0;"><strong>${channelKey}</strong>: ${cfg.label}</div>`;
    });

    listEl.innerHTML = channelItems.join('');
}

// Recréer un canal calculé à partir de ses paramètres sauvegardés
function recreateCalculatedChannel(channel) {
    console.log(`🔄 Recréation du canal calculé: ${channel.name}`);

    try {
        // Préparer les données des canaux pour le parser (uniquement les canaux non calculés)
        const channelData = {};
        let channelIndex = 1;

        appState.channelConfig.forEach((config) => {
            // Exclure les canaux calculés pour éviter les dépendances circulaires
            if (!config.isCalculated) {
                const columnData = appState.allColumnData[config.index];
                if (columnData && columnData.length > 0) {
                    const channelKey = 'S' + channelIndex;
                    channelData[channelKey] = columnData;
                    channelIndex++;
                }
            }
        });

        if (Object.keys(channelData).length === 0) {
            console.error('⚠️ Aucun canal disponible pour recalculer:', channel.name);
            return;
        }

        // Parser et recalculer
        const parser = new FormulaParser(channelData);
        const calculatedData = parser.evaluate(channel.formula);

        // Trouver le prochain index d'axe Y disponible
        let yAxisIndex = 0;
        const existingIndices = appState.channelConfig.map(cfg => {
            const match = cfg.yAxisID.match(/y(\d+)/);
            return match ? parseInt(match[1]) : 0;
        });
        if (existingIndices.length > 0) {
            yAxisIndex = Math.max(...existingIndices) + 1;
        }

        // Trouver le prochain index disponible dans allColumnData
        const nextDataIndex = appState.allColumnData.length;

        // Stocker les données calculées dans allColumnData
        appState.allColumnData.push(calculatedData);

        // Ajouter à availableColumns (IMPORTANT pour les sélecteurs)
        appState.availableColumns.push({
            index: nextDataIndex,
            name: channel.name,
            label: channel.name,
            unit: "",
            isCalculated: true,
            calculatedId: channel.id
        });

        // Ajouter à la configuration multi-canaux
        appState.channelConfig.push({
            index: nextDataIndex,
            name: channel.name,
            label: channel.name,
            unit: "",
            visible: true,
            color: channel.color,
            lineWidth: 1.5,
            yAxisPosition: 'right',
            yMin: null,
            yMax: null,
            yAxisID: `y${yAxisIndex}`,
            showFFT: false,
            isCalculated: true,
            calculatedId: channel.id
        });

        // Mettre à jour dataIndex dans le canal
        channel.dataIndex = nextDataIndex;

        console.log(`✅ Canal calculé recréé: ${channel.name}`);

    } catch (error) {
        console.error(`❌ Erreur recréation canal calculé ${channel.name}:`, error);
    }
}

// =====================================
// INITIALISATION
// =====================================

function initCalculatedChannelSystem() {
    console.log('🧮 Système Canal Calculé initialisé');
    updateAvailableChannelsList();
}
