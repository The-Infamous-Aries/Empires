/**
 * Citizen Ties System - Relationships and Family Ties
 * Dominion Wars - Nation Building Strategy Game
 */

class CitizenTiesSystem {
    constructor() {
        this.populationSystem = null;
        this.isInitialized = false;
    }

    get pop() {
        return this.populationSystem;
    }

    async initialize() {
        this.isInitialized = true;
        console.log("Citizen Ties System initialized");
    }

    /**
     * ════════════════════════════════════════════════════════════════════════════════════════════
     * RELATIONSHIP & FAMILY SYSTEM
     * ════════════════════════════════════════════════════════════════════════════════════════════
     * 
     * Relationship Types:
     *   Straight Monogamy: Male + Female, only 2
     *   Gay Monogamy: Same sex (M/M or F/F), only 2
     *   Straight Polygamy: 3-4 people, must have both male and female
     *   Gay Polygamy: 3-4 people, all same gender
     * 
     * Relationship Stages:
     *   Teens (14-45): 50% chance/turn to start dating
     *   Young Adults (45-75): 50% chance/turn to marry or break up
     *   Married: Divorce instead of break up (much lower rate)
     * 
     * ═══════════════════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Process all relationship mechanics for the current day.
     * Called daily in handleDayPassed after births/deaths.
     */
    processRelationships(currentDay) {
        if (!window.Nation) return;
        if (!this.pop) return;

        const citizens = Array.from(this.pop.citizens.values());
        const nation = window.Nation;
        const ns = nation.nationStats || {};

        // ── Step 1: Resolve ethnicity for all citizens ──
        this.resolveCitizenEthnicity(citizens, nation);

        // ── Step 2: Relationship spawning for Teens ──
        this.spawnTeenRelationships(citizens, nation);

        // ── Step 3: Relationship changes for Young Adults ──
        this.processYoungAdultRelationships(citizens, nation, ns);

        // ── Step 4: Marriage/divorce for all married citizens ──
        this.processMarriedCouples(citizens, nation, ns, currentDay);

        // ── Step 5: Generate newborns from straight married couples ──
        this.generateNewbornsFromMarriages(citizens, nation, ns);

        // ── Step 6: Assign relationship roles (Wife, Husband, Mother, Father, etc.) ──
        this.assignRelationshipRoles(citizens);

        // ── Step 7: Sync relationship changes ──
        this.pop.syncTerritorialDistributionWithCitizens();
    }

    /**
     * Resolve ethnicity for citizens based on nation name.
     * Default: nation name + "ian" (e.g., "Test" → "Testian")
     * Override: nation.populationName if set
     * Immigrants: randomly pull a foreign nation's name
     */
    resolveCitizenEthnicity(citizens, nation) {
        const populationName = nation.getPopulationName ? nation.getPopulationName() : (nation.name + 'ian');
        const nations = window.GameEngine && window.GameEngine.nations ? window.GameEngine.nations : {};

        for (const citizen of citizens) {
            // If ethnicity is null, resolve from nation
            if (!citizen.ethnicity) {
                // Check if citizen is an immigrant (has a different origin nation)
                if ((citizen.isImmigrant || false) && Object.keys(nations).length > 1) {
                    // Randomly pick a foreign nation for ethnicity
                    const foreignNations = Object.values(nations).filter(n => n.name !== nation.name);
                    if (foreignNations.length > 0) {
                        const foreign = foreignNations[Math.floor(Math.random() * foreignNations.length)];
                        citizen.ethnicity = foreign.getPopulationName ? foreign.getPopulationName() : (foreign.name + 'ian');
                    } else {
                        citizen.ethnicity = populationName;
                    }
                } else {
                    citizen.ethnicity = populationName;
                }
            }
        }
    }

