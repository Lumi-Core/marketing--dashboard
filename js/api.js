/**
 * API Service — Marketing Campaign Agent
 */
class ApiService {
    constructor() {
        let storedUrl = localStorage.getItem('mktApiBaseUrl') || 'http://localhost:8000';
        // Auto-fix missing protocol on load
        if (storedUrl && !storedUrl.startsWith('http://') && !storedUrl.startsWith('https://')) {
            storedUrl = 'https://' + storedUrl;
            localStorage.setItem('mktApiBaseUrl', storedUrl);
        }
        this.baseUrl = storedUrl;
        this.apiKey = localStorage.getItem('mktApiKey') || '';
        this._companyId = localStorage.getItem('mktCompanyId') || '';
    }

    setBaseUrl(url) { 
        // Ensure protocol is present
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        this.baseUrl = url.replace(/\/$/, ''); 
        localStorage.setItem('mktApiBaseUrl', this.baseUrl); 
    }
    setApiKey(key) { this.apiKey = key; localStorage.setItem('mktApiKey', this.apiKey); }

    /** Get/set the active company filter */
    get companyId() { return this._companyId; }
    set companyId(id) { this._companyId = id || ''; localStorage.setItem('mktCompanyId', this._companyId); }

    /** Append company_id param to a query-string-safe map */
    _injectCompany(params = {}) {
        if (this._companyId) params.company_id = this._companyId;
        return params;
    }

    getHeaders() {
        const h = { 'Content-Type': 'application/json' };
        if (this.apiKey) h['X-API-Key'] = this.apiKey;
        return h;
    }

    async fetchWithTimeout(url, options = {}, timeout = 30000) {
        const c = new AbortController();
        const id = setTimeout(() => c.abort(), timeout);
        try {
            const r = await fetch(url, { ...options, signal: c.signal });
            clearTimeout(id);
            return r;
        } catch (e) { clearTimeout(id); if (e.name === 'AbortError') throw new Error('Request timeout'); throw e; }
    }

