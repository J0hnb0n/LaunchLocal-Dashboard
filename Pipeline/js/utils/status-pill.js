/* ============================================
   LaunchLocal — StatusPill factory
   ============================================
   Single source of truth for "badge" rendering across pipeline,
   QA, invoice, and project lifecycle statuses.

   Usage:
     LaunchLocal.StatusPill.render(status, options)

   options = {
     domain?: 'prospect' | 'qa' | 'invoice' | 'project',
     withIcon?: bool,
     withDot?: bool,
     label?: string,
     size?: 'sm' | 'md'
   }

   Returns an HTML string for use inside template literals.
   ============================================ */

(function (global) {
    'use strict';

    // Default labels per status. Domain disambiguates 'approved'
    // (prospect Approved vs qa Approved use the same string but differ
    // in the badge class — see DOMAIN_CLASS map below).
    const STATUS_LABELS = {
        // Prospect pipeline
        new: 'New',
        approved: 'Approved',
        'site-queued': 'Site Queued',
        'site-ready': 'Site Ready',
        pitched: 'Pitched',
        sold: 'Sold',
        archived: 'Archived',

        // QA
        pending: 'Awaiting QA',
        'revision-needed': 'Needs Revision',

        // Invoice
        draft: 'Draft',
        sent: 'Sent',
        paid: 'Paid',
        overdue: 'Overdue',
        void: 'Void',

        // Project lifecycle
        onboarding: 'Onboarding',
        active: 'Active',
        maintenance: 'Maintenance',
        'renewal-due': 'Renewal Due',
        churned: 'Churned'
    };

    // Map status (+ optional domain) to one of the icons that actually
    // exist in icons.js. If a suggested icon doesn't exist, we fall back
    // to a close cousin — see notes inline.
    //
    // Icons confirmed to exist in icons.js:
    //   sparkles, check, clock, bolt, alert, edit, send, checkCircle,
    //   xCircle, star, activity, refresh, info
    // Not present (fallbacks chosen):
    //   rocket -> bolt        (no rocket icon)
    //   megaphone -> star     (no megaphone)
    //   archive -> folder     (no archive)
    //   wrench -> settings    (no wrench/tool)
    //   pulse -> activity
    //   plusCircle -> sparkles  (for `new`)
    //   fileText -> edit
    const STATUS_ICONS = {
        // domain-qualified entries take precedence over bare ones
        'qa:pending': 'clock',
        'qa:approved': 'check',
        'qa:revision-needed': 'alert',

        // bare statuses
        new: 'sparkles',
        approved: 'check',
        'site-queued': 'clock',
        'site-ready': 'bolt',
        pitched: 'star',
        sold: 'star',
        archived: 'folder',

        pending: 'clock',
        'revision-needed': 'alert',

        draft: 'edit',
        sent: 'send',
        paid: 'checkCircle',
        overdue: 'alert',
        void: 'xCircle',

        onboarding: 'bolt',
        active: 'activity',
        maintenance: 'settings',
        'renewal-due': 'clock',
        churned: 'xCircle'
    };

    // Domain-qualified -> badge class. Lets us route 'approved' to a
    // different visual treatment for QA vs prospect, even though the
    // status string is identical. Bare entries handle the unique cases.
    const DOMAIN_CLASS = {
        // Prospect domain
        'prospect:new': 'badge-new',
        'prospect:approved': 'badge-approved',
        'prospect:site-queued': 'badge-site-queued',
        'prospect:site-ready': 'badge-site-ready',
        'prospect:pitched': 'badge-pitched',
        'prospect:sold': 'badge-sold',
        'prospect:archived': 'badge-archived',

        // QA domain
        'qa:pending': 'badge-pending',
        'qa:approved': 'badge-qa-approved',
        'qa:revision-needed': 'badge-revision-needed',

        // Invoice domain
        'invoice:draft': 'badge-draft',
        'invoice:sent': 'badge-sent',
        'invoice:paid': 'badge-paid',
        'invoice:overdue': 'badge-overdue',
        'invoice:void': 'badge-void',

        // Project lifecycle domain
        'project:onboarding': 'badge-onboarding',
        'project:active': 'badge-active',
        'project:maintenance': 'badge-maintenance',
        'project:renewal-due': 'badge-renewal-due',
        'project:churned': 'badge-churned'
    };

    // Inferred default domain when the caller didn't pass one. Statuses
    // that exist in only one domain map cleanly; ambiguous strings (like
    // 'approved') default to 'prospect'.
    function inferDomain(status) {
        if (['new', 'site-queued', 'site-ready', 'pitched', 'sold', 'archived'].includes(status)) return 'prospect';
        if (['pending', 'revision-needed'].includes(status)) return 'qa';
        if (['draft', 'sent', 'paid', 'overdue', 'void'].includes(status)) return 'invoice';
        if (['onboarding', 'active', 'maintenance', 'renewal-due', 'churned'].includes(status)) return 'project';
        // Ambiguous — caller should pass domain explicitly. Default to prospect.
        return 'prospect';
    }

    function classFor(domain, status) {
        const key = `${domain}:${status}`;
        return DOMAIN_CLASS[key] || `badge-${status}`;
    }

    function iconNameFor(domain, status) {
        return STATUS_ICONS[`${domain}:${status}`] || STATUS_ICONS[status] || null;
    }

    function labelFor(status) {
        return STATUS_LABELS[status] || status || 'Unknown';
    }

    const StatusPill = {
        render(status, options = {}) {
            const domain = options.domain || inferDomain(status);
            const cls = classFor(domain, status);
            const label = options.label || labelFor(status);
            const sizeCls = options.size === 'sm' ? ' badge-sm' : '';
            const dotCls = options.withDot ? ' with-dot' : '';
            let iconHtml = '';
            if (options.withIcon && global.Icons) {
                const icon = iconNameFor(domain, status);
                if (icon) iconHtml = global.Icons.get(icon, 12);
            }
            return `<span class="badge ${cls}${dotCls}${sizeCls}" data-status="${status}">${iconHtml}<span class="badge-label">${label}</span></span>`;
        },

        // Exposed for tests / introspection
        _labelFor: labelFor,
        _classFor: classFor,
        _iconNameFor: iconNameFor
    };

    global.LaunchLocal = global.LaunchLocal || {};
    global.LaunchLocal.StatusPill = StatusPill;
})(window);
