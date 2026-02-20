// =====================================
// OUTIL DE DÉPLACEMENT (PAN) - Architecture POO
// =====================================

class PanTool {
    constructor() {
        // État de l'outil de déplacement
        this.state = {
            active: false,
            dragging: false,
            lastX: 0,
            lastY: 0,
            mode: 'free',        // 'free', 'horizontal', 'vertical'
            y0Active: false,     // Forcer Y=0
            zoomMode: null       // null, 'grid', 'horizontal', 'vertical'
        };

        // État du zoom par sélection de quadrillage
        this.gridZoomState = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            canvas: null
        };
    }

    // Réinitialiser tous les modes de déplacement et zoom
    resetAllModes() {
        // Réinitialiser les états
        this.state.mode = 'free';
        this.state.zoomMode = null;
        this.state.y0Active = false;

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
    toggle() {
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
            this.state.active = true;
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
            this.state.active = false;
            this.state.dragging = false;
            if (btn) {
                btn.style.background = 'var(--accent-blue)';
                btn.style.boxShadow = '';
            }

            // Désactiver TOUS les modes (pan et zoom)
            this.resetAllModes();

            setStatus('Mode Déplacement désactivé', 'info');
            console.log('❌ Outil de déplacement désactivé + accordéon fermé');
        }
    }

    // Gérer le clic pour le pan
    handleClick(event, chart) {
        if (!this.state.active) return false;

        this.state.dragging = true;
        this.state.lastX = event.clientX;
        this.state.lastY = event.clientY;
        return true; // L'outil a géré le clic
    }

    // Gérer le déplacement
    handleDrag(event, chart, canvas) {
        if (!this.state.active || !this.state.dragging) return false;

        const dx = event.clientX - this.state.lastX;
        const dy = event.clientY - this.state.lastY;

        // Déplacement horizontal (si mode 'free' ou 'horizontal')
        if (this.state.mode === 'free' || this.state.mode === 'horizontal') {
            const dxVal = (chart.scales.x.max - chart.scales.x.min) * (dx / canvas.width);
            chart.options.scales.x.min -= dxVal;
            chart.options.scales.x.max -= dxVal;
        }

        // Déplacement vertical sur TOUTES les échelles Y (si mode 'free' ou 'vertical')
        // Sauf si Y=0 est actif
        if (!this.state.y0Active && (this.state.mode === 'free' || this.state.mode === 'vertical')) {
            Object.keys(chart.scales).forEach(scaleKey => {
                if (scaleKey.startsWith('y')) {
                    const scale = chart.scales[scaleKey];
                    const dyVal = (scale.max - scale.min) * (dy / canvas.height);
                    chart.options.scales[scaleKey].min += dyVal;
                    chart.options.scales[scaleKey].max += dyVal;
                }
            });
        }

        this.state.lastX = event.clientX;
        this.state.lastY = event.clientY;
        chart.update('none');

        // Mise à jour immédiate des champs de zoom
        if (typeof updateZoomInputs === 'function') {
            updateZoomInputs();
        }

        return true; // L'outil a géré le mouvement
    }

    // Terminer le déplacement
    handleMouseUp() {
        if (this.state.dragging) {
            this.state.dragging = false;

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
    setPanMode(mode) {
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
        this.state.zoomMode = null;

        // Si on clique sur le mode déjà actif, revenir en mode libre
        if (this.state.mode === mode) {
            this.state.mode = 'free';
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
        this.state.mode = mode;
        const btn = document.getElementById(`pan-${mode}-btn`);
        if (btn) {
            btn.style.background = 'var(--accent-green)';
            btn.style.borderColor = 'var(--accent-green)';
        }

        // Si mode vertical, désactiver Y=0
        const y0Btn = document.getElementById('pan-y0-btn');
        if (mode === 'vertical' && y0Btn) {
            // Désactiver Y=0 s'il est actif
            if (this.state.y0Active) {
                this.toggleY0Mode(); // Désactiver Y=0
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
    toggleY0Mode() {
        this.state.y0Active = !this.state.y0Active;
        const btn = document.getElementById('pan-y0-btn');

        if (this.state.y0Active) {
            // Activer Y=0
            btn.style.background = 'var(--accent-green)';
            btn.style.borderColor = 'var(--accent-green)';

            // Forcer toutes les échelles Y à être centrées sur 0
            this.forceY0OnAllCharts();

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
    forceY0OnAllCharts() {
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
    setZoomMode(mode) {
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
        this.state.mode = 'free';

        // Si on clique sur le mode déjà actif, le désactiver
        if (this.state.zoomMode === mode) {
            this.state.zoomMode = null;
            setStatus(`Mode zoom désactivé`);
            return;
        }

        // Activer le nouveau mode
        this.state.zoomMode = mode;
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
    handleCustomZoom(event, chart, delta) {
        if (!this.state.zoomMode) return false;

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

        if (this.state.zoomMode === 'horizontal') {
            // Zoom horizontal centré sur la souris
            this.zoomHorizontalAtMouse(chart, mouseX, canvas.width, zoomFactor);
            return true;
        } else if (this.state.zoomMode === 'vertical') {
            // Zoom vertical centré sur la souris
            this.zoomVerticalAtMouse(chart, mouseY, canvas.height, zoomFactor);
            return true;
        }

        return false;
    }

    // Zoom horizontal centré sur la position de la souris
    zoomHorizontalAtMouse(chart, mouseX, canvasWidth, factor) {
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
    roundToNiceNumber(value) {
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
    zoomVerticalAtMouse(chart, mouseY, canvasHeight, factor) {
        // Si Y=0 est actif, garder min=0 (axe en bas)
        if (this.state.y0Active) {
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

    // Gérer le clic pour le zoom par sélection
    handleGridZoomClick(event, chart, canvas) {
        if (this.state.zoomMode !== 'grid') return false;

        this.gridZoomState.active = true;
        this.gridZoomState.canvas = canvas;

        const rect = canvas.getBoundingClientRect();
        this.gridZoomState.startX = event.clientX - rect.left;
        this.gridZoomState.startY = event.clientY - rect.top;
        this.gridZoomState.currentX = this.gridZoomState.startX;
        this.gridZoomState.currentY = this.gridZoomState.startY;

        return true;
    }

    // Gérer le drag pour le zoom par sélection
    handleGridZoomDrag(event, chart, canvas) {
        if (this.state.zoomMode !== 'grid' || !this.gridZoomState.active) return false;

        const rect = canvas.getBoundingClientRect();
        this.gridZoomState.currentX = event.clientX - rect.left;
        this.gridZoomState.currentY = event.clientY - rect.top;

        // Redessiner le rectangle de sélection
        this.drawGridZoomSelection(chart, canvas);

        return true;
    }

    // Gérer le relâchement pour appliquer le zoom
    handleGridZoomRelease(event, chart, canvas) {
        if (this.state.zoomMode !== 'grid' || !this.gridZoomState.active) return false;

        this.gridZoomState.active = false;

        // Calculer la zone sélectionnée
        const x1 = Math.min(this.gridZoomState.startX, this.gridZoomState.currentX);
        const x2 = Math.max(this.gridZoomState.startX, this.gridZoomState.currentX);
        const y1 = Math.min(this.gridZoomState.startY, this.gridZoomState.currentY);
        const y2 = Math.max(this.gridZoomState.startY, this.gridZoomState.currentY);

        // Vérifier que la sélection est suffisamment grande (au moins 10 pixels)
        if (Math.abs(x2 - x1) < 10 || Math.abs(y2 - y1) < 10) {
            chart.update(); // Redessiner pour effacer le rectangle
            return true;
        }

        // Convertir les coordonnées pixel en coordonnées de données
        const xScale = chart.scales.x;
        const newXMin = xScale.getValueForPixel(x1);
        const newXMax = xScale.getValueForPixel(x2);

        // Obtenir les infos du canal X
        const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's', isTime: true };

        if (xInfo.isTime) {
            // X = Temps: mettre à jour les champs Min(s)/Max(s) puis appliquer
            const zoomMinInput = document.getElementById('zoom-min');
            const zoomMaxInput = document.getElementById('zoom-max');

            if (zoomMinInput && zoomMaxInput) {
                zoomMinInput.value = (newXMin / xInfo.scale).toFixed(3);
                zoomMaxInput.value = (newXMax / xInfo.scale).toFixed(3);
                console.log(`🎯 Zoom Quadrillage (temps): ${zoomMinInput.value}s à ${zoomMaxInput.value}s`);
            }
        } else {
            // X ≠ Temps: mettre à jour Ymin/Ymax du canal X
            const xChannelConfig = appState.channelConfig.find(cfg => cfg.index === xInfo.dataIndex);
            if (xChannelConfig) {
                xChannelConfig.yMin = newXMin / xInfo.scale;
                xChannelConfig.yMax = newXMax / xInfo.scale;
                console.log(`🎯 Zoom Quadrillage (canal ${xInfo.label}): ${xChannelConfig.yMin.toFixed(2)} à ${xChannelConfig.yMax.toFixed(2)} ${xInfo.unit}`);

                // Mettre à jour l'interface si le configurateur est ouvert
                const table = document.getElementById('channel-config-tbody');
                if (table) {
                    const globalIndex = appState.channelConfig.indexOf(xChannelConfig);
                    const row = Array.from(table.rows).find(r => r.getAttribute('data-global-index') === globalIndex.toString());
                    if (row) {
                        const yMinInput = row.querySelectorAll('input[type="number"]')[0];
                        const yMaxInput = row.querySelectorAll('input[type="number"]')[1];
                        if (yMinInput) yMinInput.value = xChannelConfig.yMin.toFixed(1);
                        if (yMaxInput) yMaxInput.value = xChannelConfig.yMax.toFixed(1);
                    }
                }
            }
        }

        // Si Y=0 n'est pas actif, zoomer aussi verticalement
        if (!this.state.y0Active) {
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

        // CRITIQUE: Ne pas appeler chart.update() ni updateZoomInputs() ici!
        // Les champs Min(s)/Max(s) ou Ymin/Ymax ont été mis à jour ci-dessus.
        // updateTimeChart() va lire ces champs et appliquer le zoom correctement.

        if (typeof updateTimeChart === 'function') {
            updateTimeChart();
            console.log("🔄 Zoom Quadrillage appliqué via updateTimeChart()");
        } else {
            // Fallback si updateTimeChart n'existe pas
            chart.update('none');
        }

        return true;
    }

    // Dessiner le rectangle de sélection
    drawGridZoomSelection(chart, canvas) {
        // Redessiner le graphique
        chart.update('none');

        // Obtenir le contexte 2D
        const ctx = canvas.getContext('2d');

        // Calculer les coordonnées du rectangle
        const x = Math.min(this.gridZoomState.startX, this.gridZoomState.currentX);
        const y = Math.min(this.gridZoomState.startY, this.gridZoomState.currentY);
        const width = Math.abs(this.gridZoomState.currentX - this.gridZoomState.startX);
        const height = Math.abs(this.gridZoomState.currentY - this.gridZoomState.startY);

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
    updateZoomInputs() {
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
    applyZoom() {
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
}

// =====================================
// INSTANCE GLOBALE (pour compatibilité)
// =====================================

const panTool = new PanTool();

// =====================================
// FONCTIONS DE COMPATIBILITÉ (délégation vers l'instance)
// =====================================

function resetAllPanZoomModes() {
    panTool.resetAllModes();
}

function togglePanTool() {
    panTool.toggle();
}

function handlePanClick(event, chart) {
    return panTool.handleClick(event, chart);
}

function handlePanDrag(event, chart, canvas) {
    return panTool.handleDrag(event, chart, canvas);
}

function handlePanMouseUp() {
    return panTool.handleMouseUp();
}

function setPanMode(mode) {
    panTool.setPanMode(mode);
}

function toggleY0Mode() {
    panTool.toggleY0Mode();
}

function forceY0OnAllCharts() {
    panTool.forceY0OnAllCharts();
}

function setZoomMode(mode) {
    panTool.setZoomMode(mode);
}

function handleCustomZoom(event, chart, delta) {
    return panTool.handleCustomZoom(event, chart, delta);
}

function zoomHorizontalAtMouse(chart, mouseX, canvasWidth, factor) {
    panTool.zoomHorizontalAtMouse(chart, mouseX, canvasWidth, factor);
}

function roundToNiceNumber(value) {
    return panTool.roundToNiceNumber(value);
}

function zoomVerticalAtMouse(chart, mouseY, canvasHeight, factor) {
    panTool.zoomVerticalAtMouse(chart, mouseY, canvasHeight, factor);
}

function handleGridZoomClick(event, chart, canvas) {
    return panTool.handleGridZoomClick(event, chart, canvas);
}

function handleGridZoomDrag(event, chart, canvas) {
    return panTool.handleGridZoomDrag(event, chart, canvas);
}

function handleGridZoomRelease(event, chart, canvas) {
    return panTool.handleGridZoomRelease(event, chart, canvas);
}

function drawGridZoomSelection(chart, canvas) {
    panTool.drawGridZoomSelection(chart, canvas);
}

function updateZoomInputs() {
    panTool.updateZoomInputs();
}

function applyPanToolZoom() {
    panTool.applyZoom();
}

// Accesseurs pour les variables globales (utilisés par d'autres parties du code)
Object.defineProperty(window, 'panState', {
    get: () => panTool.state,
    set: (value) => { panTool.state = value; },
    configurable: true
});

Object.defineProperty(window, 'gridZoomState', {
    get: () => panTool.gridZoomState,
    set: (value) => { panTool.gridZoomState = value; },
    configurable: true
});
