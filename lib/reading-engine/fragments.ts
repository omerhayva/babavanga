/**
 * Yorum parçası (fragment) seçici.
 *
 * Parçalar; bölüm, kategori ve koşul etiketlerine göre filtrelenir,
 * oturum seed'ine bağlı RNG ile seçilir. Aynı oturumda aynı sonuç,
 * yeni oturumda (yeni seed) farklı ama tutarlı birleşim.
 */
import type { Fragment, FragmentSection } from '@/lib/types/models';
import { pickMany } from '@/lib/random/seed';

export interface FragmentContext {
  category: string;
  activeTags: Set<string>;
  used: Set<string>;
}

function matchesCategory(f: Fragment, category: string): boolean {
  return !f.categories || f.categories.length === 0 || f.categories.includes(category);
}

function matchesTags(f: Fragment, activeTags: Set<string>): boolean {
  if (!f.tags || f.tags.length === 0) return true;
  return f.tags.some((t) => activeTags.has(t));
}

function relevance(f: Fragment, category: string, activeTags: Set<string>): number {
  let score = 0;
  if (f.categories && f.categories.includes(category)) score += 2;
  if (f.tags && f.tags.length > 0) {
    const hit = f.tags.some((t) => activeTags.has(t));
    if (hit) score += 2; // koşullu parçalar daha spesifik → daha değerli
  }
  return score;
}

export function selectFragments(
  all: Fragment[],
  section: FragmentSection,
  ctx: FragmentContext,
  count: number,
  rng: () => number,
): Fragment[] {
  const available = all.filter(
    (f) =>
      f.section === section &&
      !ctx.used.has(f.id) &&
      matchesCategory(f, ctx.category) &&
      matchesTags(f, ctx.activeTags),
  );
  if (available.length === 0) {
    // koşulsuz genel havuza düş
    const general = all.filter(
      (f) => f.section === section && !ctx.used.has(f.id) && matchesCategory(f, ctx.category),
    );
    if (general.length === 0) return [];
    const chosen = pickMany(general, count, rng);
    chosen.forEach((f) => ctx.used.add(f.id));
    return chosen;
  }

  // en yüksek relevancy'li huzmeden seç; yetersizse aşağı in
  const tiers = new Map<number, Fragment[]>();
  for (const f of available) {
    const r = relevance(f, ctx.category, ctx.activeTags);
    const arr = tiers.get(r) ?? [];
    arr.push(f);
    tiers.set(r, arr);
  }
  const ordered = [...tiers.entries()].sort((a, b) => b[0] - a[0]).flatMap(([, arr]) => arr);

  const chosen: Fragment[] = [];
  // üst %60'tan seçim yap, çeşitlilik için shuffle'lı
  const head = ordered.slice(0, Math.max(count * 3, Math.ceil(ordered.length * 0.6)));
  for (const f of pickMany(head, count, rng)) {
    chosen.push(f);
    ctx.used.add(f.id);
  }
  if (chosen.length < count) {
    for (const f of ordered) {
      if (chosen.length >= count) break;
      if (!ctx.used.has(f.id)) {
        chosen.push(f);
        ctx.used.add(f.id);
      }
    }
  }
  return chosen;
}

/** Aktif koşul etiketlerini skorlardan üretir */
import type { ReadingScoreSet } from '@/lib/types/models';
import { SCORE_KEYS } from '@/lib/types/models';

export function deriveActiveTags(
  scores: ReadingScoreSet,
  extras: string[],
): Set<string> {
  const tags = new Set<string>();
  for (const k of SCORE_KEYS) {
    if (scores[k] >= 62) tags.add(`${k}-high`);
    if (scores[k] <= 38) tags.add(`${k}-low`);
  }
  for (const e of extras) tags.add(e);
  return tags;
}
