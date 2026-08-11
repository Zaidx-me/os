"use client";

import type { ReactNode } from "react";

export interface OsSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function OsSection({ title, children, className = "" }: OsSectionProps) {
  return (
    <section className={`mb-6 ${className}`}>
      <h2 className="label-caps mb-3 text-zaid-muted">{title}</h2>
      {children}
    </section>
  );
}
