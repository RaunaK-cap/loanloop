import "server-only";

import { AppwriteException } from "node-appwrite";
import { getAdminServices } from "@/lib/server/appwrite";
import { requireProfile, HttpError } from "@/lib/server/auth";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import type { Loan } from "@/lib/types";

const databaseId = () =>
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await requireProfile(request);
    const { tablesDB, users } = getAdminServices();

    let loan: Loan;
    try {
      loan = (await tablesDB.getRow({
        databaseId: databaseId(),
        tableId: "loans",
        rowId: id,
      })) as Loan;
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        throw new HttpError(404, "That loan doesn't exist.");
      }
      throw error;
    }

    if (loan.owner_id !== user.$id && loan.borrower_id !== user.$id) {
      throw new HttpError(403, "You're not part of this loan.");
    }
    if (!["active", "overdue"].includes(loan.status)) {
      throw new HttpError(
        403,
        "Contact details only unlock for an active or overdue loan.",
      );
    }

    const otherId =
      loan.owner_id === user.$id ? loan.borrower_id : loan.owner_id;

    try {
      const other = await users.get({ userId: otherId });
      return jsonOk({ name: other.name || "Neighbor", email: other.email });
    } catch {
      throw new HttpError(404, "That neighbor's contact is unavailable.");
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
