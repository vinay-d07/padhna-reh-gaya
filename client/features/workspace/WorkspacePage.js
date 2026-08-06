"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { FileText, Sparkles, Layers } from "lucide-react";
import WorkspaceSidebar from "./components/WorkspaceSidebar";
import ChatPanel from "@/features/chat/components/ChatPanel";
import NotesPanel from "@/features/notes/components/NotesPanel";
import SummaryView from "@/features/documents/components/SummaryView";
import FlashcardsView from "@/features/documents/components/FlashcardsView";
import UploadModal from "@/features/uploads/components/UploadModal";
import Dropdown from "@/components/Dropdown";
import Skeleton from "@/components/Skeleton";
import { uploadDocument } from "@/features/uploads/uploads.services";
import { listConversations } from "@/features/chat/chat.services";
import {
  getWorkspace,
  getWorkspaceDocuments,
  updateWorkspace,
  deleteWorkspace,
} from "./workspace.services";

let localDocId = 0;

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const MIN_NOTES_WIDTH = 280;
const MAX_NOTES_WIDTH = 560;
const DEFAULT_NOTES_WIDTH = 360;
const NOTES_RESIZE_STEP = 24;

const RIGHT_PANEL_OPTIONS = [
  { value: "notes", label: "Notes", icon: <FileText size={14} /> },
  { value: "summary", label: "Summary", icon: <Sparkles size={14} /> },
  { value: "flashcards", label: "Flashcards", icon: <Layers size={14} /> },
];

