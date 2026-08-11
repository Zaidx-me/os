import { describe, expect, it } from "vitest";

import { APP_IDS } from "@/components/ui/AppIcon";
import { APPS, appTitle, getAppMeta } from "@/lib/apps";

/**
 * Registry invariants (todo 10 + todo 15 acceptance): the app registry is the
 * shared source of app ids for desktop icons, the launcher, the taskbar, and
 * the window content provider. It must mirror APP_IDS exactly — a registry
 * entry whose id is not in APP_IDS (or a missing app) is a bug that breaks the
 * icon grid, the launcher, and WindowHost. Todo 15 adds the lazy component +
 * defaultSize contract so the window host can mount any app by id.
 */
describe("app registry", () => {
  it("registers exactly the 11 apps from APP_IDS, no more, no less", () => {
    expect(APPS.length).toBe(11);
    const registryIds = APPS.map((app) => app.id).sort();
    const iconIds = [...APP_IDS].sort();
    expect(registryIds).toEqual(iconIds);
  });

  it("has unique ids and non-empty titles + keywords for every app", () => {
    const ids = APPS.map((app) => app.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const app of APPS) {
      expect(app.title.trim().length).toBeGreaterThan(0);
      expect(app.keywords.length).toBeGreaterThan(0);
    }
  });

  it("provides a lazy component and a sane defaultSize for every app", () => {
    const LAZY = Symbol.for("react.lazy");
    for (const app of APPS) {
      // React 19's lazy() returns an object tagged with the react.lazy symbol.
      expect(app.component).toBeDefined();
      expect(app.component.$$typeof).toBe(LAZY);
      expect(app.defaultSize.w).toBeGreaterThanOrEqual(360);
      expect(app.defaultSize.h).toBeGreaterThanOrEqual(240);
    }
  });

  it("looks up metadata by id", () => {
    expect(getAppMeta("chess")?.title).toBe("Chess");
    expect(getAppMeta("nope")).toBeUndefined();
  });

  it("appTitle falls back to a humanized id for unknown ids", () => {
    expect(appTitle("about")).toBe("About");
    expect(appTitle("file-manager")).toBe("File Manager");
  });
});
