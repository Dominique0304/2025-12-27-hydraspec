const fftCache = new Map();

// IMPORTANT : Variable globale pour stocker les graphiques Chart.js
// Indépendante du Proxy appState pour garantir l'accessibilité
window.globalCharts = {
    time: null,
    freq: null,
    spectro: null
};

// Variable globale pour la taille de police des textes dans les graphiques
window.chartFontSize = 12;

// --- CHARTS INITIALIZATION ---
function initCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: { padding: { top: 20, right: 10, bottom: 0, left: 0 } },
        plugins: {
            legend: { display: false },
            tooltip: {
                // Tooltips désactivés par défaut, activés/désactivés via le paramètre utilisateur
                enabled: typeof uiState !== 'undefined' ? uiState.tooltipsEnabled : false
            }
        },
        scales: {
            x: { grid: { color: '#333' }, ticks: { color: '#aaa' } },
            y: { grid: { color: '#333' }, ticks: { color: '#aaa' } }
        }
    };

// Time Chart
const ctxTime = document.getElementById('timeChart').getContext('2d');
const timeChart = new Chart(ctxTime, {
    type: 'line',
    data: { 
        labels: [], 
        datasets: [{ 
            label: 'P', 
            data: [], 
            borderColor: '#2196F3', 
            borderWidth: 1, 
            pointRadius: 0 
        }] 
    },
    options: { 
        ...commonOptions, 
        interaction: { mode: 'nearest', intersect: false },
        scales: { 
            x: {
                type: 'linear',
                grid: { color: '#333' },
                ticks: {
                    color: '#aaa',
                    font: {
                        size: window.chartFontSize,
                        weight: 'normal'
                    },
                    callback: function(v) {
                        // Conversion dynamique selon le canal X actuel
                        const xInfo = typeof getXAxisInfo === 'function' ? getXAxisInfo() : { scale: 1000, unit: 's', isTime: true };

                        if (xInfo.isTime) {
                            // Axe X = Temps: afficher en secondes avec format intelligent
                            return (v/1000 < 60) ? (v/1000).toFixed(2)+"s" : (v/1000).toFixed(0)+"s";
                        } else {
                            // Axe X = Canal: afficher la valeur avec l'unité
                            const displayValue = (v / xInfo.scale).toFixed(2);
                            return xInfo.unit ? `${displayValue} ${xInfo.unit}` : displayValue;
                        }
                    }
                }
            },
            y: {
                grid: { color: '#333' },
                ticks: {
                    color: '#aaa',
                    font: {
                        size: window.chartFontSize,
                        weight: 'normal'
                    },
                    callback: function(value) {
                        // Limiter à 4 décimales maximum
                        return Number(value.toFixed(4));
                    }
                },
                // AJOUT DU TITRE DE L'AXE Y
                title: {
                    display: true,
                    text: 'Pression (Bar)', // Valeur par défaut
                    color: '#aaa',
                    font: {
                        size: window.chartFontSize,
                        weight: 'normal'
                    }
                }
            }
        }
    },
    plugins: [{
        id: 'cursors',
        afterDraw: (chart) => drawCursors(chart)
    }, {
        id: 'annotationConnectors',
        afterDatasetsDraw: (chart) => {
            if (typeof drawAnnotationConnectors === 'function') {
                drawAnnotationConnectors(chart);
            }
            // Mettre à jour les positions des boîtes d'annotation pour qu'elles suivent le graphique
            if (typeof updateAnnotationPositions === 'function') {
                updateAnnotationPositions(chart);
            }
        }
    }, {
        id: 'intervals',
        afterDatasetsDraw: (chart) => {
            if (typeof drawIntervals === 'function') {
                drawIntervals(chart);
            }
        }
    }, {
        id: 'measureTool',
        afterDraw: (chart) => {
            if (typeof drawMeasurePoints === 'function') {
                drawMeasurePoints(chart);
            }
        }
    }, {
        id: 'diffCanalTool',
        afterDraw: (chart) => {
            if (typeof drawDiffCanalIntervals === 'function') {
                drawDiffCanalIntervals(chart);
            }
        }
    }, {
        id: 'rulerTool',
        afterDraw: (chart) => {
            if (typeof drawRulerPoint === 'function') {
                drawRulerPoint(chart);
            }
        }
    }, {
        id: 'trackTool',
        afterDraw: (chart) => {
            if (typeof drawTrackCursor === 'function') {
                drawTrackCursor(chart);
            }
        }
    }, {
        id: 'snapPointTool',
        afterDraw: (chart) => {
            if (typeof drawSnapPoints === 'function') {
                drawSnapPoints(chart);
            }
        }
    }]
});
// Stocker dans globalCharts et appState.charts
window.globalCharts.time = timeChart;
appState.charts.time = timeChart;

    // Freq Chart
    const ctxFreq = document.getElementById('freqChart').getContext('2d');
    const freqChart = new Chart(ctxFreq, {
        type: 'line',
        data: { 
            labels: [], 
            datasets: [{ 
                label: 'Amp', 
                data: [], 
                borderColor: '#4CAF50', 
                backgroundColor: 'rgba(76, 175, 80, 0.2)', 
                fill: true, 
                borderWidth: 1, 
                pointRadius: 0 
            }] 
        },
        options: { 
            ...commonOptions, 
            scales: { 
                y: { beginAtZero: true }, 
                x: { 
                    type: 'linear', 
                    min: 0, 
                    grid: { color: '#333' }, 
                    ticks: { color: '#aaa' } 
                } 
            } 
        },
        plugins: [{
            id: 'peakLabels',
            afterDatasetsDraw: (chart) => drawPeaks(chart)
        }]
    });
    // Stocker dans globalCharts et appState.charts
    window.globalCharts.freq = freqChart;
    appState.charts.freq = freqChart;

    // Spectrogram Chart
    const ctxSpectro = document.getElementById('spectroChart').getContext('2d');
    const spectroChart = new Chart(ctxSpectro, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Spectrogram',
                data: [],
                pointRadius: 1,
                pointBackgroundColor: []
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Temps (s)',
                        color: '#aaa',
                        font: { size: window.chartFontSize }
                    },
                    grid: { color: '#333' },
                    ticks: {
                        color: '#aaa',
                        font: { size: window.chartFontSize }
                    }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: '(Hz)',
                        color: '#aaa',
                        font: { size: window.chartFontSize }
                    },
                    grid: { color: '#333' },
                    ticks: {
                        color: '#aaa',
                        font: { size: window.chartFontSize }
                    }
                }
            },
            interaction: {
                mode: 'nearest',  // Afficher seulement le point le plus proche
                intersect: false
            },
            plugins: {
                legend: {
                    display: false  // Masquer la légende "Spectrogram"
                },
                tooltip: {
                    enabled: typeof uiState !== 'undefined' ? uiState.tooltipsEnabled : true,
                    callbacks: {
                        label: function(context) {
                            return `T: ${context.parsed.x.toFixed(2)}s, F: ${context.parsed.y.toFixed(1)}Hz, A: ${context.raw.v.toFixed(3)}`;
                        }
                    }
                }
            }
        }
    });
    // Stocker dans globalCharts et appState.charts
    window.globalCharts.spectro = spectroChart;
    appState.charts.spectro = spectroChart;
}

