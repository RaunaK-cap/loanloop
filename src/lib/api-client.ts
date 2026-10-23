"use client";

import { account } from "./appwrite/client";

export class ApiClientError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function authHeaders() {
  const session = await account.createJWT();
  return {
    Authorization: `Bearer ${session.jwt}`,
  };
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: HeadersInit;
  } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  try {
    const auth = await authHeaders();
    headers.set("Authorization", auth.Authorization);
  } catch {
    throw new ApiClientError(401, "Sign in to continue.");
  }

  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : "Request failed. Try again.";
    throw new ApiClientError(response.status, message);
  }

  return payload as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const headers = new Headers();
  try {
    const auth = await authHeaders();
    headers.set("Authorization", auth.Authorization);
  } catch {
    throw new ApiClientError(401, "Sign in to continue.");
  }

  const response = await fetch(path, {
    method: "POST",
    headers,
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : "Upload failed. Try again.";
    throw new ApiClientError(response.status, message);
  }

  return payload as T;
}
