# Anlat Hoca

Anlat Hoca is an AI-powered mobile study application being built with Expo and Cloudflare Workers.

The repository now supports PDF selection and transfer, temporary Gemini Files preparation, real AI document analysis, topic extraction, runtime-validated structured results, and D1 analysis caching. Lesson generation, quizzes, Ask Teacher, voice, authentication, permanent raw-file storage, and production deployment are not implemented.

## Technology stack

- React Native and Expo SDK 57
- Expo DocumentPicker for local system PDF selection
- TypeScript and Expo Router
- Cloudflare Workers, Hono, and Cloudflare D1
- Zod schemas shared through `packages/contracts`
- pnpm workspaces
- Provider-based AI integration planned, with Gemini as the intended V1 provider

## Repository structure

```text
apps/
  mobile/      Expo mobile application, PDF selection/upload, API client, and bootstrap state
  api/         Worker API, Gemini Files provider, D1 migrations, services, and repositories
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
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm --filter @anlat-hoca/mobile exec pnpm dlx expo-doctor@latest
corepack pnpm --filter @anlat-hoca/api generate-types
corepack pnpm --filter @anlat-hoca/api build
```

See [docs/development.md](docs/development.md) for local D1 inspection, device-specific API URLs, and detailed instructions.

## Current document pipeline

The mobile flow accepts one PDF of at most 15 MiB through the operating system picker and sends it as multipart form data to `POST /documents/upload`. The Worker independently validates the installation UUID, request shape, size, MIME type, and `%PDF-` signature before using the Gemini Files API resumable upload protocol.

The original PDF is temporarily stored by Gemini and is not stored in D1 or R2. D1 contains safe display metadata, internal temporary provider references, and validated analysis output. Public mobile responses contain no Gemini identifiers. Page counting and lesson/content generation beyond document analysis are not implemented.

For local upload development, copy `apps/api/.dev.vars.example` to the ignored `apps/api/.dev.vars` and provide your own server-side `GEMINI_API_KEY`. Never place that key in the mobile environment.

Document analysis uses the server-only `GEMINI_ANALYSIS_MODEL` setting and defaults to `gemini-2.5-flash`. The first successful analysis is stored in D1 with its schema, prompt, and model version. Repeated analyze requests return that validated stored result rather than spending another model call.

The mobile results route reads only the cached D1 analysis. Opening the screen never triggers hidden analysis or regeneration.
