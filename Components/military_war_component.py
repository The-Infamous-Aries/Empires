"""
Military and War Component (Merged)

Handles military units, war mechanics, and combat operations.
Integrates with the new async BaseComponent and GPP infrastructure.
Uses empire_db for all persistence operations.
"""

from typing import List, Dict, Any, Optional
import logging

from .base_component import BaseComponent
from ..Database.empire_db import EmpireDB
from ..Logic.formulas import calculate_military_score, calculate_defense_strength

logger = logging.getLogger(__name__)


class MilitaryWarComponent(BaseComponent):
    """
    Merged component for Military and War operations.
    
    Combines military management and war mechanics into a single component.
    Uses empire_db for all data persistence.
    """
    
    def __init__(self, name: str = "military_war", gpp_manager=None, db_manager: Optional[EmpireDB] = None):
        """Initialize the MilitaryWarComponent."""
        super().__init__(name, gpp_manager)
        self.db_manager = db_manager
    
    async def _initialize(self) -> None:
        """Initialize the component."""
        if not self.db_manager:
            logger.warning("MilitaryWarComponent: No database manager provided")
        logger.info("MilitaryWarComponent initialized")
    
    async def get_all(self) -> List[Dict[str, Any]]:
        """Get all wars with attacker/defender names joined."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_all_wars()
    
    async def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a military or war by name."""
        # This is a simplified implementation
        return None
    
    async def get_names(self) -> List[str]:
        """Get all military and war identifiers."""
        names = []
        if not self.db_manager:
            return names
        
        # Get all wars
        wars = await self.db_manager.fetchalldict("SELECT war_id FROM wars")
        names.extend([war['war_id'] for war in wars])
        
        return names
    
    # Military methods
    async def get_military(self, nation_id: str) -> Optional[Dict[str, Any]]:
        """Get military for a nation from database."""
        if not self.db_manager:
            return None
        return await self.db_manager.get_nation_military(nation_id)
    
    async def create_military(self, military_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new military record in the database.
        
        Args:
            military_data: Dictionary containing military data
        
        Returns:
            Created military data dictionary
        """
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        # Create military in database with all granular unit types
        await self.db_manager.create_military(
            military_id=military_data.get('military_id'),
            nation_id=military_data.get('nation_id'),
            soldiers=military_data.get('soldiers', 0),
            tanks=military_data.get('tanks', 0),
            fighters=military_data.get('fighters', 0),
            bombers=military_data.get('bombers', 0),
            destroyers=military_data.get('destroyers', 0),
            cruisers=military_data.get('cruisers', 0),
            battleships=military_data.get('battleships', 0),
            carriers=military_data.get('carriers', 0),
            submarines=military_data.get('submarines', 0),
            cruise_missiles=military_data.get('cruise_missiles', 0),
            nuclear_weapons=military_data.get('nuclear_weapons', 0),
            spies=military_data.get('spies', 0),
        )
        
        # Update with caps and additional fields
        additional_fields = {
            'soldier_cap': military_data.get('soldier_cap', 0),
            'tank_cap': military_data.get('tank_cap', 0),
            'aircraft_cap': military_data.get('aircraft_cap', 0),
            'ship_cap': military_data.get('ship_cap', 0),
            'missile_cap': military_data.get('missile_cap', 0),
            'nuke_cap': military_data.get('nuke_cap', 0),
            'spy_cap': military_data.get('spy_cap', 0),
        }
        
        await self.db_manager.update_military(military_data.get('military_id'), additional_fields)
        
        # Publish event
        await self.publish_event('military_created', {'nation_id': military_data.get('nation_id')})
        
        # Return created military
        return await self.db_manager.get_military(military_data.get('military_id'))
    
    async def update_military(self, nation_id: str, updates: Dict[str, Any]) -> bool:
        """Update military for a nation in database."""
        if not self.db_manager:
            return False
        
        # Get military ID for this nation
        military = await self.db_manager.get_nation_military(nation_id)
        if not military:
            return False
        
        # Update in database
        result = await self.db_manager.update_military(military['military_id'], updates)
        
        if result:
            await self.publish_event('military_updated', {'nation_id': nation_id})
        
        return result > 0
    
    async def calculate_military_strength(self, nation_id: str) -> float:
        """Calculate military strength for a nation using Logic formulas."""
        if not self.db_manager:
            return 0.0
        
        military = await self.db_manager.get_nation_military(nation_id)
        if not military:
            return 0.0
        
        return calculate_military_score(
            soldiers=military.get('soldiers', 0),
            tanks=military.get('tanks', 0),
            aircraft=military.get('aircraft', 0),
            ships=military.get('ships', 0)
        )
    
    async def calculate_defense_strength(self, nation_id: str) -> float:
        """Calculate defense strength for a nation using Logic formulas."""
        if not self.db_manager:
            return 0.0
        
        military = await self.db_manager.get_nation_military(nation_id)
        if not military:
            return 0.0
        
        return calculate_defense_strength(
            soldiers=military.get('soldiers', 0),
            tanks=military.get('tanks', 0),
            aircraft=military.get('aircraft', 0),
            ships=military.get('ships', 0)
        )
    
    # War methods
    async def get_war(self, war_id: str) -> Optional[Dict[str, Any]]:
        """Get a war by ID from database."""
        if not self.db_manager:
            return None
        return await self.db_manager.get_war(war_id)
    
    async def get_wars_for_nation(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all wars involving a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_wars(nation_id)
    
    async def create_war(self, war_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new war in the database.
        
        Args:
            war_data: Dictionary containing war data
        
        Returns:
            Created war data dictionary
        """
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        # Create war in database
        await self.db_manager.create_war(
            war_id=war_data.get('war_id'),
            attacker_id=war_data.get('attacker_id'),
            defender_id=war_data.get('defender_id'),
            status=war_data.get('status', 'ACTIVE')
        )
        
        # Create war details for both nations
        attacker_detail_id = f"{war_data.get('war_id')}_attacker"
        defender_detail_id = f"{war_data.get('war_id')}_defender"
        
        await self.db_manager.create_war_detail(
            detail_id=attacker_detail_id,
            war_id=war_data.get('war_id'),
            nation_id=war_data.get('attacker_id'),
            war_score=war_data.get('war_score', 50.0)
        )
        
        await self.db_manager.create_war_detail(
            detail_id=defender_detail_id,
            war_id=war_data.get('war_id'),
            nation_id=war_data.get('defender_id'),
            war_score=war_data.get('war_score', 50.0)
        )
        
        # Publish event
        await self.publish_event('war_declared', {
            'war_id': war_data.get('war_id'),
            'attacker_id': war_data.get('attacker_id'),
            'defender_id': war_data.get('defender_id')
        })
        
        # Return created war
        return await self.db_manager.get_war(war_data.get('war_id'))
    
    async def end_war(self, war_id: str, outcome: str) -> bool:
        """End a war with an outcome in the database."""
        if not self.db_manager:
            return False
        
        # Update war status
        result = await self.db_manager.update_war(war_id, {'status': 'ENDED'})
        
        # Clean up war details
        await self.db_manager.delete_war_details(war_id)
        
        # Publish event
        await self.publish_event('war_ended', {
            'war_id': war_id,
            'outcome': outcome
        })
        
        return result > 0
    
    async def process_war_attack(self, war_id: str, attacker_id: str, attack_type: str) -> Dict[str, Any]:
        """
        Process a war attack.
        
        Args:
            war_id: War ID
            attacker_id: Attacking nation ID
            attack_type: Type of attack
        
        Returns:
            Attack results
        """
        if not self.db_manager:
            return {'success': False, 'error': 'Database manager not initialized'}
        
        war = await self.db_manager.get_war(war_id)
        if not war:
            return {'success': False, 'error': 'War not found'}
        
        # Get war detail for attacker
        war_detail = await self.db_manager.get_nation_war_detail(war_id, attacker_id)
        if not war_detail:
            return {'success': False, 'error': 'War detail not found'}
        
        # Attack processing logic would go here
        # This is a placeholder for the actual attack mechanics
        # In a full implementation, this would:
        # 1. Calculate attack strength
        # 2. Calculate defense strength
        # 3. Calculate damage
        # 4. Update war score
        # 5. Update military units
        # 6. Check for victory conditions
        
        # Update attacks used
        await self.db_manager.update_war_detail(
            war_detail['detail_id'],
            {'attacks_used_this_tick': war_detail.get('attacks_used_this_tick', 0) + 1}
        )
        
        # Publish event
        await self.publish_event('war_attack', {
            'war_id': war_id,
            'attacker_id': attacker_id,
            'attack_type': attack_type
        })
        
        return {'success': True, 'war_score': war_detail.get('war_score', 50.0)}
