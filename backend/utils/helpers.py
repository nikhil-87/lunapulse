"""Utility functions for timestamps, IDs, and formatting."""

import uuid
from datetime import datetime, timezone


def utcnow() -> datetime:
    """Current UTC timestamp."""
    return datetime.now(timezone.utc)


def utcnow_iso() -> str:
    """Current UTC timestamp as ISO string."""
    return utcnow().isoformat()


def new_id() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


def severity_from_confidence(confidence: float) -> str:
    """Map a confidence score to a severity level."""
    if confidence >= 0.8:
        return "critical"
    elif confidence >= 0.6:
        return "high"
    elif confidence >= 0.4:
        return "medium"
    return "low"


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value to a range."""
    return max(min_val, min(max_val, value))
