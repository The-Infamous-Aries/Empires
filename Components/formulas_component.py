"""
Formulas Component for Empires Game System

Provides game formulas for costs, war mechanics, population calculations, resource production, and more.
"""

from typing import Optional, Dict, Any
from .base_component import BaseComponent
from ..Logic.formulas import (
    VictoryLevel,
    ResourceProductionResult,
    PopulationResult,
    CombatResult,
    # Income Formulas
    calculate_citizen_income,
    calculate_tax_income,
    calculate_commerce_income,
    calculate_trade_income,
    calculate_tech_income,
    calculate_total_income,
    # Resource Production Formulas
    calculate_resource_production,
    # Population Formulas
    calculate_city_population,
    # Crime/Disease/Environment Formulas
    calculate_city_crime,
    calculate_city_disease,
    calculate_city_environment,
    # Power Cost Formulas
    calculate_power_cost,
    # Military Cap Formulas
    calculate_tech_efficiency_multiplier,
    calculate_damage_vs_repair_chance,
    calculate_unit_losses_with_damage,
    calculate_repair_cost,
    calculate_supply_line_penalty,
    calculate_unit_efficiency_with_tech,
    calculate_max_soldiers,
    calculate_max_tanks,
    calculate_max_aircraft,
    calculate_max_ships,
    calculate_max_missiles,
    calculate_max_nukes,
    # Defense & Strength Formulas
    calculate_defense_strength,
    calculate_military_score,
    calculate_defense_happiness_effect,
    # Combat Formulas
    calculate_ground_attack_strength,
    calculate_ground_defense_strength,
    calculate_naval_strength,
    calculate_combat_result,
    calculate_airstrike_damage,
    calculate_naval_damage,
    calculate_missile_damage,
    calculate_nuclear_damage,
    # War Score Formulas
    calculate_war_score_change,
    calculate_resistance_recovery,
    # Cost Calculation Formulas
    calculate_infrastructure_cost,
    calculate_land_cost,
    calculate_city_cost,
    calculate_infrastructure_upkeep,
    calculate_improvement_upkeep,
    calculate_soldier_upkeep,
    # Technology Formulas
    calculate_technology_cost,
    calculate_project_cost,
    calculate_wonder_cost,
    # War Eligibility Formulas
    can_declare_war,
    check_beige_eligibility,
    # Alliance Formulas
    calculate_alliance_score,
    calculate_color_bloc_bonus,
    # Utility Functions
    apply_percentage_bonus,
    clamp_value,
    calculate_percentage_difference,
    calculate_unit_repair_cost
)


