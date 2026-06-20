"""
Progression System for Sovereign Nation Game

This module defines the tier progression system with enriched tiers
that provide bonuses and unlock features as nations grow.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum


class ProgressionTier(Enum):
    """Progression tiers for nations."""
    MICRO = "Micro"
    SMALL = "Small"
    MEDIUM = "Medium"
    LARGE = "Large"
    MAJOR = "Major"
    SUPERPOWER = "Superpower"
    HEGEMON = "Hegemon"  # Additional tier beyond Superpower


@dataclass
class TierRequirements:
    """Requirements to reach a tier."""
    min_ns: float = 0.0
    max_ns: float = float('inf')
    min_infrastructure: int = 0
    max_infrastructure: int = float('inf')
    min_cities: int = 0
    max_cities: int = float('inf')
    min_technology: int = 0
    min_population: int = 0
    min_wonders: int = 0
    
    def meets_requirements(self, ns: float, infrastructure: int, cities: int,
                         technology: int, population: int, wonders: int) -> bool:
        """Check if nation meets tier requirements."""
        return (
            ns >= self.min_ns and ns < self.max_ns and
            infrastructure >= self.min_infrastructure and infrastructure < self.max_infrastructure and
            cities >= self.min_cities and cities < self.max_cities and
            technology >= self.min_technology and
            population >= self.min_population and
            wonders >= self.min_wonders
        )


@dataclass
class TierBonuses:
    """Bonuses provided by a tier."""
    # Economic bonuses
    tax_income_bonus: float = 0.0
    commerce_income_bonus: float = 0.0
    trade_income_bonus: float = 0.0
    tech_income_bonus: float = 0.0
    
    # Cost bonuses
    infrastructure_cost_bonus: float = 0.0
    improvement_cost_bonus: float = 0.0
    wonder_cost_bonus: float = 0.0
    technology_cost_bonus: float = 0.0
    military_cost_bonus: float = 0.0
    
    # Military bonuses
    military_unit_cap_bonus: float = 0.0
    soldier_efficiency_bonus: float = 0.0
    tank_efficiency_bonus: float = 0.0
    aircraft_efficiency_bonus: float = 0.0
    ship_efficiency_bonus: float = 0.0
    
    # Population bonuses
    population_growth_bonus: float = 0.0
    happiness_bonus: int = 0
    
    # Resource bonuses
    resource_production_bonus: float = 0.0
    
    # Diplomatic bonuses
    spy_success_bonus: float = 0.0
    spy_defense_bonus: float = 0.0
    war_score_bonus: float = 0.0
    
    # Special abilities
    can_form_alliance: bool = False
    max_alliance_members: int = 0
    can_declare_world_war: bool = False
    can_use_wmds: bool = False
    can_build_super_wonders: bool = False
    
    # New player protection
    new_player_protection: bool = False
    protected_from_ns_threshold: float = 0.0


@dataclass
class Tier:
    """Represents a progression tier."""
    
    tier: ProgressionTier
    name: str
    description: str
    
    requirements: TierRequirements = field(default_factory=TierRequirements)
    bonuses: TierBonuses = field(default_factory=TierBonuses)
    
    # Tier-specific unlocks
    unlocked_improvements: List[str] = field(default_factory=list)
    unlocked_wonders: List[str] = field(default_factory=list)
    unlocked_projects: List[str] = field(default_factory=list)
    
    # Color for UI
    tier_color: str = "#FFFFFF"
    
    def can_unlock_improvement(self, improvement_name: str) -> bool:
        """Check if tier unlocks an improvement."""
        return improvement_name in self.unlocked_improvements
    
    def can_unlock_wonder(self, wonder_name: str) -> bool:
        """Check if tier unlocks a wonder."""
        return wonder_name in self.unlocked_wonders
    
    def can_unlock_project(self, project_name: str) -> bool:
        """Check if tier unlocks a project."""
        return project_name in self.unlocked_projects


class ProgressionSystem:
    """System for managing progression tiers."""
    
    def __init__(self):
        self.tiers: Dict[ProgressionTier, Tier] = {}
        self._initialize_tiers()
    
    def _initialize_tiers(self):
        """Initialize all progression tiers."""
        # MICRO TIER
        self.tiers[ProgressionTier.MICRO] = Tier(
            tier=ProgressionTier.MICRO,
            name="Micro Nation",
            description="New nation learning the basics. Protected from larger nations.",
            requirements=TierRequirements(
                min_ns=0,
                max_ns=500,
                min_infrastructure=0,
                max_infrastructure=500,
                min_cities=0,
                max_cities=2,
                min_technology=0,
                min_population=0,
                min_wonders=0
            ),
            bonuses=TierBonuses(
                new_player_protection=True,
                protected_from_ns_threshold=1000.0
            ),
            tier_color="#7FDBFF"  # Light blue
        )
        
        # SMALL TIER
        self.tiers[ProgressionTier.SMALL] = Tier(
            tier=ProgressionTier.SMALL,
            name="Small Nation",
            description="Growing nation establishing itself. Learning phase.",
            requirements=TierRequirements(
                min_ns=500,
                max_ns=2500,
                min_infrastructure=500,
                max_infrastructure=2000,
                min_cities=1,
                max_cities=4,
                min_technology=100,
                min_population=1000,
                min_wonders=0
            ),
            bonuses=TierBonuses(
                tax_income_bonus=0.02,
                population_growth_bonus=0.02,
                can_form_alliance=True,
                max_alliance_members=5
            ),
            unlocked_improvements=[
                "National Harbor",
                "Merchant Exchange",
                "National Warehouse"
            ],
            tier_color="#39CCCC"  # Teal
        )
        
        # MEDIUM TIER
        self.tiers[ProgressionTier.MEDIUM] = Tier(
            tier=ProgressionTier.MEDIUM,
            name="Medium Nation",
            description="Established nation with growing influence. Core gameplay.",
            requirements=TierRequirements(
                min_ns=2500,
                max_ns=10000,
                min_infrastructure=2000,
                max_infrastructure=5000,
                min_cities=3,
                max_cities=9,
                min_technology=500,
                min_population=5000,
                min_wonders=1
            ),
            bonuses=TierBonuses(
                tax_income_bonus=0.05,
                commerce_income_bonus=0.03,
                trade_income_bonus=0.05,
                infrastructure_cost_bonus=-0.03,
                improvement_cost_bonus=-0.02,
                military_unit_cap_bonus=0.05,
                max_alliance_members=10
            ),
            unlocked_improvements=[
                "National Shopping Districts",
                "National Grand Mall",
                "National Sports Arenas",
                "National Stock Exchange",
                "National Advanced Lab",
                "National Internet Hub"
            ],
            unlocked_wonders=[
                "Central Bank",
                "Grand Monument",
                "Pentagon"
            ],
            unlocked_projects=[
                "Space Race"
            ],
            tier_color="#0074D9"  # Blue
        )
        
        # LARGE TIER
        self.tiers[ProgressionTier.LARGE] = Tier(
            tier=ProgressionTier.LARGE,
            name="Large Nation",
            description="Powerful nation with regional influence. Alliance politics.",
            requirements=TierRequirements(
                min_ns=10000,
                max_ns=50000,
                min_infrastructure=5000,
                max_infrastructure=15000,
                min_cities=8,
                max_cities=21,
                min_technology=1500,
                min_population=20000,
                min_wonders=3
            ),
            bonuses=TierBonuses(
                tax_income_bonus=0.08,
                commerce_income_bonus=0.05,
                trade_income_bonus=0.08,
                tech_income_bonus=0.05,
                infrastructure_cost_bonus=-0.05,
                improvement_cost_bonus=-0.04,
                wonder_cost_bonus=-0.03,
                technology_cost_bonus=-0.05,
                military_cost_bonus=-0.03,
                military_unit_cap_bonus=0.10,
                soldier_efficiency_bonus=0.03,
                spy_success_bonus=0.05,
                max_alliance_members=20,
                can_use_wmds=True
            ),
            unlocked_improvements=[
                "National Quantum Research Center",
                "National Space Launch Facility",
                "Missile Battery",
                "Nuclear Silo",
                "Intelligence HQ",
                "Propaganda Bureau",
                "Fortifications"
            ],
            unlocked_wonders=[
                "World Stock Market",
                "Artificial Intelligence",
                "Strategic Defense Initiative",
                "Space Agency",
                "Nuclear Arsenal"
            ],
            unlocked_projects=[
                "Fusion Reactor",
                "Manhattan Project",
                "Drone Program",
                "Submarine Fleet",
                "Biological Weapons Program",
                "Chemical Weapons Arsenal",
                "Cyber Warfare Division"
            ],
            tier_color="#2ECC40"  # Green
        )
        
        # MAJOR TIER
        self.tiers[ProgressionTier.MAJOR] = Tier(
            tier=ProgressionTier.MAJOR,
            name="Major Nation",
            description="Dominant nation with global influence. Top-tier warfare.",
            requirements=TierRequirements(
                min_ns=50000,
                max_ns=200000,
                min_infrastructure=15000,
                max_infrastructure=40000,
                min_cities=20,
                max_cities=41,
                min_technology=3000,
                min_population=50000,
                min_wonders=5
            ),
            bonuses=TierBonuses(
                tax_income_bonus=0.12,
                commerce_income_bonus=0.08,
                trade_income_bonus=0.12,
                tech_income_bonus=0.10,
                infrastructure_cost_bonus=-0.08,
                improvement_cost_bonus=-0.06,
                wonder_cost_bonus=-0.05,
                technology_cost_bonus=-0.10,
                military_cost_bonus=-0.05,
                military_unit_cap_bonus=0.15,
                soldier_efficiency_bonus=0.05,
                tank_efficiency_bonus=0.03,
                aircraft_efficiency_bonus=0.03,
                ship_efficiency_bonus=0.03,
                population_growth_bonus=0.05,
                resource_production_bonus=0.05,
                spy_success_bonus=0.10,
                spy_defense_bonus=0.05,
                war_score_bonus=0.10,
                max_alliance_members=30,
                can_declare_world_war=True,
                can_build_super_wonders=True
            ),
            unlocked_improvements=[
                "National Quantum Research Center",
                "Fusion Plant"
            ],
            unlocked_wonders=[
                "Quantum Computing",
                "Genetic Engineering",
                "Nanotechnology",
                "Advanced Materials",
                "Military Satellite",
                "Fortified Citadel",
                "Grand Naval Shipyard",
                "Air Defense Network"
            ],
            unlocked_projects=[
                "Space Race"
            ],
            tier_color="#FFDC00"  # Yellow
        )
        
        # SUPERPOWER TIER
        self.tiers[ProgressionTier.SUPERPOWER] = Tier(
            tier=ProgressionTier.SUPERPOWER,
            name="Superpower",
            description="Global superpower with unmatched influence. Endgame content.",
            requirements=TierRequirements(
                min_ns=200000,
                max_ns=1000000,
                min_infrastructure=40000,
                max_infrastructure=100000,
                min_cities=40,
                max_cities=100,
                min_technology=5000,
                min_population=100000,
                min_wonders=8
            ),
            bonuses=TierBonuses(
                tax_income_bonus=0.18,
                commerce_income_bonus=0.12,
                trade_income_bonus=0.18,
                tech_income_bonus=0.15,
                infrastructure_cost_bonus=-0.12,
                improvement_cost_bonus=-0.10,
                wonder_cost_bonus=-0.08,
                technology_cost_bonus=-0.15,
                military_cost_bonus=-0.08,
                military_unit_cap_bonus=0.25,
                soldier_efficiency_bonus=0.08,
                tank_efficiency_bonus=0.05,
                aircraft_efficiency_bonus=0.05,
                ship_efficiency_bonus=0.05,
                population_growth_bonus=0.08,
                happiness_bonus=3,
                resource_production_bonus=0.10,
                spy_success_bonus=0.15,
                spy_defense_bonus=0.10,
                war_score_bonus=0.15,
                max_alliance_members=50,
                can_declare_world_war=True,
                can_use_wmds=True,
                can_build_super_wonders=True
            ),
            unlocked_wonders=[
                "Moon Landing",
                "Moon Base",
                "Mars Colony",
                "Orbital Platform"
            ],
            tier_color="#FF851B"  # Orange
        )
        
        # HEGEMON TIER (Additional endgame tier)
        self.tiers[ProgressionTier.HEGEMON] = Tier(
            tier=ProgressionTier.HEGEMON,
            name="Global Hegemon",
            description="Ultimate global dominance. The pinnacle of nation-building.",
            requirements=TierRequirements(
                min_ns=1000000,
                max_ns=float('inf'),
                min_infrastructure=100000,
                max_infrastructure=float('inf'),
                min_cities=100,
                max_cities=float('inf'),
                min_technology=10000,
                min_population=500000,
                min_wonders=15
            ),
            bonuses=TierBonuses(
                tax_income_bonus=0.25,
                commerce_income_bonus=0.18,
                trade_income_bonus=0.25,
                tech_income_bonus=0.25,
                infrastructure_cost_bonus=-0.15,
                improvement_cost_bonus=-0.12,
                wonder_cost_bonus=-0.10,
                technology_cost_bonus=-0.20,
                military_cost_bonus=-0.10,
                military_unit_cap_bonus=0.40,
                soldier_efficiency_bonus=0.12,
                tank_efficiency_bonus=0.08,
                aircraft_efficiency_bonus=0.08,
                ship_efficiency_bonus=0.08,
                population_growth_bonus=0.12,
                happiness_bonus=5,
                resource_production_bonus=0.15,
                spy_success_bonus=0.20,
                spy_defense_bonus=0.15,
                war_score_bonus=0.25,
                max_alliance_members=100,
                can_declare_world_war=True,
                can_use_wmds=True,
                can_build_super_wonders=True
            ),
            tier_color="#FF4136"  # Red
        )
    
    def get_nation_tier(self, ns: float, infrastructure: int, cities: int,
                      technology: int, population: int, wonders: int) -> ProgressionTier:
        """Get the current tier for a nation based on its stats."""
        for tier in reversed(list(ProgressionTier)):
            tier_data = self.tiers[tier]
            if tier_data.requirements.meets_requirements(ns, infrastructure, cities,
                                                          technology, population, wonders):
                return tier
        
        return ProgressionTier.MICRO  # Default to Micro if no tier matches
    
    def get_tier(self, tier: ProgressionTier) -> Tier:
        """Get tier data for a specific tier."""
        return self.tiers[tier]
    
    def get_all_tiers(self) -> List[Tier]:
        """Get all tiers in order."""
        return [self.tiers[tier] for tier in ProgressionTier]
    
    def get_tier_bonuses(self, tier: ProgressionTier) -> TierBonuses:
        """Get bonuses for a specific tier."""
        return self.tiers[tier].bonuses
    
    def can_progress_to_tier(self, current_tier: ProgressionTier, target_tier: ProgressionTier,
                            ns: float, infrastructure: int, cities: int,
                            technology: int, population: int, wonders: int) -> tuple[bool, str]:
        """Check if nation can progress to a target tier."""
        target_tier_data = self.tiers[target_tier]
        
        if target_tier_data.requirements.meets_requirements(ns, infrastructure, cities,
                                                          technology, population, wonders):
            return True, ""
        
        # Determine what's missing
        missing = []
        
        if ns < target_tier_data.requirements.min_ns:
            missing.append(f"Need {target_tier_data.requirements.min_ns} NS (current: {ns})")
        
        if infrastructure < target_tier_data.requirements.min_infrastructure:
            missing.append(f"Need {target_tier_data.requirements.min_infrastructure} infrastructure (current: {infrastructure})")
        
        if cities < target_tier_data.requirements.min_cities:
            missing.append(f"Need {target_tier_data.requirements.min_cities} cities (current: {cities})")
        
        if technology < target_tier_data.requirements.min_technology:
            missing.append(f"Need {target_tier_data.requirements.min_technology} technology (current: {technology})")
        
        if population < target_tier_data.requirements.min_population:
            missing.append(f"Need {target_tier_data.requirements.min_population} population (current: {population})")
        
        if wonders < target_tier_data.requirements.min_wonders:
            missing.append(f"Need {target_tier_data.requirements.min_wonders} wonders (current: {wonders})")
        
        return False, "; ".join(missing)
    
    def get_tier_progress(self, current_tier: ProgressionTier, ns: float, infrastructure: int,
                        cities: int, technology: int, population: int, wonders: int) -> Dict[str, float]:
        """Get progress percentage toward next tier."""
        current_tier_data = self.tiers[current_tier]
        
        # Find next tier
        tier_list = list(ProgressionTier)
        current_index = tier_list.index(current_tier)
        
        if current_index >= len(tier_list) - 1:
            return {"progress": 100.0, "at_max": True}  # At max tier
        
        next_tier = tier_list[current_index + 1]
        next_tier_data = self.tiers[next_tier]
        
        # Calculate progress based on NS (primary metric)
        ns_range = next_tier_data.requirements.min_ns - current_tier_data.requirements.min_ns
        ns_progress = (ns - current_tier_data.requirements.min_ns) / ns_range if ns_range > 0 else 0
        
        # Calculate progress based on infrastructure (secondary metric)
        infra_range = next_tier_data.requirements.min_infrastructure - current_tier_data.requirements.min_infrastructure
        infra_progress = (infrastructure - current_tier_data.requirements.min_infrastructure) / infra_range if infra_range > 0 else 0
        
        # Average progress
        overall_progress = (ns_progress + infra_progress) / 2.0
        
        return {
            "progress": max(0.0, min(100.0, overall_progress * 100)),
            "ns_progress": max(0.0, min(100.0, ns_progress * 100)),
            "infra_progress": max(0.0, min(100.0, infra_progress * 100)),
            "at_max": False
        }
    
    def is_protected(self, nation_ns: float, attacker_ns: float) -> bool:
        """Check if nation is protected by new player protection rules."""
        micro_tier = self.tiers[ProgressionTier.MICRO]
        
        if nation_ns < micro_tier.requirements.max_ns:  # Under 500 NS
            return attacker_ns > micro_tier.bonuses.protected_from_ns_threshold  # Attacker over 1000 NS
        
        return False


# Singleton instance
progression_system = ProgressionSystem()
