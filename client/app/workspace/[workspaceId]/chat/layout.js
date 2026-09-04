"use client";

import { useParams } from "next/navigation";
import ChatPage from "@/features/chat/ChatPage";

// Owns the actual chat UI so it survives the /chat -> /chat/[conversationId]
// navigation that happens mid-send (see ChatPage's handleConversationChange,
// which router.replace()s here as soon as a new conversation is created).
// A layout persists across changes to its own leaf page — the sibling
// page.js files render nothing; this is what actually renders, reading the
// conversation id straight from the URL so an in-flight stream never gets
// orphaned by a remount.
export default function ChatLayout() {
  const { conversationId } = useParams();
  return <ChatPage conversationId={conversationId ?? null} />;
}
