'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLANS = [
  {
    id: 'report' as const,
    name: 'Tek Detaylı Rapor',
    price: '₺49',
    period: 'tek seferlik',
    features: [
      'Bir soru için tam detaylı rapor',
      'Güçlü Etki + Olasılık + Dikkat + Fırsat',
      'Kartların tam anlamları',
      'Numeroloji + astroloji panelleri',
      'Enerji haritası (10 eksen)',
    ],
  },
  {
    id: 'monthly' as const,
    name: 'Aylık Premium',
    price: '₺79',
    period: 'aylık',
    highlight: true,
    features: [
      'Sınırsız detaylı rapor',
      '5 kart derin açılım',
      'Tüm paneller + enerji haritası',
      'Geçmiş yorumlara sınırsız erişim',
      'Öncelikli yeni özellik erişimi',
    ],
  },
  {
    id: 'yearly' as const,
    name: 'Yıllık Premium',
    price: '₺499',
    period: 'yıllık',
    features: [
      "Aylık planın tüm özellikleri",
      '2 ay bedava',
      'Tüm özel açılımlar',
      'Sezonluk kişisel rapor',
    ],
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function checkout(plan: string) {
    if (busy) return;
    setBusy(plan);
    setMessage(null);
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'premium_clicked', plan }),
      }).catch(() => undefined);

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ödeme başlatılamadı.');
      setMessage('✦ Ödeme (simülasyon) tamamlandı! Planın aktif.');
      if (data.readingId) router.push(`/result/${data.readingId}`);
      else router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Bir hata oluştu.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="font-display text-[11px] tracking-widest2 text-gold/70">PREMIUM</p>
        <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">
          Yorumun <span className="text-gold">tamamını</span> aç
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ash">
          Ücretsiz katman her zaman var. Premium; tüm bölümleri, kart anlamlarını,
          panelleri ve derin açılımları açar.
        </p>
        <p className="mx-auto mt-2 text-xs text-gold/70">
          Bu sürümde ödeme simülasyondur — kart bilgisi istenmez.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`card-hover relative rounded-2xl border p-6 ${
              p.highlight
                ? 'border-gold/60 bg-gradient-to-b from-gold/10 to-veil/60 shadow-gold-glow'
                : 'border-gold/15 bg-veil/40'
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-gold/60 bg-night px-3 py-0.5 text-[10px] tracking-widest text-gold">
                EN POPÜLER
              </span>
            )}
            <h2 className="font-display text-lg text-mist">{p.name}</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-3xl text-gold-pale">{p.price}</span>
              <span className="text-xs text-ash/70">/ {p.period}</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-ash">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-gold/70">✦</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => checkout(p.id)}
              disabled={busy !== null}
              className={`mt-6 w-full rounded-xl px-5 py-3 font-display text-sm tracking-[0.16em] transition-all disabled:opacity-50 ${
                p.highlight
                  ? 'border border-gold/70 bg-gradient-to-b from-gold/30 to-gold/5 text-gold-pale'
                  : 'border border-gold/40 text-gold-pale/90 hover:bg-gold/5'
              }`}
            >
              {busy === p.id ? 'İŞLENİYOR…' : p.id === 'report' ? 'RAPOR SATIN AL' : 'ÜYE OL'}
            </button>
          </div>
        ))}
      </div>

      {message && (
        <p className="mt-8 text-center text-sm text-gold-pale">{message}</p>
      )}

      <div className="mt-12 rounded-2xl border border-amethyst/25 bg-veil/30 p-6 text-sm leading-relaxed text-ash">
        <h3 className="font-display text-base text-amethyst-soft">Şeffaflık notu</h3>
        <p className="mt-2">
          Bu bir demo ürünüdür: ödeme adımı mock sağlayıcı ile çalışır ve
          altyapı (Payment/Subscription modelleri) gerçek bir ödeme sağlayıcısı
          eklendiğinde aynı akışla devreye girer. Sonuçların doğruluğu satın
          alım ile değişmez; premium yalnızca yorumun tamamını gösterir.
        </p>
      </div>
    </div>
  );
}
