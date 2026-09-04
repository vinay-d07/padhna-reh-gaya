"use client";

import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import Skeleton from "@/components/Skeleton";

export default function ChatSidebar({ workspaceId, conversations, loading, activeConversationId }) {
  return (
    <aside className="flex h-full w-full flex-col rounded-card bg-paper-white lg:w-[260px] lg:shrink-0">
      <div className="border-b border-ash p-3">
        <Link
          href={`/workspace/${workspaceId}/chat`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-carbon-black px-4 py-2.5 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
        >
          <Plus size={14} />
          New chat
        </Link>
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="font-mono text-caption uppercase text-smoke">
          Conversations · {conversations.length}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {loading ? (
          <div className="flex flex-col gap-2 px-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="mx-2 flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-ash p-6 text-center">
            <MessageSquare size={18} className="text-carbon-black" />
            <span className="text-body-sm text-slate">No conversations yet</span>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <li key={conv.id}>
                  <Link
                    href={`/workspace/${workspaceId}/chat/${conv.id}`}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors ${
                      isActive ? "bg-mist-gray" : "hover:bg-mist-gray"
                    }`}
                  >
                    <MessageSquare size={15} className="shrink-0 text-carbon-black" />
                    <span
                      className={`truncate text-body-sm text-carbon-black ${
                        isActive ? "font-medium" : ""
                      }`}
                    >
                      {conv.title || "New conversation"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
