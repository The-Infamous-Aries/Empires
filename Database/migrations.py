"""
Database Migration System (Async)

This module handles database schema migrations for the Empire game using async/await.
"""

import aiosqlite
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class Migration:
    """Represents a database migration."""
    
    def __init__(self, version: int, name: str, up_sql: str, down_sql: str = ""):
        self.version = version
        self.name = name
        self.up_sql = up_sql
        self.down_sql = down_sql


class MigrationSystem:
    """Manages database migrations asynchronously."""
    
    def __init__(self, db_path: str = "empire.db", database_pool=None):
        """
        Initialize the migration system.
        
        Args:
            db_path: Path to the database file
            database_pool: Optional EmpireDatabasePoolManager instance
        """
        self.db_path = db_path
        self.database_pool = database_pool
        self.migrations_table = "_migrations"
        self.migrations: List[Migration] = []
    
    async def get_connection(self):
        """Get a database connection."""
        if self.database_pool:
            async with self.database_pool.acquire_connection() as conn:
                yield conn
        else:
            conn = await aiosqlite.connect(self.db_path)
            try:
                yield conn
            finally:
                await conn.close()
    
    async def create_migrations_table(self):
        """Create the migrations tracking table."""
        async for conn in self.get_connection():
            await conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {self.migrations_table} (
                    version INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TEXT NOT NULL
                )
            """)
            await conn.commit()
    
    async def get_applied_migrations(self) -> List[int]:
        """Get list of applied migration versions."""
        async for conn in self.get_connection():
            cursor = await conn.execute(f"SELECT version FROM {self.migrations_table} ORDER BY version")
            rows = await cursor.fetchall()
            return [row[0] for row in rows]
    
    def register_migration(self, migration: Migration):
        """Register a migration."""
        self.migrations.append(migration)
        # Sort by version
        self.migrations.sort(key=lambda m: m.version)
    
    async def apply_migration(self, migration: Migration) -> bool:
        """Apply a single migration."""
        async for conn in self.get_connection():
            try:
                # Execute migration
                for statement in migration.up_sql.split(';'):
                    statement = statement.strip()
                    if statement:
                        try:
                            await conn.execute(statement)
                        except aiosqlite.OperationalError as e:
                            # Ignore errors for columns that already exist
                            if "duplicate column name" in str(e).lower() or "column" in str(e).lower() and "already exists" in str(e).lower():
                                logger.warning(f"Column already exists, skipping: {e}")
                                continue
                            raise
                
                # Record migration
                await conn.execute(
                    f"INSERT INTO {self.migrations_table} (version, name, applied_at) VALUES (?, ?, ?)",
                    (migration.version, migration.name, datetime.now().isoformat())
                )
                
                await conn.commit()
                logger.info(f"Applied migration {migration.version}: {migration.name}")
                return True
            except Exception as e:
                await conn.rollback()
                logger.error(f"Migration {migration.version} failed: {e}")
                return False
    
    async def rollback_migration(self, migration: Migration) -> bool:
        """Rollback a single migration."""
        async for conn in self.get_connection():
            try:
                if not migration.down_sql:
                    logger.warning(f"Migration {migration.version} has no rollback script")
                    return False
                
                # Execute rollback
                for statement in migration.down_sql.split(';'):
                    statement = statement.strip()
                    if statement:
                        await conn.execute(statement)
                
                # Remove migration record
                await conn.execute(
                    f"DELETE FROM {self.migrations_table} WHERE version = ?",
                    (migration.version,)
                )
                
                await conn.commit()
                logger.info(f"Rolled back migration {migration.version}: {migration.name}")
                return True
            except Exception as e:
                await conn.rollback()
                logger.error(f"Rollback of migration {migration.version} failed: {e}")
                return False
    
    async def migrate(self, target_version: Optional[int] = None) -> bool:
        """Run all pending migrations up to target version."""
        await self.create_migrations_table()
        
        applied = await self.get_applied_migrations()
        
        for migration in self.migrations:
            if migration.version in applied:
                continue
            
            if target_version and migration.version > target_version:
                break
            
            logger.info(f"Applying migration {migration.version}: {migration.name}")
            if not await self.apply_migration(migration):
                return False
        
        return True
    
    async def rollback(self, target_version: int) -> bool:
        """Rollback to target version."""
        applied = await self.get_applied_migrations()
        
        # Rollback in reverse order
        for migration in reversed(self.migrations):
            if migration.version not in applied:
                continue
            
            if migration.version <= target_version:
                break
            
            logger.info(f"Rolling back migration {migration.version}: {migration.name}")
            if not await self.rollback_migration(migration):
                return False
        
        return True
    
    async def get_current_version(self) -> int:
        """Get current database version."""
        await self.create_migrations_table()
        applied = await self.get_applied_migrations()
        return max(applied) if applied else 0


# Define migrations for unified Empire database
def get_initial_migrations() -> List[Migration]:
    """Get initial database migrations for Empire."""
    return [
        Migration(
            version=1,
            name="Initial unified schema",
            up_sql="""
                CREATE TABLE IF NOT EXISTS nations (
                    nation_id TEXT PRIMARY KEY,
                    nation_name TEXT NOT NULL,
                    ruler_name TEXT NOT NULL,
                    capital_city_name TEXT NOT NULL,
                    national_color TEXT NOT NULL,
                    government_type TEXT NOT NULL,
                    religion_type TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS cities (
                    city_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    city_name TEXT NOT NULL,
                    infrastructure INTEGER DEFAULT 0,
                    land INTEGER DEFAULT 0,
                    population INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS military (
                    military_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    soldiers INTEGER DEFAULT 0,
                    tanks INTEGER DEFAULT 0,
                    aircraft INTEGER DEFAULT 0,
                    ships INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS alliances (
                    alliance_id TEXT PRIMARY KEY,
                    alliance_name TEXT NOT NULL,
                    leader_nation_id TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (leader_nation_id) REFERENCES nations(nation_id)
                );
                
                CREATE TABLE IF NOT EXISTS alliance_members (
                    member_id TEXT PRIMARY KEY,
                    alliance_id TEXT NOT NULL,
                    nation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (alliance_id) REFERENCES alliances(alliance_id) ON DELETE CASCADE,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS wars (
                    war_id TEXT PRIMARY KEY,
                    attacker_id TEXT NOT NULL,
                    defender_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ended_at TIMESTAMP,
                    FOREIGN KEY (attacker_id) REFERENCES nations(nation_id),
                    FOREIGN KEY (defender_id) REFERENCES nations(nation_id)
                );
                
                CREATE TABLE IF NOT EXISTS trade_circles (
                    circle_id TEXT PRIMARY KEY,
                    circle_name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS circle_members (
                    member_id TEXT PRIMARY KEY,
                    circle_id TEXT NOT NULL,
                    nation_id TEXT NOT NULL,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (circle_id) REFERENCES trade_circles(circle_id) ON DELETE CASCADE,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    event_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS diplomatic_relations (
                    relation_id TEXT PRIMARY KEY,
                    nation_a_id TEXT NOT NULL,
                    nation_b_id TEXT NOT NULL,
                    relation_type TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_a_id) REFERENCES nations(nation_id),
                    FOREIGN KEY (nation_b_id) REFERENCES nations(nation_id)
                );
                
                CREATE TABLE IF NOT EXISTS spy_operations (
                    operation_id TEXT PRIMARY KEY,
                    spy_nation_id TEXT NOT NULL,
                    target_nation_id TEXT NOT NULL,
                    operation_type TEXT NOT NULL,
                    result TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (spy_nation_id) REFERENCES nations(nation_id),
                    FOREIGN KEY (target_nation_id) REFERENCES nations(nation_id)
                );
                
                CREATE TABLE IF NOT EXISTS plugin_data (
                    plugin_name TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (plugin_name, key)
                );
                
                CREATE TABLE IF NOT EXISTS tick_state (
                    tick_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tick_number INTEGER NOT NULL,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT NOT NULL
                );
            """,
            down_sql="""
                DROP TABLE IF EXISTS tick_state;
                DROP TABLE IF EXISTS plugin_data;
                DROP TABLE IF EXISTS spy_operations;
                DROP TABLE IF EXISTS diplomatic_relations;
                DROP TABLE IF EXISTS events;
                DROP TABLE IF EXISTS circle_members;
                DROP TABLE IF EXISTS trade_circles;
                DROP TABLE IF EXISTS wars;
                DROP TABLE IF EXISTS alliance_members;
                DROP TABLE IF EXISTS alliances;
                DROP TABLE IF EXISTS military;
                DROP TABLE IF EXISTS cities;
                DROP TABLE IF EXISTS nations;
            """
        )
    ]


async def initialize_migrations(db_path: str = "empire.db", database_pool=None) -> MigrationSystem:
    """Initialize migration system with initial migrations."""
    migration_system = MigrationSystem(db_path, database_pool)
    
    for migration in get_initial_migrations():
        migration_system.register_migration(migration)
    
    return migration_system
