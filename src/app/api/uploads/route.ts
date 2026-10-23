import "server-only";

import { ID, Permission, Role } from "node-appwrite";
import { getAdminServices } from "@/lib/server/appwrite";
import { requireProfile } from "@/lib/server/auth";
import { getServerEnv } from "@/lib/server/env";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { HttpError } from "@/lib/server/auth";
import { MAX_ITEM_IMAGE_BYTES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    await requireProfile(request);
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new HttpError(400, "Choose an image to upload.");
    }
    if (!file.type.startsWith("image/")) {
      throw new HttpError(422, "Only images are supported.");
    }
    if (file.size > MAX_ITEM_IMAGE_BYTES) {
      throw new HttpError(422, "Keep the image under 5 MB.");
    }

    const { storage } = getAdminServices();
    const env = getServerEnv();
    const fileId = ID.unique();

    await storage.createFile({
      bucketId: env.bucketId,
      fileId,
      file,
      // Item photos are shown to the whole building. Appwrite Cloud file URLs
      // are on a different origin from the app, so an authenticated <img>
      // request cannot carry the Appwrite session. Public-read files (with an
      // unguessable ID) are what make uploaded photos render in production.
      permissions: [Permission.read(Role.any())],
    });

    const url = `${env.endpoint}/storage/buckets/${env.bucketId}/files/${fileId}/view?project=${env.projectId}`;

    return jsonOk({ fileId, url });
  } catch (error) {
    return handleRouteError(error);
  }
}
