// --- SPECTROGRAM STFT FUNCTIONS ---
function computeSTFT(signal, fs, windowSize, overlap, scaleType) {
    const hopSize = Math.floor(windowSize * (1 - overlap));
    const numWindows = Math.floor((signal.length - windowSize) / hopSize) + 1;
    const freqs = new Array(windowSize / 2);
    const times = new Array(numWindows);
    const spectroData = [];

    // Pré-calcul des fréquences
    for (let i = 0; i < windowSize / 2; i++) {
        freqs[i] = (i * fs) / windowSize;
    }

    // Application de la STFT
    for (let w = 0; w < numWindows; w++) {
        const start = w * hopSize;
        const windowedSignal = new Float32Array(windowSize);

        // Application de la fenêtre de Hanning
        for (let i = 0; i < windowSize; i++) {
            const hanning = 0.5 * (1 - Math.cos(2 * Math.PI * i / (windowSize - 1)));
            windowedSignal[i] = signal[start + i] * hanning;
        }

        // Calcul de la FFT
        const fftResult = computeFFT(windowedSignal);
        times[w] = (start + windowSize / 2) / fs;

        // Traitement des magnitudes
        for (let i = 0; i < windowSize / 2; i++) {
            let magnitude = Math.sqrt(fftResult.re[i] ** 2 + fftResult.im[i] ** 2);

            // Application de l'échelle
            if (scaleType === 'log') {
                magnitude = Math.log1p(magnitude);
            } else if (scaleType === 'db') {
                magnitude = 20 * Math.log10(magnitude + 1e-10);
            }

            spectroData.push({
                x: times[w],
                y: freqs[i],
                v: magnitude
            });
        }
    }

    return spectroData;
}

function computeFFT(signal) {
    const N = signal.length;
    const re = new Float32Array(signal);
    const im = new Float32Array(N).fill(0);

    // Bit-reversal permutation
    let j = 0;
    for (let i = 0; i < N; i++) {
        if (i < j) {
            [re[i], re[j]] = [re[j], re[i]];
            [im[i], im[j]] = [im[j], im[i]];
        }
        let m = N >> 1;
        while (j >= m && m > 0) {
            j -= m;
            m >>= 1;
        }
        j += m;
    }

    // FFT computation
    for (let m = 2; m <= N; m <<= 1) {
        const theta = -2 * Math.PI / m;
        const wr = Math.cos(theta);
        const wi = Math.sin(theta);

        for (let k = 0; k < N; k += m) {
            let wRe = 1;
            let wIm = 0;

            for (let j = 0; j < m / 2; j++) {
                const tr = wRe * re[k + j + m / 2] - wIm * im[k + j + m / 2];
                const ti = wRe * im[k + j + m / 2] + wIm * re[k + j + m / 2];

                re[k + j + m / 2] = re[k + j] - tr;
                im[k + j + m / 2] = im[k + j] - ti;

                re[k + j] += tr;
                im[k + j] += ti;

                const temp = wRe * wr - wIm * wi;
                wIm = wRe * wi + wIm * wr;
                wRe = temp;
            }
        }
    }

    return { re, im };
}

/**
 * Restaure l'affichage du spectrogramme depuis les données déjà calculées
 * Utilisé lors du changement de projet pour éviter de recalculer
 */
function restoreSpectrogramDisplay() {
    if (!appState.spectroData || appState.spectroData.length === 0) {
        console.log("Aucune donnée spectrogramme à restaurer, calcul initial...");
        // Si pas de données, calculer le spectrogramme
        if (appState.fullDataPressure && appState.fullDataPressure.length > 0) {
            updateSpectrogram();
        } else {
            // Vider le graphique si pas de données
            if (window.globalCharts && window.globalCharts.spectro) {
                window.globalCharts.spectro.data.datasets[0].data = [];
                window.globalCharts.spectro.data.datasets[0].pointBackgroundColor = [];
                window.globalCharts.spectro.update('none');
            }
        }
        return;
    }

    console.log(`🔄 Restauration spectrogramme : ${appState.spectroData.length} points`);

    const freqMax = parseFloat(document.getElementById('stft-freq-max').value);

    // Filtrer par fréquence maximale et appliquer les couleurs
    const filteredData = [];
    const colors = [];

    let maxVal = 0;
    for (const point of appState.spectroData) {
        if (point.y <= freqMax && point.v > maxVal) {
            maxVal = point.v;
        }
    }

    for (const point of appState.spectroData) {
        if (point.y <= freqMax) {
            filteredData.push({
                x: point.x,
                y: point.y,
                v: point.v
            });

            // Calcul de la couleur basée sur l'amplitude
            const normalized = point.v / maxVal;
            colors.push(getColorForValue(normalized));
        }
    }

    // Mise à jour du graphique
    if (window.globalCharts && window.globalCharts.spectro) {
        window.globalCharts.spectro.data.datasets[0].data = filteredData;
        window.globalCharts.spectro.data.datasets[0].pointBackgroundColor = colors;

        // Mettre à jour le titre de l'axe Y avec le nom du canal
        const currentChannel = appState.availableColumns && appState.availableColumns[appState.currentColumnIndex];
        const channelName = currentChannel ? currentChannel.label : '';
        window.globalCharts.spectro.options.scales.y.title.text = channelName ? `${channelName} (Hz)` : '(Hz)';

        window.globalCharts.spectro.update('none');
    }
}

