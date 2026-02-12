import type { ExtensionMessage, ExtensionResponse } from "./types";
import { getSummaryJob, processText, startSummaryJob } from "./api";

const getActiveTabId = async (): Promise<number | undefined> => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
};

chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id ?? (await getActiveTabId());
  if (!tabId) return;
  await chrome.sidePanel.open({ tabId });
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    if (message.type === "GET_PAGE_TEXT" || message.type === "GET_SELECTION") {
      const tabId = await getActiveTabId();
      if (!tabId) {
        sendResponse({ ok: false, error: "No active tab" } satisfies ExtensionResponse);
        return;
      }

      const response = await chrome.tabs.sendMessage(tabId, message);
      sendResponse(response as ExtensionResponse);
      return;
    }

    if (message.type === "PROCESS_TEXT") {
      try {
        const result = await processText({
          action: message.action,
          text: message.text,
          format: "markdown"
        });
        sendResponse({
          ok: true,
          result: result.result,
          latencyMs: result.latency_ms
        } satisfies ExtensionResponse);
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error"
        } satisfies ExtensionResponse);
      }
      return;
    }

    if (message.type === "START_SUMMARY_JOB") {
      try {
        const result = await startSummaryJob({
          audio: message.audio,
          notes: message.notes
        });
        sendResponse({
          ok: true,
          jobId: result.jobId,
          status: result.status
        } satisfies ExtensionResponse);
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error"
        } satisfies ExtensionResponse);
      }
      return;
    }

    if (message.type === "GET_SUMMARY_JOB") {
      try {
        const result = await getSummaryJob(message.jobId);
        sendResponse({
          ok: true,
          jobId: result.jobId,
          status: result.status,
          resultMarkdown: result.resultMarkdown
        } satisfies ExtensionResponse);
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error"
        } satisfies ExtensionResponse);
      }
    }
  })().catch((error) => {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown error" });
  });

  return true;
});
