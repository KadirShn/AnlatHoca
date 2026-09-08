# Product overview

## What Anlat Hoca is

Anlat Hoca is an AI-powered mobile study assistant. It is intended to help learners turn educational material into focused study experiences while keeping the mobile client, backend, AI integration, and data access clearly separated.

## V1 objectives

The planned V1 will let a learner select an educational PDF, upload it through a future backend flow, review extracted topics and important sections, and study from generated lessons and detailed notes. Lessons are expected to support 10, 30, and 60 minute formats and presentation-style viewing. Quizzes, questions to an AI teacher, and prepared TYT/KPSS study packs are also planned.

These are product objectives, not functionality present in the current foundation.

The current mobile foundation implements only local selection of one PDF up to 15 MB. It shows validated file metadata and a ready placeholder, but does not upload, parse, persist, or analyze the document. Other document formats are not selectable. Page-count enforcement will be added at the authoritative backend/analysis boundary rather than through a heavy mobile PDF parser.

## Features planned for later

- Secure PDF upload, authoritative validation, and temporary processing
- Document analysis and topic extraction
- Time-boxed lesson generation
- Slide presentations and detailed notes
- Quizzes and answer review
- Questions grounded in uploaded material
- Prepared TYT and KPSS study packs
- Provider-based AI integration, initially targeting Gemini
- Cloudflare D1 persistence where appropriate

## Why voice and TTS are not in V1

Voice interaction and text-to-speech add platform behavior, accessibility, cost, latency, and content-quality concerns that are separate from validating the core study workflow. V1 will focus on reliable text and visual learning experiences. Voice/TTS can be evaluated after the core workflow and user value are proven.
