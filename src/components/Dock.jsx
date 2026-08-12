import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store/Appstore.js";
import Safari from "../app/Safari.jsx";
import Spotify from "../app/Spotify";
import Settings from "../app/Settings";
import MacGallery from "../app/Gallary";
import AboutApp from "../zaidos/apps/About.jsx";
import ProjectsApp from "../zaidos/apps/Projects.jsx";
import ContactApp from "../zaidos/apps/Contact.jsx";
import ArticlesApp from "../zaidos/apps/Articles.jsx";
import TerminalApp from "../zaidos/apps/Terminal.jsx";
import ChatApp from "../zaidos/apps/Chat.jsx";
import SkillsApp from "../zaidos/apps/Skills.jsx";
import ExperienceApp from "../zaidos/apps/Experience.jsx";
import ResumeApp from "../zaidos/apps/Resume.jsx";
import ChessApp from "../zaidos/apps/Chess.jsx";
import Finder from "../app/Finder";
import Trash from "../app/Trash";
import Launchpad from "../app/Launchpad";

import { GlassSurface } from "./ui/glass-surface";

import { APP_ICON } from "../zaidos/lib/assets.js";
import { getAppIcon } from "../zaidos/lib/appIcons.js";

const getWindowTitle = (win) => {
  if (win.appId === "TextEdit") {
    return win.component?.props?.file?.name || "untitled.txt";
  }
  if (win.appId === "PDFViewer") {
    return win.component?.props?.file?.name || "document.pdf";
  }
  if (win.appId === "Finder") {
    const path = win.component?.props?.initialPath || "/icloud";
    const segment = path.split("/").pop();
    return `Finder (${segment || "Home"})`;
  }
  return win.appId;
};

const getWindowIcon = (win, apps) => {
  const fromRegistry = getAppIcon(win.appId);
  if (fromRegistry) return fromRegistry;
  const dockApp = apps?.find((a) => a.id === win.appId);
  return dockApp?.icon || APP_ICON("files");
};

