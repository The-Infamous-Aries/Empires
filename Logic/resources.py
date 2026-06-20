"""
Resource System for Sovereign Nation Game

This module defines the Resource components that determine
nation bonuses based on resource production.
"""

from dataclasses import dataclass
from typing import List, Dict
from enum import Enum


class ResourceType(Enum):
    """All available resource types in the game (15 standard resources)."""
    GRAIN = "Grain"
    TIMBER = "Timber"
    FISH = "Fish"
    LIVESTOCK = "Livestock"
    COAL = "Coal"
    IRON = "Iron"
    COPPER = "Copper"
    LIMESTONE = "Limestone"
    OIL = "Oil"
    LEAD = "Lead"
    SPICES = "Spices"
    GOLD = "Gold"
    GEMSTONES = "Gemstones"
    TITANIUM = "Titanium"
    URANIUM = "Uranium"


class SpecialResourceType(Enum):
    """Special unlockable resources (not tradable, not for building)."""
    WATER = "Water"


@dataclass
class Resource:
    """Resource with production bonuses and effects."""
    name: str
    base_production: float  # Base production per tick
    description: str  # Flavor text to help players understand the resource
    # Economic effects
    citizen_income_bonus: float = 0.0  # Bonus to citizen income in dollars
    commerce_income_bonus: float = 0.0  # Percentage bonus to commerce income
    bank_interest_bonus: float = 0.0  # Percentage bonus to bank interest
    # Cost effects
    infrastructure_cost_bonus: float = 0.0  # Percentage bonus to infrastructure cost (negative = cheaper)
    infrastructure_upkeep_bonus: float = 0.0  # Percentage bonus to infrastructure upkeep (negative = cheaper)
    improvement_upkeep_bonus: float = 0.0  # Percentage bonus to improvement upkeep (negative = cheaper)
    land_cost_bonus: float = 0.0  # Percentage bonus to land cost (negative = cheaper)
    wonder_cost_bonus: float = 0.0  # Percentage bonus to wonder cost (negative = cheaper)
    project_cost_bonus: float = 0.0  # Percentage bonus to project cost (negative = cheaper)
    technology_cost_bonus: float = 0.0  # Percentage bonus to technology cost (negative = cheaper)
    # Military effects
    soldier_upkeep_bonus: float = 0.0  # Percentage bonus to soldier upkeep (negative = cheaper)
    soldier_efficiency_bonus: float = 0.0  # Percentage bonus to soldier efficiency
    tank_cost_bonus: float = 0.0  # Percentage bonus to tank cost (negative = cheaper)
    tank_efficiency_bonus: float = 0.0  # Percentage bonus to tank efficiency
    aircraft_cost_bonus: float = 0.0  # Percentage bonus to aircraft cost (negative = cheaper)
    aircraft_upkeep_bonus: float = 0.0  # Percentage bonus to aircraft upkeep (negative = cheaper)
    ship_cost_bonus: float = 0.0  # Percentage bonus to ship cost (negative = cheaper)
    ship_upkeep_bonus: float = 0.0  # Percentage bonus to ship upkeep (negative = cheaper)
    missile_cost_bonus: float = 0.0  # Percentage bonus to missile cost (negative = cheaper)
    military_unit_damage_bonus: float = 0.0  # Percentage bonus to military unit damage
    # Population effects
    citizen_percentage_bonus: float = 0.0  # Percentage bonus to citizens
    happiness_bonus: int = 0  # Direct happiness modifier
    population_growth_bonus: float = 0.0  # Percentage bonus to population growth
    # Health effects
    disease_bonus: float = 0.0  # Disease per city (can be negative for reduction)
    hospital_effectiveness_bonus: float = 0.0  # Percentage bonus to hospital effectiveness
    # Environment effects
    environment_bonus: float = 0.0  # Environment bonus
    # Production effects
    agricultural_production_bonus: float = 0.0  # Percentage bonus to agricultural production
    # Special effects
    enables_nuclear_program: bool = False  # Whether resource enables nuclear program
    special_effect: str = ""  # Description of special effects

    def __str__(self) -> str:
        return self.name


