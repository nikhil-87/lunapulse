import { useEffect, useRef, useCallback } from "react";
import { useSensorStore } from "@/stores/sensorStore";
import { useAlertStore } from "@/stores/alertStore";
import { useConnectionStore } from "@/stores/connectionStore";
import { useLLMStore } from "@/stores/llmStore";
import { useStatsStore } from "@/stores/statsStore";
import { WS_URL, RECONNECT_DELAY_MS, MAX_RECONNECT_ATTEMPTS } from "@/lib/constants";
import type { WSMessage, SensorData, AlertData } from "@/types";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addReading = useSensorStore((s) => s.addReading);
  const addAlert = useAlertStore((s) => s.addAlert);
  const updateAlertLLM = useAlertStore((s) => s.updateAlertLLM);

  const setStatus = useConnectionStore((s) => s.setStatus);
  const setLatency = useConnectionStore((s) => s.setLatency);
  const setSession = useConnectionStore((s) => s.setSession);
  const incrementReconnect = useConnectionStore((s) => s.incrementReconnect);
  const reconnectAttempts = useConnectionStore((s) => s.reconnectAttempts);

  const startStream = useLLMStore((s) => s.startStream);
  const appendToken = useLLMStore((s) => s.appendToken);
  const completeStream = useLLMStore((s) => s.completeStream);

  const statsUpdate = useStatsStore((s) => s.update);
  const incrementPackets = useStatsStore((s) => s.incrementPackets);

  const clearHeartbeatTimer = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const resetHeartbeatTimer = useCallback(() => {
    clearHeartbeatTimer();
    heartbeatTimerRef.current = setTimeout(() => {
      // No heartbeat received — connection might be stale
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    }, 15000);
  }, [clearHeartbeatTimer]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        incrementPackets();

        switch (msg.type) {
          case "connected":
            setSession(msg.session_id ?? "", msg.client_id ?? "");
            resetHeartbeatTimer();
            break;

          case "initial_state":
            if (msg.alerts) {
              // Iterate in reverse so the newest ends up at the top
              [...msg.alerts].reverse().forEach((alertData: any) => {
                const alert = alertData as unknown as AlertData;
                addAlert(alert);
                if (alert.llm_response) {
                  useLLMStore.getState().addHistoryItem(
                    alert.id, 
                    alert.llm_response, 
                    alert.timestamp
                  );
                }
              });
            }
            break;

          case "sensor_update":
            if (msg.data) {
              addReading(msg.data as unknown as SensorData);
            }
            break;

          case "alert":
            if (msg.data) {
              const alert = msg.data as unknown as AlertData;
              addAlert(alert);
              startStream(alert.id);
            }
            break;

          case "llm_token":
            if (msg.token) {
              appendToken(msg.token);
            }
            break;

          case "llm_complete":
            if (msg.full_response && msg.alert_id) {
              completeStream(msg.full_response);
              updateAlertLLM(msg.alert_id, msg.full_response);
            }
            break;

          case "heartbeat":
            resetHeartbeatTimer();
            if (msg.stats) {
              statsUpdate(msg.stats);
            }
            // Calculate latency from heartbeat timestamp
            if (msg.timestamp) {
              const serverTime = new Date(msg.timestamp).getTime();
              const latency = Math.abs(Date.now() - serverTime);
              setLatency(Math.min(latency, 9999));
            }
            break;

          case "error":
            console.error("[WS] Server error:", msg.message);
            break;

          case "disconnected":
            console.warn("[WS] Server disconnect:", msg.message);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    },
    [
      addReading,
      addAlert,
      updateAlertLLM,
      setSession,
      setLatency,
      startStream,
      appendToken,
      completeStream,
      statsUpdate,
      incrementPackets,
      resetHeartbeatTimer,
    ]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected");
        setStatus("connected");
        resetHeartbeatTimer();
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        console.error("[WS] Error");
        setStatus("error");
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected");
        setStatus("disconnected");
        clearHeartbeatTimer();

        // Auto reconnect with backoff
        const attempts = useConnectionStore.getState().reconnectAttempts;
        if (attempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY_MS * Math.pow(1.5, attempts);
          console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${attempts + 1})`);
          incrementReconnect();
          reconnectTimerRef.current = setTimeout(connect, delay);
        } else {
          console.error("[WS] Max reconnect attempts reached");
          setStatus("error");
        }
      };
    } catch (err) {
      console.error("[WS] Connection failed:", err);
      setStatus("error");
    }
  }, [
    setStatus,
    handleMessage,
    incrementReconnect,
    resetHeartbeatTimer,
    clearHeartbeatTimer,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    clearHeartbeatTimer();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [clearHeartbeatTimer]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
