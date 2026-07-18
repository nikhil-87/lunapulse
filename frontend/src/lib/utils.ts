import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function severityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: "text-critical",
    high: "text-high",
    medium: "text-medium",
    low: "text-low",
  };
  return colors[severity] ?? "text-muted";
}

export function severityBg(severity: string): string {
  const colors: Record<string, string> = {
    critical: "bg-critical/15 border-critical/30",
    high: "bg-high/15 border-high/30",
    medium: "bg-medium/15 border-medium/30",
    low: "bg-low/15 border-low/30",
  };
  return colors[severity] ?? "bg-muted/15 border-muted/30";
}
