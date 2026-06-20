"""
Improvement System for Sovereign Nation Game

This module defines the Improvement components that determine
nation capabilities, production bonuses, and military efficiency.
"""

from dataclasses import dataclass
from typing import Dict, Set, Optional
from enum import Enum


class ImprovementCategory(Enum):
    """Categories of improvements."""
    POWER = "Power"
    TRADE_RESOURCE = "Trade & Resource"
    MILITARY = "Military"


class ImprovementType(Enum):
    """All available improvement types in the game."""
    # Power Improvements
    WOOD_BURNING_PLANT = "Wood Burning Plant"
    COAL_BURNING_PLANT = "Coal Burning Plant"
    OIL_BURNING_PLANT = "Oil Burning Plant"
    URANIUM_POWER_PLANT = "Uranium Power Plant"
    WIND_WATER_POWER = "Wind/Water Power"
    # FUSION_PLANT removed - converted to wonder
    
    # Trade & Resource Improvements
    TRADE_POST = "Trade Post"
    EXTRACTION_COMPLEX = "Extraction Complex"
    PROCESSING_PLANT = "Processing Plant"
    INDUSTRIAL_EXTRACTOR = "Industrial Extractor"
    ADVANCED_REFINERY = "Advanced Refinery"
    NATIONAL_HARBOR = "National Harbor"
    MERCHANT_EXCHANGE = "Merchant Exchange"
    NATIONAL_WAREHOUSE = "National Warehouse"
    IRRIGATION_NETWORK = "Irrigation Network"
    MINING_NETWORK = "Mining Network"
    STRATEGIC_MINING_FACILITY = "Strategic Mining Facility"
    
    # Civil Improvements (removed - converted to projects)
    
    # Commerce Improvements (removed - converted to projects)
    
    # Military Improvements - Soldiers
    TRAINING_GROUNDS = "Training Grounds"
    BARRACKS = "Barracks"
    ARMORY = "Armory"
    MILITARY_ACADEMY = "Military Academy"
    SPECIAL_FORCES_HQ = "Special Forces HQ"
    
    # Military Improvements - Tanks
    TANK_WORKSHOP = "Tank Workshop"
    TANK_FACTORY = "Tank Factory"
    WEAPONS_FORGE = "Weapons Forge"
    ARMOR_FOUNDRY = "Armor Foundry"
    ADVANCED_TANK_PLANT = "Advanced Tank Plant"
    
    # Military Improvements - Aircraft
    AIRFIELD = "Airfield"
    AIR_FORCE_BASE = "Air Force Base"
    ADVANCED_AVIATION_HUB = "Advanced Aviation Hub"
    STEALTH_FIGHTER_BASE = "Stealth Fighter Base"
    SUPERSONIC_COMMAND = "Supersonic Command"
    
    # Military Improvements - Ships
    DOCK = "Drydock"
    NAVAL_BASE = "Naval Base"
    ADVANCED_SHIPYARD = "Advanced Shipyard"
    NAVAL_ACADEMY = "Naval Academy"
    FLEET_COMMAND = "Fleet Command"
    
    # Special Military Improvements
    MISSILE_BATTERY = "Missile Battery"
    NUCLEAR_SILO = "Nuclear Silo"
    INTELLIGENCE_HQ = "Intelligence HQ"
    PROPAGANDA_BUREAU = "Propaganda Bureau"
    FORTIFICATIONS = "Fortifications"
    
    # Science & Technology Improvements (removed - converted to projects)
    
    # Infrastructure Improvements (removed - converted to projects)


