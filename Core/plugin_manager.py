"""
Empire Plugin Manager

Plugin system for extensibility.
"""

import importlib
import importlib.util
import inspect
from pathlib import Path
from typing import Dict, List, Optional, Type, Any
from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)


class BasePlugin(ABC):
    """Base class for Empire plugins."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Get the plugin name."""
        pass
    
    @property
    @abstractmethod
    def version(self) -> str:
        """Get the plugin version."""
        pass
    
    @abstractmethod
    async def initialize(self, empire_gpp_manager):
        """Initialize the plugin."""
        pass
    
    @abstractmethod
    async def shutdown(self):
        """Shutdown the plugin."""
        pass
    
    async def on_tick(self):
        """Called on each game tick."""
        pass
    
    async def on_event(self, event_type: str, data: Any):
        """Called when an event is published."""
        pass


class EmpirePluginManager:
    """
    Manages plugin loading and lifecycle.
    
    Provides extensibility for the Empire system.
    """
    
    def __init__(self, config):
        """
        Initialize the plugin manager.
        
        Args:
            config: EmpireConfig instance
        """
        self.config = config
        self._plugins: Dict[str, BasePlugin] = {}
        self._plugin_directory = Path(config.plugin_directory)
    
    async def initialize(self, empire_gpp_manager):
        """
        Initialize the plugin manager and load plugins.
        
        Args:
            empire_gpp_manager: EmpireGPPManager instance
        """
        if not self.config.auto_load_plugins:
            logger.info("Plugin auto-load disabled")
            return
        
        # Ensure plugin directory exists
        self._plugin_directory.mkdir(parents=True, exist_ok=True)
        
        # Load plugins
        await self.load_plugins(empire_gpp_manager)
        logger.info(f"Plugin manager initialized with {len(self._plugins)} plugins")
    
    async def load_plugins(self, empire_gpp_manager):
        """
        Load all plugins from the plugin directory.
        
        Args:
            empire_gpp_manager: EmpireGPPManager instance
        """
        for plugin_file in self._plugin_directory.glob("*.py"):
            if plugin_file.name.startswith("_"):
                continue
            
            try:
                await self.load_plugin(plugin_file, empire_gpp_manager)
            except Exception as e:
                logger.error(f"Failed to load plugin {plugin_file.name}: {e}")
    
    async def load_plugin(self, plugin_file: Path, empire_gpp_manager):
        """
        Load a single plugin from a file.
        
        Args:
            plugin_file: Path to the plugin file
            empire_gpp_manager: EmpireGPPManager instance
        """
        # Load the module
        spec = importlib.util.spec_from_file_location(plugin_file.stem, plugin_file)
        if spec is None or spec.loader is None:
            raise ImportError(f"Cannot load plugin from {plugin_file}")
        
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Find plugin classes
        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and issubclass(obj, BasePlugin) and obj is not BasePlugin:
                plugin = obj()
                await plugin.initialize(empire_gpp_manager)
                self._plugins[plugin.name] = plugin
                logger.info(f"Loaded plugin: {plugin.name} v{plugin.version}")
    
    async def unload_plugin(self, plugin_name: str):
        """
        Unload a plugin.
        
        Args:
            plugin_name: Name of the plugin to unload
        """
        if plugin_name in self._plugins:
            plugin = self._plugins[plugin_name]
            await plugin.shutdown()
            del self._plugins[plugin_name]
            logger.info(f"Unloaded plugin: {plugin_name}")
    
    async def reload_plugin(self, plugin_name: str, empire_gpp_manager):
        """
        Reload a plugin.
        
        Args:
            plugin_name: Name of the plugin to reload
            empire_gpp_manager: EmpireGPPManager instance
        """
        await self.unload_plugin(plugin_name)
        # Find the plugin file and reload it
        for plugin_file in self._plugin_directory.glob("*.py"):
            if plugin_file.stem == plugin_name:
                await self.load_plugin(plugin_file, empire_gpp_manager)
                break
    
    def get_plugin(self, plugin_name: str) -> Optional[BasePlugin]:
        """
        Get a plugin by name.
        
        Args:
            plugin_name: Name of the plugin
        
        Returns:
            The plugin instance or None
        """
        return self._plugins.get(plugin_name)
    
    def get_all_plugins(self) -> List[BasePlugin]:
        """Get all loaded plugins."""
        return list(self._plugins.values())
    
    async def shutdown(self):
        """Shutdown all plugins."""
        for plugin_name, plugin in self._plugins.items():
            try:
                await plugin.shutdown()
                logger.info(f"Shutdown plugin: {plugin_name}")
            except Exception as e:
                logger.error(f"Error shutting down plugin {plugin_name}: {e}")
        
        self._plugins.clear()
    
    async def on_tick(self):
        """Call on_tick for all plugins."""
        for plugin in self._plugins.values():
            try:
                await plugin.on_tick()
            except Exception as e:
                logger.error(f"Error in plugin {plugin.name} on_tick: {e}")
    
    async def on_event(self, event_type: str, data: Any):
        """Call on_event for all plugins."""
        for plugin in self._plugins.values():
            try:
                await plugin.on_event(event_type, data)
            except Exception as e:
                logger.error(f"Error in plugin {plugin.name} on_event: {e}")
