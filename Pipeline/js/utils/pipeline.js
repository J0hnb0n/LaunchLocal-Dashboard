/* ============================================
   LaunchLocal — Pipeline Transition Utility
   ============================================

   Centralized pipeline status transitions for prospects + project lifecycle.
   This is the single source of truth for:
     - Legal forward & backward edges
     - Atomic write (status + log activity)
     - Side-effect dispatch (project creation on sold)
     - Toasts + activity log uniform shape (module: 'pipeline')

   All status-change call sites in modules (prospects.js, sales.js,
   project-detail.js, sites.js QA-revert) route through here. Module-specific
   side effects (sales.visit log, sites.qaStatus write, billing invoice ops)
   stay in their owning modules.

   Public API:
     LaunchLocal.Pipeline.advanceProspect(id, fromStatus, toStatus, options)
     LaunchLocal.Pipeline.setProjectStage(id, fromStage, toStage, options)
     LaunchLocal.Pipeline.LEGAL_PROSPECT_TRANSITIONS  (frozen object)
     LaunchLocal.Pipeline.LEGAL_PROJECT_TRANSITIONS   (frozen object)
     LaunchLocal.Pipeline.TIER_DEFAULTS               (frozen object — monthlyFee in cents)
     LaunchLocal.Pipeline.resolveMonthlyFee(prospect) (helper for project-creation sites)
   ============================================ */

