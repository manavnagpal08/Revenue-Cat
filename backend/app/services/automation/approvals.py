import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.services.automation.registry import in_memory_actions, in_memory_runs, get_now_iso
from app.services.automation.executor import action_executor
from app.core.supabase_client import get_supabase_client

logger = logging.getLogger("soloceo_automation_approvals")

class AutomationApprovalService:
    """Handles explicit user approvals and rejections of pending automated actions."""

    @classmethod
    async def approve_action(
        cls,
        action_id: str,
        business_id: str,
        user_id: str,
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        """Approves a waiting action and triggers immediate execution."""
        action = in_memory_actions.get(action_id)
        if not action:
            raise ValueError(f"Action '{action_id}' not found")

        if action.get("business_id") != business_id:
            raise PermissionError("Access denied to action")

        action["status"] = "approved"
        action["confirmed_by"] = user_id
        action["confirmed_at"] = get_now_iso()
        if note:
            action["output_data"]["approval_note"] = note

        # Execute action
        exec_result = await action_executor.execute_approved_action(
            action_id=action_id,
            business_id=business_id,
            confirmed_by=user_id
        )

        # Update parent run status
        run_id = action.get("automation_run_id")
        if run_id and run_id in in_memory_runs:
            run = in_memory_runs[run_id]
            run["status"] = "completed" if exec_result.get("success") else "failed"
            run["completed_at"] = get_now_iso()
            run["execution_result"] = exec_result

            # Update Supabase
            client = get_supabase_client()
            if client:
                try:
                    client.table("automation_runs").update({
                        "status": run["status"],
                        "completed_at": run["completed_at"],
                        "execution_result": exec_result
                    }).eq("id", run_id).execute()
                except Exception as e:
                    logger.warning(f"Error updating run in Supabase: {e}")

        return {
            "success": True,
            "action_id": action_id,
            "status": action["status"],
            "execution_result": exec_result
        }

    @classmethod
    async def reject_action(
        cls,
        action_id: str,
        business_id: str,
        user_id: str,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Rejects a waiting action, marking the action rejected and run cancelled."""
        action = in_memory_actions.get(action_id)
        if not action:
            raise ValueError(f"Action '{action_id}' not found")

        if action.get("business_id") != business_id:
            raise PermissionError("Access denied to action")

        action["status"] = "rejected"
        action["confirmed_by"] = user_id
        action["confirmed_at"] = get_now_iso()
        action["output_data"]["rejection_reason"] = reason or "User rejected action."

        run_id = action.get("automation_run_id")
        if run_id and run_id in in_memory_runs:
            run = in_memory_runs[run_id]
            run["status"] = "cancelled"
            run["completed_at"] = get_now_iso()
            run["error_message"] = reason or "Action rejected by user."

        return {
            "success": True,
            "action_id": action_id,
            "status": "rejected",
            "message": "Action successfully rejected."
        }


approval_service = AutomationApprovalService()
