import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sık Sorulan Sorular',
  description: 'Baba Vanga nasıl çalışır, verilerim ne oluyor, sonuçlar tekrarlanabilir mi? Sık sorulan sorular.',
  openGraph: { title: 'Sık Sorulan Sorular | Baba Vanga' },
};

const FAQS: Array<[string, string]> = [
  [
    'Sonuçlar yapay zekâ ile mi üretiliyor?',
    'Hayır. Sitede hiçbir yapay zekâ, dil modeli veya harici servis kullanılmaz. Sonuçlar; soru sınıflandırma, koşullu dallanan soru ağacı, puanlama, numeroloji/tarot/astroloji hesapları ve önceden yazılmış yorum parçalarının kural tabanlı seçilip birleştirilmesiyle üretilir. Aynı oturumda aynı girdiler her zaman aynı sonucu verir.',
  ],
  [
    'Aynı soruyu tekrar sorarsam ne olur?',
    'Her oturum kendi tohumuyla (seed) çalışır; bu yüzden yorum parçalarının seçimi ve kartların dizilimi değişir. Ancak skorların ve temaların yönü cevapların tarafından belirlenir — benzer cevaplar benzer temalar üretir. Anlamsız rastgelelik yoktur.',
  ],
  [
    'Verilerim saklanıyor mu?',
    'Soruların, cevapların ve sonuçların; yalnızca "Geçmiş Sorularım" özelliği çalışsın diye anonim bir misafir kimliğiyle (çerez) veya hesabınla saklanır. Analitik tamamen anonimdir: olay tipi ve zamandan ibarettir, soru metinleri istatistiklere taşınmaz. Doğum bilgilerin yorum hesaplaması dışında kullanılmaz.',
  ],
  [
    'Ücretsiz neler var, premium ne veriyor?',
    'Ücretsiz: interaktif soru akışı, kısa yorum (sorunun özü, şu andaki enerji, kartların kimliği, zamanlama etiketi), ücretsiz tarot ve numeroloji sayfaları. Premium: tek seferlik detaylı rapor veya üyelik ile tüm bölümler, kart anlamları, numeroloji/astroloji panelleri, enerji haritası ve 5 kart açılımı. İlk sürümde ödeme simülasyondur.',
  ],
  [
    'Doğum tarihi vermek zorunda mıyım?',
    'Hayır. "Paylaşmak istemiyorum" diyerek numeroloji ve astroloji hesapları olmadan devam edebilirsin; yorum o zaman cevaplarına, sembol seçimlerine ve kartlara dayanır.',
  ],
  [
    'Sonuçlarda kesin tarih göreceğim mi?',
    'Hayır. Motor zamanlamayı dönem kategorileriyle anlatır: "Yakın dönem", "1-3 ay", "3-6 ay", "6 ay ve ötesi". Bunlar kesin tarih vaatleri değil, kartların ve skorların işaret ettiği olgunlaşma pencereleridir.',
  ],
  [
    'Sağlık, hukuk veya yatırım sorusu sorabilir miyim?',
    'Soru sorabilirsin; ancak sistem bu konularda kesin yönlendirme yapmaz ve ek uyarı gösterir. Bu konularda mutlaka ilgili uzmana (hekim, avukat, lisanslı danışman) danışılmalıdır. Zor günlerdeysen, yakınlarınla veya profesyonel destekle konuşmanı öneririz.',
  ],
  [
    'Astroloji hesapları ne kadar doğru?',
    'Güneş burcu tarih aralıkları kesindir. Ay burcu ise yaklaşık bir hesapla (ortalama ay hareketi) bulunur; hata payı ±1 burç olabilir ve sonuç "yaklaşık" olarak etiketlenir. İleride gerçek ephemeris entegrasyonu için motor modüler tasarlanmıştır.',
  ],
];

export default function FaqPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="font-display text-[11px] tracking-widest2 text-gold/70">MERAK EDİLENLER</p>
      <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">Sık sorulan sorular</h1>

      <div className="mt-10 space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="group rounded-2xl border border-gold/10 bg-veil/40 p-5 open:border-gold/30">
            <summary className="cursor-pointer list-none font-display text-base text-mist marker:hidden">
              <span className="mr-2 text-gold/70 group-open:hidden">+</span>
              <span className="mr-2 hidden text-gold/70 group-open:inline">−</span>
              {q}
            </summary>
            <p className="mt-3 pl-6 text-sm leading-relaxed text-ash">{a}</p>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map(([q, a]) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }),
        }}
      />

      <div className="mt-10 text-center text-sm text-ash">
        Başka bir sorun mu var?{' '}
        <Link href="/how-it-works" className="text-gold/80 underline underline-offset-2">
          Motorun anatomisini incele
        </Link>
      </div>
    </div>
  );
}
