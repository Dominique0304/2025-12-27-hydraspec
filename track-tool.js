// =====================================
// OUTIL DE TRACKING (TRAQUER) - Architecture POO
// =====================================

/**
 * Classe TrackTool - Encapsule toute la logique de l'outil de tracking
 * Architecture 100% POO : plus de variables globales
 */
class TrackTool {
    constructor(project) {
        this.project = project;

        // État encapsulé (anciennement trackState global)
        this.state = {
            active: false,
            currentX: null,  // Position X actuelle du curseur
            values: {},      // Valeurs Y pour chaque dataset
            locked: false,   // Si true, le curseur est fixé (ne suit pas la souris)
            dragging: false  // Si true, on est en train de dragger le curseur
        };

        console.log(`✅ TrackTool créé pour projet: ${project.name}`);
    }

    // ========================================
    // ACTIVATION / DÉSACTIVATION
    // ========================================

    /**
     * Active ou désactive l'outil
     */
    toggle() {
        const btn = document.getElementById('track-tool-btn');
        const results = document.getElementById('track-results');
        const icon = document.getElementById('track-accordion-icon');

        // Vérifier l'état AVANT de changer
        if (!this.state.active) {
            // ACTIVATION : Désactiver les autres outils D'ABORD
            if (typeof deactivateOtherTools === 'function') {
                deactivateOtherTools('track');
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
                closeOtherToolAccordions('track');
            }

            // Activer l'outil APRÈS avoir désactivé les autres
            this.state.active = true;
            btn.style.background = 'var(--accent-green)';
            results.style.display = 'block';
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
            setStatus("Outil Traquer activé - Déplacez la souris sur le graphique");
        } else {
            // DÉSACTIVATION
            this.deactivate();
        }
    }

    /**
     * Désactive l'outil (appelé aussi depuis l'extérieur)
     */
    deactivate() {
        this.state.active = false;

        const btn = document.getElementById('track-tool-btn');
        const results = document.getElementById('track-results');
        const icon = document.getElementById('track-accordion-icon');

        if (btn) btn.style.background = 'var(--accent-blue)';
        if (results) results.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }

        this.state.currentX = null;
        this.state.values = {};

        // Mettre à jour le graphique
        if (window.globalCharts && window.globalCharts.time) {
            window.globalCharts.time.update('none');
        }