// --- RESIZERS ---
function setupResizers() {
    setupResizer('resizer1', 'time-container');
    setupResizer('resizer2', 'freq-container');
}

function setupResizer(resizerId, panelId) {
    const resizer = document.getElementById(resizerId);
    const panel = document.getElementById(panelId);
    let isResizing = false;
    let startY, startHeight;

    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        startY = e.clientY;
        startHeight = parseInt(document.defaultView.getComputedStyle(panel).height, 10);
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        const dy = e.clientY - startY;
        const newHeight = startHeight + dy;
        
        // Limiter la hauteur minimale et maximale
        if (newHeight > 100 && newHeight < window.innerHeight - 200) {
            panel.style.height = newHeight + 'px';
            
            // Redimensionner les graphiques après un petit délai
            setTimeout(() => {
                if (appState.charts.time) appState.charts.time.resize();
                if (appState.charts.freq) appState.charts.freq.resize();
                if (appState.charts.spectro) appState.charts.spectro.resize();
            }, 10);
        }
    });

    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
        }
    });
}

// --- DRAWING HELPERS ---
function drawCursors(chart) {
    if (!appState.fullDataTime.length) return;

    // Ne pas afficher les curseurs si le graphique fréquentiel est masqué
    if (typeof uiState !== 'undefined' && !uiState.freqVisible) return;

    const ctx = chart.ctx;
    const xAxis = chart.scales.x;
    const yAxis = chart.scales.y;

    const xStart = xAxis.getPixelForValue(appState.cursorStart * 1000);
    const xEnd = xAxis.getPixelForValue(appState.cursorEnd * 1000);

    ctx.save();
    
    // Zone de sélection
    ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
    ctx.fillRect(xStart, yAxis.top, xEnd - xStart, yAxis.bottom - yAxis.top);
    
    // Curseur vert (début) - ligne plus épaisse
    ctx.beginPath();
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]); // Pointillés plus espacés
    ctx.moveTo(xStart, yAxis.top);
    ctx.lineTo(xStart, yAxis.bottom);
    ctx.stroke();
    
    // Curseur rouge (fin) - ligne plus épaisse
    ctx.beginPath();
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]); // Pointillés plus espacés
    ctx.moveTo(xEnd, yAxis.top);
    ctx.lineTo(xEnd, yAxis.bottom);
    ctx.stroke();
    
    ctx.restore();
}

function drawPeaks(chart) {
    const ctx = chart.ctx;
    const xAxis = chart.scales.x;
    const yAxis = chart.scales.y;

    ctx.save();
    ctx.textAlign = 'center';
    const theme = document.body.getAttribute('data-theme');
    ctx.fillStyle = theme === 'light' ? '#000000' : (theme === 'steampunk' ? '#d4af37' : '#e0e0e0');
    ctx.font = `bold ${window.chartFontSize}px sans-serif`;

    const threshold = parseInt(document.getElementById('peak-threshold').value);

    // Vérifier si nous avons des résultats FFT multi-canaux
    if (appState.fftResults && appState.fftResults.length > 0) {
        // Mode multi-canaux: afficher les pics de chaque canal avec sa couleur
        appState.fftResults.forEach((fftData, index) => {
            if (!fftData.result || !fftData.mags || fftData.mags.length === 0) return;

            // Calculer le maxAmp pour ce canal
            const yValues = fftData.mags.map(d => d.y);
            const maxAmp = Math.max(...yValues);
            const limit = maxAmp * (100 - threshold) / 100;

            // Obtenir l'axe Y correspondant pour ce canal
            const yAxisID = fftData.yAxisID || 'y';
            const yAxis = chart.scales[yAxisID];
            if (!yAxis) return;

            // Définir la couleur du texte selon le canal
            ctx.fillStyle = fftData.config.color;

            // Afficher les pics de ce canal
            fftData.result.peaks.forEach(peak => {
                if (peak.amp > limit) {
                    const x = xAxis.getPixelForValue(peak.freq);
                    const y = yAxis.getPixelForValue(peak.amp);
                    const yPos = Math.max(y - 5, 12);
                    if(x >= xAxis.left && x <= xAxis.right) {
                        ctx.fillText(`${peak.freq.toFixed(1)}Hz`, x, yPos);
                    }
                }
            });
        });
    } else if (chart.data.datasets[0] && chart.data.datasets[0].data.length > 0) {
        // Mode simple (ancien comportement pour compatibilité)
        let maxAmp = 0;
        const data = chart.data.datasets[0].data;
        for(let i=0; i<data.length; i++) if(data[i].y > maxAmp) maxAmp = data[i].y;

        const limit = maxAmp * (100 - threshold) / 100;

        if (appState.allPeaks) {
            appState.allPeaks.forEach(peak => {
                if (peak.amp > limit) {
                    const x = xAxis.getPixelForValue(peak.freq);
                    const y = yAxis.getPixelForValue(peak.amp);
                    const yPos = Math.max(y - 5, 12);
                    if(x >= xAxis.left && x <= xAxis.right) {
                        ctx.fillText(`${peak.freq.toFixed(1)}Hz`, x, yPos);
                    }
                }
            });
        }
    }
    ctx.restore();
}

