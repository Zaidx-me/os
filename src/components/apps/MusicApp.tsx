"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { OsAppShell, OsButton, OsPanel, OsStatusBar } from "@/components/os";
import { MUSIC_LIBRARY } from "@/content/music-library";
import type { MusicCatalogResponse, MusicTrack } from "@/lib/music/types";
import type { WindowAppProps } from "@/lib/apps";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function toLocalTracks(): MusicTrack[] {
  return MUSIC_LIBRARY.map((t) => ({ ...t, source: "local" as const }));
}

export function MusicApp(_props: WindowAppProps) {
  const [tracks, setTracks] = useState<MusicTrack[]>(toLocalTracks);
  const [catalogSource, setCatalogSource] = useState<string>("local");
  const [attribution, setAttribution] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/music");
        if (!res.ok) throw new Error("catalog fetch failed");
        const data = (await res.json()) as MusicCatalogResponse;
        if (cancelled || data.tracks.length === 0) return;
        setTracks(data.tracks);
        setCatalogSource(data.source);
        setAttribution(data.attribution ?? "");
        setTrackIndex(0);
      } catch {
        /* keep local fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const track = tracks[trackIndex] ?? tracks[0]!;

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const playTrack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play();
    setPlaying(true);
  }, []);

  useEffect(() => {
    stopPlayback();
  }, [trackIndex, stopPlayback]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const prev = () => {
    setTrackIndex((i) => (i - 1 + tracks.length) % tracks.length);
  };

  const next = () => {
    setTrackIndex((i) => (i + 1) % tracks.length);
  };

  return (
    <OsAppShell
      testId="app-content-music"
      statusBar={
        <OsStatusBar>
          <span>
            {catalogSource === "jamendo" ? "Jamendo CC library" : "Music library"}
            {loading ? " · loading…" : ""}
          </span>
          <span>{playing ? "Playing" : "Paused"}</span>
        </OsStatusBar>
      }
    >
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        crossOrigin="anonymous"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setCurrentTime(el.currentTime);
          setDuration(el.duration || 0);
          setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
        }}
        onEnded={() => next()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="flex h-full flex-col gap-4 p-4">
        <OsPanel className="flex flex-col items-center gap-4 py-8">
          <div className="relative h-40 w-40 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10">
            <Image
              src={track.art}
              alt={track.album}
              fill
              className="object-cover"
              sizes="160px"
              unoptimized={track.art.startsWith("http")}
            />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-zaid-text">{track.title}</p>
            <p className="text-sm text-zaid-muted">{track.artist}</p>
            <p className="text-xs text-zaid-muted">{track.album}</p>
            {track.license && (
              <a
                href={track.license.startsWith("http") ? track.license : undefined}
                className="mt-1 inline-block text-[10px] text-zaid-accent hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {track.source === "jamendo" ? "Creative Commons license" : "License"}
              </a>
            )}
          </div>
          <div className="w-full max-w-sm">
            <div className="mb-1 flex justify-between text-[10px] tabular-nums text-zaid-muted">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zaid-surface2">
              <div
                className="h-full rounded-full bg-zaid-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <OsButton variant="icon" aria-label="Previous" onClick={prev}>
              <SkipBack size={18} />
            </OsButton>
            <OsButton
              variant="primary"
              data-testid="music-play"
              aria-label={playing ? "Pause" : "Play"}
              className="h-10 w-10 rounded-full"
              onClick={() => (playing ? stopPlayback() : playTrack())}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </OsButton>
            <OsButton variant="icon" aria-label="Next" onClick={next}>
              <SkipForward size={18} />
            </OsButton>
          </div>
        </OsPanel>

        {attribution && (
          <p className="px-1 text-[10px] leading-relaxed text-zaid-muted">{attribution}</p>
        )}

        <div className="flex flex-col gap-1">
          <p className="label-caps px-1">Library</p>
          {tracks.map((t, i) => (
            <button
              key={t.id}
              type="button"
              data-testid={`music-track-${t.id}`}
              onClick={() => {
                stopPlayback();
                setTrackIndex(i);
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                i === trackIndex ? "bg-zaid-accent/10 ring-1 ring-zaid-accent/30" : "hover:bg-zaid-surface2"
              }`}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={t.art}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized={t.art.startsWith("http")}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zaid-text">{t.title}</p>
                <p className="truncate text-xs text-zaid-muted">
                  {t.artist}
                  {t.source !== "local" && ` · ${t.source}`}
                </p>
              </div>
              <span className="text-[10px] text-zaid-muted">{t.duration}</span>
            </button>
          ))}
        </div>
      </div>
    </OsAppShell>
  );
}

export default MusicApp;
