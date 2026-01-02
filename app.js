console.log("Chargement de l'application...");
// --- TRANSLATIONS ---
const i18n = {
    fr: {
        file: "Fichier",
        load_csv: "Importer fichier .csv",
        open_proj: "Ouvrir fichier .hsp",
        save_proj: "Enregistrer fichier .HSP",
        generator: "Générateur",
        export_csv: "Exporter fichier .csv",
        export_png: "Exporter PNG",
        settings: "Paramètres",
        help: "Aide",
        acquisition: "Acquisition",
        channel: "Canal:",
        step_ms: "Pas (ms):",
        fs_label: "Fs:",
        points_n: "Points (N):",
        stats_zone: "Stats (Zone Curseurs)",
        min: "Min:",
        max: "Max:",
        mean: "Moyenne:",
        std: "Écart Type:",
        fft_params: "Paramètres FFT",
        window: "Fenêtre:",
        fft_pts: "Points FFT:",
        peak_sens: "Sensibilité Pics:",
        spectrogram: "Spectrogramme",
        notes: "Annotations",
        results: "Résultats",
        freq_dom: "Fréq. Pic Principal:",
        amp_max: "Amp. Pic Principal:",
        rms_sel: "RMS Sélection:",
        time_domain: "DOMAINE TEMPOREL",
        freq_domain: "DOMAINE FRÉQUENTIEL",
        dirac_spec: "(Spectre de Dirac/FFT)",
        language: "Langue",
        theme: "Thème",
        help_title: "Aide & Détails Techniques - HydraSpec Pro V1.4.0",
        help_text: `
            <nav class="help-nav" style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
                <strong>Navigation Rapide:</strong>
                <a href="#time-domain" style="color: var(--accent-blue); margin: 0 10px;">Temporel</a>
                <a href="#freq-domain" style="color: var(--accent-blue); margin: 0 10px;">Fréquentiel</a>
                <a href="#spectrogram" style="color: var(--accent-blue); margin: 0 10px;">Spectrogramme</a>
                <a href="#generator" style="color: var(--accent-blue); margin: 0 10px;">Générateur</a>
                <a href="#import-export" style="color: var(--accent-blue); margin: 0 10px;">Fichiers</a>
                <a href="#settings" style="color: var(--accent-blue); margin: 0 10px;">Paramètres</a>
            </nav>

            <section id="time-domain">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-stopwatch"></i> Analyse Temporelle
                </h4>
                <p>L'analyse temporelle vous permet d'étudier l'évolution du signal pression/temps.</p>
                
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
                </ul>
            </section>

            <section id="freq-domain" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-wave-square"></i> Analyse Fréquentielle (FFT)
                </h4>
                <p>La Transformée de Fourier Rapide (FFT) révèle le contenu fréquentiel du signal.</p>

                <h5>Paramètres FFT</h5>
                <ul>
                    <li><strong>Fenêtre :</strong>
                        <ul>
                            <li><strong>Rectangulaire :</strong> Pour transitoires commençant/finissant à zéro</li>
                            <li><strong>Hanning (recommandé) :</strong> Standard pour l'analyse vibratoire</li>
                            <li><strong>Hamming :</strong> Bonne séparation de fréquences proches</li>
                            <li><strong>Blackman :</strong> Meilleure précision d'amplitude</li>
                        </ul>
                    </li>
                    <li><strong>Points FFT :</strong> Définit la résolution fréquentielle
                        <ul>
                            <li>Résolution = Fs / N (ex: 1000Hz/4096pts = 0.24Hz)</li>
                            <li>Plus de points = meilleure résolution mais calcul plus long</li>
                        </ul>
                    </li>
                    <li><strong>Sensibilité Pics :</strong> Ajuste le seuil de détection des pics (échelle logarithmique)</li>
                </ul>

                <h5>Interprétation du Spectre</h5>
                <ul>
                    <li><strong>Fréquence Dominante :</strong> Pic le plus important du spectre</li>
                    <li><strong>Amplitude Max :</strong> Amplitude du pic dominant</li>
                    <li><strong>Pics secondaires :</strong> Harmoniques ou composantes additionnelles</li>
                    <li><strong>Bruit de fond :</strong> Niveau de base entre les pics</li>
                </ul>
            </section>

            <section id="spectrogram" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-chart-area"></i> Spectrogramme STFT
                </h4>
                <p>Le spectrogramme montre l'évolution des fréquences dans le temps (Short-Time Fourier Transform).</p>

                <h5>Paramètres STFT</h5>
                <ul>
                    <li><strong>Fenêtre STFT :</strong> Taille de chaque segment analysé
                        <ul>
                            <li>Petite fenêtre = Bonne résolution temporelle, mauvaise résolution fréquentielle</li>
                            <li>Grande fenêtre = Bonne résolution fréquentielle, mauvaise résolution temporelle</li>
                        </ul>
                    </li>
                    <li><strong>Recouvrement :</strong> Pourcentage de chevauchement entre fenêtres
                        <ul>
                            <li>50-75% recommandé pour une visualisation fluide</li>
                        </ul>
                    </li>
                    <li><strong>Échelle :</strong>
                        <ul>
                            <li><strong>Linéaire :</strong> Représentation directe de l'amplitude</li>
                            <li><strong>Logarithmique :</strong> Meilleure dynamique pour petits signaux</li>
                            <li><strong>dB :</strong> Échelle décibels pour l'acoustique</li>
                        </ul>
                    </li>
                    <li><strong>Fréquence Max :</strong> Limite l'affichage aux basses fréquences</li>
                </ul>

                <h5>Applications Typiques</h5>
                <ul>
                    <li><strong>Transitoires :</strong> Chocs, impacts, démarrages</li>
                    <li><strong>Modulations :</strong> Variation de fréquence dans le temps</li>
                    <li><strong>Changements de régime :</strong> Évolution des vibrations machines</li>
                    <li><strong>Analyse vocale :</strong> Formants et phonèmes</li>
                </ul>
            </section>

            <section id="generator" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-wave-square"></i> Générateur de Signal
                </h4>
                <p>Créez des signaux synthétiques pour tester l'analyseur ou simuler des phénomènes.</p>

                <h5>Paramètres de Base</h5>
                <ul>
                    <li><strong>Fs (Hz) :</strong> Fréquence d'échantillonnage</li>
                    <li><strong>Durée (s) :</strong> Longueur du signal généré</li>
                    <li><strong>Bruit (Bar) :</strong> Amplitude du bruit blanc ajouté</li>
                    <li><strong>DC (Bar) :</strong> Composante continue (offset)</li>
                </ul>

                <h5>Composantes Sinusoïdales</h5>
                <ul>
                    <li><strong>Fréquence (Hz) :</strong> Fréquence de la sinusoïde</li>
                    <li><strong>Amplitude (Bar) :</strong> Amplitude du signal</li>
                    <li><strong>Phase (°) :</strong> Déphasage en degrés</li>
                    <li><strong>Ajout/Suppression :</strong> Boutons +/- pour gérer les composantes</li>
                </ul>
            </section>

            <section id="import-export" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-file-export"></i> Importation & Exportation
                </h4>

                <h5>Formats Supportés</h5>
                <ul>
                    <li><strong>.csv :</strong> Données format CSV (temps;valeur)</li>
                    <li><strong>.hsp :</strong> Projet HydraSpec (données + paramètres)</li>
                    <li><strong>.png :</strong> Capture d'écran des graphiques</li>
                </ul>

                <h5>Bonnes Pratiques</h5>
                <ul>
                    <li><strong>Données CSV :</strong> Format "Temps(ms);Valeur" avec en-tête</li>
                    <li><strong>Fréquence d'échantillonnage :</strong> Calculée automatiquement à partir de l'incrément</li>
                    <li><strong>Projets :</strong> Sauvegardez fréquemment pour ne pas perdre votre travail</li>
                    <li><strong>Export PNG :</strong> Fermez les modales avant la capture</li>
                </ul>
            </section>

            <section id="settings" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-cog"></i> Paramètres & Personnalisation
                </h4>

                <h5>Thèmes Visuels</h5>
                <ul>
                    <li><strong>Sombre :</strong> Par défaut, reposant pour les yeux</li>
                    <li><strong>Clair :</strong> Meilleure lisibilité en conditions lumineuses</li>
                    <li><strong>Steampunk :</strong> Thème décoratif rétro</li>
                </ul>

                <h5>Langues</h5>
                <ul>
                    <li><strong>Français :</strong> Interface complète</li>
                    <li><strong>English :</strong> Full English interface</li>
                    <li><strong>Deutsch :</strong> Deutsche Benutzeroberfläche</li>
                </ul>
            </section>

            <section id="tips" style="margin-top: 25px; background: var(--input-bg); padding: 15px; border-radius: 5px;">
                <h4 style="color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-lightbulb"></i> Conseils Pratiques
                </h4>
                
                <h5>Pour l'Analyse Vibratoire</h5>
                <ul>
                    <li>Utilisez la fenêtre <strong>Hanning</strong> pour les vibrations continues</li>
                    <li>Choisissez <strong>4096 points FFT</strong> pour un bon compromis résolution/calcul</li>
                    <li>Pour les chocs, utilisez la fenêtre <strong>Rectangulaire</strong></li>
                    <li>Vérifiez que votre sélection temporelle contient des cycles complets</li>
                </ul>

                <h5>Dépannage Courant</h5>
                <ul>
                    <li><strong>Spectre plat :</strong> Vérifiez la sélection temporelle et le DC offset</li>
                    <li><strong>Pics multiples :</strong> Ajustez la sensibilité des pics</li>
                    <li><strong>Fuites spectrales :</strong> Changez de fenêtre ou augmentez les points FFT</li>
                    <li><strong>Calculs lents :</strong> Réduisez les points FFT ou la durée d'analyse</li>
                </ul>
            </section>
        `
    },
    en: {
        file: "File",
        load_csv: "Import .csv File",
        open_proj: "Open .hsp File",
        save_proj: "Save .HSP File",
        generator: "Generator",
        export_csv: "Export .csv File",
        export_png: "Export PNG",
        settings: "Settings",
        help: "Help",
        acquisition: "Acquisition",
        channel: "Channel:",
        step_ms: "Step (ms):",
        fs_label: "Fs:",
        points_n: "Points (N):",
        stats_zone: "Stats (Cursor Zone)",
        min: "Min:",
        max: "Max:",
        mean: "Mean:",
        std: "Std Dev:",
        fft_params: "FFT Parameters",
        window: "Window:",
        fft_pts: "FFT Points:",
        peak_sens: "Peak Sens:",
        spectrogram: "Spectrogram",
        notes: "Annotations",
        results: "Results",
        freq_dom: "Main Peak Freq:",
        amp_max: "Main Peak Amp:",
        rms_sel: "RMS Sel:",
        time_domain: "TIME DOMAIN",
        freq_domain: "FREQUENCY DOMAIN",
        dirac_spec: "(Dirac Spectrum/FFT)",
        language: "Language",
        theme: "Theme",
        help_title: "Help & Technical Details - HydraSpec Pro V1.4.0",
        help_text: `
            <nav class="help-nav" style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
                <strong>Quick Navigation:</strong>
                <a href="#time-domain" style="color: var(--accent-blue); margin: 0 10px;">Time</a>
                <a href="#freq-domain" style="color: var(--accent-blue); margin: 0 10px;">Frequency</a>
                <a href="#spectrogram" style="color: var(--accent-blue); margin: 0 10px;">Spectrogram</a>
                <a href="#generator" style="color: var(--accent-blue); margin: 0 10px;">Generator</a>
                <a href="#import-export" style="color: var(--accent-blue); margin: 0 10px;">Files</a>
                <a href="#settings" style="color: var(--accent-blue); margin: 0 10px;">Settings</a>
            </nav>

            <section id="time-domain">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-stopwatch"></i> Time Domain Analysis
                </h4>
                <p>Time domain analysis allows you to study the pressure signal evolution over time.</p>
                
                <h5>Selection Cursors</h5>
                <ul>
                    <li><strong>Green Cursor (Start):</strong> Define the beginning of the analysis zone</li>
                    <li><strong>Red Cursor (End):</strong> Define the end of the analysis zone</li>
                    <li><strong>Moving:</strong> Click and drag on a cursor to move it</li>
                    <li><strong>Group Move:</strong> Shift + click between cursors to move both together</li>
                </ul>

                <h5>Zoom & Navigation</h5>
                <ul>
                    <li><strong>Mouse Wheel:</strong> Zoom X and Y simultaneously</li>
                    <li><strong>Shift + Wheel:</strong> Vertical zoom (Y) only</li>
                    <li><strong>Ctrl + Wheel:</strong> Horizontal zoom (X) only</li>
                    <li><strong>Pan:</strong> Click and drag outside cursors to navigate</li>
                    <li><strong>Manual Zoom:</strong> Use "Min/Max (s)" fields for precise zoom control</li>
                </ul>

                <h5>Statistics (Selected Zone)</h5>
                <ul>
                    <li><strong>Min/Max:</strong> Extreme values of the signal</li>
                    <li><strong>Mean:</strong> Arithmetic average value</li>
                    <li><strong>Std Dev:</strong> Dispersion of values around the mean</li>
                    <li><strong>RMS:</strong> Root Mean Square value (effective value)</li>
                </ul>
            </section>

            <section id="freq-domain" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-wave-square"></i> Frequency Analysis (FFT)
                </h4>
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
                    <li><strong>Dominant Frequency:</strong> Most important peak in the spectrum</li>
                    <li><strong>Max Amplitude:</strong> Amplitude of the dominant peak</li>
                    <li><strong>Secondary Peaks:</strong> Harmonics or additional components</li>
                    <li><strong>Background Noise:</strong> Baseline level between peaks</li>
                </ul>
            </section>

            <section id="spectrogram" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-chart-area"></i> STFT Spectrogram
                </h4>
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
                        </ul>
                    </li>
                    <li><strong>Scale:</strong>
                        <ul>
                            <li><strong>Linear:</strong> Direct amplitude representation</li>
                            <li><strong>Logarithmic:</strong> Better dynamic range for small signals</li>
                            <li><strong>dB:</strong> Decibel scale for acoustic analysis</li>
                        </ul>
                    </li>
                    <li><strong>Max Frequency:</strong> Limits display to lower frequencies</li>
                </ul>

                <h5>Typical Applications</h5>
                <ul>
                    <li><strong>Transients:</strong> Shocks, impacts, startups</li>
                    <li><strong>Modulations:</strong> Frequency variations over time</li>
                    <li><strong>Regime Changes:</strong> Machine vibration evolution</li>
                    <li><strong>Speech Analysis:</strong> Formants and phonemes</li>
                </ul>
            </section>

            <section id="generator" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-wave-square"></i> Signal Generator
                </h4>
                <p>Create synthetic signals to test the analyzer or simulate phenomena.</p>

                <h5>Basic Parameters</h5>
                <ul>
                    <li><strong>Fs (Hz):</strong> Sampling frequency</li>
                    <li><strong>Duration (s):</strong> Length of generated signal</li>
                    <li><strong>Noise (Bar):</strong> Amplitude of added white noise</li>
                    <li><strong>DC (Bar):</strong> Continuous component (offset)</li>
                </ul>

                <h5>Sinusoidal Components</h5>
                <ul>
                    <li><strong>Frequency (Hz):</strong> Sine wave frequency</li>
                    <li><strong>Amplitude (Bar):</strong> Signal amplitude</li>
                    <li><strong>Phase (°):</strong> Phase shift in degrees</li>
                    <li><strong>Add/Remove:</strong> +/- buttons to manage components</li>
                </ul>
            </section>

            <section id="import-export" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-file-export"></i> Import & Export
                </h4>

                <h5>Supported Formats</h5>
                <ul>
                    <li><strong>.csv:</strong> CSV format data (time;value)</li>
                    <li><strong>.hsp:</strong> HydraSpec project (data + parameters)</li>
                    <li><strong>.png:</strong> Screenshot of graphs</li>
                </ul>

                <h5>Best Practices</h5>
                <ul>
                    <li><strong>CSV data:</strong> "Time(ms);Value" format with header</li>
                    <li><strong>Sampling frequency:</strong> Automatically calculated from increment</li>
                    <li><strong>Projects:</strong> Save frequently to avoid losing work</li>
                    <li><strong>Export PNG:</strong> Close modals before capture</li>
                </ul>
            </section>

            <section id="settings" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-cog"></i> Settings & Customization
                </h4>

                <h5>Visual Themes</h5>
                <ul>
                    <li><strong>Dark:</strong> Default, easy on the eyes</li>
                    <li><strong>Light:</strong> Better readability in bright conditions</li>
                    <li><strong>Steampunk:</strong> Decorative retro theme</li>
                </ul>

                <h5>Languages</h5>
                <ul>
                    <li><strong>French:</strong> Complete interface</li>
                    <li><strong>English:</strong> Full English interface</li>
                    <li><strong>German:</strong> German user interface</li>
                </ul>
            </section>

            <section id="tips" style="margin-top: 25px; background: var(--input-bg); padding: 15px; border-radius: 5px;">
                <h4 style="color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-lightbulb"></i> Practical Tips
                </h4>
                
                <h5>For Vibration Analysis</h5>
                <ul>
                    <li>Use <strong>Hanning</strong> window for continuous vibrations</li>
                    <li>Choose <strong>4096 FFT points</strong> for good resolution/computation balance</li>
                    <li>For shocks, use <strong>Rectangular</strong> window</li>
                    <li>Ensure your time selection contains complete cycles</li>
                </ul>

                <h5>Troubleshooting</h5>
                <ul>
                    <li><strong>Flat spectrum:</strong> Check time selection and DC offset</li>
                    <li><strong>Multiple peaks:</strong> Adjust peak sensitivity</li>
                    <li><strong>Spectral leakage:</strong> Change window or increase FFT points</li>
                    <li><strong>Slow calculations:</strong> Reduce FFT points or analysis duration</li>
                </ul>
            </section>
        `
    },
    de: {
        file: "Datei",
        load_csv: ".csv Datei importieren",
        open_proj: ".hsp Datei öffnen",
        save_proj: ".HSP Datei speichern",
        generator: "Generator",
        export_csv: ".csv Datei exportieren",
        export_png: "PNG exportieren",
        settings: "Einstellungen",
        help: "Hilfe",
        acquisition: "Erfassung",
        channel: "Kanal:",
        step_ms: "Schritt (ms):",
        fs_label: "Fs:",
        points_n: "Punkte (N):",
        stats_zone: "Statistik (Cursor)",
        min: "Min:",
        max: "Max:",
        mean: "Mittelwert:",
        std: "StdAbw:",
        fft_params: "FFT Parameter",
        window: "Fenster:",
        fft_pts: "FFT Punkte:",
        peak_sens: "Spitzen-Sens:",
        spectrogram: "Spektrogramm",
        notes: "Anmerkungen",
        results: "Ergebnisse",
        freq_dom: "Hauptpeak Frequenz:",
        amp_max: "Hauptpeak Amplitude:",
        rms_sel: "RMS Auswahl:",
        time_domain: "ZEITBEREICH",
        freq_domain: "FREQUENZBEREICH",
        dirac_spec: "(Dirac Spektrum/FFT)",
        language: "Sprache",
        theme: "Thema",
        help_title: "Hilfe & Technische Details - HydraSpec Pro V1.4.0",
        help_text: `
            <nav class="help-nav" style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
                <strong>Schnellnavigation:</strong>
                <a href="#time-domain" style="color: var(--accent-blue); margin: 0 10px;">Zeitbereich</a>
                <a href="#freq-domain" style="color: var(--accent-blue); margin: 0 10px;">Frequenzbereich</a>
                <a href="#spectrogram" style="color: var(--accent-blue); margin: 0 10px;">Spektrogramm</a>
                <a href="#generator" style="color: var(--accent-blue); margin: 0 10px;">Generator</a>
                <a href="#import-export" style="color: var(--accent-blue); margin: 0 10px;">Dateien</a>
                <a href="#settings" style="color: var(--accent-blue); margin: 0 10px;">Einstellungen</a>
            </nav>

            <section id="time-domain">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-stopwatch"></i> Zeitbereichsanalyse
                </h4>
                <p>Die Zeitbereichsanalyse ermöglicht die Untersuchung von Druckverläufen über die Zeit.</p>
                
                <h5>Auswahl-Cursor</h5>
                <ul>
                    <li><strong>Grüner Cursor (Start):</strong> Beginn des Analysebereichs definieren</li>
                    <li><strong>Roter Cursor (Ende):</strong> Ende des Analysebereichs definieren</li>
                    <li><strong>Bewegen:</strong> Klicken und Ziehen auf einen Cursor</li>
                    <li><strong>Gruppenbewegung:</strong> Shift + Klick zwischen Cursorn für gemeinsame Bewegung</li>
                </ul>

<h5>Zoom et Navigation</h5>
<ul>
    <li><strong>Molette souris :</strong> Zoom X et Y simultané</li>
    <li><strong>Shift + Molette :</strong> Zoom vertical (Y) seulement</li>
    <li><strong>Ctrl + Molette :</strong> Zoom horizontal (X) seulement</li>
    <li><strong>Pan :</strong> Cliquer-glisser hors des curseurs pour naviguer</li>
    <li><strong>Zoom manuel :</strong> Utiliser les champs "Min/Max (s)" pour un zoom horizontal précis</li>
    <li><strong>Zoom vertical manuel :</strong> Utiliser les champs "Min Y/Max Y (Bar)" pour un zoom vertical précis</li>
</ul>
                <h5>Statistiken (Ausgewählter Bereich)</h5>
                <ul>
                    <li><strong>Min/Max:</strong> Extremwerte des Signals</li>
                    <li><strong>Mittelwert:</strong> Arithmetischer Durchschnitt</li>
                    <li><strong>Standardabweichung:</strong> Streuung der Werte um den Mittelwert</li>
                    <li><strong>RMS:</strong> Effektivwert (Root Mean Square)</li>
                </ul>
            </section>

            <section id="freq-domain" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-wave-square"></i> Frequenzanalyse (FFT)
                </h4>
                <p>Die Fast Fourier Transform (FFT) enthüllt den Frequenzgehalt Ihres Signals.</p>

                <h5>FFT-Parameter</h5>
                <ul>
                    <li><strong>Fenster:</strong>
                        <ul>
                            <li><strong>Rechteck:</strong> Für Transienten, die bei Null beginnen/enden</li>
                            <li><strong>Hanning (empfohlen):</strong> Standard für Schwingungsanalyse</li>
                            <li><strong>Hamming:</strong> Bessere Trennung naher Frequenzen</li>
                            <li><strong>Blackman:</strong> Beste Amplitudengenauigkeit</li>
                        </ul>
                    </li>
                    <li><strong>FFT-Punkte:</strong> Definiert Frequenzauflösung
                        <ul>
                            <li>Auflösung = Fs / N (z.B. 1000Hz/4096Punkte = 0,24Hz)</li>
                            <li>Mehr Punkte = bessere Auflösung aber längere Berechnung</li>
                        </ul>
                    </li>
                    <li><strong>Peak-Empfindlichkeit:</strong> Passt den Peak-Erkennungsschwellenwert an (logarithmische Skala)</li>
                </ul>

                <h5>Spektrum-Interpretation</h5>
                <ul>
                    <li><strong>Dominante Frequenz:</strong> Wichtigster Peak im Spektrum</li>
                    <li><strong>Max Amplitude:</strong> Amplitude des dominanten Peaks</li>
                    <li><strong>Sekundäre Peaks:</strong> Harmonische oder zusätzliche Komponenten</li>
                    <li><strong>Hintergrundrauschen:</strong> Grundrauschen zwischen Peaks</li>
                </ul>
            </section>

            <section id="spectrogram" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-chart-area"></i> STFT-Spektrogramm
                </h4>
                <p>Das Spektrogramm zeigt die Frequenzentwicklung über die Zeit (Short-Time Fourier Transform).</p>

                <h5>STFT-Parameter</h5>
                <ul>
                    <li><strong>STFT-Fenster:</strong> Größe jedes analysierten Segments
                        <ul>
                            <li>Kleines Fenster = Gute Zeitauflösung, schlechte Frequenzauflösung</li>
                            <li>Großes Fenster = Gute Frequenzauflösung, schlechte Zeitauflösung</li>
                        </ul>
                    </li>
                    <li><strong>Überlappung:</strong> Prozentsatz der Fensterüberlappung
                        <ul>
                            <li>50-75% empfohlen für flüssige Darstellung</li>
                        </ul>
                    </li>
                    <li><strong>Skala:</strong>
                        <ul>
                            <li><strong>Linear:</strong> Direkte Amplitudendarstellung</li>
                            <li><strong>Logarithmisch:</strong> Besserer Dynamikbereich für kleine Signale</li>
                            <li><strong>dB:</strong> Dezibelskala für Schallanalyse</li>
                        </ul>
                    </li>
                    <li><strong>Max Frequenz:</strong> Begrenzt die Anzeige auf niedrigere Frequenzen</li>
                </ul>

                <h5>Typische Anwendungen</h5>
                <ul>
                    <li><strong>Transienten:</strong> Stöße, Impulse, Anlaufvorgänge</li>
                    <li><strong>Modulationen:</strong> Frequenzänderungen über die Zeit</li>
                    <li><strong>Regimewechsel:</strong> Entwicklung von Maschinenschwingungen</li>
                    <li><strong>Sprachanalyse:</strong> Formanten und Phoneme</li>
                </ul>
            </section>

            <section id="generator" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-wave-square"></i> Signalgenerator
                </h4>
                <p>Erstellen Sie synthetische Signale zum Testen des Analysators oder zur Simulation von Phänomenen.</p>

                <h5>Grundparameter</h5>
                <ul>
                    <li><strong>Fs (Hz):</strong> Abtastfrequenz</li>
                    <li><strong>Dauer (s):</strong> Länge des generierten Signals</li>
                    <li><strong>Rauschen (Bar):</strong> Amplitude des hinzugefügten weißen Rauschens</li>
                    <li><strong>DC (Bar):</strong> Gleichanteil (Offset)</li>
                </ul>

                <h5>Sinusförmige Komponenten</h5>
                <ul>
                    <li><strong>Frequenz (Hz):</strong> Frequenz der Sinuswelle</li>
                    <li><strong>Amplitude (Bar):</strong> Signalamplitude</li>
                    <li><strong>Phase (°):</strong> Phasenverschiebung in Grad</li>
                    <li><strong>Hinzufügen/Entfernen:</strong> +/- Buttons zum Verwalten der Komponenten</li>
                </ul>
            </section>

            <section id="import-export" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-file-export"></i> Import & Export
                </h4>

                <h5>Unterstützte Formate</h5>
                <ul>
                    <li><strong>.csv:</strong> CSV-Format-Daten (Zeit;Wert)</li>
                    <li><strong>.hsp:</strong> HydraSpec-Projekt (Daten + Parameter)</li>
                    <li><strong>.png:</strong> Screenshot der Graphen</li>
                </ul>

                <h5>Beste Praktiken</h5>
                <ul>
                    <li><strong>CSV-Daten:</strong> "Zeit(ms);Wert" Format mit Kopfzeile</li>
                    <li><strong>Abtastfrequenz:</strong> Automatisch aus Inkrement berechnet</li>
                    <li><strong>Projekte:</strong> Häufig speichern um Arbeitsverlust zu vermeiden</li>
                    <li><strong>PNG-Export:</strong> Modals vor Aufnahme schließen</li>
                </ul>
            </section>

            <section id="settings" style="margin-top: 25px;">
                <h4 style="color: var(--accent-blue); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-cog"></i> Einstellungen & Anpassung
                </h4>

                <h5>Visuelle Themes</h5>
                <ul>
                    <li><strong>Dunkel:</strong> Standard, augenschonend</li>
                    <li><strong>Hell:</strong> Bessere Lesbarkeit bei hellem Licht</li>
                    <li><strong>Steampunk:</strong> Dekoratives Retro-Theme</li>
                </ul>

                <h5>Sprachen</h5>
                <ul>
                    <li><strong>Französisch:</strong> Vollständige Oberfläche</li>
                    <li><strong>Englisch:</strong> Vollständige englische Oberfläche</li>
                    <li><strong>Deutsch:</strong> Deutsche Benutzeroberfläche</li>
                </ul>
            </section>

            <section id="tips" style="margin-top: 25px; background: var(--input-bg); padding: 15px; border-radius: 5px;">
                <h4 style="color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                    <i class="fas fa-lightbulb"></i> Praktische Tipps
                </h4>
                
                <h5>Für Schwingungsanalyse</h5>
                <ul>
                    <li>Verwenden Sie <strong>Hanning</strong>-Fenster für kontinuierliche Schwingungen</li>
                    <li>Wählen Sie <strong>4096 FFT-Punkte</strong> für gutes Auflösungs-/Berechnungsverhältnis</li>
                    <li>Für Stöße verwenden Sie <strong>Rechteck</strong>-Fenster</li>
                    <li>Stellen Sie sicher, dass Ihre Zeitauswahl vollständige Zyklen enthält</li>
                </ul>

                <h5>Fehlerbehebung</h5>
                <ul>
                    <li><strong>Flaches Spektrum:</strong> Zeitauswahl und DC-Offset prüfen</li>
                    <li><strong>Mehrere Peaks:</strong> Peak-Empfindlichkeit anpassen</li>
                    <li><strong>Spektrale Leckage:</strong> Fenster wechseln oder FFT-Punkte erhöhen</li>
                    <li><strong>Langsame Berechnungen:</strong> FFT-Punkte oder Analysedauer reduzieren</li>
                </ul>
            </section>
        `
    }
};


