/**
 * Sunucu taraflı akış yöneticisi: oturumun şu anki adımını üretir.
 * API rotaları ile paylaşılan tek doğruluk kaynağıdır.
 */
import type { QuestionSession } from '@/lib/types/models';
import { getQuestions, getSymbols } from '@/lib/db/content';
import { selectSymbolBoard } from '@/lib/symbols';
import {
  entryQuestionId, toPublicQuestion, MAX_QUESTIONS,
  type FlowStep,
} from './engine';

export function buildCurrentStep(session: QuestionSession): FlowStep {
  switch (session.status) {
    case 'profile':
      return { kind: 'profile', askName: true };

    case 'questions': {
      const questions = getQuestions();
      let qid = session.currentQuestionId;
      if (!qid || !questions.some((q) => q.id === qid)) {
        qid = entryQuestionId(session.category, questions, session.seed) ?? undefined;
      }
      if (!qid) {
        return { kind: 'symbols', symbols: symbolBoard(session), choose: 3 };
      }
      const question = questions.find((q) => q.id === qid)!;
      return {
        kind: 'question',
        question: toPublicQuestion(question),
        progress: { current: session.askedIds.length + 1, max: MAX_QUESTIONS },
        isLastPlanned: session.askedIds.length + 1 >= MAX_QUESTIONS,
      };
    }

    case 'symbols':
      return { kind: 'symbols', symbols: symbolBoard(session), choose: 3 };

    case 'tarot':
      if (!session.spread) {
        return {
          kind: 'tarot_spread',
          options: [
            { value: 1, label: 'Tek Kart — Sorunun özü', premium: false },
            { value: 3, label: 'Üç Kart — Geçmiş → Şimdi → Olası Yön', premium: false },
            { value: 5, label: 'Beş Kart — Derin Açılım (Premium)', premium: true },
          ],
        };
      }
      return { kind: 'tarot_pick', count: session.spread, totalSlots: 22 };

    case 'complete':
      return { kind: 'complete', readingId: session.readingId ?? '' };
  }
}

function symbolBoard(session: QuestionSession) {
  const board = selectSymbolBoard(getSymbols(), session.seed);
  return board.map((s) => ({ id: s.id, name: s.name, glyph: s.glyph }));
}
