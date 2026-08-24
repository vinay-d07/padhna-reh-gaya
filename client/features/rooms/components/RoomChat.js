"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function RoomChat({ messages, onSend, myUserId }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      await onSend(content);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-80 flex-col rounded-card bg-paper-white p-4">
      <p className="mb-3 font-mono text-caption uppercase text-smoke">Chat</p>

      <div ref={listRef} className="flex-1 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-body-sm text-slate">No messages yet — say hi.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {messages.map((m) => (
              <li key={m.id}>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-body-sm font-medium text-carbon-black">
                    {m.userId === myUserId ? "You" : m.name || "Someone"}
                  </span>
                  <span className="font-mono text-[11px] text-smoke">{formatTime(m.createdAt)}</span>
                </div>
                <p className="text-body-sm text-slate">{m.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something…"
          maxLength={1000}
          className="min-w-0 flex-1 rounded-lg border border-ash px-3 py-2 text-body-sm text-carbon-black outline-none focus:border-carbon-black"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-carbon-black text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
