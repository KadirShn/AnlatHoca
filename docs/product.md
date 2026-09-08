# Product overview

## What Anlat Hoca is

Anlat Hoca is an AI-powered mobile study assistant. It is intended to help learners turn educational material into focused study experiences while keeping the mobile client, backend, AI integration, and data access clearly separated.

## V1 objectives

The V1 product direction lets a learner select an educational PDF, upload it through the backend, review extracted topics and important sections, and later study from generated lessons and detailed notes. Lessons are expected to support 10, 30, and 60 minute formats and presentation-style viewing. Quizzes, questions to an AI teacher, and prepared TYT/KPSS study packs are also planned.

Only PDF transfer and document analysis are currently implemented; the remaining items are product objectives.

The current V1 flow selects one PDF up to 15 MiB, uploads it through the Anlat Hoca Worker to temporary Gemini Files API storage, and stores only document metadata and the internal temporary provider reference in D1. The user can explicitly start a Turkish document analysis that produces a concise summary, meaningful topics, document-relative importance, conceptual difficulty, and key learning points. The runtime-validated result is cached in D1. The original PDF is not stored by Anlat Hoca.

## Features planned for later

- Page-count policy enforcement
- Time-boxed lesson generation
- Slide presentations and detailed notes
- Quizzes and answer review
- Questions grounded in uploaded material
- Prepared TYT and KPSS study packs
- Provider-based AI integration, initially targeting Gemini
- Cloudflare D1 persistence where appropriate

Importance is the topic's weight inside the uploaded document, not a prediction that it will appear on an exam.

## Why voice and TTS are not in V1

Voice interaction and text-to-speech add platform behavior, accessibility, cost, latency, and content-quality concerns that are separate from validating the core study workflow. V1 will focus on reliable text and visual learning experiences. Voice/TTS can be evaluated after the core workflow and user value are proven.
