"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { createConversation, getMessages, sendMessage } from "@/features/chat/chat.services";
import Markdown from "@/features/chat/components/Markdown";
import Skeleton from "@/components/Skeleton";

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

function formatSource(source) {
  const label = source.documentTitle || source.title || "document";
  const page = source.page != null ? ` (p.${source.page})` : "";
  return `${label}${page}`;
}

function fromServerMessage(message) {
  return {
    id: message.id,
    role: message.role === "ASSISTANT" ? "assistant" : "user",
    content: message.content,
    source: message.sources?.length
      ? message.sources.map(formatSource).join(", ")
      : undefined,
  };
}

// conversationId is controlled by the parent (sidebar picks/creates it) —
// this panel just renders whatever conversation it's given, and starts empty
// (id === null) rather than auto-loading the last-used conversation.
export default function ChatPanel({
  workspaceId,
  userId,
  workspaceName,
  conversationId,
  onConversationChange,
  onMessageSent,
}) {
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);
  // Tracks which conversationId the current `messages` state belongs to, so
  // that when handleSend creates a conversation locally and the id is handed
  // back up to the parent, the prop round-tripping back down doesn't trigger
  // a refetch that clobbers the just-streamed messages.
  const loadedRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (conversationId === loadedRef.current) return;
    loadedRef.current = conversationId;

    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setMessagesLoading(true);
    getMessages(conversationId)
      .then((history) => {
        if (cancelled) return;
        setMessages(history.map(fromServerMessage));
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || !userId || !workspaceId) return;

    setInput("");
    setMessages((prev) => [...prev, { id: nextId(), role: "user", content: question }]);
    setIsThinking(true);

    try {
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const conversation = await createConversation(workspaceId);
        activeConversationId = conversation.id;
        loadedRef.current = activeConversationId;
        onConversationChange?.(conversation);
      }

      const assistantId = nextId();
      let streamStarted = false;

      await sendMessage(activeConversationId, question, {
        onToken: (token) => {
          if (!streamStarted) {
            streamStarted = true;
            setIsThinking(false);
            setMessages((prev) => [
              ...prev,
              { id: assistantId, role: "assistant", content: token },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + token } : m
              )
            );
          }
        },
        onDone: (assistantMessage) => {
          setIsThinking(false);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? fromServerMessage(assistantMessage) : m))
          );
          onMessageSent?.();
        },
        onError: (error) => {
          setIsThinking(false);
          setMessages((prev) =>
            prev.some((m) => m.id === assistantId)
              ? prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: error.message || "Something went wrong." }
                    : m
                )
              : [
                  ...prev,
                  {
                    id: assistantId,
                    role: "assistant",
                    content: error.message || "Something went wrong.",
                  },
                ]
          );
        },
      });
    } catch (error) {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          content: error.message || "Something went wrong.",
        },
      ]);
    }
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
        {messagesLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-14 w-2/3 self-end" />
            <Skeleton className="h-20 w-3/4" />
          </div>
        ) : (
          <>
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
          </>
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
    <div className={`animate-fade-in flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-card-lg px-4 py-3 ${
          isUser ? "bg-carbon-black text-paper-white" : "bg-mist-gray text-carbon-black"
        }`}
      >
        {isUser ? (
          <p className="text-body-sm">{message.content}</p>
        ) : (
          <Markdown content={message.content} />
        )}
        {message.source && (
          <p className="mt-2 font-mono text-caption uppercase text-smoke">
            {message.source}
          </p>
        )}
      </div>
    </div>
  );
}
