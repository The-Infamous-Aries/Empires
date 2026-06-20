"""
Nation API

REST API endpoints for nation-related operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
import logging

from .auth import verify_token

logger = logging.getLogger(__name__)

router = APIRouter()

# Global component reference (will be set by the API app)
_nation_component: Optional['NationCityComponent'] = None


def set_nation_component(component):
    """Set the nation component instance."""
    global _nation_component
    _nation_component = component


async def get_nation_component() -> 'NationCityComponent':
    """Get the nation component from global reference."""
    if _nation_component is None:
        raise HTTPException(status_code=503, detail="Nation component not available")
    return _nation_component


@router.get("/")
async def get_all_nations(
    user_id: str = Depends(verify_token),
    component = Depends(get_nation_component)
) -> List[Dict[str, Any]]:
    """Get all nations."""
    try:
        nations = await component.get_all()
        return nations  # Component now returns List[Dict[str, Any]]
    except Exception as e:
        logger.error(f"Error getting all nations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{nation_id}")
async def get_nation(
    nation_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_nation_component)
) -> Dict[str, Any]:
    """Get a specific nation by ID."""
    try:
        nation = await component.get_nation_by_id(nation_id)
        if not nation:
            raise HTTPException(status_code=404, detail="Nation not found")
        return nation  # Component now returns Dict[str, Any]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting nation {nation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_nation(
    nation_data: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_nation_component)
) -> Dict[str, Any]:
    """Create a new nation."""
    try:
        nation = await component.create_nation(nation_data)
        return nation  # Component now returns Dict[str, Any]
    except Exception as e:
        logger.error(f"Error creating nation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{nation_id}")
async def update_nation(
    nation_id: str,
    updates: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_nation_component)
) -> Dict[str, Any]:
    """Update a nation."""
    try:
        success = await component.update_nation(nation_id, updates)
        if not success:
            raise HTTPException(status_code=404, detail="Nation not found")
        nation = await component.get_nation_by_id(nation_id)
        return nation  # Component now returns Dict[str, Any]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating nation {nation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{nation_id}")
async def delete_nation(
    nation_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_nation_component)
) -> Dict[str, str]:
    """Delete a nation."""
    try:
        success = await component.delete_nation(nation_id)
        if not success:
            raise HTTPException(status_code=404, detail="Nation not found")
        return {"message": "Nation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting nation {nation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{nation_id}/cities")
async def get_nation_cities(
    nation_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_nation_component)
) -> List[Dict[str, Any]]:
    """Get all cities for a nation."""
    try:
        cities = await component.get_cities_for_nation(nation_id)
        return cities  # Component now returns List[Dict[str, Any]]
    except Exception as e:
        logger.error(f"Error getting cities for nation {nation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{nation_id}/statistics")
async def get_nation_statistics(
    nation_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_nation_component)
) -> Dict[str, Any]:
    """Get comprehensive statistics for a nation."""
    try:
        stats = await component.get_nation_statistics(nation_id)
        if not stats:
            raise HTTPException(status_code=404, detail="Nation not found")
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting statistics for nation {nation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
