# Anlat Hoca

Anlat Hoca is an AI-powered mobile study application being built with Expo and Cloudflare Workers.

The repository supports PDF selection and transfer, temporary Gemini Files preparation, real AI document analysis, topic extraction, time-aware 10/30/60 minute lesson generation, runtime-validated structured results, and persistent D1 caching. The Worker and D1 backend are deployed to Cloudflare production. Slide presentation mode, quizzes, Ask Teacher, voice, exam packs, authentication, permanent raw-file storage, and store distribution are not implemented.

## Technology stack

- React Native and Expo SDK 57
- Expo DocumentPicker for local system PDF selection
- TypeScript and Expo Router
- Cloudflare Workers, Hono, and Cloudflare D1
- Zod schemas shared through `packages/contracts`
- pnpm workspaces
- Provider-based AI integration, with Gemini as the deployed V1 provider

## Repository structure

```text
apps/
  mobile/      Expo mobile application, document flow, lesson screens, API client, and bootstrap state
  api/         Worker API, Gemini providers, D1 migrations, services, and repositories
packages/
  contracts/   Shared runtime schemas and TypeScript API contracts
  prompts/     AI prompt ownership and conventions
  config/      Safe shared configuration and constants
docs/          Product, architecture, and development documentation
```

## Development setup

Prerequisites are Node.js 22.13 or newer and Corepack/pnpm. Install dependencies, apply local D1 migrations, and create the mobile environment file:

```powershell
corepack pnpm install
corepack pnpm db:migrate:local
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Replace `YOUR_COMPUTER_LAN_IP` with an address reachable from the device. `EXPO_PUBLIC_` values are bundled into the app and must never contain secrets.

Start the API and mobile app in separate terminals:

```powershell
corepack pnpm dev:api
corepack pnpm dev:mobile
```

## Common commands

```powershell
corepack pnpm db:migrate:local
corepack pnpm db:migrations:list:local
corepack pnpm db:migrations:list:remote
corepack pnpm db:migrate:remote
corepack pnpm deploy:api
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm --filter @anlat-hoca/mobile exec pnpm dlx expo-doctor@latest
corepack pnpm --filter @anlat-hoca/api generate-types
corepack pnpm --filter @anlat-hoca/api build
```

See [docs/development.md](docs/development.md) for local D1 inspection, device-specific API URLs, and detailed instructions.

## Current document pipeline

The mobile flow accepts one PDF of at most 15 MiB through the operating system picker and sends it as multipart form data to `POST /documents/upload`. The Worker independently validates the installation UUID, request shape, size, MIME type, and `%PDF-` signature before using the Gemini Files API resumable upload protocol.

The original PDF is temporarily stored by Gemini and is not stored in D1 or R2. D1 contains safe display metadata, internal temporary provider references, validated analysis output, and validated lesson artifacts. Public mobile responses contain no Gemini identifiers. Page counting and slide presentation mode are not implemented.

For local upload development, copy `apps/api/.dev.vars.example` to the ignored `apps/api/.dev.vars` and provide your own server-side `GEMINI_API_KEY`. Never place that key in the mobile environment.

Document analysis uses the server-only `GEMINI_ANALYSIS_MODEL` setting and defaults to `gemini-3.6-flash`. The first successful analysis is stored in D1 with its schema, prompt, and model version. Repeated analyze requests return that validated stored result rather than spending another model call.

The mobile results route reads only the cached D1 analysis. Opening the screen never triggers hidden analysis or regeneration.

## Current lesson pipeline

After analysis, the learner explicitly chooses a 10, 30, or 60 minute study budget. The Worker combines the persisted analysis with the still-available temporary Gemini PDF, requests structured Turkish teaching content, validates it with shared Zod schemas and duration tolerances, and persists the validated lesson in D1.

The cache identity includes document, duration, schema version, prompt version, and model. Repeating the same request returns the persisted lesson without another Gemini call. Opening `/lesson/[lessonId]` reads D1 only. A D1 generation claim limits rapid duplicate requests without adding paid coordination services.
