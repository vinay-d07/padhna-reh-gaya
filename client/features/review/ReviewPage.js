"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCw, Check } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { getReviewQueue, gradeFlashcard } from "./review.services";

const GRADES = [
  { value: "again", label: "Again", className: "bg-red-600 hover:bg-red-700" },
  { value: "hard", label: "Hard", className: "bg-amber-600 hover:bg-amber-700" },
  { value: "good", label: "Good", className: "bg-carbon-black hover:opacity-80" },
  { value: "easy", label: "Easy", className: "bg-emerald-600 hover:bg-emerald-700" },
];

export default function ReviewPage({ workspaceId }) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getReviewQueue(workspaceId)
      .then((data) => {
        if (cancelled) return;
        setCards(data?.cards ?? []);
      })
      .catch(() => !cancelled && setError("Couldn't load your review queue."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const handleGrade = async (grade) => {
    const card = cards[cardIndex];
    if (!card || grading) return;
    setGrading(true);
    setError(null);
    try {
      await gradeFlashcard(workspaceId, card.id, grade);
      setReviewedCount((n) => n + 1);
      setFlipped(false);
      setCardIndex((i) => i + 1);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save that review. Try again.");
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-canvas p-4">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Link
          href={`/workspace/${workspaceId}`}
          className="inline-flex w-fit items-center gap-1.5 text-body-sm text-slate transition-colors hover:text-carbon-black"
        >
          <ArrowLeft size={14} />
          Back to workspace
        </Link>

        <div className="rounded-card bg-paper-white p-6">
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : cardIndex >= cards.length ? (
            <SessionSummary reviewedCount={reviewedCount} hadCards={cards.length > 0} />
          ) : (
            <ReviewCard
              card={cards[cardIndex]}
              index={cardIndex}
              total={cards.length}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              onGrade={handleGrade}
              grading={grading}
            />
          )}
          {error && <p className="mt-3 text-body-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ card, index, total, flipped, onFlip, onGrade, grading }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        {card.documentTitle && (
          <span className="truncate text-caption font-mono uppercase text-smoke">
            {card.documentTitle}
          </span>
        )}
        <span className="ml-auto shrink-0 font-mono text-caption text-smoke">
          {index + 1} / {total}
        </span>
      </div>

      <button
        onClick={onFlip}
        className="flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-card-lg bg-mist-gray px-6 py-10 text-center transition-colors hover:bg-ash/50"
      >
        <span className="font-mono text-caption uppercase text-smoke">
          {flipped ? "Answer" : "Question"}
        </span>
        <p className="text-body text-carbon-black">{flipped ? card.answer : card.question}</p>
        {!flipped && (
          <span className="inline-flex items-center gap-1 text-caption text-smoke">
            <RotateCw size={11} /> Tap to reveal
          </span>
        )}
      </button>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button
              key={g.value}
              onClick={() => onGrade(g.value)}
              disabled={grading}
              className={`rounded-lg px-2 py-2.5 text-body-sm font-medium text-paper-white transition-opacity disabled:opacity-40 ${g.className}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-caption text-smoke">
          Grade yourself once you&rsquo;ve seen the answer.
        </p>
      )}
    </div>
  );
}

function SessionSummary({ reviewedCount, hadCards }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-chip/40 text-carbon-black">
        <Check size={22} />
      </div>
      {hadCards ? (
        <>
          <h2 className="font-display text-heading-md text-carbon-black">All caught up</h2>
          <p className="text-body-sm text-slate">
            You reviewed {reviewedCount} card{reviewedCount === 1 ? "" : "s"} this session.
          </p>
        </>
      ) : (
        <>
          <h2 className="font-display text-heading-md text-carbon-black">Nothing due right now</h2>
          <p className="text-body-sm text-slate">
            Generate flashcards on a document, or check back later once cards come due.
          </p>
        </>
      )}
    </div>
  );
}
