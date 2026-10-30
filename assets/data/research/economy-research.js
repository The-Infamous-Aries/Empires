const EconomyResearch = {

    basic_barter: {
        id: 'basic_barter', name: 'Barter System', category: 'economy', tier: 1,
        description: 'Simple exchange of goods and services without currency',
        requirements: { tech_level: 1 },
        cost: 10000000,
        effects: { taxable_income_boost: 3 },
        unlocks: ['basic_currency', 'simple_accounting']
    },

    simple_accounting: {
        id: 'simple_accounting', name: 'Simple Record Keeping', category: 'economy', tier: 1,
        description: 'Basic counting and record systems for trade',
        requirements: { tech_level: 1 },
        cost: 12000000,
        effects: { taxable_income_boost: 4 },
        unlocks: ['basic_taxation', 'merchant_guilds']
    },

    basic_currency: {
        id: 'basic_currency', name: 'Currency Systems', category: 'economy', tier: 1,
        description: 'Introduction of standardized currency for trade',
        requirements: { tech_level: 1 },
        cost: 15000000,
        effects: { taxable_income_boost: 5 },
        unlocks: ['coinage', 'trade_routes']
    },


    basic_taxation: {
        id: 'basic_taxation', name: 'Tax Collection', category: 'economy', tier: 2,
        description: 'Organized systems for collecting taxes and tributes',
        requirements: { tech_level: 2, prerequisites: ['simple_accounting'] },
        cost: 20000000,
        effects: { happiness_bonus: 3 },
        unlocks: ['progressive_taxation']
    },

    merchant_guilds: {
        id: 'merchant_guilds', name: 'Merchant Guilds', category: 'economy', tier: 2,
        description: 'Organized trade associations and quality standards',
        requirements: { tech_level: 2, prerequisites: ['simple_accounting'] },
        cost: 25000000,
        effects: { taxable_income_boost: 5 },
        unlocks: ['international_trade']
    },

    coinage: {
        id: 'coinage', name: 'Standardized Coinage', category: 'economy', tier: 2,
        description: 'Minted coins with guaranteed weight and purity',
        requirements: { tech_level: 2, prerequisites: ['basic_currency'] },
        cost: 28000000,
        effects: { taxable_income_boost: 6 },
        unlocks: ['banking_houses']
    },

    trade_routes: {
        id: 'trade_routes', name: 'Trade Route Networks', category: 'economy', tier: 2,
        description: 'Established pathways for long-distance commerce',
        requirements: { tech_level: 2, prerequisites: ['basic_currency'] },
        cost: 35000000,
        effects: { happiness_bonus: 5 },
        unlocks: []
    },


    banking_houses: {
        id: 'banking_houses', name: 'Banking Houses', category: 'economy', tier: 3,
        description: 'Early banking institutions for deposits and loans',
        requirements: { tech_level: 3, prerequisites: ['coinage'] },
        cost: 50000000,
        effects: { infra_upkeep_reduction: 3 },
        unlocks: ['letters_of_credit', 'commercial_law']
    },

    international_trade: {
        id: 'international_trade', name: 'International Commerce', category: 'economy', tier: 3,
        description: 'Complex multi-national trade agreements',
        requirements: { tech_level: 3, prerequisites: ['merchant_guilds'] },
        cost: 60000000,
        effects: { taxable_income_boost: 6 },
        unlocks: ['trading_companies']
    },

    progressive_taxation: {
        id: 'progressive_taxation', name: 'Progressive Tax Systems', category: 'economy', tier: 3,
        description: 'Tiered taxation based on wealth and income',
        requirements: { tech_level: 3, prerequisites: ['basic_taxation'] },
        cost: 75000000,
        effects: { happiness_bonus: 7 },
        unlocks: []
    },


    letters_of_credit: {
        id: 'letters_of_credit', name: 'Letters of Credit', category: 'economy', tier: 4,
        description: 'Banking instruments for secure long-distance transactions',
        requirements: { tech_level: 4, prerequisites: ['banking_houses'] },
        cost: 100000000,
        effects: { taxable_income_boost: 7 },
        unlocks: ['double_entry_bookkeeping', 'insurance_systems']
    },

    trading_companies: {
        id: 'trading_companies', name: 'Trading Companies', category: 'economy', tier: 4,
        description: 'Joint-stock companies for large-scale commerce',
        requirements: { tech_level: 4, prerequisites: ['international_trade'] },
        cost: 150000000,
        effects: { land_cost_reduction: 5 },
        unlocks: ['stock_exchanges']
    },

    commercial_law: {
        id: 'commercial_law', name: 'Commercial Law', category: 'economy', tier: 4,
        description: 'Legal frameworks governing business transactions',
        requirements: { tech_level: 4, prerequisites: ['banking_houses'] },
        cost: 250000000,
        effects: { crime_reduction: 5 },
        unlocks: []
    },


    double_entry_bookkeeping: {
        id: 'double_entry_bookkeeping', name: 'Double-Entry Bookkeeping', category: 'economy', tier: 5,
        description: 'Advanced accounting systems for accurate financial tracking',
        requirements: { tech_level: 5, prerequisites: ['letters_of_credit'] },
        cost: 500000000,
        effects: { taxable_income_boost: 8 },
        unlocks: ['financial_analysis']
    },

    stock_exchanges: {
        id: 'stock_exchanges', name: 'Stock Exchanges', category: 'economy', tier: 5,
        description: 'Organized markets for trading company shares',
        requirements: { tech_level: 5, prerequisites: ['trading_companies'] },
        cost: 750000000,
        effects: { land_cost_reduction: 10 },
        unlocks: ['central_banking']
    },

    insurance_systems: {
        id: 'insurance_systems', name: 'Insurance Systems', category: 'economy', tier: 5,
        description: 'Risk management through pooled insurance funds',
        requirements: { tech_level: 5, prerequisites: ['letters_of_credit'] },
        cost: 900000000,
        effects: { taxable_income_boost: 9 },
        unlocks: []
    },


    central_banking: {
        id: 'central_banking', name: 'Central Banking', category: 'economy', tier: 6,
        description: 'National banks controlling monetary policy',
        requirements: { tech_level: 6, prerequisites: ['stock_exchanges'] },
        cost: 1000000000,
        effects: { infra_upkeep_reduction: 5, infra_cost_reduction: 5 },
        unlocks: ['monetary_policy']
    },

    financial_analysis: {
        id: 'financial_analysis', name: 'Financial Analysis', category: 'economy', tier: 6,
        description: 'Mathematical analysis of financial data and trends',
        requirements: { tech_level: 6, prerequisites: ['double_entry_bookkeeping'] },
        cost: 1200000000,
        effects: { taxable_income_boost: 20, crime_reduction: 8 },
        unlocks: ['economic_modeling']
    },

    industrial_financing: {
        id: 'industrial_financing', name: 'Industrial Financing', category: 'economy', tier: 6,
        description: 'Specialized funding mechanisms for industrial development',
        requirements: { tech_level: 6, prerequisites: ['stock_exchanges', 'insurance_systems'] },
        cost: 1500000000,
        effects: { taxable_income_boost: 12, land_cost_reduction: 15 },
        unlocks: ['venture_capital']
    },


    monetary_policy: {
        id: 'monetary_policy', name: 'Advanced Monetary Policy', category: 'economy', tier: 7,
        description: 'Sophisticated tools for economic management',
        requirements: { tech_level: 7, prerequisites: ['central_banking'] },
        cost: 2000000000,
        effects: { infra_upkeep_reduction: 8, infra_cost_reduction: 8 },
        unlocks: ['macroeconomic_theory']
    },

    economic_modeling: {
        id: 'economic_modeling', name: 'Economic Modeling', category: 'economy', tier: 7,
        description: 'Mathematical models for economic prediction',
        requirements: { tech_level: 7, prerequisites: ['financial_analysis'] },
        cost: 2500000000,
        effects: { taxable_income_boost: 22, crime_reduction: 10 },
        unlocks: ['econometrics']
    },

    venture_capital: {
        id: 'venture_capital', name: 'Venture Capital', category: 'economy', tier: 7,
        description: 'High-risk investment in innovative enterprises',
        requirements: { tech_level: 7, prerequisites: ['industrial_financing'] },
        cost: 4000000000,
        effects: { taxable_income_boost: 25, population_growth_bonus: 2 },
        unlocks: ['private_equity']
    },


    macroeconomic_theory: {
        id: 'macroeconomic_theory', name: 'Macroeconomic Theory', category: 'economy', tier: 8,
        description: 'Comprehensive understanding of national economic systems',
        requirements: { tech_level: 8, prerequisites: ['monetary_policy'] },
        cost: 5000000000,
        effects: { infra_upkeep_reduction: 10, infra_cost_reduction: 10 },
        unlocks: ['international_finance']
    },

    econometrics: {
        id: 'econometrics', name: 'Econometrics', category: 'economy', tier: 8,
        description: 'Statistical analysis of economic relationships',
        requirements: { tech_level: 8, prerequisites: ['economic_modeling'] },
        cost: 6000000000,
        effects: { taxable_income_boost: 27, pollution_reduction: 8 },
        unlocks: ['behavioral_economics']
    },

    private_equity: {
        id: 'private_equity', name: 'Private Equity', category: 'economy', tier: 8,
        description: 'Large-scale investment in established companies',
        requirements: { tech_level: 8, prerequisites: ['venture_capital'] },
        cost: 8000000000,
        effects: { taxable_income_boost: 18, land_cost_reduction: 15 },
        unlocks: ['hedge_funds']
    },


    behavioral_economics: {
        id: 'behavioral_economics', name: 'Behavioral Economics', category: 'economy', tier: 9,
        description: 'Understanding psychological factors in economic decisions',
        requirements: { tech_level: 9, prerequisites: ['econometrics'] },
        cost: 10000000000,
        effects: { taxable_income_boost: 29, crime_reduction: 12 },
        unlocks: ['neuroeconomics']
    },

    international_finance: {
        id: 'international_finance', name: 'International Finance', category: 'economy', tier: 9,
        description: 'Complex global financial integration systems',
        requirements: { tech_level: 9, prerequisites: ['macroeconomic_theory'] },
        cost: 12000000000,
        effects: { taxable_income_boost: 20, land_cost_reduction: 15 },
        unlocks: ['financial_derivatives']
    },

    hedge_funds: {
        id: 'hedge_funds', name: 'Hedge Fund Strategies', category: 'economy', tier: 9,
        description: 'Advanced investment strategies using leverage and derivatives',
        requirements: { tech_level: 9, prerequisites: ['private_equity'] },
        cost: 15000000000,
        effects: { infra_upkeep_reduction: 12, infra_cost_reduction: 12 },
        unlocks: ['quantitative_trading']
    },


    financial_derivatives: {
        id: 'financial_derivatives', name: 'Financial Derivatives', category: 'economy', tier: 10,
        description: 'Complex financial instruments for risk management',
        requirements: { tech_level: 10, prerequisites: ['international_finance'] },
        cost: 20000000000,
        effects: { taxable_income_boost: 33, pollution_reduction: 12 },
        unlocks: ['cryptocurrency']
    },

    quantitative_trading: {
        id: 'quantitative_trading', name: 'Quantitative Trading', category: 'economy', tier: 10,
        description: 'Algorithm-based trading using mathematical models',
        requirements: { tech_level: 10, prerequisites: ['hedge_funds'] },
        cost: 30000000000,
        effects: { taxable_income_boost: 35, crime_reduction: 15 },
        unlocks: ['ai_trading']
    },

    neuroeconomics: {
        id: 'neuroeconomics', name: 'Neuroeconomics', category: 'economy', tier: 10,
        description: 'Brain science applied to economic decision-making',
        requirements: { tech_level: 10, prerequisites: ['behavioral_economics'] },
        cost: 40000000000,
        effects: { taxable_income_boost: 37, population_growth_bonus: 3 },
        unlocks: ['cognitive_finance']
    },


    cryptocurrency: {
        id: 'cryptocurrency', name: 'Cryptocurrency Systems', category: 'economy', tier: 11,
        description: 'Digital currencies using blockchain technology',
        requirements: { tech_level: 11, prerequisites: ['financial_derivatives'] },
        cost: 50000000000,
        effects: { infra_upkeep_reduction: 15, infra_cost_reduction: 15 },
        unlocks: ['smart_contracts']
    },

    ai_trading: {
        id: 'ai_trading', name: 'AI Trading Systems', category: 'economy', tier: 11,
        description: 'Artificial intelligence managing investment portfolios',
        requirements: { tech_level: 11, prerequisites: ['quantitative_trading'] },
        cost: 75000000000,
        effects: { taxable_income_boost: 42, pollution_reduction: 15 },
        unlocks: ['quantum_finance']
    },

    cognitive_finance: {
        id: 'cognitive_finance', name: 'Cognitive Finance', category: 'economy', tier: 11,
        description: 'AI systems that understand and predict financial behavior',
        requirements: { tech_level: 11, prerequisites: ['neuroeconomics'] },
        cost: 90000000000,
        effects: { taxable_income_boost: 30, seniors_work_tax_half: 1 },
        unlocks: []
    },


    quantum_finance: {
        id: 'quantum_finance', name: 'Quantum Financial Computing', category: 'economy', tier: 12,
        description: 'Quantum computers solving complex financial optimization',
        requirements: { tech_level: 12, prerequisites: ['ai_trading'] },
        cost: 100000000000,
        effects: { infra_upkeep_reduction: 12, infra_cost_reduction: 15 },
        unlocks: []
    },

    smart_contracts: {
        id: 'smart_contracts', name: 'Smart Contract Economy', category: 'economy', tier: 12,
        description: 'Self-executing contracts with automated enforcement',
        requirements: { tech_level: 12, prerequisites: ['cryptocurrency'] },
        cost: 500000000000,
        effects: { taxable_income_boost: 35, land_cost_reduction: 5 },
        unlocks: []
    },

    post_scarcity_economics: {
        id: 'post_scarcity_economics', name: 'Post-Scarcity Economics', category: 'economy', tier: 12,
        description: 'Economic systems for abundance rather than scarcity',
        requirements: { tech_level: 12, prerequisites: ['cognitive_finance'] },
        cost: 10000000000000,
        effects: { taxable_income_boost: 40, population_boost: 5 },
        unlocks: []
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomyResearch;
} else if (typeof window !== 'undefined') {
    window.EconomyResearch = EconomyResearch;
}
