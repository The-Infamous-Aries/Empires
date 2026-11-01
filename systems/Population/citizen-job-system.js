/**
 * Citizen Job System - Truth Source for Citizen Jobs, Income, and Taxation
 * Dominion Wars - Nation Building Strategy Game
 *
 * Job progression: T1L1 -> T1L2 -> T2L1 -> T2L2 -> T3L1 -> T3L2
 * Based on literacy rate, building counts (percentages), happiness, crime.
 * Per-job-type caps scale by building count (1 building = 75%, scaling down to min 20%).
 */

const TIER_RANGES = {
    1: { min: 25000, max: 50000, levelBonus: 5000 },
    2: { min: 75000, max: 100000, levelBonus: 10000 },
    3: { min: 125000, max: 200000, levelBonus: 15000 }
};

// ── Job Definitions ──
// Each building type maps to jobs: entry level + management level
// tier determines base income range
// literacyReq: minimum literacy (0-100 scale) to qualify for that job level
const JOB_DEFINITIONS = {
    // ═════════════════════════════════════════════════════════════════════════════════
    // TIER 1 — IMPROVEMENTS ($25,000 - $50,000 base)
    // ═════════════════════════════════════════════════════════════════════════════════
    farm: {
        tier: 1,
        basePercentage: 4,
        jobs: [
            { key: 'farmer', title: 'Farmer', level: 1, literacyReq: 0, basePercentage: 60 },
            { key: 'farm_manager', title: 'Farm Manager', level: 2, literacyReq: 25, basePercentage: 40 }
        ]
    },
    hospital: {
        tier: 1,
        basePercentage: 3,
        jobs: [
            { key: 'nurse', title: 'Nurse', level: 1, literacyReq: 0, basePercentage: 70 },
            { key: 'head_nurse', title: 'Head Nurse', level: 2, literacyReq: 30, basePercentage: 30 }
        ]
    },
    policeStation: {
        tier: 1,
        basePercentage: 3,
        jobs: [
            { key: 'officer', title: 'Police Officer', level: 1, literacyReq: 0, basePercentage: 75 },
            { key: 'sergeant', title: 'Police Sergeant', level: 2, literacyReq: 25, basePercentage: 25 }
        ]
    },
    school: {
        tier: 1,
        basePercentage: 3,
        jobs: [
            { key: 'teacher', title: 'Teacher', level: 1, literacyReq: 0, basePercentage: 80 },
            { key: 'principal', title: 'School Principal', level: 2, literacyReq: 35, basePercentage: 20 }
        ]
    },
    port: {
        tier: 1,
        basePercentage: 2,
        jobs: [
            { key: 'dock_hand', title: 'Dock Hand', level: 1, literacyReq: 0, basePercentage: 75 },
            { key: 'port_manager', title: 'Port Manager', level: 2, literacyReq: 25, basePercentage: 25 }
        ]
    },
    casino: {
        tier: 1,
        basePercentage: 2,
        jobs: [
            { key: 'dealer', title: 'Casino Dealer', level: 1, literacyReq: 0, basePercentage: 80 },
            { key: 'pit_boss', title: 'Pit Boss', level: 2, literacyReq: 25, basePercentage: 20 }
        ]
    },
    factory: {
        tier: 1,
        basePercentage: 3,
        jobs: [
            { key: 'line_worker', title: 'Factory Line Worker', level: 1, literacyReq: 0, basePercentage: 85 },
            { key: 'shift_supervisor', title: 'Shift Supervisor', level: 2, literacyReq: 20, basePercentage: 15 }
        ]
    },

    // ══════════════════════════════════════════════════════════════════════════════════
    // TIER 2 — PROJECTS ($75,000 - $100,000 base)
    // ══════════════════════════════════════════════════════════════════════════════════
    university: {
        tier: 2,
        basePercentage: 3,
        jobs: [
            { key: 'professor', title: 'University Professor', level: 1, literacyReq: 50, basePercentage: 70 },
            { key: 'dean', title: 'University Dean', level: 2, literacyReq: 75, basePercentage: 30 }
        ]
    },
    missileSilo: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'missile_technician', title: 'Missile Technician', level: 1, literacyReq: 40, basePercentage: 75 },
            { key: 'silo_commander', title: 'Silo Commander', level: 2, literacyReq: 60, basePercentage: 25 }
        ]
    },
    ironCurtain: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'interceptor_operator', title: 'Interceptor Operator', level: 1, literacyReq: 40, basePercentage: 80 },
            { key: 'defense_director', title: 'Defense Director', level: 2, literacyReq: 60, basePercentage: 20 }
        ]
    },
    commandCenter: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'operations_officer', title: 'Operations Officer', level: 1, literacyReq: 40, basePercentage: 75 },
            { key: 'command_director', title: 'Command Director', level: 2, literacyReq: 60, basePercentage: 25 }
        ]
    },
    militaryAcademy: {
        tier: 2,
        basePercentage: 1,
        jobs: [
            { key: 'drill_instructor', title: 'Drill Instructor', level: 1, literacyReq: 35, basePercentage: 70 },
            { key: 'academy_commandant', title: 'Academy Commandant', level: 2, literacyReq: 60, basePercentage: 30 }
        ]
    },
    ambulanceHub: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'paramedic', title: 'Paramedic', level: 1, literacyReq: 30, basePercentage: 80 },
            { key: 'medical_director', title: 'Medical Director', level: 2, literacyReq: 55, basePercentage: 20 }
        ]
    },
    governmentStatue: {
        tier: 2,
        basePercentage: 1,
        jobs: [
            { key: 'protocol_officer', title: 'Protocol Officer', level: 1, literacyReq: 45, basePercentage: 70 },
            { key: 'government_liaison', title: 'Government Liaison', level: 2, literacyReq: 70, basePercentage: 30 }
        ]
    },
    religiousStatue: {
        tier: 2,
        basePercentage: 1,
        jobs: [
            { key: 'acolyte', title: 'Acolyte', level: 1, literacyReq: 20, basePercentage: 75 },
            { key: 'high_priest', title: 'High Priest', level: 2, literacyReq: 50, basePercentage: 25 }
        ]
    },
    spyOperations: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'field_agent', title: 'Field Agent', level: 1, literacyReq: 40, basePercentage: 80 },
            { key: 'station_chief', title: 'Station Chief', level: 2, literacyReq: 65, basePercentage: 20 }
        ]
    },
    swatPolice: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'swat_officer', title: 'SWAT Officer', level: 1, literacyReq: 30, basePercentage: 80 },
            { key: 'swat_commander', title: 'SWAT Commander', level: 2, literacyReq: 55, basePercentage: 20 }
        ]
    },
    advancedResearch: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'research_assistant', title: 'Research Assistant', level: 1, literacyReq: 50, basePercentage: 70 },
            { key: 'lead_researcher', title: 'Lead Researcher', level: 2, literacyReq: 75, basePercentage: 30 }
        ]
    },
    enhancedPolice: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'detective', title: 'Detective', level: 1, literacyReq: 35, basePercentage: 75 },
            { key: 'police_chief', title: 'Police Chief', level: 2, literacyReq: 60, basePercentage: 25 }
        ]
    },
    sportsBetting: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'bookmaker', title: 'Bookmaker', level: 1, literacyReq: 20, basePercentage: 75 },
            { key: 'casino_director', title: 'Casino Director', level: 2, literacyReq: 45, basePercentage: 25 }
        ]
    },
    enhancedBarracks: {
        tier: 2,
        basePercentage: 1,
        jobs: [
            { key: 'tactical_trainer', title: 'Tactical Trainer', level: 1, literacyReq: 30, basePercentage: 70 },
            { key: 'training_director', title: 'Training Director', level: 2, literacyReq: 55, basePercentage: 30 }
        ]
    },
    enhancedFactories: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'production_lead', title: 'Production Lead', level: 1, literacyReq: 30, basePercentage: 75 },
            { key: 'plant_manager', title: 'Plant Manager', level: 2, literacyReq: 55, basePercentage: 25 }
        ]
    },
    enhancedAirforces: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'flight_crew', title: 'Flight Crew', level: 1, literacyReq: 35, basePercentage: 80 },
            { key: 'wing_commander', title: 'Wing Commander', level: 2, literacyReq: 60, basePercentage: 20 }
        ]
    },
    enhancedNavy: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'deck_hand', title: 'Naval Deck Hand', level: 1, literacyReq: 20, basePercentage: 80 },
            { key: 'fleet_admiral', title: 'Fleet Admiral', level: 2, literacyReq: 60, basePercentage: 20 }
        ]
    },
    broadcasting: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'news_anchor', title: 'News Anchor', level: 1, literacyReq: 40, basePercentage: 75 },
            { key: 'station_manager', title: 'Station Manager', level: 2, literacyReq: 60, basePercentage: 25 }
        ]
    },
    financialAssistanceOffice: {
        tier: 2,
        basePercentage: 1,
        jobs: [
            { key: 'aid_officer', title: 'Foreign Aid Officer', level: 1, literacyReq: 40, basePercentage: 70 },
            { key: 'foreign_aid_director', title: 'Foreign Aid Director', level: 2, literacyReq: 65, basePercentage: 30 }
        ]
    },
    officeOfRelationships: {
        tier: 2,
        basePercentage: 1,
        jobs: [
            { key: 'diplomat', title: 'Diplomat', level: 1, literacyReq: 45, basePercentage: 70 },
            { key: 'ambassador', title: 'Ambassador', level: 2, literacyReq: 70, basePercentage: 30 }
        ]
    },
    enhancedRecycling: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'recycling_technician', title: 'Recycling Technician', level: 1, literacyReq: 25, basePercentage: 80 },
            { key: 'environmental_director', title: 'Environmental Director', level: 2, literacyReq: 50, basePercentage: 20 }
        ]
    },
    advancedAgriculture: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'agronomist', title: 'Agronomist', level: 1, literacyReq: 35, basePercentage: 75 },
            { key: 'agriculture_director', title: 'Agriculture Director', level: 2, literacyReq: 60, basePercentage: 25 }
        ]
    },
    farmSynergy: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'crop_specialist', title: 'Crop Specialist', level: 1, literacyReq: 30, basePercentage: 75 },
            { key: 'farm_coordinator', title: 'Farm Coordinator', level: 2, literacyReq: 55, basePercentage: 25 }
        ]
    },
    advancedWellDrilling: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'hydrologist', title: 'Hydrologist', level: 1, literacyReq: 35, basePercentage: 75 },
            { key: 'water_director', title: 'Water Director', level: 2, literacyReq: 60, basePercentage: 25 }
        ]
    },
    wellSynergy: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'water_engineer', title: 'Water Engineer', level: 1, literacyReq: 30, basePercentage: 75 },
            { key: 'resource_manager', title: 'Resource Manager', level: 2, literacyReq: 55, basePercentage: 25 }
        ]
    },
    tradeHub: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'trade_clerk', title: 'Trade Clerk', level: 1, literacyReq: 25, basePercentage: 80 },
            { key: 'trade_commissioner', title: 'Trade Commissioner', level: 2, literacyReq: 50, basePercentage: 20 }
        ]
    },
    salvageYard: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'salvage_worker', title: 'Salvage Worker', level: 1, literacyReq: 0, basePercentage: 85 },
            { key: 'recovery_director', title: 'Recovery Director', level: 2, literacyReq: 35, basePercentage: 15 }
        ]
    },
    militarySalvage: {
        tier: 2,
        basePercentage: 2,
        jobs: [
            { key: 'salvage_technician', title: 'Salvage Technician', level: 1, literacyReq: 20, basePercentage: 80 },
            { key: 'salvage_commander', title: 'Salvage Commander', level: 2, literacyReq: 45, basePercentage: 20 }
        ]
    },

    // ══════════════════════════════════════════════════════════════════════════════════
    // TIER 3 — WONDERS ($125,000 - $200,000 base)
    // ══════════════════════════════════════════════════════════════════════════════════
    governmentMonument: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'state_architect', title: 'State Architect', level: 1, literacyReq: 60, basePercentage: 60 },
            { key: 'national_governor', title: 'National Governor', level: 2, literacyReq: 85, basePercentage: 40 }
        ]
    },
    religiousMonument: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'temple_keeper', title: 'Temple Keeper', level: 1, literacyReq: 50, basePercentage: 70 },
            { key: 'spiritual_leader', title: 'Spiritual Leader', level: 2, literacyReq: 80, basePercentage: 30 }
        ]
    },
    great_library: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'librarian', title: 'Senior Librarian', level: 1, literacyReq: 60, basePercentage: 65 },
            { key: 'chief_archivist', title: 'Chief Archivist', level: 2, literacyReq: 90, basePercentage: 35 }
        ]
    },
    grandResearchAcademy: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'senior_researcher', title: 'Senior Researcher', level: 1, literacyReq: 70, basePercentage: 60 },
            { key: 'academy_director', title: 'Academy Director', level: 2, literacyReq: 95, basePercentage: 40 }
        ]
    },
    environmentalResearchComplex: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'eco_scientist', title: 'Eco Scientist', level: 1, literacyReq: 65, basePercentage: 70 },
            { key: 'environmental_director_wonder', title: 'Environmental Director', level: 2, literacyReq: 90, basePercentage: 30 }
        ]
    },
    universalEducation: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'education_coordinator', title: 'Education Coordinator', level: 1, literacyReq: 60, basePercentage: 70 },
            { key: 'minister_of_education', title: 'Minister of Education', level: 2, literacyReq: 90, basePercentage: 30 }
        ]
    },
    universalHealthcare: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'healthcare_administrator', title: 'Healthcare Administrator', level: 1, literacyReq: 60, basePercentage: 70 },
            { key: 'minister_of_health', title: 'Minister of Health', level: 2, literacyReq: 90, basePercentage: 30 }
        ]
    },
    enhancedSilos: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'missile_commander', title: 'Missile Commander', level: 1, literacyReq: 60, basePercentage: 70 },
            { key: 'strategic_missile_director', title: 'Strategic Missile Director', level: 2, literacyReq: 90, basePercentage: 30 }
        ]
    },
    enhancedSpyOps: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'intelligence_officer', title: 'Intelligence Officer', level: 1, literacyReq: 65, basePercentage: 70 },
            { key: 'spymaster', title: 'Spymaster', level: 2, literacyReq: 95, basePercentage: 30 }
        ]
    },
    militaryRecovery: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'salvage_specialist', title: 'Salvage Specialist', level: 1, literacyReq: 55, basePercentage: 70 },
            { key: 'recovery_command', title: 'Recovery Command', level: 2, literacyReq: 85, basePercentage: 30 }
        ]
    },
    enhancedSalvage: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'recovery_engineer', title: 'Recovery Engineer', level: 1, literacyReq: 55, basePercentage: 70 },
            { key: 'resource_recovery_director', title: 'Resource Recovery Director', level: 2, literacyReq: 85, basePercentage: 30 }
        ]
    },
    nuclearWarheadFacility: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'nuclear_technician', title: 'Nuclear Technician', level: 1, literacyReq: 70, basePercentage: 70 },
            { key: 'nuclear_program_director', title: 'Nuclear Program Director', level: 2, literacyReq: 95, basePercentage: 30 }
        ]
    },
    enhancedNuclearWarheads: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'warhead_engineer', title: 'Warhead Engineer', level: 1, literacyReq: 75, basePercentage: 70 },
            { key: 'arsenal_director', title: 'Arsenal Director', level: 2, literacyReq: 98, basePercentage: 30 }
        ]
    },
    basketballStadium: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'basketball_coach', title: 'Head Coach', level: 1, literacyReq: 30, basePercentage: 70 },
            { key: 'basketball_gm', title: 'General Manager', level: 2, literacyReq: 60, basePercentage: 30 }
        ]
    },
    hockeyStadium: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'hockey_coach', title: 'Head Coach', level: 1, literacyReq: 30, basePercentage: 70 },
            { key: 'hockey_gm', title: 'General Manager', level: 2, literacyReq: 60, basePercentage: 30 }
        ]
    },
    soccerStadium: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'soccer_coach', title: 'Head Coach', level: 1, literacyReq: 30, basePercentage: 70 },
            { key: 'soccer_gm', title: 'General Manager', level: 2, literacyReq: 60, basePercentage: 30 }
        ]
    },
    allianceHeadquarters: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'alliance_liaison', title: 'Alliance Liaison', level: 1, literacyReq: 55, basePercentage: 70 },
            { key: 'alliance_director', title: 'Alliance Director', level: 2, literacyReq: 85, basePercentage: 30 }
        ]
    },
    supremeMining: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'mine_engineer', title: 'Mine Engineer', level: 1, literacyReq: 50, basePercentage: 70 },
            { key: 'mining_director', title: 'Mining Director', level: 2, literacyReq: 80, basePercentage: 30 }
        ]
    },
    cleanMining: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'env_engineer', title: 'Environmental Engineer', level: 1, literacyReq: 55, basePercentage: 70 },
            { key: 'sustainability_director', title: 'Sustainability Director', level: 2, literacyReq: 85, basePercentage: 30 }
        ]
    },
    supremeAssembly: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'assembly_lead', title: 'Assembly Lead', level: 1, literacyReq: 45, basePercentage: 70 },
            { key: 'manufacturing_director', title: 'Manufacturing Director', level: 2, literacyReq: 80, basePercentage: 30 }
        ]
    },
    cleanAssembly: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'green_manufacturing_lead', title: 'Green Manufacturing Lead', level: 1, literacyReq: 50, basePercentage: 70 },
            { key: 'clean_production_director', title: 'Clean Production Director', level: 2, literacyReq: 85, basePercentage: 30 }
        ]
    },
    supremeRecycling: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'recycling_specialist', title: 'Recycling Specialist', level: 1, literacyReq: 45, basePercentage: 70 },
            { key: 'env_director_wonder', title: 'Environmental Director', level: 2, literacyReq: 80, basePercentage: 30 }
        ]
    },
    supremeMilitary: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'strategic_officer', title: 'Strategic Officer', level: 1, literacyReq: 60, basePercentage: 70 },
            { key: 'supreme_commander', title: 'Supreme Commander', level: 2, literacyReq: 95, basePercentage: 30 }
        ]
    },
    internet: {
        tier: 3,
        basePercentage: 2,
        jobs: [
            { key: 'network_engineer', title: 'Network Engineer', level: 1, literacyReq: 55, basePercentage: 70 },
            { key: 'it_director', title: 'IT Director', level: 2, literacyReq: 85, basePercentage: 30 }
        ]
    },
    abundanceTemple: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'temple_farmer', title: 'Temple Farmer', level: 1, literacyReq: 40, basePercentage: 70 },
            { key: 'high_provisioner', title: 'High Provisioner', level: 2, literacyReq: 75, basePercentage: 30 }
        ]
    },
    aqueductOfLife: {
        tier: 3,
        basePercentage: 1,
        jobs: [
            { key: 'water_keeper', title: 'Water Keeper', level: 1, literacyReq: 40, basePercentage: 70 },
            { key: 'high_aqueduct_master', title: 'High Aqueduct Master', level: 2, literacyReq: 80, basePercentage: 30 }
        ]
    }
};

