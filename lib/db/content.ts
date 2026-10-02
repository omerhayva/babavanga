/**
 * İçerik yükleme katmanı.
 *
 * `/data` altındaki dosyalar varsayılan içeriktir (git ile versiyonlanır).
 * Admin paneli, `storage/content-overrides.json` içine override yazar;
 * bu katman ikisini birleştirir. Böylece kod değişikliği yapılmadan
 * soru / kart / yorum parçası eklenebilir, düzenlenebilir, silinebilir.
 */
import type {
  Question, QuestionCategoryDef, Fragment, TarotCardData,
  NumerologyNumberData, SymbolData, ContentOverrides,
} from '@/lib/types/models';
import { store } from '@/lib/db/store';

import defaultQuestionsCore from '@/data/questions/questions-core.json';
import defaultQuestionsMore from '@/data/questions/questions-more.json';
import defaultQuestionsGeneric from '@/data/questions/questions-generic.json';
import defaultCategories from '@/data/questions/categories.json';
import defaultTarot from '@/data/tarot/major-arcana.json';
import defaultNumerology from '@/data/numerology/numbers.json';
import defaultSymbols from '@/data/symbols/symbols.json';
import fragmentsOpening from '@/data/interpretations/opening.json';
import fragmentsMiddle from '@/data/interpretations/middle.json';
import fragmentsEnding from '@/data/interpretations/ending.json';

const EMPTY_OVERRIDES: ContentOverrides = {
  questions: { upserts: [], deletedIds: [] },
  fragments: { upserts: [], deletedIds: [] },
  categories: { upserts: [], deletedIds: [] },
  tarot: {},
  numerology: {},
  symbols: {},
};

let cachedOverrides: { mtime: number; value: ContentOverrides } | null = null;

export function getOverrides(): ContentOverrides {
  const rows = store.all<{ id: string; value: ContentOverrides }>('content-overrides');
  // override'lar tek satır olarak saklanır
  if (rows.length === 0) return EMPTY_OVERRIDES;
  return { ...EMPTY_OVERRIDES, ...rows[0].value };
}

export function saveOverrides(next: ContentOverrides): Promise<void> {
  return (async () => {
    await store.upsert('content-overrides', { id: 'singleton', value: next });
    cachedOverrides = null;
  })();
}

function mergeList<T extends { id: string }>(
  defaults: T[], ov: { upserts: T[]; deletedIds: string[] },
): T[] {
  const byId = new Map<string, T>();
  for (const d of defaults) byId.set(d.id, d);
  for (const u of ov.upserts) byId.set(u.id, { ...(byId.get(u.id) ?? ({} as T)), ...u });
  for (const del of ov.deletedIds) byId.delete(del);
  return [...byId.values()];
}

// -------------------------------------------------------------- Erişimciler

const DEFAULT_QUESTIONS = [
  ...(defaultQuestionsCore as unknown as Question[]),
  ...(defaultQuestionsMore as unknown as Question[]),
  ...(defaultQuestionsGeneric as unknown as Question[]),
];

export function getQuestions(): Question[] {
  return mergeList(DEFAULT_QUESTIONS, getOverrides().questions)
    .sort((a, b) => (a.order - b.order) || a.id.localeCompare(b.id));
}

export function getQuestion(id: string): Question | undefined {
  return getQuestions().find((q) => q.id === id);
}

export function getCategories(): QuestionCategoryDef[] {
  return mergeList(defaultCategories as unknown as QuestionCategoryDef[], getOverrides().categories)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

export function getCategory(id: string): QuestionCategoryDef | undefined {
  return getCategories().find((c) => c.id === id);
}

export function getTarotDeck(): TarotCardData[] {
  const ov = getOverrides().tarot;
  return (defaultTarot as unknown as TarotCardData[]).map((c) =>
    ov[String(c.id)] ? { ...c, ...ov[String(c.id)] } : c,
  );
}

export function getNumerologyData(): Record<string, NumerologyNumberData> {
  return { ...(defaultNumerology as Record<string, NumerologyNumberData>), ...getOverrides().numerology };
}

export function getSymbols(): SymbolData[] {
  const ov = getOverrides().symbols;
  return (defaultSymbols as unknown as SymbolData[]).map((s) =>
    ov[s.id] ? { ...s, ...ov[s.id] } : s,
  );
}

export function getSymbol(id: string): SymbolData | undefined {
  return getSymbols().find((s) => s.id === id);
}

const DEFAULT_FRAGMENTS: Fragment[] = [
  ...(fragmentsOpening as unknown as Fragment[]),
  ...(fragmentsMiddle as unknown as Fragment[]),
  ...(fragmentsEnding as unknown as Fragment[]),
];

export function getFragments(): Fragment[] {
  return mergeList(DEFAULT_FRAGMENTS, getOverrides().fragments);
}

export function getFragmentsBySection(section: Fragment['section']): Fragment[] {
  return getFragments().filter((f) => f.section === section);
}
