import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// next/image renders an <img> at runtime, but the real client component leans on
// browser-only APIs (IntersectionObserver, devicePixelRatio, requestIdleCallback)
// that jsdom does not implement. Swap it for a plain <img> so the smoke test can
// assert the page's real, visible content without pulling in image optimization.
vi.mock("next/image", () => ({
  /* eslint-disable jsx-a11y/alt-text, @next/next/no-img-element, @typescript-eslint/no-unused-vars -- plain <img> test double for jsdom; the next/image-only props are intentionally discarded */
  default: ({
    priority: _priority,
    fill: _fill,
    sizes: _sizes,
    ...imgProps
  }: Record<string, unknown>) => <img {...imgProps} />,
  /* eslint-enable jsx-a11y/alt-text, @next/next/no-img-element, @typescript-eslint/no-unused-vars */
}));

import Home from "@/app/page";

describe("landing page smoke test", () => {
  it("renders the create-next-app default page content", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("To get started, edit the");
    expect(heading.querySelector("code")).toHaveTextContent("page.tsx");

    expect(
      screen.getByText(/Looking for a starting point or more instructions\?/),
    ).toBeInTheDocument();

    // regex = substring, since the Vercel logo image's alt text contributes to
    // the "Deploy Now" link's accessible name
    expect(screen.getByRole("link", { name: /Templates/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Learning/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Deploy Now/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Documentation/ })).toBeInTheDocument();

    expect(screen.getByAltText("Next.js logo")).toBeInTheDocument();
    expect(screen.getByAltText("Vercel logomark")).toBeInTheDocument();
  });
});
