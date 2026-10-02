/**
 * Skor motoru: cevap skorları + tüm kehanet motorlarının katkıları
 * birleştirilip 0-100 aralığına normalize edilir.
 */
import type {
  ScoreMap, ScoreKey, ReadingScoreSet, SymbolData, TarotCardData,
} from '@/lib/types/models';
import { SCORE_KEYS } from '@/lib/types/models';
import { type DrawnCard } from '@/lib/tarot/draw';

/** Numeroloji → skor katkısı (kişisel yıl + yaşam yolu, sabit tablo) */
const PERSONAL_YEAR_CONTRIB: Record<number, ScoreMap> = {
  1: { change: 8, opportunity: 5, confidence: 3 },
  2: { patience: 8, relationship: 4 },
  3: { hope: 7, opportunity: 4, relationship: 3 },
  4: { patience: 10, career: 5, money: 3 },
  5: { change: 12, risk: 5, opportunity: 4 },
  6: { relationship: 9, patience: 3 },
  7: { patience: 7, hope: 3 },
  8: { money: 10, career: 7, confidence: 4 },
  9: { change: 9, patience: -4, hope: 4 },
  11: { hope: 9, confidence: 3 },
  22: { career: 9, money: 5, patience: 4 },
  33: { relationship: 7, hope: 5 },
};

const LIFE_PATH_CONTRIB: Record<number, ScoreMap> = {
  1: { confidence: 3, change: 2 },
  2: { patience: 3, relationship: 2 },
  3: { hope: 3 },
  4: { patience: 4, career: 2 },
  5: { change: 4, risk: 2 },
  6: { relationship: 4 },
  7: { patience: 3 },
  8: { money: 4, career: 3 },
  9: { change: 3, hope: 2 },
  11: { hope: 4 },
  22: { career: 5 },
  33: { relationship: 4 },
};

const ELEMENT_CONTRIB: Record<string, ScoreMap> = {
  fire: { change: 6, confidence: 4, urgency: 4 },
  earth: { patience: 8, money: 4 },
  air: { opportunity: 6, confidence: 2 },
  water: { relationship: 6, hope: 4 },
};

const QUALITY_CONTRIB: Record<string, ScoreMap> = {
  cardinal: { change: 4, urgency: 4 },
  fixed: { patience: 6 },
  mutable: { change: 6, risk: 3 },
};

export function tarotContribution(cards: DrawnCard[]): ScoreMap {
  const out: ScoreMap = {};
  for (const d of cards) {
    const s = d.card.scores;
    if (!s) continue;
    const factor = d.reversed ? 0.6 : 1;
    for (const [k, v] of Object.entries(s) as Array<[ScoreKey, number]>) {
      out[k] = (out[k] ?? 0) + v * factor;
    }
    if (d.reversed) out.risk = (out.risk ?? 0) + 2;
  }
  return out;
}

export function numerologyContribution(personalYear?: number, lifePath?: number): ScoreMap {
  const out: ScoreMap = {};
  const merge = (m?: ScoreMap) => {
    if (!m) return;
    for (const [k, v] of Object.entries(m) as Array<[ScoreKey, number]>) {
      out[k] = (out[k] ?? 0) + v;
    }
  };
  merge(PERSONAL_YEAR_CONTRIB[personalYear ?? 0]);
  merge(LIFE_PATH_CONTRIB[lifePath ?? 0]);
  return out;
}

export function astrologyContribution(element?: string, quality?: string): ScoreMap {
  const out: ScoreMap = {};
  const merge = (m?: ScoreMap) => {
    if (!m) return;
    for (const [k, v] of Object.entries(m) as Array<[ScoreKey, number]>) {
      out[k] = (out[k] ?? 0) + v;
    }
  };
  merge(ELEMENT_CONTRIB[element ?? '']);
  merge(QUALITY_CONTRIB[quality ?? '']);
  return out;
}

export function symbolsContribution(symbols: SymbolData[]): ScoreMap {
  const out: ScoreMap = {};
  for (const s of symbols) {
    if (!s.scores) continue;
    for (const [k, v] of Object.entries(s.scores) as Array<[ScoreKey, number]>) {
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

function addInto(target: ScoreMap, source: ScoreMap, factor: number): void {
  for (const k of SCORE_KEYS) {
    const v = source[k];
    if (v === undefined) continue;
    target[k] = (target[k] ?? 0) + v * factor;
  }
}

/**
 * Final skorlar: cevaplar baskın (×1), motor katkıları destekleyici (×0.55).
 * 0-100 normalize: 50 merkezli lineer eşleme.
 */
export function finalizeScores(answerRaw: ScoreMap, engineContribs: ScoreMap[]): ReadingScoreSet {
  const combined: ScoreMap = {};
  addInto(combined, answerRaw, 1);
  for (const c of engineContribs) addInto(combined, c, 0.55);

  const out = {} as ReadingScoreSet;
  for (const k of SCORE_KEYS) {
    const raw = combined[k] ?? 0;
    const val = Math.round(Math.min(100, Math.max(0, 50 + raw * 2)));
    out[k] = val;
  }
  return out;
}

/** En baskın skor anahtarları (tema çıkarımı için) */
export function topScoreKeys(scores: ReadingScoreSet, count = 3): ScoreKey[] {
  return [...SCORE_KEYS]
    .map((k) => ({ k, v: scores[k] }))
    .sort((a, b) => Math.abs(b.v - 50) - Math.abs(a.v - 50))
    .slice(0, count)
    .map((x) => x.k);
}
