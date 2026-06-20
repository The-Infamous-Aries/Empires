"""
Nation and City Component (Merged)

Handles nation and city-related game data and operations.
Integrates with the new async BaseComponent and GPP infrastructure.
Uses empire_db for all persistence operations.
"""

import uuid
import json as _json
from typing import List, Dict, Any, Optional
import logging

from .base_component import BaseComponent
from ..Database.empire_db import EmpireDB

logger = logging.getLogger(__name__)


class NationCityComponent(BaseComponent):
    """
    Merged component for Nation and City operations.
    
    Combines nation and city management into a single component for better cohesion.
    Uses empire_db for all data persistence.
    """
    
    def __init__(self, name: str = "nation_city", gpp_manager=None, db_manager: Optional[EmpireDB] = None):
        """Initialize the NationCityComponent."""
        super().__init__(name, gpp_manager)
        self.db_manager = db_manager
    
    async def _initialize(self) -> None:
        """Initialize the component by loading data from database."""
        if not self.db_manager:
            logger.warning("NationCityComponent: No database manager provided")
        logger.info("NationCityComponent initialized")
    
    async def get_all(self) -> List[Dict[str, Any]]:
        """Get all nations from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_all_nations()
    
    async def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a nation by name."""
        if not self.db_manager:
            return None
        nations = await self.db_manager.get_all_nations()
        for nation in nations:
            if nation.get('nation_name') == name:
                return nation
        return None
    
    async def get_names(self) -> List[str]:
        """Get all nation names."""
        if not self.db_manager:
            return []
        nations = await self.db_manager.get_all_nations()
        return [nation.get('nation_name', '') for nation in nations]
    
    async def get_nation_by_id(self, nation_id: str) -> Optional[Dict[str, Any]]:
        """Get a nation by ID from database."""
        if not self.db_manager:
            return None
        return await self.db_manager.get_nation(nation_id)
    
    async def get_cities_for_nation(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all cities for a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_cities(nation_id)
    
    async def get_city_by_id(self, city_id: str) -> Optional[Dict[str, Any]]:
        """Get a city by ID from database."""
        if not self.db_manager:
            return None
        return await self.db_manager.get_city(city_id)
    
    async def create_nation(self, nation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new nation in the database with capital city and military record.
        
        Args:
            nation_data: Dictionary containing nation data
        
        Returns:
            Created nation data dictionary
        """
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        nation_id = nation_data.get('nation_id')
        nation_name = nation_data.get('nation_name')
        capital_city_name = nation_data.get('capital_city_name', 'Capital')
        resource_1 = nation_data.get('resource_1', 'GRAIN')
        
        # Create nation in database
        await self.db_manager.create_nation(
            nation_id=nation_id,
            nation_name=nation_name,
            ruler_name=nation_data.get('ruler_name'),
            capital_city_name=capital_city_name,
            national_color=nation_data.get('national_color'),
            government_type=nation_data.get('government_type'),
            religion_type=nation_data.get('religion_type'),
            war_policy_type=nation_data.get('war_policy_type', 'NEUTRAL'),
            domestic_policy_type=nation_data.get('domestic_policy_type', 'BALANCED'),
            resource_1=resource_1,
            resource_2=nation_data.get('resource_2'),
        )
        
        # Update with additional fields
        additional_fields = {
            'cash': nation_data.get('cash', 10000000.0),
            'technology': nation_data.get('technology', 0),
            'total_infrastructure': nation_data.get('total_infrastructure', 1000),
            'total_land': nation_data.get('total_land', 1000),
            'total_population': nation_data.get('total_population', 0),
            'happiness': nation_data.get('happiness', 10),
            'environment': nation_data.get('environment', 3),
            'tax_rate': nation_data.get('tax_rate', 0.30),
            'citizen_income': nation_data.get('citizen_income', 5.0),
            'trade_posts_built': nation_data.get('trade_posts_built', 0),
            'trade_slots_available': nation_data.get('trade_slots_available', 0),
            'alliance_id': nation_data.get('alliance_id'),
            'alliance_role': nation_data.get('alliance_role'),
            'is_beige': nation_data.get('is_beige', False),
            'beige_ticks_remaining': nation_data.get('beige_ticks_remaining', 0),
            'current_tier': nation_data.get('current_tier', 'MICRO'),
            'tier_progress': nation_data.get('tier_progress', 0.0),
            'anarchy_ticks_remaining': nation_data.get('anarchy_ticks_remaining', 0),
            'government_change_cooldown': nation_data.get('government_change_cooldown', 0),
            'policy_change_cooldown': nation_data.get('policy_change_cooldown', 0),
            'religion_change_cooldown': nation_data.get('religion_change_cooldown', 0),
            'war_cooldown': nation_data.get('war_cooldown', 0),
        }
        
        await self.db_manager.update_nation(nation_id, additional_fields)

        # Create capital city
        city_id = str(uuid.uuid4())
        await self.db_manager.create_city(
            city_id=city_id,
            nation_id=nation_id,
            city_name=capital_city_name
        )
        await self.db_manager.update_city(city_id, {
            'infrastructure': 1000,
            'land': 1000,
            'population': 0,
            'is_capital': True,
            'environment': 50.0,
            'improvement_slots': 0,
        })
        
        # Update nation's city_ids with capital
        await self.db_manager.update_nation(nation_id, {
            'city_ids': _json.dumps([city_id])
        })

        # Create military record with starting units
        military_id = str(uuid.uuid4())
        await self.db_manager.create_military(
            military_id=military_id,
            nation_id=nation_id,
            soldiers=250,
            tanks=0,
        )
        # Set soldier cap
        await self.db_manager.update_military(military_id, {
            'soldier_cap': 500,
            'tank_cap': 25,
            'aircraft_cap': 10,
            'ship_cap': 5,
            'missile_cap': 10,
            'nuke_cap': 1,
            'spy_cap': 5,
        })

        # Create initial nation resource
        resource_id = str(uuid.uuid4())
        await self.db_manager.create_nation_resource(
            resource_id=resource_id,
            nation_id=nation_id,
            resource_type=resource_1,
            amount=100.0,
            production_rate=5.0
        )
        
        await self.publish_event('nation_created', {'nation_id': nation_id})

        # Compute and store initial score
        try:
            score = await self.calculate_nation_score(nation_id)
            await self.db_manager.update_nation(nation_id, {'score': round(score, 2)})
        except Exception:
            pass

        # Return created nation
        return await self.db_manager.get_nation(nation_id)
    
    async def create_city(self, city_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new city in the database.
        
        Args:
            city_data: Dictionary containing city data
        
        Returns:
            Created city data dictionary
        """
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        # Create city in database
        await self.db_manager.create_city(
            city_id=city_data.get('city_id'),
            nation_id=city_data.get('nation_id'),
            city_name=city_data.get('city_name')
        )
        
        # Update with additional fields
        additional_fields = {
            'infrastructure': city_data.get('infrastructure', 1000),
            'land': city_data.get('land', 1000),
            'population': city_data.get('population', 0),
            'crime': city_data.get('crime', 0.0),
            'disease': city_data.get('disease', 0.0),
            'pollution': city_data.get('pollution', 0.0),
            'resistance': city_data.get('resistance', 100),
            'environment': city_data.get('environment', 3),
            'is_capital': city_data.get('is_capital', False),
            'improvement_slots': city_data.get('improvement_slots', 0),
        }
        
        await self.db_manager.update_city(city_data.get('city_id'), additional_fields)
        
        # Publish event
        await self.publish_event('city_created', {'city_id': city_data.get('city_id'), 'nation_id': city_data.get('nation_id')})
        
        # Return created city
        return await self.db_manager.get_city(city_data.get('city_id'))
    
    async def delete_nation(self, nation_id: str) -> bool:
        """
        Delete a nation from the database.
        
        Args:
            nation_id: Nation ID to delete
        
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        result = await self.db_manager.delete_nation(nation_id)
        if result:
            await self.publish_event('nation_deleted', {'nation_id': nation_id})
        return result > 0
    
    async def delete_city(self, city_id: str) -> bool:
        """
        Delete a city from the database.
        
        Args:
            city_id: City ID to delete
        
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        result = await self.db_manager.delete_city(city_id)
        if result:
            await self.publish_event('city_deleted', {'city_id': city_id})
        return result > 0
    
    async def update_nation(self, nation_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a nation in the database.
        
        Args:
            nation_id: Nation ID to update
            updates: Dictionary of fields to update
        
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        # Check if nation exists
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return False
        
        # Update in database
        result = await self.db_manager.update_nation(nation_id, updates)
        
        if result:
            await self.publish_event('nation_updated', {'nation_id': nation_id})
        
        return result > 0
    
    async def update_city(self, city_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a city in the database.
        
        Args:
            city_id: City ID to update
            updates: Dictionary of fields to update
        
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        # Check if city exists
        city = await self.db_manager.get_city(city_id)
        if not city:
            return False
        
        # Update in database
        result = await self.db_manager.update_city(city_id, updates)
        
        if result:
            await self.publish_event('city_updated', {'city_id': city_id})
        
        return result > 0
    
    async def calculate_nation_score(self, nation_id: str) -> float:
        """Calculate a nation's score using Logic formulas."""
        from ..Logic.formulas import calculate_military_score
        
        nation = await self.get_nation_by_id(nation_id)
        if not nation:
            return 0.0
        
        # Get military data
        military = await self.db_manager.get_nation_military(nation_id)
        if not military:
            military = {'soldiers': 0, 'tanks': 0, 'aircraft': 0, 'ships': 0, 'nuclear_weapons': 0}

        # Use granular fields if available, fall back to aggregate
        aircraft = (military.get('fighters') or 0) + (military.get('bombers') or 0)
        if not aircraft:
            aircraft = military.get('aircraft') or 0
        ships = (
            (military.get('destroyers') or 0) + (military.get('cruisers') or 0) +
            (military.get('battleships') or 0) + (military.get('carriers') or 0) +
            (military.get('submarines') or 0)
        )
        if not ships:
            ships = military.get('ships') or 0

        # Count cities from JSON list stored on nation
        import json as _json
        try:
            city_ids_raw = nation.get('city_ids', '[]')
            city_count = len(_json.loads(city_ids_raw)) if isinstance(city_ids_raw, str) else 0
        except Exception:
            city_count = 0

        # Calculate score using Logic formulas
        score = calculate_military_score(
            soldiers=military.get('soldiers') or 0,
            tanks=military.get('tanks') or 0,
            aircraft=aircraft,
            ships=ships,
            nukes=military.get('nuclear_weapons') or 0,
            infrastructure=nation.get('total_infrastructure') or 0,
            technology=nation.get('technology') or 0,
            city_count=city_count,
        )

        return score
    
    async def get_nation_statistics(self, nation_id: str) -> Dict[str, Any]:
        """Get comprehensive statistics for a nation."""
        nation = await self.get_nation_by_id(nation_id)
        if not nation:
            return {}
        
        cities = await self.get_cities_for_nation(nation_id)
        
        return {
            'nation_id': nation.get('nation_id'),
            'nation_name': nation.get('nation_name'),
            'ruler_name': nation.get('ruler_name'),
            'total_infrastructure': nation.get('total_infrastructure'),
            'total_land': nation.get('total_land'),
            'total_population': nation.get('total_population'),
            'number_of_cities': len(cities),
            'score': await self.calculate_nation_score(nation_id),
            'cash': nation.get('cash'),
            'technology': nation.get('technology'),
            'happiness': nation.get('happiness'),
            'environment': nation.get('environment'),
            'current_tier': nation.get('current_tier'),
            'tier_progress': nation.get('tier_progress'),
        }
