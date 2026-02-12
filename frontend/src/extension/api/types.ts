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

export type CreateUploadUrlRequest = {
  filename: string;
  contentType: string;
  size: number;
};

export type CreateUploadUrlResponse = {
  uploadUrl: string;
  s3Key: string;
};

export type StartSummaryJobRequest = {
  s3Key: string;
  notes: string;
};

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
