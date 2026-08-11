"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Grid3X3,
  Home,
  Search,
  Settings,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { motionTokens } from "@/lib/motion/spring";
import {
  clampAssistiveY,
  useAssistiveTouchStore,
  type AssistiveDockSide,
} from "@/store/assistive-touch";

const BALL_SIZE = 48;
const DRAG_THRESHOLD = 6;
const TAP_MAX_MS = 200;
const IDLE_FADE_MS = 2500;
const EDGE_MARGIN = 8;

type MenuAction = "home" | "back" | "switcher" | "search" | "settings" | "close";

const MENU_ITEMS: {
  action: MenuAction;
  label: string;
  icon: typeof Home;
}[] = [
  { action: "home", label: "Home", icon: Home },
  { action: "back", label: "Back", icon: ArrowLeft },
  { action: "switcher", label: "Apps", icon: Grid3X3 },
  { action: "search", label: "Search", icon: Search },
  { action: "settings", label: "Settings", icon: Settings },
  { action: "close", label: "Close", icon: X },
];

interface IosAssistiveTouchProps {
  onHome: (ballEl: HTMLElement) => void | Promise<void>;
  onBack: () => void;
  onAppSwitcher: () => void;
  onSearch: () => void;
  onSettings: () => void;
}

export default function IosAssistiveTouch({
  onHome,
  onBack,
  onAppSwitcher,
  onSearch,
  onSettings,
}: IosAssistiveTouchProps) {
  const reducedMotion = useReducedMotion();
  const side = useAssistiveTouchStore((s) => s.side);
  const y = useAssistiveTouchStore((s) => s.y);
  const setPosition = useAssistiveTouchStore((s) => s.setPosition);

  const ballRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [engaged, setEngaged] = useState(true);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originY: number;
    moved: boolean;
    t: number;
  } | null>(null);

  const snapToEdge = useCallback(
    (releaseX: number, releaseY: number) => {
      const mid = window.innerWidth / 2;
      const nextSide: AssistiveDockSide = releaseX < mid ? "left" : "right";
      const nextY = clampAssistiveY(releaseY - BALL_SIZE / 2, window.innerHeight);
      setPosition(nextSide, nextY);
    },
    [setPosition],
  );

  useEffect(() => {
    if (!engaged || menuOpen) return;
    const id = window.setTimeout(() => setEngaged(false), IDLE_FADE_MS);
    return () => window.clearTimeout(id);
  }, [engaged, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ballRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [menuOpen]);

  const runMenuAction = useCallback(
    (action: MenuAction) => {
      if (action === "close") {
        setMenuOpen(false);
        return;
      }
      setMenuOpen(false);
      if (action === "home" && ballRef.current) void onHome(ballRef.current);
      if (action === "back") onBack();
      if (action === "switcher") onAppSwitcher();
      if (action === "search") onSearch();
      if (action === "settings") onSettings();
    },
    [onAppSwitcher, onBack, onHome, onSearch, onSettings],
  );

  const onBallPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setEngaged(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originY: y,
      moved: false,
      t: Date.now(),
    };
  };

  const onBallPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true;
      setDragging(true);
      setMenuOpen(false);
    }
    if (drag.moved) {
      setPosition(side, clampAssistiveY(drag.originY + dy, window.innerHeight));
    }
  };

  const onBallPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    if (drag.moved) {
      snapToEdge(e.clientX, e.clientY);
      setDragging(false);
      return;
    }

    const elapsed = Date.now() - drag.t;
    if (elapsed <= TAP_MAX_MS) {
      setMenuOpen((open) => !open);
    }
  };

  return (
    <>
      <motion.button
        ref={ballRef}
        type="button"
        data-testid="ios-assistive-touch"
        aria-label="AssistiveTouch menu"
        aria-expanded={menuOpen}
        className={`ios-assistive-ball touch-none ${
          side === "left" ? "ios-assistive-ball-left" : "ios-assistive-ball-right"
        }`}
        style={{
          top: y,
          width: BALL_SIZE,
          height: BALL_SIZE,
        }}
        animate={{
          opacity: engaged || menuOpen || dragging ? 1 : 0.4,
          scale: engaged || menuOpen ? 1.05 : 1,
        }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: motionTokens.duration.micro, ease: motionTokens.easing.easeOut }
        }
        onPointerDown={onBallPointerDown}
        onPointerMove={onBallPointerMove}
        onPointerUp={onBallPointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
          setDragging(false);
        }}
        onMouseEnter={() => setEngaged(true)}
      >
        <span className="ios-assistive-glyph" aria-hidden="true">
          •••
        </span>
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            data-testid="ios-assistive-menu"
            role="menu"
            aria-label="AssistiveTouch shortcuts"
            className={`ios-assistive-menu ${
              side === "left" ? "ios-assistive-menu-from-left" : "ios-assistive-menu-from-right"
            }`}
            style={{
              top: clampAssistiveY(y - 40, typeof window !== "undefined" ? window.innerHeight : 800),
            }}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={reducedMotion ? { duration: 0 } : motionTokens.spring.smooth}
          >
            <div className="ios-assistive-menu-grid">
              {MENU_ITEMS.map(({ action, label, icon: Icon }) => (
                <button
                  key={action}
                  type="button"
                  role="menuitem"
                  data-testid={`ios-assistive-${action}`}
                  aria-label={label}
                  onClick={() => runMenuAction(action)}
                  className="ios-assistive-menu-cell"
                >
                  <Icon size={20} strokeWidth={2.2} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
