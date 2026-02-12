# Plasmo

## Architecture

- Use Plasmo's file conventions for extension entry points.
- Keep background logic isolated from UI components.
- Minimize permissions to the smallest set required.

## State And Messaging

- Prefer message passing for cross-context communication.
- Validate incoming messages at boundaries.
- Ensure extension permissions are correctly set for required APIs (e.g., `tabs`, `storage`).
- Ensure proper cleanup of listeners and resources to avoid leaks.

## Build And Release

- Keep environment-specific config in `.env` files.
- Verify extension manifest changes in PRs.
