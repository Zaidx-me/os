import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppIcon, APP_IDS } from "./AppIcon";

describe("AppIcon", () => {
  it("renders an svg with the accessible name for terminal", () => {
    render(<AppIcon appId="terminal" />);
    expect(screen.getByRole("img", { name: "Terminal" })).toBeInTheDocument();
  });

  it("renders a deterministic fallback for unknown ids without throwing", () => {
    const { container } = render(<AppIcon appId="unknown-id" />);
    expect(screen.getByRole("img", { name: "App" })).toBeInTheDocument();
    // fallback glyph is a generic app tile: a rect + center dot
    expect(container.querySelectorAll("rect").length).toBe(1);
    expect(container.querySelectorAll("circle").length).toBe(1);
  });

  it("renders all 11 appIds without throwing", () => {
    for (const appId of APP_IDS) {
      const { container } = render(<AppIcon appId={appId} />);
      expect(container.querySelector("svg")).not.toBeNull();
      expect(container.querySelectorAll("path, circle, rect").length).toBeGreaterThan(0);
    }
  });

  it("uses currentColor theming", () => {
    const { container } = render(<AppIcon appId="terminal" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("fill")).toBe("none");
  });
});
