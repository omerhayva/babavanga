/**
 * Baba Vanga — Veri Modelleri
 * Tüm platformun paylaştığı temel tipler. Hiçbir yerde AI/LLM yoktur;
 * her yapı deterministik kurallar tarafından üretilir.
 */

// ---------------------------------------------------------------- Skorlar

export type ScoreKey =
  | 'change'      // değişim isteği / hareket
  | 'risk'        // risk seviyesi
  | 'opportunity' // fırsat algısı
  | 'confidence'  // özgüven / netlik
  | 'relationship'// ilişki/ bağ etkisi
  | 'money'       // maddi odak
  | 'career'      // kariyer/iş odak
  | 'patience'    // sabır / bekleyiş
  | 'urgency'     // aciliyet
  | 'hope';       // umut / iyimserlik

export type ScoreMap = Partial<Record<ScoreKey, number>>;

export const SCORE_KEYS: ScoreKey[] = [
  'change', 'risk', 'opportunity', 'confidence',
  'relationship', 'money', 'career', 'patience', 'urgency', 'hope',
];

export const SCORE_LABELS: Record<ScoreKey, string> = {
  change: 'Değişim Enerjisi',
  risk: 'Risk Seviyesi',
  opportunity: 'Fırsat Alanı',
  confidence: 'Netlik ve Özgüven',
  relationship: 'Bağ ve İlişki',
  money: 'Maddi Odak',
  career: 'Kariyer Odak',
  patience: 'Sabır ve Bekleyiş',
  urgency: 'Aciliyet',
  hope: 'Umut ve İyimserlik',
};

// ---------------------------------------------------------------- Sorular

export interface QuestionOption {
  /** Makine değeri (kısa, ascii) */
  value: string;
  /** Kullanıcının gördüğü etiket */
  label: string;
  /** Bu seçeneğin skor katkıları */
  scores?: ScoreMap;
  /** Bu seçenek seçilirse atlanacak soru id'si (conditional branching) */
  next?: string;
  /** Opsiyonel glif */
  glyph?: string;
}

export interface QuestionCondition {
  /** Koşul referans sorusu (skor koşullarında opsiyonel) */
  questionId?: string;
  /** Cevap bu değerlerden biriyse */
  in?: string[];
  /** Cevap bu değerlerden biri DEĞİLSE */
  notIn?: string[];
  /** Skor eşiği: scoreKey >= minScore ise */
  scoreKey?: ScoreKey;
  minScore?: number;
  maxScore?: number;
  /** Koşul sağlanınca gidilecek soru */
  next: string;
}

export type QuestionType = 'single' | 'multi' | 'scale' | 'number';

export interface Question {
  id: string;
  category: string;
  text: string;
  helperText?: string;
  type: QuestionType;
  options: QuestionOption[];
  /** Koşullu dallanma kuralları (yukarıdan aşağı değerlendirilir) */
  conditions?: QuestionCondition[];
  /** Varsayılan sonraki soru id'si */
  nextQuestion?: string;
  /** 1-5 arası skor ağırlığı */
  weight: number;
  tags: string[];
  /** Soru cevaplandığında sabit eklenen skorlar */
  scoring?: ScoreMap;
  required: boolean;
  order: number;
  /** core: kategori giriş ağacı, depth: derin dal, generic: adaptif yedek havuz */
  stage?: 'core' | 'depth' | 'generic';
  /** multi için alt/üst sınır */
  minSelected?: number;
  maxSelected?: number;
  /** scale için uç etiketleri */
  scaleLabels?: [string, string];
}

export interface QuestionCategoryDef {
  id: string;
  name: string;
  description: string;
  glyph: string;
  keywords: string[];
}

// ---------------------------------------------------------------- Tarot

export interface TarotCardData {
  id: number;          // 0-21
  name: string;        // İngilizce geleneksel ad
  nameTr: string;      // Türkçe ad
  glyph: string;       // kart amblemi (unicode)
  keywords: string[];
  upright: string;
  reversed: string;
  love: string;
  money: string;
  career: string;
  future: string;
  warning: string;
  opportunity: string;
  timing: string;      // "Yakın dönem" | "1-3 ay" | "3-6 ay" | "6+ ay"
  /** Kartın skor motoruna deterministik katkısı */
  scores?: ScoreMap;
}

// ---------------------------------------------------------------- Numeroloji

export interface NumerologyNumberData {
  themes: string[];
  positive: string[];
  negative: string[];
  love: string[];
  money: string[];
  career: string[];
}

/** Türkçe karakterleri destekleyen harf → sayı haritası (configurable) */
export type NumerologyLetterMap = Record<string, number>;

// ---------------------------------------------------------------- Semboller

export interface SymbolData {
  id: string;
  name: string;
  glyph: string;
  general: string;
  love: string;
  money: string;
  career: string;
  /** Sembolün skor motoruna katkısı */
  scores?: ScoreMap;
}

// ---------------------------------------------------------------- Yorum parçaları

export type FragmentSection =
  | 'opening' | 'situation' | 'hidden' | 'energy' | 'influence'
  | 'possibility' | 'opportunity' | 'warning' | 'timing' | 'closing';

