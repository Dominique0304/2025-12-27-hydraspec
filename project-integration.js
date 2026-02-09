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

    // IMPORTANT: Exporter vers window IMMÉDIATEMENT après création
    window.projectManager = projectManager;

    // Créer un projet vide par défaut
    const defaultProject = projectManager.createProject("Projet vide");

    console.log("✅ ProjectManager initialisé avec un projet vide");

    // Enregistrer des listeners pour synchroniser l'interface
    projectManager.on('projectCreated', onProjectCreated);
    projectManager.on('projectDeleted', onProjectDeleted);
    projectManager.on('projectSwitched', onProjectSwitched);

    // CRITIQUE : Synchroniser les variables globales avec le projet par défaut
    if (typeof syncGlobalVariablesWithManagers === 'function') {
        syncGlobalVariablesWithManagers();
    }

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

    // CRITIQUE : Synchroniser les variables globales avec les managers du nouveau projet
    if (typeof syncGlobalVariablesWithManagers === 'function') {
        syncGlobalVariablesWithManagers();
    }

    // Mettre à jour tous les graphiques et l'interface
    if (typeof updateAllInterface === 'function') {
        updateAllInterface(false); // Switch entre projets = ne pas fermer freq/spectro
    } else {
        // Fallback : mettre à jour manuellement
        if (typeof updateTimeChart === 'function') updateTimeChart(false);
        if (typeof updateStats === 'function') updateStats();
        if (typeof performAnalysis === 'function') performAnalysis();
        if (typeof updateSpectrogram === 'function') updateSpectrogram();
    }

    // CRITIQUE : Restaurer TOUS les outils (marqueurs, intervalles, etc.)
    // APRÈS avoir restauré les canaux dans updateAllInterface
    restoreAllToolsState(project);

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
    // Container dans la sidebar (nouveau)
    const sidebarContainer = document.getElementById('project-list-container');

    // Récupérer tous les projets
    const projects = projectManager.getAllProjects();

    // Filtrer les projets vides (masquer uniquement "Projet vide" sans données)
    const projectsWithData = projects.filter(project => {
        const isEmptyDefault = project.name === "Projet vide";
        const hasNoData = project.state.fullDataTime.length === 0 && project.state.allColumnData.length === 0;
        return !(isEmptyDefault && hasNoData);
    });

    // Mettre à jour le titre "Acquisition" avec le projet actif
    const acquisitionTitle = document.getElementById('acquisition-title');
    const activeProject = projects.find(p => p.isActive);
    if (acquisitionTitle) {
        if (activeProject) {
            // Utiliser fileName (avec extension) si disponible, sinon project.name
            let displayName = activeProject.fileName || activeProject.name;
            if (activeProject.isModified) {
                displayName += ' *';
            }
            acquisitionTitle.textContent = displayName;
        } else {
            acquisitionTitle.textContent = 'Exemple';
        }
    }

    // Mettre à jour les boutons du menu Fichier
    if (typeof updateFileMenuButtons === 'function') {
        updateFileMenuButtons();
    }

    // Si pas de container sidebar, ne rien faire
    if (!sidebarContainer) {
        console.warn("⚠️ Container de liste de projets non trouvé");
        return;
    }

    // Vider le container
    sidebarContainer.innerHTML = '';

    if (projectsWithData.length === 0) {
        sidebarContainer.innerHTML = `<div style="padding:8px; text-align:center; color:var(--text-muted); font-size:0.8rem; font-style:italic;">${t('labels.no_project')}</div>`;
        return;
    }

    // Créer une liste pour chaque projet
    projectsWithData.forEach(project => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 8px 12px;
            margin: 4px 0;
            background: ${project.isActive ? 'var(--accent-blue)' : 'var(--bg-secondary)'};
            color: ${project.isActive ? 'white' : 'var(--text-main)'};
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            transition: background 0.2s;
        `;
        item.setAttribute('data-project-id', project.id);

        // Icône
        const icon = document.createElement('i');
        icon.className = 'fas fa-file-alt';
        icon.style.cssText = 'width: 16px; font-size: 0.9rem; margin-top: 2px;';

        // Nom du projet (avec extension si disponible, + * si modifié)
        const name = document.createElement('span');

        // Utiliser fileName (avec extension) si disponible, sinon project.name
        let displayName = project.fileName || project.name;
        if (project.isModified) {
            displayName += ' *';
        }

        name.textContent = displayName;
        name.style.cssText = 'flex: 1; font-size: 0.85rem; word-wrap: break-word; line-height: 1.3;';

        // Bouton de fermeture
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'font-size: 1.2rem; font-weight: bold; opacity: 0.7; cursor: pointer; margin-top: -2px;';
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            closeProjectTab(project.id, e);
        };

        // Hover effect
        if (!project.isActive) {
            item.onmouseenter = () => item.style.background = 'var(--border-color)';
            item.onmouseleave = () => item.style.background = 'var(--bg-secondary)';
        }

        // Click handler
        item.onclick = (e) => {
            if (!e.target.closest('span[style*="×"]')) {
                switchToProjectTab(project.id);
            }
        };

        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(closeBtn);
        sidebarContainer.appendChild(item);
    });

    console.log(`📑 Liste de projets mise à jour : ${projectsWithData.length} projet(s)`);
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

    // Mettre à jour l'interface (false = ne pas fermer freq/spectro lors du switch)
    updateAllInterface(false);
}

/**
 * Ferme un projet depuis son onglet
 * @param {string} projectId - ID du projet à fermer
 * @param {Event} event - Événement de clic
 */
async function closeProjectTab(projectId, event) {
    event.stopPropagation();

    const project = projectManager.getProject(projectId);
    if (!project) {
        console.warn(`⚠️ Projet ${projectId} introuvable`);
        return;
    }

    // Vérifier les modifications non sauvegardées
    if (project.isModified) {
        const fileName = project.fileName || project.name;
        const response = confirm(
            `Le fichier "${fileName}" a été modifié.\n\n` +
            `Voulez-vous enregistrer les modifications ?`
        );

        if (response) {
            // L'utilisateur veut sauvegarder
            if (project.fileType === 'hsp') {
                await saveHSP();
            } else if (project.fileType === 'csv') {
                // Fichier CSV, demander export
                const exportResponse = confirm(
                    "Ce fichier est au format CSV. Voulez-vous l'exporter en .HSP ?"
                );
                if (exportResponse) {
                    await exportToHSP();
                }
            }
        }
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

// Fonction createNewProject() supprimée - non nécessaire sans générateur de signal

// ========================================
// SAUVEGARDE/RESTAURATION DES ÉTATS D'OUTILS
// ========================================

/**
 * Sauvegarde les limites de zoom de tous les graphiques dans le projet
 * @param {Project} project - Projet dans lequel sauvegarder
 */
function saveChartZoomLimits(project) {
    if (!project) {
        console.warn("⚠️ Impossible de sauvegarder le zoom : projet invalide");
        return;
    }

    console.log(`💾 Sauvegarde des limites de zoom pour : ${project.name}`);

    // IMPORTANT : Utiliser globalCharts car tous les projets partagent les mêmes graphiques
    const charts = window.globalCharts;
    if (!charts || !charts.time) {
        console.warn("⚠️ globalCharts non disponible");
        return;
    }

    // Sauvegarder le graphique temporel
    if (charts.time && charts.time.options && charts.time.options.scales) {
        const scales = charts.time.options.scales;

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
    if (charts.freq && charts.freq.options && charts.freq.options.scales) {
        const scales = charts.freq.options.scales;

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
    if (charts.spectro && charts.spectro.options && charts.spectro.options.scales) {
        const scales = charts.spectro.options.scales;

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
    if (!project || !project.toolsState || !project.toolsState.chartLimits) {
        console.warn("⚠️ Impossible de restaurer le zoom : projet invalide");
        return;
    }

    console.log(`🔄 Restauration des limites de zoom pour : ${project.name}`);

    // IMPORTANT : Utiliser globalCharts car tous les projets partagent les mêmes graphiques
    const charts = window.globalCharts;
    if (!charts || !charts.time) {
        console.warn("⚠️ globalCharts non disponible");
        return;
    }

    // Restaurer le graphique temporel
    if (charts.time && charts.time.options && charts.time.options.scales) {
        const scales = charts.time.options.scales;
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

        charts.time.update('none');
    }

    // Restaurer le graphique fréquentiel
    if (charts.freq && charts.freq.options && charts.freq.options.scales) {
        const scales = charts.freq.options.scales;
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

        charts.freq.update('none');
    }

    // Restaurer le spectrogramme
    if (charts.spectro && charts.spectro.options && charts.spectro.options.scales) {
        const scales = charts.spectro.options.scales;
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

        charts.spectro.update('none');
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

    // CRITIQUE : Synchroniser les managers depuis les variables globales
    // (au cas où du code aurait modifié les variables globales directement)
    if (typeof syncManagersFromGlobalVariables === 'function') {
        syncManagersFromGlobalVariables();
    }

    // ========================================
    // SAUVEGARDER DEPUIS LES MANAGERS (POO)
    // ========================================

    // NOTE: IntervalManager utilise son propre tableau this.intervals,
    // MAIS intervals.js utilise le tableau global intervals[].
    // On sauvegarde donc depuis le tableau GLOBAL (voir section "outils non encapsulés" plus bas)

    // NOTE: SnapPointManager utilise son propre tableau this.snapPoints,
    // MAIS snappoint-tool.js utilise le tableau global snapPoints[].
    // On sauvegarde donc depuis le tableau GLOBAL (voir section "outils non encapsulés" plus bas)

    // NOTE: Diff Canal utilise également un tableau global diffCanalIntervals[]
    // On ne sauvegarde PAS depuis le manager ici car il peut être désynchronisé.
    // La sauvegarde se fait depuis le tableau GLOBAL dans la section "outils non encapsulés" ci-dessous.

    // ========================================
    // OUTILS NON ENCORE ENCAPSULÉS (ancien système)
    // ========================================

    // Sauvegarder Measure Tool
    if (typeof measureState !== 'undefined') {
        project.toolsState.measureTool = {
            active: measureState.active,
            point1: measureState.point1 ? {...measureState.point1} : null,
            point2: measureState.point2 ? {...measureState.point2} : null,
            dragging: measureState.dragging
        };
    }

    // NOTE: Le code legacy "annotations" a été supprimé.
    // Les annotations de type texte libre sont maintenant gérées via SnapPoints (marqueurs)
    // avec anchorChannelIndex = -1 pour les annotations flottantes.

    // Sauvegarder Intervals (depuis le tableau GLOBAL)
    if (typeof intervals !== 'undefined') {
        project.toolsState.intervals = JSON.parse(JSON.stringify(intervals));
        project.toolsState.nextIntervalId = nextIntervalId;
        project.toolsState.isCreatingInterval = isCreatingInterval;
        console.log(`📐 ${intervals.length} intervalle(s) sauvegardé(s)`, intervals);
    } else {
        console.warn("⚠️ Variable globale 'intervals' non définie !");
    }

    // Sauvegarder SnapPoints (depuis le tableau GLOBAL)
    if (typeof snapPoints !== 'undefined') {
        project.toolsState.snapPoints = JSON.parse(JSON.stringify(snapPoints));
        project.toolsState.nextSnapPointId = nextSnapPointId;
        project.toolsState.isCreatingSnapPoint = isCreatingSnapPoint;
        console.log(`📌 ${snapPoints.length} marqueur(s) sauvegardé(s)`, snapPoints);
    } else {
        console.warn("⚠️ Variable globale 'snapPoints' non définie !");
    }

    // Sauvegarder Diff Canal (depuis le tableau GLOBAL)
    if (typeof diffCanalIntervals !== 'undefined') {
        project.toolsState.diffCanal = {
            intervals: JSON.parse(JSON.stringify(diffCanalIntervals)),
            nextId: typeof nextDiffCanalId !== 'undefined' ? nextDiffCanalId : 1
        };
        console.log(`📏 ${diffCanalIntervals.length} diff/canal(aux) sauvegardé(s)`, diffCanalIntervals);
    } else {
        console.warn("⚠️ Variable globale 'diffCanalIntervals' non définie !");
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

    // Sauvegarder Vues sauvegardées
    if (typeof viewsState !== 'undefined') {
        project.toolsState.views = JSON.parse(JSON.stringify(viewsState.views));
        console.log(`📸 Vues sauvegardées : ${viewsState.views.length} vue(s)`);
    }

    // CRITIQUE : Sauvegarder les curseurs d'analyse depuis appState vers project.state
    if (typeof appState !== 'undefined' && appState.cursorStart !== undefined && appState.cursorEnd !== undefined) {
        project.state.cursorStart = appState.cursorStart;
        project.state.cursorEnd = appState.cursorEnd;
        console.log(`📍 Curseurs sauvegardés : ${appState.cursorStart}s à ${appState.cursorEnd}s`);
    }

    // CRITIQUE : Sauvegarder les données du spectrogramme
    if (typeof appState !== 'undefined' && appState.spectroData !== undefined) {
        project.state.spectroData = appState.spectroData;
        const count = appState.spectroData ? appState.spectroData.length : 0;
        console.log(`📊 Spectrogramme sauvegardé : ${count} points`);
    }

    // CRITIQUE : Sauvegarder les notes utilisateur
    const notesTextarea = document.getElementById('user-notes');
    if (notesTextarea) {
        project.toolsState.notes = notesTextarea.value;
        console.log(`📝 Notes utilisateur sauvegardées (${notesTextarea.value.length} caractères)`);
    }

    // CRITIQUE : Sauvegarder les canaux lissés, calculés et dérivés
    if (typeof appState !== 'undefined') {
        if (appState.smoothedChannels) {
            project.toolsState.smoothedChannels = JSON.parse(JSON.stringify(appState.smoothedChannels));
            console.log(`🔧 Canaux lissés sauvegardés : ${appState.smoothedChannels.length} canal(aux)`);
        }
        if (appState.calculatedChannels) {
            project.toolsState.calculatedChannels = JSON.parse(JSON.stringify(appState.calculatedChannels));
            console.log(`🔧 Canaux calculés sauvegardés : ${appState.calculatedChannels.length} canal(aux)`);
        }
        if (appState.derivativeChannels) {
            project.toolsState.derivativeChannels = JSON.parse(JSON.stringify(appState.derivativeChannels));
            console.log(`🔧 Canaux dérivés sauvegardés : ${appState.derivativeChannels.length} canal(aux)`);
        }
    }

    // Marquer le projet comme modifié
    project.markModified();

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

    // ========================================
    // RESTAURER DEPUIS LES MANAGERS (POO)
    // ========================================

    // Restaurer Intervals depuis le manager
    // CRITIQUE : TOUJOURS charger (même si vide) pour nettoyer les anciennes données
    if (project.intervalManager) {
        // Charger dans le manager (crée automatiquement les instances Interval)
        project.intervalManager.load({
            intervals: project.toolsState.intervals || [],
            nextIntervalId: project.toolsState.nextIntervalId || 1,
            isCreating: project.toolsState.isCreatingInterval || false,
            pendingIntervalData: project.toolsState.pendingIntervalData || null
        });

        // CRITIQUE : Synchroniser window.intervals avec le tableau du manager
        // Nécessaire car .load() réassigne this.intervals à un nouveau tableau
        if (typeof syncGlobalVariablesWithManagers === 'function') {
            syncGlobalVariablesWithManagers();
        }

        // Mettre à jour l'affichage
        if (typeof updateIntervalsList === 'function') {
            updateIntervalsList();
        }
    }

    // Restaurer SnapPoints depuis le manager
    // CRITIQUE : TOUJOURS charger (même si vide) pour nettoyer les anciennes données
    if (project.snapPointManager) {
        // Charger dans le manager (crée automatiquement les instances SnapPoint)
        project.snapPointManager.load({
            snapPoints: project.toolsState.snapPoints || [],
            nextSnapPointId: project.toolsState.nextSnapPointId || 1,
            isCreating: project.toolsState.isCreatingSnapPoint || false
        });

        // CRITIQUE : Synchroniser window.snapPoints avec le tableau du manager
        if (typeof syncGlobalVariablesWithManagers === 'function') {
            syncGlobalVariablesWithManagers();
        }

        // Mettre à jour l'affichage
        if (typeof updateSnapPointsList === 'function') {
            updateSnapPointsList();
        }
    }

    // Restaurer Diff Canal depuis le manager
    // CRITIQUE : TOUJOURS charger (même si vide) pour nettoyer les anciennes données
    if (project.diffCanalManager) {
        // Charger dans le manager
        project.diffCanalManager.load({
            intervals: project.toolsState.diffCanal ? project.toolsState.diffCanal.intervals : [],
            nextId: project.toolsState.diffCanal ? project.toolsState.diffCanal.nextId : 1
        });

        // CRITIQUE : Synchroniser window.diffCanalIntervals avec le tableau du manager
        if (typeof syncGlobalVariablesWithManagers === 'function') {
            syncGlobalVariablesWithManagers();
        }

        // Mettre à jour l'affichage
        if (typeof updateDiffCanalList === 'function') {
            updateDiffCanalList();
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

    // NOTE: Code legacy "annotations" supprimé - voir SnapPoints pour annotations flottantes

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

    // Restaurer Diff Canal (code legacy pour compatibilité)
    // CRITIQUE : TOUJOURS vider le tableau, même si le projet n'a pas de diffCanal
    if (typeof diffCanalIntervals !== 'undefined' && typeof DiffCanalInterval !== 'undefined') {
        diffCanalIntervals.length = 0; // Vider SYSTÉMATIQUEMENT

        // Restaurer seulement si le projet a des diffCanal sauvegardés
        if (project.toolsState.diffCanal && project.toolsState.diffCanal.intervals && project.toolsState.diffCanal.intervals.length > 0) {
            // Recréer les instances de la classe DiffCanalInterval
            project.toolsState.diffCanal.intervals.forEach(data => {
                const diffInterval = new DiffCanalInterval(data.id, data.channelIndex, data.point1, data.point2);
                diffInterval.labelOffset = data.labelOffset;
                diffInterval.horizontalLabelOffsetX = data.horizontalLabelOffsetX;
                diffInterval.verticalLabelOffsetY = data.verticalLabelOffsetY;
                diffInterval.visible = data.visible;
                diffInterval.color = data.color;
                diffCanalIntervals.push(diffInterval);
            });

            nextDiffCanalId = project.toolsState.diffCanal.nextId;
            console.log(`📏 ${diffCanalIntervals.length} diff/canal(aux) restauré(s)`);
        } else {
            nextDiffCanalId = 1;
            console.log(`📏 Aucun diff/canal à restaurer (tableau vidé)`);
        }

        // Mettre à jour l'affichage dans tous les cas
        if (typeof updateDiffCanalList === 'function') {
            updateDiffCanalList();
        }
    }

    // Restaurer Marqueurs (SnapPoints)
    // CRITIQUE : TOUJOURS vider le tableau, même si le nouveau projet n'a pas de snapPoints
    if (typeof snapPoints !== 'undefined' && typeof SnapPoint !== 'undefined') {
        snapPoints.length = 0; // Vider le tableau SYSTÉMATIQUEMENT

        // Restaurer seulement si le projet a des snapPoints sauvegardés
        if (project.toolsState.snapPoints && project.toolsState.snapPoints.length > 0) {
            // Recréer les instances de la classe SnapPoint
            project.toolsState.snapPoints.forEach(data => {
                // CRITIQUE: Utiliser xValue (pas time) pour le constructeur
                const snapPoint = new SnapPoint(data.id, data.channelIndex, data.xValue, data.value);

                // Restaurer TOUTES les propriétés
                snapPoint.comment = data.comment || '';
                snapPoint.offsetX = data.offsetX || 80;
                snapPoint.offsetY = data.offsetY || -40;
                snapPoint.visible = data.visible !== false;
                snapPoint.color = data.color || '#4ECDC4';

                // Formatage texte
                snapPoint.fontSize = data.fontSize || window.chartFontSize;
                snapPoint.fontWeight = data.fontWeight || 'normal';
                snapPoint.fontStyle = data.fontStyle || 'normal';
                snapPoint.textDecoration = data.textDecoration || 'none';
                snapPoint.textAlign = data.textAlign || 'center';
                snapPoint.textVerticalAlign = data.textVerticalAlign || 'middle';

                // Apparence boîte
                snapPoint.backgroundColor = data.backgroundColor || '#FFD93D';
                snapPoint.backgroundOpacity = data.backgroundOpacity !== undefined ? data.backgroundOpacity : 0.9;
                snapPoint.boxPaddingScale = data.boxPaddingScale || 1.0;
                snapPoint.boxWidth = data.boxWidth || null;
                snapPoint.boxHeight = data.boxHeight || null;

                // Accrochage
                snapPoint.anchorChannelIndex = data.anchorChannelIndex !== undefined ? data.anchorChannelIndex : data.channelIndex;

                // Flèche
                snapPoint.hasArrow = data.hasArrow || false;
                snapPoint.arrowEndX = data.arrowEndX || 150;
                snapPoint.arrowEndY = data.arrowEndY || -80;

                snapPoints.push(snapPoint);
            });

            if (project.toolsState.nextSnapPointId !== undefined) {
                nextSnapPointId = project.toolsState.nextSnapPointId;
            }
            if (project.toolsState.isCreatingSnapPoint !== undefined) {
                isCreatingSnapPoint = project.toolsState.isCreatingSnapPoint;
            }

            console.log(`📌 ${snapPoints.length} marqueur(s) restauré(s) dans le tableau global`);
        } else {
            console.log(`📌 Aucun marqueur à restaurer (tableau vidé)`);
        }

        // Mettre à jour l'affichage dans tous les cas
        if (typeof updateSnapPointsList === 'function') {
            updateSnapPointsList();
        }
    }

    // Restaurer les notes utilisateur
    const notesTextarea = document.getElementById('user-notes');
    if (notesTextarea && project.toolsState.notes !== undefined) {
        notesTextarea.value = project.toolsState.notes;
        console.log(`📝 Notes utilisateur restaurées (${project.toolsState.notes.length} caractères)`);
    }

    // Restaurer et recréer les canaux lissés, calculés et dérivés
    // CRITIQUE : TOUJOURS vider les tableaux, même si le nouveau projet n'a pas de canaux
    if (typeof appState !== 'undefined') {
        // IMPORTANT: Restaurer dans l'ordre de dépendance :
        // 1. Calculés (dépendent uniquement des données brutes)
        // 2. Lissés (peuvent dépendre des canaux calculés)
        // 3. Dérivés (peuvent dépendre des canaux calculés ET lissés)

        // 1. Restaurer les canaux calculés EN PREMIER
        // CRITIQUE : TOUJOURS vider, même si le projet n'en a pas
        appState.calculatedChannels = [];

        if (project.toolsState.calculatedChannels && project.toolsState.calculatedChannels.length > 0) {
            console.log(`🔧 Recréation de ${project.toolsState.calculatedChannels.length} canal(aux) calculé(s)...`);

            project.toolsState.calculatedChannels.forEach(channel => {
                const channelCopy = JSON.parse(JSON.stringify(channel));
                appState.calculatedChannels.push(channelCopy);

                if (typeof recreateCalculatedChannel === 'function') {
                    recreateCalculatedChannel(channelCopy);
                }
            });
        } else {
            console.log(`🔧 Aucun canal calculé à restaurer (tableau vidé)`);
        }

        // Rafraîchir la liste d'affichage dans tous les cas
        if (typeof updateCalculatedChannelsList === 'function') {
            updateCalculatedChannelsList();
        }

        // 2. Restaurer les canaux lissés (peuvent utiliser les canaux calculés)
        // CRITIQUE : TOUJOURS vider, même si le projet n'en a pas
        appState.smoothedChannels = [];

        if (project.toolsState.smoothedChannels && project.toolsState.smoothedChannels.length > 0) {
            console.log(`🔧 Recréation de ${project.toolsState.smoothedChannels.length} canal(aux) lissé(s)...`);

            project.toolsState.smoothedChannels.forEach(channel => {
                const channelCopy = JSON.parse(JSON.stringify(channel));
                appState.smoothedChannels.push(channelCopy);

                if (typeof recreateSmoothedChannel === 'function') {
                    recreateSmoothedChannel(channelCopy);
                }
            });
        } else {
            console.log(`🔧 Aucun canal lissé à restaurer (tableau vidé)`);
        }

        // Rafraîchir la liste d'affichage dans tous les cas
        if (typeof updateSmoothedChannelsList === 'function') {
            updateSmoothedChannelsList();
        }

        // 3. Restaurer les canaux dérivés EN DERNIER (peuvent dépendre des calculés et lissés)
        // CRITIQUE : TOUJOURS vider, même si le projet n'en a pas
        appState.derivativeChannels = [];

        if (project.toolsState.derivativeChannels && project.toolsState.derivativeChannels.length > 0) {
            console.log(`🔧 Recréation de ${project.toolsState.derivativeChannels.length} canal(aux) dérivé(s)...`);

            project.toolsState.derivativeChannels.forEach(channel => {
                const channelCopy = JSON.parse(JSON.stringify(channel));
                appState.derivativeChannels.push(channelCopy);

                if (typeof recreateDerivativeChannel === 'function') {
                    recreateDerivativeChannel(channelCopy);
                }
            });
        } else {
            console.log(`🔧 Aucun canal dérivé à restaurer (tableau vidé)`);
        }

        // Rafraîchir la liste d'affichage dans tous les cas
        if (typeof updateDerivativeChannelsList === 'function') {
            updateDerivativeChannelsList();
        }

        // Rafraîchir les sélecteurs de canaux sources
        if (typeof populateSmoothedChannelSelector === 'function') {
            populateSmoothedChannelSelector();
        }
        if (typeof populateDerivativeSourceChannels === 'function') {
            populateDerivativeSourceChannels();
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
 * @param {boolean} isInitialLoad - Si true, ferme les fenêtres freq/spectro (chargement initial)
 */
function updateAllInterface(isInitialLoad = false) {
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

        // CRITIQUE : Synchroniser les données brutes pour les graphiques
        appState.fullDataTime = project.state.fullDataTime;
        appState.fullDataPressure = project.state.fullDataPressure;
        appState.fs = project.state.fs;
        appState.timeIncrement = project.state.timeIncrement;

        // CRITIQUE : Restaurer la configuration multi-canaux si elle existe
        if (project.state.channelConfig && project.state.channelConfig.length > 0) {
            // La configuration existe déjà dans le projet, la restaurer
            console.log(`✅ Restauration de la configuration multi-canaux (${project.state.channelConfig.length} canaux)`);
            appState.channelConfig = JSON.parse(JSON.stringify(project.state.channelConfig));
        } else {
            // Première fois, initialiser la configuration par défaut
            console.log(`🆕 Initialisation nouvelle configuration multi-canaux`);
            if (typeof initChannelConfig === 'function') {
                initChannelConfig();
                // Sauvegarder la nouvelle config dans le projet
                project.state.channelConfig = JSON.parse(JSON.stringify(appState.channelConfig));
            }
        }

        // CRITIQUE : Créer le canal fantôme pour les annotations flottantes
        // (APRÈS le chargement ou l'initialisation des canaux normaux)
        if (typeof getOrCreatePhantomChannel === 'function') {
            getOrCreatePhantomChannel();
        }

        if (typeof updateColumnSelector === 'function') {
            updateColumnSelector();
        }

        // CRITIQUE : Restaurer les canaux dans l'ordre de dépendance :
        // 1. Calculés (dépendent uniquement des données brutes)
        // 2. Lissés (peuvent dépendre des canaux calculés)
        // 3. Dérivés (peuvent dépendre des canaux calculés ET lissés)

        // 1. Restaurer les canaux calculés EN PREMIER
        appState.calculatedChannels = [];

        if (project.toolsState.calculatedChannels && project.toolsState.calculatedChannels.length > 0) {
            console.log(`🔄 Restauration de ${project.toolsState.calculatedChannels.length} canal(aux) calculé(s)...`);

            // Copier les données sauvegardées dans appState
            project.toolsState.calculatedChannels.forEach(channel => {
                const channelCopy = JSON.parse(JSON.stringify(channel));
                appState.calculatedChannels.push(channelCopy);

                // Recréer les données du canal
                if (typeof recreateCalculatedChannel === 'function') {
                    recreateCalculatedChannel(channelCopy);
                }
            });

            // Rafraîchir la liste des canaux calculés dans l'UI
            if (typeof updateCalculatedChannelsList === 'function') {
                updateCalculatedChannelsList();
            }

            console.log(`✅ ${appState.calculatedChannels.length} canal(aux) calculé(s) restauré(s)`);
        } else {
            console.log(`🔧 Aucun canal calculé à restaurer pour ${project.name}`);
        }

        // CRITIQUE : Initialiser le système de lissage après chargement des canaux
        if (typeof initSmoothingSystem === 'function') {
            initSmoothingSystem();
        }

        // CRITIQUE : Restaurer les canaux lissés depuis le projet AVANT de les recréer
        // Vider d'abord pour éviter les conflits
        appState.smoothedChannels = [];

        if (project.toolsState.smoothedChannels && project.toolsState.smoothedChannels.length > 0) {
            console.log(`🔄 Restauration de ${project.toolsState.smoothedChannels.length} canal(aux) lissé(s)...`);

            // Copier les données sauvegardées dans appState
            project.toolsState.smoothedChannels.forEach(channel => {
                const channelCopy = JSON.parse(JSON.stringify(channel));
                appState.smoothedChannels.push(channelCopy);

                // Recréer les données du canal
                if (typeof recreateSmoothedChannel === 'function') {
                    recreateSmoothedChannel(channelCopy);
                }
            });

            // Rafraîchir la liste des canaux lissés dans l'UI
            if (typeof updateSmoothedChannelsList === 'function') {
                updateSmoothedChannelsList();
            }

            console.log(`✅ ${appState.smoothedChannels.length} canal(aux) lissé(s) restauré(s)`);
        } else {
            console.log(`🔧 Aucun canal lissé à restaurer pour ${project.name}`);
        }

        // CRITIQUE : Initialiser le système de dérivée après chargement des canaux
        if (typeof initDerivativeSystem === 'function') {
            initDerivativeSystem();
        }

        // CRITIQUE : Restaurer les canaux dérivés depuis le projet AVANT de les recréer
        // Vider d'abord pour éviter les conflits
        appState.derivativeChannels = [];

        if (project.toolsState.derivativeChannels && project.toolsState.derivativeChannels.length > 0) {
            console.log(`🔄 Restauration de ${project.toolsState.derivativeChannels.length} canal(aux) dérivé(s)...`);

            // Copier les données sauvegardées dans appState
            project.toolsState.derivativeChannels.forEach(channel => {
                const channelCopy = JSON.parse(JSON.stringify(channel));
                appState.derivativeChannels.push(channelCopy);

                // Recréer les données du canal
                if (typeof recreateDerivativeChannel === 'function') {
                    recreateDerivativeChannel(channelCopy);
                }
            });

            // Rafraîchir la liste des canaux dérivés dans l'UI
            if (typeof updateDerivativeChannelsList === 'function') {
                updateDerivativeChannelsList();
            }

            console.log(`✅ ${appState.derivativeChannels.length} canal(aux) dérivé(s) restauré(s)`);
        } else {
            console.log(`🔧 Aucun canal dérivé à restaurer pour ${project.name}`);
        }

        // CRITIQUE : Peupler le sélecteur de canal pour les annotations
        if (typeof populateChannelSelector === 'function') {
            populateChannelSelector(-1); // -1 = annotation libre par défaut
        }
    }

    // CRITIQUE : Synchroniser les curseurs d'analyse
    // Le Proxy ne suffit pas toujours pour les plugins Chart.js
    appState.cursorStart = project.state.cursorStart;
    appState.cursorEnd = project.state.cursorEnd;
    console.log(`🎯 Curseurs synchronisés : ${appState.cursorStart}s à ${appState.cursorEnd}s`);

    // CRITIQUE : Synchroniser la taille de police globale
    appState.chartFontSize = project.state.chartFontSize || 12;
    window.chartFontSize = appState.chartFontSize;
    const fontSizeInput = document.getElementById('font-size-input');
    if (fontSizeInput) {
        fontSizeInput.value = window.chartFontSize;
    }
    console.log(`✏️ Taille de police restaurée : ${window.chartFontSize}px`);

    // CRITIQUE : Synchroniser les données du spectrogramme
    appState.spectroData = project.state.spectroData;
    console.log(`📊 Spectrogramme synchronisé : ${appState.spectroData ? appState.spectroData.length + ' points' : 'aucune donnée'}`);

    // Synchroniser l'aperçu des premières lignes du fichier
    appState.rawFilePreview = project.state.rawFilePreview || "";
    console.log(`📄 Aperçu fichier synchronisé : ${appState.rawFilePreview ? appState.rawFilePreview.split('\n').length + ' lignes' : 'aucun aperçu'}`);

    // Mettre à jour les graphiques
    if (typeof updateTimeChart === 'function') updateTimeChart(isInitialLoad);
    if (typeof updateStats === 'function') updateStats();
    if (typeof performAnalysis === 'function') performAnalysis();

    // Restaurer le spectrogramme existant ou le recalculer si nécessaire
    if (typeof restoreSpectrogramDisplay === 'function') {
        restoreSpectrogramDisplay();
    } else if (typeof updateSpectrogram === 'function') {
        updateSpectrogram();
    }

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
    // CRITIQUE : Restaurer le pas (ms) dans le champ de saisie manuel
    if (document.getElementById('manual-step-config')) {
        const stepMs = (project.state.timeIncrement * 1000).toFixed(2);
        document.getElementById('manual-step-config').value = stepMs;
        console.log(`🔄 Pas (ms) restauré dans le champ manuel : ${stepMs} ms`);

        // CRITIQUE : Synchroniser l'état interne avec le pas restauré
        if (typeof updateFsFromStep === 'function') {
            updateFsFromStep();
            console.log(`✅ État interne synchronisé avec le pas (ms) restauré`);
        }
    }

    setStatus(`Interface mise à jour : ${project.name}`);
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

        // Définir les informations de fichier CSV
        project.setFileInfo('csv', file.name);

        console.log(`✅ CSV chargé dans le projet : ${project.name}`);
        console.log(`   - ${project.state.fullDataTime.length} points`);
        console.log(`   - Fs: ${project.state.fs.toFixed(1)} Hz`);
        console.log(`   - ${project.state.availableColumns.length} canaux`);

        // IMPORTANT : Basculer vers le nouveau projet
        projectManager.switchTo(project.id);
        console.log(`🔄 Basculé vers le nouveau projet : ${project.name}`);

        // Note: updateAllInterface() sera appelé par onProjectSwitched() via l'événement projectSwitched
        // On doit quand même l'appeler ici avec true pour fermer freq/spectro au chargement initial
        updateAllInterface(true);

        // Ouvrir le configurateur, appliquer auto-groupé, puis fermer (invisible pour l'utilisateur)
        setTimeout(() => {
            if (typeof openChannelConfig === 'function' && typeof closeChannelConfig === 'function') {
                console.log("🔧 Auto-config: Ouverture du configurateur (invisible)...");
                openChannelConfig(true); // true = mode silencieux

                // Attendre que le DOM soit prêt, puis appliquer auto-groupé PENDANT que c'est ouvert
                setTimeout(() => {
                    if (typeof autoPresetYScales === 'function') {
                        console.log("📊 Application du preset 'Auto Groupé' (configurateur ouvert)...");
                        autoPresetYScales();
                    }

                    // Réinitialiser le zoom X au maximum (toute la durée d'enregistrement)
                    // D'abord, mettre à jour les champs de zoom (IMPORTANT pour que updateTimeChart utilise les bonnes valeurs)
                    const zoomMinInput = document.getElementById('zoom-min');
                    const zoomMaxInput = document.getElementById('zoom-max');
                    if (zoomMinInput && zoomMaxInput && appState.fullDataTime.length) {
                        const t = appState.fullDataTime;
                        zoomMinInput.value = (t[0] / 1000).toFixed(3); // Convertir ms en s
                        zoomMaxInput.value = (t[t.length - 1] / 1000).toFixed(3);
                        console.log("🔍 Zoom X réinitialisé: " + zoomMinInput.value + " à " + zoomMaxInput.value + " sec");
                    }

                    // Puis mettre à jour le graphique directement
                    const chart = appState.charts.time;
                    if (chart && appState.fullDataTime.length) {
                        const t = appState.fullDataTime;
                        chart.options.scales.x.min = t[0];
                        chart.options.scales.x.max = t[t.length - 1];
                        chart.update('none');
                    }

                    // Centrer les curseurs
                    setTimeout(() => {
                        if (typeof centerCursors === 'function') {
                            console.log("🎯 Centrage des curseurs...");
                            centerCursors();
                        }

                        // Fermer le configurateur après tout
                        setTimeout(() => {
                            closeChannelConfig(true); // true = mode silencieux
                            console.log("✅ Auto-config terminée (configurateur invisible fermé)");
                        }, 100);
                    }, 100);
                }, 200);
            }
        }, 300);

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
        updateAllInterface(false); // Initialisation sans données = ne pas fermer freq/spectro
        updateProjectTabs();
    }, 100);

    console.log("✅ Système POO initialisé avec succès");
    return true;
}

// Export global pour debugging
// ========================================
// RÉIMPORTATION CSV DEPUIS APERÇU
// ========================================

/**
 * Réimporte les données CSV depuis le champ d'aperçu modifiable
 * Permet de corriger l'en-tête ou les données sans modifier le fichier original
 */
async function reimportFromPreview() {
    const textarea = document.getElementById('file-preview-text');
    if (!textarea) {
        console.error("❌ Textarea d'aperçu non trouvé");
        return;
    }

    const csvContent = textarea.value.trim();
    if (!csvContent) {
        alert(t("dialogs.no_csv_content") || "Aucun contenu CSV à importer");
        return;
    }

    const project = getActiveProject();
    if (!project || project.fileType !== 'csv') {
        alert(t("dialogs.not_csv_file") || "Cette fonction est réservée aux fichiers CSV");
        return;
    }

    // Demander confirmation
    const fileName = project.fileName || project.name;
    const confirm = window.confirm(
        (t("dialogs.reimport_csv_confirm") ||
        "Voulez-vous réimporter le CSV avec les modifications ?\n\n" +
        "Cela remplacera les données actuelles du projet '{fileName}'.\n" +
        "Le fichier original ne sera pas modifié.").replace('{fileName}', fileName)
    );

    if (!confirm) return;

    try {
        setStatus(t("status.reimporting_csv") || "Réimportation du CSV...");

        // Créer un objet File virtuel à partir du contenu du textarea
        // On reconstruit le CSV complet en utilisant les 5 lignes + le reste depuis allColumnData
        const fullCsvContent = reconstructFullCSV(csvContent);
        const blob = new Blob([fullCsvContent], { type: 'text/csv' });
        const virtualFile = new File([blob], fileName, { type: 'text/csv' });

        // Sauvegarder l'ID du projet actuel pour le supprimer après
        const oldProjectId = project.id;

        // Créer un nouveau projet depuis le CSV modifié
        const newProject = await projectManager.createProjectFromCSV(virtualFile);
        newProject.setFileInfo('csv', fileName);

        console.log(`✅ CSV réimporté : ${newProject.name}`);

        // Basculer vers le nouveau projet
        projectManager.switchTo(newProject.id);

        // Supprimer l'ancien projet
        projectManager.deleteProject(oldProjectId);

        // Mettre à jour l'interface
        updateAllInterface(true);

        // Appliquer auto-config comme pour un nouveau CSV
        setTimeout(() => {
            if (typeof openChannelConfig === 'function' && typeof closeChannelConfig === 'function') {
                openChannelConfig(true); // Mode silencieux
                setTimeout(() => {
                    if (typeof autoPresetYScales === 'function') {
                        autoPresetYScales();
                    }

                    // Réinitialiser le zoom X
                    const zoomMinInput = document.getElementById('zoom-min');
                    const zoomMaxInput = document.getElementById('zoom-max');
                    if (zoomMinInput && zoomMaxInput && appState.fullDataTime.length) {
                        const t = appState.fullDataTime;
                        zoomMinInput.value = (t[0] / 1000).toFixed(3);
                        zoomMaxInput.value = (t[t.length - 1] / 1000).toFixed(3);
                    }

                    setTimeout(() => {
                        if (typeof updateTimeChart === 'function') updateTimeChart(true);
                        closeChannelConfig();
                    }, 100);
                }, 100);
            }
        }, 300);

        setStatus(t("status.csv_reimported") || "CSV réimporté avec succès");

    } catch (error) {
        console.error("❌ Erreur réimportation CSV:", error);
        alert((t("dialogs.reimport_error") || "Erreur lors de la réimportation du CSV") + ":\n" + error.message);
        setStatus(t("status.reimport_failed") || "Échec de la réimportation");
    }
}

/**
 * Reconstruit le CSV complet en utilisant les 5 premières lignes modifiées
 * + le reste des données depuis allColumnData
 */
function reconstructFullCSV(modifiedHeaderLines) {
    const lines = modifiedHeaderLines.split('\n');

    // Si l'utilisateur a modifié plus que l'en-tête, on utilise tout le contenu tel quel
    // Sinon, on reconstruit avec les données complètes
    if (lines.length > 5) {
        return modifiedHeaderLines;
    }

    // Détecter le séparateur depuis la première ligne
    const firstLine = lines[0];
    let separator = firstLine.includes(';') ? ';' :
        firstLine.includes(',') ? ',' :
        firstLine.includes('\t') ? '\t' : ';';

    // Utiliser les lignes modifiées + reconstruire le reste depuis allColumnData
    let csv = modifiedHeaderLines;

    // Ajouter les données depuis la ligne 6 (index 5)
    if (appState.allColumnData && appState.allColumnData.length > 0) {
        const numRows = appState.allColumnData[0].length;
        const numCols = appState.allColumnData.length;

        // Commencer après les 5 premières lignes (ou depuis 1 si header)
        const startRow = lines[0].match(/^[0-9.,]/) ? 5 : 6; // Si pas d'en-tête, commencer à 5, sinon 6

        for (let i = startRow; i < numRows; i++) {
            const row = [];
            for (let j = 0; j < numCols; j++) {
                // Temps en secondes (colonne 0)
                if (j === 0) {
                    row.push((appState.allColumnData[j][i] / 1000).toFixed(6));
                } else {
                    row.push(appState.allColumnData[j][i].toFixed(6));
                }
            }
            csv += '\n' + row.join(separator);
        }
    }

    return csv;
}

// Note: window.projectManager est assigné dans initProjectManager()
window.getActiveProject = getActiveProject;
window.initPOOSystem = initPOOSystem;
window.updateProjectTabs = updateProjectTabs;
window.reimportFromPreview = reimportFromPreview;
// window.createNewProject supprimé - fonction n'existe plus
window.saveChartZoomLimits = saveChartZoomLimits;
window.restoreChartZoomLimits = restoreChartZoomLimits;
window.saveAllToolsState = saveAllToolsState;
window.restoreAllToolsState = restoreAllToolsState;

console.log("📦 Module project-integration.js chargé");
