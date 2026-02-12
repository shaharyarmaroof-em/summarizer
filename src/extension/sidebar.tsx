import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import type { ExtensionResponse, JobStatus } from "./types";
import "./styles.css";

type AudioPayload = {
  data: ArrayBuffer;
  name: string;
  type: string;
  size: number;
};

const sendMessage = async (message: unknown): Promise<ExtensionResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response as ExtensionResponse);
    });
  });
};

const statusProgress: Record<JobStatus, number> = {
  QUEUED: 10,
  TRANSCRIBING: 35,
  SUMMARIZING: 65,
  FORMATTING: 85,
  SUCCEEDED: 100,
  FAILED: 100
};

const statusLabels: Record<JobStatus, string> = {
  QUEUED: "Queued",
  TRANSCRIBING: "Transcribing audio",
  SUMMARIZING: "Summarizing content",
  FORMATTING: "Formatting output",
  SUCCEEDED: "Complete",
  FAILED: "Failed"
};

const statusHelpText: Partial<Record<JobStatus, string>> = {
  QUEUED: "Preparing your job. This usually takes a few seconds.",
  TRANSCRIBING: "Turning audio into text. Longer audio takes more time.",
  SUMMARIZING: "Extracting key points and action items.",
  FORMATTING: "Formatting the final Markdown output.",
  SUCCEEDED: "Summary ready. You can edit and copy below.",
  FAILED: "Something went wrong. Please retry the job."
};

const templatePlaceholder = `# Voice Note — YYYY-MM-DD HH:MM

## Title - ...

## Summary

- …

## Key Points

- …
- …

## Tasks

- [ ] …
- [ ] …

## Reminders

- …

## Follow up Questions

- …`;

const MAX_AUDIO_MB = 200;
const MAX_NOTES_CHARS = 4000;
const RECORD_MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
const IN_PROGRESS_STATUSES: JobStatus[] = ["QUEUED", "TRANSCRIBING", "SUMMARIZING", "FORMATTING"];

