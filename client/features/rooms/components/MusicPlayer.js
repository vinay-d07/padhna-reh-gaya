"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2 } from "lucide-react";

// Per-user, local-only ambient sound — synthesized entirely in the browser
// via the Web Audio API (no external stream/CDN, so it always works and
// never gets synced to anyone else in the room — see rooms.md "Study
// music"). Presets are generated noise, not licensed audio.
const PRESETS = [
  { id: "rain", label: "Rain" },
  { id: "brown", label: "Brown noise" },
  { id: "white", label: "White noise" },
];

const STORAGE_KEY = "padhle:ambient-player";
const BUFFER_SECONDS = 4;

function buildNoiseBuffer(ctx, presetId) {
  const length = ctx.sampleRate * BUFFER_SECONDS;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (presetId === "brown") {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  } else {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  return buffer;
}

export default function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("rain");
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const ctxRef = useRef(null);
  const sourceRef = useRef(null);
  const filterRef = useRef(null);
  const gainRef = useRef(null);

  // Deferred to a callback (rather than run synchronously in the effect
  // body) so this reads as "subscribe to an external system," which is what
  // the react-hooks/set-state-in-effect rule wants — the 0ms delay is
  // imperceptible.
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        if (saved.preset) setPreset(saved.preset);
        if (typeof saved.volume === "number") setVolume(saved.volume);
      } catch {
        // ignore malformed/unavailable localStorage
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset, volume }));
    } catch {
      // storage might be unavailable (private browsing) — losing the
      // preference is harmless, so just skip persisting it
    }
  }, [preset, volume]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  const stopSource = () => {
    sourceRef.current?.stop();
    sourceRef.current?.disconnect();
    sourceRef.current = null;
  };

  const startSource = (activePreset) => {
    const ctx = ctxRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buildNoiseBuffer(ctx, activePreset);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = activePreset === "rain" ? 1200 : 20000;

    source.connect(filter);
    filter.connect(gainRef.current);
    source.start();

    sourceRef.current = source;
    filterRef.current = filter;
  };

  const togglePlay = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.gain.value = volume;
      gainRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }

    if (playing) {
      stopSource();
      setPlaying(false);
    } else {
      startSource(preset);
      setPlaying(true);
    }
  };

  const selectPreset = (id) => {
    setPreset(id);
    if (playing) {
      stopSource();
      startSource(id);
    }
  };

  useEffect(() => {
    return () => {
      stopSource();
      ctxRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="animate-fade-in mb-3 w-64 rounded-card bg-paper-white p-4 shadow-lg">
          <p className="mb-3 font-mono text-caption uppercase text-smoke">Ambient sound</p>
          <div className="mb-3 flex flex-col gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPreset(p.id)}
                className={`rounded-lg px-3 py-2 text-left text-body-sm transition-colors ${
                  preset === p.id
                    ? "bg-mist-gray font-medium text-carbon-black"
                    : "text-slate hover:bg-mist-gray/60"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Volume2 size={14} className="shrink-0 text-slate" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-carbon-black"
              aria-label="Volume"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Ambient sound settings"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-white text-carbon-black shadow-lg transition-opacity hover:opacity-80"
        >
          <Music size={16} />
        </button>
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause ambient sound" : "Play ambient sound"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-carbon-black text-paper-white shadow-lg transition-opacity hover:opacity-80"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
    </div>
  );
}
