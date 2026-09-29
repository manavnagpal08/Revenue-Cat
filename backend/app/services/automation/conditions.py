import logging
from typing import Dict, Any, List, Union
from datetime import datetime, timezone

logger = logging.getLogger("soloceo_condition_engine")

class SafeConditionEvaluator:
    """
    Safely evaluates business logic conditions without running arbitrary executable code.
    Supports nested field extraction, comparison operators, and logical combinators (AND, OR, NOT).
    """

    @staticmethod
    def extract_field_value(data: Dict[str, Any], field_path: str) -> Any:
        """Extracts values from nested dictionaries using dot notation (e.g., 'invoice.amount')."""
        if not field_path:
            return None
        parts = field_path.split(".")
        curr = data
        for p in parts:
            if isinstance(curr, dict) and p in curr:
                curr = curr[p]
            else:
                return None
        return curr

    @classmethod
    def evaluate_single_rule(cls, rule: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """
        Evaluates a single rule dictionary:
        {
            "field": "lead.days_inactive",
            "operator": ">",
            "value": 7
        }
        """
        field_path = rule.get("field", "")
        operator = rule.get("operator", "==").lower()
        target_value = rule.get("value")

        actual_value = cls.extract_field_value(context, field_path)

        # Handle None checks
        if operator in ["is_null", "is_empty"]:
            return actual_value is None or actual_value == "" or actual_value == []
        if operator in ["is_not_null", "is_not_empty"]:
            return actual_value is not None and actual_value != "" and actual_value != []

        if actual_value is None:
            return False

        try:
            # Numeric conversion if comparing numbers
            if isinstance(target_value, (int, float)) and not isinstance(actual_value, (int, float)):
                try:
                    actual_value = float(actual_value)
                except (ValueError, TypeError):
                    pass

            if operator in ["==", "eq", "equals"]:
                return str(actual_value).lower() == str(target_value).lower() if isinstance(target_value, str) else actual_value == target_value
            elif operator in ["!=", "neq", "not_equals"]:
                return str(actual_value).lower() != str(target_value).lower() if isinstance(target_value, str) else actual_value != target_value
            elif operator in [">", "gt"]:
                return float(actual_value) > float(target_value)
            elif operator in [">=", "gte"]:
                return float(actual_value) >= float(target_value)
            elif operator in ["<", "lt"]:
                return float(actual_value) < float(target_value)
            elif operator in ["<=", "lte"]:
                return float(actual_value) <= float(target_value)
            elif operator in ["contains", "in_string"]:
                return str(target_value).lower() in str(actual_value).lower()
            elif operator in ["in", "one_of"]:
                if isinstance(target_value, list):
                    return actual_value in target_value or str(actual_value).lower() in [str(x).lower() for x in target_value]
                return str(actual_value) in str(target_value)
            elif operator in ["not_in"]:
                if isinstance(target_value, list):
                    return actual_value not in target_value
                return str(actual_value) not in str(target_value)
            else:
                logger.warning(f"Unsupported condition operator: {operator}")
                return False
        except Exception as e:
            logger.warning(f"Error evaluating rule {rule} against context: {e}")
            return False

    @classmethod
    def evaluate(cls, condition_config: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """
        Evaluates a condition tree containing AND / OR / NOT groups or a list of rules.
        Empty config evaluates to True.
        """
        if not condition_config:
            return True

        # Check for NOT operator
        if "NOT" in condition_config:
            return not cls.evaluate(condition_config["NOT"], context)

        # Check for OR operator
        if "OR" in condition_config:
            sub_rules = condition_config["OR"]
            if not isinstance(sub_rules, list):
                return False
            return any(cls.evaluate(r if isinstance(r, dict) else {}, context) for r in sub_rules)

        # Check for AND operator or list of rules
        if "AND" in condition_config:
            sub_rules = condition_config["AND"]
            if not isinstance(sub_rules, list):
                return False
            return all(cls.evaluate(r if isinstance(r, dict) else {}, context) for r in sub_rules)

        # Direct single rule check
        if "field" in condition_config:
            return cls.evaluate_single_rule(condition_config, context)

        # Default: if rules array exists
        rules = condition_config.get("rules", [])
        if not rules:
            return True

        match_type = condition_config.get("match_type", "all").lower()  # 'all' (AND) or 'any' (OR)
        results = [cls.evaluate_single_rule(r, context) for r in rules if isinstance(r, dict)]

        if match_type == "any":
            return any(results) if results else True
        return all(results) if results else True


condition_evaluator = SafeConditionEvaluator()
