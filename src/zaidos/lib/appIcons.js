import { APP_ICON } from "./assets.js";

/** Local icons only — no remote CDN (reliable on mobile + offline). */
export const FINDER_ICONS = {
  folder: APP_ICON("files"),
  applications: APP_ICON("settings"),
  pdf: APP_ICON("files"),
  document: APP_ICON("editor"),
};

/** Apps hidden from mobile home / launcher (desktop-only). */
export const MOBILE_HIDDEN_APP_IDS = new Set(["Launchpad"]);

export const APP_ICON_BY_ID = {
  Finder: APP_ICON("files"),
  Safari: APP_ICON("browser"),
  Messages: APP_ICON("chat"),
  Mail: APP_ICON("contact"),
  Maps: APP_ICON("monitor"),
  Photos: APP_ICON("photos"),
  FaceTime: APP_ICON("chat"),
  Phone: APP_ICON("contact"),
  Calendar: APP_ICON("experience"),
  Contacts: APP_ICON("contact"),
  Notes: APP_ICON("notes"),
  Reminders: APP_ICON("notes"),
  Music: APP_ICON("music"),
  Settings: APP_ICON("settings"),
  Trash: "/icons/trash.png",
  Launchpad: APP_ICON("settings"),
  TextEdit: APP_ICON("editor"),
  PDFViewer: APP_ICON("files"),
  Preview: APP_ICON("files"),
  About: APP_ICON("about"),
  Projects: APP_ICON("projects"),
  Articles: APP_ICON("articles"),
  Experience: APP_ICON("experience"),
  Resume: APP_ICON("resume"),
  Skills: APP_ICON("skills"),
  ZaidGPT: APP_ICON("chat"),
  Contact: APP_ICON("contact"),
  Terminal: APP_ICON("terminal"),
  Chess: APP_ICON("chess"),
};

export function getAppIcon(appId) {
  if (!appId) return APP_ICON("files");
  return APP_ICON_BY_ID[appId] ?? APP_ICON("files");
}