// Fonction debounce pour limiter les appels fréquents
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fonction throttle pour les événements de redimensionnement
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}


// --- STATE ---
let appState = {
    fs: 1000,
    fullDataTime: [],      
    fullDataPressure: [],
    cursorStart: 1.0,
    cursorEnd: 2.0,
    peakFreq: 0, 
    peakAmp: 0,
    rms: 0,
    allPeaks: [],
    charts: { time: null, freq: null, spectro: null },
    spectroData: null,
    lang: 'fr',
    isDragging: false,
    dragTarget: null,
    currentExportAction: null,
    timeIncrement: 1.0,
    fftTimeout: null,
    dragStartX: 0,
    dragStartCursorStart: 0,
    dragStartCursorEnd: 0,
    lastX: 0,
 // ... propriétés existantes ...
    yAxisLabel: "Pression (Bar)",
    availableColumns: [],       // Liste des colonnes disponibles {name, label, index}
    currentColumnIndex: 0,      // Index de la colonne active
    allColumnData: [],          // Données de toutes les colonnes [time, col1, col2, ...]
    columnNames: [],            // Noms des colonnes

    // Configuration multi-canaux
    channelConfig: [],          // Configuration de chaque canal {visible, color, yAxisPosition, yMin, yMax, yAxisID}
    xAxisChannel: 0             // Index du canal utilisé pour l'axe X (0 = temps par défaut)
};

