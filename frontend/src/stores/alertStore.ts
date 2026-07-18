import { create } from "zustand";
import type { AlertData } from "@/types";

interface AlertStore {
  alerts: AlertData[];
  activeAlert: AlertData | null;

  addAlert: (alert: AlertData) => void;
  updateAlertLLM: (alertId: string, response: string) => void;
  clear: () => void;
}

const MAX_ALERTS = 50;

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  activeAlert: null,

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS),
      activeAlert: alert,
    })),

  updateAlertLLM: (alertId, response) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, llm_response: response } : a
      ),
      activeAlert:
        state.activeAlert?.id === alertId
          ? { ...state.activeAlert, llm_response: response }
          : state.activeAlert,
    })),

  clear: () => set({ alerts: [], activeAlert: null }),
}));
