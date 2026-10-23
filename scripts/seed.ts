import { Query, Users } from "node-appwrite";
import {
  communityRead,
  getAdminServices,
  isAppwriteError,
  loadEnv,
  loanPartiesRead,
  userRead,
} from "./lib";

loadEnv();

const password = process.env.SEED_PASSWORD?.trim() || "LoanLoop#2026";
const geminiConfigured = Boolean(process.env.GEMINI_API_KEY?.trim());

let embeddingsEnabled = geminiConfigured;

type Person = {
  key: string;
  id: string;
  name: string;
  email: string;
  trust: number;
  completed: number;
  bio: string;
  color: string;
};

const people: Person[] = [
  {
    key: "aisha",
    id: "demo-aisha",
    name: "Aisha Rao",
    email: "aisha@example.com",
    trust: 72,
    completed: 14,
    bio: "Plant parent, occasional baker, always happy to lend the good ladder.",
    color: "#D95D39",
  },
  {
    key: "rohan",
    id: "demo-rohan",
    name: "Rohan Mehta",
    email: "rohan@example.com",
    trust: 68,
    completed: 9,
    bio: "Weekend woodworker. The drill has a full battery.",
    color: "#2F6B4F",
  },
  {
    key: "maya",
    id: "demo-maya",
    name: "Maya Iyer",
    email: "maya@example.com",
    trust: 81,
    completed: 23,
    bio: "Camping gear, board games, and a very good projector.",
    color: "#4A5D8A",
  },
  {
    key: "dev",
    id: "demo-dev",
    name: "Dev Shah",
    email: "dev@example.com",
    trust: 59,
    completed: 5,
    bio: "New to the building. Happy to share what I have.",
    color: "#9A6B2F",
  },
];

type SeedItem = {
  id: string;
  owner: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  status: string;
  image: string;
};

const items: SeedItem[] = [
  {
    id: "item-ladder",
    owner: "aisha",
    title: "5ft wooden step ladder",
    description:
      "Solid wood, a little weathered, still steady. Perfect for ceiling lights, curtain rods, and the top shelf.",
    category: "tools",
    condition: "well-loved",
    status: "available",
    image: "/seed/ladder.webp",
  },
  {
    id: "item-tent",
    owner: "maya",
    title: "2-person camping tent",
    description:
      "Quechua pop-up tent. Sets up in about a minute, comes with the carry bag and a small repair patch.",
    category: "camping",
    condition: "good",
    status: "on_loan",
    image:
      "/seed/tent.webp",
  },
  {
    id: "item-cooker",
    owner: "aisha",
    title: "5L pressure cooker",
    description:
      "Hawkins pressure cooker with the whistle and a spare gasket. Great for dal, rice, and Sunday biryani.",
    category: "kitchen",
    condition: "well-loved",
    status: "requested",
    image:
      "/seed/cooker.webp",
  },
  {
    id: "item-drill",
    owner: "rohan",
    title: "Cordless drill + bit set",
    description:
      "DeWalt 12V drill with a full battery and a box of wood bits. Please return the battery on the charger.",
    category: "tools",
    condition: "good",
    status: "available",
    image:
      "/seed/drill.webp",
  },
  {
    id: "item-projector",
    owner: "dev",
    title: "Mini projector",
    description:
      "1080p mini projector with HDMI and a small speaker. Good for movie nights on a white wall or a sheet.",
    category: "electronics",
    condition: "good",
    status: "available",
    image:
      "/seed/projector.webp",
  },
  {
    id: "item-badminton",
    owner: "rohan",
    title: "Badminton rackets + shuttle",
    description:
      "Two Yonex rackets and a tube of shuttles. One grip is a little worn but still plays fine.",
    category: "sports",
    condition: "fair",
    status: "available",
    image:
      "/seed/badminton.webp",
  },
  {
    id: "item-camera",
    owner: "maya",
    title: "Fujifilm X100V",
    description:
      "Compact camera with a fixed 23mm lens. Comes with two batteries and a wrist strap. Please keep it dry.",
    category: "electronics",
    condition: "good",
    status: "available",
    image:
      "/seed/camera.webp",
  },
  {
    id: "item-books",
    owner: "aisha",
    title: "Weekend reading stack",
    description:
      "A stack of good weekend reads: Zero to One, The Obstacle Is the Way, The Startup Owner's Manual, and The Corporate Startup.",
    category: "books",
    condition: "well-loved",
    status: "available",
    image:
      "/seed/books.webp",
  },
];

