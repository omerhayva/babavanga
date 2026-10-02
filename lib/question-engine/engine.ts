/**
 * QUESTION ENGINE — projenin kalbi.
 *
 * Koşullu dallanan (conditional branching) dinamik soru akışı:
 *  - Her cevap bir sonraki soruyu belirler (option.next → conditions → nextQuestion
 *    → kategori sırası → adaptif generic havuz).
 *  - Herkes aynı soruları görmez; akış cevaplara göre değişir.
 *  - Minimum MIN_QUESTIONS, maksimum MAX_QUESTIONS soru sorulur.
 */
import type {
  Question, QuestionSession, SessionAnswer, ScoreMap, ScoreKey, SymbolData,
} from '@/lib/types/models';
import { SCORE_KEYS } from '@/lib/types/models';
import { makeRng, shuffle } from '@/lib/random/seed';

export const MIN_QUESTIONS = 6;
export const MAX_QUESTIONS = 9;

// -------------------------------------------------------------- Public tip

export interface PublicOption { value: string; label: string; glyph?: string }

export interface PublicQuestion {
  id: string;
  category: string;
  text: string;
  helperText?: string;
  type: Question['type'];
  options: PublicOption[];
  minSelected?: number;
  maxSelected?: number;
  scaleLabels?: [string, string];
}

/** Skor / branching mantığını içermeyen, istemciye güvenli soru görünümü */
export function toPublicQuestion(q: Question): PublicQuestion {
  return {
    id: q.id,
    category: q.category,
    text: q.text,
    helperText: q.helperText,
    type: q.type,
    options: (q.options ?? []).map((o) => ({ value: o.value, label: o.label, glyph: o.glyph })),
    minSelected: q.minSelected,
    maxSelected: q.maxSelected,
    scaleLabels: q.scaleLabels,
  };
}

// -------------------------------------------------------------- Cevap doğrulama

export function validateAnswer(question: Question, value: unknown): {
  value: string | number | string[];
  optionValues: string[];
} {
  if (question.type === 'single') {
    if (typeof value !== 'string') throw new Error('Cevap biçimi geçersiz.');
    const opt = question.options.find((o) => o.value === value);
    if (!opt) throw new Error('Geçersiz seçenek.');
    return { value, optionValues: [value] };
  }
  if (question.type === 'multi') {
    if (!Array.isArray(value)) throw new Error('Cevap biçimi geçersiz.');
    const values = value.map(String).slice(0, question.maxSelected ?? 6);
    const valid = values.filter((v) => question.options.some((o) => o.value === v));
    const unique = [...new Set(valid)];
    const min = question.minSelected ?? 1;
    if (unique.length < min) throw new Error(`En az ${min} seçim yap.`);
    return { value: unique, optionValues: unique };
  }
  if (question.type === 'scale') {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error('Geçersiz ölçek değeri.');
    return { value: n, optionValues: [] };
  }
  if (question.type === 'number') {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 9) throw new Error('0-9 arasında bir sayı seç.');
    return { value: n, optionValues: [] };
  }
  throw new Error('Bilinmeyen soru tipi.');
}

// -------------------------------------------------------------- Skorlama

/** Cevaplardan ham (normalize edilmemiş) skorlar */
export function computeAnswerScores(answers: SessionAnswer[], questions: Question[]): ScoreMap {
  const raw: ScoreMap = {};
  const byId = new Map(questions.map((q) => [q.id, q]));
  const add = (key: ScoreKey, amount: number) => {
    raw[key] = (raw[key] ?? 0) + amount;
  };

  for (const ans of answers) {
    const q = byId.get(ans.questionId);
    if (!q) continue;
    const weight = q.weight ?? 1;

    if (q.type === 'scale' && typeof ans.value === 'number' && q.scoring) {
      // 1-5 ölçeği → merkezden sapma (3) × katsayı
      const delta = ans.value - 3;
      for (const [k, coef] of Object.entries(q.scoring) as Array<[ScoreKey, number]>) {
        add(k, delta * coef * weight);
      }
    } else if (q.type === 'number' && typeof ans.value === 'number') {
      // seçilen sayı hafif tema sinyali: yüksek sayılar genişleme, düşükler yoğunlaşma
      add('hope', (ans.value - 4.5) * 0.6 * weight);
    } else {
      for (const ov of ans.optionValues) {
        const opt = q.options.find((o) => o.value === ov);
        if (opt?.scores) {
          for (const [k, v] of Object.entries(opt.scores) as Array<[ScoreKey, number]>) {
            add(k, v * weight);
          }
        }
      }
    }
    // sorunun sabit skor katkısı
    if (q.scoring && q.type !== 'scale') {
      for (const [k, v] of Object.entries(q.scoring) as Array<[ScoreKey, number]>) {
        add(k, v * weight);
      }
    }
  }
  return raw;
}

// -------------------------------------------------------------- Akış motoru

function answeredMap(session: QuestionSession): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const a of session.answers) m.set(a.questionId, a.optionValues);
  return m;
}

