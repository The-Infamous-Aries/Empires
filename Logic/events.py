"""
Random Events System for Sovereign Nation Game

This module defines the random events system with enriched events
that add flavor and unpredictability to the game.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable
from enum import Enum
from datetime import datetime
import uuid
import random


class EventType(Enum):
    """Categories of random events."""
    POSITIVE = "Positive"
    NEGATIVE = "Negative"
    NEUTRAL = "Neutral"
    CHOICE = "Choice"


class EventSeverity(Enum):
    """Severity of events."""
    MINOR = "Minor"
    MODERATE = "Moderate"
    MAJOR = "Major"
    CATASTROPHIC = "Catastrophic"


@dataclass
class EventChoice:
    """Represents a choice in a choice event."""
    choice_id: str
    description: str
    effects: Dict[str, float]  # Effect type -> value
    requirements: Optional[Dict[str, float]] = None  # Requirements to choose this option


@dataclass
class RandomEvent:
    """Represents a random event."""
    
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    
    event_type: EventType = EventType.NEUTRAL
    severity: EventSeverity = EventSeverity.MODERATE
    
    # Event effects (if automatic)
    effects: Dict[str, float] = field(default_factory=dict)
    
    # Event duration (for temporary effects)
    duration_ticks: int = 0
    
    # Choice events
    is_choice_event: bool = False
    choices: List[EventChoice] = field(default_factory=list)
    
    # Event requirements
    requirements: Dict[str, float] = field(default_factory=dict)  # Requirements to trigger
    
    # Event probability
    base_probability: float = 0.01  # 1% base chance per tick
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.now)
    
    def can_trigger(self, nation_state: Dict[str, float]) -> bool:
        """Check if event can trigger based on nation state."""
        for requirement, value in self.requirements.items():
            if requirement == "min_infrastructure":
                if nation_state.get("infrastructure", 0) < value:
                    return False
            elif requirement == "max_infrastructure":
                if nation_state.get("infrastructure", 0) > value:
                    return False
            elif requirement == "min_population":
                if nation_state.get("population", 0) < value:
                    return False
            elif requirement == "min_technology":
                if nation_state.get("technology", 0) < value:
                    return False
            elif requirement == "has_harbor":
                if not nation_state.get("has_harbor", False):
                    return False
            elif requirement == "has_power":
                if not nation_state.get("has_power", False):
                    return False
        
        return True
    
    def apply_effects(self, nation_state: Dict[str, float]) -> Dict[str, float]:
        """Apply event effects to nation state."""
        result = {}
        
        for effect_type, value in self.effects.items():
            if effect_type == "cash_bonus":
                result["cash"] = nation_state.get("cash", 0) + value
            elif effect_type == "happiness_bonus":
                result["happiness"] = nation_state.get("happiness", 10) + value
            elif effect_type == "tax_income_bonus":
                result["tax_income_bonus"] = value
            elif effect_type == "commerce_income_bonus":
                result["commerce_income_bonus"] = value
            elif effect_type == "trade_income_bonus":
                result["trade_income_bonus"] = value
            elif effect_type == "technology_cost_bonus":
                result["technology_cost_bonus"] = value
            elif effect_type == "resource_production_bonus":
                result["resource_production_bonus"] = value
            elif effect_type == "infrastructure_damage":
                result["infrastructure"] = nation_state.get("infrastructure", 0) - value
            elif effect_type == "population_loss":
                result["population"] = nation_state.get("population", 0) * (1.0 - value)
            elif effect_type == "military_loss":
                result["military_loss"] = value
            elif effect_type == "environment_damage":
                result["environment"] = nation_state.get("environment", 3) - value
            elif effect_type == "disease_increase":
                result["disease"] = nation_state.get("disease", 0) + value
            elif effect_type == "pollution_increase":
                result["pollution"] = nation_state.get("pollution", 0) + value
            elif effect_type == "soldier_efficiency_bonus":
                result["soldier_efficiency_bonus"] = value
            elif effect_type == "tank_efficiency_bonus":
                result["tank_efficiency_bonus"] = value
            elif effect_type == "aircraft_efficiency_bonus":
                result["aircraft_efficiency_bonus"] = value
            elif effect_type == "ship_efficiency_bonus":
                result["ship_efficiency_bonus"] = value
            elif effect_type == "spy_success_bonus":
                result["spy_success_bonus"] = value
            elif effect_type == "spy_defense_bonus":
                result["spy_defense_bonus"] = value
            elif effect_type == "war_score_bonus":
                result["war_score_bonus"] = value
        
        return result


class EventSystem:
    """System for managing random events."""
    
    def __init__(self):
        self.events: Dict[str, RandomEvent] = {}
        self.active_events: Dict[str, Dict[str, float]] = {}  # nation_id -> {event_id: remaining_ticks}
        self._initialize_events()
    
    def _initialize_events(self):
        """Initialize all random events."""
        # POSITIVE EVENTS
        self._add_positive_events()
        
        # NEGATIVE EVENTS
        self._add_negative_events()
        
        # NEUTRAL/CHOICE EVENTS
        self._add_neutral_events()
    
    def _add_positive_events(self):
        """Add 30 positive random events with realistic themes."""
        # Bountiful Harvest
        self.events["bountiful_harvest"] = RandomEvent(
            name="Bountiful Harvest",
            description="Exceptional growing conditions boost food production.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"resource_production_bonus": 0.50},
            duration_ticks=72,
            base_probability=0.008,
            requirements={"min_infrastructure": 500}
        )
        
        # Economic Boom
        self.events["economic_boom"] = RandomEvent(
            name="Economic Boom",
            description="Strong economic growth increases tax revenue.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"tax_income_bonus": 0.20},
            duration_ticks=48,
            base_probability=0.006,
            requirements={"min_infrastructure": 1000}
        )
        
        # Scientific Breakthrough
        self.events["scientific_breakthrough"] = RandomEvent(
            name="Scientific Breakthrough",
            description="Major research advancement reduces technology costs.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"technology_cost_bonus": -0.20},
            duration_ticks=168,
            base_probability=0.004,
            requirements={"min_technology": 500}
        )
        
        # Population Surge
        self.events["population_surge"] = RandomEvent(
            name="Population Surge",
            description="Birth rates increase significantly.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"population_growth_bonus": 0.05},
            duration_ticks=120,
            base_probability=0.005,
            requirements={"min_population": 10000}
        )
        
        # Foreign Investment
        self.events["foreign_investment"] = RandomEvent(
            name="Foreign Investment",
            description="Foreign investors inject capital into your nation.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MINOR,
            effects={"cash_bonus": 500000.0},
            duration_ticks=0,
            base_probability=0.003,
            requirements={"has_harbor": True}
        )
        
        # Cultural Festival
        self.events["cultural_festival"] = RandomEvent(
            name="Cultural Festival",
            description="A grand celebration boosts national morale.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MINOR,
            effects={"happiness_bonus": 5},
            duration_ticks=72,
            base_probability=0.007
        )
        
        # Military Parade
        self.events["military_parade"] = RandomEvent(
            name="Military Parade",
            description="A display of military prowess boosts soldier morale.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MINOR,
            effects={"soldier_efficiency_bonus": 0.10},
            duration_ticks=72,
            base_probability=0.004,
            requirements={"min_infrastructure": 2000}
        )
        
        # Birthday Celebration
        self.events["birthday_celebration"] = RandomEvent(
            name="Birthday Celebration",
            description="National anniversary celebration.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MINOR,
            effects={"happiness_bonus": 3},
            duration_ticks=48,
            base_probability=0.0,
            requirements={"anniversary": True}
        )
        
        # Industrial Growth
        self.events["industrial_growth"] = RandomEvent(
            name="Industrial Growth",
            description="Rapid industrial expansion boosts manufacturing.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"improvement_build_cost_bonus": -0.10},
            duration_ticks=96,
            base_probability=0.005,
            requirements={"min_infrastructure": 3000}
        )
        
        # Trade Windfall
        self.events["trade_windfall"] = RandomEvent(
            name="Trade Windfall",
            description="Exceptional trade opportunities boost income.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"trade_income_bonus": 0.25},
            duration_ticks=60,
            base_probability=0.004,
            requirements={"has_harbor": True}
        )
        
        # Tech Renaissance
        self.events["tech_renaissance"] = RandomEvent(
            name="Tech Renaissance",
            description="Golden age of innovation accelerates research.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MAJOR,
            effects={"technology_cost_bonus": -0.30, "tech_income_bonus": 0.15},
            duration_ticks=120,
            base_probability=0.002,
            requirements={"min_technology": 2000}
        )
        
        # Diplomatic Success
        self.events["diplomatic_success"] = RandomEvent(
            name="Diplomatic Success",
            description="Successful negotiations improve international standing.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MINOR,
            effects={"spy_defense_bonus": 0.10, "happiness_bonus": 2},
            duration_ticks=72,
            base_probability=0.005
        )
        
        # Resource Discovery
        self.events["resource_discovery"] = RandomEvent(
            name="Resource Discovery",
            description="New resource deposits discovered in your territory.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"resource_production_bonus": 0.15},
            duration_ticks=144,
            base_probability=0.003,
            requirements={"min_infrastructure": 2000}
        )
        
        # Tourism Boom
        self.events["tourism_boom"] = RandomEvent(
            name="Tourism Boom",
            description="Your nation becomes a popular tourist destination.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"commerce_income_bonus": 0.20, "happiness_bonus": 2},
            duration_ticks=84,
            base_probability=0.004,
            requirements={"min_infrastructure": 1500, "has_harbor": True}
        )
        
        # Infrastructure Grant
        self.events["infrastructure_grant"] = RandomEvent(
            name="Infrastructure Grant",
            description="International organization funds infrastructure projects.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MINOR,
            effects={"cash_bonus": 300000.0, "infrastructure_build_cost_bonus": -0.15},
            duration_ticks=48,
            base_probability=0.003,
            requirements={"min_infrastructure": 1000}
        )
        
        # Military Technology Advance
        self.events["military_tech_advance"] = RandomEvent(
            name="Military Technology Advance",
            description="Breakthrough in military equipment manufacturing.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"tank_efficiency_bonus": 0.15, "aircraft_efficiency_bonus": 0.15},
            duration_ticks=96,
            base_probability=0.003,
            requirements={"min_infrastructure": 2500, "min_technology": 1000}
        )
        
        # Naval Superiority
        self.events["naval_superiority"] = RandomEvent(
            name="Naval Superiority",
            description="Naval innovations improve ship performance.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"ship_efficiency_bonus": 0.20},
            duration_ticks=108,
            base_probability=0.003,
            requirements={"has_harbor": True, "min_technology": 800}
        )
        
        # Educational Reform
        self.events["educational_reform"] = RandomEvent(
            name="Educational Reform",
            description="Education system improvements boost innovation.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"technology_cost_bonus": -0.15, "population_growth_bonus": 0.02},
            duration_ticks=120,
            base_probability=0.004,
            requirements={"min_infrastructure": 2000}
        )
        
        # Healthcare Improvement
        self.events["healthcare_improvement"] = RandomEvent(
            name="Healthcare Improvement",
            description="Healthcare system upgrades reduce disease.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"happiness_bonus": 4, "population_growth_bonus": 0.03},
            duration_ticks=96,
            base_probability=0.004,
            requirements={"min_infrastructure": 1500}
        )
        
        # Agricultural Innovation
        self.events["agricultural_innovation"] = RandomEvent(
            name="Agricultural Innovation",
            description="New farming techniques boost crop yields.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"resource_production_bonus": 0.25, "cash_bonus": 200000.0},
            duration_ticks=72,
            base_probability=0.005,
            requirements={"min_infrastructure": 1000}
        )
        
        # Mining Boom
        self.events["mining_boom"] = RandomEvent(
            name="Mining Boom",
            description="Rich mineral deposits discovered.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"resource_production_bonus": 0.35, "commerce_income_bonus": 0.10},
            duration_ticks=96,
            base_probability=0.003,
            requirements={"min_infrastructure": 1800}
        )
        
        # Energy Revolution
        self.events["energy_revolution"] = RandomEvent(
            name="Energy Revolution",
            description="Breakthrough in energy production reduces costs.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MAJOR,
            effects={"improvement_build_cost_bonus": -0.20, "pollution_increase": -1},
            duration_ticks=120,
            base_probability=0.002,
            requirements={"min_technology": 1500, "min_infrastructure": 2500}
        )
        
        # Sports Championship
        self.events["sports_championship"] = RandomEvent(
            name="Sports Championship",
            description="National team wins international championship.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MINOR,
            effects={"happiness_bonus": 6, "tax_income_bonus": 0.05},
            duration_ticks=48,
            base_probability=0.003
        )
        
        # Cultural Exchange
        self.events["cultural_exchange"] = RandomEvent(
            name="Cultural Exchange",
            description="International cultural program boosts soft power.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MINOR,
            effects={"spy_defense_bonus": 0.15, "happiness_bonus": 3},
            duration_ticks=60,
            base_probability=0.004,
            requirements={"min_infrastructure": 1200}
        )
        
        # Infrastructure Modernization
        self.events["infrastructure_modernization"] = RandomEvent(
            name="Infrastructure Modernization",
            description="Massive infrastructure improvement project.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MAJOR,
            effects={"infrastructure_build_cost_bonus": -0.25, "tax_income_bonus": 0.10},
            duration_ticks=144,
            base_probability=0.002,
            requirements={"min_infrastructure": 4000}
        )
        
        # Space Program Success
        self.events["space_program_success"] = RandomEvent(
            name="Space Program Success",
            description="Successful space mission inspires nation.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MAJOR,
            effects={"technology_cost_bonus": -0.25, "happiness_bonus": 5, "tech_income_bonus": 0.10},
            duration_ticks=120,
            base_probability=0.001,
            requirements={"min_technology": 3000, "min_infrastructure": 5000}
        )
        
        # Green Energy Initiative
        self.events["green_energy_initiative"] = RandomEvent(
            name="Green Energy Initiative",
            description="Renewable energy project reduces pollution.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"pollution_increase": -3, "cash_bonus": -150000.0},
            duration_ticks=168,
            base_probability=0.003,
            requirements={"min_infrastructure": 2000, "min_technology": 1000}
        )
        
        # Trade Agreement
        self.events["trade_agreement"] = RandomEvent(
            name="Trade Agreement",
            description="Favorable trade deal with major economy.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"trade_income_bonus": 0.30, "commerce_income_bonus": 0.15},
            duration_ticks=96,
            base_probability=0.003,
            requirements={"has_harbor": True, "min_infrastructure": 2500}
        )
        
        # Intelligence Network
        self.events["intelligence_network"] = RandomEvent(
            name="Intelligence Network",
            description="Espionage network expansion improves spy operations.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"spy_success_bonus": 0.20, "spy_defense_bonus": 0.15},
            duration_ticks=108,
            base_probability=0.003,
            requirements={"min_technology": 1200}
        )
        
        # Infrastructure Repair
        self.events["infrastructure_repair"] = RandomEvent(
            name="Infrastructure Repair",
            description="Successful infrastructure restoration program.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MINOR,
            effects={"infrastructure": 200, "cash_bonus": -100000.0},
            duration_ticks=0,
            base_probability=0.004,
            requirements={"min_infrastructure": 1000}
        )
        
        # Tax Reform
        self.events["tax_reform"] = RandomEvent(
            name="Tax Reform",
            description="Efficient tax system increases revenue.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"tax_income_bonus": 0.15, "happiness_bonus": -1},
            duration_ticks=120,
            base_probability=0.004,
            requirements={"min_infrastructure": 2000}
        )
        
        # Military Recruitment
        self.events["military_recruitment"] = RandomEvent(
            name="Military Recruitment",
            description="Successful recruitment drive strengthens military.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"soldier_efficiency_bonus": 0.12, "cash_bonus": -200000.0},
            duration_ticks=72,
            base_probability=0.004,
            requirements={"min_infrastructure": 1500}
        )
        
        # Environmental Cleanup
        self.events["environmental_cleanup"] = RandomEvent(
            name="Environmental Cleanup",
            description="Successful environmental restoration project.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"environment": 2, "pollution_increase": -2, "cash_bonus": -100000.0},
            duration_ticks=0,
            base_probability=0.003,
            requirements={"min_infrastructure": 1500}
        )
        
        # Digital Transformation
        self.events["digital_transformation"] = RandomEvent(
            name="Digital Transformation",
            description="Government digitization improves efficiency.",
            event_type=EventType.POSITIVE,
            severity=EventSeverity.MODERATE,
            effects={"tax_income_bonus": 0.10, "spy_defense_bonus": 0.20},
            duration_ticks=84,
            base_probability=0.004,
            requirements={"min_technology": 1500}
        )
    
    def _add_negative_events(self):
        """Add 30 negative random events with realistic themes."""
        # Natural Disaster
        self.events["natural_disaster"] = RandomEvent(
            name="Natural Disaster",
            description="Devastating natural disaster strikes your nation.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"infrastructure_damage": 150, "happiness_bonus": -2},
            duration_ticks=120,
            base_probability=0.005,
            requirements={"min_infrastructure": 1000}
        )
        
        # Disease Outbreak
        self.events["disease_outbreak"] = RandomEvent(
            name="Disease Outbreak",
            description="Deadly disease spreads through your population.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"population_loss": 0.03, "happiness_bonus": -3},
            duration_ticks=168,
            base_probability=0.004,
            requirements={"min_population": 5000}
        )
        
        # Economic Recession
        self.events["economic_recession"] = RandomEvent(
            name="Economic Recession",
            description="Economic downturn reduces tax revenue.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"tax_income_bonus": -0.15},
            duration_ticks=72,
            base_probability=0.006,
            requirements={"min_infrastructure": 1500}
        )
        
        # Political Scandal
        self.events["political_scandal"] = RandomEvent(
            name="Political Scandal",
            description="Corruption scandal damages government reputation.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"happiness_bonus": -4},
            duration_ticks=120,
            base_probability=0.004
        )
        
        # Military Desertion
        self.events["military_desertion"] = RandomEvent(
            name="Military Desertion",
            description="Soldiers desert their posts in protest.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"military_loss": 0.05},
            duration_ticks=0,
            base_probability=0.003,
            requirements={"min_infrastructure": 1000}
        )
        
        # Oil Spill
        self.events["oil_spill"] = RandomEvent(
            name="Oil Spill",
            description="Environmental disaster damages ecosystems.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"environment_damage": 2},
            duration_ticks=336,
            base_probability=0.002,
            requirements={"has_harbor": True}
        )
        
        # Cyber Attack
        self.events["cyber_attack"] = RandomEvent(
            name="Cyber Attack",
            description="Foreign hackers disable critical infrastructure.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"improvement_disabled": 1},
            duration_ticks=48,
            base_probability=0.004,
            requirements={"min_technology": 1000}
        )
        
        # Drought
        self.events["drought"] = RandomEvent(
            name="Drought",
            description="Severe drought devastates agricultural output.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"resource_production_bonus": -0.50},
            duration_ticks=120,
            base_probability=0.005,
            requirements={"min_infrastructure": 800}
        )
        
        # Labor Strike
        self.events["labor_strike"] = RandomEvent(
            name="Labor Strike",
            description="Workers strike demanding better conditions.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"tax_income_bonus": -0.10, "happiness_bonus": -2},
            duration_ticks=72,
            base_probability=0.005,
            requirements={"min_infrastructure": 2000}
        )
        
        # Market Crash
        self.events["market_crash"] = RandomEvent(
            name="Market Crash",
            description="Financial markets collapse, devastating trade income.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"trade_income_bonus": -0.30, "commerce_income_bonus": -0.20},
            duration_ticks=96,
            base_probability=0.002,
            requirements={"has_harbor": True}
        )
        
        # Refugee Crisis
        self.events["refugee_crisis"] = RandomEvent(
            name="Refugee Crisis",
            description="Influx of refugees strains resources.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"happiness_bonus": -2, "infrastructure_damage": 50},
            duration_ticks=84,
            base_probability=0.004,
            requirements={"min_infrastructure": 3000}
        )
        
        # Corruption Scandal
        self.events["corruption_scandal"] = RandomEvent(
            name="Corruption Scandal",
            description="Government corruption diverts funds.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"cash_bonus": -200000.0, "happiness_bonus": -3},
            duration_ticks=0,
            base_probability=0.003,
            requirements={"min_infrastructure": 1500}
        )
        
        # Industrial Accident
        self.events["industrial_accident"] = RandomEvent(
            name="Industrial Accident",
            description="Factory accident causes casualties and pollution.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"pollution_increase": 2, "happiness_bonus": -2},
            duration_ticks=72,
            base_probability=0.004,
            requirements={"min_infrastructure": 2500}
        )
        
        # Food Shortage
        self.events["food_shortage"] = RandomEvent(
            name="Food Shortage",
            description="Crop failures lead to food shortages.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"population_loss": 0.02, "happiness_bonus": -4},
            duration_ticks=96,
            base_probability=0.005,
            requirements={"min_population": 8000}
        )
        
        # Power Grid Failure
        self.events["power_grid_failure"] = RandomEvent(
            name="Power Grid Failure",
            description="Massive power outage disrupts industry.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"tax_income_bonus": -0.20, "commerce_income_bonus": -0.15},
            duration_ticks=48,
            base_probability=0.003,
            requirements={"min_infrastructure": 2000}
        )
        
        # Terrorist Attack
        self.events["terrorist_attack"] = RandomEvent(
            name="Terrorist Attack",
            description="Terrorist attack on civilian targets.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"happiness_bonus": -5, "infrastructure_damage": 100},
            duration_ticks=72,
            base_probability=0.002,
            requirements={"min_infrastructure": 1500}
        )
        
        # Trade Embargo
        self.events["trade_embargo"] = RandomEvent(
            name="Trade Embargo",
            description="Major trading partner imposes embargo.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"trade_income_bonus": -0.40, "resource_production_bonus": -0.10},
            duration_ticks=120,
            base_probability=0.002,
            requirements={"has_harbor": True, "min_infrastructure": 2000}
        )
        
        # Banking Crisis
        self.events["banking_crisis"] = RandomEvent(
            name="Banking Crisis",
            description="Financial system collapses.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.CATASTROPHIC,
            effects={"cash_bonus": -500000.0, "tax_income_bonus": -0.25},
            duration_ticks=144,
            base_probability=0.001,
            requirements={"min_infrastructure": 3000}
        )
        
        # Radiation Leak
        self.events["radiation_leak"] = RandomEvent(
            name="Radiation Leak",
            description="Nuclear facility radiation leak.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.CATASTROPHIC,
            effects={"population_loss": 0.05, "pollution_increase": 5},
            duration_ticks=240,
            base_probability=0.001,
            requirements={"min_technology": 2000}
        )
        
        # Civil Unrest
        self.events["civil_unrest"] = RandomEvent(
            name="Civil Unrest",
            description="Widespread protests disrupt normal life.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"happiness_bonus": -3, "tax_income_bonus": -0.08},
            duration_ticks=60,
            base_probability=0.005,
            requirements={"min_population": 12000}
        )
        
        # Sanctions
        self.events["sanctions"] = RandomEvent(
            name="International Sanctions",
            description="International community imposes sanctions.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"trade_income_bonus": -0.25, "tech_income_bonus": -0.15},
            duration_ticks=168,
            base_probability=0.002,
            requirements={"min_infrastructure": 2500}
        )
        
        # Brain Drain
        self.events["brain_drain"] = RandomEvent(
            name="Brain Drain",
            description="Skilled workers emigrate in large numbers.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"technology_cost_bonus": 0.15, "tax_income_bonus": -0.05},
            duration_ticks=96,
            base_probability=0.004,
            requirements={"min_technology": 1000}
        )
        
        # Currency Devaluation
        self.events["currency_devaluation"] = RandomEvent(
            name="Currency Devaluation",
            description="Currency loses value rapidly.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"trade_income_bonus": -0.20, "cash_bonus": -300000.0},
            duration_ticks=72,
            base_probability=0.003,
            requirements={"has_harbor": True}
        )
        
        # Epidemic
        self.events["epidemic"] = RandomEvent(
            name="Epidemic",
            description="Deadly epidemic sweeps through nation.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.CATASTROPHIC,
            effects={"population_loss": 0.08, "happiness_bonus": -6},
            duration_ticks=192,
            base_probability=0.001,
            requirements={"min_population": 10000}
        )
        
        # Infrastructure Collapse
        self.events["infrastructure_collapse"] = RandomEvent(
            name="Infrastructure Collapse",
            description="Critical infrastructure fails catastrophically.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"infrastructure_damage": 300, "cash_bonus": -400000.0},
            duration_ticks=0,
            base_probability=0.002,
            requirements={"min_infrastructure": 3000}
        )
        
        # Spy Ring Discovery
        self.events["spy_ring_discovery"] = RandomEvent(
            name="Spy Ring Discovery",
            description="Foreign spy network uncovered in government.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"spy_defense_bonus": -0.10, "happiness_bonus": -3},
            duration_ticks=60,
            base_probability=0.004,
            requirements={"min_infrastructure": 2000}
        )
        
        # Trade Route Disruption
        self.events["trade_route_disruption"] = RandomEvent(
            name="Trade Route Disruption",
            description="Piracy disrupts major trade routes.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"trade_income_bonus": -0.15, "cash_bonus": -150000.0},
            duration_ticks=72,
            base_probability=0.004,
            requirements={"has_harbor": True}
        )
        
        # Environmental Disaster
        self.events["environmental_disaster"] = RandomEvent(
            name="Environmental Disaster",
            description="Major environmental catastrophe.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"environment_damage": 3, "pollution_increase": 4},
            duration_ticks=192,
            base_probability=0.002,
            requirements={"min_infrastructure": 2000}
        )
        
        # Military Defeat
        self.events["military_defeat"] = RandomEvent(
            name="Military Defeat",
            description="Major military defeat damages morale.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"happiness_bonus": -5, "soldier_efficiency_bonus": -0.10},
            duration_ticks=84,
            base_probability=0.002,
            requirements={"min_infrastructure": 2000}
        )
        
        # Tax Evasion Scandal
        self.events["tax_evasion_scandal"] = RandomEvent(
            name="Tax Evasion Scandal",
            description="Widespread tax evasion discovered.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"cash_bonus": -350000.0, "happiness_bonus": -2},
            duration_ticks=0,
            base_probability=0.003,
            requirements={"min_infrastructure": 1500}
        )
        
        # Water Crisis
        self.events["water_crisis"] = RandomEvent(
            name="Water Crisis",
            description="Severe water shortage affects population.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MAJOR,
            effects={"population_loss": 0.02, "happiness_bonus": -4},
            duration_ticks=108,
            base_probability=0.004,
            requirements={"min_population": 15000}
        )
        
        # Diplomatic Incident
        self.events["diplomatic_incident"] = RandomEvent(
            name="Diplomatic Incident",
            description="Serious diplomatic dispute with major power.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"spy_success_bonus": -0.15, "trade_income_bonus": -0.10},
            duration_ticks=72,
            base_probability=0.004,
            requirements={"min_infrastructure": 1800}
        )
        
        # Technology Theft
        self.events["technology_theft"] = RandomEvent(
            name="Technology Theft",
            description="Foreign spies steal critical technology.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"technology_cost_bonus": 0.20, "spy_defense_bonus": -0.10},
            duration_ticks=60,
            base_probability=0.003,
            requirements={"min_technology": 1500}
        )
        
        # Supply Chain Disruption
        self.events["supply_chain_disruption"] = RandomEvent(
            name="Supply Chain Disruption",
            description="Global supply chain crisis affects imports.",
            event_type=EventType.NEGATIVE,
            severity=EventSeverity.MODERATE,
            effects={"resource_production_bonus": -0.20, "commerce_income_bonus": -0.10},
            duration_ticks=84,
            base_probability=0.005,
            requirements={"min_infrastructure": 2000}
        )
    
    def _add_neutral_events(self):
        """Add 50 choice random events with 4 choices each, including Do Nothing."""
        # Foreign Aid Request
        self.events["foreign_aid_request"] = RandomEvent(
            name="Foreign Aid Request",
            description="A neighboring nation requests foreign aid.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="accept_generously",
                    description="Accept generously (+4 happiness, -$250,000)",
                    effects={"happiness_bonus": 4, "cash_bonus": -250000.0}
                ),
                EventChoice(
                    choice_id="accept_modestly",
                    description="Accept modestly (+2 happiness, -$100,000)",
                    effects={"happiness_bonus": 2, "cash_bonus": -100000.0}
                ),
                EventChoice(
                    choice_id="demand_repayment",
                    description="Demand repayment (+$100,000, -2 happiness)",
                    effects={"cash_bonus": 100000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            base_probability=0.003
        )
        
        # Trade Dispute
        self.events["trade_dispute"] = RandomEvent(
            name="Trade Dispute",
            description="Trade dispute with a trading partner.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="diplomatic",
                    description="Resolve diplomatically (+2 happiness, -$50,000)",
                    effects={"happiness_bonus": 2, "cash_bonus": -50000.0}
                ),
                EventChoice(
                    choice_id="escalate",
                    description="Escalate (spy operation, -1 happiness)",
                    effects={"spy_operation": 1, "happiness_bonus": -1}
                ),
                EventChoice(
                    choice_id="compromise",
                    description="Compromise (-5% trade income, +1 happiness)",
                    effects={"trade_income_bonus": -0.05, "happiness_bonus": 1}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness, -3% trade income)",
                    effects={"happiness_bonus": -2, "trade_income_bonus": -0.03}
                )
            ],
            requirements={"has_harbor": True},
            base_probability=0.004
        )
        
        # Military Coup Attempt
        self.events["military_coup_attempt"] = RandomEvent(
            name="Military Coup Attempt",
            description="Military attempts to overthrow the government.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="suppress_force",
                    description="Suppress forcefully (-3 happiness, -10% military)",
                    effects={"happiness_bonus": -3, "military_loss": 0.10}
                ),
                EventChoice(
                    choice_id="suppress_diplomatic",
                    description="Suppress diplomatically (-2 happiness, -$200,000)",
                    effects={"happiness_bonus": -2, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="allow",
                    description="Allow coup (government changes randomly)",
                    effects={"government_change": True}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-5 happiness, -15% military)",
                    effects={"happiness_bonus": -5, "military_loss": 0.15}
                )
            ],
            requirements={"min_infrastructure": 2000},
            base_probability=0.001
        )
        
        # Religious Revival
        self.events["religious_revival"] = RandomEvent(
            name="Religious Revival",
            description="Religious movement gains popularity.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="endorse",
                    description="Endorse movement (+4 happiness, -2% tax income)",
                    effects={"happiness_bonus": 4, "tax_income_bonus": -0.02}
                ),
                EventChoice(
                    choice_id="tolerate",
                    description="Tolerate movement (+2 happiness)",
                    effects={"happiness_bonus": 2}
                ),
                EventChoice(
                    choice_id="suppress",
                    description="Suppress movement (-3 happiness, +2% tax income)",
                    effects={"happiness_bonus": -3, "tax_income_bonus": 0.02}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            base_probability=0.003
        )
        
        # Environmental Regulation
        self.events["environmental_regulation"] = RandomEvent(
            name="Environmental Regulation",
            description="Environmentalists demand stricter regulations.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="implement_strict",
                    description="Implement strict (-3 pollution, -$100,000, -1 happiness)",
                    effects={"pollution_increase": -3, "cash_bonus": -100000.0, "happiness_bonus": -1}
                ),
                EventChoice(
                    choice_id="implement_modest",
                    description="Implement modest (-2 pollution, -$50,000)",
                    effects={"pollution_increase": -2, "cash_bonus": -50000.0}
                ),
                EventChoice(
                    choice_id="ignore",
                    description="Ignore demands (+1 happiness, -1 environment)",
                    effects={"happiness_bonus": 1, "environment_damage": 1}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness, +1 pollution)",
                    effects={"happiness_bonus": -2, "pollution_increase": 1}
                )
            ],
            requirements={"min_infrastructure": 1500},
            base_probability=0.004
        )
        
        # Alliance Invitation
        self.events["alliance_invitation"] = RandomEvent(
            name="Alliance Invitation",
            description="An alliance extends an invitation to join.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="accept",
                    description="Accept invitation (join alliance, -$50,000)",
                    effects={"join_alliance": True, "cash_bonus": -50000.0}
                ),
                EventChoice(
                    choice_id="negotiate",
                    description="Negotiate terms (+$100,000, -1 happiness)",
                    effects={"cash_bonus": 100000.0, "happiness_bonus": -1}
                ),
                EventChoice(
                    choice_id="decline_hostile",
                    description="Decline hostile (-2 happiness, +spy defense)",
                    effects={"happiness_bonus": -2, "spy_defense_bonus": 0.05}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_infrastructure": 1000},
            base_probability=0.002
        )
        
        # Education Reform Proposal
        self.events["education_reform_proposal"] = RandomEvent(
            name="Education Reform Proposal",
            description="Education reform proposal divides the nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="implement_comprehensive",
                    description="Implement comprehensive (-15% tech cost, -$300,000)",
                    effects={"technology_cost_bonus": -0.15, "cash_bonus": -300000.0}
                ),
                EventChoice(
                    choice_id="implement_basic",
                    description="Implement basic (-5% tech cost, -$100,000)",
                    effects={"technology_cost_bonus": -0.05, "cash_bonus": -100000.0}
                ),
                EventChoice(
                    choice_id="reject",
                    description="Reject (+$150,000, -2 happiness)",
                    effects={"cash_bonus": 150000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_infrastructure": 2000},
            base_probability=0.003
        )
        
        # Healthcare Crisis
        self.events["healthcare_crisis"] = RandomEvent(
            name="Healthcare Crisis",
            description="Healthcare system faces critical shortage.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="invest_heavily",
                    description="Invest heavily (+3 happiness, -$400,000, +2% pop growth)",
                    effects={"happiness_bonus": 3, "cash_bonus": -400000.0, "population_growth_bonus": 0.02}
                ),
                EventChoice(
                    choice_id="invest_modestly",
                    description="Invest modestly (+1 happiness, -$200,000)",
                    effects={"happiness_bonus": 1, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="privatize",
                    description="Privatize (+$200,000, -3 happiness)",
                    effects={"cash_bonus": 200000.0, "happiness_bonus": -3}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-4 happiness, -1% population)",
                    effects={"happiness_bonus": -4, "population_loss": 0.01}
                )
            ],
            requirements={"min_population": 10000},
            base_probability=0.003
        )
        
        # Infrastructure Dilemma
        self.events["infrastructure_dilemma"] = RandomEvent(
            name="Infrastructure Dilemma",
            description="Critical infrastructure needs urgent repair.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="repair_comprehensive",
                    description="Comprehensive repair (+300 infrastructure, -$500,000)",
                    effects={"infrastructure": 300, "cash_bonus": -500000.0}
                ),
                EventChoice(
                    choice_id="repair_emergency",
                    description="Emergency repair (+150 infrastructure, -$250,000)",
                    effects={"infrastructure": 150, "cash_bonus": -250000.0}
                ),
                EventChoice(
                    choice_id="delay",
                    description="Delay repairs (+$200,000, -100 infrastructure)",
                    effects={"cash_bonus": 200000.0, "infrastructure_damage": 100}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness, -150 infrastructure)",
                    effects={"happiness_bonus": -2, "infrastructure_damage": 150}
                )
            ],
            requirements={"min_infrastructure": 1500},
            base_probability=0.004
        )
        
        # Military Budget Crisis
        self.events["military_budget_crisis"] = RandomEvent(
            name="Military Budget Crisis",
            description="Military demands increased funding.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="fund_fully",
                    description="Fund fully (+15% soldier efficiency, -$300,000)",
                    effects={"soldier_efficiency_bonus": 0.15, "cash_bonus": -300000.0}
                ),
                EventChoice(
                    choice_id="fund_partially",
                    description="Fund partially (+8% soldier efficiency, -$150,000)",
                    effects={"soldier_efficiency_bonus": 0.08, "cash_bonus": -150000.0}
                ),
                EventChoice(
                    choice_id="cut_budget",
                    description="Cut budget (+$200,000, -10% soldier efficiency)",
                    effects={"cash_bonus": 200000.0, "soldier_efficiency_bonus": -0.10}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-3 happiness, -5% soldier efficiency)",
                    effects={"happiness_bonus": -3, "soldier_efficiency_bonus": -0.05}
                )
            ],
            requirements={"min_infrastructure": 1000},
            base_probability=0.003
        )
        
        # Trade Agreement Negotiation
        self.events["trade_agreement_negotiation"] = RandomEvent(
            name="Trade Agreement Negotiation",
            description="Trade partner offers new agreement terms.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="accept_favorable",
                    description="Accept favorable (+20% trade income, -$100,000)",
                    effects={"trade_income_bonus": 0.20, "cash_bonus": -100000.0}
                ),
                EventChoice(
                    choice_id="accept_balanced",
                    description="Accept balanced (+10% trade income)",
                    effects={"trade_income_bonus": 0.10}
                ),
                EventChoice(
                    choice_id="reject",
                    description="Reject (+$150,000, -5% trade income)",
                    effects={"cash_bonus": 150000.0, "trade_income_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"has_harbor": True},
            base_probability=0.003
        )
        
        # Environmental Protection
        self.events["environmental_protection"] = RandomEvent(
            name="Environmental Protection",
            description="Environmental protection legislation proposed.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="implement_strong",
                    description="Implement strong (-4 pollution, -$250,000, -2% tax income)",
                    effects={"pollution_increase": -4, "cash_bonus": -250000.0, "tax_income_bonus": -0.02}
                ),
                EventChoice(
                    choice_id="implement_moderate",
                    description="Implement moderate (-2 pollution, -$100,000)",
                    effects={"pollution_increase": -2, "cash_bonus": -100000.0}
                ),
                EventChoice(
                    choice_id="reject",
                    description="Reject (+$150,000, +2 pollution)",
                    effects={"cash_bonus": 150000.0, "pollution_increase": 2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness, +1 pollution)",
                    effects={"happiness_bonus": -1, "pollution_increase": 1}
                )
            ],
            requirements={"min_infrastructure": 1500},
            base_probability=0.003
        )
        
        # Technology Sharing Request
        self.events["technology_sharing_request"] = RandomEvent(
            name="Technology Sharing Request",
            description="Ally requests access to your technology.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="share_fully",
                    description="Share fully (+3 happiness, +10% tech cost)",
                    effects={"happiness_bonus": 3, "technology_cost_bonus": 0.10}
                ),
                EventChoice(
                    choice_id="share_limited",
                    description="Share limited (+1 happiness, +5% tech cost)",
                    effects={"happiness_bonus": 1, "technology_cost_bonus": 0.05}
                ),
                EventChoice(
                    choice_id="demand_payment",
                    description="Demand payment (+$200,000, -2 happiness)",
                    effects={"cash_bonus": 200000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness, -spy defense)",
                    effects={"happiness_bonus": -2, "spy_defense_bonus": -0.05}
                )
            ],
            requirements={"min_technology": 1000},
            base_probability=0.003
        )
        
        # Refugee Crisis Response
        self.events["refugee_crisis_response"] = RandomEvent(
            name="Refugee Crisis Response",
            description="Refugee crisis requires immediate action.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="accept_all",
                    description="Accept all (+4 happiness, -$300,000, +3% pop growth)",
                    effects={"happiness_bonus": 4, "cash_bonus": -300000.0, "population_growth_bonus": 0.03}
                ),
                EventChoice(
                    choice_id="accept_limited",
                    description="Accept limited (+2 happiness, -$150,000)",
                    effects={"happiness_bonus": 2, "cash_bonus": -150000.0}
                ),
                EventChoice(
                    choice_id="reject",
                    description="Reject (+$100,000, -4 happiness)",
                    effects={"cash_bonus": 100000.0, "happiness_bonus": -4}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-3 happiness, -50 infrastructure)",
                    effects={"happiness_bonus": -3, "infrastructure_damage": 50}
                )
            ],
            requirements={"min_infrastructure": 2000},
            base_probability=0.002
        )
        
        # Energy Policy Decision
        self.events["energy_policy_decision"] = RandomEvent(
            name="Energy Policy Decision",
            description="Energy policy decision divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="invest_renewable",
                    description="Invest renewable (-3 pollution, -$350,000, -2% tax income)",
                    effects={"pollution_increase": -3, "cash_bonus": -350000.0, "tax_income_bonus": -0.02}
                ),
                EventChoice(
                    choice_id="invest_fossil",
                    description="Invest fossil (+5% tax income, +2 pollution, -$200,000)",
                    effects={"tax_income_bonus": 0.05, "pollution_increase": 2, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="maintain_status",
                    description="Maintain status quo (+$100,000, +1 pollution)",
                    effects={"cash_bonus": 100000.0, "pollution_increase": 1}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness, +2 pollution)",
                    effects={"happiness_bonus": -2, "pollution_increase": 2}
                )
            ],
            requirements={"min_infrastructure": 1500},
            base_probability=0.003
        )
        
        # Diplomatic Crisis
        self.events["diplomatic_crisis"] = RandomEvent(
            name="Diplomatic Crisis",
            description="Diplomatic crisis with major power.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="apologize",
                    description="Apologize (+$100,000, -2 happiness)",
                    effects={"cash_bonus": 100000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="negotiate",
                    description="Negotiate (-$150,000, -1 happiness)",
                    effects={"cash_bonus": -150000.0, "happiness_bonus": -1}
                ),
                EventChoice(
                    choice_id="stand_firm",
                    description="Stand firm (+3 happiness, -15% trade income)",
                    effects={"happiness_bonus": 3, "trade_income_bonus": -0.15}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-3 happiness, -20% trade income)",
                    effects={"happiness_bonus": -3, "trade_income_bonus": -0.20}
                )
            ],
            requirements={"min_infrastructure": 2000},
            base_probability=0.002
        )
        
        # Agricultural Subsidy Debate
        self.events["agricultural_subsidy_debate"] = RandomEvent(
            name="Agricultural Subsidy Debate",
            description="Agricultural subsidy debate divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="increase_subsidy",
                    description="Increase subsidy (+15% resource production, -$200,000)",
                    effects={"resource_production_bonus": 0.15, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="maintain_subsidy",
                    description="Maintain subsidy (+5% resource production, -$100,000)",
                    effects={"resource_production_bonus": 0.05, "cash_bonus": -100000.0}
                ),
                EventChoice(
                    choice_id="cut_subsidy",
                    description="Cut subsidy (+$150,000, -10% resource production)",
                    effects={"cash_bonus": 150000.0, "resource_production_bonus": -0.10}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness, -5% resource production)",
                    effects={"happiness_bonus": -2, "resource_production_bonus": -0.05}
                )
            ],
            requirements={"min_infrastructure": 1000},
            base_probability=0.003
        )
        
        # Tax Reform Debate
        self.events["tax_reform_debate"] = RandomEvent(
            name="Tax Reform Debate",
            description="Tax reform proposal divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="implement_progressive",
                    description="Implement progressive (+10% tax income, -2 happiness)",
                    effects={"tax_income_bonus": 0.10, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="implement_flat",
                    description="Implement flat (+5% tax income)",
                    effects={"tax_income_bonus": 0.05}
                ),
                EventChoice(
                    choice_id="cut_taxes",
                    description="Cut taxes (+3 happiness, -8% tax income)",
                    effects={"happiness_bonus": 3, "tax_income_bonus": -0.08}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_infrastructure": 1500},
            base_probability=0.003
        )
        
        # Military Intervention Request
        self.events["military_intervention_request"] = RandomEvent(
            name="Military Intervention Request",
            description="Ally requests military intervention.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="send_full_force",
                    description="Send full force (+4 happiness, -$400,000, -5% military)",
                    effects={"happiness_bonus": 4, "cash_bonus": -400000.0, "military_loss": 0.05}
                ),
                EventChoice(
                    choice_id="send_limited_force",
                    description="Send limited force (+2 happiness, -$200,000, -2% military)",
                    effects={"happiness_bonus": 2, "cash_bonus": -200000.0, "military_loss": 0.02}
                ),
                EventChoice(
                    choice_id="decline",
                    description="Decline (+$150,000, -3 happiness)",
                    effects={"cash_bonus": 150000.0, "happiness_bonus": -3}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-4 happiness, -spy defense)",
                    effects={"happiness_bonus": -4, "spy_defense_bonus": -0.10}
                )
            ],
            requirements={"min_infrastructure": 2000},
            base_probability=0.002
        )
        
        # Space Program Decision
        self.events["space_program_decision"] = RandomEvent(
            name="Space Program Decision",
            description="Space program proposal divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="invest_heavily",
                    description="Invest heavily (-25% tech cost, -$500,000, +5 happiness)",
                    effects={"technology_cost_bonus": -0.25, "cash_bonus": -500000.0, "happiness_bonus": 5}
                ),
                EventChoice(
                    choice_id="invest_moderately",
                    description="Invest moderately (-15% tech cost, -$250,000, +2 happiness)",
                    effects={"technology_cost_bonus": -0.15, "cash_bonus": -250000.0, "happiness_bonus": 2}
                ),
                EventChoice(
                    choice_id="cancel_program",
                    description="Cancel program (+$300,000, -4 happiness)",
                    effects={"cash_bonus": 300000.0, "happiness_bonus": -4}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_technology": 2000},
            base_probability=0.001
        )
        
        # Cultural Heritage Protection
        self.events["cultural_heritage_protection"] = RandomEvent(
            name="Cultural Heritage Protection",
            description="Cultural heritage site protection debate.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="protect_fully",
                    description="Protect fully (+3 happiness, -$100,000)",
                    effects={"happiness_bonus": 3, "cash_bonus": -100000.0}
                ),
                EventChoice(
                    choice_id="protect_partially",
                    description="Protect partially (+1 happiness, -$50,000)",
                    effects={"happiness_bonus": 1, "cash_bonus": -50000.0}
                ),
                EventChoice(
                    choice_id="develop_site",
                    description="Develop site (+$200,000, -3 happiness)",
                    effects={"cash_bonus": 200000.0, "happiness_bonus": -3}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_infrastructure": 1000},
            base_probability=0.003
        )
        
        # Intelligence Agency Expansion
        self.events["intelligence_agency_expansion"] = RandomEvent(
            name="Intelligence Agency Expansion",
            description="Intelligence agency expansion proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="expand_significantly",
                    description="Expand significantly (+20% spy success, -$300,000)",
                    effects={"spy_success_bonus": 0.20, "cash_bonus": -300000.0}
                ),
                EventChoice(
                    choice_id="expand_moderately",
                    description="Expand moderately (+10% spy success, -$150,000)",
                    effects={"spy_success_bonus": 0.10, "cash_bonus": -150000.0}
                ),
                EventChoice(
                    choice_id="reduce_agency",
                    description="Reduce agency (+$200,000, -10% spy defense)",
                    effects={"cash_bonus": 200000.0, "spy_defense_bonus": -0.10}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_technology": 1000},
            base_probability=0.003
        )
        
        # Public Transportation Initiative
        self.events["public_transportation_initiative"] = RandomEvent(
            name="Public Transportation Initiative",
            description="Public transportation initiative proposed.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="implement_comprehensive",
                    description="Implement comprehensive (+3 happiness, -$400,000, -2 pollution)",
                    effects={"happiness_bonus": 3, "cash_bonus": -400000.0, "pollution_increase": -2}
                ),
                EventChoice(
                    choice_id="implement_limited",
                    description="Implement limited (+1 happiness, -$200,000, -1 pollution)",
                    effects={"happiness_bonus": 1, "cash_bonus": -200000.0, "pollution_increase": -1}
                ),
                EventChoice(
                    choice_id="private_sector",
                    description="Private sector (+$150,000, +1 pollution)",
                    effects={"cash_bonus": 150000.0, "pollution_increase": 1}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_infrastructure": 2000},
            base_probability=0.003
        )
        
        # Nuclear Energy Debate
        self.events["nuclear_energy_debate"] = RandomEvent(
            name="Nuclear Energy Debate",
            description="Nuclear energy program debate divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="build_plants",
                    description="Build nuclear plants (+10% tax income, -$500,000, +2 pollution)",
                    effects={"tax_income_bonus": 0.10, "cash_bonus": -500000.0, "pollution_increase": 2}
                ),
                EventChoice(
                    choice_id="research_alternatives",
                    description="Research alternatives (-10% tech cost, -$300,000)",
                    effects={"technology_cost_bonus": -0.10, "cash_bonus": -300000.0}
                ),
                EventChoice(
                    choice_id="ban_nuclear",
                    description="Ban nuclear (+3 happiness, -5% tax income)",
                    effects={"happiness_bonus": 3, "tax_income_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_technology": 1500},
            base_probability=0.002
        )
        
        # Foreign Investment Offer
        self.events["foreign_investment_offer"] = RandomEvent(
            name="Foreign Investment Offer",
            description="Foreign corporation offers major investment.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="accept_full",
                    description="Accept fully (+$500,000, -2 happiness, +2 pollution)",
                    effects={"cash_bonus": 500000.0, "happiness_bonus": -2, "pollution_increase": 2}
                ),
                EventChoice(
                    choice_id="accept_conditional",
                    description="Accept conditional (+$300,000, -1 happiness)",
                    effects={"cash_bonus": 300000.0, "happiness_bonus": -1}
                ),
                EventChoice(
                    choice_id="reject",
                    description="Reject (+2 happiness)",
                    effects={"happiness_bonus": 2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_infrastructure": 1500},
            base_probability=0.003
        )
        
        # Digital Privacy Legislation
        self.events["digital_privacy_legislation"] = RandomEvent(
            name="Digital Privacy Legislation",
            description="Digital privacy legislation proposed.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="strong_privacy",
                    description="Strong privacy (+2 happiness, -5% spy success)",
                    effects={"happiness_bonus": 2, "spy_success_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="moderate_privacy",
                    description="Moderate privacy (+1 happiness)",
                    effects={"happiness_bonus": 1}
                ),
                EventChoice(
                    choice_id="weak_privacy",
                    description="Weak privacy (+$100,000, -2 happiness, +5% spy success)",
                    effects={"cash_bonus": 100000.0, "happiness_bonus": -2, "spy_success_bonus": 0.05}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_technology": 1000},
            base_probability=0.003
        )
        
        # Currency Policy Decision
        self.events["currency_policy_decision"] = RandomEvent(
            name="Currency Policy Decision",
            description="Currency policy decision affects economy.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="devalue",
                    description="Devalue currency (+15% trade income, -$200,000)",
                    effects={"trade_income_bonus": 0.15, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="strengthen",
                    description="Strengthen currency (+$150,000, -10% trade income)",
                    effects={"cash_bonus": 150000.0, "trade_income_bonus": -0.10}
                ),
                EventChoice(
                    choice_id="maintain",
                    description="Maintain current (+$50,000)",
                    effects={"cash_bonus": 50000.0}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"has_harbor": True},
            base_probability=0.003
        )
        
        # Sports Complex Proposal
        self.events["sports_complex_proposal"] = RandomEvent(
            name="Sports Complex Proposal",
            description="Sports complex proposal divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="build_large",
                    description="Build large complex (+4 happiness, -$300,000)",
                    effects={"happiness_bonus": 4, "cash_bonus": -300000.0}
                ),
                EventChoice(
                    choice_id="build_medium",
                    description="Build medium complex (+2 happiness, -$150,000)",
                    effects={"happiness_bonus": 2, "cash_bonus": -150000.0}
                ),
                EventChoice(
                    choice_id="private_funding",
                    description="Private funding (+$100,000, -1 happiness)",
                    effects={"cash_bonus": 100000.0, "happiness_bonus": -1}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_infrastructure": 1000},
            base_probability=0.003
        )
        
        # Water Management Crisis
        self.events["water_management_crisis"] = RandomEvent(
            name="Water Management Crisis",
            description="Water management crisis requires action.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="invest_desalination",
                    description="Invest desalination (+3 happiness, -$400,000, +1% pop growth)",
                    effects={"happiness_bonus": 3, "cash_bonus": -400000.0, "population_growth_bonus": 0.01}
                ),
                EventChoice(
                    choice_id="invest_conservation",
                    description="Invest conservation (+1 happiness, -$200,000)",
                    effects={"happiness_bonus": 1, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="ration_water",
                    description="Ration water (+$100,000, -3 happiness)",
                    effects={"cash_bonus": 100000.0, "happiness_bonus": -3}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-4 happiness, -2% population)",
                    effects={"happiness_bonus": -4, "population_loss": 0.02}
                )
            ],
            requirements={"min_population": 12000},
            base_probability=0.003
        )
        
        # Tourism Development Proposal
        self.events["tourism_development_proposal"] = RandomEvent(
            name="Tourism Development Proposal",
            description="Tourism development proposal divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="develop_luxury",
                    description="Develop luxury (+25% commerce income, -$400,000, +2 pollution)",
                    effects={"commerce_income_bonus": 0.25, "cash_bonus": -400000.0, "pollution_increase": 2}
                ),
                EventChoice(
                    choice_id="develop_eco",
                    description="Develop eco-tourism (+15% commerce income, -$300,000, -1 pollution)",
                    effects={"commerce_income_bonus": 0.15, "cash_bonus": -300000.0, "pollution_increase": -1}
                ),
                EventChoice(
                    choice_id="reject",
                    description="Reject (+$150,000)",
                    effects={"cash_bonus": 150000.0}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"has_harbor": True},
            base_probability=0.003
        )
        
        # Immigration Policy Debate
        self.events["immigration_policy_debate"] = RandomEvent(
            name="Immigration Policy Debate",
            description="Immigration policy debate divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="open_borders",
                    description="Open borders (+4 happiness, +4% pop growth, -5% tax income)",
                    effects={"happiness_bonus": 4, "population_growth_bonus": 0.04, "tax_income_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="moderate_policy",
                    description="Moderate policy (+2 happiness, +2% pop growth)",
                    effects={"happiness_bonus": 2, "population_growth_bonus": 0.02}
                ),
                EventChoice(
                    choice_id="restrict_immigration",
                    description="Restrict immigration (+3% tax income, -3 happiness)",
                    effects={"tax_income_bonus": 0.03, "happiness_bonus": -3}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_population": 10000},
            base_probability=0.003
        )
        
        # Defense System Upgrade
        self.events["defense_system_upgrade"] = RandomEvent(
            name="Defense System Upgrade",
            description="Defense system upgrade proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="upgrade_comprehensive",
                    description="Upgrade comprehensive (+15% spy defense, -$400,000)",
                    effects={"spy_defense_bonus": 0.15, "cash_bonus": -400000.0}
                ),
                EventChoice(
                    choice_id="upgrade_limited",
                    description="Upgrade limited (+8% spy defense, -$200,000)",
                    effects={"spy_defense_bonus": 0.08, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="maintain",
                    description="Maintain current (+$100,000, -5% spy defense)",
                    effects={"cash_bonus": 100000.0, "spy_defense_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_infrastructure": 1500},
            base_probability=0.003
        )
        
        # Agricultural Technology Investment
        self.events["agricultural_tech_investment"] = RandomEvent(
            name="Agricultural Technology Investment",
            description="Agricultural technology investment proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="invest_heavily",
                    description="Invest heavily (+20% resource production, -$350,000)",
                    effects={"resource_production_bonus": 0.20, "cash_bonus": -350000.0}
                ),
                EventChoice(
                    choice_id="invest_moderately",
                    description="Invest moderately (+10% resource production, -$175,000)",
                    effects={"resource_production_bonus": 0.10, "cash_bonus": -175000.0}
                ),
                EventChoice(
                    choice_id="traditional_methods",
                    description="Traditional methods (+$100,000, -5% resource production)",
                    effects={"cash_bonus": 100000.0, "resource_production_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_infrastructure": 1000},
            base_probability=0.003
        )
        
        # Medical Research Funding
        self.events["medical_research_funding"] = RandomEvent(
            name="Medical Research Funding",
            description="Medical research funding proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="fund_heavily",
                    description="Fund heavily (+3 happiness, +3% pop growth, -$400,000)",
                    effects={"happiness_bonus": 3, "population_growth_bonus": 0.03, "cash_bonus": -400000.0}
                ),
                EventChoice(
                    choice_id="fund_moderately",
                    description="Fund moderately (+1 happiness, +1% pop growth, -$200,000)",
                    effects={"happiness_bonus": 1, "population_growth_bonus": 0.01, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="private_research",
                    description="Private research (+$150,000, -2 happiness)",
                    effects={"cash_bonus": 150000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_technology": 1000},
            base_probability=0.003
        )
        
        # Urban Renewal Project
        self.events["urban_renewal_project"] = RandomEvent(
            name="Urban Renewal Project",
            description="Urban renewal project proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="renew_comprehensive",
                    description="Renew comprehensive (+4 happiness, -$450,000, +100 infrastructure)",
                    effects={"happiness_bonus": 4, "cash_bonus": -450000.0, "infrastructure": 100}
                ),
                EventChoice(
                    choice_id="renew_targeted",
                    description="Renew targeted (+2 happiness, -$225,000, +50 infrastructure)",
                    effects={"happiness_bonus": 2, "cash_bonus": -225000.0, "infrastructure": 50}
                ),
                EventChoice(
                    choice_id="private_development",
                    description="Private development (+$200,000, -2 happiness)",
                    effects={"cash_bonus": 200000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_infrastructure": 2000},
            base_probability=0.003
        )
        
        # Cybersecurity Investment
        self.events["cybersecurity_investment"] = RandomEvent(
            name="Cybersecurity Investment",
            description="Cybersecurity investment proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="invest_heavily",
                    description="Invest heavily (+20% spy defense, -$300,000)",
                    effects={"spy_defense_bonus": 0.20, "cash_bonus": -300000.0}
                ),
                EventChoice(
                    choice_id="invest_moderately",
                    description="Invest moderately (+10% spy defense, -$150,000)",
                    effects={"spy_defense_bonus": 0.10, "cash_bonus": -150000.0}
                ),
                EventChoice(
                    choice_id="minimal_security",
                    description="Minimal security (+$100,000, -5% spy defense)",
                    effects={"cash_bonus": 100000.0, "spy_defense_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_technology": 1500},
            base_probability=0.003
        )
        
        # Mining Regulation
        self.events["mining_regulation"] = RandomEvent(
            name="Mining Regulation",
            description="Mining regulation proposal divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="strict_regulation",
                    description="Strict regulation (-2 pollution, -10% resource production, -$100,000)",
                    effects={"pollution_increase": -2, "resource_production_bonus": -0.10, "cash_bonus": -100000.0}
                ),
                EventChoice(
                    choice_id="moderate_regulation",
                    description="Moderate regulation (-1 pollution, -5% resource production)",
                    effects={"pollution_increase": -1, "resource_production_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="deregulate",
                    description="Deregulate (+15% resource production, +2 pollution, +$100,000)",
                    effects={"resource_production_bonus": 0.15, "pollution_increase": 2, "cash_bonus": 100000.0}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness, +1 pollution)",
                    effects={"happiness_bonus": -1, "pollution_increase": 1}
                )
            ],
            requirements={"min_infrastructure": 1500},
            base_probability=0.003
        )
        
        # Public Housing Initiative
        self.events["public_housing_initiative"] = RandomEvent(
            name="Public Housing Initiative",
            description="Public housing initiative proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="build_extensive",
                    description="Build extensive (+4 happiness, +3% pop growth, -$400,000)",
                    effects={"happiness_bonus": 4, "population_growth_bonus": 0.03, "cash_bonus": -400000.0}
                ),
                EventChoice(
                    choice_id="build_limited",
                    description="Build limited (+2 happiness, +1% pop growth, -$200,000)",
                    effects={"happiness_bonus": 2, "population_growth_bonus": 0.01, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="private_housing",
                    description="Private housing (+$150,000, -2 happiness)",
                    effects={"cash_bonus": 150000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_population": 15000},
            base_probability=0.003
        )
        
        # Telecommunications Upgrade
        self.events["telecommunications_upgrade"] = RandomEvent(
            name="Telecommunications Upgrade",
            description="Telecommunications upgrade proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="upgrade_advanced",
                    description="Upgrade advanced (+8% tax income, -$350,000, +5% spy defense)",
                    effects={"tax_income_bonus": 0.08, "cash_bonus": -350000.0, "spy_defense_bonus": 0.05}
                ),
                EventChoice(
                    choice_id="upgrade_basic",
                    description="Upgrade basic (+4% tax income, -$175,000)",
                    effects={"tax_income_bonus": 0.04, "cash_bonus": -175000.0}
                ),
                EventChoice(
                    choice_id="maintain_legacy",
                    description="Maintain legacy (+$100,000, -2% tax income)",
                    effects={"cash_bonus": 100000.0, "tax_income_bonus": -0.02}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_technology": 1200},
            base_probability=0.003
        )
        
        # Food Safety Regulation
        self.events["food_safety_regulation"] = RandomEvent(
            name="Food Safety Regulation",
            description="Food safety regulation proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="strict_regulation",
                    description="Strict regulation (+3 happiness, -$150,000, -5% resource production)",
                    effects={"happiness_bonus": 3, "cash_bonus": -150000.0, "resource_production_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="moderate_regulation",
                    description="Moderate regulation (+1 happiness, -$75,000)",
                    effects={"happiness_bonus": 1, "cash_bonus": -75000.0}
                ),
                EventChoice(
                    choice_id="light_regulation",
                    description="Light regulation (+$100,000, -2 happiness)",
                    effects={"cash_bonus": 100000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_population": 8000},
            base_probability=0.003
        )
        
        # Renewable Energy Mandate
        self.events["renewable_energy_mandate"] = RandomEvent(
            name="Renewable Energy Mandate",
            description="Renewable energy mandate proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="implement_aggressive",
                    description="Implement aggressive (-4 pollution, -$450,000, -3% tax income)",
                    effects={"pollution_increase": -4, "cash_bonus": -450000.0, "tax_income_bonus": -0.03}
                ),
                EventChoice(
                    choice_id="implement_gradual",
                    description="Implement gradual (-2 pollution, -$225,000)",
                    effects={"pollution_increase": -2, "cash_bonus": -225000.0}
                ),
                EventChoice(
                    choice_id="voluntary_program",
                    description="Voluntary program (+$100,000, +1 pollution)",
                    effects={"cash_bonus": 100000.0, "pollution_increase": 1}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness, +2 pollution)",
                    effects={"happiness_bonus": -2, "pollution_increase": 2}
                )
            ],
            requirements={"min_infrastructure": 1500},
            base_probability=0.003
        )
        
        # Labor Rights Legislation
        self.events["labor_rights_legislation"] = RandomEvent(
            name="Labor Rights Legislation",
            description="Labor rights legislation proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="strong_protections",
                    description="Strong protections (+4 happiness, -8% tax income)",
                    effects={"happiness_bonus": 4, "tax_income_bonus": -0.08}
                ),
                EventChoice(
                    choice_id="moderate_protections",
                    description="Moderate protections (+2 happiness, -4% tax income)",
                    effects={"happiness_bonus": 2, "tax_income_bonus": -0.04}
                ),
                EventChoice(
                    choice_id="minimal_protections",
                    description="Minimal protections (+4% tax income, -2 happiness)",
                    effects={"tax_income_bonus": 0.04, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_infrastructure": 2000},
            base_probability=0.003
        )
        
        # Space Debris Crisis
        self.events["space_debris_crisis"] = RandomEvent(
            name="Space Debris Crisis",
            description="Space debris threatens satellites.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="cleanup_mission",
                    description="Cleanup mission (+2 happiness, -$200,000, -5% tech cost)",
                    effects={"happiness_bonus": 2, "cash_bonus": -200000.0, "technology_cost_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="debris_tracking",
                    description="Debris tracking (+1 happiness, -$100,000)",
                    effects={"happiness_bonus": 1, "cash_bonus": -100000.0}
                ),
                EventChoice(
                    choice_id="ignore",
                    description="Ignore (+$50,000, -2 happiness)",
                    effects={"cash_bonus": 50000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_technology": 2000},
            base_probability=0.002
        )
        
        # Genetic Research Ethics
        self.events["genetic_research_ethics"] = RandomEvent(
            name="Genetic Research Ethics",
            description="Genetic research ethics debate.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="allow_research",
                    description="Allow research (-10% tech cost, -$200,000, -1 happiness)",
                    effects={"technology_cost_bonus": -0.10, "cash_bonus": -200000.0, "happiness_bonus": -1}
                ),
                EventChoice(
                    choice_id="restrict_research",
                    description="Restrict research (+2 happiness, -$100,000)",
                    effects={"happiness_bonus": 2, "cash_bonus": -100000.0}
                ),
                EventChoice(
                    choice_id="ban_research",
                    description="Ban research (+3 happiness, +5% tech cost)",
                    effects={"happiness_bonus": 3, "technology_cost_bonus": 0.05}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_technology": 1500},
            base_probability=0.002
        )
        
        # Ocean Resource Exploration
        self.events["ocean_resource_exploration"] = RandomEvent(
            name="Ocean Resource Exploration",
            description="Ocean resource exploration proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="explore_heavily",
                    description="Explore heavily (+20% resource production, -$400,000, +2 pollution)",
                    effects={"resource_production_bonus": 0.20, "cash_bonus": -400000.0, "pollution_increase": 2}
                ),
                EventChoice(
                    choice_id="explore_moderately",
                    description="Explore moderately (+10% resource production, -$200,000)",
                    effects={"resource_production_bonus": 0.10, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="protect_oceans",
                    description="Protect oceans (+1 environment, +2 happiness)",
                    effects={"environment": 1, "happiness_bonus": 2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"has_harbor": True},
            base_probability=0.003
        )
        
        # Artificial Intelligence Regulation
        self.events["ai_regulation"] = RandomEvent(
            name="AI Regulation",
            description="Artificial intelligence regulation debate.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MINOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="strict_regulation",
                    description="Strict regulation (+2 happiness, -8% tech cost)",
                    effects={"happiness_bonus": 2, "technology_cost_bonus": -0.08}
                ),
                EventChoice(
                    choice_id="light_regulation",
                    description="Light regulation (+1 happiness, -3% tech cost)",
                    effects={"happiness_bonus": 1, "technology_cost_bonus": -0.03}
                ),
                EventChoice(
                    choice_id="no_regulation",
                    description="No regulation (-15% tech cost, -$150,000, -2 happiness)",
                    effects={"technology_cost_bonus": -0.15, "cash_bonus": -150000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-1 happiness)",
                    effects={"happiness_bonus": -1}
                )
            ],
            requirements={"min_technology": 2000},
            base_probability=0.002
        )
        
        # Arctic Resource Rights
        self.events["arctic_resource_rights"] = RandomEvent(
            name="Arctic Resource Rights",
            description="Arctic resource rights dispute.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="claim_rights",
                    description="Claim rights (+15% resource production, -$300,000, -2 happiness)",
                    effects={"resource_production_bonus": 0.15, "cash_bonus": -300000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="negotiate_sharing",
                    description="Negotiate sharing (+8% resource production, -$150,000)",
                    effects={"resource_production_bonus": 0.08, "cash_bonus": -150000.0}
                ),
                EventChoice(
                    choice_id="abandon_claims",
                    description="Abandon claims (+2 happiness)",
                    effects={"happiness_bonus": 2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_technology": 1500},
            base_probability=0.002
        )
        
        # Pandemic Preparedness
        self.events["pandemic_preparedness"] = RandomEvent(
            name="Pandemic Preparedness",
            description="Pandemic preparedness investment proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="invest_heavily",
                    description="Invest heavily (+3 happiness, -$350,000, +2% pop growth)",
                    effects={"happiness_bonus": 3, "cash_bonus": -350000.0, "population_growth_bonus": 0.02}
                ),
                EventChoice(
                    choice_id="invest_moderately",
                    description="Invest moderately (+1 happiness, -$175,000)",
                    effects={"happiness_bonus": 1, "cash_bonus": -175000.0}
                ),
                EventChoice(
                    choice_id="minimal_preparedness",
                    description="Minimal preparedness (+$100,000, -2 happiness)",
                    effects={"cash_bonus": 100000.0, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_population": 10000},
            base_probability=0.003
        )
        
        # Quantum Computing Investment
        self.events["quantum_computing_investment"] = RandomEvent(
            name="Quantum Computing Investment",
            description="Quantum computing investment proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="invest_aggressively",
                    description="Invest aggressively (-25% tech cost, -$600,000, +4 happiness)",
                    effects={"technology_cost_bonus": -0.25, "cash_bonus": -600000.0, "happiness_bonus": 4}
                ),
                EventChoice(
                    choice_id="invest_moderately",
                    description="Invest moderately (-15% tech cost, -$300,000, +2 happiness)",
                    effects={"technology_cost_bonus": -0.15, "cash_bonus": -300000.0, "happiness_bonus": 2}
                ),
                EventChoice(
                    choice_id="wait_develop",
                    description="Wait and develop (+$200,000, -1 happiness)",
                    effects={"cash_bonus": 200000.0, "happiness_bonus": -1}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_technology": 2500},
            base_probability=0.001
        )
        
        # Lunar Base Proposal
        self.events["lunar_base_proposal"] = RandomEvent(
            name="Lunar Base Proposal",
            description="Lunar base proposal divides nation.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="build_base",
                    description="Build base (-30% tech cost, -$800,000, +5 happiness)",
                    effects={"technology_cost_bonus": -0.30, "cash_bonus": -800000.0, "happiness_bonus": 5}
                ),
                EventChoice(
                    choice_id="joint_mission",
                    description="Joint mission (-20% tech cost, -$400,000, +3 happiness)",
                    effects={"technology_cost_bonus": -0.20, "cash_bonus": -400000.0, "happiness_bonus": 3}
                ),
                EventChoice(
                    choice_id="cancel_program",
                    description="Cancel program (+$500,000, -4 happiness)",
                    effects={"cash_bonus": 500000.0, "happiness_bonus": -4}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_technology": 3000},
            base_probability=0.001
        )
        
        # Climate Change Summit
        self.events["climate_change_summit"] = RandomEvent(
            name="Climate Change Summit",
            description="Climate change summit requires commitment.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="commit_strong",
                    description="Commit strong (-5 pollution, -$500,000, -3% tax income)",
                    effects={"pollution_increase": -5, "cash_bonus": -500000.0, "tax_income_bonus": -0.03}
                ),
                EventChoice(
                    choice_id="commit_moderate",
                    description="Commit moderate (-3 pollution, -$250,000)",
                    effects={"pollution_increase": -3, "cash_bonus": -250000.0}
                ),
                EventChoice(
                    choice_id="reject_commitment",
                    description="Reject commitment (+$300,000, +3 pollution, -2 happiness)",
                    effects={"cash_bonus": 300000.0, "pollution_increase": 3, "happiness_bonus": -2}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-3 happiness, +2 pollution)",
                    effects={"happiness_bonus": -3, "pollution_increase": 2}
                )
            ],
            requirements={"min_infrastructure": 2000},
            base_probability=0.002
        )
        
        # Global Trade Organization
        self.events["global_trade_organization"] = RandomEvent(
            name="Global Trade Organization",
            description="Global trade organization membership decision.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MAJOR,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="join_full",
                    description="Join full membership (+25% trade income, -$400,000, -5% resource production)",
                    effects={"trade_income_bonus": 0.25, "cash_bonus": -400000.0, "resource_production_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="associate_member",
                    description="Associate membership (+15% trade income, -$200,000)",
                    effects={"trade_income_bonus": 0.15, "cash_bonus": -200000.0}
                ),
                EventChoice(
                    choice_id="remain_independent",
                    description="Remain independent (+$250,000, -10% trade income)",
                    effects={"cash_bonus": 250000.0, "trade_income_bonus": -0.10}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"has_harbor": True},
            base_probability=0.002
        )
        
        # Universal Basic Income Trial
        self.events["universal_basic_income_trial"] = RandomEvent(
            name="Universal Basic Income Trial",
            description="Universal basic income trial proposal.",
            event_type=EventType.CHOICE,
            severity=EventSeverity.MODERATE,
            is_choice_event=True,
            choices=[
                EventChoice(
                    choice_id="implement_full",
                    description="Implement full (+5 happiness, -$400,000, -5% tax income)",
                    effects={"happiness_bonus": 5, "cash_bonus": -400000.0, "tax_income_bonus": -0.05}
                ),
                EventChoice(
                    choice_id="implement_pilot",
                    description="Implement pilot (+2 happiness, -$200,000, -2% tax income)",
                    effects={"happiness_bonus": 2, "cash_bonus": -200000.0, "tax_income_bonus": -0.02}
                ),
                EventChoice(
                    choice_id="reject",
                    description="Reject (+$150,000, -3 happiness)",
                    effects={"cash_bonus": 150000.0, "happiness_bonus": -3}
                ),
                EventChoice(
                    choice_id="do_nothing",
                    description="Do nothing (-2 happiness)",
                    effects={"happiness_bonus": -2}
                )
            ],
            requirements={"min_population": 12000},
            base_probability=0.003
        )
    
    def roll_event(self, nation_state: Dict[str, float]) -> Optional[RandomEvent]:
        """Roll for a random event to trigger."""
        available_events = []
        
        for event in self.events.values():
            if event.can_trigger(nation_state):
                # Adjust probability based on nation state
                adjusted_probability = event.base_probability
                
                # Higher infrastructure increases event probability
                infra_multiplier = min(2.0, nation_state.get("infrastructure", 0) / 5000.0)
                adjusted_probability *= infra_multiplier
                
                if random.random() < adjusted_probability:
                    available_events.append((event, adjusted_probability))
        
        if available_events:
            # Weighted random selection
            total_weight = sum(prob for event, prob in available_events)
            if total_weight > 0:
                r = random.uniform(0, total_weight)
                cumulative = 0
                for event, prob in available_events:
                    cumulative += prob
                    if r <= cumulative:
                        return event
        
        return None
    
    def activate_event(self, nation_id: str, event: RandomEvent, choice_id: Optional[str] = None) -> Dict[str, float]:
        """Activate an event for a nation."""
        effects = {}
        
        if event.is_choice_event and choice_id:
            # Apply chosen option's effects
            for choice in event.choices:
                if choice.choice_id == choice_id:
                    effects = choice.effects
                    break
        else:
            # Apply automatic event effects
            effects = event.effects
        
        # Track active temporary events
        if event.duration_ticks > 0:
            if nation_id not in self.active_events:
                self.active_events[nation_id] = {}
            self.active_events[nation_id][event.event_id] = event.duration_ticks
        
        return effects
    
    def process_tick(self, current_tick: int):
        """Process all active events for a tick."""
        for nation_id, events in self.active_events.items():
            events_to_remove = []
            
            for event_id, remaining_ticks in events.items():
                events[event_id] = remaining_ticks - 1
                
                if events[event_id] <= 0:
                    events_to_remove.append(event_id)
            
            for event_id in events_to_remove:
                del events[event_id]
    
    def get_active_events(self, nation_id: str) -> List[str]:
        """Get active event IDs for a nation."""
        if nation_id in self.active_events:
            return list(self.active_events[nation_id].keys())
        return []
    
    def get_event(self, event_id: str) -> Optional[RandomEvent]:
        """Get an event by ID."""
        return self.events.get(event_id)


# Singleton instance
event_system = EventSystem()
