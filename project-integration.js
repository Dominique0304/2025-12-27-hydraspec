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
// INTERFACE : GESTION DES ONGLETS
// ========================================

/**
 * Met à jour la barre d'onglets avec tous les projets ouverts
 */
function updateProjectTabs() {
    const container = document.getElementById('project-tabs-container');
    if (!container) {
        console.warn("⚠️ Container d'onglets non trouvé");
        return;
    }

    // Vider le container
    container.innerHTML = '';

    // Récupérer tous les projets
    const projects = projectManager.getAllProjects();

    if (projects.length === 0) {
        container.innerHTML = '<div style="padding: 8px; color: var(--text-muted); font-size: 0.85rem; font-style: italic;">Aucun projet ouvert</div>';
        return;
    }

    // Créer un onglet pour chaque projet
    projects.forEach(project => {
        const tab = document.createElement('div');
        tab.className = 'project-tab' + (project.isActive ? ' active' : '');
        tab.setAttribute('data-project-id', project.id);
        tab.setAttribute('title', project.name);

        // Icône du projet
        const icon = document.createElement('i');
        icon.className = 'fas fa-file-alt';

        // Nom du projet
        const name = document.createElement('span');
        name.className = 'project-tab-name';
        name.textContent = project.name;

        // Bouton de fermeture
        const closeBtn = document.createElement('span');
        closeBtn.className = 'project-tab-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = (e) => closeProjectTab(project.id, e);

        // Assembler l'onglet
        tab.appendChild(icon);
        tab.appendChild(name);
        tab.appendChild(closeBtn);

        // Événement de clic sur l'onglet (sauf sur le bouton de fermeture)
        tab.onclick = (e) => {
            if (!e.target.classList.contains('project-tab-close')) {
                switchToProjectTab(project.id);
            }
        };

        container.appendChild(tab);
    });

    console.log(`📑 Onglets mis à jour : ${projects.length} projet(s)`);
}

/**
 * Bascule vers un projet en cliquant sur son onglet
 * @param {string} projectId - ID du projet
 */
function switchToProjectTab(projectId) {
    if (!projectManager.switchTo(projectId)) {
        console.error(`❌ Impossible de basculer vers le projet ${projectId}`);
        return;
    }

    const project = projectManager.getActive();
    console.log(`🔄 Basculé vers : ${project.name}`);

    // Mettre à jour l'interface
    updateAllInterface();
}

/**
 * Ferme un projet depuis son onglet
 * @param {string} projectId - ID du projet à fermer
 * @param {Event} event - Événement de clic
 */
function closeProjectTab(projectId, event) {
    event.stopPropagation();

    const project = projectManager.getProject(projectId);
    if (!project) {
        console.warn(`⚠️ Projet ${projectId} introuvable`);
        return;
    }

    // Demander confirmation si c'est le seul projet
    const projectCount = projectManager.getProjectCount();
    if (projectCount === 1) {
        const confirmClose = confirm(`Voulez-vous vraiment fermer le projet "${project.name}" ?\n\nAttention : C'est le dernier projet ouvert.`);
        if (!confirmClose) return;
    }

    const projectName = project.name;
    projectManager.deleteProject(projectId);

    console.log(`🗑️ Projet fermé : ${projectName}`);
    setStatus(`Projet fermé : ${projectName}`);
}

/**
 * Crée un nouveau projet vide
 */
function createNewProject() {
    const projectName = prompt("Nom du nouveau projet :", `Nouveau Projet ${new Date().toLocaleTimeString()}`);

    if (!projectName || projectName.trim() === '') {
        console.log("⚠️ Création de projet annulée");
        return;
    }

    const project = projectManager.createProject(projectName.trim());

    // Générer un signal par défaut pour avoir des données
    project.generateSignal({
        fs: 1000,
        duration: 10,
        noise: 0.1,
        dc: 5,
        frequencies: [
            { freq: 50, amp: 5, phase: 0 }
        ]
    });

    console.log(`✅ Nouveau projet créé : ${project.name}`);

    // Mettre à jour l'interface
    updateAllInterface();
    setStatus(`Nouveau projet créé : ${project.name}`);
}

// ========================================
// SAUVEGARDE/RESTAURATION DES ÉTATS D'OUTILS
// ========================================

/**
 * Sauvegarde les limites de zoom de tous les graphiques dans le projet
 * @param {Project} project - Projet dans lequel sauvegarder
 */
