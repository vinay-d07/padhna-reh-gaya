"use client";

import { useEffect, useRef, useState } from "react";
import { Send, SmilePlus } from "lucide-react";

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Kept to a small fixed set — a full emoji picker is more chrome than a
// "keep going" reaction in a study room chat needs.
const QUICK_REACTIONS = ["🔥", "👏", "💪", "😂", "❤️"];

export default function RoomChat({ messages, onSend, onReact, myUserId }) {
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
              <RoomMessageItem key={m.id} message={m} myUserId={myUserId} onReact={onReact} />
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

function RoomMessageItem({ message, myUserId, onReact }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, userIds]) => userIds?.length);

  return (
    <li className="group relative">
      <div className="flex items-baseline gap-1.5">
        <span className="text-body-sm font-medium text-carbon-black">
          {message.userId === myUserId ? "You" : message.name || "Someone"}
        </span>
        <span className="font-mono text-[11px] text-smoke">{formatTime(message.createdAt)}</span>
        {onReact && (
          <div className="relative ml-auto">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              aria-label="Add reaction"
              className="flex h-6 w-6 items-center justify-center rounded-md text-smoke opacity-0 transition-opacity hover:bg-mist-gray hover:text-carbon-black group-hover:opacity-100"
            >
              <SmilePlus size={13} />
            </button>
            {pickerOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 flex items-center gap-1 rounded-lg border border-ash bg-paper-white p-1.5 shadow-lg">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message.id, emoji);
                      setPickerOpen(false);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-body-sm transition-colors hover:bg-mist-gray"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-body-sm text-slate">{message.content}</p>
      {reactionEntries.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {reactionEntries.map(([emoji, userIds]) => {
            const reactedByMe = userIds.includes(myUserId);
            return (
              <button
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-caption transition-colors ${
                  reactedByMe
                    ? "border-carbon-black bg-mist-gray text-carbon-black"
                    : "border-ash text-slate hover:border-carbon-black hover:text-carbon-black"
                }`}
              >
                {emoji} {userIds.length}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}
