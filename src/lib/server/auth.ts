import "server-only";

import { AppwriteException, type Models } from "node-appwrite";
import { getAdminServices, getUserServices } from "./appwrite";
import type { Profile } from "../types";

export type AuthUser = Models.User<Models.Preferences>;

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function requireUser(request: Request): Promise<AuthUser> {
  const jwt = getBearerToken(request);
  if (!jwt) {
    throw new HttpError(401, "Sign in to continue.");
  }

  try {
    const { account } = getUserServices(jwt);
    return await account.get();
  } catch (error) {
    if (error instanceof AppwriteException) {
      throw new HttpError(401, "Your session expired. Sign in again.");
    }
    throw error;
  }
}

export async function getProfileRow(userId: string): Promise<Profile | null> {
  const { tablesDB } = getAdminServices();
  const env = getServerEnvSafe();
  try {
    return (await tablesDB.getRow({
      databaseId: env.databaseId,
      tableId: "profiles",
      rowId: userId,
    })) as Profile;
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return null;
    }
    throw error;
  }
}

export async function requireProfile(
  request: Request,
): Promise<{ user: AuthUser; profile: Profile }> {
  const user = await requireUser(request);
  const profile = await getProfileRow(user.$id);
  if (!profile) {
    throw new HttpError(403, "Finish setting up your profile first.");
  }
  return { user, profile };
}

function getServerEnvSafe() {
  // Kept local to avoid importing server env into any client graph by accident.
  return {
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop",
  };
}
