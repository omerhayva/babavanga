/**
 * POST /api/answer — akıştaki mevcut adıma cevap gönderir.
 * Adım türü oturumdan belirlenir (profile | question | symbols | tarot).
 * Koşullu dallanma burada çalışır: cevaba göre sıradaki soru seçilir.
 */
import { NextRequest } from 'next/server';
import { store } from '@/lib/db/store';
import { getQuestions, getSymbols } from '@/lib/db/content';
import {
  validateAnswer, computeAnswerScores, nextQuestionForSession,
} from '@/lib/question-engine/engine';
import { buildCurrentStep } from '@/lib/question-engine/flow';
import { getCurrentUser, canAccessOwner } from '@/lib/auth/session';
import { cleanString, cleanDate, cleanTime, cleanId } from '@/lib/security/validate';
import { trackEvent } from '@/lib/analytics/events';
import type { QuestionSession } from '@/lib/types/models';
import { ok, fail, handleError, guard } from '@/lib/api/helpers';

export const runtime = 'nodejs';

function userHasPremium(): boolean {
  const user = getCurrentUser();
  return !!user && !!user.premiumUntil && user.premiumUntil > Date.now();
}

export async function POST(req: NextRequest) {
  try {
    const g = guard(req, 'answer', 240, 10 * 60 * 1000);
    if (g) return g;

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const sessionId = cleanId(body.sessionId, 'oturum');
    const session = await store.get<QuestionSession>('sessions', sessionId);
    if (!session) return fail('Oturum bulunamadı.', 404);
    if (!canAccessOwner(session.ownerId)) return fail('Bu oturum sana ait değil.', 403);

    switch (session.status) {
      // ---------------------------------------------------- Profil adımı
      case 'profile': {
        const skip = body.skip === true;
        if (!skip) {
          const name = cleanString(body.name ?? '', 80, 'isim') || undefined;
          const birthDateRaw = body.birthDate;
          const birthDate = birthDateRaw ? cleanDate(birthDateRaw, 'doğum tarihi') : undefined;
          const birthTime = body.birthTime ? cleanTime(body.birthTime) : undefined;
          const birthPlace = cleanString(body.birthPlace ?? '', 80, 'doğum yeri') || undefined;
          session.profile = { name, birthDate, birthTime, birthPlace };
        }
        session.status = 'questions';
        await store.update<QuestionSession>('sessions', session.id, session);
        await trackEvent('question_submitted', { category: session.category });
        return ok({ step: buildCurrentStep(session) });
      }

      // ---------------------------------------------------- Soru adımı
      case 'questions': {
        const questions = getQuestions();
        const qid = session.currentQuestionId
          ?? questions.find((q) => q.category === session.category && q.stage !== 'generic')?.id;
        if (!qid) return fail('Akış bozuk görünüyor. Yeni bir soru ile başla.', 409);
        const question = questions.find((q) => q.id === qid);
        if (!question) return fail('Soru bulunamadı.', 404);

        let validated: { value: string | number | string[]; optionValues: string[] };
        try {
          validated = validateAnswer(question, body.value);
        } catch (e) {
          return fail(e instanceof Error ? e.message : 'Cevap geçersiz.', 400);
        }

        session.answers.push({
          questionId: qid,
          value: validated.value,
          optionValues: validated.optionValues,
          at: Date.now(),
        });
        if (!session.askedIds.includes(qid)) session.askedIds.push(qid);

        // koşullu dallanma: bir sonraki soru
        const raw = computeAnswerScores(session.answers, questions);
        const next = nextQuestionForSession(session, question, questions, raw);
        if (next) {
          session.currentQuestionId = next;
        } else {
          session.currentQuestionId = undefined;
          session.status = 'symbols';
        }
        await store.update<QuestionSession>('sessions', session.id, session);
        return ok({
          step: buildCurrentStep(session),
          finishedQuestions: session.status === 'symbols',
        });
      }

      // ---------------------------------------------------- Sembol adımı
      case 'symbols': {
        if (!Array.isArray(body.symbols)) return fail('Sembol seçimi geçersiz.', 400);
        const chosen = [...new Set(body.symbols.map((s) => String(s)))].slice(0, 4);
        const valid = getSymbols().map((s) => s.id);
        const symbols = chosen.filter((s) => valid.includes(s));
        if (symbols.length !== 3) return fail('Tam olarak 3 sembol seçmelisin.', 400);
        session.symbols = symbols;
        session.status = 'tarot';
        await store.update<QuestionSession>('sessions', session.id, session);
        await trackEvent('symbol_chosen');
        return ok({ step: buildCurrentStep(session) });
      }

      // ---------------------------------------------------- Tarot adımları
      case 'tarot': {
        if (session.spread === undefined) {
          // açılım seçimi
          const spread = Number(body.spread);
          if (![1, 3, 5].includes(spread)) return fail('Geçersiz açılım.', 400);
          if (spread === 5 && !userHasPremium()) {
            return fail('Beş kart açılımı premium üyelere özel. Detaylı rapor ile birlikte açılabilir.', 402);
          }
          session.spread = spread as 1 | 3 | 5;
          await store.update<QuestionSession>('sessions', session.id, session);
          return ok({ step: buildCurrentStep(session) });
        }
        // kart seçimi
        if (!Array.isArray(body.slots)) return fail('Kart seçimi geçersiz.', 400);
        const slots = [...new Set(body.slots.map(Number))]
          .filter((n) => Number.isInteger(n) && n >= 0 && n < 22)
          .slice(0, session.spread);
        if (slots.length !== session.spread) {
          return fail(`Tam olarak ${session.spread} kart seçmelisin.`, 400);
        }
        session.pickedCardSlots = slots;
        session.status = 'complete';
        session.completedAt = Date.now();
        await store.update<QuestionSession>('sessions', session.id, session);
        await trackEvent('tarot_drawn', { spread: session.spread });
        return ok({ step: buildCurrentStep(session) });
      }

      case 'complete':
        return fail('Bu oturum tamamlandı. Sonucunu görüntüleyebilirsin.', 409);
    }
  } catch (err) {
    return handleError(err);
  }
}
