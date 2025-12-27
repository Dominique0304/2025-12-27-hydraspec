// =====================================
// RÉORGANISATION DES SECTIONS - VERSION SIMPLIFIÉE
// =====================================

let isDragging = false;
let draggedElement = null;
let placeholder = null;

// Initialiser le système
function initSectionReorder() {
    console.log("🔄 Initialisation réorganisation des sections");

    // Attendre que le DOM soit prêt
    setTimeout(() => {
        const sections = getSections();
        console.log("📋 Sections trouvées:", sections.length);

        if (sections.length === 0) {
            console.error("❌ Aucune section trouvée");
            return;
        }

        // Ajouter les icônes et les event listeners
        sections.forEach(section => {
            addGripIcon(section);
            makeDraggable(section);
        });

        // Vérifier si un ordre est sauvegardé
        const savedOrder = localStorage.getItem('hydraspec-section-order');
        const correctOrder = ['canal', 'outils', 'annotations', 'dplacement--zoom', 'spectrogramme-stft', 'paramtres-fft'];

        if (!savedOrder) {
            // Définir l'ordre par défaut souhaité
            setDefaultOrder();
        } else {
            // Vérifier si l'ordre sauvegardé correspond à l'ordre correct
            const parsedOrder = JSON.parse(savedOrder);
            const isCorrectOrder = JSON.stringify(parsedOrder) === JSON.stringify(correctOrder);

            if (!isCorrectOrder) {
                console.log("⚠️ Ordre sauvegardé incorrect, application de l'ordre par défaut");
                setDefaultOrder();
            } else {
                // Restaurer l'ordre sauvegardé
                restoreOrder();
            }
        }

        console.log("✅ Système de réorganisation initialisé");
    }, 500);
}

// Obtenir toutes les sections à réorganiser
function getSections() {
    const acquisitionGroup = document.querySelector('.sidebar .control-group');
    if (!acquisitionGroup) return [];

    const sections = acquisitionGroup.querySelectorAll(':scope > .control-group');
    return Array.from(sections);
}

// Ajouter l'icône de grip au début du h3
function addGripIcon(section) {
    const h3 = section.querySelector('h3');
    if (!h3) return;

    // Vérifier si l'icône existe déjà
    if (h3.querySelector('.grip-icon')) return;

    const grip = document.createElement('i');
    grip.className = 'fas fa-grip-vertical grip-icon';
    grip.style.marginRight = '8px';
    grip.style.color = 'var(--text-muted)';
    grip.style.cursor = 'grab';
    grip.title = 'Glisser pour réorganiser';

    h3.insertBefore(grip, h3.firstChild);
    console.log("✅ Icône ajoutée à:", h3.textContent.trim().substring(0, 20));
}

// Rendre une section draggable
function makeDraggable(section) {
    const h3 = section.querySelector('h3');
    if (!h3) return;

    // Événement au début du drag (seulement sur le h3)
    h3.addEventListener('mousedown', function(e) {
        // Ignorer si on clique sur un bouton ou input
        if (e.target.matches('button, input, select, textarea, i.fa-chevron-up, i.fa-chevron-down')) {
            return;
        }

        isDragging = true;
        draggedElement = section;

        // Style visuel
        section.style.opacity = '0.5';
        section.style.border = '2px solid var(--accent-blue)';

        // Créer le placeholder
        createPlaceholder(section);

        console.log("🎯 Drag started:", h3.textContent.trim().substring(0, 20));

        e.preventDefault();
    });

    // Événement pendant le drag
    section.addEventListener('mouseenter', function(e) {
        if (!isDragging || this === draggedElement) return;

        const container = this.parentNode;
        const allSections = getSections();
        const draggedIndex = allSections.indexOf(draggedElement);
        const targetIndex = allSections.indexOf(this);

        if (draggedIndex < targetIndex) {
            // Insérer après
            container.insertBefore(draggedElement, this.nextSibling);
        } else {
            // Insérer avant
            container.insertBefore(draggedElement, this);
        }
    });
}

// Créer le placeholder
function createPlaceholder(section) {
    placeholder = document.createElement('div');
    placeholder.style.height = section.offsetHeight + 'px';
    placeholder.style.border = '2px dashed var(--accent-blue)';
    placeholder.style.borderRadius = '4px';
    placeholder.style.margin = '5px 0';
    placeholder.style.backgroundColor = 'rgba(78, 205, 196, 0.1)';
}

