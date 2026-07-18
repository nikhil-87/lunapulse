import { create } from "zustand";
import type { ConnectionStatus } from "@/types";

interface ConnectionStore {
  status: ConnectionStatus;
  latency: number;
  sessionId: string | null;
  clientId: string | null;
  reconnectAttempts: number;

  setStatus: (status: ConnectionStatus) => void;
  setLatency: (latency: number) => void;
  setSession: (sessionId: string, clientId: string) => void;
  incrementReconnect: () => void;
  resetReconnect: () => void;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  status: "disconnected",
  latency: 0,
  sessionId: null,
  clientId: null,
  reconnectAttempts: 0,

  setStatus: (status) => set({ status }),
  setLatency: (latency) => set({ latency }),
  setSession: (sessionId, clientId) =>
    set({ sessionId, clientId, status: "connected", reconnectAttempts: 0 }),
  incrementReconnect: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnect: () => set({ reconnectAttempts: 0 }),
  reset: () =>
    set({
      status: "disconnected",
      latency: 0,
      sessionId: null,
      clientId: null,
      reconnectAttempts: 0,
    }),
}));