        setStatus(t("status.track_tool_deactivated"));
    }

    // ========================================
    // GESTION DU TRACKING
    // ========================================

    /**
     * Efface le tracking
     */
    clear() {
        this.state.currentX = null;
        this.state.values = {};
        this.state.locked = false;
        this.state.dragging = false;

        const container = document.getElementById('track-values');
        if (container) container.innerHTML = '';

        if (window.globalCharts && window.globalCharts.time) {
            window.globalCharts.time.update('none');
        }

        setStatus("Tracking effacé");
    }

    /**
     * Met à jour l'affichage des résultats dans le panneau
     */
    updateResults() {
        const container = document.getElementById('track-values');
        if (!container) return;

        if (Object.keys(this.state.values).length === 0) {
            container.innerHTML = '<div style="color:var(--text-muted); font-style:italic;">Aucune donnée</div>';
            return;
        }

        let html = '';
        Object.keys(this.state.values).forEach(label => {
            const data = this.state.values[label];
            html += `
                <div class="control-row" style="margin-bottom:4px;">
                    <span style="color:${data.color};">${label}:</span>
                    <span style="color:var(--accent-green); font-weight:bold;">${data.value.toFixed(2)}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Calcule et met à jour les valeurs Y pour la position X actuelle
     */
    updateValues(chart) {
        this.state.values = {};

        const xValue = this.state.currentX;
        console.log('📍 Track - Position X:', xValue.toFixed(3), 'Datasets:', chart.data.datasets.length);

        chart.data.datasets.forEach((dataset, index) => {
            if (!dataset.hidden && dataset.data && dataset.data.length > 0) {
                // Vérifier le format des données
                const firstPoint = dataset.data[0];
                let yValue = null;

                if (typeof firstPoint === 'object' && firstPoint !== null && 'x' in firstPoint) {
                    // Format objet {x, y}
                    yValue = this._interpolateValue(dataset.data, xValue);
                } else {
                    // Format simple [y1, y2, y3, ...] - utiliser les labels du chart
                    yValue = this._interpolateValueFromLabels(chart, dataset.data, xValue);
                }

                console.log('   Dataset:', dataset.label, 'yAxisID:', dataset.yAxisID, 'yValue:', yValue);

                if (yValue !== null) {
                    this.state.values[dataset.label] = {
                        value: yValue,
                        color: dataset.borderColor,
                        yAxisID: dataset.yAxisID || 'y'
                    };
                }
            }
        });

        console.log('📊 Track values:', Object.keys(this.state.values).length, 'channels');

        // Mettre à jour l'affichage
        this.updateResults();
        chart.update('none');
    }

    // ========================================
    // GESTION DES INTERACTIONS
    // ========================================

    /**
     * Gère le clic pour fixer le curseur
     * @returns {boolean} True si l'événement a été géré
     */
    handleClick(event, chart) {
        if (!this.state.active) return false;

        const rect = chart.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const xAxis = chart.scales.x;
        const isInChart = x >= xAxis.left && x <= xAxis.right;

        if (!isInChart) return false;

        const xValue = xAxis.getValueForPixel(x);

        // Si le curseur est déjà fixé, vérifier si on clique près de lui pour le dragger
        if (this.state.locked && this.state.currentX !== null) {
            const cursorPixel = xAxis.getPixelForValue(this.state.currentX);
            const distance = Math.abs(x - cursorPixel);
            const tolerance = 15; // pixels

            if (distance <= tolerance) {
                // On clique sur le curseur → commencer le drag
                this.state.dragging = true;
                return true;
            } else {
                // On clique ailleurs → déplacer le curseur immédiatement
                this.state.currentX = xValue;
                this.updateValues(chart);
                return true;
            }
        } else {
            // Pas encore de curseur fixé → fixer à cette position
            this.state.currentX = xValue;
            this.state.locked = true;
            this.updateValues(chart);
            setStatus("Curseur Traquer fixé - Cliquez dessus pour le déplacer");
            return true;
        }
    }

    /**
     * Gère le relâchement de la souris
     * @returns {boolean} True si l'événement a été géré
     */
    handleMouseUp() {
        if (!this.state.active) return false;

        if (this.state.dragging) {
            this.state.dragging = false;
            setStatus("Curseur Traquer repositionné");
            return true;
        }

        return false;
    }

    /**
     * Gère le mouvement de la souris pour le tracking
     * @returns {boolean} True si l'événement a été géré
     */
    handleMove(event, chart, canvas) {
        if (!this.state.active) return false;

        // IMPORTANT: Ne pas intercepter si on est en train de dragger autre chose (curseurs, etc.)
        if (this.project.state.isDragging) return false;

        // Si le curseur est fixé et qu'on ne drag pas, ne rien faire
        if (this.state.locked && !this.state.dragging) return false;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;

        // Vérifier si on est dans la zone du graphique
        const xAxis = chart.scales.x;
        const isInChart = x >= xAxis.left && x <= xAxis.right;

        if (!isInChart) return false;

        // Convertir la position pixel en valeur X
        const xValue = xAxis.getValueForPixel(x);
        this.state.currentX = xValue;

        // Mettre à jour les valeurs
        this.updateValues(chart);

        return false;  // Ne pas bloquer les autres événements (curseurs, etc.)
    }

    // ========================================
    // RENDU
    // ========================================

    /**
     * Dessine le curseur de tracking et les annotations
     */
    draw(chart) {
        if (!this.state.active || this.state.currentX === null) return;

        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const x = xAxis.getPixelForValue(this.state.currentX);

        // Vérifier que x est dans les limites
        if (x < xAxis.left || x > xAxis.right) return;

        ctx.save();

        // Dessiner la ligne verticale en pointillés BLEU CLAIR - Traverse toute la hauteur
        ctx.strokeStyle = '#42A5F5'; // Bleu clair
        ctx.lineWidth = 3; // Plus épais pour mieux voir
        ctx.setLineDash([10, 5]); // Pointillés plus longs et espacés

        ctx.beginPath();
        ctx.moveTo(x, 0); // Du haut du canvas
        ctx.lineTo(x, chart.height); // Jusqu'en bas du canvas
        ctx.stroke();

        ctx.setLineDash([]);

        // Compter les axes à gauche et à droite pour calculer les offsets
        const leftAxes = [];
        const rightAxes = [];

        Object.keys(chart.scales).forEach(scaleKey => {
            if (!scaleKey.startsWith('y')) return;
            const scale = chart.scales[scaleKey];
            if (scale.options && scale.options.display !== false) {
                if (scale.options.position === 'left') {
                    leftAxes.push(scaleKey);
                } else if (scale.options.position === 'right') {
                    rightAxes.push(scaleKey);
                }
            }
        });

        // Dessiner les annotations sur chaque axe Y pour chaque dataset
        Object.keys(this.state.values).forEach(label => {
            const data = this.state.values[label];
            const yAxisID = data.yAxisID;
            const yScale = chart.scales[yAxisID];

            if (!yScale) {
                console.log('⚠️ Échelle non trouvée:', yAxisID);
                return;
            }

            const yPixel = yScale.getPixelForValue(data.value);

            // Déterminer la position de l'annotation
            let axisXPos;
            let offset = 0;

            if (yScale.options.position === 'left') {
                const axisIndex = leftAxes.indexOf(yAxisID);
                offset = axisIndex * 60;
                axisXPos = xAxis.left - 50 - offset;
            } else if (yScale.options.position === 'right') {
                const axisIndex = rightAxes.indexOf(yAxisID);
                offset = axisIndex * 60;
                axisXPos = xAxis.right + 50 + offset;
            } else {
                console.log('⚠️ Position non définie pour:', yAxisID);
                return;
            }

            ctx.save();
            ctx.translate(axisXPos, yPixel);
            ctx.rotate(-Math.PI / 2);

            // Rectangle blanc avec bordure de la couleur du dataset
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-30, -10, 60, 20);
            ctx.strokeStyle = data.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(-30, -10, 60, 20);

            // Texte dans la couleur du dataset
            ctx.fillStyle = data.color;
            ctx.font = `bold ${window.chartFontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const valueText = data.value.toFixed(2);
            ctx.fillText(valueText, 0, 0);

            ctx.restore();

            // Dessiner un petit cercle à l'intersection
            ctx.fillStyle = data.color;
            ctx.beginPath();
            ctx.arc(x, yPixel, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        ctx.restore();
    }

    // ========================================
    // MÉTHODES PRIVÉES D'INTERPOLATION
    // ========================================

    /**
     * Interpoler la valeur Y à une position X donnée (format objet {x, y})
     * @private
     */
    _interpolateValue(data, xTarget) {
        if (!data || data.length === 0) {
            console.log('⚠️ interpolateValue: data vide');
            return null;
        }

        // Debug: afficher le format des données
        if (data.length > 0) {
            console.log('🔍 Premier point:', data[0], 'xTarget:', xTarget);
            console.log('🔍 Dernier point:', data[data.length - 1]);
        }

        // Trouver les deux points encadrant xTarget
        let left = null;
        let right = null;

        for (let i = 0; i < data.length; i++) {
            const point = data[i];
            const x = point.x;

            if (x <= xTarget) {
                left = point;
            }
            if (x >= xTarget && right === null) {
                right = point;
                break;
            }
        }

        console.log('🔍 Interpolation - left:', left, 'right:', right);

        // Si on a trouvé les deux points, interpoler
        if (left && right) {
            if (left.x === right.x) {
                return left.y;
            }

            // Interpolation linéaire
            const ratio = (xTarget - left.x) / (right.x - left.x);
            return left.y + ratio * (right.y - left.y);
        }

        // Si on est avant le premier point
        if (!left && right) {
            return right.y;
        }

        // Si on est après le dernier point
        if (left && !right) {
            return left.y;
        }

        console.log('⚠️ interpolateValue: aucun point trouvé');
        return null;
    }

    /**
     * Interpoler la valeur Y à partir des labels du chart (format simple)
     * @private
     */
    _interpolateValueFromLabels(chart, dataArray, xTarget) {
        if (!dataArray || dataArray.length === 0) {
            console.log('⚠️ interpolateValueFromLabels: data vide');
            return null;
        }

        const labels = chart.data.labels;
        if (!labels || labels.length === 0) {
            console.log('⚠️ interpolateValueFromLabels: labels vides');
            return null;
        }

        console.log('🔍 Labels - Premier:', labels[0], 'Dernier:', labels[labels.length - 1], 'xTarget:', xTarget);

        // Trouver les deux indices encadrant xTarget
        let leftIdx = -1;
        let rightIdx = -1;

        for (let i = 0; i < labels.length; i++) {
            const labelX = parseFloat(labels[i]);

            if (labelX <= xTarget) {
                leftIdx = i;
            }
            if (labelX >= xTarget && rightIdx === -1) {
                rightIdx = i;
                break;
            }
        }

        console.log('🔍 Indices - left:', leftIdx, 'right:', rightIdx);

        // Si on a trouvé les deux indices, interpoler
        if (leftIdx >= 0 && rightIdx >= 0 && leftIdx < dataArray.length && rightIdx < dataArray.length) {
            const x1 = parseFloat(labels[leftIdx]);
            const x2 = parseFloat(labels[rightIdx]);
            const y1 = dataArray[leftIdx];
            const y2 = dataArray[rightIdx];

            if (x1 === x2) {
                return y1;
            }

            // Interpolation linéaire
            const ratio = (xTarget - x1) / (x2 - x1);
            const result = y1 + ratio * (y2 - y1);
            console.log('✅ Interpolation réussie:', result);
            return result;
        }

        // Si on est avant le premier point
        if (leftIdx === -1 && rightIdx >= 0 && rightIdx < dataArray.length) {
            return dataArray[rightIdx];
        }

        // Si on est après le dernier point
        if (leftIdx >= 0 && leftIdx < dataArray.length && rightIdx === -1) {
            return dataArray[leftIdx];
        }

        console.log('⚠️ interpolateValueFromLabels: aucun point trouvé');
        return null;
    }

    // ========================================
    // SAUVEGARDE / RESTAURATION
    // ========================================

    /**
     * Exporte l'état de l'outil (pour sauvegarde HSP)
     * @returns {Object} État sérialisé
     */
    export() {
        return {
            active: this.state.active,
            currentX: this.state.currentX,
            values: JSON.parse(JSON.stringify(this.state.values)),
            locked: this.state.locked,
            dragging: false  // Ne jamais sauvegarder dragging
        };
    }

    /**
     * Restaure l'état de l'outil (depuis HSP)
     * @param {Object} data - État à restaurer
     */
    restore(data) {
        if (!data) return;

        this.state.active = data.active || false;
        this.state.currentX = data.currentX || null;
        this.state.values = data.values ? JSON.parse(JSON.stringify(data.values)) : {};
        this.state.locked = data.locked || false;
        this.state.dragging = false; // Ne jamais restaurer dragging

        // Mettre à jour l'UI
        const btn = document.getElementById('track-tool-btn');
        const results = document.getElementById('track-results');

        if (btn) {
            btn.style.background = this.state.active ? 'var(--accent-green)' : 'var(--accent-blue)';
        }
        if (results) {
            results.style.display = this.state.active ? 'block' : 'none';
        }

        // Mettre à jour l'affichage des valeurs
        if (this.state.active && this.state.currentX !== null) {
            this.updateResults();
        }
    }
}

// ========================================
// FONCTIONS DE COMPATIBILITÉ LEGACY
// ========================================

/**
 * Wrapper pour compatibilité avec l'ancien code
 * Utilise le TrackTool du projet actif
 */
function toggleTrackTool() {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) {
        console.warn("⚠️ TrackTool non disponible");
        return;
    }
    project.trackTool.toggle();
}

function clearTrack() {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) return;
    project.trackTool.clear();
}

function handleTrackClick(event, chart) {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) return false;
    return project.trackTool.handleClick(event, chart);
}

function handleTrackMouseUp() {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) return false;
    return project.trackTool.handleMouseUp();
}

function handleTrackMove(event, chart, canvas) {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) return false;
    return project.trackTool.handleMove(event, chart, canvas);
}

function updateTrackValues(chart) {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) return;
    project.trackTool.updateValues(chart);
}

function updateTrackResults() {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) return;
    project.trackTool.updateResults();
}

function drawTrackCursor(chart) {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) return;
    project.trackTool.draw(chart);
}

// Fonctions d'interpolation - redirection vers le projet actif
function interpolateValue(data, xTarget) {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) return null;
    return project.trackTool._interpolateValue(data, xTarget);
}

function interpolateValueFromLabels(chart, dataArray, xTarget) {
    const project = window.projectManager?.getActive();
    if (!project || !project.trackTool) return null;
    return project.trackTool._interpolateValueFromLabels(chart, dataArray, xTarget);
}

// Rendre la classe disponible globalement
if (typeof window !== 'undefined') {
    window.TrackTool = TrackTool;
}

console.log("📦 Module TrackTool (POO) chargé");
