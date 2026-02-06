# Project Instructions

This repo is set up to host local Codex skills under `skills/`.

## Skill Layout
Each skill lives in its own folder under `skills/` and follows this structure:
- `SKILL.md` (required): the skill instructions.
- `scripts/` (optional): runnable helpers referenced by `SKILL.md`.
- `references/` (optional): reference material linked from `SKILL.md`.
- `assets/` (optional): templates, prompts, sample data, etc.

## Registry
`skills/registry.json` lists available local skills (name, description, path).

## Template
Use `skills/_template/` to create new skills quickly.

## Usage
When a task matches a skill, open its `SKILL.md` first and follow its workflow.