// --- INTERACTIONS ---
function setupCanvasInteractions() {
    const canvas = document.getElementById('timeChart');
    const freqCanvas = document.getElementById('freqChart');

    // Gestion du zoom avec la molette (existant)
    canvas.addEventListener('wheel', (e) => { 
        e.preventDefault(); 
        handleZoom(appState.charts.time, e); 
    });
    
    freqCanvas.addEventListener('wheel', (e) => { 
        e.preventDefault(); 
        handleFreqZoom(appState.charts.freq, e); 
    });

// Gestion du clic souris
canvas.addEventListener('mousedown', (e) => {
    const chart = appState.charts.time;

    // Priorité 0: Zoom par sélection de quadrillage
    if (typeof handleGridZoomClick === 'function') {
        if (handleGridZoomClick(e, chart, canvas)) {
            return; // Le zoom par sélection a géré le clic
        }
    }

    // Priorité 1: Outil de déplacement
    if (typeof handlePanClick === 'function') {
        if (handlePanClick(e, chart)) {
            return; // L'outil de déplacement a géré le clic
        }
    }

    // Priorité 2: Outil de mesure
    if (typeof handleMeasureClick === 'function') {
        if (handleMeasureClick(e, chart)) {
            return; // L'outil de mesure a géré le clic
        }
    }

    // Priorité 2a: Drag des points Diff/Canal
    if (typeof handleDiffCanalMouseDown === 'function') {
        if (handleDiffCanalMouseDown(e, chart)) {
            return; // Le drag d'un point Diff/Canal a commencé
        }
    }

    // Priorité 2b: Outil Diff/Canal (création)
    if (typeof handleDiffCanalClick === 'function') {
        if (handleDiffCanalClick(e, chart)) {
            return; // L'outil Diff/Canal a géré le clic
        }
    }

    // Priorité 2b2: Drag des marqueurs (SnapPoint)
    if (typeof handleSnapPointMouseDown === 'function') {
        if (handleSnapPointMouseDown(e, chart)) {
            return; // Le drag d'un marqueur a commencé
        }
    }

    // Priorité 2c: Outil Marqueur (création snappoint)
    if (typeof handleSnapPointClick === 'function') {
        if (handleSnapPointClick(e, chart)) {
            return; // L'outil Marqueur a géré le clic
        }
    }

    // Priorité 3: Outil règle (mesurer)
    if (typeof handleRulerClick === 'function') {
        if (handleRulerClick(e, chart)) {
            return; // L'outil règle a géré le clic
        }
    }

    // Priorité 4: Outil Traquer
    if (typeof handleTrackClick === 'function') {
        if (handleTrackClick(e, chart)) {
            return; // L'outil Traquer a géré le clic
        }
    }

    // Priorité 5a: Outil Interval (création)
    if (typeof handleIntervalClick === 'function') {
        if (handleIntervalClick(e, chart)) {
            return; // L'outil Interval a géré le clic (création)
        }
    }

    // Priorité 5b: Drag d'interval (AVANT les curseurs FFT!)
    if (typeof handleIntervalMouseDown === 'function') {
        if (handleIntervalMouseDown(e, chart)) {
            return; // Le drag d'interval a géré le clic
        }
    }

    const rect = canvas.getBoundingClientRect();
    const xPixel = e.clientX - rect.left; // Position X en pixels
    const yPixel = e.clientY - rect.top;  // Position Y en pixels

    // Tolérance en pixels - ajustable selon vos préférences
    const pixelTol = 120; // 12 pixels de tolérance (plus facile à cliquer)

    // Vérifier si on est dans la zone Y du graphique
    const chartTop = chart.scales.y.top;
    const chartBottom = chart.scales.y.bottom;
    const isInChartY = yPixel >= chartTop && yPixel <= chartBottom;

    if (!isInChartY) return; // Ignorer les clics en dehors du graphique verticalement
    
    // Calculer les positions des curseurs en pixels
    const cursorStartPixel = chart.scales.x.getPixelForValue(appState.cursorStart * 1000);
    const cursorEndPixel = chart.scales.x.getPixelForValue(appState.cursorEnd * 1000);
    
    // Distances en pixels aux curseurs
    const distToStartPx = Math.abs(xPixel - cursorStartPixel);
    const distToEndPx = Math.abs(xPixel - cursorEndPixel);

    if (e.shiftKey) {
        // Shift + clic entre curseurs → déplacer les 2 curseurs
        const isBetweenCursors = xPixel > cursorStartPixel && xPixel < cursorEndPixel;
        
        if (isBetweenCursors) {
            appState.isDragging = true;
            appState.dragTarget = 'both';
            appState.dragStartX = e.clientX;
            appState.dragStartCursorStart = appState.cursorStart;
            appState.dragStartCursorEnd = appState.cursorEnd;
        }
        // Shift + clic ailleurs → PAN (déplacement de la vue)
        else {
            appState.isDragging = true;
            appState.dragTarget = 'pan';
            appState.lastX = e.clientX;
            appState.lastY = e.clientY;
        }
    } else {
        // Sans Shift → seulement déplacer les curseurs individuels
        // Vérifier la proximité avec la tolérance en pixels
        if (distToStartPx <= pixelTol && distToStartPx <= distToEndPx) { 
            appState.isDragging = true; 
            appState.dragTarget = 'start'; 
            console.log("Attrapé curseur début", {distToStartPx, pixelTol});
        }
        else if (distToEndPx <= pixelTol && distToEndPx <= distToStartPx) { 
            appState.isDragging = true; 
            appState.dragTarget = 'end'; 
            console.log("Attrapé curseur fin", {distToEndPx, pixelTol});
        }
        // Si on ne clique pas assez près d'un curseur, ne rien faire
        // (le pan sans Shift n'est plus possible)
    }
});

// Gestion du clic droit (menu contextuel)
canvas.addEventListener('contextmenu', (e) => {
    const chart = appState.charts.time;

    // Priorité 1: Menu contextuel des marqueurs (SnapPoint)
    if (typeof handleSnapPointContextMenu === 'function') {
        if (handleSnapPointContextMenu(e, chart)) {
            e.preventDefault(); // Empêcher le menu contextuel du navigateur
            return;
        }
    }

    // Autres outils pourraient avoir leur menu contextuel ici
});

    // Gestion du déplacement souris
    canvas.addEventListener('mousemove', (e) => {
        const chart = appState.charts.time;

        // Priorité 0: Gérer le drag du zoom par sélection
        if (typeof handleGridZoomDrag === 'function') {
            if (handleGridZoomDrag(e, chart, canvas)) {
                return; // Le zoom par sélection a géré le mouvement
            }
        }

        // Priorité 1: Gérer le drag de l'outil de déplacement
        if (typeof handlePanDrag === 'function') {
            if (handlePanDrag(e, chart, canvas)) {
                return; // L'outil de déplacement a géré le mouvement
            }
        }

        // Priorité 2: Gérer le drag de l'outil de mesure
        if (typeof handleMeasureDrag === 'function') {
            if (handleMeasureDrag(e, chart)) {
                return; // L'outil de mesure a géré le mouvement
            }
        }

        // Priorité 2.3: Gérer le drag des points Diff/Canal
        if (typeof handleDiffCanalMouseMove === 'function') {
            if (handleDiffCanalMouseMove(e, chart)) {
                return; // Le drag d'un point Diff/Canal a géré le mouvement
            }
        }

        // Priorité 2.4: Gérer le drag des marqueurs (SnapPoint)
        if (typeof handleSnapPointMouseMove === 'function') {
            handleSnapPointMouseMove(e, chart);
        }

        // Priorité 2.5: Gérer le drag des intervals
        if (typeof handleIntervalMouseMove === 'function') {
            if (handleIntervalMouseMove(e, chart)) {
                return; // Le drag d'interval a géré le mouvement
            }
        }

        // Priorité 3: Gérer le drag de l'outil règle
        if (typeof handleRulerDrag === 'function') {
            if (handleRulerDrag(e, chart, canvas)) {
                return; // L'outil règle a géré le mouvement
            }
        }

        // Priorité 4: Gérer le tracking (outil traquer)
        if (typeof handleTrackMove === 'function') {
            if (handleTrackMove(e, chart, canvas)) {
                return; // L'outil de tracking a géré le mouvement
            }
        }

        if (!appState.isDragging) return;
        const rect = canvas.getBoundingClientRect();
        
        if (appState.dragTarget === 'pan') {
            const dx = e.clientX - appState.lastX;
            const dy = e.clientY - appState.lastY;

            // Déplacement horizontal
            const dxVal = (chart.scales.x.max - chart.scales.x.min) * (dx / canvas.width);
            chart.options.scales.x.min -= dxVal;
            chart.options.scales.x.max -= dxVal;

            // Déplacement vertical sur TOUTES les échelles Y
            Object.keys(chart.scales).forEach(scaleKey => {
                if (scaleKey.startsWith('y')) {
                    const scale = chart.scales[scaleKey];
                    const dyVal = (scale.max - scale.min) * (dy / canvas.height);
                    chart.options.scales[scaleKey].min += dyVal;
                    chart.options.scales[scaleKey].max += dyVal;
                }
            });

            appState.lastX = e.clientX;
            appState.lastY = e.clientY;
            chart.update('none');

            // Mise à jour immédiate des champs de zoom
            updateZoomInputs();
        }
        else if (appState.dragTarget === 'both') {
            const dx = e.clientX - appState.dragStartX;
            const dxVal = (chart.scales.x.max - chart.scales.x.min) * (dx / canvas.width) / 1000;
            
            const newStart = appState.dragStartCursorStart + dxVal;
            const newEnd = appState.dragStartCursorEnd + dxVal;
            
            const maxTime = appState.fullDataTime[appState.fullDataTime.length-1] / 1000;
            if (newStart >= 0 && newEnd <= maxTime) {
                appState.cursorStart = newStart;
                appState.cursorEnd = newEnd;
                updateStats();
                chart.update('none');
                
                // Mettre à jour l'analyse FFT en temps réel
                if(!appState.fftTimeout) {
                    appState.fftTimeout = setTimeout(() => { 
                        performAnalysis(); 
                        appState.fftTimeout = null; 
                    }, 50);
                }
            }
        }
        else {
            let newVal = chart.scales.x.getValueForPixel(e.clientX - rect.left) / 1000;
            newVal = Math.max(0, Math.min(newVal, appState.fullDataTime[appState.fullDataTime.length-1]/1000));
            
            const minGap = 0.01;
            
            if (appState.dragTarget === 'start') {
                newVal = Math.min(newVal, appState.cursorEnd - minGap);
                appState.cursorStart = newVal;
            }
            else if (appState.dragTarget === 'end') {
                newVal = Math.max(newVal, appState.cursorStart + minGap);
                appState.cursorEnd = newVal;
            }
            
            updateStats();
            chart.update('none');
            
            // ⚡ CORRECTION : Remettre le timeout FFT pour les curseurs individuels
            if(!appState.fftTimeout) {
                appState.fftTimeout = setTimeout(() => { 
                    performAnalysis(); 
                    appState.fftTimeout = null; 
                }, 50);
            }
        }
    });

    // Gestion du relâchement souris (existant)
    window.addEventListener('mouseup', (e) => {
        // Priorité 0: Gérer le relâchement du zoom par sélection
        if (typeof handleGridZoomRelease === 'function') {
            handleGridZoomRelease(e, appState.charts.time, canvas);
        }

        // Priorité 1: Gérer le relâchement de l'outil de déplacement
        if (typeof handlePanMouseUp === 'function') {
            handlePanMouseUp();
        }

        // Priorité 2: Gérer le relâchement de l'outil de mesure
        if (typeof handleMeasureMouseUp === 'function') {
            handleMeasureMouseUp();
        }

        // Priorité 2.3: Gérer le relâchement du drag des points Diff/Canal
        if (typeof handleDiffCanalMouseUp === 'function') {
            handleDiffCanalMouseUp(e, appState.charts.time);
        }

        // Priorité 2.4: Gérer le relâchement du drag des marqueurs (SnapPoint)
        if (typeof handleSnapPointMouseUp === 'function') {
            handleSnapPointMouseUp(e, appState.charts.time);
        }

        // Priorité 2.5: Gérer le relâchement du drag d'interval
        if (typeof handleIntervalMouseUp === 'function') {
            handleIntervalMouseUp(e, appState.charts.time);
        }

        // Priorité 3: Gérer le relâchement de l'outil règle
        if (typeof handleRulerMouseUp === 'function') {
            handleRulerMouseUp();
        }

        // Priorité 4: Gérer le relâchement de l'outil Traquer
        if (typeof handleTrackMouseUp === 'function') {
            handleTrackMouseUp();
        }

        if(appState.isDragging) {
            appState.isDragging = false;
            appState.dragTarget = null;
            // Mise à jour finale des champs de zoom
            updateZoomInputs();
        }
    });
}

