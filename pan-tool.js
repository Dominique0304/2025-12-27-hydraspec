// =====================================
// OUTIL DE DÉPLACEMENT (PAN)
// =====================================

// État de l'outil de déplacement
let panState = {
    active: false,
    dragging: false,
    lastX: 0,
    lastY: 0,
    mode: 'free',        // 'free', 'horizontal', 'vertical'
    y0Active: false,     // Forcer Y=0
    zoomMode: null       // null, 'grid', 'horizontal', 'vertical'
};

// Réinitialiser tous les modes de déplacement et zoom
function resetAllPanZoomModes() {
    // Réinitialiser les états
    panState.mode = 'free';
    panState.zoomMode = null;
    panState.y0Active = false;

    // Désactiver tous les boutons de déplacement
    const panModes = ['horizontal', 'vertical'];
    panModes.forEach(m => {
        const btn = document.getElementById(`pan-${m}-btn`);
        if (btn) {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.borderColor = 'var(--border-color)';
        }
    });

    // Désactiver tous les boutons de zoom
    const zoomModes = ['grid', 'horizontal', 'vertical'];
    zoomModes.forEach(m => {
        const btn = document.getElementById(`zoom-${m}-btn`);
        if (btn) {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.borderColor = 'var(--border-color)';
        }
    });

    // Désactiver le bouton Y=0
    const y0Btn = document.getElementById('pan-y0-btn');
    if (y0Btn) {
        y0Btn.style.background = 'var(--bg-secondary)';
        y0Btn.style.borderColor = 'var(--border-color)';
        y0Btn.disabled = false;
        y0Btn.style.opacity = '1';
        y0Btn.style.cursor = 'pointer';
    }

    console.log('🔄 Tous les modes de déplacement/zoom réinitialisés');
}

// Activer/désactiver l'outil de déplacement
function togglePanTool() {
    const content = document.getElementById('pan-content');
    const icon = document.getElementById('pan-toggle-icon');
    const btn = document.getElementById('btn-pan-main');

    // Vérifier si l'accordéon est ouvert
    const isAccordionOpen = content && content.style.display !== 'none';

    if (!isAccordionOpen) {
        // OUVRIR L'ACCORDÉON + ACTIVER L'OUTIL

        // Désactiver les autres outils
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('pan');
        }

        // Fermer tous les autres accordéons principaux
        if (typeof closeAllMainAccordions === 'function') {
            closeAllMainAccordions('pan');
        }

        // Ouvrir l'accordéon
        if (content) content.style.display = 'block';
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }

        // Activer l'outil
        panState.active = true;
        if (btn) {
            btn.style.background = 'var(--accent-green)';
            btn.style.boxShadow = '0 0 10px var(--accent-green)';
        }
        setStatus('Mode Déplacement activé - Cliquez et glissez pour déplacer le graphique', 'info');
        console.log('✅ Outil de déplacement activé');

    } else {
        // FERMER L'ACCORDÉON + DÉSACTIVER L'OUTIL + RÉINITIALISER TOUS LES MODES

        // Fermer l'accordéon
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }

        // Désactiver l'outil
        panState.active = false;
        panState.dragging = false;
        if (btn) {
            btn.style.background = 'var(--accent-blue)';
            btn.style.boxShadow = '';
        }

        // Désactiver TOUS les modes (pan et zoom)
        resetAllPanZoomModes();

        setStatus('Mode Déplacement désactivé', 'info');
        console.log('❌ Outil de déplacement désactivé + accordéon fermé');
    }
}

// Gérer le clic pour le pan
function handlePanClick(event, chart) {
    if (!panState.active) return false;

    panState.dragging = true;
    panState.lastX = event.clientX;
    panState.lastY = event.clientY;
    return true; // L'outil a géré le clic
}

