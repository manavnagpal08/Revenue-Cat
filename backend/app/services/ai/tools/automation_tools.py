import logging
from typing import Dict, Any, List, Optional
from app.services.automation.engine import automation_engine
from app.services.automation.ai_builder import ai_automation_builder

logger = logging.getLogger("soloceo_ai_automation_tools")

async def get_automations_tool(business_id: str, **kwargs) -> Dict[str, Any]:
    """Retrieves all active and paused workflows for the business."""
    automations = await automation_engine.list_automations(business_id=business_id)
    limits = await automation_engine.get_limits(business_id=business_id)
    return {
        "total_automations": len(automations),
        "active_count": limits.active_automations_count,
        "max_limit": limits.limit,
        "plan_tier": limits.plan_tier,
        "automations": [
            {
                "id": a.get("id"),
                "name": a.get("name"),
                "status": a.get("status"),
                "trigger_type": a.get("trigger_type"),
                "runs_count": a.get("runs_count", 0),
                "last_run_at": a.get("last_run_at")
            }
            for a in automations
        ]
    }

async def get_automation_failures_tool(business_id: str, **kwargs) -> Dict[str, Any]:
    """Retrieves recent failed automation runs and logs for diagnosis."""
    failed_runs = await automation_engine.get_all_runs(business_id=business_id, status_filter="failed")
    return {
        "failed_runs_count": len(failed_runs),
        "recent_failures": [
            {
                "run_id": r.get("id"),
                "automation_id": r.get("automation_id"),
                "started_at": r.get("started_at"),
                "error_message": r.get("error_message") or r.get("execution_result", {}).get("error", "Execution failed")
            }
            for r in failed_runs[:5]
        ]
    }

async def pause_automation_tool(business_id: str, name_or_id: str, **kwargs) -> Dict[str, Any]:
    """Pauses a workflow by ID or matching name."""
    automations = await automation_engine.list_automations(business_id=business_id)
    target = None
    for a in automations:
        if a.get("id") == name_or_id or name_or_id.lower() in a.get("name", "").lower():
            target = a
            break

    if not target:
        return {"success": False, "error": f"No automation found matching '{name_or_id}'."}

    updated = await automation_engine.set_enabled(automation_id=target["id"], business_id=business_id, enabled=False)
    return {
        "success": True,
        "automation_id": target["id"],
        "name": target.get("name"),
        "status": updated.get("status")
    }

async def run_automation_tool(business_id: str, name_or_id: str, **kwargs) -> Dict[str, Any]:
    """Manually runs an automation by ID or matching name."""
    automations = await automation_engine.list_automations(business_id=business_id)
    target = None
    for a in automations:
        if a.get("id") == name_or_id or name_or_id.lower() in a.get("name", "").lower():
            target = a
            break

    if not target:
        return {"success": False, "error": f"No automation found matching '{name_or_id}'."}

    run_res = await automation_engine.execute_automation_run(
        automation_id=target["id"],
        business_id=business_id,
        event_data={"triggered_by": "ai_command_center"},
        force_run=True
    )
    return {
        "success": True,
        "automation_id": target["id"],
        "name": target.get("name"),
        "run_id": run_res.get("id"),
        "status": run_res.get("status")
    }
