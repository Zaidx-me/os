import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { articles, experience, projects, site, skillGroups, socials } from "../content/index.ts";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { useAppStore } from "../../store/Appstore.js";
import TextEdit from "../../app/TextEdit.jsx";
import Finder from "../../app/Finder.jsx";
import Safari from "../../app/Safari.jsx";
import Spotify from "../../app/Spotify.jsx";
import Settings from "../../app/Settings.jsx";
import MacGallery from "../../app/Gallary.jsx";
import Launchpad from "../../app/Launchpad.jsx";
import Trash from "../../app/Trash.jsx";
import Messages from "../../app/Messages.jsx";
import Mail from "../../app/Mail.jsx";
import Maps from "../../app/Maps.jsx";
import FaceTime from "../../app/FaceTime.jsx";
import Phone from "../../app/Phone.jsx";
import Calendar from "../../app/Calendar.jsx";
import Contacts from "../../app/Contacts.jsx";
import Blogs from "../../app/Blogs/BlogsSection.jsx";
import Reminders from "../../app/Reminders.jsx";
import AboutApp from "./About.jsx";
import ProjectsApp from "./Projects.jsx";
import ArticlesApp from "./Articles.jsx";
import ExperienceApp from "./Experience.jsx";
import ResumeApp from "./Resume.jsx";
import ChessApp from "./Chess.jsx";
import SkillsApp from "./Skills.jsx";
import ChatApp from "./Chat.jsx";
import ContactApp from "./Contact.jsx";
import { openBrowser } from "../lib/openBrowser.js";
import { createShell } from "../lib/shell/shell.js";
import { matchChat } from "../lib/kb.js";

