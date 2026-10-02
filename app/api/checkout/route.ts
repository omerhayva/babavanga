/**
 * POST /api/checkout — MOCK ödeme akışı.
 *
 * Gerçek ödeme sağlayıcısı (iyzico/Stripe/PayTR) sonradan eklenebilir:
 * Payment kaydı `provider` + `providerRef` alanlarıyla buna hazır;
 * `status` alanı 'pending' → 'completed' yaşam döngüsünü destekler.
 * Şu an kayıtlar anında 'mock-completed' olarak işaretlenir.
 */
import { NextRequest } from 'next/server';
import { store, newId } from '@/lib/db/store';
import { resolveOwnerId as getOwnerId, getUserId, getCurrentUser } from '@/lib/auth/session';
import { cleanId } from '@/lib/security/validate';
import { trackEvent } from '@/lib/analytics/events';
import type { Payment, Subscription, Reading, User } from '@/lib/types/models';
import { ok, fail, handleError, guard } from '@/lib/api/helpers';

export const runtime = 'nodejs';

const PLANS: Record<string, { amount: number; label: string }> = {
  report: { amount: 4900, label: 'Tek Detaylı Rapor' },
  monthly: { amount: 7900, label: 'Aylık Premium' },
  yearly: { amount: 49900, label: 'Yıllık Premium' },
};

export async function POST(req: NextRequest) {
  try {
    const g = guard(req, 'checkout', 10, 10 * 60 * 1000);
    if (g) return g;

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const plan = cleanId(body.plan, 'plan');
    if (!PLANS[plan]) return fail('Geçersiz plan.', 400);
    const ownerId = getOwnerId();
    const uid = getUserId();

    let readingId: string | undefined;
    if (body.readingId) {
      readingId = cleanId(body.readingId, 'okuma');
      const reading = await store.get<Reading>('readings', readingId);
      if (!reading) return fail('Okuma bulunamadı.', 404);
      if (reading.ownerId !== ownerId) return fail('Bu okuma sana ait değil.', 403);
    }

    await trackEvent('checkout_started', { plan });

    if (plan === 'report' && !readingId) {
      return fail('Rapor satın almak için bir okuma seçmelisin.', 400);
    }
    if (plan !== 'report' && !uid) {
      return fail('Premium üyelik için hesabına giriş yapman gerekiyor.', 401);
    }

    // --- MOCK ödeme: burada gerçek sağlayıcı redirect/webhook süreci olacak ---
    const payment: Payment = {
      id: newId('pay'),
      ownerId,
      readingId,
      plan: plan as Payment['plan'],
      amount: PLANS[plan].amount,
      currency: 'TRY',
      status: 'mock-completed',
      createdAt: Date.now(),
      provider: 'mock',
      providerRef: `mock_${Date.now().toString(36)}`,
    };
    await store.insert('payments', payment);

    if (plan === 'report' && readingId) {
      await store.update<Reading>('readings', readingId, { paid: true });
    } else if (uid) {
      const now = Date.now();
      const duration = plan === 'monthly' ? 30 * 24 * 3600 * 1000 : 365 * 24 * 3600 * 1000;
      const user = getCurrentUser();
      const base = user?.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
      const expiresAt = base + duration;
      await store.update<User>('users', uid, { premiumUntil: expiresAt });
      const sub: Subscription = {
        id: newId('sub'),
        ownerId: `user:${uid}`,
        plan: plan as 'monthly' | 'yearly',
        active: true,
        startsAt: now,
        expiresAt,
        paymentId: payment.id,
      };
      await store.insert('subscriptions', sub);
    }

    await trackEvent('purchase_completed', { plan });
    return ok({ ok: true, paymentId: payment.id, plan, readingId, mock: true });
  } catch (err) {
    return handleError(err);
  }
}
