# Award Icon Theme Guide
# Sovereignty Epochs - Award System Asset Documentation
# Location: docs/DEV/award-icons.md

This document lists all award icons needed for the AwardSystem. Each award requires a themed icon image in `assets/images/Awards/`.

Awards are organized into 7 categories (matching `assets/data/awards/*.js`):

| Category | Data File | Icon Color Theme |
|----------|-----------|-------------------|
| military-war | `assets/data/awards/military-war.js` | Red/Gold #FFD700, #FF4500, #8B0000 |
| population-citizen | `assets/data/awards/population-citizen.js` | Blue/Green #4169E1, #32CD32, #20B2AA |
| research-tech | `assets/data/awards/research-tech.js` | Purple/Blue #8A2BE2, #9370DB, #0000FF |
| nation-player | `assets/data/awards/nation-player.js` | Gold/Purple #FFD700, #800080, #4B0082 |
| sports-tournament | `assets/data/awards/sports-tournament.js` | Green/Yellow #FFD700, #32CD32, #FF4500 |
| forum-message | `assets/data/awards/forum-message.js` | Teal/Pink #20B2AA, #FF69B4, #FF1493 |
| diplomacy-ties | `assets/data/awards/diplomacy-ties.js` | Blue/Silver #4682B4, #708090, #B0C4DE |

## Increment Set Rule

Awards that share the same `trackKey` form an increment set (e.g. wars_won_1 → wars_won_10 → ... → wars_won_1000 all track `statistics.warsWon`). When displaying awards in the UI, show only the **highest unlocked tier** — do not display all tiers simultaneously. Each tier in a set has its own distinct icon that escalates in visual prominence.

Standalone awards (single award per trackKey, or non-progressive awards like skill maxes) do not have tiers and are shown individually.

---

## 1. Military & War (assets/data/awards/military-war.js)

### Wars Won
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| wars_won_1 | First Victory | 1 | statistics.warsWon | counter | 🗡️ | 1 of 9 |
| wars_won_10 | Warrior | 10 | statistics.warsWon | counter | ⚔️ | 2 of 9 |
| wars_won_25 | Veteran | 25 | statistics.warsWon | counter | 🪓 | 3 of 9 |
| wars_won_50 | Seasoned Warrior | 50 | statistics.warsWon | counter | 🔨 | 4 of 9 |
| wars_won_75 | Battle-Hardened | 75 | statistics.warsWon | counter | ⚒️ | 5 of 9 |
| wars_won_100 | Warmonger | 100 | statistics.warsWon | counter | 🗡️‍⬛ | 6 of 9 |
| wars_won_250 | Warlord | 250 | statistics.warsWon | counter | ⚔️‍⬛ | 7 of 9 |
| wars_won_500 | Conqueror | 500 | statistics.warsWon | counter | ⚔️‍🔥 | 8 of 9 |
| wars_won_1000 | World Conqueror | 1000 | statistics.warsWon | counter | ⚔️‍👑 | 9 of 9 (highest) |

### Wars Fought (win or lose)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| wars_fought_1 | First Fight | 1 | statistics.warsFought | counter | 🥊 | 1 of 9 |
| wars_fought_10 | Combatant | 10 | statistics.warsFought | counter | 🥋 | 2 of 9 |
| wars_fought_25 | Soldier | 25 | statistics.warsFought | counter | 🪖 | 3 of 9 |
| wars_fought_50 | War Veteran | 50 | statistics.warsFought | counter | 🎖️ | 4 of 9 |
| wars_fought_75 | Battle Scarred | 75 | statistics.warsFought | counter | 🩸 | 5 of 9 |
| wars_fought_100 | Warrior King | 100 | statistics.warsFought | counter | 👑 | 6 of 9 |
| wars_fought_250 | War Machine | 250 | statistics.warsFought | counter | 🤖 | 7 of 9 |
| wars_fought_500 | Perpetual War | 500 | statistics.warsFought | counter | 🔄 | 8 of 9 |
| wars_fought_1000 | Eternal Warrior | 1000 | statistics.warsFought | counter | ♾️ | 9 of 9 (highest) |

### Missile Launches
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| missile_launch_1 | First Missile | 1 | statistics.missileLaunches | counter | 🚀 | 1 of 9 |
| missile_launch_25 | Missile Barrage | 25 | statistics.missileLaunches | counter | 🚀💥 | 2 of 9 |
| missile_launch_50 | Missile Storm | 50 | statistics.missileLaunches | counter | 🚀🌪️ | 3 of 9 |
| missile_launch_100 | Missile Rain | 100 | statistics.missileLaunches | counter | 🚀🌧️ | 4 of 9 |
| missile_launch_250 | Missile Apocalypse | 250 | statistics.missileLaunches | counter | ☄️ | 5 of 9 |
| missile_launch_500 | Missile Devastation | 500 | statistics.missileLaunches | counter | 💥🌍 | 6 of 9 |
| missile_launch_1000 | Missile Holocaust | 1000 | statistics.missileLaunches | counter | ☢️💥 | 7 of 9 |
| missile_launch_2500 | Missile Armageddon | 2500 | statistics.missileLaunches | counter | 💀🚀 | 8 of 9 |
| missile_launch_5000 | Missile Doomsday | 5000 | statistics.missileLaunches | counter | 🌑🚀 | 9 of 9 (highest) |

### Nuke Launches
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| nuke_launch_1 | First Nuke | 1 | statistics.nukeLaunches | counter | ☢️ | 1 of 9 |
| nuke_launch_25 | Nuclear Winter | 25 | statistics.nukeLaunches | counter | ☢️❄️ | 2 of 9 |
| nuke_launch_50 | Nuclear Holocaust | 50 | statistics.nukeLaunches | counter | ☢️💀 | 3 of 9 |
| nuke_launch_100 | Nuclear Devastation | 100 | statistics.nukeLaunches | counter | ☢️🔥 | 4 of 9 |
| nuke_launch_250 | Nuclear Apocalypse | 250 | statistics.nukeLaunches | counter | ☢️🌍 | 5 of 9 |
| nuke_launch_500 | Nuclear Armageddon | 500 | statistics.nukeLaunches | counter | ☢️💀🔥 | 6 of 9 |
| nuke_launch_1000 | Nuclear Doomsday | 1000 | statistics.nukeLaunches | counter | ☢️💀⚡ | 7 of 9 |
| nuke_launch_2500 | Nuclear Cataclysm | 2500 | statistics.nukeLaunches | counter | ☢️🌋 | 8 of 9 |
| nuke_launch_5000 | Nuclear Annihilation | 5000 | statistics.nukeLaunches | counter | ☢️🌑 | 9 of 9 (highest) |

### Blocked Missiles/Nukes
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| block_1 | First Block | 1 | statistics.missilesBlocked | counter | 🛡️ | 1 of 8 |
| block_25 | Blocker | 25 | statistics.missilesBlocked | counter | 🛡️⚔️ | 2 of 8 |
| block_50 | Shield | 50 | statistics.missilesBlocked | counter | 🛡️🔒 | 3 of 8 |
| block_75 | Wall | 75 | statistics.missilesBlocked | counter | 🧱 | 4 of 8 |
| block_100 | Fortress | 100 | statistics.missilesBlocked | counter | 🏰 | 5 of 8 |
| block_250 | Bastion | 250 | statistics.missilesBlocked | counter | 🏰🛡️ | 6 of 8 |
| block_500 | Citadel | 500 | statistics.missilesBlocked | counter | 🏰⚔️ | 7 of 8 |
| block_1000 | Iron Dome | 1000 | statistics.missilesBlocked | counter | 🛡️✨ | 8 of 8 (highest) |

