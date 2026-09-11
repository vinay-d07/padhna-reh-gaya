"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { GraduationCap, Flame, ArrowRight } from "lucide-react";
import TopNav from "@/components/TopNav";
import ActivityHeatmap from "./components/ActivityHeatmap";
import StudyInsights from "./components/StudyInsights";
import WorkspaceList from "./components/WorkspaceList";
import CreateWorkspaceModal from "./components/CreateWorkspaceModal";
import PersonalTimer from "./components/PersonalTimer";
import Skeleton from "@/components/Skeleton";
import OnboardingWalkthrough from "@/features/onboarding/OnboardingWalkthrough";
import { getWorkspaces, getStudyInsights, getActivity } from "./dash.services";

export default function DashboardPage() {
  const { userId, isLoaded } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [insights, setInsights] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

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

      const pendingKey = `padhle:onboarding-pending:${userId}`;
      if (localStorage.getItem(pendingKey)) {
        localStorage.removeItem(pendingKey);
        setOnboardingOpen(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  const sampleWorkspace = workspaces.find((w) => w.name === "Try Padhle");

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
              <StudyPrompt insights={insights} workspaces={workspaces} />
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
      <OnboardingWalkthrough
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        sampleWorkspaceId={sampleWorkspace?.id}
      />
    </div>
  );
}

// The "should I study today?" answer, ahead of the log-shaped insights grid
// and heatmap below it — leads with the one number that actually matters
// right now (due cards, or a streak worth protecting) instead of making the
// user scan tiles to figure that out themselves.
function StudyPrompt({ insights, workspaces }) {
  const dueFlashcards = insights?.dueFlashcards ?? 0;
  const currentStreak = insights?.currentStreak ?? 0;
  const targetWorkspace =
    workspaces.find((w) => (w._count?.documents ?? 0) > 0) ?? workspaces[0];

  if (dueFlashcards > 0 && targetWorkspace) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-carbon-black px-6 py-5 text-paper-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-chip text-carbon-black">
            <GraduationCap size={18} />
          </span>
          <div>
            <p className="font-display text-heading-sm">
              You have {dueFlashcards} card{dueFlashcards === 1 ? "" : "s"} due
            </p>
            <p className="text-body-sm text-paper-white/70">A few minutes now keeps it from piling up.</p>
          </div>
        </div>
        <Link
          href={`/workspace/${targetWorkspace.id}/review`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-mint-chip px-4 py-2.5 text-body-sm font-medium text-carbon-black transition-opacity hover:opacity-80"
        >
          Review now
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  if (currentStreak > 0) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-card bg-mint-chip/40 px-6 py-5 text-carbon-black">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-carbon-black text-mint-chip">
          <Flame size={18} />
        </span>
        <p className="font-display text-heading-sm">
          {currentStreak}-day streak — don&rsquo;t break it. Chat, review, or upload something today.
        </p>
      </div>
    );
  }

  return null;
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
