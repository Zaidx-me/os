import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiExternalLink } from "react-icons/fi";
import { useAppStore } from "../store/Appstore.js";
import {
  clearExternalLinkPromptHandler,
  setExternalLinkPromptHandler,
} from "../zaidos/lib/openBrowser.js";

function displayHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function ExternalLinkPrompt() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    setExternalLinkPromptHandler((url) =>
      new Promise((resolve) => {
        setRequest({ url, resolve });
      }),
    );

    return () => clearExternalLinkPromptHandler();
  }, []);

  const close = (confirmed) => {
    if (!request) return;
    request.resolve(confirmed);
    setRequest(null);
  };

  const host = request ? displayHost(request.url) : "";

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => close(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="external-link-prompt-title"
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl ${
              isDarkMode ? "border-white/10 bg-[#2c2c2e] text-white" : "border-black/10 bg-white text-gray-900"
            }`}
          >
            <div className="px-5 pt-5 pb-4 text-center">
              <div
                className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full ${
                  isDarkMode ? "bg-[#007AFF]/20 text-[#007AFF]" : "bg-[#007AFF]/10 text-[#007AFF]"
                }`}
              >
                <FiExternalLink size={20} />
              </div>
              <h2 id="external-link-prompt-title" className="text-[15px] font-semibold">
                Leave ZaidOS?
              </h2>
              <p className={`mt-2 text-[13px] leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <span className="font-medium">{host}</span> can&apos;t be opened inside the browser here. Open it in an
                external tab instead?
              </p>
            </div>

            <div
              className={`flex gap-2 border-t px-4 py-3 ${
                isDarkMode ? "border-white/10 bg-[#1c1c1e]/60" : "border-black/5 bg-gray-50/80"
              }`}
            >
              <button
                type="button"
                onClick={() => close(false)}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition ${
                  isDarkMode
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-white text-gray-800 ring-1 ring-black/10 hover:bg-gray-50"
                }`}
              >
                Stay in ZaidOS
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="flex-1 rounded-xl bg-[#007AFF] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#0066d6]"
              >
                Open externally
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
