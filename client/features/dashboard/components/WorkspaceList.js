import Link from "next/link";
import { Plus, FileText } from "lucide-react";

export default function WorkspaceList({ workspaces = [], onCreateClick }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-sans text-body font-medium uppercase text-carbon-black">
          Your workspaces
        </h3>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 rounded-lg bg-carbon-black px-4 py-2.5 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
        >
          <Plus size={16} />
          New workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <button
          onClick={onCreateClick}
          className="flex w-full flex-col items-center gap-3 rounded-card border-2 border-dashed border-ash bg-paper-white p-12 text-center transition-colors hover:border-carbon-black"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-chip">
            <Plus size={22} className="text-carbon-black" />
          </span>
          <span className="text-body font-medium text-carbon-black">
            Create your first workspace
          </span>
          <span className="text-body-sm text-slate">
            Group your PDFs by subject, then chat and take notes alongside them.
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      className="flex flex-col gap-4 rounded-card bg-paper-white p-6 transition-opacity hover:opacity-90"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint-chip">
        <FileText size={18} className="text-carbon-black" />
      </span>
      <div>
        <h4 className="font-sans text-subheading-lg font-medium text-carbon-black">
          {workspace.name}
        </h4>
        <p className="mt-1 font-mono text-caption uppercase text-smoke">
          {workspace._count?.documents ?? 0} documents
        </p>
      </div>
    </Link>
  );
}
