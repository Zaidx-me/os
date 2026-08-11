import type { Wallpaper } from './types';

/** Static premium wallpaper registry. */
export const wallpapers: Wallpaper[] = [
  {
    id: 'classic-teal',
    name: 'Ocean',
    type: 'teal',
    description: 'Soft blue ocean mesh',
  },
  {
    id: 'slate',
    name: 'Midnight',
    type: 'slate',
    description: 'Deep neutral gradient',
  },
  {
    id: 'sky',
    name: 'Sonoma',
    type: 'sky',
    description: 'macOS-style dawn sky',
  },
  {
    id: 'sand',
    name: 'Linen',
    type: 'sand',
    description: 'Warm One UI neutral',
  },
];
