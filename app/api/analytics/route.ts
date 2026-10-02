/**
 * POST /api/analytics — anonim olay kaydı.
 * Kişisel veri taşımaz; serbest metin alanları sunucuda düşürülür.
 */
import { NextRequest } from 'next/server';
import { trackEvent } from '@/lib/analytics/events';
import { cleanString, readJson, ValidationError } from '@/lib/security/validate';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { ok, handleError } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`analytics:${clientIp(req)}`, 60, 60 * 1000);
    if (!rl.ok) return ok({ ok: true }); // sessizce yut
    const body = await readJson(req, 4096);
    const type = cleanString(body.type, 40, 'olay tipi');
    const meta =
      body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)
        ? body.meta as Record<string, unknown>
        : undefined;
    await trackEvent(type, meta as Record<string, string | number | boolean> | undefined);
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof ValidationError) return ok({ ok: true });
    return handleError(err);
  }
}
