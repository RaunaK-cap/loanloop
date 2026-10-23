import "server-only";

import { ID, Permission, Query, Role } from "node-appwrite";
import { connection } from "next/server";
import { getAdminServices } from "@/lib/server/appwrite";
import { jsonError, jsonOk, handleRouteError } from "@/lib/server/http";
import type { Loan } from "@/lib/types";

const databaseId = () =>
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop";

export const maxDuration = 60;

export async function GET(request: Request) {
  await connection();
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const header = request.headers.get("authorization");
      if (header !== `Bearer ${secret}`) {
        return jsonError(401, "Unauthorized.");
      }
    }

    const { tablesDB } = getAdminServices();
    const now = new Date().toISOString();
    const result = await tablesDB.listRows({
      databaseId: databaseId(),
      tableId: "loans",
      queries: [
        Query.equal("status", "active"),
        Query.lessThan("due_at", now),
        Query.limit(100),
        Query.select(["*", "item.*"]),
      ],
    });

    let marked = 0;
    for (const row of result.rows as unknown as Loan[]) {
      const itemTitle = row.item?.title ?? "an item";
      await tablesDB.updateRow({
        databaseId: databaseId(),
        tableId: "loans",
        rowId: row.$id,
        data: { status: "overdue" },
      });

      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "loan_events",
        rowId: ID.unique(),
        data: {
          loan_id: row.$id,
          loan: row.$id,
          type: "overdue",
          actor_id: "system",
          note: `The return date passed for ${itemTitle}.`,
        },
        permissions: [
          Permission.read(Role.user(row.owner_id)),
          Permission.read(Role.user(row.borrower_id)),
        ],
      });

      await tablesDB.createRow({
        databaseId: databaseId(),
        tableId: "notifications",
        rowId: ID.unique(),
        data: {
          user_id: row.borrower_id,
          type: "loan_overdue",
          title: `${itemTitle} is overdue`,
          body: "Return it to keep your trust score steady. Late days cost 2 points each, up to 10.",
          link: `/app/loans/${row.$id}`,
          read: false,
        },
        permissions: [Permission.read(Role.user(row.borrower_id))],
      });

      marked += 1;
    }

    return jsonOk({ ok: true, marked });
  } catch (error) {
    return handleRouteError(error);
  }
}
