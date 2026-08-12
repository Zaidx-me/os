import { lazy } from "react";
import { getAppIcon, MOBILE_HIDDEN_APP_IDS } from "../lib/appIcons.js";
import { MAC_ICONS, ZAID_ICONS } from "../lib/macIcons.js";

const lazyDefault = (loader) => lazy(() => loader().then((m) => ({ default: m.default })));

/** Apps that use native macOS chrome — hide sidebars/traffic lights on mobile. */
export const MOBILE_EMBEDDED_APPS = new Set([
  "Safari", "Music", "Photos", "Settings", "Messages", "Mail", "Maps", "FaceTime",
  "Phone", "Calendar", "Contacts", "Notes", "Reminders", "Finder", "TextEdit", "PDFViewer",
]);

/** Custom Zaid-built portfolio apps. */
export const MOBILE_ZAID_APP_IDS = [
  "About",
  "Projects",
  "Articles",
  "Experience",
  "Resume",
  "Skills",
  "ZaidGPT",
  "Contact",
  "Terminal",
  "Chess",
];

/** Utilities with reliable local icon fallbacks. */
const MOBILE_UTILITY_IDS = ["TextEdit", "Terminal", "PDFViewer"];

const APP_DEFS = {
  Launchpad: { title: "Launchpad", icon: getAppIcon("Launchpad"), Component: lazyDefault(() => import("../../app/Launchpad.jsx")) },
  Finder: { title: "Finder", icon: getAppIcon("Finder"), Component: lazyDefault(() => import("../../app/Finder.jsx")) },
  Safari: { title: "Safari", icon: getAppIcon("Safari"), Component: lazyDefault(() => import("../../app/Safari.jsx")) },
  Messages: { title: "Messages", icon: getAppIcon("Messages"), Component: lazyDefault(() => import("../../app/Messages.jsx")) },
  Mail: { title: "Mail", icon: getAppIcon("Mail"), Component: lazyDefault(() => import("../../app/Mail.jsx")) },
  Maps: { title: "Maps", icon: getAppIcon("Maps"), Component: lazyDefault(() => import("../../app/Maps.jsx")) },
  Photos: { title: "Photos", icon: getAppIcon("Photos"), Component: lazyDefault(() => import("../../app/Gallary.jsx")) },
  FaceTime: { title: "FaceTime", icon: getAppIcon("FaceTime"), Component: lazyDefault(() => import("../../app/FaceTime.jsx")) },
  Phone: { title: "Phone", icon: getAppIcon("Phone"), Component: lazyDefault(() => import("../../app/Phone.jsx")) },
  Calendar: { title: "Calendar", icon: getAppIcon("Calendar"), Component: lazyDefault(() => import("../../app/Calendar.jsx")) },
  Contacts: { title: "Contacts", icon: getAppIcon("Contacts"), Component: lazyDefault(() => import("../../app/Contacts.jsx")) },
  Notes: { title: "Notes", icon: getAppIcon("Notes"), Component: lazyDefault(() => import("../../app/Blogs/BlogsSection.jsx")) },
  Reminders: { title: "Reminders", icon: getAppIcon("Reminders"), Component: lazyDefault(() => import("../../app/Reminders.jsx")) },
  Music: { title: "Music", icon: getAppIcon("Music"), Component: lazyDefault(() => import("../../app/Spotify.jsx")) },
  Settings: { title: "Settings", icon: getAppIcon("Settings"), Component: lazyDefault(() => import("../../app/Settings.jsx")) },
  Trash: { title: "Trash", icon: getAppIcon("Trash"), Component: lazyDefault(() => import("../../app/Trash.jsx")) },
  About: { title: "About", icon: ZAID_ICONS.about, Component: lazyDefault(() => import("../apps/About.jsx")) },
  Projects: { title: "Projects", icon: ZAID_ICONS.projects, Component: lazyDefault(() => import("../apps/Projects.jsx")) },
  Articles: { title: "Articles", icon: ZAID_ICONS.articles, Component: lazyDefault(() => import("../apps/Articles.jsx")) },
  Experience: { title: "Experience", icon: ZAID_ICONS.experience, Component: lazyDefault(() => import("../apps/Experience.jsx")) },
  Resume: { title: "Resume", icon: ZAID_ICONS.resume, Component: lazyDefault(() => import("../apps/Resume.jsx")) },
  Chess: { title: "Chess", icon: ZAID_ICONS.chess, Component: lazyDefault(() => import("../apps/Chess.jsx")) },
  Skills: { title: "Skills", icon: ZAID_ICONS.skills, Component: lazyDefault(() => import("../apps/Skills.jsx")) },
  ZaidGPT: { title: "ZaidGPT", icon: ZAID_ICONS.chat, Component: lazyDefault(() => import("../apps/Chat.jsx")) },
  Contact: { title: "Contact", icon: ZAID_ICONS.contact, Component: lazyDefault(() => import("../apps/Contact.jsx")) },
  Terminal: { title: "Terminal", icon: ZAID_ICONS.terminal, Component: lazyDefault(() => import("../apps/Terminal.jsx")) },
  TextEdit: { title: "TextEdit", icon: getAppIcon("TextEdit"), Component: lazyDefault(() => import("../../app/TextEdit.jsx")) },
  PDFViewer: { title: "Preview", icon: getAppIcon("PDFViewer"), Component: lazyDefault(() => import("../../app/PDFViewer.jsx")) },
};

function defsToApps(ids) {
  return ids
    .map((id) => {
      if (MOBILE_HIDDEN_APP_IDS.has(id)) return null;
      const def = APP_DEFS[id];
      if (!def) return null;
      return { id, ...def };
    })
    .filter(Boolean);
}

export const MOBILE_APPS = Object.entries(APP_DEFS)
  .filter(([id]) => !MOBILE_HIDDEN_APP_IDS.has(id))
  .map(([id, def]) => ({ id, ...def }));

/** iOS dock — primary system apps (not duplicated on home). */
export const MOBILE_DOCK_IDS = ["Phone", "Safari", "Messages", "Music"];

/** System apps on home page 2 (Launchpad is desktop-only). */
const MOBILE_SYSTEM_PAGE_IDS = [
  "Photos",
  "Mail",
  "Maps",
  "Calendar",
  "Notes",
  "Settings",
  "Finder",
  "FaceTime",
  "Contacts",
  "Reminders",
  "Trash",
];

/** Curated home — page 1: Zaid + utilities; page 2: system apps. */
export const MOBILE_HOME_APPS = [
  ...defsToApps(MOBILE_ZAID_APP_IDS),
  ...defsToApps(MOBILE_UTILITY_IDS.filter((id) => !MOBILE_ZAID_APP_IDS.includes(id))),
  ...defsToApps(MOBILE_SYSTEM_PAGE_IDS),
];

export function getMobileApp(id) {
  if (MOBILE_HIDDEN_APP_IDS.has(id)) return null;
  return MOBILE_APPS.find((a) => a.id === id);
}

/** Two home pages: portfolio + utilities, then system apps. */
export function paginateHomeApps() {
  const zaidAndUtils = defsToApps([
    ...MOBILE_ZAID_APP_IDS,
    ...MOBILE_UTILITY_IDS.filter((id) => !MOBILE_ZAID_APP_IDS.includes(id)),
  ]);
  const system = defsToApps(MOBILE_SYSTEM_PAGE_IDS);
  const pages = [];
  if (zaidAndUtils.length) pages.push(zaidAndUtils);
  if (system.length) pages.push(system);
  return pages.length ? pages : [[]];
}
