/* ============================================
   LaunchLocal — Settings Module
   Admin account + Danger Zone (Clear All Data).
   ============================================ */

const SettingsModule = {

    async render(container) {
        const user = LaunchLocal.currentUser || {};
        const isAdmin = user.role === 'admin';

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <div class="eyebrow">Account</div>
                    <h2 class="page-title">Settings</h2>
                    <p class="page-subtitle">Manage your profile and workspace preferences.</p>
                </div>
            </div>

            <div class="card" style="margin-bottom: var(--space-4);">
                <div class="card-header">
                    <h3 class="card-title">Profile</h3>
                </div>
                <div class="card-body">
                    <div class="detail-grid">
                        <div>
                            <div class="detail-row"><span>Name</span><span>${LaunchLocal.escapeHtml(user.name || '—')}</span></div>
                            <div class="detail-row"><span>Email</span><span>${LaunchLocal.escapeHtml(user.email || '—')}</span></div>
                        </div>
                        <div>
                            <div class="detail-row"><span>Role</span><span><span class="badge badge-${user.role || 'neutral'}">${LaunchLocal.escapeHtml(user.role || '—')}</span></span></div>
                            <div class="detail-row"><span>User ID</span><span class="mono">${LaunchLocal.escapeHtml(user.uid || '—')}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: var(--space-4);">
                <div class="card-header">
                    <h3 class="card-title">Theme</h3>
                </div>
                <div class="card-body">
                    <p class="text-secondary text-sm" style="margin-bottom: var(--space-3);">
                        Choose your preferred color scheme. Your choice is remembered on this device.
                    </p>
                    <div class="segmented" id="settings-theme-control">
                        <button class="segmented-btn ${Theme.get() === 'dark' ? 'active' : ''}" data-theme-choice="dark">Dark</button>
                        <button class="segmented-btn ${Theme.get() === 'light' ? 'active' : ''}" data-theme-choice="light">Light</button>
                    </div>
                </div>
            </div>

            ${isAdmin ? `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title" style="color: var(--danger);"><span data-icon="alert"></span>&nbsp;Danger Zone</h3>
                    </div>
                    <div class="card-body">
                        <div class="danger-zone">
                            <div class="danger-zone-title">Clear All Data</div>
                            <p class="text-secondary text-sm" style="margin-bottom: var(--space-3);">
                                Permanently delete every prospect, site, project, invoice, expense, and activity log — including real records. Use this only when preparing a fresh environment or decommissioning.
                            </p>
                            <button class="btn btn-danger btn-sm" id="clear-data-btn" onclick="SampleData.clear()">
                                <span data-icon="trash"></span>
                                <span class="btn-text">Clear All Data</span>
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;

        Icons.inject(container);

        // Theme segmented control
        container.querySelectorAll('[data-theme-choice]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const next = btn.getAttribute('data-theme-choice');
                Theme.set(next);
                container.querySelectorAll('[data-theme-choice]').forEach((b) => {
                    b.classList.toggle('active', b === btn);
                });
                LaunchLocal.toast(`Theme set to ${next}.`, 'success', 2000);
            });
        });

        return null;
    }
};

Router.register('settings', SettingsModule, 'Settings');
