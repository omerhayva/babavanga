/**
 * POST /api/auth/logout
 */
import { NextRequest } from 'next/server';
import { clearUserCookie } from '@/lib/auth/session';
import { ok, handleError } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest) {
  try {
    clearUserCookie();
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
