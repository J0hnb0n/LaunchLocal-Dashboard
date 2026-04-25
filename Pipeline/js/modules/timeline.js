/* ============================================
   LaunchLocal — Pipeline Timeline Module
   Single-client, full-lifecycle view aggregating
   prospect + site + project + activityLog events.
   Accessed as #timeline?prospect=<id> or #timeline?project=<id>.
   ============================================ */

const TimelineModule = {

    async render(container) {
        const params = this.parseParams();
        const prospectId = params.prospect || null;
        const projectId = params.project || null;

        container.innerHTML = `
            <div class="timeline-wrap">
                <div class="timeline-header">
                    <div>
                        <div class="eyebrow">Lifecycle</div>
                        <h2 id="tl-title">Pipeline Timeline</h2>
                        <p class="meta" id="tl-sub">Loading…</p>
                    </div>
                    <div>
                        <button class="btn btn-secondary btn-sm" id="tl-back">
                            <span data-icon="chevronRight" style="transform: rotate(180deg);display:inline-flex;"></span>
                            Back
                        </button>
                    </div>
                </div>
                <div id="tl-body">
                    <div class="loading-screen"><div class="spinner spinner-lg"></div></div>
                </div>
            </div>
        `;

        Icons.inject(container);
        document.getElementById('tl-back').addEventListener('click', () => history.length > 1 ? history.back() : (window.location.hash = '#dashboard'));

        if (!prospectId && !projectId) {
            this.renderPicker();
            return null;
        }

        try {
            const nodes = await this.collectNodes({ prospectId, projectId });
            this.renderTimeline(nodes);
        } catch (e) {
            console.error(e);
            document.getElementById('tl-body').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${Icons.get('alert', 22)}</div>
                    <h3 class="empty-state-title">Failed to load timeline</h3>
                    <p class="empty-state-desc">${LaunchLocal.escapeHtml(e.message || 'Unknown error')}</p>
                </div>
            `;
        }

        return null;
    },

    parseParams() {
        const raw = window.location.hash.split('?')[1] || '';
        const out = {};
        raw.split('&').filter(Boolean).forEach((pair) => {
            const [k, v] = pair.split('=');
            if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });
        return out;
    },

    async renderPicker() {
        const body = document.getElementById('tl-body');
        document.getElementById('tl-title').textContent = 'Pick a Client';
        document.getElementById('tl-sub').textContent = 'Select a prospect or project to see its full lifecycle.';

        try {
            const [prospects, projects] = await Promise.all([
                DB.getDocs('prospects', { orderBy: [['createdAt', 'desc']], limit: 30 }),
                DB.getDocs('projects')
            ]);

            const projectIds = new Set(projects.map((p) => p.prospectId));
            const prospectList = prospects.map((p) => {
                const hasProject = projectIds.has(p.id);
                return `
                    <button class="prospect-picker-item" onclick="window.location.hash='#timeline?prospect=${p.id}'">
                        <div class="prospect-picker-name">${LaunchLocal.escapeHtml(p.businessName || 'Unnamed')}</div>
                        <div class="prospect-picker-meta">
                            <span>${p.status}</span>
                            <span>${LaunchLocal.escapeHtml(p.industry || '')}</span>
                            ${hasProject ? '<span class="chip chip-success">has project</span>' : ''}
                        </div>
                    </button>
                `;
            }).join('');

            body.innerHTML = `
                <div class="prospect-picker-list">${prospectList || '<p class="text-muted text-sm">No prospects yet.</p>'}</div>
            `;
        } catch (e) {
            body.innerHTML = `<div class="empty-state"><p class="empty-state-desc">${LaunchLocal.escapeHtml(e.message)}</p></div>`;
        }
    },

    async collectNodes({ prospectId, projectId }) {
        let prospect = null;
        let project = null;

        if (projectId) {
            project = await DB.getDoc('projects', projectId);
            if (project && project.prospectId) {
                prospect = await DB.getDoc('prospects', project.prospectId);
            }
        }
        if (!prospect && prospectId) {
            prospect = await DB.getDoc('prospects', prospectId);
        }
        if (!project && prospect) {
            // Check if a project exists for this prospect
            try {
                const matches = await DB.getDocs('projects', {
                    where: [['prospectId', '==', prospect.id]],
                    limit: 1
                });
                if (matches.length > 0) project = matches[0];
            } catch (_) { /* ignore */ }
        }

        if (!prospect && !project) {
            throw new Error('Client not found.');
        }

        const entity = project || prospect;
        const entityName = (prospect && prospect.businessName) || (project && project.clientName) || 'Client';

        document.getElementById('tl-title').textContent = entityName;
        const subParts = [];
        if (prospect) subParts.push(`Prospect: ${prospect.status}`);
        if (project) subParts.push(`Project: ${project.status}`);
        document.getElementById('tl-sub').textContent = subParts.join(' · ');

        // Find related site(s)
        let sites = [];
        if (prospect) {
            try {
                sites = await DB.getDocs('sites', { where: [['prospectId', '==', prospect.id]] });
            } catch (_) { /* ignore */ }
        }

        // Find related invoices (via projectId)
        let invoices = [];
        if (project) {
            try {
                invoices = await DB.getDocs('invoices', { where: [['projectId', '==', project.id]] });
            } catch (_) { /* ignore */ }
        }

        // Activity log filtered by entityIds
        const relevantIds = new Set();
        if (prospect) relevantIds.add(prospect.id);
        if (project) relevantIds.add(project.id);
        sites.forEach((s) => relevantIds.add(s.id));
        invoices.forEach((i) => relevantIds.add(i.id));

        let activity = [];
        try {
            // Pull a recent window and filter client-side (simpler than chained "in" queries)
            const recent = await DB.getDocs('activityLog', {
                orderBy: [['timestamp', 'desc']],
                limit: 200
            });
            activity = recent.filter((a) => a.entityId && relevantIds.has(a.entityId));
        } catch (_) { /* ignore */ }

        // Build timeline nodes
        const nodes = [];

        if (prospect) {
            nodes.push({
                ts: prospect.createdAt,
                title: 'Prospect created',
                desc: `${prospect.businessName} — ${prospect.industry || 'industry n/a'}. Score ${prospect.prospectScore ?? '—'}${prospect.hotLead ? ' · 🔥 hot lead' : ''}.`,
                variant: 'info',
                icon: 'search'
            });
            if (prospect.nextFollowUp) {
                nodes.push({
                    ts: prospect.nextFollowUp,
                    title: 'Follow-up scheduled',
                    desc: `Next touch set for ${prospect.nextFollowUp}.`,
                    variant: 'muted',
                    icon: 'calendar'
                });
            }
            (prospect.contactLog || []).forEach((c) => {
                nodes.push({
                    ts: c.date,
                    title: 'Contact logged',
                    desc: c.note,
                    variant: '',
                    icon: 'phone'
                });
            });
        }

        sites.forEach((s) => {
            nodes.push({
                ts: s.createdAt,
                title: 'Site generated',
                desc: `Template: ${s.templateUsed || 'custom'} — status ${s.status}.`,
                variant: 'info',
                icon: 'monitor'
            });
            if (s.qaStatus && s.qaStatus !== 'pending') {
                nodes.push({
                    ts: s.qaDate || s.updatedAt,
                    title: `QA ${s.qaStatus}`,
                    desc: s.qaFeedback || '',
                    variant: s.qaStatus === 'approved' ? 'success' : 'warning',
                    icon: s.qaStatus === 'approved' ? 'checkCircle' : 'alert'
                });
            }
        });

        if (project) {
            nodes.push({
                ts: project.startDate || project.createdAt,
                title: 'Project created',
                desc: `${project.clientName} — ${project.maintenanceTier || 'no tier'}, ${LaunchLocal.formatCurrency(project.monthlyFee || 0)}/mo.`,
                variant: 'success',
                icon: 'folder'
            });
            (project.revisions || []).forEach((r) => {
                nodes.push({
                    ts: r.requestedAt,
                    title: 'Revision ' + (r.status === 'complete' ? 'completed' : 'requested'),
                    desc: r.description,
                    variant: r.status === 'complete' ? 'success' : 'warning',
                    icon: 'edit'
                });
            });
            (project.communicationLog || []).forEach((c) => {
                nodes.push({
                    ts: c.date,
                    title: 'Communication',
                    desc: c.note,
                    variant: '',
                    icon: 'mail'
                });
            });
            if (project.renewalDate) {
                nodes.push({
                    ts: project.renewalDate,
                    title: 'Renewal date',
                    desc: 'Annual renewal comes due.',
                    variant: 'warning',
                    icon: 'refresh'
                });
            }
        }

        invoices.forEach((inv) => {
            nodes.push({
                ts: inv.issuedDate || inv.createdAt,
                title: `Invoice ${inv.status}`,
                desc: `${LaunchLocal.formatCurrency(inv.amount || 0)} · ${inv.type}${inv.notes ? ' — ' + inv.notes : ''}`,
                variant: inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'info',
                icon: 'wallet'
            });
            if (inv.paidDate) {
                nodes.push({
                    ts: inv.paidDate,
                    title: 'Payment received',
                    desc: `${LaunchLocal.formatCurrency(inv.amount || 0)} from ${inv.clientName}`,
                    variant: 'success',
                    icon: 'check'
                });
            }
        });

        // Activity log entries as generic nodes
        activity.forEach((a) => {
            nodes.push({
                ts: a.timestamp,
                title: a.action.replace(/_/g, ' '),
                desc: a.description,
                variant: 'muted',
                icon: 'activity',
                subtle: true
            });
        });

        // Sort chronologically ascending
        return nodes
            .filter((n) => n.ts)
            .sort((a, b) => this.toMillis(a.ts) - this.toMillis(b.ts));
    },

    toMillis(ts) {
        if (!ts) return 0;
        if (ts.toMillis) return ts.toMillis();
        if (ts.seconds) return ts.seconds * 1000;
        const d = new Date(ts);
        return isNaN(d) ? 0 : d.getTime();
    },

    renderTimeline(nodes) {
        const body = document.getElementById('tl-body');
        if (nodes.length === 0) {
            body.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${Icons.get('timeline', 22)}</div>
                    <h3 class="empty-state-title">No events yet</h3>
                    <p class="empty-state-desc">Events will appear here as the pipeline progresses.</p>
                </div>
            `;
            return;
        }

        body.innerHTML = `
            <div class="timeline-rail">
                ${nodes.map((n) => `
                    <div class="timeline-node node-${n.variant || 'info'}">
                        <div class="timeline-node-header">
                            <div class="timeline-node-title"><span data-icon="${n.icon || 'info'}" style="margin-right:6px;vertical-align:-2px;opacity:.7;"></span>${LaunchLocal.escapeHtml(n.title)}</div>
                            <div class="timeline-node-time">${this.formatTime(n.ts)}</div>
                        </div>
                        ${n.desc ? `<div class="timeline-node-desc">${LaunchLocal.escapeHtml(n.desc)}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        Icons.inject(body);
    },

    formatTime(ts) {
        if (!ts) return '';
        if (ts.toDate) return LaunchLocal.formatDate(ts);
        if (typeof ts === 'string' && /^\d{4}-\d{2}-\d{2}/.test(ts)) return ts;
        return LaunchLocal.formatDate(ts);
    }
};

Router.register('timeline', TimelineModule, 'Timeline');

// Support ?params in the hash — force a re-render when the timeline params
// change while already on the timeline route (Router.handleRoute would otherwise skip).
(function () {
    let lastTimelineHash = '';
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        const isTimeline = hash.startsWith('#timeline');
        if (isTimeline && Router.currentRoute === 'timeline' && hash !== lastTimelineHash) {
            Router.currentRoute = null;
            Router.handleRoute();
        }
        lastTimelineHash = isTimeline ? hash : '';
    });
})();