const ANSI_RE = /\x1b\[[0-9;]*m/g;

function stripAnsi(text) {
  return text.replace(ANSI_RE, "");
}

function renderLine(text) {
  if (text === "\x1b[2J") return { kind: "clear" };
  return { kind: "out", text: stripAnsi(text) };
}

const DESKTOP_APPS = {
  Finder: () => <Finder />,
  Launchpad: () => <Launchpad />,
  Safari: () => <Safari />,
  Messages: () => <Messages />,
  Mail: () => <Mail />,
  Maps: () => <Maps />,
  Photos: () => <MacGallery />,
  FaceTime: () => <FaceTime />,
  Phone: () => <Phone />,
  Calendar: () => <Calendar />,
  Contacts: () => <Contacts />,
  Notes: () => <Blogs />,
  Reminders: () => <Reminders />,
  Music: () => <Spotify />,
  Settings: () => <Settings />,
  Trash: () => <Trash />,
  TextEdit: () => <TextEdit file={{ id: "new", name: "untitled.txt", content: "" }} />,
  About: () => <AboutApp />,
  Projects: () => <ProjectsApp />,
  Articles: () => <ArticlesApp />,
  Experience: () => <ExperienceApp />,
  Resume: () => <ResumeApp />,
  Chess: () => <ChessApp />,
  Skills: () => <SkillsApp />,
  ZaidGPT: () => <ChatApp />,
  Contact: () => <ContactApp />,
};

export default function TerminalApp({ windowId = null, onClose = null }) {
  const isMobile = useIsMobile();
  const openApp = useAppStore((s) => s.openApp);
  const closeApp = useAppStore((s) => s.closeApp);
  const shell = useMemo(() => createShell(), []);

  const [lines, setLines] = useState([
    { kind: "out", text: "ZaidOS Terminal — zsh 5.9 (simulated)" },
    { kind: "out", text: "Type 'help' for commands. Try: ls, cd ~/Projects, cat README.md, neofetch" },
  ]);
  const [input, setInput] = useState("");
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const prompt = `${site.handle}@zaidos ${shell.fs.promptPath()} % `;

  const launchApp = useCallback(
    (appId) => {
      if (isMobile) {
        window.dispatchEvent(new CustomEvent("zaidos:open-app", { detail: { appId } }));
        return;
      }
      const factory = DESKTOP_APPS[appId];
      if (factory) openApp(appId, factory());
    },
    [isMobile, openApp],
  );

  const openEditor = useCallback(
    (path) => {
      let file = { id: `edit_${Date.now()}`, name: "untitled.txt", content: "" };
      if (path) {
        const res = shell.fs.cat(path);
        if (res.ok) {
          const name = path.split("/").pop() || "untitled.txt";
          file = { id: `edit_${Date.now()}`, name, content: res.lines.join("\n") };
        }
      }
      if (isMobile) {
        window.dispatchEvent(
          new CustomEvent("zaidos:open-editor", { detail: { file } }),
        );
        return;
      }
      openApp("TextEdit", <TextEdit file={file} />);
    },
    [isMobile, openApp, shell.fs],
  );

  const shellCtx = useMemo(
    () => ({
      data: { site, projects, skillGroups, experience, socials, articles },
      openApp: launchApp,
      openEditor,
      browse: (url) => openBrowser(url),
      close: () => {
        if (onClose) onClose();
        else if (windowId) closeApp(windowId);
      },
      wallpaper: () => {},
      launcher: () => launchApp("Launchpad"),
    }),
    [closeApp, launchApp, onClose, openEditor, windowId],
  );

  const run = useCallback(
    (cmdLine) => {
      const trimmed = cmdLine.trim();
      if (!trimmed) return;

      setLines((prev) => [...prev, { kind: "cmd", text: prompt + trimmed }]);

      const out = shell.run(trimmed, shellCtx);
      if (out.length === 0) return;

      const rendered = out.map(renderLine);
      if (rendered.some((l) => l.kind === "clear")) {
        setLines([]);
        return;
      }

      setLines((prev) => [...prev, ...rendered.filter((l) => l.kind === "out")]);

      if (
        out.length === 1 &&
        out[0]?.startsWith("zsh: command not found:")
      ) {
        const chat = matchChat(trimmed);
        if (chat.response && !chat.response.includes("not sure")) {
          setLines((prev) => [...prev, { kind: "out", text: chat.response }]);
        }
      }
    },
    [prompt, shell, shellCtx],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  useEffect(() => {
    const onPrompt = () => inputRef.current?.focus();
    window.addEventListener("zaidos:terminal-focus", onPrompt);
    return () => window.removeEventListener("zaidos:terminal-focus", onPrompt);
  }, []);

  const handleTab = () => {
    const candidates = shell.complete(input);
    if (candidates.length === 1) {
      setInput(candidates[0] + " ");
    } else if (candidates.length > 1) {
      setLines((prev) => [...prev, { kind: "out", text: candidates.join("  ") }]);
    }
  };

  return (
    <div
      className="mobile-app-scroll h-full flex flex-col bg-[#0d0d0d] text-[#39FF14] font-mono text-sm cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {lines.map((line, i) => (
          <div
            key={i}
            className={line.kind === "cmd" ? "text-white whitespace-pre-wrap" : "text-gray-300 whitespace-pre-wrap"}
          >
            {line.text}
          </div>
        ))}
        <div className="flex items-center text-white">
          <span className="shrink-0">{prompt}</span>
          <input
            ref={inputRef}
            data-testid="terminal-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setHistoryIdx(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                run(input);
                setInput("");
                setHistoryIdx(-1);
              } else if (e.key === "Tab") {
                e.preventDefault();
                handleTab();
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (shell.history.length === 0) return;
                const next =
                  historyIdx === -1
                    ? shell.history.length - 1
                    : Math.max(0, historyIdx - 1);
                setHistoryIdx(next);
                setInput(shell.history[next] ?? "");
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (historyIdx === -1) return;
                const next = historyIdx + 1;
                if (next >= shell.history.length) {
                  setHistoryIdx(-1);
                  setInput("");
                } else {
                  setHistoryIdx(next);
                  setInput(shell.history[next] ?? "");
                }
              }
            }}
            className="flex-1 min-w-0 bg-transparent outline-none border-0 text-white caret-[#39FF14]"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
}
