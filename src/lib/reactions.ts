export type ReactionType = "heart" | "thumbsUp" | "thumbsDown";

export interface ReactionCounts {
  heart: number;
  thumbsUp: number;
  thumbsDown: number;
}

const ZERO: ReactionCounts = { heart: 0, thumbsUp: 0, thumbsDown: 0 };

// In-memory fallback for local development (not persisted across requests)
const memStore = new Map<string, ReactionCounts>();

async function getFromMemory(slug: string): Promise<ReactionCounts> {
  return memStore.get(slug) ?? { ...ZERO };
}

async function incrementInMemory(slug: string, type: ReactionType, delta: number): Promise<ReactionCounts> {
  const current = await getFromMemory(slug);
  const updated = { ...current, [type]: Math.max(0, current[type] + delta) };
  memStore.set(slug, updated);
  return updated;
}

function hasRedis(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis() {
  const { Redis } = require("@upstash/redis");
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function getReactions(slug: string): Promise<ReactionCounts> {
  if (!hasRedis()) return getFromMemory(slug);

  try {
    const redis = getRedis();
    const raw = await redis.hgetall(`reactions:${slug}`);
    if (!raw) return { ...ZERO };
    return {
      heart: parseInt(String(raw.heart ?? "0"), 10),
      thumbsUp: parseInt(String(raw.thumbsUp ?? "0"), 10),
      thumbsDown: parseInt(String(raw.thumbsDown ?? "0"), 10),
    };
  } catch {
    return { ...ZERO };
  }
}

export async function incrementReaction(
  slug: string,
  type: ReactionType,
  delta: 1 | -1
): Promise<ReactionCounts> {
  if (!hasRedis()) return incrementInMemory(slug, type, delta);

  try {
    const redis = getRedis();
    await redis.hincrby(`reactions:${slug}`, type, delta);
    return getReactions(slug);
  } catch {
    return incrementInMemory(slug, type, delta);
  }
}