// Unemployment modifiers based on happiness/crime
const UNEMPLOYMENT_HAPPINESS_THRESHOLD = 40; // Below this, unemployment rises
const UNEMPLOYMENT_CRIME_THRESHOLD = 30;     // Above this, unemployment rises

class CitizenJobSystem {
    constructor() {
        this.isInitialized = false;
        this._jobDefCache = new Map(); // Cache job definitions for O(1) lookup
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('Citizen Job System initialized');
    }

    // ═════════════════════════════════════════════════════════════════════════════════════════════
    // JOB DEFINITION LOOKUP
    // ═══════════════════════════════════════════════════════════════════════════════════════════════

    getJobDefinition(jobKey) {
        if (!jobKey) return null;

        // Check cache first
        if (this._jobDefCache.has(jobKey)) {
            return this._jobDefCache.get(jobKey);
        }

        for (const [buildingType, def] of Object.entries(JOB_DEFINITIONS)) {
            if (!def || !def.jobs) continue;
            const job = def.jobs.find(j => j && j.key === jobKey);
            if (job) {
                const result = { ...job, buildingType, tier: def.tier };
                this._jobDefCache.set(jobKey, result);
                return result;
            }
        }
        return null;
    }

    getJobsForBuilding(buildingType) {
        if (!buildingType) return [];
        const def = JOB_DEFINITIONS[buildingType];
        if (!def || !def.jobs) return [];
        return def.jobs.filter(j => j).map(j => ({ ...j, buildingType, tier: def.tier }));
    }

