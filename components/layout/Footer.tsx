'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function LegalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`text-ash ${compact ? 'text-[11px]' : 'text-xs'} leading-relaxed`}>
      Bu içerik eğlence ve kişisel düşünme amacıyla hazırlanmıştır. Kesin gelecek
      tahmini veya profesyonel tavsiye değildir. Sağlık, hukuk ve finansal
      kararlar için ilgili uzmanlara danışın.
    </p>
  );
}

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="mt-24 border-t border-gold/10 bg-abyss/60">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="font-display text-lg tracking-[0.22em] text-mist">
              BABA <span className="text-gold">VANGA</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ash">
              Sorduğun soru, verdiğin cevaplar ve yüzlerce yıllık sembollerin
              diliyle hazırlanan kişisel yorumlar. Tamamen kural tabanlı,
              deterministik bir yorum motoru.
            </p>
            <div className="mt-5 rounded-xl border border-gold/15 bg-night/60 p-4">
              <LegalDisclaimer />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <div className="mb-3 font-display text-gold-pale">Keşfet</div>
              <ul className="space-y-2 text-ash">
                <li><Link className="hover:text-gold" href="/questions">Konular</Link></li>
                <li><Link className="hover:text-gold" href="/tarot">Tarot</Link></li>
                <li><Link className="hover:text-gold" href="/numerology">Numeroloji</Link></li>
                <li><Link className="hover:text-gold" href="/premium">Premium</Link></li>
              </ul>
            </div>
            <div>
              <div className="mb-3 font-display text-gold-pale">Bilgi</div>
              <ul className="space-y-2 text-ash">
                <li><Link className="hover:text-gold" href="/how-it-works">Nasıl Çalışır</Link></li>
                <li><Link className="hover:text-gold" href="/about">Hakkında</Link></li>
                <li><Link className="hover:text-gold" href="/faq">S.S.S.</Link></li>
              </ul>
            </div>
            <div>
              <div className="mb-3 font-display text-gold-pale">Yasal</div>
              <ul className="space-y-2 text-ash">
                <li><Link className="hover:text-gold" href="/privacy">Gizlilik</Link></li>
                <li><Link className="hover:text-gold" href="/terms">Kullanım Koşulları</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gold/10 pt-6 text-xs text-ash/70 sm:flex-row">
          <span>© {new Date().getFullYear()} Baba Vanga — Interactive Divination Engine</span>
          <span>Yapay zekâ kullanılmaz. Tüm sonuçlar deterministik kurallarla üretilir.</span>
        </div>
      </div>
    </footer>
  );
}
