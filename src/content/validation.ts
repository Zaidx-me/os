import {
  PROJECT_STATUSES,
  WALLPAPER_TYPES,
  type Article,
  type ExperienceEntry,
  type Project,
  type Social,
  type Wallpaper,
} from './types';
import { projects } from './projects';
import { articles } from './articles';
import { wallpapers } from './wallpapers';
import { socials } from './socials';
import { experience } from './experience';

/**
 * Pure, dependency-free validators for the content data layer.
 * Each validator returns { valid, errors } so callers (tests, CI, runtime
 * guards) can decide what to do — nothing throws.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ok = (): ValidationResult => ({ valid: true, errors: [] });

const fail = (...errors: string[]): ValidationResult => ({
  valid: errors.length === 0,
  errors,
});

/** Non-empty trimmed string. */
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function findDuplicateIds<T>(
  entries: T[],
  label: string,
  getId: (entry: T) => string | undefined,
  errors: string[],
): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    const id = getId(entry);
    if (id === undefined) continue;
    if (seen.has(id)) {
      errors.push(`duplicate ${label} id: "${id}"`);
    }
    seen.add(id);
  }
}

const HTTP_LINK_FIELDS = ['live', 'repo', 'figma'] as const;

function validateLinks(
  links: Project['links'],
  projectId: string,
  errors: string[],
): void {
  for (const field of HTTP_LINK_FIELDS) {
    const value = links[field];
    if (value !== undefined && !isNonEmptyString(value)) {
      errors.push(`project "${projectId}": links.${field} must be a non-empty string`);
    }
  }
  if (links.article !== undefined && !isNonEmptyString(links.article)) {
    errors.push(`project "${projectId}": links.article must be a non-empty string`);
  }
}

function validatePerStatusLinks(project: Project, errors: string[]): void {
  const { id, status, links } = project;

  switch (status) {
    case 'live':
      // A live project must actually link somewhere reachable.
      if (!isNonEmptyString(links.live)) {
        errors.push(`project "${id}": status "live" requires links.live`);
      }
      break;
    case 'client':
      // Client work must show either the live site or the repo.
      if (!isNonEmptyString(links.live) && !isNonEmptyString(links.repo)) {
        errors.push(`project "${id}": status "client" requires links.live or links.repo`);
      }
      break;
    case 'open-source':
      if (!isNonEmptyString(links.repo)) {
        errors.push(`project "${id}": status "open-source" requires links.repo`);
      }
      break;
    case 'archived':
      // Archived = the deployed site is gone (zenith-build 404s); never show a dead live link.
      if (isNonEmptyString(links.live)) {
        errors.push(`project "${id}": status "archived" must not include links.live`);
      }
      break;
    case 'in-progress':
      if (
        !isNonEmptyString(links.live) &&
        !isNonEmptyString(links.repo) &&
        !isNonEmptyString(links.article) &&
        !isNonEmptyString(links.figma)
      ) {
        errors.push(`project "${id}": status "in-progress" requires at least one link`);
      }
      break;
  }
}

