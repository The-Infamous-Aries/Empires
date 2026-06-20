"""
Session Manager for Empires Web Server

Manages web sessions backed by aiosqlite.
Sessions persist across bot restarts (30-day expiry).
"""

import asyncio
import json
import secrets
import time
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from ..Database.base_db import BaseDatabase

logger = logging.getLogger(__name__)


class SessionManager:
    """
    SQLite-backed session management.

    Sessions are stored in the empire database under a sessions table.
    Each session contains user_id (discord), access_token, refresh_token,
    and arbitrary data dict.
    """

    def __init__(self, db: BaseDatabase):
        self.db = db
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cleanup_task: Optional[asyncio.Task] = None

    async def initialize(self):
        """Ensure the sessions table exists and start cleanup loop."""
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS web_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL
            )
        """)
        await self.db.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON web_sessions(user_id)
        """)
        await self.db.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_expires ON web_sessions(expires_at)
        """)
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("SessionManager initialized")

    async def shutdown(self):
        if self._cleanup_task:
            self._cleanup_task.cancel()
            self._cleanup_task = None

    async def create_session(self, user_id: str, data: Dict[str, Any],
                             ttl_days: int = 30) -> str:
        """Create a new session, return session_id."""
        session_id = secrets.token_hex(32)
        expires_at = (datetime.utcnow() + timedelta(days=ttl_days)).isoformat()
        await self.db.execute(
            "INSERT INTO web_sessions (session_id, user_id, data, expires_at) VALUES (?, ?, ?, ?)",
            (session_id, user_id, json.dumps(data), expires_at)
        )
        self._cache[session_id] = {
            'user_id': user_id,
            'data': data,
            'expires_at': expires_at,
        }
        return session_id

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data or None if expired/missing."""
        if session_id in self._cache:
            cached = self._cache[session_id]
            expires = cached['expires_at']
            if isinstance(expires, str):
                expires_dt = datetime.fromisoformat(expires)
            else:
                expires_dt = expires
            if expires_dt > datetime.utcnow():
                return cached
            else:
                del self._cache[session_id]
                return None

        row = await self.db.fetchone(
            "SELECT user_id, data, expires_at FROM web_sessions WHERE session_id = ?",
            (session_id,)
        )
        if row is None:
            return None

        user_id, data_json, expires_at = row
        if isinstance(expires_at, str):
            expires_dt = datetime.fromisoformat(expires_at)
        else:
            expires_dt = expires_at

        if expires_dt <= datetime.utcnow():
            await self.delete_session(session_id)
            return None

        data = json.loads(data_json)
        result = {
            'user_id': user_id,
            'data': data,
            'expires_at': expires_at,
        }
        self._cache[session_id] = result

        await self.db.execute(
            "UPDATE web_sessions SET last_accessed = CURRENT_TIMESTAMP WHERE session_id = ?",
            (session_id,)
        )
        return result

    async def update_session(self, session_id: str, data: Dict[str, Any]):
        """Update session data."""
        data_json = json.dumps(data)
        await self.db.execute(
            "UPDATE web_sessions SET data = ?, last_accessed = CURRENT_TIMESTAMP WHERE session_id = ?",
            (data_json, session_id)
        )
        if session_id in self._cache:
            self._cache[session_id]['data'] = data

    async def delete_session(self, session_id: str):
        """Delete a session."""
        await self.db.execute("DELETE FROM web_sessions WHERE session_id = ?", (session_id,))
        self._cache.pop(session_id, None)

    async def delete_user_sessions(self, user_id: str):
        """Delete all sessions for a user."""
        await self.db.execute("DELETE FROM web_sessions WHERE user_id = ?", (user_id,))
        self._cache.clear()

    async def get_user_id(self, session_id: str) -> Optional[str]:
        """Get just the user_id for a valid session."""
        session = await self.get_session(session_id)
        if session:
            return session['user_id']
        return None

    async def _cleanup_loop(self):
        """Periodically purge expired sessions."""
        while True:
            try:
                await asyncio.sleep(3600)
                await self.db.execute(
                    "DELETE FROM web_sessions WHERE expires_at < datetime('now')"
                )
                logger.debug("Purged expired sessions")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Session cleanup error: {e}")
