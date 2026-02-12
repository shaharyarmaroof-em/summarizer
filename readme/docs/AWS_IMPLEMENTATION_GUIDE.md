# AWS Implementation Guide (Step-by-Step)

This guide sets up the async backend using API Gateway, Lambda, Step Functions, Transcribe, and Bedrock Nova. It follows least-privilege IAM practices and uses AWS CDK (TypeScript).

## 1. Choose Region And Enable Bedrock
- Pick a region that supports Bedrock Nova.
- In the Bedrock console, request/enable model access for Nova.

## 2. Configure CDK Context
Set `bedrockModelId` and `corsOrigins` in `backend/cdk.json` or via CLI:
- `bedrockModelId`: e.g. `us.amazon.nova-2-lite-v1:0`
- `corsOrigins`: array of allowed origins (extension origin)

## 3. Install Dependencies
```bash
cd backend
npm install
```

## 4. Deploy
```bash
npm run deploy
```

## 5. Backend Endpoints
- `POST /v1/summary/uploads`
  - Returns `uploadUrl` and `s3Key`
- `PUT uploadUrl`
  - Uploads audio directly to S3
- `POST /v1/summary/jobs`
  - Starts the async job with `s3Key` + `notes`
- `GET /v1/summary/jobs/{jobId}`
  - Polls status and retrieves Markdown

## 6. Configure Extension
- Set `VITE_API_BASE_URL` to the API Gateway base URL.
- Set `VITE_API_KEY` if you enable API keys.
- Build the extension from `frontend/`.

## 7. Observability
- CloudWatch Logs for Lambda errors and latency.
- Step Functions execution history for debugging workflows.
- Alarms for error rate and timeouts.

## 8. Validate End-to-End
- Request upload URL and upload a sample audio.
- Start a job and poll for status.
- Confirm Markdown response format and cleanup of S3 objects.
