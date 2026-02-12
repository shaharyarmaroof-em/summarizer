import type { ProcessRequest, ProcessResponse } from "./types";
import { postJson } from "./utils/request";

export const processText = async (payload: ProcessRequest): Promise<ProcessResponse> => {
  return postJson<ProcessResponse>("/process", payload);
};
