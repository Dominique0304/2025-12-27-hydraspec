// =====================================
// OUTIL DE MESURE DE DIFFÉRENCE
// =====================================

// État de l'outil de mesure
let measureState = {
    active: false,
    point1: null,  // {x: valeur en ms, y: valeur en unité}
    point2: null,
    dragging: null  // 'point1' ou 'point2' ou null
};

// Activer/désactiver l'outil
function toggleMeasureTool() {
    const btn = document.getElementById('measure-diff-btn');
    const results = document.getElementById('measure-results');

    // Vérifier l'état AVANT de changer
    if (!measureState.active) {
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
        measureState.active = true;
        btn.style.background = 'var(--accent-green)';
        results.style.display = 'block';
        setStatus("Outil de mesure activé - Cliquez sur le graphique pour placer les points");
    } else {
        // DÉSACTIVATION
        measureState.active = false;
        btn.style.background = 'var(--accent-blue)';
        results.style.display = 'none';
        measureState.point1 = null;
        measureState.point2 = null;
        appState.charts.time.update('none');
        setStatus("Outil de mesure désactivé");
    }
}

// Effacer les mesures
function clearMeasure() {
    measureState.point1 = null;
    measureState.point2 = null;
    document.getElementById('measure-dx').textContent = '--';
    document.getElementById('measure-dy').textContent = '--';
    appState.charts.time.update('none');
    setStatus("Mesures effacées");
}

// Gérer le clic sur le graphique pour placer les points
function handleMeasureClick(event, chart) {
    if (!measureState.active) return false;

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convertir les coordonnées pixel en valeurs
    const xValue = chart.scales.x.getValueForPixel(x);
    const yValue = chart.scales.y.getValueForPixel(y);

    // Vérifier si on clique près d'un point existant pour le déplacer
    const tolerance = 10; // pixels

    if (measureState.point1) {
        const x1Pixel = chart.scales.x.getPixelForValue(measureState.point1.x);
        const y1Pixel = chart.scales.y.getPixelForValue(measureState.point1.y);
        const dist1 = Math.sqrt((x - x1Pixel)**2 + (y - y1Pixel)**2);

        if (dist1 < tolerance) {
            measureState.dragging = 'point1';
            return true;
        }
    }

    if (measureState.point2) {
        const x2Pixel = chart.scales.x.getPixelForValue(measureState.point2.x);
        const y2Pixel = chart.scales.y.getPixelForValue(measureState.point2.y);
        const dist2 = Math.sqrt((x - x2Pixel)**2 + (y - y2Pixel)**2);

        if (dist2 < tolerance) {
            measureState.dragging = 'point2';
            return true;
        }
    }

    // Sinon, placer un nouveau point (seulement si moins de 2 points)
    if (!measureState.point1) {
        measureState.point1 = { x: xValue, y: yValue };
        setStatus("Point 1 placé - Cliquez pour placer le point 2");
    } else if (!measureState.point2) {
        measureState.point2 = { x: xValue, y: yValue };
        updateMeasureResults();
        setStatus("Point 2 placé - Glissez les points pour ajuster ou utilisez Effacer");
    } else {
        // Si les deux points existent déjà, ne rien faire
        setStatus("2 points déjà placés - Glissez-les pour ajuster ou cliquez Effacer");
        return true;
    }

    chart.update('none');
    return true;
}

// Gérer le déplacement des points
function handleMeasureDrag(event, chart) {
    if (!measureState.dragging) return false;

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const xValue = chart.scales.x.getValueForPixel(x);
    const yValue = chart.scales.y.getValueForPixel(y);

    if (measureState.dragging === 'point1') {
        measureState.point1 = { x: xValue, y: yValue };
    } else if (measureState.dragging === 'point2') {
        measureState.point2 = { x: xValue, y: yValue };
    }

    updateMeasureResults();
    chart.update('none');
    return true;
}

// Terminer le déplacement
function handleMeasureMouseUp() {
    if (measureState.dragging) {
        measureState.dragging = null;
        return true;
    }
    return false;
}

// Mettre à jour les résultats
function updateMeasureResults() {
    if (!measureState.point1 || !measureState.point2) return;

    const dx = Math.abs(measureState.point2.x - measureState.point1.x);
    const dy = Math.abs(measureState.point2.y - measureState.point1.y);

    // Affichage selon l'échelle de temps
    let dxText;
    if (dx < 1000) {
        dxText = dx.toFixed(2) + ' ms';
    } else {
        dxText = (dx / 1000).toFixed(3) + ' s';
    }

    document.getElementById('measure-dx').textContent = dxText;
    document.getElementById('measure-dy').textContent = dy.toFixed(3) + ' ' + (appState.yAxisLabel || '');
}

// Dessiner les points de mesure et les lignes
function drawMeasurePoints(chart) {
    if (!measureState.active) return;
    if (!measureState.point1 && !measureState.point2) return;

    const ctx = chart.ctx;
    const xAxis = chart.scales.x;
    const yAxis = chart.scales.y;

    ctx.save();

    // Dessiner le point 1
    if (measureState.point1) {
        const x1 = xAxis.getPixelForValue(measureState.point1.x);
        const y1 = yAxis.getPixelForValue(measureState.point1.y);

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
    if (measureState.point2) {
        const x2 = xAxis.getPixelForValue(measureState.point2.x);
        const y2 = yAxis.getPixelForValue(measureState.point2.y);

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
    if (measureState.point1 && measureState.point2) {
        const x1 = xAxis.getPixelForValue(measureState.point1.x);
        const y1 = yAxis.getPixelForValue(measureState.point1.y);
        const x2 = xAxis.getPixelForValue(measureState.point2.x);
        const y2 = yAxis.getPixelForValue(measureState.point2.y);

        ctx.strokeStyle = '#FFD93D';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Calculer les différences
        const dx = Math.abs(measureState.point2.x - measureState.point1.x);
        const dy = Math.abs(measureState.point2.y - measureState.point1.y);

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
