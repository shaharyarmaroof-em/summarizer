# AWS Implementation Guide (Step-by-Step)

This guide sets up a minimal, stateless backend using API Gateway, Lambda, and Bedrock Nova. It follows least-privilege IAM practices.

## 1. Choose Region And Enable Bedrock
- Pick a region that supports Bedrock Nova.
- In the Bedrock console, request/enable model access for Nova.

## 2. Create IAM Role For Lambda
- Create a role for Lambda with:
  - `AWSLambdaBasicExecutionRole` (CloudWatch logs)
  - Custom inline policy allowing `bedrock:InvokeModel` for the Nova model ARN

Example policy (replace region/account/model):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1"
    }
  ]
}
```

## 3. Create Lambda Function
- Runtime: Node.js 20.x
- Handler: `process.handler`
- Environment:
  - `MODEL_ID` = Nova model ID
  - `MAX_INPUT_CHARS` = input limit

Expected handler behavior:
- Validate request payload
- Select system prompt by action
- Call Bedrock `InvokeModel`
- Return Markdown response

## 4. Create API Gateway REST API
- Create REST API named `summarizer-api`
- Add resource `/process`
- Add method `POST`
- Integration: Lambda proxy
- Enable CORS for extension origin

## 5. Add API Key (Recommended)
- Create a usage plan
- Create API key
- Require API key on `POST /process`

## 6. Configure Extension
- Set `.env`:
  - `VITE_API_BASE_URL` = API Gateway base URL
  - `VITE_API_KEY` = API key (if used)
- Run `npm run build` and reload extension

## 7. Observability
- CloudWatch Logs for Lambda errors and latency
- Add metrics for action usage and error rate

## 8. Validate End-to-End
- Use curl or Postman to call `POST /process`
- Confirm Markdown response format
- Confirm CORS works from extension
