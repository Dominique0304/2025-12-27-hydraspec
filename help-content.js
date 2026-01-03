// =====================================================
// SYSTÈME D'AIDE COMPLET - HydraSpec Pro
// Contenu multilingue : Français, English, Deutsch
// =====================================================

const helpContent = {
    fr: {
        title: "Aide & Détails Techniques - HydraSpec Pro",
        navigation: {
            title: "Navigation Rapide:",
            sections: [
                { id: "getting-started", label: "Démarrage" },
                { id: "file-operations", label: "Fichiers" },
                { id: "temporal", label: "Temporel" },
                { id: "frequency", label: "Fréquentiel" },
                { id: "spectrogram", label: "Spectrogramme" },
                { id: "measure-tools", label: "Mesures" },
                { id: "annotations", label: "Annotations" },
                { id: "navigation-zoom", label: "Navigation" },
                { id: "channels", label: "Canaux" },
                { id: "config", label: "Configuration" },
                { id: "shortcuts", label: "Raccourcis" },
                { id: "tips", label: "Astuces" }
            ]
        },
        sections: {
            gettingStarted: {
                title: "🚀 Démarrage Rapide",
                content: `
                    <p><strong>HydraSpec Pro</strong> est un outil professionnel d'analyse de signaux temporels multi-canaux avec transformée de Fourier, spectrogramme STFT et outils de mesure interactifs.</p>

                    <h5>Premiers Pas</h5>
                    <ol>
                        <li><strong>Charger des données :</strong> Cliquez sur "Fichier" → "Charger CSV" pour importer vos données</li>
                        <li><strong>Visualiser :</strong> Le signal apparaît automatiquement dans le graphique temporel</li>
                        <li><strong>Analyser :</strong> Utilisez les curseurs verts/rouges pour sélectionner une zone</li>
                        <li><strong>Explorer :</strong> Activez FFT (Ctrl+2) ou Spectrogramme (Ctrl+3) pour l'analyse fréquentielle</li>
                    </ol>

                    <h5>Format des Fichiers CSV</h5>
                    <ul>
                        <li><strong>Séparateurs acceptés :</strong> virgule (,), point-virgule (;), tabulation</li>
                        <li><strong>Première colonne :</strong> Temps en secondes</li>
                        <li><strong>Colonnes suivantes :</strong> Canaux de mesure (pression, vibration, etc.)</li>
                        <li><strong>En-têtes :</strong> Optionnels, avec unités entre [crochets] ou (parenthèses)</li>
                        <li><strong>Exemple :</strong><br>
                            <code>Time[s];Pressure[Pa];Vibration[m/s²]<br>
                            0.000;101325.5;0.012<br>
                            0.001;101326.1;0.015</code>
                        </li>
                    </ul>

                    <h5>Interface Principale</h5>
                    <ul>
                        <li><strong>Barre supérieure :</strong> Menu Fichier, Graphiques, Paramètres, Aide</li>
                        <li><strong>Panneau latéral (gauche) :</strong> Outils et paramètres organisés en accordéons</li>
                        <li><strong>Zone centrale :</strong> Graphiques (Temporel, Fréquentiel, Spectrogramme)</li>
                        <li><strong>Barre d'état (bas) :</strong> Messages et notifications</li>
                    </ul>
                `
            },
            fileOperations: {
                title: "📁 Opérations sur les Fichiers",
                content: `
                    <h5>Importation CSV</h5>
                    <p><strong>Fichier → Charger CSV</strong></p>
                    <ul>
                        <li>Formats supportés : CSV avec séparateurs variés (auto-détection)</li>
                        <li>Conversion automatique temps → millisecondes</li>
                        <li>Calcul de la fréquence d'échantillonnage (Fs) depuis les incréments temporels</li>
                        <li>Détection automatique des unités dans les en-têtes</li>
                    </ul>

                    <h5>Projets HSP (Format Natif)</h5>
                    <p><strong>Format propriétaire pour sauvegardes complètes</strong></p>
                    <ul>
                        <li><strong>Sauvegarder HSP :</strong> Fichier → Sauvegarder HSP (Ctrl+S si modifié)</li>
                        <li><strong>Sauvegarder sous :</strong> Fichier → Sauvegarder HSP sous...</li>
                        <li><strong>Ouvrir HSP :</strong> Fichier → Ouvrir HSP</li>
                        <li><strong>Exporter CSV vers HSP :</strong> Fichier → Exporter vers HSP</li>
                    </ul>

                    <h5>Contenu Sauvegardé (HSP)</h5>
                    <ul>
                        <li>✓ Toutes les données temporelles (tous canaux)</li>
                        <li>✓ Configuration des canaux (couleurs, axes, visibilité, FFT)</li>
                        <li>✓ Paramètres FFT et Spectrogramme</li>
                        <li>✓ Tous les outils actifs (Mesure, Règle, Traquer)</li>
                        <li>✓ Toutes les annotations (Marqueurs, Intervalles, Diff/Canal)</li>
                        <li>✓ Canaux calculés (formules)</li>
                        <li>✓ Canaux lissés (paramètres)</li>
                        <li>✓ Vues sauvegardées (snapshots d'état)</li>
                        <li>✓ Historique Annuler/Rétablir</li>
                        <li>✓ Zoom et curseurs</li>
                    </ul>

                    <h5>Exportations</h5>
                    <ul>
                        <li><strong>Exporter PNG :</strong> Capture d'écran du graphique actif</li>
                        <li><strong>Exporter CSV :</strong> Données temporelles au format texte</li>
                        <li><strong>Exporter Spectrogramme :</strong> Résultats STFT (Temps, Fréquence, Amplitude)</li>
                        <li><strong>Exporter PDF :</strong> Rapport d'analyse avec graphiques et statistiques</li>
                    </ul>
                `
            },
            temporal: {
                title: "⏱️ Analyse Temporelle",
                content: `
                    <p>Le domaine temporel affiche l'évolution du signal en fonction du temps. C'est le point de départ de toute analyse.</p>

                    <h5>Curseurs de Sélection</h5>
                    <ul>
                        <li><strong>Curseur Vert (Début) :</strong> Définir le début de la zone d'analyse</li>
                        <li><strong>Curseur Rouge (Fin) :</strong> Définir la fin de la zone d'analyse</li>
                        <li><strong>Déplacement :</strong> Cliquer-glisser sur un curseur pour le déplacer</li>
                        <li><strong>Déplacement groupé :</strong> Shift + cliquer entre les curseurs pour les déplacer ensemble</li>
                    </ul>

                    <h5>Zoom et Navigation</h5>
                    <ul>
                        <li><strong>Molette souris :</strong> Zoom X et Y simultané</li>
                        <li><strong>Shift + Molette :</strong> Zoom vertical (Y) seulement</li>
                        <li><strong>Ctrl + Molette :</strong> Zoom horizontal (X) seulement</li>
                        <li><strong>Pan :</strong> Cliquer-glisser hors des curseurs pour naviguer</li>
                        <li><strong>Zoom manuel :</strong> Utiliser les champs "Min/Max (s)" pour un zoom précis</li>
                    </ul>

                    <h5>Statistiques (Zone Sélectionnée)</h5>
                    <ul>
                        <li><strong>Min/Max :</strong> Valeurs extrêmes du signal</li>
                        <li><strong>Moyenne :</strong> Valeur moyenne arithmétique</li>
                        <li><strong>Écart-type :</strong> Dispersion des valeurs autour de la moyenne</li>
                        <li><strong>RMS :</strong> Valeur efficace (Root Mean Square)</li>
                        <li><strong>Durée :</strong> Temps écoulé entre les curseurs</li>
                    </ul>

                    <h5>Multi-Canaux</h5>
                    <ul>
                        <li>Affichage simultané de plusieurs signaux</li>
                        <li>Axes Y multiples (gauche et droite)</li>
                        <li>Couleurs personnalisables par canal</li>
                        <li>Épaisseur de ligne ajustable (0.5 à 5.0 px)</li>
                        <li>Visibilité individuelle par canal</li>
                    </ul>

                    <h5>Raccourci Clavier</h5>
                    <p><kbd>Ctrl+1</kbd> - Basculer l'affichage du domaine temporel</p>
                `
            },
            frequency: {
                title: "📊 Analyse Fréquentielle (FFT)",
                content: `
                    <p>La Transformée de Fourier Rapide (FFT) révèle le contenu fréquentiel de votre signal.</p>

                    <h5>Paramètres FFT</h5>
                    <ul>
                        <li><strong>Fenêtre :</strong>
                            <ul>
                                <li><strong>Rectangulaire :</strong> Pour transitoires démarrant/finissant à zéro</li>
                                <li><strong>Hanning (recommandé) :</strong> Standard industriel pour analyse vibratoire</li>
                                <li><strong>Hamming :</strong> Meilleure séparation des fréquences proches</li>
                                <li><strong>Blackman :</strong> Meilleure précision d'amplitude</li>
                            </ul>
                        </li>
                        <li><strong>Points FFT :</strong> Définit la résolution fréquentielle
                            <ul>
                                <li>Résolution = Fs / N (ex: 1000Hz/4096pts = 0,24Hz)</li>
                                <li>Plus de points = meilleure résolution mais calcul plus long</li>
                            </ul>
                        </li>
                        <li><strong>Sensibilité Pics :</strong> Ajuste le seuil de détection des pics (échelle logarithmique)</li>
                    </ul>

                    <h5>Interprétation du Spectre</h5>
                    <ul>
                        <li><strong>Fréquence Dominante :</strong> Pic le plus important du spectre</li>
                        <li><strong>Amplitude Max :</strong> Amplitude du pic dominant</li>
                        <li><strong>Pics Secondaires :</strong> Harmoniques ou composantes supplémentaires</li>
                        <li><strong>Bruit de Fond :</strong> Niveau de base entre les pics</li>
                    </ul>

                    <h5>Sélection des Canaux</h5>
                    <ul>
                        <li>Choix du canal à analyser</li>
                        <li>FFT individuelle ou superposée pour plusieurs canaux</li>
                        <li>Configuration par canal dans "Configuration Multi-Canaux"</li>
                    </ul>

                    <h5>Raccourci Clavier</h5>
                    <p><kbd>Ctrl+2</kbd> - Basculer l'affichage du domaine fréquentiel</p>
                `
            },
            spectrogram: {
                title: "🎨 Spectrogramme (STFT)",
                content: `
                    <p>Le spectrogramme montre l'évolution des fréquences dans le temps (Short-Time Fourier Transform).</p>

                    <h5>Paramètres STFT</h5>
                    <ul>
                        <li><strong>Fenêtre STFT :</strong> Taille de chaque segment analysé
                            <ul>
                                <li>Petite fenêtre = Bonne résolution temporelle, mauvaise résolution fréquentielle</li>
                                <li>Grande fenêtre = Bonne résolution fréquentielle, mauvaise résolution temporelle</li>
                            </ul>
                        </li>
                        <li><strong>Chevauchement :</strong> Pourcentage de recouvrement entre fenêtres
                            <ul>
                                <li>50-75% recommandé pour visualisation lisse</li>
                                <li>Plus de chevauchement = image plus détaillée mais calcul plus long</li>
                            </ul>
                        </li>
                        <li><strong>Échelle :</strong>
                            <ul>
                                <li><strong>Linéaire :</strong> Représentation directe des amplitudes</li>
                                <li><strong>Logarithmique :</strong> Meilleure plage dynamique pour signaux faibles</li>
                                <li><strong>dB :</strong> Échelle décibel pour analyse acoustique</li>
                            </ul>
                        </li>
                        <li><strong>Fréquence Max :</strong> Limite l'affichage aux basses fréquences</li>
                    </ul>

                    <h5>Carte de Couleurs</h5>
                    <ul>
                        <li><strong>Bleu :</strong> Amplitude faible</li>
                        <li><strong>Cyan :</strong> Amplitude moyenne-faible</li>
                        <li><strong>Vert :</strong> Amplitude moyenne</li>
                        <li><strong>Jaune :</strong> Amplitude moyenne-forte</li>
                        <li><strong>Rouge :</strong> Amplitude forte</li>
                    </ul>

                    <h5>Applications Typiques</h5>
                    <ul>
                        <li><strong>Transitoires :</strong> Chocs, impacts, démarrages</li>
                        <li><strong>Modulations :</strong> Variations de fréquence dans le temps</li>
                        <li><strong>Changements de Régime :</strong> Évolution vibratoire de machines</li>
                        <li><strong>Analyse Parole :</strong> Formants et phonèmes</li>
                    </ul>

                    <h5>Exportation</h5>
                    <p>Fichier → Exporter Spectrogramme : Format texte (Temps, Fréquence, Amplitude)</p>

                    <h5>Raccourci Clavier</h5>
                    <p><kbd>Ctrl+3</kbd> - Basculer l'affichage du spectrogramme</p>
                `
            },
            measureTools: {
                title: "📐 Outils de Mesure",
                content: `
                    <h5>Outil Mesure (Δ Différence)</h5>
                    <p><strong>Raccourci :</strong> <kbd>M</kbd></p>
                    <ul>
                        <li><strong>Fonction :</strong> Mesurer les différences entre deux points</li>
                        <li><strong>Utilisation :</strong>
                            <ol>
                                <li>Activer l'outil (bouton ou touche M)</li>
                                <li>Cliquer sur le graphique pour placer le Point 1 (rouge)</li>
                                <li>Cliquer à nouveau pour placer le Point 2 (cyan)</li>
                            </ol>
                        </li>
                        <li><strong>Résultats affichés :</strong>
                            <ul>
                                <li><strong>ΔX (Δt) :</strong> Différence temporelle (auto-formatée en ms ou s)</li>
                                <li><strong>ΔY :</strong> Différence de valeur (avec unité du canal)</li>
                            </ul>
                        </li>
                        <li><strong>Fonctions avancées :</strong>
                            <ul>
                                <li>Déplacer un point : Cliquer près d'un point et glisser</li>
                                <li>Ligne de référence : Ligne jaune reliant les points</li>
                                <li>Annotations axes : Projections ΔX et ΔY sur tous les axes visibles</li>
                            </ul>
                        </li>
                        <li><strong>Effacer :</strong> Bouton "Effacer" dans le panneau Mesure</li>
                    </ul>

                    <h5>Outil Règle (Point Unique)</h5>
                    <p><strong>Raccourci :</strong> <kbd>R</kbd></p>
                    <ul>
                        <li><strong>Fonction :</strong> Mesurer les coordonnées d'un point unique</li>
                        <li><strong>Utilisation :</strong>
                            <ol>
                                <li>Activer l'outil (bouton ou touche R)</li>
                                <li>Cliquer sur le graphique pour placer le point de mesure</li>
                            </ol>
                        </li>
                        <li><strong>Affichage :</strong>
                            <ul>
                                <li><strong>X (Temps) :</strong> En secondes ou millisecondes</li>
                                <li><strong>Y (Valeur) :</strong> Avec unité, pour tous les axes Y visibles</li>
                            </ul>
                        </li>
                        <li><strong>Point visuel :</strong> Cercle cyan avec croix de référence</li>
                        <li><strong>Déplacer :</strong> Cliquer et glisser le point</li>
                        <li><strong>Effacer :</strong> Bouton "Effacer" dans le panneau Règle</li>
                    </ul>

                    <h5>Outil Traquer (Suivi Multi-Canaux)</h5>
                    <p><strong>Raccourci :</strong> <kbd>T</kbd></p>
                    <ul>
                        <li><strong>Fonction :</strong> Suivre les valeurs de tous les canaux à un instant donné</li>
                        <li><strong>Modes de fonctionnement :</strong>
                            <ul>
                                <li><strong>Suivi libre :</strong> Le curseur suit la souris</li>
                                <li><strong>Verrouillé :</strong> Cliquer pour fixer la position</li>
                                <li><strong>Déplaçable :</strong> Glisser le curseur verrouillé</li>
                            </ul>
                        </li>
                        <li><strong>Affichage :</strong>
                            <ul>
                                <li>Ligne verticale bleue pointillée</li>
                                <li>Annotations par canal avec valeurs interpolées</li>
                                <li>Couleurs correspondant aux couleurs des canaux</li>
                            </ul>
                        </li>
                        <li><strong>Interpolation :</strong> Calcul des valeurs entre les points de mesure</li>
                        <li><strong>Effacer :</strong> Bouton "Effacer" dans le panneau Traquer</li>
                    </ul>
                `
            },
            annotations: {
                title: "🏷️ Outils d'Annotation",
                content: `
                    <h5>Marqueurs (SnapPoints)</h5>
                    <ul>
                        <li><strong>Fonction :</strong> Marquer des points spécifiques avec annotations et flèches</li>
                        <li><strong>Création :</strong>
                            <ol>
                                <li>Activer l'outil Marqueur</li>
                                <li>Cliquer sur le graphique pour placer un point</li>
                                <li>Le marqueur s'accroche au canal sélectionné</li>
                            </ol>
                        </li>
                        <li><strong>Propriétés :</strong>
                            <ul>
                                <li>Commentaire avec balises dynamiques (C$, X$, Y$)</li>
                                <li>Position de la boîte ajustable (offsetX, offsetY)</li>
                                <li>Couleurs personnalisables (point, arrière-plan)</li>
                                <li>Style de texte (police, gras, italique, souligné)</li>
                                <li>Alignement (gauche, centre, droite / haut, milieu, bas)</li>
                                <li>Flèche optionnelle avec extrémité déplaçable</li>
                            </ul>
                        </li>
                        <li><strong>Balises Commentaire :</strong>
                            <ul>
                                <li><strong>C$ :</strong> Nom du canal</li>
                                <li><strong>X$ :</strong> Valeur temporelle</li>
                                <li><strong>Y$ :</strong> Valeur Y</li>
                            </ul>
                        </li>
                        <li><strong>Accrochage :</strong> Possibilité d'accrocher à un canal pour suivre les déplacements</li>
                        <li><strong>Gestion :</strong>
                            <ul>
                                <li>Afficher/Masquer (icône œil)</li>
                                <li>Éditer (icône stylo)</li>
                                <li>Supprimer (icône poubelle)</li>
                                <li>Dupliquer</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Intervalles (Plages Temporelles)</h5>
                    <ul>
                        <li><strong>Fonction :</strong> Marquer et annoter des plages de temps</li>
                        <li><strong>Création :</strong>
                            <ol>
                                <li>Activer l'outil Interval</li>
                                <li>Cliquer-glisser pour définir la plage</li>
                            </ol>
                        </li>
                        <li><strong>Propriétés :</strong>
                            <ul>
                                <li>Commentaire libre</li>
                                <li>Position verticale ajustable (0-1 = bas-haut)</li>
                                <li>Couleur personnalisable</li>
                                <li>Style de texte (police, formatage)</li>
                            </ul>
                        </li>
                        <li><strong>Interactions :</strong>
                            <ul>
                                <li>Déplacer les bords (début/fin)</li>
                                <li>Déplacer la hauteur (haut/bas)</li>
                                <li>Ligne verticale pointillée à chaque extrémité</li>
                            </ul>
                        </li>
                        <li><strong>Gestion :</strong> Même que pour Marqueurs (Afficher, Éditer, Supprimer)</li>
                    </ul>

                    <h5>Diff/Canal (Mesure par Canal)</h5>
                    <ul>
                        <li><strong>Fonction :</strong> Mesurer les différences au sein d'un canal spécifique</li>
                        <li><strong>Création :</strong>
                            <ol>
                                <li>Activer l'outil Diff/Canal</li>
                                <li>Sélectionner le canal cible</li>
                                <li>Cliquer pour placer le Point 1</li>
                                <li>Cliquer pour placer le Point 2</li>
                            </ol>
                        </li>
                        <li><strong>Calculs affichés :</strong>
                            <ul>
                                <li><strong>ΔX (temps) :</strong> Différence temporelle</li>
                                <li><strong>ΔY (valeur) :</strong> Différence de valeur</li>
                                <li><strong>Pente :</strong> ΔY/ΔX (unité/seconde)</li>
                            </ul>
                        </li>
                        <li><strong>Affichage :</strong>
                            <ul>
                                <li>Points dans la couleur du canal</li>
                                <li>Ligne diagonale reliant les points</li>
                                <li>Trois annotations (ΔX horizontal, ΔY vertical, Pente diagonal)</li>
                            </ul>
                        </li>
                        <li><strong>Déplacement :</strong> Glisser les points ou les annotations</li>
                        <li><strong>Gestion :</strong> Liste par canal avec bouton Supprimer</li>
                    </ul>

                    <h5>Annotations Texte</h5>
                    <p><strong>Raccourci :</strong> <kbd>A</kbd></p>
                    <ul>
                        <li><strong>Fonction :</strong> Ajouter des notes texte libres sur le graphique</li>
                        <li><strong>Création :</strong> Mode Annotation → Cliquer pour placer</li>
                        <li><strong>Propriétés :</strong> Texte HTML, position, style</li>
                    </ul>
                `
            },
            navigationZoom: {
                title: "🧭 Navigation et Zoom",
                content: `
                    <h5>Outil Pan (Navigation)</h5>
                    <p><strong>Raccourci :</strong> <kbd>P</kbd></p>
                    <ul>
                        <li><strong>Modes de Pan :</strong>
                            <ul>
                                <li><strong>Libre :</strong> Déplacement dans toutes les directions</li>
                                <li><strong>Horizontal :</strong> Déplacement X uniquement</li>
                                <li><strong>Vertical :</strong> Déplacement Y uniquement</li>
                                <li><strong>Y=0 :</strong> Centrer sur zéro vertical</li>
                            </ul>
                        </li>
                        <li><strong>Utilisation :</strong> Cliquer-glisser sur le graphique pour se déplacer</li>
                    </ul>

                    <h5>Modes de Zoom</h5>
                    <ul>
                        <li><strong>Zoom Grille :</strong> Zoom X et Y simultanés (molette souris)</li>
                        <li><strong>Zoom Horizontal :</strong> Zoom X uniquement (Ctrl+Molette)</li>
                        <li><strong>Zoom Vertical :</strong> Zoom Y uniquement (Shift+Molette)</li>
                    </ul>

                    <h5>Zoom Manuel</h5>
                    <ul>
                        <li><strong>Champs Temporels :</strong>
                            <ul>
                                <li><strong>T min :</strong> Temps de début en secondes</li>
                                <li><strong>T max :</strong> Temps de fin en secondes</li>
                            </ul>
                        </li>
                        <li><strong>Axes Y :</strong>
                            <ul>
                                <li>Configuration par canal dans "Configuration Multi-Canaux"</li>
                                <li>Min/Max personnalisés ou Auto</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Réinitialisation du Zoom</h5>
                    <ul>
                        <li><strong>Bouton Reset :</strong> Réinitialiser la vue actuelle</li>
                        <li><strong>Ctrl+O :</strong> Réinitialiser tous les graphiques</li>
                    </ul>

                    <h5>Vues Sauvegardées</h5>
                    <ul>
                        <li><strong>Fonction :</strong> Capturer et restaurer l'état complet du graphique</li>
                        <li><strong>Créer une Vue :</strong>
                            <ol>
                                <li>Ajuster le zoom et les canaux visibles</li>
                                <li>Cliquer sur "Créer une vue"</li>
                                <li>Nommer la vue</li>
                            </ol>
                        </li>
                        <li><strong>État capturé :</strong>
                            <ul>
                                <li>Zoom X et Y</li>
                                <li>Canal actif</li>
                                <li>Visibilité de chaque canal</li>
                                <li>Visibilité des marqueurs, intervalles, diff/canal</li>
                            </ul>
                        </li>
                        <li><strong>Restaurer :</strong> Cliquer sur une vue dans la liste</li>
                        <li><strong>Gestion :</strong> Modifier nom, Supprimer</li>
                        <li><strong>Persistance :</strong> Sauvegardées dans localStorage et fichiers HSP</li>
                    </ul>
                `
            },
            channels: {
                title: "📊 Gestion des Canaux",
                content: `
                    <h5>Configuration Multi-Canaux</h5>
                    <p><strong>Bouton :</strong> GRAPHIQUES → Configuration Multi-Canaux</p>
                    <ul>
                        <li><strong>Propriétés par Canal :</strong>
                            <ul>
                                <li><strong>Nom/Étiquette :</strong> Nom d'affichage</li>
                                <li><strong>Unité :</strong> Unité de mesure (Pa, m/s², etc.)</li>
                                <li><strong>Couleur :</strong> Couleur de traçage (sélecteur avancé)</li>
                                <li><strong>Épaisseur :</strong> Largeur de ligne (0.5 à 5.0 px)</li>
                                <li><strong>Position Axe Y :</strong> Gauche (L) ou Droite (R)</li>
                                <li><strong>Min/Max Y :</strong> Limites personnalisées ou Auto</li>
                                <li><strong>FFT :</strong> Activer l'analyse FFT pour ce canal</li>
                                <li><strong>Visible :</strong> Afficher/Masquer</li>
                            </ul>
                        </li>
                        <li><strong>Axes Multiples :</strong> Nombre illimité d'axes Y (gauche et droite)</li>
                    </ul>

                    <h5>Vue Rapide Canal</h5>
                    <p><strong>Accordéon :</strong> Canal</p>
                    <ul>
                        <li><strong>Liste des Canaux :</strong>
                            <ul>
                                <li>Nom (cliquer pour basculer visibilité)</li>
                                <li>Icône œil (visible/masqué)</li>
                                <li>Cases L/R (axe gauche/droite)</li>
                                <li>Case FFT (analyse activée)</li>
                                <li>Indicateur de couleur</li>
                            </ul>
                        </li>
                        <li><strong>Accès Rapide :</strong> Modifier visibilité et axe sans ouvrir la configuration</li>
                    </ul>

                    <h5>Canaux Calculés</h5>
                    <p><strong>Accordéon :</strong> Canal Calculé</p>
                    <ul>
                        <li><strong>Fonction :</strong> Créer des canaux virtuels à partir de formules mathématiques</li>
                        <li><strong>Syntaxe de Formule :</strong>
                            <ul>
                                <li><strong>Références canaux :</strong> S1, S2, S3... (insensible à la casse)</li>
                                <li><strong>Opérateurs :</strong> +, -, *, /, ^ (puissance), % (modulo)</li>
                                <li><strong>Fonctions :</strong> sqrt, sqr, ln, log, abs, sin, cos, tan, asin, acos, atan</li>
                                <li><strong>Constantes :</strong> Pi, e</li>
                            </ul>
                        </li>
                        <li><strong>Exemples :</strong>
                            <ul>
                                <li><code>sqrt(S1^2 + S2^2)</code> - Magnitude</li>
                                <li><code>(S1 + S2) / 2</code> - Moyenne de deux canaux</li>
                                <li><code>S1 - S2</code> - Différence</li>
                                <li><code>abs(S1)</code> - Valeur absolue</li>
                            </ul>
                        </li>
                        <li><strong>Propriétés :</strong>
                            <ul>
                                <li>Nom personnalisé</li>
                                <li>Couleur</li>
                                <li>Visibilité</li>
                            </ul>
                        </li>
                        <li><strong>Gestion :</strong> Liste avec boutons Modifier/Supprimer</li>
                    </ul>

                    <h5>Lissage de Canal (Filtre)</h5>
                    <p><strong>Accordéon :</strong> Lissage de Canal</p>
                    <ul>
                        <li><strong>Fonction :</strong> Appliquer un filtre moyenneur mobile</li>
                        <li><strong>Paramètres :</strong>
                            <ul>
                                <li><strong>Canal source :</strong> Canal à lisser</li>
                                <li><strong>Taille fenêtre :</strong> Nombre de points (1-100)</li>
                                <li><strong>Nom :</strong> Nom du canal lissé</li>
                                <li><strong>Couleur :</strong> Couleur de traçage</li>
                            </ul>
                        </li>
                        <li><strong>Algorithme :</strong> Moyenne mobile centrée</li>
                        <li><strong>Aperçu :</strong> Ajustement temps réel avec le curseur</li>
                        <li><strong>Gestion :</strong> Liste avec boutons Modifier/Supprimer</li>
                    </ul>
                `
            },
            config: {
                title: "⚙️ Configuration et Personnalisation",
                content: `
                    <h5>Paramètres Généraux</h5>
                    <p><strong>Menu :</strong> PARAMÈTRES (⚙️)</p>
                    <ul>
                        <li><strong>Langue :</strong> Français, English, Deutsch</li>
                        <li><strong>Thème :</strong>
                            <ul>
                                <li>Clair (Light)</li>
                                <li>Steampunk</li>
                                <li>Steampunk2 (Industriel)</li>
                            </ul>
                        </li>
                        <li><strong>Taille Police :</strong> Taille de texte dans les graphiques (8-24px)</li>
                        <li><strong>Halo de Souris :</strong> Indicateur visuel de position (Activé/Désactivé)</li>
                        <li><strong>Info au Survol :</strong> Bulles d'information (tooltips) sur les graphiques</li>
                    </ul>

                    <h5>Halo de Souris</h5>
                    <ul>
                        <li><strong>Fonction :</strong> Anneau coloré suivant la souris</li>
                        <li><strong>États :</strong>
                            <ul>
                                <li><strong>Taille normale :</strong> Navigation libre (50px)</li>
                                <li><strong>Réduit :</strong> Shift ou Ctrl pressé (25px)</li>
                                <li><strong>Près curseur :</strong> Zone magnétique près d'un élément (20px)</li>
                                <li><strong>Clic :</strong> Pendant le clic (15px, rouge)</li>
                            </ul>
                        </li>
                        <li><strong>Couleurs :</strong>
                            <ul>
                                <li>Bleu : Mode normal</li>
                                <li>Vert : Shift pressé</li>
                                <li>Jaune : Ctrl pressé</li>
                                <li>Rouge : Clic ou glissement</li>
                            </ul>
                        </li>
                        <li><strong>Disparition :</strong> Masqué quand une modale est ouverte</li>
                    </ul>

                    <h5>Presets (Modèles de Configuration)</h5>
                    <p><strong>Accordéon :</strong> Presets</p>
                    <ul>
                        <li><strong>Presets Intégrés :</strong>
                            <ul>
                                <li><strong>Analyse Vibration :</strong> Hanning 4096, STFT 1024 @ 75%</li>
                                <li><strong>Surveillance Acoustique :</strong> Blackman 8192, STFT 2048 @ 90%</li>
                                <li><strong>Analyse Pression :</strong> Hamming 2048, STFT 512 @ 50%</li>
                                <li><strong>Qualité Audio :</strong> Blackman 16384, STFT 2048 @ 90%</li>
                            </ul>
                        </li>
                        <li><strong>Presets Personnalisés :</strong>
                            <ul>
                                <li>Sauvegarder configuration actuelle (FFT + Spectrogramme)</li>
                                <li>Nommer et stocker</li>
                                <li>Charger pour réutiliser</li>
                                <li>Supprimer</li>
                            </ul>
                        </li>
                        <li><strong>Contenu Sauvegardé :</strong>
                            <ul>
                                <li>Paramètres FFT (fenêtre, points, seuil)</li>
                                <li>Paramètres Spectrogramme (fenêtre, chevauchement, échelle, freq max)</li>
                                <li>Configuration canaux (visibilité, axes, FFT)</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Sélecteur de Couleur Avancé</h5>
                    <ul>
                        <li><strong>Onglet Sélecteur :</strong>
                            <ul>
                                <li>Saisie hexadécimale (#RRGGBB)</li>
                                <li>Curseurs RGB (Rouge, Vert, Bleu)</li>
                                <li>Aperçu temps réel</li>
                            </ul>
                        </li>
                        <li><strong>Onglet Palettes :</strong>
                            <ul>
                                <li>Couleurs prédéfinies</li>
                                <li>Historique des couleurs récentes</li>
                            </ul>
                        </li>
                        <li><strong>Bouton OK :</strong> Valider la sélection</li>
                    </ul>
                `
            },
            shortcuts: {
                title: "⌨️ Raccourcis Clavier",
                content: `
                    <h5>Affichage</h5>
                    <ul>
                        <li><kbd>Ctrl+1</kbd> - Basculer Domaine Temporel</li>
                        <li><kbd>Ctrl+2</kbd> - Basculer Domaine Fréquentiel</li>
                        <li><kbd>Ctrl+3</kbd> - Basculer Spectrogramme</li>
                    </ul>

                    <h5>Outils de Mesure</h5>
                    <ul>
                        <li><kbd>M</kbd> - Activer/Désactiver Outil Mesure</li>
                        <li><kbd>R</kbd> - Activer/Désactiver Outil Règle</li>
                        <li><kbd>T</kbd> - Activer/Désactiver Outil Traquer</li>
                        <li><kbd>P</kbd> - Activer/Désactiver Outil Pan</li>
                        <li><kbd>A</kbd> - Activer/Désactiver Mode Annotation</li>
                    </ul>

                    <h5>Navigation et Zoom</h5>
                    <ul>
                        <li><kbd>Molette</kbd> - Zoom X+Y simultané</li>
                        <li><kbd>Shift+Molette</kbd> - Zoom vertical (Y) seulement</li>
                        <li><kbd>Ctrl+Molette</kbd> - Zoom horizontal (X) seulement</li>
                        <li><kbd>Ctrl+O</kbd> - Réinitialiser zoom (tous graphiques)</li>
                    </ul>

                    <h5>Historique</h5>
                    <ul>
                        <li><kbd>Ctrl+Z</kbd> - Annuler</li>
                        <li><kbd>Ctrl+Y</kbd> - Rétablir</li>
                    </ul>

                    <h5>Aide</h5>
                    <ul>
                        <li><kbd>H</kbd> - Afficher l'aide des raccourcis clavier</li>
                        <li><kbd>Esc</kbd> - Désactiver tous les outils</li>
                    </ul>

                    <h5>Curseurs de Sélection</h5>
                    <ul>
                        <li><strong>Cliquer-glisser curseur :</strong> Déplacer curseur individuel</li>
                        <li><strong>Shift + cliquer entre curseurs :</strong> Déplacer les deux ensemble</li>
                    </ul>

                    <h5>Astuce</h5>
                    <p>Maintenez <kbd>Shift</kbd> ou <kbd>Ctrl</kbd> pour voir le halo changer de couleur et indiquer le mode actif !</p>
                `
            },
            tips: {
                title: "💡 Astuces et Meilleures Pratiques",
                content: `
                    <h5>Optimisation des Performances</h5>
                    <ul>
                        <li><strong>Données volumineuses :</strong>
                            <ul>
                                <li>Utilisez un fichier HSP plutôt que CSV (chargement plus rapide)</li>
                                <li>Désactivez les canaux non utilisés</li>
                                <li>Réduisez les points FFT si pas besoin de haute résolution</li>
                            </ul>
                        </li>
                        <li><strong>Spectrogramme :</strong>
                            <ul>
                                <li>Réduisez le chevauchement pour calcul plus rapide</li>
                                <li>Limitez la fréquence max si analyse basses fréquences</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Analyse Vibratoire</h5>
                    <ul>
                        <li><strong>Choix de fenêtre FFT :</strong>
                            <ul>
                                <li>Vibrations continues : Hanning</li>
                                <li>Impulsions/chocs : Fenêtre rectangulaire</li>
                                <li>Précision amplitude : Blackman</li>
                            </ul>
                        </li>
                        <li><strong>Détection harmoniques :</strong>
                            <ul>
                                <li>Augmentez les points FFT (4096 ou 8192)</li>
                                <li>Ajustez la sensibilité pics</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Workflow Recommandé</h5>
                    <ol>
                        <li><strong>Import :</strong> Charger CSV ou HSP</li>
                        <li><strong>Inspection :</strong> Vue temporelle complète (Ctrl+O pour reset zoom)</li>
                        <li><strong>Sélection :</strong> Curseurs vert/rouge sur zone d'intérêt</li>
                        <li><strong>Analyse FFT :</strong> Ctrl+2 pour voir le spectre</li>
                        <li><strong>STFT :</strong> Ctrl+3 pour évolution temporelle</li>
                        <li><strong>Annotations :</strong> Marqueurs et intervalles pour documenter</li>
                        <li><strong>Sauvegarde :</strong> HSP pour conservation complète de l'état</li>
                        <li><strong>Export :</strong> PNG ou PDF pour partage/rapport</li>
                    </ol>

                    <h5>Astuces d'Interface</h5>
                    <ul>
                        <li><strong>Modales draggables :</strong> Cliquer sur le titre pour déplacer Paramètres/Aide</li>
                        <li><strong>Vues rapides :</strong> Créer des snapshots de configurations zoom/canaux fréquemment utilisées</li>
                        <li><strong>Couleurs :</strong> Utiliser des couleurs distinctes pour faciliter la lecture multi-canaux</li>
                        <li><strong>Presets :</strong> Sauvegarder vos configurations FFT/Spectro favorites</li>
                    </ul>

                    <h5>Gestion Multi-Projets</h5>
                    <ul>
                        <li>Chargez plusieurs fichiers simultanément</li>
                        <li>Basculez entre projets via les onglets</li>
                        <li>Chaque projet conserve son propre état</li>
                        <li>Fermez les projets inutilisés pour libérer mémoire</li>
                    </ul>

                    <h5>Formules Calculées Utiles</h5>
                    <ul>
                        <li><strong>Magnitude 2D :</strong> <code>sqrt(S1^2 + S2^2)</code></li>
                        <li><strong>Moyenne :</strong> <code>(S1 + S2 + S3) / 3</code></li>
                        <li><strong>Écart :</strong> <code>S1 - S2</code></li>
                        <li><strong>Ratio :</strong> <code>S1 / S2</code></li>
                        <li><strong>Rectification :</strong> <code>abs(S1)</code></li>
                    </ul>

                    <h5>Exportation PDF</h5>
                    <ul>
                        <li>Inclut graphique temporel avec statistiques</li>
                        <li>Informations projet (nom, date, durée)</li>
                        <li>Notes utilisateur éditables</li>
                        <li>Nom de fichier personnalisable</li>
                    </ul>
                `
            }
        }
    },
    en: {
        title: "Help & Technical Details - HydraSpec Pro",
        navigation: {
            title: "Quick Navigation:",
            sections: [
                { id: "getting-started", label: "Getting Started" },
                { id: "file-operations", label: "Files" },
                { id: "temporal", label: "Time Domain" },
                { id: "frequency", label: "Frequency" },
                { id: "spectrogram", label: "Spectrogram" },
                { id: "measure-tools", label: "Measurements" },
                { id: "annotations", label: "Annotations" },
                { id: "navigation-zoom", label: "Navigation" },
                { id: "channels", label: "Channels" },
                { id: "config", label: "Configuration" },
                { id: "shortcuts", label: "Shortcuts" },
                { id: "tips", label: "Tips" }
            ]
        },
        sections: {
            gettingStarted: {
                title: "🚀 Quick Start",
                content: `
                    <p><strong>HydraSpec Pro</strong> is a professional tool for multi-channel time-series signal analysis with Fourier transform, STFT spectrogram, and interactive measurement tools.</p>

                    <h5>First Steps</h5>
                    <ol>
                        <li><strong>Load data:</strong> Click "File" → "Load CSV" to import your data</li>
                        <li><strong>Visualize:</strong> The signal appears automatically in the time chart</li>
                        <li><strong>Analyze:</strong> Use the green/red cursors to select a zone</li>
                        <li><strong>Explore:</strong> Activate FFT (Ctrl+2) or Spectrogram (Ctrl+3) for frequency analysis</li>
                    </ol>

                    <h5>CSV File Format</h5>
                    <ul>
                        <li><strong>Accepted separators:</strong> comma (,), semicolon (;), tab</li>
                        <li><strong>First column:</strong> Time in seconds</li>
                        <li><strong>Following columns:</strong> Measurement channels (pressure, vibration, etc.)</li>
                        <li><strong>Headers:</strong> Optional, with units in [brackets] or (parentheses)</li>
                        <li><strong>Example:</strong><br>
                            <code>Time[s];Pressure[Pa];Vibration[m/s²]<br>
                            0.000;101325.5;0.012<br>
                            0.001;101326.1;0.015</code>
                        </li>
                    </ul>

                    <h5>Main Interface</h5>
                    <ul>
                        <li><strong>Top bar:</strong> File, Graphics, Settings, Help menus</li>
                        <li><strong>Side panel (left):</strong> Tools and settings organized in accordions</li>
                        <li><strong>Center area:</strong> Charts (Time, Frequency, Spectrogram)</li>
                        <li><strong>Status bar (bottom):</strong> Messages and notifications</li>
                    </ul>
                `
            },
            fileOperations: {
                title: "📁 File Operations",
                content: `
                    <h5>CSV Import</h5>
                    <p><strong>File → Load CSV</strong></p>
                    <ul>
                        <li>Supported formats: CSV with various separators (auto-detection)</li>
                        <li>Automatic time → milliseconds conversion</li>
                        <li>Sampling frequency (Fs) calculation from time increments</li>
                        <li>Automatic unit detection in headers</li>
                    </ul>

                    <h5>HSP Projects (Native Format)</h5>
                    <p><strong>Proprietary format for complete saves</strong></p>
                    <ul>
                        <li><strong>Save HSP:</strong> File → Save HSP (Ctrl+S if modified)</li>
                        <li><strong>Save As:</strong> File → Save HSP As...</li>
                        <li><strong>Open HSP:</strong> File → Open HSP</li>
                        <li><strong>Export CSV to HSP:</strong> File → Export to HSP</li>
                    </ul>

                    <h5>Saved Content (HSP)</h5>
                    <ul>
                        <li>✓ All time-series data (all channels)</li>
                        <li>✓ Channel configuration (colors, axes, visibility, FFT)</li>
                        <li>✓ FFT and Spectrogram parameters</li>
                        <li>✓ All active tools (Measure, Ruler, Track)</li>
                        <li>✓ All annotations (Markers, Intervals, Diff/Channel)</li>
                        <li>✓ Calculated channels (formulas)</li>
                        <li>✓ Smoothed channels (parameters)</li>
                        <li>✓ Saved views (state snapshots)</li>
                        <li>✓ Undo/Redo history</li>
                        <li>✓ Zoom and cursors</li>
                    </ul>

                    <h5>Exports</h5>
                    <ul>
                        <li><strong>Export PNG:</strong> Screenshot of active chart</li>
                        <li><strong>Export CSV:</strong> Time data in text format</li>
                        <li><strong>Export Spectrogram:</strong> STFT results (Time, Frequency, Amplitude)</li>
                        <li><strong>Export PDF:</strong> Analysis report with charts and statistics</li>
                    </ul>
                `
            },
            temporal: {
                title: "⏱️ Time Domain Analysis",
                content: `
                    <p>The time domain displays signal evolution over time. It's the starting point for all analysis.</p>

                    <h5>Selection Cursors</h5>
                    <ul>
                        <li><strong>Green Cursor (Start):</strong> Define analysis zone start</li>
                        <li><strong>Red Cursor (End):</strong> Define analysis zone end</li>
                        <li><strong>Move:</strong> Click-drag on a cursor to move it</li>
                        <li><strong>Group Move:</strong> Shift + click between cursors to move both together</li>
                    </ul>

                    <h5>Zoom & Navigation</h5>
                    <ul>
                        <li><strong>Mouse Wheel:</strong> Zoom X and Y simultaneously</li>
                        <li><strong>Shift + Wheel:</strong> Vertical zoom (Y) only</li>
                        <li><strong>Ctrl + Wheel:</strong> Horizontal zoom (X) only</li>
                        <li><strong>Pan:</strong> Click-drag outside cursors to navigate</li>
                        <li><strong>Manual Zoom:</strong> Use "Min/Max (s)" fields for precise zoom</li>
                    </ul>

                    <h5>Statistics (Selected Zone)</h5>
                    <ul>
                        <li><strong>Min/Max:</strong> Signal extreme values</li>
                        <li><strong>Mean:</strong> Arithmetic average value</li>
                        <li><strong>Std Dev:</strong> Value dispersion around mean</li>
                        <li><strong>RMS:</strong> Root Mean Square (effective value)</li>
                        <li><strong>Duration:</strong> Time elapsed between cursors</li>
                    </ul>

                    <h5>Multi-Channel</h5>
                    <ul>
                        <li>Simultaneous display of multiple signals</li>
                        <li>Multiple Y-axes (left and right)</li>
                        <li>Customizable colors per channel</li>
                        <li>Adjustable line width (0.5 to 5.0 px)</li>
                        <li>Individual visibility per channel</li>
                    </ul>

                    <h5>Keyboard Shortcut</h5>
                    <p><kbd>Ctrl+1</kbd> - Toggle time domain display</p>
                `
            },
            frequency: {
                title: "📊 Frequency Analysis (FFT)",
                content: `
                    <p>Fast Fourier Transform (FFT) reveals the frequency content of your signal.</p>

                    <h5>FFT Parameters</h5>
                    <ul>
                        <li><strong>Window:</strong>
                            <ul>
                                <li><strong>Rectangular:</strong> For transients starting/ending at zero</li>
                                <li><strong>Hanning (recommended):</strong> Industry standard for vibration analysis</li>
                                <li><strong>Hamming:</strong> Better separation of close frequencies</li>
                                <li><strong>Blackman:</strong> Best amplitude accuracy</li>
                            </ul>
                        </li>
                        <li><strong>FFT Points:</strong> Defines frequency resolution
                            <ul>
                                <li>Resolution = Fs / N (ex: 1000Hz/4096pts = 0.24Hz)</li>
                                <li>More points = better resolution but longer computation</li>
                            </ul>
                        </li>
                        <li><strong>Peak Sensitivity:</strong> Adjusts peak detection threshold (logarithmic scale)</li>
                    </ul>

                    <h5>Spectrum Interpretation</h5>
                    <ul>
                        <li><strong>Dominant Frequency:</strong> Most important peak in spectrum</li>
                        <li><strong>Max Amplitude:</strong> Amplitude of dominant peak</li>
                        <li><strong>Secondary Peaks:</strong> Harmonics or additional components</li>
                        <li><strong>Background Noise:</strong> Baseline level between peaks</li>
                    </ul>

                    <h5>Channel Selection</h5>
                    <ul>
                        <li>Choose channel to analyze</li>
                        <li>Individual or overlaid FFT for multiple channels</li>
                        <li>Configuration per channel in "Multi-Channel Configuration"</li>
                    </ul>

                    <h5>Keyboard Shortcut</h5>
                    <p><kbd>Ctrl+2</kbd> - Toggle frequency domain display</p>
                `
            },
            spectrogram: {
                title: "🎨 Spectrogram (STFT)",
                content: `
                    <p>The spectrogram shows frequency evolution over time (Short-Time Fourier Transform).</p>

                    <h5>STFT Parameters</h5>
                    <ul>
                        <li><strong>STFT Window:</strong> Size of each analyzed segment
                            <ul>
                                <li>Small window = Good time resolution, poor frequency resolution</li>
                                <li>Large window = Good frequency resolution, poor time resolution</li>
                            </ul>
                        </li>
                        <li><strong>Overlap:</strong> Percentage overlap between windows
                            <ul>
                                <li>50-75% recommended for smooth visualization</li>
                                <li>More overlap = more detailed image but longer computation</li>
                            </ul>
                        </li>
                        <li><strong>Scale:</strong>
                            <ul>
                                <li><strong>Linear:</strong> Direct amplitude representation</li>
                                <li><strong>Logarithmic:</strong> Better dynamic range for weak signals</li>
                                <li><strong>dB:</strong> Decibel scale for acoustic analysis</li>
                            </ul>
                        </li>
                        <li><strong>Max Frequency:</strong> Limits display to lower frequencies</li>
                    </ul>

                    <h5>Color Map</h5>
                    <ul>
                        <li><strong>Blue:</strong> Low amplitude</li>
                        <li><strong>Cyan:</strong> Medium-low amplitude</li>
                        <li><strong>Green:</strong> Medium amplitude</li>
                        <li><strong>Yellow:</strong> Medium-high amplitude</li>
                        <li><strong>Red:</strong> High amplitude</li>
                    </ul>

                    <h5>Typical Applications</h5>
                    <ul>
                        <li><strong>Transients:</strong> Shocks, impacts, startups</li>
                        <li><strong>Modulations:</strong> Frequency variations over time</li>
                        <li><strong>Regime Changes:</strong> Machine vibration evolution</li>
                        <li><strong>Speech Analysis:</strong> Formants and phonemes</li>
                    </ul>

                    <h5>Export</h5>
                    <p>File → Export Spectrogram: Text format (Time, Frequency, Amplitude)</p>

                    <h5>Keyboard Shortcut</h5>
                    <p><kbd>Ctrl+3</kbd> - Toggle spectrogram display</p>
                `
            },
            measureTools: {
                title: "📐 Measurement Tools",
                content: `
                    <h5>Measure Tool (Δ Difference)</h5>
                    <p><strong>Shortcut:</strong> <kbd>M</kbd></p>
                    <ul>
                        <li><strong>Function:</strong> Measure differences between two points</li>
                        <li><strong>Usage:</strong>
                            <ol>
                                <li>Activate tool (button or M key)</li>
                                <li>Click on chart to place Point 1 (red)</li>
                                <li>Click again to place Point 2 (cyan)</li>
                            </ol>
                        </li>
                        <li><strong>Results displayed:</strong>
                            <ul>
                                <li><strong>ΔX (Δt):</strong> Time difference (auto-formatted in ms or s)</li>
                                <li><strong>ΔY:</strong> Value difference (with channel unit)</li>
                            </ul>
                        </li>
                        <li><strong>Advanced features:</strong>
                            <ul>
                                <li>Move a point: Click near a point and drag</li>
                                <li>Reference line: Yellow line connecting points</li>
                                <li>Axis annotations: ΔX and ΔY projections on all visible axes</li>
                            </ul>
                        </li>
                        <li><strong>Clear:</strong> "Clear" button in Measure panel</li>
                    </ul>

                    <h5>Ruler Tool (Single Point)</h5>
                    <p><strong>Shortcut:</strong> <kbd>R</kbd></p>
                    <ul>
                        <li><strong>Function:</strong> Measure coordinates of a single point</li>
                        <li><strong>Usage:</strong>
                            <ol>
                                <li>Activate tool (button or R key)</li>
                                <li>Click on chart to place measurement point</li>
                            </ol>
                        </li>
                        <li><strong>Display:</strong>
                            <ul>
                                <li><strong>X (Time):</strong> In seconds or milliseconds</li>
                                <li><strong>Y (Value):</strong> With unit, for all visible Y-axes</li>
                            </ul>
                        </li>
                        <li><strong>Visual point:</strong> Cyan circle with reference crosshair</li>
                        <li><strong>Move:</strong> Click and drag the point</li>
                        <li><strong>Clear:</strong> "Clear" button in Ruler panel</li>
                    </ul>

                    <h5>Track Tool (Multi-Channel Tracking)</h5>
                    <p><strong>Shortcut:</strong> <kbd>T</kbd></p>
                    <ul>
                        <li><strong>Function:</strong> Track all channel values at a given time</li>
                        <li><strong>Operating modes:</strong>
                            <ul>
                                <li><strong>Free tracking:</strong> Cursor follows mouse</li>
                                <li><strong>Locked:</strong> Click to fix position</li>
                                <li><strong>Draggable:</strong> Drag locked cursor</li>
                            </ul>
                        </li>
                        <li><strong>Display:</strong>
                            <ul>
                                <li>Blue dashed vertical line</li>
                                <li>Per-channel annotations with interpolated values</li>
                                <li>Colors matching channel colors</li>
                            </ul>
                        </li>
                        <li><strong>Interpolation:</strong> Calculates values between measurement points</li>
                        <li><strong>Clear:</strong> "Clear" button in Track panel</li>
                    </ul>
                `
            },
            annotations: {
                title: "🏷️ Annotation Tools",
                content: `
                    <h5>Markers (SnapPoints)</h5>
                    <ul>
                        <li><strong>Function:</strong> Mark specific points with annotations and arrows</li>
                        <li><strong>Creation:</strong>
                            <ol>
                                <li>Activate Marker tool</li>
                                <li>Click on chart to place a point</li>
                                <li>Marker snaps to selected channel</li>
                            </ol>
                        </li>
                        <li><strong>Properties:</strong>
                            <ul>
                                <li>Comment with dynamic tags (C$, X$, Y$)</li>
                                <li>Adjustable box position (offsetX, offsetY)</li>
                                <li>Customizable colors (point, background)</li>
                                <li>Text style (font, bold, italic, underline)</li>
                                <li>Alignment (left, center, right / top, middle, bottom)</li>
                                <li>Optional arrow with movable endpoint</li>
                            </ul>
                        </li>
                        <li><strong>Comment Tags:</strong>
                            <ul>
                                <li><strong>C$:</strong> Channel name</li>
                                <li><strong>X$:</strong> Time value</li>
                                <li><strong>Y$:</strong> Y value</li>
                            </ul>
                        </li>
                        <li><strong>Snapping:</strong> Can snap to channel to follow movements</li>
                        <li><strong>Management:</strong>
                            <ul>
                                <li>Show/Hide (eye icon)</li>
                                <li>Edit (pen icon)</li>
                                <li>Delete (trash icon)</li>
                                <li>Duplicate</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Intervals (Time Ranges)</h5>
                    <ul>
                        <li><strong>Function:</strong> Mark and annotate time ranges</li>
                        <li><strong>Creation:</strong>
                            <ol>
                                <li>Activate Interval tool</li>
                                <li>Click-drag to define range</li>
                            </ol>
                        </li>
                        <li><strong>Properties:</strong>
                            <ul>
                                <li>Free comment</li>
                                <li>Adjustable vertical position (0-1 = bottom-top)</li>
                                <li>Customizable color</li>
                                <li>Text style (font, formatting)</li>
                            </ul>
                        </li>
                        <li><strong>Interactions:</strong>
                            <ul>
                                <li>Move edges (start/end)</li>
                                <li>Move height (up/down)</li>
                                <li>Dashed vertical line at each end</li>
                            </ul>
                        </li>
                        <li><strong>Management:</strong> Same as Markers (Show, Edit, Delete)</li>
                    </ul>

                    <h5>Diff/Channel (Per-Channel Measurement)</h5>
                    <ul>
                        <li><strong>Function:</strong> Measure differences within a specific channel</li>
                        <li><strong>Creation:</strong>
                            <ol>
                                <li>Activate Diff/Channel tool</li>
                                <li>Select target channel</li>
                                <li>Click to place Point 1</li>
                                <li>Click to place Point 2</li>
                            </ol>
                        </li>
                        <li><strong>Calculations displayed:</strong>
                            <ul>
                                <li><strong>ΔX (time):</strong> Time difference</li>
                                <li><strong>ΔY (value):</strong> Value difference</li>
                                <li><strong>Slope:</strong> ΔY/ΔX (unit/second)</li>
                            </ul>
                        </li>
                        <li><strong>Display:</strong>
                            <ul>
                                <li>Points in channel color</li>
                                <li>Diagonal line connecting points</li>
                                <li>Three annotations (horizontal ΔX, vertical ΔY, diagonal Slope)</li>
                            </ul>
                        </li>
                        <li><strong>Move:</strong> Drag points or annotations</li>
                        <li><strong>Management:</strong> List per channel with Delete button</li>
                    </ul>

                    <h5>Text Annotations</h5>
                    <p><strong>Shortcut:</strong> <kbd>A</kbd></p>
                    <ul>
                        <li><strong>Function:</strong> Add free text notes on chart</li>
                        <li><strong>Creation:</strong> Annotation mode → Click to place</li>
                        <li><strong>Properties:</strong> HTML text, position, style</li>
                    </ul>
                `
            },
            navigationZoom: {
                title: "🧭 Navigation and Zoom",
                content: `
                    <h5>Pan Tool (Navigation)</h5>
                    <p><strong>Shortcut:</strong> <kbd>P</kbd></p>
                    <ul>
                        <li><strong>Pan Modes:</strong>
                            <ul>
                                <li><strong>Free:</strong> Movement in all directions</li>
                                <li><strong>Horizontal:</strong> X movement only</li>
                                <li><strong>Vertical:</strong> Y movement only</li>
                                <li><strong>Y=0:</strong> Center on vertical zero</li>
                            </ul>
                        </li>
                        <li><strong>Usage:</strong> Click-drag on chart to move</li>
                    </ul>

                    <h5>Zoom Modes</h5>
                    <ul>
                        <li><strong>Grid Zoom:</strong> Simultaneous X and Y zoom (mouse wheel)</li>
                        <li><strong>Horizontal Zoom:</strong> X-axis only (Ctrl+Wheel)</li>
                        <li><strong>Vertical Zoom:</strong> Y-axis only (Shift+Wheel)</li>
                    </ul>

                    <h5>Manual Zoom</h5>
                    <ul>
                        <li><strong>Time Fields:</strong>
                            <ul>
                                <li><strong>T min:</strong> Start time in seconds</li>
                                <li><strong>T max:</strong> End time in seconds</li>
                            </ul>
                        </li>
                        <li><strong>Y-Axes:</strong>
                            <ul>
                                <li>Configuration per channel in "Multi-Channel Configuration"</li>
                                <li>Custom Min/Max or Auto</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Reset Zoom</h5>
                    <ul>
                        <li><strong>Reset button:</strong> Reset current view</li>
                        <li><strong>Ctrl+O:</strong> Reset all charts</li>
                    </ul>

                    <h5>Saved Views</h5>
                    <ul>
                        <li><strong>Function:</strong> Capture and restore complete chart state</li>
                        <li><strong>Create View:</strong>
                            <ol>
                                <li>Adjust zoom and visible channels</li>
                                <li>Click "Create view"</li>
                                <li>Name the view</li>
                            </ol>
                        </li>
                        <li><strong>Captured state:</strong>
                            <ul>
                                <li>X and Y zoom</li>
                                <li>Active channel</li>
                                <li>Each channel visibility</li>
                                <li>Markers, intervals, diff/channel visibility</li>
                            </ul>
                        </li>
                        <li><strong>Restore:</strong> Click on a view in the list</li>
                        <li><strong>Management:</strong> Edit name, Delete</li>
                        <li><strong>Persistence:</strong> Saved in localStorage and HSP files</li>
                    </ul>
                `
            },
            channels: {
                title: "📊 Channel Management",
                content: `
                    <h5>Multi-Channel Configuration</h5>
                    <p><strong>Button:</strong> GRAPHICS → Multi-Channel Configuration</p>
                    <ul>
                        <li><strong>Properties per Channel:</strong>
                            <ul>
                                <li><strong>Name/Label:</strong> Display name</li>
                                <li><strong>Unit:</strong> Measurement unit (Pa, m/s², etc.)</li>
                                <li><strong>Color:</strong> Plot color (advanced selector)</li>
                                <li><strong>Thickness:</strong> Line width (0.5 to 5.0 px)</li>
                                <li><strong>Y-Axis Position:</strong> Left (L) or Right (R)</li>
                                <li><strong>Y Min/Max:</strong> Custom limits or Auto</li>
                                <li><strong>FFT:</strong> Enable FFT analysis for this channel</li>
                                <li><strong>Visible:</strong> Show/Hide</li>
                            </ul>
                        </li>
                        <li><strong>Multiple Axes:</strong> Unlimited Y-axes (left and right)</li>
                    </ul>

                    <h5>Channel Quick View</h5>
                    <p><strong>Accordion:</strong> Channel</p>
                    <ul>
                        <li><strong>Channel List:</strong>
                            <ul>
                                <li>Name (click to toggle visibility)</li>
                                <li>Eye icon (visible/hidden)</li>
                                <li>L/R checkboxes (left/right axis)</li>
                                <li>FFT checkbox (analysis enabled)</li>
                                <li>Color indicator</li>
                            </ul>
                        </li>
                        <li><strong>Quick Access:</strong> Modify visibility and axis without opening configuration</li>
                    </ul>

                    <h5>Calculated Channels</h5>
                    <p><strong>Accordion:</strong> Calculated Channel</p>
                    <ul>
                        <li><strong>Function:</strong> Create virtual channels from mathematical formulas</li>
                        <li><strong>Formula Syntax:</strong>
                            <ul>
                                <li><strong>Channel references:</strong> S1, S2, S3... (case-insensitive)</li>
                                <li><strong>Operators:</strong> +, -, *, /, ^ (power), % (modulo)</li>
                                <li><strong>Functions:</strong> sqrt, sqr, ln, log, abs, sin, cos, tan, asin, acos, atan</li>
                                <li><strong>Constants:</strong> Pi, e</li>
                            </ul>
                        </li>
                        <li><strong>Examples:</strong>
                            <ul>
                                <li><code>sqrt(S1^2 + S2^2)</code> - Magnitude</li>
                                <li><code>(S1 + S2) / 2</code> - Average of two channels</li>
                                <li><code>S1 - S2</code> - Difference</li>
                                <li><code>abs(S1)</code> - Absolute value</li>
                            </ul>
                        </li>
                        <li><strong>Properties:</strong>
                            <ul>
                                <li>Custom name</li>
                                <li>Color</li>
                                <li>Visibility</li>
                            </ul>
                        </li>
                        <li><strong>Management:</strong> List with Edit/Delete buttons</li>
                    </ul>

                    <h5>Channel Smoothing (Filter)</h5>
                    <p><strong>Accordion:</strong> Channel Smoothing</p>
                    <ul>
                        <li><strong>Function:</strong> Apply moving average filter</li>
                        <li><strong>Parameters:</strong>
                            <ul>
                                <li><strong>Source channel:</strong> Channel to smooth</li>
                                <li><strong>Window size:</strong> Number of points (1-100)</li>
                                <li><strong>Name:</strong> Smoothed channel name</li>
                                <li><strong>Color:</strong> Plot color</li>
                            </ul>
                        </li>
                        <li><strong>Algorithm:</strong> Centered moving average</li>
                        <li><strong>Preview:</strong> Real-time adjustment with slider</li>
                        <li><strong>Management:</strong> List with Edit/Delete buttons</li>
                    </ul>
                `
            },
            config: {
                title: "⚙️ Configuration and Customization",
                content: `
                    <h5>General Settings</h5>
                    <p><strong>Menu:</strong> SETTINGS (⚙️)</p>
                    <ul>
                        <li><strong>Language:</strong> Français, English, Deutsch</li>
                        <li><strong>Theme:</strong>
                            <ul>
                                <li>Light</li>
                                <li>Steampunk</li>
                                <li>Steampunk2 (Industrial)</li>
                            </ul>
                        </li>
                        <li><strong>Font Size:</strong> Text size in charts (8-24px)</li>
                        <li><strong>Mouse Halo:</strong> Visual position indicator (On/Off)</li>
                        <li><strong>Hover Info:</strong> Information bubbles (tooltips) on charts</li>
                    </ul>

                    <h5>Mouse Halo</h5>
                    <ul>
                        <li><strong>Function:</strong> Colored ring following mouse</li>
                        <li><strong>States:</strong>
                            <ul>
                                <li><strong>Normal size:</strong> Free navigation (50px)</li>
                                <li><strong>Reduced:</strong> Shift or Ctrl pressed (25px)</li>
                                <li><strong>Near cursor:</strong> Magnetic zone near element (20px)</li>
                                <li><strong>Click:</strong> During click (15px, red)</li>
                            </ul>
                        </li>
                        <li><strong>Colors:</strong>
                            <ul>
                                <li>Blue: Normal mode</li>
                                <li>Green: Shift pressed</li>
                                <li>Yellow: Ctrl pressed</li>
                                <li>Red: Click or drag</li>
                            </ul>
                        </li>
                        <li><strong>Hidden:</strong> When modal is open</li>
                    </ul>

                    <h5>Presets (Configuration Templates)</h5>
                    <p><strong>Accordion:</strong> Presets</p>
                    <ul>
                        <li><strong>Built-in Presets:</strong>
                            <ul>
                                <li><strong>Vibration Analysis:</strong> Hanning 4096, STFT 1024 @ 75%</li>
                                <li><strong>Acoustic Monitoring:</strong> Blackman 8192, STFT 2048 @ 90%</li>
                                <li><strong>Pressure Analysis:</strong> Hamming 2048, STFT 512 @ 50%</li>
                                <li><strong>Audio Quality:</strong> Blackman 16384, STFT 2048 @ 90%</li>
                            </ul>
                        </li>
                        <li><strong>Custom Presets:</strong>
                            <ul>
                                <li>Save current configuration (FFT + Spectrogram)</li>
                                <li>Name and store</li>
                                <li>Load for reuse</li>
                                <li>Delete</li>
                            </ul>
                        </li>
                        <li><strong>Saved Content:</strong>
                            <ul>
                                <li>FFT parameters (window, points, threshold)</li>
                                <li>Spectrogram parameters (window, overlap, scale, max freq)</li>
                                <li>Channel configuration (visibility, axes, FFT)</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Advanced Color Picker</h5>
                    <ul>
                        <li><strong>Selector Tab:</strong>
                            <ul>
                                <li>Hexadecimal input (#RRGGBB)</li>
                                <li>RGB sliders (Red, Green, Blue)</li>
                                <li>Real-time preview</li>
                            </ul>
                        </li>
                        <li><strong>Palettes Tab:</strong>
                            <ul>
                                <li>Predefined colors</li>
                                <li>Recent colors history</li>
                            </ul>
                        </li>
                        <li><strong>OK Button:</strong> Validate selection</li>
                    </ul>
                `
            },
            shortcuts: {
                title: "⌨️ Keyboard Shortcuts",
                content: `
                    <h5>Display</h5>
                    <ul>
                        <li><kbd>Ctrl+1</kbd> - Toggle Time Domain</li>
                        <li><kbd>Ctrl+2</kbd> - Toggle Frequency Domain</li>
                        <li><kbd>Ctrl+3</kbd> - Toggle Spectrogram</li>
                    </ul>

                    <h5>Measurement Tools</h5>
                    <ul>
                        <li><kbd>M</kbd> - Activate/Deactivate Measure Tool</li>
                        <li><kbd>R</kbd> - Activate/Deactivate Ruler Tool</li>
                        <li><kbd>T</kbd> - Activate/Deactivate Track Tool</li>
                        <li><kbd>P</kbd> - Activate/Deactivate Pan Tool</li>
                        <li><kbd>A</kbd> - Activate/Deactivate Annotation Mode</li>
                    </ul>

                    <h5>Navigation and Zoom</h5>
                    <ul>
                        <li><kbd>Wheel</kbd> - Zoom X+Y simultaneously</li>
                        <li><kbd>Shift+Wheel</kbd> - Vertical zoom (Y) only</li>
                        <li><kbd>Ctrl+Wheel</kbd> - Horizontal zoom (X) only</li>
                        <li><kbd>Ctrl+O</kbd> - Reset zoom (all charts)</li>
                    </ul>

                    <h5>History</h5>
                    <ul>
                        <li><kbd>Ctrl+Z</kbd> - Undo</li>
                        <li><kbd>Ctrl+Y</kbd> - Redo</li>
                    </ul>

                    <h5>Help</h5>
                    <ul>
                        <li><kbd>H</kbd> - Show keyboard shortcuts help</li>
                        <li><kbd>Esc</kbd> - Deactivate all tools</li>
                    </ul>

                    <h5>Selection Cursors</h5>
                    <ul>
                        <li><strong>Click-drag cursor:</strong> Move individual cursor</li>
                        <li><strong>Shift + click between cursors:</strong> Move both together</li>
                    </ul>

                    <h5>Tip</h5>
                    <p>Hold <kbd>Shift</kbd> or <kbd>Ctrl</kbd> to see the halo change color and indicate active mode!</p>
                `
            },
            tips: {
                title: "💡 Tips and Best Practices",
                content: `
                    <h5>Performance Optimization</h5>
                    <ul>
                        <li><strong>Large datasets:</strong>
                            <ul>
                                <li>Use HSP file rather than CSV (faster loading)</li>
                                <li>Disable unused channels</li>
                                <li>Reduce FFT points if high resolution not needed</li>
                            </ul>
                        </li>
                        <li><strong>Spectrogram:</strong>
                            <ul>
                                <li>Reduce overlap for faster computation</li>
                                <li>Limit max frequency if analyzing low frequencies</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Vibration Analysis</h5>
                    <ul>
                        <li><strong>FFT Window Choice:</strong>
                            <ul>
                                <li>Continuous vibrations: Hanning</li>
                                <li>Impulses/shocks: Rectangular window</li>
                                <li>Amplitude accuracy: Blackman</li>
                            </ul>
                        </li>
                        <li><strong>Harmonic Detection:</strong>
                            <ul>
                                <li>Increase FFT points (4096 or 8192)</li>
                                <li>Adjust peak sensitivity</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>Recommended Workflow</h5>
                    <ol>
                        <li><strong>Import:</strong> Load CSV or HSP</li>
                        <li><strong>Inspection:</strong> Complete time view (Ctrl+O to reset zoom)</li>
                        <li><strong>Selection:</strong> Green/red cursors on zone of interest</li>
                        <li><strong>FFT Analysis:</strong> Ctrl+2 to see spectrum</li>
                        <li><strong>STFT:</strong> Ctrl+3 for time evolution</li>
                        <li><strong>Annotations:</strong> Markers and intervals to document</li>
                        <li><strong>Save:</strong> HSP for complete state preservation</li>
                        <li><strong>Export:</strong> PNG or PDF for sharing/reports</li>
                    </ol>

                    <h5>Interface Tips</h5>
                    <ul>
                        <li><strong>Draggable modals:</strong> Click on title to move Settings/Help</li>
                        <li><strong>Quick views:</strong> Create snapshots of frequently used zoom/channel configurations</li>
                        <li><strong>Colors:</strong> Use distinct colors for easier multi-channel reading</li>
                        <li><strong>Presets:</strong> Save your favorite FFT/Spectro configurations</li>
                    </ul>

                    <h5>Multi-Project Management</h5>
                    <ul>
                        <li>Load multiple files simultaneously</li>
                        <li>Switch between projects via tabs</li>
                        <li>Each project keeps its own state</li>
                        <li>Close unused projects to free memory</li>
                    </ul>

                    <h5>Useful Calculated Formulas</h5>
                    <ul>
                        <li><strong>2D Magnitude:</strong> <code>sqrt(S1^2 + S2^2)</code></li>
                        <li><strong>Average:</strong> <code>(S1 + S2 + S3) / 3</code></li>
                        <li><strong>Difference:</strong> <code>S1 - S2</code></li>
                        <li><strong>Ratio:</strong> <code>S1 / S2</code></li>
                        <li><strong>Rectification:</strong> <code>abs(S1)</code></li>
                    </ul>

                    <h5>PDF Export</h5>
                    <ul>
                        <li>Includes time chart with statistics</li>
                        <li>Project information (name, date, duration)</li>
                        <li>Editable user notes</li>
                        <li>Customizable filename</li>
                    </ul>
                `
            }
        }
    },
    de: {
        title: "Hilfe & Technische Details - HydraSpec Pro",
        navigation: {
            title: "Schnellnavigation:",
            sections: [
                { id: "getting-started", label: "Erste Schritte" },
                { id: "file-operations", label: "Dateien" },
                { id: "temporal", label: "Zeitbereich" },
                { id: "frequency", label: "Frequenz" },
                { id: "spectrogram", label: "Spektrogramm" },
                { id: "measurement", label: "Messung" },
                { id: "annotation", label: "Anmerkungen" },
                { id: "navigation", label: "Navigation" },
                { id: "channels", label: "Kanäle" },
                { id: "configuration", label: "Konfiguration" },
                { id: "shortcuts", label: "Tastenkürzel" },
                { id: "tips", label: "Tipps" }
            ]
        },
        sections: {
            gettingStarted: {
                title: "🚀 Erste Schritte",
                content: `
                    <h4>Willkommen bei HydraSpec Pro</h4>
                    <p>HydraSpec Pro ist ein leistungsstarkes Werkzeug zur Analyse von Zeitreihen mit Fokus auf Frequenzanalyse (FFT), Spektrogramme (STFT) und interaktive Messungen.</p>

                    <h4>Grundlegende Schritte:</h4>
                    <ol>
                        <li><strong>CSV-Datei laden:</strong> Klicken Sie auf "CSV laden" oder ziehen Sie eine Datei in den Arbeitsbereich</li>
                        <li><strong>Kanäle konfigurieren:</strong> Verwenden Sie den Button ⚙️ um Kanäle zu aktivieren/deaktivieren und Einheiten/Beschreibungen zuzuweisen</li>
                        <li><strong>Analysemodus wählen:</strong>
                            <ul>
                                <li>📈 <strong>Zeitbereich:</strong> Klassische Zeitreihen-Visualisierung</li>
                                <li>📊 <strong>FFT:</strong> Frequenzanalyse mit einstellbarem Fenster</li>
                                <li>🎨 <strong>STFT:</strong> Zeit-Frequenz-Spektrogramm</li>
                            </ul>
                        </li>
                        <li><strong>Interaktive Werkzeuge nutzen:</strong> 9 Werkzeuge für Messungen, Anmerkungen und Navigation stehen zur Verfügung</li>
                    </ol>

                    <h4>Empfohlener Workflow:</h4>
                    <ol>
                        <li>Daten laden und überprüfen</li>
                        <li>Relevante Kanäle konfigurieren</li>
                        <li>Im Zeitbereich navigieren, um interessante Zonen zu identifizieren</li>
                        <li>FFT oder STFT für detaillierte Frequenzanalyse verwenden</li>
                        <li>Messwerkzeuge für Quantifizierung nutzen</li>
                        <li>Mit Markierungen und Intervallen annotieren</li>
                        <li>Projekt als HSP speichern, um die gesamte Sitzung zu bewahren</li>
                    </ol>
                `
            },
            fileOperations: {
                title: "📁 Dateioperationen",
                content: `
                    <h4>CSV laden</h4>
                    <p>Importiert eine CSV-Datei mit Zeitreihen. Unterstützte Formate:</p>
                    <ul>
                        <li><strong>Mit Header:</strong> Erste Zeile enthält Spaltennamen</li>
                        <li><strong>Trennzeichen:</strong> Komma, Semikolon, Tab (automatische Erkennung)</li>
                        <li><strong>Dezimalformat:</strong> Punkt oder Komma</li>
                        <li><strong>Unbegrenzte Kanäle:</strong> Mehrere Y-Achsen möglich</li>
                    </ul>
                    <p><strong>Tipp:</strong> Die erste Spalte wird als X-Achse (Zeit) interpretiert, folgende Spalten als Y-Kanäle.</p>

                    <h4>HSP speichern (HydraSpec Pro Projekt)</h4>
                    <p>Speichert den <strong>kompletten Projektstand</strong> in einer HSP-Datei:</p>
                    <ul>
                        <li>✅ Rohdaten (CSV)</li>
                        <li>✅ Kanalkonfigurationen (Einheiten, Beschreibungen, Farben)</li>
                        <li>✅ Alle Markierungen (SnapPoints)</li>
                        <li>✅ Alle Intervalle</li>
                        <li>✅ Alle Diff/Kanal-Messungen</li>
                        <li>✅ Ansichten (Views)</li>
                        <li>✅ Globale Parameter (Fensterbreite FFT/STFT, Glättung, etc.)</li>
                    </ul>
                    <p><strong>Format:</strong> JSON (.hsp-Datei)</p>

                    <h4>HSP laden</h4>
                    <p>Lädt ein zuvor gespeichertes Projekt mit allen Parametern und Anmerkungen. Perfekt für:</p>
                    <ul>
                        <li>Wiederaufnahme der Analyse</li>
                        <li>Teilen von Analysen mit Kollegen</li>
                        <li>Archivierung wichtiger Studien</li>
                    </ul>

                    <h4>Ansicht speichern / Ansicht laden</h4>
                    <p>Separate Funktionen für <strong>Zoom-Konfigurationen</strong>:</p>
                    <ul>
                        <li><strong>Ansicht speichern:</strong> Merkt sich aktuelle Zoom-Bereiche (xMin, xMax, yMin, yMax)</li>
                        <li><strong>Ansicht laden:</strong> Kehrt zu gespeicherter Zoom-Konfiguration zurück</li>
                    </ul>
                    <p><strong>Nutzung:</strong> Ideal für Vergleiche zwischen verschiedenen Bereichen derselben Daten.</p>

                    <h4>Bild exportieren</h4>
                    <p>Exportiert das aktuelle Diagramm als PNG-Bild (800x600px). Praktisch für Berichte und Präsentationen.</p>
                `
            },
            temporal: {
                title: "⏱️ Zeitbereichsanalyse",
                content: `
                    <h4>Übersicht</h4>
                    <p>Der Zeitbereichsmodus zeigt Ihre Daten als klassische Zeitreihen an. Dies ist der Standard-Anzeigemodus beim Laden von Daten.</p>

                    <h4>Funktionen:</h4>
                    <ul>
                        <li><strong>Multi-Kanal:</strong> Zeigt alle aktivierten Kanäle gleichzeitig an</li>
                        <li><strong>Interaktiver Zoom:</strong> Mausrad zum Zoomen, Klick+Drag zum Verschieben</li>
                        <li><strong>Tooltips:</strong> Zeigt Werte beim Überfahren mit der Maus (wenn aktiviert)</li>
                        <li><strong>Legende:</strong> Zeigt Kanalnamen, Einheiten und Farben</li>
                    </ul>

                    <h4>Berechnete Kanäle</h4>
                    <p>Sie können <strong>berechnete Kanäle</strong> aus bestehenden Daten erstellen:</p>
                    <ul>
                        <li>Arithmetische Operationen: +, -, *, /</li>
                        <li>Mathematische Funktionen: sqrt, abs, sin, cos, etc.</li>
                        <li>Kanalreferenzen: ch0, ch1, ch2, etc.</li>
                    </ul>
                    <p><strong>Beispiel:</strong> <code>sqrt(ch0^2 + ch1^2)</code> berechnet die Magnitude zweier Kanäle.</p>

                    <h4>Glättung</h4>
                    <p>Gleitender Durchschnitt zur Rauschreduzierung:</p>
                    <ul>
                        <li><strong>Fenster:</strong> 1 bis 1000 Punkte</li>
                        <li><strong>Anwendung:</strong> Gilt für alle angezeigten Kanäle</li>
                        <li><strong>Nutzung:</strong> Nützlich zur Trendidentifikation</li>
                    </ul>

                    <h4>Werkzeuge im Zeitbereich:</h4>
                    <ul>
                        <li>🎯 <strong>Messung:</strong> Misst ΔX, ΔY zwischen zwei Klicks</li>
                        <li>📏 <strong>Lineal:</strong> Permanente Referenzlinien</li>
                        <li>🔍 <strong>Verfolgen:</strong> Zeigt Werte aller Kanäle an einem X-Punkt</li>
                        <li>📍 <strong>Markierung:</strong> Annotiert wichtige Punkte</li>
                        <li>⏸️ <strong>Intervall:</strong> Markiert Zeitbereiche</li>
                        <li>📊 <strong>Diff/Kanal:</strong> Vergleicht Kanäle</li>
                    </ul>
                `
            },
            frequency: {
                title: "📊 Frequenzanalyse (FFT)",
                content: `
                    <h4>Was ist FFT?</h4>
                    <p>Die <strong>Fast Fourier Transform (FFT)</strong> konvertiert ein Zeitsignal in das Frequenzspektrum. Sie zeigt, welche Frequenzen in Ihren Daten vorhanden sind und mit welcher Amplitude.</p>

                    <h4>Interaktive Fensterauswahl</h4>
                    <p>Im FFT-Modus erscheint ein <strong>grüner Cursor "Zeitanalysebereich"</strong>:</p>
                    <ul>
                        <li><strong>Positionierung:</strong> Klicken Sie, um den Analysepunkt zu verschieben</li>
                        <li><strong>Breite:</strong> Anpassbar über Einstellungen (512, 1024, 2048, 4096, 8192 Punkte)</li>
                        <li><strong>Echtzeit:</strong> Das Spektrum aktualisiert sich sofort</li>
                    </ul>

                    <h4>Fensterbreite wählen</h4>
                    <p>Die Fensterbreite bestimmt die <strong>Frequenzauflösung</strong>:</p>
                    <ul>
                        <li><strong>Schmal (512-1024):</strong> Schlechte Frequenzauflösung, gute Zeitlokalisierung</li>
                        <li><strong>Mittel (2048):</strong> Ausgewogener Kompromiss</li>
                        <li><strong>Breit (4096-8192):</strong> Exzellente Frequenzauflösung, schlechte Zeitlokalisierung</li>
                    </ul>
                    <p><strong>Frequenzauflösung = Abtastrate / Fensterbreite</strong></p>

                    <h4>Fensterfunktionen</h4>
                    <p>Reduziert spektrales Leakage:</p>
                    <ul>
                        <li><strong>Rechteck:</strong> Keine Gewichtung (Standard)</li>
                        <li><strong>Hann:</strong> Glatte Gewichtung, gut für die meisten Fälle</li>
                        <li><strong>Hamming:</strong> Optimiert für schmale Peaks</li>
                        <li><strong>Blackman:</strong> Beste Leakage-Unterdrückung, breitere Peaks</li>
                    </ul>

                    <h4>Interpretation:</h4>
                    <ul>
                        <li><strong>X-Achse:</strong> Frequenz (Hz)</li>
                        <li><strong>Y-Achse:</strong> Amplitude (linear oder logarithmisch)</li>
                        <li><strong>Peaks:</strong> Dominante Frequenzen im Signal</li>
                    </ul>

                    <h4>Praktische Nutzung:</h4>
                    <ul>
                        <li>Identifikation periodischer Komponenten</li>
                        <li>Schwingungsanalyse</li>
                        <li>Geräuschuntersuchung</li>
                        <li>Qualitätskontrolle (unerwünschte Frequenzen)</li>
                    </ul>
                `
            },
            spectrogram: {
                title: "🎨 Spektrogramm (STFT)",
                content: `
                    <h4>Was ist ein Spektrogramm?</h4>
                    <p>Das <strong>Spektrogramm</strong> ist eine 3D-Visualisierung der <strong>Zeit-Frequenz-Energie</strong>:</p>
                    <ul>
                        <li><strong>X-Achse:</strong> Zeit</li>
                        <li><strong>Y-Achse:</strong> Frequenz</li>
                        <li><strong>Farbe:</strong> Amplitude/Energie (wärmer = stärker)</li>
                    </ul>
                    <p>Es zeigt, wie sich das Frequenzspektrum <strong>im Laufe der Zeit entwickelt</strong>.</p>

                    <h4>STFT-Parameter</h4>
                    <p><strong>Short-Time Fourier Transform</strong> berechnet FFTs auf gleitenden Fenstern:</p>
                    <ul>
                        <li><strong>Fensterbreite:</strong> 256 bis 8192 Punkte
                            <ul>
                                <li>Schmal → gute Zeitauflösung, schlechte Frequenzauflösung</li>
                                <li>Breit → schlechte Zeitauflösung, gute Frequenzauflösung</li>
                            </ul>
                        </li>
                        <li><strong>Überlappung:</strong> 0% bis 95%
                            <ul>
                                <li>Hoch → glattere Visualisierung, höhere Berechnung</li>
                                <li>Niedrig → blockiger, schnellere Berechnung</li>
                            </ul>
                        </li>
                        <li><strong>Fensterfunktion:</strong> Rechteck, Hann, Hamming, Blackman</li>
                    </ul>

                    <h4>Farbskalen</h4>
                    <p>Verschiedene Farbverläufe zur Visualisierung:</p>
                    <ul>
                        <li><strong>Viridis:</strong> Wahrnehmungsgerechte Standardskala</li>
                        <li><strong>Plasma:</strong> Warme Farben</li>
                        <li><strong>Inferno:</strong> Dunkel zu Hell</li>
                        <li><strong>Magma:</strong> Violett zu Gelb</li>
                        <li><strong>Turbo:</strong> Hoher Kontrast</li>
                        <li><strong>Jet:</strong> Klassisch (nicht empfohlen für Wissenschaft)</li>
                    </ul>

                    <h4>Praktische Anwendungen:</h4>
                    <ul>
                        <li>Analyse von <strong>nicht-stationären</strong> Signalen</li>
                        <li>Identifikation transienter Ereignisse</li>
                        <li>Chirp-Erkennung (gleitende Frequenz)</li>
                        <li>Audio-Analyse (Sprachspektrogramme)</li>
                        <li>Schwingungsdiagnostik (Start/Stopp von Maschinen)</li>
                    </ul>

                    <h4>Heisenberg-Unsicherheit</h4>
                    <p>⚠️ <strong>Wichtige Einschränkung:</strong> Man kann nicht gleichzeitig perfekte Zeit- UND Frequenzauflösung haben. Die Fensterbreite ist immer ein Kompromiss zwischen beiden.</p>
                `
            },
            measurement: {
                title: "📐 Messwerkzeuge",
                content: `
                    <h4>1. 🎯 Messung (Measure Tool)</h4>
                    <p><strong>Zweck:</strong> Schnelle Messung von Unterschieden zwischen zwei Punkten</p>
                    <h5>Verwendung:</h5>
                    <ol>
                        <li>Messwerkzeug aktivieren</li>
                        <li>Ersten Punkt anklicken</li>
                        <li>Zweiten Punkt anklicken</li>
                        <li>Ergebnisse werden angezeigt:
                            <ul>
                                <li><strong>ΔX:</strong> Zeitdifferenz</li>
                                <li><strong>ΔY:</strong> Wertdifferenz</li>
                                <li><strong>Abstand:</strong> Euklidische Distanz</li>
                            </ul>
                        </li>
                    </ol>
                    <p><strong>Besonderheit:</strong> Transientes Werkzeug - die Messung verschwindet nach dem zweiten Klick</p>

                    <h4>2. 📏 Lineal (Ruler Tool)</h4>
                    <p><strong>Zweck:</strong> Permanente Referenzlinien erstellen</p>
                    <h5>Verwendung:</h5>
                    <ol>
                        <li>Linealwerkzeug aktivieren</li>
                        <li>Gewünschten Punkt anklicken</li>
                        <li>Eine <strong>permanente Linie</strong> erscheint mit Label</li>
                    </ol>
                    <h5>Funktionen:</h5>
                    <ul>
                        <li><strong>Verschiebbar:</strong> Klicken+Ziehen zum Repositionieren</li>
                        <li><strong>Löschbar:</strong> Rechtsklick auf die Linie</li>
                        <li><strong>Persistent:</strong> Wird in HSP-Projekten gespeichert</li>
                        <li><strong>Label:</strong> Zeigt X- und Y-Koordinaten</li>
                    </ul>
                    <p><strong>Praktisch für:</strong> Schwellenwertlinien, Referenzmarken, Sollwerte</p>

                    <h4>3. 🔍 Verfolgen (Track Tool)</h4>
                    <p><strong>Zweck:</strong> Alle Kanalwerte an einem präzisen X-Punkt anzeigen</p>
                    <h5>Verwendung:</h5>
                    <ol>
                        <li>Verfolgungswerkzeug aktivieren</li>
                        <li>Gewünschten X-Punkt anklicken</li>
                        <li>Eine <strong>vertikale Linie</strong> erscheint</li>
                        <li>Ein <strong>Informationsfenster</strong> zeigt:
                            <ul>
                                <li>X-Wert (Zeit)</li>
                                <li>Y-Werte aller aktiven Kanäle</li>
                            </ul>
                        </li>
                    </ol>
                    <h5>Funktionen:</h5>
                    <ul>
                        <li><strong>Verschiebbar:</strong> Klicken+Ziehen der Linie</li>
                        <li><strong>Multi-Kanal:</strong> Zeigt ALLE Kanäle gleichzeitig</li>
                        <li><strong>Präzise:</strong> Ideal für exakte Werteablesung</li>
                    </ul>
                    <p><strong>Praktisch für:</strong> Vergleich mehrerer Kanäle an einem Zeitpunkt, Korrelationsanalyse</p>

                    <h4>Maus-Halo 🔵</h4>
                    <p>Ein visueller <strong>magnetischer Halo</strong> erscheint um die Maus, wenn Sie sich interaktiven Elementen nähern:</p>
                    <ul>
                        <li><strong>Normal:</strong> Blauer Kreis</li>
                        <li><strong>In Nähe:</strong> Wird kleiner (Magnetzone erkannt)</li>
                        <li><strong>Klick:</strong> Wird rot (Aktion bestätigt)</li>
                    </ul>
                    <p>Der Halo reagiert auf: Zeitbereichs-Cursor, Markierungspunkte, Markierungslinien, Intervall-Linien, Diff/Kanal-Texte</p>
                `
            },
            annotation: {
                title: "🏷️ Anmerkungswerkzeuge",
                content: `
                    <h4>1. 📍 Markierung (Marker / SnapPoint)</h4>
                    <p><strong>Zweck:</strong> Wichtige Punkte in Ihren Daten annotieren und verfolgen</p>

                    <h5>Erstellen:</h5>
                    <ol>
                        <li>Markierungswerkzeug aktivieren</li>
                        <li>Auf einen Kanal klicken, um den Ankerpunkt zu setzen</li>
                        <li>Ein Markierungssymbol erscheint mit Verbindungslinie</li>
                        <li>Eine Textbox wird angezeigt mit:
                            <ul>
                                <li>Kanalname</li>
                                <li>X-Wert (Zeit)</li>
                                <li>Y-Wert (Amplitude)</li>
                                <li>Editierbare Notizen</li>
                            </ul>
                        </li>
                    </ol>

                    <h5>Funktionen:</h5>
                    <ul>
                        <li><strong>Verschiebbar:</strong> Ziehen Sie die Textbox an eine neue Position</li>
                        <li><strong>Editierbar:</strong> Klicken Sie auf die Notizen, um sie zu ändern</li>
                        <li><strong>Löschbar:</strong> Rechtsklick auf die Markierung</li>
                        <li><strong>Sichtbarkeits-Toggle:</strong> Ein/Aus-Schalter in den Einstellungen</li>
                        <li><strong>Persistent:</strong> In HSP-Projekten gespeichert</li>
                    </ul>

                    <h5>Praktische Nutzung:</h5>
                    <ul>
                        <li>Anomalien markieren</li>
                        <li>Interessante Ereignisse kennzeichnen</li>
                        <li>Peaks/Täler annotieren</li>
                        <li>Notizen für Teamkollegen hinterlassen</li>
                    </ul>

                    <h4>2. ⏸️ Intervall (Interval Tool)</h4>
                    <p><strong>Zweck:</strong> Zeitbereiche markieren und kommentieren</p>

                    <h5>Erstellen:</h5>
                    <ol>
                        <li>Intervallwerkzeug aktivieren</li>
                        <li>Startpunkt anklicken</li>
                        <li>Endpunkt anklicken</li>
                        <li>Ein <strong>farbiger Bereich</strong> erscheint zwischen den zwei Punkten</li>
                        <li>Ein Label zeigt:
                            <ul>
                                <li>Start-X</li>
                                <li>End-X</li>
                                <li>Dauer (ΔX)</li>
                                <li>Editierbare Notizen</li>
                            </ul>
                        </li>
                    </ol>

                    <h5>Funktionen:</h5>
                    <ul>
                        <li><strong>Visuelle Hervorhebung:</strong> Halbtransparente farbige Füllung</li>
                        <li><strong>Gestrichelte Grenzen:</strong> Vertikale Linien an Start/Ende</li>
                        <li><strong>Editierbar:</strong> Notizen ändern</li>
                        <li><strong>Löschbar:</strong> Rechtsklick auf das Intervall</li>
                        <li><strong>Sichtbarkeits-Toggle:</strong> Alle Intervalle ein/aus</li>
                    </ul>

                    <h5>Praktische Nutzung:</h5>
                    <ul>
                        <li>Testphasen markieren</li>
                        <li>Problembereiche hervorheben</li>
                        <li>Unterschiedliche Zustände kennzeichnen</li>
                        <li>Zeitliche Segmentierung</li>
                    </ul>

                    <h4>3. 📊 Diff/Kanal (Diff/Channel Tool)</h4>
                    <p><strong>Zweck:</strong> Zwei Kanäle vergleichen und Unterschiede quantifizieren</p>

                    <h5>Erstellen:</h5>
                    <ol>
                        <li>Diff/Kanal-Werkzeug aktivieren</li>
                        <li>Punkt auf <strong>Kanal 1</strong> anklicken</li>
                        <li>Punkt auf <strong>Kanal 2</strong> anklicken</li>
                        <li>Eine Verbindungslinie erscheint mit drei Texten:
                            <ul>
                                <li><strong>Horizontal (ΔX):</strong> Zeitdifferenz</li>
                                <li><strong>Vertikal (ΔY):</strong> Wertdifferenz</li>
                                <li><strong>Diagonal:</strong> Hauptlabel (Kanalnamen)</li>
                            </ul>
                        </li>
                    </ol>

                    <h5>Funktionen:</h5>
                    <ul>
                        <li><strong>Multi-Kanal-Vergleich:</strong> Beliebige Kanalkombinationen</li>
                        <li><strong>Präzise Messungen:</strong> ΔX, ΔY, Abstand</li>
                        <li><strong>Visuelle Verbindung:</strong> Linie zwischen Punkten</li>
                        <li><strong>Editierbare Notizen:</strong> Auf Texten anklicken</li>
                        <li><strong>Löschbar:</strong> Rechtsklick</li>
                    </ul>

                    <h5>Praktische Nutzung:</h5>
                    <ul>
                        <li>Phasenverschiebung messen</li>
                        <li>Zeitverzögerungen quantifizieren</li>
                        <li>Sensor-Korrelation analysieren</li>
                        <li>Synchronisationsprobleme identifizieren</li>
                    </ul>

                    <h4>Gemeinsame Funktionen aller Anmerkungen:</h4>
                    <ul>
                        <li>✅ Speicherung in HSP-Projekten</li>
                        <li>✅ Individuell ein/ausblendbar</li>
                        <li>✅ Editierbare Notizen</li>
                        <li>✅ Anpassbarer Dateiname</li>
                    </ul>
                `
            },
            navigation: {
                title: "🧭 Navigation und Zoom",
                content: `
                    <h4>Maus-Navigation</h4>
                    <ul>
                        <li><strong>Mausrad:</strong> Zoom In/Out auf X-Achse</li>
                        <li><strong>Shift + Mausrad:</strong> Zoom In/Out auf Y-Achse</li>
                        <li><strong>Klicken + Ziehen:</strong> Diagramm verschieben</li>
                        <li><strong>Doppelklick:</strong> Zoom zurücksetzen</li>
                    </ul>

                    <h4>Zoom-Buttons</h4>
                    <p>In der Werkzeugleiste verfügbar:</p>
                    <ul>
                        <li><strong>Zoom +:</strong> Hineinzoomen</li>
                        <li><strong>Zoom -:</strong> Herauszoomen</li>
                        <li><strong>Zoom Reset:</strong> Vollständige Ansicht wiederherstellen</li>
                    </ul>

                    <h4>Ansichten (Views)</h4>
                    <p>System zum Speichern und Abrufen von Zoom-Konfigurationen:</p>
                    <h5>Ansicht speichern:</h5>
                    <ol>
                        <li>Navigieren Sie zum gewünschten Zoom-Bereich</li>
                        <li>Klicken Sie auf "Ansicht speichern"</li>
                        <li>Die aktuelle Konfiguration wird gespeichert (xMin, xMax, yMin, yMax)</li>
                    </ol>

                    <h5>Ansicht laden:</h5>
                    <ol>
                        <li>Klicken Sie auf "Ansicht laden"</li>
                        <li>Das Diagramm kehrt zur gespeicherten Konfiguration zurück</li>
                    </ol>

                    <h5>Praktische Nutzung:</h5>
                    <ul>
                        <li>Schneller Wechsel zwischen Übersicht und Details</li>
                        <li>Vergleich verschiedener Zeitbereiche</li>
                        <li>Wiederholbare Analysen</li>
                        <li>Präsentationen mit vordefinierten Ansichten</li>
                    </ul>

                    <h4>Voreinstellungen (Presets)</h4>
                    <p>Globale Einstellungen für schnellen Zugriff:</p>
                    <ul>
                        <li><strong>Preset speichern:</strong> Speichert Parameter wie:
                            <ul>
                                <li>FFT/STFT-Fensterbreite</li>
                                <li>Fensterfunktion</li>
                                <li>Überlappung</li>
                                <li>Farbskala</li>
                                <li>Glättung</li>
                            </ul>
                        </li>
                        <li><strong>Preset laden:</strong> Stellt gespeicherte Konfiguration wieder her</li>
                    </ul>

                    <h4>Tooltips</h4>
                    <p>Interaktive Wertanzeige beim Überfahren:</p>
                    <ul>
                        <li><strong>Aktivierung:</strong> Checkbox "Info beim Überfahren" in den Einstellungen</li>
                        <li><strong>Anzeige:</strong> X- und Y-Werte am Mauszeiger</li>
                        <li><strong>Nutzung:</strong> Schnelle Werteablesung ohne Werkzeug</li>
                    </ul>

                    <h4>Legende</h4>
                    <p>Zeigt Informationen über alle aktiven Kanäle:</p>
                    <ul>
                        <li>Kanalname</li>
                        <li>Farbe (klickbar zum Ein/Ausblenden)</li>
                        <li>Einheit</li>
                        <li>Aktueller Wert (wenn Tooltip aktiv)</li>
                    </ul>
                `
            },
            channels: {
                title: "📊 Kanalverwaltung",
                content: `
                    <h4>Kanalkonfiguration</h4>
                    <p>Zugriff über den <strong>⚙️ Button</strong> in der Werkzeugleiste. Öffnet ein Dialog-Fenster mit vollständiger Kanalkontrolle.</p>

                    <h4>Kanaloptionen</h4>
                    <p>Für jeden Kanal verfügbar:</p>
                    <ul>
                        <li><strong>Name:</strong> Editierbarer Kanalname (Standard: ch0, ch1, etc.)</li>
                        <li><strong>Einheit:</strong> Physikalische Einheit (V, A, °C, Pa, etc.)</li>
                        <li><strong>Beschreibung:</strong> Detaillierte Anmerkungen zum Kanal</li>
                        <li><strong>Farbe:</strong> Linienfarbe (klickbar zum Ändern)</li>
                        <li><strong>Sichtbarkeit:</strong> Checkbox zum Ein/Ausblenden</li>
                        <li><strong>Löschen:</strong> Kanal vollständig entfernen</li>
                    </ul>

                    <h4>Berechnete Kanäle</h4>
                    <p>Erstellen Sie neue Kanäle aus mathematischen Ausdrücken:</p>

                    <h5>Erstellen:</h5>
                    <ol>
                        <li>Öffnen Sie die Kanalkonfiguration</li>
                        <li>Klicken Sie auf "Berechneten Kanal hinzufügen"</li>
                        <li>Geben Sie eine Formel ein (z.B., <code>sqrt(ch0^2 + ch1^2)</code>)</li>
                        <li>Konfigurieren Sie Name, Einheit, Farbe</li>
                        <li>Der Kanal wird berechnet und angezeigt</li>
                    </ol>

                    <h5>Unterstützte Operationen:</h5>
                    <ul>
                        <li><strong>Arithmetik:</strong> +, -, *, /, ^</li>
                        <li><strong>Funktionen:</strong> sqrt, abs, sin, cos, tan, log, exp</li>
                        <li><strong>Referenzen:</strong> ch0, ch1, ch2, ... (Kanalnummern)</li>
                        <li><strong>Konstanten:</strong> pi, e</li>
                    </ul>

                    <h5>Beispiele:</h5>
                    <ul>
                        <li><code>ch0 + ch1</code> - Summe zweier Kanäle</li>
                        <li><code>ch0 - ch1</code> - Differenz</li>
                        <li><code>sqrt(ch0^2 + ch1^2)</code> - Magnitude</li>
                        <li><code>ch0 / 1000</code> - Skalierung (mV zu V)</li>
                        <li><code>abs(ch0)</code> - Absolutwert</li>
                        <li><code>(ch0 + ch1) / 2</code> - Durchschnitt</li>
                    </ul>

                    <h4>Multi-Achsen-Unterstützung</h4>
                    <p>HydraSpec Pro unterstützt <strong>unbegrenzte Y-Achsen</strong>:</p>
                    <ul>
                        <li>Jeder Kanal kann eigene Y-Skala haben</li>
                        <li>Unterschiedliche Einheiten nebeneinander anzeigbar</li>
                        <li>Automatische Farbcodierung</li>
                        <li>Individuelle Auto-Skalierung</li>
                    </ul>
                    <p><strong>Beispiel:</strong> Temperatur (°C), Druck (Pa) und Spannung (V) gleichzeitig anzeigen.</p>

                    <h4>Kanalpersistenz</h4>
                    <p>Alle Kanalkonfigurationen werden gespeichert:</p>
                    <ul>
                        <li>✅ In HSP-Projekten</li>
                        <li>✅ Im Browser-localStorage (automatisch)</li>
                        <li>✅ Berechnete Kanäle mit Formeln</li>
                        <li>✅ Farben und Sichtbarkeit</li>
                    </ul>
                `
            },
            configuration: {
                title: "⚙️ Konfiguration und Personalisierung",
                content: `
                    <h4>Globale Einstellungen</h4>
                    <p>Zugriff über <strong>"Einstellungen"</strong> im Header. Hauptkategorien:</p>

                    <h4>1. Analyseeinstellungen</h4>
                    <ul>
                        <li><strong>FFT-Fensterbreite:</strong> 512 / 1024 / 2048 / 4096 / 8192 Punkte</li>
                        <li><strong>STFT-Fensterbreite:</strong> 256 / 512 / 1024 / 2048 / 4096 / 8192</li>
                        <li><strong>STFT-Überlappung:</strong> 0% bis 95% (Schritte von 5%)</li>
                        <li><strong>Fensterfunktion:</strong> Rechteck / Hann / Hamming / Blackman</li>
                        <li><strong>Glättung:</strong> 1 bis 1000 Punkte gleitender Durchschnitt</li>
                    </ul>

                    <h4>2. Visualisierungseinstellungen</h4>
                    <ul>
                        <li><strong>STFT-Farbskala:</strong> Viridis / Plasma / Inferno / Magma / Turbo / Jet</li>
                        <li><strong>Dunkler Modus:</strong> Ein/Aus (gesamte Anwendung)</li>
                        <li><strong>Tooltips:</strong> Info beim Überfahren aktivieren/deaktivieren</li>
                        <li><strong>Legende:</strong> Ein/Aus</li>
                    </ul>

                    <h4>3. Werkzeug-Sichtbarkeit</h4>
                    <p>Globale Schalter für Anmerkungen:</p>
                    <ul>
                        <li>Markierungen anzeigen/verbergen</li>
                        <li>Intervalle anzeigen/verbergen</li>
                        <li>Diff/Kanäle anzeigen/verbergen</li>
                        <li>Lineale anzeigen/verbergen</li>
                    </ul>

                    <h4>4. Sprache</h4>
                    <p>Mehrsprachige Oberfläche:</p>
                    <ul>
                        <li>🇫🇷 Französisch</li>
                        <li>🇬🇧 Englisch</li>
                        <li>🇩🇪 Deutsch</li>
                    </ul>
                    <p>Alle Texte, Tooltips und diese Hilfe ändern sich sofort beim Sprachwechsel.</p>

                    <h4>Voreinstellungen (Presets)</h4>
                    <p>Speichern Sie Ihre bevorzugten Konfigurationen:</p>
                    <ul>
                        <li><strong>Speichern:</strong> Alle Analyseeinstellungen in einer Konfiguration speichern</li>
                        <li><strong>Laden:</strong> Gespeicherte Konfiguration anwenden</li>
                        <li><strong>Nutzung:</strong> Perfekt für wiederkehrende Analysetypen</li>
                    </ul>
                    <p><strong>Gespeichert werden:</strong> Fensterbreiten, Funktionen, Überlappung, Glättung, Farbskala</p>

                    <h4>Lokale Speicherung</h4>
                    <p>Die Anwendung nutzt localStorage für Persistenz:</p>
                    <ul>
                        <li>✅ Kanalkonfigurationen</li>
                        <li>✅ Sprachpräferenz</li>
                        <li>✅ Dunkler Modus Zustand</li>
                        <li>✅ Tooltip-Einstellungen</li>
                        <li>✅ Ansichten (Views)</li>
                        <li>✅ Voreinstellungen (Presets)</li>
                    </ul>
                    <p><strong>Vorteil:</strong> Ihre Präferenzen bleiben auch nach Browserneustart erhalten.</p>

                    <h4>Themen (Dark Mode)</h4>
                    <p>Vollständige dunkle Oberfläche:</p>
                    <ul>
                        <li>Schont die Augen bei längerer Nutzung</li>
                        <li>Professionelles Aussehen</li>
                        <li>Besserer Kontrast für Diagramme</li>
                        <li>Automatische Anpassung aller Farben</li>
                    </ul>
                `
            },
            shortcuts: {
                title: "⌨️ Tastaturkürzel",
                content: `
                    <h4>Allgemeine Navigation</h4>
                    <ul>
                        <li><strong>Esc:</strong> Aktives Werkzeug abbrechen / Dialog schließen</li>
                        <li><strong>Ctrl + Z:</strong> Letzte Aktion rückgängig (geplant)</li>
                        <li><strong>Ctrl + Y:</strong> Wiederherstellen (geplant)</li>
                    </ul>

                    <h4>Zoom-Kürzel</h4>
                    <ul>
                        <li><strong>+:</strong> Hineinzoomen</li>
                        <li><strong>-:</strong> Herauszoomen</li>
                        <li><strong>0:</strong> Zoom zurücksetzen</li>
                        <li><strong>Mausrad:</strong> X-Achse Zoom</li>
                        <li><strong>Shift + Mausrad:</strong> Y-Achse Zoom</li>
                    </ul>

                    <h4>Werkzeugauswahl (Nummerntasten)</h4>
                    <ul>
                        <li><strong>1:</strong> Zeitbereichsansicht</li>
                        <li><strong>2:</strong> FFT-Ansicht</li>
                        <li><strong>3:</strong> STFT/Spektrogramm-Ansicht</li>
                        <li><strong>4:</strong> Messwerkzeug aktivieren</li>
                        <li><strong>5:</strong> Linealwerkzeug aktivieren</li>
                        <li><strong>6:</strong> Verfolgungswerkzeug aktivieren</li>
                        <li><strong>7:</strong> Markierungswerkzeug aktivieren</li>
                        <li><strong>8:</strong> Intervallwerkzeug aktivieren</li>
                        <li><strong>9:</strong> Diff/Kanal-Werkzeug aktivieren</li>
                    </ul>

                    <h4>Datei-Operationen</h4>
                    <ul>
                        <li><strong>Ctrl + O:</strong> CSV öffnen</li>
                        <li><strong>Ctrl + S:</strong> HSP speichern</li>
                        <li><strong>Ctrl + Shift + S:</strong> Ansicht speichern</li>
                        <li><strong>Ctrl + E:</strong> Bild exportieren</li>
                    </ul>

                    <h4>Ansichts-Toggle</h4>
                    <ul>
                        <li><strong>L:</strong> Legende ein/aus</li>
                        <li><strong>T:</strong> Tooltips ein/aus</li>
                        <li><strong>M:</strong> Markierungen ein/aus</li>
                        <li><strong>I:</strong> Intervalle ein/aus</li>
                        <li><strong>D:</strong> Diff/Kanäle ein/aus</li>
                    </ul>

                    <h4>Dialog-Kürzel</h4>
                    <ul>
                        <li><strong>Ctrl + ,:</strong> Einstellungen öffnen</li>
                        <li><strong>F1:</strong> Hilfe öffnen</li>
                        <li><strong>Ctrl + K:</strong> Kanalkonfiguration öffnen</li>
                    </ul>

                    <h4>Tipps zur Effizienz</h4>
                    <ul>
                        <li>Lernen Sie die Nummerntasten 1-9 für schnellen Werkzeugwechsel</li>
                        <li>Nutzen Sie Esc zum schnellen Abbrechen von Aktionen</li>
                        <li>Kombinieren Sie Shift + Mausrad für präzises Zoomen</li>
                        <li>Verwenden Sie Ctrl + S häufig, um Ihre Arbeit zu speichern</li>
                    </ul>

                    <p><em>Hinweis: Einige Tastaturkürzel können je nach Browser und Betriebssystem variieren.</em></p>
                `
            },
            tips: {
                title: "💡 Tipps und Best Practices",
                content: `
                    <h4>Workflow-Optimierung</h4>
                    <ol>
                        <li><strong>Projekt strukturieren:</strong>
                            <ul>
                                <li>Laden Sie Ihre Daten</li>
                                <li>Konfigurieren Sie sofort alle Kanäle (Namen, Einheiten)</li>
                                <li>Speichern Sie als HSP bevor Sie komplexe Analysen starten</li>
                            </ul>
                        </li>
                        <li><strong>Explorative Analyse:</strong>
                            <ul>
                                <li>Beginnen Sie im Zeitbereich für Überblick</li>
                                <li>Identifizieren Sie interessante Bereiche</li>
                                <li>Nutzen Sie Ansichten, um Positionen zu merken</li>
                                <li>Wechseln Sie zu FFT/STFT für Details</li>
                            </ul>
                        </li>
                        <li><strong>Systematische Annotation:</strong>
                            <ul>
                                <li>Markieren Sie wichtige Punkte während der Analyse</li>
                                <li>Nutzen Sie Intervalle für Phasen/Zustände</li>
                                <li>Fügen Sie beschreibende Notizen hinzu</li>
                                <li>Organisieren Sie mit klaren Namenskonventionen</li>
                            </ul>
                        </li>
                    </ol>

                    <h4>FFT/STFT Best Practices</h4>
                    <ul>
                        <li><strong>Fensterbreite wählen:</strong>
                            <ul>
                                <li>Für stationäre Signale: Große Fenster (4096-8192)</li>
                                <li>Für transiente Ereignisse: Kleine Fenster (512-1024)</li>
                                <li>Für Kompromiss: Mittlere Fenster (2048)</li>
                            </ul>
                        </li>
                        <li><strong>Fensterfunktion:</strong>
                            <ul>
                                <li>Hann für die meisten Anwendungen</li>
                                <li>Blackman für extreme Leakage-Unterdrückung</li>
                                <li>Rechteck nur für perfekt periodische Signale</li>
                            </ul>
                        </li>
                        <li><strong>Überlappung (STFT):</strong>
                            <ul>
                                <li>50% für Standard-Analysen</li>
                                <li>75-90% für sehr glatte Spektrogramme</li>
                                <li>Niedriger für Echtzeitanwendungen (Performance)</li>
                            </ul>
                        </li>
                    </ul>

                    <h4>Performance-Tipps</h4>
                    <ul>
                        <li>Deaktivieren Sie nicht benötigte Kanäle</li>
                        <li>Reduzieren Sie STFT-Überlappung für schnellere Berechnung</li>
                        <li>Nutzen Sie Ansichten statt wiederholtem Zoomen</li>
                        <li>Speichern Sie regelmäßig (Auto-Save kommt)</li>
                        <li>Schließen Sie ungenutzte Dialoge</li>
                    </ul>

                    <h4>Datenqualität</h4>
                    <ul>
                        <li><strong>CSV-Vorbereitung:</strong>
                            <ul>
                                <li>Verwenden Sie konsistente Trennzeichen</li>
                                <li>Fügen Sie beschreibende Header hinzu</li>
                                <li>Prüfen Sie auf fehlende Werte</li>
                                <li>Verwenden Sie einheitliche Zeitstempel</li>
                            </ul>
                        </li>
                        <li><strong>Abtastrate:</strong>
                            <ul>
                                <li>Nyquist-Theorem beachten (fs ≥ 2 × fmax)</li>
                                <li>Aliasing vermeiden</li>
                                <li>Konstante Abtastrate für FFT/STFT</li>
                            </ul>
                        </li>
                    </ul>

                    <h4>Kollaboration</h4>
                    <ul>
                        <li>Speichern Sie Projekte als HSP für Teamarbeit</li>
                        <li>Nutzen Sie beschreibende Markierungs-Notizen</li>
                        <li>Exportieren Sie Bilder für Berichte</li>
                        <li>Verwenden Sie Voreinstellungen für konsistente Analysen</li>
                        <li>Dokumentieren Sie wichtige Erkenntnisse in Intervall-Notizen</li>
                    </ul>

                    <h4>Häufige Fehler vermeiden</h4>
                    <ul>
                        <li>❌ Zu schmale FFT-Fenster für Frequenzpräzision</li>
                        <li>❌ Rechteck-Fenster für nicht-periodische Signale</li>
                        <li>❌ Vergessen, HSP zu speichern vor dem Schließen</li>
                        <li>❌ Aliasing durch zu niedrige Abtastrate</li>
                        <li>❌ Zu viele Kanäle gleichzeitig anzeigen</li>
                    </ul>

                    <h4>Erweiterte Techniken</h4>
                    <ul>
                        <li><strong>Berechnete Kanäle nutzen für:</strong>
                            <ul>
                                <li>Magnitude-Berechnung (sqrt(x² + y²))</li>
                                <li>Phasendifferenzen</li>
                                <li>Normalisierung</li>
                                <li>Filterung (über Durchschnitt)</li>
                            </ul>
                        </li>
                        <li><strong>Diff/Kanal für:</strong>
                            <ul>
                                <li>Sensor-Korrelation</li>
                                <li>Zeitverzögerungs-Analyse</li>
                                <li>Phasenverschiebungs-Messung</li>
                            </ul>
                        </li>
                        <li><strong>Intervalle für:</strong>
                            <ul>
                                <li>Segmentierte Statistiken</li>
                                <li>Zustandsklassifizierung</li>
                                <li>Event-Tracking</li>
                            </ul>
                        </li>
                    </ul>

                    <h4>Ressourcen</h4>
                    <ul>
                        <li>Experimentieren Sie mit Demo-Daten</li>
                        <li>Nutzen Sie verschiedene Farbskalen für unterschiedliche Einsichten</li>
                        <li>Kombinieren Sie mehrere Werkzeuge für umfassende Analysen</li>
                        <li>Speichern Sie Voreinstellungen für verschiedene Analysetypen</li>
                    </ul>
                `
            }
        }
    }
};