function updateSpectrogram() {

    if (!appState.fullDataPressure.length) {
        console.warn("Aucune donnée pour le spectrogramme");
        return;
    }


    if (!appState.fullDataPressure.length) return;

    const windowSize = parseInt(document.getElementById('stft-window-size').value);
    const overlap = parseFloat(document.getElementById('stft-overlap').value);
    const scaleType = document.getElementById('stft-scale').value;
    const freqMax = parseFloat(document.getElementById('stft-freq-max').value);

    //setStatus("Calcul du spectrogramme...");

    // Utiliser un timeout pour éviter de bloquer l'UI
    setTimeout(() => {
        const signal = appState.fullDataPressure;
        const fs = appState.fs;

        const spectroData = computeSTFT(signal, fs, windowSize, overlap, scaleType);
        appState.spectroData = spectroData;

        // Filtrer par fréquence maximale et appliquer les couleurs
        const filteredData = [];
        const colors = [];

        let maxVal = 0;
        for (const point of spectroData) {
            if (point.y <= freqMax && point.v > maxVal) {
                maxVal = point.v;
            }
        }

        for (const point of spectroData) {
            if (point.y <= freqMax) {
                filteredData.push({
                    x: point.x,
                    y: point.y,
                    v: point.v
                });

                // Calcul de la couleur basée sur l'amplitude
                const normalized = point.v / maxVal;
                colors.push(getColorForValue(normalized));
            }
        }

        // Mise à jour du graphique
        if (window.globalCharts && window.globalCharts.spectro) {
            window.globalCharts.spectro.data.datasets[0].data = filteredData;
            window.globalCharts.spectro.data.datasets[0].pointBackgroundColor = colors;

            // Mettre à jour le titre de l'axe Y avec le nom du canal
            const currentChannel = appState.availableColumns && appState.availableColumns[appState.currentColumnIndex];
            const channelName = currentChannel ? currentChannel.label : '';
            window.globalCharts.spectro.options.scales.y.title.text = channelName ? `${channelName} (Hz)` : '(Hz)';

            window.globalCharts.spectro.update();
        }

        setStatus("Spectrogramme calculé.");
    }, 100);
}

function getColorForValue(value) {
    // Échelle de couleur bleu-cyan-vert-jaune-rouge
    if (value < 0.25) {
        const intensity = Math.floor(value * 4 * 255);
        return `rgb(0, 0, ${intensity})`;
    } else if (value < 0.5) {
        const intensity = Math.floor((value - 0.25) * 4 * 255);
        return `rgb(0, ${intensity}, 255)`;
    } else if (value < 0.75) {
        const intensity = Math.floor((value - 0.5) * 4 * 255);
        return `rgb(${intensity}, 255, ${255 - intensity})`;
    } else {
        const intensity = Math.floor((value - 0.75) * 4 * 255);
        return `rgb(255, ${255 - intensity}, 0)`;
    }
}

function exportSpectrogram() {
    if (!appState.spectroData) {
        alert("Aucun spectrogramme à exporter.");
        return;
    }

    let content = "Temps(s)\tFrequence(Hz)\tAmplitude\n";
    for (const point of appState.spectroData) {
        content += `${point.x.toFixed(4)}\t${point.y.toFixed(2)}\t${point.v.toFixed(6)}\n`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spectrogram_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatus("Spectrogramme exporté.");
}
function setupSpectrogramAutoUpdate() {
    // Mettre à jour le spectrogramme automatiquement quand les paramètres changent
    document.getElementById('stft-window-size').addEventListener('change', updateSpectrogram);
    document.getElementById('stft-overlap').addEventListener('change', updateSpectrogram);
    document.getElementById('stft-scale').addEventListener('change', updateSpectrogram);
    document.getElementById('stft-freq-max').addEventListener('change', updateSpectrogram);
}