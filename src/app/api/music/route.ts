import { NextResponse } from "next/server";
import { MUSIC_LIBRARY } from "@/content/music-library";
import { formatDuration } from "@/lib/music/format";
import type { MusicCatalogResponse, MusicTrack } from "@/lib/music/types";

const JAMENDO_URL = "https://api.jamendo.com/v3.0/tracks/";
const FREESOUND_URL = "https://freesound.org/apiv2/search/text/";

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  duration: number;
  audio: string;
  image: string;
  license_ccurl?: string;
}

interface JamendoResponse {
  results?: JamendoTrack[];
}

interface FreesoundResult {
  id: number;
  name: string;
  username: string;
  duration: number;
  previews?: { "preview-hq-mp3"?: string; "preview-lq-mp3"?: string };
  images?: { waveform_m?: string };
  license?: string;
}

interface FreesoundResponse {
  results?: FreesoundResult[];
}

function localFallback(): MusicCatalogResponse {
  return {
    source: "local",
    tracks: MUSIC_LIBRARY.map((t) => ({ ...t, source: "local" as const })),
    attribution: "SoundHelix demo tracks (fallback when no API keys are configured).",
  };
}

async function fetchJamendo(clientId: string): Promise<MusicTrack[]> {
  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: "12",
    audioformat: "mp32",
    order: "popularity_total",
    include: "musicinfo",
    tags: "instrumental+electronic",
  });

  const res = await fetch(`${JAMENDO_URL}?${params}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as JamendoResponse;
  const results = data.results ?? [];
  if (results.length === 0) return [];

  return results
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
      source: "jamendo" as const,
    }));
}

/** Creative-commons samples from Freesound (loops / ambient beds). */
async function fetchFreesound(apiKey: string): Promise<MusicTrack[]> {
  const params = new URLSearchParams({
    query: "ambient music loop creative commons",
    filter: 'license:"Creative Commons 0"',
    fields: "id,name,username,duration,previews,images,license",
    page_size: "4",
  });

  const res = await fetch(`${FREESOUND_URL}?${params}`, {
    headers: { Authorization: `Token ${apiKey}` },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as FreesoundResponse;
  const tracks: MusicTrack[] = [];
  for (const t of data.results ?? []) {
    const src = t.previews?.["preview-hq-mp3"] ?? t.previews?.["preview-lq-mp3"];
    if (!src) continue;
    tracks.push({
      id: `freesound-${t.id}`,
      title: t.name,
      artist: t.username,
      album: "Freesound",
      duration: formatDuration(t.duration),
      src,
      art: t.images?.waveform_m ?? "/pictures/forest.jpg",
      license: t.license,
      source: "freesound",
    });
  }
  return tracks;
}

/** Jamendo + optional Freesound CC catalog for the Music app. */
export async function GET() {
  const jamendoId = process.env.JAMENDO_CLIENT_ID?.trim();
  const freesoundKey = process.env.FREESOUND_API_KEY?.trim();

  if (!jamendoId && !freesoundKey) {
    return NextResponse.json(localFallback(), {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }

  try {
    const [jamendo, freesound] = await Promise.all([
      jamendoId ? fetchJamendo(jamendoId) : Promise.resolve([]),
      freesoundKey ? fetchFreesound(freesoundKey) : Promise.resolve([]),
    ]);

    const tracks = [...jamendo, ...freesound];
    if (tracks.length === 0) {
      return NextResponse.json(localFallback(), {
        headers: { "Cache-Control": "public, max-age=60" },
      });
    }

    const body: MusicCatalogResponse = {
      source: jamendo.length > 0 ? "jamendo" : "local",
      tracks,
      attribution:
        jamendo.length > 0
          ? "Music via Jamendo API (Creative Commons). Samples via Freesound when configured."
          : "Samples via Freesound API (Creative Commons).",
    };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json(localFallback(), {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }
}
