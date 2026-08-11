/** Normalized track for the Music app (Jamendo API or local fallback). */
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  src: string;
  art: string;
  license?: string;
  source: "jamendo" | "freesound" | "local";
}

export interface MusicCatalogResponse {
  tracks: MusicTrack[];
  source: "jamendo" | "local";
  attribution?: string;
}
