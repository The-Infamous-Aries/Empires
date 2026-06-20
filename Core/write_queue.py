"""
Empire Write Queue Manager

Priority-based write queuing for database operations.
"""

import asyncio
from dataclasses import dataclass
from enum import IntEnum
from typing import Callable, Any, Optional, List
from collections import deque
import logging

logger = logging.getLogger(__name__)


class WritePriority(IntEnum):
    """Priority levels for write operations."""
    HIGH = 1
    NORMAL = 2
    LOW = 3


@dataclass
class WriteOperation:
    """A write operation in the queue."""
    operation: Callable
    args: tuple
    kwargs: dict
    priority: WritePriority
    callback: Optional[Callable] = None


class EmpireWriteQueueManager:
    """
    Manages a priority queue for database write operations.
    
    Batches write operations for efficiency and ensures order.
    """
    
    def __init__(self, config, database_pool):
        """
        Initialize the write queue manager.
        
        Args:
            config: EmpireConfig instance
            database_pool: EmpireDatabasePoolManager instance
        """
        self.config = config
        self.database_pool = database_pool
        self._queue: deque[WriteOperation] = deque()
        self._lock = asyncio.Lock()
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._stats = {
            'total_queued': 0,
            'total_processed': 0,
            'total_failed': 0,
        }
    
    async def start(self):
        """Start the write queue processor."""
        if self._running:
            return
        
        self._running = True
        self._task = asyncio.create_task(self._process_queue())
        logger.info("Write queue manager started")
    
    async def stop(self):
        """Stop the write queue processor."""
        if not self._running:
            return
        
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        
        # Process remaining items in the queue
        await self._flush()
        logger.info("Write queue manager stopped")
    
    async def enqueue(
        self,
        operation: Callable,
        args: tuple = (),
        kwargs: dict = None,
        priority: WritePriority = WritePriority.NORMAL,
        callback: Optional[Callable] = None
    ):
        """
        Enqueue a write operation.
        
        Args:
            operation: The write operation to execute
            args: Positional arguments for the operation
            kwargs: Keyword arguments for the operation
            priority: Priority level for the operation
            callback: Optional callback to call after operation completes
        """
        kwargs = kwargs or {}
        write_op = WriteOperation(
            operation=operation,
            args=args,
            kwargs=kwargs,
            priority=priority,
            callback=callback
        )
        
        async with self._lock:
            # Insert based on priority (high priority at the front)
            if priority == WritePriority.HIGH:
                self._queue.appendleft(write_op)
            else:
                self._queue.append(write_op)
            self._stats['total_queued'] += 1
        
        # Check if queue is full
        if len(self._queue) >= self.config.write_queue_max_size:
            await self._flush()
    
    async def _process_queue(self):
        """Process the write queue in a background task."""
        while self._running:
            try:
                await asyncio.sleep(self.config.write_queue_flush_interval)
                await self._flush()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error processing write queue: {e}")
    
    async def _flush(self):
        """Flush the write queue by executing all operations."""
        async with self._lock:
            if not self._queue:
                return
            
            # Get batch of operations
            batch_size = min(self.config.write_queue_batch_size, len(self._queue))
            batch = [self._queue.popleft() for _ in range(batch_size)]
        
        # Execute operations outside the lock
        for write_op in batch:
            try:
                result = await write_op.operation(*write_op.args, **write_op.kwargs)
                self._stats['total_processed'] += 1
                
                if write_op.callback:
                    await write_op.callback(result)
            except Exception as e:
                logger.error(f"Error executing write operation: {e}")
                self._stats['total_failed'] += 1
    
    async def flush(self):
        """Manually flush the write queue."""
        await self._flush()
    
    def get_queue_size(self) -> int:
        """Get the current size of the write queue."""
        return len(self._queue)
    
    def get_stats(self) -> dict:
        """Get statistics about the write queue."""
        return {
            **self._stats,
            'queue_size': len(self._queue),
        }
