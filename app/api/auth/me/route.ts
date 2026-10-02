/**
 * GET /api/auth/me — oturumdaki kullanıcı (veya misafir durumu)
 */
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { ok, handleError } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) return ok({ user: null, guest: true });
    return ok({
      user: {
        id: user.id,
        email: user.email,
        premiumUntil: user.premiumUntil ?? null,
        premiumActive: !!user.premiumUntil && user.premiumUntil > Date.now(),
      },
      guest: false,
    });
  } catch (err) {
    return handleError(err);
  }
}
