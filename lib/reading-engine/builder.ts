/**
 * ANA KEHANET MOTORU — tüm sistemlerin birleştiği merkez.
 *
 * Question → Category → Answers → Scores → Numerology → Tarot →
 * Astrology → Symbols → Date calculations → Theme extraction →
 * Result Builder → Final Reading
 *
 * Sonuç metinleri LLM tarafından ÜRETİLMEZ; önceden yazılmış parçaların
 * (fragments) kural tabanlı, seed'li seçilip birleştirilmesiyle oluşur.
 */
import type {
  QuestionSession, Reading, ReadingData, Fragment, ScoreMap,
} from '@/lib/types/models';
import {
  getQuestions, getFragments, getTarotDeck, getNumerologyData, getSymbols,
} from '@/lib/db/content';
import { computeAnswerScores } from '@/lib/question-engine/engine';
import { detectSensitive, normalizeTr } from '@/lib/question-engine/classifier';
import { drawSpread, toReadingCards, type SpreadSize } from '@/lib/tarot/draw';
import { computeFullNumerology, nameEnergyLabel } from '@/lib/numerology/calc';
import { getNumberMeaning } from '@/lib/numerology/meanings';
import { astroSummary, elementNote } from '@/lib/astrology/signs';
import { selectSymbolBoard, symbolMeaning } from '@/lib/symbols';
import {
  finalizeScores, tarotContribution, numerologyContribution,
  astrologyContribution, symbolsContribution,
} from '@/lib/scoring';
import { makeRng, seedFrom } from '@/lib/random/seed';
import { energyTheme, influenceTheme, timingHorizon } from './themes';
import { selectFragments, deriveActiveTags } from './fragments';
import lettersMap from '@/data/numerology/letters.json';
import type { NumerologyLetterMap } from '@/lib/types/models';

const LETTERS = lettersMap as unknown as NumerologyLetterMap;

/** Kullanıcının sorusundan biçim sinyalleri: karar mı, zaman mı sorusu? */
function questionSignals(question: string): string[] {
  const n = normalizeTr(question);
  const tags: string[] = [];
  if (/\b(ayrıl|kalsın|yapmalı|etmeli|gitmeli|kalmalı|başlamalı|bitirmeli|söylemeli)\b/.test(n) ||
      /\b(mi|mı|mu|mü)\b/.test(n)) {
    tags.push('decision');
  }
  if (/(ne zaman|hangi tarihte|kaç gün|ne kadar süre)/.test(n)) tags.push('time');
  if (/(geri döner|geri gele|döner mi|dönmeli)/.test(n)) tags.push('return');
  if (/(yeniden|tekrar|bir daha)/.test(n)) tags.push('repeat');
  return tags;
}

