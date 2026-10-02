'use client';

import { useState } from 'react';

interface CalcResult {
  numerology: {
    lifePath: number; destiny?: number; soul?: number; personality?: number;
    birthday: number; personalYear: number; personalMonth: number; personalDay: number;
    name?: { rawTotal: number; nameNumber: number; vowelTotal: number; consonantTotal: number };
  };
  meanings: {
    lifePath: { headline: string; lines: string[] };
    personalYear: { headline: string; lines: string[] };
    name: { energy: string; numbers: { nameNumber: number; vowelTotal: number; consonantTotal: number; rawTotal: number } } | null;
  };
}

export default function NumerologyCalculator() {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function calc() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/numerology/calc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, birthDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Hesaplama başarısız.');
      setResult(data as CalcResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hesaplama başarısız.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="rounded-2xl border border-gold/20 bg-abyss/90 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-ash">Adın (opsiyonel — isim hesabı için)</label>
            <input
              className="field" placeholder="Örn: Aysel" value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))} maxLength={80}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-ash">Doğum tarihin</label>
            <input
              type="date" className="field" value={birthDate} min="1900-01-01" max="2100-12-31"
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={calc}
          disabled={busy || !birthDate}
          className="mt-5 w-full rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-6 py-3.5 font-display text-sm tracking-[0.18em] text-gold-pale transition-all hover:shadow-[0_0_28px_-6px_rgba(212,175,55,0.6)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'HESAPLANIYOR…' : 'SAYILARIMI HESAPLA'}
        </button>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>

      {result && (
        <div className="animate-fade-up mt-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              ['Yaşam Yolu', result.numerology.lifePath],
              ['Kader', result.numerology.destiny],
              ['Ruh', result.numerology.soul],
              ['Kişilik', result.numerology.personality],
              ['Doğum Günü', result.numerology.birthday],
              ['Kişisel Yıl', result.numerology.personalYear],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-gold/15 bg-veil/40 px-2 py-3 text-center">
                <p className="text-[9px] tracking-wider text-ash/70">{String(label).toUpperCase()}</p>
                <p className="mt-1 font-display text-2xl text-gold-pale">{value ?? '—'}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gold/15 bg-veil/50 p-5">
            <p className="font-display text-sm text-gold-pale">
              Yaşam Yolu {result.numerology.lifePath} — {result.meanings.lifePath.headline}
            </p>
            {result.meanings.lifePath.lines.map((l, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-ash">{l}</p>
            ))}
          </div>

          <div className="rounded-2xl border border-amethyst/20 bg-veil/40 p-5">
            <p className="font-display text-sm text-amethyst-soft">
              Kişisel Yıl {result.numerology.personalYear} — {result.meanings.personalYear.headline}
            </p>
            {result.meanings.personalYear.lines.map((l, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-ash">{l}</p>
            ))}
          </div>

          {result.meanings.name && (
            <div className="rounded-2xl border border-gold/15 bg-veil/50 p-5">
              <p className="font-display text-sm text-gold-pale">İsim Enerjisi</p>
              <p className="mt-2 text-sm leading-relaxed text-ash">{result.meanings.name.energy}.</p>
              <p className="mt-2 text-xs text-ash/70">
                İsim sayısı: {result.meanings.name.numbers.nameNumber} · Toplam: {result.meanings.name.numbers.rawTotal} ·
                Sesli: {result.meanings.name.numbers.vowelTotal} · Sessiz: {result.meanings.name.numbers.consonantTotal}
              </p>
              <p className="mt-2 text-xs text-ash/60">
                Kişisel ay: {result.numerology.personalMonth} · Kişisel gün: {result.numerology.personalDay}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
