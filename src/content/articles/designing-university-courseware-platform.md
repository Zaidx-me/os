---
title: "Designing a University Courseware Platform"
description: "How I built PU Stacks — a platform for educators to share and remix course materials. System design decisions, versioning challenges, and why collaboration features matter more than you think."
date: "2025-07-25"
readingTime: "3 min read"
tags:
  - education
  - remix
  - postgresql
  - pu-stacks
---
# Designing a University Courseware Platform

## The problem

University course materials are scattered across Google Drive, email attachments, and USB drives. Students lose access after graduation. Educators can't easily share updated materials with colleagues. Every semester, the same questions get asked because the FAQ lives in someone's inbox.

## The vision

A centralized platform where educators publish course materials and students browse, search, and access them. But here's the twist: courseware isn't meant to be siloed. Educators should be able to share stacks with colleagues, who can then remix and adapt them for their own courses.

## Architecture decisions

### Data model

The core entity is a "Stack" — a collection of materials organized by subject and semester. Each stack has versions, allowing educators to update content while preserving history.

```typescript
interface Stack {
  id: string;
  title: string;
  authorId: string;
  subject: string;
  semester: string;
  version: number;
  materials: Material[];
  forkedFrom?: string; // Reference to original stack if remixed
  tags: string[];
}

interface Material {
  id: string;
  type: 'notes' | 'slides' | 'assignments' | 'references';
  title: string;
  content: string; // Markdown or rich text
  fileUrl?: string;
  order: number;
}
```

### Remixing mechanism

When an educator remixes a stack, they get a deep copy of all materials. The `forkedFrom` field creates a lineage tree — you can trace any stack back to its original. This enables:

-   Attribution: Original authors get credit
-   Updates: Remixers can pull upstream changes
-   Discovery: Find related stacks through the fork graph

### Search and discovery

Full-text search across all materials using PostgreSQL's tsvector. Filters by subject, semester, tags, and author. The search index updates on material edit, not on publish — so drafts are searchable by the author before going live.

## Frontend decisions

### Editor experience

Educators need a WYSIWYG editor that handles markdown, LaTeX for equations, and code blocks. I chose TipTap (ProseMirror wrapper) for the rich text editor. It's extensible and handles Urdu text input correctly.

### Student view

Students see a clean reading interface. No editing chrome, no version history — just the content. Progress tracking shows which materials they've opened. Bookmarks let them save specific sections.

### Responsive design

The platform needs to work on phones (students checking materials between classes) and desktops (educators preparing content). CSS Grid with breakpoints at tablet and mobile sizes.

## Deployment

Vercel for frontend, Railway for the API, Supabase for PostgreSQL and auth. The stack is:

-   Remix (SSR + file-based routing)
-   Tailwind CSS
-   Supabase (PostgreSQL + Auth + Storage)
-   Vercel (hosting)

## Challenges solved

### Versioning without complexity

Git-like versioning is overkill for course materials. I implemented a simple "publish draft" workflow. Each publish creates a new version. Educators can view previous versions but can't branch — linear history is simpler and sufficient.

### Large file handling

PDFs and slides can be 50MB+. Supabase Storage handles uploads, but I added chunked upload for reliability. If a connection drops mid-upload, the next attempt resumes from the last chunk.

### Permission model

Three roles: Student (read-only), Educator (create + edit own stacks), Admin (moderate content). The permission check happens at the API layer, not the database — simpler to audit and modify.

## Metrics that matter

-   **Time to first material**: Under 30 seconds from signup to publishing first stack
-   **Search relevance**: 85% of searches find relevant material in top 3 results
-   **Mobile usage**: 60% of student traffic comes from phones

## What I learned

-   Versioning is a UX problem, not just a technical one — educators don't think in git commits
-   Remix's server-side rendering is perfect for content-heavy platforms
-   Search relevance matters more than feature count
-   Community features (comments, ratings) drive engagement more than content quality alone

## What's next

AI-powered summarization of course materials. Collaboration features where multiple educators can co-author a stack. Integration with university LMS systems via LTI.
