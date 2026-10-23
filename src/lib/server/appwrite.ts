import "server-only";

import {
  Account,
  Client,
  Storage,
  TablesDB,
  Users,
} from "node-appwrite";
import { getServerEnv } from "./env";

type AdminServices = {
  client: Client;
  tablesDB: TablesDB;
  storage: Storage;
  users: Users;
};

let cachedAdmin: AdminServices | null = null;

export function getAdminServices(): AdminServices {
  if (cachedAdmin) return cachedAdmin;

  const env = getServerEnv();
  const client = new Client()
    .setEndpoint(env.endpoint)
    .setProject(env.projectId)
    .setKey(env.apiKey);

  cachedAdmin = {
    client,
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
    users: new Users(client),
  };

  return cachedAdmin;
}

export function getUserServices(jwt: string) {
  const env = getServerEnv();
  const client = new Client()
    .setEndpoint(env.endpoint)
    .setProject(env.projectId)
    .setJWT(jwt);

  return {
    client,
    account: new Account(client),
  };
}
