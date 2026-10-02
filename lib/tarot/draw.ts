/**
 * Tarot motoru: seeded çekiliş + kategoriye göre yorum seçimi.
 * Kart seçimi gerçek rastgelelikle yapılır (seed oturuma bağlıdır);
 * yorum ise kategori + yönelime göre deterministik seçilir.
 */
import type { TarotCardData, ReadingTarotCard } from '@/lib/types/models';
import { shuffle, makeRng } from '@/lib/random/seed';

export const SPREADS = {
  1: { count: 1, positions: ['Ana Tema'] as const, label: 'Tek Kart — Sorunun özü' },
  3: { count: 3, positions: ['Geçmiş', 'Şimdi', 'Olası Yön'] as const, label: 'Üç Kart — Geçmiş → Şimdi → Olası Yön' },
  5: { count: 5, positions: ['Geçmiş', 'Şimdi', 'Gizli Etken', 'Tavsiye', 'Olası Yön'] as const, label: 'Beş Kart — Derin Açılım' },
} as const;

export type SpreadSize = keyof typeof SPREADS;

/** Kategori → kart yorum alanı eşlemesi */
export function meaningFieldForCategory(category: string): keyof TarotCardData {
  switch (category) {
    case 'love':
    case 'relationship':
    case 'marriage':
      return 'love';
    case 'money':
      return 'money';
    case 'career':
    case 'job':
      return 'career';
    case 'future':
      return 'future';
    default:
      return 'upright';
  }
}

export interface DrawnCard {
  card: TarotCardData;
  reversed: boolean;
  position: string;
}

/**
 * Kullanıcının seçtiği kapalı kart pozisyonları (slots) destedeki
 * karıştırılmış sırayla eşleşir. Deste, oturum seed'i ile karıştırılır;
 * aynı oturumda sonuç yeniden üretilebilir.
 */
export function drawSpread(
  deck: TarotCardData[],
  seed: number,
  pickedSlots: number[],
  spreadSize: SpreadSize,
): DrawnCard[] {
  const spec = SPREADS[spreadSize];
  const rng = makeRng(seed);
  const mixed = shuffle(deck, rng);
  const out: DrawnCard[] = [];
  for (let i = 0; i < spec.count; i++) {
    const slot = pickedSlots[i] ?? i;
    const card = mixed[slot % mixed.length];
    const reversed = rng() < 0.42;
    out.push({ card, reversed, position: spec.positions[i] });
  }
  return out;
}

/** Okuma ekranı için: kategori bazlı anlam seçimi (deterministik) */
export function cardMeaningForReading(drawn: DrawnCard, category: string): string {
  const field = meaningFieldForCategory(category);
  const base = String(drawn.card[field] ?? drawn.card.upright);
  if (drawn.reversed) {
    return `${base} Bu kart ters geldi: ${drawn.card.reversed}`;
  }
  return base;
}

export function toReadingCards(drawn: DrawnCard[], category: string): ReadingTarotCard[] {
  return drawn.map((d) => ({
    id: d.card.id,
    name: d.card.name,
    nameTr: d.card.nameTr,
    glyph: d.card.glyph,
    position: d.position,
    reversed: d.reversed,
    meaning: cardMeaningForReading(d, category),
    keywords: d.card.keywords.slice(0, 4),
  }));
}

/** Zamanlama etiketi → sayısal ağırlık (yakın = 3, uzak = 0) */
export function timingWeight(timing: string): number {
  if (timing.includes('Yakın')) return 3;
  if (timing.includes('1-3')) return 2;
  if (timing.includes('3-6')) return 1;
  return 0;
}
