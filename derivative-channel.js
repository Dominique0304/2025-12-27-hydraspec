// =====================================
// SYSTÈME DE DÉRIVÉE DE CANAUX
// =====================================

// Stockage des canaux dérivés
if (!appState.derivativeChannels) {
    appState.derivativeChannels = [];
}

// ID du canal en cours d'édition (pour mise à jour temps réel)
let currentEditingDerivativeId = null;

// Toggle accordéon Dérivée de Canal
function toggleDerivative() {
    const content = document.getElementById('derivative-content');
    const icon = document.getElementById('derivative-toggle-icon');

    if (content && icon) {
        const isVisible = content.style.display !== 'none';

        if (!isVisible) {
            // Désactiver les autres outils
            if (typeof deactivateOtherTools === 'function') {
                deactivateOtherTools('derivative');
            }

            // Fermer les autres sous-accordéons d'Outils
            if (typeof closeOtherToolAccordions === 'function') {
                closeOtherToolAccordions('derivative');
            }
        }

        content.style.display = isVisible ? 'none' : 'block';
        icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    }
}

// Calcul de la dérivée (dY/dX)
function calculateDerivative(yData, xData) {
    if (!yData || !xData || yData.length < 2 || xData.length < 2) {
        console.error('Données insuffisantes pour calculer la dérivée');
        return [];
    }

    const derivative = [];
    const n = Math.min(yData.length, xData.length);

    // Calculer la dérivée brute : dY/dX
    for (let i = 0; i < n - 1; i++) {
        const dY = yData[i + 1] - yData[i];
        const dX = xData[i + 1] - xData[i];

        // Éviter division par zéro
        if (dX !== 0) {
            derivative[i] = dY / dX;
        } else {
            derivative[i] = 0;
        }
    }

    // Dernier point : même valeur que l'avant-dernier
    derivative[n - 1] = derivative[n - 2] || 0;

    return derivative;
}

// Fonction de moyenne glissante (réutilisée de smoothing.js)
function movingAverageDerivative(data, windowSize) {
    if (!data || data.length === 0) return [];
    if (windowSize < 1) return data;
    if (windowSize > data.length) windowSize = data.length;

    const result = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < data.length; i++) {
        let sum = 0;
        let count = 0;

        // Déterminer la plage de la fenêtre
        const start = Math.max(0, i - halfWindow);
        const end = Math.min(data.length - 1, i + halfWindow);

        // Calculer la moyenne
        for (let j = start; j <= end; j++) {
            sum += data[j];
            count++;
        }

        result.push(sum / count);
    }

    return result;
}

// Mettre à jour la dérivée en temps réel (appelé quand le slider bouge)
function updateDerivativeRealtime() {
    const sourceChannelIndex = parseInt(document.getElementById('derivative-source-channel').value);
    const windowSize = parseInt(document.getElementById('derivative-smoothing').value);
    const colorBtn = document.getElementById('derivative-channel-color-btn');
    const color = colorBtn ? colorBtn.dataset.colorValue : '#FF6B35';
    const name = document.getElementById('derivative-channel-name').value.trim();

    // Si aucun canal source n'est sélectionné, ne rien faire
    if (isNaN(sourceChannelIndex) || sourceChannelIndex < 0) {
        return;
    }

    // Si on est en mode édition, mettre à jour le canal existant
    if (currentEditingDerivativeId) {
        const channel = appState.derivativeChannels.find(ch => ch.id === currentEditingDerivativeId);
        if (channel) {
            // Recalculer la dérivée
            const sourceData = appState.allColumnData[channel.sourceIndex];
            const xData = appState.allColumnData[0]; // Temps (toujours en index 0)

            // Étape 1 : Calculer la dérivée brute
            let derivativeData = calculateDerivative(Array.from(sourceData), Array.from(xData));

            // Étape 2 : Appliquer le lissage si windowSize > 0
            if (windowSize > 0) {
                derivativeData = movingAverageDerivative(derivativeData, windowSize);
            }

            // Mettre à jour le canal dérivé
            channel.smoothing = windowSize;
            channel.data = derivativeData;
            channel.color = color;
            channel.name = name;
            channel.label = name;

            // Trouver l'index dans allColumnData
            const availableCol = appState.availableColumns.find(col => col.derivativeId === currentEditingDerivativeId);
            if (availableCol) {
                // Mettre à jour les données dans allColumnData
                appState.allColumnData[availableCol.index] = new Float32Array(derivativeData);

                // Mettre à jour la couleur dans channelConfig
                const channelConfigEntry = appState.channelConfig.find(cfg => cfg.index === availableCol.index);
                if (channelConfigEntry) {
                    channelConfigEntry.color = color;
                    channelConfigEntry.label = name;
                    channelConfigEntry.name = name;
                }
            }

            // Mettre à jour la liste affichée
            updateDerivativeChannelsList();

            // Rafraîchir le graphique
            updateTimeChart();
        }
    }
}

