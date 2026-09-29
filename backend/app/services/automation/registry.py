import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

# In-memory stores for multi-tenant automation state
in_memory_automations: Dict[str, Dict[str, Any]] = {}
in_memory_runs: Dict[str, Dict[str, Any]] = {}
in_memory_actions: Dict[str, Dict[str, Any]] = {}
in_memory_notifications: Dict[str, Dict[str, Any]] = {}
in_memory_logs: Dict[str, Dict[str, Any]] = {}
in_memory_dedup_events: Dict[str, str] = {} # event_hash -> run_id

def get_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

