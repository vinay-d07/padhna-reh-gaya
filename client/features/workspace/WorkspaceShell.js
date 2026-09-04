"use client";

import { useCallback, useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import WorkspaceSubNav from "./components/WorkspaceSubNav";
import { WorkspaceProvider } from "./WorkspaceContext";
import { getWorkspace } from "./workspace.services";
import { getReviewStats } from "@/features/review/review.services";

export default function WorkspaceShell({ workspaceId, children }) {
  const [workspace, setWorkspace] = useState(null);
  const [dueReviewCount, setDueReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshDueReviewCount = useCallback(() => {
    getReviewStats(workspaceId)
      .then((stats) => setDueReviewCount(stats?.dueCount ?? 0))
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([getWorkspace(workspaceId), getReviewStats(workspaceId)]).then((results) => {
      if (cancelled) return;
      if (results[0].status === "fulfilled") setWorkspace(results[0].value ?? null);
      if (results[1].status === "fulfilled") setDueReviewCount(results[1].value?.dueCount ?? 0);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  return (
    <div className="flex h-screen flex-col bg-warm-canvas">
      <TopNav />
      <WorkspaceSubNav
        workspaceId={workspaceId}
        workspaceName={workspace?.name || "Workspace"}
        dueReviewCount={dueReviewCount}
        loading={loading}
      />
      <div className="min-h-0 flex-1 overflow-hidden p-4">
        <WorkspaceProvider
          value={{ workspaceId, workspace, setWorkspace, dueReviewCount, refreshDueReviewCount }}
        >
          {children}
        </WorkspaceProvider>
      </div>
    </div>
  );
}
