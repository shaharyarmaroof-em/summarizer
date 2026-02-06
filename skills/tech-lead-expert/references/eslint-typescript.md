# ESLint + TypeScript

## Baseline
- Prefer `@typescript-eslint` rules for TS-aware linting.
- Use `eslint-config-prettier` to avoid style conflicts.
- Keep a single source of truth for formatting (Prettier).

## Safety
- Disallow `any` and unsafe type assertions where feasible.
- Enforce no-floating-promises and explicit return types on public APIs.
- Require `consistent-type-imports` for clean module boundaries.

## Consistency
- Use `no-unused-vars` from `@typescript-eslint` (disable base rule).
- Prefer `prefer-const` and `eqeqeq`.
- Enforce `import/order` and stable sorting.

## Testing
- Relax rules for test files via overrides (e.g., allow dev deps).
- Keep test patterns aligned with Jest conventions.