function handleZoom(chart, e) {
    // Vérifier si les modes de zoom personnalisés doivent gérer cet événement
    if (typeof handleCustomZoom === 'function') {
        const delta = e.deltaY;
        if (handleCustomZoom(e, chart, delta)) {
            return; // Le mode de zoom personnalisé a géré l'événement
        }
    }

    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 : -1;
    const rangeX = chart.scales.x.max - chart.scales.x.min;
    const centerX = (chart.scales.x.min + chart.scales.x.max) / 2;

    // Détection des modificateurs
    const zoomYTopOnly = e.altKey;           // Alt : zoom Y vers le haut uniquement (yMin fixe)
    const zoomX = !e.ctrlKey && !e.altKey;  // Zoom X si ni Ctrl ni Alt
    const zoomY = !e.shiftKey && !e.altKey; // Zoom Y normal si ni Shift ni Alt

    if (zoomX) {
        // Récupérer la position de la souris sur le canvas
        const rect = chart.canvas.getBoundingClientRect();
        const mouseXPixel = e.clientX - rect.left;

        // Convertir la position pixel en valeur de données X
        const xScale = chart.scales.x;
        const mouseXValue = xScale.getValueForPixel(mouseXPixel);

        // Calculer la position relative de la souris dans la plage actuelle (0 = gauche, 1 = droite)
        const ratio = (mouseXValue - xScale.min) / rangeX;

        // Calculer la nouvelle plage
        const newRangeX = direction > 0 ? rangeX * zoomFactor : rangeX / zoomFactor;

        if(newRangeX > 0.000001) {
            // Zoomer en gardant la position de la souris fixe
            // Le point sous la souris reste au même endroit
            chart.options.scales.x.min = mouseXValue - newRangeX * ratio;
            chart.options.scales.x.max = mouseXValue + newRangeX * (1 - ratio);
        }
    }

    if (zoomY) {
        // Zoom Y centré (mode normal)
        Object.keys(chart.scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                const scale = chart.scales[scaleKey];
                const rangeY = scale.max - scale.min;
                const centerY = (scale.min + scale.max) / 2;
                const newRangeY = direction > 0 ? rangeY * zoomFactor : rangeY / zoomFactor;

                if(newRangeY > 0.000001) {
                    chart.options.scales[scaleKey].min = centerY - newRangeY / 2;
                    chart.options.scales[scaleKey].max = centerY + newRangeY / 2;
                }
            }
        });
    }

    if (zoomYTopOnly) {
        // Zoom Y asymétrique : yMin reste fixe, seul yMax change
        // Utilisé pour garder la base (ex: 0 ou valeur minimale) et zoomer vers le haut
        Object.keys(chart.scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                const scale = chart.scales[scaleKey];
                const yMin = scale.min;  // Valeur minimale actuelle (fixe)
                const yMax = scale.max;  // Valeur maximale actuelle (variable)
                const rangeY = yMax - yMin;

                // Calculer le nouveau yMax (yMin reste inchangé)
                const newRangeY = direction > 0 ? rangeY * zoomFactor : rangeY / zoomFactor;
                const newYMax = yMin + newRangeY;

                if(newRangeY > 0.000001) {
                    chart.options.scales[scaleKey].min = yMin;  // yMin reste fixe
                    chart.options.scales[scaleKey].max = newYMax;  // Seul yMax change
                }
            }
        });
    }

    // CRITIQUE: Recalculer le downsampling dynamique après le zoom
    // On appelle updateTimeChart() pour recalculer les données affichées selon la nouvelle plage
    if (typeof updateTimeChart === 'function') {
        updateTimeChart();
        console.log("🔄 Downsampling recalculé après zoom");
    } else {
        // Fallback si updateTimeChart n'est pas disponible
        chart.update('none');
    }

    // METTRE À JOUR LES CHAMPS DE ZOOM APRÈS CHAQUE ZOOM
    setTimeout(updateZoomInputs, 10);
}
function handleFreqZoom(chart, e) {
    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 : -1;
    const currentMax = chart.scales.x.max;
    const newMax = direction > 0 ? currentMax * zoomFactor : currentMax / zoomFactor;
    
    if(newMax > 1) {
        chart.options.scales.x.min = 0;
        chart.options.scales.x.max = newMax;
        chart.update('none');
    }
}

