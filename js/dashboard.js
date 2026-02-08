/**
 * Dashboard Home Page — Marketing Campaign Agent
 */
const Dashboard = {
    refreshInterval: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        on($('#page-dashboard'), 'click', '.quick-action-btn', (e, btn) => {
            const action = btn.dataset.action;
            if (action === 'new-campaign') App.navigateTo('campaigns');
            else if (action === 'trigger-campaign') App.navigateTo('workflow');
            else if (action === 'view-analytics') App.navigateTo('analytics');
            else if (action === 'manage-clients') App.navigateTo('clients');
        });
    },

    onPageActive() {
        this.loadAll();
        this.refreshInterval = setInterval(() => this.loadAll(), 60000);
    },

    onPageInactive() {
        if (this.refreshInterval) { clearInterval(this.refreshInterval); this.refreshInterval = null; }
    },

    async loadAll() {
        try {
            const [dash, health, metrics] = await Promise.all([
                api.getDashboard().catch(() => null),
                api.getHealthReady().catch(() => null),
                api.getMetrics().catch(() => null),
            ]);
            if (dash) this.renderStats(dash);
            if (health) this.renderHealth(health);
            if (metrics) this.renderMetrics(metrics);
            if (dash) this.renderRecentCampaigns(dash.recent_campaigns || []);
            this.renderAgentStatus();
        } catch (e) {
            console.error('Dashboard load error:', e);
        }
    },

    renderStats(data) {
        const grid = $('#dashboard-stats');
        if (!grid) return;
        const stats = [
            { label: 'Total Clients', value: formatNumber(data.total_clients ?? 0), icon: 'users', cls: 'primary' },
            { label: 'Active Campaigns', value: formatNumber(data.active_campaigns ?? 0), icon: 'bullhorn', cls: 'success' },
            { label: 'Pending Approval', value: formatNumber(data.pending_approvals ?? 0), icon: 'clock', cls: 'warning' },
            { label: 'Messages Sent', value: formatNumber(data.messages_sent ?? 0), icon: 'paper-plane', cls: 'info' },
        ];
        grid.innerHTML = stats.map(s => `
            <div class="stat-card">
                <div class="stat-icon ${s.cls}"><i class="fas fa-${s.icon}"></i></div>
                <div class="stat-info"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>
            </div>
        `).join('');
    },

    renderHealth(health) {
        const grid = $('#health-grid');
        if (!grid) return;
        const checks = health.checks || health;
        if (typeof checks !== 'object') return;
        grid.innerHTML = Object.entries(checks).map(([k, v]) => {
            const ok = v === true || v === 'ok' || (v && v.status === 'ok');
            return `<div class="health-item">
                <i class="fas fa-${ok ? 'check-circle' : 'times-circle'}" style="color:${ok ? 'var(--success)' : 'var(--danger)'}"></i>
                <span>${capitalize(k.replace(/_/g, ' '))}</span>
            </div>`;
        }).join('');
    },

    renderMetrics(metrics) {
        const container = $('#system-metrics');
        if (!container || !metrics) return;
        const items = [];
        if (metrics.uptime_seconds) items.push({ label: 'Uptime', value: this.formatUptime(metrics.uptime_seconds) });
        if (metrics.total_requests != null) items.push({ label: 'Requests', value: formatNumber(metrics.total_requests) });
        if (metrics.campaigns_processed != null) items.push({ label: 'Campaigns Run', value: formatNumber(metrics.campaigns_processed) });
        if (metrics.messages_sent != null) items.push({ label: 'Messages', value: formatNumber(metrics.messages_sent) });
        container.innerHTML = items.map(i => `<div class="metric-pill"><strong>${i.value}</strong><small>${i.label}</small></div>`).join('');
    },

    renderRecentCampaigns(campaigns) {
        const tbody = $('#recent-campaigns-body');
        if (!tbody) return;
        if (!campaigns.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><p>No recent campaigns</p></td></tr>'; return; }
        tbody.innerHTML = campaigns.slice(0, 8).map(c => `<tr>
            <td><strong>${escapeHtml(c.campaign_name || c.name)}</strong></td>
            <td>${statusBadge(c.status)}</td>
            <td>${escapeHtml(c.audience_type || '—')}</td>
            <td>${formatDate(c.scheduled_time || c.created_at)}</td>
            <td><button class="btn btn-sm" onclick="App.navigateTo('campaigns')">View</button></td>
        </tr>`).join('');
    },

    async renderAgentStatus() {
        const container = $('#agent-status-preview');
        if (!container) return;
        try {
            const status = await api.getAgentsStatus();
            if (!status || !status.agents) { container.innerHTML = '<p class="text-muted">No agent data</p>'; return; }
            container.innerHTML = Object.entries(status.agents).map(([name, info]) => {
                const online = info.status === 'online';
                return `<div class="agent-pill ${online ? 'online' : 'offline'}">
                    <i class="fas fa-${online ? 'signal' : 'plug'}"></i>
                    <span>${escapeHtml(name)}</span>
                    <small>${online ? timeAgo(info.last_seen) : 'offline'}</small>
                </div>`;
            }).join('');
        } catch { container.innerHTML = '<p class="text-muted">Unable to reach agents API</p>'; }
    },

    formatUptime(seconds) {
        const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
        if (d > 0) return `${d}d ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
};
