// =====================================
// OUTIL MARQUEUR (SNAPPOINT)
// Points d'annotation avec info dessinées sur canvas
// Alternative aux annotations HTML pour éviter débordement
// =====================================

// Variables globales
let snapPoints = [];
let isCreatingSnapPoint = false;
let nextSnapPointId = 1;

// État de l'outil
let snapPointState = {
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

// Classe SnapPoint
class SnapPoint {
    constructor(id, channelIndex, time, value) {
        this.id = id;
        this.channelIndex = channelIndex; // Index du canal dans channelConfig
        this.time = time; // Temps en secondes
        this.value = value; // Valeur Y
        this.comment = 'C$ X$ Y$'; // Commentaire avec balises par défaut (sans point-virgule)
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
        this.backgroundColor = '#FFD93D'; // Couleur de fond (jaune par défaut)
        this.backgroundOpacity = 0.9; // Opacité du fond (0-1)
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

        // Déterminer quel canal utiliser pour le Y
        const targetChannelIndex = this.anchorChannelIndex !== null && this.anchorChannelIndex !== undefined
                                    ? this.anchorChannelIndex
                                    : this.channelIndex;

        const yAxisID = appState.channelConfig[targetChannelIndex]?.yAxisID || 'y';
        const yScale = chart.scales[yAxisID];

        if (!yScale) return null;

        // Si un canal d'accrochage est défini, recalculer la valeur Y en temps réel
        let yValue = this.value;
        if (this.anchorChannelIndex !== null && this.anchorChannelIndex !== undefined) {
            const liveValue = getSnapPointValueOnCurve(this.anchorChannelIndex, this.time);
            if (liveValue !== null) {
                yValue = liveValue;
            }
        }

        return {
            x: xScale.getPixelForValue(this.time * 1000),
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

// Activer/désactiver l'outil
function toggleSnapPointTool() {
    const btn = document.getElementById('snappoint-btn');
    const content = document.getElementById('snappoint-content');

    if (!snapPointState.active) {
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
        snapPointState.active = true;
        isCreatingSnapPoint = true;
        if (btn) {
            btn.style.background = 'var(--accent-green)';
        }

        // Afficher le contenu
        if (content) {
            content.style.display = 'block';
        }

        setStatus("Outil Marqueur activé - Cliquez sur un point du graphique");
    } else {
        // DÉSACTIVATION
        snapPointState.active = false;
        isCreatingSnapPoint = false;
        if (btn) {
            btn.style.background = 'var(--accent-blue)';
        }

        // Masquer le contenu
        if (content) {
            content.style.display = 'none';
        }

        setStatus("Outil Marqueur désactivé");
    }
}

/**
 * Changer le mode de l'outil Marqueur (Créer / Déplacer)
 * @param {string} mode - 'create' ou 'move'
 */
function setSnapPointMode(mode) {
    snapPointState.mode = mode;

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
            modeText.textContent = 'Cliquez sur le graphique pour créer un marqueur';
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
            modeText.textContent = 'Cliquez sur un marqueur pour le déplacer ou le redimensionner';
        }
        setStatus("Mode Déplacement : Cliquez sur un marqueur pour le déplacer");
    }
}

// Gérer le clic sur le graphique pour créer un marqueur
function handleSnapPointClick(event, chart) {
    // Ne créer que si l'outil est actif ET en mode création
    if (!snapPointState.active || !isCreatingSnapPoint || snapPointState.mode !== 'create') {
        return false;
    }

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convertir en temps
    const timeMs = chart.scales.x.getValueForPixel(x);
    const timeSec = timeMs / 1000;

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
            const value = interpolateChannelValue(index, timeSec);
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
        nextSnapPointId++,
        closestChannel.index,
        timeSec,
        closestChannel.value
    );
    snapPoints.push(snapPoint);

    // Mettre à jour l'affichage
    updateSnapPointsList();
    chart.update('none');

    setStatus(`Marqueur créé sur ${snapPoint.getChannelLabel()}`);

    return true;
}

// Interpoler la valeur Y sur un canal à un temps donné
function interpolateChannelValue(channelIndex, timeSec) {
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

    const timeMs = timeSec * 1000;

    let leftIdx = -1;
    let rightIdx = -1;

    for (let i = 0; i < labels.length; i++) {
        const labelX = parseFloat(labels[i]);

        if (labelX <= timeMs) {
            leftIdx = i;
        }
        if (labelX >= timeMs && rightIdx === -1) {
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
            const ratio = (timeMs - x1) / (x2 - x1);
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

// Obtenir la valeur réelle sur une courbe à un temps donné (pour le suivi de courbe)
function getSnapPointValueOnCurve(channelIndex, timeInSeconds) {
    const timeMs = timeInSeconds * 1000; // Convertir en ms
    const dataTime = appState.fullDataTime;

    // Obtenir les données du bon canal
    let dataValues;
    if (appState.allColumnData && appState.allColumnData[channelIndex + 1]) {
        // +1 car allColumnData[0] est le temps
        dataValues = appState.allColumnData[channelIndex + 1];
    } else {
        // Fallback - essayer de trouver dans les datasets
        return null;
    }

    if (!dataTime || !dataValues || dataTime.length === 0) {
        return null;
    }

    // Trouver l'index du point le plus proche
    let closestIndex = 0;
    let minDiff = Math.abs(dataTime[0] - timeMs);

    for (let i = 1; i < dataTime.length; i++) {
        const diff = Math.abs(dataTime[i] - timeMs);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
        if (dataTime[i] > timeMs) break; // Optimisation
    }

    return dataValues[closestIndex];
}

// Fonction helper pour convertir hex en rgba
function hexToRgba(hex, opacity) {
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

// Fonction pour remplacer les balises dans le commentaire
function replaceSnapPointTags(comment, snapPoint) {
    if (!comment || comment.trim() === '') {
        return comment;
    }

    let result = comment;

    // Si un canal d'accrochage est défini, utiliser ses informations
    const hasAnchor = snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined;

    if (hasAnchor) {
        const channelLabel = snapPoint.getChannelLabel();
        const unit = snapPoint.getChannelUnit();
        const timeText = `${snapPoint.time.toFixed(3)} sec`;
        const valueText = `${snapPoint.value.toFixed(1)} ${unit}`;

        // Remplacer les balises
        result = result.replace(/C\$/g, channelLabel);        // C$ → "S1; IA (mA)"
        result = result.replace(/X\$/g, timeText);            // X$ → "7,444 sec"
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

// Dessiner tous les marqueurs sur le graphique
function drawSnapPoints(chart) {
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

    snapPoints.forEach(snapPoint => {
        if (!snapPoint.visible) return;

        // Vérifier que le canal existe
        if (!appState.channelConfig[snapPoint.channelIndex]) {
            return;
        }

        const pointPos = snapPoint.getPointPixelPosition(chart);
        if (!pointPos) return;

        const boxPos = snapPoint.getBoxPixelPosition(chart);
        if (!boxPos) return;

        const config = appState.channelConfig[snapPoint.channelIndex];
        const color = config.color || snapPoint.color;

        // Dessiner le point d'accroche et la ligne SEULEMENT si un canal d'accrochage est défini
        if (snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined) {
            // Obtenir la couleur du canal d'accrochage
            const anchorConfig = appState.channelConfig[snapPoint.anchorChannelIndex];
            const anchorColor = anchorConfig?.color || color;

            // Dessiner le point d'accroche
            ctx.fillStyle = anchorColor;
            ctx.beginPath();
            ctx.arc(pointPos.x, pointPos.y, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Calculer les dimensions de la boîte (on en aura besoin plus tard)
            ctx.save();
            ctx.font = `${snapPoint.fontWeight} ${snapPoint.fontSize}px sans-serif`;
            const lines = [];
            if (snapPoint.comment && snapPoint.comment.trim() !== '') {
                const processedComment = replaceSnapPointTags(snapPoint.comment, snapPoint);
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

                // Dessiner la ligne pointillée de connexion avec la couleur du canal d'accrochage
                ctx.strokeStyle = anchorColor;
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

        // Préparer le texte - uniquement le commentaire avec balises remplacées
        const lines = [];

        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            const processedComment = replaceSnapPointTags(snapPoint.comment, snapPoint);
            if (processedComment && processedComment.trim() !== '') {
                // Séparer le commentaire en lignes (par retour à la ligne ou par ';')
                const commentLines = processedComment.split(/\n|;/).map(line => line.trim()).filter(line => line.length > 0);
                lines.push(...commentLines);
            }
        }

        // Si pas de lignes à afficher, ne rien dessiner
        if (lines.length === 0) {
            return;
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
        const backgroundColor = snapPoint.backgroundColor || '#FFD93D';
        const backgroundOpacity = snapPoint.backgroundOpacity !== undefined ? snapPoint.backgroundOpacity : 0.9;

        // Convertir la couleur en rgba avec l'opacité
        const bgColor = hexToRgba(backgroundColor, backgroundOpacity);
        drawRoundedRect(ctx, boxPos.x - boxWidth / 2, boxPos.y, boxWidth, boxHeight, radius, bgColor, '#000');

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
            const arrowColor = snapPoint.backgroundColor || '#FFD93D';

            // Point de départ : bord droit de la boîte
            const boxCenterX = boxPos.x;
            const boxCenterY = boxPos.y + boxHeight / 2;
            const boxRight = boxPos.x + boxWidth / 2;

            // Point d'arrivée : position définie par arrowEndX/Y (offsets)
            const arrowEndX = boxPos.x + snapPoint.arrowEndX;
            const arrowEndY = boxPos.y + snapPoint.arrowEndY;

            // Dessiner la ligne de la flèche
            ctx.strokeStyle = arrowColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(boxRight, boxCenterY);
            ctx.lineTo(arrowEndX, arrowEndY);
            ctx.stroke();

            // Dessiner la pointe de la flèche
            const angle = Math.atan2(arrowEndY - boxCenterY, arrowEndX - boxRight);
            const arrowSize = 12;

            ctx.fillStyle = arrowColor;
            ctx.beginPath();
            ctx.moveTo(arrowEndX, arrowEndY);
            ctx.lineTo(
                arrowEndX - arrowSize * Math.cos(angle - Math.PI / 6),
                arrowEndY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                arrowEndX - arrowSize * Math.cos(angle + Math.PI / 6),
                arrowEndY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();

            // Dessiner un petit cercle draggable à la fin de la flèche
            ctx.fillStyle = arrowColor;
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(arrowEndX, arrowEndY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    });

    ctx.restore();
}

// Fonction pour dessiner un rectangle aux coins arrondis
function drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor) {
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

// Mettre à jour la liste des marqueurs dans le sidebar
function updateSnapPointsList() {
    const listContainer = document.getElementById('snappoints-list');
    if (!listContainer) return;

    if (snapPoints.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.8rem; font-style:italic;">
                Aucun marqueur
            </div>
        `;
        return;
    }

    let html = '';
    snapPoints.forEach((snapPoint, index) => {
        const channelLabel = snapPoint.getChannelLabel();
        const unit = snapPoint.getChannelUnit();
        const timeInfo = `${snapPoint.time.toFixed(3)}s`;
        const valueInfo = `${snapPoint.value.toFixed(1)} ${unit}`;
        // Traiter le commentaire avec les balises
        const commentInfo = snapPoint.comment ? replaceSnapPointTags(snapPoint.comment, snapPoint) : '';

        const isVisible = snapPoint.visible !== false;
        const eyeIcon = isVisible ? 'fa-eye' : 'fa-eye-slash';
        const eyeColor = isVisible ? 'var(--accent-green)' : 'var(--text-muted)';

        const config = appState.channelConfig[snapPoint.channelIndex];
        const color = config?.color || snapPoint.color;

        html += `
            <div style="padding:8px; margin-bottom:6px; background:var(--bg-secondary); border-radius:4px; border-left:3px solid ${color}; font-size:0.75rem;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                    <span style="color:${color}; font-weight:bold;"><i class="fas fa-map-marker-alt"></i> Marqueur ${index + 1}</span>
                    <span style="flex:1;"></span>
                    <button onclick="toggleSnapPointVisibility(${snapPoint.id})"
                            style="padding:4px 6px; background:none; border:none; color:${eyeColor}; cursor:pointer; font-size:0.9rem;"
                            title="${isVisible ? 'Masquer' : 'Afficher'}">
                        <i class="fas ${eyeIcon}"></i>
                    </button>
                    <button onclick="editSnapPoint(${snapPoint.id})"
                            style="padding:4px 6px; background:none; border:none; color:var(--accent-blue); cursor:pointer; font-size:0.9rem;"
                            title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteSnapPoint(${snapPoint.id})"
                            style="padding:4px 6px; background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:0.9rem;"
                            title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div style="color:var(--text-main); margin-bottom:2px;">${channelLabel}</div>
                <div style="color:var(--text-main); margin-bottom:2px;">${timeInfo} | ${valueInfo}</div>
                ${commentInfo ? `<div style="color:var(--text-muted); font-style:italic;">${commentInfo}</div>` : ''}
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// Basculer la visibilité d'un marqueur
function toggleSnapPointVisibility(id) {
    const snapPoint = snapPoints.find(sp => sp.id === id);
    if (snapPoint) {
        snapPoint.visible = !snapPoint.visible;
        updateSnapPointsList();
        appState.charts.time.update('none');
    }
}

// État de la modale d'édition
let editingSnapPointId = null;

// État du menu contextuel
let contextMenuSnapPointId = null;

// Ouvrir la modale d'édition complète d'un marqueur
function openSnapPointEditModal(id) {
    const snapPoint = snapPoints.find(sp => sp.id === id);
    if (!snapPoint) {
        console.error(`Marqueur avec id ${id} introuvable`);
        return;
    }

    // Récupérer les éléments de la modale
    const modal = document.getElementById('snappoint-edit-modal');
    const commentInput = document.getElementById('snappoint-comment-input');
    const infoChannel = document.getElementById('snappoint-info-channel');
    const infoTime = document.getElementById('snappoint-info-time');
    const infoValue = document.getElementById('snappoint-info-value');
    const sizeSelect = document.getElementById('snap-fmt-size');

    if (!modal) return;

    // Stocker l'ID en édition
    editingSnapPointId = id;

    // Remplir les champs
    if (commentInput) commentInput.value = snapPoint.comment || '';
    if (infoChannel) infoChannel.textContent = snapPoint.getChannelLabel();
    if (infoTime) infoTime.textContent = `${snapPoint.time.toFixed(3)}s`;
    if (infoValue) infoValue.textContent = `${snapPoint.value.toFixed(1)} ${snapPoint.getChannelUnit()}`;

    // Régler la taille de police
    if (sizeSelect) {
        sizeSelect.value = snapPoint.fontSize.toString();
    }

    // Régler la couleur de fond
    const bgColorPicker = document.getElementById('snap-bg-color');
    if (bgColorPicker && snapPoint.backgroundColor) {
        bgColorPicker.value = snapPoint.backgroundColor;
    }

    // Régler l'opacité
    const opacitySlider = document.getElementById('snap-opacity');
    const opacityValue = document.getElementById('snap-opacity-value');
    const opacity = (snapPoint.backgroundOpacity !== undefined ? snapPoint.backgroundOpacity : 0.9) * 100;
    if (opacitySlider) opacitySlider.value = opacity;
    if (opacityValue) opacityValue.textContent = `${Math.round(opacity)}%`;

    // Peupler et régler le canal d'accrochage
    const anchorChannelSelect = document.getElementById('snap-anchor-channel');
    if (anchorChannelSelect && appState.channelConfig) {
        // Vider et repeupler le sélecteur
        anchorChannelSelect.innerHTML = '<option value="-1">Aucun (boîte flottante)</option>';

        // Ajouter tous les canaux disponibles
        appState.channelConfig.forEach((config, index) => {
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
    updateSnapPointFormatButtons();

    // Mettre à jour les boutons d'alignement
    updateSnapPointAlignmentButtons();

    // Mettre à jour l'état du bouton flèche
    updateArrowButtonState();

    // Afficher la modale
    modal.style.display = 'flex';

    // Initialiser le drag de la modale
    makeSnapPointModalDraggable();
}

// Fermer la modale d'édition
function closeSnapPointEditModal() {
    const modal = document.getElementById('snappoint-edit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    editingSnapPointId = null;
}

// Confirmer l'édition du marqueur
function confirmSnapPointEdit() {
    if (editingSnapPointId === null) {
        console.error('Aucun marqueur en édition');
        return;
    }

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
    if (!snapPoint) {
        console.error(`Marqueur avec id ${editingSnapPointId} introuvable`);
        return;
    }

    // Récupérer les valeurs
    const commentInput = document.getElementById('snappoint-comment-input');
    if (commentInput) {
        snapPoint.comment = commentInput.value;
    }

    // Fermer la modale
    closeSnapPointEditModal();

    // Mettre à jour l'affichage
    updateSnapPointsList();
    appState.charts.time.update('none');

    // Sauvegarder
    saveSnapPoints();

    setStatus(`Marqueur modifié`);
}

// Basculer un format (bold, italic, underline)
function toggleSnapPointFormat(format) {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
    if (!snapPoint) return;

    if (format === 'bold') {
        snapPoint.fontWeight = snapPoint.fontWeight === 'bold' ? 'normal' : 'bold';
    } else if (format === 'italic') {
        snapPoint.fontStyle = snapPoint.fontStyle === 'italic' ? 'normal' : 'italic';
    } else if (format === 'underline') {
        snapPoint.textDecoration = snapPoint.textDecoration === 'underline' ? 'none' : 'underline';
    }

    updateSnapPointFormatButtons();

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
}

// Définir la taille de police
function setSnapPointFontSize(size) {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
    if (!snapPoint) return;

    snapPoint.fontSize = parseInt(size);
}

// Définir la couleur de fond
function setSnapPointBackgroundColor(color) {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
    if (!snapPoint) return;

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

// Définir l'opacité du fond
function setSnapPointOpacity(value) {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
    if (!snapPoint) return;

    const opacity = parseInt(value) / 100;
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

// Définir la taille de la boîte (padding scale)
function setSnapPointPadding(value) {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
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

// Définir le canal d'accrochage
function setSnapPointAnchorChannel(channelIndex) {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
    if (!snapPoint) return;

    const index = parseInt(channelIndex);
    snapPoint.anchorChannelIndex = index === -1 ? null : index;

    // Si un canal d'accrochage est défini, recalculer la valeur Y à ce temps
    if (snapPoint.anchorChannelIndex !== null && snapPoint.anchorChannelIndex !== undefined) {
        const newValue = getSnapPointValueOnCurve(snapPoint.anchorChannelIndex, snapPoint.time);
        if (newValue !== null) {
            snapPoint.value = newValue;
        }
        // Désactiver la flèche si un canal est sélectionné
        snapPoint.hasArrow = false;
    }

    // Activer/désactiver le bouton flèche selon le canal d'accrochage
    updateArrowButtonState();

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
}

/**
 * Activer/Désactiver la flèche pour le snapPoint en cours d'édition
 */
function toggleSnapPointArrow() {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
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

/**
 * Mettre à jour l'état du bouton flèche (activé/désactivé) selon le canal d'accrochage
 */
function updateArrowButtonState() {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
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

// Définir l'alignement horizontal du texte
function setSnapPointTextAlign(align) {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
    if (!snapPoint) return;

    snapPoint.textAlign = align;

    // Mettre à jour les boutons d'alignement
    updateSnapPointAlignmentButtons();

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
}

// Définir l'alignement vertical du texte
function setSnapPointVerticalAlign(align) {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
    if (!snapPoint) return;

    snapPoint.textVerticalAlign = align;

    // Mettre à jour les boutons d'alignement
    updateSnapPointAlignmentButtons();

    // Mettre à jour l'aperçu en temps réel
    if (appState.charts.time) {
        appState.charts.time.update('none');
    }
}

// Mettre à jour l'apparence des boutons de formatage
function updateSnapPointFormatButtons() {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
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

// Mettre à jour l'apparence des boutons d'alignement
function updateSnapPointAlignmentButtons() {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
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

// Rendre la modale draggable par son header
function makeSnapPointModalDraggable() {
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

// Éditer un marqueur (fonction appelée depuis la liste)
function editSnapPoint(id) {
    openSnapPointEditModal(id);
}

// Supprimer un marqueur
function deleteSnapPoint(id) {
    const index = snapPoints.findIndex(sp => sp.id === id);
    if (index !== -1) {
        snapPoints.splice(index, 1);
        updateSnapPointsList();
        appState.charts.time.update('none');
        setStatus(`Marqueur supprimé`);
    }
}

// Effacer tous les marqueurs
function clearAllSnapPoints() {
    snapPoints = [];
    isCreatingSnapPoint = false;
    snapPointState.active = false;

    const btn = document.getElementById('snappoint-btn');
    if (btn) {
        btn.style.background = 'var(--accent-blue)';
    }

    const content = document.getElementById('snappoint-content');
    if (content) {
        content.style.display = 'none';
    }

    updateSnapPointsList();
    console.log('✅ Tous les marqueurs ont été effacés');
}

// Sauvegarder les marqueurs dans le localStorage
function saveSnapPoints() {
    try {
        const data = snapPoints.map(sp => ({
            id: sp.id,
            channelIndex: sp.channelIndex,
            time: sp.time,
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

// Charger les marqueurs depuis le localStorage
function loadSnapPoints() {
    try {
        const saved = localStorage.getItem('hydraspec_snappoints');
        if (!saved) return;

        const data = JSON.parse(saved);
        snapPoints = data.map(item => {
            const snapPoint = new SnapPoint(
                item.id,
                item.channelIndex,
                item.time,
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
            snapPoint.backgroundColor = item.backgroundColor || '#FFD93D';
            snapPoint.backgroundOpacity = item.backgroundOpacity !== undefined ? item.backgroundOpacity : 0.9;
            snapPoint.boxPaddingScale = item.boxPaddingScale || 1.0;
            snapPoint.boxWidth = item.boxWidth || null;
            snapPoint.boxHeight = item.boxHeight || null;
            snapPoint.anchorChannelIndex = item.anchorChannelIndex !== undefined ? item.anchorChannelIndex : item.channelIndex;

            // Mettre à jour nextSnapPointId
            if (item.id >= nextSnapPointId) {
                nextSnapPointId = item.id + 1;
            }

            return snapPoint;
        });

        updateSnapPointsList();
    } catch (e) {
        console.error('Erreur chargement marqueurs:', e);
    }
}

// Charger les marqueurs depuis les données d'un projet .hsp
function loadSnapPointsFromProject(savedSnapPoints) {
    if (!savedSnapPoints || !Array.isArray(savedSnapPoints)) {
        console.log("⚠️ No snap points to load from project");
        return;
    }

    console.log("📥 Loading", savedSnapPoints.length, "snap points from project");

    snapPoints = savedSnapPoints.map(item => {
        const snapPoint = new SnapPoint(
            item.id,
            item.channelIndex,
            item.time,
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
        snapPoint.backgroundColor = item.backgroundColor || '#FFD93D';
        snapPoint.backgroundOpacity = item.backgroundOpacity !== undefined ? item.backgroundOpacity : 0.9;
        snapPoint.boxPaddingScale = item.boxPaddingScale || 1.0;
        snapPoint.boxWidth = item.boxWidth || null;
        snapPoint.boxHeight = item.boxHeight || null;
        snapPoint.anchorChannelIndex = item.anchorChannelIndex !== undefined ? item.anchorChannelIndex : item.channelIndex;

        // Mettre à jour nextSnapPointId
        if (item.id >= nextSnapPointId) {
            nextSnapPointId = item.id + 1;
        }

        return snapPoint;
    });

    console.log("✅ Loaded", snapPoints.length, "snap points successfully");
    updateSnapPointsList();
}

// ========================================
// INTERACTIONS (DRAG & DELETE & RESIZE)
// ========================================

/**
 * Détecter la zone de redimensionnement (edge ou corner)
 * @param {number} mouseX - Position X de la souris
 * @param {number} mouseY - Position Y de la souris
 * @param {number} boxX - Position X de la boîte (coin haut-gauche)
 * @param {number} boxY - Position Y de la boîte (coin haut-gauche)
 * @param {number} boxWidth - Largeur de la boîte
 * @param {number} boxHeight - Hauteur de la boîte
 * @returns {string|null} - Direction de resize ('n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw') ou null
 */
function detectResizeZone(mouseX, mouseY, boxX, boxY, boxWidth, boxHeight) {
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

/**
 * Obtenir le curseur CSS approprié pour une zone de resize
 */
function getCursorForResizeZone(zone) {
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

/**
 * Gestion du clic sur le canvas pour drag, delete et resize
 * @param {MouseEvent} event - Événement souris
 * @param {Chart} chart - Instance Chart.js
 * @returns {boolean} - true si l'événement a été géré
 */
function handleSnapPointMouseDown(event, chart) {
    if (!snapPointState.active || snapPoints.length === 0) {
        return false;
    }

    const rect = chart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Vérifier les clics sur les éléments (en ordre inverse pour gérer z-index)
    for (let i = snapPoints.length - 1; i >= 0; i--) {
        const snapPoint = snapPoints[i];
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
        const lines = [
            channelLabel,
            `t = ${snapPoint.time.toFixed(3)}s`,
            `${snapPoint.value.toFixed(1)} ${unit}`
        ];
        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            // IMPORTANT : Traiter les balises pour avoir la bonne taille de boîte
            // ET utiliser le MÊME split que dans drawSnapPoints pour avoir le même nombre de lignes !
            const processedComment = replaceSnapPointTags(snapPoint.comment, snapPoint);
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
                snapPointState.dragging = 'arrow';
                snapPointState.draggedSnapPoint = snapPoint;
                snapPointState.dragStartX = mouseX;
                snapPointState.dragStartY = mouseY;

                chart.canvas.style.cursor = 'move';
                return true; // Événement géré
            }
        }

        // 2. Vérifier clic sur zone de resize (prioritaire sur le drag)
        const resizeZone = detectResizeZone(mouseX, mouseY, boxX, boxY, boxWidth, boxHeight);
        if (resizeZone) {
            // IMPORTANT : Si c'est le premier redimensionnement, figer les dimensions actuelles
            // pour éviter un saut dimensionnel
            if (snapPoint.boxWidth === null || snapPoint.boxHeight === null) {
                snapPoint.boxWidth = boxWidth;
                snapPoint.boxHeight = boxHeight;
            }

            // Commencer le resize
            snapPointState.dragging = 'resize';
            snapPointState.draggedSnapPoint = snapPoint;
            snapPointState.resizeDirection = resizeZone;
            snapPointState.dragStartX = mouseX;
            snapPointState.dragStartY = mouseY;
            snapPointState.resizeStartWidth = boxWidth;
            snapPointState.resizeStartHeight = boxHeight;
            snapPointState.resizeStartBoxX = boxX;
            snapPointState.resizeStartBoxY = boxY;
            snapPointState.dragOffsetX = snapPoint.offsetX;
            snapPointState.dragOffsetY = snapPoint.offsetY;

            chart.canvas.style.cursor = getCursorForResizeZone(resizeZone);
            return true; // Événement géré
        }

        // 3. Vérifier clic sur la boîte (pour drag)
        if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
            mouseY >= boxY && mouseY <= boxY + boxHeight) {
            // Commencer le drag de la boîte
            snapPointState.dragging = 'box';
            snapPointState.draggedSnapPoint = snapPoint;
            snapPointState.dragStartX = mouseX;
            snapPointState.dragStartY = mouseY;
            snapPointState.dragOffsetX = snapPoint.offsetX;
            snapPointState.dragOffsetY = snapPoint.offsetY;

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
            snapPointState.dragging = 'point';
            snapPointState.draggedSnapPoint = snapPoint;
            snapPointState.dragStartX = mouseX;
            snapPointState.dragStartY = mouseY;

            chart.canvas.style.cursor = 'move';
            return true; // Événement géré
        }
    }

    return false; // Événement non géré
}

/**
 * Gestion du déplacement de la souris (drag en cours)
 * @param {MouseEvent} event - Événement souris
 * @param {Chart} chart - Instance Chart.js
 */
function handleSnapPointMouseMove(event, chart) {
    if (!snapPointState.active) {
        return;
    }

    const rect = chart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Si on est en train de drag ou resize
    if (snapPointState.dragging && snapPointState.draggedSnapPoint) {
        const deltaX = mouseX - snapPointState.dragStartX;
        const deltaY = mouseY - snapPointState.dragStartY;

        if (snapPointState.dragging === 'box') {
            // Drag de la boîte : mettre à jour les offsets
            snapPointState.draggedSnapPoint.offsetX = snapPointState.dragOffsetX + deltaX;
            snapPointState.draggedSnapPoint.offsetY = snapPointState.dragOffsetY + deltaY;
        } else if (snapPointState.dragging === 'point') {
            // Drag du point : recalculer time et value
            const xScale = chart.scales.x;
            const timeMs = xScale.getValueForPixel(mouseX);
            const timeSec = timeMs / 1000;

            snapPointState.draggedSnapPoint.time = timeSec;

            // Si un canal d'accrochage est défini, suivre la courbe
            if (snapPointState.draggedSnapPoint.anchorChannelIndex !== null &&
                snapPointState.draggedSnapPoint.anchorChannelIndex !== undefined) {
                const liveValue = getSnapPointValueOnCurve(snapPointState.draggedSnapPoint.anchorChannelIndex, timeSec);
                if (liveValue !== null) {
                    snapPointState.draggedSnapPoint.value = liveValue;
                }
            } else {
                // Sinon, utiliser la position Y de la souris
                const yAxisID = appState.channelConfig[snapPointState.draggedSnapPoint.channelIndex]?.yAxisID || 'y';
                const yScale = chart.scales[yAxisID];
                if (yScale) {
                    snapPointState.draggedSnapPoint.value = yScale.getValueForPixel(mouseY);
                }
            }
        } else if (snapPointState.dragging === 'resize') {
            // Resize de la boîte
            const direction = snapPointState.resizeDirection;
            let newWidth = snapPointState.resizeStartWidth;
            let newHeight = snapPointState.resizeStartHeight;
            let offsetXDelta = 0;
            let offsetYDelta = 0;

            // Calculer les nouvelles dimensions selon la direction
            if (direction.includes('w')) {
                // Resize vers la gauche (le bord gauche bouge, le bord droit reste fixe)
                newWidth = snapPointState.resizeStartWidth - deltaX;
                offsetXDelta = deltaX / 2; // Ajuster l'offset pour garder le centre
            }
            if (direction.includes('e')) {
                // Resize vers la droite (le bord droit bouge, le bord gauche reste fixe)
                newWidth = snapPointState.resizeStartWidth + deltaX;
                offsetXDelta = deltaX / 2;
            }
            if (direction.includes('n')) {
                // Resize vers le haut (le bord haut bouge, le bord BAS reste fixe)
                newHeight = snapPointState.resizeStartHeight - deltaY;
                offsetYDelta = deltaY; // Déplacer toute la boîte vers le haut pour garder le bas fixe
            }
            if (direction.includes('s')) {
                // Resize vers le bas (le bord bas bouge, le bord HAUT reste fixe)
                newHeight = snapPointState.resizeStartHeight + deltaY;
                offsetYDelta = 0; // Ne PAS déplacer la boîte, juste agrandir vers le bas
            }

            // Appliquer des limites minimales
            const minWidth = 80;
            const minHeight = 40;
            newWidth = Math.max(newWidth, minWidth);
            newHeight = Math.max(newHeight, minHeight);

            // Mettre à jour les dimensions et ajuster les offsets
            snapPointState.draggedSnapPoint.boxWidth = newWidth;
            snapPointState.draggedSnapPoint.boxHeight = newHeight;

            // Ajuster les offsets pour que la boîte reste centrée pendant le resize
            if (direction.includes('e') || direction.includes('w')) {
                snapPointState.draggedSnapPoint.offsetX = snapPointState.dragOffsetX + offsetXDelta;
            }
            if (direction.includes('n') || direction.includes('s')) {
                snapPointState.draggedSnapPoint.offsetY = snapPointState.dragOffsetY + offsetYDelta;
            }
        } else if (snapPointState.dragging === 'arrow') {
            // Drag de l'extrémité de la flèche
            snapPointState.draggedSnapPoint.arrowEndX += deltaX;
            snapPointState.draggedSnapPoint.arrowEndY += deltaY;

            // Mettre à jour les positions de départ pour le prochain delta
            snapPointState.dragStartX = mouseX;
            snapPointState.dragStartY = mouseY;
        }

        // Mettre à jour l'affichage
        chart.update('none');
        updateSnapPointsList();
        return;
    }

    // Si on n'est pas en drag, vérifier le survol pour changer le curseur
    let cursorToSet = 'default';

    for (let i = snapPoints.length - 1; i >= 0; i--) {
        const snapPoint = snapPoints[i];
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
        const lines = [
            channelLabel,
            `t = ${snapPoint.time.toFixed(3)}s`,
            `${snapPoint.value.toFixed(1)} ${unit}`
        ];
        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            // IMPORTANT : Traiter les balises pour avoir la bonne taille de boîte
            // ET utiliser le MÊME split que dans drawSnapPoints pour avoir le même nombre de lignes !
            const processedComment = replaceSnapPointTags(snapPoint.comment, snapPoint);
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
        const resizeZone = detectResizeZone(mouseX, mouseY, boxX, boxY, boxWidth, boxHeight);
        if (resizeZone) {
            cursorToSet = getCursorForResizeZone(resizeZone);
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

/**
 * Gestion du relâchement de la souris (fin du drag)
 * @param {MouseEvent} event - Événement souris
 * @param {Chart} chart - Instance Chart.js
 */
function handleSnapPointMouseUp(event, chart) {
    if (snapPointState.dragging) {
        // Fin du drag
        snapPointState.dragging = null;
        snapPointState.draggedSnapPoint = null;

        chart.canvas.style.cursor = 'default';

        // Sauvegarder l'état
        saveSnapPoints();
    }
}

// ========================================
// MENU CONTEXTUEL (CLIC DROIT)
// ========================================

/**
 * Gestion du clic droit sur un snapPoint
 * @param {MouseEvent} event - Événement souris
 * @param {Chart} chart - Instance Chart.js
 * @returns {boolean} - true si un menu a été affiché
 */
function handleSnapPointContextMenu(event, chart) {
    if (!snapPointState.active || snapPoints.length === 0) {
        return false;
    }

    const rect = chart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Chercher si on a cliqué sur un snapPoint
    for (let i = snapPoints.length - 1; i >= 0; i--) {
        const snapPoint = snapPoints[i];
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
        const lines = [
            channelLabel,
            `t = ${snapPoint.time.toFixed(3)}s`,
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
            showContextMenu(event.clientX, event.clientY, snapPoint.id);
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
                showContextMenu(event.clientX, event.clientY, snapPoint.id);
                return true;
            }
        }
    }

    return false;
}

/**
 * Afficher le menu contextuel à une position donnée
 */
function showContextMenu(x, y, snapPointId) {
    const menu = document.getElementById('snappoint-context-menu');
    if (!menu) return;

    contextMenuSnapPointId = snapPointId;

    // Mettre à jour le texte de visibilité
    const snapPoint = snapPoints.find(sp => sp.id === snapPointId);
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

/**
 * Masquer le menu contextuel
 */
function hideContextMenu() {
    const menu = document.getElementById('snappoint-context-menu');
    if (menu) {
        menu.style.display = 'none';
    }
    contextMenuSnapPointId = null;
}

/**
 * Actions du menu contextuel
 */
function contextMenuEdit() {
    if (contextMenuSnapPointId !== null) {
        editSnapPoint(contextMenuSnapPointId);
    }
    hideContextMenu();
}

function contextMenuToggleVisibility() {
    if (contextMenuSnapPointId !== null) {
        toggleSnapPointVisibility(contextMenuSnapPointId);
    }
    hideContextMenu();
}

function contextMenuDuplicate() {
    if (contextMenuSnapPointId !== null) {
        const snapPoint = snapPoints.find(sp => sp.id === contextMenuSnapPointId);
        if (snapPoint) {
            // Créer une copie
            const duplicate = new SnapPoint(
                nextSnapPointId++,
                snapPoint.channelIndex,
                snapPoint.time,
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

            snapPoints.push(duplicate);
            updateSnapPointsList();
            appState.charts.time.update('none');
            saveSnapPoints();

            setStatus(`Marqueur dupliqué`);
        }
    }
    hideContextMenu();
}

function contextMenuDelete() {
    if (contextMenuSnapPointId !== null) {
        deleteSnapPoint(contextMenuSnapPointId);
    }
    hideContextMenu();
}

// Fermer le menu si on clique ailleurs
document.addEventListener('click', (e) => {
    const menu = document.getElementById('snappoint-context-menu');
    if (menu && menu.style.display === 'block') {
        // Vérifier si le clic est en dehors du menu
        if (!menu.contains(e.target)) {
            hideContextMenu();
        }
    }
});

// Exporter pour utilisation globale
if (typeof window !== 'undefined') {
    window.toggleSnapPointTool = toggleSnapPointTool;
    window.handleSnapPointClick = handleSnapPointClick;
    window.handleSnapPointMouseDown = handleSnapPointMouseDown;
    window.handleSnapPointMouseMove = handleSnapPointMouseMove;
    window.handleSnapPointMouseUp = handleSnapPointMouseUp;
    window.drawSnapPoints = drawSnapPoints;
    window.updateSnapPointsList = updateSnapPointsList;
    window.toggleSnapPointVisibility = toggleSnapPointVisibility;
    window.editSnapPoint = editSnapPoint;
    window.deleteSnapPoint = deleteSnapPoint;
    window.clearAllSnapPoints = clearAllSnapPoints;
    window.saveSnapPoints = saveSnapPoints;
    window.loadSnapPoints = loadSnapPoints;
    window.loadSnapPointsFromProject = loadSnapPointsFromProject;
    window.openSnapPointEditModal = openSnapPointEditModal;
    window.closeSnapPointEditModal = closeSnapPointEditModal;
    window.confirmSnapPointEdit = confirmSnapPointEdit;
    window.toggleSnapPointFormat = toggleSnapPointFormat;
    window.setSnapPointFontSize = setSnapPointFontSize;
    window.setSnapPointTextAlign = setSnapPointTextAlign;
    window.setSnapPointVerticalAlign = setSnapPointVerticalAlign;
    window.setSnapPointBackgroundColor = setSnapPointBackgroundColor;
    window.setSnapPointOpacity = setSnapPointOpacity;
    window.setSnapPointAnchorChannel = setSnapPointAnchorChannel;
    window.handleSnapPointContextMenu = handleSnapPointContextMenu;
    window.contextMenuEdit = contextMenuEdit;
    window.contextMenuToggleVisibility = contextMenuToggleVisibility;
    window.contextMenuDuplicate = contextMenuDuplicate;
    window.contextMenuDelete = contextMenuDelete;
}

console.log('✅ Outil Marqueur (SnapPoint) initialisé');
