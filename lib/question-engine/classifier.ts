/**
 * Soru sınıflandırıcı: kullanıcının serbest metin sorusunu kategoriye bağlar.
 * Tamamen keyword + ağırlık tabanlı, deterministik.
 */
import type { QuestionCategoryDef } from '@/lib/types/models';

export function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[''`]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Anahtar kelime eşleşmesi:
 *  - Tam/öneki kelime öbeği ("geri döner mi" ya da ek almış "mülakata girdim" → "mülakat") → ×3
 *  - Kök eşleşmesi (serbest metin içinde "sevgili"nin "sevgilimden" içinde geçmesi) → ×1
 * Türkçe ek uyumunu tolere etmek için öbek eşleşmesinde kelime başlangıcı yeterlidir;
 * 3 harften kısa anahtar kelimelerde tam eşleşme gerekir ("ev" → "evrensel" tuzağı).
 */
function countMatches(normalized: string, keyword: string): number {
  const kw = normalizeTr(keyword);
  if (!kw) return 0;
  const words = normalized.split(' ');
  const kwWords = kw.split(' ');
  const wordMatches = (word: string, target: string): boolean =>
    word === target || (target.length >= 4 && word.startsWith(target));
  // tam öbek eşleşmesi
  let phrase = 0;
  for (let i = 0; i + kwWords.length <= words.length; i++) {
    let ok = true;
    for (let j = 0; j < kwWords.length; j++) {
      if (!wordMatches(words[i + j], kwWords[j])) { ok = false; break; }
    }
    if (ok) phrase++;
  }
  if (phrase > 0) return phrase * 3;
  // kök eşleşmesi
  let count = 0;
  let idx = normalized.indexOf(kw);
  while (idx !== -1) {
    count++;
    idx = normalized.indexOf(kw, idx + kw.length);
  }
  return count;
}

export interface ClassificationResult {
  category: string;
  scores: Array<{ id: string; score: number }>;
  decidedBy: 'keyword' | 'fallback';
}

export function classifyQuestion(
  text: string,
  categories: QuestionCategoryDef[],
): ClassificationResult {
  const normalized = normalizeTr(text);
  const scores = categories.map((c) => {
    let score = 0;
    for (const kw of c.keywords) {
      score += countMatches(normalized, kw);
    }
    return { id: c.id, score };
  });

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  // zayıf sinyal: phrase düzeyinde eşleşme yok (<3) → genel akış
  if (!top || top.score < 3) {
    return { category: 'general', scores, decidedBy: 'fallback' };
  }
  return { category: top.id, scores, decidedBy: 'keyword' };
}

/**
 * Hassas konu tespiti: sağlık, ölüm, hukuk, finansal yatırım, suç,
 * kendine zarar verme. Bu konularda kesin yönlendirme yapılmaz; ek uyarı
 * ve uzman desteği yönlendirmesi eklenir.
 */
const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; note: string }> = [
  {
    pattern: /(intihar|kendime zarar|kendimi ?öldür|ölümü istiy|canıma kıy)/i,
    note: 'Bu tarz düşünceler tek başına taşınmamalı. Lütfen bir ruh sağlığı uzmanına veya güvenebileceğin bir yakınına ulaş; Türkiye\'de 182 no\'lu MHRS hattı ve acil durumlarda 112 hizmete açık.',
  },
  {
    pattern: /(kanser|hastalık|teşhis|ameliyat|doktor|sağlığım|hastayım|ilaç)/i,
    note: 'Sağlık konularında yorumumuz yönlendirici değildir; tıbbi kararlar için mutlaka hekiminin görüşü esas alınmalı.',
  },
  {
    pattern: /(dava|avukat|mahkeme|tazminat|hukuki|savcı|icra)/i,
    note: 'Hukuki süreçlerde bu içerik tavsiye niteliği taşımaz; konunun uzmanı bir avukata danışmak esas olmalı.',
  },
  {
    pattern: /(yatırım|borsa|kripto|coin|forex|altın al|borç para|kredi çek|faiz)/i,
    note: 'Yatırım ve borçlanma kararlarında bu içerik finansal tavsiye değildir; maddi kararları kendi araştırman ve gerektiğinde lisanslı bir danışmanla değerlendirmelisin.',
  },
  {
    pattern: /(suç|cezaevi|polis|şikayet eder|gasp|hırsız|dolandır)/i,
    note: 'Hukuki boyut taşıyan konularda bu içerik yönlendirme değildir; resmi merciler ve avukat desteği esas alınmalı.',
  },
];

export function detectSensitive(text: string): { sensitive: boolean; notes: string[] } {
  const notes: string[] = [];
  for (const p of SENSITIVE_PATTERNS) {
    if (p.pattern.test(normalizeTr(text).replace(/\s+/g, ' ')) || p.pattern.test(text)) {
      notes.push(p.note);
    }
  }
  // pattern normalize edilmiş metinde de denenmeli (Türkçe karakter bozulmasın diye normalize edilmemiş halde bırak)
  return { sensitive: notes.length > 0, notes };
}
