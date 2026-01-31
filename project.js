/**
 * HydraSpec Pro - Architecture POO
 * Classe Project : Encapsule toutes les données et fonctionnalités d'un projet
 *
 * Chaque instance de Project est complètement isolée :
 * - État indépendant (données, paramètres, curseurs, etc.)
 * - Graphiques Chart.js dédiés
 * - Méthodes encapsulées (pas d'effet de bord sur les autres projets)
 */

class Project {
    constructor(name = "Nouveau Projet") {
        // Identifiant unique
        this.id = `project_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        this.name = name;
        this.createdAt = new Date();

        // Informations de fichier (pour système HSP)
        this.fileType = null;        // 'csv' ou 'hsp'
        this.fileName = null;        // Nom du fichier avec extension
        this.filePath = null;        // Chemin complet (optionnel)
        this.isModified = false;     // Fichier modifié depuis dernière sauvegarde
        this.fileHandle = null;      // File System Access API handle (Chrome/Edge seulement)

        // État isolé pour CE projet uniquement
        this.state = {
            // Données brutes
            fs: 1000,
            fullDataTime: [],
            fullDataPressure: [],

            // Curseurs de sélection
            cursorStart: 1.0,
            cursorEnd: 2.0,

            // Résultats d'analyse
            peakFreq: 0,
            peakAmp: 0,
            rms: 0,
            allPeaks: [],

            // Multi-canaux
            yAxisLabel: "Pression (Bar)",
            availableColumns: [],
            currentColumnIndex: 0,
            allColumnData: [],
            columnNames: [],
            channelConfig: [],
            xAxisChannel: 0,

            // FFT
            fftResults: null,
            spectroData: null,

            // Paramètres
            timeIncrement: 1.0,
            chartFontSize: 12,

            // Aperçu du fichier
            rawFilePreview: "",

            // État d'interaction
            isDragging: false,
            dragTarget: null,
            dragStartX: 0,
            dragStartCursorStart: 0,
            dragStartCursorEnd: 0,
            lastX: 0,
            lastY: 0,
            fftTimeout: null
        };

        // États des outils isolés pour CE projet
        this.toolsState = {
            // Intervals
            intervals: [],
            isCreatingInterval: false,
            pendingIntervalData: null,
            nextIntervalId: 1,
            intervalDragState: {
                active: false,
                interval: null,
                dragType: null,
                initialMouseY: 0
            },
            currentEditingInterval: null,

            // Measure Tool
            measureTool: {
                active: false,
                point1: null,
                point2: null,
                dragging: null
            },

            // Annotations
            annotations: [],
            isCreatingAnnotation: false,
            tempAnnotation: null,
            currentHoveredAnnotation: null,
            annotationsVisible: true,
            currentAnnotationFormat: {
                bold: false,
                italic: false,
                underline: false,
                fontSize: 0.85
            },
            pendingAnnotationData: null,

            // Pan Tool
            panTool: {
                active: false,
                dragging: false,
                lastX: 0,
                lastY: 0,
                mode: 'free',
                y0Active: false,
                zoomMode: null
            },
            gridZoomState: {
                active: false,
                startX: null,
                startY: null,
                endX: null,
                endY: null
            },

            // Ruler Tool
            rulerTool: {
                active: false,
                point: null,
                dragging: false
            },

            // Track Tool
            trackTool: {
                active: false,
                currentX: null,
                values: {},
                locked: false,
                dragging: false
            },

            // Diff Canal Tool
            diffCanal: {
                intervals: [],
                isCreating: false,
                selectedChannelIndex: null,
                pendingPoint: null,
                nextId: 1,
                state: {
                    active: false,
                    dragging: null,
                    draggedInterval: null,
                    dragStartX: 0,
                    dragStartY: 0
                }
            },

            // Calculated Channels
            currentEditingCalculatedChannelId: null,

            // Smoothing
            currentEditingChannelId: null,

            // Chart Zoom Limits (CRITIQUE !)
            chartLimits: {
                time: {
                    x: { min: null, max: null },
                    y: {} // {y: {min, max}, y2: {min, max}, ...}
                },
                freq: {
                    x: { min: null, max: null },
                    y: {}
                },
                spectro: {
                    x: { min: null, max: null },
                    y: {}
                }
            },

            // Notes utilisateur
            notes: ""
        };

        // Graphiques Chart.js isolés
        this.charts = {
            time: null,
            freq: null,
            spectro: null
        };

        // Conteneur DOM (sera créé dynamiquement)
        this.container = null;
        this.isActive = false;

        // ========================================
        // MANAGERS ORIENTÉS OBJET (Architecture POO)
        // ========================================
        // Remplacent les variables globales par une gestion encapsulée
        this.snapPointManager = new SnapPointManager(this);
        this.intervalManager = new IntervalManager(this);
        this.diffCanalManager = new DiffCanalManager(this);

        console.log(`✅ Projet créé: ${this.name} [ID: ${this.id}]`);
    }

    // ========================================
    // GESTION DES DONNÉES
    // ========================================

    /**
     * Charge des données depuis un fichier CSV
     * @param {File} file - Fichier CSV
     * @returns {Promise<Object>} Informations sur les données chargées
     */
    async loadCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n').filter(l => l.trim());

                    if (lines.length < 2) {
                        reject(new Error("Fichier CSV invalide"));
                        return;
                    }

                    // Stocker les 5 premières lignes brutes pour l'aperçu
                    this.state.rawFilePreview = lines.slice(0, 5).join('\n');

                    // Mettre à jour le nom du projet avec le nom du fichier
                    this.name = file.name.replace(/\.[^/.]+$/, "");

                    // Détection du séparateur
                    const firstLine = lines[0];
                    let separator = firstLine.includes(';') ? ';' :
                        firstLine.includes(',') ? ',' :
                        firstLine.includes('\t') ? '\t' : ';';

                    // Vérifier l'en-tête
                    const hasHeader = isNaN(parseFloat(firstLine.split(separator)[0]));

                    // Extraire les noms de colonnes
                    let columnNames = [];
                    let startLine = 0;

                    if (hasHeader) {
                        columnNames = firstLine.split(separator).map(part => part.trim());
                        startLine = 1;
                    } else {
                        const firstData = lines[0].split(separator);
                        columnNames = ['Temps'];
                        for (let i = 1; i < firstData.length; i++) {
                            columnNames.push(`Colonne ${i}`);
                        }
                    }

                    // Préparer le stockage des données
                    const allData = Array.from({ length: columnNames.length }, () => []);
                    let validLines = 0;

                    // Parser les données
                    for (let i = startLine; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;

                        const parts = line.split(separator);
                        if (parts.length >= columnNames.length) {
                            let isValid = true;

                            for (let j = 0; j < columnNames.length; j++) {
                                const val = parseFloat(parts[j].replace(',', '.'));
                                if (isNaN(val)) {
                                    isValid = false;
                                    break;
                                }
                                allData[j].push(val);
                            }

                            if (isValid) validLines++;
                        }
                    }

                    if (validLines < 2) {
                        reject(new Error("Pas assez de données valides"));
                        return;
                    }

                    // Configurer l'état
                    this.state.columnNames = columnNames;
                    this.state.allColumnData = allData;
                    this.state.availableColumns = [];

                    // Préparer les colonnes disponibles (sauf temps)
                    for (let i = 1; i < columnNames.length; i++) {
                        let label = columnNames[i].replace(/\[.*?\]/g, '').trim();
                        const unitMatch = columnNames[i].match(/\[(.*?)\]/);
                        if (unitMatch && !label.includes('(')) {
                            label += ` (${unitMatch[1]})`;
                        }

                        this.state.availableColumns.push({
                            index: i,
                            name: columnNames[i],
                            label: label
                        });
                    }

                    this.state.currentColumnIndex = 0;

                    // Configurer les données temps
                    const timeData = allData[0];
                    const timeInMs = timeData.map(t => t * 1000);
                    this.state.fullDataTime = new Float32Array(timeInMs);

                    // Calculer l'incrément et Fs
                    if (timeData.length >= 2) {
                        let totalDiff = 0;
                        let count = 0;

                        for (let i = 1; i < timeData.length; i++) {
                            const diff = timeData[i] - timeData[i - 1];
                            if (diff > 0) {
                                totalDiff += diff;
                                count++;
                            }
                        }

                        const avgIncrementSec = count > 0 ? totalDiff / count : 0.001;
                        const avgIncrementMs = avgIncrementSec * 1000;

                        this.state.fs = 1000 / avgIncrementMs;
                        this.state.timeIncrement = avgIncrementMs / 1000;
                    } else {
                        this.state.fs = 1000;
                        this.state.timeIncrement = 0.001;
                    }

                    // Charger la première colonne de données par défaut
                    if (allData.length > 1) {
                        this.state.fullDataPressure = new Float32Array(allData[1]);
                        this.state.yAxisLabel = this.state.availableColumns[0].label;
                    }

                    // Définir les curseurs initiaux
                    const duration = this.state.fullDataTime[this.state.fullDataTime.length - 1] / 1000;
                    this.state.cursorStart = duration * 0.2;
                    this.state.cursorEnd = duration * 0.8;

                    console.log(`📂 CSV chargé: ${validLines} lignes, ${columnNames.length} colonnes`);
                    console.log(`   Fs: ${this.state.fs.toFixed(1)} Hz, Durée: ${duration.toFixed(2)}s`);

                    resolve({
                        lines: validLines,
                        columns: columnNames.length,
                        duration: duration,
                        fs: this.state.fs
                    });

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
            reader.readAsText(file);
        });
    }

    // ========================================
    // GESTION DES FICHIERS HSP
    // ========================================

    /**
     * Marque le projet comme modifié
     */
    markModified() {
        if (this.fileType === 'hsp') {
            this.isModified = true;
            console.log(`📝 Projet ${this.name} marqué comme modifié`);
        }
    }

    /**
     * Marque le projet comme sauvegardé
     */
    markSaved() {
        this.isModified = false;
        console.log(`💾 Projet ${this.name} marqué comme sauvegardé`);
    }

    /**
     * Définit les informations de fichier
     * @param {string} fileType - 'csv' ou 'hsp'
     * @param {string} fileName - Nom du fichier avec extension
     * @param {string} filePath - Chemin complet (optionnel)
     */
    setFileInfo(fileType, fileName, filePath = null) {
        this.fileType = fileType;
        this.fileName = fileName;
        this.filePath = filePath;
        this.isModified = false;
        console.log(`📄 Fichier défini: ${fileType} - ${fileName}`);
    }

    /**
     * Exporte les données en CSV
     * @returns {string} Contenu CSV
     */
    exportCSV() {
        let csv = "Temps(s);Pression(Bar)\n";

        const n = this.state.fullDataTime.length;
        for (let i = 0; i < n; i++) {
            const t = (this.state.fullDataTime[i] / 1000).toFixed(6);
            const v = this.state.fullDataPressure[i].toFixed(6);
            csv += `${t};${v}\n`;
        }

        console.log(`💾 Export CSV: ${n} lignes`);
        return csv;
    }

    // ========================================
    // GESTION DES GRAPHIQUES
    // ========================================

    /**
     * Initialise les graphiques Chart.js pour ce projet
     * @param {Object} canvasElements - Éléments canvas {time, freq, spectro}
     */
    initCharts(canvasElements) {
        // Cette méthode sera implémentée dans la prochaine étape
        // Elle créera des instances Chart.js isolées pour ce projet
        console.log(`📊 Initialisation des graphiques pour ${this.name}`);
    }

    /**
     * Détruit tous les graphiques et libère la mémoire
     */
    destroyCharts() {
        if (this.charts.time) {
            this.charts.time.destroy();
            this.charts.time = null;
        }
        if (this.charts.freq) {
            this.charts.freq.destroy();
            this.charts.freq = null;
        }
        if (this.charts.spectro) {
            this.charts.spectro.destroy();
            this.charts.spectro = null;
        }
        console.log(`🗑️ Graphiques détruits pour ${this.name}`);
    }

    // ========================================
    // NETTOYAGE
    // ========================================

    /**
     * Détruit complètement le projet et libère toutes les ressources
     */
    destroy() {
        console.log(`🗑️ Destruction du projet: ${this.name}`);

        // Détruire les graphiques
        this.destroyCharts();

        // Nettoyer le conteneur DOM
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        // Libérer la mémoire des gros tableaux
        this.state.fullDataTime = null;
        this.state.fullDataPressure = null;
        this.state.allColumnData = null;

        // Marquer comme inactif
        this.isActive = false;

        console.log(`✅ Projet ${this.name} détruit et mémoire libérée`);
    }

    // ========================================
    // UTILITAIRES
    // ========================================

    /**
     * Retourne un résumé du projet
     * @returns {Object} Informations du projet
     */
    getInfo() {
        const duration = this.state.fullDataTime.length > 0
            ? (this.state.fullDataTime[this.state.fullDataTime.length - 1] / 1000).toFixed(2)
            : 0;

        return {
            id: this.id,
            name: this.name,
            createdAt: this.createdAt,
            isActive: this.isActive,
            dataPoints: this.state.fullDataTime.length,
            duration: duration,
            fs: this.state.fs,
            channels: this.state.availableColumns.length
        };
    }

    /**
     * Clone l'état du projet (pour sauvegarde/restauration)
     * @returns {Object} État cloné
     */
    cloneState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Restaure l'état du projet depuis un clone
     * @param {Object} stateClone - État à restaurer
     */
    restoreState(stateClone) {
        this.state = JSON.parse(JSON.stringify(stateClone));
        console.log(`♻️ État restauré pour ${this.name}`);
    }
}

// Rendre la classe disponible globalement
if (typeof window !== 'undefined') {
    window.Project = Project;
}

console.log("📦 Module Project chargé");
