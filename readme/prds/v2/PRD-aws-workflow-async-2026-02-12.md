# PRD — AWS Serverless Workflow (Async) — 2026-02-12

## Overview
Implement an async, serverless pipeline that accepts audio + notes, transcribes, summarizes using Amazon Bedrock (Amazon Nova model, free tier where possible), and returns structured Markdown output. Temporary data storage is allowed but must be short-lived and encrypted.

## Goals
- Async job-based processing with status polling.
- Use Bedrock (Amazon Nova) for summarization.
- Enforce minimal data retention via TTL and cleanup.
- Return Markdown matching the template in `readme/transcribed_notes.md`.

## Non-Goals
- Long-term storage of audio or transcripts.
- Real-time streaming transcription.

## AWS Services
- API Gateway (REST or HTTP API)
- AWS Lambda (job start, status read, callbacks)
- AWS Step Functions (orchestration)
- Amazon Transcribe (speech-to-text)
- Amazon Bedrock (Amazon Nova model)
- Amazon S3 (ephemeral storage, optional)
- Amazon DynamoDB (job status + TTL)
- AWS KMS (encryption)
- CloudWatch (logs, metrics, alarms)
- IAM (least privilege)

## Architecture
### Data Handling
- Audio may be uploaded to a short-lived S3 bucket with strict lifecycle rules (e.g., 15–60 minutes).
- Transcripts and intermediate artifacts stored in memory where possible; if stored, also short-lived with TTL.
- DynamoDB stores job status and result Markdown with TTL.

### Async Flow
1. Client submits audio + notes to API Gateway.
2. Lambda validates input, stores audio in ephemeral S3 (if needed), creates job in DynamoDB, starts Step Functions execution.
3. Step Functions runs:
   - Transcribe job (points to S3 object or direct stream).
   - Summarization via Bedrock (Amazon Nova) with notes context.
   - Format into Markdown template.
   - Store result Markdown in DynamoDB, mark job `SUCCEEDED`.
4. Client polls `GET /v1/summary/jobs/{jobId}` for status.
5. On completion, return Markdown to client.
6. Cleanup: delete S3 object immediately after successful transcription or at TTL expiration.

## Mermaid Diagram
```mermaid
flowchart TD
  A[VS Code Sidebar] --> B[API Gateway]
  B --> C[Lambda: Validate + Start Job]
  C --> D[DynamoDB: Job Status + TTL]
  C --> E[Step Functions]
  E --> F[Transcribe]
  F --> G[Bedrock: Amazon Nova]
  G --> H[Lambda: Markdown Formatter]
  H --> D
  D --> I[API Gateway: Job Status]
  I --> A
  C --> J[S3 Ephemeral Bucket]
  J --> F
  J -.TTL Cleanup.-> X[Lifecycle Expiration]
```

## API Contract (Backend)
- `POST /v1/summary/jobs`
  - Input: `audio`, `notes`, optional `metadata`
  - Response: `{ jobId, status }`
- `GET /v1/summary/jobs/{jobId}`
  - Response: `{ jobId, status, progress, resultMarkdown? }`

## Output Contract
Must match the structure in `readme/transcribed_notes.md`.

## Best Practices
- Encryption at rest (S3 SSE-KMS, DynamoDB KMS).
- Encryption in transit (TLS 1.2+).
- IAM least privilege with scoped roles for Lambda, Step Functions, Transcribe, Bedrock.
- Short-lived S3 bucket with lifecycle policy + explicit deletion after job completion.
- DynamoDB TTL to remove job data after a short retention period (e.g., 1–24 hours).
- CloudWatch alarms for error rates and latency.
- Request validation + size limits in API Gateway.
- Use Bedrock Amazon Nova models with cost controls; enforce token limits.

## Error Handling
- Validation failures: return 400.
- Transcribe failure: retry with exponential backoff and fail job.
- Bedrock failure: retry and fail with error reason.
- Timeouts: mark job `FAILED` with message.

## Open Questions
- Maximum audio duration and file size?
- Target max job completion time?
- Preferred TTL for job status data?
