import { motion } from "framer-motion";
import {
  Cpu,
  Zap,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  WifiOff,
  Timer,
} from "lucide-react";
import { useStatsStore } from "@/stores/statsStore";
import { StatCard } from "@/components/cards/StatCard";

export function SystemStats() {
  const stats = useStatsStore();

  const formatUptime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const items = [
    {
      label: "Packets Received",
      value: stats.packets_received.toLocaleString(),
      icon: <Cpu className="h-3.5 w-3.5" />,
    },
    {
      label: "Packets Dropped",
      value: stats.packets_dropped.toLocaleString(),
      icon: <WifiOff className="h-3.5 w-3.5" />,
    },
    {
      label: "Messages/sec",
      value: stats.messages_per_sec.toFixed(1),
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    },
    {
      label: "Anomalies Detected",
      value: stats.anomaly_count.toLocaleString(),
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    {
      label: "Avg LLM Latency",
      value: `${stats.avg_llm_latency_ms.toFixed(0)}ms`,
      icon: <Zap className="h-3.5 w-3.5" />,
    },
    {
      label: "Connected Clients",
      value: stats.connected_clients.toString(),
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      label: "Session Uptime",
      value: formatUptime(stats.session_uptime_seconds),
      icon: <Timer className="h-3.5 w-3.5" />,
    },
    {
      label: "Backend Latency",
      value: `${stats.avg_llm_latency_ms > 0 ? "<1s" : "—"}`,
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="rounded-2xl border border-border/50 bg-card p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold">System Statistics</h3>
        <p className="text-xs text-muted-foreground">Real-time system health</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * index }}
          >
            <StatCard
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
