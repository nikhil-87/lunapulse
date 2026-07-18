import { useWebSocket } from "@/hooks/useWebSocket";
import { Navbar } from "@/components/layout/Navbar";
import { MetricCard } from "@/components/cards/MetricCard";
import { HeartRateChart } from "@/components/charts/HeartRateChart";
import { SpO2Chart } from "@/components/charts/SpO2Chart";
import { AccelerometerChart } from "@/components/charts/AccelerometerChart";
import { AlertTimeline } from "@/components/alerts/AlertTimeline";
import { AiInsights } from "@/components/ai/AiInsights";
import { SystemStats } from "@/components/stats/SystemStats";
import { useSensorStore } from "@/stores/sensorStore";
import { useAlertStore } from "@/stores/alertStore";
import { Heart, Droplets, Move3d, ShieldAlert, Thermometer, Wind, Activity } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export function Dashboard() {
  useWebSocket();

  const reading = useSensorStore((s) => s.currentReading);
  const alertCount = useAlertStore((s) => s.alerts.length);
  const activeAlert = useAlertStore((s) => s.activeAlert);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Hero Metrics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Heart Rate"
            value={reading ? formatNumber(reading.heart_rate, 0) : "—"}
            unit="bpm"
            icon={<Heart className="h-5 w-5" />}
            subtitle={reading ? `Activity detected` : "Waiting for data"}
            color="text-chart-hr"
            pulse={!!reading}
          />
          <MetricCard
            title="SpO₂"
            value={reading ? formatNumber(reading.spo2, 1) : "—"}
            unit="%"
            icon={<Droplets className="h-5 w-5" />}
            subtitle={
              reading
                ? reading.spo2 >= 95
                  ? "Normal range"
                  : "Below normal"
                : "Waiting for data"
            }
            color="text-chart-spo2"
            pulse={!!reading}
          />
          <MetricCard
            title="Acceleration"
            value={reading ? formatNumber(reading.accel_magnitude, 1) : "—"}
            unit="m/s²"
            icon={<Move3d className="h-5 w-5" />}
            subtitle={reading ? "Magnitude (X,Y,Z)" : "Waiting for data"}
            color="text-chart-accel-x"
          />
          <MetricCard
            title="Anomaly Status"
            value={alertCount > 0 ? alertCount : "Clear"}
            unit={alertCount > 0 ? "detected" : undefined}
            icon={<ShieldAlert className="h-5 w-5" />}
            subtitle={
              activeAlert
                ? `Last: ${activeAlert.severity}`
                : "No anomalies"
            }
            color={alertCount > 0 ? "text-warning" : "text-success"}
            pulse={alertCount > 0}
          />
        </section>

        {/* Secondary Metrics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            title="Body Temperature"
            value={reading ? formatNumber(reading.temperature, 1) : "—"}
            unit="°C"
            icon={<Thermometer className="h-5 w-5" />}
            subtitle={reading ? (reading.temperature > 37.8 ? "Fever detected" : "Normal") : "Waiting for data"}
            color={reading && reading.temperature > 37.8 ? "text-warning" : "text-emerald-400"}
          />
          <MetricCard
            title="Respiratory Rate"
            value={reading ? formatNumber(reading.resp_rate, 0) : "—"}
            unit="rpm"
            icon={<Wind className="h-5 w-5" />}
            subtitle={reading ? (reading.resp_rate > 25 ? "Elevated breathing" : "Normal rhythm") : "Waiting for data"}
            color="text-sky-400"
          />
          <MetricCard
            title="Heart Rate Variability"
            value={reading ? formatNumber(reading.hrv, 0) : "—"}
            unit="ms"
            icon={<Activity className="h-5 w-5" />}
            subtitle={reading ? (reading.hrv < 30 ? "High stress / Poor recovery" : "Healthy variance") : "Waiting for data"}
            color={reading && reading.hrv < 30 ? "text-warning" : "text-purple-400"}
          />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <HeartRateChart />
          <SpO2Chart />
          <AccelerometerChart />
        </section>

        {/* Alert Timeline + AI Insights */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AlertTimeline />
          <AiInsights />
        </section>

        {/* System Statistics */}
        <section>
          <SystemStats />
        </section>

        {/* Footer */}
        <footer className="pb-4 text-center text-[11px] text-muted-foreground/50">
          LunaPulse v1.0.0 — Real-time Wearable Intelligence Dashboard
        </footer>
      </main>
    </div>
  );
}
