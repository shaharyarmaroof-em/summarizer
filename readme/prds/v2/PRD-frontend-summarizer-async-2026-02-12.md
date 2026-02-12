# PRD — Frontend Summarizer (Async) — 2026-02-12

## Overview

Upgrade the VS Code sidebar Summarizer to support audio upload/recording, optional context notes, async job submission, progress polling, and editable Markdown output following the template in `readme/transcribed_notes.md`.

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
  - Upload file (mp3, wav, m4a).
  - Record audio via microphone.
  - Show file name, duration (if available), size.
  - Remove/replace audio.
- Notes input
  - Multiline text input for context.
  - Optional field.
- Async flow
  - POST start job: returns `jobId` and initial status.
  - Poll status endpoint until `SUCCEEDED` or `FAILED`.
  - Show progress state (queued, transcribing, summarizing, formatting).
- Output
  - Display Markdown editor populated with backend response.
  - Support in-place editing.
  - Provide “Copy Markdown” button.

## UX States

- Idle: no audio selected.
- Ready: audio selected.
- Submitting: job starting.
- In Progress: polling status.
- Success: output shown.
- Error: error shown with retry option.

## Output Template

Must follow the structure in `readme/transcribed_notes.md`:

```
# Voice Note — <DATE TIME>

## Title - <TITLE>

## Summary

- <SUMMARY_TEXT>

## Key Points

<KEY_POINTS_LIST>

## Tasks

- [ ] <TASK_ITEM>

## Reminders

<REMINDERS_LIST>

## Follow up Questions (Optional)

- <QUESTION_ITEM>
```

## API Contract (Frontend)

- Start Job
  - `POST /v1/summary/jobs`
  - Body: multipart form
    - `audio`: binary
    - `notes`: string
    - `metadata`: JSON (optional)
- Job Status
  - `GET /v1/summary/jobs/{jobId}`
  - Response: `{ status, progress, message, resultMarkdown? }`

## Error Handling

- Invalid file: size/type error and block submit.
- Mic permission denied: show instructions to enable.
- Backend failures: show error + retry.

## Metrics

- Job start success rate.
- Median time to completion.
- Retry rate.

## Open Questions

- Max audio size/duration in the UI?
- Polling interval and timeout?
- Should we store the last successful result locally per session?
