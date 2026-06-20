"""
Wonder System for Sovereign Nation Game

This module defines the Wonder components that provide
powerful nation-wide bonuses and unique capabilities.
"""

from dataclasses import dataclass
from typing import Dict, Optional
from enum import Enum


class WonderCategory(Enum):
    """Categories of wonders."""
    RESOURCE_PRODUCTION = "Resource Production"
    POWER = "Power"
    ECONOMIC = "Economic"
    MILITARY = "Military"
    SPACE = "Space"
    SOCIAL = "Social"
    CIVIL = "Civil"


class WonderType(Enum):
    """All available wonder types in the game."""
    # Resource Production Wonders (27)
    GRAIN_SILOS = "Grain Silos"
    LUMBER_MILL = "Lumber Mill"
    FISHING_FLEET = "Fishing Fleet"
    RANCH_COMPLEX = "Ranch Complex"
    COAL_MINE = "Coal Mine"
    IRON_MINE = "Iron Mine"
    COPPER_MINE = "Copper Mine"
    QUARRY = "Quarry"
    OIL_WELL = "Oil Well"
    LEAD_MINE = "Lead Mine"
    COTTON_GIN = "Cotton Gin"
    SPICE_GARDEN = "Spice Garden"
    RUBBER_PLANTATION = "Rubber Plantation"
    DYE_WORKS = "Dye Works"
    SILK_FARM = "Silk Farm"
    HERB_GARDEN = "Herb Garden"
    GOLD_MINE = "Gold Mine"
    SILVER_MINE = "Silver Mine"
    GEMSTONE_MINE = "Gemstone Mine"
    BAUXITE_MINE = "Bauxite Mine"
    TITANIUM_MINE = "Titanium Mine"
    TUNGSTEN_MINE = "Tungsten Mine"
    COBALT_MINE = "Cobalt Mine"
    LITHIUM_MINE = "Lithium Mine"
    URANIUM_ENRICHMENT = "Uranium Enrichment"
    AQUEDUCT_SYSTEM = "Aqueduct System"
    
    # Power Wonders
    FUSION_PLANT = "Fusion Plant"
    
    # Economic Wonders (26)
    AGRICULTURE_DEVELOPMENT_PROGRAM = "Agriculture Development Program"
    CENTRAL_BANK = "Central Bank"
    GRAND_MONUMENT = "Grand Monument"
    NATIONAL_TRADE_CENTER = "National Trade Center"
    WORLD_STOCK_MARKET = "World Stock Market"
    INTERNET_SUPERHIGHWAY = "Internet Superhighway"
    ARTIFICIAL_INTELLIGENCE = "Artificial Intelligence"
    QUANTUM_COMPUTING = "Quantum Computing"
    GENETIC_ENGINEERING = "Genetic Engineering"
    NANOTECHNOLOGY = "Nanotechnology"
    ADVANCED_MATERIALS = "Advanced Materials"
    SPACE_AGENCY = "Space Agency"
    DISASTER_RELIEF_AGENCY = "Disaster Relief Agency"
    NATIONAL_RESEARCH_COMPLEX = "National Research Complex"
    GREAT_TEMPLE = "Great Temple"
    GRAND_CATHEDRAL = "Grand Cathedral"
    GRAND_MOSQUE = "Grand Mosque"
    GREAT_SYNAGOGUE = "Great Synagogue"
    GRAND_PAGODA = "Grand Pagoda"
    GREAT_SHRINE = "Great Shrine"
    HINDU_TEMPLE = "Hindu Temple"
    BUDDHIST_TEMPLE = "Buddhist Temple"
    COLOSSEUM = "Colosseum"
    NATIONAL_PARK_SYSTEM_WONDER = "National Park System Wonder"
    CIVIL_ENGINEERING = "Civil Engineering"
    ADVANCED_ENGINEERING = "Advanced Engineering"
    GREEN_TECHNOLOGIES = "Green Technologies"
    TELECOMMUNICATIONS_SATELLITE = "Telecommunications Satellite"
    INTERNATIONAL_AIRPORT_HUB = "International Airport Hub"
    MASS_TRANSIT_NETWORK = "Mass Transit Network"
    UNIVERSAL_BASIC_INCOME = "Universal Basic Income"
    FREE_TRADE_AGREEMENT = "Free Trade Agreement"
    RESOURCE_NATIONALIZATION = "Resource Nationalization"
    EXPORT_SUBSIDIES = "Export Subsidies"
    UNIVERSAL_HEALTHCARE = "Universal Healthcare"
    PUBLIC_EDUCATION_SYSTEM = "Public Education System"
    FREE_PRESS = "Free Press"
    PRISON_SYSTEM = "Prison System"
    DISEASE_CONTROL_CENTER = "Disease Control Center"
    ENVIRONMENTAL_PROTECTION_AGENCY = "Environmental Protection Agency"
    COMMUNITY_POLITIZATION = "Community Policing"
    PUBLIC_HEALTH_INITIATIVE = "Public Health Initiative"
    GREEN_NEW_DEAL = "Green New Deal"
    TAX_OPTIMIZATION_BUREAU = "Tax Optimization Bureau"
    PROGRESSIVE_TAX_SYSTEM = "Progressive Tax System"
    TAX_HARMONY_INITIATIVE = "Tax Harmony Initiative"
    
    # Military Wonders (22)
    PENTAGON = "Pentagon"
    STRATEGIC_DEFENSE_INITIATIVE = "Strategic Defense Initiative"
    WEAPONS_RESEARCH_COMPLEX = "Weapons Research Complex"
    MILITARY_SATELLITE = "Military Satellite"
    FORTIFIED_CITADEL = "Fortified Citadel"
    GRAND_NAVAL_SHIPYARD = "Grand Naval Shipyard"
    AIR_DEFENSE_NETWORK = "Air Defense Network"
    NUCLEAR_ARSENAL = "Nuclear Arsenal"
    MISSILE_COMMAND_CENTER = "Missile Command Center"
    NUCLEAR_RESEARCH_FACILITY = "Nuclear Research Facility"
    CYBER_COMMAND_CENTER = "Cyber Command Center"
    SPECIAL_OPERATIONS_HQ = "Special Operations HQ"
    PROPAGANDA_MINISTRY = "Propaganda Ministry"
    IRON_CURTAIN = "Iron Curtain"
    ARMS_STOCKPILE = "Arms Stockpile"
    RAPID_DEPLOYMENT_FORCE = "Rapid Deployment Force"
    IRON_DOME = "Iron Dome"
    MISSILE_DEFENSE_SYSTEM = "Missile Defense System"
    STRATEGIC_RESERVE = "Strategic Reserve"
    ADVANCED_MISSILE_SHIELD = "Advanced Missile Shield"
    NUCLEAR_DETERRENT_ARRAY = "Nuclear Deterrent Array"
    
    # Space Wonders (4)
    MOON_LANDING = "Moon Landing"
    MOON_BASE = "Moon Base"
    MARS_COLONY = "Mars Colony"
    ORBITAL_PLATFORM = "Orbital Platform"


