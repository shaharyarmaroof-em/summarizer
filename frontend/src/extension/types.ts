export type SidebarAction = "summarize" | "extract";

export type JobStatus =
  | "QUEUED"
  | "TRANSCRIBING"
  | "SUMMARIZING"
  | "FORMATTING"
  | "SUCCEEDED"
  | "FAILED";

export type ExtensionMessage =
  | { type: "GET_PAGE_TEXT" }
  | { type: "GET_SELECTION" }
  | { type: "PROCESS_TEXT"; action: SidebarAction; text: string }
  | {
      type: "GET_UPLOAD_URL";
      filename: string;
      contentType: string;
      size: number;
    }
  | {
      type: "START_SUMMARY_JOB";
      s3Key: string;
      notes: string;
    }
  | { type: "GET_SUMMARY_JOB"; jobId: string };

export type ExtensionResponse =
  | { ok: true; text: string; title?: string; url?: string }
  | { ok: true; result: string; latencyMs?: number }
  | { ok: true; jobId?: string; status?: JobStatus; resultMarkdown?: string }
  | { ok: true; uploadUrl?: string; s3Key?: string }
  | { ok: false; error: string };
