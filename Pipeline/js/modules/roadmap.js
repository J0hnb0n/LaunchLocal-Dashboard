/* ============================================
   LaunchLocal — Roadmap Module
   2-week pre-sales sprint Gantt + checklist.
   Shared state synced via Firestore (roadmap/sprint).
   ============================================ */

const RoadmapModule = {

    cats: {
        F: { c: '#6366f1', n: 'Business formation' },
        I: { c: '#f59e0b', n: 'Identity' },
        B: { c: '#14b8a6', n: 'Banking' },
        C: { c: '#8b5cf6', n: 'Contracts' },
        P: { c: '#10b981', n: 'Pipeline & sales' }
    },

    days: [
        { n: 1,  d: 'Sat', m: 'Apr 25', weekend: true  },
        { n: 2,  d: 'Sun', m: 'Apr 26', weekend: true  },
        { n: 3,  d: 'Mon', m: 'Apr 27', weekend: false },
        { n: 4,  d: 'Tue', m: 'Apr 28', weekend: false },
        { n: 5,  d: 'Wed', m: 'Apr 29', weekend: false },
        { n: 6,  d: 'Thu', m: 'Apr 30', weekend: false },
        { n: 7,  d: 'Fri', m: 'May 1',  weekend: false },
        { n: 8,  d: 'Sat', m: 'May 2',  weekend: true  },
        { n: 9,  d: 'Sun', m: 'May 3',  weekend: true  },
        { n: 10, d: 'Mon', m: 'May 4',  weekend: false },
        { n: 11, d: 'Tue', m: 'May 5',  weekend: false },
        { n: 12, d: 'Wed', m: 'May 6',  weekend: false },
        { n: 13, d: 'Thu', m: 'May 7',  weekend: false },
        { n: 14, d: 'Fri', m: 'May 8',  weekend: false }
    ],

    sprintStart: new Date('2026-04-25T00:00:00'),
    sprintEnd:   new Date('2026-05-08T23:59:59'),

    baseTasks: [
        { id: 'T01', day: 1,  cat: 'F', t: 'Lock business name',                                                       deps: [],            note: "Joint with Clayton — pick name + verify availability via Ontario Business Registry's free name search. Everything else hangs off this; do it on day one." },
        { id: 'T02', day: 1,  cat: 'I', t: 'Register domain',                                                          deps: ['T01'],       note: 'Cloudflare Registrar or Google Domains. .com preferred + .ca optional. Needed because Google Workspace requires a domain you own.' },
        { id: 'T03', day: 2,  cat: 'I', t: 'Google Workspace setup (DNS, MX, both accounts, signatures, Drive)',       deps: ['T02'],       note: 'Verify domain, configure MX/SPF/DKIM/DMARC, create both partner mailboxes, add branded signatures, set up shared Drive folders for clients/contracts/finance/sales. One sitting.' },
        { id: 'T04', day: 3,  cat: 'F', t: 'Register Ontario partnership (Master Business Licence)',                   deps: ['T01'],       note: 'Online via Ontario Business Registry, ~$80, same day. Issues your registration certificate — required to open a business bank account.' },
        { id: 'T05', day: 3,  cat: 'I', t: 'Password manager + shared vault',                                          deps: ['T03'],       note: "1Password Business or Bitwarden. Required because in the next 10 days you'll be exchanging shared logins for banks, registries, SaaS, and contractor tools — emailing passwords or storing them in browsers is unsafe." },
        { id: 'T29', day: 3,  cat: 'I', t: 'Business phone number (Google Voice or Grasshopper)',                      deps: ['T03'],       note: 'Pick provider, claim a local number, route to both partner mailboxes/cells. Goes on email signatures and the sell sheet so prospects have one canonical inbound line.' },
        { id: 'T06', day: 4,  cat: 'F', t: 'CRA Business Number + HST registration',                                   deps: ['T04'],       note: 'Single online form (Business Registration Online). HST mandatory above $30k/yr — register up front so input tax credits start day 1, plus the bank wants the BN to open the account.' },
        { id: 'T07', day: 4,  cat: 'C', t: 'Draft partnership agreement',                                              deps: ['T01'],       note: '50/50 equity, decision rights, IP ownership, vesting (if any), exit/buyout, dispute resolution. Drafted in-house with Claude assist; revised by lawyer in week 2.' },
        { id: 'T08', day: 4,  cat: 'P', t: 'Pricing tiers + maintenance offering locked',                              deps: [],            note: "Decide entry/standard/premium tiers + monthly maintenance plan. Hard prerequisite for sales onboarding doc and scripts — those can't be written until pricing is settled." },
        { id: 'T09', day: 5,  cat: 'P', t: 'Pipeline polish — LaunchLocal Dashboard',                                  deps: [],            note: 'UX cleanup, bug fixes, finish in-flight features. The product itself needs to be ready for a salesperson to demo confidently.' },
        { id: 'T10', day: 6,  cat: 'B', t: 'Open business chequing account',                                           deps: ['T04','T06'], note: 'In-branch with partnership registration certificate + Business Number. RBC/TD/BMO/Scotia all comparable. Day 6 leaves a 24h cushion for CRA processing.' },
        { id: 'T11', day: 6,  cat: 'C', t: 'Draft salesperson contractor agreement',                                   deps: ['T07'],       note: 'Commission rate, territory, IP ownership of work product, NDA, termination, invoice-based commission payment. Reuses governance language from the partnership agreement.' },
        { id: 'T25', day: 6,  cat: 'F', t: 'Business insurance — general liability + E&O',                             deps: ['T04','T06'], note: 'Quote + bind via Zensurance or APOLLO (digital, ~30 min). GL ~$300–500/yr, E&O ~$500–800/yr. Many B2B clients ask for a certificate before signing. Partnerships have unlimited liability — without E&O, a broken client site that costs them sales becomes a personal-asset lawsuit.' },
        { id: 'T12', day: 7,  cat: 'B', t: 'Business credit card',                                                     deps: ['T10'],       note: 'Same bank as chequing for fastest approval. Pays SaaS subscriptions and expenses; needed for the Claude billing migration on day 10.' },
        { id: 'T13', day: 7,  cat: 'B', t: 'Bookkeeping setup (Wave)',                                                 deps: ['T10'],       note: "Wave is free. Connect chequing + credit card for auto-categorization. Required because the CRA mandates HST returns — you can't reconstruct this at year-end." },
        { id: 'T14', day: 7,  cat: 'C', t: 'Draft client services agreement',                                          deps: ['T11'],       note: 'Scope, payment terms, deliverables, warranty, IP, termination. Final draft of the three contracts; sent to the lawyer along with the other two.' },
        { id: 'T15', day: 7,  cat: 'C', t: 'Send all 3 drafts + book lawyer',                                          deps: ['T14'],       note: 'Email drafts and book the review meeting. Done Friday so the lawyer has the weekend to read; meeting falls Mon or Tue.' },
        { id: 'T26', day: 7,  cat: 'B', t: 'Stripe account setup',                                                     deps: ['T10','T06'], note: 'Required before the first client invoice goes out. Connect to business chequing for payouts. The Pipeline dashboard\'s stripeInvoiceId is the placeholder — Stripe replaces the manual flow once live. Verification can take 1–2 days; apply Friday.' },
        { id: 'T16', day: 8,  cat: 'P', t: 'Sales onboarding doc',                                                     deps: ['T08','T09'], note: 'Day-1 walkthrough for a new sales contractor — pipeline tour, pricing, demo assets, where to find what. Weekend doc work.' },
        { id: 'T27', day: 8,  cat: 'I', t: 'Logo + minimal brand kit',                                                 deps: ['T01'],       note: 'Wordmark logo, one primary color, typography pairing. Canva or Fiverr ($50–150). Required because email signatures, sell sheet, pitch deck, and demo header all assume a brand exists.' },
        { id: 'T17', day: 9,  cat: 'P', t: 'Sales scripts (cold outreach · pitch · follow-up)',                        deps: ['T08','T16'], note: 'Three scripts contractors adapt. Keeps voice consistent at the door and on the phone.' },
        { id: 'T28', day: 9,  cat: 'P', t: 'Sell sheet — 1-page leave-behind',                                         deps: ['T08','T27'], note: 'What a salesperson physically hands a prospect after a demo. Different from scripts (those are spoken). Includes pricing tiers, contact, 3–5 demo screenshots, value prop. Half-day in Canva.' },
        { id: 'T18', day: 10, cat: 'C', t: 'Lawyer review meeting',                                                    deps: ['T15'],       note: 'Walk through the three drafts. Capture all markup. Typically 1–2 hours.' },
        { id: 'T19', day: 10, cat: 'B', t: 'Migrate Claude subscriptions to business email + card',                    deps: ['T03','T12'], note: 'Both partners cancel personal Claude subs and re-subscribe under business email + business card. Expense flows through bookkeeping; tax-deductible.' },
        { id: 'T20', day: 10, cat: 'P', t: 'AI setup across computers',                                                deps: ['T03'],       note: "Claude Code installed on Clayton's machine, both signed in to business email, MCP servers configured, Pipeline repo cloned. Required so Clayton can run drafting + admin tasks in his lane." },
        { id: 'T21', day: 11, cat: 'C', t: 'Apply lawyer revisions to contracts',                                      deps: ['T18'],       note: 'Incorporate markup; produce final clean copies of all three agreements.' },
        { id: 'T22', day: 11, cat: 'P', t: 'Discord server setup',                                                     deps: [],            note: 'Channels for sales, dev, ops, leads, wins. Roles for partners + future contractors. Comms backbone for the team.' },
        { id: 'T23', day: 11, cat: 'P', t: 'Demo flow rehearsed end-to-end',                                           deps: ['T09'],       note: "Use Couwenberg / Lam's / Copper Mug demos. Rehearse prospecting → demo → close so day-1 of sales isn't fumbling at a live prospect." },
        { id: 'T24', day: 12, cat: 'C', t: 'Sign + execute all 3 contracts',                                           deps: ['T21'],       note: 'Sign partnership agreement first. Salesperson + client services templates filed for future use. Sprint complete; days 13–14 are buffer.' }
    ],

    // Mutable runtime state
    tasks: [],
    state: { checked: {}, days: {} },
    unsubscribe: null,
    saveTimeout: null,
    dragging: null,
    isDragging: false,
    pendingSnapshot: false,
    _docHandlersAttached: false,

    async render(container) {
        // Clone tasks so day overrides don't pollute baseTasks
        this.tasks = this.baseTasks.map((t) => ({ ...t }));
        this.state = { checked: {}, days: {} };

        container.innerHTML = this.getShellHTML();
        Icons.inject(container);
        this.bindEvents(container);
        this.attachListener();

        // Initial render — hydrates from Firestore on first snapshot
        this.buildGantt();
        this.buildChecklist();
        this.updateStats();

        return () => this.cleanup();
    },

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        if (this._docHandlersAttached) {
            document.removeEventListener('mousemove', this._onDocMouseMove);
            document.removeEventListener('mouseup', this._onDocMouseUp);
            document.removeEventListener('touchmove', this._onDocTouchMove);
            document.removeEventListener('touchend', this._onDocTouchEnd);
            window.removeEventListener('resize', this._onResize);
            this._docHandlersAttached = false;
        }
        clearTimeout(this.saveTimeout);
        this.dragging = null;
        this.isDragging = false;
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <div class="eyebrow">Pre-Sales Sprint</div>
                    <h2 class="page-title">2-Week Admin Sprint Roadmap</h2>
                    <p class="page-subtitle">Sat Apr 25 → Fri May 8, 2026 · Admin done before sales kickoff. Buffer Days 13–14.</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary btn-sm" id="roadmap-reset-btn" title="Reset all checks and date overrides">
                        <span data-icon="refresh"></span>
                        <span class="btn-text">Reset</span>
                    </button>
                </div>
            </div>

            <div id="roadmap-stats" class="kpi-grid">
                <div class="loading-screen" style="min-height:80px;grid-column:1/-1;"><div class="spinner"></div></div>
            </div>

            <div class="card" style="margin-top:var(--space-5);">
                <div class="card-header">
                    <h3 class="card-title">Decisions Locked</h3>
                </div>
                <div class="card-body roadmap-decisions">
                    <ul>
                        <li><span><strong>Structure:</strong> General partnership, 50/50 — Johnathon &amp; Clayton</span></li>
                        <li><span><strong>Salespeople:</strong> Independent contractors; commission paid against invoice</span></li>
                        <li><span><strong>Contracts:</strong> Drafted in-house with Claude, then lawyer review before signing</span></li>
                        <li><span><strong>Domain &amp; business name:</strong> To be locked in this sprint</span></li>
                    </ul>
                </div>
            </div>

            <div class="card" style="margin-top:var(--space-5);">
                <div class="card-header">
                    <h3 class="card-title">Category Legend</h3>
                </div>
                <div class="card-body">
                    <div class="roadmap-legend">
                        <span class="roadmap-chip" style="--c:#6366f1">Business formation</span>
                        <span class="roadmap-chip" style="--c:#f59e0b">Identity</span>
                        <span class="roadmap-chip" style="--c:#14b8a6">Banking</span>
                        <span class="roadmap-chip" style="--c:#8b5cf6">Contracts</span>
                        <span class="roadmap-chip" style="--c:#10b981">Pipeline &amp; sales</span>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top:var(--space-5);">
                <div class="card-header">
                    <h3 class="card-title">Gantt Timeline</h3>
                    <p class="card-subtitle">Drag any numbered dot left or right to reschedule. Changes sync across both partners in real time.</p>
                </div>
                <div class="card-body" style="padding:0;">
                    <div class="roadmap-gantt-wrapper" id="roadmap-gantt-wrapper">
                        <div class="roadmap-gantt" id="roadmap-gantt"></div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top:var(--space-5);">
                <div class="card-header">
                    <h3 class="card-title">Execution Order Checklist</h3>
                    <p class="card-subtitle">Strictly chronological — work top-to-bottom regardless of category.</p>
                </div>
                <div class="card-body">
                    <div class="roadmap-checklist" id="roadmap-checklist"></div>
                </div>
            </div>
        `;
    },

    attachListener() {
        const ref = LaunchLocal.db.collection('roadmap').doc('sprint');
        this.unsubscribe = ref.onSnapshot(
            (doc) => {
                if (this.isDragging) {
                    this.pendingSnapshot = true;
                    return;
                }
                if (doc.exists) {
                    const data = doc.data();
                    this.state.checked = data.checked || {};
                    this.state.days = data.days || {};
                } else {
                    this.state = { checked: {}, days: {} };
                }
                this.applyState();
                this.buildGantt();
                this.buildChecklist();
                this.updateStats();
            },
            (err) => {
                console.warn('Roadmap snapshot error:', err);
            }
        );
    },

    applyState() {
        this.tasks.forEach((t) => {
            const base = this.baseTasks.find((b) => b.id === t.id);
            t.day = this.state.days[t.id] || base.day;
        });
    },

    saveState() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            try {
                await LaunchLocal.db.collection('roadmap').doc('sprint').set({
                    checked: this.state.checked,
                    days: this.state.days,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: LaunchLocal.currentUser?.uid || null
                }, { merge: true });
            } catch (e) {
                LaunchLocal.toast('Save failed: ' + e.message, 'error');
            }
        }, 300);
    },

    orderedTasks() {
        return [...this.tasks].sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day;
            return a.id.localeCompare(b.id);
        });
    },

    buildGantt() {
        const g = document.getElementById('roadmap-gantt');
        if (!g) return;
        let html = '';
        let row = 1;

        // Header row
        html += `<div class="gh lane-label" style="grid-row:${row};grid-column:1">Step · Task</div>`;
        this.days.forEach((d, i) => {
            html += `<div class="gh${d.weekend ? ' weekend' : ''}" style="grid-row:${row};grid-column:${i + 2}"><span class="dow">${d.d}</span><strong>${d.m.split(' ')[1]}</strong></div>`;
        });
        row++;

        const ord = this.orderedTasks();
        ord.forEach((t, idx) => {
            const cat = this.cats[t.cat];
            html += `<div class="gl" data-task="${t.id}" style="grid-row:${row};grid-column:1;--c:${cat.c}">
                <span class="step">${idx + 1}</span>
                <span class="dot-mini" style="background:${cat.c}"></span>
                <span class="gtitle">${LaunchLocal.escapeHtml(t.t)}</span>
            </div>`;
            this.days.forEach((d, i) => {
                html += `<div class="gt${d.weekend ? ' weekend' : ''}" style="grid-row:${row};grid-column:${i + 2}"></div>`;
            });
            html += `<div class="roadmap-dot${this.state.checked[t.id] ? ' done' : ''}" data-task="${t.id}" style="grid-row:${row};grid-column:${t.day + 1};--c:${cat.c};background:${cat.c}" title="${LaunchLocal.escapeHtml(t.t)} — Day ${t.day}">${idx + 1}</div>`;
            row++;
        });

        g.innerHTML = html;
        this.drawTodayLine();
        this.attachDragHandlers();
    },

    dayWidth() {
        const g = document.getElementById('roadmap-gantt');
        if (!g) return 56;
        return (g.offsetWidth - 280) / 14;
    },

    drawTodayLine() {
        document.querySelectorAll('.roadmap-today-line').forEach((l) => l.remove());
        const today = new Date();
        const dayDiff = Math.floor((today - this.sprintStart) / (1000 * 60 * 60 * 24));
        if (dayDiff >= 0 && dayDiff < 14) {
            const wrapper = document.getElementById('roadmap-gantt-wrapper');
            if (!wrapper) return;
            const left = 280 + (dayDiff + 0.5) * this.dayWidth();
            const line = document.createElement('div');
            line.className = 'roadmap-today-line';
            line.style.left = left + 'px';
            wrapper.appendChild(line);
        }
    },

    attachDragHandlers() {
        document.querySelectorAll('.roadmap-dot').forEach((dot) => {
            const start = (clientX, taskId) => {
                const t = this.tasks.find((x) => x.id === taskId);
                if (!t) return;
                this.dragging = { task: t, dot, startX: clientX, startDay: t.day };
                this.isDragging = true;
                dot.classList.add('dragging');
            };
            dot.addEventListener('mousedown', (e) => { e.preventDefault(); start(e.clientX, dot.dataset.task); });
            dot.addEventListener('touchstart', (e) => { e.preventDefault(); start(e.touches[0].clientX, dot.dataset.task); }, { passive: false });
        });

        if (!this._docHandlersAttached) {
            this._onDocMouseMove = (e) => this.onDragMove(e.clientX);
            this._onDocMouseUp = () => this.onDragEnd();
            this._onDocTouchMove = (e) => { if (this.dragging) { e.preventDefault(); this.onDragMove(e.touches[0].clientX); } };
            this._onDocTouchEnd = () => this.onDragEnd();
            this._onResize = () => { this.drawTodayLine(); };
            document.addEventListener('mousemove', this._onDocMouseMove);
            document.addEventListener('mouseup', this._onDocMouseUp);
            document.addEventListener('touchmove', this._onDocTouchMove, { passive: false });
            document.addEventListener('touchend', this._onDocTouchEnd);
            window.addEventListener('resize', this._onResize);
            this._docHandlersAttached = true;
        }
    },

    onDragMove(clientX) {
        if (!this.dragging) return;
        const dW = this.dayWidth();
        const delta = Math.round((clientX - this.dragging.startX) / dW);
        const newDay = Math.max(1, Math.min(14, this.dragging.startDay + delta));
        if (newDay !== this.dragging.task.day) {
            this.dragging.task.day = newDay;
            this.state.days[this.dragging.task.id] = newDay;
            this.dragging.dot.style.gridColumn = (newDay + 1).toString();
            this.dragging.dot.title = `${this.dragging.task.t} — Day ${newDay}`;
        }
    },

    onDragEnd() {
        if (!this.dragging) return;
        this.dragging.dot.classList.remove('dragging');
        this.dragging = null;
        this.isDragging = false;
        this.saveState();
        this.buildGantt();
        this.buildChecklist();
        this.pendingSnapshot = false;
    },

    buildChecklist() {
        const c = document.getElementById('roadmap-checklist');
        if (!c) return;
        const ord = this.orderedTasks();
        c.innerHTML = ord.map((t, idx) => {
            const cat = this.cats[t.cat];
            const day = this.days.find((d) => d.n === t.day) || this.days[0];
            const depPills = t.deps.length
                ? t.deps.map((d) => `<span class="dep-pill">after ${d}</span>`).join('')
                : '';
            const isChecked = this.state.checked[t.id] ? 'checked' : '';
            const isDone = this.state.checked[t.id] ? 'done' : '';
            return `<div class="roadmap-step ${isDone}" data-id="${t.id}" style="--c:${cat.c}">
                <input type="checkbox" id="roadmap-cb-${t.id}" ${isChecked}>
                <div class="roadmap-step-num">${idx + 1}</div>
                <div>
                    <div class="roadmap-step-title">${LaunchLocal.escapeHtml(t.t)}</div>
                    <div class="roadmap-step-meta">
                        <span class="cat" style="color:${cat.c}">${cat.n}</span>
                        <span class="day-pill">${day.d} ${day.m}</span>
                        ${depPills}
                    </div>
                    <div class="roadmap-step-note">${LaunchLocal.escapeHtml(t.note)}</div>
                </div>
            </div>`;
        }).join('');
    },

    updateStats() {
        const el = document.getElementById('roadmap-stats');
        if (!el) return;
        const total = this.tasks.length;
        const done = Object.values(this.state.checked).filter(Boolean).length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((this.sprintEnd - now) / (1000 * 60 * 60 * 24)));

        el.innerHTML = `
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Days remaining</span><div class="kpi-card-icon ${daysLeft <= 3 ? 'red' : 'blue'}" data-icon="clock"></div></div>
                <div class="kpi-card-value"><span class="mono">${daysLeft}</span></div>
                <div class="kpi-card-change">until Fri May 8</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Steps done</span><div class="kpi-card-icon green" data-icon="checkCircle"></div></div>
                <div class="kpi-card-value"><span class="mono">${done} / ${total}</span></div>
                <div class="kpi-card-change">${total - done} remaining</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Progress</span><div class="kpi-card-icon blue" data-icon="trendUp"></div></div>
                <div class="kpi-card-value"><span class="mono">${pct}%</span></div>
                <div class="kpi-card-change">${pct >= 100 ? 'Sprint complete' : 'Keep going'}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Sprint window</span><div class="kpi-card-icon" data-icon="calendar"></div></div>
                <div class="kpi-card-value" style="font-size:14px;">Apr 25 → May 8</div>
                <div class="kpi-card-change">14 days · 12 active</div>
            </div>
        `;
        Icons.inject(el);
    },

    bindEvents(container) {
        container.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"]') && e.target.id.startsWith('roadmap-cb-')) {
                const id = e.target.id.replace('roadmap-cb-', '');
                this.state.checked[id] = e.target.checked;
                this.saveState();
                e.target.closest('.roadmap-step')?.classList.toggle('done', e.target.checked);
                const dot = document.querySelector(`.roadmap-dot[data-task="${id}"]`);
                if (dot) dot.classList.toggle('done', e.target.checked);
                this.updateStats();
            }
        });

        container.querySelector('#roadmap-reset-btn')?.addEventListener('click', async () => {
            if (!confirm('Reset all checks AND date overrides? This affects both partners.')) return;
            try {
                await LaunchLocal.db.collection('roadmap').doc('sprint').set({
                    checked: {},
                    days: {},
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: LaunchLocal.currentUser?.uid || null
                });
                LaunchLocal.toast('Roadmap reset.', 'success');
            } catch (e) {
                LaunchLocal.toast('Reset failed: ' + e.message, 'error');
            }
        });
    }
};

Router.register('roadmap', RoadmapModule, 'Roadmap', ['admin']);
