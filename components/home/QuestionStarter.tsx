'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QuestionStarter({ category }: { category?: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    const q = question.trim();
    if (q.length < 5) {
      setError('Sorunu biraz daha açar mısın? En az bir cümle kur.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Bir hata oluştu.');
      router.push(`/read?s=${data.sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <div className="group relative">
        <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-gold/25 via-transparent to-amethyst/20 opacity-60 blur-[6px] transition-opacity duration-700 group-focus-within:opacity-100" />
        <div className="relative rounded-2xl border border-gold/20 bg-abyss/90 p-4 shadow-card sm:p-5">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 280))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={3}
            maxLength={280}
            placeholder="Hayatındaki bir soru yaz… Örn: İshimi bırakmalı mıyım? / Bu ilişki bana iyi gelir mi?"
            className="w-full resize-none bg-transparent text-lg leading-relaxed text-mist outline-none placeholder:text-ash/50 sm:text-xl"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] tabular-nums text-ash/60">{question.length}/280</span>
            <button
              onClick={submit}
              disabled={busy}
              className="rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-6 py-3 font-display text-sm tracking-[0.18em] text-gold-pale transition-all hover:shadow-[0_0_28px_-6px_rgba(212,175,55,0.6)] disabled:opacity-50 sm:px-8"
            >
              {busy ? 'Kapılar açılıyor…' : 'BİR SORU SOR'}
            </button>
          </div>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-300/90">{error}</p>}
      <p className="mt-4 text-center text-xs text-ash/60 sm:text-left">
        Hesap gerekmez, sorularını kaydetmek istersen{' '}
        <Link href="/account" className="text-gold/80 underline underline-offset-2">hesap açabilirsin</Link>.
      </p>
    </div>
  );
}
