// =====================================
// SYSTÈME DE CANAL CALCULÉ
// =====================================

// Stockage des canaux calculés
if (!appState.calculatedChannels) {
    appState.calculatedChannels = [];
}

// État de l'édition
let currentEditingCalculatedChannelId = null;

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

// Toggle aide
function toggleFormulaHelp() {
    const help = document.getElementById('formula-help');

    if (help) {
        const isVisible = help.style.display !== 'none';
        help.style.display = isVisible ? 'none' : 'block';
    }
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
// CRÉATION DE CANAL CALCULÉ
// =====================================

function createCalculatedChannel() {
    try {
        const formula = document.getElementById('calculated-formula').value.trim();
        let name = document.getElementById('calculated-channel-name').value.trim();
        const color = document.getElementById('calculated-channel-color').value;

        if (!formula) {
            alert('Veuillez entrer une formule');
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
            alert('Aucun canal avec des données valides trouvé.');
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
        document.getElementById('calculated-channel-color').value = '#FF00FF';

        // Mettre à jour la liste des canaux calculés
        updateCalculatedChannelsList();

        setStatus(`Canal calculé "${name}" créé`);
        console.log('✅ Canal calculé créé:', name);
    } catch (error) {
        alert(`Erreur: ${error.message}`);
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
            alert('Canal calculé introuvable');
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
            alert('Aucun canal avec des données valides trouvé.');
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
        document.getElementById('calculated-channel-color').value = '#FF00FF';

        // Mettre à jour la liste
        updateCalculatedChannelsList();

        setStatus(`✅ Canal calculé "${name}" mis à jour`);
        console.log('✅ Canal calculé mis à jour:', name);
    } catch (error) {
        alert(`Erreur: ${error.message}`);
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

    appState.calculatedChannels.forEach(channel => {
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
    });
}

// Éditer un canal calculé existant
function editCalculatedChannel(channelId) {
    const channel = appState.calculatedChannels.find(ch => ch.id === channelId);
    if (!channel) {
        setStatus('⚠️ Canal calculé introuvable');
        return;
    }

    // Activer le mode édition
    currentEditingCalculatedChannelId = channelId;

    // Remplir le formulaire avec les valeurs actuelles
    document.getElementById('calculated-formula').value = channel.formula;
    document.getElementById('calculated-channel-name').value = channel.name;
    document.getElementById('calculated-channel-color').value = channel.color;

    // Changer le texte du bouton
    const createBtn = document.querySelector('button[onclick="createCalculatedChannel()"]');
    if (createBtn) {
        createBtn.innerHTML = '<i class="fas fa-check"></i> Sauvegarder';
    }

    setStatus(`📝 Modification du canal "${channel.name}"`);
}

// Supprimer un canal calculé
function deleteCalculatedChannel(channelId, silent = false) {
    const channelIndex = appState.calculatedChannels.findIndex(ch => ch.id === channelId);
    if (channelIndex === -1) {
        if (!silent) setStatus('⚠️ Canal calculé introuvable');
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

    if (!silent) setStatus(`✅ Canal calculé "${channelName}" supprimé`);
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

// =====================================
// INITIALISATION
// =====================================

function initCalculatedChannelSystem() {
    console.log('🧮 Système Canal Calculé initialisé');
    updateAvailableChannelsList();
}
