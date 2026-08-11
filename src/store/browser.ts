import { create } from "zustand";

import { isWhitelistedUrl, resolveEmbedUrl } from "@/lib/browser/embed-whitelist";

export const BROWSER_START = "zaidos://start";

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
  loading: boolean;
}

export interface BrowserState {
  tabs: BrowserTab[];
  activeTabId: string;
  addTab: (url?: string) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  navigate: (url: string, tabId?: string) => void;
  goBack: (tabId?: string) => void;
  goForward: (tabId?: string) => void;
  setTabTitle: (title: string, tabId?: string) => void;
  setTabLoading: (loading: boolean, tabId?: string) => void;
  reset: () => void;
}

let tabCounter = 0;
function nextTabId(): string {
  tabCounter += 1;
  return `tab-${tabCounter}`;
}

function isStartPage(url: string): boolean {
  return url === BROWSER_START;
}

function hostnameOf(url: string): string {
  if (isStartPage(url)) return "New Tab";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function createTab(url: string = BROWSER_START): BrowserTab {
  return {
    id: nextTabId(),
    url,
    title: isStartPage(url) ? "New Tab" : hostnameOf(url),
    history: [url],
    historyIndex: 0,
    loading: false,
  };
}

function pushHistory(tab: BrowserTab, url: string): BrowserTab {
  const trimmed = tab.history.slice(0, tab.historyIndex + 1);
  if (trimmed[trimmed.length - 1] === url) return { ...tab, url, loading: true };
  const history = [...trimmed, url];
  return { ...tab, url, history, historyIndex: history.length - 1, loading: true };
}

function patchTab(
  tabs: BrowserTab[],
  tabId: string,
  patch: Partial<BrowserTab> | ((tab: BrowserTab) => BrowserTab),
): BrowserTab[] {
  return tabs.map((t) => {
    if (t.id !== tabId) return t;
    return typeof patch === "function" ? patch(t) : { ...t, ...patch };
  });
}

const initialTab = createTab();

export const useBrowserStore = create<BrowserState>((set, get) => ({
  tabs: [initialTab],
  activeTabId: initialTab.id,

  addTab(url) {
    const tab = createTab(url ?? BROWSER_START);
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id,
    }));
    return tab.id;
  },

  closeTab(id) {
    set((s) => {
      if (s.tabs.length <= 1) {
        const fresh = createTab();
        return { tabs: [fresh], activeTabId: fresh.id };
      }
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeTabId =
        s.activeTabId === id ? tabs[tabs.length - 1]!.id : s.activeTabId;
      return { tabs, activeTabId };
    });
  },

  setActiveTab(id) {
    set({ activeTabId: id });
  },

  navigate(url, tabId) {
    const id = tabId ?? get().activeTabId;
    set((s) => ({
      tabs: patchTab(s.tabs, id, (tab) => ({
        ...pushHistory(tab, url),
        title: isStartPage(url) ? "New Tab" : hostnameOf(url),
      })),
    }));
  },

  goBack(tabId) {
    const id = tabId ?? get().activeTabId;
    set((s) => ({
      tabs: patchTab(s.tabs, id, (tab) => {
        if (tab.historyIndex <= 0) return tab;
        const historyIndex = tab.historyIndex - 1;
        const nextUrl = tab.history[historyIndex]!;
        return {
          ...tab,
          historyIndex,
          url: nextUrl,
          title: isStartPage(nextUrl) ? "New Tab" : hostnameOf(nextUrl),
          loading: true,
        };
      }),
    }));
  },

  goForward(tabId) {
    const id = tabId ?? get().activeTabId;
    set((s) => ({
      tabs: patchTab(s.tabs, id, (tab) => {
        if (tab.historyIndex >= tab.history.length - 1) return tab;
        const historyIndex = tab.historyIndex + 1;
        const nextUrl = tab.history[historyIndex]!;
        return {
          ...tab,
          historyIndex,
          url: nextUrl,
          title: isStartPage(nextUrl) ? "New Tab" : hostnameOf(nextUrl),
          loading: true,
        };
      }),
    }));
  },

  setTabTitle(title, tabId) {
    const id = tabId ?? get().activeTabId;
    set((s) => ({ tabs: patchTab(s.tabs, id, { title }) }));
  },

  setTabLoading(loading, tabId) {
    const id = tabId ?? get().activeTabId;
    set((s) => ({ tabs: patchTab(s.tabs, id, { loading }) }));
  },

  reset() {
    const tab = createTab();
    set({ tabs: [tab], activeTabId: tab.id });
  },
}));

/** Normalize relative paths and bare domains to absolute URLs. */
export function resolveBrowserUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "" || trimmed === BROWSER_START) return BROWSER_START;
  if (trimmed.startsWith("zaidos://")) return trimmed;
  if (trimmed.startsWith("/")) {
    if (typeof window === "undefined") return trimmed;
    return new URL(trimmed, window.location.origin).href;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes(".") && !trimmed.includes(" ")) return `https://${trimmed}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

/** Frame URL for whitelisted / pre-checked embeds (direct iframe, not proxy). */
export function frameSrcForUrl(url: string): string | null {
  if (url === BROWSER_START) return null;
  if (url.startsWith("zaidos://")) return null;
  if (isWhitelistedUrl(url)) return resolveEmbedUrl(url);
  return url;
}
