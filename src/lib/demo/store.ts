"use client";

import type {
  Item,
  Loan,
  LoanEvent,
  LoanEventType,
  Notification,
  Profile,
  SessionUser,
} from "../types";
import type { CategoryId, ConditionId } from "../constants";
import { DEMO_LOCALITY } from "../constants";
import { trustChangeForReturn, applyTrustChange } from "../trust";
import { colorForId, initials } from "../utils";

const STATE_KEY = "loanloop.demo.state.v1";
const SESSION_KEY = "loanloop.demo.session.v1";

type DemoState = {
  profiles: Profile[];
  items: Item[];
  loans: Loan[];
  events: LoanEvent[];
  notifications: Notification[];
};

type ItemInput = {
  title: string;
  description: string;
  category: CategoryId;
  condition: ConditionId;
  image_url?: string | null;
};

const now = () => new Date().toISOString();
const iso = (offsetDays: number, hour = 12) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};
const created = (offsetDays: number) => iso(offsetDays, 10);

const PROFILES: Profile[] = [
  {
    $id: "demo-aisha",
    $createdAt: created(-120),
    $updatedAt: created(-2),
    display_name: "Aisha Rao",
    locality: "sunshine-apartments",
    trust_score: 72,
    completed_loans: 14,
    bio: "Plant parent, occasional baker, always happy to lend the good ladder.",
    avatar_color: "#D95D39",
  },
  {
    $id: "demo-rohan",
    $createdAt: created(-95),
    $updatedAt: created(-4),
    display_name: "Rohan Mehta",
    locality: "sunshine-apartments",
    trust_score: 68,
    completed_loans: 9,
    bio: "Weekend woodworker. The drill has a full battery.",
    avatar_color: "#2F6B4F",
  },
  {
    $id: "demo-maya",
    $createdAt: created(-200),
    $updatedAt: created(-1),
    display_name: "Maya Iyer",
    locality: "sunshine-apartments",
    trust_score: 81,
    completed_loans: 23,
    bio: "Camping gear, board games, and a very good projector.",
    avatar_color: "#4A5D8A",
  },
  {
    $id: "demo-dev",
    $createdAt: created(-60),
    $updatedAt: created(-3),
    display_name: "Dev Shah",
    locality: "sunshine-apartments",
    trust_score: 59,
    completed_loans: 5,
    bio: "New to the building. Happy to share what I have.",
    avatar_color: "#9A6B2F",
  },
];

