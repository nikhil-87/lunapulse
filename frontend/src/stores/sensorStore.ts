import { create } from "zustand";
import type { SensorData, ChartDataPoint, AccelChartDataPoint } from "@/types";
import { CHART_MAX_POINTS } from "@/lib/constants";
import { formatTimestamp } from "@/lib/utils";

interface SensorStore {
  currentReading: SensorData | null;
  heartRateHistory: ChartDataPoint[];
  spo2History: ChartDataPoint[];
  temperatureHistory: ChartDataPoint[];
  respRateHistory: ChartDataPoint[];
  hrvHistory: ChartDataPoint[];
  accelerometerHistory: AccelChartDataPoint[];

  addReading: (reading: SensorData) => void;
  reset: () => void;
}

export const useSensorStore = create<SensorStore>((set) => ({
  currentReading: null,
  heartRateHistory: [],
  spo2History: [],
  temperatureHistory: [],
  respRateHistory: [],
  hrvHistory: [],
  accelerometerHistory: [],

  addReading: (reading) =>
    set((state) => {
      const time = formatTimestamp(reading.timestamp);
      const ts = new Date(reading.timestamp).getTime();

      const hrPoint: ChartDataPoint = { time, value: reading.heart_rate, timestamp: ts };
      const spo2Point: ChartDataPoint = { time, value: reading.spo2, timestamp: ts };
      const tempPoint: ChartDataPoint = { time, value: reading.temperature, timestamp: ts };
      const respPoint: ChartDataPoint = { time, value: reading.resp_rate, timestamp: ts };
      const hrvPoint: ChartDataPoint = { time, value: reading.hrv, timestamp: ts };
      
      const accelPoint: AccelChartDataPoint = {
        time,
        x: reading.accel_x,
        y: reading.accel_y,
        z: reading.accel_z,
        magnitude: reading.accel_magnitude,
        timestamp: ts,
      };

      return {
        currentReading: reading,
        heartRateHistory: [...state.heartRateHistory.slice(-(CHART_MAX_POINTS - 1)), hrPoint],
        spo2History: [...state.spo2History.slice(-(CHART_MAX_POINTS - 1)), spo2Point],
        temperatureHistory: [...state.temperatureHistory.slice(-(CHART_MAX_POINTS - 1)), tempPoint],
        respRateHistory: [...state.respRateHistory.slice(-(CHART_MAX_POINTS - 1)), respPoint],
        hrvHistory: [...state.hrvHistory.slice(-(CHART_MAX_POINTS - 1)), hrvPoint],
        accelerometerHistory: [...state.accelerometerHistory.slice(-(CHART_MAX_POINTS - 1)), accelPoint],
      };
    }),

  reset: () =>
    set({
      currentReading: null,
      heartRateHistory: [],
      spo2History: [],
      temperatureHistory: [],
      respRateHistory: [],
      hrvHistory: [],
      accelerometerHistory: [],
    }),
}));
