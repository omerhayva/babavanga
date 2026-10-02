/**
 * POST /api/reading — tamamlanmış oturumdan kehanet sonucunu ÜRETİR.
 * Tamamen deterministik: aynı oturum → aynı sonuç.
 */
import { NextRequest } from 'next/server';
import { store } from '@/lib/db/store';
import { generateReading } from '@/lib/reading-engine/builder';
import { canAccessOwner } from '@/lib/auth/session';
import { cleanId } from '@/lib/security/validate';
import { trackEvent } from '@/lib/analytics/events';
import type { QuestionSession } from '@/lib/types/models';
import { ok, fail, handleError, guard } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const g = guard(req, 'reading', 15, 10 * 60 * 1000);
    if (g) return g;

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const sessionId = cleanId(body.sessionId, 'oturum');
    const session = await store.get<QuestionSession>('sessions', sessionId);
    if (!session) return fail('Oturum bulunamadı.', 404);
    if (!canAccessOwner(session.ownerId)) return fail('Bu oturum sana ait değil.', 403);
    if (session.status !== 'complete') return fail('Akış henüz tamamlanmadı.', 409);

    // idempotent: aynı oturum için aynı okuma
    if (session.readingId) {
      const existing = await store.get('readings', session.readingId);
      if (existing) return ok({ readingId: session.readingId });
    }

    const reading = generateReading(session);
    await store.upsert('readings', reading);
    await store.update<QuestionSession>('sessions', session.id, { readingId: reading.id });
    await trackEvent('reading_completed', { category: session.category });
    return ok({ readingId: reading.id }, 201);
  } catch (err) {
    return handleError(err);
  }
}
