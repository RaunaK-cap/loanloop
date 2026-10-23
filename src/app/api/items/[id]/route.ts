import "server-only";

import { AppwriteException, Query } from "node-appwrite";
import { getAdminServices } from "@/lib/server/appwrite";
import { requireProfile } from "@/lib/server/auth";
import { hasGemini } from "@/lib/server/env";
import { embedText } from "@/lib/server/gemini";
import { handleRouteError, jsonOk, readJson } from "@/lib/server/http";
import { itemUpdateSchema } from "@/lib/validation";
import type { Item } from "@/lib/types";
import { HttpError } from "@/lib/server/auth";

const databaseId = () =>
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop";

async function getOwnedItem(id: string, ownerId: string) {
  const { tablesDB } = getAdminServices();
  try {
    const item = (await tablesDB.getRow({
      databaseId: databaseId(),
      tableId: "items",
      rowId: id,
    })) as Item;
    if (item.owner_id !== ownerId) {
      throw new HttpError(403, "You can only change your own listings.");
    }
    return item;
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      throw new HttpError(404, "That listing doesn't exist.");
    }
    throw error;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, profile } = await requireProfile(request);
    const body = itemUpdateSchema.parse(await readJson(request));
    const item = await getOwnedItem(id, user.$id);

    if (
      body.status &&
      ["requested", "on_loan"].includes(item.status) &&
      body.status === "unavailable"
    ) {
      throw new HttpError(409, "This item is in a loan, so it can't be paused.");
    }

    const { tablesDB } = getAdminServices();
    const data: Record<string, unknown> = { ...body };

    if (body.image_url === "") data.image_url = null;
    if (body.image_id === "") data.image_id = null;

    const contentChanged =
      body.title !== undefined ||
      body.description !== undefined ||
      body.category !== undefined ||
      body.condition !== undefined;

    if (contentChanged) {
      const nextTitle = body.title ?? item.title;
      const nextDescription = body.description ?? item.description;
      const nextCategory = body.category ?? item.category;
      const nextCondition = body.condition ?? item.condition;
      const searchText = [
        nextTitle,
        nextDescription,
        nextCategory,
        nextCondition,
        profile.display_name,
        profile.locality,
      ].join(" ");
      data.search_text = searchText;

      const embedding = await embedText(searchText);
      if (embedding) {
        data.embedding = embedding;
        data.embedding_status = "ready";
      } else {
        data.embedding_status = hasGemini() ? "failed" : "skipped";
      }
    }

    const updated = (await tablesDB.updateRow({
      databaseId: databaseId(),
      tableId: "items",
      rowId: id,
      data,
    })) as Item;

    return jsonOk({ ...updated, owner: profile });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await requireProfile(request);
    await getOwnedItem(id, user.$id);

    const { tablesDB } = getAdminServices();
    const open = await tablesDB.listRows({
      databaseId: databaseId(),
      tableId: "loans",
      queries: [
        Query.equal("item_id", id),
        Query.equal("status", ["requested", "active", "overdue"]),
        Query.limit(1),
      ],
    });

    if (open.total > 0) {
      throw new HttpError(
        409,
        "This item has an open loan. Return it before removing the listing.",
      );
    }

    await tablesDB.deleteRow({
      databaseId: databaseId(),
      tableId: "items",
      rowId: id,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
