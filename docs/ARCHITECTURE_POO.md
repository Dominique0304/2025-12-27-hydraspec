# Architecture POO - HydraSpec Pro

## 🎯 Objectif

Permettre la gestion de **plusieurs fichiers/projets simultanément** sans mélanger les données (échelles, canaux, zoom, paramètres).

## 📁 Fichiers créés

### 1. `project.js` - Classe Project
Encapsule **toutes** les données et fonctionnalités d'un projet :
- État isolé (données, paramètres, curseurs, etc.)
- Graphiques Chart.js dédiés
- Méthodes encapsulées (générer signal, charger CSV, exporter, etc.)

**Exemple d'utilisation :**
```javascript
const project1 = new Project("Mesure Cylindre");
project1.generateSignal({
    fs: 1000,
    duration: 10,
    frequencies: [
        { freq: 50, amp: 5, phase: 0 },
        { freq: 180, amp: 1.5, phase: 45 }
    ]
});

const project2 = new Project("Vibration Pompe");
await project2.loadCSV(file);

// Les deux projets sont COMPLÈTEMENT isolés
// Impossible de mélanger leurs données !
```

### 2. `project-manager.js` - Classe ProjectManager
Gère plusieurs projets simultanément :
- Création/suppression de projets
- Basculement entre projets (onglets)
- Projet actif
- Événements (projectCreated, projectDeleted, projectSwitched)

**Exemple d'utilisation :**
```javascript
const manager = new ProjectManager();

// Créer plusieurs projets
const p1 = manager.createProjectFromGenerator({ fs: 1000, duration: 10 });
const p2 = await manager.createProjectFromCSV(file);
const p3 = manager.createProject("Projet Vide");

// Basculer entre les projets
manager.switchTo(p1.id);
manager.switchTo(p2.id);

// Accéder au projet actif
const activeProject = manager.getActive();
console.log(activeProject.state.fullDataTime);

// Statistiques
const stats = manager.getStats();
// { projectCount: 3, totalDataPoints: 50000, totalDuration: "25.00" }
```

### 3. `project-test.html` - Page de test/démonstration
Interface de test pour valider l'architecture :
- ✅ Création de projets (signaux générés + CSV)
- ✅ Onglets pour basculer entre projets
- ✅ Affichage des informations du projet actif
- ✅ Statistiques globales
- ✅ Log des événements

## 🧪 Test du prototype

### Étape 1 : Ouvrir la page de test
```bash
# Ouvrir project-test.html dans votre navigateur
# Ou avec un serveur local :
python -m http.server 8000
# Puis ouvrir http://localhost:8000/project-test.html
```

### Étape 2 : Créer des projets
1. Cliquez sur **"Créer Signal Généré (50Hz + 180Hz)"**
2. Cliquez sur **"Créer Signal Généré (120Hz)"**
3. Chargez un fichier CSV si disponible

### Étape 3 : Vérifier l'isolation
1. Basculez entre les onglets de projets
2. Vérifiez que les informations changent (curseurs, données, paramètres)
3. Fermez un projet → les autres restent intacts

### Étape 4 : Vérifier les statistiques
- Nombre de projets ouverts
- Points de données totaux
- Durée totale

## 🔍 Avantages de l'architecture POO

### ✅ Isolation complète
```javascript
const p1 = new Project("Projet 1");
p1.state.cursorStart = 1.0;
p1.state.cursorEnd = 2.0;

const p2 = new Project("Projet 2");
p2.state.cursorStart = 5.0;
p2.state.cursorEnd = 8.0;

// p1 et p2 sont TOTALEMENT isolés
// Modifier p1 n'affecte PAS p2
```

### ✅ Gestion de la mémoire
```javascript
// Fermer un projet libère automatiquement sa mémoire
manager.deleteProject(projectId);
// → project.destroy() est appelé
// → Charts détruits, tableaux libérés, DOM nettoyé
```

### ✅ Scalabilité
```javascript
// Gérer facilement 10+ projets
for (let i = 0; i < 10; i++) {
    manager.createProjectFromGenerator({ fs: 1000, duration: 5 });
}

// Pas de ralentissement ni de mélange de données
```

