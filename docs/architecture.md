# Architecture

## Current production system

```text
Expo mobile application
          |
          v
Cloudflare Worker API (Hono)
       /             \
      v               v
AI provider          Cloudflare D1
```

The Expo application is the user-facing client. It calls the Cloudflare Worker API over HTTP(S) and must never call an AI provider with privileged credentials directly.

The Worker is the backend boundary. Routes validate public input and delegate orchestration and database work through service and repository layers. D1 is accessed through generated `DB` binding types and parameterized prepared statements; route handlers do not embed persistence queries. Gemini Files API calls are isolated behind a temporary-file provider interface.

Shared request and response schemas live in `packages/contracts`. Both mobile and API use these Zod schemas to validate untrusted runtime data. Database records remain internal and are not added to public API contracts. AI prompts are owned by `packages/prompts`. Safe, non-secret shared constants belong in `packages/config`. Gemini Files upload, document analysis, and lesson generation use focused provider abstractions.

## Prepared exam pack catalog flow

```text
Versioned static registry in packages/config
  -> GET /exam-packs or GET /exam-packs/:packId
  -> strict shared response schema
  -> centralized mobile API client
  -> /exams and /exams/[examId]
```

The initial `tyt` and `kpss-lisans` catalog is product configuration, not user data, so reads do not access D1 or call an AI provider. The registry validates required text, allowed status values, unique pack IDs, and unique subject IDs at startup. A future research-backed content version may attach internal source title, publisher, URL, and access-date metadata; no source is displayed or implied until verified provenance actually exists.

## Current Library read flow

```text
Home (3 lessons) / Library (20 lessons + 20 documents)
  -> POST /library with installationId and bounded limits
  -> strict shared request validation
  -> two parameterized D1 aggregate queries
  -> newest-first public summaries
  -> runtime-validated mobile response
  -> existing cached lesson / analysis / ready routes
```

The Library repository scopes both queries by the anonymous installation identifier. A single lesson query joins analysis display data, quiz availability and latest-attempt metadata, and teacher-thread message counts; a single document query joins analysis metadata and completed-lesson counts. This avoids per-row database calls. Limits default to 20 and cannot exceed 50; ordering is deterministic by `created_at DESC, id DESC`.

The endpoint is strictly read-only and has no AI-provider dependency. It does not create sessions, documents, lessons, quizzes, attempts, threads, or messages. Existing indexes support the ownership joins and foreign-key lookups for this bounded V1 result set, so no schema migration is required.

## Current document upload flow

```text
/document/upload
  -> Expo system document picker (one PDF)
  -> local metadata checks
  -> multipart POST /documents/upload
  -> Worker size, MIME, UUID, and %PDF- signature validation
  -> Gemini Files API resumable temporary upload
  -> D1 document metadata/reference insert
  -> /document/ready with public Anlat Hoca document ID
```

The selected local URI remains screen-local and is never placed in D1 or route parameters. Mobile wraps it with Expo FileSystem's modern `File` API and `expo/fetch`, allowing FormData upload without base64 or a JavaScript string. The upload timeout is 120 seconds; ordinary JSON requests retain their shorter timeout. Retries are user-driven to avoid duplicate external files.

The Worker accepts `application/pdf`, or `application/octet-stream` only when the signature is valid, and reads only the initial bytes required for `%PDF-`. Mobile checks are not a security boundary. Page count is intentionally not parsed yet. Android uses the system picker without broad storage permissions.

The Gemini API key exists only as the Worker secret `GEMINI_API_KEY` and is sent in the `x-goog-api-key` header. It is never included in URLs, logs, mobile configuration, responses, or D1.

## Current document analysis flow

```text
/document/ready
  -> explicit POST /documents/:documentId/analyze
  -> document + installation ownership lookup
  -> cached analysis lookup
  -> atomic uploaded/analyzing claim
  -> bounded Gemini Files state polling
  -> Gemini structured JSON generation
  -> JSON parse + shared Zod validation
  -> D1 analysis persistence + analyzed state
  -> /document/:documentId/analysis
  -> cached-only POST /documents/:documentId/analysis
```

The generation provider sends the temporary Gemini file URI and the versioned prompt to the configured model. The output is constrained with a deliberately Gemini-compatible JSON Schema and then validated again with the stricter shared Zod schema. Raw Gemini responses, token metadata, chain-of-thought, prompts, and provider identifiers are not exposed publicly or persisted as analysis output.

`GEMINI_ANALYSIS_MODEL` is a non-secret Worker setting and defaults to `gemini-3.6-flash`. File readiness polling is bounded to approximately 35 seconds, provider generation to 75 seconds, and the mobile request to 120 seconds.

The analysis endpoint returns an existing valid analysis before checking provider configuration or calling Gemini. A D1 compare-and-set status transition prevents ordinary simultaneous requests from both starting generation. Explicit failures reset `analyzing` to `uploaded`; a three-minute stale-claim threshold permits recovery from an interrupted Worker request. This is a modest D1 guard, not a globally serialized lock.

