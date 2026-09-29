from typing import Dict, Any, List

# Shared in-memory data store for AI tools and operations (fallback & testing)
in_memory_customers: Dict[str, Dict[str, Any]] = {}
in_memory_leads: Dict[str, Dict[str, Any]] = {}
in_memory_activities: Dict[str, List[Dict[str, Any]]] = {}
in_memory_invoices: Dict[str, Dict[str, Any]] = {}
in_memory_payments: Dict[str, Dict[str, Any]] = {}
in_memory_proposals: Dict[str, Dict[str, Any]] = {}
