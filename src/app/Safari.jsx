import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiDownload,
  FiExternalLink,
  FiHome,
  FiImage,
  FiLock,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { useAppStore } from "../store/Appstore";
import { PENDING_KEY, confirmExternalUrl, openExternalUrl, prefersProxy } from "../zaidos/lib/openBrowser.js";
import { site } from "../zaidos/content/site.ts";

const HOME_URL = "https://www.google.com/webhp?igu=1";

const FAVORITES = [
  { id: "google", label: "Google", url: HOME_URL, gradient: "from-[#4285F4] to-[#1a73e8]" },
  { id: "zaidx", label: "zaidx.me", url: site.siteUrl, gradient: "from-[#059669] to-[#047857]" },
];

function isGoogleUrl(url) {
  try {
    return new URL(url).hostname.includes("google.com");
  } catch {
    return false;
  }
}

function isYouTubeUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com" || host.endsWith(".youtube.com");
  } catch {
    return false;
  }
}

function buildYouTubeEmbed(videoId, searchParams = new URLSearchParams()) {
  const embed = new URL(`https://www.youtube.com/embed/${videoId}`);
  const list = searchParams.get("list");
  const start = searchParams.get("t") || searchParams.get("start");
  if (list) embed.searchParams.set("list", list);
  if (start) embed.searchParams.set("start", String(start).replace(/s$/i, ""));
  embed.searchParams.set("rel", "0");
  embed.searchParams.set("modestbranding", "1");
  return embed.toString();
}