    /**
     * Spawn relationships for Teens (ageGroup: teen).
     * 50% chance per turn to start dating another eligible citizen.
     */
    spawnTeenRelationships(citizens, nation) {
        const teens = citizens.filter(c => c.isAlive && c.ageGroup === 'teen' && c.relationshipStatus === 'single');
        const allEligible = citizens.filter(c => c.isAlive && c.ageGroup === 'teen' && c.relationshipStatus === 'single');
        const matchedThisTurn = new Set();

        for (const teen of teens) {
            if (matchedThisTurn.has(teen.id)) continue;
            // 50% chance to start a relationship
            if (Math.random() > 0.5) continue;

            // Find another eligible teen to date
            const potentialPartners = allEligible.filter(p => p.id !== teen.id && !matchedThisTurn.has(p.id));
            if (potentialPartners.length === 0) continue;

            const partner = potentialPartners[Math.floor(Math.random() * potentialPartners.length)];

            // Determine relationship type based on genders
            const relationshipType = this.determineRelationshipType(teen.gender, partner.gender, 2);

            // Create the relationship
            this.createRelationship(teen, partner, 'dating', relationshipType, nation);
            matchedThisTurn.add(teen.id);
            matchedThisTurn.add(partner.id);
        }
    }

    /**
     * Process relationship changes for Young Adults (ageGroup: youngAdult).
     * Dating young adults: 50% chance per turn to marry or break up.
     * Married young adults: subject to divorce probability.
     */
    processYoungAdultRelationships(citizens, nation, nationStats) {
        const youngAdults = citizens.filter(c => c.isAlive && c.ageGroup === 'youngAdult' && (c.relationshipStatus === 'dating' || c.relationshipStatus === 'married'));

        const processedForDivorce = new Set();

        for (const ya of youngAdults) {
            // ── Dating: marry or break up ──
            if (ya.relationshipStatus === 'dating') {
                // 50% chance for a relationship change
                if (Math.random() > 0.5) continue;

                const partnerIds = [...(ya.partnerIds || [])];
                if (partnerIds.length === 0) continue;

                for (const partnerId of partnerIds) {
                    const partner = citizens.find(c => c.id === partnerId);
                    if (!partner || !partner.isAlive) continue;

                    const isStraightCouple = ya.gender !== partner.gender;
                    const marryProb = this.calculateMarryProbability(ya, partner, nationStats, isStraightCouple);
                    const breakupProb = this.calculateBreakupProbability(ya, partner, nationStats, isStraightCouple);

                    const roll = Math.random();
                    if (roll < marryProb) {
                        this.marryCouple(ya, partner, nation);
                    } else if (roll < marryProb + breakupProb) {
                        this.breakUpCouple(ya, partner);
                    }
                }
            }

            // ── Married: divorce (young adults not skipped here) ──
            if (ya.relationshipStatus === 'married') {
                if (processedForDivorce.has(ya.id)) continue;
                const spouseIds = [...(ya.spouseIds || [])];
                for (const spouseId of spouseIds) {
                    const spouse = citizens.find(c => c.id === spouseId);
                    if (!spouse || !spouse.isAlive) continue;
                    if (processedForDivorce.has(spouseId)) continue;

                    const divorceProb = this.calculateDivorceProbability(ya, spouse, nationStats);
                    if (Math.random() < divorceProb) {
                        this.divorceCouple(ya, spouse);
                    }
                    processedForDivorce.add(ya.id);
                    processedForDivorce.add(spouseId);
                }
            }
        }
    }

    /**
     * Process married couples - check for divorce.
     * Already handled in processYoungAdultRelationships for young adults,
     * but older adults also need divorce checks.
     */
    processMarriedCouples(citizens, nation, nationStats, currentDay) {
        const marriedCitizens = citizens.filter(c => c.isAlive && c.relationshipStatus === 'married');

        for (const citizen of marriedCitizens) {
            // Only check divorce for non-youngAdult age groups (young adults handled above)
            if (citizen.ageGroup === 'youngAdult') continue;
            if (!citizen.spouseIds) continue;

            const spouseIds = [...citizen.spouseIds];
            for (const spouseId of spouseIds) {
                const spouse = citizens.find(c => c.id === spouseId);
                if (!spouse || !spouse.isAlive) continue;

                const divorceProb = this.calculateDivorceProbability(citizen, spouse, nationStats);
                if (Math.random() < divorceProb) {
                    this.divorceCouple(citizen, spouse);
                }
            }
        }
    }

