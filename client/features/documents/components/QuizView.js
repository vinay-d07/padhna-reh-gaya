"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, Check, X, Layers } from "lucide-react";
import { getQuiz, generateQuiz, submitQuizAttempt } from "../documents.services";
import { NoDocumentSelected, GenerateEmptyState, PanelSkeleton } from "./PanelStates";
import { useToast } from "@/providers/ToastProvider";

// quiz: null = loading, undefined = fetched but none exist, object = loaded.
export default function QuizView({ workspaceId, documentId, onReviewMissed }) {
  const { showToast } = useToast();
  const [quiz, setQuiz] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // The parent keys this component on documentId, so a document change
  // remounts it with fresh state — no manual reset needed here.
  useEffect(() => {
    if (!workspaceId || !documentId) return;
    getQuiz(workspaceId, documentId)
      .then((data) => {
        setQuiz(data ?? undefined);
        setAnswers(new Array(data?.questions?.length ?? 0).fill(null));
      })
      .catch(() => setQuiz(undefined));
  }, [workspaceId, documentId]);

  const resetForQuiz = (data) => {
    setQuiz(data);
    setAnswers(new Array(data?.questions?.length ?? 0).fill(null));
    setQuestionIndex(0);
    setResult(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateQuiz(workspaceId, documentId, 5);
      resetForQuiz(data);
      showToast({ message: `Quiz with ${data.questions.length} questions generated.`, duration: 3000 });
    } catch (err) {
      const message = err.response?.data?.message || "Couldn't generate a quiz. Try again.";
      setError(message);
      showToast({ message, tone: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const goToQuestion = (delta) => {
    if (!quiz?.questions?.length) return;
    setQuestionIndex((i) => Math.min(Math.max(i + delta, 0), quiz.questions.length - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await submitQuizAttempt(workspaceId, documentId, answers);
      setResult(data);
    } catch (err) {
      const message = err.response?.data?.message || "Couldn't submit the quiz. Try again.";
      setError(message);
      showToast({ message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers(new Array(quiz?.questions?.length ?? 0).fill(null));
    setQuestionIndex(0);
    setResult(null);
  };

  if (!documentId) {
    return <NoDocumentSelected label="quiz" />;
  }

  if (quiz === null) {
    return <PanelSkeleton />;
  }

  if (!quiz) {
    return (
      <GenerateEmptyState
        message="No quiz yet for this document."
        error={error}
        onGenerate={handleGenerate}
        generating={generating}
        label="Generate quiz"
      />
    );
  }

  if (result) {
    return (
      <QuizResults
        result={result}
        onRetake={handleRetake}
        onRegenerate={handleGenerate}
        onReviewMissed={onReviewMissed}
        generating={generating}
      />
    );
  }

  const question = quiz.questions[questionIndex];
  const answeredCount = answers.filter((a) => a !== null).length;
  const isLastQuestion = questionIndex === quiz.questions.length - 1;

  return (
    <div className="animate-fade-in flex flex-col gap-4 px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-caption uppercase text-smoke">
          Question {questionIndex + 1} / {quiz.questions.length}
        </span>
        <span className="font-mono text-caption text-smoke">{answeredCount} answered</span>
      </div>

      <p className="text-body text-carbon-black">{question.question}</p>

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isSelected = answers[questionIndex] === i;
          return (
            <button
              key={i}
              onClick={() => selectAnswer(i)}
              className={`rounded-lg border px-4 py-2.5 text-left text-body-sm transition-colors ${
                isSelected
                  ? "border-carbon-black bg-mist-gray text-carbon-black font-medium"
                  : "border-ash text-slate hover:border-carbon-black/40 hover:bg-mist-gray/50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => goToQuestion(-1)}
          disabled={questionIndex === 0}
          aria-label="Previous question"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-carbon-black px-5 py-2 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit quiz"}
          </button>
        ) : (
          <button
            onClick={() => goToQuestion(1)}
            aria-label="Next question"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-mist-gray hover:text-carbon-black"
          >
            <ChevronRight size={16} />
          </button>
        )}
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

function QuizResults({ result, onRetake, onRegenerate, onReviewMissed, generating }) {
  const missedCount = result.total - result.score;

  return (
    <div className="animate-fade-in flex flex-col gap-4 px-5 py-4">
      <div className="flex flex-col items-center gap-1 rounded-card-lg bg-mist-gray px-6 py-8 text-center">
        <span className="font-mono text-caption uppercase text-smoke">Score</span>
        <p className="font-display text-heading-lg text-carbon-black">
          {result.score}
          <span className="text-body font-normal text-smoke"> / {result.total}</span>
        </p>
      </div>

      {missedCount > 0 && onReviewMissed && (
        <button
          onClick={onReviewMissed}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-mint-chip/40 px-3 py-2 text-caption font-medium text-carbon-black transition-opacity hover:opacity-80"
        >
          <Layers size={13} />
          Review the flashcards for what you missed
        </button>
      )}

      <ul className="flex flex-col gap-3">
        {result.results.map((r, i) => (
          <li key={i} className="rounded-lg border border-ash p-3">
            <div className="flex items-start gap-2">
              {r.correct ? (
                <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              ) : (
                <X size={15} className="mt-0.5 shrink-0 text-red-600" />
              )}
              <div className="flex flex-col gap-1">
                <p className="text-body-sm text-carbon-black">{r.question}</p>
                <p className="text-caption text-smoke">
                  Correct answer: <span className="text-carbon-black">{r.options[r.correctIndex]}</span>
                </p>
                {!r.correct && r.selectedIndex !== null && (
                  <p className="text-caption text-red-600">Your answer: {r.options[r.selectedIndex]}</p>
                )}
                {r.explanation && <p className="text-caption text-smoke">{r.explanation}</p>}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <button
          onClick={onRetake}
          className="inline-flex items-center gap-2 rounded-lg bg-carbon-black px-4 py-2 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
        >
          Retake
        </button>
        <button
          onClick={onRegenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 text-caption font-mono uppercase text-slate transition-colors hover:text-carbon-black disabled:opacity-40"
        >
          <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
          {generating ? "Regenerating…" : "New quiz"}
        </button>
      </div>
    </div>
  );
}
