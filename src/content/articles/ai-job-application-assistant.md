---
title: "How I Built an AI-Powered Job Application Assistant"
description: "A React Native app that analyzes WhatsApp job messages, extracts opportunities, and generates tailored cover letters — all on-device."
date: "2025-08-02"
readingTime: "2 min read"
tags:
  - react-native
  - ai
  - applicator
  - privacy
---
# How I Built an AI-Powered Job Application Assistant

## The problem

Every morning, my WhatsApp fills with job messages from university groups. They're unstructured — some are forwarded three times, some have typos, some are just "check this out" with no context. Manually extracting the actual opportunities takes an hour.

I wanted to paste a batch of messages and get a clean list of jobs with company names, roles, and recruiter emails. Then generate cover letters automatically.

## AI extraction pipeline

The NVIDIA Build API runs Llama 3.1 8B instruct. I send raw WhatsApp text and get back structured JSON:

```typescript
interface JobEvaluation {
  is_job: boolean;
  confidence: number;
  role_type: string;
  company: string;
  keywords_matched: string[];
  extracted_email?: string;
  location?: string;
  original_text: string;
}
```

The prompt asks the model to identify every job position, match keywords against the user's target roles, and extract contact details. Batch processing handles multiple messages in one call.

## CV parsing and cover letters

Users upload their CV as PDF, DOCX, or TXT. Apache PDFBox on Android extracts the text. The AI then cross-references the job requirements with the user's profile, skills, and projects by name.

The cover letter generator produces a subject line and body text. One tap opens Gmail with the recipient, subject, and body pre-filled — thanks to a custom Kotlin module that bridges React Native to Android intents.

## Privacy-first design

Every piece of data stays on the device:

-   User profile (name, email, phone)
-   CV content and parsed sections
-   Cover letter history (max 100)
-   Search and extraction history (max 50)

No API calls except the NVIDIA inference endpoint. No analytics. No cloud sync. Works in airplane mode after first setup.

## Demo and results

The app reduces a multi-hour manual process to two minutes: paste, review, send.

Tech stack: React Native (bare workflow, TypeScript), NVIDIA Build API (Llama 3.1), Apache PDFBox, Kotlin native modules, AsyncStorage.
