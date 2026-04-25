/* ============================================
   LaunchLocal — Expenses Module
   Edit-on-click, filters, monthly grouping.
   ============================================ */

const ExpensesModule = {
    expenses: [],
    editingId: null,
    filterCategory: 'all',
    filterRange: 'all',
    viewMode: 'flat', // 'flat' | 'monthly'

    async render(container) {
        container.innerHTML = this.getShellHTML();
        Icons.inject(container);
        this.bindEvents(container);
        await this.loadExpenses();
        return () => { this.expenses = []; this.editingId = null; };
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <div class="eyebrow">Operational Costs</div>
                    <h2 class="page-title">Expenses</h2>
                    <p class="page-subtitle">Track business costs and calculate Input Tax Credits (ITCs).</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary btn-sm" id="add-expense-btn">
                        <span data-icon="plus"></span>
                        <span class="btn-text">Add Expense</span>
                    </button>
                </div>
            </div>

            <div id="expense-kpis" class="kpi-grid">
                <div class="loading-screen" style="min-height:80px;grid-column:1/-1;"><div class="spinner"></div></div>
            </div>

            <div class="card" style="margin-top:var(--space-5);">
                <div class="card-header" style="gap: var(--space-3); flex-wrap: wrap;">
                    <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;flex:1;">
                        <select class="form-input" id="filter-category" style="max-width:200px;padding:6px 10px;font-size:var(--font-size-sm);">
                            <option value="all">All Categories</option>
                            <option value="software">Software</option>
                            <option value="api">API Usage</option>
                            <option value="advertising">Advertising</option>
                            <option value="domain-hosting">Domain &amp; Hosting</option>
                            <option value="equipment">Equipment</option>
                            <option value="contractor">Contractor</option>
                            <option value="travel">Travel</option>
                            <option value="other">Other</option>
                        </select>
                        <select class="form-input" id="filter-range" style="max-width:200px;padding:6px 10px;font-size:var(--font-size-sm);">
                            <option value="all">All Time</option>
                            <option value="this-month">This Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="ytd">Year to Date</option>
                        </select>
                    </div>
                    <div class="segmented" id="view-mode">
                        <button class="segmented-btn active" data-view="flat">Flat</button>
                        <button class="segmented-btn" data-view="monthly">By Month</button>
                    </div>
                </div>

                <div id="expense-content">
                    <div class="loading-screen" style="min-height:100px;"><div class="spinner spinner-lg"></div></div>
                </div>
            </div>

            <div class="modal-overlay" id="expense-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="expense-modal-title">Add Expense</h3>
                        <button class="modal-close" id="expense-modal-close" aria-label="Close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
                            <div>
                                <label class="form-label">Date *</label>
                                <input type="date" class="form-input" id="exp-date">
                            </div>
                            <div>
                                <label class="form-label">Category *</label>
                                <select class="form-input" id="exp-category">
                                    <option value="software">Software / Subscriptions</option>
                                    <option value="api">API Usage</option>
                                    <option value="advertising">Advertising</option>
                                    <option value="domain-hosting">Domain &amp; Hosting</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="contractor">Contractor / Freelancer</option>
                                    <option value="travel">Travel</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description *</label>
                            <input type="text" class="form-input" id="exp-desc" placeholder="e.g. Claude API usage — March">
                        </div>
                        <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
                            <div>
                                <label class="form-label">Amount (CAD) *</label>
                                <input type="number" class="form-input" id="exp-amount" placeholder="49.00" min="0" step="0.01">
                            </div>
                            <div>
                                <label class="form-label">HST Paid (13%)</label>
                                <input type="number" class="form-input" id="exp-hst" placeholder="6.37" min="0" step="0.01">
                                <p class="form-hint">Auto-calculated on amount input</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea class="form-input" id="exp-notes" rows="2" placeholder="Optional notes..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" id="exp-delete" style="display:none;margin-right:auto;color:var(--danger);">
                            <span data-icon="trash"></span>Delete
                        </button>
                        <button class="btn btn-secondary" id="exp-cancel">Cancel</button>
                        <button class="btn btn-primary" id="exp-save">
                            <span data-icon="check"></span>
                            <span class="btn-text">Save</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async loadExpenses() {
        try {
            this.expenses = await DB.getDocs('expenses', { orderBy: [['date', 'desc']] });
        } catch {
            this.expenses = [];
        }
        this.renderKPIs();
        this.renderContent();
    },

    applyFilters(expenses) {
        let out = expenses;
        if (this.filterCategory !== 'all') {
            out = out.filter((e) => e.category === this.filterCategory);
        }
        if (this.filterRange !== 'all') {
            const now = new Date();
            let start, end = null;
            if (this.filterRange === 'this-month') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (this.filterRange === 'last-month') {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            } else if (this.filterRange === 'quarter') {
                const q = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), q * 3, 1);
            } else if (this.filterRange === 'ytd') {
                start = new Date(now.getFullYear(), 0, 1);
            }
            out = out.filter((e) => {
                if (!e.date) return false;
                const d = new Date(e.date);
                if (isNaN(d)) return false;
                if (end) return d >= start && d <= end;
                return d >= start;
            });
        }
        return out;
    },

    renderKPIs() {
        const el = document.getElementById('expense-kpis');
        if (!el) return;

        const scoped = this.applyFilters(this.expenses);
        const total = scoped.reduce((s, e) => s + (e.amount || 0), 0);
        const totalHST = scoped.reduce((s, e) => s + (e.hstPaid || 0), 0);
        const net = total - totalHST;

        el.innerHTML = `
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Total Spent</span><div class="kpi-card-icon red" data-icon="receipt"></div></div>
                <div class="kpi-card-value"><span class="mono">${LaunchLocal.formatCurrency(total)}</span></div>
                <div class="kpi-card-change">${scoped.length} entries</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">HST Paid (ITCs)</span><div class="kpi-card-icon green" data-icon="checkCircle"></div></div>
                <div class="kpi-card-value"><span class="mono" style="color:var(--success);">${LaunchLocal.formatCurrency(totalHST)}</span></div>
                <div class="kpi-card-change">Claimable at tax time</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Net Cost</span><div class="kpi-card-icon blue" data-icon="trendDown"></div></div>
                <div class="kpi-card-value"><span class="mono">${LaunchLocal.formatCurrency(net)}</span></div>
                <div class="kpi-card-change">After HST recovery</div>
            </div>
        `;
        Icons.inject(el);
    },

    renderContent() {
        const container = document.getElementById('expense-content');
        if (!container) return;

        const scoped = this.applyFilters(this.expenses);

        if (scoped.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="margin: var(--space-4);">
                    <div class="empty-state-icon">${Icons.get('receipt', 22)}</div>
                    <h3 class="empty-state-title">No expenses in this view</h3>
                    <p class="empty-state-desc">${this.filterCategory !== 'all' || this.filterRange !== 'all' ? 'Try clearing the filters.' : 'Track business costs to calculate ITCs at tax time.'}</p>
                </div>
            `;
            return;
        }

        if (this.viewMode === 'monthly') {
            container.innerHTML = this.renderMonthlyView(scoped);
        } else {
            container.innerHTML = this.renderFlatTable(scoped);
        }

        container.querySelectorAll('[data-expense-edit]').forEach((row) => {
            row.addEventListener('click', () => this.openEditModal(row.getAttribute('data-expense-edit')));
        });
    },

    renderFlatTable(expenses) {
        return `
            <div class="table-wrapper" style="border:none;border-radius:0;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th style="text-align:right;">Amount</th>
                            <th style="text-align:right;">HST</th>
                            <th style="text-align:right;">Net</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.map((exp) => `
                            <tr class="clickable" data-expense-edit="${exp.id}" title="Click to edit">
                                <td class="mono td-sub">${exp.date || '—'}</td>
                                <td><span class="chip">${this.categoryLabel(exp.category)}</span></td>
                                <td>
                                    <div class="td-name">${LaunchLocal.escapeHtml(exp.description || '—')}</div>
                                    ${exp.notes ? `<div class="td-sub" style="font-family:inherit;">${LaunchLocal.escapeHtml(exp.notes.slice(0, 80))}${exp.notes.length > 80 ? '…' : ''}</div>` : ''}
                                </td>
                                <td style="text-align:right;"><strong class="mono">${LaunchLocal.formatCurrency(exp.amount || 0)}</strong></td>
                                <td style="text-align:right;" class="mono td-sub" style="color:var(--success);">${LaunchLocal.formatCurrency(exp.hstPaid || 0)}</td>
                                <td style="text-align:right;" class="mono td-sub">${LaunchLocal.formatCurrency((exp.amount || 0) - (exp.hstPaid || 0))}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderMonthlyView(expenses) {
        const groups = new Map();
        expenses.forEach((e) => {
            const key = (e.date || '').slice(0, 7) || 'undated';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(e);
        });

        const blocks = [...groups.entries()]
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([month, rows]) => {
                const total = rows.reduce((s, e) => s + (e.amount || 0), 0);
                const hst = rows.reduce((s, e) => s + (e.hstPaid || 0), 0);
                const monthLabel = month === 'undated' ? 'Undated' : new Date(month + '-01').toLocaleDateString('en-CA', { year: 'numeric', month: 'long' });

                return `
                    <div style="padding: var(--space-4) var(--space-5) 0;">
                        <div class="detail-section-title" style="display:flex;justify-content:space-between;align-items:center;">
                            <span>${monthLabel}</span>
                            <span style="display:flex;gap:var(--space-3);">
                                <span class="mono">${LaunchLocal.formatCurrency(total)}</span>
                                <span class="mono" style="color:var(--success);">${LaunchLocal.formatCurrency(hst)} HST</span>
                            </span>
                        </div>
                    </div>
                    ${this.renderFlatTable(rows)}
                `;
            }).join('<div class="divider" style="margin: 0;"></div>');

        return blocks;
    },

    categoryLabel(cat) {
        return ({
            software: 'Software', api: 'API', advertising: 'Ads',
            'domain-hosting': 'Hosting', equipment: 'Equipment',
            contractor: 'Contractor', travel: 'Travel', other: 'Other'
        })[cat] || cat;
    },

    openCreateModal() {
        this.editingId = null;
        document.getElementById('expense-modal-title').textContent = 'Add Expense';
        document.getElementById('exp-delete').style.display = 'none';
        document.getElementById('exp-date').value = new Date().toISOString().slice(0, 10);
        document.getElementById('exp-category').value = 'software';
        document.getElementById('exp-desc').value = '';
        document.getElementById('exp-amount').value = '';
        document.getElementById('exp-hst').value = '';
        document.getElementById('exp-notes').value = '';
        document.getElementById('expense-modal').classList.add('open');
    },

    openEditModal(id) {
        const exp = this.expenses.find((e) => e.id === id);
        if (!exp) return;
        this.editingId = id;
        document.getElementById('expense-modal-title').textContent = 'Edit Expense';
        document.getElementById('exp-delete').style.display = '';
        document.getElementById('exp-date').value = exp.date || '';
        document.getElementById('exp-category').value = exp.category || 'other';
        document.getElementById('exp-desc').value = exp.description || '';
        document.getElementById('exp-amount').value = ((exp.amount || 0) / 100).toFixed(2);
        document.getElementById('exp-hst').value = ((exp.hstPaid || 0) / 100).toFixed(2);
        document.getElementById('exp-notes').value = exp.notes || '';
        document.getElementById('expense-modal').classList.add('open');
    },

    bindEvents(container) {
        container.querySelector('#add-expense-btn')?.addEventListener('click', () => this.openCreateModal());

        const closeModal = () => container.querySelector('#expense-modal').classList.remove('open');
        container.querySelector('#expense-modal-close')?.addEventListener('click', closeModal);
        container.querySelector('#exp-cancel')?.addEventListener('click', closeModal);
        container.querySelector('#expense-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'expense-modal') closeModal();
        });

        container.querySelector('#exp-amount')?.addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value);
            const hstInput = document.getElementById('exp-hst');
            if (!isNaN(amount) && hstInput && !hstInput.dataset.manual) {
                hstInput.value = (amount * 0.13).toFixed(2);
            }
        });
        container.querySelector('#exp-hst')?.addEventListener('input', (e) => {
            e.target.dataset.manual = '1';
        });

        container.querySelector('#filter-category')?.addEventListener('change', (e) => {
            this.filterCategory = e.target.value;
            this.renderKPIs();
            this.renderContent();
        });
        container.querySelector('#filter-range')?.addEventListener('change', (e) => {
            this.filterRange = e.target.value;
            this.renderKPIs();
            this.renderContent();
        });

        container.querySelectorAll('#view-mode [data-view]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.viewMode = btn.getAttribute('data-view');
                container.querySelectorAll('#view-mode [data-view]').forEach((b) => b.classList.toggle('active', b === btn));
                this.renderContent();
            });
        });

        container.querySelector('#exp-save')?.addEventListener('click', async () => {
            const date = document.getElementById('exp-date').value;
            const category = document.getElementById('exp-category').value;
            const description = document.getElementById('exp-desc').value.trim();
            const amount = parseFloat(document.getElementById('exp-amount').value);
            const hst = parseFloat(document.getElementById('exp-hst').value) || 0;
            const notes = document.getElementById('exp-notes').value;

            if (!date || !description || isNaN(amount) || amount <= 0) {
                LaunchLocal.toast('Please fill in date, description, and amount.', 'warning');
                return;
            }

            const btn = document.getElementById('exp-save');
            btn.classList.add('btn-loading');

            const data = {
                date, category, description,
                amount: Math.round(amount * 100),
                hstPaid: Math.round(hst * 100),
                notes
            };

            try {
                if (this.editingId) {
                    await DB.updateDoc('expenses', this.editingId, data);
                    await DB.logActivity('expense_updated', 'expenses', `updated ${category} expense: ${description}`, {}, this.editingId);
                    LaunchLocal.toast('Expense updated.', 'success');
                } else {
                    await DB.addDoc('expenses', data);
                    await DB.logActivity('expense_added', 'expenses', `added ${category} expense: ${description}`, {});
                    LaunchLocal.toast('Expense recorded.', 'success');
                }
                closeModal();
                await this.loadExpenses();
            } catch (e) {
                LaunchLocal.toast('Save failed: ' + e.message, 'error');
            } finally {
                btn.classList.remove('btn-loading');
            }
        });

        container.querySelector('#exp-delete')?.addEventListener('click', async () => {
            if (!this.editingId) return;
            if (!confirm('Delete this expense? This cannot be undone.')) return;
            try {
                await DB.deleteDoc('expenses', this.editingId);
                await DB.logActivity('expense_deleted', 'expenses', 'deleted an expense', {}, this.editingId);
                closeModal();
                LaunchLocal.toast('Expense deleted.', 'success');
                await this.loadExpenses();
            } catch (e) {
                LaunchLocal.toast('Delete failed: ' + e.message, 'error');
            }
        });
    }
};

Router.register('expenses', ExpensesModule, 'Expenses', ['admin']);
