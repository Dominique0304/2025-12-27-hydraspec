/**
 * HydraSpec Pro - Architecture POO
 * Classe ProjectManager : Gère plusieurs projets simultanément
 *
 * Responsabilités :
 * - Créer/supprimer des projets
 * - Gérer le projet actif
 * - Basculer entre les projets (onglets)
 * - Coordonner les interactions entre projets
 */

class ProjectManager {
    constructor() {
        // Map de tous les projets : Map<id, Project>
        this.projects = new Map();

        // ID du projet actuellement actif
        this.activeProjectId = null;

        // Compteur pour numérotation automatique
        this.projectCounter = 1;

        // Callbacks pour événements
        this.listeners = {
            projectCreated: [],
            projectDeleted: [],
            projectSwitched: [],
            projectRenamed: []
        };

        console.log("🎯 ProjectManager initialisé");
    }

    // ========================================
    // CRÉATION ET SUPPRESSION DE PROJETS
    // ========================================

    /**
     * Crée un nouveau projet
     * @param {string} name - Nom du projet (optionnel)
     * @returns {Project} Le projet créé
     */
    createProject(name = null) {
        const projectName = name || `Projet ${this.projectCounter++}`;
        const project = new Project(projectName);

        // Ajouter au registre
        this.projects.set(project.id, project);

        // Activer automatiquement si c'est le premier projet
        if (this.projects.size === 1) {
            this.switchTo(project.id);
        }

        console.log(`✅ Projet créé: ${projectName} (Total: ${this.projects.size})`);

        // Notifier les listeners
        this._emit('projectCreated', project);

        return project;
    }

    /**
     * Crée un projet à partir d'un fichier CSV
     * @param {File} file - Fichier CSV
     * @returns {Promise<Project>} Le projet créé
     */
    async createProjectFromCSV(file) {
        const project = this.createProject(file.name.replace(/\.[^/.]+$/, ""));

        try {
            await project.loadCSV(file);
            console.log(`📂 Projet créé depuis CSV: ${project.name}`);
            return project;
        } catch (error) {
            // En cas d'erreur, supprimer le projet
            this.deleteProject(project.id);
            throw error;
        }
    }

    /**
     * Crée un projet avec un signal généré
     * @param {Object} params - Paramètres du générateur
     * @returns {Project} Le projet créé
     */
    createProjectFromGenerator(params = {}) {
        const project = this.createProject("Signal Généré");
        project.generateSignal(params);
        console.log(`🎵 Projet créé avec signal généré: ${project.name}`);
        return project;
    }

    /**
     * Supprime un projet
     * @param {string} projectId - ID du projet à supprimer
     * @returns {boolean} True si supprimé, False sinon
     */
    deleteProject(projectId) {
        const project = this.projects.get(projectId);

        if (!project) {
            console.warn(`⚠️ Projet ${projectId} introuvable`);
            return false;
        }

        const projectName = project.name;

        // Détruire le projet (libère la mémoire)
        project.destroy();

        // Retirer du registre
        this.projects.delete(projectId);

        console.log(`🗑️ Projet supprimé: ${projectName} (Restants: ${this.projects.size})`);

        // Si c'était le projet actif, basculer vers un autre
        if (this.activeProjectId === projectId) {
            this.activeProjectId = null;

            // Activer le premier projet disponible
            if (this.projects.size > 0) {
                const firstProjectId = this.projects.keys().next().value;
                this.switchTo(firstProjectId);
            }
        }

        // Notifier les listeners
        this._emit('projectDeleted', { id: projectId, name: projectName });

        return true;
    }

    /**
     * Supprime tous les projets
     */
    deleteAllProjects() {
        const count = this.projects.size;

        this.projects.forEach((project, id) => {
            project.destroy();
        });

        this.projects.clear();
        this.activeProjectId = null;
        this.projectCounter = 1;

        console.log(`🗑️ Tous les projets supprimés (${count} projets)`);
    }

    // ========================================
    // GESTION DU PROJET ACTIF
    // ========================================

    /**
     * Bascule vers un projet
     * @param {string} projectId - ID du projet
     * @returns {boolean} True si succès, False sinon
     */
    switchTo(projectId) {
        const project = this.projects.get(projectId);

        if (!project) {
            console.warn(`⚠️ Impossible de basculer vers ${projectId} : projet introuvable`);
            return false;
        }

        // Désactiver le projet actuel
        if (this.activeProjectId) {
            const currentProject = this.projects.get(this.activeProjectId);
            if (currentProject) {
                currentProject.isActive = false;
            }
        }

        // Activer le nouveau projet
        this.activeProjectId = projectId;
        project.isActive = true;

        console.log(`🔄 Basculé vers: ${project.name}`);

        // Notifier les listeners
        this._emit('projectSwitched', project);

        return true;
    }

    /**
     * Retourne le projet actuellement actif
     * @returns {Project|null} Le projet actif ou null
     */
    getActive() {
        if (!this.activeProjectId) return null;
        return this.projects.get(this.activeProjectId);
    }

    /**
     * Retourne l'état du projet actif (pour compatibilité avec appState)
     * @returns {Object|null} État du projet actif
     */
    getActiveState() {
        const project = this.getActive();
        return project ? project.state : null;
    }

