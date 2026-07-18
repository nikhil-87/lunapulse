import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { useSensorStore } from "@/stores/sensorStore";

export function AccelerometerChart() {
  const history = useSensorStore((s) => s.accelerometerHistory);

  const data = useMemo(() => history, [history]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-border/50 bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Accelerometer</h3>
          <p className="text-xs text-muted-foreground">3-axis motion tracking</p>
        </div>
        <div className="flex h-6 items-center rounded-full bg-chart-accel-x/10 px-2.5">
          <span className="text-[11px] font-medium text-chart-accel-x">LIVE</span>
        </div>
      </div>

      <div className="h-[200px] w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Waiting for data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#71717a" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
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
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "#71717a" }}
              />
              <Line
                type="monotone"
                dataKey="x"
                name="X"
                stroke="#22c55e"
                strokeWidth={1.5}
                dot={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="y"
                name="Y"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="z"
                name="Z"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
