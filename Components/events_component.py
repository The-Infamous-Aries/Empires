"""
Events Component for Empire Game System

Provides events management using EventSystem.
Async version integrated with BaseComponent and GPP infrastructure.
"""

from typing import List, Dict, Any, Optional
from .base_component import BaseComponent
from ..Logic.events import RandomEvent, EventType, EventSeverity, EventChoice, EventSystem


class EventsComponent(BaseComponent):
    """Component for managing events logic and calculations."""

    def __init__(self, name: str = "events", gpp_manager=None):
        """Initialize the events component."""
        super().__init__(name, gpp_manager)
        self.system: Optional[EventSystem] = None

    async def _initialize(self) -> None:
        """Initialize the events system."""
        self.system = EventSystem()
        self._data = {}

    async def _start(self) -> None:
        pass

    async def get_all(self) -> List[RandomEvent]:
        """Get all events from EventSystem."""
        if self.system:
            return list(self.system.events.values())
        return []

    async def get_by_id(self, event_id: str) -> Optional[RandomEvent]:
        """Get an event by ID."""
        if self.system:
            return self.system.get_event(event_id)
        return None

    async def get_by_name(self, name: str) -> Optional[RandomEvent]:
        """Get an event by name."""
        for event in await self.get_all():
            if event.name == name:
                return event
        return None

    async def get_names(self) -> List[str]:
        """Get all event names."""
        return [event.name for event in await self.get_all()]

    async def roll_event(self, nation_state: Dict[str, float]) -> Optional[RandomEvent]:
        """Roll for a random event to trigger."""
        if self.system:
            return self.system.roll_event(nation_state)
        return None

    async def activate_event(self, nation_id: str, event: RandomEvent, choice_id: Optional[str] = None) -> Dict[str, float]:
        """Activate an event for a nation."""
        if self.system:
            return self.system.activate_event(nation_id, event, choice_id)
        return {}

    async def process_tick(self, current_tick: int) -> None:
        """Process all active events for a tick."""
        if self.system:
            self.system.process_tick(current_tick)

    async def get_active_events(self, nation_id: str) -> List[str]:
        """Get active event IDs for a nation."""
        if self.system:
            return self.system.get_active_events(nation_id)
        return []

    async def can_trigger(self, event: RandomEvent, nation_state: Dict[str, float]) -> bool:
        """Check if event can trigger based on nation state."""
        return event.can_trigger(nation_state)

    async def apply_effects(self, event: RandomEvent, nation_state: Dict[str, float]) -> Dict[str, float]:
        """Apply event effects to nation state."""
        return event.apply_effects(nation_state)
