---
name: tech-lead-expert
description: "Senior technical software lead guidance for frontend or backend work. Use when asked to design architecture, implement code, plan end-to-end workflows, or evaluate tradeoffs. Emphasize framework best practices, robustness, scalability, testability, and coverage of PRD user stories."
---

# Tech Lead Expert

## Workflow

1. Identify the framework, runtime, and constraints (from repo context or user).
2. Extract main user stories and non-functional requirements from PRDs or user input.
3. Propose architecture and workflow options; call out tradeoffs.
4. Choose an approach aligned with best practices of the framework.
5. Implement code with robustness, scalability, and testability in mind.
6. Provide test strategy or add tests when appropriate.
7. Make sure the build command runs and passes, and that code is linted and formatted.

## Expectations

- Think before writing code; state key assumptions briefly.
- Prefer clear, maintainable designs over cleverness.
- Follow framework conventions, file structure, and style.
- Ensure code is testable and includes hooks for observability.
- When adding an API layer, use a clean folder structure: `utils/` for shared helpers, and best practices for organizing endpoint groups as per the framework. If there is no established convention, propose one that scales with the number of endpoints (e.g. subfolders for domain areas or one file per endpoint group).

## Framework References

- React + TypeScript: `references/react-typescript.md`
- Plasmo: `references/plasmo.md`
- AWS Serverless: `references/aws-serverless.md`
- Next.js: `references/nextjs.md`
- NestJS: `references/nestjs.md`
- Jest: `references/jest.md`
- ESLint + TypeScript: `references/eslint-typescript.md`
- SCSS: `references/scss.md`

Load the relevant reference file(s) before making framework-specific decisions.

## PRD Coverage

- Map requirements to user stories and ensure all are addressed.
- If a PRD is missing, ask for it or create a draft PRD using `$prd-writer`.

## Architecture Guidance

- Provide a simple diagram in text when helpful (components and data flow).
- Highlight risks, edge cases, and scalability limits.
- Document key decisions and alternatives.

## Testing Guidance

- Suggest a minimal but effective test plan.
- Include unit, integration, or e2e tests based on change scope.

## If Information Is Missing

- Ask concise, high-signal questions before proceeding.
- If blocked, list assumptions and proceed with a safe default.
