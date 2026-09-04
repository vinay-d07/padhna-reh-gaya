"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Layers, HelpCircle, AlertCircle } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import SummaryView from "./components/SummaryView";
import FlashcardsView from "./components/FlashcardsView";
import QuizView from "./components/QuizView";
import { getWorkspaceDocuments } from "@/features/workspace/workspace.services";
import { useWorkspaceContext } from "@/features/workspace/WorkspaceContext";

const TABS = [
  { value: "summary", label: "Summary", icon: Sparkles },
  { value: "flashcards", label: "Flashcards", icon: Layers },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
];

export default function DocumentHubPage({ documentId }) {
  const { workspaceId } = useWorkspaceContext();
  const [document, setDocument] = useState(null);
  const [tab, setTab] = useState("summary");

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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-card bg-paper-white">
        {document === undefined ? null : (
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
