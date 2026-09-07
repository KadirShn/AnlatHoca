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

The Worker is the backend boundary. It will eventually validate requests, coordinate application logic, call an AI provider through a provider interface, and access D1 through a dedicated data-access layer.

Shared request and response schemas live in `packages/contracts`. Both mobile and API use these Zod schemas to validate untrusted runtime data. AI prompts are owned by `packages/prompts`. Safe, non-secret shared constants belong in `packages/config`.

## Current bootstrap flow

```text
App starts
  -> read or create an anonymous installation UUID in Expo SecureStore
  -> validate EXPO_PUBLIC_API_BASE_URL
  -> GET /health
  -> POST /session with the installation UUID
  -> expose initializing / ready / offline / configurationError / error state
```

The installation UUID is persistent on supported native devices and identifies one app installation. It is not a user account, credential, authentication token, or authorization mechanism. Expo Web uses an in-memory identifier because SecureStore is a native secure-storage facility.

`POST /session` validates its JSON body and UUID, then echoes a typed, stateless guest-session result. It does not set cookies, issue tokens, write to D1, or authenticate a user. The API returns a shared JSON error envelope for invalid requests, unsupported methods, unknown routes, and unexpected failures.

The current CORS policy permits origins without credential sharing so native development and Expo Web can call the API. Credentials are disabled; this policy must be reconsidered if browser authentication or cookies are introduced.

## Current foundation

- The mobile app contains a light-theme design system, reusable UI primitives, a three-tab navigation shell, and non-functional placeholder screens for future flows.
- The mobile API URL has one source of truth and missing configuration degrades to a visible, retryable state without blocking navigation.
- The API exposes `GET /`, `GET /health`, and stateless `POST /session`.
- No AI provider, document processing, authentication, or persistence is configured.
- No Cloudflare resources are bound or provisioned.

## Later integrations

Gemini is planned as the first AI provider, but its SDK and credentials will be added only behind a provider abstraction in a later task. Cloudflare D1 will likewise be introduced later with explicit schema and migration decisions. Original uploaded PDFs should not be permanently stored unless a future requirement explicitly changes that policy.
