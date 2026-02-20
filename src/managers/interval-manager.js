/**
 * INTERVAL-MANAGER.JS
 * Classe Manager pour encapsuler la gestion des intervalles
 * Remplace les variables globales par une gestion orientée objet
 */

class IntervalManager {
    constructor(project) {
        this.project = project;

        // État des intervalles (plus de variables globales !)
        this.intervals = [];
        this.nextIntervalId = 1;
        this.isCreating = false;
        this.pendingIntervalData = null;

        // État du drag
        this.dragState = {
            active: false,
            interval: null,
            dragType: null, // 'start', 'end', 'height'
            initialMouseY: 0
        };

        // Intervalle en cours d'édition
        this.currentEditing = null;
    }

    /**
     * Créer un nouvel intervalle
     */
    create(startTime, endTime, comment = '', yPosition = 0.5) {
        const interval = new Interval(
            this.nextIntervalId++,
            startTime,
            endTime,
            comment,
            yPosition
        );
        this.intervals.push(interval);
        return interval;
    }

    /**
     * Obtenir tous les intervalles
     */
    getAll() {
        return this.intervals;
    }

    /**
     * Obtenir un intervalle par ID
     */
    getById(id) {
        return this.intervals.find(i => i.id === id);
    }

    /**
     * Supprimer un intervalle
     */
    delete(id) {
        const index = this.intervals.findIndex(i => i.id === id);
        if (index !== -1) {
            this.intervals.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Supprimer tous les intervalles
     */
    deleteAll() {
        this.intervals = [];
    }

    /**
     * Commencer la création d'un intervalle
     */
    startCreating(startTime) {
        this.isCreating = true;
        this.pendingIntervalData = { startTime };
    }

    /**
     * Terminer la création d'un intervalle
     */
    finishCreating(endTime, comment = '') {
        if (!this.pendingIntervalData) return null;

        const interval = this.create(
            this.pendingIntervalData.startTime,
            endTime,
            comment
        );

        this.isCreating = false;
        this.pendingIntervalData = null;

        return interval;
    }

    /**
     * Annuler la création en cours
     */
    cancelCreating() {
        this.isCreating = false;
        this.pendingIntervalData = null;
    }

    /**
     * Charger les intervalles depuis des données sauvegardées
     */
    load(savedData) {
        if (!savedData) return;

        // CRITIQUE: Recréer les instances de la classe Interval
        this.intervals = [];
        if (savedData.intervals && savedData.intervals.length > 0) {
            savedData.intervals.forEach(data => {
                const interval = new Interval(data.id, data.startTime, data.endTime, data.comment, data.yPosition);
                interval.color = data.color;
                interval.visible = data.visible;
                interval.fontSize = data.fontSize;
                interval.fontWeight = data.fontWeight;
                interval.fontStyle = data.fontStyle;
                interval.textDecoration = data.textDecoration;
                this.intervals.push(interval);
            });
        }

        this.nextIntervalId = savedData.nextIntervalId || 1;
        this.isCreating = savedData.isCreating || false;
        this.pendingIntervalData = savedData.pendingIntervalData || null;

        console.log(`📏 Chargé ${this.intervals.length} intervalle(s) (instances Interval créées)`);
    }

    /**
     * Sauvegarder les intervalles
     */
    save() {
        return {
            intervals: JSON.parse(JSON.stringify(this.intervals)),
            nextIntervalId: this.nextIntervalId,
            isCreating: this.isCreating,
            pendingIntervalData: this.pendingIntervalData
        };
    }

    /**
     * Obtenir les statistiques
     */
    getStats() {
        const totalDuration = this.intervals.reduce((sum, i) => sum + i.getDuration(), 0);

        return {
            count: this.intervals.length,
            visible: this.intervals.filter(i => i.visible).length,
            hidden: this.intervals.filter(i => !i.visible).length,
            totalDuration: totalDuration.toFixed(3)
        };
    }
}
