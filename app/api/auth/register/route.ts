/**
 * POST /api/auth/register — hesap oluştur (scrypt hash).
 * Misafirken üretilen okumalar hesaba devrolunur.
 */
import { NextRequest } from 'next/server';
import { store, newId } from '@/lib/db/store';
import { hashPassword } from '@/lib/auth/password';
import { setUserCookie, getGuestIdFromCookies } from '@/lib/auth/session';
import { cleanEmail, cleanPassword } from '@/lib/security/validate';
import { trackEvent } from '@/lib/analytics/events';
import type { User, Reading, QuestionSession } from '@/lib/types/models';
import { ok, fail, handleError, guard } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const g = guard(req, 'register', 8, 15 * 60 * 1000);
    if (g) return g;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const email = cleanEmail(body.email);
    const password = cleanPassword(body.password);

    const existing = store.find<User>('users', (u) => u.email === email);
    if (existing) return fail('Bu e-posta ile bir hesap zaten var. Giriş yapmayı dene.', 409);

    const user: User = {
      id: newId('usr'),
      email,
      passwordHash: hashPassword(password),
      createdAt: Date.now(),
    };
    await store.insert('users', user);

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
    await trackEvent('account_registered');
    return ok({ ok: true, user: { id: user.id, email: user.email } }, 201);
  } catch (err) {
    return handleError(err);
  }
}
