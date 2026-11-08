/**
 * Wrestling System - Nation-Owned Wrestling Promotion System
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Handles:
 * - Promotion creation via Wrestling Arena Wonder
 * - Weekly show booking and simulation (max 4 matches)
 * - Monthly Nation PPV (max 6 matches, replaces weekly show)
 * - Quarterly Mass PPV (cross-nation, globally synced)
 * - Championship system with population-based thresholds
 * - Match grading, winner determination, narrative text
 * - Wrestler management (roster, contracts, happiness, injuries, fans)
 * - Arena upgrades and ticket pricing
 * - Rivalries and storylines
 * - AI nation promotion management
 *
 * Wrestler skills are INDEPENDENT of sports player skills.
 */

class WrestlingSystem {
    constructor(world, saved = null) {
        this.world = world;

        // ── Sub-systems ──
        this.wrestlerSystem = null; // Set after WrestlerSystem class loads

        // ── Data stores ──
        this.promotions = new Map();    // nationId -> promotion object
        this.wrestlers = new Map();     // wrestlerId -> full wrestler object

        // ── System-level state ──
        this.massPpvCycleDay = null;    // Next global Mass PPV game day
        this.massPpvRegistrations = new Map(); // nationId -> { wrestlerId, titleOnTheLineKey|null }

        // ── Config ──
        this.championshipKeys = [
            'insanity', 'womensMidCard', 'mensMidCard',
            'womensTagTeam', 'mensTagTeam', 'womensWorld', 'mensWorld',
        ];

        this.championshipUnlockTiers = [
            { threshold: 10, keys: ['insanity'] },
            { threshold: 25, keys: ['womensMidCard', 'mensMidCard'] },
            { threshold: 33, keys: ['womensTagTeam', 'mensTagTeam'] },
            { threshold: 50, keys: ['womensWorld', 'mensWorld'] },
        ];

        this.championshipPrestigeStart = {
            insanity: 6,
            womensMidCard: 5, mensMidCard: 5,
            womensTagTeam: 4, mensTagTeam: 4,
            womensWorld: 8, mensWorld: 8,
        };

        this.championshipFanMultiplier = {
            insanity: 1.1,
            womensMidCard: 1.2, mensMidCard: 1.2,
            womensTagTeam: 1.1, mensTagTeam: 1.1,
            womensWorld: 1.5, mensWorld: 1.5,
        };

        this.titleDefinitionConfig = {
            insanity: { name: 'Insanity Championship', gender: 'intergender', division: 'insanity', requiredMatchType: 'singles', requiredStipulation: 'insanity' },
            womensMidCard: { name: "Women's Mid-Card Championship", gender: 'women', division: 'midcard', requiredMatchType: 'singles', requiredStipulation: null },
            mensMidCard: { "name": "Men's Mid-Card Championship", gender: 'men', division: 'midcard', requiredMatchType: 'singles', requiredStipulation: null },
            womensTagTeam: { name: "Women's Tag-Team Championship", gender: 'women', division: 'tagteam', requiredMatchType: 'tagteam', requiredStipulation: null },
            mensTagTeam: { name: "Men's Tag-Team Championship", gender: 'men', division: 'tagteam', requiredMatchType: 'tagteam', requiredStipulation: null },
            womensWorld: { name: "Women's World Championship", gender: 'women', division: 'world', requiredMatchType: 'singles', requiredStipulation: null },
            mensWorld: { name: "Men's World Championship", gender: 'men', division: 'world', requiredMatchType: 'singles', requiredStipulation: null },
        };

        this.matchTypes = ['singles', 'tagteam', 'trickytrio', 'fatalfour'];
        this.stipulations = [
            '1fall', '2of3falls', 'insanity', 'ladder', 'table', 'cage',
            'deathmatch', 'firstblood', 'lastmanstanding', 'ironman',
            'submissiononly', 'knockout', 'nocountout', 'nodq',
        ];

        this.gradeScale = null; // Star ratings used instead (0.0-5.0)

        this.stipulationMultipliers = {
            'deathmatch': 1.5, 'ladder': 1.3, 'insanity': 1.2, 'firstblood': 1.2,
            'lastmanstanding': 1.2, 'knockout': 1.2, 'cage': 1.1, 'table': 1.1,
            '2of3falls': 1.1, 'ironman': 1.1, 'submissiononly': 1.1, 'nodq': 1.1,
            'nocountout': 1.05, '1fall': 1.0,
        };

        this.upgradeBaseCosts = {
            Seating: 1000000, Gym: 2000000, MedicalCenter: 3000000,
            YouthAcademy: 2500000, FanExperience: 1500000, Concessions: 2000000,
            TechnologyCenter: 5000000,
        };

        this.arenaUpgradeKeys = ['seating', 'gym', 'medicalCenter', 'youthAcademy', 'fanExperience', 'concessions', 'technologyCenter'];
        this.upgradeTypeToKey = {
            'Seating': 'seating', 'Gym': 'gym', 'Medical Center': 'medicalCenter',
            'Youth Academy': 'youthAcademy', 'Fan Experience': 'fanExperience',
            'Concessions': 'concessions', 'Technology Center': 'technologyCenter',
        };

        this.gradeMultipliers = null; // Computed dynamically from star rating

        this.initialize();
    }

    initialize() {
        this.wrestlerSystem = null; // Will be set externally or lazily
        this.bindEvents();
    }

    bindEvents() {
        if (typeof EventBus !== 'undefined') {
            EventBus.on('wonder_built', this.onWonderBuilt.bind(this));
            EventBus.on('wonder_demolished', this.onWonderDemolished.bind(this));
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // WONDER INTEGRATION
    // ════════════════════════════════════════════════════════════════════════════

    onWonderBuilt(data) {
        if (!data || data.wonderType !== 'wrestlingArena') return;
        const nationId = data.nation ? data.nation.id : null;
        if (!nationId) return;
        // Promotion is not auto-created; user must call createPromotion
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:promotionUnlocked', { nationId });
        }
    }

    onWonderDemolished(data) {
        if (!data || data.wonderType !== 'wrestlingArena') return;
        const nationId = data.nation ? data.nation.id : null;
        if (!nationId) return;
        const promotion = this.promotions.get(nationId);
        if (promotion) {
            promotion.isActive = false;
        }
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:promotionLocked', { nationId });
        }
    }

    hasArenaWonder(nationId) {
        try {
            const nation = this.world.nation(nationId).nation;
            return !!(nation.wonders && nation.wonders.wrestlingArena > 0);
        } catch (e) {
            return false;
        }
    }

    getNation(nationId) {
        try {
            return this.world.nation(nationId).nation;
        } catch (e) {
            return null;
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // PROMOTION CREATION
    // ════════════════════════════════════════════════════════════════════════════

    createPromotion(nationId, data = {}) {
        const { name, airingDay } = data;

        // Validate wonder owned
        if (!this.hasArenaWonder(nationId)) {
            throw new Error('Wrestling Arena Wonder required to create a promotion');
        }

        // Validate no existing promotion
        if (this.promotions.has(nationId)) {
            throw new Error('Nation already has a wrestling promotion');
        }

        const nation = this.getNation(nationId);
        if (!nation) throw new Error('Nation not found');

        // Validate name
        if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 60) {
            throw new Error('Promotion name must contain 3–60 characters');
        }

        // Validate airing day
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(airingDay)) {
            throw new Error('Invalid airing day');
        }

        const currentDay = this.world.state ? this.world.state.day : 0;

        const promotion = {
            id: this.generateId(),
            name: name.trim(),
            airingDay,
            foundedDay: currentDay,
            isActive: true,
            lastShowDay: currentDay,
            lastMonthlyPpvDay: currentDay,
            fans: 0,
            maxFansEver: 0,
            ticketPrice: { weekly: 25, monthlyPPV: 50 },
            arena: {
                seating: 0, gym: 0, medicalCenter: 0, youthAcademy: 0,
                fanExperience: 0, concessions: 0, technologyCenter: 0,
            },
            roster: {}, // { [wrestlerId]: true }
            tagTeams: [],
            championships: {
                unlocked: [],
                titles: {},
                vacantTitles: [],
                blockedTitles: [],
            },
            weeklyShow: { matches: [], weekStartDay: currentDay },
            showHistory: [],
            monthlyPpvHistory: [],
            massPpvHistory: [],
            titleHistory: [],
            rivalries: [],
            storylines: [],
            injuries: {},
            statistics: {
                showsHeld: 0, totalMatches: 0, titleChanges: 0,
                fansGainedTotal: 0, injuriesTotal: 0,
                massPpvWins: 0, massPpvLosses: 0,
                totalRevenue: 0, totalTicketRevenue: 0, totalMerchRevenue: 0,
            },
            airingDayChangedDay: null,
        };

        // Initialize championships
        for (const key of this.championshipKeys) {
            promotion.championships.titles[key] = {
                id: key,
                key,
                ...this.titleDefinitionConfig[key],
                unlocked: false,
                championId: null,
                championName: null,
                reigns: 0,
                titleDefenses: 0,
                prestigeLevel: this.championshipPrestigeStart[key] || 1,
                lineage: [],
                beltDesign: {
                    colors: ['gold', 'red'],
                    plates: ['center', 'side'],
                    sidePlates: [],
                    leatherColor: 'black',
                },
                createdDay: currentDay,
            };
        }

        this.promotions.set(nationId, promotion);

        // Set on nation for serialization
        nation.wrestlingPromotion = promotion;

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:promotionCreated', { nationId, promotion });
        }

