import { afterEach, describe, expect, it, vi } from "vitest";
import {
  disposeHotkeys,
  initHotkeys,
  resolveHotkey,
  setModalOpen,
  type HotkeyAction,
  type HotkeyEvent,
  type HotkeyHandlers,
} from "./hotkeys";

/**
 * Hotkey service tests (todo 12).
 *
 * `resolveHotkey` is pure and takes an explicit platform, so the tests cover
 * both Mac (Mod = Meta) and non-Mac (Mod = Ctrl+Alt) branches deterministically
 * regardless of the jsdom host platform. initHotkeys is exercised through real
 * window keydown dispatch to prove the module guard (no duplicate listeners).
 */

function ev(overrides: Partial<HotkeyEvent> = {}): HotkeyEvent {
  return {
    key: "Enter",
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    target: null,
    ...overrides,
  };
}

/** Mod = Meta (macOS). */
function mac(overrides: Partial<HotkeyEvent> = {}): HotkeyEvent {
  return ev({ metaKey: true, ...overrides });
}

/** Mod = Ctrl+Alt (non-Mac). */
function linux(overrides: Partial<HotkeyEvent> = {}): HotkeyEvent {
  return ev({ ctrlKey: true, altKey: true, ...overrides });
}

function handlers(): HotkeyHandlers {
  return {
    openTerminal: vi.fn(),
    toggleLauncher: vi.fn(),
    selectWorkspace: vi.fn(),
    closeFocused: vi.fn(),
    minimizeFocused: vi.fn(),
    tile: vi.fn(),
    moveToWorkspace: vi.fn(),
    toggleFloat: vi.fn(),
    cycleWindows: vi.fn(),
  };
}

afterEach(() => {
  setModalOpen(false);
  disposeHotkeys();
});

describe("resolveHotkey — keymap", () => {
  it("resolves Mod+1..5 to selectWorkspace (Mac)", () => {
    for (let i = 1; i <= 5; i++) {
      expect(resolveHotkey(mac({ key: String(i) }), "mac")).toEqual({
        type: "selectWorkspace",
        ws: i,
      });
    }
  });

  it("resolves every listed combo (Mac)", () => {
    const cases: Array<[string, HotkeyAction]> = [
      ["Enter", { type: "openTerminal" }],
      [" ", { type: "toggleLauncher" }],
      ["q", { type: "closeFocused" }],
      ["Q", { type: "closeFocused" }], // shift held — still matches
      ["m", { type: "minimizeFocused" }],
      ["ArrowLeft", { type: "tile", dir: "left" }],
      ["ArrowRight", { type: "tile", dir: "right" }],
      ["ArrowUp", { type: "tile", dir: "full" }],
      ["f", { type: "toggleFloat" }],
      ["Tab", { type: "cycleWindows" }],
    ];
    for (const [key, action] of cases) {
      expect(resolveHotkey(mac({ key }), "mac")).toEqual(action);
    }
  });

  it("resolves the same combos with Ctrl+Alt on non-Mac", () => {
    const cases: Array<[string, HotkeyAction]> = [
      ["Enter", { type: "openTerminal" }],
      [" ", { type: "toggleLauncher" }],
      ["3", { type: "selectWorkspace", ws: 3 }],
      ["q", { type: "closeFocused" }],
      ["m", { type: "minimizeFocused" }],
      ["ArrowLeft", { type: "tile", dir: "left" }],
      ["ArrowRight", { type: "tile", dir: "right" }],
      ["f", { type: "toggleFloat" }],
      ["Tab", { type: "cycleWindows" }],
    ];
    for (const [key, action] of cases) {
      expect(resolveHotkey(linux({ key }), "other")).toEqual(action);
    }
  });

  it("Shift turns the arrow keys back into moveToWorkspace (both platforms)", () => {
    expect(resolveHotkey(mac({ key: "ArrowLeft", shiftKey: true }), "mac")).toEqual({
      type: "moveToWorkspace",
      dir: -1,
    });
    expect(resolveHotkey(mac({ key: "ArrowRight", shiftKey: true }), "mac")).toEqual({
      type: "moveToWorkspace",
      dir: 1,
    });
    expect(resolveHotkey(linux({ key: "ArrowLeft", shiftKey: true }), "other")).toEqual({
      type: "moveToWorkspace",
      dir: -1,
    });
    expect(resolveHotkey(linux({ key: "ArrowRight", shiftKey: true }), "other")).toEqual({
      type: "moveToWorkspace",
      dir: 1,
    });
  });

  it("resolves nothing for plain keys or wrong modifiers", () => {
    expect(resolveHotkey(ev(), "mac")).toBeNull(); // no modifier
    expect(resolveHotkey(ev(), "other")).toBeNull();
    expect(resolveHotkey(mac({ key: "a" }), "mac")).toBeNull(); // unbound key
    expect(resolveHotkey(linux({ key: "a" }), "other")).toBeNull();
    expect(resolveHotkey(ev({ metaKey: true }), "other")).toBeNull(); // Meta on non-Mac
    expect(resolveHotkey(ev({ ctrlKey: true }), "other")).toBeNull(); // Ctrl only
    expect(resolveHotkey(ev({ altKey: true }), "other")).toBeNull(); // Alt only
    expect(resolveHotkey(ev({ ctrlKey: true, altKey: true, metaKey: true }), "other")).toBeNull();
    expect(resolveHotkey(ev({ ctrlKey: true }), "mac")).toBeNull(); // Ctrl on Mac
  });
});

