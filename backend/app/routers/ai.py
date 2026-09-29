from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.core.security import get_current_user_id
from app.core.supabase_client import get_supabase
from app.services.ai.supervisor import (
    supervisor_instance,
    _in_memory_conversations,
    _in_memory_messages,
    _in_memory_usage
)
from app.services.ai.actions import execute_confirmed_action
from app.services.ai.tools.dashboard_tools import get_business_brief_tool

router = APIRouter(prefix="/ai", tags=["AI Command Center & Supervisor"])

class AICommandRequest(BaseModel):
    business_id: str
    prompt: str
    conversation_id: Optional[str] = None

class AIActionConfirmRequest(BaseModel):
    business_id: str
    action_type: str
    payload: Dict[str, Any]

@router.post("/command")
async def execute_ai_command(
    req: AICommandRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Main endpoint for user interactions with the SoloCEO AI Supervisor & Specialized Agents.
    """
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    result = await supervisor_instance.execute_query(
        query=req.prompt,
        business_id=req.business_id,
        user_id=user_id,
        conversation_id=req.conversation_id
    )
    return result


@router.post("/actions/confirm")
async def confirm_ai_action(
    req: AIActionConfirmRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Executes a consequential write action that was explicitly confirmed by the user.
    """
    try:
        res = await execute_confirmed_action(
            action_type=req.action_type,
            payload=req.payload,
            business_id=req.business_id,
            user_id=user_id
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/conversations")
async def list_conversations(
    business_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    List AI conversation threads for the current business.
    """
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("ai_conversations").select("*").eq("business_id", business_id).order("updated_at", desc=True).execute()
            if res.data:
                return res.data
        except Exception:
            pass

    return [c for c in _in_memory_conversations.values() if c.get("business_id") == business_id]


@router.get("/conversations/{conversation_id}")
async def get_conversation_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Retrieve message history for a specific conversation.
    """
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("ai_messages").select("*").eq("conversation_id", conversation_id).order("created_at", asc=True).execute()
            if res.data:
                return res.data
        except Exception:
            pass

    return [m for m in _in_memory_messages if m.get("conversation_id") == conversation_id]


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a conversation thread and all its messages.
    """
    supabase = get_supabase()
    if supabase:
        try:
            supabase.table("ai_conversations").delete().eq("id", conversation_id).execute()
        except Exception:
            pass

    if conversation_id in _in_memory_conversations:
        del _in_memory_conversations[conversation_id]
    
    global _in_memory_messages
    _in_memory_messages = [m for m in _in_memory_messages if m.get("conversation_id") != conversation_id]

    return {"deleted": True, "conversation_id": conversation_id}


@router.get("/business-brief")
async def get_ai_business_brief(
    business_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Retrieve real-time synthesized AI Business Brief for the home dashboard.
    """
    brief = await get_business_brief_tool(business_id=business_id)
    return brief


@router.get("/usage")
async def get_ai_usage_stats(
    business_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Retrieve AI usage and credit consumption for the current business.
    """
    supabase = get_supabase()
    usage_records = []
    if supabase:
        try:
            res = supabase.table("ai_usage").select("*").eq("business_id", business_id).order("created_at", desc=True).limit(50).execute()
            usage_records = res.data or []
        except Exception:
            usage_records = [u for u in _in_memory_usage if u.get("business_id") == business_id]
    else:
        usage_records = [u for u in _in_memory_usage if u.get("business_id") == business_id]

    total_credits = sum(int(u.get("credits_consumed", 1)) for u in usage_records)
    return {
        "business_id": business_id,
        "total_requests": len(usage_records),
        "total_credits_consumed": total_credits,
        "credits_remaining": max(0, 100 - total_credits),
        "recent_usage": usage_records[:10]
    }
