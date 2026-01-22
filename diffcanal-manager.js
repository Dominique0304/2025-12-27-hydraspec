/**
 * DIFFCANAL-MANAGER.JS
 * Classe Manager pour encapsuler la gestion des différences entre canaux
 * Remplace les variables globales par une gestion orientée objet
 */

class DiffCanalManager {
    constructor(project) {
        this.project = project;

        // État des diff canal (plus de variables globales !)
        this.intervals = [];
        this.nextId = 1;
        this.isCreating = false;
        this.selectedChannelIndex = null;
        this.pendingPoint = null;

        // État de l'outil
        this.state = {
            active: false,
            dragging: null, // 'point1', 'point2', 'horizontal-label', 'vertical-label', 'diagonal-label', ou null
            draggedInterval: null,
            dragStartX: 0,
            dragStartY: 0
        };
    }

    /**
     * Créer un nouvel intervalle de différence
     */
    create(channelIndex, point1, point2) {
        const interval = new DiffCanalInterval(
            this.nextId++,
            channelIndex,
            point1,
            point2
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
    startCreating(channelIndex, point) {
        this.isCreating = true;
        this.selectedChannelIndex = channelIndex;
        this.pendingPoint = point;
    }

    /**
     * Terminer la création d'un intervalle
     */
    finishCreating(point2) {
        if (!this.pendingPoint) return null;

        const interval = this.create(
            this.selectedChannelIndex,
            this.pendingPoint,
            point2
        );

        this.isCreating = false;
        this.pendingPoint = null;

        return interval;
    }

    /**
     * Annuler la création en cours
     */
    cancelCreating() {
        this.isCreating = false;
        this.pendingPoint = null;
        this.selectedChannelIndex = null;
    }

    /**
     * Activer l'outil
     */
    activate() {
        this.state.active = true;
    }

    /**
     * Désactiver l'outil
     */
    deactivate() {
        this.state.active = false;
        this.cancelCreating();
    }

    /**
     * Charger les intervalles depuis des données sauvegardées
     */
    load(savedData) {
        if (!savedData) return;

        this.intervals = savedData.intervals || [];
        this.nextId = savedData.nextId || 1;

        console.log(`📐 Chargé ${this.intervals.length} diff canal`);
    }

    /**
     * Sauvegarder les intervalles
     */
    save() {
        return {
            intervals: JSON.parse(JSON.stringify(this.intervals)),
            nextId: this.nextId
        };
    }

    /**
     * Obtenir les statistiques
     */
    getStats() {
        return {
            count: this.intervals.length,
            visible: this.intervals.filter(i => i.visible).length,
            hidden: this.intervals.filter(i => !i.visible).length
        };
    }
}
