"use client";

import { useEffect, useState } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import ActivityHeatmap from "./components/ActivityHeatmap";
import StudyInsights from "./components/StudyInsights";
import WorkspaceList from "./components/WorkspaceList";
import CreateWorkspaceModal from "./components/CreateWorkspaceModal";
import { getWorkspaces, getStudyInsights, getActivity } from "./dash.services";

export default function DashboardPage() {
  const { userId, isLoaded } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [insights, setInsights] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    let cancelled = false;

    async function load() {
      const results = await Promise.allSettled([
        getWorkspaces(userId),
        getStudyInsights(userId),
        getActivity(userId),
      ]);

      if (cancelled) return;

      if (results[0].status === "fulfilled") setWorkspaces(results[0].value ?? []);
      if (results[1].status === "fulfilled") setInsights(results[1].value ?? null);
      if (results[2].status === "fulfilled") setActivity(results[2].value ?? []);

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  return (
    <div className="min-h-screen bg-warm-canvas">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-8">
        <span className="font-display text-2xl uppercase tracking-wide text-carbon-black">
          padhle
        </span>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-9 w-9 rounded-lg border border-ash",
            },
          }}
        />
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 pb-20">
        <div>
          <h1 className="font-display text-heading uppercase text-carbon-black sm:text-heading-lg">
            Dashboard
          </h1>
          <p className="mt-2 text-subheading text-slate">
            Pick up where you left off, or start a new workspace.
          </p>
        </div>

        {!loading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section className="flex flex-col gap-4">
              <StudyInsights insights={insights} />
              <ActivityHeatmap data={activity} />
            </section>

            <WorkspaceList
              workspaces={workspaces}
              onCreateClick={() => setCreateModalOpen(true)}
            />
          </div>
        )}
      </main>

      <CreateWorkspaceModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
}
