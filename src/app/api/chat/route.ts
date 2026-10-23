import "server-only";

import { requireProfile } from "@/lib/server/auth";
import { handleRouteError, jsonOk, readJson } from "@/lib/server/http";
import {
  cosineSimilarity,
  embedText,
  fallbackAnswer,
  generateReply,
  keywordRank,
} from "@/lib/server/gemini";
import { enrichItemsWithOwners, listAvailableItems } from "@/lib/server/items";
import { chatSchema } from "@/lib/validation";
import type { ChatItem, Item } from "@/lib/types";
import { getServerEnv } from "@/lib/server/env";

function imageFor(item: Item) {
  if (item.image_url) return item.image_url;
  if (!item.image_id) return null;
  const env = getServerEnv();
  return `${env.endpoint}/storage/buckets/${env.bucketId}/files/${item.image_id}/preview?project=${env.projectId}&width=600&quality=80`;
}

function toChatItem(item: Item): ChatItem {
  return {
    $id: item.$id,
    title: item.title,
    description: item.description,
    category: item.category,
    condition: item.condition,
    status: item.status,
    image_url: imageFor(item),
    owner_name: item.owner?.display_name ?? "A neighbor",
    owner_trust: item.owner?.trust_score ?? 50,
  };
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfile(request);
    const body = chatSchema.parse(await readJson(request));

    const available = await enrichItemsWithOwners(
      await listAvailableItems({ locality: profile.locality }),
    );

    const chatItems = available.map(toChatItem);
    const queryEmbedding = await embedText(body.message, "RETRIEVAL_QUERY");

    let candidates = chatItems;
    if (queryEmbedding) {
      candidates = available
        .map((item) => {
          const score =
            Array.isArray(item.embedding) && item.embedding.length
              ? cosineSimilarity(queryEmbedding, item.embedding)
              : 0;
          return { item: toChatItem(item), score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 14)
        .map((entry) => entry.item);
    }

    const gemini = await generateReply(body.message, candidates);

    if (gemini) {
      const byId = new Map(candidates.map((item) => [item.$id, item]));
      return jsonOk({
        answer: gemini.answer,
        items: gemini.itemIds
          .map((id) => byId.get(id))
          .filter((item): item is ChatItem => Boolean(item)),
        source: "gemini",
      });
    }

    const ranked = keywordRank(body.message, chatItems);
    const fallback = fallbackAnswer(body.message, chatItems);
    const byId = new Map(chatItems.map((item) => [item.$id, item]));

    return jsonOk({
      answer: fallback.answer,
      items:
        ranked.length
          ? ranked.slice(0, 3).map((item) => byId.get(item.$id)).filter(Boolean)
          : fallback.itemIds
              .map((id) => byId.get(id))
              .filter((item): item is ChatItem => Boolean(item)),
      source: "fallback",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
