/**
 * Government System - Government Types, Hints, and Mechanics
 * Dominion Wars - Nation Building Strategy Game
 */

class GovernmentSystem {
    constructor() {
        this.governments = {};
        this.demandTimers = new Map();
        this.initializeGovernments();
    }

    /**
     * Initialize all 12 government types with unique hints
     */
    initializeGovernments() {
        this.governments = {
            // 1. LIBERAL DEMOCRACY
            liberalDemocracy: {
                id: 'liberalDemocracy',
                name: 'Liberal Democracy',
                fullName: 'Liberal Democratic Republic',
                icon: '🗳️',
                image: 'assets/images/Government/liberal-democracy.png',
                description: 'A system governed by elected representatives with strong emphasis on individual rights, free markets, and constitutional limits on government power. Citizens enjoy extensive civil liberties and political freedoms.',
                history: 'Evolved from Enlightenment ideals of natural rights and social contract theory, this government emerged from classical democratic traditions combined with protections for minority rights.',
                
                // Balanced: 3 boosts, 2 penalties — Free markets, civil liberties, constitutional limits
                bonuses: {
                    taxableIncome: 0.10,              // +10% taxable income (free markets)
                    'nationStats.environment': 0.10,  // +10% environment (environmental protections)
                    happiness: 0.10                   // +10% happiness (civil liberties)
                },
                
                penalties: {
                    militaryStrength: 0.90,           // -10% military strength (pacifist leaning)
                    'nationStats.militaryMorale': 0.90  // -10% military morale (less military focus)
                },
                
                // Policy modifiers
                policies: {
                    economic: 'Capitalist',
                    military: 'Defensive',
                    social: 'Progressive',
                    environmental: 'Moderate',
                    foreign: 'Diplomatic'
                },
                
                taxRate: 18,
                militaryBudget: 15,
                
                // 5 UNIQUE HINTS (only point to this government, not others)
                hints: [
                    'The people thrive when freedom rings - citizens report the highest personal satisfaction in surveys',
                    'Trade flows freely through open markets, creating prosperity that reaches every citizen',
                    'Minorities sleep peacefully knowing their rights are protected by constitutional shields',
                    'Foreign dignitaries admire our reputation for fairness and democratic values',
                    'Inventors and dreamers flock here, knowing their ideas can flourish without restraint'
                ],
                
                hintThemes: ['freedom', 'free markets', 'minority rights', 'reputation', 'innovation']
            },

            // 2. CONSTITUTIONAL MONARCHY
            constitutionalMonarchy: {
                id: 'constitutionalMonarchy',
                name: 'Constitutional Monarchy',
                fullName: 'Constitutional Monarchy',
                icon: '👑',
                image: 'assets/images/Government/constitutional-monarchy.png',
                description: 'A balanced system where a hereditary monarch serves as head of state within a constitutional framework. Power is shared between the crown and an elected parliament, combining tradition with modern governance.',
                history: 'A compromise between royal authority and popular representation that emerged from medieval councils transformed into modern parliaments.',
                
                // Balanced: 3 boosts, 2 penalties — Tradition, stability, royal authority
                bonuses: {
                    stability: 0.10,                  // +10% stability (national unity under crown)
                    'nationStats.environment': 0.05,  // +5% environment (conservationist)
                    militaryStrength: 0.05            // +5% military strength (royal guard)
                },
                
                penalties: {
                    'nationStats.pollution': 0.10,    // +10% pollution (traditional industry)
                    'nationStats.taxEfficiency': 0.92 // -8% tax efficiency (traditionalist bureaucracy)
                },
                
                policies: {
                    economic: 'Mixed',
                    military: 'Balanced',
                    social: 'Traditional',
                    environmental: 'Conservationist',
                    foreign: 'Traditional'
                },
                
                taxRate: 20,
                militaryBudget: 20,
                
                hints: [
                    'Centuries of tradition bind the nation together like golden chains',
                    'The crown represents unity across generations, a living symbol of continuity',
                    'Balance between old wisdom and new ideas creates steady, sustainable progress',
                    'Citizens take pride in their heritage while embracing necessary reforms',
                    'Foreign alliances are stable when backed by the enduring authority of the throne'
                ],
                
                hintThemes: ['tradition', 'unity', 'balance', 'heritage', 'stability']
            },

            // 3. COMMUNIST STATE
            communistState: {
                id: 'communistState',
                name: 'Communist State',
                fullName: 'Communist Peoples Republic',
                icon: '⚒️',
                image: 'assets/images/Government/communist-state.png',
                description: 'A system where the state controls economic production and distribution through central planning. The government owns major industries and directs resource allocation toward collective goals.',
                history: 'Founded on revolutionary ideology seeking to eliminate class distinctions through collective ownership and central coordination of all economic activities.',
                
                // Balanced: 3 boosts, 2 penalties — State control, industrial production, military
                bonuses: {
                    infra: 0.10,                      // +10% infrastructure (state projects)
                    militaryStrength: 0.10,           // +10% military strength (state armies)
                    'buildingUpkeep.improvements': 0.10 // -10% improvement upkeep (state efficiency)
                },
                
                penalties: {
                    happiness: 0.85,                  // -15% happiness (oppression)
                    'nationStats.pollution': 0.15     // +15% pollution (heavy industry)
                },
                
                policies: {
                    economic: 'Planned',
                    military: 'Militaristic',
                    social: 'Collectivist',
                    environmental: 'Industrial',
                    foreign: 'Isolationist'
                },
                
                taxRate: 25,
                militaryBudget: 30,
                
                hints: [
                    'The collective machine produces more steel and weapons than any private enterprise could dream of',
                    'Class distinctions have dissolved - from each according to ability, to each according to need',
                    'The state provides for all from cradle to grave, ensuring no citizen falls through the cracks',
                    'Dissenters are quickly educated in the correct path toward collective harmony',
                    'Industry grows under central direction, unfettered by the chaos of competing private interests'
                ],
                
                hintThemes: ['collective', 'industrial', 'equality', 'central planning', 'militaristic']
            },

            // 4. THEOCRATIC REPUBLIC
            theocraticRepublic: {
                id: 'theocraticRepublic',
                name: 'Theocratic Republic',
                fullName: 'Islamic Republic',
                icon: '🕌',
                image: 'assets/images/Government/theocratic-republic.png',
                description: 'A system where religious principles and clerical authority influence governance alongside democratic institutions. Divine law serves as the foundation for civil law.',
                history: 'Emerged from the fusion of religious doctrine with modern republican structures, creating a unique blend of spiritual and temporal authority.',
                
                // Balanced: 3 boosts, 2 penalties — Faith, spiritual fulfillment, disease control
                bonuses: {
                    happiness: 0.10,                  // +10% happiness (spiritual fulfillment)
                    'nationStats.disease': 0.10,      // -10% disease (faith-based community care)
                    stability: 0.10                   // +10% stability (shared faith)
                },
                
                penalties: {
                    'nationStats.taxEfficiency': 0.90,  // -10% tax efficiency (religious bureaucracy)
                    'nationStats.militaryMorale': 0.90  // -10% military morale (pacifist sects)
                },
                
                policies: {
                    economic: 'Mixed',
                    military: 'Devotional',
                    social: 'Conservative',
                    environmental: 'Traditional',
                    foreign: 'Guarded'
                },
                
                taxRate: 22,
                militaryBudget: 25,
                
                hints: [
                    'Faith guides every decision, from foreign policy to economic matters',
                    'The people find purpose beyond material pursuits, united by sacred bonds',
                    'Soldiers fight with divine conviction, their morale unshakeable',
                    'Traditional family structures flourish, bringing demographic strength',
                    'Clerical scholars ensure wisdom and righteousness permeate governance'
                ],
                
                hintThemes: ['faith', 'divine', 'tradition', 'morale', 'unity']
            },

            // 5. MILITARY JUNTAS
            militaryJunta: {
                id: 'militaryJunta',
                name: 'Military Junta',
                fullName: 'Armed Forces Provisional Government',
                icon: '🎖️',
                image: 'assets/images/Government/military-junta.png',
                description: 'A system ruled by a council of military officers who seized power, prioritizing national defense and order over civilian governance. Security and discipline define all aspects of society.',
                history: 'Often established during crises when military leaders believe civilian institutions have failed to maintain order and national security.',
                
                // Balanced: 3 boosts, 2 penalties — Military strength, order, morale
                bonuses: {
                    militaryStrength: 0.12,             // +12% military strength (military rule)
                    stability: 0.10,                    // +10% stability (order through force)
                    'nationStats.militaryMorale': 0.10  // +10% military morale (discipline)
                },
                
                penalties: {
                    happiness: 0.85,                    // -15% happiness (oppression)
                    'nationStats.taxEfficiency': 0.85   // -15% tax efficiency (military focus)
                },
                
                policies: {
                    economic: 'State-Controlled',
                    military: 'Militaristic',
                    social: 'Authoritarian',
                    environmental: 'Utilitarian',
                    foreign: 'Confrontational'
                },
                
                taxRate: 28,
                militaryBudget: 40,
                
                hints: [
                    'The armed forces stand ready, discipline ironclad and reflexes razor-sharp',
                    'Order is maintained through decisive action - crime yields to armored patrols',
                    'The generals speak with one voice, eliminating the chaos of democratic debate',
                    'Every citizen knows their place and fulfills their duty to the state',
                    'Border defenses are impenetrable, no enemy would dare test our resolve'
                ],
                
                hintThemes: ['military', 'discipline', 'order', 'defense', 'authoritarian']
            },

            // 6. CORPORATIST STATE
            corporatistState: {
                id: 'corporatistState',
                name: 'Corporatist State',
                fullName: 'National Corporatist Republic',
                icon: '🏭',
                image: 'assets/images/Government/corporatist-state.png',
                description: 'A system organizing society into professional corporations representing different economic sectors. The state mediates between corporate interests, creating a coordinated economy without pure capitalism or socialism.',
                history: 'Developed as a third way between liberal capitalism and revolutionary socialism, emphasizing cooperation between labor and management.',
                
                // Balanced: 3 boosts, 2 penalties — Corporate efficiency, industrial infrastructure
                bonuses: {
                    'nationStats.taxEfficiency': 0.12,  // +12% tax efficiency (corporate efficiency)
                    infra: 0.10,                        // +10% infrastructure (industrial coordination)
                    militaryBudget: 0.10                // +10% military budget (corporate spending)
                },
                
                penalties: {
                    'nationStats.populationEfficiency': 0.90,  // -10% population efficiency (rigid corporate structure)
                    'nationStats.pollution': 0.10                // +10% pollution (industrial focus)
                },
                
                policies: {
                    economic: 'Corporatist',
                    military: 'Pragmatic',
                    social: 'Cooperative',
                    environmental: 'Industrial',
                    foreign: 'Nationalist'
                },
                
                taxRate: 23,
                militaryBudget: 20,
                
                hints: [
                    'Workers and owners collaborate rather than conflict, maximizing output',
                    'Professional guilds ensure quality standards and fair practices across industries',
                    'The national economy functions as one coordinated organism, not competing atoms',
                    'Economic planning eliminates waste while preserving market incentives',
                    'Trade flows efficiently when corporations represent organized national interests'
                ],
                
                hintThemes: ['cooperation', 'corporations', 'guilds', 'coordination', 'efficiency']
            },

            // 7. DIRECT DEMOCRACY
            directDemocracy: {
                id: 'directDemocracy',
                name: 'Direct Democracy',
                fullName: 'Participatory Democracy',
                icon: '📜',
                image: 'assets/images/Government/direct-democracy.png',
                description: 'A system where citizens vote directly on legislation and policy rather than through representatives. All eligible citizens participate in governmental decisions.',
                history: 'An ancient form revived in modern times through technology, allowing unprecedented citizen participation in governance.',
                
                // Balanced: 3 boosts, 2 penalties — Citizen voice, legitimacy, trust
                bonuses: {
                    happiness: 0.12,                    // +12% happiness (voice in governance)
                    stability: 0.10,                    // +10% stability (legitimacy)
                    'nationStats.populationEfficiency': 0.10  // +10% population efficiency (participation)
                },
                
                penalties: {
                    'nationStats.taxEfficiency': 0.85,    // -15% tax efficiency (slow democratic process)
                    'nationStats.militaryMorale': 0.90  // -10% military morale (democratic debate)
                },
                
                policies: {
                    economic: 'Mixed',
                    military: 'Democratic',
                    social: 'Progressive',
                    environmental: 'Adaptive',
                    foreign: 'Peacelist'
                },
                
                taxRate: 20,
                militaryBudget: 15,
                
                hints: [
                    'The people themselves decide their fate, not distant representatives',
                    'Every voice matters in the great assembly - from farmer to merchant to scholar',
                    'Policies reflect genuine popular will, not special interest manipulation',
                    'Transparency reigns - citizens see all and know all about their government',
                    'Innovations bloom when ordinary people contribute ideas without gatekeepers'
                ],
                
                hintThemes: ['participation', 'assembly', 'transparency', 'voice', 'innovation']
            },

            // 8. TECHNOCRACY
            technocracy: {
                id: 'technocracy',
                name: 'Technocracy',
                fullName: 'Technocratic Republic',
                icon: '🔬',
                image: 'assets/images/Government/technocracy.png',
                description: 'A system where scientists, engineers, and experts govern based on technical knowledge and evidence. Decisions are made through data analysis rather than political consideration.',
                history: 'Proposed by scientists who believed complex modern society required expert management rather than democratic or autocratic rule.',
                
                // Balanced: 3 boosts, 2 penalties — Technical efficiency, infrastructure, tax management
                bonuses: {
                    'nationStats.taxEfficiency': 0.10,  // +10% tax efficiency (technical management)
                    'buildingUpkeep.projects': 0.10,      // -10% project upkeep (engineered efficiency)
                    infra: 0.10                         // +10% infrastructure (engineered projects)
                },
                
                penalties: {
                    happiness: 0.90,                    // -10% happiness (impersonal rule)
                    'nationStats.pollution': 0.05         // +5% pollution (industrial focus)
                },
                
                policies: {
                    economic: 'Planned',
                    military: 'Technical',
                    social: 'Meritocratic',
                    environmental: 'Scientific',
                    foreign: 'Pragmatic'
                },
                
                taxRate: 22,
                militaryBudget: 18,
                
                hints: [
                    'Climate models predict harvest yields, industrial output, and energy needs with precision',
                    'Expert committees analyze every policy through rigorous scientific methodology',
                    'Infrastructure projects are engineered for maximum efficiency and longevity',
                    'Technology advances rapidly when scientists hold the reins of power',
                    'Bureaucrats measure everything - nothing is left to chance or intuition'
                ],
                
                hintThemes: ['expertise', 'science', 'efficiency', 'precision', 'data']
            },

            // 9. FEDERAL REPUBLIC
            federalRepublic: {
                id: 'federalRepublic',
                name: 'Federal Republic',
                fullName: 'Federal Democratic Republic',
                icon: '⚖️',
                image: 'assets/images/Government/federal-republic.png',
                description: 'A system dividing power between a national government and constituent states or provinces. Multiple levels of government share authority across geographic and functional lines.',
                history: 'Evolved from attempts to balance local autonomy with national unity, creating layered governance.',
                
                // Balanced: 3 boosts, 2 penalties — Stability, local adaptability, citizen voice
                bonuses: {
                    stability: 0.10,                          // +10% stability (subsidiarity)
                    'nationStats.populationEfficiency': 0.10, // +10% population efficiency (local knowledge)
                    happiness: 0.10                           // +10% happiness (citizen representation)
                },
                
                penalties: {
                    'nationStats.militaryMorale': 0.90,       // -10% military morale (divided command)
                    militaryStrength: 0.90                    // -10% military strength (distributed forces)
                },
                
                policies: {
                    economic: 'Federal',
                    military: 'Distributed',
                    social: 'Pluralistic',
                    environmental: 'Regional',
                    foreign: 'Cooperative'
                },
                
                taxRate: 21,
                militaryBudget: 20,
                
                hints: [
                    'States experiment with policies, discovering what works before national adoption',
                    'Local leaders understand regional needs that distant bureaucrats could never grasp',
                    'Power shared is power limited - no单一 authority can tyranny the people',
                    'Regional diversity strengthens the whole, like muscles working in concert',
                    'Crises are contained locally before spreading across the entire nation'
                ],
                
                hintThemes: ['federalism', 'subsidiarity', 'diversity', 'local', 'resilience']
            },

            // 10. SINGLE-PARTY STATE
            singlePartyState: {
                id: 'singlePartyState',
                name: 'Single-Party State',
                fullName: 'Socialist Peoples Republic',
                icon: '🏴',
                image: 'assets/images/Government/single-party-state.png',
                description: 'A system where a single political party holds absolute authority, with other parties either banned or reduced to ceremonial roles. The party directs all aspects of governance.',
                history: 'Emerged from revolutionary movements that consolidated power to implement sweeping social transformation.',
                
                // Balanced: 3 boosts, 2 penalties — Coordination, planning, national unity
                bonuses: {
                    'nationStats.populationEfficiency': 0.10, // +10% population efficiency (mobilization)
                    stability: 0.10,                          // +10% stability (party control)
                    militaryStrength: 0.10                    // +10% military strength (mass mobilization)
                },
                
                penalties: {
                    happiness: 0.90,  // -10% happiness (party control)
                    tech: 0.90        // -10% research (ideological conformity)
                },
                
                policies: {
                    economic: 'Planned',
                    military: 'Mass',
                    social: 'Collectivist',
                    environmental: 'Utilitarian',
                    foreign: 'Ideological'
                },
                
                taxRate: 24,
                militaryBudget: 28,
                
                hints: [
                    'The party directs all resources toward common goals with singular purpose',
                    'Long-term Five-Year Plans build infrastructure others cannot imagine',
                    'Mass movements mobilize millions for construction, defense, and harvest',
                    'Policy implementation faces no obstruction from partisan gridlock',
                    'The people are united behind a shared vision of national destiny'
                ],
                
                hintThemes: ['party', 'planning', 'mobilization', 'unity', 'ideology']
            },

            // 11. ANARCHO-COMMUNISM
            anarchoCommunism: {
                id: 'anarchoCommunism',
                name: 'Anarcho-Communism',
                fullName: 'Libertarian Socialist Confederation',
                icon: '🌐',
                image: 'assets/images/Government/anarcho-communism.png',
                description: 'A system without centralized state authority, where communities organize themselves through voluntary association and collective ownership. Governance emerges from the bottom up.',
                history: 'A radical experiment in stateless society, where communities coordinate directly without hierarchical government.',
                
                // Balanced: 3 boosts, 2 penalties — Freedom, community, voluntary cooperation
                bonuses: {
                    happiness: 0.10,                    // +10% happiness (freedom)
                    'nationStats.populationEfficiency': 0.10, // +10% population efficiency (voluntary cooperation)
                    'buildingUpkeep.improvements': 0.10   // -10% improvement upkeep (no bureaucracy)
                },
                
                penalties: {
                    militaryStrength: 0.90, // -10% military
                    stability: 0.90,        // -10% stability
                },
                
                policies: {
                    economic: 'Collectivist',
                    military: 'Militia',
                    social: 'Libertarian',
                    environmental: 'Ecosocialist',
                    foreign: 'Non-Interventionist'
                },
                
                taxRate: 10,
                militaryBudget: 8,
                
                hints: [
                    'Communities govern themselves without distant rulers telling them how to live',
                    'Voluntary cooperation produces results that coercion never could match',
                    'Innovation flourishes when creators keep the full fruits of their labor',
                    'Neighbors help neighbors, building trust stronger than any police force',
                    'No army can conquer a people who refuse to be ruled'
                ],
                
                hintThemes: ['voluntary', 'community', 'freedom', 'cooperation', 'self-governance']
            },

            // 12. ABSOLUTE MONARCHY
            absoluteMonarchy: {
                id: 'absoluteMonarchy',
                name: 'Absolute Monarchy',
                fullName: 'Divine Right Monarchy',
                icon: '♛',
                image: 'assets/images/Government/absolute-monarchy.png',
                description: 'A system where a single sovereign holds unlimited power, ruling by divine right or hereditary claim. The monarch\'s word is law, with no constitutional constraints.',
                history: 'The oldest form of centralized government, where rulers claimed authority from the divine to command absolute obedience.',
                
                // Balanced: 3 boosts, 2 penalties — Authority, decree, military
                bonuses: {
                    militaryStrength: 0.10,   // +10% military strength (royal command)
                    stability: 0.10,          // +10% stability (hierarchical order)
                    'nationStats.militaryMorale': 0.10 // +10% military morale (royal authority)
                },
                
                penalties: {
                    happiness: 0.90,    // -10% happiness (oppression)
                    'nationStats.taxEfficiency': 0.90 // -10% tax efficiency (royal bureaucracy)
                },
                
                policies: {
                    economic: 'Mercantilist',
                    military: 'Royal',
                    social: 'Hierarchical',
                    environmental: 'Utilitarian',
                    foreign: 'Imperialist'
                },
                
                taxRate: 30,
                militaryBudget: 35,
                
                hints: [
                    'The monarch\'s decree flies faster than democratic debates ever could',
                    'All bow before the throne - nobles, merchants, and peasants alike',
                    'The crown pursues national greatness without paralysis from elected bodies',
                    'Tradition and hierarchy provide order when commoners cannot govern themselves',
                    'An iron will commands the nation, unyielding to popular whims'
                ],
                
                hintThemes: ['monarch', 'authority', 'tradition', 'decree', 'hierarchy']
            }
        };
    }

