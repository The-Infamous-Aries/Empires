const AwardData_researchTech = [
  // Research completion
  { id: 'atomic_age', name: 'Atomic Age', description: 'Research 50% of available technologies', category: 'research-tech', icon: '⚛️', trackKey: 'statistics.researchCompleted', threshold: 50, type: 'counter' },
  { id: 'future_tech', name: 'Future Tech', description: 'Research 65% of available technologies', category: 'research-tech', icon: '🔬', trackKey: 'statistics.researchCompleted', threshold: 65, type: 'peak' },
  { id: 'scientific_powerhouse', name: 'Scientific Powerhouse', description: 'Research 80% of available technologies', category: 'research-tech', icon: '🧪', trackKey: 'statistics.researchCompleted', threshold: 80, type: 'peak' },
  { id: 'tech_singularity', name: 'Tech Singularity', description: 'Research 95% of available technologies', category: 'research-tech', icon: '🧪', trackKey: 'statistics.researchCompleted', threshold: 95, type: 'peak' },
  // Literacy rates
  { id: 'scholar_nation', name: 'Scholar Nation', description: 'Reach 50% literacy rate', category: 'research-tech', icon: '📚', trackKey: 'statistics.literacyScore', threshold: 50, type: 'peak' },
  { id: 'literate_nation', name: 'Literate Nation', description: 'Reach 65% literacy rate', category: 'research-tech', icon: '📚', trackKey: 'statistics.literacyScore', threshold: 65, type: 'peak' },
  { id: 'enlightened_nation', name: 'Enlightened Nation', description: 'Reach 80% literacy rate', category: 'research-tech', icon: '📚', trackKey: 'statistics.literacyScore', threshold: 80, type: 'peak' },
  { id: 'wise_nation', name: 'Wise Nation', description: 'Reach 95% literacy rate', category: 'research-tech', icon: '📚', trackKey: 'statistics.literacyScore', threshold: 95, type: 'peak' },
  // Technologies purchased
  { id: 'tech_purchased_250', name: 'Researcher', description: 'Purchase 250 technologies', category: 'research-tech', icon: '🔬', trackKey: 'statistics.techPurchased', threshold: 250, type: 'peak' },
  { id: 'tech_purchased_500', name: 'Scholar', description: 'Purchase 500 technologies', category: 'research-tech', icon: '📚', trackKey: 'statistics.techPurchased', threshold: 500, type: 'peak' },
  { id: 'tech_purchased_750', name: 'Academic', description: 'Purchase 750 technologies', category: 'research-tech', icon: '🎓', trackKey: 'statistics.techPurchased', threshold: 750, type: 'peak' },
  { id: 'tech_purchased_1000', name: 'Scientist', description: 'Purchase 1,000 technologies', category: 'research-tech', icon: '🧪', trackKey: 'statistics.techPurchased', threshold: 1000, type: 'peak' },
  { id: 'tech_purchased_1500', name: 'Expert', description: 'Purchase 1,500 technologies', category: 'research-tech', icon: '👨‍🔬', trackKey: 'statistics.techPurchased', threshold: 1500, type: 'peak' },
  { id: 'tech_purchased_2000', name: 'Specialist', description: 'Purchase 2,000 technologies', category: 'research-tech', icon: '🧬', trackKey: 'statistics.techPurchased', threshold: 2000, type: 'peak' },
  { id: 'tech_purchased_2500', name: 'Authority', description: 'Purchase 2,500 technologies', category: 'research-tech', icon: '🏅', trackKey: 'statistics.techPurchased', threshold: 2500, type: 'peak' },
  { id: 'tech_purchased_3000', name: 'Master', description: 'Purchase 3,000 technologies', category: 'research-tech', icon: '👑', trackKey: 'statistics.techPurchased', threshold: 3000, type: 'peak' },
  { id: 'tech_purchased_3500', name: 'Grandmaster', description: 'Purchase 3,500 technologies', category: 'research-tech', icon: '🏆', trackKey: 'statistics.techPurchased', threshold: 3500, type: 'peak' },
  { id: 'tech_purchased_4500', name: 'Legend', description: 'Purchase 4,500 technologies', category: 'research-tech', icon: '⭐', trackKey: 'statistics.techPurchased', threshold: 4500, type: 'peak' },
  { id: 'tech_purchased_5000', name: 'Tech God', description: 'Purchase 5,000 technologies', category: 'research-tech', icon: '🚀', trackKey: 'statistics.techPurchased', threshold: 5000, type: 'peak' },
];

if (typeof window !== 'undefined') {
    window.AwardData_researchTech = AwardData_researchTech;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AwardData_researchTech;
}