// Gérer le déplacement
function handlePanDrag(event, chart, canvas) {
    if (!panState.active || !panState.dragging) return false;

    const dx = event.clientX - panState.lastX;
    const dy = event.clientY - panState.lastY;

    // Déplacement horizontal (si mode 'free' ou 'horizontal')
    if (panState.mode === 'free' || panState.mode === 'horizontal') {
        const dxVal = (chart.scales.x.max - chart.scales.x.min) * (dx / canvas.width);
        chart.options.scales.x.min -= dxVal;
        chart.options.scales.x.max -= dxVal;
    }

    // Déplacement vertical sur TOUTES les échelles Y (si mode 'free' ou 'vertical')
    // Sauf si Y=0 est actif
    if (!panState.y0Active && (panState.mode === 'free' || panState.mode === 'vertical')) {
        Object.keys(chart.scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                const scale = chart.scales[scaleKey];
                const dyVal = (scale.max - scale.min) * (dy / canvas.height);
                chart.options.scales[scaleKey].min += dyVal;
                chart.options.scales[scaleKey].max += dyVal;
            }
        });
    }

    panState.lastX = event.clientX;
    panState.lastY = event.clientY;
    chart.update('none');

    // Mise à jour immédiate des champs de zoom
    if (typeof updateZoomInputs === 'function') {
        updateZoomInputs();
    }

    return true; // L'outil a géré le mouvement
}

// Terminer le déplacement
function handlePanMouseUp() {
    if (panState.dragging) {
        panState.dragging = false;

        // CRITIQUE: Recalculer le downsampling après le pan
        if (typeof updateTimeChart === 'function') {
            updateTimeChart();
            console.log("🔄 Downsampling recalculé après pan");
        }

        // Sauvegarder l'état après le déplacement
        if (typeof saveZoomState === 'function') {
            saveZoomState();
        }

        return true;
    }
    return false;
}

// =====================================
// MODES DE DÉPLACEMENT
// =====================================

// Définir le mode de déplacement
function setPanMode(mode) {
    // Désactiver TOUS les modes (pan ET zoom)
    const panModes = ['horizontal', 'vertical'];
    const zoomModes = ['grid', 'horizontal', 'vertical'];

    panModes.forEach(m => {
        const btn = document.getElementById(`pan-${m}-btn`);
        if (btn) {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.borderColor = 'var(--border-color)';
        }
    });

    // Désactiver aussi tous les modes de zoom
    zoomModes.forEach(m => {
        const btn = document.getElementById(`zoom-${m}-btn`);
        if (btn) {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.borderColor = 'var(--border-color)';
        }
    });

    // Réinitialiser le mode de zoom
    panState.zoomMode = null;

    // Si on clique sur le mode déjà actif, revenir en mode libre
    if (panState.mode === mode) {
        panState.mode = 'free';
        setStatus(`Déplacement libre activé`);

        // Réactiver Y=0 si besoin
        const y0Btn = document.getElementById('pan-y0-btn');
        if (y0Btn) {
            y0Btn.disabled = false;
            y0Btn.style.opacity = '1';
            y0Btn.style.cursor = 'pointer';
        }
        return;
    }

    // Activer le nouveau mode
    panState.mode = mode;
    const btn = document.getElementById(`pan-${mode}-btn`);
    if (btn) {
        btn.style.background = 'var(--accent-green)';
        btn.style.borderColor = 'var(--accent-green)';
    }

    // Si mode vertical, désactiver Y=0
    const y0Btn = document.getElementById('pan-y0-btn');
    if (mode === 'vertical' && y0Btn) {
        // Désactiver Y=0 s'il est actif
        if (panState.y0Active) {
            toggleY0Mode(); // Désactiver Y=0
        }
        // Griser le bouton Y=0
        y0Btn.disabled = true;
        y0Btn.style.opacity = '0.5';
        y0Btn.style.cursor = 'not-allowed';
    } else if (y0Btn) {
        // Réactiver Y=0 pour les autres modes (horizontal, free)
        y0Btn.disabled = false;
        y0Btn.style.opacity = '1';
        y0Btn.style.cursor = 'pointer';
    }

    const modeNames = {
        'horizontal': 'horizontal uniquement',
        'vertical': 'vertical uniquement'
    };
    setStatus(`Déplacement ${modeNames[mode]} activé`);

    console.log(`🔄 Mode de déplacement: ${mode}`);
}

