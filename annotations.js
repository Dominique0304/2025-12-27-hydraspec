// --- ANNOTATIONS SYSTEM 2---

// Variables globales pour le système d'annotations
let annotations = [];
let isCreatingAnnotation = false;
let tempAnnotation = null;
let currentHoveredAnnotation = null;
let annotationsVisible = true; // nouvelle variable pour la visibilité globale

// Fonction helper pour extraire l'unité du nom du canal
function extractUnitFromChannelName(channelName) {
    const match = channelName.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
}

// Fonction helper pour obtenir le nom du canal depuis l'index
function getChannelNameByIndex(channelIndex) {
    if (!appState.channelConfig || channelIndex >= appState.channelConfig.length) {
        return 'Canal';
    }
    return appState.channelConfig[channelIndex].label || `Canal ${channelIndex + 1}`;
}

// Fonction helper pour obtenir l'unité du canal depuis l'index
function getChannelUnitByIndex(channelIndex) {
    if (!appState.channelConfig || channelIndex >= appState.channelConfig.length) {
        return appState.yAxisLabel || 'Bar';
    }
    const config = appState.channelConfig[channelIndex];
    // Extraire l'unité entre parenthèses dans le label
    const unit = extractUnitFromChannelName(config.label);
    return unit || config.unit || appState.yAxisLabel || 'Bar';
}

// Fonction pour obtenir la valeur Y réelle sur une courbe à un temps donné
function getValueOnCurve(channelIndex, timeInSeconds) {
    const timeMs = timeInSeconds * 1000; // Convertir en ms
    const dataTime = appState.fullDataTime;

    // Obtenir les données du bon canal
    let dataValues;
    if (appState.allColumnData && appState.allColumnData[channelIndex + 1]) {
        // +1 car allColumnData[0] est le temps
        dataValues = appState.allColumnData[channelIndex + 1];
    } else {
        dataValues = appState.fullDataPressure;
    }

    if (!dataTime || !dataValues || dataTime.length === 0) {
        return null;
    }

    // Trouver l'index du point le plus proche
    let closestIndex = 0;
    let minDiff = Math.abs(dataTime[0] - timeMs);

    for (let i = 1; i < dataTime.length; i++) {
        const diff = Math.abs(dataTime[i] - timeMs);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
        if (dataTime[i] > timeMs) break; // Optimisation
    }

    return dataValues[closestIndex];
}

// Vérifier si l'outil annotation est déployé
function isAnnotationToolExpanded() {
    const content = document.getElementById('annotations-content');
    return content && content.style.display !== 'none';
}

// Variables pour le formatage de l'annotation en cours
let currentAnnotationFormat = {
    bold: false,
    italic: false,
    underline: false,
    fontSize: 0.85
};

// Toggle formatage (appliqué à tout le texte)
function toggleAnnotationFormat(type) {
    const btn = document.getElementById('fmt-' + type);
    if (!btn) return;

    currentAnnotationFormat[type] = !currentAnnotationFormat[type];

    // Mettre à jour l'apparence du bouton
    if (currentAnnotationFormat[type]) {
        btn.style.background = 'var(--accent-blue)';
        btn.style.color = 'white';
    } else {
        btn.style.background = 'var(--bg-secondary)';
        btn.style.color = '';
    }

    // Appliquer le formatage au textarea en temps réel
    applyFormattingToTextarea();
}

// Définir la taille de police
function setAnnotationFontSize(size) {
    currentAnnotationFormat.fontSize = parseFloat(size);
    applyFormattingToTextarea();
}

// Appliquer le formatage au textarea
function applyFormattingToTextarea() {
    const textarea = document.getElementById('annotation-text-input');
    if (!textarea) return;

    let fontWeight = currentAnnotationFormat.bold ? 'bold' : 'normal';
    let fontStyle = currentAnnotationFormat.italic ? 'italic' : 'normal';
    let textDecoration = currentAnnotationFormat.underline ? 'underline' : 'none';
    let fontSize = currentAnnotationFormat.fontSize + 'em';

    textarea.style.fontWeight = fontWeight;
    textarea.style.fontStyle = fontStyle;
    textarea.style.textDecoration = textDecoration;
    textarea.style.fontSize = fontSize;
}

// Réinitialiser le formatage
function resetAnnotationFormat() {
    currentAnnotationFormat = {
        bold: false,
        italic: false,
        underline: false,
        fontSize: 0.85
    };

    // Réinitialiser les boutons
    ['bold', 'italic', 'underline'].forEach(type => {
        const btn = document.getElementById('fmt-' + type);
        if (btn) {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.color = '';
        }
    });

    const sizeSelect = document.getElementById('fmt-size');
    if (sizeSelect) {
        sizeSelect.value = '0.85';
    }
}

// Charger le formatage d'une annotation existante
function loadAnnotationFormat(annotation) {
    currentAnnotationFormat.fontSize = annotation.fontSize || 0.85;
    currentAnnotationFormat.bold = annotation.fontWeight === 'bold';
    currentAnnotationFormat.italic = annotation.fontStyle === 'italic';
    currentAnnotationFormat.underline = annotation.textDecoration && annotation.textDecoration.includes('underline');

    // Mettre à jour l'UI
    ['bold', 'italic', 'underline'].forEach(type => {
        const btn = document.getElementById('fmt-' + type);
        if (btn && currentAnnotationFormat[type]) {
            btn.style.background = 'var(--accent-blue)';
            btn.style.color = 'white';
        }
    });

    const sizeSelect = document.getElementById('fmt-size');
    if (sizeSelect) {
        sizeSelect.value = currentAnnotationFormat.fontSize.toString();
    }
}

class Annotation {
    constructor(id, time, yValue, text, color = '#FFD700', isFreeFloating = false) {
        this.id = id;
        this.time = time; // en secondes
        this.yValue = yValue; // valeur Y du point
        this.text = text;
        this.color = color;
        this.width = 200;
        this.height = 80; // RÉDUIT de 100 à 80
        this.offsetX = 20; // décalage par rapport au point
        this.offsetY = -50; // décalage par rapport au point
        this.pinned = false; // si l'annotation suit le défilement
        this.createdAt = Date.now();
        this.zIndex = 1000 + annotations.length;
        this.visible = true; // visibilité de l'annotation
        this.columnIndex = appState.currentColumnIndex; // canal d'origine
        this.isFreeFloating = isFreeFloating; // annotation libre (non reliée à une courbe)
        this.markerRadius = 6; // Rayon du point d'encrage (réduit de 8 à 6 par défaut)
        this.backgroundStyle = 'blur'; // Style d'arrière-plan: 'blur' ou 'transparent'
        // Formatage du texte
        this.fontSize = 0.85; // em
        this.fontWeight = 'normal';
        this.fontStyle = 'normal';
        this.textDecoration = 'none';
    }

