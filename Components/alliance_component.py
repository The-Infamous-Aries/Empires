"""
Alliance Component for Empires Game System

Provides alliance management using empire_db for persistence.
"""

from typing import List, Dict, Any, Optional
import logging

from .base_component import BaseComponent
from ..Database.empire_db import EmpireDB

logger = logging.getLogger(__name__)


class AllianceComponent(BaseComponent):
    """Component for managing alliance logic and calculations."""
    
    def __init__(self, name: str = "alliance", gpp_manager=None, db_manager: Optional[EmpireDB] = None):
        """Initialize the alliance component."""
        super().__init__(name, gpp_manager)
        self.db_manager = db_manager
    
    async def _initialize(self) -> None:
        """Initialize the alliance component."""
        if not self.db_manager:
            logger.warning("AllianceComponent: No database manager provided")
        logger.info("AllianceComponent initialized")
    
    async def get_all(self) -> List[Dict[str, Any]]:
        """Get all alliances from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_all_alliances()
    
    async def get_by_id(self, alliance_id: str) -> Optional[Dict[str, Any]]:
        """Get an alliance by ID from database."""
        if not self.db_manager:
            return None
        return await self.db_manager.get_alliance(alliance_id)
    
    async def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get an alliance by name."""
        if not self.db_manager:
            return None
        alliances = await self.db_manager.get_all_alliances()
        for alliance in alliances:
            if alliance.get('name') == name:
                return alliance
        return None
    
    async def get_names(self) -> List[str]:
        """Get all alliance names."""
        alliances = await self.get_all()
        return [alliance.get('name', '') for alliance in alliances]
    
    async def create_alliance(self, alliance_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new alliance in database."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        # Support both naming conventions (web_server uses alliance_name/leader_nation_id;
        # internal code may use name/founder_id)
        alliance_id      = alliance_data.get('alliance_id')
        alliance_name    = alliance_data.get('alliance_name') or alliance_data.get('name', '')
        leader_nation_id = alliance_data.get('leader_nation_id') or alliance_data.get('founder_id', '')

        await self.db_manager.create_alliance(
            alliance_id=alliance_id,
            alliance_name=alliance_name,
            leader_nation_id=leader_nation_id,
        )

        # Update with additional fields if provided
        additional_fields = {}
        for key in ('color', 'flag', 'description', 'is_public', 'max_members'):
            if key in alliance_data:
                additional_fields[key] = alliance_data[key]
        if additional_fields:
            await self.db_manager.update_alliance(alliance_id, additional_fields)
        
        await self.publish_event('alliance_created', {'alliance_id': alliance_data.get('alliance_id')})
        
        return await self.db_manager.get_alliance(alliance_data.get('alliance_id'))
    
    async def update_alliance(self, alliance_id: str, updates: Dict[str, Any]) -> bool:
        """Update an alliance in database."""
        if not self.db_manager:
            return False
        
        result = await self.db_manager.update_alliance(alliance_id, updates)
        
        if result:
            await self.publish_event('alliance_updated', {'alliance_id': alliance_id})
        
        return result > 0
    
    async def delete_alliance(self, alliance_id: str) -> bool:
        """Delete an alliance from database."""
        if not self.db_manager:
            return False
        
        result = await self.db_manager.delete_alliance(alliance_id)
        
        if result:
            await self.publish_event('alliance_deleted', {'alliance_id': alliance_id})
        
        return result > 0
    
    async def get_alliance_members(self, alliance_id: str) -> List[Dict[str, Any]]:
        """Get all members of an alliance with their roles."""
        if not self.db_manager:
            return []
        # Query nations table directly (role stored on nation)
        return await self.db_manager.fetchalldict(
            "SELECT n.*, n.alliance_role as role FROM nations n WHERE n.alliance_id=? ORDER BY n.nation_name",
            (alliance_id,)
        )
