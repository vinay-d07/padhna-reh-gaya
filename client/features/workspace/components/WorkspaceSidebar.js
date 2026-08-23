"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";

const TABS = [
  { id: "conversations", label: "Chats" },
  { id: "documents", label: "Docs" },
];

export default function WorkspaceSidebar({
  workspaceId,
  workspaceName,
  documents = [],
  conversations = [],
  conversationsLoading = false,
  activeConversationId,
  selectedDocumentId,
  sidebarTab = "documents",
  onSidebarTabChange,
  collapsed = false,
  onToggleCollapse,
  onAddClick,
  onRename,
  onDelete,
  onSelectDocument,
  onSelectConversation,
  onNewChat,
  dueReviewCount = 0,
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(workspaceName);

  const startEditing = () => {
    setDraftName(workspaceName);
    setEditing(true);
  };

  const commitRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== workspaceName) {
      onRename?.(trimmed);
    }
    setEditing(false);
  };

  if (collapsed) {
    return (
      <aside className="flex h-full flex-col items-center gap-2 rounded-card bg-paper-white py-4">
        <button
          onClick={onToggleCollapse}
          aria-label="Expand sidebar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black"
        >
          <PanelLeftOpen size={16} />
        </button>

        <Link
          href="/dashboard"
          aria-label="Dashboard"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black"
        >
          <ArrowLeft size={16} />
        </Link>

        <Link
          href={`/workspace/${workspaceId}/review`}
          aria-label="Study"
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black"
        >
          <GraduationCap size={16} />
          {dueReviewCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-carbon-black px-1 font-mono text-[10px] text-paper-white">
              {dueReviewCount > 99 ? "99+" : dueReviewCount}
            </span>
          )}
        </Link>

        <div className="my-1 h-px w-8 shrink-0 bg-ash" />

        <button
          onClick={onAddClick}
          aria-label="Add document"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-carbon-black text-paper-white transition-opacity hover:opacity-80"
        >
          <Plus size={14} />
        </button>

        <ul className="flex w-full flex-1 flex-col items-center gap-1.5 overflow-y-auto pt-2">
          {documents.map((doc) => {
            const label = doc.title || doc.fileName;
            const isFailed = doc.status === "FAILED";
            return (
              <li key={doc.id} title={label}>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-mist-gray ${
                    isFailed ? "text-red-500" : "text-carbon-black"
                  }`}
                >
                  <FileText size={15} />
                </span>
              </li>
            );
          })}
        </ul>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col rounded-card bg-paper-white">
      <div className="border-b border-ash px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-body-sm text-slate transition-colors hover:text-carbon-black"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <button
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

        <Link
          href={`/workspace/${workspaceId}/review`}
          className="flex items-center justify-between rounded-lg bg-mist-gray px-3 py-2 text-body-sm font-medium text-carbon-black transition-colors hover:bg-ash/60"
        >
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap size={14} />
            Study
          </span>
          {dueReviewCount > 0 && (
            <span className="rounded-full bg-carbon-black px-1.5 py-0.5 font-mono text-[10px] text-paper-white">
              {dueReviewCount > 99 ? "99+" : dueReviewCount} due
            </span>
          )}
        </Link>

        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditing(false);
              }}
              className="min-w-0 flex-1 rounded-lg border border-ash px-2 py-1 text-subheading-lg font-medium text-carbon-black outline-none focus:border-carbon-black"
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitRename}
              aria-label="Save name"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-carbon-black hover:bg-mist-gray"
            >
              <Check size={15} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setEditing(false)}
              aria-label="Cancel"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate hover:bg-mist-gray"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-1.5">
            <h2 className="truncate font-sans text-subheading-lg font-medium text-carbon-black">
              {workspaceName}
            </h2>
            <button
              onClick={startEditing}
              aria-label="Rename workspace"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate opacity-0 transition-opacity hover:text-carbon-black group-hover:opacity-100"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete workspace"
              className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onSidebarTabChange?.(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors ${
              sidebarTab === t.id
                ? "bg-mist-gray text-carbon-black"
                : "text-slate hover:bg-mist-gray/60 hover:text-carbon-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sidebarTab === "documents" ? (
        <DocumentsTab
          documents={documents}
          selectedDocumentId={selectedDocumentId}
          onAddClick={onAddClick}
          onSelectDocument={onSelectDocument}
        />
      ) : (
        <ConversationsTab
          conversations={conversations}
          loading={conversationsLoading}
          activeConversationId={activeConversationId}
          onSelectConversation={onSelectConversation}
          onNewChat={onNewChat}
        />
      )}
    </aside>
  );
}

function DocumentsTab({ documents, selectedDocumentId, onAddClick, onSelectDocument }) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="font-mono text-caption uppercase text-smoke">
          Documents · {documents.length}
        </h3>
        <button
          onClick={onAddClick}
          aria-label="Add document"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-carbon-black text-paper-white transition-opacity hover:opacity-80"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {documents.length === 0 ? (
          <button
            onClick={onAddClick}
            className="mx-2 flex w-[calc(100%-1rem)] flex-col items-center gap-2 rounded-lg border-2 border-dashed border-ash p-6 text-center transition-colors hover:border-carbon-black"
          >
            <Plus size={18} className="text-carbon-black" />
            <span className="text-body-sm text-slate">Add your first document</span>
          </button>
        ) : (
          <ul className="flex flex-col gap-1">
            {documents.map((doc) => {
              const label = doc.title || doc.fileName;
              const isUploading = doc.status === "UPLOADING";
              const isFailed = doc.status === "FAILED";
              const isSelected = doc.id === selectedDocumentId;
              return (
                <li key={doc.id}>
                  <button
                    onClick={() => onSelectDocument?.(doc)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-mist-gray" : "hover:bg-mist-gray"
                    }`}
                  >
                    <FileText
                      size={15}
                      className={`shrink-0 ${isFailed ? "text-red-500" : "text-carbon-black"}`}
                    />
                    <span
                      className={`truncate text-body-sm ${
                        isFailed ? "text-red-500" : "text-carbon-black"
                      } ${isSelected ? "font-medium" : ""}`}
                    >
                      {label}
                    </span>
                    {isUploading && (
                      <span className="ml-auto shrink-0 font-mono text-caption text-smoke">
                        Uploading…
                      </span>
                    )}
                    {isFailed && (
                      <span className="ml-auto shrink-0 font-mono text-caption text-red-500">
                        Failed
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function ConversationsTab({ conversations, loading, activeConversationId, onSelectConversation, onNewChat }) {
  return (
    <>
      <div className="px-3 pt-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-carbon-black px-4 py-2.5 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
        >
          <Plus size={14} />
          New chat
        </button>
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
                  <button
                    onClick={() => onSelectConversation?.(conv.id)}
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
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
