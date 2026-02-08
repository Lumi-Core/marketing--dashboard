/**
 * Workflow Page — Marketing Campaign Agent Dashboard
 */
const Workflow = {
    pollTimers: {},

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-workflow');
        if (!pg) return;

        // Trigger form submit
        const form = $('#workflowForm');
        if (form) form.addEventListener('submit', e => { e.preventDefault(); this.triggerCampaign(); });

        // Refresh buttons (by ID since HTML uses IDs)
        const refreshRunning = $('#refreshRunningBtn');
        if (refreshRunning) refreshRunning.addEventListener('click', () => this.loadRunning());
        const refreshHistory = $('#refreshHistoryBtn');
        if (refreshHistory) refreshHistory.addEventListener('click', () => this.loadHistory());
    },

    onPageActive() {
        this.loadRunning();
        this.loadHistory();
        this.pollTimers.running = setInterval(() => this.loadRunning(), 15000);
    },

    onPageInactive() {
        Object.values(this.pollTimers).forEach(clearInterval);
        this.pollTimers = {};
    },

    async triggerCampaign() {
        const form = $('#workflowForm');
        if (!form) return;
        const data = getFormData(form);
        try {
            showLoading('Triggering campaign workflow…');
            const result = await api.triggerCampaign(data);
            showToast(`Workflow started — ID: ${result.campaign_id || '—'}`, 'success');
            if (result.campaign_id) this.pollStatus(result.campaign_id);
            this.loadRunning();
        } catch (e) { showToast('Trigger failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async pollStatus(runId) {
        let attempts = 0;
        const timer = setInterval(async () => {
            try {
                const status = await api.getTriggerStatus(runId);
                if (status.status === 'completed' || status.status === 'failed' || status.status === 'error') {
                    clearInterval(timer);
                    showToast(`Run ${runId.slice(0,8)}: ${status.status}`, status.status === 'completed' ? 'success' : 'error');
                    this.loadRunning();
                    this.loadHistory();
                }
                if (++attempts > 120) clearInterval(timer);
            } catch { if (++attempts > 120) clearInterval(timer); }
        }, 5000);
    },

    async loadRunning() {
        const container = $('#runningWorkflows');
        if (!container) return;
        try {
            const result = await api.getRunningCampaigns();
            const campaigns = result.campaigns || {};
            const runs = typeof campaigns === 'object' && !Array.isArray(campaigns)
                ? Object.values(campaigns)
                : (Array.isArray(campaigns) ? campaigns : []);
            if (!runs.length) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No running workflows</p></div>';
                return;
            }
            container.innerHTML = runs.map(r => `
                <div class="workflow-card">
                    <div class="workflow-card-header">
                        <strong>${escapeHtml(r.campaign_name || r.campaign_id || 'Workflow')}</strong>
                        ${statusBadge(r.status || 'running')}
                    </div>
                    <div class="workflow-card-meta">
                        <span><i class="fas fa-clock"></i> Started ${timeAgo(r.started_at)}</span>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load</p></div>';
        }
    },

    async loadHistory() {
        const tbody = $('#workflowHistoryBody');
        if (!tbody) return;
        try {
            const result = await api.getCampaignHistory(30);
            const campaigns = result.campaigns || {};
            const runs = typeof campaigns === 'object' && !Array.isArray(campaigns)
                ? Object.values(campaigns)
                : (Array.isArray(campaigns) ? campaigns : []);
            if (!runs.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No history yet</p></td></tr>';
                return;
            }
            tbody.innerHTML = runs.map(r => `<tr>
                <td>${escapeHtml((r.campaign_id || '—').toString().slice(0,8))}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${formatDate(r.started_at)}</td>
                <td>${formatDate(r.completed_at)}</td>
                <td>
                    ${r.error ? `<span class="text-danger">${escapeHtml(r.error.toString().slice(0,50))}</span>` : '—'}
                </td>
            </tr>`).join('');
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="5">Failed to load history</td></tr>';
        }
    },
};
