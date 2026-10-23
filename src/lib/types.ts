import type { CategoryId, ConditionId, LocalityId } from "./constants";

export type Row = {
  $id: string;
  $sequence?: string;
  $tableId?: string;
  $databaseId?: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions?: string[];
};

export type Profile = Row & {
  display_name: string;
  locality: LocalityId;
  trust_score: number;
  completed_loans: number;
  bio?: string | null;
  avatar_color?: string | null;
};

export type ItemStatus = "available" | "requested" | "on_loan" | "unavailable";
export type EmbeddingStatus = "pending" | "ready" | "skipped" | "failed";

export type Item = Row & {
  title: string;
  description: string;
  category: CategoryId;
  condition: ConditionId;
  status: ItemStatus;
  owner_id: string;
  locality: LocalityId;
  image_id?: string | null;
  image_url?: string | null;
  embedding?: number[] | null;
  embedding_status?: EmbeddingStatus;
  search_text?: string;
  owner?: Profile | null;
};

export type LoanStatus =
  | "requested"
  | "active"
  | "overdue"
  | "returned"
  | "declined"
  | "cancelled";

export type Loan = Row & {
  item_id: string;
  owner_id: string;
  borrower_id: string;
  status: LoanStatus;
  request_note?: string | null;
  due_at: string;
  approved_at?: string | null;
  returned_at?: string | null;
  declined_at?: string | null;
  item?: Item | null;
  owner?: Profile | null;
  borrower?: Profile | null;
};

export type LoanEventType =
  | "requested"
  | "approved"
  | "declined"
  | "returned"
  | "cancelled"
  | "overdue";

export type LoanEvent = Row & {
  loan_id: string;
  type: LoanEventType;
  actor_id: string;
  note?: string | null;
  loan?: Loan | null;
};

export type Notification = Row & {
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
};

export type SessionUser = {
  $id: string;
  email: string;
  name: string;
};

export type ChatItem = {
  $id: string;
  title: string;
  description: string;
  category: CategoryId;
  condition: ConditionId;
  status: ItemStatus;
  image_url?: string | null;
  owner_name: string;
  owner_trust: number;
};

export type ChatResponse = {
  answer: string;
  items: ChatItem[];
  source: "gemini" | "fallback";
};

export type ApiErrorBody = {
  error: string;
  details?: unknown;
};
