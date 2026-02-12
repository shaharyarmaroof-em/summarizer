import type { ExtensionMessage, ExtensionResponse } from "./types";

const getPageText = () => {
  const bodyText = document.body?.innerText ?? "";
  return bodyText.trim();
};

const getSelectionText = () => {
  const selection = window.getSelection();
  return selection?.toString().trim() ?? "";
};

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case "GET_PAGE_TEXT":
      sendResponse({
        ok: true,
        text: getPageText(),
        title: document.title,
        url: window.location.href
      } satisfies ExtensionResponse);
      return;
    case "GET_SELECTION":
      sendResponse({
        ok: true,
        text: getSelectionText(),
        title: document.title,
        url: window.location.href
      } satisfies ExtensionResponse);
      return;
    default:
      return;
  }
});
