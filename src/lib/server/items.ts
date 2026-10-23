import "server-only";

import { AppwriteException, ID, Query } from "node-appwrite";
import { getAdminServices } from "./appwrite";
import { getProfileRow } from "./auth";
import type { Item } from "../types";
import { normalizeRelation } from "./db";

export async function listAvailableItems(params: {
  locality: string;
  queries?: string[];
}) {
  const { tablesDB } = getAdminServices();
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop";
  const result = await tablesDB.listRows({
    databaseId,
    tableId: "items",
    queries: [
      Query.equal("locality", params.locality),
      Query.equal("status", "available"),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
      Query.select(["*", "owner.*"]),
      ...(params.queries ?? []),
    ],
  });

  return result.rows.map((row) => {
    const item = row as unknown as Item;
    item.owner = normalizeRelation(item.owner);
    return item;
  });
}

export async function enrichItemsWithOwners(items: Item[]) {
  const missingIds = Array.from(
    new Set(
      items
        .filter((item) => !item.owner && item.owner_id)
        .map((item) => item.owner_id),
    ),
  );
  if (!missingIds.length) return items;

  const profiles = await Promise.all(missingIds.map((id) => getProfileRow(id)));
  const byId = new Map(
    profiles
      .filter((profile) => profile !== null)
      .map((profile) => [profile.$id, profile]),
  );

  return items.map((item) => ({
    ...item,
    owner: item.owner ?? byId.get(item.owner_id) ?? null,
  }));
}

export async function safeGetRow(tableId: string, rowId: string) {
  const { tablesDB } = getAdminServices();
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop";
  try {
    return await tablesDB.getRow({ databaseId, tableId, rowId });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) return null;
    throw error;
  }
}

export function newRowId() {
  return ID.unique();
}
