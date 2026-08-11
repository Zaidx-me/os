"use client";

import type { ReactNode } from "react";

export interface OsAppShellProps {
  testId: string;
  toolbar?: ReactNode;
  statusBar?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Standard app chrome: optional toolbar, scrollable body, optional status bar. */
export function OsAppShell({
  testId,
  toolbar,
  statusBar,
  children,
  className = "",
}: OsAppShellProps) {
  return (
    <div
      data-testid={testId}
      className={`flex h-full w-full flex-col bg-zaid-surface font-sans text-sm text-zaid-text ${className}`}
    >
      {toolbar}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      {statusBar}
    </div>
  );
}
