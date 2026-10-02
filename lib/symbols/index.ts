/**
 * Sembol motoru: kullanıcıya gösterilecek sembollerin seed'li seçimi ve
 * kategoriye göre anlam eşleştirmesi.
 */
import type { SymbolData, ScoreMap } from '@/lib/types/models';
import { shuffle, pickMany, makeRng } from '@/lib/random/seed';

export const SYMBOLS_TO_SHOW = 12;
export const SYMBOLS_TO_CHOOSE = 3;

/** Oturuma göre 12 sembol seç (16+ havuzdan) */
export function selectSymbolBoard(symbols: SymbolData[], seed: number): SymbolData[] {
  const rng = makeRng(seed ^ 0x9e3779b9);
  return pickMany(shuffle(symbols, makeRng(seed)), SYMBOLS_TO_SHOW, rng);
}

/** Kategoriye göre sembol yorumu seç */
export function symbolMeaning(symbol: SymbolData, category: string): string {
  switch (category) {
    case 'love':
    case 'relationship':
    case 'marriage':
      return symbol.love;
    case 'money':
      return symbol.money;
    case 'career':
    case 'job':
      return symbol.career;
    default:
      return symbol.general;
  }
}

/** data/symbols/symbols.json içindeki "scores" alanından (varsa) skor katkısı */
export function symbolScores(symbol: SymbolData): ScoreMap {
  const s = symbol as SymbolData & { scores?: ScoreMap };
  return s.scores ?? {};
}
