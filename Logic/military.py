from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
import uuid


class MilitaryUnitType(Enum):
    SOLDIER = "Soldier"
    TANK = "Tank"
    AIRCRAFT_FIGHTER = "Aircraft (Fighter)"
    AIRCRAFT_BOMBER = "Aircraft (Bomber)"
    SHIP_DESTROYER = "Ship (Destroyer)"
    SHIP_CRUISER = "Ship (Cruiser)"
    SHIP_BATTLESHIP = "Ship (Battleship)"
    SHIP_CARRIER = "Ship (Carrier)"
    SHIP_SUBMARINE = "Ship (Submarine)"
    CRUISE_MISSILE = "Cruise Missile"
    NUCLEAR_WEAPON = "Nuclear Weapon"
    SPY = "Spy"


class CommanderType(Enum):
    SOLDIER_COMMANDER = "Soldier Commander"
    TANK_COMMANDER = "Tank Commander"
    AIRCRAFT_COMMANDER = "Aircraft Commander"
    NAVAL_COMMANDER = "Naval Commander"
    MISSILE_COMMANDER = "Missile Commander"
    SPY_COMMANDER = "Spy Commander"


@dataclass
class Commander:
    
    commander_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    commander_type: CommanderType = CommanderType.SOLDIER_COMMANDER
    name: str = ""
    level: int = 1
    experience: int = 0
    
    efficiency_bonus: float = 0.005
    cost_reduction: float = 0.005
    upkeep_reduction: float = 0.005
    
    def calculate_level_up_requirements(self) -> int:
        return self.level * 100
    
    def add_experience(self, exp: int) -> bool:
        self.experience += exp
        required = self.calculate_level_up_requirements()
        
        if self.experience >= required:
            self.level_up()
            return True
        return False
    
    def level_up(self) -> None:
        self.level += 1
        self.experience = 0
        bonus_increase = 0.005 * self.level
        self.efficiency_bonus = min(bonus_increase, 0.25)
        self.cost_reduction = min(bonus_increase, 0.25)
        self.upkeep_reduction = min(bonus_increase, 0.25)


@dataclass
class MilitaryUnit:
    unit_type: MilitaryUnitType
    name: str
    cost: float
    upkeep: float
    strength: float
    requires_improvement: Optional[str] = None
    requires_project: Optional[str] = None
    requires_wonder: Optional[str] = None
    requires_tech: int = 0
    requires_harbor: bool = False
    is_one_use: bool = False
    is_covert: bool = False
    
    is_ship: bool = False
    is_submarine: bool = False
    is_aircraft: bool = False
    naval_surprise_attack_bonus: float = 0.0
    aircraft_cost_bonus: float = 0.0
    soldier_casualty_bonus: float = 0.0


