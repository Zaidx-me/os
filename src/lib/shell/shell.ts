/**
 * The simulated shell — `run(input, ctx)` turns a typed line into output
 * lines. Nothing here executes anything: every command is a pure handler
 * over the fake filesystem or the context, and unknown commands get the
 * zsh-style not-found line.
 *
 * Core commands (ls/cd/pwd/cat/help/clear/sudo) are registered per-shell so
 * they close over THIS shell's filesystem; content commands (todo 25)
 * register globally through the same registry.
 */
import {
  formatHelpGrid,
  registerContentCommands,
  sudoHandler,
  SUDOERS_JOKE,
} from "./commands";
import { FakeFs } from "./fakefs";
import { getSharedFs } from "@/store/filesystem";
import { parse } from "./parser";
import {
  findCommand,
  listCommands,
  register,
  type ShellContext,
} from "./registry";

export { SUDOERS_JOKE };

export interface ShellInstance {
  /** Run one input line, returning the output lines to render. */
  run: (input: string, ctx: ShellContext) => readonly string[];
  /** Every non-empty input, in order (drives ArrowUp/ArrowDown). */
  history: readonly string[];
  /** The filesystem this shell owns (cd state persists across commands). */
  fs: FakeFs;
  /** Tab-completion candidates for the current input. */
  complete: (input: string) => readonly string[];
}

/** Path completion shared by ls/cd/cat: entries of the token's directory. */
function completePath(fs: FakeFs, args: readonly string[]): string[] {
  const token = args[args.length - 1] ?? "";
  const slashIdx = token.lastIndexOf("/");
  const dirPart = slashIdx >= 0 ? token.slice(0, slashIdx + 1) : "";
  const prefix = slashIdx >= 0 ? token.slice(slashIdx + 1) : token;
  const base = dirPart === "" ? fs.pwd() : fs.resolve(dirPart);
  const entries = fs.ls(base);
  if (!entries) return [];
  return entries
    .filter((entry) => entry.name.startsWith(prefix))
    .map((entry) => dirPart + entry.name + (entry.type === "dir" ? "/" : ""));
}

function registerCoreCommands(fs: FakeFs, history: string[]): void {
  const core = [
    {
      name: "help",
      help: "list available commands",
      handler: () =>
        formatHelpGrid(
          listCommands().map((c) => ({ name: c.name, help: c.help })),
        ),
    },
    {
      name: "history",
      help: "print command history",
      handler: () =>
        history.map((line, i) => `${String(i + 1).padStart(5)}  ${line}`),
    },
    {
      name: "clear",
      help: "clear the terminal screen",
      handler: () => ["\x1b[2J"],
    },
    {
      name: "ls",
      help: "list directory contents",
      handler: (args: readonly string[]) => {
        const target = args[0] ?? "";
        const entries = fs.ls(target);
        if (entries === null) {
          return [`ls: cannot access '${args[0] ?? "."}': No such file or directory`];
        }
        return entries.map((e) => (e.type === "dir" ? `${e.name}/` : e.name));
      },
      complete: (args: readonly string[]) => completePath(fs, args),
    },
    {
      name: "tree",
      help: "list directories as a tree",
      handler: (args: readonly string[]) => {
        const out = fs.tree(args[0] ?? "", 3);
        if (out === null) return [`tree: ${args[0] ?? fs.promptPath()}: No such file or directory`];
        return out;
      },
    },
    {
      name: "cd",
      help: "change directory",
      handler: (args: readonly string[]) => {
        const error = fs.cd(args[0] ?? "~");
        return error === null ? [] : [error];
      },
      complete: (args: readonly string[]) => completePath(fs, args),
    },
    {
      name: "pwd",
      help: "print the current directory",
      handler: () => [fs.pwd()],
    },
    {
      name: "cat",
      help: "print file contents",
      handler: (args: readonly string[]) => {
        const target = args[0];
        if (target === undefined) return ["cat: missing file operand"];
        const res = fs.cat(target);
        if (!res.ok) {
          return res.reason === "missing"
            ? [`cat: ${target}: No such file or directory`]
            : [`cat: ${target}: Is a directory`];
        }
        return res.lines;
      },
      complete: (args: readonly string[]) => completePath(fs, args),
    },
    {
      name: "mkdir",
      help: "create a directory",
      handler: (args: readonly string[]) => {
        const name = args[0];
        if (name === undefined) return ["mkdir: missing operand"];
        const err = fs.mkdir(name);
        return err === null ? [] : [err];
      },
      complete: (args: readonly string[]) => completePath(fs, args),
    },
    {
      name: "touch",
      help: "create an empty file or update timestamp",
      handler: (args: readonly string[]) => {
        const name = args[0];
        if (name === undefined) return ["touch: missing file operand"];
        const err = fs.touch(name);
        return err === null ? [] : [err];
      },
      complete: (args: readonly string[]) => completePath(fs, args),
    },
    {
      name: "rm",
      help: "remove a file or empty directory",
      handler: (args: readonly string[]) => {
        const name = args[0];
        if (name === undefined) return ["rm: missing operand"];
        const err = fs.rm(name);
        return err === null ? [] : [err];
      },
      complete: (args: readonly string[]) => completePath(fs, args),
    },
    {
      name: "sudo",
      help: "run with elevated privileges (not really)",
      handler: (args: readonly string[]) => sudoHandler(args),
    },
  ] as const;

  for (const cmd of core) {
    register({
      name: cmd.name,
      help: cmd.help,
      handler: cmd.handler,
      ...("complete" in cmd ? { complete: cmd.complete } : {}),
    });
  }
}

export function createShell(fs: FakeFs = getSharedFs()): ShellInstance {
  registerContentCommands();
  const history: string[] = [];
  registerCoreCommands(fs, history);

  function runLine(line: string, ctx: ShellContext): readonly string[] {
    const parsed = parse(line);
    if (parsed.command === null) return [];
    history.push(line);
    const cmd = findCommand(parsed.command);
    if (!cmd) {
      return [
        `zsh: command not found: ${parsed.command}`,
        "Type 'help' to see what I can do",
      ];
    }
    return cmd.handler(parsed.args, ctx) ?? [];
  }

  return {
    fs,
    history,
    run(input, ctx) {
      const segments = input.split("&&").map((s) => s.trim()).filter(Boolean);
      if (segments.length === 0) return [];
      const outputs: string[] = [];
      for (const segment of segments) {
        outputs.push(...runLine(segment, ctx));
      }
      return outputs;
    },
    complete(input) {
      const trimmed = input.trim();
      if (trimmed === "") return [];
      const tokens = trimmed.split(/\s+/);
      const completingCommand = !input.endsWith(" ") && tokens.length === 1;
      if (completingCommand) {
        const names = new Set<string>();
        for (const cmd of listCommands()) {
          names.add(cmd.name);
          for (const alias of cmd.aliases ?? []) names.add(alias);
        }
        return [...names].filter((n) => n.startsWith(tokens[0]!)).sort();
      }
      const cmd = findCommand(tokens[0]!);
      if (!cmd?.complete) return [];
      return cmd.complete(tokens.slice(1), fs);
    },
  };
}
