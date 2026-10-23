import "server-only";

import { ID } from "node-appwrite";
import { getAdminServices } from "@/lib/server/appwrite";
import { requireProfile } from "@/lib/server/auth";
import { communityRead } from "@/lib/server/db";
import { hasGemini } from "@/lib/server/env";
import { embedText } from "@/lib/server/gemini";
import { handleRouteError, jsonOk, readJson } from "@/lib/server/http";
import { itemCreateSchema } from "@/lib/validation";
import type { Item } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = itemCreateSchema.parse(await readJson(request));
    const { user, profile } = await requireProfile(request);
    const { tablesDB } = getAdminServices();

    const searchText = [
      body.title,
      body.description,
      body.category,
      body.condition,
      profile.display_name,
      "sunshine apartments",
    ].join(" ");

    const embedding = await embedText(searchText);
    const embeddingStatus = embedding
      ? "ready"
      : hasGemini()
        ? "failed"
        : "skipped";

    const data: Record<string, unknown> = {
      title: body.title,
      description: body.description,
      category: body.category,
      condition: body.condition,
      status: "available",
      owner_id: user.$id,
      owner: user.$id,
      locality: profile.locality,
      image_url: body.image_url || null,
      image_id: body.image_id || null,
      search_text: searchText,
      embedding_status: embeddingStatus,
    };

    if (embedding) data.embedding = embedding;

    const item = (await tablesDB.createRow({
      databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop",
      tableId: "items",
      rowId: ID.unique(),
      data,
      permissions: communityRead(),
    })) as Item;

    return jsonOk({ ...item, owner: profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
