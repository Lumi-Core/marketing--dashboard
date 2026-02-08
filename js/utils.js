/**
 * Shared Utilities — Marketing Campaign Agent Dashboard
 */

/* ── DOM helpers ─────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);
const $$$ = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => { if (k === 'className') el.className = v; else if (k === 'innerHTML') el.innerHTML = v; else if (k === 'textContent') el.textContent = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v); else el.setAttribute(k, v); });
    children.forEach(c => { if (typeof c === 'string') el.appendChild(document.createTextNode(c)); else if (c) el.appendChild(c); });
    return el;
};
const on = (el, evt, sel, fn) => { if (fn) el.addEventListener(evt, e => { const t = e.target.closest(sel); if (t) fn(e, t); }); else el.addEventListener(evt, sel); };
const show = el => { if (el) el.classList.remove('hidden'); };
const hide = el => { if (el) el.classList.add('hidden'); };
const toggle = (el, force) => { if (el) el.classList.toggle('hidden', force !== undefined ? !force : undefined); };

/* ── Toast ───────────────────────────────────── */
function showToast(message, type = 'info', duration = 4000) {
    const container = $('#toastContainer');
    if (!container) return;
    const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    const toast = $$$('div', { className: `toast ${type}`, innerHTML: `<i class="fas fa-${icons[type] || 'info-circle'}"></i><span>${escapeHtml(message)}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>` });
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, duration);
}

/* ── Modal ───────────────────────────────────── */
function openModal(id) {
    const m = $(`#${id}`);
    if (m) { show(m); requestAnimationFrame(() => m.classList.add('active')); }
}
function closeModal(id) {
    const m = id ? $(`#${id}`) : document.querySelector('.modal.active');
    if (m) { m.classList.remove('active'); setTimeout(() => hide(m), 200); }
}
function closeAllModals() { $$('.modal').forEach(m => closeModal(m.id)); }

/* ── Loading overlay ─────────────────────────── */
function showLoading(msg) {
    const o = $('#loadingOverlay');
    if (o) { const t = o.querySelector('p'); if (t) t.textContent = msg || 'Loading…'; show(o); }
}
function hideLoading() { const o = $('#loadingOverlay'); if (o) hide(o); }

/* ── Form helpers ────────────────────────────── */
function getFormData(formEl) {
    const d = {};
    const inputs = formEl.querySelectorAll('input, select, textarea');
    inputs.forEach(i => {
        const k = i.name || i.id;
        if (!k) return;
        if (i.type === 'checkbox') d[k] = i.checked;
        else if (i.type === 'number') d[k] = i.value === '' ? null : Number(i.value);
        else d[k] = i.value;
    });
    return d;
}
function resetForm(formEl) { if (formEl) formEl.reset(); }
function populateForm(formEl, data) {
    if (!formEl || !data) return;
    Object.entries(data).forEach(([k, v]) => {
        const el = formEl.querySelector(`[name="${k}"], #${k}`);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = !!v;
        else if (el.tagName === 'SELECT') { el.value = v || ''; }
        else el.value = v ?? '';
    });
}

/* ── Formatters ──────────────────────────────── */
function formatDate(d, opts) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return '—';
    if (opts) return dt.toLocaleDateString('en-US', opts);
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatNumber(n) { if (n == null) return '—'; return Number(n).toLocaleString(); }
function formatPercent(n, dec = 1) { if (n == null) return '—'; return Number(n).toFixed(dec) + '%'; }

function timeAgo(d) {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

/* ── Status helpers ──────────────────────────── */
function getStatusClass(status) {
    if (!status) return 'draft';
    const s = status.toLowerCase();
    const map = {
        posted: 'success', completed: 'success', approved: 'success', active: 'success', online: 'success', sent: 'success',
        pending: 'warning', draft: 'draft', scheduled: 'info', queued: 'info',
        running: 'running', sending: 'running', in_progress: 'running',
        failed: 'danger', error: 'danger', rejected: 'danger', offline: 'danger',
        revising: 'warning', inactive: 'draft',
    };
    return map[s] || 'draft';
}

function getStatusIcon(status) {
    if (!status) return 'circle';
    const s = status.toLowerCase();
    const map = {
        posted: 'check-circle', completed: 'check-circle', approved: 'check-circle', sent: 'check-circle',
        active: 'circle-check', online: 'signal',
        pending: 'clock', draft: 'file', scheduled: 'calendar-check', queued: 'list-ol',
        running: 'spinner fa-spin', sending: 'paper-plane', in_progress: 'spinner fa-spin',
        failed: 'times-circle', error: 'exclamation-circle', rejected: 'ban', offline: 'plug',
        revising: 'edit', inactive: 'moon',
    };
    return map[s] || 'circle';
}

function statusBadge(status) {
    if (!status) return '<span class="status-badge draft">—</span>';
    return `<span class="status-badge ${getStatusClass(status)}"><i class="fas fa-${getStatusIcon(status)}"></i> ${escapeHtml(status)}</span>`;
}

/* ── String helpers ──────────────────────────── */
function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function truncate(s, len = 60) { if (!s) return ''; return s.length > len ? s.slice(0, len) + '…' : s; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; }

/* ── Export ───────────────────────────────────── */
function exportToCSV(rows, filename) {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv' }), filename || 'export.csv');
}
function exportToJSON(data, filename) {
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename || 'export.json');
}
function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

/* ── Debounce / Throttle ─────────────────────── */
function debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function throttle(fn, ms = 300) { let l = 0; return (...a) => { const n = Date.now(); if (n - l >= ms) { l = n; fn(...a); } }; }

/* ── Pagination builder ──────────────────────── */
function buildPagination(container, page, totalPages, onChange) {
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;
    const add = (label, pg, disabled, active) => {
        const btn = $$$('button', { className: `btn btn-sm ${active ? 'btn-primary' : ''}`, textContent: label });
        if (disabled || active) btn.disabled = true;
        else btn.addEventListener('click', () => onChange(pg));
        container.appendChild(btn);
    };
    add('«', page - 1, page <= 1);
    const start = Math.max(1, page - 2), end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) add(String(i), i, false, i === page);
    add('»', page + 1, page >= totalPages);
}

/* ── Confirmation dialog ─────────────────────── */
function confirmAction(message) {
    return new Promise(resolve => {
        const msgEl = $('#confirmMessage');
        if (msgEl) msgEl.textContent = message;
        openModal('confirmModal');
        const yes = $('#confirmAction');
        const no = $('#cancelConfirm');
        const handler = (result) => { closeModal('confirmModal'); if (yes) yes.removeEventListener('click', yFn); if (no) no.removeEventListener('click', nFn); resolve(result); };
        const yFn = () => handler(true);
        const nFn = () => handler(false);
        if (yes) yes.addEventListener('click', yFn);
        if (no) no.addEventListener('click', nFn);
    });
}
