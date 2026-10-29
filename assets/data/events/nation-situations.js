/**
 * Nation Situations System Data
 * Dominion Wars - Nation Building Strategy Game
 *
 * Nation-level situations that require player decisions.
 * Each situation presents exactly 3 choice options with different outcomes.
 *
 * Allowed effect keys:
 *   literacy     → nationStats.literacy (0-100)
 *   pollution    → nationStats.pollution (0-100)
 *   environment  → nationStats.environment (0-100)
 *   infra_cost   → temporary multiplier on infraCost() (e.g. 0.9 = 10% cheaper)
 *   land_cost    → temporary multiplier on landCost()
 *   tech_cost    → temporary multiplier on techCost()
 *   infra_upkeep → temporary change to daily infrastructure upkeep cost
 *   money        → negative = % of current holdings scaled by amount magnitude
 *                  (5% min at ~1000, 20% max at ~15000+), positive = flat amount
 *
 * Duration is situation-level (applies to all choices). Money costs use
 * percentage-based scaling: larger absolute values cost a larger percent.
 */

var NationSituations = {
    // ═════════════════════════════════════════════════════════════════════════════
    // ENVIRONMENT & POLLUTION (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    environment: [
        {
            id: 'smog_alert',
            title: 'Smog Alert',
            description: 'Industrial zones are producing hazardous smog levels, reducing air quality across the capital.',
            duration: 30,
            choices: [
                {
                    text: 'Implement emergency emissions restrictions',
                    effects: { pollution: -15, environment: 5, infra_cost: 1.1 }
                },
                {
                    text: 'Install smog filters on major factories',
                    effects: { pollution: -10, environment: 3, money: -5000, infra_cost: 1.05 }
                },
                {
                    text: 'Ignore the issue and prioritize production',
                    effects: { pollution: 10, environment: -8 }
                }
            ]
        },
        {
            id: 'toxic_spill',
            title: 'Toxic Waste Spill',
            description: 'A chemical storage facility has leaked toxic waste into a nearby river, contaminating water supplies.',
            duration: 45,
            choices: [
                {
                    text: 'Emergency containment and cleanup',
                    effects: { pollution: -20, environment: 10, money: -10000 }
                },
                {
                    text: 'Fine the company and let them handle it',
                    effects: { pollution: -8, environment: 3, money: 2000 }
                },
                {
                    text: 'Classify the spill as minor',
                    effects: { pollution: 8, environment: -5 }
                }
            ]
        },
        {
            id: 'reforestation_opportunity',
            title: 'Reforestation Opportunity',
            description: 'A conservation group offers to plant trees on unused government land at no cost.',
            duration: 90,
            choices: [
                {
                    text: 'Accept and expand the program nationwide',
                    effects: { environment: 12, pollution: -5 }
                },
                {
                    text: 'Accept but limit to the capital region',
                    effects: { environment: 6, pollution: -2 }
                },
                {
                    text: 'Decline - the land has better commercial use',
                    effects: { environment: -3, pollution: 3, land_cost: 0.95 }
                }
            ]
        },
        {
            id: 'green_energy_subsidy',
            title: 'Green Energy Subsidy Program',
            description: 'International donors offer subsidies for renewable energy infrastructure.',
            duration: 60,
            choices: [
                {
                    text: 'Accept and build solar and wind farms',
                    effects: { pollution: -12, environment: 8, infra_cost: 0.9, tech_cost: 1.05 }
                },
                {
                    text: 'Accept but only for pilot projects',
                    effects: { pollution: -5, environment: 4, infra_cost: 0.95 }
                },
                {
                    text: 'Decline - stick with proven energy sources',
                    effects: { pollution: 5, environment: -3, infra_cost: 0.98 }
                }
            ]
        },
        {
            id: 'air_quality_regulations',
            title: 'Air Quality Regulations Debate',
            description: 'Parliament is debating strict new air quality standards for vehicles and factories.',
            duration: 90,
            choices: [
                {
                    text: 'Pass the strictest regulations',
                    effects: { pollution: -15, environment: 10, infra_cost: 1.15, tech_cost: 1.1 }
                },
                {
                    text: 'Pass moderate regulations',
                    effects: { pollution: -8, environment: 5, infra_cost: 1.05 }
                },
                {
                    text: 'Reject the regulations',
                    effects: { pollution: 10, environment: -6, infra_cost: 0.95, tech_cost: 0.95 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // LITERACY & EDUCATION (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    literacy: [
        {
            id: 'teacher_strike',
            title: 'Teacher Strike',
            description: 'Teachers nationwide are striking for better pay and classroom conditions.',
            duration: 45,
            choices: [
                {
                    text: 'Accept teacher demands and raise salaries',
                    effects: { literacy: 3, money: -8000, infra_upkeep: 2 }
                },
                {
                    text: 'Hire replacement teachers',
                    effects: { literacy: -2 }
                },
                {
                    text: 'Mandate binding arbitration',
                    effects: { literacy: 1, money: -3000 }
                }
            ]
        },
        {
            id: 'adult_literacy_campaign',
            title: 'Adult Literacy Campaign',
            description: 'A significant portion of adults cannot read or write, limiting workforce potential.',
            duration: 60,
            choices: [
                {
                    text: 'Launch nationwide adult education program',
                    effects: { literacy: 8, money: -12000 }
                },
                {
                    text: 'Partner with NGOs for community classes',
                    effects: { literacy: 4, money: -5000 }
                },
                {
                    text: 'Focus on children only for now',
                    effects: { literacy: 2 }
                }
            ]
        },
        {
            id: 'school_closure_wave',
            title: 'Rural School Closure Wave',
            description: 'Declining rural enrollment is forcing the closure of small village schools.',
            duration: 30,
            choices: [
                {
                    text: 'Provide transportation to centralized schools',
                    effects: { literacy: 2, money: -6000 }
                },
                {
                    text: 'Allow closures and save funds',
                    effects: { literacy: -3, environment: -2 }
                },
                {
                    text: 'Convert schools to community centers',
                    effects: { literacy: 1, money: -4000 }
                }
            ]
        },
        {
            id: 'university_expansion',
            title: 'University Expansion Proposal',
            description: 'The national university wants to expand enrollment and build new faculties.',
            duration: 90,
            choices: [
                {
                    text: 'Fund the expansion fully',
                    effects: { literacy: 6, tech_cost: 0.95, money: -15000 }
                },
                {
                    text: 'Allow private funding with tuition hikes',
                    effects: { literacy: 3, tech_cost: 0.98 }
                },
                {
                    text: 'Delay expansion for budget review',
                    effects: { tech_cost: 1.02 }
                }
            ]
        },
        {
            id: 'digital_learning_initiative',
            title: 'Digital Learning Initiative',
            description: 'A tech company offers to provide tablets and internet to all schools.',
            duration: 45,
            choices: [
                {
                    text: 'Accept and integrate into curriculum',
                    effects: { literacy: 5, tech_cost: 1.05, money: -7000 }
                },
                {
                    text: 'Pilot in urban schools only',
                    effects: { literacy: 2, tech_cost: 1.02 }
                },
                {
                    text: 'Decline - concerns about screen time and distraction',
                    effects: { literacy: -1 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INFRASTRUCTURE COSTS (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    infra_cost: [
        {
            id: 'construction_material_shortage',
            title: 'Construction Material Shortage',
            description: 'Global supply chain issues have caused steel and concrete prices to spike.',
            duration: 45,
            choices: [
                {
                    text: 'Subsidize material imports',
                    effects: { infra_cost: 0.9, money: -10000 }
                },
                {
                    text: 'Delay non-essential infrastructure projects',
                    effects: { infra_cost: 1.05, environment: 2 }
                },
                {
                    text: 'Mandate recycled materials in all projects',
                    effects: { infra_cost: 1.1, environment: 5, pollution: -3 }
                }
            ]
        },
        {
            id: 'infrastructure_maintenance_backlog',
            title: 'Infrastructure Maintenance Backlog',
            description: 'Years of deferred maintenance have left roads and bridges in poor condition.',
            duration: 60,
            choices: [
                {
                    text: 'Launch nationwide repair program',
                    effects: { infra_upkeep: 5, environment: 3, money: -15000 }
                },
                {
                    text: 'Prioritize major highways only',
                    effects: { infra_upkeep: 2, environment: -1 }
                },
                {
                    text: 'Increase tolls to fund repairs',
                    effects: { infra_upkeep: -1 }
                }
            ]
        },
        {
            id: 'public_private_partnership_offer',
            title: 'Public-Private Partnership Offer',
            description: 'A consortium offers to build and maintain infrastructure in exchange for user fees.',
            duration: 90,
            choices: [
                {
                    text: 'Accept the partnership',
                    effects: { infra_cost: 0.85, infra_upkeep: -3 }
                },
                {
                    text: 'Accept with strict government oversight',
                    effects: { infra_cost: 0.92, infra_upkeep: -1, money: -4000 }
                },
                {
                    text: 'Keep infrastructure fully public',
                    effects: { infra_cost: 1.05 }
                }
            ]
        },
        {
            id: 'infrastructure_bond_issue',
            title: 'Infrastructure Bond Issue',
            description: 'The treasury proposes issuing bonds to fund a major infrastructure upgrade.',
            duration: 90,
            choices: [
                {
                    text: 'Issue bonds and upgrade everything',
                    effects: { infra_cost: 0.9, money: -5000, infra_upkeep: 3 }
                },
                {
                    text: 'Issue smaller bonds for critical projects',
                    effects: { infra_cost: 0.95, money: -2000 }
                },
                {
                    text: 'Reject - avoid increasing national debt',
                    effects: { infra_cost: 1.08 }
                }
            ]
        },
        {
            id: 'smart_city_pilot',
            title: 'Smart City Pilot Program',
            description: 'A technology firm proposes installing smart sensors and automated systems in the capital.',
            duration: 60,
            choices: [
                {
                    text: 'Launch the full pilot program',
                    effects: { tech_cost: 0.95, infra_cost: 0.92, money: -12000 }
                },
                {
                    text: 'Pilot in one district first',
                    effects: { tech_cost: 0.98, money: -5000 }
                },
                {
                    text: 'Decline - privacy and cost concerns',
                    effects: { tech_cost: 1.03 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // LAND COSTS (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    land_cost: [
        {
            id: 'land_speculation_boom',
            title: 'Land Speculation Boom',
            description: 'Investors are buying up land, driving prices up across the nation.',
            duration: 60,
            choices: [
                {
                    text: 'Implement land value tax',
                    effects: { land_cost: 0.85, money: 5000 }
                },
                {
                    text: 'Restrict foreign land ownership',
                    effects: { land_cost: 0.9, environment: 2 }
                },
                {
                    text: 'Let the market set prices',
                    effects: { land_cost: 1.15, money: 8000 }
                }
            ]
        },
        {
            id: 'eminent_domain_dispute',
            title: 'Eminent Domain Dispute',
            description: 'Property owners are resisting government acquisition of land for public projects.',
            duration: 30,
            choices: [
                {
                    text: 'Offer fair market compensation',
                    effects: { land_cost: 1.05, money: -10000 }
                },
                {
                    text: 'Proceed with forced acquisition',
                    effects: { land_cost: 0.8 }
                },
                {
                    text: 'Cancel the projects and return the land',
                    effects: { land_cost: 1.1, environment: 3 }
                }
            ]
        },
        {
            id: 'agricultural_land_conversion',
            title: 'Agricultural Land Conversion',
            description: 'Farmers are selling fertile land to developers for housing and commercial use.',
            duration: 60,
            choices: [
                {
                    text: 'Subsidize farmers to keep land in production',
                    effects: { land_cost: 1.05, money: -8000, environment: 2 }
                },
                {
                    text: 'Allow conversion for development',
                    effects: { land_cost: 0.9, pollution: 3, environment: -4 }
                },
                {
                    text: 'Designate protected agricultural zones',
                    effects: { land_cost: 1.1, environment: 5 }
                }
            ]
        },
        {
            id: 'urban_expansion_plan',
            title: 'Urban Expansion Plan',
            description: 'The capital is running out of space and needs to expand into surrounding areas.',
            duration: 90,
            choices: [
                {
                    text: 'Approve planned expansion with zoning',
                    effects: { land_cost: 0.95, pollution: 2, environment: -2 }
                },
                {
                    text: 'Encourage denser development instead',
                    effects: { land_cost: 1.1, pollution: -1 }
                },
                {
                    text: 'Limit expansion to protect greenbelts',
                    effects: { land_cost: 1.2, environment: 6 }
                }
            ]
        },
        {
            id: 'disputed_border_land',
            title: 'Disputed Border Land',
            description: 'A neighboring country claims a strip of border land rich in resources.',
            duration: 60,
            choices: [
                {
                    text: 'Negotiate a shared use agreement',
                    effects: { land_cost: 0.95 }
                },
                {
                    text: 'Assert sovereignty and develop the land',
                    effects: { land_cost: 0.85 }
                },
                {
                    text: 'Refer to international arbitration',
                    effects: { land_cost: 1.0 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // TECHNOLOGY COSTS (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    tech_cost: [
        {
            id: 'research_grant_cuts',
            title: 'Research Grant Cuts',
            description: 'The government is considering reducing funding for scientific research.',
            duration: 60,
            choices: [
                {
                    text: 'Maintain research funding levels',
                    effects: { tech_cost: 1.05, money: -8000 }
                },
                {
                    text: 'Cut grants but offer tax incentives',
                    effects: { tech_cost: 1.0, money: 3000 }
                },
                {
                    text: 'Eliminate research grants entirely',
                    effects: { tech_cost: 1.15 }
                }
            ]
        },
        {
            id: 'brain_drain_crisis',
            title: 'Brain Drain Crisis',
            description: 'Top scientists and engineers are emigrating to other countries.',
            duration: 45,
            choices: [
                {
                    text: 'Offer retention bonuses and research visas',
                    effects: { tech_cost: 0.95, literacy: 3, money: -10000 }
                },
                {
                    text: 'Improve domestic research facilities',
                    effects: { tech_cost: 0.9, literacy: 2, money: -15000 }
                },
                {
                    text: 'Accept the loss and focus on basics',
                    effects: { tech_cost: 1.1 }
                }
            ]
        },
        {
            id: 'patent_law_reform',
            title: 'Patent Law Reform',
            description: 'Lawmakers are debating changes to intellectual property protections.',
            duration: 45,
            choices: [
                {
                    text: 'Strengthen patent protections',
                    effects: { tech_cost: 1.05, money: 4000 }
                },
                {
                    text: 'Allow compulsory licensing for essential tech',
                    effects: { tech_cost: 0.9, money: -2000 }
                },
                {
                    text: 'Maintain current patent laws',
                    effects: { tech_cost: 0.98 }
                }
            ]
        },
        {
            id: 'tech_incubator_scandal',
            title: 'Tech Incubator Scandal',
            description: 'A government-funded tech incubator is accused of misusing public funds.',
            duration: 30,
            choices: [
                {
                    text: 'Investigate and prosecute',
                    effects: { tech_cost: 1.05, money: -6000 }
                },
                {
                    text: 'Provide additional oversight and continue',
                    effects: { tech_cost: 0.98, money: -4000 }
                },
                {
                    text: 'Shut down the program',
                    effects: { tech_cost: 1.12 }
                }
            ]
        },
        {
            id: 'quantum_computing_breakthrough',
            title: 'Quantum Computing Breakthrough',
            description: 'A domestic lab has made progress in quantum computing that could revolutionize technology.',
            duration: 90,
            choices: [
                {
                    text: 'Fund rapid commercialization',
                    effects: { tech_cost: 0.85, money: -20000 }
                },
                {
                    text: 'Support research but limit applications',
                    effects: { tech_cost: 0.9, money: -8000 }
                },
                {
                    text: 'Classify the technology for national security',
                    effects: { tech_cost: 1.05 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // ENERGY & UTILITIES (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    energy: [
        {
            id: 'power_grid_overload',
            title: 'Power Grid Overload',
            description: 'Peak demand is exceeding generation capacity, causing rolling blackouts.',
            duration: 30,
            choices: [
                {
                    text: 'Upgrade grid infrastructure immediately',
                    effects: { infra_cost: 1.1, pollution: -3, money: -15000 }
                },
                {
                    text: 'Implement demand-response pricing',
                    effects: { infra_cost: 0.95, money: -3000 }
                },
                {
                    text: 'Temporary rolling blackouts',
                    effects: { pollution: -5, environment: 2 }
                }
            ]
        },
        {
            id: 'coal_plant_retirement',
            title: 'Coal Plant Retirement',
            description: 'The oldest coal-fired power plant is reaching end of life.',
            duration: 90,
            choices: [
                {
                    text: 'Replace with natural gas plant',
                    effects: { pollution: -8, environment: 4, infra_cost: 1.05 }
                },
                {
                    text: 'Replace with renewable energy',
                    effects: { pollution: -15, environment: 10, infra_cost: 1.2, tech_cost: 1.05 }
                },
                {
                    text: 'Extend coal plant life with retrofits',
                    effects: { pollution: 5, environment: -6, infra_cost: 0.9 }
                }
            ]
        },
        {
            id: 'nuclear_power_debate',
            title: 'Nuclear Power Expansion',
            description: 'Proposals to build new nuclear reactors for baseload power.',
            duration: 90,
            choices: [
                {
                    text: 'Approve new nuclear construction',
                    effects: { pollution: -12, environment: 3, infra_cost: 1.3, tech_cost: 1.1 }
                },
                {
                    text: 'Study nuclear option further',
                    effects: { money: -5000 }
                },
                {
                    text: 'Ban nuclear power entirely',
                    effects: { pollution: 8, environment: -5, infra_cost: 0.95 }
                }
            ]
        },
        {
            id: 'energy_efficiency_standards',
            title: 'Energy Efficiency Standards',
            description: 'New appliance and building efficiency standards are proposed.',
            duration: 60,
            choices: [
                {
                    text: 'Adopt strict efficiency standards',
                    effects: { pollution: -6, environment: 4, tech_cost: 1.02 }
                },
                {
                    text: 'Voluntary standards only',
                    effects: { pollution: -2, environment: 1 }
                },
                {
                    text: 'Oppose new regulations',
                    effects: { pollution: 3, environment: -2, tech_cost: 0.98 }
                }
            ]
        },
        {
            id: 'smart_grid_rollout',
            title: 'Smart Grid Rollout',
            description: 'Deploy smart meters and automated grid management nationwide.',
            duration: 60,
            choices: [
                {
                    text: 'Full smart grid deployment',
                    effects: { pollution: -5, environment: 4, tech_cost: 0.95, infra_cost: 1.1 }
                },
                {
                    text: 'Pilot in major cities only',
                    effects: { pollution: -2, environment: 2, tech_cost: 0.98 }
                },
                {
                    text: 'Defer smart grid investment',
                    effects: { pollution: 2, environment: -1, infra_cost: 0.97 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // TRANSPORTATION & LOGISTICS (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    transportation: [
        {
            id: 'highway_expansion',
            title: 'Highway Expansion Project',
            description: 'Major highway corridors are congested and need expansion.',
            duration: 60,
            choices: [
                {
                    text: 'Build new highway lanes',
                    effects: { infra_cost: 1.15, pollution: 5, environment: -4 }
                },
                {
                    text: 'Implement congestion pricing',
                    effects: { infra_cost: 0.9, pollution: -3, money: 8000 }
                },
                {
                    text: 'Improve public transit instead',
                    effects: { pollution: -4, environment: 3, infra_cost: 1.05 }
                }
            ]
        },
        {
            id: 'rail_network_modernization',
            title: 'Rail Network Modernization',
            description: 'The national rail system needs upgrades for freight and passenger service.',
            duration: 90,
            choices: [
                {
                    text: 'High-speed rail network',
                    effects: { infra_cost: 1.4, pollution: -8, environment: 6, tech_cost: 1.05 }
                },
                {
                    text: 'Upgrade existing rail lines',
                    effects: { infra_cost: 1.1, pollution: -3, environment: 2 }
                },
                {
                    text: 'Maintain current rail service',
                    effects: { pollution: 2, environment: -1, infra_cost: 0.95 }
                }
            ]
        },
        {
            id: 'electric_vehicle_incentives',
            title: 'Electric Vehicle Incentives',
            description: 'Subsidies and infrastructure for EV adoption are being considered.',
            duration: 45,
            choices: [
                {
                    text: 'Generous EV purchase subsidies',
                    effects: { pollution: -8, environment: 5, money: -12000 }
                },
                {
                    text: 'Build public charging network',
                    effects: { pollution: -4, environment: 3, infra_cost: 1.05 }
                },
                {
                    text: 'No EV incentives',
                    effects: { pollution: 3, environment: -2, money: 4000 }
                }
            ]
        },
        {
            id: 'port_expansion',
            title: 'Port Expansion',
            description: 'Container port capacity is insufficient for growing trade volumes.',
            duration: 60,
            choices: [
                {
                    text: 'Expand port facilities',
                    effects: { infra_cost: 1.2, pollution: 6, environment: -3 }
                },
                {
                    text: 'Optimize existing port operations',
                    effects: { infra_cost: 0.95, pollution: -2, money: -5000 }
                },
                {
                    text: 'Develop inland port alternatives',
                    effects: { infra_cost: 1.05, pollution: -1, land_cost: 1.02 }
                }
            ]
        },
        {
            id: 'aviation_infrastructure',
            title: 'Aviation Infrastructure Upgrade',
            description: 'International airports need runway and terminal expansions.',
            duration: 90,
            choices: [
                {
                    text: 'Expand primary international airport',
                    effects: { infra_cost: 1.25, pollution: 7, environment: -5 }
                },
                {
                    text: 'Regional airport development',
                    effects: { infra_cost: 1.1, pollution: 3, environment: -2 }
                },
                {
                    text: 'Modernize air traffic control',
                    effects: { pollution: -3, environment: 1, tech_cost: 1.03 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // HOUSING & REAL ESTATE (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    housing: [
        {
            id: 'affordable_housing_crisis',
            title: 'Affordable Housing Crisis',
            description: 'Rising property prices are pricing out middle-income families.',
            duration: 60,
            choices: [
                {
                    text: 'Rent control and housing subsidies',
                    effects: { land_cost: 0.9, money: -8000 }
                },
                {
                    text: 'Streamline housing development approvals',
                    effects: { land_cost: 0.95, environment: -2 }
                },
                {
                    text: 'Public housing construction program',
                    effects: { land_cost: 1.05, infra_cost: 1.05, money: -15000 }
                }
            ]
        },
        {
            id: 'zoning_reform',
            title: 'Zoning Reform Debate',
            description: 'Restrictive zoning laws are limiting housing density and development.',
            duration: 90,
            choices: [
                {
                    text: 'Upzone residential neighborhoods',
                    effects: { land_cost: 0.85, environment: -3 }
                },
                {
                    text: 'Preserve single-family neighborhoods',
                    effects: { land_cost: 1.1, environment: 2 }
                },
                {
                    text: 'Mixed-use transit-oriented development',
                    effects: { land_cost: 0.9, infra_cost: 1.02, pollution: -2 }
                }
            ]
        },
        {
            id: 'commercial_real_estate_glut',
            title: 'Commercial Real Estate Glut',
            description: 'Office and retail vacancy rates are rising after shifts in work patterns.',
            duration: 45,
            choices: [
                {
                    text: 'Convert vacant offices to housing',
                    effects: { land_cost: 0.95, environment: 3 }
                },
                {
                    text: 'Tax incentives for adaptive reuse',
                    effects: { land_cost: 0.98, money: -4000 }
                },
                {
                    text: 'No intervention',
                    effects: { land_cost: 1.05, environment: -1 }
                }
            ]
        },
        {
            id: 'property_tax_reassessment',
            title: 'Property Tax Reassessment',
            description: 'Property values have risen and reassessment is overdue.',
            duration: 30,
            choices: [
                {
                    text: 'Full reassessment at market value',
                    effects: { land_cost: 1.1, money: 15000 }
                },
                {
                    text: 'Phase in reassessment over 5 years',
                    effects: { land_cost: 1.03, money: 5000 }
                },
                {
                    text: 'Freeze property tax assessments',
                    effects: { land_cost: 0.95, money: -8000 }
                }
            ]
        },
        {
            id: 'gentrification_displacement',
            title: 'Gentrification and Displacement',
            description: 'Rising rents are displacing long-time residents from historic neighborhoods.',
            duration: 60,
            choices: [
                {
                    text: 'Tenant protection and anti-eviction laws',
                    effects: { land_cost: 1.05, money: -3000 }
                },
                {
                    text: 'Inclusionary housing requirements',
                    effects: { land_cost: 1.02, environment: 1 }
                },
                {
                    text: 'Market-based approach',
                    effects: { land_cost: 0.95, environment: -2 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INDUSTRY & MANUFACTURING (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    industry: [
        {
            id: 'steel_mill_modernization',
            title: 'Steel Mill Modernization',
            description: 'Domestic steel production is outdated and uncompetitive.',
            duration: 90,
            choices: [
                {
                    text: 'Government-backed modernization',
                    effects: { pollution: 5, environment: -4, infra_cost: 1.15, money: -20000 }
                },
                {
                    text: 'Private sector-led upgrades',
                    effects: { pollution: 3, environment: -2, infra_cost: 1.05 }
                },
                {
                    text: 'Phase out domestic steel production',
                    effects: { pollution: -10, environment: 6, infra_cost: 0.9 }
                }
            ]
        },
        {
            id: 'chemical_plant_safety',
            title: 'Chemical Plant Safety Review',
            description: 'A chemical facility near a residential area has safety violations.',
            duration: 45,
            choices: [
                {
                    text: 'Mandatory safety upgrades and monitoring',
                    effects: { pollution: -8, environment: 5, infra_cost: 1.05 }
                },
                {
                    text: 'Relocate plant away from residential areas',
                    effects: { pollution: -5, environment: 4, land_cost: 1.05 }
                },
                {
                    text: 'Accept current risk levels',
                    effects: { pollution: 6, environment: -4 }
                }
            ]
        },
        {
            id: 'manufacturing_incentives',
            title: 'Manufacturing Incentives Package',
            description: 'Tax incentives to attract new manufacturing investment.',
            duration: 60,
            choices: [
                {
                    text: 'Generous manufacturing tax credits',
                    effects: { pollution: 4, environment: -3, infra_cost: 1.05, money: -10000 }
                },
                {
                    text: 'Targeted high-tech manufacturing incentives',
                    effects: { pollution: 1, environment: -1, tech_cost: 0.95 }
                },
                {
                    text: 'No manufacturing incentives',
                    effects: { pollution: -2, environment: 1, money: 3000 }
                }
            ]
        },
        {
            id: 'textile_factory_closure',
            title: 'Textile Factory Closure Wave',
            description: 'Domestic textile factories are closing due to import competition.',
            duration: 30,
            choices: [
                {
                    text: 'Retraining program for displaced workers',
                    effects: { literacy: 3, money: -7000 }
                },
                {
                    text: 'Import tariffs on textiles',
                    effects: { pollution: -2, environment: 1, land_cost: 1.02 }
                },
                {
                    text: 'Allow market adjustment',
                    effects: { pollution: -1, environment: 1, money: 2000 }
                }
            ]
        },
        {
            id: 'industrial_park_development',
            title: 'Industrial Park Development',
            description: 'A new industrial park is proposed on the outskirts of the city.',
            duration: 60,
            choices: [
                {
                    text: 'Develop industrial park with incentives',
                    effects: { pollution: 6, environment: -4, infra_cost: 1.1, land_cost: 0.95 }
                },
                {
                    text: 'Eco-industrial park with green standards',
                    effects: { pollution: 1, environment: 1, infra_cost: 1.15 }
                },
                {
                    text: 'Reject industrial park proposal',
                    effects: { pollution: -3, environment: 3, land_cost: 1.05 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // FOREIGN TRADE & DIPLOMACY (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    trade: [
        {
            id: 'free_trade_agreement',
            title: 'Free Trade Agreement Negotiation',
            description: 'A major trading partner proposes a comprehensive free trade deal.',
            duration: 60,
            choices: [
                {
                    text: 'Sign the free trade agreement',
                    effects: { land_cost: 1.05, money: 10000, tech_cost: 0.98 }
                },
                {
                    text: 'Negotiate with protections for domestic industry',
                    effects: { land_cost: 1.02, money: 5000 }
                },
                {
                    text: 'Decline the agreement',
                    effects: { land_cost: 0.95, money: -3000 }
                }
            ]
        },
        {
            id: 'import_tariff_debate',
            title: 'Import Tariff Debate',
            description: 'Proposed tariffs on imported goods to protect domestic industry.',
            duration: 45,
            choices: [
                {
                    text: 'Implement selective tariffs',
                    effects: { land_cost: 1.03, money: 6000, pollution: 1 }
                },
                {
                    text: 'Broad across-the-board tariffs',
                    effects: { land_cost: 1.08, money: 12000, pollution: 2 }
                },
                {
                    text: 'Maintain free trade',
                    effects: { land_cost: 0.97, money: -4000 }
                }
            ]
        },
        {
            id: 'foreign_investment_board',
            title: 'Foreign Investment Review Board',
            description: 'Foreign investors are buying domestic land and infrastructure assets.',
            duration: 90,
            choices: [
                {
                    text: 'Welcome foreign investment',
                    effects: { land_cost: 1.15, money: 20000, infra_cost: 0.95 }
                },
                {
                    text: 'Restrict foreign ownership of land',
                    effects: { land_cost: 0.9, money: -8000 }
                },
                {
                    text: 'Case-by-case review process',
                    effects: { land_cost: 1.05, money: 5000 }
                }
            ]
        },
        {
            id: 'trade_embargo_impact',
            title: 'Trade Embargo Impact',
            description: 'An embargo on a key trading partner is disrupting supply chains.',
            duration: 30,
            choices: [
                {
                    text: 'Find alternative trading partners',
                    effects: { land_cost: 1.02, money: -5000 }
                },
                {
                    text: 'Stockpile critical goods',
                    effects: { land_cost: 1.05, infra_cost: 1.02, money: -10000 }
                },
                {
                    text: 'Negotiate embargo exemption',
                    effects: { land_cost: 1.0, money: -2000 }
                }
            ]
        },
        {
            id: 'currency_manipulation_accusation',
            title: 'Currency Manipulation Accusation',
            description: "Trading partners accuse the nation of currency manipulation.",
            duration: 45,
            choices: [
                {
                    text: 'Allow currency to float freely',
                    effects: { land_cost: 0.98, tech_cost: 1.02 }
                },
                {
                    text: 'Maintain currency peg',
                    effects: { land_cost: 1.02, money: -5000 }
                },
                {
                    text: 'Intervene in currency markets',
                    effects: { land_cost: 1.05, money: -15000 }
                }
            ]
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NationSituations;
} else if (typeof window !== 'undefined') {
    window.NationSituations = NationSituations;
}
