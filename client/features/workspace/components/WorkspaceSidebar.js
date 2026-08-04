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
} from "lucide-react";

export default function WorkspaceSidebar({
  workspaceName,
  documents = [],
  collapsed = false,
  onToggleCollapse,
  onAddClick,
  onRename,
  onDelete,
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
            <span className="text-body-sm text-slate">Add your first PDF</span>
          </button>
        ) : (
          <ul className="flex flex-col gap-1">
            {documents.map((doc) => {
              const label = doc.title || doc.fileName;
              const isUploading = doc.status === "UPLOADING";
              const isFailed = doc.status === "FAILED";
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-mist-gray"
                >
                  <FileText
                    size={15}
                    className={`shrink-0 ${isFailed ? "text-red-500" : "text-carbon-black"}`}
                  />
                  <span
                    className={`truncate text-body-sm ${isFailed ? "text-red-500" : "text-carbon-black"}`}
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
