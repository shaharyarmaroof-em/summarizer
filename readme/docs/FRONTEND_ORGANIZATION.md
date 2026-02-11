# Frontend Code Organization

The frontend is a Chrome MV3 extension with a React side panel. The code is intentionally small and modular.

## UI Entry Points
- `src/extension/sidebar.html` loads the React app.
- `src/extension/sidebar.tsx` is the React root for the side panel UI.
- `src/extension/styles.css` contains theme-aware styling.

## Background And Content Scripts
- `src/extension/background.ts` handles action clicks, messaging, and API calls.
- `src/extension/content.ts` extracts page or selection text from the active tab.

## API Integration Layer
- `src/extension/api/` is the only place that touches backend APIs.
- `src/extension/api/utils/request.ts` wraps fetch and common headers.
- `src/extension/api/process.ts` calls the `/process` endpoint.

## Data Flow
1. User triggers an action in the side panel.
2. Sidebar sends a message to the background service worker.
3. Background optionally requests page or selection text from content script.
4. Background calls the API client and returns results to the sidebar.
5. Sidebar renders the Markdown result.

## Extension Build
- `vite.config.ts` builds `background`, `content`, and `sidebar` into `dist/`.
- `manifest.json` points to `sidebar.html` inside `dist/`.

## Environment Configuration
- Use `.env` for `VITE_API_BASE_URL` and `VITE_API_KEY`.
- Use `.env.example` as a starting point.