export interface Fragment {
  id: string;
  section: FragmentSection;
  /** Boş / yoksa tüm kategoriler */
  categories?: string[];
  /** Koşul etiketleri: "risk-high", "change-high", "love" gibi */
  tags?: string[];
  text: string;
}

// ---------------------------------------------------------------- Oturum

export interface SessionProfile {
  name?: string;
  birthDate?: string;   // YYYY-MM-DD
  birthTime?: string;   // HH:MM
  birthPlace?: string;
}

export interface SessionAnswer {
  questionId: string;
  value: string | number | string[];
  optionValues: string[];
  at: number;
}

export type SessionStatus = 'profile' | 'questions' | 'symbols' | 'tarot' | 'complete';

export interface QuestionSession {
  id: string;
  ownerId: string;            // "user:<id>" | "guest:<uuid>"
  question: string;
  category: string;
  categorySource: 'auto' | 'user';
  seed: number;
  profile: SessionProfile;
  answers: SessionAnswer[];
  askedIds: string[];
  symbols: string[];
  spread?: 1 | 3 | 5;
  pickedCardSlots: number[];
  status: SessionStatus;
  currentQuestionId?: string;
  readingId?: string;
  startedAt: number;
  completedAt?: number;
  questionTime: string;       // ISO tarih
}

// ---------------------------------------------------------------- Okuma (Reading)

export type ReadingScoreSet = Record<ScoreKey, number>; // 0-100

export interface ReadingTarotCard {
  id: number;
  name: string;
  nameTr: string;
  glyph: string;
  position: string;      // "Geçmiş" | "Şimdi" | "Olası Yön" | "Ana Tema" ...
  reversed: boolean;
  meaning: string;       // kategoriye göre seçilmiş yorum
  keywords: string[];
}

export interface ReadingNumerology {
  lifePath?: number;
  destiny?: number;
  soul?: number;
  personality?: number;
  birthday?: number;
  personalYear?: number;
  personalMonth?: number;
  personalDay?: number;
  nameTotal?: number;
  vowelTotal?: number;
  consonantTotal?: number;
  notes: string[];       // seçilmiş yorum parçaları
}

export interface ReadingAstrology {
  sunSign: string;
  sunDateRange: string;
  element: string;
  elementTr: string;
  quality: string;
  qualityTr: string;
  moonSign?: string;     // yaklaşık
  moonApproximate: boolean;
  note: string;
}

export interface ReadingSymbolPick {
  id: string;
  name: string;
  glyph: string;
  meaning: string;
}

export interface ReadingData {
  essence: string[];               // SORUNUN ÖZÜ
  energy: { label: string; body: string[] };   // ŞU ANDAKİ ENERJİ
  influence: { label: string; body: string[] };// GÜÇLÜ ETKİ
  possibility: string[];           // ÖNÜNDEKİ OLASILIK
  attention: string[];             // DİKKAT
  opportunity: string[];           // FIRSAT
  timing: { label: string; body: string[] };   // ZAMANLAMA
  closing: string[];
  scores: ReadingScoreSet;
  tarot: ReadingTarotCard[];
  numerology: ReadingNumerology | null;
  astrology: ReadingAstrology | null;
  symbols: ReadingSymbolPick[];
  themeTags: string[];
  fragmentIds: string[];           // yeniden üretilebilirlik / audit
}

export interface Reading {
  id: string;
  sessionId: string;
  ownerId: string;
  question: string;
  category: string;
  createdAt: number;
  paid: boolean;            // mock premium kilidi
  sensitive: boolean;       // hassas konu tespiti
  data: ReadingData;
}

// ---------------------------------------------------------------- Kullanıcı / Monetization

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  premiumUntil?: number;
}

export interface Payment {
  id: string;
  ownerId: string;
  readingId?: string;
  plan: 'report' | 'monthly' | 'yearly';
  amount: number;           // kuruş
  currency: 'TRY';
  status: 'mock-completed'; // gerçek sağlayıcı ekleneğinde: 'pending' | 'completed' | 'failed'
  createdAt: number;
  /** İleride gerçek ödeme sağlayıcısı (iyzico/stripe) buraya referans koyacak */
  provider: 'mock';
  providerRef?: string;
}

export interface Subscription {
  id: string;
  ownerId: string;
  plan: 'monthly' | 'yearly';
  active: boolean;
  startsAt: number;
  expiresAt: number;
  paymentId: string;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  at: number;
  meta?: Record<string, string | number | boolean>;
}

/** Admin override modeli: /data içeriklerinin üstüne yazılır */
export interface ContentOverrides {
  questions: { upserts: Question[]; deletedIds: string[] };
  fragments: { upserts: Fragment[]; deletedIds: string[] };
  categories: { upserts: QuestionCategoryDef[]; deletedIds: string[] };
  tarot: Record<string, Partial<TarotCardData>>;
  numerology: Record<string, NumerologyNumberData>;
  symbols: Record<string, Partial<SymbolData>>;
}
