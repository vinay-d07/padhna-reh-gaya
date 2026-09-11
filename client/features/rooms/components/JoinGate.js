"use client";

import { useState } from "react";
import { Lock, Check, AlertCircle } from "lucide-react";

// Rooms only ever generate 6-character hex codes (see backend
// rooms/services.js randomCode) — used here purely for live "does this look
// right yet" feedback as the user types, not as a hard client-side gate;
// the server still has the final say on whether the code actually matches.
const CODE_PATTERN = /^[0-9A-F]{6}$/;

// Shown before a client actually joins a room — every room asks "what are
// you studying?" here, and a private room additionally requires its code.
export default function JoinGate({ room, defaultCode = "", onSubmit }) {
  // Seeded from the lobby's "have a code?" lookup — carried through even
  // when needsCode is false (the code already unlocked the preview) so it
  // still reaches the actual join call.
  const [code, setCode] = useState(defaultCode);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const trimmedCode = code.trim();
  const codeLooksValid = CODE_PATTERN.test(trimmedCode);
  const codeHasInvalidChars = trimmedCode.length > 0 && /[^0-9A-F]/.test(trimmedCode);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ code: trimmedCode || undefined, topic: topic.trim() || undefined });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't join this room.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-2 rounded-card bg-paper-white p-6">
      <h1 className="font-display text-heading-sm uppercase text-carbon-black">{room.name}</h1>
      {room.description && <p className="text-body-sm text-slate">{room.description}</p>}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        {room.needsCode && (
          <div className="flex flex-col gap-2">
            <label htmlFor="join-code" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-slate">
              <Lock size={13} />
              Join code
            </label>
            <div className="relative">
              <input
                id="join-code"
                autoFocus
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="e.g. A1B2C3"
                maxLength={6}
                aria-invalid={codeHasInvalidChars || undefined}
                className={`w-full rounded-lg border px-4 py-3 pr-10 font-mono text-body text-carbon-black outline-none ${
                  codeHasInvalidChars
                    ? "border-red-400 focus:border-red-500"
                    : "border-ash focus:border-carbon-black"
                }`}
              />
              {trimmedCode.length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {codeLooksValid ? (
                    <Check size={15} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={15} className="text-smoke" />
                  )}
                </span>
              )}
            </div>
            <p className={`text-caption ${codeHasInvalidChars ? "text-red-600" : "text-smoke"}`}>
              {codeHasInvalidChars
                ? "Codes only use letters A–F and digits 0–9."
                : "6-character code, e.g. A1B2C3."}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="join-topic" className="text-body-sm font-medium text-slate">
            What are you studying?
          </label>
          <input
            id="join-topic"
            autoFocus={!room.needsCode}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Organic chemistry (optional)"
            maxLength={120}
            className="rounded-lg border border-ash px-4 py-3 text-body text-carbon-black outline-none focus:border-carbon-black"
          />
        </div>

        {error && <p className="text-body-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || (room.needsCode && !codeLooksValid)}
          className="rounded-lg bg-carbon-black px-5 py-3 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {submitting ? "Joining…" : "Join room"}
        </button>
      </form>
    </div>
  );
}
