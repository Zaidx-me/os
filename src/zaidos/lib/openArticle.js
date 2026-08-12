import { createElement } from "react";
import ArticlesApp from "../apps/Articles.jsx";
import { useAppStore } from "../../store/Appstore.js";

export const PENDING_ARTICLE_SLUG_KEY = "zaidos_pending_article_slug";

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 1023px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

/** `/articles/building-whatsapp-gateway` → `building-whatsapp-gateway` */
export function articleSlugFromPath(path) {
  if (!path?.trim()) return null;
  const trimmed = path.trim();
  const match = trimmed.match(/\/articles\/([^/?#]+)/);
  if (match?.[1]) return match[1];
  return trimmed.includes("/") ? null : trimmed;
}

/** Open the Articles app to a project article by slug or `/articles/...` path. */
export function openArticle(slugOrPath) {
  const slug = articleSlugFromPath(slugOrPath);
  if (!slug || typeof window === "undefined") return;

  sessionStorage.setItem(PENDING_ARTICLE_SLUG_KEY, slug);
  window.dispatchEvent(new CustomEvent("zaidos:open-article", { detail: { slug } }));

  if (isMobileViewport()) {
    window.dispatchEvent(new CustomEvent("zaidos:open-app", { detail: { appId: "Articles" } }));
    return;
  }

  const { windows, openApp, focusApp, restoreApp } = useAppStore.getState();
  const existing = windows.find((w) => w.appId === "Articles");

  if (existing) {
    if (existing.minimized) restoreApp(existing.id);
    focusApp(existing.id);
  } else {
    openApp("Articles", createElement(ArticlesApp));
  }
}

export function consumePendingArticleSlug() {
  if (typeof window === "undefined") return null;
  const slug = sessionStorage.getItem(PENDING_ARTICLE_SLUG_KEY);
  sessionStorage.removeItem(PENDING_ARTICLE_SLUG_KEY);
  return slug;
}
