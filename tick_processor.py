"""
Empires Tick Processor

Handles background tick processing for the Empire game.
Each tick represents 1 hour of game time.
Uses async EmpireDB for all persistence.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

from .Database.empire_db import EmpireDB
from .Logic.turn import TurnSystem
from .Logic.events import EventSystem
from .Logic.progression import ProgressionSystem
from .Logic.war import WarSystem

logger = logging.getLogger(__name__)


class EmpiresTickProcessor:
    """Background tick processor for the Empire game."""

    def __init__(self, db: EmpireDB):
        """Initialize the tick processor.

        Args:
            db: EmpireDB instance for all persistence
        """
        self.db = db

        self.turn_system = TurnSystem()
        self.event_system = EventSystem()
        self.progression_system = ProgressionSystem()
        self.war_system = WarSystem()

        self.is_running = False
        self.current_tick = 0
        self.tick_interval = 3600
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        """Start the tick processor loop."""
        if self.is_running:
            logger.warning("Tick processor is already running")
            return

        self.is_running = True
        logger.info("Starting Empire tick processor")

        # Load current tick from database
        latest_tick = await self.db.get_latest_tick()
        if latest_tick:
            self.current_tick = latest_tick['tick_number']
        else:
            await self.db.create_tick(0, 'initialized')

        self._task = asyncio.create_task(self.tick_loop())

    async def stop(self):
        """Stop the tick processor."""
        self.is_running = False
        if self._task:
            self._task.cancel()
            self._task = None
        logger.info("Stopping Empire tick processor")

    async def tick_loop(self):
        """Main tick processing loop."""
        while self.is_running:
            try:
                self.current_tick += 1
                await self.db.create_tick(self.current_tick, 'processing')
                await self.process_tick()
                await self.db.update_tick(self.current_tick, {'status': 'completed'})
                logger.info(f"Processed tick {self.current_tick}")
                await asyncio.sleep(self.tick_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in tick processing: {e}")
                await asyncio.sleep(60)

    async def process_tick(self):
        """Process a single game tick for all nations."""
        try:
            nations = await self.db.get_all_nations()

            for nation in nations:
                try:
                    await self._process_nation_tick(nation)
                except Exception as e:
                    logger.error(f"Error processing tick for nation {nation.get('nation_id')}: {e}")

            await self._update_all_progression()
            await self._update_all_wars()
            await self._process_random_events(nations)

        except Exception as e:
            logger.error(f"Error in process_tick: {e}")
            raise

    async def _process_nation_tick(self, nation: dict):
        """Process tick for a single nation."""
        nation_id = nation['nation_id']
        cities = await self.db.get_nation_cities(nation_id)
        military = await self.db.get_nation_military(nation_id)

        nation_model = self._dict_to_nation_obj(nation)
        city_objs = {c['city_id']: self._dict_to_city_obj(c) for c in cities}

        turn_result = self.turn_system.process_nation_turn(nation_model, city_objs, self.current_tick)

        updates = {
            'cash': turn_result.cash,
            'total_population': turn_result.total_population,
            'total_infrastructure': turn_result.total_infrastructure,
            'happiness': turn_result.happiness,
            'environment': turn_result.environment,
            'anarchy_ticks_remaining': turn_result.anarchy_ticks_remaining,
            'government_change_cooldown': turn_result.government_change_cooldown,
            'policy_change_cooldown': turn_result.policy_change_cooldown,
            'religion_change_cooldown': turn_result.religion_change_cooldown,
            'war_cooldown': turn_result.war_cooldown,
        }
        await self.db.update_nation(nation_id, updates)

    async def _update_all_progression(self):
        """Update progression tiers for all nations."""
        try:
            nations = await self.db.get_all_nations()
            for nation in nations:
                ns = self._calculate_nation_strength(nation)
                tier, progress = self.progression_system.determine_tier_progression(
                    ns, nation.get('total_infrastructure', 0)
                )
                nation['tier'] = tier.name if hasattr(tier, 'name') else str(tier)
                nation['tier_progress'] = progress
                await self.db.update_nation(nation['nation_id'], {
                    'tier': nation['tier'],
                    'tier_progress': progress,
                })
        except Exception as e:
            logger.error(f"Error updating progression: {e}")

    async def _update_all_wars(self):
        """Update war scores and process war mechanics."""
        try:
            wars_data = await self.db.fetchalldict("SELECT * FROM wars WHERE status = 'active'")
            for war_data in wars_data:
                war = self._dict_to_war_obj(war_data)
                self.war_system.process_war_tick(war)
                war_ticks_remaining = getattr(war, 'war_ticks_remaining', 0)
                if war_ticks_remaining <= 0:
                    self.war_system.end_war_by_expiry(war)
                    await self.db.update_war(war_data['war_id'], {'status': 'expired'})
        except Exception as e:
            logger.error(f"Error updating wars: {e}")

    async def _process_random_events(self, nations):
        """Process random events for all nations."""
        try:
            for nation in nations:
                if nation.get('anarchy_ticks_remaining', 0) > 0:
                    continue
                event = self.event_system.roll_random_event()
                if event:
                    self.event_system.activate_event(nation['nation_id'], event)
        except Exception as e:
            logger.error(f"Error processing random events: {e}")

    def _dict_to_nation_obj(self, data: dict):
        """Convert a database dict to a Nation-like object."""
        from types import SimpleNamespace
        nation = SimpleNamespace()
        nation.nation_id = data.get('nation_id')
        nation.nation_name = data.get('nation_name')
        nation.ruler_name = data.get('ruler_name')
        nation.cash = data.get('cash', 0)
        nation.total_population = data.get('total_population', 0)
        nation.total_infrastructure = data.get('total_infrastructure', 0)
        nation.happiness = data.get('happiness', 0)
        nation.environment = data.get('environment', 0)
        nation.anarchy_ticks_remaining = data.get('anarchy_ticks_remaining', 0)
        nation.government_change_cooldown = data.get('government_change_cooldown', 0)
        nation.policy_change_cooldown = data.get('policy_change_cooldown', 0)
        nation.religion_change_cooldown = data.get('religion_change_cooldown', 0)
        nation.war_cooldown = data.get('war_cooldown', 0)
        return nation

    def _dict_to_city_obj(self, data: dict):
        """Convert a database dict to a City-like object."""
        from types import SimpleNamespace
        city = SimpleNamespace()
        city.city_id = data.get('city_id')
        city.city_name = data.get('city_name')
        city.nation_id = data.get('nation_id')
        city.infrastructure = data.get('infrastructure', 0)
        city.land = data.get('land', 0)
        city.population = data.get('population', 0)
        return city

    def _dict_to_war_obj(self, data: dict):
        """Convert a database dict to a War-like object."""
        from types import SimpleNamespace
        war = SimpleNamespace()
        war.war_id = data.get('war_id')
        war.attacker_id = data.get('attacker_id')
        war.defender_id = data.get('defender_id')
        war.status = data.get('status')
        war.war_ticks_remaining = data.get('war_ticks_remaining', 100)
        return war

    def _calculate_nation_strength(self, nation: dict) -> float:
        """Calculate a simple nation strength score."""
        return (
            nation.get('total_infrastructure', 0) * 0.5 +
            nation.get('total_population', 0) * 0.001 +
            nation.get('soldiers', 0) * 0.1 +
            nation.get('tanks', 0) * 0.5 +
            nation.get('aircraft', 0) * 2.0 +
            nation.get('ships', 0) * 3.0
        )

    def get_current_tick(self) -> int:
        """Get the current tick number."""
        return self.current_tick

    def get_tick_status(self) -> dict:
        """Get the status of the tick processor."""
        return {
            "is_running": self.is_running,
            "current_tick": self.current_tick,
            "tick_interval": self.tick_interval
        }


# Global tick processor instance
_tick_processor: Optional[EmpiresTickProcessor] = None


async def initialize_tick_processor(db: EmpireDB) -> EmpiresTickProcessor:
    """Initialize the global tick processor.

    Args:
        db: EmpireDB instance

    Returns:
        EmpiresTickProcessor instance
    """
    global _tick_processor
    if _tick_processor is None:
        _tick_processor = EmpiresTickProcessor(db)
    return _tick_processor


def get_tick_processor() -> Optional[EmpiresTickProcessor]:
    """Get the global tick processor instance."""
    return _tick_processor


async def start_tick_processor():
    """Start the global tick processor."""
    processor = get_tick_processor()
    if processor:
        await processor.start()


async def stop_tick_processor():
    """Stop the global tick processor."""
    processor = get_tick_processor()
    if processor:
        await processor.stop()
