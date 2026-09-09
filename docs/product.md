# Product overview

## What Anlat Hoca is

Anlat Hoca is an AI-powered mobile study assistant. It is intended to help learners turn educational material into focused study experiences while keeping the mobile client, backend, AI integration, and data access clearly separated.

## V1 objectives

The V1 product direction lets a learner select an educational PDF, upload it through the backend, review extracted topics and important sections, and study from generated lessons, presentation-style views, and lesson-grounded quizzes. Detailed notes, questions to an AI teacher, and prepared TYT/KPSS study packs remain planned.

PDF transfer, document analysis, time-aware written lesson generation, normal lesson reading, interactive presentation mode, multiple-choice quizzes, server-side grading, persisted attempts, and weak-section feedback are currently implemented. The remaining items are product objectives.

The current V1 flow selects one PDF up to 15 MiB, uploads it through the Anlat Hoca Worker to temporary Gemini Files API storage, and stores only document metadata and the internal temporary provider reference in D1. The user can explicitly start a Turkish document analysis that produces a concise summary, meaningful topics, document-relative importance, conceptual difficulty, and key learning points. The runtime-validated result is cached in D1. The original PDF is not stored by Anlat Hoca.

After analysis, the learner can explicitly request an approximately 10, 30, or 60 minute written lesson. Ten minutes prioritizes urgent review and openly lists skipped lower-priority topics; 30 minutes balances coverage and explanation; 60 minutes covers most meaningful topics with additional relationships and detail. These durations are study-budget targets, not stopwatch guarantees. Generated lessons are source-grounded, runtime-validated, persisted, and reused.

An existing lesson can be studied in a focused presentation mode. Slides are created locally and deterministically from persisted lesson content, so opening or navigating the presentation consumes no additional AI generation. The presentation keeps the normal reading view available and does not silently truncate educational text.

The learner can explicitly request one cached quiz from a persisted lesson. A 10, 30, or 60 minute lesson yields exactly 5, 8, or 10 questions. Questions cover only taught lesson content—not skipped topics or unrelated PDF material. Answers are graded deterministically on the backend, explanations appear only after submission, and missed questions are grouped under supportive lesson-section review guidance. The same quiz can be solved repeatedly without new AI generation; each submitted attempt is stored separately.

## Features planned for later

- Page-count policy enforcement
- Detailed notes
- Questions grounded in uploaded material
- Prepared TYT and KPSS study packs

Importance is the topic's weight inside the uploaded document, not a prediction that it will appear on an exam.

## Why voice and TTS are not in V1

Voice interaction and text-to-speech add platform behavior, accessibility, cost, latency, and content-quality concerns that are separate from validating the core study workflow. V1 will focus on reliable text and visual learning experiences. Voice/TTS can be evaluated after the core workflow and user value are proven.
