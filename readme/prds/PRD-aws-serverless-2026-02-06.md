# AWS Serverless Backend PRD (v1)

Created: 2026-02-06T12:20:23-08:00
Owner: Summarizer Team
Status: Draft

## Summary
Build a minimal, stateless AWS serverless backend for the Chrome extension. The backend accepts text and an action, invokes AWS Bedrock Nova, and returns a Markdown response. No long-term storage, vector stores, or user accounts in v1.

## Problem Statement
The extension needs a secure and reliable backend to process user input using Bedrock Nova models. Today, the frontend is stubbed and cannot produce real results. We need a backend that is simple to deploy, low maintenance, and fast enough for a good UX.

## Goals
- Provide a single `POST /process` endpoint for v1.
- Invoke AWS Bedrock Nova models only.
- Return Markdown-formatted results.
- Keep the backend stateless and low-cost.
- Enable straightforward configuration for the extension.

## Non-Goals
- Data persistence in S3 or DynamoDB.
- Vector search or RAG.
- Multi-tenant user auth and profiles.
- Streaming responses in v1.

## Users And Personas
- Extension users who want quick summaries or key information extraction.
- Internal developers who deploy and maintain the backend.

## User Stories
- As a user, I want to submit page text and receive a Markdown summary so I can skim it quickly.
- As a user, I want key information extracted so I can act on it faster.
- As a developer, I want a minimal API so the extension can integrate quickly.

## Requirements
### Functional
- Provide `POST /process` with `{ action, text, format }`.
- Support `action` values: `summarize`, `extract`.
- Call Bedrock `InvokeModel` for the selected Nova model.
- Return `{ result, format: "markdown", model, latency_ms }`.
- Validate input size and types.

### Non-Functional
- P95 response time under 5 seconds for typical inputs.
- Stateless Lambda function.
- Least-privilege IAM for Bedrock access.
- CORS restricted to the extension origin.
- Logging for request IDs, latency, and errors.

## UX And Flows
- Extension sends input to backend.
- Backend returns Markdown.
- Sidebar renders Markdown output.

## Data And Analytics
- Track basic metrics: request count, latency, error rate.
- No user-level analytics in v1.

## Dependencies
- AWS Bedrock Nova model access in the target region.
- API Gateway + Lambda.
- Extension configured with API base URL and key.

## Risks And Mitigations
- Bedrock access not enabled — verify model access during setup.
- Large input payloads — enforce size limits and return validation errors.
- CORS misconfiguration — restrict origins and test from extension.

## Open Questions
- What is the max input size for v1?
- Should we support streaming responses in v2?
- Do we need multi-region deployment later?

## Rollout Plan
- Phase 1: Deploy dev API and validate with local extension.
- Phase 2: Add API key protection.
- Phase 3: Stabilize and document.

## Timeline
- Week 1: Implement Lambda + API Gateway.
- Week 2: Integrate with extension and validate.
