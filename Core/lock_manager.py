"""
Empire Lock Manager

Unified locking strategy for all database operations using asyncio.Lock.
"""

import asyncio
from typing import Dict, Optional
from contextlib import asynccontextmanager


class EmpireLockManager:
    """
    Manages locks for database operations.
    
    Uses asyncio.Lock for thread-safe database access.
    Since we're using a single unified database (empire.db), we only need one lock.
    """
    
    def __init__(self, config):
        """
        Initialize the lock manager.
        
        Args:
            config: EmpireConfig instance
        """
        self.config = config
        self._lock: asyncio.Lock = asyncio.Lock()
        self._lock_count: int = 0
    
    @asynccontextmanager
    async def acquire_lock(self, timeout: Optional[float] = None):
        """
        Acquire the database lock.
        
        Args:
            timeout: Maximum time to wait for the lock (None for no timeout)
        
        Yields:
            The acquired lock
        
        Raises:
            asyncio.TimeoutError: If the lock cannot be acquired within the timeout
        """
        timeout = timeout or self.config.lock_timeout
        try:
            acquired = await asyncio.wait_for(self._lock.acquire(), timeout=timeout)
            if acquired:
                self._lock_count += 1
                yield self._lock
            else:
                raise asyncio.TimeoutError("Could not acquire lock within timeout")
        except asyncio.TimeoutError:
            raise
        finally:
            if self._lock.locked():
                self._lock.release()
                self._lock_count -= 1
    
    async def is_locked(self) -> bool:
        """Check if the lock is currently held."""
        return self._lock.locked()
    
    def get_lock_count(self) -> int:
        """Get the number of times the lock has been acquired."""
        return self._lock_count
    
    async def reset(self):
        """Reset the lock manager (for testing purposes)."""
        if self._lock.locked():
            self._lock.release()
        self._lock = asyncio.Lock()
        self._lock_count = 0
