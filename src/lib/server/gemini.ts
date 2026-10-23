import "server-only";

import type { ChatItem } from "../types";
import { CATEGORY_LABELS } from "../constants";
import { hasGemini } from "./env";

type GeminiItem = Pick<
  ChatItem,
  "$id" | "title" | "description" | "category" | "owner_name"
>;

type GeminiReply = {
  answer?: string;
  itemIds?: unknown;
  item_ids?: unknown;
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aNorm += a[i] * a[i];
    bNorm += b[i] * b[i];
  }
  if (!aNorm || !bNorm) return 0;
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT",
): Promise<number[] | null> {
  if (!hasGemini()) return null;

  const apiKey = process.env.GEMINI_API_KEY as string;
  const model =
    process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

  try {
    const response = await fetch(
      `${GEMINI_BASE}/models/${encodeURIComponent(model)}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: 768,
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );

    if (!response.ok) {
      console.error("[gemini:embed]", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      embedding?: { values?: number[] };
    };
    return data.embedding?.values ?? null;
  } catch (error) {
    console.error("[gemini:embed]", error);
    return null;
  }
}

export async function generateReply(
  message: string,
  items: GeminiItem[],
): Promise<{ answer: string; itemIds: string[] } | null> {
  if (!hasGemini()) return null;

  const apiKey = process.env.GEMINI_API_KEY as string;
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  const catalog = items
    .map(
      (item) =>
        `- id: ${item.$id} | ${item.title} | ${CATEGORY_LABELS[item.category] ?? item.category} | owner: ${item.owner_name} | ${item.description}`,
    )
    .join("\n");

  const prompt = `You are the LoanLoop assistant for a single apartment building.

Only recommend items from the catalog below. Never invent an item, owner, price, or availability. If nothing fits, say so warmly and suggest what to list instead.

The neighbor asking is a resident of Sunshine Apartments. Keep the answer to 2-4 short sentences. Be practical, warm, and specific. Do not use markdown headings or bullet lists.

Catalog:
${catalog || "(No items are currently available.)"}

Neighbor's message:
${message}

Return JSON only, exactly in this shape:
{"answer":"...","itemIds":["id1","id2"]}

Use at most 3 item IDs. Use an empty itemIds array when no item fits.`;

  try {
    const response = await fetch(
      `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
            // Gemini 3.8 Flash ignores sampling parameters such as temperature.
            // Low thinking keeps this short recommendation quick and cheap.
            thinkingConfig: { thinkingLevel: "LOW" },
          },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) {
      console.error("[gemini:chat]", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const parsed = JSON.parse(stripFences(raw)) as GeminiReply;
    const ids = Array.isArray(parsed.itemIds)
      ? parsed.itemIds
      : Array.isArray(parsed.item_ids)
        ? parsed.item_ids
        : [];

    const valid = new Set(items.map((item) => item.$id));
    const itemIds = ids
      .filter((id): id is string => typeof id === "string")
      .filter((id) => valid.has(id))
      .slice(0, 3);

    return {
      answer:
        typeof parsed.answer === "string" && parsed.answer.trim()
          ? parsed.answer.trim()
          : fallbackAnswer(message, items).answer,
      itemIds,
    };
  } catch (error) {
    console.error("[gemini:chat]", error);
    return null;
  }
}

function stripFences(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "any",
  "are",
  "can",
  "could",
  "do",
  "does",
  "for",
  "from",
  "have",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "need",
  "of",
  "on",
  "or",
  "please",
  "someone",
  "that",
  "the",
  "there",
  "to",
  "want",
  "with",
  "would",
  "you",
]);

export function keywordRank(message: string, items: GeminiItem[]) {
  const words = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  return items
    .map((item) => {
      const haystack = `${item.title} ${item.description} ${item.category} ${item.owner_name}`.toLowerCase();
      const score = words.reduce(
        (total, word) => total + (haystack.includes(word) ? 1 : 0),
        0,
      );
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.item);
}

export function fallbackAnswer(message: string, items: GeminiItem[]) {
  const ranked = keywordRank(message, items);

  if (!items.length) {
    return {
      answer:
        "Nothing is on the shelf in Sunshine Apartments yet. If you have something gathering dust, list it — the next neighbor who needs it will thank you.",
      itemIds: [] as string[],
    };
  }

  if (!ranked.length) {
    return {
      answer:
        "I couldn't find an exact match in the building right now. Try a broader word like “drill”, “tent”, or “kitchen”, or list the thing you wish a neighbor had.",
      itemIds: [] as string[],
    };
  }

  return {
    answer: `I found ${ranked.length === 1 ? "one thing" : `${ranked.length} things`} that might help. ${ranked
      .map((item) => `${item.title} from ${item.owner_name}`)
      .join(", ")}. Open one to send a request with a return date.`,
    itemIds: ranked.map((item) => item.$id),
  };
}
