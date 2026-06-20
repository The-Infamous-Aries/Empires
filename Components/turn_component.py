"""
Turn Component for Empire Game System

Provides turn processing logic using TurnSystem.
Async version integrated with BaseComponent and GPP infrastructure.
"""

from typing import List, Dict, Any, Optional
from .base_component import BaseComponent
from ..Logic.turn import TurnSystem, TurnResult
from ..Logic.nation import Nation
from ..Logic.city import City


class TurnComponent(BaseComponent):
    """Component for managing turn processing logic."""

    def __init__(self, name: str = "turn", gpp_manager=None):
        """Initialize the turn component."""
        super().__init__(name, gpp_manager)
        self.system: Optional[TurnSystem] = None

    async def _initialize(self) -> None:
        """Initialize the turn system."""
        self.system = TurnSystem()
        self._data = {}

    async def _start(self) -> None:
        pass

    async def get_all(self) -> List[TurnResult]:
        """Get all turn results from the TurnSystem."""
        if self.system:
            return list(self.system.turn_results.values())
        return []

    async def get_by_id(self, nation_id: str) -> Optional[TurnResult]:
        """Get a turn result by nation ID."""
        if self.system:
            return self.system.turn_results.get(nation_id)
        return None

    async def get_by_name(self, name: str) -> Optional[TurnResult]:
        return None

    async def get_names(self) -> List[str]:
        return []

    async def process_nation_turn(self, nation: Nation, cities: Dict[str, City], current_tick: int) -> TurnResult:
        """Process a turn for a single nation using TurnSystem."""
        if not self.system:
            return TurnResult()

        result = self.system.process_nation_turn(nation, cities, current_tick)
        self.system.turn_results[nation.nation_id] = result
        return result

    async def process_all_nations(self, nations: Dict[str, Nation], cities: Dict[str, Dict[str, City]], current_tick: int) -> Dict[str, TurnResult]:
        """Process turns for all nations using TurnSystem."""
        if not self.system:
            return {}

        results = self.system.process_all_nations(nations, cities, current_tick)
        self.system.turn_results.update(results)
        return results

    async def get_current_tick(self) -> int:
        """Get the current tick number."""
        if self.system:
            return self.system.current_tick
        return 0

    async def set_current_tick(self, tick: int) -> None:
        """Set the current tick number."""
        if self.system:
            self.system.current_tick = tick

    async def clear_turn_results(self) -> None:
        """Clear all stored turn results."""
        if self.system:
            self.system.turn_results.clear()
