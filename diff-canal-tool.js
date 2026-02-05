// =====================================
// OUTIL DIFF/CANAL
// Mesure de différence attachée à un canal spécifique
// =====================================

// Variables globales
let diffCanalIntervals = [];
let isCreatingDiffCanal = false;
let selectedChannelIndex = null; // Index du canal sélectionné
let pendingDiffCanalPoint = null; // Premier point en attente
let nextDiffCanalId = 1;

// État de l'outil
let diffCanalState = {
    active: false,
    dragging: null, // 'point1', 'point2', 'horizontal-label', 'vertical-label', 'diagonal-label', ou null
    draggedInterval: null,
    dragStartX: 0, // Position X de la souris au début du drag
    dragStartY: 0  // Position Y de la souris au début du drag
};

// Classe DiffCanal
class DiffCanalInterval {
    constructor(id, channelIndex, point1, point2) {
        this.id = id;
        this.channelIndex = channelIndex; // Index du canal dans channelConfig
        this.point1 = point1; // {x: temps en sec, y: valeur}
        this.point2 = point2; // {x: temps en sec, y: valeur}
        this.labelOffset = 0.5; // Position de l'annotation diagonale sur le segment (0-1)
        this.horizontalLabelOffsetX = 0; // Offset horizontal de l'annotation Δt (en pixels)
        this.verticalLabelOffsetY = 0; // Offset vertical de l'annotation Δy (en pixels)
        this.visible = true;
        this.color = '#4ECDC4'; // Couleur par défaut
    }

    // Calculer Delta X (différence de temps)
    getDeltaX() {
        return Math.abs(this.point2.x - this.point1.x);
    }

    // Calculer Delta Y (différence de valeur)
    getDeltaY() {
        return Math.abs(this.point2.y - this.point1.y);
    }

    // Calculer la pente (Delta Y / Delta X)
    getSlope() {
        const dx = this.getDeltaX();
        if (dx === 0) return 0;
        return this.getDeltaY() / dx;
    }

    // Obtenir l'unité du canal
    getChannelUnit() {
        if (!appState.channelConfig || !appState.channelConfig[this.channelIndex]) {
            return 'unité';
        }
        const config = appState.channelConfig[this.channelIndex];
        // Extraire l'unité entre parenthèses dans le label (ex: "Pression (bar)" -> "bar")
        const match = config.label.match(/\(([^)]+)\)/);
        if (match) {
            return match[1];
        }
        return config.unit || 'unité';
    }

    // Obtenir le label du canal
    getChannelLabel() {
        if (!appState.channelConfig || !appState.channelConfig[this.channelIndex]) {
            return 'Canal';
        }
        return appState.channelConfig[this.channelIndex].label || 'Canal';
    }

    // Formater l'annotation de pente
    getSlopeText() {
        const slope = this.getSlope();
        const unit = this.getChannelUnit();
        return `${slope.toFixed(2)} ${unit}/s`;
    }
}

// Activer/désactiver l'outil
function toggleDiffCanalTool() {
    const btn = document.getElementById('diff-canal-btn');
    const content = document.getElementById('diff-canal-content');
    const icon = document.getElementById('diff-canal-accordion-icon');

    // Vérifier l'état AVANT de changer
    if (!diffCanalState.active) {
        // ACTIVATION : Désactiver les autres outils D'ABORD
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('diffcanal');
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
            closeOtherToolAccordions('diffcanal');
        }

        // Activer l'outil APRÈS avoir désactivé les autres
        diffCanalState.active = true;
        if (btn) {
            btn.style.background = 'var(--accent-green)';
        }

        // Afficher le contenu et mettre à jour l'icône
        if (content) {
            content.style.display = 'block';
        }
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }

        // Mettre à jour la liste des canaux disponibles
        updateChannelSelect();

        setStatus(t("status.diff_canal_tool_activated"));
    } else {
        // DÉSACTIVATION
        diffCanalState.active = false;
        isCreatingDiffCanal = false;
        pendingDiffCanalPoint = null;
        selectedChannelIndex = null;
        if (btn) {
            btn.style.background = 'var(--accent-blue)';
        }

        // Masquer le contenu et mettre à jour l'icône
        if (content) {
            content.style.display = 'none';
        }
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }

        setStatus(t("status.diff_canal_tool_deactivated"));
    }
}

