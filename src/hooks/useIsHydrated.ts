"use client";

import { useSyncExternalStore } from "react";

const EMPTY_SUBSCRIBE = () => () => {};

/**
 * true only after client-side hydration completes: the server snapshot is
 * false, the client snapshot is true, so SSR and the hydration render both
 * see false (matching the server's null output) and React re-renders with
 * true once hydration finishes. Canonical React 19 replacement for the
 * `const [mounted, setMounted] = useState(false); useEffect(() =>
 * setMounted(true), [])` gate — no setState-in-effect, no extra module
 * state.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    EMPTY_SUBSCRIBE,
    () => true,
    () => false,
  );
}
