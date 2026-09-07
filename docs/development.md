# Development

## Prerequisites

- Windows, macOS, or Linux supported by Expo and Wrangler
- Node.js 22.13 or newer
- Corepack with pnpm 11.18.0 (the repository pins this version)
- Expo Go or a local Android/iOS simulator for device development

No Cloudflare login is required for local API development.

## Install dependencies

From the repository root:

```powershell
corepack pnpm install
```

## Configure the mobile API URL

Create the ignored local environment file from the tracked example:

```powershell
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Set `EXPO_PUBLIC_API_BASE_URL` to a URL the target can reach:

- Physical device: `http://YOUR_COMPUTER_LAN_IP:8787`
- Android emulator: `http://10.0.2.2:8787`
- iOS simulator or web on the same computer: `http://localhost:8787`

On Windows, run `ipconfig` and use the IPv4 address of the active Wi-Fi or Ethernet adapter. On macOS or Linux, use the active network interface shown in system network settings (or tools such as `ip addr`/`ifconfig`). The phone and computer must be on the same trusted network.

The development API command listens on local network interfaces. Allow port 8787 through the local firewall only on trusted networks if the operating system asks.

Every `EXPO_PUBLIC_` value is embedded in the client bundle. Never place an API key, token, password, or other secret in this file. Restart Expo after changing the value.

If the variable is absent or invalid, the app remains navigable and Settings shows a configuration error with a retry action.

## Start the API

```powershell
corepack pnpm dev:api
```

Wrangler serves the Worker on port 8787 without requiring login. Local checks:

```powershell
Invoke-RestMethod http://localhost:8787/
Invoke-RestMethod http://localhost:8787/health
Invoke-RestMethod -Method Post -Uri http://localhost:8787/session -ContentType application/json -Body '{"installationId":"550e8400-e29b-41d4-a716-446655440000"}'
```

## Start the mobile app

In a separate terminal:

```powershell
corepack pnpm dev:mobile
```

The Expo CLI displays options for Expo Go, Android, iOS (macOS required for the local iOS simulator), and web.

## Quality checks

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm --filter @anlat-hoca/mobile exec pnpm dlx expo-doctor@latest
corepack pnpm --filter @anlat-hoca/api build
```

After changing `apps/api/wrangler.jsonc`, regenerate Worker runtime and binding types:

```powershell
corepack pnpm --filter @anlat-hoca/api generate-types
```
