"""
Empire Configuration Management

Centralized configuration for the Empire GPP system.
"""

import os
from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv


@dataclass
class EmpireConfig:
    """Configuration for the Empire GPP system."""
    
    # Database Configuration
    database_path: str = field(default_factory=lambda: str(Path(__file__).parent.parent / "Saves" / "empire.db"))
    game_database_path: Optional[str] = None  # Defaults to database_path if not set
    database_pool_size: int = 10
    database_timeout: float = 30.0
    
    # OAuth Configuration
    discord_client_id: Optional[str] = None
    discord_client_secret: Optional[str] = None
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    oauth_redirect_base: Optional[str] = None
    
    # Lock Configuration
    lock_timeout: float = 30.0
    
    # Write Queue Configuration
    write_queue_max_size: int = 1000
    write_queue_flush_interval: float = 1.0
    write_queue_batch_size: int = 100
    
    # Event Bus Configuration
    event_bus_max_queue_size: int = 1000
    
    # Tick Configuration
    tick_interval: int = 3600  # 1 hour in seconds
    
    # API / Web Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8001
    api_enabled: bool = True
    web_enabled: bool = True
    
    # Plugin Configuration
    plugin_directory: str = field(default_factory=lambda: str(Path(__file__).parent.parent / "Plugins"))
    auto_load_plugins: bool = True
    
    # Metrics Configuration
    metrics_enabled: bool = True
    metrics_interval: float = 60.0
    
    # Logging Configuration
    log_level: str = "INFO"
    log_file: Optional[str] = field(default_factory=lambda: str(Path(__file__).parent.parent / "empire.log"))
    
    # Cloudflare Tunnel Configuration
    tunnel_enabled: bool = True
    tunnel_name: str = "empires"
    tunnel_domain: str = "empires.qzz.io"
    tunnel_config_path: str = field(default_factory=lambda: str(Path.home() / ".cloudflared" / "empires-config.yml"))

    # Development Configuration
    debug: bool = False
    
    @classmethod
    def from_env(cls) -> 'EmpireConfig':
        """Load configuration from environment variables."""
        load_dotenv()
        config = cls()
        
        if os.getenv('EMPIRE_DATABASE_PATH'):
            config.database_path = os.getenv('EMPIRE_DATABASE_PATH')
        if os.getenv('EMPIRE_GAME_DATABASE_PATH'):
            config.game_database_path = os.getenv('EMPIRE_GAME_DATABASE_PATH')
        if os.getenv('EMPIRE_DATABASE_POOL_SIZE'):
            config.database_pool_size = int(os.getenv('EMPIRE_DATABASE_POOL_SIZE'))
        
        # OAuth overrides
        if os.getenv('EMPIRE_DISCORD_CLIENT_ID'):
            config.discord_client_id = os.getenv('EMPIRE_DISCORD_CLIENT_ID')
        if os.getenv('EMPIRE_DISCORD_CLIENT_SECRET'):
            config.discord_client_secret = os.getenv('EMPIRE_DISCORD_CLIENT_SECRET')
        if os.getenv('EMPIRE_GOOGLE_CLIENT_ID'):
            config.google_client_id = os.getenv('EMPIRE_GOOGLE_CLIENT_ID')
        if os.getenv('EMPIRE_GOOGLE_CLIENT_SECRET'):
            config.google_client_secret = os.getenv('EMPIRE_GOOGLE_CLIENT_SECRET')
        if os.getenv('EMPIRE_OAUTH_REDIRECT_BASE'):
            config.oauth_redirect_base = os.getenv('EMPIRE_OAUTH_REDIRECT_BASE')
        
        if os.getenv('EMPIRE_TICK_INTERVAL'):
            config.tick_interval = int(os.getenv('EMPIRE_TICK_INTERVAL'))
        if os.getenv('EMPIRE_API_HOST'):
            config.api_host = os.getenv('EMPIRE_API_HOST')
        if os.getenv('EMPIRE_API_PORT'):
            config.api_port = int(os.getenv('EMPIRE_API_PORT'))
        if os.getenv('EMPIRE_API_ENABLED'):
            config.api_enabled = os.getenv('EMPIRE_API_ENABLED').lower() == 'true'
        if os.getenv('EMPIRE_DEBUG'):
            config.debug = os.getenv('EMPIRE_DEBUG').lower() == 'true'
        if os.getenv('EMPIRE_LOG_LEVEL'):
            config.log_level = os.getenv('EMPIRE_LOG_LEVEL')
        
        # Cloudflare Tunnel overrides
        if os.getenv('EMPIRE_TUNNEL_ENABLED'):
            config.tunnel_enabled = os.getenv('EMPIRE_TUNNEL_ENABLED').lower() == 'true'
        if os.getenv('EMPIRE_TUNNEL_NAME'):
            config.tunnel_name = os.getenv('EMPIRE_TUNNEL_NAME')
        if os.getenv('EMPIRE_TUNNEL_DOMAIN'):
            config.tunnel_domain = os.getenv('EMPIRE_TUNNEL_DOMAIN')
        if os.getenv('EMPIRE_TUNNEL_CONFIG_PATH'):
            config.tunnel_config_path = os.getenv('EMPIRE_TUNNEL_CONFIG_PATH')
        
        return config
    
    def validate(self) -> bool:
        """Validate the configuration."""
        db_path = Path(self.database_path)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        game_db_path = Path(self.game_database_path or self.database_path)
        game_db_path.parent.mkdir(parents=True, exist_ok=True)
        
        plugin_path = Path(self.plugin_directory)
        plugin_path.mkdir(parents=True, exist_ok=True)
        
        if self.log_file:
            log_path = Path(self.log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)
        
        return True