    // ══════════════════════════════════════════════════════════════════════════════════
    // INCOME CALCULATION (complex weighed formula)
    // ══════════════════════════════════════════════════════════════════════════════════

    /**
     * Calculate income modifiers from nation stats.
     * Each factor is weighed separately, then combined.
     *
     * @param {object} nationStats - Nation.nationStats (literacy, happiness, crime, disease, etc.)
     * @param {number} nationTech - Nation.tech level
     * @returns {object} { totalModifier, breakdown: { literacy, tech, happiness, crime, disease } }
     */
    calculateIncomeModifier(nationStats, nationTech) {
        const literacy = nationStats?.literacy ?? 0;      // 0-100
        const tech = nationTech ?? 0;                     // 0+
        const happiness = nationStats?.happiness ?? 50;   // 0-100
        const crime = nationStats?.crime ?? 15;           // 0-100
        const disease = nationStats?.disease ?? 10;       // 0-100

        // Each factor weighed separately
        // Literacy: +1% per literacy point (0% to +100%)
        const literacyMod = literacy * 0.01;

        // Technology: +0.1% per tech level
        const techMod = tech * 0.001;

        // Happiness: +0.5% per point above 50, -0.5% per point below 50
        const happinessMod = (happiness - 50) * 0.005;

        // Crime: -1% per crime point above 30
        const crimeMod = Math.max(0, crime - 30) * -0.01;

        // Disease: -1% per disease point above 10
        const diseaseMod = Math.max(0, disease - 10) * -0.01;

        // Combined modifier (can be positive or negative)
        const totalModifier = literacyMod + techMod + happinessMod + crimeMod + diseaseMod;

        return {
            totalModifier,
            breakdown: {
                literacy: literacyMod,
                tech: techMod,
                happiness: happinessMod,
                crime: crimeMod,
                disease: diseaseMod
            }
        };
    }