    // Calcule la position en pixels sur le canvas
    getPixelPosition(chart) {
        if (!chart || !chart.scales) return { x: 0, y: 0 };

        const xScale = chart.scales.x;

        // Trouver le bon axe Y pour ce canal
        let yScale = chart.scales.y; // Par défaut, utiliser l'axe Y principal

        // Si l'annotation a un canal spécifique, utiliser son axe Y
        if (!this.isFreeFloating && appState.channelConfig && appState.channelConfig[this.columnIndex]) {
            const channelConfig = appState.channelConfig[this.columnIndex];
            const yAxisID = channelConfig.yAxisID || 'y';

            // Utiliser l'axe Y du canal si disponible
            if (chart.scales[yAxisID]) {
                yScale = chart.scales[yAxisID];
            }
        }

        return {
            x: xScale.getPixelForValue(this.time * 1000), // conversion s → ms
            y: yScale.getPixelForValue(this.yValue)
        };
    }

    // Vérifie si la souris est sur l'annotation
    isMouseOver(mouseX, mouseY, chart) {
        if (!chart) return false;
        
        const pos = this.getPixelPosition(chart);
        const annotationRect = {
            x: pos.x + this.offsetX,
            y: pos.y + this.offsetY,
            width: this.width,
            height: this.height
        };
        
        return mouseX >= annotationRect.x && 
               mouseX <= annotationRect.x + annotationRect.width &&
               mouseY >= annotationRect.y && 
               mouseY <= annotationRect.y + annotationRect.height;
    }
}

// Initialiser le système d'annotations
function initAnnotationSystem() {
    console.log("🔧 Initialisation du système d'annotations...");
    
    // Récupérer le canvas du graphique temporel
    const timeCanvas = document.getElementById('timeChart');
    if (!timeCanvas) {
        console.error("Canvas timeChart non trouvé");
        return;
    }
    
    // Créer le conteneur pour les annotations
    const annotationContainer = document.createElement('div');
    annotationContainer.id = 'annotation-container';
    annotationContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 50;
        overflow: visible;
    `;
    
    // Ajouter au conteneur du graphique
    const timeContainer = document.getElementById('time-container');
    if (timeContainer) {
        const plotArea = timeContainer.querySelector('div[style*="flex:1"]');
        if (plotArea) {
            plotArea.style.position = 'relative';
            plotArea.appendChild(annotationContainer);
        }
    }
    
    // Événements pour la création d'annotations
    setupAnnotationEvents(timeCanvas);
    
    // Mode annotation dans la barre d'outils
    addAnnotationToToolbar();
    
    console.log("✅ Système d'annotations initialisé");
}

// Ajouter le bouton d'annotation dans la toolbar
function addAnnotationToToolbar() {
    // Cette fonction est désactivée car les boutons sont maintenant dans la sidebar
    // sous la section "Annotations"
    return;

    const toolbar = document.querySelector('.plot-toolbar');
    if (!toolbar) return;

    // Bouton mode annotation
    const annotationBtn = document.createElement('button');
    annotationBtn.className = 'icon-btn';
    annotationBtn.id = 'annotation-btn';
    annotationBtn.innerHTML = '<i class="fas fa-comment-medical"></i>';
    annotationBtn.title = 'Mode Annotation (A)\n• Clic: Créer annotation\n• Drag boîte: Déplacer position\n• CTRL+DRAG marqueur ⭕: Déplacer ancrage sur courbe';
    annotationBtn.style.marginLeft = '5px';

    annotationBtn.onclick = function() {
        toggleAnnotationMode();
    };

    // Bouton toggle visibilité
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'icon-btn';
    toggleBtn.id = 'toggle-annotations-btn';
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    toggleBtn.title = 'Afficher/Masquer toutes les annotations';
    toggleBtn.style.marginLeft = '5px';
    toggleBtn.style.backgroundColor = 'var(--accent-blue)';
    toggleBtn.style.color = 'white';

    toggleBtn.onclick = function() {
        toggleAllAnnotations();
    };

    const controlsDiv = toolbar.querySelector('.toolbar-controls');
    if (controlsDiv) {
        controlsDiv.appendChild(annotationBtn);
        controlsDiv.appendChild(toggleBtn);
    } else {
        toolbar.appendChild(annotationBtn);
        toolbar.appendChild(toggleBtn);
    }
}

// Basculer le mode annotation
function toggleAnnotationMode() {
    const btn = document.getElementById('btn-annotation-mode');

    // Vérifier l'état AVANT de changer
    if (!isCreatingAnnotation) {
        // ACTIVATION : Désactiver les autres outils D'ABORD
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('annotation');
        }

        // Fermer tous les autres accordéons principaux
        if (typeof closeAllMainAccordions === 'function') {
            closeAllMainAccordions('annotation');
        }

        // Ouvrir l'accordéon annotations si fermé
        const content = document.getElementById('annotations-content');
        const icon = document.getElementById('annotations-toggle-icon');
        if (content && content.style.display === 'none') {
            content.style.display = 'block';
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        }

        // Activer l'outil APRÈS avoir désactivé les autres
        isCreatingAnnotation = true;
        if (btn) {
            btn.style.backgroundColor = 'var(--accent-green)';
            btn.style.color = 'white';
        }
        setStatus('Mode annotation activé - Cliquez sur un point du signal');
    } else {
        // DÉSACTIVATION
        isCreatingAnnotation = false;
        if (btn) {
            btn.style.backgroundColor = 'var(--accent-blue)';
            btn.style.color = 'white';
        }
        setStatus('Mode annotation désactivé');
    }
}

// Fonction pour afficher/masquer toutes les annotations
function toggleAllAnnotations() {
    annotationsVisible = !annotationsVisible;

    // Nouveau bouton dans la sidebar
    const btn = document.getElementById('btn-annotations-visibility');
    if (btn) {
        if (annotationsVisible) {
            btn.style.backgroundColor = 'var(--accent-blue)';
            btn.style.color = 'white';
            btn.title = 'Masquer toutes les annotations';
        } else {
            btn.style.backgroundColor = 'var(--input-bg)';
            btn.style.color = 'var(--text-color)';
            btn.title = 'Afficher toutes les annotations';
        }
    }

    updateAnnotationsDisplay();
    setStatus(annotationsVisible ? 'Annotations affichées' : 'Annotations masquées');
}

// Configurer les événements pour les annotations
function setupAnnotationEvents(canvas) {
    // Événements pour le drag du MARQUEUR sur le CANVAS
    let isDraggingMarkerOnCanvas = false;
    let draggedMarkerOnCanvas = null;

    // Clic pour créer une annotation OU un intervalle
    canvas.addEventListener('click', function(e) {
        // Priorité au mode intervalle
        if (typeof isCreatingInterval !== 'undefined' && isCreatingInterval) {
            const chart = appState.charts.time;
            if (chart && typeof handleIntervalClick === 'function') {
                handleIntervalClick(e, chart);
            }
            return;
        }

        // Sinon, mode annotation
        if (!isCreatingAnnotation) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Récupérer les données du point cliqué
        const chart = appState.charts.time;
        if (!chart) return;

        const xScale = chart.scales.x;
        const timeValue = xScale.getValueForPixel(x);

        if (timeValue && timeValue >= 0) {
            const timeInSeconds = timeValue / 1000; // conversion ms → s

            // SNAP sur la courbe du canal actuel
            const channelIndex = appState.currentColumnIndex || 0;
            const yValue = getValueOnCurve(channelIndex, timeInSeconds);

            if (yValue !== null && yValue !== undefined) {
                createAnnotation(timeInSeconds, yValue);
            }
        }
    });
    
    // Double-clic sur le CANVAS pour ÉDITER une annotation
    canvas.addEventListener('dblclick', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Chercher si on clique sur une annotation
        const chart = appState.charts.time;
        const annotation = findAnnotationAtPosition(x, y, chart);
        
        if (annotation) {
            editAnnotation(annotation);
            e.stopPropagation();
        }
    });
    
    // Événements de souris pour le drag & drop du MARQUEUR
    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const chart = appState.charts.time;

        // Vérifier si on clique sur un marqueur
        const markerAnnotation = findMarkerAtPosition(x, y, chart);

        // NOUVELLE LOGIQUE: Si outil annotation déployé, pas besoin de Ctrl
        const toolExpanded = isAnnotationToolExpanded();
        const canDrag = toolExpanded ? true : e.ctrlKey;

        if (markerAnnotation && canDrag) {
            // Drag du marqueur pour déplacer le point d'ancrage
            console.log("🎯 Début du drag du marqueur" + (toolExpanded ? "" : " avec Ctrl"));
            isDraggingMarkerOnCanvas = true;
            draggedMarkerOnCanvas = markerAnnotation;
            canvas.style.cursor = 'grabbing';
            setStatus('Déplacez le point d\'ancrage - Relâchez pour valider');

            // Désactiver pointer-events sur toutes les boîtes pendant le drag
            annotations.forEach(ann => {
                const el = document.getElementById(ann.id);
                if (el) el.style.pointerEvents = 'none';
            });

            e.stopPropagation();
            e.preventDefault();
        } else if (markerAnnotation && !canDrag) {
            setStatus('Ouvrez l\'outil Annotations ou maintenez Ctrl pour déplacer le marqueur');
        }
    });
    
    // Événements de drag du marqueur sur DOCUMENT (pour ne pas perdre le drag)
    document.addEventListener('mousemove', function(e) {
        if (!isDraggingMarkerOnCanvas || !draggedMarkerOnCanvas) return;

        const canvas = document.getElementById('timeChart');
        const chart = appState.charts.time;
        if (!canvas || !chart) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const xScale = chart.scales.x;

        const timeValue = xScale.getValueForPixel(x);

        if (timeValue && timeValue >= 0) {
            const timeMs = timeValue; // déjà en ms

            // SNAP SUR LA COURBE: trouver la valeur Y réelle de la courbe à ce temps
            // Utiliser les données du canal de l'annotation, pas toujours le canal 0
            const dataTime = appState.fullDataTime;
            let dataValues;

            // Pour les annotations libres, utiliser les données du canal 0
            if (draggedMarkerOnCanvas.isFreeFloating) {
                dataValues = appState.fullDataPressure;
            } else {
                // Utiliser les données du bon canal
                const channelIndex = draggedMarkerOnCanvas.columnIndex || 0;
                if (appState.allColumnData && appState.allColumnData[channelIndex + 1]) {
                    // +1 car allColumnData[0] est le temps
                    dataValues = appState.allColumnData[channelIndex + 1];
                } else {
                    dataValues = appState.fullDataPressure;
                }
            }

            // Trouver l'index du point le plus proche
            let closestIndex = 0;
            let minDiff = Math.abs(dataTime[0] - timeMs);

            for (let i = 1; i < dataTime.length; i++) {
                const diff = Math.abs(dataTime[i] - timeMs);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = i;
                }
                if (dataTime[i] > timeMs) break; // Optimisation: arrêter la recherche
            }

            // Prendre la valeur Y de la courbe au point le plus proche
            const snappedYValue = dataValues[closestIndex];
            const snappedTime = dataTime[closestIndex] / 1000; // conversion ms → s

            // Mettre à jour en temps réel avec les valeurs "snapped" sur la courbe
            draggedMarkerOnCanvas.time = snappedTime;
            draggedMarkerOnCanvas.yValue = snappedYValue;

            // Forcer le redessin
            if (chart && chart.update) {
                chart.update('none');
            }
        }
    });

    document.addEventListener('mouseup', function(e) {
        if (isDraggingMarkerOnCanvas && draggedMarkerOnCanvas) {
            // Réactiver pointer-events sur toutes les boîtes
            annotations.forEach(ann => {
                const el = document.getElementById(ann.id);
                if (el) el.style.pointerEvents = 'auto';
            });

            // Sauvegarder la nouvelle position du point d'ancrage
            const canvas = document.getElementById('timeChart');
            if (canvas) canvas.style.cursor = 'default';

            const unit = appState.yAxisLabel || "Bar";
            const annotation = draggedMarkerOnCanvas;

            // Mettre à jour le texte de l'annotation avec les nouvelles coordonnées
            updateAnnotationMarkerPosition(annotation, annotation.time, annotation.yValue);

            setStatus(`Point d'ancrage déplacé: ${annotation.time.toFixed(3)}s, ${annotation.yValue.toFixed(2)} ${unit}`);

            isDraggingMarkerOnCanvas = false;
            draggedMarkerOnCanvas = null;
        }
    });

    // Changement de curseur sur le canvas
    canvas.addEventListener('mousemove', function(e) {
        if (isDraggingMarkerOnCanvas) return; // Ne pas changer le curseur pendant un drag

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const chart = appState.charts.time;

        // Changer le curseur si on survole un marqueur avec Ctrl
        if (e.ctrlKey) {
            const markerAnnotation = findMarkerAtPosition(x, y, chart);
            if (markerAnnotation) {
                canvas.style.cursor = 'grab';
            } else {
                canvas.style.cursor = 'default';
            }
        } else {
            canvas.style.cursor = 'default';
        }
    });
    
    
    // Raccourci clavier pour le mode annotation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'a' || e.key === 'A') {
            toggleAnnotationMode();
        }
        
        // Échap pour annuler
        if (e.key === 'Escape' && (isCreatingAnnotation || isDraggingMarkerOnCanvas)) {
            isCreatingAnnotation = false;
            isDraggingMarkerOnCanvas = false;
            draggedMarkerAnnotation = null;
            const btn = document.getElementById('annotation-btn');
            if (btn) {
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }
            canvas.style.cursor = 'default';
            toggleAnnotationMode();
        }
    });
}

