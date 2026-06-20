"""
Government and Religion Component (Merged)

Handles government, religion, and policy-related game data and operations.
Integrates with the new async BaseComponent and GPP infrastructure.
Uses empire_db for all persistence operations.
"""

from typing import List, Dict, Any, Optional
import logging

from .base_component import BaseComponent
from ..Database.empire_db import EmpireDB
from ..Logic.govrel import (
    Government,
    Religion,
    GovernmentType,
    ReligionType,
    GovernmentSystem,
    ReligionSystem,
    GovRelSystem
)

logger = logging.getLogger(__name__)


class GovRelComponent(BaseComponent):
    """
    Merged component for Government, Religion, and Policy operations.
    
    Combines governments, religions, and policies into a single component.
    Uses empire_db for all data persistence.
    """
    
    def __init__(self, name: str = "govrel", gpp_manager=None, db_manager: Optional[EmpireDB] = None):
        """Initialize the GovRelComponent."""
        super().__init__(name, gpp_manager)
        self.db_manager = db_manager
        self.gov_system: Optional[GovernmentSystem] = None
        self.rel_system: Optional[ReligionSystem] = None
        self.system: Optional[GovRelSystem] = None
    
    async def _initialize(self) -> None:
        """Initialize the government and religion systems."""
        if not self.db_manager:
            logger.warning("GovRelComponent: No database manager provided")
        self.gov_system = GovernmentSystem()
        self.rel_system = ReligionSystem()
        self.system = GovRelSystem()
        logger.info("GovRelComponent initialized")
    
    async def get_all(self) -> List[Any]:
        """Get all governments and religions combined."""
        all_items = []
        if self.gov_system:
            all_items.extend(self.gov_system.get_all_governments())
        if self.rel_system:
            all_items.extend(self.rel_system.get_all_religions())
        return all_items
    
    async def get_by_name(self, name: str) -> Optional[Any]:
        """Get a government or religion by name."""
        if self.gov_system:
            for gov in self.gov_system.get_all_governments():
                if gov.name == name:
                    return gov
        if self.rel_system:
            for rel in self.rel_system.get_all_religions():
                if rel.name == name:
                    return rel
        return None
    
    async def get_names(self) -> List[str]:
        """Get all government and religion names."""
        names = []
        if self.gov_system:
            names.extend([gov.name for gov in self.gov_system.get_all_governments()])
        if self.rel_system:
            names.extend([rel.name for rel in self.rel_system.get_all_religions()])
        return names
    
    # Government methods
    async def get_government(self, gov_type: GovernmentType) -> Optional[Government]:
        """Get a government by type."""
        if self.gov_system:
            return self.gov_system.get_government(gov_type)
        return None
    
    async def get_all_governments(self) -> List[Government]:
        """Get all available governments."""
        if self.gov_system:
            return self.gov_system.get_all_governments()
        return []
    
    async def get_playable_governments(self) -> List[Government]:
        """Get all governments that can be chosen (not forced like Anarchy)."""
        if self.gov_system:
            return self.gov_system.get_playable_governments()
        return []
    
    # Religion methods
    async def get_religion(self, rel_type: ReligionType) -> Optional[Religion]:
        """Get a religion by type."""
        if self.rel_system:
            return self.rel_system.get_religion(rel_type)
        return None
    
    async def get_all_religions(self) -> List[Religion]:
        """Get all available religions."""
        if self.rel_system:
            return self.rel_system.get_all_religions()
        return []
    
    async def calculate_religion_income_bonus(self, religion: ReligionType) -> float:
        """Calculate income bonus from religion."""
        if self.rel_system:
            return self.rel_system.calculate_religion_income_bonus(religion)
        return 0.0
    
    async def calculate_religion_military_bonus(self, religion: ReligionType) -> float:
        """Calculate military bonus from religion."""
        if self.rel_system:
            return self.rel_system.calculate_religion_military_bonus(religion)
        return 0.0
    
    async def calculate_religion_happiness_bonus(self, religion: ReligionType) -> int:
        """Calculate happiness bonus from religion."""
        if self.rel_system:
            return self.rel_system.calculate_religion_happiness_bonus(religion)
        return 0
    
    async def calculate_religion_population_bonus(self, religion: ReligionType) -> float:
        """Calculate population bonus from religion."""
        if self.rel_system:
            return self.rel_system.calculate_religion_population_bonus(religion)
        return 0.0
    
    # Combined GovRel methods
    async def calculate_tax_income_modifier(self, government: GovernmentType) -> float:
        """Calculate tax income modifier based on government."""
        if self.system:
            return self.system.calculate_tax_income_modifier(government)
        return 0.0
    
    async def calculate_military_efficiency_modifier(self, government: GovernmentType) -> float:
        """Calculate military efficiency modifier based on government."""
        if self.system:
            return self.system.calculate_military_efficiency_modifier(government)
        return 0.0
    
    async def calculate_happiness_modifier(
        self,
        government: GovernmentType,
        religion: Optional[ReligionType] = None,
        religion_matches_citizens: bool = False,
        completed_projects: Optional[list] = None
    ) -> int:
        """
        Calculate happiness modifier based on government and religion.
        
        Args:
            government: The government type
            religion: The endorsed religion (None if secular)
            religion_matches_citizens: Whether the endorsed religion matches citizen desire
            completed_projects: List of completed projects (optional)
            
        Returns:
            Total happiness modifier
        """
        if self.system:
            return self.system.calculate_happiness_modifier(
                government, religion, religion_matches_citizens, completed_projects
            )
        return 0
    
    async def check_government_religion_synergy(
        self,
        government: GovernmentType,
        religion: Optional[ReligionType]
    ) -> bool:
        """
        Check if government and religion have a synergy (doubles religion bonuses).
        
        Args:
            government: The government type
            religion: The endorsed religion (None if secular)
            
        Returns:
            True if synergy exists, False otherwise
        """
        if self.system:
            return self.system.check_government_religion_synergy(government, religion)
        return False
    
    async def calculate_religion_bonus_multiplier(
        self,
        government: GovernmentType,
        religion: Optional[ReligionType]
    ) -> float:
        """
        Calculate the multiplier for religion bonuses based on government.
        
        Args:
            government: The government type
            religion: The endorsed religion
            
        Returns:
            Multiplier (1.0 = normal, 2.0 = doubled, etc.)
        """
        if self.system:
            return self.system.calculate_religion_bonus_multiplier(government, religion)
        return 1.0
    
    # Nation-specific government/religion operations
    async def get_nation_government(self, nation_id: str) -> Optional[GovernmentType]:
        """Get a nation's current government type from database."""
        if not self.db_manager:
            return None
        
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return None
        
        gov_type_str = nation.get('government_type', 'DEMOCRACY')
        try:
            return GovernmentType[gov_type_str]
        except (KeyError, AttributeError):
            return GovernmentType.DEMOCRACY
    
    async def get_nation_religion(self, nation_id: str) -> Optional[ReligionType]:
        """Get a nation's current religion type from database."""
        if not self.db_manager:
            return None
        
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return None
        
        religion_type_str = nation.get('religion_type')
        if not religion_type_str:
            return None
        
        try:
            return ReligionType[religion_type_str]
        except (KeyError, AttributeError):
            return None
    
    async def change_nation_government(self, nation_id: str, new_government: GovernmentType) -> bool:
        """
        Change a nation's government type in the database.
        
        Args:
            nation_id: Nation ID to update
            new_government: New government type
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        # Check if nation exists
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return False
        
        # Check cooldown
        cooldown = nation.get('government_change_cooldown', 0)
        if cooldown > 0:
            logger.warning(f"Nation {nation_id} has government change cooldown: {cooldown} ticks")
            return False
        
        # Update government
        await self.db_manager.update_nation(nation_id, {
            'government_type': new_government.name,
            'government_change_cooldown': 72  # 72 ticks (3 days) cooldown
        })
        
        # Publish event
        await self.publish_event('government_changed', {
            'nation_id': nation_id,
            'new_government': new_government.name
        })
        
        return True
    
    async def change_nation_religion(self, nation_id: str, new_religion: ReligionType) -> bool:
        """
        Change a nation's religion type in the database.
        
        Args:
            nation_id: Nation ID to update
            new_religion: New religion type
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        # Check if nation exists
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return False
        
        # Check cooldown
        cooldown = nation.get('religion_change_cooldown', 0)
        if cooldown > 0:
            logger.warning(f"Nation {nation_id} has religion change cooldown: {cooldown} ticks")
            return False
        
        # Update religion
        await self.db_manager.update_nation(nation_id, {
            'religion_type': new_religion.name,
            'religion_change_cooldown': 72  # 72 ticks (3 days) cooldown
        })
        
        # Publish event
        await self.publish_event('religion_changed', {
            'nation_id': nation_id,
            'new_religion': new_religion.name
        })
        
        return True
    
    async def get_nation_policies(self, nation_id: str) -> Dict[str, str]:
        """Get a nation's current policies from database."""
        if not self.db_manager:
            return {}
        
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return {}
        
        return {
            'war_policy': nation.get('war_policy_type', 'NEUTRAL'),
            'domestic_policy': nation.get('domestic_policy_type', 'BALANCED')
        }
    
    async def change_nation_war_policy(self, nation_id: str, new_policy: str) -> bool:
        """
        Change a nation's war policy in the database.
        
        Args:
            nation_id: Nation ID to update
            new_policy: New war policy type
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        # Check if nation exists
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return False
        
        # Check cooldown
        cooldown = nation.get('policy_change_cooldown', 0)
        if cooldown > 0:
            logger.warning(f"Nation {nation_id} has policy change cooldown: {cooldown} ticks")
            return False
        
        # Update war policy
        await self.db_manager.update_nation(nation_id, {
            'war_policy_type': new_policy,
            'policy_change_cooldown': 24  # 24 ticks (1 day) cooldown
        })
        
        # Publish event
        await self.publish_event('war_policy_changed', {
            'nation_id': nation_id,
            'new_policy': new_policy
        })
        
        return True
    
    async def change_nation_domestic_policy(self, nation_id: str, new_policy: str) -> bool:
        """
        Change a nation's domestic policy in the database.
        
        Args:
            nation_id: Nation ID to update
            new_policy: New domestic policy type
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db_manager:
            return False
        
        # Check if nation exists
        nation = await self.db_manager.get_nation(nation_id)
        if not nation:
            return False
        
        # Check cooldown
        cooldown = nation.get('policy_change_cooldown', 0)
        if cooldown > 0:
            logger.warning(f"Nation {nation_id} has policy change cooldown: {cooldown} ticks")
            return False
        
        # Update domestic policy
        await self.db_manager.update_nation(nation_id, {
            'domestic_policy_type': new_policy,
            'policy_change_cooldown': 24  # 24 ticks (1 day) cooldown
        })
        
        # Publish event
        await self.publish_event('domestic_policy_changed', {
            'nation_id': nation_id,
            'new_policy': new_policy
        })
        
        return True
