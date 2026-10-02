import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nasıl Çalışıyor?',
  description:
    'Sorun nasıl sınıflandırılıyor, sorular nasıl dallanıyor, numeroloji / tarot / astroloji / semboller nasıl birleşiyor? İşte motorun anatomisi.',
  openGraph: { title: 'Nasıl Çalışıyor? | Baba Vanga' },
};

const PIPELINE = [
  {
    step: '01', title: 'Sorun yazılır',
    body: 'Aklındaki soruyu kendi cümlelerinle yazarsın. Sistem, sorunu anahtar kelime analiziyle 16 konudan birine bağlar (aşk, kariyer, para, karar, gelecek…). Emin olamazsa genel hayat akışına yönlendirir.',
  },
  {
    step: '02', title: 'Temel bilgiler (isteğe bağlı)',
    body: 'Numeroloji ve astroloji hesapları için isim ve doğum tarihi istenir. Paylaşmak istemezsen yorum yalnızca cevapların, sembollerin ve kartlara dayanır.',
  },
  {
    step: '03', title: 'Dinamik soru ağacı',
    body: 'Sistem sana tek tek sorular sorar. Her cevap, sıradaki soruyu değiştirir: "kararsızlık" dediğinde kararsızlığının nedeni sorulur; "özlem" dediğinde özlemin katmanı sorulur. Herkes aynı soruları görmez.',
  },
  {
    step: '04', title: 'Puanlama',
    body: 'Her cevap 10 eksende katkı yapar: değişim, risk, fırsat, netlik, bağ, maddi odak, kariyer, sabır, aciliyet, umut. Ölçek soruları katsayıyla, çoklu seçimler toplanarak hesaplanır.',
  },
  {
    step: '05', title: 'Semboller',
    body: 'Sunulan sembollerden üçünü seçersin. Her sembolün dört bağlam yorumu (genel, aşk, para, kariyer) ve skor katkısı vardır; seçimin yorum motoruna girdi olur.',
  },
  {
    step: '06', title: 'Tarot',
    body: 'Açılımı sen seçer (1, 3 veya 5 kart), kapalı desteden kartları sen çekersin. Kartların sırası oturumuna özel karıştırılır; yönü (düz/ters) hesaplanır. Yorum, sorunun kategorisine göre kartın ilgili anlam alanından seçilir: aşk sorusunda aşk yorumu, para sorusunda para yorumu.',
  },
  {
    step: '07', title: 'Numeroloji + astroloji',
    body: 'Yaşam yolu, kader, ruh, kişilik, kişisel yıl/ay/gün sayıların; güneş burcun, elementin, niteliğin ve (yaklaşık) ay burcun hesaplanır. Her hesap skorlara katkı yapar.',
  },
  {
    step: '08', title: 'Sonuç üretimi',
    body: 'Tüm bu girdiler birleşir: skorlar normalize edilir (0-100), temalar çıkarılır ve yüzlerce önceden yazılmış yorum parçası arasından kurallara ve koşullara uyanlar seçilip birleştirilir. Metni bir model yazmaz; kural tabanlı bir sonuç üreticisi birleştirir.',
  },
  {
    step: '09', title: 'Tekrarlanabilirlik',
    body: 'Aynı oturumda aynı girdiler her zaman aynı sonucu verir (deterministik). Aynı soruyu yeni bir oturumda tekrar sorduğunda parçaların seçimi değişir; ama seçim yine kurallara ve skorlarına bağlıdır, anlamsız rastgelelik yoktur.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="font-display text-[11px] tracking-widest2 text-gold/70">MOTORUN ANATOMİSİ</p>
        <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">
          Cevabı vermeyen sistem, <span className="text-gold">doğru soruyu bulur</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ash">
          Baba Vanga bir sohbet botu değil; bir hesaplama motorudur. Burada yapay
          zekâ, dil modeli veya harici servis yoktur. Her şey tespit edilebilir
          kurallarla çalışır.
        </p>
      </div>

      <div className="mt-14 space-y-4">
        {PIPELINE.map((p) => (
          <div key={p.step} className="card-hover rounded-2xl border border-gold/10 bg-veil/40 p-6">
            <div className="flex items-baseline gap-4">
              <span className="font-display text-2xl text-gold/50">{p.step}</span>
              <div>
                <h2 className="font-display text-lg text-mist">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ash">{p.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-amethyst/25 bg-veil/30 p-6 sm:p-8">
        <h2 className="font-display text-lg text-amethyst-soft">Etik çerçeve</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ash">
          <li>• Bu site gerçek geleceği bildiğini iddia etmez.</li>
          <li>• Sonuçlar kesin tarih veya kesin gelecek iddiası içermez.</li>
          <li>• Sağlık, hukuk, yatırım ve benzeri konularda yönlendirme yapılmaz; uzman desteği önerilir.</li>
          <li>• Analitik tamamen anonimdir; soru metinleri istatistiklere taşınmaz.</li>
        </ul>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/read"
          className="inline-block rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-8 py-3.5 font-display text-sm tracking-[0.18em] text-gold-pale"
        >
          BİR SORU SOR
        </Link>
      </div>
    </div>
  );
}