let uiState = {
    timeVisible: true,
    freqVisible: true,
    spectroVisible: true,
    tooltipsEnabled: true  // Activer/désactiver les infos au survol
};

// Ajouter ces fonctions dans la section INIT (après window.onload)
function initToggleButtons() {
    // Initialiser l'état des boutons
    updateToggleButtons();
    
    // Ajouter un raccourci clavier pour basculer tous les graphiques
    document.addEventListener('keydown', function(e) {
        // Ctrl+Alt+T : Basculer temps
        if (e.ctrlKey && e.altKey && e.key === 't') {
            e.preventDefault();
            toggleTimeDomain();
        }
        // Ctrl+Alt+F : Basculer fréquence
        if (e.ctrlKey && e.altKey && e.key === 'f') {
            e.preventDefault();
            toggleFreqDomain();
        }
        // Ctrl+Alt+S : Basculer spectrogramme
        if (e.ctrlKey && e.altKey && e.key === 's') {
            e.preventDefault();
            toggleSpectrogram();
        }
        // Ctrl+Alt+A : Basculer tout
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            toggleAllGraphs();
        }
    });
}

function updateToggleButtons() {
    const timeBtn = document.getElementById('toggle-time-btn');
    const freqBtn = document.getElementById('toggle-freq-btn');
    const spectroBtn = document.getElementById('toggle-spectro-btn');
    
    if (timeBtn) timeBtn.classList.toggle('active', uiState.timeVisible);
    if (freqBtn) freqBtn.classList.toggle('active', uiState.freqVisible);
    if (spectroBtn) spectroBtn.classList.toggle('active', uiState.spectroVisible);
    
    // Mettre à jour les tooltips
    if (timeBtn) {
        timeBtn.title = uiState.timeVisible ? 
            "Masquer le domaine temporel (Ctrl+Alt+T)" : 
            "Afficher le domaine temporel (Ctrl+Alt+T)";
    }
    if (freqBtn) {
        freqBtn.title = uiState.freqVisible ? 
            "Masquer le domaine fréquentiel (Ctrl+Alt+F)" : 
            "Afficher le domaine fréquentiel (Ctrl+Alt+F)";
    }
    if (spectroBtn) {
        spectroBtn.title = uiState.spectroVisible ? 
            "Masquer le spectrogramme (Ctrl+Alt+S)" : 
            "Afficher le spectrogramme (Ctrl+Alt+S)";
    }
}

