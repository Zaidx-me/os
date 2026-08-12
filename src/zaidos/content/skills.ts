import type { SkillGroup } from './types';

/**
 * The stack I actually use (not the LinkedIn cosplay version).
 * Factual list from https://github.com/Zaidx-me (profile README) + zaidx.me.
 */
export const skillGroups: SkillGroup[] = [
  {
    id: 'mobile',
    label: 'Mobile',
    skills: [
      { name: 'React Native', note: 'native apps without leaving JS' },
      { name: 'Expo', note: 'build and ship React Native faster' },
      { name: 'Kotlin', note: 'native Android modules when RN is not enough' },
      { name: 'Android', note: 'Play Store + F-Droid releases' },
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    skills: [
      { name: 'TypeScript', note: 'typed everything, everywhere' },
      { name: 'React', note: 'component-driven UIs' },
      { name: 'Next.js', note: 'React apps with routing and SSR' },
      { name: 'Vue', note: 'the movies-api stack' },
      { name: 'Tailwind CSS', note: 'utility-first styling' },
      { name: 'HTML/CSS', note: 'the classics, still undefeated' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    skills: [
      { name: 'Node.js', note: 'servers and tooling' },
      { name: 'NestJS', note: 'structured backends — the whatbot gateway' },
      { name: 'Python', note: 'scripts, APIs, glue' },
      { name: 'FastAPI', note: 'Python APIs without the ceremony' },
      { name: 'REST APIs', note: 'JSON in, JSON out' },
    ],
  },
  {
    id: 'ai-devtools',
    label: 'AI & DevTools',
    skills: [
      { name: 'NVIDIA API', note: 'LLM integration, incl. on-device' },
      { name: 'MCP', note: 'Model Context Protocol servers for AI agents' },
      { name: 'Docker', note: 'containers, compose, hardened images' },
      { name: 'n8n', note: 'automation for people who hate clicking buttons' },
      { name: 'Git & GitHub', note: '29 public repos and counting' },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    skills: [
      { name: 'Figma', note: 'UX design and design systems' },
      { name: 'UI/UX Design', note: 'interfaces people can actually use' },
      { name: 'Graphic Design', note: 'the internship title that stuck' },
      { name: 'Motion Design', note: 'animation that explains cause and effect' },
    ],
  },
  {
    id: 'systems',
    label: 'Systems',
    skills: [
      { name: 'C++', note: 'SFML games, CMake, no OOP when unnecessary' },
      { name: 'SFML', note: '2D game framework for C++' },
      { name: 'CMake', note: 'portable builds' },
      { name: 'Arch Linux', note: 'the OS' },
      { name: 'CachyOS', note: 'the daily driver' },
      { name: 'Hyprland', note: 'the WM you compile motivation to configure' },
    ],
  },
];
