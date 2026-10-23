/**
 * War Panel - Military Conflict Management Interface
 * Dominion Wars - Nation Building Strategy Game
 */

class WarPanel {
    constructor() {
        this.isVisible = false;
        this.currentTab = 'overview';
        this.selectedWar = null;
        
        this.initialize();
    }
    
    /**
     * Initialize the war panel
     */
    initialize() {
        console.log('Initializing War Panel...');
        this.bindEvents();
        console.log('War Panel initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('war_declared', (data) => this.handleWarDeclared(data));
        EventBus.on('war_joined', (data) => this.handleWarJoined(data));
        EventBus.on('war_attack_executed', (data) => this.handleAttackExecuted(data));
        EventBus.on('war_round_started', (data) => this.handleRoundStarted(data));
        EventBus.on('war_round_ended', (data) => this.handleRoundEnded(data));
        EventBus.on('war_ended', (data) => this.handleWarEnded(data));
        EventBus.on('missile_hit', (data) => this.handleMissileHit(data));
        EventBus.on('missile_intercepted', (data) => this.handleMissileIntercepted(data));
        EventBus.on('nuke_hit', (data) => this.handleNukeHit(data));
        EventBus.on('nuke_intercepted', (data) => this.handleNukeIntercepted(data));
        EventBus.on('spy_operation_executed', (data) => this.handleSpyOperation(data));
    }
    
    /**
     * Show the war panel
     */
    show() {
        if (this.isVisible) return;
        
        this.createPanelHTML();
        this.isVisible = true;
        
        // Refresh data
        this.refreshData();
    }
    
    /**
     * Hide the war panel
     */
    hide() {
        if (!this.isVisible) return;
        
        const panel = document.getElementById('war-panel');
        if (panel) {
            panel.remove();
        }
        
        this.isVisible = false;
    }
    
    /**
     * Create the war panel HTML structure
     */
    createPanelHTML() {
        const panelHTML = `
            <div id="war-panel" class="game-panel war-panel">
                <div class="panel-header">
                    <h2>⚔️ War & Military Operations</h2>
                    <div class="panel-controls">
                        <div class="energy-display">
                            <span class="energy-label">⚡ Energy:</span>
                            <span id="current-energy">${window.Player?.getCurrentEnergy() || 0}</span>
                            <span class="energy-max">/${window.Player?.getMaxEnergy() || 100}</span>
                        </div>
                        <button class="panel-close" onclick="WarPanel.hide()">✕</button>
                    </div>
                </div>
                
                <div class="panel-content">
                    <div class="war-tabs">
                        <button class="tab-btn active" data-tab="overview">📊 Overview</button>
                        <button class="tab-btn" data-tab="active-wars">⚔️ Active Wars</button>
                        <button class="tab-btn" data-tab="declare-war">🚨 Declare War</button>
                        <button class="tab-btn" data-tab="statistics">📈 Statistics</button>
                    </div>
                    
                    <div id="war-tab-overview" class="tab-content active">
                        <div class="war-overview">
                            <div class="war-stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon">⚔️</div>
                                    <div class="stat-info">
                                        <div class="stat-label">Active Wars</div>
                                        <div class="stat-value" id="active-wars-count">0</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">🎯</div>
                                    <div class="stat-info">
                                        <div class="stat-label">Available Slots</div>
                                        <div class="stat-value" id="war-slots-available">2</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">💥</div>
                                    <div class="stat-info">
                                        <div class="stat-label">Total Attacks</div>
                                        <div class="stat-value" id="total-attacks">0</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">🏆</div>
                                    <div class="stat-info">
                                        <div class="stat-label">Wars Won</div>
                                        <div class="stat-value" id="wars-won">${window.Nation?.statistics?.warsWon || 0}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="military-readiness">
                                <h3>🎖️ Military Readiness</h3>
                                <div class="readiness-bars">
                                    <div class="readiness-item">
                                        <span class="readiness-label">Military Strength:</span>
                                        <div class="readiness-bar">
                                            <div class="readiness-fill" id="military-strength-fill" style="width: 0%"></div>
                                            <span class="readiness-value" id="military-strength-value">0</span>
                                        </div>
                                    </div>
                                    <div class="readiness-item">
                                        <span class="readiness-label">Military Morale:</span>
                                        <div class="readiness-bar">
                                            <div class="readiness-fill" id="military-morale-fill" style="width: 0%"></div>
                                            <span class="readiness-value" id="military-morale-value">100%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="war-tab-active-wars" class="tab-content">
                        <div class="active-wars-list" id="active-wars-list">
                            <div class="no-wars-message">
                                <p>🕊️ No active wars. Your nation is at peace.</p>
                                <p>Use the "Declare War" tab to start a conflict or join an existing war.</p>
                            </div>
                        </div>
                        
                        <!-- War Actions Panel (shown when in active wars) -->
                        <div id="war-actions-panel" class="war-actions-panel" style="display: none;">
                            <h3>⚡ War Operations</h3>
                            
                            <div class="actions-grid">
                                <!-- Standard Attack -->
                                <div class="action-card">
                                    <h4>⚔️ Attack</h4>
                                    <p>Standard military assault using all available units</p>
                                    <div class="action-cost">Cost: 10 Energy</div>
                                    <button id="attack-btn" class="action-btn">Launch Attack</button>
                                </div>
                                
                                <!-- Missile Strike -->
                                <div class="action-card">
                                    <h4>💣 Missile Strike</h4>
                                    <p>Launch ballistic missiles to destroy infrastructure</p>
                                    <div class="action-cost">
                                        Cost: 25 Intuition, 1 💣 Missile<br>
                                        <span id="missile-count">Available: 0</span>
                                    </div>
                                    <button id="missile-btn" class="action-btn">💣 Launch Missile</button>
                                </div>
                                
                                <!-- Nuclear Strike -->
                                <div class="action-card nuclear">
                                    <h4>☢️ Nuclear Strike</h4>
                                    <p>Devastating nuclear attack causing massive damage and casualties</p>
                                    <div class="action-cost">
                                        Cost: 50 Intuition, 1 ☢️ Nuke<br>
                                        <span id="nuke-count">Available: 0</span>
                                    </div>
                                    <button id="nuke-btn" class="action-btn nuclear-btn">☢️ Launch Nuke</button>
                                </div>
                                
                                <!-- Spy Operations -->
                                <div class="action-card">
                                    <h4>🕵️ Spy Operations</h4>
                                    <p>Covert operations against enemy nations</p>
                                    <div class="action-cost">
                                        Cost: Varies by operation<br>
                                        <span id="spy-count">🕵️ Available Spies: 0</span>
                                    </div>
                                    <button id="spy-ops-btn" class="action-btn">🕵️ Spy Operations</button>
                                </div>
                            </div>
                            
                            <!-- Intuition Display -->
                            <div class="intuition-display">
                                <span class="intuition-label">🧠 Intuition:</span>
                                <span id="current-intuition">${window.Player?.getCurrentIntuition() || 0}</span>
                                <span class="intuition-max">/${window.Player?.getMaxIntuition() || 100}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div id="war-tab-declare-war" class="tab-content">
                        <div class="declare-war-section">
                            <h3>🚨 War Declaration</h3>
                            <div class="war-form">
                                <div class="form-group">
                                    <label for="target-nation-id">Target Nation</label>
                                    <input type="text" id="target-nation-id" placeholder="Enter nation ID or name" />
                                </div>
                                <div class="form-group">
                                    <label for="war-reason">War Reason</label>
                                    <select id="war-reason">
                                        <option value="Territorial Dispute">Territorial Dispute</option>
                                        <option value="Resource Conflict">Resource Conflict</option>
                                        <option value="Alliance Obligation">Alliance Obligation</option>
                                        <option value="Border Incident">Border Incident</option>
                                        <option value="Trade War">Trade War</option>
                                        <option value="Expansion War">Expansion War</option>
                                        <option value="Revenge">Revenge</option>
                                        <option value="Preemptive Strike">Preemptive Strike</option>
                                    </select>
                                </div>
                                <div class="war-cost-info">
                                    <h4>War Declaration Requirements:</h4>
                                    <ul>
                                        <li>✅ Available offensive war slot (2 base, +1 per Command Center)</li>
                                        <li>🛡️ Target must have available defensive slot</li>
                                        <li>⚡ 10 Energy per attack during war</li>
                                        <li>🧠 25 Intuition per missile, 50 per nuke</li>
                                        <li>🕵️ Spies required for covert operations (10-40 Intuition per op)</li>
                                        <li>🕐 15 minute preparation period after declaration</li>
                                        <li>⏱️ 3 rounds of 4 hours each</li>
                                        <li>🚫 No limit on nations per side</li>
                                    </ul>
                                </div>
                                <button id="declare-war-btn" class="war-btn declare-btn">🚨 Declare War</button>
                            </div>
                        </div>
                        
                        <div class="join-war-section">
                            <h3>🤝 Join Existing Wars</h3>
                            <div id="joinable-wars-list" class="joinable-wars">
                                <p>Loading available wars...</p>
                            </div>
                        </div>
                    </div>
                    
                    <div id="war-tab-statistics" class="tab-content">
                        <div class="war-statistics">
                            <h3>📈 Combat Statistics</h3>
                            <div class="stats-grid">
                                <div class="stat-group">
                                    <h4>Combat Skills</h4>
                                    <div class="skill-list" id="combat-skills-list"></div>
                                </div>
                                <div class="stat-group">
                                    <h4>War History</h4>
                                    <div class="history-stats" id="war-history-stats"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to modal container
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = panelHTML;
        
        // Bind tab switching
        this.bindTabSwitching();
        
        // Bind form events
        this.bindFormEvents();
    }
    /**
     * Bind tab switching functionality
     */
    bindTabSwitching() {
        const tabBtns = document.querySelectorAll('.war-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }
    
    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update active tab button
        const tabBtns = document.querySelectorAll('.war-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update active tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `war-tab-${tabName}`);
        });
        
        this.currentTab = tabName;
        this.refreshTabContent(tabName);
    }
    
    /**
     * Bind form events
     */
    bindFormEvents() {
        // Declare war button
        const declareWarBtn = document.getElementById('declare-war-btn');
        if (declareWarBtn) {
            declareWarBtn.addEventListener('click', () => this.handleDeclareWar());
        }
    }
    
    /**
     * Handle war declaration
     */
    handleDeclareWar() {
        const targetNationId = document.getElementById('target-nation-id').value.trim();
        const warReason = document.getElementById('war-reason').value;
        
        if (!targetNationId) {
            this.showNotification('Please enter a target nation ID', 'error');
            return;
        }
        
        if (!window.WarSystem) {
            this.showNotification('War system not available', 'error');
            return;
        }
        
        try {
            const warId = window.WarSystem.declareWar({
                attackerNationId: window.Nation?.id || 'player-nation',
                defenderNationId: targetNationId,
                reason: warReason
            });
            
            this.showNotification(`War declared! War ID: ${warId}`, 'success');
            this.switchTab('active-wars');
            this.refreshData();
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Refresh panel data
     */
    refreshData() {
        this.updateEnergyDisplay();
        this.updateWarOverview();
        this.refreshTabContent(this.currentTab);
    }
    
    /**
     * Update energy display
     */
    updateEnergyDisplay() {
        const currentEnergyEl = document.getElementById('current-energy');
        const maxEnergyEl = document.querySelector('.energy-max');
        
        if (currentEnergyEl && window.Player) {
            currentEnergyEl.textContent = window.Player.getCurrentEnergy();
        }
        
        if (maxEnergyEl && window.Player) {
            maxEnergyEl.textContent = `/${window.Player.getMaxEnergy()}`;
        }
    }
    
    /**
     * Update war overview statistics
     */
    updateWarOverview() {
        if (!window.WarSystem) return;
        
        const activeWars = window.WarSystem.getActiveWars();
        const playerWars = activeWars.filter(war => 
            war.sides.attacker.nations.includes(window.Nation?.id) ||
            war.sides.defender.nations.includes(window.Nation?.id)
        );
        
        // Update active wars count
        const activeWarsCountEl = document.getElementById('active-wars-count');
        if (activeWarsCountEl) {
            activeWarsCountEl.textContent = playerWars.length;
        }
        
        // Update war slots available
        const warSlotsEl = document.getElementById('war-slots-available');
        if (warSlotsEl && window.Nation) {
            const offensiveSlots = window.Nation.projectEffects?.offensiveWarSlots || 2;
            const defensiveSlots = window.Nation.projectEffects?.defensiveWarSlots || 2;
            
            let offensiveUsed = 0;
            let defensiveUsed = 0;
            
            playerWars.forEach(war => {
                if (war.sides.attacker.nations.includes(window.Nation.id)) {
                    offensiveUsed++;
                } else if (war.sides.defender.nations.includes(window.Nation.id)) {
                    defensiveUsed++;
                }
            });
            
            warSlotsEl.innerHTML = `
                <div>Offensive: ${offensiveUsed}/${offensiveSlots}</div>
                <div>Defensive: ${defensiveUsed}/${defensiveSlots}</div>
            `;
        }
        
        // Update military strength
        this.updateMilitaryReadiness();
    }
    
    /**
     * Update military readiness indicators
     */
    updateMilitaryReadiness() {
        if (!window.Nation) return;
        
        // Military strength
        const militaryStrength = window.Nation.militaryStrength || 0;
        const strengthFillEl = document.getElementById('military-strength-fill');
        const strengthValueEl = document.getElementById('military-strength-value');
        
        if (strengthFillEl && strengthValueEl) {
            const maxDisplay = 10000; // Adjust based on game balance
            const percentage = Math.min(100, (militaryStrength / maxDisplay) * 100);
            strengthFillEl.style.width = `${percentage}%`;
            strengthValueEl.textContent = this.formatNumber(militaryStrength);
        }
        
        // Military morale
        const militaryMorale = window.Nation.nationStats?.militaryMorale || 1.0;
        const moraleFillEl = document.getElementById('military-morale-fill');
        const moraleValueEl = document.getElementById('military-morale-value');
        
        if (moraleFillEl && moraleValueEl) {
            const percentage = militaryMorale * 100;
            moraleFillEl.style.width = `${percentage}%`;
            moraleValueEl.textContent = `${Math.round(percentage)}%`;
        }
    }
    /**
     * Refresh tab content based on current tab
     */
    refreshTabContent(tabName) {
        switch (tabName) {
            case 'overview':
                this.updateWarOverview();
                break;
            case 'active-wars':
                this.updateActiveWarsList();
                break;
            case 'declare-war':
                this.updateJoinableWarsList();
                break;
            case 'statistics':
                this.updateStatistics();
                break;
        }
    }
    
    /**
     * Update active wars list
     */
    updateActiveWarsList() {
        const container = document.getElementById('active-wars-list');
        if (!container || !window.WarSystem) return;
        
        const activeWars = window.WarSystem.getActiveWars();
        const playerWars = activeWars.filter(war => 
            war.sides.attacker.nations.includes(window.Nation?.id) ||
            war.sides.defender.nations.includes(window.Nation?.id)
        );
        
        if (playerWars.length === 0) {
            container.innerHTML = `
                <div class="no-wars-message">
                    <p>🕊️ No active wars. Your nation is at peace.</p>
                    <p>Use the "Declare War" tab to start a conflict or join an existing war.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = playerWars.map(war => this.renderWarCard(war)).join('');
        
        // Show war actions panel if in active wars
        const actionsPanel = document.getElementById('war-actions-panel');
        if (actionsPanel) {
            if (playerWars.length > 0) {
                actionsPanel.style.display = 'block';
                this.updateWarActionsPanel(playerWars[0]); // Use first active war for actions
            } else {
                actionsPanel.style.display = 'none';
            }
        }
        
        // Bind attack buttons
        this.bindAttackButtons();
        
        // Bind war action buttons (missile, nuke, spy ops)
        this.bindWarActionButtons();
    }
    
    /**
     * Render individual war card with damage rankings
     */
    renderWarCard(war) {
        const isPlayerAttacker = war.sides.attacker.nations.includes(window.Nation?.id);
        const playerSide = isPlayerAttacker ? 'attacker' : 'defender';
        const enemySide = isPlayerAttacker ? 'defender' : 'attacker';
        
        const currentRound = war.rounds[war.currentRound - 1];
        const playerEnergy = window.Player?.getCurrentEnergy() || 0;
        const canAttack = war.status === 'active' && playerEnergy >= 10;
        
        // Get damage rankings
        const attackerRankings = this.formatDamageRankings(war.sides.attacker);
        const defenderRankings = this.formatDamageRankings(war.sides.defender);
        
        // Get treaty obligations
        const treatyObligations = window.WarSystem?.getTreatyObligationsStatus(war.id) || [];
        
        return `
            <div class="war-card" data-war-id="${war.id}">
                <div class="war-card-header">
                    <div class="war-title">
                        <h4>${war.reason}</h4>
                        <span class="war-status war-status-${war.status}">${this.capitalizeFirst(war.status)}</span>
                    </div>
                    <div class="war-time">
                        ${this.formatWarTime(war)}
                    </div>
                </div>
                
                <div class="war-sides">
                    <div class="war-side war-side-attacker ${isPlayerAttacker ? 'player-side' : ''}">
                        <div class="side-header">
                            <span class="side-label">⚔️ Attackers (${war.originalAttacker === window.Nation?.id ? 'Your War' : 'Joined'})</span>
                            <span class="rounds-won">${war.sides.attacker.roundsWon} rounds won</span>
                        </div>
                        <div class="side-nations">
                            ${war.sides.attacker.nations.map(nationId => 
                                this.renderNationTag(nationId, nationId === window.Nation?.id)
                            ).join('')}
                        </div>
                        ${currentRound ? `<div class="side-damage">💥 ${this.formatNumber(currentRound.damage.attacker)} damage dealt</div>` : ''}
                        
                        <div class="damage-rankings">
                            <h5>🏆 Top Damage Dealers</h5>
                            ${attackerRankings.nations}
                            ${attackerRankings.alliances}
                        </div>
                    </div>
                    
                    <div class="war-vs">VS</div>
                    
                    <div class="war-side war-side-defender ${!isPlayerAttacker ? 'player-side' : ''}">
                        <div class="side-header">
                            <span class="side-label">🛡️ Defenders (${war.originalDefender === window.Nation?.id ? 'Your War' : 'Joined'})</span>
                            <span class="rounds-won">${war.sides.defender.roundsWon} rounds won</span>
                        </div>
                        <div class="side-nations">
                            ${war.sides.defender.nations.map(nationId => 
                                this.renderNationTag(nationId, nationId === window.Nation?.id)
                            ).join('')}
                        </div>
                        ${currentRound ? `<div class="side-damage">💥 ${this.formatNumber(currentRound.damage.defender)} damage dealt</div>` : ''}
                        
                        <div class="damage-rankings">
                            <h5>🏆 Top Damage Dealers</h5>
                            ${defenderRankings.nations}
                            ${defenderRankings.alliances}
                        </div>
                    </div>
                </div>
                
                ${treatyObligations.length > 0 ? `
                    <div class="treaty-obligations">
                        <h5>📜 Treaty Obligations</h5>
                        ${treatyObligations.map(obligation => `
                            <div class="obligation-item ${obligation.fulfilled ? 'fulfilled' : 'pending'}">
                                <span class="obligation-alliance">${obligation.allianceName}</span>
                                <span class="obligation-type">${obligation.treatyType}</span>
                                <span class="obligation-progress">
                                    ${obligation.participatingMembers}/${obligation.totalMembers} 
                                    (${Math.round(obligation.currentParticipation)}%/${obligation.requiredParticipation}%)
                                </span>
                                <span class="obligation-status">
                                    ${obligation.fulfilled ? '✅ Fulfilled' : '⏳ Pending'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${war.status === 'active' ? `
                    <div class="war-actions">
                        <button class="attack-btn" 
                                data-war-id="${war.id}" 
                                data-target-side="${enemySide}"
                                ${canAttack ? '' : 'disabled'}>
                            ⚡ Attack (10 Energy)
                        </button>
                        <div class="round-info">
                            Round ${war.currentRound}/3 - ${currentRound ? this.formatTimeRemaining(currentRound.endTime) : 'Starting soon...'}
                        </div>
                    </div>
                ` : ''}
                
                ${war.status === 'ended' ? `
                    <div class="war-result">
                        <div class="war-winner">
                            ${war.winner === playerSide ? '🏆 Victory!' : 
                              war.winner === enemySide ? '💀 Defeat — 🩸 Heavy casualties suffered' : 
                              '🤝 Draw'}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render nation tag
     */
    renderNationTag(nationId, isPlayer) {
        return `
            <span class="nation-tag ${isPlayer ? 'player-nation' : ''}">
                ${isPlayer ? '👑 ' : ''}${nationId}
            </span>
        `;
    }
    
    /**
     * Bind attack button events
     */
    bindAttackButtons() {
        const attackBtns = document.querySelectorAll('.attack-btn');
        attackBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const warId = btn.dataset.warId;
                const targetSide = btn.dataset.targetSide;
                this.executeAttack(warId, targetSide);
            });
        });
    }
    
