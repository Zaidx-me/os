import { Router } from "express";
import { MUSIC_LIBRARY } from "./music-library.js";

const JAMENDO_URL = "https://api.jamendo.com/v3.0/tracks/";
const FREESOUND_URL = "https://freesound.org/apiv2/search/text/";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function localFallback() {
  return {
    source: "local",
    tracks: MUSIC_LIBRARY.map((t) => ({ ...t, source: "local" })),
    attribution: "SoundHelix demo tracks (fallback when no API keys are configured).",
  };
}

async function fetchJamendo(clientId, search) {
  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: search ? "20" : "12",
    audioformat: "mp32",
    include: "musicinfo",
  });
  if (search) params.set("search", search);
  else {
    params.set("order", "popularity_total");
    params.set("tags", "instrumental+electronic");
  }

  const res = await fetch(`${JAMENDO_URL}?${params}`, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? [])
    .filter((t) => t.audio)
    .map((t) => ({
      id: `jamendo-${t.id}`,
      title: t.name,
      artist: t.artist_name,
      album: t.album_name || "Jamendo",
      duration: formatDuration(t.duration),
      src: t.audio,
      art: t.image || "/pictures/mountains.jpg",
      license: t.license_ccurl,
      source: "jamendo",
    }));
}

export const musicRouter = Router();

musicRouter.get("/", async (req, res) => {
  const query = (req.query.q ?? "").trim();
  const jamendoId = process.env.JAMENDO_CLIENT_ID?.trim();

  if (query) {
    if (!jamendoId) {
      const local = localFallback().tracks.filter((t) =>
        `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(query.toLowerCase()),
      );
      return res.json({
        source: "local",
        tracks: local.length > 0 ? local : localFallback().tracks.slice(0, 5),
        attribution: "Search requires JAMENDO_CLIENT_ID for online catalog.",
      });
    }
    try {
      const tracks = await fetchJamendo(jamendoId, query);
      return res.json({
        source: "jamendo",
        tracks,
        attribution: tracks.length ? "Music via Jamendo API (Creative Commons)." : "No tracks matched.",
      });
    } catch {
      return res.json(localFallback());
    }
  }

  if (!jamendoId) {
    return res.json(localFallback());
  }

  try {
    const tracks = await fetchJamendo(jamendoId);
    if (tracks.length === 0) return res.json(localFallback());
    return res.json({
      source: "jamendo",
      tracks,
      attribution: "Music via Jamendo API (Creative Commons).",
    });
  } catch {
    return res.json(localFallback());
  }
});
