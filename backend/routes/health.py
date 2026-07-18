"""Health check and system statistics routes."""

import time
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db
from schemas import HealthResponse, StatsResponse
from services.ws_manager import ws_manager

router = APIRouter(tags=["system"])

# Track app start time (set in app.py lifespan)
_start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint."""
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    return HealthResponse(
        status="healthy",
        database=db_status,
        uptime_seconds=round(time.time() - _start_time, 1),
    )


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """System statistics endpoint."""
    from routes.websocket import streaming_stats

    return StatsResponse(
        packets_received=streaming_stats.get("packets_sent", 0),
        packets_dropped=streaming_stats.get("packets_dropped", 0),
        messages_per_sec=streaming_stats.get("messages_per_sec", 0),
        anomaly_count=streaming_stats.get("anomaly_count", 0),
        avg_llm_latency_ms=streaming_stats.get("avg_llm_latency_ms", 0),
        connected_clients=ws_manager.client_count,
        session_uptime_seconds=round(time.time() - _start_time, 1),
    )
