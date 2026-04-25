/**
 * mock-data.js
 * Patches every api.* method to return rich mock data.
 * No real HTTP calls are made — the dashboard works fully offline.
 *
 * Strategy: replace get / post / put / del / fetchWithTimeout on the
 * api instance immediately after this script loads. Each method now
 * resolves to the appropriate mock payload matching what the real server
 * would return, so every existing module (dashboard.js, clients.js, etc.)
 * works unchanged.
 */

/* ──────────────────────────────────────────────────────────────────────────
   SEED DATA
   ────────────────────────────────────────────────────────────────────────── */

const _companies = [
    { id: 1, name: 'Ideal Home UAE', industry: 'Real Estate', plan: 'Enterprise', is_active: true, created_at: '2025-01-10T08:00:00Z' },
    { id: 2, name: 'Gulf Properties',  industry: 'Real Estate', plan: 'Pro',        is_active: true, created_at: '2025-03-15T09:00:00Z' },
    { id: 3, name: 'Desert Estates',   industry: 'Real Estate', plan: 'Starter',    is_active: false, created_at: '2025-06-20T11:00:00Z' },
];

const _clients = [
    { id: 1,  name: 'Ahmed Al Mansoori',  phone: '+971501234001', email: 'ahmed@mail.ae',    audience_type: 'customer',   status: 'active',   company_id: 1, created_at: '2026-01-05T08:00:00Z' },
    { id: 2,  name: 'Sara Al Rashidi',    phone: '+971501234002', email: 'sara@mail.ae',     audience_type: 'customer',   status: 'active',   company_id: 1, created_at: '2026-01-07T09:00:00Z' },
    { id: 3,  name: 'Mohammed Khalil',    phone: '+971501234003', email: 'mkhalil@mail.ae',  audience_type: 'consultant', status: 'active',   company_id: 1, created_at: '2026-01-10T10:00:00Z' },
    { id: 4,  name: 'Fatima Hassan',      phone: '+971501234004', email: 'fatima@mail.ae',   audience_type: 'customer',   status: 'inactive', company_id: 1, created_at: '2026-01-12T11:00:00Z' },
    { id: 5,  name: 'Omar Bin Saeed',     phone: '+971501234005', email: 'omar@mail.ae',     audience_type: 'contractor', status: 'active',   company_id: 1, created_at: '2026-01-15T12:00:00Z' },
    { id: 6,  name: 'Layla Al Farsi',     phone: '+971501234006', email: 'layla@mail.ae',    audience_type: 'customer',   status: 'active',   company_id: 1, created_at: '2026-02-01T08:00:00Z' },
    { id: 7,  name: 'Khalid Noor',        phone: '+971501234007', email: 'khalid@mail.ae',   audience_type: 'consultant', status: 'active',   company_id: 1, created_at: '2026-02-05T09:00:00Z' },
    { id: 8,  name: 'Noor Al Hamdan',     phone: '+971501234008', email: 'noor@mail.ae',     audience_type: 'customer',   status: 'active',   company_id: 1, created_at: '2026-02-10T10:00:00Z' },
    { id: 9,  name: 'Reem Khalifa',       phone: '+971501234009', email: 'reem@mail.ae',     audience_type: 'contractor', status: 'active',   company_id: 1, created_at: '2026-02-15T11:00:00Z' },
    { id: 10, name: 'Hassan Al Zaabi',    phone: '+971501234010', email: 'hassan@mail.ae',   audience_type: 'customer',   status: 'active',   company_id: 1, created_at: '2026-02-20T12:00:00Z' },
    { id: 11, name: 'Mariam Al Blooshi',  phone: '+971501234011', email: 'mariam@mail.ae',   audience_type: 'customer',   status: 'active',   company_id: 2, created_at: '2026-03-01T08:00:00Z' },
    { id: 12, name: 'Tariq Mohammed',     phone: '+971501234012', email: 'tariq@mail.ae',    audience_type: 'consultant', status: 'inactive', company_id: 2, created_at: '2026-03-05T09:00:00Z' },
    { id: 13, name: 'Shaikha Al Nuaimi',  phone: '+971501234013', email: 'shaikha@mail.ae',  audience_type: 'customer',   status: 'active',   company_id: 2, created_at: '2026-03-10T10:00:00Z' },
    { id: 14, name: 'Saeed Butti',        phone: '+971501234014', email: 'saeed@mail.ae',    audience_type: 'contractor', status: 'active',   company_id: 2, created_at: '2026-03-15T11:00:00Z' },
    { id: 15, name: 'Amira Khalfan',      phone: '+971501234015', email: 'amira@mail.ae',    audience_type: 'customer',   status: 'active',   company_id: 1, created_at: '2026-04-01T08:00:00Z' },
];

