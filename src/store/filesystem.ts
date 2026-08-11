import { create } from "zustand";

import { FakeFs } from "@/lib/shell/fakefs";

/** Shared simulated filesystem — terminal and Files app stay in sync. */
export const useFilesystemStore = create<{
  fs: FakeFs;
  navTick: number;
  bump: () => void;
}>((set, get) => ({
  fs: new FakeFs(),
  navTick: 0,
  bump: () => set({ navTick: get().navTick + 1 }),
}));

export function getSharedFs(): FakeFs {
  return useFilesystemStore.getState().fs;
}

export function bumpFilesystem(): void {
  useFilesystemStore.getState().bump();
}