// --- CHART DATA UPDATES ---
function updateTimeChart(isInitialLoad = false) {
    // Afficher les containers de graphiques (masqués par défaut)
    const timeContainer = document.getElementById('time-container');
    const freqContainer = document.getElementById('freq-container');
    if (timeContainer) timeContainer.style.display = '';
    if (freqContainer) freqContainer.style.display = '';

    // Masquer Fréquence et Spectro par défaut UNIQUEMENT à l'ouverture initiale d'un fichier
    // Ne pas fermer lors du changement de canal
    if (isInitialLoad && typeof uiState !== 'undefined') {
        if (uiState.freqVisible && typeof toggleFreqDomain === 'function') {
            toggleFreqDomain();
        }
        if (uiState.spectroVisible && typeof toggleSpectrogram === 'function') {
            toggleSpectrogram();
        }
    }

    // Synchroniser le select du thème avec le thème actuel à l'ouverture
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = currentTheme;
    }

    // Désactiver les tooltips à l'ouverture (case décochée et fonction inactive)
    if (typeof toggleTooltipsEnabled === 'function') {
        const toggle = document.getElementById('tooltip-enabled-toggle');
        if (toggle && toggle.checked) {
            // Si les tooltips sont activés, les désactiver
            toggle.checked = false;
            toggleTooltipsEnabled();
        }
    }

    // Essayer le mode multi-canaux d'abord
    if (typeof updateTimeChartMultiChannel === 'function') {
        const multiChannelSuccess = updateTimeChartMultiChannel();
        if (multiChannelSuccess) {
            // Mode multi-canaux utilisé avec succès
            document.getElementById('display-n-config').textContent = appState.fullDataTime.length;
            setTimeout(updateZoomInputs, 10);
            return;
        }
    }

    // Sinon, utiliser le mode simple (un seul canal)
    const chart = appState.charts.time;
    let t = appState.fullDataTime;
    let v = appState.fullDataPressure;
    if(t.length > 15000) {
        const step = Math.ceil(t.length/15000);
        t = t.filter((_,i)=>i%step===0);
        v = v.filter((_,i)=>i%step===0);
    }
    chart.data.labels = Array.from(t);
    chart.data.datasets[0].data = Array.from(v);

    // Configurer les échelles X
    // Vérifier si l'utilisateur a défini des valeurs personnalisées
    const zoomMinInput = document.getElementById('zoom-min');
    const zoomMaxInput = document.getElementById('zoom-max');
    const userMinX = zoomMinInput ? parseFloat(zoomMinInput.value) : NaN;
    const userMaxX = zoomMaxInput ? parseFloat(zoomMaxInput.value) : NaN;

    // Utiliser les valeurs utilisateur si valides, sinon utiliser les valeurs par défaut
    if (!isNaN(userMinX) && !isNaN(userMaxX) && userMinX < userMaxX) {
        chart.options.scales.x.min = userMinX * 1000; // Convertir s en ms
        chart.options.scales.x.max = userMaxX * 1000;
    } else {
        chart.options.scales.x.min = t[0];
        chart.options.scales.x.max = t[t.length-1];
    }

    // Calculer les limites Y automatiquement
    const minY = Math.min(...v);
    const maxY = Math.max(...v);
    const rangeY = maxY - minY;
    chart.options.scales.y.min = minY - rangeY * 0.1;
    chart.options.scales.y.max = maxY + rangeY * 0.1;

    // METTRE À JOUR LE LABEL DE L'AXE Y SI DISPONIBLE
    if (appState.yAxisLabel) {
        chart.options.scales.y.title.text = appState.yAxisLabel;
    }

    chart.update();
    document.getElementById('display-n-config').textContent = appState.fullDataTime.length;

    // Mettre à jour les champs de zoom
    setTimeout(updateZoomInputs, 10);

    // ✅ NOUVEAU : Mettre à jour les annotations
    if (typeof updateAnnotationsDisplay === 'function') {
        setTimeout(updateAnnotationsDisplay, 50);
    }
}
function updateStats() {
    const t = appState.fullDataTime;
    const v = appState.fullDataPressure;
    const i1 = t.findIndex(val => val >= appState.cursorStart*1000);
    let i2 = t.findIndex(val => val >= appState.cursorEnd*1000);
    if(i2 === -1) i2 = t.length;
    if(i1 >= i2) return;
    
    const slice = v.slice(i1, i2);
    let min=Infinity, max=-Infinity, sum=0, sqSum=0;
    for(let x of slice) {
        if(x<min) min=x;
        if(x>max) max=x;
        sum+=x;
        sqSum+=x*x;
    }
    const mean = sum/slice.length;
    const rms = Math.sqrt(sqSum/slice.length);
    const std = Math.sqrt(slice.reduce((a,b)=>a+(b-mean)**2,0)/slice.length);

    document.getElementById('stat-min').textContent = min.toFixed(2);
    document.getElementById('stat-max').textContent = max.toFixed(2);
    document.getElementById('stat-mean').textContent = mean.toFixed(2);
    document.getElementById('stat-std').textContent = std.toFixed(2);
 document.getElementById('res-rms').textContent = rms.toFixed(1) + " " + appState.yAxisLabel;
}

