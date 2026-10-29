/**
 * Military Situations System Data
 * Dominion Wars - Nation Building Strategy Game
 *
 * Peacetime military situations that require player decisions.
 * Each situation presents exactly 3 choice options with different outcomes.
 *
 * Allowed effect keys:
 *   soldier_upkeep   → temporary multiplier on daily soldier upkeep cost
 *   tank_upkeep      → temporary multiplier on daily tank upkeep cost
 *   aircraft_upkeep  → temporary multiplier on daily aircraft upkeep cost
 *   ship_upkeep      → temporary multiplier on daily ship upkeep cost
 *   spy_upkeep       → temporary multiplier on daily spy upkeep cost
 *   missile_upkeep   → temporary multiplier on daily missile upkeep cost
 *   nuke_upkeep      → temporary multiplier on daily nuke upkeep cost
 *   soldier_cost     → temporary multiplier on soldier build cost
 *   tank_cost        → temporary multiplier on tank build cost
 *   aircraft_cost    → temporary multiplier on aircraft build cost
 *   ship_cost        → temporary multiplier on ship build cost
 *   spy_cost         → temporary multiplier on spy build cost
 *   missile_cost     → temporary multiplier on missile build cost
 *   nuke_cost        → temporary multiplier on nuke build cost
 *   military_morale  → additive to nationStats.militaryMorale (clamped 0.5-1.5)
 *
 * Duration is situation-level (applies to all choices). Money costs are
 * calculated at runtime as 5-20% of current holdings when negative.
 *
 * All situations here are peacetime (war_peace: 'peace'). Wartime situations
 * will be added separately with war_peace: 'war'.
 */

