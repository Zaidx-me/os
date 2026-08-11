"use client";

import type { InputHTMLAttributes } from "react";

export interface OsInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function OsInput({ className = "", ...props }: OsInputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-zaid-border bg-zaid-surface2 px-3 py-2 font-sans text-sm text-zaid-text outline-none transition-shadow placeholder:text-zaid-muted focus:border-zaid-accent focus:ring-2 focus:ring-zaid-accent/20 ${className}`}
      {...props}
    />
  );
}
