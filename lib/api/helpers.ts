/**
 * API yardımcıları: tutarlı hata/yanıt formatı, rate limit + origin koruması.
 */
import { NextRequest, NextResponse } from 'next/server';
import { ValidationError, assertSameOrigin } from '@/lib/security/validate';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data as Record<string, unknown>, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/** Tüm API hatalarını tek biçimde sarar */
export function handleError(err: unknown): NextResponse {
  if (err instanceof ValidationError) return fail(err.message, 400);
  console.error('[api]', err);
  return fail('Beklenmeyen bir hata oluştu. Lütfen tekrar dene.', 500);
}

/** Rate limit + origin kontrolü (mutating istekler için) */
export function guard(
  req: NextRequest,
  route: string,
  limit: number,
  windowMs: number,
  withOrigin = true,
): NextResponse | null {
  const rl = rateLimit(`${route}:${clientIp(req)}`, limit, windowMs);
  if (!rl.ok) {
    return fail('Çok fazla istek gönderdin. Biraz bekleyip tekrar dene.', 429);
  }
  if (withOrigin) {
    try {
      assertSameOrigin(req);
    } catch {
      return fail('İstek kaynağı geçersiz.', 403);
    }
  }
  return null;
}
