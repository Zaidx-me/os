import type { Wallpaper } from './types';

/**
 * Wallpaper registry. `type` maps to the engine variant the wallpaper
 * component renders (todo 7): matrix = canvas rain, gradient = animated
 * hue shift, dark/light = static variants. All wallpapers are locally
 * generated — nothing is loaded from the network.
 */
export const wallpapers: Wallpaper[] = [
  {
    id: 'animated-matrix',
    name: 'Matrix Rain',
    type: 'matrix',
    description: 'Green matrix rain falling behind the desktop',
  },
  {
    id: 'animated-gradient',
    name: 'Animated Gradient',
    type: 'gradient',
    description: 'A slow shifting accent gradient',
  },
  {
    id: 'dark-abstract',
    name: 'Dark Abstract',
    type: 'dark',
    description: 'Static dark abstract, easy on the eyes',
  },
  {
    id: 'light-minimal',
    name: 'Light Minimal',
    type: 'light',
    description: 'A light minimal variant for daytime rices',
  },
];
