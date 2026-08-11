import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ContactApp from "@/components/apps/ContactApp";
import { site } from "@/content";

/**
 * Contact (contact) content tests (todo 22 acceptance): form renders with
 * fields + honeypot + submit; typed input reaches state; empty/invalid
 * submissions show field errors without a network call; QA happy: valid
 * submit POSTs (honeypot empty) and shows the green success message;
 * QA failures: 501 or network abort offer a mailto: fallback link, 429
 * shows the rate-limit message without mailto; copy-email copies.
 */
describe("ContactApp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function fillValidForm() {
    fireEvent.change(screen.getByTestId("contact-name"), {
      target: { value: "Zaid" },
    });
    fireEvent.change(screen.getByTestId("contact-email"), {
      target: { value: "zaid@example.com" },
    });
    fireEvent.change(screen.getByTestId("contact-subject"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByTestId("contact-message"), {
      target: { value: "Nice desktop." },
    });
  }

  it("renders all four fields, the honeypot, submit, socials, and copy button", () => {
    render(<ContactApp />);
    for (const field of ["name", "email", "subject", "message"]) {
      expect(screen.getByTestId(`contact-${field}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId("contact-website")).toBeInTheDocument();
    expect(screen.getByTestId("contact-submit")).toBeInTheDocument();
    expect(screen.getByTestId("contact-socials")).toBeInTheDocument();
    expect(screen.getByTestId("contact-copy-email")).toBeInTheDocument();
  });

  it("typed input reaches state", () => {
    render(<ContactApp />);
    fireEvent.change(screen.getByTestId("contact-name"), {
      target: { value: "Zaid" },
    });
    expect(screen.getByTestId("contact-name")).toHaveValue("Zaid");
  });

  it("empty submit shows field errors and never calls fetch", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<ContactApp />);
    fireEvent.click(screen.getByTestId("contact-submit"));
    for (const field of ["name", "email", "subject", "message"]) {
      expect(screen.getByTestId(`contact-error-${field}`)).toBeInTheDocument();
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("invalid email shows a field error", () => {
    render(<ContactApp />);
    fireEvent.change(screen.getByTestId("contact-email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByTestId("contact-submit"));
    expect(screen.getByTestId("contact-error-email")).toHaveTextContent(
      "valid email",
    );
  });

  it("QA happy: valid submit POSTs with the empty honeypot and shows success", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchSpy);
    render(<ContactApp />);
    fillValidForm();
    await act(async () => {
      fireEvent.click(screen.getByTestId("contact-submit"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("contact-success")).toBeInTheDocument(),
    );
    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      name: "Zaid",
      email: "zaid@example.com",
      subject: "Hello",
      message: "Nice desktop.",
      website: "",
    });
  });

  it("QA failure: 501 shows the error and a mailto fallback with composed subject/body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "mailto" }), { status: 501 }),
      ),
    );
    render(<ContactApp />);
    fillValidForm();
    await act(async () => {
      fireEvent.click(screen.getByTestId("contact-submit"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("contact-error")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("contact-mailto")).toHaveAttribute(
      "href",
      expect.stringMatching(
        /^mailto:owner@zaidx\.me\?subject=Portfolio%20contact%20from%20Zaid&body=Nice%20desktop\.[\s\S]*zaid%40example\.com/,
      ),
    );
  });

  it("QA failure: 500 shows the error hint without a mailto link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "boom" }), { status: 500 }),
      ),
    );
    render(<ContactApp />);
    fillValidForm();
    await act(async () => {
      fireEvent.click(screen.getByTestId("contact-submit"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("contact-error")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("contact-error")).toHaveTextContent(
      "couldn't send",
    );
    expect(screen.queryByTestId("contact-mailto")).not.toBeInTheDocument();
  });

  it("QA failure: 429 shows the rate-limit message without a mailto link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "too fast" }), { status: 429 }),
      ),
    );
    render(<ContactApp />);
    fillValidForm();
    await act(async () => {
      fireEvent.click(screen.getByTestId("contact-submit"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("contact-error")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("contact-error")).toHaveTextContent(
      "sending too fast",
    );
    expect(screen.queryByTestId("contact-mailto")).not.toBeInTheDocument();
  });

  it("QA failure: network abort shows the error and a mailto fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    render(<ContactApp />);
    fillValidForm();
    await act(async () => {
      fireEvent.click(screen.getByTestId("contact-submit"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("contact-error")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("contact-error")).toHaveTextContent(
      "Network hiccup",
    );
    expect(screen.getByTestId("contact-mailto")).toBeInTheDocument();
  });

  it("copy-email button copies site.contactEmail and shows Copied", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(<ContactApp />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("contact-copy-email"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("contact-copy-email")).toHaveTextContent(
        "Copied",
      ),
    );
    expect(writeText).toHaveBeenCalledWith(site.contactEmail);
  });
});