    // ========================================
    // ACCÈS AUX PROJETS
    // ========================================

    /**
     * Retourne un projet par ID
     * @param {string} projectId - ID du projet
     * @returns {Project|undefined} Le projet
     */
    getProject(projectId) {
        return this.projects.get(projectId);
    }

    /**
     * Retourne tous les projets
     * @returns {Array<Project>} Liste des projets
     */
    getAllProjects() {
        return Array.from(this.projects.values());
    }

    /**
     * Retourne le nombre de projets
     * @returns {number} Nombre de projets
     */
    getProjectCount() {
        return this.projects.size;
    }

    /**
     * Vérifie si un projet existe
     * @param {string} projectId - ID du projet
     * @returns {boolean} True si existe
     */
    hasProject(projectId) {
        return this.projects.has(projectId);
    }

    // ========================================
    // GESTION DES NOMS
    // ========================================

    /**
     * Renomme un projet
     * @param {string} projectId - ID du projet
     * @param {string} newName - Nouveau nom
     * @returns {boolean} True si succès
     */
    renameProject(projectId, newName) {
        const project = this.projects.get(projectId);

        if (!project) {
            console.warn(`⚠️ Projet ${projectId} introuvable`);
            return false;
        }

        const oldName = project.name;
        project.name = newName;

        console.log(`✏️ Projet renommé: "${oldName}" → "${newName}"`);

        // Notifier les listeners
        this._emit('projectRenamed', { project, oldName, newName });

        return true;
    }

    // ========================================
    // UTILITAIRES
    // ========================================

    /**
     * Retourne un résumé de tous les projets
     * @returns {Array<Object>} Liste des infos des projets
     */
    getProjectsSummary() {
        return this.getAllProjects().map(project => project.getInfo());
    }

    /**
     * Recherche un projet par nom
     * @param {string} name - Nom du projet (partiel accepté)
     * @returns {Array<Project>} Projets correspondants
     */
    findProjectsByName(name) {
        const searchTerm = name.toLowerCase();
        return this.getAllProjects().filter(project =>
            project.name.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Exporte la configuration de tous les projets
     * @returns {Object} Configuration sérialisée
     */
    exportConfiguration() {
        const config = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            activeProjectId: this.activeProjectId,
            projects: []
        };

        this.projects.forEach(project => {
            config.projects.push({
                id: project.id,
                name: project.name,
                state: project.cloneState()
            });
        });

        console.log(`💾 Configuration exportée (${config.projects.length} projets)`);
        return config;
    }

    /**
     * Importe une configuration de projets
     * @param {Object} config - Configuration à importer
     */
    importConfiguration(config) {
        if (!config || !config.projects) {
            throw new Error("Configuration invalide");
        }

        // Supprimer tous les projets existants
        this.deleteAllProjects();

        // Recréer les projets
        config.projects.forEach(projectData => {
            const project = new Project(projectData.name);
            project.id = projectData.id;
            project.restoreState(projectData.state);
            this.projects.set(project.id, project);
        });

        // Restaurer le projet actif
        if (config.activeProjectId && this.hasProject(config.activeProjectId)) {
            this.switchTo(config.activeProjectId);
        } else if (this.projects.size > 0) {
            const firstId = this.projects.keys().next().value;
            this.switchTo(firstId);
        }

        console.log(`📥 Configuration importée (${config.projects.length} projets)`);
    }

    // ========================================
    // SYSTÈME D'ÉVÉNEMENTS
    // ========================================

    /**
     * Enregistre un listener pour un événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction de callback
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            console.warn(`⚠️ Événement inconnu: ${event}`);
            return;
        }

        this.listeners[event].push(callback);
    }

    /**
     * Supprime un listener
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à supprimer
     */
    off(event, callback) {
        if (!this.listeners[event]) return;

        const index = this.listeners[event].indexOf(callback);
        if (index > -1) {
            this.listeners[event].splice(index, 1);
        }
    }

    /**
     * Émet un événement
     * @param {string} event - Nom de l'événement
     * @param {*} data - Données à passer aux listeners
     * @private
     */
    _emit(event, data) {
        if (!this.listeners[event]) return;

        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Erreur dans le listener ${event}:`, error);
            }
        });
    }

    // ========================================
    // STATISTIQUES
    // ========================================

    /**
     * Retourne des statistiques sur les projets
     * @returns {Object} Statistiques
     */
    getStats() {
        let totalPoints = 0;
        let totalDuration = 0;

        this.projects.forEach(project => {
            totalPoints += project.state.fullDataTime.length;
            if (project.state.fullDataTime.length > 0) {
                totalDuration += project.state.fullDataTime[project.state.fullDataTime.length - 1] / 1000;
            }
        });

        return {
            projectCount: this.projects.size,
            totalDataPoints: totalPoints,
            totalDuration: totalDuration.toFixed(2),
            activeProject: this.activeProjectId ? this.getActive().name : null
        };
    }
}

// Rendre la classe disponible globalement
if (typeof window !== 'undefined') {
    window.ProjectManager = ProjectManager;
}

console.log("📦 Module ProjectManager chargé");
