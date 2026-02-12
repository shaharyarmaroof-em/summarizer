export type ProcessAction = "summarize" | "extract";

export type ProcessRequest = {
  action: ProcessAction;
  text: string;
  format?: "markdown";
};

export type ProcessResponse = {
  result: string;
  format?: "markdown";
  model?: string;
  latency_ms?: number;
};

export type SummaryJobStatus =
  | "QUEUED"
  | "TRANSCRIBING"
  | "SUMMARIZING"
  | "FORMATTING"
  | "SUCCEEDED"
  | "FAILED";

export type StartSummaryJobResponse = {
  jobId: string;
  status: SummaryJobStatus;
};

export type GetSummaryJobResponse = {
  jobId: string;
  status: SummaryJobStatus;
  progress?: number;
  resultMarkdown?: string;
};