var MilitarySituations = {
    // ═════════════════════════════════════════════════════════════════════════════
    // RECRUITMENT & TRAINING (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    recruitment: [
        {
            id: 'volunteer_drive',
            title: 'Volunteer Recruitment Drive',
            description: 'A patriotic surge has citizens volunteering for military service in record numbers.',
            duration: 45,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Accept all volunteers and expand ranks',
                    effects: { soldier_cost: 0.9, military_morale: 0.1 }
                },
                {
                    text: 'Accept volunteers but keep current troop levels',
                    effects: { soldier_cost: 0.95 }
                },
                {
                    text: 'Turn away excess volunteers',
                    effects: { military_morale: -0.05 }
                }
            ]
        },
        {
            id: 'basic_training_backlog',
            title: 'Basic Training Backlog',
            description: 'Training facilities are overwhelmed with new recruits needing basic instruction.',
            duration: 30,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Fund additional training instructors',
                    effects: { soldier_cost: 1.05, military_morale: 0.05 },
                },
                {
                    text: 'Extend training duration for better quality',
                    effects: { soldier_cost: 0.98 },
                },
                {
                    text: 'Compress training to speed throughput',
                    effects: { soldier_cost: 1.1, military_morale: -0.05 },
                }
            ]
        },
        {
            id: 'reserve_callup_drill',
            title: 'Reserve Call-up Drill',
            description: 'Annual reserve training exercise is scheduled across multiple bases.',
            duration: 14,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full drill with live-fire exercises',
                    effects: { soldier_upkeep: 1.15, military_morale: 0.1 },
                },
                {
                    text: 'Limited drill, classroom only',
                    effects: { soldier_upkeep: 1.05 },
                },
                {
                    text: 'Cancel drill to save funds',
                    effects: { soldier_upkeep: 0.9, military_morale: -0.08 },
                }
            ]
        },
        {
            id: 'officer_academy_expansion',
            title: 'Officer Academy Expansion',
            description: 'The military academy requests funding to increase officer training capacity.',
            duration: 90,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Approve full expansion',
                    effects: { soldier_cost: 1.1, military_morale: 0.15 },
                },
                {
                    text: 'Moderate expansion',
                    effects: { soldier_cost: 1.05, military_morale: 0.05 },
                },
                {
                    text: 'Defer expansion',
                    effects: { soldier_cost: 0.95 },
                }
            ]
        },
        {
            id: 'special_forces_selection',
            title: 'Special Forces Selection Course',
            description: 'The elite special forces selection course is running with high attrition rates.',
            duration: 60,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Increase selection slots',
                    effects: { soldier_cost: 1.2, military_morale: 0.1 },
                },
                {
                    text: 'Maintain current selection standards',
                    effects: { soldier_cost: 1.05 },
                },
                {
                    text: 'Reduce selection frequency',
                    effects: { soldier_cost: 0.9, military_morale: -0.03 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // ARMOR & MECHANIZED (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    armor: [
        {
            id: 'tank_maintenance_contract',
            title: 'Tank Maintenance Contract',
            description: 'The defense ministry is renewing the annual tank fleet maintenance contract.',
            duration: 60,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Premium full-service contract',
                    effects: { tank_upkeep: 0.9, tank_cost: 1.05 },
                },
                {
                    text: 'Standard maintenance contract',
                    effects: { tank_upkeep: 1.0 },
                },
                {
                    text: 'Defer maintenance to save money',
                    effects: { tank_upkeep: 1.25, tank_cost: 0.95 },
                }
            ]
        },
        {
            id: 'armor_upgrade_program',
            title: 'Armor Upgrade Program',
            description: 'Existing tanks can be upgraded with modern fire control and armor packages.',
            duration: 90,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full fleet upgrade program',
                    effects: { tank_cost: 1.15, military_morale: 0.1 },
                },
                {
                    text: 'Upgrade frontline units only',
                    effects: { tank_cost: 1.08, military_morale: 0.05 },
                },
                {
                    text: 'Skip upgrades this year',
                    effects: { tank_cost: 0.95, military_morale: -0.03 },
                }
            ]
        },
        {
            id: 'tank_manufacturing_license',
            title: 'Tank Manufacturing License',
            description: 'A foreign manufacturer offers to license tank production domestically.',
            duration: 120,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Accept license and build domestically',
                    effects: { tank_cost: 0.85, military_morale: 0.08 },
                },
                {
                    text: 'Import tanks instead',
                    effects: { tank_cost: 1.1 },
                },
                {
                    text: 'Decline the offer',
                    effects: { tank_cost: 1.0 },
                }
            ]
        },
        {
            id: 'armored_vehicle_shortage',
            title: 'Armored Vehicle Parts Shortage',
            description: 'A parts supplier failure is affecting tank maintenance readiness.',
            duration: 30,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Find alternative supplier at premium',
                    effects: { tank_upkeep: 1.3, tank_cost: 1.1 },
                },
                {
                    text: 'Cannibalize some tanks for parts',
                    effects: { tank_upkeep: 1.15, military_morale: -0.05 },
                },
                {
                    text: 'Reduce operational tempo',
                    effects: { tank_upkeep: 0.85, military_morale: -0.03 },
                }
            ]
        },
        {
            id: 'tank_crew_training',
            title: 'Tank Crew Training Program',
            description: 'New tank crews need live-fire training on the gunnery ranges.',
            duration: 45,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Fund full live-fire training',
                    effects: { tank_upkeep: 1.2, military_morale: 0.1 },
                },
                {
                    text: 'Simulator-only training',
                    effects: { tank_upkeep: 0.95 },
                },
                {
                    text: 'Defer crew training',
                    effects: { tank_upkeep: 0.9, military_morale: -0.08 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // AIR FORCE (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    aircraft: [
        {
            id: 'fuel_supply_contract',
            title: 'Aviation Fuel Supply Contract',
            description: 'The air force is negotiating its annual aviation fuel supply contract.',
            duration: 30,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Long-term fixed-price contract',
                    effects: { aircraft_upkeep: 0.9, aircraft_cost: 1.05 },
                },
                {
                    text: 'Spot market purchasing',
                    effects: { aircraft_upkeep: 1.1 },
                },
                {
                    text: 'Reduce flight hours',
                    effects: { aircraft_upkeep: 0.8, military_morale: -0.05 },
                }
            ]
        },
        {
            id: 'aircraft_parts_shortage',
            title: 'Aircraft Parts Shortage',
            description: 'Critical aircraft spare parts are backordered from the manufacturer.',
            duration: 45,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Expedite parts delivery at premium',
                    effects: { aircraft_upkeep: 1.4, aircraft_cost: 1.1 },
                },
                {
                    text: 'Ground some aircraft for parts cannibalization',
                    effects: { aircraft_upkeep: 1.15, military_morale: -0.05 },
                },
                {
                    text: 'Reduce sortie rate',
                    effects: { aircraft_upkeep: 0.85, military_morale: -0.03 },
                }
            ]
        },
        {
            id: 'pilot_retention_bonus',
            title: 'Pilot Retention Bonus Program',
            description: 'Experienced pilots are leaving for commercial airlines.',
            duration: 60,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Substantial retention bonuses',
                    effects: { aircraft_upkeep: 1.15, military_morale: 0.15 },
                },
                {
                    text: 'Modest bonuses',
                    effects: { aircraft_upkeep: 1.05, military_morale: 0.05 },
                },
                {
                    text: 'No bonuses, accept attrition',
                    effects: { aircraft_upkeep: 0.9, military_morale: -0.1 },
                }
            ]
        },
        {
            id: 'air_show_participation',
            title: 'National Air Show Participation',
            description: 'The air force is invited to participate in the national air show.',
            duration: 7,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full demonstration team',
                    effects: { aircraft_upkeep: 1.3, military_morale: 0.1 },
                },
                {
                    text: 'Static display only',
                    effects: { aircraft_upkeep: 1.05 },
                },
                {
                    text: 'Decline participation',
                    effects: { aircraft_upkeep: 0.9, military_morale: -0.03 },
                }
            ]
        },
        {
            id: 'aircraft_modernization',
            title: 'Aircraft Modernization Program',
            description: 'Older aircraft can be modernized with new avionics and engines.',
            duration: 90,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full fleet modernization',
                    effects: { aircraft_cost: 1.2, military_morale: 0.12 },
                },
                {
                    text: 'Modernize frontline squadrons',
                    effects: { aircraft_cost: 1.1, military_morale: 0.07 },
                },
                {
                    text: 'Skip modernization',
                    effects: { aircraft_cost: 0.95, military_morale: -0.04 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // NAVY & MARITIME (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    naval: [
        {
            id: 'ship_maintenance_drydock',
            title: 'Ship Maintenance Drydock',
            description: 'Several naval vessels are due for scheduled drydock maintenance.',
            duration: 60,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full drydock maintenance for all ships',
                    effects: { ship_upkeep: 1.1, ship_cost: 1.05 },
                },
                {
                    text: 'Drydock critical vessels only',
                    effects: { ship_upkeep: 1.05 },
                },
                {
                    text: 'Defer drydock maintenance',
                    effects: { ship_upkeep: 1.3, ship_cost: 0.95 },
                }
            ]
        },
        {
            id: 'naval_exercise',
            title: 'Naval Training Exercise',
            description: 'The navy is planning its annual fleet training exercise.',
            duration: 14,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full fleet exercise at sea',
                    effects: { ship_upkeep: 1.25, military_morale: 0.1 },
                },
                {
                    text: 'Limited exercise in home waters',
                    effects: { ship_upkeep: 1.1 },
                },
                {
                    text: 'Cancel exercise',
                    effects: { ship_upkeep: 0.85, military_morale: -0.08 },
                }
            ]
        },
        {
            id: 'ship_crew_shore_leave',
            title: 'Ship Crew Shore Leave',
            description: 'Sailors returning from deployment are requesting extended shore leave.',
            duration: 7,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Grant extended shore leave',
                    effects: { ship_upkeep: 1.1, military_morale: 0.1 },
                },
                {
                    text: 'Standard shore leave only',
                    effects: { ship_upkeep: 1.0 },
                },
                {
                    text: 'Cancel shore leave for readiness',
                    effects: { ship_upkeep: 0.95, military_morale: -0.1 },
                }
            ]
        },
        {
            id: 'naval_shipyard_upgrade',
            title: 'Naval Shipyard Upgrade',
            description: 'The national shipyard can be upgraded to build larger vessels.',
            duration: 120,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Approve shipyard expansion',
                    effects: { ship_cost: 1.15, military_morale: 0.1 },
                },
                {
                    text: 'Moderate shipyard improvements',
                    effects: { ship_cost: 1.08, military_morale: 0.05 },
                },
                {
                    text: 'Defer shipyard upgrades',
                    effects: { ship_cost: 0.95 },
                }
            ]
        },
        {
            id: 'maritime_patrol_ops',
            title: 'Maritime Patrol Operations',
            description: 'Coastal maritime patrol operations are needed to monitor shipping lanes.',
            duration: 30,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Increase patrol frequency',
                    effects: { ship_upkeep: 1.15, military_morale: 0.05 },
                },
                {
                    text: 'Maintain current patrol levels',
                    effects: { ship_upkeep: 1.0 },
                },
                {
                    text: 'Reduce patrols to save fuel',
                    effects: { ship_upkeep: 0.9, military_morale: -0.03 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INTELLIGENCE & ESPIONAGE (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    intelligence: [
        {
            id: 'spy_recruitment_drive',
            title: 'Intelligence Recruitment Drive',
            description: 'The intelligence service is seeking new case officers and field agents.',
            duration: 45,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Expand recruitment and training',
                    effects: { spy_cost: 1.1, military_morale: 0.05 },
                },
                {
                    text: 'Maintain current recruitment levels',
                    effects: { spy_cost: 1.0 },
                },
                {
                    text: 'Reduce recruitment',
                    effects: { spy_cost: 0.9, military_morale: -0.03 },
                }
            ]
        },
        {
            id: 'spy_operational_funds',
            title: 'Intelligence Operational Funds',
            description: 'The intelligence service requests additional operational funds for covert activities.',
            duration: 30,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Approve full funding request',
                    effects: { spy_upkeep: 1.2, military_morale: 0.08 },
                },
                {
                    text: 'Partial funding',
                    effects: { spy_upkeep: 1.1 },
                },
                {
                    text: 'Deny additional funding',
                    effects: { spy_upkeep: 0.9, military_morale: -0.05 },
                }
            ]
        },
        {
            id: 'counter_intelligence_sweep',
            title: 'Counter-Intelligence Sweep',
            description: 'A counter-intelligence sweep is needed to check for foreign agents.',
            duration: 21,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full counter-intelligence sweep',
                    effects: { spy_upkeep: 1.3, military_morale: 0.05 },
                },
                {
                    text: 'Targeted sweep of high-risk areas',
                    effects: { spy_upkeep: 1.15 },
                },
                {
                    text: 'Skip the sweep this year',
                    effects: { spy_upkeep: 0.85, military_morale: -0.05 },
                }
            ]
        },
        {
            id: 'spy_technology_upgrade',
            title: 'Spy Technology Upgrade',
            description: 'New surveillance and communications equipment is available for field agents.',
            duration: 60,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Equip all field agents',
                    effects: { spy_cost: 1.15, military_morale: 0.08 },
                },
                {
                    text: 'Equip senior agents only',
                    effects: { spy_cost: 1.08 },
                },
                {
                    text: 'Keep current equipment',
                    effects: { spy_cost: 0.95 },
                }
            ]
        },
        {
            id: 'intelligence_training',
            title: 'Intelligence Tradecraft Training',
            description: 'Advanced tradecraft training is available for intelligence officers.',
            duration: 45,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Send officers to advanced training',
                    effects: { spy_upkeep: 1.1, military_morale: 0.08 },
                },
                {
                    text: 'Online training only',
                    effects: { spy_upkeep: 1.02 },
                },
                {
                    text: 'Skip training this year',
                    effects: { spy_upkeep: 0.9, military_morale: -0.04 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // STRATEGIC WEAPONS (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    strategic: [
        {
            id: 'missile_maintenance',
            title: 'Ballistic Missile Maintenance',
            description: 'The ballistic missile fleet requires routine maintenance and inspection.',
            duration: 45,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full maintenance on all missiles',
                    effects: { missile_upkeep: 1.1, missile_cost: 1.05 },
                },
                {
                    text: 'Maintain ready-status missiles only',
                    effects: { missile_upkeep: 1.05 },
                },
                {
                    text: 'Defer non-critical maintenance',
                    effects: { missile_upkeep: 1.25, missile_cost: 0.95 },
                }
            ]
        },
        {
            id: 'nuke_security_upgrade',
            title: 'Nuclear Weapon Security Upgrade',
            description: 'Nuclear weapons storage facilities need security system upgrades.',
            duration: 90,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full security system overhaul',
                    effects: { nuke_upkeep: 1.2, nuke_cost: 1.1, military_morale: 0.05 },
                },
                {
                    text: 'Upgrade primary storage sites',
                    effects: { nuke_upkeep: 1.1, nuke_cost: 1.05 },
                },
                {
                    text: 'Maintain current security',
                    effects: { nuke_upkeep: 1.0 },
                }
            ]
        },
        {
            id: 'missile_test_program',
            title: 'Missile Test Program',
            description: 'Scheduled missile tests are planned to verify readiness and accuracy.',
            duration: 14,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full test launch program',
                    effects: { missile_upkeep: 1.4, military_morale: 0.1 },
                },
                {
                    text: 'Telemetry-only tests',
                    effects: { missile_upkeep: 1.15 },
                },
                {
                    text: 'Postpone tests',
                    effects: { missile_upkeep: 0.9, military_morale: -0.05 },
                }
            ]
        },
        {
            id: 'nuke_arsenal_review',
            title: 'Nuclear Arsenal Review',
            description: 'The nuclear arsenal size and composition is under review.',
            duration: 90,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Maintain current arsenal size',
                    effects: { nuke_upkeep: 1.0 },
                },
                {
                    text: 'Reduce arsenal size',
                    effects: { nuke_upkeep: 0.85, military_morale: -0.05 },
                },
                {
                    text: 'Modernize existing warheads',
                    effects: { nuke_upkeep: 1.1, nuke_cost: 1.15 },
                }
            ]
        },
        {
            id: 'strategic_command_drill',
            title: 'Strategic Command Drill',
            description: 'Strategic command and control systems require a readiness drill.',
            duration: 7,
            war_peace: 'peace',
            choices: [
                {
                    text: 'Full strategic command drill',
                    effects: { missile_upkeep: 1.25, nuke_upkeep: 1.25, military_morale: 0.08 },
                },
                {
                    text: 'Tabletop exercise only',
                    effects: { missile_upkeep: 1.1, nuke_upkeep: 1.1 },
                },
                {
                    text: 'Skip the drill',
                    effects: { missile_upkeep: 0.9, nuke_upkeep: 0.9, military_morale: -0.05 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // GROUND COMBAT (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    ground_combat: [
        {
            id: 'enemy_offensive',
            title: 'Enemy Offensive',
            description: 'The enemy has launched a major ground offensive against our positions.',
            duration: 30,
            war_peace: 'war',
            choices: [
                {
                    text: 'Commit reserves to hold the line',
                    effects: { soldier_eff: 1.2, tank_eff: 1.1 },
                },
                {
                    text: 'Conduct fighting withdrawal',
                    effects: { soldier_eff: 0.9, tank_eff: 0.95 },
                },
                {
                    text: 'Counter-attack enemy flanks',
                    effects: { soldier_eff: 1.15, tank_eff: 1.25 },
                }
            ]
        },
        {
            id: 'urban_combat',
            title: 'Urban Combat Operations',
            description: 'Fighting has moved into built-up areas, favoring defenders but slowing advances.',
            duration: 45,
            war_peace: 'war',
            choices: [
                {
                    text: 'Clear buildings room by room',
                    effects: { soldier_eff: 1.1 },
                },
                {
                    text: 'Use artillery to soften positions',
                    effects: { soldier_eff: 1.05, tank_eff: 0.9 },
                },
                {
                    text: 'Bypass and isolate the city',
                    effects: { soldier_eff: 0.95, tank_eff: 1.1 },
                }
            ]
        },
        {
            id: 'trench_warfare',
            title: 'Trench Warfare Stalemate',
            description: 'The front has settled into static trench warfare with minimal movement.',
            duration: 60,
            war_peace: 'war',
            choices: [
                {
                    text: 'Artillery barrage before assault',
                    effects: { soldier_eff: 1.05, tank_eff: 0.85 },
                },
                {
                    text: 'Night raid on enemy trenches',
                    effects: { soldier_eff: 1.1 },
                },
                {
                    text: 'Maintain defensive posture',
                    effects: { soldier_eff: 1.0, tank_eff: 0.9 },
                }
            ]
        },
        {
            id: 'combined_arms_assault',
            title: 'Combined Arms Assault',
            description: 'Coordinated infantry and armor assault is planned against enemy lines.',
            duration: 21,
            war_peace: 'war',
            choices: [
                {
                    text: 'Infantry leads, armor supports',
                    effects: { soldier_eff: 1.1, tank_eff: 1.05 },
                },
                {
                    text: 'Armor spearhead, infantry follows',
                    effects: { soldier_eff: 0.95, tank_eff: 1.2 },
                },
                {
                    text: 'Simultaneous advance on all fronts',
                    effects: { soldier_eff: 1.15, tank_eff: 1.15 },
                }
            ]
        },
        {
            id: 'ground_rotation',
            title: 'Ground Force Rotation',
            description: 'Frontline units need rotation to rest and refit.',
            duration: 14,
            war_peace: 'war',
            choices: [
                {
                    text: 'Rotate exhausted units immediately',
                    effects: { soldier_eff: 1.2, tank_eff: 1.0 },
                },
                {
                    text: 'Partial rotation of worst units',
                    effects: { soldier_eff: 1.1 },
                },
                {
                    text: 'Keep all units in line',
                    effects: { soldier_eff: 0.85, tank_eff: 0.95 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // AIR OPERATIONS (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    air_operations: [
        {
            id: 'air_superiority_battle',
            title: 'Air Superiority Battle',
            description: 'Enemy fighters are challenging our control of the skies.',
            duration: 30,
            war_peace: 'war',
            choices: [
                {
                    text: 'Engage enemy fighters directly',
                    effects: { aircraft_eff: 1.2 },
                },
                {
                    text: 'Avoid combat, preserve aircraft',
                    effects: { aircraft_eff: 0.9 },
                },
                {
                    text: 'Ambush enemy formations',
                    effects: { aircraft_eff: 1.15 },
                }
            ]
        },
        {
            id: 'close_air_support',
            title: 'Close Air Support Request',
            description: 'Ground troops are requesting close air support for an upcoming assault.',
            duration: 14,
            war_peace: 'war',
            choices: [
                {
                    text: 'Provide maximum CAS sorties',
                    effects: { aircraft_eff: 1.2, soldier_eff: 1.1 },
                },
                {
                    text: 'Limited CAS availability',
                    effects: { aircraft_eff: 1.0, soldier_eff: 1.05 },
                },
                {
                    text: 'Prioritize air defense instead',
                    effects: { aircraft_eff: 0.9, soldier_eff: 0.9 },
                }
            ]
        },
        {
            id: 'strategic_bombing',
            title: 'Strategic Bombing Campaign',
            description: 'Long-range bombers are available for strategic bombing missions.',
            duration: 45,
            war_peace: 'war',
            choices: [
                {
                    text: 'Bomb enemy industrial centers',
                    effects: { aircraft_eff: 1.1, missile_infra_damage: 15 },
                },
                {
                    text: 'Bomb military infrastructure',
                    effects: { aircraft_eff: 1.05, missile_infra_damage: 10 },
                },
                {
                    text: 'Stand down bomber fleet',
                    effects: { aircraft_eff: 0.9 },
                }
            ]
        },
        {
            id: 'airfield_attack',
            title: 'Enemy Airfield Attack',
            description: 'Enemy aircraft have attacked our airfields, damaging parked aircraft.',
            duration: 7,
            war_peace: 'war',
            choices: [
                {
                    text: 'Scramble remaining aircraft',
                    effects: { aircraft_eff: 1.1 },
                },
                {
                    text: 'Disperse aircraft to secondary fields',
                    effects: { aircraft_eff: 0.95 },
                },
                {
                    text: 'Harden in place and repair',
                    effects: { aircraft_eff: 0.9 },
                }
            ]
        },
        {
            id: 'reconnaissance_flight',
            title: 'Reconnaissance Flight',
            description: 'Photo-reconnaissance aircraft are needed to identify enemy positions.',
            duration: 14,
            war_peace: 'war',
            choices: [
                {
                    text: 'High-risk low-level recon',
                    effects: { aircraft_eff: 1.1, spy_ops_success_chance: 10 },
                },
                {
                    text: 'Stand-off reconnaissance',
                    effects: { aircraft_eff: 1.0, spy_ops_success_chance: 5 },
                },
                {
                    text: 'Cancel recon missions',
                    effects: { aircraft_eff: 0.9, spy_ops_success_chance: -5 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // NAVAL OPERATIONS (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    naval_operations: [
        {
            id: 'naval_blockade',
            title: 'Naval Blockade',
            description: 'Our navy is establishing a blockade of enemy ports.',
            duration: 60,
            war_peace: 'war',
            choices: [
                {
                    text: 'Full blockade with intercepts',
                    effects: { ship_eff: 1.2 },
                },
                {
                    text: 'Loose blockade, let some through',
                    effects: { ship_eff: 1.05 },
                },
                {
                    text: 'Lift the blockade',
                    effects: { ship_eff: 0.9 },
                }
            ]
        },
        {
            id: 'amphibious_assault',
            title: 'Amphibious Assault',
            description: 'An amphibious landing operation is being planned against enemy coast.',
            duration: 45,
            war_peace: 'war',
            choices: [
                {
                    text: 'Full-scale amphibious landing',
                    effects: { ship_eff: 1.15, soldier_eff: 1.1 },
                },
                {
                    text: 'Limited raid operation',
                    effects: { ship_eff: 1.05 },
                },
                {
                    text: 'Postpone amphibious operation',
                    effects: { ship_eff: 0.9 },
                }
            ]
        },
        {
            id: 'convoy_escort',
            title: 'Convoy Escort Duty',
            description: 'Merchant convoys need naval escort through enemy patrol zones.',
            duration: 30,
            war_peace: 'war',
            choices: [
                {
                    text: 'Escort all convoys',
                    effects: { ship_eff: 1.1 },
                },
                {
                    text: 'Escort high-value convoys only',
                    effects: { ship_eff: 1.0 },
                },
                {
                    text: 'Suspend convoy operations',
                    effects: { ship_eff: 0.9 },
                }
            ]
        },
        {
            id: 'submarine_hunt',
            title: 'Enemy Submarine Hunt',
            description: 'Enemy submarines are threatening our shipping lanes.',
            duration: 21,
            war_peace: 'war',
            choices: [
                {
                    text: 'Aggressive anti-submarine patrols',
                    effects: { ship_eff: 1.15 },
                },
                {
                    text: 'Convoy escort focus',
                    effects: { ship_eff: 1.05 },
                },
                {
                    text: 'Ignore submarine threat',
                    effects: { ship_eff: 0.9 },
                }
            ]
        },
        {
            id: 'fleet_engagement',
            title: 'Fleet Engagement',
            description: 'Enemy fleet has been sighted, a major naval battle is imminent.',
            duration: 14,
            war_peace: 'war',
            choices: [
                {
                    text: 'Engage enemy fleet decisively',
                    effects: { ship_eff: 1.25 },
                },
                {
                    text: 'Avoid battle, preserve fleet',
                    effects: { ship_eff: 0.9 },
                },
                {
                    text: 'Hit-and-run tactics',
                    effects: { ship_eff: 1.1 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INTELLIGENCE OPERATIONS (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    intelligence_ops: [
        {
            id: 'spy_infiltration',
            title: 'Spy Infiltration Mission',
            description: 'An opportunity exists to infiltrate enemy command structure.',
            duration: 30,
            war_peace: 'war',
            choices: [
                {
                    text: 'Deploy deep-cover agent',
                    effects: { spy_ops_success_chance: 15 },
                },
                {
                    text: 'Send multiple lower-risk agents',
                    effects: { spy_ops_success_chance: 10 },
                },
                {
                    text: 'Abort infiltration',
                    effects: { spy_ops_success_chance: -5 },
                }
            ]
        },
        {
            id: 'enemy_communications_intercept',
            title: 'Enemy Communications Intercept',
            description: 'Enemy military communications are being intercepted.',
            duration: 14,
            war_peace: 'war',
            choices: [
                {
                    text: 'Full signals intelligence effort',
                    effects: { spy_ops_success_chance: 12 },
                },
                {
                    text: 'Targeted intercept of key channels',
                    effects: { spy_ops_success_chance: 6 },
                },
                {
                    text: 'Passive monitoring only',
                    effects: { spy_ops_success_chance: 2 },
                }
            ]
        },
        {
            id: 'counter_spy_ops',
            title: 'Counter-Spy Operations',
            description: 'Enemy spies are operating within our territory.',
            duration: 21,
            war_peace: 'war',
            choices: [
                {
                    text: 'Aggressive counter-spy hunt',
                    effects: { spy_ops_success_chance: 10 },
                },
                {
                    text: 'Disinformation campaign',
                    effects: { spy_ops_success_chance: 8 },
                },
                {
                    text: 'Increase internal security',
                    effects: { spy_ops_success_chance: 5 },
                }
            ]
        },
        {
            id: 'spy_exfiltration',
            title: 'Spy Exfiltration',
            description: 'An embedded agent needs to be extracted from enemy territory.',
            duration: 7,
            war_peace: 'war',
            choices: [
                {
                    text: 'Risky exfiltration attempt',
                    effects: { spy_ops_success_chance: 8 },
                },
                {
                    text: 'Wait for safer opportunity',
                    effects: { spy_ops_success_chance: 3 },
                },
                {
                    text: 'Abandon the agent',
                    effects: { spy_ops_success_chance: -5 },
                }
            ]
        },
        {
            id: 'propaganda_broadcast',
            title: 'Enemy Propaganda Broadcast',
            description: 'Enemy is broadcasting propaganda to our troops and civilians.',
            duration: 14,
            war_peace: 'war',
            choices: [
                {
                    text: 'Counter-propaganda campaign',
                    effects: { spy_ops_success_chance: 7, military_morale: 5 },
                },
                {
                    text: 'Jam enemy broadcasts',
                    effects: { spy_ops_success_chance: 5 },
                },
                {
                    text: 'Ignore enemy propaganda',
                    effects: { spy_ops_success_chance: -3 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // STRATEGIC STRIKES (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    strategic_strikes: [
        {
            id: 'missile_strike',
            title: 'Ballistic Missile Strike',
            description: 'Ballistic missiles are available for strategic strike missions.',
            duration: 14,
            war_peace: 'war',
            choices: [
                {
                    text: 'Strike enemy command centers',
                    effects: { missile_infra_damage: 20 },
                },
                {
                    text: 'Strike enemy military bases',
                    effects: { missile_infra_damage: 15 },
                },
                {
                    text: 'Hold missiles in reserve',
                    effects: { missile_infra_damage: 0 },
                }
            ]
        },
        {
            id: 'cruise_missile_barrage',
            title: 'Cruise Missile Barrage',
            description: 'Cruise missiles can be launched against enemy infrastructure.',
            duration: 21,
            war_peace: 'war',
            choices: [
                {
                    text: 'Barrage energy infrastructure',
                    effects: { missile_infra_damage: 18 },
                },
                {
                    text: 'Barrage transportation network',
                    effects: { missile_infra_damage: 12 },
                },
                {
                    text: 'Conserve cruise missiles',
                    effects: { missile_infra_damage: 0 },
                }
            ]
        },
        {
            id: 'nuke_demonstration',
            title: 'Nuclear Demonstration Strike',
            description: 'A nuclear demonstration strike is being considered to deter enemy escalation.',
            duration: 7,
            war_peace: 'war',
            choices: [
                {
                    text: 'Detonate in uninhabited area',
                    effects: { nuke_infra_damage: 5, military_morale: 10 },
                },
                {
                    text: 'Threaten but do not detonate',
                    effects: { nuke_infra_damage: 0, military_morale: 3 },
                },
                {
                    text: 'Abort demonstration',
                    effects: { nuke_infra_damage: 0, military_morale: -5 },
                }
            ]
        },
        {
            id: 'nuke_counterforce',
            title: 'Nuclear Counterforce Strike',
            description: 'Nuclear weapons could be used against enemy military infrastructure.',
            duration: 7,
            war_peace: 'war',
            choices: [
                {
                    text: 'Strike enemy missile silos',
                    effects: { nuke_infra_damage: 25 },
                },
                {
                    text: 'Strike enemy air bases',
                    effects: { nuke_infra_damage: 20 },
                },
                {
                    text: 'Do not use nuclear weapons',
                    effects: { nuke_infra_damage: 0 },
                }
            ]
        },
        {
            id: 'strategic_defense',
            title: 'Strategic Defense Posture',
            description: 'Our strategic defense systems are on high alert.',
            duration: 30,
            war_peace: 'war',
            choices: [
                {
                    text: 'Maximum strategic alert',
                    effects: { missile_infra_damage: -10, nuke_infra_damage: -10 },
                },
                {
                    text: 'Elevated alert status',
                    effects: { missile_infra_damage: -5, nuke_infra_damage: -5 },
                },
                {
                    text: 'Normal alert status',
                    effects: { missile_infra_damage: 0, nuke_infra_damage: 0 },
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // LOGISTICS & SUPPLY (5 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    logistics_supply: [
        {
            id: 'ammunition_shortage',
            title: 'Ammunition Shortage',
            description: 'Frontline units are running low on ammunition.',
            duration: 14,
            war_peace: 'war',
            choices: [
                {
                    text: 'Air-drop ammunition supplies',
                    effects: { soldier_eff: 1.1, tank_eff: 1.05 },
                },
                {
                    text: 'Ration ammunition usage',
                    effects: { soldier_eff: 0.9, tank_eff: 0.9 },
                },
                {
                    text: 'Capture enemy ammunition',
                    effects: { soldier_eff: 1.0 },
                }
            ]
        },
        {
            id: 'fuel_convoy',
            title: 'Fuel Convoy Under Attack',
            description: 'A fuel convoy to forward positions is under enemy attack.',
            duration: 7,
            war_peace: 'war',
            choices: [
                {
                    text: 'Send military escort',
                    effects: { aircraft_eff: 1.1, ship_eff: 1.05 },
                },
                {
                    text: 'Reroute the convoy',
                    effects: { aircraft_eff: 0.95, ship_eff: 0.95 },
                },
                {
                    text: 'Abort the convoy',
                    effects: { aircraft_eff: 0.9, ship_eff: 0.9 },
                }
            ]
        },
        {
            id: 'field_hospital_overload',
            title: 'Field Hospital Overload',
            description: 'Field hospitals are overwhelmed with casualties.',
            duration: 21,
            war_peace: 'war',
            choices: [
                {
                    text: 'Expand field hospital capacity',
                    effects: { soldier_eff: 1.1 },
                },
                {
                    text: 'Evacuate casualties to rear',
                    effects: { soldier_eff: 1.05 },
                },
                {
                    text: 'Triage only critical cases',
                    effects: { soldier_eff: 0.9 },
                }
            ]
        },
        {
            id: 'supply_line_cut',
            title: 'Supply Line Cut',
            description: 'Enemy action has cut our main supply line to the front.',
            duration: 30,
            war_peace: 'war',
            choices: [
                {
                    text: 'Repair and reopen supply line',
                    effects: { soldier_eff: 1.1, tank_eff: 1.1 },
                },
                {
                    text: 'Establish alternative supply route',
                    effects: { soldier_eff: 1.05 },
                },
                {
                    text: 'Live off the land',
                    effects: { soldier_eff: 0.85, tank_eff: 0.8 },
                }
            ]
        },
        {
            id: 'equipment_capture',
            title: 'Enemy Equipment Capture',
            description: 'Our forces have captured enemy equipment in working condition.',
            duration: 14,
            war_peace: 'war',
            choices: [
                {
                    text: 'Integrate captured equipment',
                    effects: { tank_eff: 1.1, aircraft_eff: 1.05 },
                },
                {
                    text: 'Study and reverse-engineer',
                    effects: { tank_eff: 1.05, ship_eff: 1.0 },
                },
                {
                    text: 'Destroy captured equipment',
                    effects: { tank_eff: 0.95 },
                }
            ]
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MilitarySituations;
} else if (typeof window !== 'undefined') {
    window.MilitarySituations = MilitarySituations;
}
