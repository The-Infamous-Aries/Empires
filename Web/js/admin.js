/**
 * Empires Game - Admin Panel JS
 * Wired to admin.html which uses Bootstrap tabs (data-bs-toggle="tab").
 */

// Initialize on DOM ready — load users immediately
document.addEventListener('DOMContentLoaded', () => {
    const chk = setInterval(() => {
        if (auth?.initialized) {
            clearInterval(chk);
            if (!auth.user) { window.location = '/login'; return; }
            loadUsers();
            // Load health when tab shown
            document.querySelectorAll('[data-bs-toggle="tab"]').forEach(btn => {
                btn.addEventListener('shown.bs.tab', () => {
                    const target = btn.dataset.bsTarget;
                    if (target === '#tab-health')  { loadHealth(); }
                    if (target === '#tab-flags')   { loadFlags(); }
                    if (target === '#tab-perms')   { loadPermissions(); }
                });
            });
        }
    }, 100);
});

function filterUsers() {
    const q = document.getElementById('user-search').value.toLowerCase();
    document.querySelectorAll('#users-tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

// ---------- Users ----------
async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    const data = await api.get('/api/admin/users');
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-secondary">No users</td></tr>';
        return;
    }

    const myPerms = auth.user?.permissions || {};

    tbody.innerHTML = data.map(u => {
        const roleBadge = roleBadgeHtml(u.role);
        const flagBadge = (u.flag_count || 0) > 0
            ? `<span class="badge bg-warning text-dark">${u.flag_count}</span>`
            : '<span class="text-muted">-</span>';
        const bannedBadge = u.banned
            ? '<span class="badge bg-danger">Banned</span>'
            : '<span class="text-muted">-</span>';

        let actions = `<div class="dropdown">
            <button class="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">...</button>
            <ul class="dropdown-menu dropdown-menu-end">`;
        actions += `<li><a class="dropdown-item" href="#" onclick="showUser('${u.user_id}')">View Details</a></li>`;

        if (myPerms.can_ban_users) {
            if (u.banned) {
                actions += `<li><a class="dropdown-item text-success" href="#" onclick="unbanUser('${u.user_id}')">Unban</a></li>`;
            } else {
                actions += `<li><a class="dropdown-item text-danger" href="#" onclick="banUser('${u.user_id}')">Ban</a></li>`;
            }
        }
        if (myPerms.can_manage_permissions) {
            actions += `<li><a class="dropdown-item text-info" href="#" onclick="showUser('${u.user_id}')">Manage Permissions</a></li>`;
        }
        if (myPerms.can_delete_users) {
            actions += `<li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="deleteUser('${u.user_id}')">Delete</a></li>`;
        }
        actions += `</ul></div>`;

        return `<tr>
            <td><strong>${esc(u.username)}</strong></td>
            <td class="text-muted">${esc(u.email || '')}</td>
            <td><code>${esc(u.last_ip || '')}</code></td>
            <td>${u.nation_id ? `<a href="#" onclick="showUser('${u.user_id}')">${u.nation_id.slice(0, 8)}...</a>` : '<span class="text-muted">none</span>'}</td>
            <td>${roleBadge}</td>
            <td>${flagBadge}</td>
            <td>${bannedBadge}</td>
            <td class="text-muted small">${u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
            <td>${actions}</td>
        </tr>`;
    }).join('');

    document.getElementById('user-search').addEventListener('input', function() {
        const q = this.value.toLowerCase();
        tbody.querySelectorAll('tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });
}

// ---------- Permissions Tab ----------
async function loadPermissions() {
    // Load roles
    const roles = await api.get('/api/admin/roles');
    const rc = document.getElementById('roles-content');
    if (roles) {
        rc.innerHTML = Object.entries(roles).map(([name, perms]) => `
            <div class="mb-3 border-bottom pb-2">
                <h6 class="text-${name === 'admin' ? 'danger' : name === 'mod' ? 'warning' : 'info'}">${esc(name)}</h6>
                <div class="d-flex flex-wrap gap-1">${Object.entries(perms).map(([p, v]) =>
                    `<span class="badge ${v ? 'bg-success' : 'bg-secondary'}">${esc(p.replace('can_', ''))}</span>`
                ).join('')}</div>
            </div>
        `).join('');
    } else {
        rc.innerHTML = '<div class="text-danger">Failed to load roles</div>';
    }

    // Load staff list
    const users = await api.get('/api/admin/users');
    const sl = document.getElementById('staff-list');
    const staff = (users || []).filter(u => u.role && u.role !== 'user');
    if (staff.length === 0) {
        sl.innerHTML = '<div class="text-secondary">No staff users yet</div>';
    } else {
        sl.innerHTML = `<div class="table-responsive">
            <table class="table table-dark table-sm small">
                <thead><tr><th>Username</th><th>Role</th><th>User ID</th><th>Actions</th></tr></thead>
                <tbody>${staff.map(u => `
                    <tr>
                        <td>${esc(u.username)}</td>
                        <td>${roleBadgeHtml(u.role)}</td>
                        <td><code>${u.user_id.slice(0, 12)}...</code></td>
                        <td>
                            <button class="btn btn-sm btn-outline-light" onclick="showUser('${u.user_id}')">View</button>
                            ${auth.user?.permissions?.can_manage_permissions ? `<button class="btn btn-sm btn-outline-danger" onclick="setUserRoleDirect('${u.user_id}', 'user')">Demote</button>` : ''}
                        </td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>`;
    }
}

async function setUserRole() {
    const uid = document.getElementById('role-user-id').value.trim();
    const role = document.getElementById('role-select').value;
    const result = document.getElementById('role-result');
    if (!uid) { result.textContent = 'Enter a User ID'; result.className = 'text-danger mt-2 small'; return; }
    const resp = await api.post(`/api/admin/users/${uid}/set-role`, { role });
    if (resp) {
        result.textContent = `Role set to ${role}`;
        result.className = 'text-success mt-2 small';
        loadPermissions();
    } else {
        result.textContent = 'Failed — check User ID';
        result.className = 'text-danger mt-2 small';
    }
}

async function setUserRoleDirect(userId, role) {
    if (!confirm(`Set user to role "${role}"?`)) return;
    const resp = await api.post(`/api/admin/users/${userId}/set-role`, { role });
    if (resp) { loadPermissions(); loadUsers(); }
}

// ---------- IP Flags ----------
async function loadFlags() {
    const tbody = document.getElementById('flags-tbody');
    const data = await api.get('/api/admin/flags');
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-success">No flags — no multi-accounting detected</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(f => `
        <tr class="table-danger">
            <td><strong>${esc(f.username)}</strong></td>
            <td class="text-muted">${esc(f.email || '')}</td>
            <td><code>${esc(f.last_ip || '')}</code></td>
            <td>${f.nation_id ? `${f.nation_id.slice(0, 8)}...` : '<span class="text-muted">none</span>'}</td>
            <td>${roleBadgeHtml(f.role)}</td>
            <td>${esc(f.shared_with || '')}</td>
            <td><button class="btn btn-sm btn-outline-danger" onclick="showUser('${f.user_id}')">View</button></td>
        </tr>
    `).join('');
}

// ---------- System Health ----------
async function loadHealth() {
    const health = await api.get('/api/admin/health');
    const hEl = document.getElementById('admin-health');
    const gEl = document.getElementById('admin-gameinfo');
    const cEl = document.getElementById('admin-components');

    if (health) {
        const g = health.gpp_manager || {};
        hEl.innerHTML = `
            <div class="mb-2"><strong>Status:</strong> <span class="badge ${g.running ? 'bg-success' : 'bg-danger'}">${g.running ? 'Online' : 'Offline'}</span></div>
            <div class="mb-2"><strong>Initialized:</strong> ${g.initialized ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-warning">No</span>'}</div>
            <div class="mb-2"><strong>Components:</strong> ${Object.keys(health.components || {}).length} registered</div>
        `;
    } else {
        hEl.innerHTML = '<div class="text-danger">Failed to connect</div>';
    }

    const stats = await api.get('/api/web/stats');
    if (stats) {
        gEl.innerHTML = `
            <div class="mb-2"><strong>Nations:</strong> ${stats.total_nations}</div>
            <div class="mb-2"><strong>Alliances:</strong> ${stats.total_alliances}</div>
            <div class="mb-2"><strong>Active Wars:</strong> ${stats.active_wars}</div>
            <div class="mb-2"><strong>Server:</strong> <span class="badge ${stats.gpp_running ? 'bg-success' : 'bg-danger'}">${stats.gpp_running ? 'Running' : 'Stopped'}</span></div>
        `;
    }

    const comps = health?.components || {};
    const names = Object.keys(comps);
    if (names.length === 0) {
        cEl.innerHTML = '<div class="text-secondary">No components registered</div>';
    } else {
        cEl.innerHTML = '<div class="row g-2">' + names.map(n => {
            const s = comps[n];
            const ok = s?.initialized || s?.status === 'healthy' || s?.running;
            return `<div class="col-md-3 col-6"><div class="border rounded p-2"><small><strong>${n}</strong><br><span class="badge ${ok ? 'bg-success' : 'bg-warning'}">${ok ? 'OK' : '?'}</span></small></div></div>`;
        }).join('') + '</div>';
    }
}

// ---------- User Detail ----------
async function showUser(userId) {
    document.getElementById('modal-title').textContent = 'User: ' + userId.slice(0, 12) + '...';
    document.getElementById('modal-body').innerHTML = '<div class="text-center text-secondary py-4">Loading...</div>';
    adminModal.show();

    const u = await api.get(`/api/admin/users/${userId}`);
    if (!u) {
        document.getElementById('modal-body').innerHTML = '<div class="text-danger">User not found</div>';
        return;
    }

    const ipHistory = (u.ip_history || []).map(h =>
        `<tr><td><code>${h.ip_address}</code></td><td class="small">${h.first_seen || '-'}</td><td class="small">${h.last_seen || '-'}</td></tr>`
    ).join('');

    const perms = u.permissions || {};
    const permBages = Object.entries(perms).map(([p, v]) =>
        `<span class="badge ${v ? 'bg-success' : 'bg-secondary'} me-1">${esc(p.replace('can_', ''))}</span>`
    ).join('');

    document.getElementById('modal-body').innerHTML = `
        <div class="mb-3">
            <table class="table table-dark table-sm mb-0">
                <tr><th>Username</th><td>${esc(u.username)}</td></tr>
                <tr><th>Email</th><td>${esc(u.email || '-')}</td></tr>
                <tr><th>Last IP</th><td><code>${esc(u.last_ip || '-')}</code></td></tr>
                <tr><th>Role</th><td>${roleBadgeHtml(u.role)}</td></tr>
                <tr><th>Permissions</th><td>${permBages || '<span class="text-muted">none</span>'}</td></tr>
                <tr><th>Nation</th><td>${u.nation_id ? `${u.nation_name || u.nation_id} (${u.nation_id.slice(0, 8)}...)` : 'None'}</td></tr>
                <tr><th>Banned</th><td>${u.banned ? `<span class="badge bg-danger">Yes</span> ${esc(u.ban_reason)}` : 'No'}</td></tr>
                <tr><th>Created</th><td>${u.created_at || '-'}</td></tr>
            </table>
        </div>
        ${auth.user?.permissions?.can_manage_permissions ? `
            <div class="mb-3">
                <h6>Change Role</h6>
                <div class="input-group input-group-sm">
                    <select class="form-select" id="modal-role-select">
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="mod" ${u.role === 'mod' ? 'selected' : ''}>Mod</option>
                        <option value="helper" ${u.role === 'helper' ? 'selected' : ''}>Helper</option>
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                    </select>
                    <button class="btn btn-outline-light" onclick="modalSetRole('${userId}')">Apply</button>
                </div>
                <p id="modal-role-result" class="small mt-1"></p>
            </div>
        ` : ''}
        <h6>IP History (${(u.ip_history || []).length})</h6>
        <div style="max-height:200px;overflow-y:auto;">
            <table class="table table-dark table-sm small">
                <thead><tr><th>IP</th><th>First Seen</th><th>Last Seen</th></tr></thead>
                <tbody>${ipHistory || '<tr><td colspan="3" class="text-secondary">No history</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

async function modalSetRole(userId) {
    const role = document.getElementById('modal-role-select').value;
    const result = document.getElementById('modal-role-result');
    const resp = await api.post(`/api/admin/users/${userId}/set-role`, { role });
    result.textContent = resp ? `Role set to ${role}` : 'Failed';
    result.className = (resp ? 'text-success' : 'text-danger') + ' small mt-1';
    if (resp) { loadUsers(); loadPermissions(); }
}

// ---------- Actions ----------
async function banUser(userId) {
    const reason = prompt('Ban reason (optional):');
    if (reason === null) return;
    const resp = await api.post(`/api/admin/users/${userId}/ban`, { reason });
    if (resp) { alert('User banned'); loadUsers(); }
}

async function unbanUser(userId) {
    if (!confirm('Unban this user?')) return;
    const resp = await api.post(`/api/admin/users/${userId}/unban`);
    if (resp) { alert('User unbanned'); loadUsers(); }
}

async function deleteUser(userId) {
    if (!confirm('⚠️ Permanently delete this user and their nation? This cannot be undone.')) return;
    const resp = await api.del(`/api/admin/users/${userId}`);
    if (resp) { alert('User deleted'); loadUsers(); }
}

async function forceTick() {
    const btn = document.querySelector('[onclick="forceTick()"]');
    btn.disabled = true;
    btn.textContent = 'Tick running...';
    const resp = await api.post('/api/admin/tick');
    document.getElementById('action-result').innerHTML = resp
        ? '<div class="alert alert-success py-2 mb-0">Tick completed</div>'
        : '<div class="alert alert-danger py-2 mb-0">Tick failed</div>';
    btn.disabled = false;
    btn.textContent = '🔁 Force Tick';
}

async function resetGame() {
    if (!confirm('⚠️⚠️⚠️ This will DELETE ALL GAME DATA (nations, alliances, wars). Are you SURE?')) return;
    if (!confirm('Final confirmation. Type RESET to proceed.')) return;
    const resp = await api.post('/api/admin/reset', { confirm: 'RESET' });
    document.getElementById('action-result').innerHTML = resp
        ? '<div class="alert alert-warning py-2 mb-0">All game data reset</div>'
        : '<div class="alert alert-danger py-2 mb-0">Reset failed</div>';
}

async function lookupUser() {
    const id = document.getElementById('lookup-id').value.trim();
    if (!id) return;
    await showUser(id);
}

// ---------- Helpers ----------
function roleBadgeHtml(role) {
    if (!role || role === 'user') return '<span class="text-muted">user</span>';
    const colors = { admin: 'bg-danger', mod: 'bg-warning text-dark', helper: 'bg-info text-dark' };
    return `<span class="badge ${colors[role] || 'bg-secondary'}">${esc(role)}</span>`;
}

function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// Init
// (Initialization moved to top of file — DOMContentLoaded handler above)
