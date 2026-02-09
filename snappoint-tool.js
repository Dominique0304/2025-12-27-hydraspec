// =====================================
// OUTIL MARQUEUR (SNAPPOINT) - Version POO
// Points d'annotation avec info dessinées sur canvas
// Alternative aux annotations HTML pour éviter débordement
// =====================================

class SnapPoint {
    constructor(id, channelIndex, xValue, value) {
        this.id = id;
        this.channelIndex = channelIndex; // Index du canal dans channelConfig
        this.xValue = xValue; // Valeur X dans l'unité du canal X (secondes si X=Temps, bar si X=S1, etc.)
        this.value = value; // Valeur Y
        this.comment = 'N$ C$ Y$'; // Commentaire avec balises par défaut (N$ = numéro, C$ = canal, Y$ = valeur)
        this.offsetX = 80; // Offset de la boîte par rapport au point (en pixels)
        this.offsetY = -40;
        this.visible = true;
        this.color = '#4ECDC4'; // Couleur par défaut

        // Formatage du texte
        this.fontSize = window.chartFontSize;
        this.fontWeight = 'normal';
        this.fontStyle = 'normal';
        this.textDecoration = 'none';
        this.textAlign = 'center'; // 'left', 'center', 'right'
        this.textVerticalAlign = 'middle'; // 'top', 'middle', 'bottom'

        // Apparence de la boîte
        // Initialiser avec la couleur du canal
        const channelColor = appState.channelConfig?.[channelIndex]?.color;
        this.backgroundColor = channelColor || '#4ECDC4'; // Couleur de fond (couleur du canal par défaut)
        this.backgroundOpacity = 0.5; // Opacité du fond (0-1) - 50% de transparence
        this.boxPaddingScale = 1.0; // Facteur d'agrandissement de la boîte (1.0 = normal)
        this.boxWidth = null; // Largeur personnalisée de la boîte (null = auto)
        this.boxHeight = null; // Hauteur personnalisée de la boîte (null = auto)

        // Canal d'accrochage
        this.anchorChannelIndex = channelIndex; // Canal auquel le point est accroché (null = pas d'accrochage)

        // Flèche libre (seulement si pas de canal d'accrochage)
        this.hasArrow = false; // Si true, affiche une flèche
        this.arrowEndX = 150; // Position X de la fin de la flèche (offset depuis boxPos en pixels)
        this.arrowEndY = -80; // Position Y de la fin de la flèche (offset depuis boxPos en pixels)
    }

    // Obtenir le label du canal
    getChannelLabel() {
        if (!appState.channelConfig || !appState.channelConfig[this.channelIndex]) {
            return 'Canal';
        }
        return appState.channelConfig[this.channelIndex].label || 'Canal';
    }

    // Obtenir l'unité du canal
    getChannelUnit() {
        if (!appState.channelConfig || !appState.channelConfig[this.channelIndex]) {
            return 'unité';
        }
        const config = appState.channelConfig[this.channelIndex];
        // Extraire l'unité entre parenthèses (ex: "Pression (bar)" -> "bar")
        const match = config.label.match(/\(([^)]+)\)/);
        if (match) {
            return match[1];
        }
        return config.unit || 'unité';
    }

    // Obtenir la position du point en pixels
    getPointPixelPosition(chart) {
        const xScale = chart.scales.x;
        const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's', isTime: true };

        // Déterminer si c'est une annotation flottante (-1 = canal fantôme)
        const isFloating = (this.anchorChannelIndex === -1 || this.anchorChannelIndex === null || this.anchorChannelIndex === undefined);

        let yAxisID, yScale, yValue;

        if (isFloating) {
            // ANNOTATION FLOTTANTE : utiliser le canal fantôme
            yAxisID = 'yPhantom'; // Échelle du canal fantôme
            yScale = chart.scales[yAxisID];
            yValue = this.value; // Valeur fixe (pas de suivi de courbe)

            if (yScale) {
                console.log(`👻 Annotation flottante ID=${this.id} : canal fantôme (yPhantom), valeur fixe=${yValue.toFixed(2)}`);
            } else {
                console.warn(`⚠️ Canal fantôme (yPhantom) introuvable pour l'annotation ID=${this.id}! Vérifier que getOrCreatePhantomChannel() a été appelé.`);
                return null;
            }
        } else {
            // ANNOTATION ACCROCHÉE : utiliser l'échelle du canal d'accrochage
            const targetChannelIndex = this.anchorChannelIndex;
            const channelConfig = appState.channelConfig[targetChannelIndex];

            // Si le canal d'accrochage n'existe plus ou est masqué, ne pas afficher
            if (!channelConfig) {
                console.warn(`⚠️ Canal d'accrochage ${targetChannelIndex} introuvable pour l'annotation ID=${this.id}`);
                return null;
            }

            yAxisID = channelConfig.yAxisID || 'y';
            yScale = chart.scales[yAxisID];

            // Recalculer la valeur Y en temps réel sur la courbe
            const liveValue = getSnapPointValueOnCurve(this.anchorChannelIndex, this.xValue);
            yValue = (liveValue !== null) ? liveValue : this.value;
        }

        if (!yScale) {
            console.warn(`⚠️ Échelle Y '${yAxisID}' introuvable pour l'annotation ID=${this.id}`);
            return null;
        }

        return {
            x: xScale.getPixelForValue(this.xValue * xInfo.scale),
            y: yScale.getPixelForValue(yValue)
        };
    }

    // Obtenir la position de la boîte en pixels
    getBoxPixelPosition(chart) {
        const pointPos = this.getPointPixelPosition(chart);
        if (!pointPos) return null;

        return {
            x: pointPos.x + this.offsetX,
            y: pointPos.y + this.offsetY
        };
    }
}

// =====================================
// CLASSE SNAPPOINT TOOL
// =====================================

class SnapPointTool {
    constructor() {
        // Variables d'état
        this.snapPoints = [];
        this.isCreating = false;
        this.nextId = 1;
        this.editingId = null;
        this.contextMenuId = null;

        // État de l'outil
        this.state = {
            active: false,
            mode: 'create', // 'create' ou 'move'
            dragging: null, // 'point', 'box', 'resize', ou null
            draggedSnapPoint: null,
            dragStartX: 0,
            dragStartY: 0,
            dragOffsetX: 0,
            dragOffsetY: 0,
            resizeDirection: null, // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
            resizeStartWidth: 0,
            resizeStartHeight: 0,
            resizeStartBoxX: 0,
            resizeStartBoxY: 0
        };
    }

    toggleSnapPointTool() {
    const btn = document.getElementById('snappoint-btn');
    const content = document.getElementById('snappoint-content');
    const icon = document.getElementById('snappoint-accordion-icon');

    if (!this.state.active) {
        // ACTIVATION
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('snappoint');
        }

        // Fermer tous les accordéons principaux sauf "tools"
        if (typeof closeAllMainAccordions === 'function') {
            closeAllMainAccordions('tools');
        }

        // Ouvrir l'accordéon principal "Outils" si fermé
        const toolsContent = document.getElementById('tools-content');
        const toolsIcon = document.getElementById('tools-toggle-icon');
        if (toolsContent && toolsContent.style.display === 'none') {
            toolsContent.style.display = 'block';
            if (toolsIcon) {
                toolsIcon.classList.remove('fa-chevron-down');
                toolsIcon.classList.add('fa-chevron-up');
            }
        }

        // Fermer les sous-accordéons dans Outils
        if (typeof closeOtherToolAccordions === 'function') {
            closeOtherToolAccordions('snappoint');
        }

        // Activer l'outil
        this.state.active = true;
        this.isCreating = true;
        if (btn) {
            btn.style.background = 'var(--accent-green)';
        }

        // Afficher le contenu
        if (content) {
            content.style.display = 'block';
        }
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }

