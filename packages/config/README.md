# Shared configuration

This package is reserved for safe constants and configuration that can be shared across workspace packages.

Never place API keys, credentials, tokens, private endpoints, or other secrets here. Mobile code is public to anyone who downloads the application. Backend secrets must be supplied through the approved Cloudflare secret mechanism or ignored local environment files.
