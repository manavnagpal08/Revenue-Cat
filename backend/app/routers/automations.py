import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.models.schemas import (
    AutomationCreate,
    AutomationUpdate,
    AutomationResponse,
    AutomationRunResponse,
    AutomationActionResponse,
    AutomationTemplateResponse,
    AutomationActionApprovalRequest,
    AutomationAnalyticsResponse,
)
from app.core.security import get_current_user_id
from app.services.automation.engine import automation_engine
from app.services.automation.approvals import approval_service
from app.services.automation.templates import get_system_templates, get_template_by_id
from app.services.automation.triggers import get_supported_triggers

logger = logging.getLogger("soloceo_automations_router")

router = APIRouter(prefix="", tags=["Automations & Workflow Engine"])

@router.get("/automations", response_model=List[AutomationResponse])
async def list_automations(
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Lists all configured automations for the active workspace."""
    return await automation_engine.list_automations(business_id=business_id)


@router.post("/automations", response_model=AutomationResponse, status_code=status.HTTP_201_CREATED)
async def create_automation(
    payload: AutomationCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Creates a new automated workflow rule."""
    return await automation_engine.create_automation(
        business_id=payload.business_id,
        payload=payload,
        user_id=user_id
    )


@router.get("/automations/templates", response_model=List[AutomationTemplateResponse])
async def get_templates(
    category: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user_id)
):
    """Returns pre-built automation templates gallery."""
    templates = get_system_templates()
    if category and category.lower() != "all":
        templates = [t for t in templates if t.get("category", "").lower() == category.lower()]
    return templates


@router.get("/automations/triggers")
async def get_triggers(
    user_id: str = Depends(get_current_user_id)
):
    """Returns supported trigger events."""
    return get_supported_triggers()


@router.get("/automations/analytics", response_model=AutomationAnalyticsResponse)
async def get_analytics(
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Returns automation run analytics and success rates."""
    return await automation_engine.get_analytics(business_id=business_id)


@router.get("/automations/{id}", response_model=AutomationResponse)
async def get_automation(
    id: str,
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Retrieves a single automation configuration."""
    auto = await automation_engine.get_automation(automation_id=id, business_id=business_id)
    if not auto:
        raise HTTPException(status_code=404, detail="Automation not found")
    return auto


@router.put("/automations/{id}", response_model=AutomationResponse)
async def update_automation(
    id: str,
    payload: AutomationUpdate,
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Updates an existing automation."""
    try:
        return await automation_engine.update_automation(
            automation_id=id,
            business_id=business_id,
            payload=payload
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/automations/{id}")
async def delete_automation(
    id: str,
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Deletes an automation rule."""
    try:
        success = await automation_engine.delete_automation(automation_id=id, business_id=business_id)
        return {"success": success, "id": id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/automations/{id}/enable", response_model=AutomationResponse)
async def enable_automation(
    id: str,
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Enables an automation."""
    return await automation_engine.set_enabled(automation_id=id, business_id=business_id, enabled=True)


@router.post("/automations/{id}/disable", response_model=AutomationResponse)
async def disable_automation(
    id: str,
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Disables/pauses an automation."""
    return await automation_engine.set_enabled(automation_id=id, business_id=business_id, enabled=False)


@router.post("/automations/{id}/run", response_model=AutomationRunResponse)
async def run_automation_now(
    id: str,
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Manually triggers immediate execution of an automation."""
    try:
        return await automation_engine.execute_automation_run(
            automation_id=id,
            business_id=business_id,
            event_data={"triggered_by": "manual_run", "user_id": user_id},
            force_run=True
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/automations/{id}/runs", response_model=List[AutomationRunResponse])
async def list_automation_runs(
    id: str,
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Lists past execution runs for a specific automation."""
    return await automation_engine.get_runs_for_automation(automation_id=id, business_id=business_id)


@router.get("/automation-runs/{run_id}", response_model=AutomationRunResponse)
async def get_run_detail(
    run_id: str,
    business_id: str = Query(...),
    user_id: str = Depends(get_current_user_id)
):
    """Returns detailed audit timeline for an automation run."""
    run = await automation_engine.get_run_detail(run_id=run_id, business_id=business_id)
    if not run:
        raise HTTPException(status_code=404, detail="Automation run not found")
    return run


@router.post("/automation-actions/{id}/approve")
async def approve_action(
    id: str,
    payload: AutomationActionApprovalRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Explicit human approval to execute pending automated action."""
    try:
        return await approval_service.approve_action(
            action_id=id,
            business_id=payload.business_id,
            user_id=user_id,
            note=payload.note
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/automation-actions/{id}/reject")
async def reject_action(
    id: str,
    payload: AutomationActionApprovalRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Rejects pending automated action."""
    try:
        return await approval_service.reject_action(
            action_id=id,
            business_id=payload.business_id,
            user_id=user_id,
            reason=payload.note
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
