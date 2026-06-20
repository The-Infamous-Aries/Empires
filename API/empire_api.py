"""
Empire Game System - FastAPI Application

Main FastAPI application for the Empire game system.
Provides both the REST API and the web frontend.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from ..Core.gpp_manager import EmpireGPPManager
from ..Core.config import EmpireConfig
from ..Database.auth_database import AuthDatabase
from ..Web.auth import Auth
from ..Web.session_manager import SessionManager
from ..Web.web_server import WebServer

logger = logging.getLogger(__name__)

# Global GPP Manager instance
gpp_manager: EmpireGPPManager = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global gpp_manager

    if gpp_manager is None:
        logger.info("Starting Empire API with default GPP setup")

        config = EmpireConfig.from_env()
        gpp_manager = EmpireGPPManager(config)
        await gpp_manager.initialize()

        # Register all game components
        from ..Components import (
            NationCityComponent, GovRelComponent, MilitaryWarComponent,
            EconomyComponent, ProgressionComponent, DiplomacyComponent,
            TickComponent, AllianceComponent, AllianceMonumentsComponent,
            EventsComponent, FormulasComponent, TradeComponent, TurnComponent,
        )

        await gpp_manager.register_component("nation_city", NationCityComponent(gpp_manager=gpp_manager, db_manager=gpp_manager.db))
        await gpp_manager.register_component("govrel", GovRelComponent(gpp_manager=gpp_manager, db_manager=gpp_manager.db))
        await gpp_manager.register_component("military_war", MilitaryWarComponent(gpp_manager=gpp_manager, db_manager=gpp_manager.db))
        await gpp_manager.register_component("economy", EconomyComponent(gpp_manager=gpp_manager, db_manager=gpp_manager.db))
        await gpp_manager.register_component("progression", ProgressionComponent(gpp_manager=gpp_manager, db_manager=gpp_manager.db))
        await gpp_manager.register_component("diplomacy", DiplomacyComponent(gpp_manager=gpp_manager, db_manager=gpp_manager.db))
        await gpp_manager.register_component("tick", TickComponent(gpp_manager=gpp_manager, db_manager=gpp_manager.db))
        await gpp_manager.register_component("alliance", AllianceComponent(gpp_manager=gpp_manager, db_manager=gpp_manager.db))
        await gpp_manager.register_component("alliance_monuments", AllianceMonumentsComponent(gpp_manager=gpp_manager))
        await gpp_manager.register_component("events", EventsComponent(gpp_manager=gpp_manager))
        await gpp_manager.register_component("formulas", FormulasComponent(gpp_manager=gpp_manager))
        await gpp_manager.register_component("trade", TradeComponent(gpp_manager=gpp_manager, db_manager=gpp_manager.db))
        await gpp_manager.register_component("turn", TurnComponent(gpp_manager=gpp_manager))

        # Wire components to API routers
        from . import nation_api, alliance_api, war_api, trade_api, market_api
        nation_api.set_nation_component(gpp_manager.get_component("nation_city"))
        alliance_api.set_alliance_component(gpp_manager.get_component("alliance"))
        war_api.set_military_war_component(gpp_manager.get_component("military_war"))
        trade_api.set_trade_component(gpp_manager.get_component("trade"))
        market_api.set_economy_component(gpp_manager.get_component("economy"))

        # Initialize web frontend with separate auth database
        auth_db = AuthDatabase(config.database_path)
        await auth_db.initialize()

        session_manager = SessionManager(auth_db)
        await session_manager.initialize()

        auth = Auth(session_manager, auth_db, config=config)
        await auth.initialize()

        web_server = WebServer(gpp_manager, auth)
        web_server.mount(app)

        await gpp_manager.start()

    logger.info("Empire application started successfully")

    yield

    if gpp_manager:
        logger.info("Shutting down Empire application")
        await gpp_manager.stop()
        logger.info("Empire application shut down successfully")


app = FastAPI(
    title="Empire Game System",
    description="Full-stack Empire game system with API and web frontend",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gpp_running": gpp_manager is not None and gpp_manager.is_running
    }


@app.get("/status")
async def get_status():
    if not gpp_manager:
        raise HTTPException(status_code=503, detail="GPP Manager not initialized")
    return await gpp_manager.health_check()


@app.get("/components/health")
async def get_component_health():
    if not gpp_manager:
        raise HTTPException(status_code=503, detail="GPP Manager not initialized")
    health_status = {}
    for component_name, component in gpp_manager.components.items():
        if hasattr(component, 'health_check'):
            health_status[component_name] = await component.health_check()
        else:
            health_status[component_name] = {"status": "unknown"}
    return health_status


@app.get("/metrics")
async def get_metrics():
    if not gpp_manager:
        raise HTTPException(status_code=503, detail="GPP Manager not initialized")
    metrics_collector = gpp_manager.metrics
    if not metrics_collector:
        return {}
    return metrics_collector.get_all_metrics()


from .nation_api import router as nation_router
from .alliance_api import router as alliance_router
from .war_api import router as war_router
from .trade_api import router as trade_router
from .market_api import router as market_router
from .webhook import router as webhook_router

app.include_router(nation_router, prefix="/api/nations", tags=["nations"])
app.include_router(alliance_router, prefix="/api/alliances", tags=["alliances"])
app.include_router(war_router, prefix="/api/wars", tags=["wars"])
app.include_router(trade_router, prefix="/api/trade", tags=["trade"])
app.include_router(market_router, prefix="/api/market", tags=["market"])
app.include_router(webhook_router, prefix="/api/webhooks", tags=["webhooks"])
