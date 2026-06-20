/**
 * Empires Game - Main Application
 *
 * Dashboard initialization: stats, my empire, create empire.
 */

async function loadMyEmpire() {
    const data = await api.get('/api/web/user/nation');
    if (!data) return;

    const mySection = document.getElementById('my-empire-section');
    const resourceSection = document.getElementById('resource-bars-section');
    const createSection = document.getElementById('create-empire-section');
    const myBody = document.getElementById('my-empire-body');
    const adminBadge = document.getElementById('my-empire-admin-badge');

    if (data.has_nation && data.nation) {
        createSection.classList.add('d-none');
        const n = data.nation;
        myBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-dark table-sm">
                        <tr><th>Empire</th><td>${esc(n.nation_name || 'Unknown')}</td></tr>
                        <tr><th>Ruler</th><td>${esc(n.ruler_name || 'Unknown')}</td></tr>
                        <tr><th>Capital</th><td>${esc(n.capital_city_name || '-')}</td></tr>
                        <tr><th>Government</th><td><span class="badge bg-info">${esc(n.government_type || '-')}</span></td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-dark table-sm">
                        <tr><th>💰 Cash</th><td>${fmtNum(n.cash)}</td></tr>
                        <tr><th>🌾 Infrastructure</th><td>${fmtNum(n.total_infrastructure)}</td></tr>
                        <tr><th>🏞️ Land</th><td>${fmtNum(n.total_land)}</td></tr>
                        <tr><th>👥 Population</th><td>${fmtNum(n.total_population)}</td></tr>
                    </table>
                </div>
            </div>
            <div class="mt-2">
                <a href="/nations" class="btn btn-sm btn-outline-light">Manage Empire →</a>
            </div>
        `;
        mySection.classList.remove('d-none');
        resourceSection.classList.remove('d-none');
        if (auth.user?.is_admin) {
            adminBadge.innerHTML = '<span class="badge bg-info">Admin</span>';
        }
    } else {
        mySection.classList.add('d-none');
        resourceSection.classList.add('d-none');
        createSection.classList.remove('d-none');
    }
}

async function createEmpire() {
    const err = document.getElementById('ce-error');
    const btn = document.querySelector('[onclick="createEmpire()"]');
    const name = document.getElementById('ce-name').value.trim();
    const ruler = document.getElementById('ce-ruler').value.trim();
    const capital = document.getElementById('ce-capital').value.trim();
    const gov = document.getElementById('ce-gov').value;
    const religion = document.getElementById('ce-religion').value;
    const resource = document.getElementById('ce-resource').value;
    const warPolicy = document.getElementById('ce-war-policy').value;
    const domPolicy = document.getElementById('ce-dom-policy').value;
    const color = document.getElementById('ce-color').value;

    err.classList.add('d-none');
    if (!name || !ruler) {
        err.textContent = 'Empire name and ruler name are required';
        err.classList.remove('d-none');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating...';

    const resp = await api.post('/api/web/user/create-nation', {
        nation_name: name,
        ruler_name: ruler,
        capital_city_name: capital || 'Capital',
        government_type: gov,
        religion_type: religion || null,
        resource_1: resource,
        war_policy_type: warPolicy,
        domestic_policy_type: domPolicy,
        national_color: color,
    });

    if (resp && resp.nation) {
        showToast('Empire founded! Welcome to the world.', 'success');
        await loadMyEmpire();
        await loadDashboard();
    } else {
        err.textContent = 'Failed to create empire. Try a different name.';
        err.classList.remove('d-none');
    }
    btn.disabled = false;
    btn.textContent = '⚔️ Found Empire';
}

async function loadDashboard() {
    const stats = await api.get('/api/web/stats');
    if (stats) {
        document.getElementById('stat-nations').textContent = stats.total_nations ?? '-';
        document.getElementById('stat-alliances').textContent = stats.total_alliances ?? '-';
        document.getElementById('stat-wars').textContent = stats.active_wars ?? '-';
        document.getElementById('stat-version').textContent = stats.gpp_running ? 'Online' : 'Offline';
    }

    const nations = await api.get('/api/web/nations');
    const recentEl = document.getElementById('recent-nations');
    if (nations && nations.length > 0) {
        const recent = nations.slice(0, 10);
        recentEl.innerHTML = `
            <table class="table table-dark table-sm">
                <thead>
                    <tr>
                        <th>Nation</th>
                        <th>Ruler</th>
                        <th>Government</th>
                    </tr>
                </thead>
                <tbody>
                    ${recent.map(n => `
                        <tr>
                            <td>${esc(n.nation_name || 'Unknown')}</td>
                            <td>${esc(n.ruler_name || '-')}</td>
                            <td><span class="badge bg-info">${esc(n.government_type || '-')}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        recentEl.innerHTML = '<div class="text-center text-secondary py-4">No nations yet. Be the first to found an empire!</div>';
    }

    const health = await api.get('/api/web/health');
    const infoEl = document.getElementById('game-info');
    if (health) {
        const g = health.gpp_manager || {};
        infoEl.innerHTML = `
            <div class="mb-2"><strong>Status:</strong> <span class="badge ${g.running ? 'bg-success' : 'bg-danger'}">${g.running ? 'Running' : 'Stopped'}</span></div>
            <div class="mb-2"><strong>Components:</strong> ${Object.keys(health.components || {}).length}</div>
            <hr class="text-secondary">
            <div class="text-secondary"><small>Empires Game v1.0.0<br>1 empire per player</small></div>
        `;
    } else {
        infoEl.innerHTML = '<div class="text-danger">Failed to reach API</div>';
    }
}

function fmtNum(n) {
    if (!n && n !== 0) return '-';
    return Number(n).toLocaleString();
}

function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

/**
 * Global search — navigates to nations page filtered by query.
 * Called by the oninput on the navbar search box.
 */
function handleGlobalSearch(value) {
    const q = value.trim();
    if (q.length < 2) return;
    // If we're already on the nations page, filter inline
    const tbody = document.getElementById('nations-tbody');
    if (tbody && typeof allNations !== 'undefined') {
        document.getElementById('nation-search').value = q;
        render(allNations);
        return;
    }
    // Otherwise navigate to nations page with search param
    window.location.href = '/nations?q=' + encodeURIComponent(q);
}

document.addEventListener('DOMContentLoaded', () => {
    // Apply URL search param on nations page
    if (document.getElementById('nation-search')) {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
            document.getElementById('nation-search').value = q;
        }
    }
});
