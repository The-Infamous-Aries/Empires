"""
Market API

REST API endpoints for market-related operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
import logging

from .auth import verify_token

logger = logging.getLogger(__name__)

router = APIRouter()

# Global component reference (will be set by the API app)
_economy_component: Optional['EconomyComponent'] = None


def set_economy_component(component):
    """Set the economy component instance."""
    global _economy_component
    _economy_component = component


async def get_economy_component() -> 'EconomyComponent':
    """Get the economy component from global reference."""
    if _economy_component is None:
        raise HTTPException(status_code=503, detail="Economy component not available")
    return _economy_component


@router.get("/listings")
async def get_market_listings(
    resource_type: Optional[str] = None,
    user_id: str = Depends(verify_token),
    component = Depends(get_economy_component)
) -> List[Dict[str, Any]]:
    """Get all market listings."""
    try:
        # Get market listings from economy component
        return []
    except Exception as e:
        logger.error(f"Error getting market listings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/listings/{listing_id}")
async def get_market_listing(
    listing_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_economy_component)
) -> Dict[str, Any]:
    """Get a specific market listing by ID."""
    try:
        # Get market listing from economy component
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting market listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/listings")
async def create_market_listing(
    listing_data: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_economy_component)
) -> Dict[str, Any]:
    """Create a new market listing."""
    try:
        # Create market listing using economy component
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating market listing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/listings/{listing_id}")
async def cancel_market_listing(
    listing_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_economy_component)
) -> Dict[str, str]:
    """Cancel a market listing."""
    try:
        # Cancel market listing using economy component
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling market listing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/listings/{listing_id}/buy")
async def buy_from_listing(
    listing_id: str,
    buy_data: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_economy_component)
) -> Dict[str, Any]:
    """Buy from a market listing."""
    try:
        # Buy from listing using economy component
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error buying from listing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_market_history(
    resource_type: Optional[str] = None,
    user_id: str = Depends(verify_token),
    component = Depends(get_economy_component)
) -> List[Dict[str, Any]]:
    """Get market price history."""
    try:
        # Get market history from economy component
        return []
    except Exception as e:
        logger.error(f"Error getting market history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prices")
async def get_current_prices(
    user_id: str = Depends(verify_token),
    component = Depends(get_economy_component)
) -> Dict[str, float]:
    """Get current market prices for all resources."""
    try:
        # Get current prices from economy component
        return {}
    except Exception as e:
        logger.error(f"Error getting current prices: {e}")
        raise HTTPException(status_code=500, detail=str(e))