describe("resolveHotkey — ignore rules", () => {
  it("is ignored when the target is an input", () => {
    const target = document.createElement("input");
    expect(resolveHotkey(mac({ target }), "mac")).toBeNull();
  });

  it("is ignored when the target is a textarea", () => {
    const target = document.createElement("textarea");
    expect(resolveHotkey(linux({ target }), "other")).toBeNull();
  });

  it("is ignored when the target is contentEditable", () => {
    const target = document.createElement("div");
    target.contentEditable = "true";
    expect(resolveHotkey(mac({ target }), "mac")).toBeNull();
  });

  it("still fires from a non-editable body target", () => {
    expect(resolveHotkey(mac({ target: document.body }), "mac")).toEqual({
      type: "openTerminal",
    });
  });

  it("is ignored while a modal is open and unblocks after setModalOpen(false)", () => {
    setModalOpen(true);
    expect(resolveHotkey(mac(), "mac")).toBeNull();
    setModalOpen(false);
    expect(resolveHotkey(mac(), "mac")).toEqual({ type: "openTerminal" });
  });
});

describe("initHotkeys — guarded listener", () => {
  it("attaches exactly one listener and dispatches to the handlers", () => {
    const h = handlers();
    const cleanup1 = initHotkeys(h, "mac");
    const cleanup2 = initHotkeys(h, "mac"); // duplicate call: must be a no-op

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", metaKey: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "3", metaKey: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", metaKey: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", metaKey: true, cancelable: true }));

    expect(h.openTerminal).toHaveBeenCalledTimes(1);
    expect(h.selectWorkspace).toHaveBeenCalledWith(3);
    expect(h.tile).toHaveBeenCalledWith("left");
    expect(h.cycleWindows).toHaveBeenCalledTimes(1);
    expect(h.closeFocused).not.toHaveBeenCalled();

    cleanup1();
    cleanup2(); // second cleanup must be safe
    expect(h.openTerminal).toHaveBeenCalledTimes(1); // listener already removed
  });

  it("is removed by disposeHotkeys (no handler calls afterwards)", () => {
    const h = handlers();
    initHotkeys(h, "mac");
    disposeHotkeys();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", metaKey: true }));
    expect(h.openTerminal).not.toHaveBeenCalled();
  });

  it("prevents the browser default for matched hotkeys", () => {
    initHotkeys(handlers(), "mac");
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      metaKey: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not preventDefault for unmatched keys", () => {
    initHotkeys(handlers(), "mac");
    const event = new KeyboardEvent("keydown", {
      key: "a",
      metaKey: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