type SeedLoan = {
  id: string;
  item: string;
  owner: string;
  borrower: string;
  status: string;
  note: string | null;
  dueAt: string;
  approvedAt: string | null;
  returnedAt: string | null;
  declinedAt: string | null;
};

function iso(daysFromNow: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

const loans: SeedLoan[] = [
  {
    id: "loan-tent",
    item: "item-tent",
    owner: "maya",
    borrower: "aisha",
    status: "active",
    note: "Heading to Coorg for the weekend. Will bring it back clean and dry.",
    dueAt: iso(3),
    approvedAt: iso(-2),
    returnedAt: null,
    declinedAt: null,
  },
  {
    id: "loan-cooker",
    item: "item-cooker",
    owner: "aisha",
    borrower: "rohan",
    status: "requested",
    note: "Making biryani for a birthday dinner. Can return it Sunday evening.",
    dueAt: iso(5),
    approvedAt: null,
    returnedAt: null,
    declinedAt: null,
  },
  {
    id: "loan-drill",
    item: "item-drill",
    owner: "rohan",
    borrower: "aisha",
    status: "returned",
    note: "Need to put up two shelves.",
    dueAt: iso(-5),
    approvedAt: iso(-11),
    returnedAt: iso(-5, 17),
    declinedAt: null,
  },
];

type SeedEvent = {
  id: string;
  loan: string;
  type: string;
  actor: string;
  note: string | null;
};

const events: SeedEvent[] = [
  {
    id: "event-tent-1",
    loan: "loan-tent",
    type: "requested",
    actor: "aisha",
    note: "Asked for 3 days.",
  },
  {
    id: "event-tent-2",
    loan: "loan-tent",
    type: "approved",
    actor: "maya",
    note: "Approved. Have a good trip.",
  },
  {
    id: "event-cooker-1",
    loan: "loan-cooker",
    type: "requested",
    actor: "rohan",
    note: "Asked for 5 days.",
  },
  {
    id: "event-drill-1",
    loan: "loan-drill",
    type: "requested",
    actor: "aisha",
    note: null,
  },
  {
    id: "event-drill-2",
    loan: "loan-drill",
    type: "approved",
    actor: "rohan",
    note: null,
  },
  {
    id: "event-drill-3",
    loan: "loan-drill",
    type: "returned",
    actor: "aisha",
    note: "Returned on time.",
  },
];

type SeedNotification = {
  id: string;
  user: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
};

const notifications: SeedNotification[] = [
  {
    id: "note-1",
    user: "aisha",
    type: "loan_requested",
    title: "Rohan wants your pressure cooker",
    body: "For a birthday biryani. He can return it Sunday evening.",
    link: "/app/loans/loan-cooker",
    read: false,
  },
  {
    id: "note-2",
    user: "aisha",
    type: "loan_approved",
    title: "Maya approved your tent request",
    body: "Pickup is at Maple Wing, 4B. Due back in 3 days.",
    link: "/app/loans/loan-tent",
    read: false,
  },
  {
    id: "note-3",
    user: "aisha",
    type: "trust",
    title: "Trust score +5",
    body: "You returned the cordless drill on time. Rohan marked it returned.",
    link: "/app/profile",
    read: true,
  },
];

async function embedText(text: string) {
  if (!embeddingsEnabled) return null;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const model =
    process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-001";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: 768,
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );

    if (!response.ok) {
      console.warn(
        `  ! Gemini embeddings unavailable (${response.status}); seeding without vectors.`,
      );
      embeddingsEnabled = false;
      return null;
    }

    const data = (await response.json()) as {
      embedding?: { values?: number[] };
    };
    return data.embedding?.values ?? null;
  } catch (error) {
    console.warn(
      `  ! Gemini embedding failed: ${error instanceof Error ? error.message : error}`,
    );
    embeddingsEnabled = false;
    return null;
  }
}

async function ensureAuthUser(users: Users, person: Person) {
  try {
    const user = await users.get({ userId: person.id });
    await users.updateName({ userId: user.$id, name: person.name });
    await users.updatePassword({ userId: user.$id, password });
    return user.$id;
  } catch (error) {
    if (!isAppwriteError(error, 404)) throw error;

    try {
      const user = await users.create({
        userId: person.id,
        email: person.email,
        password,
        name: person.name,
      });
      return user.$id;
    } catch (createError) {
      if (!isAppwriteError(createError, 409)) throw createError;

      const existing = await users.list({
        queries: [Query.equal("email", person.email)],
      });
      const user = existing.users[0];
      if (!user) throw createError;

      await users.updateName({ userId: user.$id, name: person.name });
      await users.updatePassword({ userId: user.$id, password });
      return user.$id;
    }
  }
}