### ✅ Événements
```javascript
manager.on('projectCreated', (project) => {
    console.log(`Nouveau projet : ${project.name}`);
    updateUI();
});

manager.on('projectSwitched', (project) => {
    console.log(`Basculé vers : ${project.name}`);
    loadCharts(project);
});
```

## 📊 Comparaison avec l'architecture actuelle

| Critère | Architecture actuelle | Architecture POO |
|---------|----------------------|------------------|
| **Projets multiples** | ❌ Impossible | ✅ Illimité |
| **Isolation des données** | ❌ État global unique | ✅ État par projet |
| **Risque de mélange** | ❌ Très élevé | ✅ Aucun |
| **Gestion mémoire** | ⚠️ Manuelle | ✅ Automatique |
| **Maintenabilité** | ⚠️ Difficile | ✅ Facile |
| **Testabilité** | ❌ Difficile | ✅ Facile |

## 🚀 Prochaines étapes

### Phase 1 : Prototype validé ✅
- [x] Créer classe `Project`
- [x] Créer classe `ProjectManager`
- [x] Page de test fonctionnelle
- [x] Tester isolation des données

### Phase 2 : Intégration avec les graphiques
- [ ] Migrer `initCharts()` dans `Project.initCharts()`
- [ ] Créer des conteneurs DOM isolés par projet
- [ ] Tester les graphiques multi-projets

### Phase 3 : Migration des fonctions
- [ ] Migrer `generateSignal()` → `Project.generateSignal()`
- [ ] Migrer `loadCSV()` → `Project.loadCSV()`
- [ ] Migrer `updateTimeChart()` → `Project.updateTimeChart()`
- [ ] Migrer `performAnalysis()` → `Project.performAnalysis()`
- [ ] etc.

### Phase 4 : Interface utilisateur
- [ ] Ajouter onglets dans `index.html`
- [ ] Bouton "Nouveau projet"
- [ ] Bouton "Fermer projet"
- [ ] Renommer les projets

### Phase 5 : Migration complète
- [ ] Remplacer `appState` global par `manager.getActive().state`
- [ ] Supprimer l'ancien code global
- [ ] Tests complets

## 💡 Conseils pour la migration

### 1. Migrer progressivement
```javascript
// AVANT (global)
function generateSignal() {
    appState.fullDataTime = ...;
}

// APRÈS (POO)
class Project {
    generateSignal() {
        this.state.fullDataTime = ...;
    }
}

// COMPATIBILITÉ TEMPORAIRE
function generateSignal() {
    const project = manager.getActive();
    if (project) {
        project.generateSignal();
    }
}
```

### 2. Garder la compatibilité
```javascript
// Alias pour compatibilité avec l'ancien code
window.appState = manager.getActive()?.state || {};

// L'ancien code continue de fonctionner pendant la migration
```

### 3. Tester chaque étape
Après chaque migration, vérifier que :
- ✅ L'ancien code fonctionne encore
- ✅ Le nouveau code fonctionne
- ✅ Pas de régression

## 📚 Ressources

### Documentation JavaScript POO
- [Classes MDN](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Classes)
- [Map MDN](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [Garbage Collection](https://developer.mozilla.org/fr/docs/Web/JavaScript/Memory_Management)

### Patterns de conception
- **Factory Pattern** : `createProjectFromCSV()`, `createProjectFromGenerator()`
- **Singleton Pattern** : `ProjectManager` (une seule instance)
- **Observer Pattern** : Système d'événements `on()`, `off()`, `_emit()`

## ❓ Questions / Support

Pour toute question sur l'architecture :
1. Consultez le code source des classes (bien commenté)
2. Testez avec `project-test.html`
3. Regardez les exemples d'utilisation dans ce README

---

**Version** : 1.0
**Date** : 2025-12-28
**Auteur** : Claude (Anthropic)
**Statut** : ✅ Prototype fonctionnel - Prêt pour tests
