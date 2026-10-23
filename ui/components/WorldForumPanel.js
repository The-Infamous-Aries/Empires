/**
 * World Forum Panel - Global and Color Bloc Governance Interface
 * Dominion Wars - Nation Building Strategy Game
 */

class WorldForumPanel {
    constructor() {
        this.panel = null;
        this.currentView = 'overview'; // overview, color-forum, world-forum, voting, propose
        this.selectedMotionType = null;
        this.votingSummary = null;
        
        this.initializePanel();
        this.bindEvents();
    }
    
    /**
     * Initialize the World Forum panel
     */
    initializePanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'world-forum-panel panel';
        this.panel.style.display = 'none';
        
        this.render();
        document.body.appendChild(this.panel);
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for World Forum events
        EventBus.on('motion_implemented', this.handleMotionUpdate, this);
        EventBus.on('vote_cast', this.handleVoteUpdate, this);
        EventBus.on('congressional_election_started', this.handleElectionUpdate, this);
        EventBus.on('color_name_vote_started', this.handleColorNameUpdate, this);
        EventBus.on('world_forum_opened', this.show, this);
        
        // Listen for daily updates to refresh data
        EventBus.on(GameEvents.DAY_PASSED, this.refreshData, this);
    }
    
    /**
     * Render the panel content
     */
    render() {
        this.panel.innerHTML = `
            <div class="panel-header">
                <h3>🏛️ World Forum</h3>
                <button class="close-btn" onclick="WorldForumPanel.instance.hide()">&times;</button>
            </div>
            
            <div class="panel-content">
                <div class="world-forum-nav">
                    <button class="nav-btn ${this.currentView === 'overview' ? 'active' : ''}" 
                            onclick="WorldForumPanel.instance.switchView('overview')">Overview</button>
                    <button class="nav-btn ${this.currentView === 'color-forum' ? 'active' : ''}" 
                            onclick="WorldForumPanel.instance.switchView('color-forum')">Color Bloc</button>
                    <button class="nav-btn ${this.currentView === 'world-forum' ? 'active' : ''}" 
                            onclick="WorldForumPanel.instance.switchView('world-forum')">World Affairs</button>
                    <button class="nav-btn ${this.currentView === 'voting' ? 'active' : ''}" 
                            onclick="WorldForumPanel.instance.switchView('voting')">Voting</button>
                    <button class="nav-btn ${this.currentView === 'propose' ? 'active' : ''}" 
                            onclick="WorldForumPanel.instance.switchView('propose')">Propose Motion</button>
                </div>
                
                <div class="world-forum-content">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `;
    }
    
    /**
     * Render content for current view
     */
    renderCurrentView() {
        switch (this.currentView) {
            case 'overview':
                return this.renderOverview();
            case 'color-forum':
                return this.renderColorForum();
            case 'world-forum':
                return this.renderWorldForum();
            case 'voting':
                return this.renderVoting();
            case 'propose':
                return this.renderProposeMotion();
            default:
                return '<p>Loading...</p>';
        }
    }
    
    /**
     * Render overview section
     */
    renderOverview() {
        if (!window.Player) return '<p>Player not loaded</p>';
        
        const player = window.Player;
        const canVoteColor = player.projectEffects?.worldForumAccess;
        const canVoteWorld = player.wonderEffects?.globalVotingEnabled;
        const isCongressMember = WorldForum?.isPlayerRepresentative(player);
        const stats = this.getVotingStats();
        
        return `
            <div class="overview-section">
                <h4>🗳️ Your Forum Access</h4>
                <div class="access-status">
                    <div class="status-item ${canVoteColor ? 'enabled' : 'disabled'}">
                        <span class="status-icon">${canVoteColor ? '✅' : '❌'}</span>
                        <span class="status-label">Color Bloc Forum</span>
                        <span class="status-detail">${canVoteColor ? 'Active' : 'Requires Broadcasting Network'}</span>
                    </div>
                    <div class="status-item ${canVoteWorld ? 'enabled' : 'disabled'}">
                        <span class="status-icon">${canVoteWorld ? '✅' : '❌'}</span>
                        <span class="status-label">World Affairs Forum</span>
                        <span class="status-detail">${canVoteWorld ? 'Active' : 'Requires Internet Wonder'}</span>
                    </div>
                    <div class="status-item ${isCongressMember ? 'enabled' : 'disabled'}">
                        <span class="status-icon">${isCongressMember ? '🏆' : '👤'}</span>
                        <span class="status-label">Congressional Status</span>
                        <span class="status-detail">${isCongressMember ? 'Representative' : 'Citizen'}</span>
                    </div>
                </div>
                
                ${stats ? `
                    <h4>📊 Voting Statistics</h4>
                    <div class="voting-stats">
                        <div class="stat-item">
                            <span class="stat-number">${stats.totalMotions}</span>
                            <span class="stat-label">Active Motions</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${stats.canVoteOn}</span>
                            <span class="stat-label">Can Vote On</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${stats.hasVotedOn}</span>
                            <span class="stat-label">Already Voted</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${stats.colorMotions}</span>
                            <span class="stat-label">Color Motions</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${stats.worldMotions}</span>
                            <span class="stat-label">World Motions</span>
                        </div>
                    </div>
                ` : ''}
                
                <h4>🌍 World Information</h4>
                <div class="world-info">
                    <div class="info-item">
                        <strong>World Name:</strong> ${WorldForum?.worldSettings?.worldName || 'Empire Dominion'}
                    </div>
                    <div class="info-item">
                        <strong>Your Faction:</strong> ${this.getFactionDisplayName(player.factionKey)}
                    </div>
                    <div class="info-item">
                        <strong>Congressional Seats:</strong> ${WorldForum?.congressSeats?.get(player.factionKey) || 0}
                    </div>
                    <div class="info-item">
                        <strong>Total Congress Seats:</strong> ${WorldForum?.totalSeats || 0}
                    </div>
                </div>
                
                <div class="quick-actions">
                    <h4>⚡ Quick Actions</h4>
                    <div class="action-buttons">
                        <button class="action-btn secondary" onclick="WorldForumPanel.instance.showCongressInfo()">
                            🏛️ Congress Info
                        </button>
                        <button class="action-btn secondary" onclick="WorldForumPanel.instance.showMotionHistory()">
                            📋 Motion History
                        </button>
                        ${stats && stats.canVoteOn > stats.hasVotedOn ? `
                            <button class="action-btn primary" onclick="WorldForumPanel.instance.switchView('voting')">
                                🗳️ Vote Now (${stats.canVoteOn - stats.hasVotedOn} pending)
                            </button>
                        ` : ''}
                        ${(canVoteColor || (canVoteWorld && isCongressMember)) ? `
                            <button class="action-btn primary" onclick="WorldForumPanel.instance.switchView('propose')">
                                📝 Propose Motion
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                ${this.renderActiveEffects(player.factionKey)}
            </div>
        `;
    }
    
    /**
     * Render Color Bloc Forum section
     */
    renderColorForum() {
        if (!window.Player?.projectEffects?.worldForumAccess) {
            return `
                <div class="locked-section">
                    <h4>🔒 Color Bloc Forum - Access Denied</h4>
                    <p>You need to build a <strong>Broadcasting Network</strong> project to access the Color Bloc Forum.</p>
                    <p>The Broadcasting Network allows you to:</p>
                    <ul>
                        <li>Vote on faction motions</li>
                        <li>Run for congressional seats</li>
                        <li>Participate in color name voting</li>
                    </ul>
                </div>
            `;
        }
        
        const player = window.Player;
        const factionKey = player.factionKey;
        const activeMotions = WorldForum?.getActiveMotions()?.filter(m => 
            m.scope === 'color' && m.proposerFaction === factionKey) || [];
        
        return `
            <div class="color-forum-section">
                <h4>🎨 ${this.getFactionDisplayName(factionKey)} Forum</h4>
                
                <div class="faction-status">
                    <div class="faction-info">
                        <strong>Faction:</strong> ${this.getFactionDisplayName(factionKey)}
                    </div>
                    <div class="congress-info">
                        <strong>Congressional Seats:</strong> ${WorldForum?.congressSeats?.get(factionKey) || 0}
                    </div>
                </div>
                
                <h5>📋 Active Color Motions</h5>
                <div class="motions-list">
                    ${activeMotions.length > 0 ? 
                        activeMotions.map(motion => this.renderMotionCard(motion)).join('') :
                        '<p class="no-motions">No active color motions for your faction.</p>'
                    }
                </div>
                
                <h5>🗳️ Color Name Voting</h5>
                ${this.renderColorNameVoting(factionKey)}
                
                <h5>🏛️ Congressional Elections</h5>
                ${this.renderCongressionalElections(factionKey)}
            </div>
        `;
    }
    
    /**
     * Render World Forum section
     */
    renderWorldForum() {
        if (!window.Player?.wonderEffects?.globalVotingEnabled) {
            return `
                <div class="locked-section">
                    <h4>🔒 World Affairs Forum - Access Denied</h4>
                    <p>You need to build an <strong>Internet Network</strong> wonder to access World Affairs.</p>
                    <p>The Internet Network allows you to:</p>
                    <ul>
                        <li>Vote on global motions</li>
                        <li>Propose world-affecting policies (if congressional member)</li>
                        <li>Participate in world governance</li>
                    </ul>
                </div>
            `;
        }
        
        const activeMotions = WorldForum?.getActiveMotions()?.filter(m => m.scope === 'world') || [];
        
        return `
            <div class="world-forum-section">
                <h4>🌍 World Affairs Forum</h4>
                
                <div class="world-status">
                    <div class="world-info">
                        <strong>World Name:</strong> ${WorldForum?.worldSettings?.worldName || 'Empire Dominion'}
                    </div>
                    <div class="congress-info">
                        <strong>Total Congressional Seats:</strong> ${WorldForum?.totalSeats || 0}
                    </div>
                </div>
                
                <h5>🌐 Active World Motions</h5>
                <div class="motions-list">
                    ${activeMotions.length > 0 ? 
                        activeMotions.map(motion => this.renderMotionCard(motion)).join('') :
                        '<p class="no-motions">No active world motions.</p>'
                    }
                </div>
                
                <h5>📊 Global Effects</h5>
                ${this.renderGlobalEffects()}
            </div>
        `;
    }
    
    /**
     * Render voting section
     */
    renderVoting() {
        if (!window.Player?.factionKey) {
            return '<p>You must join a faction to participate in voting.</p>';
        }
        
        const player = window.Player;
        const votingSummary = WorldForum?.getVotingSummary(player.playerId);
        
        if (!votingSummary) {
            return '<p>Unable to load voting information.</p>';
        }
        
        return `
            <div class="voting-section">
                <h4>🗳️ Active Votes</h4>
                
                <div class="voting-capabilities">
                    <div class="capability ${votingSummary.player.canVoteColor ? 'enabled' : 'disabled'}">
                        <span>Color Bloc Voting: ${votingSummary.player.canVoteColor ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div class="capability ${votingSummary.player.canVoteWorld ? 'enabled' : 'disabled'}">
                        <span>World Affairs Voting: ${votingSummary.player.canVoteWorld ? 'Enabled' : 'Disabled'}</span>
                    </div>
                </div>
                
                <h5>📋 Motions You Can Vote On</h5>
                <div class="available-votes">
                    ${votingSummary.activeMotions.length > 0 ? 
                        votingSummary.activeMotions.map(motion => this.renderVotingCard(motion)).join('') :
                        '<p class="no-votes">No active votes available for you.</p>'
                    }
                </div>
                
                ${votingSummary.activeElections.length > 0 ? `
                    <h5>🏛️ Congressional Elections</h5>
                    <div class="election-votes">
                        ${votingSummary.activeElections.map(election => this.renderElectionVotingCard(election)).join('')}
                    </div>
                ` : ''}
                
                ${votingSummary.activeColorNameVotes.length > 0 ? `
                    <h5>🎨 Color Name Votes</h5>
                    <div class="name-votes">
                        ${votingSummary.activeColorNameVotes.map(vote => this.renderColorNameVotingCard(vote)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render motion proposal section
     */
    renderProposeMotion() {
        if (!window.Player?.factionKey) {
            return '<p>You must join a faction to propose motions.</p>';
        }
        
        const player = window.Player;
        const hasColorAccess = player.projectEffects?.worldForumAccess;
        const hasWorldAccess = player.wonderEffects?.globalVotingEnabled;
        const isCongressMember = WorldForum?.isPlayerRepresentative(player);
        
        if (!hasColorAccess && !hasWorldAccess) {
            return `
                <div class="locked-section">
                    <h4>🔒 Motion Proposal - Access Denied</h4>
                    <p>You need either a <strong>Broadcasting Network</strong> (for color motions) or <strong>Internet Wonder</strong> (for world motions) to propose motions.</p>
                    <div class="access-requirements">
                        <h5>📋 Requirements:</h5>
                        <div class="req-item ${hasColorAccess ? 'met' : 'unmet'}">
                            <span class="req-icon">${hasColorAccess ? '✅' : '❌'}</span>
                            <span class="req-text">Broadcasting Network (for Color Bloc motions)</span>
                        </div>
                        <div class="req-item ${hasWorldAccess && isCongressMember ? 'met' : 'unmet'}">
                            <span class="req-icon">${hasWorldAccess && isCongressMember ? '✅' : '❌'}</span>
                            <span class="req-text">Internet Wonder + Congressional Status (for World motions)</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const templates = WorldForum?.getMotionTemplates(player.playerId) || [];
        
        return `
            <div class="propose-section">
                <h4>📝 Propose New Motion</h4>
                
                <div class="proposal-status">
                    <div class="status-grid">
                        <div class="status-card ${hasColorAccess ? 'enabled' : 'disabled'}">
                            <h6>🎨 Color Bloc Motions</h6>
                            <p class="status-text">${hasColorAccess ? 'Available' : 'Requires Broadcasting Network'}</p>
                            ${hasColorAccess ? `<p class="faction-info">Your Faction: ${this.getFactionDisplayName(player.factionKey)}</p>` : ''}
                        </div>
                        <div class="status-card ${hasWorldAccess && isCongressMember ? 'enabled' : 'disabled'}">
                            <h6>🌍 World Motions</h6>
                            <p class="status-text">${hasWorldAccess && isCongressMember ? 'Available (Congressional)' : 
                                !hasWorldAccess ? 'Requires Internet Wonder' : 'Requires Congressional Status'}</p>
                            ${isCongressMember ? '<p class="congress-info">🏆 Congressional Representative</p>' : ''}
                        </div>
                    </div>
                </div>
                
                <div class="motion-types">
                    <h5>Available Motion Types</h5>
                    ${templates.length > 0 ? `
                        <div class="templates-grid">
                            ${templates.map(template => this.renderMotionTemplate(template)).join('')}
                        </div>
                    ` : '<p class="no-templates">No motion types available with your current access level.</p>'}
                </div>
                
                ${this.selectedMotionType ? this.renderMotionForm() : ''}
            </div>
        `;
    }
    
    /**
     * Render motion card
     */
    renderMotionCard(motion) {
        const timeRemaining = motion.factionVotingEnd > Date.now() ? 
            this.formatTimeRemaining(motion.factionVotingEnd - Date.now()) : 'Voting Ended';
            
        const totalVotes = this.getMotionVoteTotals(motion);
        const supportPercentage = totalVotes.total > 0 ? 
            Math.round((totalVotes.for / totalVotes.total) * 100) : 0;
            
        return `
            <div class="motion-card">
                <div class="motion-header">
                    <div class="motion-title">
                        <h6>${motion.title}</h6>
                        <span class="motion-id">#${motion.id}</span>
                    </div>
                    <span class="motion-scope ${motion.scope}">${motion.scope.toUpperCase()}</span>
                </div>
                
                <p class="motion-description">${motion.description}</p>
                
                ${motion.parameters && Object.keys(motion.parameters).length > 0 ? `
                    <div class="motion-parameters">
                        <h6>📊 Parameters:</h6>
                        <div class="params-list">
                            ${Object.entries(motion.parameters).map(([key, value]) => 
                                `<span class="param-item"><strong>${this.formatParameterName(key)}:</strong> ${value}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="motion-details">
                    <div class="detail-row">
                        <div class="detail-item">
                            <strong>Proposer:</strong> ${motion.proposer}
                        </div>
                        <div class="detail-item">
                            <strong>Status:</strong> ${motion.status.replace('_', ' ').toUpperCase()}
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-item">
                            <strong>Time Remaining:</strong> ${timeRemaining}
                        </div>
                        <div class="detail-item">
                            <strong>Support:</strong> ${supportPercentage}% (${totalVotes.for}/${totalVotes.total} votes)
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-item">
                            <strong>Required Support:</strong> ${Math.round(motion.minSupport * 100)}%
                        </div>
                        <div class="detail-item vote-breakdown">
                            <span class="vote-for">✅ ${totalVotes.for}</span>
                            <span class="vote-against">❌ ${totalVotes.against}</span>
                            <span class="vote-abstain">⚪ ${totalVotes.abstain}</span>
                        </div>
                    </div>
                </div>
                
                <div class="motion-voting">
                    ${this.renderVotingButtons(motion)}
                </div>
                
                ${motion.individualVotes && motion.individualVotes.size > 0 ? `
                    <div class="motion-votes-toggle">
                        <button class="toggle-btn" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                            👥 View Individual Votes (${motion.individualVotes.size})
                        </button>
                        <div class="individual-votes" style="display: none;">
                            ${Array.from(motion.individualVotes.entries()).map(([playerId, vote]) => {
                                const player = WorldForum?.getPlayerById(playerId);
                                const voteIcon = vote.vote === 'for' ? '✅' : vote.vote === 'against' ? '❌' : '⚪';
                                return `
                                    <div class="vote-entry">
                                        <span class="voter-name">${player?.username || 'Unknown'}</span>
                                        <span class="vote-choice">${voteIcon} ${vote.vote.toUpperCase()}</span>
                                        ${vote.justification ? `<div class="vote-reason">"${vote.justification}"</div>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Get motion vote totals
     */
    getMotionVoteTotals(motion) {
        let totals = { for: 0, against: 0, abstain: 0, total: 0 };
        
        if (motion.individualVotes) {
            for (const [playerId, vote] of motion.individualVotes.entries()) {
                totals[vote.vote]++;
                totals.total++;
            }
        }
        
        return totals;
    }
    
    /**
     * Render voting buttons for a motion
     */
    renderVotingButtons(motion) {
        if (motion.status !== 'faction_voting') {
            return '<p class="voting-closed">Voting period has ended.</p>';
        }
        
        const player = window.Player;
        const hasVoted = motion.individualVotes && motion.individualVotes.has(player.playerId);
        
        if (hasVoted) {
            const vote = motion.individualVotes.get(player.playerId);
            const voteIcon = vote.vote === 'for' ? '✅' : vote.vote === 'against' ? '❌' : '⚪';
            return `
                <div class="vote-status">
                    <p class="already-voted">
                        You voted: <strong>${voteIcon} ${vote.vote.toUpperCase()}</strong>
                    </p>
                    ${vote.justification ? `<p class="vote-justification"><em>"${vote.justification}"</em></p>` : ''}
                    <p class="vote-time">Voted ${new Date(vote.timestamp).toLocaleString()}</p>
                </div>
            `;
        }
        
        // Check voting permissions
        const canVote = this.canPlayerVoteOnMotion(player, motion);
        if (!canVote.allowed) {
            return `<div class="voting-denied"><p class="error-text">❌ ${canVote.reason}</p></div>`;
        }
        
        return `
            <div class="voting-interface">
                <div class="voting-buttons">
                    <button class="vote-btn for" onclick="WorldForumPanel.instance.showVoteDialog(${motion.id}, 'for')">
                        ✅ Vote For
                    </button>
                    <button class="vote-btn against" onclick="WorldForumPanel.instance.showVoteDialog(${motion.id}, 'against')">
                        ❌ Vote Against
                    </button>
                    <button class="vote-btn abstain" onclick="WorldForumPanel.instance.showVoteDialog(${motion.id}, 'abstain')">
                        ⚪ Abstain
                    </button>
                </div>
                <div class="voting-info">
                    <small class="vote-help">💡 You can optionally provide justification for your vote</small>
                </div>
            </div>
        `;
    }
    
    /**
     * Get faction display name
     */
    getFactionDisplayName(factionKey) {
        if (!factionKey) return 'No Faction';
        
        const customName = WorldForum?.colorNames?.get(factionKey);
        if (customName) return customName;
        
        if (window.GridMap?.FACTION_COLORS[factionKey]) {
            return GridMap.FACTION_COLORS[factionKey].name;
        }
        
        return factionKey;
    }
    
    /**
     * Format time remaining
     */
    formatTimeRemaining(ms) {
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }
    
    /**
     * Cast vote on motion
     */
    castVote(motionId, vote, justification = '') {
        if (!window.Player?.playerId) return;
        
        try {
            WorldForum.voteOnMotion(motionId, Player.playerId, vote, justification);
            this.refreshData();
            this.render();
        } catch (error) {
            alert('Error casting vote: ' + error.message);
        }
    }
    
    /**
     * Show vote dialog with justification option
     */
    showVoteDialog(motionId, vote) {
        const motion = WorldForum?.activeMotions?.get(motionId);
        if (!motion) return;
        
        const voteText = vote === 'for' ? 'FOR' : vote === 'against' ? 'AGAINST' : 'ABSTAIN';
        const voteIcon = vote === 'for' ? '✅' : vote === 'against' ? '❌' : '⚪';
        
        const justification = prompt(
            `${voteIcon} Voting ${voteText} on "${motion.title}"\n\n` +
            `Optional: Provide justification for your vote (will be visible to other players):`,
            ''
        );
        
        if (justification !== null) { // null means cancelled
            this.castVote(motionId, vote, justification);
        }
    }
    
    /**
     * Check if player can vote on motion
     */
    canPlayerVoteOnMotion(player, motion) {
        if (!player || !player.factionKey) {
            return { allowed: false, reason: 'Must be in a faction to vote' };
        }
        
        if (!player.canVoteInFaction || !player.canVoteInFaction()) {
            return { allowed: false, reason: 'Must be faction member for 24+ hours to vote' };
        }
        
        if (motion.scope === 'color') {
            if (!player.projectEffects?.worldForumAccess) {
                return { allowed: false, reason: 'Broadcasting Network required for color motions' };
            }
            if (motion.proposerFaction !== player.factionKey) {
                return { allowed: false, reason: 'Can only vote on motions from your faction' };
            }
        }
        
        if (motion.scope === 'world' && !player.wonderEffects?.globalVotingEnabled) {
            return { allowed: false, reason: 'Internet Wonder required for world motions' };
        }
        
        return { allowed: true, reason: '' };
    }
    
    /**
     * Switch view
     */
    switchView(view) {
        this.currentView = view;
        this.render();
    }
    
    /**
     * Show panel
     */
    show() {
        this.panel.style.display = 'block';
        this.refreshData();
        this.render();
    }
    
    /**
     * Hide panel
     */
    hide() {
        this.panel.style.display = 'none';
    }
    
    /**
     * Refresh data from World Forum system
     */
    refreshData() {
        if (window.Player?.playerId) {
            this.votingSummary = WorldForum?.getVotingSummary(Player.playerId);
        }
    }
    
    /**
     * Handle motion updates
     */
    handleMotionUpdate(data) {
        this.refreshData();
        this.render();
    }
    
    /**
     * Handle vote updates
     */
    handleVoteUpdate(data) {
        this.refreshData();
        this.render();
    }
    
    /**
     * Handle election updates
     */
    handleElectionUpdate(data) {
        this.refreshData();
        this.render();
    }
    
    /**
     * Handle color name update
     */
    handleColorNameUpdate(data) {
        this.refreshData();
        this.render();
    }
    
    /**
     * Show motion history
     */
    showMotionHistory() {
        const history = WorldForum?.getMotionHistory() || [];
        
        if (history.length === 0) {
            alert('No motion history available.');
            return;
        }
        
        // Create a simple history display
        const historyText = history.map(motion => 
            `Motion #${motion.id}: ${motion.title} - Status: ${motion.status.toUpperCase()}`
        ).join('\n');
        
        alert('Recent Motion History:\n\n' + historyText);
    }
    
    /**
     * Show congress information
     */
    showCongressInfo() {
        const congressInfo = WorldForum?.getCongressInfo() || {};
        
        if (!congressInfo.seats || congressInfo.seats.size === 0) {
            alert('No congressional information available.');
            return;
        }
        
        let infoText = 'Congressional Composition:\n\n';
        
        for (const [factionKey, seats] of congressInfo.seats.entries()) {
            const factionName = this.getFactionDisplayName(factionKey);
            const members = congressInfo.members.get(factionKey) || [];
            
            infoText += `${factionName}: ${seats} seat(s)\n`;
            if (members.length > 0) {
                infoText += `  Representatives: ${members.join(', ')}\n`;
            }
            infoText += '\n';
        }
        
        infoText += `Total Congressional Seats: ${congressInfo.totalSeats || 0}`;
        
        alert(infoText);
    }
    
    /**
     * Get voting statistics
     */
    getVotingStats() {
        const activeMotions = WorldForum?.getActiveMotions() || [];
        const player = window.Player;
        
        if (!player) return null;
        
        let stats = {
            totalMotions: activeMotions.length,
            canVoteOn: 0,
            hasVotedOn: 0,
            colorMotions: 0,
            worldMotions: 0
        };
        
        activeMotions.forEach(motion => {
            if (motion.scope === 'color') stats.colorMotions++;
            if (motion.scope === 'world') stats.worldMotions++;
            
            const canVote = this.canPlayerVoteOnMotion(player, motion);
            if (canVote.allowed) {
                stats.canVoteOn++;
                
                if (motion.individualVotes && motion.individualVotes.has(player.playerId)) {
                    stats.hasVotedOn++;
                }
            }
        });
        
        return stats;
    }
    
    /**
     * Render active effects for faction
     */
    renderActiveEffects(factionKey) {
        const effects = WorldForum?.getActiveEffects(factionKey) || [];
        const globalEffects = WorldForum?.getActiveEffects() || [];
        const worldEffects = globalEffects.filter(effect => effect.affectedFactions === 'all');
        
        const allEffects = [...effects, ...worldEffects];
        
        if (allEffects.length === 0) {
            return `
                <div class="effects-section">
                    <h5>⚡ Active Effects</h5>
                    <p class="no-effects">No active motion effects.</p>
                </div>
            `;
        }
        
        return `
            <div class="effects-section">
                <h5>⚡ Active Effects (${allEffects.length})</h5>
                <div class="effects-list">
                    ${allEffects.map(effect => this.renderEffectCard(effect)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render individual effect card
     */
    renderEffectCard(effect) {
        const isGlobal = effect.affectedFactions === 'all';
        const timeRemaining = effect.endTime ? this.formatTimeRemaining(effect.endTime - Date.now()) : 'Permanent';
        
        return `
            <div class="effect-card ${effect.type.toLowerCase()} ${isGlobal ? 'global' : 'faction'}">
                <div class="effect-header">
                    <div class="effect-title">
                        <span class="effect-type">${this.formatEffectType(effect.type)}</span>
                        <span class="effect-scope ${isGlobal ? 'global' : 'faction'}">${isGlobal ? '🌍 GLOBAL' : '🎨 FACTION'}</span>
                    </div>
                    ${effect.endTime ? `<span class="effect-time">${timeRemaining}</span>` : '<span class="effect-permanent">∞ Permanent</span>'}
                </div>
                <div class="effect-description">
                    ${this.getEffectDescription(effect)}
                </div>
                ${effect.parameters && Object.keys(effect.parameters).length > 0 ? `
                    <div class="effect-parameters">
                        ${Object.entries(effect.parameters).map(([key, value]) => 
                            `<span class="effect-param">${this.formatParameterName(key)}: <strong>${value}</strong></span>`
                        ).join('')}
                    </div>
                ` : ''}
                <div class="effect-meta">
                    <span class="effect-source">Motion #${effect.motionId}</span>
                    <span class="effect-started">Started: ${new Date(effect.startTime).toLocaleDateString()}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Format effect type for display
     */
    formatEffectType(type) {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Get effect description
     */
    getEffectDescription(effect) {
        const params = effect.parameters || {};
        
        switch (effect.type) {
            case 'COLOR_RESOURCE_BOOST':
                return `+${params.boostPercentage || 10}% ${params.resourceType || 'all'} resource production, -${params.damageReduction || 15}% damage taken`;
            case 'COLOR_EXPERIENCE_SURGE':
                return `+${params.xpBoostPercentage || 20}% XP gain, +${params.energyCostIncrease || 25}% energy costs`;
            case 'COLOR_ENERGY_REGENERATION':
                return `+${params.energyBoostPercentage || 15}% energy regen, -${params.happinessPenalty || 10}% happiness`;
            case 'COLOR_MILITARY_TRAINING':
                return `+${params.militaryBoostPercentage || 12}% military effectiveness, +${params.resourceCostIncrease || 20}% unit costs`;
            case 'COLOR_TRADE_NETWORK':
                return `+${params.tradeBoostPercentage || 15}% trade efficiency within faction`;
            case 'COLOR_TECH_SHARING':
                return `+${params.techBoostPercentage || 25}% research speed, +${params.securityPenalty || 20}% spy vulnerability`;
            case 'COLOR_INFRASTRUCTURE_PUSH':
                return `-${params.buildingCostReduction || 20}% building costs, -${params.populationGrowthPenalty || 15}% population growth`;
            case 'COLOR_DEFENSIVE_PACT':
                return `+${params.defensiveBonus || 25}% defense against external faction attacks`;
            case 'COLOR_ECONOMIC_STIMULUS':
                return `+${params.moneyBoostPercentage || 30}% income, +${params.inflationRate || 10}% costs over time`;
            case 'COLOR_HAPPINESS_CAMPAIGN':
                return `+${params.happinessBoost || 20}% happiness, -${params.productivityPenalty || 5}% productivity`;
            case 'WORLD_NUCLEAR_BAN':
                return `Nuclear weapons prohibited globally with ${params.penaltyType || 'immediate disarmament'} enforcement`;
            case 'WORLD_CALENDAR_CHANGE':
                return `Time multiplier: ${params.timeMultiplier || 1.0}x, Day length: ${params.dayLength || 24}h`;
            case 'WORLD_NAME_CHANGE':
                return `World renamed to "${params.newWorldName}"`;
            case 'WORLD_TRADE_REGULATION':
                return `Trade restrictions on ${params.tradeRestrictions || 'luxury goods'}, ${params.tariffRates || 15}% tariffs`;
            case 'WORLD_RESOURCE_EMBARGO':
                return `${params.resourceTypes || 'uranium'} trade embargo active${params.exemptFactions ? ` (exempt: ${params.exemptFactions})` : ''}`;
            case 'WORLD_MILITARY_LIMITATION':
                return `Military unit limits: ${params.unitTypeLimits || 'nuclear:0,bombers:10'}`;
            case 'WORLD_TECHNOLOGY_SHARING':
                return `Technology above level ${params.techThreshold || 80} shared at ${params.sharingRate || 25}% rate`;
            case 'WORLD_ENVIRONMENTAL_PROTECTION':
                return `Pollution limited to ${params.pollutionLimits || 50}%, -${params.productionPenalties || 20}% production`;
            case 'WORLD_PEACE_TREATY':
                return `All military conflicts suspended${params.exceptions ? ` (exempt: ${params.exceptions})` : ''}`;
            case 'WORLD_INFRASTRUCTURE_PROJECT':
                return `Global ${params.projectType || 'research center'} project: $${params.costPerNation || 1000000} per nation`;
            default:
                return 'Active motion effect';
        }
    }
    
    /**
     * Render color name voting section
     */
    renderColorNameVoting(factionKey) {
        const activeVote = WorldForum?.activeColorNameVotes?.get(factionKey);
        
        if (!activeVote) {
            return `
                <div class="color-name-section">
                    <p>No active color name voting.</p>
                    <button class="action-btn" onclick="WorldForumPanel.instance.startColorNameVote()">
                        🎨 Start Name Vote
                    </button>
                </div>
            `;
        }
        
        const hasVoted = activeVote.voters.has(window.Player?.playerId);
        const timeRemaining = this.formatTimeRemaining(activeVote.endTime - Date.now());
        
        return `
            <div class="color-name-voting">
                <p><strong>Active Color Name Vote</strong> - ${timeRemaining} remaining</p>
                <div class="name-options">
                    ${activeVote.options.map(option => `
                        <div class="name-option">
                            <button class="name-btn ${hasVoted ? 'disabled' : ''}" 
                                    onclick="WorldForumPanel.instance.voteColorName('${factionKey}', '${option.name}')"
                                    ${hasVoted ? 'disabled' : ''}>
                                ${option.name} (${option.votes} votes)
                            </button>
                        </div>
                    `).join('')}
                </div>
                ${hasVoted ? '<p class="voted-status">✅ You have voted</p>' : ''}
            </div>
        `;
    }
    
    /**
     * Render congressional elections section
     */
    renderCongressionalElections(factionKey) {
        const activeElection = WorldForum?.activeElections?.get(factionKey);
        
        if (!activeElection) {
            return `
                <div class="congressional-section">
                    <p>No active congressional elections.</p>
                    <p class="election-info">Elections are held monthly for congressional representatives.</p>
                </div>
            `;
        }
        
        const hasVoted = activeElection.voters.has(window.Player?.playerId);
        const timeRemaining = this.formatTimeRemaining(activeElection.endTime - Date.now());
        
        return `
            <div class="congressional-election">
                <p><strong>Congressional Election</strong> - ${timeRemaining} remaining</p>
                <p>Select up to ${activeElection.seatsToFill} candidates:</p>
                <div class="candidates-list">
                    ${activeElection.candidates.map(candidate => `
                        <div class="candidate-card">
                            <input type="checkbox" id="candidate-${candidate.playerId}" 
                                   value="${candidate.playerId}" ${hasVoted ? 'disabled' : ''}
                                   onchange="WorldForumPanel.instance.updateCandidateSelection()">
                            <label for="candidate-${candidate.playerId}">
                                <strong>${candidate.username}</strong>
                                <span class="vote-count">${candidate.votes} votes</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
                ${!hasVoted ? `
                    <button class="action-btn" onclick="WorldForumPanel.instance.submitCongressionalVote('${factionKey}')">
                        🗳️ Cast Congressional Vote
                    </button>
                ` : '<p class="voted-status">✅ You have voted</p>'}
            </div>
        `;
    }
    
    /**
     * Render global effects section
     */
    renderGlobalEffects() {
        const globalEffects = WorldForum?.getActiveEffects() || [];
        const worldEffects = globalEffects.filter(effect => effect.affectedFactions === 'all');
        
        if (worldEffects.length === 0) {
            return '<p class="no-effects">No active global effects.</p>';
        }
        
        return `
            <div class="global-effects">
                <div class="global-effects-header">
                    <h6>🌍 Active Global Effects (${worldEffects.length})</h6>
                    <p class="global-info">These effects apply to all nations worldwide</p>
                </div>
                ${worldEffects.map(effect => `
                    <div class="global-effect-card">
                        <div class="effect-header">
                            <span class="effect-name">${this.formatEffectType(effect.type)}</span>
                            ${effect.endTime ? `<span class="effect-duration">${this.formatTimeRemaining(effect.endTime - Date.now())}</span>` : '<span class="effect-permanent">∞ Permanent</span>'}
                        </div>
                        <div class="effect-impact">
                            ${this.getEffectDescription(effect)}
                        </div>
                        <div class="effect-source">
                            <small>Source: Motion #${effect.motionId} • Started: ${new Date(effect.startTime).toLocaleDateString()}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Render voting card for motions
     */
    renderVotingCard(motion) {
        const timeRemaining = motion.factionVotingEnd > Date.now() ? 
            this.formatTimeRemaining(motion.factionVotingEnd - Date.now()) : 'Ended';
        
        return `
            <div class="voting-card">
                <div class="vote-header">
                    <h6>${motion.title}</h6>
                    <span class="vote-scope ${motion.scope}">${motion.scope.toUpperCase()}</span>
                </div>
                <p class="vote-description">${motion.description}</p>
                <div class="vote-meta">
                    <span class="time-remaining">${timeRemaining}</span>
                    <span class="support-needed">Needs ${Math.round(motion.minSupport * 100)}% support</span>
                </div>
                <div class="voting-actions">
                    ${this.renderVotingButtons(motion)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render election voting card
     */
    renderElectionVotingCard(election) {
        const timeRemaining = this.formatTimeRemaining(election.endTime - Date.now());
        const hasVoted = election.voters.has(window.Player?.playerId);
        
        return `
            <div class="election-voting-card">
                <h6>Congressional Election - ${this.getFactionDisplayName(election.factionKey)}</h6>
                <p>Choose ${election.seatsToFill} representatives from ${election.candidates.length} candidates</p>
                <div class="election-meta">
                    <span class="time-remaining">${timeRemaining}</span>
                    <span class="voter-count">${election.voters.size} votes cast</span>
                </div>
                ${hasVoted ? 
                    '<p class="voted-status">✅ You have voted in this election</p>' :
                    '<button class="action-btn" onclick="WorldForumPanel.instance.switchView(\'color-forum\')">Vote Now</button>'
                }
            </div>
        `;
    }
    
    /**
     * Render color name voting card
     */
    renderColorNameVotingCard(vote) {
        const timeRemaining = this.formatTimeRemaining(vote.endTime - Date.now());
        const hasVoted = vote.voters.has(window.Player?.playerId);
        
        return `
            <div class="name-voting-card">
                <h6>Color Name Vote - ${this.getFactionDisplayName(vote.factionKey)}</h6>
                <p>Choose your faction's new name from ${vote.options.length} options</p>
                <div class="vote-meta">
                    <span class="time-remaining">${timeRemaining}</span>
                    <span class="voter-count">${vote.voters.size} votes cast</span>
                </div>
                ${hasVoted ? 
                    '<p class="voted-status">✅ You have voted for a new name</p>' :
                    '<button class="action-btn" onclick="WorldForumPanel.instance.switchView(\'color-forum\')">Vote Now</button>'
                }
            </div>
        `;
    }
    
    /**
     * Render motion template
     */
    renderMotionTemplate(template) {
        return `
            <div class="motion-template ${this.selectedMotionType === template.type ? 'selected' : ''}"
                 onclick="WorldForumPanel.instance.selectMotionType('${template.type}')">
                <h6>${template.name}</h6>
                <p class="template-description">${template.description}</p>
                <div class="template-meta">
                    <span class="template-scope ${template.scope}">${template.scope.toUpperCase()}</span>
                    <span class="template-support">Needs ${Math.round(template.minSupport * 100)}%</span>
                </div>
                ${template.effects ? `<p class="template-effects">${template.effects}</p>` : ''}
            </div>
        `;
    }
    
    /**
     * Render motion proposal form
     */
    renderMotionForm() {
        const template = WorldForum?.motionTypes[this.selectedMotionType];
        if (!template) return '';
        
        return `
            <div class="motion-form">
                <div class="form-header">
                    <h5>📝 Propose: ${template.name}</h5>
                    <div class="form-meta">
                        <span class="form-scope ${template.scope}">${template.scope.toUpperCase()}</span>
                        <span class="form-support">Needs ${Math.round(template.minSupport * 100)}% support</span>
                    </div>
                </div>
                
                <div class="form-content">
                    <div class="form-group">
                        <label for="wf-motion-title">Motion Title:</label>
                        <input type="text" id="wf-motion-title" placeholder="${template.name}" value="${template.name}" maxlength="100">
                        <small class="input-help">Brief, descriptive title for the motion</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="wf-motion-description">Description:</label>
                        <textarea id="wf-motion-description" rows="4" placeholder="${template.description}" maxlength="500">${template.description}</textarea>
                        <small class="input-help">Detailed explanation of the motion's purpose and goals</small>
                    </div>
                    
                    ${template.parameters && template.parameters.length > 0 ? `
                        <div class="parameters-section">
                            <h6>📊 Motion Parameters</h6>
                            <div class="parameters-grid">
                                ${template.parameters.map(param => this.renderParameterInput(param, template.type)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="motion-preview">
                        <h6>📋 Motion Summary</h6>
                        <div class="preview-content">
                            <p><strong>Type:</strong> ${template.name}</p>
                            <p><strong>Scope:</strong> ${template.scope === 'color' ? 'Your Color Bloc' : 'Global (All Players)'}</p>
                            <p><strong>Support Required:</strong> ${Math.round(template.minSupport * 100)}% of eligible voters</p>
                            ${template.effects ? `<p><strong>Expected Effects:</strong> ${template.effects}</p>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="action-btn primary" onclick="WorldForumPanel.instance.submitMotion()">
                        🚀 Submit Motion
                    </button>
                    <button class="action-btn secondary" onclick="WorldForumPanel.instance.cancelMotion()">
                        ❌ Cancel
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render parameter input
     */
    renderParameterInput(param, motionType) {
        const defaultValues = this.getDefaultParameterValue(param, motionType);
        const inputType = this.getParameterInputType(param);
        
        return `
            <div class="parameter-group">
                <label for="param-${param}">${this.formatParameterName(param)}:</label>
                ${inputType === 'select' ? this.renderParameterSelect(param, defaultValues) : `
                    <input type="${inputType}" id="param-${param}" 
                           placeholder="${defaultValues.placeholder}" 
                           value="${defaultValues.value}"
                           ${inputType === 'number' ? `min="${defaultValues.min || 0}" max="${defaultValues.max || 100}" step="${defaultValues.step || 1}"` : ''}
                           ${defaultValues.pattern ? `pattern="${defaultValues.pattern}"` : ''}>
                `}
                ${defaultValues.help ? `<small class="param-help">${defaultValues.help}</small>` : ''}
            </div>
        `;
    }
    
    /**
     * Get parameter input type
     */
    getParameterInputType(param) {
        const numberParams = ['boostPercentage', 'damageReduction', 'xpBoostPercentage', 
                              'energyCostIncrease', 'timeMultiplier', 'dayLength', 
                              'monthLength', 'yearLength', 'tariffRates'];
        const selectParams = ['resourceType', 'penaltyType', 'projectType'];
        
        if (numberParams.includes(param)) return 'number';
        if (selectParams.includes(param)) return 'select';
        return 'text';
    }
    
    /**
     * Render parameter select dropdown
     */
    renderParameterSelect(param, defaultValues) {
        let options = [];
        
        switch (param) {
            case 'resourceType':
                options = ['all', 'food', 'water', 'steel', 'oil', 'uranium', 'electronics'];
                break;
            case 'penaltyType':
                options = ['immediate_disarmament', 'progressive_sanctions', 'diplomatic_pressure'];
                break;
            case 'projectType':
                options = ['global_research_center', 'world_trade_network', 'planetary_defense_system'];
                break;
        }
        
        return `
            <select id="param-${param}">
                ${options.map(option => 
                    `<option value="${option}" ${option === defaultValues.value ? 'selected' : ''}>
                        ${option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>`
                ).join('')}
            </select>
        `;
    }
    
    /**
     * Get default parameter value
     */
    getDefaultParameterValue(param, motionType) {
        const defaults = {
            // Color motion defaults
            'resourceType': { value: 'all', placeholder: 'all, food, water, steel, etc.', help: 'Which resources to boost' },
            'boostPercentage': { value: '10', placeholder: '10', help: 'Percentage increase (1-50)', min: 1, max: 50, step: 1 },
            'damageReduction': { value: '15', placeholder: '15', help: 'Damage reduction percentage (1-50)', min: 1, max: 50, step: 1 },
            'xpBoostPercentage': { value: '20', placeholder: '20', help: 'XP gain increase (1-100)', min: 1, max: 100, step: 1 },
            'energyCostIncrease': { value: '25', placeholder: '25', help: 'Energy cost increase (1-100)', min: 1, max: 100, step: 1 },
            'energyBoostPercentage': { value: '15', placeholder: '15', help: 'Energy regen increase (1-50)', min: 1, max: 50, step: 1 },
            'happinessPenalty': { value: '10', placeholder: '10', help: 'Happiness decrease (1-30)', min: 1, max: 30, step: 1 },
            'militaryBoostPercentage': { value: '12', placeholder: '12', help: 'Military effectiveness increase (1-40)', min: 1, max: 40, step: 1 },
            'resourceCostIncrease': { value: '20', placeholder: '20', help: 'Unit cost increase (1-100)', min: 1, max: 100, step: 1 },
            'tradeBoostPercentage': { value: '15', placeholder: '15', help: 'Trade efficiency increase (1-50)', min: 1, max: 50, step: 1 },
            'techBoostPercentage': { value: '25', placeholder: '25', help: 'Research speed increase (1-75)', min: 1, max: 75, step: 1 },
            'securityPenalty': { value: '20', placeholder: '20', help: 'Spy vulnerability increase (1-50)', min: 1, max: 50, step: 1 },
            'buildingCostReduction': { value: '20', placeholder: '20', help: 'Building cost reduction (1-50)', min: 1, max: 50, step: 1 },
            'populationGrowthPenalty': { value: '15', placeholder: '15', help: 'Population growth decrease (1-30)', min: 1, max: 30, step: 1 },
            'defensiveBonus': { value: '25', placeholder: '25', help: 'Defensive strength increase (1-100)', min: 1, max: 100, step: 1 },
            'moneyBoostPercentage': { value: '30', placeholder: '30', help: 'Income increase (1-100)', min: 1, max: 100, step: 1 },
            'inflationRate': { value: '10', placeholder: '10', help: 'Cost increase over time (1-25)', min: 1, max: 25, step: 1 },
            'happinessBoost': { value: '20', placeholder: '20', help: 'Happiness increase (1-50)', min: 1, max: 50, step: 1 },
            'productivityPenalty': { value: '5', placeholder: '5', help: 'Productivity decrease (1-15)', min: 1, max: 15, step: 1 },
            'duration': { value: '2 weeks', placeholder: '2 weeks', help: 'e.g., "1 week", "2 weeks", "1 month"', pattern: '^[0-9]+ (week|weeks|month|months)$' },
            
            // World motion defaults
            'newWorldName': { value: '', placeholder: 'New World Name', help: 'Choose a new name for the game world' },
            'timeMultiplier': { value: '1.0', placeholder: '1.0', help: 'Time speed multiplier (0.1-5.0)', min: 0.1, max: 5.0, step: 0.1 },
            'dayLength': { value: '24', placeholder: '24', help: 'Hours in a game day (12-48)', min: 12, max: 48, step: 1 },
            'monthLength': { value: '30', placeholder: '30', help: 'Days in a month (7-60)', min: 7, max: 60, step: 1 },
            'yearLength': { value: '365', placeholder: '365', help: 'Days in a year (100-1000)', min: 100, max: 1000, step: 1 },
            'resetCalendar': { value: 'false', placeholder: 'false', help: 'Reset calendar to year 1? (true/false)' },
            'penaltyType': { value: 'immediate_disarmament', placeholder: 'immediate_disarmament', help: 'Type of nuclear ban enforcement' },
            'tradeRestrictions': { value: 'luxury_goods', placeholder: 'luxury_goods', help: 'Types of trade to restrict' },
            'tariffRates': { value: '15', placeholder: '15', help: 'Tariff percentage (1-50)', min: 1, max: 50, step: 1 },
            'resourceTypes': { value: 'uranium', placeholder: 'uranium', help: 'Resources to embargo (comma-separated)' },
            'exemptFactions': { value: '', placeholder: 'none', help: 'Factions exempt from embargo' },
            'unitTypeLimits': { value: 'nuclear:0,bombers:10', placeholder: 'nuclear:0,bombers:10', help: 'Unit limits (type:count,type:count)' },
            'exemptions': { value: '', placeholder: 'none', help: 'Nations exempt from limits' },
            'techThreshold': { value: '80', placeholder: '80', help: 'Technology level threshold (1-100)', min: 1, max: 100, step: 1 },
            'sharingRate': { value: '25', placeholder: '25', help: 'Percentage of tech to share (1-50)', min: 1, max: 50, step: 1 },
            'pollutionLimits': { value: '50', placeholder: '50', help: 'Maximum pollution level (1-100)', min: 1, max: 100, step: 1 },
            'productionPenalties': { value: '20', placeholder: '20', help: 'Production penalty percentage (1-50)', min: 1, max: 50, step: 1 },
            'exceptions': { value: '', placeholder: 'none', help: 'Nations exempt from peace treaty' },
            'projectType': { value: 'global_research_center', placeholder: 'global_research_center', help: 'Type of world project' },
            'costPerNation': { value: '1000000', placeholder: '1000000', help: 'Cost per nation in dollars', min: 100000, max: 10000000, step: 100000 },
            'benefits': { value: 'research_boost', placeholder: 'research_boost', help: 'Benefits provided by project' }
        };
        
        return defaults[param] || { value: '', placeholder: param, help: '' };
    }
    
    /**
     * Format parameter name for display
     */
    formatParameterName(param) {
        return param.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    
    /**
     * Select motion type
     */
    selectMotionType(type) {
        this.selectedMotionType = type;
        this.render();
    }
    
    /**
     * Submit motion proposal
     */
    submitMotion() {
        if (!this.selectedMotionType || !window.Player?.playerId) return;
        
        const titleInput = document.getElementById('wf-motion-title');
        const descriptionInput = document.getElementById('wf-motion-description');
        
        const title = titleInput?.value.trim() || '';
        const description = descriptionInput?.value.trim() || '';
        
        // Validate required fields
        if (!title) {
            alert('Please provide a motion title.');
            titleInput?.focus();
            return;
        }
        
        if (!description) {
            alert('Please provide a motion description.');
            descriptionInput?.focus();
            return;
        }
        
        // Collect and validate parameters
        const template = WorldForum?.motionTypes[this.selectedMotionType];
        const parameters = {};
        let validationErrors = [];
        
        if (template?.parameters) {
            template.parameters.forEach(param => {
                const input = document.getElementById(`param-${param}`);
                if (input) {
                    const value = input.value.trim();
                    
                    // Validate required parameters
                    if (!value && this.isParameterRequired(param)) {
                        validationErrors.push(`${this.formatParameterName(param)} is required.`);
                        return;
                    }
                    
                    // Validate parameter format
                    const validation = this.validateParameter(param, value);
                    if (!validation.valid) {
                        validationErrors.push(validation.error);
                        return;
                    }
                    
                    parameters[param] = value;
                }
            });
        }
        
        // Show validation errors
        if (validationErrors.length > 0) {
            alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
            return;
        }
        
        const motionData = {
            title: title,
            description: description,
            parameters: parameters
        };
        
        try {
            const result = WorldForum.proposeMotion(Player.playerId, this.selectedMotionType, motionData);
            alert('Motion submitted successfully!\n\nMotion ID: ' + result);
            this.selectedMotionType = null;
            this.switchView('voting');
        } catch (error) {
            alert('Error submitting motion: ' + error.message);
        }
    }
    
    /**
     * Check if parameter is required
     */
    isParameterRequired(param) {
        const optionalParams = ['exemptFactions', 'exemptions', 'exceptions', 'resetCalendar'];
        return !optionalParams.includes(param);
    }
    
    /**
     * Validate parameter value
     */
    validateParameter(param, value) {
        if (!value) return { valid: true }; // Empty values handled by isParameterRequired
        
        const defaults = this.getDefaultParameterValue(param);
        
        // Validate numeric parameters
        if (defaults.min !== undefined || defaults.max !== undefined) {
            const num = parseFloat(value);
            if (isNaN(num)) {
                return { valid: false, error: `${this.formatParameterName(param)} must be a number.` };
            }
            if (defaults.min !== undefined && num < defaults.min) {
                return { valid: false, error: `${this.formatParameterName(param)} must be at least ${defaults.min}.` };
            }
            if (defaults.max !== undefined && num > defaults.max) {
                return { valid: false, error: `${this.formatParameterName(param)} must be at most ${defaults.max}.` };
            }
        }
        
        // Validate pattern parameters
        if (defaults.pattern) {
            const regex = new RegExp(defaults.pattern);
            if (!regex.test(value)) {
                return { valid: false, error: `${this.formatParameterName(param)} has invalid format. ${defaults.help}` };
            }
        }
        
        // Special validations
        if (param === 'newWorldName' && (value.length < 3 || value.length > 50)) {
            return { valid: false, error: 'World name must be between 3 and 50 characters.' };
        }
        
        return { valid: true };
    }
    
    /**
     * Cancel motion proposal
     */
    cancelMotion() {
        this.selectedMotionType = null;
        this.render();
    }
    
    /**
     * Start color name vote
     */
    startColorNameVote() {
        const proposedNames = prompt('Enter 2-4 name options separated by commas:');
        if (!proposedNames) return;
        
        const names = proposedNames.split(',').map(name => name.trim()).filter(name => name.length > 0);
        if (names.length < 2) {
            alert('Please provide at least 2 name options.');
            return;
        }
        
        try {
            WorldForum.startColorNameVote(Player.factionKey, names);
            this.render();
        } catch (error) {
            alert('Error starting color name vote: ' + error.message);
        }
    }
    
    /**
     * Vote on color name
     */
    voteColorName(factionKey, selectedName) {
        if (!window.Player?.playerId) return;
        
        try {
            WorldForum.voteOnColorName(factionKey, Player.playerId, selectedName);
            this.render();
        } catch (error) {
            alert('Error voting on color name: ' + error.message);
        }
    }
    
    /**
     * Update candidate selection for congressional voting
     */
    updateCandidateSelection() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="candidate-"]');
        const selected = Array.from(checkboxes).filter(cb => cb.checked);
        
        // Limit selection to available seats
        const activeElection = WorldForum?.activeElections?.get(Player.factionKey);
        if (activeElection && selected.length > activeElection.seatsToFill) {
            // Uncheck the last selected
            selected[selected.length - 1].checked = false;
            alert(`You can only select up to ${activeElection.seatsToFill} candidates.`);
        }
    }
    
    /**
     * Submit congressional vote
     */
    submitCongressionalVote(factionKey) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="candidate-"]:checked');
        const selectedCandidates = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedCandidates.length === 0) {
            alert('Please select at least one candidate.');
            return;
        }
        
        try {
            WorldForum.voteInCongressionalElection(factionKey, Player.playerId, selectedCandidates);
            this.render();
        } catch (error) {
            alert('Error voting in congressional election: ' + error.message);
        }
    }
}

// Initialize World Forum Panel
WorldForumPanel.instance = new WorldForumPanel();