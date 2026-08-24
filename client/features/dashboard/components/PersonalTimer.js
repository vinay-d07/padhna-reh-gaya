"use client";

import { useEffect, useState } from "react";
import { Play, Square } from "lucide-react";
import formatElapsed from "@/lib/formatElapsed";
import {
  getActiveStudySession,
  startStudySession,
  endStudySession,
} from "@/features/rooms/rooms.services";

// A standalone "Start Studying" timer for the dashboard navbar — for
// solo studying with no room involved. It's the exact same StudySession
// resource a room's Start button uses (roomId just omitted), so this also
// reflects a session someone started inside a room if they navigate back
// here without stopping it — there's only ever one active session per
// user regardless of where it was started.
export default function PersonalTimer() {
  const [session, setSession] = useState(null);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getActiveStudySession()
      .then((data) => !cancelled && setSession(data ?? null))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const tick = () => setNow(Date.now());
    const timeout = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [session]);

  const handleStart = async () => {
    setBusy(true);
    setError(null);
    try {
      const newSession = await startStudySession();
      setSession(newSession);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't start.");
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await endStudySession(session.id);
      setSession(null);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't stop.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-ash bg-paper-white px-3 py-2"
      title={error || undefined}
    >
      {session ? (
        <>
          <span className="font-mono text-body-sm text-emerald-700">{formatElapsed(session.startedAt, now)}</span>
          <button
            onClick={handleStop}
            disabled={busy}
            aria-label="Stop studying"
            className="flex h-6 w-6 items-center justify-center rounded-md bg-red-600 text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            <Square size={10} />
          </button>
        </>
      ) : (
        <button
          onClick={handleStart}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-carbon-black transition-opacity hover:opacity-70 disabled:opacity-40"
        >
          <Play size={12} />
          Start studying
        </button>
      )}
    </div>
  );
}
