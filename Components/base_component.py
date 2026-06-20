"""
Base Component for Empire Game System (Async)

Provides a consistent async interface for all Empire game components.
Integrates with GPP infrastructure (GPPManager, EventBus, etc.).
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)


class BaseComponent(ABC):
    """
    Base class for all Empire game components.
    
    Provides async lifecycle management and GPP integration.
    """
    
    def __init__(self, name: str, gpp_manager=None):
        """
        Initialize the component.
        
        Args:
            name: Component name
            gpp_manager: Optional EmpireGPPManager instance
        """
        self.name = name
        self.gpp_manager = gpp_manager
        self._running = False
        self._initialized = False
        self._data = {}
    
    async def initialize(self):
        """
        Initialize the component.
        
        Called during GPP initialization.
        """
        if self._initialized:
            return
        
        logger.info(f"Initializing component: {self.name}")
        await self._initialize()
        self._initialized = True
        logger.info(f"Component initialized: {self.name}")
    
    @abstractmethod
    async def _initialize(self) -> None:
        """
        Initialize and load the game data.
        
        Must be implemented by subclasses.
        """
        pass
    
    async def start(self):
        """
        Start the component.
        
        Called after all components are initialized.
        """
        if self._running:
            return
        
        if not self._initialized:
            await self.initialize()
        
        logger.info(f"Starting component: {self.name}")
        await self._start()
        self._running = True
        logger.info(f"Component started: {self.name}")
    
    async def _start(self) -> None:
        """
        Start the component.
        
        Override in subclasses if needed.
        """
        pass
    
    async def stop(self):
        """
        Stop the component.
        
        Called during GPP shutdown.
        """
        if not self._running:
            return
        
        logger.info(f"Stopping component: {self.name}")
        await self._stop()
        self._running = False
        logger.info(f"Component stopped: {self.name}")
    
    async def _stop(self) -> None:
        """
        Stop the component.
        
        Override in subclasses if needed.
        """
        pass
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the component.
        
        Returns:
            Health check results
        """
        return {
            'name': self.name,
            'running': self._running,
            'initialized': self._initialized,
        }
    
    @abstractmethod
    async def get_all(self) -> List[Any]:
        """
        Get all items of this type.
        
        Must be implemented by subclasses.
        """
        pass
    
    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[Any]:
        """
        Get an item by name.
        
        Must be implemented by subclasses.
        """
        pass
    
    @abstractmethod
    async def get_names(self) -> List[str]:
        """
        Get all item names.
        
        Must be implemented by subclasses.
        """
        pass
    
    async def get_basic_data(self) -> List[Dict[str, Any]]:
        """
        Get basic data for API responses (name, category, description).
        """
        items = await self.get_all()
        return [
            {
                "name": item.name,
                "category": item.category.value if hasattr(item, 'category') else None,
                "description": item.description
            }
            for item in items
        ]
    
    async def get_full_data(self) -> List[Dict[str, Any]]:
        """
        Get full data for API responses (all attributes).
        """
        items = await self.get_all()
        return [
            self._item_to_dict(item)
            for item in items
        ]
    
    def _item_to_dict(self, item: Any) -> Dict[str, Any]:
        """Convert an item to a dictionary."""
        if hasattr(item, '__dict__'):
            return {k: v for k, v in item.__dict__.items() if not k.startswith('_')}
        return {"name": str(item)}
    
    async def publish_event(self, event_type: str, data: Any = None):
        """
        Publish an event to the event bus.
        
        Args:
            event_type: Type of event
            data: Event data
        """
        if self.gpp_manager:
            await self.gpp_manager.publish_event(event_type, data)
    
    async def subscribe_event(self, event_type: str, callback):
        """
        Subscribe to an event.
        
        Args:
            event_type: Type of event
            callback: Callback function
        """
        if self.gpp_manager:
            await self.gpp_manager.subscribe_event(event_type, callback)
