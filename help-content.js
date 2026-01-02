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
        // English content will be added
        title: "Help & Technical Details - HydraSpec Pro",
        // ... Similar structure as fr
    },
    de: {
        // German content will be added
        title: "Hilfe & Technische Details - HydraSpec Pro",
        // ... Similar structure as fr
    }
};
