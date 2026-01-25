console.log("Chargement de l'application...");
// --- TRANSLATIONS MOVED TO i18n.js ---


// Fonction debounce pour limiter les appels fréquents
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fonction throttle pour les événements de redimensionnement
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}


// --- STATE ---
let appState = {
    fs: 1000,
    fullDataTime: [],      
    fullDataPressure: [],
    cursorStart: 1.0,
    cursorEnd: 2.0,
    peakFreq: 0, 
    peakAmp: 0,
    rms: 0,
    allPeaks: [],
    charts: { time: null, freq: null, spectro: null },
    spectroData: null,
    lang: 'fr',
    isDragging: false,
    dragTarget: null,
    currentExportAction: null,
    timeIncrement: 1.0,
    fftTimeout: null,
    dragStartX: 0,
    dragStartCursorStart: 0,
    dragStartCursorEnd: 0,
    lastX: 0,
 // ... propriétés existantes ...
    yAxisLabel: "Pression (Bar)",
    availableColumns: [],       // Liste des colonnes disponibles {name, label, index}
    currentColumnIndex: 0,      // Index de la colonne active
    allColumnData: [],          // Données de toutes les colonnes [time, col1, col2, ...]
    columnNames: [],            // Noms des colonnes

    // Configuration multi-canaux
    channelConfig: [],          // Configuration de chaque canal {visible, color, yAxisPosition, yMin, yMax, yAxisID}
    xAxisChannel: 0             // Index du canal utilisé pour l'axe X (0 = temps par défaut)
};

let uiState = {
    timeVisible: true,
    freqVisible: false,
    spectroVisible: false,
    tooltipsEnabled: false  // Activer/désactiver les infos au survol
};

// Ajouter ces fonctions dans la section INIT (après window.onload)
function initToggleButtons() {
    // Initialiser l'état visuel des conteneurs selon uiState
    const timeContainer = document.getElementById('time-container');
    const freqContainer = document.getElementById('freq-container');
    const spectroContainer = document.getElementById('spectro-container');
    const fftParamsPanel = document.getElementById('fft-params-panel');
    const spectroParamsPanel = document.getElementById('spectro-params-panel');

    if (timeContainer) timeContainer.classList.toggle('hidden', !uiState.timeVisible);
    if (freqContainer) freqContainer.classList.toggle('hidden', !uiState.freqVisible);
    if (spectroContainer) spectroContainer.classList.toggle('hidden', !uiState.spectroVisible);
    if (fftParamsPanel) fftParamsPanel.classList.toggle('hidden', !uiState.freqVisible);
    if (spectroParamsPanel) spectroParamsPanel.classList.toggle('hidden', !uiState.spectroVisible);

    // Initialiser l'état des boutons
    updateToggleButtons();

    // Ajouter un raccourci clavier pour basculer tous les graphiques
    document.addEventListener('keydown', function(e) {
        // Ctrl+Alt+T : Basculer temps
        if (e.ctrlKey && e.altKey && e.key === 't') {
            e.preventDefault();
            toggleTimeDomain();
        }
        // Ctrl+Alt+F : Basculer fréquence
        if (e.ctrlKey && e.altKey && e.key === 'f') {
            e.preventDefault();
            toggleFreqDomain();
        }
        // Ctrl+Alt+S : Basculer spectrogramme
        if (e.ctrlKey && e.altKey && e.key === 's') {
            e.preventDefault();
            toggleSpectrogram();
        }
        // Ctrl+Alt+A : Basculer tout
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            toggleAllGraphs();
        }
    });
}

function updateToggleButtons() {
    const timeBtn = document.getElementById('toggle-time-btn');
    const freqBtn = document.getElementById('toggle-freq-btn');
    const spectroBtn = document.getElementById('toggle-spectro-btn');
    
    if (timeBtn) timeBtn.classList.toggle('active', uiState.timeVisible);
    if (freqBtn) freqBtn.classList.toggle('active', uiState.freqVisible);
    if (spectroBtn) spectroBtn.classList.toggle('active', uiState.spectroVisible);
    
    // Mettre à jour les tooltips
    if (timeBtn) {
        timeBtn.title = uiState.timeVisible ? 
            "Masquer le domaine temporel (Ctrl+Alt+T)" : 
            "Afficher le domaine temporel (Ctrl+Alt+T)";
    }
    if (freqBtn) {
        freqBtn.title = uiState.freqVisible ? 
            "Masquer le domaine fréquentiel (Ctrl+Alt+F)" : 
            "Afficher le domaine fréquentiel (Ctrl+Alt+F)";
    }
    if (spectroBtn) {
        spectroBtn.title = uiState.spectroVisible ? 
            "Masquer le spectrogramme (Ctrl+Alt+S)" : 
            "Afficher le spectrogramme (Ctrl+Alt+S)";
    }
}

