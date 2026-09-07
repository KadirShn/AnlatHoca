# Anlat Hoca

Anlat Hoca is an AI-powered mobile study application being built with Expo and Cloudflare Workers.

**This repository is currently in foundation stage.** It contains the monorepo structure, a temporary mobile screen, and two API health endpoints. AI, PDF analysis, lessons, notes, quizzes, study packs, authentication, and persistence are not implemented.

## Technology stack

- React Native and Expo SDK 57
- TypeScript and Expo Router
- Cloudflare Workers and Hono
- pnpm workspaces
- Cloudflare D1 planned for a later phase
- Provider-based AI integration planned, with Gemini as the intended V1 provider

## Repository structure

```text
apps/
  mobile/      Expo mobile application
  api/         Cloudflare Worker API
packages/
  contracts/   Shared TypeScript API contracts
  prompts/     AI prompt ownership and conventions
  config/      Safe shared configuration and constants
docs/          Product, architecture, and development documentation
```

## Development setup

Prerequisites are Node.js 22.13 or newer and Corepack/pnpm. Then install all workspace dependencies:

```powershell
corepack pnpm install
```

Start the mobile application:

```powershell
corepack pnpm dev:mobile
```

Start the API locally:

```powershell
corepack pnpm dev:api
```

## Common commands

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm --filter @anlat-hoca/api generate-types
corepack pnpm --filter @anlat-hoca/api build
```

See [docs/development.md](docs/development.md) for detailed local instructions.
