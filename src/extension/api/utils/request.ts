import { API_BASE_URL, API_KEY } from "../config";

export const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  if (!API_BASE_URL) {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};
