import { describe, expect, it } from 'vitest';

import {
  validateAll,
  validateArticles,
  validateExperience,
  validateProjects,
  validateSocials,
  validateWallpapers,
} from './validation';
import { projects } from './projects';
import { articles } from './articles';
import { wallpapers } from './wallpapers';
import { socials } from './socials';
import { experience } from './experience';
import type { Project } from './types';

const baseProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  tagline: 'A test tagline',
  description: 'A test description.',
  stack: ['TypeScript'],
  links: { repo: 'https://github.com/Zaidx-me/test-project' },
  status: 'open-source',
  featured: false,
};

describe('validateProjects', () => {
  it('passes the real 12-project dataset', () => {
    const result = validateProjects(projects);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(projects).toHaveLength(12);
  });

  it('rejects a duplicate project id', () => {
    const list = [...projects, { ...projects[0] }];
    const result = validateProjects(list);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('duplicate project id'))).toBe(true);
  });

  it('rejects a status outside the enum', () => {
    const list = [{ ...baseProject, status: 'shipped' as Project['status'] }];
    const result = validateProjects(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('status');
  });

  it('requires links.live when status is live', () => {
    const list = [{ ...baseProject, status: 'live' as const, links: { repo: 'https://github.com/x' } }];
    const result = validateProjects(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('live');
  });

  it('accepts a live project that has links.live', () => {
    const list = [
      { ...baseProject, status: 'live' as const, links: { live: 'https://example.com' } },
    ];
    const result = validateProjects(list);
    expect(result.valid).toBe(true);
  });

  it('requires links.repo when status is open-source', () => {
    const list = [{ ...baseProject, status: 'open-source' as const, links: { live: 'https://example.com' } }];
    const result = validateProjects(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('open-source');
  });

  it('rejects an archived project that still lists a live link', () => {
    const list = [
      { ...baseProject, status: 'archived' as const, links: { live: 'https://dead.example.com' } },
    ];
    const result = validateProjects(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('archived');
  });

  it('accepts an archived project without a live link (zenith-build rule)', () => {
    const list = [{ ...baseProject, status: 'archived' as const, links: { repo: 'https://github.com/x' } }];
    const result = validateProjects(list);
    expect(result.valid).toBe(true);
  });

  it('requires at least one of live/repo for client projects', () => {
    const list = [{ ...baseProject, status: 'client' as const, links: {} }];
    const result = validateProjects(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('client');
  });

  it('rejects missing required fields', () => {
    const list = [{ ...baseProject, description: '  ' }];
    const result = validateProjects(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('description');
  });

  it('rejects an empty stack array', () => {
    const list = [{ ...baseProject, stack: [] }];
    const result = validateProjects(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('stack');
  });
});

describe('validateArticles', () => {
  it('passes the real 4-article dataset', () => {
    const result = validateArticles(articles);
    expect(result.valid).toBe(true);
    expect(articles).toHaveLength(4);
  });

  it('rejects a duplicate slug', () => {
    const list = [...articles, { ...articles[0] }];
    const result = validateArticles(list);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('duplicate article id'))).toBe(true);
  });

  it('rejects an empty title', () => {
    const list = [{ ...articles[0], title: '' }];
    const result = validateArticles(list);
    expect(result.valid).toBe(false);
  });
});

describe('validateWallpapers', () => {
  it('passes the real wallpaper set (>= 4)', () => {
    const result = validateWallpapers(wallpapers);
    expect(result.valid).toBe(true);
    expect(wallpapers.length).toBeGreaterThanOrEqual(4);
  });

  it('rejects a duplicate wallpaper id', () => {
    const list = [...wallpapers, { ...wallpapers[0] }];
    const result = validateWallpapers(list);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('duplicate wallpaper id'))).toBe(true);
  });

  it('rejects an unknown wallpaper type', () => {
    const list = [{ ...wallpapers[0], type: 'rainbow' as (typeof wallpapers)[number]['type'] }];
    const result = validateWallpapers(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('type');
  });
});

describe('validateSocials', () => {
  it('passes the real socials dataset', () => {
    const result = validateSocials(socials);
    expect(result.valid).toBe(true);
  });

  it('rejects a social without a url', () => {
    const list = [{ ...socials[0], url: '' }];
    const result = validateSocials(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('url');
  });
});

describe('validateExperience', () => {
  it('passes the real experience dataset', () => {
    const result = validateExperience(experience);
    expect(result.valid).toBe(true);
    expect(experience).toHaveLength(3);
  });

  it('rejects an invalid entry type', () => {
    const list = [{ ...experience[0], type: 'volunteer' as (typeof experience)[number]['type'] }];
    const result = validateExperience(list);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('type');
  });

  it('rejects an entry without a role', () => {
    const list = [{ ...experience[0], role: '' }];
    const result = validateExperience(list);
    expect(result.valid).toBe(false);
  });
});

describe('validateAll', () => {
  it('passes the entire shipped content data layer', () => {
    const result = validateAll();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