Result-screen recovery uses a separate POST read endpoint carrying the installation UUID in JSON. It reads D1 only and never starts model generation. Installation scoping prevents casual cross-installation document lookup, but the installation UUID remains guest scoping rather than strong authentication.

## Current lesson generation flow

```text
/document/:documentId/analysis
  -> explicit duration choice: 10, 30, or 60 minutes
  -> POST /documents/:documentId/lessons
  -> ownership + persisted analysis validation
  -> current lesson cache lookup
  -> D1 generation claim
  -> bounded Gemini file readiness check
  -> persisted analysis + temporary source PDF + versioned prompt
  -> Gemini structured JSON generation
  -> JSON parse + shared Zod + duration-total validation
  -> D1 lesson persistence
  -> /lesson/:lessonId
  -> POST /lessons/:lessonId/detail (D1 only)
```

`GEMINI_LESSON_MODEL` is independent from `GEMINI_ANALYSIS_MODEL`; both currently default to `gemini-3.6-flash`. The lesson prompt and public schema are versioned as `v1`. Section minute totals must fall within 8-12, 26-34, or 54-66 minutes for the selected 10, 30, or 60 minute study budget.

The cache identity is `(document_id, duration_minutes, schema_version, prompt_version, model)`. A unique D1 index and token-owned generation claim prevent ordinary duplicate requests. Interrupted claims can be reclaimed after three minutes; this is a small D1-compatible guard rather than a globally serialized lock. Provider failures release their claim. Cached lessons are returned before source-expiration checks, while uncached generation requires the temporary PDF to remain available.

## Current presentation flow

```text
/lesson/:lessonId
  -> Sunum Modunda Çalış
  -> /lesson/:lessonId/presentation
  -> existing POST /lessons/:lessonId/detail
  -> persisted lesson + mobile-only deterministic adapter
  -> intro/objectives/section/explanation/recap/skipped slides
```

Presentation mode is a mobile rendering concern. It reuses the existing installation-scoped, D1-only lesson detail endpoint and never calls Gemini. The adapter preserves lesson and section order, creates stable slide IDs, and splits long explanations for display without mutating the persisted lesson. Explanation slides expose deterministic internal narration text so a future TTS layer can attach to existing educational content instead of regenerating it.

The current slide index is screen-local. Swipe navigation uses native horizontal paged `FlatList`; explicit controls and text/progress indicators remain available. No presentation artifact, layout state, or completion state is stored in D1.

## Current quiz flow

```text
/lesson/:lessonId
  -> explicit Beni Sına action
  -> POST /lessons/:lessonId/quiz
  -> installation-scoped persisted lesson
  -> current quiz cache lookup + lightweight D1 generation claim
  -> versioned lesson-only prompt + Gemini structured JSON
  -> Zod + question-count/section/duplicate semantic validation
  -> server-generated question IDs + internal answer-key persistence
  -> sanitized public quiz without answers or explanations
  -> POST /quizzes/:quizId/submit
  -> deterministic grading + weak-section aggregation
  -> immutable quiz_attempts row
  -> /quiz/:attemptId/result
```

`GEMINI_QUIZ_MODEL` is independent from the analysis and lesson settings and defaults to `gemini-3.6-flash`. Quiz prompt/schema versioning is `v1`. The exact question counts are 5, 8, and 10 for 10, 30, and 60 minute lessons.

Quiz generation retries only clearly transient Gemini failures (`429`, `500`, `502`, `503`, `504`, or a network transport failure). It makes at most three total upstream attempts with short exponential backoff inside the existing provider timeout. Authentication, configuration, schema, and content-validation failures are not retried.

The quiz source is the validated persisted lesson; no temporary PDF is needed and `skippedTopics` is intentionally excluded. The cache identity is `(lesson_id, schema_version, prompt_version, model)`. One internal quiz can have many immutable attempts. Opening, retrying, submitting, or reopening a result never calls Gemini.

## Current Hocaya Sor flow

```text
/lesson/:lessonId
  -> Hocaya Sor
  -> POST /lessons/:lessonId/teacher/thread (D1 only)
  -> persisted chronological history
  -> explicit POST /lessons/:lessonId/teacher/messages
  -> ownership + 30-question UTC-day limit
  -> persisted lesson + at most six recent conversation turns
  -> versioned lesson-only prompt + Gemini structured JSON
  -> Zod + related-section semantic validation
  -> atomic user/assistant D1 batch
  -> assistant answer, related sections, and follow-up suggestions
```

`GEMINI_TEACHER_MODEL` is independent from analysis, lesson, and quiz settings and defaults to `gemini-3.6-flash`. The prompt version is `v1`. The source PDF and Gemini Files API are never used: the validated persisted lesson is the sole teaching source. `skippedTopics` is labeled only as content not included in the lesson, so it may support an honest refusal but never factual teaching.

Each installation has one `teacher_threads` row per lesson. `teacher_messages.sequence` provides deterministic ordering independent of timestamp precision. Only the most recent six user/assistant turns are sent as conversational context. The provider must return a 1–3000 character answer, zero to three valid section indexes, and zero to three short follow-up questions. Public responses map indexes to lesson section titles and omit model/prompt metadata.