    /**
     * Execute attack in war
     */
    executeAttack(warId, targetSide) {
        if (!window.WarSystem) {
            this.showNotification('War system not available', 'error');
            return;
        }
        
        try {
            const result = window.WarSystem.executeAttack({
                warId: warId,
                attackerNationId: window.Nation?.id,
                targetSide: targetSide
            });
            
            let message = `⚔️ Attack dealt ${this.formatNumber(result.damage)} damage!`;
            if (result.isCritical) {
                message += ' 🎯 CRITICAL HIT!';
            }
            if (result.defenseDamage > 0) {
                message += ` 🩸 Received ${this.formatNumber(result.defenseDamage)} counter-damage (casualties).`;
            }
            
            this.showNotification(message, 'success');
            this.refreshData();
            this.updateEnergyDisplay(); // Update Energy display after use
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Bind war action buttons (missiles, nukes, spy ops)
     */
    bindWarActionButtons() {
        // Missile button
        const missileBtn = document.getElementById('missile-btn');
        if (missileBtn) {
            missileBtn.addEventListener('click', () => this.launchMissile());
        }
        
        // Nuke button
        const nukeBtn = document.getElementById('nuke-btn');
        if (nukeBtn) {
            nukeBtn.addEventListener('click', () => this.launchNuke());
        }
        
        // Spy operations button
        const spyOpsBtn = document.getElementById('spy-ops-btn');
        if (spyOpsBtn) {
            spyOpsBtn.addEventListener('click', () => this.showSpyOperationsModal());
        }
        
        // Standard attack button in actions panel
        const attackBtn = document.getElementById('attack-btn');
        if (attackBtn) {
            attackBtn.addEventListener('click', () => this.launchAttackFromPanel());
        }
    }
    
    /**
     * Update war actions panel with current war data
     */
    updateWarActionsPanel(war) {
        if (!window.Nation || !war) return;
        
        // Update missile count
        const missileCountEl = document.getElementById('missile-count');
        if (missileCountEl) {
            const missiles = window.Nation.militaryUnits?.missiles || 0;
            missileCountEl.textContent = `💣 Available: ${missiles}`;
        }
        
        // Update nuke count
        const nukeCountEl = document.getElementById('nuke-count');
        if (nukeCountEl) {
            const nukes = window.Nation.militaryUnits?.nukes || 0;
            nukeCountEl.textContent = `☢️ Available: ${nukes}`;
        }
        
        // Update spy count
        const spyCountEl = document.getElementById('spy-count');
        if (spyCountEl) {
            const spies = window.Nation.militaryUnits?.spies || 0;
            spyCountEl.textContent = `🕵️ Available Spies: ${spies}`;
        }
        
        // Update energy display
        const energyEl = document.getElementById('current-energy');
        if (energyEl && window.Player) {
            energyEl.textContent = window.Player.getCurrentEnergy();
        }
        
        // Update intuition display
        const intuitionEl = document.getElementById('current-intuition');
        const intuitionMaxEl = document.querySelector('.intuition-max');
        if (intuitionEl && window.Player) {
            intuitionEl.textContent = window.Player.getCurrentIntuition();
            if (intuitionMaxEl) {
                intuitionMaxEl.textContent = `/${window.Player.getMaxIntuition()}`;
            }
        }
        
        // Store current war for actions
        this.currentWar = war;
    }
    
    /**
     * Launch missile strike
     */
    launchMissile() {
        if (!this.currentWar || !window.WarSystem) {
            this.showNotification('No active war selected', 'error');
            return;
        }
        
        const enemySide = this.getEnemySide(this.currentWar);
        
        try {
            const result = window.WarSystem.launchMissile({
                warId: this.currentWar.id,
                attackerNationId: window.Nation?.id,
                targetSide: enemySide
            });
            
            if (result.intercepted) {
                this.throwBrick('missile');
                this.showNotification('🧱 Missile intercepted by enemy defenses! Happiness penalty applied.', 'warning');
            } else {
                this.showNotification(`💣 Missile strike successful! ${this.formatNumber(result.damage)} infrastructure damage dealt! 🩸 Casualties reported.`, 'success');
            }
            
            this.refreshData();
            this.updateIntuitionDisplay(); // Update Intuition display after use
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Launch nuclear strike
     */
    launchNuke() {
        if (!this.currentWar || !window.WarSystem) {
            this.showNotification('No active war selected', 'error');
            return;
        }
        
        // Confirmation dialog for nukes
        if (!confirm('Are you sure you want to launch a nuclear weapon? This will cause massive damage and international consequences.')) {
            return;
        }
        
        const enemySide = this.getEnemySide(this.currentWar);
        
        try {
            const result = window.WarSystem.launchNuke({
                warId: this.currentWar.id,
                attackerNationId: window.Nation?.id,
                targetSide: enemySide
            });
            
            if (result.intercepted) {
                this.throwBrick('nuke');
                this.showNotification('🧱 Nuclear missile intercepted! Major happiness penalty applied.', 'warning');
            } else {
                this.showNotification(`Nuclear strike successful! Devastating damage: ${this.formatNumber(result.damage)} infrastructure destroyed!`, 'success');
            }
            
            this.refreshData();
            this.updateIntuitionDisplay(); // Update Intuition display after use
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Show spy operations modal
     */
    showSpyOperationsModal() {
        if (!this.currentWar) {
            this.showNotification('No active war selected', 'error');
            return;
        }
        
        const enemySide = this.getEnemySide(this.currentWar);
        const enemyNations = this.currentWar.sides[enemySide].nations;
        
        const modalHTML = `
            <div id="spy-operations-modal" class="spy-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🕵️ Spy Operations</h3>
                        <button class="close-modal" onclick="this.closest('.spy-modal').remove()">✕</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="target-selection">
                            <label for="spy-target">Target Nation:</label>
                            <select id="spy-target">
                                ${enemyNations.map(nationId => `
                                    <option value="${nationId}">Nation ${nationId}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="operation-selection">
                            <h4>Select Operation:</h4>
                            <div class="operation-grid">
                                ${this.renderSpyOperations()}
                            </div>
                        </div>
                        
                        <div class="spy-stats">
                            <p><strong>🕵️ Available Spies:</strong> ${window.Nation?.militaryUnits?.spies || 0}</p>
                            <p><strong>🧠 Current Intuition:</strong> ${window.Player?.getCurrentIntuition() || 0}/${window.Player?.getMaxIntuition() || 100}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.getElementById('modal-container');
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        
        // Bind operation buttons
        this.bindSpyOperationButtons();
    }
    
    /**
     * Render spy operations grid
     */
    renderSpyOperations() {
        const operations = [
            { id: 'gatherIntel',       name: '📊 Gather Intel',              cost: 10, desc: 'Collect enemy military and economic data' },
            { id: 'disruptHappiness',  name: '😤 Disrupt Happiness',         cost: 15, desc: 'Lower enemy morale and happiness' },
            { id: 'targetInfra',       name: '🏗️ Sabotage Infrastructure',   cost: 20, desc: 'Destroy enemy infrastructure' },
            { id: 'targetTech',        name: '🔬 Disrupt Technology',         cost: 25, desc: 'Set back enemy technological progress' },
            { id: 'targetSoldiers',    name: '🪖 Target Soldiers',            cost: 15, desc: 'Eliminate enemy ground forces — causes casualties' },
            { id: 'targetTanks',       name: '🛡️ Target Tanks',              cost: 18, desc: 'Sabotage enemy armored units' },
            { id: 'targetAircraft',    name: '✈️ Target Aircraft',           cost: 20, desc: 'Destroy enemy air force' },
            { id: 'targetShips',       name: '🚢 Target Ships',              cost: 22, desc: 'Sink enemy naval vessels — causes casualties' },
            { id: 'targetMissiles',    name: '💣 Target Missiles',           cost: 30, desc: 'Destroy enemy missile stockpile' },
            { id: 'targetNukes',       name: '☢️ Target Nukes',              cost: 35, desc: 'Sabotage enemy nuclear weapons' },
            { id: 'assassinateSpies',  name: '🕵️ Eliminate Spies',          cost: 40, desc: 'Assassinate enemy intelligence agents — causes casualties' }
        ];
        
        return operations.map(op => `
            <div class="operation-card" data-operation="${op.id}">
                <h5>${op.name}</h5>
                <p>${op.desc}</p>
                <div class="operation-cost">Cost: ${op.cost} Intuition</div>
                <button class="operation-btn" data-operation="${op.id}" data-cost="${op.cost}">Execute</button>
            </div>
        `).join('');
    }
    
    /**
     * Bind spy operation buttons
     */
    bindSpyOperationButtons() {
        const operationBtns = document.querySelectorAll('.operation-btn');
        operationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const operation = btn.dataset.operation;
                const cost = parseInt(btn.dataset.cost);
                const targetNationId = document.getElementById('spy-target').value;
                
                this.executeSpyOperation(operation, targetNationId, cost);
            });
        });
    }
    
    /**
     * Execute spy operation
     */
    executeSpyOperation(operation, targetNationId, cost) {
        if (!this.currentWar || !window.WarSystem) {
            this.showNotification('No active war selected', 'error');
            return;
        }
        
        try {
            const result = window.WarSystem.launchSpyOperation({
                warId: this.currentWar.id,
                attackerNationId: window.Nation?.id,
                targetNationId: targetNationId,
                operation: operation
            });
            
            if (result.success) {
                this.showNotification(`Spy operation successful: ${result.message}`, 'success');
                
                // Show detailed results for intel gathering
                if (operation === 'gatherIntel' && result.data) {
                    this.showIntelResults(result.data);
                }
            } else {
                this.showNotification(`Spy operation failed: ${result.message}`, 'warning');
            }
            
            // Close modal
            const modal = document.getElementById('spy-operations-modal');
            if (modal) modal.remove();
            
            this.refreshData();
            this.updateIntuitionDisplay(); // Update Intuition display after use
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Show intelligence gathering results
     */
    showIntelResults(data) {
        const resultsHTML = `
            <div class="intel-results-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📊 Intelligence Report</h3>
                        <button class="close-modal" onclick="this.closest('.intel-results-modal').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="intel-grid">
                            <div class="intel-stat">
                                <strong>Population:</strong> ${this.formatNumber(data.population)}
                            </div>
                            <div class="intel-stat">
                                <strong>Happiness:</strong> ${data.happiness}%
                            </div>
                            <div class="intel-stat">
                                <strong>Infrastructure:</strong> ${data.infra}
                            </div>
                            <div class="intel-stat">
                                <strong>Technology:</strong> ${data.tech}
                            </div>
                            <div class="intel-military">
                                <h4>⚔️ Military Forces:</h4>
                                <ul>
                                    <li>🪖 Soldiers: ${this.formatNumber(data.militaryUnits.soldiers || 0)}</li>
                                    <li>🛡️ Tanks: ${this.formatNumber(data.militaryUnits.tanks || 0)}</li>
                                    <li>✈️ Aircraft: ${this.formatNumber(data.militaryUnits.aircraft || 0)}</li>
                                    <li>🚢 Ships: ${this.formatNumber(data.militaryUnits.ships || 0)}</li>
                                    <li>🕵️ Spies: ${this.formatNumber(data.militaryUnits.spies || 0)}</li>
                                    <li>💣 Missiles: ${this.formatNumber(data.militaryUnits.missiles || 0)}</li>
                                    <li>☢️ Nukes: ${this.formatNumber(data.militaryUnits.nukes || 0)}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.getElementById('modal-container');
        modalContainer.insertAdjacentHTML('beforeend', resultsHTML);
    }
    
    /**
     * Launch attack from actions panel
     */
    launchAttackFromPanel() {
        if (!this.currentWar) {
            this.showNotification('No active war selected', 'error');
            return;
        }
        
        const enemySide = this.getEnemySide(this.currentWar);
        this.executeAttack(this.currentWar.id, enemySide);
    }
    
    /**
     * Get the enemy side for current player
     */
    getEnemySide(war) {
        const isPlayerAttacker = war.sides.attacker.nations.includes(window.Nation?.id);
        return isPlayerAttacker ? 'defender' : 'attacker';
    }
    
    /**
     * Update joinable wars list
     */
    updateJoinableWarsList() {
        const container = document.getElementById('joinable-wars-list');
        if (!container || !window.WarSystem) return;
        
        const activeWars = window.WarSystem.getActiveWars();
        const joinableWars = activeWars.filter(war => 
            war.status === 'preparing' || war.status === 'active'
        ).filter(war => 
            !war.sides.attacker.nations.includes(window.Nation?.id) &&
            !war.sides.defender.nations.includes(window.Nation?.id)
        );
        
        if (joinableWars.length === 0) {
            container.innerHTML = `
                <div class="no-joinable-wars">
                    <p>No wars available to join at this time.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = joinableWars.map(war => `
            <div class="joinable-war-item">
                <div class="war-info">
                    <strong>${war.reason}</strong>
                    <span class="war-participants">
                        ${war.sides.attacker.nations.length} vs ${war.sides.defender.nations.length}
                    </span>
                </div>
                <div class="join-actions">
                    <button class="join-war-btn" data-war-id="${war.id}" data-side="attacker">
                        Join Attackers
                    </button>
                    <button class="join-war-btn" data-war-id="${war.id}" data-side="defender">
                        Join Defenders
                    </button>
                </div>
            </div>
        `).join('');
        
        // Bind join buttons
        this.bindJoinButtons();
    }
    
    /**
     * Bind join war buttons
     */
    bindJoinButtons() {
        const joinBtns = document.querySelectorAll('.join-war-btn');
        joinBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const warId = btn.dataset.warId;
                const side = btn.dataset.side;
                this.joinWar(warId, side);
            });
        });
    }
    