@dataclass
class Wonder:
    """Wonder with costs, requirements, and effects."""
    name: str
    category: WonderCategory  # Category of wonder
    description: str  # Flavor text describing the wonder
    # Costs
    cash_cost: float  # Cash cost to build
    build_resources: Dict[str, int]  # Resources required to build
    upkeep_cash: float  # Cash upkeep per tick
    # Requirements
    requires_land: int = 0  # Land required
    requires_infrastructure: int = 0  # Infrastructure required
    requires_tech: int = 0  # Technology level required
    requires_project: Optional[str] = None  # Project required
    requires_improvement: Optional[str] = None  # Improvement required
    requires_wonder: Optional[str] = None  # Other wonder required
    requires_government: Optional[str] = None  # Government type required
    requires_religion: Optional[str] = None  # Religion type required
    requires_resource: Optional[str] = None  # Resource required
    # Effects
    # Resource production effects
    resource_production_bonus: float = 0.0  # Percentage bonus to resource production
    unlocks_resource: Optional[str] = None  # Unlocks a specific resource
    # Economic effects
    citizen_income_bonus: float = 0.0  # Direct bonus to citizen income
    max_tax_rate_bonus: float = 0.0  # Bonus to maximum allowed tax rate
    tax_happiness_penalty_reduction: int = 0  # Reduction in happiness penalty from high taxes
    tax_income_bonus: float = 0.0  # Percentage bonus to tax income
    commerce_income_per_citizen: float = 0.0  # Commerce income per citizen
    commerce_income_bonus: float = 0.0  # Percentage bonus to commerce income
    trade_income_bonus: float = 0.0  # Percentage bonus to trade income
    bank_interest_bonus: float = 0.0  # Percentage bonus to bank interest
    literacy_bonus: float = 0.0  # Bonus to literacy rate (0-100 scale)
    tourism_income_per_citizen: float = 0.0  # Tourism income per citizen
    # Population effects
    citizen_percentage_bonus: float = 0.0  # Percentage bonus to citizens
    land_bonus: float = 0.0  # Percentage bonus to land
    population_growth_bonus: float = 0.0  # Percentage bonus to population growth
    happiness_bonus: int = 0  # Direct happiness modifier
    # Health effects
    disease_bonus: float = 0.0  # Disease per city (can be negative for reduction)
    hospital_effectiveness_bonus: float = 0.0  # Percentage bonus to hospital effectiveness
    crime_bonus: float = 0.0  # Crime per city (can be negative for reduction)
    # Environmental effects
    pollution_bonus: float = 0.0  # Pollution per city (can be negative for reduction)
    environment_bonus: float = 0.0  # Environment bonus
    # Cost effects
    infrastructure_cost_bonus: float = 0.0  # Percentage bonus to infrastructure cost (negative = cheaper)
    improvement_build_cost_bonus: float = 0.0  # Percentage bonus to improvement build cost (negative = cheaper)
    wonder_build_cost_bonus: float = 0.0  # Percentage bonus to wonder build cost (negative = cheaper)
    new_city_cost_bonus: float = 0.0  # Percentage bonus to new city cost (negative = cheaper)
    improvement_upkeep_bonus: float = 0.0  # Percentage bonus to improvement upkeep (negative = cheaper)
    military_upkeep_bonus: float = 0.0  # Percentage bonus to military upkeep (negative = cheaper)
    soldier_upkeep_bonus: float = 0.0  # Percentage bonus to soldier upkeep (negative = cheaper)
    # Technology effects
    technology_cost_bonus: float = 0.0  # Percentage bonus to technology cost (negative = cheaper)
    # Military efficiency effects
    soldier_efficiency_bonus: float = 0.0  # Percentage bonus to soldier efficiency
    tank_efficiency_bonus: float = 0.0  # Percentage bonus to tank efficiency
    aircraft_efficiency_bonus: float = 0.0  # Percentage bonus to aircraft efficiency
    ship_efficiency_bonus: float = 0.0  # Percentage bonus to ship efficiency
    all_military_efficiency_bonus: float = 0.0  # Percentage bonus to all military efficiency
    military_unit_damage_bonus: float = 0.0  # Percentage bonus to military unit damage
    military_unit_cap_bonus: float = 0.0  # Percentage bonus to military unit cap
    # Military cost effects
    tank_cost_bonus: float = 0.0  # Percentage bonus to tank cost (negative = cheaper)
    aircraft_cost_bonus: float = 0.0  # Percentage bonus to aircraft cost (negative = cheaper)
    ship_cost_bonus: float = 0.0  # Percentage bonus to ship cost (negative = cheaper)
    ship_purchase_per_tick: float = 0.0  # Additional ship purchases per tick
    tank_upkeep_bonus: float = 0.0  # Percentage bonus to tank upkeep (negative = cheaper)
    aircraft_upkeep_bonus: float = 0.0  # Percentage bonus to aircraft upkeep (negative = cheaper)
    ship_upkeep_bonus: float = 0.0  # Percentage bonus to ship upkeep (negative = cheaper)
    # Military capacity effects
    missile_cap_bonus: int = 0  # Bonus to missile cap
    nuke_cap_bonus: int = 0  # Bonus to nuke cap
    # Defense effects
    spy_defense_bonus: float = 0.0  # Percentage bonus to spy defense
    spy_success_bonus: float = 0.0  # Percentage bonus to spy success
    enemy_spy_success_bonus: float = 0.0  # Percentage bonus to enemy spy success (negative = reduction)
    spy_operations_bonus: float = 0.0  # Percentage bonus to spy operations
    city_resistance_bonus: float = 0.0  # Bonus to city resistance
    # War effects
    war_happiness_penalty_reduction: float = 0.0  # Percentage reduction to war happiness penalty
    war_happiness_penalty_removed: bool = False  # Whether war happiness penalty is removed
    infrastructure_war_damage_bonus: float = 0.0  # Percentage bonus to infrastructure war damage (negative = reduction)
    airstrike_damage_bonus: float = 0.0  # Percentage bonus to airstrike damage (negative = reduction)
    aircraft_losses_in_defense_bonus: float = 0.0  # Percentage bonus to aircraft losses in defense (negative = reduction)
    missile_damage_bonus: float = 0.0  # Percentage bonus to missile damage
    nuke_damage_bonus: float = 0.0  # Percentage bonus to nuke damage
    missile_intercept_chance_bonus: float = 0.0  # Percentage bonus to missile intercept chance
    nuke_intercept_chance_bonus: float = 0.0  # Percentage bonus to nuke intercept chance
    ground_attack_bonus: float = 0.0  # Percentage bonus to ground attack
    naval_surprise_attack_bonus: float = 0.0  # Percentage bonus to naval surprise attack
    # Disaster effects
    disaster_damage_bonus: float = 0.0  # Percentage bonus to disaster damage (negative = reduction)
    recovery_time_bonus: float = 0.0  # Percentage bonus to recovery time (negative = faster)
    infrastructure_repair_bonus: float = 0.0  # Multiplier for infrastructure repair speed
    # Special effects
    religion_mismatch_penalty_removed: bool = False  # Whether religion mismatch penalty is removed
    sports_arena_income_doubled: bool = False  # Whether sports arena income is doubled
    border_walls_effect_doubled: bool = False  # Whether border walls effect is doubled
    power_plant_pollution_bonus: float = 0.0  # Percentage bonus to power plant pollution (negative = reduction)
    wind_solar_power_slots: int = 0  # Additional wind/solar power slots
    enables_missiles: bool = False  # Whether wonder enables missile capability
    enables_nuclear_weapons: bool = False  # Whether wonder enables nuclear weapons
    enables_submarine_units: bool = False  # Whether wonder enables submarine units
    enables_bio_weapon: bool = False  # Whether wonder enables bio-weapon attack
    enables_chemical_attack: bool = False  # Whether wonder enables chemical attack
    enables_infrastructure_hack: bool = False  # Whether wonder enables infrastructure hack
    enables_spy_drone_ops: bool = False  # Whether wonder enables spy drone ops
    soldier_purchase_speed_bonus: float = 0.0  # Multiplier for soldier purchase speed
    stockpile_capacity_multiplier: float = 1.0  # Multiplier for stockpile capacity
    prestige_bonus: int = 0  # Bonus to prestige
    # Power effects
    power_plant_slots: int = 0  # Additional power plant slots
    eliminates_power_requirements: bool = False  # Whether wonder eliminates all power requirements nation-wide
    # Special unlocks
    unlocks_moon_mars_wonders: bool = False  # Whether wonder unlocks Moon/Mars wonders
    military_satellite_effect_doubled: bool = False  # Whether military satellite effect is doubled

    def __post_init__(self):
        """Initialize None dicts to empty dicts."""

    def __str__(self) -> str:
        return self.name


