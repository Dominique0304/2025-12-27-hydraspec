// =====================================
// OUTIL DE MESURE SIMPLE (RÈGLE) - Architecture POO
// =====================================

/**
 * Classe RulerTool - Encapsule toute la logique de l'outil règle
 * Architecture 100% POO : plus de variables globales
 */
class RulerTool {
    constructor(project) {
        this.project = project;

        // État encapsulé (anciennement rulerState global)
        this.state = {
            active: false,
            point: null,  // {x: valeur en ms, y: valeur en unité}
            dragging: false
        };

        console.log(`✅ RulerTool créé pour projet: ${project.name}`);
    }

    // ========================================
    // ACTIVATION / DÉSACTIVATION
    // ========================================

    /**
     * Active ou désactive l'outil
     */
    toggle() {
        const btn = document.getElementById('ruler-tool-btn');
        const results = document.getElementById('ruler-results');
        const icon = document.getElementById('ruler-accordion-icon');

        // Vérifier l'état AVANT de changer
        if (!this.state.active) {
            // ACTIVATION : Désactiver les autres outils D'ABORD
            if (typeof deactivateOtherTools === 'function') {
                deactivateOtherTools('ruler');
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
                closeOtherToolAccordions('ruler');
            }

            // Activer l'outil APRÈS avoir désactivé les autres
            this.state.active = true;
            btn.style.background = 'var(--accent-green)';
            results.style.display = 'block';
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
            setStatus("Outil Mesurer activé - Cliquez sur le graphique pour placer le point");
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

        const btn = document.getElementById('ruler-tool-btn');
        const results = document.getElementById('ruler-results');
        const icon = document.getElementById('ruler-accordion-icon');

        if (btn) btn.style.background = 'var(--accent-blue)';
        if (results) results.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }

        this.state.point = null;

        // Mettre à jour le graphique
        if (window.globalCharts && window.globalCharts.time) {
            window.globalCharts.time.update('none');
        }

        setStatus(t("status.ruler_tool_deactivated"));
    }

    // ========================================
    // GESTION DES MESURES
    // ========================================

    /**
     * Efface la mesure
     */
    clear() {
        this.state.point = null;

        const xElem = document.getElementById('ruler-x');
        const yElem = document.getElementById('ruler-y');

        if (xElem) xElem.textContent = '--';
        if (yElem) yElem.textContent = '--';

        if (window.globalCharts && window.globalCharts.time) {
            window.globalCharts.time.update('none');
        }

        setStatus(t("status.ruler_cleared"));
    }

    /**
     * Met à jour l'affichage des résultats
     */
    updateResults() {
        if (!this.state.point) return;

        const xDisplay = this.state.point.x >= 1
            ? `${this.state.point.x.toFixed(3)}s`
            : `${(this.state.point.x * 1000).toFixed(3)}ms`;

        const yDisplay = this.state.point.y.toFixed(2);

        const xElem = document.getElementById('ruler-x');
        const yElem = document.getElementById('ruler-y');

        if (xElem) xElem.textContent = xDisplay;
        if (yElem) yElem.textContent = yDisplay;
    }

    // ========================================
    // GESTION DES INTERACTIONS
    // ========================================

    /**
     * Gère le clic sur le graphique pour placer le point
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

        // Vérifier si on clique près du point existant pour le déplacer
        const tolerance = 10; // pixels

        if (this.state.point) {
            const xPixel = chart.scales.x.getPixelForValue(this.state.point.x);
            const yPixel = chart.scales.y.getPixelForValue(this.state.point.y);
            const dist = Math.sqrt((x - xPixel)**2 + (y - yPixel)**2);

            if (dist < tolerance) {
                this.state.dragging = true;
                return true;
            }
        }

        // Placer ou remplacer le point
        this.state.point = { x: xValue, y: yValue };
        this.updateResults();
        setStatus("Point placé - Glissez pour ajuster ou utilisez Effacer");

        chart.update('none');
        return true;
    }

    /**
     * Gère le déplacement du point
     * @returns {boolean} True si l'événement a été géré
     */
    handleDrag(event, chart, canvas) {
        if (!this.state.active || !this.state.dragging) return false;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const xValue = chart.scales.x.getValueForPixel(x);
        const yValue = chart.scales.y.getValueForPixel(y);

        this.state.point = { x: xValue, y: yValue };
        this.updateResults();
        chart.update('none');

        return true;
    }

    /**
     * Gère le relâchement de la souris
     * @returns {boolean} True si l'événement a été géré
     */
    handleMouseUp() {
        if (!this.state.active) return false;

        if (this.state.dragging) {
            this.state.dragging = false;
            setStatus("Point ajusté");
            return true;
        }

        return false;
    }

