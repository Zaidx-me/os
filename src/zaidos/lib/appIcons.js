import { APP_ICON } from "./assets.js";

/** Local icons only — no remote CDN (reliable on mobile + offline). */
export const FINDER_ICONS = {
  folder: APP_ICON("files"),
  applications: APP_ICON("settings"),
  pdf: APP_ICON("articles"),
  document: APP_ICON("editor"),
};

/** Apps hidden from mobile home / launcher (desktop-only). */
export const MOBILE_HIDDEN_APP_IDS = new Set(["Launchpad"]);

/** One distinct icon per app — avoid duplicate glyphs on home/dock. */
export const APP_ICON_BY_ID = {
  Finder: APP_ICON("files"),
  Safari: APP_ICON("browser"),
  Messages: APP_ICON("chat"),
  Mail: APP_ICON("articles"),
  Maps: APP_ICON("monitor"),
  Photos: APP_ICON("photos"),
  FaceTime: APP_ICON("calculator"),
  Phone: "/icons/apple.png",
  Calendar: APP_ICON("experience"),
  Contacts: APP_ICON("contact"),
  Notes: APP_ICON("notes"),
  Reminders: APP_ICON("editor"),
  Music: APP_ICON("music"),
  Settings: APP_ICON("settings"),
  Trash: "/icons/trash.png",
  Launchpad: APP_ICON("skills"),
  TextEdit: APP_ICON("editor"),
  PDFViewer: APP_ICON("articles"),
  Preview: APP_ICON("monitor"),
  About: APP_ICON("about"),
  Projects: APP_ICON("projects"),
  Articles: APP_ICON("articles"),
  Experience: APP_ICON("experience"),
  Resume: APP_ICON("resume"),
  Skills: APP_ICON("skills"),
  ZaidGPT: "/icons/Hello16MacBookProBlk.png",
  Contact: APP_ICON("contact"),
  Terminal: APP_ICON("terminal"),
  Chess: APP_ICON("chess"),
  Podcasts: "/icons/owl.png",
  TV: "/icons/fox.png",
  AppStore: "/icons/macos-sequoia.jpg",
  Pages: APP_ICON("monitor"),
  Numbers: APP_ICON("calculator"),
  Keynote: APP_ICON("snake"),
  Github: "/icons/PngItem_4082636.png",
  linkedin: "/icons/PngItem_4409921.png",
};

export function getAppIcon(appId) {
  if (!appId) return APP_ICON("files");
  return APP_ICON_BY_ID[appId] ?? APP_ICON("files");
}
