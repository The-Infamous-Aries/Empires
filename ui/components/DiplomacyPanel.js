/**
 * Diplomacy Panel - Treaty and Relationship Management UI
 * Empire Builder - Nation Building Strategy Game
 */

class DiplomacyPanel {
    constructor() {
        this.isVisible = false;
        this.currentTab = 'overview';
        this.selectedNation = null;
        this.bindEvents();
    }

    bindEvents() {
        EventBus.on('show_diplomacy_panel', this.show.bind(this));
        EventBus.on('hide_diplomacy_panel', this.hide.bind(this));
        EventBus.on('treaty_proposed', this.refreshPanel.bind(this));
        EventBus.on('treaty_accepted', this.refreshPanel.bind(this));
        EventBus.on('aid_proposed', this.refreshPanel.bind(this));
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    show(data = {}) {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.selectedNation = data.selectedNation || null;
        this.createInterface();
        this.updateContent();
        
        EventBus.emit('modal_opened', { type: 'diplomacy_panel' });
    }

    hide() {
        if (!this.isVisible) return;
        
        const panel = document.getElementById('diplomacy-panel');
        if (panel) {
            panel.remove();
        }
        
        this.isVisible = false;
        this.selectedNation = null;
        EventBus.emit('modal_closed', { type: 'diplomacy_panel' });
    }

    createInterface() {
        if (document.getElementById('diplomacy-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'diplomacy-panel';
        panel.className = 'diplomacy-panel modal-overlay';
        
        panel.innerHTML = this.getInterfaceHTML();
        document.body.appendChild(panel);
        
        this.bindInterfaceEvents();
    }
    getInterfaceHTML() {
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        const diplomacyStatus = DiplomacySystem?.getNationDiplomacyStatus?.(nation?.id) || {};
        
        return `
            <div class="modal-content diplomacy-content">
                <div class="modal-header">
                    <h2>🤝 Diplomatic Relations</h2>
                    <button class="close-btn" id="close-diplomacy">✕</button>
                </div>
                
                <div class="diplomacy-tabs">
                    <button class="tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" 
                            data-tab="overview">Overview</button>
                    <button class="tab-btn ${this.currentTab === 'treaties' ? 'active' : ''}" 
                            data-tab="treaties">Treaties</button>
                    <button class="tab-btn ${this.currentTab === 'proposals' ? 'active' : ''}" 
                            data-tab="proposals">Proposals</button>
                    <button class="tab-btn ${this.currentTab === 'relationships' ? 'active' : ''}" 
                            data-tab="relationships">Relationships</button>
                    ${this.selectedNation ? `
                    <button class="tab-btn ${this.currentTab === 'negotiate' ? 'active' : ''}" 
                            data-tab="negotiate">Negotiate</button>
                    ` : ''}
                </div>
                
                <div class="diplomacy-content-area">
                    <div id="diplomacy-tab-content">
                        ${this.getTabContent()}
                    </div>
                </div>
                
                ${this.selectedNation ? `
                <div class="selected-nation-info">
                    <h4>Selected Nation: ${this.selectedNation.name}</h4>
                    <p>Click on map or search nations to interact diplomatically</p>
                </div>
                ` : `
                <div class="nation-selection-hint">
                    <p>💡 Select a nation on the map or search in the World tab to begin diplomatic negotiations</p>
                </div>
                `}
            </div>
        `;
    }

    getTabContent() {
        switch (this.currentTab) {
            case 'overview':
                return this.getOverviewContent();
            case 'treaties':
                return this.getTreatiesContent();
            case 'proposals':
                return this.getProposalsContent();
            case 'relationships':
                return this.getRelationshipsContent();
            case 'negotiate':
                return this.getNegotiateContent();
            default:
                return '<p>Select a tab to view content</p>';
        }
    }

    getOverviewContent() {
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        const diplomacyStatus = DiplomacySystem?.getNationDiplomacyStatus?.(nation?.id) || {};
        const slots = diplomacyStatus.treatySlots || {};
        
        return `
            <div class="diplomacy-overview">
                <div class="diplomacy-stats">
                    <div class="stat-card">
                        <h4>🏛️ Embassy Capacity</h4>
                        <div class="stat-value">${slots.embassies || 0}</div>
                        <small>Embassies built</small>
                    </div>
                    
                    <div class="stat-card">
                        <h4>👥 Relationships</h4>
                        <div class="relationship-summary">
                            <div>Friends: ${diplomacyStatus.relationships?.friends?.length || 0}/${slots.maxFriends || 0}</div>
                            <div>Foes: ${diplomacyStatus.relationships?.foes?.length || 0}/${slots.maxFoes || 0}</div>
                            <div>Best Friend: ${diplomacyStatus.relationships?.bestFriend ? '✓' : '✗'}</div>
                            <div>Nemesis: ${diplomacyStatus.relationships?.nemesis ? '✓' : '✗'}</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <h4>📜 Active Treaties</h4>
                        <div class="stat-value">${diplomacyStatus.activeTreaties?.length || 0}</div>
                        <small>Current agreements</small>
                    </div>
                    
                    <div class="stat-card">
                        <h4>💰 Aid Slots</h4>
                        <div class="stat-value">${diplomacyStatus.aidSlots || 0}/${diplomacyStatus.maxAidSlots || 3}</div>
                        <small>Financial assistance proposals</small>
                    </div>
                </div>
                
                ${diplomacyStatus.penalties?.length > 0 ? `
                <div class="diplomacy-penalties">
                    <h4>⚠️ Current Penalties</h4>
                    ${diplomacyStatus.penalties.map(penalty => `
                        <div class="penalty-item">
                            <span class="penalty-type">${penalty.type}</span>
                            <span class="penalty-effect">-${penalty.happiness} Happiness</span>
                            <span class="penalty-duration">${penalty.duration} days remaining</span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                <div class="alliance-status">
                    <h4>🏴 Alliance Status</h4>
                    <p>Join Alliance (Not Create) but if the right people share ties who knows what might happen</p>
                    <button id="join-alliance-btn" class="action-btn" disabled>Join Alliance</button>
                </div>
            </div>
        `;
    }
    getTreatiesContent() {
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        const diplomacyStatus = DiplomacySystem?.getNationDiplomacyStatus?.(nation?.id) || {};
        const treaties = diplomacyStatus.activeTreaties || [];
        
        if (treaties.length === 0) {
            return `
                <div class="no-treaties">
                    <h3>📜 No Active Treaties</h3>
                    <p>You have no active diplomatic treaties. Select a nation to begin negotiations.</p>
                </div>
            `;
        }
        
        return `
            <div class="treaties-list">
                <h3>📜 Active Treaties</h3>
                ${treaties.map(treaty => `
                    <div class="treaty-card">
                        <div class="treaty-header">
                            <h4>${this.getTreatyTypeDisplay(treaty.type)}</h4>
                            <span class="treaty-status ${treaty.status}">${treaty.status}</span>
                        </div>
                        
                        <div class="treaty-details">
                            <div class="treaty-parties">
                                <strong>Parties:</strong> ${treaty.parties.map(id => this.getNationName(id)).join(' & ')}
                            </div>
                            
                            <div class="treaty-terms">
                                <strong>Terms:</strong> ${treaty.terms || 'Standard terms apply'}
                            </div>
                            
                            ${treaty.compensation ? `
                            <div class="treaty-compensation">
                                <strong>Failure Compensation:</strong> $${this.formatNumber(treaty.compensation)}
                            </div>
                            ` : ''}
                            
                            <div class="treaty-dates">
                                <div>Created: ${new Date(treaty.createdAt).toLocaleDateString()}</div>
                                ${treaty.expiresAt ? `
                                <div>Expires: ${new Date(treaty.expiresAt).toLocaleDateString()}</div>
                                ` : '<div>Duration: Permanent</div>'}
                            </div>
                        </div>
                        
                        <div class="treaty-actions">
                            ${treaty.type !== 'peace' ? `
                            <button class="action-btn warning" 
                                    onclick="this.violateTreaty('${treaty.id}')">
                                Break Treaty
                            </button>
                            ` : `
                            <span class="treaty-locked">Cannot break Peace Pact early</span>
                            `}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getProposalsContent() {
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        const diplomacyStatus = DiplomacySystem?.getNationDiplomacyStatus?.(nation?.id) || {};
        const proposals = diplomacyStatus.pendingProposals || [];
        
        if (proposals.length === 0) {
            return `
                <div class="no-proposals">
                    <h3>📨 No Pending Proposals</h3>
                    <p>You have no pending diplomatic proposals to review.</p>
                </div>
            `;
        }
        
        return `
            <div class="proposals-list">
                <h3>📨 Pending Proposals</h3>
                ${proposals.map(proposal => `
                    <div class="proposal-card">
                        <div class="proposal-header">
                            <h4>${proposal.treatyType ? this.getTreatyTypeDisplay(proposal.treatyType) : 'Financial Aid'}</h4>
                            <span class="proposal-expires">
                                Expires: ${new Date(proposal.expiresAt).toLocaleDateString()}
                            </span>
                        </div>
                        
                        <div class="proposal-details">
                            <div class="proposal-from">
                                <strong>From:</strong> ${this.getNationName(proposal.proposerId)}
                            </div>
                            
                            ${proposal.treatyType ? `
                            <div class="proposal-terms">
                                <strong>Terms:</strong> ${proposal.terms || 'Standard terms apply'}
                            </div>
                            
                            ${proposal.compensation ? `
                            <div class="proposal-compensation">
                                <strong>Failure Compensation:</strong> $${this.formatNumber(proposal.compensation)}
                            </div>
                            ` : ''}
                            ` : `
                            <div class="aid-details">
                                <strong>Aid Type:</strong> ${proposal.aidType === 'money' ? 'Financial' : 'Technology'}
                                <strong>Amount:</strong> ${proposal.aidType === 'money' ? 
                                    '$' + this.formatNumber(proposal.amount) : 
                                    proposal.amount + ' Tech Levels'}
                            </div>
                            `}
                        </div>
                        
                        <div class="proposal-actions">
                            <button class="action-btn success" 
                                    onclick="this.acceptProposal('${proposal.id}', '${proposal.treatyType ? 'treaty' : 'aid'}')">
                                ✓ Accept
                            </button>
                            <button class="action-btn danger" 
                                    onclick="this.declineProposal('${proposal.id}', '${proposal.treatyType ? 'treaty' : 'aid'}')">
                                ✗ Decline
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    getRelationshipsContent() {
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        const diplomacyStatus = DiplomacySystem?.getNationDiplomacyStatus?.(nation?.id) || {};
        const relationships = diplomacyStatus.relationships || {};
        const canModify = diplomacyStatus.treatySlots?.canModifyRelationships || false;
        
        return `
            <div class="relationships-content">
                <div class="relationship-section">
                    <h3>👑 Best Friend</h3>
                    ${relationships.bestFriend ? `
                        <div class="relationship-item">
                            <span class="nation-name">${this.getNationName(relationships.bestFriend)}</span>
                            ${canModify ? `
                            <button class="action-btn warning" 
                                    onclick="this.removeRelationship('bestFriend', '${relationships.bestFriend}')">
                                Remove
                            </button>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="no-relationship">
                            <em>No best friend selected</em>
                            ${canModify ? '<button class="action-btn" onclick="this.selectBestFriend()">Select Best Friend</button>' : ''}
                        </div>
                    `}
                    ${!canModify ? '<small class="requirement-note">Requires Office of Diplomatic Relations</small>' : ''}
                </div>

                <div class="relationship-section">
                    <h3>👥 Friends (${relationships.friends?.length || 0}/${diplomacyStatus.treatySlots?.maxFriends || 0})</h3>
                    <div class="relationship-list">
                        ${relationships.friends?.length > 0 ? relationships.friends.map(friendId => `
                            <div class="relationship-item">
                                <span class="nation-name">${this.getNationName(friendId)}</span>
                                ${canModify ? `
                                <button class="action-btn warning" 
                                        onclick="this.removeRelationship('friend', '${friendId}')">
                                    Remove
                                </button>
                                ` : ''}
                            </div>
                        `).join('') : '<div class="no-relationship"><em>No friends selected</em></div>'}
                        
                        ${canModify && (relationships.friends?.length || 0) < (diplomacyStatus.treatySlots?.maxFriends || 0) ? `
                        <button class="action-btn" onclick="this.addFriend()">Add Friend</button>
                        ` : ''}
                    </div>
                    ${!canModify ? '<small class="requirement-note">Requires Office of Diplomatic Relations</small>' : ''}
                </div>

                <div class="relationship-section">
                    <h3>👹 Nemesis</h3>
                    ${relationships.nemesis ? `
                        <div class="relationship-item">
                            <span class="nation-name">${this.getNationName(relationships.nemesis)}</span>
                            ${canModify ? `
                            <button class="action-btn warning" 
                                    onclick="this.removeRelationship('nemesis', '${relationships.nemesis}')">
                                Remove
                            </button>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="no-relationship">
                            <em>No nemesis selected</em>
                            ${canModify ? '<button class="action-btn danger" onclick="this.selectNemesis()">Select Nemesis</button>' : ''}
                        </div>
                    `}
                    ${!canModify ? '<small class="requirement-note">Requires Office of Diplomatic Relations</small>' : ''}
                </div>

                <div class="relationship-section">
                    <h3>⚔️ Foes (${relationships.foes?.length || 0}/${diplomacyStatus.treatySlots?.maxFoes || 0})</h3>
                    <div class="relationship-list">
                        ${relationships.foes?.length > 0 ? relationships.foes.map(foeId => `
                            <div class="relationship-item">
                                <span class="nation-name">${this.getNationName(foeId)}</span>
                                ${canModify ? `
                                <button class="action-btn warning" 
                                        onclick="this.removeRelationship('foe', '${foeId}')">
                                    Remove
                                </button>
                                ` : ''}
                            </div>
                        `).join('') : '<div class="no-relationship"><em>No foes selected</em></div>'}
                        
                        ${canModify && (relationships.foes?.length || 0) < (diplomacyStatus.treatySlots?.maxFoes || 0) ? `
                        <button class="action-btn danger" onclick="this.addFoe()">Add Foe</button>
                        ` : ''}
                    </div>
                    ${!canModify ? '<small class="requirement-note">Requires Office of Diplomatic Relations</small>' : ''}
                </div>
            </div>
        `;
    }
    getNegotiateContent() {
        if (!this.selectedNation) {
            return `
                <div class="no-nation-selected">
                    <h3>🌍 Select a Nation</h3>
                    <p>Click on a nation on the map or search in the World tab to begin negotiations.</p>
                </div>
            `;
        }
        
        return `
            <div class="negotiate-content">
                <div class="negotiate-header">
                    <h3>🤝 Negotiate with ${this.selectedNation.name}</h3>
                    <p>Current Relationship: ${this.getRelationshipStatus(this.selectedNation.id)}</p>
                </div>
                
                <div class="negotiate-sections">
                    <div class="negotiate-section">
                        <h4>📜 Propose Treaty</h4>
                        <div class="treaty-options">
                            ${this.getTreatyOptions()}
                        </div>
                    </div>
                    
                    <div class="negotiate-section">
                        <h4>💰 Offer Aid</h4>
                        <div class="aid-options">
                            <div class="aid-option">
                                <label>Financial Aid:</label>
                                <input type="number" id="financial-aid-amount" placeholder="Amount in $" min="1">
                                <button class="action-btn" onclick="this.proposeAid('money')">Propose</button>
                            </div>
                            
                            <div class="aid-option">
                                <label>Technology Transfer:</label>
                                <input type="number" id="tech-aid-amount" placeholder="Tech levels" min="1">
                                <button class="action-btn" onclick="this.proposeAid('tech')">Propose</button>
                                <small>Requires Financial Assistance Office for full benefits</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="negotiate-section">
                        <h4>⚔️ Declare War</h4>
                        <button class="action-btn danger" onclick="this.declareWar()">
                            Declare War on ${this.selectedNation.name}
                        </button>
                        <small>Warning: This action may violate existing treaties</small>
                    </div>
                </div>
            </div>
        `;
    }

    getTreatyOptions() {
        const treatyTypes = [
            'protectorate', 'extension', 'mutualDefense', 'mutualAggression',
            'optionalDefense', 'optionalAggression', 'intelligence', 'peace'
        ];
        
        return treatyTypes.map(type => {
            const treatyDef = DiplomacySystem?.treatyTypes?.[type];
            if (!treatyDef) return '';
            
            return `
                <div class="treaty-option">
                    <div class="treaty-info">
                        <strong>${treatyDef.name}</strong>
                        <p>${treatyDef.description}</p>
                        <small>Max: ${treatyDef.maxNation} for nations</small>
                    </div>
                    <button class="action-btn" onclick="this.proposeTreaty('${type}')">
                        Propose ${treatyDef.name}
                    </button>
                </div>
            `;
        }).join('');
    }

    // Event handlers and utility methods
    bindInterfaceEvents() {
        const panel = document.getElementById('diplomacy-panel');
        if (!panel) return;

        // Close button
        panel.querySelector('#close-diplomacy')?.addEventListener('click', () => this.hide());
        
        // Tab switching
        panel.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Click outside to close
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                this.hide();
            }
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.updateTabs();
        this.updateContent();
    }

    updateTabs() {
        const panel = document.getElementById('diplomacy-panel');
        if (!panel) return;

        panel.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === this.currentTab) {
                btn.classList.add('active');
            }
        });
    }

    updateContent() {
        const contentArea = document.getElementById('diplomacy-tab-content');
        if (!contentArea) return;

        contentArea.innerHTML = this.getTabContent();
    }

    refreshPanel() {
        if (this.isVisible) {
            this.updateContent();
        }
    }
    // Action methods
    acceptProposal(proposalId, type) {
        try {
            if (type === 'treaty') {
                DiplomacySystem?.acceptTreaty?.(proposalId);
            } else if (type === 'aid') {
                DiplomacySystem?.acceptAid?.(proposalId);
            }
            
            this.showNotification('Proposal accepted successfully!', 'success');
            this.refreshPanel();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    declineProposal(proposalId, type) {
        try {
            if (type === 'treaty') {
                DiplomacySystem?.declineTreaty?.(proposalId);
            } else if (type === 'aid') {
                DiplomacySystem?.declineAid?.(proposalId);
            }
            
            this.showNotification('Proposal declined', 'info');
            this.refreshPanel();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    proposeTreaty(treatyType) {
        if (!this.selectedNation) {
            this.showNotification('Please select a nation first', 'warning');
            return;
        }

        try {
            const nation = GameEngine?.currentNation || DataManager?.currentNation;
            const proposalData = {
                proposerId: nation.id,
                targetId: this.selectedNation.id,
                treatyType: treatyType,
                terms: 'Standard treaty terms', // Could be customizable
                compensation: null // Will use defaults
            };

            const proposalId = DiplomacySystem?.proposeTreaty?.(proposalData);
            this.showNotification(`Treaty proposal sent to ${this.selectedNation.name}!`, 'success');
            this.refreshPanel();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    proposeAid(aidType) {
        if (!this.selectedNation) {
            this.showNotification('Please select a nation first', 'warning');
            return;
        }

        const amountInput = document.getElementById(aidType === 'money' ? 'financial-aid-amount' : 'tech-aid-amount');
        const amount = parseInt(amountInput?.value || 0);

        if (amount <= 0) {
            this.showNotification('Please enter a valid amount', 'warning');
            return;
        }

        try {
            const nation = GameEngine?.currentNation || DataManager?.currentNation;
            const aidData = {
                proposerId: nation.id,
                targetId: this.selectedNation.id,
                aidType: aidType,
                amount: amount
            };

            const aidId = DiplomacySystem?.proposeAid?.(aidData);
            this.showNotification(`${aidType === 'money' ? 'Financial' : 'Technology'} aid proposed!`, 'success');
            amountInput.value = '';
            this.refreshPanel();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    declareWar() {
        if (!this.selectedNation) {
            this.showNotification('Please select a nation first', 'warning');
            return;
        }

        if (confirm(`Are you sure you want to declare war on ${this.selectedNation.name}? This action may violate existing treaties.`)) {
            // This would integrate with the war system
            EventBus.emit('war_declared', {
                attackerId: (GameEngine?.currentNation || DataManager?.currentNation)?.id,
                defenderId: this.selectedNation.id
            });
            
            this.showNotification(`War declared on ${this.selectedNation.name}!`, 'warning');
        }
    }

    // Utility methods
    getTreatyTypeDisplay(treatyType) {
        const typeDisplays = {
            protectorate: '🛡️ Protectorate Agreement',
            extension: '🤝 Extension Pact',
            mutualDefense: '⚔️ Mutual Defense Pact',
            mutualAggression: '⚔️ Mutual Aggression Pact',
            optionalDefense: '🛡️ Optional Defense Pact',
            optionalAggression: '⚔️ Optional Aggression Pact',
            intelligence: '🕵️ Intelligence Pact',
            peace: '☮️ Peace Pact'
        };
        
        return typeDisplays[treatyType] || treatyType;
    }

    getNationName(nationId) {
        // This would get the actual nation name from game data
        if (nationId === (GameEngine?.currentNation || DataManager?.currentNation)?.id) {
            return (GameEngine?.currentNation || DataManager?.currentNation)?.name || 'Your Nation';
        }
        return `Nation ${nationId}`;
    }

    getRelationshipStatus(nationId) {
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        const relationship = DiplomacySystem?.getRelationship?.(nation?.id, nationId);
        
        const relationshipDisplays = {
            bestFriend: '👑 Best Friend',
            friend: '👥 Friend',
            nemesis: '👹 Nemesis',
            foe: '⚔️ Foe'
        };
        
        return relationshipDisplays[relationship] || '🔳 Neutral';
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    showNotification(message, type = 'info') {
        EventBus.emit('show_notification', { message, type });
    }

    destroy() {
        this.hide();
        this.selectedNation = null;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiplomacyPanel };
}