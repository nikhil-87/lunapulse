"""WebSocket endpoint — the heart of the real-time system.

Connects simulator → anomaly detection → LLM streaming → client broadcast.
"""

import time
import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.ws_manager import ws_manager
from services.simulator import SensorSimulator
from services.anomaly import AnomalyDetector
from services import llm
from database import async_session
from models import Session as DBSession, SensorReading, Alert
from utils.helpers import utcnow, new_id

logger = logging.getLogger(__name__)

router = APIRouter()

APP_START = time.time()

# Global streaming stats (shared with health routes)
streaming_stats = {
    "packets_sent": 0,
    "packets_dropped": 0,
    "messages_per_sec": 0,
    "anomaly_count": 0,
    "avg_llm_latency_ms": 0,
    "total_llm_latency": 0,
    "llm_call_count": 0,
}

# Shared services
simulator = SensorSimulator()
detector = AnomalyDetector()

# Background task reference
_streaming_task: asyncio.Task | None = None
_session_id: str | None = None


async def _save_reading(reading: dict, session_id: str):
    """Persist a sensor reading to the database."""
    try:
        async with async_session() as db:
            db_reading = SensorReading(
                session_id=session_id,
                heart_rate=reading["heart_rate"],
                spo2=reading["spo2"],
                temperature=reading["temperature"],
                resp_rate=reading["resp_rate"],
                hrv=reading["hrv"],
                accel_x=reading["accel_x"],
                accel_y=reading["accel_y"],
                accel_z=reading["accel_z"],
                accel_magnitude=reading["accel_magnitude"],
            )
            db.add(db_reading)
            await db.commit()
            return db_reading.id
    except Exception as e:
        logger.error(f"Failed to save reading: {e}")
        return None


async def _save_alert(alert: dict, session_id: str, reading_id):
    """Persist an alert to the database."""
    try:
        async with async_session() as db:
            db_alert = Alert(
                id=alert["id"],
                session_id=session_id,
                reading_id=reading_id or new_id(),
                confidence=alert["confidence"],
                severity=alert["severity"],
                reason=alert["reason"],
                affected_metrics=",".join(alert["affected_metrics"]),
            )
            db.add(db_alert)
            await db.commit()
    except Exception as e:
        logger.error(f"Failed to save alert: {e}")


async def _update_alert_llm(alert_id: str, response: str, latency_ms: float):
    """Update an alert with the LLM response."""
    try:
        async with async_session() as db:
            from sqlalchemy import update
            await db.execute(
                update(Alert)
                .where(Alert.id == alert_id)
                .values(llm_response=response, llm_latency_ms=latency_ms)
            )
            await db.commit()
    except Exception as e:
        logger.error(f"Failed to update alert LLM response: {e}")


async def _handle_anomaly(alert: dict):
    """Process an anomaly: broadcast alert, stream LLM, broadcast tokens."""
    streaming_stats["anomaly_count"] += 1

    # Broadcast alert
    await ws_manager.broadcast({
        "type": "alert",
        "data": alert,
    })

    # Stream LLM explanation
    start = time.time()
    full_response = ""

    try:
        async for token in llm.stream_explanation(alert):
            full_response += token
            await ws_manager.broadcast({
                "type": "llm_token",
                "alert_id": alert["id"],
                "token": token,
            })
    except Exception as e:
        logger.error(f"LLM streaming error: {e}")
        full_response += f"\n\n*Error: {str(e)[:100]}*"

    latency_ms = (time.time() - start) * 1000

    # Broadcast completion
    await ws_manager.broadcast({
        "type": "llm_complete",
        "alert_id": alert["id"],
        "full_response": full_response,
    })

    # Update stats
    streaming_stats["total_llm_latency"] += latency_ms
    streaming_stats["llm_call_count"] += 1
    streaming_stats["avg_llm_latency_ms"] = round(
        streaming_stats["total_llm_latency"] / streaming_stats["llm_call_count"], 1
    )

    # Persist
    await _update_alert_llm(alert["id"], full_response, latency_ms)


