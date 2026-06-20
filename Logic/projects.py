"""
Project System for Sovereign Nation Game

This module defines the Project components that provide
one-time permanent transformations or temporary boosts.
Unlike wonders, projects don't have tick upkeep.
"""

from dataclasses import dataclass
from typing import Dict, Optional
from enum import Enum


class ProjectCategory(Enum):
    """Categories of projects."""
    ECONOMIC = "Economic"
    COMMERCE = "Commerce"
    INFRASTRUCTURE = "Infrastructure"
    MILITARY = "Military"
    SCIENCE_SPACE = "Science & Space"
    SOCIAL = "Social"
    CIVIL = "Civil"


class ProjectType(Enum):
    """All available project types in the game."""
    # Economic Projects (6)
    RESOURCE_EXPANSION = "Resource Expansion"
    LAND_EXPANSION_PROGRAM = "Land Expansion Program"
    INDUSTRIAL_MODERNIZATION = "Industrial Modernization"
    FINANCIAL_DEREGULATION = "Financial Deregulation"
    CENTRAL_PLANNING = "Central Planning"
    ECONOMIC_STIMULUS_PACKAGE = "Economic Stimulus Package"
    # Commerce Projects (10)
    MARKET_LIBERALIZATION = "Market Liberalization"
    RETAIL_SECTOR_DEVELOPMENT = "Retail Sector Development"
    BANKING_SECTOR_REFORM = "Banking Sector Reform"
    URBAN_DEVELOPMENT_INITIATIVE = "Urban Development Initiative"
    LUXURY_RETAIL_DEVELOPMENT = "Luxury Retail Development"
    SPORTS_INFRASTRUCTURE_DEVELOPMENT = "Sports Infrastructure Development"
    TRADE_LIBERALIZATION = "Trade Liberalization"
    FINANCIAL_MARKET_DEVELOPMENT = "Financial Market Development"
    TOURISM_INDUSTRY_DEVELOPMENT = "Tourism Industry Development"
    ENTERTAINMENT_INDUSTRY_DEVELOPMENT = "Entertainment Industry Development"
    # Infrastructure Projects (11)
    HIGHWAY_DEVELOPMENT_INITIATIVE = "Highway Development Initiative"
    INTERSTATE_HIGHWAY_SYSTEM = "Interstate Highway System"
    ADVANCED_HIGHWAY_INITIATIVE = "Advanced Highway Initiative"
    AVIATION_INFRASTRUCTURE_INITIATIVE = "Aviation Infrastructure Initiative"
    POWER_GRID_MODERNIZATION = "Power Grid Modernization"
    WATER_INFRASTRUCTURE_INITIATIVE = "Water Infrastructure Initiative"
    BORDER_SECURITY_INITIATIVE = "Border Security Initiative"
    FLOOD_CONTROL_INITIATIVE = "Flood Control Initiative"
    TELECOMMUNICATIONS_INITIATIVE = "Telecommunications Initiative"
    SMART_GRID_INITIATIVE = "Smart Grid Initiative"
    AUTOMATED_LOGISTICS_NETWORK = "Automated Logistics Network"

    # Military Projects (10)
    MANHATTAN_PROJECT = "Manhattan Project"
    DRONE_PROGRAM = "Drone Program"
    SUBMARINE_FLEET = "Submarine Fleet"
    BIOLOGICAL_WEAPONS_PROGRAM = "Biological Weapons Program"
    CHEMICAL_WEAPONS_ARSENAL = "Chemical Weapons Arsenal"
    CYBER_WARFARE_DIVISION = "Cyber Warfare Division"
    MISSILE_INTERCEPTOR_SYSTEM = "Missile Interceptor System"
    ADVANCED_WARHEAD_DESIGN = "Advanced Warhead Design"
    ADVANCED_RADAR_SYSTEM = "Advanced Radar System"
    MOBILE_ARTILLERY = "Mobile Artillery"
    SOLDIER_ENHANCEMENT_PROGRAM = "Soldier Enhancement Program"
    TANK_MODERNIZATION = "Tank Modernization"
    AIR_SUPERIORITY_INITIATIVE = "Air Superiority Initiative"
    NAVAL_DOCTRINE_REFORM = "Naval Doctrine Reform"
    MISSILE_GUIDANCE_SYSTEM = "Missile Guidance System"
    NUCLEAR_DETERRENCE_STRATEGY = "Nuclear Deterrence Strategy"

    # Science & Space Projects (10)
    SPACE_RACE = "Space Race"
    FUSION_REACTOR = "Fusion Reactor"
    EDUCATION_REFORM_INITIATIVE = "Education Reform Initiative"
    HIGHER_EDUCATION_INITIATIVE = "Higher Education Initiative"
    NATIONAL_RESEARCH_INITIATIVE = "National Research Initiative"
    ADVANCED_RESEARCH_INITIATIVE = "Advanced Research Initiative"
    DIGITAL_INFRASTRUCTURE_INITIATIVE = "Digital Infrastructure Initiative"
    SPACE_PROGRAM_INITIATIVE = "Space Program Initiative"
    QUANTUM_COMPUTING_INITIATIVE = "Quantum Computing Initiative"
    TECHNOLOGY_BREAKTHROUGH = "Technology Breakthrough"

    # Social Projects (12)
    NATIONAL_IDENTITY_PROGRAM = "National Identity Program"
    CULTURAL_EXCHANGE_PROGRAM = "Cultural Exchange Program"
    OPEN_IMMIGRATION_POLICY = "Open Immigration Policy"
    CLOSED_BORDERS_POLICY = "Closed Borders Policy"
    WELFARE_REFORM = "Welfare Reform"
    TAX_REFORM = "Tax Reform"
    PROPAGANDA_CAMPAIGN = "Propaganda Campaign"
    PROGRESSIVE_TAXATION = "Progressive Taxation"
    POLICY_REFORM_INITIATIVE = "Policy Reform Initiative"
    CONSTITUTIONAL_FLEXIBILITY = "Constitutional Flexibility"
    RELIGIOUS_TOLERANCE = "Religious Tolerance"
    POLITICAL_TOLERANCE = "Political Tolerance"
    # Civil Projects (14)
    NATIONAL_HEALTHCARE_INITIATIVE = "National Healthcare Initiative"
    UNIVERSAL_HEALTHCARE_SYSTEM = "Universal Healthcare System"
    ADVANCED_MEDICAL_RESEARCH_PROGRAM = "Advanced Medical Research Program"
    NATIONAL_LAW_ENFORCEMENT_AGENCY = "National Law Enforcement Agency"
    JUDICIAL_REFORM_INITIATIVE = "Judicial Reform Initiative"
    NATIONAL_RECYCLING_INITIATIVE = "National Recycling Initiative"
    NATIONAL_SANITATION_INFRASTRUCTURE = "National Sanitation Infrastructure"
    PUBLIC_TRANSPORTATION_NETWORK = "Public Transportation Network"
    EMERGENCY_SERVICES_NETWORK = "Emergency Services Network"
    DISASTER_RESPONSE_AGENCY = "Disaster Response Agency"
    NATIONAL_PARKS_INITIATIVE = "National Parks Initiative"
    HOSPITAL_NETWORK_EXPANSION = "Hospital Network Expansion"
    COMMUNITY_POLICING_INITIATIVE = "Community Policing Initiative"
    NATIONAL_EDUCATION_INITIATIVE = "National Education Initiative"