function saveChartZoomLimits(project) {
    if (!project || !project.charts) {
        console.warn("⚠️ Impossible de sauvegarder le zoom : projet invalide");
        return;
    }

    console.log(`💾 Sauvegarde des limites de zoom pour : ${project.name}`);

    // Sauvegarder le graphique temporel
    if (project.charts.time && project.charts.time.options && project.charts.time.options.scales) {
        const scales = project.charts.time.options.scales;

        // Axe X
        if (scales.x) {
            project.toolsState.chartLimits.time.x.min = scales.x.min;
            project.toolsState.chartLimits.time.x.max = scales.x.max;
        }

        // Tous les axes Y (y, y2, y3, ...)
        project.toolsState.chartLimits.time.y = {};
        Object.keys(scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                project.toolsState.chartLimits.time.y[scaleKey] = {
                    min: scales[scaleKey].min,
                    max: scales[scaleKey].max
                };
            }
        });
    }

    // Sauvegarder le graphique fréquentiel
    if (project.charts.freq && project.charts.freq.options && project.charts.freq.options.scales) {
        const scales = project.charts.freq.options.scales;

        if (scales.x) {
            project.toolsState.chartLimits.freq.x.min = scales.x.min;
            project.toolsState.chartLimits.freq.x.max = scales.x.max;
        }

        project.toolsState.chartLimits.freq.y = {};
        Object.keys(scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                project.toolsState.chartLimits.freq.y[scaleKey] = {
                    min: scales[scaleKey].min,
                    max: scales[scaleKey].max
                };
            }
        });
    }

    // Sauvegarder le spectrogramme
    if (project.charts.spectro && project.charts.spectro.options && project.charts.spectro.options.scales) {
        const scales = project.charts.spectro.options.scales;

        if (scales.x) {
            project.toolsState.chartLimits.spectro.x.min = scales.x.min;
            project.toolsState.chartLimits.spectro.x.max = scales.x.max;
        }

        project.toolsState.chartLimits.spectro.y = {};
        Object.keys(scales).forEach(scaleKey => {
            if (scaleKey.startsWith('y')) {
                project.toolsState.chartLimits.spectro.y[scaleKey] = {
                    min: scales[scaleKey].min,
                    max: scales[scaleKey].max
                };
            }
        });
    }

    console.log(`✅ Zoom sauvegardé pour ${project.name}`);
}

/**
 * Restaure les limites de zoom de tous les graphiques depuis le projet
 * @param {Project} project - Projet depuis lequel restaurer
 */
function restoreChartZoomLimits(project) {
    if (!project || !project.charts || !project.toolsState.chartLimits) {
        console.warn("⚠️ Impossible de restaurer le zoom : projet invalide");
        return;
    }

    console.log(`🔄 Restauration des limites de zoom pour : ${project.name}`);

    // Restaurer le graphique temporel
    if (project.charts.time && project.charts.time.options && project.charts.time.options.scales) {
        const scales = project.charts.time.options.scales;
        const limits = project.toolsState.chartLimits.time;

        // Axe X
        if (limits.x) {
            scales.x.min = limits.x.min;
            scales.x.max = limits.x.max;
        }

        // Tous les axes Y
        if (limits.y) {
            Object.keys(limits.y).forEach(scaleKey => {
                if (scales[scaleKey]) {
                    scales[scaleKey].min = limits.y[scaleKey].min;
                    scales[scaleKey].max = limits.y[scaleKey].max;
                }
            });
        }

        project.charts.time.update('none');
    }

    // Restaurer le graphique fréquentiel
    if (project.charts.freq && project.charts.freq.options && project.charts.freq.options.scales) {
        const scales = project.charts.freq.options.scales;
        const limits = project.toolsState.chartLimits.freq;

        if (limits.x) {
            scales.x.min = limits.x.min;
            scales.x.max = limits.x.max;
        }

        if (limits.y) {
            Object.keys(limits.y).forEach(scaleKey => {
                if (scales[scaleKey]) {
                    scales[scaleKey].min = limits.y[scaleKey].min;
                    scales[scaleKey].max = limits.y[scaleKey].max;
                }
            });
        }

        project.charts.freq.update('none');
    }

    // Restaurer le spectrogramme
    if (project.charts.spectro && project.charts.spectro.options && project.charts.spectro.options.scales) {
        const scales = project.charts.spectro.options.scales;
        const limits = project.toolsState.chartLimits.spectro;

        if (limits.x) {
            scales.x.min = limits.x.min;
            scales.x.max = limits.x.max;
        }

        if (limits.y) {
            Object.keys(limits.y).forEach(scaleKey => {
                if (scales[scaleKey]) {
                    scales[scaleKey].min = limits.y[scaleKey].min;
                    scales[scaleKey].max = limits.y[scaleKey].max;
                }
            });
        }

        project.charts.spectro.update('none');
    }

    console.log(`✅ Zoom restauré pour ${project.name}`);
}

