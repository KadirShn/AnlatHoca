# Repository instructions for Codex agents

Future Codex agents must read this file before making any repository change. These rules apply to the entire monorepo unless a more specific `AGENTS.md` adds stricter local guidance.

## Project

Anlat Hoca is an AI-powered React Native study application. The repository is currently in its foundation stage; product features are intentionally not implemented yet.

## Architecture

- Mobile: React Native + Expo + TypeScript
- Backend: Cloudflare Workers + Hono + TypeScript
- Database: Cloudflare D1
- AI: provider-based architecture; Gemini is planned as the V1 provider

The mobile client communicates with the Cloudflare Worker API. The API will later coordinate AI providers and D1. Gemini and D1 are not integrated yet.

## Workspace boundaries

- `apps/mobile`: Expo Router mobile client and mobile-only code
- `apps/api`: Cloudflare Worker HTTP API and backend-only code
- `packages/contracts`: API contracts shared by clients and services
- `packages/prompts`: centrally managed AI prompt documentation and, later, prompt definitions
- `packages/config`: safe, non-secret shared configuration and constants
- `docs`: product, architecture, and development documentation

## Mandatory rules

- Never expose AI API keys or backend secrets in React Native code.
- Mobile clients must call our backend instead of AI providers directly.
- Never commit `.env` files containing secrets.
- Shared API contracts belong in `packages/contracts`.
- AI prompts belong in `packages/prompts` and must not be scattered through application code.
- Validate external data before trusting it; API boundary schemas belong in `packages/contracts`.
- Treat anonymous installation IDs as identifiers only, never as authentication or authorization.
- Store installation identifiers with the platform secure-storage abstraction on native devices.
- Treat every `EXPO_PUBLIC_` value as public client-bundle data and never place secrets in it.
- Keep the mobile API base URL centralized; do not scatter environment-variable reads or endpoint origins.
- Route mobile networking through the centralized API client; screens must not call `fetch` or backend URLs directly.
- Runtime-validate every API response used by mobile with schemas from `packages/contracts`.
- Return predictable shared JSON error envelopes from API routes and do not expose internal error details.
- Do not display or log full installation identifiers in normal user-facing flows.
- Prefer TypeScript strict mode.
- Avoid `any` unless strongly justified.
- Keep components small and reusable.
- Do not introduce paid services without explicit approval.
- Do not introduce new major dependencies without a clear reason.
- Original uploaded PDFs should not be permanently stored unless a future requirement explicitly changes this.
- AI integrations must use a provider abstraction.
- Mobile UI must always include loading, empty, success, and error states when applicable.
- Do not bypass lint or TypeScript errors just to make builds pass.
- Fix root causes rather than hiding failures.
- Maintain separation between mobile UI, API logic, AI providers, data access, and shared contracts.
- Prefer simple solutions over premature infrastructure.
- Update documentation when architecture changes.
- Do not add cloud bindings or provision cloud resources without an approved requirement.

## Working expectations

- Inspect the nearest `AGENTS.md` and relevant package configuration before editing.
- Preserve unrelated user changes and existing Git history.
- Use workspace scripts from the repository root when available.
- Keep secrets in approved local or platform secret stores, never in tracked source or configuration.
- Regenerate Worker bindings with `pnpm --filter @anlat-hoca/api generate-types` after changing `wrangler.jsonc`.
