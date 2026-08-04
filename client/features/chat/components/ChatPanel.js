"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

export default function ChatPanel({ workspaceName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { id: nextId(), role: "user", content: question }]);
    setInput("");
    setIsThinking(true);

    // Chat has no backend wired up yet — this simulates a RAG-style reply.
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          content:
            "Once documents are uploaded, I'll retrieve the relevant passages and answer this from your workspace instead of guessing.",
          source: "workspace not wired to chat backend yet",
        },
      ]);
      setIsThinking(false);
    }, 700);
  };

  return (
    <div className="flex h-full flex-col rounded-card bg-paper-white">
      <div className="flex items-center gap-2 border-b border-ash px-5 py-4">
        <Sparkles size={16} className="text-carbon-black" />
        <h3 className="font-sans text-body-sm font-medium uppercase text-carbon-black">
          Chat {workspaceName ? `· ${workspaceName}` : ""}
        </h3>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-body-sm text-slate">
              Ask a question about the documents in this workspace.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {isThinking && (
          <div className="max-w-[80%] rounded-card-lg bg-mist-gray px-4 py-3">
            <p className="font-mono text-caption uppercase text-smoke">thinking…</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-ash px-5 py-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your documents anything…"
          className="flex-1 rounded-lg border border-ash px-4 py-3 text-body-sm text-carbon-black outline-none focus:border-carbon-black"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-carbon-black text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-card-lg px-4 py-3 ${
          isUser ? "bg-carbon-black text-paper-white" : "bg-mist-gray text-carbon-black"
        }`}
      >
        <p className="text-body-sm">{message.content}</p>
        {message.source && (
          <p className="mt-2 font-mono text-caption uppercase text-smoke">
            {message.source}
          </p>
        )}
      </div>
    </div>
  );
}
