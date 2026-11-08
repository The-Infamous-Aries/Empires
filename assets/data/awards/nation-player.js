const AwardData_nationPlayer = [
  // Government changes
  { id: 'policy_maker', name: 'Policy Maker', description: 'Change government/religion 25 times', category: 'nation-player', icon: '📜', trackKey: 'statistics.governmentChanges', threshold: 25, type: 'counter' },
  { id: 'policy_architect', name: 'Policy Architect', description: 'Change government/religion 50 times', category: 'nation-player', icon: '📜', trackKey: 'statistics.governmentChanges', threshold: 50, type: 'counter' },
  { id: 'policy_tyrant', name: 'Policy Tyrant', description: 'Change government/religion 100 times', category: 'nation-player', icon: '📜', trackKey: 'statistics.governmentChanges', threshold: 100, type: 'counter' },
  // Religion changes
  { id: 'faithful', name: 'Faithful', description: 'Change religion 25 times', category: 'nation-player', icon: '⛪', trackKey: 'statistics.religionChanges', threshold: 25, type: 'counter' },
  { id: 'religious_zealot', name: 'Religious Zealot', description: 'Change religion 50 times', category: 'nation-player', icon: '⛪', trackKey: 'statistics.religionChanges', threshold: 50, type: 'counter' },
  { id: 'religious_fanatic', name: 'Religious Fanatic', description: 'Change religion 100 times', category: 'nation-player', icon: '⛪', trackKey: 'statistics.religionChanges', threshold: 100, type: 'counter' },
  // Uniform population
  { id: 'divine_population', name: 'Divine Population', description: 'Maintain 100% same-religion population for 60 days', category: 'nation-player', icon: '🙏', trackKey: 'statistics.uniformPopulationDays', threshold: 60, type: 'counter' },
  // Skill max awards (level 10)
  { id: 'skill_max_attack', name: 'Master Attacker', description: 'Max out Attack skill (level 10)', category: 'nation-player', icon: '⚔️', trackKey: 'skills.attack.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_defense', name: 'Master Defender', description: 'Max out Defense skill (level 10)', category: 'nation-player', icon: '🛡️', trackKey: 'skills.defense.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_aim', name: 'Master Marksman', description: 'Max out Aim skill (level 10)', category: 'nation-player', icon: '🎯', trackKey: 'skills.aim.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_luck', name: 'Lucky Charm', description: 'Max out Luck skill (level 10)', category: 'nation-player', icon: '🍀', trackKey: 'skills.luck.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_critical_damage', name: 'Critical Overload', description: 'Max out Critical Damage skill (level 10)', category: 'nation-player', icon: '💥', trackKey: 'skills.criticalDamage.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_critical_chance', name: 'Critical Eye', description: 'Max out Critical Chance skill (level 10)', category: 'nation-player', icon: '🎲', trackKey: 'skills.criticalChance.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_block', name: 'Iron Wall', description: 'Max out Block skill (level 10)', category: 'nation-player', icon: '🪖', trackKey: 'skills.block.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_parry', name: 'Parry Master', description: 'Max out Parry skill (level 10)', category: 'nation-player', icon: '🗡️', trackKey: 'skills.parry.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_energy', name: 'Energized', description: 'Max out Energy skill (level 10)', category: 'nation-player', icon: '⚡', trackKey: 'skills.energy.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_intuition', name: 'Seer', description: 'Max out Intuition skill (level 10)', category: 'nation-player', icon: '🧠', trackKey: 'skills.intuition.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_taxation', name: 'Taxman', description: 'Max out Taxation skill (level 10)', category: 'nation-player', icon: '💰', trackKey: 'skills.taxation.level', threshold: 10, type: 'peak' },
  { id: 'skill_max_diplomacy', name: 'Master Diplomat', description: 'Max out Diplomacy skill (level 10)', category: 'nation-player', icon: '🤝', trackKey: 'skills.diplomacy.level', threshold: 10, type: 'peak' },
  // Legendary prestige awards
  { id: 'legendary_1', name: 'First Legendary', description: 'Go legendary 1 time', category: 'nation-player', icon: '⭐', trackKey: 'totalLegendaryLevels', threshold: 1, type: 'peak' },
  { id: 'legendary_5', name: 'Five-Time Legendary', description: 'Go legendary 5 times', category: 'nation-player', icon: '⭐', trackKey: 'totalLegendaryLevels', threshold: 5, type: 'peak' },
  { id: 'legendary_10', name: 'Ten-Time Legendary', description: 'Go legendary 10 times', category: 'nation-player', icon: '⭐', trackKey: 'totalLegendaryLevels', threshold: 10, type: 'peak' },
  { id: 'legendary_15', name: 'Fifteen-Time Legendary', description: 'Go legendary 15 times', category: 'nation-player', icon: '⭐', trackKey: 'totalLegendaryLevels', threshold: 15, type: 'peak' },
  { id: 'legendary_20', name: 'Twenty-Time Legendary', description: 'Go legendary 20 times', category: 'nation-player', icon: '⭐', trackKey: 'totalLegendaryLevels', threshold: 20, type: 'peak' },
  { id: 'legendary_25', name: 'Twenty-Five-Time Legendary', description: 'Go legendary 25 times', category: 'nation-player', icon: '⭐', trackKey: 'totalLegendaryLevels', threshold: 25, type: 'peak' },
  // Economy (Nation Wealth)
  { id: 'millionaire', name: 'Millionaire', description: 'Accumulate $1 million', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 1000000, type: 'peak' },
  { id: 'cool_millionaire', name: 'Cool Millionaire', description: 'Accumulate $100 million', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 100000000, type: 'peak' },
  { id: 'multi_millionaire', name: 'Multi Millionaire', description: 'Accumulate $500 million', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 500000000, type: 'peak' },
  { id: 'billionaire', name: 'Billionaire', description: 'Accumulate $1 billion', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 1000000000, type: 'peak' },
  { id: 'tycoon', name: 'Tycoon', description: 'Accumulate $10 billion', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 10000000000, type: 'peak' },
  { id: 'cool_billionaire', name: 'Cool Billionaire', description: 'Accumulate $100 billion', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 100000000000, type: 'peak' },
  { id: 'multi_billionaire', name: 'Multi Billionaire', description: 'Accumulate $500 billion', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 500000000000, type: 'peak' },
  { id: 'trillionaire', name: 'Trillionaire', description: 'Accumulate $1 trillion', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 1000000000000, type: 'peak' },
  { id: 'economic_superpower', name: 'Economic Superpower', description: 'Accumulate $10 trillion', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 10000000000000, type: 'peak' },
  { id: 'cool_trillionaire', name: 'Cool Trillionaire', description: 'Accumulate $100 trillion', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 100000000000000, type: 'peak' },
  { id: 'multi_trillionaire', name: 'Multi Trillionaire', description: 'Accumulate $500 trillion', category: 'nation-player', icon: '💰', trackKey: 'money', threshold: 500000000000000, type: 'peak' },
];

if (typeof window !== 'undefined') {
    window.AwardData_nationPlayer = AwardData_nationPlayer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AwardData_nationPlayer;
}
