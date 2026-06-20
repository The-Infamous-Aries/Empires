from dataclasses import dataclass, field
from typing import Dict, List, Optional
from datetime import datetime
import uuid

from .nation import Nation
from .city import City, CitySystem
from .improvements import ImprovementType, ImprovementSystem
from .wonders import WonderType, WonderSystem
from .projects import ProjectType, ProjectSystem
from .resources import ResourceType, ResourceSystem
from . import formulas


@dataclass
class TurnResult:
    nation_id: str = ""
    tick: int = 0
    
    tax_income: float = 0.0
    commerce_income: float = 0.0
    trade_income: float = 0.0
    tech_income: float = 0.0
    tourism_income: float = 0.0
    total_income: float = 0.0
    
    infrastructure_upkeep: float = 0.0
    improvement_upkeep: float = 0.0
    wonder_upkeep: float = 0.0
    military_upkeep: float = 0.0
    total_upkeep: float = 0.0
    
    resource_production: Dict[ResourceType, float] = field(default_factory=dict)
    resource_consumption: Dict[ResourceType, float] = field(default_factory=dict)
    resource_net_change: Dict[ResourceType, float] = field(default_factory=dict)
    
    population_change: int = 0
    new_population: int = 0
    
    military_units_purchased: Dict[str, int] = field(default_factory=dict)
    
    random_event: Optional[str] = None
    random_event_effect: Dict[str, float] = field(default_factory=dict)
    
    war_score_changes: Dict[str, float] = field(default_factory=dict)
    
    government_change_cooldown: int = 0
    policy_change_cooldown: int = 0
    religion_change_cooldown: int = 0
    war_cooldown: int = 0
    cooldowns_updated: Dict[str, int] = field(default_factory=dict)
    
    processed_at: datetime = field(default_factory=datetime.now)