function toggleTimeDomain() {
    uiState.timeVisible = !uiState.timeVisible;
    
    const timeContainer = document.getElementById('time-container');
    const resizer1 = document.getElementById('resizer1');
    
    if (timeContainer) {
        timeContainer.classList.toggle('hidden', !uiState.timeVisible);
    }
    if (resizer1) {
        resizer1.classList.toggle('hidden', !uiState.timeVisible);
    }
    
    updateToggleButtons();
    adjustPlotLayout();
    updateChartSizes();
    setStatus(uiState.timeVisible ? t("status.time_domain_shown") : t("status.time_domain_hidden"));
}

function toggleFreqDomain() {
    uiState.freqVisible = !uiState.freqVisible;

    const freqContainer = document.getElementById('freq-container');
    const fftParamsPanel = document.getElementById('fft-params-panel');
    const resizer1 = document.getElementById('resizer1');
    const resizer2 = document.getElementById('resizer2');

    if (freqContainer) {
        freqContainer.classList.toggle('hidden', !uiState.freqVisible);
    }

    // Masquer/afficher le panneau des paramètres FFT
    if (fftParamsPanel) {
        fftParamsPanel.classList.toggle('hidden', !uiState.freqVisible);
    }
    
    // Gérer les resizers selon quels graphiques sont visibles
    if (resizer1 && resizer2) {
        if (!uiState.timeVisible && uiState.freqVisible) {
            // Si temps masqué mais fréquence visible, on montre resizer2
            resizer1.classList.add('hidden');
            resizer2.classList.remove('hidden');
        } else if (uiState.timeVisible && !uiState.freqVisible) {
            // Si temps visible mais fréquence masquée, on cache resizer2
            resizer1.classList.remove('hidden');
            resizer2.classList.add('hidden');
        } else {
            // Sinon, état normal
            resizer1.classList.toggle('hidden', !uiState.timeVisible);
            resizer2.classList.toggle('hidden', !uiState.freqVisible);
        }
    }
    
    updateToggleButtons();
    adjustPlotLayout();
    updateChartSizes();
    setStatus(uiState.freqVisible ? t("status.freq_domain_shown") : t("status.freq_domain_hidden"));
}

function toggleSpectrogram() {
    uiState.spectroVisible = !uiState.spectroVisible;

    const spectroContainer = document.getElementById('spectro-container');
    const spectroParamsPanel = document.getElementById('spectro-params-panel');
    const resizer2 = document.getElementById('resizer2');

    if (spectroContainer) {
        spectroContainer.classList.toggle('hidden', !uiState.spectroVisible);
    }

    // Masquer/afficher le panneau des paramètres Spectrogramme
    if (spectroParamsPanel) {
        spectroParamsPanel.classList.toggle('hidden', !uiState.spectroVisible);
    }
    if (resizer2) {
        // Ne montrer resizer2 que si fréquence ET spectro sont visibles
        resizer2.classList.toggle('hidden', !(uiState.freqVisible && uiState.spectroVisible));
    }
    
    updateToggleButtons();
    adjustPlotLayout();
    updateChartSizes();
    setStatus(uiState.spectroVisible ? t("status.spectrogram_shown") : t("status.spectrogram_hidden"));
}

