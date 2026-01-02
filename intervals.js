// ===========================
// SYSTÈME D'INTERVALLES
// Permet de mesurer et annoter des intervalles de temps
// ===========================

// Variables globales
let intervals = [];
let isCreatingInterval = false;
let pendingIntervalData = null;
let nextIntervalId = 1;

// État du drag d'intervalle
let intervalDragState = {
    active: false,
    interval: null,
    dragType: null, // 'start', 'end', 'height'
    initialMouseY: 0
};

// Classe Interval
class Interval {
    constructor(id, startTime, endTime, comment = '', yPosition = 0.5) {
        this.id = id;
        this.startTime = startTime; // en secondes
        this.endTime = endTime; // en secondes
        this.comment = comment;
        this.yPosition = yPosition; // Position verticale relative (0-1), 0.5 = milieu
        this.color = '#4ECDC4'; // Couleur par défaut
        this.visible = true;
        // Propriétés de formatage du texte
        this.fontSize = 11; // Taille de police en pixels
        this.fontWeight = 'normal'; // 'normal' ou 'bold'
        this.fontStyle = 'normal'; // 'normal' ou 'italic'
        this.textDecoration = 'none'; // 'none' ou 'underline'
    }

    // Calculer la durée de l'intervalle
    getDuration() {
        return Math.abs(this.endTime - this.startTime);
    }

    // Obtenir le temps de début (le plus petit)
    getStartTime() {
        return Math.min(this.startTime, this.endTime);
    }

    // Obtenir le temps de fin (le plus grand)
    getEndTime() {
        return Math.max(this.startTime, this.endTime);
    }

    // Obtenir la position Y en pixels pour le trait horizontal
    getYPixelPosition(chart) {
        if (!chart || !chart.scales || !chart.scales.y) return 0;

        const yScale = chart.scales.y;
        const yMin = yScale.min;
        const yMax = yScale.max;

        // Calculer la valeur Y basée sur yPosition (0-1)
        const yValue = yMin + (yMax - yMin) * this.yPosition;

        return yScale.getPixelForValue(yValue);
    }
}

// Nouveau système : Le bouton principal active/désactive le mode ET gère l'accordéon
function toggleIntervalTool() {
    const content = document.getElementById('interval-content');
    const icon = document.getElementById('interval-accordion-icon');
    const btn = document.getElementById('btn-interval-main');

    // Si on active l'outil
    if (!isCreatingInterval) {
        // Désactiver les autres outils AVANT de modifier les accordéons
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('interval');
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

        // Fermer les autres sous-accordéons dans Outils
        if (typeof closeOtherToolAccordions === 'function') {
            closeOtherToolAccordions('interval');
        }

        // Ouvrir l'accordéon Interval
        if (content) content.style.display = 'block';
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }

        // Activer le mode
        isCreatingInterval = true;
        pendingIntervalData = null;
        if (btn) {
            btn.style.background = 'var(--accent-green)';
            btn.style.boxShadow = '0 0 10px var(--accent-green)';
        }
        setStatus('Mode Interval activé : Cliquez 2 points pour définir l\'intervalle', 'info');

    } else {
        // Désactiver le mode
        isCreatingInterval = false;
        pendingIntervalData = null;
        if (btn) {
            btn.style.background = 'var(--accent-blue)';
            btn.style.boxShadow = '';
        }

        // Fermer l'accordéon quand l'outil est désactivé
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }

        setStatus('Mode Interval désactivé - Vous pouvez maintenant déplacer les curseurs', 'info');
    }
}

// Fonction legacy pour compatibilité
function activateIntervalMode() {
    toggleIntervalTool();
}

// Fonction legacy pour compatibilité
function toggleIntervalAccordion() {
    toggleIntervalTool();
}

// Fonction legacy pour compatibilité (redirige vers activateIntervalMode)
function toggleIntervalMode() {
    activateIntervalMode();
}

