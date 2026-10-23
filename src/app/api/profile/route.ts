import "server-only";

import { getAdminServices } from "@/lib/server/appwrite";
import { getProfileRow, requireUser } from "@/lib/server/auth";
import { communityRead } from "@/lib/server/db";
import { handleRouteError, jsonOk, readJson } from "@/lib/server/http";
import { profileSchema } from "@/lib/validation";
import type { Profile } from "@/lib/types";

const databaseId = () => process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = profileSchema.parse(await readJson(request));
    const existing = await getProfileRow(user.$id);
    const { tablesDB } = getAdminServices();

    const profile = (await tablesDB.upsertRow({
      databaseId: databaseId(),
      tableId: "profiles",
      rowId: user.$id,
      data: {
        display_name: body.display_name,
        locality: body.locality,
        bio: body.bio ?? null,
        trust_score: existing?.trust_score ?? 50,
        completed_loans: existing?.completed_loans ?? 0,
      } as Record<string, unknown>,
      permissions: communityRead(),
    })) as Profile;

    return jsonOk(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}
