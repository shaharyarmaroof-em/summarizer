import type {
  CreateUploadUrlRequest,
  CreateUploadUrlResponse,
  GetSummaryJobResponse,
  StartSummaryJobRequest,
  StartSummaryJobResponse
} from "./types";
import { getJson, postJson } from "./utils/request";

export const createUploadUrl = async (
  payload: CreateUploadUrlRequest
): Promise<CreateUploadUrlResponse> => {
  return postJson<CreateUploadUrlResponse>("/v1/summary/uploads", payload);
};

export const startSummaryJob = async (
  payload: StartSummaryJobRequest
): Promise<StartSummaryJobResponse> => {
  return postJson<StartSummaryJobResponse>("/v1/summary/jobs", payload);
};

export const getSummaryJob = async (jobId: string): Promise<GetSummaryJobResponse> => {
  return getJson<GetSummaryJobResponse>(`/v1/summary/jobs/${jobId}`);
};