// Gérer le clic sur le canvas pour créer un intervalle
function handleIntervalClick(event, chart) {
    if (!isCreatingInterval) return false;

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const xScale = chart.scales.x;
    const yScale = chart.scales.y;

    const timeValue = xScale.getValueForPixel(x) / 1000; // Conversion ms → s
    const yValue = yScale.getValueForPixel(y);

    // Calculer yPosition relatif (0-1)
    const yMin = yScale.min;
    const yMax = yScale.max;
    const yPosition = (yValue - yMin) / (yMax - yMin);

    if (!pendingIntervalData) {
        // Premier clic : définir le début de l'intervalle
        pendingIntervalData = {
            startTime: timeValue,
            yPosition: yPosition
        };
        setStatus(`Premier point : ${timeValue.toFixed(3)}s - Cliquez un 2ème point`, 'info');
    } else {
        // Deuxième clic : définir la fin et créer l'intervalle
        const startTime = pendingIntervalData.startTime;
        const endTime = timeValue;
        const yPos = pendingIntervalData.yPosition;

        // Créer l'intervalle
        createInterval(startTime, endTime, '', yPos);

        // Réinitialiser
        pendingIntervalData = null;

        // Désactiver automatiquement le mode Interval pour éviter de créer un second intervalle
        if (isCreatingInterval) {
            activateIntervalMode(); // Toggle pour désactiver
        }

        // Demander un commentaire
        setTimeout(() => {
            openIntervalCommentModal(intervals[intervals.length - 1]);
        }, 100);
    }

    return true; // Le clic a été géré
}

// Créer un nouvel intervalle
function createInterval(startTime, endTime, comment = '', yPosition = 0.5) {
    const id = `interval-${nextIntervalId++}`;
    const interval = new Interval(id, startTime, endTime, comment, yPosition);

    intervals.push(interval);

    // Sauvegarder l'état pour l'historique
    if (typeof saveState === 'function') {
        saveState('Création interval');
    }

    // Mettre à jour l'affichage
    updateIntervalsDisplay();

    // Sauvegarder dans le stockage
    saveIntervals();

    const duration = interval.getDuration();
    setStatus(`Interval créé : ${duration.toFixed(3)}s`, 'success');

    return interval;
}

// Mettre à jour l'affichage de tous les intervalles
function updateIntervalsDisplay() {
    const chart = appState.charts?.time;
    if (!chart) return;

    // Forcer le redessin du chart pour afficher les intervalles
    if (chart.update) {
        chart.update('none');
    }

    // Mettre à jour la liste des intervalles
    updateIntervalsList();
}