const ITEMS: Item[] = [
  {
    $id: "item-ladder",
    $createdAt: created(-30),
    $updatedAt: created(-30),
    title: "5ft wooden step ladder",
    description:
      "Solid wood, a little weathered, still steady. Perfect for ceiling lights, curtain rods, and the top shelf.",
    category: "tools",
    condition: "well-loved",
    status: "available",
    owner_id: "demo-aisha",
    locality: "sunshine-apartments",
    image_url:
      "/seed/ladder.webp",
    embedding_status: "skipped",
    search_text: "5ft wooden step ladder tools wood ceiling lights curtain rods top shelf",
  },
  {
    $id: "item-tent",
    $createdAt: created(-25),
    $updatedAt: created(-2),
    title: "2-person camping tent",
    description:
      "Quechua pop-up tent. Sets up in about a minute, comes with the carry bag and a small repair patch.",
    category: "camping",
    condition: "good",
    status: "on_loan",
    owner_id: "demo-maya",
    locality: "sunshine-apartments",
    image_url:
      "/seed/tent.webp",
    embedding_status: "skipped",
    search_text: "2-person camping tent quechua pop-up outdoor",
  },
  {
    $id: "item-cooker",
    $createdAt: created(-20),
    $updatedAt: created(-1),
    title: "5L pressure cooker",
    description:
      "Hawkins pressure cooker with the whistle and a spare gasket. Great for dal, rice, and Sunday biryani.",
    category: "kitchen",
    condition: "well-loved",
    status: "requested",
    owner_id: "demo-aisha",
    locality: "sunshine-apartments",
    image_url:
      "/seed/cooker.webp",
    embedding_status: "skipped",
    search_text: "5l pressure cooker hawkins kitchen dal rice biryani",
  },
  {
    $id: "item-drill",
    $createdAt: created(-40),
    $updatedAt: created(-5),
    title: "Cordless drill + bit set",
    description:
      "DeWalt 12V drill with a full battery and a box of wood bits. Please return the battery on the charger.",
    category: "tools",
    condition: "good",
    status: "available",
    owner_id: "demo-rohan",
    locality: "sunshine-apartments",
    image_url:
      "/seed/drill.webp",
    embedding_status: "skipped",
    search_text: "cordless drill bit set dewalt tools battery wood",
  },
  {
    $id: "item-projector",
    $createdAt: created(-15),
    $updatedAt: created(-15),
    title: "Mini projector",
    description:
      "1080p mini projector with HDMI and a small speaker. Good for movie nights on a white wall or a sheet.",
    category: "electronics",
    condition: "good",
    status: "available",
    owner_id: "demo-dev",
    locality: "sunshine-apartments",
    image_url:
      "/seed/projector.webp",
    embedding_status: "skipped",
    search_text: "mini projector 1080p hdmi movie night electronics",
  },
  {
    $id: "item-badminton",
    $createdAt: created(-18),
    $updatedAt: created(-18),
    title: "Badminton rackets + shuttle",
    description:
      "Two Yonex rackets and a tube of shuttles. One grip is a little worn but still plays fine.",
    category: "sports",
    condition: "fair",
    status: "available",
    owner_id: "demo-rohan",
    locality: "sunshine-apartments",
    image_url:
      "/seed/badminton.webp",
    embedding_status: "skipped",
    search_text: "badminton rackets shuttle yonex sports",
  },
  {
    $id: "item-camera",
    $createdAt: created(-9),
    $updatedAt: created(-9),
    title: "Fujifilm X100V",
    description:
      "Compact camera with a fixed 23mm lens. Comes with two batteries and a wrist strap. Please keep it dry.",
    category: "electronics",
    condition: "good",
    status: "available",
    owner_id: "demo-maya",
    locality: "sunshine-apartments",
    image_url:
      "/seed/camera.webp",
    embedding_status: "skipped",
    search_text: "fujifilm x100v compact camera photography electronics",
  },
  {
    $id: "item-books",
    $createdAt: created(-12),
    $updatedAt: created(-12),
    title: "Weekend reading stack",
    description:
      "A stack of good weekend reads: Zero to One, The Obstacle Is the Way, The Startup Owner's Manual, and The Corporate Startup.",
    category: "books",
    condition: "well-loved",
    status: "available",
    owner_id: "demo-aisha",
    locality: "sunshine-apartments",
    image_url:
      "/seed/books.webp",
    embedding_status: "skipped",
    search_text: "weekend reading stack zero to one obstacle startup books",
  },
];

const LOANS: Loan[] = [
  {
    $id: "loan-tent",
    $createdAt: created(-4),
    $updatedAt: created(-2),
    item_id: "item-tent",
    owner_id: "demo-maya",
    borrower_id: "demo-aisha",
    status: "active",
    request_note: "Heading to Coorg for the weekend. Will bring it back clean and dry.",
    due_at: iso(3, 18),
    approved_at: created(-2),
    returned_at: null,
    declined_at: null,
  },
  {
    $id: "loan-cooker",
    $createdAt: created(-1),
    $updatedAt: created(-1),
    item_id: "item-cooker",
    owner_id: "demo-aisha",
    borrower_id: "demo-rohan",
    status: "requested",
    request_note: "Making biryani for a birthday dinner. Can return it Sunday evening.",
    due_at: iso(5, 18),
    approved_at: null,
    returned_at: null,
    declined_at: null,
  },
  {
    $id: "loan-drill",
    $createdAt: created(-12),
    $updatedAt: created(-5),
    item_id: "item-drill",
    owner_id: "demo-rohan",
    borrower_id: "demo-aisha",
    status: "returned",
    request_note: "Need to put up two shelves.",
    due_at: created(-5),
    approved_at: created(-11),
    returned_at: created(-5),
    declined_at: null,
  },
];

const EVENTS: LoanEvent[] = [
  {
    $id: "event-tent-1",
    $createdAt: created(-4),
    $updatedAt: created(-4),
    loan_id: "loan-tent",
    type: "requested",
    actor_id: "demo-aisha",
    note: "Asked for 3 days.",
  },
  {
    $id: "event-tent-2",
    $createdAt: created(-2),
    $updatedAt: created(-2),
    loan_id: "loan-tent",
    type: "approved",
    actor_id: "demo-maya",
    note: "Approved. Have a good trip.",
  },
  {
    $id: "event-cooker-1",
    $createdAt: created(-1),
    $updatedAt: created(-1),
    loan_id: "loan-cooker",
    type: "requested",
    actor_id: "demo-rohan",
    note: "Asked for 5 days.",
  },
  {
    $id: "event-drill-1",
    $createdAt: created(-12),
    $updatedAt: created(-12),
    loan_id: "loan-drill",
    type: "requested",
    actor_id: "demo-aisha",
    note: null,
  },
  {
    $id: "event-drill-2",
    $createdAt: created(-11),
    $updatedAt: created(-11),
    loan_id: "loan-drill",
    type: "approved",
    actor_id: "demo-rohan",
    note: null,
  },
  {
    $id: "event-drill-3",
    $createdAt: created(-5),
    $updatedAt: created(-5),
    loan_id: "loan-drill",
    type: "returned",
    actor_id: "demo-aisha",
    note: "Returned on time.",
  },
];

