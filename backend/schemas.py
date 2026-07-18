"""Pydantic schemas for request/response validation and WebSocket messages."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


# --- Enums ---

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MessageType(str, Enum):
    CONNECTED = "connected"
    SENSOR_UPDATE = "sensor_update"
    ALERT = "alert"
    LLM_TOKEN = "llm_token"
    LLM_COMPLETE = "llm_complete"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    DISCONNECTED = "disconnected"


# --- Sensor ---

class SensorData(BaseModel):
    heart_rate: float = Field(..., ge=0, le=300)
    spo2: float = Field(..., ge=0, le=100)
    accel_x: float = Field(..., ge=-50, le=50)
    accel_y: float = Field(..., ge=-50, le=50)
    accel_z: float = Field(..., ge=-50, le=50)
    accel_magnitude: float = Field(..., ge=0)
    timestamp: datetime


# --- Alert ---

class AlertData(BaseModel):
    id: str
    confidence: float = Field(..., ge=0, le=1)
    severity: Severity
    reason: str
    affected_metrics: list[str]
    sensor_data: SensorData
    timestamp: datetime
    llm_response: str | None = None


class AlertResponse(BaseModel):
    id: UUID
    confidence: float
    severity: str
    reason: str
    affected_metrics: str
    llm_response: str | None
    llm_latency_ms: float | None
    timestamp: datetime

    class Config:
        from_attributes = True


# --- WebSocket Messages ---

class WSMessage(BaseModel):
    type: MessageType
    data: dict | None = None
    timestamp: str | None = None

    # Fields for specific message types
    session_id: str | None = None
    client_id: str | None = None
    token: str | None = None
    alert_id: str | None = None
    full_response: str | None = None
    message: str | None = None
    code: str | None = None
    stats: dict | None = None


# --- REST Responses ---

class HealthResponse(BaseModel):
    status: str
    database: str
    uptime_seconds: float
    version: str = "1.0.0"


class StatsResponse(BaseModel):
    packets_received: int
    packets_dropped: int
    messages_per_sec: float
    anomaly_count: int
    avg_llm_latency_ms: float
    connected_clients: int
    session_uptime_seconds: float


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    pages: int


class ReadingResponse(BaseModel):
    id: UUID
    heart_rate: float
    spo2: float
    accel_x: float
    accel_y: float
    accel_z: float
    accel_magnitude: float
    timestamp: datetime

    class Config:
        from_attributes = True
