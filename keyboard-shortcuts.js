// =====================================
// RACCOURCIS CLAVIER
// =====================================

// Map des raccourcis clavier
const keyboardShortcuts = {
    'KeyM': { action: 'toggleMeasureTool', description: 'Mesure de différence' },
    'KeyP': { action: 'togglePanTool', description: 'Déplacement / Zoom' },
    'KeyR': { action: 'toggleRulerTool', description: 'Mesurer' },
    'KeyT': { action: 'toggleTrackTool', description: 'Traquer' },
    'KeyA': { action: 'toggleAnnotationMode', description: 'Mode Annotation' },
    'Escape': { action: 'deactivateAllTools', description: 'Désactiver tous les outils' },
    'KeyH': { action: 'toggleKeyboardHelp', description: 'Afficher l\'aide des raccourcis' },

    // Undo/Redo
    'KeyZ': { action: 'handleUndo', description: 'Annuler', ctrl: true },
    'KeyY': { action: 'handleRedo', description: 'Refaire', ctrl: true },

    // Navigation graphiques
    'Digit1': { action: () => toggleTimeDomain(), description: 'Toggle Temps', ctrl: true },
    'Digit2': { action: () => toggleFreqDomain(), description: 'Toggle Fréquence', ctrl: true },
    'Digit3': { action: () => toggleSpectrogram(), description: 'Toggle Spectro', ctrl: true },

    // Reset zoom
    'KeyO': { action: () => resetAllZoom(), description: 'Reset zoom tous graphiques', ctrl: true }
};

// État des raccourcis
let shortcutsEnabled = true;
let helpModalVisible = false;

// Initialiser les raccourcis clavier
function initKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyboardShortcut);
    console.log('⌨️ Raccourcis clavier initialisés');

    // Créer la modal d'aide
    createKeyboardHelpModal();
}

// Gérer les raccourcis clavier
function handleKeyboardShortcut(e) {
    // Ignorer si on est dans un champ de saisie
    if (e.target.matches('input, textarea, select, [contenteditable="true"]')) {
        // Sauf pour Ctrl+Z et Ctrl+Y
        if (!(e.ctrlKey && (e.code === 'KeyZ' || e.code === 'KeyY'))) {
            return;
        }
    }

    // Ignorer si les raccourcis sont désactivés
    if (!shortcutsEnabled) return;

    const shortcut = keyboardShortcuts[e.code];
    if (!shortcut) return;

    // Vérifier les modificateurs requis
    if (shortcut.ctrl && !e.ctrlKey) return;
    if (shortcut.shift && !e.shiftKey) return;
    if (shortcut.alt && !e.altKey) return;

    // Empêcher le comportement par défaut
    e.preventDefault();

    // Exécuter l'action
    if (typeof shortcut.action === 'function') {
        shortcut.action();
    } else if (typeof window[shortcut.action] === 'function') {
        window[shortcut.action]();
    }

    console.log(`⌨️ Raccourci: ${e.code} → ${shortcut.description}`);
}

// Reset zoom de tous les graphiques
function resetAllZoom() {
    if (typeof resetTimeZoom === 'function') resetTimeZoom();
    if (typeof resetFreqZoom === 'function') resetFreqZoom();
    showToast('Zoom réinitialisé sur tous les graphiques', 'info');
}

// Toggle aide clavier
function toggleKeyboardHelp() {
    const modal = document.getElementById('keyboard-help-modal');
    if (!modal) return;

    if (helpModalVisible) {
        modal.style.display = 'none';
        helpModalVisible = false;
    } else {
        modal.style.display = 'flex';
        helpModalVisible = true;
    }
}

// Créer la modal d'aide des raccourcis
function createKeyboardHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'keyboard-help-modal';
    modal.className = 'modal';
    modal.style.display = 'none';

    modal.innerHTML = `
        <div class="modal-content" style="width: 600px; max-width: 90vw;">
            <button class="btn-close" onclick="toggleKeyboardHelp()">&times;</button>
            <h2 style="margin-top: 0; color: var(--accent-blue);">
                <i class="fas fa-keyboard"></i> Raccourcis Clavier
            </h2>

            <div style="max-height: 60vh; overflow-y: auto; padding-right: 10px;">
                <h3 style="color: var(--accent-green); margin-top: 20px;">
                    <i class="fas fa-tools"></i> Outils
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tbody>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>M</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Mesure de différence
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>P</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Déplacement / Zoom
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>R</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Mesurer (règle)
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>T</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Traquer
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>A</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Mode Annotation
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>Esc</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Désactiver tous les outils
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h3 style="color: var(--accent-blue); margin-top: 20px;">
                    <i class="fas fa-undo"></i> Historique
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tbody>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Annuler
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Refaire
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h3 style="color: var(--accent-orange); margin-top: 20px;">
                    <i class="fas fa-chart-line"></i> Graphiques
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tbody>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>Ctrl</kbd> + <kbd>1</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Toggle Domaine Temporel
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>Ctrl</kbd> + <kbd>2</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Toggle Domaine Fréquentiel
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>Ctrl</kbd> + <kbd>3</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Toggle Spectrogramme
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>Ctrl</kbd> + <kbd>O</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Reset zoom (tous)
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h3 style="color: var(--text-muted); margin-top: 20px;">
                    <i class="fas fa-question-circle"></i> Aide
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <kbd>H</kbd>
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                Afficher/Masquer cette aide
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 20px; text-align: right;">
                <button onclick="toggleKeyboardHelp()" class="primary" style="padding: 10px 20px;">
                    Fermer
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Fermer au clic en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            toggleKeyboardHelp();
        }
    });
}

// Style pour les touches kbd
const kbdStyle = document.createElement('style');
kbdStyle.textContent = `
    kbd {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 2px 6px;
        font-family: monospace;
        font-size: 0.9em;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: inline-block;
        min-width: 24px;
        text-align: center;
    }
`;
document.head.appendChild(kbdStyle);