### Exactly 300 Soldiers (30 days)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| spartan_300 | Spartan 300 | 30 days | statistics.exactly300SoldiersDays | counter | 🛡️🏛️ | standalone |

### Soldiers (peak)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| soldiers_25k | Small Army | 25,000 | militaryUnits.soldiers | peak | 👥 | 1 of 8 |
| soldiers_50k | Medium Army | 50,000 | militaryUnits.soldiers | peak | 🪖 | 2 of 8 |
| soldiers_100k | Large Army | 100,000 | militaryUnits.soldiers | peak | 👨‍✈️ | 3 of 8 |
| soldiers_250k | Massive Army | 250,000 | militaryUnits.soldiers | peak | 👥⚔️ | 4 of 8 |
| soldiers_500k | Horde Army | 500,000 | militaryUnits.soldiers | peak | 👥🔥 | 5 of 8 |
| soldiers_1m | Legion Army | 1,000,000 | militaryUnits.soldiers | peak | 👑👥 | 6 of 8 |
| soldiers_5m | Titan Army | 5,000,000 | militaryUnits.soldiers | peak | 🦸‍♂️👥 | 7 of 8 |
| soldiers_10m | God Army | 10,000,000 | militaryUnits.soldiers | peak | 👑⚡👥 | 8 of 8 (highest) |

### Tanks (peak)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| tanks_1000 | Tank Division | 1,000 | militaryUnits.tanks | peak | 🏎️ | 1 of 8 |
| tanks_2500 | Tank Corps | 2,500 | militaryUnits.tanks | peak | 🏎️🔥 | 2 of 8 |
| tanks_5000 | Tank Army | 5,000 | militaryUnits.tanks | peak | 🏎️⚔️ | 3 of 8 |
| tanks_10k | Tank Legion | 10,000 | militaryUnits.tanks | peak | 🏎️👑 | 4 of 8 |
| tanks_25k | Tank Horde | 25,000 | militaryUnits.tanks | peak | 🏎️💥 | 5 of 8 |
| tanks_50k | Tank Flood | 50,000 | militaryUnits.tanks | peak | 🏎️🌊 | 6 of 8 |
| tanks_100k | Tank Swarm | 100,000 | militaryUnits.tanks | peak | 🏎️🐝 | 7 of 8 |
| tanks_1m | Tank Tsunami | 1,000,000 | militaryUnits.tanks | peak | 🏎️🌊👑 | 8 of 8 (highest) |

### Aircraft (peak)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| aircraft_500 | Air Squadron | 500 | militaryUnits.aircraft | peak | ✈️ | 1 of 8 |
| aircraft_1000 | Air Wing | 1,000 | militaryUnits.aircraft | peak | ✈️🔥 | 2 of 8 |
| aircraft_2500 | Air Fleet | 2,500 | militaryUnits.aircraft | peak | ✈️⚔️ | 3 of 8 |
| aircraft_5000 | Air Armada | 5,000 | militaryUnits.aircraft | peak | ✈️👑 | 4 of 8 |
| aircraft_10k | Air Dominance | 10,000 | militaryUnits.aircraft | peak | ✈️💥 | 5 of 8 |
| aircraft_25k | Air Supremacy | 25,000 | militaryUnits.aircraft | peak | ✈️👑🔥 | 6 of 8 |
| aircraft_50k | Air Overlord | 50,000 | militaryUnits.aircraft | peak | ✈️👑⚡ | 7 of 8 |
| aircraft_100k | Air God | 100,000 | militaryUnits.aircraft | peak | ✈️☁️👑 | 8 of 8 (highest) |

### Ships (peak)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| ships_250 | Coastal Navy | 250 | militaryUnits.ships | peak | 🚢 | 1 of 8 |
| ships_500 | Regional Navy | 500 | militaryUnits.ships | peak | 🚢🌊 | 2 of 8 |
| ships_1000 | Blue Water Navy | 1,000 | militaryUnits.ships | peak | 🚢⚓ | 3 of 8 |
| ships_2500 | Ocean Navy | 2,500 | militaryUnits.ships | peak | 🚢🌊🔥 | 4 of 8 |
| ships_5000 | Fleet Navy | 5,000 | militaryUnits.ships | peak | 🚢👑 | 5 of 8 |
| ships_10k | Armada Navy | 10,000 | militaryUnits.ships | peak | 🚢💥 | 6 of 8 |
| ships_25k | Leviathan Navy | 25,000 | militaryUnits.ships | peak | 🐉🚢 | 7 of 8 |
| ships_50k | Ocean God Navy | 50,000 | militaryUnits.ships | peak | 🌊👑🚢 | 8 of 8 (highest) |

### Spies (peak)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| spies_25 | Secret Agent | 25 | militaryUnits.spies | peak | 🕵️‍♂️ | 1 of 8 |
| spies_50 | Double Agent | 50 | militaryUnits.spies | peak | 🕵️‍♀️ | 2 of 8 |
| spies_75 | Master Spy | 75 | militaryUnits.spies | peak | 🕵️‍♂️🎭 | 3 of 8 |
| spies_100 | Shadow Agency | 100 | militaryUnits.spies | peak | 🕵️‍♀️🌑 | 4 of 8 |
| spies_150 | Spy Network | 150 | militaryUnits.spies | peak | 🕸️🕵️‍♂️ | 5 of 8 |
| spies_200 | Intelligence Bureau | 200 | militaryUnits.spies | peak | 📁🕵️‍♀️ | 6 of 8 |
| spies_250 | Espionage State | 250 | militaryUnits.spies | peak | 🏛️🕵️‍♂️ | 7 of 8 |
| spies_500 | Big Brother | 500 | militaryUnits.spies | peak | 👁️👁️👁️ | 8 of 8 (highest) |

### Missiles Stockpiled (peak)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| missiles_1 | Missile Stash | 1 | militaryUnits.missiles | peak | 🚀 | 1 of 8 |
| missiles_5 | Missile Cache | 5 | militaryUnits.missiles | peak | 🚀📦 | 2 of 8 |
| missiles_10 | Missile Stockpile | 10 | militaryUnits.missiles | peak | 🚀🏪 | 3 of 8 |
| missiles_25 | Missile Silo | 25 | militaryUnits.missiles | peak | 🚀🏭 | 4 of 8 |
| missiles_50 | Missile Fortress | 50 | militaryUnits.missiles | peak | 🚀🏰 | 5 of 8 |
| missiles_75 | Missile Base | 75 | militaryUnits.missiles | peak | 🚀🪖 | 6 of 8 |
| missiles_100 | Missile Command | 100 | militaryUnits.missiles | peak | 🚀⭐ | 7 of 8 |
| missiles_250 | Missile Empire | 250 | militaryUnits.missiles | peak | 🚀👑 | 8 of 8 (highest) |