// Mettre à jour la liste déroulante des canaux
function updateChannelSelect() {
    const select = document.getElementById('diff-canal-channel-select');
    if (!select) return;

    // Vider la liste
    select.innerHTML = '<option value="">-- Sélectionner un canal --</option>';

    // Ajouter tous les canaux visibles
    if (appState.channelConfig && appState.channelConfig.length > 0) {
        appState.channelConfig.forEach((config, index) => {
            if (config.visible) {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = config.label || `Canal ${index + 1}`;
                select.appendChild(option);
            }
        });
    }
}

// Gérer la sélection d'un canal
function onChannelSelect(event) {
    const value = event.target.value;

    if (value === '') {
        selectedChannelIndex = null;
        isCreatingDiffCanal = false;
        setStatus(t("status.no_channel_selected"));
    } else {
        selectedChannelIndex = parseInt(value);
        isCreatingDiffCanal = true;
        const channelLabel = appState.channelConfig[selectedChannelIndex].label;
        setStatus(t("status.channel_selected_click_2_points", {channel: channelLabel}));
    }
}

// Gérer le clic sur le graphique pour créer une diff/canal
function handleDiffCanalClick(event, chart) {

    if (!diffCanalState.active || !isCreatingDiffCanal || selectedChannelIndex === null) {
        return false;
    }


    // Vérifier si le canal sélectionné existe et est visible
    if (!appState.channelConfig[selectedChannelIndex] || !appState.channelConfig[selectedChannelIndex].visible) {
        setStatus(t("status.selected_channel_unavailable"));
        return false;
    }

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convertir les coordonnées pixel en temps
    const timeMs = chart.scales.x.getValueForPixel(x);
    const timeSec = timeMs / 1000;

    // Interpoler la valeur Y sur la courbe du canal sélectionné
    const yValue = interpolateChannelValue(selectedChannelIndex, timeSec);

    if (yValue === null) {
        setStatus(t("status.cannot_interpolate"));
        return false;
    }

    const point = { x: timeSec, y: yValue };

    if (!pendingDiffCanalPoint) {
        // Premier point
        pendingDiffCanalPoint = point;
        setStatus(t("status.point1_placed"));
    } else {
        // Deuxième point - créer l'interval
        const interval = new DiffCanalInterval(
            nextDiffCanalId++,
            selectedChannelIndex,
            pendingDiffCanalPoint,
            point
        );
        diffCanalIntervals.push(interval);

        // Réinitialiser
        pendingDiffCanalPoint = null;
        isCreatingDiffCanal = false;
        selectedChannelIndex = null;
        document.getElementById('diff-canal-channel-select').value = '';

        // Mettre à jour la liste des diff/canal
        updateDiffCanalList();

        setStatus(t("status.diff_canal_created_select_another", {id: interval.id}));
    }

    chart.update('none');
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

    // Les données sont stockées dans 2 arrays séparés :
    // - X values (temps en ms) : chart.data.labels
    // - Y values : dataset.data
    const chart = appState.charts.time;
    const labels = chart.data.labels;  // Temps en ms
    const yData = dataset.data;         // Valeurs Y

    // Convertir timeSec en ms pour comparaison
    const timeMs = timeSec * 1000;

    // Trouver les 2 indices encadrant le temps demandé
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

    // Si on a trouvé les deux indices, interpoler
    if (leftIdx >= 0 && rightIdx >= 0 && leftIdx < yData.length && rightIdx < yData.length) {
        const x1 = parseFloat(labels[leftIdx]);
        const x2 = parseFloat(labels[rightIdx]);
        const y1 = yData[leftIdx];
        const y2 = yData[rightIdx];

        if (x1 === x2) {
            result = y1;
        } else {
            // Interpolation linéaire
            const ratio = (timeMs - x1) / (x2 - x1);
            result = y1 + ratio * (y2 - y1);
        }
    }
    // Si on est avant le premier point
    else if (leftIdx === -1 && rightIdx >= 0 && rightIdx < yData.length) {
        result = yData[rightIdx];
    }
    // Si on est après le dernier point
    else if (leftIdx >= 0 && leftIdx < yData.length && rightIdx === -1) {
        result = yData[leftIdx];
    }
    else {
        return null;
    }

    return result;
}

