"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Layers, HelpCircle, AlertCircle, RotateCw } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import SummaryView from "./components/SummaryView";
import FlashcardsView from "./components/FlashcardsView";
import QuizView from "./components/QuizView";
import IngestProgress from "./components/IngestProgress";
import { getWorkspaceDocuments } from "@/features/workspace/workspace.services";
import { retryDocument } from "@/features/uploads/uploads.services";
import { useWorkspaceContext } from "@/features/workspace/WorkspaceContext";
import { friendlyIngestionError } from "@/lib/ingestionError";

const TABS = [
  { value: "summary", label: "Summary", icon: Sparkles },
  { value: "flashcards", label: "Flashcards", icon: Layers },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
];

export default function DocumentHubPage({ documentId }) {
  const { workspaceId } = useWorkspaceContext();
  const [document, setDocument] = useState(null);
  const [tab, setTab] = useState("summary");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWorkspaceDocuments(workspaceId)
      .then((docs) => {
        if (cancelled) return;
        setDocument(docs?.find((d) => d.id === documentId) ?? undefined);
      })
      .catch(() => !cancelled && setDocument(undefined));
    return () => {
      cancelled = true;
    };
  }, [workspaceId, documentId]);

  // While the document is still processing, poll so the tabs unlock the
  // moment it flips to READY (or show the retry CTA the moment it FAILs)
  // instead of the user having to manually reload the page.
  useEffect(() => {
    if (!document || document.status !== "PROCESSING") return;
    const interval = setInterval(() => {
      getWorkspaceDocuments(workspaceId)
        .then((docs) => {
          const fresh = docs?.find((d) => d.id === documentId);
          if (fresh) setDocument(fresh);
        })
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [workspaceId, documentId, document]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const updated = await retryDocument(workspaceId, documentId);
      setDocument((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch {
      // stays FAILED — retry button remains available
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-card bg-paper-white px-5 py-4">
        <Link
          href={`/workspace/${workspaceId}/documents`}
          className="inline-flex w-fit items-center gap-1.5 text-body-sm text-slate transition-colors hover:text-carbon-black"
        >
          <ArrowLeft size={14} />
          Documents
        </Link>

        {document === null ? (
          <Skeleton className="h-6 w-1/2" />
        ) : document === undefined ? (
          <p className="inline-flex items-center gap-1.5 text-body-sm text-red-600">
            <AlertCircle size={14} />
            Document not found.
          </p>
        ) : (
          <h1 className="truncate font-sans text-subheading-lg font-medium text-carbon-black">
            {document.title || document.fileName}
          </h1>
        )}

        {document?.status === "READY" && (
          <div className="flex gap-1">
            {TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors ${
                  tab === value
                    ? "bg-mist-gray text-carbon-black"
                    : "text-slate hover:bg-mist-gray/60 hover:text-carbon-black"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-card bg-paper-white">
        {document === undefined ? null : document?.status === "PROCESSING" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-body-sm text-slate">
              This document is still being processed — summary, flashcards, and quiz will unlock
              once it&rsquo;s ready.
            </p>
            <div className="w-full max-w-xs">
              <IngestProgress status={document.status} progress={document.ingestProgress} />
            </div>
          </div>
        ) : document?.status === "FAILED" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle size={20} />
            </span>
            <p className="max-w-sm text-body-sm text-slate">
              {friendlyIngestionError(document.errorMessage)}
            </p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 rounded-lg bg-carbon-black px-4 py-2.5 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              <RotateCw size={13} className={retrying ? "animate-spin" : ""} />
              {retrying ? "Retrying…" : "Retry processing"}
            </button>
          </div>
        ) : (
          <>
            {tab === "summary" && <SummaryView workspaceId={workspaceId} documentId={documentId} />}
            {tab === "flashcards" && <FlashcardsView workspaceId={workspaceId} documentId={documentId} />}
            {tab === "quiz" && <QuizView workspaceId={workspaceId} documentId={documentId} />}
          </>
        )}
      </div>
    </div>
  );
}
