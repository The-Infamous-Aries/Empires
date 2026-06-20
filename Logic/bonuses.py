"""
Bonus System for Sovereign Nation Game

This module defines the Bonus components that determine
nation bonuses based on resources, improvements, wonders, and combinations.
"""

from dataclasses import dataclass
from typing import List, Dict, Set, Optional, Union
from enum import Enum


class BonusCategory(Enum):
    """Categories of bonuses based on unlock requirements."""
    RESOURCE = "Resource"
    IMPROVEMENT = "Improvement"
    WONDER = "Wonder"
    COMBINATION = "Combination"


class BonusType(Enum):
    """All available bonus types in the game."""
    # Resource Bonuses - Basic
    AGRICULTURAL_HERITAGE = "Agricultural Heritage"
    FORESTRY_MASTERY = "Forestry Mastery"
    MARITIME_TRADITION = "Maritime Tradition"
    LIVESTOCK_INDUSTRY = "Livestock Industry"
    COAL_POWER = "Coal Power"
    IRON_FOUNDRIES = "Iron Foundries"
    COPPER_WIRING = "Copper Wiring"
    STONE_MASONRY = "Stone Masonry"
    OIL_FIELDS = "Oil Fields"
    LEAD_AMMUNITION = "Lead Ammunition"
    # Resource Bonuses - Agricultural
    SUSTAINABLE_FARMING = "Sustainable Farming"
    IRRIGATION = "Irrigation"
    AQUACULTURE = "Aquaculture"
    CROP_ROTATION = "Crop Rotation"
    DAIRY_INDUSTRY = "Dairy Industry"
    # Resource Bonuses - Industrial
    IRON_PRODUCTION = "Iron Production"
    CONCRETE_INDUSTRY = "Concrete Industry"
    FUEL_REFINING = "Fuel Refining"
    CHEMICAL_INDUSTRY = "Chemical Industry"
    HEAVY_INDUSTRY = "Heavy Industry"
    ADVANCED_MANUFACTURING = "Advanced Manufacturing"
    HYDROELECTRIC_POWER = "Hydroelectric Power"
    # Resource Bonuses - Luxury
    TEXTILE_INDUSTRY = "Textile Industry"
    PRECIOUS_METALS_TRADE = "Precious Metals Trade"
    FINE_SPIRITS = "Fine Spirits"
    EXOTIC_GOODS = "Exotic Goods"
    JEWELRY_CRAFTING = "Jewelry Crafting"
    # Resource Bonuses - Military
    GUNPOWDER = "Gunpowder"
    ARMOR_PLATING = "Armor Plating"
    ADVANCED_ALLOYS = "Advanced Alloys"
    NUCLEAR_CAPABILITY = "Nuclear Capability"
    BALLISTIC_TECHNOLOGY = "Ballistic Technology"
    # Resource Bonuses - Strategic
    MEDICAL_RESEARCH = "Medical Research"
    FERTILIZER_PRODUCTION = "Fertilizer Production"
    ENERGY_INDEPENDENCE = "Energy Independence"
    HIGH_TECH_INDUSTRY = "High-Tech Industry"
    GREEN_ENERGY = "Green Energy"
    WATER_PURIFICATION = "Water Purification"
    HYDRO_ENGINEERING = "Hydro Engineering"
    # Improvement Bonuses - Power
    EFFICIENT_GRID = "Efficient Grid"
    CLEAN_ENERGY = "Clean Energy"
    DUAL_POWER = "Dual Power"
    # Improvement Bonuses - Trade
    TRADE_NETWORK = "Trade Network"
    EXTRACTION_MASTERY = "Extraction Mastery"
    PROCESSING_EFFICIENCY = "Processing Efficiency"
    INDUSTRIAL_POWER = "Industrial Power"
    REFINED_PRODUCTION = "Refined Production"
    HARBOR_TRADE = "Harbor Trade"
    MARKET_MASTERY = "Market Mastery"
    STORAGE_CAPACITY = "Storage Capacity"
    IRRIGATION_BONUS = "Irrigation Bonus"
    MINING_EFFICIENCY = "Mining Efficiency"
    STRATEGIC_EXTRACTION = "Strategic Extraction"
    # Improvement Bonuses - Civil
    HEALTHCARE_NETWORK = "Healthcare Network"
    ADVANCED_HEALTHCARE = "Advanced Healthcare"
    MEDICAL_EXCELLENCE = "Medical Excellence"
    LAW_ENFORCEMENT = "Law Enforcement"
    JUSTICE_SYSTEM = "Justice System"
    ENVIRONMENTAL_PROTECTION = "Environmental Protection"
    SANITATION = "Sanitation"
    PUBLIC_TRANSIT = "Public Transit"
    EMERGENCY_SERVICES = "Emergency Services"
    DISASTER_RESPONSE = "Disaster Response"
    GREEN_CITIES = "Green Cities"
    # Improvement Bonuses - Commerce
    LOCAL_MARKETS = "Local Markets"
    RETAIL_CHAINS = "Retail Chains"
    BANKING_SYSTEM = "Banking System"
    SHOPPING_CENTERS = "Shopping Centers"
    LUXURY_RETAIL = "Luxury Retail"
    ENTERTAINMENT = "Entertainment"
    TRADE_HUB = "Trade Hub"
    FINANCIAL_CENTER = "Financial Center"
    TOURISM = "Tourism"
    GAMING_INDUSTRY = "Gaming Industry"
    # Improvement Bonuses - Military
    BASIC_TRAINING = "Basic Training"
    MILITARY_TRAINING = "Military Training"
    COMBAT_READINESS = "Combat Readiness"
    ELITE_TRAINING = "Elite Training"
    SPECIAL_FORCES = "Special Forces"
    TANK_PRODUCTION = "Tank Production"
    ARMOR_MANUFACTURING = "Armor Manufacturing"
    WEAPONS_DEVELOPMENT = "Weapons Development"
    ADVANCED_ARMOR = "Advanced Armor"
    TANK_SUPREMACY = "Tank Supremacy"
    AVIATION = "Aviation"
    AIR_SUPERIORITY = "Air Superiority"
    ADVANCED_AVIATION = "Advanced Aviation"
    STEALTH_TECH = "Stealth Tech"
    AIR_DOMINANCE = "Air Dominance"
    NAVAL_CONSTRUCTION = "Naval Construction"
    FLEET_BASE = "Fleet Base"
    ADVANCED_SHIPBUILDING = "Advanced Shipbuilding"
    NAVAL_ACADEMY = "Naval Academy"
    FLEET_COMMAND = "Fleet Command"
    # Improvement Bonuses - Science
    EDUCATION = "Education"
    HIGHER_EDUCATION = "Higher Education"
    RESEARCH_POWER = "Research Power"
    ADVANCED_RESEARCH = "Advanced Research"
    DIGITAL_AGE = "Digital Age"
    SPACE_PROGRAM = "Space Program"
    QUANTUM_COMPUTING = "Quantum Computing"
    # Improvement Bonuses - Infrastructure
    BASIC_ROADS = "Basic Roads"
    HIGHWAYS = "Highways"
    SUPERHIGHWAYS = "Superhighways"
    AIR_TRAVEL = "Air Travel"
    POWER_DISTRIBUTION = "Power Distribution"
    CLEAN_WATER = "Clean Water"
    BORDER_SECURITY = "Border Security"
    FLOOD_PROTECTION = "Flood Protection"
    COMMUNICATIONS = "Communications"
    # Wonder Bonuses - Economic
    AGRICULTURAL_DEVELOPMENT = "Agricultural Development"
    CENTRAL_BANKING = "Central Banking"
    GRAND_MONUMENT = "Grand Monument"
    NATIONAL_TRADE = "National Trade"
    GLOBAL_FINANCE = "Global Finance"
    DIGITAL_INFRASTRUCTURE = "Digital Infrastructure"
    SPACE_ECONOMY = "Space Economy"
    DISASTER_RESILIENCE = "Disaster Resilience"
    RESEARCH_POWERHOUSE = "Research Powerhouse"
    RELIGIOUS_HARMONY = "Religious Harmony"
    CHRISTIAN_HERITAGE = "Christian Heritage"
    ISLAMIC_HERITAGE = "Islamic Heritage"
    JEWISH_HERITAGE = "Jewish Heritage"
    EASTERN_HERITAGE = "Eastern Heritage"
    EASTERN_SPIRITUALITY = "Eastern Spirituality"
    ENTERTAINMENT_CAPITAL = "Entertainment Capital"
    ENVIRONMENTAL_STEWARDSHIP = "Environmental Stewardship"
    # Wonder Bonuses - Social
    UNIVERSAL_HEALTHCARE = "Universal Healthcare"
    PUBLIC_EDUCATION = "Public Education"
    FREE_PRESS = "Free Press"
    # Wonder Bonuses - Military
    PENTAGON_COMMAND = "Pentagon Command"
    STRATEGIC_DEFENSE = "Strategic Defense"
    WEAPONS_RESEARCH = "Weapons Research"
    MILITARY_SATELLITES = "Military Satellites"
    FORTIFIED_NATION = "Fortified Nation"
    NAVAL_SUPREMACY = "Naval Supremacy"
    AIR_DEFENSE = "Air Defense"
    NUCLEAR_ARSENAL = "Nuclear Arsenal"
    CYBER_WARFARE = "Cyber Warfare"
    SPECIAL_OPERATIONS = "Special Operations"
    PROPAGANDA = "Propaganda"
    IRON_DEFENSE = "Iron Defense"
    # Wonder Bonuses - Space
    MOON_BASE = "Moon Base"
    MARS_COLONY = "Mars Colony"
    # Combination Bonuses - Industrial
    INDUSTRIAL_EMPIRE = "Industrial Empire"
    MANUFACTURING_HUB = "Manufacturing Hub"
    ENERGY_MASTERY = "Energy Mastery"
    # Combination Bonuses - Military
    WAR_MACHINE = "War Machine"
    NAVAL_DOMINANCE = "Naval Dominance"
    AIR_SUPERIORITY_COMBO = "Air Superiority"
    NUCLEAR_SUPERPOWER = "Nuclear Superpower"
    # Combination Bonuses - Economic
    AFFLUENT_SOCIETY = "Affluent Society"
    TRADE_EMPIRE = "Trade Empire"
    GOLDEN_AGE = "Golden Age"
    # Combination Bonuses - Technology
    TECH_SUPREMACY = "Tech Supremacy"
    SPACE_AGE = "Space Age"
    # Combination Bonuses - Civil
    THRIVING_NATION = "Thriving Nation"
    HEALTHY_POPULATION = "Healthy Population"
    # Combination Bonuses - Ultimate
    WORLD_SUPERPOWER = "World Superpower"
    GLOBAL_HEGEMON = "Global Hegemon"


