"""
Diplomacy Component (Merged)

Handles diplomacy, treaties, and spy operations.
Integrates with the new async BaseComponent and GPP infrastructure.
Uses empire_db for all persistence operations.
"""

from typing import List, Dict, Any, Optional
import logging

from .base_component import BaseComponent
from ..Database.empire_db import EmpireDB
from ..Logic.diplomacy import (
    DiplomaticRelation, DiplomaticRelationType, DiplomaticAction, DiplomaticActionType,
    CasusBelliType, Treaty, TreatyStatus, TreatyType, Sanction, Embassy,
    Resolution, ResolutionType, ResolutionStatus, AssemblyResolution, AssemblyResolutionType,
    AssemblyResolutionStatus, GlobalEffect, WorldWar, DiplomacySystem
)
from ..Logic.spy import SpyOperation, SpyOperationType, SpySystem

logger = logging.getLogger(__name__)


class DiplomacyComponent(BaseComponent):
    """
    Merged component for Diplomacy and Spy operations.
    
    Combines diplomacy, treaties, and spy operations into a single component.
    Uses empire_db for all data persistence.
    """
    
    def __init__(self, name: str = "diplomacy", gpp_manager=None, db_manager: Optional[EmpireDB] = None):
        """Initialize the DiplomacyComponent."""
        super().__init__(name, gpp_manager)
        self.db_manager = db_manager
        self.diplomacy_system: Optional[DiplomacySystem] = None
        self.spy_system: Optional[SpySystem] = None
    
    async def _initialize(self) -> None:
        """Initialize the diplomacy and spy systems."""
        if not self.db_manager:
            logger.warning("DiplomacyComponent: No database manager provided")
        self.diplomacy_system = DiplomacySystem()
        self.spy_system = SpySystem()
        logger.info("DiplomacyComponent initialized")
    
    async def get_all(self) -> List[DiplomaticRelation]:
        """Get all diplomatic relations from DiplomacySystem."""
        if self.diplomacy_system:
            return list(self.diplomacy_system.relations.values())
        return []
    
    async def get_by_name(self, name: str) -> Optional[DiplomaticRelation]:
        """Get a diplomatic relation by name (not applicable for relations)."""
        return None
    
    async def get_names(self) -> List[str]:
        """Get all relation IDs as names."""
        return [relation.relation_id for relation in await self.get_all()]
    
    # DiplomaticRelation methods using empire_db
    
    async def establish_relation(self, nation_a_id: str, nation_b_id: str) -> Dict[str, Any]:
        """Establish a diplomatic relation between two nations in database."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        import uuid
        relation_id = str(uuid.uuid4())
        
        await self.db_manager.create_diplomatic_relation(
            relation_id=relation_id,
            nation_a_id=nation_a_id,
            nation_b_id=nation_b_id,
            relation_type='NEUTRAL'
        )
        
        await self.publish_event('relation_established', {
            'nation_a_id': nation_a_id,
            'nation_b_id': nation_b_id
        })
        
        return await self.db_manager.get_diplomatic_relation(relation_id)
    
    async def get_relation(self, nation_a_id: str, nation_b_id: str) -> Optional[Dict[str, Any]]:
        """Get the diplomatic relation between two nations from database."""
        if not self.db_manager:
            return None
        return await self.db_manager.get_diplomatic_relation_by_nations(nation_a_id, nation_b_id)
    
    async def update_relation(self, relation_id: str, updates: Dict[str, Any]) -> bool:
        """Update the diplomatic relation in database."""
        if not self.db_manager:
            return False
        result = await self.db_manager.update_diplomatic_relation(relation_id, updates)
        return result > 0
    
    async def get_all_relations(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all diplomatic relations for a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_diplomatic_relations(nation_id)
    
    # Spy Operation methods using empire_db
    
    async def create_spy_operation(self, operation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new spy operation in database."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        await self.db_manager.create_spy_operation(
            operation_id=operation_data.get('operation_id'),
            spy_nation_id=operation_data.get('spy_nation_id'),
            target_nation_id=operation_data.get('target_nation_id'),
            operation_type=operation_data.get('operation_type')
        )
        
        await self.publish_event('spy_operation_created', {
            'operation_id': operation_data.get('operation_id'),
            'spy_nation_id': operation_data.get('spy_nation_id'),
            'target_nation_id': operation_data.get('target_nation_id')
        })
        
        return await self.db_manager.get_spy_operation(operation_data.get('operation_id'))
    
    async def get_spy_operations_for_nation(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all spy operations for a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_spy_operations(nation_id)
    
    async def execute_spy_operation(self, operation_id: str) -> Dict[str, Any]:
        """Execute a spy operation."""
        if not self.db_manager:
            return {'success': False, 'error': 'Database manager not initialized'}
        
        # Get operation
        operation = await self.db_manager.get_spy_operation(operation_id)
        if not operation:
            return {'success': False, 'error': 'Operation not found'}
        
        # Update with result (simplified)
        await self.db_manager.update_spy_operation(operation_id, {'result': 'SUCCESS'})
        
        await self.publish_event('spy_operation_executed', {'operation_id': operation_id})
        
        return {'success': True}
    
    # Treaty methods using empire_db
    
    async def create_treaty(self, party_a_id: str, party_b_id: str, treaty_type: str,
                          terms: Optional[str] = None, expires_at: Optional[str] = None) -> Dict[str, Any]:
        """Create a treaty in database."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        import uuid
        treaty_id = str(uuid.uuid4())
        
        await self.db_manager.create_treaty(
            treaty_id=treaty_id,
            party_a_id=party_a_id,
            party_b_id=party_b_id,
            treaty_type=treaty_type,
            status='PROPOSED',
            terms=terms,
            expires_at=expires_at
        )
        
        await self.publish_event('treaty_proposed', {
            'treaty_id': treaty_id,
            'party_a_id': party_a_id,
            'party_b_id': party_b_id
        })
        
        return await self.db_manager.get_treaty(treaty_id)
    
    async def get_treaties_for_nation(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all treaties for a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_treaties(nation_id)
    
    async def update_treaty(self, treaty_id: str, updates: Dict[str, Any]) -> bool:
        """Update a treaty in database."""
        if not self.db_manager:
            return False
        result = await self.db_manager.update_treaty(treaty_id, updates)
        return result > 0
    
    # Sanction methods using empire_db
    
    async def create_sanction(self, target_nation_id: str, sanction_type: str,
                            imposing_alliance_id: Optional[str] = None,
                            imposing_nation_id: Optional[str] = None,
                            expires_at: Optional[str] = None) -> Dict[str, Any]:
        """Create a sanction in database."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        import uuid
        sanction_id = str(uuid.uuid4())
        
        await self.db_manager.create_sanction(
            sanction_id=sanction_id,
            target_nation_id=target_nation_id,
            sanction_type=sanction_type,
            imposing_alliance_id=imposing_alliance_id,
            imposing_nation_id=imposing_nation_id,
            expires_at=expires_at
        )
        
        await self.publish_event('sanction_imposed', {
            'sanction_id': sanction_id,
            'target_nation_id': target_nation_id
        })
        
        return await self.db_manager.get_sanction(sanction_id)
    
    async def get_sanctions_for_nation(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all sanctions on a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_sanctions(nation_id)
    
    async def get_active_sanctions_for_nation(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all active sanctions on a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_active_nation_sanctions(nation_id)