@dataclass
class Improvement:
    """Improvement with costs, requirements, and effects."""
    name: str
    category: ImprovementCategory  # Category of improvement
    description: str  # Flavor text describing the improvement
    # Costs
    cash_cost: float  # Cash cost to build
    build_resources: Dict[str, int]  # Resources required to build
    upkeep_cash: float  # Cash upkeep per tick
    upkeep_resources: Optional[Dict[str, int]] = None  # Resources required for upkeep per tick
    # Requirements
    requires_power: bool = False  # Whether improvement requires power
    requires_tech: int = 0  # Technology level required
    requires_project: Optional[str] = None  # Project required (e.g., "Manhattan Project")
    requires_improvement: Optional[str] = None  # Other improvement required
    requires_infrastructure: int = 0  # Infrastructure level required
    requires_wonder: Optional[str] = None  # Wonder required
    max_count: int = 1  # Maximum count allowed (1 for most, higher for military)
    # Effects
    # Economic effects
    citizen_income_bonus: float = 0.0  # Direct bonus to citizen income
    commerce_income_per_citizen: float = 0.0  # Commerce income per citizen
    trade_income_bonus: float = 0.0  # Percentage bonus to trade income
    bank_interest_bonus: float = 0.0  # Percentage bonus to bank interest
    literacy_bonus: float = 0.0  # Bonus to literacy rate (0-100 scale)
    # Production effects
    resource_production_bonus: float = 0.0  # Percentage bonus to resource production
    resource_slot: int = 0  # Which resource slot this improvement applies to (0 = all, 1 = resource_1, 2 = resource_2)
    agricultural_production_bonus: float = 0.0  # Percentage bonus to agricultural production
    industrial_production_bonus: float = 0.0  # Percentage bonus to industrial production
    strategic_production_bonus: float = 0.0  # Percentage bonus to strategic production
    # Military efficiency effects
    soldier_efficiency_bonus: float = 0.0  # Percentage bonus to soldier efficiency
    tank_efficiency_bonus: float = 0.0  # Percentage bonus to tank efficiency
    aircraft_efficiency_bonus: float = 0.0  # Percentage bonus to aircraft efficiency
    ship_efficiency_bonus: float = 0.0  # Percentage bonus to ship efficiency
    dogfight_bonus: float = 0.0  # Percentage bonus to dogfight
    # Military cost effects
    soldier_upkeep_bonus: float = 0.0  # Percentage bonus to soldier upkeep (negative = cheaper)
    tank_cost_bonus: float = 0.0  # Percentage bonus to tank cost (negative = cheaper)
    aircraft_cost_bonus: float = 0.0  # Percentage bonus to aircraft cost (negative = cheaper)
    ship_cost_bonus: float = 0.0  # Percentage bonus to ship cost (negative = cheaper)
    ship_upkeep_bonus: float = 0.0  # Percentage bonus to ship upkeep (negative = cheaper)
    ship_purchase_per_tick: float = 0.0  # Additional ship purchases per tick
    # Military capacity effects
    missile_cap_bonus: int = 0  # Bonus to missile cap
    nuke_cap_bonus: int = 0  # Bonus to nuke cap
    spy_capacity_bonus: int = 0  # Bonus to spy capacity
    # Technology effects
    technology_cost_bonus: float = 0.0  # Percentage bonus to technology cost (negative = cheaper)
    # Cost effects
    infrastructure_cost_bonus: float = 0.0  # Percentage bonus to infrastructure cost (negative = cheaper)
    infrastructure_upkeep_bonus: float = 0.0  # Percentage bonus to infrastructure upkeep (negative = cheaper)
    new_city_cost_bonus: float = 0.0  # Percentage bonus to new city cost (negative = cheaper)
    improvement_upkeep_bonus: float = 0.0  # Percentage bonus to improvement upkeep (negative = cheaper)
    # Population effects
    citizen_percentage_bonus: float = 0.0  # Percentage bonus to citizens
    happiness_bonus: int = 0  # Direct happiness modifier
    # Health effects
    disease_bonus: float = 0.0  # Disease per city (can be negative for reduction)
    hospital_effectiveness_bonus: float = 0.0  # Percentage bonus to hospital effectiveness
    crime_bonus: float = 0.0  # Crime per city (can be negative for reduction)
    # Environmental effects
    pollution_bonus: float = 0.0  # Pollution per city (can be negative for reduction)
    environment_bonus: float = 0.0  # Environment bonus
    # Power effects
    power_output: int = 0  # Power output from this plant
    power_plant_efficiency_bonus: float = 0.0  # Percentage bonus to power plant efficiency
    # Defense effects
    spy_defense_bonus: float = 0.0  # Percentage bonus to spy defense
    spy_success_bonus: float = 0.0  # Percentage bonus to spy success
    enemy_spy_success_bonus: float = 0.0  # Percentage bonus to enemy spy success (negative = reduction)
    city_resistance_bonus: float = 0.0  # Bonus to city resistance
    # War effects
    war_happiness_penalty_reduction: float = 0.0  # Percentage reduction to war happiness penalty
    infrastructure_war_damage_bonus: float = 0.0  # Percentage bonus to infrastructure war damage (negative = reduction)
    disaster_damage_bonus: float = 0.0  # Percentage bonus to disaster damage (negative = reduction)
    natural_disaster_damage_bonus: float = 0.0  # Percentage bonus to natural disaster damage (negative = reduction)
    # Special effects
    enables_missiles: bool = False  # Whether improvement enables missile capability
    enables_nuclear_weapons: bool = False  # Whether improvement enables nuclear weapons
    stockpile_capacity_multiplier: float = 1.0  # Multiplier for stockpile capacity
    unlocks_trade_slots: int = 0  # Number of trade slots unlocked
    unlocks_resource_production: int = 0  # Number of additional resource production unlocked
    enables_global_market: bool = False  # Whether improvement enables global market selling
    enables_space_wonders: bool = False  # Whether improvement enables space wonders
    enables_quantum_wonder: bool = False  # Whether improvement enables Quantum Computing wonder

    def __post_init__(self):
        """Initialize None dicts to empty dicts."""

    def __str__(self) -> str:
        return self.name


