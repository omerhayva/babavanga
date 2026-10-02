'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { FlowStep } from '@/lib/question-engine/engine';

const RITUAL_MESSAGES = [
  'İşaretler birleştiriliyor…',
  'Yanıtların karşılaştırılıyor…',
  'Sayılar hesaplanıyor…',
  'Kartlar yorumlanıyor…',
  'Burçlar hizalanıyor…',
  'Sonuç hazırlanıyor…',
];

interface Props {
  sessionId: string;
  initialStep: FlowStep;
  question: string;
}

export default function FlowClient({ sessionId, initialStep, question }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>(initialStep);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transitionKey, setTransitionKey] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const send = useCallback(
    async (payload: Record<string, unknown>) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Bir hata oluştu.');
        setStep(data.step as FlowStep);
        setTransitionKey((k) => k + 1);
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
      } finally {
        setBusy(false);
      }
    },
    [busy, sessionId],
  );

  useEffect(() => {
    if (step.kind === 'complete' && !step.readingId) {
      router.replace(`/result/pending?s=${sessionId}`);
    }
  }, [step, router, sessionId]);

  return (
    <div ref={topRef} className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-2xl flex-col px-4 py-10 sm:px-6">
      {/* soru hatırlatıcı */}
      <div className="mb-8 text-center">
        <p className="font-display text-[11px] tracking-widest2 text-gold/70">SORUN</p>
        <p className="mx-auto mt-2 max-w-xl font-display text-lg italic leading-snug text-mist/90">
          “{question}”
        </p>
      </div>

      <div key={transitionKey} className="animate-fade-up">
        {step.kind === 'profile' && <ProfileStep onSend={send} busy={busy} />}
        {step.kind === 'question' && (
          <QuestionStep step={step} onSend={send} busy={busy} />
        )}
        {step.kind === 'symbols' && <SymbolsStep step={step} onSend={send} busy={busy} />}
        {step.kind === 'tarot_spread' && <SpreadStep onSend={send} busy={busy} />}
        {step.kind === 'tarot_pick' && <TarotPickStep step={step} onSend={send} busy={busy} />}
        {step.kind === 'complete' && step.readingId && (
          <Ritual sessionId={sessionId} onDone={(rid) => router.push(`/result/${rid}`)} />
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-center text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

/* ============================================================== Profil */
function ProfileStep({
  onSend, busy,
}: { onSend: (p: Record<string, unknown>) => void; busy: boolean }) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');

  return (
    <div>
      <h2 className="font-display text-2xl text-mist sm:text-3xl">Sana göre daha derin bir bakış için</h2>
      <p className="mt-3 text-sm leading-relaxed text-ash">
        Numeroloji ve astroloji hesapları için birkaç bilgi. Bunlar olmadan da
        devam edebilirsin; yorum o zaman cevapların ve kartlara dayanır.
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs tracking-wide text-ash">Adın (numeroloji için)</label>
          <input
            className="field" placeholder="Örn: Elif" value={name}
            onChange={(e) => setName(e.target.value.slice(0, 80))} maxLength={80}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs tracking-wide text-ash">Doğum tarihin (burç + yaşam yolu)</label>
          <input
            type="date" className="field" value={birthDate} min="1900-01-01" max="2100-12-31"
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs tracking-wide text-ash">Doğum saatin (opsiyonel — ay burcu için)</label>
          <input type="time" className="field" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          disabled={busy}
          onClick={() => onSend({ name, birthDate, birthTime })}
          className="flex-1 rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-6 py-3.5 font-display text-sm tracking-[0.18em] text-gold-pale transition-all hover:shadow-[0_0_28px_-6px_rgba(212,175,55,0.6)] disabled:opacity-50"
        >
          DEVAM ET
        </button>
        <button
          disabled={busy}
          onClick={() => onSend({ skip: true })}
          className="rounded-xl border border-amethyst/30 px-6 py-3.5 text-sm text-amethyst-soft transition-colors hover:bg-amethyst/10 disabled:opacity-50"
        >
          Paylaşmak istemiyorum
        </button>
      </div>
      <p className="mt-4 text-center text-[11px] text-ash/60">
        Bilgilerin yalnızca bu yorum için hesaplama amacıyla saklanır; profil görünmez.
      </p>
    </div>
  );
}

/* ============================================================== Soru */
function QuestionStep({
  step, onSend, busy,
}: {
  step: Extract<FlowStep, { kind: 'question' }>;
  onSend: (p: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const q = step.question;
  const [selected, setSelected] = useState<string[]>([]);
  const [scale, setScale] = useState(3);
  const [autoSent, setAutoSent] = useState(false);

  const pct = Math.min(100, Math.round((step.progress.current / step.progress.max) * 100));

  function toggle(v: string) {
    setSelected((prev) => {
      if (prev.includes(v)) return prev.filter((x) => x !== v);
      const max = q.maxSelected ?? 6;
      return prev.length >= max ? [...prev.slice(1), v] : [...prev, v];
    });
  }

  function pickSingle(v: string) {
    setSelected([v]);
    if (!autoSent) {
      setAutoSent(true);
      setTimeout(() => onSend({ value: v }), 550);
    }
  }

  return (
    <div>
      {/* ilerleme */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-[11px] tracking-widest text-ash/70">
          <span>
            {q.type === 'number' ? 'BİR SAYI SEÇ' : 'İÇİNDEN GELENİ SEÇ'}
          </span>
          <span className="tabular-nums">
            {step.progress.current} / {step.progress.max}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-mist/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amethyst-deep via-amethyst to-gold transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        {step.isLastPlanned && (
          <p className="mt-2 text-right text-[11px] text-gold/70">
            Bu sorudan sonra yorumun hazırlanacak.
          </p>
        )}
      </div>

      <h2 className="font-display text-2xl leading-snug text-mist sm:text-3xl">{q.text}</h2>
      {q.helperText && <p className="mt-2 text-sm text-ash">{q.helperText}</p>}

      {/* single / number: otomatik devam */}
      {(q.type === 'single' || q.type === 'number') && (
        <div className={`mt-8 grid gap-3 ${q.type === 'number' ? 'grid-cols-5' : 'sm:grid-cols-1'}`}>
          {q.options.map((o) => (
            <button
              key={o.value}
              disabled={busy || autoSent}
              onClick={() => pickSingle(o.value)}
              className={`option-btn flex items-center gap-3 rounded-xl px-5 py-4 text-left text-base text-mist disabled:opacity-60 sm:text-lg ${
                selected.includes(o.value) ? 'selected' : ''
              } ${q.type === 'number' ? 'justify-center font-display text-xl' : ''}`}
            >
              {o.glyph && <span className="text-xl text-gold/90">{o.glyph}</span>}
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* multi */}
      {q.type === 'multi' && (
        <>
          <div className="mt-8 grid gap-3">
            {q.options.map((o) => (
              <button
                key={o.value}
                disabled={busy}
                onClick={() => toggle(o.value)}
                className={`option-btn flex items-center gap-3 rounded-xl px-5 py-4 text-left text-base text-mist sm:text-lg ${
                  selected.includes(o.value) ? 'selected' : ''
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[11px] ${
                    selected.includes(o.value)
                      ? 'border-gold bg-gold/20 text-gold'
                      : 'border-gold/30 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
          <ContinueButton
            busy={busy}
            disabled={selected.length < (q.minSelected ?? 1)}
            label="DEVAM ET"
            onClick={() => onSend({ value: selected })}
            hint={`En az ${q.minSelected ?? 1} seç`}
          />
        </>
      )}

      {/* scale */}
      {q.type === 'scale' && (
        <div className="mt-10">
          <input
            type="range" min={1} max={5} step={1} value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="mx-auto w-full max-w-md"
          />
          <div className="mt-2 flex justify-between text-xs text-ash/70">
            <span>{q.scaleLabels?.[0] ?? 'Düşük'}</span>
            <span className="font-display text-2xl text-gold">{scale}</span>
            <span>{q.scaleLabels?.[1] ?? 'Yüksek'}</span>
          </div>
          <ContinueButton
            busy={busy}
            label="DEVAM ET"
            onClick={() => onSend({ value: scale })}
          />
        </div>
      )}
    </div>
  );
}

function ContinueButton({
  busy, disabled, label, onClick, hint,
}: {
  busy: boolean; disabled?: boolean; label: string;
  onClick: () => void; hint?: string;
}) {
  return (
    <div className="mt-8">
      <button
        disabled={busy || disabled}
        onClick={onClick}
        className="w-full rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-6 py-3.5 font-display text-sm tracking-[0.18em] text-gold-pale transition-all hover:shadow-[0_0_28px_-6px_rgba(212,175,55,0.6)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? 'KAYDEDİLİYOR…' : label}
      </button>
      {hint && disabled && <p className="mt-2 text-center text-xs text-ash/60">{hint}</p>}
    </div>
  );
}

/* ============================================================== Semboller */
function SymbolsStep({
  step, onSend, busy,
}: {
  step: Extract<FlowStep, { kind: 'symbols' }>;
  onSend: (p: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const need = step.choose;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= need
          ? [...prev.slice(1), id]
          : [...prev, id],
    );
  }

  return (
    <div>
      <p className="font-display text-[11px] tracking-widest text-gold/70">SEMBOL SEÇİMİ</p>
      <h2 className="mt-3 font-display text-2xl leading-snug text-mist sm:text-3xl">
        Bu soruyu düşünürken hangisi sana doğru geliyor?
      </h2>
      <p className="mt-3 text-sm text-ash">
        Üç sembol seç. Seçimlerin yorum motoruna girdi olacak.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {step.symbols.map((s) => (
          <button
            key={s.id}
            disabled={busy}
            onClick={() => toggle(s.id)}
            className={`option-btn flex flex-col items-center gap-2 rounded-2xl px-3 py-5 ${
              selected.includes(s.id) ? 'selected' : ''
            }`}
          >
            <span className="text-3xl transition-transform duration-500 sm:text-4xl">{s.glyph}</span>
            <span className="font-display text-xs text-mist/90 sm:text-sm">{s.name}</span>
          </button>
        ))}
      </div>

      <ContinueButton
        busy={busy}
        disabled={selected.length !== need}
        label="SEÇİMİ TAMAMLA"
        onClick={() => onSend({ symbols: selected })}
        hint={`Tam olarak ${need} sembol seç (${selected.length}/${need})`}
      />
    </div>
  );
}

/* ============================================================== Açılım */
function SpreadStep({
  onSend, busy,
}: { onSend: (p: Record<string, unknown>) => void; busy: boolean }) {
  const options = [
    { value: 1, label: 'Tek Kart', desc: 'Sorunun özünü gösterir. Hızlı ve net.', premium: false },
    { value: 3, label: 'Üç Kart', desc: 'Geçmiş → Şimdi → Olası Yön. En dengeli açılım.', premium: false },
    { value: 5, label: 'Beş Kart', desc: 'Geçmiş, Şimdi, Gizli Etken, Tavsiye, Olası Yön.', premium: true },
  ];
  return (
    <div>
      <p className="font-display text-[11px] tracking-widest text-gold/70">TAROT AÇILIMI</p>
      <h2 className="mt-3 font-display text-2xl text-mist sm:text-3xl">
        Kartlar seni bekliyor. Açılımını seç.
      </h2>
      <div className="mt-8 space-y-3">
        {options.map((o) => (
          <button
            key={o.value}
            disabled={busy}
            onClick={() => onSend({ spread: o.value })}
            className="option-btn flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-5 text-left"
          >
            <div>
              <div className="font-display text-lg text-mist">
                {o.label}
                {o.premium && (
                  <span className="ml-2 rounded-full border border-gold/50 px-2 py-0.5 align-middle text-[10px] tracking-wider text-gold">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ash">{o.desc}</p>
            </div>
            <span className="text-2xl text-gold/70">{o.value === 1 ? '🂠' : o.value === 3 ? '🂠🂠🂠' : '🂠🂠🂠🂠🂠'}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-ash/60">
        Beş kart açılımı premium üyelere açıktır; sonuç ekranından detaylı raporla birlikte de açılabilir.
      </p>
    </div>
  );
}

/* ============================================================== Kart seçimi */
function TarotPickStep({
  step, onSend, busy,
}: {
  step: Extract<FlowStep, { kind: 'tarot_pick' }>;
  onSend: (p: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const need = step.count;

  function toggle(i: number) {
    setPicked((prev) =>
      prev.includes(i)
        ? prev.filter((x) => x !== i)
        : prev.length >= need
          ? [...prev.slice(1), i]
          : [...prev, i],
    );
  }

  return (
    <div>
      <p className="font-display text-[11px] tracking-widest text-gold/70">KART SEÇİMİ</p>
      <h2 className="mt-3 font-display text-2xl text-mist sm:text-3xl">
        Desteden {need} kart seç
      </h2>
      <p className="mt-3 text-sm text-ash">
        Kapalı kartlar. İçinden gelenleri seç — hangi kartın nerede duracağı senin seçimine bağlı.
      </p>

      <div className="mt-8 grid grid-cols-4 gap-2.5 sm:grid-cols-6 sm:gap-3">
        {Array.from({ length: step.totalSlots }).map((_, i) => (
          <button
            key={i}
            disabled={busy}
            onClick={() => toggle(i)}
            aria-label={`Kart pozisyonu ${i + 1}`}
            className={`tarot-back relative aspect-[3/5] rounded-xl ${picked.includes(i) ? 'picked' : ''}`}
          >
            <span className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className={`font-display text-lg text-gold/70 transition-opacity ${picked.includes(i) ? 'opacity-100' : 'opacity-40'}`}>
                {picked.includes(i) ? '✦' : '☾'}
              </span>
            </span>
          </button>
        ))}
      </div>

      <ContinueButton
        busy={busy}
        disabled={picked.length !== need}
        label="KARTLARI AÇ"
        onClick={() => onSend({ slots: picked })}
        hint={`Tam olarak ${need} kart seç (${picked.length}/${need})`}
      />
    </div>
  );
}

/* ============================================================== Ritüel (loading) */
function Ritual({ sessionId, onDone }: { sessionId: string; onDone: (readingId: string) => void }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const TOTAL_MS = RITUAL_MESSAGES.length * 1300;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = Date.now();

    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setIndex(i);
      if (i >= RITUAL_MESSAGES.length - 1) clearInterval(timer);
    }, 1300);

    (async () => {
      try {
        const res = await fetch('/api/reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        const wait = Math.max(0, TOTAL_MS - (Date.now() - t0));
        setTimeout(() => {
          clearInterval(timer);
          if (res.ok && data.readingId) onDone(data.readingId);
          else setFailed(true);
        }, wait);
      } catch {
        clearInterval(timer);
        setFailed(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl text-mist">Sonuç hazırlanamadı.</p>
        <p className="mt-3 text-sm text-ash">Bağlantı bir kez koptu gibi görünüyor.</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-gold/60 bg-gold/10 px-6 py-3 font-display text-sm tracking-[0.18em] text-gold-pale"
          >
            TEKRAR DENE
          </button>
          <Link href="/" className="text-sm text-ash underline underline-offset-2">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round(((index + 1) / RITUAL_MESSAGES.length) * 100));

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 animate-spin-slow rounded-full border border-gold/25" />
        <div className="absolute inset-3 animate-glow-pulse rounded-full border border-amethyst/40" />
        <div className="absolute inset-0 grid place-items-center font-display text-4xl text-gold">
          {['☾', '✦', '◈', '☸', '⚗', '✧'][index % 6]}
        </div>
      </div>
      <p className="mt-10 font-display text-xl shimmer-text sm:text-2xl">
        {RITUAL_MESSAGES[Math.min(index, RITUAL_MESSAGES.length - 1)]}
      </p>
      <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-mist/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amethyst to-gold transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-6 text-[11px] text-ash/50">
        Cevapların, kartların ve sayıların hesapları birleştiriliyor.
      </p>
    </div>
  );
}