// Créer une diff/canal depuis les champs de saisie
function createDiffCanalFromInputs() {

    if (selectedChannelIndex === null) {
        setStatus(t("status.please_select_channel"), 'error');
        return;
    }

    const timeStart = parseFloat(document.getElementById('diff-canal-time-start').value);
    const timeEnd = parseFloat(document.getElementById('diff-canal-time-end').value);


    if (isNaN(timeStart) || isNaN(timeEnd)) {
        setStatus(t("status.please_enter_valid_times"), 'error');
        return;
    }

    if (timeStart === timeEnd) {
        setStatus(t("status.times_must_differ"), 'error');
        return;
    }

    // Interpoler les valeurs Y sur le canal
    const y1 = interpolateChannelValue(selectedChannelIndex, timeStart);
    const y2 = interpolateChannelValue(selectedChannelIndex, timeEnd);

    if (y1 === null || y2 === null) {
        setStatus(t("status.cannot_interpolate_values"), 'error');
        return;
    }

    const interval = new DiffCanalInterval(
        nextDiffCanalId++,
        selectedChannelIndex,
        { x: timeStart, y: y1 },
        { x: timeEnd, y: y2 }
    );
    diffCanalIntervals.push(interval);

    // Réinitialiser
    document.getElementById('diff-canal-time-start').value = '';
    document.getElementById('diff-canal-time-end').value = '';
    selectedChannelIndex = null;
    document.getElementById('diff-canal-channel-select').value = '';

    // Mettre à jour la liste
    updateDiffCanalList();

    // Mettre à jour le graphique
    appState.charts.time.update('none');

    setStatus(t("status.diff_canal_created", {id: interval.id}));
}

// Mettre à jour la liste des diff/canal
function updateDiffCanalList() {
    const tbody = document.getElementById('diff-canal-list-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    diffCanalIntervals.forEach(interval => {
        // Première ligne: ID, Canal, Δt, Actions
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border-color)';

        const channelLabel = interval.getChannelLabel();
        const dx = interval.getDeltaX().toFixed(3);
        const dy = interval.getDeltaY().toFixed(2);
        const slope = interval.getSlopeText();

        // Icônes et couleurs (comme dans intervals.js)
        const isVisible = interval.visible !== false;
        const eyeIcon = isVisible ? 'fa-eye' : 'fa-eye-slash';
        const eyeColor = isVisible ? 'var(--accent-green)' : 'var(--text-muted)';

        row.innerHTML = `
            <td style="padding:5px;">${interval.id}</td>
            <td style="padding:5px;">${channelLabel}</td>
            <td style="padding:5px;">${dx} s</td>
            <td style="padding:5px;">
                <button onclick="toggleDiffCanalVisibility(${interval.id})"
                        style="padding:4px 6px; background:none; border:none; color:${eyeColor}; cursor:pointer; font-size:0.9rem;"
                        title="${isVisible ? 'Masquer' : 'Afficher'}">
                    <i class="fas ${eyeIcon}"></i>
                </button>
                <button onclick="deleteDiffCanal(${interval.id})"
                        style="padding:4px 6px; background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:0.9rem;"
                        title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);

        // Deuxième ligne: Champs Tmin et Tmax (disposition verticale)
        const rowEdit = document.createElement('tr');
        rowEdit.style.borderBottom = '1px solid var(--border-color)';

        rowEdit.innerHTML = `
            <td colspan="4" style="padding:8px; background:var(--input-bg);">
                <div style="display:grid; grid-template-columns: auto 70px auto; gap:6px; align-items:center; max-width:250px;">
                    <label style="font-size:0.85rem;">Tmin (s):</label>
                    <input type="number" id="tmin-${interval.id}" step="0.001" value="${interval.point1.x.toFixed(3)}"
                           style="padding:3px 5px; background:var(--bg-color); color:var(--text-color); border:1px solid var(--border-color); border-radius:3px; font-size:0.85rem;">
                    <div></div>

                    <label style="font-size:0.85rem;">Tmax (s):</label>
                    <input type="number" id="tmax-${interval.id}" step="0.001" value="${interval.point2.x.toFixed(3)}"
                           style="padding:3px 5px; background:var(--bg-color); color:var(--text-color); border:1px solid var(--border-color); border-radius:3px; font-size:0.85rem;">
                    <button onclick="applyDiffCanalTimes(${interval.id})"
                            style="padding:4px 6px; background:none; border:none; color:var(--accent-green); cursor:pointer; font-size:0.9rem; grid-row: span 2;"
                            title="Appliquer">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(rowEdit);
    });
}

