import { Sparkles } from "lucide-react";
import Skeleton from "@/components/Skeleton";

export function NoDocumentSelected({ label }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-body-sm text-slate">
        Select a document from the sidebar to see its {label}.
      </p>
    </div>
  );
}

export function GenerateEmptyState({ message, error, onGenerate, generating, label }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-body-sm text-slate">{message}</p>
      {error && <p className="text-body-sm text-red-600">{error}</p>}
      <button
        onClick={onGenerate}
        disabled={generating}
        className="inline-flex items-center gap-2 rounded-lg bg-carbon-black px-5 py-3 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        <Sparkles size={14} />
        {generating ? "Generating…" : label}
      </button>
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}
