# PRD — Frontend Summarizer (Async) — 2026-02-12

## Overview
Upgrade the VS Code sidebar Summarizer to support audio upload/recording, optional context notes, async job submission with polling, and editable Markdown output following the template in `readme/transcribed_notes.md`.

## Scope And Repo Structure
- All frontend code lives under `frontend/`.
- Backend code lives under `backend/`.

## Goals
- Let users upload or record audio and add notes.
- Submit inputs to backend and start an async job.
- Show progress with clear success/error states.
- Render structured Markdown output that users can edit and copy.

## Non-Goals
- Long-term storage or user accounts.
- Sharing/export beyond copy-to-clipboard.

## Personas
- Engineer running daily standup or 1:1s.
- PM capturing meeting notes in VS Code.

## User Journey
1. Open Summarizer sidebar.
2. Upload or record audio.
3. Add optional context/notes.
4. Click “Summarize”.
5. UI shows job started + progress indicator.
6. Job completes; editable Markdown is displayed.
7. User edits and copies final Markdown.

## Functional Requirements
- Audio input
  - Upload file (mp3, wav, m4a, webm).
  - Record audio via microphone.
  - Show file name, duration (if available), size.
  - Remove/replace audio.
  - Show a live recording timer (HH:MM:SS) with a red indicator.
- Notes input
  - Multiline text input for context.
  - Optional field.
  - Enforce max length (4,000 chars).
- Async flow
  - Get upload URL: `POST /v1/summary/uploads` returns `uploadUrl` and `s3Key`.
  - Upload audio directly to S3 using `PUT uploadUrl`.
  - Start job: `POST /v1/summary/jobs` with `s3Key` returns `jobId` and initial status.
  - Poll status endpoint every 2s until `SUCCEEDED` or `FAILED`.
  - Show progress state: queued, transcribing, summarizing, formatting.
  - Cancel polling from the UI.
  - Retry last submission.
- Output
  - Display Markdown editor populated with backend response.
  - Support in-place editing.
  - Provide “Copy” and “Clear” controls.

## UX States
- Idle: no audio selected.
- Ready: audio selected.
- Submitting: job starting.
- In Progress: polling status.
- Success: output shown.
- Error: error shown with retry option.

## Output Template
Must follow the structure in `readme/transcribed_notes.md`.

## API Contract (Frontend)
- Start Job
  - `POST /v1/summary/uploads`
  - Body: JSON
    - `filename`: string
    - `contentType`: string
    - `size`: number
- Upload Audio
  - `PUT {uploadUrl}` (direct to S3)
  - Body: raw file
- Start Job
  - `POST /v1/summary/jobs`
  - Body: JSON
    - `s3Key`: string
    - `notes`: string
- Job Status
  - `GET /v1/summary/jobs/{jobId}`
  - Response: `{ status, progress, message, resultMarkdown? }`

## Error Handling
- Invalid file: size/type error and block submit.
- Mic permission denied: show instructions to enable.
- Backend failures: show error + retry.

## Constraints
- Max audio size: 200MB.
- Max audio duration: 2 hours.
- Max notes length: 4,000 characters.

## Metrics
- Job start success rate.
- Median time to completion.
- Retry rate.

## Assumptions
- The extension runs in a Chromium-based browser and can use `getUserMedia`.
- Backend implements the async job contract and returns Markdown.
