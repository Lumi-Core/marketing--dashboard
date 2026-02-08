/**
 * Main Application Controller — Marketing Campaign Agent Dashboard
 */
const App = {
    currentPage: 'dashboard',
    healthTimer: null,

    pages: {
        dashboard:  { module: typeof Dashboard  !== 'undefined' ? Dashboard  : null, icon: 'tachometer-alt', label: 'Dashboard' },
        clients:    { module: typeof Clients    !== 'undefined' ? Clients    : null, icon: 'users',          label: 'Clients' },
        campaigns:  { module: typeof Campaigns  !== 'undefined' ? Campaigns  : null, icon: 'bullhorn',       label: 'Campaigns' },
        workflow:   { module: typeof Workflow    !== 'undefined' ? Workflow    : null, icon: 'project-diagram',label: 'Workflow' },
        analytics:  { module: typeof Analytics  !== 'undefined' ? Analytics  : null, icon: 'lightbulb',      label: 'Analytics Insights' },
        approvals:  { module: typeof Approvals  !== 'undefined' ? Approvals  : null, icon: 'check-double',   label: 'Approvals' },
        agents:     { module: typeof Agents     !== 'undefined' ? Agents     : null, icon: 'robot',          label: 'Agents' },
        reports:    { module: typeof Reports    !== 'undefined' ? Reports    : null, icon: 'chart-bar',      label: 'Reports' },
        audit:      { module: typeof Audit      !== 'undefined' ? Audit      : null, icon: 'scroll',         label: 'Audit Log' },
        settings:   { module: typeof Settings   !== 'undefined' ? Settings   : null, icon: 'cog',            label: 'Settings' },
    },

    init() {
        // Rebind module references (scripts loaded after object created)
        if (typeof Dashboard  !== 'undefined') this.pages.dashboard.module  = Dashboard;
        if (typeof Clients    !== 'undefined') this.pages.clients.module    = Clients;
        if (typeof Campaigns  !== 'undefined') this.pages.campaigns.module  = Campaigns;
        if (typeof Workflow    !== 'undefined') this.pages.workflow.module   = Workflow;
        if (typeof Analytics  !== 'undefined') this.pages.analytics.module  = Analytics;
        if (typeof Approvals  !== 'undefined') this.pages.approvals.module  = Approvals;
        if (typeof Agents     !== 'undefined') this.pages.agents.module     = Agents;
        if (typeof Reports    !== 'undefined') this.pages.reports.module    = Reports;
        if (typeof Audit      !== 'undefined') this.pages.audit.module      = Audit;
        if (typeof Settings   !== 'undefined') this.pages.settings.module   = Settings;

        // Init all modules
        Object.values(this.pages).forEach(p => { if (p.module && p.module.init) p.module.init(); });

        this.bindEvents();
        this.handleHashChange();
        this.startHealthMonitor();
        console.log('%c Marketing Agent Dashboard Ready ', 'background:#25D366;color:#fff;border-radius:4px;padding:2px 8px;font-weight:bold;');
    },

    bindEvents() {
        // Sidebar navigation
        on(document, 'click', '.nav-item', (e, el) => {
            e.preventDefault();
            const page = el.dataset.page;
            if (page) this.navigateTo(page);
        });

        // Hash change
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Mobile sidebar toggle
        const toggle = $('#sidebar-toggle');
        if (toggle) toggle.addEventListener('click', () => {
            const sb = $('#sidebar');
            if (sb) sb.classList.toggle('open');
        });

        // Close sidebar on mobile when clicking overlay
        on(document, 'click', '.sidebar-overlay', () => {
            const sb = $('#sidebar');
            if (sb) sb.classList.remove('open');
        });

        // Close modals on backdrop click
        on(document, 'click', '.modal', (e, modal) => {
            if (e.target === modal) closeModal(modal.id);
        });

        // Close modal buttons
        on(document, 'click', '.modal-close, .btn-cancel-modal', () => closeAllModals());

        // Global refresh
        const refreshBtn = $('#global-refresh');
        if (refreshBtn) refreshBtn.addEventListener('click', () => {
            const p = this.pages[this.currentPage];
            if (p && p.module && p.module.onPageActive) p.module.onPageActive();
            showToast('Refreshed', 'info', 1500);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeAllModals();
            if (e.ctrlKey && e.key === 'k') { e.preventDefault(); const s = $('.search-input'); if (s) s.focus(); }
        });
    },

    navigateTo(page) {
        if (!this.pages[page]) return;
        window.location.hash = page;
    },

    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const page = this.pages[hash] ? hash : 'dashboard';
        this.activatePage(page);
    },

    activatePage(page) {
        // Deactivate old
        const oldPage = this.pages[this.currentPage];
        if (oldPage && oldPage.module && oldPage.module.onPageInactive) oldPage.module.onPageInactive();

        // Switch page sections
        $$('.page').forEach(el => el.classList.add('hidden'));
        const target = $(`#page-${page}`);
        if (target) target.classList.remove('hidden');

        // Switch active nav
        $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));

        // Update header title
        const title = $('#page-title');
        if (title && this.pages[page]) title.textContent = this.pages[page].label;

        // Close mobile sidebar
        const sb = $('#sidebar');
        if (sb) sb.classList.remove('open');

        this.currentPage = page;

        // Activate new
        const newPage = this.pages[page];
        if (newPage && newPage.module && newPage.module.onPageActive) newPage.module.onPageActive();
    },

    startHealthMonitor() {
        this.checkHealth();
        this.healthTimer = setInterval(() => this.checkHealth(), 30000);
    },

    async checkHealth() {
        const indicator = $('#health-indicator');
        if (!indicator) return;
        try {
            const result = await api.getHealth();
            const ok = result && (result.status === 'healthy' || result.status === 'ok');
            indicator.className = `health-dot ${ok ? 'online' : 'degraded'}`;
            indicator.title = ok ? 'API Online' : 'API Degraded';
        } catch {
            indicator.className = 'health-dot offline';
            indicator.title = 'API Offline';
        }
    }
};

/* ── Bootstrap ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => App.init());
