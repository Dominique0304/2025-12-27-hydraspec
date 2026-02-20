// =====================================
// SYSTÈME DE TOAST NOTIFICATIONS
// =====================================

// Container pour les toasts
let toastContainer = null;

// Initialiser le système de toast
function initToastSystem() {
    // Créer le container
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    console.log('🔔 Système de toast initialisé');
}

/**
 * Afficher un toast notification
 * @param {string} message - Message à afficher
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Durée en ms (0 = permanent)
 */
function showToast(message, type = 'info', duration = 3000) {
    if (!toastContainer) {
        initToastSystem();
    }

    // Créer le toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icône selon le type
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const icon = icons[type] || icons.info;

    toast.innerHTML = `
        <i class="fas ${icon} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Ajouter au container
    toastContainer.appendChild(toast);

    // Animation d'entrée
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // Auto-supprimer si durée spécifiée
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Log pour debug
    console.log(`🔔 Toast [${type}]: ${message}`);

    return toast;
}

// Fonctions helper pour chaque type
function showSuccess(message, duration = 3000) {
    return showToast(message, 'success', duration);
}

function showError(message, duration = 5000) {
    return showToast(message, 'error', duration);
}

function showWarning(message, duration = 4000) {
    return showToast(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
    return showToast(message, 'info', duration);
}

// Supprimer tous les toasts
function clearAllToasts() {
    if (toastContainer) {
        toastContainer.innerHTML = '';
    }
}

// Styles CSS pour les toasts
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
        pointer-events: none;
    }

    .toast {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        position: relative;
    }

    .toast-show {
        opacity: 1;
        transform: translateX(0);
    }

    .toast-hide {
        opacity: 0;
        transform: translateX(400px);
    }

    .toast-icon {
        font-size: 1.5em;
        flex-shrink: 0;
    }

    .toast-message {
        flex: 1;
        font-size: 0.95em;
        line-height: 1.4;
        color: var(--text-main);
    }

    .toast-close {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .toast-close:hover {
        background: var(--bg-tertiary);
        color: var(--text-main);
    }

    /* Types de toast */
    .toast-success {
        border-left: 4px solid var(--accent-green);
    }

    .toast-success .toast-icon {
        color: var(--accent-green);
    }

    .toast-error {
        border-left: 4px solid var(--accent-red);
    }

    .toast-error .toast-icon {
        color: var(--accent-red);
    }

    .toast-warning {
        border-left: 4px solid var(--accent-orange);
    }

    .toast-warning .toast-icon {
        color: var(--accent-orange);
    }

    .toast-info {
        border-left: 4px solid var(--accent-blue);
    }

    .toast-info .toast-icon {
        color: var(--accent-blue);
    }

    /* Animation pulse pour erreurs */
    .toast-error {
        animation: toast-pulse 0.5s ease-in-out 2;
    }

    @keyframes toast-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }

    /* Responsive */
    @media (max-width: 768px) {
        .toast-container {
            bottom: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }

        .toast {
            min-width: auto;
        }
    }
`;
document.head.appendChild(toastStyles);
