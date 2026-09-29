import logging
import asyncio
from typing import Dict, Any, List
from datetime import datetime, timezone
from app.services.automation.registry import in_memory_automations, in_memory_runs, get_now_iso
from app.services.automation.engine import automation_engine

logger = logging.getLogger("soloceo_automation_scheduler")

class AutomationScheduler:
    """
    Evaluates scheduled and time-triggered workflows (daily briefings, inactivity sweeps, invoice due sweeps).
    Designed to be triggered by cron, FastAPI background tasks, or external scheduler services.
    """

    async def run_scheduled_sweeps(self, business_id: str) -> Dict[str, Any]:
        """
        Runs an evaluation cycle across active automations for the business.
        Prevents duplicate actions through idempotency checks.
        """
        results = {
            "business_id": business_id,
            "evaluated_count": 0,
            "triggered_count": 0,
            "timestamp": get_now_iso()
        }

        automations = await automation_engine.list_automations(business_id=business_id)
        for auto in automations:
            if not auto.get("enabled", True):
                continue

            trigger_type = auto.get("trigger_type")
            results["evaluated_count"] += 1

            if trigger_type in ["daily_summary", "lead_inactive", "invoice_overdue"]:
                try:
                    run_res = await automation_engine.execute_automation_run(
                        automation_id=auto["id"],
                        business_id=business_id,
                        event_data={"triggered_by": "scheduler_sweep"}
                    )
                    if run_res.get("status") in ["running", "waiting_approval", "completed"]:
                        results["triggered_count"] += 1
                except Exception as e:
                    logger.error(f"Error in scheduler sweep for automation {auto['id']}: {e}")

        return results


automation_scheduler = AutomationScheduler()
