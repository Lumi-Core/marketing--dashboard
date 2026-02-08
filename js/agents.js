/**
 * Agents Monitor Page — Marketing Campaign Agent Dashboard
 */
const Agents = {
    pollTimer: null,

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-agents');
        if (!pg) return;
        const refreshBtn = $('#refreshAgentsBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadAll());
    },

    onPageActive() {
        this.loadAll();
        this.pollTimer = setInterval(() => this.loadAll(), 20000);
    },

    onPageInactive() {
        if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    },

    async loadAll() {
        await Promise.all([this.loadHeartbeats(), this.loadRuns()]);
    },

    async loadHeartbeats() {
        const container = $('#agentHeartbeats');
        if (!container) return;
        try {
            const result = await api.getAgentHeartbeats();
            const beats = Array.isArray(result) ? result : (result.heartbeats || []);
            if (!beats.length) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-heartbeat"></i><p>No heartbeats recorded</p></div>';
                return;
            }
            container.innerHTML = beats.map(b => {
                const online = b.status === 'online' || b.status === 'active';
                return `<div class="agent-card ${online ? 'online' : 'offline'}">
                    <div class="agent-icon"><i class="fas fa-${online ? 'signal' : 'plug'}"></i></div>
                    <div class="agent-info">
                        <h4>${escapeHtml(b.agent_name || b.name)}</h4>
                        <span class="status-badge ${online ? 'success' : 'danger'}">${capitalize(b.status)}</span>
                        <small>Last seen: ${timeAgo(b.last_heartbeat || b.updated_at)}</small>
                    </div>
                    ${b.metadata ? `<div class="agent-meta">${this.renderMeta(b.metadata)}</div>` : ''}
                </div>`;
            }).join('');
        } catch (e) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load heartbeats</p></div>';
        }
    },

    async loadRuns() {
        const tbody = $('#agentRunsBody');
        if (!tbody) return;
        try {
            const result = await api.getAgentRuns();
            const runs = Array.isArray(result) ? result : (result.runs || []);
            if (!runs.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No agent runs recorded</p></td></tr>';
                return;
            }
            tbody.innerHTML = runs.slice(0, 50).map(r => `<tr>
                <td>${r.id || '—'}</td>
                <td><strong>${escapeHtml(r.agent_name || '—')}</strong></td>
                <td>${escapeHtml(r.campaign_name || '—')}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${formatDate(r.started_at)}</td>
                <td>${r.duration_seconds ? r.duration_seconds.toFixed(1) + 's' : '—'}</td>
                <td>${escapeHtml(truncate(r.error_message || '—', 50))}</td>
            </tr>`).join('');
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="7">Failed to load runs</td></tr>';
        }
    },

    renderMeta(meta) {
        if (!meta) return '';
        if (typeof meta === 'string') try { meta = JSON.parse(meta); } catch { return escapeHtml(meta); }
        return Object.entries(meta).map(([k, v]) => `<span><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</span>`).join(' ');
    }
};
