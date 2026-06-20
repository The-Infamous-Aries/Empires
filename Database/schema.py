"""
Database Schema for Empire Game (Unified)

This module defines the unified SQLite database schema for the Empire game.
The schema is now unified into a single database (empire.db) instead of multiple databases.
This file provides schema definition and migration utilities.
"""

from typing import List, Dict, Any


class DatabaseSchema:
    """
    Unified database schema definition for Empire game.
    
    All tables are now in a single database (empire.db) for better performance and consistency.
    """
    
    # Schema version for migrations
    SCHEMA_VERSION = 2
    
    @staticmethod
    def get_all_tables() -> List[str]:
        """Get list of all tables in the unified schema."""
        return [
            'nations',
            'cities',
            'military',
            'alliances',
            'alliance_members',
            'wars',
            'trade_circles',
            'circle_members',
            'events',
            'diplomatic_relations',
            'spy_operations',
            'plugin_data',
            'tick_state',
            'nation_resources',
            'nation_improvements',
            'nation_wonders',
            'nation_projects',
            'nation_bonuses',
            'treaties',
            'sanctions',
            'nation_cooldowns',
            'war_details',
            'alliance_monuments',
        ]
    
    @staticmethod
    def get_table_schema(table_name: str) -> str:
        """
        Get the SQL schema for a specific table.
        
        Args:
            table_name: Name of the table
        
        Returns:
            SQL CREATE TABLE statement
        """
        schemas = {
            'nations': """
                CREATE TABLE IF NOT EXISTS nations (
                    nation_id TEXT PRIMARY KEY,
                    nation_name TEXT NOT NULL,
                    ruler_name TEXT NOT NULL,
                    capital_city_name TEXT NOT NULL,
                    national_color TEXT NOT NULL,
                    government_type TEXT NOT NULL,
                    religion_type TEXT,
                    war_policy_type TEXT DEFAULT 'NEUTRAL',
                    domestic_policy_type TEXT DEFAULT 'BALANCED',
                    
                    -- Economic fields
                    cash REAL DEFAULT 10000000.0,
                    technology INTEGER DEFAULT 0,
                    literacy_rate REAL DEFAULT 0.0,
                    tax_rate REAL DEFAULT 0.30,
                    max_tax_rate REAL DEFAULT 0.20,
                    citizen_income REAL DEFAULT 5.0,
                    
                    -- Resource fields
                    resource_slots INTEGER DEFAULT 1,
                    resource_1 TEXT DEFAULT 'GRAIN',
                    resource_2 TEXT,
                    has_water_access BOOLEAN DEFAULT FALSE,
                    improvement_slots_available INTEGER DEFAULT 0,
                    wonder_slots_available INTEGER DEFAULT 1,
                    project_slots_available INTEGER DEFAULT 1,
                    
                    -- Trade fields
                    trade_posts_built INTEGER DEFAULT 0,
                    trade_slots_available INTEGER DEFAULT 0,
                    trade_partners TEXT DEFAULT '[]',
                    is_blockaded BOOLEAN DEFAULT FALSE,
                    blockade_end_tick INTEGER DEFAULT 0,
                    
                    -- Nuclear/WMD fields
                    nuclear_weapons_used INTEGER DEFAULT 0,
                    diplomatic_penalty REAL DEFAULT 0.0,
                    world_condemnation_ticks_remaining INTEGER DEFAULT 0,
                    wmd_banned BOOLEAN DEFAULT FALSE,
                    wmd_ban_expires_at TIMESTAMP,
                    wmd_destruction_grace_ends_at TIMESTAMP,
                    
                    -- Supply lines
                    supply_lines_intact BOOLEAN DEFAULT TRUE,
                    supply_lines_end_tick INTEGER DEFAULT 0,
                    
                    -- Alliance fields
                    alliance_id TEXT,
                    alliance_role TEXT,
                    
                    -- War fields
                    wars_offensive TEXT DEFAULT '[]',
                    wars_defensive TEXT DEFAULT '[]',
                    war_details TEXT DEFAULT '{}',
                    war_cooldown INTEGER DEFAULT 0,
                    is_beige BOOLEAN DEFAULT FALSE,
                    beige_ticks_remaining INTEGER DEFAULT 0,
                    
                    -- Progression fields
                    current_tier TEXT DEFAULT 'MICRO',
                    tier_progress REAL DEFAULT 0.0,
                    
                    -- City tracking
                    city_ids TEXT DEFAULT '[]',
                    total_population INTEGER DEFAULT 0,
                    total_infrastructure INTEGER DEFAULT 1000,
                    total_land INTEGER DEFAULT 1000,
                    happiness INTEGER DEFAULT 10,
                    environment INTEGER DEFAULT 3,
                    
                    -- Events
                    active_events TEXT DEFAULT '[]',
                    
                    -- Resource production and cooldowns (stored as JSON)
                    resource_production_rates TEXT DEFAULT '{}',
                    resource_change_cooldown TEXT DEFAULT '{}',
                    
                    -- Commanders (stored as JSON)
                    commanders TEXT DEFAULT '{}',
                    
                    -- Cooldowns
                    anarchy_ticks_remaining INTEGER DEFAULT 0,
                    government_change_cooldown INTEGER DEFAULT 0,
                    policy_change_cooldown INTEGER DEFAULT 0,
                    religion_change_cooldown INTEGER DEFAULT 0,
                    infrastructure_disabled_ticks INTEGER DEFAULT 0,
                    
                    -- Assembly/Congress effects
                    active_assembly_effects TEXT DEFAULT '[]',
                    active_congress_effects TEXT DEFAULT '[]',
                    
                    -- Metadata
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    founding_tick INTEGER DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    FOREIGN KEY (alliance_id) REFERENCES alliances(alliance_id)
                )
            """,
            'cities': """
                CREATE TABLE IF NOT EXISTS cities (
                    city_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    city_name TEXT NOT NULL,
                    infrastructure INTEGER DEFAULT 0,
                    land INTEGER DEFAULT 0,
                    population INTEGER DEFAULT 0,
                    
                    -- City ratings
                    base_environment REAL DEFAULT 50.0,
                    environment REAL DEFAULT 50.0,
                    crime REAL DEFAULT 20.0,
                    disease REAL DEFAULT 15.0,
                    pollution REAL DEFAULT 0.0,
                    
                    -- City state
                    is_capital BOOLEAN DEFAULT FALSE,
                    is_destroyed BOOLEAN DEFAULT FALSE,
                    resistance REAL DEFAULT 0.0,
                    
                    -- City cache
                    age_in_ticks INTEGER DEFAULT 0,
                    improvement_slots INTEGER DEFAULT 0,
                    
                    -- Metadata
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    founding_tick INTEGER DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'military': """
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
            """,
            'nation_resources': """
                CREATE TABLE IF NOT EXISTS nation_resources (
                    resource_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    resource_type TEXT NOT NULL,
                    amount REAL DEFAULT 0.0,
                    production_rate REAL DEFAULT 0.0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'city_resources': """
                CREATE TABLE IF NOT EXISTS city_resources (
                    resource_id TEXT PRIMARY KEY,
                    city_id TEXT NOT NULL,
                    resource_type TEXT NOT NULL,
                    amount REAL DEFAULT 0.0,
                    FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE
                )
            """,
            'city_improvements': """
                CREATE TABLE IF NOT EXISTS city_improvements (
                    improvement_id TEXT PRIMARY KEY,
                    city_id TEXT NOT NULL,
                    improvement_type TEXT NOT NULL,
                    level INTEGER DEFAULT 0,
                    FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE
                )
            """,
            'nation_wonders': """
                CREATE TABLE IF NOT EXISTS nation_wonders (
                    wonder_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    wonder_type TEXT NOT NULL,
                    built_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'nation_projects': """
                CREATE TABLE IF NOT EXISTS nation_projects (
                    project_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    project_type TEXT NOT NULL,
                    completed BOOLEAN DEFAULT FALSE,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'alliances': """
                CREATE TABLE IF NOT EXISTS alliances (
                    alliance_id TEXT PRIMARY KEY,
                    alliance_name TEXT NOT NULL,
                    leader_nation_id TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (leader_nation_id) REFERENCES nations(nation_id)
                )
            """,
            'alliance_members': """
                CREATE TABLE IF NOT EXISTS alliance_members (
                    member_id TEXT PRIMARY KEY,
                    alliance_id TEXT NOT NULL,
                    nation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (alliance_id) REFERENCES alliances(alliance_id) ON DELETE CASCADE,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'alliance_monuments': """
                CREATE TABLE IF NOT EXISTS alliance_monuments (
                    monument_id TEXT PRIMARY KEY,
                    alliance_id TEXT NOT NULL,
                    monument_type TEXT NOT NULL,
                    level INTEGER DEFAULT 0,
                    built_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (alliance_id) REFERENCES alliances(alliance_id) ON DELETE CASCADE
                )
            """,
            'treaties': """
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
            """,
            'sanctions': """
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
            """,
            'nation_cooldowns': """
                CREATE TABLE IF NOT EXISTS nation_cooldowns (
                    cooldown_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    cooldown_type TEXT NOT NULL,
                    ticks_remaining INTEGER DEFAULT 0,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'wars': """
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
            """,
            'trade_circles': """
                CREATE TABLE IF NOT EXISTS trade_circles (
                    circle_id TEXT PRIMARY KEY,
                    circle_name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """,
            'circle_members': """
                CREATE TABLE IF NOT EXISTS circle_members (
                    member_id TEXT PRIMARY KEY,
                    circle_id TEXT NOT NULL,
                    nation_id TEXT NOT NULL,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (circle_id) REFERENCES trade_circles(circle_id) ON DELETE CASCADE,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'events': """
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    event_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'diplomatic_relations': """
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
            """,
            'spy_operations': """
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
            """,
            'plugin_data': """
                CREATE TABLE IF NOT EXISTS plugin_data (
                    plugin_name TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (plugin_name, key)
                )
            """,
            'tick_state': """
                CREATE TABLE IF NOT EXISTS tick_state (
                    tick_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tick_number INTEGER NOT NULL,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT NOT NULL
                )
            """,
            'nation_resources': """
                CREATE TABLE IF NOT EXISTS nation_resources (
                    resource_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    resource_type TEXT NOT NULL,
                    amount REAL DEFAULT 0.0,
                    production_rate REAL DEFAULT 0.0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'nation_improvements': """
                CREATE TABLE IF NOT EXISTS nation_improvements (
                    improvement_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    improvement_type TEXT NOT NULL,
                    level INTEGER DEFAULT 0,
                    city_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE,
                    FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE
                )
            """,
            'nation_wonders': """
                CREATE TABLE IF NOT EXISTS nation_wonders (
                    wonder_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    wonder_type TEXT NOT NULL,
                    city_id TEXT,
                    built_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE,
                    FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE
                )
            """,
            'nation_projects': """
                CREATE TABLE IF NOT EXISTS nation_projects (
                    project_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    project_type TEXT NOT NULL,
                    completed BOOLEAN DEFAULT FALSE,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'nation_bonuses': """
                CREATE TABLE IF NOT EXISTS nation_bonuses (
                    bonus_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    bonus_type TEXT NOT NULL,
                    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'treaties': """
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
            """,
            'sanctions': """
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
            """,
            'nation_cooldowns': """
                CREATE TABLE IF NOT EXISTS nation_cooldowns (
                    cooldown_id TEXT PRIMARY KEY,
                    nation_id TEXT NOT NULL,
                    cooldown_type TEXT NOT NULL,
                    ticks_remaining INTEGER DEFAULT 0,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'war_details': """
                CREATE TABLE IF NOT EXISTS war_details (
                    detail_id TEXT PRIMARY KEY,
                    war_id TEXT NOT NULL,
                    nation_id TEXT NOT NULL,
                    war_score REAL DEFAULT 50.0,
                    attacks_used_this_tick INTEGER DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (war_id) REFERENCES wars(war_id) ON DELETE CASCADE,
                    FOREIGN KEY (nation_id) REFERENCES nations(nation_id) ON DELETE CASCADE
                )
            """,
            'alliance_monuments': """
                CREATE TABLE IF NOT EXISTS alliance_monuments (
                    monument_id TEXT PRIMARY KEY,
                    alliance_id TEXT NOT NULL,
                    monument_type TEXT NOT NULL,
                    level INTEGER DEFAULT 0,
                    built_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (alliance_id) REFERENCES alliances(alliance_id) ON DELETE CASCADE
                )
            """,
        }
        
        if table_name not in schemas:
            raise ValueError(f"Unknown table: {table_name}")
        
        return schemas[table_name]
    
    @staticmethod
    def get_indexes() -> List[str]:
        """Get list of all indexes for performance optimization."""
        return [
            "CREATE INDEX IF NOT EXISTS idx_cities_nation_id ON cities(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_military_nation_id ON military(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_alliance_members_alliance_id ON alliance_members(alliance_id)",
            "CREATE INDEX IF NOT EXISTS idx_alliance_members_nation_id ON alliance_members(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_wars_attacker_id ON wars(attacker_id)",
            "CREATE INDEX IF NOT EXISTS idx_wars_defender_id ON wars(defender_id)",
            "CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON circle_members(circle_id)",
            "CREATE INDEX IF NOT EXISTS idx_circle_members_nation_id ON circle_members(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_events_nation_id ON events(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_diplomatic_relations_nation_a ON diplomatic_relations(nation_a_id)",
            "CREATE INDEX IF NOT EXISTS idx_diplomatic_relations_nation_b ON diplomatic_relations(nation_b_id)",
            "CREATE INDEX IF NOT EXISTS idx_nation_resources_nation_id ON nation_resources(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_nation_resources_type ON nation_resources(resource_type)",
            "CREATE INDEX IF NOT EXISTS idx_nation_improvements_nation_id ON nation_improvements(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_nation_improvements_city_id ON nation_improvements(city_id)",
            "CREATE INDEX IF NOT EXISTS idx_nation_wonders_nation_id ON nation_wonders(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_nation_wonders_city_id ON nation_wonders(city_id)",
            "CREATE INDEX IF NOT EXISTS idx_nation_projects_nation_id ON nation_projects(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_nation_bonuses_nation_id ON nation_bonuses(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_treaties_party_a ON treaties(party_a_id)",
            "CREATE INDEX IF NOT EXISTS idx_treaties_party_b ON treaties(party_b_id)",
            "CREATE INDEX IF NOT EXISTS idx_sanctions_target ON sanctions(target_nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_nation_cooldowns_nation_id ON nation_cooldowns(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_war_details_war_id ON war_details(war_id)",
            "CREATE INDEX IF NOT EXISTS idx_war_details_nation_id ON war_details(nation_id)",
            "CREATE INDEX IF NOT EXISTS idx_alliance_monuments_alliance_id ON alliance_monuments(alliance_id)",
            "CREATE INDEX IF NOT EXISTS idx_nations_alliance_id ON nations(alliance_id)",
            "CREATE INDEX IF NOT EXISTS idx_nations_current_tier ON nations(current_tier)",
        ]
