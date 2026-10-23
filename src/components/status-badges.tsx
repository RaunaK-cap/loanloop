import { Badge, Dot } from "@/components/ui/badge";
import { ITEM_STATUS_LABELS, LOAN_STATUS_LABELS } from "@/lib/constants";
import type { ItemStatus, LoanStatus } from "@/lib/types";

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  if (status === "available") {
    return (
      <Badge variant="positive">
        <Dot />
        Available
      </Badge>
    );
  }
  if (status === "requested") {
    return <Badge variant="warning">Requested</Badge>;
  }
  if (status === "on_loan") {
    return <Badge variant="neutral">On loan</Badge>;
  }
  return <Badge variant="outline">{ITEM_STATUS_LABELS[status]}</Badge>;
}

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  if (status === "active") {
    return (
      <Badge variant="positive">
        <Dot />
        Borrowed
      </Badge>
    );
  }
  if (status === "requested") {
    return <Badge variant="warning">Waiting</Badge>;
  }
  if (status === "overdue") {
    return <Badge variant="danger">Overdue</Badge>;
  }
  if (status === "returned") {
    return <Badge variant="neutral">Returned</Badge>;
  }
  if (status === "declined") {
    return <Badge variant="outline">Declined</Badge>;
  }
  return <Badge variant="outline">{LOAN_STATUS_LABELS[status]}</Badge>;
}
