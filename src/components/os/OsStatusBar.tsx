"use client";

import type { ReactNode } from "react";

export interface OsStatusBarProps {
  children: ReactNode;
  className?: string;
}

export function OsStatusBar({ children, className = "" }: OsStatusBarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-between gap-2 border-t border-zaid-border/80 bg-zaid-bg/80 px-3 py-1.5 font-mono text-[10px] text-zaid-muted ${className}`}
    >
      {children}
    </div>
  );
}
