
/**
 * The 12 projects, ordered featured-first (matches the zaidx.me home page).
 *
 * Facts sourced from https://zaidx.me (home + project pages), the GitHub
 * READMEs, and live URL checks (2026-08-10):
 * - whatbot.zaidx.me 200, applicator.netlify.app 200, kenspk.netlify.app 200,
 *   pustacks.netlify.app 200, zanith-build.vercel.app 404 (zenith-build archived),
 *   zaidkaproject.netlify.app 404 (zaidtech repo README link is dead — no live link).
 */
export const projects = [
  {
    id,
    title,
    tagline-Powered Job Application Assistant',
    description:
      'An AI-powered Android assistant that analyzes WhatsApp job messages, extracts opportunities, and generates tailored cover letters.',
    stack Native', 'TypeScript', 'NVIDIA API', 'Kotlin', 'PDFBox'],
    links: {
      live://applicator.netlify.app',
      repo://github.com/Zaidx-me/applicator-chrome',
      article/articles/ai-job-application-assistant',
    },
    status,
    featured,
  },
  {
    id,
    title,
    tagline-Source WhatsApp API Gateway',
    description:
      'A self-hosted WhatsApp API gateway with MCP server integration for AI agents, a pluggable architecture, and hardened Docker security.',
    stack, 'TypeScript', 'Docker', 'MCP', 'React', 'PostgreSQL'],
    links: {
      live://whatbot.zaidx.me',
      repo://github.com/Zaidx-me/whatbot',
      article/articles/building-whatsapp-gateway',
    },
    status,
    featured,
  },
  {
    id,
    title,
    tagline Urdu Book Reader',
    description:
      'A lightweight offline-first Urdu book reader with 3,000+ local books and PDFs. No internet required.',
    stack Native', 'Expo', 'Firebase', 'AsyncStorage'],
    links: {
      repo://github.com/Zaidx-me/maktaba',
      article/articles/building-offline-urdu-reader',
    },
    status-source',
    featured,
  },
  {
    id-cleaner',
    title Cleaner',
    tagline for WhatsApp Media and Files',
    description:
      'An Android app that cleans redundant media and files from storage — built after the existing Play Store and F-Droid options did not actually work. Published on F-Droid, Google Play, and GitHub.',
    stack, 'Android', 'F-Droid', 'Google Play'],
    links: {
      repo://github.com/Zaidx-me/Media-Cleaner',
    },
    status-source',
    featured,
  },
  {
    id-stacks',
    title Stacks',
    tagline Courseware Sharing Platform',
    description:
      'A platform for educators and students to share and remix university courseware — course material and previous-year papers.',
    stack, 'Tailwind CSS', 'Vite', 'Decap CMS'],
    links: {
      live://pustacks.netlify.app',
      repo://github.com/Zaidx-me/pustacks',
      article/articles/designing-university-courseware-platform',
    },
    status,
    featured,
  },
  {
    id,
    title,
    tagline Resource-Sharing Platform',
    description:
      'A collaborative resource-sharing platform for university students — centralized notes, past papers, and course material with peer upvoting. I worked as tech lead on a major iteration, taking the platform in a bold new direction.',
    stack Native', 'Expo', 'TypeScript', 'Figma', 'UI/UX Design'],
    links: {
      repo://github.com/Zaidx-me/zesho',
    },
    status-source',
    featured,
  },
  {
    id-build',
    title Build',
    tagline & Deploy Tool',
    description:
      'A build tool built with Next.js. The deployed site is archived — its live URL now returns 404.',
    stack, 'Next.js'],
    links: {
      repo://github.com/Zaidx-me/zenith-build',
    },
    status,
    featured,
  },
  {
    id-defense',
    title Defense',
    tagline Tower Defense Game',
    description:
      'An SFML-based tower defense game built as a modular CMake project with separate business and presentation layers, wave logic, save/load, and audio.',
    stack++', 'SFML', 'CMake'],
    links: {
      repo://github.com/Zaidx-me/Tower-Defense',
    },
    status-source',
    featured,
  },
  {
    id-arena',
    title Arena',
    tagline City–Inspired SFML Game',
    description:
      'A procedural reimplementation inspired by Battle City — plain structs and free functions instead of OOP, with tanks, bullets, AI, and block collision systems.',
    stack++', 'SFML', 'CMake'],
    links: {
      repo://github.com/Zaidx-me/Tank_Arena',
    },
    status-source',
    featured,
  },
  {
    id-api',
    title API',
    tagline Movies Project',
    description movies project built with Vue, MIT-licensed.',
    stack, 'JavaScript'],
    links: {
      repo://github.com/Zaidx-me/movies-api',
    },
    status-source',
    featured,
  },
  {
    id-pk',
    title FastFood",
    tagline in Gujranwala',
    description:
      "A client website for Ken's in Gujranwala, featuring the full menu, opening hours, and contact details.",
    stack, 'CSS', 'JavaScript'],
    links: {
      live://kenspk.netlify.app',
    },
    status,
    featured,
  },
  {
    id,
    title,
    tagline Web Project',
    description:
      'A client website project built in plain HTML (the repo README links a live URL that currently returns 404).',
    stack, 'CSS'],
    links: {
      repo://github.com/Zaidx-me/zaidtech',
    },
    status,
    featured,
  },
];