    /**
     * Calculate probability of marrying (0-1).
     * Weighs: Age (older more likely), Health (unhealthy less likely),
     * Wealth (more money more likely), Education/Literacy (higher more likely),
     * Job (unemployed less likely), Religion (matching = very high).
     * None of these negatively weigh breakup.
     */
    calculateMarryProbability(citizen, partner, nationStats, isStraightCouple) {
        let prob = 0.1; // Base 10%

        // Age factor: older people more inclined to marry
        const ageFactor = (citizen.age + partner.age) / 2;
        prob += ageFactor * 0.002; // +0.2% per year of average age

        // Health factor: unhealthy less likely to marry
        const avgHealth = (citizen.health + partner.health) / 2;
        prob += (avgHealth - 50) * 0.001; // ±0.1% per health point from 50

        // Wealth/Social Class factor: more money = higher marry chance
        const avgWealth = (citizen.wealth + partner.wealth) / 2;
        prob += Math.min(avgWealth / 10000, 0.15); // Up to +15% for wealthy

        // Education/Literacy factor: higher score more likely to marry
        const avgLiteracy = ((citizen.literacyScore || 0) + (partner.literacyScore || 0)) / 2;
        prob += avgLiteracy * 0.002; // +0.2% per literacy point

        // Job/Employment factor: unemployed less likely to marry
        const bothEmployed = citizen.isEmployed && partner.isEmployed;
        if (!bothEmployed) {
            prob *= 0.7; // Reduce by 30% if not both employed
        }

        // Religion factor: matching = VERY high chance
        if (citizen.religion === partner.religion && citizen.religion !== 'none') {
            prob *= 3.0; // Triple the chance if religions match
        }

        // Straight couples get a slight bonus for traditional marriage
        if (isStraightCouple) {
            prob *= 1.2;
        }

        return Math.min(0.95, Math.max(0, prob));
    }

    /**
     * Calculate probability of breaking up (0-1).
     * Weighs: Health (unhealthy more breakup), Wealth (money doesn't weigh breakup more),
     * Education (lower doesn't weigh breakup more), Job (unemployed more breakup),
     * Religion (not matching doesn't weigh breakup more).
     * Only negative factors apply; positive ones don't reduce breakup chance.
     */
    calculateBreakupProbability(citizen, partner, nationStats, isStraightCouple) {
        let prob = 0.05; // Base 5%

        // Health factor: unhealthy more breakup
        const avgHealth = (citizen.health + partner.health) / 2;
        if (avgHealth < 50) {
            prob += (50 - avgHealth) * 0.002; // +0.2% per health point below 50
        }
        // Health above 50 doesn't reduce breakup chance

        // Wealth factor: money does NOT weigh breakup more
        // (No negative wealth effect on breakup)

        // Education factor: lower doesn't weigh breakup more
        // (No negative education effect on breakup)

        // Job factor: unemployed more breakup
        if (!citizen.isEmployed || !partner.isEmployed) {
            prob += 0.1; // +10% if either is unemployed
        }
        // Having a job doesn't reduce breakup chance

        // Religion factor: not matching doesn't weigh breakup more
        // (No negative religion effect on breakup)

        return Math.min(0.9, Math.max(0, prob));
    }

    /**
     * Calculate probability of divorce (0-1). Much lower than breakup.
     * Same weighs as breakup but all factors are dampened.
     */
    calculateDivorceProbability(citizen, partner, nationStats) {
        const breakupProb = this.calculateBreakupProbability(citizen, partner, nationStats, true);
        // Divorce is much harder than breakup - dampen by 80%
        return breakupProb * 0.2;
    }

    /**
     * Create a dating relationship between two citizens.
     */
    createRelationship(citizenA, citizenB, type, relationshipType, nation) {
        const now = Date.now();

        // Update citizen A
        citizenA.relationshipStatus = type === 'married' ? 'married' : 'dating';
        if (!citizenA.partnerIds.includes(citizenB.id)) {
            citizenA.partnerIds.push(citizenB.id);
        }
        citizenA.relationships.set(citizenB.id, {
            type: type,
            role: relationshipType,
            started: now
        });

        // Update citizen B
        citizenB.relationshipStatus = type === 'married' ? 'married' : 'dating';
        if (!citizenB.partnerIds.includes(citizenA.id)) {
            citizenB.partnerIds.push(citizenA.id);
        }
        citizenB.relationships.set(citizenA.id, {
            type: type,
            role: relationshipType,
            started: now
        });

        // Add life events
        citizenA.lifeEvents.push({
            id: Date.now(),
            timestamp: now,
            age: citizenA.age,
            description: type === 'married' ? `Married ${this.partnerName(citizenB)}` : `Started dating ${this.partnerName(citizenB)}`,
            type: type === 'married' ? 'marriage' : 'relationship'
        });
        citizenB.lifeEvents.push({
            id: Date.now(),
            timestamp: now,
            age: citizenB.age,
            description: type === 'married' ? `Married ${this.partnerName(citizenA)}` : `Started dating ${this.partnerName(citizenA)}`,
            type: type === 'married' ? 'marriage' : 'relationship'
        });

        // Keep only last 20 events
        if (citizenA.lifeEvents.length > 20) citizenA.lifeEvents = citizenA.lifeEvents.slice(-20);
        if (citizenB.lifeEvents.length > 20) citizenB.lifeEvents = citizenB.lifeEvents.slice(-20);
    }

