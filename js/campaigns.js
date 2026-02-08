/**
 * Campaigns Page — Marketing Campaign Agent Dashboard
 */
const Campaigns = {
    data: [],
    page: 1,
    perPage: 20,
    statusFilter: '',
    editingId: null,

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-campaigns');
        if (!pg) return;

        // Status tabs
        on(pg, 'click', '.tab-btn', (e, btn) => {
            pg.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            this.statusFilter = btn.dataset.status || '';
            this.page = 1;
            this.loadCampaigns();
        });

        // Add / Import / Export
        on(pg, 'click', '.btn-add-campaign', () => this.openAddModal());
        on(pg, 'click', '.btn-import-campaigns', () => { this._importTarget = 'campaigns'; openModal('importModal'); });
        on(pg, 'click', '.btn-export-campaigns', () => this.exportCampaigns());

        // Table actions
        on(pg, 'click', '.btn-edit-campaign', (e, btn) => this.openEditModal(Number(btn.dataset.id)));
        on(pg, 'click', '.btn-delete-campaign', (e, btn) => this.deleteCampaign(Number(btn.dataset.id)));
        on(pg, 'click', '.btn-target-campaign', (e, btn) => this.openTargetModal(Number(btn.dataset.id)));

        // Modal save
        const saveBtn = $('#saveCampaignBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveCampaign());

        // Target modal save
        const saveTargetBtn = $('#submitTargets');
        if (saveTargetBtn) saveTargetBtn.addEventListener('click', () => this.saveTargets());

        // Import
        const importBtn = $('#submitImport');
        if (importBtn) importBtn.addEventListener('click', () => {
            if (this._importTarget === 'campaigns') this.importCampaigns();
        });
    },

    onPageActive() { this.loadCampaigns(); },

    async loadCampaigns() {
        try {
            const params = {};
            if (this.statusFilter) params.status = this.statusFilter;
            params.limit = this.perPage;
            params.offset = (this.page - 1) * this.perPage;
            const result = await api.getCampaigns(params);
            this.data = Array.isArray(result) ? result : (result.campaigns || []);
            this.renderTable();
            const total = result.total || this.data.length;
            buildPagination($('#campaigns-pagination'), this.page, Math.ceil(total / this.perPage), p => { this.page = p; this.loadCampaigns(); });
        } catch (e) {
            showToast('Failed to load campaigns: ' + e.message, 'error');
        }
    },

    renderTable() {
        const tbody = $('#campaigns-table-body');
        if (!tbody) return;
        if (!this.data.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-bullhorn"></i><p>No campaigns found</p></td></tr>';
            return;
        }
        tbody.innerHTML = this.data.map(c => `<tr>
            <td>${c.id}</td>
            <td><strong>${escapeHtml(c.campaign_name || c.name)}</strong></td>
            <td>${statusBadge(c.status)}</td>
            <td>${escapeHtml(c.audience_type || '—')}</td>
            <td>${escapeHtml(c.approval_method || '—')}</td>
            <td>${formatDate(c.scheduled_time)}</td>
            <td>${c.recurrence || '—'}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-edit-campaign" data-id="${c.id}" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-info btn-target-campaign" data-id="${c.id}" title="Targets"><i class="fas fa-crosshairs"></i></button>
                <button class="btn btn-sm btn-danger btn-delete-campaign" data-id="${c.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    },

    openAddModal() {
        this.editingId = null;
        const form = $('#campaignForm');
        if (form) resetForm(form);
        const title = $('#campaignModalTitle');
        if (title) title.textContent = 'Create Campaign';
        openModal('campaignModal');
    },

    async openEditModal(id) {
        try {
            const camp = await api.getCampaign(id);
            this.editingId = id;
            const form = $('#campaignForm');
            if (form) populateForm(form, camp);
            const title = $('#campaignModalTitle');
            if (title) title.textContent = 'Edit Campaign';
            openModal('campaignModal');
        } catch (e) { showToast('Failed to load campaign: ' + e.message, 'error'); }
    },

    async saveCampaign() {
        const form = $('#campaignForm');
        if (!form) return;
        const data = getFormData(form);
        if (!data.campaign_name && !data.name) { showToast('Campaign name is required', 'warning'); return; }
        try {
            showLoading('Saving campaign…');
            if (this.editingId) {
                await api.updateCampaign(this.editingId, data);
                showToast('Campaign updated', 'success');
            } else {
                await api.createCampaign(data);
                showToast('Campaign created', 'success');
            }
            closeModal('campaignModal');
            this.loadCampaigns();
        } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async deleteCampaign(id) {
        const ok = await confirmAction('Delete this campaign? This cannot be undone.');
        if (!ok) return;
        try {
            await api.deleteCampaign(id);
            showToast('Campaign deleted', 'success');
            this.loadCampaigns();
        } catch (e) { showToast('Delete failed: ' + e.message, 'error'); }
    },

    // ── Targets ──────────────────────────────
    _targetCampaignId: null,

    async openTargetModal(id) {
        this._targetCampaignId = id;
        try {
            const targets = await api.getCampaignTargets(id);
            if (targets && targets.audience_type) {
                const sel = $('#targetAudienceType');
                if (sel) sel.value = targets.audience_type;
            }
            openModal('targetModal');
        } catch (e) { showToast('Failed to load targets: ' + e.message, 'error'); }
    },

    async saveTargets() {
        if (!this._targetCampaignId) return;
        const audienceType = $('#targetAudienceType');
        if (!audienceType) return;
        const data = { audience_type: audienceType.value };
        try {
            showLoading('Saving targets…');
            await api.setCampaignTargets(this._targetCampaignId, data);
            showToast('Targets updated', 'success');
            closeModal('targetModal');
        } catch (e) { showToast('Failed to save targets: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    // ── Import / Export ──────────────────────
    async exportCampaigns() {
        try {
            showLoading('Exporting campaigns…');
            const blob = await api.exportCampaignsXlsx(this.statusFilter);
            downloadBlob(blob, `campaigns_${new Date().toISOString().slice(0,10)}.xlsx`);
            showToast('Export complete', 'success');
        } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },

    async importCampaigns() {
        const input = $('#importFile');
        if (!input || !input.files.length) { showToast('Select a file first', 'warning'); return; }
        try {
            showLoading('Importing campaigns…');
            const result = await api.importCampaignsXlsx(input.files[0]);
            showToast(`Imported ${result.imported ?? result.count ?? ''} campaigns`, 'success');
            closeModal('importModal');
            this.loadCampaigns();
        } catch (e) { showToast('Import failed: ' + e.message, 'error'); }
        finally { hideLoading(); }
    },
};
