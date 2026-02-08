/**
 * Settings Page — Marketing Campaign Agent Dashboard
 */
const Settings = {

    init() { this.bindEvents(); this.loadSaved(); },

    bindEvents() {
        const pg = $('#page-settings');
        if (!pg) return;

        on(pg, 'click', '#saveApiSettings', () => this.saveSettings());
        on(pg, 'click', '#testConnectionBtn', () => this.testConnection());
        on(pg, 'click', '#refreshSysInfo', () => this.loadSystemInfo());
        on(pg, 'click', '#refreshReadiness', () => this.loadSystemInfo());
        
        // Database maintenance buttons
        on(pg, 'click', '#clearClientsBtn', () => this.clearClients());
        on(pg, 'click', '#clearCampaignsBtn', () => this.clearCampaigns());
        on(pg, 'click', '#clearReportsBtn', () => this.clearReports());
        on(pg, 'click', '#clearAuditBtn', () => this.clearAudit());
        on(pg, 'click', '#clearAllDataBtn', () => this.clearAllData());
    },

    loadSaved() {
        const urlInput = $('#apiBaseUrl');
        const keyInput = $('#apiKey');
        let baseUrl = api.baseUrl || 'http://localhost:8000';
        // Ensure protocol is present for display
        if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = 'https://' + baseUrl;
            api.setBaseUrl(baseUrl); // Fix it in storage too
        }
        if (urlInput) urlInput.value = baseUrl;
        if (keyInput) keyInput.value = api.apiKey || '';
    },

    onPageActive() {
        this.loadSaved();
        this.loadSystemInfo();
        // Also load companies table inside settings
        if (typeof Companies !== 'undefined' && Companies._loadAll) {
            Companies._loadAll();
        }
    },

    saveSettings() {
        const url = ($('#apiBaseUrl') || {}).value;
        const key = ($('#apiKey') || {}).value;
        if (url) api.setBaseUrl(url);
        if (key !== undefined) api.setApiKey(key);
        showToast('Settings saved', 'success');
    },

    async testConnection() {
        const statusEl = $('#connectionStatus');
        try {
            if (statusEl) statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing…';
            const result = await api.getHealth();
            if (statusEl) statusEl.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success)"></i> Connected — ${result.status || 'OK'}`;
            showToast('Connection successful', 'success');
        } catch (e) {
            if (statusEl) statusEl.innerHTML = `<i class="fas fa-times-circle" style="color:var(--danger)"></i> Failed: ${escapeHtml(e.message)}`;
            showToast('Connection failed', 'error');
        }
    },

    async loadSystemInfo() {
        const container = $('#systemInfo');
        const readiness = $('#readinessInfo');

        try {
            const [health, ready, metrics] = await Promise.all([
                api.getHealth().catch(() => null),
                api.getHealthReady().catch(() => null),
                api.getMetrics().catch(() => null),
            ]);

            // System info
            if (container && health) {
                let html = '';
                html += `<div class="info-row"><span>Status</span><strong style="color:var(--${health.status === 'healthy' ? 'success' : 'danger'})">${health.status || '—'}</strong></div>`;
                if (health.version) html += `<div class="info-row"><span>Version</span><strong>${escapeHtml(health.version)}</strong></div>`;
                if (health.python_version) html += `<div class="info-row"><span>Python</span><strong>${escapeHtml(health.python_version)}</strong></div>`;
                if (health.uptime) html += `<div class="info-row"><span>Uptime</span><strong>${escapeHtml(String(health.uptime))}</strong></div>`;
                if (metrics) {
                    Object.entries(metrics).forEach(([k, v]) => {
                        html += `<div class="info-row"><span>${capitalize(k.replace(/_/g, ' '))}</span><strong>${typeof v === 'number' ? formatNumber(v) : escapeHtml(String(v))}</strong></div>`;
                    });
                }
                container.innerHTML = html || '<p class="text-muted">No info available</p>';
            }

            // Readiness
            if (readiness && ready) {
                const checks = ready.checks || ready;
                let html = '';
                if (typeof checks === 'object') {
                    Object.entries(checks).forEach(([k, v]) => {
                        const ok = v === true || v === 'ok' || (v && v.status === 'ok');
                        html += `<div class="info-row"><span>${capitalize(k.replace(/_/g, ' '))}</span><strong style="color:var(--${ok ? 'success' : 'danger'})">${ok ? '✓ OK' : '✗ Fail'}</strong></div>`;
                    });
                }
                readiness.innerHTML = html || '<p class="text-muted">No checks available</p>';
            }
        } catch (e) {
            if (container) container.innerHTML = `<p class="text-muted">Unable to fetch system info</p>`;
        }
    },

    async clearClients() {
        const confirmed = await confirmAction('Delete ALL clients? This cannot be undone!');
        if (!confirmed) return;
        try {
            showLoading('Deleting all clients…');
            await api.clearClients();
            showToast('All clients deleted', 'success');
        } catch (e) { showToast('Failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async clearCampaigns() {
        const confirmed = await confirmAction('Delete ALL campaigns? This cannot be undone!');
        if (!confirmed) return;
        try {
            showLoading('Deleting all campaigns…');
            await api.clearCampaigns();
            showToast('All campaigns deleted', 'success');
        } catch (e) { showToast('Failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async clearReports() {
        const confirmed = await confirmAction('Delete ALL reports? This cannot be undone!');
        if (!confirmed) return;
        try {
            showLoading('Deleting all reports…');
            await api.clearReports();
            showToast('All reports deleted', 'success');
        } catch (e) { showToast('Failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async clearAudit() {
        const confirmed = await confirmAction('Delete ALL audit logs? This cannot be undone!');
        if (!confirmed) return;
        try {
            showLoading('Deleting audit log…');
            await api.clearAudit();
            showToast('Audit log cleared', 'success');
        } catch (e) { showToast('Failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async clearAllData() {
        const confirmed = await confirmAction('⚠️ DELETE EVERYTHING? This will permanently delete ALL clients, campaigns, reports, and logs. This CANNOT be undone!');
        if (!confirmed) return;
        const doubleCheck = await confirmAction('Are you absolutely sure? Type "DELETE" to confirm (case-sensitive).');
        if (doubleCheck !== true) {
            const input = prompt('Type DELETE to confirm complete database reset:');
            if (input !== 'DELETE') {
                showToast('Reset cancelled', 'info');
                return;
            }
        }
        try {
            showLoading('Resetting database…');
            await api.clearAllData();
            showToast('Database reset complete', 'success');
        } catch (e) { showToast('Failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    }
};