const _campaigns = [
    { id: 1,  campaign_name: 'Spring Villas Drop',       status: 'completed', audience_type: 'customer',   message_body: 'Hi {name}, Spring villas are here…',     company_id: 1, scheduled_time: '2026-03-01T09:00:00Z', created_at: '2026-02-28T08:00:00Z' },
    { id: 2,  campaign_name: 'Q1 Consultant Briefing',   status: 'completed', audience_type: 'consultant', message_body: 'Dear {name}, Q1 portfolio update…',      company_id: 1, scheduled_time: '2026-03-10T10:00:00Z', created_at: '2026-03-09T08:00:00Z' },
    { id: 3,  campaign_name: 'Contractor Partner Day',   status: 'completed', audience_type: 'contractor', message_body: 'Hi {name}, join our partner event…',     company_id: 1, scheduled_time: '2026-03-20T09:00:00Z', created_at: '2026-03-19T08:00:00Z' },
    { id: 4,  campaign_name: 'Palm Jumeirah 2BR Launch', status: 'completed', audience_type: 'customer',   message_body: 'Hi {name}, exclusive Palm 2BR units…',   company_id: 1, scheduled_time: '2026-03-25T09:00:00Z', created_at: '2026-03-24T08:00:00Z' },
    { id: 5,  campaign_name: 'VIP Rooftop Event',        status: 'completed', audience_type: 'consultant', message_body: 'Dear {name}, VIP evening on April 5…',   company_id: 1, scheduled_time: '2026-04-01T09:00:00Z', created_at: '2026-03-30T08:00:00Z' },
    { id: 6,  campaign_name: 'Ramadan Special Offer',    status: 'completed', audience_type: 'customer',   message_body: 'مرحبا {name}، عرض رمضان الحصري…',        company_id: 1, scheduled_time: '2026-04-05T09:00:00Z', created_at: '2026-04-04T08:00:00Z' },
    { id: 7,  campaign_name: 'Q2 Investor Brief',        status: 'completed', audience_type: 'consultant', message_body: 'Dear {name}, Q2 opportunities await…',   company_id: 1, scheduled_time: '2026-04-15T09:00:00Z', created_at: '2026-04-14T08:00:00Z' },
    { id: 8,  campaign_name: 'Summer Launch 2026',       status: 'pending',   audience_type: 'customer',   message_body: 'Hi {name}, summer collection is live!',  company_id: 1, scheduled_time: '2026-04-28T09:00:00Z', created_at: '2026-04-25T08:00:00Z' },
    { id: 9,  campaign_name: 'May Contractor Update',    status: 'draft',     audience_type: 'contractor', message_body: 'Hi {name}, May project updates here…',   company_id: 1, scheduled_time: '2026-05-05T09:00:00Z', created_at: '2026-04-25T09:00:00Z' },
    { id: 10, name: 'Gulf Properties Q2 Drive',          campaign_name: 'Gulf Properties Q2 Drive', status: 'completed', audience_type: 'customer', message_body: 'Hi {name}, Gulf Properties Q2…', company_id: 2, scheduled_time: '2026-04-10T09:00:00Z', created_at: '2026-04-09T08:00:00Z' },
];

