"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import WorkspaceSidebar from "./components/WorkspaceSidebar";
import ChatPanel from "@/features/chat/components/ChatPanel";
import NotesPanel from "@/features/notes/components/NotesPanel";
import UploadModal from "@/features/uploads/components/UploadModal";
import { uploadDocument } from "@/features/uploads/uploads.services";
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

export default function WorkspacePage({ workspaceId }) {
  const router = useRouter();
  const { userId } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
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
      ]);

      if (cancelled) return;

      if (results[0].status === "fulfilled") setWorkspace(results[0].value ?? null);
      if (results[1].status === "fulfilled") setDocuments(results[1].value ?? []);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const handleUpload = (files) => {
    if (!userId) return;

    files.forEach((file) => {
      const localId = `local-${localDocId++}`;
      setDocuments((prev) => [
        { id: localId, title: file.name, fileName: file.name, status: "UPLOADING" },
        ...prev,
      ]);

      uploadDocument(workspaceId, file, userId)
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
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            onAddClick={() => setUploadModalOpen(true)}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>

        <div className="h-[70vh] min-w-0 lg:h-full lg:flex-1">
          <ChatPanel workspaceId={workspaceId} userId={userId} workspaceName={workspaceName} />
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

        <div className="h-[70vh] lg:h-full lg:w-[var(--notes-w)] lg:shrink-0">
          <NotesPanel workspaceId={workspaceId} userId={userId} />
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
