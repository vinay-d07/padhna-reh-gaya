"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import Markdown from "@/features/chat/components/Markdown";
import { getSummary, generateSummary } from "../documents.services";
import { NoDocumentSelected, GenerateEmptyState, PanelSkeleton } from "./PanelStates";

// summary: null = loading, undefined = fetched but none exists, object = loaded.
export default function SummaryView({ workspaceId, documentId }) {
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // The parent keys this component on documentId, so a document change
  // remounts it with fresh state — no manual reset needed here.
  useEffect(() => {
    if (!workspaceId || !documentId) return;
    getSummary(workspaceId, documentId)
      .then(setSummary)
      .catch(() => setSummary(undefined));
  }, [workspaceId, documentId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateSummary(workspaceId, documentId);
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't generate a summary. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (!documentId) {
    return <NoDocumentSelected label="summary" />;
  }

  if (summary === null) {
    return <PanelSkeleton />;
  }

  if (!summary) {
    return (
      <GenerateEmptyState
        message="No summary yet for this document."
        error={error}
        onGenerate={handleGenerate}
        generating={generating}
        label="Generate summary"
      />
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-3 px-5 py-4">
      <Markdown content={summary.content} />
      {error && <p className="text-body-sm text-red-600">{error}</p>}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="inline-flex w-fit items-center gap-1.5 text-caption font-mono uppercase text-slate transition-colors hover:text-carbon-black disabled:opacity-40"
      >
        <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
        {generating ? "Regenerating…" : "Regenerate"}
      </button>
    </div>
  );
}
