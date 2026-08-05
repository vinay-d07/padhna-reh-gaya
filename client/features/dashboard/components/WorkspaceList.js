import Link from "next/link";
import { Plus, FileText } from "lucide-react";

export default function WorkspaceList({ workspaces = [], onCreateClick }) {
  return (
    <div className="rounded-card bg-paper-white p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-sans text-body font-medium uppercase text-carbon-black">
          Your workspaces
        </h3>
        <button
          onClick={onCreateClick}
          aria-label="New workspace"
          title="New workspace"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-carbon-black text-paper-white transition-opacity hover:opacity-80"
        >
          <Plus size={16} />
        </button>
      </div>

      {workspaces.length === 0 ? (
        <button
          onClick={onCreateClick}
          className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-ash p-8 text-center transition-colors hover:border-carbon-black"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-chip">
            <Plus size={18} className="text-carbon-black" />
          </span>
          <span className="text-body-sm font-medium text-carbon-black">
            Create your first workspace
          </span>
          <span className="text-caption text-slate">
            Group your PDFs by subject, then chat and take notes alongside them.
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkspaceCard({ workspace }) {
  return (
    <Link
      href={`/workspace/${workspace.id}`}
      className="flex items-center gap-3 rounded-lg border border-ash p-3 transition-colors hover:border-carbon-black"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint-chip">
        <FileText size={16} className="text-carbon-black" />
      </span>
      <div className="min-w-0">
        <h4 className="truncate font-sans text-body-sm font-medium text-carbon-black">
          {workspace.name}
        </h4>
        <p className="mt-0.5 font-mono text-caption uppercase text-smoke">
          {workspace._count?.documents ?? 0} documents
        </p>
      </div>
    </Link>
  );
}
