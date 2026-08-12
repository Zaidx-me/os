import React, { useState } from "react";
import { useAppStore } from "../store/Appstore";
import { useIsMobile } from "../hooks/useIsMobile.js";
import {
  mailInbox,
  ownerDisplayName,
  defaultMemoji,
} from "../zaidos/content/systemContacts.ts";
import { 
  Inbox, Send, FileText, Ban, Trash2, Archive, Folder, RotateCcw, 
  Filter, MoreHorizontal, User, ShoppingCart, MessageSquare, Megaphone,
  SquarePen, Reply, ReplyAll, Forward, FolderInput, Flag, Search, Sparkles,
  Paperclip, CornerUpLeft, MapPin, ChevronRight, X, ChevronLeft
} from "lucide-react";

// Traffic lights component inside Mail Sidebar
const TrafficLights = ({ windowId }) => {
  const close = useAppStore((s) => s.closeApp);
  const minimize = useAppStore((s) => s.minimizeApp);
  const toggleMaximize = useAppStore((s) => s.toggleMaximize);
  const windows = useAppStore((s) => s.windows);
  const win = windows.find(w => w.id === windowId);
  const maximized = win ? win.maximized : false;

  return (
    <div className="flex items-center gap-2 group mr-4 shrink-0">
      <div
        className="w-3 h-3 bg-[#ff5f57] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#ff4136] transition-all duration-150 shadow-sm"
        onClick={() => close(windowId)}
        title="Close"
      >
        <svg className="w-1.5 h-1.5 text-[#820005] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 10">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div
        className="w-3 h-3 bg-[#febc2e] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#ff9500] transition-all duration-150 shadow-sm"
        onClick={() => minimize(windowId)}
        title="Minimize"
      >
        <svg className="w-1.5 h-1.5 text-[#9a6400] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 10">
          <path d="M1 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div
        className="w-3 h-3 bg-[#28c840] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#1aab29] transition-all duration-150 shadow-sm"
        onClick={() => toggleMaximize(windowId)}
        title={maximized ? "Restore" : "Maximize"}
      >
        <svg className="w-1.5 h-1.5 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 10">
          {maximized ? (
            <>
              <rect x="1.5" y="3.5" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3.5 3.5V1.5H8.5V6.5H6.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            </>
          ) : (
            <>
              <path d="M1 1L4 4M1 1V3.5M1 1H3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M9 9L6 6M9 9V6.5M9 9H6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

export default function Mail({ windowId }) {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const isMobile = useIsMobile();
  const [selectedMailbox, setSelectedMailbox] = useState("inbox");
  const [activeCategory, setActiveCategory] = useState("primary");
  const [selectedEmailId, setSelectedEmailId] = useState(3);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileScreen, setMobileScreen] = useState("list");

  const mailboxCounts = { inbox: 2 };
  const emails = [...mailInbox];

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || emails[0];
  const unreadCount = emails.filter((e) => e.isUnread).length;

  const openEmail = (id) => {
    setSelectedEmailId(id);
    if (isMobile) setMobileScreen("detail");
  };

  const showList = !isMobile || mobileScreen === "list";
  const showDetail = !isMobile || mobileScreen === "detail";

  return (
    <div 
      className={`mail-container flex h-full w-full select-none font-sans ${
        isMobile ? "text-[15px] rounded-none" : "text-[13px] rounded-xl"
      } overflow-hidden ${
        isDarkMode ? "bg-[#1E1E1E] text-white" : "bg-[#F6F6F6] text-gray-800"
      }`}
    >
      
      {/* 1. Left Sidebar (Mailboxes) — desktop only */}
      {!isMobile && isSidebarOpen && (
        <aside className={`w-[200px] flex flex-col shrink-0 border-r rounded-xl overflow-hidden ${
          isDarkMode ? "border-white/10 bg-[#1E1E1E] text-white" : "border-[#E5E5E5] bg-[#F6F6F6] text-black"
        } transition-all duration-300`}>
          
          {/* Header */}
          <div className="window-drag-handle h-11 flex items-center px-4 shrink-0 justify-between">
            <TrafficLights windowId={windowId} />
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className={`p-1 rounded transition ${isDarkMode ? "hover:bg-white/5 text-gray-300" : "hover:bg-black/5 text-gray-600"}`}
              title="Hide Sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="currentcolor">
                <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="5.5" y1="1.5" x2="5.5" y2="14.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
          </div>

          {/* Mailbox Groups */}
          <div className="flex-1 overflow-y-auto hide-scrollbar px-2 py-2 space-y-4">
            {/* Favorites */}
            <div>
              <div className="px-2 py-1 text-[10.5px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Favorites</div>
              <div className="space-y-0.5 mt-1">
                <div 
                  onClick={() => setSelectedMailbox("inbox")}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                    selectedMailbox === "inbox" 
                      ? "bg-black/[0.08] dark:bg-white/[0.08] font-medium" 
                      : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Inbox size={15} className="text-blue-500" />
                    <span>Inbox</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">35</span>
                </div>
                <div 
                  onClick={() => setSelectedMailbox("sent")}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                    selectedMailbox === "sent" 
                      ? "bg-black/[0.08] dark:bg-white/[0.08] font-medium" 
                      : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <Send size={15} className="text-gray-400" />
                  <span>Sent</span>
                </div>
              </div>
            </div>

            {/* Smart Mailboxes */}
            <div>
              <div className="px-2 py-1 text-[10.5px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Smart Mailboxes</div>
            </div>

            {/* iCloud Mailboxes */}
            <div>
              <div className="px-2 py-1 text-[10.5px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">iCloud</div>
              <div className="space-y-0.5 mt-1 text-[12px]">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
                  <div className="flex items-center gap-2">
                    <Inbox size={14} className="text-gray-400" />
                    <span>Inbox</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">35</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
                  <FileText size={14} className="text-gray-400" />
                  <span>Drafts</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
                  <Send size={14} className="text-gray-400" />
                  <span>Sent</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
                  <Ban size={14} className="text-gray-400" />
                  <span>Junk</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
                  <Trash2 size={14} className="text-gray-400" />
                  <span>Trash</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
                  <Archive size={14} className="text-gray-400" />
                  <span>Archive</span>
                </div>
                {/* Custom tags */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
                  <Folder size={14} className="text-gray-400" />
                  <span>Pets</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
                  <Folder size={14} className="text-gray-400" />
                  <span>School</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition">
                  <Folder size={14} className="text-gray-400" />
                  <span>Work</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Link */}
          <div className="p-3 border-t border-black/5 dark:border-white/5 shrink-0 flex items-center justify-center">
            <button className="flex items-center gap-1.5 text-[11px] text-[#007AFF] hover:underline">
              <RotateCcw size={12} />
              <span>Undo Send</span>
            </button>
          </div>
        </aside>
      )}

      {/* 2. Middle Pane (Message List) */}
      {showList && (
      <section className={`flex flex-col shrink-0 overflow-hidden ${
        isMobile
          ? "flex-1 w-full min-w-0 border-0"
          : `w-[280px] border-r rounded-xl ${isDarkMode ? "border-white/10 bg-[#1E1E1E]" : "border-[#E5E5E5] bg-white"}`
      }`}>
        
        {/* Header toolbar */}
        {isMobile ? (
          <div className={`shrink-0 border-b ${isDarkMode ? "border-white/10 bg-[#1E1E1E]" : "border-black/[0.06] bg-[#F6F6F6]"}`}>
            <div className="flex items-end justify-between px-4 pt-3 pb-2">
              <div>
                <h1 className="text-[34px] font-bold leading-none tracking-tight text-gray-900 dark:text-white">
                  Inbox
                </h1>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
              <button
                type="button"
                className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#007AFF] text-white shadow-sm active:scale-95 transition-transform"
                title="New Message"
              >
                <SquarePen size={18} />
              </button>
            </div>
          </div>
        ) : (
        <div className="window-drag-handle h-14 flex items-center px-4 shrink-0 justify-between border-b border-black/[0.04] dark:border-white/[0.04]">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-1 rounded transition mr-2 ${isDarkMode ? "hover:bg-white/5 text-gray-300" : "hover:bg-black/5 text-gray-600"}`}
              title="Show Sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="currentcolor">
                <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="5.5" y1="1.5" x2="5.5" y2="14.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
            <div className="font-bold text-[17px] leading-tight truncate text-gray-900 dark:text-white">Inbox</div>
            <span className="text-[10px] text-gray-400 leading-none mt-0.5">Primary • {emails.length} messages</span>
          </div>
          <div className="flex items-center gap-1">
            <button className={`p-1.5 rounded-lg transition ${isDarkMode ? "hover:bg-white/5 text-gray-300" : "hover:bg-black/5 text-gray-600"}`}>
              <Filter size={14} />
            </button>
            <button className={`p-1.5 rounded-lg transition ${isDarkMode ? "hover:bg-white/5 text-gray-300" : "hover:bg-black/5 text-gray-600"}`}>
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
        )}

        {/* Category Pills Bar */}
        <div className={`shrink-0 flex items-center gap-1.5 border-b overflow-x-auto hide-scrollbar ${
          isMobile ? "px-3 py-2.5" : "px-3.5 py-2 bg-black/[0.02] dark:bg-white/[0.02]"
        } ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
          <button 
            onClick={() => setActiveCategory("primary")}
            className={`flex items-center gap-1.5 px-4 h-[26px] rounded-full text-[11px] font-semibold transition ${
              activeCategory === "primary"
                ? "bg-[#007AFF] text-white shadow-xs"
                : "bg-black/[0.05] dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 hover:bg-black/[0.08]"
            }`}
          >
            <User size={12} />
            <span>Primary</span>
          </button>
          <button 
            onClick={() => setActiveCategory("shopping")}
            className={`w-12 h-[26px] rounded-full flex items-center justify-center transition bg-black/[0.05] dark:bg-white/[0.05] text-gray-500 dark:text-gray-300 hover:bg-black/[0.08]`}
          >
            <ShoppingCart size={13} />
          </button>
          <button 
            onClick={() => setActiveCategory("chats")}
            className={`w-12 h-[26px] rounded-full flex items-center justify-center transition bg-black/[0.05] dark:bg-white/[0.05] text-gray-500 dark:text-gray-300 hover:bg-black/[0.08]`}
          >
            <MessageSquare size={13} />
          </button>
          <button 
            onClick={() => setActiveCategory("news")}
            className={`w-12 h-[26px] rounded-full flex items-center justify-center transition bg-black/[0.05] dark:bg-white/[0.05] text-gray-500 dark:text-gray-300 hover:bg-black/[0.08]`}
          >
            <Megaphone size={13} />
          </button>
        </div>

        {/* Email feed list */}
        <div className="flex-1 overflow-y-auto notes-no-scrollbar" style={{ scrollbarWidth: "none" }}>
          {emails.map(email => {
            return (
              <div
                key={email.id}
                onClick={() => openEmail(email.id)}
                className={`cursor-pointer border-b transition-colors relative ${
                  isMobile ? "px-4 py-3.5 flex gap-3 items-start" : "px-4 py-3"
                } ${
                  isDarkMode ? "border-white/10" : "border-black/[0.08]"
                } ${
                  !isMobile && selectedEmailId === email.id
                    ? "bg-[#007AFF] text-white" 
                    : isDarkMode 
                      ? "hover:bg-white/5 bg-[#1E1E1E]" 
                      : "hover:bg-black/[0.02] bg-white"
                }`}
              >
                {isMobile && (
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-black/5 dark:border-white/10">
                    <img src={email.avatar} alt="" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-semibold truncate ${
                    isMobile ? "text-[16px]" : "font-bold text-[12.5px]"
                  } ${!isMobile && selectedEmailId === email.id ? "text-white" : ""}`}>
                    {email.sender}
                  </span>
                  <span className={`text-[13px] shrink-0 ${
                    !isMobile && selectedEmailId === email.id ? "text-white/80 font-medium" : "text-gray-400 font-normal"
                  }`}>
                    {email.date}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  {email.isReplied && (
                    <CornerUpLeft size={11} className={!isMobile && selectedEmailId === email.id ? "text-white/80" : "text-gray-400"} />
                  )}
                  <span className={`truncate ${
                    isMobile ? "text-[15px] font-normal" : "font-semibold text-[11.5px]"
                  } ${
                    !isMobile && selectedEmailId === email.id ? "text-white" : isDarkMode ? "text-white/90" : "text-gray-900"
                  }`}>
                    {email.subject}
                  </span>
                  {email.hasAttachment && (
                    <Paperclip size={11} className={`ml-auto shrink-0 ${!isMobile && selectedEmailId === email.id ? "text-white/80" : "text-gray-400"}`} />
                  )}
                  {isMobile && email.isUnread && (
                    <span className="ml-auto w-2.5 h-2.5 rounded-full bg-[#007AFF] shrink-0" />
                  )}
                </div>

                <p className={`leading-snug truncate mt-0.5 ${
                  isMobile ? "text-[14px] line-clamp-2" : "text-[11px] line-clamp-2"
                } ${
                  !isMobile && selectedEmailId === email.id ? "text-white/90" : isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  {email.excerpt}
                </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* 3. Right Pane (Email Content Viewer) */}
      {showDetail && (
      <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
        isMobile ? "w-full bg-white dark:bg-black" : "bg-white dark:bg-[#1E1E1E] rounded-xl"
      }`}>
        
        {isMobile ? (
          <header className={`shrink-0 flex items-center justify-between px-2 py-2 border-b ${
            isDarkMode ? "border-white/10 bg-[#1c1c1e]" : "border-black/[0.08] bg-[#f6f6f6]"
          }`}>
            <button
              type="button"
              onClick={() => setMobileScreen("list")}
              className="flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-[15px] font-medium text-[#007AFF] active:bg-black/5 dark:active:bg-white/10"
            >
              <ChevronLeft size={22} strokeWidth={2.25} />
              Inbox
            </button>
            <div className="flex items-center gap-1">
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-[#007AFF] active:bg-black/5 dark:active:bg-white/10" title="Archive">
                <Archive size={20} />
              </button>
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-[#007AFF] active:bg-black/5 dark:active:bg-white/10" title="Delete">
                <Trash2 size={20} />
              </button>
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-[#007AFF] active:bg-black/5 dark:active:bg-white/10" title="Reply">
                <Reply size={20} />
              </button>
            </div>
          </header>
        ) : (
        /* Navigation Toolbar — desktop */
        <header className={`window-drag-handle h-11 flex items-center justify-between px-4 shrink-0 border-b select-none ${
          isDarkMode ? "border-white/10 bg-[#2C2C2E]" : "border-[#E5E5E5] bg-[#F3F3F3]"
        }`}>
          {/* Left Compose */}
          <button className={`w-8 h-8 flex items-center justify-center rounded-full border transition ${
            isDarkMode 
              ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-gray-300" 
              : "bg-white border-black/5 hover:bg-black/[0.04] text-gray-700 shadow-xs"
          }`} title="New Message">
            <SquarePen size={14} />
          </button>

          {/* Reply controls */}
          <div className="flex items-center border border-black/5 dark:border-white/10 rounded-full overflow-hidden shadow-xs bg-white dark:bg-white/[0.04]">
            <button className={`w-8 h-7 flex items-center justify-center transition border-r border-black/5 dark:border-white/10 ${
              isDarkMode ? "hover:bg-white/[0.08] text-gray-300" : "hover:bg-black/[0.04] text-gray-700"
            }`} title="Reply">
              <Reply size={13} />
            </button>
            <button className={`w-8 h-7 flex items-center justify-center transition border-r border-black/5 dark:border-white/10 ${
              isDarkMode ? "hover:bg-white/[0.08] text-gray-300" : "hover:bg-black/[0.04] text-gray-700"
            }`} title="Reply All">
              <ReplyAll size={13} />
            </button>
            <button className={`w-8 h-7 flex items-center justify-center transition ${
              isDarkMode ? "hover:bg-white/[0.08] text-gray-300" : "hover:bg-black/[0.04] text-gray-700"
            }`} title="Forward">
              <Forward size={13} />
            </button>
          </div>

          {/* File management actions */}
          <div className="flex items-center border border-black/5 dark:border-white/10 rounded-full overflow-hidden shadow-xs bg-white dark:bg-white/[0.04]">
            <button className={`w-8 h-7 flex items-center justify-center transition border-r border-black/5 dark:border-white/10 ${
              isDarkMode ? "hover:bg-white/[0.08] text-gray-300" : "hover:bg-black/[0.04] text-gray-700"
            }`} title="Archive">
              <Archive size={13} />
            </button>
            <button className={`w-8 h-7 flex items-center justify-center transition border-r border-black/5 dark:border-white/10 ${
              isDarkMode ? "hover:bg-white/[0.08] text-gray-300" : "hover:bg-black/[0.04] text-gray-700"
            }`} title="Trash">
              <Trash2 size={13} />
            </button>
            <button className={`w-8 h-7 flex items-center justify-center transition ${
              isDarkMode ? "hover:bg-white/[0.08] text-gray-300" : "hover:bg-black/[0.04] text-gray-700"
            }`} title="Mark Junk">
              <Ban size={13} />
            </button>
          </div>

          {/* Folder dropdown */}
          <button className={`h-7 px-2.5 flex items-center gap-1 rounded-full border transition text-[11px] ${
            isDarkMode 
              ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-gray-300" 
              : "bg-white border-black/5 hover:bg-black/[0.04] text-gray-700 shadow-xs"
          }`} title="Move to Folder">
            <FolderInput size={13} />
            <span>Move</span>
          </button>

          {/* Flag button */}
          <button className={`h-7 px-2.5 flex items-center gap-1.5 rounded-full border transition text-[11px] ${
            isDarkMode 
              ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-gray-300" 
              : "bg-white border-black/5 hover:bg-black/[0.04] text-gray-700 shadow-xs"
          }`} title="Flag Email">
            <Flag size={13} className="text-orange-500 fill-orange-500" />
            <span>Flag</span>
          </button>

          {/* Search bar button */}
          <button className={`w-8 h-8 flex items-center justify-center rounded-full border transition ${
            isDarkMode 
              ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-gray-300" 
              : "bg-white border-black/5 hover:bg-black/[0.04] text-gray-700 shadow-xs"
          }`} title="Search">
            <Search size={14} />
          </button>
        </header>
        )}

        {/* Subheader summary stats — desktop only */}
        {!isMobile && (
        <div className={`px-6 py-2 border-b flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01] ${
          isDarkMode ? "border-white/5" : "border-black/[0.03]"
        }`}>
          <span className="text-[11px] text-gray-400 font-medium">1 Message</span>
          
          <button className="flex items-center gap-1 px-3 py-1 rounded-full border border-blue-500/20 text-blue-500 bg-blue-500/[0.05] hover:bg-blue-500/[0.1] transition font-medium text-[11px] shadow-xs">
            <Sparkles size={11} />
            <span>Summarize</span>
          </button>
        </div>
        )}

        {/* Email Content Frame */}
        <div className={`flex-1 overflow-y-auto notes-no-scrollbar ${
          isMobile ? "px-4 py-4 space-y-4" : "px-8 py-6 space-y-6"
        }`} style={{ scrollbarWidth: "none" }}>
          
          {/* Sender Details Header */}
          <div className={`flex items-start justify-between gap-3 ${isMobile ? "flex-col" : ""}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`rounded-full overflow-hidden bg-gray-100 shrink-0 border border-black/5 dark:border-white/10 shadow-xs ${
                isMobile ? "w-12 h-12" : "w-10 h-10 p-0.5"
              }`}>
                <img src={selectedEmail.avatar} alt={selectedEmail.sender} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h2 className={`font-bold leading-tight ${isMobile ? "text-[17px]" : "text-[14px]"}`}>{selectedEmail.sender}</h2>
                <div className={`font-semibold mt-0.5 ${isMobile ? "text-[15px]" : "text-[13px]"} text-gray-800 dark:text-gray-200`}>{selectedEmail.subject}</div>
                <div className={`text-gray-500 mt-0.5 ${isMobile ? "text-[13px]" : "text-[11.5px]"}`}>
                  <span className="font-medium">To: </span>
                  <span>{ownerDisplayName}</span>
                </div>
              </div>
            </div>
            <div className={`shrink-0 ${isMobile ? "text-left w-full pl-[3.75rem]" : "text-right"}`}>
              <span className={`text-gray-400 font-medium ${isMobile ? "text-[13px]" : "text-[11px]"}`}>{selectedEmail.date}</span>
            </div>
          </div>

          <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />

          {/* Email Body Text */}
          <div className={`leading-relaxed space-y-4 whitespace-pre-line text-gray-700 dark:text-gray-300 ${
            isMobile ? "text-[16px]" : "text-[13px]"
          }`}>
            {selectedEmail.content}
          </div>

          {/* Muir Woods Map Attachment Card (Only if email hasMap is true) */}
          {selectedEmail.hasMap && (
            <div className={`mt-6 rounded-2xl overflow-hidden border max-w-lg shadow-md ${
              isDarkMode ? "bg-[#2C2C2E] border-white/10" : "bg-[#F3F3F3] border-black/10"
            }`}>
              {/* Map image mockup */}
              <div className="h-44 relative bg-sky-200">
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800" 
                  alt="Muir Woods Map" 
                  className="w-full h-full object-cover"
                />
                {/* Simulated Location Marker Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-lg border border-white">
                    <MapPin size={16} className="text-white fill-green-600" />
                  </div>
                  <div className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md bg-white text-gray-900 border border-black/5`}>
                    Muir Woods
                  </div>
                </div>
              </div>

              {/* Map Details Section */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-[14px]">Muir Woods National Monument</h3>
                  <p className="text-[11.5px] text-gray-500 mt-0.5">National Monument</p>
                </div>

                <div className="text-[12px] text-gray-600 dark:text-gray-300 leading-snug space-y-0.5">
                  <p>1 Muir Woods Rd</p>
                  <p>Mill Valley, CA 94941</p>
                  <p>United States</p>
                </div>

                <div className="text-[12px] leading-snug">
                  <p className="text-gray-500">+1 (415) 561-2850</p>
                  <a href="https://nps.gov/muwo" target="_blank" rel="noreferrer" className="text-[#007AFF] hover:underline font-medium block mt-0.5">
                    nps.gov/muwo
                  </a>
                </div>

                <div className="pt-2">
                  <a href="#" className="text-[#007AFF] hover:underline text-[12px] font-semibold flex items-center gap-0.5">
                    <span>View on Apple Maps</span>
                    <ChevronRight size={13} className="mt-0.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Footer sending mock-up */}
          {selectedEmail.hasMap && (
            <div className="pt-8 space-y-4">
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Sending...</span>
              </div>
              <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 p-0.5">
                    <img src={defaultMemoji} alt={ownerDisplayName} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-bold text-gray-500">{ownerDisplayName}</span>
                </div>
                <span>11:09 AM</span>
              </div>
            </div>
          )}

        </div>
      </main>
      )}

    </div>
  );
}
