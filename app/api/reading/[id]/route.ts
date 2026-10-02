/**
 * GET /api/reading/:id — okumayı sahipliğe ve premium durumuna göre döndürür.
 * Ücretsiz katman: kısa öz + enerji + zamanlama.
 * Premium (mock ödeme): tam rapor — tüm bölümler, tarot anlamları,
 * numeroloji, astroloji, semboller, skor haritası.
 */
import { NextRequest } from 'next/server';
import { store } from '@/lib/db/store';
import { canAccessOwner, isAdminRequest } from '@/lib/auth/session';
import { cleanId } from '@/lib/security/validate';
import type { Reading } from '@/lib/types/models';
import { ok, fail, handleError } from '@/lib/api/helpers';

export const runtime = 'nodejs';

function freeView(reading: Reading) {
  return {
    id: reading.id,
    question: reading.question,
    category: reading.category,
    createdAt: reading.createdAt,
    sensitive: reading.sensitive,
    paid: reading.paid,
    essence: reading.data.essence.slice(0, 2),
    energy: reading.data.energy,
    timing: { label: reading.data.timing.label },
    tarotPreview: reading.data.tarot.map((c) => ({
      nameTr: c.nameTr, name: c.name, glyph: c.glyph, position: c.position, reversed: c.reversed,
    })),
    scoresPreview: {
      change: reading.data.scores.change,
      risk: reading.data.scores.risk,
    },
    locked: true,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = cleanId(params.id, 'okuma');
    const reading = await store.get<Reading>('readings', id);
    if (!reading) return fail('Okuma bulunamadı.', 404);

    const owns = canAccessOwner(reading.ownerId);
    const admin = isAdminRequest();
    if (!owns && !admin) return fail('Bu okuma sana ait değil.', 403);

    if (!reading.paid && !admin) {
      return ok(freeView(reading));
    }
    return ok({ ...reading, locked: false });
  } catch (err) {
    return handleError(err);
  }
}