// Créer ou mettre à jour un canal dérivé
function createDerivativeChannel() {
    const sourceChannelSelect = document.getElementById('derivative-source-channel');
    const sourceChannelIndex = parseInt(sourceChannelSelect.value);
    const nameInput = document.getElementById('derivative-channel-name');
    const smoothingInput = document.getElementById('derivative-smoothing');
    const colorBtn = document.getElementById('derivative-channel-color-btn');
    const createBtn = document.querySelector('#derivative-content button[onclick="createDerivativeChannel()"]');

    // Validation
    if (isNaN(sourceChannelIndex) || sourceChannelIndex < 0) {
        alert(t('errors.select_channel'));
        return;
    }

    const name = nameInput.value.trim() || `Dérivée ${sourceChannelSelect.options[sourceChannelSelect.selectedIndex].text}`;
    const smoothing = parseInt(smoothingInput.value) || 0;
    const color = colorBtn.dataset.colorValue || '#FF6B35';

    // Mode édition
    if (currentEditingDerivativeId) {
        const channel = appState.derivativeChannels.find(ch => ch.id === currentEditingDerivativeId);
        if (channel) {
            // Sortir du mode édition
            currentEditingDerivativeId = null;
            createBtn.innerHTML = '<i class="fas fa-plus-circle"></i> <span data-i18n="labels.create">Créer</span>';

            // Réinitialiser le formulaire
            sourceChannelSelect.value = '';
            nameInput.value = '';
            smoothingInput.value = '0';
            document.getElementById('derivative-smoothing-value').textContent = '0';

            updateDerivativeChannelsList();
            return;
        }
    }

    // Calculer la dérivée
    const sourceData = appState.allColumnData[sourceChannelIndex];
    const xData = appState.allColumnData[0]; // Temps

    if (!sourceData || !xData) {
        alert('Erreur: données source introuvables');
        return;
    }

    // Étape 1 : Calculer la dérivée brute
    let derivativeData = calculateDerivative(Array.from(sourceData), Array.from(xData));

    // Étape 2 : Appliquer le lissage si smoothing > 0
    if (smoothing > 0) {
        derivativeData = movingAverageDerivative(derivativeData, smoothing);
    }

    // Extraire l'unité du canal source
    const sourceColumn = appState.availableColumns.find(col => col.index === sourceChannelIndex);
    let sourceUnit = '';
    if (sourceColumn && sourceColumn.label) {
        // Extraire l'unité entre parenthèses : "S1: P1 (bar)" → "bar"
        const unitMatch = sourceColumn.label.match(/\(([^)]+)\)/);
        sourceUnit = unitMatch ? unitMatch[1] : '';
    }

    // Déterminer l'unité de l'axe X (temps ou autre canal)
    let xUnit = 's'; // Par défaut : secondes
    if (appState.xAxisChannel && appState.xAxisChannel > 0) {
        const xColumn = appState.availableColumns[appState.xAxisChannel - 1];
        if (xColumn && xColumn.label) {
            const xUnitMatch = xColumn.label.match(/\(([^)]+)\)/);
            xUnit = xUnitMatch ? xUnitMatch[1] : '';
        }
    }

    // Calculer l'unité dérivée : unité_Y/unité_X
    const derivativeUnit = sourceUnit ? `${sourceUnit}/${xUnit}` : `1/${xUnit}`;

    // Créer un nouveau canal
    const newChannel = {
        id: Date.now(),
        name: name,
        label: name,
        sourceIndex: sourceChannelIndex,
        sourceName: sourceColumn?.label || 'Unknown',
        smoothing: smoothing,
        color: color,
        data: derivativeData,
        unit: derivativeUnit
    };

    // Ajouter aux canaux dérivés
    appState.derivativeChannels.push(newChannel);

    // Ajouter à allColumnData
    const newDataIndex = appState.allColumnData.length;
    appState.allColumnData.push(new Float32Array(derivativeData));

    // Ajouter à availableColumns
    appState.availableColumns.push({
        index: newDataIndex,
        label: name,
        unit: derivativeUnit,
        isDerivative: true,
        derivativeId: newChannel.id
    });

    // Ajouter à channelConfig pour l'affichage
    const yAxisIndex = appState.channelConfig.length;
    appState.channelConfig.push({
        index: newDataIndex,
        name: name,
        label: name,
        unit: derivativeUnit,
        color: color,
        visible: true,
        yAxisID: `y${yAxisIndex}`,
        isDerivative: true,
        derivativeId: newChannel.id
    });

    // Réinitialiser le formulaire
    sourceChannelSelect.value = '';
    nameInput.value = '';
    smoothingInput.value = '0';
    document.getElementById('derivative-smoothing-value').textContent = '0';

    // Mettre à jour l'affichage
    updateDerivativeChannelsList();
    updateTimeChart();
    updateChannelConfigUI();

    // Rafraîchir la liste des canaux sources dans l'outil Lissage
    if (typeof populateSmoothedChannelSelector === 'function') {
        populateSmoothedChannelSelector();
    }

    console.log(`✅ Canal dérivé créé: ${name} (lissage: ${smoothing} points)`);
}