const NOTIFICATIONS: Notification[] = [
  {
    $id: "note-1",
    $createdAt: created(-1),
    $updatedAt: created(-1),
    user_id: "demo-aisha",
    type: "loan_requested",
    title: "Rohan wants your pressure cooker",
    body: "For a birthday biryani. He can return it Sunday evening.",
    link: "/app/loans/loan-cooker",
    read: false,
  },
  {
    $id: "note-2",
    $createdAt: created(-2),
    $updatedAt: created(-2),
    user_id: "demo-aisha",
    type: "loan_approved",
    title: "Maya approved your tent request",
    body: "Pickup is at Maple Wing, 4B. Due back in 3 days.",
    link: "/app/loans/loan-tent",
    read: false,
  },
  {
    $id: "note-3",
    $createdAt: created(-5),
    $updatedAt: created(-5),
    user_id: "demo-aisha",
    type: "trust",
    title: "Trust score +5",
    body: "You returned the cordless drill on time. Rohan marked it returned.",
    link: "/app/profile",
    read: true,
  },
];

function seedState(): DemoState {
  return {
    profiles: structuredClone(PROFILES),
    items: structuredClone(ITEMS),
    loans: structuredClone(LOANS),
    events: structuredClone(EVENTS),
    notifications: structuredClone(NOTIFICATIONS),
  };
}

export function getDemoState(): DemoState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) {
      const initial = seedState();
      window.localStorage.setItem(STATE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as DemoState;
  } catch {
    return seedState();
  }
}

function save(state: DemoState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }
  return state;
}

export function resetDemoState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STATE_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

export function hasDemoSession() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(SESSION_KEY));
}

export function demoSignIn() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, "demo-aisha");
  }
}

export function demoSignOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function getDemoSessionUser(): SessionUser | null {
  if (!hasDemoSession()) return null;
  return {
    $id: "demo-aisha",
    email: "aisha@sunshine.demo",
    name: "Aisha Rao",
  };
}

export function getDemoProfile(): Profile {
  const state = getDemoState();
  return state.profiles.find((profile) => profile.$id === "demo-aisha") ?? PROFILES[0];
}

export function hydrateItem(state: DemoState, item: Item): Item {
  const owner =
    state.profiles.find((profile) => profile.$id === item.owner_id) ?? null;
  return { ...item, owner };
}

export function demoListItems() {
  const state = getDemoState();
  return state.items
    .filter(
      (item) =>
        item.locality === DEMO_LOCALITY && item.status === "available",
    )
    .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt))
    .map((item) => hydrateItem(state, item));
}

export function demoGetItem(id: string) {
  const state = getDemoState();
  const item = state.items.find((row) => row.$id === id);
  return item ? hydrateItem(state, item) : null;
}

export function demoCreateItem(input: ItemInput) {
  const state = getDemoState();
  const item: Item = {
    $id: `item-${crypto.randomUUID()}`,
    $createdAt: now(),
    $updatedAt: now(),
    ...input,
    status: "available",
    owner_id: "demo-aisha",
    locality: DEMO_LOCALITY,
    image_url: input.image_url || null,
    embedding_status: "skipped",
    search_text: `${input.title} ${input.description} ${input.category} ${input.condition}`,
  };
  state.items.unshift(item);
  save(state);
  return hydrateItem(state, item);
}

export function demoUpdateItem(
  id: string,
  input: Partial<ItemInput> & { status?: "available" | "unavailable" },
) {
  const state = getDemoState();
  const index = state.items.findIndex((item) => item.$id === id);
  if (index < 0) throw new Error("Item not found.");
  if (state.items[index].owner_id !== "demo-aisha") {
    throw new Error("You can only edit your own items.");
  }
  const item = {
    ...state.items[index],
    ...input,
    $updatedAt: now(),
  };
  state.items[index] = item;
  save(state);
  return hydrateItem(state, item);
}