const _reports = [
    { id: 1, campaign_name: 'Spring Villas Drop',       target_audience: 'customer',   total_sent: 310, successful_sends: 298, failed_sends: 12, created_at: '2026-03-01T10:00:00Z' },
    { id: 2, campaign_name: 'Q1 Consultant Briefing',   target_audience: 'consultant', total_sent: 56,  successful_sends: 55,  failed_sends: 1,  created_at: '2026-03-10T11:00:00Z' },
    { id: 3, campaign_name: 'Contractor Partner Day',   target_audience: 'contractor', total_sent: 44,  successful_sends: 42,  failed_sends: 2,  created_at: '2026-03-20T10:00:00Z' },
    { id: 4, campaign_name: 'Palm Jumeirah 2BR Launch', target_audience: 'customer',   total_sent: 88,  successful_sends: 84,  failed_sends: 4,  created_at: '2026-03-25T10:00:00Z' },
    { id: 5, campaign_name: 'VIP Rooftop Event',        target_audience: 'consultant', total_sent: 38,  successful_sends: 38,  failed_sends: 0,  created_at: '2026-04-01T10:00:00Z' },
    { id: 6, campaign_name: 'Ramadan Special Offer',    target_audience: 'customer',   total_sent: 230, successful_sends: 221, failed_sends: 9,  created_at: '2026-04-05T10:00:00Z' },
    { id: 7, campaign_name: 'Q2 Investor Brief',        target_audience: 'consultant', total_sent: 62,  successful_sends: 59,  failed_sends: 3,  created_at: '2026-04-15T10:00:00Z' },
    { id: 8, campaign_name: 'Gulf Properties Q2 Drive', target_audience: 'customer',   total_sent: 120, successful_sends: 115, failed_sends: 5,  created_at: '2026-04-10T10:00:00Z' },
];

const _approvals = [
    {
        id: 8,
        campaign_id: 8,
        campaign_name: 'Summer Launch 2026',
        audience_type: 'customer',
        message_preview: 'Hi {name},\n\nExclusive early-bird offer — own a stunning 2BR apartment on Palm Jumeirah at a once-in-a-season price. Our Summer Launch 2026 collection is now open for reservations. Limited units available.\n\nReply YES to book a private viewing.',
        image_url: null,
        created_at: '2026-04-25T08:00:00Z',
    },
];

const _audit = [
    { id: 1,  entity_type: 'campaign', entity_id: 8,  action: 'create',   user: 'system',      details: 'Campaign "Summer Launch 2026" created',              created_at: '2026-04-25T08:00:00Z' },
    { id: 2,  entity_type: 'campaign', entity_id: 8,  action: 'approve',  user: 'admin',       details: 'Campaign sent to approval queue',                     created_at: '2026-04-25T08:05:00Z' },
    { id: 3,  entity_type: 'client',   entity_id: 15, action: 'create',   user: 'admin',       details: 'Client "Amira Khalfan" added',                        created_at: '2026-04-25T07:30:00Z' },
    { id: 4,  entity_type: 'campaign', entity_id: 7,  action: 'complete', user: 'system',      details: 'Campaign "Q2 Investor Brief" completed — 59 sent',    created_at: '2026-04-15T10:30:00Z' },
    { id: 5,  entity_type: 'campaign', entity_id: 6,  action: 'complete', user: 'system',      details: 'Campaign "Ramadan Special Offer" completed — 221 sent', created_at: '2026-04-05T10:30:00Z' },
    { id: 6,  entity_type: 'client',   entity_id: 3,  action: 'update',   user: 'admin',       details: 'Client phone number updated',                         created_at: '2026-04-20T14:00:00Z' },
    { id: 7,  entity_type: 'campaign', entity_id: 5,  action: 'complete', user: 'system',      details: 'Campaign "VIP Rooftop Event" completed — 38 sent',    created_at: '2026-04-01T10:30:00Z' },
    { id: 8,  entity_type: 'client',   entity_id: 4,  action: 'update',   user: 'admin',       details: 'Client status set to inactive',                       created_at: '2026-03-28T11:00:00Z' },
    { id: 9,  entity_type: 'campaign', entity_id: 1,  action: 'complete', user: 'system',      details: 'Campaign "Spring Villas Drop" completed — 298 sent',  created_at: '2026-03-01T10:30:00Z' },
    { id: 10, entity_type: 'company',  entity_id: 2,  action: 'create',   user: 'superadmin',  details: 'Company "Gulf Properties" registered',                created_at: '2025-03-15T09:00:00Z' },
];