// Activer/désactiver le mode Y=0
function toggleY0Mode() {
    panState.y0Active = !panState.y0Active;
    const btn = document.getElementById('pan-y0-btn');

    if (panState.y0Active) {
        // Activer Y=0
        btn.style.background = 'var(--accent-green)';
        btn.style.borderColor = 'var(--accent-green)';

        // Forcer toutes les échelles Y à être centrées sur 0
        forceY0OnAllCharts();

        setStatus("Mode Y=0 activé - Les courbes sont centrées sur Y=0");
        console.log("✅ Mode Y=0 activé");
    } else {
        // Désactiver Y=0
        btn.style.background = 'var(--bg-secondary)';
        btn.style.borderColor = 'var(--border-color)';

        setStatus("Mode Y=0 désactivé");
        console.log("❌ Mode Y=0 désactivé");
    }
}

// Forcer toutes les échelles Y à être centrées sur 0
function forceY0OnAllCharts() {
    const timeChart = appState.charts?.time;
    const freqChart = appState.charts?.freq;

    [timeChart, freqChart].forEach(chart => {
        if (!chart) return;

        Object.keys(chart.scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                const scale = chart.scales[scaleKey];
                const currentRange = scale.max - scale.min;

                // Positionner l'axe en bas : Y=0 en bas, pas de valeurs négatives
                chart.options.scales[scaleKey].min = 0;
                chart.options.scales[scaleKey].max = currentRange;
            }
        });

        chart.update('none');
    });
}

// =====================================
// MODES DE ZOOM
// =====================================

// Définir le mode de zoom
function setZoomMode(mode) {
    // Désactiver TOUS les modes (zoom ET pan)
    const zoomModes = ['grid', 'horizontal', 'vertical'];
    const panModes = ['horizontal', 'vertical'];

    zoomModes.forEach(m => {
        const btn = document.getElementById(`zoom-${m}-btn`);
        if (btn) {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.borderColor = 'var(--border-color)';
        }
    });

    // Désactiver aussi tous les modes de pan
    panModes.forEach(m => {
        const btn = document.getElementById(`pan-${m}-btn`);
        if (btn) {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.borderColor = 'var(--border-color)';
        }
    });

    // Réinitialiser le mode de pan
    panState.mode = 'free';

    // Si on clique sur le mode déjà actif, le désactiver
    if (panState.zoomMode === mode) {
        panState.zoomMode = null;
        setStatus(`Mode zoom désactivé`);
        return;
    }

    // Activer le nouveau mode
    panState.zoomMode = mode;
    const btn = document.getElementById(`zoom-${mode}-btn`);
    if (btn) {
        btn.style.background = 'var(--accent-green)';
        btn.style.borderColor = 'var(--accent-green)';
    }

    const modeNames = {
        'grid': 'par sélection de quadrillage',
        'horizontal': 'horizontal centré sur la souris',
        'vertical': 'vertical centré sur la souris'
    };
    setStatus(`Mode zoom ${modeNames[mode]} activé`);

    console.log(`🔍 Mode de zoom: ${mode}`);
}

// Gérer le zoom avec la molette en fonction du mode actif
function handleCustomZoom(event, chart, delta) {
    if (!panState.zoomMode) return false;

    // Ctrl et Alt ont la priorité - ne pas gérer
    if (event.ctrlKey || event.altKey) {
        return false;
    }

    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Facteur de zoom
    const zoomFactor = delta > 0 ? 0.9 : 1.1;

    if (panState.zoomMode === 'horizontal') {
        // Zoom horizontal centré sur la souris
        zoomHorizontalAtMouse(chart, mouseX, canvas.width, zoomFactor);
        return true;
    } else if (panState.zoomMode === 'vertical') {
        // Zoom vertical centré sur la souris
        zoomVerticalAtMouse(chart, mouseY, canvas.height, zoomFactor);
        return true;
    }

    return false;
}

// Zoom horizontal centré sur la position de la souris
function zoomHorizontalAtMouse(chart, mouseX, canvasWidth, factor) {
    const xScale = chart.scales.x;
    const xRange = xScale.max - xScale.min;

    // Position relative de la souris (0 à 1)
    const mouseRatio = mouseX / canvasWidth;

    // Calculer le point focal en coordonnées de données
    const focalPoint = xScale.min + xRange * mouseRatio;

    // Nouvelle plage
    const newRange = xRange * factor;

    // Centrer le zoom sur le point focal
    chart.options.scales.x.min = focalPoint - newRange * mouseRatio;
    chart.options.scales.x.max = focalPoint + newRange * (1 - mouseRatio);

    chart.update('none');

    if (typeof updateZoomInputs === 'function') {
        updateZoomInputs();
    }
}

