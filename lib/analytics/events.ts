/**
 * Anonim analytics: kişisel veri toplamaz; sadece olay tipi + zaman + kaba meta.
 * Olaylar storage içinde tutulur, admin panelde özetlenir.
 */
import { store, newId } from '@/lib/db/store';
import type { AnalyticsEvent } from '@/lib/types/models';

export const ANALYTICS_EVENT_TYPES = [
  'homepage_view',
  'question_started',
  'question_submitted',
  'reading_started',
  'answer_given',
  'symbol_chosen',
  'tarot_drawn',
  'reading_completed',
  'premium_clicked',
  'checkout_started',
  'purchase_completed',
  'account_registered',
  'account_login',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

const MAX_META_VALUES = 8;

export async function trackEvent(
  type: string,
  meta?: Record<string, string | number | boolean>,
): Promise<void> {
  if (!ANALYTICS_EVENT_TYPES.includes(type as AnalyticsEventType)) return;
  // meta'yı küçült ve kişiselleştirilebilir alanları düşür
  const safeMeta: Record<string, string | number | boolean> = {};
  if (meta) {
    for (const [k, v] of Object.entries(meta).slice(0, MAX_META_VALUES)) {
      if (typeof v === 'string' && v.length > 60) continue; // serbest metin taşıma
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        safeMeta[k] = v;
      }
    }
  }
  await store.insert<AnalyticsEvent>('analytics', {
    id: newId('ev'), type, at: Date.now(), meta: safeMeta,
  });
}

export function summarizeEvents(): {
  totals: Record<string, number>;
  last24h: Record<string, number>;
  recent: AnalyticsEvent[];
  completionRate: number;
} {
  const events = store.all<AnalyticsEvent>('analytics');
  const totals: Record<string, number> = {};
  const last24h: Record<string, number> = {};
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  for (const e of events) {
    totals[e.type] = (totals[e.type] ?? 0) + 1;
    if (e.at >= dayAgo) last24h[e.type] = (last24h[e.type] ?? 0) + 1;
  }
  const started = totals['question_started'] ?? 0;
  const completed = totals['reading_completed'] ?? 0;
  return {
    totals,
    last24h,
    recent: events.slice(-60).reverse(),
    completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
  };
}
