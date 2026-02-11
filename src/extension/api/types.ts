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
