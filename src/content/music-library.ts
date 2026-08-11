import type { MusicTrack } from "@/lib/music/types";

/** Local fallback tracks when Jamendo/Freesound API keys are not configured. */
export const MUSIC_LIBRARY: Omit<MusicTrack, "source">[] = [
  {
    id: "song-1",
    title: "SoundHelix Song 1",
    artist: "SoundHelix",
    album: "Examples",
    duration: "6:12",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    art: "/pictures/mountains.jpg",
  },
  {
    id: "song-2",
    title: "SoundHelix Song 2",
    artist: "SoundHelix",
    album: "Examples",
    duration: "8:38",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    art: "/pictures/river.jpg",
  },
  {
    id: "song-3",
    title: "SoundHelix Song 3",
    artist: "SoundHelix",
    album: "Examples",
    duration: "5:41",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    art: "/pictures/forest.jpg",
  },
  {
    id: "song-4",
    title: "SoundHelix Song 4",
    artist: "SoundHelix",
    album: "Examples",
    duration: "5:05",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    art: "/pictures/coast.jpg",
  },
  {
    id: "song-5",
    title: "SoundHelix Song 5",
    artist: "SoundHelix",
    album: "Examples",
    duration: "7:19",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    art: "/pictures/portrait.jpg",
  },
];
