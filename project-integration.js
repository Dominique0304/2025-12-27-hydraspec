/**
 * HydraSpec Pro - Intégration Progressive POO
 *
 * Ce fichier fait le pont entre l'ancien code (appState global)
 * et la nouvelle architecture POO (Project + ProjectManager).
 *
 * Stratégie de migration :
 * 1. Initialiser ProjectManager avec un projet par défaut
 * 2. Créer un alias appState qui pointe vers le projet actif
 * 3. Migrer progressivement les fonctions une par une
 * 4. Garder la compatibilité avec l'ancien code pendant la transition
 */

// ========================================
// INITIALISATION DU PROJECT MANAGER
// ========================================

let projectManager = null;

/**
 * Initialise le système de gestion multi-projets
 * Appelé automatiquement au chargement de la page
 */
function initProjectManager() {
    console.log("🎯 Initialisation du ProjectManager...");

    // Créer le gestionnaire global
    projectManager = new ProjectManager();

    // Créer un projet par défaut
    const defaultProject = projectManager.createProject("Projet par défaut");

    // Générer un signal initial pour avoir des données
    defaultProject.generateSignal({
        fs: 1000,
        duration: 10,
        noise: 0.1,
        dc: 5,
        frequencies: [
            { freq: 50, amp: 5, phase: 0 },
            { freq: 180, amp: 1.5, phase: 45 }
        ]
    });

    console.log("✅ ProjectManager initialisé avec un projet par défaut");

    // Enregistrer des listeners pour synchroniser l'interface
    projectManager.on('projectCreated', onProjectCreated);
    projectManager.on('projectDeleted', onProjectDeleted);
    projectManager.on('projectSwitched', onProjectSwitched);

    return projectManager;
}

// ========================================
// ALIAS POUR COMPATIBILITÉ
// ========================================

/**
 * Crée un alias appState qui pointe vers le projet actif
 * Cela permet à l'ancien code de continuer à fonctionner
 * pendant la migration progressive
 */
function setupAppStateAlias() {
    // Sauvegarder l'ancien appState s'il existe
    const oldAppState = window.appState || {};

    // Créer un proxy qui redirige vers le projet actif
    window.appState = new Proxy(oldAppState, {
        get: function(target, prop) {
            const activeProject = projectManager?.getActive();
            if (activeProject && activeProject.state.hasOwnProperty(prop)) {
                return activeProject.state[prop];
            }
            return target[prop];
        },
        set: function(target, prop, value) {
            const activeProject = projectManager?.getActive();
            if (activeProject && activeProject.state.hasOwnProperty(prop)) {
                activeProject.state[prop] = value;
                return true;
            }
            target[prop] = value;
            return true;
        }
    });

    console.log("✅ Alias appState créé (redirige vers projet actif)");
}

// ========================================
// ÉVÉNEMENTS DU PROJECT MANAGER
// ========================================

/**
 * Appelé quand un nouveau projet est créé
 */
function onProjectCreated(project) {
    console.log(`📂 Projet créé : ${project.name}`);

    // Mettre à jour l'interface si nécessaire
    if (typeof updateProjectTabs === 'function') {
        updateProjectTabs();
    }
}

/**
 * Appelé quand un projet est supprimé
 */
function onProjectDeleted(data) {
    console.log(`🗑️ Projet supprimé : ${data.name}`);

    // Mettre à jour l'interface
    if (typeof updateProjectTabs === 'function') {
        updateProjectTabs();
    }
}

/**
 * Appelé quand on bascule vers un autre projet
 */
