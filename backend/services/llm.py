"""OpenRouter streaming service for anomaly explanations."""

import time
import logging
from typing import AsyncGenerator

from openai import AsyncOpenAI
from config import settings

logger = logging.getLogger(__name__)

# Initialize client
client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    """Lazy-initialize the OpenRouter client."""
    global client
    if client is None:
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY not set in environment")
        client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )
    return client


def build_prompt(alert: dict) -> str:
    """Build a concise prompt for the anomaly explanation."""
    sensor = alert.get("sensor_data", {})
    return f"""You are a medical AI assistant analyzing wearable sensor data anomalies.

An anomaly was detected with the following details:
- Severity: {alert.get('severity', 'unknown')}
- Confidence: {alert.get('confidence', 0):.1%}
- Reason: {alert.get('reason', 'Unknown')}
- Affected Metrics: {', '.join(alert.get('affected_metrics', []))}

Sensor readings at time of anomaly:
- Heart Rate: {sensor.get('heart_rate', 'N/A')} bpm
- SpO₂: {sensor.get('spo2', 'N/A')}%
- Temperature: {sensor.get('temperature', 'N/A')} °C
- Respiratory Rate: {sensor.get('resp_rate', 'N/A')} rpm
- HRV: {sensor.get('hrv', 'N/A')} ms
- Accelerometer Magnitude: {sensor.get('accel_magnitude', 'N/A')} m/s²

Provide a brief (3-5 sentence) clinical analysis:
1. What this anomaly likely indicates
2. Possible causes
3. Recommended action

Keep your response concise, professional, and use markdown formatting."""


async def stream_explanation(alert: dict) -> AsyncGenerator[str, None]:
    """Stream LLM explanation tokens for an anomaly.

    Yields individual tokens/chunks as they arrive.
    """
    start_time = time.time()
    prompt = build_prompt(alert)

    try:
        or_client = get_client()
        response = await or_client.chat.completions.create(
            model="openrouter/free",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )

        full_text = ""
        async for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                full_text += content
                yield content

        latency_ms = (time.time() - start_time) * 1000
        logger.info(f"LLM streaming complete in {latency_ms:.0f}ms ({len(full_text)} chars)")

    except Exception as e:
        logger.error(f"LLM API error (falling back to simulation): {e}")
        import asyncio
        
        simulated_response = f"""**Clinical Analysis (Simulated Fallback)**
        
This anomaly ({alert.get('severity', 'unknown')} severity) indicates a potential irregular event. The confidence score of {alert.get('confidence', 0):.1%} suggests {alert.get('reason', 'an unusual pattern')}.

**Possible Causes:**
* Temporary sensor misplacement or noise
* Brief physiological stress or sudden activity change
* If SpO2 is affected, possible temporary oxygen desaturation

**Recommended Action:**
Continue monitoring. If patterns persist for more than 60 seconds, check the physical sensor placement or advise the patient to rest."""

        # Simulate streaming token by token
        words = simulated_response.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.05)  # Simulate network latency


async def get_explanation(alert: dict) -> tuple[str, float]:
    """Get complete explanation with latency. Used for non-streaming contexts."""
    start_time = time.time()
    full_response = ""

    async for token in stream_explanation(alert):
        full_response += token

    latency_ms = (time.time() - start_time) * 1000
    return full_response, latency_ms
