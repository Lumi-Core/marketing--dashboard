/**
 * Workflow Page — Marketing Campaign Agent Dashboard
 */
const Workflow = {
    pollTimers: {},

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-workflow');
        if (!pg) return;

        // Trigger btn
        on(pg, 'click', '#trigger-campaign-btn', () => this.triggerCampaign());

        // Refresh buttons
        on(pg, 'click', '.btn-refresh-running', () => this.loadRunning());
        on(pg, 'click', '.btn-refresh-history', () => this.loadHistory());
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
        const form = $('#trigger-form');
        if (!form) return;
        const data = getFormData(form);
        try {
            showLoading('Triggering campaign workflow…');
            const result = await api.triggerCampaign(data);
            showToast(`Workflow started — Run ID: ${result.run_id || '—'}`, 'success');
            if (result.run_id) this.pollStatus(result.run_id);
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
                    showToast(`Run ${runId}: ${status.status}`, status.status === 'completed' ? 'success' : 'error');
                    this.loadRunning();
                    this.loadHistory();
                }
                if (++attempts > 120) clearInterval(timer);
            } catch { if (++attempts > 120) clearInterval(timer); }
        }, 5000);
    },

    async loadRunning() {
        const container = $('#running-workflows');
        if (!container) return;
        try {
            const result = await api.getRunningCampaigns();
            const runs = Array.isArray(result) ? result : (result.running || []);
            if (!runs.length) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No running workflows</p></div>';
                return;
            }
            container.innerHTML = runs.map(r => `
                <div class="workflow-card">
                    <div class="workflow-card-header">
                        <strong>${escapeHtml(r.campaign_name || r.name || 'Workflow')}</strong>
                        ${statusBadge(r.status || 'running')}
                    </div>
                    <div class="workflow-card-meta">
                        <span><i class="fas fa-clock"></i> Started ${timeAgo(r.started_at || r.created_at)}</span>
                        ${r.current_node ? `<span><i class="fas fa-cog fa-spin"></i> ${escapeHtml(r.current_node)}</span>` : ''}
                    </div>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load</p></div>`;
        }
    },

    async loadHistory() {
        const tbody = $('#workflow-history-body');
        if (!tbody) return;
        try {
            const result = await api.getCampaignHistory(30);
            const runs = Array.isArray(result) ? result : (result.history || []);
            if (!runs.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No history yet</p></td></tr>';
                return;
            }
            tbody.innerHTML = runs.map(r => `<tr>
                <td>${r.run_id || r.id || '—'}</td>
                <td>${escapeHtml(r.campaign_name || '—')}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${formatDate(r.started_at || r.created_at)}</td>
                <td>${r.duration ? r.duration + 's' : '—'}</td>
                <td>${escapeHtml(truncate(r.error || r.result || '—', 50))}</td>
            </tr>`).join('');
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="6">Failed to load history</td></tr>';
        }
    },
};
