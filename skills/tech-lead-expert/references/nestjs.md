# NestJS

## Architecture
- Use modules to define bounded contexts.
- Keep controllers thin; move logic to services.
- Use DTOs for input validation and typing.

## Reliability
- Handle errors with filters and consistent exception mapping.
- Keep database transactions explicit and minimal.

## Testing
- Use testing modules to isolate dependencies.
- Prefer integration tests for critical flows.
