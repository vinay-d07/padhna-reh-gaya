"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Modal from "@/components/Modal";
import { createWorkspace } from "@/features/dashboard/dash.services";

export default function CreateWorkspaceModal({ open, onClose }) {
  const router = useRouter();
  const { userId } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !userId) return;

    setSubmitting(true);
    setError(null);
    try {
      const workspace = await createWorkspace({ name: name.trim() });
      router.push(`/workspace/${workspace.id}`);
    } catch (err) {
      setError("Couldn't create the workspace. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New workspace">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="workspace-name" className="text-body-sm font-medium text-slate">
            Workspace name
          </label>
          <input
            id="workspace-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Biology 101"
            className="rounded-lg border border-ash px-4 py-3 text-body text-carbon-black outline-none focus:border-carbon-black"
          />
        </div>

        {error && <p className="text-body-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border-[1.5px] border-slate px-5 py-3 text-body-sm font-medium text-slate transition-colors hover:border-carbon-black hover:text-carbon-black"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim() || !userId}
            className="rounded-lg bg-carbon-black px-5 py-3 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {submitting ? "Creating…" : "Create workspace"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
