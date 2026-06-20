"""
Web Server - Empires Game Frontend

Mounts the web frontend onto the FastAPI app.
Serves static files, HTML pages, and API routes for the web UI.
"""

import os
import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .session_manager import SessionManager
from .auth import Auth

from ..Logic.formulas import calculate_infrastructure_cost, calculate_land_cost, calculate_citizen_income, calculate_tax_income
from ..Logic.nation import NationSystem
from ..Logic.city import CitySystem
from ..Logic.military import military_system, MilitaryUnitType
from ..Logic.govrel import GovernmentSystem, ReligionSystem, GovernmentType, ReligionType as GovRelReligionType
from ..Logic.policies import DomesticPolicySystem, WarPolicySystem, DomesticPolicyType, WarPolicyType
from ..Logic.resources import ResourceSystem, ResourceType
from dataclasses import asdict

logger = logging.getLogger(__name__)

WEB_DIR = Path(__file__).parent


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""


class WebServer:
    def __init__(self, gpp_manager, auth: Auth):
        self.gpp = gpp_manager
        self.auth = auth
        self.router = APIRouter()
        self._setup_routes()

    @property
    def _cookie_secure(self) -> bool:
        base = self.auth.config.oauth_redirect_base or ""
        return base.startswith("https://")

    def _setup_routes(self):
        router = self.router

        # ---------- Page Routes ----------
        @router.get("/", response_class=HTMLResponse)
        async def index(request: Request):
            return await self._serve_page("dashboard.html", request)

        @router.get("/login", response_class=HTMLResponse)
        async def login_page(request: Request):
            session = await self._get_session(request)
            if session:
                return RedirectResponse(url="/", status_code=302)
            return await self._serve_page("Pages/login.html", request)

        @router.get("/register", response_class=HTMLResponse)
        async def register_page(request: Request):
            session = await self._get_session(request)
            if session:
                return RedirectResponse(url="/", status_code=302)
            return await self._serve_page("Pages/login.html", request)

        @router.get("/nations", response_class=HTMLResponse)
        async def nations_page(request: Request):
            return await self._serve_protected_page("Pages/nations.html", request)

        @router.get("/nation/{nation_id}", response_class=HTMLResponse)
        async def nation_detail_page(request: Request, nation_id: str):
            return await self._serve_protected_page("Pages/nation_detail.html", request)

        @router.get("/alliances", response_class=HTMLResponse)
        async def alliances_page(request: Request):
            return await self._serve_protected_page("Pages/alliances.html", request)

        @router.get("/alliance/{alliance_id}", response_class=HTMLResponse)
        async def alliance_detail_page(request: Request, alliance_id: str):
            return await self._serve_protected_page("Pages/alliance_detail.html", request)

        @router.get("/wars", response_class=HTMLResponse)
        async def wars_page(request: Request):
            return await self._serve_protected_page("Pages/wars.html", request)

        @router.get("/war/{war_id}", response_class=HTMLResponse)
        async def war_detail_page(request: Request, war_id: str):
            return await self._serve_protected_page("Pages/war_detail.html", request)

        @router.get("/market", response_class=HTMLResponse)
        async def market_page(request: Request):
            return await self._serve_protected_page("Pages/market.html", request)

        @router.get("/trade", response_class=HTMLResponse)
        async def trade_page(request: Request):
            return await self._serve_protected_page("Pages/trade.html", request)

        @router.get("/cities", response_class=HTMLResponse)
        async def cities_page(request: Request):
            return await self._serve_protected_page("Pages/cities.html", request)

        @router.get("/military", response_class=HTMLResponse)
        async def military_page(request: Request):
            return await self._serve_protected_page("Pages/military.html", request)

        @router.get("/spy", response_class=HTMLResponse)
        async def spy_page(request: Request):
            return await self._serve_protected_page("Pages/spy.html", request)

        @router.get("/diplomacy", response_class=HTMLResponse)
        async def diplomacy_page(request: Request):
            return await self._serve_protected_page("Pages/diplomacy.html", request)

        @router.get("/rankings", response_class=HTMLResponse)
        async def rankings_page(request: Request):
            return await self._serve_protected_page("Pages/rankings.html", request)

        @router.get("/activity", response_class=HTMLResponse)
        async def activity_page(request: Request):
            return await self._serve_protected_page("Pages/activity.html", request)

        @router.get("/map", response_class=HTMLResponse)
        async def map_page(request: Request):
            return await self._serve_protected_page("Pages/world_map.html", request)

        @router.get("/alliance/bank", response_class=HTMLResponse)
        async def alliance_bank_page(request: Request):
            return await self._serve_protected_page("Pages/alliance_bank.html", request)

        @router.get("/admin", response_class=HTMLResponse)
        async def admin_page(request: Request):
            return await self._serve_protected_page("Pages/admin.html", request)

        @router.get("/empire", response_class=HTMLResponse)
        async def empire_page(request: Request):
            return await self._serve_protected_page("Pages/empire.html", request)

        # ---------- Auth API Routes ----------
        @router.post("/api/auth/login")
        async def api_login(request: Request):
            body = await request.json()
            username = body.get("username", "").strip()
            password = body.get("password", "")
            ip = _client_ip(request)

            if not username or not password:
                return JSONResponse({"error": "Username and password required"}, status_code=400)

            try:
                result = await self.auth.login(username, password, ip_address=ip)
            except PermissionError as e:
                return JSONResponse({"error": str(e)}, status_code=403)

            if not result:
                return JSONResponse({"error": "Invalid credentials"}, status_code=401)

            resp = JSONResponse({"user": result["user"]})
            resp.set_cookie(
                key="session_id",
                value=result["session_id"],
                max_age=30 * 24 * 3600,
                httponly=True,
                samesite="lax",
                secure=self._cookie_secure,
            )
            return resp

        @router.post("/api/auth/register")
        async def api_register(request: Request):
            body = await request.json()
            username = body.get("username", "").strip()
            password = body.get("password", "")
            email = body.get("email", "").strip()
            ip = _client_ip(request)

            if not username or not password:
                return JSONResponse({"error": "Username and password required"}, status_code=400)
            if len(username) < 3 or len(username) > 24:
                return JSONResponse({"error": "Username must be 3-24 characters"}, status_code=400)
            if len(password) < 4:
                return JSONResponse({"error": "Password must be at least 4 characters"}, status_code=400)

            result = await self.auth.register(username, password, email=email, ip_address=ip)
            if not result:
                return JSONResponse({"error": "Username already taken"}, status_code=409)

            return {"message": "Account created", "user": result}

        @router.get("/api/auth/me")
        async def auth_me(request: Request):
            session = await self._get_session(request)
            if not session:
                return JSONResponse({"authenticated": False})
            user = await self.auth.get_user(session)
            if not user:
                return JSONResponse({"authenticated": False})
            # Include nation info
            nation = await self.auth.get_user_nation(user["id"])
            return JSONResponse({"authenticated": True, "user": {
                **user,
                "nation": nation,
                "nation_id": nation["nation_id"] if nation else None,
                "nation_name": nation["nation_name"] if nation else None,
            }})

        @router.post("/api/auth/logout")
        async def logout(request: Request):
            session_id = request.cookies.get("session_id")
            if session_id:
                await self.auth.session_manager.delete_session(session_id)
            resp = JSONResponse({"message": "Logged out"})
            resp.delete_cookie("session_id")
            return resp

        @router.get("/api/auth/config")
        async def auth_config():
            conf = self.auth.config if self.auth.config else None
            return {
                "discord_available": bool(conf and conf.discord_client_id and conf.discord_client_secret),
                "google_available": bool(conf and conf.google_client_id and conf.google_client_secret),
                "email_available": True,
            }

        # ---------- OAuth Routes ----------
        @router.get("/api/auth/discord")
        async def discord_login():
            url, error = self.auth.get_discord_authorize_url()
            if error:
                return JSONResponse({"error": error}, status_code=501)
            return RedirectResponse(url=url)

        @router.get("/api/auth/discord/callback")
        async def discord_callback(request: Request, code: str = "", state: str = ""):
            ip = _client_ip(request)
            if not code or not state:
                return HTMLResponse("Missing code or state", status_code=400)
            oauth_info = await self.auth.discord_callback(code, state)
            if not oauth_info:
                return HTMLResponse("Discord authentication failed", status_code=400)
            try:
                result = await self.auth.oauth_login_or_register(oauth_info, ip_address=ip)
            except PermissionError as e:
                return HTMLResponse(str(e), status_code=403)
            if not result:
                return HTMLResponse("Failed to create session", status_code=500)
            resp = RedirectResponse(url="/")
            resp.set_cookie(
                key="session_id",
                value=result["session_id"],
                max_age=30 * 24 * 3600,
                httponly=True,
                samesite="lax",
                secure=self._cookie_secure,
            )
            return resp

        @router.get("/api/auth/google")
        async def google_login():
            url, error = self.auth.get_google_authorize_url()
            if error:
                return JSONResponse({"error": error}, status_code=501)
            return RedirectResponse(url=url)

        @router.get("/api/auth/google/callback")
        async def google_callback(request: Request, code: str = "", state: str = ""):
            ip = _client_ip(request)
            if not code or not state:
                return HTMLResponse("Missing code or state", status_code=400)
            oauth_info = await self.auth.google_callback(code, state)
            if not oauth_info:
                return HTMLResponse("Google authentication failed", status_code=400)
            try:
                result = await self.auth.oauth_login_or_register(oauth_info, ip_address=ip)
            except PermissionError as e:
                return HTMLResponse(str(e), status_code=403)
            if not result:
                return HTMLResponse("Failed to create session", status_code=500)
            resp = RedirectResponse(url="/")
            resp.set_cookie(
                key="session_id",
                value=result["session_id"],
                max_age=30 * 24 * 3600,
                httponly=True,
                samesite="lax",
                secure=self._cookie_secure,
            )
            return resp

        # ---------- User / Nation API ----------
        @router.get("/api/web/user/nation")
        async def user_nation(request: Request):
            session = await self._get_session(request)
            if not session:
                raise HTTPException(401, "Not authenticated")
            user = await self.auth.get_user(session)
            nation = await self.auth.get_user_nation(user["id"])
            if not nation:
                return {"has_nation": False}
            comp = self.gpp.get_component("nation_city")
            if comp:
                detail = await comp.get_nation_by_id(nation["nation_id"])
            else:
                detail = None
            return {"has_nation": True, "nation": detail or nation}

        @router.get("/api/web/empire/overview")
        async def empire_overview(request: Request):
            """Consolidated empire data for the Empire Control panel"""
            session = await self._get_session(request)
            if not session:
                raise HTTPException(401, "Not authenticated")
            user = await self.auth.get_user(session)
            nation_record = await self.auth.get_user_nation(user["id"])
            if not nation_record:
                raise HTTPException(404, "No empire found")

            db = self.gpp.db
            nation_id = nation_record["nation_id"]
            ncomp = self.gpp.get_component("nation_city")
            mcomp = self.gpp.get_component("military_war")
            acomp = self.gpp.get_component("alliance")

            nation = None
            if ncomp:
                nation = await ncomp.get_nation_by_id(nation_id)
            if not nation:
                nation = nation_record

            cities = await db.fetchalldict(
                "SELECT * FROM cities WHERE nation_id=? ORDER BY city_name", (nation_id,))
            if not cities:
                city = await db.fetchonedict(
                    "SELECT * FROM cities WHERE nation_id=? LIMIT 1", (nation_id,))
                cities = [city] if city else []

            resources = await db.fetchalldict(
                "SELECT * FROM nation_resources WHERE nation_id=?", (nation_id,))

            military = None
            if mcomp:
                mil = await mcomp.get_military(nation_id)
                if mil:
                    military = mil

            treaties = await db.fetchalldict(
                "SELECT * FROM treaties WHERE (proposer_nation_id=? OR target_nation_id=?) AND status != 'REJECTED' ORDER BY created_at DESC",
                (nation_id, nation_id))

            alliance = None
            alliance_members = []
            ally_id = nation.get("alliance_id")
            if ally_id:
                arow = await db.fetchdict("SELECT * FROM alliances WHERE alliance_id=?", (ally_id,))
                if arow:
                    members = await db.fetchalldict(
                        "SELECT am.nation_id, n.nation_name, n.score, am.role FROM alliance_members am JOIN nations n ON n.nation_id=am.nation_id WHERE am.alliance_id=? ORDER BY n.score DESC",
                        (ally_id,))
                    my_role_row = await db.fetchonedict(
                        "SELECT role FROM alliance_members WHERE alliance_id=? AND nation_id=?", (ally_id, nation_id))
                    my_role = (my_role_row.get("role") if my_role_row else None) or nation.get("alliance_role") or "member"
                    total_score = sum(m.get("score", 0) or 0 for m in members)
                    alliance = {
                        "alliance_id": arow.get("alliance_id"),
                        "name": arow.get("alliance_name"),
                        "acronym": arow.get("acronym") or "",
                        "score": total_score,
                        "member_count": len(members),
                        "treasury": arow.get("treasury", 0),
                        "my_role": my_role,
                    }
                    alliance_members = members

            return {
                "nation": nation,
                "cities": cities,
                "resources": resources,
                "military": military,
                "treaties": treaties,
                "alliance": alliance,
                "alliance_members": alliance_members,
            }

        @router.post("/api/web/user/create-nation")
        async def create_user_nation(request: Request):
            session = await self._get_session(request)
            if not session:
                raise HTTPException(401, "Not authenticated")
            user = await self.auth.get_user(session)

            # Check if already has a nation
            existing = await self.auth.get_user_nation(user["id"])
            if existing:
                raise HTTPException(400, "You already have an empire")

            body = await request.json()
            nation_name = body.get("nation_name", "").strip()
            ruler_name = body.get("ruler_name", "").strip()
            capital = body.get("capital_city_name", "").strip()
            gov_type = body.get("government_type", "DEMOCRACY")
            religion_type = body.get("religion_type")
            resource_1 = body.get("resource_1", "GRAIN")
            war_policy_type = body.get("war_policy_type", "NEUTRAL")
            domestic_policy_type = body.get("domestic_policy_type", "BALANCED")
            color = body.get("national_color", "BLUE")

            if not nation_name or not ruler_name:
                raise HTTPException(400, "Empire name and ruler name required")
            if len(nation_name) < 3 or len(nation_name) > 32:
                raise HTTPException(400, "Empire name must be 3-32 characters")

            # Validate game data types against enums
            try:
                GovernmentType[gov_type]
            except KeyError:
                raise HTTPException(400, f"Invalid government type: {gov_type}")
            try:
                WarPolicyType[war_policy_type]
            except KeyError:
                raise HTTPException(400, f"Invalid war policy type: {war_policy_type}")
            try:
                DomesticPolicyType[domestic_policy_type]
            except KeyError:
                raise HTTPException(400, f"Invalid domestic policy type: {domestic_policy_type}")
            try:
                ResourceType[resource_1]
            except KeyError:
                raise HTTPException(400, f"Invalid resource type: {resource_1}")
            if religion_type:
                try:
                    GovRelReligionType[religion_type]
                except KeyError:
                    raise HTTPException(400, f"Invalid religion type: {religion_type}")

            comp = self.gpp.get_component("nation_city")
            if not comp:
                raise HTTPException(503, "Nation system unavailable")

            import uuid
            nation_id = str(uuid.uuid4())
            created = await comp.create_nation({
                "nation_id": nation_id,
                "nation_name": nation_name,
                "ruler_name": ruler_name,
                "capital_city_name": capital or "Capital",
                "national_color": color,
                "government_type": gov_type,
                "religion_type": religion_type,
                "resource_1": resource_1,
                "war_policy_type": war_policy_type,
                "domestic_policy_type": domestic_policy_type,
            })

            bound = await self.auth.bind_nation(user["id"], nation_id, nation_name)
            if not bound:
                # Shouldn't happen but clean up
                raise HTTPException(500, "Failed to bind empire to account")

            return {"message": "Empire created", "nation": created}

        # ---------- Permission-Checked Admin Routes ----------
        async def _require_perm(request: Request, perm: str):
            session = await self._get_session(request)
            if not session:
                raise HTTPException(401, "Not authenticated")
            user = await self.auth.get_user(session)
            if not user:
                raise HTTPException(401, "Not authenticated")
            perms = user.get("permissions", {})
            if not perms.get(perm):
                raise HTTPException(403, f"Missing permission: {perm}")
            return user

        @router.get("/api/admin/users")
        async def admin_users(request: Request):
            await _require_perm(request, "can_view_users")
            return await self.auth.list_users()

        @router.get("/api/admin/users/{user_id}")
        async def admin_user_detail(request: Request, user_id: str):
            await _require_perm(request, "can_view_users")
            user = await self.auth.get_full_user(user_id)
            if not user:
                raise HTTPException(404, "User not found")
            return user

        @router.post("/api/admin/users/{user_id}/ban")
        async def admin_ban_user(request: Request, user_id: str):
            await _require_perm(request, "can_ban_users")
            body = await request.json()
            reason = body.get("reason", "")
            await self.auth.ban_user(user_id, reason)
            return {"message": "User banned", "user_id": user_id}

        @router.post("/api/admin/users/{user_id}/unban")
        async def admin_unban_user(request: Request, user_id: str):
            await _require_perm(request, "can_ban_users")
            await self.auth.unban_user(user_id)
            return {"message": "User unbanned", "user_id": user_id}

        @router.delete("/api/admin/users/{user_id}")
        async def admin_delete_user(request: Request, user_id: str):
            admin = await _require_perm(request, "can_delete_users")
            if admin["id"] == user_id:
                raise HTTPException(400, "Cannot delete yourself")
            await self.auth.delete_user(user_id)
            return {"message": "User deleted", "user_id": user_id}

        @router.get("/api/admin/flags")
        async def admin_flags(request: Request):
            await _require_perm(request, "can_view_flags")
            return await self.auth.get_flags()

        @router.post("/api/admin/tick")
        async def admin_force_tick(request: Request):
            await _require_perm(request, "can_force_tick")
            tick = self.gpp.get_component("tick")
            if tick and hasattr(tick, 'force_tick'):
                await tick.force_tick()
                return {"message": "Tick forced"}
            raise HTTPException(503, "Tick system unavailable")

        @router.post("/api/admin/reset")
        async def admin_reset(request: Request):
            await _require_perm(request, "can_reset_game")
            body = await request.json()
            confirm = body.get("confirm", "")
            if confirm != "RESET":
                raise HTTPException(400, "Must send confirm='RESET' to proceed")
            db = self.gpp.db
            tables = ["nations", "alliances", "wars", "cities", "user_nations", "trade_circles"]
            for t in tables:
                try:
                    await db.execute(f"DELETE FROM {t}")
                except Exception:
                    pass
            return {"message": "Game data reset"}

        # ---------- Role / Permission Management ----------
        @router.get("/api/admin/roles")
        async def admin_list_roles(request: Request):
            await _require_perm(request, "can_manage_permissions")
            return await self.auth.list_roles()

        @router.get("/api/admin/users/{user_id}/permissions")
        async def admin_get_permissions(request: Request, user_id: str):
            await _require_perm(request, "can_manage_permissions")
            perms = await self.auth.get_permissions(user_id)
            if not perms:
                raise HTTPException(404, "User not found")
            return perms

        @router.post("/api/admin/users/{user_id}/set-role")
        async def admin_set_role(request: Request, user_id: str):
            await _require_perm(request, "can_manage_permissions")
            body = await request.json()
            role = body.get("role", "")
            ok = await self.auth.set_role(user_id, role)
            if not ok:
                raise HTTPException(400, f"Invalid role '{role}'")
            return {"message": f"Role set to {role}", "user_id": user_id}

        @router.post("/api/admin/users/{user_id}/set-permissions")
        async def admin_set_permissions(request: Request, user_id: str):
            await _require_perm(request, "can_manage_permissions")
            body = await request.json()
            perms = {k: v for k, v in body.items() if k.startswith("can_")}
            ok = await self.auth.set_permissions(user_id, perms)
            if not ok:
                raise HTTPException(400, "No valid permissions provided")
            return {"message": "Permissions updated", "user_id": user_id}

        @router.get("/api/admin/health")
        async def admin_health(request: Request):
            await _require_perm(request, "can_view_health")
            return await self.gpp.health_check()

        # ---------- Game Data API Routes ----------
        @router.get("/api/web/nations")
        async def web_nations(request: Request):
            comp = self.gpp.get_component("nation_city")
            if not comp:
                raise HTTPException(503, "Nation component unavailable")
            return await comp.get_all()

        @router.get("/api/web/nations/{nation_id}")
        async def web_nation_detail(request: Request, nation_id: str):
            comp = self.gpp.get_component("nation_city")
            if not comp:
                raise HTTPException(503, "Nation component unavailable")
            nation = await comp.get_nation_by_id(nation_id)
            if not nation:
                raise HTTPException(404, "Nation not found")
            return nation

        @router.get("/api/web/nations/{nation_id}/cities")
        async def web_nation_cities(request: Request, nation_id: str):
            comp = self.gpp.get_component("nation_city")
            if not comp:
                raise HTTPException(503, "Nation component unavailable")
            return await comp.get_nation_cities(nation_id)

        @router.get("/api/web/alliances")
        async def web_alliances(request: Request):
            comp = self.gpp.get_component("alliance")
            if not comp:
                raise HTTPException(503, "Alliance component unavailable")
            return await comp.get_all()

        @router.get("/api/web/alliances/{alliance_id}")
        async def web_alliance_detail(request: Request, alliance_id: str):
            comp = self.gpp.get_component("alliance")
            if not comp:
                raise HTTPException(503, "Alliance component unavailable")
            alliance = await comp.get_by_id(alliance_id)
            if not alliance:
                raise HTTPException(404, "Alliance not found")
            return alliance

        @router.get("/api/web/wars")
        async def web_wars(request: Request):
            comp = self.gpp.get_component("military_war")
            if not comp:
                raise HTTPException(503, "War component unavailable")
            return await comp.get_all()

        @router.get("/api/web/rankings")
        async def web_rankings(request: Request):
            """Return all nations sorted by score for the rankings page"""
            comp = self.gpp.get_component("nation_city")
            if comp:
                nations = await comp.get_all()
            else:
                db = self.gpp.db
                nations = await db.fetchalldict("SELECT * FROM nations ORDER BY score DESC NULLS LAST") or []
            return nations or []

        @router.get("/api/web/game-data")
        async def web_game_data():
            """Return all game configuration data for the empire creation UI."""
            gov_sys = GovernmentSystem()
            dom_sys = DomesticPolicySystem()
            war_sys = WarPolicySystem()
            rel_sys = ReligionSystem()
            res_sys = ResourceSystem()

            def fmt_gov(g):
                d = asdict(g)
                d.pop("is_forced", None)
                return d

            governments = {}
            for gt, gov in gov_sys.governments.items():
                if not gov.is_forced:
                    d = fmt_gov(gov)
                    d["enum_name"] = gt.name
                    governments[gt.name] = d

            domestic_policies = {}
            for pt, pol in dom_sys.policies.items():
                d = asdict(pol)
                d["enum_name"] = pt.name
                domestic_policies[pt.name] = d

            war_policies = {}
            for pt, pol in war_sys.policies.items():
                d = asdict(pol)
                d["enum_name"] = pt.name
                war_policies[pt.name] = d

            religions = {}
            for rt, rel in rel_sys.religions.items():
                d = asdict(rel)
                d["enum_name"] = rt.name
                religions[rt.name] = d

            resources = {}
            for rt, res in res_sys.resources.items():
                d = asdict(res)
                d["enum_name"] = rt.name
                resources[rt.name] = d

            return {
                "governments": governments,
                "domestic_policies": domestic_policies,
                "war_policies": war_policies,
                "religions": religions,
                "resources": resources,
            }

        @router.get("/api/web/stats")
        async def web_stats(request: Request):
            db = self.gpp.db
            nations = await db.get_all_nations()
            alliances = await db.get_all_alliances()
            wars_data = await db.fetchalldict("SELECT COUNT(*) as count FROM wars WHERE status = 'active'")
            active_wars = wars_data[0]['count'] if wars_data else 0
            return {
                "total_nations": len(nations),
                "total_alliances": len(alliances),
                "active_wars": active_wars,
                "gpp_running": self.gpp.is_running,
                "current_tick": 0,
                "version": "1.0.0",
            }

        @router.get("/api/web/nations/{nation_id}/military")
        async def web_nation_military(request: Request, nation_id: str):
            comp = self.gpp.get_component("military_war")
            if not comp:
                raise HTTPException(503, "Military component unavailable")
            mil = await comp.get_military(nation_id)
            return mil or {}

        @router.get("/api/web/nations/{nation_id}/wars")
        async def web_nation_wars(request: Request, nation_id: str):
            comp = self.gpp.get_component("military_war")
            if not comp:
                raise HTTPException(503, "War component unavailable")
            return await comp.get_wars_for_nation(nation_id)

        @router.get("/api/web/nations/{nation_id}/resources")
        async def web_nation_resources(request: Request, nation_id: str):
            db = self.gpp.db
            rows = await db.fetchalldict("SELECT * FROM nation_resources WHERE nation_id=?", (nation_id,))
            resources = {}
            for row in rows:
                rt = row["resource_type"]
                resources[rt] = {
                    "amount": row["amount"],
                    "capacity": 50000,
                    "production": row["production_rate"],
                }
            # Add nation cash
            nation = await db.fetchdict("SELECT cash, resource_1, resource_2 FROM nations WHERE nation_id=?", (nation_id,))
            if nation:
                resources["CASH"] = {"amount": float(nation.get("cash", 0)), "capacity": 1e9, "production": 0}
            return resources

        @router.get("/api/web/nations/{nation_id}/treaties")
        async def web_nation_treaties(request: Request, nation_id: str):
            db = self.gpp.db
            rows = await db.fetchalldict(
                """SELECT t.*,
                    na.nation_name as party_a_name,
                    nb.nation_name as party_b_name
                   FROM treaties t
                   LEFT JOIN nations na ON na.nation_id = t.party_a_id
                   LEFT JOIN nations nb ON nb.nation_id = t.party_b_id
                   WHERE t.party_a_id = ? OR t.party_b_id = ?
                   ORDER BY t.created_at DESC""",
                (nation_id, nation_id)
            )
            return rows or []

        @router.get("/api/web/alliances/{alliance_id}/members")
        async def web_alliance_members(request: Request, alliance_id: str):
            comp = self.gpp.get_component("alliance")
            if not comp:
                raise HTTPException(503, "Alliance component unavailable")
            return await comp.get_alliance_members(alliance_id)

        @router.get("/api/web/wars/{war_id}")
        async def web_war_detail(request: Request, war_id: str):
            comp = self.gpp.get_component("military_war")
            if not comp:
                raise HTTPException(503, "War component unavailable")
            war = await comp.get_war(war_id)
            if not war:
                raise HTTPException(404, "War not found")
            return war

        @router.get("/api/web/health")
        async def web_health(request: Request):
            return await self.gpp.health_check()

        # ---------- Game Action API Routes ----------
        async def _require_nation_owner(request: Request):
            session = await self._get_session(request)
            if not session:
                raise HTTPException(401, "Not authenticated")
            user = await self.auth.get_user(session)
            nation = await self.auth.get_user_nation(user["id"])
            if not nation:
                raise HTTPException(400, "You must have an empire to do that")
            return user, nation

        @router.post("/api/web/wars/declare")
        async def web_declare_war(request: Request):
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            defender_id = body.get("defender_id", "").strip()
            reason = body.get("reason", "")
            if not defender_id:
                raise HTTPException(400, "Target nation ID required")
            if defender_id == my_nation["nation_id"]:
                raise HTTPException(400, "Cannot declare war on yourself")
            comp = self.gpp.get_component("military_war")
            import uuid
            war = await comp.create_war({
                "war_id": str(uuid.uuid4()),
                "attacker_id": my_nation["nation_id"],
                "defender_id": defender_id,
                "status": "active",
                "reason": reason,
            })
            return {"message": "War declared", "war": war}

        @router.post("/api/web/wars/{war_id}/attack")
        async def web_attack(request: Request, war_id: str):
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            attack_type = body.get("attack_type", "GROUND")
            comp = self.gpp.get_component("military_war")
            result = await comp.process_war_attack(war_id, my_nation["nation_id"], attack_type)
            return {"message": "Attack processed", "result": result}

        @router.post("/api/web/alliances/create")
        async def web_create_alliance(request: Request):
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            name = body.get("name", "").strip()
            if not name or len(name) < 3:
                raise HTTPException(400, "Alliance name must be at least 3 characters")
            comp = self.gpp.get_component("alliance")
            import uuid
            alliance = await comp.create_alliance({
                "alliance_id": str(uuid.uuid4()),
                "alliance_name": name,
                "leader_nation_id": my_nation["nation_id"],
            })
            return {"message": "Alliance created", "alliance": alliance}

        @router.post("/api/web/alliances/{alliance_id}/join")
        async def web_join_alliance(request: Request, alliance_id: str):
            user, my_nation = await _require_nation_owner(request)
            comp = self.gpp.get_component("alliance")
            alliance = await comp.get_by_id(alliance_id)
            if not alliance:
                raise HTTPException(404, "Alliance not found")
            # Add via DB directly - update nation's alliance_id
            nc = self.gpp.get_component("nation_city")
            await nc.update_nation(my_nation["nation_id"], {
                "alliance_id": alliance_id,
                "alliance_role": "MEMBER",
            })
            return {"message": "Joined alliance"}

        @router.post("/api/web/alliances/{alliance_id}/leave")
        async def web_leave_alliance(request: Request, alliance_id: str):
            user, my_nation = await _require_nation_owner(request)
            nc = self.gpp.get_component("nation_city")
            await nc.update_nation(my_nation["nation_id"], {
                "alliance_id": None,
                "alliance_role": None,
            })
            return {"message": "Left alliance"}

        @router.post("/api/web/market/listings/create")
        async def web_create_listing(request: Request):
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            resource = body.get("resource_type", "").upper()
            amount = float(body.get("amount", 0))
            price = float(body.get("price", 0))
            if not resource or amount <= 0 or price <= 0:
                raise HTTPException(400, "Valid resource, amount, and price required")
            db = self.gpp.db
            import uuid
            await db.execute(
                "INSERT INTO market_listings (listing_id, seller_id, resource_type, amount, price_per_unit, status) VALUES (?, ?, ?, ?, ?, 'active')",
                (str(uuid.uuid4()), my_nation["nation_id"], resource, amount, price)
            )
            return {"message": "Listing created"}

        @router.post("/api/web/market/listings/{listing_id}/buy")
        async def web_buy_listing(request: Request, listing_id: str):
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            quantity = int(body.get("quantity", 0))
            if quantity <= 0:
                raise HTTPException(400, "Valid quantity required")
            db = self.gpp.db
            listing = await db.fetchone(
                "SELECT * FROM market_listings WHERE listing_id = ? AND status = 'active'",
                (listing_id,)
            )
            if not listing:
                raise HTTPException(404, "Listing not found")
            if listing[1] == my_nation["nation_id"]:
                raise HTTPException(400, "Cannot buy your own listing")
            max_qty = min(quantity, listing[4])
            cost = max_qty * listing[5]
            nc = self.gpp.get_component("nation_city")
            seller = await nc.get_nation_by_id(listing[1])
            if seller and seller.get("cash", 0) < cost:
                raise HTTPException(400, "Seller does not exist")
            seller_nation_id = listing[1]
            # Transfer funds (simplified)
            await db.execute("UPDATE nations SET cash = cash - ? WHERE nation_id = ?", (cost, my_nation["nation_id"]))
            await db.execute("UPDATE nations SET cash = cash + ? WHERE nation_id = ?", (cost, seller_nation_id))
            remaining = listing[4] - max_qty
            if remaining <= 0:
                await db.execute("UPDATE market_listings SET amount = 0, status = 'sold' WHERE listing_id = ?", (listing_id,))
            else:
                await db.execute("UPDATE market_listings SET amount = ? WHERE listing_id = ?", (remaining, listing_id))
            return {"message": f"Purchased {max_qty} units", "quantity": max_qty, "cost": cost}

        @router.post("/api/web/trade/circles/create")
        async def web_create_trade_circle(request: Request):
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            name = body.get("name", "").strip()
            resource = body.get("resource_type", "").upper()
            if not name or not resource:
                raise HTTPException(400, "Circle name and resource type required")
            db = self.gpp.db
            import uuid
            circle_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO trade_circles (circle_id, circle_name, resource_type, creator_id) VALUES (?, ?, ?, ?)",
                (circle_id, name, resource, my_nation["nation_id"])
            )
            await db.execute(
                "INSERT INTO circle_members (circle_id, nation_id) VALUES (?, ?)",
                (circle_id, my_nation["nation_id"])
            )
            return {"message": "Trade circle created", "circle_id": circle_id}

        @router.post("/api/web/trade/circles/{circle_id}/join")
        async def web_join_trade_circle(request: Request, circle_id: str):
            user, my_nation = await _require_nation_owner(request)
            db = self.gpp.db
            existing = await db.fetchone(
                "SELECT * FROM circle_members WHERE circle_id = ? AND nation_id = ?",
                (circle_id, my_nation["nation_id"])
            )
            if existing:
                return {"message": "Already a member"}
            await db.execute(
                "INSERT INTO circle_members (circle_id, nation_id) VALUES (?, ?)",
                (circle_id, my_nation["nation_id"])
            )
            return {"message": "Joined trade circle"}

        @router.post("/api/web/trade/circles/{circle_id}/leave")
        async def web_leave_trade_circle(request: Request, circle_id: str):
            user, my_nation = await _require_nation_owner(request)
            db = self.gpp.db
            await db.execute(
                "DELETE FROM circle_members WHERE circle_id = ? AND nation_id = ?",
                (circle_id, my_nation["nation_id"])
            )
            return {"message": "Left trade circle"}

        @router.get("/api/web/trade/circles/{circle_id}/members")
        async def web_trade_circle_members(request: Request, circle_id: str):
            db = self.gpp.db
            return await db.fetchalldict(
                "SELECT cm.nation_id, n.nation_name FROM circle_members cm LEFT JOIN nations n ON n.nation_id = cm.nation_id WHERE cm.circle_id = ?",
                (circle_id,)
            )

        @router.get("/api/web/market/listings")
        async def web_market_listings(request: Request):
            db = self.gpp.db
            return await db.fetchalldict(
                "SELECT l.*, n.nation_name as seller_name FROM market_listings l LEFT JOIN nations n ON n.nation_id = l.seller_id WHERE l.status = 'active' ORDER BY l.created_at DESC"
            )

        @router.get("/api/web/trade/circles")
        async def web_trade_circles(request: Request):
            db = self.gpp.db
            return await db.fetchalldict(
                "SELECT c.*, (SELECT COUNT(*) FROM circle_members WHERE circle_id = c.circle_id) as member_count FROM trade_circles c ORDER BY c.created_at DESC"
            )

        # ---------- New Feature API Routes ----------
        
        @router.get("/api/web/user/resources")
        async def user_resources(request: Request):
            """Get user's resources from DB"""
            session = await self._get_session(request)
            if not session:
                raise HTTPException(401, "Not authenticated")
            user = await self.auth.get_user(session)
            nation_ref = await self.auth.get_user_nation(user["id"])
            if not nation_ref:
                return {"resources": {}}
            nation_id = nation_ref["nation_id"]
            db = self.gpp.db
            # Get full nation for cash/income
            nc = self.gpp.get_component("nation_city")
            nation = (await nc.get_nation_by_id(nation_id)) if nc else await db.fetchdict("SELECT * FROM nations WHERE nation_id=?", (nation_id,))
            if not nation:
                return {"resources": {}}
            # Get stored resource rows
            rows = await db.fetchalldict("SELECT * FROM nation_resources WHERE nation_id=?", (nation_id,))
            resources = {}
            for row in rows:
                rt = row["resource_type"]
                resources[rt] = {
                    "amount": row["amount"],
                    "capacity": 50000,
                    "production": row["production_rate"],
                }
            # Always add CASH — use real formula from Logic/formulas.py
            population = float(nation.get("total_population", 0))
            citizen_income = float(nation.get("citizen_income", 5))
            tax_rate = float(nation.get("tax_rate", 0.30))
            happiness = int(nation.get("happiness", 5))
            literacy = float(nation.get("literacy_rate", 50))
            income = calculate_tax_income(population, citizen_income, happiness, tax_rate, literacy)
            resources["CASH"] = {
                "amount": float(nation.get("cash", 0)),
                "capacity": 1e9,
                "production": round(income, 2),
            }
            # Add primary resource if no rows yet
            r1 = nation.get("resource_1", "GRAIN")
            if r1 and r1 not in resources:
                resources[r1] = {"amount": 0, "capacity": 50000, "production": 0}
            r2 = nation.get("resource_2")
            if r2 and r2 not in resources:
                resources[r2] = {"amount": 0, "capacity": 50000, "production": 0}
            return {"resources": resources}

        @router.get("/api/web/user/cities")
        async def user_cities(request: Request):
            """Get user's cities"""
            session = await self._get_session(request)
            if not session:
                raise HTTPException(401, "Not authenticated")
            user = await self.auth.get_user(session)
            nation = await self.auth.get_user_nation(user["id"])
            if not nation:
                return {"cities": []}
            comp = self.gpp.get_component("nation_city")
            if comp:
                cities = await comp.get_cities_for_nation(nation["nation_id"])
                return {"cities": cities}
            # Demo cities
            return {
                "cities": [
                    {"city_id": "demo-1", "city_name": nation.get("capital_city_name", "Capital"), "infrastructure": 1000, "land": 1000, "population": 10000, "is_capital": True, "happiness": 50, "environment": 50}
                ]
            }

        @router.post("/api/web/city/infra")
        async def city_infra_action(request: Request):
            """Buy/sell infrastructure in a city — uses real formula from Logic/formulas.py"""
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            city_id = body.get("city_id")
            action = body.get("action", "buy")
            amount = int(body.get("amount", 1))
            
            nc = self.gpp.get_component("nation_city")
            db = self.gpp.db
            
            # Get current infra for cost calculation
            current_infra = 0
            city_count = 1
            if city_id:
                city_row = await db.fetchdict("SELECT infrastructure, city_id FROM cities WHERE city_id=?", (city_id,))
                if city_row:
                    current_infra = city_row.get("infrastructure", 0) or 0
                city_count_row = await db.fetchdict("SELECT COUNT(*) as cnt FROM cities WHERE nation_id=?", (my_nation["nation_id"],))
                city_count = max(1, city_count_row.get("cnt", 1) if city_count_row else 1)
            
            if action == "buy":
                # Calculate real cost using the formula from formulas.py
                # Cost = $10,000 * (level / 100)^2.5 * city_count
                cost_per = calculate_infrastructure_cost(max(current_infra, 100), city_count)
                cost = cost_per * amount
                if my_nation.get("cash", 0) < cost:
                    raise HTTPException(400, f"Not enough cash. Need ${cost:,.0f}, have ${float(my_nation.get('cash', 0)):,.0f}")
                if nc:
                    await nc.update_nation(my_nation["nation_id"], {"cash": my_nation.get("cash", 0) - cost})
                else:
                    await db.execute("UPDATE nations SET cash = cash - ? WHERE nation_id = ?", (cost, my_nation["nation_id"]))
                if city_id:
                    await db.execute("UPDATE cities SET infrastructure = infrastructure + ? WHERE city_id = ?", (amount, city_id))
                return {"success": True, "message": f"Bought {amount} infrastructure", "cost": cost, "cost_per_unit": cost_per}
            else:
                # Sell at 50% of current market value
                cost_per = calculate_infrastructure_cost(max(current_infra, 100), city_count)
                sell_value = (cost_per * 0.5) * amount
                if nc:
                    await nc.update_nation(my_nation["nation_id"], {"cash": my_nation.get("cash", 0) + sell_value})
                else:
                    await db.execute("UPDATE nations SET cash = cash + ? WHERE nation_id = ?", (sell_value, my_nation["nation_id"]))
                if city_id:
                    await db.execute("UPDATE cities SET infrastructure = MAX(0, infrastructure - ?) WHERE city_id = ?", (amount, city_id))
                return {"success": True, "message": f"Sold {amount} infrastructure", "refund": sell_value}

        @router.post("/api/web/city/land")
        async def city_land_action(request: Request):
            """Buy/sell land in a city — uses real formula from Logic/formulas.py"""
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            city_id = body.get("city_id")
            action = body.get("action", "buy")
            amount = int(body.get("amount", 1))
            
            nc = self.gpp.get_component("nation_city")
            db = self.gpp.db
            
            # Get current land for cost calculation
            current_land = 0
            city_count = 1
            if city_id:
                city_row = await db.fetchdict("SELECT land, city_id FROM cities WHERE city_id=?", (city_id,))
                if city_row:
                    current_land = city_row.get("land", 0) or 0
                city_count_row = await db.fetchdict("SELECT COUNT(*) as cnt FROM cities WHERE nation_id=?", (my_nation["nation_id"],))
                city_count = max(1, city_count_row.get("cnt", 1) if city_count_row else 1)
            
            if action == "buy":
                # Calculate real cost using the formula from formulas.py
                # Cost = $10,000 * (level / 100)^2.5 * city_count
                cost_per = calculate_land_cost(max(current_land, 100), city_count)
                cost = cost_per * amount
                if my_nation.get("cash", 0) < cost:
                    raise HTTPException(400, f"Not enough cash. Need ${cost:,.0f}, have ${float(my_nation.get('cash', 0)):,.0f}")
                if nc:
                    await nc.update_nation(my_nation["nation_id"], {"cash": my_nation.get("cash", 0) - cost})
                else:
                    await db.execute("UPDATE nations SET cash = cash - ? WHERE nation_id = ?", (cost, my_nation["nation_id"]))
                if city_id:
                    await db.execute("UPDATE cities SET land = land + ? WHERE city_id = ?", (amount, city_id))
                return {"success": True, "message": f"Bought {amount} land", "cost": cost, "cost_per_unit": cost_per}
            else:
                # Sell at 50% of current market value
                cost_per = calculate_land_cost(max(current_land, 100), city_count)
                sell_value = (cost_per * 0.5) * amount
                if nc:
                    await nc.update_nation(my_nation["nation_id"], {"cash": my_nation.get("cash", 0) + sell_value})
                else:
                    await db.execute("UPDATE nations SET cash = cash + ? WHERE nation_id = ?", (sell_value, my_nation["nation_id"]))
                if city_id:
                    await db.execute("UPDATE cities SET land = MAX(0, land - ?) WHERE city_id = ?", (amount, city_id))
                return {"success": True, "message": f"Sold {amount} land", "refund": sell_value}

        @router.get("/api/web/market/prices")
        async def market_prices(request: Request):
            """Get current market prices"""
            return {
                "prices": {
                    "GRAIN": 10, "TIMBER": 15, "FISH": 12, "LIVESTOCK": 18,
                    "COAL": 25, "IRON": 35, "COPPER": 30, "LIMESTONE": 20,
                    "OIL": 50, "LEAD": 40, "SPICES": 60, "GOLD": 100,
                    "GEMSTONES": 200, "TITANIUM": 150, "URANIUM": 500
                }
            }

        @router.get("/api/web/market/history")
        async def market_history(request: Request):
            """Get market price history"""
            resource_type = request.query_params.get("resource_type")
            return {"history": []}

        @router.get("/api/web/market/orders")
        async def market_orders(request: Request):
            """Get user's market orders"""
            user, my_nation = await _require_nation_owner(request)
            return {"orders": []}

        @router.post("/api/web/market/order")
        async def create_market_order(request: Request):
            """Create a buy/sell order"""
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            resource = body.get("resource")
            side = body.get("side")
            amount = body.get("amount")
            price = body.get("price")
            return {"success": True, "message": "Order placed"}

        @router.get("/api/web/treaties")
        async def user_treaties(request: Request):
            """Get treaties for the current user's nation"""
            session = await self._get_session(request)
            if not session:
                return []
            user = await self.auth.get_user(session)
            nation = await self.auth.get_user_nation(user["id"])
            if not nation:
                return []
            db = self.gpp.db
            rows = await db.fetchalldict(
                """SELECT t.*,
                    na.nation_name as party_a_name,
                    nb.nation_name as party_b_name
                   FROM treaties t
                   LEFT JOIN nations na ON na.nation_id = t.party_a_id
                   LEFT JOIN nations nb ON nb.nation_id = t.party_b_id
                   WHERE t.party_a_id = ? OR t.party_b_id = ?
                   ORDER BY t.created_at DESC""",
                (nation["nation_id"], nation["nation_id"])
            )
            return rows or []

        @router.post("/api/web/treaties/propose")
        async def propose_treaty(request: Request):
            """Propose a new treaty"""
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            target_id    = body.get("target_id", "")
            treaty_type  = body.get("treaty_type", "nap")
            duration_days = int(body.get("duration_days", 30))
            terms        = body.get("terms", "")
            if not target_id:
                raise HTTPException(400, "target_id required")
            import uuid
            from datetime import datetime, timedelta
            treaty_id = str(uuid.uuid4())
            expires_at = (datetime.utcnow() + timedelta(days=duration_days)).isoformat() if duration_days > 0 else None
            db = self.gpp.db
            await db.execute(
                "INSERT INTO treaties (treaty_id, party_a_id, party_b_id, treaty_type, status, terms, expires_at) VALUES (?,?,?,?,?,?,?)",
                (treaty_id, my_nation["nation_id"], target_id, treaty_type, "pending", terms, expires_at)
            )
            return {"success": True, "message": "Treaty proposed", "treaty_id": treaty_id}

        @router.post("/api/web/treaties/{treaty_id}/accept")
        async def accept_treaty(request: Request, treaty_id: str):
            user, my_nation = await _require_nation_owner(request)
            db = self.gpp.db
            await db.execute(
                "UPDATE treaties SET status='active' WHERE treaty_id=? AND party_b_id=?",
                (treaty_id, my_nation["nation_id"])
            )
            return {"success": True}

        @router.post("/api/web/treaties/{treaty_id}/reject")
        async def reject_treaty(request: Request, treaty_id: str):
            user, my_nation = await _require_nation_owner(request)
            db = self.gpp.db
            await db.execute(
                "UPDATE treaties SET status='rejected' WHERE treaty_id=? AND (party_a_id=? OR party_b_id=?)",
                (treaty_id, my_nation["nation_id"], my_nation["nation_id"])
            )
            return {"success": True}

        @router.post("/api/web/treaties/{treaty_id}/terminate")
        async def terminate_treaty(request: Request, treaty_id: str):
            user, my_nation = await _require_nation_owner(request)
            db = self.gpp.db
            await db.execute(
                "UPDATE treaties SET status='terminated' WHERE treaty_id=? AND (party_a_id=? OR party_b_id=?)",
                (treaty_id, my_nation["nation_id"], my_nation["nation_id"])
            )
            return {"success": True}

        @router.get("/api/web/diplomatic-relations")
        async def diplomatic_relations(request: Request):
            """Get diplomatic relations"""
            return {"relations": []}

        @router.get("/api/web/spy/history")
        async def spy_history(request: Request):
            """Get spy operation history for current nation"""
            session = await self._get_session(request)
            if not session:
                return []
            user = await self.auth.get_user(session)
            nation = await self.auth.get_user_nation(user["id"])
            if not nation:
                return []
            db = self.gpp.db
            rows = await db.fetchalldict(
                """SELECT s.*, n.nation_name as target_name
                   FROM spy_operations s
                   LEFT JOIN nations n ON n.nation_id = s.target_nation_id
                   WHERE s.spy_nation_id = ?
                   ORDER BY s.created_at DESC LIMIT 50""",
                (nation["nation_id"],)
            )
            return rows or []

        @router.post("/api/web/spy/operation")
        async def launch_spy_operation(request: Request):
            """Launch a spy operation â€” records to DB"""
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            target_id      = body.get("target_id")
            operation_type = body.get("operation_type", "intel")
            if not target_id:
                raise HTTPException(400, "target_id required")
            import uuid, random
            op_id   = str(uuid.uuid4())
            success = random.random() < 0.65
            result  = "success" if success else "failure"
            db = self.gpp.db
            await db.execute(
                "INSERT INTO spy_operations (operation_id, spy_nation_id, target_nation_id, operation_type, result) VALUES (?,?,?,?,?)",
                (op_id, my_nation["nation_id"], target_id, operation_type, result)
            )
            return {"success": success, "result": result, "operation_id": op_id,
                    "message": f"Operation {'succeeded' if success else 'failed'}"}

        @router.get("/api/web/events")
        async def game_events(request: Request):
            """Get recent game events from DB"""
            db = self.gpp.db
            rows = await db.fetchalldict(
                """SELECT e.*, n.nation_name FROM events e
                   LEFT JOIN nations n ON n.nation_id = e.nation_id
                   ORDER BY e.created_at DESC LIMIT 100"""
            )
            return rows or []

        @router.get("/api/web/user/events")
        async def user_events(request: Request):
            """Get current user's nation events"""
            session = await self._get_session(request)
            if not session:
                return []
            user = await self.auth.get_user(session)
            nation = await self.auth.get_user_nation(user["id"])
            if not nation:
                return []
            db = self.gpp.db
            rows = await db.fetchalldict(
                "SELECT * FROM events WHERE nation_id=? ORDER BY created_at DESC LIMIT 50",
                (nation["nation_id"],)
            )
            return rows or []

        @router.get("/api/web/alliance/bank")
        async def alliance_bank(request: Request):
            """Get alliance bank info from DB"""
            user, my_nation = await _require_nation_owner(request)
            alliance_id = my_nation.get("alliance_id")
            if not alliance_id:
                raise HTTPException(400, "Not in an alliance")
            db = self.gpp.db
            alliance = await db.fetchdict("SELECT * FROM alliances WHERE alliance_id=?", (alliance_id,))
            if not alliance:
                raise HTTPException(404, "Alliance not found")
            treasury = float(alliance.get("treasury", 0) or 0)
            role = my_nation.get("alliance_role", "MEMBER")
            return {"treasury": treasury, "alliance": alliance, "user_role": role.lower() if role else "member"}

        @router.post("/api/web/alliance/bank/deposit")
        async def alliance_bank_deposit(request: Request):
            """Deposit cash to alliance bank"""
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            amount = float(body.get("amount", 0))
            if amount <= 0:
                raise HTTPException(400, "Amount must be positive")
            if float(my_nation.get("cash", 0)) < amount:
                raise HTTPException(400, "Not enough cash")
            alliance_id = my_nation.get("alliance_id")
            if not alliance_id:
                raise HTTPException(400, "Not in an alliance")
            db = self.gpp.db
            await db.execute("UPDATE nations SET cash = cash - ? WHERE nation_id=?", (amount, my_nation["nation_id"]))
            await db.execute("UPDATE alliances SET treasury = COALESCE(treasury,0) + ? WHERE alliance_id=?", (amount, alliance_id))
            import uuid as _uuid
            await db.execute(
                "INSERT OR IGNORE INTO alliance_transactions(tx_id,alliance_id,nation_id,tx_type,amount,note,created_at) VALUES(?,?,?,'deposit',?,?,CURRENT_TIMESTAMP)",
                (str(_uuid.uuid4()), alliance_id, my_nation["nation_id"], amount, body.get("note",""))
            )
            return {"success": True, "message": f"Deposited ${amount:,.0f}"}

        @router.post("/api/web/alliance/bank/withdraw")
        async def alliance_bank_withdraw(request: Request):
            """Withdraw cash from alliance bank"""
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            amount = float(body.get("amount", 0))
            if amount <= 0:
                raise HTTPException(400, "Amount must be positive")
            role = (my_nation.get("alliance_role") or "MEMBER").upper()
            if role not in ("LEADER", "OFFICER") and amount > 100000:
                raise HTTPException(403, "Members may only withdraw up to $100,000")
            alliance_id = my_nation.get("alliance_id")
            if not alliance_id:
                raise HTTPException(400, "Not in an alliance")
            db = self.gpp.db
            alliance = await db.fetchdict("SELECT treasury FROM alliances WHERE alliance_id=?", (alliance_id,))
            if not alliance or float(alliance.get("treasury", 0) or 0) < amount:
                raise HTTPException(400, "Insufficient alliance funds")
            await db.execute("UPDATE alliances SET treasury = treasury - ? WHERE alliance_id=?", (amount, alliance_id))
            await db.execute("UPDATE nations SET cash = cash + ? WHERE nation_id=?", (amount, my_nation["nation_id"]))
            import uuid as _uuid
            await db.execute(
                "INSERT OR IGNORE INTO alliance_transactions(tx_id,alliance_id,nation_id,tx_type,amount,note,created_at) VALUES(?,?,?,'withdraw',?,?,CURRENT_TIMESTAMP)",
                (str(_uuid.uuid4()), alliance_id, my_nation["nation_id"], amount, body.get("reason",""))
            )
            return {"success": True, "message": f"Withdrawn ${amount:,.0f}"}

        @router.get("/api/web/alliance/transactions")
        async def alliance_transactions(request: Request):
            """Get alliance transaction history"""
            user, my_nation = await _require_nation_owner(request)
            alliance_id = my_nation.get("alliance_id")
            if not alliance_id:
                return []
            db = self.gpp.db
            rows = await db.fetchalldict(
                "SELECT t.*, n.nation_name FROM alliance_transactions t LEFT JOIN nations n ON n.nation_id=t.nation_id WHERE t.alliance_id=? ORDER BY t.created_at DESC LIMIT 50",
                (alliance_id,)
            )
            return rows or []

        @router.get("/api/web/alliance/contributions")
        async def alliance_contributions(request: Request):
            """Get alliance member contribution totals"""
            user, my_nation = await _require_nation_owner(request)
            alliance_id = my_nation.get("alliance_id")
            if not alliance_id:
                return []
            db = self.gpp.db
            rows = await db.fetchalldict(
                """SELECT t.nation_id, n.nation_name,
                          SUM(CASE WHEN t.tx_type='deposit' THEN t.amount ELSE 0 END) as total_contributed,
                          MAX(t.created_at) as last_contribution
                   FROM alliance_transactions t
                   LEFT JOIN nations n ON n.nation_id=t.nation_id
                   WHERE t.alliance_id=? AND t.tx_type='deposit'
                   GROUP BY t.nation_id ORDER BY total_contributed DESC""",
                (alliance_id,)
            )
            return rows or []

        @router.get("/api/web/user/military")
        async def user_military(request: Request):
            """Get user's military data"""
            user, my_nation = await _require_nation_owner(request)
            comp = self.gpp.get_component("military_war")
            if comp:
                mil = await comp.get_military(my_nation["nation_id"])
                if mil:
                    return {"military": mil}
            # Fall back to DB direct query
            db = self.gpp.db
            mil_row = await db.fetchdict(
                "SELECT * FROM military WHERE nation_id = ?",
                (my_nation["nation_id"],)
            )
            if mil_row:
                return {"military": mil_row}
            return {
                "military": {
                    "soldiers": 0, "tanks": 0, "fighters": 0, "bombers": 0,
                    "destroyers": 0, "cruisers": 0, "battleships": 0,
                    "carriers": 0, "submarines": 0,
                    "cruise_missiles": 0, "nuclear_weapons": 0, "spies": 0,
                    "soldier_cap": 0, "tank_cap": 0, "aircraft_cap": 0,
                    "ship_cap": 0, "missile_cap": 0, "nuke_cap": 0, "spy_cap": 0
                }
            }

        @router.post("/api/web/military/buy")
        async def buy_military_unit(request: Request):
            """Purchase military units"""
            user, my_nation = await _require_nation_owner(request)
            body = await request.json()
            unit_type = body.get("unit_type", "").lower()
            amount = max(1, int(body.get("amount", 1)))

            # Real unit prices from Logic/military.py
            unit_price_map = {
                "soldiers": military_system.get_unit(MilitaryUnitType.SOLDIER).cost,
                "tanks": military_system.get_unit(MilitaryUnitType.TANK).cost,
                "fighters": military_system.get_unit(MilitaryUnitType.AIRCRAFT_FIGHTER).cost,
                "bombers": military_system.get_unit(MilitaryUnitType.AIRCRAFT_BOMBER).cost,
                "destroyers": military_system.get_unit(MilitaryUnitType.SHIP_DESTROYER).cost,
                "cruisers": military_system.get_unit(MilitaryUnitType.SHIP_CRUISER).cost,
                "battleships": military_system.get_unit(MilitaryUnitType.SHIP_BATTLESHIP).cost,
                "carriers": military_system.get_unit(MilitaryUnitType.SHIP_CARRIER).cost,
                "submarines": military_system.get_unit(MilitaryUnitType.SHIP_SUBMARINE).cost,
                "cruise_missiles": military_system.get_unit(MilitaryUnitType.CRUISE_MISSILE).cost,
                "nuclear_weapons": military_system.get_unit(MilitaryUnitType.NUCLEAR_WEAPON).cost,
                "spies": military_system.get_unit(MilitaryUnitType.SPY).cost,
            }
            cap_keys = {
                "soldiers": "soldier_cap", "tanks": "tank_cap",
                "fighters": "aircraft_cap", "bombers": "aircraft_cap",
                "destroyers": "ship_cap", "cruisers": "ship_cap",
                "battleships": "ship_cap", "carriers": "ship_cap",
                "submarines": "ship_cap", "cruise_missiles": "missile_cap",
                "nuclear_weapons": "nuke_cap", "spies": "spy_cap"
            }

            if unit_type not in unit_price_map:
                raise HTTPException(400, f"Unknown unit type: {unit_type}")

            price_per = unit_price_map[unit_type]
            total_cost = price_per * amount

            if my_nation.get("cash", 0) < total_cost:
                raise HTTPException(400, f"Not enough cash. Need ${total_cost:,.0f}")

            db = self.gpp.db
            mil_row = await db.fetchdict(
                "SELECT * FROM military WHERE nation_id = ?",
                (my_nation["nation_id"],)
            )
            if not mil_row:
                raise HTTPException(404, "Military record not found")

            cap_key = cap_keys[unit_type]
            current = mil_row.get(unit_type, 0) or 0
            cap = mil_row.get(cap_key, 0) or 0
            if cap > 0 and current + amount > cap:
                max_can_buy = max(0, cap - current)
                if max_can_buy == 0:
                    raise HTTPException(400, f"Unit cap reached ({cap})")
                amount = max_can_buy
                total_cost = price_per * amount

            # Deduct cash and add units
            nc = self.gpp.get_component("nation_city")
            if nc:
                await nc.update_nation(my_nation["nation_id"], {
                    "cash": my_nation["cash"] - total_cost
                })
            else:
                await db.execute(
                    "UPDATE nations SET cash = cash - ? WHERE nation_id = ?",
                    (total_cost, my_nation["nation_id"])
                )

            await db.execute(
                f"UPDATE military SET {unit_type} = {unit_type} + ? WHERE nation_id = ?",
                (amount, my_nation["nation_id"])
            )

            return {
                "success": True,
                "message": f"Purchased {amount:,} {unit_type}",
                "quantity": amount,
                "cost": total_cost,
                "new_cash": my_nation["cash"] - total_cost
            }

        @router.get("/api/web/military/prices")
        async def military_prices():
            """Return real unit prices from Logic/military.py"""
            return {
                "prices": {
                    "soldiers": military_system.get_unit(MilitaryUnitType.SOLDIER).cost,
                    "tanks": military_system.get_unit(MilitaryUnitType.TANK).cost,
                    "fighters": military_system.get_unit(MilitaryUnitType.AIRCRAFT_FIGHTER).cost,
                    "bombers": military_system.get_unit(MilitaryUnitType.AIRCRAFT_BOMBER).cost,
                    "destroyers": military_system.get_unit(MilitaryUnitType.SHIP_DESTROYER).cost,
                    "cruisers": military_system.get_unit(MilitaryUnitType.SHIP_CRUISER).cost,
                    "battleships": military_system.get_unit(MilitaryUnitType.SHIP_BATTLESHIP).cost,
                    "carriers": military_system.get_unit(MilitaryUnitType.SHIP_CARRIER).cost,
                    "submarines": military_system.get_unit(MilitaryUnitType.SHIP_SUBMARINE).cost,
                    "cruise_missiles": military_system.get_unit(MilitaryUnitType.CRUISE_MISSILE).cost,
                    "nuclear_weapons": military_system.get_unit(MilitaryUnitType.NUCLEAR_WEAPON).cost,
                    "spies": military_system.get_unit(MilitaryUnitType.SPY).cost,
                }
            }

        @router.get("/api/web/market/stats")
        async def market_stats(request: Request):
            """Get real market stats from DB"""
            db = self.gpp.db
            listings = await db.fetchdict(
                "SELECT COUNT(*) as cnt FROM market_listings WHERE status = 'active'"
            )
            listing_count = listings["cnt"] if listings else 0
            return {
                "active_listings": listing_count,
                "daily_volume": 0,
                "trades_today": 0,
                "resource_count": 15
            }

        # ---------- Notification Endpoints ----------
        @router.get("/api/web/notifications")
        async def get_notifications(request: Request):
            session = await self._get_session(request)
            if not session:
                return {"notifications": [], "unread_count": 0}
            user = await self.auth.get_user(session)
            nation = await self.auth.get_user_nation(user["id"])
            if not nation:
                return {"notifications": [], "unread_count": 0}
            db = self.gpp.db
            rows = await db.fetchalldict(
                "SELECT * FROM notifications WHERE nation_id=? ORDER BY created_at DESC LIMIT 50",
                (nation["nation_id"],)
            )
            unread = sum(1 for r in (rows or []) if not r.get("is_read"))
            return {"notifications": rows or [], "unread_count": unread}

        @router.post("/api/web/notifications/mark-read")
        async def mark_notification_read(request: Request):
            session = await self._get_session(request)
            if not session:
                return {"success": False}
            body = await request.json()
            notif_id = body.get("id")
            if notif_id:
                db = self.gpp.db
                await db.execute("UPDATE notifications SET is_read=1 WHERE notification_id=?", (notif_id,))
            return {"success": True}

        @router.post("/api/web/notifications/mark-all-read")
        async def mark_all_notifications_read(request: Request):
            session = await self._get_session(request)
            if not session:
                return {"success": False}
            user = await self.auth.get_user(session)
            nation = await self.auth.get_user_nation(user["id"])
            if nation:
                db = self.gpp.db
                await db.execute("UPDATE notifications SET is_read=1 WHERE nation_id=?", (nation["nation_id"],))
            return {"success": True}

        @router.post("/api/web/notifications/clear")
        async def clear_notifications(request: Request):
            session = await self._get_session(request)
            if not session:
                return {"success": False}
            user = await self.auth.get_user(session)
            nation = await self.auth.get_user_nation(user["id"])
            if nation:
                db = self.gpp.db
                await db.execute("DELETE FROM notifications WHERE nation_id=?", (nation["nation_id"],))
            return {"success": True}

        # ---------- Alliance member management ----------
        @router.post("/api/web/alliances/{alliance_id}/members/{nation_id}/promote")
        async def web_promote_member(request: Request, alliance_id: str, nation_id: str):
            user, my_nation = await _require_nation_owner(request)
            if my_nation.get("alliance_role") not in ("LEADER", "OFFICER"):
                raise HTTPException(403, "Must be officer or leader")
            db = self.gpp.db
            nation = await db.fetchdict("SELECT alliance_role FROM nations WHERE nation_id=?", (nation_id,))
            if not nation:
                raise HTTPException(404, "Nation not found")
            new_role = "OFFICER" if (nation.get("alliance_role") or "RECRUIT") in ("RECRUIT", "MEMBER") else "MEMBER"
            await db.execute("UPDATE nations SET alliance_role=? WHERE nation_id=?", (new_role, nation_id))
            await db.execute("UPDATE alliance_members SET role=? WHERE nation_id=? AND alliance_id=?", (new_role, nation_id, alliance_id))
            return {"success": True, "new_role": new_role}

        @router.post("/api/web/alliances/{alliance_id}/members/{nation_id}/demote")
        async def web_demote_member(request: Request, alliance_id: str, nation_id: str):
            user, my_nation = await _require_nation_owner(request)
            if my_nation.get("alliance_role") not in ("LEADER", "OFFICER"):
                raise HTTPException(403, "Must be officer or leader")
            db = self.gpp.db
            nation = await db.fetchdict("SELECT alliance_role FROM nations WHERE nation_id=?", (nation_id,))
            if not nation:
                raise HTTPException(404, "Nation not found")
            new_role = "MEMBER" if (nation.get("alliance_role") or "MEMBER") == "OFFICER" else "RECRUIT"
            await db.execute("UPDATE nations SET alliance_role=? WHERE nation_id=?", (new_role, nation_id))
            await db.execute("UPDATE alliance_members SET role=? WHERE nation_id=? AND alliance_id=?", (new_role, nation_id, alliance_id))
            return {"success": True, "new_role": new_role}

        @router.delete("/api/web/alliances/{alliance_id}/members/{nation_id}")
        async def web_kick_member(request: Request, alliance_id: str, nation_id: str):
            user, my_nation = await _require_nation_owner(request)
            if my_nation.get("alliance_role") not in ("LEADER", "OFFICER"):
                raise HTTPException(403, "Must be officer or leader")
            db = self.gpp.db
            await db.execute("UPDATE nations SET alliance_id=NULL, alliance_role=NULL WHERE nation_id=?", (nation_id,))
            await db.execute("DELETE FROM alliance_members WHERE nation_id=? AND alliance_id=?", (nation_id, alliance_id))
            return {"success": True}

        # ---------- Peace Negotiations ----------
        @router.get("/peace-negotiations", response_class=HTMLResponse)
        async def peace_negotiations_page(request: Request):
            return await self._serve_protected_page("Pages/peace_negotiations.html", request)


    def _build_navbar(self, user: Optional[dict], request: Request) -> str:
        username = user["username"] if user else ""
        avatar_url = (user.get("avatar_url") or "").strip() if user else ""
        nation_id = (user.get("nation_id") or "").strip() if user else ""
        is_auth = user is not None

        search_html = (
            '<div class="top-nav-search">'
            '<span class="search-icon">&#128269;</span>'
            '<input type="text" placeholder="Search nations..." id="global-search" aria-label="Search"'
            ' oninput="handleGlobalSearch(this.value)">'
            '</div>'
        ) if is_auth else ''

        if is_auth:
            if avatar_url:
                avatar_html = f'<img src="{avatar_url}" alt="" class="top-nav-user-avatar" style="width:28px;height:28px;border-radius:50%;object-fit:cover">'
            else:
                avatar_letter = username[:1].upper() if username else "?"
                avatar_html = f'<div class="top-nav-user-avatar">{avatar_letter}</div>'
            nation_link = f'/nation/{nation_id}' if nation_id else '/'
            user_html = (
                f'<div class="dropdown" id="notification-container" style="position:relative"></div>'
                f'<div class="dropdown">'
                f'<div class="top-nav-user" data-bs-toggle="dropdown" role="button">'
                f'{avatar_html}'
                f'<span class="top-nav-user-name">{username}</span>'
                f'</div>'
                f'<ul class="dropdown-menu dropdown-menu-end user-dropdown">'
                f'<li><h6 class="dropdown-header">{username}</h6></li>'
                f'<li><a class="dropdown-item" href="/">&#127984; Dashboard</a></li>'
                f'<li><a class="dropdown-item" href="/empire">&#127918; Empire Control</a></li>'
                f'<li><a class="dropdown-item" href="{nation_link}">&#127757; My Nation</a></li>'
                f'<li><hr class="dropdown-divider"></li>'
                f'<li><a class="dropdown-item" href="#" onclick="Settings.openSettings(); return false;">&#9881; Settings</a></li>'
                f'<li><a class="dropdown-item" href="/admin">&#128295; Admin</a></li>'
                f'<li><hr class="dropdown-divider"></li>'
                f'<li><a class="dropdown-item text-danger" href="#" onclick="auth.logout(); return false;">&#128682; Sign Out</a></li>'
                f'</ul></div>'
            )
        else:
            user_html = '<a href="/login" class="btn btn-gold btn-sm">Sign In</a>'

        return (
            f'<nav class="top-nav">'
            f'<div class="top-nav-left">'
            f'<span class="fw-bold me-2 d-none d-md-inline" style="color:var(--accent-primary);font-family:var(--font-heading);font-size:.9rem">Empires</span>'
            f'<button class="sidebar-toggle" data-action="toggle-sidebar" title="Toggle sidebar">&#9776;</button>'
            f'{search_html}'
            f'</div>'
            f'<div class="top-nav-right">{user_html}</div>'
            f'</nav>'
        )


    def _build_sidebar(self, user: Optional[dict], current_path: str) -> str:
        is_auth = user is not None
        username = user["username"] if user else ""
        avatar_letter = username[:1].upper() if username else "?"
        perms = user.get("permissions", {}) if user else {}
        user_role = perms.get("role", "player") if user else ""
        is_admin = user_role == "admin"
        is_staff = user_role in ("admin", "mod", "helper")

        def nav_link(path: str, icon: str, label: str, nested: bool = False) -> str:
            active = "active" if current_path.rstrip("/") == path.rstrip("/") else ""
            nested_cls = " sidebar-item-nested" if nested else ""
            return f'''
            <a class="sidebar-item{nested_cls} {active}" href="{path}">
                <span class="sidebar-item-icon">{icon}</span>
                <span class="sidebar-item-text">{label}</span>
            </a>'''

        def section_label(text: str) -> str:
            return f'<div class="sidebar-section-label">{text}</div>'

        sidebar_nav = ""

        # --- Main ---
        sidebar_nav += nav_link("/", "ðŸ°", "Dashboard")

        # --- My Empire ---
        sidebar_nav += section_label("My Empire")
        sidebar_nav += nav_link("/cities", "ðŸ™ï¸", "Cities", nested=True)
        sidebar_nav += nav_link("/military", "âš”ï¸", "Military", nested=True)
        sidebar_nav += nav_link("/spy", "ðŸ•µï¸", "Spy Ops", nested=True)
        sidebar_nav += nav_link("/diplomacy", "ðŸ¤", "Diplomacy", nested=True)
        sidebar_nav += nav_link("/alliance/bank", "ðŸ¦", "Bank", nested=True)

        # --- World ---
        sidebar_nav += section_label("World")
        sidebar_nav += nav_link("/nations", "ðŸŒ", "Nations", nested=True)
        sidebar_nav += nav_link("/alliances", "ðŸ¤", "Alliances", nested=True)
        sidebar_nav += nav_link("/wars", "âš”ï¸", "Wars", nested=True)
        sidebar_nav += nav_link("/rankings", "ðŸ†", "Rankings", nested=True)
        sidebar_nav += nav_link("/map", "ðŸ—ºï¸", "Map", nested=True)

        # --- Economy ---
        sidebar_nav += section_label("Economy")
        sidebar_nav += nav_link("/market", "ðŸª", "Market", nested=True)
        sidebar_nav += nav_link("/trade", "ðŸ“¦", "Trade", nested=True)

        # --- Other ---
        sidebar_nav += section_label("Other")
        sidebar_nav += nav_link("/activity", "ðŸ“°", "Activity", nested=True)

        if is_admin:
            sidebar_nav += nav_link("/admin", "ðŸ”§", "Admin", nested=True)

        footer_html = ""
        if is_auth:
            footer_html = f'''
            <div class="sidebar-footer">
                <div class="sidebar-footer-avatar">{avatar_letter}</div>
                <div class="sidebar-footer-info">
                    <div class="sidebar-footer-name">{username}</div>
                    <div class="sidebar-footer-role">{user_role}</div>
                </div>
            </div>'''

        return f'''
        <div class="sidebar-backdrop"></div>
        <aside class="sidebar">
            <div class="sidebar-brand">
                <span class="sidebar-brand-icon">ðŸ°</span>
                <span class="sidebar-brand-text">Empires</span>
            </div>
            <nav class="sidebar-nav">
                {sidebar_nav}
            </nav>
            {footer_html}
        </aside>
        '''

    def _build_sidebar(self, user: Optional[dict], current_path: str) -> str:
        is_auth  = user is not None
        username = user["username"] if user else ""
        avatar_letter = username[:1].upper() if username else "?"
        perms     = user.get("permissions", {}) if user else {}
        user_role = perms.get("role", "player") if user else ""
        is_admin  = user_role == "admin"

        def nav_link(path: str, icon: str, label: str, nested: bool = False) -> str:
            active     = "active" if current_path.rstrip("/") == path.rstrip("/") else ""
            nested_cls = " sidebar-item-nested" if nested else ""
            return (
                f'<a class="sidebar-item{nested_cls} {active}" href="{path}">'
                f'<span class="sidebar-item-icon">{icon}</span>'
                f'<span class="sidebar-item-text">{label}</span>'
                f'</a>'
            )

        def sec(text: str) -> str:
            return f'<div class="sidebar-section-label">{text}</div>'

        nav  = nav_link("/", "&#127984;", "Dashboard")
        nav += sec("My Empire")
        nav += nav_link("/empire",        "&#127918;", "Empire Control", nested=True)
        nav += nav_link("/cities",        "&#127961;", "Cities",         nested=True)
        nav += nav_link("/military",      "&#9876;",   "Military",       nested=True)
        nav += nav_link("/spy",           "&#128373;", "Spy Ops",        nested=True)
        nav += nav_link("/diplomacy",     "&#129309;", "Diplomacy",      nested=True)
        nav += nav_link("/alliance/bank", "&#127974;", "Bank",           nested=True)
        nav += sec("World")
        nav += nav_link("/nations",       "&#127757;", "Nations",    nested=True)
        nav += nav_link("/alliances",     "&#129309;", "Alliances",  nested=True)
        nav += nav_link("/wars",          "&#9876;",   "Wars",       nested=True)
        nav += nav_link("/rankings",      "&#127942;", "Rankings",   nested=True)
        nav += nav_link("/map",           "&#128506;", "Map",        nested=True)
        nav += sec("Economy")
        nav += nav_link("/market",        "&#127978;", "Market",     nested=True)
        nav += nav_link("/trade",         "&#128230;", "Trade",      nested=True)
        nav += sec("Other")
        nav += nav_link("/activity",      "&#128240;", "Activity",   nested=True)
        if is_admin:
            nav += nav_link("/admin",     "&#128295;", "Admin",      nested=True)

        # Server info panel (P&W inspired)
        server_info = (
            f'<div class="sidebar-server-info">'
            f'<div class="info-row"><span class="info-label">Server</span><span class="info-value" id="sidebar-server-status">—</span></div>'
            f'<div class="info-row"><span class="info-label">Online</span><span class="info-value" id="sidebar-online-count">—</span></div>'
            f'</div>'
        )

        footer = ""
        if is_auth:
            footer = (
                f'<div class="sidebar-footer">'
                f'<div class="sidebar-footer-avatar">{avatar_letter}</div>'
                f'<div class="sidebar-footer-info">'
                f'<div class="sidebar-footer-name">{username}</div>'
                f'<div class="sidebar-footer-role">{user_role}</div>'
                f'</div></div>'
            )

        return (
            f'<div class="sidebar-backdrop"></div>'
            f'<aside class="sidebar">'
            f'<div class="sidebar-brand">'
            f'<span class="sidebar-brand-icon">&#127984;</span>'
            f'<span class="sidebar-brand-text">Empires</span>'
            f'</div>'
            f'{server_info if is_auth else ""}'
            f'<nav class="sidebar-nav">{nav}</nav>'
            f'{footer}'
            f'</aside>'
        )


    def _build_settings_modal(self) -> str:
        return '''
        <div class="modal fade" id="settingsModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">âš™ï¸ Settings</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-section">
                            <div class="settings-section-title">ðŸŽ¨ Theme</div>
                            <div class="theme-grid" id="theme-picker"></div>
                        </div>
                        <div class="settings-section">
                            <div class="settings-section-title">ðŸ“ Layout</div>
                            <div class="setting-row" data-setting="sidebarCollapsed">
                                <div>
                                    <div class="setting-label">Collapsed Sidebar</div>
                                    <div class="setting-desc">More room for content</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-row" data-setting="compactMode">
                                <div>
                                    <div class="setting-label">Compact Mode</div>
                                    <div class="setting-desc">Tighter spacing throughout</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="settings-section">
                            <div class="settings-section-title">ðŸ”¤ Font Size</div>
                            <div class="d-flex gap-3">
                                <label class="d-flex align-items-center gap-2" style="cursor:pointer">
                                    <input type="radio" name="font-size" value="small">
                                    <span>Small</span>
                                </label>
                                <label class="d-flex align-items-center gap-2" style="cursor:pointer">
                                    <input type="radio" name="font-size" value="medium" checked>
                                    <span>Medium</span>
                                </label>
                                <label class="d-flex align-items-center gap-2" style="cursor:pointer">
                                    <input type="radio" name="font-size" value="large">
                                    <span>Large</span>
                                </label>
                            </div>
                        </div>
                        <div class="settings-section">
                            <div class="settings-section-title">âŒ¨ï¸ Shortcuts</div>
                            <div class="text-secondary small">
                                <kbd>Ctrl</kbd> + <kbd>\\</kbd> Toggle sidebar
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        '''

    async def _get_session(self, request: Request) -> Optional[dict]:
        session_id = request.cookies.get("session_id")
        if not session_id:
            return None
        return await self.auth.session_manager.get_session(session_id)

    async def _serve_page(self, filename: str, request: Request) -> HTMLResponse:
        path = WEB_DIR / filename
        if not path.exists():
            path = WEB_DIR / "Pages" / "404.html"
            if not path.exists():
                return HTMLResponse("Not Found", status_code=404)

        html = path.read_text(encoding="utf-8")
        session = await self._get_session(request)
        user = await self.auth.get_user(session) if session else None
        is_auth = user is not None

        # Enrich user with nation info for navbar
        if is_auth and user:
            nation = await self.auth.get_user_nation(user["id"])
            user["nation_id"] = nation["nation_id"] if nation else None
            user["nation_name"] = nation["nation_name"] if nation else None

        html = html.replace("{{AUTH_JSON}}", json.dumps({
            "authenticated": is_auth,
            "user": user,
        }))
        html = html.replace("{{IS_AUTHENTICATED}}", "true" if is_auth else "false")
        html = html.replace("{{USERNAME}}", user["username"] if user else "")
        html = html.replace("{{USER_ID}}", user["id"] if user else "")

        # Inject layout components
        current_path = str(request.url.path) if request else "/"
        html = html.replace("{{NAVBAR}}", self._build_navbar(user, request))
        html = html.replace("{{SIDEBAR}}", self._build_sidebar(user, current_path))
        html = html.replace("{{SETTINGS_MODAL}}", self._build_settings_modal())

        return HTMLResponse(html)

    async def _serve_protected_page(self, filename: str, request: Request) -> HTMLResponse:
        session = await self._get_session(request)
        if not session:
            return RedirectResponse(url="/login", status_code=302)
        return await self._serve_page(filename, request)

    def mount(self, app):
        static_dir = WEB_DIR / "css"
        if static_dir.exists():
            app.mount("/css", StaticFiles(directory=str(static_dir)), name="web_css")

        js_dir = WEB_DIR / "js"
        if js_dir.exists():
            app.mount("/js", StaticFiles(directory=str(js_dir)), name="web_js")

        pages_dir = WEB_DIR / "Pages"
        if pages_dir.exists():
            app.mount("/Pages", StaticFiles(directory=str(pages_dir)), name="web_pages")

        # Mount Emojis folder for government/religion icons
        emojis_dir = WEB_DIR.parent / "Emojis"
        if emojis_dir.exists():
            app.mount("/emojis", StaticFiles(directory=str(emojis_dir)), name="web_emojis")

        app.include_router(self.router)
        logger.info("Web server mounted")
