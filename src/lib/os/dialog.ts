import { create } from "zustand";

export type DialogKind = "alert" | "confirm" | "prompt" | "open";

export interface DialogState {
  id: string;
  kind: DialogKind;
  title: string;
  message: string;
  defaultValue?: string;
  directory?: string;
}

interface DialogStore {
  active: DialogState | null;
  resolve: ((value: unknown) => void) | null;
  show: (dialog: DialogState, resolve: (value: unknown) => void) => void;
  dismiss: (value: unknown) => void;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  active: null,
  resolve: null,
  show: (dialog, resolve) => set({ active: dialog, resolve }),
  dismiss: (value) => {
    const { resolve } = get();
    resolve?.(value);
    set({ active: null, resolve: null });
  },
}));

let dialogSeq = 0;

function nextId(): string {
  dialogSeq += 1;
  return `dlg-${dialogSeq}`;
}

export function osAlert(message: string, title = "ZaidOS"): Promise<void> {
  return new Promise((resolve) => {
    useDialogStore.getState().show(
      { id: nextId(), kind: "alert", title, message },
      () => resolve(),
    );
  });
}

export function osConfirm(message: string, title = "Confirm"): Promise<boolean> {
  return new Promise((resolve) => {
    useDialogStore.getState().show(
      { id: nextId(), kind: "confirm", title, message },
      (value) => resolve(Boolean(value)),
    );
  });
}

export function osPrompt(
  message: string,
  defaultValue = "",
  title = "Input",
): Promise<string | null> {
  return new Promise((resolve) => {
    useDialogStore.getState().show(
      { id: nextId(), kind: "prompt", title, message, defaultValue },
      (value) => resolve(typeof value === "string" ? value : null),
    );
  });
}

export function osOpenDialog(options?: {
  title?: string;
  directory?: string;
}): Promise<string | null> {
  return new Promise((resolve) => {
    useDialogStore.getState().show(
      {
        id: nextId(),
        kind: "open",
        title: options?.title ?? "Open File",
        message: "Select a file",
        directory: options?.directory,
      },
      (value) => resolve(typeof value === "string" ? value : null),
    );
  });
}

export const selectActiveDialog = (s: DialogStore) => s.active;