    /**
     * Marry two dating citizens.
     */
    marryCouple(citizenA, citizenB, nation) {
        const now = Date.now();

        // Update both citizens
        citizenA.relationshipStatus = 'married';
        citizenB.relationshipStatus = 'married';

        // Move from partnerIds to spouseIds
        citizenA.spouseIds.push(citizenB.id);
        citizenB.spouseIds.push(citizenA.id);

        // Remove from partnerIds
        citizenA.partnerIds = citizenA.partnerIds.filter(id => id !== citizenB.id);
        citizenB.partnerIds = citizenB.partnerIds.filter(id => id !== citizenA.id);

        // Update relationship map
        citizenA.relationships.set(citizenB.id, {
            type: 'married',
            role: this.getSpouseRole(citizenA.gender, citizenB.gender),
            started: now
        });
        citizenB.relationships.set(citizenA.id, {
            type: 'married',
            role: this.getSpouseRole(citizenB.gender, citizenA.gender),
            started: now
        });

        // Life events
        citizenA.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenA.age,
            description: `Married ${this.partnerName(citizenB)}`,
            type: 'marriage'
        });
        citizenB.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenB.age,
            description: `Married ${this.partnerName(citizenA)}`,
            type: 'marriage'
        });
        if (citizenA.lifeEvents.length > 20) citizenA.lifeEvents = citizenA.lifeEvents.slice(-20);
        if (citizenB.lifeEvents.length > 20) citizenB.lifeEvents = citizenB.lifeEvents.slice(-20);
    }

    /**
     * Break up two dating citizens.
     * Clears only the dating partner link — Mother/Father/Son/Daughter family roles are preserved.
     */
    breakUpCouple(citizenA, citizenB) {
        const now = Date.now();

        citizenA.relationshipStatus = 'single';
        citizenB.relationshipStatus = 'single';

        citizenA.partnerIds = citizenA.partnerIds.filter(id => id !== citizenB.id);
        citizenB.partnerIds = citizenB.partnerIds.filter(id => id !== citizenA.id);

        // Track who they broke up with
        if (!citizenA.brokenUpFrom) citizenA.brokenUpFrom = [];
        if (!citizenB.brokenUpFrom) citizenB.brokenUpFrom = [];
        if (!citizenA.brokenUpFrom.includes(citizenB.id)) citizenA.brokenUpFrom.push(citizenB.id);
        if (!citizenB.brokenUpFrom.includes(citizenA.id)) citizenB.brokenUpFrom.push(citizenA.id);

        citizenA.relationships.delete(citizenB.id);
        citizenB.relationships.delete(citizenA.id);

        // Preserve all family relationships (parentIds, childIds, spouseIds) — only the dating link is removed

        citizenA.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenA.age,
            description: `Broke up with ${citizenB.name}`,
            type: 'breakup'
        });
        citizenB.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenB.age,
            description: `Broke up with ${citizenA.name}`,
            type: 'breakup'
        });
        if (citizenA.lifeEvents.length > 20) citizenA.lifeEvents = citizenA.lifeEvents.slice(-20);
        if (citizenB.lifeEvents.length > 20) citizenB.lifeEvents = citizenB.lifeEvents.slice(-20);
    }

    /**
     * Divorce two married citizens.
     * Clears only the spouse link — Mother/Father/Son/Daughter family roles are preserved.
     * Tracks who they are divorced from.
     */
    divorceCouple(citizenA, citizenB) {
        const now = Date.now();

        citizenA.relationshipStatus = 'divorced';
        citizenB.relationshipStatus = 'divorced';

        citizenA.spouseIds = citizenA.spouseIds.filter(id => id !== citizenB.id);
        citizenB.spouseIds = citizenB.spouseIds.filter(id => id !== citizenA.id);

        // Track who they are divorced from
        if (!citizenA.divorcedFrom) citizenA.divorcedFrom = [];
        if (!citizenB.divorcedFrom) citizenB.divorcedFrom = [];
        if (!citizenA.divorcedFrom.includes(citizenB.id)) citizenA.divorcedFrom.push(citizenB.id);
        if (!citizenB.divorcedFrom.includes(citizenA.id)) citizenB.divorcedFrom.push(citizenA.id);

        citizenA.relationships.delete(citizenB.id);
        citizenB.relationships.delete(citizenA.id);

        // Preserve all family relationships (parentIds, childIds, partnerIds) — only the spouse link is removed

        citizenA.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenA.age,
            description: `Divorced from ${citizenB.name}`,
            type: 'divorce'
        });
        citizenB.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenB.age,
            description: `Divorced from ${citizenA.name}`,
            type: 'divorce'
        });
        if (citizenA.lifeEvents.length > 20) citizenA.lifeEvents = citizenA.lifeEvents.slice(-20);
        if (citizenB.lifeEvents.length > 20) citizenB.lifeEvents = citizenB.lifeEvents.slice(-20);
    }

    /**
     * Handle a citizen's death for relationship tracking.
     * Marks each spouse as widowed from the deceased, removes the spouse link,
     * but preserves Mother/Father/Son/Daughter family relationships.
     */
    handleCitizenDeath(deceased) {
        if (!deceased || deceased.isAlive === false) return;
        if (!this.pop) return;

        // ── Handle spouses (widow/widower) ──
        const spouseIds = [...(deceased.spouseIds || [])];
        for (const spouseId of spouseIds) {
            const spouse = this.pop.citizens.get(spouseId);
            if (!spouse || !spouse.isAlive) continue;

            // Track who they are widowed from
            if (!spouse.widowedFrom) spouse.widowedFrom = [];
            if (!spouse.widowedFrom.includes(deceased.id)) spouse.widowedFrom.push(deceased.id);

            // Remove the deceased from survivor's spouseIds
            spouse.spouseIds = spouse.spouseIds.filter(id => id !== deceased.id);
            spouse.relationshipStatus = 'widowed';

            // Delete the married relationship entry but preserve family roles
            spouse.relationships.delete(deceased.id);

            spouse.lifeEvents.push({
                id: Date.now(),
                timestamp: Date.now(),
                age: spouse.age,
                description: `Widowed: ${deceased.name} passed away`,
                type: 'death'
            });
            if (spouse.lifeEvents.length > 20) spouse.lifeEvents = spouse.lifeEvents.slice(-20);
        }

        // ── Handle dating partners (not married) ──
        const partnerIds = [...(deceased.partnerIds || [])];
        for (const partnerId of partnerIds) {
            const partner = this.pop.citizens.get(partnerId);
            if (!partner || !partner.isAlive) continue;

            // Remove the deceased from survivor's partnerIds
            partner.partnerIds = partner.partnerIds.filter(id => id !== deceased.id);
            if (partner.partnerIds.length === 0) {
                partner.relationshipStatus = 'single';
            }

            // Delete the dating relationship entry
            partner.relationships.delete(deceased.id);

            partner.lifeEvents.push({
                id: Date.now(),
                timestamp: Date.now(),
                age: partner.age,
                description: `Partner ${deceased.name} passed away`,
                type: 'death'
            });
            if (partner.lifeEvents.length > 20) partner.lifeEvents = partner.lifeEvents.slice(-20);
        }

        // Clear the deceased's own relationship links (they are deceased)
        deceased.spouseIds = [];
        deceased.partnerIds = [];
        deceased.relationshipStatus = 'deceased';
    }

    /**
     * Get the spouse role based on genders.
     * Male + Female → Husband/Wife
     * Same sex → Partner/Spouse (generic)
     */
    getSpouseRole(genderA, genderB) {
        // genderA's role relative to genderB
        if (genderA === 'male' && genderB === 'female') return 'Husband';
        if (genderA === 'female' && genderB === 'male') return 'Wife';
        if (genderA === 'male' && genderB === 'male') return 'Husband';
        if (genderA === 'female' && genderB === 'female') return 'Wife';
        return 'Partner';
    }

    /**
     * Determine relationship type based on genders and number of people.
     */
    determineRelationshipType(genderA, genderB, count) {
        const hasMale = genderA === 'male' || genderB === 'male';
        const hasFemale = genderA === 'female' || genderB === 'female';
        const allSameGender = genderA === genderB;

        if (count === 2) {
            if (allSameGender) return 'Gay Monogamy';
            return 'Straight Monogamy';
        } else {
            // Polygamy (3-4 people)
            if (allSameGender) return 'Gay Polygamy';
            return 'Straight Polygamy';
        }
    }

    /**
     * Generate newborns from straight married couples.
     * Uses the nation's population growth rate to determine how many couples have children.
     */
    generateNewbornsFromMarriages(citizens, nation, nationStats) {
        if (!nation) return;

        // Find all straight married couples (male + female, both married to each other)
        const marriedCouples = [];
        const processedPairs = new Set();

        for (const citizen of citizens) {
            if (!citizen.isAlive || citizen.relationshipStatus !== 'married') continue;
            if (citizen.gender !== 'male' && citizen.gender !== 'female') continue;

            for (const spouseId of citizen.spouseIds) {
                const spouse = citizens.find(c => c.id === spouseId);
                if (!spouse || !spouse.isAlive || spouse.relationshipStatus !== 'married') continue;
                if (spouse.gender !== 'male' && spouse.gender !== 'female') continue;
                if (citizen.gender === spouse.gender) continue; // Same-sex couples don't produce newborns

                const pairKey = [citizen.id, spouse.id].sort().join('-');
                if (processedPairs.has(pairKey)) continue;
                processedPairs.add(pairKey);

                // Check reproductive age (15-45 for female, 15-60 for male)
                const female = citizen.gender === 'female' ? citizen : spouse;
                const male = citizen.gender === 'male' ? citizen : spouse;

                if (female.age < 15 || female.age > 45) continue;
                if (male.age < 15 || male.age > 60) continue;

                marriedCouples.push({ husband: male, wife: female });
            }
        }

        if (marriedCouples.length === 0) return;

        // Calculate birth rate from nation stats
        const ns = nationStats || {};
        const happiness = nation.happiness || 50;
        const disease = ns.disease || 10;
        const environment = ns.environment !== undefined ? ns.environment : 50;
        const pollution = ns.pollution || 0;

        // Safe access to birth rate - ensure population system is initialized
        const pop = this.pop;
        if (!pop || !pop.vitalRates) return;

        const baseDailyBirthRate = pop.vitalRates.baseBirthRate / 365;
        const happinessFactor = 0.5 + (happiness / 100);
        const diseaseFactor = Math.max(0.1, 1 - (disease / 100));
        const environmentFactor = 0.5 + (environment / 100);
        const pollutionFactor = Math.max(0.1, 1 - (pollution / 100));

        const dailyBirthRate = baseDailyBirthRate * happinessFactor * diseaseFactor * environmentFactor * pollutionFactor;

        // Each couple has a chance to have a child based on the rate
        for (const couple of marriedCouples) {
            if (Math.random() < dailyBirthRate) {
                this.createChildFromCouple(couple.husband, couple.wife, nation);
            }
        }
    }

    /**
     * Create a child from a married couple.
     */
    createChildFromCouple(father, mother, nation) {
        const isGifted = Math.random() < 0.05;
        const now = Date.now();

        // Determine child's gender
        const gender = Math.random() > 0.5 ? 'male' : 'female';

        // Determine child's ethnicity from parents (same nation)
        const populationName = nation.getPopulationName ? nation.getPopulationName() : (nation.name + 'ian');

        const child = {
            id: this.pop.nextCitizenId++,
            birthTime: now,
            ageGroup: 'newborn',
            employmentStatus: 'not_applicable',
            educationLevel: 'none',
            literacyScore: 0,
            isGifted: isGifted,
            literacyProgress: 0,
            gender: gender,
            ethnicity: populationName,
            religion: mother.religion || father.religion || 'none',
            relationshipStatus: 'single',
            spouseIds: [],
            partnerIds: [],
            parentIds: [father.id, mother.id],
            childIds: [],
            relationships: new Map(),
            nationId: nation.id || nation.name,
            cityId: null,
            born: now
        };

        // Set child's name
        child.name = this.generateChildName(gender, populationName);

        // Add child to citizens
        this.pop.citizens.set(child.id, child);
        this.pop.ageGroups.newborn.count++;
        this.pop.recordBirth();

        // Update parents' childIds
        father.childIds.push(child.id);
        mother.childIds.push(child.id);

        // Add parent relationships to child
        child.relationships.set(father.id, {
            type: 'family',
            role: father.gender === 'male' ? 'Father' : 'Parent',
            started: now
        });
        child.relationships.set(mother.id, {
            type: 'family',
            role: mother.gender === 'female' ? 'Mother' : 'Parent',
            started: now
        });

        // Add child relationships to parents
        father.relationships.set(child.id, {
            type: 'family',
            role: father.gender === 'male' ? 'Father' : 'Parent',
            started: now
        });
        mother.relationships.set(child.id, {
            type: 'family',
            role: mother.gender === 'female' ? 'Mother' : 'Parent',
            started: now
        });

        // Add sibling relationships between child and existing children of parents
        const existingSiblings = [...father.childIds, ...mother.childIds].filter(id => id !== child.id);
        for (const siblingId of existingSiblings) {
            const sibling = this.pop.citizens.get(siblingId);
            if (!sibling || !sibling.isAlive) continue;

            const siblingRole = sibling.gender === 'male' ? 'Brother' : 'Sister';
            const childRole = child.gender === 'male' ? 'Brother' : 'Sister';

            child.relationships.set(siblingId, {
                type: 'family',
                role: siblingRole,
                started: now
            });
            sibling.relationships.set(child.id, {
                type: 'family',
                role: childRole,
                started: now
            });
        }

        // Life events for parents
        father.lifeEvents.push({
            id: now,
            timestamp: now,
            age: father.age,
            description: `Child born: ${child.name}`,
            type: 'birth'
        });
        mother.lifeEvents.push({
            id: now,
            timestamp: now,
            age: mother.age,
            description: `Child born: ${child.name}`,
            type: 'birth'
        });
        if (father.lifeEvents.length > 20) father.lifeEvents = father.lifeEvents.slice(-20);
        if (mother.lifeEvents.length > 20) mother.lifeEvents = mother.lifeEvents.slice(-20);

        return child;
    }

    /**
     * Generate a child name based on gender and ethnicity.
     */
    generateChildName(gender, populationName) {
        const maleNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas'];
        const femaleNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

        const firstNames = gender === 'male' ? maleNames : femaleNames;
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        return `${firstName} ${lastName}`;
    }

    /**
     * Assign relationship roles (Wife, Husband, Mother, Father, Son, Daughter, etc.)
     * to all citizens based on their current relationships.
     */
    assignRelationshipRoles(citizens) {
        // First, clear all family roles and re-assign based on current state
        // This ensures roles are always up-to-date

        // Clean up stale relationship entries (e.g., after divorce/death/breakup)
        for (const citizen of citizens) {
            if (!citizen.isAlive) continue;
            for (const [relId, rel] of citizen.relationships) {
                if (rel.type === 'married' && !citizen.spouseIds.includes(relId)) {
                    citizen.relationships.delete(relId);
                }
                if (rel.type === 'dating' && !citizen.partnerIds.includes(relId)) {
                    citizen.relationships.delete(relId);
                }
            }
        }

        for (const citizen of citizens) {
            if (!citizen.isAlive) continue;

            // Assign spouse roles
            for (const spouseId of citizen.spouseIds) {
                const spouse = citizens.find(c => c.id === spouseId);
                if (!spouse) continue;

                const role = this.getSpouseRole(citizen.gender, spouse.gender);
                const rel = citizen.relationships.get(spouseId);
                if (rel) {
                    rel.role = role;
                    rel.type = 'married';
                } else {
                    citizen.relationships.set(spouseId, {
                        type: 'married',
                        role: role,
                        started: Date.now()
                    });
                }
            }

            // Assign parent roles
            for (const childId of citizen.childIds) {
                const child = citizens.find(c => c.id === childId);
                if (!child) continue;

                const role = citizen.gender === 'male' ? 'Father' : 'Mother';
                const rel = citizen.relationships.get(childId);
                if (rel) {
                    rel.role = role;
                    rel.type = 'family';
                } else {
                    citizen.relationships.set(childId, {
                        type: 'family',
                        role: role,
                        started: Date.now()
                    });
                }
            }

            // Assign child roles
            for (const parentId of citizen.parentIds) {
                const parent = citizens.find(c => c.id === parentId);
                if (!parent) continue;

                const role = citizen.gender === 'male' ? 'Son' : 'Daughter';
                const rel = citizen.relationships.get(parentId);
                if (rel) {
                    rel.role = role;
                    rel.type = 'family';
                } else {
                    citizen.relationships.set(parentId, {
                        type: 'family',
                        role: role,
                        started: Date.now()
                    });
                }
            }

            // Assign sibling roles (shared parents)
            const allSiblings = new Set();
            for (const parentId of citizen.parentIds) {
                const parent = citizens.find(c => c.id === parentId);
                if (parent) {
                    for (const childId of parent.childIds) {
                        if (childId !== citizen.id) allSiblings.add(childId);
                    }
                }
            }
            for (const siblingId of allSiblings) {
                const sibling = citizens.find(c => c.id === siblingId);
                if (!sibling) continue;

                const role = citizen.gender === 'male' ? 'Brother' : 'Sister';
                const rel = citizen.relationships.get(siblingId);
                if (rel) {
                    rel.role = role;
                    rel.type = 'family';
                } else {
                    citizen.relationships.set(siblingId, {
                        type: 'family',
                        role: role,
                        started: Date.now()
                    });
                }
            }

            // Assign grandparent roles
            for (const parentId of citizen.parentIds) {
                const parent = citizens.find(c => c.id === parentId);
                if (!parent) continue;

                for (const grandparentId of parent.parentIds) {
                    const grandparent = citizens.find(c => c.id === grandparentId);
                    if (!grandparent) continue;

                    const role = grandparent.gender === 'male' ? 'Grandfather' : 'Grandmother';
                    const rel = citizen.relationships.get(grandparentId);
                    if (rel) {
                        rel.role = role;
                        rel.type = 'family';
                    } else {
                        citizen.relationships.set(grandparentId, {
                            type: 'family',
                            role: role,
                            started: Date.now()
                        });
                    }
                }
            }

            // Assign grandchild roles
            for (const childId of citizen.childIds) {
                const child = citizens.find(c => c.id === childId);
                if (!child) continue;

                for (const grandchildId of child.childIds) {
                    const grandchild = citizens.find(c => c.id === grandchildId);
                    if (!grandchild) continue;

                    const role = citizen.gender === 'male' ? 'Grandfather' : 'Grandmother';
                    const rel = citizen.relationships.get(grandchildId);
                    if (rel) {
                        rel.role = role;
                        rel.type = 'family';
                    } else {
                        citizen.relationships.set(grandchildId, {
                            type: 'family',
                            role: role,
                            started: Date.now()
                        });
                    }
                }
            }

            // Assign cousin roles (children of parent's siblings)
            for (const parentId of citizen.parentIds) {
                const parent = citizens.find(c => c.id === parentId);
                if (!parent) continue;

                for (const auntUncleId of parent.parentIds.flatMap(pid => {
                    const p = citizens.find(c => c.id === pid);
                    return p ? p.childIds.filter(id => id !== parentId) : [];
                })) {
                    const auntUncle = citizens.find(c => c.id === auntUncleId);
                    if (!auntUncle) continue;

                    for (const cousinId of auntUncle.childIds) {
                        const cousin = citizens.find(c => c.id === cousinId);
                        if (!cousin || cousin.id === citizen.id) continue;

                        const rel = citizen.relationships.get(cousinId);
                        if (rel) {
                            rel.role = 'Cousin';
                            rel.type = 'family';
                        } else {
                            citizen.relationships.set(cousinId, {
                                type: 'family',
                                role: 'Cousin',
                                started: Date.now()
                            });
                        }
                    }
                }
            }
        }
    }

    /**
     * Helper to get partner name for life events.
     */
    partnerName(citizen) {
        return citizen ? citizen.name : 'Unknown';
    }

    /**
     * ════════════════════════════════════════════════════════════════════════════════════════════
     * END RELATIONSHIP & FAMILY SYSTEM
     * ════════════════════════════════════════════════════════════════════════════════════════════
     */

    destroy() {
        this.isInitialized = false;
    }
}

// Create global instance
if (typeof window !== "undefined") {
    window.CitizenTiesSystem = new CitizenTiesSystem();
} else {
    module.exports = { CitizenTiesSystem };
}
