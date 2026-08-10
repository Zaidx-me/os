import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";

import Home from "@/app/page";
import { useBootStore } from "@/store/boot";

describe("landing page (ZaidOS desktop shell)", () => {
  beforeEach(() => {
    // Every test starts un-booted with clean persistence.
    localStorage.clear();
    useBootStore.setState({ booted: false });
  });

  it("renders nothing on the server (SSR/hydration gate)", () => {
    // The mount gate (`if (!mounted) return null`) means SSR emits no markup;
    // the whole shell renders client-side only, after the persisted stores
    // have rehydrated. This is what prevents hydration mismatches.
    const html = renderToString(<Home />);
    expect(html).toBe("");
  });

  it("mounts the full boot screen on a first visit", async () => {
    render(<Home />);
    expect(await screen.findByTestId("boot-screen")).toBeInTheDocument();
    expect(screen.getByText("Zaid")).toBeInTheDocument();
    expect(screen.getByText("OS")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop")).not.toBeInTheDocument();
  });

  it("renders the desktop shell once booted", async () => {
    useBootStore.setState({ booted: true });
    render(<Home />);
    expect(await screen.findByTestId("desktop")).toBeInTheDocument();
    expect(screen.queryByTestId("boot-screen")).not.toBeInTheDocument();
  });
});
