# Android V1 release checklist

Status legend: **READY** is backed by repository/output evidence; **MANUAL** requires publisher or Play Console action; **PENDING** is not yet verified.

## App identity and build

- READY — App name `Anlat Hoca`, package `com.kadirshn.anlathoca`, version `1.0.0`, versionCode `1` configured.
- READY — Production EAS profile is configured for Android App Bundle output and injects only the public production Worker URL.
- READY — Generated Android release configuration verifies minSdk 24, compileSdk/targetSdk 36, package, version and versionCode.
- READY — Generated release manifest requests only `android.permission.INTERNET`; the additional package-scoped dynamic-receiver permission is signature protected.
- PENDING — Signed release AAB creation and final bundle metadata inspection require explicit approval to upload the mobile project source/public configuration to Expo EAS Build.
- MANUAL — Confirm Android signing credentials in the publisher's secure EAS flow; never commit credentials.

## Privacy and data

- READY — Public and native policy share one source and publish `kadselbur1@gmail.com`.
- READY — Explicit in-app installation-data deletion with non-enumerating API behavior.
- READY — D1 cascade path reviewed for migrations 0001–0006; no migration required.
- READY — Dedicated non-sensitive fixture deletion smoke passed against the deployed production Worker; repeated deletion returned the same result and the scoped library remained empty.
- MANUAL — Complete the live Data Safety form after reviewing current Cloudflare/Gemini contractual roles.

## Store listing

- READY — Turkish short/full copy and independent-ÖSYM disclaimer prepared.
- READY — 512 × 512 Play icon and 1024 × 500 feature graphic prepared without fake store claims.
- PENDING — Real Android screenshots. Local Expo Go was incompatible and the native build hit the Windows/CMake path-length limit; the approved brand board is not being misrepresented as a screenshot.
- MANUAL — Complete content-rating, target-audience, pricing, countries and developer-profile fields using real publisher facts.

## Quality and policy

- READY — Frozen install, TypeScript, lint, tests, Expo compatibility/Doctor, Worker types/dry-run and local/remote migration checks passed.
- READY — Android production export and generated release SDK/permission inspection completed.
- READY — Release bundle scan found the production API origin exactly once and found no development API origins, `GEMINI_API_KEY` marker or `AIza` key prefix.
- READY — Production health/privacy endpoints and installation-data deletion flow passed after deploying Worker version `2f774918-a5ad-435a-aa29-5525cd243ccf`.
- MANUAL — Upload AAB to an internal/closed test track and resolve Play pre-review checks before production rollout.
