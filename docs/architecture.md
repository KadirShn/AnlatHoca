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

The Expo application is the user-facing client. It calls the Cloudflare Worker API over HTTPS and must never call an AI provider with privileged credentials directly.

The Worker is the backend boundary. It will eventually validate requests, coordinate application logic, call an AI provider through a provider interface, and access D1 through a dedicated data-access layer.

Shared request and response contracts live in `packages/contracts`. AI prompts are owned by `packages/prompts`. Safe, non-secret shared constants belong in `packages/config`.

## Current foundation

- The mobile app contains only a temporary root screen.
- The API exposes only `GET /` and `GET /health`.
- No AI provider, document processing, authentication, or persistence is configured.
- No Cloudflare resources are bound or provisioned.

## Later integrations

Gemini is planned as the first AI provider, but its SDK and credentials will be added only behind a provider abstraction in a later task. Cloudflare D1 will likewise be introduced later with explicit schema and migration decisions. The original uploaded PDFs should not be permanently stored unless a future requirement explicitly changes that policy.
