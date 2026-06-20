"""
Web Package - Empires Game Frontend

Provides the web-based frontend for the Empires game system.
Serves as a Single-Page Application (SPA) with standard login.
"""

from .session_manager import SessionManager
from .auth import Auth
from .web_server import WebServer

__all__ = [
    'SessionManager',
    'Auth',
    'WebServer',
]
