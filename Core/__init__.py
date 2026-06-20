"""
Empire Core Infrastructure

This package contains the core infrastructure for the Empire GPP system:
- LockManager: Unified locking strategy for all database operations
- DatabasePoolManager: Connection pooling with aiosqlite
- WriteQueueManager: Priority-based write queuing
- EventBus: Component communication via pub/sub
- PluginManager: Plugin system for extensibility
- MetricsCollector: Observability and metrics collection
- GPPManager: Orchestrator for all components
- EmpireConfig: Configuration management
"""

from .config import EmpireConfig
from .lock_manager import EmpireLockManager
from .database_pool import EmpireDatabasePoolManager
from .write_queue import EmpireWriteQueueManager
from .event_bus import EmpireEventBus
from .plugin_manager import EmpirePluginManager
from .metrics import MetricsCollector
from .gpp_manager import EmpireGPPManager

__all__ = [
    'EmpireConfig',
    'EmpireLockManager',
    'EmpireDatabasePoolManager',
    'EmpireWriteQueueManager',
    'EmpireEventBus',
    'EmpirePluginManager',
    'MetricsCollector',
    'EmpireGPPManager',
]
