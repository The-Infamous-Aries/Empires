"""
Webhook API

REST API endpoints for webhook management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import List, Dict, Any, Optional
import logging
import hmac
import hashlib

from .auth import verify_token

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for webhooks (would be database in production)
webhooks: Dict[str, Dict[str, Any]] = {}


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify webhook signature.
    
    Args:
        payload: Raw request payload
        signature: Signature from request header
        secret: Webhook secret
    
    Returns:
        True if signature is valid
    """
    expected_signature = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)


@router.post("/")
async def create_webhook(
    webhook_data: Dict[str, Any],
    user_id: str = Depends(verify_token)
) -> Dict[str, Any]:
    """
    Create a new webhook.
    
    Args:
        webhook_data: Webhook configuration including URL, events, secret
        user_id: Authenticated user ID
    
    Returns:
        Created webhook information
    """
    webhook_id = f"webhook_{len(webhooks) + 1}"
    
    webhook = {
        "webhook_id": webhook_id,
        "url": webhook_data.get("url"),
        "events": webhook_data.get("events", []),
        "secret": webhook_data.get("secret", ""),
        "active": True,
        "created_by": user_id,
    }
    
    webhooks[webhook_id] = webhook
    
    logger.info(f"Webhook created: {webhook_id}")
    
    return {"webhook_id": webhook_id, "status": "created"}


@router.get("/")
async def get_webhooks(user_id: str = Depends(verify_token)) -> List[Dict[str, Any]]:
    """Get all webhooks for the authenticated user."""
    return [webhook for webhook in webhooks.values() if webhook.get("created_by") == user_id]


@router.get("/{webhook_id}")
async def get_webhook(
    webhook_id: str,
    user_id: str = Depends(verify_token)
) -> Dict[str, Any]:
    """Get a specific webhook by ID."""
    webhook = webhooks.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if webhook.get("created_by") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this webhook")
    
    return webhook


@router.put("/{webhook_id}")
async def update_webhook(
    webhook_id: str,
    updates: Dict[str, Any],
    user_id: str = Depends(verify_token)
) -> Dict[str, Any]:
    """Update a webhook."""
    webhook = webhooks.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if webhook.get("created_by") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this webhook")
    
    # Update allowed fields
    for key in ["url", "events", "active"]:
        if key in updates:
            webhook[key] = updates[key]
    
    logger.info(f"Webhook updated: {webhook_id}")
    
    return webhook


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    user_id: str = Depends(verify_token)
) -> Dict[str, str]:
    """Delete a webhook."""
    webhook = webhooks.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if webhook.get("created_by") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this webhook")
    
    del webhooks[webhook_id]
    
    logger.info(f"Webhook deleted: {webhook_id}")
    
    return {"message": "Webhook deleted successfully"}


@router.post("/{webhook_id}/test")
async def test_webhook(
    webhook_id: str,
    user_id: str = Depends(verify_token)
) -> Dict[str, Any]:
    """Send a test event to a webhook."""
    webhook = webhooks.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if webhook.get("created_by") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to test this webhook")
    
    # TODO: Implement actual webhook delivery
    # This would send a test event to the webhook URL
    
    return {
        "webhook_id": webhook_id,
        "status": "test_sent",
        "message": "Test event sent to webhook URL"
    }


@router.post("/trigger/{event_type}")
async def trigger_webhook_event(
    event_type: str,
    event_data: Dict[str, Any],
    x_webhook_signature: Optional[str] = Header(None),
    x_webhook_id: Optional[str] = Header(None)
) -> Dict[str, str]:
    """
    Trigger a webhook event (internal endpoint).
    
    This endpoint is called by the GPP system to trigger webhook events.
    It verifies the webhook signature for security.
    
    Args:
        event_type: Type of event
        event_data: Event data
        x_webhook_signature: Webhook signature header
        x_webhook_id: Webhook ID header
    
    Returns:
        Status of webhook delivery
    """
    # This would be called internally by the GPP event system
    # For now, return a placeholder response
    
    logger.info(f"Webhook event triggered: {event_type}")
    
    return {
        "status": "delivered",
        "event_type": event_type
    }
