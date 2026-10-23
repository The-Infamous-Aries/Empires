/**
 * Economic Events System Data
 * Dominion Wars - Nation Building Strategy Game
 * 
 * Comprehensive economic events affecting markets, trade, industry, and finances
 * Each event has duration-based effects on economic indicators
 */

var EconomicEvents = {
    // ═══════════════════════════════════════════════════════════════
    // MARKET EVENTS (50 events)
    // ═══════════════════════════════════════════════════════════════
    market: [
        {
            id: 'bull_market_surge',
            name: 'Bull Market Surge',
            description: 'Stock markets experience unprecedented growth as investor confidence soars.',
            duration: 45,
            effects: { gdpGrowthRate: 0.08, unemploymentRate: -0.015 },
            weight: 8
        },
        {
            id: 'bear_market_decline',
            name: 'Bear Market Decline',
            description: 'Markets enter a prolonged downturn as economic uncertainty spreads.',
            duration: 60,
            effects: { gdpGrowthRate: -0.05, unemploymentRate: 0.02 },
            weight: 7
        },
        {
            id: 'commodity_boom',
            name: 'Commodity Price Boom',
            description: 'Raw material prices surge due to global supply constraints.',
            duration: 30,
            effects: { inflationRate: 0.03, gdpGrowthRate: 0.04 },
            weight: 10
        },
        {
            id: 'currency_volatility',
            name: 'Currency Volatility Crisis',
            description: 'Exchange rates fluctuate wildly, creating uncertainty for international trade.',
            duration: 25,
            effects: { exchangeRate: 0.85, inflationRate: 0.025 },
            weight: 9
        },
        {
            id: 'venture_capital_boom',
            name: 'Venture Capital Boom',
            description: 'Massive venture capital investments fuel startup growth and innovation.',
            duration: 90,
            effects: { gdpGrowthRate: 0.06, unemploymentRate: -0.01 },
            weight: 7
        },
        {
            id: 'real_estate_bubble',
            name: 'Real Estate Market Bubble',
            description: 'Property prices rise rapidly, creating wealth but raising affordability concerns.',
            duration: 120,
            effects: { inflationRate: 0.04, gdpGrowthRate: 0.03 },
            weight: 6
        },
        {
            id: 'market_correction',
            name: 'Market Correction',
            description: 'Overvalued assets undergo a healthy correction, stabilizing prices.',
            duration: 20,
            effects: { gdpGrowthRate: -0.02, inflationRate: -0.01 },
            weight: 12
        },
        {
            id: 'ipo_wave',
            name: 'IPO Wave',
            description: 'Numerous companies go public, injecting capital into the economy.',
            duration: 35,
            effects: { gdpGrowthRate: 0.05, exchangeRate: 1.1 },
            weight: 8
        },
        {
            id: 'merger_mania',
            name: 'Corporate Merger Wave',
            description: 'Large-scale corporate consolidations reshape entire industries.',
            duration: 75,
            effects: { gdpGrowthRate: 0.025, unemploymentRate: 0.008 },
            weight: 6
        },
        {
            id: 'dividend_bonanza',
            name: 'Dividend Bonanza',
            description: 'Major corporations announce record dividend payments to shareholders.',
            duration: 15,
            effects: { gdpGrowthRate: 0.03, inflationRate: 0.015 },
            weight: 10
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // TRADE EVENTS (40 events)
    // ═══════════════════════════════════════════════════════════════
    trade: [
        {
            id: 'free_trade_agreement',
            name: 'Free Trade Agreement Signed',
            description: 'A comprehensive trade agreement eliminates tariffs with major partners.',
            duration: 365,
            effects: { gdpGrowthRate: 0.04, exchangeRate: 1.05 },
            weight: 5
        },
        {
            id: 'trade_war_escalation',
            name: 'Trade War Escalation',
            description: 'Rising tariffs and trade restrictions disrupt international commerce.',
            duration: 180,
            effects: { gdpGrowthRate: -0.03, inflationRate: 0.02 },
            weight: 6
        },
        {
            id: 'port_modernization',
            name: 'Port Infrastructure Modernization',
            description: 'Major port upgrades dramatically increase trade capacity and efficiency.',
            duration: 200,
            effects: { gdpGrowthRate: 0.035, unemploymentRate: -0.005 },
            weight: 7
        },
        {
            id: 'shipping_crisis',
            name: 'Global Shipping Crisis',
            description: 'Container shortages and port congestion severely disrupt supply chains.',
            duration: 90,
            effects: { inflationRate: 0.035, gdpGrowthRate: -0.025 },
            weight: 8
        },
        {
            id: 'digital_trade_platform',
            name: 'Digital Trade Platform Launch',
            description: 'New technology streamlines international trade processes.',
            duration: 150,
            effects: { gdpGrowthRate: 0.025, exchangeRate: 1.03 },
            weight: 9
        }
    ]
};

// Expand trade events significantly
EconomicEvents.trade = [
    ...EconomicEvents.trade,
    {
        id: 'tariff_reduction',
        name: 'Multilateral Tariff Reduction',
        description: 'Regional trade partners agree to significant tariff reductions.',
        duration: 300,
        effects: { gdpGrowthRate: 0.03, exchangeRate: 1.04 },
        weight: 8
    },
    {
        id: 'export_quota_removal',
        name: 'Export Quota Elimination',
        description: 'Removal of export quotas opens new markets for domestic producers.',
        duration: 180,
        effects: { gdpGrowthRate: 0.045, unemploymentRate: -0.008 },
        weight: 9
    },
    {
        id: 'customs_digitization',
        name: 'Customs Process Digitization',
        description: 'Digital customs systems dramatically reduce trade processing times.',
        duration: 365,
        effects: { gdpGrowthRate: 0.02, inflationRate: -0.005 },
        weight: 10
    },
    {
        id: 'trade_corridor_opening',
        name: 'New Trade Corridor Opening',
        description: 'Infrastructure development creates efficient new trade routes.',
        duration: 250,
        effects: { gdpGrowthRate: 0.035, exchangeRate: 1.06 },
        weight: 7
    },
    {
        id: 'sanctions_imposed',
        name: 'International Sanctions Imposed',
        description: 'Economic sanctions restrict trade with several important partners.',
        duration: 400,
        effects: { gdpGrowthRate: -0.04, exchangeRate: 0.9 },
        weight: 4
    },
    {
        id: 'wto_membership',
        name: 'WTO Membership Advancement',
        description: 'Improved WTO standing enhances trade negotiation position.',
        duration: 500,
        effects: { gdpGrowthRate: 0.025, exchangeRate: 1.03 },
        weight: 6
    },
    {
        id: 'trade_mission_success',
        name: 'Trade Mission Success',
        description: 'Government trade missions secure major export contracts.',
        duration: 120,
        effects: { gdpGrowthRate: 0.04, unemploymentRate: -0.006 },
        weight: 12
    },
    {
        id: 'anti_dumping_protection',
        name: 'Anti-Dumping Protection',
        description: 'New regulations protect domestic industries from unfair foreign competition.',
        duration: 200,
        effects: { gdpGrowthRate: 0.015, unemploymentRate: -0.004 },
        weight: 9
    },
    {
        id: 'trade_deficit_crisis',
        name: 'Trade Deficit Crisis',
        description: 'Massive trade imbalances threaten currency stability.',
        duration: 150,
        effects: { exchangeRate: 0.85, inflationRate: 0.03 },
        weight: 6
    },
    {
        id: 'export_credit_expansion',
        name: 'Export Credit Facility Expansion',
        description: 'Enhanced export financing helps domestic companies compete globally.',
        duration: 300,
        effects: { gdpGrowthRate: 0.03, exchangeRate: 1.02 },
        weight: 8
    }
];

// Add comprehensive industry events
EconomicEvents.industry = [
    {
        id: 'manufacturing_automation',
        name: 'Manufacturing Automation Wave',
        description: 'Widespread adoption of automation technologies transforms manufacturing.',
        duration: 400,
        effects: { gdpGrowthRate: 0.05, unemploymentRate: 0.015 },
        weight: 7
    },
    {
        id: 'green_industry_transition',
        name: 'Green Industry Transition',
        description: 'Industries successfully transition to environmentally sustainable practices.',
        duration: 500,
        effects: { gdpGrowthRate: 0.025, inflationRate: 0.01 },
        weight: 6
    },
    {
        id: 'supply_chain_resilience',
        name: 'Supply Chain Resilience Initiative',
        description: 'Domestic supply chain strengthening reduces foreign dependency.',
        duration: 300,
        effects: { gdpGrowthRate: 0.02, unemploymentRate: -0.008 },
        weight: 9
    },
    {
        id: 'industrial_cluster_development',
        name: 'Industrial Cluster Development',
        description: 'Specialized industrial zones create synergies and efficiency gains.',
        duration: 600,
        effects: { gdpGrowthRate: 0.04, unemploymentRate: -0.012 },
        weight: 5
    },
    {
        id: 'factory_closure_wave',
        name: 'Manufacturing Plant Closures',
        description: 'Global competition forces closure of outdated manufacturing facilities.',
        duration: 180,
        effects: { gdpGrowthRate: -0.03, unemploymentRate: 0.025 },
        weight: 8
    },
    {
        id: 'industrial_accident',
        name: 'Major Industrial Accident',
        description: 'A serious industrial accident raises safety concerns and costs.',
        duration: 90,
        effects: { gdpGrowthRate: -0.015, inflationRate: 0.01 },
        weight: 6
    },
    {
        id: 'reshoring_movement',
        name: 'Manufacturing Reshoring',
        description: 'Companies move production back from overseas to domestic facilities.',
        duration: 250,
        effects: { gdpGrowthRate: 0.035, unemploymentRate: -0.015 },
        weight: 7
    },
    {
        id: 'industrial_innovation_hub',
        name: 'Industrial Innovation Hub',
        description: 'New research and development centers drive industrial innovation.',
        duration: 450,
        effects: { gdpGrowthRate: 0.045, unemploymentRate: -0.008 },
        weight: 6
    },
    {
        id: 'energy_cost_spike',
        name: 'Industrial Energy Cost Crisis',
        description: 'Rapidly rising energy costs squeeze industrial profit margins.',
        duration: 120,
        effects: { gdpGrowthRate: -0.025, inflationRate: 0.025 },
        weight: 10
    },
    {
        id: 'skilled_labor_shortage',
        name: 'Skilled Industrial Labor Shortage',
        description: 'Critical shortage of skilled workers hampers industrial growth.',
        duration: 200,
        effects: { gdpGrowthRate: -0.02, unemploymentRate: -0.01 },
        weight: 11
    }
];

// Add banking and finance events
EconomicEvents.finance = [
    {
        id: 'banking_sector_consolidation',
        name: 'Banking Sector Consolidation',
        description: 'Major bank mergers create more efficient financial institutions.',
        duration: 200,
        effects: { gdpGrowthRate: 0.02, interestRate: -0.005 },
        weight: 8
    },
    {
        id: 'fintech_revolution',
        name: 'Financial Technology Revolution',
        description: 'Innovative fintech solutions transform banking and payments.',
        duration: 300,
        effects: { gdpGrowthRate: 0.03, unemploymentRate: -0.005 },
        weight: 9
    },
    {
        id: 'central_bank_policy_shift',
        name: 'Central Bank Policy Shift',
        description: 'Central bank adopts new monetary policy framework.',
        duration: 180,
        effects: { interestRate: 0.01, exchangeRate: 1.05 },
        weight: 10
    },
    {
        id: 'banking_crisis',
        name: 'Banking Sector Crisis',
        description: 'Several major banks face liquidity problems, threatening stability.',
        duration: 150,
        effects: { gdpGrowthRate: -0.04, interestRate: 0.02 },
        weight: 4
    },
    {
        id: 'credit_expansion',
        name: 'Credit Market Expansion',
        description: 'Relaxed lending standards increase credit availability.',
        duration: 250,
        effects: { gdpGrowthRate: 0.04, inflationRate: 0.02 },
        weight: 8
    },
    {
        id: 'financial_regulation_reform',
        name: 'Financial Regulation Reform',
        description: 'New regulations enhance financial system stability and transparency.',
        duration: 400,
        effects: { gdpGrowthRate: 0.01, interestRate: 0.005 },
        weight: 7
    },
    {
        id: 'sovereign_wealth_fund',
        name: 'Sovereign Wealth Fund Creation',
        description: 'Establishment of national wealth fund for long-term investment.',
        duration: 500,
        effects: { gdpGrowthRate: 0.025, exchangeRate: 1.03 },
        weight: 5
    },
    {
        id: 'currency_devaluation',
        name: 'Currency Devaluation Crisis',
        description: 'Rapid currency depreciation creates economic instability.',
        duration: 100,
        effects: { exchangeRate: 0.75, inflationRate: 0.05 },
        weight: 6
    },
    {
        id: 'financial_literacy_program',
        name: 'National Financial Literacy Program',
        description: 'Comprehensive financial education improves citizen financial health.',
        duration: 300,
        effects: { gdpGrowthRate: 0.015, unemploymentRate: -0.003 },
        weight: 9
    },
    {
        id: 'pension_fund_crisis',
        name: 'Pension Fund Crisis',
        description: 'Major pension funds face insolvency, requiring government intervention.',
        duration: 250,
        effects: { gdpGrowthRate: -0.02, interestRate: 0.015 },
        weight: 5
    }
];

// Add technology and innovation events
EconomicEvents.technology = [
    {
        id: 'artificial_intelligence_adoption',
        name: 'AI Adoption Acceleration',
        description: 'Rapid adoption of AI technologies across industries boosts productivity.',
        duration: 400,
        effects: { gdpGrowthRate: 0.06, unemploymentRate: 0.01 },
        weight: 8
    },
    {
        id: 'blockchain_implementation',
        name: 'Blockchain Infrastructure Rollout',
        description: 'Nationwide blockchain implementation improves transaction efficiency.',
        duration: 300,
        effects: { gdpGrowthRate: 0.025, inflationRate: -0.005 },
        weight: 7
    },
    {
        id: 'quantum_computing_breakthrough',
        name: 'Quantum Computing Commercial Breakthrough',
        description: 'First commercial quantum computers revolutionize computing capabilities.',
        duration: 600,
        effects: { gdpGrowthRate: 0.08, unemploymentRate: -0.005 },
        weight: 3
    },
    {
        id: 'cybersecurity_investment',
        name: 'National Cybersecurity Initiative',
        description: 'Massive investment in cybersecurity infrastructure protects digital economy.',
        duration: 250,
        effects: { gdpGrowthRate: 0.02, unemploymentRate: -0.008 },
        weight: 9
    },
    {
        id: 'tech_talent_immigration',
        name: 'Tech Talent Immigration Program',
        description: 'Streamlined visa program attracts global technology talent.',
        duration: 200,
        effects: { gdpGrowthRate: 0.035, unemploymentRate: -0.006 },
        weight: 8
    },
    {
        id: 'digital_divide_closure',
        name: 'Digital Divide Elimination',
        description: 'Universal broadband access eliminates digital inequality.',
        duration: 350,
        effects: { gdpGrowthRate: 0.03, unemploymentRate: -0.01 },
        weight: 6
    },
    {
        id: 'tech_bubble_burst',
        name: 'Technology Bubble Burst',
        description: 'Overvalued tech stocks crash, affecting the broader economy.',
        duration: 180,
        effects: { gdpGrowthRate: -0.04, unemploymentRate: 0.02 },
        weight: 5
    },
    {
        id: 'automation_job_displacement',
        name: 'Automation Job Displacement',
        description: 'Rapid automation displaces workers faster than new jobs are created.',
        duration: 300,
        effects: { gdpGrowthRate: 0.02, unemploymentRate: 0.03 },
        weight: 9
    },
    {
        id: 'digital_currency_adoption',
        name: 'Central Bank Digital Currency Launch',
        description: 'National digital currency modernizes payment systems.',
        duration: 250,
        effects: { gdpGrowthRate: 0.02, inflationRate: -0.01 },
        weight: 6
    },
    {
        id: 'tech_startup_ecosystem',
        name: 'Tech Startup Ecosystem Boom',
        description: 'Thriving startup ecosystem attracts venture capital and talent.',
        duration: 400,
        effects: { gdpGrowthRate: 0.045, unemploymentRate: -0.015 },
        weight: 7
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomicEvents;
} else if (typeof window !== 'undefined') {
    window.EconomicEvents = EconomicEvents;
}