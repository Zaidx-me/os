import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  Grid3X3,
  Home,
  Mic,
  MoreHorizontal,
  RotateCw,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

const BALL = 58;
const DRAG = 8;
const TAP_MS = 220;
const IDLE_MS = 2800;
const MARGIN = 6;

const MAIN_MENU = [
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "control", label: "Control Center", Icon: SlidersHorizontal },
  { id: "home", label: "Home", Icon: Home },
  { id: "siri", label: "Siri", Icon: Mic },
  { id: "rotate", label: "Rotate Screen", Icon: RotateCw },
  { id: "more", label: "More", Icon: MoreHorizontal },
];

const MORE_MENU = [
  { id: "switcher", label: "App Switcher", Icon: Grid3X3 },
  { id: "settings", label: "Settings", Icon: Settings },
  { id: "back", label: "Back", Icon: ChevronLeft },
];

function clampY(y, h = window.innerHeight) {
  const top = 48;
  const bottom = 100;
  return Math.max(top, Math.min(y, h - BALL - bottom));
}

export default function IosAssistiveTouch({
  onHome,
  onBack,
  onAppSwitcher,
  onControlCenter,
  onSiri,
  onNotifications,
  onSettings,
  inApp = false,
}) {
  const ballRef = useRef(null);
  const menuRef = useRef(null);
  const [side, setSide] = useState(() => localStorage.getItem("at_side") || "right");
  const [y, setY] = useState(() => Number(localStorage.getItem("at_y")) || clampY(window.innerHeight * 0.42));
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenu, setSubmenu] = useState(false);
  const [engaged, setEngaged] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [pressing, setPressing] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("at_side", side);
    localStorage.setItem("at_y", String(y));
  }, [side, y]);

  useEffect(() => {
    if (!engaged || menuOpen) return;
    const t = window.setTimeout(() => setEngaged(false), IDLE_MS);
    return () => window.clearTimeout(t);
  }, [engaged, menuOpen, y, side]);

  useEffect(() => {
    if (!menuOpen) {
      setSubmenu(false);
      return;
    }
    const onDoc = (e) => {
      const t = e.target;
      if (ballRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [menuOpen]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSubmenu(false);
  }, []);

  const run = useCallback(
    (id) => {
      closeMenu();
      if (id === "more") return;
      if (id === "home") onHome();
      if (id === "back") onBack();
      if (id === "switcher") onAppSwitcher();
      if (id === "control") onControlCenter();
      if (id === "siri") onSiri();
      if (id === "notifications") onNotifications?.();
      if (id === "settings") onSettings();
      if (id === "rotate") {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    },
    [closeMenu, onAppSwitcher, onBack, onControlCenter, onHome, onNotifications, onSettings, onSiri],
  );

  const menuItems = submenu ? MORE_MENU.filter((item) => item.id !== "back" || inApp) : MAIN_MENU;

  const menuSideClass =
    side === "left" ? "ios-assistive-menu--left" : "ios-assistive-menu--right";

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="ios-assistive-backdrop fixed inset-0 z-[79]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <motion.button
        ref={ballRef}
        type="button"
        data-testid="ios-assistive-touch"
        aria-label="AssistiveTouch"
        aria-expanded={menuOpen}
        className={`ios-assistive-ball touch-none ${side === "left" ? "ios-assistive-ball-left" : "ios-assistive-ball-right"}`}
        style={{ top: y, width: BALL, height: BALL }}
        animate={{
          opacity: engaged || menuOpen || dragging ? 1 : 0.38,
          scale: pressing ? 0.92 : menuOpen ? 1.06 : engaged ? 1.02 : 1,
        }}
        transition={{ type: "spring", stiffness: 520, damping: 28 }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setEngaged(true);
          setPressing(true);
          dragRef.current = { sx: e.clientX, sy: e.clientY, oy: y, moved: false, t: Date.now() };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          const dx = e.clientX - d.sx;
          const dy = e.clientY - d.sy;
          if (!d.moved && Math.hypot(dx, dy) > DRAG) {
            d.moved = true;
            setDragging(true);
            setMenuOpen(false);
          }
          if (d.moved) setY(clampY(d.oy + dy));
        }}
        onPointerUp={(e) => {
          setPressing(false);
          const d = dragRef.current;
          dragRef.current = null;
          if (!d) return;
          if (d.moved) {
            setDragging(false);
            setSide(e.clientX < window.innerWidth / 2 ? "left" : "right");
            return;
          }
          if (Date.now() - d.t <= TAP_MS) setMenuOpen((o) => !o);
        }}
        onPointerCancel={() => {
          dragRef.current = null;
          setDragging(false);
          setPressing(false);
        }}
        onMouseEnter={() => setEngaged(true)}
      >
        <span className="ios-assistive-ball-ring" aria-hidden />
        <span className="ios-assistive-ball-core" aria-hidden />
        <span className="sr-only">AssistiveTouch</span>
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            data-testid="ios-assistive-menu"
            role="menu"
            aria-label="AssistiveTouch menu"
            className={`ios-assistive-menu ${menuSideClass}`}
            style={{ top: clampY(y - 8) }}
            initial={{ opacity: 0, scale: 0.82, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 6 }}
            transition={{ type: "spring", stiffness: 480, damping: 32 }}
          >
            {submenu && (
              <button
                type="button"
                className="ios-assistive-menu-back"
                onClick={() => setSubmenu(false)}
                aria-label="Back to main menu"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
            )}
            <div className="ios-assistive-menu-grid">
              {menuItems.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  data-testid={`ios-assistive-${id}`}
                  className="ios-assistive-menu-cell"
                  onClick={() => {
                    if (id === "more") {
                      setSubmenu(true);
                      return;
                    }
                    run(id);
                  }}
                >
                  <span className="ios-assistive-menu-icon">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  <span className="ios-assistive-menu-label">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
