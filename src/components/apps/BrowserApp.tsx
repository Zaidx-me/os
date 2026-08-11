"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  Home,
  Loader2,
  Plus,
  RotateCw,
  Search,
  X,
} from "lucide-react";

import type { WindowAppProps } from "@/lib/apps";
import {
  EMBED_BOOKMARKS,
  faviconUrl,
  isWhitelistedUrl,
} from "@/lib/browser/embed-whitelist";
import { projects } from "@/content";
import { useBrowserEmbed } from "@/hooks/useBrowserEmbed";
import {
  BROWSER_START,
  resolveBrowserUrl,
  useBrowserStore,
} from "@/store/browser";

const LIVE_BOOKMARKS = projects
  .filter((p) => p.links.live)
  .map((p) => ({
    id: p.id,
    title: p.title,
    url: p.links.live!,
    tagline: p.tagline,
  }));

function domainLabel(url: string): string {
  if (url === BROWSER_START) return "New Tab";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function EmbedFallback({ url }: { url: string }) {
  const host = domainLabel(url);
  return (
    <div data-testid="browser-fallback" className="browser-fallback-card">
      <img
        src={faviconUrl(url)}
        alt=""
        width={64}
        height={64}
        className="rounded-2xl shadow-md"
      />
      <p className="font-sans text-lg font-semibold text-zaid-text">{host}</p>
      <p className="max-w-sm text-sm text-zaid-muted">
        This site can&apos;t be previewed here.
      </p>
      <button
        type="button"
        data-testid="browser-open-external"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-zaid-accent px-4 py-2 text-sm font-semibold text-white"
      >
        <ExternalLink size={16} />
        Open in new tab
      </button>
    </div>
  );
}

function StartPage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <div
      data-testid="browser-start-page"
      className="flex h-full flex-col gap-6 overflow-y-auto bg-zaid-bg p-4 sm:p-8"
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 pt-4">
        <div className="flex items-center justify-center gap-2 text-zaid-accent">
          <Globe size={28} aria-hidden="true" />
          <span className="font-mono text-xl font-light tracking-tight text-zaid-text">
            ZaidOS Browser
          </span>
        </div>

        <form
          className="browser-url-pill shadow-lg"
          onSubmit={(e) => {
            e.preventDefault();
            onNavigate(query || BROWSER_START);
          }}
        >
          <Search size={18} className="shrink-0 text-zaid-muted" />
          <input
            data-testid="browser-start-search"
            type="text"
            placeholder="Search or enter URL"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-mono text-sm text-zaid-text outline-none"
          />
        </form>
      </div>

      <section className="mx-auto w-full max-w-3xl">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zaid-muted">
          Trusted embeds
        </h2>
        <div className="mb-6 flex flex-wrap gap-2">
          {EMBED_BOOKMARKS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`browser-trusted-${item.id}`}
              onClick={() => onNavigate(item.url)}
              className="browser-bookmark-chip hover:border-zaid-accent"
            >
              <img src={faviconUrl(item.url, 32)} alt="" width={16} height={16} className="rounded" />
              {item.label}
            </button>
          ))}
        </div>

        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zaid-muted">
          Live projects
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LIVE_BOOKMARKS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`browser-bookmark-${item.id}`}
              onClick={() => onNavigate(item.url)}
              className="hairline group flex flex-col gap-1 rounded-xl bg-zaid-surface2 p-4 text-left transition-all hover:border-zaid-accent hover:bg-zaid-accent/5"
            >
              <span className="font-sans text-sm font-semibold text-zaid-text group-hover:text-zaid-accent">
                {item.title}
              </span>
              <span className="line-clamp-2 font-mono text-[11px] text-zaid-muted">
                {item.tagline}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function BrowserApp({ setTitle }: WindowAppProps) {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const addTab = useBrowserStore((s) => s.addTab);
  const closeTab = useBrowserStore((s) => s.closeTab);
  const setActiveTab = useBrowserStore((s) => s.setActiveTab);
  const navigate = useBrowserStore((s) => s.navigate);
  const goBack = useBrowserStore((s) => s.goBack);
  const goForward = useBrowserStore((s) => s.goForward);
  const setTabLoading = useBrowserStore((s) => s.setTabLoading);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]!;
  const url = activeTab.url;
  const isStart = url === BROWSER_START;

  const [draftAddress, setDraftAddress] = useState<string | null>(null);
  const [urlFocused, setUrlFocused] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const lastTitleRef = useRef<string | null>(null);

  const address = draftAddress ?? (isStart ? "" : url);
  const { phase, embedKind, frameSrc, onFrameLoad } = useBrowserEmbed(
    url,
    isStart,
    iframeKey,
  );

  const goTo = useCallback(
    (raw: string, tabId?: string) => {
      const next = resolveBrowserUrl(raw);
      navigate(next, tabId);
      setDraftAddress(null);
      setTabLoading(true, tabId);
    },
    [navigate, setTabLoading],
  );

  useEffect(() => {
    const onMobileBack = () => {
      if (activeTab.historyIndex > 0) goBack();
    };
    window.addEventListener("zaidos:mobile-back", onMobileBack);
    return () => window.removeEventListener("zaidos:mobile-back", onMobileBack);
  }, [activeTab.historyIndex, goBack]);

  useEffect(() => {
    const title = isStart ? "Browser" : activeTab.title;
    if (lastTitleRef.current === title) return;
    lastTitleRef.current = title;
    setTitle?.(title);
  }, [isStart, activeTab.title, setTitle]);

  useEffect(() => {
    if (phase === "embedded") setTabLoading(false, activeTabId);
  }, [phase, activeTabId, setTabLoading]);

  return (
    <div
      data-testid="app-content-browser"
      className="flex h-full w-full flex-col bg-zaid-surface"
    >
      <div
        data-testid="browser-tabs"
        className="flex shrink-0 items-end gap-0.5 overflow-x-auto border-b border-zaid-border bg-zaid-bg px-1 pt-1"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`group flex max-w-[180px] shrink-0 items-center gap-1 rounded-t-md border border-b-0 px-2 py-1.5 font-mono text-[10px] ${
                active
                  ? "border-zaid-border bg-zaid-surface2 text-zaid-text"
                  : "border-transparent bg-zaid-surface text-zaid-muted hover:bg-zaid-surface2"
              }`}
            >
              <button
                type="button"
                data-testid={`browser-tab-${tab.id}`}
                className="flex min-w-0 flex-1 items-center gap-1 truncate"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.loading && active ? (
                  <Loader2 size={12} className="shrink-0 animate-spin text-zaid-accent" />
                ) : (
                  <Globe size={12} className="shrink-0" />
                )}
                <span className="truncate">{tab.title}</span>
              </button>
              {tabs.length > 1 && (
                <button
                  type="button"
                  aria-label={`Close ${tab.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="rounded p-0.5 opacity-0 hover:bg-zaid-bg group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          data-testid="browser-new-tab"
          aria-label="New tab"
          onClick={() => addTab()}
          className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zaid-muted hover:bg-zaid-surface2"
        >
          <Plus size={14} />
        </button>
      </div>

      <div
        data-testid="browser-toolbar"
        className="flex shrink-0 flex-col gap-2 border-b border-zaid-border bg-zaid-surface2 p-2 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="browser-back"
            aria-label="Back"
            disabled={activeTab.historyIndex <= 0}
            onClick={() => goBack()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zaid-muted hover:bg-zaid-bg disabled:opacity-30"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            data-testid="browser-forward"
            aria-label="Forward"
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            onClick={() => goForward()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zaid-muted hover:bg-zaid-bg disabled:opacity-30"
          >
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            data-testid="browser-refresh"
            aria-label="Refresh"
            onClick={() => {
              setTabLoading(true);
              setIframeKey((k) => k + 1);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zaid-muted hover:bg-zaid-bg"
          >
            <RotateCw size={16} />
          </button>
          <button
            type="button"
            data-testid="browser-home"
            aria-label="Start page"
            onClick={() => goTo(BROWSER_START)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zaid-muted hover:bg-zaid-bg"
          >
            <Home size={16} />
          </button>
          <button
            type="button"
            data-testid="browser-toggle-bookmarks"
            aria-label="Toggle bookmarks bar"
            aria-pressed={bookmarksOpen}
            onClick={() => setBookmarksOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zaid-muted hover:bg-zaid-bg"
          >
            <Plus size={16} />
          </button>
        </div>

        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            goTo(address || BROWSER_START);
          }}
        >
          <div className="browser-url-pill min-w-0 flex-1">
            {!urlFocused && !isStart && address ? (
              <img
                src={faviconUrl(url, 32)}
                alt=""
                width={16}
                height={16}
                className="shrink-0 rounded"
              />
            ) : (
              <Globe size={16} className="shrink-0 text-zaid-muted" />
            )}
            <input
              data-testid="browser-url-input"
              type="text"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Search or enter URL"
              value={address}
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
              onChange={(e) => setDraftAddress(e.target.value)}
              className="min-w-0 flex-1 bg-transparent font-mono text-xs text-zaid-text outline-none"
            />
          </div>
          <button
            type="submit"
            data-testid="browser-go"
            className="shrink-0 rounded-full bg-zaid-accent px-3 py-1.5 font-mono text-xs font-semibold text-white"
          >
            Go
          </button>
        </form>
      </div>

      {bookmarksOpen && (
        <div data-testid="browser-bookmarks-bar" className="browser-bookmarks-bar">
          {EMBED_BOOKMARKS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`browser-bar-${item.id}`}
              onClick={() => goTo(item.url)}
              className="browser-bookmark-chip hover:border-zaid-accent"
            >
              <img src={faviconUrl(item.url, 32)} alt="" width={16} height={16} className="rounded" />
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {isStart ? (
          <StartPage onNavigate={goTo} />
        ) : phase === "checking" || (activeTab.loading && phase !== "blocked") ? (
          <div
            data-testid="browser-loading"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zaid-surface/90"
          >
            <Loader2 size={32} className="animate-spin text-zaid-accent" />
            <p className="font-mono text-xs text-zaid-muted">
              {isWhitelistedUrl(url)
                ? "Loading preview…"
                : "Starting cloud browser…"}
            </p>
          </div>
        ) : null}

        {!isStart && phase === "embedded" && frameSrc ? (
          <iframe
            key={`${activeTabId}-${iframeKey}-${url}-${embedKind}`}
            data-testid={embedKind === "notte" ? "browser-notte-frame" : "browser-frame"}
            title={activeTab.title}
            src={frameSrc}
            className="h-full w-full border-0 bg-white"
            allow={
              embedKind === "notte"
                ? "clipboard-read; clipboard-write"
                : "accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; picture-in-picture"
            }
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => {
              onFrameLoad();
              setTabLoading(false, activeTabId);
            }}
          />
        ) : null}

        {!isStart && phase === "blocked" ? <EmbedFallback url={url} /> : null}
      </div>
    </div>
  );
}

export default BrowserApp;