function onProjectSwitched(project) {
    console.log(`🔄 Basculé vers : ${project.name}`);

    // Mettre à jour tous les graphiques et l'interface
    if (typeof updateAllInterface === 'function') {
        updateAllInterface();
    } else {
        // Fallback : mettre à jour manuellement
        if (typeof updateTimeChart === 'function') updateTimeChart();
        if (typeof updateStats === 'function') updateStats();
        if (typeof performAnalysis === 'function') performAnalysis();
        if (typeof updateSpectrogram === 'function') updateSpectrogram();
    }

    // Mettre à jour les onglets
    if (typeof updateProjectTabs === 'function') {
        updateProjectTabs();
    }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Retourne le projet actuellement actif
 * @returns {Project|null}
 */
function getActiveProject() {
    return projectManager?.getActive() || null;
}

/**
 * Retourne l'état du projet actif (pour compatibilité)
 * @returns {Object|null}
 */
function getActiveState() {
    const project = getActiveProject();
    return project ? project.state : null;
}

/**
 * Vérifie si le ProjectManager est initialisé
 * @returns {boolean}
 */
function isProjectManagerReady() {
    return projectManager !== null && projectManager.getProjectCount() > 0;
}

/**
 * Met à jour toute l'interface avec les données du projet actif
 */
function updateAllInterface() {
    const project = getActiveProject();
    if (!project) {
        console.warn("⚠️ Aucun projet actif");
        return;
    }

    console.log(`🔄 Mise à jour de l'interface pour : ${project.name}`);

    // Initialiser la configuration multi-canaux si disponible
    if (project.state.availableColumns && project.state.availableColumns.length > 0) {
        console.log(`🎨 Initialisation multi-canaux : ${project.state.availableColumns.length} canaux`);
        if (typeof initChannelConfig === 'function') {
            initChannelConfig();
        }
        if (typeof updateColumnSelector === 'function') {
            updateColumnSelector();
        }
    }

    // Mettre à jour les graphiques
    if (typeof updateTimeChart === 'function') updateTimeChart();
    if (typeof updateStats === 'function') updateStats();
    if (typeof performAnalysis === 'function') performAnalysis();
    if (typeof updateSpectrogram === 'function') updateSpectrogram();

    // Mettre à jour les champs de configuration
    if (document.getElementById('display-fs-config')) {
        document.getElementById('display-fs-config').textContent = project.state.fs.toFixed(1) + " Hz";
    }
    if (document.getElementById('display-increment-config')) {
        document.getElementById('display-increment-config').textContent =
            (project.state.timeIncrement * 1000).toFixed(2) + " ms";
    }
    if (document.getElementById('display-n-config')) {
        document.getElementById('display-n-config').textContent = project.state.fullDataTime.length;
    }

    setStatus(`Interface mise à jour : ${project.name}`);
}

// ========================================
// MIGRATION : GÉNÉRATEUR DE SIGNAL
// ========================================

/**
 * Version migrée de generateSignal()
 * Utilise Project.generateSignal() en interne
 */
function generateSignal_POO() {
    // Récupérer les paramètres de l'interface
    const fs = parseFloat(document.getElementById('gen-fs').value);
    const duration = parseFloat(document.getElementById('gen-duration').value);
    const noise = parseFloat(document.getElementById('gen-noise').value);
    const dc = parseFloat(document.getElementById('gen-dc').value);

    // Récupérer les fréquences
    const rows = document.querySelectorAll('#freq-inputs-container .row-removable');
    const frequencies = [];
    rows.forEach(r => {
        frequencies.push({
            freq: parseFloat(r.querySelector('.gen-f').value),
            amp: parseFloat(r.querySelector('.gen-a').value),
            phase: parseFloat(r.querySelector('.gen-p').value)
        });
    });

    // Créer un nouveau projet pour le signal généré
    const projectName = `Signal ${new Date().toLocaleTimeString()}`;
    const project = projectManager.createProject(projectName);

    // Générer le signal
    project.generateSignal({
        fs: fs,
        duration: duration,
        noise: noise,
        dc: dc,
        frequencies: frequencies
    });

    console.log(`✅ Signal généré dans le projet : ${projectName}`);

    // Mettre à jour l'interface
    updateAllInterface();
    closeModal('genModal');
    setStatus(`Signal généré : ${projectName}`);
}

// ========================================
// MIGRATION : CHARGEMENT CSV
// ========================================

/**
 * Version migrée de handleFileUpload()
 * Utilise Project.loadCSV() en interne
 */
async function handleFileUpload_POO(input) {
    const file = input.files[0];
    if (!file) return;

    try {
        setStatus(`Chargement de ${file.name}...`);

        // Créer un nouveau projet depuis le CSV
        const project = await projectManager.createProjectFromCSV(file);

        console.log(`✅ CSV chargé dans le projet : ${project.name}`);
        console.log(`   - ${project.state.fullDataTime.length} points`);
        console.log(`   - Fs: ${project.state.fs.toFixed(1)} Hz`);
        console.log(`   - ${project.state.availableColumns.length} canaux`);

        // IMPORTANT : Basculer vers le nouveau projet
        projectManager.switchTo(project.id);
        console.log(`🔄 Basculé vers le nouveau projet : ${project.name}`);

        // Mettre à jour l'interface
        updateAllInterface();
        setStatus(`Fichier chargé : ${project.name}`);

    } catch (error) {
        console.error("❌ Erreur lors du chargement CSV :", error);
        setStatus(`Erreur : ${error.message}`);
    }
}

// ========================================
// INITIALISATION AU CHARGEMENT
// ========================================

/**
 * Initialise le système POO au chargement de la page
 * À appeler APRÈS le chargement de app.js
 */
function initPOOSystem() {
    console.log("🚀 Initialisation du système POO...");

    // Vérifier que les classes sont chargées
    if (typeof Project === 'undefined' || typeof ProjectManager === 'undefined') {
        console.error("❌ Classes Project/ProjectManager non chargées !");
        return false;
    }

    // Initialiser le ProjectManager
    initProjectManager();

    // Créer l'alias appState
    setupAppStateAlias();

    // Charger les données du projet par défaut dans l'interface
    setTimeout(() => {
        updateAllInterface();
    }, 100);

    console.log("✅ Système POO initialisé avec succès");
    return true;
}

// Export global pour debugging
window.projectManager = projectManager;
window.getActiveProject = getActiveProject;
window.initPOOSystem = initPOOSystem;

console.log("📦 Module project-integration.js chargé");
