'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Me {
  user: { id: string; email: string; premiumUntil: number | null; premiumActive: boolean } | null;
  guest: boolean;
}

interface ReadingRow {
  id: string; question: string; category: string; createdAt: number;
  paid: boolean; energy: string; timing: string;
}

export default function AccountPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [readings, setReadings] = useState<ReadingRow[]>([]);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [meRes, rdRes] = await Promise.all([
      fetch('/api/auth/me').then((r) => r.json()).catch(() => null),
      fetch('/api/account/readings').then((r) => r.json()).catch(() => null),
    ]);
    if (meRes) setMe(meRes);
    if (rdRes?.readings) setReadings(rdRes.readings);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'İşlem başarısız.');
      setPassword('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem başarısız.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await load();
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="font-display text-[11px] tracking-widest2 text-gold/70">KİŞİSEL ALAN</p>
      <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">
        {me?.user ? 'Hesabın' : 'Geçmiş Sorularım'}
      </h1>

      {/* ------------------------------------------------ Oturum kartı */}
      <div className="mt-8 rounded-2xl border border-gold/15 bg-veil/40 p-6">
        {me === null ? (
          <p className="shimmer-text font-display">Yükleniyor…</p>
        ) : me.user ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-ash">
                Giriş yapıldı: <span className="text-mist">{me.user.email}</span>
              </p>
              <p className="mt-1 text-xs text-ash/70">
                {me.user.premiumActive ? (
                  <>✦ Premium üyelik aktif — {new Date(me.user.premiumUntil!).toLocaleDateString('tr-TR')} tarihine kadar</>
                ) : (
                  <>Premium üyeliğin yok. <Link href="/premium" className="text-gold/80 underline underline-offset-2">Planları gör</Link></>
                )}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-amethyst/30 px-5 py-2.5 text-sm text-amethyst-soft transition-colors hover:bg-amethyst/10"
            >
              Çıkış yap
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm leading-relaxed text-ash">
              Hesapsız da kullanabilirsin — soruların bu tarayıcıya bağlı olarak
              saklanıyor. Hesap açarsan geçmişin cihazlar arası taşınır ve premium
              üyeliğe uygun hale gelir.
            </p>
            <div className="mt-5 flex gap-2">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); }}
                  className={`rounded-lg px-4 py-2 text-sm ${
                    mode === m ? 'border border-gold/60 bg-gold/10 text-gold-pale' : 'text-ash hover:text-mist'
                  }`}
                >
                  {m === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                className="field" type="email" placeholder="E-posta" value={email}
                onChange={(e) => setEmail(e.target.value)} maxLength={254}
              />
              <input
                className="field" type="password" placeholder="Şifre (en az 8 karakter)" value={password}
                onChange={(e) => setPassword(e.target.value)} maxLength={128}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
            <button
              onClick={submit}
              disabled={busy}
              className="mt-4 rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-6 py-3 font-display text-sm tracking-[0.18em] text-gold-pale disabled:opacity-50"
            >
              {busy ? '…' : mode === 'login' ? 'GİRİŞ YAP' : 'HESAP OLUŞTUR'}
            </button>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          </div>
        )}
      </div>

      {/* ------------------------------------------------ Geçmiş */}
      <div className="mt-12">
        <div className="gold-rule font-display text-sm tracking-[0.3em]">
          <span>GEÇMİŞ SORULARIM</span>
        </div>
        {readings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gold/10 bg-veil/30 p-8 text-center">
            <p className="text-sm text-ash">Henüz tamamlanmış bir yorumun yok.</p>
            <Link
              href="/read"
              className="mt-5 inline-block rounded-xl border border-gold/50 bg-gold/10 px-6 py-3 font-display text-sm tracking-[0.18em] text-gold-pale"
            >
              İLK SORUNU SOR
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {readings.map((r) => (
              <Link
                key={r.id}
                href={`/result/${r.id}`}
                className="card-hover flex items-center justify-between gap-4 rounded-2xl border border-gold/10 bg-veil/40 p-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-base text-mist">“{r.question}”</p>
                  <p className="mt-1 text-xs text-ash/70">
                    {new Date(r.createdAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                    {' · '}{r.energy}{' · '}{r.timing}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-[10px] tracking-wider ${
                    r.paid ? 'border-gold/60 text-gold' : 'border-amethyst/40 text-amethyst-soft'
                  }`}
                >
                  {r.paid ? 'TAM RAPOR' : 'KISA'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
