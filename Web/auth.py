"""
Web Authentication for Empires Game

Username/password AND OAuth (Discord, Google) authentication.
Users stored in Empires.db, sessions managed via HTTP-only cookies.
"""

import hashlib
import secrets
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from urllib.parse import urlencode

from .session_manager import SessionManager

logger = logging.getLogger(__name__)

# ---------- Permission Presets ----------
PERMISSIONS = [
    "can_view_users", "can_view_flags", "can_view_health",
    "can_ban_users", "can_delete_users",
    "can_force_tick", "can_reset_game",
    "can_manage_admins", "can_manage_permissions",
]

PRESET_ROLES = {
    "admin": {
        "can_view_users": True, "can_view_flags": True, "can_view_health": True,
        "can_ban_users": True, "can_delete_users": True,
        "can_force_tick": True, "can_reset_game": True,
        "can_manage_admins": True, "can_manage_permissions": True,
    },
    "mod": {
        "can_view_users": True, "can_view_flags": True, "can_view_health": True,
        "can_ban_users": True, "can_delete_users": False,
        "can_force_tick": False, "can_reset_game": False,
        "can_manage_admins": False, "can_manage_permissions": False,
    },
    "helper": {
        "can_view_users": True, "can_view_flags": True, "can_view_health": True,
        "can_ban_users": False, "can_delete_users": False,
        "can_force_tick": False, "can_reset_game": False,
        "can_manage_admins": False, "can_manage_permissions": False,
    },
}


def _perm_cols():
    return ", ".join(f"{p} INTEGER DEFAULT 0" for p in PERMISSIONS)