        setStatus(t("status.marker_tool_activated"));
    } else {
        // DÉSACTIVATION
        this.state.active = false;
        this.isCreating = false;
        if (btn) {
            btn.style.background = 'var(--accent-blue)';
        }

        // Masquer le contenu
        if (content) {
            content.style.display = 'none';
        }
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }

        setStatus(t("status.marker_tool_deactivated"));
    }
    }

    setSnapPointMode(mode) {
    this.state.mode = mode;

    const createBtn = document.getElementById('snappoint-create-btn');
    const moveBtn = document.getElementById('snappoint-move-btn');
    const modeText = document.getElementById('snappoint-mode-text');

    if (mode === 'create') {
        // Mode Création activé
        if (createBtn) {
            createBtn.style.background = 'var(--accent-green)';
            createBtn.style.color = 'white';
            createBtn.style.border = 'none';
        }
        if (moveBtn) {
            moveBtn.style.background = 'var(--bg-secondary)';
            moveBtn.style.color = 'var(--text-main)';
            moveBtn.style.border = '1px solid var(--border-color)';
        }
        if (modeText) {
            modeText.textContent = t('labels.click_create_marker');
        }
        setStatus("Mode Création : Cliquez sur le graphique pour créer un marqueur");
    } else if (mode === 'move') {
        // Mode Déplacement activé
        if (createBtn) {
            createBtn.style.background = 'var(--bg-secondary)';
            createBtn.style.color = 'var(--text-main)';
            createBtn.style.border = '1px solid var(--border-color)';
        }
        if (moveBtn) {
            moveBtn.style.background = 'var(--accent-green)';
            moveBtn.style.color = 'white';
            moveBtn.style.border = 'none';
        }
        if (modeText) {
            modeText.textContent = t('labels.click_move_resize_marker');
        }
        setStatus("Mode Déplacement : Cliquez sur un marqueur pour le déplacer");
    }
    }

    handleSnapPointClick(event, chart) {
    // Ne créer que si l'outil est actif ET en mode création
    if (!this.state.active || !this.isCreating || this.state.mode !== 'create') {
        return false;
    }

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convertir en valeur X (canal X)
    const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's', isTime: true };
    const xScale = chart.scales.x;
    const xValueScaled = xScale.getValueForPixel(x);
    const xValue = xValueScaled / xInfo.scale;

    // Trouver le canal le plus proche du clic
    let closestChannel = null;
    let minDistance = Infinity;

    if (appState.channelConfig && appState.channelConfig.length > 0) {
        appState.channelConfig.forEach((config, index) => {
            if (!config.visible) return;

            const yAxisID = config.yAxisID || 'y';
            const yScale = chart.scales[yAxisID];
            if (!yScale) return;

            // Interpoler la valeur sur ce canal
            const value = this.interpolateChannelValue(index, xValue);
            if (value === null) return;

            // Calculer la distance au clic
            const yPixel = yScale.getPixelForValue(value);
            const distance = Math.abs(y - yPixel);

            if (distance < minDistance) {
                minDistance = distance;
                closestChannel = { index, value };
            }
        });
    }

    if (!closestChannel) {
        setStatus("Aucun canal trouvé à cette position");
        return false;
    }

    // Créer le marqueur
    const snapPoint = new SnapPoint(
        this.nextId++,
        closestChannel.index,
        xValue,
        closestChannel.value
    );
    this.snapPoints.push(snapPoint);

    // Mettre à jour l'affichage
    this.updateSnapPointsList();
    chart.update('none');

    setStatus(`Marqueur créé sur ${snapPoint.getChannelLabel()}`);

    return true;
    }

    interpolateChannelValue(channelIndex, xValue) {
    if (!appState.channelConfig || !appState.channelConfig[channelIndex]) {
        return null;
    }

    const config = appState.channelConfig[channelIndex];
    const targetLabel = config.label || config.name;
    const dataset = appState.charts.time.data.datasets.find(ds => ds.label === targetLabel);

    if (!dataset) {
        return null;
    }

    const chart = appState.charts.time;
    const labels = chart.data.labels;
    const yData = dataset.data;

    const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's', isTime: true };
    const xValueScaled = xValue * xInfo.scale;

    let leftIdx = -1;
    let rightIdx = -1;

    for (let i = 0; i < labels.length; i++) {
        const labelX = parseFloat(labels[i]);

        if (labelX <= xValueScaled) {
            leftIdx = i;
        }
        if (labelX >= xValueScaled && rightIdx === -1) {
            rightIdx = i;
            break;
        }
    }

    let result;

    if (leftIdx >= 0 && rightIdx >= 0 && leftIdx < yData.length && rightIdx < yData.length) {
        const x1 = parseFloat(labels[leftIdx]);
        const x2 = parseFloat(labels[rightIdx]);
        const y1 = yData[leftIdx];
        const y2 = yData[rightIdx];

        if (x1 === x2) {
            result = y1;
        } else {
            const ratio = (xValueScaled - x1) / (x2 - x1);
            result = y1 + ratio * (y2 - y1);
        }
    } else if (leftIdx === -1 && rightIdx >= 0 && rightIdx < yData.length) {
        result = yData[rightIdx];
    } else if (leftIdx >= 0 && leftIdx < yData.length && rightIdx === -1) {
        result = yData[leftIdx];
    } else {
        return null;
    }

    return result;
    }

    getSnapPointValueOnCurve(channelIndex, xValue) {
    const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, data: appState.fullDataTime };
    const xValueScaled = xValue * xInfo.scale;
    const dataX = xInfo.data;

    // Obtenir les données du bon canal
    let dataValues;
    if (appState.allColumnData && appState.allColumnData[channelIndex + 1]) {
        // +1 car allColumnData[0] est le temps
        dataValues = appState.allColumnData[channelIndex + 1];
    } else {
        // Fallback - essayer de trouver dans les datasets
        return null;
    }

    if (!dataX || !dataValues || dataX.length === 0) {
        return null;
    }

    // Trouver l'index du point le plus proche
    let closestIndex = 0;
    let minDiff = Math.abs(dataX[0] - xValueScaled);

    for (let i = 1; i < dataX.length; i++) {
        const diff = Math.abs(dataX[i] - xValueScaled);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
        if (dataX[i] > xValueScaled) break; // Optimisation
    }

    return dataValues[closestIndex];
    }

    hexToRgba(hex, opacity) {
    // Retirer le # si présent
    hex = hex.replace('#', '');

    // Gérer les formats court (3 caractères) et long (6 caractères)
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        // Le segment est en fait un point
        return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }

    // Calculer t, le paramètre de projection sur le segment [0, 1]
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    // Point le plus proche sur le segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    // Distance du point au point le plus proche
    return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
    }

    replaceSnapPointTags(comment, snapPoint, snapPointIndex = null) {
    if (!comment || comment.trim() === '') {
        return comment;
    }

    let result = comment;

    // Calculer le numéro du marqueur (index + 1, ou trouver l'index si non fourni)
    let markerNumber = snapPointIndex !== null ? (snapPointIndex + 1) : null;
    if (markerNumber === null) {
        // Si l'index n'est pas fourni, le chercher dans le tableau
        const foundIndex = this.snapPoints.findIndex(sp => sp.id === snapPoint.id);
        markerNumber = foundIndex !== -1 ? (foundIndex + 1) : snapPoint.id;
    }

    // Remplacer N$ par le numéro du marqueur (TOUJOURS, même sans canal d'accrochage)
    result = result.replace(/N\$/g, `(N°: ${markerNumber})`);  // N$ → "(N°: 1)", "(N°: 2)", "(N°: 3)"...

    // Si un canal d'accrochage est défini, utiliser ses informations
    const hasAnchor = snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined;

    if (hasAnchor) {
        const channelLabel = snapPoint.getChannelLabel();
        const unit = snapPoint.getChannelUnit();

        // Obtenir l'unité du canal X
        const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { unit: 's', isTime: true };
        const xText = `${snapPoint.xValue.toFixed(3)} ${xInfo.unit}`;
        const valueText = `${snapPoint.value.toFixed(1)} ${unit}`;

        // Remplacer les balises
        result = result.replace(/C\$/g, channelLabel);        // C$ → "S1; IA (mA)"
        result = result.replace(/X\$/g, xText);               // X$ → "7,444 s" ou "12,500 bar"
        result = result.replace(/Y\$/g, valueText);           // Y$ → "664,0 mA"
        result = result.replace(/U\$/g, unit);                // U$ → "mA"
    } else {
        // Si pas de canal d'accrochage, remplacer par des chaînes vides
        result = result.replace(/C\$/g, '');
        result = result.replace(/X\$/g, '');
        result = result.replace(/Y\$/g, '');
        result = result.replace(/U\$/g, '');

        // Nettoyer les doubles espaces et points-virgules orphelins
        result = result.replace(/;\s*;/g, ';');       // ;; → ;
        result = result.replace(/^\s*;\s*/g, '');     // ; au début → vide
        result = result.replace(/\s*;\s*$/g, '');     // ; à la fin → vide
        result = result.replace(/\s+/g, ' ');         // Multiples espaces → un seul
        result = result.trim();
    }

    return result;
    }

    drawSnapPoints(chart) {
    if (!chart || !chart.ctx) {
        return;
    }

    const ctx = chart.ctx;
    ctx.save();

    // Clip to chart area to prevent overlap with axes
    const chartArea = chart.chartArea;
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.clip();

    this.snapPoints.forEach((snapPoint, index) => {
        if (!snapPoint.visible) return;

        // Déterminer si le marqueur est flottant (-1 = canal fantôme)
        const isFloating = (snapPoint.anchorChannelIndex === -1 || snapPoint.anchorChannelIndex === null || snapPoint.anchorChannelIndex === undefined);

        // Si le marqueur est accroché à un canal (pas flottant), vérifier que le canal d'accrochage existe et est visible
        if (!isFloating) {
            const anchorConfig = appState.channelConfig[snapPoint.anchorChannelIndex];
            if (!anchorConfig || !anchorConfig.visible) {
                console.log(`🔍 Annotation ID=${snapPoint.id} masquée car canal d'accrochage ${snapPoint.anchorChannelIndex} est masqué/inexistant`);
                return; // Canal d'accrochage masqué ou inexistant, ne pas dessiner le marqueur
            }
        } else {
            console.log(`🎈 Annotation flottante ID=${snapPoint.id} affichée (indépendante des canaux)`);
        }

        const pointPos = snapPoint.getPointPixelPosition(chart);
        if (!pointPos) return;

        const boxPos = snapPoint.getBoxPixelPosition(chart);
        if (!boxPos) return;

        // Obtenir la couleur : pour annotation flottante, utiliser sa propre couleur
        // Pour annotation accrochée, utiliser la couleur du canal d'accrochage
        let color;
        if (isFloating) {
            // Annotation flottante : utiliser sa couleur définie
            color = snapPoint.backgroundColor || snapPoint.color || '#4ECDC4';
        } else {
            // Annotation accrochée : utiliser la couleur du canal d'accrochage
            const anchorConfig = appState.channelConfig[snapPoint.anchorChannelIndex];
            color = anchorConfig?.color || snapPoint.backgroundColor || snapPoint.color || '#4ECDC4';
        }

        // Dessiner le point d'accroche et la ligne SEULEMENT si un canal d'accrochage est défini (pas -1)
        if (snapPoint.anchorChannelIndex !== -1 && snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined) {
            // Obtenir la couleur du canal d'accrochage
            const anchorConfig = appState.channelConfig[snapPoint.anchorChannelIndex];
            const anchorColor = anchorConfig?.color || color;

            // Obtenir l'opacité
            const backgroundOpacity = snapPoint.backgroundOpacity !== undefined ? snapPoint.backgroundOpacity : 0.5;

            // Dessiner le point d'accroche à 100% d'opacité pour une meilleure visibilité
            ctx.fillStyle = this.hexToRgba(anchorColor, 1.0);
            ctx.beginPath();
            ctx.arc(pointPos.x, pointPos.y, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = this.hexToRgba('#FFF', 1.0);
            ctx.lineWidth = 2;
            ctx.stroke();

            // Calculer les dimensions de la boîte (on en aura besoin plus tard)
            ctx.save();
            ctx.font = `${snapPoint.fontWeight} ${snapPoint.fontSize}px sans-serif`;
            const lines = [];
            if (snapPoint.comment && snapPoint.comment.trim() !== '') {
                const processedComment = this.replaceSnapPointTags(snapPoint.comment, snapPoint, index);
                if (processedComment && processedComment.trim() !== '') {
                    const commentLines = processedComment.split(/\n|;/).map(line => line.trim()).filter(line => line.length > 0);
                    lines.push(...commentLines);
                }
            }

            if (lines.length > 0) {
                const basePadding = 6; // Réduit de 10 à 6 pour moins de marge verticale
                const padding = basePadding * (snapPoint.boxPaddingScale || 1.0);
                const lineHeight = snapPoint.fontSize + 4;
                let maxWidth = 0;
                lines.forEach(line => {
                    const width = ctx.measureText(line).width;
                    if (width > maxWidth) maxWidth = width;
                });
                const autoBoxWidth = maxWidth + padding * 2;
                const autoBoxHeight = lines.length * lineHeight + padding * 2;
                const boxWidth = snapPoint.boxWidth || autoBoxWidth;
                const boxHeight = snapPoint.boxHeight || autoBoxHeight;

                // Calculer le point de départ du pointillé au bord de la boîte
                const boxLeft = boxPos.x - boxWidth / 2;
                const boxRight = boxPos.x + boxWidth / 2;
                const boxTop = boxPos.y;
                const boxBottom = boxPos.y + boxHeight;
                const boxCenterX = boxPos.x;
                const boxCenterY = boxPos.y + boxHeight / 2;

                // Calculer l'intersection entre la ligne (point -> centre boîte) et le bord de la boîte
                const dx = pointPos.x - boxCenterX;
                const dy = pointPos.y - boxCenterY;

                let lineStartX = boxCenterX;
                let lineStartY = boxCenterY;

                // Déterminer quel bord intersecte
                if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
                    const angle = Math.atan2(dy, dx);
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);

                    // Tester l'intersection avec chaque bord
                    if (cos > 0) { // Vers la droite
                        const t = (boxRight - boxCenterX) / dx;
                        const y = boxCenterY + t * dy;
                        if (y >= boxTop && y <= boxBottom) {
                            lineStartX = boxRight;
                            lineStartY = y;
                        }
                    } else if (cos < 0) { // Vers la gauche
                        const t = (boxLeft - boxCenterX) / dx;
                        const y = boxCenterY + t * dy;
                        if (y >= boxTop && y <= boxBottom) {
                            lineStartX = boxLeft;
                            lineStartY = y;
                        }
                    }

                    if (sin < 0) { // Vers le haut
                        const t = (boxTop - boxCenterY) / dy;
                        const x = boxCenterX + t * dx;
                        if (x >= boxLeft && x <= boxRight) {
                            lineStartX = x;
                            lineStartY = boxTop;
                        }
                    } else if (sin > 0) { // Vers le bas
                        const t = (boxBottom - boxCenterY) / dy;
                        const x = boxCenterX + t * dx;
                        if (x >= boxLeft && x <= boxRight) {
                            lineStartX = x;
                            lineStartY = boxBottom;
                        }
                    }
                }

                // Dessiner la ligne pointillée de connexion avec la couleur du canal d'accrochage à 100% d'opacité
                ctx.strokeStyle = this.hexToRgba(anchorColor, 1.0);
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 3]);
                ctx.beginPath();
                ctx.moveTo(pointPos.x, pointPos.y);
                ctx.lineTo(lineStartX, lineStartY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            ctx.restore();
        }

        // Préparer le texte avec le template du commentaire
        const lines = [];

        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            const processedComment = this.replaceSnapPointTags(snapPoint.comment, snapPoint, index);
            if (processedComment && processedComment.trim() !== '') {
                // Séparer le commentaire en lignes (par retour à la ligne ou par ';')
                const commentLines = processedComment.split(/\n|;/).map(line => line.trim()).filter(line => line.length > 0);
                lines.push(...commentLines);
            }
        }

        // Calculer les dimensions de la boîte
        ctx.font = `${snapPoint.fontWeight} ${snapPoint.fontSize}px sans-serif`;
        const basePadding = 10;
        const padding = basePadding * (snapPoint.boxPaddingScale || 1.0);
        const lineHeight = snapPoint.fontSize + 4;

        let maxWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });

        // Utiliser les dimensions personnalisées si définies, sinon calculer automatiquement
        const autoBoxWidth = maxWidth + padding * 2;
        const autoBoxHeight = lines.length * lineHeight + padding * 2;
        const boxWidth = snapPoint.boxWidth || autoBoxWidth;
        const boxHeight = snapPoint.boxHeight || autoBoxHeight;

        // Dessiner la boîte avec coins arrondis
        const radius = 6;
        const backgroundColor = snapPoint.backgroundColor || color; // Utiliser la couleur du canal
        const backgroundOpacity = snapPoint.backgroundOpacity !== undefined ? snapPoint.backgroundOpacity : 0.5; // 50% de transparence par défaut

        // Convertir la couleur en rgba avec l'opacité
        const bgColor = this.hexToRgba(backgroundColor, backgroundOpacity);
        this.drawRoundedRect(ctx, boxPos.x - boxWidth / 2, boxPos.y, boxWidth, boxHeight, radius, bgColor, '#000');

        // Dessiner le texte
        ctx.fillStyle = '#000';

        // Configurer l'alignement horizontal
        const textAlign = snapPoint.textAlign || 'center';
        ctx.textAlign = textAlign;

        // Calculer la position X selon l'alignement
        const boxX = boxPos.x - boxWidth / 2;
        let textX;
        if (textAlign === 'left') {
            textX = boxX + padding;
        } else if (textAlign === 'right') {
            textX = boxX + boxWidth - padding;
        } else { // center
            textX = boxPos.x;
        }

        // Calculer la position Y de départ selon l'alignement vertical
        const verticalAlign = snapPoint.textVerticalAlign || 'middle';
        const totalTextHeight = lines.length * lineHeight;
        let startY;
        if (verticalAlign === 'top') {
            startY = boxPos.y + padding;
        } else if (verticalAlign === 'bottom') {
            startY = boxPos.y + boxHeight - totalTextHeight - padding;
        } else { // middle
            startY = boxPos.y + (boxHeight - totalTextHeight) / 2;
        }

        ctx.textBaseline = 'top';

        let currentY = startY;
        lines.forEach((line, index) => {
            // Première ligne en gras, autres lignes selon formatage utilisateur
            const weight = index === 0 ? 'bold' : (snapPoint.fontWeight || 'normal');
            const style = snapPoint.fontStyle || 'normal';
            ctx.font = `${style} ${weight} ${snapPoint.fontSize}px sans-serif`;

            ctx.fillText(line, textX, currentY);

            // Appliquer le soulignement si nécessaire (sauf première ligne)
            if (snapPoint.textDecoration === 'underline' && index > 0) {
                const metrics = ctx.measureText(line);
                const underlineY = currentY + snapPoint.fontSize + 1;
                ctx.beginPath();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                if (textAlign === 'left') {
                    ctx.moveTo(textX, underlineY);
                    ctx.lineTo(textX + metrics.width, underlineY);
                } else if (textAlign === 'right') {
                    ctx.moveTo(textX - metrics.width, underlineY);
                    ctx.lineTo(textX, underlineY);
                } else { // center
                    ctx.moveTo(textX - metrics.width / 2, underlineY);
                    ctx.lineTo(textX + metrics.width / 2, underlineY);
                }
                ctx.stroke();
            }

            currentY += lineHeight;
        });

        // Dessiner la flèche libre si activée (seulement si pas de canal d'accrochage)
        if (snapPoint.hasArrow && (snapPoint.anchorChannelIndex === null || snapPoint.anchorChannelIndex === undefined)) {
            const arrowColor = snapPoint.backgroundColor || color;
            const backgroundOpacity = snapPoint.backgroundOpacity !== undefined ? snapPoint.backgroundOpacity : 0.5;

            // Point d'arrivée : position définie par arrowEndX/Y (offsets)
            const arrowEndX = boxPos.x + snapPoint.arrowEndX;
            const arrowEndY = boxPos.y + snapPoint.arrowEndY;

            // Calculer le point de départ de la flèche au bord de la boîte (même logique que le pointillé)
            const boxLeft = boxPos.x - boxWidth / 2;
            const boxRight = boxPos.x + boxWidth / 2;
            const boxTop = boxPos.y;
            const boxBottom = boxPos.y + boxHeight;
            const boxCenterX = boxPos.x;
            const boxCenterY = boxPos.y + boxHeight / 2;

            // Calculer l'intersection entre la ligne (arrowEnd -> centre boîte) et le bord de la boîte
            const dx = arrowEndX - boxCenterX;
            const dy = arrowEndY - boxCenterY;

            let lineStartX = boxCenterX;
            let lineStartY = boxCenterY;

            // Déterminer quel bord intersecte
            if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
                const angle = Math.atan2(dy, dx);
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                // Tester l'intersection avec chaque bord
                if (cos > 0) { // Vers la droite
                    const t = (boxRight - boxCenterX) / dx;
                    const y = boxCenterY + t * dy;
                    if (y >= boxTop && y <= boxBottom) {
                        lineStartX = boxRight;
                        lineStartY = y;
                    }
                } else if (cos < 0) { // Vers la gauche
                    const t = (boxLeft - boxCenterX) / dx;
                    const y = boxCenterY + t * dy;
                    if (y >= boxTop && y <= boxBottom) {
                        lineStartX = boxLeft;
                        lineStartY = y;
                    }
                }

                if (sin < 0) { // Vers le haut
                    const t = (boxTop - boxCenterY) / dy;
                    const x = boxCenterX + t * dx;
                    if (x >= boxLeft && x <= boxRight) {
                        lineStartX = x;
                        lineStartY = boxTop;
                    }
                } else if (sin > 0) { // Vers le bas
                    const t = (boxBottom - boxCenterY) / dy;
                    const x = boxCenterX + t * dx;
                    if (x >= boxLeft && x <= boxRight) {
                        lineStartX = x;
                        lineStartY = boxBottom;
                    }
                }
            }

            // Dessiner la ligne de la flèche depuis le bord de la boîte avec transparence
            ctx.strokeStyle = this.hexToRgba(arrowColor, backgroundOpacity);
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineStartY);
            ctx.lineTo(arrowEndX, arrowEndY);
            ctx.stroke();

            // Dessiner la pointe de la flèche avec transparence
            const arrowAngle = Math.atan2(arrowEndY - lineStartY, arrowEndX - lineStartX);
            const arrowSize = 12;

            ctx.fillStyle = this.hexToRgba(arrowColor, backgroundOpacity);
            ctx.beginPath();
            ctx.moveTo(arrowEndX, arrowEndY);
            ctx.lineTo(
                arrowEndX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
                arrowEndY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
            );
            ctx.lineTo(
                arrowEndX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
                arrowEndY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();

            // Note: le cercle draggable n'est plus visible, mais la zone reste cliquable pour le drag
        }
    });

    ctx.restore();
    }

    drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    }

    checkSnapPointsIntegrity() {
    let hasErrors = false;

    // Vérifier les IDs null/undefined
    const invalidIds = this.snapPoints.filter(sp => sp.id === null || sp.id === undefined);
    if (invalidIds.length > 0) {
        console.error(`❌ ${invalidIds.length} marqueur(s) avec ID null/undefined détecté(s)!`);
        console.table(invalidIds.map((sp, idx) => ({
            index: this.snapPoints.indexOf(sp),
            id: sp.id,
            xValue: sp.xValue?.toFixed(3) || 'N/A',
            value: sp.value?.toFixed(1) || 'N/A'
        })));
        hasErrors = true;
    }

    // Vérifier les doublons d'IDs
    const ids = this.snapPoints.map(sp => sp.id);
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
        console.error('❌ DOUBLONS D\'IDS DÉTECTÉS!');
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        console.error('IDs dupliqués:', duplicates);
        console.table(this.snapPoints.map(sp => ({
            id: sp.id,
            xValue: sp.xValue.toFixed(3),
            value: sp.value.toFixed(1),
            comment: sp.comment
        })));
        hasErrors = true;
    }

    if (!hasErrors) {
        console.log(`✅ Intégrité des ${this.snapPoints.length} marqueurs vérifiée: OK`);
    }

    return !hasErrors;
    }

    updateSnapPointsList() {
    // Vérifier l'intégrité des IDs
    this.checkSnapPointsIntegrity();
    const listContainer = document.getElementById('snappoints-list');
    if (!listContainer) return;

    if (this.snapPoints.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.8rem; font-style:italic;">
                Aucun marqueur
            </div>
        `;
        return;
    }

    let html = '';
    this.snapPoints.forEach((snapPoint, index) => {
        // Vérification de sécurité : s'assurer que l'ID est valide
        if (snapPoint.id === null || snapPoint.id === undefined) {
            console.error(`❌ Marqueur à l'index ${index} a un ID invalide:`, snapPoint.id);
            return; // Skip ce marqueur
        }

        const channelLabel = snapPoint.getChannelLabel();
        const unit = snapPoint.getChannelUnit();
        const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { unit: 's', isTime: true };
        const xValueInfo = `${snapPoint.xValue.toFixed(3)} ${xInfo.unit}`;
        const valueInfo = `${snapPoint.value.toFixed(1)} ${unit}`;
        // Traiter le commentaire avec les balises
        const commentInfo = snapPoint.comment ? this.replaceSnapPointTags(snapPoint.comment, snapPoint, index) : '';

        const isVisible = snapPoint.visible !== false;
        const eyeIcon = isVisible ? 'fa-eye' : 'fa-eye-slash';
        const eyeColor = isVisible ? 'var(--accent-green)' : 'var(--text-muted)';

        // Déterminer la couleur selon si l'annotation est flottante ou accrochée (-1 = canal fantôme)
        const isFloating = (snapPoint.anchorChannelIndex === -1 || snapPoint.anchorChannelIndex === null || snapPoint.anchorChannelIndex === undefined);
        let color;
        if (isFloating) {
            // Annotation flottante : utiliser sa couleur
            color = snapPoint.backgroundColor || snapPoint.color || '#4ECDC4';
        } else {
            // Annotation accrochée : utiliser la couleur du canal d'accrochage
            const anchorConfig = appState.channelConfig[snapPoint.anchorChannelIndex];
            color = anchorConfig?.color || snapPoint.backgroundColor || snapPoint.color || '#4ECDC4';
        }

        html += `
            <div style="padding:8px; margin-bottom:6px; background:var(--bg-secondary); border-radius:4px; border-left:3px solid ${color}; font-size:0.75rem;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                    <span style="color:${color}; font-weight:bold;"><i class="fas fa-map-marker-alt"></i> Marqueur ${index + 1}</span>
                    <span style="flex:1;"></span>
                    <button onclick="this.this.toggleSnapPointVisibility(${snapPoint.id})"
                            style="padding:4px 6px; background:none; border:none; color:${eyeColor}; cursor:pointer; font-size:0.9rem;"
                            title="${isVisible ? 'Masquer' : 'Afficher'}">
                        <i class="fas ${eyeIcon}"></i>
                    </button>
                    <button onclick="this.editSnapPoint(${snapPoint.id})"
                            style="padding:4px 6px; background:none; border:none; color:var(--accent-blue); cursor:pointer; font-size:0.9rem;"
                            title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="this.this.deleteSnapPoint(${snapPoint.id})"
                            style="padding:4px 6px; background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:0.9rem;"
                            title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div style="color:var(--text-main); margin-bottom:2px;">${channelLabel}</div>
                <div style="color:var(--text-main); margin-bottom:2px;">${xValueInfo} | ${valueInfo}</div>
                ${commentInfo ? `<div style="color:var(--text-muted); font-style:italic;">${commentInfo}</div>` : ''}
            </div>
        `;
    });

    listContainer.innerHTML = html;
    }

    toggleSnapPointVisibility(id) {
    const snapPoint = this.snapPoints.find(sp => sp.id === id);
    if (snapPoint) {
        snapPoint.visible = !snapPoint.visible;
        this.updateSnapPointsList();
        appState.charts.time.update('none');
    }
    }

    openSnapPointEditModal(id) {
    // IMPORTANT: Réinitialiser l'ID d'édition d'abord pour éviter tout conflit
    this.editingId = null;

    // Vérifier que l'ID est valide
    if (id === null || id === undefined) {
        console.error(`❌ ID de marqueur invalide: ${id}`);
        return;
    }

    const snapPoint = this.snapPoints.find(sp => sp.id === id);
    if (!snapPoint) {
        console.error(`❌ Marqueur avec id ${id} introuvable dans la liste de ${this.snapPoints.length} marqueurs`);
        console.log('IDs disponibles:', this.snapPoints.map(sp => sp.id));
        return;
    }

    console.log(`✏️ Ouverture de l'édition pour le marqueur ID=${id}`);

    // Récupérer les éléments de la modale
    const modal = document.getElementById('snappoint-edit-modal');
    const commentInput = document.getElementById('snappoint-comment-input');
    const infoChannel = document.getElementById('snappoint-info-channel');
    const infoTime = document.getElementById('snappoint-info-time');
    const infoValue = document.getElementById('snappoint-info-value');
    const sizeSelect = document.getElementById('snap-fmt-size');

    if (!modal) return;

    // Stocker l'ID en édition APRÈS toutes les vérifications
    this.editingId = id;

    // Stocker aussi dans le DOM pour debug
    modal.setAttribute('data-editing-id', id);

    // Remplir les champs
    if (commentInput) commentInput.value = snapPoint.comment || '';
    if (infoChannel) infoChannel.textContent = snapPoint.getChannelLabel();
    const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { unit: 's', isTime: true };
    if (infoTime) infoTime.textContent = `${snapPoint.xValue.toFixed(3)} ${xInfo.unit}`;
    if (infoValue) infoValue.textContent = `${snapPoint.value.toFixed(1)} ${snapPoint.getChannelUnit()}`;

    // Régler la taille de police
    if (sizeSelect) {
        sizeSelect.value = snapPoint.fontSize.toString();
    }

    // Régler la couleur de fond
    const bgColorPicker = document.getElementById('snap-bg-color');
    if (bgColorPicker) {
        // Utiliser la couleur du marqueur, ou celle du canal si non définie
        const channelColor = appState.channelConfig?.[snapPoint.channelIndex]?.color;
        bgColorPicker.value = snapPoint.backgroundColor || channelColor || '#4ECDC4';
    }

    // Régler l'opacité
    const opacitySlider = document.getElementById('snap-opacity');
    const opacityValue = document.getElementById('snap-opacity-value');
    const opacity = (snapPoint.backgroundOpacity !== undefined ? snapPoint.backgroundOpacity : 0.5) * 100;
    if (opacitySlider) opacitySlider.value = opacity;
    if (opacityValue) opacityValue.textContent = `${Math.round(opacity)}%`;

    // Peupler et régler le canal d'accrochage
    const anchorChannelSelect = document.getElementById('snap-anchor-channel');
    if (anchorChannelSelect && appState.channelConfig) {
        // Vider et repeupler le sélecteur
        anchorChannelSelect.innerHTML = '<option value="-1">Aucun (boîte flottante)</option>';

        // Ajouter tous les canaux disponibles (SAUF le canal fantôme)
        appState.channelConfig.forEach((config, index) => {
            // Ignorer le canal fantôme
            if (config.isPhantom) return;

            const option = document.createElement('option');
            option.value = index;
            option.textContent = config.label || `Canal ${index + 1}`;
            anchorChannelSelect.appendChild(option);
        });

        // Sélectionner le canal actuel
        const currentAnchor = snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined
                              ? snapPoint.anchorChannelIndex
                              : -1;
        anchorChannelSelect.value = currentAnchor;
    }

    // Mettre à jour les boutons de formatage
    this.updateSnapPointFormatButtons();

    // Mettre à jour les boutons d'alignement
    this.updateSnapPointAlignmentButtons();

    // Mettre à jour l'état du bouton flèche
    this.updateArrowButtonState();

    // Afficher la modale (alignement en haut pour éviter l'espace vide en bas)
    modal.style.display = 'flex';
    modal.style.alignItems = 'flex-start';
    modal.style.paddingTop = '20px';

    // Initialiser le drag de la modale
    this.makeSnapPointModalDraggable();
    }

    closeSnapPointEditModal() {
    const modal = document.getElementById('snappoint-edit-modal');
    if (modal) {
        console.log(`🔒 Fermeture de l'édition du marqueur ID=${this.editingId}`);
        modal.style.display = 'none';
        modal.removeAttribute('data-editing-id');
    }
    this.editingId = null;
    console.log('✅ this.editingId réinitialisé à null');
    }

    confirmSnapPointEdit() {
    if (this.editingId === null || this.editingId === undefined) {
        console.error('❌ Aucun marqueur en édition (this.editingId est null/undefined)');
        return;
    }

    console.log(`💾 Confirmation de l'édition pour le marqueur ID=${this.editingId}`);

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) {
        console.error(`❌ Marqueur avec id ${this.editingId} introuvable dans ${this.snapPoints.length} marqueurs`);
        console.log('IDs disponibles:', this.snapPoints.map(sp => sp.id));
        return;
    }

    // Vérification de sécurité: comparer avec l'attribut du modal
    const modal = document.getElementById('snappoint-edit-modal');
    const modalEditingId = modal ? parseInt(modal.getAttribute('data-editing-id')) : null;
    if (modalEditingId !== null && modalEditingId !== this.editingId) {
        console.warn(`⚠️ Incohérence détectée! Modal ID=${modalEditingId}, this.editingId=${this.editingId}`);
    }

    console.log(`✅ Modification du marqueur ID=${snapPoint.id} (index ${this.snapPoints.indexOf(snapPoint)})`);

    // Récupérer les valeurs
    const commentInput = document.getElementById('snappoint-comment-input');
    if (commentInput) {
        const oldComment = snapPoint.comment;
        snapPoint.comment = commentInput.value;
        console.log(`  Commentaire: "${oldComment}" → "${snapPoint.comment}"`);
    }

    // Fermer la modale
    this.closeSnapPointEditModal();

    // Mettre à jour l'affichage
    this.updateSnapPointsList();
    appState.charts.time.update('none');

    // Sauvegarder
    saveSnapPoints();

    setStatus(`Marqueur ${snapPoint.id} modifié`);
    }

    toggleSnapPointFormat(format) {
    if (this.editingId === null) {
        console.warn(`⚠️ this.toggleSnapPointFormat(${format}): this.editingId est null`);
        return;
    }

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) {
        console.error(`❌ this.toggleSnapPointFormat(${format}): Marqueur ID=${this.editingId} introuvable`);
        return;
    }

    console.log(`🎨 Format ${format} basculé pour le marqueur ID=${this.editingId}`);

    if (format === 'bold') {
        snapPoint.fontWeight = snapPoint.fontWeight === 'bold' ? 'normal' : 'bold';
    } else if (format === 'italic') {
        snapPoint.fontStyle = snapPoint.fontStyle === 'italic' ? 'normal' : 'italic';
    } else if (format === 'underline') {
        snapPoint.textDecoration = snapPoint.textDecoration === 'underline' ? 'none' : 'underline';
    }

    this.updateSnapPointFormatButtons();

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
    }

    setSnapPointFontSize(size) {
    if (this.editingId === null) {
        console.warn(`⚠️ this.setSnapPointFontSize(${size}): this.editingId est null`);
        return;
    }

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) {
        console.error(`❌ this.setSnapPointFontSize(${size}): Marqueur ID=${this.editingId} introuvable`);
        return;
    }

    console.log(`📏 Taille de police changée pour le marqueur ID=${this.editingId}: ${snapPoint.fontSize} → ${size}`);
    snapPoint.fontSize = parseInt(size);
    }

    setSnapPointBackgroundColor(color) {
    if (this.editingId === null) {
        console.warn(`⚠️ this.setSnapPointBackgroundColor(${color}): this.editingId est null`);
        return;
    }

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) {
        console.error(`❌ this.setSnapPointBackgroundColor(${color}): Marqueur ID=${this.editingId} introuvable`);
        return;
    }

    console.log(`🎨 Couleur de fond changée pour le marqueur ID=${this.editingId}: ${snapPoint.backgroundColor} → ${color}`);

    if (color === 'transparent') {
        snapPoint.backgroundOpacity = 0;
        const opacitySlider = document.getElementById('snap-opacity');
        const opacityValue = document.getElementById('snap-opacity-value');
        if (opacitySlider) opacitySlider.value = 0;
        if (opacityValue) opacityValue.textContent = '0%';
    } else {
        snapPoint.backgroundColor = color;
    }

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
    }

    setSnapPointOpacity(value) {
    if (this.editingId === null) {
        console.warn(`⚠️ this.setSnapPointOpacity(${value}): this.editingId est null`);
        return;
    }

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) {
        console.error(`❌ this.setSnapPointOpacity(${value}): Marqueur ID=${this.editingId} introuvable`);
        return;
    }

    const opacity = parseInt(value) / 100;
    console.log(`🌫️ Opacité changée pour le marqueur ID=${this.editingId}: ${snapPoint.backgroundOpacity} → ${opacity}`);
    snapPoint.backgroundOpacity = opacity;

    // Mettre à jour l'affichage de la valeur
    const opacityValue = document.getElementById('snap-opacity-value');
    if (opacityValue) {
        opacityValue.textContent = `${value}%`;
    }

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
    }

    setSnapPointPadding(value) {
    if (this.editingId === null) return;

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) return;

    const scale = parseInt(value) / 100;
    snapPoint.boxPaddingScale = scale;

    // Mettre à jour l'affichage de la valeur
    const paddingValue = document.getElementById('snap-padding-value');
    if (paddingValue) {
        paddingValue.textContent = `${value}%`;
    }

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
    }

    setSnapPointAnchorChannel(channelIndex) {
    if (this.editingId === null) return;

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) return;

    const index = parseInt(channelIndex);
    snapPoint.anchorChannelIndex = index === -1 ? null : index;

    // Si un canal d'accrochage est défini, recalculer la valeur Y à cette position X
    if (snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined) {
        const newValue = this.getSnapPointValueOnCurve(snapPoint.anchorChannelIndex, snapPoint.xValue);
        if (newValue !== null) {
            snapPoint.value = newValue;
        }
        // Désactiver la flèche si un canal est sélectionné
        snapPoint.hasArrow = false;
    }

    // Activer/désactiver le bouton flèche selon le canal d'accrochage
    this.updateArrowButtonState();

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
    }

    toggleSnapPointArrow() {
    if (this.editingId === null) return;

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) return;

    // La flèche n'est disponible que si aucun canal d'accrochage n'est sélectionné
    if (snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined) {
        return; // Bloqué si un canal est sélectionné
    }

    snapPoint.hasArrow = !snapPoint.hasArrow;

    // Mettre à jour l'apparence du bouton
    const btn = document.getElementById('snap-arrow-toggle');
    if (btn) {
        if (snapPoint.hasArrow) {
            btn.style.background = 'var(--accent-green)';
            btn.style.color = 'white';
            btn.innerHTML = '<i class="fas fa-arrow-right"></i> Activée';
        } else {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.color = 'var(--text-main)';
            btn.innerHTML = '<i class="fas fa-arrow-right"></i> Activer';
        }
    }

    // Mettre à jour l'affichage
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
    }

    updateArrowButtonState() {
    if (this.editingId === null) return;

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) return;

    const btn = document.getElementById('snap-arrow-toggle');
    const info = document.getElementById('snap-arrow-info');

    if (!btn) return;

    const hasAnchor = snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined;

    if (hasAnchor) {
        // Canal sélectionné → griser le bouton
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        if (info) info.textContent = 'Disponible uniquement sans canal d\'accrochage';
    } else {
        // Pas de canal → activer le bouton
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        if (info) info.textContent = 'Flèche libre pour pointer sans accrocher';

        // Mettre à jour l'apparence selon l'état
        if (snapPoint.hasArrow) {
            btn.style.background = 'var(--accent-green)';
            btn.style.color = 'white';
            btn.innerHTML = '<i class="fas fa-arrow-right"></i> Activée';
        } else {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.color = 'var(--text-main)';
            btn.innerHTML = '<i class="fas fa-arrow-right"></i> Activer';
        }
    }
    }

    setSnapPointTextAlign(align) {
    if (this.editingId === null) return;

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) return;

    snapPoint.textAlign = align;

    // Mettre à jour les boutons d'alignement
    this.updateSnapPointAlignmentButtons();

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
    }

    setSnapPointVerticalAlign(align) {
    if (this.editingId === null) return;

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) return;

    snapPoint.textVerticalAlign = align;

    // Mettre à jour les boutons d'alignement
    this.updateSnapPointAlignmentButtons();

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
    }

    updateSnapPointFormatButtons() {
    if (this.editingId === null) return;

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) return;

    const btnBold = document.getElementById('snap-fmt-bold');
    const btnItalic = document.getElementById('snap-fmt-italic');
    const btnUnderline = document.getElementById('snap-fmt-underline');

    if (btnBold) {
        btnBold.style.background = snapPoint.fontWeight === 'bold' ? 'var(--accent-green)' : 'var(--bg-secondary)';
        btnBold.style.color = snapPoint.fontWeight === 'bold' ? 'white' : 'var(--text-main)';
    }

    if (btnItalic) {
        btnItalic.style.background = snapPoint.fontStyle === 'italic' ? 'var(--accent-green)' : 'var(--bg-secondary)';
        btnItalic.style.color = snapPoint.fontStyle === 'italic' ? 'white' : 'var(--text-main)';
    }

    if (btnUnderline) {
        btnUnderline.style.background = snapPoint.textDecoration === 'underline' ? 'var(--accent-green)' : 'var(--bg-secondary)';
        btnUnderline.style.color = snapPoint.textDecoration === 'underline' ? 'white' : 'var(--text-main)';
    }
    }

    updateSnapPointAlignmentButtons() {
    if (this.editingId === null) return;

    const snapPoint = this.snapPoints.find(sp => sp.id === this.editingId);
    if (!snapPoint) return;

    // Alignement horizontal
    const textAlign = snapPoint.textAlign || 'center';
    const btnLeft = document.getElementById('snap-align-left');
    const btnCenter = document.getElementById('snap-align-center');
    const btnRight = document.getElementById('snap-align-right');

    if (btnLeft) {
        btnLeft.style.background = textAlign === 'left' ? 'var(--accent-green)' : 'var(--bg-secondary)';
        btnLeft.style.color = textAlign === 'left' ? 'white' : 'var(--text-main)';
    }

    if (btnCenter) {
        btnCenter.style.background = textAlign === 'center' ? 'var(--accent-green)' : 'var(--bg-secondary)';
        btnCenter.style.color = textAlign === 'center' ? 'white' : 'var(--text-main)';
    }

    if (btnRight) {
        btnRight.style.background = textAlign === 'right' ? 'var(--accent-green)' : 'var(--bg-secondary)';
        btnRight.style.color = textAlign === 'right' ? 'white' : 'var(--text-main)';
    }

    // Alignement vertical
    const verticalAlign = snapPoint.textVerticalAlign || 'middle';
    const btnTop = document.getElementById('snap-valign-top');
    const btnMiddle = document.getElementById('snap-valign-middle');
    const btnBottom = document.getElementById('snap-valign-bottom');

    if (btnTop) {
        btnTop.style.background = verticalAlign === 'top' ? 'var(--accent-green)' : 'var(--bg-secondary)';
        btnTop.style.color = verticalAlign === 'top' ? 'white' : 'var(--text-main)';
    }

    if (btnMiddle) {
        btnMiddle.style.background = verticalAlign === 'middle' ? 'var(--accent-green)' : 'var(--bg-secondary)';
        btnMiddle.style.color = verticalAlign === 'middle' ? 'white' : 'var(--text-main)';
    }

    if (btnBottom) {
        btnBottom.style.background = verticalAlign === 'bottom' ? 'var(--accent-green)' : 'var(--bg-secondary)';
        btnBottom.style.color = verticalAlign === 'bottom' ? 'white' : 'var(--text-main)';
    }
    }

    makeSnapPointModalDraggable() {
    const modal = document.getElementById('snappoint-modal-content');
    const header = document.getElementById('snappoint-modal-header');

    if (!modal || !header) return;

    let isDragging = false;
    let initialX = 0;
    let initialY = 0;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        initialX = e.clientX - (parseInt(modal.style.left) || 0);
        initialY = e.clientY - (parseInt(modal.style.top) || 0);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const currentX = e.clientX - initialX;
        const currentY = e.clientY - initialY;

        modal.style.left = currentX + 'px';
        modal.style.top = currentY + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    }

    editSnapPoint(id) {
    this.openSnapPointEditModal(id);
    }

    deleteSnapPoint(id) {
    const index = this.snapPoints.findIndex(sp => sp.id === id);
    if (index !== -1) {
        this.snapPoints.splice(index, 1);
        this.updateSnapPointsList();
        appState.charts.time.update('none');
        setStatus(`Marqueur supprimé`);
    }
    }

    clearAllSnapPoints() {
    this.snapPoints = [];
    this.isCreating = false;
    this.state.active = false;

    const btn = document.getElementById('snappoint-btn');
    if (btn) {
        btn.style.background = 'var(--accent-blue)';
    }

    const content = document.getElementById('snappoint-content');
    if (content) {
        content.style.display = 'none';
    }

    this.updateSnapPointsList();
    console.log('✅ Tous les marqueurs ont été effacés');
    }

    saveSnapPoints() {
    try {
        const data = this.snapPoints.map(sp => ({
            id: sp.id,
            channelIndex: sp.channelIndex,
            xValue: sp.xValue,
            value: sp.value,
            comment: sp.comment,
            offsetX: sp.offsetX,
            offsetY: sp.offsetY,
            visible: sp.visible,
            color: sp.color,
            fontSize: sp.fontSize,
            fontWeight: sp.fontWeight,
            fontStyle: sp.fontStyle,
            textDecoration: sp.textDecoration,
            textAlign: sp.textAlign,
            textVerticalAlign: sp.textVerticalAlign,
            backgroundColor: sp.backgroundColor,
            backgroundOpacity: sp.backgroundOpacity,
            boxPaddingScale: sp.boxPaddingScale,
            boxWidth: sp.boxWidth,
            boxHeight: sp.boxHeight,
            anchorChannelIndex: sp.anchorChannelIndex
        }));

        localStorage.setItem('hydraspec_snappoints', JSON.stringify(data));
    } catch (e) {
        console.error('Erreur sauvegarde marqueurs:', e);
    }
    }

    loadSnapPoints() {
    try {
        const saved = localStorage.getItem('hydraspec_snappoints');
        if (!saved) return;

        const data = JSON.parse(saved);
        this.snapPoints = data.map(item => {
            const snapPoint = new SnapPoint(
                item.id,
                item.channelIndex,
                item.xValue !== undefined ? item.xValue : item.time, // Compatibilité avec anciennes sauvegardes
                item.value
            );
            snapPoint.comment = item.comment || '';
            snapPoint.offsetX = item.offsetX || 80;
            snapPoint.offsetY = item.offsetY || -40;
            snapPoint.visible = item.visible !== false;
            snapPoint.color = item.color || '#4ECDC4';
            snapPoint.fontSize = item.fontSize || window.chartFontSize;
            snapPoint.fontWeight = item.fontWeight || 'normal';
            snapPoint.fontStyle = item.fontStyle || 'normal';
            snapPoint.textDecoration = item.textDecoration || 'none';
            snapPoint.textAlign = item.textAlign || 'center';
            snapPoint.textVerticalAlign = item.textVerticalAlign || 'middle';
            snapPoint.backgroundColor = item.backgroundColor || null;
            snapPoint.backgroundOpacity = item.backgroundOpacity !== undefined ? item.backgroundOpacity : 0.5;
            snapPoint.boxPaddingScale = item.boxPaddingScale || 1.0;
            snapPoint.boxWidth = item.boxWidth || null;
            snapPoint.boxHeight = item.boxHeight || null;
            snapPoint.anchorChannelIndex = item.anchorChannelIndex !== undefined ? item.anchorChannelIndex : item.channelIndex;

            // Mettre à jour nextSnapPointId
            if (item.id >= this.nextId) {
                this.nextId = item.id + 1;
            }

            return snapPoint;
        });

        console.log(`📥 ${this.snapPoints.length} marqueur(s) chargé(s) depuis localStorage`);
        this.checkSnapPointsIntegrity();
        this.updateSnapPointsList();
    } catch (e) {
        console.error('Erreur chargement marqueurs:', e);
    }
    }

    loadSnapPointsFromProject(savedSnapPoints) {
    if (!savedSnapPoints || !Array.isArray(savedSnapPoints)) {
        console.log("⚠️ No snap points to load from project");
        return;
    }

    console.log("📥 Loading", savedSnapPoints.length, "snap points from project");

    // DOUBLE VÉRIFICATION : Vérifier si des annotations flottantes existent
    const hasFloatingAnnotations = savedSnapPoints.some(sp =>
        sp.anchorChannelIndex === -1 || sp.anchorChannelIndex === null
    );

    // Si oui, garantir que le canal fantôme existe AVANT le chargement
    if (hasFloatingAnnotations) {
        console.log("👻 Annotations flottantes détectées, vérification du canal fantôme...");
        if (typeof getOrCreatePhantomChannel === 'function') {
            getOrCreatePhantomChannel();
        } else {
            console.warn("⚠️ Fonction getOrCreatePhantomChannel introuvable!");
        }
    }

    this.snapPoints = savedSnapPoints.map(item => {
        const snapPoint = new SnapPoint(
            item.id,
            item.channelIndex,
            item.xValue !== undefined ? item.xValue : item.time, // Compatibilité avec anciennes sauvegardes
            item.value
        );
        snapPoint.comment = item.comment || '';
        snapPoint.offsetX = item.offsetX || 80;
        snapPoint.offsetY = item.offsetY || -40;
        snapPoint.visible = item.visible !== false;
        snapPoint.color = item.color || '#4ECDC4';
        snapPoint.fontSize = item.fontSize || window.chartFontSize;
        snapPoint.fontWeight = item.fontWeight || 'normal';
        snapPoint.fontStyle = item.fontStyle || 'normal';
        snapPoint.textDecoration = item.textDecoration || 'none';
        snapPoint.textAlign = item.textAlign || 'center';
        snapPoint.textVerticalAlign = item.textVerticalAlign || 'middle';
        snapPoint.backgroundColor = item.backgroundColor || null;
        snapPoint.backgroundOpacity = item.backgroundOpacity !== undefined ? item.backgroundOpacity : 0.5;
        snapPoint.boxPaddingScale = item.boxPaddingScale || 1.0;
        snapPoint.boxWidth = item.boxWidth || null;
        snapPoint.boxHeight = item.boxHeight || null;
        snapPoint.anchorChannelIndex = item.anchorChannelIndex !== undefined ? item.anchorChannelIndex : item.channelIndex;

        // Mettre à jour nextSnapPointId
        if (item.id >= this.nextId) {
            this.nextId = item.id + 1;
        }

        return snapPoint;
    });

    console.log("✅ Loaded", this.snapPoints.length, "snap points successfully");
    this.checkSnapPointsIntegrity();
    this.updateSnapPointsList();
    }

    detectResizeZone(mouseX, mouseY, boxX, boxY, boxWidth, boxHeight) {
    const edgeThreshold = 8; // Largeur de la zone sensible (pixels)

    const nearLeft = Math.abs(mouseX - boxX) <= edgeThreshold;
    const nearRight = Math.abs(mouseX - (boxX + boxWidth)) <= edgeThreshold;
    const nearTop = Math.abs(mouseY - boxY) <= edgeThreshold;
    const nearBottom = Math.abs(mouseY - (boxY + boxHeight)) <= edgeThreshold;

    const insideX = mouseX >= boxX && mouseX <= boxX + boxWidth;
    const insideY = mouseY >= boxY && mouseY <= boxY + boxHeight;

    // Coins (prioritaires)
    if (nearTop && nearLeft && insideY && insideX) return 'nw';
    if (nearTop && nearRight && insideY && insideX) return 'ne';
    if (nearBottom && nearLeft && insideY && insideX) return 'sw';
    if (nearBottom && nearRight && insideY && insideX) return 'se';

    // Bords
    if (nearTop && insideX) return 'n';
    if (nearBottom && insideX) return 's';
    if (nearLeft && insideY) return 'w';
    if (nearRight && insideY) return 'e';

    return null;
    }

    getCursorForResizeZone(zone) {
    const cursors = {
        'n': 'ns-resize',
        's': 'ns-resize',
        'e': 'ew-resize',
        'w': 'ew-resize',
        'ne': 'nesw-resize',
        'sw': 'nesw-resize',
        'nw': 'nwse-resize',
        'se': 'nwse-resize'
    };
    return cursors[zone] || 'default';
    }

    handleSnapPointMouseDown(event, chart) {
    // Permettre le drag des marqueurs même quand l'outil n'est pas actif
    if (this.snapPoints.length === 0) {
        return false;
    }

    const rect = chart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Vérifier les clics sur les éléments (en ordre inverse pour gérer z-index)
    for (let i = this.snapPoints.length - 1; i >= 0; i--) {
        const snapPoint = this.snapPoints[i];
        if (!snapPoint.visible) continue;

        const pointPos = snapPoint.getPointPixelPosition(chart);
        const boxPos = snapPoint.getBoxPixelPosition(chart);
        if (!pointPos || !boxPos) continue;

        // Calculer les dimensions de la boîte
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = `${snapPoint.fontWeight} ${snapPoint.fontSize}px sans-serif`;

        const channelLabel = snapPoint.getChannelLabel();
        const unit = snapPoint.getChannelUnit();
        const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { unit: 's', isTime: true };
        const lines = [
            channelLabel,
            `x = ${snapPoint.xValue.toFixed(3)} ${xInfo.unit}`,
            `${snapPoint.value.toFixed(1)} ${unit}`
        ];
        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            // IMPORTANT : Traiter les balises pour avoir la bonne taille de boîte
            // ET utiliser le MÊME split que dans drawSnapPoints pour avoir le même nombre de lignes !
            const processedComment = this.replaceSnapPointTags(snapPoint.comment, snapPoint, i);
            if (processedComment.trim() !== '') {
                const commentLines = processedComment.split(/\n|;/).map(line => line.trim()).filter(line => line.length > 0);
                lines.push(...commentLines);
            }
        }

        const basePadding = 6; // Réduit de 10 à 6 pour moins de marge verticale
        const padding = basePadding * (snapPoint.boxPaddingScale || 1.0);
        const lineHeight = snapPoint.fontSize + 4;
        let maxWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });

        const autoBoxWidth = maxWidth + padding * 2;
        const autoBoxHeight = lines.length * lineHeight + padding * 2;
        const boxWidth = snapPoint.boxWidth || autoBoxWidth;
        const boxHeight = snapPoint.boxHeight || autoBoxHeight;
        ctx.restore();

        // 1. Calculer la position de la boîte
        const boxX = boxPos.x - boxWidth / 2;
        const boxY = boxPos.y;

        // 1bis. Vérifier clic sur l'extrémité de la flèche (si flèche activée) - PRIORITAIRE
        if (snapPoint.hasArrow && (snapPoint.anchorChannelIndex === null || snapPoint.anchorChannelIndex === undefined)) {
            const arrowEndX = boxPos.x + snapPoint.arrowEndX;
            const arrowEndY = boxPos.y + snapPoint.arrowEndY;
            const distToArrowEnd = Math.sqrt(Math.pow(mouseX - arrowEndX, 2) + Math.pow(mouseY - arrowEndY, 2));

            if (distToArrowEnd <= 10) {
                // Commencer le drag de l'extrémité de la flèche
                this.state.dragging = 'arrow';
                this.state.draggedSnapPoint = snapPoint;
                this.state.dragStartX = mouseX;
                this.state.dragStartY = mouseY;

                chart.canvas.style.cursor = 'move';
                return true; // Événement géré
            }
        }

        // 1ter. Vérifier clic sur la ligne de la flèche (si flèche activée) - Drag boîte + flèche ensemble
        if (snapPoint.hasArrow && (snapPoint.anchorChannelIndex === null || snapPoint.anchorChannelIndex === undefined)) {
            const arrowEndX = boxPos.x + snapPoint.arrowEndX;
            const arrowEndY = boxPos.y + snapPoint.arrowEndY;

            // Calculer le point de départ de la ligne (même logique que le dessin)
            const boxLeft = boxPos.x - boxWidth / 2;
            const boxRight = boxPos.x + boxWidth / 2;
            const boxTop = boxPos.y;
            const boxBottom = boxPos.y + boxHeight;
            const boxCenterX = boxPos.x;
            const boxCenterY = boxPos.y + boxHeight / 2;

            const dx = arrowEndX - boxCenterX;
            const dy = arrowEndY - boxCenterY;

            let lineStartX = boxCenterX;
            let lineStartY = boxCenterY;

            if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
                const angle = Math.atan2(dy, dx);
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                if (cos > 0) {
                    const t = (boxRight - boxCenterX) / dx;
                    const y = boxCenterY + t * dy;
                    if (y >= boxTop && y <= boxBottom) {
                        lineStartX = boxRight;
                        lineStartY = y;
                    }
                } else if (cos < 0) {
                    const t = (boxLeft - boxCenterX) / dx;
                    const y = boxCenterY + t * dy;
                    if (y >= boxTop && y <= boxBottom) {
                        lineStartX = boxLeft;
                        lineStartY = y;
                    }
                }

                if (sin < 0) {
                    const t = (boxTop - boxCenterY) / dy;
                    const x = boxCenterX + t * dx;
                    if (x >= boxLeft && x <= boxRight) {
                        lineStartX = x;
                        lineStartY = boxTop;
                    }
                } else if (sin > 0) {
                    const t = (boxBottom - boxCenterY) / dy;
                    const x = boxCenterX + t * dx;
                    if (x >= boxLeft && x <= boxRight) {
                        lineStartX = x;
                        lineStartY = boxBottom;
                    }
                }
            }

            // Vérifier si le clic est proche de la ligne de la flèche
            const distToLine = this.this.distanceToLineSegment(mouseX, mouseY, lineStartX, lineStartY, arrowEndX, arrowEndY);

            if (distToLine <= 6) {
                // Commencer le drag de la ligne (boîte + flèche ensemble)
                this.state.dragging = 'arrow-line';
                this.state.draggedSnapPoint = snapPoint;
                this.state.dragStartX = mouseX;
                this.state.dragStartY = mouseY;
                this.state.dragOffsetX = snapPoint.offsetX;
                this.state.dragOffsetY = snapPoint.offsetY;

                chart.canvas.style.cursor = 'move';
                return true; // Événement géré
            }
        }

        // 2. Vérifier clic sur zone de resize (prioritaire sur le drag)
        const resizeZone = this.this.detectResizeZone(mouseX, mouseY, boxX, boxY, boxWidth, boxHeight);
        if (resizeZone) {
            // Commencer le resize
            this.state.dragging = 'resize';
            this.state.draggedSnapPoint = snapPoint;
            this.state.resizeDirection = resizeZone;
            this.state.dragStartX = mouseX;
            this.state.dragStartY = mouseY;
            this.state.resizeStartWidth = boxWidth;
            this.state.resizeStartHeight = boxHeight;
            this.state.resizeStartBoxX = boxX;
            this.state.resizeStartBoxY = boxY;
            this.state.dragOffsetX = snapPoint.offsetX;
            this.state.dragOffsetY = snapPoint.offsetY;
            this.state.dimensionsFrozen = false; // Indicateur pour figer les dimensions au premier mouvement

            // Sauvegarder la position initiale de la flèche si elle existe
            if (snapPoint.hasArrow) {
                this.state.initialArrowEndX = snapPoint.arrowEndX;
                this.state.initialArrowEndY = snapPoint.arrowEndY;
                // Calculer la position absolue initiale de l'extrémité de la flèche
                this.state.initialArrowAbsX = boxPos.x + snapPoint.arrowEndX;
                this.state.initialArrowAbsY = boxPos.y + snapPoint.arrowEndY;
            }

            chart.canvas.style.cursor = this.this.getCursorForResizeZone(resizeZone);
            return true; // Événement géré
        }

        // 3. Vérifier clic sur la boîte (pour drag)
        if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
            mouseY >= boxY && mouseY <= boxY + boxHeight) {
            // Commencer le drag de la boîte
            this.state.dragging = 'box';
            this.state.draggedSnapPoint = snapPoint;
            this.state.dragStartX = mouseX;
            this.state.dragStartY = mouseY;
            this.state.dragOffsetX = snapPoint.offsetX;
            this.state.dragOffsetY = snapPoint.offsetY;

            // Sauvegarder les positions initiales de la flèche si elle existe
            if (snapPoint.hasArrow) {
                this.state.initialArrowEndX = snapPoint.arrowEndX;
                this.state.initialArrowEndY = snapPoint.arrowEndY;
            }

            chart.canvas.style.cursor = 'move';
            return true; // Événement géré
        }

        // 4. Vérifier clic sur le point d'accroche (pour drag)
        const pointRadius = 8; // Zone cliquable
        const distToPoint = Math.sqrt(
            Math.pow(mouseX - pointPos.x, 2) +
            Math.pow(mouseY - pointPos.y, 2)
        );

        if (distToPoint <= pointRadius) {
            // Commencer le drag du point
            this.state.dragging = 'point';
            this.state.draggedSnapPoint = snapPoint;
            this.state.dragStartX = mouseX;
            this.state.dragStartY = mouseY;

            chart.canvas.style.cursor = 'move';
            return true; // Événement géré
        }
    }

    return false; // Événement non géré
    }

    handleSnapPointMouseMove(event, chart) {
    // Permettre le déplacement des marqueurs même quand l'outil n'est pas actif
    const rect = chart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Si on est en train de drag ou resize
    if (this.state.dragging && this.state.draggedSnapPoint) {
        const deltaX = mouseX - this.state.dragStartX;
        const deltaY = mouseY - this.state.dragStartY;

        if (this.state.dragging === 'box') {
            // Drag de la boîte : mettre à jour les offsets
            this.state.draggedSnapPoint.offsetX = this.state.dragOffsetX + deltaX;
            this.state.draggedSnapPoint.offsetY = this.state.dragOffsetY + deltaY;

            // Si une flèche est active, ajuster arrowEndX/Y pour que l'extrémité reste en position absolue
            if (this.state.draggedSnapPoint.hasArrow && this.state.initialArrowEndX !== undefined) {
                this.state.draggedSnapPoint.arrowEndX = this.state.initialArrowEndX - deltaX;
                this.state.draggedSnapPoint.arrowEndY = this.state.initialArrowEndY - deltaY;
            }
        } else if (this.state.dragging === 'point') {
            // Drag du point : recalculer xValue et value
            const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's', isTime: true };
            const xScale = chart.scales.x;
            const xValueScaled = xScale.getValueForPixel(mouseX);
            const xValue = xValueScaled / xInfo.scale;

            this.state.draggedSnapPoint.xValue = xValue;

            // Si un canal d'accrochage est défini, suivre la courbe
            if (this.state.draggedSnapPoint.anchorChannelIndex !== null &&
                this.state.draggedSnapPoint.anchorChannelIndex !== undefined) {
                const liveValue = this.getSnapPointValueOnCurve(this.state.draggedSnapPoint.anchorChannelIndex, xValue);
                if (liveValue !== null) {
                    this.state.draggedSnapPoint.value = liveValue;
                }
            } else {
                // Sinon, utiliser la position Y de la souris
                const yAxisID = appState.channelConfig[this.state.draggedSnapPoint.channelIndex]?.yAxisID || 'y';
                const yScale = chart.scales[yAxisID];
                if (yScale) {
                    this.state.draggedSnapPoint.value = yScale.getValueForPixel(mouseY);
                }
            }
        } else if (this.state.dragging === 'resize') {
            // Figer les dimensions au premier mouvement pour éviter un saut dimensionnel
            if (!this.state.dimensionsFrozen) {
                const snapPoint = this.state.draggedSnapPoint;
                if (snapPoint.boxWidth === null || snapPoint.boxHeight === null) {
                    snapPoint.boxWidth = this.state.resizeStartWidth;
                    snapPoint.boxHeight = this.state.resizeStartHeight;
                }
                this.state.dimensionsFrozen = true;
            }

            // Resize de la boîte
            const direction = this.state.resizeDirection;
            let newWidth = this.state.resizeStartWidth;
            let newHeight = this.state.resizeStartHeight;
            let offsetXDelta = 0;
            let offsetYDelta = 0;

            // Calculer les nouvelles dimensions selon la direction
            if (direction.includes('w')) {
                // Resize vers la gauche (le bord gauche bouge, le bord droit reste fixe)
                newWidth = this.state.resizeStartWidth - deltaX;
                offsetXDelta = deltaX / 2; // Ajuster l'offset pour garder le centre
            }
            if (direction.includes('e')) {
                // Resize vers la droite (le bord droit bouge, le bord gauche reste fixe)
                newWidth = this.state.resizeStartWidth + deltaX;
                offsetXDelta = deltaX / 2;
            }
            if (direction.includes('n')) {
                // Resize vers le haut (le bord haut bouge, le bord BAS reste fixe)
                newHeight = this.state.resizeStartHeight - deltaY;
                offsetYDelta = deltaY; // Déplacer toute la boîte vers le haut pour garder le bas fixe
            }
            if (direction.includes('s')) {
                // Resize vers le bas (le bord bas bouge, le bord HAUT reste fixe)
                newHeight = this.state.resizeStartHeight + deltaY;
                offsetYDelta = 0; // Ne PAS déplacer la boîte, juste agrandir vers le bas
            }

            // Appliquer des limites minimales
            const minWidth = 80;
            const minHeight = 40;
            newWidth = Math.max(newWidth, minWidth);
            newHeight = Math.max(newHeight, minHeight);

            // Mettre à jour les dimensions et ajuster les offsets
            this.state.draggedSnapPoint.boxWidth = newWidth;
            this.state.draggedSnapPoint.boxHeight = newHeight;

            // Ajuster les offsets pour que la boîte reste centrée pendant le resize
            if (direction.includes('e') || direction.includes('w')) {
                this.state.draggedSnapPoint.offsetX = this.state.dragOffsetX + offsetXDelta;
            }
            if (direction.includes('n') || direction.includes('s')) {
                this.state.draggedSnapPoint.offsetY = this.state.dragOffsetY + offsetYDelta;
            }

            // Si une flèche est active, ajuster arrowEndX/Y pour que l'extrémité reste à la même position absolue
            if (this.state.draggedSnapPoint.hasArrow && this.state.initialArrowAbsX !== undefined) {
                // Recalculer la nouvelle position de la boîte après le resize
                const newBoxPos = this.state.draggedSnapPoint.getBoxPixelPosition(chart);
                if (newBoxPos) {
                    // Ajuster arrowEndX/Y pour maintenir la position absolue
                    this.state.draggedSnapPoint.arrowEndX = this.state.initialArrowAbsX - newBoxPos.x;
                    this.state.draggedSnapPoint.arrowEndY = this.state.initialArrowAbsY - newBoxPos.y;
                }
            }
        } else if (this.state.dragging === 'arrow') {
            // Drag de l'extrémité de la flèche
            this.state.draggedSnapPoint.arrowEndX += deltaX;
            this.state.draggedSnapPoint.arrowEndY += deltaY;

            // Mettre à jour les positions de départ pour le prochain delta
            this.state.dragStartX = mouseX;
            this.state.dragStartY = mouseY;
        } else if (this.state.dragging === 'arrow-line') {
            // Drag de la ligne de la flèche : déplacer la boîte ET l'extrémité ensemble
            // (arrowEndX/Y restent constants car ils sont relatifs à la boîte)
            this.state.draggedSnapPoint.offsetX = this.state.dragOffsetX + deltaX;
            this.state.draggedSnapPoint.offsetY = this.state.dragOffsetY + deltaY;
        }

        // Mettre à jour l'affichage
        chart.update('none');
        this.updateSnapPointsList();
        return;
    }

    // Si on n'est pas en drag, vérifier le survol pour changer le curseur
    let cursorToSet = 'default';

    for (let i = this.snapPoints.length - 1; i >= 0; i--) {
        const snapPoint = this.snapPoints[i];
        if (!snapPoint.visible) continue;

        const pointPos = snapPoint.getPointPixelPosition(chart);
        const boxPos = snapPoint.getBoxPixelPosition(chart);
        if (!pointPos || !boxPos) continue;

        // Calculer dimensions de la boîte
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = `${snapPoint.fontWeight} ${snapPoint.fontSize}px sans-serif`;

        const channelLabel = snapPoint.getChannelLabel();
        const unit = snapPoint.getChannelUnit();
        const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { unit: 's', isTime: true };
        const lines = [
            channelLabel,
            `x = ${snapPoint.xValue.toFixed(3)} ${xInfo.unit}`,
            `${snapPoint.value.toFixed(1)} ${unit}`
        ];
        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            // IMPORTANT : Traiter les balises pour avoir la bonne taille de boîte
            // ET utiliser le MÊME split que dans drawSnapPoints pour avoir le même nombre de lignes !
            const processedComment = this.replaceSnapPointTags(snapPoint.comment, snapPoint, i);
            if (processedComment.trim() !== '') {
                const commentLines = processedComment.split(/\n|;/).map(line => line.trim()).filter(line => line.length > 0);
                lines.push(...commentLines);
            }
        }

        const basePadding = 6; // Réduit de 10 à 6 pour moins de marge verticale
        const padding = basePadding * (snapPoint.boxPaddingScale || 1.0);
        const lineHeight = snapPoint.fontSize + 4;
        let maxWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });

        const autoBoxWidth = maxWidth + padding * 2;
        const autoBoxHeight = lines.length * lineHeight + padding * 2;
        const boxWidth = snapPoint.boxWidth || autoBoxWidth;
        const boxHeight = snapPoint.boxHeight || autoBoxHeight;
        ctx.restore();

        // Calculer position de la boîte
        const boxX = boxPos.x - boxWidth / 2;
        const boxY = boxPos.y;

        // Vérifier survol zone de resize (prioritaire)
        const resizeZone = this.this.detectResizeZone(mouseX, mouseY, boxX, boxY, boxWidth, boxHeight);
        if (resizeZone) {
            cursorToSet = this.this.getCursorForResizeZone(resizeZone);
            break;
        }

        // Vérifier survol boîte
        if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
            mouseY >= boxY && mouseY <= boxY + boxHeight) {
            cursorToSet = 'move';
            break;
        }

        // Vérifier survol point
        if (snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined) {
            const pointRadius = 8;
            const distToPoint = Math.sqrt(
                Math.pow(mouseX - pointPos.x, 2) +
                Math.pow(mouseY - pointPos.y, 2)
            );

            if (distToPoint <= pointRadius) {
                cursorToSet = 'move';
                break;
            }
        }
    }

    // Mettre à jour le curseur
    chart.canvas.style.cursor = cursorToSet;

    // Mettre à jour le halo (rétrécir si survol zone interactive)
    if (typeof mouseHalo !== 'undefined' && mouseHalo) {
        if (cursorToSet !== 'default') {
            mouseHalo.classList.add('small');
        } else {
            mouseHalo.classList.remove('small');
        }
    }
    }

    handleSnapPointMouseUp(event, chart) {
    if (this.state.dragging) {
        // Fin du drag
        this.state.dragging = null;
        this.state.draggedSnapPoint = null;

        chart.canvas.style.cursor = 'default';

        // Sauvegarder l'état
        saveSnapPoints();
    }
    }

    handleSnapPointContextMenu(event, chart) {
    // Permettre le menu contextuel même quand l'outil n'est pas actif
    if (this.snapPoints.length === 0) {
        return false;
    }

    const rect = chart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Chercher si on a cliqué sur un snapPoint
    for (let i = this.snapPoints.length - 1; i >= 0; i--) {
        const snapPoint = this.snapPoints[i];
        if (!snapPoint.visible) continue;

        const pointPos = snapPoint.getPointPixelPosition(chart);
        const boxPos = snapPoint.getBoxPixelPosition(chart);
        if (!pointPos || !boxPos) continue;

        // Calculer les dimensions de la boîte
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = `${snapPoint.fontWeight} ${snapPoint.fontSize}px sans-serif`;

        const channelLabel = snapPoint.getChannelLabel();
        const unit = snapPoint.getChannelUnit();
        const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { unit: 's', isTime: true };
        const lines = [
            channelLabel,
            `x = ${snapPoint.xValue.toFixed(3)} ${xInfo.unit}`,
            `${snapPoint.value.toFixed(1)} ${unit}`
        ];
        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            lines.push(snapPoint.comment);
        }

        const basePadding = 10;
        const padding = basePadding * (snapPoint.boxPaddingScale || 1.0);
        const lineHeight = snapPoint.fontSize + 4;
        let maxWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });

        const boxWidth = maxWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;
        ctx.restore();

        // Vérifier si on a cliqué sur la boîte
        const boxX = boxPos.x - boxWidth / 2;
        const boxY = boxPos.y;

        if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
            mouseY >= boxY && mouseY <= boxY + boxHeight) {
            // Afficher le menu contextuel
            this.showContextMenu(event.clientX, event.clientY, snapPoint.id);
            return true;
        }

        // Vérifier si on a cliqué sur le point d'accroche
        if (snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined) {
            const pointRadius = 8;
            const distToPoint = Math.sqrt(
                Math.pow(mouseX - pointPos.x, 2) +
                Math.pow(mouseY - pointPos.y, 2)
            );

            if (distToPoint <= pointRadius) {
                this.showContextMenu(event.clientX, event.clientY, snapPoint.id);
                return true;
            }
        }
    }

    return false;
    }

    showContextMenu(x, y, snapPointId) {
    const menu = document.getElementById('snappoint-context-menu');
    if (!menu) return;

    this.contextMenuId = snapPointId;

    // Mettre à jour le texte de visibilité
    const snapPoint = this.snapPoints.find(sp => sp.id === snapPointId);
    if (snapPoint) {
        const eyeIcon = document.getElementById('context-menu-eye-icon');
        const visibilityText = document.getElementById('context-menu-visibility-text');

        if (snapPoint.visible) {
            if (eyeIcon) eyeIcon.className = 'fas fa-eye-slash';
            if (visibilityText) visibilityText.textContent = 'Masquer';
        } else {
            if (eyeIcon) eyeIcon.className = 'fas fa-eye';
            if (visibilityText) visibilityText.textContent = 'Afficher';
        }
    }

    // Positionner et afficher le menu
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';
    }

    hideContextMenu() {
    const menu = document.getElementById('snappoint-context-menu');
    if (menu) {
        menu.style.display = 'none';
    }
    this.contextMenuId = null;
    }

    contextMenuEdit() {
    if (this.contextMenuId !== null) {
        editSnapPoint(this.contextMenuId);
    }
    this.hideContextMenu();
    }

    contextMenuToggleVisibility() {
    if (this.contextMenuId !== null) {
        this.toggleSnapPointVisibility(this.contextMenuId);
    }
    this.hideContextMenu();
    }

    contextMenuDuplicate() {
    if (this.contextMenuId !== null) {
        const snapPoint = this.snapPoints.find(sp => sp.id === this.contextMenuId);
        if (snapPoint) {
            // Créer une copie
            const duplicate = new SnapPoint(
                this.nextId++,
                snapPoint.channelIndex,
                snapPoint.xValue,
                snapPoint.value
            );
            duplicate.comment = snapPoint.comment + ' (copie)';
            duplicate.offsetX = snapPoint.offsetX + 30; // Décaler légèrement
            duplicate.offsetY = snapPoint.offsetY + 30;
            duplicate.visible = snapPoint.visible;
            duplicate.color = snapPoint.color;
            duplicate.fontSize = snapPoint.fontSize;
            duplicate.fontWeight = snapPoint.fontWeight;
            duplicate.fontStyle = snapPoint.fontStyle;
            duplicate.textDecoration = snapPoint.textDecoration;
            duplicate.backgroundColor = snapPoint.backgroundColor;
            duplicate.backgroundOpacity = snapPoint.backgroundOpacity;
            duplicate.boxPaddingScale = snapPoint.boxPaddingScale;
            duplicate.boxWidth = snapPoint.boxWidth;
            duplicate.boxHeight = snapPoint.boxHeight;
            duplicate.anchorChannelIndex = snapPoint.anchorChannelIndex;

            this.snapPoints.push(duplicate);
            this.updateSnapPointsList();
            appState.charts.time.update('none');
            saveSnapPoints();

            setStatus(`Marqueur dupliqué`);
        }
    }
    this.hideContextMenu();
    }

    contextMenuDelete() {
    if (this.contextMenuId !== null) {
        this.deleteSnapPoint(this.contextMenuId);
    }
    this.hideContextMenu();
    }

}