export default function WorkspacePage({ workspaceId }) {
  const router = useRouter();
  const { userId } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [sidebarTab, setSidebarTab] = useState("documents");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState("notes");

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notesWidth, setNotesWidth] = useState(DEFAULT_NOTES_WIDTH);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results = await Promise.allSettled([
        getWorkspace(workspaceId),
        getWorkspaceDocuments(workspaceId),
        listConversations(workspaceId),
      ]);

      if (cancelled) return;

      if (results[0].status === "fulfilled") setWorkspace(results[0].value ?? null);
      if (results[1].status === "fulfilled") setDocuments(results[1].value ?? []);
      if (results[2].status === "fulfilled") setConversations(results[2].value ?? []);

      setConversationsLoading(false);
      setPageLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const refreshConversations = useCallback(() => {
    listConversations(workspaceId)
      .then((data) => setConversations(data ?? []))
      .catch(() => {});
  }, [workspaceId]);

  const handleUpload = (files) => {
    if (!userId) return;

    files.forEach((file) => {
      const localId = `local-${localDocId++}`;
      setDocuments((prev) => [
        { id: localId, title: file.name, fileName: file.name, status: "UPLOADING" },
        ...prev,
      ]);

      uploadDocument(workspaceId, file)
        .then((document) => {
          setDocuments((prev) => prev.map((doc) => (doc.id === localId ? document : doc)));
        })
        .catch(() => {
          setDocuments((prev) =>
            prev.map((doc) => (doc.id === localId ? { ...doc, status: "FAILED" } : doc))
          );
        });
    });
  };

  const handleRename = async (name) => {
    setWorkspace((prev) => (prev ? { ...prev, name } : prev));
    updateWorkspace(workspaceId, { name }).catch(() => {});
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this workspace? This can't be undone.")) return;
    try {
      await deleteWorkspace(workspaceId);
    } finally {
      router.push("/dashboard");
    }
  };

  // Picking a document is most often "I want to study this one", so jump the
  // right panel to Summary unless the user is actively taking notes.
  const handleSelectDocument = (doc) => {
    setSelectedDocument(doc);
    setRightPanelTab((tab) => (tab === "notes" ? "summary" : tab));
  };

  const handleConversationChange = (conversation) => {
    setActiveConversationId(conversation.id);
    setConversations((prev) => [conversation, ...prev.filter((c) => c.id !== conversation.id)]);
  };

  const handleNotesResizeStart = useCallback((e) => {
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - moveEvent.clientX;
      setNotesWidth(Math.min(MAX_NOTES_WIDTH, Math.max(MIN_NOTES_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleNotesResizeKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setNotesWidth((w) => Math.min(MAX_NOTES_WIDTH, w + NOTES_RESIZE_STEP));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setNotesWidth((w) => Math.max(MIN_NOTES_WIDTH, w - NOTES_RESIZE_STEP));
    }
  };

  const workspaceName = workspace?.name || "Workspace";

  if (pageLoading) {
    return <WorkspacePageSkeleton />;
  }

  return (
    <div className="h-screen bg-warm-canvas p-4">
      <div
        ref={containerRef}
        className="flex h-full flex-col gap-4 lg:flex-row lg:gap-0"
        style={{
          "--sidebar-w": `${sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`,
          "--notes-w": `${notesWidth}px`,
        }}
      >
        <div className="h-[70vh] transition-[width] duration-200 lg:h-full lg:w-[var(--sidebar-w)] lg:shrink-0 lg:mr-4">
          <WorkspaceSidebar
            workspaceName={workspaceName}
            documents={documents}
            conversations={conversations}
            conversationsLoading={conversationsLoading}
            activeConversationId={activeConversationId}
            selectedDocumentId={selectedDocument?.id}
            sidebarTab={sidebarTab}
            onSidebarTabChange={setSidebarTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            onAddClick={() => setUploadModalOpen(true)}
            onRename={handleRename}
            onDelete={handleDelete}
            onSelectDocument={handleSelectDocument}
            onSelectConversation={setActiveConversationId}
            onNewChat={() => setActiveConversationId(null)}
          />
        </div>

        <div className="h-[70vh] min-w-0 lg:h-full lg:flex-1">
          <ChatPanel
            workspaceId={workspaceId}
            userId={userId}
            workspaceName={workspaceName}
            conversationId={activeConversationId}
            onConversationChange={handleConversationChange}
            onMessageSent={refreshConversations}
          />
        </div>

        <div
          onMouseDown={handleNotesResizeStart}
          onKeyDown={handleNotesResizeKeyDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize notes panel"
          aria-valuenow={notesWidth}
          aria-valuemin={MIN_NOTES_WIDTH}
          aria-valuemax={MAX_NOTES_WIDTH}
          tabIndex={0}
          className="group hidden w-4 shrink-0 cursor-col-resize items-stretch justify-center outline-none lg:flex"
        >
          <div className="w-px rounded-full bg-ash transition-colors group-hover:bg-carbon-black group-focus-visible:bg-carbon-black group-active:bg-carbon-black" />
        </div>

        <div className="flex h-[70vh] flex-col gap-2 lg:h-full lg:w-[var(--notes-w)] lg:shrink-0">
          <div className="flex items-center justify-end rounded-card bg-paper-white px-3 py-2">
            <Dropdown value={rightPanelTab} onChange={setRightPanelTab} options={RIGHT_PANEL_OPTIONS} />
          </div>

          <div className="min-h-0 flex-1">
            {rightPanelTab === "notes" && <NotesPanel workspaceId={workspaceId} userId={userId} />}
            {rightPanelTab === "summary" && (
              <div className="h-full overflow-y-auto rounded-card bg-paper-white">
                <SummaryView
                  key={selectedDocument?.id}
                  workspaceId={workspaceId}
                  documentId={selectedDocument?.id}
                />
              </div>
            )}
            {rightPanelTab === "flashcards" && (
              <div className="h-full overflow-y-auto rounded-card bg-paper-white">
                <FlashcardsView
                  key={selectedDocument?.id}
                  workspaceId={workspaceId}
                  documentId={selectedDocument?.id}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}

function WorkspacePageSkeleton() {
  return (
    <div className="h-screen bg-warm-canvas p-4">
      <div className="flex h-full flex-col gap-4 lg:flex-row">
        <div className="h-[70vh] w-full shrink-0 rounded-card bg-paper-white p-5 lg:h-full lg:w-[280px]">
          <Skeleton className="h-6 w-2/3" />
          <div className="mt-6 flex flex-col gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="h-[70vh] flex-1 rounded-card bg-paper-white p-5 lg:h-full">
          <Skeleton className="h-6 w-1/3" />
          <div className="mt-6 flex flex-col gap-4">
            <Skeleton className="ml-auto h-14 w-2/3" />
            <Skeleton className="h-20 w-3/4" />
          </div>
        </div>
        <div className="hidden h-full w-[360px] shrink-0 rounded-card bg-paper-white p-5 lg:block">
          <Skeleton className="h-6 w-1/2" />
          <div className="mt-6 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
}
