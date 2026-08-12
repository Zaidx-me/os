import type { Social } from './types';

/**
 * Social handles, verified from https://zaidx.me (header icons) and the GitHub
 * profile README: GitHub/LinkedIn = zaidx-me, Twitter = zaidxme,
 * Linktree = linktr.ee/zaidx.me.
 */
export const socials: Social[] = [
  {
    id: 'github',
    label: 'GitHub',
    handle: '@zaidx-me',
    url: 'https://github.com/zaidx-me',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'zaidx-me',
    url: 'https://linkedin.com/in/zaidx-me',
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    handle: '@zaidxme',
    url: 'https://twitter.com/zaidxme',
  },
  {
    id: 'linktree',
    label: 'Linktree',
    handle: 'linktr.ee/zaidx.me',
    url: 'https://linktr.ee/zaidx.me',
  },
];
