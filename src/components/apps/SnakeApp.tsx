"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OsAppShell, OsButton, OsPanel, OsStatusBar } from "@/components/os";
import type { WindowAppProps } from "@/lib/apps";

const GRID = 16;
const TICK_MS = 140;

type Point = { x: number; y: number };

export function SnakeApp(_props: WindowAppProps) {
  const [snake, setSnake] = useState<Point[]>([{ x: 8, y: 8 }]);
  const [dir, setDir] = useState<Point>({ x: 1, y: 0 });
  const [food, setFood] = useState<Point>({ x: 12, y: 8 });
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const dirRef = useRef(dir);

  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);

  const spawnFood = useCallback((body: Point[]): Point => {
    let next: Point;
    do {
      next = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID),
      };
    } while (body.some((p) => p.x === next.x && p.y === next.y));
    return next;
  }, []);

  const reset = useCallback(() => {
    const start = [{ x: 8, y: 8 }];
    setSnake(start);
    setDir({ x: 1, y: 0 });
    setFood(spawnFood(start));
    setScore(0);
    setOver(false);
  }, [spawnFood]);

  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => {
      setSnake((prev) => {
        const head = prev[0];
        const next = {
          x: head.x + dirRef.current.x,
          y: head.y + dirRef.current.y,
        };
        if (
          next.x < 0 ||
          next.y < 0 ||
          next.x >= GRID ||
          next.y >= GRID ||
          prev.some((p) => p.x === next.x && p.y === next.y)
        ) {
          setOver(true);
          return prev;
        }
        const ate = next.x === food.x && next.y === food.y;
        const body = [next, ...prev];
        if (!ate) body.pop();
        else {
          setScore((s) => s + 10);
          setFood(spawnFood(body));
        }
        return body;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [food, over, spawnFood]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };
      const next = map[e.key];
      if (!next) return;
      e.preventDefault();
      const cur = dirRef.current;
      if (cur.x + next.x === 0 && cur.y + next.y === 0) return;
      setDir(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <OsAppShell
      testId="app-content-snake"
      statusBar={
        <OsStatusBar>
          <span data-testid="snake-score">Score: {score}</span>
          <span>{over ? "Game over" : "Arrow keys to move"}</span>
        </OsStatusBar>
      }
    >
      <div className="flex h-full flex-col items-center justify-center gap-3 p-3">
        <OsPanel className="p-2">
          <div
            data-testid="snake-board"
            className="grid gap-px rounded-md bg-zaid-border/40 p-px"
            style={{
              gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))`,
              width: "min(92vw, 320px)",
            }}
          >
            {Array.from({ length: GRID * GRID }, (_, i) => {
              const x = i % GRID;
              const y = Math.floor(i / GRID);
              const isSnake = snake.some((p) => p.x === x && p.y === y);
              const isHead = snake[0]?.x === x && snake[0]?.y === y;
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-[2px] ${
                    isHead
                      ? "bg-zaid-accent"
                      : isSnake
                        ? "bg-zaid-accent/50"
                        : isFood
                          ? "bg-zaid-accent"
                          : "bg-zaid-bg/80"
                  }`}
                />
              );
            })}
          </div>
        </OsPanel>
        {over && (
          <OsButton data-testid="snake-restart" variant="primary" onClick={reset}>
            Play again
          </OsButton>
        )}
      </div>
    </OsAppShell>
  );
}

export default SnakeApp;
