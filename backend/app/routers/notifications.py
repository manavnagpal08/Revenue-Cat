import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.schemas import NotificationResponse
from app.core.security import get_current_user_id
from app.services.automation.registry import in_memory_notifications
from app.core.supabase_client import get_supabase_client

logger = logging.getLogger("soloceo_notifications_router")

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Lists recent notifications for the active business workspace."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("notifications").select("*").eq("business_id", business_id).order("created_at", desc=True).limit(50).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Error reading notifications from Supabase: {e}")

    results = [
        n for n in in_memory_notifications.values()
        if n.get("business_id") == business_id
    ]
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results


@router.post("/{id}/read")
async def mark_notification_read(
    id: str,
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Marks a single notification as read."""
    if id in in_memory_notifications:
        in_memory_notifications[id]["is_read"] = True

    client = get_supabase_client()
    if client:
        try:
            client.table("notifications").update({"is_read": True}).eq("id", id).execute()
        except Exception as e:
            logger.warning(f"Error marking notification read: {e}")

    return {"success": True, "id": id, "is_read": True}


@router.post("/read-all")
async def mark_all_notifications_read(
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Marks all notifications for this business workspace as read."""
    for n in in_memory_notifications.values():
        if n.get("business_id") == business_id:
            n["is_read"] = True

    client = get_supabase_client()
    if client:
        try:
            client.table("notifications").update({"is_read": True}).eq("business_id", business_id).execute()
        except Exception as e:
            logger.warning(f"Error marking all notifications read: {e}")

    return {"success": True, "message": "All notifications marked as read."}