    // ========================================
    // RENDU
    // ========================================

    /**
     * Dessine le point et les lignes sur le graphique
     */
    draw(chart) {
        if (!this.state.active || !this.state.point) return;

        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        const x = xAxis.getPixelForValue(this.state.point.x);
        const y = yAxis.getPixelForValue(this.state.point.y);

        ctx.save();

        // Dessiner les lignes en pointillés cyan
        ctx.strokeStyle = '#4ECDC4'; // Cyan
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Ligne verticale
        ctx.beginPath();
        ctx.moveTo(x, xAxis.top);
        ctx.lineTo(x, xAxis.bottom);
        ctx.stroke();

        // Ligne horizontale
        ctx.beginPath();
        ctx.moveTo(xAxis.left, y);
        ctx.lineTo(xAxis.right, y);
        ctx.stroke();

        ctx.setLineDash([]);

        // Dessiner le point (cercle cyan avec centre blanc)
        ctx.fillStyle = '#4ECDC4';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Centre du point
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();

        // Annotations Y sur TOUS les axes Y visibles
        // Parcourir toutes les échelles Y
        Object.keys(chart.scales).forEach((scaleKey, index) => {
            if (!scaleKey.startsWith('y')) return; // Ignorer les échelles non-Y

            const yScale = chart.scales[scaleKey];
            if (!yScale.options.display && scaleKey !== 'y') return; // Ignorer les échelles cachées

            // Calculer la valeur Y selon cette échelle au niveau de la ligne horizontale
            const yValue = yScale.getValueForPixel(y);

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
                return; // Ignorer les axes sans position
            }

            ctx.save();
            ctx.translate(axisXPos, y);
            ctx.rotate(-Math.PI / 2);

            // Rectangle cyan clair avec bordure
            ctx.fillStyle = '#4ECDC4';
            ctx.fillRect(-30, -10, 60, 20);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(-30, -10, 60, 20);

            // Texte
            ctx.fillStyle = '#000';
            ctx.font = `bold ${window.chartFontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const yText = 'y=' + yValue.toFixed(2);
            ctx.fillText(yText, 0, 0);

            ctx.restore();
        });
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
            point: this.state.point ? {...this.state.point} : null,
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
        this.state.point = data.point ? {...data.point} : null;
        this.state.dragging = false; // Ne jamais restaurer le dragging

        // Mettre à jour l'UI
        const btn = document.getElementById('ruler-tool-btn');
        const results = document.getElementById('ruler-results');

        if (btn) {
            btn.style.background = this.state.active ? 'var(--accent-green)' : 'var(--accent-blue)';
        }
        if (results) {
            results.style.display = this.state.active ? 'block' : 'none';
        }

        // Mettre à jour les résultats si le point existe
        if (this.state.point) {
            this.updateResults();
        }
    }
}

// ========================================
// FONCTIONS DE COMPATIBILITÉ LEGACY
// ========================================

/**
 * Wrapper pour compatibilité avec l'ancien code
 * Utilise le RulerTool du projet actif
 */
function toggleRulerTool() {
    const project = window.projectManager?.getActive();
    if (!project || !project.rulerTool) {
        console.warn("⚠️ RulerTool non disponible");
        return;
    }
    project.rulerTool.toggle();
}

function clearRuler() {
    const project = window.projectManager?.getActive();
    if (!project || !project.rulerTool) return;
    project.rulerTool.clear();
}

function handleRulerClick(event, chart) {
    const project = window.projectManager?.getActive();
    if (!project || !project.rulerTool) return false;
    return project.rulerTool.handleClick(event, chart);
}

function handleRulerDrag(event, chart, canvas) {
    const project = window.projectManager?.getActive();
    if (!project || !project.rulerTool) return false;
    return project.rulerTool.handleDrag(event, chart, canvas);
}

function handleRulerMouseUp() {
    const project = window.projectManager?.getActive();
    if (!project || !project.rulerTool) return false;
    return project.rulerTool.handleMouseUp();
}

function updateRulerResults() {
    const project = window.projectManager?.getActive();
    if (!project || !project.rulerTool) return;
    project.rulerTool.updateResults();
}

function drawRulerPoint(chart) {
    const project = window.projectManager?.getActive();
    if (!project || !project.rulerTool) return;
    project.rulerTool.draw(chart);
}

// Rendre la classe disponible globalement
if (typeof window !== 'undefined') {
    window.RulerTool = RulerTool;
}

console.log("📦 Module RulerTool (POO) chargé");
