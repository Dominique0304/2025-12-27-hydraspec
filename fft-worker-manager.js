// =====================================
// GESTIONNAIRE WEB WORKER FFT
// =====================================
// Gère l'utilisation du Web Worker FFT de manière simple et robuste

class FFTWorkerManager {
    constructor() {
        this.worker = null;
        this.initialized = false;
        this.jobId = 0;
        this.pendingJobs = new Map();
        this.fallbackMode = false; // Si worker indisponible, utiliser mode classique
    }

    /**
     * Initialiser le worker
     */
    init() {
        if (this.initialized) return;

        try {
            // Vérifier support des Web Workers
            if (typeof Worker === 'undefined') {
                console.warn('⚠️ Web Workers non supportés, utilisation mode classique');
                this.fallbackMode = true;
                return;
            }

            // Créer le worker
            this.worker = new Worker('fft-worker.js');

            // Gérer les messages du worker
            this.worker.onmessage = (e) => {
                this.handleWorkerMessage(e.data);
            };

            // Gérer les erreurs du worker
            this.worker.onerror = (error) => {
                console.error('❌ Erreur Worker FFT:', error);
                showError('Erreur calcul FFT: ' + error.message);

                // Nettoyer les jobs en attente
                this.pendingJobs.forEach((job) => {
                    if (job.reject) {
                        job.reject(error);
                    }
                });
                this.pendingJobs.clear();
            };

            this.initialized = true;
            console.log('✅ FFT Worker Manager initialisé');

        } catch (error) {
            console.error('❌ Impossible d\'initialiser le worker:', error);
            this.fallbackMode = true;
        }
    }

    /**
     * Gérer les messages du worker
     */
    handleWorkerMessage(data) {
        const { type, jobId } = data;

        const job = this.pendingJobs.get(jobId);
        if (!job) {
            console.warn('⚠️ Job inconnu:', jobId);
            return;
        }

        switch (type) {
            case 'progress':
                // Mettre à jour la progression
                if (job.onProgress) {
                    job.onProgress(data.progress, data.current, data.total);
                }
                if (job.loadingId) {
                    updateLoadingProgress(job.loadingId, data.progress,
                        `Calcul FFT canal ${data.current}/${data.total}...`);
                }
                break;

            case 'complete':
                // Calcul terminé
                console.log(`✅ FFT Job ${jobId} terminé en ${data.duration.toFixed(1)}ms`);

                if (job.loadingId) {
                    hideLoading(job.loadingId);
                }

                if (job.resolve) {
                    job.resolve(data.results);
                }

                this.pendingJobs.delete(jobId);

                // Notification optionnelle
                if (data.duration > 1000) {
                    showSuccess(`FFT calculée en ${(data.duration/1000).toFixed(1)}s`);
                }
                break;

            case 'error':
                // Erreur pendant le calcul
                console.error('❌ Erreur FFT Job:', data.error);

                if (job.loadingId) {
                    hideLoading(job.loadingId);
                }

                if (job.reject) {
                    job.reject(new Error(data.error));
                }

                this.pendingJobs.delete(jobId);
                showError('Erreur calcul FFT: ' + data.error);
                break;
        }
    }

    /**
     * Calculer la FFT de manière asynchrone
     * @param {Array} channels - Tableaux des canaux à traiter
     * @param {number} N - Taille FFT
     * @param {string} win - Fenêtre d'apodisation
     * @param {number} fs - Fréquence d'échantillonnage
     * @param {Function} onProgress - Callback de progression (optionnel)
     * @returns {Promise<Array>} Résultats FFT
     */
    async computeFFT(channels, N, win, fs, onProgress = null) {
        // Mode fallback: utiliser la fonction classique
        if (this.fallbackMode || !this.initialized) {
            console.log('📊 Calcul FFT classique (fallback mode)');
            return this.computeFFTFallback(channels, N, win, fs);
        }

        // Créer un nouveau job
        const currentJobId = ++this.jobId;

        console.log(`🔄 Lancement FFT Job ${currentJobId} (${channels.length} canaux)`);

        // Afficher loading si plus de 2 canaux ou N > 8192
        let loadingId = null;
        if (channels.length > 2 || N > 8192) {
            loadingId = showLoading('Calcul FFT en cours...', true);
        }

        return new Promise((resolve, reject) => {
            // Stocker le job
            this.pendingJobs.set(currentJobId, {
                resolve,
                reject,
                onProgress,
                loadingId,
                startTime: Date.now()
            });

            // Envoyer au worker
            this.worker.postMessage({
                jobId: currentJobId,
                channels: channels,
                N: N,
                win: win,
                fs: fs
            });
        });
    }

    /**
     * Mode fallback: calcul FFT classique (bloquant)
     */
    computeFFTFallback(channels, N, win, fs) {
        console.log('⚠️ Mode fallback: calcul FFT synchrone');

        const res = fs / N;
        const results = [];

        channels.forEach((channel) => {
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

            // Utiliser la fonction globale computeFFTForChannel
            const result = computeFFTForChannel(raw, N, win, res);

            results.push({
                config: config,
                result: result,
                mags: result.mags,
                yAxisID: yAxisID
            });
        });

        return Promise.resolve(results);
    }

    /**
     * Annuler tous les jobs en cours
     */
    cancelAll() {
        this.pendingJobs.forEach((job, jobId) => {
            if (job.loadingId) {
                hideLoading(job.loadingId);
            }
            if (job.reject) {
                job.reject(new Error('Job annulé'));
            }
        });
        this.pendingJobs.clear();
        console.log('🛑 Tous les jobs FFT annulés');
    }

    /**
     * Terminer le worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.initialized = false;
            console.log('🛑 FFT Worker terminé');
        }
    }

    /**
     * Obtenir l'état du worker
     */
    getStatus() {
        return {
            initialized: this.initialized,
            fallbackMode: this.fallbackMode,
            pendingJobs: this.pendingJobs.size,
            supported: typeof Worker !== 'undefined'
        };
    }
}

// Instance globale
const fftWorkerManager = new FFTWorkerManager();

// Initialiser au chargement de la page
window.addEventListener('load', () => {
    fftWorkerManager.init();
    console.log('🔧 FFT Worker Manager status:', fftWorkerManager.getStatus());
});

// Nettoyer au déchargement
window.addEventListener('beforeunload', () => {
    fftWorkerManager.terminate();
});