(function () {
    'use strict';

    // ---------- LEGAL TRANSITIONS ----------

    const LEGAL_PROSPECT_TRANSITIONS = Object.freeze({
        'new':         Object.freeze(['approved', 'archived']),
        'approved':    Object.freeze(['site-queued', 'archived']),
        'site-queued': Object.freeze(['site-ready', 'approved']),       // approved = regenerate-back path
        'site-ready':  Object.freeze(['pitched', 'site-queued', 'archived']), // site-queued = qa revert
        'pitched':     Object.freeze(['sold', 'site-ready', 'archived']),     // site-ready = cool-off
        'sold':        Object.freeze(['site-ready']),                          // admin rollback
        'archived':    Object.freeze(['new'])                                  // restore
    });

    const LEGAL_PROJECT_TRANSITIONS = Object.freeze({
        'onboarding':  Object.freeze(['active', 'churned']),
        'active':      Object.freeze(['maintenance', 'renewal-due', 'churned']),
        'maintenance': Object.freeze(['active', 'renewal-due', 'churned']),
        'renewal-due': Object.freeze(['active', 'maintenance', 'churned']),
        'churned':     Object.freeze(['active'])
    });

    // ---------- TIER DEFAULTS (monthlyFee in cents) ----------

    const TIER_DEFAULTS = Object.freeze({
        basic:    15000,
        standard: 25000,
        premium:  40000
    });

    /**
     * Resolve the default monthlyFee (cents) for a prospect being converted
     * to a project. Prefers the SmartPricing recommendation when available
     * (with a maintenance value in dollars), falls back to the tier lookup,
     * then to the basic tier.
     */
    function resolveMonthlyFee(prospect) {
        // SmartPricing returns `maintenance` in DOLLARS (per sales-script.js
        // TIER_BASE shape). If that engine is loaded and returns a number,
        // prefer it — convert to cents.
        try {
            const reco = window.LaunchLocal?.SalesScript?.getSmartPricing?.(prospect);
            if (reco && typeof reco.maintenance === 'number' && reco.maintenance > 0) {
                return Math.round(reco.maintenance * 100);
            }
        } catch (_) { /* fall through to tier defaults */ }

        const tier = prospect?.maintenanceTier || 'basic';
        return TIER_DEFAULTS[tier] != null ? TIER_DEFAULTS[tier] : TIER_DEFAULTS.basic;
    }

    // ---------- HELPERS ----------

    function isLegalProspectTransition(from, to) {
        const allowed = LEGAL_PROSPECT_TRANSITIONS[from];
        return Array.isArray(allowed) && allowed.includes(to);
    }

    function isLegalProjectTransition(from, to) {
        const allowed = LEGAL_PROJECT_TRANSITIONS[from];
        return Array.isArray(allowed) && allowed.includes(to);
    }

    function defaultProspectToast(p, fromStatus, toStatus, projectCreated) {
        const name = p?.businessName || 'Prospect';
        if (toStatus === 'approved')   return { msg: `${name} approved — moved to Prelim Site Works.`, level: 'success' };
        if (toStatus === 'archived')   return { msg: `${name} archived.`, level: 'info' };
        if (toStatus === 'site-queued' && fromStatus === 'site-ready')
            return { msg: 'Pitch queue updated — revision needed before pitching.', level: 'warning' };
        if (toStatus === 'site-ready'  && fromStatus === 'sold')
            return { msg: `${name} rolled back to prospect (site-ready).`, level: 'success' };
        if (toStatus === 'site-ready'  && fromStatus === 'pitched')
            return { msg: 'Moved back to pitch queue.', level: 'info' };
        if (toStatus === 'pitched')    return { msg: `${name} marked pitched.`, level: 'info' };
        if (toStatus === 'sold')       return projectCreated
            ? { msg: `Deal closed! ${name} is now a client.`, level: 'success' }
            : { msg: `${name} marked sold.`, level: 'success' };
        if (toStatus === 'new' && fromStatus === 'archived')
            return { msg: `${name} restored.`, level: 'info' };
        return { msg: `${name} moved to ${toStatus}.`, level: 'info' };
    }

    function defaultProjectToast(proj, fromStage, toStage) {
        const name = proj?.clientName || 'Project';
        return { msg: `${name} stage: ${fromStage} → ${toStage}.`, level: 'info' };
    }

    // ---------- PROSPECT TRANSITION ----------

    /**
     * Advance a prospect through the pipeline.
     *
     * @param {string} prospectId
     * @param {string} fromStatus
     * @param {string} toStatus
     * @param {Object} [options]
     * @param {boolean} [options.silent]    — skip toast
     * @param {string}  [options.reason]    — passed into activityLog metadata
     * @param {boolean} [options.batchOnly] — return batch ops without committing (currently a no-op
     *                                         passthrough since side effects can't run inside a batch)
     * @returns {Promise<{ok:boolean, newStatus?:string, projectCreated?:boolean, error?:string}>}
     */
    async function advanceProspect(prospectId, fromStatus, toStatus, options = {}) {
        const opts = options || {};
        try {
            if (!prospectId)  return { ok: false, error: 'Missing prospectId' };
            if (!fromStatus)  return { ok: false, error: 'Missing fromStatus' };
            if (!toStatus)    return { ok: false, error: 'Missing toStatus' };
            if (fromStatus === toStatus) return { ok: false, error: 'No-op transition' };

            if (!isLegalProspectTransition(fromStatus, toStatus)) {
                const errMsg = `Illegal prospect transition: ${fromStatus} → ${toStatus}`;
                window.log?.warn?.(errMsg) ?? console.warn(errMsg);
                if (!opts.silent && window.LaunchLocal?.toast) {
                    LaunchLocal.toast(`Cannot move from ${fromStatus} to ${toStatus}.`, 'warning');
                }
                return { ok: false, error: errMsg };
            }

            // Read current doc to confirm state matches and to get the
            // businessName/etc for the activity log + side effects.
            let prospect = null;
            try {
                prospect = await DB.getDoc('prospects', prospectId);
            } catch (_) { /* tolerate read failure — write below will surface it */ }

            // Atomic write. Side effects run after — they need the updated doc
            // to exist, and project creation is independent of the prospect
            // write so a Firestore batch isn't needed here.
            await DB.updateDoc('prospects', prospectId, { status: toStatus });

            // Side effect: project creation on sold transition.
            let projectCreated = false;
            if (toStatus === 'sold' && fromStatus !== 'sold' && prospect) {
                try {
                    if (window.ProspectsModule?.ensureProjectForProspect) {
                        const before = await DB.getDocs('projects', { where: [['prospectId', '==', prospectId]] });
                        await ProspectsModule.ensureProjectForProspect(prospect);
                        const after = await DB.getDocs('projects', { where: [['prospectId', '==', prospectId]] });
                        projectCreated = after.length > before.length;
                    }
                } catch (sideErr) {
                    window.log?.warn?.('Pipeline: project side-effect failed', sideErr);
                }
            }

            // Activity log. Fire-and-forget but awaited so failures surface.
            // metadata includes legacy `newStatus`/`oldStatus`/`status` aliases
            // so metrics.js (which reads those keys) keeps working unchanged.
            try {
                await DB.logActivity(
                    toStatus === 'sold' ? 'deal_closed' : 'status_changed',
                    'pipeline',
                    `${prospect?.businessName || 'Prospect'}: ${fromStatus} → ${toStatus}`,
                    {
                        from: fromStatus,
                        to: toStatus,
                        oldStatus: fromStatus,
                        newStatus: toStatus,
                        status: toStatus,
                        reason: opts.reason || null,
                        projectCreated
                    },
                    prospectId
                );
            } catch (_) { /* logActivity swallows already; double-safety */ }

            // Toast.
            if (!opts.silent && window.LaunchLocal?.toast) {
                const t = defaultProspectToast(prospect, fromStatus, toStatus, projectCreated);
                LaunchLocal.toast(t.msg, t.level);
            }

            return { ok: true, newStatus: toStatus, projectCreated };
        } catch (err) {
            console.error('Pipeline.advanceProspect failed:', err);
            if (!opts.silent && window.LaunchLocal?.toast) {
                LaunchLocal.toast('Failed to update status.', 'error');
            }
            return { ok: false, error: err.message || String(err) };
        }
    }

    // ---------- PROJECT STAGE TRANSITION ----------

    /**
     * Set a project's lifecycle stage (onboarding/active/maintenance/renewal-due/churned).
     *
     * @returns {Promise<{ok:boolean, newStage?:string, error?:string}>}
     */
    async function setProjectStage(projectId, fromStage, toStage, options = {}) {
        const opts = options || {};
        try {
            if (!projectId) return { ok: false, error: 'Missing projectId' };
            if (!fromStage) return { ok: false, error: 'Missing fromStage' };
            if (!toStage)   return { ok: false, error: 'Missing toStage' };
            if (fromStage === toStage) return { ok: false, error: 'No-op transition' };

            if (!isLegalProjectTransition(fromStage, toStage)) {
                const errMsg = `Illegal project stage transition: ${fromStage} → ${toStage}`;
                window.log?.warn?.(errMsg) ?? console.warn(errMsg);
                if (!opts.silent && window.LaunchLocal?.toast) {
                    LaunchLocal.toast(`Cannot move project from ${fromStage} to ${toStage}.`, 'warning');
                }
                return { ok: false, error: errMsg };
            }

            let proj = null;
            try { proj = await DB.getDoc('projects', projectId); } catch (_) { /* tolerate */ }

            await DB.updateDoc('projects', projectId, { status: toStage });

            try {
                await DB.logActivity(
                    'lifecycle_changed',
                    'pipeline',
                    `${proj?.clientName || 'Project'}: ${fromStage} → ${toStage}`,
                    {
                        from: fromStage,
                        to: toStage,
                        reason: opts.reason || null
                    },
                    projectId
                );
            } catch (_) { /* swallowed in DB.logActivity */ }

            if (!opts.silent && window.LaunchLocal?.toast) {
                const t = defaultProjectToast(proj, fromStage, toStage);
                LaunchLocal.toast(t.msg, t.level);
            }

            return { ok: true, newStage: toStage };
        } catch (err) {
            console.error('Pipeline.setProjectStage failed:', err);
            if (!opts.silent && window.LaunchLocal?.toast) {
                LaunchLocal.toast('Failed to update project stage.', 'error');
            }
            return { ok: false, error: err.message || String(err) };
        }
    }

    // ---------- EXPORT ----------

    window.LaunchLocal = window.LaunchLocal || {};
    LaunchLocal.Pipeline = {
        advanceProspect,
        setProjectStage,
        LEGAL_PROSPECT_TRANSITIONS,
        LEGAL_PROJECT_TRANSITIONS,
        TIER_DEFAULTS,
        resolveMonthlyFee,
        isLegalProspectTransition,
        isLegalProjectTransition
    };
})();
