# Anlat Hoca

Anlat Hoca is an AI-powered mobile study application being built with Expo and Cloudflare Workers.

**This repository is currently in foundation stage.** It contains the monorepo structure, mobile design system and navigation shell, a typed API client, anonymous installation bootstrap, and a stateless guest-session API handshake. AI, PDF analysis, lessons, notes, quizzes, study packs, authentication, and persistence are not implemented.

## Technology stack

- React Native and Expo SDK 57
- TypeScript and Expo Router
- Cloudflare Workers and Hono
- Zod schemas shared through `packages/contracts`
- pnpm workspaces
- Cloudflare D1 planned for a later phase
- Provider-based AI integration planned, with Gemini as the intended V1 provider

## Repository structure

```text
apps/
  mobile/      Expo mobile application, API client, and bootstrap state
  api/         Cloudflare Worker API
packages/
  contracts/   Shared runtime schemas and TypeScript API contracts
  prompts/     AI prompt ownership and conventions
  config/      Safe shared configuration and constants
docs/          Product, architecture, and development documentation
```

## Development setup

Prerequisites are Node.js 22.13 or newer and Corepack/pnpm. Install dependencies and create the mobile environment file:

```powershell
corepack pnpm install
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
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm --filter @anlat-hoca/mobile exec pnpm dlx expo-doctor@latest
corepack pnpm --filter @anlat-hoca/api generate-types
corepack pnpm --filter @anlat-hoca/api build
```

See [docs/development.md](docs/development.md) for device-specific API URLs and detailed local instructions.
