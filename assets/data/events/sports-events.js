/**
 * Sports Events Data - Sport-Specific Skill Gain Events
 * Dominion Wars - Nation Building Strategy Game
 *
 * 80 events across 9 categories: basketball (10), hockey (10), soccer (10),
 * football (10), stadium_cost (10), fan_gain (10), fan_loss (10),
 * injury_given (5), injury_cured (4), fan_volunteer (1).
 * Each sports event provides permanent stat boosts to player(s) on a random
 * team of that sport. Stadium/fan/injury events apply to any team.
 *
 * These are WORLD events that auto-apply (no player choices).
 * EventsSystem pulls an event FIRST, then finds an eligible team/player of the
 * matching sport to apply effects to.
 *
 * Effects are permanent - no duration, no reversal.
 *
 * Placeholders: {team}, {player}, {sport}, {injury}
 */

var SportsEvents = {
    // ═════════════════════════════════════════════════════════════════════════════
    // BASKETBALL (10 events)
    // Attributes: speed, stamina, passing, awareness, endurance, shooting,
    //             defense, rebounding, stealing
    // ═════════════════════════════════════════════════════════════════════════════
    basketball: [
        {
            id: 'bball_shooting_clinic',
            name: 'Basketball Shooting Clinic',
            description: '{player} attended an intensive shooting clinic with {team}.',
            effectType: 'stats',
            statMin: 3,
            statMax: 6,
            sport: 'basketball',
            moraleBoost: 2
        },
        {
            id: 'bball_passing_drills',
            name: 'Basketball Passing Drills',
            description: '{team} ran precision passing drills all week.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'basketball',
            xpGain: 20
        },
        {
            id: 'bball_defensive_stance',
            name: 'Defensive Stance Training',
            description: '{player} focused on defensive stance and footwork.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'basketball',
            xpGain: 15
        },
        {
            id: 'bball_rebounding_work',
            name: 'Rebounding Work',
            description: '{team} emphasized rebounding and positioning in practice.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'basketball',
            xpGain: 25
        },
        {
            id: 'bball_steal_technique',
            name: 'Steal Technique',
            description: '{player} practiced steal techniques and ball-hawking.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'basketball',
            xpGain: 15
        },
        {
            id: 'bball_footwork',
            name: 'Footwork Fundamentals',
            description: '{team} spent sessions on footwork and agility.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'basketball',
            xpGain: 20
        },
        {
            id: 'bball_free_throw',
            name: 'Free Throw Practice',
            description: '{player} stayed after practice to shoot hundreds of free throws.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'basketball',
            xpGain: 10
        },
        {
            id: 'bball_court_vision',
            name: 'Court Vision',
            description: '{team} worked on court vision and decision-making drills.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'basketball',
            xpGain: 15,
            moraleBoost: 2
        },
        {
            id: 'bball_endurance',
            name: 'Basketball Endurance',
            description: '{team} completed high-intensity endurance circuits.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'basketball',
            xpGain: 30
        },
        {
            id: 'bball_scrimmage',
            name: 'Full-Court Scrimmage',
            description: '{team} played a full-court scrimmage that sharpened all skills.',
            effectType: 'statsAndXP',
            statMin: 2,
            statMax: 4,
            sport: 'basketball',
            xpGain: 40,
            moraleBoost: 3
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // HOCKEY (10 events)
    // Attributes: speed, stamina, spirit, awareness, endurance, passing,
    //             shooting, defense, goaltending
    // ═════════════════════════════════════════════════════════════════════════════
    hockey: [
        {
            id: 'hockey_shot_accuracy',
            name: 'Hockey Shot Accuracy',
            description: '{player} practiced shot accuracy on the ice.',
            effectType: 'stats',
            statMin: 3,
            statMax: 6,
            sport: 'hockey',
            moraleBoost: 2
        },
        {
            id: 'hockey_skating_speed',
            name: 'Skating Speed',
            description: '{team} focused on skating speed and edgework.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'hockey',
            xpGain: 20
        },
        {
            id: 'hockey_passing',
            name: 'Hockey Passing',
            description: '{player} worked on saucer passes and tape-to-tape passing.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'hockey',
            xpGain: 15
        },
        {
            id: 'hockey_defensive_zone',
            name: 'Defensive Zone Coverage',
            description: '{team} drilled defensive zone coverage and positioning.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'hockey',
            xpGain: 25
        },
        {
            id: 'hockey_faceoff',
            name: 'Faceoff Technique',
            description: '{player} practiced faceoff techniques and timing.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'hockey',
            xpGain: 15
        },
        {
            id: 'hockey_backchecking',
            name: 'Backchecking',
            description: '{team} emphasized backchecking and transition play.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'hockey',
            xpGain: 20
        },
        {
            id: 'hockey_screening',
            name: 'Screening the Goalie',
            description: '{player} worked on screening and net-front presence.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'hockey',
            xpGain: 10
        },
        {
            id: 'hockey_awareness',
            name: 'Hockey Awareness',
            description: '{team} worked on situational awareness and hockey IQ.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'hockey',
            xpGain: 15,
            moraleBoost: 2
        },
        {
            id: 'hockey_endurance',
            name: 'Hockey Endurance',
            description: '{team} completed high-intensity interval training on ice.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'hockey',
            xpGain: 30
        },
        {
            id: 'hockey_scrimmage',
            name: 'Full-Ice Scrimmage',
            description: '{team} played a full-ice scrimmage that sharpened all skills.',
            effectType: 'statsAndXP',
            statMin: 2,
            statMax: 4,
            sport: 'hockey',
            xpGain: 40,
            moraleBoost: 3
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // SOCCER (10 events)
    // Attributes: stamina, awareness, endurance, passing, shooting,
    //             defense, goaltending
    // ═════════════════════════════════════════════════════════════════════════════
    soccer: [
        {
            id: 'soccer_finishing',
            name: 'Soccer Finishing',
            description: '{player} practiced finishing and shot placement.',
            effectType: 'stats',
            statMin: 3,
            statMax: 6,
            sport: 'soccer',
            moraleBoost: 2
        },
        {
            id: 'soccer_passing',
            name: 'Soccer Passing',
            description: '{team} worked on short and long passing accuracy.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'soccer',
            xpGain: 20
        },
        {
            id: 'soccer_defensive_positioning',
            name: 'Defensive Positioning',
            description: '{player} focused on defensive positioning and marking.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'soccer',
            xpGain: 15
        },
        {
            id: 'soccer_stamina',
            name: 'Soccer Stamina',
            description: '{team} completed high-volume running and stamina work.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'soccer',
            xpGain: 30
        },
        {
            id: 'soccer_first_touch',
            name: 'First Touch',
            description: '{player} practiced first touch and ball control.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'soccer',
            xpGain: 15
        },
        {
            id: 'soccer_awareness',
            name: 'Soccer Awareness',
            description: '{team} worked on off-the-ball movement and spatial awareness.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'soccer',
            xpGain: 20,
            moraleBoost: 2
        },
        {
            id: 'soccer_tackling',
            name: 'Tackling Technique',
            description: '{player} practiced clean and effective tackling.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'soccer',
            xpGain: 15
        },
        {
            id: 'soccer_crossing',
            name: 'Crossing and Width',
            description: '{team} worked on crossing from wide positions.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'soccer',
            xpGain: 15
        },
        {
            id: 'soccer_set_pieces',
            name: 'Set Pieces',
            description: '{team} practiced free kicks and corner routines.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'soccer',
            xpGain: 20
        },
        {
            id: 'soccer_match',
            name: 'Full Match',
            description: '{team} played a full 90-minute match that sharpened all skills.',
            effectType: 'statsAndXP',
            statMin: 2,
            statMax: 4,
            sport: 'soccer',
            xpGain: 50,
            moraleBoost: 3
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // FOOTBALL (10 events)
    // Attributes: stamina, awareness, endurance, passing, catching,
    //             defense, strength, speed
    // ═════════════════════════════════════════════════════════════════════════════
    football: [
        {
            id: 'football_passing',
            name: 'Football Passing',
            description: '{player} practiced throwing mechanics and accuracy.',
            effectType: 'stats',
            statMin: 3,
            statMax: 6,
            sport: 'football',
            moraleBoost: 2
        },
        {
            id: 'football_catching',
            name: 'Catching Drills',
            description: '{team} ran catching drills and route running.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'football',
            xpGain: 20
        },
        {
            id: 'football_strength',
            name: 'Football Strength',
            description: '{team} completed strength and power training.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'football',
            xpGain: 25
        },
        {
            id: 'football_defensive_reads',
            name: 'Defensive Reads',
            description: '{player} worked on reading the offense and reacting.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'football',
            xpGain: 20
        },
        {
            id: 'football_speed',
            name: 'Speed and Agility',
            description: '{team} ran speed and agility ladders.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'football',
            xpGain: 15
        },
        {
            id: 'football_endurance',
            name: 'Football Endurance',
            description: '{team} completed conditioning and endurance work.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'football',
            xpGain: 25
        },
        {
            id: 'football_blocking',
            name: 'Blocking Technique',
            description: '{player} practiced blocking and leverage.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'football',
            xpGain: 15
        },
        {
            id: 'football_awareness',
            name: 'Football Awareness',
            description: '{team} worked on situational awareness and football IQ.',
            effectType: 'stats',
            statMin: 2,
            statMax: 4,
            sport: 'football',
            xpGain: 15,
            moraleBoost: 2
        },
        {
            id: 'football_scrimmage',
            name: 'Full-Field Scrimmage',
            description: '{team} played a full-field scrimmage that sharpened all skills.',
            effectType: 'statsAndXP',
            statMin: 2,
            statMax: 4,
            sport: 'football',
            xpGain: 50,
            moraleBoost: 3
        },
        {
            id: 'football_red_zone',
            name: 'Red Zone Efficiency',
            description: '{team} practiced red zone offense and defense.',
            effectType: 'stats',
            statMin: 3,
            statMax: 5,
            sport: 'football',
            xpGain: 30,
            moraleBoost: 3
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // STADIUM UPGRADE COST - Modifiers that raise or lower stadium upgrade costs
    // ═════════════════════════════════════════════════════════════════════════════
    stadium_cost: [
        {
            id: 'sc_volunteer_crew',
            name: 'Volunteer Renovation Crew',
            description: '{team} received help from volunteer construction workers.',
            effectType: 'upgradeCost',
            modifier: 0.85
        },
        {
            id: 'sc_bulk_materials',
            name: 'Bulk Material Purchase',
            description: '{team} secured bulk pricing on construction materials.',
            effectType: 'upgradeCost',
            modifier: 0.88
        },
        {
            id: 'sc_offseason_discount',
            name: 'Offseason Discount',
            description: 'Contractors offered offseason rates for {team}.',
            effectType: 'upgradeCost',
            modifier: 0.90
        },
        {
            id: 'sc_material_donation',
            name: 'Material Donation',
            description: 'A local supplier donated materials to {team}.',
            effectType: 'upgradeCost',
            modifier: 0.92
        },
        {
            id: 'sc_efficient_contracting',
            name: 'Efficient Contracting',
            description: '{team} found an efficient contractor who completed work under budget.',
            effectType: 'upgradeCost',
            modifier: 0.94
        },
        {
            id: 'sc_material_shortage',
            name: 'Material Shortage',
            description: 'Construction material shortages drove up costs for {team}.',
            effectType: 'upgradeCost',
            modifier: 1.15
        },
        {
            id: 'sc_labor_strike',
            name: 'Labor Strike',
            description: 'A construction labor strike increased costs for {team}.',
            effectType: 'upgradeCost',
            modifier: 1.18
        },
        {
            id: 'sc_permit_fees',
            name: 'Permit Fee Increase',
            description: 'City permit fees increased for {team}\'s stadium projects.',
            effectType: 'upgradeCost',
            modifier: 1.10
        },
        {
            id: 'sc_environmental_study',
            name: 'Environmental Impact Study',
            description: 'Required environmental studies delayed and raised costs for {team}.',
            effectType: 'upgradeCost',
            modifier: 1.12
        },
        {
            id: 'sc_expedited_construction',
            name: 'Expedited Construction',
            description: '{team} paid for expedited construction, increasing costs.',
            effectType: 'upgradeCost',
            modifier: 1.25
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // FAN GAIN - Positive percent fan boosts
    // ═════════════════════════════════════════════════════════════════════════════
    fan_gain: [
        {
            id: 'fan_ga_community_outreach',
            name: 'Community Outreach Program',
            description: '{team} hosted a community outreach event for local youth.',
            effectType: 'fansGainedPercent',
            effectMin: 0.06,
            effectMax: 0.14,
            moraleBoost: 4
        },
        {
            id: 'fan_ga_viral_social_media',
            name: 'Viral Social Media Post',
            description: '{player}\'s highlight went viral on social media.',
            effectType: 'fansGainedPercent',
            effectMin: 0.10,
            effectMax: 0.25,
            moraleBoost: 3
        },
        {
            id: 'fan_ga_stadium_renovation',
            name: 'Stadium Renovation',
            description: '{team} renovated the stadium, improving the fan experience.',
            effectType: 'fansGainedPercent',
            effectMin: 0.05,
            effectMax: 0.12,
            moraleBoost: 3
        },
        {
            id: 'fan_ga_merchandise_drop',
            name: 'Limited Merchandise Drop',
            description: '{team} released limited edition merchandise that sold out quickly.',
            effectType: 'fansGainedPercent',
            effectMin: 0.04,
            effectMax: 0.10,
            moraleBoost: 2
        },
        {
            id: 'fan_ga_celebrity_appearance',
            name: 'Celebrity Appearance',
            description: 'A celebrity attended the game and posted about {team}.',
            effectType: 'fansGainedPercent',
            effectMin: 0.07,
            effectMax: 0.16,
            moraleBoost: 3
        },
        {
            id: 'fan_ga_player_meet_greet',
            name: 'Player Meet and Greet',
            description: '{player} hosted a meet and greet with fans.',
            effectType: 'fansGainedPercent',
            effectMin: 0.03,
            effectMax: 0.09,
            moraleBoost: 3
        },
        {
            id: 'fan_ga_charity_drive',
            name: 'Charity Drive',
            description: '{team} organized a charity drive that brought positive attention.',
            effectType: 'fansGainedPercent',
            effectMin: 0.05,
            effectMax: 0.11,
            moraleBoost: 3
        },
        {
            id: 'fan_ga_alumni_game',
            name: 'Alumni Game',
            description: '{team} hosted an alumni game, bringing back longtime fans.',
            effectType: 'fansGainedPercent',
            effectMin: 0.04,
            effectMax: 0.10,
            moraleBoost: 3
        },
        {
            id: 'fan_ga_halftime_show',
            name: 'Halftime Show',
            description: '{team} put on a spectacular halftime show that drew attention.',
            effectType: 'fansGainedPercent',
            effectMin: 0.04,
            effectMax: 0.11,
            moraleBoost: 3
        },
        {
            id: 'fan_ga_local_partnership',
            name: 'Local Business Partnership',
            description: '{team} partnered with a local business for cross-promotion.',
            effectType: 'fansGainedPercent',
            effectMin: 0.03,
            effectMax: 0.08,
            moraleBoost: 2
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // FAN LOSS - Negative percent fan losses (scandals, embarrassment, etc.)
    // ═════════════════════════════════════════════════════════════════════════════
    fan_loss: [
        {
            id: 'fan_ls_scandal',
            name: 'Team Scandal',
            description: '{team} was involved in a major scandal, causing fan backlash.',
            effectType: 'fansLostPercent',
            effectMin: -0.20,
            effectMax: -0.10,
            moraleBoost: -5
        },
        {
            id: 'fan_ls_player_misconduct',
            name: 'Player Misconduct',
            description: '{player} was involved in off-field misconduct, damaging team reputation.',
            effectType: 'fansLostPercent',
            effectMin: -0.15,
            effectMax: -0.08,
            moraleBoost: -4
        },
        {
            id: 'fan_ls_fan_protest',
            name: 'Fan Protest',
            description: 'Fans protested outside {team} headquarters over management decisions.',
            effectType: 'fansLostPercent',
            effectMin: -0.12,
            effectMax: -0.05,
            moraleBoost: -5
        },
        {
            id: 'fan_ls_social_media_backlash',
            name: 'Social Media Backlash',
            description: '{team} faced backlash on social media over a controversial decision.',
            effectType: 'fansLostPercent',
            effectMin: -0.09,
            effectMax: -0.03,
            moraleBoost: -3
        },
        {
            id: 'fan_ls_coach_controversy',
            name: 'Coach Controversy',
            description: 'The coach made controversial comments, upsetting fans.',
            effectType: 'fansLostPercent',
            effectMin: -0.08,
            effectMax: -0.03,
            moraleBoost: -4
        },
        {
            id: 'fan_ls_referee_controversy',
            name: 'Referee Controversy',
            description: '{team} benefited from a controversial referee call, angering rival fans.',
            effectType: 'fansLostPercent',
            effectMin: -0.05,
            effectMax: -0.01,
            moraleBoost: -2
        },
        {
            id: 'fan_ls_contract_dispute',
            name: 'Contract Dispute',
            description: '{player} entered a public contract dispute with {team}.',
            effectType: 'fansLostPercent',
            effectMin: -0.07,
            effectMax: -0.02,
            moraleBoost: -3
        },
        {
            id: 'fan_ls_locker_room_leak',
            name: 'Locker Room Leak',
            description: 'Locker room information was leaked to the press.',
            effectType: 'fansLostPercent',
            effectMin: -0.06,
            effectMax: -0.02,
            moraleBoost: -3
        },
        {
            id: 'fan_ls_agent_controversy',
            name: 'Agent Controversy',
            description: '{player}\'s agent created controversy around contract negotiations.',
            effectType: 'fansLostPercent',
            effectMin: -0.05,
            effectMax: -0.02,
            moraleBoost: -2
        },
        {
            id: 'fan_ls_dressing_room_divide',
            name: 'Dressing Room Divide',
            description: 'Internal disagreements within {team} became public.',
            effectType: 'fansLostPercent',
            effectMin: -0.06,
            effectMax: -0.02,
            moraleBoost: -4
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INJURIES GIVEN - Player injured (severity 1-5)
    // ═════════════════════════════════════════════════════════════════════════════
    injury_given: [
        {
            id: 'inj_give_practice_collision',
            name: 'Practice Collision',
            description: '{player} suffered a {injury} during a practice collision.',
            effectType: 'injury',
            severity: 3
        },
        {
            id: 'inj_give_weight_room_accident',
            name: 'Weight Room Accident',
            description: '{player} suffered a {injury} during weight room training.',
            effectType: 'injury',
            severity: 2
        },
        {
            id: 'inj_give_sprint_pull',
            name: 'Sprint Pull',
            description: '{player} pulled a {injury} during sprint drills.',
            effectType: 'injury',
            severity: 1
        },
        {
            id: 'inj_give_contact_drill',
            name: 'Contact Drill Collision',
            description: '{player} suffered a {injury} during contact drills.',
            effectType: 'injury',
            severity: 4
        },
        {
            id: 'inj_give_conditioning_overuse',
            name: 'Conditioning Overuse',
            description: '{player} suffered a {injury} from conditioning overuse.',
            effectType: 'injury',
            severity: 5
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INJURIES CURED - Player fully healed (severity -1 to -4)
    // ═════════════════════════════════════════════════════════════════════════════
    injury_cured: [
        {
            id: 'inj_cure_recovery_milestone',
            name: 'Recovery Milestone',
            description: '{player} reached a recovery milestone, fully healing their {injury}.',
            effectType: 'injury',
            severity: -1
        },
        {
            id: 'inj_cure_physiotherapy_progress',
            name: 'Physiotherapy Progress',
            description: '{player} made progress in physiotherapy, fully healing their {injury}.',
            effectType: 'injury',
            severity: -2
        },
        {
            id: 'inj_cure_medical_clearance',
            name: 'Medical Clearance',
            description: '{player} received medical clearance, fully healing their {injury}.',
            effectType: 'injury',
            severity: -4
        },
        {
            id: 'inj_cure_rehabilitation_success',
            name: 'Rehabilitation Success',
            description: '{player} successfully completed rehabilitation, fully healing their {injury}.',
            effectType: 'injury',
            severity: -3
        }
    ],
    // ═════════════════════════════════════════════════════════════════════════════
    // FAN VOLUNTEER - Fan joins team as a player
    // ═════════════════════════════════════════════════════════════════════════════
    fan_volunteer: [
        {
            id: 'fan_volunteer_player',
            name: 'Fan Volunteers to Play',
            description: 'A dedicated fan volunteered to play for {team} this season.',
            effectType: 'fan_volunteer_player'
        }
    ],

    // ══════════════════════════════════════════════════════════════════════════════
    // TRAIT EVENTS - Give 1-3 random players a trait (good or bad)
    // ══════════════════════════════════════════════════════════════════════════════
    trait_events: [
        {
            id: 'trait_rookie_workshop',
            name: 'Rookie Development Workshop',
            description: '{team} held a rookie development workshop to instill professional habits.',
            effectType: 'traits',
            playerMin: 1,
            playerMax: 3
        },
        {
            id: 'trait_veteran_mentorship',
            name: 'Veteran Mentorship Program',
            description: '{team} veterans mentored younger players on the craft of the game.',
            effectType: 'traits',
            playerMin: 1,
            playerMax: 3
        },
        {
            id: 'trait_leadership_council',
            name: 'Leadership Council',
            description: '{team} formed a player leadership council to set standards and culture.',
            effectType: 'traits',
            playerMin: 1,
            playerMax: 3
        },
        {
            id: 'trait_bad_habit_break',
            name: 'Bad Habit Intervention',
            description: '{team} coaches intervened to break players bad habits before they set in.',
            effectType: 'traits',
            playerMin: 1,
            playerMax: 3
        },
        {
            id: 'trait_team_chemistry',
            name: 'Team Chemistry Bond',
            description: '{team} spent a week bonding off the field, building trust and chemistry.',
            effectType: 'traits',
            playerMin: 1,
            playerMax: 3
        }
    ]
};


if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportsEvents;
} else if (typeof window !== 'undefined') {
    window.SportsEvents = SportsEvents;
}
