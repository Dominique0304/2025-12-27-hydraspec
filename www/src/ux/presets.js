// =====================================
// SYSTÈME DE PRESETS
// =====================================

// Presets prédéfinis
const defaultPresets = {
    'vibration-analysis': {
        name: 'Analyse Vibration',
        description: 'Configuration optimale pour analyse de vibrations mécaniques',
        icon: 'fa-wave-square',
        config: {
            fft: {
                size: 4096,
                window: 'hanning',
                peakThreshold: 60
            },
            spectrogram: {
                windowSize: 1024,
                overlap: 0.75,
                scale: 'log',
                freqMax: 2000
            },
            channels: {
                // Template pour canaux (appliqué aux 2 premiers canaux)
                template: [
                    { visible: true, yAxisPosition: 'left', showFFT: true, yAxisPositionFFT: 'left' },
                    { visible: true, yAxisPosition: 'right', showFFT: true, yAxisPositionFFT: 'right' }
                ]
            }
        }
    },

    'acoustic-monitoring': {
        name: 'Surveillance Acoustique',
        description: 'Pour analyse de signaux acoustiques et détection de bruits',
        icon: 'fa-volume-up',
        config: {
            fft: {
                size: 8192,
                window: 'blackman',
                peakThreshold: 70
            },
            spectrogram: {
                windowSize: 2048,
                overlap: 0.90,
                scale: 'db',
                freqMax: 5000
            },
            channels: {
                template: [
                    { visible: true, yAxisPosition: 'left', showFFT: true, yAxisPositionFFT: 'left' }
                ]
            }
        }
    },

    'pressure-analysis': {
        name: 'Analyse Pression',
        description: 'Configuration pour signaux de pression hydraulique/pneumatique',
        icon: 'fa-tachometer-alt',
        config: {
            fft: {
                size: 2048,
                window: 'hamming',
                peakThreshold: 50
            },
            spectrogram: {
                windowSize: 512,
                overlap: 0.50,
                scale: 'linear',
                freqMax: 500
            },
            channels: {
                template: [
                    { visible: true, yAxisPosition: 'left', showFFT: true, yAxisPositionFFT: 'left' },
                    { visible: true, yAxisPosition: 'right', showFFT: false, yAxisPositionFFT: 'hidden' }
                ]
            }
        }
    },

    'audio-quality': {
        name: 'Qualité Audio',
        description: 'Analyse détaillée de qualité audio (distorsion, harmoniques)',
        icon: 'fa-headphones',
        config: {
            fft: {
                size: 16384,
                window: 'blackman',
                peakThreshold: 80
            },
            spectrogram: {
                windowSize: 2048,
                overlap: 0.90,
                scale: 'db',
                freqMax: 20000
            },
            channels: {
                template: [
                    { visible: true, yAxisPosition: 'left', showFFT: true, yAxisPositionFFT: 'left' },
                    { visible: true, yAxisPosition: 'right', showFFT: true, yAxisPositionFFT: 'right' }
                ]
            }
        }
    },

    'motor-diagnostic': {
        name: 'Diagnostic Moteur',
        description: 'Détection de défauts mécaniques sur moteurs',
        icon: 'fa-cog',
        config: {
            fft: {
                size: 4096,
                window: 'hanning',
                peakThreshold: 65
            },
            spectrogram: {
                windowSize: 1024,
                overlap: 0.75,
                scale: 'log',
                freqMax: 1000
            },
            channels: {
                template: [
                    { visible: true, yAxisPosition: 'left', showFFT: true, yAxisPositionFFT: 'left' }
                ]
            }
        }
    }
};

// Presets utilisateur (sauvegardés dans localStorage)
let userPresets = {};

// Charger les presets utilisateur
function loadUserPresets() {
    try {
        const saved = localStorage.getItem('hydraspec-user-presets');
        if (saved) {
            userPresets = JSON.parse(saved);
            console.log(`📦 ${Object.keys(userPresets).length} presets utilisateur chargés`);
        }
    } catch (e) {
        console.error('❌ Erreur chargement presets:', e);
    }
}

// Sauvegarder les presets utilisateur
function saveUserPresets() {
    try {
        localStorage.setItem('hydraspec-user-presets', JSON.stringify(userPresets));
        console.log('💾 Presets utilisateur sauvegardés');
    } catch (e) {
        console.error('❌ Erreur sauvegarde presets:', e);
    }
}

/**
 * Appliquer un preset
 * @param {string} presetId - ID du preset
 */
