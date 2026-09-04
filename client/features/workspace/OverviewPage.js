"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  MessageSquare,
  StickyNote,
  GraduationCap,
  Plus,
  UploadCloud,
  AlertCircle,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import UploadModal from "@/features/uploads/components/UploadModal";
import { uploadDocument } from "@/features/uploads/uploads.services";
import { getWorkspaceDocuments } from "./workspace.services";
import { listConversations } from "@/features/chat/chat.services";
import { getNotes } from "@/features/notes/notes.services";
import { useWorkspaceContext } from "./WorkspaceContext";

export default function OverviewPage() {
  const router = useRouter();
  const { workspaceId, workspace, dueReviewCount, refreshDueReviewCount } = useWorkspaceContext();
  const [documents, setDocuments] = useState(null);
  const [conversations, setConversations] = useState(null);
  const [notes, setNotes] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      getWorkspaceDocuments(workspaceId),
      listConversations(workspaceId),
      getNotes(workspaceId),
    ]).then((results) => {
      if (cancelled) return;
      setDocuments(results[0].status === "fulfilled" ? results[0].value ?? [] : []);
      setConversations(results[1].status === "fulfilled" ? results[1].value ?? [] : []);
      setNotes(results[2].status === "fulfilled" ? results[2].value ?? [] : []);
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const handleUpload = (files) => {
    files.forEach((file) => uploadDocument(workspaceId, file).catch(() => {}));
    router.push(`/workspace/${workspaceId}/documents`);
  };

  const loading = documents === null || conversations === null || notes === null;
  const readyCount = documents?.filter((d) => d.status === "READY").length ?? 0;
  const processingCount = documents?.filter((d) => d.status === "PROCESSING").length ?? 0;
  const failedCount = documents?.filter((d) => d.status === "FAILED").length ?? 0;

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (documents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-card bg-paper-white p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-chip/40">
          <UploadCloud size={26} className="text-carbon-black" />
        </span>
        <div>
          <h2 className="font-display text-heading-sm uppercase text-carbon-black">
            Welcome to {workspace?.name || "your workspace"}
          </h2>
          <p className="mt-2 max-w-sm text-body-sm text-slate">
            Upload a document to start chatting with it, generating summaries, flashcards, and
            quizzes.
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-carbon-black px-5 py-3 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
        >
          <Plus size={15} />
          Upload a document
        </button>
        <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="animate-fade-in flex flex-col gap-4 pb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <QuickAction
            icon={<Plus size={16} />}
            label="Upload document"
            onClick={() => setUploadOpen(true)}
          />
          <QuickAction
            icon={<MessageSquare size={16} />}
            label="New chat"
            href={`/workspace/${workspaceId}/chat`}
          />
          <QuickAction
            icon={<GraduationCap size={16} />}
            label={dueReviewCount > 0 ? `Study · ${dueReviewCount} due` : "Study"}
            href={`/workspace/${workspaceId}/review`}
            highlight={dueReviewCount > 0}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<FileText size={16} />}
            label="Documents"
            value={documents.length}
            detail={
              processingCount > 0
                ? `${processingCount} processing`
                : failedCount > 0
                  ? `${failedCount} failed`
                  : `${readyCount} ready`
            }
            warn={failedCount > 0}
            href={`/workspace/${workspaceId}/documents`}
          />
          <StatCard
            icon={<MessageSquare size={16} />}
            label="Conversations"
            value={conversations.length}
            detail={conversations.length ? "Ask your documents anything" : "Start your first chat"}
            href={`/workspace/${workspaceId}/chat`}
          />
          <StatCard
            icon={<StickyNote size={16} />}
            label="Notes"
            value={notes.length}
            detail={notes.length ? "Keep writing" : "Jot something down"}
            href={`/workspace/${workspaceId}/notes`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentList
            title="Recent conversations"
            emptyLabel="No conversations yet"
            items={conversations.slice(0, 5).map((c) => ({
              id: c.id,
              label: c.title || "New conversation",
              href: `/workspace/${workspaceId}/chat/${c.id}`,
            }))}
            icon={<MessageSquare size={14} />}
          />
          <RecentList
            title="Recent notes"
            emptyLabel="No notes yet"
            items={notes.slice(0, 5).map((n) => ({
              id: n.id,
              label: n.title || "Untitled note",
              href: `/workspace/${workspaceId}/notes`,
            }))}
            icon={<StickyNote size={14} />}
          />
        </div>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </div>
  );
}

function QuickAction({ icon, label, href, onClick, highlight }) {
  const className = `flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-body-sm font-medium transition-opacity hover:opacity-80 ${
    highlight ? "bg-mint-chip text-carbon-black" : "bg-carbon-black text-paper-white"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {icon}
      {label}
    </button>
  );
}

function StatCard({ icon, label, value, detail, warn, href }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-card bg-paper-white p-5 transition-colors hover:bg-mist-gray/60"
    >
      <span className="inline-flex items-center gap-1.5 font-mono text-caption uppercase text-smoke">
        {icon}
        {label}
      </span>
      <span className="font-display text-heading-sm text-carbon-black">{value}</span>
      <span className={`inline-flex items-center gap-1 text-caption ${warn ? "text-red-600" : "text-smoke"}`}>
        {warn && <AlertCircle size={12} />}
        {detail}
      </span>
    </Link>
  );
}

function RecentList({ title, emptyLabel, items, icon }) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-paper-white p-5">
      <h3 className="mb-2 font-mono text-caption uppercase text-smoke">{title}</h3>
      {items.length === 0 ? (
        <p className="text-body-sm text-slate">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-body-sm text-carbon-black transition-colors hover:bg-mist-gray"
              >
                <span className="shrink-0 text-slate">{icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    </div>
  );
}
