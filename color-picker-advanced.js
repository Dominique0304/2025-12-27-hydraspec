// =====================================================
// COLOR PICKER AVANCÉ - Démo
// =====================================================

// État du color picker
let colorPickerState = {
    hue: 0,          // 0-360
    saturation: 100, // 0-100
    lightness: 50,   // 0-100
    red: 255,
    green: 0,
    blue: 0,
    customColors: [] // Couleurs personnalisées sauvegardées
};

// Couleurs de base prédéfinies (palette 8x8)
const baseColors = [
    // Ligne 1 - Rouges
    '#FFFFFF', '#FFCCCC', '#FF9999', '#FF6666', '#FF3333', '#FF0000', '#CC0000', '#990000',
    // Ligne 2 - Oranges
    '#FFEECC', '#FFDDAA', '#FFCC88', '#FFBB66', '#FFAA44', '#FF9922', '#FF8800', '#CC6600',
    // Ligne 3 - Jaunes
    '#FFFFCC', '#FFFF99', '#FFFF66', '#FFFF33', '#FFFF00', '#CCCC00', '#999900', '#666600',
    // Ligne 4 - Verts clairs
    '#CCFFCC', '#99FF99', '#66FF66', '#33FF33', '#00FF00', '#00CC00', '#009900', '#006600',
    // Ligne 5 - Cyans
    '#CCFFFF', '#99FFFF', '#66FFFF', '#33FFFF', '#00FFFF', '#00CCCC', '#009999', '#006666',
    // Ligne 6 - Bleus
    '#CCCCFF', '#9999FF', '#6666FF', '#3333FF', '#0000FF', '#0000CC', '#000099', '#000066',
    // Ligne 7 - Magentas
    '#FFCCFF', '#FF99FF', '#FF66FF', '#FF33FF', '#FF00FF', '#CC00CC', '#990099', '#660066',
    // Ligne 8 - Gris
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#EEEEEE', '#F5F5F5', '#FFFFFF'
];

// Conversion RGB vers HSL
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

// Conversion HSL vers RGB
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// Initialiser le color picker
function initAdvancedColorPicker() {
    // Charger les couleurs personnalisées depuis localStorage
    const saved = localStorage.getItem('customColors');
    if (saved) {
        colorPickerState.customColors = JSON.parse(saved);
    } else {
        // Initialiser 16 emplacements vides
        colorPickerState.customColors = new Array(16).fill('#CCCCCC');
    }

    // Créer les grilles de couleurs
    createBaseColorsGrid();
    createCustomColorsGrid();

    // Initialiser le sélecteur 2D
    initColorSelector();

    // Initialiser le slider de teinte
    initHueSlider();

    // Initialiser les champs de saisie
    initInputFields();

    // Mettre à jour l'aperçu initial
    updateColorPreview();
}

// Créer la grille des couleurs de base
function createBaseColorsGrid() {
    const container = document.getElementById('base-colors-grid');
    if (!container) return;

    container.innerHTML = '';

    baseColors.forEach(color => {
        const cell = document.createElement('div');
        cell.className = 'color-cell';
        cell.style.backgroundColor = color;
        cell.title = color;

        cell.addEventListener('click', () => {
            setColorFromHex(color);
            // Fermer automatiquement après sélection
            applyAdvancedColor();
        });

        container.appendChild(cell);
    });
}

// Créer la grille des couleurs personnalisées
function createCustomColorsGrid() {
    const container = document.getElementById('custom-colors-grid');
    if (!container) return;

    container.innerHTML = '';

    colorPickerState.customColors.forEach((color, index) => {
        const cell = document.createElement('div');
        cell.className = 'color-cell custom-color-cell';
        cell.style.backgroundColor = color;
        cell.title = `Couleur personnalisée ${index + 1}`;

        cell.addEventListener('click', () => {
            if (color !== '#CCCCCC') {
                setColorFromHex(color);
                // Fermer automatiquement après sélection
                applyAdvancedColor();
            }
        });

        // Ajouter bouton reset si la couleur n'est pas vide
        if (color !== '#CCCCCC') {
            const resetBtn = document.createElement('button');
            resetBtn.className = 'color-cell-reset';
            resetBtn.innerHTML = '×';
            resetBtn.title = 'Réinitialiser';
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                resetCustomColor(index);
            });
            cell.appendChild(resetBtn);
        }

        container.appendChild(cell);
    });
}

// Réinitialiser une couleur personnalisée
function resetCustomColor(index) {
    colorPickerState.customColors[index] = '#CCCCCC';
    localStorage.setItem('customColors', JSON.stringify(colorPickerState.customColors));
    createCustomColorsGrid();
}

// Définir une couleur à partir d'un code hexadécimal
function setColorFromHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    colorPickerState.red = rgb.r;
    colorPickerState.green = rgb.g;
    colorPickerState.blue = rgb.b;
    colorPickerState.hue = hsl.h;
    colorPickerState.saturation = hsl.s;
    colorPickerState.lightness = hsl.l;

    updateAllInputs();
    updateColorPreview();
    updateColorSelectorCursor();
    updateHueSliderCursor();
}

