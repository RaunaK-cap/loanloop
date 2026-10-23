import {
  AppwriteException,
  RelationMutate,
  RelationshipType,
  TablesDB,
} from "node-appwrite";
import { CATEGORIES, CONDITIONS } from "../src/lib/constants";
import {
  communityRead,
  ensureColumn,
  ensureIndex,
  ensureTable,
  getAdminServices,
  isAppwriteError,
  waitForColumns,
  waitForIndexes,
  type TableDefinition,
} from "./lib";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"];

const categories = CATEGORIES.map((category) => category.id);
const conditions = CONDITIONS.map((condition) => condition.id);

function makeColumnFactory(
  tablesDB: TablesDB,
  databaseId: string,
  tableId: string,
) {
  const add = (key: string, create: () => Promise<unknown>) =>
    ensureColumn(tableId, key, create);

  return {
    varchar: (
      key: string,
      size: number,
      required = false,
      xdefault: string | null = null,
    ) =>
      add(key, () =>
        tablesDB.createVarcharColumn({
          databaseId,
          tableId,
          key,
          size,
          required,
          xdefault,
        }),
      ),
    text: (key: string, required = false) =>
      add(key, () =>
        tablesDB.createTextColumn({ databaseId, tableId, key, required }),
      ),
    integer: (
      key: string,
      required = false,
      min: number | null = null,
      max: number | null = null,
      xdefault: number | null = null,
    ) =>
      add(key, () =>
        tablesDB.createIntegerColumn({
          databaseId,
          tableId,
          key,
          required,
          min,
          max,
          xdefault,
        }),
      ),
    floatArray: (key: string) =>
      add(key, () =>
        tablesDB.createFloatColumn({
          databaseId,
          tableId,
          key,
          required: false,
          array: true,
        }),
      ),
    boolean: (key: string, required = false, xdefault: boolean | null = null) =>
      add(key, () =>
        tablesDB.createBooleanColumn({
          databaseId,
          tableId,
          key,
          required,
          xdefault,
        }),
      ),
    datetime: (
      key: string,
      required = false,
      xdefault: string | null = null,
    ) =>
      add(key, () =>
        tablesDB.createDatetimeColumn({
          databaseId,
          tableId,
          key,
          required,
          xdefault,
        }),
      ),
    enum: (
      key: string,
      elements: string[],
      required = false,
      xdefault: string | null = null,
    ) =>
      add(key, () =>
        tablesDB.createEnumColumn({
          databaseId,
          tableId,
          key,
          elements,
          required,
          xdefault,
        }),
      ),
  };
}

async function ensureDatabase(tablesDB: TablesDB, databaseId: string) {
  try {
    await tablesDB.get({ databaseId });
    console.log(`✓ ${databaseId} database exists`);
  } catch (error) {
    if (!isAppwriteError(error, 404)) {
      if (isAppwriteError(error, 403) || isAppwriteError(error, 409)) {
        throw new Error(
          `Could not create the "${databaseId}" database. The Appwrite Free plan allows one database; keep the existing database or delete it before rerunning setup.`,
        );
      }
      throw error;
    }

    try {
      await tablesDB.create({ databaseId, name: "LoanLoop" });
      console.log(`+ ${databaseId} database created`);
    } catch (createError) {
      if (!isAppwriteError(createError, 409)) throw createError;
      console.log(`✓ ${databaseId} database exists`);
    }
  }
}

async function ensureBucket(
  services: ReturnType<typeof getAdminServices>,
) {
  const { storage, bucketId } = services;
  const desired = {
    bucketId,
    name: "Item images",
    permissions: communityRead(),
    fileSecurity: true,
    enabled: true,
    maximumFileSize: MAX_IMAGE_BYTES,
    allowedFileExtensions: IMAGE_EXTENSIONS,
  };

  try {
    await storage.getBucket({ bucketId });
    console.log(`✓ ${bucketId} bucket exists`);
  } catch (error) {
    if (!isAppwriteError(error, 404)) throw error;
    await storage.createBucket(desired);
    console.log(`+ ${bucketId} bucket created`);
    return;
  }

  await storage.updateBucket(desired);
  console.log(`✓ ${bucketId} bucket settings updated`);
}

