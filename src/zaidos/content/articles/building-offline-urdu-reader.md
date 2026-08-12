---
title: "Building an Offline-First Urdu Book Reader"
description: "How I built Maktaba — a React Native app that serves 3,000+ Urdu books and PDFs without internet. Firebase sync, local storage, and why offline-first matters for accessibility."
date: "2025-07-18"
readingTime: "2 min read"
tags:
  - react-native
  - urdu
  - offline-first
  - maktaba
---
# Building an Offline-First Urdu Book Reader

## Why offline-first?

Urdu readers in South Asia often have unreliable internet. Streaming books doesn't work when connectivity drops every few minutes. Maktaba solves this by downloading everything upfront and syncing in the background.

## The stack

React Native with Expo for cross-platform. Firebase for auth and metadata sync. AsyncStorage for local book data. The app works in airplane mode after first setup.

## Book delivery system

Books come from a curated database of 3,000+ Urdu titles — novels, poetry, religious texts, and academic works. Each book is a JSON manifest with metadata, chapters, and cover art references.

```typescript
interface BookManifest {
  id: string;
  title: string;
  author: string;
  language: 'urdu';
  chapters: Chapter[];
  coverUrl: string;
  downloadedAt?: number;
}
```

The manifest system lets the app know what's available locally vs. what needs downloading. Users see their full library even when offline — only the content they haven't downloaded shows a cloud icon.

## PDF rendering challenges

Urdu is RTL (right-to-left). Most PDF renderers don't handle RTL text reflow well. I had to build a custom text extraction layer that respects Urdu ligatures and contextual shaping.

The native Android PDFBox integration extracts text while preserving the Unicode bidirectional algorithm. Chapter navigation works by mapping page ranges to the manifest structure.

## Sync strategy

Firebase Realtime Database stores reading progress, bookmarks, and library state. When connectivity returns, the sync layer merges local changes with the cloud state using a last-writer-wins strategy.

```typescript
const syncReadingProgress = async (bookId: string, page: number) => {
  await AsyncStorage.setItem(`progress_${bookId}`, JSON.stringify({ page, timestamp: Date.now() }));
  
  if (isOnline()) {
    await firebase.database().ref(`users/${userId}/progress/${bookId}`).set({ page, timestamp: Date.now() });
  }
};
```

## Storage management

3,000 books at ~2MB each = ~6GB. That's too much for most phones. Maktaba implements a tiered storage system:

-   **Favorites**: Always downloaded, never auto-deleted
-   **Recent**: Last 10 books read, cached for quick access
-   **Browse**: Metadata only, download on demand

Users can manually pin books to favorites or let the app manage storage based on usage patterns.

## Typography matters

Urdu Nastaliq script needs specific font rendering. The app bundles Noto Nastaliq Urdu and Jameel Noori Nastaleeq for proper ligature support. Font fallback chains handle edge cases where characters might not render correctly.

## What I learned

-   Offline-first isn't just about caching — it's a fundamentally different architecture
-   RTL support in React Native requires native module workarounds
-   Storage management is a UX problem, not just a technical one
-   Firebase sync conflicts are rare but need explicit handling

## What's next

Add epub support for books that aren't available as PDFs. Implement a community feature where users can suggest new books for the catalog.
