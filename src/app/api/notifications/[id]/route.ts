import "server-only";

import { AppwriteException } from "node-appwrite";
import { getAdminServices } from "@/lib/server/appwrite";
import { requireUser, HttpError } from "@/lib/server/auth";
import { handleRouteError, jsonOk, readJson } from "@/lib/server/http";
import type { Notification } from "@/lib/types";

const databaseId = () =>
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser(request);
    await readJson(request).catch(() => ({}));

    const { tablesDB } = getAdminServices();
    let note: Notification;
    try {
      note = (await tablesDB.getRow({
        databaseId: databaseId(),
        tableId: "notifications",
        rowId: id,
      })) as Notification;
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        throw new HttpError(404, "That alert doesn't exist.");
      }
      throw error;
    }

    if (note.user_id !== user.$id) {
      throw new HttpError(403, "That alert isn't yours.");
    }

    await tablesDB.updateRow({
      databaseId: databaseId(),
      tableId: "notifications",
      rowId: id,
      data: { read: true },
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