class Auth:
    """Authentication with email/password, OAuth, IP tracking, and nation binding."""

    def __init__(self, session_manager: SessionManager, db, config=None):
        self.session_manager = session_manager
        self.db = db
        self.config = config
        self._oauth_states: Dict[str, dict] = {}

    async def initialize(self):
        # Users table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS web_users (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT DEFAULT '',
                email TEXT DEFAULT '',
                avatar_url TEXT DEFAULT '',
                auth_provider TEXT DEFAULT 'email',
                is_admin INTEGER DEFAULT 0,
                banned INTEGER DEFAULT 0,
                ban_reason TEXT DEFAULT '',
                banned_at TIMESTAMP NULL,
                last_ip TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Permissions table
        await self.db.execute(f"""
            CREATE TABLE IF NOT EXISTS admin_permissions (
                user_id TEXT PRIMARY KEY,
                role TEXT DEFAULT 'user',
                {_perm_cols()}
            )
        """)
        # IP history table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS user_ip_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Nation binding table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS user_nations (
                user_id TEXT NOT NULL,
                nation_id TEXT NOT NULL UNIQUE,
                nation_name TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id)
            )
        """)
        # OAuth account links table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS oauth_accounts (
                provider TEXT NOT NULL,
                provider_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                email TEXT DEFAULT '',
                username TEXT DEFAULT '',
                avatar_url TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (provider, provider_id)
            )
        """)
        await self.db.execute("CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id)")
        await self.db.execute("CREATE INDEX IF NOT EXISTS idx_ip_history_user ON user_ip_history(user_id)")
        await self.db.execute("CREATE INDEX IF NOT EXISTS idx_ip_history_ip ON user_ip_history(ip_address)")

        # Sync legacy is_admin flag into permissions table
        await self.db.execute("""
            INSERT OR IGNORE INTO admin_permissions (user_id, role)
            SELECT user_id, 'user' FROM web_users
        """)
        admins = await self.db.fetchalldict(
            "SELECT user_id FROM web_users WHERE is_admin = 1"
        )
        for a in admins:
            await self._apply_role(a["user_id"], "admin")

        logger.info("Auth initialized")

    # ---------- OAuth State Management ----------
    def create_oauth_state(self, provider: str) -> str:
        state = secrets.token_hex(32)
        self._oauth_states[state] = {
            "provider": provider,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
        }
        return state

    def verify_oauth_state(self, state: str, provider: str) -> bool:
        entry = self._oauth_states.pop(state, None)
        if not entry:
            return False
        if entry["provider"] != provider:
            return False
        if datetime.utcnow() > entry["expires_at"]:
            return False
        return True

    def _clean_oauth_states(self):
        now = datetime.utcnow()
        expired = [s for s, e in self._oauth_states.items() if now > e["expires_at"]]
        for s in expired:
            self._oauth_states.pop(s, None)

    # ---------- Discord OAuth URLs ----------
    def get_discord_authorize_url(self) -> tuple[str, str]:
        if not self.config or not self.config.discord_client_id:
            return None, "Discord OAuth not configured"
        state = self.create_oauth_state("discord")
        redirect_uri = self._oauth_redirect_url("discord")
        params = {
            "client_id": self.config.discord_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "identify email",
            "state": state,
        }
        return f"https://discord.com/api/oauth2/authorize?{urlencode(params)}", None

    async def discord_callback(self, code: str, state: str) -> Optional[Dict]:
        if not self.verify_oauth_state(state, "discord"):
            return None
        if not self.config or not self.config.discord_client_id or not self.config.discord_client_secret:
            return None
        import httpx
        redirect_uri = self._oauth_redirect_url("discord")
        token_data = {
            "client_id": self.config.discord_client_id,
            "client_secret": self.config.discord_client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://discord.com/api/oauth2/token",
                data=token_data,
                headers=headers,
            )
            if token_resp.status_code != 200:
                logger.error(f"Discord token exchange failed: {token_resp.text}")
                return None
            token_json = token_resp.json()
            access_token = token_json.get("access_token")
            user_resp = await client.get(
                "https://discord.com/api/users/@me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if user_resp.status_code != 200:
                logger.error(f"Discord user fetch failed: {user_resp.text}")
                return None
            user_data = user_resp.json()
        provider_id = str(user_data.get("id"))
        email = user_data.get("email", "") or ""
        username = user_data.get("username", "") or f"discord_{provider_id[:8]}"
        avatar_hash = user_data.get("avatar", "")
        avatar_url = f"https://cdn.discordapp.com/avatars/{provider_id}/{avatar_hash}.png" if avatar_hash else ""
        return {
            "provider": "discord",
            "provider_id": provider_id,
            "email": email,
            "username": username,
            "avatar_url": avatar_url,
        }

    # ---------- Google OAuth URLs ----------
    def get_google_authorize_url(self) -> tuple[str, str]:
        if not self.config or not self.config.google_client_id:
            return None, "Google OAuth not configured"
        state = self.create_oauth_state("google")
        redirect_uri = self._oauth_redirect_url("google")
        params = {
            "client_id": self.config.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}", None

    async def google_callback(self, code: str, state: str) -> Optional[Dict]:
        if not self.verify_oauth_state(state, "google"):
            return None
        if not self.config or not self.config.google_client_id or not self.config.google_client_secret:
            return None
        import httpx
        redirect_uri = self._oauth_redirect_url("google")
        token_data = {
            "client_id": self.config.google_client_id,
            "client_secret": self.config.google_client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_data,
                headers=headers,
            )
            if token_resp.status_code != 200:
                logger.error(f"Google token exchange failed: {token_resp.text}")
                return None
            token_json = token_resp.json()
            access_token = token_json.get("access_token")
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if user_resp.status_code != 200:
                logger.error(f"Google user fetch failed: {user_resp.text}")
                return None
            user_data = user_resp.json()
        provider_id = str(user_data.get("id"))
        email = user_data.get("email", "") or ""
        username = user_data.get("name", "") or f"google_{provider_id[:8]}"
        picture = user_data.get("picture", "") or ""
        return {
            "provider": "google",
            "provider_id": provider_id,
            "email": email,
            "username": username,
            "avatar_url": picture,
        }

    def _oauth_redirect_url(self, provider: str) -> str:
        base = self.config.oauth_redirect_base if self.config else None
        if not base:
            base = "http://localhost:8001"
        return f"{base.rstrip('/')}/api/auth/{provider}/callback"

    # ---------- OAuth Login / Register ----------
    async def oauth_login_or_register(self, oauth_info: dict, ip_address: str = "") -> Optional[Dict]:
        provider = oauth_info["provider"]
        provider_id = oauth_info["provider_id"]
        email = oauth_info.get("email", "")
        username = oauth_info.get("username", "")
        avatar_url = oauth_info.get("avatar_url", "")

        # Check if this OAuth account is already linked
        link = await self.db.fetchone(
            "SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_id = ?",
            (provider, provider_id),
        )
        if link:
            user_id = link[0]
            user_row = await self.db.fetchone(
                "SELECT user_id, username, password_hash, is_admin, banned, ban_reason, email, avatar_url FROM web_users WHERE user_id = ?",
                (user_id,)
            )
            if not user_row:
                return None
            _, db_username, _, is_admin, banned, ban_reason, _, _ = user_row
            if banned:
                raise PermissionError(f"Account banned: {ban_reason}")
            await self.db.execute(
                "UPDATE web_users SET last_ip = ? WHERE user_id = ?",
                (ip_address, user_id)
            )
            await self._record_ip(user_id, ip_address)
            return await self._create_session(user_id, db_username, is_admin, ip_address)

        # Check if email is already used
        existing_by_email = None
        if email:
            existing_by_email = await self.db.fetchone(
                "SELECT user_id, username, password_hash, is_admin, banned FROM web_users WHERE email = ? AND email != ''",
                (email,)
            )

        if existing_by_email:
            user_id, db_username, _, is_admin, banned = existing_by_email
            if banned:
                raise PermissionError(f"Account banned: {banned}")
        else:
            # Create new user
            safe_username = await self._generate_unique_username(username, provider, provider_id)
            user_id = secrets.token_hex(16)
            await self.db.execute(
                "INSERT INTO web_users (user_id, username, email, avatar_url, auth_provider, last_ip) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, safe_username, email, avatar_url, provider, ip_address),
            )
            await self._record_ip(user_id, ip_address)
            await self.db.execute(
                "INSERT INTO admin_permissions (user_id, role) VALUES (?, 'user')",
                (user_id,)
            )
            count = await self.db.fetchone("SELECT COUNT(*) FROM admin_permissions WHERE role = 'admin'")
            is_first = count and count[0] == 0
            if is_first:
                await self._apply_role(user_id, "admin")
                await self.db.execute("UPDATE web_users SET is_admin = 1 WHERE user_id = ?", (user_id,))
                logger.info(f"First user '{safe_username}' promoted to admin")

            user_row = await self.db.fetchone(
                "SELECT user_id, username, is_admin FROM web_users WHERE user_id = ?", (user_id,)
            )
            if not user_row:
                return None
            _, db_username, is_admin = user_row

        # Link OAuth account
        await self.db.execute(
            "INSERT OR IGNORE INTO oauth_accounts (provider, provider_id, user_id, email, username, avatar_url) VALUES (?, ?, ?, ?, ?, ?)",
            (provider, provider_id, user_id, email, username, avatar_url),
        )
        await self.db.execute(
            "UPDATE web_users SET avatar_url = ? WHERE user_id = ? AND (avatar_url = '' OR avatar_url IS NULL)",
            (avatar_url, user_id)
        )

        return await self._create_session(user_id, db_username, is_admin, ip_address)

    async def _generate_unique_username(self, base: str, provider: str, provider_id: str) -> str:
        cleaned = "".join(c for c in base if c.isalnum() or c in "_- ").strip()[:20]
        if not cleaned:
            cleaned = f"{provider}_{provider_id[:8]}"
        if len(cleaned) < 3:
            cleaned = f"{cleaned}_{provider_id[:6]}"
        # Check uniqueness
        existing = await self.db.fetchone(
            "SELECT user_id FROM web_users WHERE username = ?", (cleaned,)
        )
        if existing:
            cleaned = f"{cleaned[:16]}_{provider_id[:6]}"
        return cleaned

    # ---------- Registration / Login (Email/Password) ----------
    async def register(self, username: str, password: str, email: str = "",
                       ip_address: str = "") -> Optional[Dict[str, Any]]:
        existing = await self.db.fetchone(
            "SELECT user_id FROM web_users WHERE username = ?", (username,)
        )
        if existing:
            return None

        user_id = secrets.token_hex(16)
        password_hash = self._hash_password(password)

        await self.db.execute(
            "INSERT INTO web_users (user_id, username, password_hash, email, auth_provider, last_ip) VALUES (?, ?, ?, ?, 'email', ?)",
            (user_id, username, password_hash, email, ip_address)
        )
        await self._record_ip(user_id, ip_address)
        await self.db.execute(
            "INSERT INTO admin_permissions (user_id, role) VALUES (?, 'user')",
            (user_id,)
        )
        count = await self.db.fetchone("SELECT COUNT(*) FROM admin_permissions WHERE role = 'admin'")
        is_first = count and count[0] == 0
        if is_first:
            await self._apply_role(user_id, "admin")
            await self.db.execute("UPDATE web_users SET is_admin = 1 WHERE user_id = ?", (user_id,))
            logger.info(f"First user '{username}' promoted to admin")

        perms = await self._get_perms(user_id)
        return {"user_id": user_id, "username": username, "email": email, "permissions": perms}

    async def login(self, username: str, password: str,
                    ip_address: str = "") -> Optional[Dict[str, Any]]:
        row = await self.db.fetchone(
            "SELECT user_id, username, password_hash, is_admin, banned, ban_reason FROM web_users WHERE username = ?",
            (username,)
        )
        if not row:
            return None

        user_id, db_username, password_hash, is_admin, banned, ban_reason = row

        if banned:
            raise PermissionError(f"Account banned: {ban_reason}")

        if not self._verify_password(password, password_hash):
            return None

        await self.db.execute(
            "UPDATE web_users SET last_ip = ? WHERE user_id = ?",
            (ip_address, user_id)
        )
        await self._record_ip(user_id, ip_address)

        return await self._create_session(user_id, db_username, is_admin, ip_address)

    async def _create_session(self, user_id: str, username: str, is_admin: bool, ip_address: str) -> Dict:
        perms = await self._get_perms(user_id)
        session_data = {
            "user_id": user_id,
            "username": username,
            "is_admin": bool(is_admin) or perms.get("can_view_users", False),
            "permissions": perms,
        }
        session_id = await self.session_manager.create_session(
            user_id=user_id,
            data=session_data,
        )
        return {
            "session_id": session_id,
            "user": {
                "id": user_id,
                "username": username,
                "is_admin": bool(is_admin),
                "permissions": perms,
            }
        }

    # ---------- Session / User Info ----------
    async def get_user(self, session_data: Optional[Dict]) -> Optional[Dict]:
        if not session_data:
            return None
        data = session_data.get("data", {})
        user_id = data.get("user_id")
        if not user_id:
            return None
        row = await self.db.fetchone(
            "SELECT avatar_url, auth_provider FROM web_users WHERE user_id = ?", (user_id,)
        )
        avatar_url = row[0] if row else ""
        auth_provider = row[1] if row else "email"
        return {
            "id": data.get("user_id"),
            "username": data.get("username"),
            "is_admin": data.get("is_admin", False),
            "permissions": data.get("permissions", {}),
            "avatar_url": avatar_url,
            "auth_provider": auth_provider,
        }

    async def get_full_user(self, user_id: str) -> Optional[Dict]:
        row = await self.db.fetchone(
            "SELECT user_id, username, email, avatar_url, auth_provider, is_admin, banned, ban_reason, banned_at, last_ip, created_at FROM web_users WHERE user_id = ?",
            (user_id,)
        )
        if not row:
            return None
        (uid, username, email, avatar_url, auth_provider, is_admin, banned, ban_reason, banned_at, last_ip, created_at) = row

        perms = await self._get_perms(uid)
        ips = await self.db.fetchalldict(
            "SELECT ip_address, first_seen, last_seen FROM user_ip_history WHERE user_id = ? ORDER BY last_seen DESC",
            (uid,)
        )
        nation = await self.db.fetchone(
            "SELECT nation_id, nation_name FROM user_nations WHERE user_id = ?",
            (uid,)
        )
        oauth_links = await self.db.fetchalldict(
            "SELECT provider, provider_id, email, username, avatar_url FROM oauth_accounts WHERE user_id = ?",
            (uid,)
        )

        return {
            "user_id": uid,
            "username": username,
            "email": email or "",
            "avatar_url": avatar_url or "",
            "auth_provider": auth_provider or "email",
            "is_admin": bool(is_admin),
            "banned": bool(banned),
            "ban_reason": ban_reason or "",
            "banned_at": banned_at,
            "last_ip": last_ip or "",
            "created_at": created_at,
            "ip_history": ips,
            "nation_id": nation[0] if nation else None,
            "nation_name": nation[1] if nation else None,
            "role": perms.get("role", "user"),
            "permissions": {k: v for k, v in perms.items() if k != "role"},
            "oauth_accounts": oauth_links,
        }

    async def list_users(self) -> List[Dict]:
        rows = await self.db.fetchalldict("""
            SELECT u.user_id, u.username, u.email, u.avatar_url, u.auth_provider,
                   u.is_admin, u.banned, u.last_ip, u.created_at,
                   p.role,
                   (SELECT nation_id FROM user_nations WHERE user_id = u.user_id) as nation_id,
                   (SELECT COUNT(*) FROM user_ip_history u2
                    JOIN user_ip_history uh ON u2.ip_address = uh.ip_address AND u2.user_id != uh.user_id
                    WHERE u2.user_id = u.user_id GROUP BY u2.user_id) as flag_count
            FROM web_users u
            LEFT JOIN admin_permissions p ON p.user_id = u.user_id
            ORDER BY u.created_at DESC
        """)
        for r in rows:
            r["is_admin"] = bool(r["is_admin"])
            r["banned"] = bool(r["banned"])
            r["flag_count"] = r["flag_count"] or 0
            r["role"] = r["role"] or "user"
        return rows

    async def get_flags(self) -> List[Dict]:
        rows = await self.db.fetchalldict("""
            SELECT a.user_id, a.username, a.email, a.last_ip, a.is_admin, a.banned, a.created_at,
                   p.role,
                   (SELECT nation_id FROM user_nations WHERE user_id = a.user_id) as nation_id,
                   GROUP_CONCAT(b.username, ', ') as shared_with
            FROM web_users a
            JOIN user_ip_history ah ON a.user_id = ah.user_id
            JOIN user_ip_history bh ON ah.ip_address = bh.ip_address AND bh.user_id != a.user_id
            JOIN web_users b ON b.user_id = bh.user_id
            LEFT JOIN admin_permissions p ON p.user_id = a.user_id
            GROUP BY a.user_id
            ORDER BY a.created_at DESC
        """)
        return rows

    # ---------- Nation Binding ----------
    async def bind_nation(self, user_id: str, nation_id: str, nation_name: str) -> bool:
        existing = await self.db.fetchone(
            "SELECT user_id FROM user_nations WHERE user_id = ?", (user_id,)
        )
        if existing:
            return False
        await self.db.execute(
            "INSERT INTO user_nations (user_id, nation_id, nation_name) VALUES (?, ?, ?)",
            (user_id, nation_id, nation_name)
        )
        return True

    async def get_user_nation(self, user_id: str) -> Optional[Dict]:
        row = await self.db.fetchone(
            "SELECT nation_id, nation_name FROM user_nations WHERE user_id = ?",
            (user_id,)
        )
        if not row:
            return None
        return {"nation_id": row[0], "nation_name": row[1]}

    async def get_user_by_nation(self, nation_id: str) -> Optional[Dict]:
        row = await self.db.fetchone(
            "SELECT user_id FROM user_nations WHERE nation_id = ?",
            (nation_id,)
        )
        if not row:
            return None
        user = await self.db.fetchone(
            "SELECT user_id, username, email, avatar_url FROM web_users WHERE user_id = ?",
            (row[0],)
        )
        if not user:
            return None
        return {"user_id": user[0], "username": user[1], "email": user[2], "avatar_url": user[3]}

    # ---------- Moderation ----------
    async def ban_user(self, user_id: str, reason: str = ""):
        await self.db.execute(
            "UPDATE web_users SET banned = 1, ban_reason = ?, banned_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            (reason, user_id)
        )
        await self.session_manager.delete_user_sessions(user_id)

    async def unban_user(self, user_id: str):
        await self.db.execute(
            "UPDATE web_users SET banned = 0, ban_reason = '', banned_at = NULL WHERE user_id = ?",
            (user_id,)
        )

    async def delete_user(self, user_id: str):
        await self.db.execute("DELETE FROM oauth_accounts WHERE user_id = ?", (user_id,))
        await self.db.execute("DELETE FROM user_nations WHERE user_id = ?", (user_id,))
        await self.db.execute("DELETE FROM user_ip_history WHERE user_id = ?", (user_id,))
        await self.db.execute("DELETE FROM admin_permissions WHERE user_id = ?", (user_id,))
        await self.session_manager.delete_user_sessions(user_id)
        await self.db.execute("DELETE FROM web_users WHERE user_id = ?", (user_id,))

    # ---------- Permission / Role Management ----------
    async def _apply_role(self, user_id: str, role: str):
        preset = PRESET_ROLES.get(role)
        if not preset:
            return
        sets = ", ".join(f"{p} = {1 if v else 0}" for p, v in preset.items())
        await self.db.execute(
            f"UPDATE admin_permissions SET role = '{role}', {sets} WHERE user_id = ?",
            (user_id,)
        )
        await self.db.execute(
            "UPDATE web_users SET is_admin = ? WHERE user_id = ?",
            (1 if role == "admin" else 0, user_id)
        )

    async def set_role(self, user_id: str, role: str):
        if role not in PRESET_ROLES:
            return False
        await self._apply_role(user_id, role)
        return True

    async def set_permissions(self, user_id: str, perms: Dict[str, bool]):
        row = await self.db.fetchone(
            "SELECT role FROM admin_permissions WHERE user_id = ?", (user_id,)
        )
        if not row:
            return False
        sets = ", ".join(f"{k} = {1 if v else 0}" for k, v in perms.items() if k in PERMISSIONS)
        if not sets:
            return False
        await self.db.execute(
            f"UPDATE admin_permissions SET role = 'custom', {sets} WHERE user_id = ?",
            (user_id,)
        )
        is_admin = any(perms.get(p, False) for p in PERMISSIONS)
        await self.db.execute(
            "UPDATE web_users SET is_admin = ? WHERE user_id = ?",
            (1 if is_admin else 0, user_id)
        )
        return True

    async def get_permissions(self, user_id: str) -> Optional[Dict]:
        return await self._get_perms(user_id)

    async def _get_perms(self, user_id: str) -> Dict:
        row = await self.db.fetchone(
            f"SELECT role, {', '.join(PERMISSIONS)} FROM admin_permissions WHERE user_id = ?",
            (user_id,)
        )
        if not row:
            return {"role": "user", **{p: False for p in PERMISSIONS}}
        result = {"role": row[0]}
        for i, p in enumerate(PERMISSIONS):
            result[p] = bool(row[i + 1])
        return result

    async def list_roles(self) -> Dict:
        return PRESET_ROLES

    # ---------- IP Tracking ----------
    async def _record_ip(self, user_id: str, ip_address: str):
        if not ip_address:
            return
        existing = await self.db.fetchone(
            "SELECT id FROM user_ip_history WHERE user_id = ? AND ip_address = ?",
            (user_id, ip_address)
        )
        if existing:
            await self.db.execute(
                "UPDATE user_ip_history SET last_seen = CURRENT_TIMESTAMP WHERE id = ?",
                (existing[0],)
            )
        else:
            await self.db.execute(
                "INSERT INTO user_ip_history (user_id, ip_address) VALUES (?, ?)",
                (user_id, ip_address)
            )

    # ---------- Password Hashing ----------
    def _hash_password(self, password: str) -> str:
        salt = secrets.token_hex(16)
        return f"{salt}:{hashlib.sha256(f'{salt}:{password}'.encode()).hexdigest()}"

    def _verify_password(self, password: str, stored: str) -> bool:
        try:
            salt, hash_str = stored.split(":", 1)
            return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest() == hash_str
        except (ValueError, AttributeError):
            return False
