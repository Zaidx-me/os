"use client";

export interface OsSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  testId?: string;
}

export function OsSwitch({ checked, onChange, label, testId }: OsSwitchProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 font-mono text-xs text-zaid-text">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-testid={testId}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked
            ? "border-zaid-accent/50 bg-zaid-accent/30"
            : "border-zaid-border bg-zaid-surface2"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-zaid-text shadow transition-transform ${
            checked ? "translate-x-5 bg-zaid-accent" : ""
          }`}
        />
      </button>
    </label>
  );
}
