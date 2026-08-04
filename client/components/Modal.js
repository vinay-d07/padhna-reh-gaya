"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-carbon-black/60"
      />

      <div className="relative w-full max-w-lg rounded-card-lg bg-paper-white p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          {title && (
            <h2 className="font-display text-heading-sm uppercase text-carbon-black">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ash text-slate transition-colors hover:border-carbon-black hover:text-carbon-black"
          >
            <X size={16} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