// Fonction pour arrondir une valeur à un chiffre "rond"
function roundToNiceNumber(value) {
    if (value === 0) return 0;

    const sign = value >= 0 ? 1 : -1;
    const absValue = Math.abs(value);

    // Trouver l'ordre de grandeur
    const magnitude = Math.pow(10, Math.floor(Math.log10(absValue)));

    // Normaliser la valeur (1 <= normalized < 10)
    const normalized = absValue / magnitude;

    // Arrondir au prochain chiffre rond: 1, 2, 3, 5, 10
    let roundedNormalized;
    if (normalized <= 1) {
        roundedNormalized = 1;
    } else if (normalized <= 2) {
        roundedNormalized = 2;
    } else if (normalized <= 3) {
        roundedNormalized = 3;
    } else if (normalized <= 5) {
        roundedNormalized = 5;
    } else {
        roundedNormalized = 10;
    }

    return sign * roundedNormalized * magnitude;
}

// Zoom vertical centré sur la position de la souris
function zoomVerticalAtMouse(chart, mouseY, canvasHeight, factor) {
    // Si Y=0 est actif, garder min=0 (axe en bas)
    if (panState.y0Active) {
        Object.keys(chart.scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                const scale = chart.scales[scaleKey];
                const currentRange = scale.max - scale.min;
                const newRange = currentRange * factor;

                chart.options.scales[scaleKey].min = 0;
                chart.options.scales[scaleKey].max = newRange;
            }
        });
    } else {
        // Zoom normal centré sur la souris
        Object.keys(chart.scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                const scale = chart.scales[scaleKey];
                const yRange = scale.max - scale.min;

                // Position relative de la souris (inversée car Y est vers le bas)
                const mouseRatio = 1 - (mouseY / canvasHeight);

                // Point focal
                const focalPoint = scale.min + yRange * mouseRatio;

                // Nouvelle plage
                const newRange = yRange * factor;

                const newMin = focalPoint - newRange * mouseRatio;
                const newMax = focalPoint + newRange * (1 - mouseRatio);

                chart.options.scales[scaleKey].min = newMin;
                chart.options.scales[scaleKey].max = newMax;
            }
        });
    }

    chart.update('none');
}

// =====================================
// ZOOM PAR SÉLECTION DE QUADRILLAGE
// =====================================

let gridZoomState = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    canvas: null
};

// Gérer le clic pour le zoom par sélection
function handleGridZoomClick(event, chart, canvas) {
    if (panState.zoomMode !== 'grid') return false;

    gridZoomState.active = true;
    gridZoomState.canvas = canvas;

    const rect = canvas.getBoundingClientRect();
    gridZoomState.startX = event.clientX - rect.left;
    gridZoomState.startY = event.clientY - rect.top;
    gridZoomState.currentX = gridZoomState.startX;
    gridZoomState.currentY = gridZoomState.startY;

    return true;
}

// Gérer le drag pour le zoom par sélection
function handleGridZoomDrag(event, chart, canvas) {
    if (panState.zoomMode !== 'grid' || !gridZoomState.active) return false;

    const rect = canvas.getBoundingClientRect();
    gridZoomState.currentX = event.clientX - rect.left;
    gridZoomState.currentY = event.clientY - rect.top;

    // Redessiner le rectangle de sélection
    drawGridZoomSelection(chart, canvas);

    return true;
}

