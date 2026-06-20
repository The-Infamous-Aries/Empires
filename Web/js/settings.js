/**
 * Empires Game - Settings & Theme Manager
 *
 * Theme system, sidebar toggle, settings persistence.
 * Inspired by Cyber Nations, Politics & War, Nation States.
 */

const Settings = {
    defaults: {
        theme: 'dark',
        sidebarCollapsed: false,
        compactMode: false,
        fontSize: 'medium',
    },

    current: {},

    themes: [
        { id: 'dark',          name: 'Dark',            icon: '🌙',  primary: '#0b0e14', accent: '#fbbf24' },
        { id: 'light',         name: 'Light',           icon: '☀️',  primary: '#f1f5f9', accent: '#b45309' },
        { id: 'cyber-nations', name: 'Cyber Nations',   icon: '🏛️',  primary: '#ffffff', accent: '#b8860b' },
        { id: 'politics-war',  name: 'Politics & War',  icon: '⚔️',  primary: '#0a0e1a', accent: '#fbbf24' },
        { id: 'nation-states', name: 'NationStates',    icon: '🌐',  primary: '#f5f7fb', accent: '#2b4f8a' },
        { id: 'cyber-blue',    name: 'Cyber Blue',      icon: '💠',  primary: '#09162e', accent: '#4fc3f7' },
        { id: 'warfare-red',   name: 'Warfare Red',     icon: '⚔️',  primary: '#120808', accent: '#fbbf24' },
        { id: 'forest-green',  name: 'Forest Green',    icon: '🌲',  primary: '#0a140e', accent: '#4ade80' },
        { id: 'royal-purple',  name: 'Royal Purple',    icon: '👑',  primary: '#0e0a18', accent: '#c084fc' },
        { id: 'ocean-teal',    name: 'Ocean Teal',      icon: '🌊',  primary: '#0a1418', accent: '#2dd4bf' },
    ],

    init() {
        this.load();
        this.apply();
        this.renderThemePicker();
        this.bindEvents();
    },

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('empires_settings') || '{}');
            this.current = { ...this.defaults, ...saved };
        } catch {
            this.current = { ...this.defaults };
        }
    },

    save() {
        try {
            localStorage.setItem('empires_settings', JSON.stringify(this.current));
        } catch { /* ignore */ }
    },

    apply() {
        document.documentElement.setAttribute('data-theme', this.current.theme);

        if (this.current.sidebarCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }

        if (this.current.compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }

        const fontSize = this.current.fontSize || 'medium';
        const sizes = { small: '14px', medium: '16px', large: '18px' };
        document.documentElement.style.fontSize = sizes[fontSize] || '16px';

        this.updateToggleIcons();
    },

    set(key, value) {
        this.current[key] = value;
        this.save();
        this.apply();
    },

    toggle(key) {
        this.set(key, !this.current[key]);
    },

    updateToggleIcons() {
        document.querySelectorAll('[data-setting]').forEach(el => {
            const setting = el.dataset.setting;
            const isToggle = el.classList.contains('toggle-switch') || el.querySelector('.toggle-switch');
            if (isToggle) {
                const input = el.querySelector('input[type="checkbox"]');
                if (input) input.checked = !!this.current[setting];
            }
        });
    },

    renderThemePicker() {
        const container = document.getElementById('theme-picker');
        if (!container) return;

        container.innerHTML = this.themes.map(t => `
            <div class="theme-option ${this.current.theme === t.id ? 'active' : ''}"
                 data-theme-id="${t.id}"
                 onclick="Settings.setTheme('${t.id}')">
                <div class="theme-swatch" style="
                    background: linear-gradient(135deg, ${t.primary}, ${t.accent});
                "></div>
                <div class="theme-name">${t.icon} ${t.name}</div>
                <div class="theme-check">✓</div>
            </div>
        `).join('');
    },

    setTheme(themeId) {
        this.set('theme', themeId);
        document.querySelectorAll('.theme-option').forEach(el => {
            el.classList.toggle('active', el.dataset.themeId === themeId);
        });
    },

    toggleSidebar() {
        this.toggle('sidebarCollapsed');
    },

    openSettings() {
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
    },

    bindEvents() {
        // Sidebar toggle button
        document.querySelectorAll('[data-action="toggle-sidebar"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.innerWidth <= 768) {
                    document.querySelector('.sidebar')?.classList.toggle('open');
                    document.querySelector('.sidebar-backdrop')?.classList.toggle('show');
                } else {
                    this.toggleSidebar();
                }
            });
        });

        // Sidebar backdrop on mobile
        document.querySelectorAll('.sidebar-backdrop').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelector('.sidebar')?.classList.remove('open');
                el.classList.remove('show');
            });
        });

        // Settings checkboxes
        document.querySelectorAll('[data-setting] input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', () => {
                this.set(input.closest('[data-setting]').dataset.setting, input.checked);
            });
        });

        // Font size selector
        document.querySelectorAll('[name="font-size"]').forEach(input => {
            input.addEventListener('change', () => {
                if (input.checked) this.set('fontSize', input.value);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === '\\') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });
    },
};

document.addEventListener('DOMContentLoaded', () => Settings.init());
