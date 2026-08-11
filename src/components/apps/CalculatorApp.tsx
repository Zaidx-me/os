"use client";

import { useCallback, useState } from "react";
import { OsAppShell, OsButton, OsPanel } from "@/components/os";
import type { WindowAppProps } from "@/lib/apps";

type Op = "+" | "-" | "×" | "÷" | null;

export function CalculatorApp(_props: WindowAppProps) {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [fresh, setFresh] = useState(true);

  const inputDigit = useCallback(
    (d: string) => {
      setDisplay((prev) => {
        if (fresh) return d === "." ? "0." : d;
        if (d === "." && prev.includes(".")) return prev;
        return prev === "0" && d !== "." ? d : prev + d;
      });
      setFresh(false);
    },
    [fresh],
  );

  const compute = useCallback((a: number, b: number, operation: Op): number => {
    switch (operation) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }, []);

  const pressOp = useCallback(
    (next: Op) => {
      const val = parseFloat(display);
      if (stored !== null && op !== null && !fresh) {
        const result = compute(stored, val, op);
        setDisplay(String(result));
        setStored(result);
      } else {
        setStored(val);
      }
      setOp(next);
      setFresh(true);
    },
    [compute, display, fresh, op, stored],
  );

  const equals = useCallback(() => {
    if (stored === null || op === null) return;
    const val = parseFloat(display);
    const result = compute(stored, val, op);
    setDisplay(String(result));
    setStored(null);
    setOp(null);
    setFresh(true);
  }, [compute, display, op, stored]);

  const clear = useCallback(() => {
    setDisplay("0");
    setStored(null);
    setOp(null);
    setFresh(true);
  }, []);

  const keys = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ] as const;

  return (
    <OsAppShell testId="app-content-calculator" className="bg-zaid-bg p-4">
      <OsPanel className="mb-4">
        <div
          data-testid="calculator-display"
          className="px-2 py-4 text-right font-mono text-3xl tabular-nums text-zaid-text"
        >
          {display}
        </div>
        {op && stored !== null && (
          <p className="px-2 text-right text-[10px] text-zaid-muted">
            {stored} {op}
          </p>
        )}
      </OsPanel>
      <div className="grid grid-cols-4 gap-2">
        {keys.flat().map((key) => {
          const wide = key === "0";
          const isOp = ["+", "-", "×", "÷", "="].includes(key);
          const isUtil = ["C", "±", "%"].includes(key);
          return (
            <OsButton
              key={key}
              data-testid={`calc-key-${key}`}
              variant={isOp ? "primary" : isUtil ? "ghost" : "default"}
              onClick={() => {
                if (key === "C") clear();
                else if (key === "=") equals();
                else if (["+", "-", "×", "÷"].includes(key)) pressOp(key as Op);
                else if (/\d|\./.test(key)) inputDigit(key);
              }}
              className={`py-4 text-lg font-semibold ${wide ? "col-span-2" : ""}`}
            >
              {key}
            </OsButton>
          );
        })}
      </div>
    </OsAppShell>
  );
}

export default CalculatorApp;