### Nukes Stockpiled (peak)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| nukes_1 | First Warhead | 1 | militaryUnits.nukes | peak | ☢️ | 1 of 8 |
| nukes_5 | Nuclear Cache | 5 | militaryUnits.nukes | peak | ☢️📦 | 2 of 8 |
| nukes_10 | Nuclear Stockpile | 10 | militaryUnits.nukes | peak | ☢️🏪 | 3 of 8 |
| nukes_25 | Nuclear Silo | 25 | militaryUnits.nukes | peak | ☢️🏭 | 4 of 8 |
| nukes_50 | Nuclear Fortress | 50 | militaryUnits.nukes | peak | ☢️🏰 | 5 of 8 |
| nukes_75 | Nuclear Base | 75 | militaryUnits.nukes | peak | ☢️🪖 | 6 of 8 |
| nukes_100 | Nuclear Command | 100 | militaryUnits.nukes | peak | ☢️⭐ | 7 of 8 |
| nukes_250 | Nuclear Empire | 250 | militaryUnits.nukes | peak | ☢️👑 | 8 of 8 (highest) |

### War Duration
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| war_30 | Warmonger | 30 days | statistics.warDays | counter | 🗡️ | 1 of 5 |
| war_60 | War Veteran | 60 days | statistics.warDays | counter | ⚔️ | 2 of 5 |
| war_90 | Seasoned Warlord | 90 days | statistics.warDays | counter | 🪓 | 3 of 5 |
| war_180 | Elite Warlord | 180 days | statistics.warDays | counter | ⚔️‍🔥 | 4 of 5 |
| war_365 | Grand Warlord | 365 days | statistics.warDays | counter | ⚔️‍👑 | 5 of 5 (highest) |

### Peace Duration
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| peace_30 | Peacekeeper | 30 days | statistics.peacefulDays | counter | 🕊️ | 1 of 5 |
| peace_60 | Peace Advocate | 60 days | statistics.peacefulDays | counter | 🕊️🌿 | 2 of 5 |
| peace_90 | Peace Champion | 90 days | statistics.peacefulDays | counter | 🕊️💐 | 3 of 5 |
| peace_180 | Peace Guardian | 180 days | statistics.peacefulDays | counter | 🕊️🛡️ | 4 of 5 |
| peace_365 | Peace Supreme | 365 days | statistics.peacefulDays | counter | 🕊️👑 | 5 of 5 (highest) |

### Espionage (spy missions)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| spymaster | Spymaster | 50 missions | statistics.spyMissions | counter | 🕵️‍♂️ | 1 of 4* |
| master_spy_elite | Elite Spy | 100 missions | statistics.spyMissions | counter | 🕵️‍♀️ | 2 of 4* |
| master_spy_grandmaster | Grandmaster Spy | 250 missions | statistics.spyMissions | counter | 🕵️‍♂️🎭 | 3 of 4* |
| master_spy_emperor | Emperor Spy | 500 missions | statistics.spyMissions | counter | 👑🕵️‍♀️ | 4 of 4* (highest) |

*spymaster (50) is the first tier of this set; master_spy_* are the higher tiers.

### Espionage Operations
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| invisible_hand | Invisible Hand | 250 ops | statistics.espionageOperationsTotal | counter | 👻 | 1 of 4 |
| invisible_hand_elite | Elite Invisible Hand | 500 ops | statistics.espionageOperationsTotal | counter | 👻🎭 | 2 of 4 |
| invisible_hand_grandmaster | Grandmaster Invisible Hand | 1000 ops | statistics.espionageOperationsTotal | counter | 👻🕵️‍♂️ | 3 of 4 |
| invisible_hand_emperor | Emperor Invisible Hand | 2500 ops | statistics.espionageOperationsTotal | counter | 👻👑 | 4 of 4 (highest) |

---

## 2. Population & Citizen (assets/data/awards/population-citizen.js)

### Population
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| baby_boom | Baby Boom | 100,000 | population | peak | 👶 | 1 of 9 |
| melting_pot | Melting Pot | 500,000 | population | peak | 👥 | 2 of 9 |
| citizen_king | Citizen King | 1,000,000 | population | peak | 👑 | 3 of 9 |
| global_population | Global Population | 10,000,000 | population | peak | 🌍 | 4 of 9 |
| world_population | World Population | 100,000,000 | population | peak | 🌍🌟 | 5 of 9 |
| massive_population | Massive Population | 500,000,000 | population | peak | 🌍🔥 | 6 of 9 |
| planet_population | Planet Population | 1,000,000,000 | population | peak | 🌎👑 | 7 of 9 |
| super_population | Super Population | 10,000,000,000 | population | peak | 🌎💥 | 8 of 9 |
| ultimate_population | Ultimate Population | 100,000,000,000 | population | peak | 🌌👑 | 9 of 9 (highest) |

### Immigration
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| immigrant_nation | Immigrant Nation | 5,000 | statistics.immigrantsAccepted | counter | 🚢 | 1 of 9 |
| immigrant_welcome | Immigrant Welcome | 10,000 | statistics.immigrantsAccepted | counter | 🚢🌊 | 2 of 9 |
| immigrant_open | Immigrant Open | 25,000 | statistics.immigrantsAccepted | counter | 🚢🌟 | 3 of 9 |
| immigrant_haven | Immigrant Haven | 50,000 | statistics.immigrantsAccepted | counter | 🚢🏠 | 4 of 9 |
| immigrant_refuge | Immigrant Refuge | 75,000 | statistics.immigrantsAccepted | counter | 🚢🛡️ | 5 of 9 |
| immigrant_sanctuary | Immigrant Sanctuary | 100,000 | statistics.immigrantsAccepted | counter | 🚢🕊️ | 6 of 9 |
| immigrant_paradise | Immigrant Paradise | 250,000 | statistics.immigrantsAccepted | counter | 🚢🏝️ | 7 of 9 |
| immigrant_utopia | Immigrant Utopia | 500,000 | statistics.immigrantsAccepted | counter | 🚢🌟🏠 | 8 of 9 |
| immigrant_paragon | Immigrant Paragon | 1,000,000 | statistics.immigrantsAccepted | counter | 🚢👑 | 9 of 9 (highest) |

### Pollution
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| clean_air | Clean Air | 30 days | statistics.zeroPollutionDays | counter | 🌿 | 1 of 3 |
| pristine_environment | Pristine Environment | 60 days | statistics.zeroPollutionDays | counter | 🌿💧 | 2 of 3 |
| untouched_wilderness | Untouched Wilderness | 90 days | statistics.zeroPollutionDays | counter | 🌲🌿 | 3 of 3 (highest) |

### Crime
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| crime_free | Crime Free | 30 days | statistics.zeroCrimeDays | counter | 👮 | 1 of 6 |
| safe_streets | Safe Streets | 60 days | statistics.zeroCrimeDays | counter | 👮🔒 | 2 of 6 |
| utopia_safety | Utopia Safety | 90 days | statistics.zeroCrimeDays | counter | 👮⭐ | 3 of 6 |
| perfect_order_180 | Perfect Order | 180 days | statistics.zeroCrimeDays | counter | 👮🛡️ | 4 of 6 |
| zero_crime_365 | Zero Crime | 365 days | statistics.zeroCrimeDays | counter | 👮👑 | 5 of 6 |
| eternal_peace | Eternal Peace | 730 days | statistics.zeroCrimeDays | counter | 👮🕊️ | 6 of 6 (highest) |

