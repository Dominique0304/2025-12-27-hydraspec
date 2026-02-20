// =====================================
// OUTIL DE MESURE DE DIFFÉRENCE - Architecture POO
// =====================================

/**
 * Classe MeasureTool - Encapsule toute la logique de l'outil de mesure
 * Architecture 100% POO : plus de variables globales
 */
class MeasureTool {
    constructor(project) {
        this.project = project;

        // État encapsulé (anciennement measureState global)
        this.state = {
            active: false,
            point1: null,  // {x: valeur en ms, y: valeur en unité}
            point2: null,
            dragging: null  // 'point1' ou 'point2' ou null
        };

        console.log(`✅ MeasureTool créé pour projet: ${project.name}`);
    }

    // ========================================
    // ACTIVATION / DÉSACTIVATION
    // ========================================

    /**
     * Active ou désactive l'outil
     */
    toggle() {
        const btn = document.getElementById('measure-diff-btn');
        const results = document.getElementById('measure-results');
        const icon = document.getElementById('measure-accordion-icon');

        // Vérifier l'état AVANT de changer
        if (!this.state.active) {
            // ACTIVATION : Désactiver les autres outils D'ABORD
            if (typeof deactivateOtherTools === 'function') {
                deactivateOtherTools('measure');
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
                closeOtherToolAccordions('measure');
            }

            // Activer l'outil APRÈS avoir désactivé les autres
            this.state.active = true;
            btn.style.background = 'var(--accent-green)';
            results.style.display = 'block';
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
            setStatus("Outil de mesure activé - Cliquez sur le graphique pour placer les points");
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

        const btn = document.getElementById('measure-diff-btn');
        const results = document.getElementById('measure-results');
        const icon = document.getElementById('measure-accordion-icon');

        if (btn) btn.style.background = 'var(--accent-blue)';
        if (results) results.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }

        this.state.point1 = null;
        this.state.point2 = null;

        // Mettre à jour le graphique (utiliser globalCharts pour compatibilité)
        if (window.globalCharts && window.globalCharts.time) {
            window.globalCharts.time.update('none');
        }

        setStatus("Outil de mesure désactivé");
    }

    // ========================================
    // GESTION DES MESURES
    // ========================================

    /**
     * Efface les mesures
     */
    clear() {
        this.state.point1 = null;
        this.state.point2 = null;

        const dxElem = document.getElementById('measure-dx');
        const dyElem = document.getElementById('measure-dy');

        if (dxElem) dxElem.textContent = '--';
        if (dyElem) dyElem.textContent = '--';

        if (window.globalCharts && window.globalCharts.time) {
            window.globalCharts.time.update('none');
        }

        setStatus("Mesures effacées");
    }

    /**
     * Met à jour les résultats affichés
     */
    updateResults() {
        if (!this.state.point1 || !this.state.point2) return;

        const dx = Math.abs(this.state.point2.x - this.state.point1.x);
        const dy = Math.abs(this.state.point2.y - this.state.point1.y);

        // Affichage selon l'échelle de temps
        let dxText;
        if (dx < 1000) {
            dxText = dx.toFixed(2) + ' ms';
        } else {
            dxText = (dx / 1000).toFixed(3) + ' s';
        }

        const dxElem = document.getElementById('measure-dx');
        const dyElem = document.getElementById('measure-dy');

        if (dxElem) dxElem.textContent = dxText;
        if (dyElem) {
            const yLabel = this.project.state.yAxisLabel || '';
            dyElem.textContent = dy.toFixed(3) + ' ' + yLabel;
        }
    }

    // ========================================
    // GESTION DES INTERACTIONS
    // ========================================

    /**
     * Gère le clic sur le graphique pour placer les points
     * @returns {boolean} True si l'événement a été géré
     */
    handleClick(event, chart) {
        if (!this.state.active) return false;

        const rect = chart.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convertir les coordonnées pixel en valeurs
        const xValue = chart.scales.x.getValueForPixel(x);
        const yValue = chart.scales.y.getValueForPixel(y);

        // Vérifier si on clique près d'un point existant pour le déplacer
        const tolerance = 10; // pixels

        if (this.state.point1) {
            const x1Pixel = chart.scales.x.getPixelForValue(this.state.point1.x);
            const y1Pixel = chart.scales.y.getPixelForValue(this.state.point1.y);
            const dist1 = Math.sqrt((x - x1Pixel)**2 + (y - y1Pixel)**2);

            if (dist1 < tolerance) {
                this.state.dragging = 'point1';
                return true;
            }
        }

        if (this.state.point2) {
            const x2Pixel = chart.scales.x.getPixelForValue(this.state.point2.x);
            const y2Pixel = chart.scales.y.getPixelForValue(this.state.point2.y);
            const dist2 = Math.sqrt((x - x2Pixel)**2 + (y - y2Pixel)**2);

            if (dist2 < tolerance) {
                this.state.dragging = 'point2';
                return true;
            }
        }

        // Sinon, placer un nouveau point (seulement si moins de 2 points)
        if (!this.state.point1) {
            this.state.point1 = { x: xValue, y: yValue };
            setStatus(t("status.point1_placed"));
        } else if (!this.state.point2) {
            this.state.point2 = { x: xValue, y: yValue };
            this.updateResults();
            setStatus("Point 2 placé - Glissez les points pour ajuster ou utilisez Effacer");
        } else {
            // Si les deux points existent déjà, ne rien faire
            setStatus("2 points déjà placés - Glissez-les pour ajuster ou cliquez Effacer");
            return true;
        }

        chart.update('none');
        return true;
    }