// Fonction helper pour calculer la FFT d'un canal
function computeFFTForChannel(raw, N, win, res) {
    const mean = raw.reduce((a,b)=>a+b,0)/raw.length;

    const input = new Float32Array(N);
    for(let i=0; i<N; i++) {
        if(i<raw.length) {
            let w = 1;
            if(win==='hanning') w=0.5*(1-Math.cos(2*Math.PI*i/(raw.length-1)));
            else if(win==='hamming') w=0.54-0.46*Math.cos(2*Math.PI*i/(raw.length-1));
            else if(win==='blackman') w=0.42-0.5*Math.cos(2*Math.PI*i/(raw.length-1))+0.08*Math.cos(4*Math.PI*i/(raw.length-1));
            input[i] = (raw[i]-mean)*w;
        }
    }

    const re = new Float32Array(input);
    const im = new Float32Array(N).fill(0);

    // FFT
    let j=0;
    for(let i=0; i<N; i++) {
        if(i<j) { [re[i],re[j]]=[re[j],re[i]]; [im[i],im[j]]=[im[j],im[i]]; }
        let m=N>>1; while(j>=m && m>0){ j-=m; m>>=1; } j+=m;
    }
    for(let m=2; m<=N; m<<=1) {
        let wr = Math.cos(-2*Math.PI/m);
        let wi = Math.sin(-2*Math.PI/m);
        for(let k=0; k<N; k+=m) {
            let w_r=1, w_i=0;
            for(let j=0; j<m/2; j++) {
                let tr=w_r*re[k+j+m/2]-w_i*im[k+j+m/2];
                let ti=w_r*im[k+j+m/2]+w_i*re[k+j+m/2];
                re[k+j+m/2]=re[k+j]-tr; im[k+j+m/2]=im[k+j]-ti;
                re[k+j]+=tr; im[k+j]+=ti;
                let temp=w_r*wr-w_i*wi; w_i=w_r*wi+w_i*wr; w_r=temp;
            }
        }
    }

    const mags = [];
    const peaks = [];
    let maxV=0, maxI=0;

    for(let i=0; i<N/2; i++) {
        const mag = 2*Math.sqrt(re[i]**2 + im[i]**2)/raw.length;
        mags.push({x: i*res, y: mag});
        if(i>1 && mag > mags[i-1].y) {
            if(mag > maxV) { maxV=mag; maxI=i; }
        }
    }

    for(let i=1; i<mags.length-1; i++) {
        if(mags[i].y > mags[i-1].y && mags[i].y > mags[i+1].y) {
            peaks.push({freq: mags[i].x, amp: mags[i].y});
        }
    }

    return {
        mags,
        peaks,
        peakFreq: maxI*res,
        peakAmp: maxV
    };
}

function performAnalysis() {
    console.log("📊 performAnalysis called - Cursors:", appState.cursorStart, "s to", appState.cursorEnd, "s");

    const t = appState.fullDataTime;
    const cursorStartMs = appState.cursorStart * 1000;
    const cursorEndMs = appState.cursorEnd * 1000;

    console.log("📍 Analyzing data between CURSORS:", cursorStartMs.toFixed(2), "ms to", cursorEndMs.toFixed(2), "ms");

    const i1 = t.findIndex(val => val >= cursorStartMs);
    let i2 = t.findIndex(val => val >= cursorEndMs);

    if(i2 === -1) i2 = t.length;

    console.log("Found indices:", i1, "to", i2, "out of", t.length, "points");

    if(i1 === -1 || i1 >= i2) {
        console.log("Invalid selection - skipping analysis");
        return;
    }

    // Mode multi-canaux
    if (appState.channelConfig && appState.channelConfig.length > 0) {
        const fftChannels = appState.channelConfig.filter(config => config.visible && config.showFFT);

        if (fftChannels.length === 0) {
            // Aucun canal FFT sélectionné, vider le graphique
            appState.charts.freq.data.datasets = [];
            appState.charts.freq.update('none');
            return;
        }

        const N = parseInt(document.getElementById('fft-size').value);
        const win = document.getElementById('window-func').value;
        const res = appState.fs/N;

        // **NOUVEAU: Utiliser le Web Worker si disponible**
        if (typeof fftWorkerManager !== 'undefined' && fftWorkerManager.initialized && !fftWorkerManager.fallbackMode) {
            performAnalysisAsync(fftChannels, N, win, res, i1, i2);
            return;
        }

        // **FALLBACK: Mode synchrone classique**
        performAnalysisSync(fftChannels, N, win, res, i1, i2);
        return;
    }

    // Mode simple (ancien comportement - pas de channelConfig)
    const v = appState.fullDataPressure;
    const raw = Array.from(v.slice(i1, i2));
    console.log("Data slice length:", raw.length);

    if(raw.length < 2) {
        console.log("Not enough data points - clearing FFT");
        appState.charts.freq.data.datasets[0].data = [];
        appState.fftResults = null;
        appState.charts.freq.update('none');
        return;
    }

    const N = parseInt(document.getElementById('fft-size').value);
    const win = document.getElementById('window-func').value;
    const res = appState.fs/N;

    const result = computeFFTForChannel(raw, N, win, res);

    appState.fftResults = null;
    appState.allPeaks = result.peaks;
    appState.peakFreq = result.peakFreq;
    appState.peakAmp = result.peakAmp;
    document.getElementById('res-peak').textContent = appState.peakFreq.toFixed(1)+" Hz";
    document.getElementById('res-amp').textContent = appState.peakAmp.toFixed(1) + " : " + appState.yAxisLabel;

    appState.charts.freq.data.datasets[0].data = result.mags;
    appState.charts.freq.update('none');

    console.log("✅ FFT Analysis Completed - Peak:", appState.peakFreq.toFixed(1), "Hz");
}

// **NOUVEAU: Version asynchrone avec Web Worker**
async function performAnalysisAsync(fftChannels, N, win, res, i1, i2) {
    try {
        console.log('🚀 Calcul FFT asynchrone (Web Worker)');

        // Préparer les données pour le worker
        const channels = fftChannels.map((config, index) => {
            const channelData = appState.allColumnData[config.index];
            const raw = Array.from(channelData.slice(i1, i2));

            return {
                raw: raw,
                config: config,
                yAxisID: `y-freq${index}`
            };
        });

        // Lancer le calcul dans le worker
        const fftResults = await fftWorkerManager.computeFFT(
            channels,
            N,
            win,
            appState.fs,
            (progress, current, total) => {
                console.log(`📊 FFT Progress: ${progress.toFixed(0)}% (${current}/${total})`);
            }
        );

        // Mettre à jour l'interface avec les résultats
        updateFFTChartWithResults(fftResults);

    } catch (error) {
        console.error('❌ Erreur calcul FFT async:', error);
        showError('Erreur calcul FFT: ' + error.message);

        // Fallback en mode synchrone
        performAnalysisSync(fftChannels, N, win, res, i1, i2);
    }
}

