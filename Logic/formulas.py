"""
Formula System for Sovereign Nation Game

This module contains all game formulas for costs, war mechanics,
population calculations, resource production, and more.
These functions can be imported and used throughout the empire system.
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum


class VictoryLevel(Enum):
    """Victory levels for combat calculations."""
    UTTER_FAILURE = "utter_failure"
    DEFEAT = "defeat"
    PYRRHIC_VICTORY = "pyrrhic_victory"
    MODERATE_VICTORY = "moderate_victory"
    IMMENSE_VICTORY = "immense_victory"


@dataclass
class ResourceProductionResult:
    """Result of resource production calculation."""
    tick_production: float
    land_bonus: float
    extractor_bonus: float
    policy_modifier: float


def calculate_citizen_income(
    base_income: float = 5.0,
    literacy_rate: float = 1.0,
    happiness: int = 10,
    environment: float = 90.0,
    crime: float = 20.0,
    disease: float = 15.0,
    citizen_income_bonuses: float = 0.0
) -> float:
    """
    Calculate citizen income based on multiple factors.

    Formula: Income = Base × Literacy_Multiplier × Happiness_Multiplier × Environment_Multiplier × Crime_Multiplier × Disease_Multiplier + Bonuses

    Args:
        base_income: Base income per citizen (default $5)
        literacy_rate: Literacy rate (0-100 scale), scales income
        happiness: Nation happiness (0-10 scale)
        environment: Average environment (0-100 scale)
        crime: Average crime (0-100 scale)
        disease: Average disease (0-100 scale)
        citizen_income_bonuses: Sum of all citizen income bonuses from resources/improvements/projects/wonders/policies/government/religion

    Returns:
        Citizen income in dollars
    """
    # Literacy multiplier: scales base income based on literacy rate
    literacy_multiplier = max(0.1, literacy_rate / 100.0)
    
    # Happiness multiplier: higher happiness = higher income
    happiness_multiplier = max(0.1, happiness / 10.0)
    
    # Environment multiplier: better environment = higher income
    # Environment 100 = 1.0 multiplier, Environment 0 = 0.5 multiplier
    environment_multiplier = 0.5 + (environment / 200.0)
    
    # Crime multiplier: higher crime = lower income
    # Crime 0 = 1.0 multiplier, Crime 100 = 0.5 multiplier
    crime_multiplier = 1.0 - (crime / 200.0)
    
    # Disease multiplier: higher disease = lower income
    # Disease 0 = 1.0 multiplier, Disease 100 = 0.5 multiplier
    disease_multiplier = 1.0 - (disease / 200.0)
    
    # Calculate base income with multipliers
    scaled_income = (
        base_income *
        literacy_multiplier *
        happiness_multiplier *
        environment_multiplier *
        crime_multiplier *
        disease_multiplier
    )
    
    # Add bonuses (not scaled by multipliers)
    total_income = scaled_income + citizen_income_bonuses
    
    return max(0.0, total_income)  # Prevent negative income


@dataclass
class PopulationResult:
    """Result of population calculation."""
    base_population: float
    pollution_penalty: float
    age_bonus: float
    environment_bonus: float
    disease_penalty: float
    crime_penalty: float
    final_population: float


@dataclass
class CombatResult:
    """Result of combat calculation."""
    attack_strength: float
    defense_strength: float
    attack_defense_ratio: float
    victory_level: VictoryLevel
    unit_destruction_percent: float
    infrastructure_destruction_percent: float
    loot_percent: float
    war_score_change: float


# ==================== INCOME FORMULAS ====================

def calculate_tax_income(
    citizens: float,
    citizen_income: float,
    happiness: int,
    tax_rate: float,
    literacy_rate: float = 0.0
) -> float:
    """
    Calculate tax income from citizens.
    
    Formula: Income = Citizens × Citizen_Income × (Literacy_Rate / 100) × (Happiness / 10) × Tax_Rate
    
    Args:
        citizens: Total number of citizens
        citizen_income: Base income per citizen in dollars (at 100% literacy)
        happiness: Nation happiness (0-10 scale)
        tax_rate: Tax rate (0.0 to 1.0)
        literacy_rate: Literacy rate (0-100 scale), affects citizen income
    
    Returns:
        Tax income in dollars
    """
    happiness_multiplier = max(0.1, happiness / 10.0)  # Prevent zero or negative
    literacy_multiplier = max(0.1, literacy_rate / 100.0)  # Prevent zero, scales citizen income
    return citizens * citizen_income * literacy_multiplier * happiness_multiplier * tax_rate


def calculate_commerce_income(
    citizens: float,
    commerce_income_per_citizen: float,
    commerce_bonus: float = 0.0
) -> float:
    """
    Calculate commerce income.
    
    Args:
        citizens: Total number of citizens
        commerce_income_per_citizen: Commerce income per citizen
        commerce_bonus: Percentage bonus to commerce income (0.0 to 1.0)
    
    Returns:
        Commerce income in dollars
    """
    base_income = citizens * commerce_income_per_citizen
    return base_income * (1.0 + commerce_bonus)


def calculate_trade_income(
    base_trade_income: float,
    trade_bonus: float = 0.0,
    blockade_penalty: float = 0.0
) -> float:
    """
    Calculate trade income.
    
    Args:
        base_trade_income: Base trade income
        trade_bonus: Percentage bonus to trade income (0.0 to 1.0)
        blockade_penalty: Percentage penalty from blockade (0.0 to 1.0)
    
    Returns:
        Trade income in dollars
    """
    return base_trade_income * (1.0 + trade_bonus - blockade_penalty)


def calculate_tech_income(
    base_tech_income: float,
    tech_bonus: float = 0.0
) -> float:
    """
    Calculate technology income.
    
    Args:
        base_tech_income: Base tech income
        tech_bonus: Percentage bonus to tech income (0.0 to 1.0)
    
    Returns:
        Tech income in dollars
    """
    return base_tech_income * (1.0 + tech_bonus)


def calculate_total_income(
    tax_income: float,
    commerce_income: float,
    trade_income: float,
    tech_income: float
) -> float:
    """
    Calculate total nation income.
    
    Args:
        tax_income: Tax income
        commerce_income: Commerce income
        trade_income: Trade income
        tech_income: Technology income
    
    Returns:
        Total income in dollars
    """
    return tax_income + commerce_income + trade_income + tech_income


# ==================== RESOURCE PRODUCTION FORMULAS ====================

def calculate_resource_production(
    base_production: float,
    city_land: float,
    extractor_count: int,
    policy_modifier: float = 1.0,
    land_per_city_cap: float = 5000.0,
    land_bonus_cap: float = 2.0,
    extractor_bonus_per_count: float = 0.12
) -> ResourceProductionResult:
    """
    Calculate resource production per tick.
    
    Formula: Tick Production = Base Production × Land Bonus × Extractor Bonus × Policy Modifier
    Land Bonus = 1.0 + (City Land / 5,000) [caps at 2.0× at 5,000 land per city]
    Extractor Bonus = 1.0 + (0.12 × Extractor count) [each Extraction improvement adds 12%]
    
    Args:
        base_production: Base production per tick
        city_land: Land in the city
        extractor_count: Number of extraction improvements
        policy_modifier: Policy modifier (default 1.0)
        land_per_city_cap: Land per city for bonus cap (default 5000)
        land_bonus_cap: Maximum land bonus (default 2.0)
        extractor_bonus_per_count: Bonus per extractor (default 0.12)
    
    Returns:
        ResourceProductionResult with all components
    """
    # Calculate land bonus
    land_bonus = 1.0 + (city_land / land_per_city_cap)
    land_bonus = min(land_bonus, land_bonus_cap)
    
    # Calculate extractor bonus
    extractor_bonus = 1.0 + (extractor_bonus_per_count * extractor_count)
    
    # Calculate tick production
    tick_production = base_production * land_bonus * extractor_bonus * policy_modifier
    
    return ResourceProductionResult(
        tick_production=tick_production,
        land_bonus=land_bonus,
        extractor_bonus=extractor_bonus,
        policy_modifier=policy_modifier
    )


# ==================== POPULATION FORMULAS ====================

def calculate_city_population(
    city_infrastructure: int,
    city_land: float,
    city_age_days: int,
    crime: float,
    disease: float,
    happiness: int
) -> PopulationResult:
    """
    Calculate city population.
    
    Formula:
    Base Population = 100 × Infra × Land × city_age_multiplier × crime_multiplier × disease_multiplier × happiness_multiplier
    city_age_multiplier = 1.00 + 0.01 × days_since_built
    crime_multiplier = (100 - crime) / 100 (so 27% crime = 0.73)
    disease_multiplier = (100 - disease) / 100
    
    Args:
        city_infrastructure: Infrastructure level in the city
        city_land: Land in the city
        city_age_days: Days since city founding
        crime: Crime level (0-100 scale)
        disease: Disease level (0-100 scale)
        happiness: Happiness level (0-10 scale)
    
    Returns:
        PopulationResult with all components
    """
    # Calculate multipliers
    city_age_multiplier = 1.00 + (city_age_days * 0.01)  # +1% per day
    crime_multiplier = max(0.0, (100.0 - crime) / 100.0)  # 27% crime = 0.73
    disease_multiplier = max(0.0, (100.0 - disease) / 100.0)
    happiness_multiplier = max(0.1, happiness / 10.0)  # Scale happiness to 0.1-1.0
    
    # Calculate base population
    base_population = city_infrastructure * city_land * city_age_multiplier * crime_multiplier * disease_multiplier * happiness_multiplier
    
    return PopulationResult(
        base_population=base_population,
        pollution_penalty=0.0,  # Not tracked
        age_bonus=0.0,  # No longer used in new formula
        environment_bonus=0.0,  # No longer used in new formula
        disease_penalty=0.0,  # No longer used in new formula
        crime_penalty=0.0,  # No longer used in new formula
        final_population=max(0, base_population)  # Ensure non-negative
    )


# ==================== CRIME FORMULAS ====================

def calculate_city_crime(
    city_infrastructure: int,
    city_land: float,
    city_population: int,
    city_environment: float,
    crime_bonus_sum: float,
    happiness_bonus_sum: int
) -> float:
    """
    Calculate city crime level (0-100 scale).
    
    Formula:
    Base Crime = 20 (starting crime)
    Infrastructure Effect: +0.5 per 100 infrastructure (urbanization increases crime)
    Population Density Effect: +0.3 per 1000 citizens per 100 land (crowding increases crime)
    Environment Effect: -0.2 per point of environment (good environment reduces crime)
    Happiness Effect: -0.5 per point of happiness (happy citizens less likely to commit crime)
    Bonuses: Sum of all crime bonuses from improvements/wonders/projects/policies
    
    Final Crime = Base + Infra_Effect + Density_Effect + Environment_Effect + Happiness_Effect + Bonuses
    Clamped to 0-100 range.
    
    Args:
        city_infrastructure: Infrastructure level in the city
        city_land: Land in the city
        city_population: Population in the city
        city_environment: Environment level (0-100 scale)
        crime_bonus_sum: Sum of crime bonuses from improvements/wonders/projects/policies
        happiness_bonus_sum: Sum of happiness bonuses from improvements/wonders/resources
    
    Returns:
        Crime level (0-100 scale)
    """
    # Base crime
    base_crime = 20.0
    
    # Infrastructure effect (urbanization increases crime)
    infra_effect = (city_infrastructure / 100.0) * 0.5
    
    # Population density effect (crowding increases crime)
    population_density = city_population / max(1, city_land / 100.0)  # citizens per 100 land
    density_effect = (population_density / 1000.0) * 0.3
    
    # Environment effect (good environment reduces crime)
    environment_effect = -(city_environment / 100.0) * 20.0
    
    # Happiness effect (happy citizens less likely to commit crime)
    happiness_effect = -(happiness_bonus_sum / 10.0) * 5.0
    
    # Calculate total crime
    total_crime = base_crime + infra_effect + density_effect + environment_effect + happiness_effect + crime_bonus_sum
    
    # Clamp to 0-100 range
    return max(0.0, min(100.0, total_crime))


# ==================== DISEASE FORMULAS ====================

def calculate_city_disease(
    city_infrastructure: int,
    city_land: float,
    city_population: int,
    city_environment: float,
    disease_bonus_sum: float
) -> float:
    """
    Calculate city disease level (0-100 scale).
    
    Formula:
    Base Disease = 15 (starting disease)
    Infrastructure Effect: +0.3 per 100 infrastructure (urbanization increases disease spread)
    Population Density Effect: +0.5 per 1000 citizens per 100 land (crowding increases disease)
    Environment Effect: -0.3 per point of environment (good environment reduces disease)
    Bonuses: Sum of all disease bonuses from improvements/wonders/resources/policies
    
    Final Disease = Base + Infra_Effect + Density_Effect + Environment_Effect + Bonuses
    Clamped to 0-100 range.
    
    Args:
        city_infrastructure: Infrastructure level in the city
        city_land: Land in the city
        city_population: Population in the city
        city_environment: Environment level (0-100 scale)
        disease_bonus_sum: Sum of disease bonuses from improvements/wonders/resources/policies
    
    Returns:
        Disease level (0-100 scale)
    """
    # Base disease
    base_disease = 15.0
    
    # Infrastructure effect (urbanization increases disease spread)
    infra_effect = (city_infrastructure / 100.0) * 0.3
    
    # Population density effect (crowding increases disease)
    population_density = city_population / max(1, city_land / 100.0)  # citizens per 100 land
    density_effect = (population_density / 1000.0) * 0.5
    
    # Environment effect (good environment reduces disease)
    environment_effect = -(city_environment / 100.0) * 25.0
    
    # Calculate total disease
    total_disease = base_disease + infra_effect + density_effect + environment_effect + disease_bonus_sum
    
    # Clamp to 0-100 range
    return max(0.0, min(100.0, total_disease))


# ==================== ENVIRONMENT FORMULAS ====================

def calculate_city_environment(
    city_infrastructure: int,
    city_land: float,
    city_population: int,
    environment_bonus_sum: float
) -> float:
    """
    Calculate city environment level (0-100 scale).
    
    Formula:
    Base Environment = 90 (starting environment - pristine)
    Infrastructure Effect: -0.4 per 100 infrastructure (industrialization harms environment)
    Population Density Effect: -0.2 per 1000 citizens per 100 land (overcrowding harms environment)
    Land Effect: +0.1 per 100 land (more land = better environment)
    Bonuses: Sum of all environment bonuses from improvements/wonders/resources/policies
    
    Final Environment = Base + Infra_Effect + Density_Effect + Land_Effect + Bonuses
    Clamped to 0-100 range.
    
    Args:
        city_infrastructure: Infrastructure level in the city
        city_land: Land in the city
        city_population: Population in the city
        environment_bonus_sum: Sum of environment bonuses from improvements/wonders/resources/policies
    
    Returns:
        Environment level (0-100 scale)
    """
    # Base environment (pristine)
    base_environment = 90.0
    
    # Infrastructure effect (industrialization harms environment)
    infra_effect = -(city_infrastructure / 100.0) * 0.4
    
    # Population density effect (overcrowding harms environment)
    population_density = city_population / max(1, city_land / 100.0)  # citizens per 100 land
    density_effect = -(population_density / 1000.0) * 0.2
    
    # Land effect (more land = better environment)
    land_effect = (city_land / 100.0) * 0.1
    
    # Calculate total environment
    total_environment = base_environment + infra_effect + density_effect + land_effect + environment_bonus_sum
    
    # Clamp to 0-100 range
    return max(0.0, min(100.0, total_environment))


# ==================== POWER COST FORMULAS ====================

def calculate_power_cost(
    base_cost_per_city: float,
    city_count: int,
    power_plant_count: int
) -> float:
    """
    Calculate power cost per tick.
    
    Formula:
    - If 1 power plant: Pays full resource/cash cost for each city
    - If 2 power plants: Each pays 50% of resource/cash cost for each city
    - Costs scale with city count
    
    Args:
        base_cost_per_city: Base cost per city per tick
        city_count: Number of cities
        power_plant_count: Number of power plants (1 or 2)
    
    Returns:
        Total power cost per tick
    """
    if power_plant_count == 0:
        return 0.0
    elif power_plant_count == 1:
        return base_cost_per_city * city_count
    elif power_plant_count == 2:
        return (base_cost_per_city * 0.5) * city_count
    else:
        # More than 2 power plants (shouldn't happen normally, but handle gracefully)
        return (base_cost_per_city / power_plant_count) * city_count


# ==================== MILITARY CAP FORMULAS ====================

def calculate_tech_efficiency_multiplier(technology: int) -> float:
    """
    Calculate tech-based efficiency multiplier for military units.
    
    Formula: 2^(Tech / 1000)
    - 0 tech: 1.0x (base)
    - 1000 tech: 2.0x
    - 2000 tech: 4.0x
    - 3000 tech: 8.0x
    - 4000 tech: 16.0x
    - 5000 tech: 32.0x (capped)
    
    Args:
        technology: Technology level (0-5000+)
    
    Returns:
        Efficiency multiplier (capped at 32.0x for 5000+ tech)
    """
    import math
    multiplier = 2 ** (technology / 1000.0)
    return min(multiplier, 32.0)  # Cap at 32x (5000 tech)


def calculate_damage_vs_repair_chance(technology: int) -> float:
    """
    Calculate the percentage of unit losses that become damaged (not destroyed) based on tech level.
    
    Formula: 5% at 1000 tech, +1% every 250 tech after
    - 0-999 tech: 0% (no damaged units)
    - 1000 tech: 5%
    - 1250 tech: 6%
    - 1500 tech: 7%
    - 1750 tech: 8%
    - 2000 tech: 9%
    - 2250 tech: 10%
    - 2500 tech: 11%
    - 2750 tech: 12%
    - 3000 tech: 13%
    - 3250 tech: 14%
    - 3500 tech: 15%
    - 3750 tech: 16%
    - 4000 tech: 17%
    - 4250 tech: 18%
    - 4500 tech: 19%
    - 4750 tech: 20%
    - 5000 tech: 21%
    - 5250 tech: 22%
    - 5500 tech: 23%
    - 5750 tech: 24%
    - 6000 tech: 25%
    - 6250 tech: 26%
    - 6500 tech: 27%
    - 6750 tech: 28%
    - 7000 tech: 29%
    - 7250 tech: 30%
    - 7500 tech: 31%
    - 7750 tech: 32%
    - 8000 tech: 33%
    - 8250 tech: 34%
    - 8500 tech: 35%
    - 8750 tech: 36%
    - 9000 tech: 37%
    - 9250 tech: 38%
    - 9500 tech: 39%
    - 9750 tech: 40%
    - 10000 tech: 41%
    - 10250 tech: 42%
    - 10500 tech: 43%
    - 10750 tech: 44%
    - 11000 tech: 45%
    - 11250 tech: 46%
    - 11500 tech: 47%
    - 11750 tech: 48%
    - 12000 tech: 49%
    - 12250 tech: 50% (capped)
    
    Args:
        technology: Technology level (0-12250+)
    
    Returns:
        Percentage of losses that become damaged (0.0-0.50)
    """
    if technology < 1000:
        return 0.0
    
    # Calculate additional percentage above 5%
    additional_percent = ((technology - 1000) // 250) * 0.01
    return min(0.05 + additional_percent, 0.50)  # Cap at 50%


def calculate_unit_losses_with_damage(
    total_losses: int,
    technology: int
) -> Dict[str, int]:
    """
    Calculate how many units are destroyed vs damaged based on tech level.
    
    Args:
        total_losses: Total number of units lost
        technology: Technology level for damage vs repair chance
    
    Returns:
        Dictionary with 'destroyed' and 'damaged' counts
    """
    damage_chance = calculate_damage_vs_repair_chance(technology)
    damaged = int(total_losses * damage_chance)
    destroyed = total_losses - damaged
    return {"destroyed": destroyed, "damaged": damaged}


def calculate_repair_cost(damaged_units: int, unit_type: str, technology: int = 0) -> float:
    """
    Calculate the cost to repair damaged units.
    
    Formula: Base cost per unit × Damaged Units × (1 - Tech Discount)
    - Tech Discount: 0.5% per 1000 tech (max 2.5% at 5000 tech)
    - Base costs: Soldiers $0.50, Tanks $25, Aircraft $100, Ships $500
    
    Args:
        damaged_units: Number of damaged units to repair
        unit_type: Type of unit ("soldier", "tank", "aircraft", "ship")
        technology: Technology level for discount
    
    Returns:
        Total repair cost in cash
    """
    base_costs = {
        "soldier": 0.50,
        "tank": 25.0,
        "aircraft": 100.0,
        "ship": 500.0
    }
    
    base_cost = base_costs.get(unit_type.lower(), 10.0)
    
    # Calculate tech discount
    tech_discount = min(0.005 * (technology / 1000.0), 0.025)  # Max 2.5% at 5000 tech
    discount_multiplier = 1.0 - tech_discount
    
    return base_cost * damaged_units * discount_multiplier


def calculate_supply_line_penalty(supply_lines_intact: bool, technology: int = 0) -> float:
    """
    Calculate the efficiency penalty when supply lines are cut.
    
    Formula: 50% base penalty when supply lines are cut, reduced by tech
    - Tech reduces penalty by 1% per 1000 tech (max 5% reduction at 5000 tech)
    - Final penalty = 50% - Tech Reduction (min 45% at 5000 tech)
    
    Args:
        supply_lines_intact: Whether supply lines are intact
        technology: Technology level for penalty reduction
    
    Returns:
        Efficiency multiplier (1.0 if intact, 0.45-0.50 if cut)
    """
    if supply_lines_intact:
        return 1.0
    
    # Calculate tech reduction to penalty
    tech_reduction = min(0.01 * (technology / 1000.0), 0.05)  # Max 5% at 5000 tech
    
    # Base penalty is 50%, reduced by tech
    penalty = 0.50 - tech_reduction
    
    return 1.0 - penalty  # Return as efficiency multiplier (0.45-0.50)


def calculate_unit_efficiency_with_tech(
    base_efficiency: float = 1.0,
    technology: int = 0,
    unit_type: str = "soldier"
) -> float:
    """
    Calculate unit efficiency with tech-based scaling.
    
    Args:
        base_efficiency: Base efficiency multiplier from improvements/projects/wonders
        technology: Technology level
        unit_type: Type of unit (for unit-specific scaling if needed)
    
    Returns:
        Total efficiency multiplier
    """
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    return base_efficiency * tech_multiplier


def calculate_max_soldiers(
    total_population: float,
    soldier_efficiency_bonus: float = 0.0,
    technology: int = 0
) -> int:
    """
    Calculate maximum soldier capacity.
    
    Formula: Max Soldiers = (Total Nation Population / 10) × Soldier Efficiency Bonus × Tech Multiplier
    
    Args:
        total_population: Total nation population
        soldier_efficiency_bonus: Percentage bonus to soldier efficiency (0.0 to 1.0)
        technology: Technology level for tech-based scaling
    
    Returns:
        Maximum soldier count
    """
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    return int((total_population / 10.0) * (1.0 + soldier_efficiency_bonus) * tech_multiplier)


def calculate_max_tanks(
    total_population: float,
    tank_efficiency_bonus: float = 0.0,
    technology: int = 0
) -> int:
    """
    Calculate maximum tank capacity.
    
    Formula: Max Tanks = (Total Nation Population / 50) × Tank Efficiency Bonus × Tech Multiplier
    
    Args:
        total_population: Total nation population
        tank_efficiency_bonus: Percentage bonus to tank efficiency (0.0 to 1.0)
        technology: Technology level for tech-based scaling
    
    Returns:
        Maximum tank count
    """
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    return int((total_population / 50.0) * (1.0 + tank_efficiency_bonus) * tech_multiplier)


def calculate_max_aircraft(
    total_population: float,
    aircraft_efficiency_bonus: float = 0.0,
    technology: int = 0
) -> int:
    """
    Calculate maximum aircraft capacity.
    
    Formula: Max Aircraft = (Total Nation Population / 100) × Aircraft Efficiency Bonus × Tech Multiplier
    
    Args:
        total_population: Total nation population
        aircraft_efficiency_bonus: Percentage bonus to aircraft efficiency (0.0 to 1.0)
        technology: Technology level for tech-based scaling
    
    Returns:
        Maximum aircraft count
    """
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    return int((total_population / 100.0) * (1.0 + aircraft_efficiency_bonus) * tech_multiplier)


def calculate_max_ships(
    total_population: float,
    ship_efficiency_bonus: float = 0.0,
    technology: int = 0
) -> int:
    """
    Calculate maximum ship capacity.
    
    Formula: Max Ships = (Total Nation Population / 200) × Ship Efficiency Bonus × Tech Multiplier
    
    Args:
        total_population: Total nation population
        ship_efficiency_bonus: Percentage bonus to ship efficiency (0.0 to 1.0)
        technology: Technology level for tech-based scaling
    
    Returns:
        Maximum ship count
    """
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    return int((total_population / 200.0) * (1.0 + ship_efficiency_bonus) * tech_multiplier)


def calculate_max_missiles(
    missile_battery_count: int,
    missile_cap_per_battery: int = 1
) -> int:
    """
    Calculate maximum missile capacity.
    
    Args:
        missile_battery_count: Number of missile batteries
        missile_cap_per_battery: Missile capacity per battery (default 1)
    
    Returns:
        Maximum missile count
    """
    return missile_battery_count * missile_cap_per_battery


def calculate_max_nukes(
    nuclear_silo_count: int,
    nuke_cap_per_silo: int = 1
) -> int:
    """
    Calculate maximum nuclear weapon capacity.
    
    Args:
        nuclear_silo_count: Number of nuclear silos
        nuke_cap_per_silo: Nuke capacity per silo (default 1)
    
    Returns:
        Maximum nuke count
    """
    return nuclear_silo_count * nuke_cap_per_silo


# ==================== DEFENSE & STRENGTH FORMULAS ====================

def calculate_defense_strength(
    soldiers: int,
    tanks: int,
    aircraft: int,
    ships: int
) -> float:
    """
    Calculate defense strength.
    
    Formula: Defense Strength = (Soldiers × 1) + (Tanks × 40) + (Aircraft × 100) + (Ships × 250)
    
    Args:
        soldiers: Number of soldiers
        tanks: Number of tanks
        aircraft: Number of aircraft
        ships: Number of ships
    
    Returns:
        Defense strength score
    """
    return (soldiers * 1) + (tanks * 40) + (aircraft * 100) + (ships * 250)


def calculate_military_score(
    soldiers: int,
    tanks: int,
    aircraft: int,
    ships: int,
    nukes: int,
    infrastructure: int,
    technology: int,
    city_count: int
) -> float:
    """
    Calculate military score (NS - Nation Strength).
    
    Formula:
    - Soldiers: ×1
    - Tanks: ×40
    - Aircraft: ×100
    - Ships: ×250
    - Nukes: ×1,000
    - Infrastructure: ×1 per 100 infra
    - Technology: ×1 per 10 tech
    - Cities: ×100 per city
    
    Args:
        soldiers: Number of soldiers
        tanks: Number of tanks
        aircraft: Number of aircraft
        ships: Number of ships
        nukes: Number of nukes
        infrastructure: Total infrastructure
        technology: Technology level
        city_count: Number of cities
    
    Returns:
        Military score
    """
    return (
        (soldiers * 1) +
        (tanks * 40) +
        (aircraft * 100) +
        (ships * 250) +
        (nukes * 1000) +
        (infrastructure / 100) +
        (technology / 10) +
        (city_count * 100)
    )


def calculate_defense_happiness_effect(
    defense_strength: float,
    population: float
) -> int:
    """
    Calculate happiness effect from defense strength.
    
    Effects:
    - Too Weak: If Defense Strength < (Population ÷ 100), citizens feel unsafe: Happiness -3
    - Balanced: If Defense Strength between (Population ÷ 100) and (Population ÷ 50), citizens feel secure: Happiness +1
    - Too Strong: If Defense Strength > (Population ÷ 50), citizens feel oppressed: Happiness -2
    
    Args:
        defense_strength: Defense strength score
        population: Total population
    
    Returns:
        Happiness modifier
    """
    weak_threshold = population / 100.0
    strong_threshold = population / 50.0
    
    if defense_strength < weak_threshold:
        return -3  # Too Weak
    elif defense_strength <= strong_threshold:
        return 1  # Balanced
    else:
        return -2  # Too Strong


# ==================== COMBAT FORMULAS ====================

def calculate_ground_attack_strength(
    soldiers: int,
    tanks: int,
    soldier_efficiency: float = 1.0,
    tank_efficiency: float = 1.0,
    technology: int = 0,
    supply_lines_intact: bool = True,
    first_strike_bonus: float = 0.0,
    commander_efficiency_bonus: float = 0.0
) -> float:
    """
    Calculate ground attack strength.
    
    Formula: Attack Strength = ((Soldiers × 1) + (Tanks × 40)) × Soldier Efficiency × Tank Efficiency × Tech Multiplier × Supply Line Multiplier × (1 + First Strike) × (1 + Commander Bonus)
    
    Args:
        soldiers: Number of soldiers
        tanks: Number of tanks
        soldier_efficiency: Soldier efficiency multiplier (default 1.0)
        tank_efficiency: Tank efficiency multiplier (default 1.0)
        technology: Technology level for tech-based scaling
        supply_lines_intact: Whether supply lines are intact (default True)
        first_strike_bonus: First-strike bonus (default 0.0)
        commander_efficiency_bonus: Commander efficiency bonus (default 0.0)
    
    Returns:
        Attack strength score
    """
    base_strength = (soldiers * 1) + (tanks * 40)
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    supply_multiplier = calculate_supply_line_penalty(supply_lines_intact, technology)
    commander_multiplier = 1.0 + commander_efficiency_bonus
    return base_strength * soldier_efficiency * tank_efficiency * tech_multiplier * supply_multiplier * (1.0 + first_strike_bonus) * commander_multiplier


def calculate_ground_defense_strength(
    enemy_soldiers: int,
    enemy_tanks: int,
    soldier_efficiency: float = 1.0,
    tank_efficiency: float = 1.0,
    technology: int = 0,
    city_resistance: float = 1.0,
    supply_lines_intact: bool = True,
    commander_efficiency_bonus: float = 0.0
) -> float:
    """
    Calculate ground defense strength.
    
    Formula: Defense Strength = ((Enemy Soldiers × 1) + (Enemy Tanks × 40)) × Soldier Efficiency × Tank Efficiency × Tech Multiplier × Supply Line Multiplier × City Resistance × (1 + Commander Bonus)
    
    Args:
        enemy_soldiers: Enemy soldier count
        enemy_tanks: Enemy tank count
        soldier_efficiency: Soldier efficiency multiplier (default 1.0)
        tank_efficiency: Tank efficiency multiplier (default 1.0)
        technology: Technology level for tech-based scaling
        city_resistance: City resistance multiplier (default 1.0, typical range 1.0-2.0)
        supply_lines_intact: Whether supply lines are intact (default True)
        commander_efficiency_bonus: Commander efficiency bonus (default 0.0)
    
    Returns:
        Defense strength score
    """
    base_strength = (enemy_soldiers * 1) + (enemy_tanks * 40)
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    supply_multiplier = calculate_supply_line_penalty(supply_lines_intact, technology)
    commander_multiplier = 1.0 + commander_efficiency_bonus
    return base_strength * soldier_efficiency * tank_efficiency * tech_multiplier * supply_multiplier * city_resistance * commander_multiplier


def calculate_naval_strength(
    destroyers: int,
    cruisers: int,
    battleships: int,
    carriers: int,
    ship_efficiency: float = 1.0,
    technology: int = 0
) -> float:
    """
    Calculate naval strength.
    
    Formula: Naval Strength = ((Destroyers × 25) + (Cruisers × 50) + (Battleships × 100) + (Carriers × 150)) × Ship Efficiency × Tech Multiplier
    
    Args:
        destroyers: Number of destroyers
        cruisers: Number of cruisers
        battleships: Number of battleships
        carriers: Number of carriers
        ship_efficiency: Ship efficiency multiplier (default 1.0)
        technology: Technology level for tech-based scaling
    
    Returns:
        Naval strength score
    """
    base_strength = (destroyers * 25) + (cruisers * 50) + (battleships * 100) + (carriers * 150)
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    return base_strength * ship_efficiency * tech_multiplier


def calculate_combat_result(
    attack_strength: float,
    defense_strength: float,
    is_ground_combat: bool = True
) -> CombatResult:
    """
    Calculate combat result.
    
    Damage Scales with Attack/Defense Ratio:
    - Ratio > 1.5: Immense Victory (massive unit/infra losses)
    - Ratio 1.1–1.5: Moderate Victory (significant losses)
    - Ratio 0.9–1.1: Pyrrhic Victory (both sides take heavy losses)
    - Ratio 0.5–0.9: Defeat (attacker takes heavy losses)
    - Ratio < 0.5: Utter Failure (attacker decimated)
    
    Unit Destruction: Up to 15% of defending soldiers/tanks destroyed on Immense Victory
    Infrastructure Destruction: 5–15% of city infrastructure destroyed based on victory level
    Loot: Steals 5–15% of enemy cash based on victory level
    
    Args:
        attack_strength: Attacker's strength
        defense_strength: Defender's strength
        is_ground_combat: Whether this is ground combat (affects war score)
    
    Returns:
        CombatResult with all components
    """
    # Calculate attack/defense ratio
    if defense_strength == 0:
        attack_defense_ratio = 10.0  # Cap at 10:1 if defender has no strength
    else:
        attack_defense_ratio = attack_strength / defense_strength
    
    # Determine victory level
    if attack_defense_ratio > 1.5:
        victory_level = VictoryLevel.IMMENSE_VICTORY
        unit_destruction_percent = 0.15
        infrastructure_destruction_percent = 0.15
        loot_percent = 0.15
        war_score_change = 15.0 if is_ground_combat else 0.0
    elif attack_defense_ratio > 1.1:
        victory_level = VictoryLevel.MODERATE_VICTORY
        unit_destruction_percent = 0.10
        infrastructure_destruction_percent = 0.10
        loot_percent = 0.10
        war_score_change = 10.0 if is_ground_combat else 0.0
    elif attack_defense_ratio >= 0.9:
        victory_level = VictoryLevel.PYRRHIC_VICTORY
        unit_destruction_percent = 0.05
        infrastructure_destruction_percent = 0.05
        loot_percent = 0.05
        war_score_change = 0.0
    elif attack_defense_ratio >= 0.5:
        victory_level = VictoryLevel.DEFEAT
        unit_destruction_percent = 0.0
        infrastructure_destruction_percent = 0.0
        loot_percent = 0.0
        war_score_change = -10.0 if is_ground_combat else 0.0
    else:
        victory_level = VictoryLevel.UTTER_FAILURE
        unit_destruction_percent = 0.0
        infrastructure_destruction_percent = 0.0
        loot_percent = 0.0
        war_score_change = -15.0 if is_ground_combat else 0.0
    
    return CombatResult(
        attack_strength=attack_strength,
        defense_strength=defense_strength,
        attack_defense_ratio=attack_defense_ratio,
        victory_level=victory_level,
        unit_destruction_percent=unit_destruction_percent,
        infrastructure_destruction_percent=infrastructure_destruction_percent,
        loot_percent=loot_percent,
        war_score_change=war_score_change
    )


def calculate_airstrike_damage(
    aircraft_count: int,
    aircraft_type: str = "fighter",  # "fighter" or "bomber"
    aircraft_efficiency: float = 1.0,
    air_superiority_bonus: float = 0.0,
    air_defense_bonus: float = 0.0,
    technology: int = 0,
    commander_efficiency_bonus: float = 0.0
) -> Dict[str, float]:
    """
    Calculate airstrike damage based on aircraft type.
    
    Fighter Aircraft (Air Superiority):
    - Aircraft Destruction: 15-25% of enemy aircraft destroyed
    - Ground Units: 5-10% of targeted units destroyed
    - Infrastructure: 2-5% of city infrastructure destroyed
    - Money: Steals 1-3% of enemy cash
    Aircraft Losses: 3-7% of attacking aircraft destroyed per airstrike
    
    Bomber Aircraft (Strategic Bombing):
    - Infrastructure: 8-15% of city infrastructure destroyed (primary focus)
    - Ground Units: 10-15% of targeted units destroyed
    - Ships/Aircraft: 5-8% of targeted units destroyed
    - Money: Steals 4-8% of enemy cash
    Aircraft Losses: 8-12% of attacking aircraft destroyed per airstrike
    
    Args:
        aircraft_count: Number of aircraft
        aircraft_type: Type of aircraft ("fighter" or "bomber")
        aircraft_efficiency: Aircraft efficiency multiplier (default 1.0)
        air_superiority_bonus: Air Superiority bonus (default 0.0)
        air_defense_bonus: Air Defense bonus (default 0.0)
        technology: Technology level for tech-based scaling
        commander_efficiency_bonus: Commander efficiency bonus (default 0.0)
    
    Returns:
        Dictionary with damage values
    """
    # Calculate base damage multiplier with tech scaling
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    commander_multiplier = 1.0 + commander_efficiency_bonus
    damage_multiplier = aircraft_efficiency * (1.0 + air_superiority_bonus) * tech_multiplier * commander_multiplier
    
    # Calculate aircraft losses
    if aircraft_type == "fighter":
        base_loss_percent = 0.05  # 5% base for fighters
    else:  # bomber
        base_loss_percent = 0.10  # 10% base for bombers
    
    loss_multiplier = 1.0 + air_defense_bonus  # Air defense increases losses
    aircraft_losses_percent = base_loss_percent * loss_multiplier
    
    # Calculate destruction ranges based on aircraft type
    if aircraft_type == "fighter":
        # Fighters excel at air-to-air combat
        infrastructure_destruction = (0.02 + (0.03 * damage_multiplier))  # 2-5%
        unit_destruction = (0.05 + (0.05 * damage_multiplier))  # 5-10%
        ship_aircraft_destruction = (0.15 + (0.10 * damage_multiplier))  # 15-25% (anti-air)
        money_stolen = (0.01 + (0.02 * damage_multiplier))  # 1-3%
    else:  # bomber
        # Bombers excel at infrastructure destruction
        infrastructure_destruction = (0.08 + (0.07 * damage_multiplier))  # 8-15%
        unit_destruction = (0.10 + (0.05 * damage_multiplier))  # 10-15%
        ship_aircraft_destruction = (0.05 + (0.03 * damage_multiplier))  # 5-8%
        money_stolen = (0.04 + (0.04 * damage_multiplier))  # 4-8%
    
    return {
        "infrastructure_destruction_percent": min(infrastructure_destruction, 0.15),
        "unit_destruction_percent": min(unit_destruction, 0.15),
        "ship_aircraft_destruction_percent": min(ship_aircraft_destruction, 0.25),
        "money_stolen_percent": min(money_stolen, 0.08),
        "aircraft_losses_percent": min(aircraft_losses_percent, 0.15)
    }


def calculate_naval_damage(
    destroyers: int,
    cruisers: int,
    battleships: int,
    carriers: int,
    submarines: int = 0,
    enemy_destroyers: int = 0,
    enemy_cruisers: int = 0,
    enemy_battleships: int = 0,
    enemy_carriers: int = 0,
    ship_efficiency: float = 1.0,
    technology: int = 0,
    commander_efficiency_bonus: float = 0.0
) -> Dict[str, float]:
    """
    Calculate naval battle damage with ship-specific roles.
    
    Ship Roles:
    - Destroyers: Anti-submarine warfare, screening, fast attack (bonus vs submarines)
    - Cruisers: Anti-aircraft defense, medium combat (bonus vs aircraft)
    - Battleships: Heavy combat, shore bombardment (bonus vs ships/infrastructure)
    - Carriers: Air support, force projection (bonus to aircraft effectiveness)
    - Submarines: Stealth attacks, surprise bonus (bonus to first strike, hard to detect)
    
    Damage Calculations:
    - Ship Destruction: 8-20% of enemy ships destroyed based on victory level and ship types
    - Infrastructure Damage: 3-15% of coastal city infrastructure destroyed
    - Aircraft Losses: Additional aircraft destroyed by cruisers (anti-air)
    - Submarine Detection: Destroyers have bonus chance to detect/destroy submarines
    
    Args:
        destroyers: Number of destroyers
        cruisers: Number of cruisers
        battleships: Number of battleships
        carriers: Number of carriers
        submarines: Number of submarines
        enemy_destroyers: Enemy destroyer count
        enemy_cruisers: Enemy cruiser count
        enemy_battleships: Enemy battleship count
        enemy_carriers: Enemy carrier count
        ship_efficiency: Ship efficiency multiplier (default 1.0)
        technology: Technology level for tech-based scaling
        commander_efficiency_bonus: Commander efficiency bonus (default 0.0)
    
    Returns:
        Dictionary with damage values
    """
    # Calculate base naval strength with tech scaling
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    commander_multiplier = 1.0 + commander_efficiency_bonus
    friendly_naval_strength = ((destroyers * 250) + (cruisers * 500) + (battleships * 1000) + (carriers * 1500) + (submarines * 750)) * ship_efficiency * tech_multiplier * commander_multiplier
    enemy_naval_strength = (enemy_destroyers * 250) + (enemy_cruisers * 500) + (enemy_battleships * 1000) + (enemy_carriers * 1500)
    
    # Calculate combat result
    combat_result = calculate_combat_result(friendly_naval_strength, enemy_naval_strength, is_ground_combat=False)
    
    # Scale destruction based on victory level and ship composition
    if combat_result.victory_level == VictoryLevel.IMMENSE_VICTORY:
        ship_destruction = 0.20
        infra_destruction = 0.10
    elif combat_result.victory_level == VictoryLevel.MODERATE_VICTORY:
        ship_destruction = 0.15
        infra_destruction = 0.08
    elif combat_result.victory_level == VictoryLevel.PYRRHIC_VICTORY:
        ship_destruction = 0.10
        infra_destruction = 0.05
    elif combat_result.victory_level == VictoryLevel.DEFEAT:
        ship_destruction = 0.05
        infra_destruction = 0.03
    else:  # Utter Failure
        ship_destruction = 0.0
        infra_destruction = 0.0
    
    # Ship-specific bonuses
    destroyer_bonus = 0.0  # Bonus vs submarines
    cruiser_bonus = 0.0  # Bonus vs aircraft
    battleship_bonus = 0.0  # Bonus vs ships/infrastructure
    carrier_bonus = 0.0  # Bonus to aircraft effectiveness
    submarine_bonus = 0.0  # Surprise attack bonus
    
    if destroyers > 0 and submarines > 0:
        destroyer_bonus = 0.15  # Destroyers get +15% vs submarines
    if cruisers > 0:
        cruiser_bonus = 0.10  # Cruisers get +10% anti-air bonus
    if battleships > 0:
        battleship_bonus = 0.20  # Battleships get +20% damage bonus
    if carriers > 0:
        carrier_bonus = 0.15  # Carriers boost aircraft effectiveness
    if submarines > 0:
        submarine_bonus = 0.25  # Submarines get surprise attack bonus
    
    # Apply ship-specific bonuses
    ship_destruction *= (1.0 + destroyer_bonus + battleship_bonus + submarine_bonus)
    infra_destruction *= (1.0 + battleship_bonus)
    
    return {
        "ship_destruction_percent": min(ship_destruction * ship_efficiency * tech_multiplier, 0.30),
        "infrastructure_destruction_percent": min(infra_destruction * ship_efficiency * tech_multiplier, 0.15),
        "destroyer_anti_sub_bonus": destroyer_bonus,
        "cruiser_anti_air_bonus": cruiser_bonus,
        "battleship_damage_bonus": battleship_bonus,
        "carrier_air_bonus": carrier_bonus,
        "submarine_surprise_bonus": submarine_bonus,
        "war_score_change": combat_result.war_score_change
    }


def calculate_missile_damage(
    missile_count: int,
    intercept_chance: float = 0.75,
    iron_dome_bonus: float = 0.0,
    technology: int = 0
) -> Dict[str, float]:
    """
    Calculate missile strike damage with tech-based scaling.
    
    Destruction (scales with tech):
    - Infrastructure: 50–150 infra destroyed per missile (scales with tech)
    - Tanks: 30–80 tanks destroyed per missile (scales with tech)
    - Aircraft: 5–15 aircraft destroyed per missile (scales with tech)
    Intercept Chance: 75% base, reduced by 25% with Iron Dome wonder
    
    Tech Scaling: Higher tech increases damage output by up to 2x at 5000 tech
    
    Args:
        missile_count: Number of missiles
        intercept_chance: Base intercept chance (default 0.75)
        iron_dome_bonus: Iron Dome bonus (default 0.0)
        technology: Technology level for tech-based scaling
    
    Returns:
        Dictionary with damage values
    """
    # Calculate effective intercept chance
    effective_intercept_chance = intercept_chance - iron_dome_bonus
    
    # Calculate expected hits (assuming random distribution)
    expected_hits = missile_count * (1.0 - effective_intercept_chance)
    
    # Calculate tech multiplier for damage
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    
    # Damage per missile (scales with tech)
    infra_per_missile = 100 * tech_multiplier  # Base 100, scales with tech
    tanks_per_missile = 55 * tech_multiplier  # Base 55, scales with tech
    aircraft_per_missile = 10 * tech_multiplier  # Base 10, scales with tech
    
    return {
        "expected_infra_destroyed": infra_per_missile * expected_hits,
        "expected_tanks_destroyed": tanks_per_missile * expected_hits,
        "expected_aircraft_destroyed": aircraft_per_missile * expected_hits,
        "intercept_chance": max(0.0, effective_intercept_chance),
        "missiles_consumed": missile_count  # All consumed regardless of intercept
    }


def calculate_nuclear_damage(
    nuke_count: int,
    city_infrastructure: int,
    city_population: float,
    city_military_units: int,
    technology: int = 0
) -> Dict[str, float]:
    """
    Calculate nuclear strike damage with tech-based scaling.
    
    Destruction (scales with tech):
    - Infrastructure: 500–2,000 infra destroyed (scales with tech)
    - Population: 10–30% of city population killed (scales with tech)
    - Military: 25–50% of military units in targeted city destroyed (scales with tech)
    
    Tech Scaling: Higher tech increases damage output by up to 2x at 5000 tech
    
    Args:
        nuke_count: Number of nukes
        city_infrastructure: Infrastructure in target city
        city_population: Population in target city
        city_military_units: Military units in target city
        technology: Technology level for tech-based scaling
    
    Returns:
        Dictionary with damage values
    """
    # Calculate tech multiplier for damage
    tech_multiplier = calculate_tech_efficiency_multiplier(technology)
    
    # Damage per nuke (scales with tech)
    infra_per_nuke = 1250 * tech_multiplier  # Base 1250, scales with tech
    population_kill_percent = 0.20 * tech_multiplier  # Base 20%, scales with tech (capped at 50%)
    military_destroyed_percent = 0.375 * tech_multiplier  # Base 37.5%, scales with tech (capped at 75%)
    
    # Cap percentages
    population_kill_percent = min(population_kill_percent, 0.50)
    military_destroyed_percent = min(military_destroyed_percent, 0.75)
    
    return {
        "infra_destroyed": infra_per_nuke * nuke_count,
        "population_killed": city_population * population_kill_percent * nuke_count,
        "military_destroyed": city_military_units * military_destroyed_percent * nuke_count
    }


# ==================== WAR SCORE FORMULAS ====================

def calculate_war_score_change(
    attack_type: str,
    victory_level: VictoryLevel,
    war_score_gain_bonus: float = 0.0
) -> float:
    """
    Calculate war score change for an attack.
    
    War Score Calculation:
    - Ground Assault Victory: +5 to +15 War Score (based on victory level)
    - Ground Assault Defeat: -5 to -15 War Score
    - Airstrike Success: +3 to +8 War Score
    - Naval Battle Victory: +8 to +15 War Score
    - Naval Battle Defeat: -5 to -12 War Score
    - Missile Strike Success: +4 to +10 War Score
    - Nuclear Strike Success: +20 to +30 War Score
    - Raid Success: +3 to +7 War Score
    - Spy Operation Success: +2 to +6 War Score
    - Failed Operations: -2 to -5 War Score
    
    Args:
        attack_type: Type of attack
        victory_level: Victory level of the attack
        war_score_gain_bonus: Percentage bonus to war score gain
    
    Returns:
        War score change
    """
    base_change = 0.0
    
    if attack_type == "ground_assault":
        if victory_level == VictoryLevel.IMMENSE_VICTORY:
            base_change = 15.0
        elif victory_level == VictoryLevel.MODERATE_VICTORY:
            base_change = 10.0
        elif victory_level == VictoryLevel.PYRRHIC_VICTORY:
            base_change = 0.0
        elif victory_level == VictoryLevel.DEFEAT:
            base_change = -10.0
        else:  # Utter Failure
            base_change = -15.0
    elif attack_type == "airstrike":
        if victory_level in [VictoryLevel.IMMENSE_VICTORY, VictoryLevel.MODERATE_VICTORY]:
            base_change = 8.0
        elif victory_level == VictoryLevel.PYRRHIC_VICTORY:
            base_change = 5.0
        else:
            base_change = -3.0
    elif attack_type == "naval":
        if victory_level == VictoryLevel.IMMENSE_VICTORY:
            base_change = 15.0
        elif victory_level == VictoryLevel.MODERATE_VICTORY:
            base_change = 12.0
        elif victory_level == VictoryLevel.PYRRHIC_VICTORY:
            base_change = 0.0
        elif victory_level == VictoryLevel.DEFEAT:
            base_change = -8.0
        else:
            base_change = -12.0
    elif attack_type == "missile":
        if victory_level in [VictoryLevel.IMMENSE_VICTORY, VictoryLevel.MODERATE_VICTORY]:
            base_change = 10.0
        elif victory_level == VictoryLevel.PYRRHIC_VICTORY:
            base_change = 7.0
        else:
            base_change = -4.0
    elif attack_type == "nuclear":
        if victory_level in [VictoryLevel.IMMENSE_VICTORY, VictoryLevel.MODERATE_VICTORY]:
            base_change = 30.0
        elif victory_level == VictoryLevel.PYRRHIC_VICTORY:
            base_change = 25.0
        else:
            base_change = -5.0
    elif attack_type == "raid":
        if victory_level in [VictoryLevel.IMMENSE_VICTORY, VictoryLevel.MODERATE_VICTORY]:
            base_change = 7.0
        elif victory_level == VictoryLevel.PYRRHIC_VICTORY:
            base_change = 5.0
        else:
            base_change = -3.0
    elif attack_type == "spy":
        if victory_level in [VictoryLevel.IMMENSE_VICTORY, VictoryLevel.MODERATE_VICTORY]:
            base_change = 6.0
        elif victory_level == VictoryLevel.PYRRHIC_VICTORY:
            base_change = 4.0
        else:
            base_change = -4.0
    else:
        base_change = 0.0
    
    # Apply bonus
    if base_change > 0:
        base_change *= (1.0 + war_score_gain_bonus)
    
    return base_change


def calculate_resistance_recovery(
    current_resistance: float,
    is_under_attack: bool,
    recovery_rate: float = 5.0
) -> float:
    """
    Calculate resistance recovery.
    
    Resistance recovers 5 points/tick when not under attack.
    At 0 Resistance, the city is "occupied" — no income from that city.
    
    Args:
        current_resistance: Current resistance score (0-100)
        is_under_attack: Whether city is under attack
        recovery_rate: Recovery rate per tick (default 5.0)
    
    Returns:
        New resistance score
    """
    if is_under_attack:
        return current_resistance  # No recovery when under attack
    else:
        new_resistance = current_resistance + recovery_rate
        return min(new_resistance, 100.0)  # Cap at 100


# ==================== COST CALCULATION FORMULAS ====================

def calculate_infrastructure_cost(
    base_cost: float,
    city_count: int,
    infrastructure_cost_bonus: float = 0.0
) -> float:
    """
    Calculate infrastructure cost with aggressive scaling compound formula.
    
    Formula:
    - Base cost: $10,000 at level 100
    - Scaling: Compounds exponentially after level 100 with exponent 2.5
    - Cost = Base Cost × (Level / 100) ^ 2.5 × City Count × (1 + Bonus)
    
    Examples:
    - Level 100: $10,000 × 1.0 × city_count = $10,000 per city
    - Level 200: $10,000 × 2.0 ^ 2.5 × city_count = $56,569 per city
    - Level 500: $10,000 × 5.0 ^ 2.5 × city_count = $559,017 per city
    - Level 1000: $10,000 × 10.0 ^ 2.5 × city_count = $3,162,278 per city
    - Level 2500: $10,000 × 25.0 ^ 2.5 × city_count = $31,250,000 per city
    - Level 5000: $10,000 × 50.0 ^ 2.5 × city_count = $176,776,695 per city
    
    Args:
        base_cost: Current infrastructure level
        city_count: Number of cities
        infrastructure_cost_bonus: Percentage bonus to infrastructure cost (negative = cheaper)
    
    Returns:
        Total infrastructure cost
    """
    # Base cost at level 100: $10,000
    base_cost_at_100 = 10000.0
    
    # Calculate scaling factor: (level / 100) ^ 2.5 for aggressive compound growth
    # Cap level at 100 for minimum scaling
    level = max(base_cost, 100)
    scaling_factor = (level / 100.0) ** 2.5
    
    # Calculate scaled cost
    scaled_cost = base_cost_at_100 * scaling_factor * city_count
    
    # Apply bonuses
    return scaled_cost * (1.0 + infrastructure_cost_bonus)


def calculate_land_cost(
    base_cost: float,
    city_count: int,
    land_cost_bonus: float = 0.0
) -> float:
    """
    Calculate land cost with aggressive scaling compound formula.
    
    Formula:
    - Base cost: $10,000 at level 100
    - Scaling: Compounds exponentially after level 100 with exponent 2.5
    - Cost = Base Cost × (Level / 100) ^ 2.5 × City Count × (1 + Bonus)
    
    Examples:
    - Level 100: $10,000 × 1.0 × city_count = $10,000 per city
    - Level 200: $10,000 × 2.0 ^ 2.5 × city_count = $56,569 per city
    - Level 500: $10,000 × 5.0 ^ 2.5 × city_count = $559,017 per city
    - Level 1000: $10,000 × 10.0 ^ 2.5 × city_count = $3,162,278 per city
    - Level 2500: $10,000 × 25.0 ^ 2.5 × city_count = $31,250,000 per city
    - Level 5000: $10,000 × 50.0 ^ 2.5 × city_count = $176,776,695 per city
    
    Args:
        base_cost: Current land level
        city_count: Number of cities
        land_cost_bonus: Percentage bonus to land cost (negative = cheaper)
    
    Returns:
        Total land cost
    """
    # Base cost at level 100: $10,000
    base_cost_at_100 = 10000.0
    
    # Calculate scaling factor: (level / 100) ^ 2.5 for aggressive compound growth
    # Cap level at 100 for minimum scaling
    level = max(base_cost, 100)
    scaling_factor = (level / 100.0) ** 2.5
    
    # Calculate scaled cost
    scaled_cost = base_cost_at_100 * scaling_factor * city_count
    
    # Apply bonuses
    return scaled_cost * (1.0 + land_cost_bonus)


def calculate_city_cost(
    current_city_count: int,
    new_city_cost_bonus: float = 0.0
) -> float:
    """
    Calculate city creation cost with tiered scaling compound formula.
    
    Formula:
    - City 1: Free (created with nation)
    - City 2: Base cost $250,000
    - Scaling: Compounds exponentially with tiered scaling every 10 cities
    - Cost = Base Cost × (City Count - 1) ^ Scaling Exponent × (1 + Bonus)
    - Scaling Exponent increases by 0.1 every 10 cities after city 10
    
    Scaling Exponents:
    - Cities 2-10: Exponent 1.0 (linear growth)
    - Cities 11-20: Exponent 1.1 (slight compounding)
    - Cities 21-30: Exponent 1.2 (moderate compounding)
    - Cities 31-40: Exponent 1.3 (increased compounding)
    - Cities 41-50: Exponent 1.4 (heavy compounding)
    - Cities 51+: Exponent 1.5 (maximum compounding)
    
    Examples:
    - City 2: $250,000 × 1.0 ^ 1.0 = $250,000
    - City 3: $250,000 × 2.0 ^ 1.0 = $500,000
    - City 10: $250,000 × 9.0 ^ 1.0 = $2,250,000
    - City 11: $250,000 × 10.0 ^ 1.1 = $3,162,278
    - City 20: $250,000 × 19.0 ^ 1.1 = $6,674,208
    - City 21: $250,000 × 20.0 ^ 1.2 = $10,721,770
    - City 30: $250,000 × 29.0 ^ 1.2 = $21,029,384
    - City 31: $250,000 × 30.0 ^ 1.3 = $38,742,044
    - City 40: $250,000 × 39.0 ^ 1.3 = $73,680,651
    - City 41: $250,000 × 40.0 ^ 1.4 = $139,468,544
    - City 50: $250,000 × 49.0 ^ 1.4 = $279,536,921
    - City 51: $250,000 × 50.0 ^ 1.5 = $559,017,000
    - City 100: $250,000 × 99.0 ^ 1.5 = $2,467,475,000
    
    Args:
        current_city_count: Current number of cities (cost is for next city)
        new_city_cost_bonus: Percentage bonus to new city cost (negative = cheaper)
    
    Returns:
        Total city creation cost
    """
    # City 1 is free (created with nation)
    if current_city_count < 1:
        return 0.0
    
    # Calculate which city number this would be
    next_city_number = current_city_count + 1
    
    # Base cost for city 2: $250,000
    base_cost = 250000.0
    
    # Calculate scaling exponent based on city number
    # Cities 2-10: exponent 1.0 (linear)
    # Cities 11-20: exponent 1.1
    # Cities 21-30: exponent 1.2
    # Cities 31-40: exponent 1.3
    # Cities 41-50: exponent 1.4
    # Cities 51+: exponent 1.5
    if next_city_number <= 10:
        scaling_exponent = 1.0
    elif next_city_number <= 20:
        scaling_exponent = 1.1
    elif next_city_number <= 30:
        scaling_exponent = 1.2
    elif next_city_number <= 40:
        scaling_exponent = 1.3
    elif next_city_number <= 50:
        scaling_exponent = 1.4
    else:
        scaling_exponent = 1.5
    
    # Calculate scaling factor: (city_count - 1) ^ scaling_exponent
    scaling_factor = (next_city_number - 1) ** scaling_exponent
    
    # Calculate scaled cost
    scaled_cost = base_cost * scaling_factor
    
    # Apply bonuses
    return scaled_cost * (1.0 + new_city_cost_bonus)


def calculate_infrastructure_upkeep(
    total_infrastructure: int,
    city_count: int,
    infrastructure_upkeep_bonus: float = 0.0
) -> float:
    """
    Calculate infrastructure upkeep with scaling based on infrastructure level and city count.
    
    Formula:
    - Base: $250 per 100 infrastructure per tick per city
    - Scaling: Linear with infrastructure level and city count
    - Cost = (Infrastructure / 100) × Base Upkeep × City Count × (1 + Bonus)
    
    Examples:
    - 100 infra, 1 city: $250/tick
    - 500 infra, 1 city: $1,250/tick
    - 1000 infra, 1 city: $2,500/tick
    - 1000 infra, 5 cities: $12,500/tick
    - 2500 infra, 10 cities: $62,500/tick
    - 5000 infra, 20 cities: $250,000/tick
    
    Args:
        total_infrastructure: Total infrastructure across all cities
        city_count: Number of cities
        infrastructure_upkeep_bonus: Percentage bonus to infrastructure upkeep (negative = cheaper)
    
    Returns:
        Total infrastructure upkeep per tick
    """
    # Base upkeep: $250 per 100 infrastructure per tick
    base_upkeep_per_100_infra = 250.0
    
    # Calculate scaled upkeep based on infrastructure level
    scaled_upkeep = (total_infrastructure / 100.0) * base_upkeep_per_100_infra
    
    # Apply city count scaling
    scaled_upkeep *= city_count
    
    # Apply bonuses (from resources like Coal, improvements, projects, wonders)
    return scaled_upkeep * (1.0 + infrastructure_upkeep_bonus)


def calculate_improvement_upkeep(
    base_upkeep: float,
    city_count: int,
    improvement_upkeep_bonus: float = 0.0
) -> float:
    """
    Calculate improvement upkeep.
    
    Args:
        base_upkeep: Base upkeep per tick
        city_count: Number of cities
        improvement_upkeep_bonus: Percentage bonus to improvement upkeep (negative = cheaper)
    
    Returns:
        Total improvement upkeep per tick
    """
    scaled_upkeep = base_upkeep * city_count
    return scaled_upkeep * (1.0 + improvement_upkeep_bonus)


def calculate_soldier_upkeep(
    soldier_count: int,
    base_upkeep_per_soldier: float,
    soldier_upkeep_bonus: float = 0.0
) -> float:
    """
    Calculate soldier upkeep.
    
    Args:
        soldier_count: Number of soldiers
        base_upkeep_per_soldier: Base upkeep per soldier per tick
        soldier_upkeep_bonus: Percentage bonus to soldier upkeep (negative = cheaper)
    
    Returns:
        Total soldier upkeep per tick
    """
    base_cost = soldier_count * base_upkeep_per_soldier
    return base_cost * (1.0 + soldier_upkeep_bonus)


# ==================== TECHNOLOGY FORMULAS ====================

def calculate_technology_cost(
    target_tech: int,
    technology_cost_bonus: float = 0.0
) -> float:
    """
    Calculate technology cost with scaling compound formula.
    
    Formula:
    - Base cost: $15,000 for tech level 1
    - Scaling: Compounds exponentially with exponent 1.4
    - Cost = Base Cost × (Target Tech Level) ^ 1.4 × (1 + Bonus)
    
    Examples:
    - Tech 1: $15,000 × 1 ^ 1.4 = $15,000
    - Tech 2: $15,000 × 2 ^ 1.4 = $35,377
    - Tech 5: $15,000 × 5 ^ 1.4 = $124,227
    - Tech 10: $15,000 × 10 ^ 1.4 = $378,000
    - Tech 50: $15,000 × 50 ^ 1.4 = $2,680,000
    - Tech 100: $15,000 × 100 ^ 1.4 = $9,518,000
    - Tech 200: $15,000 × 200 ^ 1.4 = $26,800,000
    - Tech 500: $15,000 × 500 ^ 1.4 = $84,500,000
    - Tech 1000: $15,000 × 1000 ^ 1.4 = $239,000,000
    
    Args:
        target_tech: Target technology level being purchased
        technology_cost_bonus: Percentage bonus to technology cost (negative = cheaper)
    
    Returns:
        Technology cost
    """
    # Base cost: $15,000 for tech level 1
    base_cost = 15000.0
    
    # Calculate scaling factor: target_tech ^ 1.4 for compound growth
    # Ensure minimum tech level of 1
    tech_level = max(target_tech, 1)
    scaling_factor = tech_level ** 1.4
    
    # Calculate scaled cost
    scaled_cost = base_cost * scaling_factor
    
    # Apply bonuses
    return scaled_cost * (1.0 + technology_cost_bonus)


def calculate_project_cost(
    base_cost: float,
    project_cost_bonus: float = 0.0
) -> float:
    """
    Calculate project cost.
    
    Args:
        base_cost: Base project cost
        project_cost_bonus: Percentage bonus to project cost (negative = cheaper)
    
    Returns:
        Project cost
    """
    return base_cost * (1.0 + project_cost_bonus)


def calculate_wonder_cost(
    base_cost: float,
    wonder_cost_bonus: float = 0.0,
    city_count: int = 1
) -> float:
    """
    Calculate wonder cost.
    
    Args:
        base_cost: Base wonder cost
        wonder_cost_bonus: Percentage bonus to wonder cost (negative = cheaper)
        city_count: Number of cities (wonders scale with city count)
    
    Returns:
        Wonder cost
    """
    scaled_cost = base_cost * city_count
    return scaled_cost * (1.0 + wonder_cost_bonus)


# ==================== WAR ELIGIBILITY FORMULAS ====================

def can_declare_war(
    attacker_ns: float,
    defender_ns: float,
    current_offensive_wars: int,
    current_defensive_wars: int,
    war_cooldown_remaining: int = 0,
    max_offensive_wars: int = 3,
    max_defensive_wars: int = 3,
    war_cooldown_ticks: int = 24
) -> bool:
    """
    Check if war can be declared.
    
    Rules:
    - Can declare war on any nation within 2× your NS or 0.5× your NS
    - Maximum 3 offensive wars and 3 defensive wars simultaneously
    - War declaration cooldown: 24 ticks between declarations
    
    Args:
        attacker_ns: Attacker's military score
        defender_ns: Defender's military score
        current_offensive_wars: Current offensive war count
        current_defensive_wars: Current defensive war count
        war_cooldown_remaining: Ticks remaining in cooldown
        max_offensive_wars: Maximum offensive wars (default 3)
        max_defensive_wars: Maximum defensive wars (default 3)
        war_cooldown_ticks: Cooldown duration in ticks (default 24)
    
    Returns:
        True if war can be declared
    """
    # Check NS range
    if defender_ns > attacker_ns * 2.0 or defender_ns < attacker_ns * 0.5:
        return False
    
    # Check war limits
    if current_offensive_wars >= max_offensive_wars:
        return False
    if current_defensive_wars >= max_defensive_wars:
        return False
    
    # Check cooldown
    if war_cooldown_remaining > 0:
        return False
    
    return True


def check_beige_eligibility(
    war_duration_ticks: int,
    max_war_duration: int = 336
) -> bool:
    """
    Check if nation goes to beige (peaceful status).
    
    Wars last 336 ticks (14 days) maximum. If no winner by then, both nations go to Beige.
    
    Args:
        war_duration_ticks: Duration of war in ticks
        max_war_duration: Maximum war duration in ticks (default 336)
    
    Returns:
        True if nation goes to beige
    """
    return war_duration_ticks >= max_war_duration


# ==================== ALLIANCE FORMULAS ====================

def calculate_alliance_score(
    member_ns_scores: list[float]
) -> float:
    """
    Calculate alliance score.
    
    Formula: Sum of all member NS scores
    
    Args:
        member_ns_scores: List of member military scores
    
    Returns:
        Alliance score
    """
    return sum(member_ns_scores)


def calculate_color_bloc_bonus(
    citizens: float,
    nations_on_color: int,
    bonus_per_citizen_per_nation: float = 0.10
) -> float:
    """
    Calculate color trade bloc bonus.
    
    Bonus = +$X per citizen based on how many nations are on that color
    
    Args:
        citizens: Total citizens
        nations_on_color: Number of nations on the color
        bonus_per_citizen_per_nation: Bonus per citizen per nation (default $0.10)
    
    Returns:
        Color bloc bonus in dollars
    """
    return citizens * (nations_on_color * bonus_per_citizen_per_nation)


# ==================== UTILITY FUNCTIONS ====================

def apply_percentage_bonus(
    base_value: float,
    bonus: float
) -> float:
    """
    Apply a percentage bonus to a base value.
    
    Args:
        base_value: Base value
        bonus: Percentage bonus (0.1 = 10%, -0.1 = -10%)
    
    Returns:
        Value with bonus applied
    """
    return base_value * (1.0 + bonus)


def clamp_value(
    value: float,
    min_value: float,
    max_value: float
) -> float:
    """
    Clamp a value between minimum and maximum.
    
    Args:
        value: Value to clamp
        min_value: Minimum value
        max_value: Maximum value
    
    Returns:
        Clamped value
    """
    return max(min_value, min(value, max_value))


def calculate_percentage_difference(
    value1: float,
    value2: float
) -> float:
    """
    Calculate percentage difference between two values.
    
    Args:
        value1: First value
        value2: Second value
    
    Returns:
        Percentage difference (value1 - value2) / value2
    """
    if value2 == 0:
        return 0.0
    return (value1 - value2) / value2


def calculate_unit_repair_cost(technology: int, unit_type: str) -> float:
    """
    Calculate the cost to repair a damaged unit.
    
    Repair cost scales with technology level (higher tech = more expensive to repair).
    Base costs vary by unit type.
    
    Formula: base_cost * (1 + tech/10000)
    
    Args:
        technology: Technology level
        unit_type: Type of unit ("soldiers", "tanks", "aircraft", "ships")
    
    Returns:
        Repair cost per unit in cash
    """
    # Base repair costs by unit type (percentage of unit cost)
    base_repair_costs = {
        "soldiers": 50.0,  # $50 to repair a soldier
        "tanks": 2000.0,  # $2,000 to repair a tank
        "aircraft": 1500.0,  # $1,500 to repair an aircraft
        "ships": 10000.0,  # $10,000 to repair a ship
        "destroyer": 10000.0,
        "cruiser": 20000.0,
        "battleship": 40000.0,
        "carrier": 80000.0,
        "submarine": 30000.0
    }
    
    base_cost = base_repair_costs.get(unit_type, 1000.0)
    
    # Tech scaling: higher tech = more expensive to repair
    # Cost increases by 1% per 1000 tech (max 50% at 5000 tech)
    tech_modifier = 1.0 + min(technology / 10000.0, 0.5)
    
    return base_cost * tech_modifier
