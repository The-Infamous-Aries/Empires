/**
 * Economy Research Branch - Financial systems, trade, and economic development
 * Progression: Ancient → Classical → Medieval → Renaissance → Industrial → Modern → Contemporary → Information → Advanced → Future
 */

const EconomyResearch = {
    // Tier 1 - Ancient Economic Systems (3000-500 BCE)
    basic_barter: {
        id: 'basic_barter', name: 'Barter System', category: 'economy', tier: 1,
        description: 'Simple exchange of goods and services without currency',
        requirements: { tech_level: 1 },
        time: 24, cost: 25000,
        effects: { trade_efficiency: 5, market_access: 10 },
        unlocks: ['basic_currency', 'simple_accounting']
    },
    
    simple_accounting: {
        id: 'simple_accounting', name: 'Simple Record Keeping', category: 'economy', tier: 1,
        description: 'Basic counting and record systems for trade',
        requirements: { tech_level: 1 },
        time: 36, cost: 30000,
        effects: { tax_efficiency: 3, corruption_resistance: 2 },
        unlocks: ['basic_taxation', 'merchant_guilds']
    },
    
    basic_currency: {
        id: 'basic_currency', name: 'Currency Systems', category: 'economy', tier: 1,
        description: 'Introduction of standardized currency for trade',
        requirements: { tech_level: 1 },
        time: 48, cost: 40000,
        effects: { trade_volume: 15, market_stability: 8 },
        unlocks: ['coinage', 'trade_routes']
    },
    
    // Tier 2 - Classical Economics (500 BCE - 500 CE)
    basic_taxation: {
        id: 'basic_taxation', name: 'Tax Collection', category: 'economy', tier: 2,
        description: 'Organized systems for collecting taxes and tributes',
        requirements: { tech_level: 2, prerequisites: ['simple_accounting'] },
        time: 60, cost: 60000,
        effects: { tax_income: 12, administrative_efficiency: 8 },
        unlocks: ['progressive_taxation']
    },
    
    merchant_guilds: {
        id: 'merchant_guilds', name: 'Merchant Guilds', category: 'economy', tier: 2,
        description: 'Organized trade associations and quality standards',
        requirements: { tech_level: 2, prerequisites: ['simple_accounting'] },
        time: 72, cost: 75000,
        effects: { trade_protection: 10, product_quality: 15, guild_income: 5000 },
        unlocks: ['international_trade']
    },
    
    coinage: {
        id: 'coinage', name: 'Standardized Coinage', category: 'economy', tier: 2,
        description: 'Minted coins with guaranteed weight and purity',
        requirements: { tech_level: 2, prerequisites: ['basic_currency'] },
        time: 54, cost: 65000,
        effects: { currency_stability: 20, counterfeiting_resistance: 15 },
        unlocks: ['banking_houses']
    },
    
    trade_routes: {
        id: 'trade_routes', name: 'Trade Route Networks', category: 'economy', tier: 2,
        description: 'Established pathways for long-distance commerce',
        requirements: { tech_level: 2, prerequisites: ['basic_currency'] },
        time: 84, cost: 80000,
        effects: { international_trade: 25, cultural_exchange: 10, wealth_generation: 8 },
        unlocks: []
    },

    // Tier 3 - Medieval Commerce (500-1000 CE)
    banking_houses: {
        id: 'banking_houses', name: 'Banking Houses', category: 'economy', tier: 3,
        description: 'Early banking institutions for deposits and loans',
        requirements: { tech_level: 3, prerequisites: ['coinage'] },
        time: 96, cost: 120000,
        effects: { credit_availability: 30, investment_capacity: 20, interest_income: 8000 },
        unlocks: ['letters_of_credit', 'commercial_law']
    },
    
    international_trade: {
        id: 'international_trade', name: 'International Commerce', category: 'economy', tier: 3,
        description: 'Complex multi-national trade agreements',
        requirements: { tech_level: 3, prerequisites: ['merchant_guilds'] },
        time: 108, cost: 140000,
        effects: { foreign_income: 25, diplomatic_influence: 15, luxury_goods: 20 },
        unlocks: ['trading_companies']
    },
    
    progressive_taxation: {
        id: 'progressive_taxation', name: 'Progressive Tax Systems', category: 'economy', tier: 3,
        description: 'Tiered taxation based on wealth and income',
        requirements: { tech_level: 3, prerequisites: ['basic_taxation'] },
        time: 90, cost: 110000,
        effects: { tax_fairness: 20, social_stability: 12, revenue_optimization: 18 },
        unlocks: []
    },

    // Tier 4 - Renaissance Finance (1000-1500 CE) - Early Modern Era
    letters_of_credit: {
        id: 'letters_of_credit', name: 'Letters of Credit', category: 'economy', tier: 4,
        description: 'Banking instruments for secure long-distance transactions',
        requirements: { tech_level: 4, prerequisites: ['banking_houses'] },
        time: 120, cost: 180000,
        effects: { trade_security: 35, transaction_efficiency: 25, banking_prestige: 15 },
        unlocks: ['double_entry_bookkeeping', 'insurance_systems']
    },
    
    trading_companies: {
        id: 'trading_companies', name: 'Trading Companies', category: 'economy', tier: 4,
        description: 'Joint-stock companies for large-scale commerce',
        requirements: { tech_level: 4, prerequisites: ['international_trade'] },
        time: 144, cost: 220000,
        effects: { colonial_trade: 40, risk_distribution: 20, corporate_income: 12000 },
        unlocks: ['stock_exchanges']
    },
    
    commercial_law: {
        id: 'commercial_law', name: 'Commercial Law', category: 'economy', tier: 4,
        description: 'Legal frameworks governing business transactions',
        requirements: { tech_level: 4, prerequisites: ['banking_houses'] },
        time: 132, cost: 200000,
        effects: { contract_enforcement: 30, business_confidence: 25, legal_stability: 20 },
        unlocks: []
    },

    // Tier 5 - Industrial Economics (1500-1800) - Modern Era Begins
    double_entry_bookkeeping: {
        id: 'double_entry_bookkeeping', name: 'Double-Entry Bookkeeping', category: 'economy', tier: 5,
        description: 'Advanced accounting systems for accurate financial tracking',
        requirements: { tech_level: 5, prerequisites: ['letters_of_credit'] },
        time: 156, cost: 280000,
        effects: { financial_accuracy: 40, fraud_prevention: 30, business_efficiency: 25 },
        unlocks: ['financial_analysis']
    },
    
    stock_exchanges: {
        id: 'stock_exchanges', name: 'Stock Exchanges', category: 'economy', tier: 5,
        description: 'Organized markets for trading company shares',
        requirements: { tech_level: 5, prerequisites: ['trading_companies'] },
        time: 168, cost: 320000,
        effects: { capital_formation: 45, investment_liquidity: 35, market_efficiency: 30 },
        unlocks: ['central_banking']
    },
    
    insurance_systems: {
        id: 'insurance_systems', name: 'Insurance Systems', category: 'economy', tier: 5,
        description: 'Risk management through pooled insurance funds',
        requirements: { tech_level: 5, prerequisites: ['letters_of_credit'] },
        time: 140, cost: 250000,
        effects: { risk_mitigation: 35, trade_confidence: 25, financial_security: 20 },
        unlocks: []
    },

    // Tier 6 - Industrial Revolution (1800-1900) - Full Modern Era
    central_banking: {
        id: 'central_banking', name: 'Central Banking', category: 'economy', tier: 6,
        description: 'National banks controlling monetary policy',
        requirements: { tech_level: 6, prerequisites: ['stock_exchanges'] },
        time: 192, cost: 400000,
        effects: { monetary_control: 50, inflation_management: 40, currency_stability: 35 },
        unlocks: ['monetary_policy']
    },
    
    financial_analysis: {
        id: 'financial_analysis', name: 'Financial Analysis', category: 'economy', tier: 6,
        description: 'Mathematical analysis of financial data and trends',
        requirements: { tech_level: 6, prerequisites: ['double_entry_bookkeeping'] },
        time: 180, cost: 360000,
        effects: { investment_accuracy: 45, risk_assessment: 35, profit_optimization: 30 },
        unlocks: ['economic_modeling']
    },
    
    industrial_financing: {
        id: 'industrial_financing', name: 'Industrial Financing', category: 'economy', tier: 6,
        description: 'Specialized funding mechanisms for industrial development',
        requirements: { tech_level: 6, prerequisites: ['stock_exchanges', 'insurance_systems'] },
        time: 204, cost: 450000,
        effects: { industrial_growth: 40, infrastructure_funding: 35, technological_advancement: 25 },
        unlocks: ['venture_capital']
    },

    // Tier 7 - Early 20th Century (1900-1945) - Contemporary Era
    monetary_policy: {
        id: 'monetary_policy', name: 'Advanced Monetary Policy', category: 'economy', tier: 7,
        description: 'Sophisticated tools for economic management',
        requirements: { tech_level: 7, prerequisites: ['central_banking'] },
        time: 216, cost: 550000,
        effects: { economic_stability: 55, business_cycle_control: 40, employment_management: 30 },
        unlocks: ['macroeconomic_theory']
    },
    
    economic_modeling: {
        id: 'economic_modeling', name: 'Economic Modeling', category: 'economy', tier: 7,
        description: 'Mathematical models for economic prediction',
        requirements: { tech_level: 7, prerequisites: ['financial_analysis'] },
        time: 228, cost: 600000,
        effects: { forecasting_accuracy: 50, policy_effectiveness: 40, planning_efficiency: 35 },
        unlocks: ['econometrics']
    },
    
    venture_capital: {
        id: 'venture_capital', name: 'Venture Capital', category: 'economy', tier: 7,
        description: 'High-risk investment in innovative enterprises',
        requirements: { tech_level: 7, prerequisites: ['industrial_financing'] },
        time: 240, cost: 650000,
        effects: { innovation_funding: 45, startup_success: 35, technological_commercialization: 40 },
        unlocks: ['private_equity']
    },

    // Tier 8 - Mid 20th Century (1945-1980) - Information Age Beginning
    macroeconomic_theory: {
        id: 'macroeconomic_theory', name: 'Macroeconomic Theory', category: 'economy', tier: 8,
        description: 'Comprehensive understanding of national economic systems',
        requirements: { tech_level: 8, prerequisites: ['monetary_policy'] },
        time: 264, cost: 750000,
        effects: { national_planning: 60, economic_growth_rate: 45, international_competitiveness: 35 },
        unlocks: ['international_finance']
    },
    
    econometrics: {
        id: 'econometrics', name: 'Econometrics', category: 'economy', tier: 8,
        description: 'Statistical analysis of economic relationships',
        requirements: { tech_level: 8, prerequisites: ['economic_modeling'] },
        time: 252, cost: 700000,
        effects: { data_driven_decisions: 55, policy_precision: 45, market_prediction: 40 },
        unlocks: ['behavioral_economics']
    },
    
    private_equity: {
        id: 'private_equity', name: 'Private Equity', category: 'economy', tier: 8,
        description: 'Large-scale investment in established companies',
        requirements: { tech_level: 8, prerequisites: ['venture_capital'] },
        time: 276, cost: 800000,
        effects: { corporate_efficiency: 50, market_consolidation: 40, returns_optimization: 45 },
        unlocks: ['hedge_funds']
    },

    // Tier 9 - Late 20th Century (1980-2000) - Digital Revolution
    behavioral_economics: {
        id: 'behavioral_economics', name: 'Behavioral Economics', category: 'economy', tier: 9,
        description: 'Understanding psychological factors in economic decisions',
        requirements: { tech_level: 9, prerequisites: ['econometrics'] },
        time: 288, cost: 900000,
        effects: { market_psychology: 60, consumer_behavior_prediction: 50, policy_design: 40 },
        unlocks: ['neuroeconomics']
    },
    
    international_finance: {
        id: 'international_finance', name: 'International Finance', category: 'economy', tier: 9,
        description: 'Complex global financial integration systems',
        requirements: { tech_level: 9, prerequisites: ['macroeconomic_theory'] },
        time: 300, cost: 1000000,
        effects: { global_market_access: 65, currency_arbitrage: 45, international_investment: 55 },
        unlocks: ['financial_derivatives']
    },
    
    hedge_funds: {
        id: 'hedge_funds', name: 'Hedge Fund Strategies', category: 'economy', tier: 9,
        description: 'Advanced investment strategies using leverage and derivatives',
        requirements: { tech_level: 9, prerequisites: ['private_equity'] },
        time: 312, cost: 1100000,
        effects: { alternative_returns: 70, risk_adjusted_profits: 55, market_efficiency: 45 },
        unlocks: ['quantitative_trading']
    },

    // Tier 10 - 21st Century (2000-2030) - Advanced Digital Economy
    financial_derivatives: {
        id: 'financial_derivatives', name: 'Financial Derivatives', category: 'economy', tier: 10,
        description: 'Complex financial instruments for risk management',
        requirements: { tech_level: 10, prerequisites: ['international_finance'] },
        time: 324, cost: 1250000,
        effects: { sophisticated_hedging: 75, market_liquidity: 60, price_discovery: 50 },
        unlocks: ['cryptocurrency']
    },
    
    quantitative_trading: {
        id: 'quantitative_trading', name: 'Quantitative Trading', category: 'economy', tier: 10,
        description: 'Algorithm-based trading using mathematical models',
        requirements: { tech_level: 10, prerequisites: ['hedge_funds'] },
        time: 336, cost: 1400000,
        effects: { trading_efficiency: 80, market_making: 65, arbitrage_capture: 55 },
        unlocks: ['ai_trading']
    },
    
    neuroeconomics: {
        id: 'neuroeconomics', name: 'Neuroeconomics', category: 'economy', tier: 10,
        description: 'Brain science applied to economic decision-making',
        requirements: { tech_level: 10, prerequisites: ['behavioral_economics'] },
        time: 348, cost: 1350000,
        effects: { decision_optimization: 70, consumer_insights: 60, policy_effectiveness: 50 },
        unlocks: ['cognitive_finance']
    },

    // Tier 11 - Near Future (2030-2050) - AI-Driven Economy
    cryptocurrency: {
        id: 'cryptocurrency', name: 'Cryptocurrency Systems', category: 'economy', tier: 11,
        description: 'Digital currencies using blockchain technology',
        requirements: { tech_level: 11, prerequisites: ['financial_derivatives'] },
        time: 360, cost: 1600000,
        effects: { digital_payments: 85, financial_inclusion: 70, transaction_efficiency: 60 },
        unlocks: ['smart_contracts']
    },
    
    ai_trading: {
        id: 'ai_trading', name: 'AI Trading Systems', category: 'economy', tier: 11,
        description: 'Artificial intelligence managing investment portfolios',
        requirements: { tech_level: 11, prerequisites: ['quantitative_trading'] },
        time: 372, cost: 1750000,
        effects: { autonomous_trading: 90, pattern_recognition: 75, risk_management: 65 },
        unlocks: ['quantum_finance']
    },
    
    cognitive_finance: {
        id: 'cognitive_finance', name: 'Cognitive Finance', category: 'economy', tier: 11,
        description: 'AI systems that understand and predict financial behavior',
        requirements: { tech_level: 11, prerequisites: ['neuroeconomics'] },
        time: 384, cost: 1650000,
        effects: { behavioral_prediction: 80, personalized_finance: 70, market_sentiment: 60 },
        unlocks: []
    },

    // Tier 12 - Far Future (2050+) - Post-Scarcity Economics
    quantum_finance: {
        id: 'quantum_finance', name: 'Quantum Financial Computing', category: 'economy', tier: 12,
        description: 'Quantum computers solving complex financial optimization',
        requirements: { tech_level: 12, prerequisites: ['ai_trading'] },
        time: 400, cost: 2000000,
        effects: { computational_supremacy: 95, portfolio_optimization: 85, risk_calculation: 75 },
        unlocks: []
    },
    
    smart_contracts: {
        id: 'smart_contracts', name: 'Smart Contract Economy', category: 'economy', tier: 12,
        description: 'Self-executing contracts with automated enforcement',
        requirements: { tech_level: 12, prerequisites: ['cryptocurrency'] },
        time: 420, cost: 2200000,
        effects: { contract_automation: 90, trust_minimization: 80, transaction_costs: -50 },
        unlocks: []
    },
    
    post_scarcity_economics: {
        id: 'post_scarcity_economics', name: 'Post-Scarcity Economics', category: 'economy', tier: 12,
        description: 'Economic systems for abundance rather than scarcity',
        requirements: { tech_level: 12, prerequisites: ['cognitive_finance'] },
        time: 450, cost: 2500000,
        effects: { universal_prosperity: 100, resource_optimization: 90, social_harmony: 75 },
        unlocks: []
    }
};

// Export the research data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomyResearch;
} else if (typeof window !== 'undefined') {
    window.EconomyResearch = EconomyResearch;
}