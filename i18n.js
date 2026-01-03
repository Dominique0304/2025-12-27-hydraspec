// =====================================================
// SYSTÈME DE TRADUCTION MULTILINGUE - HydraSpec Pro
// Fichier: i18n.js
// Langues supportées: Français (fr), English (en), Deutsch (de)
// =====================================================

const i18nTranslations = {
    fr: {
        // ===== UI PRINCIPALE (36 clés existantes) =====
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
        spectrogram_title: "SPECTROGRAMME STFT",

        // ===== MENUS =====
        menu: {
            graphs: "Graphiques",
            time: "Temps",
            frequency: "Fréquence",
            spectro: "Spectro",
            open_hsp: "Ouvrir fichier .hsp",
            save_hsp: "Enregistrer .hsp",
            save_hsp_as: "Enregistrer .hsp sous",
            import_csv: "Importer fichier .csv",
            export_hsp: "Exporter vers .hsp",
            export_csv: "Exporter fichier .csv",
            export_png: "Exporter PNG",
            export_pdf: "Exporter PDF"
        },

        // ===== SIDEBAR - SECTIONS =====
        sidebar: {
            canal_header: "Canal",
            tools_header: "Outils",
            measure: "Mesurer",
            track: "Traquer",
            diff_measure: "Mesure de Différence",
            marker: "Marqueur",
            create: "Créer",
            move: "Déplacer",
            click_to_create: "Cliquez sur le graphique pour créer un marqueur",
            markers_created: "Marqueurs créés:",
            no_marker: "Aucun marqueur",
            interval: "Interval",
            no_interval: "Aucun intervalle",
            diff_channel: "Diff/Canal",
            select_channel: "Sélectionner un canal",
            manual_input: "Saisie manuelle:",
            time_start: "Temps début (s):",
            time_end: "Temps fin (s):",
            create_btn: "Créer",
            diff_instructions: "Sélectionnez un canal puis cliquez 2 points sur le graphique OU utilisez la saisie manuelle",
            diff_created: "Diff/Canal créées:",
            channel_smoothing: "Lissage de Canal",
            source_channel: "Canal source:",
            select_option: "-- Sélectionner --",
            name: "Nom:",
            color: "Couleur:",
            smoothing_points: "Points de lissage:",
            smoothed_channels: "Canaux lissés:",
            calculated_channel: "Canal Calculé",
            available_channels: "Canaux disponibles:",
            formula: "Formule:",
            calculated_channels: "Canaux calculés:",
            pan_zoom: "Déplacement / Zoom",
            pan: "Déplacement",
            horizontal: "Horizontal",
            vertical: "Vertical",
            y_zero: "Y=0",
            zoom: "Zoom",
            grid: "Quadrillage",
            t_min: "T min (s)",
            t_max: "T max (s)",
            zoom_note: "Ctrl+Molette et Alt+Molette conservent leur fonction",
            saved_views: "Vues sauvegardées",
            create_view: "Créer une vue",
            no_saved_views: "Aucune vue sauvegardée.",
            center_cursor: "Centrer curseur",
            fft_channel: "Canal FFT",
            comments: "Commentaires",
            notes_placeholder: "Notes...",
            color_range: "Plage Couleurs:"
        },

        // ===== TOOLTIPS =====
        tooltips: {
            toggle_sidebar: "Afficher/Masquer Sidebar",
            multi_channel_config: "Configuration Multi-Canaux",
            settings: "Paramètres",
            help: "Aide",
            y_axis_left: "Axe Y à gauche",
            y_axis_right: "Axe Y à droite",
            mode_create: "Mode Création : Cliquez sur le graphique pour créer un marqueur",
            mode_move: "Mode Déplacement : Cliquez sur un marqueur pour le déplacer",
            formula_help: "Aide sur les formules",
            reset_zoom_auto: "Reset Zoom + Auto Groupé",
            reset_zoom: "Reset Zoom"
        },

        // ===== MODALES =====
        modals: {
            export_file: "Exporter le fichier",
            filename: "Nom du fichier :",
            enter_name: "Entrez le nom...",
            cancel: "Annuler",
            export: "Exporter",
            download_location: "Localisation des fichiers exportés",
            multi_channel_config: "Configuration Multi-Canaux",
            tabs: {
                channels: "Canaux",
                settings: "Paramètres",
                instructions: "Instructions"
            },
            channel_x: "Canal X :",
            min_s: "Min (s):",
            max_s: "Max (s):",
            name: "Nom",
            y_min: "Y Min",
            y_max: "Y Max",
            fft: "FFT",
            preset: "Preset",
            y_scale_presets: "Presets Échelle Y",
            auto_channel: "Auto Canal",
            auto_grouped: "Auto Groupé",
            preset_1_to_5: "Preset 1 à 5"
        },

        // ===== PLACEHOLDERS =====
        placeholders: {
            zero: "0.000",
            smoothed_channel: "Canal lissé",
            optional: "Optionnel",
            formula_example: "Ex: S2-S1 ou sqrt(S1^2+S2^2)",
            notes: "Notes...",
            enter_name: "Entrez le nom...",
            preset_name: "Ex: Ma config vibration",
            preset_desc: "Description de ce preset...",
            comment: "Entrez un commentaire..."
        },

        // ===== MESSAGES DE STATUT =====
        status: {
            ready: "Application prête",
            ready_multi: "Application prête (Système multi-projets activé)",
            zoom_applied: "Zoom appliqué",
            zoom_invalid: "Valeurs de zoom invalides",
            no_data: "Aucune donnée",
            no_data_to_display: "Aucune donnée à afficher",
            zoom_reset: "Zoom réinitialisé sur toute la plage temporelle",
            zoom_reset_all: "Zoom réinitialisé sur tous les graphiques",
            fs_updated: "Fs mis à jour à {fs} Hz",
            fs_configured: "Fs configuré à {fs} Hz",
            data_centered: "Curseurs centrés (ajustés aux limites)",
            data_centered_full: "Curseurs centrés sur données complètes",
            no_data_to_center: "Aucune donnée à centrer",

            // Outil Marqueur (SnapPoint)
            marker_activated: "Outil Marqueur activé - Cliquez sur un point du graphique",
            marker_deactivated: "Outil Marqueur désactivé",
            marker_mode_create: "Mode Création : Cliquez sur le graphique pour créer un marqueur",
            marker_mode_move: "Mode Déplacement : Cliquez sur un marqueur pour le déplacer",
            marker_no_channel: "Aucun canal trouvé à cette position",

            // Outil Mesure
            measure_activated: "Outil de mesure activé - Cliquez sur le graphique pour placer les points",
            measure_deactivated: "Outil de mesure désactivé",
            measure_cleared: "Mesures effacées",
            measure_point1: "Point 1 placé - Cliquez pour placer le point 2",
            measure_point2: "Point 2 placé - Glissez les points pour ajuster ou utilisez Effacer",
            measure_complete: "2 points déjà placés - Glissez-les pour ajuster ou cliquez Effacer",

            // Outil Règle (Ruler)
            ruler_activated: "Outil Mesurer activé - Cliquez sur le graphique pour placer le point",
            ruler_deactivated: "Outil Mesurer désactivé",
            ruler_cleared: "Mesure effacée",
            ruler_placed: "Point placé - Glissez pour ajuster ou utilisez Effacer",
            ruler_adjusted: "Point ajusté",

            // Outil Suivi (Track)
            track_activated: "Outil Traquer activé - Déplacez la souris sur le graphique",
            track_deactivated: "Outil Traquer désactivé",
            track_cleared: "Tracking effacé",
            track_fixed: "Curseur Traquer fixé - Cliquez dessus pour le déplacer",
            track_repositioned: "Curseur Traquer repositionné",

            // Outil Diff/Canal
            diff_activated: "Outil Diff/Canal activé - Sélectionnez un canal puis cliquez 2 points",
            diff_deactivated: "Outil Diff/Canal désactivé",
            diff_no_channel: "Aucun canal sélectionné",
            diff_channel_unavailable: "Le canal sélectionné n'est plus disponible",
            diff_cannot_interpolate: "Impossible d'interpoler la valeur sur ce canal",
            diff_point1: "Point 1 placé - Cliquez pour placer le point 2",
            diff_modified: "Point modifié",
            diff_annotation_moved: "Annotation horizontale/verticale/diagonale repositionnée",

            // Outil Intervalle
            interval_activated: "Mode Interval activé : Cliquez 2 points pour définir l'intervalle",
            interval_deactivated: "Mode Interval désactivé - Vous pouvez maintenant déplacer les curseurs",
            interval_modified: "Intervalle modifié",

            // Outil Pan
            pan_activated: "Mode Déplacement activé - Cliquez et glissez pour déplacer le graphique",
            pan_deactivated: "Mode Déplacement désactivé",
            y_zero_activated: "Mode Y=0 activé - Les courbes sont centrées sur Y=0",
            y_zero_deactivated: "Mode Y=0 désactivé",
            pan_invalid_values: "Valeurs T min/T max invalides",

            // Lissage
            smoothing_saved: "✅ Modifications sauvegardées",
            smoothing_no_source: "⚠️ Veuillez sélectionner un canal source",
            smoothing_invalid_source: "⚠️ Canal source invalide",
            smoothing_no_info: "⚠️ Impossible de trouver les informations du canal source",
            smoothing_not_found: "⚠️ Canal lissé introuvable",

            // Canal calculé
            calculated_not_found: "⚠️ Canal calculé introuvable",

            // Multi-canal
            auto_preset_no_channel: "ℹ️ Auto-Preset : Aucun canal éligible (vérifiez que les canaux sont visibles et sans preset)",
            auto_preset_channel_no_eligible: "ℹ️ Auto-Preset Canal : Aucun canal éligible",

            // Spectrogramme
            spectrogram_calculated: "Spectrogramme calculé.",
            spectrogram_exported: "Spectrogramme exporté.",

            // Fichiers
            csv_invalid: "Fichier CSV invalide",
            csv_not_enough_data: "Pas assez de données valides dans le fichier",
            file_load_error: "Erreur lors du chargement du fichier",
            csv_exported: "Fichier CSV exporté (1 canal, toutes les données, format européen).",

            // Capture/Export
            capture_preparing: "Préparation de la capture...",
            capture_success: "Capture réussie!",
            capture_simple: "Capture simplifiée effectuée",
            capture_failed: "Échec complet de la capture",
            save_cancelled: "Sauvegarde annulée",
            pdf_generating: "Génération du PDF en cours...",
            pdf_chart_error: "Erreur lors de la capture du graphique temporel",
            pdf_success: "Export PDF réussi!",
            export_error_type: "Erreur: type d'export inconnu",
            export_error: "Erreur lors de l'export",

            // Vues
            view_error_capture: "Erreur: impossible de capturer l'état",
            view_error_no_chart: "Erreur: aucun graphique disponible"
        },

        // ===== DIALOGUES (alert, confirm, prompt) =====
        dialogs: {
            // Fichiers
            no_data: "Aucune donnée.",
            no_data_to_export: "Aucune donnée à exporter.",
            file_not_hsp: "Ce fichier est déjà au format .HSP. Utilisez 'Enregistrer' ou 'Enregistrer sous'.",
            file_is_hsp: "Ce projet n'est pas un fichier .HSP. Utilisez 'Exporter vers .HSP'.",
            file_open_error: "Erreur lors de l'ouverture du fichier",
            hsp_load_error: "Erreur lors du chargement du fichier .HSP",
            project_not_initialized: "Système de projets non initialisé",
            no_active_project: "Aucun projet actif",

            // Confirmations
            confirm_reset_channels: "Réinitialiser la configuration des canaux à leur état par défaut ?",
            confirm_reset_sections: "Réinitialiser l'ordre des sections ?",
            confirm_close_project: "Voulez-vous vraiment fermer le projet \"{name}\" ?",
            confirm_close_last_project: "Voulez-vous vraiment fermer le projet \"{name}\" ?\n\nAttention : C'est le dernier projet ouvert.",
            confirm_delete_preset: "Supprimer le preset \"{name}\" ?",

            // Erreurs
            invalid_times: "Temps invalides",
            cannot_interpolate: "Impossible d'interpoler les valeurs Y",
            formula_required: "Veuillez entrer une formule",
            no_channels: "Aucun canal disponible. Veuillez charger des données d'abord.",
            data_not_available: "Données non disponibles. Veuillez charger un fichier d'abord.",
            no_valid_channels: "Aucun canal avec des données valides trouvé.",
            error: "Erreur: {message}",
            calculated_channel_not_found: "Canal calculé introuvable",
            no_spectrogram: "Aucun spectrogramme à exporter.",
            filename_required: "Veuillez entrer un nom de fichier",

            // Prompts
            prompt_interval_comment: "Commentaire pour cet intervalle (Xs):",
            prompt_view_name: "Nouveau nom de la vue:",
            prompt_hsp_filename: "Nom du fichier .HSP:"
        },

        // ===== LABELS ET TEXTES DIVERS =====
        labels: {
            close: "Fermer",
            cancel: "Annuler",
            save: "Enregistrer",
            delete: "Supprimer",
            edit: "Modifier",
            create: "Créer",
            export: "Exporter",
            import: "Importer",
            ok: "OK",
            yes: "Oui",
            no: "Non",
            apply: "Appliquer",
            reset: "Réinitialiser",
            clear: "Effacer",
            add: "Ajouter",
            remove: "Retirer",
            select: "Sélectionner",
            select_all: "Tout sélectionner",
            deselect_all: "Tout désélectionner",
            loading: "Chargement...",
            saving: "Enregistrement...",
            processing: "Traitement en cours...",
            ready: "Prêt.",
            error: "Erreur",
            warning: "Attention",
            info: "Information",
            success: "Succès",
            file: "Fichier",
            folder: "Dossier",
            name: "Nom",
            description: "Description",
            type: "Type",
            size: "Taille",
            date: "Date",
            actions: "Actions",
            options: "Options",
            settings: "Paramètres",
            preferences: "Préférences",
            help: "Aide",
            about: "À propos",
            version: "Version",
            status: "Statut",
            none: "Aucun",
            all: "Tout",
            other: "Autre",
            custom: "Personnalisé",
            default: "Par défaut",
            example: "Exemple"
        }
    },

    // ===== VERSION ANGLAISE =====
    en: {
        // UI PRINCIPALE
        file: "File",
        load_csv: "Import .csv file",
        open_proj: "Open .hsp file",
        save_proj: "Save .HSP file",
        generator: "Generator",
        export_csv: "Export .csv file",
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
        peak_sens: "Peak Sensitivity:",
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
        spectrogram_title: "STFT SPECTROGRAM",

        // MENUS
        menu: {
            graphs: "Graphs",
            time: "Time",
            frequency: "Frequency",
            spectro: "Spectro",
            open_hsp: "Open .hsp file",
            save_hsp: "Save .hsp",
            save_hsp_as: "Save .hsp as",
            import_csv: "Import .csv file",
            export_hsp: "Export to .hsp",
            export_csv: "Export .csv file",
            export_png: "Export PNG",
            export_pdf: "Export PDF"
        },

        // SIDEBAR
        sidebar: {
            canal_header: "Channel",
            tools_header: "Tools",
            measure: "Measure",
            track: "Track",
            diff_measure: "Difference Measurement",
            marker: "Marker",
            create: "Create",
            move: "Move",
            click_to_create: "Click on the graph to create a marker",
            markers_created: "Created markers:",
            no_marker: "No markers",
            interval: "Interval",
            no_interval: "No intervals",
            diff_channel: "Diff/Channel",
            select_channel: "Select a channel",
            manual_input: "Manual input:",
            time_start: "Start time (s):",
            time_end: "End time (s):",
            create_btn: "Create",
            diff_instructions: "Select a channel then click 2 points on the graph OR use manual input",
            diff_created: "Created Diff/Channel:",
            channel_smoothing: "Channel Smoothing",
            source_channel: "Source channel:",
            select_option: "-- Select --",
            name: "Name:",
            color: "Color:",
            smoothing_points: "Smoothing points:",
            smoothed_channels: "Smoothed channels:",
            calculated_channel: "Calculated Channel",
            available_channels: "Available channels:",
            formula: "Formula:",
            calculated_channels: "Calculated channels:",
            pan_zoom: "Pan / Zoom",
            pan: "Pan",
            horizontal: "Horizontal",
            vertical: "Vertical",
            y_zero: "Y=0",
            zoom: "Zoom",
            grid: "Grid",
            t_min: "T min (s)",
            t_max: "T max (s)",
            zoom_note: "Ctrl+Wheel and Alt+Wheel keep their function",
            saved_views: "Saved views",
            create_view: "Create a view",
            no_saved_views: "No saved views.",
            center_cursor: "Center cursor",
            fft_channel: "FFT Channel",
            comments: "Comments",
            notes_placeholder: "Notes...",
            color_range: "Color Range:"
        },

        // TOOLTIPS
        tooltips: {
            toggle_sidebar: "Show/Hide Sidebar",
            multi_channel_config: "Multi-Channel Configuration",
            settings: "Settings",
            help: "Help",
            y_axis_left: "Y axis on left",
            y_axis_right: "Y axis on right",
            mode_create: "Create Mode: Click on the graph to create a marker",
            mode_move: "Move Mode: Click on a marker to move it",
            formula_help: "Formula help",
            reset_zoom_auto: "Reset Zoom + Auto Grouped",
            reset_zoom: "Reset Zoom"
        },

        // MODALES
        modals: {
            export_file: "Export file",
            filename: "Filename:",
            enter_name: "Enter name...",
            cancel: "Cancel",
            export: "Export",
            download_location: "Exported file location",
            multi_channel_config: "Multi-Channel Configuration",
            tabs: {
                channels: "Channels",
                settings: "Settings",
                instructions: "Instructions"
            },
            channel_x: "Channel X:",
            min_s: "Min (s):",
            max_s: "Max (s):",
            name: "Name",
            y_min: "Y Min",
            y_max: "Y Max",
            fft: "FFT",
            preset: "Preset",
            y_scale_presets: "Y Scale Presets",
            auto_channel: "Auto Channel",
            auto_grouped: "Auto Grouped",
            preset_1_to_5: "Preset 1 to 5"
        },

        // PLACEHOLDERS
        placeholders: {
            zero: "0.000",
            smoothed_channel: "Smoothed channel",
            optional: "Optional",
            formula_example: "Ex: S2-S1 or sqrt(S1^2+S2^2)",
            notes: "Notes...",
            enter_name: "Enter name...",
            preset_name: "Ex: My vibration config",
            preset_desc: "Preset description...",
            comment: "Enter a comment..."
        },

        // MESSAGES DE STATUT
        status: {
            ready: "Application ready",
            ready_multi: "Application ready (Multi-project system enabled)",
            zoom_applied: "Zoom applied",
            zoom_invalid: "Invalid zoom values",
            no_data: "No data",
            no_data_to_display: "No data to display",
            zoom_reset: "Zoom reset to full time range",
            zoom_reset_all: "Zoom reset on all graphs",
            fs_updated: "Fs updated to {fs} Hz",
            fs_configured: "Fs configured to {fs} Hz",
            data_centered: "Cursors centered (adjusted to limits)",
            data_centered_full: "Cursors centered on full data",
            no_data_to_center: "No data to center",

            marker_activated: "Marker tool activated - Click on a graph point",
            marker_deactivated: "Marker tool deactivated",
            marker_mode_create: "Create Mode: Click on the graph to create a marker",
            marker_mode_move: "Move Mode: Click on a marker to move it",
            marker_no_channel: "No channel found at this position",

            measure_activated: "Measure tool activated - Click on the graph to place points",
            measure_deactivated: "Measure tool deactivated",
            measure_cleared: "Measurements cleared",
            measure_point1: "Point 1 placed - Click to place point 2",
            measure_point2: "Point 2 placed - Drag points to adjust or use Clear",
            measure_complete: "2 points already placed - Drag to adjust or click Clear",

            ruler_activated: "Ruler tool activated - Click on the graph to place point",
            ruler_deactivated: "Ruler tool deactivated",
            ruler_cleared: "Measurement cleared",
            ruler_placed: "Point placed - Drag to adjust or use Clear",
            ruler_adjusted: "Point adjusted",

            track_activated: "Track tool activated - Move mouse over the graph",
            track_deactivated: "Track tool deactivated",
            track_cleared: "Tracking cleared",
            track_fixed: "Track cursor fixed - Click on it to move",
            track_repositioned: "Track cursor repositioned",

            diff_activated: "Diff/Channel tool activated - Select a channel then click 2 points",
            diff_deactivated: "Diff/Channel tool deactivated",
            diff_no_channel: "No channel selected",
            diff_channel_unavailable: "Selected channel is no longer available",
            diff_cannot_interpolate: "Cannot interpolate value on this channel",
            diff_point1: "Point 1 placed - Click to place point 2",
            diff_modified: "Point modified",
            diff_annotation_moved: "Horizontal/vertical/diagonal annotation repositioned",

            interval_activated: "Interval mode activated: Click 2 points to define interval",
            interval_deactivated: "Interval mode deactivated - You can now move cursors",
            interval_modified: "Interval modified",

            pan_activated: "Pan mode activated - Click and drag to move the graph",
            pan_deactivated: "Pan mode deactivated",
            y_zero_activated: "Y=0 mode activated - Curves are centered on Y=0",
            y_zero_deactivated: "Y=0 mode deactivated",
            pan_invalid_values: "Invalid T min/T max values",

            smoothing_saved: "✅ Changes saved",
            smoothing_no_source: "⚠️ Please select a source channel",
            smoothing_invalid_source: "⚠️ Invalid source channel",
            smoothing_no_info: "⚠️ Cannot find source channel information",
            smoothing_not_found: "⚠️ Smoothed channel not found",

            calculated_not_found: "⚠️ Calculated channel not found",

            auto_preset_no_channel: "ℹ️ Auto-Preset: No eligible channel (check that channels are visible and have no preset)",
            auto_preset_channel_no_eligible: "ℹ️ Auto-Preset Channel: No eligible channel",

            spectrogram_calculated: "Spectrogram calculated.",
            spectrogram_exported: "Spectrogram exported.",

            csv_invalid: "Invalid CSV file",
            csv_not_enough_data: "Not enough valid data in file",
            file_load_error: "Error loading file",
            csv_exported: "CSV file exported (1 channel, all data, European format).",

            capture_preparing: "Preparing capture...",
            capture_success: "Capture successful!",
            capture_simple: "Simple capture performed",
            capture_failed: "Complete capture failure",
            save_cancelled: "Save cancelled",
            pdf_generating: "Generating PDF...",
            pdf_chart_error: "Error capturing time chart",
            pdf_success: "PDF export successful!",
            export_error_type: "Error: unknown export type",
            export_error: "Export error",

            view_error_capture: "Error: cannot capture state",
            view_error_no_chart: "Error: no chart available"
        },

        // DIALOGUES
        dialogs: {
            no_data: "No data.",
            no_data_to_export: "No data to export.",
            file_not_hsp: "This file is already .HSP format. Use 'Save' or 'Save as'.",
            file_is_hsp: "This project is not a .HSP file. Use 'Export to .HSP'.",
            file_open_error: "Error opening file",
            hsp_load_error: "Error loading .HSP file",
            project_not_initialized: "Project system not initialized",
            no_active_project: "No active project",

            confirm_reset_channels: "Reset channel configuration to default?",
            confirm_reset_sections: "Reset section order?",
            confirm_close_project: "Do you really want to close project \"{name}\"?",
            confirm_close_last_project: "Do you really want to close project \"{name}\"?\n\nWarning: This is the last open project.",
            confirm_delete_preset: "Delete preset \"{name}\"?",

            invalid_times: "Invalid times",
            cannot_interpolate: "Cannot interpolate Y values",
            formula_required: "Please enter a formula",
            no_channels: "No channels available. Please load data first.",
            data_not_available: "Data not available. Please load a file first.",
            no_valid_channels: "No channel with valid data found.",
            error: "Error: {message}",
            calculated_channel_not_found: "Calculated channel not found",
            no_spectrogram: "No spectrogram to export.",
            filename_required: "Please enter a filename",

            prompt_interval_comment: "Comment for this interval (Xs):",
            prompt_view_name: "New view name:",
            prompt_hsp_filename: ".HSP filename:"
        },

        // LABELS
        labels: {
            close: "Close",
            cancel: "Cancel",
            save: "Save",
            delete: "Delete",
            edit: "Edit",
            create: "Create",
            export: "Export",
            import: "Import",
            ok: "OK",
            yes: "Yes",
            no: "No",
            apply: "Apply",
            reset: "Reset",
            clear: "Clear",
            add: "Add",
            remove: "Remove",
            select: "Select",
            select_all: "Select all",
            deselect_all: "Deselect all",
            loading: "Loading...",
            saving: "Saving...",
            processing: "Processing...",
            ready: "Ready.",
            error: "Error",
            warning: "Warning",
            info: "Information",
            success: "Success",
            file: "File",
            folder: "Folder",
            name: "Name",
            description: "Description",
            type: "Type",
            size: "Size",
            date: "Date",
            actions: "Actions",
            options: "Options",
            settings: "Settings",
            preferences: "Preferences",
            help: "Help",
            about: "About",
            version: "Version",
            status: "Status",
            none: "None",
            all: "All",
            other: "Other",
            custom: "Custom",
            default: "Default",
            example: "Example"
        }
    },

    // ===== VERSION ALLEMANDE =====
    de: {
        // UI PRINCIPALE
        file: "Datei",
        load_csv: ".csv-Datei importieren",
        open_proj: ".hsp-Datei öffnen",
        save_proj: ".HSP-Datei speichern",
        generator: "Generator",
        export_csv: ".csv-Datei exportieren",
        export_png: "PNG exportieren",
        settings: "Einstellungen",
        help: "Hilfe",
        acquisition: "Erfassung",
        channel: "Kanal:",
        step_ms: "Schritt (ms):",
        fs_label: "Fs:",
        points_n: "Punkte (N):",
        stats_zone: "Statistik (Cursor-Zone)",
        min: "Min:",
        max: "Max:",
        mean: "Mittelwert:",
        std: "Std.-Abw.:",
        fft_params: "FFT-Parameter",
        window: "Fenster:",
        fft_pts: "FFT-Punkte:",
        peak_sens: "Peak-Empfindlichkeit:",
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
        spectrogram_title: "STFT-SPEKTROGRAMM",

        // MENUS
        menu: {
            graphs: "Diagramme",
            time: "Zeit",
            frequency: "Frequenz",
            spectro: "Spektro",
            open_hsp: ".hsp-Datei öffnen",
            save_hsp: ".hsp speichern",
            save_hsp_as: ".hsp speichern als",
            import_csv: ".csv-Datei importieren",
            export_hsp: "Nach .hsp exportieren",
            export_csv: ".csv-Datei exportieren",
            export_png: "PNG exportieren",
            export_pdf: "PDF exportieren"
        },

        // SIDEBAR
        sidebar: {
            canal_header: "Kanal",
            tools_header: "Werkzeuge",
            measure: "Messen",
            track: "Verfolgen",
            diff_measure: "Differenzmessung",
            marker: "Markierung",
            create: "Erstellen",
            move: "Verschieben",
            click_to_create: "Klicken Sie auf das Diagramm, um eine Markierung zu erstellen",
            markers_created: "Erstellte Markierungen:",
            no_marker: "Keine Markierungen",
            interval: "Intervall",
            no_interval: "Keine Intervalle",
            diff_channel: "Diff/Kanal",
            select_channel: "Kanal auswählen",
            manual_input: "Manuelle Eingabe:",
            time_start: "Startzeit (s):",
            time_end: "Endzeit (s):",
            create_btn: "Erstellen",
            diff_instructions: "Wählen Sie einen Kanal und klicken Sie 2 Punkte im Diagramm ODER verwenden Sie manuelle Eingabe",
            diff_created: "Erstellte Diff/Kanal:",
            channel_smoothing: "Kanal-Glättung",
            source_channel: "Quellkanal:",
            select_option: "-- Auswählen --",
            name: "Name:",
            color: "Farbe:",
            smoothing_points: "Glättungspunkte:",
            smoothed_channels: "Geglättete Kanäle:",
            calculated_channel: "Berechneter Kanal",
            available_channels: "Verfügbare Kanäle:",
            formula: "Formel:",
            calculated_channels: "Berechnete Kanäle:",
            pan_zoom: "Verschieben / Zoomen",
            pan: "Verschieben",
            horizontal: "Horizontal",
            vertical: "Vertikal",
            y_zero: "Y=0",
            zoom: "Zoom",
            grid: "Gitternetz",
            t_min: "T min (s)",
            t_max: "T max (s)",
            zoom_note: "Strg+Rad und Alt+Rad behalten ihre Funktion",
            saved_views: "Gespeicherte Ansichten",
            create_view: "Ansicht erstellen",
            no_saved_views: "Keine gespeicherten Ansichten.",
            center_cursor: "Cursor zentrieren",
            fft_channel: "FFT-Kanal",
            comments: "Kommentare",
            notes_placeholder: "Notizen...",
            color_range: "Farbbereich:"
        },

        // TOOLTIPS
        tooltips: {
            toggle_sidebar: "Seitenleiste ein/aus",
            multi_channel_config: "Mehrkanal-Konfiguration",
            settings: "Einstellungen",
            help: "Hilfe",
            y_axis_left: "Y-Achse links",
            y_axis_right: "Y-Achse rechts",
            mode_create: "Erstellungsmodus: Klicken Sie auf das Diagramm, um eine Markierung zu erstellen",
            mode_move: "Verschiebemodus: Klicken Sie auf eine Markierung, um sie zu verschieben",
            formula_help: "Formelhilfe",
            reset_zoom_auto: "Zoom zurücksetzen + Auto gruppiert",
            reset_zoom: "Zoom zurücksetzen"
        },

        // MODALES
        modals: {
            export_file: "Datei exportieren",
            filename: "Dateiname:",
            enter_name: "Name eingeben...",
            cancel: "Abbrechen",
            export: "Exportieren",
            download_location: "Speicherort der exportierten Dateien",
            multi_channel_config: "Mehrkanal-Konfiguration",
            tabs: {
                channels: "Kanäle",
                settings: "Einstellungen",
                instructions: "Anweisungen"
            },
            channel_x: "Kanal X:",
            min_s: "Min (s):",
            max_s: "Max (s):",
            name: "Name",
            y_min: "Y Min",
            y_max: "Y Max",
            fft: "FFT",
            preset: "Voreinstellung",
            y_scale_presets: "Y-Achsen-Voreinstellungen",
            auto_channel: "Auto Kanal",
            auto_grouped: "Auto Gruppiert",
            preset_1_to_5: "Voreinstellung 1 bis 5"
        },

        // PLACEHOLDERS
        placeholders: {
            zero: "0.000",
            smoothed_channel: "Geglätteter Kanal",
            optional: "Optional",
            formula_example: "Bsp: S2-S1 oder sqrt(S1^2+S2^2)",
            notes: "Notizen...",
            enter_name: "Name eingeben...",
            preset_name: "Bsp: Meine Schwingungskonfiguration",
            preset_desc: "Voreinstellungsbeschreibung...",
            comment: "Kommentar eingeben..."
        },

        // MESSAGES DE STATUT
        status: {
            ready: "Anwendung bereit",
            ready_multi: "Anwendung bereit (Mehrprojektsystem aktiviert)",
            zoom_applied: "Zoom angewendet",
            zoom_invalid: "Ungültige Zoom-Werte",
            no_data: "Keine Daten",
            no_data_to_display: "Keine Daten zum Anzeigen",
            zoom_reset: "Zoom auf gesamten Zeitbereich zurückgesetzt",
            zoom_reset_all: "Zoom auf allen Diagrammen zurückgesetzt",
            fs_updated: "Fs auf {fs} Hz aktualisiert",
            fs_configured: "Fs auf {fs} Hz konfiguriert",
            data_centered: "Cursor zentriert (an Grenzen angepasst)",
            data_centered_full: "Cursor auf vollständige Daten zentriert",
            no_data_to_center: "Keine Daten zum Zentrieren",

            marker_activated: "Markierungswerkzeug aktiviert - Klicken Sie auf einen Diagrammpunkt",
            marker_deactivated: "Markierungswerkzeug deaktiviert",
            marker_mode_create: "Erstellungsmodus: Klicken Sie auf das Diagramm, um eine Markierung zu erstellen",
            marker_mode_move: "Verschiebemodus: Klicken Sie auf eine Markierung, um sie zu verschieben",
            marker_no_channel: "Kein Kanal an dieser Position gefunden",

            measure_activated: "Messwerkzeug aktiviert - Klicken Sie auf das Diagramm, um Punkte zu platzieren",
            measure_deactivated: "Messwerkzeug deaktiviert",
            measure_cleared: "Messungen gelöscht",
            measure_point1: "Punkt 1 platziert - Klicken Sie, um Punkt 2 zu platzieren",
            measure_point2: "Punkt 2 platziert - Ziehen Sie Punkte zum Anpassen oder verwenden Sie Löschen",
            measure_complete: "2 Punkte bereits platziert - Ziehen zum Anpassen oder klicken Sie Löschen",

            ruler_activated: "Linealwerkzeug aktiviert - Klicken Sie auf das Diagramm, um Punkt zu platzieren",
            ruler_deactivated: "Linealwerkzeug deaktiviert",
            ruler_cleared: "Messung gelöscht",
            ruler_placed: "Punkt platziert - Ziehen zum Anpassen oder verwenden Sie Löschen",
            ruler_adjusted: "Punkt angepasst",

            track_activated: "Verfolgungswerkzeug aktiviert - Bewegen Sie die Maus über das Diagramm",
            track_deactivated: "Verfolgungswerkzeug deaktiviert",
            track_cleared: "Verfolgung gelöscht",
            track_fixed: "Verfolgungscursor fixiert - Klicken Sie darauf, um ihn zu verschieben",
            track_repositioned: "Verfolgungscursor neu positioniert",

            diff_activated: "Diff/Kanal-Werkzeug aktiviert - Wählen Sie einen Kanal und klicken Sie 2 Punkte",
            diff_deactivated: "Diff/Kanal-Werkzeug deaktiviert",
            diff_no_channel: "Kein Kanal ausgewählt",
            diff_channel_unavailable: "Ausgewählter Kanal ist nicht mehr verfügbar",
            diff_cannot_interpolate: "Wert auf diesem Kanal kann nicht interpoliert werden",
            diff_point1: "Punkt 1 platziert - Klicken Sie, um Punkt 2 zu platzieren",
            diff_modified: "Punkt geändert",
            diff_annotation_moved: "Horizontale/vertikale/diagonale Anmerkung neu positioniert",

            interval_activated: "Intervallmodus aktiviert: Klicken Sie 2 Punkte, um das Intervall zu definieren",
            interval_deactivated: "Intervallmodus deaktiviert - Sie können jetzt Cursor verschieben",
            interval_modified: "Intervall geändert",

            pan_activated: "Verschiebemodus aktiviert - Klicken und ziehen Sie, um das Diagramm zu verschieben",
            pan_deactivated: "Verschiebemodus deaktiviert",
            y_zero_activated: "Y=0-Modus aktiviert - Kurven sind auf Y=0 zentriert",
            y_zero_deactivated: "Y=0-Modus deaktiviert",
            pan_invalid_values: "Ungültige T min/T max Werte",

            smoothing_saved: "✅ Änderungen gespeichert",
            smoothing_no_source: "⚠️ Bitte wählen Sie einen Quellkanal",
            smoothing_invalid_source: "⚠️ Ungültiger Quellkanal",
            smoothing_no_info: "⚠️ Quellkanalinformationen nicht gefunden",
            smoothing_not_found: "⚠️ Geglätteter Kanal nicht gefunden",

            calculated_not_found: "⚠️ Berechneter Kanal nicht gefunden",

            auto_preset_no_channel: "ℹ️ Auto-Voreinstellung: Kein geeigneter Kanal (überprüfen Sie, dass Kanäle sichtbar sind und keine Voreinstellung haben)",
            auto_preset_channel_no_eligible: "ℹ️ Auto-Voreinstellung Kanal: Kein geeigneter Kanal",

            spectrogram_calculated: "Spektrogramm berechnet.",
            spectrogram_exported: "Spektrogramm exportiert.",

            csv_invalid: "Ungültige CSV-Datei",
            csv_not_enough_data: "Nicht genug gültige Daten in der Datei",
            file_load_error: "Fehler beim Laden der Datei",
            csv_exported: "CSV-Datei exportiert (1 Kanal, alle Daten, europäisches Format).",

            capture_preparing: "Erfassung wird vorbereitet...",
            capture_success: "Erfassung erfolgreich!",
            capture_simple: "Einfache Erfassung durchgeführt",
            capture_failed: "Erfassung vollständig fehlgeschlagen",
            save_cancelled: "Speichern abgebrochen",
            pdf_generating: "PDF wird generiert...",
            pdf_chart_error: "Fehler beim Erfassen des Zeitdiagramms",
            pdf_success: "PDF-Export erfolgreich!",
            export_error_type: "Fehler: unbekannter Exporttyp",
            export_error: "Exportfehler",

            view_error_capture: "Fehler: Status kann nicht erfasst werden",
            view_error_no_chart: "Fehler: kein Diagramm verfügbar"
        },

        // DIALOGUES
        dialogs: {
            no_data: "Keine Daten.",
            no_data_to_export: "Keine Daten zum Exportieren.",
            file_not_hsp: "Diese Datei ist bereits im .HSP-Format. Verwenden Sie 'Speichern' oder 'Speichern als'.",
            file_is_hsp: "Dieses Projekt ist keine .HSP-Datei. Verwenden Sie 'Nach .HSP exportieren'.",
            file_open_error: "Fehler beim Öffnen der Datei",
            hsp_load_error: "Fehler beim Laden der .HSP-Datei",
            project_not_initialized: "Projektsystem nicht initialisiert",
            no_active_project: "Kein aktives Projekt",

            confirm_reset_channels: "Kanalkonfiguration auf Standard zurücksetzen?",
            confirm_reset_sections: "Abschnittsreihenfolge zurücksetzen?",
            confirm_close_project: "Möchten Sie Projekt \"{name}\" wirklich schließen?",
            confirm_close_last_project: "Möchten Sie Projekt \"{name}\" wirklich schließen?\n\nAchtung: Dies ist das letzte geöffnete Projekt.",
            confirm_delete_preset: "Voreinstellung \"{name}\" löschen?",

            invalid_times: "Ungültige Zeiten",
            cannot_interpolate: "Y-Werte können nicht interpoliert werden",
            formula_required: "Bitte geben Sie eine Formel ein",
            no_channels: "Keine Kanäle verfügbar. Bitte laden Sie zuerst Daten.",
            data_not_available: "Daten nicht verfügbar. Bitte laden Sie zuerst eine Datei.",
            no_valid_channels: "Kein Kanal mit gültigen Daten gefunden.",
            error: "Fehler: {message}",
            calculated_channel_not_found: "Berechneter Kanal nicht gefunden",
            no_spectrogram: "Kein Spektrogramm zum Exportieren.",
            filename_required: "Bitte geben Sie einen Dateinamen ein",

            prompt_interval_comment: "Kommentar für dieses Intervall (Xs):",
            prompt_view_name: "Neuer Ansichtsname:",
            prompt_hsp_filename: ".HSP-Dateiname:"
        },

        // LABELS
        labels: {
            close: "Schließen",
            cancel: "Abbrechen",
            save: "Speichern",
            delete: "Löschen",
            edit: "Bearbeiten",
            create: "Erstellen",
            export: "Exportieren",
            import: "Importieren",
            ok: "OK",
            yes: "Ja",
            no: "Nein",
            apply: "Anwenden",
            reset: "Zurücksetzen",
            clear: "Löschen",
            add: "Hinzufügen",
            remove: "Entfernen",
            select: "Auswählen",
            select_all: "Alles auswählen",
            deselect_all: "Alles abwählen",
            loading: "Laden...",
            saving: "Speichern...",
            processing: "Verarbeitung läuft...",
            ready: "Bereit.",
            error: "Fehler",
            warning: "Warnung",
            info: "Information",
            success: "Erfolg",
            file: "Datei",
            folder: "Ordner",
            name: "Name",
            description: "Beschreibung",
            type: "Typ",
            size: "Größe",
            date: "Datum",
            actions: "Aktionen",
            options: "Optionen",
            settings: "Einstellungen",
            preferences: "Einstellungen",
            help: "Hilfe",
            about: "Über",
            version: "Version",
            status: "Status",
            none: "Keine",
            all: "Alle",
            other: "Andere",
            custom: "Benutzerdefiniert",
            default: "Standard",
            example: "Beispiel"
        }
    }
};

