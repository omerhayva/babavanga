'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UnlockReportButton({ readingId }: { readingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'premium_clicked', plan: 'report' }),
      }).catch(() => undefined);

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'report', readingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ödeme başlatılamadı.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={unlock}
        disabled={busy}
        className="w-full rounded-xl border border-gold/70 bg-gradient-to-b from-gold/30 to-gold/5 px-6 py-4 font-display text-sm tracking-[0.2em] text-gold-pale transition-all hover:shadow-[0_0_32px_-6px_rgba(212,175,55,0.7)] disabled:opacity-50"
      >
        {busy ? 'İŞLENİYOR…' : 'DETAYLI RAPORU AÇ — ₺49'}
      </button>
      <p className="mt-2 text-center text-[11px] text-ash/60">
        Demo modu: ödeme simülasyonla tamamlanır, kart bilgisi istenmez.
      </p>
      {error && <p className="mt-2 text-center text-xs text-red-300">{error}</p>}
    </div>
  );
}

export function TrackView({ type, meta }: { type: string; meta?: Record<string, string | number> }) {
  if (typeof window !== 'undefined') {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...(meta ? { meta } : {}) }),
    }).catch(() => undefined);
  }
  return null;
}