export function demoDeleteItem(id: string) {
  const state = getDemoState();
  const item = state.items.find((row) => row.$id === id);
  if (!item) throw new Error("Item not found.");
  if (item.owner_id !== "demo-aisha") {
    throw new Error("You can only remove your own items.");
  }
  state.items = state.items.filter((row) => row.$id !== id);
  save(state);
}

export function hydrateLoan(state: DemoState, loan: Loan): Loan {
  const item = state.items.find((row) => row.$id === loan.item_id);
  return {
    ...loan,
    item: item ? hydrateItem(state, item) : null,
    owner:
      state.profiles.find((profile) => profile.$id === loan.owner_id) ?? null,
    borrower:
      state.profiles.find((profile) => profile.$id === loan.borrower_id) ?? null,
  };
}

export function demoListLoans() {
  const state = getDemoState();
  return state.loans
    .filter(
      (loan) =>
        loan.owner_id === "demo-aisha" || loan.borrower_id === "demo-aisha",
    )
    .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt))
    .map((loan) => hydrateLoan(state, loan));
}

export function demoGetLoan(id: string) {
  const state = getDemoState();
  const loan = state.loans.find((row) => row.$id === id);
  if (!loan) return null;
  return hydrateLoan(state, loan);
}

export function demoListEvents(loanId: string) {
  const state = getDemoState();
  return state.events
    .filter((event) => event.loan_id === loanId)
    .sort((a, b) => a.$createdAt.localeCompare(b.$createdAt));
}

function pushEvent(
  state: DemoState,
  loan: Loan,
  type: LoanEventType,
  actorId: string,
  note?: string,
) {
  state.events.push({
    $id: `event-${crypto.randomUUID()}`,
    $createdAt: now(),
    $updatedAt: now(),
    loan_id: loan.$id,
    type,
    actor_id: actorId,
    note: note ?? null,
  });
}

function pushNotification(
  state: DemoState,
  userId: string,
  type: string,
  title: string,
  body: string,
  link: string,
) {
  state.notifications.unshift({
    $id: `note-${crypto.randomUUID()}`,
    $createdAt: now(),
    $updatedAt: now(),
    user_id: userId,
    type,
    title,
    body,
    link,
    read: false,
  });
}

export function demoRequestLoan(input: {
  item_id: string;
  due_at: string;
  note?: string;
}) {
  const state = getDemoState();
  const item = state.items.find((row) => row.$id === input.item_id);
  if (!item) throw new Error("Item not found.");
  if (item.status !== "available") {
    throw new Error("Someone just requested this. Pick another item.");
  }
  if (item.owner_id === "demo-aisha") {
    throw new Error("That's already yours.");
  }

  item.status = "requested";
  item.$updatedAt = now();

  const loan: Loan = {
    $id: `loan-${crypto.randomUUID()}`,
    $createdAt: now(),
    $updatedAt: now(),
    item_id: item.$id,
    owner_id: item.owner_id,
    borrower_id: "demo-aisha",
    status: "requested",
    request_note: input.note ?? null,
    due_at: new Date(`${input.due_at}T23:59:59`).toISOString(),
    approved_at: null,
    returned_at: null,
    declined_at: null,
  };
  state.loans.unshift(loan);
  pushEvent(state, loan, "requested", "demo-aisha", input.note);
  pushNotification(
    state,
    item.owner_id,
    "loan_requested",
    `${getDemoProfile().display_name} wants your ${item.title}`,
    input.note || "Open the request to approve or decline.",
    `/app/loans/${loan.$id}`,
  );
  save(state);
  return hydrateLoan(state, loan);
}

