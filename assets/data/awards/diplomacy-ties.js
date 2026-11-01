const AwardData_diplomacyTies = [
  // Treaties signed
  { id: 'diplomat', name: 'Diplomat', description: 'Sign 25 treaties', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.treatiesSigned', threshold: 25, type: 'counter' },
  { id: 'diplomat_elite', name: 'Elite Diplomat', description: 'Sign 50 treaties', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.treatiesSigned', threshold: 50, type: 'counter' },
  { id: 'diplomat_grandmaster', name: 'Grandmaster Diplomat', description: 'Sign 100 treaties', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.treatiesSigned', threshold: 100, type: 'counter' },
  // Alliances formed
  { id: 'alliance_builder', name: 'Alliance Builder', description: 'Form your first alliance', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.alliancesFormed', threshold: 1, type: 'counter' },
  { id: 'easter_egg_alliance', name: 'Circle of Friends', description: 'Found an alliance using the best friend + five friends easter egg', category: 'diplomacy-ties', icon: '✨', trackKey: 'statistics.easterEggAlliances', threshold: 1, type: 'counter' },
  // Alliance duration
  { id: 'alliance_partner_180', name: 'Alliance Partner', description: 'Maintain an alliance for 180 days', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.allianceDays', threshold: 180, type: 'counter' },
  { id: 'alliance_loyal', name: 'Alliance Loyal', description: 'Maintain an alliance for 365 days', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.allianceDays', threshold: 365, type: 'counter' },
  { id: 'alliance_stalwart', name: 'Alliance Stalwart', description: 'Maintain an alliance for 545 days', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.allianceDays', threshold: 545, type: 'counter' },
  { id: 'alliance_eternal', name: 'Alliance Eternal', description: 'Maintain an alliance for 730 days', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.allianceDays', threshold: 730, type: 'counter' },
  // Positive relations
  { id: 'world_citizen', name: 'World Citizen', description: 'Maintain positive relations with 15 nations', category: 'diplomacy-ties', icon: '🌐', trackKey: 'statistics.positiveRelationsCount', threshold: 15, type: 'peak' },
  { id: 'world_citizen_plus', name: 'Global Citizen', description: 'Maintain positive relations with 25 nations', category: 'diplomacy-ties', icon: '🌐', trackKey: 'statistics.positiveRelationsCount', threshold: 25, type: 'peak' },
  { id: 'world_citizen_supreme', name: 'Supreme Citizen', description: 'Maintain positive relations with 50 nations', category: 'diplomacy-ties', icon: '🌐', trackKey: 'statistics.positiveRelationsCount', threshold: 50, type: 'peak' },
  { id: 'world_citizen_ultimate', name: 'Ultimate Citizen', description: 'Maintain positive relations with 75 nations', category: 'diplomacy-ties', icon: '🌐', trackKey: 'statistics.positiveRelationsCount', threshold: 75, type: 'peak' },
  // Friend count
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Have 5 friends', category: 'diplomacy-ties', icon: '🦋', trackKey: 'statistics.friendsCount', threshold: 5, type: 'peak' },
  // Same 5 friends duration
  { id: 'steady_friends_90', name: 'Steady Friends', description: 'Keep the same 5 friends for 90 days', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.fiveFriendsDays', threshold: 90, type: 'counter' },
  { id: 'steady_friends_180', name: 'Loyal Friends', description: 'Keep the same 5 friends for 180 days', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.fiveFriendsDays', threshold: 180, type: 'counter' },
  { id: 'steady_friends_365', name: 'Devoted Friends', description: 'Keep the same 5 friends for 365 days', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.fiveFriendsDays', threshold: 365, type: 'counter' },
  { id: 'steady_friends_730', name: 'Eternal Friends', description: 'Keep the same 5 friends for 730 days', category: 'diplomacy-ties', icon: '🤝', trackKey: 'statistics.fiveFriendsDays', threshold: 730, type: 'counter' },
  // 5 friends and 1 best friend
  { id: 'inner_circle', name: 'Inner Circle', description: 'Have 5 friends and 1 best friend', category: 'diplomacy-ties', icon: '👥', trackKey: 'statistics.fiveFriendsBestFriendDays', threshold: 1, type: 'counter' },
  // Same best friend duration
  { id: 'best_friend_90', name: 'Best Friend', description: 'Keep the same best friend for 90 days', category: 'diplomacy-ties', icon: '❤️', trackKey: 'statistics.bestFriendDays', threshold: 90, type: 'counter' },
  { id: 'best_friend_180', name: 'Close Friend', description: 'Keep the same best friend for 180 days', category: 'diplomacy-ties', icon: '❤️', trackKey: 'statistics.bestFriendDays', threshold: 180, type: 'counter' },
  { id: 'best_friend_365', name: 'Lifelong Friend', description: 'Keep the same best friend for 365 days', category: 'diplomacy-ties', icon: '❤️', trackKey: 'statistics.bestFriendDays', threshold: 365, type: 'counter' },
  { id: 'best_friend_730', name: 'Soulmate Friend', description: 'Keep the same best friend for 730 days', category: 'diplomacy-ties', icon: '❤️', trackKey: 'statistics.bestFriendDays', threshold: 730, type: 'counter' },
  // Same 5 friends and best friend duration
  { id: 'inner_circle_90', name: 'Tight Circle', description: 'Keep the same 5 friends and best friend for 90 days', category: 'diplomacy-ties', icon: '👥', trackKey: 'statistics.fiveFriendsBestFriendDays', threshold: 90, type: 'counter' },
  { id: 'inner_circle_180', name: 'Close Circle', description: 'Keep the same 5 friends and best friend for 180 days', category: 'diplomacy-ties', icon: '👥', trackKey: 'statistics.fiveFriendsBestFriendDays', threshold: 180, type: 'counter' },
  { id: 'inner_circle_365', name: 'Devoted Circle', description: 'Keep the same 5 friends and best friend for 365 days', category: 'diplomacy-ties', icon: '👥', trackKey: 'statistics.fiveFriendsBestFriendDays', threshold: 365, type: 'counter' },
  { id: 'inner_circle_730', name: 'Eternal Circle', description: 'Keep the same 5 friends and best friend for 730 days', category: 'diplomacy-ties', icon: '👥', trackKey: 'statistics.fiveFriendsBestFriendDays', threshold: 730, type: 'counter' },
];

if (typeof window !== 'undefined') {
    window.AwardData_diplomacyTies = AwardData_diplomacyTies;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AwardData_diplomacyTies;
}
