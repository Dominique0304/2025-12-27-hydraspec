// =====================================================
// HISTORIQUE DE ZOOM - HydraSpec Pro
// Gère l'historique des états de zoom/pan pour Annuler/Rétablir
// =====================================================

// Configuration
const MAX_ZOOM_HISTORY = 20;

// État de l'historique
let zoomHistory = [];
let currentZoomIndex = -1;
let isRestoringState = false; // Flag pour éviter de sauvegarder pendant la restauration

// =====================================
// CAPTURE DE L'ÉTAT ACTUEL
// =====================================

function captureCurrentZoomState() {
    if (!appState.charts || !appState.charts.time) {
        return null;
    }

    const chart = appState.charts.time;
    const state = {
        x: {
            min: chart.options.scales.x.min,
            max: chart.options.scales.x.max
        },
        y: {}
    };

    // Capturer tous les axes Y
    Object.keys(chart.options.scales).forEach(scaleKey => {
        if (scaleKey.startsWith('y')) {
            state.y[scaleKey] = {
                min: chart.options.scales[scaleKey].min,
                max: chart.options.scales[scaleKey].max
            };
        }
    });

    return state;
}

// =====================================
// SAUVEGARDE DANS L'HISTORIQUE
// =====================================

function saveZoomState() {
    // Ne pas sauvegarder si on est en train de restaurer un état
    if (isRestoringState) {
        return;
    }

    const state = captureCurrentZoomState();
    if (!state) {
        return;
    }

    // Si on n'est pas à la fin de l'historique, supprimer les états "futurs"
    if (currentZoomIndex < zoomHistory.length - 1) {
        zoomHistory = zoomHistory.slice(0, currentZoomIndex + 1);
    }

    // Ajouter le nouvel état
    zoomHistory.push(state);

    // Limiter la taille de l'historique
    if (zoomHistory.length > MAX_ZOOM_HISTORY) {
        zoomHistory.shift(); // Supprimer le plus ancien
    } else {
        currentZoomIndex++;
    }

    updateHistoryUI();
    console.log(`💾 État de zoom sauvegardé (${currentZoomIndex + 1}/${zoomHistory.length})`);
}

// =====================================
// RESTAURATION D'UN ÉTAT
// =====================================

function restoreZoomState(state) {
    if (!appState.charts || !appState.charts.time || !state) {
        return;
    }

    isRestoringState = true; // Flag pour éviter de sauvegarder pendant la restauration

    const chart = appState.charts.time;

    // Restaurer l'axe X
    if (state.x) {
        chart.options.scales.x.min = state.x.min;
        chart.options.scales.x.max = state.x.max;
    }

    // Restaurer tous les axes Y
    if (state.y) {
        Object.keys(state.y).forEach(scaleKey => {
            if (chart.options.scales[scaleKey]) {
                chart.options.scales[scaleKey].min = state.y[scaleKey].min;
                chart.options.scales[scaleKey].max = state.y[scaleKey].max;
            }
        });
    }

    // Mettre à jour le graphique
    chart.update('none');

    // Mettre à jour les champs de zoom dans l'interface
    if (typeof updateZoomInputs === 'function') {
        updateZoomInputs();
    }
    if (typeof updatePanToolZoomInputs === 'function') {
        updatePanToolZoomInputs();
    }

    isRestoringState = false;
    updateHistoryUI();
}

// =====================================
// ANNULER / RÉTABLIR
// =====================================

function undoZoom() {
    if (currentZoomIndex <= 0) {
        console.log('⚠️ Pas d\'état précédent à restaurer');
        return;
    }

    currentZoomIndex--;
    const state = zoomHistory[currentZoomIndex];
    restoreZoomState(state);
    console.log(`↶ Annuler: restauration état ${currentZoomIndex + 1}/${zoomHistory.length}`);
}

function redoZoom() {
    if (currentZoomIndex >= zoomHistory.length - 1) {
        console.log('⚠️ Pas d\'état suivant à restaurer');
        return;
    }

    currentZoomIndex++;
    const state = zoomHistory[currentZoomIndex];
    restoreZoomState(state);
    console.log(`↷ Rétablir: restauration état ${currentZoomIndex + 1}/${zoomHistory.length}`);
}

// =====================================
// MISE À JOUR DE L'INTERFACE
// =====================================

function updateHistoryUI() {
    const undoBtn = document.getElementById('undo-zoom-btn');
    const redoBtn = document.getElementById('redo-zoom-btn');
    const infoDiv = document.getElementById('zoom-history-info');

    if (undoBtn) {
        undoBtn.disabled = currentZoomIndex <= 0;
        undoBtn.style.opacity = currentZoomIndex <= 0 ? '0.5' : '1';
        undoBtn.style.cursor = currentZoomIndex <= 0 ? 'not-allowed' : 'pointer';
    }

    if (redoBtn) {
        redoBtn.disabled = currentZoomIndex >= zoomHistory.length - 1;
        redoBtn.style.opacity = currentZoomIndex >= zoomHistory.length - 1 ? '0.5' : '1';
        redoBtn.style.cursor = currentZoomIndex >= zoomHistory.length - 1 ? 'not-allowed' : 'pointer';
    }

    if (infoDiv) {
        infoDiv.textContent = `${currentZoomIndex + 1}/${MAX_ZOOM_HISTORY}`;
    }
}

// =====================================
// INITIALISATION
// =====================================

function initZoomHistory() {
    // Sauvegarder l'état initial après un court délai
    setTimeout(() => {
        saveZoomState();
        console.log('✅ Historique de zoom initialisé');
    }, 500);
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que les graphiques soient créés
    const checkCharts = setInterval(() => {
        if (appState.charts && appState.charts.time) {
            clearInterval(checkCharts);
            initZoomHistory();
        }
    }, 100);
});

console.log('📜 Module zoom-history.js chargé');