class MilitarySystem:
    def __init__(self):
        self.units: Dict[MilitaryUnitType, MilitaryUnit] = self._initialize_units()
    
    def _initialize_units(self) -> Dict[MilitaryUnitType, MilitaryUnit]:
        return {
            MilitaryUnitType.SOLDIER: MilitaryUnit(
                unit_type=MilitaryUnitType.SOLDIER,
                name="Soldier",
                cost=1.25,
                upkeep=0.50,
                strength=1.0,
                requires_improvement="Training Grounds",
                requires_tech=0
            ),
            MilitaryUnitType.TANK: MilitaryUnit(
                unit_type=MilitaryUnitType.TANK,
                name="Tank",
                cost=60.0,
                upkeep=0.75,
                strength=40.0,
                requires_improvement="Tank Workshop",
                requires_tech=500
            ),
            MilitaryUnitType.AIRCRAFT_FIGHTER: MilitaryUnit(
                unit_type=MilitaryUnitType.AIRCRAFT_FIGHTER,
                name="Aircraft (Fighter)",
                cost=3000.0,
                upkeep=200.0,
                strength=50.0,
                requires_improvement="Airfield",
                requires_tech=1000,
                is_aircraft=True
            ),
            MilitaryUnitType.AIRCRAFT_BOMBER: MilitaryUnit(
                unit_type=MilitaryUnitType.AIRCRAFT_BOMBER,
                name="Aircraft (Bomber)",
                cost=4000.0,
                upkeep=250.0,
                strength=60.0,
                requires_improvement="Airfield",
                requires_tech=1000,
                is_aircraft=True
            ),
            MilitaryUnitType.SHIP_DESTROYER: MilitaryUnit(
                unit_type=MilitaryUnitType.SHIP_DESTROYER,
                name="Ship (Destroyer)",
                cost=25000.0,
                upkeep=500.0,
                strength=250.0,
                requires_improvement="Drydock",
                requires_tech=1500,
                requires_harbor=True,
                is_ship=True
            ),
            MilitaryUnitType.SHIP_CRUISER: MilitaryUnit(
                unit_type=MilitaryUnitType.SHIP_CRUISER,
                name="Ship (Cruiser)",
                cost=50000.0,
                upkeep=1000.0,
                strength=500.0,
                requires_improvement="Drydock",
                requires_tech=1500,
                requires_harbor=True,
                is_ship=True
            ),
            MilitaryUnitType.SHIP_BATTLESHIP: MilitaryUnit(
                unit_type=MilitaryUnitType.SHIP_BATTLESHIP,
                name="Ship (Battleship)",
                cost=100000.0,
                upkeep=2000.0,
                strength=1000.0,
                requires_improvement="Drydock",
                requires_tech=1500,
                requires_harbor=True,
                is_ship=True
            ),
            MilitaryUnitType.SHIP_CARRIER: MilitaryUnit(
                unit_type=MilitaryUnitType.SHIP_CARRIER,
                name="Ship (Carrier)",
                cost=200000.0,
                upkeep=3500.0,
                strength=1500.0,
                requires_improvement="Drydock",
                requires_tech=1500,
                requires_harbor=True,
                is_ship=True
            ),
            MilitaryUnitType.SHIP_SUBMARINE: MilitaryUnit(
                unit_type=MilitaryUnitType.SHIP_SUBMARINE,
                name="Ship (Submarine)",
                cost=150000.0,
                upkeep=2500.0,
                strength=750.0,
                requires_improvement="Drydock",
                requires_project="Submarine Fleet",
                requires_tech=2000,
                requires_harbor=True,
                is_ship=True,
                is_submarine=True,
                naval_surprise_attack_bonus=0.20
            ),
            MilitaryUnitType.CRUISE_MISSILE: MilitaryUnit(
                unit_type=MilitaryUnitType.CRUISE_MISSILE,
                name="Cruise Missile",
                cost=150000.0,
                upkeep=0.0,
                strength=0.0,
                requires_improvement="Missile Battery",
                requires_tech=1500,
                is_one_use=True
            ),
            MilitaryUnitType.NUCLEAR_WEAPON: MilitaryUnit(
                unit_type=MilitaryUnitType.NUCLEAR_WEAPON,
                name="Nuclear Weapon",
                cost=1750000.0,
                upkeep=0.0,
                strength=0.0,
                requires_project="Manhattan Project",
                requires_tech=2500,
                is_one_use=True
            ),
            MilitaryUnitType.SPY: MilitaryUnit(
                unit_type=MilitaryUnitType.SPY,
                name="Spy",
                cost=50000.0,
                upkeep=2000.0,
                strength=0.0,
                requires_tech=500,
                is_covert=True
            ),
        }
    
    def get_unit(self, unit_type: MilitaryUnitType) -> MilitaryUnit:
        return self.units[unit_type]
    
    def get_all_units(self) -> list:
        return list(self.units.values())
    
    def recruit_commander(self, commander_type: CommanderType, name: str) -> Commander:
        commander = Commander(
            commander_type=commander_type,
            name=name,
            level=1,
            experience=0,
            efficiency_bonus=0.005,
            cost_reduction=0.005,
            upkeep_reduction=0.005
        )
        return commander
    
    def get_commander_bonus(self, commander: Optional[Commander]) -> Dict[str, float]:
        if commander is None:
            return {
                "efficiency_bonus": 0.0,
                "cost_reduction": 0.0,
                "upkeep_reduction": 0.0
            }
        
        return {
            "efficiency_bonus": commander.efficiency_bonus,
            "cost_reduction": commander.cost_reduction,
            "upkeep_reduction": commander.upkeep_reduction
        }
    
    def get_commander_bonus_by_attack_type(self, commanders: Dict[str, Commander], attack_type: str) -> float:
        if not commanders:
            return 0.0
        
        attack_to_commander = {
            "ground": [CommanderType.SOLDIER_COMMANDER, CommanderType.TANK_COMMANDER],
            "airstrike": [CommanderType.AIRCRAFT_COMMANDER],
            "naval": [CommanderType.NAVAL_COMMANDER],
            "missile": [CommanderType.MISSILE_COMMANDER],
            "spy": [CommanderType.SPY_COMMANDER]
        }
        
        commander_types = attack_to_commander.get(attack_type, [])
        
        for commander in commanders.values():
            if commander.commander_type in commander_types:
                return commander.efficiency_bonus
        
        return 0.0
    
    def check_commander_death(self, commander: Commander, unit_count: int, attacked_again: bool) -> bool:
        if unit_count == 0 and attacked_again:
            return True
        return False
    
    def calculate_military_score(self, soldiers: int, tanks: int, aircraft: int, ships: int,
                                 nukes: int, infrastructure: int, technology: int, city_count: int) -> float:
        from . import formulas
        return formulas.calculate_military_score(
            soldiers, tanks, aircraft, ships, nukes, infrastructure, technology, city_count
        )
    
    def calculate_defense_strength(self, soldiers: int, tanks: int, aircraft: int, ships: int) -> float:
        from . import formulas
        return formulas.calculate_defense_strength(soldiers, tanks, aircraft, ships)
    
    def calculate_ground_attack_strength(self, soldiers: int, tanks: int, soldier_efficiency: float,
                                        tank_efficiency: float) -> float:
        from . import formulas
        return formulas.calculate_ground_attack_strength(soldiers, tanks, soldier_efficiency, tank_efficiency)
    
    def calculate_ground_defense_strength(self, soldiers: int, tanks: int, soldier_efficiency: float,
                                          tank_efficiency: float, city_resistance: float) -> float:
        from . import formulas
        return formulas.calculate_ground_defense_strength(soldiers, tanks, soldier_efficiency, tank_efficiency, city_resistance)
    
    def calculate_naval_strength(self, destroyers: int, cruisers: int, battleships: int,
                                 carriers: int, ship_efficiency: float) -> float:
        from . import formulas
        return formulas.calculate_naval_strength(destroyers, cruisers, battleships, carriers, ship_efficiency)
    
    def get_defense_status(self, defense_strength: float, population: int) -> str:
        from . import formulas
        return formulas.get_defense_status(defense_strength, population)
    
    def get_defense_happiness_effect(self, defense_strength: float, population: int) -> int:
        from . import formulas
        return formulas.calculate_defense_happiness_effect(defense_strength, population)
    
    def calculate_nation_military_efficiency(self, nation: "Nation") -> Dict[str, float]:
        from .improvements import ImprovementSystem, ImprovementType
        from .projects import ProjectSystem
        from .wonders import WonderSystem
        from .progression import ProgressionSystem
        from .govrel import GovernmentSystem, ReligionSystem
        
        improvement_system = ImprovementSystem()
        project_system = ProjectSystem()
        wonder_system = WonderSystem()
        progression_system = ProgressionSystem()
        government_system = GovernmentSystem()
        religion_system = ReligionSystem()
        
        soldier_efficiency = 1.0
        tank_efficiency = 1.0
        aircraft_efficiency = 1.0
        ship_efficiency = 1.0
        
        # Apply government military bonus to ALL units
        government = government_system.get_government(nation.government_type)
        government_military_bonus = government.military_efficiency_bonus if government else 0.0
        soldier_efficiency += government_military_bonus
        tank_efficiency += government_military_bonus
        aircraft_efficiency += government_military_bonus
        ship_efficiency += government_military_bonus
        
        # Apply religion military bonus to ALL units
        if nation.religion:
            religion_military_bonus = religion_system.calculate_religion_military_bonus(nation.religion)
            soldier_efficiency += religion_military_bonus
            tank_efficiency += religion_military_bonus
            aircraft_efficiency += religion_military_bonus
            ship_efficiency += religion_military_bonus
        
        for improvement_type, count in nation.owned_improvements.items():
            improvement = improvement_system.get_improvement(improvement_type)
            if improvement:
                soldier_efficiency += improvement.soldier_efficiency_bonus * count
                tank_efficiency += improvement.tank_efficiency_bonus * count
                aircraft_efficiency += improvement.aircraft_efficiency_bonus * count
                ship_efficiency += improvement.ship_efficiency_bonus * count
        
        for project_type in nation.completed_projects:
            project = project_system.get_project(project_type)
            if project:
                soldier_efficiency += project.soldier_efficiency_bonus
                tank_efficiency += project.tank_efficiency_bonus
                aircraft_efficiency += project.aircraft_efficiency_bonus
                ship_efficiency += project.ship_efficiency_bonus
        
        for wonder_type in nation.owned_wonders:
            wonder = wonder_system.get_wonder(wonder_type)
            if wonder:
                soldier_efficiency += wonder.soldier_efficiency_bonus
                tank_efficiency += wonder.tank_efficiency_bonus
                aircraft_efficiency += wonder.aircraft_efficiency_bonus
                ship_efficiency += wonder.ship_efficiency_bonus
        
        tier = nation.current_tier
        if tier:
            tier_bonuses = progression_system.get_tier_bonuses(tier)
            soldier_efficiency += tier_bonuses.soldier_efficiency_bonus
            tank_efficiency += tier_bonuses.tank_efficiency_bonus
            aircraft_efficiency += tier_bonuses.aircraft_efficiency_bonus
            ship_efficiency += tier_bonuses.ship_efficiency_bonus
        
        for commander in nation.commanders.values():
            if commander.commander_type == CommanderType.SOLDIER_COMMANDER:
                soldier_efficiency += commander.efficiency_bonus
            elif commander.commander_type == CommanderType.TANK_COMMANDER:
                tank_efficiency += commander.efficiency_bonus
            elif commander.commander_type == CommanderType.AIRCRAFT_COMMANDER:
                aircraft_efficiency += commander.efficiency_bonus
            elif commander.commander_type == CommanderType.NAVAL_COMMANDER:
                ship_efficiency += commander.efficiency_bonus
        
        return {
            "soldier_efficiency": soldier_efficiency,
            "tank_efficiency": tank_efficiency,
            "aircraft_efficiency": aircraft_efficiency,
            "ship_efficiency": ship_efficiency
        }
    
    def repair_damaged_units(self, nation: "Nation", unit_type: str, 
                           amount_to_repair: int) -> Dict[str, any]:
        from .formulas import calculate_unit_repair_cost
        
        repair_cost_per_unit = calculate_unit_repair_cost(nation.technology, unit_type)
        total_cost = repair_cost_per_unit * amount_to_repair
        
        if nation.cash < total_cost:
            return {
                "success": False,
                "reason": "insufficient_cash",
                "required_cash": total_cost,
                "available_cash": nation.cash,
                "units_repaired": 0
            }
        
        nation.cash -= total_cost
        
        return {
            "success": True,
            "units_repaired": amount_to_repair,
            "cost": total_cost,
            "cost_per_unit": repair_cost_per_unit
        }


# Singleton instance
military_system = MilitarySystem()
