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

The Worker is the backend boundary. Routes validate public input and delegate database work through a small data-access layer. D1 is accessed through generated `DB` binding types and parameterized prepared statements; route handlers do not embed persistence queries. Future AI calls will use a provider interface.

Shared request and response schemas live in `packages/contracts`. Both mobile and API use these Zod schemas to validate untrusted runtime data. Database records remain internal and are not added to public API contracts. AI prompts are owned by `packages/prompts`. Safe, non-secret shared constants belong in `packages/config`.

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

At this stage, D1 stores only the app-generated installation UUID plus UTC creation and last-seen timestamps. It does not store IP addresses, request headers, hardware or advertising identifiers, phone details, names, email addresses, profiles, credentials, or document data.

The UUID identifies an app installation; it is not a user account, hardware identifier, credential, or proof of identity. Its presence in D1 must never be used as authentication or authorization. Future authorization requires a separate security design. This data minimization does not imply absolute anonymity.

Expo Web uses an in-memory installation identifier because SecureStore is a native secure-storage facility. The current CORS policy permits origins without credential sharing so native development and Expo Web can call the API. Credentials are disabled; the policy must be reconsidered if browser authentication or cookies are introduced.

## D1 schema management

Schema changes are versioned in `apps/api/migrations` and applied with Wrangler's D1 migration workflow. Local Wrangler state lives under the ignored `.wrangler/` directory. The checked-in binding intentionally has no fabricated remote database ID and supports local automatic provisioning. No remote D1 database or production Worker has been created.

## Current foundation

- The mobile app contains a light-theme design system, reusable UI primitives, a three-tab navigation shell, and non-functional placeholder screens for future flows.
- The mobile API URL has one source of truth and missing configuration degrades to a visible, retryable state without blocking navigation.
- The API exposes `GET /`, D1-aware `GET /health`, and persistent guest bootstrap through `POST /session`.
- D1 persistence currently contains only `guest_installations`.
- No AI provider, document processing, authentication, or production cloud deployment is configured.

## Later integrations

Gemini is planned as the first AI provider, but its SDK and credentials will be added only behind a provider abstraction in a later task. Product tables such as documents, lessons, quizzes, users, subscriptions, and exam content will be introduced only with their actual flows and versioned migrations. Original uploaded PDFs should not be permanently stored unless a future requirement explicitly changes that policy.
