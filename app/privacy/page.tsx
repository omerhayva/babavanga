import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'Baba Vanga gizlilik politikası: hangi veriler toplanır, ne süreyle saklanır, kimseyle paylaşılmaz.',
  openGraph: { title: 'Gizlilik Politikası | Baba Vanga' },
};

export default function PrivacyPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="font-display text-[11px] tracking-widest2 text-gold/70">YASAL</p>
      <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">Gizlilik Politikası</h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-ash">
        <section>
          <h2 className="font-display text-lg text-mist">Toplanan veriler</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li><strong className="text-mist/90">Soru ve cevaplar:</strong> Yazdığın soru, akıştaki cevapların, seçtiğin semboller ve kartlar. Bunlar yorumun üretimi ve "Geçmiş Sorularım" için saklanır.</li>
            <li><strong className="text-mist/90">Doğum bilgileri (isteğe bağlı):</strong> İsim ve doğum tarihi/saati; yalnızca numeroloji ve astroloji hesaplarında kullanılır.</li>
            <li><strong className="text-mist/90">Hesap bilgileri (isteğe bağlı):</strong> E-posta ve scrypt ile hash'lenmiş şifre.</li>
            <li><strong className="text-mist/90">Anonim analitik:</strong> Olay tipi ve zaman damgası (örn. "question_started"). Soru metinleri analitiğe taşınmaz.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-mist">Çerezler</h2>
          <p className="mt-3">
            İki tür çerez kullanılır: (1) <em>misafir kimliği</em> — hesapsız kullanırken
            geçmiş sorularının sana bağlı kalması için rastgele üretilmiş anonim bir
            tanımlayıcı; (2) <em>oturum çerezi</em> — giriş yaptıysan kimliğini doğrulayan
            imzalı bir çerez. Reklam veya takip çerezi kullanılmaz; hiçbir veri üçüncü
            taraflarla paylaşılmaz.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-mist">Saklama ve silme</h2>
          <p className="mt-3">
            Veriler yalnızca hizmetin çalışması için saklanır. Hesabını silmek
            istediğin talebin üzerine verilerin kaldırılır. Misafir verileri,
            tanımlayıcı çerezi temizlendiğinde artık erişilemez olur.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-mist">Yasal uyarı</h2>
          <p className="mt-3">
            Bu sitedeki tüm içerik eğlence ve kişisel düşünme amacıyla hazırlanmıştır.
            Kesin gelecek tahmini veya profesyonel tavsiye (tıbbi, hukuki, finansal)
            değildir. Sağlık, hukuk ve yatırım kararları için ilgili uzmanlara
            danışınız.
          </p>
        </section>
      </div>
    </div>
  );
}