    /**
     * Calculate base income for a job, with tier/level bonus.
     * @param {object} job - Job definition from JOB_DEFINITIONS
     * @param {number} levelBonusMultiplier - 1 for level 1, 2 for level 2 (adds $5k-$15k)
     * @returns {number} Base income before nation stat modifiers
     */
    calculateBaseIncome(job, levelBonusMultiplier = 1) {
        const range = TIER_RANGES[job.tier] || TIER_RANGES[1];
        const baseMin = range.min;
        const baseMax = range.max;
        const levelBonus = range.levelBonus * (levelBonusMultiplier - 1);

        // Random within range
        const randomIncome = baseMin + Math.random() * (baseMax - baseMin);

        return Math.floor(randomIncome + levelBonus);
    }

    /**
     * Calculate final income for a citizen's job.
     * @param {object} citizen - Citizen object with job info
     * @param {object} nationStats - Nation stats
     * @param {number} nationTech - Nation tech level
     * @returns {number} Final income
     */
    calculateCitizenIncome(citizen, nationStats, nationTech) {
        if (!citizen.job || !citizen.job.key) return 0;

        const jobDef = this.getJobDefinition(citizen.job.key);
        if (!jobDef) return 0;

        const levelBonusMultiplier = (citizen.job.level === 2 ? 2 : 1);
        const baseIncome = this.calculateBaseIncome(jobDef, levelBonusMultiplier);

        const { totalModifier } = this.calculateIncomeModifier(nationStats, nationTech);

        // Apply modifier: income * (1 + modifier)
        // Clamp modifier between -0.9 and +2.0 to prevent extreme values
        const clampedModifier = Math.max(-0.9, Math.min(2.0, totalModifier));
        const finalIncome = baseIncome * (1 + clampedModifier);

        return Math.floor(Math.max(1000, finalIncome)); // Minimum $1,000
    }

