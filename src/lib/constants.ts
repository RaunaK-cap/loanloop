export const APP_NAME = "LoanLoop";
export const APP_TAGLINE = "Borrow from your building.";
export const APP_DESCRIPTION =
  "LoanLoop is a trust-first lending shelf for apartment communities. Borrow what you need from a neighbor instead of buying it for one weekend.";

export const DEMO_LOCALITY = "sunshine-apartments" as const;

export const LOCALITIES = [
  {
    id: "sunshine-apartments",
    name: "Sunshine Apartments",
    short: "Sunshine",
    area: "Indiranagar, Bengaluru",
  },
  {
    id: "green-park",
    name: "Green Park Residency",
    short: "Green Park",
    area: "Koramangala, Bengaluru",
  },
  {
    id: "maple-heights",
    name: "Maple Heights",
    short: "Maple Heights",
    area: "HSR Layout, Bengaluru",
  },
] as const;

export type LocalityId = (typeof LOCALITIES)[number]["id"];

export const CATEGORIES = [
  { id: "tools", label: "Tools", icon: "wrench" },
  { id: "kitchen", label: "Kitchen", icon: "cooking-pot" },
  { id: "camping", label: "Camping", icon: "tent" },
  { id: "electronics", label: "Electronics", icon: "projector" },
  { id: "sports", label: "Sports", icon: "dumbbell" },
  { id: "home", label: "Home", icon: "lamp" },
  { id: "books", label: "Books", icon: "book-open" },
  { id: "other", label: "Other", icon: "package" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CONDITIONS = [
  { id: "new", label: "Like new" },
  { id: "good", label: "Good" },
  { id: "fair", label: "Fair" },
  { id: "well-loved", label: "Well loved" },
] as const;

export type ConditionId = (typeof CONDITIONS)[number]["id"];

export const ITEM_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  requested: "Requested",
  on_loan: "On loan",
  unavailable: "Paused",
};

export const LOAN_STATUS_LABELS: Record<string, string> = {
  requested: "Waiting for approval",
  active: "Borrowed",
  overdue: "Overdue",
  returned: "Returned",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const LOAN_EVENT_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  declined: "Declined",
  returned: "Returned",
  cancelled: "Cancelled",
  overdue: "Marked overdue",
};

export const TRUST_START = 50;
export const TRUST_MIN = 0;
export const TRUST_MAX = 100;
export const TRUST_ON_TIME = 5;
export const TRUST_LATE_PER_DAY = -2;
export const TRUST_LATE_CAP = -10;

export const MAX_ITEM_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_LOAN_DAYS = 21;

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.label]),
) as Record<CategoryId, string>;

export const CONDITION_LABELS = Object.fromEntries(
  CONDITIONS.map((condition) => [condition.id, condition.label]),
) as Record<ConditionId, string>;

export const LOCALITY_LABELS = Object.fromEntries(
  LOCALITIES.map((locality) => [locality.id, locality.name]),
) as Record<string, string>;
