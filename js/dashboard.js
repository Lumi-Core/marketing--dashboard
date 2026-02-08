/**
 * Dashboard Home Page — Marketing Campaign Agent
 */
const Dashboard = {
    refreshInterval: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Quick action buttons
        const pgDash = $('#page-dashboard');
        if (pgDash) {
            on(pgDash, 'click', '#qaTriggerCampaign', () => App.navigateTo('workflow'));
            on(pgDash, 'click', '#qaAddClient', () => App.navigateTo('clients'));
            on(pgDash, 'click', '#qaNewCampaign', () => App.navigateTo('campaigns'));
            on(pgDash, 'click', '#qaViewApprovals', () => App.navigateTo('approvals'));
            on(pgDash, 'click', '#refreshHealthBtn', () => this.loadAll());
        }
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
        // Update individual stat cards
        const clientsStat = $('#stat-clients');
        const campaignsStat = $('#stat-campaigns');
        const pendingStat = $('#stat-pending');
        const runningStat = $('#stat-running');
        
        if (clientsStat) clientsStat.textContent = formatNumber(data.total_active_clients ?? data.total_clients ?? 0);
        if (campaignsStat) campaignsStat.textContent = formatNumber(data.total_campaigns ?? 0);
        if (pendingStat) pendingStat.textContent = formatNumber(data.pending_approvals ?? 0);
        if (runningStat) runningStat.textContent = formatNumber(data.running_workflows ?? 0);
    },

    renderHealth(health) {
        const grid = $('#healthGrid');
        if (!grid) return;
        const checks = health.checks || health;
        if (typeof checks !== 'object') return;
        grid.innerHTML = Object.entries(checks).map(([k, v]) => {
            const ok = v === true || v === 'ok' || v === 'connected' || (v && v.status === 'ok');
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
        const container = $('#recentCampaigns');
        if (!container) return;
        if (!campaigns.length) { 
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No recent campaigns</p></div>'; 
            return; 
        }
        container.innerHTML = campaigns.slice(0, 5).map(c => `
            <div class="recent-item">
                <div class="recent-icon"><i class="fas fa-bullhorn"></i></div>
                <div class="recent-info">
                    <strong>${escapeHtml(c.campaign_name || c.name)}</strong>
                    <small>${statusBadge(c.status)} • ${formatDate(c.scheduled_time || c.created_at)}</small>
                </div>
            </div>
        `).join('');
    },

    async renderAgentStatus() {
        const container = $('#agentStatusPreview');
        if (!container) return;
        try {
            const status = await api.getAgentsStatus();
            if (!status || !status.agents) { 
                container.innerHTML = '<div class="empty-state"><i class="fas fa-robot"></i><p>No agent data</p></div>'; 
                return; 
            }
            container.innerHTML = Object.entries(status.agents).map(([name, info]) => {
                const online = info.status === 'online';
                return `<div class="recent-item ${online ? 'online' : 'offline'}">
                    <div class="recent-icon"><i class="fas fa-${online ? 'robot' : 'plug'}"></i></div>
                    <div class="recent-info">
                        <strong>${escapeHtml(name)}</strong>
                        <small>${online ? 'Online • ' + timeAgo(info.last_seen) : 'Offline'}</small>
                    </div>
                </div>`;
            }).join('');
        } catch { 
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Unable to reach agents API</p></div>'; 
        }
    },

    formatUptime(seconds) {
        const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
        if (d > 0) return `${d}d ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
};