async function main() {
  const services = getAdminServices();
  const { tablesDB, databaseId } = services;

  console.log("\nAppwrite schema setup\n");
  await ensureDatabase(tablesDB, databaseId);
  await ensureBucket(services);

  const tables: TableDefinition[] = [
    { id: "profiles", name: "Profiles" },
    { id: "items", name: "Items" },
    { id: "loans", name: "Loans" },
    { id: "loan_events", name: "Loan events" },
    { id: "notifications", name: "Notifications" },
  ];

  for (const table of tables) {
    await ensureTable(tablesDB, databaseId, table);
  }

  const profiles = makeColumnFactory(tablesDB, databaseId, "profiles");
  await profiles.varchar("display_name", 60, true);
  await profiles.varchar("locality", 40, true);
  await profiles.integer("trust_score", true, 0, 100);
  await profiles.integer("completed_loans", true, 0);
  await profiles.varchar("bio", 280);
  await profiles.varchar("avatar_color", 12);

  const items = makeColumnFactory(tablesDB, databaseId, "items");
  await items.varchar("title", 80, true);
  await items.varchar("description", 600, true);
  await items.enum("category", categories, true);
  await items.enum("condition", conditions, true);
  await items.enum(
    "status",
    ["available", "requested", "on_loan", "unavailable"],
    true,
  );
  await items.varchar("owner_id", 64, true);
  await items.varchar("locality", 40, true);
  await items.varchar("image_id", 64);
  await items.varchar("image_url", 2048);
  await items.floatArray("embedding");
  await items.enum(
    "embedding_status",
    ["pending", "ready", "skipped", "failed"],
    false,
    "pending",
  );
  await items.text("search_text");

  const loans = makeColumnFactory(tablesDB, databaseId, "loans");
  await loans.varchar("item_id", 64, true);
  await loans.varchar("owner_id", 64, true);
  await loans.varchar("borrower_id", 64, true);
  await loans.enum(
    "status",
    ["requested", "active", "overdue", "returned", "declined", "cancelled"],
    true,
  );
  await loans.varchar("request_note", 280);
  await loans.datetime("due_at", true);
  await loans.datetime("approved_at");
  await loans.datetime("returned_at");
  await loans.datetime("declined_at");

  const events = makeColumnFactory(tablesDB, databaseId, "loan_events");
  await events.varchar("loan_id", 64, true);
  await events.enum(
    "type",
    ["requested", "approved", "declined", "returned", "cancelled", "overdue"],
    true,
  );
  await events.varchar("actor_id", 64, true);
  await events.varchar("note", 500);

  const notifications = makeColumnFactory(
    tablesDB,
    databaseId,
    "notifications",
  );
  await notifications.varchar("user_id", 64, true);
  await notifications.varchar("type", 64, true);
  await notifications.varchar("title", 160, true);
  await notifications.varchar("body", 600, true);
  await notifications.varchar("link", 256, true);
  await notifications.boolean("read", true);

  await waitForColumns(tablesDB, databaseId, "profiles", [
    "display_name",
    "locality",
    "trust_score",
    "completed_loans",
    "bio",
    "avatar_color",
  ]);
  await waitForColumns(tablesDB, databaseId, "items", [
    "title",
    "description",
    "category",
    "condition",
    "status",
    "owner_id",
    "locality",
    "image_id",
    "image_url",
    "embedding",
    "embedding_status",
    "search_text",
  ]);
  await waitForColumns(tablesDB, databaseId, "loans", [
    "item_id",
    "owner_id",
    "borrower_id",
    "status",
    "request_note",
    "due_at",
    "approved_at",
    "returned_at",
    "declined_at",
  ]);
  await waitForColumns(tablesDB, databaseId, "loan_events", [
    "loan_id",
    "type",
    "actor_id",
    "note",
  ]);
  await waitForColumns(tablesDB, databaseId, "notifications", [
    "user_id",
    "type",
    "title",
    "body",
    "link",
    "read",
  ]);

  console.log("\nRelationships");
  const relationships = [
    {
      tableId: "items",
      key: "owner",
      relatedTableId: "profiles",
      onDelete: RelationMutate.SetNull,
    },
    {
      tableId: "loans",
      key: "item",
      relatedTableId: "items",
      onDelete: RelationMutate.SetNull,
    },
    {
      tableId: "loans",
      key: "owner",
      relatedTableId: "profiles",
      onDelete: RelationMutate.SetNull,
    },
    {
      tableId: "loans",
      key: "borrower",
      relatedTableId: "profiles",
      onDelete: RelationMutate.SetNull,
    },
    {
      tableId: "loan_events",
      key: "loan",
      relatedTableId: "loans",
      onDelete: RelationMutate.Cascade,
    },
  ];

  for (const relationship of relationships) {
    await ensureColumn(relationship.tableId, relationship.key, () =>
      tablesDB.createRelationshipColumn({
        databaseId,
        tableId: relationship.tableId,
        relatedTableId: relationship.relatedTableId,
        type: RelationshipType.ManyToOne,
        twoWay: false,
        key: relationship.key,
        onDelete: relationship.onDelete,
      }),
    );
  }

  await waitForColumns(tablesDB, databaseId, "items", ["owner"]);
  await waitForColumns(tablesDB, databaseId, "loans", [
    "item",
    "owner",
    "borrower",
  ]);
  await waitForColumns(tablesDB, databaseId, "loan_events", ["loan"]);

  console.log("\nIndexes");
  await ensureIndex(
    tablesDB,
    databaseId,
    "profiles",
    "profiles_locality",
    ["locality"],
  );
  await ensureIndex(
    tablesDB,
    databaseId,
    "items",
    "items_locality_status",
    ["locality", "status"],
  );
  await ensureIndex(tablesDB, databaseId, "items", "items_owner", ["owner_id"]);
  await ensureIndex(tablesDB, databaseId, "loans", "loans_owner", ["owner_id"]);
  await ensureIndex(tablesDB, databaseId, "loans", "loans_borrower", [
    "borrower_id",
  ]);
  await ensureIndex(tablesDB, databaseId, "loans", "loans_item_status", [
    "item_id",
    "status",
  ]);
  await ensureIndex(tablesDB, databaseId, "loans", "loans_status_due", [
    "status",
    "due_at",
  ]);
  await ensureIndex(tablesDB, databaseId, "loan_events", "events_loan", [
    "loan_id",
  ]);
  await ensureIndex(
    tablesDB,
    databaseId,
    "notifications",
    "notifications_user",
    ["user_id"],
  );

  await waitForIndexes(tablesDB, databaseId, "profiles", [
    "profiles_locality",
  ]);
  await waitForIndexes(tablesDB, databaseId, "items", [
    "items_locality_status",
    "items_owner",
  ]);
  await waitForIndexes(tablesDB, databaseId, "loans", [
    "loans_owner",
    "loans_borrower",
    "loans_item_status",
    "loans_status_due",
  ]);
  await waitForIndexes(tablesDB, databaseId, "loan_events", ["events_loan"]);
  await waitForIndexes(tablesDB, databaseId, "notifications", [
    "notifications_user",
  ]);

  console.log(
    "\nSchema ready. Next: `bun run seed` to add the Sunshine Apartments demo data.\n",
  );
}

main().catch((error) => {
  console.error("\nSchema setup failed.");
  if (error instanceof AppwriteException) {
    console.error(`Appwrite ${error.code}: ${error.message}`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
});