function toggleTimeDomain() {
    uiState.timeVisible = !uiState.timeVisible;
    
    const timeContainer = document.getElementById('time-container');
    const resizer1 = document.getElementById('resizer1');
    
    if (timeContainer) {
        timeContainer.classList.toggle('hidden', !uiState.timeVisible);
    }
    if (resizer1) {
        resizer1.classList.toggle('hidden', !uiState.timeVisible);
    }
    
    updateToggleButtons();
    adjustPlotLayout();
    updateChartSizes();
    setStatus(uiState.timeVisible ? "Domaine temporel affiché" : "Domaine temporel masqué");
}

function toggleFreqDomain() {
    uiState.freqVisible = !uiState.freqVisible;

    const freqContainer = document.getElementById('freq-container');
    const fftParamsPanel = document.getElementById('fft-params-panel');
    const resizer1 = document.getElementById('resizer1');
    const resizer2 = document.getElementById('resizer2');

    if (freqContainer) {
        freqContainer.classList.toggle('hidden', !uiState.freqVisible);
    }

    // Masquer/afficher le panneau des paramètres FFT
    if (fftParamsPanel) {
        fftParamsPanel.classList.toggle('hidden', !uiState.freqVisible);
    }
    
    // Gérer les resizers selon quels graphiques sont visibles
    if (resizer1 && resizer2) {
        if (!uiState.timeVisible && uiState.freqVisible) {
            // Si temps masqué mais fréquence visible, on montre resizer2
            resizer1.classList.add('hidden');
            resizer2.classList.remove('hidden');
        } else if (uiState.timeVisible && !uiState.freqVisible) {
            // Si temps visible mais fréquence masquée, on cache resizer2
            resizer1.classList.remove('hidden');
            resizer2.classList.add('hidden');
        } else {
            // Sinon, état normal
            resizer1.classList.toggle('hidden', !uiState.timeVisible);
            resizer2.classList.toggle('hidden', !uiState.freqVisible);
        }
    }
    
    updateToggleButtons();
    adjustPlotLayout();
    updateChartSizes();
    setStatus(uiState.freqVisible ? "Domaine fréquentiel affiché" : "Domaine fréquentiel masqué");
}

