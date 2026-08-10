import type { WorkspaceId } from "@/store/workspaces";

/**
 * Global hotkey service.
 *
 * Modifier: **Mod = Meta on macOS, Ctrl+Alt everywhere else** (documented in
 * Settings). The platform is resolved once per resolveHotkey/initHotkeys call
 * via `detectPlatform()` (overridable for tests).
 *
 * Keymap:
 *   Mod+Enter        open terminal
 *   Mod+Space        toggle launcher
 *   Mod+1..5         switch to workspace 1..5
 *   Mod+Q            close focused window
 *   Mod+M            minimize focused window
 *   Mod+ArrowLeft    move window to previous workspace
 *   Mod+ArrowRight   move window to next workspace
 *   Mod+F            toggle float mode
 *   Mod+Tab          cycle windows (active workspace only)
 *
 * The listener is IGNORED when the event target is an input/textarea/
 * contentEditable element OR while a modal overlay (launcher, context dialogs)
 * is open — modal components call `setModalOpen(bool)`.
 *
 * SHELL WIRING (deferred): src/app/page.tsx is owned by the parallel task 7
 * this round — hotkeys are NOT mounted into the shell yet. A later todo mounts
 * `initHotkeys(handlers)` with real handler implementations (one line). This
 * file ships the complete, unit-tested service: pure `resolveHotkey` + a
 * module-guarded `initHotkeys` that attaches exactly ONE window keydown
 * listener (a hot-reloaded module must never stack duplicate listeners).
 */

export type Platform = "mac" | "other";

export type HotkeyAction =
  | { type: "openTerminal" }
  | { type: "toggleLauncher" }
  | { type: "selectWorkspace"; ws: WorkspaceId }
  | { type: "closeFocused" }
  | { type: "minimizeFocused" }
  | { type: "moveToWorkspace"; dir: -1 | 1 }
  | { type: "toggleFloat" }
  | { type: "cycleWindows" };

/** Handler record for every hotkey action (wired by the shell, later todo). */
export interface HotkeyHandlers {
  openTerminal(): void;
  toggleLauncher(): void;
  selectWorkspace(ws: WorkspaceId): void;
  closeFocused(): void;
  minimizeFocused(): void;
  moveToWorkspace(dir: -1 | 1): void;
  toggleFloat(): void;
  cycleWindows(): void;
}

/** The subset of KeyboardEvent the resolver needs (pure, DOM-free typing). */
export interface HotkeyEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  target: EventTarget | null;
}

/** Resolves the platform — "mac" for any Apple platform, "other" elsewhere. */
export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  return /mac|iphone|ipad|ipod/i.test(navigator.platform ?? "") ? "mac" : "other";
}

/** True when Mod is held for the platform (Meta on mac, Ctrl+Alt otherwise). */
function modActive(event: HotkeyEvent, platform: Platform): boolean {
  if (platform === "mac") return event.metaKey && !event.ctrlKey && !event.altKey;
  return event.ctrlKey && event.altKey && !event.metaKey;
}

/**
 * Hotkeys never fire while typing in an editable field.
 * Both checks are needed: jsdom 29 omits `isContentEditable` (undefined), so
 * the IDL property is the reliable cross-environment signal; real browsers
 * keep the standard getter too.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  return target.isContentEditable || target.contentEditable === "true";
}

/** Modality flag for overlays (launcher, context dialogs) that block hotkeys. */
let modalOpen = false;

/** Modal overlays set this while open — hotkeys are ignored meanwhile. */
export function setModalOpen(open: boolean): void {
  modalOpen = open;
}

export function isModalOpen(): boolean {
  return modalOpen;
}

/** Hotkey action per physical key (event.key, lowercased for single chars). */
const KEY_TO_ACTION: Record<string, HotkeyAction> = {
  Enter: { type: "openTerminal" },
  " ": { type: "toggleLauncher" },
  "1": { type: "selectWorkspace", ws: 1 },
  "2": { type: "selectWorkspace", ws: 2 },
  "3": { type: "selectWorkspace", ws: 3 },
  "4": { type: "selectWorkspace", ws: 4 },
  "5": { type: "selectWorkspace", ws: 5 },
  q: { type: "closeFocused" },
  m: { type: "minimizeFocused" },
  ArrowLeft: { type: "moveToWorkspace", dir: -1 },
  ArrowRight: { type: "moveToWorkspace", dir: 1 },
  f: { type: "toggleFloat" },
  Tab: { type: "cycleWindows" },
};

/**
 * Pure resolver: maps a keyboard event (plus optional platform override) to a
 * hotkey action, or null when it should be ignored — wrong modifiers, plain
 * keys, editable targets, or an open modal.
 */
export function resolveHotkey(
  event: HotkeyEvent,
  platform: Platform = detectPlatform(),
): HotkeyAction | null {
  if (modalOpen) return null;
  if (isEditableTarget(event.target)) return null;
  if (!modActive(event, platform)) return null;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return KEY_TO_ACTION[key] ?? null;
}

function dispatch(action: HotkeyAction, handlers: HotkeyHandlers): void {
  switch (action.type) {
    case "openTerminal":
      handlers.openTerminal();
      break;
    case "toggleLauncher":
      handlers.toggleLauncher();
      break;
    case "selectWorkspace":
      handlers.selectWorkspace(action.ws);
      break;
    case "closeFocused":
      handlers.closeFocused();
      break;
    case "minimizeFocused":
      handlers.minimizeFocused();
      break;
    case "moveToWorkspace":
      handlers.moveToWorkspace(action.dir);
      break;
    case "toggleFloat":
      handlers.toggleFloat();
      break;
    case "cycleWindows":
      handlers.cycleWindows();
      break;
  }
}

/** The single attached listener (module guard against HMR duplicates). */
let activeListener: ((event: KeyboardEvent) => void) | null = null;

/**
 * Attaches ONE global keydown listener for the whole session. A second call
 * while a listener is active is a no-op (HMR-safe — hot reloads must never
 * stack listeners). Returns a teardown that removes the listener; the module
 * also exposes disposeHotkeys().
 */
export function initHotkeys(
  handlers: HotkeyHandlers,
  platform: Platform = detectPlatform(),
): () => void {
  if (activeListener !== null) {
    return disposeHotkeys; // already attached — never duplicate
  }
  const listener = (event: KeyboardEvent): void => {
    const action = resolveHotkey(event, platform);
    if (action === null) return;
    event.preventDefault();
    dispatch(action, handlers);
  };
  activeListener = listener;
  window.addEventListener("keydown", listener);
  return disposeHotkeys;
}

/** Removes the global listener and resets the module guard. */
export function disposeHotkeys(): void {
  if (activeListener !== null) {
    window.removeEventListener("keydown", activeListener);
    activeListener = null;
  }
}
