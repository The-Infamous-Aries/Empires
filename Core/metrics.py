"""
Empire Metrics Collector

Observability and metrics collection for the Empire system.
"""

import time
import asyncio
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@dataclass
class Metric:
    """A single metric data point."""
    name: str
    value: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class Counter:
    """A counter metric that only increases."""
    name: str
    value: int = 0
    total: int = 0
    
    def increment(self, amount: int = 1):
        """Increment the counter."""
        self.value += amount
        self.total += amount
    
    def reset(self):
        """Reset the counter value (but keep total)."""
        self.value = 0


@dataclass
class Gauge:
    """A gauge metric that can go up and down."""
    name: str
    value: float = 0.0
    min: float = float('inf')
    max: float = float('-inf')
    
    def set(self, value: float):
        """Set the gauge value."""
        self.value = value
        self.min = min(self.min, value)
        self.max = max(self.max, value)
    
    def increment(self, amount: float = 1.0):
        """Increment the gauge."""
        self.set(self.value + amount)
    
    def decrement(self, amount: float = 1.0):
        """Decrement the gauge."""
        self.set(self.value - amount)


@dataclass
class Histogram:
    """A histogram metric that tracks distribution."""
    name: str
    values: List[float] = field(default_factory=list)
    count: int = 0
    sum: float = 0.0
    min: float = float('inf')
    max: float = float('-inf')
    
    def observe(self, value: float):
        """Observe a value."""
        self.values.append(value)
        self.count += 1
        self.sum += value
        self.min = min(self.min, value)
        self.max = max(self.max, value)
    
    def reset(self):
        """Reset the histogram."""
        self.values.clear()
        self.count = 0
        self.sum = 0.0
        self.min = float('inf')
        self.max = float('-inf')
    
    def get_percentile(self, percentile: float) -> float:
        """Get a percentile value."""
        if not self.values:
            return 0.0
        sorted_values = sorted(self.values)
        index = int(len(sorted_values) * percentile / 100)
        return sorted_values[min(index, len(sorted_values) - 1)]
    
    def get_average(self) -> float:
        """Get the average value."""
        if self.count == 0:
            return 0.0
        return self.sum / self.count


class MetricsCollector:
    """
    Collects and manages metrics for the Empire system.
    
    Provides observability for monitoring and debugging.
    """
    
    def __init__(self, config):
        """
        Initialize the metrics collector.
        
        Args:
            config: EmpireConfig instance
        """
        self.config = config
        self._counters: Dict[str, Counter] = {}
        self._gauges: Dict[str, Gauge] = {}
        self._histograms: Dict[str, Histogram] = {}
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._callbacks: List[Callable] = []
    
    async def start(self):
        """Start the metrics collector."""
        if not self.config.metrics_enabled:
            logger.info("Metrics collection disabled")
            return
        
        if self._running:
            return
        
        self._running = True
        if self.config.metrics_interval > 0:
            self._task = asyncio.create_task(self._collect_metrics())
        logger.info("Metrics collector started")
    
    async def stop(self):
        """Stop the metrics collector."""
        if not self._running:
            return
        
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        
        logger.info("Metrics collector stopped")
    
    async def _collect_metrics(self):
        """Collect metrics periodically."""
        while self._running:
            try:
                await asyncio.sleep(self.config.metrics_interval)
                await self._trigger_callbacks()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error collecting metrics: {e}")
    
    async def _trigger_callbacks(self):
        """Trigger all registered callbacks."""
        for callback in self._callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(self.get_all_metrics())
                else:
                    callback(self.get_all_metrics())
            except Exception as e:
                logger.error(f"Error in metrics callback: {e}")
    
    def register_callback(self, callback: Callable):
        """
        Register a callback to be called when metrics are collected.
        
        Args:
            callback: The callback function
        """
        self._callbacks.append(callback)
    
    def counter(self, name: str) -> Counter:
        """
        Get or create a counter.
        
        Args:
            name: The counter name
        
        Returns:
            The Counter instance
        """
        if name not in self._counters:
            self._counters[name] = Counter(name=name)
        return self._counters[name]
    
    def gauge(self, name: str) -> Gauge:
        """
        Get or create a gauge.
        
        Args:
            name: The gauge name
        
        Returns:
            The Gauge instance
        """
        if name not in self._gauges:
            self._gauges[name] = Gauge(name=name)
        return self._gauges[name]
    
    def histogram(self, name: str) -> Histogram:
        """
        Get or create a histogram.
        
        Args:
            name: The histogram name
        
        Returns:
            The Histogram instance
        """
        if name not in self._histograms:
            self._histograms[name] = Histogram(name=name)
        return self._histograms[name]
    
    def get_all_metrics(self) -> Dict[str, Dict]:
        """
        Get all metrics.
        
        Returns:
            A dictionary of all metrics
        """
        return {
            'counters': {name: {'value': c.value, 'total': c.total} for name, c in self._counters.items()},
            'gauges': {name: {'value': g.value, 'min': g.min, 'max': g.max} for name, g in self._gauges.items()},
            'histograms': {
                name: {
                    'count': h.count,
                    'sum': h.sum,
                    'min': h.min,
                    'max': h.max,
                    'average': h.get_average(),
                    'p50': h.get_percentile(50),
                    'p95': h.get_percentile(95),
                    'p99': h.get_percentile(99),
                }
                for name, h in self._histograms.items()
            },
        }
    
    def reset_counters(self):
        """Reset all counters."""
        for counter in self._counters.values():
            counter.reset()
    
    def reset_histograms(self):
        """Reset all histograms."""
        for histogram in self._histograms.values():
            histogram.reset()
