"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, UploadCloud, MessageSquare, Layers } from "lucide-react";

const STEPS = [
  {
    icon: FolderPlus,
    title: "Welcome to Padhle",
    body: "We've already set up a workspace called \"Try Padhle\" with a sample document loaded, so you can see exactly how it works before uploading anything of your own.",
  },
  {
    icon: UploadCloud,
    title: "Workspaces hold your documents",
    body: "Group PDFs, slides, and notes by subject. Upload a document and Padhle reads it, chunk by chunk, so it can answer questions grounded in the actual text.",
  },
  {
    icon: MessageSquare,
    title: "Ask it anything",
    body: "Chat with your documents and get answers with citations you can click to see the exact passage they came from — no guessing whether the answer is real.",
  },
  {
    icon: Layers,
    title: "Turn it into flashcards & quizzes",
    body: "Generate a summary, a flashcard deck, or a quiz from any document in one click, then review due cards with spaced repetition to make it stick.",
  },
];

export default function OnboardingWalkthrough({ open, onClose, sampleWorkspaceId }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const handleFinish = () => {
    onClose();
    if (sampleWorkspaceId) {
      router.push(`/workspace/${sampleWorkspaceId}/chat`);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-carbon-black/60" />

      <div className="relative flex w-full max-w-md flex-col gap-6 rounded-card-lg bg-paper-white p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 font-mono text-caption uppercase text-slate transition-colors hover:text-carbon-black"
        >
          Skip
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-chip/40">
          <step.icon size={22} className="text-carbon-black" />
        </span>

        <div className="flex flex-col gap-2">
          <h2 className="font-display text-heading-sm uppercase text-carbon-black">{step.title}</h2>
          <p className="text-body-sm text-slate">{step.body}</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-5 rounded-full transition-colors ${
                  i === stepIndex ? "bg-carbon-black" : "bg-ash"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                onClick={() => setStepIndex((i) => i - 1)}
                className="rounded-lg border-[1.5px] border-slate px-4 py-2.5 text-body-sm font-medium text-slate transition-colors hover:border-carbon-black hover:text-carbon-black"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? handleFinish() : setStepIndex((i) => i + 1))}
              className="rounded-lg bg-carbon-black px-5 py-2.5 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