// ===== FONCTION DE TRADUCTION t() =====
/**
 * Fonction de traduction multilingue
 * @param {string} key - Clé de traduction (support notation point: "status.zoom_applied")
 * @param {object} params - Paramètres optionnels pour interpolation {placeholder: value}
 * @returns {string} Texte traduit ou clé si non trouvée
 *
 * Exemples:
 *   t('file')                          → "Fichier"
 *   t('status.zoom_applied')           → "Zoom appliqué"
 *   t('status.fs_updated', {fs: 1000}) → "Fs mis à jour à 1000 Hz"
 */
function t(key, params = {}) {
    const lang = (typeof appState !== 'undefined' && appState.lang) || 'fr';
    const keys = key.split('.');
    let text = i18nTranslations[lang];

    // Navigation dans l'objet avec notation point
    for (const k of keys) {
        if (text && typeof text === 'object') {
            text = text[k];
        } else {
            console.warn(`i18n: Clé "${key}" non trouvée pour la langue "${lang}"`);
            return key;
        }
    }

    if (typeof text !== 'string') {
        console.warn(`i18n: Clé "${key}" ne pointe pas vers une chaîne pour la langue "${lang}"`);
        return key;
    }

    // Interpolation des paramètres {placeholder}
    return text.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
    });
}

// Export pour utilisation globale
window.i18nTranslations = i18nTranslations;
window.t = t;

console.log('✅ Système de traduction i18n chargé (FR, EN, DE)');
