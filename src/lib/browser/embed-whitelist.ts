/** Pre-verified embed targets — skip /api/can-embed for these. */
export interface EmbedBookmark {
  id: string;
  label: string;
  url: string;
}

export const EMBED_BOOKMARKS: EmbedBookmark[] = [
  { id: "example", label: "Example.com", url: "https://example.com" },
  { id: "zaidx", label: "ZaidOS", url: "https://zaidx.me" },
  { id: "applicator", label: "Applicator", url: "https://applicator.netlify.app" },
  { id: "kenspk", label: "KenSPK", url: "https://kenspk.netlify.app" },
  { id: "pustacks", label: "PUStacks", url: "https://pustacks.netlify.app" },
  { id: "whatbot", label: "WhatBot", url: "https://whatbot.zaidx.me" },
  {
    id: "youtube-demo",
    label: "YouTube",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "codesandbox-demo",
    label: "CodeSandbox",
    url: "https://codesandbox.io/embed/react-new?fontsize=14&hidenavigation=1&theme=dark",
  },
];

const TRUSTED_HOST_SUFFIXES = [
  "example.com",
  "zaidx.me",
  "whatbot.zaidx.me",
  "netlify.app",
  "pages.dev",
  "youtube.com",
  "youtu.be",
  "google.com",
  "googleusercontent.com",
  "codesandbox.io",
  "codepen.io",
  "figma.com",
  "spotify.com",
  "pugcexam.site",
] as const;

function hostMatches(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return TRUSTED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

export function isWhitelistedUrl(url: string): boolean {
  try {
    return hostMatches(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Normalize known hosts to iframe-friendly embed URLs when possible. */
export function resolveEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com") && parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (host.includes("spotify.com") && !parsed.pathname.includes("/embed/")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

export function faviconUrl(url: string, size = 64): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=example.com&sz=${size}`;
  }
}
