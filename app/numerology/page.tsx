import type { Metadata } from 'next';
import Link from 'next/link';
import NumerologyCalculator from '@/components/pages/NumerologyCalculator';

export const metadata: Metadata = {
  title: 'Ücretsiz Numeroloji Hesabı',
  description:
    'İsmin ve doğum tarihinle yaşam yolu, kader, ruh, kişilik sayılarını ve kişisel yıl/ay/gün hesaplarını ücretsiz öğren. Türkçe karakter destekli isim hesabı.',
  openGraph: { title: 'Ücretsiz Numeroloji Hesabı | Baba Vanga' },
};

export default function NumerologyPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="font-display text-[11px] tracking-widest2 text-gold/70">SAYILARIN DİLİ</p>
        <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">
          İsmindeki ve <span className="text-gold">tarihindeki</span> şifre
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ash">
          Numeroloji motoru Türkçe karakterleri (Ç, Ğ, İ, Ö, Ş, Ü) destekler.
          Hesaplamalar tamamen deterministiktir: aynı isim ve tarih her zaman
          aynı sonucu verir.
        </p>
      </div>

      <NumerologyCalculator />

      <section className="mt-16 space-y-4">
        <div className="gold-rule font-display text-sm tracking-[0.3em]">
          <span>HESAPLAR NE ANLATIR?</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Yaşam Yolu Sayısı', 'Doğum tarihinin tüm hanelerinden üretilir; bu hayattaki ana yönü ve öğrenme biçimini gösterir.'],
            ['Kader (İfade) Sayısı', 'Tam ismin harf toplamından çıkar; doğuştan getirdiğin potansiyeli anlatır.'],
            ['Ruh Sayısı', 'İsmindeki sesli harflerden hesaplanır; kalbinin gizli isteklerini temsil eder.'],
            ['Kişilik Sayısı', 'Sessiz harflerden çıkar; dış dünyanın sende gördüğü ilk izlenimi yansıtır.'],
            ['Kişisel Yıl', 'Doğum günü + ay + içinde bulunulan yıldan üretilir; bulunduğun döngünün temasını verir.'],
            ['Kişisel Ay / Gün', 'Daha kısa döngülerdir; ayın ve günün uygun ritmini gösterir.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-gold/10 bg-veil/40 p-5">
              <h3 className="font-display text-base text-mist">{t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-ash">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 text-center">
        <Link
          href="/read"
          className="inline-block rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-8 py-3.5 font-display text-sm tracking-[0.18em] text-gold-pale"
        >
          SAYILARI SORUMA BAĞLA
        </Link>
        <p className="mt-3 text-xs text-ash/60">
          İnteraktif akışta numeroloji, tarot ve semboller birlikte yorumlanır.
        </p>
      </div>
    </div>
  );
}
