# Jest

## Test Structure
- Favor small, deterministic tests.
- Use `describe` blocks for scope and readability.

## Mocks
- Mock external boundaries, not implementation details.
- Reset mocks between tests to avoid leakage.

## Performance
- Keep test suites fast; split slow tests.
- Use `--runInBand` only for debugging.
