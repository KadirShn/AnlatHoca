# Google Play data safety worksheet

This internal worksheet records the final V1 behavior observed in source. It is not legal advice. The publisher must still answer the live Play Console questionnaire from its current wording and contractual role; this document deliberately separates technical facts from suggested classifications.

## Actual technical data flow

| Data | Source and destination | Transient or persisted | Purpose |
| --- | --- | --- | --- |
| Anonymous installation UUID | Generated in the app; sent to the Anlat Hoca Worker and stored in Cloudflare D1 | SecureStore on native devices and D1; memory-only for the current web session | Scope guest data and reopen the same installation's work. It is an identifier, not authentication or a hardware identity. |
| Uploaded PDF | User-selected system document picker file; mobile → Worker → Google Gemini Files | Request processing and temporary Gemini file handling; raw bytes are not stored in D1 or R2 | Requested document analysis and source-grounded lesson generation |
| PDF metadata | File name, size, MIME type and internal temporary-provider reference | Cloudflare D1 | Display the document, validate ownership/status and reuse the temporary source while available |
| Document analysis | Gemini receives the temporary PDF and prompt; validated result returns through the Worker | Cloudflare D1 | Show and reopen summaries, topics and learning points without regeneration |
| Lessons | Gemini receives validated analysis plus the temporary PDF; validated lesson returns through the Worker | Cloudflare D1 | Generate and reopen 10 / 30 / 60 minute lessons and deterministic presentations |
| Quiz content | Gemini receives the persisted lesson when the user requests a quiz | Cloudflare D1 | Generate and reuse one lesson-grounded quiz |
| Quiz answers and results | User selections → Worker; server-side deterministic grading | Cloudflare D1; answers are not sent to Gemini for grading | Show immutable attempts, score and sections that may benefit from review |
| Hocaya Sor messages | Question plus relevant persisted lesson and limited recent conversation context → Worker → Gemini | Successful user/assistant message pairs are stored in Cloudflare D1 | Provide and reopen lesson-grounded teacher conversations |
| Library summaries | Worker reads installation-scoped D1 records | Read-only response; no new persisted artifact | Reopen recent documents, lessons, quiz status and teacher-thread metadata |
| KPSS historical insights and study plans | Versioned static application data; plan computed locally on mobile | No user data persistence, Gemini transfer or D1 access | Show partial public-sample observations and deterministic study plans |
| Operational request/error data | Requests pass through Cloudflare Workers; structured server logs may contain operation and error names/messages | Subject to configured Cloudflare observability retention | Availability and operational troubleshooting; source intentionally avoids PDF contents, prompts, API keys and full installation IDs in application logs |
| User-requested deletion | Installation UUID → Worker; Worker best-effort removes live Gemini temporary files, then deletes the D1 installation root | D1 descendants are removed by foreign-key cascades; SecureStore UUID may remain and create a new empty server session | Let a user erase persistent study history associated with the current installation |

V1 contains no account/login, analytics SDK, crash-reporting SDK, ad SDK, advertising-ID use, notification feature, microphone, camera, contacts or location feature.

## Persistence and deletion facts

- There is no account to delete.
- **Settings → Gizlilik ve Veriler → Verilerimi Sil** requires an explicit destructive confirmation and calls `POST /privacy/delete-data` with the current installation UUID.
- The endpoint gives the same success response whether or not the UUID has rows; it does not reveal existence.
- Deleting `guest_installations` cascades through documents, analyses, lessons, quizzes, attempts, teacher threads and messages under migrations 0001–0006. No Stage 18 schema migration is required.
- Uninstalling the app alone does not make this server request and therefore is not represented as deletion.
- Before D1 deletion, the Worker attempts to delete unexpired or unknown-expiry Gemini file references. Provider cleanup is best-effort and cannot prevent persistent D1 deletion; residual temporary processing data follows Gemini's lifecycle if immediate cleanup cannot be confirmed.
- The contact published in both policy surfaces is `kadselbur1@gmail.com`.

## Google Play Console classification worksheet

Do not copy these rows directly into Play Console. Verify each against current Google Play definitions, including whether processing by contracted service providers is classified as collection or sharing:

| Candidate Play category/question | Final technical evidence | Console action |
| --- | --- | --- |
| Device or other IDs | A random installation UUID is collected and persisted to scope guest work; it is not a hardware or advertising ID. | Disclose if the live form maps this UUID to “Device or other IDs”; mark required for the persisted-study service, not ephemeral. |
| Files and docs | A PDF is collected only after the user chooses upload and is transferred through the Worker to Gemini. Raw bytes are not stored in D1. | Mark optional. Determine “sharing” from the live processor/service-provider definition and the publisher's Gemini terms; do not guess. |
| User-generated content | Hocaya Sor questions and replies are persisted and sent to Gemini for requested responses. | Map to the live form's applicable user-content category; mark optional. Verify processor sharing classification. |
| App activity | Quiz answers/results and saved learning history are persisted but not used for ads, analytics or personalization outside the requested study features. | Select only categories offered by the current form that actually describe these records. |
| Data deletion | In-app installation-scoped deletion exists; there is no account. Public policy and support contact are available. | Declare no account creation. Supply the public privacy URL and describe the in-app deletion path where asked. |
| Security practices | All production client/API/provider transfers use HTTPS. No end-to-end-encryption claim is made. | Answer encryption-in-transit from this fact; do not claim independent security review. |
| Retention | Persistent study data remains until user deletion or operational removal. Gemini temporary files follow provider lifecycle when cleanup cannot be confirmed. | Keep the policy wording aligned; do not state a fixed retention period that the product does not enforce. |

## Submission-owner checks

- Re-check the live Google Play Data safety definitions immediately before submission.
- Review the publisher's current Cloudflare and Gemini contractual processor/retention terms.
- Confirm the responsible publisher/legal entity and developer contact in Play Console.
- Confirm the final Android manifest from the release artifact rather than relying only on Expo source configuration.
- Reconcile this worksheet, the public privacy policy and actual release behavior immediately before submission.