### Disease
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| disease_free | Disease Free | 30 days | statistics.zeroDiseaseDays | counter | 🏥 | 1 of 6 |
| healthy_populace | Healthy Populace | 60 days | statistics.zeroDiseaseDays | counter | 🏥💊 | 2 of 6 |
| immortal_nation | Immortal Nation | 90 days | statistics.zeroDiseaseDays | counter | 🏥💪 | 3 of 6 |
| disease_free_180 | Disease Free | 180 days | statistics.zeroDiseaseDays | counter | 🏥🛡️ | 4 of 6 |
| healthy_365 | Healthy Nation | 365 days | statistics.zeroDiseaseDays | counter | 🏥👑 | 5 of 6 |
| immortal_730 | Immortal | 730 days | statistics.zeroDiseaseDays | counter | 🏥💀❌ | 6 of 6 (highest) |

### Happiness
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| utopia_happiness | Utopia Happiness | 30 days | statistics.perfectHappinessDays | counter | 😊 | 1 of 6 |
| blissful_nation | Blissful Nation | 60 days | statistics.perfectHappinessDays | counter | 😊🌸 | 2 of 6 |
| eternal_joy | Eternal Joy | 90 days | statistics.perfectHappinessDays | counter | 😊⭐ | 3 of 6 |
| ultimate_happiness_180 | Ultimate Happiness | 180 days | statistics.perfectHappinessDays | counter | 😊💎 | 4 of 6 |
| perfect_happiness_365 | Perfect Happiness | 365 days | statistics.perfectHappinessDays | counter | 😊👑 | 5 of 6 |
| infinite_joy_730 | Infinite Joy | 730 days | statistics.perfectHappinessDays | counter | 😊♾️ | 6 of 6 (highest) |

---

## 3. Research & Technology (assets/data/awards/research-tech.js)

### Research Completion
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| atomic_age | Atomic Age | 50% | statistics.researchCompleted | counter | ⚛️ | 1 of 4 |
| future_tech | Future Tech | 65% | statistics.researchCompleted | peak | 🔬 | 2 of 4 |
| scientific_powerhouse | Scientific Powerhouse | 80% | statistics.researchCompleted | peak | 🧪 | 3 of 4 |
| tech_singularity | Tech Singularity | 95% | statistics.researchCompleted | peak | 🤖 | 4 of 4 (highest) |

### Literacy Rates
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| scholar_nation | Scholar Nation | 50% | statistics.literacyScore | peak | 📚 | 1 of 4 |
| literate_nation | Literate Nation | 65% | statistics.literacyScore | peak | 📖 | 2 of 4 |
| enlightened_nation | Enlightened Nation | 80% | statistics.literacyScore | peak | 📜✨ | 3 of 4 |
| wise_nation | Wise Nation | 95% | statistics.literacyScore | peak | 🦉📚 | 4 of 4 (highest) |

### Technologies Purchased
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| tech_purchased_250 | Researcher | 250 | statistics.techPurchased | peak | 🔬 | 1 of 11 |
| tech_purchased_500 | Scholar | 500 | statistics.techPurchased | peak | 📚 | 2 of 11 |
| tech_purchased_750 | Academic | 750 | statistics.techPurchased | peak | 🎓 | 3 of 11 |
| tech_purchased_1000 | Scientist | 1,000 | statistics.techPurchased | peak | 🧪 | 4 of 11 |
| tech_purchased_1500 | Expert | 1,500 | statistics.techPurchased | peak | 👨‍🔬 | 5 of 11 |
| tech_purchased_2000 | Specialist | 2,000 | statistics.techPurchased | peak | 🧬 | 6 of 11 |
| tech_purchased_2500 | Authority | 2,500 | statistics.techPurchased | peak | 🏅 | 7 of 11 |
| tech_purchased_3000 | Master | 3,000 | statistics.techPurchased | peak | 👑 | 8 of 11 |
| tech_purchased_3500 | Grandmaster | 3,500 | statistics.techPurchased | peak | 🏆 | 9 of 11 |
| tech_purchased_4500 | Legend | 4,500 | statistics.techPurchased | peak | ⭐ | 10 of 11 |
| tech_purchased_5000 | Tech God | 5,000 | statistics.techPurchased | peak | 🚀👑 | 11 of 11 (highest) |

---

## 4. Nation & Player (assets/data/awards/nation-player.js)

### Government Changes
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| policy_maker | Policy Maker | 25 | statistics.governmentChanges | counter | 📜 | 1 of 3 |
| policy_architect | Policy Architect | 50 | statistics.governmentChanges | counter | 📜🏛️ | 2 of 3 |
| policy_tyrant | Policy Tyrant | 100 | statistics.governmentChanges | counter | 📜👑 | 3 of 3 (highest) |

### Religion Changes
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| faithful | Faithful | 25 | statistics.religionChanges | counter | ⛪ | 1 of 3 |
| religious_zealot | Religious Zealot | 50 | statistics.religionChanges | counter | ⛪🔥 | 2 of 3 |
| religious_fanatic | Religious Fanatic | 100 | statistics.religionChanges | counter | ⛪👑 | 3 of 3 (highest) |

### Uniform Population
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| divine_population | Divine Population | 60 days | statistics.uniformPopulationDays | counter | 🙏👑 | standalone |

### Skill Max Awards (Level 20)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| skill_max_attack | Master Attacker | 20 | skills.attack.level | peak | ⚔️ | standalone |
| skill_max_defense | Master Defender | 20 | skills.defense.level | peak | 🛡️ | standalone |
| skill_max_aim | Master Marksman | 20 | skills.aim.level | peak | 🎯 | standalone |
| skill_max_luck | Lucky Charm | 20 | skills.luck.level | peak | 🍀 | standalone |
| skill_max_critical_damage | Critical Overload | 20 | skills.criticalDamage.level | peak | 💥 | standalone |
| skill_max_critical_chance | Critical Eye | 20 | skills.criticalChance.level | peak | 🎲 | standalone |
| skill_max_block | Iron Wall | 20 | skills.block.level | peak | 🪖 | standalone |
| skill_max_parry | Parry Master | 20 | skills.parry.level | peak | 🗡️ | standalone |
| skill_max_energy | Energized | 20 | skills.energy.level | peak | ⚡ | standalone |
| skill_max_intuition | Seer | 20 | skills.intuition.level | peak | 🧠 | standalone |
| skill_max_taxation | Taxman | 20 | skills.taxation.level | peak | 💰 | standalone |
| skill_max_diplomacy | Master Diplomat | 20 | skills.diplomacy.level | peak | 🤝 | standalone |

