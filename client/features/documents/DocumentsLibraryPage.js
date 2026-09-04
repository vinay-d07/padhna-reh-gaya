"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { FileText, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import UploadModal from "@/features/uploads/components/UploadModal";
import { uploadDocument, deleteDocument } from "@/features/uploads/uploads.services";
import { getWorkspaceDocuments } from "@/features/workspace/workspace.services";
import { useWorkspaceContext } from "@/features/workspace/WorkspaceContext";

let localDocId = 0;

export default function DocumentsLibraryPage() {
  const { userId } = useAuth();
  const { workspaceId } = useWorkspaceContext();
  const [documents, setDocuments] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWorkspaceDocuments(workspaceId)
      .then((data) => !cancelled && setDocuments(data ?? []))
      .catch(() => !cancelled && setDocuments([]));
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
        ...(prev ?? []),
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

  const handleDelete = (doc) => {
    if (!window.confirm(`Delete "${doc.title || doc.fileName}"? This can't be undone.`)) return;
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    deleteDocument(workspaceId, doc.id).catch(() => {});
  };

  if (documents === null) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="animate-fade-in flex flex-col gap-4 pb-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-mono text-caption uppercase text-smoke">
            Documents · {documents.length}
          </h2>
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-carbon-black px-4 py-2.5 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
          >
            <Plus size={15} />
            Add document
          </button>
        </div>

        {documents.length === 0 ? (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex w-full flex-col items-center gap-3 rounded-card border-2 border-dashed border-ash bg-paper-white p-10 text-center transition-colors hover:border-carbon-black"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-chip">
              <Plus size={18} className="text-carbon-black" />
            </span>
            <span className="text-body-sm font-medium text-carbon-black">
              Upload a document to get started
            </span>
            <span className="text-caption text-slate">PDF, DOCX, PPTX, or TXT</span>
          </button>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                workspaceId={workspaceId}
                onDelete={() => handleDelete(doc)}
              />
            ))}
          </div>
        )}
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </div>
  );
}

function DocumentCard({ doc, workspaceId, onDelete }) {
  const label = doc.title || doc.fileName;
  const isUploading = doc.status === "UPLOADING" || doc.status === "PROCESSING";
  const isFailed = doc.status === "FAILED";
  const isLocal = typeof doc.id === "string" && doc.id.startsWith("local-");

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isFailed ? "bg-red-100 text-red-600" : "bg-mist-gray text-carbon-black"
          }`}
        >
          <FileText size={16} />
        </span>
        {!isLocal && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            aria-label={`Delete ${label}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <p className="line-clamp-2 text-body-sm font-medium text-carbon-black">{label}</p>
      <div className="mt-auto flex items-center gap-1.5 font-mono text-caption uppercase">
        {isUploading && (
          <span className="inline-flex items-center gap-1 text-smoke">
            <Loader2 size={11} className="animate-spin" />
            {doc.status === "UPLOADING" ? "Uploading…" : "Processing…"}
          </span>
        )}
        {isFailed && (
          <span className="inline-flex items-center gap-1 text-red-600">
            <AlertCircle size={11} />
            Failed
          </span>
        )}
        {doc.status === "READY" && (
          <span className="text-smoke">
            {doc.pageCount ? `${doc.pageCount} pages` : "Ready"}
          </span>
        )}
      </div>
    </>
  );

  if (isLocal || isUploading) {
    return (
      <div className="group flex flex-col gap-3 rounded-card bg-paper-white p-5">{content}</div>
    );
  }

  return (
    <Link
      href={`/workspace/${workspaceId}/documents/${doc.id}`}
      className="group flex flex-col gap-3 rounded-card bg-paper-white p-5 transition-colors hover:bg-mist-gray/60"
    >
      {content}
    </Link>
  );
}