class FormulasComponent(BaseComponent):
    """Component for all game formulas and calculations."""

    def __init__(self, name: str = "formulas", gpp_manager=None):
        """Initialize the formulas component."""
        super().__init__(name, gpp_manager)
        self._data = {}

    async def _initialize(self) -> None:
        """Initialize the formulas component."""
        pass

    async def get_all(self) -> list:
        """Get all formulas (not applicable for this component)."""
        return []

    async def get_by_name(self, name: str) -> Optional[Any]:
        """Get a formula by name (not applicable for this component)."""
        return None

    async def get_names(self) -> list:
        """Get all formula names (not applicable for this component)."""
        return []
    
    # ==================== INCOME FORMULAS ====================
    
    def calculate_citizen_income(
        self,
        base_income: float = 5.0,
        literacy_rate: float = 1.0,
        happiness: int = 10,
        environment: float = 90.0,
        crime: float = 20.0,
        disease: float = 15.0,
        citizen_income_bonuses: float = 0.0
    ) -> float:
        """Calculate citizen income based on multiple factors."""
        return calculate_citizen_income(
            base_income=base_income,
            literacy_rate=literacy_rate,
            happiness=happiness,
            environment=environment,
            crime=crime,
            disease=disease,
            citizen_income_bonuses=citizen_income_bonuses
        )
    
    def calculate_tax_income(
        self,
        citizens: float,
        citizen_income: float,
        happiness: int,
        tax_rate: float,
        literacy_rate: float = 0.0
    ) -> float:
        """Calculate tax income from citizens."""
        return calculate_tax_income(
            citizens=citizens,
            citizen_income=citizen_income,
            happiness=happiness,
            tax_rate=tax_rate,
            literacy_rate=literacy_rate
        )
    
    def calculate_commerce_income(
        self,
        citizens: float,
        commerce_income_per_citizen: float,
        commerce_bonus: float = 0.0
    ) -> float:
        """Calculate commerce income."""
        return calculate_commerce_income(
            citizens=citizens,
            commerce_income_per_citizen=commerce_income_per_citizen,
            commerce_bonus=commerce_bonus
        )
    
    def calculate_trade_income(
        self,
        base_trade_income: float,
        trade_bonus: float = 0.0,
        blockade_penalty: float = 0.0
    ) -> float:
        """Calculate trade income."""
        return calculate_trade_income(
            base_trade_income=base_trade_income,
            trade_bonus=trade_bonus,
            blockade_penalty=blockade_penalty
        )
    
    def calculate_tech_income(
        self,
        base_tech_income: float,
        tech_bonus: float = 0.0
    ) -> float:
        """Calculate technology income."""
        return calculate_tech_income(
            base_tech_income=base_tech_income,
            tech_bonus=tech_bonus
        )
    
    def calculate_total_income(
        self,
        tax_income: float,
        commerce_income: float,
        trade_income: float,
        tech_income: float
    ) -> float:
        """Calculate total nation income."""
        return calculate_total_income(
            tax_income=tax_income,
            commerce_income=commerce_income,
            trade_income=trade_income,
            tech_income=tech_income
        )
    
    # ==================== RESOURCE PRODUCTION FORMULAS ====================
    
    def calculate_resource_production(
        self,
        base_production: float,
        city_land: float,
        extractor_count: int,
        policy_modifier: float = 1.0,
        land_per_city_cap: float = 5000.0,
        land_bonus_cap: float = 2.0,
        extractor_bonus_per_count: float = 0.12
    ) -> ResourceProductionResult:
        """Calculate resource production per tick."""
        return calculate_resource_production(
            base_production=base_production,
            city_land=city_land,
            extractor_count=extractor_count,
            policy_modifier=policy_modifier,
            land_per_city_cap=land_per_city_cap,
            land_bonus_cap=land_bonus_cap,
            extractor_bonus_per_count=extractor_bonus_per_count
        )
    
    # ==================== POPULATION FORMULAS ====================
    
    def calculate_city_population(
        self,
        city_infrastructure: int,
        city_land: float,
        city_age_days: int,
        crime: float,
        disease: float,
        happiness: int
    ) -> PopulationResult:
        """Calculate city population."""
        return calculate_city_population(
            city_infrastructure=city_infrastructure,
            city_land=city_land,
            city_age_days=city_age_days,
            crime=crime,
            disease=disease,
            happiness=happiness
        )
    
    # ==================== CRIME/DISEASE/ENVIRONMENT FORMULAS ====================
    
    def calculate_city_crime(
        self,
        city_infrastructure: int,
        city_land: float,
        city_population: int,
        city_environment: float,
        crime_bonus_sum: float,
        happiness_bonus_sum: int
    ) -> float:
        """Calculate city crime level (0-100 scale)."""
        return calculate_city_crime(
            city_infrastructure=city_infrastructure,
            city_land=city_land,
            city_population=city_population,
            city_environment=city_environment,
            crime_bonus_sum=crime_bonus_sum,
            happiness_bonus_sum=happiness_bonus_sum
        )
    
    def calculate_city_disease(
        self,
        city_infrastructure: int,
        city_land: float,
        city_population: int,
        city_environment: float,
        disease_bonus_sum: float
    ) -> float:
        """Calculate city disease level (0-100 scale)."""
        return calculate_city_disease(
            city_infrastructure=city_infrastructure,
            city_land=city_land,
            city_population=city_population,
            city_environment=city_environment,
            disease_bonus_sum=disease_bonus_sum
        )
    
    def calculate_city_environment(
        self,
        city_infrastructure: int,
        city_land: float,
        city_population: int,
        environment_bonus_sum: float
    ) -> float:
        """Calculate city environment level (0-100 scale)."""
        return calculate_city_environment(
            city_infrastructure=city_infrastructure,
            city_land=city_land,
            city_population=city_population,
            environment_bonus_sum=environment_bonus_sum
        )
    
    # ==================== POWER COST FORMULAS ====================
    
    def calculate_power_cost(
        self,
        base_cost_per_city: float,
        city_count: int,
        power_plant_count: int
    ) -> float:
        """Calculate power cost per tick."""
        return calculate_power_cost(
            base_cost_per_city=base_cost_per_city,
            city_count=city_count,
            power_plant_count=power_plant_count
        )
    
    # ==================== MILITARY CAP FORMULAS ====================
    
    def calculate_tech_efficiency_multiplier(self, technology: int) -> float:
        """Calculate tech-based efficiency multiplier for military units."""
        return calculate_tech_efficiency_multiplier(technology=technology)
    
    def calculate_damage_vs_repair_chance(self, technology: int) -> float:
        """Calculate the percentage of unit losses that become damaged based on tech level."""
        return calculate_damage_vs_repair_chance(technology=technology)
    
    def calculate_unit_losses_with_damage(
        self,
        total_losses: int,
        technology: int
    ) -> Dict[str, int]:
        """Calculate how many units are destroyed vs damaged based on tech level."""
        return calculate_unit_losses_with_damage(
            total_losses=total_losses,
            technology=technology
        )
    
    def calculate_repair_cost(
        self,
        damaged_units: int,
        unit_type: str,
        technology: int = 0
    ) -> float:
        """Calculate the cost to repair damaged units."""
        return calculate_repair_cost(
            damaged_units=damaged_units,
            unit_type=unit_type,
            technology=technology
        )
    
    def calculate_supply_line_penalty(self, supply_lines_intact: bool, technology: int = 0) -> float:
        """Calculate the efficiency penalty when supply lines are cut."""
        return calculate_supply_line_penalty(
            supply_lines_intact=supply_lines_intact,
            technology=technology
        )
    
    def calculate_unit_efficiency_with_tech(
        self,
        base_efficiency: float = 1.0,
        technology: int = 0,
        unit_type: str = "soldier"
    ) -> float:
        """Calculate unit efficiency with tech-based scaling."""
        return calculate_unit_efficiency_with_tech(
            base_efficiency=base_efficiency,
            technology=technology,
            unit_type=unit_type
        )
    
    def calculate_max_soldiers(
        self,
        total_population: float,
        soldier_efficiency_bonus: float = 0.0,
        technology: int = 0
    ) -> int:
        """Calculate maximum soldier capacity."""
        return calculate_max_soldiers(
            total_population=total_population,
            soldier_efficiency_bonus=soldier_efficiency_bonus,
            technology=technology
        )
    
    def calculate_max_tanks(
        self,
        total_population: float,
        tank_efficiency_bonus: float = 0.0,
        technology: int = 0
    ) -> int:
        """Calculate maximum tank capacity."""
        return calculate_max_tanks(
            total_population=total_population,
            tank_efficiency_bonus=tank_efficiency_bonus,
            technology=technology
        )
    
    def calculate_max_aircraft(
        self,
        total_population: float,
        aircraft_efficiency_bonus: float = 0.0,
        technology: int = 0
    ) -> int:
        """Calculate maximum aircraft capacity."""
        return calculate_max_aircraft(
            total_population=total_population,
            aircraft_efficiency_bonus=aircraft_efficiency_bonus,
            technology=technology
        )
    
    def calculate_max_ships(
        self,
        total_population: float,
        ship_efficiency_bonus: float = 0.0,
        technology: int = 0
    ) -> int:
        """Calculate maximum ship capacity."""
        return calculate_max_ships(
            total_population=total_population,
            ship_efficiency_bonus=ship_efficiency_bonus,
            technology=technology
        )
    
    def calculate_max_missiles(
        self,
        missile_battery_count: int,
        missile_cap_per_battery: int = 1
    ) -> int:
        """Calculate maximum missile capacity."""
        return calculate_max_missiles(
            missile_battery_count=missile_battery_count,
            missile_cap_per_battery=missile_cap_per_battery
        )
    
    def calculate_max_nukes(
        self,
        nuclear_silo_count: int,
        nuke_cap_per_silo: int = 1
    ) -> int:
        """Calculate maximum nuclear weapon capacity."""
        return calculate_max_nukes(
            nuclear_silo_count=nuclear_silo_count,
            nuke_cap_per_silo=nuke_cap_per_silo
        )
    
    # ==================== DEFENSE & STRENGTH FORMULAS ====================
    
    def calculate_defense_strength(
        self,
        soldiers: int,
        tanks: int,
        aircraft: int,
        ships: int
    ) -> float:
        """Calculate defense strength."""
        return calculate_defense_strength(
            soldiers=soldiers,
            tanks=tanks,
            aircraft=aircraft,
            ships=ships
        )
    
    def calculate_military_score(
        self,
        soldiers: int,
        tanks: int,
        aircraft: int,
        ships: int,
        nukes: int,
        infrastructure: int,
        technology: int,
        city_count: int
    ) -> float:
        """Calculate military score (NS - Nation Strength)."""
        return calculate_military_score(
            soldiers=soldiers,
            tanks=tanks,
            aircraft=aircraft,
            ships=ships,
            nukes=nukes,
            infrastructure=infrastructure,
            technology=technology,
            city_count=city_count
        )
    
    def calculate_defense_happiness_effect(
        self,
        defense_strength: float,
        population: float
    ) -> int:
        """Calculate happiness effect from defense strength."""
        return calculate_defense_happiness_effect(
            defense_strength=defense_strength,
            population=population
        )
    
    # ==================== COMBAT FORMULAS ====================
    
    def calculate_ground_attack_strength(
        self,
        soldiers: int,
        tanks: int,
        soldier_efficiency: float = 1.0,
        tank_efficiency: float = 1.0,
        technology: int = 0,
        supply_lines_intact: bool = True,
        first_strike_bonus: float = 0.0,
        commander_efficiency_bonus: float = 0.0
    ) -> float:
        """Calculate ground attack strength."""
        return calculate_ground_attack_strength(
            soldiers=soldiers,
            tanks=tanks,
            soldier_efficiency=soldier_efficiency,
            tank_efficiency=tank_efficiency,
            technology=technology,
            supply_lines_intact=supply_lines_intact,
            first_strike_bonus=first_strike_bonus,
            commander_efficiency_bonus=commander_efficiency_bonus
        )
    
    def calculate_ground_defense_strength(
        self,
        enemy_soldiers: int,
        enemy_tanks: int,
        soldier_efficiency: float = 1.0,
        tank_efficiency: float = 1.0,
        technology: int = 0,
        city_resistance: float = 1.0,
        supply_lines_intact: bool = True,
        commander_efficiency_bonus: float = 0.0
    ) -> float:
        """Calculate ground defense strength."""
        return calculate_ground_defense_strength(
            enemy_soldiers=enemy_soldiers,
            enemy_tanks=enemy_tanks,
            soldier_efficiency=soldier_efficiency,
            tank_efficiency=tank_efficiency,
            technology=technology,
            city_resistance=city_resistance,
            supply_lines_intact=supply_lines_intact,
            commander_efficiency_bonus=commander_efficiency_bonus
        )
    
    def calculate_naval_strength(
        self,
        destroyers: int,
        cruisers: int,
        battleships: int,
        carriers: int,
        ship_efficiency: float = 1.0,
        technology: int = 0
    ) -> float:
        """Calculate naval strength."""
        return calculate_naval_strength(
            destroyers=destroyers,
            cruisers=cruisers,
            battleships=battleships,
            carriers=carriers,
            ship_efficiency=ship_efficiency,
            technology=technology
        )
    
    def calculate_combat_result(
        self,
        attack_strength: float,
        defense_strength: float,
        is_ground_combat: bool = True
    ) -> CombatResult:
        """Calculate combat result."""
        return calculate_combat_result(
            attack_strength=attack_strength,
            defense_strength=defense_strength,
            is_ground_combat=is_ground_combat
        )
    
    def calculate_airstrike_damage(
        self,
        aircraft_count: int,
        aircraft_type: str = "fighter",
        aircraft_efficiency: float = 1.0,
        air_superiority_bonus: float = 0.0,
        air_defense_bonus: float = 0.0,
        technology: int = 0,
        commander_efficiency_bonus: float = 0.0
    ) -> Dict[str, float]:
        """Calculate airstrike damage based on aircraft type."""
        return calculate_airstrike_damage(
            aircraft_count=aircraft_count,
            aircraft_type=aircraft_type,
            aircraft_efficiency=aircraft_efficiency,
            air_superiority_bonus=air_superiority_bonus,
            air_defense_bonus=air_defense_bonus,
            technology=technology,
            commander_efficiency_bonus=commander_efficiency_bonus
        )
    
    def calculate_naval_damage(
        self,
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
        """Calculate naval battle damage with ship-specific roles."""
        return calculate_naval_damage(
            destroyers=destroyers,
            cruisers=cruisers,
            battleships=battleships,
            carriers=carriers,
            submarines=submarines,
            enemy_destroyers=enemy_destroyers,
            enemy_cruisers=enemy_cruisers,
            enemy_battleships=enemy_battleships,
            enemy_carriers=enemy_carriers,
            ship_efficiency=ship_efficiency,
            technology=technology,
            commander_efficiency_bonus=commander_efficiency_bonus
        )
    
    def calculate_missile_damage(
        self,
        missile_count: int,
        intercept_chance: float = 0.75,
        iron_dome_bonus: float = 0.0,
        technology: int = 0
    ) -> Dict[str, float]:
        """Calculate missile strike damage with tech-based scaling."""
        return calculate_missile_damage(
            missile_count=missile_count,
            intercept_chance=intercept_chance,
            iron_dome_bonus=iron_dome_bonus,
            technology=technology
        )
    
    def calculate_nuclear_damage(
        self,
        nuke_count: int,
        city_infrastructure: int,
        city_population: float,
        city_military_units: int,
        technology: int = 0
    ) -> Dict[str, float]:
        """Calculate nuclear strike damage with tech-based scaling."""
        return calculate_nuclear_damage(
            nuke_count=nuke_count,
            city_infrastructure=city_infrastructure,
            city_population=city_population,
            city_military_units=city_military_units,
            technology=technology
        )
    
    # ==================== WAR SCORE FORMULAS ====================
    
    def calculate_war_score_change(
        self,
        attack_type: str,
        victory_level: VictoryLevel,
        war_score_gain_bonus: float = 0.0
    ) -> float:
        """Calculate war score change for an attack."""
        return calculate_war_score_change(
            attack_type=attack_type,
            victory_level=victory_level,
            war_score_gain_bonus=war_score_gain_bonus
        )
    
    def calculate_resistance_recovery(
        self,
        current_resistance: float,
        is_under_attack: bool,
        recovery_rate: float = 5.0
    ) -> float:
        """Calculate resistance recovery."""
        return calculate_resistance_recovery(
            current_resistance=current_resistance,
            is_under_attack=is_under_attack,
            recovery_rate=recovery_rate
        )
    
    # ==================== COST CALCULATION FORMULAS ====================
    
    def calculate_infrastructure_cost(
        self,
        base_cost: float,
        city_count: int,
        infrastructure_cost_bonus: float = 0.0
    ) -> float:
        """Calculate infrastructure cost with aggressive scaling compound formula."""
        return calculate_infrastructure_cost(
            base_cost=base_cost,
            city_count=city_count,
            infrastructure_cost_bonus=infrastructure_cost_bonus
        )
    
    def calculate_land_cost(
        self,
        base_cost: float,
        city_count: int,
        land_cost_bonus: float = 0.0
    ) -> float:
        """Calculate land cost with aggressive scaling compound formula."""
        return calculate_land_cost(
            base_cost=base_cost,
            city_count=city_count,
            land_cost_bonus=land_cost_bonus
        )
    
    def calculate_city_cost(
        self,
        current_city_count: int,
        new_city_cost_bonus: float = 0.0
    ) -> float:
        """Calculate city creation cost with tiered scaling compound formula."""
        return calculate_city_cost(
            current_city_count=current_city_count,
            new_city_cost_bonus=new_city_cost_bonus
        )
    
    def calculate_infrastructure_upkeep(
        self,
        total_infrastructure: int,
        city_count: int,
        infrastructure_upkeep_bonus: float = 0.0
    ) -> float:
        """Calculate infrastructure upkeep with scaling based on infrastructure level and city count."""
        return calculate_infrastructure_upkeep(
            total_infrastructure=total_infrastructure,
            city_count=city_count,
            infrastructure_upkeep_bonus=infrastructure_upkeep_bonus
        )
    
    def calculate_improvement_upkeep(
        self,
        base_upkeep: float,
        city_count: int,
        improvement_upkeep_bonus: float = 0.0
    ) -> float:
        """Calculate improvement upkeep."""
        return calculate_improvement_upkeep(
            base_upkeep=base_upkeep,
            city_count=city_count,
            improvement_upkeep_bonus=improvement_upkeep_bonus
        )
    
    def calculate_soldier_upkeep(
        self,
        soldier_count: int,
        base_upkeep_per_soldier: float,
        soldier_upkeep_bonus: float = 0.0
    ) -> float:
        """Calculate soldier upkeep."""
        return calculate_soldier_upkeep(
            soldier_count=soldier_count,
            base_upkeep_per_soldier=base_upkeep_per_soldier,
            soldier_upkeep_bonus=soldier_upkeep_bonus
        )
    
    # ==================== TECHNOLOGY FORMULAS ====================
    
    def calculate_technology_cost(
        self,
        target_tech: int,
        technology_cost_bonus: float = 0.0
    ) -> float:
        """Calculate technology cost with scaling compound formula."""
        return calculate_technology_cost(
            target_tech=target_tech,
            technology_cost_bonus=technology_cost_bonus
        )
    
    def calculate_project_cost(
        self,
        base_cost: float,
        project_cost_bonus: float = 0.0
    ) -> float:
        """Calculate project cost."""
        return calculate_project_cost(
            base_cost=base_cost,
            project_cost_bonus=project_cost_bonus
        )
    
    def calculate_wonder_cost(
        self,
        base_cost: float,
        wonder_cost_bonus: float = 0.0,
        city_count: int = 1
    ) -> float:
        """Calculate wonder cost."""
        return calculate_wonder_cost(
            base_cost=base_cost,
            wonder_cost_bonus=wonder_cost_bonus,
            city_count=city_count
        )
    
    # ==================== WAR ELIGIBILITY FORMULAS ====================
    
    def can_declare_war(
        self,
        attacker_ns: float,
        defender_ns: float,
        current_offensive_wars: int,
        current_defensive_wars: int,
        war_cooldown_remaining: int = 0,
        max_offensive_wars: int = 3,
        max_defensive_wars: int = 3,
        war_cooldown_ticks: int = 24
    ) -> bool:
        """Check if war can be declared."""
        return can_declare_war(
            attacker_ns=attacker_ns,
            defender_ns=defender_ns,
            current_offensive_wars=current_offensive_wars,
            current_defensive_wars=current_defensive_wars,
            war_cooldown_remaining=war_cooldown_remaining,
            max_offensive_wars=max_offensive_wars,
            max_defensive_wars=max_defensive_wars,
            war_cooldown_ticks=war_cooldown_ticks
        )
    
    def check_beige_eligibility(
        self,
        war_duration_ticks: int,
        max_war_duration: int = 336
    ) -> bool:
        """Check if nation goes to beige (peaceful status)."""
        return check_beige_eligibility(
            war_duration_ticks=war_duration_ticks,
            max_war_duration=max_war_duration
        )
    
    # ==================== ALLIANCE FORMULAS ====================
    
    def calculate_alliance_score(
        self,
        member_ns_scores: list[float]
    ) -> float:
        """Calculate alliance score."""
        return calculate_alliance_score(member_ns_scores=member_ns_scores)
    
    def calculate_color_bloc_bonus(
        self,
        citizens: float,
        nations_on_color: int,
        bonus_per_citizen_per_nation: float = 0.10
    ) -> float:
        """Calculate color trade bloc bonus."""
        return calculate_color_bloc_bonus(
            citizens=citizens,
            nations_on_color=nations_on_color,
            bonus_per_citizen_per_nation=bonus_per_citizen_per_nation
        )
    
    # ==================== UTILITY FUNCTIONS ====================
    
    def apply_percentage_bonus(
        self,
        base_value: float,
        bonus: float
    ) -> float:
        """Apply a percentage bonus to a base value."""
        return apply_percentage_bonus(
            base_value=base_value,
            bonus=bonus
        )
    
    def clamp_value(
        self,
        value: float,
        min_value: float,
        max_value: float
    ) -> float:
        """Clamp a value between minimum and maximum."""
        return clamp_value(
            value=value,
            min_value=min_value,
            max_value=max_value
        )
    
    def calculate_percentage_difference(
        self,
        value1: float,
        value2: float
    ) -> float:
        """Calculate percentage difference between two values."""
        return calculate_percentage_difference(
            value1=value1,
            value2=value2
        )
    
    def calculate_unit_repair_cost(self, technology: int, unit_type: str) -> float:
        """Calculate the cost to repair a damaged unit."""
        return calculate_unit_repair_cost(
            technology=technology,
            unit_type=unit_type
        )
