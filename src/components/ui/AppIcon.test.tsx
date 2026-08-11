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
    expect(container.querySelector("path")).not.toBeNull();
  });

  it("renders all 20 appIds without throwing", () => {
    for (const appId of APP_IDS) {
      const { container } = render(<AppIcon appId={appId} />);
      expect(container.querySelector("svg")).not.toBeNull();
      expect(container.querySelector("path")).not.toBeNull();
    }
  });

  it("glyph variant uses currentColor theming", () => {
    const { container } = render(<AppIcon appId="terminal" variant="glyph" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("fill")).toBe("none");
  });

  it("tile variant uses squircle glass path", () => {
    const { container } = render(<AppIcon appId="browser" size={48} />);
    expect(container.querySelector("linearGradient")).not.toBeNull();
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("folder shape renders folder artwork", () => {
    const { container } = render(<AppIcon appId="files" size={48} shape="folder" />);
    expect(container.querySelector("path")).not.toBeNull();
  });
});
