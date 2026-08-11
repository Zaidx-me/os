/**
 * neofetch — simulated system card for the terminal (todo 26).
 *
 * Original geometric "A" logo (NOT the canonical Arch/neofetch ASCII). All
 * host/kernel lines are explicit jokes — nothing pretends to be real hardware.
 */
import { formatSessionUptime, getSessionUptimeSec } from "@/store/session";

const ANSI_GREEN = "\x1b[32m";
const ANSI_CYAN = "\x1b[36m";
const ANSI_BLUE = "\x1b[34m";
const ANSI_MAGENTA = "\x1b[35m";
const ANSI_YELLOW = "\x1b[33m";
const ANSI_RED = "\x1b[31m";
const ANSI_RESET = "\x1b[0m";

/** Original stylized "A" — geometric, not copied from neofetch/Arch art. */
export const NEOFETCH_LOGO = [
  "      /\\      ",
  "     /  \\     ",
  "    /    \\    ",
  "   /  /\\  \\   ",
  "  /  /  \\  \\  ",
  " /__/    \\__\\ ",
  "              ",
] as const;

export interface NeofetchEnv {
  width: number;
  height: number;
  cores: number;
  uptimeSec: number;
  /** Fake RAM usage percentage (browser has no real reading). */
  memoryPct: number;
}

/** Deterministic fake memory % from session uptime (never NaN). */
export function fakeMemoryPct(uptimeSec: number): number {
  return 18 + (uptimeSec % 37);
}

export function readNeofetchEnv(
  overrides: Partial<NeofetchEnv> = {},
): NeofetchEnv {
  const uptimeSec = overrides.uptimeSec ?? getSessionUptimeSec();
  const width =
    overrides.width ??
    (typeof window !== "undefined" ? window.innerWidth : 1440);
  const height =
    overrides.height ??
    (typeof window !== "undefined" ? window.innerHeight : 900);
  const cores =
    overrides.cores ??
    (typeof navigator !== "undefined" ? navigator.hardwareConcurrency : 8);
  return {
    width,
    height,
    cores,
    uptimeSec,
    memoryPct: overrides.memoryPct ?? fakeMemoryPct(uptimeSec),
  };
}

function colorBlocks(): string {
  const blocks = [
    [ANSI_GREEN, "███"],
    [ANSI_CYAN, "███"],
    [ANSI_BLUE, "███"],
    [ANSI_MAGENTA, "███"],
    [ANSI_YELLOW, "███"],
    [ANSI_RED, "███"],
  ];
  return (
    "Colors: " +
    blocks.map(([code, block]) => `${code}${block}${ANSI_RESET}`).join("")
  );
}

/** Merge logo lines with right-padded info lines (neofetch layout). */
function mergeLogoAndInfo(logo: readonly string[], info: readonly string[]): string[] {
  const width = Math.max(...logo.map((l) => l.length), 1);
  const rows = Math.max(logo.length, info.length);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) {
    const left = (logo[i] ?? "").padEnd(width);
    const right = info[i] ?? "";
    out.push(right ? `${left}${right}` : left.trimEnd());
  }
  return out;
}

export function neofetch(env: NeofetchEnv): readonly string[] {
  const info = [
    `${ANSI_GREEN}zaid@zaidos${ANSI_RESET}`,
    `${ANSI_GREEN}─────────────${ANSI_RESET}`,
    `OS: ZaidOS x86_64 (browser edition)`,
    `Host: your browser (probably)`,
    `Kernel: 6.12.1-zen (joke)`,
    `Uptime: ${formatSessionUptime(env.uptimeSec)}`,
    `Shell: zsh 5.9`,
    `WM: Hyprland.web`,
    `Terminal: ZaidOS Terminal`,
    `CPU: ${env.cores} cores (browser tab)`,
    `Memory: ${env.memoryPct}% (fake)`,
    `Resolution: ${env.width}x${env.height}`,
    colorBlocks(),
  ];
  return mergeLogoAndInfo(NEOFETCH_LOGO, info);
}