    /**
     * Gère le déplacement des points
     * @returns {boolean} True si l'événement a été géré
     */
    handleDrag(event, chart) {
        if (!this.state.dragging) return false;

        const rect = chart.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const xValue = chart.scales.x.getValueForPixel(x);
        const yValue = chart.scales.y.getValueForPixel(y);

        if (this.state.dragging === 'point1') {
            this.state.point1 = { x: xValue, y: yValue };
        } else if (this.state.dragging === 'point2') {
            this.state.point2 = { x: xValue, y: yValue };
        }

        this.updateResults();
        chart.update('none');
        return true;
    }

    /**
     * Termine le déplacement
     * @returns {boolean} True si l'événement a été géré
     */
    handleMouseUp() {
        if (this.state.dragging) {
            this.state.dragging = null;
            return true;
        }
        return false;
    }

    // ========================================
    // RENDU
    // ========================================

    /**
     * Dessine les points de mesure et les lignes sur le graphique
     */
    draw(chart) {
        if (!this.state.active) return;
        if (!this.state.point1 && !this.state.point2) return;

        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        ctx.save();

        // Dessiner le point 1
        if (this.state.point1) {
            const x1 = xAxis.getPixelForValue(this.state.point1.x);
            const y1 = yAxis.getPixelForValue(this.state.point1.y);

            // Lignes de repère
            ctx.strokeStyle = '#FF6B6B';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            // Ligne verticale
            ctx.beginPath();
            ctx.moveTo(x1, yAxis.top);
            ctx.lineTo(x1, yAxis.bottom);
            ctx.stroke();

            // Ligne horizontale
            ctx.beginPath();
            ctx.moveTo(xAxis.left, y1);
            ctx.lineTo(xAxis.right, y1);
            ctx.stroke();

            // Point
            ctx.setLineDash([]);
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.arc(x1, y1, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = '#FFF';
            ctx.font = `${window.chartFontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('1', x1, y1 + 4);
        }

        // Dessiner le point 2
        if (this.state.point2) {
            const x2 = xAxis.getPixelForValue(this.state.point2.x);
            const y2 = yAxis.getPixelForValue(this.state.point2.y);

            // Lignes de repère
            ctx.strokeStyle = '#4ECDC4';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            // Ligne verticale
            ctx.beginPath();
            ctx.moveTo(x2, yAxis.top);
            ctx.lineTo(x2, yAxis.bottom);
            ctx.stroke();

            // Ligne horizontale
            ctx.beginPath();
            ctx.moveTo(xAxis.left, y2);
            ctx.lineTo(xAxis.right, y2);
            ctx.stroke();

            // Point
            ctx.setLineDash([]);
            ctx.fillStyle = '#4ECDC4';
            ctx.beginPath();
            ctx.arc(x2, y2, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = '#FFF';
            ctx.font = `${window.chartFontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('2', x2, y2 + 4);
        }

        // Dessiner une ligne entre les deux points
        if (this.state.point1 && this.state.point2) {
            const x1 = xAxis.getPixelForValue(this.state.point1.x);
            const y1 = yAxis.getPixelForValue(this.state.point1.y);
            const x2 = xAxis.getPixelForValue(this.state.point2.x);
            const y2 = yAxis.getPixelForValue(this.state.point2.y);

            ctx.strokeStyle = '#FFD93D';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Calculer les différences
            const dx = Math.abs(this.state.point2.x - this.state.point1.x);
            const dy = Math.abs(this.state.point2.y - this.state.point1.y);

            // Annotation ΔX sur l'axe X (entre les deux lignes verticales)
            const midX = (x1 + x2) / 2;
            const axisYPos = yAxis.bottom + 20; // En dessous de l'axe X

            ctx.fillStyle = '#FFD93D';
            ctx.fillRect(midX - 35, axisYPos - 10, 70, 20);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(midX - 35, axisYPos - 10, 70, 20);

            ctx.fillStyle = '#000';
            ctx.font = `bold ${window.chartFontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let dxText;
            if (dx < 1000) {
                dxText = 'Δt=' + dx.toFixed(2) + 'ms';
            } else {
                dxText = 'Δt=' + (dx / 1000).toFixed(3) + 's';
            }
            ctx.fillText(dxText, midX, axisYPos);

            // Annotations ΔY sur TOUS les axes Y visibles
            const midY = (y1 + y2) / 2;

            // Parcourir toutes les échelles Y
            Object.keys(chart.scales).forEach((scaleKey, index) => {
                if (!scaleKey.startsWith('y')) return; // Ignorer les échelles non-Y

                const yScale = chart.scales[scaleKey];
                if (!yScale.options.display && scaleKey !== 'y') return; // Ignorer les échelles cachées (sauf 'y' qui est toujours présente)

                // Calculer les valeurs Y selon cette échelle
                const y1Value = yScale.getValueForPixel(y1);
                const y2Value = yScale.getValueForPixel(y2);
                const dy = Math.abs(y2Value - y1Value);

                // Déterminer la position de l'annotation selon la position de l'axe
                let axisXPos;
                let offset = 0;

                if (yScale.options.position === 'left') {
                    // Axes à gauche: compter combien d'axes à gauche existent avant celui-ci
                    const leftAxesCount = Object.keys(chart.scales).filter((k, idx) =>
                        k.startsWith('y') &&
                        chart.scales[k].options.position === 'left' &&
                        idx < Object.keys(chart.scales).indexOf(scaleKey)
                    ).length;
                    offset = leftAxesCount * 60; // Décalage pour chaque axe supplémentaire
                    axisXPos = xAxis.left - 50 - offset;
                } else if (yScale.options.position === 'right') {
                    // Axes à droite: compter combien d'axes à droite existent avant celui-ci
                    const rightAxesCount = Object.keys(chart.scales).filter((k, idx) =>
                        k.startsWith('y') &&
                        chart.scales[k].options.position === 'right' &&
                        idx < Object.keys(chart.scales).indexOf(scaleKey)
                    ).length;
                    offset = rightAxesCount * 60;
                    axisXPos = xAxis.right + 50 + offset;
                } else {
                    return; // Ignorer les axes cachés
                }

                ctx.save();
                ctx.translate(axisXPos, midY);
                ctx.rotate(-Math.PI / 2);

                ctx.fillStyle = '#FFD93D';
                ctx.fillRect(-35, -10, 70, 20);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(-35, -10, 70, 20);

                ctx.fillStyle = '#000';
                ctx.font = `bold ${window.chartFontSize}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const dyText = 'Δy=' + dy.toFixed(2);
                ctx.fillText(dyText, 0, 0);

                ctx.restore();
            });
        }

        ctx.restore();
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
            point1: this.state.point1 ? {...this.state.point1} : null,
            point2: this.state.point2 ? {...this.state.point2} : null,
            dragging: this.state.dragging
        };
    }

    /**
     * Restaure l'état de l'outil (depuis HSP)
     * @param {Object} data - État à restaurer
     */
    restore(data) {
        if (!data) return;

        this.state.active = data.active || false;
        this.state.point1 = data.point1 ? {...data.point1} : null;
        this.state.point2 = data.point2 ? {...data.point2} : null;
        this.state.dragging = null; // Ne jamais restaurer le dragging

        // Mettre à jour l'UI
        const btn = document.getElementById('measure-diff-btn');
        const results = document.getElementById('measure-results');

        if (btn) {
            btn.style.background = this.state.active ? 'var(--accent-green)' : 'var(--accent-blue)';
        }
        if (results) {
            results.style.display = this.state.active ? 'block' : 'none';
        }

        // Mettre à jour les résultats si les deux points existent
        if (this.state.point1 && this.state.point2) {
            this.updateResults();
        }
    }
}

