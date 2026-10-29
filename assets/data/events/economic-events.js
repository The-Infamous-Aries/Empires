/**
 * Economic Events Data - World Events
 * Dominion Wars - Nation Building Strategy Game
 *
 * Comprehensive economic events affecting currencies, interest rates, and
 * economic indicators across all 6 currencies (aurel, velt, krona, drachma,
 * sovereign, talon) and the World Bank loan rate.
 *
 * Each event has: id, name, description, effects.
 * Effects target: currencies (rate, transferRate, interestRate),
 * worldBank (loanRate), and economy indicators (gdpGrowthRate, inflationRate,
 * unemploymentRate, interestRate, exchangeRate, economicIndex).
 *
 * Exactly 1 economic event is always active. Events are pulled randomly on
 * each turn tick (10-20% chance to replace). Currency effects are randomized
 * at spawn time (random currency type and value) so they differ each pull.
 * Effects apply each game turn tick while the event is active.
 *
 * These are WORLD events - no player choices. They affect all nations.
 */

var EconomicEvents = {
    // ════════════════════════════════════════════════════════════════════════════
    // STOCK MARKET (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    stock_market: [
        {
            id: 'bull_market_surge',
            name: 'Bull Market Surge',
            description: 'Global stock markets climb as investor confidence reaches multi-year highs, driving capital inflows across all asset classes.',

            effects: {
                indicators: { gdpGrowthRate: 0.02, economicIndex: 5 }
            }
        },
        {
            id: 'bear_market_decline',
            name: 'Bear Market Decline',
            description: 'Equity markets enter a prolonged downturn as economic uncertainty spreads, erasing trillions in market value.',

            effects: {
                indicators: { gdpGrowthRate: -0.02, economicIndex: -5, unemploymentRate: 0.01 }
            }
        },
        {
            id: 'stock_market_crash',
            name: 'Stock Market Crash',
            description: 'A sudden, sharp drop in equity prices triggers panic selling and widespread margin calls worldwide.',

            effects: {
                indicators: { gdpGrowthRate: -0.03, economicIndex: -10, unemploymentRate: 0.015 },
                currencies: { velt: { rate: -10 }, krona: { rate: -8 } }
            }
        },
        {
            id: 'market_correction',
            name: 'Market Correction',
            description: 'Overvalued assets undergo a healthy correction, stabilizing prices after an extended rally.',

            effects: {
                indicators: { gdpGrowthRate: -0.01, inflationRate: -0.005 }
            }
        },
        {
            id: 'ipo_wave',
            name: 'IPO Wave',
            description: 'Numerous companies go public simultaneously, injecting fresh capital into equity markets.',

            effects: {
                indicators: { gdpGrowthRate: 0.015, economicIndex: 3 },
                currencies: { sovereign: { rate: 5 } }
            }
        },
        {
            id: 'merger_mania',
            name: 'Corporate Merger Wave',
            description: 'Large-scale corporate consolidations reshape entire industries as companies seek scale.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, unemploymentRate: 0.005 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'dividend_bonanza',
            name: 'Dividend Bonanza',
            description: 'Major corporations announce record dividend payments, returning cash to shareholders.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, inflationRate: 0.005 }
            }
        },
        {
            id: 'short_squeeze',
            name: 'Short Squeeze Rally',
            description: 'Heavily shorted stocks spike as short sellers are forced to cover positions at any price.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { talon: { transferRate: 0.5 } }
            }
        },
        {
            id: 'dark_pool_trading',
            name: 'Dark Pool Activity Surge',
            description: 'Off-exchange trading volume rises as institutional investors move large blocks away from public markets.',

            effects: {
                currencies: { krona: { transferRate: -0.2 } },
                indicators: { economicIndex: 1 }
            }
        },
        {
            id: 'algorithmic_trading_glitch',
            name: 'Algorithmic Trading Glitch',
            description: 'A malfunctioning trading algorithm causes flash volatility across multiple equity exchanges.',

            effects: {
                indicators: { economicIndex: -3 },
                currencies: { velt: { transferRate: 1.0 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // BOND MARKET (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    bond_market: [
        {
            id: 'bond_yield_spike',
            name: 'Bond Yield Spike',
            description: 'Government bond yields rise sharply as investors demand higher compensation for sovereign debt risk.',

            effects: {
                indicators: { interestRate: 0.01, economicIndex: -2 },
                currencies: { sovereign: { interestRate: 0.3 } }
            }
        },
        {
            id: 'bond_yield_collapse',
            name: 'Bond Yield Collapse',
            description: 'Bond yields plummet to historic lows as investors flee to safety, driving bond prices up.',

            effects: {
                indicators: { interestRate: -0.01, economicIndex: 2 },
                currencies: { sovereign: { interestRate: -0.3 } }
            }
        },
        {
            id: 'sovereign_debt_downgrade',
            name: 'Sovereign Debt Downgrade',
            description: 'A major credit rating agency downgrades several nations sovereign debt, increasing borrowing costs.',

            effects: {
                indicators: { gdpGrowthRate: -0.01, economicIndex: -5 },
                worldBank: { loanRate: 0.02 },
                currencies: { drachma: { rate: -15 } }
            }
        },
        {
            id: 'sovereign_debt_upgrade',
            name: 'Sovereign Debt Upgrade',
            description: 'Improved credit ratings lower sovereign borrowing costs and boost investor confidence.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 5 },
                worldBank: { loanRate: -0.01 },
                currencies: { aurel: { rate: 8 } }
            }
        },
        {
            id: 'quantitative_easing',
            name: 'Quantitative Easing Program',
            description: 'Central banks begin large-scale bond purchases to inject liquidity into the financial system.',

            effects: {
                indicators: { interestRate: -0.005, inflationRate: 0.005, economicIndex: 3 },
                currencies: { velt: { rate: -5 }, krona: { rate: -5 } }
            }
        },
        {
            id: 'quantitative_tightening',
            name: 'Quantitative Tightening',
            description: 'Central banks reduce bond holdings and withdraw liquidity to combat inflationary pressures.',

            effects: {
                indicators: { interestRate: 0.005, inflationRate: -0.005, economicIndex: -2 },
                currencies: { velt: { rate: 5 }, krona: { rate: 5 } }
            }
        },
        {
            id: 'junk_bond_rally',
            name: 'High-Yield Bond Rally',
            description: 'Investors chase yield in riskier corporate debt, driving up high-yield bond prices.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                currencies: { talon: { rate: 3 } }
            }
        },
        {
            id: 'junk_bond_crash',
            name: 'High-Yield Bond Crash',
            description: 'Risk aversion causes a sell-off in lower-rated corporate debt, widening credit spreads.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -3 },
                currencies: { talon: { rate: -5 } }
            }
        },
        {
            id: 'municipal_bond_crisis',
            name: 'Municipal Bond Distress',
            description: 'Local government bonds face pressure as tax revenues fall and pension obligations mount.',

            effects: {
                indicators: { economicIndex: -4 },
                currencies: { drachma: { transferRate: 0.5 } }
            }
        },
        {
            id: 'inflation_linked_bond_surge',
            name: 'Inflation-Linked Bond Demand',
            description: 'Investors flock to inflation-protected securities as price pressures build.',

            effects: {
                indicators: { inflationRate: 0.005 },
                currencies: { sovereign: { interestRate: 0.2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CURRENCY FOREX (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    currency_forex: [
        {
            id: 'currency_volatility_crisis',
            name: 'Currency Volatility Crisis',
            description: 'Exchange rates fluctuate wildly as global uncertainty drives erratic capital flows.',

            effects: {
                indicators: { exchangeRate: 0.05, economicIndex: -3 },
                currencies: { aurel: { transferRate: 0.5 }, velt: { transferRate: 0.5 } }
            }
        },
        {
            id: 'currency_appreciation',
            name: 'Currency Appreciation',
            description: 'Major currencies strengthen significantly against trading partners, making exports more expensive.',

            effects: {
                indicators: { exchangeRate: -0.03, inflationRate: -0.005 },
                currencies: { aurel: { rate: 10 }, krona: { rate: 8 } }
            }
        },
        {
            id: 'currency_depreciation',
            name: 'Currency Depreciation',
            description: 'National currencies lose value against peers, boosting export competitiveness but raising import costs.',

            effects: {
                indicators: { exchangeRate: 0.03, inflationRate: 0.005 },
                currencies: { aurel: { rate: -10 }, krona: { rate: -8 } }
            }
        },
        {
            id: 'peg_abandonment',
            name: 'Currency Peg Abandonment',
            description: 'A nation abandons its fixed exchange rate, triggering a sharp currency realignment.',

            effects: {
                indicators: { exchangeRate: 0.08, economicIndex: -5 },
                currencies: { drachma: { rate: -20, transferRate: 1.0 } }
            }
        },
        {
            id: 'competitive_devaluation',
            name: 'Competitive Devaluation',
            description: 'Multiple nations devalue their currencies simultaneously to gain export advantages.',

            effects: {
                indicators: { exchangeRate: 0.04, inflationRate: 0.01, economicIndex: -2 },
                currencies: { talon: { rate: -12 }, velt: { rate: -10 } }
            }
        },
        {
            id: 'reserve_currency_shift',
            name: 'Reserve Currency Shift',
            description: 'Central banks diversify foreign exchange reserves away from a dominant currency.',

            effects: {
                indicators: { exchangeRate: 0.02 },
                currencies: { aurel: { rate: -5 }, sovereign: { rate: 8 } }
            }
        },
        {
            id: 'carry_trade_unwind',
            name: 'Carry Trade Unwind',
            description: 'Investors exit carry trade positions as interest rate differentials narrow, causing currency swings.',

            effects: {
                indicators: { exchangeRate: 0.03 },
                currencies: { krona: { rate: -8 }, talon: { rate: 6 } }
            }
        },
        {
            id: 'currency_speculative_attack',
            name: 'Speculative Currency Attack',
            description: 'Currency speculators target a nations currency, forcing rapid devaluation and reserve losses.',

            effects: {
                indicators: { exchangeRate: 0.06, economicIndex: -4 },
                currencies: { drachma: { rate: -25, transferRate: 1.5 } }
            }
        },
        {
            id: 'dollar_strength_surge',
            name: 'Reserve Currency Strength',
            description: 'The primary reserve currency strengthens broadly, putting pressure on emerging market currencies.',

            effects: {
                indicators: { exchangeRate: 0.02, economicIndex: 1 },
                currencies: { aurel: { rate: 15 }, velt: { rate: -5 }, krona: { rate: -5 } }
            }
        },
        {
            id: 'dollar_weakness',
            name: 'Reserve Currency Weakness',
            description: 'The primary reserve currency weakens, lifting other currencies and commodity prices.',

            effects: {
                indicators: { exchangeRate: -0.02, inflationRate: 0.005 },
                currencies: { aurel: { rate: -15 }, velt: { rate: 5 }, krona: { rate: 5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CENTRAL BANK (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    central_bank: [
        {
            id: 'central_bank_rate_hike',
            name: 'Central Bank Rate Hike',
            description: 'The central bank raises its policy interest rate to combat rising inflation.',

            effects: {
                indicators: { interestRate: 0.01, inflationRate: -0.005, gdpGrowthRate: -0.005 },
                worldBank: { loanRate: 0.01 },
                currencies: { sovereign: { interestRate: 0.3, rate: 5 } }
            }
        },
        {
            id: 'central_bank_rate_cut',
            name: 'Central Bank Rate Cut',
            description: 'The central bank lowers its policy rate to stimulate economic growth.',

            effects: {
                indicators: { interestRate: -0.01, gdpGrowthRate: 0.005 },
                worldBank: { loanRate: -0.01 },
                currencies: { sovereign: { interestRate: -0.3, rate: -5 } }
            }
        },
        {
            id: 'central_bank_emergency_meeting',
            name: 'Emergency Central Bank Meeting',
            description: 'An unscheduled central bank meeting signals aggressive policy action in response to market stress.',

            effects: {
                indicators: { economicIndex: -3, exchangeRate: 0.02 },
                currencies: { aurel: { transferRate: 0.5 }, velt: { transferRate: 0.5 } }
            }
        },
        {
            id: 'central_bank_independence_threat',
            name: 'Central Bank Independence Under Threat',
            description: 'Political pressure on central bank autonomy raises concerns about future monetary policy credibility.',

            effects: {
                indicators: { economicIndex: -5, inflationRate: 0.01 },
                currencies: { sovereign: { rate: -10, transferRate: 0.5 } }
            }
        },
        {
            id: 'central_bank_digital_currency',
            name: 'Central Bank Digital Currency Launch',
            description: 'A national digital currency modernizes payment systems and reduces transaction costs.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { velt: { transferRate: -0.5, interestRate: 0.2 } }
            }
        },
        {
            id: 'central_bank_balance_sheet_expansion',
            name: 'Central Bank Balance Sheet Expansion',
            description: 'The central bank expands its asset purchases to support financial market stability.',

            effects: {
                indicators: { interestRate: -0.005, gdpGrowthRate: 0.005 },
                currencies: { krona: { rate: -3 }, talon: { rate: -3 } }
            }
        },
        {
            id: 'central_bank_balance_sheet_reduction',
            name: 'Central Bank Balance Sheet Reduction',
            description: 'The central bank shrinks its holdings to normalize monetary policy after emergency measures.',

            effects: {
                indicators: { interestRate: 0.005, gdpGrowthRate: -0.005 },
                currencies: { krona: { rate: 3 }, talon: { rate: 3 } }
            }
        },
        {
            id: 'central_bank_inflation_target_miss',
            name: 'Inflation Target Miss',
            description: 'Inflation runs persistently above the central bank target, raising expectations of tighter policy.',

            effects: {
                indicators: { inflationRate: 0.01, interestRate: 0.005, economicIndex: -2 }
            }
        },
        {
            id: 'central_bank_deflation_scare',
            name: 'Deflation Scare',
            description: 'Falling prices raise concerns about a deflationary spiral, prompting calls for stimulus.',

            effects: {
                indicators: { inflationRate: -0.01, interestRate: -0.005, gdpGrowthRate: -0.005 }
            }
        },
        {
            id: 'central_bank_coordinated_action',
            name: 'Coordinated Central Bank Action',
            description: 'Multiple central banks act together to provide liquidity and stabilize global markets.',

            effects: {
                indicators: { economicIndex: 4, exchangeRate: -0.02 },
                worldBank: { loanRate: -0.01 },
                currencies: { aurel: { transferRate: -0.3 }, velt: { transferRate: -0.3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // BANKING CRISIS (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    banking_crisis: [
        {
            id: 'banking_sector_crisis',
            name: 'Banking Sector Crisis',
            description: 'Several major banks face liquidity problems, threatening financial system stability.',

            effects: {
                indicators: { gdpGrowthRate: -0.02, economicIndex: -8, unemploymentRate: 0.01 },
                worldBank: { loanRate: 0.02 },
                currencies: { sovereign: { rate: -15, transferRate: 1.0 } }
            }
        },
        {
            id: 'bank_run',
            name: 'Bank Run',
            description: 'Depositors rush to withdraw funds from a troubled bank, threatening its solvency.',

            effects: {
                indicators: { economicIndex: -5 },
                currencies: { drachma: { transferRate: 1.5 }, talon: { rate: -10 } }
            }
        },
        {
            id: 'bank_bailout',
            name: 'Bank Bailout Program',
            description: 'Government injects capital into struggling banks to prevent systemic collapse.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -2 },
                worldBank: { loanRate: 0.005 },
                currencies: { aurel: { rate: -5 } }
            }
        },
        {
            id: 'bank_merger_wave',
            name: 'Banking Sector Consolidation',
            description: 'Major bank mergers create larger, more efficient financial institutions.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'banking_regulatory_tightening',
            name: 'Banking Regulation Tightening',
            description: 'New capital requirements and oversight rules constrain bank lending.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -1 },
                worldBank: { loanRate: 0.005 },
                currencies: { sovereign: { transferRate: 0.3 } }
            }
        },
        {
            id: 'banking_regulatory_relaxation',
            name: 'Banking Deregulation',
            description: 'Eased banking rules expand lending capacity but increase risk exposure.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                worldBank: { loanRate: -0.005 },
                currencies: { krona: { rate: 3 } }
            }
        },
        {
            id: 'non_performing_loan_surge',
            name: 'Non-Performing Loan Surge',
            description: 'Borrowers default on loans at rising rates, pressuring bank balance sheets.',

            effects: {
                indicators: { gdpGrowthRate: -0.01, economicIndex: -4 },
                worldBank: { loanRate: 0.01 },
                currencies: { drachma: { rate: -8 } }
            }
        },
        {
            id: 'liquidity_crunch',
            name: 'Liquidity Crunch',
            description: 'Short-term funding markets freeze as banks hoard cash and restrict lending.',

            effects: {
                indicators: { gdpGrowthRate: -0.01, economicIndex: -5 },
                worldBank: { loanRate: 0.015 },
                currencies: { talon: { rate: -10, transferRate: 0.8 } }
            }
        },
        {
            id: 'bank_profitability_squeeze',
            name: 'Bank Profitability Squeeze',
            description: 'Narrow interest rate margins compress bank profits, limiting lending capacity.',

            effects: {
                indicators: { economicIndex: -2 },
                currencies: { velt: { interestRate: -0.2 } }
            }
        },
        {
            id: 'bank_earnings_boom',
            name: 'Bank Earnings Boom',
            description: 'Strong lending and fee income drive record profits across the banking sector.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { sovereign: { rate: 5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // BANKING BOOM (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    banking_boom: [
        {
            id: 'fintech_revolution',
            name: 'Financial Technology Revolution',
            description: 'Innovative fintech solutions transform banking, payments, and financial services.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 4 },
                currencies: { velt: { transferRate: -0.3, interestRate: 0.1 } }
            }
        },
        {
            id: 'credit_expansion',
            name: 'Credit Market Expansion',
            description: 'Relaxed lending standards increase credit availability across the economy.',

            effects: {
                indicators: { gdpGrowthRate: 0.02, inflationRate: 0.01 },
                worldBank: { loanRate: -0.005 },
                currencies: { aurel: { rate: 5 } }
            }
        },
        {
            id: 'credit_contraction',
            name: 'Credit Contraction',
            description: 'Lenders tighten standards, reducing credit availability for businesses and consumers.',

            effects: {
                indicators: { gdpGrowthRate: -0.015, economicIndex: -4 },
                worldBank: { loanRate: 0.01 },
                currencies: { krona: { rate: -5 } }
            }
        },
        {
            id: 'banking_sector_profits',
            name: 'Banking Profit Surge',
            description: 'Rising interest rates and loan volumes drive exceptional bank profitability.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { sovereign: { rate: 8 } }
            }
        },
        {
            id: 'banking_sector_losses',
            name: 'Banking Loss Wave',
            description: 'Trading losses and bad debts erode bank capital across multiple institutions.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -4 },
                currencies: { velt: { rate: -8 } }
            }
        },
        {
            id: 'deposit_growth_surge',
            name: 'Deposit Growth Surge',
            description: 'Households and businesses park record sums in banks, expanding funding for loans.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                currencies: { aurel: { rate: 3 }, velt: { interestRate: -0.1 } }
            }
        },
        {
            id: 'deposit_flight',
            name: 'Deposit Flight',
            description: 'Funds move out of traditional banks into alternative assets, reducing loanable funds.',

            effects: {
                indicators: { economicIndex: -2 },
                currencies: { talon: { rate: -5 }, krona: { transferRate: 0.3 } }
            }
        },
        {
            id: 'lending_standards_easing',
            name: 'Lending Standards Easing',
            description: 'Banks lower credit requirements, expanding access to mortgages and business loans.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, inflationRate: 0.005 },
                worldBank: { loanRate: -0.005 }
            }
        },
        {
            id: 'lending_standards_tightening',
            name: 'Lending Standards Tightening',
            description: 'Banks raise credit score requirements, restricting loan access.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -2 },
                worldBank: { loanRate: 0.005 }
            }
        },
        {
            id: 'banking_innovation_grant',
            name: 'Banking Innovation Grant',
            description: 'Government funding supports new financial technology and banking infrastructure.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { velt: { transferRate: -0.2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // TRADE WAR (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    trade_war: [
        {
            id: 'trade_war_escalation',
            name: 'Trade War Escalation',
            description: 'Rising tariffs and trade restrictions disrupt international commerce and supply chains.',

            effects: {
                indicators: { gdpGrowthRate: -0.015, inflationRate: 0.01, economicIndex: -5 },
                currencies: { talon: { rate: -5 }, velt: { rate: -5 } }
            }
        },
        {
            id: 'trade_war_deescalation',
            name: 'Trade War De-escalation',
            description: 'Nations roll back tariffs and trade barriers, restoring commercial flows.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, inflationRate: -0.005, economicIndex: 5 },
                currencies: { talon: { rate: 5 }, velt: { rate: 5 } }
            }
        },
        {
            id: 'tariff_imposition',
            name: 'New Tariff Imposition',
            description: 'Import tariffs rise on key goods, raising costs for businesses and consumers.',

            effects: {
                indicators: { inflationRate: 0.005, gdpGrowthRate: -0.005 },
                currencies: { drachma: { transferRate: 0.3 } }
            }
        },
        {
            id: 'tariff_removal',
            name: 'Tariff Removal',
            description: 'Import duties are cut, lowering prices and boosting trade volumes.',

            effects: {
                indicators: { inflationRate: -0.005, gdpGrowthRate: 0.005 },
                currencies: { drachma: { transferRate: -0.3 } }
            }
        },
        {
            id: 'export_ban',
            name: 'Export Ban',
            description: 'A nation restricts exports of critical goods to preserve domestic supply.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -3 },
                currencies: { krona: { rate: -5 } }
            }
        },
        {
            id: 'export_subsidy',
            name: 'Export Subsidy Program',
            description: 'Government support makes domestic goods more competitive in foreign markets.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                currencies: { aurel: { rate: 5 } }
            }
        },
        {
            id: 'import_quota',
            name: 'Import Quota Restriction',
            description: 'Limits on imported goods reduce foreign competition but raise domestic prices.',

            effects: {
                indicators: { inflationRate: 0.005, gdpGrowthRate: -0.005 },
                currencies: { talon: { transferRate: 0.3 } }
            }
        },
        {
            id: 'trade_embargo',
            name: 'Trade Embargo',
            description: 'Comprehensive trade restrictions cut off commerce with targeted nations.',

            effects: {
                indicators: { gdpGrowthRate: -0.01, economicIndex: -6 },
                currencies: { sovereign: { rate: -10 } }
            }
        },
        {
            id: 'trade_sanctions',
            name: 'International Sanctions',
            description: 'Economic sanctions restrict trade and financial flows with sanctioned nations.',

            effects: {
                indicators: { gdpGrowthRate: -0.015, economicIndex: -7 },
                worldBank: { loanRate: 0.015 },
                currencies: { drachma: { rate: -15 } }
            }
        },
        {
            id: 'trade_sanctions_lifted',
            name: 'Sanctions Lifted',
            description: 'Trade restrictions are removed, reopening markets and financial channels.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 6 },
                worldBank: { loanRate: -0.01 },
                currencies: { drachma: { rate: 10 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // TRADE AGREEMENT (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    trade_agreement: [
        {
            id: 'free_trade_agreement',
            name: 'Free Trade Agreement',
            description: 'A comprehensive trade pact eliminates tariffs with major trading partners.',

            effects: {
                indicators: { gdpGrowthRate: 0.02, economicIndex: 5 },
                currencies: { aurel: { rate: 5 }, velt: { rate: 3 } }
            }
        },
        {
            id: 'trade_bloc_formation',
            name: 'Trade Bloc Formation',
            description: 'Regional nations form a trade bloc, deepening economic integration among members.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 4 },
                currencies: { krona: { rate: 5 } }
            }
        },
        {
            id: 'trade_bloc_dissolution',
            name: 'Trade Bloc Dissolution',
            description: 'A regional trade pact collapses, disrupting established commercial relationships.',

            effects: {
                indicators: { gdpGrowthRate: -0.01, economicIndex: -4 },
                currencies: { krona: { rate: -5 } }
            }
        },
        {
            id: 'customs_union',
            name: 'Customs Union Established',
            description: 'Member nations adopt common external tariffs, streamlining cross-border trade.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'trade_facilitation',
            name: 'Trade Facilitation Agreement',
            description: 'Simplified customs procedures reduce border delays and trading costs.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                currencies: { talon: { transferRate: -0.2 } }
            }
        },
        {
            id: 'trade_dispute',
            name: 'Trade Dispute',
            description: 'Nations file complaints over unfair trade practices, threatening retaliatory measures.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -2 },
                currencies: { velt: { rate: -3 } }
            }
        },
        {
            id: 'trade_dispute_resolved',
            name: 'Trade Dispute Resolved',
            description: 'A negotiated settlement removes trade tensions and restores normal commerce.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'wto_membership',
            name: 'WTO Membership Advancement',
            description: 'Improved standing in the global trade body enhances negotiation leverage.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { sovereign: { rate: 5 } }
            }
        },
        {
            id: 'wto_withdrawal',
            name: 'WTO Withdrawal',
            description: 'A major economy exits the global trade organization, weakening multilateral rules.',

            effects: {
                indicators: { gdpGrowthRate: -0.01, economicIndex: -5 },
                currencies: { aurel: { rate: -8 } }
            }
        },
        {
            id: 'regional_trade_corridor',
            name: 'Regional Trade Corridor Opening',
            description: 'New infrastructure creates efficient trade routes between neighboring economies.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 3 },
                currencies: { krona: { rate: 5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // TARIFF POLICY (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    tariff_policy: [
        {
            id: 'tariff_reduction',
            name: 'Multilateral Tariff Reduction',
            description: 'Regional trade partners agree to significant tariff cuts across multiple sectors.',

            effects: {
                indicators: { gdpGrowthRate: 0.015, inflationRate: -0.005 },
                currencies: { aurel: { rate: 5 }, krona: { rate: 3 } }
            }
        },
        {
            id: 'tariff_increase',
            name: 'Tariff Increase',
            description: 'Higher import duties raise government revenue but increase costs for importers.',

            effects: {
                indicators: { inflationRate: 0.005, gdpGrowthRate: -0.005 },
                currencies: { drachma: { rate: 2 } }
            }
        },
        {
            id: 'export_quota_removal',
            name: 'Export Quota Elimination',
            description: 'Removing export quotas opens new markets for domestic producers.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 3 },
                currencies: { talon: { rate: 5 } }
            }
        },
        {
            id: 'export_quota_imposition',
            name: 'Export Quota Imposition',
            description: 'Limits on exports preserve domestic supply but reduce foreign earnings.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -2 },
                currencies: { talon: { rate: -3 } }
            }
        },
        {
            id: 'anti_dumping_duties',
            name: 'Anti-Dumping Duties',
            description: 'New duties protect domestic industries from unfair foreign pricing.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, unemploymentRate: -0.002 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'countervailing_duties',
            name: 'Countervailing Duties',
            description: 'Duties offset foreign government subsidies that distort competition.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 1 },
                currencies: { krona: { rate: 2 } }
            }
        },
        {
            id: 'safeguard_tariffs',
            name: 'Safeguard Tariffs',
            description: 'Temporary tariffs shield domestic industries from import surges.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, inflationRate: 0.002 },
                currencies: { drachma: { rate: 1 } }
            }
        },
        {
            id: 'digital_service_tax',
            name: 'Digital Service Tax',
            description: 'New taxes on digital services raise revenue from tech companies.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -1 },
                currencies: { velt: { rate: -3 } }
            }
        },
        {
            id: 'carbon_border_tax',
            name: 'Carbon Border Adjustment',
            description: 'Import fees based on carbon content reshape trade in energy-intensive goods.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: 0 },
                currencies: { sovereign: { rate: 2 } }
            }
        },
        {
            id: 'trade_credit_expansion',
            name: 'Trade Credit Facility Expansion',
            description: 'Enhanced export financing helps domestic companies compete globally.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 3 },
                worldBank: { loanRate: -0.005 },
                currencies: { aurel: { rate: 5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // COMMODITY PRICES (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    commodity_prices: [
        {
            id: 'commodity_boom',
            name: 'Commodity Price Boom',
            description: 'Raw material prices surge due to global supply constraints.',

            effects: {
                indicators: { inflationRate: 0.015, gdpGrowthRate: 0.01 },
                currencies: { krona: { rate: 8 } }
            }
        },
        {
            id: 'commodity_bust',
            name: 'Commodity Price Bust',
            description: 'Falling commodity prices hurt resource exporters and lower inflation.',

            effects: {
                indicators: { inflationRate: -0.01, gdpGrowthRate: -0.005 },
                currencies: { krona: { rate: -8 }, talon: { rate: -5 } }
            }
        },
        {
            id: 'metals_price_surge',
            name: 'Industrial Metals Rally',
            description: 'Copper, aluminum, and steel prices climb as industrial demand strengthens.',

            effects: {
                indicators: { inflationRate: 0.008, gdpGrowthRate: 0.005 },
                currencies: { talon: { rate: 6 } }
            }
        },
        {
            id: 'metals_price_crash',
            name: 'Industrial Metals Decline',
            description: 'Weak manufacturing demand drives industrial metal prices lower.',

            effects: {
                indicators: { inflationRate: -0.005, gdpGrowthRate: -0.003 },
                currencies: { talon: { rate: -6 } }
            }
        },
        {
            id: 'agricultural_commodity_spike',
            name: 'Agricultural Commodity Spike',
            description: 'Weather disruptions push grain and soft commodity prices higher.',

            effects: {
                indicators: { inflationRate: 0.01, economicIndex: -1 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'agricultural_commodity_drop',
            name: 'Agricultural Commodity Drop',
            description: 'Bumper harvests push food and crop prices lower.',

            effects: {
                indicators: { inflationRate: -0.008, economicIndex: 1 },
                currencies: { aurel: { rate: -3 } }
            }
        },
        {
            id: 'precious_metals_rally',
            name: 'Precious Metals Rally',
            description: 'Gold and silver prices rise as investors seek safe-haven assets.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { sovereign: { rate: 5 } }
            }
        },
        {
            id: 'precious_metals_decline',
            name: 'Precious Metals Decline',
            description: 'Improved risk appetite reduces demand for gold and silver.',

            effects: {
                indicators: { economicIndex: -1 },
                currencies: { sovereign: { rate: -5 } }
            }
        },
        {
            id: 'commodity_supply_disruption',
            name: 'Commodity Supply Disruption',
            description: 'Logistics and production issues interrupt global commodity flows.',

            effects: {
                indicators: { inflationRate: 0.008, gdpGrowthRate: -0.005 },
                currencies: { drachma: { transferRate: 0.4 } }
            }
        },
        {
            id: 'commodity_supply_glut',
            name: 'Commodity Supply Glut',
            description: 'Oversupply depresses commodity prices across energy, metals, and agriculture.',

            effects: {
                indicators: { inflationRate: -0.008, gdpGrowthRate: -0.003 },
                currencies: { krona: { rate: -5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // REAL ESTATE (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    real_estate: [
        {
            id: 'real_estate_bubble',
            name: 'Real Estate Bubble',
            description: 'Property prices rise rapidly, creating wealth but raising affordability concerns.',

            effects: {
                indicators: { inflationRate: 0.02, gdpGrowthRate: 0.015 },
                currencies: { aurel: { rate: 5 } }
            }
        },
        {
            id: 'real_estate_crash',
            name: 'Real Estate Crash',
            description: 'Property prices collapse, erasing household wealth and triggering bank losses.',

            effects: {
                indicators: { gdpGrowthRate: -0.02, economicIndex: -8, unemploymentRate: 0.01 },
                worldBank: { loanRate: 0.01 },
                currencies: { sovereign: { rate: -10 } }
            }
        },
        {
            id: 'housing_boom',
            name: 'Housing Construction Boom',
            description: 'Strong demand and low rates spur a wave of residential construction.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 3 },
                currencies: { krona: { rate: 5 } }
            }
        },
        {
            id: 'housing_bust',
            name: 'Housing Market Bust',
            description: 'Falling home sales and prices drag on construction and related industries.',

            effects: {
                indicators: { gdpGrowthRate: -0.008, economicIndex: -4 },
                currencies: { krona: { rate: -5 } }
            }
        },
        {
            id: 'commercial_real_estate_boom',
            name: 'Commercial Real Estate Boom',
            description: 'Office, retail, and industrial property values climb on strong business demand.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, economicIndex: 3 },
                currencies: { velt: { rate: 5 } }
            }
        },
        {
            id: 'commercial_real_estate_crisis',
            name: 'Commercial Real Estate Crisis',
            description: 'Remote work and online shopping depress office and retail property values.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -4 },
                currencies: { velt: { rate: -5 } }
            }
        },
        {
            id: 'mortgage_rate_rise',
            name: 'Mortgage Rate Increase',
            description: 'Higher home loan rates cool housing demand and slow construction.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -2 },
                worldBank: { loanRate: 0.005 },
                currencies: { sovereign: { interestRate: 0.2 } }
            }
        },
        {
            id: 'mortgage_rate_fall',
            name: 'Mortgage Rate Decrease',
            description: 'Lower home loan rates stimulate housing demand and construction.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { interestRate: -0.2 } }
            }
        },
        {
            id: 'property_tax_increase',
            name: 'Property Tax Increase',
            description: 'Higher property taxes raise holding costs for real estate owners.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -1 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'property_tax_cut',
            name: 'Property Tax Cut',
            description: 'Lower property taxes reduce ownership costs and support values.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 1 },
                currencies: { aurel: { rate: 2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTION (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    construction: [
        {
            id: 'infrastructure_spending_surge',
            name: 'Infrastructure Spending Surge',
            description: 'Government launches major infrastructure projects, boosting construction demand.',

            effects: {
                indicators: { gdpGrowthRate: 0.015, economicIndex: 5 },
                currencies: { aurel: { rate: 5 } }
            }
        },
        {
            id: 'infrastructure_spending_cut',
            name: 'Infrastructure Spending Cut',
            description: 'Reduced public works funding slows construction and related industries.',

            effects: {
                indicators: { gdpGrowthRate: -0.008, economicIndex: -3 },
                currencies: { aurel: { rate: -3 } }
            }
        },
        {
            id: 'construction_labor_shortage',
            name: 'Construction Labor Shortage',
            description: 'Skilled worker scarcity delays projects and raises building costs.',

            effects: {
                indicators: { unemploymentRate: -0.005, inflationRate: 0.005, economicIndex: -2 },
                currencies: { krona: { transferRate: 0.3 } }
            }
        },
        {
            id: 'construction_material_cost_rise',
            name: 'Construction Material Cost Rise',
            description: 'Lumber, steel, and concrete prices increase, raising project costs.',

            effects: {
                indicators: { inflationRate: 0.005, gdpGrowthRate: -0.003 },
                currencies: { talon: { rate: 3 } }
            }
        },
        {
            id: 'construction_material_cost_drop',
            name: 'Construction Material Cost Drop',
            description: 'Falling building material costs make construction more affordable.',

            effects: {
                indicators: { inflationRate: -0.005, gdpGrowthRate: 0.003 },
                currencies: { talon: { rate: -3 } }
            }
        },
        {
            id: 'building_permit_streamlining',
            name: 'Building Permit Streamlining',
            description: 'Faster approvals reduce delays and lower development costs.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                currencies: { aurel: { rate: 2 } }
            }
        },
        {
            id: 'zoning_deregulation',
            name: 'Zoning Deregulation',
            description: 'Relaxed land-use rules allow more dense development and housing supply.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 4 },
                currencies: { krona: { rate: 5 } }
            }
        },
        {
            id: 'zoning_restriction',
            name: 'Zoning Restriction',
            description: 'Tighter land-use rules limit new construction and restrict supply.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, inflationRate: 0.003 },
                currencies: { krona: { rate: -3 } }
            }
        },
        {
            id: 'public_private_partnership',
            name: 'Public-Private Partnership Deal',
            description: 'Private capital funds public infrastructure, reducing government borrowing needs.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                worldBank: { loanRate: -0.005 }
            }
        },
        {
            id: 'construction_giant_bankruptcy',
            name: 'Construction Firm Bankruptcy',
            description: 'A major builder collapses, leaving unfinished projects and unpaid subcontractors.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -3 },
                currencies: { velt: { rate: -5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // MANUFACTURING (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    manufacturing: [
        {
            id: 'manufacturing_automation',
            name: 'Manufacturing Automation Wave',
            description: 'Widespread adoption of automation technologies transforms production.',

            effects: {
                indicators: { gdpGrowthRate: 0.02, unemploymentRate: 0.01 },
                currencies: { velt: { rate: 5 } }
            }
        },
        {
            id: 'manufacturing_reshoring',
            name: 'Manufacturing Reshoring',
            description: 'Companies move production back from overseas to domestic facilities.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, unemploymentRate: -0.01 },
                currencies: { aurel: { rate: 5 } }
            }
        },
        {
            id: 'manufacturing_offshoring',
            name: 'Manufacturing Offshoring',
            description: 'Production shifts overseas to lower-cost locations.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, unemploymentRate: 0.005 },
                currencies: { aurel: { rate: -3 } }
            }
        },
        {
            id: 'factory_closure_wave',
            name: 'Factory Closure Wave',
            description: 'Global competition forces closure of outdated manufacturing plants.',

            effects: {
                indicators: { gdpGrowthRate: -0.01, unemploymentRate: 0.015 },
                currencies: { krona: { rate: -5 } }
            }
        },
        {
            id: 'industrial_production_rise',
            name: 'Industrial Production Rise',
            description: 'Factory output climbs as demand for manufactured goods strengthens.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 4 },
                currencies: { talon: { rate: 5 } }
            }
        },
        {
            id: 'industrial_production_drop',
            name: 'Industrial Production Drop',
            description: 'Weak demand causes factory output to contract.',

            effects: {
                indicators: { gdpGrowthRate: -0.01, economicIndex: -4 },
                currencies: { talon: { rate: -5 } }
            }
        },
        {
            id: 'supply_chain_disruption',
            name: 'Supply Chain Disruption',
            description: 'Logistics bottlenecks interrupt manufacturing input deliveries.',

            effects: {
                indicators: { gdpGrowthRate: -0.008, inflationRate: 0.005 },
                currencies: { krona: { transferRate: 0.4 } }
            }
        },
        {
            id: 'supply_chain_resilience',
            name: 'Supply Chain Resilience Initiative',
            description: 'Domestic supply chain strengthening reduces foreign dependency.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'industrial_cluster_development',
            name: 'Industrial Cluster Development',
            description: 'Specialized industrial zones create synergies and efficiency gains.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, unemploymentRate: -0.008 },
                currencies: { krona: { rate: 6 } }
            }
        },
        {
            id: 'manufacturing_innovation_hub',
            name: 'Manufacturing Innovation Hub',
            description: 'New R&D centers drive advances in production technology.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 4 },
                currencies: { velt: { rate: 4 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INDUSTRY AUTOMATION (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    industry_automation: [
        {
            id: 'robotics_adoption',
            name: 'Robotics Adoption Surge',
            description: 'Industrial robots spread across factories, raising productivity and displacing labor.',

            effects: {
                indicators: { gdpGrowthRate: 0.015, unemploymentRate: 0.008 },
                currencies: { velt: { rate: 6 } }
            }
        },
        {
            id: 'ai_in_manufacturing',
            name: 'AI in Manufacturing',
            description: 'Artificial intelligence optimizes production schedules and quality control.',

            effects: {
                indicators: { gdpGrowthRate: 0.02, economicIndex: 5 },
                currencies: { velt: { rate: 8 } }
            }
        },
        {
            id: 'automation_job_displacement',
            name: 'Automation Job Displacement',
            description: 'Rapid automation displaces workers faster than new roles emerge.',

            effects: {
                indicators: { unemploymentRate: 0.02, gdpGrowthRate: 0.01 },
                currencies: { talon: { rate: -3 } }
            }
        },
        {
            id: 'lights_out_factory',
            name: 'Lights-Out Factory Expansion',
            description: 'Fully automated facilities operate around the clock with minimal staffing.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 3 },
                currencies: { krona: { rate: 5 } }
            }
        },
        {
            id: '3d_printing_revolution',
            name: '3D Printing Revolution',
            description: 'Additive manufacturing enables on-demand production and reduces inventory needs.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, economicIndex: 3 },
                currencies: { talon: { rate: 4 } }
            }
        },
        {
            id: 'industrial_iot_deployment',
            name: 'Industrial IoT Deployment',
            description: 'Connected sensors and devices improve equipment monitoring and maintenance.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                currencies: { velt: { transferRate: -0.2 } }
            }
        },
        {
            id: 'predictive_maintenance',
            name: 'Predictive Maintenance Program',
            description: 'Data-driven maintenance reduces unplanned downtime and extends equipment life.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 2 },
                currencies: { krona: { rate: 3 } }
            }
        },
        {
            id: 'dark_factory',
            name: 'Dark Factory Initiative',
            description: 'Fully automated production runs without human presence or lighting.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, unemploymentRate: 0.005 },
                currencies: { sovereign: { rate: 4 } }
            }
        },
        {
            id: 'automation_tax',
            name: 'Automation Tax',
            description: 'New levies on automated systems slow adoption but fund worker retraining.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -1 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'automation_subsidy',
            name: 'Automation Subsidy',
            description: 'Government grants help firms invest in robotics and AI equipment.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { velt: { rate: 3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // ENERGY MARKET (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    energy_market: [
        {
            id: 'energy_cost_spike',
            name: 'Energy Cost Spike',
            description: 'Rapidly rising energy costs squeeze industrial profit margins.',

            effects: {
                indicators: { inflationRate: 0.01, gdpGrowthRate: -0.008 },
                currencies: { talon: { rate: 8 } }
            }
        },
        {
            id: 'energy_cost_drop',
            name: 'Energy Cost Drop',
            description: 'Falling energy prices reduce costs for households and businesses.',

            effects: {
                indicators: { inflationRate: -0.008, gdpGrowthRate: 0.005 },
                currencies: { talon: { rate: -8 } }
            }
        },
        {
            id: 'oil_price_surge',
            name: 'Oil Price Surge',
            description: 'Geopolitical tensions drive crude oil prices sharply higher.',

            effects: {
                indicators: { inflationRate: 0.012, gdpGrowthRate: -0.005 },
                currencies: { krona: { rate: 10 } }
            }
        },
        {
            id: 'oil_price_crash',
            name: 'Oil Price Crash',
            description: 'Oversupply and weak demand send crude oil prices tumbling.',

            effects: {
                indicators: { inflationRate: -0.008, gdpGrowthRate: 0.002 },
                currencies: { krona: { rate: -10 } }
            }
        },
        {
            id: 'natural_gas_crisis',
            name: 'Natural Gas Crisis',
            description: 'Supply constraints cause natural gas prices to spike, affecting heating and power.',

            effects: {
                indicators: { inflationRate: 0.008, economicIndex: -3 },
                currencies: { drachma: { rate: -5 } }
            }
        },
        {
            id: 'renewable_energy_boom',
            name: 'Renewable Energy Boom',
            description: 'Wind, solar, and battery capacity expands rapidly as costs fall.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, economicIndex: 4 },
                currencies: { velt: { rate: 6 } }
            }
        },
        {
            id: 'nuclear_power_expansion',
            name: 'Nuclear Power Expansion',
            description: 'New reactor construction provides stable, low-carbon baseload power.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { sovereign: { rate: 4 } }
            }
        },
        {
            id: 'power_grid_failure',
            name: 'Power Grid Failure',
            description: 'A major grid outage disrupts industry and commerce across a wide region.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -6 },
                currencies: { talon: { transferRate: 1.0 } }
            }
        },
        {
            id: 'energy_subsidy',
            name: 'Energy Subsidy Program',
            description: 'Government support lowers household and business energy bills.',

            effects: {
                indicators: { inflationRate: -0.005, gdpGrowthRate: 0.002 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'energy_tax',
            name: 'Energy Tax Increase',
            description: 'Higher taxes on fossil fuels raise prices to encourage conservation.',

            effects: {
                indicators: { inflationRate: 0.003, gdpGrowthRate: -0.002 },
                currencies: { krona: { rate: 2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // OIL PRICES (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    oil_prices: [
        {
            id: 'opec_production_cut',
            name: 'OPEC Production Cut',
            description: 'Oil-producing nations reduce output to support prices.',

            effects: {
                indicators: { inflationRate: 0.005, gdpGrowthRate: -0.003 },
                currencies: { krona: { rate: 8 } }
            }
        },
        {
            id: 'opec_production_increase',
            name: 'OPEC Production Increase',
            description: 'Oil-producing nations boost output to cool prices.',

            effects: {
                indicators: { inflationRate: -0.003, gdpGrowthRate: 0.002 },
                currencies: { krona: { rate: -8 } }
            }
        },
        {
            id: 'strategic_petroleum_release',
            name: 'Strategic Petroleum Release',
            description: 'Governments release oil from reserves to moderate prices.',

            effects: {
                indicators: { inflationRate: -0.004, economicIndex: 2 },
                currencies: { krona: { rate: -4 } }
            }
        },
        {
            id: 'strategic_petroleum_refill',
            name: 'Strategic Petroleum Refill',
            description: 'Governments replenish oil reserves, adding demand to markets.',

            effects: {
                indicators: { inflationRate: 0.002, economicIndex: -1 },
                currencies: { krona: { rate: 4 } }
            }
        },
        {
            id: 'oil_tanker_blockade',
            name: 'Oil Tanker Blockade',
            description: 'Shipping lane disruptions interrupt crude oil deliveries.',

            effects: {
                indicators: { inflationRate: 0.008, economicIndex: -4 },
                currencies: { talon: { transferRate: 0.8 } }
            }
        },
        {
            id: 'pipeline_shutdown',
            name: 'Pipeline Shutdown',
            description: 'A major pipeline closure interrupts regional oil and gas supplies.',

            effects: {
                indicators: { inflationRate: 0.005, economicIndex: -3 },
                currencies: { drachma: { rate: -4 } }
            }
        },
        {
            id: 'refinery_outage',
            name: 'Refinery Outage',
            description: 'Multiple refinery closures reduce gasoline and diesel output.',

            effects: {
                indicators: { inflationRate: 0.006, economicIndex: -2 },
                currencies: { talon: { rate: -3 } }
            }
        },
        {
            id: 'oil_demand_surge',
            name: 'Oil Demand Surge',
            description: 'Strong economic growth and travel push oil consumption higher.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, inflationRate: 0.004 },
                currencies: { krona: { rate: 6 } }
            }
        },
        {
            id: 'oil_demand_collapse',
            name: 'Oil Demand Collapse',
            description: 'Economic weakness and efficiency gains reduce oil consumption.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, inflationRate: -0.003 },
                currencies: { krona: { rate: -6 } }
            }
        },
        {
            id: 'shale_oil_boom',
            name: 'Shale Oil Boom',
            description: 'Hydraulic fracturing unlocks new domestic oil production.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, inflationRate: -0.002 },
                currencies: { aurel: { rate: 4 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // AGRICULTURE (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    agriculture: [
        {
            id: 'agricultural_boom',
            name: 'Agricultural Boom',
            description: 'Strong crop yields and prices boost farm incomes and rural economies.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { aurel: { rate: 4 } }
            }
        },
        {
            id: 'agricultural_bust',
            name: 'Agricultural Bust',
            description: 'Falling crop prices and poor yields strain farm finances.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -2 },
                currencies: { aurel: { rate: -4 } }
            }
        },
        {
            id: 'drought_impact',
            name: 'Drought Impact',
            description: 'Extended dry weather reduces crop output and raises food prices.',

            effects: {
                indicators: { inflationRate: 0.008, gdpGrowthRate: -0.005 },
                currencies: { talon: { rate: 3 } }
            }
        },
        {
            id: 'flood_damage',
            name: 'Flood Damage',
            description: 'Severe flooding destroys crops and damages farm infrastructure.',

            effects: {
                indicators: { gdpGrowthRate: -0.004, inflationRate: 0.004 },
                currencies: { krona: { rate: -3 } }
            }
        },
        {
            id: 'pest_outbreak',
            name: 'Pest Outbreak',
            description: 'Insect infestations damage crops across major growing regions.',

            effects: {
                indicators: { inflationRate: 0.005, gdpGrowthRate: -0.003 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'farm_subsidy_expansion',
            name: 'Farm Subsidy Expansion',
            description: 'Increased government support stabilizes farm incomes.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 1 },
                currencies: { aurel: { rate: -1 } }
            }
        },
        {
            id: 'farm_subsidy_cut',
            name: 'Farm Subsidy Cut',
            description: 'Reduced government support pressures farm profitability.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -1 },
                currencies: { aurel: { rate: 1 } }
            }
        },
        {
            id: 'food_price_inflation',
            name: 'Food Price Inflation',
            description: 'Rising food costs pressure household budgets and overall inflation.',

            effects: {
                indicators: { inflationRate: 0.01, economicIndex: -2 },
                currencies: { talon: { rate: 3 } }
            }
        },
        {
            id: 'food_price_deflation',
            name: 'Food Price Deflation',
            description: 'Falling food prices ease inflation but strain farm revenues.',

            effects: {
                indicators: { inflationRate: -0.008, economicIndex: 1 },
                currencies: { talon: { rate: -3 } }
            }
        },
        {
            id: 'agricultural_export_surge',
            name: 'Agricultural Export Surge',
            description: 'Global demand for farm products lifts exports and rural incomes.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { krona: { rate: 5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // FOOD PRICES (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    food_prices: [
        {
            id: 'grain_price_spike',
            name: 'Grain Price Spike',
            description: 'Wheat, corn, and rice prices jump as supplies tighten.',

            effects: {
                indicators: { inflationRate: 0.006, economicIndex: -1 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'grain_price_drop',
            name: 'Grain Price Drop',
            description: 'Bumper harvests push grain prices lower.',

            effects: {
                indicators: { inflationRate: -0.004, economicIndex: 1 },
                currencies: { aurel: { rate: -3 } }
            }
        },
        {
            id: 'meat_price_surge',
            name: 'Meat Price Surge',
            description: 'Livestock disease and feed costs drive meat prices higher.',

            effects: {
                indicators: { inflationRate: 0.005, economicIndex: -1 },
                currencies: { talon: { rate: 4 } }
            }
        },
        {
            id: 'meat_price_drop',
            name: 'Meat Price Drop',
            description: 'Increased supply and lower feed costs reduce meat prices.',

            effects: {
                indicators: { inflationRate: -0.003, economicIndex: 1 },
                currencies: { talon: { rate: -4 } }
            }
        },
        {
            id: 'dairy_price_spike',
            name: 'Dairy Price Spike',
            description: 'Milk and cheese prices rise as production costs increase.',

            effects: {
                indicators: { inflationRate: 0.003 },
                currencies: { velt: { rate: 2 } }
            }
        },
        {
            id: 'dairy_price_drop',
            name: 'Dairy Price Drop',
            description: 'Oversupply pushes milk and butter prices lower.',

            effects: {
                indicators: { inflationRate: -0.002 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'edible_oil_price_surge',
            name: 'Edible Oil Price Surge',
            description: 'Cooking oil prices climb on supply constraints and biofuel demand.',

            effects: {
                indicators: { inflationRate: 0.004 },
                currencies: { krona: { rate: 3 } }
            }
        },
        {
            id: 'edible_oil_price_drop',
            name: 'Edible Oil Price Drop',
            description: 'Increased production pushes vegetable oil prices lower.',

            effects: {
                indicators: { inflationRate: -0.002 },
                currencies: { krona: { rate: -3 } }
            }
        },
        {
            id: 'sugar_price_spike',
            name: 'Sugar Price Spike',
            description: 'Weather damage to sugar cane crops pushes sweetener prices up.',

            effects: {
                indicators: { inflationRate: 0.002 },
                currencies: { talon: { rate: 2 } }
            }
        },
        {
            id: 'sugar_price_drop',
            name: 'Sugar Price Drop',
            description: 'Strong harvests bring sugar prices back down.',

            effects: {
                indicators: { inflationRate: -0.001 },
                currencies: { talon: { rate: -2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // LABOR MARKET (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    labor_market: [
        {
            id: 'labor_shortage',
            name: 'Labor Shortage',
            description: 'Tight labor markets make hiring difficult across multiple sectors.',

            effects: {
                indicators: { unemploymentRate: -0.01, inflationRate: 0.005, economicIndex: -2 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'labor_surplus',
            name: 'Labor Surplus',
            description: 'High unemployment gives employers ample choice of workers.',

            effects: {
                indicators: { unemploymentRate: 0.01, inflationRate: -0.003 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'skilled_worker_shortage',
            name: 'Skilled Worker Shortage',
            description: 'Lack of qualified technicians and professionals constrains growth.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, inflationRate: 0.003 },
                currencies: { velt: { rate: 4 } }
            }
        },
        {
            id: 'unskilled_labor_surplus',
            name: 'Unskilled Labor Surplus',
            description: 'Abundant entry-level workers keep wages low for basic roles.',

            effects: {
                indicators: { unemploymentRate: 0.005, inflationRate: -0.002 },
                currencies: { talon: { rate: -2 } }
            }
        },
        {
            id: 'labor_force_participation_rise',
            name: 'Labor Force Participation Rise',
            description: 'More people enter the workforce, expanding productive capacity.',

            effects: {
                indicators: { unemploymentRate: -0.005, gdpGrowthRate: 0.005 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'labor_force_participation_drop',
            name: 'Labor Force Participation Drop',
            description: 'Discouraged workers leave the workforce, shrinking the labor pool.',

            effects: {
                indicators: { unemploymentRate: 0.003, gdpGrowthRate: -0.003 },
                currencies: { sovereign: { rate: -3 } }
            }
        },
        {
            id: 'gig_economy_expansion',
            name: 'Gig Economy Expansion',
            description: 'Freelance and contract work grows, offering flexibility but less stability.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 2 },
                currencies: { velt: { transferRate: -0.1 } }
            }
        },
        {
            id: 'gig_economy_contraction',
            name: 'Gig Economy Contraction',
            description: 'Freelance work declines as companies hire more permanent staff.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { velt: { transferRate: 0.1 } }
            }
        },
        {
            id: 'labor_union_strengthening',
            name: 'Labor Union Strengthening',
            description: 'Unions win better wages and conditions, raising labor costs.',

            effects: {
                indicators: { inflationRate: 0.003, gdpGrowthRate: -0.001 },
                currencies: { talon: { rate: 2 } }
            }
        },
        {
            id: 'labor_union_weakening',
            name: 'Labor Union Weakening',
            description: 'Declining union membership reduces wage pressure.',

            effects: {
                indicators: { inflationRate: -0.002, gdpGrowthRate: 0.001 },
                currencies: { talon: { rate: -2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // WAGES (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    wages: [
        {
            id: 'wage_growth_surge',
            name: 'Wage Growth Surge',
            description: 'Rapid pay increases boost household income and consumer spending.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, inflationRate: 0.004 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'wage_stagnation',
            name: 'Wage Stagnation',
            description: 'Flat paychecks limit household purchasing power.',

            effects: {
                indicators: { gdpGrowthRate: -0.004, inflationRate: -0.002 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'minimum_wage_increase',
            name: 'Minimum Wage Increase',
            description: 'Higher pay floors lift low-income workers but raise business costs.',

            effects: {
                indicators: { inflationRate: 0.002, gdpGrowthRate: -0.001 },
                currencies: { talon: { rate: 1 } }
            }
        },
        {
            id: 'minimum_wage_freeze',
            name: 'Minimum Wage Freeze',
            description: 'Pay floors remain unchanged, keeping business costs steady.',

            effects: {
                indicators: { inflationRate: -0.001 },
                currencies: { talon: { rate: -1 } }
            }
        },
        {
            id: 'executive_pay_surge',
            name: 'Executive Pay Surge',
            description: 'CEO and executive compensation rises sharply amid strong corporate profits.',

            effects: {
                indicators: { economicIndex: 1 },
                currencies: { sovereign: { rate: 2 } }
            }
        },
        {
            id: 'executive_pay_cut',
            name: 'Executive Pay Cut',
            description: 'Reduced top-level compensation follows poor corporate performance.',

            effects: {
                indicators: { economicIndex: -1 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'bonus_season_boom',
            name: 'Bonus Season Boom',
            description: 'Strong year-end bonuses boost consumer spending and confidence.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 3 },
                currencies: { velt: { rate: 2 } }
            }
        },
        {
            id: 'bonus_season_bust',
            name: 'Bonus Season Bust',
            description: 'Reduced or eliminated bonuses dampen consumer spending.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -2 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'wage_price_spiral',
            name: 'Wage-Price Spiral',
            description: 'Rising wages and prices feed each other, accelerating inflation.',

            effects: {
                indicators: { inflationRate: 0.01, economicIndex: -4 },
                currencies: { sovereign: { interestRate: 0.2 } }
            }
        },
        {
            id: 'real_wage_growth',
            name: 'Real Wage Growth',
            description: 'Pay increases outpace inflation, raising purchasing power.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { aurel: { rate: 4 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // UNEMPLOYMENT (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    unemployment: [
        {
            id: 'unemployment_rate_rise',
            name: 'Unemployment Rate Rise',
            description: 'Job losses mount as economic activity slows.',

            effects: {
                indicators: { unemploymentRate: 0.01, gdpGrowthRate: -0.005, economicIndex: -4 },
                currencies: { aurel: { rate: -3 } }
            }
        },
        {
            id: 'unemployment_rate_fall',
            name: 'Unemployment Rate Fall',
            description: 'Hiring picks up as businesses expand.',

            effects: {
                indicators: { unemploymentRate: -0.01, gdpGrowthRate: 0.005, economicIndex: 4 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'long_term_unemployment_rise',
            name: 'Long-Term Unemployment Rise',
            description: 'More workers remain jobless for extended periods, eroding skills.',

            effects: {
                indicators: { unemploymentRate: 0.005, gdpGrowthRate: -0.003 },
                currencies: { talon: { rate: -2 } }
            }
        },
        {
            id: 'youth_unemployment_crisis',
            name: 'Youth Unemployment Crisis',
            description: 'Young workers struggle to find their first jobs.',

            effects: {
                indicators: { unemploymentRate: 0.005, economicIndex: -3 },
                currencies: { velt: { rate: -3 } }
            }
        },
        {
            id: 'job_gain_surge',
            name: 'Job Gain Surge',
            description: 'Employers add jobs at a rapid pace across multiple sectors.',

            effects: {
                indicators: { unemploymentRate: -0.008, gdpGrowthRate: 0.008 },
                currencies: { krona: { rate: 5 } }
            }
        },
        {
            id: 'job_loss_wave',
            name: 'Job Loss Wave',
            description: 'Layoffs spread across industries as demand weakens.',

            effects: {
                indicators: { unemploymentRate: 0.008, gdpGrowthRate: -0.008 },
                currencies: { krona: { rate: -5 } }
            }
        },
        {
            id: 'discouraged_worker_rise',
            name: 'Discouraged Worker Rise',
            description: 'Job seekers stop looking, dropping out of the labor force.',

            effects: {
                indicators: { economicIndex: -2 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'reentry_program',
            name: 'Workforce Reentry Program',
            description: 'Training and placement help long-unemployed workers return to jobs.',

            effects: {
                indicators: { unemploymentRate: -0.003, gdpGrowthRate: 0.002 },
                currencies: { aurel: { rate: 2 } }
            }
        },
        {
            id: 'automation_unemployment',
            name: 'Automation-Driven Unemployment',
            description: 'Technology replaces human workers in routine tasks.',

            effects: {
                indicators: { unemploymentRate: 0.005, gdpGrowthRate: 0.002 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'full_employment_approached',
            name: 'Full Employment Approached',
            description: 'The labor market nears maximum sustainable employment.',

            effects: {
                indicators: { unemploymentRate: -0.005, inflationRate: 0.003 },
                currencies: { aurel: { rate: 5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INFLATION (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    inflation: [
        {
            id: 'inflation_spike',
            name: 'Inflation Spike',
            description: 'Consumer prices rise rapidly, eroding purchasing power.',

            effects: {
                indicators: { inflationRate: 0.01, economicIndex: -4 },
                worldBank: { loanRate: 0.005 },
                currencies: { sovereign: { rate: -5 } }
            }
        },
        {
            id: 'inflation_moderation',
            name: 'Inflation Moderation',
            description: 'Price increases slow toward the central bank target.',

            effects: {
                indicators: { inflationRate: -0.005, economicIndex: 3 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { rate: 5 } }
            }
        },
        {
            id: 'core_inflation_rise',
            name: 'Core Inflation Rise',
            description: 'Excluding food and energy, underlying price pressures build.',

            effects: {
                indicators: { inflationRate: 0.005, interestRate: 0.002 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'core_inflation_fall',
            name: 'Core Inflation Fall',
            description: 'Underlying price pressures ease, giving policy room.',

            effects: {
                indicators: { inflationRate: -0.003, interestRate: -0.002 },
                currencies: { velt: { rate: 2 } }
            }
        },
        {
            id: 'imported_inflation',
            name: 'Imported Inflation',
            description: 'Higher foreign prices pass through to domestic consumers.',

            effects: {
                indicators: { inflationRate: 0.005, exchangeRate: 0.02 },
                currencies: { talon: { rate: 3 } }
            }
        },
        {
            id: 'disinflation',
            name: 'Disinflation',
            description: 'Inflation remains positive but slows meaningfully.',

            effects: {
                indicators: { inflationRate: -0.004, economicIndex: 2 },
                currencies: { krona: { rate: 2 } }
            }
        },
        {
            id: 'stagflation',
            name: 'Stagflation',
            description: 'High inflation coincides with stagnant growth and rising joblessness.',

            effects: {
                indicators: { inflationRate: 0.008, gdpGrowthRate: -0.005, unemploymentRate: 0.005, economicIndex: -6 },
                worldBank: { loanRate: 0.01 },
                currencies: { sovereign: { rate: -8 } }
            }
        },
        {
            id: 'inflation_expectations_rise',
            name: 'Inflation Expectations Rise',
            description: 'Households and businesses anticipate faster price gains ahead.',

            effects: {
                indicators: { inflationRate: 0.003, interestRate: 0.002 },
                currencies: { sovereign: { rate: -3 } }
            }
        },
        {
            id: 'inflation_expectations_fall',
            name: 'Inflation Expectations Fall',
            description: 'Confidence in price stability anchors long-term expectations.',

            effects: {
                indicators: { inflationRate: -0.002, interestRate: -0.001 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'wage_price_spiral_inflation',
            name: 'Wage-Price Spiral Inflation',
            description: 'Rising wages and prices reinforce each other in a dangerous loop.',

            effects: {
                indicators: { inflationRate: 0.008, interestRate: 0.005, economicIndex: -5 },
                worldBank: { loanRate: 0.01 },
                currencies: { talon: { rate: -4 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // DEFLATION (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    deflation: [
        {
            id: 'deflation_scare',
            name: 'Deflation Scare',
            description: 'Falling prices raise concerns about a deflationary spiral.',

            effects: {
                indicators: { inflationRate: -0.005, gdpGrowthRate: -0.003 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { interestRate: -0.2 } }
            }
        },
        {
            id: 'deflationary_spiral',
            name: 'Deflationary Spiral',
            description: 'Falling prices lead to lower spending, more job losses, and further price drops.',

            effects: {
                indicators: { inflationRate: -0.008, gdpGrowthRate: -0.008, unemploymentRate: 0.005 },
                worldBank: { loanRate: -0.01 },
                currencies: { drachma: { rate: -10 } }
            }
        },
        {
            id: 'debt_deflation',
            name: 'Debt Deflation',
            description: 'Falling prices increase the real burden of debt, forcing spending cuts.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -5 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { rate: -5 } }
            }
        },
        {
            id: 'price_war',
            name: 'Retail Price War',
            description: 'Aggressive discounting by retailers drives consumer prices lower.',

            effects: {
                indicators: { inflationRate: -0.003, gdpGrowthRate: 0.002 },
                currencies: { talon: { rate: -2 } }
            }
        },
        {
            id: 'commodity_deflation',
            name: 'Commodity Deflation',
            description: 'Plunging commodity prices reduce input costs across industries.',

            effects: {
                indicators: { inflationRate: -0.004, gdpGrowthRate: 0.002 },
                currencies: { krona: { rate: -4 } }
            }
        },
        {
            id: 'technology_deflation',
            name: 'Technology-Deflation',
            description: 'Rapid tech advances lower the cost of goods and services.',

            effects: {
                indicators: { inflationRate: -0.002, gdpGrowthRate: 0.003 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'global_deflationary_pressure',
            name: 'Global Deflationary Pressure',
            description: 'Weak demand worldwide pushes prices down across many economies.',

            effects: {
                indicators: { inflationRate: -0.004, gdpGrowthRate: -0.003 },
                currencies: { aurel: { rate: -3 } }
            }
        },
        {
            id: 'central_bank_deflation_fight',
            name: 'Central Bank Fights Deflation',
            description: 'Aggressive easing aims to halt falling prices.',

            effects: {
                indicators: { interestRate: -0.005, inflationRate: 0.002 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { interestRate: -0.3, rate: -5 } }
            }
        },
        {
            id: 'asset_price_deflation',
            name: 'Asset Price Deflation',
            description: 'Falling housing and equity prices reduce household wealth.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -5 },
                currencies: { sovereign: { rate: -5 } }
            }
        },
        {
            id: 'imported_deflation',
            name: 'Imported Deflation',
            description: 'Cheap foreign goods hold down domestic prices.',

            effects: {
                indicators: { inflationRate: -0.003, exchangeRate: -0.02 },
                currencies: { talon: { rate: -2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INTEREST RATES (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    interest_rates: [
        {
            id: 'interest_rate_spike',
            name: 'Interest Rate Spike',
            description: 'Borrowing costs jump as lenders demand higher returns.',

            effects: {
                indicators: { interestRate: 0.005, gdpGrowthRate: -0.003 },
                worldBank: { loanRate: 0.01 },
                currencies: { sovereign: { interestRate: 0.4, rate: 5 } }
            }
        },
        {
            id: 'interest_rate_plunge',
            name: 'Interest Rate Plunge',
            description: 'Borrowing costs fall to historic lows, stimulating credit.',

            effects: {
                indicators: { interestRate: -0.005, gdpGrowthRate: 0.003 },
                worldBank: { loanRate: -0.01 },
                currencies: { sovereign: { interestRate: -0.4, rate: -5 } }
            }
        },
        {
            id: 'yield_curve_inversion',
            name: 'Yield Curve Inversion',
            description: 'Short-term rates exceed long-term rates, often signaling recession.',

            effects: {
                indicators: { economicIndex: -3, gdpGrowthRate: -0.003 },
                currencies: { velt: { transferRate: 0.3 } }
            }
        },
        {
            id: 'yield_curve_steepening',
            name: 'Yield Curve Steepening',
            description: 'Long-term rates rise relative to short-term rates, signaling growth expectations.',

            effects: {
                indicators: { economicIndex: 3, gdpGrowthRate: 0.002 },
                currencies: { velt: { transferRate: -0.2 } }
            }
        },
        {
            id: 'negative_interest_rates',
            name: 'Negative Interest Rates',
            description: 'Central banks charge depositors to hold money, encouraging lending.',

            effects: {
                indicators: { interestRate: -0.003, gdpGrowthRate: 0.002 },
                worldBank: { loanRate: -0.005 },
                currencies: { krona: { interestRate: -0.2 } }
            }
        },
        {
            id: 'zero_interest_rate_policy',
            name: 'Zero Interest Rate Policy',
            description: 'Central banks hold rates at zero to stimulate the economy.',

            effects: {
                indicators: { interestRate: -0.002, economicIndex: 2 },
                worldBank: { loanRate: -0.005 },
                currencies: { aurel: { interestRate: -0.1 } }
            }
        },
        {
            id: 'rate_hike_cycle',
            name: 'Rate Hike Cycle Begins',
            description: 'A series of interest rate increases starts to cool the economy.',

            effects: {
                indicators: { interestRate: 0.004, inflationRate: -0.002 },
                worldBank: { loanRate: 0.008 },
                currencies: { sovereign: { interestRate: 0.3 } }
            }
        },
        {
            id: 'rate_cut_cycle',
            name: 'Rate Cut Cycle Begins',
            description: 'A series of interest rate decreases starts to stimulate growth.',

            effects: {
                indicators: { interestRate: -0.004, gdpGrowthRate: 0.002 },
                worldBank: { loanRate: -0.008 },
                currencies: { sovereign: { interestRate: -0.3 } }
            }
        },
        {
            id: 'policy_rate_hold',
            name: 'Policy Rate Hold',
            description: 'The central bank keeps its benchmark rate unchanged.',

            effects: {
                indicators: { economicIndex: 1 },
                currencies: { sovereign: { rate: 1 } }
            }
        },
        {
            id: 'emergency_rate_cut',
            name: 'Emergency Rate Cut',
            description: 'An unscheduled rate cut responds to acute market stress.',

            effects: {
                indicators: { interestRate: -0.003, economicIndex: -2 },
                worldBank: { loanRate: -0.005 },
                currencies: { aurel: { transferRate: 0.4 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // EXCHANGE RATES (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    exchange_rates: [
        {
            id: 'strong_currency',
            name: 'Strong Currency',
            description: 'The national currency appreciates broadly against trading partners.',

            effects: {
                indicators: { exchangeRate: -0.02, inflationRate: -0.003 },
                currencies: { aurel: { rate: 10 } }
            }
        },
        {
            id: 'weak_currency',
            name: 'Weak Currency',
            description: 'The national currency depreciates, boosting exports but raising import costs.',

            effects: {
                indicators: { exchangeRate: 0.02, inflationRate: 0.003 },
                currencies: { aurel: { rate: -10 } }
            }
        },
        {
            id: 'fixed_exchange_rate_defense',
            name: 'Fixed Exchange Rate Defense',
            description: 'Central bank intervenes to maintain a currency peg.',

            effects: {
                indicators: { exchangeRate: 0, economicIndex: -2 },
                currencies: { drachma: { transferRate: 0.5 } }
            }
        },
        {
            id: 'floating_exchange_rate_adoption',
            name: 'Floating Exchange Rate Adoption',
            description: 'A nation lets its currency float freely against others.',

            effects: {
                indicators: { exchangeRate: 0.01, economicIndex: 1 },
                currencies: { krona: { rate: 2 } }
            }
        },
        {
            id: 'currency_union',
            name: 'Currency Union Formation',
            description: 'Multiple nations adopt a shared currency, eliminating exchange risk between them.',

            effects: {
                indicators: { exchangeRate: -0.01, economicIndex: 3 },
                currencies: { velt: { rate: 5 }, krona: { rate: 5 } }
            }
        },
        {
            id: 'currency_union_breakup',
            name: 'Currency Union Breakup',
            description: 'A shared currency arrangement dissolves, creating new exchange risks.',

            effects: {
                indicators: { exchangeRate: 0.04, economicIndex: -6 },
                currencies: { velt: { rate: -8 }, krona: { rate: -8 } }
            }
        },
        {
            id: 'exchange_controls',
            name: 'Exchange Controls Imposed',
            description: 'Government restricts currency conversions to prevent capital flight.',

            effects: {
                indicators: { economicIndex: -4 },
                currencies: { talon: { transferRate: 1.0 }, drachma: { transferRate: 1.0 } }
            }
        },
        {
            id: 'exchange_controls_lifted',
            name: 'Exchange Controls Lifted',
            description: 'Currency conversion restrictions are removed.',

            effects: {
                indicators: { economicIndex: 4 },
                currencies: { talon: { transferRate: -0.5 }, drachma: { transferRate: -0.5 } }
            }
        },
        {
            id: 'currency_speculation',
            name: 'Currency Speculation Surge',
            description: 'Speculators take large positions, increasing exchange rate volatility.',

            effects: {
                indicators: { exchangeRate: 0.03, economicIndex: -2 },
                currencies: { aurel: { transferRate: 0.4 }, velt: { transferRate: 0.4 } }
            }
        },
        {
            id: 'currency_stabilization',
            name: 'Currency Stabilization',
            description: 'Central bank intervention reduces exchange rate fluctuations.',

            effects: {
                indicators: { exchangeRate: -0.01, economicIndex: 2 },
                currencies: { aurel: { transferRate: -0.3 }, velt: { transferRate: -0.3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CAPITAL FLOWS (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    capital_flows: [
        {
            id: 'capital_inflow',
            name: 'Capital Inflow Surge',
            description: 'Foreign investors pour money into domestic assets and businesses.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 4 },
                currencies: { aurel: { rate: 6 } }
            }
        },
        {
            id: 'capital_outflow',
            name: 'Capital Outflow Surge',
            description: 'Investors pull money out of the country, pressuring the currency.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -4 },
                currencies: { aurel: { rate: -6 } }
            }
        },
        {
            id: 'foreign_direct_investment_boom',
            name: 'Foreign Direct Investment Boom',
            description: 'Foreign companies build factories and buy local businesses.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 5 },
                currencies: { krona: { rate: 7 } }
            }
        },
        {
            id: 'foreign_direct_investment_drop',
            name: 'Foreign Direct Investment Drop',
            description: 'Foreign companies pull back on local investment plans.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -3 },
                currencies: { krona: { rate: -5 } }
            }
        },
        {
            id: 'portfolio_investment_surge',
            name: 'Portfolio Investment Surge',
            description: 'Foreign investors buy domestic stocks and bonds in volume.',

            effects: {
                indicators: { economicIndex: 4 },
                currencies: { sovereign: { rate: 5 } }
            }
        },
        {
            id: 'portfolio_investment_flee',
            name: 'Portfolio Investment Flight',
            description: 'Foreign investors sell domestic securities en masse.',

            effects: {
                indicators: { economicIndex: -5 },
                currencies: { sovereign: { rate: -5 } }
            }
        },
        {
            id: 'capital_flight',
            name: 'Capital Flight',
            description: 'Domestic and foreign investors rapidly move money abroad.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -6 },
                currencies: { talon: { rate: -10, transferRate: 0 } },
                worldBank: { loanRate: 0.01 }
            }
        },
        {
            id: 'capital_repatriation',
            name: 'Capital Repatriation',
            description: 'Multinational companies bring overseas earnings back home.',

            effects: {
                indicators: { economicIndex: 3 },
                currencies: { aurel: { rate: 4 } }
            }
        },
        {
            id: 'sovereign_wealth_fund_buying',
            name: 'Sovereign Wealth Fund Buying',
            description: 'A national wealth fund makes large foreign asset purchases.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { krona: { rate: 4 } }
            }
        },
        {
            id: 'sovereign_wealth_fund_selling',
            name: 'Sovereign Wealth Fund Selling',
            description: 'A national wealth fund liquidates foreign holdings.',

            effects: {
                indicators: { economicIndex: -1 },
                currencies: { krona: { rate: -4 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // FOREIGN INVESTMENT (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    foreign_investment: [
        {
            id: 'foreign_investment_boost',
            name: 'Foreign Investment Boost',
            description: 'Policy changes attract more foreign capital into the economy.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, economicIndex: 5 },
                currencies: { aurel: { rate: 5 } }
            }
        },
        {
            id: 'foreign_investment_deterrence',
            name: 'Foreign Investment Deterrence',
            description: 'Policy uncertainty discourages foreign capital.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -4 },
                currencies: { aurel: { rate: -3 } }
            }
        },
        {
            id: 'multinational_expansion',
            name: 'Multinational Expansion',
            description: 'Global companies expand local operations, bringing jobs and technology.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, unemploymentRate: -0.005 },
                currencies: { velt: { rate: 6 } }
            }
        },
        {
            id: 'multinational_withdrawal',
            name: 'Multinational Withdrawal',
            description: 'Global companies scale back or exit local operations.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, unemploymentRate: 0.005 },
                currencies: { velt: { rate: -4 } }
            }
        },
        {
            id: 'tech_foreign_investment',
            name: 'Tech Foreign Investment',
            description: 'Foreign tech firms establish local research and development centers.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 5 },
                currencies: { velt: { rate: 8 } }
            }
        },
        {
            id: 'foreign_investor_confidence',
            name: 'Foreign Investor Confidence',
            description: 'International investors view the economy as stable and attractive.',

            effects: {
                indicators: { economicIndex: 4 },
                currencies: { sovereign: { rate: 5 } }
            }
        },
        {
            id: 'foreign_investor_fear',
            name: 'Foreign Investor Fear',
            description: 'International investors worry about economic or political stability.',

            effects: {
                indicators: { economicIndex: -4 },
                currencies: { sovereign: { rate: -5 } }
            }
        },
        {
            id: 'cross_border_m_and_a',
            name: 'Cross-Border Merger Wave',
            description: 'Foreign companies acquire domestic firms, bringing capital and restructuring.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 3 },
                currencies: { krona: { rate: 4 } }
            }
        },
        {
            id: 'foreign_ownership_restriction',
            name: 'Foreign Ownership Restriction',
            description: 'New rules limit foreign ownership of domestic companies.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -3 },
                currencies: { talon: { rate: -3 } }
            }
        },
        {
            id: 'foreign_ownership_opening',
            name: 'Foreign Ownership Opening',
            description: 'Eased foreign ownership rules invite more international capital.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 3 },
                currencies: { talon: { rate: 3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // DEBT CRISIS (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    debt_crisis: [
        {
            id: 'sovereign_debt_crisis',
            name: 'Sovereign Debt Crisis',
            description: 'A nation struggles to repay its government debt, rattling global markets.',

            effects: {
                indicators: { gdpGrowthRate: -0.015, economicIndex: -8 },
                worldBank: { loanRate: 0.02 },
                currencies: { drachma: { rate: -20 } }
            }
        },
        {
            id: 'sovereign_debt_default',
            name: 'Sovereign Debt Default',
            description: 'A nation misses debt payments, triggering losses for creditors.',

            effects: {
                indicators: { gdpGrowthRate: -0.02, economicIndex: -10 },
                worldBank: { loanRate: 0.03 },
                currencies: { drachma: { rate: -30, transferRate: 2.0 } }
            }
        },
        {
            id: 'sovereign_debt_restructuring',
            name: 'Sovereign Debt Restructuring',
            description: 'A nation renegotiates debt terms with creditors to avoid default.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -4 },
                worldBank: { loanRate: 0.01 },
                currencies: { drachma: { rate: -10 } }
            }
        },
        {
            id: 'debt_crisis_contagion',
            name: 'Debt Crisis Contagion',
            description: 'Financial stress spreads from one nation to others with similar vulnerabilities.',

            effects: {
                indicators: { economicIndex: -5 },
                worldBank: { loanRate: 0.01 },
                currencies: { sovereign: { rate: -8 } }
            }
        },
        {
            id: 'debt_relief_program',
            name: 'Debt Relief Program',
            description: 'Creditors reduce or forgive debt obligations for struggling nations.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 4 },
                worldBank: { loanRate: -0.01 },
                currencies: { aurel: { rate: 5 } }
            }
        },
        {
            id: 'corporate_debt_crisis',
            name: 'Corporate Debt Crisis',
            description: 'Companies struggle to service large debt loads, risking widespread defaults.',

            effects: {
                indicators: { gdpGrowthRate: -0.008, economicIndex: -5 },
                worldBank: { loanRate: 0.01 },
                currencies: { velt: { rate: -5 } }
            }
        },
        {
            id: 'household_debt_crisis',
            name: 'Household Debt Crisis',
            description: 'Consumers struggle with mortgages, credit cards, and loans.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -4 },
                worldBank: { loanRate: 0.005 },
                currencies: { talon: { rate: -4 } }
            }
        },
        {
            id: 'debt_to_gdp_surge',
            name: 'Debt-to-GDP Surge',
            description: 'Government debt grows faster than the economy, raising sustainability concerns.',

            effects: {
                indicators: { economicIndex: -3 },
                worldBank: { loanRate: 0.005 },
                currencies: { sovereign: { rate: -4 } }
            }
        },
        {
            id: 'debt_to_gdp_improvement',
            name: 'Debt-to-GDP Improvement',
            description: 'Economic growth outpaces debt accumulation, improving fiscal health.',

            effects: {
                indicators: { economicIndex: 3 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { rate: 4 } }
            }
        },
        {
            id: 'credit_rating_downgrade',
            name: 'Credit Rating Downgrade',
            description: 'A rating agency lowers a nation credit rating, raising borrowing costs.',

            effects: {
                indicators: { economicIndex: -4 },
                worldBank: { loanRate: 0.01 },
                currencies: { sovereign: { rate: -10 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CREDIT RATING (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    credit_rating: [
        {
            id: 'credit_rating_upgrade',
            name: 'Credit Rating Upgrade',
            description: 'A rating agency raises a nation credit rating, lowering borrowing costs.',

            effects: {
                indicators: { economicIndex: 4 },
                worldBank: { loanRate: -0.01 },
                currencies: { aurel: { rate: 8 } }
            }
        },
        {
            id: 'credit_rating_downgrade',
            name: 'Credit Rating Downgrade',
            description: 'A rating agency lowers a nation credit rating, raising borrowing costs.',

            effects: {
                indicators: { economicIndex: -4 },
                worldBank: { loanRate: 0.01 },
                currencies: { aurel: { rate: -8 } }
            }
        },
        {
            id: 'credit_outlook_negative',
            name: 'Negative Credit Outlook',
            description: 'A rating agency warns of a possible future downgrade.',

            effects: {
                indicators: { economicIndex: -2 },
                currencies: { sovereign: { rate: -3 } }
            }
        },
        {
            id: 'credit_outlook_positive',
            name: 'Positive Credit Outlook',
            description: 'A rating agency signals potential for a future upgrade.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'credit_watch',
            name: 'Credit Watch Listing',
            description: 'A rating agency places a nation on watch for possible rating changes.',

            effects: {
                indicators: { economicIndex: -1 },
                currencies: { velt: { transferRate: 0.2 } }
            }
        },
        {
            id: 'investment_grade_status',
            name: 'Investment Grade Status Achieved',
            description: 'A nation credit rating reaches investment grade, widening investor pool.',

            effects: {
                indicators: { economicIndex: 3 },
                worldBank: { loanRate: -0.005 },
                currencies: { krona: { rate: 5 } }
            }
        },
        {
            id: 'junk_status',
            name: 'Junk Status Downgrade',
            description: 'A nation credit rating falls below investment grade.',

            effects: {
                indicators: { economicIndex: -5 },
                worldBank: { loanRate: 0.01 },
                currencies: { krona: { rate: -8 } }
            }
        },
        {
            id: 'aaa_rating',
            name: 'AAA Credit Rating',
            description: 'A nation achieves the highest possible credit rating.',

            effects: {
                indicators: { economicIndex: 5 },
                worldBank: { loanRate: -0.01 },
                currencies: { aurel: { rate: 10 } }
            }
        },
        {
            id: 'default_rating',
            name: 'Default Credit Rating',
            description: 'A nation credit rating falls to default after missed payments.',

            effects: {
                indicators: { economicIndex: -10 },
                worldBank: { loanRate: 0.03 },
                currencies: { drachma: { rate: -25 } }
            }
        },
        {
            id: 'rating_agency_confidence',
            name: 'Rating Agency Confidence',
            description: 'Major rating agencies express confidence in fiscal management.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { sovereign: { rate: 4 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // GOVERNMENT DEBT (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    government_debt: [
        {
            id: 'government_spending_surge',
            name: 'Government Spending Surge',
            description: 'Increased public spending stimulates economic activity.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, inflationRate: 0.003 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'government_spending_cut',
            name: 'Government Spending Cut',
            description: 'Reduced public spending slows economic activity.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, inflationRate: -0.002 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'budget_deficit_widening',
            name: 'Budget Deficit Widening',
            description: 'Government spending exceeds revenue by a growing margin.',

            effects: {
                indicators: { economicIndex: -2 },
                worldBank: { loanRate: 0.005 },
                currencies: { sovereign: { rate: -3 } }
            }
        },
        {
            id: 'budget_deficit_narrowing',
            name: 'Budget Deficit Narrowing',
            description: 'Government moves closer to balancing its books.',

            effects: {
                indicators: { economicIndex: 2 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'budget_surplus',
            name: 'Budget Surplus',
            description: 'Government collects more revenue than it spends.',

            effects: {
                indicators: { economicIndex: 3 },
                worldBank: { loanRate: -0.005 },
                currencies: { aurel: { rate: 4 } }
            }
        },
        {
            id: 'fiscal_stimulus',
            name: 'Fiscal Stimulus Package',
            description: 'Targeted government spending and tax cuts boost the economy.',

            effects: {
                indicators: { gdpGrowthRate: 0.01, economicIndex: 4 },
                worldBank: { loanRate: -0.005 },
                currencies: { velt: { rate: 5 } }
            }
        },
        {
            id: 'fiscal_austerity',
            name: 'Fiscal Austerity Program',
            description: 'Spending cuts and tax hikes reduce the deficit but slow growth.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, inflationRate: -0.002 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'public_debt_issuance',
            name: 'Public Debt Issuance',
            description: 'Government borrows heavily by issuing new bonds.',

            effects: {
                indicators: { interestRate: 0.002, economicIndex: -1 },
                worldBank: { loanRate: 0.003 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'public_debt_repayment',
            name: 'Public Debt Repayment',
            description: 'Government pays down outstanding debt obligations.',

            effects: {
                indicators: { interestRate: -0.001, economicIndex: 1 },
                worldBank: { loanRate: -0.003 },
                currencies: { sovereign: { rate: 2 } }
            }
        },
        {
            id: 'fiscal_policy_uncertainty',
            name: 'Fiscal Policy Uncertainty',
            description: 'Unclear government plans discourage investment and spending.',

            effects: {
                indicators: { economicIndex: -3 },
                currencies: { talon: { rate: -3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // TAX POLICY (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    tax_policy: [
        {
            id: 'corporate_tax_cut',
            name: 'Corporate Tax Cut',
            description: 'Lower business taxes encourage investment and expansion.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 3 },
                currencies: { velt: { rate: 4 } }
            }
        },
        {
            id: 'corporate_tax_increase',
            name: 'Corporate Tax Increase',
            description: 'Higher business taxes raise revenue but may discourage investment.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -2 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'income_tax_cut',
            name: 'Income Tax Cut',
            description: 'Lower personal taxes leave households with more disposable income.',

            effects: {
                indicators: { gdpGrowthRate: 0.004, inflationRate: 0.002 },
                currencies: { talon: { rate: 3 } }
            }
        },
        {
            id: 'income_tax_increase',
            name: 'Income Tax Increase',
            description: 'Higher personal taxes reduce disposable income and spending.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, inflationRate: -0.001 },
                currencies: { talon: { rate: -2 } }
            }
        },
        {
            id: 'sales_tax_increase',
            name: 'Sales Tax Increase',
            description: 'Higher consumption taxes raise prices and reduce spending.',

            effects: {
                indicators: { inflationRate: 0.003, gdpGrowthRate: -0.002 },
                currencies: { krona: { rate: 1 } }
            }
        },
        {
            id: 'sales_tax_cut',
            name: 'Sales Tax Cut',
            description: 'Lower consumption taxes reduce prices and stimulate spending.',

            effects: {
                indicators: { inflationRate: -0.002, gdpGrowthRate: 0.001 },
                currencies: { krona: { rate: -1 } }
            }
        },
        {
            id: 'capital_gains_tax_increase',
            name: 'Capital Gains Tax Increase',
            description: 'Higher taxes on investment profits may reduce trading activity.',

            effects: {
                indicators: { economicIndex: -1 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'capital_gains_tax_cut',
            name: 'Capital Gains Tax Cut',
            description: 'Lower taxes on investment profits encourage trading.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { sovereign: { rate: 2 } }
            }
        },
        {
            id: 'wealth_tax',
            name: 'Wealth Tax Imposed',
            description: 'New taxes on accumulated wealth affect high-net-worth individuals.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -1 },
                currencies: { aurel: { rate: -1 } }
            }
        },
        {
            id: 'tax_reform',
            name: 'Comprehensive Tax Reform',
            description: 'Major changes to the tax code simplify or complicate the system.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 2 },
                currencies: { sovereign: { rate: 3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // MONETARY POLICY (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    monetary_policy: [
        {
            id: 'easing_monetary_policy',
            name: 'Monetary Policy Easing',
            description: 'The central bank loosens policy to stimulate the economy.',

            effects: {
                indicators: { interestRate: -0.003, gdpGrowthRate: 0.003 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { interestRate: -0.2 } }
            }
        },
        {
            id: 'tightening_monetary_policy',
            name: 'Monetary Policy Tightening',
            description: 'The central bank tightens policy to control inflation.',

            effects: {
                indicators: { interestRate: 0.003, inflationRate: -0.002 },
                worldBank: { loanRate: 0.005 },
                currencies: { sovereign: { interestRate: 0.2 } }
            }
        },
        {
            id: 'dovish_central_bank',
            name: 'Dovish Central Bank',
            description: 'The central bank signals a preference for lower rates and growth.',

            effects: {
                indicators: { interestRate: -0.002, economicIndex: 2 },
                worldBank: { loanRate: -0.003 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'hawkish_central_bank',
            name: 'Hawkish Central Bank',
            description: 'The central bank signals a preference for higher rates and price stability.',

            effects: {
                indicators: { interestRate: 0.002, inflationRate: -0.001 },
                worldBank: { loanRate: 0.003 },
                currencies: { velt: { rate: 2 } }
            }
        },
        {
            id: 'forward_guidance',
            name: 'Forward Guidance',
            description: 'The central bank communicates future policy intentions clearly.',

            effects: {
                indicators: { economicIndex: 1 },
                currencies: { sovereign: { rate: 1 } }
            }
        },
        {
            id: 'unconventional_monetary_policy',
            name: 'Unconventional Monetary Policy',
            description: 'The central bank uses non-traditional tools to stimulate the economy.',

            effects: {
                indicators: { interestRate: -0.002, gdpGrowthRate: 0.002 },
                worldBank: { loanRate: -0.003 },
                currencies: { krona: { rate: -2 } }
            }
        },
        {
            id: 'normalization_of_policy',
            name: 'Policy Normalization',
            description: 'The central bank returns rates to more typical levels.',

            effects: {
                indicators: { interestRate: 0.002, economicIndex: 1 },
                worldBank: { loanRate: 0.002 },
                currencies: { sovereign: { rate: 2 } }
            }
        },
        {
            id: 'monetary_policy_uncertainty',
            name: 'Monetary Policy Uncertainty',
            description: 'Unclear central bank intentions create market volatility.',

            effects: {
                indicators: { exchangeRate: 0.02, economicIndex: -2 },
                currencies: { talon: { transferRate: 0.3 } }
            }
        },
        {
            id: 'central_bank_credibility',
            name: 'Central Bank Credibility Boost',
            description: 'The central bank earns market trust for its inflation commitment.',

            effects: {
                indicators: { inflationRate: -0.002, economicIndex: 3 },
                currencies: { sovereign: { rate: 4 } }
            }
        },
        {
            id: 'central_bank_credibility_loss',
            name: 'Central Bank Credibility Loss',
            description: 'Markets doubt the central bank ability to control inflation.',

            effects: {
                indicators: { inflationRate: 0.003, economicIndex: -4 },
                currencies: { sovereign: { rate: -5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // FISCAL POLICY (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    fiscal_policy: [
        {
            id: 'expansionary_fiscal_policy',
            name: 'Expansionary Fiscal Policy',
            description: 'Government increases spending and cuts taxes to grow the economy.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, inflationRate: 0.003 },
                currencies: { aurel: { rate: 4 } }
            }
        },
        {
            id: 'contractionary_fiscal_policy',
            name: 'Contractionary Fiscal Policy',
            description: 'Government cuts spending and raises taxes to cool the economy.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, inflationRate: -0.002 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'balanced_budget_amendment',
            name: 'Balanced Budget Amendment',
            description: 'Constitutional requirement to balance the budget constrains spending.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: 1 },
                worldBank: { loanRate: -0.003 },
                currencies: { sovereign: { rate: 2 } }
            }
        },
        {
            id: 'automatic_stabilizers',
            name: 'Automatic Stabilizers Engage',
            description: 'Tax and spending rules automatically respond to economic conditions.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { talon: { rate: 1 } }
            }
        },
        {
            id: 'discretionary_fiscal_policy',
            name: 'Discretionary Fiscal Policy',
            description: 'Government makes deliberate spending and tax decisions.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 1 },
                currencies: { krona: { rate: 2 } }
            }
        },
        {
            id: 'fiscal_multiplier_effect',
            name: 'Fiscal Multiplier Effect',
            description: 'Government spending generates larger economic gains than expected.',

            effects: {
                indicators: { gdpGrowthRate: 0.004, economicIndex: 3 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'crowding_out_effect',
            name: 'Crowding Out Effect',
            description: 'Government borrowing raises interest rates and reduces private investment.',

            effects: {
                indicators: { interestRate: 0.002, gdpGrowthRate: -0.002 },
                worldBank: { loanRate: 0.003 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'fiscal_consolidation',
            name: 'Fiscal Consolidation',
            description: 'Government reduces the deficit through spending cuts and tax hikes.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: 0 },
                worldBank: { loanRate: -0.003 },
                currencies: { sovereign: { rate: 1 } }
            }
        },
        {
            id: 'fiscal_expansion',
            name: 'Fiscal Expansion',
            description: 'Government increases the deficit to stimulate growth.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 2 },
                worldBank: { loanRate: 0.003 },
                currencies: { talon: { rate: -1 } }
            }
        },
        {
            id: 'fiscal_policy_coordination',
            name: 'Fiscal Policy Coordination',
            description: 'Nations coordinate fiscal policies for mutual benefit.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 3 },
                currencies: { sovereign: { rate: 3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // SUPPLY CHAIN (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    supply_chain: [
        {
            id: 'supply_chain_optimization',
            name: 'Supply Chain Optimization',
            description: 'Companies streamline logistics, reducing costs and delivery times.',

            effects: {
                indicators: { gdpGrowthRate: 0.004, inflationRate: -0.002 },
                currencies: { krona: { rate: 3 } }
            }
        },
        {
            id: 'supply_chain_bottleneck',
            name: 'Supply Chain Bottleneck',
            description: 'Logistics congestion delays goods and raises costs.',

            effects: {
                indicators: { gdpGrowthRate: -0.004, inflationRate: 0.004 },
                currencies: { talon: { rate: -3 } }
            }
        },
        {
            id: 'just_in_time_failure',
            name: 'Just-in-Time Delivery Failure',
            description: 'Lean inventories leave firms vulnerable to supply interruptions.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, inflationRate: 0.003 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'supply_chain_diversification',
            name: 'Supply Chain Diversification',
            description: 'Companies source from multiple countries to reduce risk.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 2 },
                currencies: { aurel: { rate: 2 } }
            }
        },
        {
            id: 'supply_chain_reshoring',
            name: 'Supply Chain Reshoring',
            description: 'Production moves closer to home markets.',

            effects: {
                indicators: { gdpGrowthRate: 0.004, unemploymentRate: -0.003 },
                currencies: { krona: { rate: 4 } }
            }
        },
        {
            id: 'port_congestion',
            name: 'Port Congestion',
            description: 'Overloaded ports delay shipments and raise shipping costs.',

            effects: {
                indicators: { inflationRate: 0.003, gdpGrowthRate: -0.002 },
                currencies: { talon: { transferRate: 0.3 } }
            }
        },
        {
            id: 'shipping_capacity_shortage',
            name: 'Shipping Capacity Shortage',
            description: 'Not enough containers and vessels to move global trade.',

            effects: {
                indicators: { inflationRate: 0.004, gdpGrowthRate: -0.003 },
                currencies: { krona: { rate: -4 } }
            }
        },
        {
            id: 'logistics_automation',
            name: 'Logistics Automation',
            description: 'Automated warehouses and vehicles speed up goods movement.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, inflationRate: -0.001 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'supplier_bankruptcy',
            name: 'Key Supplier Bankruptcy',
            description: 'A major supplier collapse disrupts production across industries.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -3 },
                currencies: { drachma: { rate: -4 } }
            }
        },
        {
            id: 'supply_chain_transparency',
            name: 'Supply Chain Transparency',
            description: 'Better tracking and data improve supply chain reliability.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 2 },
                currencies: { sovereign: { rate: 2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // LOGISTICS (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    logistics: [
        {
            id: 'shipping_cost_spike',
            name: 'Shipping Cost Spike',
            description: 'Freight rates surge, raising the cost of moving goods worldwide.',

            effects: {
                indicators: { inflationRate: 0.004, gdpGrowthRate: -0.002 },
                currencies: { talon: { rate: 4 } }
            }
        },
        {
            id: 'shipping_cost_drop',
            name: 'Shipping Cost Drop',
            description: 'Lower freight rates reduce the cost of global trade.',

            effects: {
                indicators: { inflationRate: -0.002, gdpGrowthRate: 0.001 },
                currencies: { talon: { rate: -4 } }
            }
        },
        {
            id: 'truck_driver_shortage',
            name: 'Truck Driver Shortage',
            description: 'Not enough drivers to move goods domestically.',

            effects: {
                indicators: { inflationRate: 0.003, gdpGrowthRate: -0.002 },
                currencies: { krona: { rate: -2 } }
            }
        },
        {
            id: 'rail_freight_disruption',
            name: 'Rail Freight Disruption',
            description: 'Rail network issues interrupt land cargo movement.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, inflationRate: 0.002 },
                currencies: { drachma: { rate: -2 } }
            }
        },
        {
            id: 'air_freight_surge',
            name: 'Air Freight Surge',
            description: 'More goods move by air, speeding delivery but raising costs.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, inflationRate: 0.001 },
                currencies: { velt: { rate: 2 } }
            }
        },
        {
            id: 'warehouse_capacity_shortage',
            name: 'Warehouse Capacity Shortage',
            description: 'Not enough storage space for goods awaiting distribution.',

            effects: {
                indicators: { inflationRate: 0.002, economicIndex: -1 },
                currencies: { talon: { transferRate: 0.2 } }
            }
        },
        {
            id: 'cold_chain_failure',
            name: 'Cold Chain Failure',
            description: 'Refrigerated transport issues spoil food and medicine shipments.',

            effects: {
                indicators: { inflationRate: 0.003, economicIndex: -2 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'last_mile_delivery_boom',
            name: 'Last-Mile Delivery Boom',
            description: 'E-commerce growth drives more local deliveries.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 2 },
                currencies: { talon: { rate: 3 } }
            }
        },
        {
            id: 'logistics_strike',
            name: 'Logistics Strike',
            description: 'Transport workers stop work, halting goods movement.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, inflationRate: 0.003 },
                currencies: { sovereign: { rate: -3 } }
            }
        },
        {
            id: 'logistics_infrastructure_investment',
            name: 'Logistics Infrastructure Investment',
            description: 'New roads, ports, and rails improve goods movement.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 4 },
                currencies: { krona: { rate: 5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // TRADE BALANCE (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    trade_balance: [
        {
            id: 'trade_deficit_widening',
            name: 'Trade Deficit Widening',
            description: 'Imports exceed exports by a growing margin.',

            effects: {
                indicators: { exchangeRate: 0.02, economicIndex: -3 },
                currencies: { aurel: { rate: -4 } }
            }
        },
        {
            id: 'trade_deficit_narrowing',
            name: 'Trade Deficit Narrowing',
            description: 'The gap between imports and exports shrinks.',

            effects: {
                indicators: { exchangeRate: -0.01, economicIndex: 3 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'trade_surplus',
            name: 'Trade Surplus',
            description: 'Exports exceed imports, bringing in foreign currency.',

            effects: {
                indicators: { exchangeRate: -0.02, economicIndex: 4 },
                currencies: { krona: { rate: 5 } }
            }
        },
        {
            id: 'trade_balance_shift',
            name: 'Trade Balance Shift',
            description: "A nation's trade position moves from surplus to deficit or vice versa.",

            effects: {
                indicators: { exchangeRate: 0.01, economicIndex: 0 },
                currencies: { velt: { rate: 1 } }
            }
        },
        {
            id: 'export_growth',
            name: 'Export Growth',
            description: 'Foreign demand for domestic goods increases.',

            effects: {
                indicators: { gdpGrowthRate: 0.006, economicIndex: 4 },
                currencies: { talon: { rate: 5 } }
            }
        },
        {
            id: 'export_decline',
            name: 'Export Decline',
            description: 'Foreign demand for domestic goods falls.',

            effects: {
                indicators: { gdpGrowthRate: -0.004, economicIndex: -3 },
                currencies: { talon: { rate: -4 } }
            }
        },
        {
            id: 'import_growth',
            name: 'Import Growth',
            description: 'Domestic demand for foreign goods increases.',

            effects: {
                indicators: { inflationRate: -0.001, exchangeRate: 0.01 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'import_decline',
            name: 'Import Decline',
            description: 'Domestic demand for foreign goods falls.',

            effects: {
                indicators: { inflationRate: 0.001, exchangeRate: -0.01 },
                currencies: { aurel: { rate: 2 } }
            }
        },
        {
            id: 'terms_of_trade_improvement',
            name: 'Terms of Trade Improvement',
            description: 'Export prices rise relative to import prices.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 3 },
                currencies: { sovereign: { rate: 4 } }
            }
        },
        {
            id: 'terms_of_trade_worsening',
            name: 'Terms of Trade Worsening',
            description: 'Export prices fall relative to import prices.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -3 },
                currencies: { sovereign: { rate: -4 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CURRENCY RESERVES (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    currency_reserves: [
        {
            id: 'foreign_reserves_buildup',
            name: 'Foreign Reserves Buildup',
            description: 'Central bank accumulates foreign currency reserves.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'foreign_reserves_decline',
            name: 'Foreign Reserves Decline',
            description: 'Central bank draws down foreign currency reserves.',

            effects: {
                indicators: { economicIndex: -3 },
                currencies: { sovereign: { rate: -4 } }
            }
        },
        {
            id: 'reserve_currency_diversification',
            name: 'Reserve Currency Diversification',
            description: 'Central banks hold a wider mix of reserve currencies.',

            effects: {
                indicators: { exchangeRate: 0.01, economicIndex: 1 },
                currencies: { aurel: { rate: -2 }, krona: { rate: 2 } }
            }
        },
        {
            id: 'gold_reserves_increase',
            name: 'Gold Reserves Increase',
            description: 'Central banks add to their gold holdings.',

            effects: {
                indicators: { economicIndex: 1 },
                currencies: { sovereign: { rate: 2 } }
            }
        },
        {
            id: 'gold_reserves_decrease',
            name: 'Gold Reserves Decrease',
            description: 'Central banks sell gold reserves.',

            effects: {
                indicators: { economicIndex: -1 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'currency_reserve_status_gain',
            name: 'Reserve Currency Status Gain',
            description: 'A currency becomes more widely held as a global reserve.',

            effects: {
                indicators: { exchangeRate: -0.01, economicIndex: 4 },
                currencies: { aurel: { rate: 10 } }
            }
        },
        {
            id: 'currency_reserve_status_loss',
            name: 'Reserve Currency Status Loss',
            description: 'A currency loses its role as a global reserve.',

            effects: {
                indicators: { exchangeRate: 0.03, economicIndex: -6 },
                currencies: { aurel: { rate: -12 } }
            }
        },
        {
            id: 'swap_line_establishment',
            name: 'Currency Swap Line',
            description: 'Central banks establish liquidity swap arrangements.',

            effects: {
                indicators: { economicIndex: 2 },
                worldBank: { loanRate: -0.003 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'swap_line_termination',
            name: 'Currency Swap Line Termination',
            description: 'Central bank liquidity arrangements end.',

            effects: {
                indicators: { economicIndex: -2 },
                worldBank: { loanRate: 0.003 },
                currencies: { velt: { rate: -3 } }
            }
        },
        {
            id: 'reserve_adequacy_concern',
            name: 'Reserve Adequacy Concern',
            description: 'Markets worry a nation lacks sufficient reserves.',

            effects: {
                indicators: { economicIndex: -3 },
                currencies: { drachma: { rate: -5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CENTRAL BANK DIGITAL CURRENCY (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    central_bank_digital_currency: [
        {
            id: 'cbdc_launch',
            name: 'Central Bank Digital Currency Launch',
            description: 'A national digital currency modernizes payment systems.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                currencies: { velt: { transferRate: -0.3, interestRate: 0.1 } }
            }
        },
        {
            id: 'cbdc_adoption_surge',
            name: 'CBDC Adoption Surge',
            description: 'Citizens and businesses rapidly adopt the digital currency.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { velt: { rate: 4 } }
            }
        },
        {
            id: 'cbdc_adoption_slow',
            name: 'CBDC Adoption Slow',
            description: 'Public uptake of the digital currency lags expectations.',

            effects: {
                indicators: { economicIndex: -1 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'cbdc_privacy_concerns',
            name: 'CBDC Privacy Concerns',
            description: 'Public worry about surveillance limits digital currency use.',

            effects: {
                indicators: { economicIndex: -2 },
                currencies: { velt: { rate: -3 } }
            }
        },
        {
            id: 'cbdc_cyber_attack',
            name: 'CBDC Cyber Attack',
            description: 'Hackers target the digital currency infrastructure.',

            effects: {
                indicators: { economicIndex: -4 },
                currencies: { velt: { transferRate: 1.0 } }
            }
        },
        {
            id: 'cbdc_financial_inclusion',
            name: 'CBDC Financial Inclusion',
            description: 'Digital currency brings banking to unbanked populations.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { talon: { rate: 2 } }
            }
        },
        {
            id: 'cbdc_disintermediation',
            name: 'CBDC Bank Disintermediation',
            description: 'Deposits move from commercial banks to the central bank.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                worldBank: { loanRate: 0.003 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'cbdc_cross_border',
            name: 'CBDC Cross-Border Payments',
            description: 'Digital currencies enable faster international payments.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { krona: { transferRate: -0.2 } }
            }
        },
        {
            id: 'cbdc_interest_bearing',
            name: 'Interest-Bearing CBDC',
            description: 'The digital currency pays interest, competing with bank deposits.',

            effects: {
                indicators: { interestRate: -0.001, economicIndex: 1 },
                currencies: { velt: { interestRate: 0.2 } }
            }
        },
        {
            id: 'cbdc_non_interest_bearing',
            name: 'Non-Interest-Bearing CBDC',
            description: 'The digital currency pays no interest, limiting bank competition.',

            effects: {
                indicators: { interestRate: 0.001, economicIndex: 0 },
                currencies: { velt: { interestRate: -0.1 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CRYPTOCURRENCY (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    cryptocurrency: [
        {
            id: 'crypto_boom',
            name: 'Cryptocurrency Boom',
            description: 'Digital asset prices surge as investor enthusiasm grows.',

            effects: {
                indicators: { economicIndex: 3 },
                currencies: { talon: { rate: 6 } }
            }
        },
        {
            id: 'crypto_bust',
            name: 'Cryptocurrency Bust',
            description: 'Digital asset prices collapse, wiping out investor wealth.',

            effects: {
                indicators: { economicIndex: -3 },
                currencies: { talon: { rate: -6 } }
            }
        },
        {
            id: 'crypto_regulation',
            name: 'Cryptocurrency Regulation',
            description: 'New rules govern digital asset trading and custody.',

            effects: {
                indicators: { economicIndex: 1 },
                currencies: { talon: { transferRate: 0.2 } }
            }
        },
        {
            id: 'crypto_ban',
            name: 'Cryptocurrency Ban',
            description: 'A nation prohibits cryptocurrency trading and mining.',

            effects: {
                indicators: { economicIndex: -2 },
                currencies: { talon: { rate: -10, transferRate: 1.0 } }
            }
        },
        {
            id: 'crypto_adoption',
            name: 'Cryptocurrency Adoption',
            description: 'More businesses accept digital currencies as payment.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 2 },
                currencies: { talon: { rate: 4 } }
            }
        },
        {
            id: 'crypto_mining_ban',
            name: 'Crypto Mining Ban',
            description: 'A nation prohibits energy-intensive cryptocurrency mining.',

            effects: {
                indicators: { gdpGrowthRate: -0.001 },
                currencies: { krona: { rate: -2 } }
            }
        },
        {
            id: 'crypto_etf_approval',
            name: 'Crypto ETF Approval',
            description: 'Regulators approve exchange-traded funds for digital assets.',

            effects: {
                indicators: { economicIndex: 3 },
                currencies: { sovereign: { rate: 5 } }
            }
        },
        {
            id: 'crypto_etf_rejection',
            name: 'Crypto ETF Rejection',
            description: 'Regulators deny exchange-traded funds for digital assets.',

            effects: {
                indicators: { economicIndex: -1 },
                currencies: { sovereign: { rate: -3 } }
            }
        },
        {
            id: 'stablecoin_depeg',
            name: 'Stablecoin Depeg',
            description: 'A stablecoin loses its peg to the underlying asset.',

            effects: {
                indicators: { economicIndex: -3 },
                currencies: { velt: { transferRate: 0.5 } }
            }
        },
        {
            id: 'stablecoin_repeg',
            name: 'Stablecoin Repeg',
            description: 'A stablecoin restores its peg after a temporary break.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { velt: { transferRate: -0.2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // FINTECH (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    fintech: [
        {
            id: 'fintech_adoption',
            name: 'Fintech Adoption',
            description: 'Digital financial services spread rapidly among consumers.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                currencies: { velt: { transferRate: -0.2 } }
            }
        },
        {
            id: 'fintech_disruption',
            name: 'Fintech Disruption',
            description: 'New financial technology challenges traditional banks.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'digital_banking_expansion',
            name: 'Digital Banking Expansion',
            description: 'Online-only banks gain market share from traditional branches.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 2 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'mobile_payment_surge',
            name: 'Mobile Payment Surge',
            description: 'Smartphone payments replace cash and cards for daily purchases.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { talon: { transferRate: -0.1 } }
            }
        },
        {
            id: 'peer_to_peer_lending',
            name: 'Peer-to-Peer Lending Growth',
            description: 'Online platforms connect borrowers directly with lenders.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                worldBank: { loanRate: -0.002 },
                currencies: { krona: { rate: 2 } }
            }
        },
        {
            id: 'robo_advisor_adoption',
            name: 'Robo-Advisor Adoption',
            description: 'Automated investment platforms manage more portfolios.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { sovereign: { rate: 2 } }
            }
        },
        {
            id: 'insurtech_innovation',
            name: 'Insurtech Innovation',
            description: 'Technology transforms insurance pricing and claims.',

            effects: {
                indicators: { economicIndex: 1 },
                currencies: { drachma: { rate: 1 } }
            }
        },
        {
            id: 'regtech_adoption',
            name: 'Regtech Adoption',
            description: 'Regulatory technology lowers compliance costs for banks.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { velt: { rate: 1 } }
            }
        },
        {
            id: 'open_banking',
            name: 'Open Banking',
            description: "Data sharing rules let third parties access bank data with consent.",

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { aurel: { rate: 2 } }
            }
        },
        {
            id: 'fintech_cyber_breach',
            name: 'Fintech Cyber Breach',
            description: 'A hacker attack exposes financial technology user data.',

            effects: {
                indicators: { economicIndex: -3 },
                currencies: { velt: { transferRate: 0.5 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // PAYMENT SYSTEMS (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    payment_systems: [
        {
            id: 'instant_payment_system',
            name: 'Instant Payment System',
            description: 'Real-time payments settle transactions immediately.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { velt: { transferRate: -0.1 } }
            }
        },
        {
            id: 'payment_system_outage',
            name: 'Payment System Outage',
            description: 'A major payment network goes offline, disrupting commerce.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -5 },
                currencies: { talon: { transferRate: 1.0 } }
            }
        },
        {
            id: 'cross_border_payment_fast',
            name: 'Cross-Border Payment Speedup',
            description: 'International money transfers become faster and cheaper.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { krona: { transferRate: -0.2 } }
            }
        },
        {
            id: 'cross_border_payment_slow',
            name: 'Cross-Border Payment Slowdown',
            description: 'International money transfers become slower and costlier.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -2 },
                currencies: { krona: { transferRate: 0.2 } }
            }
        },
        {
            id: 'digital_wallet_adoption',
            name: 'Digital Wallet Adoption',
            description: 'Consumers store payment credentials on smartphones.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { talon: { rate: 2 } }
            }
        },
        {
            id: 'contactless_payment_surge',
            name: 'Contactless Payment Surge',
            description: 'Tap-to-pay transactions become the norm for in-person purchases.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { velt: { rate: 2 } }
            }
        },
        {
            id: 'qr_code_payment_adoption',
            name: 'QR Code Payment Adoption',
            description: 'Merchants accept QR code payments for quick checkout.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { talon: { rate: 1 } }
            }
        },
        {
            id: 'biometric_payment',
            name: 'Biometric Payment',
            description: 'Fingerprint and facial recognition authorize transactions.',

            effects: {
                indicators: { economicIndex: 1 },
                currencies: { sovereign: { rate: 1 } }
            }
        },
        {
            id: 'payment_fraud_increase',
            name: 'Payment Fraud Increase',
            description: 'Criminals exploit payment systems, raising costs for everyone.',

            effects: {
                indicators: { economicIndex: -2 },
                currencies: { aurel: { transferRate: 0.2 } }
            }
        },
        {
            id: 'payment_fraud_decrease',
            name: 'Payment Fraud Decrease',
            description: 'Better security reduces payment fraud losses.',

            effects: {
                indicators: { economicIndex: 2 },
                currencies: { aurel: { transferRate: -0.1 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // MICROFINANCE (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    microfinance: [
        {
            id: 'microfinance_expansion',
            name: 'Microfinance Expansion',
            description: 'Small loans reach more entrepreneurs and low-income households.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 2 },
                currencies: { talon: { rate: 2 } }
            }
        },
        {
            id: 'microfinance_contraction',
            name: 'Microfinance Contraction',
            description: 'Small lenders reduce credit availability to underserved borrowers.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { talon: { rate: -1 } }
            }
        },
        {
            id: 'microenterprise_boom',
            name: 'Microenterprise Boom',
            description: 'Tiny businesses proliferate, creating local jobs.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, unemploymentRate: -0.002 },
                currencies: { aurel: { rate: 2 } }
            }
        },
        {
            id: 'microenterprise_failures',
            name: 'Microenterprise Failures',
            description: 'Small businesses close at elevated rates.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, unemploymentRate: 0.002 },
                currencies: { aurel: { rate: -1 } }
            }
        },
        {
            id: 'group_lending_model',
            name: 'Group Lending Model',
            description: 'Community-based lending lowers default rates.',

            effects: {
                indicators: { economicIndex: 1 },
                worldBank: { loanRate: -0.001 },
                currencies: { krona: { rate: 1 } }
            }
        },
        {
            id: 'individual_lending_shift',
            name: 'Individual Lending Shift',
            description: "Microfinance shifts from groups to individual borrowers.",

            effects: {
                indicators: { economicIndex: 0 },
                currencies: { krona: { rate: 0 } }
            }
        },
        {
            id: 'microfinance_interest_cap',
            name: 'Microfinance Interest Rate Cap',
            description: "Regulators limit interest rates on small loans.",

            effects: {
                indicators: { economicIndex: 1 },
                worldBank: { loanRate: -0.002 },
                currencies: { talon: { rate: -1 } }
            }
        },
        {
            id: 'microfinance_interest_freedom',
            name: 'Microfinance Interest Rate Freedom',
            description: "Lenders can set rates freely on small loans.",

            effects: {
                indicators: { economicIndex: -1 },
                worldBank: { loanRate: 0.001 },
                currencies: { talon: { rate: 1 } }
            }
        },
        {
            id: 'microfinance_digital',
            name: 'Digital Microfinance',
            description: "Mobile apps deliver small loans instantly.",

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { velt: { rate: 1 } }
            }
        },
        {
            id: 'microfinance_crisis',
            name: 'Microfinance Crisis',
            description: "Widespread defaults destabilize small lenders.",

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -3 },
                worldBank: { loanRate: 0.003 },
                currencies: { drachma: { rate: -3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // GREEN FINANCE (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    green_finance: [
        {
            id: 'green_bond_issuance',
            name: 'Green Bond Issuance',
            description: 'Bonds fund environmentally sustainable projects.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'green_bond_crash',
            name: 'Green Bond Crash',
            description: 'Environmental bond prices fall on skepticism.',

            effects: {
                indicators: { economicIndex: -2 },
                currencies: { sovereign: { rate: -3 } }
            }
        },
        {
            id: 'esg_investing_surge',
            name: 'ESG Investing Surge',
            description: 'Investors favor companies with strong environmental and social records.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 4 },
                currencies: { velt: { rate: 4 } }
            }
        },
        {
            id: 'esg_investing_decline',
            name: 'ESG Investing Decline',
            description: 'Investors pull back from ESG-focused strategies.',

            effects: {
                indicators: { economicIndex: -2 },
                currencies: { velt: { rate: -3 } }
            }
        },
        {
            id: 'carbon_pricing',
            name: 'Carbon Pricing Implemented',
            description: 'A price on carbon emissions affects energy and industry.',

            effects: {
                indicators: { inflationRate: 0.002, gdpGrowthRate: -0.001 },
                currencies: { krona: { rate: 2 } }
            }
        },
        {
            id: 'carbon_pricing_removal',
            name: 'Carbon Pricing Removed',
            description: 'The price on carbon emissions is eliminated.',

            effects: {
                indicators: { inflationRate: -0.001, gdpGrowthRate: 0.001 },
                currencies: { krona: { rate: -1 } }
            }
        },
        {
            id: 'climate_finance',
            name: 'Climate Finance Flows',
            description: 'Funding supports climate adaptation and mitigation projects.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 3 },
                currencies: { aurel: { rate: 2 } }
            }
        },
        {
            id: 'green_washing_scandal',
            name: 'Greenwashing Scandal',
            description: 'False environmental claims undermine investor trust.',

            effects: {
                indicators: { economicIndex: -3 },
                currencies: { talon: { rate: -2 } }
            }
        },
        {
            id: 'renewable_financing_boom',
            name: 'Renewable Financing Boom',
            description: 'Loans for wind, solar, and battery projects surge.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                currencies: { velt: { rate: 4 } }
            }
        },
        {
            id: 'fossil_fuel_divestment',
            name: 'Fossil Fuel Divestment',
            description: 'Investors exit oil, gas, and coal holdings.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { krona: { rate: -3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // EMERGING MARKETS (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    emerging_markets: [
        {
            id: 'emerging_market_boom',
            name: 'Emerging Market Boom',
            description: 'Developing economies grow rapidly, attracting global capital.',

            effects: {
                indicators: { gdpGrowthRate: 0.005, economicIndex: 4 },
                currencies: { talon: { rate: 6 } }
            }
        },
        {
            id: 'emerging_market_crisis',
            name: 'Emerging Market Crisis',
            description: 'Developing economies face financial stress and capital flight.',

            effects: {
                indicators: { gdpGrowthRate: -0.005, economicIndex: -5 },
                currencies: { talon: { rate: -6 } }
            }
        },
        {
            id: 'frontier_market_opening',
            name: 'Frontier Market Opening',
            description: 'Less-developed markets open to foreign investment.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 2 },
                currencies: { drachma: { rate: 3 } }
            }
        },
        {
            id: 'frontier_market_closure',
            name: 'Frontier Market Closure',
            description: "Less-developed markets restrict foreign access.",

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { drachma: { rate: -2 } }
            }
        },
        {
            id: 'emerging_market_currency_rally',
            name: 'Emerging Market Currency Rally',
            description: 'Developing nation currencies strengthen against major currencies.',

            effects: {
                indicators: { exchangeRate: -0.02, economicIndex: 3 },
                currencies: { talon: { rate: 7 } }
            }
        },
        {
            id: 'emerging_market_currency_crash',
            name: 'Emerging Market Currency Crash',
            description: 'Developing nation currencies plummet against major currencies.',

            effects: {
                indicators: { exchangeRate: 0.03, economicIndex: -4 },
                currencies: { talon: { rate: -8 } }
            }
        },
        {
            id: 'emerging_market_debt_issuance',
            name: 'Emerging Market Debt Issuance',
            description: 'Developing nations borrow heavily in international markets.',

            effects: {
                indicators: { gdpGrowthRate: 0.002 },
                worldBank: { loanRate: 0.002 },
                currencies: { sovereign: { rate: -1 } }
            }
        },
        {
            id: 'emerging_market_debt_repayment',
            name: 'Emerging Market Debt Repayment',
            description: 'Developing nations pay down international debt.',

            effects: {
                indicators: { gdpGrowthRate: -0.001 },
                worldBank: { loanRate: -0.002 },
                currencies: { sovereign: { rate: 1 } }
            }
        },
        {
            id: 'emerging_market_reform',
            name: 'Emerging Market Reform',
            description: "Developing nations improve institutions and policies.",

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                currencies: { aurel: { rate: 4 } }
            }
        },
        {
            id: 'emerging_market_reform_reversal',
            name: 'Emerging Market Reform Reversal',
            description: "Developing nations roll back institutional improvements.",

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -3 },
                currencies: { aurel: { rate: -3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // GLOBAL ECONOMY (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    global_economy: [
        {
            id: 'global_growth_surge',
            name: 'Global Growth Surge',
            description: 'World economies expand together, lifting trade and incomes.',

            effects: {
                indicators: { gdpGrowthRate: 0.008, economicIndex: 5 },
                currencies: { aurel: { rate: 4 } }
            }
        },
        {
            id: 'global_recession',
            name: 'Global Recession',
            description: 'Major economies contract simultaneously, reducing global trade.',

            effects: {
                indicators: { gdpGrowthRate: -0.008, economicIndex: -6, unemploymentRate: 0.008 },
                currencies: { sovereign: { rate: -5 } }
            }
        },
        {
            id: 'global_inflation_surge',
            name: 'Global Inflation Surge',
            description: 'Price pressures rise across many countries at once.',

            effects: {
                indicators: { inflationRate: 0.008, economicIndex: -4 },
                worldBank: { loanRate: 0.005 },
                currencies: { talon: { rate: -3 } }
            }
        },
        {
            id: 'global_deflationary_pressure',
            name: 'Global Deflationary Pressure',
            description: 'Weak worldwide demand pushes prices down across economies.',

            effects: {
                indicators: { inflationRate: -0.005, gdpGrowthRate: -0.003 },
                worldBank: { loanRate: -0.005 },
                currencies: { sovereign: { interestRate: -0.2 } }
            }
        },
        {
            id: 'global_trade_expansion',
            name: 'Global Trade Expansion',
            description: 'International trade volumes grow as barriers fall.',

            effects: {
                indicators: { gdpGrowthRate: 0.004, economicIndex: 4 },
                currencies: { krona: { rate: 4 } }
            }
        },
        {
            id: 'global_trade_contraction',
            name: 'Global Trade Contraction',
            description: 'International trade volumes shrink as protectionism rises.',

            effects: {
                indicators: { gdpGrowthRate: -0.004, economicIndex: -4 },
                currencies: { krona: { rate: -4 } }
            }
        },
        {
            id: 'global_supply_chain_reorganization',
            name: 'Global Supply Chain Reorganization',
            description: 'Companies restructure worldwide production networks.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'global_financial_stability',
            name: 'Global Financial Stability',
            description: 'Financial markets worldwide operate smoothly and confidently.',

            effects: {
                indicators: { economicIndex: 4 },
                worldBank: { loanRate: -0.003 },
                currencies: { sovereign: { rate: 4 } }
            }
        },
        {
            id: 'global_financial_instability',
            name: 'Global Financial Instability',
            description: 'Financial markets worldwide face stress and volatility.',

            effects: {
                indicators: { economicIndex: -5 },
                worldBank: { loanRate: 0.005 },
                currencies: { sovereign: { rate: -5 } }
            }
        },
        {
            id: 'global_economic_coordination',
            name: 'Global Economic Coordination',
            description: 'Nations coordinate fiscal and monetary policies for shared benefit.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                worldBank: { loanRate: -0.003 },
                currencies: { aurel: { rate: 3 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // LUXURY GOODS (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    luxury_goods: [
        {
            id: 'luxury_goods_boom',
            name: 'Luxury Goods Boom',
            description: 'High-end consumer spending surges as wealth concentrates.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, inflationRate: 0.002 },
                currencies: { sovereign: { rate: 4 } }
            }
        },
        {
            id: 'luxury_goods_bust',
            name: 'Luxury Goods Bust',
            description: 'High-end spending collapses as economic confidence fades.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, inflationRate: -0.001 },
                currencies: { sovereign: { rate: -4 } }
            }
        },
        {
            id: 'designer_fashion_surge',
            name: 'Designer Fashion Surge',
            description: 'Luxury clothing and accessories see explosive demand.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'designer_fashion_decline',
            name: 'Designer Fashion Decline',
            description: 'Luxury fashion loses favor as consumers tighten budgets.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { velt: { rate: -3 } }
            }
        },
        {
            id: 'luxury_travel_boom',
            name: 'Luxury Travel Boom',
            description: 'Affluent travelers book premium hotels and flights in volume.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { talon: { rate: 4 } }
            }
        },
        {
            id: 'luxury_travel_bust',
            name: 'Luxury Travel Bust',
            description: 'High-end travel bookings collapse as discretionary spending falls.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -3 },
                currencies: { talon: { rate: -4 } }
            }
        },
        {
            id: 'luxury_auto_boom',
            name: 'Luxury Auto Boom',
            description: 'High-end vehicle sales surge on strong wealthy demand.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { krona: { rate: 3 } }
            }
        },
        {
            id: 'luxury_auto_bust',
            name: 'Luxury Auto Bust',
            description: 'High-end vehicle sales collapse as buyers pull back.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -3 },
                currencies: { krona: { rate: -3 } }
            }
        },
        {
            id: 'jewelry_market_boom',
            name: 'Jewelry Market Boom',
            description: 'Precious stones and metals see strong demand as luxury gifts.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { sovereign: { rate: 2 } }
            }
        },
        {
            id: 'jewelry_market_bust',
            name: 'Jewelry Market Bust',
            description: 'Jewelry demand falls as consumers prioritize essentials.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { sovereign: { rate: -2 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CONSUMER GOODS (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    consumer_goods: [
        {
            id: 'consumer_goods_demand_surge',
            name: 'Consumer Goods Demand Surge',
            description: 'Households increase spending on everyday products.',

            effects: {
                indicators: { gdpGrowthRate: 0.004, inflationRate: 0.002 },
                currencies: { aurel: { rate: 3 } }
            }
        },
        {
            id: 'consumer_goods_demand_drop',
            name: 'Consumer Goods Demand Drop',
            description: 'Households cut back on everyday purchases.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, inflationRate: -0.001 },
                currencies: { aurel: { rate: -2 } }
            }
        },
        {
            id: 'durable_goods_boom',
            name: 'Durable Goods Boom',
            description: 'Appliances, electronics, and vehicles sell briskly.',

            effects: {
                indicators: { gdpGrowthRate: 0.004, economicIndex: 4 },
                currencies: { talon: { rate: 4 } }
            }
        },
        {
            id: 'durable_goods_bust',
            name: 'Durable Goods Bust',
            description: 'Big-ticket purchases decline as confidence weakens.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -3 },
                currencies: { talon: { rate: -3 } }
            }
        },
        {
            id: 'nondurable_goods_boom',
            name: 'Nondurable Goods Boom',
            description: 'Food, clothing, and consumables see steady demand.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 2 },
                currencies: { krona: { rate: 2 } }
            }
        },
        {
            id: 'nondurable_goods_bust',
            name: 'Nondurable Goods Bust',
            description: 'Everyday consumable purchases decline.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { krona: { rate: -1 } }
            }
        },
        {
            id: 'retail_sales_boom',
            name: 'Retail Sales Boom',
            description: 'Stores report strong sales across merchandise categories.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'retail_sales_bust',
            name: 'Retail Sales Bust',
            description: 'Store sales decline as consumers hold onto cash.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -3 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'ecommerce_boom',
            name: 'E-Commerce Boom',
            description: 'Online shopping grows rapidly, reshaping retail.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                currencies: { velt: { transferRate: -0.1 } }
            }
        },
        {
            id: 'ecommerce_slowdown',
            name: 'E-Commerce Slowdown',
            description: 'Online shopping growth decelerates after rapid expansion.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { velt: { transferRate: 0.1 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // SERVICES SECTOR (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    services_sector: [
        {
            id: 'services_sector_boom',
            name: 'Services Sector Boom',
            description: 'Hospitality, consulting, and professional services expand.',

            effects: {
                indicators: { gdpGrowthRate: 0.004, economicIndex: 4 },
                currencies: { velt: { rate: 4 } }
            }
        },
        {
            id: 'services_sector_bust',
            name: 'Services Sector Bust',
            description: 'Service businesses see revenue decline.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -3 },
                currencies: { velt: { rate: -3 } }
            }
        },
        {
            id: 'hospitality_boom',
            name: 'Hospitality Boom',
            description: 'Hotels, restaurants, and tourism see strong bookings.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { talon: { rate: 3 } }
            }
        },
        {
            id: 'hospitality_bust',
            name: 'Hospitality Bust',
            description: 'Travel and dining collapse as people stay home.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -4 },
                currencies: { talon: { rate: -4 } }
            }
        },
        {
            id: 'professional_services_boom',
            name: 'Professional Services Boom',
            description: 'Legal, accounting, and consulting firms see strong demand.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { sovereign: { rate: 3 } }
            }
        },
        {
            id: 'professional_services_bust',
            name: 'Professional Services Bust',
            description: 'Businesses cut back on professional services spending.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -2 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'healthcare_spending_rise',
            name: 'Healthcare Spending Rise',
            description: 'Medical costs and healthcare utilization increase.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, inflationRate: 0.003 },
                currencies: { krona: { rate: 2 } }
            }
        },
        {
            id: 'healthcare_spending_drop',
            name: 'Healthcare Spending Drop',
            description: 'Medical utilization and costs decline.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, inflationRate: -0.002 },
                currencies: { krona: { rate: -1 } }
            }
        },
        {
            id: 'education_spending_rise',
            name: 'Education Spending Rise',
            description: 'Families and governments invest more in education.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 3 },
                currencies: { aurel: { rate: 2 } }
            }
        },
        {
            id: 'education_spending_drop',
            name: 'Education Spending Drop',
            description: 'Education budgets are cut across institutions.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -2 },
                currencies: { aurel: { rate: -1 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // TECHNOLOGY SECTOR (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    technology_sector: [
        {
            id: 'tech_sector_boom',
            name: 'Technology Sector Boom',
            description: 'Software, hardware, and internet companies expand rapidly.',

            effects: {
                indicators: { gdpGrowthRate: 0.006, economicIndex: 5 },
                currencies: { velt: { rate: 7 } }
            }
        },
        {
            id: 'tech_sector_bust',
            name: 'Technology Sector Bust',
            description: 'Tech valuations fall and growth slows sharply.',

            effects: {
                indicators: { gdpGrowthRate: -0.004, economicIndex: -5 },
                currencies: { velt: { rate: -5 } }
            }
        },
        {
            id: 'software_industry_growth',
            name: 'Software Industry Growth',
            description: 'Software-as-a-service and enterprise software expand.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                currencies: { velt: { rate: 4 } }
            }
        },
        {
            id: 'software_industry_decline',
            name: 'Software Industry Decline',
            description: 'Software demand weakens as businesses cut IT budgets.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -2 },
                currencies: { velt: { rate: -2 } }
            }
        },
        {
            id: 'semiconductor_boom',
            name: 'Semiconductor Boom',
            description: 'Chip demand surges on AI and device growth.',

            effects: {
                indicators: { gdpGrowthRate: 0.004, economicIndex: 4 },
                currencies: { krona: { rate: 5 } }
            }
        },
        {
            id: 'semiconductor_bust',
            name: 'Semiconductor Bust',
            description: 'Chip oversupply drives prices and volumes down.',

            effects: {
                indicators: { gdpGrowthRate: -0.003, economicIndex: -3 },
                currencies: { krona: { rate: -4 } }
            }
        },
        {
            id: 'telecommunications_expansion',
            name: 'Telecommunications Expansion',
            description: 'Network infrastructure and connectivity grow.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 3 },
                currencies: { talon: { rate: 3 } }
            }
        },
        {
            id: 'telecommunications_decline',
            name: 'Telecommunications Decline',
            description: 'Telecom investment and revenues shrink.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { talon: { rate: -1 } }
            }
        },
        {
            id: 'cloud_computing_adoption',
            name: 'Cloud Computing Adoption',
            description: 'Businesses move workloads to cloud platforms.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                currencies: { velt: { rate: 3 } }
            }
        },
        {
            id: 'cloud_computing_slowdown',
            name: 'Cloud Computing Slowdown',
            description: 'Cloud migration pace decelerates.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { velt: { rate: -1 } }
            }
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // HEALTHCARE SECTOR (10 events)
    // ═════════════════════════════════════════════════════════════════════════════
    healthcare_sector: [
        {
            id: 'healthcare_sector_boom',
            name: 'Healthcare Sector Boom',
            description: 'Medical services, pharma, and devices see strong growth.',

            effects: {
                indicators: { gdpGrowthRate: 0.003, economicIndex: 4 },
                currencies: { krona: { rate: 4 } }
            }
        },
        {
            id: 'healthcare_sector_bust',
            name: 'Healthcare Sector Bust',
            description: 'Healthcare revenues and investment decline.',

            effects: {
                indicators: { gdpGrowthRate: -0.002, economicIndex: -3 },
                currencies: { krona: { rate: -3 } }
            }
        },
        {
            id: 'pharmaceutical_breakthrough',
            name: 'Pharmaceutical Breakthrough',
            description: 'New drugs and treatments create market value.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 4 },
                currencies: { sovereign: { rate: 4 } }
            }
        },
        {
            id: 'pharmaceutical_setback',
            name: 'Pharmaceutical Setback',
            description: 'Drug trials fail or regulatory approvals are denied.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -2 },
                currencies: { sovereign: { rate: -2 } }
            }
        },
        {
            id: 'medical_device_demand',
            name: 'Medical Device Demand',
            description: 'Hospitals and clinics buy more equipment.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { talon: { rate: 2 } }
            }
        },
        {
            id: 'medical_device_decline',
            name: 'Medical Device Decline',
            description: 'Equipment purchases fall as budgets tighten.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { talon: { rate: -1 } }
            }
        },
        {
            id: 'health_insurance_expansion',
            name: 'Health Insurance Expansion',
            description: 'More people gain health coverage.',

            effects: {
                indicators: { gdpGrowthRate: 0.001, economicIndex: 2 },
                currencies: { velt: { rate: 2 } }
            }
        },
        {
            id: 'health_insurance_contraction',
            name: 'Health Insurance Contraction',
            description: 'Coverage rolls back, leaving more uninsured.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -1 },
                currencies: { velt: { rate: -1 } }
            }
        },
        {
            id: 'biotech_investment_surge',
            name: 'Biotech Investment Surge',
            description: 'Capital flows into biotechnology startups.',

            effects: {
                indicators: { gdpGrowthRate: 0.002, economicIndex: 4 },
                currencies: { velt: { rate: 4 } }
            }
        },
        {
            id: 'biotech_investment_drop',
            name: 'Biotech Investment Drop',
            description: 'Capital exits biotechnology ventures.',

            effects: {
                indicators: { gdpGrowthRate: -0.001, economicIndex: -2 },
                currencies: { velt: { rate: -2 } }
            }
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomicEvents;
} else if (typeof window !== 'undefined') {
    window.EconomicEvents = EconomicEvents;
}



