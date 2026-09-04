"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { updateWorkspace, deleteWorkspace } from "./workspace.services";
import { useWorkspaceContext } from "./WorkspaceContext";

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { workspaceId, workspace, setWorkspace } = useWorkspaceContext();
  // null = untouched — falls back to the loaded workspace name; a string once
  // the user starts typing, reset to null again after a successful save.
  const [draftName, setDraftName] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!workspace) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="h-40 animate-pulse rounded-card bg-paper-white" />
        <div className="h-48 animate-pulse rounded-card bg-paper-white" />
      </div>
    );
  }

  const displayName = workspace.name;
  const name = draftName ?? displayName;
  const canRename = name.trim() && name.trim() !== displayName;
  const canDelete = confirmText.trim() === displayName;

  const handleRename = async (e) => {
    e.preventDefault();
    if (!canRename) return;
    const trimmed = name.trim();
    setSaving(true);
    try {
      await updateWorkspace(workspaceId, { name: trimmed });
      setWorkspace((prev) => (prev ? { ...prev, name: trimmed } : prev));
      setDraftName(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      await deleteWorkspace(workspaceId);
      router.push("/dashboard");
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-xl flex-col gap-6 pb-4">
        <section className="flex flex-col gap-4 rounded-card bg-paper-white p-6">
          <h2 className="font-mono text-caption uppercase text-smoke">General</h2>
          <form onSubmit={handleRename} className="flex flex-col gap-2">
            <label htmlFor="workspace-name" className="text-body-sm font-medium text-carbon-black">
              Workspace name
            </label>
            <div className="flex gap-2">
              <input
                id="workspace-name"
                value={name}
                onChange={(e) => setDraftName(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-ash px-3 py-2.5 text-body-sm text-carbon-black outline-none focus:border-carbon-black"
              />
              <button
                type="submit"
                disabled={!canRename || saving}
                className="shrink-0 rounded-lg bg-carbon-black px-4 py-2.5 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {saved && <p className="text-caption text-emerald-600">Saved.</p>}
          </form>
        </section>

        <section className="flex flex-col gap-4 rounded-card border-[1.5px] border-red-200 bg-paper-white p-6">
          <h2 className="inline-flex items-center gap-1.5 font-mono text-caption uppercase text-red-600">
            <AlertTriangle size={13} />
            Danger zone
          </h2>
          <p className="text-body-sm text-slate">
            Deleting <span className="font-medium text-carbon-black">{displayName}</span> permanently
            removes its documents, notes, and conversations. This can&rsquo;t be undone.
          </p>
          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-delete" className="text-body-sm text-slate">
              Type <span className="font-medium text-carbon-black">{displayName}</span> to confirm
            </label>
            <div className="flex gap-2">
              <input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-ash px-3 py-2.5 text-body-sm text-carbon-black outline-none focus:border-red-500"
              />
              <button
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="shrink-0 rounded-lg bg-red-600 px-4 py-2.5 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                {deleting ? "Deleting…" : "Delete workspace"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
