/**
 * POST /api/numerology/calc — ücretsiz numeroloji hesaplayıcı (SEO sayfası).
 * Deterministik: aynı girdi → aynı sonuç.
 */
import { NextRequest } from 'next/server';
import { computeFullNumerology, nameEnergyLabel } from '@/lib/numerology/calc';
import { getNumberMeaning } from '@/lib/numerology/meanings';
import { getNumerologyData } from '@/lib/db/content';
import { readJson, cleanString, cleanDate, ValidationError } from '@/lib/security/validate';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { seedFrom } from '@/lib/random/seed';
import { ok, fail, handleError } from '@/lib/api/helpers';
import lettersMap from '@/data/numerology/letters.json';
import type { NumerologyLetterMap } from '@/lib/types/models';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`numerology:${clientIp(req)}`, 30, 60 * 1000);
    if (!rl.ok) return fail('Biraz soluklan ve tekrar dene.', 429);

    const body = await readJson(req);
    const name = cleanString(body.name ?? '', 80, 'isim') || undefined;
    const birthDate = cleanString(body.birthDate ?? '', 10, 'doğum tarihi');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return fail('Doğum tarihi YYYY-AA-GG biçiminde olmalı.', 400);
    }
    try {
      cleanDate(birthDate);
    } catch {
      return fail('Doğum tarihi geçersiz.', 400);
    }

    const letters = lettersMap as unknown as NumerologyLetterMap;
    const numerology = computeFullNumerology(name, birthDate, letters);
    if (!numerology) return fail('Hesaplama yapılamadı.', 400);

    const data = getNumerologyData();
    const seed = seedFrom(name ?? '', birthDate);
    const meanings = {
      lifePath: getNumberMeaning(data, numerology.lifePath, 'general', seed + 1),
      personalYear: getNumberMeaning(data, numerology.personalYear, 'general', seed + 2),
      name: name
        ? { energy: nameEnergyLabel(numerology.name!.nameNumber), numbers: numerology.name }
        : null,
    };

    return ok({ numerology, meanings });
  } catch (err) {
    if (err instanceof ValidationError) return fail(err.message, 400);
    return handleError(err);
  }
}