// =====================================
// INSTANCE GLOBALE
// =====================================

const snapPointTool = new SnapPointTool();

// =====================================
// FONCTIONS DE COMPATIBILITÉ
// =====================================

function toggleSnapPointTool() {
    return snapPointTool.toggleSnapPointTool();
}

function setSnapPointMode(mode) {
    return snapPointTool.setSnapPointMode(mode);
}

function handleSnapPointClick(event, chart) {
    return snapPointTool.handleSnapPointClick(event, chart);
}

function interpolateChannelValue(channelIndex, xValue) {
    return snapPointTool.interpolateChannelValue(channelIndex, xValue);
}

function getSnapPointValueOnCurve(channelIndex, xValue) {
    return snapPointTool.getSnapPointValueOnCurve(channelIndex, xValue);
}

function hexToRgba(hex, opacity) {
    return snapPointTool.hexToRgba(hex, opacity);
}

function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    return snapPointTool.distanceToLineSegment(px, py, x1, y1, x2, y2);
}

function replaceSnapPointTags(comment, snapPoint, snapPointIndex = null) {
    return snapPointTool.replaceSnapPointTags(comment, snapPoint, snapPointIndex);
}

function drawSnapPoints(chart) {
    return snapPointTool.drawSnapPoints(chart);
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor) {
    return snapPointTool.drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor);
}

