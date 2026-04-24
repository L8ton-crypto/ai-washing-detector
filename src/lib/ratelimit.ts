// Lightweight in-memory rate limiter.
//
// Serverless caveat: each warm Lambda has its own memory, so this isn't a
// hard global cap. It's a speed-bump for casual abuse and keeps a single hot
// instance from hammering SEC EDGAR. For a stricter cap, swap in Vercel KV
// or Upstash later.

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// Periodic cleanup to keep the map from growing unbounded on long-lived instances.
if (typeof globalThis !== "undefined" && !("__aiwRateLimitSweeper" in globalThis)) {
  // @ts-expect-error custom flag
  globalThis.__aiwRateLimitSweeper = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k);
    }
  }, 60_000);
  // Don't keep the process alive just for this sweeper.
  // @ts-expect-error unref may be undefined in some runtimes
  globalThis.__aiwRateLimitSweeper?.unref?.();
}