// Nouvelle fonction pour trouver un marqueur à une position
function findMarkerAtPosition(x, y, chart) {
    const markerRadius = 12; // Rayon élargi pour faciliter la sélection (augmenté de 8 à 12)

    for (let i = annotations.length - 1; i >= 0; i--) {
        if (!annotations[i].visible) continue;

        const pos = annotations[i].getPixelPosition(chart);
        if (!pos) continue;

        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));

        if (distance <= markerRadius) {
            console.log("📍 Marqueur trouvé à distance:", distance.toFixed(1), "px");
            return annotations[i];
        }
    }
    return null;
}

// Nouvelle fonction pour mettre à jour la position du marqueur
function updateAnnotationMarkerPosition(annotation, newTime, newYValue) {
    annotation.time = newTime;
    annotation.yValue = newYValue;
    
    // Mettre à jour le texte avec les nouvelles valeurs
    const unit = appState.yAxisLabel || "Bar";
    annotation.text = `${newTime.toFixed(3)}s; ${newYValue.toFixed(2)} ${unit}`;
    
    updateAnnotationsDisplay();
    saveAnnotations();
    setStatus(`Marqueur déplacé: ${newTime.toFixed(3)}s, ${newYValue.toFixed(2)} ${unit}`);
}

// Trouver une annotation à une position donnée
function findAnnotationAtPosition(x, y, chart) {
    for (let i = annotations.length - 1; i >= 0; i--) {
        if (annotations[i].isMouseOver(x, y, chart)) {
            return annotations[i];
        }
    }
    return null;
}

