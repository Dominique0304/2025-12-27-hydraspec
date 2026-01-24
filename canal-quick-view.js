// =====================================
// CANAL QUICK VIEW
// =====================================
// Vue rapide des canaux pour afficher/masquer rapidement
// les canaux et leurs axes Y

// Toggle l'affichage du panneau Canal
function toggleCanal() {
    const content = document.getElementById('canal-content');
    const icon = document.getElementById('canal-toggle-icon');

    if (content.style.display === 'none') {
        // Désactiver les autres outils
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('canal');
        }

        // Fermer tous les autres accordéons principaux
        if (typeof closeAllMainAccordions === 'function') {
            closeAllMainAccordions('canal');
        }

        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        // Mettre à jour la liste au moment de l'ouverture
        updateCanalQuickView();
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

// Mettre à jour la vue rapide des canaux
function updateCanalQuickView() {
    const tbody = document.getElementById('canal-tbody');
    if (!tbody || !appState.channelConfig) return;

    tbody.innerHTML = '';

    appState.channelConfig.forEach((config, index) => {
        // Ignorer les canaux fantômes (canal interne pour annotations flottantes)
        if (config.isPhantom) return;

        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border-color)';
        row.style.transition = 'background-color 0.2s';

        // Hover effect
        row.onmouseenter = () => row.style.backgroundColor = 'var(--bg-secondary)';
        row.onmouseleave = () => row.style.backgroundColor = 'transparent';

        // Cellule nom du canal (cliquable)
        const nameCell = document.createElement('td');
        nameCell.style.padding = '10px';
        nameCell.style.borderRight = '1px solid var(--border-color)';
        nameCell.style.cursor = 'pointer';
        nameCell.style.userSelect = 'none';
        nameCell.style.fontWeight = 'bold';
        nameCell.style.color = config.color;

        // Ajouter un indicateur visuel de l'état de visibilité
        const visibilityIcon = document.createElement('i');
        visibilityIcon.className = config.visible ? 'fas fa-eye' : 'fas fa-eye-slash';
        visibilityIcon.style.marginRight = '8px';
        visibilityIcon.style.fontSize = '0.9em';
        visibilityIcon.style.color = config.visible ? 'var(--accent-green)' : 'var(--text-muted)';

        const nameText = document.createElement('span');
        nameText.textContent = config.label;
        nameText.style.opacity = config.visible ? '1' : '0.5';

        nameCell.appendChild(visibilityIcon);
        nameCell.appendChild(nameText);

        // Click sur le nom toggle la visibilité du canal ET de l'axe Y
        nameCell.onclick = () => {
            config.visible = !config.visible;

            // Si on masque, désactiver aussi la FFT
            if (!config.visible) {
                config.showFFT = false;
            }

            // Mettre à jour l'interface et synchroniser
            updateCanalQuickView();
            updateFFTCanalQuickView();
            if (typeof updateChannelConfigUI === 'function') {
                updateChannelConfigUI();
            }
            updateTimeChart();
        };

        // Cellule checkbox L (Left)
        const leftCell = document.createElement('td');
        leftCell.style.padding = '6px';
        leftCell.style.textAlign = 'center';
        leftCell.style.borderRight = '1px solid var(--border-color)';

        const leftCheck = document.createElement('input');
        leftCheck.type = 'checkbox';
        leftCheck.checked = config.yAxisPosition === 'left';
        leftCheck.style.cursor = 'pointer';
        leftCheck.onchange = (e) => {
            e.stopPropagation();
            if (e.target.checked) {
                config.yAxisPosition = 'left';
            } else {
                // Si on décoche L et que R n'est pas coché, masquer
                config.yAxisPosition = 'hidden';
            }
            updateCanalQuickView();
            if (typeof updateChannelConfigUI === 'function') {
                updateChannelConfigUI();
            }
            updateTimeChart();
        };

        leftCell.appendChild(leftCheck);

        // Cellule checkbox R (Right)
        const rightCell = document.createElement('td');
        rightCell.style.padding = '6px';
        rightCell.style.textAlign = 'center';

        const rightCheck = document.createElement('input');
        rightCheck.type = 'checkbox';
        rightCheck.checked = config.yAxisPosition === 'right';
        rightCheck.style.cursor = 'pointer';
        rightCheck.onchange = (e) => {
            e.stopPropagation();
            if (e.target.checked) {
                config.yAxisPosition = 'right';
            } else {
                // Si on décoche R et que L n'est pas coché, masquer
                config.yAxisPosition = 'hidden';
            }
            updateCanalQuickView();
            if (typeof updateChannelConfigUI === 'function') {
                updateChannelConfigUI();
            }
            updateTimeChart();
        };

        rightCell.appendChild(rightCheck);

        row.appendChild(nameCell);
        row.appendChild(leftCell);
        row.appendChild(rightCell);
        tbody.appendChild(row);
    });
}

// =====================================
// FFT CANAL QUICK VIEW
// =====================================
// Vue rapide des canaux dans les paramètres FFT