@dataclass
class Project:
    """Project with costs, requirements, and effects."""
    name: str
    category: ProjectCategory  # Category of project
    description: str  # Flavor text describing the project
    # Costs (one-time, no tick upkeep)
    cash_cost: float  # Cash cost to build
    build_resources: Dict[str, int]  # Resources required to build
    # Requirements
    requires_infrastructure: int = 0  # Infrastructure required
    requires_tech: int = 0  # Technology level required
    requires_project: Optional[str] = None  # Project required
    requires_improvement: Optional[str] = None  # Improvement required
    requires_wonder: Optional[str] = None  # Wonder required
    requires_resource: Optional[str] = None  # Resource required
    requires_power: bool = False  # Whether project requires power
    # One-time effects
    one_time_cash_bonus: float = 0.0  # One-time cash bonus
    # Temporary effects (duration in ticks)
    happiness_bonus_duration: int = 0  # Duration of happiness bonus (0 = permanent)
    happiness_bonus: int = 0  # Happiness bonus
    government_mismatch_penalty_removed_duration: int = 0  # Duration of government mismatch penalty removal
    # Permanent effects
    # Economic effects
    citizen_income_bonus: float = 0.0  # Direct bonus to citizen income
    tax_income_bonus: float = 0.0  # Percentage bonus to tax income
    commerce_income_bonus: float = 0.0  # Percentage bonus to commerce income
    trade_income_bonus: float = 0.0  # Percentage bonus to trade income
    bank_interest_bonus: float = 0.0  # Percentage bonus to bank interest
    literacy_bonus: float = 0.0  # Bonus to literacy rate (0-100 scale)
    tech_income_bonus: float = 0.0  # Percentage bonus to tech income
    max_tax_rate_bonus: float = 0.0  # Bonus to maximum allowed tax rate (e.g., 0.10 for +10%)
    tax_happiness_penalty_reduction: int = 0  # Reduction in happiness penalty from high taxes
    new_city_cost_bonus: float = 0.0  # Percentage bonus to new city cost (negative = cheaper)
    infrastructure_cost_bonus: float = 0.0  # Percentage bonus to infrastructure cost (negative = cheaper)
    infrastructure_upkeep_bonus: float = 0.0  # Percentage bonus to infrastructure upkeep (negative = cheaper)
    improvement_build_cost_bonus: float = 0.0  # Percentage bonus to improvement build cost (negative = cheaper)
    improvement_upkeep_bonus: float = 0.0  # Percentage bonus to improvement upkeep (negative = cheaper)
    technology_cost_bonus: float = 0.0  # Percentage bonus to technology cost (negative = cheaper)
    resource_production_bonus: float = 0.0  # Percentage bonus to resource production
    agricultural_production_bonus: float = 0.0  # Percentage bonus to agricultural production
    industrial_production_bonus: float = 0.0  # Percentage bonus to industrial production
    strategic_production_bonus: float = 0.0  # Percentage bonus to strategic production
    power_plant_efficiency_bonus: float = 0.0  # Percentage bonus to power plant efficiency
    power_plant_pollution_bonus: float = 0.0  # Percentage bonus to power plant pollution (negative = reduction)
    # Population effects
    citizen_percentage_bonus: float = 0.0  # Percentage bonus to citizens
    population_growth_bonus: float = 0.0  # Percentage bonus to population growth
    land_bonus: float = 0.0  # Percentage bonus to land
    crime_bonus: float = 0.0  # Crime per city
    disease_bonus: float = 0.0  # Disease per city
    hospital_effectiveness_bonus: float = 0.0  # Percentage bonus to hospital effectiveness
    pollution_bonus: float = 0.0  # Pollution per city
    environment_bonus: float = 0.0  # Environment bonus
    # Defense effects
    spy_defense_bonus: float = 0.0  # Percentage bonus to spy defense
    spy_operations_bonus: float = 0.0  # Percentage bonus to spy operations
    enemy_spy_success_bonus: float = 0.0  # Percentage bonus to enemy spy success (negative = reduction)
    # Military effects
    aircraft_cost_bonus: float = 0.0  # Percentage bonus to aircraft cost (negative = cheaper)
    tank_cost_bonus: float = 0.0  # Percentage bonus to tank cost (negative = cheaper)
    naval_surprise_attack_bonus: float = 0.0  # Percentage bonus to naval surprise attack
    soldier_casualty_bonus: float = 0.0  # Percentage bonus to soldier casualties
    ground_attack_bonus: float = 0.0  # Percentage bonus to ground attack damage
    soldier_efficiency_bonus: float = 0.0  # Percentage bonus to soldier efficiency
    tank_efficiency_bonus: float = 0.0  # Percentage bonus to tank efficiency
    aircraft_efficiency_bonus: float = 0.0  # Percentage bonus to aircraft efficiency
    ship_efficiency_bonus: float = 0.0  # Percentage bonus to ship efficiency
    all_military_efficiency_bonus: float = 0.0  # Percentage bonus to all military efficiency
    military_unit_damage_bonus: float = 0.0  # Percentage bonus to military unit damage
    military_unit_cap_bonus: float = 0.0  # Percentage bonus to military unit cap
    dogfight_bonus: float = 0.0  # Percentage bonus to dogfight
    disaster_damage_bonus: float = 0.0  # Percentage bonus to disaster damage (negative = reduction)
    natural_disaster_damage_bonus: float = 0.0  # Percentage bonus to natural disaster damage (negative = reduction)
    infrastructure_war_damage_bonus: float = 0.0  # Percentage bonus to infrastructure war damage (negative = reduction)
    # Missile/Nuke Defense and Damage effects
    missile_intercept_chance_bonus: float = 0.0  # Percentage bonus to missile intercept chance
    nuke_intercept_chance_bonus: float = 0.0  # Percentage bonus to nuke intercept chance
    missile_damage_reduction_bonus: float = 0.0  # Percentage reduction in missile damage taken
    nuke_damage_reduction_bonus: float = 0.0  # Percentage reduction in nuke damage taken
    missile_damage_boost_bonus: float = 0.0  # Percentage boost to missile damage dealt
    nuke_damage_boost_bonus: float = 0.0  # Percentage boost to nuke damage dealt
    # Special effects
    enables_nuclear_weapons: bool = False  # Whether project enables nuclear weapons
    enables_spy_drone_ops: bool = False  # Whether project enables spy drone ops
    enables_submarine_units: bool = False  # Whether project enables submarine units
    enables_bio_weapon: bool = False  # Whether project enables bio-weapon attack
    enables_chemical_attack: bool = False  # Whether project enables chemical attack
    unlocks_resource_slot: bool = False  # Whether project unlocks additional resource slot
    unlocks_trade_slots: int = 0  # Number of trade slots unlocked
    unlocks_water_access: bool = False  # Whether project unlocks Water access
    enables_infrastructure_hack: bool = False  # Whether project enables infrastructure hack
    enables_fusion_plant: bool = False  # Whether project enables Fusion Plant improvement
    enables_space_wonders: bool = False  # Whether project enables space wonders
    enables_quantum_wonder: bool = False  # Whether project enables Quantum Computing wonder
    unlocks_moon_mars_wonders: bool = False  # Whether project unlocks Moon/Mars wonders
    policy_cooldown_removed: bool = False  # Whether project removes Policy change cooldown
    government_cooldown_removed: bool = False  # Whether project removes Government change cooldown
    religion_cooldown_removed: bool = False  # Whether project removes Religion change cooldown
    religion_mismatch_penalty_removed: bool = False  # Whether project removes religion mismatch penalty
    government_mismatch_penalty_removed: bool = False  # Whether project removes government mismatch penalty

    def __str__(self) -> str:
        return self.name