function checkSnapPointsIntegrity() {
    return snapPointTool.checkSnapPointsIntegrity();
}

function updateSnapPointsList() {
    return snapPointTool.updateSnapPointsList();
}

function toggleSnapPointVisibility(id) {
    return snapPointTool.toggleSnapPointVisibility(id);
}

function openSnapPointEditModal(id) {
    return snapPointTool.openSnapPointEditModal(id);
}

function closeSnapPointEditModal() {
    return snapPointTool.closeSnapPointEditModal();
}

function confirmSnapPointEdit() {
    return snapPointTool.confirmSnapPointEdit();
}

function toggleSnapPointFormat(format) {
    return snapPointTool.toggleSnapPointFormat(format);
}

function setSnapPointFontSize(size) {
    return snapPointTool.setSnapPointFontSize(size);
}

function setSnapPointBackgroundColor(color) {
    return snapPointTool.setSnapPointBackgroundColor(color);
}

function setSnapPointOpacity(value) {
    return snapPointTool.setSnapPointOpacity(value);
}

function setSnapPointPadding(value) {
    return snapPointTool.setSnapPointPadding(value);
}

function setSnapPointAnchorChannel(channelIndex) {
    return snapPointTool.setSnapPointAnchorChannel(channelIndex);
}

function toggleSnapPointArrow() {
    return snapPointTool.toggleSnapPointArrow();
}