    async get(endpoint) {
        const r = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, { method: 'GET', headers: this.getHeaders() });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    }

    async post(endpoint, data = {}) {
        const r = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
        if (!r.ok) { const t = await r.text(); throw new Error(`HTTP ${r.status}: ${t}`); }
        return r.json();
    }

    async put(endpoint, data = {}) {
        const r = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, { method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(data) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    }

    async del(endpoint) {
        const r = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, { method: 'DELETE', headers: this.getHeaders() });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    }

    /** Upload file via FormData (e.g. Excel import) */
    async uploadFile(endpoint, file, fieldName = 'file') {
        const fd = new FormData();
        fd.append(fieldName, file);
        const h = {};
        if (this.apiKey) h['X-API-Key'] = this.apiKey;
        const r = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, { method: 'POST', headers: h, body: fd }, 120000);
        if (!r.ok) { const t = await r.text(); throw new Error(`HTTP ${r.status}: ${t}`); }
        return r.json();
    }

    /** Download file (Excel export) — returns blob */
    async download(endpoint) {
        const r = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, { method: 'GET', headers: this.getHeaders() });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
    }

    // ── Health ──────────────────────────────────
    getRoot()        { return this.get('/'); }
    getHealth()      { return this.get('/health'); }
    getHealthReady() { return this.get('/health/ready'); }
    getHealthLive()  { return this.get('/health/live'); }
    getMetrics()     { return this.get('/health/metrics'); }

    // ── Dashboard ───────────────────────────────
    getDashboard()   { const q = this._companyId ? `?company_id=${this._companyId}` : ''; return this.get(`/api/dashboard${q}`); }

    // ── Clients ─────────────────────────────────
    getClients(params = {})         { const q = new URLSearchParams(this._injectCompany(params)).toString(); return this.get(`/api/clients${q ? '?'+q : ''}`); }
    getClient(id)                   { return this.get(`/api/clients/${id}`); }
    createClient(data)              { return this.post('/api/clients', data); }
    updateClient(id, data)          { return this.put(`/api/clients/${id}`, data); }
    deleteClient(id)                { return this.del(`/api/clients/${id}`); }
    bulkCreateClients(clients)      { return this.post('/api/clients/bulk', clients); }
    exportClientsXlsx(audience)     { const q = audience ? `?audience_type=${audience}` : ''; return this.download(`/api/clients/export/xlsx${q}`); }
    importClientsXlsx(file)         { return this.uploadFile('/api/clients/import/xlsx', file); }

    // ── Campaigns ───────────────────────────────
    getCampaigns(params = {})       { const q = new URLSearchParams(this._injectCompany(params)).toString(); return this.get(`/api/campaigns${q ? '?'+q : ''}`); }
    getActiveCampaigns()            { return this.get('/api/campaigns/active'); }
    getCampaign(id)                 { return this.get(`/api/campaigns/${id}`); }
    createCampaign(data)            { return this.post('/api/campaigns', data); }
    updateCampaign(id, data)        { return this.put(`/api/campaigns/${id}`, data); }
    deleteCampaign(id)              { return this.del(`/api/campaigns/${id}`); }
    bulkCreateCampaigns(list)       { return this.post('/api/campaigns/bulk', list); }
    setCampaignTargets(id, data)    { return this.post(`/api/campaigns/${id}/targets`, data); }
    getCampaignTargets(id)          { return this.get(`/api/campaigns/${id}/targets`); }
    exportCampaignsXlsx(status)     { const q = status ? `?status=${status}` : ''; return this.download(`/api/campaigns/export/xlsx${q}`); }
    importCampaignsXlsx(file)       { return this.uploadFile('/api/campaigns/import/xlsx', file); }

    // ── Trigger / Workflow ───────────────────────
    triggerCampaign(data = {})      { return this.post('/api/campaigns/trigger', data); }
    getTriggerStatus(id)            { return this.get(`/api/campaigns/trigger/${id}/status`); }
    getRunningCampaigns()           { return this.get('/api/campaigns/running'); }
    getCampaignHistory(limit = 20)  { return this.get(`/api/campaigns/history?limit=${limit}`); }

    // ── Media Upload ────────────────────────────
    uploadMedia(file)               { return this.uploadFile('/api/media/upload', file); }

    // ── Reports ─────────────────────────────────
    getReports(campaignName)        { const p = this._injectCompany({}); if(campaignName) p.campaign_name=campaignName; const q = new URLSearchParams(p).toString(); return this.get(`/api/reports${q ? '?'+q : ''}`); }

    // ── AI Analytics & Insights ─────────────────
    getAnalyticsOverview()          { return this.get('/api/analytics/overview'); }
    getAIRecommendations()          { return this.get('/api/analytics/recommendations'); }
    getBestSendTime(audience)       { return this.get(`/api/analytics/best-time?audience_type=${audience}`); }
    evaluateMessage(message, aud)   { return this.post(`/api/analytics/evaluate-message?message=${encodeURIComponent(message)}&audience=${aud}`); }
    getSavedRecommendations(cid)    { const q = cid ? `?campaign_id=${cid}` : ''; return this.get(`/api/analytics/saved-recommendations${q}`); }
    applyRecommendation(id)         { return this.post(`/api/analytics/recommendations/${id}/apply?is_applied=true`); }
    dismissRecommendation(id)       { return this.post(`/api/analytics/recommendations/${id}/apply?is_applied=false`); }
    getPerformanceSummary(days=30)  { return this.get(`/api/analytics/performance-summary?days=${days}`); }
    getPerformanceTrends(metric='delivery_rate', days=30) { return this.get(`/api/analytics/trends?metric=${metric}&days=${days}`); }
    getAudienceInsights()           { return this.get('/api/analytics/audience-insights'); }
    getRecentActivity(limit=50)     { return this.get(`/api/analytics/recent-activity?limit=${limit}`); }
    recordMetric(cid, name, val)    { return this.post(`/api/analytics/record-metric?campaign_id=${cid}&metric_name=${name}&metric_value=${val}`); }
    exportAnalytics(start, end, fmt='json') { const q = new URLSearchParams({start_date: start||'', end_date: end||'', format: fmt}).toString(); return this.get(`/api/analytics/export?${q}`); }
    getKPIs(days=30)                { return this.get(`/api/analytics/kpis?days=${days}`); }
    getEngagementBreakdown(days=30) { return this.get(`/api/analytics/engagement-breakdown?days=${days}`); }
    getStrategicInsights(days=30, limit=10) { return this.get(`/api/analytics/strategic-insights?days=${days}&limit=${limit}`); }

    // ── Approvals (dashboard) ───────────────────
    getPendingApprovals()           { return this.get('/api/approval/pending'); }
    approveCampaign(id)             { return this.post(`/api/approval/${id}/approve`); }
    rejectCampaign(id, feedback)    { return this.post(`/api/approval/${id}/reject?feedback=${encodeURIComponent(feedback || '')}`); }

    // ── Agents ──────────────────────────────────
    getAgentRuns(params = {})       { const q = new URLSearchParams(params).toString(); return this.get(`/api/agents/runs${q ? '?'+q : ''}`); }
    getAgentHeartbeats()            { return this.get('/api/agents/heartbeats'); }
    getAgentsStatus()               { return this.get('/api/agents/status'); }
    postHeartbeat(name, status, meta) { return this.post(`/api/agents/${name}/heartbeat?status=${status}`, meta); }

    // ── Audit ───────────────────────────────────
    getAuditLog(params = {})        { const q = new URLSearchParams(params).toString(); return this.get(`/api/audit${q ? '?'+q : ''}`); }

    // ── Companies (multi-tenant) ────────────────
    getCompanies(activeOnly = false){ return this.get(`/api/companies${activeOnly ? '?active_only=true' : ''}`); }
    getCompany(id)                  { return this.get(`/api/companies/${id}`); }
    getDefaultCompany()             { return this.get('/api/companies/default'); }
    createCompany(data)             { return this.post('/api/companies', data); }
    updateCompany(id, data)         { return this.put(`/api/companies/${id}`, data); }
    deleteCompany(id)               { return this.del(`/api/companies/${id}`); }
}

const api = new ApiService();
