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
import { projects } from "../zaidos/content/index.ts";
import { PENDING_KEY } from "../zaidos/lib/openBrowser.js";

const HOME_URL = "https://www.google.com/webhp?igu=1";

const WHITELIST = [
  "https://www.google.com",
  "https://developer.mozilla.org",
  "https://github.com",
  "https://zaidx.me",
  "https://applicator.netlify.app",
  "https://whatbot.zaidx.me",
  "https://pustacks.netlify.app",
  "https://kenspk.netlify.app",
];

const LIVE_BOOKMARKS = projects.filter((p) => p.links.live);

function isWhitelisted(url) {
  try {
    const u = new URL(url);
    return WHITELIST.some((w) => u.origin === new URL(w).origin);
  } catch {
    return false;
  }
}

function isGoogleUrl(url) {
  try {
    return new URL(url).hostname.includes("google.com");
  } catch {
    return false;
  }
}

function proxySrc(url) {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
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
      className={`flex h-full flex-col gap-6 overflow-y-auto p-4 sm:p-8 ${isDarkMode ? "bg-[#1c1c1e]" : "bg-[#f5f5f7]"}`}
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 pt-4">
        <p className={`text-center text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Safari
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onNavigate(query || HOME_URL);
          }}
          className={`flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-sm ${
            isDarkMode ? "border-[#3d3d3f] bg-[#2c2c2e]" : "border-[#d0d0d0] bg-white"
          }`}
        >
          <FiLock size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
          <input
            data-testid="browser-start-search"
            type="text"
            placeholder="Search Google or type a URL"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${isDarkMode ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-500"}`}
          />
        </form>
      </div>

      <section className="mx-auto w-full max-w-3xl">
        <h2 className={`mb-3 text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          Live projects
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LIVE_BOOKMARKS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`browser-bookmark-${item.id}`}
              onClick={() => onNavigate(item.links.live)}
              className={`rounded-xl border p-4 text-left transition active:scale-[0.98] ${
                isDarkMode
                  ? "border-[#3d3d3f] bg-[#2c2c2e] hover:border-[#007AFF]"
                  : "border-black/5 bg-white hover:border-[#007AFF]"
              }`}
            >
              <span className={`block text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {item.title}
              </span>
              <span className={`mt-1 line-clamp-2 text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {item.tagline}
              </span>
            </button>
          ))}
        </div>
      </section>
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
  const iframeRef = useRef(null);
  const sessionRef = useRef(null);

  const atStartPage = showStartPage && currentUrl === HOME_URL && !frameSrc;

  const navigate = useCallback((inputUrl) => {
    const processedUrl = processUrl(inputUrl);
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
    if (showStartPage && currentUrl === HOME_URL) {
      setFrameSrc(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function resolveFrame() {
      setIsLoading(true);
      setEmbedNote(null);

      if (isGoogleUrl(currentUrl) || isWhitelisted(currentUrl)) {
        if (!cancelled) {
          setFrameSrc(currentUrl);
          setIsLoading(false);
        }
        return;
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

      try {
        const embedRes = await fetch(`/api/can-embed?url=${encodeURIComponent(currentUrl)}`);
        const { embeddable } = await embedRes.json();
        if (!cancelled) {
          setFrameSrc(embeddable ? currentUrl : proxySrc(currentUrl));
          if (!embeddable) setEmbedNote("Using proxy fallback");
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFrameSrc(proxySrc(currentUrl));
          setEmbedNote("Using proxy fallback");
          setIsLoading(false);
        }
      }
    }

    void resolveFrame();
    return () => {
      cancelled = true;
    };
  }, [currentUrl, showStartPage]);

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
    if (currentUrl === HOME_URL) {
      refresh();
      return;
    }
    setCurrentUrl(HOME_URL);
    setFrameSrc(null);
    setIsLoading(false);
    setHistoryIndex((i) => {
      setHistory((prev) => [...prev.slice(0, i + 1), HOME_URL]);
      return i + 1;
    });
  };

  const openExternal = () => {
    window.open(currentUrl.replace("?igu=1", "").replace("&igu=1", ""), "_blank", "noopener,noreferrer");
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
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
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