@dataclass
class Bonus:
    """Bonus with effects and unlock requirements."""
    name: str
    category: BonusCategory  # Category of bonus (Resource, Improvement, Wonder, Combination)
    description: str  # Flavor text to help players understand the bonus
    # Requirements
    required_resources: Set[str] = None  # Set of resource names required
    required_improvements: Set[str] = None  # Set of improvement names required
    required_wonders: Set[str] = None  # Set of wonder names required
    required_bonuses: Set[str] = None  # Set of other bonus names required (for combinations)
    # Economic effects
    citizen_income_bonus: float = 0.0  # Bonus to citizen income in dollars
    citizen_income_per_citizen: float = 0.0  # Bonus to citizen income per citizen
    tax_income_bonus: float = 0.0  # Percentage bonus to tax income
    commerce_income_bonus: float = 0.0  # Percentage bonus to commerce income
    commerce_income_per_citizen: float = 0.0  # Bonus to commerce income per citizen
    trade_income_bonus: float = 0.0  # Percentage bonus to trade income
    bank_interest_bonus: float = 0.0  # Percentage bonus to bank interest
    tourism_income_per_citizen: float = 0.0  # Bonus to tourism income per citizen
    # Cost effects
    infrastructure_cost_bonus: float = 0.0  # Percentage bonus to infrastructure cost (negative = cheaper)
    infrastructure_upkeep_bonus: float = 0.0  # Percentage bonus to infrastructure upkeep (negative = cheaper)
    improvement_upkeep_bonus: float = 0.0  # Percentage bonus to improvement upkeep (negative = cheaper)
    improvement_build_cost_bonus: float = 0.0  # Percentage bonus to improvement build cost (negative = cheaper)
    land_cost_bonus: float = 0.0  # Percentage bonus to land cost (negative = cheaper)
    wonder_cost_bonus: float = 0.0  # Percentage bonus to wonder cost (negative = cheaper)
    project_cost_bonus: float = 0.0  # Percentage bonus to project cost (negative = cheaper)
    technology_cost_bonus: float = 0.0  # Percentage bonus to technology cost (negative = cheaper)
    new_city_cost_bonus: float = 0.0  # Percentage bonus to new city cost (negative = cheaper)
    # Military effects
    soldier_upkeep_bonus: float = 0.0  # Percentage bonus to soldier upkeep (negative = cheaper)
    soldier_efficiency_bonus: float = 0.0  # Percentage bonus to soldier efficiency
    all_military_efficiency_bonus: float = 0.0  # Percentage bonus to all military efficiency
    military_upkeep_bonus: float = 0.0  # Percentage bonus to all military upkeep (negative = cheaper)
    tank_cost_bonus: float = 0.0  # Percentage bonus to tank cost (negative = cheaper)
    tank_efficiency_bonus: float = 0.0  # Percentage bonus to tank efficiency
    tank_damage_bonus: float = 0.0  # Percentage bonus to tank damage
    aircraft_cost_bonus: float = 0.0  # Percentage bonus to aircraft cost (negative = cheaper)
    aircraft_upkeep_bonus: float = 0.0  # Percentage bonus to aircraft upkeep (negative = cheaper)
    aircraft_efficiency_bonus: float = 0.0  # Percentage bonus to aircraft efficiency
    aircraft_losses_defense_bonus: float = 0.0  # Percentage bonus to aircraft losses in defense (negative = fewer losses)
    ship_cost_bonus: float = 0.0  # Percentage bonus to ship cost (negative = cheaper)
    ship_upkeep_bonus: float = 0.0  # Percentage bonus to ship upkeep (negative = cheaper)
    ship_efficiency_bonus: float = 0.0  # Percentage bonus to ship efficiency
    ship_purchase_per_tick: float = 0.0  # Additional ship purchases per tick
    naval_efficiency_bonus: float = 0.0  # Percentage bonus to naval efficiency
    missile_cost_bonus: float = 0.0  # Percentage bonus to missile cost (negative = cheaper)
    missile_damage_bonus: float = 0.0  # Percentage bonus to missile damage
    military_unit_damage_bonus: float = 0.0  # Percentage bonus to military unit damage
    # Population effects
    citizen_percentage_bonus: float = 0.0  # Percentage bonus to citizens
    land_percentage_bonus: float = 0.0  # Percentage bonus to land
    happiness_bonus: int = 0  # Direct happiness modifier
    # Health effects
    disease_bonus: float = 0.0  # Disease per city (can be negative for reduction)
    disease_nationwide: float = 0.0  # Disease reduction nationwide (can be negative)
    hospital_effectiveness_bonus: float = 0.0  # Percentage bonus to hospital effectiveness
    # Environmental effects
    pollution_bonus: float = 0.0  # Pollution per city (can be negative for reduction)
    environment_bonus: float = 0.0  # Environment bonus
    # Production effects
    resource_production_bonus: float = 0.0  # Percentage bonus to resource production
    basic_resource_production_bonus: float = 0.0  # Percentage bonus to basic resource production
    industrial_production_bonus: float = 0.0  # Percentage bonus to industrial production
    strategic_production_bonus: float = 0.0  # Percentage bonus to strategic production
    agricultural_production_bonus: float = 0.0  # Percentage bonus to agricultural production
    water_production_bonus: float = 0.0  # Percentage bonus to water production
    fish_production_bonus: float = 0.0  # Percentage bonus to fish production
    # Technology effects
    tech_income_bonus: float = 0.0  # Percentage bonus to tech income
    # Power effects
    power_plant_efficiency_bonus: float = 0.0  # Percentage bonus to power plant efficiency
    # Defense effects
    spy_defense_bonus: float = 0.0  # Percentage bonus to spy defense
    spy_operations_bonus: float = 0.0  # Percentage bonus to spy operations
    counter_intel_bonus: float = 0.0  # Percentage bonus to counter-intelligence
    spy_success_bonus: float = 0.0  # Percentage bonus to spy success
    enemy_spy_success_bonus: float = 0.0  # Percentage bonus to enemy spy success (negative = reduction)
    spy_assassination_success_bonus: float = 0.0  # Percentage bonus to spy assassination success
    city_resistance_bonus: float = 0.0  # Bonus to city resistance
    border_walls_effect_bonus: float = 0.0  # Percentage bonus to border walls effect
    # War effects
    war_happiness_penalty_reduction: float = 0.0  # Percentage reduction to war happiness penalty
    enemy_morale_bonus: float = 0.0  # Percentage bonus to enemy morale (negative = penalty)
    war_score_gain_bonus: float = 0.0  # Percentage bonus to war score gain
    ground_attack_bonus: float = 0.0  # Percentage bonus to ground attack
    airstrike_damage_bonus: float = 0.0  # Percentage bonus to airstrike damage
    enemy_airstrike_damage_bonus: float = 0.0  # Percentage bonus to enemy airstrike damage (negative = reduction)
    war_casualty_rate_bonus: float = 0.0  # Percentage bonus to war casualty rate (negative = reduction)
    # Nuclear effects
    nuke_damage_bonus: float = 0.0  # Percentage bonus to nuke damage
    nuke_cap_bonus: float = 0.0  # Bonus to nuke cap (multiplier)
    nuke_intercept_chance_bonus: float = 0.0  # Percentage bonus to nuke intercept chance
    nuclear_research_cost_bonus: float = 0.0  # Percentage bonus to nuclear research cost (negative = cheaper)
    enables_nuclear_weapons: bool = False  # Whether bonus enables nuclear weapons
    enables_advanced_space_projects: bool = False  # Whether bonus enables advanced space projects
    # Disaster effects
    disaster_damage_bonus: float = 0.0  # Percentage bonus to disaster damage (negative = reduction)
    natural_disaster_damage_bonus: float = 0.0  # Percentage bonus to natural disaster damage (negative = reduction)
    random_disaster_damage_bonus: float = 0.0  # Percentage bonus to random disaster damage (negative = reduction)
    recovery_time_bonus: float = 0.0  # Percentage bonus to recovery time (negative = faster)
    # Special effects
    religion_mismatch_penalty_removed: bool = False  # Whether religion mismatch penalty is removed
    sports_arena_income_bonus: float = 0.0  # Percentage bonus to sports arena income
    stockpile_capacity_bonus: float = 0.0  # Percentage bonus to stockpile capacity
    crime_bonus: float = 0.0  # Crime per city (can be negative for reduction)
    dogfight_bonus: float = 0.0  # Percentage bonus to dogfight
    aircraft_damage_resistance_bonus: float = 0.0  # Percentage bonus to aircraft damage resistance
    infrastructure_war_damage_bonus: float = 0.0  # Percentage bonus to infrastructure war damage (negative = reduction)
    special_effect: str = ""  # Description of special effects

    def __post_init__(self):
        """Initialize None sets to empty sets."""
        if self.required_resources is None:
            self.required_resources = set()
        if self.required_improvements is None:
            self.required_improvements = set()
        if self.required_wonders is None:
            self.required_wonders = set()
        if self.required_bonuses is None:
            self.required_bonuses = set()

    def __str__(self) -> str:
        return self.name


