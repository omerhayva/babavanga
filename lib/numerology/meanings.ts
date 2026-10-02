/**
 * Numeroloji anlamları: sayı → yorum parçaları.
 * Veri /data/numerology/numbers.json'dan gelir (admin panelde düzenlenebilir).
 * Bu modül anlam seçimini deterministik yapar: farklı bölümlerden
 * (themes/positive/love/money/career) parçalar birleştirilir.
 */
import type { NumerologyNumberData } from '@/lib/types/models';
import { makeRng, pick } from '@/lib/random/seed';

export type NumerologyContext = 'general' | 'love' | 'money' | 'career';

export function getNumberMeaning(
  data: Record<string, NumerologyNumberData> | undefined,
  n: number,
  context: NumerologyContext = 'general',
  seed: number,
): { headline: string; lines: string[] } {
  const entry = data?.[String(n)];
  if (!entry) return { headline: String(n), lines: [] };
  const rng = makeRng(seed);
  const lines: string[] = [];
  if (context === 'love' && entry.love.length) lines.push(pick(entry.love, rng));
  else if (context === 'money' && entry.money.length) lines.push(pick(entry.money, rng));
  else if (context === 'career' && entry.career.length) lines.push(pick(entry.career, rng));
  else if (entry.themes.length) lines.push(pick(entry.themes, rng));
  if (entry.positive.length) lines.push(pick(entry.positive, rng));
  return { headline: entry.themes[0] ?? String(n), lines: lines.slice(0, 2) };
}

/** Yaşam yolu sayısının kısa özeti (UI rozetleri için) */
export function shortNumberMeaning(n: number): string {
  const map: Record<number, string> = {
    1: 'Yeni başlangıçlar ve liderlik',
    2: 'Uyum, sabır ve işbirliği',
    3: 'İfade, yaratıcılık ve iletişim',
    4: 'Düzen, emek ve sağlam temel',
    5: 'Değişim, özgürlük ve hareket',
    6: 'Sorumluluk, sevgi ve denge',
    7: 'Analiz, içe dönüş ve arayış',
    8: 'Güç, sonuç ve maddi dünya',
    9: 'Tamamlama, fazlalık bırakmama',
    11: 'Sezgi ve ilham (master sayı)',
    22: 'Büyük yapı kurma gücü (master sayı)',
    33: 'Şefkat ve rehberlik (master sayı)',
  };
  return map[n] ?? `${n} enerjisi`;
}
