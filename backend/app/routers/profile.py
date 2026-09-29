import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import ProfileResponse, ProfileUpdate
from app.core.security import get_current_user
from app.core.supabase_client import get_supabase_client, get_supabase_admin_client

logger = logging.getLogger("soloceo.profile")
router = APIRouter(prefix="/profile", tags=["User Profile"])

@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves current user's profile from Supabase."""
    user_id = current_user["id"]
    client = get_supabase_client()

    if client is not None:
        try:
            res = client.table("profiles").select("*").eq("id", user_id).single().execute()
            if res.data:
                return ProfileResponse(**res.data)
        except Exception as e:
            logger.warning(f"Error fetching profile: {e}")

    return ProfileResponse(
        id=user_id,
        email=current_user.get("email", "alex.founder@soloceo.app"),
        full_name=current_user.get("full_name", "Alex Rivera"),
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    )

@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    payload: ProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates user profile information."""
    user_id = current_user["id"]
    client = get_supabase_client() or get_supabase_admin_client()

    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}

    if client is not None:
        try:
            res = client.table("profiles").update(update_dict).eq("id", user_id).execute()
            if res.data:
                return ProfileResponse(**res.data[0])
        except Exception as e:
            logger.error(f"Error updating profile: {e}")

    return ProfileResponse(
        id=user_id,
        email=current_user.get("email", "alex.founder@soloceo.app"),
        full_name=payload.full_name or "Alex Rivera",
        avatar_url=payload.avatar_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    )
