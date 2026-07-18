export const WS_URL = "ws://localhost:8000/ws";
export const API_URL = "http://localhost:8000";

export const CHART_MAX_POINTS = 60;
export const RECONNECT_DELAY_MS = 2000;
export const MAX_RECONNECT_ATTEMPTS = 10;
export const HEARTBEAT_TIMEOUT_MS = 10000;

export const SENSOR_RANGES = {
  heartRate: { min: 40, max: 200, unit: "bpm" },
  spo2: { min: 85, max: 100, unit: "%" },
  accelerometer: { min: -20, max: 20, unit: "m/s²" },
} as const;
