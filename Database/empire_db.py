"""
Empire Unified Database Manager

Single unified database manager for all Empire data.
"""

from typing import Optional, Dict, Any, List
from .base_db import BaseDatabase
import logging

logger = logging.getLogger(__name__)


class EmpireDB(BaseDatabase):
    """
    Unified database manager for the Empire system.
    
    Manages all Empire data in a single database (empire.db).
    """
    
    def __init__(self, database_path: str, database_pool=None):
        """
        Initialize the Empire database.
        
        Args:
            database_path: Path to the empire.db file
            database_pool: Optional EmpireDatabasePoolManager instance
        """
        super().__init__(database_path, database_pool)
    
    async def _create_schema(self):
        """Create the Empire database schema."""
        # Nations table
        await self.execute("""
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
            )
        """)
        
        # Cities table
        await self.execute("""
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
            )
        """)
        
        # Military table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS military (
                military_id TEXT PRIMARY KEY,
                nation_id TEXT NOT NULL,
                soldiers INTEGER DEFAULT 0,
                tanks INTEGER DEFAULT 0,
                -- Granular aircraft types
                fighters INTEGER DEFAULT 0,
                bombers INTEGER DEFAULT 0,
                aircraft INTEGER DEFAULT 0,
                -- Granular ship types
                destroyers INTEGER DEFAULT 0,
                cruisers INTEGER DEFAULT 0,
                battleships INTEGER DEFAULT 0,
                carriers INTEGER DEFAULT 0,
                submarines INTEGER DEFAULT 0,
                ships INTEGER DEFAULT 0,
                cruise_missiles INTEGER DEFAULT 0,
                nuclear_weapons INTEGER DEFAULT 0,
                spies INTEGER DEFAULT 0,
                soldier_cap INTEGER DEFAULT 0,
                tank_cap INTEGER DEFAULT 0,
                aircraft_cap INTEGER DEFAULT 0,
                ship_cap INTEGER DEFAULT 0,
                missile_cap INTEGER DEFAULT 0,
                nuke_cap INTEGER DEFAULT 0,
                spy_cap INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)
        
        # Alliances table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS alliances (
                alliance_id TEXT PRIMARY KEY,
                alliance_name TEXT NOT NULL,
                leader_nation_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (leader_nation_id) REFERENCES nations(nation_id)
            )
        """)
        
        # Alliance members table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS alliance_members (
                member_id TEXT PRIMARY KEY,
                alliance_id TEXT NOT NULL,
                nation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (alliance_id) REFERENCES alliances(alliance_id) ON DELETE CASCADE,
                FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)
        
        # Alliance monuments table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS alliance_monuments (
                monument_id TEXT PRIMARY KEY,
                alliance_id TEXT NOT NULL,
                monument_type TEXT NOT NULL,
                level INTEGER DEFAULT 0,
                built_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (alliance_id) REFERENCES alliances(alliance_id) ON DELETE CASCADE
            )
        """)
        
        # Treaties table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS treaties (
                treaty_id TEXT PRIMARY KEY,
                party_a_id TEXT NOT NULL,
                party_b_id TEXT NOT NULL,
                treaty_type TEXT NOT NULL,
                status TEXT NOT NULL,
                terms TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                FOREIGN KEY (party_a_id) REFERENCES nations(nation_id),
                FOREIGN KEY (party_b_id) REFERENCES nations(nation_id)
            )
        """)
        
        # Sanctions table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS sanctions (
                sanction_id TEXT PRIMARY KEY,
                target_nation_id TEXT NOT NULL,
                imposing_alliance_id TEXT,
                imposing_nation_id TEXT,
                sanction_type TEXT NOT NULL,
                income_penalty REAL DEFAULT -0.10,
                spy_success_bonus REAL DEFAULT 0.20,
                military_penalty REAL DEFAULT -0.05,
                diplomatic_penalty REAL DEFAULT -0.10,
                technology_penalty REAL DEFAULT -0.05,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                FOREIGN KEY (target_nation_id) REFERENCES nations(nation_id)
            )
        """)
        
        # Nation cooldowns table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS nation_cooldowns (
                cooldown_id TEXT PRIMARY KEY,
                nation_id TEXT NOT NULL,
                cooldown_type TEXT NOT NULL,
                ticks_remaining INTEGER DEFAULT 0,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)
        
        # Nation resources table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS nation_resources (
                resource_id TEXT PRIMARY KEY,
                nation_id TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                amount REAL DEFAULT 0.0,
                production_rate REAL DEFAULT 0.0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)
        
        # City resources table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS city_resources (
                resource_id TEXT PRIMARY KEY,
                city_id TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                amount REAL DEFAULT 0.0,
                FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE
            )
        """)
        
        # City improvements table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS city_improvements (
                improvement_id TEXT PRIMARY KEY,
                city_id TEXT NOT NULL,
                improvement_type TEXT NOT NULL,
                level INTEGER DEFAULT 0,
                FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE
            )
        """)
        
        # Nation wonders table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS nation_wonders (
                wonder_id TEXT PRIMARY KEY,
                nation_id TEXT NOT NULL,
                wonder_type TEXT NOT NULL,
                built_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)
        
        # Nation projects table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS nation_projects (
                project_id TEXT PRIMARY KEY,
                nation_id TEXT NOT NULL,
                project_type TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)
        
        # Wars table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS wars (
                war_id TEXT PRIMARY KEY,
                attacker_id TEXT NOT NULL,
                defender_id TEXT NOT NULL,
                status TEXT NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                FOREIGN KEY (attacker_id) REFERENCES nations(nation_id),
                FOREIGN KEY (defender_id) REFERENCES nations(nation_id)
            )
        """)
        
        # Trade circles table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS trade_circles (
                circle_id TEXT PRIMARY KEY,
                circle_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Circle members table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS circle_members (
                member_id TEXT PRIMARY KEY,
                circle_id TEXT NOT NULL,
                nation_id TEXT NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (circle_id) REFERENCES trade_circles(circle_id) ON DELETE CASCADE,
                FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)
        
        # Events table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS events (
                event_id TEXT PRIMARY KEY,
                nation_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)
        
        # Diplomatic relations table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS diplomatic_relations (
                relation_id TEXT PRIMARY KEY,
                nation_a_id TEXT NOT NULL,
                nation_b_id TEXT NOT NULL,
                relation_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (nation_a_id) REFERENCES nations(nation_id),
                FOREIGN KEY (nation_b_id) REFERENCES nations(nation_id)
            )
        """)
        
        # Spy operations table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS spy_operations (
                operation_id TEXT PRIMARY KEY,
                spy_nation_id TEXT NOT NULL,
                target_nation_id TEXT NOT NULL,
                operation_type TEXT NOT NULL,
                result TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (spy_nation_id) REFERENCES nations(nation_id),
                FOREIGN KEY (target_nation_id) REFERENCES nations(nation_id)
            )
        """)
        
        # Plugin data table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS plugin_data (
                plugin_name TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (plugin_name, key)
            )
        """)
        
        # Tick state table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS tick_state (
                tick_id INTEGER PRIMARY KEY AUTOINCREMENT,
                tick_number INTEGER NOT NULL,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL
            )
        """)
        
        # Create indexes for better performance
        await self.execute("CREATE INDEX IF NOT EXISTS idx_cities_nation_id ON cities(nation_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_military_nation_id ON military(nation_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_alliance_members_alliance_id ON alliance_members(alliance_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_alliance_members_nation_id ON alliance_members(nation_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_wars_attacker_id ON wars(attacker_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_wars_defender_id ON wars(defender_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON circle_members(circle_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_circle_members_nation_id ON circle_members(nation_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_events_nation_id ON events(nation_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_diplomatic_relations_nation_a ON diplomatic_relations(nation_a_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_diplomatic_relations_nation_b ON diplomatic_relations(nation_b_id)")
        

        # Market listings table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS market_listings (
                listing_id TEXT PRIMARY KEY,
                seller_id TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                amount REAL NOT NULL,
                price_per_unit REAL NOT NULL,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (seller_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)

        # Notifications table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id TEXT PRIMARY KEY,
                nation_id TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT,
                type TEXT DEFAULT 'system',
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
            )
        """)

        # Alliance transactions table (for bank deposits/withdrawals)
        await self.execute("""
            CREATE TABLE IF NOT EXISTS alliance_transactions (
                tx_id TEXT PRIMARY KEY,
                alliance_id TEXT NOT NULL,
                nation_id TEXT NOT NULL,
                tx_type TEXT NOT NULL,
                amount REAL NOT NULL,
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (alliance_id) REFERENCES alliances(alliance_id) ON DELETE CASCADE
            )
        """)

        # War details table
        await self.execute("""
            CREATE TABLE IF NOT EXISTS war_details (
                detail_id TEXT PRIMARY KEY,
                war_id TEXT NOT NULL,
                nation_id TEXT NOT NULL,
                war_score REAL DEFAULT 50.0,
                attacks_used_this_tick INTEGER DEFAULT 0,
                infrastructure_destroyed REAL DEFAULT 0,
                soldiers_killed INTEGER DEFAULT 0,
                tanks_destroyed INTEGER DEFAULT 0,
                aircraft_destroyed INTEGER DEFAULT 0,
                ships_destroyed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (war_id) REFERENCES wars(war_id) ON DELETE CASCADE
            )
        """)

        # Add treasury column to alliances if not present
        try:
            await self.execute("ALTER TABLE alliances ADD COLUMN treasury REAL DEFAULT 0.0")
        except Exception:
            pass  # Column already exists

        # Ensure nations table has all required columns (legacy schema migration)
        _nation_columns = [
            ("war_policy_type", "TEXT DEFAULT 'NEUTRAL'"),
            ("domestic_policy_type", "TEXT DEFAULT 'BALANCED'"),
            ("resource_1", "TEXT DEFAULT 'GRAIN'"),
            ("resource_2", "TEXT"),
            ("cash", "REAL DEFAULT 10000000.0"),
            ("technology", "INTEGER DEFAULT 0"),
            ("total_infrastructure", "REAL DEFAULT 0"),
            ("total_land", "REAL DEFAULT 0"),
            ("total_population", "REAL DEFAULT 0"),
            ("happiness", "REAL DEFAULT 10"),
            ("environment", "REAL DEFAULT 3"),
            ("tax_rate", "REAL DEFAULT 0.30"),
            ("citizen_income", "REAL DEFAULT 5.0"),
            ("trade_posts_built", "INTEGER DEFAULT 0"),
            ("trade_slots_available", "INTEGER DEFAULT 0"),
            ("alliance_id", "TEXT"),
            ("alliance_role", "TEXT"),
            ("is_beige", "BOOLEAN DEFAULT FALSE"),
            ("beige_ticks_remaining", "INTEGER DEFAULT 0"),
            ("current_tier", "TEXT DEFAULT 'MICRO'"),
            ("tier_progress", "REAL DEFAULT 0.0"),
            ("anarchy_ticks_remaining", "INTEGER DEFAULT 0"),
            ("government_change_cooldown", "INTEGER DEFAULT 0"),
            ("policy_change_cooldown", "INTEGER DEFAULT 0"),
            ("religion_change_cooldown", "INTEGER DEFAULT 0"),
            ("war_cooldown", "INTEGER DEFAULT 0"),
            ("city_ids", "TEXT DEFAULT '[]'"),
        ]
        for col_name, col_def in _nation_columns:
            try:
                await self.execute(f"ALTER TABLE nations ADD COLUMN {col_name} {col_def}")
            except Exception:
                pass

        # Add resource_type and creator_id to trade_circles if not present
        try:
            await self.execute("ALTER TABLE trade_circles ADD COLUMN resource_type TEXT")
        except Exception:
            pass
        try:
            await self.execute("ALTER TABLE trade_circles ADD COLUMN creator_id TEXT")
        except Exception:
            pass

        # Add war_score and reason to wars if not present
        try:
            await self.execute("ALTER TABLE wars ADD COLUMN war_score REAL DEFAULT 50.0")
        except Exception:
            pass
        try:
            await self.execute("ALTER TABLE wars ADD COLUMN reason TEXT")
        except Exception:
            pass

        # Add indexes for new tables
        await self.execute("CREATE INDEX IF NOT EXISTS idx_market_listings_status ON market_listings(status)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_notifications_nation ON notifications(nation_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_alliance_tx_alliance ON alliance_transactions(alliance_id)")
        await self.execute("CREATE INDEX IF NOT EXISTS idx_war_details_war ON war_details(war_id)")

        logger.info("Empire database schema created")
    
    # Nation operations
    async def create_nation(self, nation_id: str, nation_name: str, ruler_name: str, 
                           capital_city_name: str, national_color: str, 
                           government_type: str, religion_type: Optional[str] = None,
                           war_policy_type: str = 'NEUTRAL', domestic_policy_type: str = 'BALANCED',
                           resource_1: str = 'GRAIN', resource_2: Optional[str] = None) -> int:
        """Create a new nation with all required fields."""
        data = {
            'nation_id': nation_id,
            'nation_name': nation_name,
            'ruler_name': ruler_name,
            'capital_city_name': capital_city_name,
            'national_color': national_color,
            'government_type': government_type,
            'religion_type': religion_type,
            'war_policy_type': war_policy_type,
            'domestic_policy_type': domestic_policy_type,
            'resource_1': resource_1,
        }
        if resource_2:
            data['resource_2'] = resource_2
        return await self.insert('nations', data)
    
    async def get_nation(self, nation_id: str) -> Optional[Dict[str, Any]]:
        """Get a nation by ID."""
        return await self.fetchdict("SELECT * FROM nations WHERE nation_id = ?", (nation_id,))
    
    async def update_nation(self, nation_id: str, data: Dict[str, Any]) -> int:
        """Update a nation."""
        return await self.update('nations', data, "nation_id = ?", (nation_id,))
    
    async def delete_nation(self, nation_id: str) -> int:
        """Delete a nation."""
        return await self.delete('nations', "nation_id = ?", (nation_id,))
    
    async def get_all_nations(self) -> List[Dict[str, Any]]:
        """Get all nations."""
        return await self.fetchalldict("SELECT * FROM nations")
    
    # City operations
    async def create_city(self, city_id: str, nation_id: str, city_name: str) -> int:
        """Create a new city."""
        data = {
            'city_id': city_id,
            'nation_id': nation_id,
            'city_name': city_name,
        }
        return await self.insert('cities', data)
    
    async def get_city(self, city_id: str) -> Optional[Dict[str, Any]]:
        """Get a city by ID."""
        return await self.fetchdict("SELECT * FROM cities WHERE city_id = ?", (city_id,))
    
    async def get_nation_cities(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all cities for a nation."""
        return await self.fetchalldict("SELECT * FROM cities WHERE nation_id = ?", (nation_id,))
    
    async def update_city(self, city_id: str, data: Dict[str, Any]) -> int:
        """Update a city."""
        return await self.update('cities', data, "city_id = ?", (city_id,))
    
    async def delete_city(self, city_id: str) -> int:
        """Delete a city."""
        return await self.delete('cities', "city_id = ?", (city_id,))
    
    # Military operations
    async def create_military(self, military_id: str, nation_id: str, 
                            soldiers: int = 0, tanks: int = 0, fighters: int = 0, bombers: int = 0,
                            destroyers: int = 0, cruisers: int = 0, battleships: int = 0,
                            carriers: int = 0, submarines: int = 0, cruise_missiles: int = 0,
                            nuclear_weapons: int = 0, spies: int = 0) -> int:
        """Create a new military record with all unit types."""
        data = {
            'military_id': military_id,
            'nation_id': nation_id,
            'soldiers': soldiers,
            'tanks': tanks,
            'fighters': fighters,
            'bombers': bombers,
            'aircraft': fighters + bombers,  # Total aircraft for backward compatibility
            'destroyers': destroyers,
            'cruisers': cruisers,
            'battleships': battleships,
            'carriers': carriers,
            'submarines': submarines,
            'ships': destroyers + cruisers + battleships + carriers + submarines,  # Total ships for backward compatibility
            'cruise_missiles': cruise_missiles,
            'nuclear_weapons': nuclear_weapons,
            'spies': spies,
        }
        return await self.insert('military', data)
    
    async def get_military(self, military_id: str) -> Optional[Dict[str, Any]]:
        """Get a military record by ID."""
        return await self.fetchdict("SELECT * FROM military WHERE military_id = ?", (military_id,))
    
    async def get_nation_military(self, nation_id: str) -> Optional[Dict[str, Any]]:
        """Get the military for a nation."""
        return await self.fetchdict("SELECT * FROM military WHERE nation_id = ?", (nation_id,))
    
    async def update_military(self, military_id: str, data: Dict[str, Any]) -> int:
        """Update a military record with support for granular unit types."""
        # If granular types are provided, update the total fields for backward compatibility
        if 'fighters' in data or 'bombers' in data:
            fighters = data.get('fighters', 0)
            bombers = data.get('bombers', 0)
            data['aircraft'] = fighters + bombers
        if 'destroyers' in data or 'cruisers' in data or 'battleships' in data or 'carriers' in data or 'submarines' in data:
            destroyers = data.get('destroyers', 0)
            cruisers = data.get('cruisers', 0)
            battleships = data.get('battleships', 0)
            carriers = data.get('carriers', 0)
            submarines = data.get('submarines', 0)
            data['ships'] = destroyers + cruisers + battleships + carriers + submarines
        return await self.update('military', data, "military_id = ?", (military_id,))
    
    # Alliance operations
    async def create_alliance(self, alliance_id: str, alliance_name: str, leader_nation_id: str) -> int:
        """Create a new alliance."""
        data = {
            'alliance_id': alliance_id,
            'alliance_name': alliance_name,
            'leader_nation_id': leader_nation_id,
        }
        return await self.insert('alliances', data)
    
    async def get_alliance(self, alliance_id: str) -> Optional[Dict[str, Any]]:
        """Get an alliance by ID."""
        return await self.fetchdict("SELECT * FROM alliances WHERE alliance_id = ?", (alliance_id,))
    
    async def get_all_alliances(self) -> List[Dict[str, Any]]:
        """Get all alliances."""
        return await self.fetchalldict("SELECT * FROM alliances")
    
    async def update_alliance(self, alliance_id: str, data: Dict[str, Any]) -> int:
        """Update an alliance."""
        return await self.update('alliances', data, "alliance_id = ?", (alliance_id,))
    
    async def delete_alliance(self, alliance_id: str) -> int:
        """Delete an alliance."""
        return await self.delete('alliances', "alliance_id = ?", (alliance_id,))
    
    # War operations
    async def create_war(self, war_id: str, attacker_id: str, defender_id: str, status: str = 'active') -> int:
        """Create a new war."""
        data = {
            'war_id': war_id,
            'attacker_id': attacker_id,
            'defender_id': defender_id,
            'status': status,
        }
        return await self.insert('wars', data)
    
    async def get_war(self, war_id: str) -> Optional[Dict[str, Any]]:
        """Get a war by ID."""
        return await self.fetchdict("SELECT * FROM wars WHERE war_id = ?", (war_id,))
    
    async def get_nation_wars(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all wars for a nation (as attacker or defender)."""
        return await self.fetchalldict(
            "SELECT * FROM wars WHERE attacker_id = ? OR defender_id = ?",
            (nation_id, nation_id)
        )
    
    async def update_war(self, war_id: str, data: Dict[str, Any]) -> int:
        """Update a war."""
        return await self.update('wars', data, "war_id = ?", (war_id,))
    
    # Event operations
    async def create_event(self, event_id: str, nation_id: str, event_type: str, event_data: Optional[str] = None) -> int:
        """Create a new event."""
        data = {
            'event_id': event_id,
            'nation_id': nation_id,
            'event_type': event_type,
            'event_data': event_data,
        }
        return await self.insert('events', data)
    
    # Resource operations
    async def create_nation_resource(self, resource_id: str, nation_id: str, resource_type: str, amount: float = 0.0, production_rate: float = 0.0) -> int:
        """Create a nation resource record."""
        data = {
            'resource_id': resource_id,
            'nation_id': nation_id,
            'resource_type': resource_type,
            'amount': amount,
            'production_rate': production_rate,
        }
        return await self.insert('nation_resources', data)
    
    async def get_nation_resources(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all resources for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_resources WHERE nation_id = ?", (nation_id,))
    
    async def update_nation_resource(self, resource_id: str, data: Dict[str, Any]) -> int:
        """Update a nation resource."""
        return await self.update('nation_resources', data, "resource_id = ?", (resource_id,))
    
    async def create_city_resource(self, resource_id: str, city_id: str, resource_type: str, amount: float = 0.0) -> int:
        """Create a city resource record."""
        data = {
            'resource_id': resource_id,
            'city_id': city_id,
            'resource_type': resource_type,
            'amount': amount,
        }
        return await self.insert('city_resources', data)
    
    async def get_city_resources(self, city_id: str) -> List[Dict[str, Any]]:
        """Get all resources for a city."""
        return await self.fetchalldict("SELECT * FROM city_resources WHERE city_id = ?", (city_id,))
    
    # Improvement operations
    async def create_city_improvement(self, improvement_id: str, city_id: str, improvement_type: str, level: int = 0) -> int:
        """Create a city improvement record."""
        data = {
            'improvement_id': improvement_id,
            'city_id': city_id,
            'improvement_type': improvement_type,
            'level': level,
        }
        return await self.insert('city_improvements', data)
    
    async def get_city_improvements(self, city_id: str) -> List[Dict[str, Any]]:
        """Get all improvements for a city."""
        return await self.fetchalldict("SELECT * FROM city_improvements WHERE city_id = ?", (city_id,))
    
    async def update_city_improvement(self, improvement_id: str, data: Dict[str, Any]) -> int:
        """Update a city improvement."""
        return await self.update('city_improvements', data, "improvement_id = ?", (improvement_id,))
    
    async def delete_city_improvement(self, improvement_id: str) -> int:
        """Delete a city improvement."""
        return await self.delete('city_improvements', "improvement_id = ?", (improvement_id,))
    
    # Wonder operations
    async def create_nation_wonder(self, wonder_id: str, nation_id: str, wonder_type: str) -> int:
        """Create a nation wonder record."""
        data = {
            'wonder_id': wonder_id,
            'nation_id': nation_id,
            'wonder_type': wonder_type,
        }
        return await self.insert('nation_wonders', data)
    
    async def get_nation_wonders(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all wonders for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_wonders WHERE nation_id = ?", (nation_id,))
    
    async def delete_nation_wonder(self, wonder_id: str) -> int:
        """Delete a nation wonder."""
        return await self.delete('nation_wonders', "wonder_id = ?", (wonder_id,))
    
    # Project operations
    async def create_nation_project(self, project_id: str, nation_id: str, project_type: str) -> int:
        """Create a nation project record."""
        data = {
            'project_id': project_id,
            'nation_id': nation_id,
            'project_type': project_type,
        }
        return await self.insert('nation_projects', data)
    
    async def get_nation_projects(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all projects for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_projects WHERE nation_id = ?", (nation_id,))
    
    async def complete_project(self, project_id: str) -> int:
        """Mark a project as completed."""
        return await self.update('nation_projects', {'completed': True, 'completed_at': 'CURRENT_TIMESTAMP'}, "project_id = ?", (project_id,))
    
    async def delete_nation_project(self, project_id: str) -> int:
        """Delete a nation project."""
        return await self.delete('nation_projects', "project_id = ?", (project_id,))
    
    # Alliance monument operations
    async def create_alliance_monument(self, monument_id: str, alliance_id: str, monument_type: str, level: int = 0) -> int:
        """Create an alliance monument record."""
        data = {
            'monument_id': monument_id,
            'alliance_id': alliance_id,
            'monument_type': monument_type,
            'level': level,
        }
        return await self.insert('alliance_monuments', data)
    
    async def get_alliance_monuments(self, alliance_id: str) -> List[Dict[str, Any]]:
        """Get all monuments for an alliance."""
        return await self.fetchalldict("SELECT * FROM alliance_monuments WHERE alliance_id = ?", (alliance_id,))
    
    async def update_alliance_monument(self, monument_id: str, data: Dict[str, Any]) -> int:
        """Update an alliance monument."""
        return await self.update('alliance_monuments', data, "monument_id = ?", (monument_id,))
    
    # Treaty operations
    async def create_treaty(self, treaty_id: str, party_a_id: str, party_b_id: str, treaty_type: str, status: str = 'proposed', terms: str = None) -> int:
        """Create a treaty record."""
        data = {
            'treaty_id': treaty_id,
            'party_a_id': party_a_id,
            'party_b_id': party_b_id,
            'treaty_type': treaty_type,
            'status': status,
            'terms': terms,
        }
        return await self.insert('treaties', data)
    
    async def get_treaties(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all treaties for a nation (as party A or party B)."""
        return await self.fetchalldict(
            "SELECT * FROM treaties WHERE party_a_id = ? OR party_b_id = ?",
            (nation_id, nation_id)
        )
    
    async def update_treaty(self, treaty_id: str, data: Dict[str, Any]) -> int:
        """Update a treaty."""
        return await self.update('treaties', data, "treaty_id = ?", (treaty_id,))
    
    async def delete_treaty(self, treaty_id: str) -> int:
        """Delete a treaty."""
        return await self.delete('treaties', "treaty_id = ?", (treaty_id,))
    
    # Sanction operations
    async def create_sanction(self, sanction_id: str, target_nation_id: str, sanction_type: str, imposing_alliance_id: str = None, imposing_nation_id: str = None) -> int:
        """Create a sanction record."""
        data = {
            'sanction_id': sanction_id,
            'target_nation_id': target_nation_id,
            'sanction_type': sanction_type,
            'imposing_alliance_id': imposing_alliance_id,
            'imposing_nation_id': imposing_nation_id,
        }
        return await self.insert('sanctions', data)
    

    # War detail operations
    async def create_war_detail(self, detail_id: str, war_id: str, nation_id: str, war_score: float = 50.0) -> int:
        """Create a war detail record."""
        data = {
            'detail_id': detail_id,
            'war_id': war_id,
            'nation_id': nation_id,
            'war_score': war_score,
        }
        return await self.insert('war_details', data)

    async def get_nation_war_detail(self, war_id: str, nation_id: str):
        """Get war detail for a specific nation in a war."""
        return await self.fetchdict(
            "SELECT * FROM war_details WHERE war_id=? AND nation_id=?",
            (war_id, nation_id)
        )

    async def update_war_detail(self, detail_id: str, data: dict) -> int:
        """Update a war detail record."""
        return await self.update('war_details', data, "detail_id = ?", (detail_id,))

    async def delete_war_details(self, war_id: str) -> int:
        """Delete all war details for a war."""
        return await self.delete('war_details', "war_id = ?", (war_id,))

    async def get_all_wars(self):
        """Get all wars."""
        return await self.fetchalldict(
            """SELECT w.*,
               na.nation_name as attacker_name,
               nb.nation_name as defender_name
               FROM wars w
               LEFT JOIN nations na ON na.nation_id = w.attacker_id
               LEFT JOIN nations nb ON nb.nation_id = w.defender_id
               ORDER BY w.started_at DESC"""
        )

    async def update_nation_score(self, nation_id: str, score: float) -> int:
        """Update a nation's score."""
        return await self.update('nations', {'score': score}, "nation_id = ?", (nation_id,))

    async def get_sanctions(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all sanctions for a nation (as target)."""
        return await self.fetchalldict("SELECT * FROM sanctions WHERE target_nation_id = ?", (nation_id,))
    
    async def lift_sanction(self, sanction_id: str) -> int:
        """Lift a sanction (delete it)."""
        return await self.delete('sanctions', "sanction_id = ?", (sanction_id,))
    
    # Cooldown operations
    async def create_cooldown(self, cooldown_id: str, nation_id: str, cooldown_type: str, ticks_remaining: int) -> int:
        """Create a cooldown record."""
        data = {
            'cooldown_id': cooldown_id,
            'nation_id': nation_id,
            'cooldown_type': cooldown_type,
            'ticks_remaining': ticks_remaining,
        }
        return await self.insert('nation_cooldowns', data)
    
    async def get_cooldowns(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all cooldowns for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_cooldowns WHERE nation_id = ?", (nation_id,))
    
    async def update_cooldown(self, cooldown_id: str, data: Dict[str, Any]) -> int:
        """Update a cooldown."""
        return await self.update('nation_cooldowns', data, "cooldown_id = ?", (cooldown_id,))
    
    async def delete_cooldown(self, cooldown_id: str) -> int:
        """Delete a cooldown."""
        return await self.delete('nation_cooldowns', "cooldown_id = ?", (cooldown_id,))
    
    async def get_nation_events(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all events for a nation."""
        return await self.fetchalldict("SELECT * FROM events WHERE nation_id = ? ORDER BY created_at DESC", (nation_id,))
    
    # Tick state operations
    async def create_tick(self, tick_number: int, status: str = 'pending') -> int:
        """Create a new tick record."""
        data = {
            'tick_number': tick_number,
            'status': status,
        }
        return await self.insert('tick_state', data)
    
    async def get_latest_tick(self) -> Optional[Dict[str, Any]]:
        """Get the latest tick record."""
        return await self.fetchdict("SELECT * FROM tick_state ORDER BY tick_id DESC LIMIT 1")
    
    async def update_tick(self, tick_id: int, data: Dict[str, Any]) -> int:
        """Update a tick record."""
        return await self.update('tick_state', data, "tick_id = ?", (tick_id,))
    
    # Nation Resources CRUD operations
    async def create_nation_resource(self, resource_id: str, nation_id: str, resource_type: str, 
                                    amount: float = 0.0, production_rate: float = 0.0) -> int:
        """Create a nation resource record."""
        data = {
            'resource_id': resource_id,
            'nation_id': nation_id,
            'resource_type': resource_type,
            'amount': amount,
            'production_rate': production_rate,
        }
        return await self.insert('nation_resources', data)
    
    async def get_nation_resource(self, resource_id: str) -> Optional[Dict[str, Any]]:
        """Get a nation resource by ID."""
        return await self.fetchdict("SELECT * FROM nation_resources WHERE resource_id = ?", (resource_id,))
    
    async def get_nation_resources(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all resources for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_resources WHERE nation_id = ?", (nation_id,))
    
    async def get_nation_resource_by_type(self, nation_id: str, resource_type: str) -> Optional[Dict[str, Any]]:
        """Get a specific resource type for a nation."""
        return await self.fetchdict(
            "SELECT * FROM nation_resources WHERE nation_id = ? AND resource_type = ?",
            (nation_id, resource_type)
        )
    
    async def update_nation_resource(self, resource_id: str, data: Dict[str, Any]) -> int:
        """Update a nation resource."""
        return await self.update('nation_resources', data, "resource_id = ?", (resource_id,))
    
    async def delete_nation_resource(self, resource_id: str) -> int:
        """Delete a nation resource."""
        return await self.delete('nation_resources', "resource_id = ?", (resource_id,))
    
    # Nation Improvements CRUD operations
    async def create_nation_improvement(self, improvement_id: str, nation_id: str, improvement_type: str,
                                       level: int = 0, city_id: Optional[str] = None) -> int:
        """Create a nation improvement record."""
        data = {
            'improvement_id': improvement_id,
            'nation_id': nation_id,
            'improvement_type': improvement_type,
            'level': level,
            'city_id': city_id,
        }
        return await self.insert('nation_improvements', data)
    
    async def get_nation_improvement(self, improvement_id: str) -> Optional[Dict[str, Any]]:
        """Get a nation improvement by ID."""
        return await self.fetchdict("SELECT * FROM nation_improvements WHERE improvement_id = ?", (improvement_id,))
    
    async def get_nation_improvements(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all improvements for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_improvements WHERE nation_id = ?", (nation_id,))
    
    async def get_city_improvements(self, city_id: str) -> List[Dict[str, Any]]:
        """Get all improvements for a city."""
        return await self.fetchalldict("SELECT * FROM nation_improvements WHERE city_id = ?", (city_id,))
    
    async def get_nation_improvement_by_type(self, nation_id: str, improvement_type: str) -> Optional[Dict[str, Any]]:
        """Get a specific improvement type for a nation."""
        return await self.fetchdict(
            "SELECT * FROM nation_improvements WHERE nation_id = ? AND improvement_type = ?",
            (nation_id, improvement_type)
        )
    
    async def update_nation_improvement(self, improvement_id: str, data: Dict[str, Any]) -> int:
        """Update a nation improvement."""
        return await self.update('nation_improvements', data, "improvement_id = ?", (improvement_id,))
    
    async def delete_nation_improvement(self, improvement_id: str) -> int:
        """Delete a nation improvement."""
        return await self.delete('nation_improvements', "improvement_id = ?", (improvement_id,))
    
    # Nation Wonders CRUD operations
    async def create_nation_wonder(self, wonder_id: str, nation_id: str, wonder_type: str,
                                   city_id: Optional[str] = None) -> int:
        """Create a nation wonder record."""
        data = {
            'wonder_id': wonder_id,
            'nation_id': nation_id,
            'wonder_type': wonder_type,
            'city_id': city_id,
        }
        return await self.insert('nation_wonders', data)
    
    async def get_nation_wonder(self, wonder_id: str) -> Optional[Dict[str, Any]]:
        """Get a nation wonder by ID."""
        return await self.fetchdict("SELECT * FROM nation_wonders WHERE wonder_id = ?", (wonder_id,))
    
    async def get_nation_wonders(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all wonders for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_wonders WHERE nation_id = ?", (nation_id,))
    
    async def get_city_wonders(self, city_id: str) -> List[Dict[str, Any]]:
        """Get all wonders for a city."""
        return await self.fetchalldict("SELECT * FROM nation_wonders WHERE city_id = ?", (city_id,))
    
    async def get_nation_wonder_by_type(self, nation_id: str, wonder_type: str) -> Optional[Dict[str, Any]]:
        """Get a specific wonder type for a nation."""
        return await self.fetchdict(
            "SELECT * FROM nation_wonders WHERE nation_id = ? AND wonder_type = ?",
            (nation_id, wonder_type)
        )
    
    async def delete_nation_wonder(self, wonder_id: str) -> int:
        """Delete a nation wonder."""
        return await self.delete('nation_wonders', "wonder_id = ?", (wonder_id,))
    
    # Nation Projects CRUD operations
    async def create_nation_project(self, project_id: str, nation_id: str, project_type: str) -> int:
        """Create a nation project record."""
        data = {
            'project_id': project_id,
            'nation_id': nation_id,
            'project_type': project_type,
        }
        return await self.insert('nation_projects', data)
    
    async def get_nation_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get a nation project by ID."""
        return await self.fetchdict("SELECT * FROM nation_projects WHERE project_id = ?", (project_id,))
    
    async def get_nation_projects(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all projects for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_projects WHERE nation_id = ?", (nation_id,))
    
    async def get_nation_completed_projects(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all completed projects for a nation."""
        return await self.fetchalldict(
            "SELECT * FROM nation_projects WHERE nation_id = ? AND completed = TRUE",
            (nation_id,)
        )
    
    async def complete_nation_project(self, project_id: str) -> int:
        """Mark a nation project as completed."""
        return await self.update('nation_projects', {'completed': True}, "project_id = ?", (project_id,))
    
    async def delete_nation_project(self, project_id: str) -> int:
        """Delete a nation project."""
        return await self.delete('nation_projects', "project_id = ?", (project_id,))
    
    # Nation Bonuses CRUD operations
    async def create_nation_bonus(self, bonus_id: str, nation_id: str, bonus_type: str,
                                  expires_at: Optional[str] = None) -> int:
        """Create a nation bonus record."""
        data = {
            'bonus_id': bonus_id,
            'nation_id': nation_id,
            'bonus_type': bonus_type,
            'expires_at': expires_at,
        }
        return await self.insert('nation_bonuses', data)
    
    async def get_nation_bonus(self, bonus_id: str) -> Optional[Dict[str, Any]]:
        """Get a nation bonus by ID."""
        return await self.fetchdict("SELECT * FROM nation_bonuses WHERE bonus_id = ?", (bonus_id,))
    
    async def get_nation_bonuses(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all bonuses for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_bonuses WHERE nation_id = ?", (nation_id,))
    
    async def get_active_nation_bonuses(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all active bonuses for a nation (not expired)."""
        return await self.fetchalldict(
            "SELECT * FROM nation_bonuses WHERE nation_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))",
            (nation_id,)
        )
    
    async def delete_nation_bonus(self, bonus_id: str) -> int:
        """Delete a nation bonus."""
        return await self.delete('nation_bonuses', "bonus_id = ?", (bonus_id,))
    
    # Treaties CRUD operations
    async def create_treaty(self, treaty_id: str, party_a_id: str, party_b_id: str, treaty_type: str,
                           status: str = 'PROPOSED', terms: Optional[str] = None,
                           expires_at: Optional[str] = None) -> int:
        """Create a treaty record."""
        data = {
            'treaty_id': treaty_id,
            'party_a_id': party_a_id,
            'party_b_id': party_b_id,
            'treaty_type': treaty_type,
            'status': status,
            'terms': terms,
            'expires_at': expires_at,
        }
        return await self.insert('treaties', data)
    
    async def get_treaty(self, treaty_id: str) -> Optional[Dict[str, Any]]:
        """Get a treaty by ID."""
        return await self.fetchdict("SELECT * FROM treaties WHERE treaty_id = ?", (treaty_id,))
    
    async def get_nation_treaties(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all treaties for a nation (as party A or party B)."""
        return await self.fetchalldict(
            "SELECT * FROM treaties WHERE party_a_id = ? OR party_b_id = ?",
            (nation_id, nation_id)
        )
    
    async def update_treaty(self, treaty_id: str, data: Dict[str, Any]) -> int:
        """Update a treaty."""
        return await self.update('treaties', data, "treaty_id = ?", (treaty_id,))
    
    async def delete_treaty(self, treaty_id: str) -> int:
        """Delete a treaty."""
        return await self.delete('treaties', "treaty_id = ?", (treaty_id,))
    
    # Sanctions CRUD operations
    async def create_sanction(self, sanction_id: str, target_nation_id: str, sanction_type: str,
                             imposing_alliance_id: Optional[str] = None, imposing_nation_id: Optional[str] = None,
                             income_penalty: float = -0.10, spy_success_bonus: float = 0.20,
                             military_penalty: float = -0.05, diplomatic_penalty: float = -0.10,
                             technology_penalty: float = -0.05, expires_at: Optional[str] = None) -> int:
        """Create a sanction record."""
        data = {
            'sanction_id': sanction_id,
            'target_nation_id': target_nation_id,
            'sanction_type': sanction_type,
            'imposing_alliance_id': imposing_alliance_id,
            'imposing_nation_id': imposing_nation_id,
            'income_penalty': income_penalty,
            'spy_success_bonus': spy_success_bonus,
            'military_penalty': military_penalty,
            'diplomatic_penalty': diplomatic_penalty,
            'technology_penalty': technology_penalty,
            'expires_at': expires_at,
        }
        return await self.insert('sanctions', data)
    
    async def get_sanction(self, sanction_id: str) -> Optional[Dict[str, Any]]:
        """Get a sanction by ID."""
        return await self.fetchdict("SELECT * FROM sanctions WHERE sanction_id = ?", (sanction_id,))
    
    async def get_nation_sanctions(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all sanctions on a nation."""
        return await self.fetchalldict("SELECT * FROM sanctions WHERE target_nation_id = ?", (nation_id,))
    
    async def get_active_nation_sanctions(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all active sanctions on a nation (not expired)."""
        return await self.fetchalldict(
            "SELECT * FROM sanctions WHERE target_nation_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))",
            (nation_id,)
        )
    
    async def update_sanction(self, sanction_id: str, data: Dict[str, Any]) -> int:
        """Update a sanction."""
        return await self.update('sanctions', data, "sanction_id = ?", (sanction_id,))
    
    async def delete_sanction(self, sanction_id: str) -> int:
        """Delete a sanction."""
        return await self.delete('sanctions', "sanction_id = ?", (sanction_id,))
    
    # Nation Cooldowns CRUD operations
    async def create_nation_cooldown(self, cooldown_id: str, nation_id: str, cooldown_type: str,
                                     ticks_remaining: int = 0) -> int:
        """Create a nation cooldown record."""
        data = {
            'cooldown_id': cooldown_id,
            'nation_id': nation_id,
            'cooldown_type': cooldown_type,
            'ticks_remaining': ticks_remaining,
        }
        return await self.insert('nation_cooldowns', data)
    
    async def get_nation_cooldown(self, cooldown_id: str) -> Optional[Dict[str, Any]]:
        """Get a nation cooldown by ID."""
        return await self.fetchdict("SELECT * FROM nation_cooldowns WHERE cooldown_id = ?", (cooldown_id,))
    
    async def get_nation_cooldowns(self, nation_id: str) -> List[Dict[str, Any]]:
        """Get all cooldowns for a nation."""
        return await self.fetchalldict("SELECT * FROM nation_cooldowns WHERE nation_id = ?", (nation_id,))
    
    async def get_nation_cooldown_by_type(self, nation_id: str, cooldown_type: str) -> Optional[Dict[str, Any]]:
        """Get a specific cooldown type for a nation."""
        return await self.fetchdict(
            "SELECT * FROM nation_cooldowns WHERE nation_id = ? AND cooldown_type = ?",
            (nation_id, cooldown_type)
        )
    
    async def update_nation_cooldown(self, cooldown_id: str, data: Dict[str, Any]) -> int:
        """Update a nation cooldown."""
        return await self.update('nation_cooldowns', data, "cooldown_id = ?", (cooldown_id,))
    
    async def delete_nation_cooldown(self, cooldown_id: str) -> int:
        """Delete a nation cooldown."""
        return await self.delete('nation_cooldowns', "cooldown_id = ?", (cooldown_id,))
    
    # War Details CRUD operations
    async def create_war_detail(self, detail_id: str, war_id: str, nation_id: str,
                              war_score: float = 50.0, attacks_used_this_tick: int = 0) -> int:
        """Create a war detail record."""
        data = {
            'detail_id': detail_id,
            'war_id': war_id,
            'nation_id': nation_id,
            'war_score': war_score,
            'attacks_used_this_tick': attacks_used_this_tick,
        }
        return await self.insert('war_details', data)
    
    async def get_war_detail(self, detail_id: str) -> Optional[Dict[str, Any]]:
        """Get a war detail by ID."""
        return await self.fetchdict("SELECT * FROM war_details WHERE detail_id = ?", (detail_id,))
    
    async def get_war_details(self, war_id: str) -> List[Dict[str, Any]]:
        """Get all details for a war."""
        return await self.fetchalldict("SELECT * FROM war_details WHERE war_id = ?", (war_id,))
    
    async def get_nation_war_detail(self, war_id: str, nation_id: str) -> Optional[Dict[str, Any]]:
        """Get war detail for a specific nation in a war."""
        return await self.fetchdict(
            "SELECT * FROM war_details WHERE war_id = ? AND nation_id = ?",
            (war_id, nation_id)
        )
    
    async def update_war_detail(self, detail_id: str, data: Dict[str, Any]) -> int:
        """Update a war detail."""
        return await self.update('war_details', data, "detail_id = ?", (detail_id,))
    
    async def delete_war_detail(self, detail_id: str) -> int:
        """Delete a war detail."""
        return await self.delete('war_details', "detail_id = ?", (detail_id,))
    
    async def delete_war_details(self, war_id: str) -> int:
        """Delete all details for a war."""
        return await self.delete('war_details', "war_id = ?", (war_id,))
    
    # Alliance Monuments CRUD operations
    async def create_alliance_monument(self, monument_id: str, alliance_id: str, monument_type: str,
                                     level: int = 0) -> int:
        """Create an alliance monument record."""
        data = {
            'monument_id': monument_id,
            'alliance_id': alliance_id,
            'monument_type': monument_type,
            'level': level,
        }
        return await self.insert('alliance_monuments', data)
    
    async def get_alliance_monument(self, monument_id: str) -> Optional[Dict[str, Any]]:
        """Get an alliance monument by ID."""
        return await self.fetchdict("SELECT * FROM alliance_monuments WHERE monument_id = ?", (monument_id,))
    
    async def get_alliance_monuments(self, alliance_id: str) -> List[Dict[str, Any]]:
        """Get all monuments for an alliance."""
        return await self.fetchalldict("SELECT * FROM alliance_monuments WHERE alliance_id = ?", (alliance_id,))
    
    async def update_alliance_monument(self, monument_id: str, data: Dict[str, Any]) -> int:
        """Update an alliance monument."""
        return await self.update('alliance_monuments', data, "monument_id = ?", (monument_id,))
    
    async def delete_alliance_monument(self, monument_id: str) -> int:
        """Delete an alliance monument."""
        return await self.delete('alliance_monuments', "monument_id = ?", (monument_id,))
