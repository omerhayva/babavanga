'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Giriş başarısız.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş başarısız.');
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gold/20 bg-veil/50 p-8">
        <p className="text-center font-display text-[11px] tracking-widest2 text-gold/70">
          YÖNETİM PANELİ
        </p>
        <h1 className="mt-3 text-center font-display text-2xl text-mist">Giriş</h1>
        <input
          type="password"
          className="field mt-6"
          placeholder="Yönetici şifresi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button
          onClick={submit}
          disabled={busy}
          className="mt-4 w-full rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-6 py-3 font-display text-sm tracking-[0.18em] text-gold-pale disabled:opacity-50"
        >
          {busy ? '…' : 'GİRİŞ YAP'}
        </button>
        {error && <p className="mt-3 text-center text-sm text-red-300">{error}</p>}
        <p className="mt-4 text-center text-[11px] text-ash/50">
          Varsayılan şifre: <code className="text-gold/60">vanga-admin</code> —
          üretimde ADMIN_PASSWORD ile değiştirin.
        </p>
      </div>
    </div>
  );
}