class BonusSystem:
    """System for managing bonus types and their effects."""

    def __init__(self):
        self.bonuses: Dict[BonusType, Bonus] = self._initialize_bonuses()

    def _initialize_bonuses(self) -> Dict[BonusType, Bonus]:
        """Initialize all bonus types with their data."""
        return {
            # Resource Bonuses - Basic
            BonusType.AGRICULTURAL_HERITAGE: Bonus(
                name="Agricultural Heritage",
                category=BonusCategory.RESOURCE,
                description="Farming tradition passed down through generations. Increases citizen income with land cost reduction.",
                required_resources={"Grain"},
                citizen_income_bonus=1.0,
                land_cost_bonus=-0.05
            ),
            BonusType.FORESTRY_MASTERY: Bonus(
                name="Forestry Mastery",
                category=BonusCategory.RESOURCE,
                description="Expertise in sustainable forestry. Reduces infrastructure and improvement build costs.",
                required_resources={"Timber"},
                infrastructure_cost_bonus=-0.03,
                improvement_build_cost_bonus=-0.05
            ),
            BonusType.MARITIME_TRADITION: Bonus(
                name="Maritime Tradition",
                category=BonusCategory.RESOURCE,
                description="Coastal expertise in fishing and trade. Increases citizens with disease reduction.",
                required_resources={"Fish"},
                citizen_percentage_bonus=0.03,
                disease_bonus=-0.5
            ),
            BonusType.LIVESTOCK_INDUSTRY: Bonus(
                name="Livestock Industry",
                category=BonusCategory.RESOURCE,
                description="Well-developed animal husbandry. Reduces soldier upkeep with happiness bonus.",
                required_resources={"Livestock"},
                soldier_upkeep_bonus=-0.04,
                happiness_bonus=0.5
            ),
            BonusType.COAL_POWER: Bonus(
                name="Coal Power",
                category=BonusCategory.RESOURCE,
                description="Coal-based energy generation. Reduces infrastructure upkeep with military efficiency.",
                required_resources={"Coal"},
                infrastructure_upkeep_bonus=-0.03,
                soldier_efficiency_bonus=0.03
            ),
            BonusType.IRON_FOUNDRIES: Bonus(
                name="Iron Foundries",
                category=BonusCategory.RESOURCE,
                description="Ironworking expertise. Reduces tank and infrastructure costs.",
                required_resources={"Iron"},
                tank_cost_bonus=-0.04,
                infrastructure_cost_bonus=-0.03
            ),
            BonusType.COPPER_WIRING: Bonus(
                name="Copper Wiring",
                category=BonusCategory.RESOURCE,
                description="Copper expertise for electrical systems. Reduces technology cost with commerce bonus.",
                required_resources={"Copper"},
                technology_cost_bonus=-0.03,
                commerce_income_bonus=0.02
            ),
            BonusType.STONE_MASONRY: Bonus(
                name="Stone Masonry",
                category=BonusCategory.RESOURCE,
                description="Expertise in stone construction. Reduces wonder and infrastructure costs.",
                required_resources={"Limestone"},
                wonder_cost_bonus=-0.06,
                infrastructure_cost_bonus=-0.02
            ),
            BonusType.OIL_FIELDS: Bonus(
                name="Oil Fields",
                category=BonusCategory.RESOURCE,
                description="Oil extraction and refining. Reduces aircraft and ship upkeep.",
                required_resources={"Oil"},
                aircraft_upkeep_bonus=-0.05,
                ship_upkeep_bonus=-0.04
            ),
            BonusType.LEAD_AMMUNITION: Bonus(
                name="Lead Ammunition",
                category=BonusCategory.RESOURCE,
                description="Lead expertise for ammunition. Reduces missile cost with military efficiency.",
                required_resources={"Lead"},
                missile_cost_bonus=-0.06,
                soldier_efficiency_bonus=0.02
            ),
            # Resource Bonuses - Agricultural
            BonusType.SUSTAINABLE_FARMING: Bonus(
                name="Sustainable Farming",
                category=BonusCategory.RESOURCE,
                description="Sustainable agricultural practices. Increases citizens and happiness with disease reduction.",
                required_resources={"Grain", "Fish", "Livestock"},
                citizen_percentage_bonus=0.05,
                happiness_bonus=2,
                disease_bonus=-1.0
            ),
            BonusType.IRRIGATION: Bonus(
                name="Irrigation",
                category=BonusCategory.RESOURCE,
                description="Advanced irrigation systems. Reduces land cost with agricultural production boost. Requires Water access.",
                required_resources={"Grain", "Water"},
                land_cost_bonus=-0.10,
                agricultural_production_bonus=0.20
            ),
            BonusType.AQUACULTURE: Bonus(
                name="Aquaculture",
                category=BonusCategory.RESOURCE,
                description="Fish farming expertise. Increases fish production with disease reduction. Requires Water access.",
                required_resources={"Fish", "Water"},
                fish_production_bonus=0.25,
                disease_bonus=-1.0
            ),
            BonusType.CROP_ROTATION: Bonus(
                name="Crop Rotation",
                category=BonusCategory.RESOURCE,
                description="Advanced crop management. Reduces land cost with agricultural production boost.",
                required_resources={"Grain", "Timber"},
                land_cost_bonus=-0.08,
                agricultural_production_bonus=0.15
            ),
            BonusType.DAIRY_INDUSTRY: Bonus(
                name="Dairy Industry",
                category=BonusCategory.RESOURCE,
                description="Dairy production expertise. Increases citizen income with happiness bonus. Requires Water access.",
                required_resources={"Livestock", "Grain", "Water"},
                citizen_income_bonus=2.0,
                happiness_bonus=1
            ),
            # Resource Bonuses - Industrial
            BonusType.IRON_PRODUCTION: Bonus(
                name="Iron Production",
                category=BonusCategory.RESOURCE,
                description="Advanced iron production capabilities. Reduces infrastructure, tank, and wonder costs.",
                required_resources={"Iron", "Coal"},
                infrastructure_cost_bonus=-0.06,
                tank_cost_bonus=-0.08,
                wonder_cost_bonus=-0.04
            ),
            BonusType.CONCRETE_INDUSTRY: Bonus(
                name="Concrete Industry",
                category=BonusCategory.RESOURCE,
                description="Concrete production expertise. Reduces infrastructure cost and upkeep. Requires Water access.",
                required_resources={"Limestone", "Iron", "Timber", "Water"},
                infrastructure_cost_bonus=-0.08,
                infrastructure_upkeep_bonus=-0.04
            ),
            BonusType.FUEL_REFINING: Bonus(
                name="Fuel Refining",
                category=BonusCategory.RESOURCE,
                description="Advanced fuel refining. Reduces infrastructure, aircraft, and ship upkeep.",
                required_resources={"Oil", "Lead"},
                infrastructure_upkeep_bonus=-0.06,
                aircraft_upkeep_bonus=-0.08,
                ship_upkeep_bonus=-0.06
            ),
            BonusType.CHEMICAL_INDUSTRY: Bonus(
                name="Chemical Industry",
                category=BonusCategory.RESOURCE,
                description="Chemical production expertise. Reduces improvement and infrastructure build costs. Requires Water access.",
                required_resources={"Copper", "Lead", "Limestone", "Water"},
                improvement_build_cost_bonus=-0.08,
                infrastructure_cost_bonus=-0.04
            ),
            BonusType.HEAVY_INDUSTRY: Bonus(
                name="Heavy Industry",
                category=BonusCategory.RESOURCE,
                description="Heavy manufacturing capabilities. Reduces tank cost with unit damage bonus.",
                required_resources={"Iron", "Coal", "Copper"},
                tank_cost_bonus=-0.06,
                military_unit_damage_bonus=0.03
            ),
            BonusType.ADVANCED_MANUFACTURING: Bonus(
                name="Advanced Manufacturing",
                category=BonusCategory.RESOURCE,
                description="Advanced manufacturing techniques. Reduces aircraft, ship, and improvement costs. Requires Water access.",
                required_resources={"Titanium", "Water"},
                aircraft_cost_bonus=-0.10,
                ship_cost_bonus=-0.08,
                improvement_upkeep_bonus=-0.05
            ),
            BonusType.HYDROELECTRIC_POWER: Bonus(
                name="Hydroelectric Power",
                category=BonusCategory.RESOURCE,
                description="Hydroelectric energy generation. Reduces infrastructure upkeep with power plant efficiency. Requires Water access.",
                required_resources={"Iron", "Water"},
                infrastructure_upkeep_bonus=-0.04,
                power_plant_efficiency_bonus=0.08
            ),
            # Resource Bonuses - Luxury
            # TEXTILE_INDUSTRY removed (required Cotton, Silk, Dyes - all deleted)
            BonusType.PRECIOUS_METALS_TRADE: Bonus(
                name="Precious Metals Trade",
                category=BonusCategory.RESOURCE,
                description="Precious metals trading expertise. Increases citizen income, commerce, and bank interest.",
                required_resources={"Gold", "Gemstones"},
                citizen_income_bonus=4.0,
                commerce_income_bonus=0.06,
                bank_interest_bonus=0.03
            ),
            BonusType.FINE_SPIRITS: Bonus(
                name="Fine Spirits",
                category=BonusCategory.RESOURCE,
                description="Alcoholic beverage production. Increases happiness, citizen income, and tax income.",
                required_resources={"Grain", "Spices", "Copper"},
                happiness_bonus=3,
                citizen_income_bonus=1.50,
                tax_income_bonus=0.04
            ),
            BonusType.EXOTIC_GOODS: Bonus(
                name="Exotic Goods",
                category=BonusCategory.RESOURCE,
                description="Exotic goods trading. Increases happiness and commerce income.",
                required_resources={"Spices"},
                happiness_bonus=4,
                commerce_income_bonus=0.05
            ),
            BonusType.JEWELRY_CRAFTING: Bonus(
                name="Jewelry Crafting",
                category=BonusCategory.RESOURCE,
                description="Jewelry making expertise. Increases citizen income and happiness.",
                required_resources={"Gold", "Gemstones"},
                citizen_income_bonus=5.0,
                happiness_bonus=3
            ),
            # Resource Bonuses - Military
            BonusType.GUNPOWDER: Bonus(
                name="Gunpowder",
                category=BonusCategory.RESOURCE,
                description="Gunpowder expertise for warfare. Increases soldier efficiency, reduces missile cost, increases tank damage.",
                required_resources={"Lead", "Coal", "Iron"},
                soldier_efficiency_bonus=0.08,
                missile_cost_bonus=-0.10,
                tank_damage_bonus=0.05
            ),
            BonusType.ARMOR_PLATING: Bonus(
                name="Armor Plating",
                category=BonusCategory.RESOURCE,
                description="Advanced armor production. Increases tank efficiency, reduces ship cost, increases aircraft damage resistance.",
                required_resources={"Titanium", "Iron"},
                tank_efficiency_bonus=0.10,
                ship_cost_bonus=-0.06,
                aircraft_damage_resistance_bonus=0.08
            ),
            # ADVANCED_ALLOYS removed (required Tungsten, Titanium, Aluminum - Tungsten and Aluminum deleted)
            BonusType.NUCLEAR_CAPABILITY: Bonus(
                name="Nuclear Capability",
                category=BonusCategory.RESOURCE,
                description="Nuclear weapons development. Enables nuclear weapons with tech and income bonuses.",
                required_resources={"Uranium"},
                enables_nuclear_weapons=True,
                technology_cost_bonus=-0.06,
                citizen_income_bonus=3.0
            ),
            BonusType.BALLISTIC_TECHNOLOGY: Bonus(
                name="Ballistic Technology",
                category=BonusCategory.RESOURCE,
                description="Ballistic missile expertise. Increases missile damage with cost reduction.",
                required_resources={"Lead", "Uranium"},
                missile_damage_bonus=0.15,
                missile_cost_bonus=-0.08
            ),
            # Resource Bonuses - Strategic
            BonusType.MEDICAL_RESEARCH: Bonus(
                name="Medical Research",
                category=BonusCategory.RESOURCE,
                description="Medical research capabilities. Reduces disease, war casualties, increases hospital effectiveness.",
                required_resources={"Copper", "Fish"},
                disease_bonus=-3.0,
                war_casualty_rate_bonus=-0.08,
                hospital_effectiveness_bonus=0.15
            ),
            BonusType.FERTILIZER_PRODUCTION: Bonus(
                name="Fertilizer Production",
                category=BonusCategory.RESOURCE,
                description="Fertilizer production expertise. Increases basic resource production with land cost reduction. Requires Water access.",
                required_resources={"Lead", "Grain", "Limestone", "Water"},
                basic_resource_production_bonus=0.15,
                land_cost_bonus=-0.08
            ),
            BonusType.ENERGY_INDEPENDENCE: Bonus(
                name="Energy Independence",
                category=BonusCategory.RESOURCE,
                description="Energy self-sufficiency. Reduces infrastructure upkeep with power plant efficiency.",
                required_resources={"Coal", "Oil", "Uranium"},
                infrastructure_upkeep_bonus=-0.08,
                power_plant_efficiency_bonus=0.10
            ),
            # HIGH_TECH_INDUSTRY removed (required Cobalt, Lithium, Titanium - Cobalt and Lithium deleted)
            # GREEN_ENERGY removed (required Cobalt, Lithium, Aluminum, Water - all deleted or Water removed)
            BonusType.WATER_PURIFICATION: Bonus(
                name="Water Purification",
                category=BonusCategory.RESOURCE,
                description="Water treatment expertise. Reduces disease and pollution with happiness bonus. Requires Water access.",
                required_resources={"Limestone", "Water"},
                disease_bonus=-2.0,
                happiness_bonus=1,
                pollution_bonus=-1.0
            ),
            BonusType.HYDRO_ENGINEERING: Bonus(
                name="Hydro Engineering",
                category=BonusCategory.RESOURCE,
                description="Hydroelectric engineering expertise. Reduces infrastructure cost with water production boost. Requires Water access.",
                required_resources={"Iron", "Copper", "Water"},
                infrastructure_cost_bonus=-0.05,
                water_production_bonus=0.25
            ),
            # Improvement Bonuses - Power
            BonusType.EFFICIENT_GRID: Bonus(
                name="Efficient Grid",
                category=BonusCategory.IMPROVEMENT,
                description="Efficient power distribution. Increases power plant efficiency.",
                required_improvements={"Any Power Plant"},
                power_plant_efficiency_bonus=0.05
            ),
            BonusType.CLEAN_ENERGY: Bonus(
                name="Clean Energy",
                category=BonusCategory.IMPROVEMENT,
                description="Clean energy production. Reduces pollution with environment bonus.",
                required_improvements={"Uranium Power Plant", "Wind Power", "Water Power"},
                pollution_bonus=-1.0,
                environment_bonus=1.0
            ),
            BonusType.DUAL_POWER: Bonus(
                name="Dual Power",
                category=BonusCategory.IMPROVEMENT,
                description="Dual power plant setup. Increases power plant efficiency.",
                required_improvements={"2 Power Plants"},
                power_plant_efficiency_bonus=0.08
            ),
            # Improvement Bonuses - Trade
            BonusType.TRADE_NETWORK: Bonus(
                name="Trade Network",
                category=BonusCategory.IMPROVEMENT,
                description="Trade infrastructure. Increases trade income and resource production.",
                required_improvements={"Trade Post"},
                trade_income_bonus=0.03,
                resource_production_bonus=0.02
            ),
            BonusType.EXTRACTION_MASTERY: Bonus(
                name="Extraction Mastery",
                category=BonusCategory.IMPROVEMENT,
                description="Resource extraction expertise. Increases resource production.",
                required_improvements={"Extraction Complex"},
                resource_production_bonus=0.05
            ),
            BonusType.PROCESSING_EFFICIENCY: Bonus(
                name="Processing Efficiency",
                category=BonusCategory.IMPROVEMENT,
                description="Resource processing expertise. Increases resource production.",
                required_improvements={"Processing Plant"},
                resource_production_bonus=0.08
            ),
            BonusType.INDUSTRIAL_POWER: Bonus(
                name="Industrial Power",
                category=BonusCategory.IMPROVEMENT,
                description="Industrial extraction capabilities. Increases resource production with upkeep reduction.",
                required_improvements={"Industrial Extractor"},
                resource_production_bonus=0.12,
                improvement_upkeep_bonus=-0.03
            ),
            BonusType.REFINED_PRODUCTION: Bonus(
                name="Refined Production",
                category=BonusCategory.IMPROVEMENT,
                description="Advanced refining capabilities. Increases resource production with project cost reduction.",
                required_improvements={"Advanced Refinery"},
                resource_production_bonus=0.18,
                project_cost_bonus=-0.04
            ),
            BonusType.HARBOR_TRADE: Bonus(
                name="Harbor Trade",
                category=BonusCategory.IMPROVEMENT,
                description="Harbor infrastructure. Increases trade income with ship upkeep reduction.",
                required_improvements={"National Harbor"},
                trade_income_bonus=0.05,
                ship_upkeep_bonus=-0.05
            ),
            BonusType.MARKET_MASTERY: Bonus(
                name="Market Mastery",
                category=BonusCategory.IMPROVEMENT,
                description="Market infrastructure. Increases resource production and trade income.",
                required_improvements={"Merchant Exchange"},
                resource_production_bonus=0.06,
                trade_income_bonus=0.04
            ),
            BonusType.STORAGE_CAPACITY: Bonus(
                name="Storage Capacity",
                category=BonusCategory.IMPROVEMENT,
                description="Storage infrastructure. Increases stockpile capacity.",
                required_improvements={"National Warehouse"},
                stockpile_capacity_bonus=0.50
            ),
            BonusType.IRRIGATION_BONUS: Bonus(
                name="Irrigation Bonus",
                category=BonusCategory.IMPROVEMENT,
                description="Irrigation infrastructure. Increases agricultural production.",
                required_improvements={"Irrigation Network"},
                agricultural_production_bonus=0.10
            ),
            BonusType.MINING_EFFICIENCY: Bonus(
                name="Mining Efficiency",
                category=BonusCategory.IMPROVEMENT,
                description="Mining infrastructure. Increases industrial production.",
                required_improvements={"Mining Network"},
                industrial_production_bonus=0.12
            ),
            BonusType.STRATEGIC_EXTRACTION: Bonus(
                name="Strategic Extraction",
                category=BonusCategory.IMPROVEMENT,
                description="Strategic resource extraction. Increases strategic production with tech cost reduction.",
                required_improvements={"Strategic Mining Facility"},
                strategic_production_bonus=0.15,
                technology_cost_bonus=-0.03
            ),
            # Improvement Bonuses - Civil
            BonusType.HEALTHCARE_NETWORK: Bonus(
                name="Healthcare Network",
                category=BonusCategory.IMPROVEMENT,
                description="Healthcare infrastructure. Reduces disease.",
                required_improvements={"National Clinic Network"},
                disease_bonus=-1.5
            ),
            BonusType.ADVANCED_HEALTHCARE: Bonus(
                name="Advanced Healthcare",
                category=BonusCategory.IMPROVEMENT,
                description="Advanced healthcare infrastructure. Reduces disease with happiness bonus.",
                required_improvements={"National Hospital System"},
                disease_bonus=-3.0,
                happiness_bonus=1
            ),
            BonusType.MEDICAL_EXCELLENCE: Bonus(
                name="Medical Excellence",
                category=BonusCategory.IMPROVEMENT,
                description="Top-tier medical infrastructure. Reduces disease with hospital effectiveness bonus.",
                required_improvements={"National Medical Center"},
                disease_bonus=-5.0,
                hospital_effectiveness_bonus=0.10
            ),
            BonusType.LAW_ENFORCEMENT: Bonus(
                name="Law Enforcement",
                category=BonusCategory.IMPROVEMENT,
                description="Police infrastructure. Reduces crime.",
                required_improvements={"National Police Force"},
                crime_bonus=-2.0
            ),
            BonusType.JUSTICE_SYSTEM: Bonus(
                name="Justice System",
                category=BonusCategory.IMPROVEMENT,
                description="Judicial infrastructure. Reduces crime with happiness bonus.",
                required_improvements={"National Judiciary"},
                crime_bonus=-3.5,
                happiness_bonus=1
            ),
            BonusType.ENVIRONMENTAL_PROTECTION: Bonus(
                name="Environmental Protection",
                category=BonusCategory.IMPROVEMENT,
                description="Environmental infrastructure. Reduces pollution with environment bonus.",
                required_improvements={"National Recycling Program"},
                pollution_bonus=-2.0,
                environment_bonus=1.0
            ),
            BonusType.SANITATION: Bonus(
                name="Sanitation",
                category=BonusCategory.IMPROVEMENT,
                description="Sanitation infrastructure. Reduces disease and pollution.",
                required_improvements={"National Sewage System"},
                disease_bonus=-2.5,
                pollution_bonus=-1.0
            ),
            BonusType.PUBLIC_TRANSIT: Bonus(
                name="Public Transit",
                category=BonusCategory.IMPROVEMENT,
                description="Public transportation infrastructure. Reduces pollution with happiness bonus.",
                required_improvements={"National Subway System"},
                pollution_bonus=-2.0,
                happiness_bonus=1
            ),
            BonusType.EMERGENCY_SERVICES: Bonus(
                name="Emergency Services",
                category=BonusCategory.IMPROVEMENT,
                description="Emergency response infrastructure. Reduces disaster damage.",
                required_improvements={"National Fire Department"},
                disaster_damage_bonus=-0.06
            ),
            BonusType.DISASTER_RESPONSE: Bonus(
                name="Disaster Response",
                category=BonusCategory.IMPROVEMENT,
                description="Advanced disaster response. Reduces all disaster damage and disease.",
                required_improvements={"National Emergency Agency"},
                disaster_damage_bonus=-0.12,
                disease_bonus=-1.0
            ),
            BonusType.GREEN_CITIES: Bonus(
                name="Green Cities",
                category=BonusCategory.IMPROVEMENT,
                description="Urban green spaces. Increases environment and happiness per city, reduces pollution.",
                required_improvements={"National Park System"},
                environment_bonus=0.5,
                happiness_bonus=0.5,
                pollution_bonus=-0.5
            ),
            # Improvement Bonuses - Commerce
            BonusType.LOCAL_MARKETS: Bonus(
                name="Local Markets",
                category=BonusCategory.IMPROVEMENT,
                description="Local market infrastructure. Increases commerce income per citizen.",
                required_improvements={"National Market Network"},
                commerce_income_per_citizen=0.20
            ),
            BonusType.RETAIL_CHAINS: Bonus(
                name="Retail Chains",
                category=BonusCategory.IMPROVEMENT,
                description="Retail infrastructure. Increases commerce income per citizen.",
                required_improvements={"National Supermarket Chain"},
                commerce_income_per_citizen=0.50
            ),
            BonusType.BANKING_SYSTEM: Bonus(
                name="Banking System",
                category=BonusCategory.IMPROVEMENT,
                description="Banking infrastructure. Increases commerce income and bank interest.",
                required_improvements={"National Bank"},
                commerce_income_per_citizen=1.0,
                bank_interest_bonus=0.01
            ),
            BonusType.SHOPPING_CENTERS: Bonus(
                name="Shopping Centers",
                category=BonusCategory.IMPROVEMENT,
                description="Shopping infrastructure. Increases commerce income per citizen.",
                required_improvements={"National Shopping Districts"},
                commerce_income_per_citizen=2.0
            ),
            BonusType.LUXURY_RETAIL: Bonus(
                name="Luxury Retail",
                category=BonusCategory.IMPROVEMENT,
                description="Luxury retail infrastructure. Increases commerce income with happiness bonus.",
                required_improvements={"National Grand Mall"},
                commerce_income_per_citizen=3.50,
                happiness_bonus=0.5
            ),
            BonusType.ENTERTAINMENT: Bonus(
                name="Entertainment",
                category=BonusCategory.IMPROVEMENT,
                description="Entertainment infrastructure. Increases commerce income with happiness bonus.",
                required_improvements={"National Sports Arenas"},
                commerce_income_per_citizen=4.0,
                happiness_bonus=1
            ),
            BonusType.TRADE_HUB: Bonus(
                name="Trade Hub",
                category=BonusCategory.IMPROVEMENT,
                description="Trade hub infrastructure. Increases commerce income and trade income.",
                required_improvements={"National Trade Exchange"},
                commerce_income_per_citizen=2.50,
                trade_income_bonus=0.04
            ),
            BonusType.FINANCIAL_CENTER: Bonus(
                name="Financial Center",
                category=BonusCategory.IMPROVEMENT,
                description="Financial infrastructure. Increases commerce income and bank interest.",
                required_improvements={"National Stock Exchange"},
                commerce_income_per_citizen=3.0,
                bank_interest_bonus=0.015
            ),
            BonusType.TOURISM: Bonus(
                name="Tourism",
                category=BonusCategory.IMPROVEMENT,
                description="Tourism infrastructure. Increases commerce income with happiness bonus.",
                required_improvements={"National Tourism Bureau"},
                commerce_income_per_citizen=1.0,
                happiness_bonus=0.5
            ),
            BonusType.GAMING_INDUSTRY: Bonus(
                name="Gaming Industry",
                category=BonusCategory.IMPROVEMENT,
                description="Gaming infrastructure. Increases commerce income with crime increase.",
                required_improvements={"National Casino"},
                commerce_income_per_citizen=2.0,
                crime_bonus=0.5
            ),
            # Improvement Bonuses - Military
            BonusType.BASIC_TRAINING: Bonus(
                name="Basic Training",
                category=BonusCategory.IMPROVEMENT,
                description="Basic military training. Increases soldier efficiency.",
                required_improvements={"Training Grounds"},
                soldier_efficiency_bonus=0.03
            ),
            BonusType.MILITARY_TRAINING: Bonus(
                name="Military Training",
                category=BonusCategory.IMPROVEMENT,
                description="Military training infrastructure. Increases soldier efficiency.",
                required_improvements={"Barracks"},
                soldier_efficiency_bonus=0.05
            ),
            BonusType.COMBAT_READINESS: Bonus(
                name="Combat Readiness",
                category=BonusCategory.IMPROVEMENT,
                description="Combat readiness infrastructure. Increases soldier efficiency with upkeep reduction.",
                required_improvements={"Armory"},
                soldier_efficiency_bonus=0.07,
                soldier_upkeep_bonus=-0.04
            ),
            BonusType.ELITE_TRAINING: Bonus(
                name="Elite Training",
                category=BonusCategory.IMPROVEMENT,
                description="Elite military training. Increases soldier efficiency with upkeep reduction.",
                required_improvements={"Military Academy"},
                soldier_efficiency_bonus=0.10,
                soldier_upkeep_bonus=-0.06
            ),
            BonusType.SPECIAL_FORCES: Bonus(
                name="Special Forces",
                category=BonusCategory.IMPROVEMENT,
                description="Special forces infrastructure. Maximum soldier efficiency with upkeep reduction.",
                required_improvements={"Special Forces HQ"},
                soldier_efficiency_bonus=0.12,
                soldier_upkeep_bonus=-0.08
            ),
            BonusType.TANK_PRODUCTION: Bonus(
                name="Tank Production",
                category=BonusCategory.IMPROVEMENT,
                description="Tank production infrastructure. Increases tank efficiency.",
                required_improvements={"Tank Workshop"},
                tank_efficiency_bonus=0.03
            ),
            BonusType.ARMOR_MANUFACTURING: Bonus(
                name="Armor Manufacturing",
                category=BonusCategory.IMPROVEMENT,
                description="Armor manufacturing infrastructure. Increases tank efficiency with cost reduction.",
                required_improvements={"Tank Factory"},
                tank_efficiency_bonus=0.06,
                tank_cost_bonus=-0.06
            ),
            BonusType.WEAPONS_DEVELOPMENT: Bonus(
                name="Weapons Development",
                category=BonusCategory.IMPROVEMENT,
                description="Weapons development infrastructure. Increases tank efficiency with cost reduction.",
                required_improvements={"Weapons Forge"},
                tank_efficiency_bonus=0.08,
                tank_cost_bonus=-0.08
            ),
            BonusType.ADVANCED_ARMOR: Bonus(
                name="Advanced Armor",
                category=BonusCategory.IMPROVEMENT,
                description="Advanced armor infrastructure. Increases tank efficiency with cost reduction.",
                required_improvements={"Armor Foundry"},
                tank_efficiency_bonus=0.10,
                tank_cost_bonus=-0.10
            ),
            BonusType.TANK_SUPREMACY: Bonus(
                name="Tank Supremacy",
                category=BonusCategory.IMPROVEMENT,
                description="Top-tier tank infrastructure. Maximum tank efficiency with cost reduction.",
                required_improvements={"Advanced Tank Plant"},
                tank_efficiency_bonus=0.12,
                tank_cost_bonus=-0.12
            ),
            BonusType.AVIATION: Bonus(
                name="Aviation",
                category=BonusCategory.IMPROVEMENT,
                description="Basic aviation infrastructure. Increases aircraft efficiency.",
                required_improvements={"Airfield"},
                aircraft_efficiency_bonus=0.03
            ),
            BonusType.AIR_SUPERIORITY: Bonus(
                name="Air Superiority",
                category=BonusCategory.IMPROVEMENT,
                description="Air force infrastructure. Increases aircraft efficiency with dogfight bonus.",
                required_improvements={"Air Force Base"},
                aircraft_efficiency_bonus=0.06,
                dogfight_bonus=0.05
            ),
            BonusType.ADVANCED_AVIATION: Bonus(
                name="Advanced Aviation",
                category=BonusCategory.IMPROVEMENT,
                description="Advanced aviation infrastructure. Increases aircraft efficiency with cost reduction.",
                required_improvements={"Advanced Aviation Hub"},
                aircraft_efficiency_bonus=0.08,
                aircraft_cost_bonus=-0.08
            ),
            BonusType.STEALTH_TECH: Bonus(
                name="Stealth Tech",
                category=BonusCategory.IMPROVEMENT,
                description="Stealth technology infrastructure. Increases aircraft efficiency with cost reduction.",
                required_improvements={"Stealth Fighter Base"},
                aircraft_efficiency_bonus=0.10,
                aircraft_cost_bonus=-0.10
            ),
            BonusType.AIR_DOMINANCE: Bonus(
                name="Air Dominance",
                category=BonusCategory.IMPROVEMENT,
                description="Top-tier air infrastructure. Maximum aircraft efficiency with cost reduction.",
                required_improvements={"Supersonic Command"},
                aircraft_efficiency_bonus=0.12,
                aircraft_cost_bonus=-0.12
            ),
            BonusType.NAVAL_CONSTRUCTION: Bonus(
                name="Naval Construction",
                category=BonusCategory.IMPROVEMENT,
                description="Basic naval infrastructure. Increases ship efficiency.",
                required_improvements={"Drydock"},
                ship_efficiency_bonus=0.03
            ),
            BonusType.FLEET_BASE: Bonus(
                name="Fleet Base",
                category=BonusCategory.IMPROVEMENT,
                description="Fleet infrastructure. Increases ship efficiency with ship purchase bonus.",
                required_improvements={"Naval Base"},
                ship_efficiency_bonus=0.06,
                ship_purchase_per_tick=1.0
            ),
            BonusType.ADVANCED_SHIPBUILDING: Bonus(
                name="Advanced Shipbuilding",
                category=BonusCategory.IMPROVEMENT,
                description="Advanced shipbuilding infrastructure. Increases ship efficiency with cost reduction.",
                required_improvements={"Advanced Shipyard"},
                ship_efficiency_bonus=0.08,
                ship_cost_bonus=-0.10
            ),
            BonusType.NAVAL_ACADEMY: Bonus(
                name="Naval Academy",
                category=BonusCategory.IMPROVEMENT,
                description="Naval training infrastructure. Increases ship efficiency with cost reduction.",
                required_improvements={"Naval Academy"},
                ship_efficiency_bonus=0.10,
                ship_cost_bonus=-0.12
            ),
            BonusType.FLEET_COMMAND: Bonus(
                name="Fleet Command",
                category=BonusCategory.IMPROVEMENT,
                description="Top-tier naval infrastructure. Maximum ship efficiency with cost reduction.",
                required_improvements={"Fleet Command"},
                ship_efficiency_bonus=0.12,
                ship_cost_bonus=-0.15
            ),
            # Improvement Bonuses - Science
            BonusType.EDUCATION: Bonus(
                name="Education",
                category=BonusCategory.IMPROVEMENT,
                description="Basic education infrastructure. Reduces technology cost with happiness bonus.",
                required_improvements={"National School System"},
                technology_cost_bonus=-0.015,
                happiness_bonus=0.5
            ),
            BonusType.HIGHER_EDUCATION: Bonus(
                name="Higher Education",
                category=BonusCategory.IMPROVEMENT,
                description="Higher education infrastructure. Reduces technology cost with happiness bonus.",
                required_improvements={"National University"},
                technology_cost_bonus=-0.03,
                happiness_bonus=0.5
            ),
            BonusType.RESEARCH_POWER: Bonus(
                name="Research Power",
                category=BonusCategory.IMPROVEMENT,
                description="Research infrastructure. Reduces technology cost with tech income bonus.",
                required_improvements={"National Research Institute"},
                technology_cost_bonus=-0.045,
                tech_income_bonus=0.05
            ),
            BonusType.ADVANCED_RESEARCH: Bonus(
                name="Advanced Research",
                category=BonusCategory.IMPROVEMENT,
                description="Advanced research infrastructure. Reduces technology cost with tech income bonus.",
                required_improvements={"National Advanced Lab"},
                technology_cost_bonus=-0.07,
                tech_income_bonus=0.08
            ),
            BonusType.DIGITAL_AGE: Bonus(
                name="Digital Age",
                category=BonusCategory.IMPROVEMENT,
                description="Digital infrastructure. Increases commerce income with spy defense bonus.",
                required_improvements={"National Internet Hub"},
                commerce_income_per_citizen=1.50,
                spy_defense_bonus=0.04
            ),
            BonusType.SPACE_PROGRAM: Bonus(
                name="Space Program",
                category=BonusCategory.IMPROVEMENT,
                description="Space infrastructure. Increases tech income.",
                required_improvements={"National Space Launch Facility"},
                tech_income_bonus=0.08
            ),
            BonusType.QUANTUM_COMPUTING: Bonus(
                name="Quantum Computing",
                category=BonusCategory.IMPROVEMENT,
                description="Quantum computing infrastructure. Reduces technology cost with tech income bonus.",
                required_improvements={"National Quantum Research Center"},
                technology_cost_bonus=-0.10,
                tech_income_bonus=0.10
            ),
            # Improvement Bonuses - Infrastructure
            BonusType.BASIC_ROADS: Bonus(
                name="Basic Roads",
                category=BonusCategory.IMPROVEMENT,
                description="Basic road infrastructure. Reduces infrastructure upkeep.",
                required_improvements={"National Road Network"},
                infrastructure_upkeep_bonus=-0.015
            ),
            BonusType.HIGHWAYS: Bonus(
                name="Highways",
                category=BonusCategory.IMPROVEMENT,
                description="Highway infrastructure. Reduces infrastructure upkeep with commerce bonus.",
                required_improvements={"National Highway System"},
                infrastructure_upkeep_bonus=-0.03,
                commerce_income_per_citizen=0.15
            ),
            BonusType.SUPERHIGHWAYS: Bonus(
                name="Superhighways",
                category=BonusCategory.IMPROVEMENT,
                description="Superhighway infrastructure. Reduces infrastructure upkeep with commerce bonus.",
                required_improvements={"National Superhighway"},
                infrastructure_upkeep_bonus=-0.045,
                commerce_income_per_citizen=0.35
            ),
            BonusType.AIR_TRAVEL: Bonus(
                name="Air Travel",
                category=BonusCategory.IMPROVEMENT,
                description="Airport infrastructure. Increases commerce income with city cost reduction.",
                required_improvements={"National Airport"},
                commerce_income_per_citizen=0.90,
                new_city_cost_bonus=-0.04
            ),
            BonusType.POWER_DISTRIBUTION: Bonus(
                name="Power Distribution",
                category=BonusCategory.IMPROVEMENT,
                description="Power grid infrastructure. Increases power plant efficiency.",
                required_improvements={"National Power Grid"},
                power_plant_efficiency_bonus=0.08
            ),
            BonusType.CLEAN_WATER: Bonus(
                name="Clean Water",
                category=BonusCategory.IMPROVEMENT,
                description="Water treatment infrastructure. Reduces disease and pollution.",
                required_improvements={"National Water Treatment"},
                disease_bonus=-1.5,
                pollution_bonus=-1.0
            ),
            BonusType.BORDER_SECURITY: Bonus(
                name="Border Security",
                category=BonusCategory.IMPROVEMENT,
                description="Border infrastructure. Increases spy defense and city resistance.",
                required_improvements={"National Border Walls"},
                spy_defense_bonus=0.10,
                city_resistance_bonus=8.0
            ),
            BonusType.FLOOD_PROTECTION: Bonus(
                name="Flood Protection",
                category=BonusCategory.IMPROVEMENT,
                description="Flood protection infrastructure. Reduces natural disaster damage.",
                required_improvements={"National Flood Barriers"},
                natural_disaster_damage_bonus=-0.15
            ),
            BonusType.COMMUNICATIONS: Bonus(
                name="Communications",
                category=BonusCategory.IMPROVEMENT,
                description="Communications infrastructure. Increases commerce income with spy defense bonus.",
                required_improvements={"National Telecommunications"},
                commerce_income_per_citizen=0.60,
                spy_defense_bonus=0.03
            ),
            # Wonder Bonuses - Economic
            BonusType.AGRICULTURAL_DEVELOPMENT: Bonus(
                name="Agricultural Development",
                category=BonusCategory.WONDER,
                description="Agricultural development program. Increases land and citizen income with land bonus multiplier.",
                required_wonders={"Agriculture Development Program"},
                land_percentage_bonus=0.10,
                citizen_income_bonus=1.50,
                special_effect="Land citizen bonus ×2"
            ),
            BonusType.CENTRAL_BANKING: Bonus(
                name="Central Banking",
                category=BonusCategory.WONDER,
                description="Central banking system. Increases tax income and bank interest.",
                required_wonders={"Central Bank"},
                tax_income_bonus=0.08,
                bank_interest_bonus=0.04
            ),
            BonusType.GRAND_MONUMENT: Bonus(
                name="Grand Monument",
                category=BonusCategory.WONDER,
                description="Grand monument attraction. Increases happiness with tourism income.",
                required_wonders={"Grand Monument"},
                happiness_bonus=2,
                tourism_income_per_citizen=0.75
            ),
            BonusType.NATIONAL_TRADE: Bonus(
                name="National Trade",
                category=BonusCategory.WONDER,
                description="National trade center. Increases trade income and commerce per citizen.",
                required_wonders={"National Trade Center"},
                trade_income_bonus=0.12,
                commerce_income_per_citizen=1.50
            ),
            BonusType.GLOBAL_FINANCE: Bonus(
                name="Global Finance",
                category=BonusCategory.WONDER,
                description="World stock market. Increases commerce and citizen income.",
                required_wonders={"World Stock Market"},
                commerce_income_per_citizen=4.0,
                citizen_income_bonus=2.50
            ),
            BonusType.DIGITAL_INFRASTRUCTURE: Bonus(
                name="Digital Infrastructure",
                category=BonusCategory.WONDER,
                description="Internet infrastructure. Reduces technology cost with commerce bonus.",
                required_wonders={"Internet Superhighway"},
                technology_cost_bonus=-0.08,
                commerce_income_per_citizen=2.50
            ),
            BonusType.SPACE_ECONOMY: Bonus(
                name="Space Economy",
                category=BonusCategory.WONDER,
                description="Space agency. Increases tech income.",
                required_wonders={"Space Agency"},
                tech_income_bonus=0.12
            ),
            BonusType.DISASTER_RESILIENCE: Bonus(
                name="Disaster Resilience",
                category=BonusCategory.WONDER,
                description="Disaster relief agency. Reduces disaster damage and recovery time.",
                required_wonders={"Disaster Relief Agency"},
                random_disaster_damage_bonus=-0.40,
                recovery_time_bonus=-0.30
            ),
            BonusType.RESEARCH_POWERHOUSE: Bonus(
                name="Research Powerhouse",
                category=BonusCategory.WONDER,
                description="National research complex. Reduces technology cost with tech income bonus.",
                required_wonders={"National Research Complex"},
                technology_cost_bonus=-0.12,
                tech_income_bonus=0.15
            ),
            BonusType.RELIGIOUS_HARMONY: Bonus(
                name="Religious Harmony",
                category=BonusCategory.WONDER,
                description="Great temple. Increases happiness and removes religion mismatch penalty.",
                required_wonders={"Great Temple"},
                happiness_bonus=4,
                religion_mismatch_penalty_removed=True
            ),
            BonusType.CHRISTIAN_HERITAGE: Bonus(
                name="Christian Heritage",
                category=BonusCategory.WONDER,
                description="Grand cathedral. Increases happiness and hospital effectiveness.",
                required_wonders={"Grand Cathedral"},
                happiness_bonus=5,
                hospital_effectiveness_bonus=0.15
            ),
            BonusType.ISLAMIC_HERITAGE: Bonus(
                name="Islamic Heritage",
                category=BonusCategory.WONDER,
                description="Grand mosque. Increases happiness with soldier upkeep reduction.",
                required_wonders={"Grand Mosque"},
                happiness_bonus=5,
                soldier_upkeep_bonus=-0.08
            ),
            BonusType.JEWISH_HERITAGE: Bonus(
                name="Jewish Heritage",
                category=BonusCategory.WONDER,
                description="Great synagogue. Increases happiness and citizen income.",
                required_wonders={"Great Synagogue"},
                happiness_bonus=4,
                citizen_income_bonus=3.50
            ),
            BonusType.EASTERN_HERITAGE: Bonus(
                name="Eastern Heritage",
                category=BonusCategory.WONDER,
                description="Grand pagoda. Increases happiness with war penalty reduction.",
                required_wonders={"Grand Pagoda"},
                happiness_bonus=5,
                war_happiness_penalty_reduction=0.40
            ),
            BonusType.EASTERN_SPIRITUALITY: Bonus(
                name="Eastern Spirituality",
                category=BonusCategory.WONDER,
                description="Great shrine. Increases happiness with environment bonus.",
                required_wonders={"Great Shrine"},
                happiness_bonus=4,
                environment_bonus=1.5
            ),
            BonusType.ENTERTAINMENT_CAPITAL: Bonus(
                name="Entertainment Capital",
                category=BonusCategory.WONDER,
                description="Colosseum attraction. Increases happiness with sports arena income bonus.",
                required_wonders={"Colosseum"},
                happiness_bonus=4,
                sports_arena_income_bonus=0.80
            ),
            BonusType.ENVIRONMENTAL_STEWARDSHIP: Bonus(
                name="Environmental Stewardship",
                category=BonusCategory.WONDER,
                description="National park system. Increases environment, happiness, and land bonus.",
                required_wonders={"National Park System"},
                environment_bonus=2.5,
                happiness_bonus=1.5,
                land_percentage_bonus=0.08
            ),
            # Wonder Bonuses - Social
            BonusType.UNIVERSAL_HEALTHCARE: Bonus(
                name="Universal Healthcare",
                category=BonusCategory.WONDER,
                description="Universal healthcare system. Reduces disease nationwide with happiness bonus.",
                required_wonders={"Universal Healthcare"},
                disease_nationwide=-4.0,
                happiness_bonus=2.50
            ),
            BonusType.PUBLIC_EDUCATION: Bonus(
                name="Public Education",
                category=BonusCategory.WONDER,
                description="Public education system. Reduces technology cost with happiness bonus.",
                required_wonders={"Public Education System"},
                technology_cost_bonus=-0.10,
                happiness_bonus=1.50
            ),
            BonusType.FREE_PRESS: Bonus(
                name="Free Press",
                category=BonusCategory.WONDER,
                description="Free press system. Increases happiness with spy defense bonus.",
                required_wonders={"Free Press"},
                happiness_bonus=3.50,
                spy_defense_bonus=0.12
            ),
            # Wonder Bonuses - Military
            BonusType.PENTAGON_COMMAND: Bonus(
                name="Pentagon Command",
                category=BonusCategory.WONDER,
                description="Pentagon command center. Reduces military upkeep with efficiency bonus.",
                required_wonders={"Pentagon"},
                military_upkeep_bonus=-0.12,
                all_military_efficiency_bonus=0.04
            ),
            BonusType.STRATEGIC_DEFENSE: Bonus(
                name="Strategic Defense",
                category=BonusCategory.WONDER,
                description="Strategic defense initiative. Increases missile/nuke intercept chance.",
                required_wonders={"Strategic Defense Initiative"},
                nuke_intercept_chance_bonus=0.35,
                special_effect="Missile intercept chance +35%"
            ),
            BonusType.WEAPONS_RESEARCH: Bonus(
                name="Weapons Research",
                category=BonusCategory.WONDER,
                description="Weapons research complex. Increases military unit and missile damage.",
                required_wonders={"Weapons Research Complex"},
                military_unit_damage_bonus=0.08,
                missile_damage_bonus=0.15
            ),
            BonusType.MILITARY_SATELLITES: Bonus(
                name="Military Satellites",
                category=BonusCategory.WONDER,
                description="Military satellite system. Increases spy success with enemy spy reduction.",
                required_wonders={"Military Satellite"},
                spy_success_bonus=0.15,
                enemy_spy_success_bonus=-0.15
            ),
            BonusType.FORTIFIED_NATION: Bonus(
                name="Fortified Nation",
                category=BonusCategory.WONDER,
                description="Fortified citadel. Reduces infrastructure war damage with city resistance bonus.",
                required_wonders={"Fortified Citadel"},
                infrastructure_war_damage_bonus=-0.15,
                city_resistance_bonus=12.0
            ),
            BonusType.NAVAL_SUPREMACY: Bonus(
                name="Naval Supremacy",
                category=BonusCategory.WONDER,
                description="Grand naval shipyard. Increases ship purchases with cost reduction.",
                required_wonders={"Grand Naval Shipyard"},
                ship_purchase_per_tick=1.50,
                ship_cost_bonus=-0.12
            ),
            BonusType.AIR_DEFENSE: Bonus(
                name="Air Defense",
                category=BonusCategory.WONDER,
                description="Air defense network. Reduces enemy airstrike damage with aircraft loss reduction.",
                required_wonders={"Air Defense Network"},
                enemy_airstrike_damage_bonus=-0.20,
                aircraft_losses_defense_bonus=-0.12
            ),
            BonusType.NUCLEAR_ARSENAL: Bonus(
                name="Nuclear Arsenal",
                category=BonusCategory.WONDER,
                description="Nuclear arsenal. Increases nuke damage and cap.",
                required_wonders={"Nuclear Arsenal"},
                nuke_damage_bonus=0.20,
                nuke_cap_bonus=1.50
            ),
            BonusType.CYBER_WARFARE: Bonus(
                name="Cyber Warfare",
                category=BonusCategory.WONDER,
                description="Cyber command center. Increases spy operations with counter-intel bonus.",
                required_wonders={"Cyber Command Center"},
                spy_operations_bonus=0.20,
                counter_intel_bonus=0.15
            ),
            BonusType.SPECIAL_OPERATIONS: Bonus(
                name="Special Operations",
                category=BonusCategory.WONDER,
                description="Special operations HQ. Increases ground attack with spy assassination bonus.",
                required_wonders={"Special Operations HQ"},
                ground_attack_bonus=0.12,
                spy_assassination_success_bonus=0.15
            ),
            BonusType.PROPAGANDA: Bonus(
                name="Propaganda",
                category=BonusCategory.WONDER,
                description="Propaganda ministry. Removes war happiness penalty with enemy morale reduction.",
                required_wonders={"Propaganda Ministry"},
                war_happiness_penalty_reduction=1.0,
                enemy_morale_bonus=-0.08
            ),
            BonusType.IRON_DEFENSE: Bonus(
                name="Iron Defense",
                category=BonusCategory.WONDER,
                description="Iron curtain. Increases spy defense with border walls effect bonus.",
                required_wonders={"Iron Curtain"},
                spy_defense_bonus=0.25,
                border_walls_effect_bonus=0.80
            ),
            # Wonder Bonuses - Space
            BonusType.MOON_BASE: Bonus(
                name="Moon Base",
                category=BonusCategory.WONDER,
                description="Moon base. Increases tech income with happiness bonus.",
                required_wonders={"Moon Base"},
                tech_income_bonus=0.08,
                happiness_bonus=2
            ),
            BonusType.MARS_COLONY: Bonus(
                name="Mars Colony",
                category=BonusCategory.WONDER,
                description="Mars colony. Increases tech income, citizen income, and happiness.",
                required_wonders={"Mars Colony"},
                tech_income_bonus=0.10,
                citizen_income_bonus=3.0,
                happiness_bonus=2.50
            ),
            # Combination Bonuses - Industrial
            BonusType.INDUSTRIAL_EMPIRE: Bonus(
                name="Industrial Empire",
                category=BonusCategory.COMBINATION,
                description="Ultimate industrial synergy. Maximum cost reductions for infrastructure, improvements, and wonders.",
                required_bonuses={"Iron Production", "Concrete Industry", "Chemical Industry", "Industrial Extractor"},
                infrastructure_cost_bonus=-0.14,
                improvement_build_cost_bonus=-0.10,
                wonder_cost_bonus=-0.10
            ),
            BonusType.MANUFACTURING_HUB: Bonus(
                name="Manufacturing Hub",
                category=BonusCategory.COMBINATION,
                description="Advanced manufacturing synergy. Maximum military cost reductions with unit damage bonus.",
                required_bonuses={"Heavy Industry", "Advanced Manufacturing", "Refined Production"},
                tank_cost_bonus=-0.12,
                aircraft_cost_bonus=-0.14,
                ship_cost_bonus=-0.12,
                military_unit_damage_bonus=0.08
            ),
            BonusType.ENERGY_MASTERY: Bonus(
                name="Energy Mastery",
                category=BonusCategory.COMBINATION,
                description="Ultimate energy synergy. Maximum infrastructure upkeep reduction with power plant efficiency.",
                required_bonuses={"Energy Independence", "Clean Energy", "Dual Power", "Power Distribution"},
                infrastructure_upkeep_bonus=-0.12,
                power_plant_efficiency_bonus=0.18,
                pollution_bonus=-2.0
            ),
            # Combination Bonuses - Military
            BonusType.WAR_MACHINE: Bonus(
                name="War Machine",
                category=BonusCategory.COMBINATION,
                description="Ultimate military synergy. Maximum military efficiency and upkeep reductions.",
                required_bonuses={"Gunpowder", "Armor Plating", "Advanced Alloys", "Special Forces", "Tank Supremacy"},
                military_upkeep_bonus=-0.12,
                soldier_efficiency_bonus=0.08,
                airstrike_damage_bonus=0.08
            ),
            BonusType.NAVAL_DOMINANCE: Bonus(
                name="Naval Dominance",
                category=BonusCategory.COMBINATION,
                description="Ultimate naval synergy. Maximum ship efficiency and cost reductions.",
                required_bonuses={"Naval Academy", "Fleet Command", "Naval Supremacy", "Grand Naval Shipyard"},
                ship_efficiency_bonus=0.18,
                ship_cost_bonus=-0.20,
                naval_efficiency_bonus=0.10
            ),
            BonusType.AIR_SUPERIORITY_COMBO: Bonus(
                name="Air Superiority",
                category=BonusCategory.COMBINATION,
                description="Ultimate air synergy. Maximum aircraft efficiency and cost reductions.",
                required_bonuses={"Air Dominance", "Stealth Tech", "Supersonic Command", "Air Defense"},
                aircraft_efficiency_bonus=0.18,
                aircraft_cost_bonus=-0.20,
                dogfight_bonus=0.12
            ),
            BonusType.NUCLEAR_SUPERPOWER: Bonus(
                name="Nuclear Superpower",
                category=BonusCategory.COMBINATION,
                description="Ultimate nuclear synergy. Maximum nuke bonuses with research cost reduction.",
                required_bonuses={"Nuclear Capability", "Ballistic Technology", "Nuclear Arsenal", "Strategic Defense"},
                nuke_damage_bonus=0.25,
                nuke_intercept_chance_bonus=0.20,
                nuclear_research_cost_bonus=-0.20
            ),
            # Combination Bonuses - Economic
            BonusType.AFFLUENT_SOCIETY: Bonus(
                name="Affluent Society",
                category=BonusCategory.COMBINATION,
                description="Ultimate luxury synergy. Maximum citizen income, happiness, and commerce bonuses.",
                required_bonuses={"Textile Industry", "Precious Metals Trade", "Fine Spirits", "Luxury Retail", "Financial Center"},
                citizen_income_bonus=8.0,
                happiness_bonus=4,
                commerce_income_bonus=0.10
            ),
            BonusType.TRADE_EMPIRE: Bonus(
                name="Trade Empire",
                category=BonusCategory.COMBINATION,
                description="Ultimate trade synergy. Maximum trade and production bonuses.",
                required_bonuses={"Trade Network", "Harbor Trade", "Market Mastery", "National Trade", "Global Finance"},
                trade_income_bonus=0.20,
                resource_production_bonus=0.10,
                commerce_income_per_citizen=5.0
            ),
            BonusType.GOLDEN_AGE: Bonus(
                name="Golden Age",
                category=BonusCategory.COMBINATION,
                description="Ultimate prosperity synergy. Maximum income and happiness bonuses.",
                required_bonuses={"Affluent Society", "Exotic Goods", "Jewelry Crafting", "Grand Monument", "Entertainment Capital"},
                citizen_income_bonus=6.0,
                happiness_bonus=5,
                tax_income_bonus=0.06,
                citizen_percentage_bonus=0.04
            ),
            # Combination Bonuses - Technology
            BonusType.TECH_SUPREMACY: Bonus(
                name="Tech Supremacy",
                category=BonusCategory.COMBINATION,
                description="Ultimate technology synergy. Maximum tech bonuses with production increases.",
                required_bonuses={"High-Tech Industry", "Green Energy", "Advanced Research", "Quantum Computing", "Research Powerhouse"},
                technology_cost_bonus=-0.12,
                project_cost_bonus=-0.08,
                resource_production_bonus=0.08,
                tech_income_bonus=0.18
            ),
            BonusType.SPACE_AGE: Bonus(
                name="Space Age",
                category=BonusCategory.COMBINATION,
                description="Ultimate space synergy. Maximum space bonuses with advanced projects.",
                required_bonuses={"Space Program", "Space Economy", "Moon Base", "Mars Colony"},
                tech_income_bonus=0.20,
                technology_cost_bonus=-0.10,
                enables_advanced_space_projects=True
            ),
            # Combination Bonuses - Civil
            BonusType.THRIVING_NATION: Bonus(
                name="Thriving Nation",
                category=BonusCategory.COMBINATION,
                description="Ultimate civil synergy. Maximum citizen and health bonuses with war casualty reduction.",
                required_bonuses={"Sustainable Farming", "Medical Research", "Healthcare Network", "Green Cities", "Universal Healthcare"},
                citizen_percentage_bonus=0.06,
                disease_bonus=-2.50,
                happiness_bonus=3,
                war_casualty_rate_bonus=-0.06
            ),
            BonusType.HEALTHY_POPULATION: Bonus(
                name="Healthy Population",
                category=BonusCategory.COMBINATION,
                description="Ultimate health synergy. Maximum disease reduction with hospital effectiveness and recovery bonuses.",
                required_bonuses={"Medical Excellence", "Advanced Healthcare", "Sanitation", "Clean Water", "Disaster Resilience"},
                disease_nationwide=-4.0,
                hospital_effectiveness_bonus=0.20,
                recovery_time_bonus=-0.40
            ),
            # Combination Bonuses - Ultimate
            BonusType.WORLD_SUPERPOWER: Bonus(
                name="World Superpower",
                category=BonusCategory.COMBINATION,
                description="Ultimate synergy. Maximum bonuses across all categories for true world dominance.",
                required_bonuses={"War Machine", "Industrial Empire", "Tech Supremacy", "Golden Age", "Thriving Nation"},
                military_unit_damage_bonus=0.12,
                military_upkeep_bonus=-0.08,
                citizen_income_bonus=5.0,
                happiness_bonus=3,
                citizen_percentage_bonus=0.03,
                technology_cost_bonus=-0.06,
                infrastructure_cost_bonus=-0.06
            ),
            BonusType.GLOBAL_HEGEMON: Bonus(
                name="Global Hegemon",
                category=BonusCategory.COMBINATION,
                description="The ultimate achievement. Requires World Superpower plus nuclear, trade, space, and tech dominance.",
                required_bonuses={"World Superpower", "Nuclear Superpower", "Trade Empire", "Space Age"},
                military_unit_damage_bonus=0.08,
                nuke_damage_bonus=0.15,
                trade_income_bonus=0.15,
                tech_income_bonus=0.10,
                spy_defense_bonus=0.10
            ),
        }

    def get_bonus(self, bonus_type: BonusType) -> Bonus:
        """Get a bonus by type."""
        return self.bonuses[bonus_type]

    def get_all_bonuses(self) -> List[Bonus]:
        """Get all available bonuses."""
        return list(self.bonuses.values())


# Singleton instance
bonus_system = BonusSystem()