### Legendary Prestige Awards
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| legendary_1 | First Legendary | 1 | totalLegendaryLevels | peak | ⭐ | 1 of 6 |
| legendary_5 | Five-Time Legendary | 5 | totalLegendaryLevels | peak | ⭐💫 | 2 of 6 |
| legendary_10 | Ten-Time Legendary | 10 | totalLegendaryLevels | peak | ⭐✨ | 3 of 6 |
| legendary_15 | Fifteen-Time Legendary | 15 | totalLegendaryLevels | peak | ⭐💎 | 4 of 6 |
| legendary_20 | Twenty-Time Legendary | 20 | totalLegendaryLevels | peak | ⭐👑 | 5 of 6 |
| legendary_25 | Twenty-Five-Time Legendary | 25 | totalLegendaryLevels | peak | ⭐🌟 | 6 of 6 (highest) |

### Economy (Nation Wealth)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| millionaire | Millionaire | $1M | money | peak | 💰 | 1 of 11 |
| cool_millionaire | Cool Millionaire | $100M | money | peak | 💰❄️ | 2 of 11 |
| multi_millionaire | Multi Millionaire | $500M | money | peak | 💰💎 | 3 of 11 |
| billionaire | Billionaire | $1B | money | peak | 💰👑 | 4 of 11 |
| tycoon | Tycoon | $10B | money | peak | 💰🏢 | 5 of 11 |
| cool_billionaire | Cool Billionaire | $100B | money | peak | 💰👑❄️ | 6 of 11 |
| multi_billionaire | Multi Billionaire | $500B | money | peak | 💰💎👑 | 7 of 11 |
| trillionaire | Trillionaire | $1T | money | peak | 💰🌍 | 8 of 11 |
| economic_superpower | Economic Superpower | $10T | money | peak | 💰🌍👑 | 9 of 11 |
| cool_trillionaire | Cool Trillionaire | $100T | money | peak | 💰🌍❄️ | 10 of 11 |
| multi_trillionaire | Multi Trillionaire | $500T | money | peak | 💰💎🌍👑 | 11 of 11 (highest) |

---

## 5. Sports & Tournament (assets/data/awards/sports-tournament.js)

### World Championships Won
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| championship_1 | First Champion | 1 | statistics.worldChampionshipsWon | counter | 🏆 | 1 of 9 |
| championship_5 | Champion | 5 | statistics.worldChampionshipsWon | counter | 🏆🏅 | 2 of 9 |
| championship_10 | Elite Champion | 10 | statistics.worldChampionshipsWon | counter | 🏆🌟 | 3 of 9 |
| championship_25 | Legendary Champion | 25 | statistics.worldChampionshipsWon | counter | 🏆💎 | 4 of 9 |
| championship_50 | Grand Champion | 50 | statistics.worldChampionshipsWon | counter | 🏆👑 | 5 of 9 |
| championship_75 | Master Champion | 75 | statistics.worldChampionshipsWon | counter | 🏆💎👑 | 6 of 9 |
| championship_100 | Immortal Champion | 100 | statistics.worldChampionshipsWon | counter | 🏆💀❌ | 7 of 9 |
| championship_250 | Supreme Champion | 250 | statistics.worldChampionshipsWon | counter | 🏆🌟👑 | 8 of 9 |
| championship_500 | God Champion | 500 | statistics.worldChampionshipsWon | counter | 🏆🌌 | 9 of 9 (highest) |

### Season Tournaments Won
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| season_1 | First Season | 1 | statistics.seasonTournamentsWon | counter | 🏅 | 1 of 9 |
| season_5 | Season Winner | 5 | statistics.seasonTournamentsWon | counter | 🏅🏆 | 2 of 9 |
| season_10 | Season Master | 10 | statistics.seasonTournamentsWon | counter | 🏅🌟 | 3 of 9 |
| season_25 | Season Legend | 25 | statistics.seasonTournamentsWon | counter | 🏅💎 | 4 of 9 |
| season_50 | Season King | 50 | statistics.seasonTournamentsWon | counter | 🏅👑 | 5 of 9 |
| season_75 | Season Grandmaster | 75 | statistics.seasonTournamentsWon | counter | 🏅💎👑 | 6 of 9 |
| season_100 | Season Emperor | 100 | statistics.seasonTournamentsWon | counter | 🏅👑🔥 | 7 of 9 |
| season_250 | Season Sovereign | 250 | statistics.seasonTournamentsWon | counter | 🏅👑✨ | 8 of 9 |
| season_500 | Season God | 500 | statistics.seasonTournamentsWon | counter | 🏅🌌 | 9 of 9 (highest) |

### Sports Games Won
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| games_won_1 | First Win | 1 | statistics.sportsGamesWon | counter | 🏅 | 1 of 9 |
| games_won_25 | Winner | 25 | statistics.sportsGamesWon | counter | 🏅🏆 | 2 of 9 |
| games_won_50 | Victor | 50 | statistics.sportsGamesWon | counter | 🏅🌟 | 3 of 9 |
| games_won_100 | Undefeated | 100 | statistics.sportsGamesWon | counter | 🏅💎 | 4 of 9 |
| games_won_250 | Unbeatable | 250 | statistics.sportsGamesWon | counter | 🏅👑 | 5 of 9 |
| games_won_500 | Immortal Athlete | 500 | statistics.sportsGamesWon | counter | 🏅💀❌ | 6 of 9 |
| games_won_1k | God of Sport | 1,000 | statistics.sportsGamesWon | counter | 🏅👑🔥 | 7 of 9 |
| games_won_5k | Legend Athlete | 5,000 | statistics.sportsGamesWon | counter | 🏅✨👑 | 8 of 9 |
| games_won_10k | Sports Titan | 10,000 | statistics.sportsGamesWon | counter | 🏅🌌 | 9 of 9 (highest) |

### Sports Fans (peak)
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| fans_5k | Fan Favorite | 5,000 | statistics.totalSportsFans | peak | 📣 | 1 of 9 |
| fans_10k | Popular | 10,000 | statistics.totalSportsFans | peak | 📣🌟 | 2 of 9 |
| fans_25k | Well Known | 25,000 | statistics.totalSportsFans | peak | 📣💎 | 3 of 9 |
| fans_50k | Famous | 50,000 | statistics.totalSportsFans | peak | 📣👑 | 4 of 9 |
| fans_100k | Celebrity | 100,000 | statistics.totalSportsFans | peak | 📣✨ | 5 of 9 |
| fans_250k | Star | 250,000 | statistics.totalSportsFans | peak | 📣🌟👑 | 6 of 9 |
| fans_500k | Superstar | 500,000 | statistics.totalSportsFans | peak | 📣💎👑 | 7 of 9 |
| fans_1m | Icon | 1,000,000 | statistics.totalSportsFans | peak | 📣👑🔥 | 8 of 9 |
| fans_10m | Legend | 10,000,000 | statistics.totalSportsFans | peak | 📣🌌 | 9 of 9 (highest) |