/**
 * Sauvegarde tous les états d'outils dans le projet
 * @param {Project} project - Projet dans lequel sauvegarder
 */
function saveAllToolsState(project) {
    if (!project) {
        console.warn("⚠️ Impossible de sauvegarder les outils : projet invalide");
        return;
    }

    console.log(`💾 Sauvegarde des états d'outils pour : ${project.name}`);

    // Sauvegarder Intervals
    if (typeof intervals !== 'undefined') {
        project.toolsState.intervals = JSON.parse(JSON.stringify(intervals));
        project.toolsState.isCreatingInterval = isCreatingInterval;
        project.toolsState.nextIntervalId = nextIntervalId;
    }

    // Sauvegarder Measure Tool
    if (typeof measureState !== 'undefined') {
        project.toolsState.measureTool = {
            active: measureState.active,
            point1: measureState.point1 ? {...measureState.point1} : null,
            point2: measureState.point2 ? {...measureState.point2} : null,
            dragging: measureState.dragging
        };
    }

    // Sauvegarder Annotations
    if (typeof annotations !== 'undefined') {
        project.toolsState.annotations = JSON.parse(JSON.stringify(annotations));
        project.toolsState.isCreatingAnnotation = isCreatingAnnotation;
        project.toolsState.annotationsVisible = annotationsVisible;
    }

    // Sauvegarder Pan Tool
    if (typeof panState !== 'undefined') {
        project.toolsState.panTool = {
            active: panState.active,
            mode: panState.mode,
            y0Active: panState.y0Active,
            zoomMode: panState.zoomMode
        };
    }

    // Sauvegarder Ruler Tool
    if (typeof rulerState !== 'undefined') {
        project.toolsState.rulerTool = {
            active: rulerState.active,
            point: rulerState.point ? {...rulerState.point} : null
        };
    }

    // Sauvegarder Track Tool
    if (typeof trackState !== 'undefined') {
        project.toolsState.trackTool = {
            active: trackState.active,
            currentX: trackState.currentX,
            values: {...trackState.values},
            locked: trackState.locked
        };
    }

    // Sauvegarder Diff Canal
    if (typeof diffCanalIntervals !== 'undefined') {
        project.toolsState.diffCanal.intervals = JSON.parse(JSON.stringify(diffCanalIntervals));
        project.toolsState.diffCanal.nextId = nextDiffCanalId;
    }

    console.log(`✅ États d'outils sauvegardés pour ${project.name}`);
}

/**
 * Restaure tous les états d'outils depuis le projet
 * @param {Project} project - Projet depuis lequel restaurer
 */
