"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import TopNav from "@/components/TopNav";
import ActivityHeatmap from "./components/ActivityHeatmap";
import StudyInsights from "./components/StudyInsights";
import WorkspaceList from "./components/WorkspaceList";
import CreateWorkspaceModal from "./components/CreateWorkspaceModal";
import PersonalTimer from "./components/PersonalTimer";
import Skeleton from "@/components/Skeleton";
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
        getWorkspaces(),
        getStudyInsights(),
        getActivity(),
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
      <TopNav />

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 py-8 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-heading uppercase text-carbon-black sm:text-heading-lg">
              Dashboard
            </h1>
            <p className="mt-2 text-subheading text-slate">
              Pick up where you left off, or start a new workspace.
            </p>
          </div>
          <PersonalTimer />
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="animate-fade-in grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section className="flex flex-col gap-4">
              <StudyInsights insights={insights} workspaces={workspaces} />
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

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-card" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-card" />
      </section>

      <div className="rounded-card bg-paper-white p-6">
        <Skeleton className="mb-4 h-6 w-1/2" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </div>
  );
}
