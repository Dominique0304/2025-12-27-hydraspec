/**
 * TOOL-ADAPTERS.JS
 * Adaptateurs de compatibilité entre l'ancien code (variables globales)
 * et la nouvelle architecture POO (managers)
 *
 * Ces adaptateurs permettent au code existant de continuer à fonctionner
 * tout en utilisant les managers encapsulés sous le capot.
 */

/**
 * Synchroniser les variables globales avec les managers du projet actif
 * Appelé automatiquement lors du changement de projet
 */
function syncGlobalVariablesWithManagers() {
    const project = projectManager?.getActive();
    if (!project) {
        console.warn("⚠️ Pas de projet actif pour synchroniser");
        return;
    }

    console.log(`🔄 Synchronisation des variables globales avec ${project.name}`);

    // ========================================
    // SNAPPOINTS (Marqueurs)
    // ========================================
    if (project.snapPointManager) {
        // CRITIQUE : Rediriger vers une COPIE pour éviter le partage de référence
        window.snapPoints = [...project.snapPointManager.snapPoints];
        window.nextSnapPointId = project.snapPointManager.nextSnapPointId;
        window.isCreatingSnapPoint = project.snapPointManager.isCreating;
        window.snapPointState = project.snapPointManager.state;
    }

    // ========================================
    // INTERVALS
    // ========================================
    if (project.intervalManager) {
        // CRITIQUE : Rediriger vers une COPIE pour éviter le partage de référence
        window.intervals = [...project.intervalManager.intervals];
        window.nextIntervalId = project.intervalManager.nextIntervalId;
        window.isCreatingInterval = project.intervalManager.isCreating;
        window.pendingIntervalData = project.intervalManager.pendingIntervalData;
        window.intervalDragState = project.intervalManager.dragState;
    }

    // ========================================
    // DIFF CANAL
    // ========================================
    if (project.diffCanalManager) {
        // CRITIQUE : Rediriger vers une COPIE pour éviter le partage de référence
        window.diffCanalIntervals = [...project.diffCanalManager.intervals];
        window.nextDiffCanalId = project.diffCanalManager.nextId;
        window.isCreatingDiffCanal = project.diffCanalManager.isCreating;
        window.selectedChannelIndex = project.diffCanalManager.selectedChannelIndex;
        window.pendingDiffCanalPoint = project.diffCanalManager.pendingPoint;
        window.diffCanalState = project.diffCanalManager.state;
    }

    console.log("✅ Synchronisation terminée");
}

/**
 * Sauvegarder les modifications des variables globales vers les managers
 * Appelé avant de changer de projet ou de sauvegarder
 */
function syncManagersFromGlobalVariables() {
    const project = projectManager?.getActive();
    if (!project) return;

    console.log(`💾 Synchronisation des managers depuis les variables globales`);

    // ========================================
    // SNAPPOINTS
    // ========================================
    if (project.snapPointManager && typeof window.snapPoints !== 'undefined') {
        // CRITIQUE : Copier le tableau au lieu d'assigner la référence
        // pour que chaque projet ait son propre tableau de marqueurs
        project.snapPointManager.snapPoints = [...window.snapPoints];
        project.snapPointManager.nextSnapPointId = window.nextSnapPointId || 1;
        project.snapPointManager.isCreating = window.isCreatingSnapPoint || false;
        // snapPointState est déjà une référence, pas besoin de copier
    }

    // ========================================
    // INTERVALS
    // ========================================
    if (project.intervalManager && typeof window.intervals !== 'undefined') {
        // CRITIQUE : Copier le tableau au lieu d'assigner la référence
        // pour que chaque projet ait son propre tableau d'intervalles
        project.intervalManager.intervals = [...window.intervals];
        project.intervalManager.nextIntervalId = window.nextIntervalId || 1;
        project.intervalManager.isCreating = window.isCreatingInterval || false;
        project.intervalManager.pendingIntervalData = window.pendingIntervalData || null;
        // intervalDragState est déjà une référence
    }

    // ========================================
    // DIFF CANAL
    // ========================================
    if (project.diffCanalManager && typeof window.diffCanalIntervals !== 'undefined') {
        // CRITIQUE : Copier le tableau au lieu d'assigner la référence
        // pour que chaque projet ait son propre tableau d'intervalles
        project.diffCanalManager.intervals = [...window.diffCanalIntervals];
        project.diffCanalManager.nextId = window.nextDiffCanalId || 1;
        project.diffCanalManager.isCreating = window.isCreatingDiffCanal || false;
        project.diffCanalManager.selectedChannelIndex = window.selectedChannelIndex || null;
        project.diffCanalManager.pendingPoint = window.pendingDiffCanalPoint || null;
        // diffCanalState est déjà une référence
    }

    console.log("✅ Managers mis à jour");
}