function searchText(item: SeedItem, ownerName: string) {
  return [
    item.title,
    item.description,
    item.category,
    item.condition,
    ownerName,
    "sunshine apartments",
  ].join(" ");
}

async function main() {
  const services = getAdminServices();
  const { tablesDB, users, databaseId } = services;

  console.log("\nSeeding LoanLoop demo data\n");

  try {
    await tablesDB.getTable({ databaseId, tableId: "items" });
  } catch {
    throw new Error("Schema not found. Run `bun run setup` first.");
  }

  const ids: Record<string, string> = {};

  for (const person of people) {
    const id = await ensureAuthUser(users, person);
    ids[person.key] = id;
    console.log(`✓ user ${person.email}`);
  }

  for (const person of people) {
    await tablesDB.upsertRow({
      databaseId,
      tableId: "profiles",
      rowId: ids[person.key],
      data: {
        display_name: person.name,
        locality: "sunshine-apartments",
        trust_score: person.trust,
        completed_loans: person.completed,
        bio: person.bio,
        avatar_color: person.color,
      },
      permissions: communityRead(),
    });
  }
  console.log(`✓ ${people.length} profiles`);

  const peopleByKey = new Map(people.map((person) => [person.key, person]));

  for (const item of items) {
    const ownerId = ids[item.owner];
    const ownerName = peopleByKey.get(item.owner)?.name ?? "Neighbor";
    const text = searchText(item, ownerName);
    const embedding = await embedText(text);

    await tablesDB.upsertRow({
      databaseId,
      tableId: "items",
      rowId: item.id,
      data: {
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        status: item.status,
        owner_id: ownerId,
        owner: ownerId,
        locality: "sunshine-apartments",
        image_id: null,
        image_url: item.image,
        embedding: embedding ?? null,
        embedding_status: embedding
          ? "ready"
          : geminiConfigured
            ? "failed"
            : "skipped",
        search_text: text,
      },
      permissions: communityRead(),
    });
  }
  console.log(
    `✓ ${items.length} items${geminiConfigured ? " (embeddings attempted)" : " (keyword search only)"}`,
  );

  const loanById = new Map(loans.map((loan) => [loan.id, loan]));

  for (const loan of loans) {
    const ownerId = ids[loan.owner];
    const borrowerId = ids[loan.borrower];

    await tablesDB.upsertRow({
      databaseId,
      tableId: "loans",
      rowId: loan.id,
      data: {
        item_id: loan.item,
        item: loan.item,
        owner_id: ownerId,
        owner: ownerId,
        borrower_id: borrowerId,
        borrower: borrowerId,
        status: loan.status,
        request_note: loan.note,
        due_at: loan.dueAt,
        approved_at: loan.approvedAt,
        returned_at: loan.returnedAt,
        declined_at: loan.declinedAt,
      },
      permissions: loanPartiesRead(ownerId, borrowerId),
    });
  }
  console.log(`✓ ${loans.length} loans`);

  for (const event of events) {
    const loan = loanById.get(event.loan);
    if (!loan) throw new Error(`Unknown seed loan ${event.loan}`);

    await tablesDB.upsertRow({
      databaseId,
      tableId: "loan_events",
      rowId: event.id,
      data: {
        loan_id: loan.id,
        loan: loan.id,
        type: event.type,
        actor_id: ids[event.actor],
        note: event.note,
      },
      permissions: loanPartiesRead(ids[loan.owner], ids[loan.borrower]),
    });
  }
  console.log(`✓ ${events.length} audit events`);

  for (const notification of notifications) {
    const userId = ids[notification.user];
    await tablesDB.upsertRow({
      databaseId,
      tableId: "notifications",
      rowId: notification.id,
      data: {
        user_id: userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        link: notification.link,
        read: notification.read,
      },
      permissions: userRead(userId),
    });
  }
  console.log(`✓ ${notifications.length} notifications`);

  console.log("\nSunshine Apartments is ready.");
  console.log("Sign in with any of these demo accounts:");
  for (const person of people.slice(0, 2)) {
    console.log(`  ${person.email} / ${password}`);
  }
  console.log(
    "\nAisha is the main demo account; Rohan, Maya, and Dev are for switched perspectives.\n",
  );
}

main().catch((error) => {
  console.error("\nSeed failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});
