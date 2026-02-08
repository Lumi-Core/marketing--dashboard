/**
 * Settings Page — Marketing Campaign Agent Dashboard
 */
const Settings = {

    init() { this.bindEvents(); this.loadSaved(); },

    bindEvents() {
        const pg = $('#page-settings');
        if (!pg) return;

        on(pg, 'click', '#save-settings-btn', () => this.saveSettings());
        on(pg, 'click', '#test-connection-btn', () => this.testConnection());
        on(pg, 'click', '.btn-refresh-health', () => this.loadSystemInfo());
    },

    loadSaved() {
        const urlInput = $('#settings-api-url');
        const keyInput = $('#settings-api-key');
        if (urlInput) urlInput.value = api.baseUrl || 'http://localhost:8000';
        if (keyInput) keyInput.value = api.apiKey || '';
    },

    onPageActive() {
        this.loadSaved();
        this.loadSystemInfo();
    },

    saveSettings() {
        const url = ($('#settings-api-url') || {}).value;
        const key = ($('#settings-api-key') || {}).value;
        if (url) api.setBaseUrl(url);
        if (key !== undefined) api.setApiKey(key);
        showToast('Settings saved', 'success');
    },

    async testConnection() {
        const statusEl = $('#connection-status');
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
        const container = $('#system-info');
        if (!container) return;
        try {
            const [health, ready, metrics] = await Promise.all([
                api.getHealth().catch(() => null),
                api.getHealthReady().catch(() => null),
                api.getMetrics().catch(() => null),
            ]);

            let html = '<div class="settings-info-grid">';

            // Health
            if (health) {
                html += `<div class="info-card"><h4><i class="fas fa-heart"></i> Health</h4><div class="info-body">
                    <div class="info-row"><span>Status</span><strong style="color:var(--${health.status === 'healthy' ? 'success' : 'danger'})">${health.status || '—'}</strong></div>
                    ${health.version ? `<div class="info-row"><span>Version</span><strong>${escapeHtml(health.version)}</strong></div>` : ''}
                </div></div>`;
            }

            // Readiness checks
            if (ready) {
                const checks = ready.checks || ready;
                html += '<div class="info-card"><h4><i class="fas fa-clipboard-check"></i> Readiness</h4><div class="info-body">';
                if (typeof checks === 'object') {
                    Object.entries(checks).forEach(([k, v]) => {
                        const ok = v === true || v === 'ok' || (v && v.status === 'ok');
                        html += `<div class="info-row"><span>${capitalize(k.replace(/_/g, ' '))}</span><strong style="color:var(--${ok ? 'success' : 'danger'})">${ok ? '✓ OK' : '✗ Fail'}</strong></div>`;
                    });
                }
                html += '</div></div>';
            }

            // Metrics
            if (metrics) {
                html += '<div class="info-card"><h4><i class="fas fa-tachometer-alt"></i> Metrics</h4><div class="info-body">';
                Object.entries(metrics).forEach(([k, v]) => {
                    html += `<div class="info-row"><span>${capitalize(k.replace(/_/g, ' '))}</span><strong>${typeof v === 'number' ? formatNumber(v) : escapeHtml(String(v))}</strong></div>`;
                });
                html += '</div></div>';
            }

            html += '</div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-server"></i><p>Unable to fetch system info</p></div>`;
        }
    }
};
