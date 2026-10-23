class PopulationPanel {
    constructor() {
        this.isInitialized = false;
        this.currentTab = 'overview';
    }

    /**
     * Initialize the population panel
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.isInitialized = true;
        console.log('PopulationPanel initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('population_situation_triggered', this.handleSituationTriggered, this);
        EventBus.on('population_choice_made', this.handleChoiceMade, this);
        EventBus.on('population_effect_expired', this.handleEffectExpired, this);
        EventBus.on('annual_census_completed', this.handleCensusCompleted, this);
        EventBus.on('annual_population_report', this.handleAnnualReport, this);
        EventBus.on(GameEvents.DAY_PASSED, this.refresh, this);
    }

    /**
     * Render the population panel
     */
    render() {
        if (!window.PopulationSystem || typeof window.PopulationSystem.getPopulationOverview !== 'function') {
            return '<div class="error" style="padding:16px;opacity:0.7;">Population System is initializing — please wait a moment and refresh.</div>';
        }

        return `
            <div class="population-panel">
                <div class="population-header">
                    <h2>Population Management</h2>
                    <div class="population-tabs">
                        <button class="tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" 
                                onclick="PopulationPanel.switchTab('overview')">Overview</button>
                        <button class="tab-btn ${this.currentTab === 'demographics' ? 'active' : ''}" 
                                onclick="PopulationPanel.switchTab('demographics')">Demographics</button>
                        <button class="tab-btn ${this.currentTab === 'employment' ? 'active' : ''}" 
                                onclick="PopulationPanel.switchTab('employment')">Employment</button>
                        <button class="tab-btn ${this.currentTab === 'education' ? 'active' : ''}" 
                                onclick="PopulationPanel.switchTab('education')">Education</button>
                        <button class="tab-btn ${this.currentTab === 'policies' ? 'active' : ''}" 
                                onclick="PopulationPanel.switchTab('policies')">Policies</button>
                        <button class="tab-btn ${this.currentTab === 'situations' ? 'active' : ''}" 
                                onclick="PopulationPanel.switchTab('situations')">Situations</button>
                    </div>
                </div>
                <div class="population-content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    }

    /**
     * Render content for current tab
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'overview':
                return this.renderOverview();
            case 'demographics':
                return this.renderDemographics();
            case 'employment':
                return this.renderEmployment();
            case 'education':
                return this.renderEducation();
            case 'policies':
                return this.renderPolicies();
            case 'situations':
                return this.renderSituations();
            default:
                return '<div>Tab not found</div>';
        }
    }

    /**
     * Render overview tab
     */
    renderOverview() {
        const overview = window.PopulationSystem.getPopulationOverview();
        
        return `
            <div class="overview-tab">
                <div class="population-summary">
                    <h3>Population Summary</h3>
                    <div class="summary-cards">
                        <div class="summary-card">
                            <div class="card-icon">👥</div>
                            <div class="card-content">
                                <div class="card-value">${this.formatNumber(overview.totalPopulation)}</div>
                                <div class="card-label">Total Population</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="card-icon">💼</div>
                            <div class="card-content">
                                <div class="card-value">${overview.employment.unemploymentRate}%</div>
                                <div class="card-label">Unemployment Rate</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="card-icon">📚</div>
                            <div class="card-content">
                                <div class="card-value">${overview.education.higher}%</div>
                                <div class="card-label">Higher Education</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="card-icon">📈</div>
                            <div class="card-content">
                                <div class="card-value">${overview.vitalStatistics.naturalGrowthRate}%</div>
                                <div class="card-label">Natural Growth Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="vital-statistics">
                    <h3>Vital Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Birth Rate:</span>
                            <span class="stat-value">${overview.vitalStatistics.birthRate}% annually</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Death Rate:</span>
                            <span class="stat-value">${overview.vitalStatistics.deathRate}% annually</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Migration Policy:</span>
                            <span class="stat-value">${this.capitalize(overview.vitalStatistics.migrationPolicy)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Labor Participation:</span>
                            <span class="stat-value">${overview.employment.laborParticipation}%</span>
                        </div>
                    </div>
                </div>
                
                ${this.renderActiveSituation(overview.activeSituation)}
                ${this.renderActiveEffects(overview.activeEffects)}
            </div>
        `;
    }

    /**
     * Render active situation
     */
    renderActiveSituation(situation) {
        if (!situation) return '';
        
        return `
            <div class="active-situation">
                <h3>⚠️ Population Situation</h3>
                <div class="situation-card">
                    <h4>${situation.title}</h4>
                    <p>${situation.description}</p>
                    
                    <div class="situation-choices">
                        <h5>Choose your response:</h5>
                        ${situation.choices.map((choice, index) => `
                            <div class="choice-option">
                                <button class="choice-btn" onclick="PopulationPanel.makeChoice(${index})">
                                    ${choice.text}
                                </button>
                                <div class="choice-effects">
                                    ${this.renderChoiceEffects(choice.effects, choice.duration)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="situation-timer">
                        <small>This situation will expire if not addressed within 7 days</small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render choice effects preview
     */
    renderChoiceEffects(effects, duration) {
        return `
            <div class="effects-preview">
                <small>Effects (${duration} days):</small>
                ${Object.entries(effects).map(([effect, value]) => {
                    const sign = value > 0 ? '+' : '';
                    const color = value > 0 ? 'positive' : 'negative';
                    return `<span class="effect ${color}">${this.capitalize(effect)}: ${sign}${value}</span>`;
                }).join(' ')}
            </div>
        `;
    }

    /**
     * Render active effects
     */
    renderActiveEffects(effects) {
        if (!effects || effects.length === 0) return '';
        
        return `
            <div class="active-effects">
                <h3>Active Population Effects</h3>
                <div class="effects-list">
                    ${effects.map(effect => `
                        <div class="effect-item">
                            <div class="effect-title">${effect.situationTitle}</div>
                            <div class="effect-choice">${effect.choiceText}</div>
                            <div class="effect-duration">
                                Expires on day ${effect.endDay}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    /**
     * Render demographics tab
     */
    renderDemographics() {
        const overview = window.PopulationSystem.getPopulationOverview();
        
        return `
            <div class="demographics-tab">
                <h3>Age Distribution</h3>
                <div class="age-distribution">
                    <div class="demographics-chart">
                        ${overview.ageDistribution.map(group => `
                            <div class="age-group-bar">
                                <div class="age-group-label">
                                    <span class="group-name">${this.getAgeGroupDisplayName(group.ageGroup)}</span>
                                    <span class="group-range">${group.ageRange}</span>
                                </div>
                                <div class="age-group-stats">
                                    <div class="population-count">${this.formatNumber(group.count)}</div>
                                    <div class="population-percent">${(group.percentage * 100).toFixed(1)}%</div>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${Math.min(100, group.percentage * 100 * 5)}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <h3>Territorial Distribution</h3>
                <div class="territorial-breakdown">
                    ${this.renderTerritorialBreakdown(overview.territorialBreakdown)}
                </div>
                
                <h3>Population Trends</h3>
                <div class="population-trends">
                    <div class="trend-cards">
                        <div class="trend-card">
                            <h4>Birth Trends</h4>
                            <div class="trend-value positive">+${overview.vitalStatistics.birthRate}% annually</div>
                            <div class="trend-factors">
                                <small>Affected by happiness, disease, and policies</small>
                            </div>
                        </div>
                        
                        <div class="trend-card">
                            <h4>Death Trends</h4>
                            <div class="trend-value negative">-${overview.vitalStatistics.deathRate}% annually</div>
                            <div class="trend-factors">
                                <small>Affected by age distribution, disease, and healthcare</small>
                            </div>
                        </div>
                        
                        <div class="trend-card">
                            <h4>Migration</h4>
                            <div class="trend-value neutral">${this.capitalize(overview.vitalStatistics.migrationPolicy)}</div>
                            <div class="trend-factors">
                                <small>Policy: ${overview.vitalStatistics.migrationPolicy}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render territorial breakdown
     */
    renderTerritorialBreakdown(territories) {
        return `
            <div class="territories-grid">
                ${Object.entries(territories).map(([territoryId, data]) => `
                    <div class="territory-card">
                        <h4>${this.capitalize(territoryId)}</h4>
                        <div class="territory-stats">
                            <div class="stat-row">
                                <span>Population:</span>
                                <span>${this.formatNumber(data.population)}</span>
                            </div>
                            <div class="stat-row">
                                <span>Capacity:</span>
                                <span>${this.formatNumber(data.capacity)}</span>
                            </div>
                            <div class="stat-row">
                                <span>Density:</span>
                                <span>${data.density.toFixed(2)}</span>
                            </div>
                            <div class="stat-row">
                                <span>Happiness:</span>
                                <span class="${data.happiness >= 50 ? 'positive' : 'negative'}">${data.happiness}%</span>
                            </div>
                        </div>
                        <div class="density-bar">
                            <div class="density-fill" style="width: ${Math.min(100, data.density * 100)}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render employment tab
     */
    renderEmployment() {
        const overview = window.PopulationSystem.getPopulationOverview();
        
        return `
            <div class="employment-tab">
                <h3>Employment Overview</h3>
                <div class="employment-summary">
                    <div class="employment-cards">
                        <div class="employment-card">
                            <div class="card-header">
                                <h4>Workforce</h4>
                                <span class="card-value">${this.formatNumber(overview.employment.workforce)}</span>
                            </div>
                            <div class="breakdown">
                                <div class="breakdown-item">
                                    <span>Employed:</span>
                                    <span class="positive">${this.formatNumber(overview.employment.employed)}</span>
                                </div>
                                <div class="breakdown-item">
                                    <span>Unemployed:</span>
                                    <span class="negative">${this.formatNumber(overview.employment.unemployed)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="employment-card">
                            <div class="card-header">
                                <h4>Unemployment Rate</h4>
                                <span class="card-value ${parseFloat(overview.employment.unemploymentRate) <= 5 ? 'positive' : 'negative'}">${overview.employment.unemploymentRate}%</span>
                            </div>
                            <div class="breakdown">
                                <div class="rate-indicator">
                                    <div class="rate-bar">
                                        <div class="rate-fill" style="width: ${Math.min(100, parseFloat(overview.employment.unemploymentRate) * 2)}%"></div>
                                    </div>
                                    <small>Target: ≤5%</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="employment-card">
                            <div class="card-header">
                                <h4>Labor Participation</h4>
                                <span class="card-value">${overview.employment.laborParticipation}%</span>
                            </div>
                            <div class="breakdown">
                                <div class="rate-indicator">
                                    <div class="rate-bar">
                                        <div class="rate-fill" style="width: ${parseFloat(overview.employment.laborParticipation)}%"></div>
                                    </div>
                                    <small>Working age participation</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h3>Employment by Sector</h3>
                <div class="employment-sectors">
                    ${this.renderEmploymentSectors()}
                </div>
                
                <h3>Employment Factors</h3>
                <div class="employment-factors">
                    <div class="factor-list">
                        <div class="factor-item">
                            <h4>Improvements Built</h4>
                            <p>Each improvement type provides employment opportunities for citizens</p>
                            ${this.renderImprovementEmployment()}
                        </div>
                        <div class="factor-item">
                            <h4>Military Service</h4>
                            <p>Military units employ citizens and affect job availability</p>
                            ${this.renderMilitaryEmployment()}
                        </div>
                        <div class="factor-item">
                            <h4>Happiness Effect</h4>
                            <p>Citizen happiness affects willingness to work and productivity</p>
                            <div class="happiness-employment">
                                Happiness: ${window.Nation ? window.Nation.happiness : 50}% 
                                (${window.Nation && window.Nation.happiness >= 50 ? 'Positive' : 'Negative'} employment impact)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render employment sectors
     */
    renderEmploymentSectors() {
        const employmentSlots = this.getEmploymentSlots();
        
        return `
            <div class="sectors-grid">
                ${Object.entries(employmentSlots.byType).map(([sector, slots]) => `
                    <div class="sector-card">
                        <h4>${this.capitalize(sector)}</h4>
                        <div class="sector-slots">${this.formatNumber(slots)} positions</div>
                        <div class="sector-bar">
                            <div class="sector-fill" style="width: ${Math.min(100, (slots / employmentSlots.totalSlots) * 100)}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get employment slots breakdown — pulls real data from PopulationSystem if available
     */
    getEmploymentSlots() {
        if (window.PopulationSystem && typeof window.PopulationSystem.getImprovementEmploymentSlots === 'function') {
            return window.PopulationSystem.getImprovementEmploymentSlots();
        }
        // Fallback: read directly from nation improvements
        if (window.Nation && window.Nation.improvements) {
            const impr = window.Nation.improvements;
            const industrial = (impr.factory || 0) * 200 + (impr.mine || 0) * 150 + (impr.assemblyPlant || 0) * 250;
            const service    = (impr.hospital || 0) * 100 + (impr.school || 0) * 80 + (impr.park || 0) * 50;
            const government = (impr.embassy || 0) * 30 + (impr.internalAffairsOffice || 0) * 35;
            const military   = (impr.barracks || 0) * 100 + (impr.airforceBase || 0) * 150 + (impr.harbor || 0) * 120;
            return {
                totalSlots: 1000 + industrial + service + government + military,
                byType: { industrial, service, government, military }
            };
        }
        return {
            totalSlots: 5000,
            byType: { industrial: 2000, service: 1500, government: 800, military: 700 }
        };
    }

    /**
     * Render improvement employment
     */
    renderImprovementEmployment() {
        if (!window.Nation || !window.Nation.improvements) {
            return '<div class="no-data">No improvement data available</div>';
        }
        
        const improvements = window.Nation.improvements;
        const employmentImprovements = [
            { name: 'Factories', count: improvements.factory || 0, jobs: 200 },
            { name: 'Mines', count: improvements.mine || 0, jobs: 150 },
            { name: 'Assembly Plants', count: improvements.assemblyPlant || 0, jobs: 250 },
            { name: 'Hospitals', count: improvements.hospital || 0, jobs: 100 },
            { name: 'Schools', count: improvements.school || 0, jobs: 80 }
        ];
        
        return `
            <div class="improvement-employment">
                ${employmentImprovements.map(imp => `
                    <div class="improvement-row">
                        <span>${imp.name}: ${imp.count}</span>
                        <span class="employment-contribution">+${this.formatNumber(imp.count * imp.jobs)} jobs</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render military employment
     */
    renderMilitaryEmployment() {
        if (!window.Nation) {
            return '<div class="no-data">No military data available</div>';
        }
        
        // militaryUnits is the correct property name on Nation
        const military = window.Nation.militaryUnits || window.Nation.military || {};
        const militaryJobs = (military.soldiers || 0) + (military.tanks || 0) + 
                           (military.aircraft || 0) + (military.ships || 0) + (military.spies || 0);
        
        return `
            <div class="military-employment">
                <div class="military-stats">
                    <span>Military Personnel: ${this.formatNumber(militaryJobs)}</span>
                    <span class="employment-impact">
                        ${militaryJobs > 0 ? 'Reduces civilian unemployment' : 'No military employment'}
                    </span>
                </div>
            </div>
        `;
    }
    /**
     * Render education tab
     */
    renderEducation() {
        const overview = window.PopulationSystem.getPopulationOverview();
        
        return `
            <div class="education-tab">
                <h3>Education Levels</h3>
                <div class="education-distribution">
                    <div class="education-chart">
                        <div class="education-level">
                            <div class="level-info">
                                <span class="level-name">No Education</span>
                                <span class="level-percent">${overview.education.noEducation}%</span>
                            </div>
                            <div class="level-bar no-education">
                                <div class="level-fill" style="width: ${overview.education.noEducation}%"></div>
                            </div>
                        </div>
                        
                        <div class="education-level">
                            <div class="level-info">
                                <span class="level-name">Primary Education</span>
                                <span class="level-percent">${overview.education.primary}%</span>
                            </div>
                            <div class="level-bar primary">
                                <div class="level-fill" style="width: ${overview.education.primary}%"></div>
                            </div>
                        </div>
                        
                        <div class="education-level">
                            <div class="level-info">
                                <span class="level-name">Secondary Education</span>
                                <span class="level-percent">${overview.education.secondary}%</span>
                            </div>
                            <div class="level-bar secondary">
                                <div class="level-fill" style="width: ${overview.education.secondary}%"></div>
                            </div>
                        </div>
                        
                        <div class="education-level">
                            <div class="level-info">
                                <span class="level-name">Higher Education</span>
                                <span class="level-percent">${overview.education.higher}%</span>
                            </div>
                            <div class="level-bar higher">
                                <div class="level-fill" style="width: ${overview.education.higher}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h3>Education Progression</h3>
                <div class="education-progression">
                    <div class="progression-info">
                        <div class="progression-card">
                            <h4>Citizens Advancing</h4>
                            <div class="advancement-count">${overview.education.progressingCount}</div>
                            <div class="advancement-desc">Citizens currently progressing to next education level (7 days required)</div>
                        </div>
                        
                        <div class="progression-requirements">
                            <h4>Advancement Requirements</h4>
                            <div class="requirements-list">
                                <div class="requirement-item">
                                    <span>Primary Education:</span>
                                    <span>25% National Literacy</span>
                                    <span class="status ${window.Nation && (window.Nation.nationStats?.literacy || 0) >= 25 ? 'met' : 'unmet'}">
                                        ${window.Nation && (window.Nation.nationStats?.literacy || 0) >= 25 ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div class="requirement-item">
                                    <span>Secondary Education:</span>
                                    <span>50% National Literacy</span>
                                    <span class="status ${window.Nation && (window.Nation.nationStats?.literacy || 0) >= 50 ? 'met' : 'unmet'}">
                                        ${window.Nation && (window.Nation.nationStats?.literacy || 0) >= 50 ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div class="requirement-item">
                                    <span>Higher Education:</span>
                                    <span>75% National Literacy</span>
                                    <span class="status ${window.Nation && (window.Nation.nationStats?.literacy || 0) >= 75 ? 'met' : 'unmet'}">
                                        ${window.Nation && (window.Nation.nationStats?.literacy || 0) >= 75 ? '✓' : '✗'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h3>Education Factors</h3>
                <div class="education-factors">
                    <div class="factor-cards">
                        <div class="factor-card">
                            <h4>National Literacy</h4>
                            <div class="factor-value">${window.Nation ? Math.round(window.Nation.nationStats?.literacy || 0) : 0}%</div>
                            <div class="factor-impact">Primary driver of education advancement</div>
                        </div>
                        
                        <div class="factor-card">
                            <h4>Technology Level</h4>
                            <div class="factor-value">${window.Nation ? this.formatNumber(window.Nation.tech) : 0}</div>
                            <div class="factor-impact">Affects educational infrastructure quality</div>
                        </div>
                        
                        <div class="factor-card">
                            <h4>Schools Built</h4>
                            <div class="factor-value">${window.Nation && window.Nation.improvements ? (window.Nation.improvements.school || 0) : 0}</div>
                            <div class="factor-impact">Each school improves literacy by 7.5%</div>
                        </div>
                        
                        <div class="factor-card">
                            <h4>Happiness</h4>
                            <div class="factor-value">${window.Nation ? window.Nation.happiness : 50}%</div>
                            <div class="factor-impact">Affects willingness to pursue education</div>
                        </div>
                    </div>
                </div>
                
                <div class="education-note">
                    <h4>📚 How Education Works</h4>
                    <ul>
                        <li>Citizens advance through education levels over time (7 real days per level)</li>
                        <li>National literacy rate must meet minimum thresholds for advancement</li>
                        <li>Building schools increases national literacy rate</li>
                        <li>Higher education levels improve employment opportunities and national statistics</li>
                        <li>Technology and happiness also influence educational progress</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Render policies tab
     */
    renderPolicies() {
        const overview = window.PopulationSystem.getPopulationOverview();
        
        return `
            <div class="policies-tab">
                <h3>Migration Policy</h3>
                <div class="migration-policy">
                    <div class="policy-selector">
                        <div class="policy-option ${overview.vitalStatistics.migrationPolicy === 'open' ? 'active' : ''}"
                             onclick="PopulationPanel.setMigrationPolicy('open')">
                            <h4>Open Immigration</h4>
                            <p>Welcome immigrants with minimal restrictions</p>
                            <div class="policy-effects">
                                <span class="effect positive">+Higher population growth</span>
                                <span class="effect positive">+Cultural diversity</span>
                                <span class="effect negative">-Potential social tensions</span>
                            </div>
                        </div>
                        
                        <div class="policy-option ${overview.vitalStatistics.migrationPolicy === 'balanced' ? 'active' : ''}"
                             onclick="PopulationPanel.setMigrationPolicy('balanced')">
                            <h4>Balanced Migration</h4>
                            <p>Moderate immigration with some controls</p>
                            <div class="policy-effects">
                                <span class="effect neutral">~Normal population growth</span>
                                <span class="effect neutral">~Moderate diversity</span>
                                <span class="effect positive">+Social stability</span>
                            </div>
                        </div>
                        
                        <div class="policy-option ${overview.vitalStatistics.migrationPolicy === 'restricted' ? 'active' : ''}"
                             onclick="PopulationPanel.setMigrationPolicy('restricted')">
                            <h4>Restricted Immigration</h4>
                            <p>Strict limits on immigration and refugees</p>
                            <div class="policy-effects">
                                <span class="effect negative">-Slower population growth</span>
                                <span class="effect positive">+Cultural homogeneity</span>
                                <span class="effect neutral">~Reduced diversity</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h3>Population Trends</h3>
                <div class="population-trends-detail">
                    <div class="trend-analysis">
                        <h4>Migration Factors</h4>
                        <p>Your nation's attractiveness to immigrants is influenced by:</p>
                        <div class="migration-factors">
                            ${this.renderMigrationFactors()}
                        </div>
                        
                        <div class="migration-note">
                            <p><strong>Note:</strong> Migration is a slow process. Changes in policy and national conditions 
                            take time to show significant effects on population numbers.</p>
                        </div>
                    </div>
                </div>
                
                <h3>Population Projections</h3>
                <div class="population-projections">
                    ${this.renderPopulationProjections(overview)}
                </div>
            </div>
        `;
    }

    /**
     * Render migration factors
     */
    renderMigrationFactors() {
        const ns = (window.Nation && window.Nation.nationStats) ? window.Nation.nationStats : {};
        const factors = [
            { name: 'Happiness',         value: window.Nation ? (window.Nation.happiness || 50) : 50,                               target: 70 },
            { name: 'Literacy',          value: ns.literacy   !== undefined ? ns.literacy : 0,                                      target: 60 },
            { name: 'Technology',        value: window.Nation ? Math.min(100, ((window.Nation.tech || 0) / 20)) : 5,                 target: 50 },
            { name: 'Low Crime',         value: ns.crime      !== undefined ? Math.max(0, 100 - (ns.crime * 2.5)) : 62,             target: 70 },
            { name: 'Low Disease',       value: ns.disease    !== undefined ? Math.max(0, 100 - (ns.disease * 2)) : 80,             target: 80 },
            { name: 'Clean Environment', value: ns.pollution  !== undefined ? Math.max(0, 100 - Math.min(100, ns.pollution * 2)) : 80, target: 70 }
        ];
        
        return `
            <div class="factors-grid">
                ${factors.map(factor => `
                    <div class="factor-row">
                        <span class="factor-name">${factor.name}:</span>
                        <span class="factor-value ${factor.value >= factor.target ? 'positive' : 'negative'}">${factor.value.toFixed(0)}%</span>
                        <div class="factor-bar">
                            <div class="factor-fill" style="width: ${Math.min(100, factor.value)}%"></div>
                            <div class="factor-target" style="left: ${factor.target}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render population projections
     */
    renderPopulationProjections(overview) {
        const currentPop = overview.totalPopulation;
        const growthRate = parseFloat(overview.vitalStatistics.naturalGrowthRate) / 100;
        
        const projections = [
            { period: '1 Month', population: Math.floor(currentPop * Math.pow(1 + growthRate, 1/12)) },
            { period: '6 Months', population: Math.floor(currentPop * Math.pow(1 + growthRate, 0.5)) },
            { period: '1 Year', population: Math.floor(currentPop * (1 + growthRate)) },
            { period: '2 Years', population: Math.floor(currentPop * Math.pow(1 + growthRate, 2)) }
        ];
        
        return `
            <div class="projections-table">
                <div class="projections-header">
                    <span>Time Period</span>
                    <span>Projected Population</span>
                    <span>Change</span>
                </div>
                ${projections.map(proj => {
                    const change = proj.population - currentPop;
                    const changePercent = ((change / currentPop) * 100).toFixed(1);
                    return `
                        <div class="projection-row">
                            <span>${proj.period}</span>
                            <span>${this.formatNumber(proj.population)}</span>
                            <span class="${change >= 0 ? 'positive' : 'negative'}">
                                ${change >= 0 ? '+' : ''}${this.formatNumber(change)} (${changePercent}%)
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="projection-note">
                <small>Projections based on current natural growth rate and do not account for policy changes, disasters, or other events.</small>
            </div>
        `;
    }

    /**
     * Render situations tab
     */
    renderSituations() {
        const overview = window.PopulationSystem.getPopulationOverview();
        
        return `
            <div class="situations-tab">
                <h3>Population Situations</h3>
                
                ${overview.activeSituation ? 
                    this.renderActiveSituation(overview.activeSituation) : 
                    '<div class="no-situation"><p>No active population situation. Check back in a few days.</p></div>'
                }
                
                <h3>Active Effects</h3>
                ${overview.activeEffects.length > 0 ? 
                    this.renderActiveEffects(overview.activeEffects) : 
                    '<div class="no-effects"><p>No active population effects from recent decisions.</p></div>'
                }
                
                <h3>How Population Situations Work</h3>
                <div class="situations-help">
                    <div class="help-section">
                        <h4>📅 Frequency</h4>
                        <p>Population situations occur every 3 days, presenting you with challenges and opportunities to manage your nation's demographic development.</p>
                    </div>
                    
                    <div class="help-section">
                        <h4>⚖️ Choices Matter</h4>
                        <p>Each situation presents 3 different approaches. No choice is inherently right or wrong - each offers different benefits and trade-offs that last 7-28 days.</p>
                    </div>
                    
                    <div class="help-section">
                        <h4>🎯 Variety</h4>
                        <p>Over 100 different situations cover housing, healthcare, education, employment, crime, environment, culture, technology, and more.</p>
                    </div>
                    
                    <div class="help-section">
                        <h4>⏰ Time Limits</h4>
                        <p>Situations expire after 7 days if not addressed. Make your choice before the deadline to influence your nation's development.</p>
                    </div>
                </div>
                
                ${this.renderSituationHistory()}
            </div>
        `;
    }

    /**
     * Render situation history
     */
    renderSituationHistory() {
        // This would show recent situation choices made
        return `
            <div class="situation-history">
                <h4>Recent Decisions</h4>
                <div class="history-placeholder">
                    <p>Decision history will appear here as you make choices in population situations.</p>
                </div>
            </div>
        `;
    }
    // ===============================
    // INTERACTION METHODS
    // ===============================

    /**
     * Switch tabs
     */
    static switchTab(tabName) {
        if (window.populationPanel) {
            window.populationPanel.currentTab = tabName;
            window.populationPanel.refresh();
        }
    }

    /**
     * Make choice for population situation
     */
    static makeChoice(choiceIndex) {
        if (window.PopulationSystem) {
            const success = window.PopulationSystem.makePopulationChoice(choiceIndex);
            if (success) {
                window.populationPanel.refresh();
                EventBus.emit('show_notification', {
                    message: 'Population decision made successfully!',
                    type: 'success'
                });
            } else {
                EventBus.emit('show_notification', {
                    message: 'Failed to make population decision.',
                    type: 'error'
                });
            }
        }
    }

    /**
     * Set migration policy
     */
    static setMigrationPolicy(policy) {
        if (window.PopulationSystem) {
            window.PopulationSystem.setMigrationPolicy(policy);
            window.populationPanel.refresh();
            EventBus.emit('show_notification', {
                message: `Migration policy changed to ${policy}`,
                type: 'info'
            });
        }
    }

    // ===============================
    // HELPER METHODS
    // ===============================

    /**
     * Get display name for age groups
     */
    getAgeGroupDisplayName(ageGroup) {
        const displayNames = {
            newborn: 'Newborns',
            infant: 'Infants',
            toddler: 'Toddlers',
            child: 'Children',
            teen: 'Teenagers',
            youngAdult: 'Young Adults',
            adult: 'Adults',
            middleAged: 'Middle-Aged',
            older: 'Older Adults',
            senior: 'Senior Citizens',
            elderly: 'Elderly'
        };
        return displayNames[ageGroup] || ageGroup;
    }

    /**
     * Format numbers with commas
     */
    formatNumber(num) {
        if (typeof num !== 'number') return '0';
        return Math.floor(num).toLocaleString();
    }

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Refresh the panel
     */
    refresh() {
        EventBus.emit('population_panel_refresh_needed');
    }

    // ===============================
    // EVENT HANDLERS
    // ===============================

    handleSituationTriggered(data) {
        this.refresh();
        
        // Show notification about new situation
        EventBus.emit('show_notification', {
            message: `New population situation: ${data.situation.title}`,
            type: 'warning',
            duration: 5000
        });
    }

    handleChoiceMade(data) {
        this.refresh();
        
        // Show feedback about the choice made
        EventBus.emit('show_notification', {
            message: `Population decision: ${data.choice.text}`,
            type: 'success',
            duration: 3000
        });
    }

    handleEffectExpired(data) {
        this.refresh();
        
        // Notify about expired effect
        EventBus.emit('show_notification', {
            message: `Population effect expired: ${data.effectData.situationTitle}`,
            type: 'info',
            duration: 3000
        });
    }

    handleCensusCompleted(data) {
        this.refresh();
        
        // Major milestone notification
        EventBus.emit('show_notification', {
            message: `Annual census completed. Population: ${this.formatNumber(data.totalPopulation)}`,
            type: 'info',
            duration: 5000
        });
    }

    handleAnnualReport(data) {
        this.refresh();
        
        // Show major population trends
        const growthMessage = data.populationGrowth > 0 ? 
            `Population grew by ${(data.populationGrowth * 100).toFixed(1)}%` :
            `Population declined by ${Math.abs(data.populationGrowth * 100).toFixed(1)}%`;
            
        EventBus.emit('show_notification', {
            message: `Annual Report: ${growthMessage}`,
            type: 'info',
            duration: 5000
        });
    }

    /**
     * Destroy the panel
     */
    destroy() {
        EventBus.off('population_situation_triggered', this.handleSituationTriggered, this);
        EventBus.off('population_choice_made', this.handleChoiceMade, this);
        EventBus.off('population_effect_expired', this.handleEffectExpired, this);
        EventBus.off('annual_census_completed', this.handleCensusCompleted, this);
        EventBus.off('annual_population_report', this.handleAnnualReport, this);
        EventBus.off(GameEvents.DAY_PASSED, this.refresh, this);
        
        this.isInitialized = false;
    }
}

// Create global instance
window.PopulationPanel = PopulationPanel;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PopulationPanel };
}