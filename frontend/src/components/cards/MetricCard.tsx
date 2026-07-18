import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  color?: string;
  pulse?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  subtitle,
  color = "text-primary",
  pulse = false,
  className,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5",
        "hover:border-border-hover hover:bg-card-hover transition-all duration-300",
        "group",
        className
      )}
    >
      {/* Subtle gradient glow */}
      <div
        className={cn(
          "absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20",
          color.replace("text-", "bg-")
        )}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={String(value)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("text-3xl font-bold tracking-tight", color)}
            >
              {value}
            </motion.span>
            {unit && (
              <span className="text-sm font-medium text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            "bg-card-hover border border-border/50",
            color,
            pulse && "animate-pulse-glow"
          )}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
