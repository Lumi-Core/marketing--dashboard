/**
 * Reports Page — Marketing Campaign Agent Dashboard
 */
const Reports = {
    data: [],

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-reports');
        if (!pg) return;

        const refreshBtn = $('#refreshReports');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadReports());

        const exportBtn = $('#exportReportsCSV');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportCSV());
    },

    onPageActive() { this.loadReports(); },

    async loadReports(campaignName) {
        try {
            const result = await api.getReports(campaignName);
            this.data = Array.isArray(result) ? result : (result.reports || []);
            this.renderTable();
        } catch (e) {
            showToast('Failed to load reports: ' + e.message, 'error');
        }
    },

    renderTable() {
        const tbody = $('#reportsTableBody');
        if (!tbody) return;
        if (!this.data.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-chart-bar"></i><p>No reports available</p></td></tr>';
            return;
        }
        tbody.innerHTML = this.data.map(r => `<tr>
            <td>${r.id || '—'}</td>
            <td><strong>${escapeHtml(r.campaign_name || '—')}</strong></td>
            <td>${escapeHtml(r.target_audience || r.audience_type || '—')}</td>
            <td>${formatNumber(r.total_sent ?? r.successful_sends + r.failed_sends ?? 0)}</td>
            <td>${formatNumber(r.successful_sends ?? r.delivered ?? 0)}</td>
            <td>${formatNumber(r.failed_sends ?? r.failed ?? 0)}</td>
            <td>${formatDate(r.created_at)}</td>
        </tr>`).join('');
    },

    exportCSV() {
        if (!this.data.length) { showToast('No data to export', 'warning'); return; }
        exportToCSV(this.data, `reports_${new Date().toISOString().slice(0,10)}.csv`);
        showToast('Report exported', 'success');
    }
};
