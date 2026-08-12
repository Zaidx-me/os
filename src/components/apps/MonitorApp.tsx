"use client";

import { useEffect, useState } from "react";

import type { WindowAppProps } from "@/lib/apps";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `up ${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function bar(pct: number): string {
  const filled = Math.round(pct / 5);
  return "█".repeat(filled) + "░".repeat(20 - filled);
}

export function MonitorApp(_props: WindowAppProps) {
  const [cpu, setCpu] = useState(42);
  const [ram, setRam] = useState(61);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setCpu(Math.round(35 + 25 * Math.sin(t / 9000) + Math.random() * 8));
      setRam(Math.round(55 + 15 * Math.sin(t / 7000 + 1) + Math.random() * 6));
      setUptime((u) => u + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const processes = [
    { pid: 1, name: "systemd", cpu: 0.1, mem: 1.2 },
    { pid: 412, name: "hyprland.web", cpu: 12.4, mem: 8.1 },
    { pid: 891, name: "waybar", cpu: 0.8, mem: 2.3 },
    { pid: 1204, name: "zaidos-wm", cpu: 4.2, mem: 5.6 },
    { pid: 2048, name: "browser", cpu: 6.1, mem: 12.4 },
    { pid: 4096, name: "terminal", cpu: 1.2, mem: 3.1 },
    { pid: 8192, name: "matrix-rain", cpu: 2.8, mem: 4.0 },
  ];

  return (
    <div
      data-testid="app-content-monitor"
      className="h-full overflow-y-auto bg-zaid-bg p-3 sm:p-4 font-mono text-xs text-zaid-text"
    >
      <pre className="overflow-x-auto leading-relaxed">
        {`ZaidOS System Monitor — ${formatUptime(uptime)}

CPU  [${bar(cpu)}] ${cpu}%
RAM  [${bar(ram)}] ${ram}%

PID    NAME              CPU%    MEM%
────   ───────────────   ─────   ─────
${processes.map((p) => `${String(p.pid).padEnd(6)} ${p.name.padEnd(17)} ${String(p.cpu).padStart(5)}   ${String(p.mem).padStart(5)}`).join("\n")}

Load average: ${(cpu / 20).toFixed(2)}, ${(ram / 25).toFixed(2)}, ${((cpu + ram) / 40).toFixed(2)}
Tasks: ${processes.length} running, 0 sleeping, 0 zombie
`}
      </pre>
    </div>
  );
}

export default MonitorApp;