        return promotion;
    }

    getPromotion(nationId) {
        return this.promotions.get(nationId) || null;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // AIRING DAY
    // ════════════════════════════════════════════════════════════════════════════

    getNextAiringDay(currentDay, airingDay) {
        const dayMap = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
        const target = dayMap[airingDay];
        const currentWeekday = currentDay % 7;
        let daysUntil = target - currentWeekday;
        if (daysUntil <= 0) daysUntil += 7;
        return daysUntil; // 1-7
    }

    changeAiringDay(nationId, newAiringDay) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');
        if (!promotion.isActive) throw new Error('Promotion is inactive');

        const currentDay = this.world.state ? this.world.state.day : 0;
        if (promotion.airingDayChangedDay !== null && currentDay - promotion.airingDayChangedDay < 14) {
            throw new Error('Airing day can only be changed once per 14 days');
        }

        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(newAiringDay)) throw new Error('Invalid airing day');

        promotion.airingDay = newAiringDay;
        promotion.airingDayChangedDay = currentDay;

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:airingDayChanged', { nationId, airingDay: newAiringDay });
        }

        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // ARENA UPGRADES
    // ════════════════════════════════════════════════════════════════════════════

    upgradeArena(nationId, data = {}) {
        const { upgradeType } = data;
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');
        if (!promotion.isActive) throw new Error('Promotion is inactive');

        const key = this.upgradeTypeToKey[upgradeType];
        if (!key) throw new Error('Unknown arena upgrade');

        const currentLevel = promotion.arena[key];
        if (currentLevel === undefined) throw new Error('Unknown arena upgrade');
        if (currentLevel >= 10) throw new Error('Maximum upgrade level reached');

        const nation = this.getNation(nationId);
        if (!nation) throw new Error('Nation not found');

        // Technology Center requires nation tech level
        if (upgradeType === 'Technology Center') {
            const requiredTech = (currentLevel + 1) * 100;
            if ((nation.tech || 0) < requiredTech) {
                throw new Error(`Technology Center level ${currentLevel + 1} requires ${requiredTech} nation technology`);
            }
        }

        const cost = this.getUpgradeCost(upgradeType, currentLevel + 1);
        if (nation.money < cost) throw new Error('Insufficient nation funds');

        nation.money -= cost;
        promotion.arena[key]++;

        return { cost, newLevel: promotion.arena[key] };
    }

    getUpgradeCost(upgradeType, level) {
        const baseCost = this.upgradeBaseCosts[upgradeType];
        if (!baseCost) throw new Error('Unknown upgrade type');
        return Math.floor(baseCost * Math.pow(1.5, level - 1));
    }

    // ════════════════════════════════════════════════════════════════════════════
    // TICKET PRICING
    // ════════════════════════════════════════════════════════════════════════════

    setTicketPrice(nationId, data = {}) {
        const { showType, price } = data;
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');

        if (showType !== 'weekly' && showType !== 'monthlyPPV') {
            throw new Error('Invalid show type');
        }

        const p = Number(price);
        if (!Number.isFinite(p) || p < 1 || p > 500) {
            throw new Error('Ticket price must be between $1 and $500');
        }

        promotion.ticketPrice[showType] = p;
        return { showType, price: p };
    }

    // ════════════════════════════════════════════════════════════════════════════
    // BOOKING
    // ════════════════════════════════════════════════════════════════════════════

    bookMatch(nationId, data = {}) {
        const { matchType, stipulation, titleKey, participantIds } = data;
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');
        if (!promotion.isActive) throw new Error('Promotion is inactive');

        const currentDay = this.world.state ? this.world.state.day : 0;
        const daysUntil = this.getNextAiringDay(currentDay, promotion.airingDay);
        if (daysUntil <= 1) {
            throw new Error('Booking window is closed for this week');
        }

        if (!this.matchTypes.includes(matchType)) throw new Error('Invalid match type');
        if (!this.stipulations.includes(stipulation)) throw new Error('Invalid stipulation');

        if (promotion.weeklyShow.matches.length >= 4) {
            throw new Error('Weekly show card is full (max 4 matches)');
        }

        // Validate participants
        const participants = [];
        for (const wid of participantIds) {
            const wrestler = this.wrestlers.get(wid);
            if (!wrestler) throw new Error(`Wrestler ${wid} not found`);
            if (!promotion.roster[wid]) throw new Error(`Wrestler ${wid} not on roster`);
            if (!this.wrestlerSystem.canWrestle(wrestler)) throw new Error(`Wrestler ${wid} cannot wrestle`);
            if (participants.some(p => p.wrestlerId === wid)) throw new Error(`Wrestler ${wid} already booked`);
            participants.push({ wrestlerId: wid, team: null });
        }

        // Check no wrestler is already booked on another match this week
        const bookedWrestlerIds = new Set();
        for (const existingMatch of promotion.weeklyShow.matches) {
            for (const p of existingMatch.participants) {
                bookedWrestlerIds.add(p.wrestlerId);
            }
        }
        for (const p of participants) {
            if (bookedWrestlerIds.has(p.wrestlerId)) {
                throw new Error(`Wrestler ${p.wrestlerId} is already booked on this week's card`);
            }
        }

        // Title match validation
        if (titleKey) {
            this.validateTitleMatch(matchType, stipulation, titleKey, participants, promotion);
        }

        // Ladder rule
        if (stipulation === 'ladder' && !titleKey) {
            throw new Error('Ladder stipulation can only be used for title matches');
        }

        const match = {
            id: this.generateId(),
            matchType,
            stipulation,
            titleKey: titleKey || null,
            participants,
            winnerId: null,
            fansGained: 0,
            matchGrade: null,
            injuries: [],
            narrative: '',
        };

        promotion.weeklyShow.matches.push(match);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:bookMatch', { nationId, match, promotion });
        }

        return match;
    }

    validateTitleMatch(matchType, stipulation, titleKey, participants, promotion) {
        const title = promotion.championships.titles[titleKey];
        if (!title) throw new Error('Title not found');
        if (!title.unlocked) throw new Error('Title is not unlocked');

        // Check title match type restrictions
        if (title.requiredMatchType === 'singles' && matchType !== 'singles') {
            throw new Error(`${title.name} can only be defended in singles matches`);
        }
        if (title.requiredMatchType === 'tagteam' && matchType !== 'tagteam') {
            throw new Error(`${title.name} can only be defended in tag team matches`);
        }

        // Insanity title requires Insanity stipulation
        if (title.requiredStipulation && stipulation !== title.requiredStipulation) {
            throw new Error(`${title.name} requires ${title.requiredStipulation} stipulation`);
        }

        // Tag team gender validation
        if (title.requiredMatchType === 'tagteam' && participants.length === 2) {
            const wA = this.wrestlers.get(participants[0].wrestlerId);
            const wB = this.wrestlers.get(participants[1].wrestlerId);
            if (wA.gender !== title.gender || wB.gender !== title.gender) {
                throw new Error(`Both wrestlers must be ${title.gender} for ${title.name}`);
            }
        }

        // Gender conflict - wrestler cannot hold opposing-gender titles
        for (const p of participants) {
            const w = this.wrestlers.get(p.wrestlerId);
            if (!w) continue;
            // Check if wrestler already holds a title of opposing gender
            for (const [key, t] of Object.entries(promotion.championships.titles)) {
                if (t.championId === p.wrestlerId && t.gender !== 'intergender' && t.gender !== title.gender) {
                    throw new Error(`Wrestler already holds opposing-gender title ${t.name}`);
                }
            }
        }
    }

    removeMatch(nationId, matchId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');

        const currentDay = this.world.state ? this.world.state.day : 0;
        const daysUntil = this.getNextAiringDay(currentDay, promotion.airingDay);
        if (daysUntil <= 1) {
            throw new Error('Booking window is closed');
        }

        const idx = promotion.weeklyShow.matches.findIndex(m => m.id === matchId);
        if (idx === -1) throw new Error('Match not found');

        promotion.weeklyShow.matches.splice(idx, 1);
        return true;
    }

    setWeeklyCard(nationId, matchIds) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');

        const currentDay = this.world.state ? this.world.state.day : 0;
        const daysUntil = this.getNextAiringDay(currentDay, promotion.airingDay);
        if (daysUntil <= 1) {
            throw new Error('Booking window is closed');
        }

        const matches = [];
        for (const mid of matchIds) {
            const match = promotion.weeklyShow.matches.find(m => m.id === mid);
            if (match) matches.push(match);
        }

        promotion.weeklyShow.matches = matches;
        promotion.weeklyShow.weekStartDay = currentDay;
        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SHOW SIMULATION
    // ════════════════════════════════════════════════════════════════════════════

    processWeeklyShow(nationId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');
        if (!promotion.isActive) throw new Error('Promotion is inactive');

        const currentDay = this.world.state ? this.world.state.day : 0;
        const matches = [...promotion.weeklyShow.matches];
        if (matches.length === 0) {
            promotion.lastShowDay = currentDay;
            promotion.weeklyShow.matches = [];
            return { matches: [], fansGained: 0, showRating: "0.0", revenue: 0 };
        }

        const results = [];
        let totalFans = 0;

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const result = this.simulateMatch(nationId, match, i === matches.length - 1);
            results.push(result);
            totalFans += result.fansGained || 0;
        }

        // Cap fans at population
        const nation = this.getNation(nationId);
        const population = nation ? (nation.population || 0) : 0;
        promotion.fans = Math.min(promotion.fans + totalFans, population);
        if (promotion.fans > promotion.maxFansEver) {
            promotion.maxFansEver = promotion.fans;
        }

        // Calculate show rating
        const showRating = this.calculateShowRating(results);

        // Revenue
        const attendance = this.calculateAttendance(promotion, results);
        const ticketPrice = promotion.ticketPrice.weekly || 25;
        const ticketRevenue = attendance * ticketPrice;
        const concessionsRevenue = attendance * (promotion.arena.concessions || 0) * 2;
        const merchRevenue = this.calculateMerchRevenue(promotion, results);
        const totalRevenue = ticketRevenue + concessionsRevenue + merchRevenue;
        nation.money = (nation.money || 0) + totalRevenue;

        // Pay salaries
        this.paySalaries(nationId);

        // Update promotion stats
        promotion.statistics.showsHeld++;
        promotion.statistics.totalMatches += results.length;
        promotion.statistics.fansGainedTotal = (promotion.statistics.fansGainedTotal || 0) + totalFans;
        promotion.statistics.totalRevenue = (promotion.statistics.totalRevenue || 0) + totalRevenue;
        promotion.statistics.totalTicketRevenue = (promotion.statistics.totalTicketRevenue || 0) + ticketRevenue;
        promotion.statistics.totalMerchRevenue = (promotion.statistics.totalMerchRevenue || 0) + merchRevenue;

        // Check championship unlocks
        this.checkChampionshipUnlocks(nationId);

        // Store history
        promotion.showHistory.push({
            week: promotion.statistics.showsHeld,
            day: currentDay,
            matches: results,
            fansGained: totalFans,
            showRating,
            ticketRevenue,
            concessionsRevenue,
            merchRevenue,
            ppvBuyRevenue: 0,
            attendance,
        });

        // Clear card
        promotion.weeklyShow.matches = [];
        promotion.lastShowDay = currentDay;

        const showResult = {
            matches: results,
            fansGained: totalFans,
            showRating,
            ticketRevenue,
            concessionsRevenue,
            merchRevenue,
            ppvBuyRevenue: 0,
            attendance,
            totalRevenue,
        };

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:showCompleted', { nationId, promotion, result: showResult });
        }

        return showResult;
    }

    simulateMatch(nationId, match, isMainEvent) {
        const participants = match.participants.map(p => {
            const w = this.wrestlers.get(p.wrestlerId);
            return w ? { ...p, wrestler: w } : null;
        }).filter(Boolean);

        if (participants.length === 0) {
            return { ...match, error: 'No valid participants' };
        }

        // Determine winner
        const winner = this.determineWinner(match.matchType, participants);

        // Calculate grade
        const grade = this.calculateMatchGrade(match, participants, winner, isMainEvent);

        // Calculate fans
        const fansGained = this.calculateMatchFans(match, participants, grade, match.titleKey);

        // Distribute fans to participants
        const totalCharisma = participants.reduce((sum, p) => sum + (p.wrestler.charisma || 0), 0);
        for (const p of participants) {
            const share = totalCharisma > 0 ? (p.wrestler.charisma || 0) / totalCharisma : 1 / participants.length;
            const wrestlerFans = Math.floor(fansGained * share);
            this.wrestlerSystem.adjustPersonalFans(p.wrestler, wrestlerFans);
            p.wrestler.matchesWrestled++;
            if (p.wrestlerId === winner.id) {
                p.wrestler.wins++;
            } else {
                p.wrestler.losses++;
            }
        }

        // Injuries
        const injuries = [];
        for (const p of participants) {
            const injuryResult = this.wrestlerSystem.inflictInjury(
                p.wrestler, match.id, match.stipulation, 0
            );
            if (injuryResult) {
                injuries.push({ wrestlerId: p.wrestlerId, ...injuryResult });
                promotion.statistics.injuriesTotal++;
            }
        }

        // Title change
        let titleChanged = false;
        if (match.titleKey && match.titleKey !== null) {
            const title = this.getPromotion(nationId).championships.titles[match.titleKey];
            if (title && title.championId !== winner.id) {
                // Title changes hands
                const oldChampionId = title.championId;
                title.championId = winner.id;
                title.championName = winner.wrestler.name;
                title.reigns++;
                title.titleDefenses++;
                title.lineage.push({
                    championId: winner.id,
                    startDay: this.world.state ? this.world.state.day : 0,
                    endDay: null,
                    defenses: 0,
                    note: 'Title change',
                });
                titleChanged = true;

                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('wrestling:titleChanged', {
                        nationId, titleKey: match.titleKey, oldChampionId, newChampionId: winner.id,
                    });
                }
            } else if (title) {
                title.titleDefenses++;
            }
        }

        const narrative = this.generateMatchText(match, winner, grade, titleChanged);

        return {
            ...match,
            winnerId: winner.id,
            winnerName: winner.wrestler.name,
            matchGrade: grade,
            fansGained,
            injuries,
            titleChanged,
            narrative,
            participants: participants.map(p => ({
                wrestlerId: p.wrestlerId,
                wrestlerName: p.wrestler.name,
                isWinner: p.wrestlerId === winner.id,
            })),
        };
    }

    determineWinner(matchType, participants) {
        // Win probability based on strength + agility
        const scores = participants.map(p => {
            const w = p.wrestler;
            let score = (w.strength || 0) + (w.agility || 0);

            // Endurance bonus for longer matches
            if (matchType === 'ironman' || matchType === '2of3falls') {
                score += (w.endurance || 0) * 0.2;
            }

            // Featured match bonus
            const fmMatch = w.featuredMatch && w.featuredMatch.matchType === matchType;
            const fmStip = w.featuredMatch && w.featuredMatch.stipulation === null; // handled elsewhere
            if (fmMatch) score *= 1.1;

            // Finisher rating
            score += (w.finisherMove?.finisherRating || 0) * 0.1;

            // Morale/happiness
            score *= (0.8 + (w.morale || 50) / 500);
            score *= (0.8 + (w.happiness || 50) / 500);

            // Random variance ±10%
            score *= (0.9 + Math.random() * 0.2);

            return { wrestler: w, score };
        });

        // For tag team, determine winning team first
        if (matchType === 'tagteam' && participants.length === 4) {
            const teamA = participants.slice(0, 2);
            const teamB = participants.slice(2, 4);
            const teamAScore = teamA.reduce((sum, p) => sum + p.score, 0);
            const teamBScore = teamB.reduce((sum, p) => sum + p.score, 0);
            const winningTeam = teamAScore > teamBScore ? teamA : teamB;

            // Within winning team, determine who scores the fall
            const winnerEntry = winningTeam[0].score > winningTeam[1].score ? winningTeam[0] : winningTeam[1];
            return winnerEntry;
        }

        // For multi-way, pick proportional to score
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
        let roll = Math.random() * totalScore;
        for (const s of scores) {
            roll -= s.score;
            if (roll <= 0) return s;
        }
        return scores[scores.length - 1];
    }

    calculateMatchGrade(match, participants, winner, isMainEvent) {
        let grade = 50; // Base

        // Wrestler skills
        const avgStat = participants.reduce((sum, p) => sum + (p.wrestler.strength || 0) + (p.wrestler.agility || 0), 0) / (participants.length * 2);
        grade += (avgStat - 50) * 0.3;

        // Endurance
        const avgEndurance = participants.reduce((sum, p) => sum + (p.wrestler.endurance || 0), 0) / participants.length;
        grade += (avgEndurance - 50) * 0.1;

        // Charisma
        const avgCharisma = participants.reduce((sum, p) => sum + (p.wrestler.charisma || 0), 0) / participants.length;
        grade += (avgCharisma - 50) * 0.2;

        // Match type modifier
        const typeMod = { singles: 0, tagteam: 5, trickytrio: 8, fatalfour: 3 }[match.matchType] || 0;
        grade += typeMod;

        // Stipulation modifier
        const stipMod = {
            'deathmatch': 10, 'insanity': 8, 'ladder': 7, 'cage': 5,
            'table': 4, 'firstblood': 4, 'lastmanstanding': 4, '2of3falls': 3,
            'ironman': 3, 'submissiononly': 2, 'nodq': 2, 'nocountout': 1, '1fall': 0,
        }[match.stipulation] || 0;
        grade += stipMod;

        // Title match prestige
        if (match.titleKey) {
            const promotion = this.getPromotionFromParticipant(participants[0].wrestlerId);
            const title = promotion ? promotion.championships.titles[match.titleKey] : null;
            if (title) grade += (title.prestigeLevel || 1) * 2;
        }

        // Featured match bonus
        for (const p of participants) {
            const fm = p.wrestler.featuredMatch;
            if (fm && fm.matchType === match.matchType && fm.stipulation === match.stipulation) {
                grade += 5;
            } else if (fm && fm.matchType === match.matchType) {
                grade += 2;
            }
        }

        // Morale
        const avgMorale = participants.reduce((sum, p) => sum + (p.wrestler.morale || 50), 0) / participants.length;
        grade += (avgMorale - 50) * 0.1;

        // Happiness
        const avgHappiness = participants.reduce((sum, p) => sum + (p.wrestler.happiness || 50), 0) / participants.length;
        grade += (avgHappiness - 50) * 0.1;

        // Random variance
        grade += (Math.random() - 0.5) * 10;

        // Convert to star rating 0.0-5.0 with tenths precision
        grade = Math.max(0, Math.min(100, grade));
        const stars = Math.round((grade / 100) * 5 * 10) / 10;
        return stars.toFixed(1);
    }

    getPromotionFromParticipant(wrestlerId) {
        for (const [nationId, promotion] of this.promotions) {
            if (promotion.roster[wrestlerId]) return promotion;
        }
        return null;
    }

    calculateMatchFans(match, participants, grade, titleKey) {
        const promotion = this.getPromotionFromParticipant(participants[0].wrestlerId);
        if (!promotion) return 0;

        const seatingLevel = promotion.arena.seating || 0;
        const fanExpLevel = promotion.arena.fanExperience || 0;

        const baseFans = 500 + seatingLevel * 50 + fanExpLevel * 100;
        const totalCharisma = participants.reduce((sum, p) => sum + (p.wrestler.charisma || 0), 0);
        const charismaFactor = 1 + (totalCharisma / 100) * 0.5;

        const stars = parseFloat(grade) || 0.0;
        const gradeMultiplier = 0.5 + (stars / 5.0) * 1.5;
        const stipMultiplier = this.stipulationMultipliers[match.stipulation] || 1.0;
        const titleMultiplier = titleKey ? (this.championshipFanMultiplier[titleKey] || 1.0) : 1.0;

        // Featured match bonus (use best participant's)
        let featuredBonus = 1.0;
        for (const p of participants) {
            const fm = p.wrestler.featuredMatch;
            if (fm && fm.matchType === match.matchType && fm.stipulation === match.stipulation) {
                featuredBonus = 1.2;
                break;
            } else if (fm && fm.matchType === match.matchType) {
                featuredBonus = Math.max(featuredBonus, 1.1);
            }
        }

        const winBonus = 1.3;

        const fans = baseFans * charismaFactor * gradeMultiplier * stipMultiplier * titleMultiplier * featuredBonus * winBonus;
        return Math.floor(fans);
    }

    calculateShowRating(results) {
        if (results.length === 0) return "0.0";

        let weightedSum = 0;
        let totalWeight = 0;
        results.forEach((r, i) => {
            const weight = i === results.length - 1 ? 2 : 0.5; // main event 2x, opener 0.5x
            weightedSum += (parseFloat(r.matchGrade || "0.0") || 0.0) * weight;
            totalWeight += weight;
        });

        let rating = weightedSum / totalWeight;

        // Title match bonus
        const titleMatches = results.filter(r => r.titleKey).length;
        rating *= (1 + titleMatches * 0.05);

        // Stipulation variety
        const stipulations = new Set(results.map(r => r.stipulation));
        rating *= (1 + (stipulations.size - 1) * 0.02);

        rating = Math.round(Math.min(5.0, Math.max(0.0, rating)) * 10) / 10;
        return rating.toFixed(1);
    }

    getStarDisplay(rating) {
        const stars = parseFloat(rating || "0.0") || 0.0;
        const filledStars = Math.floor(stars);
        const partialFill = Math.round((stars - filledStars) * 100); // 0-100%
        return { filledStars, partialFill, totalStars: stars };
    }

    calculateAttendance(promotion, results) {
        const seatingLevel = promotion.arena.seating || 0;
        const capacity = seatingLevel * 5000;
        if (capacity === 0) return 0;

        // Draw factor based on fans/population, grade, etc.
        const drawFactor = Math.min(1, Math.max(0.1, 0.3 + (promotion.fans / Math.max(1, 1000000)) * 0.7));
        const gradeFactor = results.reduce((sum, r) => {
            const stars = parseFloat(r.matchGrade || "0.0") || 0.0;
            // Multiplier: 0.5 at 0 stars, 2.0 at 5 stars
            return 0.5 + (stars / 5.0) * 1.5;
        }, 0) / results.length;
        const priceFactor = Math.max(0, 1 - ((promotion.ticketPrice.weekly || 25) / 100));

        const attendance = Math.floor(capacity * drawFactor * gradeFactor * priceFactor);
        return Math.min(attendance, capacity);
    }

    calculateMerchRevenue(promotion, results) {
        let merch = 0;
        for (const r of results) {
            for (const p of r.participants) {
                const w = this.wrestlers.get(p.wrestlerId);
                if (w) {
                    merch += Math.floor(w.personalFans * 0.01 * 1.1); // merchMultiplier * concessionsBonus
                }
            }
        }
        return merch;
    }

    paySalaries(nationId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) return;

        const nation = this.getNation(nationId);
        if (!nation) return;

        let totalSalary = 0;
        for (const wid of Object.keys(promotion.roster)) {
            const w = this.wrestlers.get(wid);
            if (w && !w.isRetired) {
                totalSalary += w.salary || 0;
            }
        }

        nation.money = Math.max(0, (nation.money || 0) - totalSalary);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // CHAMPIONSHIP UNLOCKS
    // ════════════════════════════════════════════════════════════════════════════

    checkChampionshipUnlocks(nationId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) return [];

        const nation = this.getNation(nationId);
        const population = nation ? (nation.population || 0) : 0;
        if (population === 0) return [];

        const fanPercent = (promotion.maxFansEver / population) * 100;
        const newlyUnlocked = [];

        for (const tier of this.championshipUnlockTiers) {
            if (fanPercent >= tier.threshold) {
                for (const key of tier.keys) {
                    const title = promotion.championships.titles[key];
                    if (title && !title.unlocked) {
                        title.unlocked = true;
                        promotion.championships.unlocked.push(key);
                        newlyUnlocked.push(key);

                        if (typeof EventBus !== 'undefined') {
                            EventBus.emit('wrestling:championshipUnlocked', {
                                nationId, titleKey: key, title: title.name,
                            });
                        }
                    }
                }
            }
        }

        return newlyUnlocked;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // MONTHLY PPV
    // ════════════════════════════════════════════════════════════════════════════

    processMonthlyPpv(nationId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');
        if (!promotion.isActive) throw new Error('Promotion is inactive');

        const currentDay = this.world.state ? this.world.state.day : 0;

        // Monthly PPV replaces weekly show - use booked weekly matches (up to 6) as PPV card
        const ppvMatches = [...promotion.weeklyShow.matches].slice(0, 6);
        promotion.weeklyShow.matches = [];

        const results = [];
        let totalFans = 0;
        for (const match of ppvMatches) {
            const result = this.simulateMatch(nationId, match, true);
            results.push(result);
            totalFans += result.fansGained || 0;
        }

        const nation = this.getNation(nationId);
        const population = nation ? (nation.population || 0) : 0;
        promotion.fans = Math.min(promotion.fans + totalFans, population);
        if (promotion.fans > promotion.maxFansEver) promotion.maxFansEver = promotion.fans;

        const showRating = this.calculateShowRating(results);
        const attendance = this.calculateAttendance(promotion, results);
        const ticketPrice = promotion.ticketPrice.monthlyPPV || 50;
        const ticketRevenue = attendance * ticketPrice;
        const concessionsRevenue = attendance * (promotion.arena.concessions || 0) * 2;
        const merchRevenue = this.calculateMerchRevenue(promotion, results);
        const ppvBuyRevenue = Math.floor(showRating * 1000); // Simplified PPV buy revenue
        const totalRevenue = ticketRevenue + concessionsRevenue + merchRevenue + ppvBuyRevenue;
        nation.money = (nation.money || 0) + totalRevenue;

        this.paySalaries(nationId);

        promotion.statistics.showsHeld++;
        promotion.statistics.totalMatches += results.length;
        promotion.statistics.fansGainedTotal = (promotion.statistics.fansGainedTotal || 0) + totalFans;

        this.checkChampionshipUnlocks(nationId);

        promotion.monthlyPpvHistory.push({
            day: currentDay,
            matches: results,
            fansGained: totalFans,
            showRating,
            ticketRevenue,
            concessionsRevenue,
            merchRevenue,
            ppvBuyRevenue,
            attendance,
        });

        promotion.lastShowDay = currentDay;
        promotion.lastMonthlyPpvDay = currentDay;

        const ppvResult = {
            matches: results,
            fansGained: totalFans,
            showRating,
            ticketRevenue,
            concessionsRevenue,
            merchRevenue,
            ppvBuyRevenue,
            attendance,
            totalRevenue,
        };

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:monthlyPpvCompleted', { nationId, promotion, result: ppvResult });
        }

        return ppvResult;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // QUARTERLY MASS PPV
    // ════════════════════════════════════════════════════════════════════════════

    registerMassPpvWrestler(nationId, data = {}) {
        const { wrestlerId, titleOnTheLineKey } = data;
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');
        if (!promotion.isActive) throw new Error('Promotion is inactive');

        const wrestler = this.wrestlers.get(wrestlerId);
        if (!wrestler) throw new Error('Wrestler not found');
        if (!promotion.roster[wrestlerId]) throw new Error('Wrestler not on roster');
        if (wrestler.isInjured) throw new Error('Wrestler is injured');

        // Validate title on the line
        if (titleOnTheLineKey) {
            const title = promotion.championships.titles[titleOnTheLineKey];
            if (!title) throw new Error('Title not found');
            if (title.championId !== wrestlerId) throw new Error('Wrestler does not hold this title');
            if (promotion.championships.blockedTitles.includes(titleOnTheLineKey)) {
                throw new Error('Title is blocked from Mass PPV');
            }
        }

        this.massPpvRegistrations.set(nationId, { wrestlerId, titleOnTheLineKey: titleOnTheLineKey || null });

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:massPpvRegistered', { nationId, wrestlerId, titleOnTheLineKey });
        }

        return true;
    }

    processMassPpv() {
        const currentDay = this.world.state ? this.world.state.day : 0;

        // Initialize cycle day if not set
        if (!this.massPpvCycleDay) {
            this.massPpvCycleDay = currentDay + 90;
        }

        if (currentDay < this.massPpvCycleDay) return null;

        const registrations = [...this.massPpvRegistrations.entries()];
        if (registrations.length === 0) {
            this.massPpvCycleDay = currentDay + 90;
            this.massPpvRegistrations.clear();
            return null;
        }

        // Group wrestlers into matches
        const participants = [];
        for (const [nationId, reg] of registrations) {
            const promotion = this.getPromotion(nationId);
            const wrestler = this.wrestlers.get(reg.wrestlerId);
            if (wrestler && wrestler.isInjured) {
                // Replace with next top-rated available wrestler
                const replacement = this.findReplacementWrestler(nationId);
                if (replacement) {
                    participants.push({ nationId, wrestler: replacement, titleOnTheLineKey: null });
                    this.massPpvRegistrations.set(nationId, { wrestlerId: replacement.id, titleOnTheLineKey: null });
                }
            } else if (wrestler) {
                participants.push({ nationId, wrestler, titleOnTheLineKey: reg.titleOnTheLineKey });
            }
        }

        // Randomly group into matches
        const matches = this.generateMassPpvMatches(participants);

        // Simulate each match
        const results = [];
        for (const match of matches) {
            const matchResult = this.simulateMassPpvMatch(match);
            results.push(matchResult);
        }

        // Advance cycle
        this.massPpvCycleDay = currentDay + 90;

        // Clear blocked titles after cycle completes
        for (const [nationId] of registrations) {
            const promotion = this.getPromotion(nationId);
            if (promotion) {
                promotion.championships.blockedTitles = [];
            }
        }

        this.massPpvRegistrations.clear();

        const massPpvResult = {
            day: currentDay,
            matches: results,
        };

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:massPpvCompleted', massPpvResult);
        }

        return massPpvResult;
    }

    findReplacementWrestler(nationId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) return null;

        let best = null;
        let bestRating = -1;
        for (const wid of Object.keys(promotion.roster)) {
            const w = this.wrestlers.get(wid);
            if (w && this.wrestlerSystem.canWrestle(w)) {
                const rating = this.wrestlerSystem.calculateRating(w);
                if (rating > bestRating) {
                    bestRating = rating;
                    best = w;
                }
            }
        }
        return best;
    }

    generateMassPpvMatches(participants) {
        const matches = [];
        const shuffled = [...participants].sort(() => Math.random() - 0.5);

        // Simple grouping: singles pairs, then trios, then fatal four
        let i = 0;
        while (i < shuffled.length) {
            const remaining = shuffled.length - i;
            if (remaining >= 4) {
                matches.push({
                    participants: shuffled.slice(i, i + 4),
                    matchType: 'fatalfour',
                    stipulation: this.stipulations[Math.floor(Math.random() * this.stipulations.length)],
                });
                i += 4;
            } else if (remaining >= 3) {
                matches.push({
                    participants: shuffled.slice(i, i + 3),
                    matchType: 'trickytrio',
                    stipulation: this.stipulations[Math.floor(Math.random() * this.stipulations.length)],
                });
                i += 3;
            } else if (remaining >= 2) {
                matches.push({
                    participants: shuffled.slice(i, i + 2),
                    matchType: 'singles',
                    stipulation: this.stipulations[Math.floor(Math.random() * this.stipulations.length)],
                });
                i += 2;
            } else {
                i++;
            }
        }

        return matches;
    }

    simulateMassPpvMatch(match) {
        const participants = match.participants.map(p => ({ wrestler: p.wrestler, nationId: p.nationId, titleOnTheLineKey: p.titleOnTheLineKey }));

        const winnerEntry = this.determineWinner(match.matchType, participants.map(p => ({ wrestler: p.wrestler })));

        const winner = participants.find(p => p.wrestler.id === winnerEntry.wrestler.id);

        // Calculate performance-based payout
        let currencyChange = 0;
        let fanChange = 0;
        let titleWon = null;
        let titleLost = null;
        let titleBlocked = false;

        if (winner) {
            // Winner payout
            currencyChange = 50000 + Math.floor(Math.random() * 50000);
            fanChange = 5000 + Math.floor(Math.random() * 5000);

            // Title on the line - win
            if (winner.titleOnTheLineKey) {
                const promotion = this.getPromotion(winner.nationId);
                const title = promotion ? promotion.championships.titles[winner.titleOnTheLineKey] : null;
                if (title && title.championId === winner.wrestler.id) {
                    // Champion retains title - bonus
                    currencyChange = Math.floor(currencyChange * 1.5);
                    fanChange = Math.floor(fanChange * 1.5);
                } else if (title && title.championId !== winner.wrestler.id && title.championId !== null) {
                    // Challenger wins the title - transfer it
                    const oldChampionId = title.championId;
                    title.championId = winner.wrestler.id;
                    title.championName = winner.wrestler.name;
                    title.reigns++;
                    title.titleDefenses++;
                    title.lineage.push({
                        championId: winner.wrestler.id,
                        startDay: this.world.state ? this.world.state.day : 0,
                        endDay: null,
                        defenses: 0,
                        note: 'Mass PPV title change',
                    });
                    titleWon = winner.titleOnTheLineKey;

                    if (typeof EventBus !== 'undefined') {
                        EventBus.emit('wrestling:titleChanged', {
                            nationId: winner.nationId, titleKey: winner.titleOnTheLineKey, oldChampionId, newChampionId: winner.wrestler.id,
                        });
                    }

                    currencyChange = Math.floor(currencyChange * 1.5);
                    fanChange = Math.floor(fanChange * 1.5);
                } else if (!title || title.championId === null) {
                    // Vacant title - winner claims it
                    if (title) {
                        title.championId = winner.wrestler.id;
                        title.championName = winner.wrestler.name;
                        title.reigns++;
                        title.titleDefenses++;
                        title.lineage.push({
                            championId: winner.wrestler.id,
                            startDay: this.world.state ? this.world.state.day : 0,
                            endDay: null,
                            defenses: 0,
                            note: 'Mass PPV vacant title claim',
                        });
                        titleWon = winner.titleOnTheLineKey;

                        if (typeof EventBus !== 'undefined') {
                            EventBus.emit('wrestling:titleChanged', {
                                nationId: winner.nationId, titleKey: winner.titleOnTheLineKey, oldChampionId: null, newChampionId: winner.wrestler.id,
                            });
                        }

                        currencyChange = Math.floor(currencyChange * 1.5);
                        fanChange = Math.floor(fanChange * 1.5);
                    }
                }
            }
        }

        // Loser payout - always applied when there's a winner
        const loserFanChange = -5000 - Math.floor(Math.random() * 5000);

        // Title on the line - lose (champion loses title)
        if (winner && winner.titleOnTheLineKey) {
            const promotion = this.getPromotion(winner.nationId);
            const title = promotion ? promotion.championships.titles[winner.titleOnTheLineKey] : null;
            if (title && title.championId === winner.wrestler.id) {
                // This shouldn't happen since winner kept the title above, but handle edge case
                titleLost = null;
            }
        }

        // Check if any participant had a title on the line and lost (champion who didn't win)
        for (const p of participants) {
            if (p.wrestler.id !== winnerEntry.wrestler.id && p.titleOnTheLineKey) {
                const promotion = this.getPromotion(p.nationId);
                const title = promotion ? promotion.championships.titles[p.titleOnTheLineKey] : null;
                if (title && title.championId === p.wrestler.id) {
                    titleLost = p.titleOnTheLineKey;
                    titleBlocked = true;
                    title.championId = null;
                    title.championName = null;
                    promotion.championships.blockedTitles.push(p.titleOnTheLineKey);

                    if (typeof EventBus !== 'undefined') {
                        EventBus.emit('wrestling:titleBlocked', {
                            nationId: p.nationId, titleKey: p.titleOnTheLineKey,
                        });
                    }
                }
            }
        }

        // Apply changes
        if (winner) {
            const promotion = this.getPromotion(winner.nationId);
            const nation = this.getNation(winner.nationId);
            const population = nation ? (nation.population || 0) : 0;
            nation.money = Math.max(0, (nation.money || 0) + currencyChange);
            promotion.fans = Math.min(Math.max(0, promotion.fans + fanChange), population);
            if (promotion.fans > promotion.maxFansEver) promotion.maxFansEver = promotion.fans;

            winner.wrestler.matchesWrestled++;
            winner.wrestler.wins++;
        }

        // Also apply to losers
        for (const p of participants) {
            if (p.wrestler.id !== winnerEntry.wrestler.id) {
                p.wrestler.matchesWrestled++;
                p.wrestler.losses++;
                const promotion = this.getPromotion(p.nationId);
                const nation = this.getNation(p.nationId);
                const population = nation ? (nation.population || 0) : 0;
                promotion.fans = Math.min(Math.max(0, promotion.fans + loserFanChange), population);
                if (promotion.fans > promotion.maxFansEver) promotion.maxFansEver = promotion.fans;
            }
        }

        // Store history
        for (const p of participants) {
            const promotion = this.getPromotion(p.nationId);
            if (promotion) {
                const isWinner = p.wrestler.id === winnerEntry.wrestler.id;
                promotion.massPpvHistory.push({
                    day: this.world.state ? this.world.state.day : 0,
                    wrestlerId: p.wrestler.id,
                    matchType: match.matchType,
                    stipulation: match.stipulation,
                    result: isWinner ? 'win' : 'loss',
                    currencyChange: isWinner ? currencyChange : 0,
                    fanChange: isWinner ? fanChange : loserFanChange,
                    titleWon: isWinner ? titleWon : null,
                    titleLost: isWinner ? null : titleLost,
                    titleBlocked: isWinner ? false : titleBlocked,
                });
            }
        }

        return {
            matchType: match.matchType,
            stipulation: match.stipulation,
            participants: participants.map(p => ({
                wrestlerId: p.wrestler.id,
                wrestlerName: p.wrestler.name,
                nationId: p.nationId,
                isWinner: p.wrestler.id === winnerEntry.wrestler.id,
                titleOnTheLineKey: p.titleOnTheLineKey,
            })),
            winnerId: winner ? winner.wrestler.id : null,
            currencyChange: winner ? currencyChange : 0,
            fanChange: winner ? fanChange : loserFanChange,
            titleWon,
            titleLost,
            titleBlocked,
        };
    }

    // ════════════════════════════════════════════════════════════════════════════
    // DRAFT INTEGRATION
    // ════════════════════════════════════════════════════════════════════════════

    draftWrestler(nationId, data = {}) {
        const { playerId } = data;
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');
        if (!promotion.isActive) throw new Error('Promotion is inactive');

        // Use Sports draft system
        const sports = this.world.sports;
        if (!sports) throw new Error('Sports system not available');

        const draftSystem = sports.engine.draftSystem;
        if (!draftSystem) throw new Error('Draft system not available');

        const player = sports.engine.players.get(playerId);
        if (!player) throw new Error('Player not found');
        if (player.sport !== 'wrestling') throw new Error('Player is not a wrestler');

        const nation = this.getNation(nationId);
        if (!nation) throw new Error('Nation not found');
        if (nation.money < player.salary) throw new Error('Insufficient funds for wrestler salary');

        // Convert sports player to wrestler object
        const wrestler = {
            id: playerId,
            name: player.name,
            gender: player.gender || 'men',
            wrestlerType: player.wrestlerType || 'brawler',
            featuredMatch: player.featuredMatch || { matchType: 'singles', stipulation: '1fall' },
            strength: player.attributes?.strength || 50,
            agility: player.attributes?.agility || 50,
            endurance: player.attributes?.endurance || 50,
            charisma: player.attributes?.charisma || 50,
            level: player.level || 1,
            xp: player.xp || 0,
            potential: player.potential || 50,
            morale: player.morale || 70,
            happiness: player.happiness || 70,
            matchesWrestled: 0,
            wins: 0,
            losses: 0,
            fansGainedTotal: 0,
            personalFans: 0,
            titleReigns: [],
            injuries: [],
            isInjured: false,
            injuryWeeksLeft: 0,
            injuryType: null,
            isRetired: player.isRetired || false,
            contractWeeksRemaining: player.contractWeeksRemaining || 4,
            salary: player.salary || 50000,
            signingBonus: Math.floor((player.salary || 50000) * 0.5),
            isDrafted: true,
            draftRate: player.draftRate || 0,
            demographic: player.demographic || 'youngAdult',
            age: player.age || 25,
            tagTeamId: null,
            alignment: player.alignment || 'face',
            gimmick: player.gimmick || 'technical',
            crowdReaction: player.crowdReaction || 0,
            signatureMove: player.signatureMove || { id: 'sig_001', name: 'Suplex', type: 'grappling', damage: 25, fanImpact: 5 },
            finisherMove: player.finisherMove || { id: 'fin_001', name: 'Finishing Blow', type: 'strike', damage: 50, fanImpact: 15, finisherRating: 70 },
            moveSet: player.moveSet || [],
            rivalries: [],
        };

        nation.money -= wrestler.salary;
        promotion.roster[wrestlerId] = true;
        this.wrestlers.set(wrestlerId, wrestler);

        // Remove from draft board
        const board = draftSystem.draftBoards.get('wrestling');
        if (board) board.delete(playerId);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:draftWrestler', { nationId, wrestlerId, wrestler });
        }

        return wrestler;
    }

    releaseWrestler(nationId, wrestlerId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');

        if (!promotion.roster[wrestlerId]) throw new Error('Wrestler not on roster');

        const wrestler = this.wrestlers.get(wrestlerId);
        if (wrestler) {
            // Vacate any titles held
            for (const [key, title] of Object.entries(promotion.championships.titles)) {
                if (title.championId === wrestlerId) {
                    title.championId = null;
                    title.championName = null;
                    promotion.championships.vacantTitles.push(key);
                }
            }
            wrestler.tagTeamId = null;
        }

        delete promotion.roster[wrestlerId];

        // Return to draft board
        const sports = this.world.sports;
        if (sports && sports.engine.draftSystem) {
            const board = sports.engine.draftSystem.draftBoards.get('wrestling');
            if (board && wrestler && !wrestler.isRetired) {
                board.set(wrestlerId, wrestler);
            }
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:releaseWrestler', { nationId, wrestlerId });
        }

        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // DAY PROCESSING
    // ════════════════════════════════════════════════════════════════════════════

    turn(at, day) {
        // Process each promotion
        for (const [nationId, promotion] of this.promotions) {
            if (!promotion.isActive) continue;

            const nation = this.getNation(nationId);
            if (!nation) continue;

            // AI management for AI nations
            if (this.isAINation(nationId)) {
                this.autoManageAIPromotion(nationId);
            }

            // Weekly show
            const daysUntilShow = this.getNextAiringDay(day, promotion.airingDay);
            if (day >= promotion.lastShowDay + daysUntilShow) {
                // Check if monthly PPV falls on this day (replaces weekly show)
                const daysUntilPpv = 30 - ((day - promotion.lastMonthlyPpvDay) % 30);
                if (daysUntilPpv <= 0 && day >= promotion.lastMonthlyPpvDay + 30) {
                    this.processMonthlyPpv(nationId);
                } else {
                    this.processWeeklyShow(nationId);
                }
            }

            // Monthly PPV
            if (day >= promotion.lastMonthlyPpvDay + 30) {
                // Only process if not already done as part of weekly show above
                if (day < promotion.lastShowDay + this.getNextAiringDay(day, promotion.airingDay)) {
                    this.processMonthlyPpv(nationId);
                }
            }

            // Heal injuries weekly
            this.wrestlerSystem.healInjuries(this.wrestlers, promotion.arena.medicalCenter || 0);

            // Decrement contracts weekly
            const expired = this.wrestlerSystem.decrementContracts(this.wrestlers);
            for (const w of expired) {
                if (promotion.roster[w.id]) {
                    this.releaseWrestler(nationId, w.id);
                }
            }

            // Check retirements
            for (const wid of Object.keys(promotion.roster)) {
                const w = this.wrestlers.get(wid);
                if (w && this.wrestlerSystem.checkRetirement(w)) {
                    if (w.isRetired) {
                        this.releaseWrestler(nationId, wid);
                    }
                }
            }

            // Check championship unlocks
            this.checkChampionshipUnlocks(nationId);
        }

        // Mass PPV
        this.processMassPpv();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // ACTION HANDLER (delegated from world.js)
    // ════════════════════════════════════════════════════════════════════════════

    action(nationId, action, data = {}) {
        switch (action) {
            case "wrestlingCreatePromotion":
                return this.createPromotion(nationId, data);
            case "wrestlingChangeAiringDay":
                return this.changeAiringDay(nationId, data.airingDay);
            case "wrestlingBookMatch":
                return this.bookMatch(nationId, data);
            case "wrestlingRemoveMatch":
                return this.removeMatch(nationId, data.matchId);
            case "wrestlingSetWeeklyCard":
                return this.setWeeklyCard(nationId, data.matchIds);
            case "wrestlingUpgradeArena":
                return this.upgradeArena(nationId, data);
            case "wrestlingSetTicketPrice":
                return this.setTicketPrice(nationId, data);
            case "wrestlingDraftWrestler":
                return this.draftWrestler(nationId, data);
            case "wrestlingReleaseWrestler":
                return this.releaseWrestler(nationId, data.wrestlerId);
            case "wrestlingExtendContract":
                return this.wrestlerSystem.extendContract(
                    this.wrestlers.get(data.wrestlerId),
                    data.weeks,
                    this.getNation(nationId)
                );
            case "wrestlingTrainWrestler":
                // Training handled via wrestler system attribute improvement
                return this.wrestlerSystem.trainWrestler(data.wrestlerId, data.attribute, this.getNation(nationId));
            case "wrestlingChangeFeaturedMatch":
                return this.wrestlerSystem.changeFeaturedMatch(
                    this.wrestlers.get(data.wrestlerId),
                    data.matchType,
                    data.stipulation
                );
            case "wrestlingSetSignatureMove":
                return this.wrestlerSystem.setSignatureMove(
                    this.wrestlers.get(data.wrestlerId),
                    data.move
                );
            case "wrestlingSetFinisherMove":
                return this.wrestlerSystem.setFinisherMove(
                    this.wrestlers.get(data.wrestlerId),
                    data.move
                );
            case "wrestlingSetMoveSet":
                return this.wrestlerSystem.setMoveSet(
                    this.wrestlers.get(data.wrestlerId),
                    data.moveSet
                );
            case "wrestlingCreateTagTeam":
                return this.wrestlerSystem.createTagTeam(
                    data.tagTeamId,
                    data.name,
                    data.wrestlerIdA,
                    data.wrestlerIdB,
                    this.wrestlers,
                    this.getPromotion(nationId).tagTeams
                );
            case "wrestlingDissolveTagTeam":
                return this.wrestlerSystem.dissolveTagTeam(
                    data.tagTeamId,
                    this.wrestlers,
                    this.getPromotion(nationId).tagTeams
                );
            case "wrestlingVacateTitle":
                return this.vacateTitle(nationId, data.titleKey);
            case "wrestlingMassPpvRegisterWrestler":
                return this.registerMassPpvWrestler(nationId, data);
            default:
                throw new Error(`Unknown wrestling action: ${action}`);
        }
    }

    vacateTitle(nationId, titleKey) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) throw new Error('Promotion not found');

        const title = promotion.championships.titles[titleKey];
        if (!title) throw new Error('Title not found');
        if (!title.championId) throw new Error('Title is already vacant');

        title.championId = null;
        title.championName = null;
        promotion.championships.vacantTitles.push(titleKey);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:titleVacated', { nationId, titleKey });
        }

        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // AI NATION PROMOTION MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════════

    isAINation(nationId) {
        const nation = this.getNation(nationId);
        if (!nation) return false;
        // AI nations don't have a player account / are not the logged-in user
        return !nation.playerId || nation.playerId === null;
    }

    autoManageAIPromotion(nationId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion || !promotion.isActive) return;

        const nation = this.getNation(nationId);
        if (!nation) return;

        // Auto-draft if roster is empty or small
        const rosterCount = Object.keys(promotion.roster).length;
        if (rosterCount < 3) {
            this.autodraftAIWrestlers(nationId, 3 - rosterCount);
        }

        // Auto-book weekly show if card is empty
        const currentDay = this.getCurrentDay();
        const daysUntilShow = this.getNextAiringDay(currentDay, promotion.airingDay);
        if (daysUntilShow <= 2 && promotion.weeklyShow.matches.length === 0) {
            this.autoBookAIShow(nationId);
        }

        // Auto-register for Mass PPV
        if (this.massPpvCycleDay && !this.massPpvRegistrations.has(nationId)) {
            if (currentDay >= this.massPpvCycleDay - 7) {
                this.autoRegisterMassPpv(nationId);
            }
        }
    }

    autodraftAIWrestlers(nationId, count) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) return;

        const sports = this.world.sports;
        if (!sports) return;

        const draftSystem = sports.engine.draftSystem;
        if (!draftSystem) return;

        const board = draftSystem.getDraftBoard('wrestling');
        if (!board || board.length === 0) return;

        const nation = this.getNation(nationId);
        if (!nation) return;

        let drafted = 0;
        for (const player of board) {
            if (drafted >= count) break;
            if (player.isRetired || player.isDrafted) continue;
            if (nation.money < (player.salary || 50000)) continue;

            try {
                this.draftWrestler(nationId, { playerId: player.id });
                drafted++;
            } catch (e) {
                // Skip on error
            }
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:aiPromotionAction', {
                nationId, action: 'autodraft', drafted,
            });
        }
    }

    autoBookAIShow(nationId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) return;

        const rosterIds = Object.keys(promotion.roster);
        if (rosterIds.length < 2) return;

        // Select top-rated wrestlers for matches
        const wrestlers = rosterIds
            .map(wid => this.wrestlers.get(wid))
            .filter(w => w && this.wrestlerSystem.canWrestle(w));

        if (wrestlers.length < 2) return;

        wrestlers.sort((a, b) => this.wrestlerSystem.calculateRating(b) - this.wrestlerSystem.calculateRating(a));

        const numMatches = Math.min(4, Math.floor(wrestlers.length / 2));
        for (let i = 0; i < numMatches; i++) {
            const wA = wrestlers[i * 2];
            const wB = wrestlers[i * 2 + 1];
            if (!wA || !wB) break;

            const matchType = this.matchTypes[Math.floor(Math.random() * this.matchTypes.length)];
            const stipulation = this.stipulations[Math.floor(Math.random() * this.stipulations.length)];

            // AI occasionally books title matches
            let titleKey = null;
            if (Math.random() < 0.3) {
                const unlocked = promotion.championships.unlocked;
                if (unlocked.length > 0) {
                    titleKey = unlocked[Math.floor(Math.random() * unlocked.length)];
                }
            }

            try {
                this.bookMatch(nationId, {
                    matchType,
                    stipulation,
                    titleKey,
                    participantIds: [wA.id, wB.id],
                });
            } catch (e) {
                // Skip if booking fails
            }
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('wrestling:aiPromotionAction', {
                nationId, action: 'autoBook', matches: numMatches,
            });
        }
    }

    autoRegisterMassPpv(nationId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) return;

        const rosterIds = Object.keys(promotion.roster);
        if (rosterIds.length === 0) return;

        // Select top-rated available wrestler
        let best = null;
        let bestRating = -1;
        for (const wid of rosterIds) {
            const w = this.wrestlers.get(wid);
            if (w && this.wrestlerSystem.canWrestle(w)) {
                const r = this.wrestlerSystem.calculateRating(w);
                if (r > bestRating) {
                    bestRating = r;
                    best = w;
                }
            }
        }

        if (!best) return;

        // AI may put a title on the line if champion
        let titleOnTheLineKey = null;
        for (const [key, title] of Object.entries(promotion.championships.titles)) {
            if (title.championId === best.id && !promotion.championships.blockedTitles.includes(key)) {
                if (Math.random() < 0.4) {
                    titleOnTheLineKey = key;
                }
                break;
            }
        }

        try {
            this.registerMassPpvWrestler(nationId, {
                wrestlerId: best.id,
                titleOnTheLineKey,
            });
        } catch (e) {
            // Skip on error
        }
    }

    view(nationId) {
        const promotion = this.getPromotion(nationId);
        if (!promotion) return null;

        const roster = [];
        for (const wid of Object.keys(promotion.roster)) {
            const w = this.wrestlers.get(wid);
            if (w) roster.push(w);
        }

        return {
            promotion: {
                id: promotion.id,
                name: promotion.name,
                airingDay: promotion.airingDay,
                foundedDay: promotion.foundedDay,
                isActive: promotion.isActive,
                fans: promotion.fans,
                maxFansEver: promotion.maxFansEver,
                ticketPrice: promotion.ticketPrice,
                arena: promotion.arena,
                championships: promotion.championships,
                statistics: promotion.statistics,
            },
            roster,
            weeklyShow: promotion.weeklyShow,
        };
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SAVE / LOAD
    // ════════════════════════════════════════════════════════════════════════════

    getState() {
        const promotionsObj = {};
        for (const [nationId, promotion] of this.promotions) {
            promotionsObj[nationId] = JSON.parse(JSON.stringify(promotion));
        }

        const wrestlersObj = {};
        for (const [wid, wrestler] of this.wrestlers) {
            wrestlersObj[wid] = JSON.parse(JSON.stringify(wrestler));
        }

        return {
            promotions: promotionsObj,
            wrestlers: wrestlersObj,
            massPpvCycleDay: this.massPpvCycleDay,
            massPpvRegistrations: [...this.massPpvRegistrations.entries()],
        };
    }

    setState(state) {
        if (!state) return;

        this.promotions = new Map();
        if (state.promotions) {
            for (const [nationId, promotion] of Object.entries(state.promotions)) {
                this.promotions.set(nationId, promotion);
            }
        }

        this.wrestlers = new Map();
        if (state.wrestlers) {
            for (const [wid, wrestler] of Object.entries(state.wrestlers)) {
                this.wrestlers.set(wid, wrestler);
            }
        }

        this.massPpvCycleDay = state.massPpvCycleDay || null;
        this.massPpvRegistrations = new Map();
        if (state.massPpvRegistrations) {
            for (const [nationId, reg] of state.massPpvRegistrations) {
                this.massPpvRegistrations.set(nationId, reg);
            }
        }
    }

    generateId() {
        return 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getCurrentDay() {
        return this.world.state ? this.world.state.day : 0;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WrestlingSystem;
} else if (typeof window !== 'undefined') {
    window.WrestlingSystem = WrestlingSystem;
}
