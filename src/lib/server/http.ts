import "server-only";

import { AppwriteException } from "node-appwrite";
import { ZodError } from "zod";
import { HttpError } from "./auth";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

export function jsonError(
  status: number,
  error: string,
  details?: unknown,
) {
  return Response.json({ error, details }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) {
    return jsonError(error.status, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return jsonError(422, "Check the form and try again.", error.issues);
  }

  if (error instanceof AppwriteException) {
    if (error.code === 409) {
      return jsonError(
        409,
        "That just changed. Refresh and try again.",
        error.message,
      );
    }
    if (error.code === 404) {
      return jsonError(404, "We couldn't find that.", error.message);
    }
    if (error.code === 401 || error.code === 403) {
      return jsonError(403, "You don't have access to that.", error.message);
    }
    return jsonError(500, "Appwrite couldn't complete that request.", error.message);
  }

  console.error("[loanloop:api]", error);
  return jsonError(500, "Something went wrong. Try again.");
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Send a valid JSON body.");
  }
}

export function getStringField(
  value: unknown,
  key: string,
): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : undefined;
}
