/**
 * Reports Page — Marketing Campaign Agent Dashboard
 */
const Reports = {
    data: [],

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-reports');
        if (!pg) return;

        const search = pg.querySelector('.search-input');
        if (search) search.addEventListener('input', debounce(e => this.loadReports(e.target.value), 400));

        on(pg, 'click', '.btn-export-reports', () => this.exportCSV());
        on(pg, 'click', '.btn-refresh-reports', () => this.loadReports());
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
        const tbody = $('#reports-table-body');
        if (!tbody) return;
        if (!this.data.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-chart-bar"></i><p>No reports available</p></td></tr>';
            return;
        }
        tbody.innerHTML = this.data.map(r => `<tr>
            <td>${r.id || '—'}</td>
            <td><strong>${escapeHtml(r.campaign_name || '—')}</strong></td>
            <td>${formatNumber(r.total_sent ?? r.messages_sent)}</td>
            <td>${formatNumber(r.delivered)}</td>
            <td>${formatNumber(r.failed)}</td>
            <td>${formatPercent(r.delivery_rate)}</td>
            <td>${statusBadge(r.status || 'completed')}</td>
            <td>${formatDate(r.created_at)}</td>
        </tr>`).join('');
    },

    exportCSV() {
        if (!this.data.length) { showToast('No data to export', 'warning'); return; }
        exportToCSV(this.data, `reports_${new Date().toISOString().slice(0,10)}.csv`);
        showToast('Report exported', 'success');
    }
};
