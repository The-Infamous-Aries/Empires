"""
Base Plugin for Empire Game System

Provides the base class for all Empire plugins.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class BasePlugin(ABC):
    """
    Base class for all Empire plugins.
    
    Plugins can extend the functionality of the Empire game system
    by adding new features, game mechanics, or integrations.
    """
    
    def __init__(self, name: str, version: str = "1.0.0"):
        """
        Initialize the plugin.
        
        Args:
            name: Plugin name
            version: Plugin version
        """
        self.name = name
        self.version = version
        self.enabled = False
        self.config: Dict[str, Any] = {}
    
    @abstractmethod
    async def initialize(self, gpp_manager) -> bool:
        """
        Initialize the plugin.
        
        Called when the plugin is loaded by the PluginManager.
        
        Args:
            gpp_manager: EmpireGPPManager instance
        
        Returns:
            True if initialization successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def start(self) -> bool:
        """
        Start the plugin.
        
        Called after all plugins are initialized.
        
        Returns:
            True if start successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def stop(self) -> bool:
        """
        Stop the plugin.
        
        Called during GPP shutdown.
        
        Returns:
            True if stop successful, False otherwise
        """
        pass
    
    async def enable(self) -> bool:
        """
        Enable the plugin.
        
        Returns:
            True if successful
        """
        self.enabled = True
        logger.info(f"Plugin {self.name} enabled")
        return True
    
    async def disable(self) -> bool:
        """
        Disable the plugin.
        
        Returns:
            True if successful
        """
        self.enabled = False
        logger.info(f"Plugin {self.name} disabled")
        return True
    
    def configure(self, config: Dict[str, Any]):
        """
        Configure the plugin.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config
        logger.info(f"Plugin {self.name} configured")
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get plugin information.
        
        Returns:
            Plugin information dictionary
        """
        return {
            'name': self.name,
            'version': self.version,
            'enabled': self.enabled,
            'config': self.config,
        }
    
    async def on_event(self, event_type: str, event_data: Any):
        """
        Handle an event from the event bus.
        
        Override this method to handle specific events.
        
        Args:
            event_type: Type of event
            event_data: Event data
        """
        pass
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the plugin.
        
        Returns:
            Health check results
        """
        return {
            'name': self.name,
            'version': self.version,
            'enabled': self.enabled,
            'status': 'healthy' if self.enabled else 'disabled',
        }
