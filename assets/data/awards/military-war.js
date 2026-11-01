const AwardData_militaryWar = [
  // Wars Won
  { id: 'wars_won_1', name: 'First Victory', description: 'Win 1 war', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warsWon', threshold: 1, type: 'counter' },
  { id: 'wars_won_10', name: 'Warrior', description: 'Win 10 wars', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warsWon', threshold: 10, type: 'counter' },
  { id: 'wars_won_25', name: 'Veteran', description: 'Win 25 wars', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warsWon', threshold: 25, type: 'counter' },
  { id: 'wars_won_50', name: 'Seasoned Warrior', description: 'Win 50 wars', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warsWon', threshold: 50, type: 'counter' },
  { id: 'wars_won_75', name: 'Battle-Hardened', description: 'Win 75 wars', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warsWon', threshold: 75, type: 'counter' },
  { id: 'wars_won_100', name: 'Warmonger', description: 'Win 100 wars', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warsWon', threshold: 100, type: 'counter' },
  { id: 'wars_won_250', name: 'Warlord', description: 'Win 250 wars', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warsWon', threshold: 250, type: 'counter' },
  { id: 'wars_won_500', name: 'Conqueror', description: 'Win 500 wars', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warsWon', threshold: 500, type: 'counter' },
  { id: 'wars_won_1000', name: 'World Conqueror', description: 'Win 1000 wars', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warsWon', threshold: 1000, type: 'counter' },

  // Wars Fought (win or lose)
  { id: 'wars_fought_1', name: 'First Fight', description: 'Fight in 1 war', category: 'military-war', icon: '⚔️', trackKey: 'statistics.warsFought', threshold: 1, type: 'counter' },
  { id: 'wars_fought_10', name: 'Combatant', description: 'Fight in 10 wars', category: 'military-war', icon: '⚔️', trackKey: 'statistics.warsFought', threshold: 10, type: 'counter' },
  { id: 'wars_fought_25', name: 'Soldier', description: 'Fight in 25 wars', category: 'military-war', icon: '⚔️', trackKey: 'statistics.warsFought', threshold: 25, type: 'counter' },
  { id: 'wars_fought_50', name: 'War Veteran', description: 'Fight in 50 wars', category: 'military-war', icon: '⚔️', trackKey: 'statistics.warsFought', threshold: 50, type: 'counter' },
  { id: 'wars_fought_75', name: 'Battle Scarred', description: 'Fight in 75 wars', category: 'military-war', icon: '⚔️', trackKey: 'statistics.warsFought', threshold: 75, type: 'counter' },
  { id: 'wars_fought_100', name: 'Warrior King', description: 'Fight in 100 wars', category: 'military-war', icon: '⚔️', trackKey: 'statistics.warsFought', threshold: 100, type: 'counter' },
  { id: 'wars_fought_250', name: 'War Machine', description: 'Fight in 250 wars', category: 'military-war', icon: '⚔️', trackKey: 'statistics.warsFought', threshold: 250, type: 'counter' },
  { id: 'wars_fought_500', name: 'Perpetual War', description: 'Fight in 500 wars', category: 'military-war', icon: '⚔️', trackKey: 'statistics.warsFought', threshold: 500, type: 'counter' },
  { id: 'wars_fought_1000', name: 'Eternal Warrior', description: 'Fight in 1000 wars', category: 'military-war', icon: '⚔️', trackKey: 'statistics.warsFought', threshold: 1000, type: 'counter' },

  // Missile Launches (separate from nukes)
  { id: 'missile_launch_1', name: 'First Missile', description: 'Launch 1 missile', category: 'military-war', icon: '🚀', trackKey: 'statistics.missileLaunches', threshold: 1, type: 'counter' },
  { id: 'missile_launch_25', name: 'Missile Barrage', description: 'Launch 25 missiles', category: 'military-war', icon: '🚀', trackKey: 'statistics.missileLaunches', threshold: 25, type: 'counter' },
  { id: 'missile_launch_50', name: 'Missile Storm', description: 'Launch 50 missiles', category: 'military-war', icon: '🚀', trackKey: 'statistics.missileLaunches', threshold: 50, type: 'counter' },
  { id: 'missile_launch_100', name: 'Missile Rain', description: 'Launch 100 missiles', category: 'military-war', icon: '🚀', trackKey: 'statistics.missileLaunches', threshold: 100, type: 'counter' },
  { id: 'missile_launch_250', name: 'Missile Apocalypse', description: 'Launch 250 missiles', category: 'military-war', icon: '🚀', trackKey: 'statistics.missileLaunches', threshold: 250, type: 'counter' },
  { id: 'missile_launch_500', name: 'Missile Devastation', description: 'Launch 500 missiles', category: 'military-war', icon: '🚀', trackKey: 'statistics.missileLaunches', threshold: 500, type: 'counter' },
  { id: 'missile_launch_1000', name: 'Missile Holocaust', description: 'Launch 1000 missiles', category: 'military-war', icon: '🚀', trackKey: 'statistics.missileLaunches', threshold: 1000, type: 'counter' },
  { id: 'missile_launch_2500', name: 'Missile Armageddon', description: 'Launch 2500 missiles', category: 'military-war', icon: '🚀', trackKey: 'statistics.missileLaunches', threshold: 2500, type: 'counter' },
  { id: 'missile_launch_5000', name: 'Missile Doomsday', description: 'Launch 5000 missiles', category: 'military-war', icon: '🚀', trackKey: 'statistics.missileLaunches', threshold: 5000, type: 'counter' },

  // Nuke Launches (separate from missiles)
  { id: 'nuke_launch_1', name: 'First Nuke', description: 'Launch 1 nuclear weapon', category: 'military-war', icon: '☢️', trackKey: 'statistics.nukeLaunches', threshold: 1, type: 'counter' },
  { id: 'nuke_launch_25', name: 'Nuclear Winter', description: 'Launch 25 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'statistics.nukeLaunches', threshold: 25, type: 'counter' },
  { id: 'nuke_launch_50', name: 'Nuclear Holocaust', description: 'Launch 50 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'statistics.nukeLaunches', threshold: 50, type: 'counter' },
  { id: 'nuke_launch_100', name: 'Nuclear Devastation', description: 'Launch 100 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'statistics.nukeLaunches', threshold: 100, type: 'counter' },
  { id: 'nuke_launch_250', name: 'Nuclear Apocalypse', description: 'Launch 250 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'statistics.nukeLaunches', threshold: 250, type: 'counter' },
  { id: 'nuke_launch_500', name: 'Nuclear Armageddon', description: 'Launch 500 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'statistics.nukeLaunches', threshold: 500, type: 'counter' },
  { id: 'nuke_launch_1000', name: 'Nuclear Doomsday', description: 'Launch 1000 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'statistics.nukeLaunches', threshold: 1000, type: 'counter' },
  { id: 'nuke_launch_2500', name: 'Nuclear Cataclysm', description: 'Launch 2500 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'statistics.nukeLaunches', threshold: 2500, type: 'counter' },
  { id: 'nuke_launch_5000', name: 'Nuclear Annihilation', description: 'Launch 5000 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'statistics.nukeLaunches', threshold: 5000, type: 'counter' },

  // Blocked Missiles/Nukes (separate from launches)
  { id: 'block_1', name: 'First Block', description: 'Block 1 enemy missile/nuke', category: 'military-war', icon: '🛡️', trackKey: 'statistics.missilesBlocked', threshold: 1, type: 'counter' },
  { id: 'block_25', name: 'Blocker', description: 'Block 25 enemy missiles/nukes', category: 'military-war', icon: '🛡️', trackKey: 'statistics.missilesBlocked', threshold: 25, type: 'counter' },
  { id: 'block_50', name: 'Shield', description: 'Block 50 enemy missiles/nukes', category: 'military-war', icon: '🛡️', trackKey: 'statistics.missilesBlocked', threshold: 50, type: 'counter' },
  { id: 'block_75', name: 'Wall', description: 'Block 75 enemy missiles/nukes', category: 'military-war', icon: '🛡️', trackKey: 'statistics.missilesBlocked', threshold: 75, type: 'counter' },
  { id: 'block_100', name: 'Fortress', description: 'Block 100 enemy missiles/nukes', category: 'military-war', icon: '🛡️', trackKey: 'statistics.missilesBlocked', threshold: 100, type: 'counter' },
  { id: 'block_250', name: 'Bastion', description: 'Block 250 enemy missiles/nukes', category: 'military-war', icon: '🛡️', trackKey: 'statistics.missilesBlocked', threshold: 250, type: 'counter' },
  { id: 'block_500', name: 'Citadel', description: 'Block 500 enemy missiles/nukes', category: 'military-war', icon: '🛡️', trackKey: 'statistics.missilesBlocked', threshold: 500, type: 'counter' },
  { id: 'block_1000', name: 'Iron Dome', description: 'Block 1000 enemy missiles/nukes', category: 'military-war', icon: '🛡️', trackKey: 'statistics.missilesBlocked', threshold: 1000, type: 'counter' },

  // Exactly 300 Soldiers for 30 days
  { id: 'spartan_300', name: 'Spartan 300', description: 'Maintain exactly 300 soldiers for 30 days', category: 'military-war', icon: '🛡️', trackKey: 'statistics.exactly300SoldiersDays', threshold: 30, type: 'counter' },

  // Soldiers (peak, no time requirement)
  { id: 'soldiers_25k', name: 'Small Army', description: 'Maintain 25,000 soldiers', category: 'military-war', icon: '🛡️', trackKey: 'militaryUnits.soldiers', threshold: 25000, type: 'peak' },
  { id: 'soldiers_50k', name: 'Medium Army', description: 'Maintain 50,000 soldiers', category: 'military-war', icon: '🛡️', trackKey: 'militaryUnits.soldiers', threshold: 50000, type: 'peak' },
  { id: 'soldiers_100k', name: 'Large Army', description: 'Maintain 100,000 soldiers', category: 'military-war', icon: '🛡️', trackKey: 'militaryUnits.soldiers', threshold: 100000, type: 'peak' },
  { id: 'soldiers_250k', name: 'Massive Army', description: 'Maintain 250,000 soldiers', category: 'military-war', icon: '🛡️', trackKey: 'militaryUnits.soldiers', threshold: 250000, type: 'peak' },
  { id: 'soldiers_500k', name: 'Horde Army', description: 'Maintain 500,000 soldiers', category: 'military-war', icon: '🛡️', trackKey: 'militaryUnits.soldiers', threshold: 500000, type: 'peak' },
  { id: 'soldiers_1m', name: 'Legion Army', description: 'Maintain 1,000,000 soldiers', category: 'military-war', icon: '🛡️', trackKey: 'militaryUnits.soldiers', threshold: 1000000, type: 'peak' },
  { id: 'soldiers_5m', name: 'Titan Army', description: 'Maintain 5,000,000 soldiers', category: 'military-war', icon: '🛡️', trackKey: 'militaryUnits.soldiers', threshold: 5000000, type: 'peak' },
  { id: 'soldiers_10m', name: 'God Army', description: 'Maintain 10,000,000 soldiers', category: 'military-war', icon: '🛡️', trackKey: 'militaryUnits.soldiers', threshold: 10000000, type: 'peak' },

  // Tanks
  { id: 'tanks_1000', name: 'Tank Division', description: 'Maintain 1,000 tanks', category: 'military-war', icon: '🏎️', trackKey: 'militaryUnits.tanks', threshold: 1000, type: 'peak' },
  { id: 'tanks_2500', name: 'Tank Corps', description: 'Maintain 2,500 tanks', category: 'military-war', icon: '🏎️', trackKey: 'militaryUnits.tanks', threshold: 2500, type: 'peak' },
  { id: 'tanks_5000', name: 'Tank Army', description: 'Maintain 5,000 tanks', category: 'military-war', icon: '🏎️', trackKey: 'militaryUnits.tanks', threshold: 5000, type: 'peak' },
  { id: 'tanks_10k', name: 'Tank Legion', description: 'Maintain 10,000 tanks', category: 'military-war', icon: '🏎️', trackKey: 'militaryUnits.tanks', threshold: 10000, type: 'peak' },
  { id: 'tanks_25k', name: 'Tank Horde', description: 'Maintain 25,000 tanks', category: 'military-war', icon: '🏎️', trackKey: 'militaryUnits.tanks', threshold: 25000, type: 'peak' },
  { id: 'tanks_50k', name: 'Tank Flood', description: 'Maintain 50,000 tanks', category: 'military-war', icon: '🏎️', trackKey: 'militaryUnits.tanks', threshold: 50000, type: 'peak' },
  { id: 'tanks_100k', name: 'Tank Swarm', description: 'Maintain 100,000 tanks', category: 'military-war', icon: '🏎️', trackKey: 'militaryUnits.tanks', threshold: 100000, type: 'peak' },
  { id: 'tanks_1m', name: 'Tank Tsunami', description: 'Maintain 1,000,000 tanks', category: 'military-war', icon: '🏎️', trackKey: 'militaryUnits.tanks', threshold: 1000000, type: 'peak' },

  // Aircraft
  { id: 'aircraft_500', name: 'Air Squadron', description: 'Maintain 500 aircraft', category: 'military-war', icon: '✈️', trackKey: 'militaryUnits.aircraft', threshold: 500, type: 'peak' },
  { id: 'aircraft_1000', name: 'Air Wing', description: 'Maintain 1,000 aircraft', category: 'military-war', icon: '✈️', trackKey: 'militaryUnits.aircraft', threshold: 1000, type: 'peak' },
  { id: 'aircraft_2500', name: 'Air Fleet', description: 'Maintain 2,500 aircraft', category: 'military-war', icon: '✈️', trackKey: 'militaryUnits.aircraft', threshold: 2500, type: 'peak' },
  { id: 'aircraft_5000', name: 'Air Armada', description: 'Maintain 5,000 aircraft', category: 'military-war', icon: '✈️', trackKey: 'militaryUnits.aircraft', threshold: 5000, type: 'peak' },
  { id: 'aircraft_10k', name: 'Air Dominance', description: 'Maintain 10,000 aircraft', category: 'military-war', icon: '✈️', trackKey: 'militaryUnits.aircraft', threshold: 10000, type: 'peak' },
  { id: 'aircraft_25k', name: 'Air Supremacy', description: 'Maintain 25,000 aircraft', category: 'military-war', icon: '✈️', trackKey: 'militaryUnits.aircraft', threshold: 25000, type: 'peak' },
  { id: 'aircraft_50k', name: 'Air Overlord', description: 'Maintain 50,000 aircraft', category: 'military-war', icon: '✈️', trackKey: 'militaryUnits.aircraft', threshold: 50000, type: 'peak' },
  { id: 'aircraft_100k', name: 'Air God', description: 'Maintain 100,000 aircraft', category: 'military-war', icon: '✈️', trackKey: 'militaryUnits.aircraft', threshold: 100000, type: 'peak' },

  // Ships
  { id: 'ships_250', name: 'Coastal Navy', description: 'Maintain 250 ships', category: 'military-war', icon: '🚢', trackKey: 'militaryUnits.ships', threshold: 250, type: 'peak' },
  { id: 'ships_500', name: 'Regional Navy', description: 'Maintain 500 ships', category: 'military-war', icon: '🚢', trackKey: 'militaryUnits.ships', threshold: 500, type: 'peak' },
  { id: 'ships_1000', name: 'Blue Water Navy', description: 'Maintain 1,000 ships', category: 'military-war', icon: '🚢', trackKey: 'militaryUnits.ships', threshold: 1000, type: 'peak' },
  { id: 'ships_2500', name: 'Ocean Navy', description: 'Maintain 2,500 ships', category: 'military-war', icon: '🚢', trackKey: 'militaryUnits.ships', threshold: 2500, type: 'peak' },
  { id: 'ships_5000', name: 'Fleet Navy', description: 'Maintain 5,000 ships', category: 'military-war', icon: '🚢', trackKey: 'militaryUnits.ships', threshold: 5000, type: 'peak' },
  { id: 'ships_10k', name: 'Armada Navy', description: 'Maintain 10,000 ships', category: 'military-war', icon: '🚢', trackKey: 'militaryUnits.ships', threshold: 10000, type: 'peak' },
  { id: 'ships_25k', name: 'Leviathan Navy', description: 'Maintain 25,000 ships', category: 'military-war', icon: '🚢', trackKey: 'militaryUnits.ships', threshold: 25000, type: 'peak' },
  { id: 'ships_50k', name: 'Ocean God Navy', description: 'Maintain 50,000 ships', category: 'military-war', icon: '🚢', trackKey: 'militaryUnits.ships', threshold: 50000, type: 'peak' },

  // Spies
  { id: 'spies_25', name: 'Secret Agent', description: 'Maintain 25 spies', category: 'military-war', icon: '🕵️‍♂️', trackKey: 'militaryUnits.spies', threshold: 25, type: 'peak' },
  { id: 'spies_50', name: 'Double Agent', description: 'Maintain 50 spies', category: 'military-war', icon: '🕵️‍♂️', trackKey: 'militaryUnits.spies', threshold: 50, type: 'peak' },
  { id: 'spies_75', name: 'Master Spy', description: 'Maintain 75 spies', category: 'military-war', icon: '🕵️‍♂️', trackKey: 'militaryUnits.spies', threshold: 75, type: 'peak' },
  { id: 'spies_100', name: 'Shadow Agency', description: 'Maintain 100 spies', category: 'military-war', icon: '🕵️‍♂️', trackKey: 'militaryUnits.spies', threshold: 100, type: 'peak' },
  { id: 'spies_150', name: 'Spy Network', description: 'Maintain 150 spies', category: 'military-war', icon: '🕵️‍♂️', trackKey: 'militaryUnits.spies', threshold: 150, type: 'peak' },
  { id: 'spies_200', name: 'Intelligence Bureau', description: 'Maintain 200 spies', category: 'military-war', icon: '🕵️‍♂️', trackKey: 'militaryUnits.spies', threshold: 200, type: 'peak' },
  { id: 'spies_250', name: 'Espionage State', description: 'Maintain 250 spies', category: 'military-war', icon: '🕵️‍♂️', trackKey: 'militaryUnits.spies', threshold: 250, type: 'peak' },
  { id: 'spies_500', name: 'Big Brother', description: 'Maintain 500 spies', category: 'military-war', icon: '🕵️‍♂️', trackKey: 'militaryUnits.spies', threshold: 500, type: 'peak' },

  // Missiles stockpiled
  { id: 'missiles_1', name: 'Missile Stash', description: 'Maintain 1 missile', category: 'military-war', icon: '🚀', trackKey: 'militaryUnits.missiles', threshold: 1, type: 'peak' },
  { id: 'missiles_5', name: 'Missile Cache', description: 'Maintain 5 missiles', category: 'military-war', icon: '🚀', trackKey: 'militaryUnits.missiles', threshold: 5, type: 'peak' },
  { id: 'missiles_10', name: 'Missile Stockpile', description: 'Maintain 10 missiles', category: 'military-war', icon: '🚀', trackKey: 'militaryUnits.missiles', threshold: 10, type: 'peak' },
  { id: 'missiles_25', name: 'Missile Silo', description: 'Maintain 25 missiles', category: 'military-war', icon: '🚀', trackKey: 'militaryUnits.missiles', threshold: 25, type: 'peak' },
  { id: 'missiles_50', name: 'Missile Fortress', description: 'Maintain 50 missiles', category: 'military-war', icon: '🚀', trackKey: 'militaryUnits.missiles', threshold: 50, type: 'peak' },
  { id: 'missiles_75', name: 'Missile Base', description: 'Maintain 75 missiles', category: 'military-war', icon: '🚀', trackKey: 'militaryUnits.missiles', threshold: 75, type: 'peak' },
  { id: 'missiles_100', name: 'Missile Command', description: 'Maintain 100 missiles', category: 'military-war', icon: '🚀', trackKey: 'militaryUnits.missiles', threshold: 100, type: 'peak' },
  { id: 'missiles_250', name: 'Missile Empire', description: 'Maintain 250 missiles', category: 'military-war', icon: '🚀', trackKey: 'militaryUnits.missiles', threshold: 250, type: 'peak' },

  // Nukes stockpiled
  { id: 'nukes_1', name: 'First Warhead', description: 'Maintain 1 nuclear weapon', category: 'military-war', icon: '☢️', trackKey: 'militaryUnits.nukes', threshold: 1, type: 'peak' },
  { id: 'nukes_5', name: 'Nuclear Cache', description: 'Maintain 5 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'militaryUnits.nukes', threshold: 5, type: 'peak' },
  { id: 'nukes_10', name: 'Nuclear Stockpile', description: 'Maintain 10 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'militaryUnits.nukes', threshold: 10, type: 'peak' },
  { id: 'nukes_25', name: 'Nuclear Silo', description: 'Maintain 25 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'militaryUnits.nukes', threshold: 25, type: 'peak' },
  { id: 'nukes_50', name: 'Nuclear Fortress', description: 'Maintain 50 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'militaryUnits.nukes', threshold: 50, type: 'peak' },
  { id: 'nukes_75', name: 'Nuclear Base', description: 'Maintain 75 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'militaryUnits.nukes', threshold: 75, type: 'peak' },
  { id: 'nukes_100', name: 'Nuclear Command', description: 'Maintain 100 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'militaryUnits.nukes', threshold: 100, type: 'peak' },
  { id: 'nukes_250', name: 'Nuclear Empire', description: 'Maintain 250 nuclear weapons', category: 'military-war', icon: '☢️', trackKey: 'militaryUnits.nukes', threshold: 250, type: 'peak' },

  // War duration
  { id: 'war_30', name: 'Warmonger', description: 'Stay at war for 30 days', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warDays', threshold: 30, type: 'counter' },
  { id: 'war_60', name: 'War Veteran', description: 'Stay at war for 60 days', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warDays', threshold: 60, type: 'counter' },
  { id: 'war_90', name: 'Seasoned Warlord', description: 'Stay at war for 90 days', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warDays', threshold: 90, type: 'counter' },
  { id: 'war_180', name: 'Elite Warlord', description: 'Stay at war for 180 days', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warDays', threshold: 180, type: 'counter' },
  { id: 'war_365', name: 'Grand Warlord', description: 'Stay at war for 365 days', category: 'military-war', icon: '🗡️', trackKey: 'statistics.warDays', threshold: 365, type: 'counter' },

  // Peace duration
  { id: 'peace_30', name: 'Peacekeeper', description: 'Maintain peace for 30 days', category: 'military-war', icon: '🕊️', trackKey: 'statistics.peacefulDays', threshold: 30, type: 'counter' },
  { id: 'peace_60', name: 'Peace Advocate', description: 'Maintain peace for 60 days', category: 'military-war', icon: '🕊️', trackKey: 'statistics.peacefulDays', threshold: 60, type: 'counter' },
  { id: 'peace_90', name: 'Peace Champion', description: 'Maintain peace for 90 days', category: 'military-war', icon: '🕊️', trackKey: 'statistics.peacefulDays', threshold: 90, type: 'counter' },
  { id: 'peace_180', name: 'Peace Guardian', description: 'Maintain peace for 180 days', category: 'military-war', icon: '🕊️', trackKey: 'statistics.peacefulDays', threshold: 180, type: 'counter' },
  { id: 'peace_365', name: 'Peace Supreme', description: 'Maintain peace for 365 days', category: 'military-war', icon: '🕊️', trackKey: 'statistics.peacefulDays', threshold: 365, type: 'counter' },

  // Espionage (spy missions)
  { id: 'spymaster', name: 'Spymaster', description: 'Complete 50 successful spy missions', category: 'military-war', icon: '🕵️', trackKey: 'statistics.spyMissions', threshold: 50, type: 'counter' },
  { id: 'master_spy_elite', name: 'Elite Spy', description: 'Complete 100 successful spy missions', category: 'military-war', icon: '🕵️‍♀️', trackKey: 'statistics.spyMissions', threshold: 100, type: 'counter' },
  { id: 'master_spy_grandmaster', name: 'Grandmaster Spy', description: 'Complete 250 successful spy missions', category: 'military-war', icon: '🕵️‍♀️', trackKey: 'statistics.spyMissions', threshold: 250, type: 'counter' },
  { id: 'master_spy_emperor', name: 'Emperor Spy', description: 'Complete 500 successful spy missions', category: 'military-war', icon: '🕵️‍♀️', trackKey: 'statistics.spyMissions', threshold: 500, type: 'counter' },
  { id: 'invisible_hand', name: 'Invisible Hand', description: 'Conduct 250 espionage operations', category: 'military-war', icon: '👻', trackKey: 'statistics.espionageOperationsTotal', threshold: 250, type: 'counter' },
  { id: 'invisible_hand_elite', name: 'Elite Invisible Hand', description: 'Conduct 500 espionage operations', category: 'military-war', icon: '👻', trackKey: 'statistics.espionageOperationsTotal', threshold: 500, type: 'counter' },
  { id: 'invisible_hand_grandmaster', name: 'Grandmaster Invisible Hand', description: 'Conduct 1000 espionage operations', category: 'military-war', icon: '👻', trackKey: 'statistics.espionageOperationsTotal', threshold: 1000, type: 'counter' },
  { id: 'invisible_hand_emperor', name: 'Emperor Invisible Hand', description: 'Conduct 2500 espionage operations', category: 'military-war', icon: '👻', trackKey: 'statistics.espionageOperationsTotal', threshold: 2500, type: 'counter' },
];

if (typeof window !== 'undefined') {
    window.AwardData_militaryWar = AwardData_militaryWar;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AwardData_militaryWar;
}