function toggleFFTParams() {
    const content = document.getElementById('fft-params-content');
    const icon = document.getElementById('fft-toggle-icon');

    if (content.style.display === 'none') {
        // Désactiver les autres outils
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('fft');
        }

        // Fermer tous les autres accordéons principaux
        if (typeof closeAllMainAccordions === 'function') {
            closeAllMainAccordions('fft');
        }

        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');

        // Mettre à jour les tableaux et sélecteurs
        if (typeof updateFFTCanalQuickView === 'function') {
            updateFFTCanalQuickView();
        }
        if (typeof updateFFTAnalysisChannelSelect === 'function') {
            updateFFTAnalysisChannelSelect();
        }
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function toggleSpectroParams() {
    const content = document.getElementById('spectro-params-content');
    const icon = document.getElementById('spectro-toggle-icon');

    if (content.style.display === 'none') {
        // Désactiver les autres outils
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('spectro');
        }

        // Fermer tous les autres accordéons principaux
        if (typeof closeAllMainAccordions === 'function') {
            closeAllMainAccordions('spectro');
        }

        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function toggleAcquisition() {
    const content = document.getElementById('acquisition-content');
    const icon = document.getElementById('acquisition-toggle-icon');

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

function toggleZoom() {
    const content = document.getElementById('zoom-content');
    const icon = document.getElementById('zoom-toggle-icon');

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

function toggleAnnotations() {
    const content = document.getElementById('annotations-content');
    const icon = document.getElementById('annotations-toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');

        // Désactiver le mode annotation quand on ferme l'accordéon
        if (typeof annotationState !== 'undefined' && annotationState.active) {
            toggleAnnotationMode(); // Désactiver le mode annotation
        }
    }
}

function toggleAcquisition() {
    const content = document.getElementById('acquisition-content');
    const icon = document.getElementById('acquisition-toggle-icon');

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

function toggleTools() {
    const content = document.getElementById('tools-content');
    const icon = document.getElementById('tools-toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');

        // Désactiver tous les outils quand on ferme l'accordéon
        deactivateAllTools();
    }
}

// Fonction pour activer/désactiver les tooltips
function toggleTooltipsEnabled() {
    const toggle = document.getElementById('tooltip-enabled-toggle');
    uiState.tooltipsEnabled = toggle ? toggle.checked : true;

    // Sauvegarder dans localStorage
    localStorage.setItem('tooltipsEnabled', uiState.tooltipsEnabled);

    // Appliquer aux graphiques existants
    if (appState.charts.time) {
        appState.charts.time.options.plugins.tooltip.enabled = uiState.tooltipsEnabled;
        appState.charts.time.update('none');
    }
    if (appState.charts.freq) {
        appState.charts.freq.options.plugins.tooltip.enabled = uiState.tooltipsEnabled;
        appState.charts.freq.update('none');
    }
    if (appState.charts.spectro) {
        appState.charts.spectro.options.plugins.tooltip.enabled = uiState.tooltipsEnabled;
        appState.charts.spectro.update('none');
    }

    console.log('Tooltips', uiState.tooltipsEnabled ? 'activés' : 'désactivés');
}

// Charger la préférence des tooltips au démarrage
function loadTooltipPreference() {
    const saved = localStorage.getItem('tooltipsEnabled');
    if (saved !== null) {
        uiState.tooltipsEnabled = saved === 'true';
    }

    // Toujours initialiser la checkbox avec la valeur actuelle de uiState
    const toggle = document.getElementById('tooltip-enabled-toggle');
    if (toggle) {
        toggle.checked = uiState.tooltipsEnabled;
    }

    // Appliquer l'état aux graphiques existants
    if (appState.charts && appState.charts.time) {
        appState.charts.time.options.plugins.tooltip.enabled = uiState.tooltipsEnabled;
        appState.charts.time.update('none');
    }
    if (appState.charts && appState.charts.freq) {
        appState.charts.freq.options.plugins.tooltip.enabled = uiState.tooltipsEnabled;
        appState.charts.freq.update('none');
    }
    if (appState.charts && appState.charts.spectro) {
        appState.charts.spectro.options.plugins.tooltip.enabled = uiState.tooltipsEnabled;
        appState.charts.spectro.update('none');
    }
}

// Désactiver tous les outils
function deactivateAllTools() {
    // Interval
    if (typeof isCreatingInterval !== 'undefined' && isCreatingInterval) {
        const btn = document.getElementById('btn-interval-main');
        const content = document.getElementById('interval-content');
        const icon = document.getElementById('interval-accordion-icon');

        isCreatingInterval = false;
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Diff/Canal
    if (typeof diffCanalState !== 'undefined' && diffCanalState.active) {
        const btn = document.getElementById('diff-canal-btn');
        const content = document.getElementById('diff-canal-content');
        const icon = btn ? btn.querySelector('.fa-chevron-up, .fa-chevron-down') : null;

        diffCanalState.active = false;
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Marqueur (SnapPoint)
    if (typeof snapPointState !== 'undefined' && snapPointState.active) {
        const btn = document.getElementById('snappoint-btn');
        const content = document.getElementById('snappoint-content');
        const icon = btn ? btn.querySelector('.fa-chevron-up, .fa-chevron-down') : null;

        snapPointState.active = false;
        if (typeof isCreatingSnapPoint !== 'undefined') {
            isCreatingSnapPoint = false;
        }
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Mesure de différence
    if (typeof measureState !== 'undefined' && measureState.active) {
        measureState.active = false;
        const measureBtn = document.getElementById('measure-diff-btn');
        const measureResults = document.getElementById('measure-results');
        if (measureBtn) measureBtn.style.background = 'var(--accent-blue)';
        if (measureResults) measureResults.style.display = 'none';
        if (measureState.point1) {
            measureState.point1 = null;
            measureState.point2 = null;
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }

    // Pan (Déplacement)
    if (typeof panState !== 'undefined' && panState.active) {
        panState.active = false;
        panState.dragging = false;
        const panBtn = document.getElementById('pan-tool-btn');
        if (panBtn) panBtn.style.background = 'var(--accent-blue)';
    }

    // Ruler (Mesurer)
    if (typeof rulerState !== 'undefined' && rulerState.active) {
        rulerState.active = false;
        const rulerBtn = document.getElementById('ruler-tool-btn');
        const rulerResults = document.getElementById('ruler-results');
        if (rulerBtn) rulerBtn.style.background = 'var(--accent-blue)';
        if (rulerResults) rulerResults.style.display = 'none';
        if (rulerState.point) {
            rulerState.point = null;
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }

    // Track (Traquer)
    if (typeof trackState !== 'undefined' && trackState.active) {
        trackState.active = false;
        const trackBtn = document.getElementById('track-tool-btn');
        const trackResults = document.getElementById('track-results');
        if (trackBtn) trackBtn.style.background = 'var(--accent-blue)';
        if (trackResults) trackResults.style.display = 'none';
    }
}

function deactivateOtherTools(currentTool) {
    // Désactiver tous les autres outils directement

    // Interval - TOUJOURS désactiver quand un autre outil est activé
    if (currentTool !== 'interval' && typeof isCreatingInterval !== 'undefined' && isCreatingInterval) {
        const btn = document.getElementById('btn-interval-main');
        const content = document.getElementById('interval-content');
        const icon = document.getElementById('interval-accordion-icon');

        isCreatingInterval = false;
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Diff/Canal - TOUJOURS désactiver quand un autre outil est activé
    if (currentTool !== 'diffcanal' && typeof diffCanalState !== 'undefined' && diffCanalState.active) {
        const btn = document.getElementById('diff-canal-btn');
        const content = document.getElementById('diff-canal-content');
        const icon = btn ? btn.querySelector('.fa-chevron-up, .fa-chevron-down') : null;

        diffCanalState.active = false;
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Marqueur (SnapPoint) - TOUJOURS désactiver quand un autre outil est activé
    if (currentTool !== 'snappoint' && typeof snapPointState !== 'undefined' && snapPointState.active) {
        const btn = document.getElementById('snappoint-btn');
        const content = document.getElementById('snappoint-content');
        const icon = btn ? btn.querySelector('.fa-chevron-up, .fa-chevron-down') : null;

        snapPointState.active = false;
        if (typeof isCreatingSnapPoint !== 'undefined') {
            isCreatingSnapPoint = false;
        }
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Mesure de différence
    if (currentTool !== 'measure' && typeof measureState !== 'undefined' && measureState.active) {
        measureState.active = false;
        const measureBtn = document.getElementById('measure-diff-btn');
        const measureResults = document.getElementById('measure-results');
        if (measureBtn) measureBtn.style.background = 'var(--accent-blue)';
        if (measureResults) measureResults.style.display = 'none';
        if (measureState.point1) {
            measureState.point1 = null;
            measureState.point2 = null;
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }

    // Pan (Déplacement)
    if (currentTool !== 'pan' && typeof panState !== 'undefined' && panState.active) {
        panState.active = false;
        panState.dragging = false;
        const panBtn = document.getElementById('pan-tool-btn');
        const panContent = document.getElementById('pan-content');
        if (panBtn) panBtn.style.background = 'var(--accent-blue)';
        if (panContent) panContent.style.display = 'none';
        // Mettre à jour l'icône
        const panIcon = panBtn ? panBtn.querySelector('#pan-toggle-icon') : null;
        if (panIcon) {
            panIcon.classList.remove('fa-chevron-up');
            panIcon.classList.add('fa-chevron-down');
        }
    }

    // Ruler (Mesurer)
    if (currentTool !== 'ruler' && typeof rulerState !== 'undefined' && rulerState.active) {
        rulerState.active = false;
        const rulerBtn = document.getElementById('ruler-tool-btn');
        const rulerResults = document.getElementById('ruler-results');
        if (rulerBtn) rulerBtn.style.background = 'var(--accent-blue)';
        if (rulerResults) rulerResults.style.display = 'none';
        if (rulerState.point) {
            rulerState.point = null;
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }

    // Track (Traquer)
    if (currentTool !== 'track' && typeof trackState !== 'undefined' && trackState.active) {
        trackState.active = false;
        const trackBtn = document.getElementById('track-tool-btn');
        const trackResults = document.getElementById('track-results');
        if (trackBtn) trackBtn.style.background = 'var(--accent-blue)';
        if (trackResults) trackResults.style.display = 'none';
        if (trackState.currentX !== null) {
            trackState.currentX = null;
            trackState.values = {};
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }
}

function toggleAllGraphs() {
    // Basculer tous les graphiques en même temps
    const allVisible = uiState.timeVisible && uiState.freqVisible && uiState.spectroVisible;
    
    uiState.timeVisible = !allVisible;
    uiState.freqVisible = !allVisible;
    uiState.spectroVisible = !allVisible;
    
    // Appliquer les changements
    const timeContainer = document.getElementById('time-container');
    const freqContainer = document.getElementById('freq-container');
    const spectroContainer = document.getElementById('spectro-container');
    const resizer1 = document.getElementById('resizer1');
    const resizer2 = document.getElementById('resizer2');
    
    if (timeContainer) timeContainer.classList.toggle('hidden', allVisible);
    if (freqContainer) freqContainer.classList.toggle('hidden', allVisible);
    if (spectroContainer) spectroContainer.classList.toggle('hidden', allVisible);
    if (resizer1) resizer1.classList.toggle('hidden', allVisible);
    if (resizer2) resizer2.classList.toggle('hidden', allVisible);
    
    updateToggleButtons();
    adjustPlotLayout();
    updateChartSizes();
    setStatus(allVisible ? t("status.all_graphs_shown") : t("status.all_graphs_hidden"));
}

function adjustPlotLayout() {
    const plotsContainer = document.getElementById('plots-container');
    if (!plotsContainer) return;
    
    // Compter les graphiques visibles
    let visibleCount = 0;
    if (uiState.timeVisible) visibleCount++;
    if (uiState.freqVisible) visibleCount++;
    if (uiState.spectroVisible) visibleCount++;
    
    // Si aucun graphique visible, en forcer un
    if (visibleCount === 0) {
        uiState.timeVisible = true;
        document.getElementById('time-container').classList.remove('hidden');
        document.getElementById('resizer1').classList.remove('hidden');
        visibleCount = 1;
        updateToggleButtons();
    }
    
    // Distribuer l'espace équitablement
    const heightPercent = visibleCount > 0 ? (95 / visibleCount) : 95;
    
    if (uiState.timeVisible) {
        const timeContainer = document.getElementById('time-container');
        if (timeContainer) {
            timeContainer.style.height = `${heightPercent}%`;
        }
    }
    
    if (uiState.freqVisible) {
        const freqContainer = document.getElementById('freq-container');
        if (freqContainer) {
            freqContainer.style.height = `${heightPercent}%`;
        }
    }
    
    if (uiState.spectroVisible) {
        const spectroContainer = document.getElementById('spectro-container');
        if (spectroContainer) {
            if (visibleCount === 1) {
                spectroContainer.style.height = '95%';
            } else {
                spectroContainer.style.height = `${heightPercent}%`;
            }
        }
    }
}

function updateChartSizes() {
    // Redimensionner les graphiques après un délai pour laisser le DOM se mettre à jour
    setTimeout(() => {
        if (appState.charts.time && uiState.timeVisible) appState.charts.time.resize();
        if (appState.charts.freq && uiState.freqVisible) appState.charts.freq.resize();
        if (appState.charts.spectro && uiState.spectroVisible) appState.charts.spectro.resize();
    }, 100);
}

// Ajouter l'appel à initToggleButtons dans window.onload
window.onload = function() {
    console.time('Initialisation');

    initCharts();
    setupResizers();
    setupCanvasInteractions();
    updateColorScale();


    // INITIALISER LES CHAMPS DE ZOOM
    setTimeout(updateZoomInputs, 500);
    setupSpectrogramAutoUpdate();

    // RÉINITIALISER L'AIDE (désactivé - maintenant géré par help-loader.js)
    // document.getElementById('help-content').innerHTML = i18n.fr.help_text;

    // Initialiser les boutons toggle
    initToggleButtons();

    // Ajuster la disposition des graphiques selon leur visibilité
    adjustPlotLayout();

    // Charger la préférence des tooltips
    loadTooltipPreference();

    console.timeEnd('Initialisation');

    // Initialiser le système POO Multi-Projets
    if (typeof initPOOSystem === 'function') {
        initPOOSystem();
        setStatus(t("status.ready_multi"));
    } else {
        setStatus(t("status.ready"));
    }

    // Charger la langue sauvegardée et appliquer les traductions
    // Utiliser setTimeout pour s'assurer que tous les éléments dynamiques sont créés
    setTimeout(() => {
        const savedLanguage = localStorage.getItem('hydraspec_language') || 'fr';
        changeLanguage(savedLanguage);
    }, 200);
};
// --- TRANSLATION ---
function changeLanguage(lang) {
    appState.lang = lang;

    // Sauvegarder la préférence de langue
    localStorage.setItem('hydraspec_language', lang);

    // Mettre à jour le select de langue
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = lang;
    }

    // Vérifier que le système de traduction est chargé
    if (typeof t !== 'function') {
        console.error('❌ Système de traduction non chargé! Vérifiez que i18n.js est chargé.');
        return;
    }

    // Textes standards (data-i18n)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated !== key) {
            el.textContent = translated;
        }
    });

    // Tooltips (data-i18n-title)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translated = t(key);
        if (translated !== key) {
            el.title = translated;
        }
    });

    // Placeholders (data-i18n-placeholder)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = t(key);
        if (translated !== key) {
            el.placeholder = translated;
        }
    });

    // Options de select (data-i18n dans les <option>)
    document.querySelectorAll('option[data-i18n]').forEach(option => {
        const key = option.getAttribute('data-i18n');
        const translated = t(key);
        if (translated !== key) {
            option.textContent = translated;
        }
    });

    console.log(`✅ Langue changée: ${lang}`);
}

// --- ZOOM TEMPOREL MANUEL ---
// --- ZOOM TEMPOREL ET VERTICAL MANUEL ---
function updateZoomInputs() {
    if (appState.charts.time && appState.charts.time.scales) {
        const xScale = appState.charts.time.scales.x;
        const yScale = appState.charts.time.scales.y;

        // Obtenir les infos du canal X pour la conversion dynamique
        const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's' };

        console.log("Mise à jour des champs de zoom:", xScale.min, xScale.max); // Debug

        // Mise à jour des champs horizontaux (conversion dynamique selon canal X)
        document.getElementById('zoom-min').value = (xScale.min / xInfo.scale).toFixed(3);
        document.getElementById('zoom-max').value = (xScale.max / xInfo.scale).toFixed(3);

        // Mise à jour des champs verticaux (vérifier qu'ils existent)
        const zoomYMin = document.getElementById('zoom-y-min');
        const zoomYMax = document.getElementById('zoom-y-max');
        if (zoomYMin) zoomYMin.value = yScale.min.toFixed(1);
        if (zoomYMax) zoomYMax.value = yScale.max.toFixed(1);
    }
}

function applyTimeZoom() {
    const minXInput = document.getElementById('zoom-min');
    const maxXInput = document.getElementById('zoom-max');
    const minYInput = document.getElementById('zoom-y-min');
    const maxYInput = document.getElementById('zoom-y-max');

    const chart = appState.charts.time;
    if (!chart) {
        console.warn('applyTimeZoom: Chart non disponible');
        return;
    }

    let zoomApplied = false;

    // Appliquer le zoom horizontal si les éléments et valeurs sont valides
    if (minXInput && maxXInput) {
        const minX = parseFloat(minXInput.value);
        const maxX = parseFloat(maxXInput.value);

        if (!isNaN(minX) && !isNaN(maxX) && minX < maxX) {
            // Obtenir les infos du canal X pour la conversion dynamique
            const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's' };

            chart.options.scales.x.min = minX * xInfo.scale;
            chart.options.scales.x.max = maxX * xInfo.scale;
            zoomApplied = true;
            console.log(`✅ Zoom X appliqué: ${minX}${xInfo.unit} à ${maxX}${xInfo.unit} (échelle interne: ${minX * xInfo.scale} à ${maxX * xInfo.scale})`);
        }
    }

    // Appliquer le zoom vertical si les éléments et valeurs sont valides
    if (minYInput && maxYInput) {
        const minY = parseFloat(minYInput.value);
        const maxY = parseFloat(maxYInput.value);

        if (!isNaN(minY) && !isNaN(maxY) && minY < maxY) {
            chart.options.scales.y.min = minY;
            chart.options.scales.y.max = maxY;
            zoomApplied = true;
            console.log(`✅ Zoom Y appliqué: ${minY} à ${maxY}`);
        }
    }

    if (zoomApplied) {
        chart.update(); // Forcer le rafraîchissement complet
        setStatus(t("status.zoom_applied"));

        // Sauvegarder l'état après le zoom dans le configurateur
        if (typeof saveZoomState === 'function') {
            saveZoomState();
        }
    } else {
        setStatus(t("status.invalid_zoom_values"));
        if (minXInput && maxXInput) {
            updateZoomInputs(); // Réaffiche les valeurs actuelles
        }
    }
}
// --- THEMES ---
function changeTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    updateChartColors(theme);
    updateColorScale();
}

function updateChartColors(theme) {
    const color = theme === 'light' ? '#333333' : (theme === 'steampunk' ? '#d4af37' : '#e0e0e0');
    const gridColor = theme === 'light' ? '#ddd' : (theme === 'steampunk' ? '#5d4037' : '#333');
    
    [appState.charts.time, appState.charts.freq, appState.charts.spectro].forEach(chart => {
        if(chart) {
            if(chart.options.scales && chart.options.scales.x) {
                chart.options.scales.x.ticks.color = color;
                chart.options.scales.y.ticks.color = color;
                chart.options.scales.x.grid.color = gridColor;
                chart.options.scales.y.grid.color = gridColor;
            }
            chart.update();
        }
    });
}

function updateColorScale() {
    const theme = document.body.getAttribute('data-theme');
    const scale = document.getElementById('color-scale');
    if(theme === 'light') {
        scale.style.background = 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)';
    } else {
        scale.style.background = 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)';
    }
}

// --- UTILS ---
function openModal(id) {
    console.log('🔓 openModal appelé pour:', id);
    const modal = document.getElementById(id);
    console.log('📦 Modal trouvée:', modal);
    modal.style.display = 'block';

    // Initialiser draggable si la modale a la classe
    const modalContent = modal.querySelector('.draggable-modal');
    console.log('🔍 modalContent:', modalContent);
    console.log('🔍 typeof makeModalDraggable:', typeof makeModalDraggable);

    if (modalContent && typeof makeModalDraggable === 'function') {
        console.log('✅ Appel de makeModalDraggable...');
        makeModalDraggable(modalContent);
    } else {
        console.error('❌ Ne peut pas appeler makeModalDraggable:', {
            modalContent: !!modalContent,
            makeModalDraggableExists: typeof makeModalDraggable === 'function'
        });
    }
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

function setStatus(msg) { 
    document.getElementById('status-bar').textContent = msg; 
    setTimeout(() => { 
        document.getElementById('status-bar').textContent = "Prêt."; 
    }, 3000); 
}

function resetTimeZoom() {
    const chart = appState.charts.time;
    if (!chart || !appState.fullDataTime.length) {
        setStatus(t("status.no_data_display"));
        return;
    }

    // Réinitialiser le zoom horizontal à la plage complète des données
    const t = appState.fullDataTime;
    chart.options.scales.x.min = t[0];
    chart.options.scales.x.max = t[t.length - 1];

    // Réinitialiser le zoom vertical sur TOUTES les échelles Y
    Object.keys(chart.scales).forEach(scaleKey => {
        if (scaleKey.startsWith('y')) {
            // Supprimer les limites personnalisées pour permettre l'auto-scaling
            delete chart.options.scales[scaleKey].min;
            delete chart.options.scales[scaleKey].max;
        }
    });

    // Mettre à jour le graphique
    chart.update('none');

    // Mettre à jour les champs de zoom pour refléter les nouvelles valeurs
    setTimeout(updateZoomInputs, 10);

    setStatus(t("status.zoom_reset"));

    // Sauvegarder l'état après le reset
    if (typeof saveZoomState === 'function') {
        saveZoomState();
    }
}

function resetFreqZoom() { 
    appState.charts.freq.options.scales.x.min = 0; 
    delete appState.charts.freq.options.scales.x.max; 
    appState.charts.freq.update(); 
}

function updateSensitivityUI() { 
    appState.charts.freq.update(); 
}

function updateFsFromStep() {
    const s = parseFloat(document.getElementById('manual-step-config').value);
    if(s > 0 && appState.fullDataPressure.length > 0) {
        const newFs = 1000/s;

        // RECALCULER LES TEMPS AVEC LA NOUVELLE Fs
        const oldData = appState.fullDataPressure;
        const newTime = new Float32Array(oldData.length);
        const dt = 1000/newFs; // nouveau pas en ms

        for(let i = 0; i < oldData.length; i++) {
            newTime[i] = i * dt;
        }

        appState.fs = newFs;
        appState.fullDataTime = newTime;
        appState.timeIncrement = s;

        document.getElementById('display-fs-config').textContent = newFs.toFixed(1) + " Hz";
        document.getElementById('display-increment-config').textContent = s.toFixed(2) + " ms";

        // METTRE À JOUR TOUS LES GRAPHIQUES
        updateTimeChart();
        updateStats();
        performAnalysis();
        updateSpectrogram();
        setStatus(t("status.fs_updated", {fs: newFs.toFixed(1)}));
    } else if (s > 0) {
        // Cas où il n'y a pas encore de données
        appState.fs = 1000/s;
        appState.timeIncrement = s;
        document.getElementById('display-fs-config').textContent = appState.fs.toFixed(1) + " Hz";
        document.getElementById('display-increment-config').textContent = s.toFixed(2) + " ms";
        setStatus(t("status.fs_configured", {fs: appState.fs.toFixed(1)}));
    }
}

function recalculateTimeData(newFs) {
    if (!appState.fullDataPressure.length) return;
    
    const oldData = appState.fullDataPressure;
    const newTime = new Float32Array(oldData.length);
    const dt = 1000/newFs;
    
    for(let i = 0; i < oldData.length; i++) {
        newTime[i] = i * dt;
    }
    
    appState.fs = newFs;
    appState.fullDataTime = newTime;
    return true;
}

// Gestion des clics en dehors des modales
window.onclick = function(e) { 
    if(e.target.classList.contains('modal')) {
        e.target.style.display = "none";
    }
}

function setAcquisitionTitle(title) {
    document.getElementById('acquisition-title').textContent = title;
    // Optionnel : sauvegarder dans l'état si besoin
    appState.acquisitionTitle = title;
}

// === HALO DE SOURIS AMÉLIORÉ ===

let mouseHalo = null;
let mouseX = 0;
let mouseY = 0;
let isMoving = false;
let moveTimeout = null;
let clickTimeout = null;

function initMouseHalo() {
    // Vérifier si le halo existe déjà
    if (document.getElementById('mouse-halo')) {
        return;
    }
    
    // Créer l'élément halo
    mouseHalo = document.createElement('div');
    mouseHalo.id = 'mouse-halo';
    mouseHalo.className = 'mouse-halo';
    
    // Ajouter au body
    document.body.appendChild(mouseHalo);
    
    // Écouter les mouvements de souris
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    // Observer les changements de thème
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                updateHaloForTheme();
            }
        });
    });
    observer.observe(document.body, { attributes: true });
    
    // Cacher le halo lors du défilement
    document.addEventListener('scroll', () => {
        mouseHalo.style.opacity = '0.3';
    });
    
    console.log("✨ Halo de souris initialisé");
}