// Variables pour la modale de création d'annotation
let pendingAnnotationData = null;

// Créer une nouvelle annotation
function createAnnotation(time, yValue, isFreeFloating = false) {
    const id = 'ann-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Récupérer l'unité du canal actuel
    const channelIndex = appState.currentColumnIndex || 0;
    const unit = getChannelUnitByIndex(channelIndex);

    // Texte par défaut: temps + valeur Y + unité (SANS nom du canal)
    const defaultText = `${time.toFixed(3)}s | ${yValue.toFixed(2)} ${unit}`;

    // Stocker les données pour la modale
    pendingAnnotationData = {
        id: id,
        time: time,
        yValue: yValue,
        isFreeFloating: isFreeFloating,
        channelIndex: channelIndex,
        unit: unit
    };

    // Ouvrir la modale de saisie
    openAnnotationInputModal(defaultText, time, yValue, unit);
}

// Peupler le sélecteur de canal
function populateChannelSelector(selectedChannelIndex) {
    const selector = document.getElementById('annotation-channel-select');
    if (!selector) return;

    selector.innerHTML = '';

    // Option "Annotation libre"
    const freeOption = document.createElement('option');
    freeOption.value = '-1';
    freeOption.textContent = 'Annotation libre (aucun canal)';
    selector.appendChild(freeOption);

    // Ajouter tous les canaux disponibles
    if (appState.channelConfig && appState.channelConfig.length > 0) {
        appState.channelConfig.forEach((config, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = config.label || `Canal ${index + 1}`;
            if (index === selectedChannelIndex) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
    }

    // Sélectionner "libre" si c'est le cas
    if (selectedChannelIndex === -1 || pendingAnnotationData?.isFreeFloating) {
        selector.value = '-1';
    }
}

// Rendre la modale déplaçable (drag and drop)
function setupModalDrag() {
    const modalContent = document.getElementById('annotation-modal-content');
    const header = document.getElementById('annotation-modal-header');

    if (!modalContent || !header) return;

    // Vérifier si déjà initialisé
    if (header.dataset.dragInitialized === 'true') return;

    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;

    header.addEventListener('mousedown', function(e) {
        // Ne pas démarrer le drag si on clique sur un bouton
        if (e.target.tagName === 'BUTTON') return;

        isDragging = true;

        // Position initiale de la souris
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;

        header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        e.preventDefault();

        // Calculer le nouveau décalage
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Appliquer le transform
        modalContent.style.transform = `translate(${currentX}px, ${currentY}px)`;
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            header.style.cursor = 'move';
        }
    });

    header.dataset.dragInitialized = 'true';
}

// Ouvrir la modale de saisie d'annotation
function openAnnotationInputModal(defaultText, time, yValue, unit) {
    const modal = document.getElementById('annotation-input-modal');
    const textarea = document.getElementById('annotation-text-input');
    const infoTime = document.getElementById('ann-info-time');
    const infoValue = document.getElementById('ann-info-value');
    const title = document.getElementById('annotation-modal-title');
    const colorPicker = document.getElementById('annotation-color-picker');
    const markerRadiusInput = document.getElementById('annotation-marker-radius');
    const backgroundStyleSelect = document.getElementById('annotation-background-style');
    const channelSelect = document.getElementById('annotation-channel-select');

    if (!modal || !textarea) return;

    // Réinitialiser le formatage
    resetAnnotationFormat();

    // Remplir les champs
    textarea.value = defaultText;
    infoTime.textContent = `${time.toFixed(3)} s`;
    infoValue.textContent = `${yValue.toFixed(2)} ${unit}`;
    title.textContent = pendingAnnotationData.isFreeFloating ? 'Annotation libre' : 'Nouvelle annotation';

    // Peupler le sélecteur de canal
    const channelIndex = pendingAnnotationData?.isFreeFloating ? -1 : (pendingAnnotationData?.channelIndex || 0);
    populateChannelSelector(channelIndex);

    // Couleur aléatoire pour nouvelle annotation
    if (!pendingAnnotationData?.editing) {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        if (colorPicker) colorPicker.value = randomColor;
    }

    // Diamètre du marqueur par défaut
    if (markerRadiusInput) {
        markerRadiusInput.value = pendingAnnotationData?.annotation?.markerRadius || 6;
    }

    // Style d'arrière-plan par défaut
    if (backgroundStyleSelect) {
        backgroundStyleSelect.value = pendingAnnotationData?.annotation?.backgroundStyle || 'blur';
    }

    // Afficher la modale
    modal.style.display = 'flex';

    // Ajouter l'écouteur de changement de canal pour rafraîchir la position en temps réel
    if (channelSelect && !channelSelect.dataset.listenerAdded) {
        channelSelect.addEventListener('change', function() {
            const selectedChannel = parseInt(this.value);
            const isFreeFloating = selectedChannel === -1;
            const newChannelIndex = isFreeFloating ? (pendingAnnotationData?.channelIndex || 0) : selectedChannel;

            // Si ce n'est pas une annotation libre et qu'on a un temps défini
            if (!isFreeFloating && pendingAnnotationData?.time !== undefined) {
                // Recalculer le yValue pour le nouveau canal
                const newYValue = getValueOnCurve(newChannelIndex, pendingAnnotationData.time);

                if (newYValue !== null && newYValue !== undefined) {
                    // Mettre à jour l'affichage dans la modale
                    const unit = appState.channelConfig?.[newChannelIndex]?.unit || '';
                    infoValue.textContent = `${newYValue.toFixed(2)} ${unit}`;

                    // Mettre à jour pendingAnnotationData
                    pendingAnnotationData.yValue = newYValue;
                    pendingAnnotationData.channelIndex = newChannelIndex;

                    // Si on édite une annotation existante, mettre à jour visuellement
                    if (pendingAnnotationData.editing && pendingAnnotationData.annotation) {
                        pendingAnnotationData.annotation.yValue = newYValue;
                        pendingAnnotationData.annotation.columnIndex = newChannelIndex;
                        pendingAnnotationData.annotation.isFreeFloating = isFreeFloating;

                        // Rafraîchir l'affichage des annotations (boîtes de texte)
                        updateAnnotationsDisplay();

                        // Forcer le redessin du chart pour mettre à jour les marqueurs sur le canvas
                        const chart = appState.charts?.time;
                        if (chart && chart.update) {
                            chart.update('none'); // 'none' = pas d'animation pour mise à jour instantanée
                        }
                    }

                    console.log(`🔄 Canal changé vers ${newChannelIndex}: nouvelle position Y = ${newYValue.toFixed(2)}`);
                }
            }
        });
        channelSelect.dataset.listenerAdded = 'true';
    }

    // Initialiser le système de drag pour rendre la modale déplaçable
    setupModalDrag();

    // Focus sur le textarea
    setTimeout(() => {
        textarea.focus();
        textarea.select();
    }, 100);
}

// Fermer la modale de saisie
function closeAnnotationInputModal() {
    const modal = document.getElementById('annotation-input-modal');
    const modalContent = document.getElementById('annotation-modal-content');

    if (modal) {
        modal.style.display = 'none';
    }

    // Réinitialiser la position de la modale pour la prochaine ouverture
    if (modalContent) {
        modalContent.style.transform = 'translate(0px, 0px)';
    }

    pendingAnnotationData = null;
}

// Confirmer la création ou l'édition de l'annotation
function confirmAnnotationInput() {
    const textarea = document.getElementById('annotation-text-input');
    const channelSelect = document.getElementById('annotation-channel-select');
    const colorPicker = document.getElementById('annotation-color-picker');
    const markerRadiusInput = document.getElementById('annotation-marker-radius');
    const backgroundStyleSelect = document.getElementById('annotation-background-style');

    if (!textarea || !pendingAnnotationData) return;

    const text = textarea.value.trim();
    if (text === '') {
        alert('Le texte de l\'annotation ne peut pas être vide');
        return;
    }

    // Récupérer le canal sélectionné
    const selectedChannel = parseInt(channelSelect.value);
    const isFreeFloating = selectedChannel === -1;
    const channelIndex = isFreeFloating ? (pendingAnnotationData.channelIndex || 0) : selectedChannel;

    // Récupérer la couleur
    const color = colorPicker ? colorPicker.value : '#FFD700';

    // Récupérer le diamètre du marqueur
    const markerRadius = markerRadiusInput ? parseInt(markerRadiusInput.value) : 6;

    // Récupérer le style d'arrière-plan
    const backgroundStyle = backgroundStyleSelect ? backgroundStyleSelect.value : 'blur';

    // Recalculer le yValue si le canal a changé (pour snapper sur la nouvelle courbe)
    let finalYValue = pendingAnnotationData.yValue;
    let finalTime = pendingAnnotationData.time;

    // Si le canal a changé et ce n'est pas une annotation libre, recalculer le yValue
    if (!isFreeFloating && pendingAnnotationData.channelIndex !== channelIndex && finalTime !== undefined) {
        const newYValue = getValueOnCurve(channelIndex, finalTime);
        if (newYValue !== null && newYValue !== undefined) {
            finalYValue = newYValue;
            console.log(`📌 Canal changé: recalcul yValue pour canal ${channelIndex} au temps ${finalTime}s: ${finalYValue}`);
        }
    }

    // Sauvegarder l'état pour l'historique
    if (typeof saveState === 'function') {
        saveState(pendingAnnotationData.editing ? 'Modification annotation' : 'Création annotation');
    }

    // Si c'est une édition
    if (pendingAnnotationData.editing && pendingAnnotationData.annotation) {
        pendingAnnotationData.annotation.text = text;
        pendingAnnotationData.annotation.columnIndex = channelIndex;
        pendingAnnotationData.annotation.isFreeFloating = isFreeFloating;
        pendingAnnotationData.annotation.color = color;
        pendingAnnotationData.annotation.markerRadius = markerRadius;
        pendingAnnotationData.annotation.backgroundStyle = backgroundStyle;

        // Mettre à jour le yValue si le canal a changé
        if (finalYValue !== undefined && finalYValue !== pendingAnnotationData.annotation.yValue) {
            pendingAnnotationData.annotation.yValue = finalYValue;
        }

        // Appliquer le formatage
        pendingAnnotationData.annotation.fontSize = currentAnnotationFormat.fontSize;
        pendingAnnotationData.annotation.fontWeight = currentAnnotationFormat.bold ? 'bold' : 'normal';
        pendingAnnotationData.annotation.fontStyle = currentAnnotationFormat.italic ? 'italic' : 'normal';
        pendingAnnotationData.annotation.textDecoration = currentAnnotationFormat.underline ? 'underline' : 'none';

        // Réinitialiser le formatage
        resetAnnotationFormat();

        // Fermer la modale
        closeAnnotationInputModal();

        // Afficher et sauvegarder
        updateAnnotationsDisplay();
        saveAnnotations();
        setStatus('Annotation modifiée');
        return;
    }

    // Sinon, c'est une création
    const annotation = new Annotation(
        pendingAnnotationData.id,
        finalTime,
        finalYValue,
        text,
        color,
        isFreeFloating
    );
    annotation.columnIndex = channelIndex;
    annotation.markerRadius = markerRadius;
    annotation.backgroundStyle = backgroundStyle;

    // Appliquer le formatage
    annotation.fontSize = currentAnnotationFormat.fontSize;
    annotation.fontWeight = currentAnnotationFormat.bold ? 'bold' : 'normal';
    annotation.fontStyle = currentAnnotationFormat.italic ? 'italic' : 'normal';
    annotation.textDecoration = currentAnnotationFormat.underline ? 'underline' : 'none';

    annotations.push(annotation);

    // Réinitialiser le formatage
    resetAnnotationFormat();

    // Fermer la modale
    closeAnnotationInputModal();

    // Désactiver le mode création
    isCreatingAnnotation = false;
    const btn = document.getElementById('btn-annotation-mode');
    if (btn) {
        btn.style.backgroundColor = 'var(--accent-blue)';
        btn.style.color = 'white';
    }

    // Afficher l'annotation
    updateAnnotationsDisplay();

    // Sauvegarder dans le projet
    saveAnnotations();

    const unit = getChannelUnitByIndex(channelIndex);
    const statusMsg = isFreeFloating
        ? `Annotation libre créée`
        : `Annotation ajoutée à ${(finalTime || 0).toFixed(3)}s (${(finalYValue || 0).toFixed(2)} ${unit})`;
    setStatus(statusMsg);

    return annotation;
}

// Fonction pour modifier une annotation existante
function editAnnotation(annotation) {
    if (!annotation) return;

    // Utiliser la modale pour l'édition
    const modal = document.getElementById('annotation-input-modal');
    const textarea = document.getElementById('annotation-text-input');
    const infoTime = document.getElementById('ann-info-time');
    const infoValue = document.getElementById('ann-info-value');
    const title = document.getElementById('annotation-modal-title');
    const colorPicker = document.getElementById('annotation-color-picker');

    if (!modal || !textarea) return;

    // Remplir les champs
    textarea.value = annotation.text;
    title.textContent = 'Modifier l\'annotation';

    const unit = getChannelUnitByIndex(annotation.columnIndex);
    infoTime.textContent = annotation.isFreeFloating ? 'Annotation libre' : `${annotation.time.toFixed(3)} s`;
    infoValue.textContent = annotation.isFreeFloating ? '--' : `${annotation.yValue.toFixed(2)} ${unit}`;

    // Charger le formatage de l'annotation
    loadAnnotationFormat(annotation);

    // Peupler le sélecteur de canal avec le canal actuel
    const channelIndex = annotation.isFreeFloating ? -1 : annotation.columnIndex;
    populateChannelSelector(channelIndex);

    // Définir la couleur actuelle
    if (colorPicker) {
        colorPicker.value = annotation.color;
    }

    // Stocker l'annotation en cours d'édition
    pendingAnnotationData = {
        editing: true,
        annotation: annotation,
        channelIndex: annotation.columnIndex,
        isFreeFloating: annotation.isFreeFloating
    };

    // Afficher la modale
    modal.style.display = 'flex';

    // Focus sur le textarea
    setTimeout(() => {
        textarea.focus();
        textarea.select();
    }, 100);
}


// Mettre à jour l'affichage de toutes les annotations
function updateAnnotationsDisplay() {
    const container = document.getElementById('annotation-container');
    if (!container) return;

    // Supprimer toutes les annotations existantes
    container.innerHTML = '';

    const chart = appState.charts.time;
    if (!chart) return;

    // Filtrer les annotations selon le canal actuel
    const currentColumnIndex = appState.currentColumnIndex || 0;

    // Créer les éléments d'annotation
    annotations.forEach(annotation => {
        // Vérifier si l'annotation correspond au canal actuel
        const belongsToCurrentChannel = annotation.columnIndex === currentColumnIndex;
        
        // Masquer si canal différent OU si visibilité globale désactivée
        if (!belongsToCurrentChannel || !annotationsVisible) {
            annotation.visible = false;
            return;
        }
        
        annotation.visible = true;
        createAnnotationElement(annotation, chart, container);
    });
    
    // Dessiner les lignes de connexion
    drawAnnotationConnectors(chart);
}

// Créer un élément HTML pour une annotation
function createAnnotationElement(annotation, chart, container) {
    const pos = annotation.getPixelPosition(chart);
    if (!pos) return;
    
    // Créer l'élément annotation
    const annElement = document.createElement('div');
    annElement.className = 'annotation';
    annElement.id = annotation.id;
    annElement.dataset.annotationId = annotation.id;
    annElement.title = "Double-cliquez pour éditer"; // Infobulle

    // Déterminer le style d'arrière-plan
    const bgStyle = annotation.backgroundStyle === 'transparent'
        ? 'background-color: transparent;'
        : `background-color: ${annotation.color}20; backdrop-filter: blur(5px);`;

    // Position et style (utiliser flexbox pour minimiser l'espace)
    annElement.style.cssText = `
        position: absolute;
        left: ${pos.x + annotation.offsetX}px;
        top: ${pos.y + annotation.offsetY}px;
        width: ${annotation.width}px;
        min-height: ${annotation.height}px;
        max-height: 300px;
        ${bgStyle}
        border: 2px solid ${annotation.color};
        border-radius: 8px;
        padding: 6px 8px;
        pointer-events: auto;
        cursor: move;
        z-index: ${annotation.zIndex};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    `;

    // Événement Double-Clic pour Éditer DIRECTEMENT sur l'élément DOM
    annElement.addEventListener('dblclick', function(e) {
        e.stopPropagation(); // Empêcher la propagation au canvas
        editAnnotation(annotation);
    });
    
    // Obtenir le nom du canal pour l'en-tête
    const channelName = annotation.isFreeFloating
        ? ''
        : getChannelNameByIndex(annotation.columnIndex);

    // Contenu de l'annotation
    annElement.innerHTML = `
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
            padding-bottom: 3px;
            border-bottom: 1px solid ${annotation.color}60;
        ">
            <div style="
                font-size: 0.7em;
                font-weight: bold;
                color: ${annotation.color};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 140px;
            " title="${channelName}">
                <i class="fas fa-${annotation.isFreeFloating ? 'comment' : 'sticky-note'}"></i> ${channelName}
            </div>
            <button class="annotation-close"
                    title="Supprimer"
                    style="
                        background: none;
                        border: none;
                        color: ${annotation.color};
                        cursor: pointer;
                        font-size: 0.9em;
                        padding: 0px 3px;
                    ">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="annotation-text-content" style="
            font-size: ${annotation.fontSize}em;
            font-weight: ${annotation.fontWeight || 'normal'};
            font-style: ${annotation.fontStyle || 'normal'};
            text-decoration: ${annotation.textDecoration || 'none'};
            color: var(--text-main);
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            word-wrap: break-word;
            cursor: text;
            padding: 2px 0;
            line-height: 1.3;
        ">
            ${annotation.text.replace(/\n/g, '<br>')}
        </div>
        <div style="
            font-size: 0.6em;
            color: var(--text-muted);
            margin-top: 2px;
            text-align: right;
        ">
            ${annotation.isFreeFloating ? '' : (annotation.time).toFixed(3) + 's'}
        </div>
    `;

    // Attacher l'événement de suppression au bouton X spécifiquement
    const closeBtn = annElement.querySelector('.annotation-close');
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Empêcher le drag ou l'edit
        deleteAnnotation(annotation.id);
    });

    // Événement double clic sur le texte pour éditer (redondance de sécurité)
    const textContent = annElement.querySelector('div[style*="overflow-y: auto"]');
    textContent.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        editAnnotation(annotation);
    });

    // Drag & drop de la boîte d'annotation (pour changer sa position relative)
    setupAnnotationDrag(annElement, annotation, chart);

    // Événements pour le redimensionnement
    setupAnnotationResize(annElement, annotation);

    // Ajouter au conteneur
    container.appendChild(annElement);
}