// Conversion Hex vers RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Conversion RGB vers Hex
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Initialiser le sélecteur de couleur 2D
function initColorSelector() {
    const selector = document.getElementById('color-selector');
    const cursor = document.getElementById('color-cursor');
    if (!selector || !cursor) return;

    let isDragging = false;

    const updateColor = (e) => {
        const rect = selector.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        // Limiter aux bordures
        x = Math.max(0, Math.min(x, rect.width));
        y = Math.max(0, Math.min(y, rect.height));

        // Calculer saturation et luminosité
        const saturation = (x / rect.width) * 100;
        const lightness = 100 - (y / rect.height) * 100;

        colorPickerState.saturation = Math.round(saturation);
        colorPickerState.lightness = Math.round(lightness);

        updateFromHSL();
    };

    selector.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateColor(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateColor(e);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Initialiser le slider de teinte
function initHueSlider() {
    const slider = document.getElementById('hue-slider');
    const cursor = document.getElementById('hue-cursor');
    if (!slider || !cursor) return;

    let isDragging = false;

    const updateHue = (e) => {
        const rect = slider.getBoundingClientRect();
        let y = e.clientY - rect.top;

        // Limiter aux bordures
        y = Math.max(0, Math.min(y, rect.height));

        // Calculer la teinte (0-360)
        const hue = (y / rect.height) * 360;
        colorPickerState.hue = Math.round(hue);

        updateFromHSL();
        updateColorSelectorBackground();
    };

    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateHue(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateHue(e);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Mettre à jour à partir des valeurs HSL
function updateFromHSL() {
    const rgb = hslToRgb(colorPickerState.hue, colorPickerState.saturation, colorPickerState.lightness);
    colorPickerState.red = rgb.r;
    colorPickerState.green = rgb.g;
    colorPickerState.blue = rgb.b;

    updateAllInputs();
    updateColorPreview();
    updateColorSelectorCursor();
    updateHueSliderCursor();
}

// Mettre à jour à partir des valeurs RGB
function updateFromRGB() {
    const hsl = rgbToHsl(colorPickerState.red, colorPickerState.green, colorPickerState.blue);
    colorPickerState.hue = hsl.h;
    colorPickerState.saturation = hsl.s;
    colorPickerState.lightness = hsl.l;

    updateAllInputs();
    updateColorPreview();
    updateColorSelectorCursor();
    updateHueSliderCursor();
    updateColorSelectorBackground();
}

// Mettre à jour tous les champs de saisie
function updateAllInputs() {
    document.getElementById('input-hue').value = colorPickerState.hue;
    document.getElementById('input-saturation').value = colorPickerState.saturation;
    document.getElementById('input-lightness').value = colorPickerState.lightness;
    document.getElementById('input-red').value = colorPickerState.red;
    document.getElementById('input-green').value = colorPickerState.green;
    document.getElementById('input-blue').value = colorPickerState.blue;
}

// Initialiser les champs de saisie
function initInputFields() {
    // Champs HSL
    document.getElementById('input-hue').addEventListener('input', (e) => {
        colorPickerState.hue = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
        updateFromHSL();
        updateColorSelectorBackground();
    });

    document.getElementById('input-saturation').addEventListener('input', (e) => {
        colorPickerState.saturation = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
        updateFromHSL();
    });

    document.getElementById('input-lightness').addEventListener('input', (e) => {
        colorPickerState.lightness = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
        updateFromHSL();
    });

    // Champs RGB
    document.getElementById('input-red').addEventListener('input', (e) => {
        colorPickerState.red = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
        updateFromRGB();
    });

    document.getElementById('input-green').addEventListener('input', (e) => {
        colorPickerState.green = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
        updateFromRGB();
    });

    document.getElementById('input-blue').addEventListener('input', (e) => {
        colorPickerState.blue = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
        updateFromRGB();
    });
}

// Mettre à jour l'aperçu de la couleur
function updateColorPreview() {
    const preview = document.getElementById('color-preview');
    if (!preview) return;

    const hex = rgbToHex(colorPickerState.red, colorPickerState.green, colorPickerState.blue);
    preview.style.backgroundColor = hex;

    // Afficher le code hex
    const hexDisplay = document.getElementById('color-hex-display');
    if (hexDisplay) {
        hexDisplay.textContent = hex;
    }
}

// Mettre à jour la position du curseur dans le sélecteur
function updateColorSelectorCursor() {
    const selector = document.getElementById('color-selector');
    const cursor = document.getElementById('color-cursor');
    if (!selector || !cursor) return;

    const rect = selector.getBoundingClientRect();
    const x = (colorPickerState.saturation / 100) * rect.width;
    const y = (1 - colorPickerState.lightness / 100) * rect.height;

    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
}

// Mettre à jour la position du curseur du slider de teinte
function updateHueSliderCursor() {
    const slider = document.getElementById('hue-slider');
    const cursor = document.getElementById('hue-cursor');
    if (!slider || !cursor) return;

    const rect = slider.getBoundingClientRect();
    const y = (colorPickerState.hue / 360) * rect.height;

    cursor.style.top = `${y}px`;
}

// Mettre à jour le fond du sélecteur de couleur selon la teinte
function updateColorSelectorBackground() {
    const selector = document.getElementById('color-selector');
    if (!selector) return;

    const hue = colorPickerState.hue;
    const baseColor = `hsl(${hue}, 100%, 50%)`;

    selector.style.background = `
        linear-gradient(to bottom, white, transparent),
        linear-gradient(to bottom, transparent, black),
        ${baseColor}
    `;
}

// Sauvegarder une couleur personnalisée
function saveCustomColor() {
    const hex = rgbToHex(colorPickerState.red, colorPickerState.green, colorPickerState.blue);

    // Trouver le premier emplacement vide (#CCCCCC)
    const emptyIndex = colorPickerState.customColors.findIndex(c => c === '#CCCCCC');

    if (emptyIndex !== -1) {
        colorPickerState.customColors[emptyIndex] = hex;
    } else {
        // Si tous pleins, remplacer le dernier
        colorPickerState.customColors[15] = hex;
    }

    // Sauvegarder dans localStorage
    localStorage.setItem('customColors', JSON.stringify(colorPickerState.customColors));

    // Recréer la grille
    createCustomColorsGrid();
}

// Ouvrir le color picker
function openAdvancedColorPicker() {
    const modal = document.getElementById('advanced-color-picker-modal');
    if (modal) {
        modal.style.display = 'flex';
        initAdvancedColorPicker();
        initModalDragDrop();
        initModalClickOutside();
    }
}

// Fermer au clic en dehors
function initModalClickOutside() {
    const modal = document.getElementById('advanced-color-picker-modal');
    const content = document.querySelector('.advanced-color-picker-content');

    if (!modal || !content) return;

    // Fermer si clic sur le fond (modal) mais pas sur le contenu
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAdvancedColorPicker();
        }
    });
}

// Initialiser le drag and drop du modal
function initModalDragDrop() {
    const modal = document.getElementById('advanced-color-picker-modal');
    const content = document.querySelector('.advanced-color-picker-content');
    if (!modal || !content) return;

    let isDragging = false;
    let startX, startY;
    let initialLeft, initialTop;

    // Rendre le modal positionnable
    content.style.position = 'fixed';
    content.style.left = '50%';
    content.style.top = '50%';
    content.style.transform = 'translate(-50%, -50%)';
    content.style.cursor = 'move';

    const startDrag = (e) => {
        // Ne pas démarrer le drag si on clique sur un input, button ou color-cell
        if (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'BUTTON' ||
            e.target.closest('.color-cell') ||
            e.target.closest('#color-selector') ||
            e.target.closest('#hue-slider')) {
            return;
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = content.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        content.style.transform = 'none';
        content.style.left = `${initialLeft}px`;
        content.style.top = `${initialTop}px`;

        e.preventDefault();
    };

    const drag = (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        content.style.left = `${initialLeft + dx}px`;
        content.style.top = `${initialTop + dy}px`;
    };

    const stopDrag = () => {
        isDragging = false;
    };

    content.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

// Fermer le color picker
function closeAdvancedColorPicker() {
    const modal = document.getElementById('advanced-color-picker-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Valider et appliquer la couleur
function applyAdvancedColor() {
    const hex = rgbToHex(colorPickerState.red, colorPickerState.green, colorPickerState.blue);
    console.log('Couleur sélectionnée:', hex);
    // TODO: Appliquer la couleur à l'élément cible
    closeAdvancedColorPicker();
}

// Changer d'onglet
function switchColorPickerTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.color-picker-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.color-picker-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activer l'onglet sélectionné
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`tab-${tabName}`);

    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
}

// Afficher/masquer les champs dans l'onglet Palettes
function togglePaletteInputs() {
    const checkbox = document.getElementById('show-palette-inputs');
    const inputs = document.getElementById('palette-inputs');

    if (checkbox && inputs) {
        inputs.style.display = checkbox.checked ? 'block' : 'none';
    }
}

// Synchroniser les inputs entre les deux onglets
function syncInputsBetweenTabs() {
    // Récupérer les valeurs de l'onglet Sélecteur
    const red = document.getElementById('input-red');
    const green = document.getElementById('input-green');
    const blue = document.getElementById('input-blue');
    const hue = document.getElementById('input-hue');
    const saturation = document.getElementById('input-saturation');
    const lightness = document.getElementById('input-lightness');

    // Synchroniser avec l'onglet Palettes
    const red2 = document.getElementById('input-red-2');
    const green2 = document.getElementById('input-green-2');
    const blue2 = document.getElementById('input-blue-2');

    if (red2 && red) red2.value = red.value;
    if (green2 && green) green2.value = green.value;
    if (blue2 && blue) blue2.value = blue.value;
}
