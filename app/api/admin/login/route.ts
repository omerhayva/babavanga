/**
 * POST /api/admin/login — admin girişi (rate limit'li).
 * Şifre: ADMIN_PASSWORD env (geliştirmede 'vanga-admin').
 */
import { NextRequest } from 'next/server';
import { checkAdminPassword, setAdminCookie } from '@/lib/auth/session';
import { readJson, cleanString } from '@/lib/security/validate';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { ok, fail, handleError } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`admin-login:${clientIp(req)}`, 5, 5 * 60 * 1000);
    if (!rl.ok) {
      return fail('Çok fazla deneme. 5 dakika sonra tekrar dene.', 429);
    }
    const body = await readJson(req);
    const password = cleanString(body.password, 128, 'şifre');
    if (!checkAdminPassword(password)) {
      return fail('Şifre hatalı.', 401);
    }
    setAdminCookie();
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