    /**
     * Get government by ID (alias for getGovernmentType)
     */
    getGovernmentType(governmentId) {
        return this.getGovernment(governmentId);
    }

    /**
     * Get government by ID
     */
    getGovernment(governmentId) {
        return this.governments[governmentId] || null;
    }

    /**
     * Get all governments
     */
    getAllGovernments() {
        return Object.values(this.governments);
    }

    /**
     * Get government hints (random 5 unique hints for puzzle)
     */
    getGovernmentHints(governmentId, count = 5) {
        const government = this.getGovernment(governmentId);
        if (!government) return [];
        
        // Return all 5 hints shuffled
        const shuffled = [...government.hints].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Get hint themes for a government
     */
    getHintThemes(governmentId) {
        const government = this.getGovernment(governmentId);
        return government ? government.hintThemes : [];
    }

    /**
     * Apply government bonuses and penalties to a nation
     * Supports dot-notation for nested properties (e.g. 'nationStats.taxEfficiency')
     * 
     * BAD METRICS (higher is worse): pollution, disease, crime, buildingUpkeep.*
     *   Bonus reduces them: multiply by (1 - value)
     *   Penalty increases them: multiply by (1 + value)
     * 
     * GOOD METRICS (higher is better): happiness, stability, taxableIncome, militaryStrength, etc.
     *   Bonus increases them: multiply by (1 + value)
     *   Penalty reduces them: multiply by value (e.g. 0.90 = -10%)
     */
    applyGovernmentBonuses(nation, governmentId) {
        const government = this.getGovernment(governmentId);
        if (!government) return;

        // Metrics where higher is WORSE (costs, pollution, disease, crime)
        const badMetrics = new Set([
            'nationStats.pollution',
            'nationStats.disease',
            'nationStats.crime',
            'buildingUpkeep.improvements',
            'buildingUpkeep.projects',
            'buildingUpkeep.wonders'
        ]);

        // Apply bonuses
        if (government.bonuses) {
            for (const [key, value] of Object.entries(government.bonuses)) {
                const parts = key.split('.');
                let target = nation;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!target[parts[i]]) target[parts[i]] = {};
                    target = target[parts[i]];
                }
                const finalKey = parts[parts.length - 1];
                if (target[finalKey] !== undefined) {
                    if (badMetrics.has(key)) {
                        target[finalKey] = Math.floor(target[finalKey] * (1 - value));
                    } else {
                        target[finalKey] = Math.floor(target[finalKey] * (1 + value));
                    }
                }
            }
        }

