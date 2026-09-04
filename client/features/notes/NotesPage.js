"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, StickyNote, Trash2 } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import NoteEditor from "./components/NoteEditor";
import { getNotes, createNote, updateNote, deleteNote } from "./notes.services";
import { useWorkspaceContext } from "@/features/workspace/WorkspaceContext";

export default function NotesPage() {
  const { userId } = useAuth();
  const { workspaceId } = useWorkspaceContext();
  const [notes, setNotes] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const saveTimeout = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getNotes(workspaceId)
      .then((data) => {
        if (cancelled) return;
        setNotes(data ?? []);
        setActiveNoteId(data?.[0]?.id ?? null);
      })
      .catch(() => !cancelled && setNotes([]));
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const activeNote = notes?.find((n) => n.id === activeNoteId) || null;

  const handleCreate = async () => {
    if (!userId) return;
    try {
      const note = await createNote(workspaceId);
      setNotes((prev) => [note, ...(prev ?? [])]);
      setActiveNoteId(note.id);
    } catch {
      const localNote = { id: `local-${Date.now()}`, title: "Untitled note", content: "" };
      setNotes((prev) => [localNote, ...(prev ?? [])]);
      setActiveNoteId(localNote.id);
    }
  };

  const handleDelete = (noteId) => {
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

  if (notes === null) {
    return (
      <div className="flex h-full gap-3">
        <Skeleton className="h-full w-[260px] shrink-0 rounded-card" />
        <Skeleton className="h-full flex-1 rounded-card" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 lg:flex-row">
      <aside className="flex h-[30vh] w-full flex-col rounded-card bg-paper-white lg:h-full lg:w-[260px] lg:shrink-0">
        <div className="flex items-center justify-between border-b border-ash px-5 py-4">
          <h3 className="font-mono text-caption uppercase text-smoke">Notes · {notes.length}</h3>
          <button
            onClick={handleCreate}
            aria-label="New note"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-carbon-black text-paper-white transition-opacity hover:opacity-80"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          {notes.length === 0 ? (
            <button
              onClick={handleCreate}
              className="mx-2 mt-2 flex w-[calc(100%-1rem)] flex-col items-center gap-2 rounded-lg border-2 border-dashed border-ash p-6 text-center transition-colors hover:border-carbon-black"
            >
              <Plus size={18} className="text-carbon-black" />
              <span className="text-body-sm text-slate">New note</span>
            </button>
          ) : (
            <ul className="flex flex-col gap-1">
              {notes.map((note) => {
                const isActive = note.id === activeNoteId;
                return (
                  <li key={note.id} className="group relative">
                    <button
                      onClick={() => setActiveNoteId(note.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg py-2.5 pl-2.5 pr-8 text-left transition-colors ${
                        isActive ? "bg-mist-gray" : "hover:bg-mist-gray"
                      }`}
                    >
                      <StickyNote size={15} className="shrink-0 text-carbon-black" />
                      <span
                        className={`truncate text-body-sm text-carbon-black ${isActive ? "font-medium" : ""}`}
                      >
                        {note.title || "Untitled"}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      aria-label="Delete note"
                      className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-slate opacity-0 transition-opacity hover:text-carbon-black group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <div className="min-h-0 min-w-0 flex-1 rounded-card bg-paper-white px-6 py-5">
        {!activeNote ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-body-sm text-slate">Select a note, or write a new one.</p>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-carbon-black px-4 py-2 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
            >
              New note
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <input
              value={activeNote.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled note"
              className="mb-3 border-none bg-transparent font-sans text-heading-sm font-medium text-carbon-black outline-none placeholder:text-smoke"
            />
            <NoteEditor note={activeNote} onChange={handleContentChange} />
          </div>
        )}
      </div>
    </div>
  );
}
