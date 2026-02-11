# Project Structure

This repo is organized to keep the Chrome extension frontend and API integration clean and easy to extend.

## Top-Level
- `src/` contains all runtime code for the extension.
- `readme/` contains PRDs and operational docs.
- `prompts/` contains internal prompts (ignored by git).
- `skills/` contains local Codex skills.

## Source Layout
- `src/extension/` is the Chrome extension codebase.
- `src/extension/api/` is the API client layer for backend calls.
- `src/extension/api/utils/` contains shared API helpers.

## Build Outputs
- `dist/` is the built extension output (unpacked load in Chrome).

## Key Files
- `src/extension/manifest.json` extension manifest.
- `src/extension/sidebar.html` side panel entry point.
- `src/extension/sidebar.tsx` React UI.
- `src/extension/background.ts` service worker.
- `src/extension/content.ts` content script.
- `src/extension/api/process.ts` `/process` endpoint client.
- `.env` holds local API base URL and API key.

## Conventions
- Keep backend integration in `src/extension/api/` only.
- One file per endpoint group.
- Shared API code lives under `src/extension/api/utils/`.
