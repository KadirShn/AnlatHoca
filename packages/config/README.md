# Shared configuration

This package is reserved for safe constants and configuration that can be shared across workspace packages.

Never place API keys, credentials, tokens, private endpoints, or other secrets here. Mobile code is public to anyone who downloads the application. Backend secrets must be supplied through the approved Cloudflare secret mechanism or ignored local environment files.

The package owns the shared PDF policy: MIME/extension hints, the 15 MiB byte limit, a small multipart-envelope allowance, and explicit 120-second mobile timeouts for upload and analysis. These constants keep mobile UX and Worker enforcement aligned. Mobile checks remain convenience validation; the Worker independently validates every upload.