function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Mettre à jour la position du halo
    if (mouseHalo) {
        mouseHalo.style.left = mouseX + 'px';
        mouseHalo.style.top = mouseY + 'px';
        
        // Activer le halo
        if (!mouseHalo.classList.contains('active')) {
            mouseHalo.classList.add('active');
        }
        
        // Gestion du mouvement
        clearTimeout(moveTimeout);
        isMoving = true;
        
        // Ajouter la classe de mouvement
        mouseHalo.classList.add('moving');
        mouseHalo.style.opacity = '1';
        
        // Retirer la classe après arrêt
        moveTimeout = setTimeout(() => {
            isMoving = false;
            mouseHalo.classList.remove('moving');
            mouseHalo.style.opacity = '0.7';
        }, 150);
        
        // Vérifier si la souris est sur un élément interactif
        const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
        if (elementUnderMouse) {
            const tagName = elementUnderMouse.tagName.toLowerCase();
            const isInteractive = ['input', 'button', 'select', 'textarea', 'a'].includes(tagName) ||
                                 elementUnderMouse.classList.contains('btn') ||
                                 elementUnderMouse.classList.contains('button');
            
            if (isInteractive) {
                mouseHalo.classList.add('small');
            } else {
                mouseHalo.classList.remove('small');
            }
        }
    }
}

