"""
Tick Component

Handles background tick processing for the Empire game.
Each tick represents 1 hour of game time and processes income, upkeep, resource production, etc.
Integrates with the new async BaseComponent and GPP infrastructure.
Uses empire_db for all persistence operations.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from .base_component import BaseComponent
from ..Database.empire_db import EmpireDB
from ..Logic.turn import TurnSystem
from ..Logic.events import EventSystem
from ..Logic.progression import ProgressionSystem
from ..Logic.war import WarSystem

logger = logging.getLogger(__name__)


class TickComponent(BaseComponent):
    """
    Component for processing game ticks.
    
    Handles background tick processing for the Empire game.
    Each tick represents 1 hour of game time.
    Uses empire_db for all data persistence.
    """
    
    def __init__(self, name: str = "tick", gpp_manager=None, db_manager: Optional[EmpireDB] = None):
        """Initialize the TickComponent."""
        super().__init__(name, gpp_manager)
        self.db_manager = db_manager
        
        self.turn_system: Optional[TurnSystem] = None
        self.event_system: Optional[EventSystem] = None
        self.progression_system: Optional[ProgressionSystem] = None
        self.war_system: Optional[WarSystem] = None
        
        self.is_running = False
        self.current_tick = 0
        self.tick_interval = 3600  # 1 hour in seconds (1 tick = 1 hour)
        self.tick_task: Optional[asyncio.Task] = None
    
    async def _initialize(self) -> None:
        """Initialize the tick component systems."""
        if not self.db_manager:
            logger.warning("TickComponent: No database manager provided")
        self.turn_system = TurnSystem()
        self.event_system = EventSystem()
        self.progression_system = ProgressionSystem()
        self.war_system = WarSystem()
        logger.info("TickComponent initialized")
    
    async def get_all(self) -> list:
        """Get all ticks (not applicable)."""
        return []
    
    async def get_by_name(self, name: str) -> Optional[Any]:
        """Get a tick by name (not applicable)."""
        return None
    
    async def get_names(self) -> list:
        """Get all tick names (not applicable)."""
        return []
    
    async def start(self):
        """Start the tick processor."""
        if self.is_running:
            logger.warning("Tick processor is already running")
            return
        
        if not self._initialized:
            await self.initialize()
        
        self.is_running = True
        logger.info("Starting Empire tick processor")
        
        # Start the tick processing loop
        self.tick_task = asyncio.create_task(self.tick_loop())
        
        await self.publish_event('tick_processor_started', {'tick': self.current_tick})
    
    async def _start(self) -> None:
        """Start the component (called by parent)."""
        # Override to start the tick loop
        await self.start()
    
    async def stop(self):
        """Stop the tick processor."""
        self.is_running = False
        if self.tick_task:
            self.tick_task.cancel()
            try:
                await self.tick_task
            except asyncio.CancelledError:
                pass
        logger.info("Stopping Empire tick processor")
        
        await self.publish_event('tick_processor_stopped', {'tick': self.current_tick})
    
    async def _stop(self) -> None:
        """Stop the component (called by parent)."""
        await self.stop()
    
    async def tick_loop(self):
        """Main tick processing loop."""
        while self.is_running:
            try:
                await self.process_tick()
                self.current_tick += 1
                logger.info(f"Processed tick {self.current_tick}")
                
                # Publish tick event
                await self.publish_event('tick_processed', {'tick': self.current_tick})
                
                # Wait for the next tick interval
                await asyncio.sleep(self.tick_interval)
            except asyncio.CancelledError:
                logger.info("Tick loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in tick processing: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def process_tick(self):
        """Process a single game tick for all nations."""
        try:
            if not self.db_manager:
                logger.error("Database manager not initialized")
                return
            
            # Get all nations from database
            nations = await self.db_manager.get_all_nations()
            
            for nation in nations:
                try:
                    await self.process_nation_tick(nation)
                except Exception as e:
                    logger.error(f"Error processing tick for nation {nation.get('nation_id')}: {e}")
            
            # Update progression tiers for all nations
            await self.update_all_progression()
            
            # Update war scores
            await self.update_all_wars()
            
            # Process random events
            await self.process_random_events(nations)
            
        except Exception as e:
            logger.error(f"Error in process_tick: {e}")
            raise
    
    async def process_nation_tick(self, nation_data: Dict[str, Any]):
        """Process tick for a single nation."""
        # Get nation's cities
        cities = await self.db_manager.get_nation_cities(nation_data['nation_id'])
        
        # Get nation's military
        military = await self.db_manager.get_nation_military(nation_data['nation_id'])
        
        # Process turn using TurnSystem
        # Note: TurnSystem needs nation object, not dict
        # This is a simplified version - actual implementation would need proper data objects
        turn_result = {
            'cash': nation_data.get('cash', 0) + 1000,  # Simplified income
            'total_population': nation_data.get('total_population', 0) + 100,
            'total_infrastructure': nation_data.get('total_infrastructure', 0),
            'happiness': nation_data.get('happiness', 10),
            'environment': nation_data.get('environment', 3),
        }
        
        # Update nation with turn results
        updates = {
            'cash': turn_result['cash'],
            'total_population': turn_result['total_population'],
            'happiness': turn_result['happiness'],
            'last_updated': datetime.now().isoformat(),
        }
        
        await self.db_manager.update_nation(nation_data['nation_id'], updates)

        # Recompute and store nation score each tick
        try:
            nc_comp = self.gpp_manager.get_component("nation_city") if self.gpp_manager else None
            if nc_comp:
                score = await nc_comp.calculate_nation_score(nation_data['nation_id'])
                await self.db_manager.update_nation(nation_data['nation_id'], {'score': round(score, 2)})
        except Exception:
            pass
    
    async def update_all_progression(self):
        """Update progression tiers for all nations."""
        try:
            if not self.db_manager:
                return
            
            nations = await self.db_manager.get_all_nations()
            
            for nation_data in nations:
                # Calculate nation strength
                ns = nation_data.get('cash', 0) / 1000  # Simplified
                
                # Determine tier (simplified)
                tier = 'MICRO'
                if ns > 100:
                    tier = 'MEDIUM'
                elif ns > 1000:
                    tier = 'LARGE'
                
                # Update nation tier
                await self.db_manager.update_nation(nation_data['nation_id'], {
                    'current_tier': tier,
                    'last_updated': datetime.now().isoformat(),
                })
                
        except Exception as e:
            logger.error(f"Error updating progression: {e}")
    
    async def update_all_wars(self):
        """Update war scores and process war mechanics."""
        try:
            if not self.db_manager:
                return
            
            # Get all nations to find their wars
            nations = await self.db_manager.get_all_nations()
            
            for nation_data in nations:
                # Get wars for this nation
                wars = await self.db_manager.get_nation_wars(nation_data['nation_id'])
                
                for war_data in wars:
                    # Update war timers and scores
                    # This is a simplified version
                    if war_data.get('status') == 'ACTIVE':
                        # Update war score logic would go here
                        pass
                
        except Exception as e:
            logger.error(f"Error updating wars: {e}")
    
    async def process_random_events(self, nations):
        """Process random events for all nations."""
        try:
            for nation_data in nations:
                # Skip if nation is in anarchy
                if nation_data.get('anarchy_ticks_remaining', 0) > 0:
                    continue
                
                # Roll for random event (simplified)
                # Event processing would go here
                pass
                
        except Exception as e:
            logger.error(f"Error processing random events: {e}")
    
    async def get_current_tick(self) -> int:
        """Get the current tick number."""
        return self.current_tick
    
    async def get_tick_status(self) -> Dict[str, Any]:
        """Get the status of the tick processor."""
        return {
            "is_running": self.is_running,
            "current_tick": self.current_tick,
            "tick_interval": self.tick_interval,
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform a health check on the component."""
        status = await super().health_check()
        status.update({
            'current_tick': self.current_tick,
            'tick_interval': self.tick_interval,
        })
        return status