async def _streaming_loop(session_id: str):
    """Main loop: generate data → detect anomalies → broadcast."""
    logger.info("Streaming loop started")
    msg_count = 0
    last_stats_time = time.time()
    anomaly_cooldown = 0

    while True:
        try:
            # Generate sensor data
            reading = simulator.generate()

            if reading is None:
                # Sensor dropout
                streaming_stats["packets_dropped"] += 1
                await asyncio.sleep(1)
                continue

            # Broadcast sensor update
            streaming_stats["packets_sent"] += 1
            msg_count += 1

            await ws_manager.broadcast({
                "type": "sensor_update",
                "data": reading,
                "timestamp": reading["timestamp"],
            })

            # Save to DB (fire-and-forget)
            reading_id = await _save_reading(reading, session_id)

            # Check for anomalies (with cooldown to avoid flooding)
            if anomaly_cooldown <= 0:
                alert = detector.check(reading)
                if alert:
                    anomaly_cooldown = 10  # seconds cooldown
                    await _save_alert(alert, session_id, reading_id)
                    # Run LLM in background so it doesn't block sensor stream
                    asyncio.create_task(_handle_anomaly(alert))
            else:
                anomaly_cooldown -= 1
                # Still feed data to detector even during cooldown
                detector.check(reading)

            # Heartbeat + stats every 5 seconds
            now = time.time()
            elapsed = now - last_stats_time
            if elapsed >= 5:
                streaming_stats["messages_per_sec"] = round(msg_count / elapsed, 1)
                msg_count = 0
                last_stats_time = now

                await ws_manager.broadcast({
                    "type": "heartbeat",
                    "timestamp": reading["timestamp"],
                    "stats": {
                        "packets_received": streaming_stats["packets_sent"],
                        "packets_dropped": streaming_stats["packets_dropped"],
                        "messages_per_sec": streaming_stats["messages_per_sec"],
                        "anomaly_count": streaming_stats["anomaly_count"],
                        "avg_llm_latency_ms": streaming_stats["avg_llm_latency_ms"],
                        "connected_clients": ws_manager.client_count,
                        "session_uptime_seconds": round(now - APP_START, 1),
                    },
                })

            await asyncio.sleep(1)

        except asyncio.CancelledError:
            logger.info("Streaming loop cancelled")
            break
        except Exception as e:
            logger.error(f"Streaming loop error: {e}")
            await asyncio.sleep(1)




@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data streaming."""
    global _streaming_task, _session_id

    client = await ws_manager.connect(websocket)

    # Create or reuse session
    if _session_id is None:
        try:
            async with async_session() as db:
                session = DBSession(status="active")
                db.add(session)
                await db.commit()
                _session_id = str(session.id)
                logger.info(f"Created session {_session_id[:8]}")
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            _session_id = new_id()

    # Send connected message
    await ws_manager.send(client.id, {
        "type": "connected",
        "session_id": _session_id,
        "client_id": client.id,
    })

    # Start the streaming loop if not already running
    if _streaming_task is None or _streaming_task.done():
        _streaming_task = asyncio.create_task(_streaming_loop(_session_id))

    try:
        # Keep connection alive — listen for client messages
        while True:
            try:
                data = await websocket.receive_text()
                # Client can send pings or commands here
                # For now, we just acknowledge
                logger.debug(f"Received from client {client.id[:8]}: {data[:100]}")
            except WebSocketDisconnect:
                break
            except Exception:
                break
    finally:
        await ws_manager.disconnect(client.id)

        # Stop streaming if no clients left
        if ws_manager.client_count == 0 and _streaming_task and not _streaming_task.done():
            _streaming_task.cancel()
            _streaming_task = None
            logger.info("No clients connected, stopping streaming loop")