class ResourceSystem:
    """System for managing resource types and their effects."""

    def __init__(self):
        self.resources: Dict[ResourceType, Resource] = self._initialize_resources()

    def _initialize_resources(self) -> Dict[ResourceType, Resource]:
        """Initialize all resource types with their data (15 standard resources)."""
        return {
            ResourceType.GRAIN: Resource(
                name="Grain",
                base_production=1.0,
                description="Basic agricultural staple for food. Increases population growth and happiness. Essential for sustainable population.",
                population_growth_bonus=0.05,
                happiness_bonus=1
            ),
            ResourceType.TIMBER: Resource(
                name="Timber",
                base_production=1.0,
                description="Basic building material for infrastructure. Reduces infrastructure and land costs. Essential for early development.",
                infrastructure_cost_bonus=-0.05,
                land_cost_bonus=-0.05
            ),
            ResourceType.FISH: Resource(
                name="Fish",
                base_production=1.0,
                description="Food source with health benefits. Increases citizens and reduces disease. Good for population growth.",
                citizen_percentage_bonus=0.06,
                disease_bonus=-1.0
            ),
            ResourceType.LIVESTOCK: Resource(
                name="Livestock",
                base_production=1.0,
                description="Agricultural resource providing food and materials. Reduces soldier upkeep with happiness bonus. Good for military nations.",
                soldier_upkeep_bonus=-0.06,
                happiness_bonus=1
            ),
            ResourceType.COAL: Resource(
                name="Coal",
                base_production=1.0,
                description="Fossil fuel for power generation. Reduces infrastructure upkeep with military efficiency. Good for industrial nations.",
                infrastructure_upkeep_bonus=-0.05,
                soldier_efficiency_bonus=0.05
            ),
            ResourceType.IRON: Resource(
                name="Iron",
                base_production=1.0,
                description="Basic metal for construction and military. Reduces infrastructure and tank costs. Essential for infrastructure and armor.",
                infrastructure_cost_bonus=-0.04,
                tank_cost_bonus=-0.06
            ),
            ResourceType.COPPER: Resource(
                name="Copper",
                base_production=1.0,
                description="Conductive metal for technology and commerce. Reduces technology cost with commerce bonus. Good for tech-focused nations.",
                technology_cost_bonus=-0.04,
                commerce_income_bonus=0.03
            ),
            ResourceType.LIMESTONE: Resource(
                name="Limestone",
                base_production=1.0,
                description="Building material for construction. Reduces wonder and infrastructure costs. Good for wonder-heavy strategies.",
                wonder_cost_bonus=-0.08,
                infrastructure_cost_bonus=-0.03
            ),
            ResourceType.OIL: Resource(
                name="Oil",
                base_production=1.0,
                description="Fossil fuel for vehicles and industry. Reduces aircraft and ship upkeep. Critical for naval and air power.",
                aircraft_upkeep_bonus=-0.08,
                ship_upkeep_bonus=-0.06
            ),
            ResourceType.LEAD: Resource(
                name="Lead",
                base_production=1.0,
                description="Metal for ammunition and shielding. Reduces missile cost with military efficiency. Good for missile strategies.",
                missile_cost_bonus=-0.08,
                soldier_efficiency_bonus=0.04
            ),
            ResourceType.SPICES: Resource(
                name="Spices",
                base_production=1.0,
                description="Luxury trade good with high value. Increases happiness and citizen income. Good for commerce-focused nations.",
                happiness_bonus=3,
                citizen_income_bonus=1.0
            ),
            ResourceType.GOLD: Resource(
                name="Gold",
                base_production=1.0,
                description="Precious metal for currency and trade. Increases citizen income and commerce income. Good for economic dominance.",
                citizen_income_bonus=3.0,
                commerce_income_bonus=0.05
            ),
            ResourceType.GEMSTONES: Resource(
                name="Gemstones",
                base_production=1.0,
                description="Luxury resource with high value. Increases citizen income and happiness. Good for wealth generation.",
                citizen_income_bonus=4.0,
                happiness_bonus=2
            ),
            ResourceType.TITANIUM: Resource(
                name="Titanium",
                base_production=1.0,
                description="Strong lightweight metal for advanced military. Reduces aircraft and ship costs. Good for advanced military.",
                aircraft_cost_bonus=-0.12,
                ship_cost_bonus=-0.10
            ),
            ResourceType.URANIUM: Resource(
                name="Uranium",
                base_production=1.0,
                description="Radioactive metal for nuclear energy and weapons. Enables nuclear program with high income. Good for nuclear strategies.",
                enables_nuclear_program=True,
                citizen_income_bonus=5.0
            ),
        }

    def get_special_resource(self, resource_type: SpecialResourceType) -> Resource:
        """Get a special resource by type (e.g., Water)."""
        if resource_type == SpecialResourceType.WATER:
            return Resource(
                name="Water",
                base_production=0.0,  # Not produced, only provides bonuses
                description="Essential for life and agriculture. Reduces disease and boosts agricultural production. Unlockable via project/wonder. NOT tradable, NOT used for building.",
                disease_bonus=-2.0,
                happiness_bonus=1,
                agricultural_production_bonus=0.15,
                special_effect="Unlockable via Aqueduct System, Irrigation Network, or National Water Treatment. Provides conditional bonuses when unlocked."
            )
        raise ValueError(f"Unknown special resource type: {resource_type}")

    def get_resource(self, resource_type: ResourceType) -> Resource:
        """Get a resource by type."""
        return self.resources[resource_type]

    def get_all_resources(self) -> List[Resource]:
        """Get all available resources."""
        return list(self.resources.values())
    
    def get_unlocked_bonus_resources(self, resource_pool: List[ResourceType]) -> List[ResourceType]:
        """Calculate which bonus resources are unlocked by the resource pool.
        
        In Politics & War, having 3 of a resource type unlocks bonus resources.
        This is a simplified implementation that returns the resource types
        that appear 3 or more times in the pool.
        """
        from collections import Counter
        counts = Counter(resource_pool)
        bonus_resources = [rt for rt, count in counts.items() if count >= 3]
        return bonus_resources


# Singleton instance
resource_system = ResourceSystem()
