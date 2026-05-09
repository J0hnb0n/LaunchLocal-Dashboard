/* ============================================
   LaunchLocal — EmptyState factory
   ============================================
   Replaces the dozen-or-so hand-rolled .empty-state blocks scattered
   across modules. Pulls icons from the canonical Icons registry, so
   no more raw HTML entities.

   Usage:
     LaunchLocal.EmptyState.render({
       icon: 'search',
       title: 'No results',
       desc:  'Try a different search term.',
       ctaLabel: 'Open Scanner',
       ctaHref:  '#scanner',
       variant:  'default'   // 'default' | 'compact' | 'inline-error'
     })

   Pass either ctaHref OR ctaAction (data-action), not both.
   ============================================ */

(function (global) {
    'use strict';

    function renderCta({ ctaLabel, ctaHref, ctaAction }) {
        if (!ctaLabel) return '';
        const safeLabel = global.LaunchLocal?.escapeHtml?.(ctaLabel) ?? ctaLabel;
        if (ctaHref) {
            return `<a href="${ctaHref}" class="btn btn-subtle">${safeLabel}</a>`;
        }
        if (ctaAction) {
            return `<button class="btn btn-subtle" data-action="${ctaAction}">${safeLabel}</button>`;
        }
        return '';
    }

    const EmptyState = {
        render({ icon, title, desc, ctaLabel, ctaHref, ctaAction, variant } = {}) {
            const v = variant || 'default';
            const iconHtml = (icon && global.Icons) ? global.Icons.get(icon, 22) : '';
            const safeTitle = global.LaunchLocal?.escapeHtml?.(title || '') ?? (title || '');
            const safeDesc = global.LaunchLocal?.escapeHtml?.(desc || '') ?? (desc || '');
            const cta = renderCta({ ctaLabel, ctaHref, ctaAction });

            return `
                <div class="empty-state empty-state-${v}">
                    ${iconHtml ? `<div class="empty-state-icon">${iconHtml}</div>` : ''}
                    ${safeTitle ? `<h3 class="empty-state-title">${safeTitle}</h3>` : ''}
                    ${safeDesc ? `<p class="empty-state-desc">${safeDesc}</p>` : ''}
                    ${cta}
                </div>
            `;
        }
    };

    global.LaunchLocal = global.LaunchLocal || {};
    global.LaunchLocal.EmptyState = EmptyState;
})(window);
