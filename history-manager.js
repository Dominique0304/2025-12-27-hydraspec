// =====================================
// GESTIONNAIRE D'HISTORIQUE (UNDO/REDO)
// =====================================

class HistoryManager {
    constructor(maxSize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxSize = maxSize;
        this.enabled = true;
    }

    /**
     * Sauvegarder l'état actuel dans l'historique
     * @param {Object} state - État à sauvegarder
     * @param {string} description - Description de l'action
     */
    push(state, description = '') {
        if (!this.enabled) return;

        // Supprimer tout l'historique après l'index actuel
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Ajouter le nouvel état
        this.history.push({
            state: JSON.parse(JSON.stringify(state)), // Deep copy
            description,
            timestamp: Date.now()
        });

        // Limiter la taille de l'historique
        if (this.history.length > this.maxSize) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }

        this.updateUI();
        console.log(`💾 Historique: ${description} (${this.currentIndex + 1}/${this.history.length})`);
    }

    /**
     * Annuler la dernière action
     * @returns {Object|null} État précédent ou null
     */
    undo() {
        if (!this.canUndo()) {
            showInfo('Aucune action à annuler');
            return null;
        }

        this.currentIndex--;
        const entry = this.history[this.currentIndex];
        this.updateUI();

        console.log(`↩️ Undo: ${entry.description}`);
        showInfo(`Annulé: ${entry.description}`, 2000);

        return entry.state;
    }

    /**
     * Refaire l'action annulée
     * @returns {Object|null} État suivant ou null
     */
    redo() {
        if (!this.canRedo()) {
            showInfo('Aucune action à refaire');
            return null;
        }

        this.currentIndex++;
        const entry = this.history[this.currentIndex];
        this.updateUI();

        console.log(`↪️ Redo: ${entry.description}`);
        showInfo(`Refait: ${entry.description}`, 2000);

        return entry.state;
    }

    /**
     * Vérifier si on peut annuler
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Vérifier si on peut refaire
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Effacer tout l'historique
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateUI();
        console.log('🗑️ Historique effacé');
    }

    /**
     * Obtenir l'état actuel
     */
    getCurrentState() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex].state;
        }
        return null;
    }

    /**
     * Mettre à jour l'UI des boutons undo/redo
     */
    updateUI() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.style.opacity = this.canUndo() ? '1' : '0.5';
            undoBtn.style.cursor = this.canUndo() ? 'pointer' : 'not-allowed';
        }

        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.style.opacity = this.canRedo() ? '1' : '0.5';
            redoBtn.style.cursor = this.canRedo() ? 'pointer' : 'not-allowed';
        }
    }

    /**
     * Obtenir l'historique complet (pour debug)
     */
    getHistory() {
        return this.history.map((entry, index) => ({
            description: entry.description,
            timestamp: new Date(entry.timestamp).toLocaleTimeString(),
            isCurrent: index === this.currentIndex
        }));
    }
}

// Instance globale du gestionnaire d'historique
const historyManager = new HistoryManager(50);

// =====================================
// FONCTIONS D'INTÉGRATION
// =====================================

/**
 * Sauvegarder l'état actuel avant une modification
 * @param {string} description - Description de l'action
 */
function saveState(description) {
    if (typeof appState === 'undefined') return;

    const state = {
        channelConfig: appState.channelConfig,
        annotations: appState.annotations || [],
        // Ajouter d'autres propriétés si nécessaire
    };

    historyManager.push(state, description);
}

/**
 * Restaurer un état depuis l'historique
 * @param {Object} state - État à restaurer
 */
function restoreState(state) {
    if (!state || typeof appState === 'undefined') return;

    // Désactiver temporairement l'historique pour éviter les boucles
    historyManager.enabled = false;

    try {
        // Restaurer la configuration des canaux
        if (state.channelConfig) {
            appState.channelConfig = JSON.parse(JSON.stringify(state.channelConfig));

            // Mettre à jour l'UI
            if (typeof updateChannelConfigUI === 'function') {
                updateChannelConfigUI();
            }
            if (typeof updateCanalQuickView === 'function') {
                updateCanalQuickView();
            }
            if (typeof updateFFTCanalQuickView === 'function') {
                updateFFTCanalQuickView();
            }
        }

        // Restaurer les annotations
        if (state.annotations) {
            appState.annotations = JSON.parse(JSON.stringify(state.annotations));

            // Recharger les annotations avec loadAnnotations() si disponible
            if (typeof loadAnnotations === 'function') {
                loadAnnotations(state.annotations);
            } else {
                // Sinon, redessiner manuellement
                if (typeof updateAnnotationsDisplay === 'function') {
                    updateAnnotationsDisplay();
                }
                if (typeof appState.charts !== 'undefined' && appState.charts.time) {
                    appState.charts.time.update('none');
                }
            }
        }

        // Mettre à jour les graphiques
        if (typeof performAnalysis === 'function') {
            performAnalysis();
        } else if (typeof updateTimeChart === 'function') {
            updateTimeChart();
        }

    } finally {
        // Réactiver l'historique
        historyManager.enabled = true;
    }
}

/**
 * Gestionnaire undo (appelé par raccourci clavier ou bouton)
 */
function handleUndo() {
    const previousState = historyManager.undo();
    if (previousState) {
        restoreState(previousState);
    }
}

/**
 * Gestionnaire redo (appelé par raccourci clavier ou bouton)
 */
function handleRedo() {
    const nextState = historyManager.redo();
    if (nextState) {
        restoreState(nextState);
    }
}

// =====================================
// INTÉGRATION AUTOMATIQUE
// =====================================

// Sauvegarder l'état initial au chargement
window.addEventListener('load', () => {
    setTimeout(() => {
        if (typeof appState !== 'undefined') {
            saveState('État initial');
            console.log('💾 État initial sauvegardé');
        }
    }, 1000);
});

// Intercepter les modifications importantes pour sauvegarder automatiquement
// (À activer selon les besoins)
/*
const autoSaveActions = {
    'createAnnotation': 'Création annotation',
    'deleteAnnotation': 'Suppression annotation',
    'updateChannelConfig': 'Modification configuration canal',
    'updateFFTParams': 'Modification paramètres FFT'
};

// Wrapper pour sauvegarder automatiquement
function withAutoSave(fn, description) {
    return function(...args) {
        saveState(description);
        return fn.apply(this, args);
    };
}
*/