const _agentRuns = [
    { id: 'run-007', campaign_name: 'Summer Launch 2026',    status: 'waiting_approval', started_at: '2026-04-25T08:00:00Z', completed_at: null },
    { id: 'run-006', campaign_name: 'Q2 Investor Brief',     status: 'completed',         started_at: '2026-04-15T09:00:00Z', completed_at: '2026-04-15T09:45:00Z' },
    { id: 'run-005', campaign_name: 'Ramadan Special Offer', status: 'completed',         started_at: '2026-04-05T09:00:00Z', completed_at: '2026-04-05T09:50:00Z' },
    { id: 'run-004', campaign_name: 'VIP Rooftop Event',     status: 'completed',         started_at: '2026-04-01T09:00:00Z', completed_at: '2026-04-01T09:30:00Z' },
    { id: 'run-003', campaign_name: 'Palm Jumeirah 2BR',     status: 'completed',         started_at: '2026-03-25T09:00:00Z', completed_at: '2026-03-25T09:40:00Z' },
];

const _heartbeats = [
    { agent_name: 'marketing_workflow',           status: 'active',  last_seen: '2026-04-25T08:05:00Z', version: '2.1.0' },
    { agent_name: 'approval_continuation',        status: 'idle',    last_seen: '2026-04-25T07:00:00Z', version: '2.1.0' },
    { agent_name: 'revision_workflow',            status: 'idle',    last_seen: '2026-04-25T06:00:00Z', version: '2.1.0' },
    { agent_name: 'ai_content_generator',         status: 'active',  last_seen: '2026-04-25T08:04:00Z', version: '1.5.2' },
    { agent_name: 'scheduler',                    status: 'active',  last_seen: '2026-04-25T08:00:00Z', version: '2.1.0' },
];

const _recommendations = [
    { id: 1, category: 'timing',   recommendation: 'Send campaigns to customers on Thursday between 9–11 AM for the highest engagement.', confidence: 0.91, is_applied: false, campaign_name: null,                  created_at: '2026-04-24T07:00:00Z' },
    { id: 2, category: 'content',  recommendation: 'Including a specific price anchor in the message body increases response rates by ~18%.', confidence: 0.87, is_applied: true,  campaign_name: 'Spring Villas Drop',  created_at: '2026-04-20T08:00:00Z' },
    { id: 3, category: 'audience', recommendation: 'Consultants respond 2× better to briefings under 200 words. Keep Q2 materials concise.', confidence: 0.84, is_applied: false, campaign_name: 'Q2 Investor Brief',   created_at: '2026-04-15T09:00:00Z' },
    { id: 4, category: 'timing',   recommendation: 'Arabic-language messages sent before Iftar (6–7 PM) show 34% higher open intent.', confidence: 0.79, is_applied: false, campaign_name: 'Ramadan Special Offer', created_at: '2026-04-05T07:00:00Z' },
    { id: 5, category: 'content',  recommendation: 'Adding a single high-quality image doubles click-to-view rates for customer campaigns.', confidence: 0.76, is_applied: true,  campaign_name: null,                  created_at: '2026-04-01T08:00:00Z' },
];

/* ──────────────────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────────────────── */

function _resolve(data) { return Promise.resolve(JSON.parse(JSON.stringify(data))); }

