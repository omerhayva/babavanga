import type { Metadata } from 'next';
import { getTarotDeck } from '@/lib/db/content';
import MiniTarot from '@/components/pages/MiniTarot';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ücretsiz Tarot Açılımı',
  description:
    '22 Büyük Arcana ile ücretsiz tarot açılımı. Tek kart veya üç kart (Geçmiş → Şimdi → Olası Yön) çek, kartların tam anlamlarını gör.',
  openGraph: { title: 'Ücretsiz Tarot Açılımı | Baba Vanga' },
};

export default function TarotPage() {
  const deck = getTarotDeck();
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="font-display text-[11px] tracking-widest2 text-gold/70">ÜCRETSİZ AÇILIM</p>
        <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">
          Kartlar <span className="text-gold">seni bekliyor</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ash">
          Desteden kartları sen seç. Sonuç tam olarak bu sayfada üretilir; kayıt
          gerekmez. Daha derin, soruna özel açılımlar için interaktif akışı dene.
        </p>
      </div>

      <MiniTarot />

      <section className="mt-16">
        <div className="gold-rule font-display text-sm tracking-[0.3em]">
          <span>BÜYÜK ARCANA — 22 KART</span>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {deck.map((c) => (
            <details key={c.id} className="group rounded-2xl border border-gold/10 bg-veil/40 p-4">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <span className="text-2xl">{c.glyph}</span>
                <div>
                  <p className="font-display text-sm text-mist">{c.nameTr}</p>
                  <p className="text-[10px] text-ash/60">{c.name} · {c.timing}</p>
                </div>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-ash">{c.upright}</p>
              <p className="mt-2 text-[11px] text-gold/60">{c.keywords.join(' · ')}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12 text-center">
        <Link
          href="/read"
          className="inline-block rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-8 py-3.5 font-display text-sm tracking-[0.18em] text-gold-pale"
        >
          SORUMU SORAYIM
        </Link>
        <p className="mt-3 text-xs text-ash/60">
          Kartları soruna özel yorumlamak için interaktif akış daha derindir.
        </p>
      </div>
    </div>
  );
}
