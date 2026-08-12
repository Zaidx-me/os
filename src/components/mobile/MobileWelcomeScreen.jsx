import { motion } from "framer-motion";

export default function MobileWelcomeScreen({ onContinue }) {
  return (
    <motion.div
      data-testid="mobile-welcome"
      className="mobile-welcome fixed inset-0 z-[9995] flex flex-col items-center justify-end bg-black/55 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="mobile-welcome-card w-full max-w-sm rounded-[28px] border border-white/15 bg-[#1c1c1e]/95 p-6 text-center shadow-2xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: "spring", stiffness: 380, damping: 32 }}
      >
        <img
          src="/icons/Hello16MacBookProBlk.png"
          alt=""
          className="mx-auto mb-4 h-16 w-16 rounded-[18px] object-contain shadow-lg"
        />
        <h1 className="text-[22px] font-semibold tracking-tight text-white">Welcome to ZaidOS</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-white/70">
          A portfolio that boots like an operating system. Swipe between home pages, tap any app, and explore.
        </p>
        <button
          type="button"
          data-testid="mobile-welcome-continue"
          onClick={onContinue}
          className="mt-6 w-full rounded-2xl bg-blue-500 py-3.5 text-[16px] font-semibold text-white active:scale-[0.98] transition-transform"
        >
          Get Started
        </button>
      </motion.div>
    </motion.div>
  );
}