// Événement global mouseup pour terminer le drag
document.addEventListener('mouseup', function() {
    if (!isDragging) return;

    isDragging = false;

    if (draggedElement) {
        // Restaurer le style
        draggedElement.style.opacity = '1';
        draggedElement.style.border = '';

        console.log("✅ Drag terminé");

        // Sauvegarder l'ordre
        saveOrder();

        draggedElement = null;
    }
});

// Sauvegarder l'ordre des sections
function saveOrder() {
    const sections = getSections();
    const order = sections.map(section => {
        const h3 = section.querySelector('h3');
        const text = h3 ? h3.textContent.trim() : '';
        return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    });

    localStorage.setItem('hydraspec-section-order', JSON.stringify(order));
    console.log("💾 Ordre sauvegardé:", order);
}

// Restaurer l'ordre des sections
function restoreOrder() {
    try {
        const savedOrder = localStorage.getItem('hydraspec-section-order');
        if (!savedOrder) {
            console.log("ℹ️ Aucun ordre sauvegardé");
            return;
        }

        const order = JSON.parse(savedOrder);
        const sections = getSections();
        const container = sections[0]?.parentNode;

        if (!container) {
            console.error("❌ Container non trouvé");
            return;
        }

        // Trouver le point d'insertion (après le header du fichier)
        const fileHeader = document.getElementById('acquisition-header');
        let insertPoint = fileHeader ? fileHeader.nextSibling : container.firstChild;

        // Réorganiser les sections selon l'ordre
        // IMPORTANT: Parcourir dans l'ordre direct pour maintenir l'ordre correct
        order.forEach(id => {
            const section = sections.find(s => {
                const h3 = s.querySelector('h3');
                const text = h3 ? h3.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : '';
                return text === id;
            });

            if (section) {
                // Insérer après le point d'insertion actuel
                if (insertPoint && insertPoint.nextSibling) {
                    container.insertBefore(section, insertPoint.nextSibling);
                } else {
                    container.appendChild(section);
                }
                // Mettre à jour le point d'insertion pour la prochaine section
                insertPoint = section;
            }
        });

        console.log("✅ Ordre restauré:", order);
    } catch (e) {
        console.error("❌ Erreur restauration:", e);
    }
}

// Définir l'ordre par défaut
function setDefaultOrder() {
    console.log("🔧 Application de l'ordre par défaut");

    const sections = getSections();
    const container = sections[0]?.parentNode;

    if (!container) {
        console.error("❌ Container non trouvé");
        return;
    }

    // Ordre souhaité : CANAL, OUTILS, ANNOTATIONS, DÉPLACEMENT/ZOOM, SPECTROGRAMME, PARAMÈTRES FFT
    const defaultOrder = ['canal', 'outils', 'annotations', 'dplacement--zoom', 'spectrogramme-stft', 'paramtres-fft'];

    // Trouver le point d'insertion (après le header du fichier)
    const fileHeader = document.getElementById('acquisition-header');
    let insertPoint = fileHeader ? fileHeader.nextSibling : container.firstChild;

    // Réorganiser les sections selon l'ordre par défaut
    defaultOrder.forEach(id => {
        const section = sections.find(s => {
            const h3 = s.querySelector('h3');
            const text = h3 ? h3.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : '';
            return text === id;
        });

        if (section) {
            // Insérer après le point d'insertion actuel
            if (insertPoint && insertPoint.nextSibling) {
                container.insertBefore(section, insertPoint.nextSibling);
            } else {
                container.appendChild(section);
            }
            // Mettre à jour le point d'insertion pour la prochaine section
            insertPoint = section;
        }
    });

    // Sauvegarder cet ordre par défaut
    localStorage.setItem('hydraspec-section-order', JSON.stringify(defaultOrder));
    console.log("✅ Ordre par défaut appliqué:", defaultOrder);
}

// Réinitialiser l'ordre
function resetSectionOrder() {
    if (confirm('Réinitialiser l\'ordre des sections ?')) {
        localStorage.removeItem('hydraspec-section-order');
        location.reload();
    }
}