/** YouTube blocks the main site in iframes; /embed/ URLs work like Google result players. */
function toYouTubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id ? buildYouTubeEmbed(id, parsed.searchParams) : null;
    }

    if (!host.includes("youtube.com")) return null;

    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.toString();
    }

    const watchId = parsed.searchParams.get("v");
    if (watchId && parsed.pathname.startsWith("/watch")) {
      return buildYouTubeEmbed(watchId, parsed.searchParams);
    }

    const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?#]+)/);
    if (shortsMatch?.[1]) {
      return buildYouTubeEmbed(shortsMatch[1], parsed.searchParams);
    }

    const liveMatch = parsed.pathname.match(/^\/live\/([^/?#]+)/);
    if (liveMatch?.[1]) {
      return buildYouTubeEmbed(liveMatch[1], parsed.searchParams);
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeGoogleUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("google.com")) return url;

    if (parsed.pathname === "/" || parsed.pathname === "") {
      parsed.pathname = "/webhp";
    }
    if (!parsed.searchParams.has("igu")) {
      parsed.searchParams.set("igu", "1");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function processUrl(input) {
  let processedUrl = input.trim();
  if (!processedUrl) return HOME_URL;

  if (!processedUrl.includes(".") || processedUrl.includes(" ")) {
    return `https://www.google.com/search?igu=1&q=${encodeURIComponent(processedUrl)}`;
  }

  if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
    processedUrl = `https://${processedUrl}`;
  }

  if (isGoogleUrl(processedUrl)) {
    return normalizeGoogleUrl(processedUrl);
  }

  if (isYouTubeUrl(processedUrl)) {
    return toYouTubeEmbedUrl(processedUrl) ?? processedUrl;
  }

  return processedUrl;
}

function TrafficLights({ windowId }) {
  const close = useAppStore((s) => s.closeApp);
  const minimize = useAppStore((s) => s.minimizeApp);
  const toggleMaximize = useAppStore((s) => s.toggleMaximize);
  const windows = useAppStore((s) => s.windows);
  const win = windows.find((w) => w.id === windowId);
  const maximized = win ? win.maximized : false;

  return (
    <div className="group mr-4 flex shrink-0 items-center gap-2">
      <div
        className="flex h-3 w-3 cursor-pointer items-center justify-center rounded-full bg-[#ff5f57] shadow-sm transition-all duration-150 hover:bg-[#ff4136]"
        onClick={() => close(windowId)}
        title="Close"
      >
        <svg className="h-1.5 w-1.5 text-[#820005] opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 10 10">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div
        className="flex h-3 w-3 cursor-pointer items-center justify-center rounded-full bg-[#febc2e] shadow-sm transition-all duration-150 hover:bg-[#ff9500]"
        onClick={() => minimize(windowId)}
        title="Minimize"
      >
        <svg className="h-1.5 w-1.5 text-[#9a6400] opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 10 10">
          <path d="M1 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div
        className="flex h-3 w-3 cursor-pointer items-center justify-center rounded-full bg-[#28c840] shadow-sm transition-all duration-150 hover:bg-[#1aab29]"
        onClick={() => toggleMaximize(windowId)}
        title={maximized ? "Restore" : "Maximize"}
      >
        <svg className="h-1.5 w-1.5 text-[#006500] opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 10 10">
          {maximized ? (
            <>
              <rect x="1.5" y="3.5" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3.5 3.5V1.5H8.5V6.5H6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </>
          ) : (
            <>
              <path d="M1 1L4 4M1 1V3.5M1 1H3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M9 9L6 6M9 9V6.5M9 9H6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function StartPage({ isDarkMode, onNavigate }) {
  const [query, setQuery] = useState("");

  return (
    <div
      data-testid="browser-start-page"
      className={`flex h-full flex-col overflow-y-auto ${isDarkMode ? "bg-[#1c1c1e]" : "bg-[#f5f5f7]"}`}
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-10">
        <div className="text-center">
          <p className={`text-[28px] font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Safari
          </p>
          <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
            Search the web or enter a URL
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onNavigate(query || HOME_URL);
          }}
          className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-sm ${
            isDarkMode ? "border-[#3d3d3f] bg-[#2c2c2e]" : "border-black/[0.06] bg-white"
          }`}
        >
          <FiLock size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
          <input
            data-testid="browser-start-search"
            type="text"
            placeholder="Search or enter website name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`min-w-0 flex-1 bg-transparent text-[15px] outline-none ${isDarkMode ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`}
          />
        </form>

        <section>
          <h2 className={`mb-3 text-[11px] font-semibold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Favorites
          </h2>
          <div className="mx-auto grid max-w-xs grid-cols-2 gap-4">
            {FAVORITES.map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`browser-favorite-${item.id}`}
                onClick={() => onNavigate(item.url)}
                className="group flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-lg font-bold text-white shadow-md group-hover:brightness-110`}
                >
                  {item.label.charAt(0)}
                </span>
                <span className={`max-w-[72px] truncate text-[11px] font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function Safari({
  initialUrl = HOME_URL,
  windowId,
  isDragging,
  isResizing,
  showStartPage = true,
}) {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [frameSrc, setFrameSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([HOME_URL]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [embedNote, setEmbedNote] = useState(null);
  const [showStart, setShowStart] = useState(showStartPage);
  const iframeRef = useRef(null);
  const sessionRef = useRef(null);

  const atStartPage = showStart && showStartPage && currentUrl === HOME_URL && !frameSrc;

  const deferToExternalBrowser = useCallback(async (targetUrl) => {
    setIsLoading(false);
    const confirmed = await confirmExternalUrl(targetUrl);
    if (!confirmed) {
      setShowStart(true);
      setCurrentUrl(HOME_URL);
      setFrameSrc(null);
      setIsLoading(false);
      setEmbedNote(null);
      return;
    }

    openExternalUrl(targetUrl);
    setFrameSrc(null);
    setCurrentUrl(HOME_URL);
    setIsLoading(false);
    setEmbedNote(null);
  }, []);

  const navigate = useCallback((inputUrl) => {
    const processedUrl = processUrl(inputUrl);
    setShowStart(false);
    setCurrentUrl(processedUrl);
    setIsLoading(true);
    setEmbedNote(null);
    setHistoryIndex((i) => {
      setHistory((prev) => [...prev.slice(0, i + 1), processedUrl]);
      return i + 1;
    });
  }, []);

  useEffect(() => {
    function go(raw) {
      if (!raw?.trim()) return;
      navigate(raw);
    }

    function onOpenBrowser(e) {
      const fromEvent = e.detail?.url;
      const fromStore = sessionStorage.getItem(PENDING_KEY);
      const target = fromEvent || fromStore;
      sessionStorage.removeItem(PENDING_KEY);
      go(target);
    }

    window.addEventListener("zaidos:open-browser", onOpenBrowser);

    const pending = sessionStorage.getItem(PENDING_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_KEY);
      go(pending);
    }

    return () => window.removeEventListener("zaidos:open-browser", onOpenBrowser);
  }, [navigate]);

  useEffect(() => {
    if (atStartPage) {
      setFrameSrc(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function resolveFrame() {
      setIsLoading(true);
      setEmbedNote(null);

      // Direct iframe only when the site allows embedding (Google + frame-friendly origins).
      if (isGoogleUrl(currentUrl)) {
        if (!cancelled) {
          setFrameSrc(currentUrl);
          setIsLoading(false);
        }
        return;
      }

      if (isYouTubeUrl(currentUrl)) {
        const embedUrl = toYouTubeEmbedUrl(currentUrl);
        if (embedUrl && !cancelled) {
          setFrameSrc(embedUrl);
          setIsLoading(false);
          return;
        }
        if (!cancelled) deferToExternalBrowser(currentUrl);
        return;
      }

      if (prefersProxy(currentUrl)) {
        if (!cancelled) deferToExternalBrowser(currentUrl);
        return;
      }

      try {
        const embedRes = await fetch(`/api/can-embed?url=${encodeURIComponent(currentUrl)}`);
        if (embedRes.ok) {
          const { embeddable } = await embedRes.json();
          if (embeddable && !cancelled) {
            setFrameSrc(currentUrl);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        /* continue to cloud browser / external fallback */
      }

      try {
        const res = await fetch("/api/browser/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentUrl, sessionId: sessionRef.current ?? undefined }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.viewerUrl && data.sessionId) {
            sessionRef.current = data.sessionId;
            if (!cancelled) {
              setFrameSrc(data.viewerUrl);
              setIsLoading(false);
            }
            return;
          }
        }
      } catch {
        /* fallback below */
      }

      if (!cancelled) deferToExternalBrowser(currentUrl);
    }

    void resolveFrame();
    return () => {
      cancelled = true;
    };
  }, [currentUrl, atStartPage, deferToExternalBrowser]);

  useEffect(() => {
    return () => {
      const sid = sessionRef.current;
      sessionRef.current = null;
      if (sid) {
        void fetch("/api/browser/session", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid }),
        });
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    navigate(url);
    setUrl("");
    document.activeElement?.blur();
  };

  const goBack = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCurrentUrl(history[newIndex]);
    setIsLoading(true);
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setCurrentUrl(history[newIndex]);
    setIsLoading(true);
  };

  const refresh = () => {
    if (atStartPage) return;
    setIsLoading(true);
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.location.reload();
      } catch {
        iframeRef.current.src = iframeRef.current.src;
      }
    }
  };

  const goHome = () => {
    if (atStartPage) {
      refresh();
      return;
    }
    setShowStart(true);
    setCurrentUrl(HOME_URL);
    setFrameSrc(null);
    setIsLoading(false);
    setHistoryIndex((i) => {
      setHistory((prev) => [...prev.slice(0, i + 1), HOME_URL]);
      return i + 1;
    });
  };

  const openExternal = () => {
    openExternalUrl(getDisplayUrl());
  };

  const getDisplayUrl = () => currentUrl.replace("?igu=1", "").replace("&igu=1", "");

  const downloadImageToOS = (imageUrl) => {
    if (!imageUrl.trim()) return;
    let filename = imageUrl.split("/").pop().split("?")[0];
    if (!filename.includes(".")) filename = `image_${Date.now()}.jpg`;

    const newFile = {
      id: Date.now().toString(),
      name: filename,
      url: imageUrl,
      type: "image",
      date: new Date().toISOString(),
      size: null,
      source: "Safari",
    };

    const existingDownloads = JSON.parse(localStorage.getItem("os_downloads") || "[]");
    localStorage.setItem(
      "os_downloads",
      JSON.stringify([newFile, ...existingDownloads.filter((f) => f.id !== newFile.id)]),
    );
    window.dispatchEvent(new CustomEvent("os_file_download", { detail: newFile }));

    setDownloadStatus({ success: true, filename });
    window.setTimeout(() => {
      setDownloadStatus(null);
      setShowDownloadModal(false);
      setDownloadUrl("");
    }, 2000);
  };

  const isImageUrl = (u) => [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].some((ext) => u.toLowerCase().includes(ext));

  return (
    <div
      data-testid="browser-app"
      className={`flex h-full w-full flex-col overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#1c1c1e] text-white" : "bg-white text-gray-800"}`}
    >
      <div
        data-testid="browser-toolbar"
        className={`window-drag-handle flex items-center gap-2 px-3 py-2.5 sm:px-4 ${windowId == null ? "pt-[max(0.35rem,env(safe-area-inset-top))]" : ""} ${
          isDarkMode ? "bg-[#2c2c2e] text-white" : "bg-[#f3f3f3] text-gray-800"
        }`}
      >
        {windowId != null && <TrafficLights windowId={windowId} />}

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={goBack}
            disabled={historyIndex <= 0}
            className={`rounded p-1.5 transition-colors ${
              historyIndex > 0
                ? isDarkMode
                  ? "text-white hover:bg-white/10"
                  : "text-gray-800 hover:bg-black/5"
                : isDarkMode
                  ? "cursor-not-allowed text-gray-600"
                  : "cursor-not-allowed text-gray-300"
            }`}
          >
            <FiArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className={`rounded p-1.5 transition-colors ${
              historyIndex < history.length - 1
                ? isDarkMode
                  ? "text-white hover:bg-white/10"
                  : "text-gray-800 hover:bg-black/5"
                : isDarkMode
                  ? "cursor-not-allowed text-gray-600"
                  : "cursor-not-allowed text-gray-300"
            }`}
          >
            <FiArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={refresh}
            className={`rounded p-1.5 transition ${isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-black/5"} ${isLoading ? "animate-spin" : ""}`}
          >
            <FiRefreshCw size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mx-2 min-w-0 flex-1 sm:mx-4">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all duration-300 ${
              isDarkMode
                ? "border-[#3d3d3f] bg-[#1c1c1e] focus-within:border-[#007AFF]"
                : "border-[#d0d0d0] bg-white focus-within:border-[#007AFF]"
            }`}
          >
            <FiLock size={12} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
            <input
              type="text"
              value={
                isFocused
                  ? url
                  : getDisplayUrl() === "https://www.google.com/webhp"
                    ? ""
                    : getDisplayUrl()
              }
              onFocus={() => {
                setIsFocused(true);
                setUrl(getDisplayUrl() === "https://www.google.com/webhp" ? "" : getDisplayUrl());
              }}
              onBlur={() => {
                setIsFocused(false);
                setUrl("");
              }}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Search Google or type a URL"
              className={`w-full bg-transparent text-sm outline-none placeholder-gray-500 ${isDarkMode ? "text-white" : "text-gray-800"}`}
            />
          </div>
        </form>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={goHome}
            className={`rounded p-1.5 transition-colors ${isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-black/5"}`}
            title="Home"
          >
            <FiHome size={16} />
          </button>
          <button
            type="button"
            onClick={() => (isImageUrl(currentUrl) ? downloadImageToOS(currentUrl) : setShowDownloadModal(true))}
            className={`rounded p-1.5 transition-colors ${isDarkMode ? "text-green-400 hover:bg-white/10" : "text-green-600 hover:bg-black/5"}`}
            title="Download Image to OS"
          >
            <FiDownload size={16} />
          </button>
          <button
            type="button"
            onClick={openExternal}
            className={`rounded p-1.5 transition-colors ${isDarkMode ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-black/5"}`}
            title="Open in new tab"
          >
            <FiExternalLink size={16} />
          </button>
        </div>
      </div>

      <div className={`relative min-h-0 flex-1 ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}>
        {isLoading && !atStartPage && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}>
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#007AFF] border-t-transparent" />
              <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Loading…</span>
            </div>
          </div>
        )}
        {embedNote && (
          <div className="absolute inset-x-0 top-0 z-20 bg-amber-500/90 px-3 py-1 text-center text-[11px] text-white">
            {embedNote}
          </div>
        )}
        {atStartPage ? (
          <StartPage isDarkMode={isDarkMode} onNavigate={navigate} />
        ) : (
          frameSrc && (
            <iframe
              ref={iframeRef}
              key={frameSrc}
              src={frameSrc}
              onLoad={() => setIsLoading(false)}
              className={`h-full w-full border-none hide-scrollbar ${isDragging || isResizing ? "pointer-events-none" : ""}`}
              referrerPolicy="no-referrer"
              title="Safari Browser"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
            />
          )
        )}
      </div>

      {showDownloadModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-[400px] overflow-hidden rounded-xl border shadow-2xl ${isDarkMode ? "border-[#3d3d3f] bg-[#2c2c2e]" : "border-black/10 bg-white"}`}>
            <div className={`flex items-center justify-between border-b px-4 py-3 ${isDarkMode ? "border-[#3d3d3f]" : "border-black/5"}`}>
              <div className="flex items-center gap-2">
                <FiImage className="text-green-500" size={18} />
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>Download Image to OS</span>
              </div>
              <button type="button" onClick={() => { setShowDownloadModal(false); setDownloadUrl(""); setDownloadStatus(null); }} className={`rounded p-1 ${isDarkMode ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-black/5"}`}>
                <FiX size={18} />
              </button>
            </div>
            <div className="p-4">
              {downloadStatus ? (
                <div className="flex flex-col items-center py-4">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>Downloaded successfully</p>
                  <p className="mt-1 text-xs text-gray-400">{downloadStatus.filename}</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    downloadImageToOS(downloadUrl);
                  }}
                >
                  <input
                    type="url"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={`mb-4 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#007AFF] ${isDarkMode ? "border-[#3d3d3f] bg-[#1c1c1e] text-white" : "border-black/10 bg-[#f6f6f6] text-gray-800"}`}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDownloadModal(false)} className={`flex-1 rounded-lg py-2 text-sm ${isDarkMode ? "bg-[#3a3a3c] text-white" : "bg-[#e5e5ea] text-gray-800"}`}>
                      Cancel
                    </button>
                    <button type="submit" disabled={!downloadUrl.trim()} className="flex-1 rounded-lg bg-green-600 py-2 text-sm text-white disabled:opacity-50">
                      Download
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Safari;