// Basculer la visibilité d'une diff/canal
function toggleDiffCanalVisibility(id) {
    const interval = diffCanalIntervals.find(i => i.id === id);
    if (interval) {
        interval.visible = !interval.visible;
        updateDiffCanalList();
        appState.charts.time.update('none');
    }
}

// Appliquer les nouveaux temps depuis les champs Tmin/Tmax
function applyDiffCanalTimes(id) {
    const interval = diffCanalIntervals.find(i => i.id === id);
    if (!interval) return;

    // Récupérer les valeurs des champs
    const tminInput = document.getElementById(`tmin-${id}`);
    const tmaxInput = document.getElementById(`tmax-${id}`);

    if (!tminInput || !tmaxInput) return;

    const t1 = parseFloat(tminInput.value);
    const t2 = parseFloat(tmaxInput.value);

    if (isNaN(t1) || isNaN(t2)) {
        alert(t('dialogs.invalid_times'));
        return;
    }

    // Recalculer les valeurs Y avec l'interpolation
    const y1 = interpolateChannelValue(interval.channelIndex, t1);
    const y2 = interpolateChannelValue(interval.channelIndex, t2);

    if (y1 === null || y2 === null) {
        alert('Impossible d\'interpoler les valeurs Y');
        return;
    }

    // Mettre à jour l'intervalle
    interval.point1 = { x: t1, y: y1 };
    interval.point2 = { x: t2, y: y2 };

    updateDiffCanalList();
    appState.charts.time.update('none');
    setStatus(t("status.diff_canal_modified", {id}));
}

// Supprimer une diff/canal
function deleteDiffCanal(id) {
    const index = diffCanalIntervals.findIndex(i => i.id === id);
    if (index !== -1) {
        diffCanalIntervals.splice(index, 1);
        updateDiffCanalList();
        appState.charts.time.update('none');
        setStatus(t("status.diff_canal_deleted", {id}));
    }
}

