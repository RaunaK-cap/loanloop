export const publicEnv = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop",
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "item-images",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
} as const;

export const isAppwriteConfigured = Boolean(
  publicEnv.endpoint && publicEnv.projectId,
);

export const isDemoMode = publicEnv.demoMode || !isAppwriteConfigured;
