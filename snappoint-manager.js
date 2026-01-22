/**
 * SNAPPOINT-MANAGER.JS
 * Classe Manager pour encapsuler la gestion des marqueurs (SnapPoints)
 * Remplace les variables globales par une gestion orientée objet
 */

class SnapPointManager {
    constructor(project) {
        this.project = project;

        // État des marqueurs (plus de variables globales !)
        this.snapPoints = [];
        this.nextSnapPointId = 1;
        this.isCreating = false;

        // État de l'outil
        this.state = {
            active: false,
            mode: 'create', // 'create' ou 'move'
            dragging: null, // 'point', 'box', 'resize', ou null
            draggedSnapPoint: null,
            dragStartX: 0,
            dragStartY: 0,
            dragOffsetX: 0,
            dragOffsetY: 0,
            resizeDirection: null,
            resizeStartWidth: 0,
            resizeStartHeight: 0,
            resizeStartBoxX: 0,
            resizeStartBoxY: 0,
            dimensionsFrozen: false,
            initialArrowEndX: 0,
            initialArrowEndY: 0,
            initialArrowAbsX: 0,
            initialArrowAbsY: 0
        };
    }

    /**
     * Créer un nouveau marqueur
     */
    create(channelIndex, time, value) {
        const snapPoint = new SnapPoint(
            this.nextSnapPointId++,
            channelIndex,
            time,
            value
        );
        this.snapPoints.push(snapPoint);
        return snapPoint;
    }

    /**
     * Obtenir tous les marqueurs
     */
    getAll() {
        return this.snapPoints;
    }

    /**
     * Obtenir un marqueur par ID
     */
    getById(id) {
        return this.snapPoints.find(sp => sp.id === id);
    }

    /**
     * Supprimer un marqueur
     */
    delete(id) {
        const index = this.snapPoints.findIndex(sp => sp.id === id);
        if (index !== -1) {
            this.snapPoints.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Supprimer tous les marqueurs
     */
    deleteAll() {
        this.snapPoints = [];
    }

    /**
     * Activer l'outil marqueur
     */
    activate(mode = 'create') {
        this.state.active = true;
        this.state.mode = mode;
    }

    /**
     * Désactiver l'outil marqueur
     */
    deactivate() {
        this.state.active = false;
        this.isCreating = false;
        this.state.dragging = null;
        this.state.draggedSnapPoint = null;
    }

    /**
     * Basculer le mode (création/déplacement)
     */
    setMode(mode) {
        this.state.mode = mode;
    }

    /**
     * Charger les marqueurs depuis des données sauvegardées
     */
    load(savedData) {
        if (!savedData) return;

        this.snapPoints = savedData.snapPoints || [];
        this.nextSnapPointId = savedData.nextSnapPointId || 1;
        this.isCreating = savedData.isCreating || false;

        console.log(`📌 Chargé ${this.snapPoints.length} marqueur(s)`);
    }

    /**
     * Sauvegarder les marqueurs
     */
    save() {
        return {
            snapPoints: JSON.parse(JSON.stringify(this.snapPoints)),
            nextSnapPointId: this.nextSnapPointId,
            isCreating: this.isCreating
        };
    }

    /**
     * Obtenir les statistiques
     */
    getStats() {
        return {
            count: this.snapPoints.length,
            visible: this.snapPoints.filter(sp => sp.visible).length,
            hidden: this.snapPoints.filter(sp => !sp.visible).length
        };
    }
}
