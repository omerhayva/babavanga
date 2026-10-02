/**
 * Seedli (deterministic) rastgelelik.
 * Aynı seed → aynı sonuç. "Kontrollü rastgelelik" buradan gelir.
 */

/** FNV-1a tabanlı 32-bit string hash */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // avalanche
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Çok parçalı seed: userId + questionId + session gibi değerlerden */
export function seedFrom(...parts: Array<string | number>): number {
  return hashString(parts.map((p) => String(p)).join('|'));
}

/** Mulberry32 PRNG — hızlı, kaliteli, deterministik */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seedli rastgele tek eleman seçimi */
export function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/** Tekrarsız çoklu seçim (kombinasyon) */
export function pickMany<T>(arr: readonly T[], n: number, rng: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  const count = Math.min(n, copy.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

/** Seedli Fisher-Yates karıştırma */
export function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 0-1 float → min-max tam sayı */
export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
