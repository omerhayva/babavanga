/**
 * POST /api/session — yeni soru oturumu oluştur.
 * Soruyu sınıflandırır, seed üretir ve ilk adımı döndürür.
 */
import { NextRequest } from 'next/server';
import { store, newId } from '@/lib/db/store';
import { getCategories } from '@/lib/db/content';
import { classifyQuestion } from '@/lib/question-engine/classifier';
import { buildCurrentStep } from '@/lib/question-engine/flow';
import { resolveOwnerId as getOwnerId } from '@/lib/auth/session';
import { cleanString } from '@/lib/security/validate';
import { seedFrom } from '@/lib/random/seed';
import { trackEvent } from '@/lib/analytics/events';
import type { QuestionSession } from '@/lib/types/models';
import { ok, fail, handleError, guard } from '@/lib/api/helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const g = guard(req, 'session', 20, 10 * 60 * 1000);
    if (g) return g;

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const question = cleanString(body.question, 280, 'soru');
    if (question.length < 5) return fail('Sorunu biraz daha açar mısın? (en az 5 karakter)', 400);

    const categories = getCategories();
    const categoryHint = typeof body.category === 'string' ? body.category : undefined;
    let category = 'general';
    let categorySource: 'auto' | 'user' = 'auto';
    if (categoryHint && categories.some((c) => c.id === categoryHint)) {
      category = categoryHint;
      categorySource = 'user';
    } else {
      category = classifyQuestion(question, categories).category;
    }

    const ownerId = getOwnerId();
    const id = newId('sess');
    const session: QuestionSession = {
      id,
      ownerId,
      question,
      category,
      categorySource,
      seed: seedFrom(ownerId, question, id),
      profile: {},
      answers: [],
      askedIds: [],
      symbols: [],
      pickedCardSlots: [],
      status: 'profile',
      startedAt: Date.now(),
      questionTime: new Date().toISOString(),
    };
    await store.insert('sessions', session);
    await trackEvent('question_started', { category });

    return ok({ sessionId: id, category, categorySource, step: buildCurrentStep(session) }, 201);
  } catch (err) {
    return handleError(err);
  }
}
