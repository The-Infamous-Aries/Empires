/**
 * World Map - Empires Game
 *
 * Geographic visualization of nations, territories, and their positions.
 */

const worldMap = {
    canvas: null,
    ctx: null,
    nations: [],
    myNationId: null,
    myAllianceId: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    selectedNation: null,
    hoveredNation: null,

    // Color scheme for nations
    nationColors: {
        myNation: '#4a90d9',
        ally: '#4caf50',
        enemy: '#f44336',
        neutral: '#9e9e9e',
        alliance: '#ff9800'
    },

    // World seed for consistent random positions
    worldSeed: 12345,

    /**
     * Initialize the world map
     */
    async init() {
        this.canvas = document.getElementById('world-map-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('world-map-container');

        await this.loadData();
        this.setupCanvas();
        this.setupEventListeners();
        this.generateWorld();
        this.render();

        // Set initial filter from URL or default
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('filter') === 'my-nation') {
            document.getElementById('map-filter').value = 'my-nation';
        }
    },

    /**
     * Load nation and alliance data
     */
    async loadData() {
        try {
            const [nationsData, nationData] = await Promise.all([
                api.get('/api/web/nations'),
                api.get('/api/web/user/nation')
            ]);

            this.nations = nationsData || [];

            if (nationData && nationData.nation) {
                this.myNationId = nationData.nation.nation_id;
                this.myAllianceId = nationData.nation.alliance_id;
            }

            // Update stats
            this.updateStats();
        } catch (err) {
            console.error('Failed to load map data:', err);
            this.nations = [];
        }
    },

    /**
     * Setup canvas dimensions
     */
    setupCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Set initial view to center
        this.panX = this.canvas.width / 2;
        this.panY = this.canvas.height / 2;
    },

    /**
     * Setup mouse event listeners
     */
    setupEventListeners() {
        // Pan with mouse drag
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;

            this.panX += dx;
            this.panY += dy;

            this.lastX = e.clientX;
            this.lastY = e.clientY;

            this.render();
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        // Click to select nation
        this.canvas.addEventListener('click', (e) => {
            if (this.isDragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.panX) / this.zoom;
            const y = (e.clientY - rect.top - this.panY) / this.zoom;

            const clickedNation = this.findNationAt(x, y);
            if (clickedNation) {
                this.selectNation(clickedNation);
            } else {
                this.clearSelection();
            }
        });

        // Hover effect
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.panX) / this.zoom;
            const y = (e.clientY - rect.top - this.panY) / this.zoom;

            const hovered = this.findNationAt(x, y);
            if (hovered !== this.hoveredNation) {
                this.hoveredNation = hovered;
                this.render();
                this.updateTooltip(e, hovered);
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredNation = null;
            this.render();
            this.hideTooltip();
        });

        // Filter change
        document.getElementById('map-filter').addEventListener('change', () => {
            this.render();
        });

        // Zoom change
        document.getElementById('map-zoom').addEventListener('change', () => {
            const zoomSelect = document.getElementById('map-zoom');
            this.setZoom(parseFloat(zoomSelect.value));
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });
    },

    /**
     * Generate world with territories
     */
    generateWorld() {
        this.worldSeed = 12345;

        // Generate territories for each nation
        this.nations.forEach((nation, index) => {
            // Use seeded random for consistent positions
            const seed = this.worldSeed + index;
            const x = this.seededRandom(seed) * 2000 - 1000;
            const y = this.seededRandom(seed * 2) * 1000 - 500;

            nation.position = { x, y };
            nation.size = 20 + Math.sqrt(nation.land || 100) * 2;
            nation.continent = this.getContinent(x, y);
        });
    },

    /**
     * Seeded random number generator
     */
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    },

    /**
     * Get continent based on position
     */
    getContinent(x, y) {
        if (y < -200) return 'Antarctica';
        if (x < -500 && y < 0) return 'Americas';
        if (x >= -500 && x < 500 && y < 0) return 'Europe';
        if (x >= 500 && y < 100) return 'Asia';
        if (y >= 100 && y < 350) return 'Africa';
        if (y >= 350) return 'Australia';
        return 'Ocean';
    },

    /**
     * Find nation at position
     */
    findNationAt(x, y) {
        for (const nation of this.nations) {
            const pos = nation.position;
            const size = nation.size * this.zoom;
            const dx = x - pos.x;
            const dy = y - pos.y;
            if (dx * dx + dy * dy < size * size) {
                return nation;
            }
        }
        return null;
    },

    /**
     * Get nation color based on relationship
     */
    getNationColor(nation) {
        if (nation.nation_id === this.myNationId) {
            return this.nationColors.myNation;
        }

        if (nation.at_war) {
            return this.nationColors.enemy;
        }

        if (this.myAllianceId && nation.alliance_id === this.myAllianceId) {
            return this.nationColors.ally;
        }

        if (nation.alliance_id) {
            return this.nationColors.alliance;
        }

        return this.nationColors.neutral;
    },

    /**
     * Check if nation should be visible
     */
    isNationVisible(nation) {
        const filter = document.getElementById('map-filter').value;

        if (filter === 'all') return true;
        if (filter === 'my-nation') return nation.nation_id === this.myNationId;
        if (filter === 'allies' && this.myAllianceId) {
            return nation.alliance_id === this.myAllianceId;
        }
        if (filter === 'enemies') {
            return nation.at_war || (this.myAllianceId && nation.alliance_id && nation.alliance_id !== this.myAllianceId);
        }

        return true;
    },

    /**
     * Render the map
     */
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw connection lines (trade routes, alliances)
        this.drawConnections();

        // Draw nations
        this.nations.forEach(nation => {
            if (this.isNationVisible(nation)) {
                this.drawNation(nation);
            }
        });
    },

    /**
     * Draw background grid
     */
    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 100 * this.zoom;
        const offsetX = this.panX % gridSize;
        const offsetY = this.panY % gridSize;

        ctx.strokeStyle = '#2a3544';
        ctx.lineWidth = 0.5;

        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    },

    /**
     * Draw connection lines between allied nations
     */
    drawConnections() {
        const ctx = this.ctx;

        // Draw alliances
        this.nations.forEach((nation, i) => {
            if (!nation.alliance_id || nation.alliance_id === this.myAllianceId) return;

            for (let j = i + 1; j < this.nations.length; j++) {
                const other = this.nations[j];
                if (nation.alliance_id === other.alliance_id) {
                    ctx.strokeStyle = 'rgba(255, 152, 0, 0.2)';
                    ctx.lineWidth = 2 * this.zoom;
                    ctx.beginPath();
                    ctx.moveTo(nation.position.x * this.zoom + this.panX, nation.position.y * this.zoom + this.panY);
                    ctx.lineTo(other.position.x * this.zoom + this.panX, other.position.y * this.zoom + this.panY);
                    ctx.stroke();
                }
            }
        });
    },

    /**
     * Draw a single nation
     */
    drawNation(nation) {
        const ctx = this.ctx;
        const pos = nation.position;
        const size = nation.size * this.zoom;
        const x = pos.x * this.zoom + this.panX;
        const y = pos.y * this.zoom + this.panY;

        // Skip if off screen
        if (x + size < 0 || x - size > this.canvas.width ||
            y + size < 0 || y - size > this.canvas.height) {
            return;
        }

        const color = this.getNationColor(nation);
        const isHovered = nation === this.hoveredNation;
        const isSelected = nation === this.selectedNation;

        // Draw glow effect for important nations
        if (nation.nation_id === this.myNationId || isSelected) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15 * this.zoom;
        }

        // Draw territory circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.shadowBlur = 0;

        // Draw border
        ctx.strokeStyle = isSelected ? '#fff' : (isHovered ? '#ffd700' : 'rgba(255,255,255,0.3)');
        ctx.lineWidth = isSelected || isHovered ? 3 : 1;
        ctx.stroke();

        // Draw score/size indicator
        if (this.zoom > 0.5) {
            const score = Math.min(nation.score / 100, 100);
            ctx.beginPath();
            ctx.arc(x, y, size + 4, -Math.PI / 2, -Math.PI / 2 + (score / 100) * Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw nation initial
        if (this.zoom > 0.3) {
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(8, size * 0.6)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(nation.nation_name.charAt(0), x, y);
        }

        // Draw war indicator
        if (nation.at_war) {
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.arc(x + size - 3, y - size + 3, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw alliance badge
        if (nation.alliance_id && this.zoom > 0.5) {
            ctx.fillStyle = '#ff9800';
            ctx.beginPath();
            ctx.arc(x - size + 3, y - size + 3, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    /**
     * Update tooltip with nation info
     */
    updateTooltip(e, nation) {
        const tooltip = document.getElementById('map-tooltip');
        if (!nation) {
            tooltip.classList.add('d-none');
            return;
        }

        tooltip.classList.remove('d-none');
        tooltip.innerHTML = `
            <div class="fw-bold">${esc(nation.nation_name)}</div>
            <div class="small text-secondary">${esc(nation.ruler_name)}</div>
            <div class="small">
                <span class="badge ${this.getNationColor(nation) === this.nationColors.enemy ? 'bg-danger' : 'bg-secondary'}">
                    ${nation.at_war ? '⚔️ At War' : '☮️ Peace'}
                </span>
                ${nation.alliance_name ? `<span class="badge bg-warning text-dark">${esc(nation.alliance_name)}</span>` : ''}
            </div>
            <div class="small mt-1">
                Land: ${fmtNum(nation.land)} | Pop: ${fmtNum(nation.population)} | Score: ${fmtNum(nation.score)}
            </div>
        `;

        const rect = this.container.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
        tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
    },

    /**
     * Hide tooltip
     */
    hideTooltip() {
        document.getElementById('map-tooltip').classList.add('d-none');
    },

    /**
     * Select a nation
     */
    selectNation(nation) {
        this.selectedNation = nation;

        const panel = document.getElementById('selected-nation-panel');
        panel.classList.remove('d-none');

        document.getElementById('selected-nation-name').textContent = nation.nation_name;

        const info = document.getElementById('selected-nation-info');
        const isMine = nation.nation_id === this.myNationId;
        const relation = nation.at_war ? 'enemy' : (this.myAllianceId === nation.alliance_id ? 'ally' : 'neutral');

        info.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="mb-2">
                        <strong>Ruler:</strong> ${esc(nation.ruler_name)}
                    </div>
                    <div class="mb-2">
                        <strong>Government:</strong> ${this.formatGovernment(nation.government_type)}
                    </div>
                    <div class="mb-2">
                        <strong>Resource:</strong> ${nation.resource_1}
                    </div>
                    <div class="mb-2">
                        <strong>Continent:</strong> ${nation.continent || 'Unknown'}
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-2">
                        <strong>Land:</strong> ${fmtNum(nation.land)} km²
                    </div>
                    <div class="mb-2">
                        <strong>Population:</strong> ${fmtNum(nation.population)}
                    </div>
                    <div class="mb-2">
                        <strong>Cities:</strong> ${nation.cities}
                    </div>
                    <div class="mb-2">
                        <strong>Score:</strong> ${fmtNum(nation.score)}
                    </div>
                </div>
                <div class="col-12">
                    ${nation.alliance_name ? `<div class="mb-2"><strong>Alliance:</strong> <a href="/alliance/${nation.alliance_id}">${esc(nation.alliance_name)}</a></div>` : ''}
                </div>
                <div class="col-12">
                    <div class="d-flex gap-2 flex-wrap">
                        ${isMine ? `
                            <a href="/nation/${nation.nation_id}" class="btn btn-primary">View Profile</a>
                            <a href="/cities" class="btn btn-outline-light">Manage Cities</a>
                        ` : `
                            <a href="/nation/${nation.nation_id}" class="btn btn-outline-light">View Profile</a>
                            ${relation === 'enemy' ? `
                                <a href="/diplomacy?war=${nation.nation_id}" class="btn btn-danger">Offer Peace</a>
                            ` : relation === 'neutral' ? `
                                <a href="/diplomacy?propose=${nation.nation_id}" class="btn btn-outline-success">Propose Treaty</a>
                                <a href="/wars?declare=${nation.nation_id}" class="btn btn-danger">Declare War</a>
                            ` : `
                                <a href="/diplomacy?alliance=${nation.alliance_id}" class="btn btn-outline-info">Alliance Diplomacy</a>
                            `}
                        `}
                    </div>
                </div>
            </div>
        `;

        this.render();
    },

    /**
     * Clear nation selection
     */
    clearSelection() {
        this.selectedNation = null;
        document.getElementById('selected-nation-panel').classList.add('d-none');
        this.render();
    },

    /**
     * Zoom in
     */
    zoomIn() {
        const zoomSelect = document.getElementById('map-zoom');
        const currentIndex = Array.from(zoomSelect.options).findIndex(o => parseFloat(o.value) === this.zoom);
        if (currentIndex > 0) {
            zoomSelect.selectedIndex = currentIndex - 1;
            this.setZoom(parseFloat(zoomSelect.options[zoomSelect.selectedIndex].value));
        }
    },

    /**
     * Zoom out
     */
    zoomOut() {
        const zoomSelect = document.getElementById('map-zoom');
        const currentIndex = Array.from(zoomSelect.options).findIndex(o => parseFloat(o.value) === this.zoom);
        if (currentIndex < zoomSelect.options.length - 1) {
            zoomSelect.selectedIndex = currentIndex + 1;
            this.setZoom(parseFloat(zoomSelect.options[zoomSelect.selectedIndex].value));
        }
    },

    /**
     * Set zoom level
     */
    setZoom(newZoom) {
        const centerX = (this.canvas.width / 2 - this.panX) / this.zoom;
        const centerY = (this.canvas.height / 2 - this.panY) / this.zoom;

        this.zoom = newZoom;

        this.panX = this.canvas.width / 2 - centerX * this.zoom;
        this.panY = this.canvas.height / 2 - centerY * this.zoom;

        this.render();
    },

    /**
     * Reset view
     */
    resetView() {
        this.zoom = 1;
        this.panX = this.canvas.width / 2;
        this.panY = this.canvas.height / 2;
        document.getElementById('map-zoom').value = '1';
        this.render();
    },

    /**
     * Pan to my nation
     */
    panToMyNation() {
        const myNation = this.nations.find(n => n.nation_id === this.myNationId);
        if (myNation) {
            this.panX = this.canvas.width / 2 - myNation.position.x * this.zoom;
            this.panY = this.canvas.height / 2 - myNation.position.y * this.zoom;
            this.render();
        }
    },

    /**
     * Update continent/nation stats
     */
    updateStats() {
        const totalLand = this.nations.reduce((sum, n) => sum + (n.land || 0), 0);
        const totalPop = this.nations.reduce((sum, n) => sum + (n.population || 0), 0);
        const totalCities = this.nations.reduce((sum, n) => sum + (n.cities || 0), 0);

        document.getElementById('nation-count').textContent = `${this.nations.length} nations`;
        document.getElementById('continent-nations').textContent = this.nations.length;
        document.getElementById('continent-land').textContent = fmtNum(totalLand);
        document.getElementById('continent-population').textContent = fmtNum(totalPop);
        document.getElementById('continent-cities').textContent = fmtNum(totalCities);
    },

    /**
     * Format government type
     */
    formatGovernment(gov) {
        return gov?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
    }
};

// Helper functions
function fmtNum(n) {
    if (!n && n !== 0) return '-';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Number(n).toLocaleString();
}

function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .map-tooltip {
        position: absolute;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 10px 14px;
        pointer-events: none;
        z-index: 100;
        box-shadow: var(--shadow-lg);
        min-width: 150px;
    }
    .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 4px;
    }
    #world-map-canvas {
        display: block;
    }
`;
document.head.appendChild(style);