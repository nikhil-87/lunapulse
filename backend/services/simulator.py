"""Simulates realistic wearable sensor data with complex physiological states."""

import math
import random
import time
from dataclasses import dataclass, field

from utils.helpers import utcnow_iso


@dataclass
class SimulatorState:
    """Tracks the current state of the simulated wearer."""
    activity: str = "normal_resting"
    activity_timer: float = 0
    heart_rate: float = 72.0
    spo2: float = 98.0
    temperature: float = 36.8
    resp_rate: float = 14.0
    hrv: float = 60.0
    accel_x: float = 0.0
    accel_y: float = 0.0
    accel_z: float = 9.8               # gravity
    step_phase: float = 0.0            # for walking/running pattern
    spike_cooldown: float = 0          # prevent back-to-back spikes
    dropout: bool = False
    tick: int = 0


class SensorSimulator:
    """Generates complex physiological data based on medical profiles."""

    ACTIVITY_PROFILES = {
        "normal_resting": {
            "hr_target": 72, "spo2_range": (96, 100), "temp_target": 36.8, 
            "resp_target": 14, "hrv_target": 60, "accel_base": 0.1
        },
        "deep_sleep": {
            "hr_target": 50, "spo2_range": (94, 98), "temp_target": 36.2, 
            "resp_target": 12, "hrv_target": 80, "accel_base": 0.01
        },
        "alcohol_dehydration": {
            "hr_target": 95, "spo2_range": (95, 99), "temp_target": 37.3, 
            "resp_target": 16, "hrv_target": 20, "accel_base": 0.2
        },
        "sick_fever": {
            "hr_target": 105, "spo2_range": (93, 97), "temp_target": 38.5, 
            "resp_target": 22, "hrv_target": 30, "accel_base": 0.05
        },
        "stress_panic": {
            "hr_target": 140, "spo2_range": (95, 100), "temp_target": 37.0, 
            "resp_target": 30, "hrv_target": 15, "accel_base": 0.3
        },
        "exercise_walking": {
            "hr_target": 100, "spo2_range": (95, 99), "temp_target": 37.4, 
            "resp_target": 24, "hrv_target": 40, "accel_base": 1.5
        },
        "exercise_running": {
            "hr_target": 150, "spo2_range": (93, 98), "temp_target": 38.0, 
            "resp_target": 35, "hrv_target": 20, "accel_base": 4.0
        },
    }

    def __init__(self):
        self.state = SimulatorState()

    def generate(self) -> dict | None:
        """Generate a single sensor reading."""
        self.state.tick += 1
        self._update_activity()
        self._update_spike_cooldown()

        # Simulate sensor dropout (~2% chance)
        if random.random() < 0.02:
            self.state.dropout = True
            return None

        self.state.dropout = False
        profile = self.ACTIVITY_PROFILES[self.state.activity]

        hr = self._smooth_transition("heart_rate", profile["hr_target"], 0.05, 1.5, min_val=30, max_val=220)
        spo2 = self._generate_spo2(profile)
        temp = self._smooth_transition("temperature", profile["temp_target"], 0.02, 0.05, min_val=34, max_val=42)
        resp = self._smooth_transition("resp_rate", profile["resp_target"], 0.05, 0.5, min_val=5, max_val=50)
        hrv = self._smooth_transition("hrv", profile["hrv_target"], 0.1, 2.0, min_val=5, max_val=150)
        
        # Add random spikes to HR based on activity
        if random.random() < 0.03 and self.state.spike_cooldown <= 0:
            hr += random.choice([-1, 1]) * random.uniform(20, 50)
            self.state.spike_cooldown = 15

        ax, ay, az = self._generate_accelerometer(profile)
        magnitude = math.sqrt(ax**2 + ay**2 + az**2)

        return {
            "heart_rate": round(hr, 1),
            "spo2": round(spo2, 1),
            "temperature": round(temp, 2),
            "resp_rate": round(resp, 1),
            "hrv": round(hrv, 1),
            "accel_x": round(ax, 3),
            "accel_y": round(ay, 3),
            "accel_z": round(az, 3),
            "accel_magnitude": round(magnitude, 3),
            "timestamp": utcnow_iso(),
        }

    def _update_activity(self):
        """Randomly transition between complex activity states."""
        self.state.activity_timer -= 1

        if self.state.activity_timer <= 0:
            activities = [
                "normal_resting", "deep_sleep", "alcohol_dehydration", 
                "sick_fever", "stress_panic", "exercise_walking", "exercise_running"
            ]
            # Weights heavily favor normal, sleep, and mild states, but occasionally hit severe ones
            weights = [0.4, 0.2, 0.1, 0.05, 0.05, 0.15, 0.05]
            self.state.activity = random.choices(activities, weights=weights)[0]
            # Keep states for longer to allow slow metrics (temp) to stabilize
            self.state.activity_timer = random.uniform(30, 90)

    def _update_spike_cooldown(self):
        if self.state.spike_cooldown > 0:
            self.state.spike_cooldown -= 1

    def _smooth_transition(self, attr_name: str, target: float, rate: float, noise_std: float, min_val: float, max_val: float) -> float:
        """Smoothly moves an attribute toward a target with gaussian noise."""
        current = getattr(self.state, attr_name)
        diff = target - current
        new_val = current + (diff * rate) + random.gauss(0, noise_std)
        # Optional sine wave variation (e.g. breathing effect)
        new_val += math.sin(self.state.tick * 0.1) * (noise_std * 0.5)
        
        clamped = max(min_val, min(max_val, new_val))
        setattr(self.state, attr_name, clamped)
        return clamped

    def _generate_spo2(self, profile: dict) -> float:
        target = sum(profile["spo2_range"]) / 2
        diff = target - self.state.spo2
        self.state.spo2 += diff * 0.1

        noise = random.gauss(0, 0.3)
        dip = -random.uniform(3, 8) if random.random() < 0.01 else 0

        spo2 = self.state.spo2 + noise + dip
        return max(70, min(100, spo2))

    def _generate_accelerometer(self, profile: dict) -> tuple[float, float, float]:
        base = profile["accel_base"]
        
        # Determine movement phase speed
        if "running" in self.state.activity:
            self.state.step_phase += 0.3
        elif "walking" in self.state.activity:
            self.state.step_phase += 0.15
        else:
            self.state.step_phase += 0.05

        if base <= 0.1:  # Resting/Sleep/Sick
            ax = random.gauss(0, base)
            ay = random.gauss(0, base)
            az = 9.8 + random.gauss(0, base)
        elif "walking" in self.state.activity:
            ax = math.sin(self.state.step_phase) * base * 0.5 + random.gauss(0, 0.2)
            ay = math.cos(self.state.step_phase * 0.5) * base * 0.3 + random.gauss(0, 0.15)
            az = 9.8 + math.sin(self.state.step_phase * 2) * base * 0.4 + random.gauss(0, 0.1)
        elif "running" in self.state.activity:
            ax = math.sin(self.state.step_phase) * base + random.gauss(0, 0.5)
            ay = math.cos(self.state.step_phase * 0.7) * base * 0.6 + random.gauss(0, 0.3)
            az = 9.8 + math.sin(self.state.step_phase * 2.5) * base * 0.8 + random.gauss(0, 0.2)
        else:
            # Generic tremors (e.g. panic)
            ax = random.gauss(0, base)
            ay = random.gauss(0, base)
            az = 9.8 + random.gauss(0, base)

        return ax, ay, az