export function generateReading(session: QuestionSession): Reading {
  const questions = getQuestions();
  const fragments = getFragments();
  const deck = getTarotDeck();
  const numerologyData = getNumerologyData();
  const symbols = getSymbols();

  // 1) Cevap skorları
  const answerRaw = computeAnswerScores(session.answers, questions);

  // 2) Tarot çekilişi (seed'li; kullanıcı pozisyon seçimi)
  const spread = (session.spread ?? 3) as SpreadSize;
  const drawn = drawSpread(deck, session.seed, session.pickedCardSlots, spread);
  const tarotCards = toReadingCards(drawn, session.category);

  // 3) Numeroloji
  const numerology = session.profile.birthDate
    ? computeFullNumerology(session.profile.name, session.profile.birthDate, LETTERS)
    : null;

  // 4) Astroloji
  const astro = session.profile.birthDate
    ? astroSummary(session.profile.birthDate, session.profile.birthTime)
    : null;

  // 5) Semboller
  const chosenSymbols = session.symbols
    .map((id) => symbols.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // 6) Birleşik skorlar
  const engineContribs: ScoreMap[] = [
    tarotContribution(drawn),
    numerologyContribution(numerology?.personalYear, numerology?.lifePath),
    astrologyContribution(astro?.element, astro?.quality),
    symbolsContribution(chosenSymbols),
  ];
  const scores = finalizeScores(answerRaw, engineContribs);

  // 7) Aktif koşul etiketleri
  const extras: string[] = [
    session.category,
    ...questionSignals(session.question),
    ...tarotCards.flatMap((c) => c.keywords).slice(0, 12),
    ...chosenSymbols.map((s) => s.id),
  ];
  const activeTags = deriveActiveTags(scores, extras);

  // 8) Parça seçimi — oturum seed'ine bağlı deterministik RNG
  const seed = seedFrom(session.seed, session.id, 'reading');
  const rng = makeRng(seed);
  const ctx = { category: session.category, activeTags, used: new Set<string>() };

  const opening = selectFragments(fragments, 'opening', ctx, 2, rng);
  const situation = selectFragments(fragments, 'situation', ctx, 1, rng);
  const hidden = selectFragments(fragments, 'hidden', ctx, 1, rng);
  const possibility = selectFragments(fragments, 'possibility', ctx, 2, rng);
  const opportunity = selectFragments(fragments, 'opportunity', ctx, 2, rng);
  const warning = selectFragments(fragments, 'warning', ctx, 2, rng);
  const timingFrags = selectFragments(fragments, 'timing', ctx, 1, rng);
  const closing = selectFragments(fragments, 'closing', ctx, 1, rng);

  // 9) Temalar ve zamanlama
  const energy = energyTheme(scores);
  const influence = influenceTheme(scores);
  const timing = timingHorizon(scores, drawn, numerology?.personalYear);

  // 10) Hassas konu kontrolü
  const sensitiveResult = detectSensitive(session.question);

  // 11) Numeroloji notları (farklı bölümlerden parça birleşimi)
  const numerologyNotes: string[] = [];
  if (numerology) {
    const lp = getNumberMeaning(numerologyData, numerology.lifePath, 'general', seed + 1);
    numerologyNotes.push(`Yaşam yolu sayın ${numerology.lifePath}: ${lp.lines.join(' ')}`);
    const py = getNumberMeaning(numerologyData, numerology.personalYear, 'general', seed + 2);
    numerologyNotes.push(`Kişisel yılın ${numerology.personalYear}: ${py.lines.join(' ')}`);
    const ctxField =
      session.category === 'money' ? 'money' :
      session.category === 'career' || session.category === 'job' ? 'career' :
      ['love', 'relationship', 'marriage'].includes(session.category) ? 'love' : 'general';
    const lpCtx = getNumberMeaning(numerologyData, numerology.lifePath, ctxField, seed + 3);
    if (lpCtx.lines.length) numerologyNotes.push(lpCtx.lines.join(' '));
    if (numerology.name) {
      numerologyNotes.push(
        `İsim hesabında toplam enerjin ${numerology.name.nameNumber}, ${nameEnergyLabel(numerology.name.nameNumber).toLowerCase()}. Ruh sayın ${numerology.name.soulNumber}, kişilik sayın ${numerology.name.personalityNumber}.`,
      );
    }
  }

  // 12) Astroloji notu
  const astroNote = astro
    ? `${astro.sun.nameTr} (${astro.dateRange}) burcundasın; ${astro.elementTr} elementi, ${astro.qualityTr} niteliği. ${elementNote(astro.element)}${astro.moon ? ` Doğum anındaki ay konumun yaklaşık olarak ${astro.moon.nameTr} burcunda: duygusal tepkilerinde ${astro.moon.traits.slice(0, 2).join(' ve ')} öne çıkıyor (bu hesap yaklaşık bir tahmindir).` : ''}`
    : '';

  // 13) Sembol anlamları
  const symbolPicks = chosenSymbols.map((s) => ({
    id: s.id,
    name: s.name,
    glyph: s.glyph,
    meaning: symbolMeaning(s, session.category),
  }));

  const data: ReadingData = {
    essence: [...opening.map((f) => f.text), ...situation.map((f) => f.text)],
    energy: { label: energy.label, body: [energy.body] },
    influence: { label: influence.label, body: [influence.body, ...hidden.map((f) => f.text)] },
    possibility: possibility.map((f) => f.text),
    attention: [...warning.map((f) => f.text), ...sensitiveResult.notes],
    opportunity: opportunity.map((f) => f.text),
    timing: { label: timing.label, body: [timing.body, ...timingFrags.map((f) => f.text)] },
    closing: closing.map((f) => f.text),
    scores,
    tarot: tarotCards,
    numerology: numerology
      ? {
          lifePath: numerology.lifePath,
          destiny: numerology.destiny,
          soul: numerology.soul,
          personality: numerology.personality,
          birthday: numerology.birthday,
          personalYear: numerology.personalYear,
          personalMonth: numerology.personalMonth,
          personalDay: numerology.personalDay,
          nameTotal: numerology.name?.rawTotal,
          vowelTotal: numerology.name?.vowelTotal,
          consonantTotal: numerology.name?.consonantTotal,
          notes: numerologyNotes,
        }
      : null,
    astrology: astro
      ? {
          sunSign: astro.sun.nameTr,
          sunDateRange: astro.dateRange,
          element: astro.element,
          elementTr: astro.elementTr,
          quality: astro.quality,
          qualityTr: astro.qualityTr,
          moonSign: astro.moon?.nameTr,
          moonApproximate: astro.moonApproximate,
          note: astroNote,
        }
      : null,
    symbols: symbolPicks,
    themeTags: [...activeTags].slice(0, 18),
    fragmentIds: [...ctx.used],
  };

  return {
    id: `rd_${session.id.replace(/^sess_/, '')}`,
    sessionId: session.id,
    ownerId: session.ownerId,
    question: session.question,
    category: session.category,
    createdAt: Date.now(),
    paid: false,
    sensitive: sensitiveResult.sensitive,
    data,
  };
}