// Configurer le drag & drop d'une annotation (position relative)
function setupAnnotationDrag(element, annotation, chart) {
    let isDragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startOffsetX = 0;
    let startOffsetY = 0;
    let rafId = null;

    element.addEventListener('mousedown', function(e) {
        // Ne pas drag si on clique sur le bouton fermer ou le resize handle
        if (e.target.closest('.annotation-close') || e.target.closest('[style*="nwse-resize"]')) {
            return;
        }

        // Ne pas drag en mode édition (double-clic)
        if (e.detail === 2) return; // double-clic

        isDragging = true;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        startOffsetX = annotation.offsetX;
        startOffsetY = annotation.offsetY;

        element.style.cursor = 'grabbing';
        element.style.zIndex = '2000';
        setStatus('Déplacez l\'annotation - Relâchez pour valider');

        e.stopPropagation();
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;

        annotation.offsetX = startOffsetX + dx;
        annotation.offsetY = startOffsetY + dy;

        // Optimisation: utiliser requestAnimationFrame pour throttle les mises à jour
        if (rafId) {
            cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
            // Mettre à jour la position de l'élément directement sans recalculer
            const pos = annotation.getPixelPosition(chart);
            if (pos) {
                element.style.left = (pos.x + annotation.offsetX) + 'px';
                element.style.top = (pos.y + annotation.offsetY) + 'px';
            }

            // Ne redessiner le chart que toutes les quelques frames pour éviter la latence
            if (chart && chart.update) {
                chart.update('none');
            }
        });
    });

    document.addEventListener('mouseup', function(e) {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'move';
            element.style.zIndex = annotation.zIndex.toString();

            // Annuler le dernier RAF si en cours
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            // Forcer une dernière mise à jour du chart
            if (chart && chart.update) {
                chart.update('none');
            }

            // Sauvegarder
            saveAnnotations();
            setStatus(`Annotation repositionnée (offset: ${annotation.offsetX.toFixed(0)}px, ${annotation.offsetY.toFixed(0)}px)`);
        }
    });
}

