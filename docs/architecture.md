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

Shared request and response schemas live in `packages/contracts`. Both mobile and API use these Zod schemas to validate untrusted runtime data. Database records remain internal and are not added to public API contracts. AI prompts are owned by `packages/prompts`. Safe, non-secret shared constants belong in `packages/config`.

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

D1 stores the app-generated installation UUID and, after a successful provider upload, document display metadata plus internal temporary provider references. It does not store PDF bytes, local URIs, IP addresses, request headers, hardware or advertising identifiers, phone details, names, email addresses, profiles, or credentials.

Gemini Files API temporarily stores the original PDF and currently deletes uploaded files automatically according to its service behavior. The returned expiration timestamp is persisted only when supplied by Gemini; the application does not invent one. If D1 insertion fails after upload, the service attempts to delete the temporary provider file without replacing the original error.

The UUID identifies an app installation; it is not a user account, hardware identifier, credential, or proof of identity. Its presence in D1 must never be used as authentication or authorization. Future authorization requires a separate security design. This data minimization does not imply absolute anonymity.

Expo Web uses an in-memory installation identifier because SecureStore is a native secure-storage facility. The current CORS policy permits origins without credential sharing so native development and Expo Web can call the API. Credentials are disabled; the policy must be reconsidered if browser authentication or cookies are introduced.

## D1 schema management

Schema changes are versioned in `apps/api/migrations` and applied with Wrangler's D1 migration workflow. Local Wrangler state lives under the ignored `.wrangler/` directory. The checked-in binding intentionally has no fabricated remote database ID and supports local automatic provisioning. No remote D1 database or production Worker has been created.

## Current foundation

- The mobile app contains local PDF selection, real multipart upload UX, user-driven retry, and a truthful uploaded-document ready state.
- The mobile API URL has one source of truth and missing configuration degrades to a visible, retryable state without blocking navigation.
- The API exposes `GET /`, D1-aware `GET /health`, `POST /session`, and `POST /documents/upload`.
- D1 persists guest installations plus document metadata/internal provider references; it never stores raw PDFs.
- Gemini Files upload prepares a temporary resource only. No content generation, document analysis, authentication, R2 storage, or production cloud deployment is configured.

## Later integrations

Gemini content generation will be added behind a separate provider concern in a later task. Tables for lessons, quizzes, users, subscriptions, and exam content will be introduced only with their actual flows and versioned migrations. Original uploaded PDFs should not be permanently stored unless a future requirement explicitly changes that policy.
