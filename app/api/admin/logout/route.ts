/**
 * POST /api/admin/logout
 */
import { NextRequest } from 'next/server';
import { clearAdminCookie } from '@/lib/auth/session';
import { ok, handleError } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest) {
  try {
    clearAdminCookie();
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