// Configurer le redimensionnement des annotations
function setupAnnotationResize(element, annotation) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    const handleSize = 10;
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: ${handleSize}px;
        height: ${handleSize}px;
        background-color: ${annotation.color};
        cursor: nwse-resize;
        border-radius: 2px;
        z-index: 10;
    `;

    element.appendChild(resizeHandle);

    resizeHandle.addEventListener('mousedown', function(e) {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = element.offsetWidth;
        startHeight = element.offsetHeight;
        e.stopPropagation();
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        annotation.width = Math.max(150, startWidth + dx);
        annotation.height = Math.max(5, startHeight + dy); // RÉDUIT de 50 à 20, puis à 5

        element.style.width = annotation.width + 'px';
        element.style.minHeight = annotation.height + 'px';

        // Forcer le redessin des connecteurs sans tout recréer (optimisation)
        const chart = appState.charts.time;
        if (chart && chart.update) {
            chart.update('none');
        }
    });

    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            saveAnnotations();
        }
    });
}

// Dessiner les lignes de connexion entre les annotations et les points
function drawAnnotationConnectors(chart) {
    const canvas = document.getElementById('timeChart');
    if (!canvas || !chart.ctx) return;

    const ctx = chart.ctx;

    // Sauvegarder le contexte
    ctx.save();

    // IMPORTANT: Recalculer les positions en pixels à chaque rendu
    // car elles changent lors du zoom/pan
    annotations.forEach(annotation => {
        // Ne dessiner que si l'annotation est visible
        if (!annotation.visible) return;

        // Ne pas dessiner de ligne pour les annotations libres
        if (annotation.isFreeFloating) return;

        // Recalculer la position du point en pixels (valeurs dynamiques)
        const pos = annotation.getPixelPosition(chart);
        if (!pos) return;

        const markerX = pos.x;
        const markerY = pos.y;

        // Position et dimensions de la boîte d'annotation
        // Utiliser getBoundingClientRect() pour obtenir les dimensions RÉELLES de la boîte
        const element = document.getElementById(annotation.id);
        let boxWidth = annotation.width;
        let boxHeight = annotation.height;

        if (element) {
            const rect = element.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            boxWidth = rect.width;
            boxHeight = rect.height;
        }

        const boxX = pos.x + annotation.offsetX;
        const boxY = pos.y + annotation.offsetY;

        // Calculer le centre de la boîte
        const centerX = boxX + boxWidth / 2;
        const centerY = boxY + boxHeight / 2;

        // Calculer le point de connexion sur le BORD de la boîte
        // en trouvant l'intersection entre la ligne (marqueur→centre) et le rectangle
        let endX, endY;

        // Direction du marqueur vers le centre
        const dx = centerX - markerX;
        const dy = centerY - markerY;

        // Normaliser la direction
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) {
            endX = centerX;
            endY = centerY;
        } else {
            const dirX = dx / length;
            const dirY = dy / length;

            // Calculer les intersections possibles avec les 4 bords
            const intersections = [];

            // Bord gauche (x = boxX)
            if (dirX !== 0) {
                const t = (boxX - markerX) / dirX;
                const y = markerY + t * dirY;
                if (t > 0 && y >= boxY && y <= boxY + boxHeight) {
                    intersections.push({ x: boxX, y: y, dist: t });
                }
            }

            // Bord droit (x = boxX + boxWidth)
            if (dirX !== 0) {
                const t = (boxX + boxWidth - markerX) / dirX;
                const y = markerY + t * dirY;
                if (t > 0 && y >= boxY && y <= boxY + boxHeight) {
                    intersections.push({ x: boxX + boxWidth, y: y, dist: t });
                }
            }

            // Bord haut (y = boxY)
            if (dirY !== 0) {
                const t = (boxY - markerY) / dirY;
                const x = markerX + t * dirX;
                if (t > 0 && x >= boxX && x <= boxX + boxWidth) {
                    intersections.push({ x: x, y: boxY, dist: t });
                }
            }

            // Bord bas (y = boxY + boxHeight)
            if (dirY !== 0) {
                const t = (boxY + boxHeight - markerY) / dirY;
                const x = markerX + t * dirX;
                if (t > 0 && x >= boxX && x <= boxX + boxWidth) {
                    intersections.push({ x: x, y: boxY + boxHeight, dist: t });
                }
            }

            // Prendre l'intersection la plus proche
            if (intersections.length > 0) {
                intersections.sort((a, b) => a.dist - b.dist);
                endX = intersections[0].x;
                endY = intersections[0].y;
            } else {
                // Fallback: utiliser le centre
                endX = centerX;
                endY = centerY;
            }
        }

        // Dessiner la ligne pointillée
        ctx.beginPath();
        ctx.moveTo(markerX, markerY);

        // Ligne avec une légère courbure
        const cp1x = markerX + (endX - markerX) * 0.5;
        const cp1y = markerY;
        const cp2x = markerX + (endX - markerX) * 0.5;
        const cp2y = endY;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);

        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.globalAlpha = 1; // Toujours visible
        ctx.stroke();

        // Point d'ancrage (marqueur) - taille personnalisable
        ctx.setLineDash([]);
        ctx.beginPath();
        const radius = annotation.markerRadius || 6;
        ctx.arc(markerX, markerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = annotation.color;
        ctx.globalAlpha = 1; // Toujours visible
        ctx.fill();

        // Bordure blanche pour meilleure visibilité
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Restaurer le contexte
    ctx.restore();
}

// Mettre à jour les positions des boîtes d'annotation (appelé à chaque rendu du graphique)
function updateAnnotationPositions(chart) {
    if (!chart) return;

    annotations.forEach(annotation => {
        if (!annotation.visible) return;

        const element = document.getElementById(annotation.id);
        if (!element) return;

        // Recalculer la position du point d'ancrage
        const pos = annotation.getPixelPosition(chart);
        if (!pos) return;

        // Mettre à jour la position de l'élément HTML
        element.style.left = (pos.x + annotation.offsetX) + 'px';
        element.style.top = (pos.y + annotation.offsetY) + 'px';
    });
}

// Mettre à jour le style d'une annotation (survol)
function updateAnnotationStyle(annotation, isHovered) {
    const element = document.getElementById(annotation.id);
    if (!element) return;
    
    if (isHovered) {
        element.style.transform = 'scale(1.05)';
        element.style.boxShadow = `0 6px 20px rgba(0,0,0,0.4), 0 0 15px ${annotation.color}80`;
        element.style.zIndex = '2000';
    } else {
        element.style.transform = 'scale(1)';
        element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        element.style.zIndex = annotation.zIndex.toString();
    }
}

// Supprimer une annotation
function deleteAnnotation(id) {
    if (!confirm('Supprimer cette annotation ?')) return;

    // Sauvegarder l'état pour l'historique
    if (typeof saveState === 'function') {
        saveState('Suppression annotation');
    }

    annotations = annotations.filter(ann => ann.id !== id);
    updateAnnotationsDisplay();
    saveAnnotations();
    setStatus('Annotation supprimée');
}

// Sauvegarder les annotations dans le projet
function saveAnnotations() {
    if (!appState) return;

    console.log("💾 Saving", annotations.length, "annotations to appState");

    // Sauvegarder dans l'état de l'application
    appState.annotations = annotations.map(ann => ({
        id: ann.id,
        time: ann.time,
        yValue: ann.yValue,
        text: ann.text,
        color: ann.color,
        width: ann.width,
        height: ann.height,
        offsetX: ann.offsetX,
        offsetY: ann.offsetY,
        pinned: ann.pinned,
        columnIndex: ann.columnIndex,
        isFreeFloating: ann.isFreeFloating || false,
        markerRadius: ann.markerRadius || 6,
        backgroundStyle: ann.backgroundStyle || 'blur',
        fontSize: ann.fontSize || 0.85,
        fontWeight: ann.fontWeight || 'normal',
        fontStyle: ann.fontStyle || 'normal',
        textDecoration: ann.textDecoration || 'none'
    }));

    console.log("✅ Annotations saved to appState:", appState.annotations.length);

    // NOTE: Ne pas mettre à jour les notes utilisateur automatiquement
    // Les annotations sont déjà visibles dans les fenêtres flottantes
    // updateUserNotesWithAnnotations();
}

// Charger les annotations sauvegardées
function loadAnnotations(savedAnnotations) {
    if (!savedAnnotations || !Array.isArray(savedAnnotations)) {
        console.log("⚠️ No annotations to load");
        return;
    }

    console.log("📥 Loading", savedAnnotations.length, "annotations");

    annotations = savedAnnotations.map(data => {
        const ann = new Annotation(data.id, data.time, data.yValue, data.text, data.color);
        ann.width = data.width || 200;
        ann.height = data.height || 100;
        ann.offsetX = data.offsetX || 20;
        ann.offsetY = data.offsetY || -50;
        ann.pinned = data.pinned || false;
        ann.columnIndex = data.columnIndex !== undefined ? data.columnIndex : 0;
        ann.visible = true;
        ann.isFreeFloating = data.isFreeFloating || false;
        ann.markerRadius = data.markerRadius || 6;
        ann.backgroundStyle = data.backgroundStyle || 'blur';
        ann.fontSize = data.fontSize || 0.85;
        ann.fontWeight = data.fontWeight || 'normal';
        ann.fontStyle = data.fontStyle || 'normal';
        ann.textDecoration = data.textDecoration || 'none';
        return ann;
    });

    console.log("✅ Loaded", annotations.length, "annotations successfully");
    updateAnnotationsDisplay();
}

// Mettre à jour les notes utilisateur avec le résumé des annotations
function updateUserNotesWithAnnotations() {
    const notesTextarea = document.getElementById('user-notes');
    if (!notesTextarea) return;
    
    let notes = notesTextarea.value;
    
    // Rechercher et mettre à jour la section annotations
    const annotationHeader = '=== ANNOTATIONS ===';
    const startIndex = notes.indexOf(annotationHeader);
    
    if (startIndex !== -1) {
        // Supprimer l'ancienne section
        const endIndex = notes.indexOf('===', startIndex + annotationHeader.length);
        if (endIndex !== -1) {
            notes = notes.substring(0, startIndex) + notes.substring(endIndex + 3);
        }
    }
    
    // Ajouter la nouvelle section si il y a des annotations
    if (annotations.length > 0) {
        let annotationSection = `\n\n${annotationHeader}\n`;
        annotations.forEach((ann, index) => {
            annotationSection += `${index + 1}. ${ann.time.toFixed(3)}s: ${ann.text}\n`;
        });
        annotationSection += '===';
        
        notes += annotationSection;
        notesTextarea.value = notes;
    }
}

// Exporter les annotations
function exportAnnotations() {
    if (annotations.length === 0) {
        alert('Aucune annotation à exporter');
        return;
    }
    
    let content = "Annotation Export - " + new Date().toLocaleString() + "\n\n";
    content += "Temps (s)\tValeur\tTexte\n";
    
    annotations.forEach(ann => {
        content += `${ann.time.toFixed(3)}\t${ann.yValue.toFixed(4)}\t"${ann.text}"\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setStatus('Annotations exportées');
}

