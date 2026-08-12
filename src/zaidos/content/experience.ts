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
    role: 'BSIT, Information Technology',
    org: 'University of the Punjab',
    current: true,
    bullets: [
      'In the 5th semester of the BSIT program',
      'Studying IT alongside freelance mobile and engineer solutions that scale',
    ],
  },
  {
    id: 'freelance-graphic-design',
    type: 'work',
    role: 'Graphic Design Intern',
    org: 'Self Employed',
    current: false,
    bullets: ['Built and scaled ecomerc stores -- It was starting'],
  },
  {
    id: 'project-on-demand',
    type: 'freelance',
    role: 'Freelance some C++ Games for students as thei Semester Projects',
    current: true,
    bullets: [
      'Used SFML for graphics',
      'State management by proper file handeling',
      'Route mapping through algortihms',
    ],
  },
];
