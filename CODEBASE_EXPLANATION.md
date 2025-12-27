# HydraSpec Pro2 - Documentation de la Structure du Code

## Vue d'ensemble

**HydraSpec Pro2** est une application web d'analyse de signaux avancée (v1.4.0) permettant l'analyse temporelle et fréquentielle de données, principalement utilisée pour l'analyse de signaux de pression. L'application offre des visualisations interactives, des analyses FFT, des spectrogrammes et de multiples outils de mesure.

### Technologies principales
- **JavaScript Vanilla** (ES6+)
- **Chart.js** - Bibliothèque de visualisation de graphiques
- **HTML5 Canvas** - Pour les rendus personnalisés et exports
- **Marked.js** - Rendu Markdown
- **Architecture modulaire** - Séparation claire des responsabilités

---

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                            │
│                  (Interface utilisateur)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         app.js                               │
│            (Point d'entrée et orchestration)                 │
│   • Gestion de l'état (appState)                            │
│   • Initialisation des composants                           │
│   • Internationalisation (i18n)                             │
│   • Gestion des thèmes                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────────┐ ┌────────────┐ ┌──────────────┐
│   charts.js    │ │  utils.js  │ │constants.js  │
│ (Visualisation)│ │(Utilitaires)│ │ (Config.)    │
└────────────────┘ └────────────┘ └──────────────┘
         │
         ├─────► multi-channel.js (Gestion multi-canaux)
         ├─────► calculated-channel.js (Canaux calculés)
         ├─────► spectrogram.js (Spectrogramme)
         ├─────► smoothing.js (Lissage de signal)
         ├─────► annotations.js (Annotations)
         ├─────► halo.js (Effets visuels)
         │
         └─────► Outils:
                 • measure-tool.js (Mesures)
                 • ruler-tool.js (Règle)
                 • pan-tool.js (Navigation)
                 • track-tool.js (Suivi)
                 • canal-quick-view.js (Vue rapide)
                 • section-reorder.js (Réorganisation)
```

---

## Description détaillée des fichiers

### 📄 Fichiers principaux

#### **index.html**
- Interface utilisateur principale
- Structure en sections collapsibles
- Conteneurs pour les graphiques (Canvas Chart.js)
- Modales pour les paramètres, générateur, aide
- Système de tabulation pour la configuration multi-canaux

#### **app.js** (Point d'entrée - ~plusieurs milliers de lignes)
**Responsabilités principales:**
- **État global** (`appState`) : Gère toutes les données de l'application
  - Données temporelles et fréquentielles
  - Position des curseurs
  - Configuration des canaux
  - Paramètres FFT
  - État des outils actifs

- **Internationalisation (i18n)** : Support multilingue (FR/EN)

- **Initialisation** :
  - Configuration des charts
  - Chargement des préférences utilisateur
  - Mise en place des écouteurs d'événements

- **Gestion des thèmes** :
  - Dark (défaut)
  - Light
  - Steampunk
  - Steampunk2

#### **constants.js**
Définit les constantes globales de l'application:
```javascript
- APP_VERSION: "1.4.0"
- DEFAULT_FS: 1000 Hz (fréquence d'échantillonnage)
- DEFAULT_FFT_SIZE: 4096 points
- MAX_CACHE_SIZE: 10
- DEBOUNCE_DELAY: 300ms
- COLORS: Palette de couleurs
- THEMES: Configurations des thèmes
```

### 📊 Visualisation et Graphiques

#### **charts.js**
Gestion de tous les graphiques Chart.js:

**Graphiques principaux:**
1. **Domaine temporel** (`timeChart`)
   - Affichage de la forme d'onde
   - Curseurs de sélection (vert/rouge)
   - Axes personnalisés avec unités
   - Plugins pour annotations, mesures, règles

2. **Domaine fréquentiel** (`fftChart`)
   - Spectre FFT
   - Détection de pics
   - Fenêtrage configurable
   - Multi-échelles Y

3. **Spectrogramme** (`spectrogramChart`)
   - Visualisation temps-fréquence
   - Échelle de couleurs personnalisable
   - Analyse en temps réel

**Fonctionnalités:**
- Cache FFT pour optimisation des performances
- Zoom/Pan interactif
- Export PNG
- Synchronisation entre graphiques
- Gestion de multiples axes Y pour multi-canaux

#### **spectrogram.js**
Module dédié au spectrogramme:
- Calcul de la STFT (Short-Time Fourier Transform)
- Conversion en échelle de couleurs
- Rendu optimisé sur Canvas
- Paramètres configurables (fenêtre temporelle, overlap)

### 🎚️ Gestion des données multi-canaux

#### **multi-channel.js**
Système complet de gestion des canaux multiples:

**Fonctionnalités:**
- Configuration individuelle par canal:
  - Visibilité
  - Couleur
  - Épaisseur de ligne
  - Position d'axe Y (gauche/droite/caché)
  - Limites Y personnalisées
  - Affichage FFT sélectif

- **Presets globaux:**
  - "Tous visibles"
  - "Seuls canaux principaux"
  - "Mode comparaison"

- Interface à onglets pour organiser les canaux
- Système de glisser-déposer pour réorganisation
- Tableaux de configuration avec contrôles inline

**Couleurs par défaut:**
```javascript
Rouge, Bleu, Vert, Orange, Magenta, Cyan, Or, Violet
```

#### **calculated-channel.js**
Permet de créer des canaux calculés à partir de canaux existants:
- Opérations mathématiques (+, -, ×, ÷)
- Combinaisons de plusieurs canaux
- Fonctions avancées (moyenne, écart-type, RMS)
- Intégration transparente dans le système multi-canaux

#### **canal-quick-view.js**
Interface rapide pour basculer entre canaux:
- Sélecteur déroulant
- Raccourcis clavier
- Prévisualisation rapide
- Navigation fluide

### 🔧 Outils d'analyse

#### **measure-tool.js**
Outil de mesure interactif:
- Placement de points de mesure sur les graphiques
- Calcul automatique de:
  - Différences temporelles (Δt)
  - Différences d'amplitude (ΔA)
  - Fréquences dérivées (1/Δt)
- Affichage des résultats en overlay
- Multi-points pour comparaisons complexes

#### **ruler-tool.js**
Règle virtuelle pour mesures précises:
- Affichage d'une règle graduée
- Mesure de distances
- Angles et pentes
- Export des mesures

#### **pan-tool.js**
Gestion du déplacement et du zoom:
- **Zoom:**
  - Molette : zoom X+Y
  - Shift + Molette : zoom Y seulement
  - Ctrl + Molette : zoom X seulement
- **Pan:**
  - Clic-glisser pour naviguer
  - Shift + Clic : déplacement groupé des curseurs
- Limites automatiques pour éviter de sortir des données

#### **track-tool.js**
Suivi de caractéristiques du signal:
- Détection automatique de pics
- Suivi de crêtes
- Analyse de tendances
- Marqueurs dynamiques

### 🎨 Annotations et visualisation

#### **annotations.js**
Système d'annotations riches:
- Création de notes sur les graphiques
- Support Markdown
- Connecteurs visuels vers points de données
- Édition/suppression dynamique
- Export avec le projet

#### **halo.js**
Effets visuels pour améliorer la lisibilité:
- Halos autour des points importants
- Mise en évidence de zones
- Animations fluides
- Personnalisable par thème

#### **smoothing.js**
Lissage de signaux:
- **Algorithmes disponibles:**
  - Moyenne mobile
  - Moyenne mobile pondérée
  - Filtre de Savitzky-Golay
  - Filtre médian
- Paramètres ajustables (fenêtre, ordre)
- Prévisualisation avant application

### 📁 Import/Export et Utilitaires

#### **utils.js**
Fonctions utilitaires variées:

**Gestion de fichiers:**
- `handleFileUpload()` : Import CSV
  - Détection automatique des colonnes
  - Parsing robuste (séparateurs multiples)
  - Validation des données

- `exportCSV()` : Export de données
  - Format compatible avec réimport
  - Métadonnées incluses

- Gestion de projets (.hsp):
  - Sauvegarde complète de l'état
  - Restauration fidèle
  - Compression des données

**Générateur de signaux:**
- `generateSignal()` : Création de signaux synthétiques
  - Multi-fréquences (superposition)
  - Bruit gaussien configurable
  - Composante DC
  - Déphasage par composante

**Autres utilitaires:**
- Formatage de nombres
- Conversions d'unités
- Helpers pour Canvas
- Debouncing/Throttling

#### **section-reorder.js**
Réorganisation de l'interface:
- Glisser-déposer des sections
- Sauvegarde des préférences de layout
- Restauration automatique
- Interface intuitive

### 📚 Bibliothèques externes (dossier `lib/`)

#### **chart.min.js**
Chart.js - Version minifiée
- Bibliothèque de graphiques interactive
- Extensible via plugins
- Responsive et performante

#### **html2canvas.min.js**
Capture d'écran HTML vers Canvas
- Utilisé pour export PNG
- Rendu fidèle du DOM
- Compatible avec graphiques complexes

#### **marked.min.js**
Parser et renderer Markdown
- Conversion Markdown → HTML
- Utilisé pour annotations et aide
- Sécurisé (sanitization)

---

## Flux de données principal

### 1. Chargement de données

```
Utilisateur sélectionne fichier CSV
         │
         ▼
handleFileUpload() (utils.js)
         │
         ├─► Parsing du CSV
         ├─► Détection colonnes (temps + multiples canaux)
         ├─► Validation des données
         │
         ▼
Stockage dans appState
         ├─► fullDataTime (temps)
         ├─► fullDataPressure (données canal principal)
         ├─► allColumnData[] (tous canaux)
         ├─► availableColumns[] (métadonnées colonnes)
         │
         ▼
initChannelConfig() (multi-channel.js)
         │
         ├─► Création configuration par canal
         ├─► Attribution couleurs
         ├─► Définition axes Y
         │
         ▼
updateTimeChart() (charts.js)
         │
         ├─► Création datasets Chart.js
         ├─► Application styles
         ├─► Rendu graphique
```

### 2. Analyse FFT

```
Utilisateur définit zone d'analyse (curseurs)
         │
         ▼
performAnalysis()
         │
         ├─► Extraction données entre curseurs
         ├─► Vérification cache FFT
         │     │
         │     ├─► Cache hit → Récupération résultats
         │     └─► Cache miss → Calcul FFT
         │
         ├─► Application fenêtrage (Hanning/Hamming/etc.)
         ├─► Calcul FFT (algorithme Cooley-Tukey)
         ├─► Conversion amplitude/phase
         ├─► Détection pics
         │
         ▼
updateFFTChart()
         │
         ├─► Affichage spectre
         ├─► Marqueurs de pics
         ├─► Mise à jour résultats
```

### 3. Interaction utilisateur

```
Événement souris/clavier
         │
         ├─► Zoom/Pan
         │     └─► pan-tool.js → Recalcul limites axes
         │
         ├─► Curseurs
         │     └─► Détection position → Mise à jour curseur → Analyse
         │
         ├─► Mesures
         │     └─► measure-tool.js → Calculs → Overlay résultats
         │
         ├─► Annotations
         │     └─► annotations.js → Création/Édition → Rendu
         │
         └─► Configuration canaux
               └─► multi-channel.js → MAJ config → Rafraîchissement graphiques
```

---

## État de l'application (appState)

L'objet `appState` est le cœur de l'application. Il contient:

```javascript
appState = {
    // Données brutes
    fullDataTime: Float32Array,
    fullDataPressure: Float32Array,
    allColumnData: [],           // Tous les canaux
    availableColumns: [],        // Métadonnées colonnes

    // Sélection
    cursorStart: Number,         // Position curseur vert (ms)
    cursorEnd: Number,           // Position curseur rouge (ms)

    // Configuration
    fs: Number,                  // Fréquence échantillonnage (Hz)
    timeIncrement: Number,       // Pas temporel (ms)
    fftSize: Number,             // Points FFT
    windowType: String,          // Type fenêtre FFT

    // Multi-canaux
    channelConfig: [],           // Configuration par canal
    currentColumnIndex: Number,  // Canal actif

    // Graphiques
    charts: {
        time: Chart,
        fft: Chart,
        spectrogram: Chart
    },

    // Outils
    activeTool: String,          // measure/ruler/pan/etc.
    measurePoints: [],
    annotations: [],

    // Interface
    theme: String,
    language: String,
    yAxisLabel: String
}
```

---

## Fonctionnalités avancées

### Système de cache FFT
Pour optimiser les performances, les résultats FFT sont mis en cache:
- Clé: `${cursorStart}_${cursorEnd}_${fftSize}_${windowType}`
- Taille maximale: 10 entrées (LRU - Least Recently Used)
- Invalidation automatique si paramètres changent

### Gestion mémoire
- Utilisation de `Float32Array` pour données volumineuses
- Libération mémoire lors chargement nouveau fichier
- Pagination pour très gros datasets

### Performance de rendu
- Animation désactivée sur Chart.js (`animation: false`)
- Decimation intelligente pour gros volumes de points
- Rendu différé avec `requestAnimationFrame`

### Responsive Design
- Charts s'adaptent à la taille de la fenêtre
- Interface collapsible pour petits écrans
- Touch-friendly pour tablettes

---

## Patterns de conception utilisés

### 1. **Module Pattern**
Chaque fichier JS encapsule ses fonctionnalités:
```javascript
// Pas d'export/import ES6 modules, mais organisation modulaire
// via portée globale contrôlée
```

### 2. **Observer Pattern**
Les changements d'état déclenchent des mises à jour:
```javascript
updateTimeChart() → performAnalysis() → updateFFTChart()
```

### 3. **Strategy Pattern**
Fenêtrages FFT interchangeables:
```javascript
switch(windowType) {
    case 'hanning': applyHanning(); break;
    case 'hamming': applyHamming(); break;
    // ...
}
```

### 4. **Plugin Architecture**
Chart.js étendu via plugins personnalisés:
```javascript
{
    id: 'cursors',
    afterDraw: (chart) => drawCursors(chart)
}
```

---

## Configuration et personnalisation

### Thèmes
Définis dans `index.html` via variables CSS:
```css
--bg-primary: couleur fond principal
--text-primary: couleur texte
--accent-blue: couleur accent
--border-color: couleur bordures
```

### Traductions
Structure i18n dans `app.js`:
```javascript
i18n = {
    fr: { key: "valeur FR" },
    en: { key: "EN value" }
}
```

### Préférences utilisateur
Stockées dans `localStorage`:
- Thème sélectionné
- Langue préférée
- Dernière configuration de canaux
- Layout sections

---

## Points d'extension

Pour ajouter de nouvelles fonctionnalités:

### Nouveau canal calculé
1. Éditer `calculated-channel.js`
2. Ajouter formule dans `calculateChannel()`
3. Mettre à jour UI dans `initChannelConfig()`

### Nouvel outil
1. Créer `mon-outil.js`
2. Implémenter fonctions `drawMonOutil()`, `handleMonOutilClick()`
3. Ajouter plugin dans `charts.js`
4. Créer bouton UI dans `index.html`

### Nouveau format d'export
1. Éditer `utils.js`
2. Créer fonction `exportMonFormat()`
3. Ajouter option dans menu Export

### Nouvel algorithme FFT
1. Éditer section FFT dans `charts.js`
2. Implémenter algorithme
3. Ajouter option dans sélecteur fenêtre

---

## Débogage et diagnostic

### Fichier diagnostic.html
Interface de diagnostic pour:
- Test des fonctionnalités
- Validation des calculs
- Profiling performances
- Vérification compatibilité navigateur

### Console logs
Utilisation extensive de `console.log()` avec emojis pour catégoriser:
- 🎨 Configuration UI
- ✅ Succès opération
- ❌ Erreurs
- ⚠️ Avertissements

---

## Bonnes pratiques du code

1. **Nommage explicite**
   - Variables descriptives
   - Préfixes conventionnels (btn-, display-, modal-)

2. **Commentaires**
   - Sections clairement délimitées
   - Explications des algorithmes complexes
   - TODOs pour améliorations futures

3. **Validation**
   - Vérifications des entrées utilisateur
   - Gestion gracieuse des erreurs
   - Messages d'erreur explicites

4. **Optimisation**
   - Cache des résultats coûteux
   - Debouncing des événements fréquents
   - Utilisation structures de données appropriées

---

## Résumé de la structure

```
hydraspec-pro2/
│
├── index.html              ← Interface principale
├── diagnostic.html         ← Interface de diagnostic
├── README.md              ← Documentation projet
│
├── app.js                 ← Point d'entrée et orchestration
├── constants.js           ← Constantes globales
├── utils.js               ← Utilitaires généraux
│
├── charts.js              ← Gestion graphiques Chart.js
├── spectrogram.js         ← Spectrogramme
├── smoothing.js           ← Lissage de signaux
│
├── multi-channel.js       ← Système multi-canaux
├── calculated-channel.js  ← Canaux calculés
├── canal-quick-view.js    ← Sélecteur rapide canaux
│
├── annotations.js         ← Annotations
├── halo.js               ← Effets visuels
│
├── measure-tool.js        ← Outil de mesure
├── ruler-tool.js          ← Règle
├── pan-tool.js            ← Zoom/Pan
├── track-tool.js          ← Suivi
├── section-reorder.js     ← Réorganisation UI
│
└── lib/
    ├── chart.min.js       ← Chart.js
    ├── html2canvas.min.js ← Export PNG
    └── marked.min.js      ← Parser Markdown
```

---

## Conclusion

HydraSpec Pro2 est une application sophistiquée d'analyse de signaux avec:
- Architecture modulaire bien organisée
- Séparation claire des responsabilités
- Système extensible de plugins et outils
- Performance optimisée pour gros volumes de données
- Interface utilisateur riche et intuitive
- Support multi-canaux complet
- Outils d'analyse avancés (FFT, spectrogramme, mesures)

Le code est structuré de manière à faciliter:
- La maintenance
- L'ajout de nouvelles fonctionnalités
- Le débogage
- La collaboration

Cette architecture permet une évolution continue du projet tout en maintenant stabilité et performance.
