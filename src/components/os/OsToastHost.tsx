"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { motionTokens } from "@/lib/motion/spring";
import { selectToasts, useNotificationStore } from "@/store/notifications";

export default function OsToastHost() {
  const toasts = useNotificationStore(selectToasts);
  const dismissToast = useNotificationStore((s) => s.dismissToast);

  return (
    <div
      data-testid="os-toast-host"
      className="pointer-events-none fixed right-3 top-[calc(var(--waybar-h)+0.75rem)] z-[75] flex w-[min(92vw,20rem)] flex-col gap-2 max-md:top-14"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            data-testid={`os-toast-${toast.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: motionTokens.duration.base, ease: motionTokens.easing.easeOut }}
            className="window-glass hairline pointer-events-auto rounded-lg p-3 font-mono shadow-lg"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zaid-text">{toast.title}</p>
                {toast.body && (
                  <p className="mt-0.5 text-[10px] text-zaid-muted">{toast.body}</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
                className="text-zaid-muted hover:text-zaid-text"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
