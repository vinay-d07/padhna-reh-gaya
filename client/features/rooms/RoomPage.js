"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Copy, Check, Lock, Play, Square } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import formatElapsed from "@/lib/formatElapsed";
import MusicPlayer from "./components/MusicPlayer";
import RoomChat from "./components/RoomChat";
import JoinGate from "./components/JoinGate";
import {
  getRoom,
  joinRoom,
  startStudySession,
  endStudySession,
  getRoomMessages,
  sendRoomMessage,
  reactToRoomMessage,
} from "./rooms.services";
import { connectSocket, disconnectSocket, getSocket } from "./socket";
import { useToast } from "@/providers/ToastProvider";

function formatStudyDuration(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "under a minute";
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function RoomPage({ roomId }) {
  const { showToast } = useToast();
  // Set when arriving from the lobby's "have a code?" lookup (see
  // RoomsLobby.js JoinByCode) — carried through so the gate below doesn't
  // ask for the code a second time.
  const codeFromUrl = useSearchParams().get("code") || "";
  const [phase, setPhase] = useState("loading"); // loading | gate | active | notfound
  const [preview, setPreview] = useState(null);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [feed, setFeed] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  // 0 (not Date.now()) so the initial render stays pure — the effect below
  // sets the real value from inside a callback on mount, then ticks it.
  const [now, setNow] = useState(0);
  const joinedRef = useRef(false);

  const logEvent = useCallback((text) => {
    setFeed((prev) => [{ id: `${Date.now()}-${Math.random()}`, text, at: new Date() }, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timeout = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Pre-join preview: works even for a private room the caller hasn't
  // joined yet (returns a locked summary — see rooms/services.js
  // getRoomDetail) so the join-code + "what are you studying" gate can be
  // rendered before anything about the room's live state is fetched.
  useEffect(() => {
    let cancelled = false;
    getRoom(roomId, codeFromUrl || undefined)
      .then((detail) => {
        if (cancelled) return;
        setPreview(detail);
        setPhase("gate");
      })
      .catch(() => !cancelled && setPhase("notfound"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const registerSocketListeners = useCallback(
    (socket) => {
      socket.on("presence:joined", (p) => {
        setParticipants((prev) => [...prev.filter((x) => x.userId !== p.userId), p]);
        logEvent(`${p.name || "Someone"} joined`);
      });
      socket.on("presence:left", ({ userId }) => {
        setParticipants((prev) => {
          const who = prev.find((p) => p.userId === userId);
          if (who) logEvent(`${who.name || "Someone"} left`);
          return prev.filter((p) => p.userId !== userId);
        });
      });
      socket.on("session:started", ({ userId, sessionId, startedAt }) => {
        setParticipants((prev) => {
          const who = prev.find((p) => p.userId === userId);
          if (who) logEvent(`${who.name || "Someone"} started studying`);
          return prev.map((p) => (p.userId === userId ? { ...p, activeSession: { id: sessionId, startedAt } } : p));
        });
      });
      socket.on("session:ended", ({ userId, durationSeconds }) => {
        setParticipants((prev) => {
          const who = prev.find((p) => p.userId === userId);
          if (who) {
            const mins = Math.round(durationSeconds / 60);
            logEvent(`${who.name || "Someone"} studied for ${mins} min`);
          }
          return prev.map((p) => (p.userId === userId ? { ...p, activeSession: null } : p));
        });
      });
      socket.on("chat:message", (message) => {
        setMessages((prev) => [...prev, message]);
      });
      socket.on("chat:reaction", ({ messageId, reactions }) => {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
      });
      // On every (re)connect — not just the first — re-join the room's
      // Socket.io channel and re-sync the full participant list. Socket.io
      // does not remember room membership across a reconnect (a new
      // connection starts in zero rooms), so without the re-emit here a
      // client that reconnects (an expired auth token, a network blip)
      // would silently stop receiving any further presence/session/chat
      // events for this room — which is what was making other people's
      // timers look stuck or wrong after a dropped connection. Paired with
      // socket.js fetching a fresh auth token on every reconnect attempt.
      socket.on("connect", () => {
        socket.emit("room:enter", { roomId });
        getRoom(roomId)
          .then((detail) => {
            if (!detail.locked) setParticipants(detail.participants ?? []);
          })
          .catch(() => {});
      });
    },
    [roomId, logEvent]
  );

  const handleJoin = async ({ code, topic }) => {
    const participant = await joinRoom(roomId, { code, topic });
    joinedRef.current = true;
    setMyUserId(participant.userId);

    try {
      const [detail, history] = await Promise.all([
        getRoom(roomId),
        getRoomMessages(roomId).catch(() => []),
      ]);
      setRoom(detail);
      setParticipants(detail.participants ?? []);
      setMessages(history);
    } catch {
      // Best-effort — we're already a member server-side, so live socket
      // events will keep the view current even if this initial snapshot
      // fetch failed.
    }

    const socket = await connectSocket();
    socket.emit("room:enter", { roomId });
    registerSocketListeners(socket);

    setPhase("active");
  };

  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        // An explicit room:exit (immediate, no grace period) rather than a
        // REST leaveRoom() call here — the server is the one that knows
        // whether this is the account's last open tab on the room (see
        // rooms/socketHandlers.js trackExit), so it should also be the one
        // deciding whether to actually end the session / mark them absent.
        getSocket()?.emit("room:exit", { roomId });
        disconnectSocket();
        joinedRef.current = false;
      }
    };
  }, [roomId]);

  const handleStart = async () => {
    setBusy(true);
    setError(null);
    try {
      await startStudySession(roomId);
    } catch (err) {
      const message = err.response?.data?.message || "Couldn't start a session.";
      setError(message);
      showToast({ message, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async (sessionId) => {
    setBusy(true);
    setError(null);
    try {
      const ended = await endStudySession(sessionId);
      showToast({ message: `You studied for ${formatStudyDuration(ended.durationSeconds)} — nice work.` });
    } catch (err) {
      const message = err.response?.data?.message || "Couldn't end the session.";
      setError(message);
      showToast({ message, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async (content) => {
    await sendRoomMessage(roomId, content);
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await reactToRoomMessage(roomId, messageId, emoji);
    } catch {
      showToast({ message: "Couldn't add that reaction. Try again.", tone: "error" });
    }
  };

  if (phase === "notfound") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-warm-canvas p-4 text-center">
        <p className="text-body text-carbon-black">Room not found.</p>
        <Link href="/rooms" className="text-body-sm text-slate underline hover:text-carbon-black">
          Back to rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-canvas p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Link
          href="/rooms"
          className="inline-flex w-fit items-center gap-1.5 text-body-sm text-slate transition-colors hover:text-carbon-black"
        >
          <ArrowLeft size={14} />
          All rooms
        </Link>

        {phase === "loading" && (
          <div className="rounded-card bg-paper-white p-6">
            <Skeleton className="h-6 w-1/3" />
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Skeleton className="h-28 w-full rounded-card" />
              <Skeleton className="h-28 w-full rounded-card" />
            </div>
          </div>
        )}

        {phase === "gate" && preview && (
          <JoinGate
            room={{ ...preview, needsCode: Boolean(preview.locked) }}
            defaultCode={codeFromUrl}
            onSubmit={handleJoin}
          />
        )}

        {phase === "active" && (
          <>
            <div className="rounded-card bg-paper-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="inline-flex items-center gap-2 font-display text-heading-sm uppercase text-carbon-black">
                    {room?.isPrivate && <Lock size={16} />}
                    {room?.name}
                  </h1>
                  {room?.description && <p className="mt-1 text-body-sm text-slate">{room.description}</p>}
                </div>
                {room?.joinCode && <InviteCode code={room.joinCode} />}
              </div>

              {error && <p className="mt-2 text-body-sm text-red-600">{error}</p>}

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {participants.map((p) => (
                  <ParticipantTile
                    key={p.userId}
                    participant={p}
                    isSelf={p.userId === myUserId}
                    now={now}
                    busy={busy}
                    onStart={handleStart}
                    onStop={handleStop}
                  />
                ))}
              </div>
            </div>

            <RoomChat
              messages={messages}
              onSend={handleSend}
              onReact={handleReact}
              myUserId={myUserId}
            />

            <div className="rounded-card bg-paper-white p-6">
              <p className="mb-3 font-mono text-caption uppercase text-smoke">Activity</p>
              {feed.length === 0 ? (
                <p className="text-body-sm text-slate">Nothing yet — be the first to start studying.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {feed.map((entry) => (
                    <li key={entry.id} className="text-body-sm text-slate">
                      <span className="text-carbon-black">{entry.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      <MusicPlayer />
    </div>
  );
}

function InviteCode({ code }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — nothing more we can do here
    }
  };

  return (
    <button
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-ash px-3 py-2 font-mono text-caption text-carbon-black transition-colors hover:border-carbon-black"
      title="Copy invite code"
    >
      {code}
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function ParticipantTile({ participant, isSelf, now, busy, onStart, onStop }) {
  const studying = Boolean(participant.activeSession);

  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-ash p-4 text-center">
      {participant.imageUrl ? (
        <img
          src={participant.imageUrl}
          alt={participant.name || "Participant"}
          className="h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mist-gray font-mono text-body-sm text-carbon-black">
          {initials(participant.name)}
        </div>
      )}

      <p className="truncate text-body-sm font-medium text-carbon-black">
        {participant.name || "Studying"} {isSelf && <span className="text-smoke">(you)</span>}
      </p>

      {participant.topic && (
        <p className="truncate text-caption text-slate" title={participant.topic}>
          {participant.topic}
        </p>
      )}

      {studying ? (
        <p className="font-mono text-caption text-emerald-700">
          Studying — {formatElapsed(participant.activeSession.startedAt, now)}
        </p>
      ) : (
        <p className="font-mono text-caption text-smoke">Idle</p>
      )}

      {isSelf &&
        (studying ? (
          <button
            onClick={() => onStop(participant.activeSession.id)}
            disabled={busy}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-caption font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            <Square size={11} />
            Stop
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={busy}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-carbon-black px-3 py-1.5 text-caption font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            <Play size={11} />
            Start studying
          </button>
        ))}
    </div>
  );
}
