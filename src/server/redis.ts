import { Redis } from "@upstash/redis";

let cached: Redis | null | undefined;

export function getRedis(source: NodeJS.ProcessEnv = process.env): Redis | null {
  if (source === process.env && cached !== undefined) return cached;
  const url = source.KV_REST_API_URL || source.UPSTASH_REDIS_REST_URL;
  const token = source.KV_REST_API_TOKEN || source.UPSTASH_REDIS_REST_TOKEN;
  const client = url && token ? new Redis({ url, token }) : null;
  if (source === process.env) cached = client;
  return client;
}

export function resetRedisForTests() {
  cached = undefined;
}