class ProjectSystem:
    """System for managing project types and their effects."""

    def __init__(self):
        self.projects: Dict[ProjectType, Project] = self._initialize_projects()

    def _initialize_projects(self) -> Dict[ProjectType, Project]:
        """Initialize all project types with their data."""
        return {
            # Economic Projects (5)
            ProjectType.RESOURCE_EXPANSION: Project(
                name="Resource Expansion",
                category=ProjectCategory.ECONOMIC,
                description="Resource expansion program. Unlocks 2nd resource slot, trade income +3%.",
                cash_cost=300000.0,
                build_resources={"Iron": 950, "Limestone": 800, "Timber": 700},
                trade_income_bonus=0.03,
                unlocks_trade_slots=1
            ),
            ProjectType.LAND_EXPANSION_PROGRAM: Project(
                name="Land Expansion Program",
                category=ProjectCategory.ECONOMIC,
                description="Land expansion initiative. Land +10%, new city cost -8%. Requires 500 tech.",
                cash_cost=1200000.0,
                build_resources={"Limestone": 1000, "Timber": 900, "Iron": 800},
                requires_tech=500,
                land_bonus=0.10,
                new_city_cost_bonus=-0.08
            ),
            ProjectType.INDUSTRIAL_MODERNIZATION: Project(
                name="Industrial Modernization",
                category=ProjectCategory.ECONOMIC,
                description="Industrial modernization program. Citizen income +$2, industrial production +10%. Requires 500 tech.",
                cash_cost=1000000.0,
                build_resources={"Iron": 950, "Coal": 800, "Copper": 650},
                requires_tech=500,
                citizen_income_bonus=2.0,
                industrial_production_bonus=0.10
            ),
            ProjectType.FINANCIAL_DEREGULATION: Project(
                name="Financial Deregulation",
                category=ProjectCategory.ECONOMIC,
                description="Financial deregulation initiative. Bank interest +3%, commerce income +$1/citizen. Requires 1000 tech.",
                cash_cost=1500000.0,
                build_resources={"Gold": 1000, "Copper": 900, "Limestone": 800},
                requires_tech=1000,
                bank_interest_bonus=0.03,
                commerce_income_bonus=1.0
            ),
            ProjectType.CENTRAL_PLANNING: Project(
                name="Central Planning",
                category=ProjectCategory.ECONOMIC,
                description="Central economic planning. Tax income +8%, infrastructure upkeep -5%. Requires 1500 tech.",
                cash_cost=2000000.0,
                build_resources={"Iron": 1000, "Coal": 950, "Limestone": 900},
                requires_tech=1500,
                tax_income_bonus=0.08,
                infrastructure_upkeep_bonus=-0.05
            ),
            # Commerce Projects (10)
            ProjectType.MARKET_LIBERALIZATION: Project(
                name="Market Liberalization",
                category=ProjectCategory.COMMERCE,
                description="Market reform initiative. Commerce income +$0.30/citizen nation-wide.",
                cash_cost=500000.0,
                build_resources={"Timber": 700, "Grain": 500},
                commerce_income_bonus=0.30
            ),
            ProjectType.RETAIL_SECTOR_DEVELOPMENT: Project(
                name="Retail Sector Development",
                category=ProjectCategory.COMMERCE,
                description="Retail sector development. Commerce income +$0.80/citizen nation-wide. Requires power.",
                cash_cost=600000.0,
                build_resources={"Timber": 850, "Grain": 700, "Iron": 500},
                requires_power=True,
                commerce_income_bonus=0.80
            ),
            ProjectType.BANKING_SECTOR_REFORM: Project(
                name="Banking Sector Reform",
                category=ProjectCategory.COMMERCE,
                description="Banking sector reform. Commerce income +$1.80/citizen nation-wide. Requires power.",
                cash_cost=700000.0,
                build_resources={"Limestone": 900, "Iron": 700, "Gold": 500},
                requires_power=True,
                commerce_income_bonus=1.80
            ),
            ProjectType.URBAN_DEVELOPMENT_INITIATIVE: Project(
                name="Urban Development Initiative",
                category=ProjectCategory.COMMERCE,
                description="Urban development initiative. Commerce income +$3.50/citizen nation-wide. Requires power + 300 tech.",
                cash_cost=800000.0,
                build_resources={"Grain": 1000, "Iron": 800, "Gold": 600},
                requires_power=True,
                requires_tech=300,
                commerce_income_bonus=3.50
            ),
            ProjectType.LUXURY_RETAIL_DEVELOPMENT: Project(
                name="Luxury Retail Development",
                category=ProjectCategory.COMMERCE,
                description="Luxury retail development. Commerce income +$6/citizen nation-wide, happiness +1. Requires power + 600 tech.",
                cash_cost=900000.0,
                build_resources={"Grain": 1000, "Spices": 800, "Gold": 700, "Gemstones": 500},
                requires_power=True,
                requires_tech=600,
                commerce_income_bonus=6.0,
                happiness_bonus=1
            ),
            ProjectType.SPORTS_INFRASTRUCTURE_DEVELOPMENT: Project(
                name="Sports Infrastructure Development",
                category=ProjectCategory.COMMERCE,
                description="Sports infrastructure development. Commerce income +$7/citizen nation-wide, happiness +2. Requires power + 400 tech.",
                cash_cost=1000000.0,
                build_resources={"Timber": 1000, "Limestone": 900, "Iron": 600},
                requires_power=True,
                requires_tech=400,
                commerce_income_bonus=7.0,
                happiness_bonus=2
            ),
            ProjectType.TRADE_LIBERALIZATION: Project(
                name="Trade Liberalization",
                category=ProjectCategory.COMMERCE,
                description="Trade liberalization initiative. Commerce income +$4/citizen nation-wide, trade income +6%. Requires power + 500 tech.",
                cash_cost=850000.0,
                build_resources={"Limestone": 1000, "Gold": 800, "Copper": 600},
                requires_power=True,
                requires_tech=500,
                commerce_income_bonus=4.0,
                trade_income_bonus=0.06
            ),
            ProjectType.FINANCIAL_MARKET_DEVELOPMENT: Project(
                name="Financial Market Development",
                category=ProjectCategory.COMMERCE,
                description="Financial market development. Commerce income +$5/citizen nation-wide, bank interest +2%. Requires power + 1,000 tech.",
                cash_cost=950000.0,
                build_resources={"Limestone": 1000, "Gold": 900, "Copper": 700},
                requires_power=True,
                requires_tech=1000,
                commerce_income_bonus=5.0,
                bank_interest_bonus=0.02
            ),
            ProjectType.TOURISM_INDUSTRY_DEVELOPMENT: Project(
                name="Tourism Industry Development",
                category=ProjectCategory.COMMERCE,
                description="Tourism industry development. Commerce income +$1.50/citizen nation-wide, happiness +1. Requires power.",
                cash_cost=750000.0,
                build_resources={"Fish": 900, "Spices": 800, "Grain": 600},
                requires_power=True,
                commerce_income_bonus=1.50,
                happiness_bonus=1
            ),
            ProjectType.ENTERTAINMENT_INDUSTRY_DEVELOPMENT: Project(
                name="Entertainment Industry Development",
                category=ProjectCategory.COMMERCE,
                description="Entertainment industry development. Commerce income +$3/citizen nation-wide, crime +1. Requires power + 200 tech.",
                cash_cost=800000.0,
                build_resources={"Spices": 900, "Gemstones": 750, "Gold": 650},
                requires_power=True,
                requires_tech=200,
                commerce_income_bonus=3.0,
                crime_bonus=1.0
            ),
            # Infrastructure Projects (11)
            ProjectType.HIGHWAY_DEVELOPMENT_INITIATIVE: Project(
                name="Highway Development Initiative",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Highway development initiative. Infrastructure upkeep -2% nation-wide.",
                cash_cost=500000.0,
                build_resources={"Timber": 800},
                infrastructure_upkeep_bonus=-0.02
            ),
            ProjectType.INTERSTATE_HIGHWAY_SYSTEM: Project(
                name="Interstate Highway System",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Interstate highway system. Infrastructure upkeep -4%, commerce income +$0.20/citizen nation-wide.",
                cash_cost=600000.0,
                build_resources={"Limestone": 850, "Iron": 700},
                infrastructure_upkeep_bonus=-0.04,
                commerce_income_bonus=0.20
            ),
            ProjectType.ADVANCED_HIGHWAY_INITIATIVE: Project(
                name="Advanced Highway Initiative",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Advanced highway initiative. Infrastructure upkeep -6%, commerce income +$0.50/citizen nation-wide. Requires power.",
                cash_cost=700000.0,
                build_resources={"Limestone": 950, "Iron": 800, "Oil": 650},
                requires_power=True,
                infrastructure_upkeep_bonus=-0.06,
                commerce_income_bonus=0.50
            ),
            ProjectType.AVIATION_INFRASTRUCTURE_INITIATIVE: Project(
                name="Aviation Infrastructure Initiative",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Aviation infrastructure initiative. Commerce income +$1.20/citizen nation-wide, new city cost -5%. Requires power.",
                cash_cost=800000.0,
                build_resources={"Iron": 900, "Limestone": 800, "Oil": 650},
                requires_power=True,
                commerce_income_bonus=1.20,
                new_city_cost_bonus=-0.05
            ),
            ProjectType.POWER_GRID_MODERNIZATION: Project(
                name="Power Grid Modernization",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Power grid modernization. All power plants efficiency +10% nation-wide. Requires power.",
                cash_cost=750000.0,
                build_resources={"Copper": 900, "Iron": 750},
                requires_power=True,
                power_plant_efficiency_bonus=0.10
            ),
            ProjectType.WATER_INFRASTRUCTURE_INITIATIVE: Project(
                name="Water Infrastructure Initiative",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Water infrastructure initiative. Disease -1.5 per city, pollution -1 nation-wide. Requires power.",
                cash_cost=650000.0,
                build_resources={"Iron": 900, "Limestone": 800, "Copper": 650},
                requires_power=True,
                disease_bonus=-1.5,
                pollution_bonus=-1.0
            ),
            ProjectType.BORDER_SECURITY_INITIATIVE: Project(
                name="Border Security Initiative",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Border security initiative. Citizens -2%, happiness +2, environment +1, spy defense +12% nation-wide.",
                cash_cost=850000.0,
                build_resources={"Limestone": 1000, "Iron": 900, "Timber": 800},
                citizen_percentage_bonus=-0.02,
                happiness_bonus=2,
                environment_bonus=1.0,
                spy_defense_bonus=0.12
            ),
            ProjectType.FLOOD_CONTROL_INITIATIVE: Project(
                name="Flood Control Initiative",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Flood control initiative. Natural disaster damage -20%, infrastructure war damage -5% nation-wide.",
                cash_cost=750000.0,
                build_resources={"Limestone": 950, "Iron": 850},
                natural_disaster_damage_bonus=-0.20,
                infrastructure_war_damage_bonus=-0.05
            ),
            ProjectType.TELECOMMUNICATIONS_INITIATIVE: Project(
                name="Telecommunications Initiative",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Telecommunications initiative. Commerce income +$0.80/citizen nation-wide, spy defense +4%. Requires power + 200 tech.",
                cash_cost=800000.0,
                build_resources={"Titanium": 900, "Iron": 800, "Lead": 700},
                requires_power=True,
                requires_tech=200,
                commerce_income_bonus=0.80,
                spy_defense_bonus=0.04
            ),
            ProjectType.SMART_GRID_INITIATIVE: Project(
                name="Smart Grid Initiative",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Smart grid power management. Power plant pollution -30%, power plant efficiency +15%. Requires 1500 tech.",
                cash_cost=2500000.0,
                build_resources={"Copper": 1000, "Titanium": 900, "Lead": 800},
                requires_power=True,
                requires_tech=1500,
                power_plant_pollution_bonus=-0.30,
                power_plant_efficiency_bonus=0.15
            ),
            ProjectType.AUTOMATED_LOGISTICS_NETWORK: Project(
                name="Automated Logistics Network",
                category=ProjectCategory.INFRASTRUCTURE,
                description="Automated logistics system. Improvement upkeep -15%, infrastructure upkeep -10%. Requires 2000 tech.",
                cash_cost=3000000.0,
                build_resources={"Iron": 1000, "Titanium": 950, "Copper": 900},
                requires_power=True,
                requires_tech=2000,
                improvement_upkeep_bonus=-0.15,
                infrastructure_upkeep_bonus=-0.10
            ),
            # Military Projects (16)
            ProjectType.MANHATTAN_PROJECT: Project(
                name="Manhattan Project",
                category=ProjectCategory.MILITARY,
                description="Nuclear weapons research. Enables nuclear weapons.",
                cash_cost=2000000.0,
                build_resources={"Uranium": 1000, "Iron": 800, "Titanium": 600},
                requires_resource="Uranium",
                requires_tech=1000,
                enables_nuclear_weapons=True
            ),
            ProjectType.DRONE_PROGRAM: Project(
                name="Drone Program",
                category=ProjectCategory.MILITARY,
                description="Unmanned aerial vehicle program. Enables spy drone ops, airstrikes cost -20% aircraft.",
                cash_cost=1500000.0,
                build_resources={"Titanium": 900, "Copper": 700, "Lead": 500},
                requires_improvement="Airfield",
                requires_tech=1000,
                enables_spy_drone_ops=True,
                aircraft_cost_bonus=-0.20
            ),
            ProjectType.SUBMARINE_FLEET: Project(
                name="Submarine Fleet",
                category=ProjectCategory.MILITARY,
                description="Submarine naval program. Enables submarine units, naval surprise attack +20%.",
                cash_cost=2500000.0,
                build_resources={"Iron": 950, "Titanium": 800, "Lead": 650},
                requires_improvement="Drydock",
                requires_tech=1000,
                enables_submarine_units=True,
                naval_surprise_attack_bonus=0.20
            ),
            ProjectType.BIOLOGICAL_WEAPONS_PROGRAM: Project(
                name="Biological Weapons Program",
                category=ProjectCategory.MILITARY,
                description="Biological weapons research. Enables bio-weapon attack (destroys population, not infra).",
                cash_cost=4000000.0,
                build_resources={"Fish": 1000, "Lead": 850, "Copper": 700},
                requires_tech=2000,
                enables_bio_weapon=True
            ),
            ProjectType.CHEMICAL_WEAPONS_ARSENAL: Project(
                name="Chemical Weapons Arsenal",
                category=ProjectCategory.MILITARY,
                description="Chemical weapons stockpile. Enables chemical attack (soldier casualties +50%).",
                cash_cost=3000000.0,
                build_resources={"Lead": 900, "Oil": 750, "Copper": 600},
                requires_tech=1500,
                enables_chemical_attack=True,
                soldier_casualty_bonus=0.50
            ),
            ProjectType.CYBER_WARFARE_DIVISION: Project(
                name="Cyber Warfare Division",
                category=ProjectCategory.MILITARY,
                description="Cyber warfare unit. Enables infrastructure hack, spy operations +15%.",
                cash_cost=2000000.0,
                build_resources={"Copper": 950, "Titanium": 800, "Gold": 650},
                requires_improvement="Intelligence HQ",
                requires_tech=1500,
                enables_infrastructure_hack=True,
                spy_operations_bonus=0.15
            ),
            ProjectType.MISSILE_INTERCEPTOR_SYSTEM: Project(
                name="Missile Interceptor System",
                category=ProjectCategory.MILITARY,
                description="Advanced missile defense system. Small chance to block incoming missiles/nukes (+10% intercept chance), reduces damage taken from missiles/nukes by 15%.",
                cash_cost=3500000.0,
                build_resources={"Iron": 1000, "Titanium": 900, "Copper": 800, "Gold": 700},
                requires_improvement="Missile Battery",
                requires_tech=2000,
                missile_intercept_chance_bonus=0.10,
                nuke_intercept_chance_bonus=0.10,
                missile_damage_reduction_bonus=0.15,
                nuke_damage_reduction_bonus=0.15
            ),
            ProjectType.ADVANCED_WARHEAD_DESIGN: Project(
                name="Advanced Warhead Design",
                category=ProjectCategory.MILITARY,
                description="Advanced warhead research. Increases damage dealt from missiles/nukes by 15%.",
                cash_cost=4000000.0,
                build_resources={"Uranium": 1000, "Titanium": 900, "Lead": 800},
                requires_project="Manhattan Project",
                requires_tech=2500,
                missile_damage_boost_bonus=0.15,
                nuke_damage_boost_bonus=0.15
            ),
            ProjectType.ADVANCED_RADAR_SYSTEM: Project(
                name="Advanced Radar System",
                category=ProjectCategory.MILITARY,
                description="Advanced radar network. Spy defense +10%, enemy spy success -5%. Requires 500 tech.",
                cash_cost=1500000.0,
                build_resources={"Iron": 900, "Copper": 750, "Lead": 600},
                requires_tech=500,
                spy_defense_bonus=0.10,
                enemy_spy_success_bonus=-0.05
            ),
            ProjectType.MOBILE_ARTILLERY: Project(
                name="Mobile Artillery",
                category=ProjectCategory.MILITARY,
                description="Mobile artillery deployment. Ground attack +15%, soldier casualties +10%. Requires 750 tech.",
                cash_cost=2000000.0,
                build_resources={"Iron": 950, "Coal": 800, "Oil": 650},
                requires_tech=750,
                ground_attack_bonus=0.15,
                soldier_casualty_bonus=0.10
            ),
            ProjectType.SOLDIER_ENHANCEMENT_PROGRAM: Project(
                name="Soldier Enhancement Program",
                category=ProjectCategory.MILITARY,
                description="Soldier training and equipment enhancement. Soldier efficiency +10%, soldier casualties -10%. Requires 300 tech.",
                cash_cost=1000000.0,
                build_resources={"Iron": 800, "Timber": 650, "Coal": 500},
                requires_tech=300,
                soldier_efficiency_bonus=0.10,
                soldier_casualty_bonus=-0.10
            ),
            ProjectType.TANK_MODERNIZATION: Project(
                name="Tank Modernization",
                category=ProjectCategory.MILITARY,
                description="Tank modernization program. Tank efficiency +10%, tank cost -8%. Requires 600 tech.",
                cash_cost=1800000.0,
                build_resources={"Iron": 900, "Coal": 750, "Oil": 600},
                requires_tech=600,
                tank_efficiency_bonus=0.10,
                tank_cost_bonus=-0.08
            ),
            ProjectType.AIR_SUPERIORITY_INITIATIVE: Project(
                name="Air Superiority Initiative",
                category=ProjectCategory.MILITARY,
                description="Air superiority doctrine. Aircraft efficiency +10%, dogfight bonus +10%. Requires 800 tech.",
                cash_cost=2200000.0,
                build_resources={"Titanium": 850, "Lead": 700, "Oil": 550},
                requires_tech=800,
                aircraft_efficiency_bonus=0.10,
                dogfight_bonus=0.10
            ),
            ProjectType.NAVAL_DOCTRINE_REFORM: Project(
                name="Naval Doctrine Reform",
                category=ProjectCategory.MILITARY,
                description="Naval doctrine reform. Ship efficiency +10%, naval surprise attack +10%. Requires 700 tech.",
                cash_cost=2000000.0,
                build_resources={"Titanium": 850, "Iron": 700, "Timber": 550},
                requires_tech=700,
                ship_efficiency_bonus=0.10,
                naval_surprise_attack_bonus=0.10
            ),
            ProjectType.MISSILE_GUIDANCE_SYSTEM: Project(
                name="Missile Guidance System",
                category=ProjectCategory.MILITARY,
                description="Advanced missile guidance. Missile damage +20%, missile intercept chance -5%. Requires 1200 tech.",
                cash_cost=3000000.0,
                build_resources={"Titanium": 950, "Lead": 800, "Copper": 700},
                requires_tech=1200,
                missile_damage_boost_bonus=0.20,
                missile_intercept_chance_bonus=-0.05
            ),
            ProjectType.NUCLEAR_DETERRENCE_STRATEGY: Project(
                name="Nuclear Deterrence Strategy",
                category=ProjectCategory.MILITARY,
                description="Nuclear deterrence strategy. Nuke damage +20%, nuke intercept chance -5%. Requires 3000 tech.",
                cash_cost=5000000.0,
                build_resources={"Uranium": 1000, "Lead": 950, "Titanium": 900},
                requires_project="Manhattan Project",
                requires_tech=3000,
                nuke_damage_boost_bonus=0.20,
                nuke_intercept_chance_bonus=-0.05
            ),
            # Science & Space Projects (10)
            ProjectType.SPACE_RACE: Project(
                name="Space Race",
                category=ProjectCategory.SCIENCE_SPACE,
                description="National space program. Unlocks Moon/Mars wonders.",
                cash_cost=5000000.0,
                build_resources={"Titanium": 1000, "Copper": 900, "Uranium": 800},
                requires_wonder="Space Agency",
                unlocks_moon_mars_wonders=True
            ),
            ProjectType.EDUCATION_REFORM_INITIATIVE: Project(
                name="Education Reform Initiative",
                category=ProjectCategory.SCIENCE_SPACE,
                description="Education reform initiative. Technology cost -8%, literacy +5% nation-wide.",
                cash_cost=500000.0,
                build_resources={"Timber": 750, "Limestone": 600},
                technology_cost_bonus=-0.08,
                literacy_bonus=5.0
            ),
            ProjectType.HIGHER_EDUCATION_INITIATIVE: Project(
                name="Higher Education Initiative",
                category=ProjectCategory.SCIENCE_SPACE,
                description="Higher education initiative. Technology cost -4%, happiness +1 nation-wide. Requires power.",
                cash_cost=650000.0,
                build_resources={"Timber": 900, "Limestone": 800, "Copper": 650},
                requires_power=True,
                technology_cost_bonus=-0.04,
                happiness_bonus=1
            ),
            ProjectType.NATIONAL_RESEARCH_INITIATIVE: Project(
                name="National Research Initiative",
                category=ProjectCategory.SCIENCE_SPACE,
                description="National research initiative. Technology cost -8%, literacy +5% nation-wide.",
                cash_cost=500000.0,
                build_resources={"Timber": 750, "Limestone": 600},
                technology_cost_bonus=-0.08,
                literacy_bonus=5.0
            ),
            ProjectType.ADVANCED_RESEARCH_INITIATIVE: Project(
                name="Advanced Research Initiative",
                category=ProjectCategory.SCIENCE_SPACE,
                description="Advanced research initiative. Technology cost -10%, literacy +10% nation-wide. Requires power + 1,000 tech.",
                cash_cost=900000.0,
                build_resources={"Limestone": 1000, "Lead": 900, "Gold": 800},
                requires_power=True,
                requires_tech=1000,
                technology_cost_bonus=-0.10,
                literacy_bonus=10.0
            ),
            ProjectType.DIGITAL_INFRASTRUCTURE_INITIATIVE: Project(
                name="Digital Infrastructure Initiative",
                category=ProjectCategory.SCIENCE_SPACE,
                description="Digital infrastructure initiative. Commerce income +$2/citizen nation-wide, spy defense +6%. Requires power + 400 tech.",
                cash_cost=850000.0,
                build_resources={"Copper": 1000, "Lead": 850, "Limestone": 750},
                requires_power=True,
                requires_tech=400,
                commerce_income_bonus=2.0,
                spy_defense_bonus=0.06
            ),
            ProjectType.SPACE_PROGRAM_INITIATIVE: Project(
                name="Space Program Initiative",
                category=ProjectCategory.SCIENCE_SPACE,
                description="Space program initiative. Enables space wonders, literacy +8% nation-wide. Requires power + 1,500 tech.",
                cash_cost=950000.0,
                build_resources={"Iron": 1000, "Titanium": 950, "Lead": 850},
                requires_power=True,
                requires_tech=1500,
                literacy_bonus=8.0,
                enables_space_wonders=True
            ),
            ProjectType.QUANTUM_COMPUTING_INITIATIVE: Project(
                name="Quantum Computing Initiative",
                category=ProjectCategory.SCIENCE_SPACE,
                description="Quantum computing initiative. Technology cost -15%, enables Quantum Computing wonder. Requires power + 2,500 tech.",
                cash_cost=1000000.0,
                build_resources={"Lead": 1000, "Gold": 1000, "Titanium": 900},
                requires_power=True,
                requires_tech=2500,
                technology_cost_bonus=-0.15,
                enables_quantum_wonder=True
            ),
            ProjectType.TECHNOLOGY_BREAKTHROUGH: Project(
                name="Technology Breakthrough",
                category=ProjectCategory.SCIENCE_SPACE,
                description="Major technology breakthrough. Technology cost -20%, literacy +15%, tech income +5%. Requires power + 3,000 tech.",
                cash_cost=1500000.0,
                build_resources={"Titanium": 1000, "Gold": 1000, "Copper": 950},
                requires_power=True,
                requires_tech=3000,
                technology_cost_bonus=-0.20,
                literacy_bonus=15.0,
                tech_income_bonus=0.05
            ),
            # FUSION_REACTOR removed - Fusion Plant is now a wonder
            # Social Projects (12)
            ProjectType.NATIONAL_IDENTITY_PROGRAM: Project(
                name="National Identity Program",
                category=ProjectCategory.SOCIAL,
                description="National identity campaign. Happiness +3, government mismatch penalty removed for 1,440 ticks (60 days).",
                cash_cost=500000.0,
                build_resources={"Gemstones": 800, "Gold": 650},
                happiness_bonus=3,
                happiness_bonus_duration=1440,
                government_mismatch_penalty_removed_duration=1440
            ),
            ProjectType.ECONOMIC_STIMULUS_PACKAGE: Project(
                name="Economic Stimulus Package",
                category=ProjectCategory.SOCIAL,
                description="Massive economic stimulus. One-time: +$10,000,000 cash, happiness +5 for 168 ticks (7 days).",
                cash_cost=500000.0,
                build_resources={"Gold": 800, "Gemstones": 600},
                one_time_cash_bonus=10000000.0,
                happiness_bonus=5,
                happiness_bonus_duration=168
            ),
            ProjectType.CULTURAL_EXCHANGE_PROGRAM: Project(
                name="Cultural Exchange Program",
                category=ProjectCategory.SOCIAL,
                description="International cultural exchange. Happiness +2, trade income +5%, spy defense +5%.",
                cash_cost=800000.0,
                build_resources={"Spices": 850, "Gemstones": 700, "Gold": 550},
                requires_improvement="National Harbor",
                happiness_bonus=2,
                trade_income_bonus=0.05,
                spy_defense_bonus=0.05
            ),
            ProjectType.OPEN_IMMIGRATION_POLICY: Project(
                name="Open Immigration Policy",
                category=ProjectCategory.SOCIAL,
                description="Open immigration policy. Population growth +15%, crime +1 per city.",
                cash_cost=300000.0,
                build_resources={"Timber": 700, "Limestone": 550},
                population_growth_bonus=0.15,
                crime_bonus=1.0
            ),
            ProjectType.CLOSED_BORDERS_POLICY: Project(
                name="Closed Borders Policy",
                category=ProjectCategory.SOCIAL,
                description="Closed borders policy. Spy defense +20%, population growth -5%.",
                cash_cost=300000.0,
                build_resources={"Limestone": 750, "Iron": 600},
                spy_defense_bonus=0.20,
                population_growth_bonus=-0.05
            ),
            ProjectType.WELFARE_REFORM: Project(
                name="Welfare Reform",
                category=ProjectCategory.SOCIAL,
                description="Welfare system reform. Happiness +4, tax income -5%.",
                cash_cost=1000000.0,
                build_resources={"Gold": 900, "Limestone": 750},
                requires_infrastructure=1000,
                happiness_bonus=4,
                tax_income_bonus=-0.05
            ),
            ProjectType.TAX_REFORM: Project(
                name="Tax Reform",
                category=ProjectCategory.SOCIAL,
                description="Tax system reform. Citizen income +$3, happiness -2.",
                cash_cost=1000000.0,
                build_resources={"Gold": 900, "Copper": 750},
                requires_infrastructure=1000,
                citizen_income_bonus=3.0,
                happiness_bonus=-2
            ),
            ProjectType.PROPAGANDA_CAMPAIGN: Project(
                name="Propaganda Campaign",
                category=ProjectCategory.SOCIAL,
                description="National propaganda campaign. Happiness +2 for 720 ticks (30 days), spy defense +8%.",
                cash_cost=400000.0,
                build_resources={"Spices": 850, "Copper": 700},
                happiness_bonus=2,
                happiness_bonus_duration=720,
                spy_defense_bonus=0.08
            ),
            ProjectType.PROGRESSIVE_TAXATION: Project(
                name="Progressive Taxation",
                category=ProjectCategory.SOCIAL,
                description="Progressive tax system reform. Maximum tax rate increased to 30%, happiness -1.",
                cash_cost=1500000.0,
                build_resources={"Gold": 1000, "Copper": 900},
                requires_infrastructure=1500,
                max_tax_rate_bonus=0.10,
                happiness_bonus=-1
            ),
            ProjectType.POLICY_REFORM_INITIATIVE: Project(
                name="Policy Reform Initiative",
                category=ProjectCategory.SOCIAL,
                description="Comprehensive policy reform. Removes cooldown time for Policy changes. Requires 1000 tech.",
                cash_cost=2000000.0,
                build_resources={"Gold": 1000, "Copper": 900, "Lead": 800},
                requires_tech=1000,
                policy_cooldown_removed=True
            ),
            ProjectType.CONSTITUTIONAL_FLEXIBILITY: Project(
                name="Constitutional Flexibility",
                category=ProjectCategory.SOCIAL,
                description="Constitutional reform enabling government flexibility. Removes cooldown time for Government changes. Requires 1500 tech.",
                cash_cost=2500000.0,
                build_resources={"Gold": 1000, "Copper": 950, "Limestone": 850},
                requires_tech=1500,
                government_cooldown_removed=True
            ),
            ProjectType.RELIGIOUS_TOLERANCE: Project(
                name="Religious Tolerance",
                category=ProjectCategory.SOCIAL,
                description="Religious tolerance initiative. Removes cooldown time for Religion changes, citizens happy with any religion. Requires 1200 tech.",
                cash_cost=2200000.0,
                build_resources={"Gemstones": 1000, "Gold": 900, "Limestone": 800},
                requires_tech=1200,
                religion_cooldown_removed=True,
                religion_mismatch_penalty_removed=True
            ),
            ProjectType.POLITICAL_TOLERANCE: Project(
                name="Political Tolerance",
                category=ProjectCategory.SOCIAL,
                description="Political tolerance initiative. Citizens happy with any government. Requires 1300 tech.",
                cash_cost=2300000.0,
                build_resources={"Gold": 1000, "Copper": 950, "Limestone": 850},
                requires_tech=1300,
                government_mismatch_penalty_removed=True
            ),
            # Civil Projects (14)
            ProjectType.NATIONAL_HEALTHCARE_INITIATIVE: Project(
                name="National Healthcare Initiative",
                category=ProjectCategory.CIVIL,
                description="Healthcare infrastructure initiative. Disease -1.5 per city nation-wide.",
                cash_cost=500000.0,
                build_resources={"Timber": 700, "Limestone": 500},
                disease_bonus=-1.5
            ),
            ProjectType.UNIVERSAL_HEALTHCARE_SYSTEM: Project(
                name="Universal Healthcare System",
                category=ProjectCategory.CIVIL,
                description="Universal healthcare system. Disease -3 per city nation-wide. Requires power.",
                cash_cost=700000.0,
                build_resources={"Timber": 850, "Limestone": 700, "Iron": 500},
                requires_power=True,
                disease_bonus=-3.0
            ),
            ProjectType.ADVANCED_MEDICAL_RESEARCH_PROGRAM: Project(
                name="Advanced Medical Research Program",
                category=ProjectCategory.CIVIL,
                description="Advanced medical research program. Disease -5 per city nation-wide, happiness +1. Requires power + 300 tech.",
                cash_cost=900000.0,
                build_resources={"Limestone": 1000, "Iron": 800, "Copper": 600},
                requires_power=True,
                requires_tech=300,
                disease_bonus=-5.0,
                happiness_bonus=1,
                hospital_effectiveness_bonus=0.10
            ),
            ProjectType.NATIONAL_LAW_ENFORCEMENT_AGENCY: Project(
                name="National Law Enforcement Agency",
                category=ProjectCategory.CIVIL,
                description="Law enforcement agency. Crime -2 per city nation-wide.",
                cash_cost=600000.0,
                build_resources={"Timber": 800, "Iron": 600},
                crime_bonus=-2.0
            ),
            ProjectType.JUDICIAL_REFORM_INITIATIVE: Project(
                name="Judicial Reform Initiative",
                category=ProjectCategory.CIVIL,
                description="Judicial reform initiative. Crime -3.5 per city nation-wide, happiness +1. Requires power.",
                cash_cost=750000.0,
                build_resources={"Limestone": 900, "Iron": 700, "Timber": 600},
                requires_power=True,
                crime_bonus=-3.5,
                happiness_bonus=1
            ),
            ProjectType.NATIONAL_RECYCLING_INITIATIVE: Project(
                name="National Recycling Initiative",
                category=ProjectCategory.CIVIL,
                description="National recycling initiative. Pollution -2 per city nation-wide, environment +1. Requires power.",
                cash_cost=700000.0,
                build_resources={"Iron": 850, "Timber": 700, "Copper": 550},
                requires_power=True,
                pollution_bonus=-2.0,
                environment_bonus=1.0
            ),
            ProjectType.NATIONAL_SANITATION_INFRASTRUCTURE: Project(
                name="National Sanitation Infrastructure",
                category=ProjectCategory.CIVIL,
                description="Sanitation infrastructure. Disease -2.5 per city nation-wide, pollution -1. Requires power.",
                cash_cost=800000.0,
                build_resources={"Iron": 950, "Limestone": 800, "Copper": 600},
                requires_power=True,
                disease_bonus=-2.5,
                pollution_bonus=-1.0
            ),
            ProjectType.PUBLIC_TRANSPORTATION_NETWORK: Project(
                name="Public Transportation Network",
                category=ProjectCategory.CIVIL,
                description="Public transportation network. Pollution -2 per city nation-wide, happiness +1. Requires power + 400 tech.",
                cash_cost=900000.0,
                build_resources={"Iron": 1000, "Limestone": 850, "Copper": 700},
                requires_power=True,
                requires_tech=400,
                pollution_bonus=-2.0,
                happiness_bonus=1
            ),
            ProjectType.EMERGENCY_SERVICES_NETWORK: Project(
                name="Emergency Services Network",
                category=ProjectCategory.CIVIL,
                description="Emergency services network. Infrastructure war damage -5%, disaster damage -8% nation-wide.",
                cash_cost=550000.0,
                build_resources={"Timber": 750, "Iron": 550},
                infrastructure_war_damage_bonus=-0.05,
                disaster_damage_bonus=-0.08
            ),
            ProjectType.DISASTER_RESPONSE_AGENCY: Project(
                name="Disaster Response Agency",
                category=ProjectCategory.CIVIL,
                description="Disaster response agency. All disaster damage -12%, disease -1 per city nation-wide. Requires power.",
                cash_cost=850000.0,
                build_resources={"Iron": 900, "Limestone": 750},
                requires_power=True,
                disaster_damage_bonus=-0.12,
                disease_bonus=-1.0
            ),
            ProjectType.NATIONAL_PARKS_INITIATIVE: Project(
                name="National Parks Initiative",
                category=ProjectCategory.CIVIL,
                description="National parks initiative. Environment +1 per city nation-wide, happiness +1, pollution -0.5 per city.",
                cash_cost=650000.0,
                build_resources={"Timber": 1000},
                environment_bonus=1.0,
                happiness_bonus=1,
                pollution_bonus=-0.5
            ),
            ProjectType.HOSPITAL_NETWORK_EXPANSION: Project(
                name="Hospital Network Expansion",
                category=ProjectCategory.CIVIL,
                description="Hospital network expansion. Disease -4 per city nation-wide, happiness +2. Requires power + 200 tech.",
                cash_cost=850000.0,
                build_resources={"Limestone": 950, "Iron": 850, "Copper": 750},
                requires_power=True,
                requires_tech=200,
                disease_bonus=-4.0,
                happiness_bonus=2
            ),
            ProjectType.COMMUNITY_POLICING_INITIATIVE: Project(
                name="Community Policing Initiative",
                category=ProjectCategory.CIVIL,
                description="Community policing initiative. Crime -5 per city nation-wide, happiness +1.",
                cash_cost=750000.0,
                build_resources={"Timber": 800, "Iron": 750},
                crime_bonus=-5.0,
                happiness_bonus=1
            ),
            ProjectType.NATIONAL_EDUCATION_INITIATIVE: Project(
                name="National Education Initiative",
                category=ProjectCategory.CIVIL,
                description="National education initiative. Crime -2 per city nation-wide, happiness +2, environment +1.",
                cash_cost=650000.0,
                build_resources={"Timber": 900, "Limestone": 800},
                crime_bonus=-2.0,
                happiness_bonus=2,
                environment_bonus=1.0
            ),
        }

    def get_project(self, project_type: ProjectType) -> Project:
        """Get a project by type."""
        return self.projects[project_type]

    def get_all_projects(self) -> list:
        """Get all available projects."""
        return list(self.projects.values())

    def get_projects_by_category(self, category: ProjectCategory) -> list:
        """Get all projects of a specific category."""
        return [project for project in self.projects.values() if project.category == category]


# Singleton instance
project_system = ProjectSystem()
