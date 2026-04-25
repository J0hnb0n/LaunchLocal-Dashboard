/* ============================================
   LaunchLocal — Site Generation Prompt Builder
   ============================================ */

/**
 * PromptGenerator — loads the master CLAUDE.md prompt template and an
 * industry-specific template, substitutes form data into placeholders,
 * and returns a finished prompt ready to paste into Claude Code.
 *
 * Templates live at /templates/site-generation/ and are fetched via HTTP.
 * Results are cached per-session so the fetch only happens once per template.
 */
const PromptGenerator = {
    templateCache: {},

    TEMPLATES: ['restaurant', 'tradesperson', 'salon', 'retail'],

    TEMPLATE_LABELS: {
        restaurant:   'Restaurant / Food Service',
        tradesperson: 'Tradesperson / Home Services',
        salon:        'Salon / Spa / Personal Services',
        retail:       'Retail / Shop'
    },

    TEMPLATE_VERSION: 'v1',

    /**
     * Fetch a template file and cache it.
     */
    async loadTemplate(path) {
        if (this.templateCache[path]) return this.templateCache[path];
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to load template: ${path} (${res.status})`);
        const text = await res.text();
        this.templateCache[path] = text;
        return text;
    },

    /**
     * Replace {{placeholder}} occurrences in a template string.
     * Missing values render as "[not specified]" so Claude Code can
     * flag them back to us rather than silently inserting blanks.
     */
    substitute(template, values) {
        return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
            const v = values[key];
            if (v === undefined || v === null || v === '') return '[not specified]';
            return String(v);
        });
    },

    /**
     * Build the final prompt.
     * @param {string} templateName - one of TEMPLATES
     * @param {Object} formData - keys matching master template placeholders
     * @returns {Promise<string>} the finished prompt
     */
    async generate(templateName, formData) {
        if (!this.TEMPLATES.includes(templateName)) {
            throw new Error(`Unknown template: ${templateName}`);
        }

        const [master, industryRaw] = await Promise.all([
            this.loadTemplate('templates/site-generation/CLAUDE.md'),
            this.loadTemplate(`templates/site-generation/${templateName}.md`)
        ]);

        // Substitute industry template first so any placeholders it uses
        // (e.g. {{businessName}}) resolve against formData too.
        const industryGuidance = this.substitute(industryRaw, formData);
        return this.substitute(master, { ...formData, industryGuidance });
    },

    /**
     * Build the canonical templateUsed identifier stored on the sites doc.
     */
    templateIdentifier(templateName) {
        return `${templateName}-${this.TEMPLATE_VERSION}`;
    }
};

// Expose on the global LaunchLocal namespace
LaunchLocal.PromptGenerator = PromptGenerator;
