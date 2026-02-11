# AWS Serverless Setup Guide

This guide describes the minimal AWS setup for the v1 stateless backend using API Gateway, Lambda, and Bedrock (Nova models only).

## Prerequisites
- AWS account with Bedrock access in the target region.
- AWS CLI configured locally.
- Permissions to create IAM roles, Lambda, and API Gateway.

## High-Level Steps
1. Enable Bedrock model access for the Nova model in your AWS region.
2. Create an IAM role for Lambda with Bedrock invoke permissions.
3. Create the Lambda function (`process`).
4. Create an API Gateway REST API with a `POST /process` route.
5. Add API key protection (optional for v1 but recommended).
6. Configure CORS for extension origin.
7. Add `VITE_API_BASE_URL` and `VITE_API_KEY` to `.env` and rebuild the extension.

## IAM Role For Lambda
- Create a role with `AWSLambdaBasicExecutionRole`.
- Attach a policy allowing `bedrock:InvokeModel` for the Nova model ARN.

## Lambda Function
- Runtime: Node.js 20.x.
- Environment variables:
  - `MODEL_ID` = Nova model id you plan to use.
- Handler should:
  - validate input
  - call Bedrock `InvokeModel`
  - return `{ result, format: "markdown", model, latency_ms }`

## API Gateway
- Create a REST API.
- Add resource `/process`.
- Add method `POST` integrated with Lambda.
- Enable CORS for the extension origin.

## API Key (Optional)
- Create a usage plan and API key.
- Require API key on `POST /process`.
- Add `VITE_API_KEY` to `.env`.

## Extension Configuration
- Set `VITE_API_BASE_URL` to the API Gateway base URL.
- Set `VITE_API_KEY` if required.
- Run `npm run build` and reload the extension.

## Validation Checklist
- `POST /process` returns 200 with JSON.
- Results are Markdown formatted.
- Extension can call the API without CORS errors.
