import { API_BASE_URL, API_KEY } from "../config";

const buildHeaders = (extra: Record<string, string> = {}) => ({
  ...(API_KEY ? { "x-api-key": API_KEY } : {}),
  ...extra
});

const buildUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new Error("Missing VITE_API_BASE_URL");
  }
  return `${API_BASE_URL}${path}`;
};

export const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

export const postForm = async <T>(path: string, form: FormData): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: buildHeaders(),
    body: form
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

export const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    method: "GET",
    headers: buildHeaders()
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};
