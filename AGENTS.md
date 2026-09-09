# Repository instructions for Codex agents

Future Codex agents must read this file before making any repository change. These rules apply to the entire monorepo unless a more specific `AGENTS.md` adds stricter local guidance.

## Project

Anlat Hoca is an AI-powered React Native study application. PDF transfer and runtime-validated document analysis are implemented and the backend is deployed to Cloudflare production; later learning features remain intentionally out of scope.

## Architecture

- Mobile: React Native + Expo + TypeScript
- Backend: Cloudflare Workers + Hono + TypeScript
- Database: Cloudflare D1
- AI: provider-based architecture; Gemini is the deployed V1 provider

The mobile client communicates with the deployed Cloudflare Worker API. The API accesses the production D1 database through a repository layer and coordinates Gemini through the provider abstraction. Local Wrangler development still uses local D1 state by default.

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
- Route all D1 access through a focused data-access or repository layer.
- Use prepared, parameterized D1 statements for every dynamic value; never interpolate request data into SQL.
- Every database schema change requires a sequential, versioned migration.
- Never mutate a production database schema manually outside the migration workflow.
- Store no more user or device data than the current approved feature requires.
- Never request broad Android storage permissions when the system document picker is sufficient.
- Never trust a file extension alone for server-side file validation.
- Treat mobile-side document checks as UX validation, not as a security boundary.
- Do not persist local document URIs as durable backend identifiers.
- Do not unnecessarily load large documents entirely into JavaScript memory.
- AI and provider secrets are Worker-only; mobile must never communicate directly with AI providers.
- Validate every user file's size, MIME type, and signature at the server boundary.
- Verify the `%PDF-` signature before accepting a PDF; filenames and extensions are display metadata only.
- Never store raw PDF bytes in D1.
- Keep provider file names, URIs, expiration data, and other implementation metadata out of public API contracts.
- Never log uploaded file contents, raw multipart bodies, API keys, or full installation identifiers.
- Keep file upload and AI generation as separate application concerns.
- Clean up temporary provider resources after partial failures when practical without masking the original failure.
- Runtime-validate every AI-generated result before trusting, persisting, or returning it.
- Gemini structured output is untrusted until the shared Zod schema passes.
- Keep every AI prompt in `packages/prompts` and persist prompt/schema versions with generated artifacts where appropriate.
- Reuse valid persisted AI results instead of regenerating them without a product reason.
- Never present document-relative importance as exam probability unless explicit source data supports that claim.
- Keep AI output grounded in source material and do not turn unsupported assumptions into facts.
- Never persist chain-of-thought or expose raw provider responses through public contracts.
- Lesson generation must be grounded in both the persisted document analysis and the temporary source PDF while it remains available.
- Requested lesson duration changes content prioritization; 10, 30, and 60 minutes are approximate study budgets, not timing guarantees.
- Never pretend omitted lesson topics were covered; return and display skipped topics honestly.
- Persist and reuse validated lesson artifacts. Viewing or reopening a lesson must never regenerate it.
- Store prompt, schema, and model versions with generated AI artifacts.
- Never persist raw model responses, hidden reasoning, prompt bodies, or chain-of-thought.
- Validate migrations and affected behavior locally before applying any production schema change.
- Presentation mode must never regenerate AI content; it is a deterministic mobile projection of a persisted lesson.
- Do not store presentation-only layout or navigation state in D1 without an explicit product requirement.
- Never silently truncate lesson content to fit a presentation layout; split it deterministically and preserve its meaning and order.
- Future TTS should attach narration to deterministic slide narration text instead of regenerating educational content.
- Presentation accessibility and readable text scaling take priority over forcing every slide onto one physical screen.

## Working expectations

- Inspect the nearest `AGENTS.md` and relevant package configuration before editing.
- Preserve unrelated user changes and existing Git history.
- Use workspace scripts from the repository root when available.
- Keep secrets in approved local or platform secret stores, never in tracked source or configuration.
- Regenerate Worker bindings with `pnpm --filter @anlat-hoca/api generate-types` after changing `wrangler.jsonc`.

## Production operations

- Inspect existing Cloudflare resources before creation and never create ambiguous duplicates.
- Review pending remote D1 migrations before production deployment or schema changes.
- Use explicit local and remote D1 flags; ordinary local development must not mutate production.
- Store deployed Worker credentials only as Cloudflare secrets; keep .dev.vars local and ignored.
- Treat the Worker HTTPS URL as public configuration and provide it to mobile through EXPO_PUBLIC_API_BASE_URL.
- Never place Gemini credentials in mobile configuration, EXPO_PUBLIC values, EAS, or documentation.
- Keep production operations compatible with Cloudflare free limits unless paid services receive explicit approval.
