"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import Modal from "@/components/Modal";
import { createRoom } from "../rooms.services";

export default function CreateRoomModal({ open, onClose }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const room = await createRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
      });
      router.push(`/rooms/${room.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create the room. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New study room">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="room-name" className="text-body-sm font-medium text-slate">
            Room name
          </label>
          <input
            id="room-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning grind"
            className="rounded-lg border border-ash px-4 py-3 text-body text-carbon-black outline-none focus:border-carbon-black"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="room-description" className="text-body-sm font-medium text-slate">
            Description <span className="text-smoke">(optional)</span>
          </label>
          <input
            id="room-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's everyone working on?"
            className="rounded-lg border border-ash px-4 py-3 text-body text-carbon-black outline-none focus:border-carbon-black"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-body-sm text-carbon-black">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="h-4 w-4 accent-carbon-black"
          />
          <span className="inline-flex items-center gap-1.5">
            <Lock size={13} />
            Private — only joinable with a code
          </span>
        </label>

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
            disabled={submitting || !name.trim()}
            className="rounded-lg bg-carbon-black px-5 py-3 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {submitting ? "Creating…" : "Create room"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
