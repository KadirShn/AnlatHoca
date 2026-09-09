# Development

## Prerequisites

- Windows, macOS, or Linux supported by Expo and Wrangler
- Node.js 22.13 or newer
- Corepack with pnpm 11.18.0 (the repository pins this version)
- Expo Go or a local Android/iOS simulator for device development

No Cloudflare login or remote D1 database is required for local development.

## Configure the local Gemini secret

Copy the tracked example to Wrangler's ignored local secret file:

```powershell
Copy-Item apps/api/.dev.vars.example apps/api/.dev.vars
```

Replace the placeholder with your own key:

```text
GEMINI_API_KEY=replace_with_your_gemini_api_key
```

`apps/api/.dev.vars` must never be committed. The key is Worker-only: do not place it in `apps/mobile/.env` or any `EXPO_PUBLIC_` variable. The deployed Worker uses the Cloudflare secret binding `GEMINI_API_KEY`; do not modify remote secrets during ordinary local development.

Without the local key, the Worker still starts and its root, health, and session endpoints work. A valid PDF upload returns the structured `AI_NOT_CONFIGURED` response.

The non-secret `GEMINI_ANALYSIS_MODEL`, `GEMINI_LESSON_MODEL`, and `GEMINI_QUIZ_MODEL` Worker variables independently default to `gemini-3.6-flash` in `wrangler.jsonc`. Change only the relevant server-side setting to test an approved compatible model; never expose these settings through mobile configuration.

## Install dependencies

From the repository root:

```powershell
corepack pnpm install
```

## Prepare the local D1 database

Apply all pending migrations to Wrangler's local D1 database:

```powershell
corepack pnpm db:migrate:local
```

List pending local migrations:

```powershell
corepack pnpm db:migrations:list:local
```

Inspect persisted guest installations when useful:

```powershell
corepack pnpm --filter @anlat-hoca/api exec wrangler d1 execute DB --local --command "SELECT installation_id, created_at, last_seen_at FROM guest_installations ORDER BY created_at;"
```

Inspect uploaded document metadata when a real local Gemini upload has succeeded:

```powershell
corepack pnpm --filter @anlat-hoca/api exec wrangler d1 execute DB --local --command "SELECT id, installation_id, original_name, size_bytes, mime_type, provider, provider_file_name, provider_file_uri, provider_expires_at, status, created_at, updated_at FROM documents ORDER BY created_at;"
```

The `documents` table contains metadata and temporary Gemini references only. It never contains PDF bytes or mobile URIs.

Inspect persisted analysis product output and internal version metadata:

```powershell
corepack pnpm --filter @anlat-hoca/api exec wrangler d1 execute DB --local --command "SELECT document_id, schema_version, prompt_version, model, title, summary, topics_json, created_at, updated_at FROM document_analyses ORDER BY created_at;"
```

`document_analyses` contains only validated title/summary/topic output and version metadata. It does not contain the raw Gemini response, PDF bytes, prompt text, chain-of-thought, or provider credentials.

Inspect validated lesson artifacts and cache metadata without selecting lesson content:

```powershell
corepack pnpm --filter @anlat-hoca/api exec wrangler d1 execute DB --local --command "SELECT id, document_id, duration_minutes, schema_version, prompt_version, model, status, created_at, updated_at FROM document_lessons ORDER BY created_at;"
```

`document_lessons` stores validated lesson JSON and versioned cache metadata. It does not store the prompt body, raw Gemini response, chain-of-thought, PDF bytes, or credentials.

Inspect quiz cache metadata without printing internal questions or answer keys:

```powershell
corepack pnpm --filter @anlat-hoca/api exec wrangler d1 execute DB --local --command "SELECT id, lesson_id, schema_version, prompt_version, model, generation_status, created_at, updated_at FROM lesson_quizzes ORDER BY created_at;"
```

Inspect attempt totals without printing selected answers:

```powershell
corepack pnpm --filter @anlat-hoca/api exec wrangler d1 execute DB --local --command "SELECT id, quiz_id, correct_count, total_questions, score_percent, created_at FROM quiz_attempts ORDER BY created_at;"
```

`lesson_quizzes.questions_json` contains the internal answer key and must never be copied directly into an API response or logs. `quiz_attempts` stores selected-answer JSON and deterministic result totals, not duplicated quiz content.

Wrangler persists local binding data under `apps/api/.wrangler/`, which is ignored by Git. Although the checked-in `DB` binding names the production database, `wrangler dev` and commands with `--local` use isolated local state. Do not run remote migration or deployment commands as part of normal local development.

