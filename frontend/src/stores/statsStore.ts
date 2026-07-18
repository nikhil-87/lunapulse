import { create } from "zustand";
import type { SystemStats } from "@/types";

interface StatsStore extends SystemStats {
  update: (stats: Partial<SystemStats>) => void;
  incrementPackets: () => void;
  incrementDropped: () => void;
  incrementAnomalies: () => void;
  reset: () => void;
}

export const useStatsStore = create<StatsStore>((set) => ({
  packets_received: 0,
  packets_dropped: 0,
  messages_per_sec: 0,
  anomaly_count: 0,
  avg_llm_latency_ms: 0,
  connected_clients: 0,
  session_uptime_seconds: 0,

  update: (stats) => set((state) => ({ ...state, ...stats })),
  incrementPackets: () =>
    set((state) => ({ packets_received: state.packets_received + 1 })),
  incrementDropped: () =>
    set((state) => ({ packets_dropped: state.packets_dropped + 1 })),
  incrementAnomalies: () =>
    set((state) => ({ anomaly_count: state.anomaly_count + 1 })),
  reset: () =>
    set({
      packets_received: 0,
      packets_dropped: 0,
      messages_per_sec: 0,
      anomaly_count: 0,
      avg_llm_latency_ms: 0,
      connected_clients: 0,
      session_uptime_seconds: 0,
    }),
}));
