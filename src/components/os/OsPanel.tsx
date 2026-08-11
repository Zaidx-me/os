"use client";

export interface OsPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function OsPanel({ children, className = "" }: OsPanelProps) {
  return (
    <div
      className={`rounded-2xl border border-zaid-border bg-zaid-surface p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