export default function Dock() {
  const openApp = useAppStore((s) => s.openApp);
  const windows = useAppStore((s) => s.windows);
  const restoreApp = useAppStore((s) => s.restoreApp);
  const focusApp = useAppStore((s) => s.focusApp);
  const closeApp = useAppStore((s) => s.closeApp);
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const [hoveredApp, setHoveredApp] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [bouncingAppId, setBouncingAppId] = useState(null);

  const leaveTimeoutRef = useRef(null);

  const [hasTrashedItems, setHasTrashedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("os_trash");
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleTrashUpdated = (e) => {
      setHasTrashedItems(e.detail.hasFiles);
    };
    
    // Also listen to Finder deleting file directly (as back up / instant refresh)
    const handleFileTrashed = () => {
      setHasTrashedItems(true);
    };

    window.addEventListener("os_trash_updated", handleTrashUpdated);
    window.addEventListener("os_file_trash", handleFileTrashed);
    return () => {
      window.removeEventListener("os_trash_updated", handleTrashUpdated);
      window.removeEventListener("os_file_trash", handleFileTrashed);
    };
  }, []);

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredApp(null);
      setHoveredIndex(null);
    }, 250);
  };

  const handleMouseEnterIcon = (app, index) => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    setHoveredApp(app);
    setHoveredIndex(index);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const apps = [
    { id: "Finder", label: "Finder", icon: getAppIcon("Finder"), comp: <Finder /> },
    { id: "Launchpad", label: "Launchpad", icon: getAppIcon("Launchpad"), comp: <Launchpad /> },
    { id: "Safari", label: "Safari", icon: getAppIcon("Safari"), comp: <Safari /> },
    { id: "Terminal", label: "Terminal", icon: getAppIcon("Terminal"), comp: <TerminalApp /> },
    { id: "About", label: "About", icon: getAppIcon("About"), comp: <AboutApp /> },
    { id: "Projects", label: "Projects", icon: getAppIcon("Projects"), comp: <ProjectsApp /> },
    { id: "Articles", label: "Articles", icon: getAppIcon("Articles"), comp: <ArticlesApp /> },
    { id: "Experience", label: "Experience", icon: getAppIcon("Experience"), comp: <ExperienceApp /> },
    { id: "Resume", label: "Resume", icon: getAppIcon("Resume"), comp: <ResumeApp /> },
    { id: "Chess", label: "Chess", icon: getAppIcon("Chess"), comp: <ChessApp /> },
    { id: "Skills", label: "Skills", icon: getAppIcon("Skills"), comp: <SkillsApp /> },
    { id: "ZaidGPT", label: "ZaidGPT", icon: getAppIcon("ZaidGPT"), comp: <ChatApp /> },
    { id: "Photos", label: "Photos", icon: getAppIcon("Photos"), comp: <MacGallery /> },
    { id: "Contact", label: "Contact", icon: getAppIcon("Contact"), comp: <ContactApp /> },
    { id: "Music", label: "Music", icon: getAppIcon("Music"), comp: <Spotify /> },
    { id: "Settings", label: "Settings", icon: getAppIcon("Settings"), comp: <Settings /> },
    { divider: true },
    { id: "Github", label: "GitHub", icon: getAppIcon("Github"), url: "https://github.com/zaidx-me" },
    { id: "linkedin", label: "LinkedIn", icon: getAppIcon("linkedin"), url: "https://linkedin.com/in/zaidx-me" },
    { divider: true },
    { id: "Trash", label: "Trash", icon: getAppIcon("Trash"), comp: <Trash /> },
  ];

  // Check if an app is currently open
  const isAppOpen = (appId) => {
    if (appId === "Finder") {
      return windows.some((w) => w.appId === "Finder" || w.appId === "TextEdit" || w.appId === "PDFViewer");
    }
    return windows.some((w) => w.appId === appId);
  };
  
  // Check if an app is minimized
  const isAppMinimized = (appId) => windows.some((w) => w.appId === appId && w.minimized);

  // Calculate icon size based on distance from hovered icon (macOS magnification effect)
  const getIconScale = (index) => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 1.15;
    if (distance === 1) return 1.08;
    if (distance === 2) return 1.03;
    return 1;
  };

  const handleAppClick = (app) => {
    setBouncingAppId(app.id);

    setTimeout(() => {
      if (app.url) {
        window.open(app.url, "_blank");
      } else if (app.action) {
        app.action();
      } else {
        // Check if app is already open
        const existingWindow = windows.find((w) => w.appId === app.id);
        if (existingWindow) {
          if (existingWindow.minimized) {
            // Restore minimized app
            restoreApp(existingWindow.id);
          } else {
            // Focus existing app
            focusApp(existingWindow.id);
          }
        } else {
          // Open new app
          openApp(app.id, app.comp);
        }
      }
      setBouncingAppId(null);
    }, 200);
  };

  return (
    <div
      className="mac-dock mac-dock-host absolute bottom-1 left-1/2 -translate-x-1/2 flex items-end px-1 py-1 rounded-2xl h-[56px] overflow-visible transition-all duration-300 z-[99999]"
      onMouseLeave={handleMouseLeave}
    >
      <GlassSurface
        tint={isDarkMode ? 0.05 : 0.02}
        radius={16}
        blur={20}
        chroma={0.1}
        specular={false}
        className="absolute inset-0 -z-10"
      />
      {apps.map((app, index) => {
        if (app.divider)
          return (
            <div
              key={index}
              className="w-px bg-white/20 rounded-full mx-0.5 self-stretch my-1"
            />
          );

        const scale = getIconScale(index);
        const baseSize = 48; // Base icon size in pixels
        const iconSize = baseSize * scale;
        const appWindows = windows.filter((w) => {
          if (app.id === "Finder") {
            return w.appId === "Finder" || w.appId === "TextEdit" || w.appId === "PDFViewer";
          }
          return w.appId === app.id;
        });
        const hasWindows = appWindows.length > 0;

        return (
          <div
            key={app.id}
            onMouseEnter={() => handleMouseEnterIcon(app, index)}
            onClick={() => handleAppClick(app)}
            className={`
              relative
              flex flex-col items-center justify-end
              cursor-pointer
              ${bouncingAppId === app.id ? "animate-bounceOnce" : ""}
            `}
            style={{
              transformOrigin: "bottom center",
              marginBottom: hoveredIndex !== null ? `${(scale - 1) * 20}px` : "0px",
              transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            {/* Tooltip / Window Previews - positioned above each icon */}
            {hoveredApp?.id === app.id && (
              (hasWindows && app.id === "Finder") ? (
                <div
                  className="
                    absolute -top-[140px] left-1/2 -translate-x-1/2
                    flex gap-3 p-3 rounded-xl
                    bg-gray-950/90 text-white shadow-2xl
                    backdrop-blur-xl pointer-events-auto
                    animate-fadeSlide z-50
                    border border-white/10 min-w-[150px]
                  "
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => {
                    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  {appWindows.map((win) => {
                    const title = getWindowTitle(win);
                    const iconUrl = getWindowIcon(win, apps);
                    return (
                      <div
                        key={win.id}
                        onClick={() => {
                          restoreApp(win.id);
                          focusApp(win.id);
                        }}
                        className={`
                          relative group/preview flex flex-col items-center gap-1.5 p-2 rounded-lg 
                          transition duration-150 cursor-pointer min-w-[95px] max-w-[130px]
                          ${win.minimized ? "bg-white/5 opacity-75 hover:opacity-100 hover:bg-white/10" : "bg-white/10 hover:bg-white/15"}
                        `}
                      >
                        {/* Miniature window mockup */}
                        <div className="w-16 h-12 rounded bg-black/40 flex items-center justify-center relative shadow-inner border border-white/5">
                          <img src={iconUrl} alt="" className="w-8 h-8 object-contain" />
                          {win.minimized && (
                            <span className="absolute bottom-1 right-1 text-[8px] bg-yellow-500/80 text-black px-1 rounded font-semibold scale-90">min</span>
                          )}
                        </div>
                        
                        {/* Title */}
                        <span className="text-[10px] font-medium text-center truncate w-full text-gray-300 group-hover/preview:text-white px-0.5">
                          {title}
                        </span>

                        {/* Close button on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeApp(win.id);
                          }}
                          className="
                            absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/90 text-white 
                            flex items-center justify-center text-[10px] font-bold shadow-md opacity-0 
                            group-hover/preview:opacity-100 transition-opacity hover:bg-red-600
                          "
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-gray-955/90 rotate-45 border-r border-b border-white/10" />
                </div>
              ) : (
                <div
                  className="
                    absolute -top-9
                    px-3 py-1 rounded-md
                    bg-gray-900/95 text-white shadow-xl
                    text-xs font-medium backdrop-blur-xl
                    animate-fadeSlide pointer-events-none
                    whitespace-nowrap z-50
                    border border-white/10
                  "
                >
                  {app.label}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-gray-900/95 rotate-45 border-r border-b border-white/10" />
                </div>
              )
            )}
            
            <div
              className="mac-dock-icon-wrap rounded-xl flex items-center justify-center overflow-hidden bg-white/10"
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <img
                src={app.icon}
                alt={app.label}
                className="mac-dock-icon h-[88%] w-[88%] object-contain"
                draggable={false}
              />
            </div>
            
            {/* Dot indicator for open apps */}
            {isAppOpen(app.id) && (
              <div 
                className="absolute -bottom-0.5 w-1 h-1 bg-white/90 rounded-full"
                style={{
                  boxShadow: "0 0 4px rgba(255,255,255,0.6)"
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
