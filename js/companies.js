/**
 * Companies Management Module — Full CRUD with multi-tenant support
 * Renders in both the Companies page and the Settings page.
 */
const Companies = {
    editingId: null,
    _cache: [],       // cached company list
    _searchTerm: '',
    _statusFilter: '',

    init() {
        this._bindEvents();
        this._loadCompanySelector();
    },

    /* ─── Events ─────────────────────────────────────────── */
    _bindEvents() {
        // Companies page buttons
        const addBtn = $('#addCompanyBtn');
        if (addBtn) addBtn.addEventListener('click', () => this._openModal());

        const refreshBtn = $('#refreshCompaniesBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this._loadAll());

        // Settings page buttons (same add/refresh but in settings)
        const settingsAdd = $('#settingsAddCompanyBtn');
        if (settingsAdd) settingsAdd.addEventListener('click', () => this._openModal());

        const settingsRefresh = $('#settingsRefreshCompaniesBtn');
        if (settingsRefresh) settingsRefresh.addEventListener('click', () => { this._loadAll(); });

        // Search + Filter
        const search = $('#companySearch');
        if (search) search.addEventListener('input', () => { this._searchTerm = search.value.toLowerCase(); this._renderTable(); });

        const statusF = $('#companyStatusFilter');
        if (statusF) statusF.addEventListener('change', () => { this._statusFilter = statusF.value; this._renderTable(); });

        // Form submit
        const form = $('#companyForm');
        if (form) form.addEventListener('submit', e => { e.preventDefault(); this._save(); });

        // Auto-generate slug from name
        const nameInput = $('#cmpName');
        if (nameInput) nameInput.addEventListener('input', () => {
            if (!this.editingId) {
                const slug = nameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const slugInput = $('#cmpSlug');
                if (slugInput) slugInput.value = slug;
            }
        });

        // Toggle password visibility
        on(document, 'click', '.btn-toggle-pass', (e, el) => {
            const inp = el.previousElementSibling;
            if (inp) { inp.type = inp.type === 'password' ? 'text' : 'password'; }
        });

        // Company selector in header
        const selector = $('#companySelector');
        if (selector) selector.addEventListener('change', () => {
            api.companyId = selector.value;
            if (typeof App !== 'undefined') {
                const p = App.pages[App.currentPage];
                if (p && p.module && p.module.onPageActive) p.module.onPageActive();
            }
        });

        // Table action buttons (delegated to both tables)
        on(document, 'click', '.btn-edit-company', (e, el) => {
            this._editCompany(parseInt(el.dataset.id));
        });
        on(document, 'click', '.btn-delete-company', (e, el) => {
            const id = parseInt(el.dataset.id);
            if (confirm('Delete this company? All linked data will become unassigned.')) this._deleteCompany(id);
        });
        on(document, 'click', '.btn-view-company', (e, el) => {
            this._showDetail(parseInt(el.dataset.id));
        });

        // Close detail card
        const closeDetail = $('#closeCompanyDetail');
        if (closeDetail) closeDetail.addEventListener('click', () => {
            const card = $('#companyDetailCard');
            if (card) card.classList.add('hidden');
        });
    },

    onPageActive() { this._loadAll(); },

    /* ─── Load everything ─────────────────────────────────── */
    async _loadAll() {
        try {
            const data = await api.getCompanies();
            this._cache = data.companies || [];
            this._renderStats();
            this._renderTable();
            this._renderSettingsTable();
        } catch (e) {
            console.error('Failed to load companies:', e);
            showToast('Failed to load companies', 'error');
        }
    },

    /* ─── Company selector ────────────────────────────────── */
    async _loadCompanySelector() {
        const sel = $('#companySelector');
        if (!sel) return;
        try {
            const data = await api.getCompanies(true);
            const companies = data.companies || [];
            sel.innerHTML = '<option value="">All Companies</option>';
            companies.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.company_name + (c.is_default ? ' ★' : '');
                sel.appendChild(opt);
            });
            if (api.companyId) sel.value = api.companyId;
        } catch (e) { console.warn('Company selector load failed:', e); }
    },

    /* ─── Stats cards ─────────────────────────────────────── */
    _renderStats() {
        const all = this._cache;
        const active = all.filter(c => c.is_active);
        const waConfigured = all.filter(c => c.whatsapp_phone_number_id);
        const def = all.find(c => c.is_default);

        _setText('#stat-total-companies', all.length);
        _setText('#stat-active-companies', active.length);
        _setText('#stat-wa-configured', waConfigured.length);
        _setText('#stat-default-company', def ? def.company_name : '—');
    },

    /* ─── Main table (Companies page) ─────────────────────── */
    _renderTable() {
        const tbody = $('#companiesBody');
        if (!tbody) return;

        let list = this._cache;
        if (this._searchTerm) {
            list = list.filter(c =>
                (c.company_name || '').toLowerCase().includes(this._searchTerm) ||
                (c.company_slug || '').toLowerCase().includes(this._searchTerm) ||
                (c.location || '').toLowerCase().includes(this._searchTerm)
            );
        }
        if (this._statusFilter === 'active') list = list.filter(c => c.is_active);
        if (this._statusFilter === 'inactive') list = list.filter(c => !c.is_active);

        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center">No companies found</td></tr>';
            _setText('#companiesShowingInfo', 'Showing 0 companies');
            return;
        }

        tbody.innerHTML = list.map(c => `<tr>
            <td>${c.id}</td>
            <td>
                <div class="cell-main">${esc(c.company_name)}</div>
                ${c.website ? `<div class="cell-sub">${esc(c.website)}</div>` : ''}
            </td>
            <td><code>${esc(c.company_slug)}</code></td>
            <td>${esc(c.location || '—')}</td>
            <td>
                ${c.tel ? `<div class="cell-sub">${esc(c.tel)}</div>` : ''}
                ${c.mobile_1 ? `<div class="cell-sub">${esc(c.mobile_1)}</div>` : ''}
            </td>
            <td><span class="mono-text">${esc(c.whatsapp_phone_number_id || '—')}</span></td>
            <td><span class="badge gray">${esc(c.whatsapp_template_name || '—')}</span></td>
            <td><span class="badge ${_approvalColor(c.approval_method)}">${esc(c.approval_method || 'both')}</span></td>
            <td>${c.is_active ? '<span class="badge green">Active</span>' : '<span class="badge red">Inactive</span>'}</td>
            <td>${c.is_default ? '<span class="badge blue">Default</span>' : ''}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-icon btn-view-company" data-id="${c.id}" title="View Details"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-icon btn-edit-company" data-id="${c.id}" title="Edit"><i class="fas fa-edit"></i></button>
                ${!c.is_default ? `<button class="btn btn-sm btn-icon btn-delete-company" data-id="${c.id}" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>`).join('');

        _setText('#companiesShowingInfo', `Showing ${list.length} of ${this._cache.length} companies`);
    },

    /* ─── Settings page table (compact) ───────────────────── */
    _renderSettingsTable() {
        const tbody = $('#settingsCompaniesBody');
        if (!tbody) return;

        const list = this._cache;
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No companies configured</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(c => `<tr>
            <td>
                <div class="cell-main">${esc(c.company_name)}</div>
                <div class="cell-sub">${esc(c.company_slug)}</div>
            </td>
            <td>${esc(c.location || '—')}</td>
            <td><span class="mono-text">${c.whatsapp_phone_number_id ? esc(c.whatsapp_phone_number_id) : '<em class="text-muted">Not set</em>'}</span></td>
            <td>${esc(c.whatsapp_template_name || '—')}</td>
            <td><span class="badge ${_approvalColor(c.approval_method)}">${esc(c.approval_method || 'both')}</span></td>
            <td>${c.is_active ? '<span class="badge green">Active</span>' : '<span class="badge red">Off</span>'}${c.is_default ? ' <span class="badge blue">Default</span>' : ''}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-icon btn-edit-company" data-id="${c.id}" title="Edit"><i class="fas fa-edit"></i></button>
                ${!c.is_default ? `<button class="btn btn-sm btn-icon btn-delete-company" data-id="${c.id}" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>`).join('');
    },

    /* ─── Detail card ─────────────────────────────────────── */
    _showDetail(id) {
        const c = this._cache.find(x => x.id === id);
        if (!c) return;

        const card = $('#companyDetailCard');
        const title = $('#detailCompanyName');
        const body = $('#companyDetailBody');
        if (!card || !body) return;

        if (title) title.textContent = c.company_name;

        const sections = [
            { label: 'Basic', icon: 'info-circle', rows: [
                ['Name', c.company_name], ['Slug', c.company_slug],
                ['Location', c.location], ['Website', c.website],
                ['Description', c.description], ['Logo', c.logo_url ? `<img src="${esc(c.logo_url)}" style="max-height:32px">` : ''],
            ]},
            { label: 'Contact', icon: 'phone-alt', rows: [
                ['Tel', c.tel], ['Mobile 1', c.mobile_1], ['Mobile 2', c.mobile_2],
                ['Email (Info)', c.email_info], ['Email (Sales)', c.email_sales],
                ['Instagram', c.instagram_handle],
            ]},
            { label: 'WhatsApp', icon: 'whatsapp fab', rows: [
                ['Phone Number ID', c.whatsapp_phone_number_id],
                ['Access Token', c.whatsapp_access_token ? '••••' + c.whatsapp_access_token.slice(-8) : ''],
                ['Business Account ID', c.whatsapp_business_account_id],
                ['API Version', c.whatsapp_api_version],
                ['Template Name', c.whatsapp_template_name],
            ]},
            { label: 'Approval & AI', icon: 'check-double', rows: [
                ['Approval Email', c.approval_email],
                ['Approval Method', c.approval_method],
                ['RAG Webhook', c.rag_webhook_url],
            ]},
            { label: 'Status', icon: 'toggle-on', rows: [
                ['Active', c.is_active ? 'Yes' : 'No'],
                ['Default', c.is_default ? 'Yes' : 'No'],
                ['Created', c.created_at ? new Date(c.created_at).toLocaleString() : ''],
                ['Updated', c.updated_at ? new Date(c.updated_at).toLocaleString() : ''],
            ]},
        ];

        body.innerHTML = sections.map(s => `
            <div class="info-card">
                <h4><i class="fa${s.icon.includes('fab') ? 'b' : 's'} fa-${s.icon.replace(' fab', '')}"></i> ${s.label}</h4>
                <div class="info-body">
                    ${s.rows.filter(r => r[1]).map(r => `<div class="info-row"><span>${r[0]}</span><strong>${esc(String(r[1]))}</strong></div>`).join('')}
                    ${s.rows.every(r => !r[1]) ? '<div class="info-row text-muted">No data</div>' : ''}
                </div>
            </div>
        `).join('');

        card.classList.remove('hidden');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    /* ─── Modal (Add / Edit) ──────────────────────────────── */
    _openModal(company = null) {
        this.editingId = company ? company.id : null;
        const title = $('#companyModalTitle');
        if (title) title.textContent = company ? `Edit Company — ${company.company_name}` : 'Add New Company';

        _val('#cmpName',           company?.company_name || '');
        _val('#cmpSlug',           company?.company_slug || '');
        _val('#cmpLocation',       company?.location || '');
        _val('#cmpWebsite',        company?.website || '');
        _val('#cmpDescription',    company?.description || '');
        _val('#cmpLogoUrl',        company?.logo_url || '');
        _val('#cmpTel',            company?.tel || '');
        _val('#cmpMobile1',        company?.mobile_1 || '');
        _val('#cmpMobile2',        company?.mobile_2 || '');
        _val('#cmpInstagram',      company?.instagram_handle || '');
        _val('#cmpEmailInfo',      company?.email_info || '');
        _val('#cmpEmailSales',     company?.email_sales || '');
        _val('#cmpWaPhoneId',      company?.whatsapp_phone_number_id || '');
        _val('#cmpWaToken',        company?.whatsapp_access_token || '');
        _val('#cmpWaBusinessId',   company?.whatsapp_business_account_id || '');
        _val('#cmpWaVersion',      company?.whatsapp_api_version || 'v18.0');
        _val('#cmpWaTemplate',     company?.whatsapp_template_name || 'ideal_home_final_v1');
        _val('#cmpApprovalEmail',  company?.approval_email || '');
        _val('#cmpApprovalMethod', company?.approval_method || 'both');
        _val('#cmpRagUrl',         company?.rag_webhook_url || '');
        _check('#cmpActive',       company ? !!company.is_active : true);
        _check('#cmpDefault',      company ? !!company.is_default : false);

        // Reset password field to password type
        const tokenField = $('#cmpWaToken');
        if (tokenField) tokenField.type = 'password';

        openModal('companyModal');
    },

    async _editCompany(id) {
        try {
            const company = await api.getCompany(id);
            this._openModal(company);
        } catch (e) { showToast('Failed to load company: ' + e.message, 'error'); }
    },

    /* ─── Save (Create or Update) ─────────────────────────── */
    async _save() {
        const data = {
            company_name:                 _getVal('#cmpName'),
            company_slug:                 _getVal('#cmpSlug'),
            location:                     _getVal('#cmpLocation') || null,
            website:                      _getVal('#cmpWebsite') || null,
            description:                  _getVal('#cmpDescription') || null,
            logo_url:                     _getVal('#cmpLogoUrl') || null,
            tel:                          _getVal('#cmpTel') || null,
            mobile_1:                     _getVal('#cmpMobile1') || null,
            mobile_2:                     _getVal('#cmpMobile2') || null,
            instagram_handle:             _getVal('#cmpInstagram') || null,
            email_info:                   _getVal('#cmpEmailInfo') || null,
            email_sales:                  _getVal('#cmpEmailSales') || null,
            whatsapp_phone_number_id:     _getVal('#cmpWaPhoneId') || null,
            whatsapp_access_token:        _getVal('#cmpWaToken') || null,
            whatsapp_business_account_id: _getVal('#cmpWaBusinessId') || null,
            whatsapp_api_version:         _getVal('#cmpWaVersion') || 'v18.0',
            whatsapp_template_name:       _getVal('#cmpWaTemplate') || 'ideal_home_final_v1',
            approval_email:               _getVal('#cmpApprovalEmail') || null,
            approval_method:              _getVal('#cmpApprovalMethod') || 'both',
            rag_webhook_url:              _getVal('#cmpRagUrl') || null,
            is_active:                    _isChecked('#cmpActive'),
            is_default:                   _isChecked('#cmpDefault'),
        };

        if (!data.company_name || !data.company_slug) {
            showToast('Company name and slug are required', 'error');
            return;
        }

        try {
            if (this.editingId) {
                await api.updateCompany(this.editingId, data);
                showToast('Company updated successfully', 'success');
            } else {
                await api.createCompany(data);
                showToast('Company created successfully', 'success');
            }
            closeModal('companyModal');
            this._loadAll();
            this._loadCompanySelector();
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
        }
    },

    /* ─── Delete ──────────────────────────────────────────── */
    async _deleteCompany(id) {
        try {
            await api.deleteCompany(id);
            showToast('Company deleted', 'success');
            this._loadAll();
            this._loadCompanySelector();
        } catch (e) { showToast('Error: ' + e.message, 'error'); }
    },
};

/* ─── Helpers ─────────────────────────────────────────────── */
function _setText(sel, val) { const el = $(sel); if (el) el.textContent = val; }
function _val(sel, val) { const el = $(sel); if (el) el.value = val; }
function _getVal(sel) { const el = $(sel); return el ? el.value.trim() : ''; }
function _check(sel, val) { const el = $(sel); if (el) el.checked = val; }
function _isChecked(sel) { const el = $(sel); return el ? el.checked : false; }
function _approvalColor(m) {
    const map = { both: 'blue', email: 'orange', dashboard: 'green', auto: 'purple', none: 'gray' };
    return map[m] || 'gray';
}

/** Simple HTML escape helper */
if (typeof esc === 'undefined') {
    var esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
}
