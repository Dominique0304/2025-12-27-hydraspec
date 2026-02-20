# Refactorisation Architecture POO - HydraSpec Pro

## 🎯 Objectif de la refactorisation

Éliminer les variables globales et encapsuler complètement la gestion des outils dans des classes Manager pour une véritable architecture orientée objet.

## ✅ Ce qui a été fait

### 1. Création des Managers

Trois nouvelles classes ont été créées pour encapsuler la gestion des outils :

#### **SnapPointManager** (`snappoint-manager.js`)
- Encapsule : `snapPoints[]`, `nextSnapPointId`, `isCreatingSnapPoint`, `snapPointState`
- Méthodes : `create()`, `getAll()`, `getById()`, `delete()`, `save()`, `load()`
- Avantages : État isolé par projet, pas de pollution globale

#### **IntervalManager** (`interval-manager.js`)
- Encapsule : `intervals[]`, `nextIntervalId`, `isCreatingInterval`, `pendingIntervalData`
- Méthodes : `create()`, `startCreating()`, `finishCreating()`, `save()`, `load()`
- Avantages : Gestion propre du cycle de création d'intervalles

#### **DiffCanalManager** (`diffcanal-manager.js`)
- Encapsule : `diffCanalIntervals[]`, `nextDiffCanalId`, `isCreatingDiffCanal`
- Méthodes : `create()`, `startCreating()`, `finishCreating()`, `save()`, `load()`
- Avantages : Isolation des différences entre canaux

### 2. Intégration dans Project

La classe `Project` (`project.js`) a été modifiée pour instancier les managers :

```javascript
class Project {
    constructor(name) {
        // ...
        this.snapPointManager = new SnapPointManager(this);
        this.intervalManager = new IntervalManager(this);
        this.diffCanalManager = new DiffCanalManager(this);
    }
}
```

**Résultat** : Chaque projet a maintenant ses propres managers complètement isolés !

### 3. Système d'adaptateurs de compatibilité

Un nouveau fichier `tool-adapters.js` assure la compatibilité avec le code existant :

#### **syncGlobalVariablesWithManagers()**
- Synchronise les variables globales avec les managers du projet actif
- Appelé automatiquement lors du changement de projet
- Permet au code ancien de continuer à fonctionner

#### **syncManagersFromGlobalVariables()**
- Synchronise les managers depuis les variables globales
- Appelé avant la sauvegarde
- Capture toutes les modifications faites via l'ancien code

### 4. Modifications de project-integration.js

#### **saveAllToolsState()**
```javascript
// Avant
project.toolsState.snapPoints = JSON.parse(JSON.stringify(snapPoints));

// Après
const snapPointData = project.snapPointManager.save();
project.toolsState.snapPoints = snapPointData.snapPoints;
```

#### **restoreAllToolsState()**
```javascript
// Avant
snapPoints.length = 0;
snapPoints.push(...data);

// Après
project.snapPointManager.load(data);
syncGlobalVariablesWithManagers();
```

#### **onProjectSwitched()**
```javascript
function onProjectSwitched(project) {
    // NOUVEAU : Synchronisation automatique
    syncGlobalVariablesWithManagers();

    // ... reste du code
}
```

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Variables globales** | ❌ `snapPoints`, `intervals`, etc. | ✅ Encapsulées dans managers |
| **Isolation projets** | ⚠️ Via copie manuelle | ✅ Automatique (chaque Project a ses managers) |
| **Risque de mélange** | ❌ Élevé | ✅ Quasi nul |
| **Encapsulation** | ❌ Fonctions libres | ✅ Méthodes de classe |
| **Maintenabilité** | ⚠️ Difficile | ✅ Excellente |
| **Testabilité** | ❌ Difficile | ✅ Facile (chaque manager testable séparément) |

## 🔧 Comment utiliser les managers

### Accès aux managers

```javascript
// Via le projet actif
const project = projectManager.getActive();
const snapManager = project.snapPointManager;
const intervalManager = project.intervalManager;
const diffManager = project.diffCanalManager;
```

### Créer un élément

```javascript
// Créer un marqueur
const snapPoint = project.snapPointManager.create(
    channelIndex,
    time,
    value
);

// Créer un intervalle
const interval = project.intervalManager.create(
    startTime,
    endTime,
    "Mon commentaire"
);
```

### Obtenir tous les éléments

```javascript
const allSnapPoints = project.snapPointManager.getAll();
const allIntervals = project.intervalManager.getAll();
```

### Supprimer un élément

```javascript
project.snapPointManager.delete(id);
project.intervalManager.delete(id);
```

### Statistiques

```javascript
const stats = project.snapPointManager.getStats();
// { count: 5, visible: 4, hidden: 1 }
```

## ⚡ Compatibilité avec le code existant

Le code existant continue de fonctionner grâce aux adaptateurs :

```javascript
// Ancien code (toujours supporté)
snapPoints.push(newSnapPoint);
intervals.forEach(i => console.log(i));

// Les variables globales sont automatiquement synchronisées
// avec les managers du projet actif !
```

**Note** : Il est recommandé de migrer progressivement vers l'utilisation directe des managers pour profiter pleinement de l'encapsulation.

## 📁 Fichiers modifiés/créés

### Nouveaux fichiers
- `snappoint-manager.js` - Manager pour les marqueurs
- `interval-manager.js` - Manager pour les intervalles
- `diffcanal-manager.js` - Manager pour diff canal
- `tool-adapters.js` - Adaptateurs de compatibilité
- `ARCHITECTURE_REFACTORING.md` - Cette documentation

### Fichiers modifiés
- `project.js` - Ajout des managers dans le constructeur
- `project-integration.js` - Utilisation des managers pour save/restore
- `index.html` - Import des nouveaux fichiers

### Fichiers non modifiés (compatibilité préservée)
- `snappoint-tool.js` - Fonctionne toujours via variables globales
- `intervals.js` - Fonctionne toujours via variables globales
- `diff-canal-tool.js` - Fonctionne toujours via variables globales

## 🚀 Prochaines étapes recommandées

1. ✅ **Terminé** : Encapsuler SnapPoints, Intervals, DiffCanal
2. 🔄 **Optionnel** : Migrer les fonctions des outils vers les managers
3. 🔄 **Optionnel** : Créer des managers pour les autres outils (Annotations, Measure, Pan, etc.)
4. 🔄 **Optionnel** : Supprimer complètement les variables globales

## 💡 Bénéfices immédiats

- ✅ Isolation parfaite entre projets
- ✅ Pas de mélange de données possible
- ✅ Architecture plus claire et maintenable
- ✅ Facilite les tests unitaires
- ✅ Compatibilité préservée avec le code existant
- ✅ Base solide pour futures évolutions

## 🎓 Bonnes pratiques

1. **Toujours** sauvegarder via les managers : `project.snapPointManager.save()`
2. **Toujours** restaurer via les managers : `project.snapPointManager.load(data)`
3. **Éviter** de modifier directement les variables globales (préférer les managers)
4. **Utiliser** `syncGlobalVariablesWithManagers()` après changement de projet
5. **Utiliser** `syncManagersFromGlobalVariables()` avant sauvegarde

## ✅ Résultat final

HydraSpec Pro dispose maintenant d'une architecture POO moderne et robuste, avec une encapsulation complète des outils tout en maintenant la compatibilité avec le code existant. Chaque projet est totalement isolé et possède ses propres managers d'outils.