/** Koşullu dallanma: opsiyon next → conditions → nextQuestion */
export function resolveNextQuestionId(
  session: QuestionSession,
  currentQuestion: Question,
  questions: Question[],
  answerRaw: ScoreMap,
): string | null {
  const answered = answeredMap(session);
  const lastAnswer = session.answers[session.answers.length - 1];
  const lastValues = lastAnswer?.optionValues ?? [];

  // 1) Son cevabın opsiyonuna bağlı dal
  if (currentQuestion.type === 'single' || currentQuestion.type === 'multi') {
    for (const v of lastValues) {
      const opt = currentQuestion.options.find((o) => o.value === v);
      if (opt?.next && questions.some((q) => q.id === opt.next)) return opt.next;
    }
  }

  // 2) Sorunun koşul kuralları (yukarıdan aşağı)
  if (currentQuestion.conditions) {
    for (const cond of currentQuestion.conditions) {
      if (!questions.some((q) => q.id === cond.next)) continue;
      let ok = true;
      if (cond.questionId) {
        const ref = answered.get(cond.questionId);
        if (cond.in) ok = ok && !!ref && cond.in.some((v) => ref.includes(v));
        if (cond.notIn) ok = ok && !!ref && !cond.notIn.some((v) => ref.includes(v));
      }
      if (cond.scoreKey) {
        const val = answerRaw[cond.scoreKey] ?? 0;
        if (cond.minScore !== undefined) ok = ok && val >= cond.minScore;
        if (cond.maxScore !== undefined) ok = ok && val <= cond.maxScore;
      }
      if (ok) return cond.next;
    }
  }

  // 3) Varsayılan sonraki
  if (currentQuestion.nextQuestion && questions.some((q) => q.id === currentQuestion.nextQuestion)) {
    return currentQuestion.nextQuestion;
  }

  // 4) Kategori ağacında sıradaki soru (core/depth, order sırasıyla)
  const inCategory = questions
    .filter((q) => q.category === currentQuestion.category && q.stage !== 'generic')
    .sort((a, b) => a.order - b.order);
  for (const q of inCategory) {
    if (!session.askedIds.includes(q.id)) return q.id;
  }

  return null;
}

const GENERIC_TAG_RULES: Array<{ tag: string; test: (s: ScoreMap) => boolean }> = [
  { tag: 'risk', test: (s) => (s.risk ?? 0) >= 6 },
  { tag: 'hope', test: (s) => (s.hope ?? 0) <= 0 },
  { tag: 'patience', test: (s) => (s.patience ?? 0) >= 6 },
  { tag: 'money', test: (s) => (s.money ?? 0) >= 6 },
  { tag: 'love', test: (s) => (s.relationship ?? 0) >= 6 },
  { tag: 'timing', test: (s) => (s.urgency ?? 0) >= 6 },
  { tag: 'decision', test: (s) => (s.confidence ?? 0) <= 0 },
];

/** Adaptif generic havuzdan uygun soru seçer (seed'li, tekrarsız) */
export function pickGenericQuestion(
  session: QuestionSession,
  questions: Question[],
  answerRaw: ScoreMap,
): string | null {
  const pool = questions.filter((q) => q.stage === 'generic' && !session.askedIds.includes(q.id));
  if (pool.length === 0) return null;

  const activeTags = new Set(GENERIC_TAG_RULES.filter((r) => r.test(answerRaw)).map((r) => r.tag));
  const rng = makeRng(session.seed + session.askedIds.length * 7919);

  const scored = pool.map((q) => {
    let s = 1;
    for (const t of q.tags) if (activeTags.has(t)) s += 3;
    if (q.category === session.category) s += 2;
    return { q, s };
  });
  scored.sort((a, b) => b.s - a.s);
  const top = scored.filter((x) => x.s === scored[0].s);
  return shuffle(top, rng)[0].q.id;
}

/** Akışın bir sonraki sorusunu belirler; null → sorular tamam. */
export function nextQuestionForSession(
  session: QuestionSession,
  currentQuestion: Question,
  questions: Question[],
  answerRaw: ScoreMap,
): string | null {
  const asked = session.askedIds.length;
  if (asked >= MAX_QUESTIONS) return null;

  let next = resolveNextQuestionId(session, currentQuestion, questions, answerRaw);
  if (next && session.askedIds.includes(next)) next = null;

  if (!next && asked < MIN_QUESTIONS) {
    next = pickGenericQuestion(session, questions, answerRaw);
  }
  return next;
}

/** Kategori giriş sorusu */
export function entryQuestionId(category: string, questions: Question[], seed?: number): string | null {
  const inCat = questions
    .filter((q) => q.category === category && q.stage !== 'generic')
    .sort((a, b) => a.order - b.order);
  if (inCat.length > 0) return inCat[0].id;
  // kategori tanımsız / boşsa generic havuzdan seed'li seçim (her oturumda farklı giriş)
  const generic = questions
    .filter((q) => q.stage === 'generic' && q.category === 'general')
    .sort((a, b) => a.order - b.order);
  if (generic.length === 0) return questions[0]?.id ?? null;
  if (seed === undefined) return generic[0].id;
  const rng = makeRng(seed);
  return shuffle(generic, rng)[0].id;
}

/** Akış adımları (API + UI arasında paylaşılan tip) */
export type FlowStep =
  | { kind: 'profile'; askName: boolean }
  | {
      kind: 'question';
      question: PublicQuestion;
      progress: { current: number; max: number };
      isLastPlanned: boolean;
    }
  | { kind: 'symbols'; symbols: Array<Pick<SymbolData, 'id' | 'name' | 'glyph'>>; choose: number }
  | { kind: 'tarot_spread'; options: Array<{ value: 1 | 3 | 5; label: string; premium: boolean }> }
  | { kind: 'tarot_pick'; count: number; totalSlots: number }
  | { kind: 'complete'; readingId: string };