function applyPreset(presetId) {
    const preset = defaultPresets[presetId] || userPresets[presetId];

    if (!preset) {
        showError(`Preset "${presetId}" non trouvé`);
        return;
    }

    console.log(`🎨 Application preset: ${preset.name}`);
    saveState(`Application preset: ${preset.name}`);

    const config = preset.config;

    // Appliquer les paramètres FFT
    if (config.fft) {
        const fftSizeEl = document.getElementById('fft-size');
        const windowEl = document.getElementById('window-func');
        const peakEl = document.getElementById('peak-threshold');

        if (fftSizeEl) fftSizeEl.value = config.fft.size;
        if (windowEl) windowEl.value = config.fft.window;
        if (peakEl) {
            peakEl.value = config.fft.peakThreshold;
            if (typeof updateSensitivityUI === 'function') {
                updateSensitivityUI();
            }
        }
    }

    // Appliquer les paramètres spectrogramme
    if (config.spectrogram) {
        const stftWindowEl = document.getElementById('stft-window-size');
        const stftOverlapEl = document.getElementById('stft-overlap');
        const stftScaleEl = document.getElementById('stft-scale');
        const stftFreqMaxEl = document.getElementById('stft-freq-max');

        if (stftWindowEl) stftWindowEl.value = config.spectrogram.windowSize;
        if (stftOverlapEl) stftOverlapEl.value = config.spectrogram.overlap;
        if (stftScaleEl) stftScaleEl.value = config.spectrogram.scale;
        if (stftFreqMaxEl) stftFreqMaxEl.value = config.spectrogram.freqMax;

        if (typeof updateSpectrogram === 'function') {
            updateSpectrogram();
        }
    }

    // Appliquer le template de canaux (sauf fantômes)
    if (config.channels && config.channels.template && typeof appState !== 'undefined') {
        appState.channelConfig.forEach((channel, index) => {
            // Ignorer les canaux fantômes
            if (channel.isPhantom) return;

            const template = config.channels.template[Math.min(index, config.channels.template.length - 1)];
            if (template) {
                Object.assign(channel, template);
            }
        });

        // Mettre à jour les vues
        if (typeof updateChannelConfigUI === 'function') updateChannelConfigUI();
        if (typeof updateCanalQuickView === 'function') updateCanalQuickView();
        if (typeof updateFFTCanalQuickView === 'function') updateFFTCanalQuickView();
    }

    // Relancer l'analyse
    if (typeof performAnalysis === 'function') {
        performAnalysis();
    }

    showSuccess(`Preset "${preset.name}" appliqué!`);
}

/**
 * Sauvegarder la configuration actuelle comme preset
 * @param {string} name - Nom du preset
 * @param {string} description - Description
 */
function saveAsPreset(name, description = '') {
    if (!name || name.trim() === '') {
        showError('Veuillez entrer un nom pour le preset');
        return;
    }

    const presetId = name.toLowerCase().replace(/\s+/g, '-');

    // Créer le preset depuis la configuration actuelle
    const preset = {
        name: name,
        description: description,
        icon: 'fa-star',
        config: {
            fft: {
                size: parseInt(document.getElementById('fft-size')?.value || 4096),
                window: document.getElementById('window-func')?.value || 'hanning',
                peakThreshold: parseInt(document.getElementById('peak-threshold')?.value || 50)
            },
            spectrogram: {
                windowSize: parseInt(document.getElementById('stft-window-size')?.value || 512),
                overlap: parseFloat(document.getElementById('stft-overlap')?.value || 0.5),
                scale: document.getElementById('stft-scale')?.value || 'log',
                freqMax: parseInt(document.getElementById('stft-freq-max')?.value || 500)
            },
            channels: {
                template: appState.channelConfig.slice(0, 3).map(ch => ({
                    visible: ch.visible,
                    yAxisPosition: ch.yAxisPosition,
                    showFFT: ch.showFFT,
                    yAxisPositionFFT: ch.yAxisPositionFFT
                }))
            }
        }
    };

    userPresets[presetId] = preset;
    saveUserPresets();
    updatePresetSelector();

    showSuccess(`Preset "${name}" sauvegardé!`);
    closePresetModal();
}

/**
 * Supprimer un preset utilisateur
 */
function deletePreset(presetId) {
    if (defaultPresets[presetId]) {
        showError('Impossible de supprimer un preset par défaut');
        return;
    }

    if (!userPresets[presetId]) {
        showError('Preset non trouvé');
        return;
    }

    if (confirm(t("dialogs.confirm_delete_preset", {name: userPresets[presetId].name}))) {
        delete userPresets[presetId];
        saveUserPresets();
        updatePresetSelector();
        showInfo('Preset supprimé');
    }
}

/**
 * Mettre à jour le sélecteur de presets
 */
function updatePresetSelector() {
    const selector = document.getElementById('preset-selector');
    if (!selector) return;

    selector.innerHTML = '<option value="">-- Choisir un preset --</option>';

    // Groupe presets par défaut
    const defaultGroup = document.createElement('optgroup');
    defaultGroup.label = '📦 Presets par défaut';

    Object.entries(defaultPresets).forEach(([id, preset]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = preset.name;
        defaultGroup.appendChild(option);
    });

    selector.appendChild(defaultGroup);

    // Groupe presets utilisateur
    if (Object.keys(userPresets).length > 0) {
        const userGroup = document.createElement('optgroup');
        userGroup.label = '⭐ Mes presets';

        Object.entries(userPresets).forEach(([id, preset]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = preset.name;
            userGroup.appendChild(option);
        });

        selector.appendChild(userGroup);
    }
}

/**
 * Ouvrir la modal de sauvegarde de preset
 */
function openPresetModal() {
    const modal = document.getElementById('save-preset-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('preset-name-input')?.focus();
    }
}

/**
 * Fermer la modal de sauvegarde de preset
 */
function closePresetModal() {
    const modal = document.getElementById('save-preset-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('preset-name-input').value = '';
        document.getElementById('preset-desc-input').value = '';
    }
}

// Initialiser au chargement
window.addEventListener('load', () => {
    loadUserPresets();
    updatePresetSelector();
    console.log('🎨 Système de presets initialisé');
});
