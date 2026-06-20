/**
 * Empires Game - Authentication Handler
 *
 * Manages login/logout state in the web UI.
 */

const auth = {
    user: null,
    initialized: false,

    async init() {
        const data = await api.get('/api/auth/me');
        this.user = data?.authenticated ? data.user : null;
        this.initialized = true;
        this.render();
    },

    render() {
        const el = document.getElementById('auth-section');
        if (!el) return;

        if (!this.user) {
            el.innerHTML = '<a href="/login" class="btn btn-outline-light btn-sm">Sign In</a>';
        } else {
            const name = this.user.username || 'User';
            const avatar = this.user.avatar_url
                ? `<img src="${this.user.avatar_url}" alt="" style="width:22px;height:22px;border-radius:50%;object-fit:cover">`
                : `<span class="d-none d-md-inline">${name}</span>`;
            el.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-dark dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                        ${avatar}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><h6 class="dropdown-header">${name}</h6></li>
                        <li><a class="dropdown-item" href="/">Dashboard</a></li>
                        <li><a class="dropdown-item" href="/admin">Admin Panel</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="auth.logout()">Sign Out</a></li>
                    </ul>
                </div>
            `;
        }
    },

    async logout() {
        await api.post('/api/auth/logout');
        this.user = null;
        this.render();
        window.location.href = '/login';
    },
};

document.addEventListener('DOMContentLoaded', () => auth.init());
