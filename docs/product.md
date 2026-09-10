# Product overview

## What Anlat Hoca is

Anlat Hoca is an AI-powered mobile study assistant. It is intended to help learners turn educational material into focused study experiences while keeping the mobile client, backend, AI integration, and data access clearly separated.

## V1 objectives

The V1 product direction lets a learner select an educational PDF, upload it through the backend, review extracted topics and important sections, and study from generated lessons, presentation-style views, lesson-grounded quizzes, and lesson-scoped questions to an AI teacher. Detailed notes and prepared TYT/KPSS lesson content remain planned.

PDF transfer, document analysis, time-aware written lesson generation, normal lesson reading, interactive presentation mode, multiple-choice quizzes, server-side grading, persisted attempts, weak-section feedback, persisted **Hocaya Sor** conversations, and a persistent Library/history view are currently implemented. The remaining items are product objectives.

The current V1 flow selects one PDF up to 15 MiB, uploads it through the Anlat Hoca Worker to temporary Gemini Files API storage, and stores only document metadata and the internal temporary provider reference in D1. The user can explicitly start a Turkish document analysis that produces a concise summary, meaningful topics, document-relative importance, conceptual difficulty, and key learning points. The runtime-validated result is cached in D1. The original PDF is not stored by Anlat Hoca.

After analysis, the learner can explicitly request an approximately 10, 30, or 60 minute written lesson. Ten minutes prioritizes urgent review and openly lists skipped lower-priority topics; 30 minutes balances coverage and explanation; 60 minutes covers most meaningful topics with additional relationships and detail. These durations are study-budget targets, not stopwatch guarantees. Generated lessons are source-grounded, runtime-validated, persisted, and reused.

An existing lesson can be studied in a focused presentation mode. Slides are created locally and deterministically from persisted lesson content, so opening or navigating the presentation consumes no additional AI generation. The presentation keeps the normal reading view available and does not silently truncate educational text.

The learner can explicitly request one cached quiz from a persisted lesson. A 10, 30, or 60 minute lesson yields exactly 5, 8, or 10 questions. Questions cover only taught lesson content—not skipped topics or unrelated PDF material. Answers are graded deterministically on the backend, explanations appear only after submission, and missed questions are grouped under supportive lesson-section review guidance. The same quiz can be solved repeatedly without new AI generation; each submitted attempt is stored separately.

The learner can open **Hocaya Sor** from a persisted lesson and continue one lesson-scoped conversation. The teacher uses the validated lesson—not the original PDF or outside knowledge—as its source of truth. Unsupported questions are declined honestly, related lesson sections can be surfaced, and successful exchanges are saved for reopening. A failed generation does not add a partial conversation or consume the persisted daily quota.

The learner can return to Home or Library to reopen saved work. Home shows at most the three newest completed lessons. Library separates completed lessons from uploaded documents, shows lightweight quiz and teacher-conversation metadata, and never regenerates educational content. An analyzed document opens its cached analysis; an uploaded document returns to the explicit analysis-ready step.

V1 has no account, advertising, analytics, notifications, or tracking SDK. Before PDF upload and inside Hocaya Sor, the app explains when content is processed by a third-party AI service. A Turkish privacy policy is available natively and through the public Worker. Installation-scoped records can be reopened, but V1 does not yet provide an installation-wide deletion action; this remains a release-readiness decision rather than a claimed capability.

## Features planned for later

- Page-count policy enforcement
- Detailed notes
- Verified, rights-safe lesson content inside the prepared TYT and KPSS catalog

The prepared-pack catalog publishes a truthful, versioned TYT and KPSS Lisans catalog. KPSS Lisans Tarih and Coğrafya include a first verified historical insight view derived only from ÖSYM's public 10% samples for 2021–2025. The mobile app can deterministically convert that existing topic order into 10, 30, or 60 minute study plans, with omitted topics shown explicitly in shorter plans. These views contain aggregate, source-linked observations—not copied questions, full-exam distributions, success claims, predictions, or AI-generated lessons. Other subjects remain marked as being prepared.

Importance is the topic's weight inside the uploaded document, not a prediction that it will appear on an exam.

## Why voice and TTS are not in V1

Voice interaction and text-to-speech add platform behavior, accessibility, cost, latency, and content-quality concerns that are separate from validating the core study workflow. V1 will focus on reliable text and visual learning experiences. Voice/TTS can be evaluated after the core workflow and user value are proven.