// Importer des annotations
function importAnnotations() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const content = event.target.result;
                
                // Essayer de parser comme JSON d'abord
                try {
                    const data = JSON.parse(content);
                    if (Array.isArray(data)) {
                        loadAnnotations(data);
                        setStatus(`Annotations importées: ${data.length} trouvées`);
                        return;
                    }
                } catch (jsonError) {
                    // Ce n'est pas du JSON, essayer comme texte tabulé
                    console.log("Fichier texte détecté, tentative d'import...");
                }
                
                // Format texte tabulé
                const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
                const importedAnnotations = [];
                
                lines.forEach((line, index) => {
                    if (index === 0 && line.includes('Temps')) return; // Ignorer l'en-tête
                    
                    const parts = line.split('\t');
                    if (parts.length >= 3) {
                        const time = parseFloat(parts[0]);
                        const yValue = parseFloat(parts[1]);
                        const text = parts[2].replace(/"/g, '');
                        
                        if (!isNaN(time) && !isNaN(yValue)) {
                            importedAnnotations.push({
                                id: 'imported-' + Date.now() + '-' + index,
                                time: time,
                                yValue: yValue,
                                text: text,
                                color: '#FFD700'
                            });
                        }
                    }
                });
                
                if (importedAnnotations.length > 0) {
                    annotations = annotations.concat(importedAnnotations.map(data => {
                        return new Annotation(data.id, data.time, data.yValue, data.text, data.color);
                    }));
                    updateAnnotationsDisplay();
                    saveAnnotations();
                    setStatus(`Annotations importées: ${importedAnnotations.length} ajoutées`);
                } else {
                    alert('Aucune annotation valide trouvée dans le fichier');
                }
                
            } catch (error) {
                console.error('Erreur d\'import:', error);
                alert('Erreur lors de l\'import des annotations');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Initialiser lors du chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initAnnotationSystem, 1000); // Attendre que l'application soit chargée

    // Ajouter les fonctions d'export/import au menu Outils
    addAnnotationToolsToMenu();
});