function handleMouseDown(e) {
    if (mouseHalo) {
        // Effet de clic
        mouseHalo.classList.add('clicking');
        
        // Supprimer l'effet après un moment
        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            mouseHalo.classList.remove('clicking');
        }, 200);
        
        // Changer la couleur selon le bouton de souris
        if (e.button === 2) { // Clic droit
            mouseHalo.style.background = `radial-gradient(
                circle, 
                rgba(244, 67, 54, 0.4) 0%, 
                rgba(244, 67, 54, 0.2) 40%, 
                rgba(244, 67, 54, 0.1) 60%, 
                rgba(244, 67, 54, 0) 80%
            )`;
        }
    }
}

function handleMouseUp() {
    if (mouseHalo) {
        // Supprimer l'effet de clic
        if (clickTimeout) clearTimeout(clickTimeout);
        mouseHalo.classList.remove('clicking');
        
        // Revenir au thème normal
        updateHaloForTheme();
    }
}

function handleMouseLeave() {
    if (mouseHalo) {
        mouseHalo.classList.remove('active');
    }
}

function handleMouseEnter() {
    if (mouseHalo) {
        mouseHalo.classList.add('active');
    }
}

function updateHaloForTheme() {
    if (!mouseHalo) return;
    
    // Cette fonction n'est plus nécessaire car le CSS gère les thèmes
    // via les sélecteurs [data-theme="..."] .mouse-halo
    console.log("Thème mis à jour, halo adapté automatiquement");
}