// **REFACTORISATION: Version synchrone (code original)**
function performAnalysisSync(fftChannels, N, win, res, i1, i2) {
    console.log('📊 Calcul FFT synchrone (mode classique)');

    // Calculer la FFT pour chaque canal sélectionné
    const fftResults = fftChannels.map((config, index) => {
        const channelData = appState.allColumnData[config.index];
        const raw = Array.from(channelData.slice(i1, i2));

        if(raw.length < 2) {
            return {
                config: config,
                result: null,
                mags: [],
                yAxisID: `y-freq${index}`
            };
        }

        const result = computeFFTForChannel(raw, N, win, res);

        return {
            config: config,
            result: result,
            mags: result.mags,
            yAxisID: `y-freq${index}`
        };
    });

    // Mettre à jour l'interface avec les résultats
    updateFFTChartWithResults(fftResults);
}

// **NOUVEAU: Fonction commune pour mettre à jour le graphique FFT**
function updateFFTChartWithResults(fftResults) {
    // Créer les datasets avec yAxisID
    appState.charts.freq.data.datasets = fftResults.map(fftData => {
        return {
            label: fftData.config.label,
            data: fftData.mags,
            borderColor: fftData.config.color,
            backgroundColor: fftData.config.color + '20',
            borderWidth: fftData.config.lineWidth || 1,
            pointRadius: 0,
            fill: false,
            yAxisID: fftData.yAxisID
        };
    });

    // Supprimer les anciennes échelles Y (sauf 'x')
    const oldScales = Object.keys(appState.charts.freq.options.scales).filter(key => key !== 'x');
    oldScales.forEach(key => {
        delete appState.charts.freq.options.scales[key];
    });

    // Créer les échelles Y pour chaque canal FFT
    fftResults.forEach((fftData, index) => {
        if (fftData.mags.length === 0) return; // Pas de données

        // Extraire les valeurs y pour calculer min/max
        const yValues = fftData.mags.map(d => d.y);
        const dataMin = Math.min(...yValues);
        const dataMax = Math.max(...yValues);
        const range = dataMax - dataMin;
        const yMin = dataMin - range * 0.1;
        const yMax = dataMax + range * 0.1;

        // Utiliser la position configurée pour le domaine fréquentiel
        // Utiliser yAxisPositionFFT si elle existe, sinon fallback sur yAxisPosition
        const position = fftData.config.yAxisPositionFFT || fftData.config.yAxisPosition;
        const isDisplayed = position !== 'hidden';

        // Créer l'échelle Y
        appState.charts.freq.options.scales[fftData.yAxisID] = {
            type: 'linear',
            position: isDisplayed ? position : 'left', // Si hidden, mettre left mais ne pas afficher
            display: isDisplayed,
            min: Math.max(0, yMin), // Pas de valeurs négatives pour FFT
            max: yMax,
            grid: {
                color: '#333',
                drawOnChartArea: index === 0 // Seulement la première échelle affiche la grille
            },
            ticks: {
                color: fftData.config.color,
                font: {
                    size: window.chartFontSize,
                    weight: 'normal'
                }
            },
            title: {
                display: true,
                text: fftData.config.label + (fftData.config.unit ? ` (${fftData.config.unit})` : ''),
                color: fftData.config.color,
                font: {
                    size: window.chartFontSize,
                    weight: 'normal'
                },
                rotation: (() => {
                    const rot = -270;  // -270° pour lire de bas en haut (tous les axes)
                    console.log(`[FFT Chart] Axe Y "${fftData.config.label}" - Position: ${position} - Rotation: ${rot}°`);
                    return rot;
                })()
            }
        };
    });

    // Créer une échelle 'y' pour compatibilité (cachée)
    if (fftResults.length > 0 && fftResults[0].mags.length > 0) {
        const yValues = fftResults[0].mags.map(d => d.y);
        const dataMin = Math.min(...yValues);
        const dataMax = Math.max(...yValues);
        const range = dataMax - dataMin;
        const yMin = dataMin - range * 0.1;
        const yMax = dataMax + range * 0.1;

        appState.charts.freq.options.scales.y = {
            type: 'linear',
            position: 'left',
            display: false, // Cachée car on affiche déjà y-freq0
            min: Math.max(0, yMin),
            max: yMax
        };
    }

    // Stocker les résultats FFT de tous les canaux pour l'affichage des pics
    appState.fftResults = fftResults;

    // Mettre à jour le pic principal (du premier canal)
    if (fftResults.length > 0 && fftResults[0].result) {
        appState.allPeaks = fftResults[0].result.peaks;
        appState.peakFreq = fftResults[0].result.peakFreq;
        appState.peakAmp = fftResults[0].result.peakAmp;
        document.getElementById('res-peak').textContent = appState.peakFreq.toFixed(1)+" Hz";
        document.getElementById('res-amp').textContent = appState.peakAmp.toFixed(1) + " " + (fftResults[0].config.unit || appState.yAxisLabel);
    }

    appState.charts.freq.update('none');
    console.log("✅ FFT Multi-Channel Analysis Completed");
}

// Ajouter cette fonction pour gérer le redimensionnement quand un graphique est masqué
function updateChartSizes() {
    // Cette fonction est maintenant dans app.js, mais on peut laisser un alias ici
    if (typeof window.updateChartSizes === 'function') {
        window.updateChartSizes();
    }
}

 // Le reste du code reste identique...