    // ══════════════════════════════════════════════════════════════════════════════════
    // JOB ASSIGNMENT (percentage-based, no 1:1 slots)
    // ══════════════════════════════════════════════════════════════════════════════════

    /**
     * Calculate job demand percentages from nation's improvements, projects, and wonders.
     * Returns { jobKey: percentage } capped based on total building count.
     *
     * Cap logic:
     * - 1 building → max 75% per job type
     * - Each additional building reduces the cap by 4 points (min 20%)
     * - This prevents one building type from crowding out all other jobs
     */
    calculateJobDemand(nation) {
        const jobDemand = {};
        let totalBuildings = 0;

        const buildingCategories = [
            nation.improvements,
            nation.projects,
            nation.wonders
        ];

        for (const category of buildingCategories) {
            if (!category) continue;
            for (const [buildingType, count] of Object.entries(category)) {
                totalBuildings += count;
                const jobs = this.getJobsForBuilding(buildingType);
                for (const job of jobs) {
                    const pct = job.basePercentage * count;
                    jobDemand[job.key] = (jobDemand[job.key] || 0) + pct;
                }
            }
        }

        // Cap per job type: 1 building = 75%, scales down by 4 per building, min 20%
        const capPerJobType = totalBuildings > 0
            ? Math.max(20, 75 - (totalBuildings - 1) * 4)
            : 0;

        for (const key of Object.keys(jobDemand)) {
            jobDemand[key] = Math.min(jobDemand[key], capPerJobType);
        }

        // Normalize if total exceeds 100%
        const totalDemand = Object.values(jobDemand).reduce((a, b) => a + b, 0);
        if (totalDemand > 100) {
            for (const key of Object.keys(jobDemand)) {
                jobDemand[key] = (jobDemand[key] / totalDemand) * 100;
            }
        }

        return jobDemand;
    }

