import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3",
        "hover:border-border-hover transition-colors",
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card-hover text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <motion.p
          key={String(value)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-semibold truncate"
        >
          {value}
        </motion.p>
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
      </div>
    </motion.div>
  );
}