// Dessiner toutes les diff/canal sur le graphique
function drawDiffCanalIntervals(chart) {

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

    diffCanalIntervals.forEach((interval, index) => {
        if (!interval.visible) {
            return;
        }

        // Vérifier que le canal existe
        if (!appState.channelConfig[interval.channelIndex]) {
            return;
        }

        // Récupérer l'échelle Y du canal (y, y1, y2, etc.)
        const channelConfig = appState.channelConfig[interval.channelIndex];
        const yAxisID = channelConfig.yAxisID || 'y';
        const yScale = chart.scales[yAxisID];

        if (!yScale) {
            return; // Échelle Y non trouvée
        }

        const x1 = chart.scales.x.getPixelForValue(interval.point1.x * 1000);
        const y1 = yScale.getPixelForValue(interval.point1.y);
        const x2 = chart.scales.x.getPixelForValue(interval.point2.x * 1000);
        const y2 = yScale.getPixelForValue(interval.point2.y);

        // Couleur du canal
        const color = channelConfig.color || interval.color;

        // Dessiner les pointillés verticaux
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        // Pointillé vertical point 1
        ctx.beginPath();
        ctx.moveTo(x1, yScale.top);
        ctx.lineTo(x1, yScale.bottom);
        ctx.stroke();

        // Pointillé vertical point 2
        ctx.beginPath();
        ctx.moveTo(x2, yScale.top);
        ctx.lineTo(x2, yScale.bottom);
        ctx.stroke();

        // Pointillés horizontaux
        ctx.beginPath();
        ctx.moveTo(chart.scales.x.left, y1);
        ctx.lineTo(chart.scales.x.right, y1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(chart.scales.x.left, y2);
        ctx.lineTo(chart.scales.x.right, y2);
        ctx.stroke();

        // Dessiner le segment reliant les 2 points
        ctx.setLineDash([]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Dessiner les points
        ctx.fillStyle = color;

        // Point 1
        ctx.beginPath();
        ctx.arc(x1, y1, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Point 2
        ctx.beginPath();
        ctx.arc(x2, y2, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Annotation horizontale (Delta X) - avec offset horizontal personnalisé
        const baseMidX = (x1 + x2) / 2;
        const baseTopY = Math.min(y1, y2) - 20;
        const dxAnnotationX = baseMidX + interval.horizontalLabelOffsetX;
        const dxAnnotationY = baseTopY;
        const dx = interval.getDeltaX();
        const dxText = `Δt = ${dx.toFixed(3)} s`;

        // Mesurer la largeur du texte pour ajuster le rectangle
        ctx.font = `bold ${window.chartFontSize}px sans-serif`;
        const dxTextWidth = ctx.measureText(dxText).width;
        const dxRectWidth = dxTextWidth + 10; // Ajouter 10px de padding
        const dxRectHeight = 20;

        ctx.fillStyle = '#FFD93D';
        ctx.fillRect(dxAnnotationX - dxRectWidth / 2, dxAnnotationY - dxRectHeight / 2, dxRectWidth, dxRectHeight);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(dxAnnotationX - dxRectWidth / 2, dxAnnotationY - dxRectHeight / 2, dxRectWidth, dxRectHeight);

        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dxText, dxAnnotationX, dxAnnotationY);

        // Annotation verticale (Delta Y) - avec offset vertical personnalisé
        const baseMidY = (y1 + y2) / 2;
        const baseLeftX = Math.min(x1, x2) - 20;
        const dyAnnotationX = baseLeftX;
        const dyAnnotationY = baseMidY + interval.verticalLabelOffsetY;
        const dy = interval.getDeltaY();
        const unit = interval.getChannelUnit();
        const dyText = `Δy = ${dy.toFixed(2)} ${unit}`;

        ctx.save();
        ctx.translate(dyAnnotationX, dyAnnotationY);
        ctx.rotate(-Math.PI / 2);

        // Mesurer la largeur du texte pour ajuster le rectangle
        ctx.font = `bold ${window.chartFontSize}px sans-serif`;
        const dyTextWidth = ctx.measureText(dyText).width;
        const rectWidth = dyTextWidth + 10; // Ajouter 10px de padding
        const rectHeight = 20;

        ctx.fillStyle = '#FFD93D';
        ctx.fillRect(-rectWidth / 2, -rectHeight / 2, rectWidth, rectHeight);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-rectWidth / 2, -rectHeight / 2, rectWidth, rectHeight);

        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dyText, 0, 0);

        ctx.restore();

        // Annotation parallèle au segment (pente)
        const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        let angle = Math.atan2(y2 - y1, x2 - x1);

        // Garder l'angle entre -90° et 90° pour éviter le texte à l'envers
        if (angle > Math.PI / 2) {
            angle -= Math.PI;
        } else if (angle < -Math.PI / 2) {
            angle += Math.PI;
        }

        // Position sur le segment (par défaut au milieu, modifiable par drag)
        const labelX = x1 + (x2 - x1) * interval.labelOffset;
        const labelY = y1 + (y2 - y1) * interval.labelOffset;

        ctx.save();
        ctx.translate(labelX, labelY);
        ctx.rotate(angle);

        const slopeText = interval.getSlopeText();
        const textWidth = ctx.measureText(slopeText).width;

        ctx.fillStyle = '#FFD93D';
        ctx.fillRect(-textWidth / 2 - 5, -10, textWidth + 10, 20);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-textWidth / 2 - 5, -10, textWidth + 10, 20);

        ctx.fillStyle = '#000';
        ctx.font = `bold ${window.chartFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(slopeText, 0, 0);

        ctx.restore();
    });

    ctx.restore();
}

// =====================================
// DRAG & DROP DES POINTS
// =====================================

// Détecter si on clique sur un point ou une annotation existante
function handleDiffCanalMouseDown(event, chart) {
    // Permettre le drag des éléments même quand l'outil n'est pas actif
    const rect = chart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Chercher si on clique sur un point ou une annotation
    for (let interval of diffCanalIntervals) {
        if (!interval.visible) continue;

        // Récupérer l'échelle Y du canal
        const channelConfig = appState.channelConfig[interval.channelIndex];
        if (!channelConfig) continue;

        const yAxisID = channelConfig.yAxisID || 'y';
        const yScale = chart.scales[yAxisID];
        if (!yScale) continue;

        const x1 = chart.scales.x.getPixelForValue(interval.point1.x * 1000);
        const y1 = yScale.getPixelForValue(interval.point1.y);
        const x2 = chart.scales.x.getPixelForValue(interval.point2.x * 1000);
        const y2 = yScale.getPixelForValue(interval.point2.y);

        // Rayon de détection (8px pour points, 10px pour annotations)
        const pointHitRadius = 8;
        const labelHitRadius = 10;

        // Check point 1
        const dist1 = Math.sqrt((mouseX - x1) ** 2 + (mouseY - y1) ** 2);
        if (dist1 <= pointHitRadius) {
            diffCanalState.dragging = 'point1';
            diffCanalState.draggedInterval = interval;
            diffCanalState.dragStartX = mouseX;
            diffCanalState.dragStartY = mouseY;
            chart.canvas.style.cursor = 'grab';
            return true;
        }

        // Check point 2
        const dist2 = Math.sqrt((mouseX - x2) ** 2 + (mouseY - y2) ** 2);
        if (dist2 <= pointHitRadius) {
            diffCanalState.dragging = 'point2';
            diffCanalState.draggedInterval = interval;
            diffCanalState.dragStartX = mouseX;
            diffCanalState.dragStartY = mouseY;
            chart.canvas.style.cursor = 'grab';
            return true;
        }

        // Check annotation horizontale (Δt)
        const baseMidX = (x1 + x2) / 2;
        const baseTopY = Math.min(y1, y2) - 20;
        const dxAnnotationX = baseMidX + interval.horizontalLabelOffsetX;
        const dxAnnotationY = baseTopY;

        // Mesurer la taille de l'annotation horizontale
        const ctx = chart.ctx;
        ctx.font = `bold ${window.chartFontSize}px sans-serif`;
        const dx = interval.getDeltaX();
        const dxText = `Δt = ${dx.toFixed(3)} s`;
        const dxTextWidth = ctx.measureText(dxText).width;
        const dxRectWidth = dxTextWidth + 10;
        const dxRectHeight = 20;

        if (mouseX >= dxAnnotationX - dxRectWidth / 2 - labelHitRadius &&
            mouseX <= dxAnnotationX + dxRectWidth / 2 + labelHitRadius &&
            mouseY >= dxAnnotationY - dxRectHeight / 2 - labelHitRadius &&
            mouseY <= dxAnnotationY + dxRectHeight / 2 + labelHitRadius) {
            diffCanalState.dragging = 'horizontal-label';
            diffCanalState.draggedInterval = interval;
            diffCanalState.dragStartX = mouseX;
            diffCanalState.dragStartY = mouseY;
            chart.canvas.style.cursor = 'ew-resize';
            return true;
        }

        // Check annotation verticale (Δy)
        const baseMidY = (y1 + y2) / 2;
        const baseLeftX = Math.min(x1, x2) - 20;
        const dyAnnotationX = baseLeftX;
        const dyAnnotationY = baseMidY + interval.verticalLabelOffsetY;

        // Mesurer la taille de l'annotation verticale (rotation -90°)
        const dy = interval.getDeltaY();
        const unit = interval.getChannelUnit();
        const dyText = `Δy = ${dy.toFixed(2)} ${unit}`;
        const dyTextWidth = ctx.measureText(dyText).width;
        const dyRectWidth = dyTextWidth + 10;
        const dyRectHeight = 20;

        // Zone de détection pour annotation verticale (rotation -90°)
        if (mouseX >= dyAnnotationX - dyRectHeight / 2 - labelHitRadius &&
            mouseX <= dyAnnotationX + dyRectHeight / 2 + labelHitRadius &&
            mouseY >= dyAnnotationY - dyRectWidth / 2 - labelHitRadius &&
            mouseY <= dyAnnotationY + dyRectWidth / 2 + labelHitRadius) {
            diffCanalState.dragging = 'vertical-label';
            diffCanalState.draggedInterval = interval;
            diffCanalState.dragStartX = mouseX;
            diffCanalState.dragStartY = mouseY;
            chart.canvas.style.cursor = 'ns-resize';
            return true;
        }

        // Check annotation diagonale (pente)
        const labelX = x1 + (x2 - x1) * interval.labelOffset;
        const labelY = y1 + (y2 - y1) * interval.labelOffset;

        const slopeText = interval.getSlopeText();
        const slopeTextWidth = ctx.measureText(slopeText).width;
        const slopeRectWidth = slopeTextWidth + 10;
        const slopeRectHeight = 20;

        // Zone de détection pour annotation diagonale (approximation rectangulaire)
        const distToLabel = Math.sqrt((mouseX - labelX) ** 2 + (mouseY - labelY) ** 2);
        if (distToLabel <= Math.max(slopeRectWidth, slopeRectHeight) / 2 + labelHitRadius) {
            diffCanalState.dragging = 'diagonal-label';
            diffCanalState.draggedInterval = interval;
            diffCanalState.dragStartX = mouseX;
            diffCanalState.dragStartY = mouseY;
            chart.canvas.style.cursor = 'move';
            return true;
        }
    }

    return false;
}

// Déplacer le point ou l'annotation en cours de drag
function handleDiffCanalMouseMove(event, chart) {
    if (!diffCanalState.dragging || !diffCanalState.draggedInterval) {
        // Changer le curseur si on survole un point ou une annotation (même si outil inactif)
        const rect = chart.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        for (let interval of diffCanalIntervals) {
                if (!interval.visible) continue;

                // Récupérer l'échelle Y du canal
                const channelConfig = appState.channelConfig[interval.channelIndex];
                if (!channelConfig) continue;

                const yAxisID = channelConfig.yAxisID || 'y';
                const yScale = chart.scales[yAxisID];
                if (!yScale) continue;

                const x1 = chart.scales.x.getPixelForValue(interval.point1.x * 1000);
                const y1 = yScale.getPixelForValue(interval.point1.y);
                const x2 = chart.scales.x.getPixelForValue(interval.point2.x * 1000);
                const y2 = yScale.getPixelForValue(interval.point2.y);

                const hitRadius = 8;
                const dist1 = Math.sqrt((mouseX - x1) ** 2 + (mouseY - y1) ** 2);
                const dist2 = Math.sqrt((mouseX - x2) ** 2 + (mouseY - y2) ** 2);

                if (dist1 <= hitRadius || dist2 <= hitRadius) {
                    chart.canvas.style.cursor = 'pointer';
                    return false;
                }

                // Check annotations pour changer le curseur
                const baseMidX = (x1 + x2) / 2;
                const baseTopY = Math.min(y1, y2) - 20;
                const dxAnnotationX = baseMidX + interval.horizontalLabelOffsetX;
                const dxAnnotationY = baseTopY;

                const ctx = chart.ctx;
                ctx.font = `bold ${window.chartFontSize}px sans-serif`;
                const dx = interval.getDeltaX();
                const dxText = `Δt = ${dx.toFixed(3)} s`;
                const dxTextWidth = ctx.measureText(dxText).width;
                const dxRectWidth = dxTextWidth + 10;
                const dxRectHeight = 20;

                if (mouseX >= dxAnnotationX - dxRectWidth / 2 - 10 &&
                    mouseX <= dxAnnotationX + dxRectWidth / 2 + 10 &&
                    mouseY >= dxAnnotationY - dxRectHeight / 2 - 10 &&
                    mouseY <= dxAnnotationY + dxRectHeight / 2 + 10) {
                    chart.canvas.style.cursor = 'ew-resize';
                    return false;
                }

                // Check annotation verticale
                const baseMidY = (y1 + y2) / 2;
                const baseLeftX = Math.min(x1, x2) - 20;
                const dyAnnotationX = baseLeftX;
                const dyAnnotationY = baseMidY + interval.verticalLabelOffsetY;

                const dy = interval.getDeltaY();
                const unit = interval.getChannelUnit();
                const dyText = `Δy = ${dy.toFixed(2)} ${unit}`;
                const dyTextWidth = ctx.measureText(dyText).width;
                const dyRectWidth = dyTextWidth + 10;
                const dyRectHeight = 20;

                if (mouseX >= dyAnnotationX - dyRectHeight / 2 - 10 &&
                    mouseX <= dyAnnotationX + dyRectHeight / 2 + 10 &&
                    mouseY >= dyAnnotationY - dyRectWidth / 2 - 10 &&
                    mouseY <= dyAnnotationY + dyRectWidth / 2 + 10) {
                    chart.canvas.style.cursor = 'ns-resize';
                    return false;
                }

                // Check annotation diagonale
                const labelX = x1 + (x2 - x1) * interval.labelOffset;
                const labelY = y1 + (y2 - y1) * interval.labelOffset;

                const slopeText = interval.getSlopeText();
                const slopeTextWidth = ctx.measureText(slopeText).width;
                const slopeRectWidth = slopeTextWidth + 10;
                const slopeRectHeight = 20;

                const distToLabel = Math.sqrt((mouseX - labelX) ** 2 + (mouseY - labelY) ** 2);
                if (distToLabel <= Math.max(slopeRectWidth, slopeRectHeight) / 2 + 10) {
                    chart.canvas.style.cursor = 'move';
                    return false;
                }
            }
            chart.canvas.style.cursor = 'crosshair';
        return false;
    }

    // On est en train de drag
    const rect = chart.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const interval = diffCanalState.draggedInterval;

    // Gestion selon le type de drag
    if (diffCanalState.dragging === 'point1' || diffCanalState.dragging === 'point2') {
        // Drag d'un point d'ancrage
        chart.canvas.style.cursor = 'grabbing';

        // Convertir en temps (ms puis sec)
        const timeMs = chart.scales.x.getValueForPixel(mouseX);
        const timeSec = timeMs / 1000;

        // Interpoler la nouvelle valeur Y
        const yValue = interpolateChannelValue(interval.channelIndex, timeSec);

        if (yValue === null) return false;

        // Mettre à jour le point
        if (diffCanalState.dragging === 'point1') {
            interval.point1 = { x: timeSec, y: yValue };
        } else if (diffCanalState.dragging === 'point2') {
            interval.point2 = { x: timeSec, y: yValue };
        }

        // Rafraîchir
        updateDiffCanalList();
        chart.update('none');
        return true;

    } else if (diffCanalState.dragging === 'horizontal-label') {
        // Drag de l'annotation horizontale (Δt) - seulement horizontalement
        chart.canvas.style.cursor = 'ew-resize';

        const deltaX = mouseX - diffCanalState.dragStartX;
        interval.horizontalLabelOffsetX += deltaX;

        diffCanalState.dragStartX = mouseX;

        chart.update('none');
        return true;

    } else if (diffCanalState.dragging === 'vertical-label') {
        // Drag de l'annotation verticale (Δy) - seulement verticalement
        chart.canvas.style.cursor = 'ns-resize';

        const deltaY = mouseY - diffCanalState.dragStartY;
        interval.verticalLabelOffsetY += deltaY;

        diffCanalState.dragStartY = mouseY;

        chart.update('none');
        return true;

    } else if (diffCanalState.dragging === 'diagonal-label') {
        // Drag de l'annotation diagonale (pente) - le long de la ligne
        chart.canvas.style.cursor = 'move';

        const channelConfig = appState.channelConfig[interval.channelIndex];
        if (!channelConfig) return false;

        const yAxisID = channelConfig.yAxisID || 'y';
        const yScale = chart.scales[yAxisID];
        if (!yScale) return false;

        const x1 = chart.scales.x.getPixelForValue(interval.point1.x * 1000);
        const y1 = yScale.getPixelForValue(interval.point1.y);
        const x2 = chart.scales.x.getPixelForValue(interval.point2.x * 1000);
        const y2 = yScale.getPixelForValue(interval.point2.y);

        // Calculer la projection de la souris sur le segment
        const dx = x2 - x1;
        const dy = y2 - y1;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);

        if (segmentLength === 0) return false;

        // Vecteur normalisé du segment
        const nx = dx / segmentLength;
        const ny = dy / segmentLength;

        // Vecteur de point1 à la souris
        const mx = mouseX - x1;
        const my = mouseY - y1;

        // Projection sur le segment (produit scalaire)
        const projection = mx * nx + my * ny;

        // Calculer l'offset (0 à 1)
        const newOffset = Math.max(0, Math.min(1, projection / segmentLength));
        interval.labelOffset = newOffset;

        chart.update('none');
        return true;
    }

    return false;
}

// Terminer le drag
function handleDiffCanalMouseUp(event, chart) {
    if (diffCanalState.dragging && diffCanalState.draggedInterval) {
        const dragType = diffCanalState.dragging;

        diffCanalState.dragging = null;
        diffCanalState.draggedInterval = null;
        diffCanalState.dragStartX = 0;
        diffCanalState.dragStartY = 0;
        chart.canvas.style.cursor = 'crosshair';

        if (dragType === 'point1' || dragType === 'point2') {
            setStatus(t("status.point_modified"));
        } else if (dragType === 'horizontal-label') {
            setStatus(t("status.horizontal_annotation_repositioned"));
        } else if (dragType === 'vertical-label') {
            setStatus(t("status.vertical_annotation_repositioned"));
        } else if (dragType === 'diagonal-label') {
            setStatus(t("status.diagonal_annotation_repositioned"));
        }

        return true;
    }
    return false;
}
