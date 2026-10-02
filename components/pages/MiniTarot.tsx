'use client';

import { useState } from 'react';

interface Card {
  id: number; name: string; nameTr: string; glyph: string;
  position: string; reversed: boolean; meaning: string; keywords: string[];
}

export default function MiniTarot() {
  const [spread, setSpread] = useState<1 | 3>(3);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function draw() {
    if (busy) return;
    setBusy(true);
    setCards(null);
    try {
      const res = await fetch('/api/tarot/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spread }),
      });
      const data = await res.json();
      if (res.ok) {
        // kısa bir gecikme: kart çevirme hissi (yalnızca animasyon)
        setTimeout(() => setCards(data.cards), 900);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex justify-center gap-3">
        {([1, 3] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setSpread(s); setCards(null); }}
            className={`rounded-xl border px-5 py-2.5 text-sm transition-colors ${
              spread === s
                ? 'border-gold/70 bg-gold/10 text-gold-pale'
                : 'border-gold/20 text-ash hover:border-gold/40'
            }`}
          >
            {s === 1 ? 'Tek Kart' : 'Üç Kart — Geçmiş · Şimdi · Olası Yön'}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {busy && (
          <div className="grid place-items-center py-10">
            <div className="h-20 w-14 animate-spin-slow rounded-lg border border-gold/40 bg-gradient-to-b from-veil to-night" />
            <p className="shimmer-text mt-6 font-display text-lg">Deste karıştırılıyor…</p>
          </div>
        )}
        {!busy && !cards && (
          <div className="grid place-items-center py-10">
            <button
              onClick={draw}
              className="rounded-2xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-10 py-4 font-display text-sm tracking-[0.2em] text-gold-pale transition-all hover:shadow-[0_0_32px_-6px_rgba(212,175,55,0.6)]"
            >
              KARTLARI ÇEK
            </button>
          </div>
        )}
        {cards && (
          <div className="animate-fade-up grid gap-4 sm:grid-cols-3">
            {cards.map((c) => (
              <div key={c.id} className="rounded-2xl border border-gold/25 bg-veil/60 p-5 text-center">
                <p className="text-[10px] tracking-widest text-ash/70">{c.position.toUpperCase()}</p>
                <div className={`my-4 text-5xl ${c.reversed ? 'rotate-180' : ''}`}>{c.glyph}</div>
                <p className="font-display text-lg text-mist">{c.nameTr}</p>
                <p className="text-[11px] text-ash/70">{c.name}{c.reversed ? ' · Ters' : ''}</p>
                <div className="my-3 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                <p className="text-xs leading-relaxed text-ash">{c.meaning}</p>
                <p className="mt-2 text-[10px] text-gold/60">{c.keywords.join(' · ')}</p>
              </div>
            ))}
            <div className="sm:col-span-3">
              <button
                onClick={draw}
                className="mt-2 w-full rounded-xl border border-amethyst/30 px-6 py-3 text-sm text-amethyst-soft transition-colors hover:bg-amethyst/10"
              >
                Yeniden çek
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