    /**
     * Join a war
     */
    joinWar(warId, side) {
        if (!window.WarSystem) {
            this.showNotification('War system not available', 'error');
            return;
        }
        
        try {
            window.WarSystem.joinWar({
                warId: warId,
                nationId: window.Nation?.id,
                side: side
            });
            
            this.showNotification(`Successfully joined the war as ${side}!`, 'success');
            this.switchTab('active-wars');
            this.refreshData();
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Update statistics tab
     */
    updateStatistics() {
        this.updateCombatSkills();
        this.updateWarHistory();
    }
    
    /**
     * Update combat skills display
     */
    updateCombatSkills() {
        const container = document.getElementById('combat-skills-list');
        if (!container || !window.Player) return;
        
        const combatSkills = [
            'attack', 'defense', 'aim', 'luck', 'criticalChance', 
            'criticalDamage', 'block', 'parry'
        ];
        
        container.innerHTML = combatSkills.map(skillKey => {
            const skillValue = window.Player.getSkillValue(skillKey);
            const skillDef = window.SKILL_DEFS?.[skillKey];
            
            return `
                <div class="skill-stat">
                    <span class="skill-icon">${skillDef?.icon || '⚔️'}</span>
                    <span class="skill-name">${skillDef?.name || skillKey}</span>
                    <span class="skill-value">${skillValue}${skillDef?.unit || ''}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Update war history statistics
     */
    updateWarHistory() {
        const container = document.getElementById('war-history-stats');
        if (!container || !window.WarSystem) return;
        
        const stats = window.WarSystem.getWarStats(window.Nation?.id);
        
        container.innerHTML = `
            <div class="history-stat">
                <span class="stat-label">Total Wars:</span>
                <span class="stat-value">${stats.totalWars}</span>
            </div>
            <div class="history-stat">
                <span class="stat-label">Total Attacks:</span>
                <span class="stat-value">${stats.totalAttacks}</span>
            </div>
            <div class="history-stat">
                <span class="stat-label">Total Damage:</span>
                <span class="stat-value">${this.formatNumber(stats.totalDamage)}</span>
            </div>
            <div class="history-stat">
                <span class="stat-label">Critical Hits:</span>
                <span class="stat-value">${stats.criticalHits}</span>
            </div>
            <div class="history-stat">
                <span class="stat-label">Blocks:</span>
                <span class="stat-value">${stats.blocks}</span>
            </div>
            <div class="history-stat">
                <span class="stat-label">Parries:</span>
                <span class="stat-value">${stats.parries}</span>
            </div>
        `;
    }
    /**
     * Event handlers for war system events
     */
    handleWarDeclared(data) {
        this.showNotification(`War declared: ${data.war.reason}`, 'info');
        if (this.isVisible && this.currentTab === 'active-wars') {
            this.updateActiveWarsList();
        }
    }
    
    handleWarJoined(data) {
        if (data.nationId === window.Nation?.id) {
            this.showNotification(`You joined the war on the ${data.side} side!`, 'success');
        }
        if (this.isVisible) {
            this.refreshData();
        }
    }
    
    handleAttackExecuted(data) {
        if (this.isVisible && this.currentTab === 'active-wars') {
            this.updateActiveWarsList();
        }
        this.updateEnergyDisplay();
        this.updateIntuitionDisplay();
    }
    
    /**
     * Update energy display in real-time
     */
    updateEnergyDisplay() {
        const energyEl = document.getElementById('current-energy');
        const energyMaxEl = document.querySelector('.energy-max');
        if (energyEl && window.Player) {
            energyEl.textContent = window.Player.getCurrentEnergy();
            if (energyMaxEl) {
                energyMaxEl.textContent = `/${window.Player.getMaxEnergy()}`;
            }
        }
    }
    
    /**
     * Update intuition display in real-time
     */
    updateIntuitionDisplay() {
        const intuitionEl = document.getElementById('current-intuition');
        const intuitionMaxEl = document.querySelector('.intuition-max');
        if (intuitionEl && window.Player) {
            intuitionEl.textContent = window.Player.getCurrentIntuition();
            if (intuitionMaxEl) {
                intuitionMaxEl.textContent = `/${window.Player.getMaxIntuition()}`;
            }
        }
    }
    
    handleRoundStarted(data) {
        this.showNotification(`War round ${data.round.number} has started!`, 'info');
        if (this.isVisible) {
            this.refreshData();
        }
    }
    
    handleRoundEnded(data) {
        const winnerText = data.round.winner === 'draw' ? 'Draw' : 
                          data.round.winner === 'attacker' ? 'Attackers Win' : 'Defenders Win';
        this.showNotification(`Round ${data.round.number} ended: ${winnerText}`, 'info');
        if (this.isVisible) {
            this.refreshData();
        }
    }
    
    handleWarEnded(data) {
        const winnerText = data.winner === 'draw' ? 'War ended in a draw' :
                          data.winner === 'attacker' ? 'Attackers won the war!' : 'Defenders won the war!';
        this.showNotification(winnerText, 'info');
        if (this.isVisible) {
            this.refreshData();
        }
    }
    
    handleMissileHit(data) {
        this.showNotification(`💣 Missile strike successful! ${this.formatNumber(data.damage)} infrastructure damage dealt!`, 'info');
        if (this.isVisible) {
            this.refreshData();
        }
    }
    
    handleMissileIntercepted(data) {
        this.throwBrick('missile');
        this.showNotification(`🧱 Missile intercepted by enemy defenses!`, 'warning');
        if (this.isVisible) {
            this.refreshData();
        }
    }
    
    handleNukeHit(data) {
        this.showNotification(`☢️ NUCLEAR STRIKE! Devastating damage: ${this.formatNumber(data.damage)} infrastructure destroyed! 🩸 Mass casualties reported!`, 'error');
        if (this.isVisible) {
            this.refreshData();
        }
    }
    
    handleNukeIntercepted(data) {
        this.throwBrick('nuke');
        this.showNotification(`🧱 Nuclear missile intercepted! Crisis averted!`, 'warning');
        if (this.isVisible) {
            this.refreshData();
        }
    }
    
    handleSpyOperation(data) {
        const resultText = data.result.success ? 'successful' : 'failed';
        this.showNotification(`🕵️ Spy operation ${resultText}: ${data.result.message}`, data.result.success ? 'success' : 'warning');
        if (this.isVisible) {
            this.refreshData();
        }
    }
    
    /**
     * Utility functions
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    formatWarTime(war) {
        if (war.status === 'preparing') {
            return `Starts in ${this.formatTimeRemaining(war.startTime)}`;
        } else if (war.status === 'active') {
            const currentRound = war.rounds[war.currentRound - 1];
            if (currentRound) {
                return `Round ${war.currentRound}/3 ends in ${this.formatTimeRemaining(currentRound.endTime)}`;
            }
        } else if (war.status === 'ended') {
            return `Ended ${this.formatTimeAgo(war.endTime)}`;
        }
        return 'Unknown';
    }
    
    formatTimeRemaining(timestamp) {
        const now = Date.now();
        const remaining = timestamp - now;
        
        if (remaining <= 0) return 'Now';
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
    
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system - could be enhanced
        console.log(`[WAR PANEL ${type.toUpperCase()}] ${message}`);
        
        // You could implement a toast notification here
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const notificationArea = document.getElementById('notification-area');
        if (notificationArea) {
            notificationArea.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
    
    /**
     * Format damage rankings for display
     */
    formatDamageRankings(warSide) {
        const nationRankings = warSide.nationRankingsSorted || [];
        const allianceRankings = warSide.allianceRankingsSorted || [];
        
        const topNations = nationRankings.slice(0, 3).map(([nationId, damage], index) => {
            const medal = ['🥇', '🥈', '🥉'][index] || '🏅';
            const isPlayer = nationId === window.Nation?.id;
            return `
                <div class="ranking-item ${isPlayer ? 'player-ranking' : ''}">
                    <span class="ranking-position">${medal}</span>
                    <span class="ranking-name">${isPlayer ? '👑 ' : ''}${nationId}</span>
                    <span class="ranking-damage">${this.formatNumber(damage)}</span>
                </div>
            `;
        }).join('') || '<div class="no-rankings">No damage dealt yet</div>';
        
        const topAlliances = allianceRankings.slice(0, 2).map(([allianceId, damage], index) => {
            const medal = ['🥇', '🥈'][index] || '🏅';
            return `
                <div class="ranking-item alliance-ranking">
                    <span class="ranking-position">${medal}</span>
                    <span class="ranking-name">🏛️ ${allianceId}</span>
                    <span class="ranking-damage">${this.formatNumber(damage)}</span>
                </div>
            `;
        }).join('') || '<div class="no-rankings">No alliance participation yet</div>';
        
        return {
            nations: `<div class="nation-rankings">${topNations}</div>`,
            alliances: allianceRankings.length > 0 ? `<div class="alliance-rankings">${topAlliances}</div>` : ''
        };
    }
    
    /**
     * Check if nation can declare war (considering peace treaties)
     */
    canDeclareWar(targetNationId) {
        if (!window.WarSystem) return false;
        
        try {
            return window.WarSystem.canDeclareWar(window.Nation?.id, targetNationId);
        } catch (error) {
            this.showNotification(error.message, 'error');
            return false;
        }
    }
    
    /**
     * Get war type for display
     */
    getWarTypeDisplay(war, nationId) {
        if (!window.WarSystem) return 'Unknown';
        
        const warType = window.WarSystem.getWarTypeForNation(war, nationId);
        switch (warType) {
            case 'offensive':
                return war.originalAttacker === nationId ? 'Declared War' : 'Joined Offensive';
            case 'defensive':
                return war.originalDefender === nationId ? 'Defending' : 'Joined Defense';
            default:
                return 'Unknown';
        }
    }

    // ─── BRICK MISS ANIMATION ─────────────────────────────────────────────────

    /**
     * throwBrick()
     * Flings a random colored brick image from assets/images/Misses/ across
     * the screen when a missile or nuke is intercepted — like chucking a brick
     * in basketball when you air-ball.
     *
     * @param {'missile'|'nuke'} type  Determines brick size and arc speed.
     *
     * Pure DOM + CSS — does NOT touch any sports system or UI state.
     * The element self-destructs after its animation completes.
     */
    throwBrick(type = 'missile') {
        // ── 1. Inject keyframes once ──────────────────────────────────────────
        if (!document.getElementById('brick-keyframes')) {
            const style = document.createElement('style');
            style.id = 'brick-keyframes';
            style.textContent = `
                @keyframes brickFly {
                    0%   { transform: translate(0, 0)        rotate(0deg)   scale(1);    opacity: 1; }
                    30%  { transform: translate(30vw, -25vh) rotate(180deg) scale(1.15); opacity: 1; }
                    65%  { transform: translate(65vw,  10vh) rotate(330deg) scale(0.95); opacity: 0.85; }
                    100% { transform: translate(105vw, 40vh) rotate(480deg) scale(0.6);  opacity: 0; }
                }
                @keyframes brickFlyNuke {
                    0%   { transform: translate(0, 0)        rotate(0deg)   scale(1.4);  opacity: 1; }
                    20%  { transform: translate(20vw, -35vh) rotate(120deg) scale(1.6);  opacity: 1; }
                    55%  { transform: translate(55vw,  -5vh) rotate(290deg) scale(1.3);  opacity: 0.9; }
                    100% { transform: translate(108vw, 50vh) rotate(540deg) scale(0.5);  opacity: 0; }
                }
                .brick-miss {
                    position: fixed;
                    z-index: 99999;
                    pointer-events: none;
                    user-select: none;
                    display: block;
                    filter: drop-shadow(2px 3px 6px rgba(0,0,0,0.6));
                }
            `;
            document.head.appendChild(style);
        }

        // ── 2. All 22 color-named bricks from assets/images/Misses/ ──────────
        const MISS_BRICKS = [
            'black', 'blue', 'd-gold', 'd-orange', 'd-pink', 'd-sky',
            'forest', 'gold', 'green', 'grey', 'l-blue', 'l-grey',
            'l-pink', 'l-red', 'l-sky', 'lime', 'orange', 'pink',
            'red', 'sky', 'white', 'yellow'
        ];

        // Pick a random brick image
        const pick = MISS_BRICKS[Math.floor(Math.random() * MISS_BRICKS.length)];
        const src  = `/assets/images/Misses/${pick}.png`;

        // ── 3. Random start position — left edge, random vertical ─────────────
        const startX = Math.random() * 15;        // 0–15 vw  (left side)
        const startY = 15 + Math.random() * 55;   // 15–70 vh (clear nav bars)

        // ── 4. Size + animation tuned to weapon type ─────────────────────────
        const isNuke   = type === 'nuke';
        const sizePx   = isNuke
            ? Math.round(80 + Math.random() * 40)   // 80–120 px for nukes
            : Math.round(50 + Math.random() * 30);  // 50–80 px for missiles
        const duration = isNuke
            ? (1.0 + Math.random() * 0.5)
            : (0.85 + Math.random() * 0.45);
        const animName = isNuke ? 'brickFlyNuke' : 'brickFly';

        // ── 5. Build the image element ────────────────────────────────────────
        const img = document.createElement('img');
        img.className = 'brick-miss';
        img.src = src;
        img.alt = `${pick} brick miss`;
        img.width  = sizePx;
        img.height = sizePx;
        img.style.cssText = `
            left: ${startX}vw;
            top: ${startY}vh;
            width: ${sizePx}px;
            height: ${sizePx}px;
            animation: ${animName} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        `;

        document.body.appendChild(img);

        // ── 6. Self-destruct after animation ─────────────────────────────────
        img.addEventListener('animationend', () => img.remove());

        // Safety fallback in case animationend never fires
        setTimeout(() => { if (img.parentNode) img.remove(); }, (duration + 0.5) * 1000);
    }
}

// Create global instance
window.WarPanel = new WarPanel();

// Bind to global events for easy access
EventBus.on('show_war_panel', () => window.WarPanel.show());
EventBus.on('hide_war_panel', () => window.WarPanel.hide());