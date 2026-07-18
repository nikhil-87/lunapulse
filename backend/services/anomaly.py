"""Anomaly detection using Isolation Forest with complex pattern recognition."""

import logging
import numpy as np
from collections import deque
from sklearn.ensemble import IsolationForest

from utils.helpers import severity_from_confidence, new_id, utcnow_iso

logger = logging.getLogger(__name__)

WINDOW_SIZE = 200
RETRAIN_INTERVAL = 50
MIN_SAMPLES = 30
Z_SCORE_THRESHOLD = 2.5
CONTAMINATION = 0.05


class AnomalyDetector:
    """Detects multi-variable anomalies and classifies medical patterns."""

    def __init__(self):
        self.buffer: deque[list[float]] = deque(maxlen=WINDOW_SIZE)
        self.model: IsolationForest | None = None
        self.samples_since_retrain = 0
        self._trained = False

    def check(self, reading: dict) -> dict | None:
        """Check a reading for anomalies."""
        features = [
            reading["heart_rate"],
            reading["spo2"],
            reading["accel_magnitude"],
            reading["temperature"],
            reading["resp_rate"],
            reading["hrv"],
        ]
        self.buffer.append(features)
        self.samples_since_retrain += 1

        if len(self.buffer) >= MIN_SAMPLES:
            if not self._trained or self.samples_since_retrain >= RETRAIN_INTERVAL:
                self._train()

        if self._trained:
            return self._isolation_forest_check(features, reading)
        elif len(self.buffer) >= MIN_SAMPLES:
            return self._zscore_check(features, reading)

        return None

    def _train(self):
        try:
            data = np.array(list(self.buffer))
            self.model = IsolationForest(
                contamination=CONTAMINATION,
                random_state=42,
                n_estimators=100,
            )
            self.model.fit(data)
            self._trained = True
            self.samples_since_retrain = 0
            logger.info(f"Isolation Forest trained on {len(data)} samples (6D)")
        except Exception as e:
            logger.error(f"Training failed: {e}")
            self._trained = False

    def _isolation_forest_check(self, features: list[float], reading: dict) -> dict | None:
        if not self.model:
            return None

        try:
            sample = np.array([features])
            prediction = self.model.predict(sample)
            score = self.model.decision_function(sample)[0]

            if prediction[0] == -1:
                confidence = min(1.0, max(0.0, -score * 2))
                return self._build_alert(confidence, features, reading)
        except Exception as e:
            logger.error(f"Isolation Forest prediction failed: {e}")

        return None

    def _zscore_check(self, features: list[float], reading: dict) -> dict | None:
        data = np.array(list(self.buffer))
        means = data.mean(axis=0)
        stds = data.std(axis=0)
        stds = np.where(stds == 0, 1, stds)

        z_scores = np.abs((np.array(features) - means) / stds)
        max_z = float(z_scores.max())

        if max_z > Z_SCORE_THRESHOLD:
            confidence = min(1.0, (max_z - Z_SCORE_THRESHOLD) / 3)
            return self._build_alert(confidence, features, reading)

        return None

    def _build_alert(self, confidence: float, features: list[float], reading: dict) -> dict:
        """Classify the anomaly into a complex pattern."""
        hr, spo2, accel, temp, resp, hrv = features
        affected = []
        reason = "Unusual physiological pattern detected."

        # Complex Pattern Rules
        is_fever = temp > 37.8
        is_stress = hrv < 25
        is_hyperventilating = resp > 25
        is_resting = accel < 0.5
        is_tachycardia = hr > 120

        if is_fever and is_tachycardia and is_resting:
            reason = f"Suspected Onset Fever: Temp at {temp:.1f}°C with high resting HR ({hr:.0f} bpm) and low HRV ({hrv:.0f}ms)."
            affected.extend(["temperature", "heart_rate", "hrv"])
        elif is_stress and is_tachycardia and is_resting and is_hyperventilating:
            reason = f"Suspected Panic/Stress: Rapid resting HR ({hr:.0f} bpm) and hyperventilation ({resp:.0f} rpm) with very low HRV."
            affected.extend(["heart_rate", "resp_rate", "hrv"])
        elif is_resting and hr > 85 and hrv < 30 and temp > 37.0:
            reason = f"Suspected Dehydration/Alcohol: Elevated resting HR, very poor HRV ({hrv:.0f}ms), and elevated body temp."
            affected.extend(["hrv", "heart_rate", "temperature"])
        elif hr < 40 and spo2 < 93 and accel < 0.2:
            reason = f"Critical Sleep Apnea Warning: Severe bradycardia ({hr:.0f} bpm) and hypoxemia ({spo2:.0f}%) while resting."
            affected.extend(["heart_rate", "spo2"])
        elif accel > 15:
            reason = f"Physical Shock Detected: Violent acceleration spike ({accel:.1f} m/s²). Potential fall."
            affected.append("accelerometer")
        else:
            # Fallbacks for extreme single values
            if hr > 150: affected.append("heart_rate")
            if spo2 < 93: affected.append("spo2")
            if temp > 38.5: affected.append("temperature")
            if hrv < 20: affected.append("hrv")
            if resp > 30: affected.append("resp_rate")

            if affected:
                reason = f"Multiple metrics irregular: {', '.join(affected)}."

        severity = severity_from_confidence(confidence)

        return {
            "id": new_id(),
            "confidence": round(confidence, 3),
            "severity": severity,
            "reason": reason,
            "affected_metrics": affected,
            "sensor_data": reading,
            "timestamp": utcnow_iso(),
        }
