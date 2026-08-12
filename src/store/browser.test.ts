import { describe, expect, it } from "vitest";

import {
  BROWSER_START,
  frameSrcForUrl,
  resolveBrowserUrl,
  useBrowserStore,
} from "./browser";

describe("browser store helpers", () => {
  it("resolveBrowserUrl handles start, search, and https URLs", () => {
    expect(resolveBrowserUrl("")).toBe(BROWSER_START);
    expect(resolveBrowserUrl("applicator.netlify.app")).toContain("applicator.netlify.app");
    expect(resolveBrowserUrl("hello world")).toContain("duckduckgo.com");
  });

  it("frameSrcForUrl returns direct URL for whitelisted sites only", () => {
    expect(frameSrcForUrl(BROWSER_START)).toBeNull();
    expect(frameSrcForUrl("https://github.com/zaidx-me")).toBe(
      "https://github.com/zaidx-me",
    );
    expect(frameSrcForUrl("https://applicator.netlify.app")).toBe(
      "https://applicator.netlify.app",
    );
  });
});

describe("browser store actions", () => {
  it("clearTabHistory keeps only the current URL", () => {
    useBrowserStore.getState().reset();
    const tabId = useBrowserStore.getState().activeTabId;
    useBrowserStore.getState().navigate("https://example.com/a");
    useBrowserStore.getState().navigate("https://example.com/b");
    useBrowserStore.getState().clearTabHistory(tabId);
    const tab = useBrowserStore.getState().tabs.find((t) => t.id === tabId)!;
    expect(tab.history).toEqual(["https://example.com/b"]);
    expect(tab.historyIndex).toBe(0);
  });

  it("closeAllTabs resets to a single new tab", () => {
    useBrowserStore.getState().reset();
    useBrowserStore.getState().addTab("https://example.com");
    useBrowserStore.getState().closeAllTabs();
    const { tabs, activeTabId } = useBrowserStore.getState();
    expect(tabs).toHaveLength(1);
    expect(tabs[0]!.id).toBe(activeTabId);
    expect(tabs[0]!.url).toBe(BROWSER_START);
  });

  it("removeHistoryEntry drops an entry and keeps navigation coherent", () => {
    useBrowserStore.getState().reset();
    const tabId = useBrowserStore.getState().activeTabId;
    useBrowserStore.getState().navigate("https://example.com/a");
    useBrowserStore.getState().navigate("https://example.com/b");
    useBrowserStore.getState().removeHistoryEntry(0, tabId);
    const tab = useBrowserStore.getState().tabs.find((t) => t.id === tabId)!;
    expect(tab.history).toEqual(["https://example.com/b"]);
    expect(tab.url).toBe("https://example.com/b");
  });

  it("goToHistoryIndex jumps without replaying intermediate steps", () => {
    useBrowserStore.getState().reset();
    const tabId = useBrowserStore.getState().activeTabId;
    useBrowserStore.getState().navigate("https://example.com/a");
    useBrowserStore.getState().navigate("https://example.com/b");
    useBrowserStore.getState().navigate("https://example.com/c");
    useBrowserStore.getState().goToHistoryIndex(0, tabId);
    const tab = useBrowserStore.getState().tabs.find((t) => t.id === tabId)!;
    expect(tab.url).toBe("https://example.com/a");
    expect(tab.historyIndex).toBe(0);
  });
});
