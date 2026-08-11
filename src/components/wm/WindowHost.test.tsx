import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";

import WindowHost from "@/components/wm/WindowHost";
import { APPS } from "@/lib/apps";

/**
 * WindowHost unit tests. Every registry app must resolve its lazy import and
 * render real content under Suspense; an unknown appId must throw a clear
 * Error (the QA failure scenario).
 */
describe("WindowHost", () => {
  it("resolves the lazy component and renders content for every app", async () => {
    for (const app of APPS) {
      const { unmount } = render(
        <Suspense fallback={null}>
          <WindowHost windowId="w-test" appId={app.id} />
        </Suspense>,
      );
      expect(
        await screen.findByTestId(`app-content-${app.id}`, undefined, {
          timeout: 3000,
        }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("throws a clear error for an unknown app id", () => {
    expect(() =>
      render(<WindowHost windowId="w-test" appId="not-an-app" />),
    ).toThrow(/Unknown app id "not-an-app"/);
  });
});
