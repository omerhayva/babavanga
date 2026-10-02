/**
 * GET /api/account/readings — "Geçmiş Sorularım"
 * Misafirken de çalışır (guest cookie); üye girişinde üye okumaları.
 */
import { NextRequest } from 'next/server';
import { store } from '@/lib/db/store';
import { resolveOwnerId as getOwnerId } from '@/lib/auth/session';
import type { Reading } from '@/lib/types/models';
import { ok, handleError } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    const ownerId = getOwnerId();
    const readings = store
      .filter<Reading>('readings', (r) => r.ownerId === ownerId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50)
      .map((r) => ({
        id: r.id,
        question: r.question,
        category: r.category,
        createdAt: r.createdAt,
        paid: r.paid,
        energy: r.data.energy.label,
        timing: r.data.timing.label,
      }));
    return ok({ readings });
  } catch (err) {
    return handleError(err);
  }
}
