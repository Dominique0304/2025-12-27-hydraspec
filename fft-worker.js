// =====================================
// WEB WORKER POUR CALCUL FFT
// =====================================
// Ce worker tourne dans un thread séparé pour ne pas bloquer l'UI

console.log('🔧 FFT Worker initialisé');

// Fonction de calcul FFT (copiée de charts.js)
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

    // FFT Cooley-Tukey
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
                re[k+j+m/2]=re[k+j]-tr;
                im[k+j+m/2]=im[k+j]-ti;
                re[k+j]+=tr; im[k+j]+=ti;
                let tw=w_r*wr-w_i*wi;
                w_i=w_r*wi+w_i*wr;
                w_r=tw;
            }
        }
    }

    // Magnitude
    const halfN = N/2 + 1;
    const mags = [];
    for(let i=0; i<halfN; i++) {
        const mag = Math.sqrt(re[i]*re[i] + im[i]*im[i]) / N * 2;
        mags.push({x: i*res, y: mag});
    }

    // Détection de pics
    const threshold = 0.01;
    const peaks = [];
    let maxI = 0, maxV = 0;

    for(let i=1; i<mags.length-1; i++) {
        const y = mags[i].y;
        if(y > mags[i-1].y && y > mags[i+1].y && y > threshold) {
            peaks.push({x: mags[i].x, y: y});
            if(y > maxV) {
                maxV = y;
                maxI = i;
            }
        }
    }

    return {
        mags,
        peaks,
        peakFreq: maxI*res,
        peakAmp: maxV
    };
}

// Écouter les messages du thread principal
self.onmessage = function(e) {
    const startTime = performance.now();

    try {
        const { jobId, channels, N, win, fs } = e.data;

        console.log(`🔄 Worker: Calcul FFT pour ${channels.length} canaux (N=${N})`);

        const res = fs / N;
        const results = [];

        // Calculer la FFT pour chaque canal
        channels.forEach((channel, index) => {
            const { raw, config, yAxisID } = channel;

            if (raw.length < 2) {
                results.push({
                    config: config,
                    result: null,
                    mags: [],
                    yAxisID: yAxisID
                });
                return;
            }

            // Calculer la FFT
            const result = computeFFTForChannel(raw, N, win, res);

            results.push({
                config: config,
                result: result,
                mags: result.mags,
                yAxisID: yAxisID
            });

            // Envoyer progression
            const progress = ((index + 1) / channels.length) * 100;
            self.postMessage({
                type: 'progress',
                jobId: jobId,
                progress: progress,
                current: index + 1,
                total: channels.length
            });
        });

        const duration = performance.now() - startTime;

        console.log(`✅ Worker: FFT terminée en ${duration.toFixed(1)}ms`);

        // Envoyer le résultat final
        self.postMessage({
            type: 'complete',
            jobId: jobId,
            results: results,
            duration: duration
        });

    } catch (error) {
        console.error('❌ Worker: Erreur FFT:', error);

        self.postMessage({
            type: 'error',
            jobId: e.data.jobId,
            error: error.message,
            stack: error.stack
        });
    }
};

// Gestion des erreurs globales du worker
self.onerror = function(error) {
    console.error('❌ Worker: Erreur globale:', error);
    self.postMessage({
        type: 'error',
        error: error.message
    });
};

console.log('✅ FFT Worker prêt');
