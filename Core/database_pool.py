"""
Empire Database Pool Manager

Connection pooling for aiosqlite database operations.
"""

import aiosqlite
import asyncio
from typing import Optional, List
from contextlib import asynccontextmanager


class EmpireDatabasePoolManager:
    """
    Manages a pool of aiosqlite database connections.
    
    Provides connection pooling for efficient database access.
    """
    
    def __init__(self, config):
        """
        Initialize the database pool manager.
        
        Args:
            config: EmpireConfig instance
        """
        self.config = config
        self._pool: List[aiosqlite.Connection] = []
        self._semaphore = asyncio.Semaphore(config.database_pool_size)
        self._initialized = False
    
    async def initialize(self):
        """Initialize the database pool."""
        if self._initialized:
            return
        
        # Create the database file if it doesn't exist
        from pathlib import Path
        db_path = Path(self.config.database_path)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Pre-populate the pool with connections
        for _ in range(self.config.database_pool_size):
            conn = await aiosqlite.connect(self.config.database_path)
            self._pool.append(conn)
        
        self._initialized = True
    
    @asynccontextmanager
    async def acquire_connection(self):
        """
        Acquire a connection from the pool.
        
        Yields:
            aiosqlite.Connection: A database connection
        """
        if not self._initialized:
            await self.initialize()
        
        async with self._semaphore:
            if self._pool:
                conn = self._pool.pop()
                try:
                    yield conn
                finally:
                    self._pool.append(conn)
            else:
                # Pool exhausted, create a temporary connection
                conn = await aiosqlite.connect(self.config.database_path)
                try:
                    yield conn
                finally:
                    await conn.close()
    
    async def close_all(self):
        """Close all connections in the pool."""
        for conn in self._pool:
            await conn.close()
        self._pool.clear()
        self._initialized = False
    
    async def execute(self, sql: str, parameters: tuple = ()):
        """
        Execute a SQL statement.
        
        Args:
            sql: SQL statement to execute
            parameters: Parameters for the SQL statement
        
        Returns:
            The cursor
        """
        async with self.acquire_connection() as conn:
            cursor = await conn.execute(sql, parameters)
            await conn.commit()
            return cursor
    
    async def executemany(self, sql: str, parameters: List[tuple]):
        """
        Execute a SQL statement multiple times.
        
        Args:
            sql: SQL statement to execute
            parameters: List of parameter tuples
        
        Returns:
            The cursor
        """
        async with self.acquire_connection() as conn:
            cursor = await conn.executemany(sql, parameters)
            await conn.commit()
            return cursor
    
    async def fetchone(self, sql: str, parameters: tuple = ()):
        """
        Fetch one row from a SQL query.
        
        Args:
            sql: SQL query to execute
            parameters: Parameters for the SQL query
        
        Returns:
            A single row or None
        """
        async with self.acquire_connection() as conn:
            cursor = await conn.execute(sql, parameters)
            return await cursor.fetchone()
    
    async def fetchall(self, sql: str, parameters: tuple = ()):
        """
        Fetch all rows from a SQL query.
        
        Args:
            sql: SQL query to execute
            parameters: Parameters for the SQL query
        
        Returns:
            A list of rows
        """
        async with self.acquire_connection() as conn:
            cursor = await conn.execute(sql, parameters)
            return await cursor.fetchall()