### Players Drafted
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| drafted_1 | First Draft | 1 | statistics.playersDrafted | counter | 📋 | 1 of 10 |
| drafted_25 | Draft King | 25 | statistics.playersDrafted | counter | 📋👑 | 2 of 10 |
| drafted_50 | Elite Draft King | 50 | statistics.playersDrafted | counter | 📋🌟 | 3 of 10 |
| drafted_100 | Grandmaster Draft King | 100 | statistics.playersDrafted | counter | 📋💎 | 4 of 10 |
| drafted_250 | Draft Architect | 250 | statistics.playersDrafted | counter | 📋🏗️ | 5 of 10 |
| drafted_500 | Draft Emperor | 500 | statistics.playersDrafted | counter | 📋👑🔥 | 6 of 10 |
| drafted_750 | Draft Sovereign | 750 | statistics.playersDrafted | counter | 📋👑✨ | 7 of 10 |
| drafted_1k | Draft Titan | 1,000 | statistics.playersDrafted | counter | 📋👑💎 | 8 of 10 |
| drafted_2.5k | Draft God | 2,500 | statistics.playersDrafted | counter | 📋🌌 | 9 of 10 |
| drafted_5k | Draft Legend | 5,000 | statistics.playersDrafted | counter | 📋👑🌟 | 10 of 10 (highest) |

### Injuries
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| injuries_1 | First Injury | 1 | statistics.injuriesTotal | counter | 🩹 | 1 of 9 |
| injuries_5 | Injured | 5 | statistics.injuriesTotal | counter | 🩹🩸 | 2 of 9 |
| injuries_10 | Walking Wounded | 10 | statistics.injuriesTotal | counter | 🩹🦽 | 3 of 9 |
| injuries_25 | Hurt | 25 | statistics.injuriesTotal | counter | 🩹💔 | 4 of 9 |
| injuries_50 | Battle Scarred | 50 | statistics.injuriesTotal | counter | 🩹🪖 | 5 of 9 |
| injuries_75 | Bruised | 75 | statistics.injuriesTotal | counter | 🩹🩸🩸 | 6 of 9 |
| injuries_100 | Beaten Up | 100 | statistics.injuriesTotal | counter | 🩹💀 | 7 of 9 |
| injuries_250 | Battle Hardened | 250 | statistics.injuriesTotal | counter | 🩹🪖💪 | 8 of 9 |
| injuries_500 | Scarred for Life | 500 | statistics.injuriesTotal | counter | 🩹💀🔥 | 9 of 9 (highest) |

---

## 6. Forum & Messages (assets/data/awards/forum-message.js)

### Forum Posts
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| forum_legend | Forum Legend | 25 | statistics.forumPostsTotal | counter | 💬 | 1 of 9 |
| forum_legend_elite | Elite Forum Legend | 50 | statistics.forumPostsTotal | counter | 💬🌟 | 2 of 9 |
| forum_legend_grandmaster | Grandmaster Forum Legend | 75 | statistics.forumPostsTotal | counter | 💬💎 | 3 of 9 |
| forum_legend_emperor | Emperor Forum Legend | 100 | statistics.forumPostsTotal | counter | 💬👑 | 4 of 9 |
| forum_legend_titan | Titan Forum Legend | 150 | statistics.forumPostsTotal | counter | 💬💪 | 5 of 9 |
| forum_legend_overlord | Overlord Forum Legend | 200 | statistics.forumPostsTotal | counter | 💬👑🔥 | 6 of 9 |
| forum_legend_archon | Archon Forum Legend | 250 | statistics.forumPostsTotal | counter | 💬✨👑 | 7 of 9 |
| forum_legend_sovereign | Sovereign Forum Legend | 500 | statistics.forumPostsTotal | counter | 💬👑💎 | 8 of 9 |
| forum_legend_god | God Forum Legend | 1000 | statistics.forumPostsTotal | counter | 💬🌌 | 9 of 9 (highest) |

### Forum Threads
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| thread_starter | Thread Starter | 25 | statistics.forumThreadsCreated | counter | 🧵 | 1 of 9 |
| thread_starter_elite | Elite Thread Starter | 50 | statistics.forumThreadsCreated | counter | 🧵🌟 | 2 of 9 |
| thread_starter_grandmaster | Grandmaster Thread Starter | 75 | statistics.forumThreadsCreated | counter | 🧵💎 | 3 of 9 |
| thread_starter_emperor | Emperor Thread Starter | 100 | statistics.forumThreadsCreated | counter | 🧵👑 | 4 of 9 |
| thread_starter_titan | Titan Thread Starter | 150 | statistics.forumThreadsCreated | counter | 🧵💪 | 5 of 9 |
| thread_starter_overlord | Overlord Thread Starter | 200 | statistics.forumThreadsCreated | counter | 🧵👑🔥 | 6 of 9 |
| thread_starter_archon | Archon Thread Starter | 250 | statistics.forumThreadsCreated | counter | 🧵✨👑 | 7 of 9 |
| thread_starter_sovereign | Sovereign Thread Starter | 500 | statistics.forumThreadsCreated | counter | 🧵👑💎 | 8 of 9 |
| thread_starter_god | God Thread Starter | 1000 | statistics.forumThreadsCreated | counter | 🧵🌌 | 9 of 9 (highest) |

### World Forum Motions Proposed
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| statesman | Statesman | 25 | statistics.worldForumMotionsProposed | counter | 🗳️ | 1 of 4 |
| statesman_elite | Elite Statesman | 50 | statistics.worldForumMotionsProposed | counter | 🗳️🌟 | 2 of 4 |
| statesman_grandmaster | Grandmaster Statesman | 75 | statistics.worldForumMotionsProposed | counter | 🗳️💎 | 3 of 4 |
| statesman_emperor | Statesman Emperor | 100 | statistics.worldForumMotionsProposed | counter | 🗳️👑 | 4 of 4 (highest) |

### World Forum Motions Passed
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| kingmaker | Kingmaker | 25 | statistics.worldForumMotionsPassed | counter | 👑 | 1 of 4 |
| kingmaker_elite | Elite Kingmaker | 50 | statistics.worldForumMotionsPassed | counter | 👑🌟 | 2 of 4 |
| kingmaker_grandmaster | Grandmaster Kingmaker | 75 | statistics.worldForumMotionsPassed | counter | 👑💎 | 3 of 4 |
| kingmaker_emperor | Emperor Kingmaker | 100 | statistics.worldForumMotionsPassed | counter | 👑🔥 | 4 of 4 (highest) |

### World Forum Motions Voted
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| united_nations | United Nations | 100 | statistics.worldForumMotionsVoted | counter | 🌍 | 1 of 4 |
| united_nations_elite | Elite United Nations | 250 | statistics.worldForumMotionsVoted | counter | 🌍🌟 | 2 of 4 |
| united_nations_grandmaster | Grandmaster United Nations | 500 | statistics.worldForumMotionsVoted | counter | 🌍💎 | 3 of 4 |
| united_nations_emperor | Emperor United Nations | 1000 | statistics.worldForumMotionsVoted | counter | 🌍👑 | 4 of 4 (highest) |

### Calendar Reform
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| calendar_reformer | Calendar Reformer | 1 | statistics.worldForumCalendarReforms | counter | 📅👑 | standalone |

---

## 7. Diplomacy & Ties (assets/data/awards/diplomacy-ties.js)

### Treaties Signed
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| diplomat | Diplomat | 25 | statistics.treatiesSigned | counter | 🤝 | 1 of 3 |
| diplomat_elite | Elite Diplomat | 50 | statistics.treatiesSigned | counter | 🤝🌟 | 2 of 3 |
| diplomat_grandmaster | Grandmaster Diplomat | 100 | statistics.treatiesSigned | counter | 🤝👑 | 3 of 3 (highest) |

