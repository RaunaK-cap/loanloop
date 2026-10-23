"use client";

import { Query } from "appwrite";
import { tablesDB, filePreviewUrl } from "./appwrite/client";
import { apiFetch, apiUpload } from "./api-client";
import { publicEnv, isDemoMode } from "./env";
import * as demo from "./demo/store";
import type {
  ChatResponse,
  Item,
  Loan,
  LoanEvent,
  Notification,
  Profile,
} from "./types";
import type { CategoryId, ConditionId, LocalityId } from "./constants";

const databaseId = publicEnv.databaseId;

function withImage(item: Item): Item {
  if (item.image_url || !item.image_id) return item;
  return { ...item, image_url: filePreviewUrl(item.image_id, 1000) };
}

function relation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeItem(row: Item): Item {
  return withImage({ ...row, owner: relation(row.owner) });
}

function normalizeLoan(row: Loan): Loan {
  const item = row.item ? normalizeItem(row.item) : null;
  return {
    ...row,
    item,
    owner: relation(row.owner),
    borrower: relation(row.borrower),
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (isDemoMode) return demo.getDemoProfile();
  try {
    return (await tablesDB.getRow({
      databaseId,
      tableId: "profiles",
      rowId: userId,
    })) as Profile;
  } catch {
    return null;
  }
}

export async function updateProfile(input: {
  display_name: string;
  locality: LocalityId;
  bio?: string;
}) {
  if (isDemoMode) {
    return demo.getDemoProfile();
  }
  return apiFetch<Profile>("/api/profile", { method: "POST", body: input });
}

export async function listItems(locality: LocalityId): Promise<Item[]> {
  if (isDemoMode) return demo.demoListItems();
  try {
    const result = await tablesDB.listRows({
      databaseId,
      tableId: "items",
      queries: [
        Query.equal("locality", locality),
        Query.equal("status", "available"),
        Query.orderDesc("$createdAt"),
        Query.limit(60),
        Query.select(["*", "owner.*"]),
      ],
    });
    return result.rows.map((row) => normalizeItem(row as unknown as Item));
  } catch (error) {
    console.error("[items:list]", error);
    throw error;
  }
}

export async function listMyItems(userId: string): Promise<Item[]> {
  if (isDemoMode) {
    const state = demo.getDemoState();
    return state.items
      .filter((item) => item.owner_id === "demo-aisha")
      .map((item) => demo.hydrateItem(state, item));
  }
  const result = await tablesDB.listRows({
    databaseId,
    tableId: "items",
    queries: [
      Query.equal("owner_id", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(60),
      Query.select(["*", "owner.*"]),
    ],
  });
  return result.rows.map((row) => normalizeItem(row as unknown as Item));
}

export async function getItem(id: string): Promise<Item | null> {
  if (isDemoMode) return demo.demoGetItem(id);
  try {
    const row = await tablesDB.getRow({
      databaseId,
      tableId: "items",
      rowId: id,
      queries: [Query.select(["*", "owner.*"])],
    });
    return normalizeItem(row as unknown as Item);
  } catch (error) {
    console.error("[items:get]", error);
    return null;
  }
}

export async function createItem(input: {
  title: string;
  description: string;
  category: CategoryId;
  condition: ConditionId;
  image_url?: string;
  image_id?: string;
}) {
  if (isDemoMode) return demo.demoCreateItem(input);
  return apiFetch<Item>("/api/items", { method: "POST", body: input });
}

export async function updateItem(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    category: CategoryId;
    condition: ConditionId;
    image_url: string;
    image_id: string;
    status: "available" | "unavailable";
  }>,
) {
  if (isDemoMode) return demo.demoUpdateItem(id, input);
  return apiFetch<Item>(`/api/items/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteItem(id: string) {
  if (isDemoMode) {
    demo.demoDeleteItem(id);
    return;
  }
  await apiFetch<{ ok: true }>(`/api/items/${id}`, { method: "DELETE" });
}

export async function uploadItemImage(file: File) {
  if (isDemoMode) {
    if (file.size > 1_500_000) {
      throw new Error("Demo uploads must be under 1.5 MB. Use an image URL instead.");
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read that image."));
      reader.readAsDataURL(file);
    });
    return { fileId: "", url: dataUrl };
  }

  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<{ fileId: string; url: string }>("/api/uploads", formData);
}

export async function listMyLoans(userId: string): Promise<Loan[]> {
  if (isDemoMode) return demo.demoListLoans();

  const select = [
    "*",
    "item.*",
    "item.owner.*",
    "owner.*",
    "borrower.*",
  ];
  const [owned, borrowed] = await Promise.all([
    tablesDB.listRows({
      databaseId,
      tableId: "loans",
      queries: [
        Query.equal("owner_id", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(60),
        Query.select(select),
      ],
    }),
    tablesDB.listRows({
      databaseId,
      tableId: "loans",
      queries: [
        Query.equal("borrower_id", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(60),
        Query.select(select),
      ],
    }),
  ]);

  const byId = new Map(
    [...owned.rows, ...borrowed.rows].map((row) => [row.$id, row]),
  );

  return [...byId.values()]
    .map((row) => normalizeLoan(row as unknown as Loan))
    .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
}

export async function getLoan(id: string): Promise<Loan | null> {
  if (isDemoMode) return demo.demoGetLoan(id);
  try {
    const row = await tablesDB.getRow({
      databaseId,
      tableId: "loans",
      rowId: id,
      queries: [
        Query.select(["*", "item.*", "item.owner.*", "owner.*", "borrower.*"]),
      ],
    });
    return normalizeLoan(row as unknown as Loan);
  } catch (error) {
    console.error("[loans:get]", error);
    return null;
  }
}

export async function listLoanEvents(loanId: string): Promise<LoanEvent[]> {
  if (isDemoMode) return demo.demoListEvents(loanId);
  const result = await tablesDB.listRows({
    databaseId,
    tableId: "loan_events",
    queries: [
      Query.equal("loan_id", loanId),
      Query.orderAsc("$createdAt"),
      Query.limit(50),
    ],
  });
  return result.rows as unknown as LoanEvent[];
}

export async function requestLoan(input: {
  item_id: string;
  due_at: string;
  note?: string;
}) {
  if (isDemoMode) return demo.demoRequestLoan(input);
  return apiFetch<Loan>("/api/loans", { method: "POST", body: input });
}

export async function loanAction(
  loanId: string,
  action: "approve" | "decline" | "cancel" | "return",
  note?: string,
) {
  if (isDemoMode) return demo.demoLoanAction(loanId, action, note);
  return apiFetch<Loan>(`/api/loans/${loanId}/${action}`, {
    method: "POST",
    body: { note },
  });
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  if (isDemoMode) return demo.demoListNotifications();
  const result = await tablesDB.listRows({
    databaseId,
    tableId: "notifications",
    queries: [
      Query.equal("user_id", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(60),
    ],
  });
  return result.rows as unknown as Notification[];
}

export async function markNotificationRead(id: string) {
  if (isDemoMode) {
    demo.demoMarkNotificationRead(id);
    return;
  }
  await apiFetch<{ ok: true }>(`/api/notifications/${id}`, {
    method: "PATCH",
    body: { read: true },
  });
}

export async function askAssistant(message: string): Promise<ChatResponse> {
  if (isDemoMode) return demo.demoAsk(message) as ChatResponse;
  return apiFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: { message },
  });
}

export async function revealContact(loanId: string) {
  if (isDemoMode) {
    const loan = demo.demoGetLoan(loanId);
    if (!loan) throw new Error("Loan not found.");
    const other =
      loan.owner_id === "demo-aisha" ? loan.borrower : loan.owner;
    const emails: Record<string, string> = {
      "demo-aisha": "aisha@sunshine.demo",
      "demo-rohan": "rohan@sunshine.demo",
      "demo-maya": "maya@sunshine.demo",
      "demo-dev": "dev@sunshine.demo",
    };
    if (!other) throw new Error("Contact details are not available.");
    return {
      name: other.display_name,
      email: emails[other.$id] ?? "neighbor@sunshine.demo",
    };
  }
  return apiFetch<{ name: string; email: string }>(
    `/api/loans/${loanId}/contact`,
  );
}
