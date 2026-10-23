import {
  AppwriteException,
  Client,
  OrderBy,
  Permission,
  Role,
  Storage,
  TablesDB,
  TablesDBIndexType,
  Users,
} from "node-appwrite";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let loadedEnv = false;

/**
 * Bun loads .env files automatically, but `bun scripts/...` can be run from
 * outside the project root. This tiny loader keeps the scripts predictable
 * without adding another dependency.
 */
export function loadEnv() {
  if (loadedEnv) return;
  loadedEnv = true;

  for (const file of [".env.local", ".env"]) {
    const path = join(process.cwd(), file);
    if (!existsSync(path)) continue;

    const contents = readFileSync(path, "utf8");
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const separator = line.indexOf("=");
      if (separator < 0) continue;

      const key = line.slice(0, separator).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      if (process.env[key] !== undefined) continue;

      let value = line.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value.replace(/\\n/g, "\n");
    }
  }
}

export function requireEnv(key: string) {
  loadEnv();
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${key}. Copy .env.example to .env.local and add your Appwrite project values.`,
    );
  }
  return value;
}

export type AdminServices = {
  client: Client;
  tablesDB: TablesDB;
  storage: Storage;
  users: Users;
  databaseId: string;
  bucketId: string;
  endpoint: string;
  projectId: string;
};

export function getAdminServices(): AdminServices {
  loadEnv();

  const endpoint = requireEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT").replace(
    /\/+$/,
    "",
  );
  const projectId = requireEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  const apiKey = requireEnv("APPWRITE_API_KEY");
  const databaseId =
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim() || "loanloop";
  const bucketId =
    process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID?.trim() || "item-images";

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    client,
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
    users: new Users(client),
    databaseId,
    bucketId,
    endpoint,
    projectId,
  };
}

export function isAppwriteError(error: unknown, code: number) {
  return error instanceof AppwriteException && error.code === code;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const communityRead = () => [Permission.read(Role.users())];

export const userRead = (userId: string) => [
  Permission.read(Role.user(userId)),
];

export const loanPartiesRead = (ownerId: string, borrowerId: string) => [
  Permission.read(Role.user(ownerId)),
  Permission.read(Role.user(borrowerId)),
];

export async function ensureColumn(
  tableId: string,
  key: string,
  create: () => Promise<unknown>,
) {
  try {
    await create();
    console.log(`  + ${tableId}.${key}`);
  } catch (error) {
    if (!isAppwriteError(error, 409)) throw error;
  }
}

export async function waitForColumns(
  tablesDB: TablesDB,
  databaseId: string,
  tableId: string,
  keys: string[],
) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const table = await tablesDB.getTable({ databaseId, tableId });
    const byKey = new Map(
      table.columns.map((column) => [column.key, column] as const),
    );

    const failed = keys.filter((key) => {
      const status = byKey.get(key)?.status;
      return status === "failed" || status === "stuck";
    });
    if (failed.length) {
      throw new Error(
        `Appwrite could not create ${tableId}.${failed.join(", ")}. Open the Appwrite console for the error.`,
      );
    }

    const pending = keys.filter((key) => {
      const column = byKey.get(key);
      return !column || column.status === "processing" || column.status === "deleting";
    });
    if (!pending.length) return;

    await sleep(750);
  }

  throw new Error(`Timed out waiting for columns on ${tableId}.`);
}

export async function waitForIndexes(
  tablesDB: TablesDB,
  databaseId: string,
  tableId: string,
  keys: string[],
) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const table = await tablesDB.getTable({ databaseId, tableId });
    const byKey = new Map(
      table.indexes.map((index) => [index.key, index] as const),
    );

    const failed = keys.filter((key) => {
      const status = byKey.get(key)?.status;
      return status === "failed" || status === "stuck";
    });
    if (failed.length) {
      throw new Error(
        `Appwrite could not create the ${tableId}.${failed.join(", ")} index. Open the Appwrite console for the error.`,
      );
    }

    const pending = keys.filter((key) => {
      const index = byKey.get(key);
      return !index || index.status === "processing" || index.status === "deleting";
    });
    if (!pending.length) return;

    await sleep(750);
  }

  throw new Error(`Timed out waiting for indexes on ${tableId}.`);
}

export type TableDefinition = {
  id: string;
  name: string;
};

export async function ensureTable(
  tablesDB: TablesDB,
  databaseId: string,
  definition: TableDefinition,
) {
  try {
    const table = await tablesDB.getTable({
      databaseId,
      tableId: definition.id,
    });
    if (!table.rowSecurity) {
      await tablesDB.updateTable({
        databaseId,
        tableId: definition.id,
        rowSecurity: true,
      });
    }
    console.log(`✓ ${definition.id} table exists`);
  } catch (error) {
    if (!isAppwriteError(error, 404)) throw error;
    await tablesDB.createTable({
      databaseId,
      tableId: definition.id,
      name: definition.name,
      permissions: [],
      rowSecurity: true,
    });
    console.log(`+ ${definition.id} table created`);
  }
}

export async function ensureIndex(
  tablesDB: TablesDB,
  databaseId: string,
  tableId: string,
  key: string,
  columns: string[],
  type: TablesDBIndexType = TablesDBIndexType.Key,
) {
  try {
    await tablesDB.createIndex({
      databaseId,
      tableId,
      key,
      type,
      columns,
      orders: columns.map(() => OrderBy.Asc),
    });
    console.log(`  + ${tableId}.${key} index`);
  } catch (error) {
    if (!isAppwriteError(error, 409)) throw error;
  }
}
