/* ===== WebSocket Message Types ===== */

export type MessageType =
  | "connected"
  | "sensor_update"
  | "alert"
  | "llm_token"
  | "llm_complete"
  | "heartbeat"
  | "error"
  | "disconnected";

export interface WSMessage {
  type: MessageType;
  data?: Record<string, unknown>;
  timestamp?: string;
  session_id?: string;
  client_id?: string;
  token?: string;
  alert_id?: string;
  full_response?: string;
  message?: string;
  code?: string;
  stats?: SystemStats;
}

/* ===== Sensor Data ===== */

export interface SensorData {
  heart_rate: number;
  spo2: number;
  temperature: number;
  resp_rate: number;
  hrv: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  accel_magnitude: number;
  timestamp: string;
}

export interface SensorReading extends SensorData {
  id?: string;
}

/* ===== Chart Data Point ===== */

export interface ChartDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

export interface AccelChartDataPoint {
  time: string;
  x: number;
  y: number;
  z: number;
  magnitude: number;
  timestamp: number;
}

/* ===== Alert ===== */

export type Severity = "low" | "medium" | "high" | "critical";

export interface AlertData {
  id: string;
  confidence: number;
  severity: Severity;
  reason: string;
  affected_metrics: string[];
  sensor_data: SensorData;
  timestamp: string;
  llm_response?: string;
}

/* ===== System Stats ===== */

export interface SystemStats {
  packets_received: number;
  packets_dropped: number;
  messages_per_sec: number;
  anomaly_count: number;
  avg_llm_latency_ms: number;
  connected_clients: number;
  session_uptime_seconds: number;
}

/* ===== Connection ===== */

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

/* ===== Theme ===== */

export type Theme = "dark" | "light";
