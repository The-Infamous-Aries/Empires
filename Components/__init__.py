"""
Empires Game Components (New Async Architecture)

Provides component-based architecture for all Empires game data.
Components are now async and consolidated for better performance and maintainability.
"""

from .base_component import BaseComponent
from .nation_city_component import NationCityComponent
from .govrel_component import GovRelComponent
from .military_war_component import MilitaryWarComponent
from .economy_component import EconomyComponent
from .progression_component import ProgressionComponent
from .diplomacy_component import DiplomacyComponent
from .tick_component import TickComponent

# Standalone components (not merged)
from .alliance_component import AllianceComponent
from .alliance_monuments_component import AllianceMonumentsComponent
from .events_component import EventsComponent
from .formulas_component import FormulasComponent
from .trade_component import TradeComponent
from .turn_component import TurnComponent

__all__ = [
    # New merged async components
    'BaseComponent',
    'NationCityComponent',
    'GovRelComponent',
    'MilitaryWarComponent',
    'EconomyComponent',
    'ProgressionComponent',
    'DiplomacyComponent',
    'TickComponent',
    
    # Standalone components
    'AllianceComponent',
    'AllianceMonumentsComponent',
    'EventsComponent',
    'FormulasComponent',
    'TradeComponent',
    'TurnComponent',
]