function restoreAllToolsState(project) {
    if (!project) {
        console.warn("⚠️ Impossible de restaurer les outils : projet invalide");
        return;
    }

    console.log(`🔄 Restauration des états d'outils pour : ${project.name}`);

    // Restaurer Intervals
    if (typeof intervals !== 'undefined' && project.toolsState.intervals) {
        intervals.length = 0; // Vider le tableau
        intervals.push(...JSON.parse(JSON.stringify(project.toolsState.intervals)));
        isCreatingInterval = project.toolsState.isCreatingInterval;
        nextIntervalId = project.toolsState.nextIntervalId;

        // Mettre à jour l'affichage
        if (typeof updateIntervalsList === 'function') {
            updateIntervalsList();
        }
    }

    // Restaurer Measure Tool
    if (typeof measureState !== 'undefined' && project.toolsState.measureTool) {
        const wasActive = measureState.active;
        const shouldBeActive = project.toolsState.measureTool.active;

        measureState.active = shouldBeActive;
        measureState.point1 = project.toolsState.measureTool.point1 ? {...project.toolsState.measureTool.point1} : null;
        measureState.point2 = project.toolsState.measureTool.point2 ? {...project.toolsState.measureTool.point2} : null;

        // Mettre à jour l'UI du bouton
        const btn = document.getElementById('measure-diff-btn');
        const results = document.getElementById('measure-results');
        if (btn && results) {
            btn.style.background = shouldBeActive ? 'var(--accent-green)' : 'var(--accent-blue)';
            results.style.display = shouldBeActive ? 'block' : 'none';
        }

        // Mettre à jour les valeurs affichées
        if (typeof updateMeasureDisplay === 'function') {
            updateMeasureDisplay();
        }
    }

    // Restaurer Annotations
    if (typeof annotations !== 'undefined' && project.toolsState.annotations) {
        annotations.length = 0; // Vider le tableau
        annotations.push(...JSON.parse(JSON.stringify(project.toolsState.annotations)));
        isCreatingAnnotation = project.toolsState.isCreatingAnnotation;
        annotationsVisible = project.toolsState.annotationsVisible;

        // Mettre à jour l'affichage
        if (typeof updateAnnotationsList === 'function') {
            updateAnnotationsList();
        }
    }

    // Restaurer Pan Tool
    if (typeof panState !== 'undefined' && project.toolsState.panTool) {
        panState.active = project.toolsState.panTool.active;
        panState.mode = project.toolsState.panTool.mode;
        panState.y0Active = project.toolsState.panTool.y0Active;
        panState.zoomMode = project.toolsState.panTool.zoomMode;

        // Mettre à jour l'UI des boutons pan
        if (typeof updatePanToolButtons === 'function') {
            updatePanToolButtons();
        }
    }

    // Restaurer Ruler Tool
    if (typeof rulerState !== 'undefined' && project.toolsState.rulerTool) {
        const shouldBeActive = project.toolsState.rulerTool.active;

        rulerState.active = shouldBeActive;
        rulerState.point = project.toolsState.rulerTool.point ? {...project.toolsState.rulerTool.point} : null;

        // Mettre à jour l'UI
        const btn = document.getElementById('ruler-tool-btn');
        const results = document.getElementById('ruler-results');
        if (btn && results) {
            btn.style.background = shouldBeActive ? 'var(--accent-green)' : 'var(--accent-blue)';
            results.style.display = shouldBeActive ? 'block' : 'none';
        }
    }

    // Restaurer Track Tool
    if (typeof trackState !== 'undefined' && project.toolsState.trackTool) {
        const shouldBeActive = project.toolsState.trackTool.active;

        trackState.active = shouldBeActive;
        trackState.currentX = project.toolsState.trackTool.currentX;
        trackState.values = {...project.toolsState.trackTool.values};
        trackState.locked = project.toolsState.trackTool.locked;

        // Mettre à jour l'UI
        const btn = document.getElementById('track-tool-btn');
        const results = document.getElementById('track-results');
        if (btn && results) {
            btn.style.background = shouldBeActive ? 'var(--accent-green)' : 'var(--accent-blue)';
            results.style.display = shouldBeActive ? 'block' : 'none';
        }
    }

    // Restaurer Diff Canal
    if (typeof diffCanalIntervals !== 'undefined' && project.toolsState.diffCanal.intervals) {
        diffCanalIntervals.length = 0;
        diffCanalIntervals.push(...JSON.parse(JSON.stringify(project.toolsState.diffCanal.intervals)));
        nextDiffCanalId = project.toolsState.diffCanal.nextId;

        // Mettre à jour l'affichage
        if (typeof updateDiffCanalList === 'function') {
            updateDiffCanalList();
        }
    }

    // Forcer le rafraîchissement des graphiques
    if (project.charts.time) {
        project.charts.time.update('none');
    }

    console.log(`✅ États d'outils restaurés pour ${project.name}`);
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

    // IMPORTANT : Synchroniser EXPLICITEMENT les données du projet vers appState
    // Le Proxy ne suffit pas pour certaines fonctions qui lisent directement appState
    if (project.state.availableColumns && project.state.availableColumns.length > 0) {
        console.log(`🎨 Synchronisation multi-canaux : ${project.state.availableColumns.length} canaux`);

        // Copier toutes les données CSV nécessaires
        appState.columnNames = project.state.columnNames;
        appState.allColumnData = project.state.allColumnData;
        appState.availableColumns = project.state.availableColumns;
        appState.currentColumnIndex = project.state.currentColumnIndex;
        appState.yAxisLabel = project.state.yAxisLabel;

        // Initialiser le système multi-canaux
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

    // Mettre à jour les onglets
    if (typeof updateProjectTabs === 'function') updateProjectTabs();

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
        updateProjectTabs();
    }, 100);

    console.log("✅ Système POO initialisé avec succès");
    return true;
}

// Export global pour debugging
window.projectManager = projectManager;
window.getActiveProject = getActiveProject;
window.initPOOSystem = initPOOSystem;
window.updateProjectTabs = updateProjectTabs;
window.createNewProject = createNewProject;
window.saveChartZoomLimits = saveChartZoomLimits;
window.restoreChartZoomLimits = restoreChartZoomLimits;
window.saveAllToolsState = saveAllToolsState;
window.restoreAllToolsState = restoreAllToolsState;

console.log("📦 Module project-integration.js chargé");
