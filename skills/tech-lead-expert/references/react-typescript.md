# React + TypeScript

## Architecture
- Prefer functional components and hooks.
- Keep state local; lift only when needed.
- Use feature-based folder structure when scope is large.
- Separate UI from data-fetching and side effects.

## Type Safety
- Avoid `any`; use narrow types and unions.
- Use `as const` for discriminated unions.
- Prefer `unknown` over `any` for untrusted input.

## Performance
- Memoize expensive computations and stable callbacks.
- Avoid premature optimization; measure before tuning.
- Use lazy loading for heavy routes or components.

## Testing
- Test behavior over implementation details.
- Mock network boundaries, not internal functions.