// Dessiner les intervalles sur le canvas (appelé par Chart.js plugin)
function drawIntervals(chart) {
    if (!chart || intervals.length === 0) return;

    const ctx = chart.ctx;
    const xScale = chart.scales.x;

    ctx.save();

    // Clip to chart area to prevent overlap with axes
    const chartArea = chart.chartArea;
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.clip();

    intervals.forEach(interval => {
        if (!interval.visible) return;

        const startX = xScale.getPixelForValue(interval.getStartTime() * 1000);
        const endX = xScale.getPixelForValue(interval.getEndTime() * 1000);
        const y = interval.getYPixelPosition(chart);

        // Dessiner les deux curseurs verticaux (pointillés)
        ctx.strokeStyle = interval.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Pointillés

        // Curseur gauche
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, chart.height);
        ctx.stroke();

        // Curseur droit
        ctx.beginPath();
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, chart.height);
        ctx.stroke();

        // Ligne horizontale avec flèches
        ctx.setLineDash([]); // Ligne pleine
        ctx.lineWidth = 2;

        // Ligne horizontale
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        // Flèches aux extrémités
        const arrowSize = 8;

        // Flèche gauche (pointant vers la droite)
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + arrowSize, y - arrowSize / 2);
        ctx.lineTo(startX + arrowSize, y + arrowSize / 2);
        ctx.closePath();
        ctx.fillStyle = interval.color;
        ctx.fill();

        // Flèche droite (pointant vers la gauche)
        ctx.beginPath();
        ctx.moveTo(endX, y);
        ctx.lineTo(endX - arrowSize, y - arrowSize / 2);
        ctx.lineTo(endX - arrowSize, y + arrowSize / 2);
        ctx.closePath();
        ctx.fill();

        // Afficher la durée au milieu
        const duration = interval.getDuration();
        const centerX = (startX + endX) / 2;
        const text = `Δt = ${duration.toFixed(3)}s`;

        // Police bold sans-serif comme diff/canal
        ctx.font = `bold ${window.chartFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Mesurer le texte
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const rectWidth = textWidth + 10; // 5px padding de chaque côté
        const rectHeight = 20; // Hauteur fixe comme diff/canal

        // Fond jaune
        ctx.fillStyle = '#FFD93D';
        ctx.fillRect(centerX - rectWidth / 2, y - 18 - rectHeight / 2, rectWidth, rectHeight);

        // Encadrement noir
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - rectWidth / 2, y - 18 - rectHeight / 2, rectWidth, rectHeight);

        // Texte noir centré
        ctx.fillStyle = '#000';
        ctx.fillText(text, centerX, y - 18);

        // Afficher le commentaire si présent
        if (interval.comment && interval.comment.trim() !== '') {
            const commentText = interval.comment;

            // Utiliser la taille de police globale avec bold et sans-serif
            const fontSize = window.chartFontSize;
            const fontWeight = interval.fontWeight || 'bold'; // Par défaut bold
            const fontStyle = interval.fontStyle || 'normal';

            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const commentMetrics = ctx.measureText(commentText);
            const commentWidth = commentMetrics.width;
            const commentRectWidth = commentWidth + 10; // 5px padding de chaque côté
            const commentRectHeight = 20; // Hauteur fixe

            // Fond jaune
            ctx.fillStyle = '#FFD93D';
            ctx.fillRect(centerX - commentRectWidth / 2, y + 8, commentRectWidth, commentRectHeight);

            // Encadrement noir
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(centerX - commentRectWidth / 2, y + 8, commentRectWidth, commentRectHeight);

            // Texte noir centré
            ctx.fillStyle = '#000';
            ctx.fillText(commentText, centerX, y + 8 + commentRectHeight / 2);

            // Appliquer le soulignement si nécessaire
            if (interval.textDecoration === 'underline') {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(centerX - commentWidth / 2, y + 8 + commentRectHeight / 2 + fontSize / 2 + 1);
                ctx.lineTo(centerX + commentWidth / 2, y + 8 + commentRectHeight / 2 + fontSize / 2 + 1);
                ctx.stroke();
            }
        }
    });

    ctx.restore();
}

// Ouvrir la modale de commentaire pour un intervalle (legacy - utilisé après création)
function openIntervalCommentModal(interval) {
    const comment = prompt(`Commentaire pour cet intervalle (${interval.getDuration().toFixed(3)}s):`, interval.comment || '');

    if (comment !== null) {
        interval.comment = comment;
        updateIntervalsDisplay();
        saveIntervals();
    }
}

// --- SYSTÈME DE MODALE D'ÉDITION D'INTERVALLE ---

// État de la modale
let currentEditingInterval = null;

// Ouvrir la modale d'édition complète d'un intervalle
function openIntervalEditModal(interval) {
    if (!interval) return;

    currentEditingInterval = interval;

    // Récupérer les éléments de la modale
    const modal = document.getElementById('interval-edit-modal');
    const colorPicker = document.getElementById('interval-color-picker-btn');
    const commentInput = document.getElementById('interval-comment-input');
    const infoTimes = document.getElementById('interval-info-times');
    const infoDuration = document.getElementById('interval-info-duration');
    const fmtBold = document.getElementById('int-fmt-bold');
    const fmtItalic = document.getElementById('int-fmt-italic');
    const fmtUnderline = document.getElementById('int-fmt-underline');
    const fmtSize = document.getElementById('int-fmt-size');

    if (!modal) return;

    // Remplir les valeurs
    if (colorPicker) {
        const color = interval.color || '#4ECDC4';
        colorPicker.dataset.colorValue = color;
        colorPicker.style.backgroundColor = color;
    }
    if (commentInput) commentInput.value = interval.comment || '';

    // Afficher les infos de temps
    const startTime = interval.getStartTime();
    const endTime = interval.getEndTime();
    const duration = interval.getDuration();

    if (infoTimes) infoTimes.textContent = `${startTime.toFixed(3)}s → ${endTime.toFixed(3)}s`;
    if (infoDuration) infoDuration.textContent = `${duration.toFixed(3)}s`;

    // Remplir les champs T start, T end, Hauteur %
    const startInput = document.getElementById('interval-start-input');
    const endInput = document.getElementById('interval-end-input');
    const heightInput = document.getElementById('interval-height-input');

    if (startInput) startInput.value = startTime.toFixed(3);
    if (endInput) endInput.value = endTime.toFixed(3);
    if (heightInput) heightInput.value = (interval.yPosition * 100).toFixed(0);

    // Appliquer l'état des boutons de formatage
    if (fmtBold) {
        fmtBold.style.background = interval.fontWeight === 'bold' ? 'var(--accent-green)' : 'var(--bg-secondary)';
    }
    if (fmtItalic) {
        fmtItalic.style.background = interval.fontStyle === 'italic' ? 'var(--accent-green)' : 'var(--bg-secondary)';
    }
    if (fmtUnderline) {
        fmtUnderline.style.background = interval.textDecoration === 'underline' ? 'var(--accent-green)' : 'var(--bg-secondary)';
    }
    if (fmtSize) {
        fmtSize.value = interval.fontSize || '11';
    }

    // Afficher la modale
    modal.style.display = 'flex';

    // Setup drag après affichage
    setupIntervalModalDrag();
}

// Fermer la modale d'édition
function closeIntervalEditModal() {
    const modal = document.getElementById('interval-edit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingInterval = null;
}

// Mettre à jour la couleur depuis le picker (appelée par le callback)
function updateIntervalColorFromPicker(color) {
    if (currentEditingInterval) {
        currentEditingInterval.color = color;
        currentEditingInterval.draw();
    }
}

// Confirmer l'édition de l'intervalle
function confirmIntervalEdit() {
    if (!currentEditingInterval) return;

    const colorPicker = document.getElementById('interval-color-picker-btn');
    const commentInput = document.getElementById('interval-comment-input');
    const fmtSize = document.getElementById('int-fmt-size');

    // Appliquer les modifications
    if (colorPicker) currentEditingInterval.color = colorPicker.dataset.colorValue;
    if (commentInput) currentEditingInterval.comment = commentInput.value;
    if (fmtSize) currentEditingInterval.fontSize = parseInt(fmtSize.value) || 11;

    // Sauvegarder l'état pour l'historique
    if (typeof saveState === 'function') {
        saveState('Modification interval');
    }

    // Mettre à jour l'affichage
    updateIntervalsDisplay();
    saveIntervals();

    // Fermer la modale
    closeIntervalEditModal();

    setStatus('Intervalle modifié', 'success');
}

// Toggle formatage (gras, italique, souligné)
function toggleIntervalFormat(type) {
    if (!currentEditingInterval) return;

    const fmtBold = document.getElementById('int-fmt-bold');
    const fmtItalic = document.getElementById('int-fmt-italic');
    const fmtUnderline = document.getElementById('int-fmt-underline');

    switch(type) {
        case 'bold':
            currentEditingInterval.fontWeight = currentEditingInterval.fontWeight === 'bold' ? 'normal' : 'bold';
            if (fmtBold) {
                fmtBold.style.background = currentEditingInterval.fontWeight === 'bold' ? 'var(--accent-green)' : 'var(--bg-secondary)';
            }
            break;

        case 'italic':
            currentEditingInterval.fontStyle = currentEditingInterval.fontStyle === 'italic' ? 'normal' : 'italic';
            if (fmtItalic) {
                fmtItalic.style.background = currentEditingInterval.fontStyle === 'italic' ? 'var(--accent-green)' : 'var(--bg-secondary)';
            }
            break;

        case 'underline':
            currentEditingInterval.textDecoration = currentEditingInterval.textDecoration === 'underline' ? 'none' : 'underline';
            if (fmtUnderline) {
                fmtUnderline.style.background = currentEditingInterval.textDecoration === 'underline' ? 'var(--accent-green)' : 'var(--bg-secondary)';
            }
            break;
    }
}

// Changer la taille de police
function setIntervalFontSize(size) {
    if (!currentEditingInterval) return;
    currentEditingInterval.fontSize = parseInt(size) || 11;
}

// Rendre la modale draggable par son header
function setupIntervalModalDrag() {
    const modal = document.getElementById('interval-modal-content');
    const header = document.getElementById('interval-modal-header');

    if (!modal || !header) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        initialX = e.clientX - (parseInt(modal.style.left) || 0);
        initialY = e.clientY - (parseInt(modal.style.top) || 0);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        modal.style.left = currentX + 'px';
        modal.style.top = currentY + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Mettre à jour la liste des intervalles dans le panneau latéral
function updateIntervalsList() {
    const listContainer = document.getElementById('intervals-list');
    if (!listContainer) return;

    if (intervals.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.8rem; font-style:italic;">
                Aucun intervalle
            </div>
        `;
        return;
    }

    let html = '';
    intervals.forEach((interval, index) => {
        const duration = interval.getDuration();
        const startTime = interval.getStartTime();
        const endTime = interval.getEndTime();

        const label = `Interval ${index + 1}`;
        const timeInfo = `${startTime.toFixed(3)}s → ${endTime.toFixed(3)}s (Δt = ${duration.toFixed(3)}s)`;
        const commentInfo = interval.comment ? interval.comment : 'Sans commentaire';

        const isVisible = interval.visible !== false;
        const eyeIcon = isVisible ? 'fa-eye' : 'fa-eye-slash';
        const eyeColor = isVisible ? 'var(--accent-green)' : 'var(--text-muted)';

        html += `
            <div style="padding:8px; margin-bottom:6px; background:var(--bg-secondary); border-radius:4px; border-left:3px solid ${interval.color}; font-size:0.75rem;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                    <span style="color:${interval.color}; font-weight:bold;"><i class="fas fa-arrows-alt-h"></i> ${label}</span>
                    <span style="flex:1;"></span>
                    <button onclick="toggleIntervalVisibility('${interval.id}')"
                            style="padding:4px 6px; background:none; border:none; color:${eyeColor}; cursor:pointer; font-size:0.9rem;"
                            title="${isVisible ? 'Masquer' : 'Afficher'}">
                        <i class="fas ${eyeIcon}"></i>
                    </button>
                    <button onclick="editIntervalComment('${interval.id}')"
                            style="padding:4px 6px; background:none; border:none; color:var(--accent-blue); cursor:pointer; font-size:0.9rem;"
                            title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteInterval('${interval.id}')"
                            style="padding:4px 6px; background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:0.9rem;"
                            title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div style="color:var(--text-main); margin-bottom:2px;">${timeInfo}</div>
                <div style="color:var(--text-muted); font-style:italic; margin-bottom:6px;">${commentInfo}</div>

                <!-- Champs de saisie T start, T end, Hauteur % -->
                <div style="display:flex; gap:8px; margin-top:6px; font-size:0.75rem;">
                    <div style="flex:1;">
                        <label style="color:var(--text-muted); display:block; margin-bottom:2px; font-size:0.7rem;">T start (s)</label>
                        <input type="number" step="0.001" value="${startTime.toFixed(3)}"
                               onchange="updateIntervalTime('${interval.id}', 'start', this.value)"
                               style="width:100%; padding:4px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:3px; color:var(--text-main); font-size:0.75rem;">
                    </div>
                    <div style="flex:1;">
                        <label style="color:var(--text-muted); display:block; margin-bottom:2px; font-size:0.7rem;">T end (s)</label>
                        <input type="number" step="0.001" value="${endTime.toFixed(3)}"
                               onchange="updateIntervalTime('${interval.id}', 'end', this.value)"
                               style="width:100%; padding:4px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:3px; color:var(--text-main); font-size:0.75rem;">
                    </div>
                    <div style="flex:1;">
                        <label style="color:var(--text-muted); display:block; margin-bottom:2px; font-size:0.7rem;">Hauteur (%)</label>
                        <input type="number" step="1" min="0" max="100" value="${(interval.yPosition * 100).toFixed(0)}"
                               onchange="updateIntervalHeight('${interval.id}', this.value)"
                               style="width:100%; padding:4px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:3px; color:var(--text-main); font-size:0.75rem;">
                    </div>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// Basculer la visibilité d'un intervalle
function toggleIntervalVisibility(intervalId) {
    const interval = intervals.find(int => int.id === intervalId);
    if (!interval) return;

    interval.visible = !interval.visible;
    updateIntervalsDisplay();
    saveIntervals();
}

// Éditer un intervalle (ouvre la modale complète)
function editIntervalComment(intervalId) {
    const interval = intervals.find(int => int.id === intervalId);
    if (!interval) return;

    openIntervalEditModal(interval);
}

// Supprimer un intervalle
function deleteInterval(intervalId) {
    const interval = intervals.find(int => int.id === intervalId);
    if (!interval) return;

    // Suppression directe sans confirmation
    // Sauvegarder l'état pour l'historique
    if (typeof saveState === 'function') {
        saveState('Suppression interval');
    }

    const index = intervals.indexOf(interval);
    if (index > -1) {
        intervals.splice(index, 1);
    }

    updateIntervalsDisplay();
    saveIntervals();
}

// Mettre à jour le temps d'un intervalle (start ou end)
function updateIntervalTime(intervalId, type, value) {
    const interval = intervals.find(int => int.id === intervalId);
    if (!interval) return;

    const newTime = parseFloat(value);
    if (isNaN(newTime)) return;

    // Sauvegarder l'état pour l'historique
    if (typeof saveState === 'function') {
        saveState('Modification temps interval');
    }

    if (type === 'start') {
        interval.startTime = newTime;
    } else if (type === 'end') {
        interval.endTime = newTime;
    }

    // Mettre à jour l'affichage et sauvegarder
    updateIntervalsDisplay();
    saveIntervals();

    // Si la modale est ouverte pour cet interval, mettre à jour ses champs aussi
    if (currentEditingInterval && currentEditingInterval.id === intervalId) {
        updateModalFields(interval);
    }
}

// Mettre à jour la hauteur d'un intervalle
function updateIntervalHeight(intervalId, value) {
    const interval = intervals.find(int => int.id === intervalId);
    if (!interval) return;

    const heightPercent = parseFloat(value);
    if (isNaN(heightPercent)) return;

    // Convertir le pourcentage en position (0-1)
    const yPosition = Math.max(0, Math.min(100, heightPercent)) / 100;

    // Sauvegarder l'état pour l'historique
    if (typeof saveState === 'function') {
        saveState('Modification hauteur interval');
    }

    interval.yPosition = yPosition;

    // Mettre à jour l'affichage et sauvegarder
    updateIntervalsDisplay();
    saveIntervals();

    // Si la modale est ouverte pour cet interval, mettre à jour ses champs aussi
    if (currentEditingInterval && currentEditingInterval.id === intervalId) {
        updateModalFields(interval);
    }
}

// Mettre à jour les champs de la modale (appelé quand on modifie depuis la liste)
function updateModalFields(interval) {
    const startInput = document.getElementById('interval-start-input');
    const endInput = document.getElementById('interval-end-input');
    const heightInput = document.getElementById('interval-height-input');
    const infoTimes = document.getElementById('interval-info-times');
    const infoDuration = document.getElementById('interval-info-duration');

    if (startInput) startInput.value = interval.getStartTime().toFixed(3);
    if (endInput) endInput.value = interval.getEndTime().toFixed(3);
    if (heightInput) heightInput.value = (interval.yPosition * 100).toFixed(0);

    // Mettre à jour aussi les infos affichées
    if (infoTimes) infoTimes.textContent = `${interval.getStartTime().toFixed(3)}s → ${interval.getEndTime().toFixed(3)}s`;
    if (infoDuration) infoDuration.textContent = `${interval.getDuration().toFixed(3)}s`;
}

// Mettre à jour l'interval depuis les champs de la modale
function updateIntervalFromModal(type, value) {
    if (!currentEditingInterval) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    // Sauvegarder l'état pour l'historique
    if (typeof saveState === 'function') {
        saveState('Modification interval depuis modale');
    }

    if (type === 'start') {
        currentEditingInterval.startTime = numValue;
    } else if (type === 'end') {
        currentEditingInterval.endTime = numValue;
    } else if (type === 'height') {
        const yPosition = Math.max(0, Math.min(100, numValue)) / 100;
        currentEditingInterval.yPosition = yPosition;
    }

    // Mettre à jour les infos affichées dans la modale
    const infoTimes = document.getElementById('interval-info-times');
    const infoDuration = document.getElementById('interval-info-duration');
    if (infoTimes) infoTimes.textContent = `${currentEditingInterval.getStartTime().toFixed(3)}s → ${currentEditingInterval.getEndTime().toFixed(3)}s`;
    if (infoDuration) infoDuration.textContent = `${currentEditingInterval.getDuration().toFixed(3)}s`;

    // Mettre à jour l'affichage du chart et de la liste
    updateIntervalsDisplay();
    saveIntervals();
}

// Effacer tous les intervalles (utilisé lors du chargement d'un nouveau fichier)
function clearAllIntervals() {
    intervals = [];
    pendingIntervalData = null;
    isCreatingInterval = false;

    // Réinitialiser le bouton si nécessaire
    const btn = document.getElementById('btn-interval-main');
    if (btn) {
        btn.style.background = 'var(--accent-blue)';
        btn.style.boxShadow = '';
    }

    // Fermer l'accordéon
    const content = document.getElementById('interval-content');
    const icon = document.getElementById('interval-accordion-icon');
    if (content) content.style.display = 'none';
    if (icon) {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }

    updateIntervalsDisplay();
    saveIntervals();

    console.log('✅ Tous les intervalles ont été effacés');
}

// Sauvegarder les intervalles dans le localStorage
function saveIntervals() {
    try {
        const data = intervals.map(interval => ({
            id: interval.id,
            startTime: interval.startTime,
            endTime: interval.endTime,
            comment: interval.comment,
            yPosition: interval.yPosition,
            color: interval.color,
            visible: interval.visible,
            fontSize: interval.fontSize,
            fontWeight: interval.fontWeight,
            fontStyle: interval.fontStyle,
            textDecoration: interval.textDecoration
        }));

        localStorage.setItem('hydraspec_intervals', JSON.stringify(data));
    } catch (e) {
        console.error('Erreur sauvegarde intervalles:', e);
    }
}

// Charger les intervalles depuis le localStorage
function loadIntervals() {
    try {
        const saved = localStorage.getItem('hydraspec_intervals');
        if (!saved) return;

        const data = JSON.parse(saved);
        intervals = data.map(item => {
            const interval = new Interval(
                item.id,
                item.startTime,
                item.endTime,
                item.comment || '',
                item.yPosition || 0.5
            );
            interval.color = item.color || '#4ECDC4';
            interval.visible = item.visible !== false;

            // Restaurer les propriétés de formatage
            interval.fontSize = item.fontSize || 11;
            interval.fontWeight = item.fontWeight || 'normal';
            interval.fontStyle = item.fontStyle || 'normal';
            interval.textDecoration = item.textDecoration || 'none';

            // Mettre à jour nextIntervalId
            const idNum = parseInt(item.id.replace('interval-', ''));
            if (idNum >= nextIntervalId) {
                nextIntervalId = idNum + 1;
            }

            return interval;
        });

        updateIntervalsDisplay();
    } catch (e) {
        console.error('Erreur chargement intervalles:', e);
    }
}

// Charger les intervalles depuis les données d'un projet .hsp
function loadIntervalsFromProject(savedIntervals) {
    if (!savedIntervals || !Array.isArray(savedIntervals)) {
        console.log("⚠️ No intervals to load from project");
        return;
    }

    console.log("📥 Loading", savedIntervals.length, "intervals from project");

    intervals = savedIntervals.map(item => {
        const interval = new Interval(
            item.id,
            item.startTime,
            item.endTime,
            item.comment || '',
            item.yPosition || 0.5
        );
        interval.color = item.color || '#4ECDC4';
        interval.visible = item.visible !== false;

        // Restaurer les propriétés de formatage
        interval.fontSize = item.fontSize || 11;
        interval.fontWeight = item.fontWeight || 'normal';
        interval.fontStyle = item.fontStyle || 'normal';
        interval.textDecoration = item.textDecoration || 'none';

        // Mettre à jour nextIntervalId
        const idNum = parseInt(item.id.replace('interval-', ''));
        if (idNum >= nextIntervalId) {
            nextIntervalId = idNum + 1;
        }

        return interval;
    });

    console.log("✅ Loaded", intervals.length, "intervals successfully");
    updateIntervalsDisplay();
}

// Trouver l'intervalle à une position donnée
function findIntervalAtPosition(x, y, chart) {
    if (!chart || intervals.length === 0) return null;

    const xScale = chart.scales.x;
    const clickTimeMs = xScale.getValueForPixel(x);
    const clickTime = clickTimeMs / 1000; // Convertir en secondes

    // Tolérance de clic en pixels
    const tolerance = 10;

    // Chercher un intervalle qui contient ce temps
    for (let i = intervals.length - 1; i >= 0; i--) {
        const interval = intervals[i];
        if (!interval.visible) continue;

        const startTime = interval.getStartTime();
        const endTime = interval.getEndTime();
        const yPixel = interval.getYPixelPosition(chart);

        // Vérifier si le clic est dans l'intervalle temporel
        if (clickTime >= startTime && clickTime <= endTime) {
            // Vérifier si le clic est près de la ligne horizontale (tolérance verticale)
            if (Math.abs(y - yPixel) <= tolerance) {
                return interval;
            }

            // Vérifier aussi si le clic est près des curseurs verticaux
            const startX = xScale.getPixelForValue(startTime * 1000);
            const endX = xScale.getPixelForValue(endTime * 1000);

            if (Math.abs(x - startX) <= tolerance || Math.abs(x - endX) <= tolerance) {
                return interval;
            }
        }
    }

    return null;
}

// Déterminer quelle partie de l'intervalle est cliquée
function getIntervalDragType(x, y, interval, chart) {
    if (!interval || !chart) return null;

    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const startTime = interval.getStartTime();
    const endTime = interval.getEndTime();
    const yPixel = interval.getYPixelPosition(chart);

    const startX = xScale.getPixelForValue(startTime * 1000);
    const endX = xScale.getPixelForValue(endTime * 1000);
    const centerX = (startX + endX) / 2;

    const verticalTolerance = 10; // Zone de clic pour les lignes verticales (pointillés)
    const heightTolerance = 10; // Zone de clic pour la barre horizontale

    // Limites verticales du graphique
    const chartTop = yScale.top || 0;
    const chartBottom = yScale.bottom || chart.height;
    const isInChartY = y >= chartTop && y <= chartBottom;

    // Vérifier si le clic est près du curseur gauche (ligne verticale pointillée)
    // On peut cliquer n'importe où le long de la ligne verticale
    if (Math.abs(x - startX) <= verticalTolerance && isInChartY) {
        return 'start';
    }

    // Vérifier si le clic est près du curseur droit (ligne verticale pointillée)
    // On peut cliquer n'importe où le long de la ligne verticale
    if (Math.abs(x - endX) <= verticalTolerance && isInChartY) {
        return 'end';
    }

    // Vérifier si le clic est sur la barre horizontale (milieu)
    if (x > startX + verticalTolerance && x < endX - verticalTolerance && Math.abs(y - yPixel) <= heightTolerance) {
        return 'height';
    }

    return null;
}

// Gérer le double-clic sur le canvas pour éditer un intervalle
function handleIntervalDoubleClick(event, chart) {
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const interval = findIntervalAtPosition(x, y, chart);

    if (interval) {
        openIntervalEditModal(interval);
    }
}

// --- SYSTÈME DE DRAG D'INTERVALLE ---

// Gérer le début du drag (mousedown)
function handleIntervalMouseDown(event, chart) {
    // Ne pas activer le drag si on est en mode création
    if (isCreatingInterval) return false;

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Trouver l'intervalle cliqué
    const interval = findIntervalAtPosition(x, y, chart);
    if (!interval) return false;

    // Déterminer quelle partie est cliquée
    const dragType = getIntervalDragType(x, y, interval, chart);
    if (!dragType) return false;

    // Activer le drag
    intervalDragState.active = true;
    intervalDragState.interval = interval;
    intervalDragState.dragType = dragType;
    intervalDragState.initialMouseY = y;

    // Changer le curseur
    if (dragType === 'start' || dragType === 'end') {
        chart.canvas.style.cursor = 'ew-resize';
    } else if (dragType === 'height') {
        chart.canvas.style.cursor = 'ns-resize';
    }

    event.preventDefault();
    event.stopImmediatePropagation(); // Bloquer TOUS les autres handlers
    console.log('🎯 Interval drag started:', dragType, interval.id);
    return true; // Indique que le clic a été géré
}

// Gérer le déplacement pendant le drag (mousemove)
function handleIntervalMouseMove(event, chart) {
    if (!intervalDragState.active) {
    console.log("📍 mousemove called, active:", intervalDragState.active);
        // Changer le curseur au survol même sans drag actif
        const rect = chart.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const interval = findIntervalAtPosition(x, y, chart);
        if (interval) {
            const dragType = getIntervalDragType(x, y, interval, chart);
            if (dragType === 'start' || dragType === 'end') {
                chart.canvas.style.cursor = 'ew-resize';
            } else if (dragType === 'height') {
                chart.canvas.style.cursor = 'ns-resize';
            } else {
                chart.canvas.style.cursor = 'pointer';
            }
        } else {
            chart.canvas.style.cursor = 'default';
        }
        return false; // Pas de drag actif
    }

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const interval = intervalDragState.interval;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;

    if (intervalDragState.dragType === 'start') {
        // Déplacer le curseur de début
        const newTimeMs = xScale.getValueForPixel(x);
        const newTime = newTimeMs / 1000;
        interval.startTime = newTime;

    } else if (intervalDragState.dragType === 'end') {
        // Déplacer le curseur de fin
        const newTimeMs = xScale.getValueForPixel(x);
        const newTime = newTimeMs / 1000;
        interval.endTime = newTime;

    } else if (intervalDragState.dragType === 'height') {
        // Modifier la hauteur (position Y)
        const yValue = yScale.getValueForPixel(y);
        const yMin = yScale.min;
        const yMax = yScale.max;
        const yPosition = (yValue - yMin) / (yMax - yMin);

        // Limiter yPosition entre 0 et 1
        interval.yPosition = Math.max(0, Math.min(1, yPosition));
    }

    // Mettre à jour l'affichage en temps réel
    updateIntervalsDisplay();

    // Redessiner le canvas pour voir le déplacement
    chart.update('none'); // 'none' = pas d'animation, immédiat

    event.preventDefault();
    return true; // Drag actif géré
}

// Gérer la fin du drag (mouseup)
function handleIntervalMouseUp(event, chart) {
    if (!intervalDragState.active) return false;

    // Sauvegarder les modifications
    if (typeof saveState === 'function') {
        saveState('Modification intervalle par drag');
    }

    saveIntervals();

    // Réinitialiser l'état du drag
    intervalDragState.active = false;
    intervalDragState.interval = null;
    intervalDragState.dragType = null;

    // Restaurer le curseur
    chart.canvas.style.cursor = 'default';

    setStatus('Intervalle modifié', 'success');
    return true; // Drag terminé avec succès
}

// Initialiser le système d'intervalles
function initIntervals() {
    // Charger les intervalles sauvegardés
    loadIntervals();

    const chart = appState.charts?.time;
    if (chart && chart.canvas) {
        // Ajouter le gestionnaire de double-clic pour éditer
        chart.canvas.addEventListener('dblclick', (event) => {
            handleIntervalDoubleClick(event, chart);
        });

        // Note: mousedown, mousemove et mouseup sont gérés dans charts.js
        // avec système de priorités pour éviter conflits avec autres outils
        console.log('✅ Event listeners interval: dblclick sur canvas, drag géré par charts.js');
    }

    console.log('Système d\'intervalles initialisé');
}
