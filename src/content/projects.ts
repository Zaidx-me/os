import type { Project } from './types';

/**
 * The 12 projects, ordered featured-first (matches the zaidx.me home page).
 *
 * Facts sourced from https://zaidx.me (home + project pages), the GitHub
 * READMEs, and live URL checks (2026-08-10):
 * - whatbot.zaidx.me 200, applicator.netlify.app 200, kens.netlify.app 200,
 *   pustacks.netlify.app 200, zanith-build.vercel.app 404 (zenith-build archived),
 *   zaidkaproject.netlify.app 404 (zaidtech repo README link is dead — no live link).
 */
export const projects: Project[] = [
  {
    id: 'applicator',
    title: 'Applicator',
    tagline: 'AI-Powered Job Application Assistant',
    description:
      'An AI-powered Android assistant that analyzes WhatsApp job messages, extracts opportunities, and generates tailored cover letters.',
    stack: ['React Native', 'TypeScript', 'NVIDIA API', 'Kotlin', 'PDFBox'],
    links: {
      live: 'https://applicator.netlify.app',
      repo: 'https://github.com/Zaidx-me/applicator-chrome',
      article: '/articles/ai-job-application-assistant',
    },
    status: 'live',
    featured: true,
  },
  {
    id: 'whatbot',
    title: 'Whatbot',
    tagline: 'Open-Source WhatsApp API Gateway',
    description:
      'A self-hosted WhatsApp API gateway with MCP server integration for AI agents, a pluggable architecture, and hardened Docker security.',
    stack: ['NestJS', 'TypeScript', 'Docker', 'MCP', 'React', 'PostgreSQL'],
    links: {
      live: 'https://whatbot.zaidx.me',
      repo: 'https://github.com/Zaidx-me/whatbot',
      article: '/articles/building-whatsapp-gateway',
    },
    status: 'live',
    featured: true,
  },
  {
    id: 'maktaba',
    title: 'Maktaba',
    tagline: 'Offline Urdu Book Reader',
    description:
      'A lightweight offline-first Urdu book reader with 3,000+ local books and PDFs. No internet required.',
    stack: ['React Native', 'Expo', 'Firebase', 'AsyncStorage'],
    links: {
      repo: 'https://github.com/Zaidx-me/maktaba',
      article: '/articles/building-offline-urdu-reader',
    },
    status: 'open-source',
    featured: true,
  },
  {
    id: 'media-cleaner',
    title: 'Media Cleaner',
    tagline: 'Cleaner for WhatsApp Media and Files',
    description:
      'An Android app that cleans redundant media and files from storage — built after the existing Play Store and F-Droid options did not actually work. Published on F-Droid, Google Play, and GitHub.',
    stack: ['Kotlin', 'Android', 'F-Droid', 'Google Play'],
    links: {
      repo: 'https://github.com/Zaidx-me/Media-Cleaner',
    },
    status: 'open-source',
    featured: true,
  },
  {
    id: 'pu-stacks',
    title: 'PU Stacks',
    tagline: 'University Courseware Sharing Platform',
    description:
      'A platform for educators and students to share and remix university courseware — course material and previous-year papers.',
    stack: ['React', 'Tailwind CSS', 'Vite', 'Decap CMS'],
    links: {
      live: 'https://pustacks.netlify.app',
      repo: 'https://github.com/Zaidx-me/pustacks',
      article: '/articles/designing-university-courseware-platform',
    },
    status: 'live',
    featured: true,
  },
  {
    id: 'zesho',
    title: 'Zesho',
    tagline: 'University Resource-Sharing Platform',
    description:
      'A collaborative resource-sharing platform for university students — centralized notes, past papers, and course material with peer upvoting. I worked as tech lead on a major iteration, taking the platform in a bold new direction.',
    stack: ['React Native', 'Expo', 'TypeScript', 'Figma', 'UI/UX Design'],
    links: {
      repo: 'https://github.com/Zaidx-me/zesho',
    },
    status: 'open-source',
    featured: true,
  },
  {
    id: 'zenith-build',
    title: 'Zenith Build',
    tagline: 'Build & Deploy Tool',
    description:
      'A build tool built with Next.js. The deployed site is archived — its live URL now returns 404.',
    stack: ['TypeScript', 'Next.js'],
    links: {
      repo: 'https://github.com/Zaidx-me/zenith-build',
    },
    status: 'archived',
    featured: false,
  },
  {
    id: 'tower-defense',
    title: 'Tower Defense',
    tagline: 'SFML Tower Defense Game',
    description:
      'An SFML-based tower defense game built as a modular CMake project with separate business and presentation layers, wave logic, save/load, and audio.',
    stack: ['C++', 'SFML', 'CMake'],
    links: {
      repo: 'https://github.com/Zaidx-me/Tower-Defense',
    },
    status: 'open-source',
    featured: false,
  },
  {
    id: 'tank-arena',
    title: 'Tank Arena',
    tagline: 'Battle City–Inspired SFML Game',
    description:
      'A procedural reimplementation inspired by Battle City — plain structs and free functions instead of OOP, with tanks, bullets, AI, and block collision systems.',
    stack: ['C++', 'SFML', 'CMake'],
    links: {
      repo: 'https://github.com/Zaidx-me/Tank_Arena',
    },
    status: 'open-source',
    featured: false,
  },
  {
    id: 'movies-api',
    title: 'Movies API',
    tagline: 'Vue Movies Project',
    description: 'A movies project built with Vue, MIT-licensed.',
    stack: ['Vue', 'JavaScript'],
    links: {
      repo: 'https://github.com/Zaidx-me/movies-api',
    },
    status: 'open-source',
    featured: false,
  },
  {
    id: 'kens-sunrise',
    title: "Ken's Sunrise",
    tagline: 'Chinese Takeaway Website — Chester-le-Street',
    description:
      "A client website for Ken's Sunrise Chinese Takeaway in Chester-le-Street, featuring the full menu, opening hours, and contact details.",
    stack: ['HTML', 'CSS', 'JavaScript'],
    links: {
      live: 'https://kens.netlify.app',
    },
    status: 'client',
    featured: false,
  },
  {
    id: 'zaidtech',
    title: 'ZaidTech',
    tagline: 'Client Web Project',
    description:
      'A client website project built in plain HTML (the repo README links a live URL that currently returns 404).',
    stack: ['HTML', 'CSS'],
    links: {
      repo: 'https://github.com/Zaidx-me/zaidtech',
    },
    status: 'client',
    featured: false,
  },
];
