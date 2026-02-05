// =====================================
// GESTIONNAIRE DE VUES SAUVEGARDÉES
// =====================================
// Permet de capturer et restaurer l'état complet du graphique
// (zoom, canaux visibles, positions, etc.)

const viewsState = {
    views: [],
    nextId: 1
};

// =====================================
// TOGGLE ACCORDÉON
// =====================================

function toggleViews() {
    const content = document.getElementById('views-content');
    const icon = document.getElementById('views-toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

// =====================================
// CAPTURER L'ÉTAT ACTUEL
// =====================================

function captureCurrentState() {
    const chart = appState.charts?.time;
    if (!chart) {
        console.error('❌ Aucun graphique disponible');
        return null;
    }

    // Capturer le zoom temporel (axe X)
    const xScale = chart.scales.x;
    const timeZoom = {
        min: xScale.min / 1000, // Convertir ms → s
        max: xScale.max / 1000
    };

    // Capturer le zoom Y du canal actuel
    const yScale = chart.scales.y;
    const yZoom = {
        min: yScale.min,
        max: yScale.max
    };

    // Capturer l'état des graphiques Freq/Spectro
    const state = {
        id: Date.now(),
        name: `Vue ${viewsState.nextId}`,
        createdAt: new Date().toLocaleString('fr-FR'),
        timeZoom: timeZoom,
        yZoom: yZoom,
        currentChannel: appState.currentColumnIndex || 0,
        channelLabel: appState.yAxisLabel || 'Canal',
        freqVisible: uiState.freqVisible || false,
        spectroVisible: uiState.spectroVisible || false
    };

    // Capturer la visibilité de chaque canal
    if (appState.channelConfig && appState.channelConfig.length > 0) {
        state.channelVisibility = appState.channelConfig.map(config => ({
            index: config.index,
            label: config.label,
            visible: config.visible
        }));
        console.log('📊 Canaux capturés:', state.channelVisibility);
    }

    // Capturer la visibilité de chaque marqueur (SnapPoint)
    if (typeof snapPoints !== 'undefined' && snapPoints.length > 0) {
        state.snapPointsVisibility = snapPoints.map(sp => ({
            id: sp.id,
            visible: sp.visible !== false
        }));
        console.log('📍 Marqueurs capturés:', state.snapPointsVisibility.length);
    }

    // Capturer la visibilité de chaque interval
    if (typeof intervals !== 'undefined' && intervals.length > 0) {
        state.intervalsVisibility = intervals.map(interval => ({
            id: interval.id,
            visible: interval.visible !== false
        }));
        console.log('📏 Intervals capturés:', state.intervalsVisibility.length);
    }

    // Capturer la visibilité de chaque diff/canal
    if (typeof diffCanalIntervals !== 'undefined' && diffCanalIntervals.length > 0) {
        state.diffCanalVisibility = diffCanalIntervals.map(interval => ({
            id: interval.id,
            visible: interval.visible !== false
        }));
        console.log('🔀 Diff/Canal capturés:', state.diffCanalVisibility.length);
    }

    console.log('📸 État complet capturé:', state);
    return state;
}

// =====================================
// CRÉER UNE VUE
// =====================================

function createView() {
    const state = captureCurrentState();
    if (!state) {
        setStatus('Erreur: impossible de capturer l\'état', 'error');
        return;
    }

    viewsState.views.push(state);
    viewsState.nextId++;

    saveViewsToLocalStorage();
    renderViewsList();

    setStatus(`✅ Vue "${state.name}" créée`, 'success');
    console.log('✅ Vue créée:', state);
}

// =====================================
// AFFICHER UNE VUE (RESTAURER)
// =====================================

function displayView(viewId) {
    const view = viewsState.views.find(v => v.id === viewId);
    if (!view) {
        console.error('❌ Vue introuvable:', viewId);
        return;
    }

    console.log('👁️ Restauration de la vue:', view);

    const chart = appState.charts?.time;
    if (!chart) {
        setStatus('Erreur: aucun graphique disponible', 'error');
        return;
    }

    // Restaurer la visibilité des canaux
    if (view.channelVisibility && appState.channelConfig) {
        view.channelVisibility.forEach(savedChannel => {
            const config = appState.channelConfig.find(c => c.index === savedChannel.index);
            if (config) {
                config.visible = savedChannel.visible;
            }
        });
        // Rafraîchir le graphique multi-canaux
        if (typeof updateTimeChartMultiChannel === 'function') {
            updateTimeChartMultiChannel();
        }
        console.log('📊 Canaux restaurés');
    }

    // Restaurer le canal actif
    if (view.currentChannel !== appState.currentColumnIndex) {
        if (typeof changeCurrentColumn === 'function') {
            changeCurrentColumn(view.currentChannel);
        }
    }

    // Restaurer le zoom temporel (axe X)
    chart.options.scales.x.min = view.timeZoom.min * 1000; // s → ms
    chart.options.scales.x.max = view.timeZoom.max * 1000;

    // Restaurer le zoom Y
    chart.options.scales.y.min = view.yZoom.min;
    chart.options.scales.y.max = view.yZoom.max;

    // Mettre à jour le graphique
    chart.update('none');

    // Mettre à jour les champs T min/T max
    if (typeof updateZoomInputs === 'function') {
        updateZoomInputs();
    }

    // Restaurer l'état Fréquence/Spectro
    if (view.freqVisible !== uiState.freqVisible && typeof toggleFreqDomain === 'function') {
        toggleFreqDomain();
    }
    if (view.spectroVisible !== uiState.spectroVisible && typeof toggleSpectrogram === 'function') {
        toggleSpectrogram();
    }

    // Restaurer la visibilité des marqueurs (SnapPoints)
    if (view.snapPointsVisibility && typeof snapPoints !== 'undefined') {
        view.snapPointsVisibility.forEach(savedSp => {
            const sp = snapPoints.find(s => s.id === savedSp.id);
            if (sp) {
                sp.visible = savedSp.visible;
            }
        });
        if (typeof renderSnapPoints === 'function') {
            renderSnapPoints();
        }
        console.log('📍 Marqueurs restaurés');
    }

    // Restaurer la visibilité des intervals
    if (view.intervalsVisibility && typeof intervals !== 'undefined') {
        view.intervalsVisibility.forEach(savedInterval => {
            const interval = intervals.find(i => i.id === savedInterval.id);
            if (interval) {
                interval.visible = savedInterval.visible;
            }
        });
        if (typeof renderIntervals === 'function') {
            renderIntervals();
        }
        console.log('📏 Intervals restaurés');
    }

    // Restaurer la visibilité des diff/canal
    if (view.diffCanalVisibility && typeof diffCanalIntervals !== 'undefined') {
        view.diffCanalVisibility.forEach(savedDiff => {
            const diff = diffCanalIntervals.find(d => d.id === savedDiff.id);
            if (diff) {
                diff.visible = savedDiff.visible;
            }
        });
        if (typeof renderDiffCanalIntervals === 'function') {
            renderDiffCanalIntervals();
        }
        console.log('🔀 Diff/Canal restaurés');
    }

    setStatus(`✅ Vue "${view.name}" restaurée`, 'success');
    console.log('✅ Vue complètement restaurée');
}

// =====================================
// MODIFIER LE NOM D'UNE VUE
// =====================================

function editViewName(viewId) {
    const view = viewsState.views.find(v => v.id === viewId);
    if (!view) {
        console.error('❌ Vue introuvable:', viewId);
        return;
    }

    const newName = prompt(t('dialogs.new_view_name'), view.name);
    if (newName && newName.trim()) {
        view.name = newName.trim();
        saveViewsToLocalStorage();
        renderViewsList();
        setStatus(`✅ Vue renommée: "${view.name}"`, 'success');
    }
}

// =====================================
// SUPPRIMER UNE VUE
// =====================================

function deleteView(viewId) {
    const view = viewsState.views.find(v => v.id === viewId);
    if (!view) {
        console.error('❌ Vue introuvable:', viewId);
        return;
    }

    const index = viewsState.views.findIndex(v => v.id === viewId);
    viewsState.views.splice(index, 1);

    saveViewsToLocalStorage();
    renderViewsList();

    setStatus(`🗑️ Vue "${view.name}" supprimée`, 'info');
    console.log('🗑️ Vue supprimée:', view.name);
}

// =====================================
// AFFICHER LA LISTE DES VUES
// =====================================

function renderViewsList() {
    const listContainer = document.getElementById('views-list');
    const emptyMessage = document.getElementById('views-empty-message');

    if (!listContainer) {
        console.error('❌ Conteneur views-list introuvable');
        return;
    }

    // Vider la liste
    listContainer.innerHTML = '';

    if (viewsState.views.length === 0) {
        listContainer.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }

    listContainer.style.display = 'block';
    if (emptyMessage) emptyMessage.style.display = 'none';

    // Créer les éléments de la liste
    viewsState.views.forEach(view => {
        const viewElement = document.createElement('div');
        viewElement.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 8px;
        `;

        viewElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-weight: bold; font-size: 0.9rem; color: var(--text-main);">
                    📸 ${view.name}
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="displayView(${view.id})"
                            style="padding: 4px 8px; background: var(--accent-blue); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75rem;"
                            title="Afficher cette vue">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editViewName(${view.id})"
                            style="padding: 4px 8px; background: var(--accent-orange); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75rem;"
                            title="Modifier le nom">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button onclick="deleteView(${view.id})"
                            style="padding: 4px 8px; background: var(--accent-red); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.75rem;"
                            title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 6px;">
                🕒 ${view.createdAt}
            </div>

            <div style="font-size: 0.75rem; color: var(--text-main); line-height: 1.4;">
                <div>⏱️ T min: <strong>${view.timeZoom.min.toFixed(3)}s</strong> | T max: <strong>${view.timeZoom.max.toFixed(3)}s</strong></div>
                <div>📊 Canal: <strong>${view.channelLabel}</strong></div>
                ${view.freqVisible ? '<div>📈 Fréquence visible</div>' : ''}
                ${view.spectroVisible ? '<div>🌈 Spectrogramme visible</div>' : ''}
            </div>
        `;

        listContainer.appendChild(viewElement);
    });

    console.log(`✅ Liste des vues affichée (${viewsState.views.length} vue(s))`);
}

// =====================================
// STOCKAGE LOCALSTORAGE
// =====================================

function saveViewsToLocalStorage() {
    try {
        localStorage.setItem('hydraspec_views', JSON.stringify(viewsState));
        console.log('💾 Vues sauvegardées dans localStorage');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
}

function loadViewsFromLocalStorage() {
    try {
        const saved = localStorage.getItem('hydraspec_views');
        if (saved) {
            const data = JSON.parse(saved);
            viewsState.views = data.views || [];
            viewsState.nextId = data.nextId || 1;
            console.log(`✅ ${viewsState.views.length} vue(s) chargée(s) depuis localStorage`);
            renderViewsList();
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
    }
}

// =====================================
// INITIALISATION
// =====================================

// Charger les vues au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadViewsFromLocalStorage();
    console.log('✅ Gestionnaire de vues initialisé');
});
