"""
Auth Database for Empires Game

Separate database for user authentication data (Empires.db).
Keeps user accounts, sessions, and nation bindings separate from game data (nations.db).
"""

import logging
from typing import Optional, Dict, Any, List

from .base_db import BaseDatabase

logger = logging.getLogger(__name__)


class AuthDatabase(BaseDatabase):
    """
    Database for authentication data: users, sessions, OAuth accounts, nation bindings.
    
    All tables are created by the Auth class during initialization.
    This class just provides the database connection.
    """

    async def _create_schema(self):
        pass
