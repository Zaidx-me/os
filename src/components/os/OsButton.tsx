"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type OsButtonVariant = "default" | "primary" | "danger" | "ghost" | "icon";

export interface OsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OsButtonVariant;
  children: ReactNode;
}

const VARIANT: Record<OsButtonVariant, string> = {
  default:
    "border border-zaid-border bg-zaid-surface text-zaid-text shadow-sm hover:bg-zaid-surface2 active:scale-[0.98]",
  primary:
    "bg-zaid-accent text-white shadow-sm hover:brightness-105 active:scale-[0.98]",
  danger:
    "border border-red-200 bg-red-50 text-zaid-danger hover:bg-red-100 active:scale-[0.98]",
  ghost: "text-zaid-muted hover:bg-zaid-surface2 hover:text-zaid-text",
  icon: "text-zaid-muted hover:bg-zaid-surface2 hover:text-zaid-text",
};

export function OsButton({
  variant = "default",
  className = "",
  children,
  type = "button",
  ...props
}: OsButtonProps) {
  const base =
    variant === "icon"
      ? "inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs transition-all"
      : "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40";

  return (
    <button type={type} className={`${base} ${VARIANT[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
