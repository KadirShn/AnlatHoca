# Development

## Prerequisites

- Windows, macOS, or Linux supported by Expo and Wrangler
- Node.js 22.13 or newer
- Corepack with pnpm 11.18.0 (the repository pins this version)
- Expo Go or a local Android/iOS simulator for device development

No Cloudflare login is required for local API development in the current foundation.

## Install dependencies

From the repository root:

```powershell
corepack pnpm install
```

## Start the mobile app

```powershell
corepack pnpm dev:mobile
```

The Expo CLI will display options for Expo Go, Android, iOS (macOS required for the local iOS simulator), and web.

## Start the API

```powershell
corepack pnpm dev:api
```

Wrangler starts a local Worker, normally at `http://localhost:8787`. Check the two foundation routes:

```powershell
Invoke-RestMethod http://localhost:8787/
Invoke-RestMethod http://localhost:8787/health
```

## Quality checks

Run strict TypeScript checks across all TypeScript workspaces:

```powershell
corepack pnpm typecheck
```

Run configured lint checks:

```powershell
corepack pnpm lint
```

Validate the Worker bundle locally without deploying:

```powershell
corepack pnpm --filter @anlat-hoca/api build
```

After changing `apps/api/wrangler.jsonc`, regenerate the Worker runtime and binding types:

```powershell
corepack pnpm --filter @anlat-hoca/api generate-types
```
