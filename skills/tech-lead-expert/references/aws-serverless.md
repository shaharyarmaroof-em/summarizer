# AWS Serverless

## Architecture
- Prefer managed services over custom infrastructure.
- Keep functions single-purpose and stateless.
- Use event-driven designs where possible.

## Reliability And Scale
- Use retries with backoff for transient errors.
- Design for idempotency on write paths.
- Set timeouts and memory based on observed usage.

## Security
- Use least-privilege IAM policies.
- Store secrets in managed secret stores.

## Observability
- Emit structured logs and correlation IDs.
- Track key metrics and alarms for SLOs.
