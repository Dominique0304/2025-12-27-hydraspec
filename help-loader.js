// =====================================================
// CHARGEUR DE CONTENU D'AIDE - HydraSpec Pro
// Injecte le contenu d'aide dans le modal selon la langue
// =====================================================

function loadHelpContent(lang = 'fr') {
    const content = helpContent[lang] || helpContent['fr'];
    const helpContainer = document.getElementById('help-content');

    if (!helpContainer) {
        console.error('Help content container not found');
        return;
    }

    // Construire le HTML avec navigation
    let html = '';

    // Navigation rapide
    html += `<div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">`;
    html += `<p style="font-weight: bold; margin: 0 0 10px 0;">${content.navigation.title}</p>`;
    html += `<div style="display: flex; flex-wrap: wrap; gap: 8px;">`;

    content.navigation.sections.forEach(section => {
        html += `<a href="#${section.id}" style="background: var(--accent-blue); color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 0.85rem; transition: all 0.2s;" onmouseover="this.style.background='var(--accent-blue-hover)'" onmouseout="this.style.background='var(--accent-blue)'">${section.label}</a>`;
    });

    html += `</div></div>`;

    // Sections de contenu
    const sections = content.sections;

    // Section Démarrage
    html += `<section id="getting-started" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.gettingStarted.title}</h3>`;
    html += sections.gettingStarted.content;
    html += `</section>`;

    // Section Fichiers
    html += `<section id="file-operations" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.fileOperations.title}</h3>`;
    html += sections.fileOperations.content;
    html += `</section>`;

    // Section Temporel
    html += `<section id="temporal" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.temporal.title}</h3>`;
    html += sections.temporal.content;
    html += `</section>`;

    // Section Fréquentiel
    html += `<section id="frequency" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.frequency.title}</h3>`;
    html += sections.frequency.content;
    html += `</section>`;

    // Section Spectrogramme
    html += `<section id="spectrogram" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.spectrogram.title}</h3>`;
    html += sections.spectrogram.content;
    html += `</section>`;

    // Section Outils de Mesure
    html += `<section id="measure-tools" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.measureTools.title}</h3>`;
    html += sections.measureTools.content;
    html += `</section>`;

    // Section Annotations
    html += `<section id="annotations" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.annotations.title}</h3>`;
    html += sections.annotations.content;
    html += `</section>`;

    // Section Navigation & Zoom
    html += `<section id="navigation-zoom" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.navigationZoom.title}</h3>`;
    html += sections.navigationZoom.content;
    html += `</section>`;

    // Section Canaux
    html += `<section id="channels" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.channels.title}</h3>`;
    html += sections.channels.content;
    html += `</section>`;

    // Section Configuration
    html += `<section id="config" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.config.title}</h3>`;
    html += sections.config.content;
    html += `</section>`;

    // Section Raccourcis
    html += `<section id="shortcuts" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.shortcuts.title}</h3>`;
    html += sections.shortcuts.content;
    html += `</section>`;

    // Section Astuces
    html += `<section id="tips" style="margin-bottom: 30px;">`;
    html += `<h3 style="color: var(--accent-blue); border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${sections.tips.title}</h3>`;
    html += sections.tips.content;
    html += `</section>`;

    // Injecter le HTML
    helpContainer.innerHTML = html;

    // Smooth scroll pour les liens d'ancre
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    console.log(`✅ Aide chargée en ${lang}`);
}

// Charger l'aide au démarrage
document.addEventListener('DOMContentLoaded', () => {
    // Charger l'aide dans la langue par défaut
    const defaultLang = appState?.lang || 'fr';
    loadHelpContent(defaultLang);
});

// Recharger l'aide quand la langue change
const originalChangeLanguage = window.changeLanguage;
if (originalChangeLanguage) {
    window.changeLanguage = function(lang) {
        originalChangeLanguage(lang);
        loadHelpContent(lang);
    };
}
