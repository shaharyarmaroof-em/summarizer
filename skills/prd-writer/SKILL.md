---
name: prd-writer
description: "Create detailed Product Requirements Documents (PRDs) in this repo. Use when the user asks for PRDs, product requirements, specs, or a source-of-truth requirements document. Always save PRDs under readme/ with a clear structure and a creation timestamp."
---

# PRD Writer

## Workflow
1. Confirm the product or feature name, target users, goals, and timeline.
2. Draft a PRD using the required structure in `assets/prd-template.md`.
3. Ensure a creation timestamp is present in the PRD header.
4. Save the PRD in `readme/` using the naming rules below.

## File Location And Naming
- Ensure `readme/` exists at the repo root. Create it if missing.
- Save PRDs as `readme/PRD-<slug>-YYYY-MM-DD.md`.
- Use a short, lowercase slug with hyphens (e.g., `readme/PRD-invoice-search-2026-02-06.md`).

## Timestamp Rules
- Include a `Created:` line in the PRD header.
- Use ISO 8601 with timezone, e.g. `2026-02-06T10:15:00-08:00`.
- Use the current local time when creating the PRD.

## Required Sections
Follow the template in `assets/prd-template.md`. Do not remove required headings.

## Quality Bar
- Be explicit about scope, non-goals, and constraints.
- Separate functional and non-functional requirements.
- List open questions and risks.
- Call out analytics/metrics and rollout plan when applicable.

## If Information Is Missing
- Ask concise follow-up questions before finalizing the PRD.
- If minor gaps remain, list them under `Open Questions`.
