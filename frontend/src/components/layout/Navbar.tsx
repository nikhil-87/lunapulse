import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Sun, Moon, Wifi, WifiOff, Clock } from "lucide-react";
import { useConnectionStore } from "@/stores/connectionStore";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types";

export function Navbar() {
  const status = useConnectionStore((s) => s.status);
  const latency = useConnectionStore((s) => s.latency);
  const [time, setTime] = useState(new Date());
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  const statusConfig = {
    connected: { color: "bg-success", label: "Connected", Icon: Wifi },
    connecting: { color: "bg-warning", label: "Connecting...", Icon: Wifi },
    disconnected: { color: "bg-danger", label: "Disconnected", Icon: WifiOff },
    error: { color: "bg-danger", label: "Error", Icon: WifiOff },
  };

  const { color, label, Icon } = statusConfig[status];

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                "bg-primary/10 text-primary"
              )}
            >
              <Activity className="h-5 w-5" />
            </motion.div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                Luna<span className="text-primary">Pulse</span>
              </h1>
              <p className="text-[11px] text-muted-foreground leading-none">
                Wearable Intelligence
              </p>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 text-xs">
              <div className="relative flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    color,
                    status === "connected" && "animate-pulse-glow"
                  )}
                />
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground hidden sm:inline">{label}</span>
              </div>
            </div>

            {/* Latency */}
            {status === "connected" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs text-muted-foreground"
              >
                <span className="font-mono">{latency}ms</span>
              </motion.div>
            )}

            {/* Time */}
            <div className="hidden md:flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono">
                {time.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                "bg-card hover:bg-card-hover transition-colors",
                "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Toggle theme"
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === "dark" ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </motion.div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
