"use client";

import { AppIcon } from "@/components/ui/AppIcon";
import type { AppId } from "@/components/ui/AppIcon";

/**
 * Shared placeholder body for apps whose real content lands in later todos.
 * Renders the app icon + title + a "lands in todo N" note so every lazy app
 * has visible, testable content from day one. Real app components replace this
 * per-app.
 */
export function AppPlaceholder({
  appId,
  title,
  note,
}: {
  appId: AppId;
  title: string;
  note: string;
}) {
  return (
    <div
      data-testid={`app-content-${appId}`}
      className="flex h-full w-full flex-col items-center justify-center gap-3 p-6"
    >
      <AppIcon appId={appId} size={48} className="text-zaid-muted" />
      <p className="font-mono text-sm text-zaid-text">{title}</p>
      <p className="font-mono text-xs text-zaid-muted">{note}</p>
    </div>
  );
}