        // Apply penalties
        if (government.penalties) {
            for (const [key, value] of Object.entries(government.penalties)) {
                const parts = key.split('.');
                let target = nation;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!target[parts[i]]) target[parts[i]] = {};
                    target = target[parts[i]];
                }
                const finalKey = parts[parts.length - 1];
                if (target[finalKey] !== undefined) {
                    if (badMetrics.has(key)) {
                        target[finalKey] = Math.floor(target[finalKey] * (1 + value));
                    } else {
                        target[finalKey] = Math.floor(target[finalKey] * value);
                    }
                }
            }
        }

        // Apply policies
        if (government.policies) {
            nation.policies = { ...government.policies };
        }

        // Apply tax rate
        if (government.taxRate) {
            nation.taxRate = government.taxRate;
        }
    }

    /**
     * Start a government demand timer for a nation
     */
    startDemandTimer(nationKey, onDemandCallback) {
        // Random time between 1 week and 1 month (in game days)
        // At 5 min per game day: 1 week = 7 days = 35 min, 1 month = 30 days = 150 min
        const minDays = 7;
        const maxDays = 30;
        const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
        
        const timerData = {
            daysRemaining: randomDays,
            nationKey: nationKey,
            onDemand: onDemandCallback,
            intervalId: null
        };

        this.demandTimers.set(nationKey, timerData);

        // Set up interval for daily checks
        timerData.intervalId = setInterval(() => {
            timerData.daysRemaining--;
            
            if (timerData.daysRemaining <= 0) {
                // Trigger demand
                if (onDemandCallback) {
                    onDemandCallback();
                }
                
                // Reset timer for next cycle (1 month = 30 days)
                timerData.daysRemaining = 30;
            }
        }, GameConfig.GAME_SPEED); // Check every game day

        return timerData;
    }

    /**
     * Stop demand timer for a nation
     */
    stopDemandTimer(nationKey) {
        const timer = this.demandTimers.get(nationKey);
        if (timer && timer.intervalId) {
            clearInterval(timer.intervalId);
        }
        this.demandTimers.delete(nationKey);
    }

    /**
     * Get random government for hints (not the current one)
     */
    getRandomGovernment(currentGovernmentId) {
        const allGovernments = this.getAllGovernments();
        const filtered = allGovernments.filter(g => g.id !== currentGovernmentId);
        return filtered[Math.floor(Math.random() * filtered.length)];
    }

    /**
     * Get government icon by ID — convenience helper used by UI components.
     * Returns the emoji icon for the given government ID, or a fallback 🏛️.
     */
    getGovernmentIcon(governmentId) {
        return this.governments[governmentId]?.icon || '🏛️';
    }

    /**
     * Get a display string "icon name" for a government ID — used inline in UI text.
     */
    getGovernmentLabel(governmentId) {
        const gov = this.governments[governmentId];
        if (!gov) return '🏛️ Unknown';
        return `${gov.icon} ${gov.name}`;
    }
}

// Create global instance and expose it
window.GovernmentSystem = new GovernmentSystem();