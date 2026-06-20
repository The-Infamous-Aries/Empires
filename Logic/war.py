"""
War System for Sovereign Nation Game

This module defines the War dataclass and war mechanics including
war declaration, attacks, victory conditions, and war outcomes.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime
import uuid

from .military import MilitaryUnitType
from .formulas import VictoryLevel
from .nation import Nation
from . import formulas


class WarType(Enum):
    """Types of war."""
    OFFENSIVE = "Offensive"
    DEFENSIVE = "Defensive"


class SuccessLevel(Enum):
    """Success levels for attacks (5-level system)."""
    COMPLETE_FAILURE = "Complete Failure"
    FAILURE = "Failure"
    TIE = "Tie"
    SUCCESS = "Success"
    COMPLETE_SUCCESS = "Complete Success"


class GroundAttackOption(Enum):
    """Options for ground attacks."""
    TARGET_GROUND = "Target Ground"
    TARGET_AIRCRAFT = "Target Aircraft"
    RAID = "Raid"


class AirstrikeOption(Enum):
    """Options for airstrikes."""
    TARGET_AIRCRAFT = "Target Aircraft"
    TARGET_GROUND = "Target Ground"
    TARGET_SHIPS = "Target Ships"
    DESTROY_INFRA = "Destroy Infrastructure"
    SUPPORT_GROUND = "Support Ground"


class NavalAttackOption(Enum):
    """Options for naval attacks."""
    TARGET_SHIPS = "Target Ships"
    TARGET_AIRCRAFT = "Target Aircraft"
    BLOCKADE = "Blockade"
    SUPPORT_AIRCRAFT = "Support Aircraft"


class AdvantageType(Enum):
    """Types of advantages/buffs."""
    AIR_ADVANTAGE = "Air Advantage"
    NAVAL_ADVANTAGE = "Naval Advantage"
    BLOCKADE = "Blockade"


class AttackType(Enum):
    """Types of attacks."""
    GROUND_ASSAULT = "Ground Assault"
    AIRSTRIKE = "Airstrike"
    NAVAL_BATTLE = "Naval Battle"
    MISSILE_STRIKE = "Missile Strike"
    NUCLEAR_STRIKE = "Nuclear Strike"
    CHEMICAL_ATTACK = "Chemical Attack"
    BIOLOGICAL_ATTACK = "Biological Attack"
    RAID = "Raid"
    SPY_OPERATION = "Spy Operation"


class RaidTargetType(Enum):
    """Types of raid targets."""
    CASH = "Cash"
    RESOURCE = "Resource"
    LAND = "Land"
    TECHNOLOGY = "Technology"


class SpyOperationType(Enum):
    """Types of spy operations."""
    GATHER_INTELLIGENCE = "Gather Intelligence"
    ASSASSINATE_SPIES = "Assassinate Spies"
    SABOTAGE_INFRASTRUCTURE = "Sabotage Infrastructure"
    STEAL_MONEY = "Steal Money"
    STEAL_RESOURCES = "Steal Resources"
    STEAL_TECHNOLOGY = "Steal Technology"
    STEAL_LAND = "Steal Land"
    INCITE_UNREST = "Incite Unrest"
    HACK_INFRASTRUCTURE = "Hack Infrastructure"
    ASSASSINATE_LEADER = "Assassinate Leader"
    DRONE_RECON = "Drone Recon"


@dataclass
class WarAttack:
    """Represents a single attack in a war."""

    attack_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    war_id: str = ""
    attacker_nation_id: str = ""
    defender_nation_id: str = ""

    attack_type: AttackType = AttackType.GROUND_ASSAULT
    target_type: Optional[RaidTargetType] = None  # For raids
    spy_operation_type: Optional[SpyOperationType] = None  # For spy operations

    # New attack options
    ground_attack_option: Optional[GroundAttackOption] = None
    airstrike_option: Optional[AirstrikeOption] = None
    naval_attack_option: Optional[NavalAttackOption] = None

    # Target city (for missiles/nukes)
    target_city_id: Optional[str] = None

    # Attack parameters
    soldiers_committed: int = 0
    tanks_committed: int = 0
    aircraft_committed: int = 0
    ships_committed: Dict[str, int] = field(default_factory=dict)  # Ship type -> count
    missiles_used: int = 0
    nukes_used: int = 0
    spies_committed: int = 0

    # Attack results
    success: bool = False
    success_level: Optional[SuccessLevel] = None  # New 5-level system
    damage_dealt: float = 0.0
    units_destroyed: Dict[str, int] = field(default_factory=dict)
    infrastructure_destroyed: int = 0
    land_destroyed: int = 0  # New field for land destruction
    loot_stolen: Dict[str, float] = field(default_factory=dict)
    attacker_losses: Dict[str, int] = field(default_factory=dict)

    # Alliance War Bonuses (if applicable)
    is_alliance_war: bool = False
    alliance_war_id: Optional[str] = None
    alliance_damage_multiplier: float = 1.0
    alliance_loot_multiplier: float = 1.0
    alliance_infra_damage_bonus: float = 0.0
    alliance_land_damage_bonus: float = 0.0

    # Missile/Nuke specific
    hit: Optional[bool] = None  # For missiles/nukes
    blocked_by_project: bool = False
    blocked_by_wonder: bool = False
    damage_modifier: float = 1.0  # From projects/wonders

    # Advantage granted (if Complete Success)
    advantage_granted: Optional[AdvantageType] = None

    # Timestamp
    tick: int = 0
    created_at: datetime = field(default_factory=datetime.now)

    def apply_alliance_war_bonuses(self, alliance_war_bonuses: Dict[str, float]):
        """Apply alliance war bonuses to this attack."""
        self.is_alliance_war = True
        self.alliance_damage_multiplier = alliance_war_bonuses.get("damage_multiplier", 1.0)
        self.alliance_loot_multiplier = alliance_war_bonuses.get("loot_multiplier", 1.0)
        self.alliance_infra_damage_bonus = alliance_war_bonuses.get("infrastructure_damage_bonus", 0.0)
        self.alliance_land_damage_bonus = alliance_war_bonuses.get("land_damage_bonus", 0.0)

    def get_effective_damage(self) -> float:
        """Calculate effective damage including alliance war multipliers."""
        base_damage = self.damage_dealt
        if self.is_alliance_war:
            base_damage *= self.alliance_damage_multiplier
        return base_damage

    def get_effective_infra_damage(self) -> int:
        """Calculate effective infrastructure damage including alliance war bonuses."""
        base_infra = self.infrastructure_destroyed
        if self.is_alliance_war:
            bonus_infra = int(base_infra * self.alliance_infra_damage_bonus)
            return base_infra + bonus_infra
        return base_infra

    def get_effective_land_damage(self) -> int:
        """Calculate effective land damage including alliance war bonuses."""
        base_land = self.land_destroyed
        if self.is_alliance_war:
            bonus_land = int(base_land * self.alliance_land_damage_bonus)
            return base_land + bonus_land
        return base_land

    def get_effective_loot(self) -> Dict[str, float]:
        """Calculate effective loot including alliance war multipliers."""
        if not self.is_alliance_war:
            return self.loot_stolen.copy()

        effective_loot = {}
        for loot_type, amount in self.loot_stolen.items():
            effective_loot[loot_type] = amount * self.alliance_loot_multiplier
        return effective_loot


@dataclass
class War:
    """Represents a war between two nations."""

    war_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    attacker_nation_id: str = ""
    defender_nation_id: str = ""

    war_type: WarType = WarType.OFFENSIVE

    # War state
    war_score_attacker: float = 50.0  # 0-100
    war_score_defender: float = 50.0  # 0-100

    # War turns
    attacker_war_turns: int = 3  # Refreshes to 3 each tick
    defender_war_turns: int = 3  # Refreshes to 3 each tick

    # War duration
    start_tick: int = 0
    current_tick: int = 0
    max_duration_ticks: int = 336  # 14 days

    # War status
    is_active: bool = True
    is_victory: bool = False
    is_defeat: bool = False
    is_peace_deal: bool = False
    is_expired: bool = False

    # Peace deal terms (if peace deal)
    peace_terms: Dict[str, Any] = field(default_factory=dict)

    # Attack history
    attacks: List[WarAttack] = field(default_factory=list)

    # Advantages/Buffs (new system)
    # Track which nation has which advantage
    attacker_advantages: List[AdvantageType] = field(default_factory=list)
    defender_advantages: List[AdvantageType] = field(default_factory=list)

    # Cooldowns and effects
    blockade_active: bool = False  # Naval blockade
    blockade_end_tick: int = 0
    chemical_attack_active: bool = False  # Chemical attack effect
    chemical_attack_end_tick: int = 0

    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)

    def has_advantage(self, nation_id: str, advantage: AdvantageType) -> bool:
        """Check if a nation has a specific advantage."""
        if nation_id == self.attacker_nation_id:
            return advantage in self.attacker_advantages
        elif nation_id == self.defender_nation_id:
            return advantage in self.defender_advantages
        return False

    def grant_advantage(self, nation_id: str, advantage: AdvantageType):
        """Grant an advantage to a nation."""
        if nation_id == self.attacker_nation_id:
            if advantage not in self.attacker_advantages:
                self.attacker_advantages.append(advantage)
        elif nation_id == self.defender_nation_id:
            if advantage not in self.defender_advantages:
                self.defender_advantages.append(advantage)

    def remove_advantage(self, nation_id: str, advantage: AdvantageType):
        """Remove an advantage from a nation."""
        if nation_id == self.attacker_nation_id:
            if advantage in self.attacker_advantages:
                self.attacker_advantages.remove(advantage)
        elif nation_id == self.defender_nation_id:
            if advantage in self.defender_advantages:
                self.defender_advantages.remove(advantage)
    
    def add_advantage(self, nation_id: str, advantage: AdvantageType):
        """Add an advantage to a nation (alias for grant_advantage)."""
        self.grant_advantage(nation_id, advantage)

    def remove_advantage_from_opponent(self, attack_type: AttackType, opponent_nation_id: str):
        """Remove advantage from opponent based on attack type that granted it."""
        if attack_type == AttackType.AIRSTRIKE:
            # Remove Air Advantage
            self.remove_advantage(opponent_nation_id, AdvantageType.AIR_ADVANTAGE)
        elif attack_type == AttackType.NAVAL_BATTLE:
            # Remove Naval Advantage and Blockade
            self.remove_advantage(opponent_nation_id, AdvantageType.NAVAL_ADVANTAGE)
            self.remove_advantage(opponent_nation_id, AdvantageType.BLOCKADE)
            # Also deactivate blockade if it was active
            if self.blockade_active:
                self.blockade_active = False

    def clear_all_advantages(self):
        """Clear all advantages from both sides (called when war ends)."""
        self.attacker_advantages.clear()
        self.defender_advantages.clear()
        self.blockade_active = False

    def can_attack(self, nation_id: str) -> bool:
        """Check if a nation can attack in this war."""
        if not self.is_active:
            return False
        
        if nation_id == self.attacker_nation_id:
            return self.attacker_war_turns > 0
        elif nation_id == self.defender_nation_id:
            return self.defender_war_turns > 0
        
        return False
    
    def use_war_turn(self, nation_id: str) -> bool:
        """Use a war turn for a nation."""
        if nation_id == self.attacker_nation_id and self.attacker_war_turns > 0:
            self.attacker_war_turns -= 1
            return True
        elif nation_id == self.defender_nation_id and self.defender_war_turns > 0:
            self.defender_war_turns -= 1
            return True
        return False
    
    def refresh_war_turns(self):
        """Refresh war turns to 3 for both sides."""
        self.attacker_war_turns = 3
        self.defender_war_turns = 3
    
    def update_war_score(self, attacker_delta: float, defender_delta: float):
        """Update war scores."""
        self.war_score_attacker = max(0.0, min(100.0, self.war_score_attacker + attacker_delta))
        self.war_score_defender = max(0.0, min(100.0, self.war_score_defender + defender_delta))
        
        # Check victory conditions
        if self.war_score_attacker >= 100.0:
            self.is_victory = True
            self.is_active = False
        elif self.war_score_defender >= 100.0:
            self.is_defeat = True
            self.is_active = False
    
    def add_attack(self, attack: WarAttack):
        """Add an attack to the war history."""
        # Record attack statistics (stats DB module not yet migrated)
        try:
            pass
        except Exception as e:
            import logging
            logging.getLogger("Reaper.War").error(f"Failed to record attack statistics: {e}")
        
        self.attacks.append(attack)
    
    def check_expiry(self, current_tick: int) -> bool:
        """Check if war has expired (336 ticks)."""
        self.current_tick = current_tick
        ticks_elapsed = current_tick - self.start_tick
        
        if ticks_elapsed >= self.max_duration_ticks:
            self.is_expired = True
            self.is_active = False
            
            # Record expired war outcome in military statistics
            try:
                from .Database.models.military_statistics_model import MilitaryStatisticsModel
                from .Database.nations_db import NationsDatabaseManager
                
                stats_model = MilitaryStatisticsModel(NationsDatabaseManager())
                stats_model.update_war_outcome(self.attacker_nation_id, "expired")
                stats_model.update_war_outcome(self.defender_nation_id, "expired")
            except Exception as e:
                # Log error but don't fail the expiry check
                import logging
                logging.getLogger("Reaper.War").error(f"Failed to record expired war in statistics: {e}")
            
            return True
        
        return False
    
    def activate_blockade(self, duration_ticks: int = 72):
        """Activate naval blockade."""
        self.blockade_active = True
        self.blockade_end_tick = self.current_tick + duration_ticks
    
    def check_blockade_expiry(self, current_tick: int) -> bool:
        """Check if blockade has expired."""
        if self.blockade_active and current_tick >= self.blockade_end_tick:
            self.blockade_active = False
            return True
        return False
    
    def activate_chemical_attack(self, duration_ticks: int = 24):
        """Activate chemical attack effect."""
        self.chemical_attack_active = True
        self.chemical_attack_end_tick = self.current_tick + duration_ticks
    
    def check_chemical_attack_expiry(self, current_tick: int) -> bool:
        """Check if chemical attack effect has expired."""
        if self.chemical_attack_active and current_tick >= self.chemical_attack_end_tick:
            self.chemical_attack_active = False
            return True
        return False
    
    def calculate_war_duration(self) -> int:
        """Calculate war duration in ticks."""
        return self.current_tick - self.start_tick


class WarSystem:
    """System for managing wars between nations."""
    
    def __init__(self):
        self.wars: Dict[str, War] = {}  # war_id -> War
        self.nation_wars: Dict[str, Dict[str, War]] = {}  # nation_id -> {war_id -> War}
    
    def can_declare_war(self, attacker_nation_id: str, defender_nation_id: str,
                       attacker_ns: float, defender_ns: float,
                       attacker_offensive_wars: int, attacker_defensive_wars: int,
                       war_cooldown: int) -> tuple[bool, str]:
        """Check if attacker can declare war on defender."""
        # Check NS range (2× or 0.5×)
        if defender_ns > attacker_ns * 2.0 or defender_ns < attacker_ns * 0.5:
            return False, "Target nation is outside NS range (2× or 0.5×)"
        
        # Check war limits (3 offensive, 3 defensive)
        if attacker_offensive_wars >= 3:
            return False, "Already at maximum offensive wars (3)"
        
        if attacker_defensive_wars >= 3:
            return False, "Already at maximum defensive wars (3)"
        
        # Check war cooldown
        if war_cooldown > 0:
            return False, f"War cooldown active ({war_cooldown} ticks remaining)"
        
        return True, ""
    
    def declare_war(self, attacker_nation_id: str, defender_nation_id: str,
                   start_tick: int, war_type: WarType = WarType.OFFENSIVE) -> War:
        """Declare a new war between two nations."""
        war = War(
            attacker_nation_id=attacker_nation_id,
            defender_nation_id=defender_nation_id,
            war_type=war_type,
            start_tick=start_tick,
            current_tick=start_tick
        )
        
        self.wars[war.war_id] = war
        
        if attacker_nation_id not in self.nation_wars:
            self.nation_wars[attacker_nation_id] = {}
        self.nation_wars[attacker_nation_id][war.war_id] = war
        
        if defender_nation_id not in self.nation_wars:
            self.nation_wars[defender_nation_id] = {}
        self.nation_wars[defender_nation_id][war.war_id] = war
        
        return war
    
    def get_war(self, war_id: str) -> Optional[War]:
        """Get a war by ID."""
        return self.wars.get(war_id)
    
    def get_nation_wars(self, nation_id: str) -> Dict[str, War]:
        """Get all wars for a nation."""
        return self.nation_wars.get(nation_id, {})
    
    def get_nation_offensive_wars(self, nation_id: str) -> List[War]:
        """Get all offensive wars for a nation."""
        wars = self.get_nation_wars(nation_id)
        return [war for war in wars.values() if war.attacker_nation_id == nation_id]
    
    def get_nation_defensive_wars(self, nation_id: str) -> List[War]:
        """Get all defensive wars for a nation."""
        wars = self.get_nation_wars(nation_id)
        return [war for war in wars.values() if war.defender_nation_id == nation_id]
    
    def get_active_wars(self) -> List[War]:
        """Get all active wars."""
        return [war for war in self.wars.values() if war.is_active]
    
    def end_war(self, war_id: str, outcome: str) -> bool:
        """End a war with specified outcome."""
        if war_id in self.wars:
            war = self.wars[war_id]

            if outcome == "victory":
                war.is_victory = True
            elif outcome == "defeat":
                war.is_defeat = True
            elif outcome == "peace":
                war.is_peace_deal = True

            war.is_active = False

            # Clear all advantages/buffs when war ends
            war.clear_all_advantages()
            
            # Record war outcome in military statistics (stats DB module not yet migrated)
            try:
                pass
            except Exception:
                pass
            
            return True
        
        return False
    
    def delete_war(self, war_id: str) -> bool:
        """Delete a war by ID."""
        if war_id in self.wars:
            war = self.wars[war_id]
            attacker_id = war.attacker_nation_id
            defender_id = war.defender_nation_id
            
            del self.wars[war_id]
            
            if attacker_id in self.nation_wars and war_id in self.nation_wars[attacker_id]:
                del self.nation_wars[attacker_id][war_id]
            
            if defender_id in self.nation_wars and war_id in self.nation_wars[defender_id]:
                del self.nation_wars[defender_id][war_id]
            
            return True
        
        return False
    
    def calculate_success_level(self, attack_strength: float, defense_strength: float) -> SuccessLevel:
        """Calculate success level based on attack/defense ratio."""
        if defense_strength == 0:
            return SuccessLevel.COMPLETE_SUCCESS

        ratio = attack_strength / defense_strength

        if ratio >= 1.5:
            return SuccessLevel.COMPLETE_SUCCESS
        elif ratio >= 1.1:
            return SuccessLevel.SUCCESS
        elif ratio >= 0.9:
            return SuccessLevel.TIE
        elif ratio >= 0.5:
            return SuccessLevel.FAILURE
        else:
            return SuccessLevel.COMPLETE_FAILURE

    def get_war_score_change(self, attack_type: AttackType, success_level: SuccessLevel) -> float:
        """Get war score change based on attack type and success level."""
        score_changes = {
            AttackType.GROUND_ASSAULT: {
                SuccessLevel.COMPLETE_SUCCESS: 15,
                SuccessLevel.SUCCESS: 10,
                SuccessLevel.TIE: 0,
                SuccessLevel.FAILURE: -10,
                SuccessLevel.COMPLETE_FAILURE: -15
            },
            AttackType.AIRSTRIKE: {
                SuccessLevel.COMPLETE_SUCCESS: 8,
                SuccessLevel.SUCCESS: 5,
                SuccessLevel.TIE: 0,
                SuccessLevel.FAILURE: -3,
                SuccessLevel.COMPLETE_FAILURE: -3
            },
            AttackType.NAVAL_BATTLE: {
                SuccessLevel.COMPLETE_SUCCESS: 15,
                SuccessLevel.SUCCESS: 10,
                SuccessLevel.TIE: 0,
                SuccessLevel.FAILURE: -8,
                SuccessLevel.COMPLETE_FAILURE: -12
            },
            AttackType.MISSILE_STRIKE: {
                SuccessLevel.COMPLETE_SUCCESS: 10,  # Hit
                SuccessLevel.FAILURE: -4  # Miss
            },
            AttackType.NUCLEAR_STRIKE: {
                SuccessLevel.COMPLETE_SUCCESS: 30,  # Hit
                SuccessLevel.FAILURE: -5  # Miss
            },
            AttackType.RAID: {
                SuccessLevel.COMPLETE_SUCCESS: 7,
                SuccessLevel.SUCCESS: 5,
                SuccessLevel.TIE: 0,
                SuccessLevel.FAILURE: -3,
                SuccessLevel.COMPLETE_FAILURE: -3
            },
            AttackType.SPY_OPERATION: {
                SuccessLevel.COMPLETE_SUCCESS: 6,
                SuccessLevel.SUCCESS: 4,
                SuccessLevel.TIE: 0,
                SuccessLevel.FAILURE: -4,
                SuccessLevel.COMPLETE_FAILURE: -4
            }
        }

        return score_changes.get(attack_type, {}).get(success_level, 0)

    def process_tick(self, current_tick: int):
        """Process all wars for a tick."""
        for war in self.wars.values():
            if war.is_active:
                # Refresh war turns
                war.refresh_war_turns()
                
                # Check expiry
                war.check_expiry(current_tick)
                
                # Check blockade expiry
                war.check_blockade_expiry(current_tick)
                
                # Check chemical attack expiry
                war.check_chemical_attack_expiry(current_tick)
    
    def get_city_infrastructure_for_attack(self, defender_nation_data: dict, target_city_id: Optional[str] = None) -> int:
        """
        Get the infrastructure of a target city for attack calculations.
        
        Args:
            defender_nation_data: Dictionary containing defender nation data with cities
            target_city_id: ID of the target city (if None, uses average or random city)
        
        Returns:
            Infrastructure value of the target city (default 1000 if no cities)
        """
        if "cities" not in defender_nation_data or not defender_nation_data["cities"]:
            return 1000  # Default infrastructure if no cities
        
        if target_city_id and target_city_id in defender_nation_data["cities"]:
            # Return infrastructure of specific target city
            return defender_nation_data["cities"][target_city_id].infrastructure
        
        # If no specific city, return average infrastructure
        cities = defender_nation_data["cities"]
        total_infra = sum(city.infrastructure for city in cities.values())
        return int(total_infra / len(cities)) if cities else 1000
    
    def calculate_ground_attack(self, attacker_soldiers: int, attacker_tanks: int,
                                defender_soldiers: int, defender_tanks: int,
                                soldier_efficiency: float, tank_efficiency: float,
                                city_resistance: float,
                                attacker_tech: int = 0, defender_tech: int = 0,
                                attacker_supply_intact: bool = True, defender_supply_intact: bool = True,
                                attacker_commander_bonus: float = 0.0, defender_commander_bonus: float = 0.0,
                                attack_option: GroundAttackOption = GroundAttackOption.TARGET_GROUND,
                                defender_aircraft: int = 0, defender_infrastructure: int = 1000) -> dict:
        """Calculate ground attack result with new 5-level success system."""
        from . import formulas

        # Use formula functions with tech scaling and commander bonuses
        attack_strength = formulas.calculate_ground_attack_strength(
            attacker_soldiers, attacker_tanks, soldier_efficiency, tank_efficiency,
            attacker_tech, attacker_supply_intact, 0.0, attacker_commander_bonus
        )
        defense_strength = formulas.calculate_ground_defense_strength(
            defender_soldiers, defender_tanks, soldier_efficiency, tank_efficiency,
            defender_tech, city_resistance, defender_supply_intact, defender_commander_bonus
        )

        # Calculate success level
        success_level = self.calculate_success_level(attack_strength, defense_strength)

        # Calculate results based on attack option and success level
        if attack_option == GroundAttackOption.TARGET_GROUND:
            # Target Ground: destroy/loot in random city
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                total_defender_soldier_losses = int(defender_soldiers * 0.15)
                total_defender_tank_losses = int(defender_tanks * 0.15)
                infra_destroyed = int(defender_infrastructure * 0.15)  # 15% of actual city infrastructure
                loot_percent = 0.15
                total_attacker_soldier_losses = int(attacker_soldiers * 0.05)
                total_attacker_tank_losses = int(attacker_tanks * 0.05)
            elif success_level == SuccessLevel.SUCCESS:
                total_defender_soldier_losses = int(defender_soldiers * 0.10)
                total_defender_tank_losses = int(defender_tanks * 0.10)
                infra_destroyed = int(defender_infrastructure * 0.10)  # 10% of actual city infrastructure
                loot_percent = 0.10
                total_attacker_soldier_losses = int(attacker_soldiers * 0.05)
                total_attacker_tank_losses = int(attacker_tanks * 0.05)
            elif success_level == SuccessLevel.TIE:
                total_defender_soldier_losses = int(defender_soldiers * 0.05)
                total_defender_tank_losses = int(defender_tanks * 0.05)
                infra_destroyed = int(defender_infrastructure * 0.05)  # 5% of actual city infrastructure
                loot_percent = 0.0  # No loot on tie
                total_attacker_soldier_losses = int(attacker_soldiers * 0.05)
                total_attacker_tank_losses = int(attacker_tanks * 0.05)
            elif success_level == SuccessLevel.FAILURE:
                total_defender_soldier_losses = 0
                total_defender_tank_losses = 0
                infra_destroyed = 0
                loot_percent = 0.0
                total_attacker_soldier_losses = int(attacker_soldiers * 0.10)
                total_attacker_tank_losses = int(attacker_tanks * 0.10)
            else:  # Complete Failure
                total_defender_soldier_losses = 0
                total_defender_tank_losses = 0
                infra_destroyed = 0
                loot_percent = 0.0
                total_attacker_soldier_losses = int(attacker_soldiers * 0.20)
                total_attacker_tank_losses = int(attacker_tanks * 0.20)

            # Apply damaged units calculation
            defender_soldier_result = formulas.calculate_unit_losses_with_damage(total_defender_soldier_losses, defender_tech)
            defender_tank_result = formulas.calculate_unit_losses_with_damage(total_defender_tank_losses, defender_tech)
            attacker_soldier_result = formulas.calculate_unit_losses_with_damage(total_attacker_soldier_losses, attacker_tech)
            attacker_tank_result = formulas.calculate_unit_losses_with_damage(total_attacker_tank_losses, attacker_tech)

            defender_losses = {
                "soldiers_destroyed": defender_soldier_result["destroyed"],
                "soldiers_damaged": defender_soldier_result["damaged"],
                "tanks_destroyed": defender_tank_result["destroyed"],
                "tanks_damaged": defender_tank_result["damaged"]
            }
            attacker_losses = {
                "soldiers_destroyed": attacker_soldier_result["destroyed"],
                "soldiers_damaged": attacker_soldier_result["damaged"],
                "tanks_destroyed": attacker_tank_result["destroyed"],
                "tanks_damaged": attacker_tank_result["damaged"]
            }
            
            # Cut supply lines if significant infrastructure destroyed (Complete Success or Success)
            supply_lines_cut = (infra_destroyed >= 100)

        elif attack_option == GroundAttackOption.TARGET_AIRCRAFT:
            # Target Aircraft: destroys aircraft based on defender's tanks (if they have tanks)
            if defender_tanks == 0:
                return {"success": False, "message": "Defender has no tanks to target aircraft"}

            aircraft_destroyed = int(defender_aircraft * (defender_tanks / 1000) * 0.5)  # Reduced damage

            if success_level in [SuccessLevel.COMPLETE_SUCCESS, SuccessLevel.SUCCESS]:
                total_aircraft_destroyed = int(aircraft_destroyed * 1.5)
                total_attacker_soldier_losses = int(attacker_soldiers * 0.05)
                total_attacker_tank_losses = int(attacker_tanks * 0.05)
                loot_percent = 0.0
                infra_destroyed = 0
            elif success_level == SuccessLevel.TIE:
                total_aircraft_destroyed = aircraft_destroyed
                total_attacker_soldier_losses = int(attacker_soldiers * 0.05)
                total_attacker_tank_losses = int(attacker_tanks * 0.05)
                loot_percent = 0.0
                infra_destroyed = 0
            else:  # Failure or Complete Failure
                total_aircraft_destroyed = 0
                total_attacker_soldier_losses = int(attacker_soldiers * 0.15)
                total_attacker_tank_losses = int(attacker_tanks * 0.15)
                loot_percent = 0.0
                infra_destroyed = 0

            # Apply damaged units calculation
            aircraft_result = formulas.calculate_unit_losses_with_damage(total_aircraft_destroyed, defender_tech)
            attacker_soldier_result = formulas.calculate_unit_losses_with_damage(total_attacker_soldier_losses, attacker_tech)
            attacker_tank_result = formulas.calculate_unit_losses_with_damage(total_attacker_tank_losses, attacker_tech)

            defender_losses = {
                "aircraft_destroyed": aircraft_result["destroyed"],
                "aircraft_damaged": aircraft_result["damaged"]
            }
            attacker_losses = {
                "soldiers_destroyed": attacker_soldier_result["destroyed"],
                "soldiers_damaged": attacker_soldier_result["damaged"],
                "tanks_destroyed": attacker_tank_result["destroyed"],
                "tanks_damaged": attacker_tank_result["damaged"]
            }
            
            supply_lines_cut = False

        elif attack_option == GroundAttackOption.RAID:
            # Raid: lower success rate if defender has more ground units, but MUCH MORE loot if successful
            ground_unit_ratio = (defender_soldiers + defender_tanks * 40) / (attacker_soldiers + attacker_tanks * 40 + 1)

            # Adjust success level based on defender's ground units
            if ground_unit_ratio > 2.0:
                # Reduce success level by one tier if heavily outnumbered
                if success_level == SuccessLevel.COMPLETE_SUCCESS:
                    success_level = SuccessLevel.SUCCESS
                elif success_level == SuccessLevel.SUCCESS:
                    success_level = SuccessLevel.TIE
                elif success_level == SuccessLevel.TIE:
                    success_level = SuccessLevel.FAILURE

            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                total_defender_soldier_losses = int(defender_soldiers * 0.05)
                total_defender_tank_losses = int(defender_tanks * 0.05)
                infra_destroyed = 0
                loot_percent = 0.30  # MUCH MORE loot
                total_attacker_soldier_losses = int(attacker_soldiers * 0.03)
                total_attacker_tank_losses = int(attacker_tanks * 0.03)
            elif success_level == SuccessLevel.SUCCESS:
                total_defender_soldier_losses = int(defender_soldiers * 0.03)
                total_defender_tank_losses = int(defender_tanks * 0.03)
                infra_destroyed = 0
                loot_percent = 0.20
                total_attacker_soldier_losses = int(attacker_soldiers * 0.03)
                total_attacker_tank_losses = int(attacker_tanks * 0.03)
            elif success_level == SuccessLevel.TIE:
                total_defender_soldier_losses = 0
                total_defender_tank_losses = 0
                infra_destroyed = 0
                loot_percent = 0.10
                total_attacker_soldier_losses = int(attacker_soldiers * 0.05)
                total_attacker_tank_losses = int(attacker_tanks * 0.05)
            else:  # Failure or Complete Failure
                total_defender_soldier_losses = 0
                total_defender_tank_losses = 0
                infra_destroyed = 0
                loot_percent = 0.0
                total_attacker_soldier_losses = int(attacker_soldiers * 0.10)
                total_attacker_tank_losses = int(attacker_tanks * 0.10)

            # Apply damaged units calculation
            defender_soldier_result = formulas.calculate_unit_losses_with_damage(total_defender_soldier_losses, defender_tech)
            defender_tank_result = formulas.calculate_unit_losses_with_damage(total_defender_tank_losses, defender_tech)
            attacker_soldier_result = formulas.calculate_unit_losses_with_damage(total_attacker_soldier_losses, attacker_tech)
            attacker_tank_result = formulas.calculate_unit_losses_with_damage(total_attacker_tank_losses, attacker_tech)

            defender_losses = {
                "soldiers_destroyed": defender_soldier_result["destroyed"],
                "soldiers_damaged": defender_soldier_result["damaged"],
                "tanks_destroyed": defender_tank_result["destroyed"],
                "tanks_damaged": defender_tank_result["damaged"]
            }
            attacker_losses = {
                "soldiers_destroyed": attacker_soldier_result["destroyed"],
                "soldiers_damaged": attacker_soldier_result["damaged"],
                "tanks_destroyed": attacker_tank_result["destroyed"],
                "tanks_damaged": attacker_tank_result["damaged"]
            }
            
            supply_lines_cut = False  # Raid doesn't cut supply lines

        return {
            "attack_strength": attack_strength,
            "defense_strength": defense_strength,
            "success_level": success_level,
            "defender_losses": defender_losses,
            "infrastructure_destroyed": infra_destroyed,
            "loot_percent": loot_percent,
            "attacker_losses": attacker_losses,
            "supply_lines_cut": supply_lines_cut
        }
    
    def calculate_airstrike(self, attacker_aircraft: int, airstrike_option: AirstrikeOption,
                            defender_aircraft: int, defender_soldiers: int, defender_tanks: int,
                            defender_ships: Dict[str, int],
                            has_air_defense: bool, has_air_advantage: bool,
                            attacker_fighters: int = 0, attacker_bombers: int = 0,
                            aircraft_type_preference: str = "auto",  # "auto", "fighter", "bomber"
                            attacker_tech: int = 0, defender_tech: int = 0,
                            attacker_commander_bonus: float = 0.0, defender_commander_bonus: float = 0.0,
                            defender_infrastructure: int = 1000) -> dict:
        """Calculate airstrike result with new 5-level success system and aircraft type distinction."""
        from . import formulas

        # Determine primary aircraft type for damage calculation
        if aircraft_type_preference == "fighter":
            aircraft_type = "fighter"
            primary_aircraft = attacker_fighters if attacker_fighters > 0 else attacker_aircraft
        elif aircraft_type_preference == "bomber":
            aircraft_type = "bomber"
            primary_aircraft = attacker_bombers if attacker_bombers > 0 else attacker_aircraft
        else:  # auto
            if attacker_bombers > attacker_fighters:
                aircraft_type = "bomber"
                primary_aircraft = attacker_bombers
            else:
                aircraft_type = "fighter"
                primary_aircraft = attacker_fighters if attacker_fighters > 0 else attacker_aircraft

        # Use formula function with tech scaling, aircraft type, and commander bonus
        damage_result = formulas.calculate_airstrike_damage(
            primary_aircraft, aircraft_type, 1.0,
            0.2 if has_air_advantage else 0.0,
            0.5 if has_air_defense else 0.0,
            attacker_tech,
            attacker_commander_bonus
        )

        # Calculate attack strength (aircraft * 100 with tech scaling)
        attack_strength = attacker_aircraft * 100 * formulas.calculate_tech_efficiency_multiplier(attacker_tech)
        if has_air_advantage:
            attack_strength *= 1.2  # 20% bonus from Air Advantage

        # Calculate defense strength based on target with tech scaling
        defender_tech_multiplier = formulas.calculate_tech_efficiency_multiplier(defender_tech)
        if airstrike_option == AirstrikeOption.TARGET_AIRCRAFT:
            defense_strength = defender_aircraft * 100 * defender_tech_multiplier
        elif airstrike_option == AirstrikeOption.TARGET_GROUND:
            defense_strength = ((defender_soldiers * 1) + (defender_tanks * 40)) * defender_tech_multiplier
        elif airstrike_option == AirstrikeOption.TARGET_SHIPS:
            defense_strength = ((defender_ships.get("destroyer", 0) * 250) +
                             (defender_ships.get("cruiser", 0) * 500) +
                             (defender_ships.get("battleship", 0) * 1000) +
                             (defender_ships.get("carrier", 0) * 1500)) * defender_tech_multiplier
        else:  # Destroy Infra or Support Ground
            defense_strength = defender_aircraft * 50 * defender_tech_multiplier  # Lower defense for infra/support

        # Reduce success rate if defender has more aircraft
        aircraft_ratio = defender_aircraft / (attacker_aircraft + 1)
        if aircraft_ratio > 1.0:
            defense_strength *= aircraft_ratio

        # Calculate success level
        success_level = self.calculate_success_level(attack_strength, defense_strength)

        # Aircraft losses from formula
        total_aircraft_losses = int(attacker_aircraft * damage_result["aircraft_losses_percent"])
        
        # Apply damaged units calculation to aircraft losses
        aircraft_loss_result = formulas.calculate_unit_losses_with_damage(total_aircraft_losses, attacker_tech)
        attacker_losses = {
            "aircraft_destroyed": aircraft_loss_result["destroyed"],
            "aircraft_damaged": aircraft_loss_result["damaged"]
        }

        # Calculate results based on airstrike option and success level
        advantage_granted = None
        infra_destroyed = 0

        if airstrike_option == AirstrikeOption.TARGET_AIRCRAFT:
            # Target Aircraft: destroys enemy aircraft, grants Air Advantage if Complete Success
            # Use aircraft-specific destruction from formula
            aircraft_destroyed_percent = damage_result["ship_aircraft_destruction_percent"]
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                total_aircraft_destroyed = int(defender_aircraft * aircraft_destroyed_percent)
                advantage_granted = AdvantageType.AIR_ADVANTAGE
            elif success_level == SuccessLevel.SUCCESS:
                total_aircraft_destroyed = int(defender_aircraft * (aircraft_destroyed_percent * 0.8))
            elif success_level == SuccessLevel.TIE:
                total_aircraft_destroyed = int(defender_aircraft * (aircraft_destroyed_percent * 0.5))
            else:  # Failure or Complete Failure
                total_aircraft_destroyed = 0

            # Apply damaged units calculation
            aircraft_result = formulas.calculate_unit_losses_with_damage(total_aircraft_destroyed, defender_tech)
            defender_losses = {
                "aircraft_destroyed": aircraft_result["destroyed"],
                "aircraft_damaged": aircraft_result["damaged"]
            }

        elif airstrike_option == AirstrikeOption.TARGET_GROUND:
            # Target Ground: kills soldiers and tanks
            # Use ground unit destruction from formula
            unit_destroyed_percent = damage_result["unit_destruction_percent"]
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                total_soldier_losses = int(defender_soldiers * unit_destroyed_percent)
                total_tank_losses = int(defender_tanks * unit_destroyed_percent)
            elif success_level == SuccessLevel.SUCCESS:
                total_soldier_losses = int(defender_soldiers * (unit_destroyed_percent * 0.8))
                total_tank_losses = int(defender_tanks * (unit_destroyed_percent * 0.8))
            elif success_level == SuccessLevel.TIE:
                total_soldier_losses = int(defender_soldiers * (unit_destroyed_percent * 0.5))
                total_tank_losses = int(defender_tanks * (unit_destroyed_percent * 0.5))
            else:  # Failure or Complete Failure
                total_soldier_losses = 0
                total_tank_losses = 0

            # Apply damaged units calculation
            soldier_result = formulas.calculate_unit_losses_with_damage(total_soldier_losses, defender_tech)
            tank_result = formulas.calculate_unit_losses_with_damage(total_tank_losses, defender_tech)
            defender_losses = {
                "soldiers_destroyed": soldier_result["destroyed"],
                "soldiers_damaged": soldier_result["damaged"],
                "tanks_destroyed": tank_result["destroyed"],
                "tanks_damaged": tank_result["damaged"]
            }

        elif airstrike_option == AirstrikeOption.TARGET_SHIPS:
            # Target Ships: kills ships
            # Use ship/aircraft destruction from formula
            ship_destroyed_percent = damage_result["ship_aircraft_destruction_percent"]
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                total_destroyer_losses = int(defender_ships.get("destroyer", 0) * ship_destroyed_percent)
                total_cruiser_losses = int(defender_ships.get("cruiser", 0) * ship_destroyed_percent)
                total_battleship_losses = int(defender_ships.get("battleship", 0) * ship_destroyed_percent)
                total_carrier_losses = int(defender_ships.get("carrier", 0) * ship_destroyed_percent)
            elif success_level == SuccessLevel.SUCCESS:
                total_destroyer_losses = int(defender_ships.get("destroyer", 0) * (ship_destroyed_percent * 0.8))
                total_cruiser_losses = int(defender_ships.get("cruiser", 0) * (ship_destroyed_percent * 0.8))
                total_battleship_losses = int(defender_ships.get("battleship", 0) * (ship_destroyed_percent * 0.8))
                total_carrier_losses = int(defender_ships.get("carrier", 0) * (ship_destroyed_percent * 0.8))
            elif success_level == SuccessLevel.TIE:
                total_destroyer_losses = int(defender_ships.get("destroyer", 0) * (ship_destroyed_percent * 0.5))
                total_cruiser_losses = int(defender_ships.get("cruiser", 0) * (ship_destroyed_percent * 0.5))
                total_battleship_losses = int(defender_ships.get("battleship", 0) * (ship_destroyed_percent * 0.5))
                total_carrier_losses = int(defender_ships.get("carrier", 0) * (ship_destroyed_percent * 0.5))
            else:  # Failure or Complete Failure
                total_destroyer_losses = 0
                total_cruiser_losses = 0
                total_battleship_losses = 0
                total_carrier_losses = 0

            # Apply damaged units calculation
            destroyer_result = formulas.calculate_unit_losses_with_damage(total_destroyer_losses, defender_tech)
            cruiser_result = formulas.calculate_unit_losses_with_damage(total_cruiser_losses, defender_tech)
            battleship_result = formulas.calculate_unit_losses_with_damage(total_battleship_losses, defender_tech)
            carrier_result = formulas.calculate_unit_losses_with_damage(total_carrier_losses, defender_tech)
            defender_losses = {
                "destroyer_destroyed": destroyer_result["destroyed"],
                "destroyer_damaged": destroyer_result["damaged"],
                "cruiser_destroyed": cruiser_result["destroyed"],
                "cruiser_damaged": cruiser_result["damaged"],
                "battleship_destroyed": battleship_result["destroyed"],
                "battleship_damaged": battleship_result["damaged"],
                "carrier_destroyed": carrier_result["destroyed"],
                "carrier_damaged": carrier_result["damaged"]
            }

        elif airstrike_option == AirstrikeOption.DESTROY_INFRA:
            # Destroy Infrastructure: destroys LOTS of infra (bombers excel here)
            # Use infrastructure destruction from formula
            infra_destroyed_percent = damage_result["infrastructure_destruction_percent"]
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                infra_destroyed = int(defender_infrastructure * infra_destroyed_percent)  # Use actual city infrastructure
            elif success_level == SuccessLevel.SUCCESS:
                infra_destroyed = int(defender_infrastructure * (infra_destroyed_percent * 0.8))
            elif success_level == SuccessLevel.TIE:
                infra_destroyed = int(defender_infrastructure * (infra_destroyed_percent * 0.5))
            else:  # Failure or Complete Failure
                infra_destroyed = 0

            defender_losses = {}

        elif airstrike_option == AirstrikeOption.SUPPORT_GROUND:
            # Support Ground: boosts tank efficiency ONLY if Complete Success, destroys NO enemy aircraft
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                defender_losses = {}
                advantage_granted = "TANK_EFFICIENCY_BOOST"  # Special marker for tank efficiency boost
            else:
                defender_losses = {}
                advantage_granted = None

        return {
            "attack_strength": attack_strength,
            "defense_strength": defense_strength,
            "success_level": success_level,
            "attacker_losses": attacker_losses,
            "defender_losses": defender_losses,
            "infrastructure_destroyed": infra_destroyed if airstrike_option == AirstrikeOption.DESTROY_INFRA else 0,
            "advantage_granted": advantage_granted
        }
    
    def check_commander_death(self, commander_id: str, unit_count: int, attacked_again: bool) -> bool:
        """
        Check if a commander should be killed in combat.
        
        Commander is killed if:
        - Unit count reaches 0 AND
        - Nation receives another attack of that type
        
        Args:
            commander_id: ID of the commander to check
            unit_count: Current count of units of the commander's type
            attacked_again: Whether the nation was attacked again with this unit type
        
        Returns:
            True if commander should be killed, False otherwise
        """
        if unit_count <= 0 and attacked_again:
            return True
        return False
    
    def process_commander_death(self, nation_data: dict, attack_result: dict, attack_type: AttackType) -> Optional[str]:
        """
        Process commander death after an attack.
        
        Args:
            nation_data: Dictionary containing nation data with commanders
            attack_result: Result of the attack containing unit losses
            attack_type: Type of attack that occurred
        
        Returns:
            ID of killed commander if any, None otherwise
        """
        if "commanders" not in nation_data or not nation_data["commanders"]:
            return None
        
        killed_commander_id = None
        
        # Determine which unit type was attacked and check corresponding commander
        if attack_type == AttackType.GROUND_ASSAULT:
            # Check soldier/tank commanders
            for commander_id, commander in nation_data["commanders"].items():
                if commander.commander_type in ["Soldier Commander", "Tank Commander"]:
                    # Check if units of this type were destroyed
                    unit_destroyed_key = None
                    if commander.commander_type == "Soldier Commander":
                        unit_destroyed_key = "soldiers_destroyed"
                    elif commander.commander_type == "Tank Commander":
                        unit_destroyed_key = "tanks_destroyed"
                    
                    if unit_destroyed_key in attack_result.get("defender_losses", {}):
                        # Check if units were destroyed
                        unit_count = nation_data.get("soldiers", 0) if commander.commander_type == "Soldier Commander" else nation_data.get("tanks", 0)
                        units_destroyed = attack_result["defender_losses"][unit_destroyed_key]
                        if units_destroyed > 0 and unit_count <= units_destroyed:
                            killed_commander_id = commander_id
                            break
        
        elif attack_type == AttackType.AIRSTRIKE:
            # Check aircraft commander
            for commander_id, commander in nation_data["commanders"].items():
                if commander.commander_type == "Aircraft Commander":
                    if "aircraft_destroyed" in attack_result.get("defender_losses", {}):
                        unit_count = nation_data.get("aircraft", 0)
                        units_destroyed = attack_result["defender_losses"]["aircraft_destroyed"]
                        if units_destroyed > 0 and unit_count <= units_destroyed:
                            killed_commander_id = commander_id
                            break
        
        elif attack_type == AttackType.NAVAL_BATTLE:
            # Check naval commander
            for commander_id, commander in nation_data["commanders"].items():
                if commander.commander_type == "Naval Commander":
                    # Check if any ships were destroyed
                    total_ships_destroyed = 0
                    for ship_type in ["destroyer_destroyed", "cruiser_destroyed", "battleship_destroyed", "carrier_destroyed", "submarine_destroyed"]:
                        total_ships_destroyed += attack_result.get("defender_losses", {}).get(ship_type, 0)
                    
                    total_ships = (nation_data.get("destroyers", 0) + nation_data.get("cruisers", 0) +
                                   nation_data.get("battleships", 0) + nation_data.get("carriers", 0) +
                                   nation_data.get("submarines", 0))
                    
                    if total_ships_destroyed > 0 and total_ships <= total_ships_destroyed:
                        killed_commander_id = commander_id
                        break
        
        return killed_commander_id
    
    def execute_spy_operation(self, attacker_nation_data: dict, defender_nation_data: dict,
                            operation_type: SpyOperationType, defender_infrastructure: int = 1000) -> dict:
        """
        Execute a spy operation against a target nation.
        
        Args:
            attacker_nation_data: Dictionary containing attacker nation data
            defender_nation_data: Dictionary containing defender nation data
            operation_type: Type of spy operation to execute
        
        Returns:
            Dictionary with operation result
        """
        attacker_tech = attacker_nation_data.get("technology", 0)
        defender_tech = defender_nation_data.get("technology", 0)
        has_counter_intelligence = defender_nation_data.get("has_counter_intelligence", False)
        
        # Calculate success chance
        success_chance_result = self.calculate_spy_operation_success_chance(
            attacker_tech, defender_tech, operation_type, has_counter_intelligence
        )
        
        final_success_chance = success_chance_result["final_success_chance"]
        
        # Roll for success
        import random
        success = random.random() < final_success_chance
        
        result = {
            "operation_type": operation_type,
            "success": success,
            "success_chance": final_success_chance,
            "attacker_tech_bonus": success_chance_result["attacker_tech_bonus"],
            "defender_tech_penalty": success_chance_result["defender_tech_penalty"],
            "counter_intelligence_penalty": success_chance_result["counter_intelligence_penalty"]
        }
        
        if not success:
            result["message"] = "Spy operation failed"
            result["effects"] = {}
            return result
        
        # Apply operation effects based on type
        result["effects"] = {}
        
        if operation_type == SpyOperationType.GATHER_INTELLIGENCE:
            # Reveal nation information
            result["effects"] = {
                "revealed_info": [
                    "nation_id",
                    "nation_name",
                    "leader_name",
                    "total_population",
                    "technology",
                    "soldiers",
                    "tanks",
                    "aircraft"
                ]
            }
            result["message"] = "Intelligence gathered successfully"
        
        elif operation_type == SpyOperationType.ASSASSINATE_SPIES:
            # Kill enemy spies
            enemy_spies = defender_nation_data.get("spies", 0)
            spies_killed = min(enemy_spies, random.randint(1, 3))
            result["effects"] = {"spies_killed": spies_killed}
            result["message"] = f"Killed {spies_killed} enemy spies"
        
        elif operation_type == SpyOperationType.SABOTAGE_INFRASTRUCTURE:
            # Destroy infrastructure - use percentage of actual city infrastructure
            infra_destroyed = int(defender_infrastructure * random.uniform(0.05, 0.15))  # 5-15% of actual infrastructure
            result["effects"] = {"infrastructure_destroyed": infra_destroyed}
            result["message"] = f"Destroyed {infra_destroyed} infrastructure"
        
        elif operation_type in [SpyOperationType.STEAL_MONEY, SpyOperationType.STEAL_RESOURCES,
                                SpyOperationType.STEAL_TECHNOLOGY, SpyOperationType.STEAL_LAND]:
            # Steal resources
            if operation_type == SpyOperationType.STEAL_MONEY:
                money_stolen = int(defender_nation_data.get("money", 0) * random.uniform(0.05, 0.15))
                result["effects"] = {"money_stolen": money_stolen}
                result["message"] = f"Stole ${money_stolen}"
            elif operation_type == SpyOperationType.STEAL_TECHNOLOGY:
                tech_stolen = int(defender_nation_data.get("technology", 0) * random.uniform(0.01, 0.05))
                result["effects"] = {"technology_stolen": tech_stolen}
                result["message"] = f"Stole {tech_stolen} technology"
            elif operation_type == SpyOperationType.STEAL_LAND:
                land_stolen = int(defender_nation_data.get("land", 0) * random.uniform(0.01, 0.03))
                result["effects"] = {"land_stolen": land_stolen}
                result["message"] = f"Stole {land_stolen} land"
        
        elif operation_type == SpyOperationType.INCITE_UNREST:
            # Reduce happiness
            happiness_reduction = random.randint(5, 15)
            result["effects"] = {"happiness_reduction": happiness_reduction}
            result["message"] = f"Incited unrest, reduced happiness by {happiness_reduction}"
        
        elif operation_type == SpyOperationType.HACK_INFRASTRUCTURE:
            # Disable infrastructure temporarily
            result["effects"] = {"infrastructure_disabled_ticks": 24}  # 24 ticks
            result["message"] = "Infrastructure hacked, disabled for 24 ticks"
        
        elif operation_type == SpyOperationType.ASSASSINATE_LEADER:
            # Kill leader (very low success chance)
            result["effects"] = {"leader_assassinated": True}
            result["message"] = "Leader assassinated successfully"
        
        elif operation_type == SpyOperationType.DRONE_RECON:
            # Reveal military positions
            result["effects"] = {
                "revealed_military": [
                    "soldiers",
                    "tanks",
                    "aircraft",
                    "destroyers",
                    "cruisers",
                    "battleships",
                    "carriers"
                ]
            }
            result["message"] = "Drone reconnaissance successful"
        
        return result
    
    def apply_nuclear_consequences(self, attacker_nation_data: dict, nukes_used: int) -> dict:
        """
        Apply diplomatic consequences for nuclear weapon usage.
        
        Each nuke used increases diplomatic penalty by 10 points (max 100).
        World condemnation lasts for 168 ticks (7 days) per nuke used.
        
        Args:
            attacker_nation_data: Dictionary containing attacker nation data
            nukes_used: Number of nukes used in the strike
        
        Returns:
            Dictionary with applied consequences
        """
        # Calculate diplomatic penalty increase
        penalty_increase = nukes_used * 10  # 10 points per nuke
        current_penalty = attacker_nation_data.get("diplomatic_penalty", 0.0)
        new_penalty = min(current_penalty + penalty_increase, 100.0)  # Cap at 100
        
        # Calculate world condemnation duration
        condemnation_duration = nukes_used * 168  # 168 ticks (7 days) per nuke
        
        return {
            "diplomatic_penalty_increase": penalty_increase,
            "new_diplomatic_penalty": new_penalty,
            "world_condemnation_duration": condemnation_duration,
            "nuclear_weapons_used_total": attacker_nation_data.get("nuclear_weapons_used", 0) + nukes_used
        }
    
    def calculate_spy_operation_success_chance(self, attacker_tech: int, defender_tech: int,
                                            operation_type: SpyOperationType,
                                            has_counter_intelligence: bool = False) -> dict:
        """
        Calculate spy operation success chance with tech integration.
        
        Tech scaling:
        - Higher attacker tech increases success chance (up to +25% at 5000 tech)
        - Higher defender tech decreases success chance (up to -25% at 5000 tech)
        - Counter-intelligence improvements reduce success chance by -15%
        
        Base success chances by operation type:
        - Gather Intelligence: 60%
        - Assassinate Spies: 40%
        - Sabotage Infrastructure: 35%
        - Steal Money/Resources/Tech/Land: 30%
        - Incite Unrest: 25%
        - Hack Infrastructure: 45%
        - Assassinate Leader: 15%
        - Drone Recon: 70%
        
        Args:
            attacker_tech: Attacker's technology level
            defender_tech: Defender's technology level
            operation_type: Type of spy operation
            has_counter_intelligence: Whether defender has counter-intelligence
        
        Returns:
            Dictionary with success chance and modifiers
        """
        from . import formulas
        
        # Base success chances
        base_chances = {
            SpyOperationType.GATHER_INTELLIGENCE: 0.60,
            SpyOperationType.ASSASSINATE_SPIES: 0.40,
            SpyOperationType.SABOTAGE_INFRASTRUCTURE: 0.35,
            SpyOperationType.STEAL_MONEY: 0.30,
            SpyOperationType.STEAL_RESOURCES: 0.30,
            SpyOperationType.STEAL_TECHNOLOGY: 0.30,
            SpyOperationType.STEAL_LAND: 0.30,
            SpyOperationType.INCITE_UNREST: 0.25,
            SpyOperationType.HACK_INFRASTRUCTURE: 0.45,
            SpyOperationType.ASSASSINATE_LEADER: 0.15,
            SpyOperationType.DRONE_RECON: 0.70
        }
        
        base_chance = base_chances.get(operation_type, 0.30)
        
        # Calculate tech modifiers (using tech efficiency multiplier, capped at 25%)
        attacker_tech_bonus = min(formulas.calculate_tech_efficiency_multiplier(attacker_tech) - 1.0, 0.25)
        defender_tech_penalty = min(formulas.calculate_tech_efficiency_multiplier(defender_tech) - 1.0, 0.25)
        
        # Calculate final success chance
        final_chance = base_chance + attacker_tech_bonus - defender_tech_penalty
        
        # Apply counter-intelligence penalty
        if has_counter_intelligence:
            final_chance -= 0.15
        
        # Cap between 5% and 95%
        final_chance = max(0.05, min(final_chance, 0.95))
        
        return {
            "base_chance": base_chance,
            "attacker_tech_bonus": attacker_tech_bonus,
            "defender_tech_penalty": defender_tech_penalty,
            "counter_intelligence_penalty": -0.15 if has_counter_intelligence else 0.0,
            "final_success_chance": final_chance
        }
    
    def calculate_naval_battle(self, attacker_ships: Dict[str, int], defender_ships: Dict[str, int],
                               ship_efficiency: float, naval_attack_option: NavalAttackOption,
                               defender_aircraft: int, has_naval_advantage: bool,
                               attacker_tech: int = 0, defender_tech: int = 0,
                               attacker_commander_bonus: float = 0.0, defender_commander_bonus: float = 0.0,
                               defender_infrastructure: int = 1000) -> dict:
        """Calculate naval battle result with new 5-level success system and ship-specific roles."""
        from . import formulas

        # Extract ship counts
        attacker_destroyers = attacker_ships.get("destroyer", 0)
        attacker_cruisers = attacker_ships.get("cruiser", 0)
        attacker_battleships = attacker_ships.get("battleship", 0)
        attacker_carriers = attacker_ships.get("carrier", 0)
        attacker_submarines = attacker_ships.get("submarine", 0)

        defender_destroyers = defender_ships.get("destroyer", 0)
        defender_cruisers = defender_ships.get("cruiser", 0)
        defender_battleships = defender_ships.get("battleship", 0)
        defender_carriers = defender_ships.get("carrier", 0)
        defender_submarines = defender_ships.get("submarine", 0)

        # Use formula function with tech scaling, ship-specific roles, and commander bonus
        damage_result = formulas.calculate_naval_damage(
            attacker_destroyers, attacker_cruisers, attacker_battleships, attacker_carriers, attacker_submarines,
            defender_destroyers, defender_cruisers, defender_battleships, defender_carriers,
            ship_efficiency, attacker_tech, attacker_commander_bonus
        )

        # Calculate attack and defense strength for success level
        attack_strength = ((attacker_destroyers * 250) + (attacker_cruisers * 500) + 
                          (attacker_battleships * 1000) + (attacker_carriers * 1500) + 
                          (attacker_submarines * 750)) * ship_efficiency * formulas.calculate_tech_efficiency_multiplier(attacker_tech)
        defense_strength = ((defender_destroyers * 250) + (defender_cruisers * 500) + 
                          (defender_battleships * 1000) + (defender_carriers * 1500)) * ship_efficiency * formulas.calculate_tech_efficiency_multiplier(defender_tech)

        # Calculate success level
        success_level = self.calculate_success_level(attack_strength, defense_strength)

        # Get the war score change from the damage result
        war_score_change = damage_result.get("war_score_change", 0.0)

        # Calculate attacker ship losses based on success level
        if success_level == SuccessLevel.COMPLETE_SUCCESS:
            total_attacker_destroyer_losses = int(attacker_destroyers * 0.03)
            total_attacker_cruiser_losses = int(attacker_cruisers * 0.03)
            total_attacker_battleship_losses = int(attacker_battleships * 0.03)
            total_attacker_carrier_losses = int(attacker_carriers * 0.03)
            total_attacker_submarine_losses = int(attacker_submarines * 0.03)
        elif success_level == SuccessLevel.SUCCESS:
            total_attacker_destroyer_losses = int(attacker_destroyers * 0.05)
            total_attacker_cruiser_losses = int(attacker_cruisers * 0.05)
            total_attacker_battleship_losses = int(attacker_battleships * 0.05)
            total_attacker_carrier_losses = int(attacker_carriers * 0.05)
            total_attacker_submarine_losses = int(attacker_submarines * 0.05)
        elif success_level == SuccessLevel.TIE:
            total_attacker_destroyer_losses = int(attacker_destroyers * 0.07)
            total_attacker_cruiser_losses = int(attacker_cruisers * 0.07)
            total_attacker_battleship_losses = int(attacker_battleships * 0.07)
            total_attacker_carrier_losses = int(attacker_carriers * 0.07)
            total_attacker_submarine_losses = int(attacker_submarines * 0.07)
        else:  # Failure or Complete Failure
            total_attacker_destroyer_losses = int(attacker_destroyers * 0.10)
            total_attacker_cruiser_losses = int(attacker_cruisers * 0.10)
            total_attacker_battleship_losses = int(attacker_battleships * 0.10)
            total_attacker_carrier_losses = int(attacker_carriers * 0.10)
            total_attacker_submarine_losses = int(attacker_submarines * 0.10)

        # Apply damaged units calculation to attacker losses
        attacker_destroyer_result = formulas.calculate_unit_losses_with_damage(total_attacker_destroyer_losses, attacker_tech)
        attacker_cruiser_result = formulas.calculate_unit_losses_with_damage(total_attacker_cruiser_losses, attacker_tech)
        attacker_battleship_result = formulas.calculate_unit_losses_with_damage(total_attacker_battleship_losses, attacker_tech)
        attacker_carrier_result = formulas.calculate_unit_losses_with_damage(total_attacker_carrier_losses, attacker_tech)
        attacker_submarine_result = formulas.calculate_unit_losses_with_damage(total_attacker_submarine_losses, attacker_tech)
        attacker_losses = {
            "destroyer_destroyed": attacker_destroyer_result["destroyed"],
            "destroyer_damaged": attacker_destroyer_result["damaged"],
            "cruiser_destroyed": attacker_cruiser_result["destroyed"],
            "cruiser_damaged": attacker_cruiser_result["damaged"],
            "battleship_destroyed": attacker_battleship_result["destroyed"],
            "battleship_damaged": attacker_battleship_result["damaged"],
            "carrier_destroyed": attacker_carrier_result["destroyed"],
            "carrier_damaged": attacker_carrier_result["damaged"],
            "submarine_destroyed": attacker_submarine_result["destroyed"],
            "submarine_damaged": attacker_submarine_result["damaged"]
        }

        # Calculate results based on naval attack option and success level
        advantage_granted = None
        infra_destroyed = 0
        supply_lines_cut = False

        if naval_attack_option == NavalAttackOption.TARGET_SHIPS:
            # Target Ships: destroys ships, grants Naval Advantage if Complete Success
            ship_destruction_percent = damage_result["ship_destruction_percent"]
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                total_destroyer_losses = int(defender_ships.get("destroyer", 0) * ship_destruction_percent)
                total_cruiser_losses = int(defender_ships.get("cruiser", 0) * ship_destruction_percent)
                total_battleship_losses = int(defender_ships.get("battleship", 0) * ship_destruction_percent)
                total_carrier_losses = int(defender_ships.get("carrier", 0) * ship_destruction_percent)
                total_submarine_losses = int(defender_ships.get("submarine", 0) * ship_destruction_percent)
                advantage_granted = AdvantageType.NAVAL_ADVANTAGE
                infra_destroyed = int(defender_infrastructure * damage_result["infrastructure_destruction_percent"])
            elif success_level == SuccessLevel.SUCCESS:
                total_destroyer_losses = int(defender_ships.get("destroyer", 0) * (ship_destruction_percent * 0.8))
                total_cruiser_losses = int(defender_ships.get("cruiser", 0) * (ship_destruction_percent * 0.8))
                total_battleship_losses = int(defender_ships.get("battleship", 0) * (ship_destruction_percent * 0.8))
                total_carrier_losses = int(defender_ships.get("carrier", 0) * (ship_destruction_percent * 0.8))
                total_submarine_losses = int(defender_ships.get("submarine", 0) * (ship_destruction_percent * 0.8))
                infra_destroyed = int(defender_infrastructure * (damage_result["infrastructure_destruction_percent"] * 0.8))
            elif success_level == SuccessLevel.TIE:
                total_destroyer_losses = int(defender_ships.get("destroyer", 0) * (ship_destruction_percent * 0.5))
                total_cruiser_losses = int(defender_ships.get("cruiser", 0) * (ship_destruction_percent * 0.5))
                total_battleship_losses = int(defender_ships.get("battleship", 0) * (ship_destruction_percent * 0.5))
                total_carrier_losses = int(defender_ships.get("carrier", 0) * (ship_destruction_percent * 0.5))
                total_submarine_losses = int(defender_ships.get("submarine", 0) * (ship_destruction_percent * 0.5))
                infra_destroyed = int(defender_infrastructure * (damage_result["infrastructure_destruction_percent"] * 0.5))
            else:  # Failure or Complete Failure
                total_destroyer_losses = 0
                total_cruiser_losses = 0
                total_battleship_losses = 0
                total_carrier_losses = 0
                total_submarine_losses = 0
                infra_destroyed = 0

            # Apply damaged units calculation
            destroyer_result = formulas.calculate_unit_losses_with_damage(total_destroyer_losses, defender_tech)
            cruiser_result = formulas.calculate_unit_losses_with_damage(total_cruiser_losses, defender_tech)
            battleship_result = formulas.calculate_unit_losses_with_damage(total_battleship_losses, defender_tech)
            carrier_result = formulas.calculate_unit_losses_with_damage(total_carrier_losses, defender_tech)
            submarine_result = formulas.calculate_unit_losses_with_damage(total_submarine_losses, defender_tech)
            defender_losses = {
                "destroyer_destroyed": destroyer_result["destroyed"],
                "destroyer_damaged": destroyer_result["damaged"],
                "cruiser_destroyed": cruiser_result["destroyed"],
                "cruiser_damaged": cruiser_result["damaged"],
                "battleship_destroyed": battleship_result["destroyed"],
                "battleship_damaged": battleship_result["damaged"],
                "carrier_destroyed": carrier_result["destroyed"],
                "carrier_damaged": carrier_result["damaged"],
                "submarine_destroyed": submarine_result["destroyed"],
                "submarine_damaged": submarine_result["damaged"]
            }

        elif naval_attack_option == NavalAttackOption.TARGET_AIRCRAFT:
            # Target Aircraft: destroys aircraft (cruisers excel at this)
            aircraft_destroyed_percent = damage_result["cruiser_anti_air_bonus"] + 0.10  # Base 10% + cruiser bonus
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                total_aircraft_destroyed = int(defender_aircraft * aircraft_destroyed_percent)
            elif success_level == SuccessLevel.SUCCESS:
                total_aircraft_destroyed = int(defender_aircraft * (aircraft_destroyed_percent * 0.8))
            elif success_level == SuccessLevel.TIE:
                total_aircraft_destroyed = int(defender_aircraft * (aircraft_destroyed_percent * 0.5))
            else:  # Failure or Complete Failure
                total_aircraft_destroyed = 0

            # Apply damaged units calculation
            aircraft_result = formulas.calculate_unit_losses_with_damage(total_aircraft_destroyed, defender_tech)
            defender_losses = {
                "aircraft_destroyed": aircraft_result["destroyed"],
                "aircraft_damaged": aircraft_result["damaged"]
            }

        elif naval_attack_option == NavalAttackOption.BLOCKADE:
            # Blockade: blockades nation if successful, kills fewer ships
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                total_destroyer_losses = int(defender_ships.get("destroyer", 0) * 0.05)
                total_cruiser_losses = int(defender_ships.get("cruiser", 0) * 0.05)
                total_battleship_losses = int(defender_ships.get("battleship", 0) * 0.05)
                total_carrier_losses = int(defender_ships.get("carrier", 0) * 0.05)
                advantage_granted = AdvantageType.BLOCKADE
                supply_lines_cut = True  # Blockade cuts supply lines
            elif success_level == SuccessLevel.SUCCESS:
                total_destroyer_losses = int(defender_ships.get("destroyer", 0) * 0.03)
                total_cruiser_losses = int(defender_ships.get("cruiser", 0) * 0.03)
                total_battleship_losses = int(defender_ships.get("battleship", 0) * 0.03)
                total_carrier_losses = int(defender_ships.get("carrier", 0) * 0.03)
                advantage_granted = AdvantageType.BLOCKADE
                supply_lines_cut = True  # Blockade cuts supply lines
            else:  # Failure or Complete Failure
                total_destroyer_losses = int(defender_ships.get("destroyer", 0) * 0.02)
                total_cruiser_losses = int(defender_ships.get("cruiser", 0) * 0.02)
                total_battleship_losses = int(defender_ships.get("battleship", 0) * 0.02)
                total_carrier_losses = int(defender_ships.get("carrier", 0) * 0.02)

            # Apply damaged units calculation
            destroyer_result = formulas.calculate_unit_losses_with_damage(total_destroyer_losses, defender_tech)
            cruiser_result = formulas.calculate_unit_losses_with_damage(total_cruiser_losses, defender_tech)
            battleship_result = formulas.calculate_unit_losses_with_damage(total_battleship_losses, defender_tech)
            carrier_result = formulas.calculate_unit_losses_with_damage(total_carrier_losses, defender_tech)
            defender_losses = {
                "destroyer_destroyed": destroyer_result["destroyed"],
                "destroyer_damaged": destroyer_result["damaged"],
                "cruiser_destroyed": cruiser_result["destroyed"],
                "cruiser_damaged": cruiser_result["damaged"],
                "battleship_destroyed": battleship_result["destroyed"],
                "battleship_damaged": battleship_result["damaged"],
                "carrier_destroyed": carrier_result["destroyed"],
                "carrier_damaged": carrier_result["damaged"]
            }

        elif naval_attack_option == NavalAttackOption.SUPPORT_AIRCRAFT:
            # Support Aircraft: boosts aircraft efficiency ONLY if Complete Success, destroys NO enemy ships
            if success_level == SuccessLevel.COMPLETE_SUCCESS:
                defender_losses = {}
                advantage_granted = "AIRCRAFT_EFFICIENCY_BOOST"  # Special marker for aircraft efficiency boost
            else:
                defender_losses = {}
                advantage_granted = None

        return {
            "attack_strength": attack_strength,
            "defense_strength": defense_strength,
            "success_level": success_level,
            "attacker_losses": attacker_losses,
            "defender_losses": defender_losses,
            "infrastructure_destroyed": infra_destroyed,
            "advantage_granted": advantage_granted,
            "war_score_change": war_score_change,
            "supply_lines_cut": supply_lines_cut
        }
    
    def calculate_missile_strike(self, missile_count: int, target_city_id: str,
                                target_city_infra: int, target_city_soldiers: int,
                                target_city_tanks: int, target_city_aircraft: int,
                                target_city_ships: int, target_city_land: int,
                                attacker_nation_data: dict, defender_nation_data: dict) -> dict:
        """Calculate missile strike result with Hit/Miss system and project/wonder effects."""
        
        # Check if attacker has WMD ban
        attacker_nation = attacker_nation_data.get('nation')
        if attacker_nation and getattr(attacker_nation, 'wmd_banned', False):
            return {
                "hit": False,
                "hits": 0,
                "misses": missile_count,
                "blocked_by_project": False,
                "blocked_by_wonder": False,
                "infrastructure_destroyed": 0,
                "units_destroyed": {"soldiers": 0, "tanks": 0, "aircraft": 0, "ships": 0},
                "land_destroyed": 0,
                "missiles_consumed": 0,
                "error": "WMD ban active - missile strikes prohibited"
            }

        from .projects import ProjectType, ProjectSystem
        from .wonders import WonderType, WonderSystem

        project_system = ProjectSystem()
        wonder_system = WonderSystem()

        # Get defender's projects and wonders
        defender_projects = defender_nation_data.get('completed_projects', set())
        defender_wonders = defender_nation_data.get('owned_wonders', set())

        # Get attacker's projects and wonders for damage boost
        attacker_projects = attacker_nation_data.get('completed_projects', set())
        attacker_wonders = attacker_nation_data.get('owned_wonders', set())

        # Base intercept chance
        intercept_chance = 0.75

        # Project defense: MISSILE_INTERCEPTOR_SYSTEM (medium cost, small chance to block)
        if ProjectType.MISSILE_INTERCEPTOR_SYSTEM in defender_projects:
            project = project_system.get_project(ProjectType.MISSILE_INTERCEPTOR_SYSTEM)
            intercept_chance += project.missile_intercept_chance_bonus

        # Wonder defense: ADVANCED_MISSILE_SHIELD (high cost, big chance to block)
        if WonderType.ADVANCED_MISSILE_SHIELD in defender_wonders:
            wonder = wonder_system.get_wonder(WonderType.ADVANCED_MISSILE_SHIELD)
            intercept_chance += wonder.missile_intercept_chance_bonus

        intercept_chance = min(1.0, intercept_chance)

        # Damage modifier from attacker's projects/wonders
        damage_modifier = 1.0

        # Project damage boost: ADVANCED_WARHEAD_DESIGN
        if ProjectType.ADVANCED_WARHEAD_DESIGN in attacker_projects:
            project = project_system.get_project(ProjectType.ADVANCED_WARHEAD_DESIGN)
            damage_modifier += project.missile_damage_boost_bonus

        # Wonder damage boost: NUCLEAR_DETERRENT_ARRAY
        if WonderType.NUCLEAR_DETERRENT_ARRAY in attacker_wonders:
            wonder = wonder_system.get_wonder(WonderType.NUCLEAR_DETERRENT_ARRAY)
            damage_modifier += wonder.missile_damage_bonus

        # Damage reduction from defender's projects/wonders
        if ProjectType.MISSILE_INTERCEPTOR_SYSTEM in defender_projects:
            project = project_system.get_project(ProjectType.MISSILE_INTERCEPTOR_SYSTEM)
            damage_modifier -= project.missile_damage_reduction_bonus

        if WonderType.ADVANCED_MISSILE_SHIELD in defender_wonders:
            wonder = wonder_system.get_wonder(WonderType.ADVANCED_MISSILE_SHIELD)
            damage_modifier += wonder.missile_damage_bonus  # This is negative for damage reduction

        damage_modifier = max(0.0, damage_modifier)  # Ensure non-negative

        # Calculate hit/miss for each missile
        hits = 0
        misses = 0
        blocked_by_project = False
        blocked_by_wonder = False

        import random
        for _ in range(missile_count):
            roll = random.random()
            if roll < intercept_chance:
                misses += 1
                # Check if blocked by project/wonder
                if ProjectType.MISSILE_INTERCEPTOR_SYSTEM in defender_projects and random.random() < 0.3:
                    blocked_by_project = True
                elif WonderType.ADVANCED_MISSILE_SHIELD in defender_wonders and random.random() < 0.6:
                    blocked_by_wonder = True
            else:
                hits += 1

        # Calculate destruction based on hits (25% infra, 2% units, 10% land per missile)
        infra_destroyed = int(target_city_infra * 0.25 * hits * damage_modifier)
        soldiers_destroyed = int(target_city_soldiers * 0.02 * hits * damage_modifier)
        tanks_destroyed = int(target_city_tanks * 0.02 * hits * damage_modifier)
        aircraft_destroyed = int(target_city_aircraft * 0.02 * hits * damage_modifier)
        ships_destroyed = int(target_city_ships * 0.02 * hits * damage_modifier)
        land_destroyed = int(target_city_land * 0.10 * hits * damage_modifier)

        return {
            "hit": hits > 0,
            "hits": hits,
            "misses": misses,
            "blocked_by_project": blocked_by_project,
            "blocked_by_wonder": blocked_by_wonder,
            "damage_modifier": damage_modifier,
            "infrastructure_destroyed": infra_destroyed,
            "units_destroyed": {
                "soldiers": soldiers_destroyed,
                "tanks": tanks_destroyed,
                "aircraft": aircraft_destroyed,
                "ships": ships_destroyed
            },
            "land_destroyed": land_destroyed,
            "missiles_consumed": missile_count
        }

    def calculate_nuclear_strike(self, nuke_count: int, target_city_id: str,
                               target_city_infra: int, target_city_population: int,
                               target_city_soldiers: int, target_city_tanks: int,
                               target_city_aircraft: int, target_city_ships: int,
                               target_city_land: int,
                               attacker_nation_data: dict, defender_nation_data: dict) -> dict:
        """Calculate nuclear strike result with Hit/Miss system and project/wonder effects."""
        
        # Check if attacker has WMD ban
        attacker_nation = attacker_nation_data.get('nation')
        if attacker_nation and getattr(attacker_nation, 'wmd_banned', False):
            return {
                "hit": False,
                "hits": 0,
                "misses": nuke_count,
                "blocked_by_project": False,
                "blocked_by_wonder": False,
                "infrastructure_destroyed": 0,
                "population_killed": 0,
                "units_destroyed": {"soldiers": 0, "tanks": 0, "aircraft": 0, "ships": 0},
                "land_destroyed": 0,
                "nukes_consumed": 0,
                "error": "WMD ban active - nuclear strikes prohibited"
            }

        from .projects import ProjectType, ProjectSystem
        from .wonders import WonderType, WonderSystem

        project_system = ProjectSystem()
        wonder_system = WonderSystem()

        # Get defender's projects and wonders
        defender_projects = defender_nation_data.get('completed_projects', set())
        defender_wonders = defender_nation_data.get('owned_wonders', set())

        # Get attacker's projects and wonders for damage boost
        attacker_projects = attacker_nation_data.get('completed_projects', set())
        attacker_wonders = attacker_nation_data.get('owned_wonders', set())

        # Base intercept chance
        intercept_chance = 0.50

        # Project defense: MISSILE_INTERCEPTOR_SYSTEM (medium cost, small chance to block)
        if ProjectType.MISSILE_INTERCEPTOR_SYSTEM in defender_projects:
            project = project_system.get_project(ProjectType.MISSILE_INTERCEPTOR_SYSTEM)
            intercept_chance += project.nuke_intercept_chance_bonus

        # Wonder defense: ADVANCED_MISSILE_SHIELD (high cost, big chance to block)
        if WonderType.ADVANCED_MISSILE_SHIELD in defender_wonders:
            wonder = wonder_system.get_wonder(WonderType.ADVANCED_MISSILE_SHIELD)
            intercept_chance += wonder.nuke_intercept_chance_bonus

        intercept_chance = min(1.0, intercept_chance)

        # Damage modifier from attacker's projects/wonders
        damage_modifier = 1.0

        # Project damage boost: ADVANCED_WARHEAD_DESIGN
        if ProjectType.ADVANCED_WARHEAD_DESIGN in attacker_projects:
            project = project_system.get_project(ProjectType.ADVANCED_WARHEAD_DESIGN)
            damage_modifier += project.nuke_damage_boost_bonus

        # Wonder damage boost: NUCLEAR_DETERRENT_ARRAY
        if WonderType.NUCLEAR_DETERRENT_ARRAY in attacker_wonders:
            wonder = wonder_system.get_wonder(WonderType.NUCLEAR_DETERRENT_ARRAY)
            damage_modifier += wonder.nuke_damage_bonus

        # Damage reduction from defender's projects/wonders
        if ProjectType.MISSILE_INTERCEPTOR_SYSTEM in defender_projects:
            project = project_system.get_project(ProjectType.MISSILE_INTERCEPTOR_SYSTEM)
            damage_modifier -= project.nuke_damage_reduction_bonus

        if WonderType.ADVANCED_MISSILE_SHIELD in defender_wonders:
            wonder = wonder_system.get_wonder(WonderType.ADVANCED_MISSILE_SHIELD)
            damage_modifier += wonder.nuke_damage_bonus  # This is negative for damage reduction

        damage_modifier = max(0.0, damage_modifier)  # Ensure non-negative

        # Calculate hit/miss for each nuke
        hits = 0
        misses = 0
        blocked_by_project = False
        blocked_by_wonder = False

        import random
        for _ in range(nuke_count):
            roll = random.random()
            if roll < intercept_chance:
                misses += 1
                # Check if blocked by project/wonder
                if ProjectType.MISSILE_INTERCEPTOR_SYSTEM in defender_projects and random.random() < 0.3:
                    blocked_by_project = True
                elif WonderType.ADVANCED_MISSILE_SHIELD in defender_wonders and random.random() < 0.6:
                    blocked_by_wonder = True
            else:
                hits += 1

        # Calculate destruction based on hits (33% infra, 5% units, 16.5% land per nuke)
        infra_destroyed = int(target_city_infra * 0.33 * hits * damage_modifier)
        soldiers_destroyed = int(target_city_soldiers * 0.05 * hits * damage_modifier)
        tanks_destroyed = int(target_city_tanks * 0.05 * hits * damage_modifier)
        aircraft_destroyed = int(target_city_aircraft * 0.05 * hits * damage_modifier)
        ships_destroyed = int(target_city_ships * 0.05 * hits * damage_modifier)
        land_destroyed = int(target_city_land * 0.165 * hits * damage_modifier)

        # Population killed: 10-30% based on hits
        population_killed_percent = 0.10 + (0.20 * (hits / (nuke_count + 1)))
        population_killed = int(target_city_population * population_killed_percent * damage_modifier)
        
        # Nuclear consequences
        # Radiation damage: long-term environment penalty
        radiation_damage = -10 * hits  # -10 environment per nuke hit
        
        # Nuclear winter: global environment penalty (cumulative across all nukes)
        nuclear_winter_damage = -2 * hits  # -2 global environment per nuke hit
        
        # World condemnation: diplomatic penalty
        world_condemnation = -5 * hits  # -5 diplomatic relations per nuke hit
        
        return {
            "hit": hits > 0,
            "hits": hits,
            "misses": misses,
            "blocked_by_project": blocked_by_project,
            "blocked_by_wonder": blocked_by_wonder,
            "damage_modifier": damage_modifier,
            "infrastructure_destroyed": infra_destroyed,
            "units_destroyed": {
                "soldiers": soldiers_destroyed,
                "tanks": tanks_destroyed,
                "aircraft": aircraft_destroyed,
                "ships": ships_destroyed
            },
            "land_destroyed": land_destroyed,
            "population_killed": population_killed,
            "environment_damage": -5 * hits,  # Immediate environment damage
            "radiation_damage": radiation_damage,  # Long-term radiation damage
            "nuclear_winter_damage": nuclear_winter_damage,  # Global nuclear winter effect
            "world_condemnation": world_condemnation,  # Diplomatic penalty
            "happiness_damage": -15 * hits,
            "nukes_consumed": nuke_count
        }
    
    # ==================== ATTACK EXECUTION LAYER ====================
    
    def execute_ground_attack_on_nation(self, attacker_nation: Nation, defender_nation: Nation,
                                       war: War, attack_option: GroundAttackOption = GroundAttackOption.TARGET_GROUND,
                                       target_city_id: Optional[str] = None) -> WarAttack:
        """
        Execute a ground attack and apply results to nations.
        
        Args:
            attacker_nation: The attacking nation
            defender_nation: The defending nation
            war: The war context
            attack_option: Type of ground attack
            target_city_id: Target city ID (if None, random city)
        
        Returns:
            WarAttack object with attack results
        """
        from .military import MilitarySystem
        from .city import CitySystem
        
        military_system = MilitarySystem()
        city_system = CitySystem()
        
        # Get attacker nation data
        attacker_data = {
            "soldiers": attacker_nation.soldiers,
            "tanks": attacker_nation.tanks,
            "technology": attacker_nation.technology,
            "supply_lines_intact": attacker_nation.supply_lines_intact,
            "commanders": attacker_nation.commanders
        }
        
        # Get defender nation data
        defender_data = {
            "soldiers": defender_nation.soldiers,
            "tanks": defender_nation.tanks,
            "aircraft": defender_nation.aircraft,
            "technology": defender_nation.technology,
            "supply_lines_intact": defender_nation.supply_lines_intact,
            "commanders": defender_nation.commanders,
            "cities": city_system.get_nation_cities(defender_nation.nation_id)
        }
        
        # Get target city infrastructure
        target_infra = self.get_city_infrastructure_for_attack(defender_data, target_city_id)
        
        # Get commander bonuses
        attacker_commander_bonus = military_system.get_commander_bonus_by_attack_type(
            attacker_data["commanders"], "ground"
        )
        defender_commander_bonus = military_system.get_commander_bonus_by_attack_type(
            defender_data["commanders"], "ground"
        )
        
        # Get efficiencies
        attacker_efficiency = military_system.calculate_nation_military_efficiency(attacker_nation)
        defender_efficiency = military_system.calculate_nation_military_efficiency(defender_nation)
        
        # Calculate attack
        attack_result = self.calculate_ground_attack(
            attacker_soldiers=attacker_data["soldiers"],
            attacker_tanks=attacker_data["tanks"],
            defender_soldiers=defender_data["soldiers"],
            defender_tanks=defender_data["tanks"],
            soldier_efficiency=attacker_efficiency.get("soldier_efficiency", 1.0),
            tank_efficiency=attacker_efficiency.get("tank_efficiency", 1.0),
            city_resistance=defender_nation.city_resistance,
            attacker_tech=attacker_data["technology"],
            defender_tech=defender_data["technology"],
            attacker_supply_intact=attacker_data["supply_lines_intact"],
            defender_supply_intact=defender_data["supply_lines_intact"],
            attacker_commander_bonus=attacker_commander_bonus,
            defender_commander_bonus=defender_commander_bonus,
            attack_option=attack_option,
            defender_aircraft=defender_data["aircraft"],
            defender_infrastructure=target_infra
        )
        
        # Apply results to nations
        # Apply defender losses
        defender_losses = attack_result.get("defender_losses", {})
        if "soldiers_destroyed" in defender_losses:
            defender_nation.soldiers = max(0, defender_nation.soldiers - defender_losses["soldiers_destroyed"])
        if "tanks_destroyed" in defender_losses:
            defender_nation.tanks = max(0, defender_nation.tanks - defender_losses["tanks_destroyed"])
        if "aircraft_destroyed" in defender_losses:
            defender_nation.aircraft = max(0, defender_nation.aircraft - defender_losses["aircraft_destroyed"])
        
        # Apply attacker losses
        attacker_losses = attack_result.get("attacker_losses", {})
        if "soldiers_destroyed" in attacker_losses:
            attacker_nation.soldiers = max(0, attacker_nation.soldiers - attacker_losses["soldiers_destroyed"])
        if "tanks_destroyed" in attacker_losses:
            attacker_nation.tanks = max(0, attacker_nation.tanks - attacker_losses["tanks_destroyed"])
        
        # Apply infrastructure destruction to target city
        infra_destroyed = attack_result.get("infrastructure_destroyed", 0)
        if infra_destroyed > 0 and target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
            target_city.infrastructure = max(0, target_city.infrastructure - infra_destroyed)
            target_city.update_improvement_slots()
        
        # Apply loot to attacker
        loot_percent = attack_result.get("loot_percent", 0.0)
        if loot_percent > 0:
            loot_amount = defender_nation.cash * loot_percent
            attacker_nation.cash += loot_amount
            defender_nation.cash -= loot_amount
        
        # Apply supply line cutting
        if attack_result.get("supply_lines_cut", False):
            defender_nation.supply_lines_intact = False
            defender_nation.supply_lines_end_tick = war.current_turn + 12  # 12 turns
        
        # Update war score
        success_level = attack_result.get("success_level", "Tie")
        war_score_change = self.get_war_score_change(AttackType.GROUND_ASSAULT, success_level)
        war.update_war_score(war_score_change, -war_score_change)
        
        # Create WarAttack record
        war_attack = WarAttack(
            war_id=war.war_id,
            attacker_nation_id=attacker_nation.nation_id,
            defender_nation_id=defender_nation.nation_id,
            attack_type=AttackType.GROUND_ASSAULT,
            ground_attack_option=attack_option,
            soldiers_committed=attacker_data["soldiers"],
            tanks_committed=attacker_data["tanks"],
            infrastructure_destroyed=attack_result.get("infrastructure_destroyed", 0),
            success_level=attack_result.get("success_level", "Tie")
        )
        
        return war_attack
    
    def execute_airstrike_on_nation(self, attacker_nation: Nation, defender_nation: Nation,
                                   war: War, airstrike_option: AirstrikeOption,
                                   target_city_id: Optional[str] = None,
                                   aircraft_type_preference: str = "auto") -> WarAttack:
        """
        Execute an airstrike and apply results to nations.
        
        Args:
            attacker_nation: The attacking nation
            defender_nation: The defending nation
            war: The war context
            airstrike_option: Type of airstrike
            target_city_id: Target city ID (if None, random city)
            aircraft_type_preference: Aircraft type preference ("auto", "fighter", "bomber")
        
        Returns:
            WarAttack object with attack results
        """
        from .military import MilitarySystem
        from .city import CitySystem
        
        military_system = MilitarySystem()
        city_system = CitySystem()
        
        # Determine aircraft split based on preference
        if aircraft_type_preference == "fighter":
            fighters = attacker_nation.aircraft
            bombers = 0
        elif aircraft_type_preference == "bomber":
            fighters = 0
            bombers = attacker_nation.aircraft
        else:  # auto
            fighters = attacker_nation.aircraft // 2
            bombers = attacker_nation.aircraft // 2
        
        # Get attacker nation data
        attacker_data = {
            "aircraft": attacker_nation.aircraft,
            "fighters": fighters,
            "bombers": bombers,
            "technology": attacker_nation.technology,
            "commanders": attacker_nation.commanders
        }
        
        # Get defender nation data
        defender_data = {
            "aircraft": defender_nation.aircraft,
            "soldiers": defender_nation.soldiers,
            "tanks": defender_nation.tanks,
            "ships": {
                "destroyer": defender_nation.destroyers,
                "cruiser": defender_nation.cruisers,
                "battleship": defender_nation.battleships,
                "carrier": defender_nation.carriers,
                "submarine": defender_nation.submarines
            },
            "technology": defender_nation.technology,
            "commanders": defender_nation.commanders,
            "cities": city_system.get_nation_cities(defender_nation.nation_id)
        }
        
        # Get target city infrastructure
        target_infra = self.get_city_infrastructure_for_attack(defender_data, target_city_id)
        
        # Get commander bonuses
        attacker_commander_bonus = military_system.get_commander_bonus_by_attack_type(
            attacker_data["commanders"], "airstrike"
        )
        defender_commander_bonus = military_system.get_commander_bonus_by_attack_type(
            defender_data["commanders"], "airstrike"
        )
        
        # Check for advantages
        has_air_advantage = AdvantageType.AIR_ADVANTAGE in war.attacker_advantages
        has_air_defense = AdvantageType.AIR_ADVANTAGE in war.defender_advantages
        
        # Calculate airstrike
        attack_result = self.calculate_airstrike(
            attacker_aircraft=attacker_data["aircraft"],
            airstrike_option=airstrike_option,
            defender_aircraft=defender_data["aircraft"],
            defender_soldiers=defender_data["soldiers"],
            defender_tanks=defender_data["tanks"],
            defender_ships=defender_data["ships"],
            has_air_defense=has_air_defense,
            has_air_advantage=has_air_advantage,
            attacker_fighters=attacker_data["fighters"],
            attacker_bombers=attacker_data["bombers"],
            aircraft_type_preference=aircraft_type_preference,
            attacker_tech=attacker_data["technology"],
            defender_tech=defender_data["technology"],
            attacker_commander_bonus=attacker_commander_bonus,
            defender_commander_bonus=defender_commander_bonus,
            defender_infrastructure=target_infra
        )
        
        # Apply results to nations
        # Apply defender losses
        defender_losses = attack_result.get("defender_losses", {})
        if "aircraft_destroyed" in defender_losses:
            defender_nation.aircraft = max(0, defender_nation.aircraft - defender_losses["aircraft_destroyed"])
        if "soldiers_destroyed" in defender_losses:
            defender_nation.soldiers = max(0, defender_nation.soldiers - defender_losses["soldiers_destroyed"])
        if "tanks_destroyed" in defender_losses:
            defender_nation.tanks = max(0, defender_nation.tanks - defender_losses["tanks_destroyed"])
        if "destroyer_destroyed" in defender_losses:
            defender_nation.destroyers = max(0, defender_nation.destroyers - defender_losses["destroyer_destroyed"])
        if "cruiser_destroyed" in defender_losses:
            defender_nation.cruisers = max(0, defender_nation.cruisers - defender_losses["cruiser_destroyed"])
        if "battleship_destroyed" in defender_losses:
            defender_nation.battleships = max(0, defender_nation.battleships - defender_losses["battleship_destroyed"])
        if "carrier_destroyed" in defender_losses:
            defender_nation.carriers = max(0, defender_nation.carriers - defender_losses["carrier_destroyed"])
        
        # Apply attacker losses
        attacker_losses = attack_result.get("attacker_losses", {})
        if "aircraft_destroyed" in attacker_losses:
            attacker_nation.aircraft = max(0, attacker_nation.aircraft - attacker_losses["aircraft_destroyed"])
        
        # Apply infrastructure destruction to target city
        infra_destroyed = attack_result.get("infrastructure_destroyed", 0)
        if infra_destroyed > 0 and target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
            target_city.infrastructure = max(0, target_city.infrastructure - infra_destroyed)
            target_city.update_improvement_slots()
        
        # Apply advantage if granted
        advantage_granted = attack_result.get("advantage_granted")
        if advantage_granted == AdvantageType.AIR_ADVANTAGE:
            war.add_advantage(attacker_nation.nation_id, AdvantageType.AIR_ADVANTAGE)
            war.remove_advantage_from_opponent(AttackType.AIRSTRIKE, defender_nation.nation_id)
        
        # Update war score
        success_level = attack_result.get("success_level", "Tie")
        war_score_change = self.get_war_score_change(AttackType.AIRSTRIKE, success_level)
        war.update_war_score(war_score_change, -war_score_change)
        
        # Create WarAttack record
        war_attack = WarAttack(
            war_id=war.war_id,
            attacker_nation_id=attacker_nation.nation_id,
            defender_nation_id=defender_nation.nation_id,
            attack_type=AttackType.AIRSTRIKE,
            airstrike_option=airstrike_option,
            aircraft_committed=attacker_data["aircraft"],
            infrastructure_destroyed=attack_result.get("infrastructure_destroyed", 0),
            success_level=attack_result.get("success_level", "Tie")
        )
        
        return war_attack
    
    def execute_naval_battle_on_nation(self, attacker_nation: Nation, defender_nation: Nation,
                                      war: War, naval_attack_option: NavalAttackOption,
                                      target_city_id: Optional[str] = None) -> WarAttack:
        """
        Execute a naval battle and apply results to nations.
        
        Args:
            attacker_nation: The attacking nation
            defender_nation: The defending nation
            war: The war context
            naval_attack_option: Type of naval attack
            target_city_id: Target city ID (if None, random city)
        
        Returns:
            WarAttack object with attack results
        """
        from .military import MilitarySystem
        from .city import CitySystem
        
        military_system = MilitarySystem()
        city_system = CitySystem()
        
        # Get attacker nation data
        attacker_data = {
            "ships": {
                "destroyer": attacker_nation.destroyers,
                "cruiser": attacker_nation.cruisers,
                "battleship": attacker_nation.battleships,
                "carrier": attacker_nation.carriers,
                "submarine": attacker_nation.submarines
            },
            "technology": attacker_nation.technology,
            "commanders": attacker_nation.commanders
        }
        
        # Get defender nation data
        defender_data = {
            "ships": {
                "destroyer": defender_nation.destroyers,
                "cruiser": defender_nation.cruisers,
                "battleship": defender_nation.battleships,
                "carrier": defender_nation.carriers,
                "submarine": defender_nation.submarines
            },
            "aircraft": defender_nation.aircraft,
            "technology": defender_nation.technology,
            "commanders": defender_nation.commanders,
            "cities": city_system.get_nation_cities(defender_nation.nation_id)
        }
        
        # Get target city infrastructure
        target_infra = self.get_city_infrastructure_for_attack(defender_data, target_city_id)
        
        # Get commander bonuses
        attacker_commander_bonus = military_system.get_commander_bonus_by_attack_type(
            attacker_data["commanders"], "naval"
        )
        defender_commander_bonus = military_system.get_commander_bonus_by_attack_type(
            defender_data["commanders"], "naval"
        )
        
        # Get ship efficiency
        attacker_efficiency = military_system.calculate_nation_military_efficiency(attacker_nation)
        ship_efficiency = attacker_efficiency.get("ship_efficiency", 1.0)
        
        # Check for advantages
        has_naval_advantage = AdvantageType.NAVAL_ADVANTAGE in war.attacker_advantages
        
        # Calculate naval battle
        attack_result = self.calculate_naval_battle(
            attacker_ships=attacker_data["ships"],
            defender_ships=defender_data["ships"],
            ship_efficiency=ship_efficiency,
            naval_attack_option=naval_attack_option,
            defender_aircraft=defender_data["aircraft"],
            has_naval_advantage=has_naval_advantage,
            attacker_tech=attacker_data["technology"],
            defender_tech=defender_data["technology"],
            attacker_commander_bonus=attacker_commander_bonus,
            defender_commander_bonus=defender_commander_bonus,
            defender_infrastructure=target_infra
        )
        
        # Apply results to nations
        # Apply defender ship losses
        defender_losses = attack_result.get("defender_losses", {})
        if "destroyer_destroyed" in defender_losses:
            defender_nation.destroyers = max(0, defender_nation.destroyers - defender_losses["destroyer_destroyed"])
        if "cruiser_destroyed" in defender_losses:
            defender_nation.cruisers = max(0, defender_nation.cruisers - defender_losses["cruiser_destroyed"])
        if "battleship_destroyed" in defender_losses:
            defender_nation.battleships = max(0, defender_nation.battleships - defender_losses["battleship_destroyed"])
        if "carrier_destroyed" in defender_losses:
            defender_nation.carriers = max(0, defender_nation.carriers - defender_losses["carrier_destroyed"])
        if "submarine_destroyed" in defender_losses:
            defender_nation.submarines = max(0, defender_nation.submarines - defender_losses["submarine_destroyed"])
        
        # Apply attacker ship losses
        attacker_losses = attack_result.get("attacker_losses", {})
        if "destroyer_destroyed" in attacker_losses:
            attacker_nation.destroyers = max(0, attacker_nation.destroyers - attacker_losses["destroyer_destroyed"])
        if "cruiser_destroyed" in attacker_losses:
            attacker_nation.cruisers = max(0, attacker_nation.cruisers - attacker_losses["cruiser_destroyed"])
        if "battleship_destroyed" in attacker_losses:
            attacker_nation.battleships = max(0, attacker_nation.battleships - attacker_losses["battleship_destroyed"])
        if "carrier_destroyed" in attacker_losses:
            attacker_nation.carriers = max(0, attacker_nation.carriers - attacker_losses["carrier_destroyed"])
        if "submarine_destroyed" in attacker_losses:
            attacker_nation.submarines = max(0, attacker_nation.submarines - attacker_losses["submarine_destroyed"])
        
        # Apply infrastructure destruction to target city
        infra_destroyed = attack_result.get("infrastructure_destroyed", 0)
        if infra_destroyed > 0 and target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
            target_city.infrastructure = max(0, target_city.infrastructure - infra_destroyed)
            target_city.update_improvement_slots()
        
        # Apply advantage if granted
        advantage_granted = attack_result.get("advantage_granted")
        if advantage_granted == AdvantageType.NAVAL_ADVANTAGE:
            war.add_advantage(attacker_nation.nation_id, AdvantageType.NAVAL_ADVANTAGE)
            war.remove_advantage_from_opponent(AttackType.NAVAL_BATTLE, defender_nation.nation_id)
        
        # Apply blockade if granted
        if attack_result.get("blockade_granted", False):
            war.add_advantage(attacker_nation.nation_id, AdvantageType.BLOCKADE)
        
        # Update war score
        success_level = attack_result.get("success_level", "Tie")
        war_score_change = self.get_war_score_change(AttackType.NAVAL_BATTLE, success_level)
        war.update_war_score(war_score_change, -war_score_change)
        
        # Create WarAttack record
        war_attack = WarAttack(
            war_id=war.war_id,
            attacker_nation_id=attacker_nation.nation_id,
            defender_nation_id=defender_nation.nation_id,
            attack_type=AttackType.NAVAL_BATTLE,
            naval_attack_option=naval_attack_option,
            ships_committed=attacker_data["ships"],
            infrastructure_destroyed=attack_result.get("infrastructure_destroyed", 0),
            success_level=attack_result.get("success_level", "Tie")
        )
        
        return war_attack
    
    def execute_missile_strike_on_nation(self, attacker_nation: Nation, defender_nation: Nation,
                                        war: War, missile_count: int,
                                        target_city_id: Optional[str] = None) -> WarAttack:
        """
        Execute a missile strike and apply results to nations.
        
        Args:
            attacker_nation: The attacking nation
            defender_nation: The defending nation
            war: The war context
            missile_count: Number of missiles to launch
            target_city_id: Target city ID (if None, random city)
        
        Returns:
            WarAttack object with attack results
        """
        from .military import MilitarySystem
        from .city import CitySystem
        
        military_system = MilitarySystem()
        city_system = CitySystem()
        
        # Get attacker nation data
        attacker_data = {
            "missiles": attacker_nation.missiles,
            "technology": attacker_nation.technology,
            "completed_projects": attacker_nation.completed_projects,
            "owned_wonders": attacker_nation.owned_wonders
        }
        
        # Get defender nation data
        defender_data = {
            "cities": city_system.get_nation_cities(defender_nation.nation_id),
            "technology": defender_nation.technology,
            "completed_projects": defender_nation.completed_projects,
            "owned_wonders": defender_nation.owned_wonders
        }
        
        # Get target city infrastructure
        target_infra = self.get_city_infrastructure_for_attack(defender_data, target_city_id)
        
        # Get target city data for damage calculation
        if target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
        else:
            # Use average city if no specific target
            cities = list(defender_data["cities"].values())
            target_city = cities[0] if cities else None
        
        if target_city:
            target_city_data = {
                "infrastructure": target_city.infrastructure,
                "population": target_city.population,
                "soldiers": defender_nation.soldiers,
                "tanks": defender_nation.tanks,
                "aircraft": defender_nation.aircraft,
                "ships": defender_nation.destroyers + defender_nation.cruisers + defender_nation.battleships + defender_nation.carriers,
                "land": target_city.land
            }
        else:
            target_city_data = {
                "infrastructure": 1000,
                "population": 10000,
                "soldiers": defender_nation.soldiers,
                "tanks": defender_nation.tanks,
                "aircraft": defender_nation.aircraft,
                "ships": 0,
                "land": 500
            }
        
        # Calculate missile strike
        attack_result = self.calculate_missile_strike(
            missile_count=missile_count,
            target_city_infra=target_city_data["infrastructure"],
            target_city_population=target_city_data["population"],
            target_city_soldiers=target_city_data["soldiers"],
            target_city_tanks=target_city_data["tanks"],
            target_city_aircraft=target_city_data["aircraft"],
            target_city_ships=target_city_data["ships"],
            target_city_land=target_city_data["land"],
            attacker_nation_data=attacker_data,
            defender_nation_data=defender_data
        )
        
        # Apply results to nations
        # Apply unit losses
        units_destroyed = attack_result.get("units_destroyed", {})
        defender_nation.soldiers = max(0, defender_nation.soldiers - units_destroyed.get("soldiers", 0))
        defender_nation.tanks = max(0, defender_nation.tanks - units_destroyed.get("tanks", 0))
        defender_nation.aircraft = max(0, defender_nation.aircraft - units_destroyed.get("aircraft", 0))
        
        # Apply infrastructure destruction to target city
        infra_destroyed = attack_result.get("infrastructure_destroyed", 0)
        if infra_destroyed > 0 and target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
            target_city.infrastructure = max(0, target_city.infrastructure - infra_destroyed)
            target_city.update_improvement_slots()
        
        # Apply land destruction to target city
        land_destroyed = attack_result.get("land_destroyed", 0)
        if land_destroyed > 0 and target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
            target_city.land = max(0, target_city.land - land_destroyed)
        
        # Consume missiles
        attacker_nation.missiles = max(0, attacker_nation.missiles - missile_count)
        
        # Update war score
        success_level = SuccessLevel.SUCCESS if attack_result.get("hit", False) else SuccessLevel.FAILURE
        war_score_change = self.get_war_score_change(AttackType.MISSILE_LAUNCH, success_level)
        war.update_war_score(war_score_change, -war_score_change)
        
        # Create WarAttack record
        war_attack = WarAttack(
            war_id=war.war_id,
            attacker_nation_id=attacker_nation.nation_id,
            defender_nation_id=defender_nation.nation_id,
            attack_type=AttackType.MISSILE_LAUNCH,
            missiles_committed=missile_count,
            infrastructure_destroyed=infra_destroyed,
            success_level=attack_result.get("hit", False)
        )
        
        return war_attack
    
    def execute_nuclear_strike_on_nation(self, attacker_nation: Nation, defender_nation: Nation,
                                       war: War, nuke_count: int,
                                       target_city_id: Optional[str] = None) -> WarAttack:
        """
        Execute a nuclear strike and apply results to nations.
        
        Args:
            attacker_nation: The attacking nation
            defender_nation: The defending nation
            war: The war context
            nuke_count: Number of nuclear weapons to launch
            target_city_id: Target city ID (if None, random city)
        
        Returns:
            WarAttack object with attack results
        """
        from .military import MilitarySystem
        from .city import CitySystem
        
        military_system = MilitarySystem()
        city_system = CitySystem()
        
        # Get attacker nation data
        attacker_data = {
            "nukes": attacker_nation.nuclear_weapons,
            "technology": attacker_nation.technology,
            "completed_projects": attacker_nation.completed_projects,
            "owned_wonders": attacker_nation.owned_wonders
        }
        
        # Get defender nation data
        defender_data = {
            "cities": city_system.get_nation_cities(defender_nation.nation_id),
            "technology": defender_nation.technology,
            "completed_projects": defender_nation.completed_projects,
            "owned_wonders": defender_nation.owned_wonders
        }
        
        # Get target city infrastructure
        target_infra = self.get_city_infrastructure_for_attack(defender_data, target_city_id)
        
        # Get target city data for damage calculation
        if target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
        else:
            # Use average city if no specific target
            cities = list(defender_data["cities"].values())
            target_city = cities[0] if cities else None
        
        if target_city:
            target_city_data = {
                "infrastructure": target_city.infrastructure,
                "population": target_city.population,
                "soldiers": defender_nation.soldiers,
                "tanks": defender_nation.tanks,
                "aircraft": defender_nation.aircraft,
                "ships": defender_nation.destroyers + defender_nation.cruisers + defender_nation.battleships + defender_nation.carriers + defender_nation.submarines,
                "land": target_city.land
            }
        else:
            target_city_data = {
                "infrastructure": 1000,
                "population": 10000,
                "soldiers": defender_nation.soldiers,
                "tanks": defender_nation.tanks,
                "aircraft": defender_nation.aircraft,
                "ships": 0,
                "land": 500
            }
        
        # Calculate nuclear strike
        attack_result = self.calculate_nuclear_strike(
            nuke_count=nuke_count,
            target_city_id=target_city_id or "unknown",
            target_city_infra=target_city_data["infrastructure"],
            target_city_population=target_city_data["population"],
            target_city_soldiers=target_city_data["soldiers"],
            target_city_tanks=target_city_data["tanks"],
            target_city_aircraft=target_city_data["aircraft"],
            target_city_ships=target_city_data["ships"],
            target_city_land=target_city_data["land"],
            attacker_nation_data=attacker_data,
            defender_nation_data=defender_data
        )
        
        # Apply results to nations
        # Apply unit losses
        units_destroyed = attack_result.get("units_destroyed", {})
        defender_nation.soldiers = max(0, defender_nation.soldiers - units_destroyed.get("soldiers", 0))
        defender_nation.tanks = max(0, defender_nation.tanks - units_destroyed.get("tanks", 0))
        defender_nation.aircraft = max(0, defender_nation.aircraft - units_destroyed.get("aircraft", 0))
        defender_nation.destroyers = max(0, defender_nation.destroyers - units_destroyed.get("ships", 0) // 5)
        defender_nation.cruisers = max(0, defender_nation.cruisers - units_destroyed.get("ships", 0) // 5)
        defender_nation.battleships = max(0, defender_nation.battleships - units_destroyed.get("ships", 0) // 5)
        defender_nation.carriers = max(0, defender_nation.carriers - units_destroyed.get("ships", 0) // 5)
        defender_nation.submarines = max(0, defender_nation.submarines - units_destroyed.get("ships", 0) // 5)
        
        # Apply infrastructure destruction to target city
        infra_destroyed = attack_result.get("infrastructure_destroyed", 0)
        if infra_destroyed > 0 and target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
            target_city.infrastructure = max(0, target_city.infrastructure - infra_destroyed)
            target_city.update_improvement_slots()
        
        # Apply land destruction to target city
        land_destroyed = attack_result.get("land_destroyed", 0)
        if land_destroyed > 0 and target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
            target_city.land = max(0, target_city.land - land_destroyed)
        
        # Apply population killed
        population_killed = attack_result.get("population_killed", 0)
        if population_killed > 0 and target_city_id and target_city_id in defender_data["cities"]:
            target_city = defender_data["cities"][target_city_id]
            target_city.population = max(0, target_city.population - population_killed)
        
        # Apply environment damage
        environment_damage = attack_result.get("environment_damage", 0)
        defender_nation.environment += environment_damage
        
        # Apply radiation damage (long-term)
        radiation_damage = attack_result.get("radiation_damage", 0)
        defender_nation.environment += radiation_damage
        
        # Apply nuclear winter damage (global)
        nuclear_winter_damage = attack_result.get("nuclear_winter_damage", 0)
        defender_nation.environment += nuclear_winter_damage
        
        # Apply world condemnation (diplomatic penalty)
        world_condemnation = attack_result.get("world_condemnation", 0)
        attacker_nation.diplomatic_relations += world_condemnation
        
        # Apply happiness damage
        happiness_damage = attack_result.get("happiness_damage", 0)
        defender_nation.happiness += happiness_damage
        
        # Consume nukes
        attacker_nation.nuclear_weapons = max(0, attacker_nation.nuclear_weapons - nuke_count)
        
        # Update war score
        success_level = SuccessLevel.COMPLETE_SUCCESS if attack_result.get("hit", False) else SuccessLevel.FAILURE
        war_score_change = self.get_war_score_change(AttackType.NUCLEAR_LAUNCH, success_level)
        war.update_war_score(war_score_change, -war_score_change)
        
        # Create WarAttack record
        war_attack = WarAttack(
            war_id=war.war_id,
            attacker_nation_id=attacker_nation.nation_id,
            defender_nation_id=defender_nation.nation_id,
            attack_type=AttackType.NUCLEAR_LAUNCH,
            nuclear_weapons_committed=nuke_count,
            infrastructure_destroyed=infra_destroyed,
            success_level=attack_result.get("hit", False)
        )
        
        return war_attack
    
    def execute_spy_operation_on_nation(self, attacker_nation: Nation, defender_nation: Nation,
                                       war: War, operation_type: SpyOperationType,
                                       target_city_id: Optional[str] = None) -> WarAttack:
        """
        Execute a spy operation and apply results to nations.
        
        Args:
            attacker_nation: The attacking nation
            defender_nation: The defending nation
            war: The war context
            operation_type: Type of spy operation
            target_city_id: Target city ID (if None, random city)
        
        Returns:
            WarAttack object with attack results
        """
        from .spy import SpySystem
        from .city import CitySystem
        
        spy_system = SpySystem()
        city_system = CitySystem()
        
        # Get attacker nation data
        attacker_data = {
            "spies": attacker_nation.spies,
            "technology": attacker_nation.technology,
            "completed_projects": attacker_nation.completed_projects,
            "owned_wonders": attacker_nation.owned_wonders
        }
        
        # Get defender nation data
        defender_data = {
            "cities": city_system.get_nation_cities(defender_nation.nation_id),
            "technology": defender_nation.technology,
            "completed_projects": defender_nation.completed_projects,
            "owned_wonders": defender_nation.owned_wonders,
            "spies": defender_nation.spies
        }
        
        # Get target city infrastructure
        target_infra = self.get_city_infrastructure_for_attack(defender_data, target_city_id)
        
        # Check for counter-intelligence
        has_counter_intelligence = defender_nation.has_improvement("COUNTER_INTELLIGENCE_AGENCY")
        
        # Calculate spy operation
        attack_result = spy_system.execute_spy_operation(
            attacker_nation_data=attacker_data,
            defender_nation_data=defender_data,
            operation_type=operation_type,
            defender_infrastructure=target_infra
        )
        
        # Apply results based on operation type
        success = attack_result.get("success", False)
        
        if operation_type == SpyOperationType.SABOTAGE_INFRASTRUCTURE:
            # Apply infrastructure destruction
            infra_destroyed = attack_result.get("infrastructure_destroyed", 0)
            if infra_destroyed > 0 and target_city_id and target_city_id in defender_data["cities"]:
                target_city = defender_data["cities"][target_city_id]
                target_city.infrastructure = max(0, target_city.infrastructure - infra_destroyed)
                target_city.update_improvement_slots()
        
        elif operation_type == SpyOperationType.STEAL_MONEY:
            # Steal money from defender
            money_stolen = attack_result.get("money_stolen", 0)
            if money_stolen > 0:
                defender_nation.cash = max(0, defender_nation.cash - money_stolen)
                attacker_nation.cash += money_stolen
        
        elif operation_type == SpyOperationType.STEAL_TECHNOLOGY:
            # Steal technology from defender
            tech_stolen = attack_result.get("tech_stolen", 0)
            if tech_stolen > 0:
                defender_nation.technology = max(0, defender_nation.technology - tech_stolen)
                attacker_nation.technology += tech_stolen
        
        elif operation_type == SpyOperationType.ASSASSINATE_SPIES:
            # Kill defender spies
            spies_killed = attack_result.get("spies_killed", 0)
            if spies_killed > 0:
                defender_nation.spies = max(0, defender_nation.spies - spies_killed)
        
        elif operation_type == SpyOperationType.INCITE_UNREST:
            # Apply happiness damage
            happiness_damage = attack_result.get("happiness_damage", 0)
            defender_nation.happiness += happiness_damage
        
        elif operation_type == SpyOperationType.HACK_INFRASTRUCTURE:
            # Apply infrastructure disable effect
            infra_disabled_ticks = attack_result.get("effects", {}).get("infrastructure_disabled_ticks", 0)
            if infra_disabled_ticks > 0:
                defender_nation.infrastructure_disabled_ticks = infra_disabled_ticks
        
        elif operation_type == SpyOperationType.ASSASSINATE_LEADER:
            # Apply happiness damage and potential government change
            happiness_damage = attack_result.get("happiness_damage", 0)
            defender_nation.happiness += happiness_damage
            # Government change would need to be implemented separately
        
        elif operation_type == SpyOperationType.DRONE_RECON:
            # Gather intelligence (no direct damage)
            # Intelligence data would be returned to attacker
            pass
        
        # Apply spy losses on failure
        attacker_spies_lost = attack_result.get("attacker_spies_lost", 0)
        if attacker_spies_lost > 0:
            attacker_nation.spies = max(0, attacker_nation.spies - attacker_spies_lost)
        
        defender_spies_lost = attack_result.get("defender_spies_lost", 0)
        if defender_spies_lost > 0:
            defender_nation.spies = max(0, defender_nation.spies - defender_spies_lost)
        
        # Update war score
        success_level = SuccessLevel.SUCCESS if success else SuccessLevel.FAILURE
        war_score_change = self.get_war_score_change(AttackType.SPY_OPERATION, success_level)
        war.update_war_score(war_score_change, -war_score_change)
        
        # Create WarAttack record
        war_attack = WarAttack(
            war_id=war.war_id,
            attacker_nation_id=attacker_nation.nation_id,
            defender_nation_id=defender_nation.nation_id,
            attack_type=AttackType.SPY_OPERATION,
            spy_operation_option=operation_type,
            spies_committed=attacker_data["spies"],
            infrastructure_destroyed=attack_result.get("infrastructure_destroyed", 0),
            success_level=success
        )
        
        return war_attack


# Singleton instance
war_system = WarSystem()
