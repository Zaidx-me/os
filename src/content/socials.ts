import type { Social } from './types';

/**
 * Social handles, verified from https://zaidx.me (header icons), the GitHub
 * profile README, and the plan Findings: GitHub/LinkedIn = zaidx-me,
 * Instagram/Threads/Snapchat = zaidxme, Twitter = zaidxme,
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
    id: 'instagram',
    label: 'Instagram',
    handle: '@zaidxme',
    url: 'https://instagram.com/zaidxme',
  },
  {
    id: 'threads',
    label: 'Threads',
    handle: '@zaidxme',
    url: 'https://threads.net/@zaidxme',
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    handle: 'zaidxme',
    url: 'https://snapchat.com/add/zaidxme',
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
