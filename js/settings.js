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
    },

    loadSaved() {
        const urlInput = $('#apiBaseUrl');
        const keyInput = $('#apiKey');
        if (urlInput) urlInput.value = api.baseUrl || 'http://localhost:8000';
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
    }
};