    /**
     * Calculate unemployment rate based on happiness and crime.
     * Base unemployment is higher when happiness is low and crime is high.
     */
    calculateUnemploymentRate(nationStats) {
        const happiness = nationStats?.happiness ?? 50;
        const crime = nationStats?.crime ?? 15;

        let unemploymentRate = 0.05; // 5% base

        // Low happiness increases unemployment
        if (happiness < UNEMPLOYMENT_HAPPINESS_THRESHOLD) {
            unemploymentRate += (UNEMPLOYMENT_HAPPINESS_THRESHOLD - happiness) * 0.002; // +0.2% per point below 40
        }

        // High crime increases unemployment
        if (crime > UNEMPLOYMENT_CRIME_THRESHOLD) {
            unemploymentRate += (crime - UNEMPLOYMENT_CRIME_THRESHOLD) * 0.001; // +0.1% per point above 30
        }

        return Math.min(0.9, Math.max(0, unemploymentRate)); // Cap at 90%
    }

    /**
     * Assign jobs to working-age citizens based on:
     * - Job demand percentages from buildings
     * - Literacy-based eligibility (higher literacy = higher tier/level)
     * - Per-job-type caps based on building count
     * - Unemployment from happiness/crime
     *
     * Stability rules:
     * - Citizens keep their existing jobs day-to-day (no constant churn)
     * - Workers can upgrade to higher-tier jobs as literacy increases
     * - Workers lose jobs if their building type count drops to 0 (building destroyed)
     * - Turnover: low happiness causes random job loss (new workers replace old)
     * - New workers entering the workforce compete for openings
     * - Buildings work regardless of whether they have workers assigned
     *
     * @param {Array} citizens - Array of citizen objects (from PopulationSystem)
     * @param {object} nation - Nation object
     * @param {object} nationStats - Nation.nationStats
     * @returns {Array} Citizens with job assignments
     */
    assignJobsToCitizens(citizens, nation, nationStats) {
        if (!citizens || !Array.isArray(citizens)) return citizens || [];
        if (!nationStats) nationStats = {};

        const jobDemand = this.calculateJobDemand(nation);
        const unemploymentRate = this.calculateUnemploymentRate(nationStats);
        const happiness = nationStats.happiness ?? 50;

        // Determine which age groups can work based on research/motion effects
        const seniorsCanWork = nation?.researchModifiers?.seniorsWorkTaxHalf > 0;
        const childrenCanWork = nation?.childLaborEnabled === true;

        const workingAgeGroups = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        if (seniorsCanWork) workingAgeGroups.push('senior');
        if (childrenCanWork) workingAgeGroups.push('child');

        const workingCitizens = citizens.filter(c => workingAgeGroups.includes(c.ageGroup));
        const nonWorkingCitizens = citizens.filter(c => !workingAgeGroups.includes(c.ageGroup));

        // Mark non-working as unemployed/dependents
        for (const c of nonWorkingCitizens) {
            c.job = null;
            if (c.ageGroup === 'senior' || c.ageGroup === 'elderly') {
                c.employmentStatus = seniorsCanWork ? 'eligible_for_work' : 'retired';
            } else if (c.ageGroup === 'child') {
                c.employmentStatus = childrenCanWork ? 'eligible_for_work' : 'not_applicable';
            } else {
                c.employmentStatus = 'not_applicable';
            }
            c.income = 0;
        }

        const totalWorking = workingCitizens.length;
        if (totalWorking === 0) return citizens;

        // ══════════════════════════════════════════════════════════════════════════════
        // STEP 1: Preserve existing jobs, remove jobs for destroyed buildings
        // ══════════════════════════════════════════════════════════════════════════════

        // Track current job demand per building type (0 = no buildings = no jobs)
        const buildingJobDemand = {};
        for (const [buildingType, count] of Object.entries(nation.improvements || {})) {
            const jobs = this.getJobsForBuilding(buildingType);
            for (const job of jobs) {
                buildingJobDemand[job.key] = count > 0 ? (jobDemand[job.key] || 0) : 0;
            }
        }
        for (const [buildingType, count] of Object.entries(nation.projects || {})) {
            const jobs = this.getJobsForBuilding(buildingType);
            for (const job of jobs) {
                buildingJobDemand[job.key] = count > 0 ? (jobDemand[job.key] || 0) : 0;
            }
        }
        for (const [buildingType, count] of Object.entries(nation.wonders || {})) {
            const jobs = this.getJobsForBuilding(buildingType);
            for (const job of jobs) {
                buildingJobDemand[job.key] = count > 0 ? (jobDemand[job.key] || 0) : 0;
            }
        }

        // Remove jobs from citizens whose building type no longer exists
        // Allow upgrades for citizens whose literacy now qualifies for higher level
        const citizensNeedingNewJob = [];
        for (const citizen of workingCitizens) {
            if (citizen.job && citizen.job.buildingType) {
                const buildingCount = nation.improvements?.[citizen.job.buildingType] ||
                    nation.projects?.[citizen.job.buildingType] ||
                    nation.wonders?.[citizen.job.buildingType] || 0;

                if (buildingCount === 0) {
                    // Building destroyed — lose job
                    citizen.job = null;
                    citizen.employmentStatus = 'unemployed';
                    citizen.income = 0;
                    citizensNeedingNewJob.push(citizen);
                } else if (citizen.job.level === 1) {
                    // Check if eligible for level 2 upgrade (same job, higher literacy)
                    const jobDef = this.getJobDefinition(citizen.job.key);
                    if (jobDef && jobDef.level === 1) {
                        const lvl2Job = this.getJobDefinitionForBuildingAndLevel(
                            citizen.job.buildingType, 2
                        );
                        if (lvl2Job && (citizen.literacyScore || 0) >= lvl2Job.literacyReq) {
                            // Upgrade to level 2
                            citizen.job = {
                                key: lvl2Job.key,
                                title: lvl2Job.title,
                                buildingType: lvl2Job.buildingType,
                                tier: lvl2Job.tier,
                                level: lvl2Job.level
                            };
                            citizen.employmentStatus = 'employed';
                        }
                    }
                }
            } else {
                // No job — needs assignment
                citizensNeedingNewJob.push(citizen);
            }
        }

        // ══════════════════════════════════════════════════════════════════════════════
        // STEP 2: Turnover — low happiness causes random job loss
        // ═══════════════════════════════════════════════════════════════════════════════

        const turnoverChance = happiness < 40 ? (40 - happiness) * 0.003 : 0; // up to ~12% at 0 happiness
        const citizensWithJobs = workingCitizens.filter(c => c.employmentStatus === 'employed' && c.job);
        for (const citizen of citizensWithJobs) {
            if (Math.random() < turnoverChance) {
                citizen.job = null;
                citizen.employmentStatus = 'unemployed';
                citizen.income = 0;
                citizensNeedingNewJob.push(citizen);
            }
        }

        // ══════════════════════════════════════════════════════════════════════════════
        // STEP 3: Calculate unemployment target for citizens needing jobs
        // ══════════════════════════════════════════════════════════════════════════════

        const citizensNeedingJobCount = citizensNeedingNewJob.length;
        if (citizensNeedingJobCount === 0) return citizens;

        const targetUnemployedFromNew = Math.floor(citizensNeedingJobCount * unemploymentRate);

        // Shuffle for random assignment
        const shuffled = [...citizensNeedingNewJob].sort(() => Math.random() - 0.5);

        // Mark first N as unemployed
        for (let i = 0; i < targetUnemployedFromNew && i < shuffled.length; i++) {
            shuffled[i].job = null;
            shuffled[i].employmentStatus = 'unemployed';
            shuffled[i].income = 0;
        }

        // Remaining are employable — sort by literacy descending
        const employableCitizens = shuffled
            .slice(targetUnemployedFromNew)
            .sort((a, b) => (b.literacyScore || 0) - (a.literacyScore || 0));

        if (employableCitizens.length === 0) return citizens;

        // ══════════════════════════════════════════════════════════════════════════════
        // STEP 4: Assign new jobs based on demand percentages
        // ══════════════════════════════════════════════════════════════════════════════

        // Get all jobs sorted by tier desc, level desc, demand desc
        const allJobs = [];
        for (const [buildingType, def] of Object.entries(JOB_DEFINITIONS)) {
            for (const job of def.jobs) {
                allJobs.push({ ...job, buildingType, tier: def.tier });
            }
        }
        allJobs.sort((a, b) => {
            if (b.tier !== a.tier) return b.tier - a.tier;
            if (b.level !== a.level) return b.level - a.level;
            return (jobDemand[b.key] || 0) - (jobDemand[a.key] || 0);
        });

        // Calculate how many workers per job based on demand percentages
        const jobAllocations = {};
        for (const job of allJobs) {
            const pct = jobDemand[job.key] || 0;
            jobAllocations[job.key] = Math.floor(employableCitizens.length * (pct / 100));
        }

        // Distribute any remaining workers to jobs with highest demand (proportional)
        let remainingWorkers = employableCitizens.length - Object.values(jobAllocations).reduce((a, b) => a + b, 0);
        const sortedJobsByDemand = [...allJobs].sort((a, b) => (jobDemand[b.key] || 0) - (jobDemand[a.key] || 0));
        let jobIdx = 0;
        while (remainingWorkers > 0 && jobIdx < sortedJobsByDemand.length) {
            const job = sortedJobsByDemand[jobIdx];
            jobAllocations[job.key] = (jobAllocations[job.key] || 0) + 1;
            remainingWorkers--;
            jobIdx = (jobIdx + 1) % sortedJobsByDemand.length;
        }

        // Assign citizens to jobs — each citizen must individually qualify based on literacyScore
        const assignedCitizenIdx = new Set();

        for (const job of allJobs) {
            const count = jobAllocations[job.key] || 0;
            let assignedForThisJob = 0;

            for (let i = 0; i < employableCitizens.length && assignedForThisJob < count; i++) {
                if (assignedCitizenIdx.has(i)) continue;

                const citizen = employableCitizens[i];

                // Citizen must meet individual literacy requirement for this job
                if ((citizen.literacyScore || 0) < job.literacyReq) continue;

                citizen.job = {
                    key: job.key,
                    title: job.title,
                    buildingType: job.buildingType,
                    tier: job.tier,
                    level: job.level
                };
                citizen.employmentStatus = 'employed';
                assignedCitizenIdx.add(i);
                assignedForThisJob++;
            }
        }

        // Any remaining citizens without a job become unemployed
        for (let i = 0; i < employableCitizens.length; i++) {
            if (!assignedCitizenIdx.has(i)) {
                employableCitizens[i].job = null;
                employableCitizens[i].employmentStatus = 'unemployed';
                employableCitizens[i].income = 0;
            }
        }

        return citizens;
    }

