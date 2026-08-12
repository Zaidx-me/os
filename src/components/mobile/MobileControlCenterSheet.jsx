import { motion } from "framer-motion";
import {
  FiBluetooth,
  FiMoon,
  FiRotateCw,
  FiSun,
  FiWifi,
  FiZap,
} from "react-icons/fi";
import { useAppStore } from "../../store/Appstore.js";

function CcTile({ active, onClick, icon, label, sublabel, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ios-cc-tile ${active ? "ios-cc-tile--on" : ""} ${className}`}
    >
      <span className="ios-cc-tile-icon">{icon}</span>
      <span className="ios-cc-tile-label">{label}</span>
      {sublabel ? <span className="ios-cc-tile-sub">{sublabel}</span> : null}
    </button>
  );
}

export default function MobileControlCenterSheet({ onClose }) {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const isAudioPlaying = useAppStore((s) => s.isAudioPlaying);
  const toggleAudio = useAppStore((s) => s.toggleAudio);
  const currentTrack = useAppStore((s) => s.currentTrack);

  return (
    <>
      <motion.div
        className="ios-cc-backdrop fixed inset-0 z-[85] bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        data-testid="mobile-control-center"
        className="ios-cc-sheet fixed inset-x-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[86] max-h-[min(78dvh,520px)] overflow-y-auto overscroll-contain rounded-[28px] p-3 pb-4"
        initial={{ opacity: 0, y: -28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 80 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y < -48 || info.velocity.y < -500) onClose();
        }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 dark:bg-white/25" aria-hidden />

        <div className="grid grid-cols-2 gap-2.5">
          <div className="ios-cc-module col-span-1 grid grid-cols-2 gap-2 p-2">
            <CcTile active icon={<FiWifi size={20} />} label="Wi‑Fi" sublabel="ZaidOS" />
            <CcTile active icon={<FiBluetooth size={20} />} label="Bluetooth" sublabel="On" />
            <CcTile icon={<FiZap size={20} />} label="AirDrop" sublabel="Contacts" />
            <CcTile icon={<FiRotateCw size={20} />} label="AirPlay" />
          </div>

          <div className="ios-cc-module col-span-1 flex flex-col gap-2 p-3">
            <CcTile
              active={isDarkMode}
              onClick={toggleDarkMode}
              icon={isDarkMode ? <FiMoon size={22} /> : <FiSun size={22} />}
              label={isDarkMode ? "Dark Mode" : "Light Mode"}
              sublabel="Appearance"
              className="min-h-[5.5rem] flex-1"
            />
          </div>
        </div>

        <div className="ios-cc-module mt-2.5 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Now Playing</p>
            <button
              type="button"
              onClick={toggleAudio}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                isAudioPlaying
                  ? "bg-blue-600 text-white"
                  : "bg-black/10 text-gray-700 dark:bg-white/10 dark:text-gray-200"
              }`}
            >
              {isAudioPlaying ? "Pause" : "Play"}
            </button>
          </div>
          <p className="truncate text-[15px] font-medium text-gray-900 dark:text-white">
            {currentTrack?.title ?? "No track selected"}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {currentTrack?.artist ?? "Open Music to pick a song"}
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div className="h-full w-1/3 rounded-full bg-white/80 dark:bg-white/50" />
          </div>
        </div>

        <div className="ios-cc-module mt-2.5 grid grid-cols-4 gap-2 p-2">
          {["Flashlight", "Timer", "Calc", "Camera"].map((label) => (
            <button key={label} type="button" className="ios-cc-quick-btn">
              <span className="ios-cc-quick-icon">{label.slice(0, 1)}</span>
              <span className="ios-cc-quick-label">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
