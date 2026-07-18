import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useAlertStore } from "@/stores/alertStore";
import { cn, relativeTime, severityColor, severityBg } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export function AlertTimeline() {
  const alerts = useAlertStore((s) => s.alerts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top smoothly when a new alert is added
  useEffect(() => {
    if (scrollRef.current && alerts.length > 0) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [alerts[0]?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="rounded-2xl border border-border/50 bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Alert Timeline</h3>
          <p className="text-xs text-muted-foreground">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""} detected
          </p>
        </div>
        <AlertTriangle className="h-4 w-4 text-warning" />
      </div>

      <div ref={scrollRef} className="max-h-[400px] space-y-2 overflow-y-auto scrollbar-thin pr-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card-hover">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No anomalies detected</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Alerts will appear here when anomalies are found
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {alerts.map((alert) => {
              const isExpanded = expandedId === alert.id;

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "rounded-xl border p-3 cursor-pointer transition-colors",
                    severityBg(alert.severity)
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            severityColor(alert.severity)
                          )}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {(alert.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed truncate">
                        {alert.reason}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {relativeTime(alert.timestamp)}
                      </span>
                      {alert.llm_response ? (
                        isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        )
                      ) : null}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && alert.llm_response && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <div className="prose prose-invert prose-sm max-w-none text-xs">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <span className="text-muted-foreground leading-relaxed block mb-2 last:mb-0">{children}</span>,
                                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                ul: ({ children }) => <ul className="text-muted-foreground space-y-1 list-disc list-inside mb-2">{children}</ul>,
                                li: ({ children }) => <li>{children}</li>,
                              }}
                            >
                              {alert.llm_response}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