    /**
     * Get a job definition for a specific building type and level.
     * @param {string} buildingType - The building type key
     * @param {number} level - The job level (1 or 2)
     * @returns {object|null} Job definition with buildingType and tier added, or null
     */
    getJobDefinitionForBuildingAndLevel(buildingType, level) {
        if (!buildingType) return null;
        const def = JOB_DEFINITIONS[buildingType];
        if (!def || !def.jobs) return null;
        const job = def.jobs.find(j => j && j.level === level);
        if (!job) return null;
        return { ...job, buildingType, tier: def.tier };
    }

    // ══════════════════════════════════════════════════════════════════════════════════
    // INCOME APPLICATION
    // ══════════════════════════════════════════════════════════════════════════════════

    /**
     * Calculate income for all employed citizens and store on citizen objects.
     * Applies tax multiplier for special demographics:
     * - Seniors with seniors_work_tax_half research: taxed at 50% rate (taxMultiplier = 0.5)
     * - Children with child labor motion: taxed at full rate (taxMultiplier = 1.0)
     * - All others: full rate (taxMultiplier = 1.0)
     * @param {Array} citizens - Citizen objects with job assignments
     * @param {object} nationStats - Nation stats
     * @param {number} nationTech - Nation tech level
     * @param {object} nation - Nation object (for researchModifiers access)
     */
    applyIncomes(citizens, nationStats, nationTech, nation) {
        const seniorsHalfTax = nation?.researchModifiers?.seniorsWorkTaxHalf > 0;

        for (const citizen of citizens) {
            if (citizen.employmentStatus === 'employed' && citizen.job) {
                citizen.income = this.calculateCitizenIncome(citizen, nationStats, nationTech);

                // Apply labor law edict citizen income modifier
                const citizenIncomeMod = nation?.edictEffects?.citizenIncomeModifier || 0;
                const isUnlocked = (typeof this.isEdictUnlocked === 'function')
                    ? this.isEdictUnlocked(nation, 'laborLaws')
                    : (window.EdictSystem && typeof window.EdictSystem.isEdictUnlocked === 'function'
                        ? window.EdictSystem.isEdictUnlocked(nation, 'laborLaws') : false);
                if (citizenIncomeMod !== 0 && nation && isUnlocked) {
                    citizen.income = Math.floor(citizen.income * (1 + citizenIncomeMod));
                }

                // Apply tax multiplier based on demographics
                if (seniorsHalfTax && citizen.ageGroup === 'senior') {
                    citizen.taxMultiplier = 0.5; // Seniors taxed at half rate
                } else {
                    citizen.taxMultiplier = 1.0; // Full rate for everyone else including children
                }
            } else {
                citizen.income = 0;
                citizen.taxMultiplier = 0;
            }
        }
    }