class WonderSystem:
    """System for managing wonder types and their effects."""

    def __init__(self):
        self.wonders: Dict[WonderType, Wonder] = self._initialize_wonders()

    def _initialize_wonders(self) -> Dict[WonderType, Wonder]:
        """Initialize all wonder types with their data."""
        return {
            # Resource Production Wonders (27)
            WonderType.GRAIN_SILOS: Wonder(
                name="Grain Silos",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Massive grain storage and processing facilities. Increases grain production by 50%.",
                cash_cost=15000000.0,
                build_resources={"Timber": 100, "Limestone": 50},
                upkeep_cash=2500.0,
                requires_land=2000,
                requires_tech=300,
                resource_production_bonus=0.50
            ),
            WonderType.LUMBER_MILL: Wonder(
                name="Lumber Mill",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Advanced lumber processing facilities. Increases timber production by 50%.",
                cash_cost=12000000.0,
                build_resources={"Timber": 8000, "Iron": 6000},
                upkeep_cash=2000.0,
                requires_land=1500,
                requires_tech=200,
                resource_production_bonus=0.50
            ),
            WonderType.FISHING_FLEET: Wonder(
                name="Fishing Fleet",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Massive fishing operations. Increases fish production by 50%.",
                cash_cost=10000000.0,
                build_resources={"Timber": 7500, "Oil": 5500},
                upkeep_cash=1800.0,
                requires_improvement="National Harbor",
                requires_tech=200,
                resource_production_bonus=0.50
            ),
            WonderType.RANCH_COMPLEX: Wonder(
                name="Ranch Complex",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Large-scale livestock operations. Increases livestock production by 50%.",
                cash_cost=12000000.0,
                build_resources={"Timber": 8000, "Grain": 6000},
                upkeep_cash=2000.0,
                requires_land=1500,
                requires_tech=200,
                resource_production_bonus=0.50
            ),
            WonderType.COAL_MINE: Wonder(
                name="Coal Mine",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Deep coal mining operations. Increases coal production by 50%.",
                cash_cost=18000000.0,
                build_resources={"Iron": 8500, "Timber": 6500},
                upkeep_cash=2500.0,
                requires_land=1500,
                requires_tech=300,
                resource_production_bonus=0.50
            ),
            WonderType.IRON_MINE: Wonder(
                name="Iron Mine",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Massive iron mining operations. Increases iron production by 50%.",
                cash_cost=20000000.0,
                build_resources={"Iron": 9000, "Limestone": 7000},
                upkeep_cash=3000.0,
                requires_land=1500,
                requires_tech=350,
                resource_production_bonus=0.50
            ),
            WonderType.COPPER_MINE: Wonder(
                name="Copper Mine",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Advanced copper mining. Increases copper production by 50%.",
                cash_cost=22000000.0,
                build_resources={"Iron": 9500, "Coal": 7500},
                upkeep_cash=3500.0,
                requires_land=1500,
                requires_tech=400,
                resource_production_bonus=0.50
            ),
            WonderType.QUARRY: Wonder(
                name="Quarry",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Massive limestone quarry. Increases limestone production by 50%.",
                cash_cost=15000000.0,
                build_resources={"Iron": 8500, "Timber": 6500},
                upkeep_cash=2500.0,
                requires_land=1500,
                requires_tech=300,
                resource_production_bonus=0.50
            ),
            WonderType.OIL_WELL: Wonder(
                name="Oil Well",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Advanced oil drilling operations. Increases oil production by 50%.",
                cash_cost=25000000.0,
                build_resources={"Iron": 9000, "Limestone": 7500},
                upkeep_cash=4000.0,
                requires_land=1500,
                requires_tech=450,
                resource_production_bonus=0.50
            ),
            WonderType.LEAD_MINE: Wonder(
                name="Lead Mine",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Lead mining operations. Increases lead production by 50%.",
                cash_cost=18000000.0,
                build_resources={"Iron": 8500, "Coal": 6500},
                upkeep_cash=3000.0,
                requires_land=1500,
                requires_tech=350,
                resource_production_bonus=0.50
            ),
            WonderType.SPICE_GARDEN: Wonder(
                name="Spice Garden",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Massive spice cultivation. Increases spices production by 50%.",
                cash_cost=16000000.0,
                build_resources={"Timber": 8500, "Fish": 7000},
                upkeep_cash=2400.0,
                requires_land=1500,
                requires_tech=280,
                resource_production_bonus=0.50
            ),
            WonderType.GEMSTONE_MINE: Wonder(
                name="Gemstone Mine",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Gemstone mining operations. Increases gemstones production by 50%.",
                cash_cost=35000000.0,
                build_resources={"Iron": 10000, "Limestone": 8500},
                upkeep_cash=5000.0,
                requires_land=1500,
                requires_tech=550,
                resource_production_bonus=0.50
            ),
            WonderType.TITANIUM_MINE: Wonder(
                name="Titanium Mine",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Titanium mining operations. Increases titanium production by 50%.",
                cash_cost=40000000.0,
                build_resources={"Iron": 10000, "Coal": 8000},
                upkeep_cash=6000.0,
                requires_land=1500,
                requires_tech=600,
                resource_production_bonus=0.50
            ),
            WonderType.URANIUM_ENRICHMENT: Wonder(
                name="Uranium Enrichment",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Uranium enrichment facilities. Increases uranium production by 50%.",
                cash_cost=50000000.0,
                build_resources={"Iron": 10000, "Lead": 8500},
                upkeep_cash=8000.0,
                requires_resource="Uranium",
                requires_tech=700,
                resource_production_bonus=0.50
            ),
            WonderType.AQUEDUCT_SYSTEM: Wonder(
                name="Aqueduct System",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Massive water infrastructure. Unlocks Water resource and increases water production by 50%.",
                cash_cost=45000000.0,
                build_resources={"Limestone": 10000, "Iron": 8500},
                upkeep_cash=7000.0,
                requires_land=2500,
                requires_tech=600,
                unlocks_resource="Water",
                resource_production_bonus=0.50
            ),
            WonderType.GOLD_MINE: Wonder(
                name="Gold Mine",
                category=WonderCategory.RESOURCE_PRODUCTION,
                description="Gold mining operations. Increases gold production by 50%.",
                cash_cost=30000000.0,
                build_resources={"Iron": 9500, "Limestone": 8000},
                upkeep_cash=4500.0,
                requires_land=1500,
                requires_tech=500,
                resource_production_bonus=0.50
            ),
            # Power Wonders
            WonderType.FUSION_PLANT: Wonder(
                name="Fusion Plant",
                category=WonderCategory.POWER,
                description="Ultimate fusion power plant. Eliminates all power requirements nation-wide. No pollution, no resource consumption. Requires 5,000 tech.",
                cash_cost=100000000.0,
                build_resources={"Uranium": 10000, "Gold": 9500, "Titanium": 9000, "Lead": 8500},
                upkeep_cash=50000.0,
                requires_tech=5000,
                eliminates_power_requirements=True,
                pollution_bonus=0.0
            ),
            WonderType.AGRICULTURE_DEVELOPMENT_PROGRAM: Wonder(
                name="Agriculture Development Program",
                category=WonderCategory.ECONOMIC,
                description="Massive agricultural investment. Land +15%, citizen income +$2, land citizen bonus ×2.5.",
                cash_cost=30000000.0,
                build_resources={"Grain": 10000, "Timber": 8500, "Limestone": 7500},
                upkeep_cash=5000.0,
                requires_land=3000,
                requires_tech=500,
                land_bonus=0.15,
                citizen_income_bonus=2.0
            ),
            WonderType.CENTRAL_BANK: Wonder(
                name="Central Bank",
                category=WonderCategory.ECONOMIC,
                description="National banking system. Tax income +10%, bank interest +5%.",
                cash_cost=50000000.0,
                build_resources={"Limestone": 10000, "Gold": 9000, "Iron": 8000},
                upkeep_cash=8000.0,
                requires_infrastructure=5000,
                requires_tech=1000,
                tax_income_bonus=0.10,
                bank_interest_bonus=0.05
            ),
            WonderType.GRAND_MONUMENT: Wonder(
                name="Grand Monument",
                category=WonderCategory.ECONOMIC,
                description="National monument to greatness. Happiness +3, tourism income +$1/citizen.",
                cash_cost=20000000.0,
                build_resources={"Limestone": 9500, "Gemstones": 8500, "Gold": 7500},
                upkeep_cash=4000.0,
                requires_infrastructure=2000,
                happiness_bonus=3,
                tourism_income_per_citizen=1.0
            ),
            WonderType.NATIONAL_TRADE_CENTER: Wonder(
                name="National Trade Center",
                category=WonderCategory.ECONOMIC,
                description="Central hub for national trade. Trade income +15%, commerce income +$2/citizen.",
                cash_cost=30000000.0,
                build_resources={"Limestone": 10000, "Iron": 9000, "Gold": 8000},
                upkeep_cash=5000.0,
                requires_improvement="National Harbor",
                requires_tech=1000,
                trade_income_bonus=0.15,
                commerce_income_per_citizen=2.0
            ),
            WonderType.WORLD_STOCK_MARKET: Wonder(
                name="World Stock Market",
                category=WonderCategory.ECONOMIC,
                description="Global stock exchange. Commerce income +$5/citizen, citizen income +$3.",
                cash_cost=40000000.0,
                build_resources={"Limestone": 10000, "Gold": 9000, "Gemstones": 8500},
                upkeep_cash=7000.0,
                requires_tech=2000,
                requires_wonder="Central Bank",
                commerce_income_per_citizen=5.0,
                citizen_income_bonus=3.0
            ),
            WonderType.INTERNET_SUPERHIGHWAY: Wonder(
                name="Internet Superhighway",
                category=WonderCategory.ECONOMIC,
                description="National digital infrastructure. Technology cost -10%, commerce income +$3/citizen.",
                cash_cost=25000000.0,
                build_resources={"Copper": 10000, "Lead": 9000, "Gold": 8000},
                upkeep_cash=5000.0,
                requires_tech=1500,
                technology_cost_bonus=-0.10,
                commerce_income_per_citizen=3.0
            ),
            WonderType.ARTIFICIAL_INTELLIGENCE: Wonder(
                name="Artificial Intelligence",
                category=WonderCategory.ECONOMIC,
                description="Advanced AI systems. Commerce income +$5/citizen, spy success +15%.",
                cash_cost=60000000.0,
                build_resources={"Lead": 10000, "Gold": 9500, "Copper": 9000},
                upkeep_cash=10000.0,
                requires_tech=3000,
                commerce_income_per_citizen=5.0,
                spy_success_bonus=0.15
            ),
            WonderType.QUANTUM_COMPUTING: Wonder(
                name="Quantum Computing",
                category=WonderCategory.ECONOMIC,
                description="Quantum computing breakthrough. Technology cost -20%, all spy operations +20%.",
                cash_cost=80000000.0,
                build_resources={"Lead": 10000, "Gold": 9500, "Titanium": 9000},
                upkeep_cash=12000.0,
                requires_wonder="Artificial Intelligence",
                requires_tech=4000,
                technology_cost_bonus=-0.20,
                spy_operations_bonus=0.20
            ),
            # Economic Wonders (26)
            WonderType.GENETIC_ENGINEERING: Wonder(
                name="Genetic Engineering",
                category=WonderCategory.ECONOMIC,
                description="Advanced genetic research. Population growth +10%, disease -3 nationwide.",
                cash_cost=40000000.0,
                build_resources={"Fish": 10000, "Lead": 9000, "Gold": 8500},
                upkeep_cash=7000.0,
                requires_tech=2000,
                population_growth_bonus=0.10,
                disease_bonus=-3.0
            ),
            WonderType.NANOTECHNOLOGY: Wonder(
                name="Nanotechnology",
                category=WonderCategory.ECONOMIC,
                description="Nanotech applications. Infrastructure repairs 2× faster after war, upkeep -10%.",
                cash_cost=70000000.0,
                build_resources={"Lead": 10000, "Gold": 9500, "Titanium": 9000},
                upkeep_cash=10000.0,
                requires_tech=4000,
                infrastructure_repair_bonus=2.0,
                improvement_upkeep_bonus=-0.10
            ),
            WonderType.ADVANCED_MATERIALS: Wonder(
                name="Advanced Materials",
                category=WonderCategory.ECONOMIC,
                description="Advanced material science. All improvement build costs -10%, wonder build costs -8%.",
                cash_cost=35000000.0,
                build_resources={"Titanium": 10000, "Lead": 9500, "Copper": 9000},
                upkeep_cash=6000.0,
                requires_tech=2500,
                improvement_build_cost_bonus=-0.10,
                wonder_build_cost_bonus=-0.08
            ),
            WonderType.SPACE_AGENCY: Wonder(
                name="Space Agency",
                category=WonderCategory.ECONOMIC,
                description="National space program. Enables Moon/Mars wonders, literacy +12%.",
                cash_cost=75000000.0,
                build_resources={"Iron": 10000, "Titanium": 9500, "Lead": 9000},
                upkeep_cash=12000.0,
                requires_tech=3000,
                unlocks_moon_mars_wonders=True,
                literacy_bonus=12.0
            ),
            WonderType.DISASTER_RELIEF_AGENCY: Wonder(
                name="Disaster Relief Agency",
                category=WonderCategory.ECONOMIC,
                description="National disaster response. Random disaster damage -50%, recovery time halved.",
                cash_cost=15000000.0,
                build_resources={"Timber": 10000, "Limestone": 9500, "Fish": 8500},
                upkeep_cash=3000.0,
                requires_infrastructure=1000,
                disaster_damage_bonus=-0.50,
                recovery_time_bonus=-0.50
            ),
            WonderType.NATIONAL_RESEARCH_COMPLEX: Wonder(
                name="National Research Complex",
                category=WonderCategory.ECONOMIC,
                description="Advanced research facilities. Technology cost -15%, literacy +15%.",
                cash_cost=40000000.0,
                build_resources={"Limestone": 10000, "Lead": 9500, "Gold": 9000},
                upkeep_cash=7000.0,
                requires_tech=2000,
                technology_cost_bonus=-0.15,
                literacy_bonus=15.0
            ),
            WonderType.GREAT_TEMPLE: Wonder(
                name="Great Temple",
                category=WonderCategory.SOCIAL,
                description="National religious monument. Happiness +5, religion mismatch penalty removed.",
                cash_cost=25000000.0,
                build_resources={"Limestone": 10000, "Gemstones": 9500, "Gold": 9000},
                upkeep_cash=4000.0,
                religion_mismatch_penalty_removed=True,
                happiness_bonus=5
            ),
            WonderType.GRAND_CATHEDRAL: Wonder(
                name="Grand Cathedral",
                category=WonderCategory.SOCIAL,
                description="Massive Christian cathedral. Happiness +6, hospital effectiveness +20%.",
                cash_cost=30000000.0,
                build_resources={"Limestone": 10000, "Gemstones": 9500, "Gold": 9000},
                upkeep_cash=5000.0,
                requires_religion="Christianity",
                happiness_bonus=6,
                hospital_effectiveness_bonus=0.20
            ),
            WonderType.GRAND_MOSQUE: Wonder(
                name="Grand Mosque",
                category=WonderCategory.SOCIAL,
                description="Massive Islamic mosque. Happiness +6, soldier upkeep -10%.",
                cash_cost=30000000.0,
                build_resources={"Limestone": 10000, "Gemstones": 9500, "Gold": 9000},
                upkeep_cash=5000.0,
                requires_religion="Islam",
                happiness_bonus=6,
                soldier_upkeep_bonus=-0.10
            ),
            WonderType.GREAT_SYNAGOGUE: Wonder(
                name="Great Synagogue",
                category=WonderCategory.SOCIAL,
                description="Massive Jewish synagogue. Happiness +5, citizen income +$4.",
                cash_cost=30000000.0,
                build_resources={"Limestone": 10000, "Gold": 9500, "Gemstones": 9000},
                upkeep_cash=5000.0,
                requires_religion="Judaism",
                happiness_bonus=5,
                citizen_income_bonus=4.0
            ),
            WonderType.GREAT_SHRINE: Wonder(
                name="Great Shrine",
                category=WonderCategory.SOCIAL,
                description="Massive Eastern shrine. Happiness +5, environment +2.",
                cash_cost=30000000.0,
                build_resources={"Limestone": 10000, "Timber": 9500, "Fish": 8500},
                upkeep_cash=5000.0,
                requires_religion="Hinduism/Animism",
                happiness_bonus=5,
                environment_bonus=2.0
            ),
            WonderType.HINDU_TEMPLE: Wonder(
                name="Hindu Temple",
                category=WonderCategory.SOCIAL,
                description="Massive Hindu temple complex. Happiness +6, population growth +5%. Requires Hinduism.",
                cash_cost=32000000.0,
                build_resources={"Limestone": 10000, "Timber": 9500, "Gemstones": 9000},
                upkeep_cash=5500.0,
                requires_religion="Hinduism",
                happiness_bonus=6,
                population_growth_bonus=0.05
            ),
            WonderType.BUDDHIST_TEMPLE: Wonder(
                name="Buddhist Temple",
                category=WonderCategory.SOCIAL,
                description="Massive Buddhist temple. Happiness +6, happiness penalty from high taxes -1. Requires Buddhism.",
                cash_cost=32000000.0,
                build_resources={"Limestone": 10000, "Timber": 9500, "Gold": 9000},
                upkeep_cash=5500.0,
                requires_religion="Buddhism",
                happiness_bonus=6,
                tax_happiness_penalty_reduction=1
            ),
            WonderType.COLOSSEUM: Wonder(
                name="Colosseum",
                category=WonderCategory.ECONOMIC,
                description="Massive entertainment arena. Happiness +5, sports arena income doubled.",
                cash_cost=35000000.0,
                build_resources={"Limestone": 10000, "Iron": 9000, "Gold": 8500},
                upkeep_cash=6000.0,
                requires_infrastructure=3000,
                happiness_bonus=5,
                sports_arena_income_doubled=True
            ),
            WonderType.NATIONAL_PARK_SYSTEM_WONDER: Wonder(
                name="National Park System Wonder",
                category=WonderCategory.ECONOMIC,
                description="National park network. Environment +3, happiness +2, land bonus +10%.",
                cash_cost=20000000.0,
                build_resources={"Timber": 10000, "Limestone": 8500},
                upkeep_cash=3000.0,
                requires_land=2000,
                environment_bonus=3.0,
                happiness_bonus=2,
                land_bonus=0.10
            ),
            WonderType.CIVIL_ENGINEERING: Wonder(
                name="Civil Engineering",
                category=WonderCategory.ECONOMIC,
                description="Civil engineering expertise. Infrastructure cost -5%.",
                cash_cost=10000000.0,
                build_resources={"Limestone": 9000, "Iron": 8000},
                upkeep_cash=2000.0,
                requires_infrastructure=1000,
                infrastructure_cost_bonus=-0.05
            ),
            WonderType.ADVANCED_ENGINEERING: Wonder(
                name="Advanced Engineering",
                category=WonderCategory.ECONOMIC,
                description="Advanced engineering expertise. Infrastructure cost -10% (stacks).",
                cash_cost=30000000.0,
                build_resources={"Limestone": 10000, "Iron": 9500, "Copper": 9000},
                upkeep_cash=5000.0,
                requires_infrastructure=2000,
                infrastructure_cost_bonus=-0.10
            ),
            WonderType.GREEN_TECHNOLOGIES: Wonder(
                name="Green Technologies",
                category=WonderCategory.ECONOMIC,
                description="Environmental technology. All power plant pollution -50%, wind/solar power +4 slots.",
                cash_cost=15000000.0,
                build_resources={"Copper": 10000, "Lead": 9000},
                upkeep_cash=3000.0,
                requires_tech=1000,
                power_plant_pollution_bonus=-0.50,
                wind_solar_power_slots=4
            ),
            WonderType.TELECOMMUNICATIONS_SATELLITE: Wonder(
                name="Telecommunications Satellite",
                category=WonderCategory.ECONOMIC,
                description="National satellite network. Commerce income +$3/citizen nationwide.",
                cash_cost=40000000.0,
                build_resources={"Titanium": 10000, "Lead": 9500, "Gold": 9000},
                upkeep_cash=8000.0,
                requires_tech=2000,
                commerce_income_per_citizen=3.0
            ),
            WonderType.INTERNATIONAL_AIRPORT_HUB: Wonder(
                name="International Airport Hub",
                category=WonderCategory.ECONOMIC,
                description="International airport. New city cost -10%, trade income +5%.",
                cash_cost=15000000.0,
                build_resources={"Iron": 9500, "Limestone": 8500, "Oil": 7500},
                upkeep_cash=3000.0,
                requires_infrastructure=1000,
                new_city_cost_bonus=-0.10,
                trade_income_bonus=0.05
            ),
            WonderType.MASS_TRANSIT_NETWORK: Wonder(
                name="Mass Transit Network",
                category=WonderCategory.ECONOMIC,
                description="National public transit. Pollution -1 per city, happiness +1.",
                cash_cost=8000000.0,
                build_resources={"Iron": 9500, "Limestone": 8500, "Copper": 8000},
                upkeep_cash=2000.0,
                requires_infrastructure=1500,
                pollution_bonus=-1.0,
                happiness_bonus=1
            ),
            WonderType.UNIVERSAL_BASIC_INCOME: Wonder(
                name="Universal Basic Income",
                category=WonderCategory.SOCIAL,
                description="Universal income program. Citizen income +$2, happiness +2, tax income -3%.",
                cash_cost=20000000.0,
                build_resources={"Gold": 10000, "Limestone": 9000},
                upkeep_cash=4000.0,
                requires_government="Democracy",
                requires_infrastructure=2000,
                citizen_income_bonus=2.0,
                happiness_bonus=2,
                tax_income_bonus=-0.03
            ),
            WonderType.FREE_TRADE_AGREEMENT: Wonder(
                name="Free Trade Agreement",
                category=WonderCategory.ECONOMIC,
                description="International trade agreement. Trade income +10%, commerce income +5%.",
                cash_cost=10000000.0,
                build_resources={"Gold": 9000, "Limestone": 8500},
                upkeep_cash=2000.0,
                requires_improvement="National Harbor",
                trade_income_bonus=0.10,
                commerce_income_per_citizen=0.05
            ),
            WonderType.RESOURCE_NATIONALIZATION: Wonder(
                name="Resource Nationalization",
                category=WonderCategory.ECONOMIC,
                description="National resource control. Your resources produce +15% more, trade income +8%.",
                cash_cost=8000000.0,
                build_resources={"Iron": 9000, "Coal": 8500},
                upkeep_cash=1500.0,
                resource_production_bonus=0.15,
                trade_income_bonus=0.08
            ),
            WonderType.EXPORT_SUBSIDIES: Wonder(
                name="Export Subsidies",
                category=WonderCategory.ECONOMIC,
                description="Export subsidy program. Resource production +10%, trade income +8%.",
                cash_cost=6000000.0,
                build_resources={"Gold": 8500, "Copper": 8000},
                upkeep_cash=1200.0,
                requires_improvement="National Harbor",
                resource_production_bonus=0.10,
                trade_income_bonus=0.08
            ),
            WonderType.UNIVERSAL_HEALTHCARE: Wonder(
                name="Universal Healthcare",
                category=WonderCategory.CIVIL,
                description="National healthcare system. Disease -5 nationwide, happiness +3.",
                cash_cost=45000000.0,
                build_resources={"Limestone": 10000, "Iron": 9500, "Fish": 9000},
                upkeep_cash=7000.0,
                requires_infrastructure=5000,
                requires_tech=1500,
                disease_bonus=-5.0,
                happiness_bonus=3
            ),
            WonderType.PUBLIC_EDUCATION_SYSTEM: Wonder(
                name="Public Education System",
                category=WonderCategory.CIVIL,
                description="National education system. Technology cost -12%, happiness +2.",
                cash_cost=35000000.0,
                build_resources={"Limestone": 10000, "Timber": 9500, "Copper": 9000},
                upkeep_cash=6000.0,
                requires_infrastructure=3000,
                requires_tech=1000,
                technology_cost_bonus=-0.12,
                happiness_bonus=2
            ),
            WonderType.FREE_PRESS: Wonder(
                name="Free Press",
                category=WonderCategory.SOCIAL,
                description="Free press protection. Happiness +4, spy defense +15%.",
                cash_cost=15000000.0,
                build_resources={"Timber": 9500, "Copper": 9000, "Lead": 8500},
                upkeep_cash=3000.0,
                requires_government="Democracy/Republic",
                happiness_bonus=4,
                spy_defense_bonus=0.15
            ),
            WonderType.PRISON_SYSTEM: Wonder(
                name="Prison System",
                category=WonderCategory.CIVIL,
                description="Nationwide prison infrastructure. Crime -8 nationwide, happiness -1.",
                cash_cost=20000000.0,
                build_resources={"Limestone": 9500, "Iron": 9000, "Copper": 8500},
                upkeep_cash=4000.0,
                requires_infrastructure=2000,
                crime_bonus=-8.0,
                happiness_bonus=-1
            ),
            WonderType.DISEASE_CONTROL_CENTER: Wonder(
                name="Disease Control Center",
                category=WonderCategory.CIVIL,
                description="Advanced disease monitoring and response. Disease -10 nationwide, hospital effectiveness +30%. Requires 1500 tech.",
                cash_cost=35000000.0,
                build_resources={"Limestone": 10000, "Iron": 9500, "Copper": 9000},
                upkeep_cash=6000.0,
                requires_infrastructure=3000,
                requires_tech=1500,
                disease_bonus=-10.0,
                hospital_effectiveness_bonus=0.30
            ),
            WonderType.ENVIRONMENTAL_PROTECTION_AGENCY: Wonder(
                name="Environmental Protection Agency",
                category=WonderCategory.CIVIL,
                description="National environmental regulation. Environment +15 nationwide, pollution -5 per city. Requires 1000 tech.",
                cash_cost=25000000.0,
                build_resources={"Limestone": 9000, "Timber": 8500, "Copper": 8000},
                upkeep_cash=5000.0,
                requires_infrastructure=2000,
                requires_tech=1000,
                environment_bonus=15.0,
                pollution_bonus=-5.0
            ),
            WonderType.COMMUNITY_POLITIZATION: Wonder(
                name="Community Policing",
                category=WonderCategory.CIVIL,
                description="Community-based law enforcement. Crime -5 nationwide, happiness +2.",
                cash_cost=12000000.0,
                build_resources={"Timber": 8000, "Iron": 7500},
                upkeep_cash=2500.0,
                requires_infrastructure=1500,
                crime_bonus=-5.0,
                happiness_bonus=2
            ),
            WonderType.PUBLIC_HEALTH_INITIATIVE: Wonder(
                name="Public Health Initiative",
                category=WonderCategory.CIVIL,
                description="Nationwide public health programs. Disease -7 nationwide, happiness +2. Requires 800 tech.",
                cash_cost=18000000.0,
                build_resources={"Limestone": 8500, "Iron": 8000, "Copper": 7500},
                upkeep_cash=3500.0,
                requires_infrastructure=2000,
                requires_tech=800,
                disease_bonus=-7.0,
                happiness_bonus=2
            ),
            WonderType.GREEN_NEW_DEAL: Wonder(
                name="Green New Deal",
                category=WonderCategory.SOCIAL,
                description="Comprehensive environmental and economic reform. Environment +20 nationwide, happiness +3, infrastructure cost -5%. Requires 1200 tech.",
                cash_cost=50000000.0,
                build_resources={"Limestone": 10000, "Timber": 9500, "Copper": 9000, "Gold": 8500},
                upkeep_cash=7000.0,
                requires_infrastructure=3000,
                requires_tech=1200,
                environment_bonus=20.0,
                happiness_bonus=3,
                infrastructure_cost_bonus=-0.05
            ),
            WonderType.TAX_OPTIMIZATION_BUREAU: Wonder(
                name="Tax Optimization Bureau",
                category=WonderCategory.SOCIAL,
                description="Advanced tax administration system. Commerce income +$2/citizen nation-wide.",
                cash_cost=25000000.0,
                build_resources={"Gold": 8500, "Copper": 8000, "Lead": 7500},
                upkeep_cash=4000.0,
                requires_infrastructure=2000,
                requires_tech=800,
                commerce_income_bonus=2.0
            ),
            WonderType.PROGRESSIVE_TAX_SYSTEM: Wonder(
                name="Progressive Tax System",
                category=WonderCategory.SOCIAL,
                description="Progressive tax structure allowing higher rates. Maximum tax rate increased to 50%, happiness -2.",
                cash_cost=35000000.0,
                build_resources={"Gold": 9000, "Copper": 8500, "Limestone": 8000},
                upkeep_cash=5000.0,
                requires_infrastructure=2500,
                requires_tech=1000,
                max_tax_rate_bonus=0.20,  # +20% max tax rate (from 20% to 50%)
                happiness_bonus=-2
            ),
            WonderType.TAX_HARMONY_INITIATIVE: Wonder(
                name="Tax Harmony Initiative",
                category=WonderCategory.SOCIAL,
                description="Citizen-friendly tax policies. Further reduces happiness penalty from high taxes by 1.",
                cash_cost=30000000.0,
                build_resources={"Gold": 8800, "Limestone": 8200, "Gemstones": 7500},
                upkeep_cash=4500.0,
                requires_infrastructure=2200,
                requires_tech=900,
                tax_happiness_penalty_reduction=1,
                happiness_bonus=1
            ),
            # Military Wonders (20)
            WonderType.PENTAGON: Wonder(
                name="Pentagon",
                category=WonderCategory.MILITARY,
                description="Military command center. Military upkeep -15%, all military efficiency +5%.",
                cash_cost=50000000.0,
                build_resources={"Limestone": 10000, "Iron": 9500, "Copper": 9000},
                upkeep_cash=8000.0,
                requires_infrastructure=5000,
                requires_tech=2000,
                military_upkeep_bonus=-0.15,
                all_military_efficiency_bonus=0.05
            ),
            WonderType.STRATEGIC_DEFENSE_INITIATIVE: Wonder(
                name="Strategic Defense Initiative",
                category=WonderCategory.MILITARY,
                description="Advanced missile defense. Missile intercept +20%, nuke intercept +15%.",
                cash_cost=75000000.0,
                build_resources={"Iron": 10000, "Titanium": 9500, "Lead": 9000},
                upkeep_cash=12000.0,
                requires_tech=3000,
                requires_improvement="Nuclear Silo",
                missile_intercept_chance_bonus=0.20,
                nuke_intercept_chance_bonus=0.15
            ),
            WonderType.WEAPONS_RESEARCH_COMPLEX: Wonder(
                name="Weapons Research Complex",
                category=WonderCategory.MILITARY,
                description="Advanced weapons research. All military unit damage +10%, missile damage +20%.",
                cash_cost=60000000.0,
                build_resources={"Iron": 10000, "Titanium": 9500, "Lead": 9000},
                upkeep_cash=10000.0,
                requires_tech=2500,
                military_unit_damage_bonus=0.10,
                missile_damage_bonus=0.20
            ),
            WonderType.MILITARY_SATELLITE: Wonder(
                name="Military Satellite",
                category=WonderCategory.MILITARY,
                description="Military satellite network. Spy success +20%, enemy spy success -20%.",
                cash_cost=80000000.0,
                build_resources={"Iron": 10000, "Titanium": 9500, "Lead": 9000},
                upkeep_cash=12000.0,
                requires_wonder="Space Agency",
                requires_tech=3000,
                spy_success_bonus=0.20,
                enemy_spy_success_bonus=-0.20
            ),
            WonderType.FORTIFIED_CITADEL: Wonder(
                name="Fortified Citadel",
                category=WonderCategory.MILITARY,
                description="Massive fortress. Infrastructure war damage -20%, city resistance +15.",
                cash_cost=30000000.0,
                build_resources={"Limestone": 10000, "Iron": 9500, "Timber": 9000},
                upkeep_cash=5000.0,
                requires_infrastructure=3000,
                infrastructure_war_damage_bonus=-0.20,
                city_resistance_bonus=15.0
            ),
            WonderType.GRAND_NAVAL_SHIPYARD: Wonder(
                name="Grand Naval Shipyard",
                category=WonderCategory.MILITARY,
                description="Advanced shipbuilding. Ship purchase +2/tick, ship cost -15%.",
                cash_cost=40000000.0,
                build_resources={"Iron": 10000, "Timber": 9500, "Titanium": 9000},
                upkeep_cash=7000.0,
                requires_improvement="National Harbor",
                requires_tech=1500,
                ship_purchase_per_tick=2.0,
                ship_cost_bonus=-0.15
            ),
            WonderType.AIR_DEFENSE_NETWORK: Wonder(
                name="Air Defense Network",
                category=WonderCategory.MILITARY,
                description="National air defense. Enemy airstrike damage -25%, aircraft losses in defense -15%.",
                cash_cost=45000000.0,
                build_resources={"Iron": 10000, "Titanium": 9500, "Lead": 9000},
                upkeep_cash=7500.0,
                requires_tech=2000,
                airstrike_damage_bonus=-0.25,
                aircraft_losses_in_defense_bonus=-0.15
            ),
            WonderType.NUCLEAR_ARSENAL: Wonder(
                name="Nuclear Arsenal",
                category=WonderCategory.MILITARY,
                description="Nuclear weapons stockpile. Nuke damage +25%, nuke cap +2.",
                cash_cost=100000000.0,
                build_resources={"Iron": 10000, "Uranium": 9500, "Titanium": 9000},
                upkeep_cash=15000.0,
                requires_project="Manhattan Project",
                requires_tech=5000,
                nuke_damage_bonus=0.25,
                nuke_cap_bonus=2
            ),
            WonderType.MISSILE_COMMAND_CENTER: Wonder(
                name="Missile Command Center",
                category=WonderCategory.MILITARY,
                description="Missile command center. Enables cruise missiles production, missile cap +2.",
                cash_cost=35000000.0,
                build_resources={"Iron": 10000, "Titanium": 9500, "Lead": 9000},
                upkeep_cash=6000.0,
                requires_tech=2000,
                enables_missiles=True,
                missile_cap_bonus=2
            ),
            WonderType.NUCLEAR_RESEARCH_FACILITY: Wonder(
                name="Nuclear Research Facility",
                category=WonderCategory.MILITARY,
                description="Nuclear research facility. Enables nuclear weapon production, nuke cap +2.",
                cash_cost=80000000.0,
                build_resources={"Iron": 10000, "Uranium": 9500, "Lead": 9000},
                upkeep_cash=10000.0,
                requires_tech=3000,
                enables_nuclear_weapons=True,
                nuke_cap_bonus=2
            ),
            WonderType.CYBER_COMMAND_CENTER: Wonder(
                name="Cyber Command Center",
                category=WonderCategory.MILITARY,
                description="Cyber warfare center. Spy operations +25%, counter-intel +20%.",
                cash_cost=35000000.0,
                build_resources={"Limestone": 10000, "Copper": 9500, "Lead": 9000},
                upkeep_cash=6000.0,
                requires_tech=2000,
                spy_operations_bonus=0.25,
                spy_defense_bonus=0.20
            ),
            WonderType.SPECIAL_OPERATIONS_HQ: Wonder(
                name="Special Operations HQ",
                category=WonderCategory.MILITARY,
                description="Special forces headquarters. Ground attack bonus +15%, spy assassination success +20%.",
                cash_cost=25000000.0,
                build_resources={"Iron": 10000, "Limestone": 9500, "Titanium": 9000},
                upkeep_cash=4500.0,
                requires_tech=1500,
                ground_attack_bonus=0.15,
                spy_success_bonus=0.20
            ),
            WonderType.PROPAGANDA_MINISTRY: Wonder(
                name="Propaganda Ministry",
                category=WonderCategory.MILITARY,
                description="Propaganda ministry. War happiness penalty removed, enemy morale -10%.",
                cash_cost=20000000.0,
                build_resources={"Limestone": 10000, "Timber": 9500, "Spices": 9000},
                upkeep_cash=3500.0,
                requires_government="Dictatorship/Fascism",
                war_happiness_penalty_removed=True
            ),
            WonderType.IRON_CURTAIN: Wonder(
                name="Iron Curtain",
                category=WonderCategory.MILITARY,
                description="Iron curtain defense. Spy defense +30%, border walls effect doubled.",
                cash_cost=30000000.0,
                build_resources={"Limestone": 10000, "Iron": 9500, "Timber": 9000},
                upkeep_cash=5000.0,
                requires_government="Communist/Dictatorship",
                spy_defense_bonus=0.30,
                border_walls_effect_doubled=True
            ),
            WonderType.ARMS_STOCKPILE: Wonder(
                name="Arms Stockpile",
                category=WonderCategory.MILITARY,
                description="Military arms stockpile. Military unit cap +10% nationwide.",
                cash_cost=5000000.0,
                build_resources={"Iron": 9000, "Coal": 8500},
                upkeep_cash=1000.0,
                requires_improvement="Tank Factory",
                military_unit_cap_bonus=0.10
            ),
            WonderType.RAPID_DEPLOYMENT_FORCE: Wonder(
                name="Rapid Deployment Force",
                category=WonderCategory.MILITARY,
                description="Rapid deployment forces. Soldiers purchased 2× faster.",
                cash_cost=8000000.0,
                build_resources={"Iron": 9000, "Oil": 8500},
                upkeep_cash=1500.0,
                requires_improvement="Barracks",
                requires_tech=500,
                soldier_purchase_speed_bonus=2.0
            ),
            WonderType.IRON_DOME: Wonder(
                name="Iron Dome",
                category=WonderCategory.MILITARY,
                description="Missile interception system. Missile intercept chance +15%.",
                cash_cost=30000000.0,
                build_resources={"Iron": 10000, "Titanium": 9500, "Copper": 9000},
                upkeep_cash=5000.0,
                requires_tech=1500,
                missile_intercept_chance_bonus=0.15
            ),
            WonderType.MISSILE_DEFENSE_SYSTEM: Wonder(
                name="Missile Defense System",
                category=WonderCategory.MILITARY,
                description="Advanced missile defense system. Reduces damage taken from missiles/nukes by 15%. Requires Iron Dome.",
                cash_cost=50000000.0,
                build_resources={"Titanium": 10000, "Lead": 9500, "Gold": 9000},
                upkeep_cash=8000.0,
                requires_wonder="Iron Dome",
                requires_tech=2000,
                missile_damage_bonus=-0.15,
                nuke_damage_bonus=-0.15
            ),
            WonderType.STRATEGIC_RESERVE: Wonder(
                name="Strategic Reserve",
                category=WonderCategory.MILITARY,
                description="Strategic resource reserve. Military upkeep -12%, stockpile capacity ×1.5.",
                cash_cost=12000000.0,
                build_resources={"Iron": 10000, "Coal": 9500, "Oil": 9000},
                upkeep_cash=2000.0,
                military_upkeep_bonus=-0.12,
                stockpile_capacity_multiplier=1.5
            ),
            WonderType.ADVANCED_MISSILE_SHIELD: Wonder(
                name="Advanced Missile Shield",
                category=WonderCategory.MILITARY,
                description="Advanced missile defense system. Missile intercept +15%, nuke intercept +30%, reduces damage taken from missiles/nukes by 30%.",
                cash_cost=80000000.0,
                build_resources={"Iron": 10000, "Titanium": 9500, "Lead": 9000, "Gold": 8500},
                upkeep_cash=5000.0,
                requires_improvement="Missile Battery",
                requires_tech=3000,
                missile_intercept_chance_bonus=0.15,
                nuke_intercept_chance_bonus=0.30,
                missile_damage_bonus=-0.30,  # Reduces damage taken
                nuke_damage_bonus=-0.30  # Reduces damage taken
            ),
            WonderType.NUCLEAR_DETERRENT_ARRAY: Wonder(
                name="Nuclear Deterrent Array",
                category=WonderCategory.MILITARY,
                description="Advanced nuclear weapons system. Significantly increases damage dealt from missiles/nukes by 30%.",
                cash_cost=100000000.0,
                build_resources={"Uranium": 10000, "Lead": 9500, "Gold": 9000, "Titanium": 8500},
                upkeep_cash=8000.0,
                requires_project="Manhattan Project",
                requires_tech=4000,
                missile_damage_bonus=0.30,  # Increases damage dealt
                nuke_damage_bonus=0.30  # Increases damage dealt
            ),
            # Space Wonders (4)
            WonderType.MOON_LANDING: Wonder(
                name="Moon Landing",
                category=WonderCategory.SPACE,
                description="Historic moon landing. Happiness +10, prestige +5, literacy +20%.",
                cash_cost=100000000.0,
                build_resources={"Titanium": 10000, "Lead": 9500, "Uranium": 9000},
                upkeep_cash=15000.0,
                requires_wonder="Space Agency",
                requires_tech=5000,
                happiness_bonus=10,
                prestige_bonus=5,
                literacy_bonus=20.0
            ),
            WonderType.MOON_BASE: Wonder(
                name="Moon Base",
                category=WonderCategory.SPACE,
                description="Permanent moon base. Citizen income +$5, technology cost -20%.",
                cash_cost=150000000.0,
                build_resources={"Titanium": 10000, "Lead": 9500, "Uranium": 9000},
                upkeep_cash=20000.0,
                requires_wonder="Moon Landing",
                citizen_income_bonus=5.0,
                technology_cost_bonus=-0.20
            ),
            WonderType.MARS_COLONY: Wonder(
                name="Mars Colony",
                category=WonderCategory.SPACE,
                description="Mars colonization. Citizen income +$10, happiness +5, prestige +10.",
                cash_cost=300000000.0,
                build_resources={"Titanium": 10000, "Lead": 9500, "Uranium": 9000},
                upkeep_cash=35000.0,
                requires_wonder="Moon Base",
                requires_tech=8000,
                citizen_income_bonus=10.0,
                happiness_bonus=5,
                prestige_bonus=10
            ),
            WonderType.ORBITAL_PLATFORM: Wonder(
                name="Orbital Platform",
                category=WonderCategory.SPACE,
                description="Space station platform. Military satellite effect doubled, spy operations +30%.",
                cash_cost=200000000.0,
                build_resources={"Titanium": 10000, "Lead": 9500, "Gold": 9000},
                upkeep_cash=25000.0,
                requires_wonder="Moon Base",
                military_satellite_effect_doubled=True,
                spy_operations_bonus=0.30
            ),
        }

    def get_wonder(self, wonder_type: WonderType) -> Wonder:
        """Get a wonder by type."""
        return self.wonders[wonder_type]

    def get_all_wonders(self) -> list:
        """Get all available wonders."""
        return list(self.wonders.values())

    def get_wonders_by_category(self, category: WonderCategory) -> list:
        """Get all wonders of a specific category."""
        return [wonder for wonder in self.wonders.values() if wonder.category == category]


# Singleton instance
wonder_system = WonderSystem()
