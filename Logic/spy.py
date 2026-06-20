"""
Spy System for Sovereign Nation Game

This module defines the espionage system including spy operations,
counter-intelligence, and spy management.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
from datetime import datetime
import uuid

from .war import SpyOperationType


class SpyOperationStatus(Enum):
    """Status of a spy operation."""
    PLANNING = "Planning"
    IN_PROGRESS = "In Progress"
    SUCCESS = "Success"
    FAILED = "Failed"
    DETECTED = "Detected"


@dataclass
class Spy:
    """Represents a spy agent."""
    
    spy_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    nation_id: str = ""
    
    # Spy stats
    skill_level: int = 1  # 1-100, increases with successful operations
    operations_completed: int = 0
    operations_failed: int = 0
    
    # Spy status
    is_alive: bool = True
    is_on_mission: bool = False
    current_mission_id: Optional[str] = None
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)
    last_mission_time: Optional[datetime] = None
    
    def train(self, experience_gain: int = 1):
        """Train spy and increase skill level."""
        self.skill_level = min(100, self.skill_level + experience_gain)
    
    def complete_operation(self, success: bool):
        """Record operation completion."""
        if success:
            self.operations_completed += 1
            self.train(2)  # Gain 2 skill on success
        else:
            self.operations_failed += 1
            self.train(1)  # Gain 1 skill even on failure


@dataclass
class SpyOperation:
    """Represents a spy operation."""
    
    operation_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    attacker_nation_id: str = ""
    defender_nation_id: str = ""
    
    operation_type: SpyOperationType = SpyOperationType.GATHER_INTELLIGENCE
    spy_id: str = ""
    
    # Operation status
    status: SpyOperationStatus = SpyOperationStatus.PLANNING
    
    # Operation results
    success: bool = False
    detected: bool = False
    
    # Operation outcomes
    intelligence_gathered: Dict[str, float] = field(default_factory=dict)
    spies_killed: int = 0
    infrastructure_destroyed: int = 0
    money_stolen: float = 0.0
    resources_stolen: Dict[str, float] = field(default_factory=dict)
    technology_stolen: int = 0
    land_stolen: int = 0
    happiness_effect: int = 0
    infrastructure_disabled_duration: int = 0
    anarchy_duration: int = 0
    ground_attack_accuracy_bonus: float = 0.0
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    duration_ticks: int = 0
    
    def complete(self, success: bool, detected: bool):
        """Mark operation as complete."""
        self.status = SpyOperationStatus.SUCCESS if success else SpyOperationStatus.FAILED
        if detected:
            self.status = SpyOperationStatus.DETECTED
        self.success = success
        self.detected = detected
        self.completed_at = datetime.now()


class SpySystem:
    """System for managing spies and espionage operations."""
    
    def __init__(self):
        self.spies: Dict[str, Spy] = {}  # spy_id -> Spy
        self.nation_spies: Dict[str, List[str]] = {}  # nation_id -> [spy_ids]
        
        self.operations: Dict[str, SpyOperation] = {}  # operation_id -> SpyOperation
        self.nation_operations: Dict[str, List[str]] = {}  # nation_id -> [operation_ids]
    
    def can_train_spy(self, nation_id: str, cash: float, spy_count: int,
                     has_intelligence_hq: bool) -> tuple[bool, str]:
        """Check if nation can train a spy."""
        # Spy cost
        military_system = __import__('military').military_system
        spy_unit = military_system.get_unit(__import__('military').MilitaryUnitType.SPY)
        
        if cash < spy_unit.cost:
            return False, f"Insufficient cash (need ${spy_unit.cost})"
        
        # Spy cap
        base_cap = 10
        if has_intelligence_hq:
            base_cap = 15
        
        if spy_count >= base_cap:
            return False, f"At spy cap ({base_cap})"
        
        return True, ""
    
    def train_spy(self, nation_id: str) -> Spy:
        """Train a new spy for a nation."""
        spy = Spy(nation_id=nation_id)
        
        self.spies[spy.spy_id] = spy
        
        if nation_id not in self.nation_spies:
            self.nation_spies[nation_id] = []
        self.nation_spies[nation_id].append(spy.spy_id)
        
        return spy
    
    def get_nation_spies(self, nation_id: str) -> List[Spy]:
        """Get all spies for a nation."""
        spy_ids = self.nation_spies.get(nation_id, [])
        return [self.spies[spy_id] for spy_id in spy_ids if self.spies[spy_id].is_alive]
    
    def get_spy(self, spy_id: str) -> Optional[Spy]:
        """Get a spy by ID."""
        return self.spies.get(spy_id)
    
    def kill_spy(self, spy_id: str) -> bool:
        """Kill a spy."""
        if spy_id in self.spies:
            spy = self.spies[spy_id]
            spy.is_alive = False
            spy.is_on_mission = False
            spy.current_mission_id = None
            return True
        return False
    
    def can_start_operation(self, nation_id: str, operation_type: SpyOperationType,
                          target_nation_id: str, has_required_project: bool) -> tuple[bool, str]:
        """Check if nation can start a spy operation."""
        # Check for required projects
        if operation_type == SpyOperationType.HACK_INFRASTRUCTURE and not has_required_project:
            return False, "Requires Cyber Command Center project"
        
        if operation_type == SpyOperationType.ASSASSINATE_LEADER and not has_required_project:
            return False, "Requires Special Operations HQ project"
        
        if operation_type == SpyOperationType.DRONE_RECON and not has_required_project:
            return False, "Requires Drone Program project"
        
        # Check if has available spy
        available_spies = [spy for spy in self.get_nation_spies(nation_id) if not spy.is_on_mission]
        if not available_spies:
            return False, "No available spies"
        
        return True, ""
    
    def start_operation(self, attacker_nation_id: str, defender_nation_id: str,
                      operation_type: SpyOperationType, spy_id: str) -> SpyOperation:
        """Start a spy operation."""
        operation = SpyOperation(
            attacker_nation_id=attacker_nation_id,
            defender_nation_id=defender_nation_id,
            operation_type=operation_type,
            spy_id=spy_id
        )
        
        self.operations[operation.operation_id] = operation
        
        if attacker_nation_id not in self.nation_operations:
            self.nation_operations[attacker_nation_id] = []
        self.nation_operations[attacker_nation_id].append(operation.operation_id)
        
        # Mark spy as on mission
        spy = self.get_spy(spy_id)
        if spy:
            spy.is_on_mission = True
            spy.current_mission_id = operation.operation_id
        
        return operation
    
    def complete_operation(self, operation_id: str, success: bool, detected: bool) -> bool:
        """Complete a spy operation."""
        if operation_id not in self.operations:
            return False
        
        operation = self.operations[operation_id]
        operation.complete(success, detected)
        
        # Update spy
        spy = self.get_spy(operation.spy_id)
        if spy:
            spy.complete_operation(success)
            spy.is_on_mission = False
            spy.current_mission_id = None
            spy.last_mission_time = datetime.now()
        
        return True
    
    def calculate_operation_success_chance(self, attacker_spy_skill: int,
                                         defender_spy_count: int,
                                         defender_spy_defense_bonus: float) -> float:
        """Calculate success chance for spy operation."""
        # Base success chance based on spy skill
        base_chance = attacker_spy_skill / 100.0
        
        # Counter-intelligence defense
        defense_chance = defender_spy_count * 0.02  # 2% per spy
        defense_chance += defender_spy_defense_bonus
        
        # Final success chance
        success_chance = base_chance * (1.0 - min(0.8, defense_chance))
        
        return max(0.1, min(0.9, success_chance))  # Cap between 10% and 90%
    
    def calculate_detection_chance(self, attacker_spy_skill: int,
                                  defender_spy_count: int,
                                  defender_spy_defense_bonus: float) -> float:
        """Calculate detection chance for spy operation."""
        # Detection increases with defender's spy count
        base_detection = defender_spy_count * 0.03  # 3% per spy
        base_detection += defender_spy_defense_bonus
        
        # Higher skill spies are harder to detect
        detection_chance = base_detection * (1.0 - (attacker_spy_skill / 200.0))
        
        return max(0.05, min(0.5, detection_chance))  # Cap between 5% and 50%
    
    def get_nation_operations(self, nation_id: str) -> List[SpyOperation]:
        """Get all operations for a nation."""
        operation_ids = self.nation_operations.get(nation_id, [])
        return [self.operations[op_id] for op_id in operation_ids]
    
    def get_counter_intelligence_bonus(self, nation_id: str) -> float:
        """Calculate counter-intelligence bonus for a nation."""
        spies = self.get_nation_spies(nation_id)
        return len(spies) * 0.02  # 2% per spy
    
    def process_tick(self, current_tick: int):
        """Process all operations for a tick."""
        for operation in self.operations.values():
            if operation.status == SpyOperationStatus.IN_PROGRESS:
                operation.duration_ticks += 1
                
                pass


# Singleton instance
spy_system = SpySystem()