class TurnSystem:
    def __init__(self):
        self.current_tick: int = 0
        self.turn_results: Dict[str, TurnResult] = {}
    
    def process_nation_turn(self, nation: Nation, cities: Dict[str, City], 
                           current_tick: int) -> TurnResult:
        result = TurnResult(
            nation_id=nation.nation_id,
            tick=current_tick
        )
        
        if nation.is_in_anarchy():
            result.random_event = "Nation is in Anarchy - no income collected"
            nation.anarchy_ticks_remaining -= 1
            result.cooldowns_updated["anarchy"] = nation.anarchy_ticks_remaining
            return result
        
        result.tax_income = self._calculate_tax_income(nation, cities)
        result.commerce_income = self._calculate_commerce_income(nation, cities)
        result.trade_income = self._calculate_trade_income(nation, cities)
        result.tech_income = 0.0
        result.tourism_income = self._calculate_tourism_income(nation, cities)
        
        result.total_income = (
            result.tax_income + result.commerce_income + 
            result.trade_income + result.tech_income + result.tourism_income
        )
        
        result.infrastructure_upkeep = self._calculate_infrastructure_upkeep(nation, cities)
        result.improvement_upkeep = self._calculate_improvement_upkeep(nation)
        result.wonder_upkeep = self._calculate_wonder_upkeep(nation)
        result.military_upkeep = self._calculate_military_upkeep(nation)
        
        result.total_upkeep = (
            result.infrastructure_upkeep + result.improvement_upkeep +
            result.wonder_upkeep + result.military_upkeep
        )
        
        nation.cash += result.total_income
        nation.cash -= result.total_upkeep
        
        result.resource_production = self._calculate_resource_production(nation, cities)
        result.resource_consumption = self._calculate_resource_consumption(nation, cities)
        
        for resource, production in result.resource_production.items():
            nation.resource_stockpiles[resource] = nation.resource_stockpiles.get(resource, 0) + production
        
        for resource, consumption in result.resource_consumption.items():
            nation.resource_stockpiles[resource] = nation.resource_stockpiles.get(resource, 0) - consumption
        for resource in set(result.resource_production.keys()) | set(result.resource_consumption.keys()):
            production = result.resource_production.get(resource, 0)
            consumption = result.resource_consumption.get(resource, 0)
            result.resource_net_change[resource] = production - consumption
        
        old_population = nation.total_population
        result.new_population = self._calculate_total_population(nation, cities)
        result.population_change = result.new_population - old_population
        nation.total_population = result.new_population
        
        self._update_city_stats(nation, cities)
        
        for city in cities.values():
            city.update_age(1)
        
        if nation.war_cooldown > 0:
            nation.war_cooldown -= 1
            result.war_cooldown = nation.war_cooldown
            result.cooldowns_updated["war_cooldown"] = nation.war_cooldown
        
        if nation.government_change_cooldown > 0:
            nation.government_change_cooldown -= 1
            result.government_change_cooldown = nation.government_change_cooldown
            result.cooldowns_updated["government_change_cooldown"] = nation.government_change_cooldown
        
        if nation.policy_change_cooldown > 0:
            nation.policy_change_cooldown -= 1
            result.policy_change_cooldown = nation.policy_change_cooldown
            result.cooldowns_updated["policy_change_cooldown"] = nation.policy_change_cooldown
        
        if nation.religion_change_cooldown > 0:
            nation.religion_change_cooldown -= 1
            result.religion_change_cooldown = nation.religion_change_cooldown
            result.cooldowns_updated["religion_change_cooldown"] = nation.religion_change_cooldown
        
        for resource, cooldown in nation.resource_change_cooldown.items():
            if cooldown > 0:
                nation.resource_change_cooldown[resource] = cooldown - 1
                result.cooldowns_updated[f"resource_{resource}"] = nation.resource_change_cooldown[resource]
        
        if nation.infrastructure_disabled_ticks > 0:
            nation.infrastructure_disabled_ticks -= 1
            result.cooldowns_updated["infrastructure_disabled_ticks"] = nation.infrastructure_disabled_ticks
        
        from .diplomacy import diplomacy_system
        global_effects = diplomacy_system.get_active_effects(nation.nation_id)
        
        for effect in global_effects:
            effect_type = effect.effect_type
            effect_value = effect.effect_value
            
            if effect_type == "trade_income_boost":
                result.trade_income *= (1.0 + effect_value)
            elif effect_type == "cash_income_boost":
                result.tax_income *= (1.0 + effect_value)
            elif effect_type == "tech_cost_reduction":
                pass
            elif effect_type == "military_efficiency_boost":
                pass
            elif effect_type == "happiness_boost":
                nation.happiness += int(effect_value)
            elif effect_type == "environment_boost":
                nation.environment += int(effect_value)
        
        result.random_event = self._roll_random_event(nation)
        
        nation.project_slots_available = len(cities)
        
        population_millions = nation.total_population / 1000000
        base_wonder_slots = 1
        bonus_slots = int(population_millions / 5)
        nation.wonder_slots_available = base_wonder_slots + bonus_slots
        
        base_literacy = 1 + (nation.technology / 100)
        nation.literacy_rate = min(100, base_literacy)
        
        from .improvements import ImprovementSystem
        improvement_system = ImprovementSystem()
        for improvement_type, count in nation.owned_improvements.items():
            improvement = improvement_system.get_improvement(improvement_type)
            if improvement:
                nation.literacy_rate += improvement.literacy_bonus * count
        
        from .wonders import WonderSystem
        wonder_system = WonderSystem()
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder:
                nation.literacy_rate += wonder.literacy_bonus
        
        nation.literacy_rate = min(100, nation.literacy_rate)
        
        tax_happiness_penalty = 0
        if nation.tax_rate > 0.20:
            excess_tax = nation.tax_rate - 0.20
            tax_happiness_penalty = int(excess_tax * 10)
        
        tax_happiness_penalty_reduction = 0
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder and wonder.tax_happiness_penalty_reduction:
                tax_happiness_penalty_reduction += wonder.tax_happiness_penalty_reduction
        
        tax_happiness_penalty = max(0, tax_happiness_penalty - tax_happiness_penalty_reduction)
        
        self._update_city_stats(nation, cities)
        
        result.processed_at = datetime.now()
        return result
    
    def _calculate_tax_income(self, nation: Nation, cities: Dict[str, City]) -> float:
        avg_environment = sum(city.environment for city in cities.values()) / len(cities) if cities else 90.0
        avg_crime = sum(city.crime for city in cities.values()) / len(cities) if cities else 20.0
        avg_disease = sum(city.disease for city in cities.values()) / len(cities) if cities else 15.0
        citizen_income_bonuses = 0.0
        
        from . import resources as resource_module
        resource_system = resource_module.ResourceSystem()
        for resource in nation.resources_producing:
            resource = resource_system.get_resource(resource)
            citizen_income_bonuses += resource.citizen_income_bonus
        
        from .improvements import ImprovementSystem
        improvement_system = ImprovementSystem()
        for improvement_type, count in nation.owned_improvements.items():
            improvement = improvement_system.get_improvement(improvement_type)
            if improvement:
                citizen_income_bonuses += improvement.citizen_income_bonus * count
        
        from .wonders import WonderSystem
        wonder_system = WonderSystem()
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder:
                citizen_income_bonuses += wonder.citizen_income_bonus
        
        from .projects import ProjectSystem
        project_system = ProjectSystem()
        for project_type in nation.completed_projects:
            project = project_system.get_project(project_type)
            if project:
                citizen_income_bonuses += project.citizen_income_bonus
        
        from .policies import PolicySystem
        policy_system = PolicySystem()
        policy_bonus = 0.0
        domestic_policy = policy_system.get_domestic_policy(nation.domestic_policy_type)
        if domestic_policy:
            policy_bonus = domestic_policy.citizen_income_bonus
            citizen_income_bonuses += policy_bonus
        
        from .govrel import GovernmentSystem
        government_system = GovernmentSystem()
        government = government_system.get_government(nation.government_type)
        if government:
            citizen_income_bonuses += government.income_bonus
        
        if nation.religion:
            # Apply religion income bonus
            from .govrel import ReligionSystem
            religion_system = ReligionSystem()
            religion_income_bonus = religion_system.calculate_religion_income_bonus(nation.religion)
            citizen_income_bonuses += religion_income_bonus
        
        base_citizen_income = nation.citizen_income
        total_citizen_income = base_citizen_income + citizen_income_bonuses
        
        literacy_multiplier = (nation.literacy_rate / 100.0)
        happiness_multiplier = (nation.happiness / 10.0)
        environment_multiplier = (avg_environment / 100.0)
        crime_disease_penalty = (avg_crime / 100.0) + (avg_disease / 100.0)
        
        effective_citizen_income = total_citizen_income * literacy_multiplier * happiness_multiplier * environment_multiplier * (1.0 - crime_disease_penalty)
        
        tax_income = nation.total_population * effective_citizen_income * nation.tax_rate
        return tax_income
    
    def _calculate_commerce_income(self, nation: Nation, cities: Dict[str, City]) -> float:
        base_commerce = 0.0
        
        project_system = ProjectSystem()
        
        commerce_projects = [
            ProjectType.MARKET_LIBERALIZATION,
            ProjectType.RETAIL_SECTOR_DEVELOPMENT,
            ProjectType.BANKING_SECTOR_REFORM,
            ProjectType.URBAN_DEVELOPMENT_INITIATIVE,
            ProjectType.LUXURY_RETAIL_DEVELOPMENT,
            ProjectType.SPORTS_INFRASTRUCTURE_DEVELOPMENT,
            ProjectType.TRADE_LIBERALIZATION,
            ProjectType.FINANCIAL_MARKET_DEVELOPMENT,
            ProjectType.TOURISM_INDUSTRY_DEVELOPMENT,
            ProjectType.ENTERTAINMENT_INDUSTRY_DEVELOPMENT,
        ]
        
        for project_type in commerce_projects:
            if nation.has_project(project_type):
                project = project_system.get_project(project_type)
                base_commerce += project.commerce_income_bonus * nation.total_population
        
        government = nation.get_government()
        base_commerce *= (1.0 + government.commerce_bonus)
        
        wonder_system = WonderSystem()
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder.commerce_income_bonus != 0:
                base_commerce *= (1.0 + wonder.commerce_income_bonus)
        
        return base_commerce
    
    def _calculate_trade_income(self, nation: Nation, cities: Dict[str, City]) -> float:
        base_trade = 0.0
        
        improvement_system = ImprovementSystem()
        for improvement_type, count in nation.owned_improvements.items():
            improvement = improvement_system.get_improvement(improvement_type)
            if improvement:
                base_trade += improvement.trade_income_bonus * count
        
        trade_bonus_per_partner = 5000.0 * len(nation.trade_partners)
        base_trade += trade_bonus_per_partner

        from .govrel import GovernmentSystem
        government_system = GovernmentSystem()
        government = government_system.get_government(nation.government_type)
        
        if government:
            base_trade *= (1.0 + government.income_bonus)
        
        if nation.is_blockaded:
            base_trade *= 0.5
        
        if nation.diplomatic_penalty > 0:
            diplomatic_reduction = nation.diplomatic_penalty / 100.0
            base_trade *= (1.0 - diplomatic_reduction)
        
        return base_trade
    
    def _calculate_tech_income(self, nation: Nation, cities: Dict[str, City]) -> float:
        base_tech = 0.0
        
        project_system = ProjectSystem()
        
        tech_projects = [
            ProjectType.EDUCATION_REFORM_INITIATIVE,
            ProjectType.HIGHER_EDUCATION_INITIATIVE,
            ProjectType.NATIONAL_RESEARCH_INITIATIVE,
            ProjectType.ADVANCED_RESEARCH_INITIATIVE,
            ProjectType.DIGITAL_INFRASTRUCTURE_INITIATIVE,
            ProjectType.SPACE_PROGRAM_INITIATIVE,
        ]
        
        for project_type in tech_projects:
            if nation.has_project(project_type):
                project = project_system.get_project(project_type)
                base_tech += project.technology_cost_bonus * nation.total_population
        wonder_system = WonderSystem()
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder.tech_income_bonus != 0:
                base_tech += wonder.tech_income_bonus * nation.total_population
        
        return base_tech
    
    def _calculate_tourism_income(self, nation: Nation, cities: Dict[str, City]) -> float:
        base_tourism = 0.0
        
        wonder_system = WonderSystem()
        
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder.tourism_income_per_citizen > 0:
                base_tourism += wonder.tourism_income_per_citizen * nation.total_population
        
        return base_tourism
    
    def _calculate_infrastructure_upkeep(self, nation: Nation, cities: Dict[str, City]) -> float:
        total_infrastructure = sum(city.infrastructure for city in cities.values())
        city_count = len(cities)
        infrastructure_upkeep_bonus = 0.0
        return formulas.calculate_infrastructure_upkeep(total_infrastructure, city_count, infrastructure_upkeep_bonus)
    
    def _calculate_improvement_upkeep(self, nation: Nation) -> float:
        improvement_system = ImprovementSystem()
        total_upkeep = 0.0
        
        for improvement_type, count in nation.owned_improvements.items():
            improvement = improvement_system.get_improvement(improvement_type)
            if improvement:
                total_upkeep += improvement.upkeep_cash * count
        
        return total_upkeep
    
    def _calculate_wonder_upkeep(self, nation: Nation) -> float:
        wonder_system = WonderSystem()
        total_upkeep = 0.0
        
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            total_upkeep += wonder.upkeep_cash
        
        return total_upkeep
    
    def _calculate_military_upkeep(self, nation: Nation) -> float:
        from .military import MilitarySystem, MilitaryUnitType
        military_system = MilitarySystem()
        
        total_upkeep = 0.0
        
        if nation.soldiers > 0:
            soldier = military_system.get_unit(MilitaryUnitType.SOLDIER)
            total_upkeep += soldier.upkeep * nation.soldiers
        
        if nation.tanks > 0:
            tank = military_system.get_unit(MilitaryUnitType.TANK)
            total_upkeep += tank.upkeep * nation.tanks
        
        if nation.aircraft > 0:
            aircraft = military_system.get_unit(MilitaryUnitType.AIRCRAFT_FIGHTER)
            total_upkeep += aircraft.upkeep * nation.aircraft
        
        if nation.ships > 0:
            ship = military_system.get_unit(MilitaryUnitType.SHIP_DESTROYER)
            total_upkeep += ship.upkeep * nation.ships
        
        if nation.submarines > 0:
            submarine = military_system.get_unit(MilitaryUnitType.SHIP_SUBMARINE)
            total_upkeep += submarine.upkeep * nation.submarines
        
        government = nation.get_government()
        if government:
            total_upkeep *= (1.0 + government.military_upkeep_bonus)
        
        wonder_system = WonderSystem()
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder.military_upkeep_bonus != 0:
                total_upkeep *= (1.0 + wonder.military_upkeep_bonus)
        
        return total_upkeep
    
    def _calculate_resource_production(self, nation: Nation, cities: Dict[str, City]) -> Dict[ResourceType, float]:
        resource_system = ResourceSystem()
        production = {}
        
        for resource_type in nation.owned_resources:
            result = formulas.calculate_resource_production(
                base_production=1.0,
                city_land=nation.total_land,
                extractor_count=0,
                policy_modifier=1.0
            )
            base_production = result.tick_production
            
            improvement_system = ImprovementSystem()
            extraction_improvements = [
                ImprovementType.EXTRACTION_COMPLEX,
                ImprovementType.PROCESSING_PLANT,
                ImprovementType.INDUSTRIAL_EXTRACTOR,
                ImprovementType.ADVANCED_REFINERY,
            ]
            
            production_bonus = 0.0
            for improvement_type in extraction_improvements:
                if nation.has_improvement(improvement_type):
                    improvement = improvement_system.get_improvement(improvement_type)
                    if improvement:
                        production_bonus += improvement.resource_production_bonus * nation.owned_improvements.get(improvement_type, 0)
            
            base_production *= (1.0 + production_bonus)
            
            wonder_bonus = 0.0
            for wonder_type in nation.owned_wonders:
                wonder = wonder_system.get_wonder(wonder_type)
                if wonder and wonder.resource_production_bonus != 0:
                    wonder_bonus += wonder.resource_production_bonus
            
            base_production *= (1.0 + wonder_bonus)
            
            production[resource_type] = base_production
        
        return production
    
    def _calculate_resource_consumption(self, nation: Nation, cities: Dict[str, City]) -> Dict[ResourceType, float]:
        improvement_system = ImprovementSystem()
        consumption = {}
        
        for improvement_type, count in nation.owned_improvements.items():
            improvement = improvement_system.get_improvement(improvement_type)
            
            if improvement.upkeep_resources:
                for resource, amount in improvement.upkeep_resources.items():
                    resource_type = ResourceType[resource.upper()]
                    consumption[resource_type] = consumption.get(resource_type, 0) + (amount * count)
        
        return consumption
    
    def _calculate_total_population(self, nation: Nation, cities: Dict[str, City]) -> int:
        city_system = CitySystem()
        return city_system.calculate_nation_total_population(
            nation.nation_id,
            nation.happiness,
            nation.environment
        )
    
    def _update_city_stats(self, nation: Nation, cities: Dict[str, City]):
        improvement_system = ImprovementSystem()
        wonder_system = WonderSystem()
        resource_system = ResourceSystem()
        
        improvement_bonus = 0.0
        for improvement_type, count in nation.owned_improvements.items():
            improvement = improvement_system.get_improvement(improvement_type)
            if improvement:
                improvement_bonus += improvement.environment_bonus * count
        
        wonder_bonus = 0.0
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder:
                wonder_bonus += wonder.environment_bonus
        
        resource_bonus = 0.0
        for resource in nation.owned_resources:
            resource_obj = resource_system.get_resource(resource)
            if resource_obj:
                resource_bonus += resource_obj.environment_bonus
        
        from .policies import PolicySystem
        policy_system = PolicySystem()
        domestic_policy = policy_system.get_domestic_policy(nation.domestic_policy_type)
        policy_bonus = domestic_policy.environment_bonus if domestic_policy else 0.0
        
        total_bonus = improvement_bonus + wonder_bonus + resource_bonus + policy_bonus
        
        for city in cities.values():
            city.environment = min(100, city.base_environment + total_bonus)
            city.crime = max(0, 100 - city.environment - (nation.happiness * 0.5))
            city.disease = max(0, 100 - city.environment)
        
        government = nation.get_government()
        gov_happiness = government.happiness_bonus if government else 0.0
        
        if nation.religion:
            from .govrel import ReligionSystem
            religion_system = ReligionSystem()
            religion_happiness = religion_system.calculate_religion_happiness_bonus(nation.religion)
        else:
            religion_happiness = 0
        
        from .military import MilitarySystem
        military_system = MilitarySystem()
        defense_strength = nation.calculate_defense_strength()
        defense_happiness = military_system.get_defense_happiness_effect(defense_strength, nation.total_population)
        
        happiness_bonus = 0.0
        for improvement_type, count in nation.owned_improvements.items():
            improvement = improvement_system.get_improvement(improvement_type)
            if improvement:
                happiness_bonus += improvement.happiness_bonus * count
        
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder:
                happiness_bonus += wonder.happiness_bonus
        
        tax_happiness_penalty = 0
        if nation.tax_rate > 0.20:
            excess_tax = nation.tax_rate - 0.20
            tax_happiness_penalty = int(excess_tax * 10)
        
        tax_happiness_penalty_reduction = 0
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder and wonder.tax_happiness_penalty_reduction:
                tax_happiness_penalty_reduction += wonder.tax_happiness_penalty_reduction
        
        tax_happiness_penalty = max(0, tax_happiness_penalty - tax_happiness_penalty_reduction)
        
        nation.happiness = max(0, min(10, 10 + gov_happiness + religion_happiness + defense_happiness + happiness_bonus - tax_happiness_penalty))
    
    def _roll_random_event(self, nation: Nation) -> Optional[str]:
        return None
    
    def process_all_nations(self, nations: Dict[str, Nation], 
                           cities: Dict[str, Dict[str, City]], 
                           current_tick: int) -> Dict[str, TurnResult]:
        results = {}
        
        for nation_id, nation in nations.items():
            nation_cities = cities.get(nation_id, {})
            result = self.process_nation_turn(nation, nation_cities, current_tick)
            results[nation_id] = result
        
        return results


turn_system = TurnSystem()
