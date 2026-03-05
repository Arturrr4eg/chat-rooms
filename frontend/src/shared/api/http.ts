import { useAppStore } from "@/app/stores/app.store.ts";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface HttpOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function http<T>(path: string, options?: HttpOptions): Promise<T> {
  const method = options?.method ?? "GET";
  const auth = options?.auth ?? true;

  const token = useAppStore.getState().accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data: unknown = await res.json();

      if (data && typeof data === "object" && "message" in data) {
        throw new Error(String((data as { message: unknown }).message));
      }

      throw new Error(`HTTP ${res.status}`);
    }

    const text = await res.text();

    const cleaned = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    throw new Error(cleaned || `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}