const App = () => {
  const [notes, setNotes] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState("Idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultMarkdown, setResultMarkdown] = useState("");
  const [shouldPoll, setShouldPoll] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [lastSubmission, setLastSubmission] = useState<{
    audio: AudioPayload;
    notes: string;
  } | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const notesTooLong = notes.length > MAX_NOTES_CHARS;
  const isBusy = shouldPoll || (jobStatus ? IN_PROGRESS_STATUSES.includes(jobStatus) : false);
  const canSubmit = useMemo(
    () => Boolean(audioFile) && !isRecording && !notesTooLong && !isBusy,
    [audioFile, isRecording, notesTooLong, isBusy]
  );

  useEffect(() => {
    if (!shouldPoll || !jobId) return;

    let cancelled = false;
    const poll = async () => {
      const response = await sendMessage({ type: "GET_SUMMARY_JOB", jobId });
      if (cancelled) return;
      if (!response.ok) {
        setErrorMessage(response.error);
        setJobStatus("FAILED");
        setStatusMessage(response.error);
        setShouldPoll(false);
        return;
      }

      if (response.status) {
        setJobStatus(response.status);
        setStatusMessage(statusLabels[response.status]);
      }

      if (response.resultMarkdown) {
        setResultMarkdown(response.resultMarkdown);
      }

      if (response.status === "SUCCEEDED" || response.status === "FAILED") {
        setShouldPoll(false);
      }
    };

    void poll();
    const interval = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [jobId, shouldPoll]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!isRecording || recordingStart === null) return;
    const interval = window.setInterval(() => {
      setRecordingElapsed(Math.floor((Date.now() - recordingStart) / 1000));
    }, 500);
    return () => window.clearInterval(interval);
  }, [isRecording, recordingStart]);

  const handleFileSelected = (file: File | null) => {
    if (!file) return;
    if (isRecording) {
      setErrorMessage("Stop the recording before uploading a file.");
      setStatusMessage("Recording in progress");
      return;
    }
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setErrorMessage(`Audio file exceeds ${MAX_AUDIO_MB}MB limit.`);
      setStatusMessage("File too large");
      return;
    }
    if (file.type && !file.type.startsWith("audio/")) {
      setErrorMessage("Unsupported file type. Please upload an audio file.");
      setStatusMessage("Unsupported file type");
      return;
    }
    setErrorMessage(null);
    setMicPermissionDenied(false);
    setJobId(null);
    setJobStatus(null);
    setResultMarkdown("");
    setStatusMessage("Audio ready");
    setAudioFile(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFileSelected(file);
  };

  const handleStartRecording = async () => {
    if (isBusy) {
      setErrorMessage("Please wait for the current job to finish.");
      return;
    }
    setErrorMessage(null);
    setMicPermissionDenied(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported in this environment.");
      }
      if (typeof MediaRecorder === "undefined") {
        throw new Error("MediaRecorder is not available in this environment.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const supportedType = RECORD_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const extension = mimeType.includes("ogg") ? "ogg" : "webm";
        const file = new File([blob], `recording-${Date.now()}.${extension}`, { type: blob.type });
        handleFileSelected(file);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordingStart(Date.now());
      setRecordingElapsed(0);
      setStatusMessage("Recording...");
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone permission denied. Allow mic access for this extension in Chrome settings."
          : error instanceof Error
            ? error.message
            : "Microphone permission denied";
      setErrorMessage(message);
      setMicPermissionDenied(
        error instanceof DOMException && error.name === "NotAllowedError"
      );
      setStatusMessage("Microphone error");
    }
  };

  const handleStopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
    setRecordingStart(null);
    setStatusMessage("Recording saved");
  };

  const handleClear = () => {
    setNotes("");
    setAudioFile(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setJobId(null);
    setJobStatus(null);
    setResultMarkdown("");
    setErrorMessage(null);
    setStatusMessage("Idle");
    setShouldPoll(false);
    setLastSubmission(null);
    setMicPermissionDenied(false);
    setAudioDuration(null);
    setRecordingStart(null);
    setRecordingElapsed(0);
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsRecording(false);
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setJobId(null);
    setJobStatus(null);
    setResultMarkdown("");
    setErrorMessage(null);
    setStatusMessage("Audio removed");
    setAudioDuration(null);
  };

  const handleReplaceAudio = () => {
    if (isBusy || isRecording) return;
    uploadInputRef.current?.click();
  };

  const handleClearOutput = () => {
    setResultMarkdown("");
    setStatusMessage("Output cleared");
  };

  const handleCancelJob = () => {
    if (!shouldPoll) return;
    setShouldPoll(false);
    setJobStatus(null);
    setStatusMessage("Job cancelled (client-side)");
  };

  const handleStartJob = async () => {
    if (!audioFile || isRecording) return;
    if (notesTooLong) {
      setErrorMessage(`Notes exceed ${MAX_NOTES_CHARS} characters.`);
      return;
    }
    if (isBusy) return;

    setErrorMessage(null);
    setResultMarkdown("");
    setStatusMessage("Starting job...");

    const audioPayload: AudioPayload = {
      data: await audioFile.arrayBuffer(),
      name: audioFile.name,
      type: audioFile.type || "audio/webm",
      size: audioFile.size
    };

    setLastSubmission({ audio: audioPayload, notes: notes.trim() });

    const response = await sendMessage({
      type: "START_SUMMARY_JOB",
      audio: audioPayload,
      notes: notes.trim()
    });

    if (!response.ok) {
      setErrorMessage(response.error);
      setStatusMessage(response.error);
      return;
    }

    setJobId(response.jobId ?? null);
    if (response.status) {
      setJobStatus(response.status);
      setStatusMessage(statusLabels[response.status]);
    } else {
      setStatusMessage("Queued");
    }
    setShouldPoll(true);
  };

  const handleRetryJob = async () => {
    if (!lastSubmission || isBusy) return;
    setErrorMessage(null);
    setResultMarkdown("");
    setStatusMessage("Retrying job...");
    const response = await sendMessage({
      type: "START_SUMMARY_JOB",
      audio: lastSubmission.audio,
      notes: lastSubmission.notes
    });
    if (!response.ok) {
      setErrorMessage(response.error);
      setStatusMessage(response.error);
      return;
    }
    setJobId(response.jobId ?? null);
    if (response.status) {
      setJobStatus(response.status);
      setStatusMessage(statusLabels[response.status]);
    } else {
      setStatusMessage("Queued");
    }
    setShouldPoll(true);
  };

  const progressValue = jobStatus ? statusProgress[jobStatus] : 0;

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="title">Voice Summarizer</div>
          <div className="subtitle">Upload or record audio, add context, and get structured notes.</div>
        </div>
        <button type="button" className="ghost-button" onClick={handleClear}>
          Clear
        </button>
      </header>

      <section className="panel">
        <div className="panel-title">1. Audio</div>
        <div className="button-row">
          <label
            className={`button primary ${isRecording || isBusy ? "disabled" : ""}`}
            aria-disabled={isRecording || isBusy}
          >
            Upload Audio
            <input
              type="file"
              accept="audio/*"
              onChange={handleUpload}
              hidden
              disabled={isRecording || isBusy}
              ref={uploadInputRef}
            />
          </label>
          <button
            type="button"
            className={`button ${isRecording ? "danger" : "secondary"}`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isBusy && !isRecording}
          >
            {isRecording ? "Stop Recording" : "Record Audio"}
          </button>
          {isRecording ? (
            <div className="recording-timer" aria-live="polite">
              <span className="recording-dot" aria-hidden="true" />
              Recording{" "}
              {String(Math.floor(recordingElapsed / 3600)).padStart(2, "0")}:
              {String(Math.floor((recordingElapsed % 3600) / 60)).padStart(2, "0")}:
              {String(recordingElapsed % 60).padStart(2, "0")}
            </div>
          ) : null}
        </div>
        {audioFile ? (
          <div className="audio-preview">
            <div className="audio-meta">
              <div>
                <div className="audio-name">{audioFile.name}</div>
                <div className="audio-size">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                  {audioDuration ? ` • ${Math.round(audioDuration)}s` : ""}
                </div>
              </div>
              <div className="audio-actions">
                <button
                  type="button"
                  className="icon-action"
                  onClick={handleReplaceAudio}
                  aria-label="Replace audio"
                  title="Replace audio"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 7h7V4l5 4-5 4V9H7V7Zm10 10H10v3l-5-4 5-4v3h7v2Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="icon-action"
                  onClick={handleRemoveAudio}
                  aria-label="Remove audio"
                  title="Remove audio"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z" />
                  </svg>
                </button>
              </div>
            </div>
            {audioUrl ? (
              <audio
                controls
                src={audioUrl}
                onLoadedMetadata={(event) => setAudioDuration(event.currentTarget.duration)}
              />
            ) : null}
          </div>
        ) : (
          <div className="helper-text">No audio selected yet.</div>
        )}
        {micPermissionDenied ? (
          <div className="helper-text warning">
            Microphone access is blocked. Enable it in Chrome settings for this extension.
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-title">2. Context Notes</div>
        <textarea
          className="notes-input"
          placeholder="Add agenda, attendees, or any context that helps the summary."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="helper-text">{notes.length}/{MAX_NOTES_CHARS} characters</div>
      </section>

      <section className="panel">
        <div className="panel-title">3. Status</div>
        <div className="status-row" aria-live="polite">
          <div className={`status-pill ${jobStatus ? jobStatus.toLowerCase() : "idle"}`}>
            {jobStatus ? statusLabels[jobStatus] : statusMessage}
          </div>
          <div className="status-detail">{jobId ? `Job ID: ${jobId}` : ""}</div>
        </div>
        <div className="status-help">
          {jobStatus ? statusHelpText[jobStatus] : "Ready when you are. Add audio and notes to start."}
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={progressValue}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-bar" style={{ width: `${progressValue}%` }} />
        </div>
        {errorMessage ? <div className="error-text">{errorMessage}</div> : null}
        <div className="button-row">
          <button type="button" className="button primary" disabled={!canSubmit} onClick={handleStartJob}>
            {shouldPoll ? "Processing..." : "Summarize"}
          </button>
          <button type="button" className="text-button" disabled={!shouldPoll} onClick={handleCancelJob}>
            Cancel
          </button>
          <button
            type="button"
            className="button secondary quiet"
            disabled={!lastSubmission || isBusy}
            onClick={handleRetryJob}
          >
            Retry Last
          </button>
        </div>
      </section>

      <section className="panel output">
        <div className="panel-title">4. Output</div>
        <div className="output-toolbar">
          <div className="output-label">Markdown Output</div>
          <div className="button-row">
            <button
              type="button"
              className="button secondary"
              onClick={() => void navigator.clipboard.writeText(resultMarkdown)}
              disabled={!resultMarkdown.trim()}
            >
              Copy
            </button>
            <button type="button" className="button secondary" onClick={handleClearOutput}>
              Clear
            </button>
          </div>
        </div>
        <textarea
          className="output-editor"
          placeholder={templatePlaceholder}
          value={resultMarkdown}
          onChange={(event) => setResultMarkdown(event.target.value)}
        />
      </section>
    </div>
  );
};

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