function toggleSpectrogram() {
    uiState.spectroVisible = !uiState.spectroVisible;

    const spectroContainer = document.getElementById('spectro-container');
    const spectroParamsPanel = document.getElementById('spectro-params-panel');
    const resizer2 = document.getElementById('resizer2');

    if (spectroContainer) {
        spectroContainer.classList.toggle('hidden', !uiState.spectroVisible);
    }

    // Masquer/afficher le panneau des paramètres Spectrogramme
    if (spectroParamsPanel) {
        spectroParamsPanel.classList.toggle('hidden', !uiState.spectroVisible);
    }
    if (resizer2) {
        // Ne montrer resizer2 que si fréquence ET spectro sont visibles
        resizer2.classList.toggle('hidden', !(uiState.freqVisible && uiState.spectroVisible));
    }
    
    updateToggleButtons();
    adjustPlotLayout();
    updateChartSizes();
    setStatus(uiState.spectroVisible ? "Spectrogramme affiché" : "Spectrogramme masqué");
}

function toggleFFTParams() {
    const content = document.getElementById('fft-params-content');
    const icon = document.getElementById('fft-toggle-icon');

    if (content.style.display === 'none') {
        // Désactiver les autres outils
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('fft');
        }

        // Fermer tous les autres accordéons principaux
        if (typeof closeAllMainAccordions === 'function') {
            closeAllMainAccordions('fft');
        }

        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');

        // Mettre à jour les tableaux et sélecteurs
        if (typeof updateFFTCanalQuickView === 'function') {
            updateFFTCanalQuickView();
        }
        if (typeof updateFFTAnalysisChannelSelect === 'function') {
            updateFFTAnalysisChannelSelect();
        }
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function toggleSpectroParams() {
    const content = document.getElementById('spectro-params-content');
    const icon = document.getElementById('spectro-toggle-icon');

    if (content.style.display === 'none') {
        // Désactiver les autres outils
        if (typeof deactivateOtherTools === 'function') {
            deactivateOtherTools('spectro');
        }

        // Fermer tous les autres accordéons principaux
        if (typeof closeAllMainAccordions === 'function') {
            closeAllMainAccordions('spectro');
        }

        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function toggleAcquisition() {
    const content = document.getElementById('acquisition-content');
    const icon = document.getElementById('acquisition-toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function toggleZoom() {
    const content = document.getElementById('zoom-content');
    const icon = document.getElementById('zoom-toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function toggleAnnotations() {
    const content = document.getElementById('annotations-content');
    const icon = document.getElementById('annotations-toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');

        // Désactiver le mode annotation quand on ferme l'accordéon
        if (typeof annotationState !== 'undefined' && annotationState.active) {
            toggleAnnotationMode(); // Désactiver le mode annotation
        }
    }
}

function toggleAcquisition() {
    const content = document.getElementById('acquisition-content');
    const icon = document.getElementById('acquisition-toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function toggleTools() {
    const content = document.getElementById('tools-content');
    const icon = document.getElementById('tools-toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');

        // Désactiver tous les outils quand on ferme l'accordéon
        deactivateAllTools();
    }
}

// Fonction pour activer/désactiver les tooltips
function toggleTooltipsEnabled() {
    const toggle = document.getElementById('tooltip-enabled-toggle');
    uiState.tooltipsEnabled = toggle ? toggle.checked : true;

    // Sauvegarder dans localStorage
    localStorage.setItem('tooltipsEnabled', uiState.tooltipsEnabled);

    // Appliquer aux graphiques existants
    if (appState.charts.time) {
        appState.charts.time.options.plugins.tooltip.enabled = uiState.tooltipsEnabled;
        appState.charts.time.update('none');
    }
    if (appState.charts.freq) {
        appState.charts.freq.options.plugins.tooltip.enabled = uiState.tooltipsEnabled;
        appState.charts.freq.update('none');
    }
    if (appState.charts.spectro) {
        appState.charts.spectro.options.plugins.tooltip.enabled = uiState.tooltipsEnabled;
        appState.charts.spectro.update('none');
    }

    console.log('Tooltips', uiState.tooltipsEnabled ? 'activés' : 'désactivés');
}

// Charger la préférence des tooltips au démarrage
function loadTooltipPreference() {
    const saved = localStorage.getItem('tooltipsEnabled');
    if (saved !== null) {
        uiState.tooltipsEnabled = saved === 'true';
        const toggle = document.getElementById('tooltip-enabled-toggle');
        if (toggle) {
            toggle.checked = uiState.tooltipsEnabled;
        }
    }
}

// Désactiver tous les outils
function deactivateAllTools() {
    // Interval
    if (typeof isCreatingInterval !== 'undefined' && isCreatingInterval) {
        const btn = document.getElementById('btn-interval-main');
        const content = document.getElementById('interval-content');
        const icon = document.getElementById('interval-accordion-icon');

        isCreatingInterval = false;
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Diff/Canal
    if (typeof diffCanalState !== 'undefined' && diffCanalState.active) {
        const btn = document.getElementById('diff-canal-btn');
        const content = document.getElementById('diff-canal-content');
        const icon = btn ? btn.querySelector('.fa-chevron-up, .fa-chevron-down') : null;

        diffCanalState.active = false;
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Marqueur (SnapPoint)
    if (typeof snapPointState !== 'undefined' && snapPointState.active) {
        const btn = document.getElementById('snappoint-btn');
        const content = document.getElementById('snappoint-content');
        const icon = btn ? btn.querySelector('.fa-chevron-up, .fa-chevron-down') : null;

        snapPointState.active = false;
        if (typeof isCreatingSnapPoint !== 'undefined') {
            isCreatingSnapPoint = false;
        }
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Mesure de différence
    if (typeof measureState !== 'undefined' && measureState.active) {
        measureState.active = false;
        const measureBtn = document.getElementById('measure-diff-btn');
        const measureResults = document.getElementById('measure-results');
        if (measureBtn) measureBtn.style.background = 'var(--accent-blue)';
        if (measureResults) measureResults.style.display = 'none';
        if (measureState.point1) {
            measureState.point1 = null;
            measureState.point2 = null;
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }

    // Pan (Déplacement)
    if (typeof panState !== 'undefined' && panState.active) {
        panState.active = false;
        panState.dragging = false;
        const panBtn = document.getElementById('pan-tool-btn');
        if (panBtn) panBtn.style.background = 'var(--accent-blue)';
    }

    // Ruler (Mesurer)
    if (typeof rulerState !== 'undefined' && rulerState.active) {
        rulerState.active = false;
        const rulerBtn = document.getElementById('ruler-tool-btn');
        const rulerResults = document.getElementById('ruler-results');
        if (rulerBtn) rulerBtn.style.background = 'var(--accent-blue)';
        if (rulerResults) rulerResults.style.display = 'none';
        if (rulerState.point) {
            rulerState.point = null;
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }

    // Track (Traquer)
    if (typeof trackState !== 'undefined' && trackState.active) {
        trackState.active = false;
        const trackBtn = document.getElementById('track-tool-btn');
        const trackResults = document.getElementById('track-results');
        if (trackBtn) trackBtn.style.background = 'var(--accent-blue)';
        if (trackResults) trackResults.style.display = 'none';
    }
}

function deactivateOtherTools(currentTool) {
    // Désactiver tous les autres outils directement

    // Interval - TOUJOURS désactiver quand un autre outil est activé
    if (currentTool !== 'interval' && typeof isCreatingInterval !== 'undefined' && isCreatingInterval) {
        const btn = document.getElementById('btn-interval-main');
        const content = document.getElementById('interval-content');
        const icon = document.getElementById('interval-accordion-icon');

        isCreatingInterval = false;
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Diff/Canal - TOUJOURS désactiver quand un autre outil est activé
    if (currentTool !== 'diffcanal' && typeof diffCanalState !== 'undefined' && diffCanalState.active) {
        const btn = document.getElementById('diff-canal-btn');
        const content = document.getElementById('diff-canal-content');
        const icon = btn ? btn.querySelector('.fa-chevron-up, .fa-chevron-down') : null;

        diffCanalState.active = false;
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Marqueur (SnapPoint) - TOUJOURS désactiver quand un autre outil est activé
    if (currentTool !== 'snappoint' && typeof snapPointState !== 'undefined' && snapPointState.active) {
        const btn = document.getElementById('snappoint-btn');
        const content = document.getElementById('snappoint-content');
        const icon = btn ? btn.querySelector('.fa-chevron-up, .fa-chevron-down') : null;

        snapPointState.active = false;
        if (typeof isCreatingSnapPoint !== 'undefined') {
            isCreatingSnapPoint = false;
        }
        if (btn) btn.style.background = 'var(--accent-blue)';
        if (content) content.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Mesure de différence
    if (currentTool !== 'measure' && typeof measureState !== 'undefined' && measureState.active) {
        measureState.active = false;
        const measureBtn = document.getElementById('measure-diff-btn');
        const measureResults = document.getElementById('measure-results');
        if (measureBtn) measureBtn.style.background = 'var(--accent-blue)';
        if (measureResults) measureResults.style.display = 'none';
        if (measureState.point1) {
            measureState.point1 = null;
            measureState.point2 = null;
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }

    // Pan (Déplacement)
    if (currentTool !== 'pan' && typeof panState !== 'undefined' && panState.active) {
        panState.active = false;
        panState.dragging = false;
        const panBtn = document.getElementById('pan-tool-btn');
        const panContent = document.getElementById('pan-content');
        if (panBtn) panBtn.style.background = 'var(--accent-blue)';
        if (panContent) panContent.style.display = 'none';
        // Mettre à jour l'icône
        const panIcon = panBtn ? panBtn.querySelector('#pan-toggle-icon') : null;
        if (panIcon) {
            panIcon.classList.remove('fa-chevron-up');
            panIcon.classList.add('fa-chevron-down');
        }
    }

    // Ruler (Mesurer)
    if (currentTool !== 'ruler' && typeof rulerState !== 'undefined' && rulerState.active) {
        rulerState.active = false;
        const rulerBtn = document.getElementById('ruler-tool-btn');
        const rulerResults = document.getElementById('ruler-results');
        if (rulerBtn) rulerBtn.style.background = 'var(--accent-blue)';
        if (rulerResults) rulerResults.style.display = 'none';
        if (rulerState.point) {
            rulerState.point = null;
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }

    // Track (Traquer)
    if (currentTool !== 'track' && typeof trackState !== 'undefined' && trackState.active) {
        trackState.active = false;
        const trackBtn = document.getElementById('track-tool-btn');
        const trackResults = document.getElementById('track-results');
        if (trackBtn) trackBtn.style.background = 'var(--accent-blue)';
        if (trackResults) trackResults.style.display = 'none';
        if (trackState.currentX !== null) {
            trackState.currentX = null;
            trackState.values = {};
            if (typeof appState !== 'undefined' && appState.charts && appState.charts.time) {
                appState.charts.time.update('none');
            }
        }
    }
}

function toggleAllGraphs() {
    // Basculer tous les graphiques en même temps
    const allVisible = uiState.timeVisible && uiState.freqVisible && uiState.spectroVisible;
    
    uiState.timeVisible = !allVisible;
    uiState.freqVisible = !allVisible;
    uiState.spectroVisible = !allVisible;
    
    // Appliquer les changements
    const timeContainer = document.getElementById('time-container');
    const freqContainer = document.getElementById('freq-container');
    const spectroContainer = document.getElementById('spectro-container');
    const resizer1 = document.getElementById('resizer1');
    const resizer2 = document.getElementById('resizer2');
    
    if (timeContainer) timeContainer.classList.toggle('hidden', allVisible);
    if (freqContainer) freqContainer.classList.toggle('hidden', allVisible);
    if (spectroContainer) spectroContainer.classList.toggle('hidden', allVisible);
    if (resizer1) resizer1.classList.toggle('hidden', allVisible);
    if (resizer2) resizer2.classList.toggle('hidden', allVisible);
    
    updateToggleButtons();
    adjustPlotLayout();
    updateChartSizes();
    setStatus(allVisible ? "Tous les graphiques affichés" : "Tous les graphiques masqués");
}

function adjustPlotLayout() {
    const plotsContainer = document.getElementById('plots-container');
    if (!plotsContainer) return;
    
    // Compter les graphiques visibles
    let visibleCount = 0;
    if (uiState.timeVisible) visibleCount++;
    if (uiState.freqVisible) visibleCount++;
    if (uiState.spectroVisible) visibleCount++;
    
    // Si aucun graphique visible, en forcer un
    if (visibleCount === 0) {
        uiState.timeVisible = true;
        document.getElementById('time-container').classList.remove('hidden');
        document.getElementById('resizer1').classList.remove('hidden');
        visibleCount = 1;
        updateToggleButtons();
    }
    
    // Distribuer l'espace équitablement
    const heightPercent = visibleCount > 0 ? (95 / visibleCount) : 95;
    
    if (uiState.timeVisible) {
        const timeContainer = document.getElementById('time-container');
        if (timeContainer) {
            timeContainer.style.height = `${heightPercent}%`;
        }
    }
    
    if (uiState.freqVisible) {
        const freqContainer = document.getElementById('freq-container');
        if (freqContainer) {
            freqContainer.style.height = `${heightPercent}%`;
        }
    }
    
    if (uiState.spectroVisible) {
        const spectroContainer = document.getElementById('spectro-container');
        if (spectroContainer) {
            if (visibleCount === 1) {
                spectroContainer.style.height = '95%';
            } else {
                spectroContainer.style.height = `${heightPercent}%`;
            }
        }
    }
}

function updateChartSizes() {
    // Redimensionner les graphiques après un délai pour laisser le DOM se mettre à jour
    setTimeout(() => {
        if (appState.charts.time && uiState.timeVisible) appState.charts.time.resize();
        if (appState.charts.freq && uiState.freqVisible) appState.charts.freq.resize();
        if (appState.charts.spectro && uiState.spectroVisible) appState.charts.spectro.resize();
    }, 100);
}

// Ajouter l'appel à initToggleButtons dans window.onload
window.onload = function() {
    console.time('Initialisation');

    initCharts();
    setupResizers();
    setupCanvasInteractions();
    changeLanguage('fr');
    updateColorScale();


    // INITIALISER LES CHAMPS DE ZOOM
    setTimeout(updateZoomInputs, 500);
    setupSpectrogramAutoUpdate();

    // RÉINITIALISER L'AIDE
    document.getElementById('help-content').innerHTML = i18n.fr.help_text;

    // Initialiser les boutons toggle
    initToggleButtons();

    // Charger la préférence des tooltips
    loadTooltipPreference();

    console.timeEnd('Initialisation');

    // Initialiser le système POO Multi-Projets
    if (typeof initPOOSystem === 'function') {
        initPOOSystem();
        setStatus("Application prête (Système multi-projets activé)");
    } else {
        setStatus("Application prête");
    }
};
// --- TRANSLATION ---
function changeLanguage(lang) {
    appState.lang = lang;
    const texts = i18n[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) el.textContent = texts[key];
    });
    document.getElementById('help-content').innerHTML = texts.help_text;
}

// --- ZOOM TEMPOREL MANUEL ---
function updateZoomInputs() {
    if (appState.charts.time && appState.charts.time.scales) {
        const xScale = appState.charts.time.scales.x;
        const yScale = appState.charts.time.scales.y;
        
        console.log("Mise à jour des champs de zoom:", xScale.min, xScale.max); // Debug
        
        // Mise à jour des champs horizontaux (convertir ms en secondes)
        document.getElementById('zoom-min').value = (xScale.min / 1000).toFixed(3);
        document.getElementById('zoom-max').value = (xScale.max / 1000).toFixed(3);

        // Mise à jour des champs verticaux (vérifier qu'ils existent)
        const zoomYMin = document.getElementById('zoom-y-min');
        const zoomYMax = document.getElementById('zoom-y-max');
        if (zoomYMin) zoomYMin.value = yScale.min.toFixed(1);
        if (zoomYMax) zoomYMax.value = yScale.max.toFixed(1);
    }
}

// --- ZOOM TEMPOREL ET VERTICAL MANUEL ---
function updateZoomInputs() {
    if (appState.charts.time && appState.charts.time.scales) {
        const xScale = appState.charts.time.scales.x;
        const yScale = appState.charts.time.scales.y;
        
        // Mise à jour des champs horizontaux (convertir ms en secondes)
        document.getElementById('zoom-min').value = (xScale.min / 1000).toFixed(3);
        document.getElementById('zoom-max').value = (xScale.max / 1000).toFixed(3);

        // Mise à jour des champs verticaux (vérifier qu'ils existent)
        const zoomYMin = document.getElementById('zoom-y-min');
        const zoomYMax = document.getElementById('zoom-y-max');
        if (zoomYMin) zoomYMin.value = yScale.min.toFixed(1);
        if (zoomYMax) zoomYMax.value = yScale.max.toFixed(1);
    }
}

function applyTimeZoom() {
    const minX = parseFloat(document.getElementById('zoom-min').value);
    const maxX = parseFloat(document.getElementById('zoom-max').value);
    const minY = parseFloat(document.getElementById('zoom-y-min').value);
    const maxY = parseFloat(document.getElementById('zoom-y-max').value);
    
    const chart = appState.charts.time;
    let zoomApplied = false;
    
    // Appliquer le zoom horizontal si les valeurs sont valides
    if (!isNaN(minX) && !isNaN(maxX) && minX < maxX) {
        chart.options.scales.x.min = minX * 1000; // Convertir en ms
        chart.options.scales.x.max = maxX * 1000; // Convertir en ms
        zoomApplied = true;
    }
    
    // Appliquer le zoom vertical si les valeurs sont valides
    if (!isNaN(minY) && !isNaN(maxY) && minY < maxY) {
        chart.options.scales.y.min = minY;
        chart.options.scales.y.max = maxY;
        zoomApplied = true;
    }
    
    if (zoomApplied) {
        chart.update('none');
        setStatus("Zoom appliqué");
    } else {
        setStatus("Valeurs de zoom invalides");
        updateZoomInputs(); // Réaffiche les valeurs actuelles
    }
}
// --- THEMES ---
function changeTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    updateChartColors(theme);
    updateColorScale();
}

function updateChartColors(theme) {
    const color = theme === 'light' ? '#333333' : (theme === 'steampunk' ? '#d4af37' : '#e0e0e0');
    const gridColor = theme === 'light' ? '#ddd' : (theme === 'steampunk' ? '#5d4037' : '#333');
    
    [appState.charts.time, appState.charts.freq, appState.charts.spectro].forEach(chart => {
        if(chart) {
            if(chart.options.scales && chart.options.scales.x) {
                chart.options.scales.x.ticks.color = color;
                chart.options.scales.y.ticks.color = color;
                chart.options.scales.x.grid.color = gridColor;
                chart.options.scales.y.grid.color = gridColor;
            }
            chart.update();
        }
    });
}

function updateColorScale() {
    const theme = document.body.getAttribute('data-theme');
    const scale = document.getElementById('color-scale');
    if(theme === 'light') {
        scale.style.background = 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)';
    } else {
        scale.style.background = 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)';
    }
}

// --- UTILS ---
function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'block';

    // Initialiser draggable si la modale a la classe
    const modalContent = modal.querySelector('.draggable-modal');
    if (modalContent && typeof makeDraggable === 'function') {
        makeDraggable(modalContent);
    }
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

function setStatus(msg) { 
    document.getElementById('status-bar').textContent = msg; 
    setTimeout(() => { 
        document.getElementById('status-bar').textContent = "Prêt."; 
    }, 3000); 
}

function resetTimeZoom() {
    const chart = appState.charts.time;
    if (!chart || !appState.fullDataTime.length) {
        setStatus("Aucune donnée à afficher");
        return;
    }

    // Réinitialiser le zoom horizontal à la plage complète des données
    const t = appState.fullDataTime;
    chart.options.scales.x.min = t[0];
    chart.options.scales.x.max = t[t.length - 1];

    // Réinitialiser le zoom vertical sur TOUTES les échelles Y
    Object.keys(chart.scales).forEach(scaleKey => {
        if (scaleKey.startsWith('y')) {
            // Supprimer les limites personnalisées pour permettre l'auto-scaling
            delete chart.options.scales[scaleKey].min;
            delete chart.options.scales[scaleKey].max;
        }
    });

    // Mettre à jour le graphique
    chart.update('none');

    // Mettre à jour les champs de zoom pour refléter les nouvelles valeurs
    setTimeout(updateZoomInputs, 10);

    setStatus("Zoom réinitialisé sur toute la plage temporelle");
}

function resetFreqZoom() { 
    appState.charts.freq.options.scales.x.min = 0; 
    delete appState.charts.freq.options.scales.x.max; 
    appState.charts.freq.update(); 
}

function updateSensitivityUI() { 
    appState.charts.freq.update(); 
}

function updateFsFromStep() {
    const s = parseFloat(document.getElementById('manual-step-config').value);
    if(s > 0 && appState.fullDataPressure.length > 0) {
        const newFs = 1000/s;

        // RECALCULER LES TEMPS AVEC LA NOUVELLE Fs
        const oldData = appState.fullDataPressure;
        const newTime = new Float32Array(oldData.length);
        const dt = 1000/newFs; // nouveau pas en ms

        for(let i = 0; i < oldData.length; i++) {
            newTime[i] = i * dt;
        }

        appState.fs = newFs;
        appState.fullDataTime = newTime;
        appState.timeIncrement = s;

        document.getElementById('display-fs-config').textContent = newFs.toFixed(1) + " Hz";
        document.getElementById('display-increment-config').textContent = s.toFixed(2) + " ms";

        // METTRE À JOUR TOUS LES GRAPHIQUES
        updateTimeChart();
        updateStats();
        performAnalysis();
        updateSpectrogram();
        setStatus("Fs mis à jour à " + newFs.toFixed(1) + " Hz");
    } else if (s > 0) {
        // Cas où il n'y a pas encore de données
        appState.fs = 1000/s;
        appState.timeIncrement = s;
        document.getElementById('display-fs-config').textContent = appState.fs.toFixed(1) + " Hz";
        document.getElementById('display-increment-config').textContent = s.toFixed(2) + " ms";
        setStatus("Fs configuré à " + appState.fs.toFixed(1) + " Hz");
    }
}

function recalculateTimeData(newFs) {
    if (!appState.fullDataPressure.length) return;
    
    const oldData = appState.fullDataPressure;
    const newTime = new Float32Array(oldData.length);
    const dt = 1000/newFs;
    
    for(let i = 0; i < oldData.length; i++) {
        newTime[i] = i * dt;
    }
    
    appState.fs = newFs;
    appState.fullDataTime = newTime;
    return true;
}

// Gestion des clics en dehors des modales
window.onclick = function(e) { 
    if(e.target.classList.contains('modal')) {
        e.target.style.display = "none";
    }
}

function setAcquisitionTitle(title) {
    document.getElementById('acquisition-title').textContent = title;
    // Optionnel : sauvegarder dans l'état si besoin
    appState.acquisitionTitle = title;
}

// === HALO DE SOURIS AMÉLIORÉ ===

let mouseHalo = null;
let mouseX = 0;
let mouseY = 0;
let isMoving = false;
let moveTimeout = null;
let clickTimeout = null;

function initMouseHalo() {
    // Vérifier si le halo existe déjà
    if (document.getElementById('mouse-halo')) {
        return;
    }
    
    // Créer l'élément halo
    mouseHalo = document.createElement('div');
    mouseHalo.id = 'mouse-halo';
    mouseHalo.className = 'mouse-halo';
    
    // Ajouter au body
    document.body.appendChild(mouseHalo);
    
    // Écouter les mouvements de souris
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    // Observer les changements de thème
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                updateHaloForTheme();
            }
        });
    });
    observer.observe(document.body, { attributes: true });
    
    // Cacher le halo lors du défilement
    document.addEventListener('scroll', () => {
        mouseHalo.style.opacity = '0.3';
    });
    
    console.log("✨ Halo de souris initialisé");
}

function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Mettre à jour la position du halo
    if (mouseHalo) {
        mouseHalo.style.left = mouseX + 'px';
        mouseHalo.style.top = mouseY + 'px';
        
        // Activer le halo
        if (!mouseHalo.classList.contains('active')) {
            mouseHalo.classList.add('active');
        }
        
        // Gestion du mouvement
        clearTimeout(moveTimeout);
        isMoving = true;
        
        // Ajouter la classe de mouvement
        mouseHalo.classList.add('moving');
        mouseHalo.style.opacity = '1';
        
        // Retirer la classe après arrêt
        moveTimeout = setTimeout(() => {
            isMoving = false;
            mouseHalo.classList.remove('moving');
            mouseHalo.style.opacity = '0.7';
        }, 150);
        
        // Vérifier si la souris est sur un élément interactif
        const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
        if (elementUnderMouse) {
            const tagName = elementUnderMouse.tagName.toLowerCase();
            const isInteractive = ['input', 'button', 'select', 'textarea', 'a'].includes(tagName) ||
                                 elementUnderMouse.classList.contains('btn') ||
                                 elementUnderMouse.classList.contains('button');
            
            if (isInteractive) {
                mouseHalo.classList.add('small');
            } else {
                mouseHalo.classList.remove('small');
            }
        }
    }
}

function handleMouseDown(e) {
    if (mouseHalo) {
        // Effet de clic
        mouseHalo.classList.add('clicking');
        
        // Supprimer l'effet après un moment
        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            mouseHalo.classList.remove('clicking');
        }, 200);
        
        // Changer la couleur selon le bouton de souris
        if (e.button === 2) { // Clic droit
            mouseHalo.style.background = `radial-gradient(
                circle, 
                rgba(244, 67, 54, 0.4) 0%, 
                rgba(244, 67, 54, 0.2) 40%, 
                rgba(244, 67, 54, 0.1) 60%, 
                rgba(244, 67, 54, 0) 80%
            )`;
        }
    }
}

function handleMouseUp() {
    if (mouseHalo) {
        // Supprimer l'effet de clic
        if (clickTimeout) clearTimeout(clickTimeout);
        mouseHalo.classList.remove('clicking');
        
        // Revenir au thème normal
        updateHaloForTheme();
    }
}

function handleMouseLeave() {
    if (mouseHalo) {
        mouseHalo.classList.remove('active');
    }
}

function handleMouseEnter() {
    if (mouseHalo) {
        mouseHalo.classList.add('active');
    }
}

function updateHaloForTheme() {
    if (!mouseHalo) return;
    
    // Cette fonction n'est plus nécessaire car le CSS gère les thèmes
    // via les sélecteurs [data-theme="..."] .mouse-halo
    console.log("Thème mis à jour, halo adapté automatiquement");
}

// Fonction pour activer/désactiver le halo
function toggleMouseHalo(enable) {
    if (mouseHalo) {
        if (enable) {
            mouseHalo.classList.add('active');
            console.log("✅ Halo de souris activé");
        } else {
            mouseHalo.classList.remove('active');
            console.log("✅ Halo de souris désactivé");
        }
    }
}



// Exposer les fonctions globalement
window.toggleMouseHalo = toggleMouseHalo;
window.initMouseHalo = initMouseHalo;

// ========================================
// SIDEBAR REPLIABLE
// ========================================

function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn-header'); // Nouveau bouton dans le header
    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

    if (sidebar.classList.contains('collapsed')) {
        // Déplier
        sidebar.classList.remove('collapsed');
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        }
        console.log("✅ Sidebar dépliée");
    } else {
        // Replier
        sidebar.classList.add('collapsed');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
        console.log("✅ Sidebar repliée");
    }

    // Déclencher un redimensionnement des graphiques pour s'adapter au nouvel espace
    setTimeout(() => {
        if (window.globalCharts) {
            if (window.globalCharts.time) window.globalCharts.time.resize();
            if (window.globalCharts.freq) window.globalCharts.freq.resize();
            if (window.globalCharts.spectro) window.globalCharts.spectro.resize();
        }
    }, 300); // Attendre la fin de l'animation CSS
}

