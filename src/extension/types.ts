export type SidebarAction = "summarize" | "extract";

export type ExtensionMessage =
  | { type: "GET_PAGE_TEXT" }
  | { type: "GET_SELECTION" }
  | { type: "PROCESS_TEXT"; action: SidebarAction; text: string };

export type ExtensionResponse =
  | { ok: true; text: string; title?: string; url?: string }
  | { ok: true; result: string; latencyMs?: number }
  | { ok: false; error: string };
