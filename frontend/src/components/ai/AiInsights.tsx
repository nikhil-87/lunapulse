import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, History, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLLMStore } from "@/stores/llmStore";
import { cn } from "@/lib/utils";

export function AiInsights() {
  const { isStreaming, currentTokens, history, streamingAlertId } = useLLMStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-scroll to top during streaming so the new insight remains fully visible
  useEffect(() => {
    if (scrollRef.current && isStreaming) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentTokens, isStreaming]);

  const displayHistory = history.filter(item => item.alertId !== streamingAlertId);
  const hasContent = currentTokens.length > 0 || displayHistory.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-border/50 bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">AI Insights</h3>
            <p className="text-xs text-muted-foreground">
              {/* Powered by AI */}
            </p>
          </div>
        </div>
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-[11px] font-medium text-primary">Analyzing</span>
          </motion.div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="max-h-[400px] overflow-y-auto scrollbar-thin pr-1"
      >
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/5">
              <Sparkles className="h-5 w-5 text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              AI analysis will appear here
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              When anomalies are detected, Gemini will provide real-time insights
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current streaming response */}
            {currentTokens && (
              <div className="rounded-xl bg-card-hover/50 border border-border/30 p-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="text-xs leading-relaxed text-foreground/80 mb-2 last:mb-0">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">
                          {children}
                        </strong>
                      ),
                      ul: ({ children }) => (
                        <ul className="text-xs space-y-1 list-disc list-inside text-foreground/80 mb-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="text-xs space-y-1 list-decimal list-inside text-foreground/80 mb-2">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-xs text-foreground/80">{children}</li>
                      ),
                    }}
                  >
                    {currentTokens}
                  </ReactMarkdown>
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-typing-cursor" />
                  )}
                </div>
              </div>
            )}

            {/* History */}
            {displayHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <History className="h-3 w-3" />
                  <span>Previous insights</span>
                </div>
                {displayHistory.slice(0, 5).map((item, i) => {
                  const isExpanded = expandedId === item.alertId;
                  return (
                  <motion.div
                    key={`${item.alertId}-${i}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "rounded-lg bg-card-hover/30 border border-border/20 p-3 cursor-pointer transition-colors",
                      "text-xs text-muted-foreground leading-relaxed hover:bg-card-hover/50"
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : item.alertId)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                        Insight Record
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3 text-muted-foreground/60" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className={cn(
                      "prose prose-invert prose-sm max-w-none text-xs",
                      !isExpanded && "line-clamp-3"
                    )}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <span className="text-muted-foreground leading-relaxed block mb-2 last:mb-0">{children}</span>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          ul: ({ children }) => <ul className="text-muted-foreground space-y-1 list-disc list-inside mb-2">{children}</ul>,
                          li: ({ children }) => <li>{children}</li>,
                        }}
                      >
                        {item.response}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                )})}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
