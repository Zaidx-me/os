import { APP_ICON } from "./assets.js";

const SYS = (name) => `/icons/system/${name}.png`;

/** Finder sidebar / file-type glyphs — local PNGs only. */
export const FINDER_ICONS = {
  folder: SYS("folder"),
  applications: SYS("app-store"),
  pdf: SYS("pdf"),
  document: SYS("preview"),
};

/** Apps hidden from mobile home / launcher (desktop-only). */
export const MOBILE_HIDDEN_APP_IDS = new Set(["Launchpad"]);

/**
 * One icon per app — system apps use macOS-style PNGs; portfolio apps use
 * whitesur SVGs whose filenames match the app purpose/name.
 */
export const APP_ICON_BY_ID = {
  // macOS system apps
  Finder: SYS("finder"),
  Safari: SYS("safari"),
  Messages: SYS("messages"),
  Mail: SYS("mail"),
  Maps: SYS("maps"),
  Photos: SYS("photos"),
  FaceTime: SYS("facetime"),
  Phone: SYS("phone"),
  Calendar: SYS("calendar"),
  Contacts: SYS("contacts"),
  Notes: SYS("notes"),
  Reminders: SYS("reminders"),
  Music: SYS("music"),
  Settings: SYS("settings"),
  Podcasts: SYS("podcasts"),
  TV: SYS("tv"),
  AppStore: SYS("app-store"),
  Pages: SYS("pages"),
  Numbers: SYS("numbers"),
  Keynote: SYS("keynote"),
  Trash: SYS("trash"),
  Launchpad: SYS("launchpad"),
  TextEdit: APP_ICON("editor"),
  PDFViewer: SYS("preview"),
  Preview: SYS("preview"),
  Github: SYS("github"),
  linkedin: SYS("linkedin"),

  // Portfolio apps — icon filename matches app name / role
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
