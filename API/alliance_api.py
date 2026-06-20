"""
Alliance API

REST API endpoints for alliance-related operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
import logging

from .auth import verify_token

logger = logging.getLogger(__name__)

router = APIRouter()

# Global component reference (will be set by the API app)
_alliance_component: Optional['AllianceComponent'] = None


def set_alliance_component(component):
    """Set the alliance component instance."""
    global _alliance_component
    _alliance_component = component


async def get_alliance_component() -> 'AllianceComponent':
    """Get the alliance component from global reference."""
    if _alliance_component is None:
        raise HTTPException(status_code=503, detail="Alliance component not available")
    return _alliance_component


@router.get("/")
async def get_all_alliances(
    user_id: str = Depends(verify_token),
    component = Depends(get_alliance_component)
) -> List[Dict[str, Any]]:
    """Get all alliances."""
    try:
        alliances = await component.get_all()
        return alliances
    except Exception as e:
        logger.error(f"Error getting all alliances: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{alliance_id}")
async def get_alliance(
    alliance_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_alliance_component)
) -> Dict[str, Any]:
    """Get a specific alliance by ID."""
    try:
        alliance = await component.get_by_id(alliance_id)
        if not alliance:
            raise HTTPException(status_code=404, detail="Alliance not found")
        return alliance
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting alliance {alliance_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_alliance(
    alliance_data: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_alliance_component)
) -> Dict[str, Any]:
    """Create a new alliance."""
    try:
        alliance = await component.create_alliance(alliance_data)
        return alliance
    except Exception as e:
        logger.error(f"Error creating alliance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{alliance_id}")
async def update_alliance(
    alliance_id: str,
    updates: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_alliance_component)
) -> Dict[str, Any]:
    """Update an alliance."""
    try:
        success = await component.update_alliance(alliance_id, updates)
        if not success:
            raise HTTPException(status_code=404, detail="Alliance not found")
        alliance = await component.get_by_id(alliance_id)
        return alliance
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating alliance {alliance_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{alliance_id}")
async def delete_alliance(
    alliance_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_alliance_component)
) -> Dict[str, str]:
    """Delete an alliance."""
    try:
        success = await component.delete_alliance(alliance_id)
        if not success:
            raise HTTPException(status_code=404, detail="Alliance not found")
        return {"message": "Alliance deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting alliance {alliance_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{alliance_id}/members")
async def get_alliance_members(
    alliance_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_alliance_component)
) -> List[Dict[str, Any]]:
    """Get all members of an alliance."""
    try:
        members = await component.get_alliance_members(alliance_id)
        return members
    except Exception as e:
        logger.error(f"Error getting members for alliance {alliance_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{alliance_id}/members")
async def add_alliance_member(
    alliance_id: str,
    member_data: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_alliance_component)
) -> Dict[str, Any]:
    """Add a member to an alliance."""
    try:
        # Update nation's alliance_id
        nation_id = member_data.get('nation_id')
        if not nation_id:
            raise HTTPException(status_code=400, detail="nation_id required")
        
        # This would use empire_db to update the nation's alliance_id
        # For now, return a placeholder
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding member to alliance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{alliance_id}/members/{member_id}")
async def remove_alliance_member(
    alliance_id: str,
    member_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_alliance_component)
) -> Dict[str, str]:
    """Remove a member from an alliance."""
    try:
        # Update nation's alliance_id to None
        # This would use empire_db to update the nation's alliance_id
        # For now, return a placeholder
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing member from alliance: {e}")
        raise HTTPException(status_code=500, detail=str(e))
