/**
 * POST /api/auth/login
 */
import { NextRequest } from 'next/server';
import { store } from '@/lib/db/store';
import { verifyPassword } from '@/lib/auth/password';
import { setUserCookie, getGuestIdFromCookies } from '@/lib/auth/session';
import { cleanEmail, cleanString } from '@/lib/security/validate';
import { trackEvent } from '@/lib/analytics/events';
import type { User, Reading, QuestionSession } from '@/lib/types/models';
import { ok, fail, handleError, guard } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const g = guard(req, 'login', 10, 15 * 60 * 1000);
    if (g) return g;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const email = cleanEmail(body.email);
    const password = cleanString(body.password, 128, 'şifre');

    const user = store.find<User>('users', (u) => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return fail('E-posta veya şifre hatalı.', 401);
    }

    // misafir verilerini hesaba devret
    const gid = getGuestIdFromCookies();
    if (gid) {
      const readings = store.filter<Reading>('readings', (r) => r.ownerId === `guest:${gid}`);
      for (const r of readings) {
        await store.update<Reading>('readings', r.id, { ownerId: `user:${user.id}` });
      }
      const sessions = store.filter<QuestionSession>('sessions', (s) => s.ownerId === `guest:${gid}`);
      for (const s of sessions) {
        await store.update<QuestionSession>('sessions', s.id, { ownerId: `user:${user.id}` });
      }
    }

    setUserCookie(user.id);
    await trackEvent('account_login');
    return ok({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    return handleError(err);
  }
}
