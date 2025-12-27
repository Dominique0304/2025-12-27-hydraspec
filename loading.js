// =====================================
// INDICATEURS DE CHARGEMENT
// =====================================

let loadingOverlay = null;
let currentLoadingId = 0;

// Initialiser le système de loading
function initLoadingSystem() {
    // Créer l'overlay de loading
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.style.display = 'none';
    document.body.appendChild(loadingOverlay);

    console.log('⏳ Système de loading initialisé');
}

/**
 * Afficher un indicateur de chargement
 * @param {string} message - Message à afficher
 * @param {boolean} withProgress - Afficher barre de progression
 * @returns {number} ID du loading (pour update/hide)
 */
function showLoading(message = 'Chargement en cours...', withProgress = false) {
    if (!loadingOverlay) {
        initLoadingSystem();
    }

    const loadingId = ++currentLoadingId;

    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
            ${withProgress ? `
                <div class="loading-progress-container">
                    <div class="loading-progress-bar" id="loading-progress-${loadingId}"></div>
                </div>
                <div class="loading-progress-text" id="loading-progress-text-${loadingId}">0%</div>
            ` : ''}
        </div>
    `;

    loadingOverlay.style.display = 'flex';

    return loadingId;
}

/**
 * Mettre à jour la progression
 * @param {number} loadingId - ID du loading
 * @param {number} progress - Progression (0-100)
 * @param {string} message - Message optionnel
 */
function updateLoadingProgress(loadingId, progress, message = null) {
    const progressBar = document.getElementById(`loading-progress-${loadingId}`);
    const progressText = document.getElementById(`loading-progress-text-${loadingId}`);
    const messageEl = document.querySelector('.loading-message');

    if (progressBar) {
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    if (progressText) {
        progressText.textContent = `${Math.round(progress)}%`;
    }

    if (message && messageEl) {
        messageEl.textContent = message;
    }
}

/**
 * Masquer le loading
 * @param {number} loadingId - ID du loading (optionnel, masque le dernier si non spécifié)
 */
function hideLoading(loadingId = null) {
    if (!loadingOverlay) return;

    // Vérifier que c'est le bon loading (si ID spécifié)
    if (loadingId !== null && loadingId !== currentLoadingId) {
        return;
    }

    loadingOverlay.style.display = 'none';
    loadingOverlay.innerHTML = '';
}

/**
 * Wrapper pour exécuter une fonction avec loading
 * @param {Function} fn - Fonction async à exécuter
 * @param {string} message - Message de loading
 * @param {Function} onProgress - Callback de progression optionnel
 */
async function withLoading(fn, message = 'Traitement en cours...', onProgress = null) {
    const loadingId = showLoading(message, onProgress !== null);

    try {
        const result = await fn((progress, msg) => {
            if (onProgress) {
                updateLoadingProgress(loadingId, progress, msg);
            }
        });
        hideLoading(loadingId);
        return result;
    } catch (error) {
        hideLoading(loadingId);
        throw error;
    }
}

// Styles CSS pour le loading
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease-in-out;
    }

    .loading-content {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        text-align: center;
        min-width: 300px;
        max-width: 500px;
    }

    .loading-spinner {
        width: 60px;
        height: 60px;
        border: 4px solid var(--border-color);
        border-top-color: var(--accent-blue);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 20px;
    }

    .loading-message {
        color: var(--text-main);
        font-size: 1.1em;
        margin-bottom: 20px;
        font-weight: 500;
    }

    .loading-progress-container {
        width: 100%;
        height: 8px;
        background: var(--bg-tertiary);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
    }

    .loading-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
        border-radius: 4px;
        transition: width 0.3s ease-out;
        width: 0%;
    }

    .loading-progress-text {
        color: var(--text-muted);
        font-size: 0.9em;
        font-family: monospace;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* Spinner mini pour boutons */
    .btn-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
    }

    /* États de chargement pour boutons */
    button.loading {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
    }

    button.loading::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        margin-left: -10px;
        margin-top: -10px;
        width: 20px;
        height: 20px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
`;
document.head.appendChild(loadingStyles);
