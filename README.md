# Anlat Hoca

Anlat Hoca is an AI-powered mobile study application being built with Expo and Cloudflare Workers.

**This repository is currently in foundation stage.** It contains the monorepo structure, mobile design system and navigation shell, local PDF selection, a typed API client, anonymous installation bootstrap, Worker connectivity, and local D1 persistence for guest installations. PDF upload/processing, Gemini, lesson generation, quizzes, study packs, authentication, and broader product persistence are not implemented. No production Cloudflare deployment or remote D1 database has been created.

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
  mobile/      Expo mobile application, local PDF selection, API client, and bootstrap state
  api/         Cloudflare Worker API, D1 migrations, and data-access layer
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

## Current document-selection boundary

The mobile flow accepts one PDF of at most 15 MB through the operating system document picker. It validates available metadata (name, size, and MIME type, with a limited extension fallback when MIME data is absent or generic) and keeps the selected URI only in screen memory.

No PDF is uploaded, analyzed, parsed, or stored by the backend. Page count is not inspected on-device; authoritative content, signature, size, and page-limit checks belong to the future backend processing boundary. The system picker does not require broad Android storage permissions.
