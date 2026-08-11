import { describe, expect, it } from "vitest";
import { parse } from "./parser";

describe("shell parser (todo 24 acceptance: quotes/escapes)", () => {
  it("parses a bare command", () => {
    expect(parse("ls")).toEqual({ command: "ls", args: [] });
  });

  it("splits arguments on whitespace", () => {
    expect(parse("cat -n README.md")).toEqual({
      command: "cat",
      args: ["-n", "README.md"],
    });
  });

  it("collapses repeated spaces and tabs", () => {
    expect(parse("echo   a\t b")).toEqual({ command: "echo", args: ["a", "b"] });
  });

  it("preserves single-quoted tokens verbatim", () => {
    expect(parse("echo 'hello world'")).toEqual({
      command: "echo",
      args: ["hello world"],
    });
  });

  it("keeps double quotes inside single quotes literal", () => {
    expect(parse(`echo '"quoted"'`)).toEqual({
      command: "echo",
      args: ['"quoted"'],
    });
  });

  it("keeps backslashes inside single quotes literal", () => {
    expect(parse("echo 'a\\b'")).toEqual({ command: "echo", args: ["a\\b"] });
  });

  it("handles backslash escapes outside quotes", () => {
    expect(parse("echo a\\ b\\!")).toEqual({
      command: "echo",
      args: ["a b!"],
    });
  });

  it("keeps escaped quotes inside double quotes literal", () => {
    expect(parse('echo "say \\"hi\\""')).toEqual({
      command: "echo",
      args: ['say "hi"'],
    });
  });

  it("keeps a literal backslash via \\\\ in double quotes", () => {
    expect(parse('echo "a\\\\b"')).toEqual({ command: "echo", args: ["a\\b"] });
  });

  it("keeps a literal dollar sign via \\$ in double quotes", () => {
    expect(parse('echo "cost \\$5"')).toEqual({
      command: "echo",
      args: ["cost $5"],
    });
  });

  it("concatenates adjacent quoted segments", () => {
    expect(parse('echo a""b')).toEqual({ command: "echo", args: ["ab"] });
    expect(parse(`echo 'a'"b"`)).toEqual({ command: "echo", args: ["ab"] });
  });

  it("keeps an empty quoted argument", () => {
    expect(parse('echo ""')).toEqual({ command: "echo", args: [""] });
  });

  it("is lenient with an unterminated quote", () => {
    expect(parse('echo "oops')).toEqual({ command: "echo", args: ["oops"] });
  });

  it("returns a null command for empty or whitespace-only input", () => {
    expect(parse("")).toEqual({ command: null, args: [] });
    expect(parse("   \t ")).toEqual({ command: null, args: [] });
  });
});