/** Unique ids, required fields non-empty, valid status enum, per-status link rules. */
export function validateProjects(list: Project[]): ValidationResult {
  if (!Array.isArray(list) || list.length === 0) {
    return fail('projects list must be a non-empty array');
  }

  const errors: string[] = [];
  findDuplicateIds(list, 'project', (p) => p.id, errors);

  for (const project of list) {
    const { id, title, tagline, description, stack, status, featured, links } = project;

    if (!isNonEmptyString(id)) errors.push('project has empty id');
    if (!isNonEmptyString(title)) errors.push(`project "${id}": title is required`);
    if (!isNonEmptyString(tagline)) errors.push(`project "${id}": tagline is required`);
    if (!isNonEmptyString(description)) {
      errors.push(`project "${id}": description is required`);
    }
    if (!Array.isArray(stack) || stack.length === 0) {
      errors.push(`project "${id}": stack must be a non-empty array`);
    }
    if (typeof featured !== 'boolean') {
      errors.push(`project "${id}": featured must be a boolean`);
    }
    if (!links || typeof links !== 'object') {
      errors.push(`project "${id}": links object is required`);
      continue;
    }

    if (!PROJECT_STATUSES.includes(status)) {
      errors.push(
        `project "${id}": status "${String(status)}" is not valid (expected one of ${PROJECT_STATUSES.join(', ')})`,
      );
      continue;
    }

    validateLinks(links, id, errors);
    validatePerStatusLinks(project, errors);
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

/** Unique slugs; slug/title/description all non-empty. */
export function validateArticles(list: Article[]): ValidationResult {
  if (!Array.isArray(list) || list.length === 0) {
    return fail('articles list must be a non-empty array');
  }

  const errors: string[] = [];
  findDuplicateIds(list, 'article', (a) => a.slug, errors);

  for (const article of list) {
    const { slug, title, description } = article;
    if (!isNonEmptyString(slug)) errors.push('article has empty slug');
    if (!isNonEmptyString(title)) errors.push(`article "${slug}": title is required`);
    if (!isNonEmptyString(description)) {
      errors.push(`article "${slug}": description is required`);
    }
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

/** Unique ids; name/description non-empty; type within the wallpaper engine enum. */
export function validateWallpapers(list: Wallpaper[]): ValidationResult {
  if (!Array.isArray(list) || list.length === 0) {
    return fail('wallpapers list must be a non-empty array');
  }

  const errors: string[] = [];
  findDuplicateIds(list, 'wallpaper', (w) => w.id, errors);

  for (const wallpaper of list) {
    const { id, name, description, type } = wallpaper;
    if (!isNonEmptyString(id)) errors.push('wallpaper has empty id');
    if (!isNonEmptyString(name)) errors.push(`wallpaper "${id}": name is required`);
    if (!isNonEmptyString(description)) {
      errors.push(`wallpaper "${id}": description is required`);
    }
    if (!WALLPAPER_TYPES.includes(type)) {
      errors.push(
        `wallpaper "${id}": type "${String(type)}" is not valid (expected one of ${WALLPAPER_TYPES.join(', ')})`,
      );
    }
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

/** Unique ids; label/handle/url non-empty. */
export function validateSocials(list: Social[]): ValidationResult {
  if (!Array.isArray(list) || list.length === 0) {
    return fail('socials list must be a non-empty array');
  }

  const errors: string[] = [];
  findDuplicateIds(list, 'social', (s) => s.id, errors);

  for (const social of list) {
    const { id, label, handle, url } = social;
    if (!isNonEmptyString(id)) errors.push('social has empty id');
    if (!isNonEmptyString(label)) errors.push(`social "${id}": label is required`);
    if (!isNonEmptyString(handle)) errors.push(`social "${id}": handle is required`);
    if (!isNonEmptyString(url)) errors.push(`social "${id}": url is required`);
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

const EXPERIENCE_TYPES = ['education', 'work', 'freelance'] as const;

/** Unique ids; type within enum; role non-empty; current boolean; bullets array. */
export function validateExperience(list: ExperienceEntry[]): ValidationResult {
  if (!Array.isArray(list) || list.length === 0) {
    return fail('experience list must be a non-empty array');
  }

  const errors: string[] = [];
  findDuplicateIds(list, 'experience', (e) => e.id, errors);

  for (const entry of list) {
    const { id, type, role, current, bullets } = entry;
    if (!isNonEmptyString(id)) errors.push('experience entry has empty id');
    if (!isNonEmptyString(role)) errors.push(`experience "${id}": role is required`);
    if (!EXPERIENCE_TYPES.includes(type)) {
      errors.push(
        `experience "${id}": type "${String(type)}" is not valid (expected one of ${EXPERIENCE_TYPES.join(', ')})`,
      );
    }
    if (typeof current !== 'boolean') {
      errors.push(`experience "${id}": current must be a boolean`);
    }
    if (!Array.isArray(bullets)) {
      errors.push(`experience "${id}": bullets must be an array`);
    }
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

/** Runs every validator against the actual shipped data. */
export function validateAll(): ValidationResult {
  const results = [
    validateProjects(projects),
    validateArticles(articles),
    validateWallpapers(wallpapers),
    validateSocials(socials),
    validateExperience(experience),
  ];

  const errors = results.flatMap((r) => r.errors);
  return errors.length === 0 ? ok() : fail(...errors);
}