// Gérer le relâchement pour appliquer le zoom
function handleGridZoomRelease(event, chart, canvas) {
    if (panState.zoomMode !== 'grid' || !gridZoomState.active) return false;

    gridZoomState.active = false;

    // Calculer la zone sélectionnée
    const x1 = Math.min(gridZoomState.startX, gridZoomState.currentX);
    const x2 = Math.max(gridZoomState.startX, gridZoomState.currentX);
    const y1 = Math.min(gridZoomState.startY, gridZoomState.currentY);
    const y2 = Math.max(gridZoomState.startY, gridZoomState.currentY);

    // Vérifier que la sélection est suffisamment grande (au moins 10 pixels)
    if (Math.abs(x2 - x1) < 10 || Math.abs(y2 - y1) < 10) {
        chart.update(); // Redessiner pour effacer le rectangle
        return true;
    }

    // Convertir les coordonnées pixel en coordonnées de données
    const xScale = chart.scales.x;
    const newXMin = xScale.getValueForPixel(x1);
    const newXMax = xScale.getValueForPixel(x2);

    // Appliquer le zoom horizontal
    chart.options.scales.x.min = newXMin;
    chart.options.scales.x.max = newXMax;

    // Si Y=0 n'est pas actif, zoomer aussi verticalement
    if (!panState.y0Active) {
        Object.keys(chart.scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                const yScale = chart.scales[scaleKey];
                // Inverser Y car les pixels augmentent vers le bas
                const newYMin = yScale.getValueForPixel(y2);
                const newYMax = yScale.getValueForPixel(y1);

                chart.options.scales[scaleKey].min = newYMin;
                chart.options.scales[scaleKey].max = newYMax;
            }
        });
    }

    chart.update('none');

    if (typeof updateZoomInputs === 'function') {
        updateZoomInputs();
    }

    // CRITIQUE: Recalculer le downsampling après le zoom par grille
    if (typeof updateTimeChart === 'function') {
        updateTimeChart();
        console.log("🔄 Downsampling recalculé après zoom par grille");
    }

    return true;
}

// Dessiner le rectangle de sélection
function drawGridZoomSelection(chart, canvas) {
    // Redessiner le graphique
    chart.update('none');

    // Obtenir le contexte 2D
    const ctx = canvas.getContext('2d');

    // Calculer les coordonnées du rectangle
    const x = Math.min(gridZoomState.startX, gridZoomState.currentX);
    const y = Math.min(gridZoomState.startY, gridZoomState.currentY);
    const width = Math.abs(gridZoomState.currentX - gridZoomState.startX);
    const height = Math.abs(gridZoomState.currentY - gridZoomState.startY);

    // Dessiner un rectangle semi-transparent
    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.fillRect(x, y, width, height);

    // Dessiner le contour
    ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
}

// =====================================
// MISE À JOUR DES CHAMPS T MIN/T MAX
// =====================================

// Mettre à jour les champs T min et T max avec les valeurs actuelles du zoom
function updateZoomInputs() {
    const tMinInput = document.getElementById('zoom-t-min');
    const tMaxInput = document.getElementById('zoom-t-max');

    if (!tMinInput || !tMaxInput) return;

    // Récupérer le graphique time
    const chart = appState.charts?.time;
    if (!chart) return;

    // Récupérer l'échelle X
    const xScale = chart.scales.x;
    if (!xScale) return;

    // Obtenir les infos du canal X pour la conversion dynamique
    const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's' };

    // Mettre à jour les champs avec conversion dynamique
    tMinInput.value = (xScale.min / xInfo.scale).toFixed(3);
    tMaxInput.value = (xScale.max / xInfo.scale).toFixed(3);
}

// Appliquer le zoom depuis les champs T min et T max
function applyPanToolZoom() {
    const tMinInput = document.getElementById('zoom-t-min');
    const tMaxInput = document.getElementById('zoom-t-max');

    if (!tMinInput || !tMaxInput) return;

    const minX = parseFloat(tMinInput.value);
    const maxX = parseFloat(tMaxInput.value);

    // Vérifier que les valeurs sont valides
    if (isNaN(minX) || isNaN(maxX) || minX >= maxX) {
        setStatus('Valeurs T min/T max invalides', 'error');
        return;
    }

    // Récupérer le graphique time
    const chart = appState.charts?.time;
    if (!chart) return;

    // Obtenir les infos du canal X pour la conversion dynamique
    const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's' };

    // Appliquer le zoom avec conversion dynamique
    chart.options.scales.x.min = minX * xInfo.scale;
    chart.options.scales.x.max = maxX * xInfo.scale;

    chart.update('none');
    setStatus(`Zoom appliqué: ${minX}${xInfo.unit} - ${maxX}${xInfo.unit}`, 'success');

    // Sauvegarder l'état après le zoom manuel
    if (typeof saveZoomState === 'function') {
        saveZoomState();
    }
}