let _nextId = { client: 16, campaign: 11, company: 4 };

/* ──────────────────────────────────────────────────────────────────────────
   PATCH API INSTANCE
   ────────────────────────────────────────────────────────────────────────── */

window.addEventListener('DOMContentLoaded', () => {
    if (typeof api === 'undefined') { console.warn('mock-data.js: api not found'); return; }

    // ── Health & System ──────────────────────────────────────────────────
    api.getRoot         = () => _resolve({ app: 'Marketing Campaign Agent', version: '2.1.0', environment: 'mock' });
    api.getHealth       = () => _resolve({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    api.getHealthReady  = () => _resolve({ status: 'ready', checks: { database: true, s3: true, memory: true, disk: true } });
    api.getHealthLive   = () => _resolve({ status: 'alive' });
    api.getMetrics      = () => _resolve({ uptime_seconds: 342000, total_requests: 8741, campaigns_processed: 10, messages_sent: 948, active_campaigns: 1 });

    // ── Dashboard ────────────────────────────────────────────────────────
    api.getDashboard = () => _resolve({
        total_active_clients:  _clients.filter(c => c.status === 'active').length,
        total_clients:         _clients.length,
        total_campaigns:       _campaigns.length,
        pending_approvals:     _approvals.length,
        running_workflows:     1,
        recent_campaigns:      _campaigns.slice(-5).reverse(),
    });

    // ── Clients ──────────────────────────────────────────────────────────
    api.getClients = (params = {}) => {
        let data = [..._clients];
        if (params.audience) data = data.filter(c => c.audience_type === params.audience);
        if (params.status)   data = data.filter(c => c.status === params.status);
        if (params.search)   data = data.filter(c => c.name.toLowerCase().includes(params.search.toLowerCase()) || (c.phone || '').includes(params.search));
        if (params.company_id) data = data.filter(c => c.company_id === Number(params.company_id));
        return _resolve(data);
    };
    api.getClient   = (id) => _resolve(_clients.find(c => c.id === id) || null);
    api.createClient = (data) => {
        const client = { id: _nextId.client++, status: 'active', created_at: new Date().toISOString(), ...data };
        _clients.push(client);
        return _resolve(client);
    };
    api.updateClient = (id, data) => {
        const i = _clients.findIndex(c => c.id === id);
        if (i >= 0) Object.assign(_clients[i], data);
        return _resolve(_clients[i]);
    };
    api.deleteClient = (id) => {
        const i = _clients.findIndex(c => c.id === id);
        if (i >= 0) _clients.splice(i, 1);
        return _resolve({ deleted: true });
    };
    api.bulkCreateClients = (list) => {
        const created = list.map(d => { const c = { id: _nextId.client++, status: 'active', created_at: new Date().toISOString(), ...d }; _clients.push(c); return c; });
        return _resolve(created);
    };
    api.exportClientsXlsx = () => _resolve(new Blob(['mock'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    api.importClientsXlsx = () => _resolve({ imported: 5, skipped: 0 });

    // ── Campaigns ────────────────────────────────────────────────────────
    api.getCampaigns = (params = {}) => {
        let data = [..._campaigns];
        if (params.status)     data = data.filter(c => c.status === params.status);
        if (params.audience)   data = data.filter(c => c.audience_type === params.audience);
        if (params.company_id) data = data.filter(c => c.company_id === Number(params.company_id));
        return _resolve(data);
    };
    api.getActiveCampaigns  = () => _resolve(_campaigns.filter(c => c.status === 'active' || c.status === 'pending'));
    api.getCampaign         = (id) => _resolve(_campaigns.find(c => c.id === id) || null);
    api.createCampaign = (data) => {
        const camp = { id: _nextId.campaign++, status: 'draft', created_at: new Date().toISOString(), ...data };
        _campaigns.push(camp);
        return _resolve(camp);
    };
    api.updateCampaign = (id, data) => {
        const i = _campaigns.findIndex(c => c.id === id);
        if (i >= 0) Object.assign(_campaigns[i], data);
        return _resolve(_campaigns[i]);
    };
    api.deleteCampaign = (id) => {
        const i = _campaigns.findIndex(c => c.id === id);
        if (i >= 0) _campaigns.splice(i, 1);
        return _resolve({ deleted: true });
    };
    api.bulkCreateCampaigns = (list) => {
        const created = list.map(d => { const c = { id: _nextId.campaign++, status: 'draft', created_at: new Date().toISOString(), ...d }; _campaigns.push(c); return c; });
        return _resolve(created);
    };
    api.setCampaignTargets = (id) => _resolve({ campaign_id: id, targets_set: true });
    api.getCampaignTargets = (id) => _resolve({ campaign_id: id, targets: ['customer', 'consultant'] });
    api.exportCampaignsXlsx = () => _resolve(new Blob(['mock'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    api.importCampaignsXlsx = () => _resolve({ imported: 3, skipped: 0 });

    // ── Trigger / Workflow ───────────────────────────────────────────────
    api.triggerCampaign = (data) => {
        const id = 'run-' + Date.now();
        _agentRuns.unshift({ id, campaign_name: data.campaign_name || 'Ad-hoc Campaign', status: 'running', started_at: new Date().toISOString(), completed_at: null });
        return _resolve({ campaign_id: id, status: 'running', message: 'Workflow started (mock)' });
    };
    api.getTriggerStatus    = (id) => _resolve({ campaign_id: id, status: 'waiting_approval', stage: 'send_approval_email' });
    api.getRunningCampaigns = () => _resolve(_agentRuns.filter(r => r.status === 'running' || r.status === 'waiting_approval'));
    api.getCampaignHistory  = () => _resolve(_agentRuns);

    // ── Reports ──────────────────────────────────────────────────────────
    api.getReports = () => _resolve([..._reports]);

    // ── AI Analytics ─────────────────────────────────────────────────────
    api.getAnalyticsOverview = () => _resolve({
        total_campaigns: 10, total_messages_sent: 948, avg_delivery_rate: 0.963,
        top_audience: 'customer', period_days: 30,
    });

    api.getKPIs = () => _resolve({
        period_days: 30,
        campaign_metrics: { total_campaigns: 10, completed: 8, failed: 0, active: 1, growth_rate: 14, success_rate: 0.96 },
        volume_metrics:   { total_sent: 948, avg_per_campaign: 118, growth_rate: 22 },
        engagement_metrics: { active_clients: 12, active_rate: 0.8, audience_segments: 3 },
        ai_metrics: { total_recommendations: 5, applied: 2, adoption_rate: 40, avg_confidence: 0.83 },
    });

    api.getEngagementBreakdown = () => _resolve({
        summary: { total_successful: 911, total_failed: 36, engagement_rate: 96.2, unique_campaigns: 8 },
        by_audience: [
            { target_audience: 'customer',   total_campaigns: 6, total_sent: 748, overall_success_rate: 0.963 },
            { target_audience: 'consultant', total_campaigns: 3, total_sent: 156, overall_success_rate: 0.987 },
            { target_audience: 'contractor', total_campaigns: 1, total_sent: 44,  overall_success_rate: 0.955 },
        ],
        weekly_pattern: [
            { day_of_week: 0, campaign_count: 0, avg_success_rate: 0 },
            { day_of_week: 1, campaign_count: 2, avg_success_rate: 0.97 },
            { day_of_week: 2, campaign_count: 1, avg_success_rate: 0.95 },
            { day_of_week: 3, campaign_count: 3, avg_success_rate: 0.98 },
            { day_of_week: 4, campaign_count: 3, avg_success_rate: 0.96 },
            { day_of_week: 5, campaign_count: 1, avg_success_rate: 0.94 },
            { day_of_week: 6, campaign_count: 0, avg_success_rate: 0 },
        ],
    });

    api.getStrategicInsights = () => _resolve({
        top_recommendations: _recommendations.map(r => ({
            recommendation: r.recommendation,
            confidence:     r.confidence,
            category:       r.category,
            campaign_name:  r.campaign_name,
        })),
        underperforming_areas: [
            { target_audience: 'contractor', campaign_count: 1, avg_success_rate: 0.955, total_failures: 2 },
        ],
        best_performing_patterns: [
            { target_audience: 'consultant', campaign_count: 3, total_sent: 156, avg_success_rate: 0.987 },
            { target_audience: 'customer',   campaign_count: 6, total_sent: 748, avg_success_rate: 0.963 },
        ],
    });

    api.getPerformanceSummary = () => _resolve({
        campaign_stats:  { total: 10, completed: 8, failed: 0, active: 1, pending: 1 },
        delivery_stats:  { total_sent: 948, total_failed: 36, avg_success_rate: 96.2 },
        audience_breakdown: [
            { target_audience: 'customer',   count: 6 },
            { target_audience: 'consultant', count: 3 },
            { target_audience: 'contractor', count: 1 },
        ],
        top_campaigns: [
            { name: 'Spring Villas Drop',       successful_sends: 298 },
            { name: 'Ramadan Special Offer',     successful_sends: 221 },
            { name: 'Summer Launch 2026 (mock)', successful_sends: 120 },
            { name: 'Q2 Investor Brief',         successful_sends: 59  },
            { name: 'Palm Jumeirah 2BR Launch',  successful_sends: 84  },
        ],
    });

    api.getPerformanceTrends = (metric, days) => {
        const pts = [];
        for (let i = days; i >= 0; i -= 3) {
            const d = new Date(); d.setDate(d.getDate() - i);
            pts.push({ date: d.toISOString().slice(0, 10), value: +(0.88 + Math.random() * 0.12).toFixed(3) });
        }
        return _resolve({ metric, period_days: days, data_points: pts });
    };

    api.getAudienceInsights = () => _resolve({
        segments: [
            { type: 'customer',   count: 10, percentage: 67 },
            { type: 'consultant', count: 3,  percentage: 20 },
            { type: 'contractor', count: 2,  percentage: 13 },
        ],
        total: 15,
    });

    api.getRecentActivity = () => _resolve(_audit.slice(0, 20).map(a => ({
        type: a.action, entity: a.entity_type, details: a.details, timestamp: a.created_at,
    })));

    api.getAIRecommendations = () => _resolve(_recommendations);

    api.getSavedRecommendations = () => _resolve(_recommendations);

    api.applyRecommendation = (id) => {
        const r = _recommendations.find(x => x.id === id);
        if (r) r.is_applied = true;
        return _resolve({ success: true });
    };
    api.dismissRecommendation = (id) => {
        const r = _recommendations.find(x => x.id === id);
        if (r) r.is_applied = false;
        return _resolve({ success: true });
    };

    api.getBestSendTime = (audience) => _resolve({
        best_time: { day: 'Thursday', hour: 9, timezone: 'Asia/Dubai' },
        reasoning: `Historical analysis shows ${audience} audience engages 34% more between 9–11 AM on weekdays.`,
    });

    api.evaluateMessage = (message) => _resolve({
        scores: { clarity: 0.88, engagement: 0.82, cta_strength: 0.79, personalization: 0.91, professionalism: 0.95 },
        overall_feedback: 'Strong message with clear CTA and personalized greeting. Consider adding a specific price anchor to boost urgency.',
        suggestions: ['Add an early-bird deadline', 'Include the unit number or floor range'],
    });

    api.recordMetric = () => _resolve({ recorded: true });
    api.exportAnalytics = () => _resolve({ data: [], format: 'json' });

    // ── Approvals ────────────────────────────────────────────────────────
    api.getPendingApprovals = () => _resolve([..._approvals]);
    api.approveCampaign = (id) => {
        const i = _approvals.findIndex(a => (a.id || a.campaign_id) === id);
        if (i >= 0) { const [removed] = _approvals.splice(i, 1); const camp = _campaigns.find(c => c.id === removed.id); if (camp) camp.status = 'approved'; }
        return _resolve({ success: true, message: 'Campaign approved (mock)' });
    };
    api.rejectCampaign = (id, feedback) => {
        const i = _approvals.findIndex(a => (a.id || a.campaign_id) === id);
        if (i >= 0) { const [removed] = _approvals.splice(i, 1); const camp = _campaigns.find(c => c.id === removed.id); if (camp) camp.status = 'rejected'; }
        return _resolve({ success: true, feedback, message: 'Campaign rejected (mock)' });
    };

    // ── Agent Runs / Heartbeats ──────────────────────────────────────────
    api.getAgentRuns       = () => _resolve([..._agentRuns]);
    api.getAgentHeartbeats = () => _resolve([..._heartbeats]);
    api.postHeartbeat      = (name, status) => {
        const hb = _heartbeats.find(h => h.agent_name === name);
        if (hb) { hb.status = status; hb.last_seen = new Date().toISOString(); }
        return _resolve({ ok: true });
    };
    api.getAgentsStatus = () => _resolve({
        agents: _heartbeats,
        total: _heartbeats.length,
        active: _heartbeats.filter(h => h.status === 'active').length,
        idle:   _heartbeats.filter(h => h.status === 'idle').length,
    });

    // ── Audit Log ────────────────────────────────────────────────────────
    api.getAuditLog = (params = {}) => {
        let data = [..._audit];
        if (params.entity_type) data = data.filter(a => a.entity_type === params.entity_type);
        return _resolve(data.slice(0, params.limit || 100));
    };

    // ── Companies ────────────────────────────────────────────────────────
    api.getCompanies      = () => _resolve([..._companies]);
    api.getCompany        = (id) => _resolve(_companies.find(c => c.id === id) || null);
    api.getDefaultCompany = () => _resolve(_companies[0]);
    api.createCompany = (data) => {
        const co = { id: _nextId.company++, is_active: true, created_at: new Date().toISOString(), ...data };
        _companies.push(co);
        return _resolve(co);
    };
    api.updateCompany = (id, data) => {
        const i = _companies.findIndex(c => c.id === id);
        if (i >= 0) Object.assign(_companies[i], data);
        return _resolve(_companies[i]);
    };
    api.deleteCompany = (id) => {
        const i = _companies.findIndex(c => c.id === id);
        if (i >= 0) _companies.splice(i, 1);
        return _resolve({ deleted: true });
    };

    // ── Maintenance (safe no-ops) ────────────────────────────────────────
    api.clearClients   = () => { _clients.length   = 0; return _resolve({ cleared: true }); };
    api.clearCampaigns = () => { _campaigns.length = 0; return _resolve({ cleared: true }); };
    api.clearReports   = () => { _reports.length   = 0; return _resolve({ cleared: true }); };
    api.clearAudit     = () => { _audit.length     = 0; return _resolve({ cleared: true }); };
    api.clearAllData   = () => { _clients.length = _campaigns.length = _reports.length = _audit.length = 0; return _resolve({ cleared: true }); };

    // ── Media ────────────────────────────────────────────────────────────
    api.uploadMedia = () => _resolve({ url: 'https://placehold.co/800x400/25D366/ffffff?text=Mock+Image', key: 'mock/image.jpg' });

    // ── Mark health indicator green immediately ──────────────────────────
    const dot  = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');
    if (dot)  { dot.className = 'status-dot'; dot.style.background = '#22c55e'; dot.style.boxShadow = '0 0 6px #22c55e'; }
    if (text) text.textContent = 'Mock Mode';

    console.log('%c Mock Data Active — no real API calls ', 'background:#6366f1;color:#fff;border-radius:4px;padding:2px 8px;font-weight:bold;');
});