// Mettre à jour la vue rapide des canaux dans FFT
function updateFFTCanalQuickView() {
    const tbody = document.getElementById('fft-canal-tbody');
    if (!tbody || !appState.channelConfig) return;

    tbody.innerHTML = '';

    // Afficher TOUS les canaux visibles dans le domaine temporel (sauf fantômes)
    const visibleChannels = appState.channelConfig.filter(config => config.visible && !config.isPhantom);

    visibleChannels.forEach((config, index) => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border-color)';
        row.style.transition = 'background-color 0.2s';

        // Griser la ligne si la FFT n'est pas activée pour ce canal
        if (!config.showFFT) {
            row.style.opacity = '0.5';
        }

        // Hover effect
        row.onmouseenter = () => row.style.backgroundColor = 'var(--bg-secondary)';
        row.onmouseleave = () => row.style.backgroundColor = 'transparent';

        // Cellule nom du canal (cliquable pour activer/désactiver FFT)
        const nameCell = document.createElement('td');
        nameCell.style.padding = '10px';
        nameCell.style.borderRight = '1px solid var(--border-color)';
        nameCell.style.cursor = 'pointer';
        nameCell.style.userSelect = 'none';
        nameCell.style.fontWeight = 'bold';
        nameCell.style.color = config.color;

        // Ajouter un indicateur visuel de l'état FFT
        const fftIcon = document.createElement('i');
        fftIcon.className = config.showFFT ? 'fas fa-wave-square' : 'fas fa-times';
        fftIcon.style.marginRight = '8px';
        fftIcon.style.fontSize = '0.9em';
        fftIcon.style.color = config.showFFT ? 'var(--accent-green)' : 'var(--text-muted)';

        const nameText = document.createElement('span');
        nameText.textContent = config.label;
        nameText.style.opacity = config.showFFT ? '1' : '0.5';

        nameCell.appendChild(fftIcon);
        nameCell.appendChild(nameText);

        // Click sur le nom toggle l'affichage FFT (pas la visibilité)
        nameCell.onclick = () => {
            config.showFFT = !config.showFFT;

            // Mettre à jour toutes les vues
            updateFFTCanalQuickView();
            updateFFTAnalysisChannelSelect();
            if (typeof updateChannelConfigUI === 'function') {
                updateChannelConfigUI();
            }
            if (typeof performAnalysis === 'function') {
                performAnalysis();
            }
        };

        // Initialiser yAxisPositionFFT si elle n'existe pas
        if (!config.yAxisPositionFFT) {
            config.yAxisPositionFFT = config.yAxisPosition;
        }

        // Cellule checkbox L (Left) - pour domaine fréquentiel UNIQUEMENT
        const leftCell = document.createElement('td');
        leftCell.style.padding = '6px';
        leftCell.style.textAlign = 'center';
        leftCell.style.borderRight = '1px solid var(--border-color)';

        const leftCheck = document.createElement('input');
        leftCheck.type = 'checkbox';
        leftCheck.checked = config.yAxisPositionFFT === 'left';
        leftCheck.style.cursor = 'pointer';
        leftCheck.disabled = !config.showFFT; // Désactiver si FFT non affichée

        leftCheck.onchange = (e) => {
            e.stopPropagation();
            if (e.target.checked) {
                config.yAxisPositionFFT = 'left';
            } else {
                // Si on décoche L, masquer l'axe
                config.yAxisPositionFFT = 'hidden';
            }
            updateFFTCanalQuickView();
            if (typeof updateChannelConfigUI === 'function') {
                updateChannelConfigUI();
            }
            if (typeof performAnalysis === 'function') {
                performAnalysis();
            }
        };

        leftCell.appendChild(leftCheck);

        // Cellule checkbox R (Right) - pour domaine fréquentiel UNIQUEMENT
        const rightCell = document.createElement('td');
        rightCell.style.padding = '6px';
        rightCell.style.textAlign = 'center';

        const rightCheck = document.createElement('input');
        rightCheck.type = 'checkbox';
        rightCheck.checked = config.yAxisPositionFFT === 'right';
        rightCheck.style.cursor = 'pointer';
        rightCheck.disabled = !config.showFFT; // Désactiver si FFT non affichée

        rightCheck.onchange = (e) => {
            e.stopPropagation();
            if (e.target.checked) {
                config.yAxisPositionFFT = 'right';
            } else {
                // Si on décoche R, masquer l'axe
                config.yAxisPositionFFT = 'hidden';
            }
            updateFFTCanalQuickView();
            if (typeof updateChannelConfigUI === 'function') {
                updateChannelConfigUI();
            }
            if (typeof performAnalysis === 'function') {
                performAnalysis();
            }
        };

        rightCell.appendChild(rightCheck);

        row.appendChild(nameCell);
        row.appendChild(leftCell);
        row.appendChild(rightCell);
        tbody.appendChild(row);
    });
}

// Mettre à jour le sélecteur de canal à analyser
function updateFFTAnalysisChannelSelect() {
    const select = document.getElementById('fft-analysis-channel');
    if (!select || !appState.channelConfig) return;

    // Sauvegarder la sélection actuelle
    const currentValue = select.value;

    // Vider le sélecteur
    select.innerHTML = '<option value="">-- Sélectionner --</option>';

    // Ne montrer que les canaux visibles ET avec FFT activée
    const analyableChannels = appState.channelConfig.filter(config => config.visible && config.showFFT);

    analyableChannels.forEach(config => {
        const option = document.createElement('option');
        option.value = config.index;
        option.textContent = config.label;
        select.appendChild(option);
    });

    // Restaurer la sélection si possible
    if (currentValue && analyableChannels.some(c => c.index.toString() === currentValue)) {
        select.value = currentValue;
    } else if (analyableChannels.length > 0) {
        // Sélectionner le premier canal par défaut
        select.value = analyableChannels[0].index;
    }
}

// Fonction appelée quand on change le canal à analyser
function updateFFTAnalysisChannel() {
    const select = document.getElementById('fft-analysis-channel');
    if (!select) return;

    const channelIndex = parseInt(select.value);

    console.log(`📊 Canal FFT sélectionné pour analyse: ${channelIndex}`);

    // Relancer l'analyse FFT sur ce canal spécifique
    if (typeof performAnalysis === 'function') {
        performAnalysis();
    }
}
