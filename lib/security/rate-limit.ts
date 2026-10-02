/**
 * Basit in-memory rate limiter (token bucket).
 * Tek instance için yeterli; dağıtık deploy'da Redis sürücüsü takılabilir
 * (arayüz aynı kalır).
 */
interface Bucket {
  tokens: number;
  lastRefill: number;
}

const g = globalThis as unknown as { __bv_buckets?: Map<string, Bucket> };
const buckets = (g.__bv_buckets ??= new Map<string, Bucket>());

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * @param key    limit anahtarı (örn. ip + rota)
 * @param limit  pencere başına izin verilen istek
 * @param windowMs pencere ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b) {
    buckets.set(key, { tokens: limit - 1, lastRefill: now });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  const elapsed = now - b.lastRefill;
  const refill = (elapsed / windowMs) * limit;
  b.tokens = Math.min(limit, b.tokens + refill);
  b.lastRefill = now;
  if (b.tokens < 1) {
    return { ok: false, remaining: 0, retryAfterMs: Math.ceil((1 - b.tokens) * (windowMs / limit)) };
  }
  b.tokens -= 1;
  // zaman zaman temizlik
  if (buckets.size > 5000) {
    buckets.forEach((v, k) => {
      if (now - v.lastRefill > windowMs * 4) buckets.delete(k);
    });
  }
  return { ok: true, remaining: Math.floor(b.tokens), retryAfterMs: 0 };
}

/** İstekten istemci IP'si çıkarır (proxy arkasında x-forwarded-for) */
export function clientIp(req: { headers: { get(k: string): string | null } }): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'local';
}