The Worker enforces a maximum 1200-character trimmed question and 30 persisted user questions per installation per UTC day. A provider call occurs before persistence; after validation, the user and assistant messages are written in one D1 batch. Provider failures therefore leave no dangling user message and do not consume the persisted quota. Opening a thread or reading `/teacher-threads/:threadId/detail` is D1-only and never calls Gemini.

`lesson_quizzes.questions_json` is an internal entity containing correct option indexes, explanations, and source section indexes. Public generation/detail responses deliberately map it to question IDs, text, and four options only. Submission accepts selected option indexes only; the Worker calculates the rounded integer score and sorts review sections by wrong-answer count, then original lesson order.

## Current bootstrap flow

```text
App starts
  -> read or create an anonymous installation UUID in Expo SecureStore
  -> validate EXPO_PUBLIC_API_BASE_URL
  -> GET /health (includes a non-mutating D1 availability query)
  -> POST /session with the installation UUID
  -> Worker validates the request
  -> installation repository atomically inserts or updates guest_installations
  -> expose initializing / ready / offline / configurationError / error state
```

`POST /session` preserves the existing public response. The D1 repository uses an atomic SQLite UPSERT: a first call sets `created_at` and `last_seen_at`; later calls preserve `created_at` and update only `last_seen_at`. The endpoint does not set cookies, issue tokens, or create authenticated server-side sessions.

## Stored data and privacy boundary

D1 stores the app-generated installation UUID, document display metadata, internal temporary provider references, validated analysis and lesson artifacts, validated internal quizzes, minimal immutable quiz attempts, and validated teacher conversation messages. Teacher assistant rows retain only the answer, resolved public section metadata, suggested follow-ups, and internal prompt/model version labels. Persistence does not contain PDF bytes, prompt bodies, local URIs, raw Gemini responses, chain-of-thought, IP addresses, request headers, hardware or advertising identifiers, phone details, names, email addresses, profiles, or credentials.

Gemini Files API temporarily stores the original PDF and currently deletes uploaded files automatically according to its service behavior. The returned expiration timestamp is persisted only when supplied by Gemini; the application does not invent one. If D1 insertion fails after upload, the service attempts to delete the temporary provider file without replacing the original error.

The UUID identifies an app installation; it is not a user account, hardware identifier, credential, or proof of identity. Its presence in D1 must never be used as authentication or authorization. Future authorization requires a separate security design. This data minimization does not imply absolute anonymity.

Expo Web uses an in-memory installation identifier because SecureStore is a native secure-storage facility. The current CORS policy permits origins without credential sharing so native development and Expo Web can call the API. Credentials are disabled; the policy must be reconsidered if browser authentication or cookies are introduced.

## D1 schema management

Schema changes are versioned in `apps/api/migrations` and applied with Wrangler's D1 migration workflow. Local Wrangler state lives under the ignored `.wrangler/` directory. The checked-in `DB` binding points to the production `anlat-hoca-prod` database. Ordinary `wrangler dev` and `--local` migration commands continue to use isolated local state; only explicit `--remote` operations target production.

## Current capabilities

- The mobile app contains local PDF selection, real multipart upload UX, explicit analysis UX, duration selection, scrollable lesson reading, interactive presentation mode, one-question-at-a-time quiz solving, persisted result review, and lesson-scoped teacher chat.
- The mobile API URL has one source of truth and missing configuration degrades to a visible, retryable state without blocking navigation.
- The API exposes explicit analysis, lesson, quiz, and teacher-answer generation plus D1-only detail, grading, history, and attempt-reopen endpoints.
- D1 persists guest installations, document metadata/internal provider references, validated analyses, versioned lesson/quiz cache entries, immutable quiz attempts, and ordered teacher conversations; it never stores raw PDFs.
- Gemini document analysis, lesson generation, lesson-grounded quiz generation, and lesson-grounded teacher answers run behind separate provider abstractions. Presentation mode is derived locally from cached lessons. Voice/TTS, authentication, R2 storage, and store distribution are not configured.
- KPSS Lisans Tarih/Coğrafya historical insights are strict, source-controlled configuration with a separate historicalDataVersion. The Worker computes totals from one-topic observation mappings and serves them without D1 or Gemini. The mobile client runtime-validates the response and labels its official-public-sample coverage as partial.

## Historical exam insight boundary

Source-controlled ÖSYM metadata, topic taxonomy, and item-to-primary-topic mappings pass through strict Zod dataset validation. Deterministic totals, averages, years appeared, and yearly breakdowns are then exposed by GET /exam-packs/:packId/subjects/:subjectId/insights and runtime-validated again by mobile.

No copyrighted question text, option, answer, screenshot, or PDF is stored. Missing verified coverage returns an explicit unavailable error rather than an empty or fabricated statistical result. This flow adds no table and leaves D1 migrations at 0001–0006.

## Later integrations

Tables for users, subscriptions, and exam content will be introduced only with their actual flows and versioned migrations. Original uploaded PDFs should not be permanently stored unless a future requirement explicitly changes that policy.
