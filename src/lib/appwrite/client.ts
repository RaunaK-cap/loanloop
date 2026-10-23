import { Account, Client, Storage, TablesDB } from "appwrite";
import { publicEnv } from "../env";

export const appwriteClient = new Client();

if (publicEnv.endpoint && publicEnv.projectId) {
  appwriteClient
    .setEndpoint(publicEnv.endpoint)
    .setProject(publicEnv.projectId);
}

export const account = new Account(appwriteClient);
export const tablesDB = new TablesDB(appwriteClient);
export const storage = new Storage(appwriteClient);

export function fileViewUrl(fileId?: string | null) {
  if (!fileId || !publicEnv.endpoint || !publicEnv.projectId) return null;
  return storage.getFileView({
    bucketId: publicEnv.bucketId,
    fileId,
  });
}

export function filePreviewUrl(fileId?: string | null, width = 900) {
  if (!fileId || !publicEnv.endpoint || !publicEnv.projectId) return null;
  return storage.getFilePreview({
    bucketId: publicEnv.bucketId,
    fileId,
    width,
    quality: 82,
  });
}