// ========================================
// FONCTIONS DE COMPATIBILITÉ LEGACY
// ========================================

/**
 * Wrapper pour compatibilité avec l'ancien code
 * Utilise le MeasureTool du projet actif
 */
function toggleMeasureTool() {
    const project = window.projectManager?.getActive();
    if (!project || !project.measureTool) {
        console.warn("⚠️ MeasureTool non disponible");
        return;
    }
    project.measureTool.toggle();
}

function clearMeasure() {
    const project = window.projectManager?.getActive();
    if (!project || !project.measureTool) return;
    project.measureTool.clear();
}

function handleMeasureClick(event, chart) {
    const project = window.projectManager?.getActive();
    if (!project || !project.measureTool) return false;
    return project.measureTool.handleClick(event, chart);
}

function handleMeasureDrag(event, chart) {
    const project = window.projectManager?.getActive();
    if (!project || !project.measureTool) return false;
    return project.measureTool.handleDrag(event, chart);
}

function handleMeasureMouseUp() {
    const project = window.projectManager?.getActive();
    if (!project || !project.measureTool) return false;
    return project.measureTool.handleMouseUp();
}

function updateMeasureResults() {
    const project = window.projectManager?.getActive();
    if (!project || !project.measureTool) return;
    project.measureTool.updateResults();
}

function drawMeasurePoints(chart) {
    const project = window.projectManager?.getActive();
    if (!project || !project.measureTool) return;
    project.measureTool.draw(chart);
}

// Rendre la classe disponible globalement
if (typeof window !== 'undefined') {
    window.MeasureTool = MeasureTool;
}

console.log("📦 Module MeasureTool (POO) chargé");
