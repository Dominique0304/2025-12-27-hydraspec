// =====================================
// SYSTÈME DE LISSAGE DE CANAUX
// =====================================

// Stockage des canaux lissés
if (!appState.smoothedChannels) {
    appState.smoothedChannels = [];
}

// ID du canal en cours d'édition (pour mise à jour temps réel)
let currentEditingChannelId = null;

// Toggle accordéon Lissage de Canal
function toggleSmoothing() {
    const content = document.getElementById('smoothing-content');
    const icon = document.getElementById('smoothing-toggle-icon');

    if (content && icon) {
        const isVisible = content.style.display !== 'none';

        if (!isVisible) {
            // Désactiver les autres outils
            if (typeof deactivateOtherTools === 'function') {
                deactivateOtherTools('smoothing');
            }

            // Fermer les autres sous-accordéons d'Outils
            if (typeof closeOtherToolAccordions === 'function') {
                closeOtherToolAccordions('smoothing');
            }
        }

        content.style.display = isVisible ? 'none' : 'block';
        icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    }
}

// Fonction de moyenne glissante (moving average)
function movingAverage(data, windowSize) {
    if (!data || data.length === 0) return [];
    if (windowSize < 1) windowSize = 1;
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

// Mettre à jour le lissage en temps réel (appelé quand le slider bouge)
function updateSmoothingRealtime() {
    const sourceChannelIndex = parseInt(document.getElementById('smooth-source-channel').value);
    const windowSize = parseInt(document.getElementById('smooth-points').value);
    const colorBtn = document.getElementById('smooth-channel-color-btn');
    const color = colorBtn ? colorBtn.dataset.colorValue : '#FF6B00';
    const name = document.getElementById('smooth-channel-name').value.trim();

    // Si aucun canal source n'est sélectionné, ne rien faire
    if (isNaN(sourceChannelIndex) || sourceChannelIndex < 0) {
        return;
    }

    // Si on est en mode édition, mettre à jour le canal existant
    if (currentEditingChannelId) {
        const channel = appState.smoothedChannels.find(ch => ch.id === currentEditingChannelId);
        if (channel) {
            // Recalculer les données lissées
            const sourceData = appState.allColumnData[channel.sourceIndex];
            const smoothedData = movingAverage(Array.from(sourceData), windowSize);

            // Mettre à jour le canal lissé
            channel.windowSize = windowSize;
            channel.data = smoothedData;
            channel.color = color;
            channel.name = name;
            channel.label = name;

            // Trouver l'index dans allColumnData
            const availableCol = appState.availableColumns.find(col => col.smoothedId === currentEditingChannelId);
            if (availableCol) {
                // Mettre à jour les données dans allColumnData
                appState.allColumnData[availableCol.index] = new Float32Array(smoothedData);

                // Mettre à jour la config
                const config = appState.channelConfig.find(cfg => cfg.smoothedId === currentEditingChannelId);
                if (config) {
                    config.color = color;
                    config.name = name;
                    config.label = name;
                }
            }

            // Mettre à jour l'affichage
            updateSmoothedChannelsList();
            updateTimeChart();
        }
    }
}

// Créer un nouveau canal lissé
function createSmoothedChannel() {
    const sourceChannelIndex = parseInt(document.getElementById('smooth-source-channel').value);
    let name = document.getElementById('smooth-channel-name').value.trim();
    const colorBtn = document.getElementById('smooth-channel-color-btn');
    const color = colorBtn ? colorBtn.dataset.colorValue : '#FF6B00';
    const windowSize = parseInt(document.getElementById('smooth-points').value);

    // Si on est en mode édition, simplement sortir du mode édition
    if (currentEditingChannelId) {
        currentEditingChannelId = null;

        // Restaurer le texte du bouton
        const createBtn = document.querySelector('button[onclick="createSmoothedChannel()"]');
        if (createBtn) {
            createBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Créer';
        }

        // Réinitialiser le formulaire
        document.getElementById('smooth-channel-name').value = '';
        document.getElementById('smooth-points').value = '50';
        document.getElementById('smooth-points-value').textContent = '50';

        setStatus('✅ Modifications sauvegardées');
        return;
    }

    // Validation
    if (isNaN(sourceChannelIndex) || sourceChannelIndex < 0) {
        setStatus('⚠️ Veuillez sélectionner un canal source');
        return;
    }

    // Vérifier que le canal source existe
    if (!appState.allColumnData || !appState.allColumnData[sourceChannelIndex]) {
        setStatus('⚠️ Canal source invalide');
        return;
    }

    // Obtenir les données du canal source
    const sourceData = appState.allColumnData[sourceChannelIndex];
    const sourceColumn = appState.availableColumns.find(col => col.index === sourceChannelIndex);

    if (!sourceColumn) {
        setStatus('⚠️ Impossible de trouver les informations du canal source');
        return;
    }

    // Si pas de nom fourni, générer automatiquement
    if (!name) {
        const baseName = sourceColumn.label + ' lissage';
        name = baseName;

        // Vérifier si un canal avec ce nom existe déjà
        let index = 1;
        while (appState.channelConfig.some(cfg => cfg.name === name) ||
               appState.smoothedChannels.some(ch => ch.name === name)) {
            name = baseName + ' ' + index;
            index++;
        }
    }

    // Calculer les données lissées
    const smoothedData = movingAverage(Array.from(sourceData), windowSize);

    // Créer un nouvel ID unique pour le canal lissé
    const smoothedId = `smoothed_${Date.now()}`;

    // Créer l'objet canal lissé
    const smoothedChannel = {
        id: smoothedId,
        name: name,
        label: name,
        color: color,
        sourceIndex: sourceChannelIndex,
        sourceName: sourceColumn.name,
        windowSize: windowSize,
        data: smoothedData,
        visible: true,
        unit: sourceColumn.unit || ''
    };

    // Ajouter au tableau des canaux lissés
    appState.smoothedChannels.push(smoothedChannel);

    // Ajouter aux données de colonnes (pour affichage)
    const newIndex = appState.allColumnData.length;
    appState.allColumnData.push(new Float32Array(smoothedData));
    appState.availableColumns.push({
        index: newIndex,
        name: name,
        label: name,
        unit: sourceColumn.unit || '',
        isSmoothed: true,
        smoothedId: smoothedId
    });

    // Trouver la config du canal source pour copier ses valeurs Y min/max
    const sourceConfig = appState.channelConfig.find(cfg => cfg.index === sourceChannelIndex);
    const sourceYMin = sourceConfig ? sourceConfig.yMin : null;
    const sourceYMax = sourceConfig ? sourceConfig.yMax : null;

    // Ajouter à la configuration des canaux
    const yAxisIndex = appState.channelConfig.length;
    appState.channelConfig.push({
        index: newIndex,
        name: name,
        label: name,
        unit: sourceColumn.unit || '',
        color: color,
        visible: true,
        lineWidth: 1.5,  // Ligne un peu plus épaisse pour les canaux lissés
        yAxisPosition: 'right',
        yMin: sourceYMin,  // Copie du canal source
        yMax: sourceYMax,  // Copie du canal source
        yAxisID: `y${yAxisIndex}`,
        showFFT: false,
        isSmoothed: true,
        smoothedId: smoothedId
    });

    // Mettre à jour l'interface
    updateSmoothedChannelsList();
    updateTimeChart();

    // Rafraîchir la liste des canaux sources dans l'outil Dérivée
    if (typeof populateDerivativeSourceChannels === 'function') {
        populateDerivativeSourceChannels();
    }

    // Réinitialiser le formulaire
    document.getElementById('smooth-channel-name').value = '';
    document.getElementById('smooth-points').value = '50';
    document.getElementById('smooth-points-value').textContent = '50';

    setStatus(`✅ Canal lissé "${name}" créé avec succès`);
}

// Mettre à jour la liste des canaux lissés
function updateSmoothedChannelsList() {
    const listContainer = document.getElementById('smoothed-channels-list');
    const itemsContainer = document.getElementById('smoothed-channels-items');

    if (!appState.smoothedChannels || appState.smoothedChannels.length === 0) {
        listContainer.style.display = 'none';
        return;
    }

    listContainer.style.display = 'block';
    itemsContainer.innerHTML = '';

    appState.smoothedChannels.forEach((channel, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'margin-bottom:8px; padding:8px; background:var(--bg-secondary); border-radius:4px; border-left:4px solid ' + channel.color;

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <div style="font-weight:bold; color:var(--text-main); font-size:0.9em;">
                    ${channel.name}
                </div>
                <div style="display:flex; gap:4px;">
                    <button onclick="editSmoothedChannel('${channel.id}')"
                            style="padding:4px 8px; background:var(--accent-blue); color:white; border:none; border-radius:3px; cursor:pointer; font-size:0.75em;"
                            title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteSmoothedChannel('${channel.id}')"
                            style="padding:4px 8px; background:var(--accent-red); color:white; border:none; border-radius:3px; cursor:pointer; font-size:0.75em;"
                            title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div style="font-size:0.75em; color:var(--text-muted);">
                Source: ${channel.sourceName} | Points: ${channel.windowSize}
            </div>
        `;

        itemsContainer.appendChild(item);
    });
}

// Modifier un canal lissé existant
function editSmoothedChannel(channelId) {
    const channel = appState.smoothedChannels.find(ch => ch.id === channelId);
    if (!channel) {
        setStatus(t("status.smoothed_channel_not_found"));
        return;
    }

    // Activer le mode édition
    currentEditingChannelId = channelId;

    // Remplir le formulaire avec les valeurs actuelles
    document.getElementById('smooth-source-channel').value = channel.sourceIndex;
    document.getElementById('smooth-channel-name').value = channel.name;
    const colorBtn = document.getElementById('smooth-channel-color-btn');
    if (colorBtn) {
        colorBtn.dataset.colorValue = channel.color;
        colorBtn.style.backgroundColor = channel.color;
    }
    document.getElementById('smooth-points').value = channel.windowSize;
    document.getElementById('smooth-points-value').textContent = channel.windowSize;

    // Changer le texte du bouton
    const createBtn = document.querySelector('button[onclick="createSmoothedChannel()"]');
    if (createBtn) {
        createBtn.innerHTML = '<i class="fas fa-check"></i> Sauvegarder';
    }

    setStatus(`📝 Modification du canal "${channel.name}" - bougez le slider pour voir les changements en temps réel`);
}

// Supprimer un canal lissé
function deleteSmoothedChannel(channelId, silent = false) {
    const channelIndex = appState.smoothedChannels.findIndex(ch => ch.id === channelId);
    if (channelIndex === -1) {
        if (!silent) setStatus(t("status.smoothed_channel_not_found"));
        return;
    }

    const channel = appState.smoothedChannels[channelIndex];
    const channelName = channel.name;

    // Supprimer du tableau des canaux lissés
    appState.smoothedChannels.splice(channelIndex, 1);

    // Trouver et supprimer de availableColumns
    const availableColIndex = appState.availableColumns.findIndex(col => col.smoothedId === channelId);
    if (availableColIndex !== -1) {
        const dataIndex = appState.availableColumns[availableColIndex].index;

        // Supprimer de availableColumns
        appState.availableColumns.splice(availableColIndex, 1);

        // Supprimer de allColumnData
        appState.allColumnData.splice(dataIndex, 1);

        // Réindexer les colonnes suivantes
        for (let i = availableColIndex; i < appState.availableColumns.length; i++) {
            appState.availableColumns[i].index--;
        }

        // Supprimer de channelConfig
        const configIndex = appState.channelConfig.findIndex(cfg => cfg.smoothedId === channelId);
        if (configIndex !== -1) {
            appState.channelConfig.splice(configIndex, 1);
        }

        // Réindexer channelConfig
        for (let i = configIndex; i < appState.channelConfig.length; i++) {
            appState.channelConfig[i].index--;
        }
    }

    // Mettre à jour l'interface
    updateSmoothedChannelsList();
    updateTimeChart();
    updateChannelConfigUI();

    // Rafraîchir la liste des canaux sous l'accordéon "Canal"
    if (typeof updateCanalQuickView === 'function') {
        updateCanalQuickView();
    }
    if (typeof updateFFTCanalQuickView === 'function') {
        updateFFTCanalQuickView();
    }

    // Mettre à jour la liste disponible des canaux (important!)
    if (typeof updateAvailableChannelsList === 'function') {
        updateAvailableChannelsList();
    }

    // Rafraîchir la liste des canaux sources dans l'outil Dérivée
    if (typeof populateDerivativeSourceChannels === 'function') {
        populateDerivativeSourceChannels();
    }

    if (!silent) {
        setStatus(`🗑️ Canal lissé "${channelName}" supprimé`);
    }
}

// Peupler le sélecteur de canal source
function populateSmoothedChannelSelector() {
    const select = document.getElementById('smooth-source-channel');
    if (!select) return;

    // Vider le sélecteur
    select.innerHTML = '<option value="">-- Sélectionner --</option>';

    // Ajouter uniquement les canaux réels (pas les canaux lissés)
    if (appState.availableColumns && appState.availableColumns.length > 0) {
        appState.availableColumns.forEach(col => {
            if (!col.isSmoothed) {
                const option = document.createElement('option');
                option.value = col.index;
                option.textContent = col.label || col.name;
                select.appendChild(option);
            }
        });
    }
}

// Initialiser le système de lissage (appelé après le chargement d'un fichier)
function initSmoothingSystem() {
    populateSmoothedChannelSelector();
    updateSmoothedChannelsList();
}

// Recréer un canal lissé à partir de ses paramètres sauvegardés
function recreateSmoothedChannel(channel) {
    console.log(`🔄 Recréation du canal lissé: ${channel.name}`);

    // Vérifier que le canal source existe
    if (!appState.allColumnData || !appState.allColumnData[channel.sourceIndex]) {
        console.error(`⚠️ Canal source ${channel.sourceIndex} introuvable pour ${channel.name}`);
        return;
    }

    // Obtenir les données du canal source
    const sourceData = appState.allColumnData[channel.sourceIndex];
    const sourceColumn = appState.availableColumns.find(col => col.index === channel.sourceIndex);

    if (!sourceColumn) {
        console.error(`⚠️ Informations du canal source introuvables pour ${channel.name}`);
        return;
    }

    // Recalculer les données lissées
    const smoothedData = movingAverage(Array.from(sourceData), channel.windowSize);

    // Ajouter aux données de colonnes
    const newIndex = appState.allColumnData.length;
    appState.allColumnData.push(new Float32Array(smoothedData));
    appState.availableColumns.push({
        index: newIndex,
        name: channel.name,
        label: channel.label,
        unit: sourceColumn.unit || '',
        isSmoothed: true,
        smoothedId: channel.id
    });

    // Trouver la config du canal source pour copier ses valeurs Y min/max
    const sourceConfig = appState.channelConfig.find(cfg => cfg.index === channel.sourceIndex);
    const sourceYMin = sourceConfig ? sourceConfig.yMin : null;
    const sourceYMax = sourceConfig ? sourceConfig.yMax : null;

    // Ajouter à la configuration des canaux
    const yAxisIndex = appState.channelConfig.length;
    appState.channelConfig.push({
        index: newIndex,
        name: channel.name,
        label: channel.label,
        unit: sourceColumn.unit || '',
        color: channel.color,
        visible: channel.visible !== undefined ? channel.visible : true,
        lineWidth: 1.5,
        yAxisPosition: 'right',
        yMin: sourceYMin,
        yMax: sourceYMax,
        yAxisID: `y${yAxisIndex}`,
        showFFT: false,
        isSmoothed: true,
        smoothedId: channel.id
    });

    // Mettre à jour les données du canal dans appState.smoothedChannels
    channel.data = smoothedData;

    console.log(`✅ Canal lissé recréé: ${channel.name}`);
}