Production schema changes must continue to use sequential migration files and the explicit remote migration scripts above.

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

Run migrations first, then start the Worker:

```powershell
corepack pnpm db:migrate:local
corepack pnpm dev:api
```

Wrangler serves the Worker with its local D1 binding on port 8787 without requiring login. Local checks:

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

### Verify PDF selection and upload on Android

Open **Hocam Şunu Anlat** and use the system document picker. The current flow accepts one PDF whose reported size is greater than zero and no more than 15 MiB. Verify cancel, select, replace, remove, oversized-file error, upload loading, retry, and the disabled/enabled **Devam Et** states on a device or emulator.

Selection remains screen-scoped. On **Devam Et**, the modern Expo `File` API and `expo/fetch` send multipart FormData without base64. The 120-second upload timeout is separate from ordinary eight-second JSON requests, and uploads are retried only when the user explicitly tries again.

The Worker validates MIME, exact file size, installation UUID, and the `%PDF-` signature before uploading to temporary Gemini Files API storage. It does not parse page count. The Expo app config blocks legacy `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`; selection uses Android's system document picker instead.

After upload, press **Belgeyi Analiz Et** to make the one explicit analysis request. The Worker checks ownership, returns cached output when present, polls temporary-file readiness for a bounded period, calls the configured Gemini model, validates the structured result, and stores it in D1. Reopening the results route reads the D1 cache and never calls Gemini automatically. Analysis requests use a 120-second mobile timeout and remain user-retry driven.

After analysis, press **Bu belgeyle çalış**, choose exactly 10, 30, or 60 minutes, and press **Ders Oluştur**. The Worker requires the persisted analysis, combines it with the still-temporary source PDF through the lesson provider, validates the structured lesson and its total section minutes, and stores a versioned D1 cache entry. Repeating the same document/duration/version/model request returns that cache without another model call. Opening an existing lesson reads D1 only. Generation is explicit, has a 120-second mobile timeout, and remains user-retry driven.

From a stored lesson, press **Beni Sına**. A 10, 30, or 60 minute lesson requests exactly 5, 8, or 10 Turkish multiple-choice questions. Generation uses a 120-second mobile timeout; cache detail, submission, and attempt detail use the ordinary shorter timeout. The quiz screen shows no correctness feedback until every question is answered and **Quizi Bitir** is pressed. Submission is deterministic and makes no Gemini call. Verify previous/next navigation, answer preservation, persisted result reopening, weak-section copy, and **Quizi Tekrar Çöz** reusing the same cached quiz.

## Quality checks

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm --filter @anlat-hoca/mobile exec expo install --check
corepack pnpm --filter @anlat-hoca/mobile exec pnpm dlx expo-doctor@latest
corepack pnpm --filter @anlat-hoca/api build
corepack pnpm db:migrate:local
```

After changing `apps/api/wrangler.jsonc`, regenerate Worker runtime and binding types:

```powershell
corepack pnpm --filter @anlat-hoca/api generate-types
```

## Production deployment

The production API is deployed at:

```text
https://anlat-hoca-api.shnkadir.workers.dev
```

The Worker uses the remote `anlat-hoca-prod` D1 database and the Cloudflare secret binding `GEMINI_API_KEY`. The secret value is not stored in this repository or in mobile configuration.

Before deployment, inspect pending remote migrations. Apply them only with the explicit remote scripts:

```powershell
corepack pnpm db:migrations:list:remote
corepack pnpm db:migrate:remote
corepack pnpm deploy:api
```

Always apply pending production migrations before deploying Worker code that depends on the new schema. Afterward, list migrations again and inspect only the non-sensitive schema/cache metadata needed for validation.

Migration `0005_create_lesson_quizzes.sql` adds the internal quiz cache and immutable attempt tables. Review the remote pending list and confirm that only this migration is pending before applying it. Preserve the existing `anlat-hoca-api` Worker, production D1 database, and `GEMINI_API_KEY` secret.

`--local` uses Wrangler state under `apps/api/.wrangler` and is the default for ordinary `wrangler dev` work. `--remote` targets the production D1 database. Never substitute one for the other casually.

For local mobile testing against production, set the ignored `apps/mobile/.env` file to:

```text
EXPO_PUBLIC_API_BASE_URL=https://anlat-hoca-api.shnkadir.workers.dev
```

This URL is public client configuration, not a secret. Restart Expo after changing it. The local Worker does not need to run when this URL is selected.

A future EAS production build must receive `EXPO_PUBLIC_API_BASE_URL` as build-time public configuration. Never provide `GEMINI_API_KEY` or any backend secret to EAS or the mobile bundle.