### Alliances Formed
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| alliance_builder | Alliance Builder | 1 | statistics.alliancesFormed | counter | 🤝👑 | standalone |
| easter_egg_alliance | Circle of Friends | 1 | statistics.easterEggAlliances | counter | ✨👥 | standalone |

### Alliance Duration
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| alliance_partner_180 | Alliance Partner | 180 days | statistics.allianceDays | counter | 🤝 | 1 of 4 |
| alliance_loyal | Alliance Loyal | 365 days | statistics.allianceDays | counter | 🤝💍 | 2 of 4 |
| alliance_stalwart | Alliance Stalwart | 545 days | statistics.allianceDays | counter | 🤝🛡️ | 3 of 4 |
| alliance_eternal | Alliance Eternal | 730 days | statistics.allianceDays | counter | 🤝👑 | 4 of 4 (highest) |

### Friend Count
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| social_butterfly | Social Butterfly | 5 | statistics.friendsCount | peak | 🦋 | standalone |

### Same 5 Friends Duration
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| steady_friends_90 | Steady Friends | 90 days | statistics.fiveFriendsDays | counter | 🤝 | 1 of 4 |
| steady_friends_180 | Loyal Friends | 180 days | statistics.fiveFriendsDays | counter | 🤝💍 | 2 of 4 |
| steady_friends_365 | Devoted Friends | 365 days | statistics.fiveFriendsDays | counter | 🤝❤️ | 3 of 4 |
| steady_friends_730 | Eternal Friends | 730 days | statistics.fiveFriendsDays | counter | 🤝👑 | 4 of 4 (highest) |

### 5 Friends and 1 Best Friend
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| inner_circle | Inner Circle | 1 day | statistics.fiveFriendsBestFriendDays | counter | 👥👑 | standalone |

### Same Best Friend Duration
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| best_friend_90 | Best Friend | 90 days | statistics.bestFriendDays | counter | ❤️ | 1 of 4 |
| best_friend_180 | Close Friend | 180 days | statistics.bestFriendDays | counter | ❤️💍 | 2 of 4 |
| best_friend_365 | Lifelong Friend | 365 days | statistics.bestFriendDays | counter | ❤️👑 | 3 of 4 |
| best_friend_730 | Soulmate Friend | 730 days | statistics.bestFriendDays | counter | ❤️👑💎 | 4 of 4 (highest) |

### Same 5 Friends and Best Friend Duration
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| inner_circle_90 | Tight Circle | 90 days | statistics.fiveFriendsBestFriendDays | counter | 👥 | 1 of 4 |
| inner_circle_180 | Close Circle | 180 days | statistics.fiveFriendsBestFriendDays | counter | 👥💍 | 2 of 4 |
| inner_circle_365 | Devoted Circle | 365 days | statistics.fiveFriendsBestFriendDays | counter | 👥❤️ | 3 of 4 |
| inner_circle_730 | Eternal Circle | 730 days | statistics.fiveFriendsBestFriendDays | counter | 👥👑 | 4 of 4 (highest) |

### Positive Relations
| Award ID | Name | Threshold | Track Key | Type | Icon | Tier |
|----------|------|-----------|-----------|------|------|------|
| world_citizen | World Citizen | 15 | statistics.positiveRelationsCount | peak | 🌐 | 1 of 4 |
| world_citizen_plus | Global Citizen | 25 | statistics.positiveRelationsCount | peak | 🌐🌟 | 2 of 4 |
| world_citizen_supreme | Supreme Citizen | 50 | statistics.positiveRelationsCount | peak | 🌐💎 | 3 of 4 |
| world_citizen_ultimate | Ultimate Citizen | 75 | statistics.positiveRelationsCount | peak | 🌐👑 | 4 of 4 (highest) |

---

## Image Directory Structure

