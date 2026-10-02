import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { store } from '@/lib/db/store';
import { canAccessOwner, isAdminRequest } from '@/lib/auth/session';
import { getCategory } from '@/lib/db/content';
import { SCORE_LABELS, SCORE_KEYS } from '@/lib/types/models';
import type { ScoreKey, Reading } from '@/lib/types/models';
import { LegalDisclaimer } from '@/components/layout/Footer';
import { UnlockReportButton } from '@/components/result/PremiumActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Yorumun',
  robots: { index: false, follow: false },
};

const SECTION_TITLES: Record<string, string> = {
  essence: 'SORUNUN ÖZÜ',
  energy: 'ŞU ANDAKİ ENERJİ',
  influence: 'GÜÇLÜ ETKİ',
  possibility: 'ÖNÜNDEKİ OLASILIK',
  attention: 'DİKKAT',
  opportunity: 'FIRSAT',
  timing: 'ZAMANLAMA',
};

export default async function ResultPage({ params }: { params: { id: string } }) {
  const reading = await store.get<Reading>('readings', params.id);
  if (!reading) notFound();

  const owns = canAccessOwner(reading.ownerId);
  if (!owns && !isAdminRequest()) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="font-display text-2xl text-mist">Bu yorum sana ait değil.</p>
        <p className="mt-3 text-sm text-ash">Sonuçlar yalnızca sahibine görünür.</p>
        <Link href="/" className="mt-8 inline-block rounded-xl border border-gold/50 px-6 py-3 text-sm text-gold-pale">
          Ana sayfa
        </Link>
      </div>
    );
  }

  const unlocked = reading.paid;
  const d = reading.data;
  const category = getCategory(reading.category);

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* başlık */}
      <div className="text-center">
        <p className="font-display text-[11px] tracking-widest2 text-gold/70">
          {category ? category.name.toUpperCase() : 'KİŞİSEL YORUM'}
        </p>
        <h1 className="mx-auto mt-4 max-w-xl font-display text-2xl italic leading-snug text-mist sm:text-3xl">
          “{reading.question}”
        </h1>
        <p className="mt-3 text-[11px] text-ash/60">
          {new Date(reading.createdAt).toLocaleString('tr-TR', {
            dateStyle: 'long', timeStyle: 'short',
          })}
        </p>
      </div>

      {/* ÜCRETSİZ BÖLÜM */}
      <Section title={SECTION_TITLES.essence}>
        {d.essence.slice(0, 2).map((t, i) => (
          <p key={i} className="leading-relaxed text-mist/90">{t}</p>
        ))}
        {!unlocked && d.essence.length > 2 && (
          <p className="italic text-ash/50">…devamı detaylı raporda</p>
        )}
      </Section>

      {reading.sensitive && (
        <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-950/20 p-5">
          <p className="font-display text-sm text-amber-200/90">Önemli not</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
            Bu soru sağlık, hukuk, finans veya benzeri profesyonel bir alana
            dokunuyor. Bu yorum bu konularda yönlendirme içermez ve içermemelidir;
            ilgili kararlar için lütfen bir uzmana (hekim, avukat, lisanslı
            danışman) danış. Zor günlerdeysen, güvenebileceğin bir yakınına veya
            profesyonel desteğe ulaşmanı öneririz.
          </p>
        </div>
      )}

      <Section title={SECTION_TITLES.energy}>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-4 py-1.5">
          <span className="text-lg">✦</span>
          <span className="font-display text-lg text-gold-pale">{d.energy.label}</span>
        </div>
        {d.energy.body.map((t, i) => (
          <p key={i} className="leading-relaxed text-mist/90">{t}</p>
        ))}
      </Section>

      {/* TAROT ÖNİZLEME (ücretsiz: kart isimleri; premium: anlamlarıyla) */}
      <Section title="ÇEKİLEN KARTLAR">
        <div className="grid gap-3 sm:grid-cols-3">
          {d.tarot.map((c) => (
            <div
              key={`${c.id}-${c.position}`}
              className={`relative overflow-hidden rounded-2xl border p-4 text-center ${
                unlocked ? 'border-gold/25 bg-veil/60' : 'border-gold/15 bg-veil/30'
              }`}
            >
              <p className="text-[10px] tracking-widest text-ash/70">{c.position.toUpperCase()}</p>
              <div className={`${c.reversed ? 'rotate-180' : ''} my-3 text-4xl transition-transform duration-700`}>
                {c.glyph}
              </div>
              <p className="font-display text-base text-mist">{c.nameTr}</p>
              <p className="text-[11px] text-ash/70">{c.name}{c.reversed ? ' · Ters' : ''}</p>
              {unlocked ? (
                <>
                  <div className="my-3 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <p className="text-xs leading-relaxed text-ash">{c.meaning}</p>
                  <p className="mt-2 text-[10px] text-gold/60">{c.keywords.join(' · ')}</p>
                </>
              ) : (
                <p className="mt-3 text-[11px] italic text-ash/50">Anlamı detaylı raporda</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title={SECTION_TITLES.timing}>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amethyst/40 bg-amethyst/5 px-4 py-1.5">
          <span className="text-lg">⌛</span>
          <span className="font-display text-base text-amethyst-soft">{d.timing.label}</span>
        </div>
        {unlocked ? (
          d.timing.body.map((t, i) => <p key={i} className="leading-relaxed text-mist/90">{t}</p>)
        ) : (
          <p className="leading-relaxed text-mist/90">
            Bu konunun olgunlaşma penceresi hesaplandı — ayrıntısı detaylı raporda.
          </p>
        )}
      </Section>

      {/* PREMIUM KİLİDİ */}
      {!unlocked && (
        <div className="my-10 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-b from-veil/80 to-abyss/90 p-6 sm:p-8">
          <div className="text-center">
            <p className="font-display text-[11px] tracking-widest2 text-gold/80">DETAYLI RAPOR</p>
            <h2 className="mt-3 font-display text-2xl text-mist">
              Yorumunun tamamını aç
            </h2>
            <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm text-ash">
              <li>✦ Güçlü Etki — arka plandaki faktör</li>
              <li>✦ Önündeki Olasılık + Fırsat + Dikkat bölümleri</li>
              <li>✦ Kartların kategoriye özel tam anlamları</li>
              <li>✦ Numeroloji paneli (yaşam yolu, kişisel yıl, isim enerjisi)</li>
              <li>✦ Astroloji paneli (burç, element, yaklaşık ay burcu)</li>
              <li>✦ Sembol seçimlerinin tam yorumu</li>
              <li>✦ Enerji haritası — 10 eksende skor dağılımı</li>
              <li>✦ Kapanış notu</li>
            </ul>
            <div className="mx-auto mt-6 max-w-sm">
              <UnlockReportButton readingId={reading.id} />
            </div>
            <p className="mt-4 text-xs text-ash/70">
              ya da{' '}
              <Link href="/premium" className="text-gold/80 underline underline-offset-2">
                Premium üyeliği incele
              </Link>{' '}
              (sınırsız detaylı rapor + 5 kart açılımı)
            </p>
          </div>
        </div>
      )}

      {/* PREMIUM BÖLÜMLER */}
      {unlocked && (
        <>
          <Section title={SECTION_TITLES.influence}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amethyst/40 bg-amethyst/5 px-4 py-1.5">
              <span className="text-lg">☾</span>
              <span className="font-display text-base text-amethyst-soft">{d.influence.label}</span>
            </div>
            {d.influence.body.map((t, i) => (
              <p key={i} className="leading-relaxed text-mist/90">{t}</p>
            ))}
          </Section>

          <Section title={SECTION_TITLES.possibility}>
            {d.possibility.map((t, i) => (
              <p key={i} className="leading-relaxed text-mist/90">{t}</p>
            ))}
            <p className="mt-3 text-xs italic text-ash/60">
              Bu bölüm bir kesin gelecek iddiası değil; mevcut eğilimlerin işaret ettiği
              güçlü bir ihtimaldir.
            </p>
          </Section>

          <Section title={SECTION_TITLES.attention}>
            {d.attention.map((t, i) => (
              <p key={i} className="leading-relaxed text-amber-100/90">{t}</p>
            ))}
          </Section>

          <Section title={SECTION_TITLES.opportunity}>
            {d.opportunity.map((t, i) => (
              <p key={i} className="leading-relaxed text-mist/90">{t}</p>
            ))}
          </Section>

          {/* Numeroloji */}
          {d.numerology && (
            <Section title="NUMEROLOJİ PANELİ">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                <Stat label="Yaşam Yolu" value={d.numerology.lifePath} />
                <Stat label="Kader" value={d.numerology.destiny} />
                <Stat label="Ruh" value={d.numerology.soul} />
                <Stat label="Kişilik" value={d.numerology.personality} />
                <Stat label="Doğum Günü" value={d.numerology.birthday} />
                <Stat label="Kişisel Yıl" value={d.numerology.personalYear} />
                <Stat label="Kişisel Ay" value={d.numerology.personalMonth} />
                <Stat label="Kişisel Gün" value={d.numerology.personalDay} />
              </div>
              {d.numerology.nameTotal !== undefined && (
                <p className="mt-4 text-xs text-ash/70">
                  İsim hesabı — toplam: {d.numerology.nameTotal} · sesli: {d.numerology.vowelTotal} ·
                  sessiz: {d.numerology.consonantTotal}
                </p>
              )}
              <div className="mt-4 space-y-3">
                {d.numerology.notes.map((n, i) => (
                  <p key={i} className="text-sm leading-relaxed text-ash">{n}</p>
                ))}
              </div>
            </Section>
          )}

          {/* Astroloji */}
          {d.astrology && (
            <Section title="ASTROLOJİ PANELİ">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-gold/25 bg-veil/60 px-4 py-3 text-center">
                  <p className="text-[10px] tracking-widest text-ash/70">GÜNEŞ BURCU</p>
                  <p className="mt-1 font-display text-xl text-gold-pale">
                    {d.astrology.sunSign}
                  </p>
                  <p className="text-[10px] text-ash/60">{d.astrology.sunDateRange}</p>
                </div>
                <div className="rounded-xl border border-amethyst/25 bg-veil/60 px-4 py-3 text-center">
                  <p className="text-[10px] tracking-widest text-ash/70">ELEMENT / NİTELİK</p>
                  <p className="mt-1 font-display text-xl text-amethyst-soft">
                    {d.astrology.elementTr} · {d.astrology.qualityTr}
                  </p>
                </div>
                {d.astrology.moonSign && (
                  <div className="rounded-xl border border-amethyst/25 bg-veil/60 px-4 py-3 text-center">
                    <p className="text-[10px] tracking-widest text-ash/70">AY BURCU (YAKLAŞIK)</p>
                    <p className="mt-1 font-display text-xl text-amethyst-soft">
                      {d.astrology.moonSign}
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ash">{d.astrology.note}</p>
            </Section>
          )}

          {/* Semboller */}
          {d.symbols.length > 0 && (
            <Section title="SEMBOL YORUMUN">
              <div className="grid gap-3 sm:grid-cols-3">
                {d.symbols.map((s) => (
                  <div key={s.id} className="rounded-2xl border border-gold/15 bg-veil/50 p-4 text-center">
                    <div className="text-3xl">{s.glyph}</div>
                    <p className="mt-2 font-display text-sm text-mist">{s.name}</p>
                    <p className="mt-2 text-xs leading-relaxed text-ash">{s.meaning}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Skor haritası */}
          <Section title="ENERJİ HARİTASI">
            <div className="space-y-4">
              {SCORE_KEYS.map((k: ScoreKey) => (
                <div key={k}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-ash">{SCORE_LABELS[k]}</span>
                    <span className="tabular-nums text-gold/80">{d.scores[k]}</span>
                  </div>
                  <div className="score-bar">
                    <div style={{ width: `${d.scores[k]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-ash/60">
              Değerler; cevapların, kartların, sayı hesaplarının ve sembol seçimlerinin
              birleşiminden üretilmiştir. 50 nötr eksen merkezidir.
            </p>
          </Section>

          <Section title="KAPANIŞ">
            {d.closing.map((t, i) => (
              <p key={i} className="leading-relaxed text-mist/90">{t}</p>
            ))}
          </Section>
        </>
      )}

      {/* Uyarı + aksiyonlar */}
      <div className="mt-10 rounded-2xl border border-gold/15 bg-night/70 p-5">
        <LegalDisclaimer />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/read"
          className="flex-1 rounded-xl border border-gold/50 bg-gold/10 px-6 py-3.5 text-center font-display text-sm tracking-[0.18em] text-gold-pale"
        >
          YENİ BİR SORU SOR
        </Link>
        <Link
          href="/account"
          className="rounded-xl border border-amethyst/30 px-6 py-3.5 text-center text-sm text-amethyst-soft"
        >
          Geçmiş Sorularım
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="gold-rule font-display text-[11px] tracking-widest2">
        <span>{title}</span>
      </div>
      <div className="mt-5 space-y-4 text-[15px]">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-gold/15 bg-veil/40 px-2 py-3 text-center">
      <p className="text-[9px] tracking-wider text-ash/70">{label.toUpperCase()}</p>
      <p className="mt-1 font-display text-xl text-gold-pale">{value ?? '—'}</p>
    </div>
  );
}
