import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: 'Baba Vanga kullanım koşulları ve sorumluluk sınırları.',
  openGraph: { title: 'Kullanım Koşulları | Baba Vanga' },
};

export default function TermsPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="font-display text-[11px] tracking-widest2 text-gold/70">YASAL</p>
      <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">Kullanım Koşulları</h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-ash">
        <section>
          <h2 className="font-display text-lg text-mist">1. Hizmetin niteliği</h2>
          <p className="mt-3">
            Baba Vanga, kural tabanlı bir interaktif yorum motorudur. İçerikler
            eğlence ve kişisel düşünme amacı taşır. Gelecekten haber verme iddiası
            yoktur; yorumlar olasılık ve tema diliyle yazılmıştır.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-mist">2. Sorumluluk sınırları</h2>
          <p className="mt-3">
            Sitedeki hiçbir içerik tıbbi, hukuki, finansal veya psikolojik profesyonel
            tavsiye yerine geçmez. Bu alanlardaki kararlar için mutlaka ilgili
            uzmanlara danışınız. Zor durumda olan kullanıcılarımızı profesyonel
            destek kaynaklarına yönlendiririz.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-mist">3. Kullanım kuralları</h2>
          <p className="mt-3">
            Sistemi kötüye kullanmak (aşırı istek göndermek, otomatik botlarla
            veri çekmek, başka kullanıcıların verilerine erişmeye çalışmak)
            yasaktır. API'ler rate limit ile korunur.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-mist">4. Ödeme</h2>
          <p className="mt-3">
            Bu sürümde ödeme sistemi simülasyon (mock) modundadır; hiçbir gerçek
            tahsilat yapılmaz. Gerçek ödeme sağlayıcısı entegre edildiğinde bu
            koşullar güncellenecektir.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-mist">5. Değişiklikler</h2>
          <p className="mt-3">
            Hizmet ve bu koşullar zamanla güncellenebilir. Güncellemeler bu sayfada
            yayınlanır.
          </p>
        </section>
      </div>
    </div>
  );
}
