"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import Skeleton from "@/components/Skeleton";

const TABS = [
  { segment: "", label: "Overview" },
  { segment: "chat", label: "Chat" },
  { segment: "documents", label: "Documents" },
  { segment: "notes", label: "Notes" },
  { segment: "review", label: "Review" },
  { segment: "settings", label: "Settings" },
];

export default function WorkspaceSubNav({ workspaceId, workspaceName, dueReviewCount = 0, loading = false }) {
  const pathname = usePathname();
  const base = `/workspace/${workspaceId}`;

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-ash bg-paper-white px-4 py-3 sm:px-6">
      {loading ? (
        <Skeleton className="h-6 w-40" />
      ) : (
        <h1 className="truncate font-sans text-subheading-lg font-medium text-carbon-black">
          {workspaceName}
        </h1>
      )}
      <nav className="flex items-center gap-1 overflow-x-auto">
        {TABS.map(({ segment, label }) => {
          const href = segment ? `${base}/${segment}` : base;
          const isActive = segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === base;
          return (
            <Link
              key={segment || "overview"}
              href={href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors ${
                isActive
                  ? "bg-mist-gray text-carbon-black"
                  : "text-slate hover:bg-mist-gray/60 hover:text-carbon-black"
              }`}
            >
              {segment === "review" && <GraduationCap size={14} />}
              {label}
              {segment === "review" && dueReviewCount > 0 && (
                <span className="rounded-full bg-carbon-black px-1.5 py-0.5 font-mono text-[10px] text-paper-white">
                  {dueReviewCount > 99 ? "99+" : dueReviewCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
