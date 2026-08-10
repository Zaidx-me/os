import type { ExperienceEntry } from './types';

/**
 * Experience & Education timeline. Facts only — sourced from the zaidx.me
 * home bio ("Information Technology student at the University of the Punjab",
 * "Graphic Design Intern at Tech Bridge Consultancy", "currently working as a
 * mobile and Shopify developer") and the GitHub README ("4th-semester BSIT
 * student at University of the Punjab (Gujranwala)").
 *
 * Start/end dates were never published, so `period` stays undefined and the
 * UI renders "—" (todo 20 requirement). `current` flags what is ongoing.
 */
export const experience: ExperienceEntry[] = [
  {
    id: 'bsit-punjab',
    type: 'education',
    role: 'BSIT — Information Technology',
    org: 'University of the Punjab, Gujranwala Campus',
    current: true,
    bullets: [
      'In the 4th semester of the BSIT program',
      'Studying IT alongside freelance mobile and Shopify development',
    ],
  },
  {
    id: 'tech-bridge-intern',
    type: 'work',
    role: 'Graphic Design Intern',
    org: 'Tech Bridge Consultancy',
    current: false,
    bullets: ['Graphic design internship focused on client work'],
  },
  {
    id: 'freelance-mobile-shopify',
    type: 'freelance',
    role: 'Freelance Mobile & Shopify Developer',
    current: true,
    bullets: [
      'Mobile app development with React Native',
      'Shopify store development',
      'UX design in Figma through to native app development',
    ],
  },
];
