import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ExtensionResponse, SidebarAction } from "./types";
import "./styles.css";

const actions: { label: string; value: SidebarAction }[] = [
  { label: "Summarize", value: "summarize" },
  { label: "Extract Key Info", value: "extract" }
];

const sendMessage = async (message: unknown): Promise<ExtensionResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response as ExtensionResponse);
    });
  });
};

const App = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("Idle");
  const [action, setAction] = useState<SidebarAction>("summarize");
  const [pageMeta, setPageMeta] = useState<{ title?: string; url?: string }>({});

  const canSubmit = useMemo(() => input.trim().length > 0, [input]);

  const handleCapture = async (type: "GET_PAGE_TEXT" | "GET_SELECTION") => {
    setStatus("Capturing...");
    const response = await sendMessage({ type });
    if (!response.ok) {
      setStatus(response.error);
      return;
    }
    setInput(response.text);
    setPageMeta({ title: response.title, url: response.url });
    setStatus("Captured");
  };

  const handleProcess = async () => {
    if (!canSubmit) return;
    setStatus("Processing...");
    const response = await sendMessage({ type: "PROCESS_TEXT", action, text: input });
    if (!response.ok) {
      setStatus(response.error);
      return;
    }
    setResult(response.result ?? "");
    setStatus("Done");
  };

  return (
    <div className="app">
      <div className="section">
        <div className="meta">{pageMeta.title ?? "No page captured"}</div>
        <div className="meta">{pageMeta.url ?? ""}</div>
        <textarea
          placeholder="Paste text or capture the page..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <div className="action-row">
          <select
            className="action-select"
            value={action}
            onChange={(event) => setAction(event.target.value as SidebarAction)}
          >
            {actions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="icon-button"
            onClick={() => handleCapture("GET_PAGE_TEXT")}
            aria-label="Capture page"
            title="Capture page"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4h16v4H4V4Zm0 6h16v10H4V10Zm2 2v6h12v-6H6Z" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => handleCapture("GET_SELECTION")}
            aria-label="Capture selection"
            title="Capture selection"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5h6v2H7v4H5V5Zm12 0h2v6h-2V7h-4V5h4ZM5 13h2v4h4v2H5v-6Zm12 4h-4v2h6v-6h-2v4Z" />
              <path d="M9 9h6v6H9V9Z" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-button primary"
            disabled={!canSubmit}
            onClick={handleProcess}
            aria-label="Run action"
            title="Run action"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7-11-7Z" />
            </svg>
          </button>
        </div>
        <div className="meta">Status: {status}</div>
        <div className="result">{result || "Results will show here."}</div>
        <button
          type="button"
          className="icon-button"
          onClick={() => {
            if (!result) return;
            void navigator.clipboard.writeText(result);
            setStatus("Copied result");
          }}
          aria-label="Copy result"
          title="Copy result"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 7h9v12H9V7Zm-3 3H4V4h10v2H6v4Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
