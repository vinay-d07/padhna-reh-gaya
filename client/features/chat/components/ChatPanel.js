"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Search, Copy, RotateCw, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { createConversation, getMessages, sendMessage } from "@/features/chat/chat.services";
import { getWorkspaceDocuments } from "@/features/workspace/workspace.services";
import Markdown from "@/features/chat/components/Markdown";
import Skeleton from "@/components/Skeleton";
import { useToast } from "@/providers/ToastProvider";

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

function sourceLabel(source) {
  const label = source.documentTitle || source.title || "document";
  const page = source.page != null ? ` · p.${source.page}` : "";
  return `${label}${page}`;
}

function fromServerMessage(message) {
  return {
    id: message.id,
    role: message.role === "ASSISTANT" ? "assistant" : "user",
    content: message.content,
    sources: message.sources?.length ? message.sources : undefined,
  };
}

function starterQuestions(documents) {
  const readyDoc = documents?.find((d) => d.status === "READY");
  const base = ["What are the key ideas here?", "Summarize this for me"];
  if (readyDoc) {
    const label = readyDoc.title || readyDoc.fileName;
    return [`Summarize "${label}"`, "What are the key ideas here?", "Quiz me on the main points"];
  }
  return base;
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
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState("");
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const scrollRef = useRef(null);
  // Tracks which conversationId the current `messages` state belongs to, so
  // that when handleSend creates a conversation locally and the id is handed
  // back up to the parent, the prop round-tripping back down doesn't trigger
  // a refetch that clobbers the just-streamed messages.
  const loadedRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isRetrieving]);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspaceDocuments(workspaceId)
      .then((docs) => setDocuments(docs ?? []))
      .catch(() => {});
  }, [workspaceId]);

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

  // Shared by both a normal send and "Regenerate" — `replaceAssistantId`
  // swaps an existing bubble's content in place instead of appending a new
  // one, so regenerating doesn't leave the old answer sitting above the new
  // one. The backend still logs a fresh user message either way (there's no
  // dedicated regenerate endpoint), it's just not re-rendered as a new bubble.
  const askQuestion = async (question, { replaceAssistantId } = {}) => {
    if (!question || !userId || !workspaceId) return;

    setIsRetrieving(true);

    try {
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const conversation = await createConversation(workspaceId);
        activeConversationId = conversation.id;
        loadedRef.current = activeConversationId;
        onConversationChange?.(conversation);
      }

      const assistantId = replaceAssistantId || nextId();
      let streamStarted = false;

      await sendMessage(activeConversationId, question, {
        onToken: (token) => {
          if (!streamStarted) {
            streamStarted = true;
            setIsRetrieving(false);
            setStreamingId(assistantId);
            setMessages((prev) => {
              const freshMessage = { id: assistantId, role: "assistant", content: token };
              // Regenerate reuses the existing bubble's id — replace it in
              // place so the answer doesn't jump to the bottom of the
              // conversation; a normal send has no existing match, so this
              // just appends.
              const existingIndex = prev.findIndex((m) => m.id === assistantId);
              if (existingIndex === -1) return [...prev, freshMessage];
              return prev.map((m, i) => (i === existingIndex ? freshMessage : m));
            });
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + token } : m
              )
            );
          }
        },
        onDone: (assistantMessage) => {
          setIsRetrieving(false);
          setStreamingId(null);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? fromServerMessage(assistantMessage) : m))
          );
          onMessageSent?.();
        },
        onError: (error) => {
          setIsRetrieving(false);
          setStreamingId(null);
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
      setIsRetrieving(false);
      setStreamingId(null);
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

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput("");
    setMessages((prev) => [...prev, { id: nextId(), role: "user", content: question }]);
    await askQuestion(question);
  };

  const handleStarterClick = (question) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", content: question }]);
    askQuestion(question);
  };

  const handleRegenerate = (assistantId) => {
    const index = messages.findIndex((m) => m.id === assistantId);
    const priorUser = [...messages.slice(0, index)].reverse().find((m) => m.role === "user");
    if (!priorUser) return;
    askQuestion(priorUser.content, { replaceAssistantId: assistantId });
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      showToast({ message: "Copied to clipboard.", duration: 2000 });
    } catch {
      showToast({ message: "Couldn't copy — try selecting the text manually.", tone: "error" });
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
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="text-body-sm text-slate">
                  Ask a question about the documents in this workspace.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {starterQuestions(documents).map((question) => (
                    <button
                      key={question}
                      onClick={() => handleStarterClick(question)}
                      className="rounded-full border border-ash px-3.5 py-2 text-caption text-carbon-black transition-colors hover:border-carbon-black hover:bg-mist-gray"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                isStreaming={streamingId === message.id}
                onCopy={() => handleCopy(message.content)}
                onRegenerate={() => handleRegenerate(message.id)}
              />
            ))}

            {isRetrieving && (
              <div className="flex max-w-[80%] items-center gap-2 rounded-card-lg bg-mist-gray px-4 py-3">
                <Search size={13} className="animate-pulse text-smoke" />
                <p className="font-mono text-caption uppercase text-smoke">
                  Reading your documents…
                </p>
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

function ChatBubble({ message, isStreaming, onCopy, onRegenerate }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [expandedSource, setExpandedSource] = useState(null);
  const { showToast } = useToast();

  const handleCopyClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFeedback = (value) => {
    setFeedback(value);
    showToast({ message: "Thanks for the feedback!", duration: 2000 });
  };

  return (
    <div className={`animate-fade-in flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] rounded-card-lg px-4 py-3 ${
          isUser ? "bg-carbon-black text-paper-white" : "bg-mist-gray text-carbon-black"
        }`}
      >
        {isUser ? (
          <p className="text-body-sm">{message.content}</p>
        ) : (
          <>
            <Markdown content={message.content} />
            {isStreaming && (
              <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-carbon-black align-middle" />
            )}
          </>
        )}
      </div>

      {!isUser && !isStreaming && message.content && (
        <div className="mt-1.5 flex items-center gap-1">
          <button
            onClick={handleCopyClick}
            aria-label="Copy answer"
            title="Copy answer"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <button
            onClick={onRegenerate}
            aria-label="Regenerate answer"
            title="Regenerate answer"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black"
          >
            <RotateCw size={13} />
          </button>
          <button
            onClick={() => handleFeedback("up")}
            aria-label="Helpful"
            title="Helpful"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-mist-gray ${
              feedback === "up" ? "text-emerald-600" : "text-slate hover:text-carbon-black"
            }`}
          >
            <ThumbsUp size={13} />
          </button>
          <button
            onClick={() => handleFeedback("down")}
            aria-label="Not helpful"
            title="Not helpful"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-mist-gray ${
              feedback === "down" ? "text-red-600" : "text-slate hover:text-carbon-black"
            }`}
          >
            <ThumbsDown size={13} />
          </button>
        </div>
      )}

      {!isUser && message.sources?.length > 0 && (
        <div className="mt-2 flex max-w-[80%] flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((source, i) => (
              <button
                key={i}
                onClick={() => setExpandedSource((prev) => (prev === i ? null : i))}
                className={`rounded-full border px-2.5 py-1 text-caption transition-colors ${
                  expandedSource === i
                    ? "border-carbon-black bg-carbon-black text-paper-white"
                    : "border-ash text-slate hover:border-carbon-black hover:text-carbon-black"
                }`}
              >
                [{i + 1}] {sourceLabel(source)}
              </button>
            ))}
          </div>
          {expandedSource != null && message.sources[expandedSource]?.snippet && (
            <blockquote className="rounded-lg border-l-2 border-mint-chip bg-mint-chip/10 px-3 py-2.5 text-body-sm italic text-slate">
              &ldquo;{message.sources[expandedSource].snippet}&rdquo;
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
}
