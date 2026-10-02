/**
 * POST /api/tarot/draw — ücretsiz mini tarot (SEO sayfası için).
 * Seed verilirse deterministik; verilmezse sunucu üretir ve döndürür.
 */
import { NextRequest } from 'next/server';
import { getTarotDeck } from '@/lib/db/content';
import { drawSpread, toReadingCards, SPREADS, type SpreadSize } from '@/lib/tarot/draw';
import { makeRng, randInt } from '@/lib/random/seed';
import { readJson, cleanString, ValidationError } from '@/lib/security/validate';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { ok, fail, handleError } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`tarot:${clientIp(req)}`, 30, 60 * 1000);
    if (!rl.ok) return fail('Biraz soluklan ve tekrar dene.', 429);

    let body: Record<string, unknown> = {};
    try {
      body = await readJson(req);
    } catch {
      body = {};
    }

    const size = ([1, 3, 5].includes(Number(body.spread)) ? Number(body.spread) : 3) as SpreadSize;
    const category = cleanString(body.category ?? 'general', 30, 'kategori');
    const seed = Math.floor(Date.now() / 1000) ^ Math.floor(Math.random() * 0xffff);
    const rng = makeRng(seed);

    const deck = getTarotDeck();
    const spec = SPREADS[size];
    const slots: number[] = [];
    while (slots.length < spec.count) {
      const s = randInt(rng, 0, 21);
      if (!slots.includes(s)) slots.push(s);
    }
    const drawn = drawSpread(deck, seed ^ 0x7a17, slots, size);
    const cards = toReadingCards(drawn, category);
    return ok({ seed, cards });
  } catch (err) {
    if (err instanceof ValidationError) return fail(err.message, 400);
    return handleError(err);
  }
}
