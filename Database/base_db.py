"""
Base Database Class

Async base database class using aiosqlite.
"""

import aiosqlite
import asyncio
from abc import ABC, abstractmethod
from typing import Optional, List, Tuple, Any, Dict
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)


class BaseDatabase(ABC):
    """
    Abstract base class for async database operations.
    
    Provides common database operations using aiosqlite.
    """
    
    def __init__(self, database_path: str, database_pool=None):
        """
        Initialize the base database.
        
        Args:
            database_path: Path to the database file
            database_pool: Optional EmpireDatabasePoolManager instance
        """
        self.database_path = database_path
        self.database_pool = database_pool
        self._initialized = False
    
    async def initialize(self):
        """Initialize the database and create tables."""
        if self._initialized:
            return
        
        await self._create_schema()
        self._initialized = True
        logger.info(f"Database initialized: {self.database_path}")
    
    @abstractmethod
    async def _create_schema(self):
        """Create the database schema. Must be implemented by subclasses."""
        pass
    
    @asynccontextmanager
    async def get_connection(self):
        """
        Get a database connection.
        
        Yields:
            aiosqlite.Connection: Database connection
        """
        if self.database_pool:
            async with self.database_pool.acquire_connection() as conn:
                yield conn
        else:
            conn = await aiosqlite.connect(self.database_path)
            try:
                yield conn
            finally:
                await conn.close()
    
    async def execute(self, sql: str, parameters: Tuple = ()) -> aiosqlite.Cursor:
        """
        Execute a SQL statement.
        
        Args:
            sql: SQL statement to execute
            parameters: Parameters for the SQL statement
        
        Returns:
            The cursor
        """
        async with self.get_connection() as conn:
            cursor = await conn.execute(sql, parameters)
            await conn.commit()
            return cursor
    
    async def executemany(self, sql: str, parameters: List[Tuple]) -> aiosqlite.Cursor:
        """
        Execute a SQL statement multiple times.
        
        Args:
            sql: SQL statement to execute
            parameters: List of parameter tuples
        
        Returns:
            The cursor
        """
        async with self.get_connection() as conn:
            cursor = await conn.executemany(sql, parameters)
            await conn.commit()
            return cursor
    
    async def fetchone(self, sql: str, parameters: Tuple = ()) -> Optional[Tuple]:
        """
        Fetch one row from a SQL query.
        
        Args:
            sql: SQL query to execute
            parameters: Parameters for the SQL query
        
        Returns:
            A single row or None
        """
        async with self.get_connection() as conn:
            cursor = await conn.execute(sql, parameters)
            return await cursor.fetchone()
    
    async def fetchall(self, sql: str, parameters: Tuple = ()) -> List[Tuple]:
        """
        Fetch all rows from a SQL query.
        
        Args:
            sql: SQL query to execute
            parameters: Parameters for the SQL query
        
        Returns:
            A list of rows
        """
        async with self.get_connection() as conn:
            cursor = await conn.execute(sql, parameters)
            return await cursor.fetchall()
    
    async def fetchdict(self, sql: str, parameters: Tuple = ()) -> Optional[Dict[str, Any]]:
        """
        Fetch one row as a dictionary.
        
        Args:
            sql: SQL query to execute
            parameters: Parameters for the SQL query
        
        Returns:
            A dictionary or None
        """
        async with self.get_connection() as conn:
            conn.row_factory = aiosqlite.Row
            cursor = await conn.execute(sql, parameters)
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    async def fetchalldict(self, sql: str, parameters: Tuple = ()) -> List[Dict[str, Any]]:
        """
        Fetch all rows as dictionaries.
        
        Args:
            sql: SQL query to execute
            parameters: Parameters for the SQL query
        
        Returns:
            A list of dictionaries
        """
        async with self.get_connection() as conn:
            conn.row_factory = aiosqlite.Row
            cursor = await conn.execute(sql, parameters)
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def insert(self, table: str, data: Dict[str, Any]) -> int:
        """
        Insert a row into a table.
        
        Args:
            table: Table name
            data: Dictionary of column names and values
        
        Returns:
            The last insert row ID
        """
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?'] * len(data))
        sql = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
        
        async with self.get_connection() as conn:
            cursor = await conn.execute(sql, tuple(data.values()))
            await conn.commit()
            return cursor.lastrowid
    
    async def update(self, table: str, data: Dict[str, Any], where: str, where_params: Tuple = ()) -> int:
        """
        Update rows in a table.
        
        Args:
            table: Table name
            data: Dictionary of column names and values to update
            where: WHERE clause
            where_params: Parameters for the WHERE clause
        
        Returns:
            Number of rows affected
        """
        set_clause = ', '.join([f"{k} = ?" for k in data.keys()])
        sql = f"UPDATE {table} SET {set_clause} WHERE {where}"
        
        async with self.get_connection() as conn:
            cursor = await conn.execute(sql, tuple(data.values()) + where_params)
            await conn.commit()
            return cursor.rowcount
    
    async def delete(self, table: str, where: str, where_params: Tuple = ()) -> int:
        """
        Delete rows from a table.
        
        Args:
            table: Table name
            where: WHERE clause
            where_params: Parameters for the WHERE clause
        
        Returns:
            Number of rows affected
        """
        sql = f"DELETE FROM {table} WHERE {where}"
        
        async with self.get_connection() as conn:
            cursor = await conn.execute(sql, where_params)
            await conn.commit()
            return cursor.rowcount
    
    async def table_exists(self, table: str) -> bool:
        """
        Check if a table exists.
        
        Args:
            table: Table name
        
        Returns:
            True if the table exists, False otherwise
        """
        sql = "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
        result = await self.fetchone(sql, (table,))
        return result is not None
    
    async def get_tables(self) -> List[str]:
        """
        Get all table names.
        
        Returns:
            List of table names
        """
        sql = "SELECT name FROM sqlite_master WHERE type='table'"
        rows = await self.fetchall(sql)
        return [row[0] for row in rows]
    
    async def close(self):
        """Close the database connection."""
        if self.database_pool:
            await self.database_pool.close_all()
        self._initialized = False
