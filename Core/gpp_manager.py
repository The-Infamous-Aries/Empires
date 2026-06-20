"""
Empire GPP Manager

Orchestrator for all Empire GPP components.
Auto-wires EmpireDB, registers all components, and manages lifecycle.
"""

import asyncio
import logging
from typing import Dict, Optional, Any
from .config import EmpireConfig
from .lock_manager import EmpireLockManager
from .database_pool import EmpireDatabasePoolManager
from .write_queue import EmpireWriteQueueManager
from .event_bus import EmpireEventBus
from .plugin_manager import EmpirePluginManager
from .metrics import MetricsCollector
from ..Database.empire_db import EmpireDB

logger = logging.getLogger(__name__)


class EmpireGPPManager:
    """
    Main orchestrator for the Empire GPP system.

    Manages all core infrastructure, creates EmpireDB, and coordinates components.
    """

    def __init__(self, config: Optional[EmpireConfig] = None):
        """
        Initialize the GPP manager.

        Args:
            config: EmpireConfig instance (uses default if None)
        """
        self.config = config or EmpireConfig()
        self.config.validate()

        # Core infrastructure
        self.lock_manager = EmpireLockManager(self.config)
        self.database_pool = EmpireDatabasePoolManager(self.config)
        self.write_queue = EmpireWriteQueueManager(self.config, self.database_pool)
        self.event_bus = EmpireEventBus(self.config)
        self.plugin_manager = EmpirePluginManager(self.config)
        self.metrics = MetricsCollector(self.config)

        # Database
        game_db_path = self.config.game_database_path or self.config.database_path
        self.db = EmpireDB(game_db_path, self.database_pool)

        # Components
        self._components: Dict[str, Any] = {}

        # State
        self._running = False
        self._initialized = False

    @property
    def components(self) -> Dict[str, Any]:
        """Get all registered components."""
        return self._components

    @property
    def is_running(self) -> bool:
        """Check if the GPP manager is running."""
        return self._running

    async def initialize(self):
        """Initialize the GPP manager and all core infrastructure."""
        if self._initialized:
            return

        logger.info("Initializing Empire GPP Manager...")

        # Initialize database pool
        await self.database_pool.initialize()

        # Initialize database schema
        await self.db.initialize()

        # Initialize metrics
        await self.metrics.start()

        # Initialize event bus
        await self.event_bus.start()

        # Initialize write queue
        await self.write_queue.start()

        # Initialize plugin manager
        await self.plugin_manager.initialize(self)

        self._initialized = True
        logger.info("Empire GPP Manager initialized")

    async def register_component(self, name: str, component: Any):
        """
        Register a component with the GPP manager.

        Args:
            name: Component name
            component: Component instance
        """
        self._components[name] = component
        logger.info(f"Registered component: {name}")

    async def unregister_component(self, name: str):
        """
        Unregister a component from the GPP manager.

        Args:
            name: Component name
        """
        if name in self._components:
            component = self._components[name]
            if hasattr(component, 'stop'):
                await component.stop()
            del self._components[name]
            logger.info(f"Unregistered component: {name}")

    def get_component(self, name: str) -> Optional[Any]:
        """
        Get a component by name.

        Args:
            name: Component name

        Returns:
            Component instance or None
        """
        return self._components.get(name)

    async def start(self):
        """Start all components and the GPP system."""
        if self._running:
            return

        if not self._initialized:
            await self.initialize()

        logger.info("Starting Empire GPP Manager...")

        # Start all components
        for name, component in self._components.items():
            if hasattr(component, 'start'):
                try:
                    await component.start()
                    logger.info(f"Started component: {name}")
                except Exception as e:
                    logger.error(f"Failed to start component {name}: {e}")

        self._running = True
        logger.info("Empire GPP Manager started")

    async def stop(self):
        """Stop all components and the GPP system."""
        if not self._running:
            return

        logger.info("Shutting down Empire GPP Manager...")

        self._running = False

        # Stop all components in reverse order
        for name in reversed(list(self._components.keys())):
            component = self._components[name]
            if hasattr(component, 'stop'):
                try:
                    await component.stop()
                    logger.info(f"Stopped component: {name}")
                except Exception as e:
                    logger.error(f"Failed to stop component {name}: {e}")

        # Stop core infrastructure
        await self.plugin_manager.shutdown()
        await self.write_queue.stop()
        await self.event_bus.stop()
        await self.metrics.stop()
        await self.database_pool.close_all()

        logger.info("Empire GPP Manager shut down")

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on all components.

        Returns:
            Health check results
        """
        health = {
            'gpp_manager': {
                'running': self._running,
                'initialized': self._initialized,
            },
            'components': {},
            'infrastructure': {
                'lock_manager': {
                    'locked': await self.lock_manager.is_locked(),
                    'lock_count': self.lock_manager.get_lock_count(),
                },
                'write_queue': self.write_queue.get_stats(),
                'event_bus': self.event_bus.get_stats(),
                'metrics': self.metrics.get_all_metrics(),
            },
        }

        # Check component health
        for name, component in self._components.items():
            if hasattr(component, 'health_check'):
                try:
                    health['components'][name] = await component.health_check()
                except Exception as e:
                    health['components'][name] = {'error': str(e)}
            else:
                health['components'][name] = {'status': 'unknown'}

        return health

    async def publish_event(self, event_type: str, data: Any = None):
        """Publish an event to the event bus."""
        await self.event_bus.publish(event_type, data)

    async def subscribe_event(self, event_type: str, callback):
        """Subscribe to an event."""
        await self.event_bus.subscribe(event_type, callback)

    def get_metrics(self) -> Dict[str, Any]:
        """Get all metrics."""
        return self.metrics.get_all_metrics()

    def get_config(self) -> EmpireConfig:
        """Get the configuration."""
        return self.config