window.toggleSidebar = toggleSidebar;
// =====================================
// MODALES DRAGGABLES
// =====================================

function makeDraggable(modalElement) {
    // Vérifier si déjà initialisé pour éviter les doublons
    if (modalElement.dataset.draggableInitialized === 'true') {
        return;
    }
    modalElement.dataset.draggableInitialized = 'true';

    const header = modalElement.querySelector('h2');
    if (!header) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    function dragStart(e) {
        // Vérifier que le clic est bien sur le header
        if (!header.contains(e.target)) return;

        isDragging = true;
        modalElement.classList.add('dragging');

        // Position initiale de la souris
        initialX = e.clientX;
        initialY = e.clientY;

        // Position actuelle de la modal
        const rect = modalElement.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;

        // Fixer la position pour permettre le déplacement
        modalElement.style.position = 'fixed';
        modalElement.style.left = currentX + 'px';
        modalElement.style.top = currentY + 'px';
        modalElement.style.margin = '0';

        console.log('🎯 Drag started');
    }

    function drag(e) {
        if (!isDragging) return;

        e.preventDefault();

        // Calculer le déplacement
        const deltaX = e.clientX - initialX;
        const deltaY = e.clientY - initialY;

        // Nouvelle position
        const newX = currentX + deltaX;
        const newY = currentY + deltaY;

        // Limiter au viewport
        const maxX = window.innerWidth - modalElement.offsetWidth;
        const maxY = window.innerHeight - modalElement.offsetHeight;

        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));

        modalElement.style.left = boundedX + 'px';
        modalElement.style.top = boundedY + 'px';
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        modalElement.classList.remove('dragging');
        console.log('✅ Drag ended');
    }

    // Ajouter les event listeners
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    console.log('✅ Modal draggable initialisée:', modalElement);
}

// Initialiser les modales draggables au chargement
document.addEventListener('DOMContentLoaded', () => {
    const draggableModals = document.querySelectorAll('.draggable-modal');
    draggableModals.forEach(modal => makeDraggable(modal));
    console.log('✅ Modales draggables initialisées:', draggableModals.length);
});
