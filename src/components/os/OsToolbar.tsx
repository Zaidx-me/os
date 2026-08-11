"use client";

import type { ReactNode } from "react";

export interface OsToolbarProps {
  children: ReactNode;
  className?: string;
}

export function OsToolbar({ children, className = "" }: OsToolbarProps) {
  return (
    <div
      className={`flex shrink-0 flex-wrap items-center gap-1.5 border-b border-zaid-border/80 bg-zaid-surface2/50 px-3 py-2 ${className}`}
    >
      {children}
    </div>
  );
}
