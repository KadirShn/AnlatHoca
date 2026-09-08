# Architecture

## Intended system

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

Shared request and response schemas live in `packages/contracts`. Both mobile and API use these Zod schemas to validate untrusted runtime data. Database records remain internal and are not added to public API contracts. AI prompts are owned by `packages/prompts`. Safe, non-secret shared constants belong in `packages/config`. Gemini Files upload and document analysis use separate provider abstractions.

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

`GEMINI_ANALYSIS_MODEL` is a non-secret Worker setting and defaults to `gemini-2.5-flash`. File readiness polling is bounded to approximately 35 seconds, provider generation to 75 seconds, and the mobile request to 120 seconds.

The analysis endpoint returns an existing valid analysis before checking provider configuration or calling Gemini. A D1 compare-and-set status transition prevents ordinary simultaneous requests from both starting generation. Explicit failures reset `analyzing` to `uploaded`; a three-minute stale-claim threshold permits recovery from an interrupted Worker request. This is a modest D1 guard, not a globally serialized lock.

Result-screen recovery uses a separate POST read endpoint carrying the installation UUID in JSON. It reads D1 only and never starts model generation. Installation scoping prevents casual cross-installation document lookup, but the installation UUID remains guest scoping rather than strong authentication.

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

D1 stores the app-generated installation UUID, document display metadata, internal temporary provider references, and validated generated analysis. Analysis persistence contains title, summary, topics JSON, schema version, prompt version, and model name. It does not store PDF bytes, local URIs, raw Gemini responses, chain-of-thought, IP addresses, request headers, hardware or advertising identifiers, phone details, names, email addresses, profiles, or credentials.

Gemini Files API temporarily stores the original PDF and currently deletes uploaded files automatically according to its service behavior. The returned expiration timestamp is persisted only when supplied by Gemini; the application does not invent one. If D1 insertion fails after upload, the service attempts to delete the temporary provider file without replacing the original error.

The UUID identifies an app installation; it is not a user account, hardware identifier, credential, or proof of identity. Its presence in D1 must never be used as authentication or authorization. Future authorization requires a separate security design. This data minimization does not imply absolute anonymity.

Expo Web uses an in-memory installation identifier because SecureStore is a native secure-storage facility. The current CORS policy permits origins without credential sharing so native development and Expo Web can call the API. Credentials are disabled; the policy must be reconsidered if browser authentication or cookies are introduced.

## D1 schema management

Schema changes are versioned in `apps/api/migrations` and applied with Wrangler's D1 migration workflow. Local Wrangler state lives under the ignored `.wrangler/` directory. The checked-in binding intentionally has no fabricated remote database ID and supports local automatic provisioning. No remote D1 database or production Worker has been created.

## Current capabilities

- The mobile app contains local PDF selection, real multipart upload UX, explicit analysis UX, and a scrollable real-results screen.
- The mobile API URL has one source of truth and missing configuration degrades to a visible, retryable state without blocking navigation.
- The API additionally exposes explicit analysis generation and cached-analysis read endpoints.
- D1 persists guest installations, document metadata/internal provider references, and validated analysis results; it never stores raw PDFs.
- Gemini document analysis is implemented. Lesson generation, quizzes, Ask Teacher, authentication, R2 storage, and production cloud deployment are not configured.

## Later integrations

Lesson-generation prompts and tables for lessons, quizzes, users, subscriptions, and exam content will be introduced only with their actual flows and versioned migrations. Original uploaded PDFs should not be permanently stored unless a future requirement explicitly changes that policy.