// Fonction pour effacer toutes les annotations (utilisée lors du chargement de nouveaux fichiers)
function clearAnnotations() {
    console.log("🗑️ Clearing", annotations.length, "annotations");
    annotations = [];
    appState.annotations = []; // Également vider appState
    updateAnnotationsDisplay();
    const chart = appState.charts.time;
    if (chart && chart.update) {
        chart.update('none');
    }
    console.log("✅ Annotations cleared");
}

// Ajouter les outils d'annotation au menu
function addAnnotationToolsToMenu() {
    setTimeout(() => {
        const toolsMenu = document.querySelector('.dropdown-content');
        if (!toolsMenu) return;
        
        const separator = document.createElement('div');
        separator.style.cssText = 'border-top:1px solid var(--border-color); margin:5px 0;';
        
        const exportBtn = document.createElement('button');
        exportBtn.innerHTML = '<i class="fas fa-file-export" style="width:20px;"></i> Exporter Annotations';
        exportBtn.onclick = exportAnnotations;
        
        const importBtn = document.createElement('button');
        importBtn.innerHTML = '<i class="fas fa-file-import" style="width:20px;"></i> Importer Annotations';
        importBtn.onclick = importAnnotations;
        
        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = '<i class="fas fa-trash" style="width:20px;"></i> Effacer Annotations';
        clearBtn.onclick = function() {
            if (confirm('Effacer toutes les annotations ?')) {
                clearAnnotations();
                saveAnnotations();
                setStatus('Annotations effacées');
            }
        };
        
        toolsMenu.appendChild(separator);
        toolsMenu.appendChild(exportBtn);
        toolsMenu.appendChild(importBtn);
        toolsMenu.appendChild(clearBtn);
    }, 2000);
}
