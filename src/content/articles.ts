import type { Article } from './types';

/**
 * The 4 published articles, ported with the SAME slugs as zaidx.me/articles.
 * Titles + descriptions are verbatim from https://zaidx.me/articles
 * (fetched 2026-08-10). Markdown bodies live in src/content/articles/*.md
 * and are shipped in the Content + SEO wave (todos 34-38).
 */
export const articles: Article[] = [
  {
    slug: 'building-whatsapp-gateway',
    title: 'Building a WhatsApp API Gateway with MCP Server Integration',
    description:
      "I forked OpenWA and added an MCP server for AI agents, a protocol-neutral tool registry, and Docker security hardening. Here's how it all fits together.",
  },
  {
    slug: 'building-offline-urdu-reader',
    title: 'Building an Offline-First Urdu Book Reader',
    description:
      'How I built Maktaba — a React Native app that serves 3,000+ Urdu books and PDFs without internet. Firebase sync, local storage, and why offline-first matters for accessibility.',
  },
  {
    slug: 'designing-university-courseware-platform',
    title: 'Designing a University Courseware Platform',
    description:
      'How I built PU Stacks — a platform for educators to share and remix course materials. System design decisions, versioning challenges, and why collaboration features matter more than you think.',
  },
  {
    slug: 'ai-job-application-assistant',
    title: 'How I Built an AI-Powered Job Application Assistant',
    description:
      'A React Native app that analyzes WhatsApp job messages, extracts opportunities, and generates tailored cover letters — all on-device.',
  },
];
