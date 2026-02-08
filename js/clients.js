/**
 * Clients Page — Marketing Campaign Agent Dashboard
 */
const Clients = {
    data: [],
    page: 1,
    perPage: 20,
    search: '',
    audienceFilter: '',
    statusFilter: '',
    editingId: null,

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-clients');
        if (!pg) return;

        // Search
        const searchInput = $('#clientSearch');
        if (searchInput) searchInput.addEventListener('input', debounce(e => { this.search = e.target.value; this.page = 1; this.loadClients(); }, 400));

        // Audience filter
        const audFilter = $('#clientAudienceFilter');
        if (audFilter) audFilter.addEventListener('change', e => { this.audienceFilter = e.target.value; this.page = 1; this.loadClients(); });

        // Status filter
        const statusFilter = $('#clientStatusFilter');
        if (statusFilter) statusFilter.addEventListener('change', e => { this.statusFilter = e.target.value; this.page = 1; this.loadClients(); });

        // Refresh button
        const refreshBtn = $('#refreshClientsBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadClients());

        // Add client btn
        on(pg, 'click', '.btn-add-client', () => this.openAddModal());

        // Import modal confirm — only handle client imports
        on(pg, 'click', '.btn-import-clients', () => { this._importTarget = 'clients'; openModal('importModal'); });
        on(pg, 'click', '.btn-export-clients', () => this.exportClients());

        // Table actions
        on(pg, 'click', '.btn-edit-client', (e, btn) => this.openEditModal(Number(btn.dataset.id)));
        on(pg, 'click', '.btn-delete-client', (e, btn) => this.deleteClient(Number(btn.dataset.id)));

        // Client modal save
        const saveBtn = $('#saveClientBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveClient());

        // Import button — only if this module triggered it
        const importBtn = $('#submitImport');
        if (importBtn) importBtn.addEventListener('click', () => {
            if (this._importTarget === 'clients') this.importClients();
        });
    },

    onPageActive() { this.loadClients(); },

    async loadClients() {
        try {
            const params = {};
            if (this.search) params.search = this.search;
            if (this.audienceFilter) params.audience_type = this.audienceFilter;
            if (this.statusFilter) params.status = this.statusFilter;
            params.limit = this.perPage;
            params.offset = (this.page - 1) * this.perPage;
            const result = await api.getClients(params);
            this.data = Array.isArray(result) ? result : (result.clients || []);
            this.renderTable();
            const total = result.total || this.data.length;
            const showingInfo = $('#clientsShowingInfo');
            if (showingInfo) showingInfo.textContent = `Showing ${this.data.length} of ${total} clients`;
            buildPagination($('#clientsPagination'), this.page, Math.ceil(total / this.perPage), p => { this.page = p; this.loadClients(); });
        } catch (e) {
            showToast('Failed to load clients: ' + e.message, 'error');
        }
    },

    renderTable() {
        const tbody = $('#clientsTableBody');
        if (!tbody) return;
        if (!this.data.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-users"></i><p>No clients found</p></td></tr>';
            return;
        }
        tbody.innerHTML = this.data.map(c => `<tr>
            <td>${c.id}</td>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td>${escapeHtml(c.whatsapp_number || c.phone || '—')}</td>
            <td>${escapeHtml(c.email || '—')}</td>
            <td>${escapeHtml(c.company || '—')}</td>
            <td>${statusBadge(c.audience_type || 'general')}</td>
            <td>${escapeHtml(c.territory || '—')}</td>
            <td>${statusBadge(c.status || 'active')}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-edit-client" data-id="${c.id}" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger btn-delete-client" data-id="${c.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    },

    openAddModal() {
        this.editingId = null;
        const form = $('#clientForm');
        if (form) resetForm(form);
        const title = $('#clientModalTitle');
        if (title) title.textContent = 'Add Client';
        openModal('clientModal');
    },

    async openEditModal(id) {
        try {
            const client = await api.getClient(id);
            this.editingId = id;
            const form = $('#clientForm');
            if (form) populateForm(form, client);
            const title = $('#clientModalTitle');
            if (title) title.textContent = 'Edit Client';
            openModal('clientModal');
        } catch (e) { showToast('Failed to load client: ' + e.message, 'error'); }
    },

    async saveClient() {
        const form = $('#clientForm');
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
            closeModal('clientModal');
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
        const input = $('#importFile');
        if (!input || !input.files.length) { showToast('Select a file first', 'warning'); return; }
        try {
            showLoading('Importing clients…');
            const result = await api.importClientsXlsx(input.files[0]);
            showToast(`Imported ${result.imported ?? result.count ?? ''} clients`, 'success');
            closeModal('importModal');
            this.loadClients();
        } catch (e) { showToast('Import failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },
};