// Fonction pour activer/désactiver le halo
function toggleMouseHalo(enable) {
    if (mouseHalo) {
        if (enable) {
            mouseHalo.classList.add('active');
            console.log("✅ Halo de souris activé");
        } else {
            mouseHalo.classList.remove('active');
            console.log("✅ Halo de souris désactivé");
        }
    }
}



// Exposer les fonctions globalement
window.toggleMouseHalo = toggleMouseHalo;
window.initMouseHalo = initMouseHalo;

// ========================================
// SIDEBAR REPLIABLE
// ========================================

function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn-header'); // Nouveau bouton dans le header
    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

    if (sidebar.classList.contains('collapsed')) {
        // Déplier
        sidebar.classList.remove('collapsed');
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        }
        console.log("✅ Sidebar dépliée");
    } else {
        // Replier
        sidebar.classList.add('collapsed');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
        console.log("✅ Sidebar repliée");
    }

    // Déclencher un redimensionnement des graphiques pour s'adapter au nouvel espace
    setTimeout(() => {
        if (window.globalCharts) {
            if (window.globalCharts.time) window.globalCharts.time.resize();
            if (window.globalCharts.freq) window.globalCharts.freq.resize();
            if (window.globalCharts.spectro) window.globalCharts.spectro.resize();
        }
    }, 300); // Attendre la fin de l'animation CSS
}

