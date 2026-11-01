const AwardData_populationCitizen = [
  // Population (citizen count)
  { id: 'baby_boom', name: 'Baby Boom', description: 'Reach 100,000 citizens', category: 'population-citizen', icon: '👶', trackKey: 'population', threshold: 100000, type: 'peak' },
  { id: 'melting_pot', name: 'Melting Pot', description: 'Reach 500,000 citizens', category: 'population-citizen', icon: '🌍', trackKey: 'population', threshold: 500000, type: 'peak' },
  { id: 'citizen_king', name: 'Citizen King', description: 'Reach 1 million citizens', category: 'population-citizen', icon: '👑', trackKey: 'population', threshold: 1000000, type: 'peak' },
  { id: 'global_population', name: 'Global Population', description: 'Reach 10 million citizens', category: 'population-citizen', icon: '🌍', trackKey: 'population', threshold: 10000000, type: 'peak' },
  { id: 'world_population', name: 'World Population', description: 'Reach 100 million citizens', category: 'population-citizen', icon: '🌍', trackKey: 'population', threshold: 100000000, type: 'peak' },
  { id: 'massive_population', name: 'Massive Population', description: 'Reach 500 million citizens', category: 'population-citizen', icon: '🌍', trackKey: 'population', threshold: 500000000, type: 'peak' },
  { id: 'planet_population', name: 'Planet Population', description: 'Reach 1 billion citizens', category: 'population-citizen', icon: '🌍', trackKey: 'population', threshold: 1000000000, type: 'peak' },
  { id: 'super_population', name: 'Super Population', description: 'Reach 10 billion citizens', category: 'population-citizen', icon: '🌍', trackKey: 'population', threshold: 10000000000, type: 'peak' },
  { id: 'ultimate_population', name: 'Ultimate Population', description: 'Reach 100 billion citizens', category: 'population-citizen', icon: '🌍', trackKey: 'population', threshold: 100000000000, type: 'peak' },
  // Immigration
  { id: 'immigrant_nation', name: 'Immigrant Nation', description: 'Accept 5,000 immigrants', category: 'population-citizen', icon: '🚢', trackKey: 'statistics.immigrantsAccepted', threshold: 5000, type: 'counter' },
  { id: 'immigrant_welcome', name: 'Immigrant Welcome', description: 'Accept 10,000 immigrants', category: 'population-citizen', icon: '🚢', trackKey: 'statistics.immigrantsAccepted', threshold: 10000, type: 'counter' },
  { id: 'immigrant_open', name: 'Immigrant Open', description: 'Accept 25,000 immigrants', category: 'population-citizen', icon: '🚢', trackKey: 'statistics.immigrantsAccepted', threshold: 25000, type: 'counter' },
  { id: 'immigrant_haven', name: 'Immigrant Haven', description: 'Accept 50,000 immigrants', category: 'population-citizen', icon: '🚢', trackKey: 'statistics.immigrantsAccepted', threshold: 50000, type: 'counter' },
  { id: 'immigrant_refuge', name: 'Immigrant Refuge', description: 'Accept 75,000 immigrants', category: 'population-citizen', icon: '🚢', trackKey: 'statistics.immigrantsAccepted', threshold: 75000, type: 'counter' },
  { id: 'immigrant_sanctuary', name: 'Immigrant Sanctuary', description: 'Accept 100,000 immigrants', category: 'population-citizen', icon: '🚢', trackKey: 'statistics.immigrantsAccepted', threshold: 100000, type: 'counter' },
  { id: 'immigrant_paradise', name: 'Immigrant Paradise', description: 'Accept 250,000 immigrants', category: 'population-citizen', icon: '🚢', trackKey: 'statistics.immigrantsAccepted', threshold: 250000, type: 'counter' },
  { id: 'immigrant_utopia', name: 'Immigrant Utopia', description: 'Accept 500,000 immigrants', category: 'population-citizen', icon: '🚢', trackKey: 'statistics.immigrantsAccepted', threshold: 500000, type: 'counter' },
  { id: 'immigrant_paragon', name: 'Immigrant Paragon', description: 'Accept 1 million immigrants', category: 'population-citizen', icon: '🚢', trackKey: 'statistics.immigrantsAccepted', threshold: 1000000, type: 'counter' },
  // Pollution
  { id: 'clean_air', name: 'Clean Air', description: 'Maintain 0 pollution for 30 days', category: 'population-citizen', icon: '🌿', trackKey: 'statistics.zeroPollutionDays', threshold: 30, type: 'counter' },
  { id: 'pristine_environment', name: 'Pristine Environment', description: 'Maintain 0 pollution for 60 days', category: 'population-citizen', icon: '🌿', trackKey: 'statistics.zeroPollutionDays', threshold: 60, type: 'counter' },
  { id: 'untouched_wilderness', name: 'Untouched Wilderness', description: 'Maintain 0 pollution for 90 days', category: 'population-citizen', icon: '🌿', trackKey: 'statistics.zeroPollutionDays', threshold: 90, type: 'counter' },
  // Crime
  { id: 'crime_free', name: 'Crime Free', description: 'Maintain 0 crime rate for 30 days', category: 'population-citizen', icon: '👮', trackKey: 'statistics.zeroCrimeDays', threshold: 30, type: 'counter' },
  { id: 'safe_streets', name: 'Safe Streets', description: 'Maintain 0 crime rate for 60 days', category: 'population-citizen', icon: '👮', trackKey: 'statistics.zeroCrimeDays', threshold: 60, type: 'counter' },
  { id: 'utopia_safety', name: 'Utopia Safety', description: 'Maintain 0 crime rate for 90 days', category: 'population-citizen', icon: '👮', trackKey: 'statistics.zeroCrimeDays', threshold: 90, type: 'counter' },
  { id: 'perfect_order_180', name: 'Perfect Order', description: 'Maintain 0 crime rate for 180 days', category: 'population-citizen', icon: '👮', trackKey: 'statistics.zeroCrimeDays', threshold: 180, type: 'counter' },
  { id: 'zero_crime_365', name: 'Zero Crime', description: 'Maintain 0 crime rate for 365 days', category: 'population-citizen', icon: '👮', trackKey: 'statistics.zeroCrimeDays', threshold: 365, type: 'counter' },
  { id: 'eternal_peace', name: 'Eternal Peace', description: 'Maintain 0 crime rate for 730 days', category: 'population-citizen', icon: '👮', trackKey: 'statistics.zeroCrimeDays', threshold: 730, type: 'counter' },
  // Disease
  { id: 'disease_free', name: 'Disease Free', description: 'Maintain 0 disease rate for 30 days', category: 'population-citizen', icon: '🏥', trackKey: 'statistics.zeroDiseaseDays', threshold: 30, type: 'counter' },
  { id: 'healthy_populace', name: 'Healthy Populace', description: 'Maintain 0 disease rate for 60 days', category: 'population-citizen', icon: '🏥', trackKey: 'statistics.zeroDiseaseDays', threshold: 60, type: 'counter' },
  { id: 'immortal_nation', name: 'Immortal Nation', description: 'Maintain 0 disease rate for 90 days', category: 'population-citizen', icon: '🏥', trackKey: 'statistics.zeroDiseaseDays', threshold: 90, type: 'counter' },
  { id: 'disease_free_180', name: 'Disease Free', description: 'Maintain 0 disease rate for 180 days', category: 'population-citizen', icon: '🏥', trackKey: 'statistics.zeroDiseaseDays', threshold: 180, type: 'counter' },
  { id: 'healthy_365', name: 'Healthy Nation', description: 'Maintain 0 disease rate for 365 days', category: 'population-citizen', icon: '🏥', trackKey: 'statistics.zeroDiseaseDays', threshold: 365, type: 'counter' },
  { id: 'immortal_730', name: 'Immortal', description: 'Maintain 0 disease rate for 730 days', category: 'population-citizen', icon: '🏥', trackKey: 'statistics.zeroDiseaseDays', threshold: 730, type: 'counter' },
  // Happiness
  { id: 'utopia_happiness', name: 'Utopia Happiness', description: 'Maintain 100 happiness for 30 days', category: 'population-citizen', icon: '😊', trackKey: 'statistics.perfectHappinessDays', threshold: 30, type: 'counter' },
  { id: 'blissful_nation', name: 'Blissful Nation', description: 'Maintain 100 happiness for 60 days', category: 'population-citizen', icon: '😊', trackKey: 'statistics.perfectHappinessDays', threshold: 60, type: 'counter' },
  { id: 'eternal_joy', name: 'Eternal Joy', description: 'Maintain 100 happiness for 90 days', category: 'population-citizen', icon: '😊', trackKey: 'statistics.perfectHappinessDays', threshold: 90, type: 'counter' },
  { id: 'ultimate_happiness_180', name: 'Ultimate Happiness', description: 'Maintain 100 happiness for 180 days', category: 'population-citizen', icon: '😊', trackKey: 'statistics.perfectHappinessDays', threshold: 180, type: 'counter' },
  { id: 'perfect_happiness_365', name: 'Perfect Happiness', description: 'Maintain 100 happiness for 365 days', category: 'population-citizen', icon: '😊', trackKey: 'statistics.perfectHappinessDays', threshold: 365, type: 'counter' },
  { id: 'infinite_joy_730', name: 'Infinite Joy', description: 'Maintain 100 happiness for 730 days', category: 'population-citizen', icon: '😊', trackKey: 'statistics.perfectHappinessDays', threshold: 730, type: 'counter' },
];

if (typeof window !== 'undefined') {
    window.AwardData_populationCitizen = AwardData_populationCitizen;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AwardData_populationCitizen;
}
