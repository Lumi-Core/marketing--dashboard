/**
 * Clients Page — Marketing Campaign Agent Dashboard
 */
const Clients = {
    data: [],
    page: 1,
    perPage: 20,
    search: '',
    audienceFilter: '',
    editingId: null,

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-clients');
        if (!pg) return;

        // Search
        const searchInput = pg.querySelector('.search-input');
        if (searchInput) searchInput.addEventListener('input', debounce(e => { this.search = e.target.value; this.page = 1; this.loadClients(); }, 400));

        // Audience filter
        const audFilter = pg.querySelector('.filter-select');
        if (audFilter) audFilter.addEventListener('change', e => { this.audienceFilter = e.target.value; this.page = 1; this.loadClients(); });

        // Add client btn
        on(pg, 'click', '.btn-add-client', () => this.openAddModal());

        // Import / Export
        on(pg, 'click', '.btn-import-clients', () => openModal('import-modal'));
        on(pg, 'click', '.btn-export-clients', () => this.exportClients());

        // Table actions
        on(pg, 'click', '.btn-edit-client', (e, btn) => this.openEditModal(Number(btn.dataset.id)));
        on(pg, 'click', '.btn-delete-client', (e, btn) => this.deleteClient(Number(btn.dataset.id)));

        // Client modal save
        const saveBtn = $('#save-client-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveClient());

        // Import modal confirm
        const importBtn = $('#import-confirm-btn');
        if (importBtn) importBtn.addEventListener('click', () => this.importClients());
    },

    onPageActive() { this.loadClients(); },

    async loadClients() {
        try {
            const params = {};
            if (this.search) params.search = this.search;
            if (this.audienceFilter) params.audience_type = this.audienceFilter;
            params.limit = this.perPage;
            params.offset = (this.page - 1) * this.perPage;
            const result = await api.getClients(params);
            this.data = Array.isArray(result) ? result : (result.clients || []);
            this.renderTable();
            const total = result.total || this.data.length;
            buildPagination($('#clients-pagination'), this.page, Math.ceil(total / this.perPage), p => { this.page = p; this.loadClients(); });
        } catch (e) {
            showToast('Failed to load clients: ' + e.message, 'error');
        }
    },

    renderTable() {
        const tbody = $('#clients-table-body');
        if (!tbody) return;
        if (!this.data.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-users"></i><p>No clients found</p></td></tr>';
            return;
        }
        tbody.innerHTML = this.data.map(c => `<tr>
            <td>${c.id}</td>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td>${escapeHtml(c.phone || '—')}</td>
            <td>${escapeHtml(c.email || '—')}</td>
            <td>${statusBadge(c.audience_type || 'general')}</td>
            <td>${statusBadge(c.status || 'active')}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-edit-client" data-id="${c.id}" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger btn-delete-client" data-id="${c.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    },

    openAddModal() {
        this.editingId = null;
        const form = $('#client-form');
        if (form) resetForm(form);
        const title = $('#client-modal-title');
        if (title) title.textContent = 'Add Client';
        openModal('client-modal');
    },

    async openEditModal(id) {
        try {
            const client = await api.getClient(id);
            this.editingId = id;
            const form = $('#client-form');
            if (form) populateForm(form, client);
            const title = $('#client-modal-title');
            if (title) title.textContent = 'Edit Client';
            openModal('client-modal');
        } catch (e) { showToast('Failed to load client: ' + e.message, 'error'); }
    },

    async saveClient() {
        const form = $('#client-form');
        if (!form) return;
        const data = getFormData(form);
        if (!data.name) { showToast('Client name is required', 'warning'); return; }
        try {
            showLoading('Saving client…');
            if (this.editingId) {
                await api.updateClient(this.editingId, data);
                showToast('Client updated', 'success');
            } else {
                await api.createClient(data);
                showToast('Client created', 'success');
            }
            closeModal('client-modal');
            this.loadClients();
        } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async deleteClient(id) {
        const ok = await confirmAction('Delete this client? This cannot be undone.');
        if (!ok) return;
        try {
            await api.deleteClient(id);
            showToast('Client deleted', 'success');
            this.loadClients();
        } catch (e) { showToast('Delete failed: ' + e.message, 'error'); }
    },

    async exportClients() {
        try {
            showLoading('Exporting clients…');
            const blob = await api.exportClientsXlsx(this.audienceFilter);
            downloadBlob(blob, `clients_${new Date().toISOString().slice(0,10)}.xlsx`);
            showToast('Export complete', 'success');
        } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async importClients() {
        const input = $('#import-file');
        if (!input || !input.files.length) { showToast('Select a file first', 'warning'); return; }
        try {
            showLoading('Importing clients…');
            const result = await api.importClientsXlsx(input.files[0]);
            showToast(`Imported ${result.imported ?? result.count ?? ''} clients`, 'success');
            closeModal('import-modal');
            this.loadClients();
        } catch (e) { showToast('Import failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },
};