window.toggleSidebar = toggleSidebar;
// =====================================
// MODALES DRAGGABLES
// =====================================

function makeModalDraggable(modalElement) {
    console.log('🔧 makeModalDraggable appelé pour:', modalElement);

    // Vérifier si déjà initialisé pour éviter les doublons
    if (modalElement.dataset.draggableInitialized === 'true') {
        console.log('⚠️ Modal déjà initialisée, skip');
        return;
    }
    modalElement.dataset.draggableInitialized = 'true';

    const header = modalElement.querySelector('h2');
    if (!header) {
        console.error('❌ Aucun h2 trouvé dans la modal');
        return;
    }
    console.log('✅ Header trouvé:', header.textContent);

    // Variables globales pour le drag
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    // Attacher l'événement au header
    header.onmousedown = dragMouseDown;
    console.log('✅ onmousedown attaché au header');

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        console.log('🎯 dragMouseDown appelé!');

        // Obtenir la position initiale de la souris
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Fixer la position de la modal
        if (modalElement.style.position !== 'fixed') {
            const rect = modalElement.getBoundingClientRect();
            modalElement.style.position = 'fixed';
            modalElement.style.left = rect.left + 'px';
            modalElement.style.top = rect.top + 'px';
            modalElement.style.margin = '0';
        }

        modalElement.classList.add('dragging');

        console.log('📍 Position initiale souris:', pos3, pos4);

        // Attacher les événements de mouvement
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        // Calculer la nouvelle position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Nouvelle position de la modal
        let newTop = modalElement.offsetTop - pos2;
        let newLeft = modalElement.offsetLeft - pos1;

        // Limiter au viewport
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - modalElement.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - modalElement.offsetHeight));

        // Appliquer la nouvelle position
        modalElement.style.top = newTop + "px";
        modalElement.style.left = newLeft + "px";

        console.log('🔄 Dragging - Position:', newLeft, newTop);
    }

    function closeDragElement() {
        console.log('✅ Drag terminé');
        modalElement.classList.remove('dragging');

        // Arrêter le mouvement
        document.onmouseup = null;
        document.onmousemove = null;
    }

    console.log('📍 Modal draggable initialisée complètement');
}

// Initialiser les modales draggables au chargement
document.addEventListener('DOMContentLoaded', () => {
    const draggableModals = document.querySelectorAll('.draggable-modal');
    draggableModals.forEach(modal => makeModalDraggable(modal));
    console.log('✅ Modales draggables initialisées:', draggableModals.length);
});