function updateArrowButtonState() {
    return snapPointTool.updateArrowButtonState();
}

function setSnapPointTextAlign(align) {
    return snapPointTool.setSnapPointTextAlign(align);
}

function setSnapPointVerticalAlign(align) {
    return snapPointTool.setSnapPointVerticalAlign(align);
}

function updateSnapPointFormatButtons() {
    return snapPointTool.updateSnapPointFormatButtons();
}

function updateSnapPointAlignmentButtons() {
    return snapPointTool.updateSnapPointAlignmentButtons();
}

function makeSnapPointModalDraggable() {
    return snapPointTool.makeSnapPointModalDraggable();
}

function editSnapPoint(id) {
    return snapPointTool.editSnapPoint(id);
}

function deleteSnapPoint(id) {
    return snapPointTool.deleteSnapPoint(id);
}

function clearAllSnapPoints() {
    return snapPointTool.clearAllSnapPoints();
}

function saveSnapPoints() {
    return snapPointTool.saveSnapPoints();
}

function loadSnapPoints() {
    return snapPointTool.loadSnapPoints();
}

function loadSnapPointsFromProject(savedSnapPoints) {
    return snapPointTool.loadSnapPointsFromProject(savedSnapPoints);
}

function detectResizeZone(mouseX, mouseY, boxX, boxY, boxWidth, boxHeight) {
    return snapPointTool.detectResizeZone(mouseX, mouseY, boxX, boxY, boxWidth, boxHeight);
}

