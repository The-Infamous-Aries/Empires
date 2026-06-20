"""
War API

REST API endpoints for war-related operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
import logging

from .auth import verify_token

logger = logging.getLogger(__name__)

router = APIRouter()

# Global component reference (will be set by the API app)
_military_war_component: Optional['MilitaryWarComponent'] = None


def set_military_war_component(component):
    """Set the military war component instance."""
    global _military_war_component
    _military_war_component = component


async def get_military_war_component() -> 'MilitaryWarComponent':
    """Get the military war component from global reference."""
    if _military_war_component is None:
        raise HTTPException(status_code=503, detail="Military war component not available")
    return _military_war_component


@router.get("/")
async def get_all_wars(
    user_id: str = Depends(verify_token),
    component = Depends(get_military_war_component)
) -> List[Dict[str, Any]]:
    """Get all wars."""
    try:
        # Get all wars from database
        return []
    except Exception as e:
        logger.error(f"Error getting all wars: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{war_id}")
async def get_war(
    war_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_military_war_component)
) -> Dict[str, Any]:
    """Get a specific war by ID."""
    try:
        war = await component.get_war(war_id)
        if not war:
            raise HTTPException(status_code=404, detail="War not found")
        return war
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting war {war_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_war(
    war_data: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_military_war_component)
) -> Dict[str, Any]:
    """Declare a new war."""
    try:
        war = await component.create_war(war_data)
        return war
    except Exception as e:
        logger.error(f"Error creating war: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{war_id}")
async def update_war(
    war_id: str,
    updates: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_military_war_component)
) -> Dict[str, Any]:
    """Update a war."""
    try:
        # Update war in database
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating war {war_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{war_id}/end")
async def end_war(
    war_id: str,
    outcome: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_military_war_component)
) -> Dict[str, str]:
    """End a war with an outcome."""
    try:
        success = await component.end_war(war_id, outcome)
        if not success:
            raise HTTPException(status_code=404, detail="War not found")
        return {"message": "War ended successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending war {war_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{war_id}/attack")
async def process_war_attack(
    war_id: str,
    attack_data: Dict[str, Any],
    user_id: str = Depends(verify_token),
    component = Depends(get_military_war_component)
) -> Dict[str, Any]:
    """Process a war attack."""
    try:
        result = await component.process_war_attack(
            war_id=war_id,
            attacker_id=attack_data.get('attacker_id'),
            attack_type=attack_data.get('attack_type')
        )
        return result
    except Exception as e:
        logger.error(f"Error processing war attack: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nation/{nation_id}")
async def get_wars_for_nation(
    nation_id: str,
    user_id: str = Depends(verify_token),
    component = Depends(get_military_war_component)
) -> List[Dict[str, Any]]:
    """Get all wars involving a nation."""
    try:
        wars = await component.get_wars_for_nation(nation_id)
        return wars
    except Exception as e:
        logger.error(f"Error getting wars for nation {nation_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