function centerCursors() {
    console.log("🎯 centerCursors() called");

    const chart = window.globalCharts?.time;
    if (!chart || !appState.fullDataTime.length) {
        console.error("❌ Cannot center cursors: chart or data not ready");
        setStatus("Aucune donnée à centrer");
        return;
    }

    // 1. Obtenir les limites VISIBLES sur l'axe X (en millisecondes)
    const visibleMin = chart.options.scales.x.min;  // Valeur minimale visible
    const visibleMax = chart.options.scales.x.max;  // Valeur maximale visible

    console.log("📏 Visible min:", visibleMin, "ms =", (visibleMin/1000).toFixed(3), "s");
    console.log("📏 Visible max:", visibleMax, "ms =", (visibleMax/1000).toFixed(3), "s");
    
    // 2. Calculer la largeur visible sur l'axe X
    const visibleWidth = visibleMax - visibleMin;  // en millisecondes
    
    console.log("DEBUG - Largeur visible:", visibleWidth, "ms =", visibleWidth/1000, "s");
    
    // 3. Calculer 10% de cette largeur (avec un minimum de 20ms = 0.02s)
    const tenPercentMs = Math.max(visibleWidth * 0.10, 20);  // 10% avec minimum 20ms
    const halfSpacingMs = tenPercentMs / 2;
    
    console.log("DEBUG - 10% de largeur:", tenPercentMs, "ms =", tenPercentMs/1000, "s");
    
    // 4. Calculer le centre de la fenêtre visible
    const viewportCenterMs = (visibleMin + visibleMax) / 2;
    
    console.log("DEBUG - Centre:", viewportCenterMs, "ms =", viewportCenterMs/1000, "s");
    
    // 5. Calculer les nouvelles positions (convertir en secondes)
    const newStart = (viewportCenterMs - halfSpacingMs) / 1000;  // en secondes
    const newEnd = (viewportCenterMs + halfSpacingMs) / 1000;    // en secondes
    
    console.log("DEBUG - Nouveau début:", newStart, "s");
    console.log("DEBUG - Nouveau fin:", newEnd, "s");
    
    // 6. Vérifier les limites totales des données
    const totalDuration = appState.fullDataTime[appState.fullDataTime.length - 1] / 1000;
    
    console.log("DEBUG - Durée totale:", totalDuration, "s");
    
    // 7. Appliquer les nouvelles positions (avec vérification)
    if (newStart >= 0 && newEnd <= totalDuration && newStart < newEnd) {
        appState.cursorStart = newStart;
        appState.cursorEnd = newEnd;

        console.log("✅ Cursors centered successfully:", newStart.toFixed(3), "s to", newEnd.toFixed(3), "s");

        // Mettre à jour les statistiques et le graphique
        updateStats();
        if (chart && chart.update) {
            chart.update('none');
        }

        const visibleSeconds = (visibleWidth / 1000).toFixed(3);
        const spacingSeconds = (tenPercentMs / 1000).toFixed(3);
        setStatus(`Curseurs centrés: ${spacingSeconds}s (10% de ${visibleSeconds}s visible)`);
    } else {
        // Ajustement si hors limites
        const adjustedStart = Math.max(0, newStart);
        const adjustedEnd = Math.min(totalDuration, newEnd);
        
        if (adjustedStart < adjustedEnd) {
            appState.cursorStart = adjustedStart;
            appState.cursorEnd = adjustedEnd;
            setStatus("Curseurs centrés (ajustés aux limites)");
        } else {
            // Fallback: centre des données complètes avec 10% de la durée totale
            const totalWidth = totalDuration * 1000;  // en ms
            const fallbackSpacing = Math.max(totalWidth * 0.10, 100) / 1000;  // 10% en secondes
            const totalCenter = totalDuration / 2;
            
            appState.cursorStart = Math.max(0, totalCenter - fallbackSpacing/2);
            appState.cursorEnd = Math.min(totalDuration, totalCenter + fallbackSpacing/2);
            setStatus("Curseurs centrés sur données complètes");
        }
    }
    
    // 8. Mettre à jour l'affichage
    chart.update('none');
    updateStats();
    
    // 9. Déclencher l'analyse FFT
    if (!appState.fftTimeout) {
        appState.fftTimeout = setTimeout(() => { 
            performAnalysis(); 
            appState.fftTimeout = null; 
        }, 50);
    }
    
    console.log("DEBUG - Curseurs mis à jour:", appState.cursorStart, "s à", appState.cursorEnd, "s");
}

// Fonction pour mettre à jour la taille de police de tous les textes dans les graphiques
function updateChartFontSize(value) {
    const fontSize = parseInt(value);
    if (isNaN(fontSize) || fontSize < 8 || fontSize > 24) {
        console.warn("⚠️ Taille de police invalide:", value);
        return;
    }

    // Mettre à jour la variable globale
    window.chartFontSize = fontSize;
    console.log(`✏️ Taille de police mise à jour: ${fontSize}px`);

    // Mettre à jour Chart.js - Time Chart
    if (window.globalCharts && window.globalCharts.time) {
        const timeChart = window.globalCharts.time;

        // Mettre à jour l'axe X
        if (timeChart.options.scales.x.ticks.font) {
            timeChart.options.scales.x.ticks.font.size = fontSize;
        }

        // Mettre à jour TOUS les axes Y (y, y-time0, y-time1, etc.)
        Object.keys(timeChart.options.scales).forEach(scaleId => {
            if (typeof scaleId === 'string' && scaleId.startsWith('y')) {
                if (timeChart.options.scales[scaleId].ticks && timeChart.options.scales[scaleId].ticks.font) {
                    timeChart.options.scales[scaleId].ticks.font.size = fontSize;
                }
                if (timeChart.options.scales[scaleId].title && timeChart.options.scales[scaleId].title.font) {
                    timeChart.options.scales[scaleId].title.font.size = fontSize;
                }
            }
        });

        timeChart.update('none');
    }

    // Mettre à jour Chart.js - Frequency Chart
    if (window.globalCharts && window.globalCharts.freq) {
        const freqChart = window.globalCharts.freq;

        // Mettre à jour tous les axes Y (y, y1, y2, y3...)
        Object.keys(freqChart.options.scales).forEach(scaleId => {
            if (typeof scaleId === 'string' && scaleId.startsWith('y')) {
                if (freqChart.options.scales[scaleId].ticks && freqChart.options.scales[scaleId].ticks.font) {
                    freqChart.options.scales[scaleId].ticks.font.size = fontSize;
                }
                if (freqChart.options.scales[scaleId].title && freqChart.options.scales[scaleId].title.display && freqChart.options.scales[scaleId].title.font) {
                    freqChart.options.scales[scaleId].title.font.size = fontSize;
                }
            }
        });

        // Mettre à jour l'axe X
        if (freqChart.options.scales.x && freqChart.options.scales.x.ticks && freqChart.options.scales.x.ticks.font) {
            freqChart.options.scales.x.ticks.font.size = fontSize;
        }

        freqChart.update('none');
    }

    // Mettre à jour Chart.js - Spectrogram Chart
    if (window.globalCharts && window.globalCharts.spectro) {
        const spectroChart = window.globalCharts.spectro;
        if (spectroChart.options.scales.x.ticks.font) {
            spectroChart.options.scales.x.ticks.font.size = fontSize;
        }
        if (spectroChart.options.scales.x.title && spectroChart.options.scales.x.title.font) {
            spectroChart.options.scales.x.title.font.size = fontSize;
        }
        if (spectroChart.options.scales.y.ticks.font) {
            spectroChart.options.scales.y.ticks.font.size = fontSize;
        }
        if (spectroChart.options.scales.y.title && spectroChart.options.scales.y.title.font) {
            spectroChart.options.scales.y.title.font.size = fontSize;
        }

        spectroChart.update('none');
    }

    // Sauvegarder dans le projet actif (via le Proxy appState)
    if (typeof appState !== 'undefined') {
        appState.chartFontSize = fontSize;
        console.log(`💾 Taille de police sauvegardée dans le projet : ${fontSize}px`);
    }

    console.log("✅ Toutes les polices des graphiques mises à jour");
}