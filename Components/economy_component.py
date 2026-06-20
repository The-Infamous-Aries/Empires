"""
Economy Component (Merged)

Handles resources, improvements, wonders, and projects.
Integrates with the new async BaseComponent and GPP infrastructure.
Uses empire_db for all persistence operations.
"""

from typing import List, Dict, Any, Optional
import logging

from .base_component import BaseComponent
from ..Database.empire_db import EmpireDB
from ..Logic.resources import ResourceType
from ..Logic.improvements import ImprovementType
from ..Logic.wonders import WonderType
from ..Logic.projects import ProjectType

logger = logging.getLogger(__name__)


class EconomyComponent(BaseComponent):
    """
    Merged component for Economy operations.
    
    Combines resources, improvements, wonders, and projects into a single component.
    Uses empire_db for all data persistence.
    """
    
    def __init__(self, name: str = "economy", gpp_manager=None, db_manager: Optional[EmpireDB] = None):
        """Initialize the EconomyComponent."""
        super().__init__(name, gpp_manager)
        self.db_manager = db_manager
    
    async def _initialize(self) -> None:
        """Initialize the component."""
        if not self.db_manager:
            logger.warning("EconomyComponent: No database manager provided")
        logger.info("EconomyComponent initialized")
    
    async def get_all(self) -> List[Dict[str, Any]]:
        """Get all economy items combined from database."""
        all_items = []
        if not self.db_manager:
            return all_items
        
        # Get resources, improvements, wonders, projects for all nations
        # This would be a comprehensive query, for now return empty
        return all_items
    
    async def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get an economy item by name."""
        # Simplified implementation
        return None
    
    async def get_names(self) -> List[str]:
        """Get all economy item identifiers."""
        names = []
        if not self.db_manager:
            return names
        
        # Get all resource types, improvement types, etc.
        # For now return empty
        return names
    
    # Resource methods - using empire_db for nation resources
    async def get_nation_resources(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all resources for a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_resources(nation_id)
    
    async def get_nation_resource(self, nation_id: str, resource_type: str) -> Optional[Dict[str, Any]]:
        """Get a specific resource type for a nation."""
        if not self.db_manager:
            return None
        return await self.db_manager.get_nation_resource_by_type(nation_id, resource_type)
    
    async def create_nation_resource(self, nation_id: str, resource_type: str, 
                                    amount: float = 0.0, production_rate: float = 0.0) -> Dict[str, Any]:
        """Create a nation resource record."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        import uuid
        resource_id = str(uuid.uuid4())
        
        await self.db_manager.create_nation_resource(
            resource_id=resource_id,
            nation_id=nation_id,
            resource_type=resource_type,
            amount=amount,
            production_rate=production_rate
        )
        
        return await self.db_manager.get_nation_resource(resource_id)
    
    async def update_nation_resource(self, resource_id: str, updates: Dict[str, Any]) -> bool:
        """Update a nation resource."""
        if not self.db_manager:
            return False
        result = await self.db_manager.update_nation_resource(resource_id, updates)
        return result > 0
    
    # Improvement methods - using empire_db for nation improvements
    async def get_nation_improvements(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all improvements for a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_improvements(nation_id)
    
    async def get_city_improvements(self, city_id: str) -> List[Dict[str, Any]]:
        """Get all improvements for a city from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_city_improvements(city_id)
    
    async def create_nation_improvement(self, nation_id: str, improvement_type: str,
                                       level: int = 0, city_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a nation improvement record."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        import uuid
        improvement_id = str(uuid.uuid4())
        
        await self.db_manager.create_nation_improvement(
            improvement_id=improvement_id,
            nation_id=nation_id,
            improvement_type=improvement_type,
            level=level,
            city_id=city_id
        )
        
        await self.publish_event('improvement_created', {
            'nation_id': nation_id,
            'improvement_type': improvement_type
        })
        
        return await self.db_manager.get_nation_improvement(improvement_id)
    
    async def update_nation_improvement(self, improvement_id: str, updates: Dict[str, Any]) -> bool:
        """Update a nation improvement."""
        if not self.db_manager:
            return False
        result = await self.db_manager.update_nation_improvement(improvement_id, updates)
        return result > 0
    
    # Wonder methods - using empire_db for nation wonders
    async def get_nation_wonders(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all wonders for a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_wonders(nation_id)
    
    async def create_nation_wonder(self, nation_id: str, wonder_type: str,
                                  city_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a nation wonder record."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        import uuid
        wonder_id = str(uuid.uuid4())
        
        await self.db_manager.create_nation_wonder(
            wonder_id=wonder_id,
            nation_id=nation_id,
            wonder_type=wonder_type,
            city_id=city_id
        )
        
        await self.publish_event('wonder_built', {
            'nation_id': nation_id,
            'wonder_type': wonder_type
        })
        
        return await self.db_manager.get_nation_wonder(wonder_id)
    
    # Project methods - using empire_db for nation projects
    async def get_nation_projects(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all projects for a nation from database."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_projects(nation_id)
    
    async def get_nation_completed_projects(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all completed projects for a nation."""
        if not self.db_manager:
            return []
        return await self.db_manager.get_nation_completed_projects(nation_id)
    
    async def create_nation_project(self, nation_id: str, project_type: str) -> Dict[str, Any]:
        """Create a nation project record."""
        if not self.db_manager:
            raise RuntimeError("Database manager not initialized")
        
        import uuid
        project_id = str(uuid.uuid4())
        
        await self.db_manager.create_nation_project(
            project_id=project_id,
            nation_id=nation_id,
            project_type=project_type
        )
        
        return await self.db_manager.get_nation_project(project_id)
    
    async def complete_nation_project(self, project_id: str) -> bool:
        """Mark a nation project as completed."""
        if not self.db_manager:
            return False
        
        result = await self.db_manager.complete_nation_project(project_id)
        
        if result:
            project = await self.db_manager.get_nation_project(project_id)
            if project:
                await self.publish_event('project_completed', {
                    'nation_id': project['nation_id'],
                    'project_type': project['project_type']
                })
        
        return result > 0