export function demoLoanAction(
  loanId: string,
  action: "approve" | "decline" | "cancel" | "return",
  note?: string,
) {
  const state = getDemoState();
  const loan = state.loans.find((row) => row.$id === loanId);
  if (!loan) throw new Error("Loan not found.");
  const item = state.items.find((row) => row.$id === loan.item_id);
  if (!item) throw new Error("Item not found.");

  const isOwner = loan.owner_id === "demo-aisha";
  const isBorrower = loan.borrower_id === "demo-aisha";

  if (action === "approve" || action === "decline") {
    if (!isOwner) throw new Error("Only the owner can do that.");
    if (loan.status !== "requested") throw new Error("This request already changed.");
    if (action === "approve") {
      loan.status = "active";
      loan.approved_at = now();
      item.status = "on_loan";
      pushEvent(state, loan, "approved", "demo-aisha", note);
      pushNotification(
        state,
        loan.borrower_id,
        "loan_approved",
        `Your request for ${item.title} was approved`,
        `Pickup details are now visible. Due ${new Date(loan.due_at).toLocaleDateString("en-IN")}.`,
        `/app/loans/${loan.$id}`,
      );
    } else {
      loan.status = "declined";
      loan.declined_at = now();
      item.status = "available";
      pushEvent(state, loan, "declined", "demo-aisha", note);
      pushNotification(
        state,
        loan.borrower_id,
        "loan_declined",
        `Your request for ${item.title} was declined`,
        "The item is back on the shelf. There may be another option.",
        `/app/loans/${loan.$id}`,
      );
    }
  }

  if (action === "cancel") {
    if (!isBorrower) throw new Error("Only the borrower can cancel.");
    if (loan.status !== "requested") throw new Error("This request already changed.");
    loan.status = "cancelled";
    item.status = "available";
    pushEvent(state, loan, "cancelled", "demo-aisha", note);
    pushNotification(
      state,
      loan.owner_id,
      "loan_cancelled",
      `A request for ${item.title} was cancelled`,
      "The item is back on the shelf.",
      `/app/loans/${loan.$id}`,
    );
  }

  if (action === "return") {
    if (!isOwner && !isBorrower) throw new Error("Only the loan parties can do that.");
    if (loan.status !== "active" && loan.status !== "overdue") {
      throw new Error("Only an active loan can be returned.");
    }
    const returnedAt = now();
    const delta = trustChangeForReturn(loan.due_at, returnedAt);
    loan.status = "returned";
    loan.returned_at = returnedAt;
    item.status = "available";
    pushEvent(state, loan, "returned", "demo-aisha", note || `Trust ${delta > 0 ? "+" : ""}${delta}.`);

    const borrower = state.profiles.find(
      (profile) => profile.$id === loan.borrower_id,
    );
    if (borrower) {
      borrower.trust_score = applyTrustChange(borrower.trust_score, delta);
      borrower.completed_loans += 1;
    }
    pushNotification(
      state,
      loan.owner_id,
      "loan_returned",
      `${item.title} was returned`,
      delta > 0
        ? `On time. ${getDemoProfile().display_name}'s trust score went up by ${delta}.`
        : `It came back late. The trust score changed by ${delta}.`,
      `/app/loans/${loan.$id}`,
    );
    pushNotification(
      state,
      loan.borrower_id,
      "trust",
      `Trust score ${delta > 0 ? "+" : ""}${delta}`,
      delta > 0
        ? `You returned ${item.title} on time. Keep it up.`
        : `You returned ${item.title} late. Return the next one on time to rebuild.`,
      "/app/profile",
    );
  }

  loan.$updatedAt = now();
  item.$updatedAt = now();
  save(state);
  return hydrateLoan(state, loan);
}

export function demoListNotifications() {
  const state = getDemoState();
  return state.notifications
    .filter((note) => note.user_id === "demo-aisha")
    .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
}

export function demoMarkNotificationRead(id: string) {
  const state = getDemoState();
  const note = state.notifications.find((row) => row.$id === id);
  if (note) note.read = true;
  save(state);
}

export function demoAsk(message: string) {
  const state = getDemoState();
  const available = state.items
    .filter(
      (item) =>
        item.locality === DEMO_LOCALITY && item.status === "available",
    )
    .map((item) => hydrateItem(state, item));

  const words = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);

  const ranked = available
    .map((item) => {
      const haystack = `${item.title} ${item.description} ${item.category} ${item.owner?.display_name ?? ""}`.toLowerCase();
      return {
        item,
        score: words.reduce(
          (total, word) => total + (haystack.includes(word) ? 1 : 0),
          0,
        ),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.item);

  if (!ranked.length) {
    return {
      answer:
        "I couldn't find an exact match on the shelf right now. Try a broader word like “drill”, “tent”, or “kitchen”, or list the thing you wish a neighbor had.",
      items: [],
      source: "fallback" as const,
    };
  }

  return {
    answer: `I found ${ranked.length === 1 ? "one thing" : `${ranked.length} things`} that might help. ${ranked
      .map((item) => `${item.title} from ${item.owner?.display_name ?? "a neighbor"}`)
      .join(", ")}. Open one to send a request with a return date.`,
    items: ranked.map((item) => ({
      $id: item.$id,
      title: item.title,
      description: item.description,
      category: item.category,
      condition: item.condition,
      status: item.status,
      image_url: item.image_url,
      owner_name: item.owner?.display_name ?? "Neighbor",
      owner_trust: item.owner?.trust_score ?? 50,
    })),
    source: "fallback" as const,
  };
}

export function demoSummary() {
  return {
    initials: initials("Aisha Rao"),
    color: colorForId("demo-aisha"),
  };
}
