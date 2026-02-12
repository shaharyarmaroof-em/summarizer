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
      type: "START_SUMMARY_JOB";
      audio: { data: ArrayBuffer; name: string; type: string; size: number };
      notes: string;
    }
  | { type: "GET_SUMMARY_JOB"; jobId: string };

export type ExtensionResponse =
  | { ok: true; text: string; title?: string; url?: string }
  | { ok: true; result: string; latencyMs?: number }
  | { ok: true; jobId?: string; status?: JobStatus; resultMarkdown?: string }
  | { ok: false; error: string };
