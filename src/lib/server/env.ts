import "server-only";

type ServerEnv = {
  endpoint: string;
  projectId: string;
  apiKey: string;
  databaseId: string;
  bucketId: string;
  geminiApiKey: string;
  geminiModel: string;
  geminiEmbeddingModel: string;
  cronSecret: string;
};

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const env: ServerEnv = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
    apiKey: process.env.APPWRITE_API_KEY ?? "",
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "loanloop",
    bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "item-images",
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    geminiEmbeddingModel:
      process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    cronSecret: process.env.CRON_SECRET ?? "",
  };

  const missing = [
    ["NEXT_PUBLIC_APPWRITE_ENDPOINT", env.endpoint],
    ["NEXT_PUBLIC_APPWRITE_PROJECT_ID", env.projectId],
    ["APPWRITE_API_KEY", env.apiKey],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing server environment variables: ${missing.join(", ")}. Copy .env.example to .env.local and fill them in.`,
    );
  }

  cached = env;
  return env;
}

export function hasGemini() {
  return Boolean(process.env.GEMINI_API_KEY);
}
