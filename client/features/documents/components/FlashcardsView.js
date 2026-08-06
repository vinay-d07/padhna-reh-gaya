"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { getFlashcards, generateFlashcards } from "../documents.services";
import { NoDocumentSelected, GenerateEmptyState, PanelSkeleton } from "./PanelStates";

// flashcards: null = loading, undefined = fetched but none exist, array = loaded.
export default function FlashcardsView({ workspaceId, documentId }) {
  const [flashcards, setFlashcards] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!workspaceId || !documentId) return;
    setFlashcards(null);
    setError(null);
    setCardIndex(0);
    setFlipped(false);
    getFlashcards(workspaceId, documentId)
      .then((data) => setFlashcards(data?.length ? data : undefined))
      .catch(() => setFlashcards(undefined));
  }, [workspaceId, documentId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateFlashcards(workspaceId, documentId, 10);
      setFlashcards(data);
      setCardIndex(0);
      setFlipped(false);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't generate flashcards. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const goToCard = (delta) => {
    if (!flashcards?.length) return;
    setFlipped(false);
    setCardIndex((i) => (i + delta + flashcards.length) % flashcards.length);
  };

  if (!documentId) {
    return <NoDocumentSelected label="flashcards" />;
  }

  if (flashcards === null) {
    return <PanelSkeleton />;
  }

  if (!flashcards) {
    return (
      <GenerateEmptyState
        message="No flashcards yet for this document."
        error={error}
        onGenerate={handleGenerate}
        generating={generating}
        label="Generate flashcards"
      />
    );
  }

  const card = flashcards[cardIndex];

  return (
    <div className="animate-fade-in flex flex-col gap-4 px-5 py-4">
      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[160px] w-full flex-col items-center justify-center gap-3 rounded-card-lg bg-mist-gray px-6 py-8 text-center transition-colors hover:bg-ash/50"
      >
        <span className="font-mono text-caption uppercase text-smoke">
          {flipped ? "Answer" : "Question"}
        </span>
        <p className="text-body text-carbon-black">{flipped ? card.answer : card.question}</p>
        <span className="inline-flex items-center gap-1 text-caption text-smoke">
          <RotateCw size={11} /> Tap to flip
        </span>
      </button>

      <div className="flex items-center justify-between">
        <button
          onClick={() => goToCard(-1)}
          aria-label="Previous card"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-mono text-caption text-smoke">
          {cardIndex + 1} / {flashcards.length}
        </span>
        <button
          onClick={() => goToCard(1)}
          aria-label="Next card"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black"
        >
          <ChevronRight size={16} />
        </button>
      </div>

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
