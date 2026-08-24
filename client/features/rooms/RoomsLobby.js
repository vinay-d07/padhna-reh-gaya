"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Lock, Plus, Users } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import CreateRoomModal from "./components/CreateRoomModal";
import { listRooms, lookupRoomByCode } from "./rooms.services";

export default function RoomsLobby() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listRooms()
      .then((data) => !cancelled && setRooms(data ?? []))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-warm-canvas">
      <header className="mx-auto flex w-full max-w-[1000px] items-center justify-between px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-body-sm text-slate transition-colors hover:text-carbon-black"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <UserButton
          appearance={{ elements: { userButtonAvatarBox: "h-9 w-9 rounded-lg border border-ash" } }}
        />
      </header>

      <main className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-6 pb-20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-heading uppercase text-carbon-black sm:text-heading-lg">
              Study rooms
            </h1>
            <p className="mt-2 text-subheading text-slate">
              Join others studying live, or start your own room.
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-carbon-black px-5 py-3 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
          >
            <Plus size={15} />
            New room
          </button>
        </div>

        <JoinByCode />

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-card" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex w-full flex-col items-center gap-3 rounded-card border-2 border-dashed border-ash bg-paper-white p-10 text-center transition-colors hover:border-carbon-black"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-chip">
              <Plus size={18} className="text-carbon-black" />
            </span>
            <span className="text-body-sm font-medium text-carbon-black">Start the first room</span>
            <span className="text-caption text-slate">
              Anyone signed in can join and see the room live.
            </span>
          </button>
        ) : (
          <div className="animate-fade-in grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </main>

      <CreateRoomModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function JoinByCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const room = await lookupRoomByCode(trimmed);
      // The code carries forward as a query param so the room's join gate
      // unlocks immediately instead of asking for it a second time — see
      // RoomPage's initial getRoom(roomId, code) preview call.
      router.push(`/rooms/${room.id}?code=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(err.response?.data?.message || "No room found with that code.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-card bg-paper-white p-4 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor="lobby-join-code" className="inline-flex shrink-0 items-center gap-1.5 text-body-sm font-medium text-slate">
        <Lock size={13} />
        Have a room code?
      </label>
      <input
        id="lobby-join-code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="e.g. A1B2C3"
        maxLength={20}
        className="min-w-0 flex-1 rounded-lg border border-ash px-3 py-2 font-mono text-body-sm text-carbon-black outline-none focus:border-carbon-black"
      />
      <button
        type="submit"
        disabled={submitting || !code.trim()}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-carbon-black px-4 py-2 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {submitting ? "Looking up…" : "Join"}
        <ArrowRight size={13} />
      </button>
      {error && <p className="text-body-sm text-red-600 sm:ml-2">{error}</p>}
    </form>
  );
}

function RoomCard({ room }) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="flex flex-col gap-3 rounded-card bg-paper-white p-5 transition-colors hover:bg-mist-gray/60"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate font-sans text-body font-medium text-carbon-black">{room.name}</h3>
        {room.participantCount > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mint-chip/40 px-2 py-0.5 font-mono text-caption text-carbon-black">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Live
          </span>
        )}
      </div>
      {room.description && <p className="text-body-sm text-slate">{room.description}</p>}
      <div className="mt-auto inline-flex items-center gap-1.5 text-caption font-mono uppercase text-smoke">
        <Users size={13} />
        {room.participantCount} {room.participantCount === 1 ? "person" : "people"} studying
      </div>
    </Link>
  );
}
