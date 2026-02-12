import type { GetSummaryJobResponse, StartSummaryJobResponse } from "./types";
import { getJson, postForm } from "./utils/request";

type StartSummaryJobPayload = {
  audio: { data: ArrayBuffer; name: string; type: string };
  notes: string;
};

export const startSummaryJob = async (payload: StartSummaryJobPayload): Promise<StartSummaryJobResponse> => {
  const form = new FormData();
  const audioBlob = new Blob([payload.audio.data], { type: payload.audio.type });
  form.append("audio", audioBlob, payload.audio.name);
  form.append("notes", payload.notes);
  return postForm<StartSummaryJobResponse>("/v1/summary/jobs", form);
};

export const getSummaryJob = async (jobId: string): Promise<GetSummaryJobResponse> => {
  return getJson<GetSummaryJobResponse>(`/v1/summary/jobs/${jobId}`);
};
