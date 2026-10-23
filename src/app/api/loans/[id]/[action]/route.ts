import "server-only";

import { AppwriteException, ID } from "node-appwrite";
import { getAdminServices } from "@/lib/server/appwrite";
import { requireProfile, getProfileRow, HttpError } from "@/lib/server/auth";
import { loanPartiesRead, userRead } from "@/lib/server/db";
import { handleRouteError, jsonOk, readJson } from "@/lib/server/http";
import { loanNoteSchema } from "@/lib/validation";
import { applyTrustChange, trustChangeForReturn } from "@/lib/trust";
import type { Item, Loan } from "@/lib/types";

const databaseId = () =>
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop";

type Action = "approve" | "decline" | "cancel" | "return";

function isAction(value: string): value is Action {
  return ["approve", "decline", "cancel", "return"].includes(value);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  let transactionId: string | null = null;

  try {
    const { id, action: rawAction } = await params;
    if (!isAction(rawAction)) {
      throw new HttpError(404, "Unknown loan action.");
    }
    const action = rawAction;
    const { user } = await requireProfile(request);
    const body = loanNoteSchema.parse(await readJson(request).catch(() => ({})));
    const { tablesDB } = getAdminServices();

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

    let item: Item;
    try {
      item = (await tablesDB.getRow({
        databaseId: databaseId(),
        tableId: "items",
        rowId: loan.item_id,
      })) as Item;
    } catch {
      throw new HttpError(404, "The item for this loan is no longer listed.");
    }

    const isOwner = loan.owner_id === user.$id;
    const isBorrower = loan.borrower_id === user.$id;

    if (!isOwner && !isBorrower) {
      throw new HttpError(403, "You're not part of this loan.");
    }

    if ((action === "approve" || action === "decline") && !isOwner) {
      throw new HttpError(403, "Only the owner can do that.");
    }
    if (action === "cancel" && !isBorrower) {
      throw new HttpError(403, "Only the borrower can cancel.");
    }
    if ((action === "approve" || action === "decline" || action === "cancel") && loan.status !== "requested") {
      throw new HttpError(409, "This request has already changed.");
    }
    if (action === "return" && !["active", "overdue"].includes(loan.status)) {
      throw new HttpError(409, "Only an active loan can be returned.");
    }

    const now = new Date().toISOString();
    const transaction = await tablesDB.createTransaction({ ttl: 120 });
    transactionId = transaction.$id;

    let nextLoan: Partial<Loan> = {};

    if (action === "approve") {
      nextLoan = { status: "active", approved_at: now };
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "loans",
        rowId: loan.$id,
        data: nextLoan,
        transactionId,
      });
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "items",
        rowId: item.$id,
        data: { status: "on_loan" },
        transactionId,
      });
      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "loan_events",
        rowId: ID.unique(),
        data: {
          loan_id: loan.$id,
          loan: loan.$id,
          type: "approved",
          actor_id: user.$id,
          note: body.note ?? `Approved. Due ${new Date(loan.due_at).toDateString()}.`,
        },
        permissions: loanPartiesRead(loan.owner_id, loan.borrower_id),
        transactionId,
      });
      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "notifications",
        rowId: ID.unique(),
        data: {
          user_id: loan.borrower_id,
          type: "loan_approved",
          title: `Your request for ${item.title} was approved`,
          body: `Pickup details are visible now. Due ${new Date(loan.due_at).toDateString()}.`,
          link: `/app/loans/${loan.$id}`,
          read: false,
        },
        permissions: userRead(loan.borrower_id),
        transactionId,
      });
    }

    if (action === "decline") {
      nextLoan = { status: "declined", declined_at: now };
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "loans",
        rowId: loan.$id,
        data: nextLoan,
        transactionId,
      });
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "items",
        rowId: item.$id,
        data: { status: "available" },
        transactionId,
      });
      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "loan_events",
        rowId: ID.unique(),
        data: {
          loan_id: loan.$id,
          loan: loan.$id,
          type: "declined",
          actor_id: user.$id,
          note: body.note ?? null,
        },
        permissions: loanPartiesRead(loan.owner_id, loan.borrower_id),
        transactionId,
      });
      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "notifications",
        rowId: ID.unique(),
        data: {
          user_id: loan.borrower_id,
          type: "loan_declined",
          title: `Your request for ${item.title} was declined`,
          body: "The item is back on the shelf. There may be another option.",
          link: `/app/loans/${loan.$id}`,
          read: false,
        },
        permissions: userRead(loan.borrower_id),
        transactionId,
      });
    }

    if (action === "cancel") {
      nextLoan = { status: "cancelled" };
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "loans",
        rowId: loan.$id,
        data: nextLoan,
        transactionId,
      });
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "items",
        rowId: item.$id,
        data: { status: "available" },
        transactionId,
      });
      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "loan_events",
        rowId: ID.unique(),
        data: {
          loan_id: loan.$id,
          loan: loan.$id,
          type: "cancelled",
          actor_id: user.$id,
          note: body.note ?? null,
        },
        permissions: loanPartiesRead(loan.owner_id, loan.borrower_id),
        transactionId,
      });
      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "notifications",
        rowId: ID.unique(),
        data: {
          user_id: loan.owner_id,
          type: "loan_cancelled",
          title: `A request for ${item.title} was cancelled`,
          body: "The item is back on the shelf.",
          link: `/app/loans/${loan.$id}`,
          read: false,
        },
        permissions: userRead(loan.owner_id),
        transactionId,
      });
    }

    if (action === "return") {
      const borrower = await getProfileRow(loan.borrower_id);
      if (!borrower) {
        throw new HttpError(409, "The borrower profile is unavailable.");
      }
      const delta = trustChangeForReturn(loan.due_at, now);
      const nextTrust = applyTrustChange(borrower.trust_score, delta);
      nextLoan = {
        status: "returned",
        returned_at: now,
      };

      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "loans",
        rowId: loan.$id,
        data: nextLoan,
        transactionId,
      });
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "items",
        rowId: item.$id,
        data: { status: "available" },
        transactionId,
      });
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "profiles",
        rowId: borrower.$id,
        data: {
          trust_score: nextTrust,
          completed_loans: borrower.completed_loans + 1,
        },
        transactionId,
      });
      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "loan_events",
        rowId: ID.unique(),
        data: {
          loan_id: loan.$id,
          loan: loan.$id,
          type: "returned",
          actor_id: user.$id,
          note:
            body.note ??
            (delta > 0
              ? `Returned on time. Trust +${delta}.`
              : `Returned late. Trust ${delta}.`),
        },
        permissions: loanPartiesRead(loan.owner_id, loan.borrower_id),
        transactionId,
      });
      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "notifications",
        rowId: ID.unique(),
        data: {
          user_id: loan.owner_id,
          type: "loan_returned",
          title: `${item.title} was returned`,
          body:
            delta > 0
              ? `On time. Trust changed by +${delta}.`
              : `It came back late. Trust changed by ${delta}.`,
          link: `/app/loans/${loan.$id}`,
          read: false,
        },
        permissions: userRead(loan.owner_id),
        transactionId,
      });
      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "notifications",
        rowId: ID.unique(),
        data: {
          user_id: loan.borrower_id,
          type: "trust",
          title: `Trust score ${delta > 0 ? "+" : ""}${delta}`,
          body:
            delta > 0
              ? `You returned ${item.title} on time. Keep it up.`
              : `You returned ${item.title} late. Return the next one on time to rebuild.`,
          link: "/app/profile",
          read: false,
        },
        permissions: userRead(loan.borrower_id),
        transactionId,
      });
    }

    await tablesDB.updateTransaction({ transactionId, commit: true });

    return jsonOk({ ...loan, ...nextLoan });
  } catch (error) {
    if (transactionId) {
      const { tablesDB } = getAdminServices();
      await tablesDB
        .updateTransaction({ transactionId, rollback: true })
        .catch(() => undefined);
    }

    if (error instanceof AppwriteException && error.code === 409) {
      return handleRouteError(
        new HttpError(409, "This loan just changed. Refresh and try again."),
      );
    }
    return handleRouteError(error);
  }
}
