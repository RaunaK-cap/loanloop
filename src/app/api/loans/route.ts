import "server-only";

import { AppwriteException, ID } from "node-appwrite";
import { getAdminServices } from "@/lib/server/appwrite";
import { requireProfile, HttpError } from "@/lib/server/auth";
import { loanPartiesRead, userRead } from "@/lib/server/db";
import { handleRouteError, jsonOk, readJson } from "@/lib/server/http";
import { loanCreateSchema, validateLoanWindow } from "@/lib/validation";
import type { Item } from "@/lib/types";

const databaseId = () =>
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop";

export async function POST(request: Request) {
  try {
    const { user, profile } = await requireProfile(request);
    const body = loanCreateSchema.parse(await readJson(request));
    const window = validateLoanWindow(body.due_at);
    if (!window.ok) throw new HttpError(422, window.error);

    const { tablesDB } = getAdminServices();
    let item: Item;
    try {
      item = (await tablesDB.getRow({
        databaseId: databaseId(),
        tableId: "items",
        rowId: body.item_id,
      })) as Item;
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        throw new HttpError(404, "That item doesn't exist.");
      }
      throw error;
    }

    if (item.owner_id === user.$id) {
      throw new HttpError(422, "That's already yours.");
    }
    if (item.locality !== profile.locality) {
      throw new HttpError(403, "That item is in another building.");
    }
    if (item.status !== "available") {
      throw new HttpError(
        409,
        "Someone just requested that item. Pick another from the shelf.",
      );
    }

    const loanId = ID.unique();
    const transaction = await tablesDB.createTransaction({ ttl: 120 });

    try {
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "items",
        rowId: item.$id,
        data: { status: "requested" },
        transactionId: transaction.$id,
      });

      const loan = await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "loans",
        rowId: loanId,
        data: {
          item_id: item.$id,
          item: item.$id,
          owner_id: item.owner_id,
          owner: item.owner_id,
          borrower_id: user.$id,
          borrower: user.$id,
          status: "requested",
          request_note: body.note ?? null,
          due_at: window.iso,
          approved_at: null,
          returned_at: null,
          declined_at: null,
        },
        permissions: loanPartiesRead(item.owner_id, user.$id),
        transactionId: transaction.$id,
      });

      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "loan_events",
        rowId: ID.unique(),
        data: {
          loan_id: loanId,
          loan: loanId,
          type: "requested",
          actor_id: user.$id,
          note: body.note ?? `Requested until ${new Date(window.iso).toDateString()}.`,
        },
        permissions: loanPartiesRead(item.owner_id, user.$id),
        transactionId: transaction.$id,
      });

      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "notifications",
        rowId: ID.unique(),
        data: {
          user_id: item.owner_id,
          type: "loan_requested",
          title: `${profile.display_name} wants your ${item.title}`,
          body:
            body.note ||
            `Requested until ${new Date(window.iso).toDateString()}. Open it to approve or decline.`,
          link: `/app/loans/${loanId}`,
          read: false,
        },
        permissions: userRead(item.owner_id),
        transactionId: transaction.$id,
      });

      await tablesDB.updateTransaction({
        transactionId: transaction.$id,
        commit: true,
      });

      return jsonOk(loan);
    } catch (error) {
      await tablesDB
        .updateTransaction({ transactionId: transaction.$id, rollback: true })
        .catch(() => undefined);

      if (error instanceof AppwriteException && error.code === 409) {
        throw new HttpError(
          409,
          "Someone just requested that item. Pick another from the shelf.",
        );
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
