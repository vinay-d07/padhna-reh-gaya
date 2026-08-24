"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ code: code.trim() || undefined, topic: topic.trim() || undefined });
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
            <input
              id="join-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3"
              className="rounded-lg border border-ash px-4 py-3 font-mono text-body text-carbon-black outline-none focus:border-carbon-black"
            />
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
          disabled={submitting || (room.needsCode && !code.trim())}
          className="rounded-lg bg-carbon-black px-5 py-3 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {submitting ? "Joining…" : "Join room"}
        </button>
      </form>
    </div>
  );
}
