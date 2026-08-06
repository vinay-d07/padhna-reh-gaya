"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import NoteEditor from "./NoteEditor";
import Skeleton from "@/components/Skeleton";
import { getNotes, createNote, updateNote, deleteNote } from "../notes.services";

export default function NotesPanel({ workspaceId, userId }) {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getNotes(workspaceId);
        if (cancelled) return;
        setNotes(data ?? []);
        setActiveNoteId(data?.[0]?.id ?? null);
      } catch {
        // No backend yet — start with an empty notes list.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  const handleCreate = async () => {
    if (!userId) return;

    try {
      const note = await createNote(workspaceId);
      setNotes((prev) => [note, ...prev]);
      setActiveNoteId(note.id);
    } catch {
      const localNote = { id: `local-${Date.now()}`, title: "Untitled note", content: "" };
      setNotes((prev) => [localNote, ...prev]);
      setActiveNoteId(localNote.id);
    }
  };

  const handleDelete = async (noteId) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (activeNoteId === noteId) setActiveNoteId(null);
    deleteNote(noteId).catch(() => {});
  };

  const scheduleSave = (noteId, patch) => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateNote(noteId, patch).catch(() => {});
    }, 600);
  };

  const handleTitleChange = (title) => {
    if (!activeNote) return;
    setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? { ...n, title } : n)));
    scheduleSave(activeNote.id, { title, content: activeNote.content });
  };

  const handleContentChange = (content) => {
    if (!activeNote) return;
    setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? { ...n, content } : n)));
    scheduleSave(activeNote.id, { title: activeNote.title, content });
  };

  return (
    <div className="flex h-full flex-col rounded-card bg-paper-white">
      <div className="flex items-center justify-between border-b border-ash px-5 py-4">
        <h3 className="font-sans text-body-sm font-medium uppercase text-carbon-black">
          Notes
        </h3>
        <button
          onClick={handleCreate}
          aria-label="New note"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-carbon-black text-paper-white transition-opacity hover:opacity-80"
        >
          <Plus size={14} />
        </button>
      </div>

      {notes.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-ash px-5 py-3">
          {notes.map((note) => (
            <div key={note.id} className="group relative flex items-center">
              <button
                onClick={() => setActiveNoteId(note.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 pr-6 font-mono text-caption uppercase transition-colors ${
                  note.id === activeNoteId
                    ? "bg-mint-chip text-carbon-black"
                    : "bg-mist-gray text-slate hover:text-carbon-black"
                }`}
              >
                {note.title || "Untitled"}
              </button>
              <button
                onClick={() => handleDelete(note.id)}
                aria-label="Delete note"
                className="absolute right-1.5 flex h-4 w-4 items-center justify-center text-slate opacity-0 transition-opacity hover:text-carbon-black group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-hidden px-5">
        {loading && (
          <div className="flex h-full flex-col gap-3 pt-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {!loading && !activeNote && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-body-sm text-slate">No notes yet.</p>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-carbon-black px-4 py-2 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
            >
              New note
            </button>
          </div>
        )}

        {!loading && activeNote && (
          <div className="flex h-full flex-col">
            <input
              value={activeNote.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled note"
              className="mb-2 mt-4 border-none bg-transparent font-sans text-subheading-lg font-medium text-carbon-black outline-none placeholder:text-smoke"
            />
            <NoteEditor note={activeNote} onChange={handleContentChange} />
          </div>
        )}
      </div>
    </div>
  );
}
