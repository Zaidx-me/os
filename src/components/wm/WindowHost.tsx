"use client";

import { Suspense } from "react";
import { getAppMeta, type WindowAppProps } from "@/lib/apps";
import { closeWindow } from "@/lib/wm/actions";
import { useWmStore } from "@/store/wm";

/**
 * Window content provider — mounts the lazy app component for a window. The
 * registry's `component` is React.lazy, so this host Suspends while the app
 * chunk loads (code-splitting: the shell never statically imports an app).
 *
 * Each app receives { windowId, close, minimize, maximize, setTitle } — the
 * tiny chrome-control surface every real app uses to drive its own window
 * title and buttons.
 *
 * Unknown appId throws a clear Error: the registry is the single source of
 * valid ids, so a window whose app vanished from APPS is a programmer error
 * worth crashing loudly, not rendering a blank frame.
 */
export default function WindowHost({
  windowId,
  appId,
}: {
  windowId: string;
  appId: string;
}) {
  const meta = getAppMeta(appId);
  if (meta === undefined) {
    throw new Error(`Unknown app id "${appId}" — no entry in APPS (src/lib/apps.tsx)`);
  }

  const App = meta.component;
  const appProps: WindowAppProps = {
    windowId,
    close: () => closeWindow(windowId),
    minimize: () => useWmStore.getState().minimize(windowId),
    maximize: () => useWmStore.getState().toggleMaximize(windowId),
    setTitle: (title) => useWmStore.getState().setTitle(windowId, title),
  };

  return (
    <Suspense
      fallback={
        <div
          data-testid="window-app-loading"
          className="flex h-full w-full items-center justify-center gap-2"
        >
          {meta.icon}
          <span className="font-mono text-xs text-zaid-muted">
            Loading {meta.title}…
          </span>
        </div>
      }
    >
      <App {...appProps} />
    </Suspense>
  );
}
