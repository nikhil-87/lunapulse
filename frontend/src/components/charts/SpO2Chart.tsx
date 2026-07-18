import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { useSensorStore } from "@/stores/sensorStore";

export function SpO2Chart() {
  const history = useSensorStore((s) => s.spo2History);

  const data = useMemo(() => history, [history]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-2xl border border-border/50 bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Blood Oxygen (SpO₂)</h3>
          <p className="text-xs text-muted-foreground">Oxygen saturation level</p>
        </div>
        <div className="flex h-6 items-center rounded-full bg-chart-spo2/10 px-2.5">
          <span className="text-[11px] font-medium text-chart-spo2">LIVE</span>
        </div>
      </div>

      <div className="h-[200px] w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Waiting for data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spo2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#71717a" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[85, 100]}
                tick={{ fontSize: 10, fill: "#71717a" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#12121a",
                  border: "1px solid #1e1e2e",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f0f0f5",
                }}
                labelStyle={{ color: "#71717a" }}
                formatter={(val: number) => [`${val.toFixed(1)}%`, "SpO₂"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#spo2Gradient)"
                animationDuration={300}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
