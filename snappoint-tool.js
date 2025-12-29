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
    dragging: null, // 'point', 'box', ou null
    draggedSnapPoint: null,
    dragStartX: 0,
    dragStartY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0
};

// Classe SnapPoint
class SnapPoint {
    constructor(id, channelIndex, time, value) {
        this.id = id;
        this.channelIndex = channelIndex; // Index du canal dans channelConfig
        this.time = time; // Temps en secondes
        this.value = value; // Valeur Y
        this.comment = ''; // Commentaire optionnel
        this.offsetX = 80; // Offset de la boîte par rapport au point (en pixels)
        this.offsetY = -40;
        this.visible = true;
        this.color = '#4ECDC4'; // Couleur par défaut

        // Formatage du texte
        this.fontSize = window.chartFontSize;
        this.fontWeight = 'normal';
        this.fontStyle = 'normal';
        this.textDecoration = 'none';
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
        const yAxisID = appState.channelConfig[this.channelIndex]?.yAxisID || 'y';
        const yScale = chart.scales[yAxisID];

        if (!yScale) return null;

        return {
            x: xScale.getPixelForValue(this.time * 1000),
            y: yScale.getPixelForValue(this.value)
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

// Gérer le clic sur le graphique pour créer un marqueur
function handleSnapPointClick(event, chart) {
    if (!snapPointState.active || !isCreatingSnapPoint) {
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

        // Dessiner le point d'accroche
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pointPos.x, pointPos.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dessiner la ligne pointillée de connexion
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(pointPos.x, pointPos.y);
        ctx.lineTo(boxPos.x, boxPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Préparer le texte
        const channelLabel = snapPoint.getChannelLabel();
        const unit = snapPoint.getChannelUnit();
        const timeText = `t = ${snapPoint.time.toFixed(3)}s`;
        const valueText = `${snapPoint.value.toFixed(2)} ${unit}`;
        const lines = [channelLabel, timeText, valueText];

        // Ajouter le commentaire si présent
        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            lines.push(snapPoint.comment);
        }

        // Calculer les dimensions de la boîte
        ctx.font = `${snapPoint.fontWeight} ${snapPoint.fontSize}px sans-serif`;
        const padding = 10;
        const lineHeight = snapPoint.fontSize + 4;

        let maxWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });

        const boxWidth = maxWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;

        // Dessiner la boîte avec coins arrondis
        const radius = 6;
        drawRoundedRect(ctx, boxPos.x - boxWidth / 2, boxPos.y, boxWidth, boxHeight, radius, '#FFD93D', '#000');

        // Dessiner le texte
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        let currentY = boxPos.y + padding;
        lines.forEach((line, index) => {
            // Première ligne en gras
            if (index === 0) {
                ctx.font = `bold ${snapPoint.fontSize}px sans-serif`;
            } else {
                ctx.font = `${snapPoint.fontWeight} ${snapPoint.fontSize}px sans-serif`;
            }
            ctx.fillText(line, boxPos.x, currentY);
            currentY += lineHeight;
        });

        // Dessiner le bouton supprimer (petite croix en haut à droite)
        const btnX = boxPos.x + boxWidth / 2 - 15;
        const btnY = boxPos.y + 10;
        const btnSize = 8;

        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(btnX - btnSize / 2, btnY - btnSize / 2);
        ctx.lineTo(btnX + btnSize / 2, btnY + btnSize / 2);
        ctx.moveTo(btnX + btnSize / 2, btnY - btnSize / 2);
        ctx.lineTo(btnX - btnSize / 2, btnY + btnSize / 2);
        ctx.stroke();
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
        const valueInfo = `${snapPoint.value.toFixed(2)} ${unit}`;
        const commentInfo = snapPoint.comment ? snapPoint.comment : '';

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
    if (infoValue) infoValue.textContent = `${snapPoint.value.toFixed(2)} ${snapPoint.getChannelUnit()}`;

    // Régler la taille de police
    if (sizeSelect) {
        sizeSelect.value = snapPoint.fontSize.toString();
    }

    // Mettre à jour les boutons de formatage
    updateSnapPointFormatButtons();

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
}

// Définir la taille de police
function setSnapPointFontSize(size) {
    if (editingSnapPointId === null) return;

    const snapPoint = snapPoints.find(sp => sp.id === editingSnapPointId);
    if (!snapPoint) return;

    snapPoint.fontSize = parseInt(size);
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
            textDecoration: sp.textDecoration
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
// INTERACTIONS (DRAG & DELETE)
// ========================================

/**
 * Gestion du clic sur le canvas pour drag et delete
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
            `${snapPoint.value.toFixed(2)} ${unit}`
        ];
        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            lines.push(snapPoint.comment);
        }

        const padding = 10;
        const lineHeight = snapPoint.fontSize + 4;
        let maxWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });

        const boxWidth = maxWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;
        ctx.restore();

        // 1. Vérifier clic sur bouton supprimer
        const btnX = boxPos.x + boxWidth / 2 - 15;
        const btnY = boxPos.y + 10;
        const btnSize = 16; // Zone cliquable plus grande que le dessin

        if (Math.abs(mouseX - btnX) <= btnSize / 2 && Math.abs(mouseY - btnY) <= btnSize / 2) {
            deleteSnapPoint(snapPoint.id);
            return true; // Événement géré
        }

        // 2. Vérifier clic sur la boîte (pour drag)
        const boxX = boxPos.x - boxWidth / 2;
        const boxY = boxPos.y;

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

        // 3. Vérifier clic sur le point d'accroche (pour drag)
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

    // Si on est en train de drag
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
            const yAxisID = appState.channelConfig[snapPointState.draggedSnapPoint.channelIndex]?.yAxisID || 'y';
            const yScale = chart.scales[yAxisID];

            if (yScale) {
                const timeMs = xScale.getValueForPixel(mouseX);
                const value = yScale.getValueForPixel(mouseY);

                snapPointState.draggedSnapPoint.time = timeMs / 1000;
                snapPointState.draggedSnapPoint.value = value;
            }
        }

        // Mettre à jour l'affichage
        chart.update('none');
        updateSnapPointsList();
        return;
    }

    // Si on n'est pas en drag, vérifier le survol pour changer le curseur
    let isOverInteractive = false;

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
            `${snapPoint.value.toFixed(2)} ${unit}`
        ];
        if (snapPoint.comment && snapPoint.comment.trim() !== '') {
            lines.push(snapPoint.comment);
        }

        const padding = 10;
        const lineHeight = snapPoint.fontSize + 4;
        let maxWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });

        const boxWidth = maxWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;
        ctx.restore();

        // Vérifier survol bouton supprimer
        const btnX = boxPos.x + boxWidth / 2 - 15;
        const btnY = boxPos.y + 10;
        const btnSize = 16;

        if (Math.abs(mouseX - btnX) <= btnSize / 2 && Math.abs(mouseY - btnY) <= btnSize / 2) {
            isOverInteractive = true;
            break;
        }

        // Vérifier survol boîte
        const boxX = boxPos.x - boxWidth / 2;
        const boxY = boxPos.y;

        if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
            mouseY >= boxY && mouseY <= boxY + boxHeight) {
            isOverInteractive = true;
            break;
        }

        // Vérifier survol point
        const pointRadius = 8;
        const distToPoint = Math.sqrt(
            Math.pow(mouseX - pointPos.x, 2) +
            Math.pow(mouseY - pointPos.y, 2)
        );

        if (distToPoint <= pointRadius) {
            isOverInteractive = true;
            break;
        }
    }

    // Mettre à jour le curseur
    chart.canvas.style.cursor = isOverInteractive ? 'pointer' : 'default';
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
}

console.log('✅ Outil Marqueur (SnapPoint) initialisé');