```
assets/images/
  Awards/
    award-wars-won-1.png
    award-wars-won-10.png
    award-wars-won-25.png
    award-wars-won-50.png
    award-wars-won-75.png
    award-wars-won-100.png
    award-wars-won-250.png
    award-wars-won-500.png
    award-wars-won-1000.png
    award-wars-fought-1.png
    award-wars-fought-10.png
    award-wars-fought-25.png
    award-wars-fought-50.png
    award-wars-fought-75.png
    award-wars-fought-100.png
    award-wars-fought-250.png
    award-wars-fought-500.png
    award-wars-fought-1000.png
    award-missile-launch-1.png
    award-missile-launch-25.png
    award-missile-launch-50.png
    award-missile-launch-100.png
    award-missile-launch-250.png
    award-missile-launch-500.png
    award-missile-launch-1000.png
    award-missile-launch-2500.png
    award-missile-launch-5000.png
    award-nuke-launch-1.png
    award-nuke-launch-25.png
    award-nuke-launch-50.png
    award-nuke-launch-100.png
    award-nuke-launch-250.png
    award-nuke-launch-500.png
    award-nuke-launch-1000.png
    award-nuke-launch-2500.png
    award-nuke-launch-5000.png
    award-block-1.png
    award-block-25.png
    award-block-50.png
    award-block-75.png
    award-block-100.png
    award-block-250.png
    award-block-500.png
    award-block-1000.png
    award-spartan-300.png
    award-soldiers-25k.png
    award-soldiers-50k.png
    award-soldiers-100k.png
    award-soldiers-250k.png
    award-soldiers-500k.png
    award-soldiers-1m.png
    award-soldiers-5m.png
    award-soldiers-10m.png
    award-tanks-1000.png
    award-tanks-2500.png
    award-tanks-5000.png
    award-tanks-10k.png
    award-tanks-25k.png
    award-tanks-50k.png
    award-tanks-100k.png
    award-tanks-1m.png
    award-aircraft-500.png
    award-aircraft-1000.png
    award-aircraft-2500.png
    award-aircraft-5000.png
    award-aircraft-10k.png
    award-aircraft-25k.png
    award-aircraft-50k.png
    award-aircraft-100k.png
    award-ships-250.png
    award-ships-500.png
    award-ships-1000.png
    award-ships-2500.png
    award-ships-5000.png
    award-ships-10k.png
    award-ships-25k.png
    award-ships-50k.png
    award-spies-25.png
    award-spies-50.png
    award-spies-75.png
    award-spies-100.png
    award-spies-150.png
    award-spies-200.png
    award-spies-250.png
    award-spies-500.png
    award-missiles-1.png
    award-missiles-5.png
    award-missiles-10.png
    award-missiles-25.png
    award-missiles-50.png
    award-missiles-75.png
    award-missiles-100.png
    award-missiles-250.png
    award-nukes-1.png
    award-nukes-5.png
    award-nukes-10.png
    award-nukes-25.png
    award-nukes-50.png
    award-nukes-75.png
    award-nukes-100.png
    award-nukes-250.png
    award-war-30.png
    award-war-60.png
    award-war-90.png
    award-war-180.png
    award-war-365.png
    award-peace-30.png
    award-peace-60.png
    award-peace-90.png
    award-peace-180.png
    award-peace-365.png
    award-spymaster.png
    award-master-spy-elite.png
    award-master-spy-grandmaster.png
    award-master-spy-emperor.png
    award-invisible-hand.png
    award-invisible-hand-elite.png
    award-invisible-hand-grandmaster.png
    award-invisible-hand-emperor.png
    award-baby-boom.png
    award-melting-pot.png
    award-citizen-king.png
    award-global-population.png
    award-world-population.png
    award-massive-population.png
    award-planet-population.png
    award-super-population.png
    award-ultimate-population.png
    award-immigrant-nation.png
    award-immigrant-welcome.png
    award-immigrant-open.png
    award-immigrant-haven.png
    award-immigrant-refuge.png
    award-immigrant-sanctuary.png
    award-immigrant-paradise.png
    award-immigrant-utopia.png
    award-immigrant-paragon.png
    award-clean-air.png
    award-pristine-environment.png
    award-untouched-wilderness.png
    award-crime-free.png
    award-safe-streets.png
    award-utopia-safety.png
    award-perfect-order-180.png
    award-zero-crime-365.png
    award-eternal-peace.png
    award-disease-free.png
    award-healthy-populace.png
    award-immortal-nation.png
    award-disease-free-180.png
    award-healthy-365.png
    award-immortal-730.png
    award-utopia-happiness.png
    award-blissful-nation.png
    award-eternal-joy.png
    award-ultimate-happiness-180.png
    award-perfect-happiness-365.png
    award-infinite-joy-730.png
    award-atomic-age.png
    award-future-tech.png
    award-scientific-powerhouse.png
    award-tech-singularity.png
    award-scholar-nation.png
    award-literate-nation.png
    award-enlightened-nation.png
    award-wise-nation.png
    award-tech-purchased-250.png
    award-tech-purchased-500.png
    award-tech-purchased-750.png
    award-tech-purchased-1000.png
    award-tech-purchased-1500.png
    award-tech-purchased-2000.png
    award-tech-purchased-2500.png
    award-tech-purchased-3000.png
    award-tech-purchased-3500.png
    award-tech-purchased-4500.png
    award-tech-purchased-5000.png
    award-policy-maker.png
    award-policy-architect.png
    award-policy-tyrant.png
    award-faithful.png
    award-religious-zealot.png
    award-religious-fanatic.png
    award-divine-population.png
    award-skill-max-attack.png
    award-skill-max-defense.png
    award-skill-max-aim.png
    award-skill-max-luck.png
    award-skill-max-critical-damage.png
    award-skill-max-critical-chance.png
    award-skill-max-block.png
    award-skill-max-parry.png
    award-skill-max-energy.png
    award-skill-max-intuition.png
    award-skill-max-taxation.png
    award-skill-max-diplomacy.png
    award-legendary-1.png
    award-legendary-5.png
    award-legendary-10.png
    award-legendary-15.png
    award-legendary-20.png
    award-legendary-25.png
    award-millionaire.png
    award-cool-millionaire.png
    award-multi-millionaire.png
    award-billionaire.png
    award-tycoon.png
    award-cool-billionaire.png
    award-multi-billionaire.png
    award-trillionaire.png
    award-economic-superpower.png
    award-cool-trillionaire.png
    award-multi-trillionaire.png
    award-championship-1.png
    award-championship-5.png
    award-championship-10.png
    award-championship-25.png
    award-championship-50.png
    award-championship-75.png
    award-championship-100.png
    award-championship-250.png
    award-championship-500.png
    award-season-1.png
    award-season-5.png
    award-season-10.png
    award-season-25.png
    award-season-50.png
    award-season-75.png
    award-season-100.png
    award-season-250.png
    award-season-500.png
    award-games-won-1.png
    award-games-won-25.png
    award-games-won-50.png
    award-games-won-100.png
    award-games-won-250.png
    award-games-won-500.png
    award-games-won-1k.png
    award-games-won-5k.png
    award-games-won-10k.png
    award-fans-5k.png
    award-fans-10k.png
    award-fans-25k.png
    award-fans-50k.png
    award-fans-100k.png
    award-fans-250k.png
    award-fans-500k.png
    award-fans-1m.png
    award-fans-10m.png
    award-drafted-1.png
    award-drafted-25.png
    award-drafted-50.png
    award-drafted-100.png
    award-drafted-250.png
    award-drafted-500.png
    award-drafted-750.png
    award-drafted-1k.png
    award-drafted-2.5k.png
    award-drafted-5k.png
    award-injuries-1.png
    award-injuries-5.png
    award-injuries-10.png
    award-injuries-25.png
    award-injuries-50.png
    award-injuries-75.png
    award-injuries-100.png
    award-injuries-250.png
    award-injuries-500.png
    award-forum-legend.png
    award-forum-legend-elite.png
    award-forum-legend-grandmaster.png
    award-forum-legend-emperor.png
    award-forum-legend-titan.png
    award-forum-legend-overlord.png
    award-forum-legend-archon.png
    award-forum-legend-sovereign.png
    award-forum-legend-god.png
    award-thread-starter.png
    award-thread-starter-elite.png
    award-thread-starter-grandmaster.png
    award-thread-starter-emperor.png
    award-thread-starter-titan.png
    award-thread-starter-overlord.png
    award-thread-starter-archon.png
    award-thread-starter-sovereign.png
    award-thread-starter-god.png
    award-statesman.png
    award-statesman-elite.png
    award-statesman-grandmaster.png
    award-statesman-emperor.png
    award-kingmaker.png
    award-kingmaker-elite.png
    award-kingmaker-grandmaster.png
    award-kingmaker-emperor.png
    award-united-nations.png
    award-united-nations-elite.png
    award-united-nations-grandmaster.png
    award-united-nations-emperor.png
    award-calendar-reformer.png
    award-diplomat.png
    award-diplomat-elite.png
    award-diplomat-grandmaster.png
    award-alliance-builder.png
    award-easter-egg-alliance.png
    award-alliance-partner.png
    award-alliance-loyal.png
    award-alliance-stalwart.png
    award-alliance-eternal.png
    award-social-butterfly.png
    award-steady-friends-90.png
    award-steady-friends-180.png
    award-steady-friends-365.png
    award-steady-friends-730.png
    award-inner-circle.png
    award-best-friend-90.png
    award-best-friend-180.png
    award-best-friend-365.png
    award-best-friend-730.png
    award-inner-circle-90.png
    award-inner-circle-180.png
    award-inner-circle-365.png
    award-inner-circle-730.png
    award-world-citizen.png
    award-world-citizen-plus.png
    award-world-citizen-supreme.png
    award-world-citizen-ultimate.png
  Leaderboard/
    1st-place.png
    2nd-place.png
    3rd-place.png
    top-10.png
    top-25.png
    top-50.png
    top-100.png
```

All images should be PNG format, recommended size 32x32 or 48x48 pixels, transparent backgrounds recommended for overlay use.

## Icon Tiering Convention

For each increment set, icons escalate across tiers:

- **Tier 1**: Basic/simple emoji (introductory)
- **Middle tiers**: Progressive additions (fire, sparkle, crown, etc.)
- **Highest tier**: Most elaborate combination (crown + fire + sparkle + skull as appropriate)

When rendering the UI, only show the **highest unlocked tier** per trackKey using its corresponding icon.
