"""
Empire Event Bus

Component communication via pub/sub pattern.
"""

import asyncio
from typing import Callable, Any, Dict, Set, Optional
import logging

logger = logging.getLogger(__name__)


class EmpireEventBus:
    """
    Event bus for component communication.
    
    Implements a publish-subscribe pattern for components to communicate.
    """
    
    def __init__(self, config):
        """
        Initialize the event bus.
        
        Args:
            config: EmpireConfig instance
        """
        self.config = config
        self._subscribers: Dict[str, Set[Callable]] = {}
        self._lock = asyncio.Lock()
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=config.event_bus_max_queue_size)
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._stats = {
            'total_published': 0,
            'total_processed': 0,
            'total_failed': 0,
        }
    
    async def start(self):
        """Start the event bus processor."""
        if self._running:
            return
        
        self._running = True
        self._task = asyncio.create_task(self._process_events())
        logger.info("Event bus started")
    
    async def stop(self):
        """Stop the event bus processor."""
        if not self._running:
            return
        
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        
        # Process remaining events
        await self._flush()
        logger.info("Event bus stopped")
    
    async def subscribe(self, event_type: str, callback: Callable):
        """
        Subscribe to an event type.
        
        Args:
            event_type: The type of event to subscribe to
            callback: The callback function to call when the event is published
        """
        async with self._lock:
            if event_type not in self._subscribers:
                self._subscribers[event_type] = set()
            self._subscribers[event_type].add(callback)
        
        logger.debug(f"Subscribed to event: {event_type}")
    
    async def unsubscribe(self, event_type: str, callback: Callable):
        """
        Unsubscribe from an event type.
        
        Args:
            event_type: The type of event to unsubscribe from
            callback: The callback function to remove
        """
        async with self._lock:
            if event_type in self._subscribers:
                self._subscribers[event_type].discard(callback)
                if not self._subscribers[event_type]:
                    del self._subscribers[event_type]
        
        logger.debug(f"Unsubscribed from event: {event_type}")
    
    async def publish(self, event_type: str, data: Any = None):
        """
        Publish an event.
        
        Args:
            event_type: The type of event to publish
            data: The event data
        """
        try:
            await self._queue.put((event_type, data))
            self._stats['total_published'] += 1
        except asyncio.QueueFull:
            logger.error(f"Event bus queue full, dropping event: {event_type}")
    
    async def _process_events(self):
        """Process events in a background task."""
        while self._running:
            try:
                event_type, data = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                await self._dispatch_event(event_type, data)
                self._stats['total_processed'] += 1
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error processing event: {e}")
                self._stats['total_failed'] += 1
    
    async def _dispatch_event(self, event_type: str, data: Any):
        """
        Dispatch an event to all subscribers.
        
        Args:
            event_type: The type of event
            data: The event data
        """
        async with self._lock:
            subscribers = self._subscribers.get(event_type, set())
        
        # Call all subscribers
        for callback in subscribers:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(data)
                else:
                    callback(data)
            except Exception as e:
                logger.error(f"Error in event callback for {event_type}: {e}")
    
    async def _flush(self):
        """Flush remaining events in the queue."""
        while not self._queue.empty():
            try:
                event_type, data = self._queue.get_nowait()
                await self._dispatch_event(event_type, data)
            except asyncio.QueueEmpty:
                break
    
    def get_queue_size(self) -> int:
        """Get the current size of the event queue."""
        return self._queue.qsize()
    
    def get_stats(self) -> dict:
        """Get statistics about the event bus."""
        return {
            **self._stats,
            'queue_size': self._queue.qsize(),
            'subscriber_count': sum(len(subs) for subs in self._subscribers.values()),
        }
