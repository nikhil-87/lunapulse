import { create } from "zustand";

interface LLMStore {
  streamingAlertId: string | null;
  currentTokens: string;
  isStreaming: boolean;
  history: Array<{ alertId: string; response: string; timestamp: string }>;

  startStream: (alertId: string) => void;
  appendToken: (token: string) => void;
  completeStream: (fullResponse: string) => void;
  addHistoryItem: (alertId: string, response: string, timestamp: string) => void;
  reset: () => void;
}

const MAX_HISTORY = 10;

export const useLLMStore = create<LLMStore>((set) => ({
  streamingAlertId: null,
  currentTokens: "",
  isStreaming: false,
  history: [],

  startStream: (alertId) =>
    set({ streamingAlertId: alertId, currentTokens: "", isStreaming: true }),

  appendToken: (token) =>
    set((state) => ({
      currentTokens: state.currentTokens + token,
    })),

  completeStream: (fullResponse) =>
    set((state) => ({
      isStreaming: false,
      currentTokens: fullResponse,
      history: [
        {
          alertId: state.streamingAlertId ?? "",
          response: fullResponse,
          timestamp: new Date().toISOString(),
        },
        ...state.history,
      ].slice(0, MAX_HISTORY),
    })),

  addHistoryItem: (alertId, response, timestamp) =>
    set((state) => {
      // Avoid adding duplicates if it's already there
      if (state.history.some(h => h.alertId === alertId)) return state;
      return {
        history: [
          { alertId, response, timestamp },
          ...state.history,
        ].slice(0, MAX_HISTORY),
      };
    }),

  reset: () =>
    set({
      streamingAlertId: null,
      currentTokens: "",
      isStreaming: false,
      history: [],
    }),
}));