function getCursorForResizeZone(zone) {
    return snapPointTool.getCursorForResizeZone(zone);
}

function handleSnapPointMouseDown(event, chart) {
    return snapPointTool.handleSnapPointMouseDown(event, chart);
}

function handleSnapPointMouseMove(event, chart) {
    return snapPointTool.handleSnapPointMouseMove(event, chart);
}

function handleSnapPointMouseUp(event, chart) {
    return snapPointTool.handleSnapPointMouseUp(event, chart);
}

function handleSnapPointContextMenu(event, chart) {
    return snapPointTool.handleSnapPointContextMenu(event, chart);
}

function showContextMenu(x, y, snapPointId) {
    return snapPointTool.showContextMenu(x, y, snapPointId);
}

function hideContextMenu() {
    return snapPointTool.hideContextMenu();
}

function contextMenuEdit() {
    return snapPointTool.contextMenuEdit();
}

function contextMenuToggleVisibility() {
    return snapPointTool.contextMenuToggleVisibility();
}

function contextMenuDuplicate() {
    return snapPointTool.contextMenuDuplicate();
}

function contextMenuDelete() {
    return snapPointTool.contextMenuDelete();
}

// =====================================
// ACCESSEURS POUR COMPATIBILITÉ
// =====================================

Object.defineProperty(window, 'snapPoints', {
    get: () => snapPointTool.snapPoints,
    set: (value) => { snapPointTool.snapPoints = value; },
    configurable: true
});

Object.defineProperty(window, 'isCreatingSnapPoint', {
    get: () => snapPointTool.isCreating,
    set: (value) => { snapPointTool.isCreating = value; },
    configurable: true
});

Object.defineProperty(window, 'nextSnapPointId', {
    get: () => snapPointTool.nextId,
    set: (value) => { snapPointTool.nextId = value; },
    configurable: true
});

Object.defineProperty(window, 'snapPointState', {
    get: () => snapPointTool.state,
    set: (value) => { snapPointTool.state = value; },
    configurable: true
});

Object.defineProperty(window, 'editingSnapPointId', {
    get: () => snapPointTool.editingId,
    set: (value) => { snapPointTool.editingId = value; },
    configurable: true
});

Object.defineProperty(window, 'contextMenuSnapPointId', {
    get: () => snapPointTool.contextMenuId,
    set: (value) => { snapPointTool.contextMenuId = value; },
    configurable: true
});