    /**
     * Sum total income of all employed citizens.
     * @param {Array} citizens
     * @returns {number} Total gross income
     */
    getTotalGrossIncome(citizens) {
        return citizens.reduce((sum, c) => sum + (c.income || 0), 0);
    }

    /**
     * Sum total taxable income of all employed citizens, applying tax multipliers.
     * Seniors with seniors_work_tax_half research are taxed at 50% rate.
     * Children with child labor motion are taxed at full rate.
     * @param {Array} citizens
     * @returns {number} Total taxable income
     */
    getTotalTaxableIncome(citizens) {
        return citizens.reduce((sum, c) => {
            if (!c.income || !c.job) return sum;
            const multiplier = c.taxMultiplier || 1.0;
            return sum + Math.floor(c.income * multiplier);
        }, 0);
    }

    /**
     * Get count of employed citizens.
     */
    getEmployedCount(citizens) {
        return citizens.filter(c => c.employmentStatus === 'employed').length;
    }

    /**
     * Get count of unemployed citizens (working age only).
     */
    getUnemployedCount(citizens) {
        return citizens.filter(c => c.employmentStatus === 'unemployed').length;
    }

    /**
     * Get job distribution breakdown for UI.
     */
    getJobDistribution(citizens) {
        const distribution = {};
        for (const c of citizens) {
            if (c.job) {
                const key = c.job.key;
                if (!distribution[key]) {
                    distribution[key] = {
                        title: c.job.title,
                        tier: c.job.tier,
                        level: c.job.level,
                        buildingType: c.job.buildingType,
                        count: 0,
                        totalIncome: 0
                    };
                }
                distribution[key].count++;
                distribution[key].totalIncome += c.income || 0;
            }
        }
        return distribution;
    }

    destroy() {
        this.isInitialized = false;
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.CitizenJobSystem = new CitizenJobSystem();
} else {
    module.exports = { CitizenJobSystem };
}