class ImprovementSystem:
    """System for managing improvement types and their effects."""

    def __init__(self):
        self.improvements: Dict[ImprovementType, Improvement] = self._initialize_improvements()

    def _initialize_improvements(self) -> Dict[ImprovementType, Improvement]:
        """Initialize all improvement types with their data."""
        return {
            # Power Improvements
            ImprovementType.WOOD_BURNING_PLANT: Improvement(
                name="Wood Burning Plant",
                category=ImprovementCategory.POWER,
                description="Basic wood-burning power plant. High pollution, very cheap. Early game only.",
                cash_cost=3000.0,
                build_resources={"Timber": 80},
                upkeep_cash=100.0,
                requires_power=False,
                pollution_bonus=0.8
            ),
            ImprovementType.COAL_BURNING_PLANT: Improvement(
                name="Coal Burning Plant",
                category=ImprovementCategory.POWER,
                description="Standard coal-burning power plant. Moderate pollution, good efficiency.",
                cash_cost=8000.0,
                build_resources={"Coal": 100, "Iron": 40},
                upkeep_cash=200.0,
                requires_power=False,
                pollution_bonus=0.8
            ),
            ImprovementType.OIL_BURNING_PLANT: Improvement(
                name="Oil Burning Plant",
                category=ImprovementCategory.POWER,
                description="Oil-burning power plant. Cleaner than coal, more efficient. Requires 200 tech.",
                cash_cost=12000.0,
                build_resources={"Oil": 100, "Iron": 35},
                upkeep_cash=300.0,
                requires_power=False,
                requires_tech=200,
                pollution_bonus=0.6
            ),
            ImprovementType.URANIUM_POWER_PLANT: Improvement(
                name="Uranium Power Plant",
                category=ImprovementCategory.POWER,
                description="Nuclear power plant. Provides 600 power. Requires 800 tech. Pollution: 0.2 per city.",
                cash_cost=25000.0,
                build_resources={"Uranium": 100, "Iron": 90, "Lead": 80},
                upkeep_cash=6000.0,
                requires_power=False,
                requires_tech=800,
                power_output=600,
                pollution_bonus=0.2
            ),
            ImprovementType.WIND_WATER_POWER: Improvement(
                name="Wind/Water Power",
                category=ImprovementCategory.POWER,
                description="Renewable wind or water power. No resource consumption, no pollution. Requires 1,200 tech.",
                cash_cost=30000.0,
                build_resources={"Titanium": 80, "Copper": 70, "Lead": 50},
                upkeep_cash=3000.0,
                requires_power=False,
                requires_tech=1200,
                pollution_bonus=0.0
            ),
            # Trade & Resource Improvements
            ImprovementType.TRADE_POST: Improvement(
                name="Trade Post",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="Unlocks 1 trade slot and enables 1 additional resource production. Max 4 per nation.",
                cash_cost=5000.0,
                build_resources={"Timber": 60, "Limestone": 40},
                upkeep_cash=600.0,
                requires_power=False,
                max_count=4,
                unlocks_trade_slots=1,
                unlocks_resource_production=1
            ),
            ImprovementType.EXTRACTION_COMPLEX: Improvement(
                name="Extraction Complex",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="+6% production of one chosen resource nation-wide. Stack up to 3 per resource (max 2 resources).",
                cash_cost=6000.0,
                build_resources={"Timber": 70, "Iron": 50},
                upkeep_cash=1000.0,
                max_count=3,
                resource_production_bonus=0.06
            ),
            ImprovementType.PROCESSING_PLANT: Improvement(
                name="Processing Plant",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="+15% production of one chosen resource nation-wide. Requires power. Replaces Extraction Complex. Stack up to 2 per resource (max 2 resources).",
                cash_cost=7000.0,
                build_resources={"Iron": 80, "Timber": 60},
                upkeep_cash=2500.0,
                requires_power=True,
                max_count=2,
                resource_production_bonus=0.15
            ),
            ImprovementType.INDUSTRIAL_EXTRACTOR: Improvement(
                name="Industrial Extractor",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="+10% production of one chosen resource nation-wide. Requires power + 500 tech.",
                cash_cost=8000.0,
                build_resources={"Iron": 90, "Coal": 70, "Copper": 50},
                upkeep_cash=5000.0,
                requires_power=True,
                requires_tech=500,
                resource_production_bonus=0.10,
                improvement_upkeep_bonus=-0.03
            ),
            ImprovementType.ADVANCED_REFINERY: Improvement(
                name="Advanced Refinery",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="+20% production of one chosen resource nation-wide. Requires power + 1,000 tech.",
                cash_cost=9000.0,
                build_resources={"Iron": 100, "Lead": 70, "Copper": 50},
                upkeep_cash=12000.0,
                requires_power=True,
                requires_tech=1000,
                resource_production_bonus=0.20
            ),
            ImprovementType.NATIONAL_HARBOR: Improvement(
                name="National Harbor",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="Required for naval units. Enables selling resources on Global Market. Trade income +5%.",
                cash_cost=8000.0,
                build_resources={"Timber": 90, "Iron": 70, "Limestone": 50},
                upkeep_cash=3000.0,
                trade_income_bonus=0.05,
                ship_upkeep_bonus=-0.05,
                enables_global_market=True
            ),
            ImprovementType.MERCHANT_EXCHANGE: Improvement(
                name="Merchant Exchange",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="Resource production +7%, trade income +5%. Requires Harbor.",
                cash_cost=7000.0,
                build_resources={"Timber": 80, "Limestone": 70, "Gold": 50},
                upkeep_cash=10000.0,
                requires_improvement="National Harbor",
                resource_production_bonus=0.07,
                trade_income_bonus=0.05
            ),
            ImprovementType.NATIONAL_WAREHOUSE: Improvement(
                name="National Warehouse",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="Stockpile capacity ×2 for all resources. Prevents overflow waste.",
                cash_cost=6000.0,
                build_resources={"Timber": 80, "Limestone": 70},
                upkeep_cash=2000.0,
                stockpile_capacity_multiplier=2.0
            ),
            ImprovementType.IRRIGATION_NETWORK: Improvement(
                name="Irrigation Network",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="Agricultural resource production +20% nation-wide.",
                cash_cost=6500.0,
                build_resources={"Timber": 85, "Limestone": 60, "Copper": 50},
                upkeep_cash=1500.0,
                agricultural_production_bonus=0.20
            ),
            ImprovementType.MINING_NETWORK: Improvement(
                name="Mining Network",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="Industrial/Refined resource production +25% nation-wide. Requires power.",
                cash_cost=7500.0,
                build_resources={"Iron": 100, "Coal": 80, "Timber": 60},
                upkeep_cash=4000.0,
                requires_power=True,
                industrial_production_bonus=0.25
            ),
            ImprovementType.STRATEGIC_MINING_FACILITY: Improvement(
                name="Strategic Mining Facility",
                category=ImprovementCategory.TRADE_RESOURCE,
                description="Strategic resource production +40% nation-wide. Requires power + 800 tech.",
                cash_cost=10000.0,
                build_resources={"Iron": 100, "Copper": 80, "Lead": 70},
                upkeep_cash=20000.0,
                requires_power=True,
                requires_tech=800,
                strategic_production_bonus=0.40,
                technology_cost_bonus=-0.03
            ),
            # Civil Improvements (removed - converted to projects)
            # Commerce Improvements (removed - converted to projects)
            # Military Improvements - Soldiers
            ImprovementType.TRAINING_GROUNDS: Improvement(
                name="Training Grounds",
                category=ImprovementCategory.MILITARY,
                description="Basic military training. Soldier efficiency +5%.",
                cash_cost=3000.0,
                build_resources={"Timber": 50, "Iron": 30},
                upkeep_cash=500.0,
                requires_infrastructure=0,
                max_count=5,
                soldier_efficiency_bonus=0.05
            ),
            ImprovementType.BARRACKS: Improvement(
                name="Barracks",
                category=ImprovementCategory.MILITARY,
                description="Military training infrastructure. Soldier efficiency +10%. Requires 50 tech.",
                cash_cost=5000.0,
                build_resources={"Timber": 70, "Iron": 50},
                upkeep_cash=1000.0,
                requires_infrastructure=500,
                requires_tech=50,
                max_count=5,
                soldier_efficiency_bonus=0.10
            ),
            ImprovementType.ARMORY: Improvement(
                name="Armory",
                category=ImprovementCategory.MILITARY,
                description="Combat readiness infrastructure. Soldier efficiency +20%, soldier upkeep -6%. Requires 100 tech.",
                cash_cost=8000.0,
                build_resources={"Timber": 85, "Iron": 70},
                upkeep_cash=2000.0,
                requires_infrastructure=1000,
                requires_tech=100,
                max_count=5,
                soldier_efficiency_bonus=0.20,
                soldier_upkeep_bonus=-0.06
            ),
            ImprovementType.MILITARY_ACADEMY: Improvement(
                name="Military Academy",
                category=ImprovementCategory.MILITARY,
                description="Advanced military training. Soldier efficiency +35%, soldier upkeep -8%. Requires power + 200 tech.",
                cash_cost=12000.0,
                build_resources={"Timber": 95, "Iron": 80, "Limestone": 60},
                upkeep_cash=3500.0,
                requires_infrastructure=1500,
                requires_power=True,
                requires_tech=200,
                max_count=5,
                soldier_efficiency_bonus=0.35,
                soldier_upkeep_bonus=-0.08
            ),
            ImprovementType.SPECIAL_FORCES_HQ: Improvement(
                name="Special Forces HQ",
                category=ImprovementCategory.MILITARY,
                description="Elite special forces training. Soldier efficiency +55%, soldier upkeep -10%. Requires power + 500 tech.",
                cash_cost=20000.0,
                build_resources={"Timber": 100, "Iron": 85, "Limestone": 70},
                upkeep_cash=6000.0,
                requires_infrastructure=2000,
                requires_power=True,
                requires_tech=500,
                max_count=5,
                soldier_efficiency_bonus=0.55,
                soldier_upkeep_bonus=-0.10
            ),
            # Military Improvements - Tanks
            ImprovementType.TANK_WORKSHOP: Improvement(
                name="Tank Workshop",
                category=ImprovementCategory.MILITARY,
                description="Basic tank production. Tank efficiency +5%. Requires 50 tech.",
                cash_cost=4000.0,
                build_resources={"Iron": 60, "Coal": 45, "Oil": 35},
                upkeep_cash=1000.0,
                requires_infrastructure=500,
                requires_tech=50,
                max_count=5,
                tank_efficiency_bonus=0.05
            ),
            ImprovementType.TANK_FACTORY: Improvement(
                name="Tank Factory",
                category=ImprovementCategory.MILITARY,
                description="Tank manufacturing infrastructure. Tank efficiency +10%, tank cost -8%. Requires 150 tech.",
                cash_cost=7000.0,
                build_resources={"Iron": 85, "Coal": 70, "Oil": 55},
                upkeep_cash=2500.0,
                requires_infrastructure=1000,
                requires_tech=150,
                max_count=5,
                tank_efficiency_bonus=0.10,
                tank_cost_bonus=-0.08
            ),
            ImprovementType.WEAPONS_FORGE: Improvement(
                name="Weapons Forge",
                category=ImprovementCategory.MILITARY,
                description="Weapons development infrastructure. Tank efficiency +20%, tank cost -12%. Requires 300 tech.",
                cash_cost=11000.0,
                build_resources={"Iron": 95, "Titanium": 75, "Lead": 60},
                upkeep_cash=5000.0,
                requires_infrastructure=1500,
                requires_tech=300,
                max_count=5,
                tank_efficiency_bonus=0.20,
                tank_cost_bonus=-0.12
            ),
            ImprovementType.ARMOR_FOUNDRY: Improvement(
                name="Armor Foundry",
                category=ImprovementCategory.MILITARY,
                description="Advanced armor infrastructure. Tank efficiency +35%, tank cost -15%. Requires 450 tech.",
                cash_cost=16000.0,
                build_resources={"Iron": 100, "Titanium": 85, "Lead": 75},
                upkeep_cash=9000.0,
                requires_infrastructure=2000,
                requires_tech=450,
                max_count=5,
                tank_efficiency_bonus=0.35,
                tank_cost_bonus=-0.15
            ),
            ImprovementType.ADVANCED_TANK_PLANT: Improvement(
                name="Advanced Tank Plant",
                category=ImprovementCategory.MILITARY,
                description="State-of-the-art tank production. Tank efficiency +55%, tank cost -20%. Requires power + 500 tech.",
                cash_cost=25000.0,
                build_resources={"Iron": 100, "Titanium": 95, "Lead": 85},
                upkeep_cash=15000.0,
                requires_infrastructure=2500,
                requires_power=True,
                requires_tech=500,
                max_count=5,
                tank_efficiency_bonus=0.55,
                tank_cost_bonus=-0.20
            ),
            # Military Improvements - Aircraft
            ImprovementType.AIRFIELD: Improvement(
                name="Airfield",
                category=ImprovementCategory.MILITARY,
                description="Basic aviation infrastructure. Aircraft efficiency +5%. Requires 100 tech.",
                cash_cost=5000.0,
                build_resources={"Iron": 60, "Limestone": 45, "Oil": 35},
                upkeep_cash=1200.0,
                requires_infrastructure=500,
                requires_tech=100,
                max_count=5,
                aircraft_efficiency_bonus=0.05
            ),
            ImprovementType.AIR_FORCE_BASE: Improvement(
                name="Air Force Base",
                category=ImprovementCategory.MILITARY,
                description="Air force infrastructure. Aircraft efficiency +10%, dogfight bonus +8%. Requires 300 tech.",
                cash_cost=9000.0,
                build_resources={"Iron": 90, "Titanium": 70, "Lead": 55},
                upkeep_cash=3000.0,
                requires_infrastructure=1000,
                requires_tech=300,
                max_count=5,
                aircraft_efficiency_bonus=0.10,
                dogfight_bonus=0.08
            ),
            ImprovementType.ADVANCED_AVIATION_HUB: Improvement(
                name="Advanced Aviation Hub",
                category=ImprovementCategory.MILITARY,
                description="Advanced aviation infrastructure. Aircraft efficiency +20%, aircraft cost -10%. Requires 600 tech.",
                cash_cost=14000.0,
                build_resources={"Iron": 95, "Titanium": 85, "Lead": 75},
                upkeep_cash=6000.0,
                requires_infrastructure=1500,
                requires_tech=600,
                max_count=5,
                aircraft_efficiency_bonus=0.20,
                aircraft_cost_bonus=-0.10
            ),
            ImprovementType.STEALTH_FIGHTER_BASE: Improvement(
                name="Stealth Fighter Base",
                category=ImprovementCategory.MILITARY,
                description="Stealth technology infrastructure. Aircraft efficiency +35%, aircraft cost -15%. Requires 1000 tech.",
                cash_cost=20000.0,
                build_resources={"Titanium": 95, "Lead": 90, "Copper": 80},
                upkeep_cash=10000.0,
                requires_infrastructure=2000,
                requires_tech=1000,
                max_count=5,
                aircraft_efficiency_bonus=0.35,
                aircraft_cost_bonus=-0.15
            ),
            ImprovementType.SUPERSONIC_COMMAND: Improvement(
                name="Supersonic Command",
                category=ImprovementCategory.MILITARY,
                description="Top-tier air infrastructure. Aircraft efficiency +55%, aircraft cost -20%. Requires 1500 tech.",
                cash_cost=30000.0,
                build_resources={"Titanium": 100, "Lead": 95, "Copper": 95},
                upkeep_cash=18000.0,
                requires_infrastructure=2500,
                requires_tech=1500,
                max_count=5,
                aircraft_efficiency_bonus=0.55,
                aircraft_cost_bonus=-0.20
            ),
            # Military Improvements - Ships
            ImprovementType.DOCK: Improvement(
                name="Drydock",
                category=ImprovementCategory.MILITARY,
                description="Basic naval infrastructure. Ship efficiency +5%. Requires 50 tech.",
                cash_cost=4000.0,
                build_resources={"Iron": 55, "Timber": 50, "Limestone": 40},
                upkeep_cash=1500.0,
                requires_infrastructure=500,
                requires_tech=50,
                max_count=5,
                ship_efficiency_bonus=0.05
            ),
            ImprovementType.NAVAL_BASE: Improvement(
                name="Naval Base",
                category=ImprovementCategory.MILITARY,
                description="Fleet infrastructure. Ship efficiency +10%, ship purchase +2/tick. Requires 200 tech.",
                cash_cost=8000.0,
                build_resources={"Iron": 80, "Limestone": 65, "Titanium": 50},
                upkeep_cash=5000.0,
                requires_infrastructure=1000,
                requires_tech=200,
                max_count=5,
                ship_efficiency_bonus=0.10,
                ship_purchase_per_tick=2.0
            ),
            ImprovementType.ADVANCED_SHIPYARD: Improvement(
                name="Advanced Shipyard",
                category=ImprovementCategory.MILITARY,
                description="Advanced shipbuilding infrastructure. Ship efficiency +20%, ship cost -12%. Requires 400 tech.",
                cash_cost=14000.0,
                build_resources={"Iron": 95, "Titanium": 80, "Lead": 65},
                upkeep_cash=9000.0,
                requires_infrastructure=1500,
                requires_tech=400,
                max_count=5,
                ship_efficiency_bonus=0.20,
                ship_cost_bonus=-0.12
            ),
            ImprovementType.NAVAL_ACADEMY: Improvement(
                name="Naval Academy",
                category=ImprovementCategory.MILITARY,
                description="Naval training infrastructure. Ship efficiency +35%, ship cost -15%. Requires 700 tech.",
                cash_cost=22000.0,
                build_resources={"Titanium": 95, "Lead": 90, "Copper": 80},
                upkeep_cash=15000.0,
                requires_infrastructure=2000,
                requires_tech=700,
                max_count=5,
                ship_efficiency_bonus=0.35,
                ship_cost_bonus=-0.15
            ),
            ImprovementType.FLEET_COMMAND: Improvement(
                name="Fleet Command",
                category=ImprovementCategory.MILITARY,
                description="Top-tier naval infrastructure. Ship efficiency +55%, ship cost -20%. Requires 1000 tech.",
                cash_cost=35000.0,
                build_resources={"Titanium": 100, "Lead": 95, "Copper": 95},
                upkeep_cash=25000.0,
                requires_infrastructure=2500,
                requires_tech=1000,
                max_count=5,
                ship_efficiency_bonus=0.55,
                ship_cost_bonus=-0.20
            ),
            # Special Military Improvements
            ImprovementType.MISSILE_BATTERY: Improvement(
                name="Missile Battery",
                category=ImprovementCategory.MILITARY,
                description="Enables cruise missiles. +1 missile cap per battery. Requires power + 800 tech.",
                cash_cost=9000.0,
                build_resources={"Iron": 90, "Titanium": 70, "Lead": 60},
                upkeep_cash=20000.0,
                requires_power=True,
                requires_tech=800,
                enables_missiles=True,
                missile_cap_bonus=1
            ),
            ImprovementType.NUCLEAR_SILO: Improvement(
                name="Nuclear Silo",
                category=ImprovementCategory.MILITARY,
                description="Enables nuclear weapons. +1 nuke cap per silo. Requires Manhattan Project + 2,000 tech.",
                cash_cost=10000.0,
                build_resources={"Iron": 100, "Uranium": 95, "Titanium": 80},
                upkeep_cash=40000.0,
                requires_power=True,
                requires_tech=2000,
                requires_project="Manhattan Project",
                enables_nuclear_weapons=True,
                nuke_cap_bonus=1
            ),
            ImprovementType.INTELLIGENCE_HQ: Improvement(
                name="Intelligence HQ",
                category=ImprovementCategory.MILITARY,
                description="Intelligence infrastructure. +15 spy capacity, spy success +10%. Requires power + 300 tech.",
                cash_cost=8500.0,
                build_resources={"Iron": 90, "Limestone": 75, "Copper": 65},
                upkeep_cash=9000.0,
                requires_power=True,
                requires_tech=300,
                spy_capacity_bonus=15,
                spy_success_bonus=0.10
            ),
            ImprovementType.PROPAGANDA_BUREAU: Improvement(
                name="Propaganda Bureau",
                category=ImprovementCategory.MILITARY,
                description="Propaganda infrastructure. War happiness penalty -25%, enemy spy success -10%. Requires power.",
                cash_cost=7500.0,
                build_resources={"Limestone": 85, "Timber": 75, "Spices": 60},
                upkeep_cash=2500.0,
                requires_power=True,
                war_happiness_penalty_reduction=0.25,
                enemy_spy_success_bonus=-0.10
            ),
            ImprovementType.FORTIFICATIONS: Improvement(
                name="Fortifications",
                category=ImprovementCategory.MILITARY,
                description="Defense infrastructure. City resistance +15, infrastructure war damage -10%.",
                cash_cost=8000.0,
                build_resources={"Iron": 95, "Limestone": 85, "Timber": 70},
                upkeep_cash=3000.0,
                city_resistance_bonus=15.0,
                infrastructure_war_damage_bonus=-0.10
            ),
        }

    def get_improvement(self, improvement_type: ImprovementType) -> Improvement:
        """Get an improvement by type."""
        return self.improvements[improvement_type]

    def get_all_improvements(self) -> list:
        """Get all available improvements."""
        return list(self.improvements.values())

    def get_improvements_by_category(self, category: ImprovementCategory) -> list:
        """Get all improvements of a specific category."""
        return [imp for imp in self.improvements.values() if imp.category == category]
    
    def get_destroy_refund(self, improvement_type: ImprovementType) -> tuple:
        """
        Calculate the refund amount for destroying an improvement.
        Returns (cash_refund, resource_refund) where resource_refund is a dict of resource: amount.
        Refund is 50% of the original cost.
        """
        improvement = self.get_improvement(improvement_type)
        cash_refund = improvement.cash_cost * 0.5
        resource_refund = {resource: amount * 0.5 for resource, amount in improvement.build_resources.items()}
        return cash_refund, resource_refund


# Singleton instance
improvement_system = ImprovementSystem()
