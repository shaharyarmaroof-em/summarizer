# Next.js

## Architecture
- Use the App Router when available; keep routing consistent.
- Prefer server components for data fetching and reduce client JS.
- Keep API routes thin and move logic to services.

## Performance
- Use image optimization and caching where applicable.
- Avoid blocking client rendering with large bundles.

## Data Fetching
- Use route-level caching and revalidation intentionally.
- Separate public and private data access paths.
