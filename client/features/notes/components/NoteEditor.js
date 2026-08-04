"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Heading2, List, ListOrdered, Quote } from "lucide-react";

export default function NoteEditor({ note, onChange }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: note?.content || "",
    editorProps: {
      attributes: {
        class: "note-prose min-h-[240px] text-body text-carbon-black focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || !note) return;
    if (editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content || "", { emitUpdate: false });
    }
    // Only resync when switching to a different note, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }) {
  const items = [
    { icon: Bold, label: "Bold", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: Italic, label: "Italic", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: Heading2, label: "Heading", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { icon: List, label: "Bullet list", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: ListOrdered, label: "Numbered list", action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { icon: Quote, label: "Quote", action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-ash pb-3">
      {items.map(({ icon: Icon, label, action, active }) => (
        <button
          key={label}
          type="button"
          onClick={action}
          aria-label={label}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            active ? "bg-carbon-black text-paper-white" : "text-slate hover:bg-mist-gray"
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
