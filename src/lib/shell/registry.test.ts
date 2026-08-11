import { beforeEach, describe, expect, it } from "vitest";
import { clearCommands, findCommand, listCommands, register } from "./registry";
import type { ShellCommand } from "./registry";

describe("command registry", () => {
  beforeEach(() => {
    clearCommands();
  });

  function stub(name: string, aliases?: readonly string[]): ShellCommand {
    return {
      name,
      aliases,
      help: `help for ${name}`,
      handler: () => [],
    };
  }

  it("registers and finds a command by name", () => {
    register(stub("ls"));
    expect(findCommand("ls")?.name).toBe("ls");
  });

  it("finds a command by alias", () => {
    register(stub("clear", ["cls"]));
    expect(findCommand("cls")?.name).toBe("clear");
  });

  it("returns undefined for unknown names", () => {
    register(stub("ls"));
    expect(findCommand("nope")).toBeUndefined();
  });

  it("lists all registered commands in registration order", () => {
    register(stub("a"));
    register(stub("b"));
    register(stub("c"));
    expect(listCommands().map((c) => c.name)).toEqual(["a", "b", "c"]);
  });

  it("replaces a command with the same name", () => {
    register(stub("ls"));
    register({ ...stub("ls"), help: "new help" });
    expect(findCommand("ls")?.help).toBe("new help");
    expect(listCommands().length).toBe(1);
  });
});
