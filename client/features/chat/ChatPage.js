"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import ChatSidebar from "./components/ChatSidebar";
import ChatPanel from "./components/ChatPanel";
import { listConversations } from "./chat.services";
import { useWorkspaceContext } from "@/features/workspace/WorkspaceContext";

export default function ChatPage({ conversationId = null }) {
  const router = useRouter();
  const { userId } = useAuth();
  const { workspaceId, workspace } = useWorkspaceContext();
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const refreshConversations = useCallback(() => {
    listConversations(workspaceId)
      .then((data) => setConversations(data ?? []))
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;
    listConversations(workspaceId)
      .then((data) => !cancelled && setConversations(data ?? []))
      .catch(() => {})
      .finally(() => !cancelled && setConversationsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const handleConversationChange = (conversation) => {
    setConversations((prev) => [conversation, ...prev.filter((c) => c.id !== conversation.id)]);
    if (conversation.id !== conversationId) {
      router.replace(`/workspace/${workspaceId}/chat/${conversation.id}`);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 lg:flex-row">
      <div className="h-[35vh] lg:h-full">
        <ChatSidebar
          workspaceId={workspaceId}
          conversations={conversations}
          loading={conversationsLoading}
          activeConversationId={conversationId}
        />
      </div>
      <div className="min-h-0 min-w-0 flex-1">
        <ChatPanel
          workspaceId={workspaceId}
          userId={userId}
          workspaceName={workspace?.name}
          conversationId={conversationId}
          onConversationChange={handleConversationChange}
          onMessageSent={refreshConversations}
        />
      </div>
    </div>
  );
}
