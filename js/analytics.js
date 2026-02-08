/**
 * Analytics Insights Page — Marketing Campaign Agent Dashboard
 */
const Analytics = {

    init() { this.bindEvents(); },

    bindEvents() {
        const pg = $('#page-analytics');
        if (!pg) return;

        on(pg, 'click', '#refreshAnalytics', () => this.onPageActive());
        on(pg, 'click', '#evaluate-msg-btn', () => this.evaluateMessage());
        on(pg, 'click', '#best-time-btn', () => this.loadBestTime());
        on(pg, 'click', '.btn-refresh-overview', () => this.loadOverview());
        on(pg, 'click', '.btn-refresh-recs', () => this.loadRecommendations());
        on(pg, 'click', '.btn-refresh-performance', () => this.loadPerformanceSummary());
        on(pg, 'click', '.btn-refresh-audience', () => this.loadAudienceInsights());
        on(pg, 'click', '.btn-refresh-activity', () => this.loadRecentActivity());
        on(pg, 'click', '.btn-refresh-kpis', () => this.loadKPIs());
        on(pg, 'click', '.btn-refresh-engagement', () => this.loadEngagementBreakdown());
        on(pg, 'click', '.btn-refresh-strategic', () => this.loadStrategicInsights());
        on(pg, 'click', '.btn-apply-rec', e => this.applyRecommendation(e.target.closest('.btn-apply-rec').dataset.id));
    },

    onPageActive() {
        this.loadKPIs();
        this.loadStrategicInsights();
        this.loadEngagementBreakdown();
        this.loadOverview();
        this.loadRecommendations();
        this.loadPerformanceSummary();
        this.loadAudienceInsights();
        this.loadRecentActivity();
    },

    /* ── Overview ──────────────────────────────── */
    async loadOverview() {
        const container = $('#analytics-overview-content');
        if (!container) return;
        try {
            container.innerHTML = '<div class="loading-text">Analysing campaigns…</div>';
            const result = await api.getAnalyticsOverview();
            this.renderOverview(container, result);
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-chart-line"></i><p>${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderOverview(container, data) {
        if (!data) { container.innerHTML = '<p>No data</p>'; return; }
        const summary = data.summary || data;
        const highlights = data.highlights || [];

        let html = '<div class="ai-overview-grid">';
        if (summary.total_campaigns != null) html += this.overviewCard('Campaigns Analysed', summary.total_campaigns, 'bullhorn', 'primary');
        if (summary.avg_delivery_rate != null) html += this.overviewCard('Avg Delivery', formatPercent(summary.avg_delivery_rate), 'paper-plane', 'success');
        if (summary.avg_engagement_rate != null) html += this.overviewCard('Avg Engagement', formatPercent(summary.avg_engagement_rate), 'heart', 'info');
        if (summary.top_audience != null) html += this.overviewCard('Top Audience', summary.top_audience, 'users', 'warning');
        html += '</div>';

        if (highlights.length) {
            html += '<div class="ai-highlights"><h4><i class="fas fa-lightbulb"></i> Key Insights</h4><ul>';
            highlights.forEach(h => { html += `<li>${escapeHtml(h)}</li>`; });
            html += '</ul></div>';
        }

        // Raw AI response
        if (data.analysis) {
            html += `<div class="ai-raw-response"><h4>Detailed Analysis</h4><div class="ai-text">${this.formatAIText(data.analysis)}</div></div>`;
        }

        container.innerHTML = html;
    },

    overviewCard(label, value, icon, cls) {
        return `<div class="ai-stat-card ${cls}"><div class="ai-stat-icon"><i class="fas fa-${icon}"></i></div><div class="ai-stat-value">${value}</div><div class="ai-stat-label">${label}</div></div>`;
    },

    /* ── Recommendations ──────────────────────── */
    async loadRecommendations() {
        const container = $('#recommendations-content');
        if (!container) return;
        try {
            container.innerHTML = '<div class="loading-text">Generating recommendations…</div>';
            const result = await api.getAIRecommendations();
            this.renderRecommendations(container, result);
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-robot"></i><p>${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderRecommendations(container, data) {
        const recs = data.recommendations || data;
        if (!recs || (Array.isArray(recs) && !recs.length)) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-thumbs-up"></i><p>No recommendations at this time</p></div>';
            return;
        }

        if (Array.isArray(recs)) {
            container.innerHTML = '<div class="recommendations-grid">' + recs.map(r => `
                <div class="recommendation-card impact-${(r.impact || 'medium').toLowerCase()}">
                    <div class="rec-header">
                        <span class="rec-category badge-${(r.category || 'general').toLowerCase()}">${capitalize(r.category || 'General')}</span>
                        <span class="rec-impact">${capitalize(r.impact || 'medium')} impact</span>
                    </div>
                    <h4>${escapeHtml(r.title || 'Recommendation')}</h4>
                    <p>${escapeHtml(r.description || r.text || '')}</p>
                    ${r.confidence != null ? `<div class="confidence-bar"><div class="confidence-fill" style="width:${r.confidence}%"></div><span>${r.confidence}%</span></div>` : ''}
                </div>
            `).join('') + '</div>';
        } else {
            container.innerHTML = `<div class="ai-raw-response"><div class="ai-text">${this.formatAIText(typeof recs === 'string' ? recs : JSON.stringify(recs, null, 2))}</div></div>`;
        }
    },

    /* ── Best Send Time ───────────────────────── */
    async loadBestTime() {
        const container = $('#best-time-result');
        const audience = $('#best-time-audience');
        if (!container) return;
        const aud = audience ? audience.value : 'all';
        try {
            container.innerHTML = '<div class="loading-text">Calculating best send time…</div>';
            const result = await api.getBestSendTime(aud);
            this.renderBestTime(container, result);
        } catch (e) {
            container.innerHTML = `<p class="text-muted">${escapeHtml(e.message)}</p>`;
        }
    },

    renderBestTime(container, data) {
        const best = data.best_time || data.recommended_time || data;
        let html = '<div class="best-time-card">';
        if (typeof best === 'string') {
            html += `<div class="best-time-value"><i class="fas fa-clock"></i> ${escapeHtml(best)}</div>`;
        } else if (best && typeof best === 'object') {
            if (best.day) html += `<div class="best-time-detail"><strong>Best Day:</strong> ${escapeHtml(best.day)}</div>`;
            if (best.hour != null) html += `<div class="best-time-detail"><strong>Best Hour:</strong> ${best.hour}:00</div>`;
            if (best.timezone) html += `<div class="best-time-detail"><strong>Timezone:</strong> ${escapeHtml(best.timezone)}</div>`;
        }
        if (data.reasoning) html += `<div class="best-time-reasoning"><i class="fas fa-brain"></i> ${escapeHtml(data.reasoning)}</div>`;
        html += '</div>';
        container.innerHTML = html;
    },

    /* ── Message Evaluator ────────────────────── */
    async evaluateMessage() {
        const msgInput = $('#eval-message');
        const audInput = $('#eval-audience');
        const container = $('#eval-result');
        if (!msgInput || !container) return;
        const msg = msgInput.value.trim();
        if (!msg) { showToast('Enter a message to evaluate', 'warning'); return; }
        const aud = audInput ? audInput.value : 'general';
        try {
            container.innerHTML = '<div class="loading-text">Evaluating message…</div>';
            const result = await api.evaluateMessage(msg, aud);
            this.renderEvaluation(container, result);
        } catch (e) {
            container.innerHTML = `<p class="text-muted">${escapeHtml(e.message)}</p>`;
        }
    },

    renderEvaluation(container, data) {
        let html = '<div class="eval-results">';
        const scores = data.scores || data;

        if (typeof scores === 'object' && !Array.isArray(scores)) {
            const entries = Object.entries(scores).filter(([k]) => k !== 'suggestions' && k !== 'feedback' && k !== 'overall_feedback');
            if (entries.length) {
                html += '<div class="eval-scores">';
                entries.forEach(([k, v]) => {
                    const numVal = typeof v === 'number' ? v : parseFloat(v);
                    if (!isNaN(numVal)) {
                        const pct = Math.min(100, Math.max(0, numVal * (numVal <= 1 ? 100 : 1)));
                        const cls = pct >= 70 ? 'good' : pct >= 40 ? 'ok' : 'poor';
                        html += `<div class="eval-score-row">
                            <span class="eval-score-label">${capitalize(k.replace(/_/g, ' '))}</span>
                            <div class="eval-bar"><div class="eval-bar-fill ${cls}" style="width:${pct}%"></div></div>
                            <span class="eval-score-value">${numVal <= 1 ? formatPercent(numVal * 100, 0) : formatPercent(numVal, 0)}</span>
                        </div>`;
                    }
                });
                html += '</div>';
            }
        }

        const feedback = data.overall_feedback || data.feedback;
        if (feedback) html += `<div class="eval-feedback"><i class="fas fa-comment-dots"></i> ${escapeHtml(feedback)}</div>`;

        const suggestions = data.suggestions || [];
        if (Array.isArray(suggestions) && suggestions.length) {
            html += '<div class="eval-suggestions"><h5><i class="fas fa-magic"></i> Suggestions</h5><ul>';
            suggestions.forEach(s => { html += `<li>${escapeHtml(typeof s === 'string' ? s : s.text || JSON.stringify(s))}</li>`; });
            html += '</ul></div>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    /* ── Performance Summary ──────────────────── */
    async loadPerformanceSummary(days = 30) {
        const container = $('#performance-summary-content');
        if (!container) return;
        try {
            container.innerHTML = '<div class="loading-text">Loading performance data…</div>';
            const result = await api.getPerformanceSummary(days);
            this.renderPerformanceSummary(container, result);
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-chart-bar"></i><p>${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderPerformanceSummary(container, data) {
        if (!data) { container.innerHTML = '<p>No data</p>'; return; }
        
        let html = '<div class="performance-summary">';
        
        // Campaign Stats
        if (data.campaign_stats) {
            const cs = data.campaign_stats;
            html += '<div class="perf-section"><h4><i class="fas fa-bullhorn"></i> Campaign Statistics</h4><div class="perf-stats-grid">';
            if (cs.total != null) html += this.perfStatCard('Total Campaigns', cs.total, 'bullhorn', 'info');
            if (cs.completed != null) html += this.perfStatCard('Completed', cs.completed, 'check-circle', 'success');
            if (cs.failed != null) html += this.perfStatCard('Failed', cs.failed, 'times-circle', 'danger');
            const successRate = cs.total > 0 ? ((cs.completed / cs.total) * 100).toFixed(1) : 0;
            html += this.perfStatCard('Success Rate', `${successRate}%`, 'chart-line', 'primary');
            html += '</div></div>';
        }
        
        // Delivery Stats
        if (data.delivery_stats) {
            const ds = data.delivery_stats;
            html += '<div class="perf-section"><h4><i class="fas fa-paper-plane"></i> Delivery Performance</h4><div class="perf-stats-grid">';
            if (ds.total_sent != null) html += this.perfStatCard('Messages Sent', formatNumber(ds.total_sent), 'envelope', 'primary');
            if (ds.total_failed != null) html += this.perfStatCard('Failed', formatNumber(ds.total_failed), 'exclamation-triangle', 'warning');
            if (ds.avg_success_rate != null) html += this.perfStatCard('Avg Success Rate', formatPercent(ds.avg_success_rate), 'check', 'success');
            html += '</div></div>';
        }
        
        // Audience Breakdown
        if (data.audience_breakdown && data.audience_breakdown.length) {
            html += '<div class="perf-section"><h4><i class="fas fa-users"></i> Audience Breakdown</h4><div class="audience-breakdown">';
            data.audience_breakdown.forEach(a => {
                html += `<div class="audience-item"><span class="aud-name">${escapeHtml(a.target_audience || 'Unknown')}</span><span class="aud-count badge-info">${formatNumber(a.count || 0)} campaigns</span></div>`;
            });
            html += '</div></div>';
        }
        
        // Top Campaigns
        if (data.top_campaigns && data.top_campaigns.length) {
            html += '<div class="perf-section"><h4><i class="fas fa-trophy"></i> Top Campaigns</h4><div class="top-campaigns-list">';
            data.top_campaigns.forEach((c, i) => {
                html += `<div class="top-campaign-item"><span class="campaign-rank">#${i+1}</span><span class="campaign-name">${escapeHtml(c.name || 'Campaign')}</span><span class="campaign-sent badge-success">${formatNumber(c.successful_sends || 0)} sent</span></div>`;
            });
            html += '</div></div>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    },

    perfStatCard(label, value, icon, cls) {
        return `<div class="perf-stat-card ${cls}"><div class="perf-stat-icon"><i class="fas fa-${icon}"></i></div><div class="perf-stat-value">${value}</div><div class="perf-stat-label">${label}</div></div>`;
    },

    /* ── Audience Insights ────────────────────── */
    async loadAudienceInsights() {
        const container = $('#audience-insights-content');
        if (!container) return;
        try {
            container.innerHTML = '<div class="loading-text">Analyzing audience data…</div>';
            const result = await api.getAudienceInsights();
            this.renderAudienceInsights(container, result);
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderAudienceInsights(container, data) {
        if (!data) { container.innerHTML = '<p>No data</p>'; return; }
        
        let html = '<div class="audience-insights">';
        
        // Distribution
        if (data.audience_distribution && data.audience_distribution.length) {
            html += '<div class="insight-section"><h4><i class="fas fa-chart-pie"></i> Audience Distribution</h4><div class="aud-dist-grid">';
            data.audience_distribution.forEach(a => {
                html += `<div class="aud-dist-card">
                    <div class="aud-dist-name">${escapeHtml(a.audience_type || 'Unknown')}</div>
                    <div class="aud-dist-total">${formatNumber(a.total_clients || 0)} clients</div>
                    <div class="aud-dist-active">${formatNumber(a.active_campaigns || 0)} active</div>
                </div>`;
            });
            html += '</div></div>';
        }
        
        // Performance by Audience
        if (data.audience_performance && data.audience_performance.length) {
            html += '<div class="insight-section"><h4><i class="fas fa-tachometer-alt"></i> Performance by Audience</h4><div class="aud-perf-table">';
            html += '<table class="data-table"><thead><tr><th>Audience</th><th>Campaigns</th><th>Success Rate</th><th>Total Sent</th></tr></thead><tbody>';
            data.audience_performance.forEach(a => {
                html += `<tr>
                    <td>${escapeHtml(a.target_audience || 'Unknown')}</td>
                    <td>${formatNumber(a.total_campaigns || 0)}</td>
                    <td><span class="badge-${a.avg_success_rate >= 0.8 ? 'success' : a.avg_success_rate >= 0.5 ? 'warning' : 'danger'}">${formatPercent(a.avg_success_rate * 100)}</span></td>
                    <td>${formatNumber(a.total_sent || 0)}</td>
                </tr>`;
            });
            html += '</tbody></table></div></div>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    },

    /* ── Recent Activity ──────────────────────── */
    async loadRecentActivity(limit = 50) {
        const container = $('#recent-activity-content');
        if (!container) return;
        try {
            container.innerHTML = '<div class="loading-text">Loading recent activity…</div>';
            const result = await api.getRecentActivity(limit);
            this.renderRecentActivity(container, result);
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-history"></i><p>${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderRecentActivity(container, data) {
        const activities = data.activity || data;
        if (!activities || !activities.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>No recent activity</p></div>';
            return;
        }
        
        let html = '<div class="activity-timeline">';
        activities.forEach(a => {
            const typeIcon = a.activity_type === 'campaign' ? 'bullhorn' : 'robot';
            const typeCls = a.activity_type === 'campaign' ? 'timeline-campaign' : 'timeline-agent';
            html += `<div class="timeline-item ${typeCls}">
                <div class="timeline-icon"><i class="fas fa-${typeIcon}"></i></div>
                <div class="timeline-content">
                    <div class="timeline-title">${escapeHtml(a.title || 'Activity')}</div>
                    <div class="timeline-detail">${escapeHtml(a.detail || '')}</div>
                    <div class="timeline-time">${formatDate(a.timestamp)}</div>
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    /* ── Recommendation Actions ───────────────── */
    async applyRecommendation(recId) {
        if (!recId) return;
        try {
            await api.applyRecommendation(recId);
            showToast('Recommendation marked as applied', 'success');
            this.loadRecommendations(); // Refresh
        } catch (e) {
            showToast(`Error: ${e.message}`, 'error');
        }
    },

    /* ── Key Performance Indicators ───────────── */
    async loadKPIs(days = 30) {
        const container = $('#kpi-cards-grid');
        if (!container) return;
        try {
            container.innerHTML = '<div class="loading-text">Loading KPIs...</div>';
            const result = await api.getKPIs(days);
            this.renderKPIs(container, result);
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-tachometer-alt"></i><p>${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderKPIs(container, data) {
        if (!data || !data.campaign_metrics) {
            container.innerHTML = '<p class="text-muted">No KPI data available</p>';
            return;
        }

        const cm = data.campaign_metrics;
        const vm = data.volume_metrics;
        const em = data.engagement_metrics;
        const am = data.ai_metrics;

        let html = '';

        // Campaign KPI Card
        html += `<div class="kpi-card kpi-primary">
            <div class="kpi-header">
                <div class="kpi-icon"><i class="fas fa-bullhorn"></i></div>
                <div class="kpi-trend ${cm.growth_rate >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-arrow-${cm.growth_rate >= 0 ? 'up' : 'down'}"></i>
                    ${Math.abs(cm.growth_rate)}%
                </div>
            </div>
            <div class="kpi-value">${formatNumber(cm.total_campaigns)}</div>
            <div class="kpi-label">Total Campaigns</div>
            <div class="kpi-details">
                <span class="kpi-detail-item"><i class="fas fa-check-circle"></i> ${cm.completed} completed</span>
                <span class="kpi-detail-item"><i class="fas fa-times-circle"></i> ${cm.failed} failed</span>
            </div>
            <div class="kpi-footer">Success Rate: ${formatPercent(cm.success_rate * 100)}</div>
        </div>`;

        // Message Volume KPI Card
        html += `<div class="kpi-card kpi-success">
            <div class="kpi-header">
                <div class="kpi-icon"><i class="fas fa-paper-plane"></i></div>
                <div class="kpi-trend ${vm.growth_rate >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-arrow-${vm.growth_rate >= 0 ? 'up' : 'down'}"></i>
                    ${Math.abs(vm.growth_rate)}%
                </div>
            </div>
            <div class="kpi-value">${formatNumber(vm.total_sent)}</div>
            <div class="kpi-label">Messages Sent</div>
            <div class="kpi-details">
                <span class="kpi-detail-item">Avg: ${formatNumber(vm.avg_per_campaign)}/campaign</span>
            </div>
            <div class="kpi-footer">Last ${data.period_days} days</div>
        </div>`;

        // Engagement KPI Card
        html += `<div class="kpi-card kpi-info">
            <div class="kpi-header">
                <div class="kpi-icon"><i class="fas fa-users"></i></div>
                <div class="kpi-badge">${em.audience_segments} segments</div>
            </div>
            <div class="kpi-value">${formatNumber(em.active_clients)}</div>
            <div class="kpi-label">Active Clients</div>
            <div class="kpi-details">
                <span class="kpi-detail-item">Activity Rate: ${formatPercent(em.active_rate * 100)}</span>
            </div>
            <div class="kpi-footer">Engaged audience base</div>
        </div>`;

        // AI Recommendations KPI Card
        html += `<div class="kpi-card kpi-warning">
            <div class="kpi-header">
                <div class="kpi-icon"><i class="fas fa-lightbulb"></i></div>
                <div class="kpi-badge">${formatPercent(am.adoption_rate)}% adopted</div>
            </div>
            <div class="kpi-value">${formatNumber(am.total_recommendations)}</div>
            <div class="kpi-label">AI Recommendations</div>
            <div class="kpi-details">
                <span class="kpi-detail-item"><i class="fas fa-check"></i> ${am.applied} applied</span>
            </div>
            <div class="kpi-footer">Avg Confidence: ${formatPercent(am.avg_confidence)}</div>
        </div>`;

        container.innerHTML = html;
    },

    /* ── Engagement Breakdown ──────────────────── */
    async loadEngagementBreakdown(days = 30) {
        const container = $('#engagement-breakdown-content');
        if (!container) return;
        try {
            container.innerHTML = '<div class="loading-text">Analyzing engagement patterns...</div>';
            const result = await api.getEngagementBreakdown(days);
            this.renderEngagementBreakdown(container, result);
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-chart-pie"></i><p>${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderEngagementBreakdown(container, data) {
        if (!data || !data.summary) {
            container.innerHTML = '<p class="text-muted">No engagement data available</p>';
            return;
        }

        let html = '<div class="engagement-breakdown-grid">';

        // Summary Stats
        const s = data.summary;
        html += '<div class="engagement-section">';
        html += '<h4><i class="fas fa-chart-bar"></i> Overall Engagement</h4>';
        html += '<div class="engagement-stats-row">';
        html += `<div class="engagement-stat">
            <div class="eng-stat-value">${formatNumber(s.total_successful)}</div>
            <div class="eng-stat-label">Successful Sends</div>
        </div>`;
        html += `<div class="engagement-stat">
            <div class="eng-stat-value">${formatNumber(s.total_failed)}</div>
            <div class="eng-stat-label">Failed Sends</div>
        </div>`;
        html += `<div class="engagement-stat highlight">
            <div class="eng-stat-value">${formatPercent(s.engagement_rate)}</div>
            <div class="eng-stat-label">Engagement Rate</div>
        </div>`;
        html += `<div class="engagement-stat">
            <div class="eng-stat-value">${s.unique_campaigns}</div>
            <div class="eng-stat-label">Unique Campaigns</div>
        </div>`;
        html += '</div></div>';

        // By Audience
        if (data.by_audience && data.by_audience.length) {
            html += '<div class="engagement-section">';
            html += '<h4><i class="fas fa-users-cog"></i> Performance by Audience</h4>';
            html += '<div class="audience-performance-grid">';
            data.by_audience.forEach(a => {
                const rate = (a.overall_success_rate || 0) * 100;
                const cls = rate >= 80 ? 'excellent' : rate >= 60 ? 'good' : 'needs-improvement';
                html += `<div class="audience-perf-card ${cls}">
                    <div class="aud-perf-header">
                        <span class="aud-perf-name">${escapeHtml(a.target_audience || 'Unknown')}</span>
                        <span class="aud-perf-badge">${formatPercent(rate)}</span>
                    </div>
                    <div class="aud-perf-details">
                        <div class="aud-perf-detail"><i class="fas fa-bullhorn"></i> ${a.total_campaigns} campaigns</div>
                        <div class="aud-perf-detail"><i class="fas fa-paper-plane"></i> ${formatNumber(a.total_sent)} sent</div>
                    </div>
                </div>`;
            });
            html += '</div></div>';
        }

        // Weekly Pattern
        if (data.weekly_pattern && data.weekly_pattern.length) {
            html += '<div class="engagement-section">';
            html += '<h4><i class="fas fa-calendar-week"></i> Weekly Pattern</h4>';
            html += '<div class="weekly-pattern-chart">';
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            data.weekly_pattern.forEach(p => {
                const rate = (p.avg_success_rate || 0) * 100;
                const height = Math.max(5, rate);
                html += `<div class="day-bar">
                    <div class="bar-fill" style="height: ${height}%" title="${formatPercent(rate)}"></div>
                    <div class="bar-label">${days[p.day_of_week] || p.day_of_week}</div>
                    <div class="bar-count">${p.campaign_count}</div>
                </div>`;
            });
            html += '</div></div>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    /* ── Strategic Insights ────────────────────── */
    async loadStrategicInsights(days = 30, limit = 10) {
        const container = $('#strategic-insights-content');
        if (!container) return;
        try {
            container.innerHTML = '<div class="loading-text">Generating strategic insights...</div>';
            const result = await api.getStrategicInsights(days, limit);
            this.renderStrategicInsights(container, result);
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-chess-queen"></i><p>${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderStrategicInsights(container, data) {
        if (!data || !data.top_recommendations) {
            container.innerHTML = '<p class="text-muted">No strategic insights available</p>';
            return;
        }

        let html = '<div class="strategic-insights-grid">';

        // Priority Recommendations
        if (data.top_recommendations.length) {
            html += '<div class="strategic-section">';
            html += '<h4><i class="fas fa-star"></i> Priority Recommendations</h4>';
            html += '<div class="priority-recommendations">';
            data.top_recommendations.slice(0, 5).forEach((rec, i) => {
                const priority = i < 2 ? 'high' : i < 4 ? 'medium' : 'low';
                html += `<div class="priority-rec-card priority-${priority}">
                    <div class="priority-badge">${priority.toUpperCase()} PRIORITY</div>
                    <div class="priority-confidence">
                        <i class="fas fa-brain"></i> ${formatPercent(rec.confidence)} confidence
                    </div>
                    <div class="priority-rec-text">${escapeHtml(rec.recommendation)}</div>
                    <div class="priority-rec-meta">
                        <span class="rec-category-pill">${capitalize(rec.category || 'General')}</span>
                        ${rec.campaign_name ? `<span class="rec-campaign-name">${escapeHtml(rec.campaign_name)}</span>` : ''}
                    </div>
                </div>`;
            });
            html += '</div></div>';
        }

        // Areas for Improvement
        if (data.underperforming_areas && data.underperforming_areas.length) {
            html += '<div class="strategic-section">';
            html += '<h4><i class="fas fa-exclamation-triangle"></i> Areas for Improvement</h4>';
            html += '<div class="improvement-areas">';
            data.underperforming_areas.forEach(area => {
                html += `<div class="improvement-card">
                    <div class="imp-header">
                        <span class="imp-audience">${escapeHtml(area.target_audience)}</span>
                        <span class="imp-rate warning">${formatPercent(area.avg_success_rate * 100)}</span>
                    </div>
                    <div class="imp-details">
                        <span><i class="fas fa-chart-line"></i> ${area.campaign_count} campaigns</span>
                        <span><i class="fas fa-exclamation-circle"></i> ${formatNumber(area.total_failures)} failures</span>
                    </div>
                </div>`;
            });
            html += '</div></div>';
        }

        // Best Performing Patterns
        if (data.best_performing_patterns && data.best_performing_patterns.length) {
            html += '<div class="strategic-section">';
            html += '<h4><i class="fas fa-trophy"></i> Best Performing Patterns</h4>';
            html += '<div class="best-patterns">';
            data.best_performing_patterns.forEach(pattern => {
                html += `<div class="pattern-card">
                    <div class="pattern-badge success"><i class="fas fa-check-circle"></i> ${formatPercent(pattern.avg_success_rate * 100)}</div>
                    <div class="pattern-audience">${escapeHtml(pattern.target_audience)}</div>
                    <div class="pattern-stats">
                        ${pattern.campaign_count} campaigns • ${formatNumber(pattern.total_sent)} messages sent
                    </div>
                </div>`;
            });
            html += '</div></div>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    /* ── Helpers ───────────────────────────────── */
    formatAIText(text) {
        if (!text) return '';
        return escapeHtml(text)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
};
