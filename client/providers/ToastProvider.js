"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Check, RotateCcw, X, AlertCircle } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const DEFAULT_DURATION = 6000;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeouts = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timeouts.current[id]);
    delete timeouts.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, tone = "default", actionLabel, onAction, duration = DEFAULT_DURATION }) => {
      const id = `toast-${Date.now()}-${idCounter++}`;
      setToasts((prev) => [...prev, { id, message, tone, actionLabel, onAction }]);
      timeouts.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  // Convenience wrapper for the common "delete something, offer Undo" flow —
  // fires the toast, and if the user clicks Undo, calls onUndo and swallows
  // any error into an error toast rather than letting it get lost.
  const showUndoToast = useCallback(
    (message, onUndo) => {
      const id = showToast({
        message,
        actionLabel: "Undo",
        onAction: async () => {
          try {
            await onUndo();
          } catch {
            showToast({ message: "Couldn't undo that — try again.", tone: "error" });
          }
        },
      });
      return id;
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showUndoToast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-6">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const { message, tone, actionLabel, onAction } = toast;
  const Icon = tone === "error" ? AlertCircle : Check;

  return (
    <div className="animate-fade-in pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg bg-carbon-black px-4 py-3 text-paper-white shadow-lg">
      <Icon size={16} className={tone === "error" ? "shrink-0 text-red-400" : "shrink-0 text-mint-chip"} />
      <p className="flex-1 text-body-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={() => {
            onAction();
            onDismiss();
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-paper-white/10 px-2.5 py-1.5 text-caption font-medium uppercase transition-colors hover:bg-paper-white/20"
        >
          <RotateCcw size={11} />
          {actionLabel}
        </button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-paper-white/60 transition-colors hover:bg-paper-white/10 hover:text-paper-white"
      >
        <X size={13} />
      </button>
    </div>
  );
}
