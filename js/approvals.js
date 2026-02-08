/**
 * Approvals Page — Marketing Campaign Agent Dashboard
 */
const Approvals = {
    data: [],

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-approvals');
        if (!pg) return;

        on(pg, 'click', '.btn-approve', (e, btn) => this.approve(Number(btn.dataset.id)));
        on(pg, 'click', '.btn-reject', (e, btn) => this.reject(Number(btn.dataset.id)));
        on(pg, 'click', '.btn-refresh-approvals', () => this.loadApprovals());
    },

    onPageActive() { this.loadApprovals(); },

    async loadApprovals() {
        try {
            const result = await api.getPendingApprovals();
            this.data = Array.isArray(result) ? result : (result.pending || []);
            this.render();
        } catch (e) {
            showToast('Failed to load approvals: ' + e.message, 'error');
        }
    },

    render() {
        const container = $('#approvals-grid');
        if (!container) return;
        if (!this.data.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-check-double"></i><h3>All Caught Up</h3><p>No pending approvals</p></div>';
            return;
        }
        container.innerHTML = this.data.map(a => `
            <div class="approval-card" data-id="${a.id || a.campaign_id}">
                <div class="approval-header">
                    <h4>${escapeHtml(a.campaign_name || a.name || 'Campaign')}</h4>
                    ${statusBadge('pending')}
                </div>
                <div class="approval-body">
                    ${a.audience_type ? `<div class="approval-meta"><i class="fas fa-users"></i> ${escapeHtml(a.audience_type)}</div>` : ''}
                    ${a.message_preview ? `<div class="approval-preview">${escapeHtml(truncate(a.message_preview, 150))}</div>` : ''}
                    ${a.image_url ? `<div class="approval-image"><img src="${escapeHtml(a.image_url)}" alt="Campaign image" loading="lazy"></div>` : ''}
                    <div class="approval-meta"><i class="fas fa-clock"></i> Created ${timeAgo(a.created_at)}</div>
                </div>
                <div class="approval-actions">
                    <button class="btn btn-success btn-approve" data-id="${a.id || a.campaign_id}"><i class="fas fa-check"></i> Approve</button>
                    <button class="btn btn-danger btn-reject" data-id="${a.id || a.campaign_id}"><i class="fas fa-times"></i> Reject</button>
                </div>
            </div>
        `).join('');
    },

    async approve(id) {
        try {
            showLoading('Approving…');
            await api.approveCampaign(id);
            showToast('Campaign approved', 'success');
            this.loadApprovals();
        } catch (e) { showToast('Approve failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async reject(id) {
        const feedback = prompt('Rejection feedback (optional):');
        try {
            showLoading('Rejecting…');
            await api.rejectCampaign(id, feedback || '');
            showToast('Campaign rejected', 'success');
            this.loadApprovals();
        } catch (e) { showToast('Reject failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    }
};
