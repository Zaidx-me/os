/**
 * Shared types for the ZaidOS content data layer.
 *
 * Single source of truth — apps (Projects, Skills, Experience, About, ...),
 * the terminal, the chatbot, and the SEO layer all import from here.
 * Facts come from https://zaidx.me and https://github.com/Zaidx-me
 * (verified 2026-08-10, see .omo/evidence/task-3-zaidos-portfolio.txt).
 */

export const PROJECT_STATUSES = [
  'live',
  'open-source',
  'archived',
  'client',
  'in-progress',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface ProjectLinks {
  /** Production / demo URL (must return 200 when the project is `live` or `client`). */
  live?: string;
  /** GitHub repository URL. */
  repo?: string;
  /** Relative route to the write-up on this site, e.g. `/articles/building-whatsapp-gateway`. */
  article?: string;
  /** Figma design / case-study URL. */
  figma?: string;
}

export interface Project {
  id: string;
  title: string;
  /** One-liner shown on the card. */
  tagline: string;
  /** 1-3 sentence factual description. */
  description: string;
  stack: string[];
  links: ProjectLinks;
  status: ProjectStatus;
  featured: boolean;
}

export type SkillGroupId =
  | 'mobile'
  | 'frontend'
  | 'backend'
  | 'ai-devtools'
  | 'design'
  | 'systems';

export interface Skill {
  name: string;
  /** One-line note in Zaid's voice (rendered under the chip). */
  note: string;
}

export interface SkillGroup {
  id: SkillGroupId;
  label: string;
  skills: Skill[];
}

export type ExperienceType = 'education' | 'work' | 'freelance';

export interface ExperienceEntry {
  id: string;
  type: ExperienceType;
  role: string;
  org?: string;
  /** Free-text period, e.g. "2023 – Present". Left undefined when the dates are not published. */
  period?: string;
  /** True when the entry is ongoing (renders "Current" instead of the end date). */
  current: boolean;
  /** Factual bullets only — no invented achievements. */
  bullets: string[];
}

export interface Social {
  id: string;
  label: string;
  /** Display handle, e.g. `@zaidx-me`. */
  handle: string;
  url: string;
}

export const WALLPAPER_TYPES = ['slate', 'teal', 'sky', 'sand'] as const;

export type WallpaperType = (typeof WALLPAPER_TYPES)[number];

export interface Wallpaper {
  id: string;
  name: string;
  /** Engine variant consumed by the wallpaper component (todo 7). */
  type: WallpaperType;
  description: string;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  /** Optional; dates were not published on zaidx.me/articles — leave undefined, render as "—". */
  date?: string;
  readingTime?: string;
}
