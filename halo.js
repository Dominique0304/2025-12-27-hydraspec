// =====================================================
// HALO DE SOURIS - Indicateur visuel compatible tous outils
// =====================================================

// Variable globale pour activer/désactiver le halo
let haloEnabled = true;

// Fonction globale pour basculer le halo
function toggleHaloEnabled() {
    const toggle = document.getElementById('halo-enabled-toggle');
    haloEnabled = toggle ? toggle.checked : true;

    // Sauvegarder dans localStorage
    localStorage.setItem('haloEnabled', haloEnabled);

    // Appliquer immédiatement
    const halo = document.getElementById('mouse-halo');
    if (halo && !haloEnabled) {
        halo.style.opacity = '0';
    }

    console.log('Halo', haloEnabled ? 'activé' : 'désactivé');
}

// Charger la préférence au démarrage
function loadHaloPreference() {
    const saved = localStorage.getItem('haloEnabled');
    if (saved !== null) {
        haloEnabled = saved === 'true';
        const toggle = document.getElementById('halo-enabled-toggle');
        if (toggle) {
            toggle.checked = haloEnabled;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Charger la préférence
    loadHaloPreference();

    // 1. Création de l'élément HTML du halo
    const halo = document.createElement('div');
    halo.id = 'mouse-halo';
    document.body.appendChild(halo);

    // Variables pour la position
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let haloX = mouseX;
    let haloY = mouseY;

    // Variables d'état
    let isInTimeDomain = false;
    let isNearCursor = false;

    // Pour l'effet de "traîne" (Lerp : Linear Interpolation)
    const delay = 1.;

    // Dimensions de base
    const baseSize = 50; // px
    const reducedSize = 25; // px pour Shift/Ctrl
    const cursorNearSize = 20; // px près des curseurs
    const clickSize = 15; // px pour clic
    const magnetZone = 15; // pixels de zone magnétique

    // États des touches
    let isShiftPressed = false;
    let isCtrlPressed = false;

    // Variable pour savoir si les charts sont initialisés
    let chartsReady = false;

    // Fonction pour obtenir la position réelle des curseurs FFT en pixels écran
    function getCursorPositionsInPixels() {
        if (!appState || !appState.charts || !appState.charts.time) {
            return { start: null, end: null };
        }

        const timeCanvas = document.getElementById('timeChart');
        if (!timeCanvas) return { start: null, end: null };

        const chart = appState.charts.time;
        const canvasRect = timeCanvas.getBoundingClientRect();

        // Convertir les positions temporelles en pixels dans le canvas
        const cursorStartMs = appState.cursorStart * 1000;
        const cursorEndMs = appState.cursorEnd * 1000;

        // Vérifier si les curseurs sont dans la zone visible
        const xMin = chart.scales.x.min;
        const xMax = chart.scales.x.max;

        // Si les deux curseurs sont hors de la zone visible, retourner null
        if ((cursorStartMs < xMin && cursorEndMs < xMin) ||
            (cursorStartMs > xMax && cursorEndMs > xMax)) {
            return { start: null, end: null };
        }

        // Obtenir les positions relatives dans le canvas
        const cursorStartRelative = chart.scales.x.getPixelForValue(cursorStartMs);
        const cursorEndRelative = chart.scales.x.getPixelForValue(cursorEndMs);

        // Convertir en positions absolues dans la fenêtre
        const cursorStartAbsolute = canvasRect.left + cursorStartRelative;
        const cursorEndAbsolute = canvasRect.left + cursorEndRelative;

        return {
            start: cursorStartAbsolute,
            end: cursorEndAbsolute
        };
    }

    // Fonction pour vérifier la proximité avec TOUS les curseurs et outils
    function checkCursorProximity() {
        if (!isInTimeDomain) {
            isNearCursor = false;
            return;
        }

        // Attendre que les charts soient prêts
        if (!chartsReady || !appState || !appState.charts || !appState.charts.time) {
            isNearCursor = false;
            return;
        }

        const timeCanvas = document.getElementById('timeChart');
        if (!timeCanvas) {
            isNearCursor = false;
            return;
        }

        const canvasRect = timeCanvas.getBoundingClientRect();
        const chart = appState.charts.time;

        const isInYRange = mouseY >= canvasRect.top && mouseY <= canvasRect.bottom;

        // 1. CURSEURS FFT (zone d'analyse) - seulement si visibles
        const cursorPositions = getCursorPositionsInPixels();
        if (cursorPositions.start !== null && cursorPositions.end !== null) {
            const distToStart = Math.abs(mouseX - cursorPositions.start);
            const distToEnd = Math.abs(mouseX - cursorPositions.end);

            if (isInYRange && (distToStart <= magnetZone || distToEnd <= magnetZone)) {
                isNearCursor = true;
                return;
            }
        }

        // 2. CURSEURS D'INTERVAL (si visibles)
        if (typeof intervals !== 'undefined' && intervals && intervals.length > 0) {
            for (const interval of intervals) {
                if (!interval.visible) continue; // Ignorer si masqué

                const startTime = interval.getStartTime();
                const endTime = interval.getEndTime();
                const yPixel = interval.getYPixelPosition(chart);

                const startX = canvasRect.left + chart.scales.x.getPixelForValue(startTime * 1000);
                const endX = canvasRect.left + chart.scales.x.getPixelForValue(endTime * 1000);
                const barY = canvasRect.top + yPixel;

                // Curseur gauche
                if (Math.abs(mouseX - startX) <= magnetZone && Math.abs(mouseY - barY) <= magnetZone) {
                    isNearCursor = true;
                    return;
                }

                // Curseur droit
                if (Math.abs(mouseX - endX) <= magnetZone && Math.abs(mouseY - barY) <= magnetZone) {
                    isNearCursor = true;
                    return;
                }

                // Barre horizontale
                if (mouseX > startX && mouseX < endX && Math.abs(mouseY - barY) <= magnetZone) {
                    isNearCursor = true;
                    return;
                }
            }
        }

        // 3. OUTIL MESURE DE DIFFÉRENCE
        if (typeof measureState !== 'undefined' && measureState && measureState.active) {
            if (measureState.point1) {
                const p1X = canvasRect.left + chart.scales.x.getPixelForValue(measureState.point1.x);
                const p1Y = canvasRect.top + chart.scales.y.getPixelForValue(measureState.point1.y);
                const distToP1 = Math.sqrt((mouseX - p1X)**2 + (mouseY - p1Y)**2);

                if (distToP1 <= magnetZone) {
                    isNearCursor = true;
                    return;
                }
            }

            if (measureState.point2) {
                const p2X = canvasRect.left + chart.scales.x.getPixelForValue(measureState.point2.x);
                const p2Y = canvasRect.top + chart.scales.y.getPixelForValue(measureState.point2.y);
                const distToP2 = Math.sqrt((mouseX - p2X)**2 + (mouseY - p2Y)**2);

                if (distToP2 <= magnetZone) {
                    isNearCursor = true;
                    return;
                }
            }
        }

        // 4. OUTIL RÈGLE
        if (typeof rulerState !== 'undefined' && rulerState && rulerState.active && rulerState.point) {
            const rX = canvasRect.left + chart.scales.x.getPixelForValue(rulerState.point.x);
            const rY = canvasRect.top + chart.scales.y.getPixelForValue(rulerState.point.y);
            const distToRuler = Math.sqrt((mouseX - rX)**2 + (mouseY - rY)**2);

            if (distToRuler <= magnetZone) {
                isNearCursor = true;
                return;
            }
        }

        // 5. OUTIL TRAQUER
        if (typeof trackState !== 'undefined' && trackState && trackState.active && trackState.currentX !== null) {
            const tX = canvasRect.left + chart.scales.x.getPixelForValue(trackState.currentX);
            const distToTrack = Math.abs(mouseX - tX);

            // Curseur vertical, on vérifie juste la distance en X et qu'on est dans le graphique
            if (distToTrack <= magnetZone && isInYRange) {
                isNearCursor = true;
                return;
            }
        }

        // 6. ANNOTATIONS (si visibles et annotationsVisible activé)
        if (typeof annotations !== 'undefined' && annotations && annotations.length > 0 &&
            typeof annotationsVisible !== 'undefined' && annotationsVisible) {

            for (const annotation of annotations) {
                if (!annotation.visible) continue; // Ignorer si masquée

                // Position du point d'ancrage
                const anchorX = canvasRect.left + chart.scales.x.getPixelForValue(annotation.time * 1000);
                const anchorY = canvasRect.top + chart.scales.y.getPixelForValue(annotation.yValue);

                // Distance au point d'ancrage (avec le rayon du marker)
                const distToAnchor = Math.sqrt((mouseX - anchorX)**2 + (mouseY - anchorY)**2);
                const anchorRadius = annotation.markerRadius || 6;

                if (distToAnchor <= magnetZone + anchorRadius) {
                    isNearCursor = true;
                    return;
                }
            }
        }

        // 7. OUTIL DIFF/CANAL - Points d'ancrage
        if (typeof diffCanalIntervals !== 'undefined' && diffCanalIntervals && diffCanalIntervals.length > 0) {
            for (const interval of diffCanalIntervals) {
                if (!interval.visible) continue; // Ignorer si masqué

                // Récupérer l'échelle Y du canal
                const channelConfig = appState.channelConfig[interval.channelIndex];
                if (!channelConfig) continue;

                const yAxisID = channelConfig.yAxisID || 'y';
                const yScale = chart.scales[yAxisID];
                if (!yScale) continue;

                // Positions pixel des deux points d'ancrage
                const x1 = canvasRect.left + chart.scales.x.getPixelForValue(interval.point1.x * 1000);
                const y1 = canvasRect.top + yScale.getPixelForValue(interval.point1.y);
                const x2 = canvasRect.left + chart.scales.x.getPixelForValue(interval.point2.x * 1000);
                const y2 = canvasRect.top + yScale.getPixelForValue(interval.point2.y);

                // Distance aux points (rayon 6px comme dans le dessin)
                const distToPoint1 = Math.sqrt((mouseX - x1)**2 + (mouseY - y1)**2);
                const distToPoint2 = Math.sqrt((mouseX - x2)**2 + (mouseY - y2)**2);
                const anchorRadius = 6;

                if (distToPoint1 <= magnetZone + anchorRadius || distToPoint2 <= magnetZone + anchorRadius) {
                    isNearCursor = true;
                    return;
                }
            }
        }

        // Si on arrive ici, pas proche de quoi que ce soit
        isNearCursor = false;
    }

    // 2. Écouteur de mouvement de souris avec vérification de zone
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Vérifier si une modale est ouverte
        const configModal = document.getElementById('channel-config-modal');
        const isModalOpen = configModal && configModal.style.display !== 'none';

        // Si une modale est ouverte, masquer le halo
        if (isModalOpen) {
            halo.style.opacity = '0';
            isInTimeDomain = false;
            return;
        }

        // Vérifier si la souris est dans le domaine temporel
        const timeCanvas = document.getElementById('timeChart');
        if (timeCanvas) {
            const rect = timeCanvas.getBoundingClientRect();
            isInTimeDomain = mouseX >= rect.left && mouseX <= rect.right &&
                            mouseY >= rect.top && mouseY <= rect.bottom;
        } else {
            isInTimeDomain = false;
        }

        // Vérifier la proximité avec les curseurs
        checkCursorProximity();

        // Mettre à jour la visibilité (géré dans updateHaloStyle)
        // Mettre à jour le style en fonction de l'état
        updateHaloStyle();
    });

    // 3. Écouteurs pour les touches Shift et Ctrl
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') {
            isShiftPressed = true;
            updateHaloStyle();
        } else if (e.key === 'Control') {
            isCtrlPressed = true;
            updateHaloStyle();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            isShiftPressed = false;
            updateHaloStyle();
        } else if (e.key === 'Control') {
            isCtrlPressed = false;
            updateHaloStyle();
        }
    });

    // 4. Gestion de la sortie de la fenêtre
    document.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget && !e.toElement) {
            halo.style.opacity = '0';
        }
    });

    // 5. Effet visuel au clic
    document.addEventListener('mousedown', (e) => {
        if (isInTimeDomain && chartsReady) {
            const cursorPositions = getCursorPositionsInPixels();
            if (cursorPositions.start !== null && cursorPositions.end !== null) {
                const isBetweenCursors = mouseX > cursorPositions.start && mouseX < cursorPositions.end;

                if (isShiftPressed && isBetweenCursors) {
                    halo.classList.add('clicking');
                    halo.style.borderColor = '#f44336';
                    halo.style.boxShadow = '0 0 25px #f44336, inset 0 0 5px #f44336';
                    halo.style.width = `${clickSize}px`;
                    halo.style.height = `${clickSize}px`;
                } else {
                    halo.classList.add('clicking');
                    halo.style.width = `${clickSize}px`;
                    halo.style.height = `${clickSize}px`;
                }
            }
        }
    });

    document.addEventListener('mouseup', () => {
        halo.classList.remove('clicking');
        updateHaloStyle();
    });

    // 6. Fonction pour mettre à jour le style du halo
    function updateHaloStyle() {
        // Vérifier si le halo est désactivé
        if (!haloEnabled) {
            halo.style.opacity = '0';
            return;
        }

        // Vérifier si une modale est ouverte
        const configModal = document.getElementById('channel-config-modal');
        const isModalOpen = configModal && configModal.style.display !== 'none';

        if (!isInTimeDomain || isModalOpen) {
            halo.style.opacity = '0';
            return;
        }

        // Déterminer l'opacité selon le thème
        const theme = document.documentElement.getAttribute('data-theme');
        const baseOpacity = (theme === 'light') ? '0.9' : '1';

        // Appliquer l'opacité de base
        halo.style.opacity = baseOpacity;

        // Vérifier si on est en train de dragger un outil
        const isDraggingTool =
            (typeof measureState !== 'undefined' && measureState && measureState.dragging) ||
            (typeof intervalDragState !== 'undefined' && intervalDragState && intervalDragState.active) ||
            (typeof rulerState !== 'undefined' && rulerState && rulerState.dragging) ||
            (typeof trackState !== 'undefined' && trackState && trackState.dragging) ||
            (typeof diffCanalState !== 'undefined' && diffCanalState && diffCanalState.dragging);

        // Déterminer la couleur en fonction des touches
        let color = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent-blue').trim() || '#2196F3';

        if (isShiftPressed) {
            color = '#4CAF50'; // Vert
        } else if (isCtrlPressed) {
            color = '#FFD700'; // Jaune
        }

        // Déterminer la taille en fonction de l'état
        let size = baseSize;

        if (isNearCursor) {
            size = cursorNearSize;
        } else if (isShiftPressed || isCtrlPressed) {
            size = reducedSize;
        }

        // Si en train de cliquer OU de dragger un outil, rouge et petit
        if (halo.classList.contains('clicking') || isDraggingTool) {
            size = clickSize;
            color = '#f44336'; // Rouge pour le clic/drag
        }

        // Appliquer les styles
        halo.style.borderColor = color;
        halo.style.boxShadow = `0 0 15px ${color}, inset 0 0 10px ${color}`;
        halo.style.width = `${size}px`;
        halo.style.height = `${size}px`;

        // Debug visuel pour la zone magnétique
        if (isNearCursor) {
            halo.style.borderStyle = 'dotted';
        } else {
            // Rétablir le style selon le thème
            const theme = document.body.getAttribute('data-theme');
            if (theme === 'steampunk' || theme === 'steampunk2') {
                halo.style.borderStyle = 'dashed';
            } else {
                halo.style.borderStyle = 'solid';
            }
        }
    }

    // 7. Vérifier périodiquement si les charts sont prêts
    function checkChartsReady() {
        if (!chartsReady && appState && appState.charts && appState.charts.time) {
            chartsReady = true;
            console.log('✅ Halo: Charts détectés, halo activé');
        }
    }

    // 8. Vérifier périodiquement la position (pour les mises à jour d'état)
    function periodicCheck() {
        checkChartsReady();

        if (isInTimeDomain && chartsReady) {
            checkCursorProximity();
            updateHaloStyle();
        }

        requestAnimationFrame(periodicCheck);
    }

    // 9. Boucle d'animation pour le mouvement fluide
    function animateHalo() {
        // Calcul de la position avec interpolation
        haloX += (mouseX - haloX) * delay;
        haloY += (mouseY - haloY) * delay;

        // Application de la position
        halo.style.left = `${haloX}px`;
        halo.style.top = `${haloY}px`;

        requestAnimationFrame(animateHalo);
    }

    // 10. Écouteur pour les changements de graphique (curseurs déplacés)
    function setupCursorChangeListener() {
        if (!chartsReady) return;

        // Surveiller les changements d'état des curseurs
        const originalUpdateStats = window.updateStats;
        if (originalUpdateStats) {
            window.updateStats = function() {
                originalUpdateStats.apply(this, arguments);
                if (isInTimeDomain) {
                    checkCursorProximity();
                    updateHaloStyle();
                }
            };
        }

        // Écouter les mises à jour du graphique temporel
        const timeChart = appState?.charts?.time;
        if (timeChart) {
            const originalUpdate = timeChart.update;
            timeChart.update = function(mode) {
                const result = originalUpdate.apply(this, arguments);
                setTimeout(() => {
                    if (isInTimeDomain) {
                        checkCursorProximity();
                        updateHaloStyle();
                    }
                }, 10);
                return result;
            };
        }
    }

    // 11. Lancer tout
    halo.style.transform = 'translate(-50%, -50%)';
    animateHalo();
    periodicCheck();

    // Attendre que les charts soient prêts avant de setup les listeners
    const waitForCharts = setInterval(() => {
        if (chartsReady) {
            clearInterval(waitForCharts);
            setupCursorChangeListener();
            updateHaloStyle();
            console.log('✅ Halo complètement initialisé');
        }
    }, 100);

    console.log('🔄 Halo en attente des charts...');
});
