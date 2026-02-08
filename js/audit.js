/**
 * Audit Log Page — Marketing Campaign Agent Dashboard
 */
const Audit = {
    data: [],
    entityFilter: '',

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-audit');
        if (!pg) return;

        const filter = pg.querySelector('.filter-select');
        if (filter) filter.addEventListener('change', e => { this.entityFilter = e.target.value; this.loadAudit(); });

        on(pg, 'click', '.btn-refresh-audit', () => this.loadAudit());
        on(pg, 'click', '.btn-export-audit', () => this.exportCSV());
    },

    onPageActive() { this.loadAudit(); },

    async loadAudit() {
        try {
            const params = {};
            if (this.entityFilter) params.entity_type = this.entityFilter;
            params.limit = 100;
            const result = await api.getAuditLog(params);
            this.data = Array.isArray(result) ? result : (result.entries || result.audit || []);
            this.renderTable();
        } catch (e) {
            showToast('Failed to load audit log: ' + e.message, 'error');
        }
    },

    renderTable() {
        const tbody = $('#audit-table-body');
        if (!tbody) return;
        if (!this.data.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-scroll"></i><p>No audit entries</p></td></tr>';
            return;
        }
        tbody.innerHTML = this.data.map(a => `<tr>
            <td>${formatDate(a.created_at || a.timestamp)}</td>
            <td><span class="badge badge-${this.actionColor(a.action)}">${escapeHtml(a.action || '—')}</span></td>
            <td>${escapeHtml(a.entity_type || '—')}</td>
            <td>${a.entity_id || '—'}</td>
            <td>${escapeHtml(truncate(a.details || a.description || '—', 80))}</td>
            <td>${escapeHtml(a.user || a.actor || 'system')}</td>
        </tr>`).join('');
    },

    actionColor(action) {
        if (!action) return 'info';
        const a = action.toLowerCase();
        if (a.includes('create') || a.includes('add')) return 'success';
        if (a.includes('delete') || a.includes('remove')) return 'danger';
        if (a.includes('update') || a.includes('edit')) return 'warning';
        if (a.includes('approve')) return 'success';
        if (a.includes('reject')) return 'danger';
        return 'info';
    },

    exportCSV() {
        if (!this.data.length) { showToast('No data to export', 'warning'); return; }
        exportToCSV(this.data, `audit_log_${new Date().toISOString().slice(0,10)}.csv`);
        showToast('Audit log exported', 'success');
    }
};
