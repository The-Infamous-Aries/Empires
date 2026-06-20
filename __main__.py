"""
Empires Game - Main Entry Point

Starts the Empire game system with API server, web frontend, and Cloudflare tunnel.
Run with: python -m Empires
"""

import sys
import os
import logging
import subprocess
import signal
import atexit

# Allow running directly: python __main__.py or python -m Empires
if __package__ is None:
    __package__ = "Empires"
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn

from .Core import EmpireConfig

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)

logger = logging.getLogger(__name__)

_tunnel_process = None


def start_tunnel(config: EmpireConfig):
    """Start cloudflared tunnel as a subprocess."""
    global _tunnel_process

    if not config.tunnel_enabled:
        return

    config_path = config.tunnel_config_path
    if not os.path.exists(config_path):
        logger.warning(f"Tunnel config not found at {config_path}, skipping tunnel start")
        return

    logger.info(f"Starting Cloudflare tunnel for {config.tunnel_domain}...")

    try:
        _tunnel_process = subprocess.Popen(
            ["cloudflared", "tunnel", "--config", config_path, "run", config.tunnel_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        logger.info(f"Cloudflare tunnel started (PID: {_tunnel_process.pid})")
    except FileNotFoundError:
        logger.warning("cloudflared not found in PATH, tunnel not started")
    except Exception as e:
        logger.error(f"Failed to start tunnel: {e}")


def stop_tunnel():
    """Stop the cloudflared tunnel subprocess."""
    global _tunnel_process

    if _tunnel_process is not None and _tunnel_process.poll() is None:
        logger.info("Stopping Cloudflare tunnel...")
        _tunnel_process.terminate()
        try:
            _tunnel_process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            _tunnel_process.kill()
            _tunnel_process.wait()
        logger.info("Cloudflare tunnel stopped")
        _tunnel_process = None


def main():
    """Main entry point - starts the FastAPI server with web frontend."""
    config = EmpireConfig.from_env()

    start_tunnel(config)
    atexit.register(stop_tunnel)

    logger.info(f"Starting Empire server on {config.api_host}:{config.api_port}")

    try:
        uvicorn.run(
            "Empires.API.empire_api:app",
            host=config.api_host,
            port=config.api_port,
            log_level=config.log_level.lower(),
            reload=config.debug,
        )
    finally:
        stop_tunnel()


if __name__ == "__main__":
    main()