// Mettre à jour la liste des canaux dérivés
function updateDerivativeChannelsList() {
    const listContainer = document.getElementById('derivative-channels-list');
    const itemsContainer = document.getElementById('derivative-channels-items');

    if (!listContainer || !itemsContainer) return;

    if (appState.derivativeChannels.length === 0) {
        listContainer.style.display = 'none';
        return;
    }

    listContainer.style.display = 'block';
    itemsContainer.innerHTML = '';

    appState.derivativeChannels.forEach((channel, index) => {
        const channelConfig = appState.channelConfig.find(cfg => cfg.derivativeId === channel.id);
        const isVisible = channelConfig ? channelConfig.visible : true;

        const item = document.createElement('div');
        item.style.cssText = 'padding:8px; margin-bottom:5px; background:var(--bg-secondary); border-radius:4px; border-left:4px solid ' + channel.color;

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <strong style="font-size:0.85em;">${channel.name}</strong>
                <div style="display:flex; gap:5px;">
                    <button onclick="toggleDerivativeChannelVisibility(${channel.id})"
                            style="padding:3px 6px; background:none; border:1px solid var(--border-color); border-radius:3px; cursor:pointer; font-size:0.75em;">
                        <i class="fas fa-eye${isVisible ? '' : '-slash'}" style="color:${isVisible ? 'var(--accent-green)' : 'var(--text-muted)'}"></i>
                    </button>
                    <button onclick="editDerivativeChannel(${index})"
                            style="padding:3px 6px; background:none; border:1px solid var(--border-color); border-radius:3px; cursor:pointer; font-size:0.75em;">
                        <i class="fas fa-edit" style="color:var(--accent-blue)"></i>
                    </button>
                    <button onclick="deleteDerivativeChannel(${channel.id})"
                            style="padding:3px 6px; background:none; border:1px solid var(--border-color); border-radius:3px; cursor:pointer; font-size:0.75em;">
                        <i class="fas fa-trash" style="color:var(--accent-red)"></i>
                    </button>
                </div>
            </div>
            <div style="font-size:0.7em; color:var(--text-muted);">
                Source: ${channel.sourceName} | Lissage: ${channel.smoothing} pts
            </div>
        `;

        itemsContainer.appendChild(item);
    });
}

// Activer/Désactiver la visibilité d'un canal dérivé
function toggleDerivativeChannelVisibility(channelId) {
    const channel = appState.derivativeChannels.find(ch => ch.id === channelId);
    if (!channel) return;

    const channelConfig = appState.channelConfig.find(cfg => cfg.derivativeId === channelId);
    if (channelConfig) {
        channelConfig.visible = !channelConfig.visible;
        updateTimeChart();
        updateDerivativeChannelsList();
    }
}

// Éditer un canal dérivé
function editDerivativeChannel(index) {
    const channel = appState.derivativeChannels[index];
    if (!channel) return;

    // Passer en mode édition
    currentEditingDerivativeId = channel.id;

    // Remplir le formulaire
    document.getElementById('derivative-source-channel').value = channel.sourceIndex;
    document.getElementById('derivative-channel-name').value = channel.name;
    document.getElementById('derivative-smoothing').value = channel.smoothing;
    document.getElementById('derivative-smoothing-value').textContent = channel.smoothing;
    document.getElementById('derivative-channel-color-btn').dataset.colorValue = channel.color;
    document.getElementById('derivative-channel-color-btn').style.background = channel.color;

    // Changer le bouton "Créer" en "Sauvegarder"
    const createBtn = document.querySelector('#derivative-content button[onclick="createDerivativeChannel()"]');
    createBtn.innerHTML = '<i class="fas fa-save"></i> <span data-i18n="labels.save">Sauvegarder</span>';

    console.log(`📝 Édition du canal dérivé: ${channel.name}`);
}

// Supprimer un canal dérivé
function deleteDerivativeChannel(channelId) {
    const channel = appState.derivativeChannels.find(ch => ch.id === channelId);
    if (!channel) return;

    if (!confirm(`Supprimer le canal dérivé "${channel.name}" ?`)) {
        return;
    }

    // Trouver l'index dans availableColumns
    const availableCol = appState.availableColumns.find(col => col.derivativeId === channelId);
    if (availableCol) {
        const dataIndex = availableCol.index;

        // Supprimer de channelConfig
        const configIndex = appState.channelConfig.findIndex(cfg => cfg.index === dataIndex);
        if (configIndex !== -1) {
            appState.channelConfig.splice(configIndex, 1);
        }

        // Supprimer de availableColumns
        const colIndex = appState.availableColumns.findIndex(col => col.index === dataIndex);
        if (colIndex !== -1) {
            appState.availableColumns.splice(colIndex, 1);
        }

        // Ne pas supprimer de allColumnData (pour garder les index cohérents)
        // Mais on peut le marquer comme null
        appState.allColumnData[dataIndex] = null;
    }

    // Supprimer de derivativeChannels
    const index = appState.derivativeChannels.findIndex(ch => ch.id === channelId);
    if (index !== -1) {
        appState.derivativeChannels.splice(index, 1);
    }

    // Mettre à jour l'affichage
    updateDerivativeChannelsList();
    updateTimeChart();
    updateChannelConfigUI();

    // Rafraîchir la liste des canaux sources dans l'outil Lissage
    if (typeof populateSmoothedChannelSelector === 'function') {
        populateSmoothedChannelSelector();
    }

    console.log(`🗑️ Canal dérivé supprimé: ${channel.name}`);
}

// Peupler la liste des canaux sources
function populateDerivativeSourceChannels() {
    const select = document.getElementById('derivative-source-channel');
    if (!select) return;

    // Vider la liste
    select.innerHTML = '<option value="">-- Sélectionner --</option>';

    // Ajouter TOUS les canaux disponibles (y compris les canaux dérivés)
    // Cela permet de calculer des dérivées secondes, tierces, etc.
    if (appState.availableColumns && appState.availableColumns.length > 0) {
        appState.availableColumns.forEach(col => {
            // Permettre TOUS les canaux : bruts, lissés, calculés ET dérivés
            // Dérivée d'une dérivée = dérivée seconde (ex: accélération)
            const option = document.createElement('option');
            option.value = col.index;
            option.textContent = col.label || col.name;
            select.appendChild(option);
        });
    }
}

// Initialiser le système de dérivée (appelé après le chargement d'un fichier)
function initDerivativeSystem() {
    populateDerivativeSourceChannels();
    updateDerivativeChannelsList();
}

// Recréer un canal dérivé à partir de ses paramètres sauvegardés
function recreateDerivativeChannel(channel) {
    console.log(`🔄 Recréation du canal dérivé: ${channel.name}`);

    // Vérifier que le canal source existe
    if (!appState.allColumnData || !appState.allColumnData[channel.sourceIndex]) {
        console.error(`⚠️ Canal source ${channel.sourceIndex} introuvable pour ${channel.name}`);
        return;
    }

    // Obtenir les données du canal source
    const sourceData = appState.allColumnData[channel.sourceIndex];
    const xData = appState.allColumnData[0]; // Temps

    if (!sourceData || !xData) {
        console.error(`⚠️ Données source introuvables pour ${channel.name}`);
        return;
    }

    // Étape 1 : Calculer la dérivée brute
    let derivativeData = calculateDerivative(Array.from(sourceData), Array.from(xData));

    // Étape 2 : Appliquer le lissage si smoothing > 0
    if (channel.smoothing > 0) {
        derivativeData = movingAverageDerivative(derivativeData, channel.smoothing);
    }

    // Déterminer l'unité dérivée
    let derivativeUnit = channel.unit; // Utiliser l'unité sauvegardée si disponible

    // Si pas d'unité sauvegardée (anciens fichiers), la recalculer
    if (!derivativeUnit) {
        const sourceColumn = appState.availableColumns.find(col => col.index === channel.sourceIndex);
        let sourceUnit = '';
        if (sourceColumn && sourceColumn.label) {
            const unitMatch = sourceColumn.label.match(/\(([^)]+)\)/);
            sourceUnit = unitMatch ? unitMatch[1] : '';
        }

        let xUnit = 's'; // Par défaut : secondes
        if (appState.xAxisChannel && appState.xAxisChannel > 0) {
            const xColumn = appState.availableColumns[appState.xAxisChannel - 1];
            if (xColumn && xColumn.label) {
                const xUnitMatch = xColumn.label.match(/\(([^)]+)\)/);
                xUnit = xUnitMatch ? xUnitMatch[1] : '';
            }
        }

        derivativeUnit = sourceUnit ? `${sourceUnit}/${xUnit}` : `1/${xUnit}`;
    }

    // Ajouter à allColumnData
    const newDataIndex = appState.allColumnData.length;
    appState.allColumnData.push(new Float32Array(derivativeData));

    // Ajouter à availableColumns
    appState.availableColumns.push({
        index: newDataIndex,
        label: channel.label,
        name: channel.name,
        unit: derivativeUnit,
        isDerivative: true,
        derivativeId: channel.id
    });

    // Ajouter à channelConfig pour l'affichage
    const yAxisIndex = appState.channelConfig.length;
    appState.channelConfig.push({
        index: newDataIndex,
        name: channel.name,
        label: channel.label,
        unit: derivativeUnit,
        color: channel.color,
        visible: true,
        yAxisID: `y${yAxisIndex}`,
        yAxisPosition: 'right',
        yMin: null,
        yMax: null,
        showFFT: false,
        isDerivative: true,
        derivativeId: channel.id
    });

    // Mettre à jour les données du canal dans appState.derivativeChannels
    channel.data = derivativeData;

    console.log(`✅ Canal dérivé recréé: ${channel.name}`);
}

console.log('✅ Module derivative-channel.js chargé');
