import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hakkında',
  description: 'Baba Vanga nedir, ne değildir? Kural tabanlı yorum motorunun hikâyesi ve etik sınırları.',
  openGraph: { title: 'Hakkında | Baba Vanga' },
};

export default function AboutPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="font-display text-[11px] tracking-widest2 text-gold/70">HAKKINDA</p>
      <h1 className="mt-4 font-display text-3xl text-mist sm:text-4xl">
        Bir sohbet botu değil, <span className="text-gold">bir yorum motoru</span>
      </h1>

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-ash">
        <p>
          Baba Vanga, klasik fal sitelerinin "tıkla, kartını al, aynı cümleyi oku"
          döngüsünden sıkılmış biri için tasarlandı. Buradaki fikir basit:
          iyi bir yorum, iyi bir dinlemeyle başlar. Bu yüzden sistem önce sana
          sorular sorar — cevabın, sıradaki soruyu değiştirir.
        </p>
        <p>
          Motorun içinde bugün 110'a yakın dallanan soru, 22 Büyük Arcana'nın
          tamamı için ayrıntılı anlam veritabanı, 12 numeroloji sayısının yorum
          havuzları, 16 sembolün dört bağlamdan anlamları ve 120'den fazla
          yorum parçası var. Bunlar; skorlama, koşullu seçim ve şablon
          kurallarıyla birleştirilerek sana özel bir metin üretir.
        </p>
        <p>
          Sitede yapay zekâ, dil modeli veya harici servis kullanılmaz. Aynı
          oturum ve aynı cevaplar her zaman aynı sonucu verir. Aynı soruyu
          yeniden sorduğunda ise parça seçimi değişir — çünkü her oturum kendi
          tohumuyla (seed) çalışır. Ama değişen yalnızca anlatım biçimidir;
          yön, cevapların tarafından belirlenir.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gold/20 bg-veil/50 p-6">
          <h2 className="font-display text-lg text-gold-pale">Ne olduğunu bilir</h2>
          <ul className="mt-3 space-y-2 text-sm text-ash">
            <li>✦ Cevaplarına dayalı, kişiselleştirilmiş yorumlar</li>
            <li>✦ Numeroloji, tarot, astroloji ve sembol sistemlerinin birleşimi</li>
            <li>✦ Tamamen anonim deneyim — hesapsız kullanım</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-red-400/20 bg-red-950/10 p-6">
          <h2 className="font-display text-lg text-red-200/90">Olduğunu iddia etmez</h2>
          <ul className="mt-3 space-y-2 text-sm text-ash">
            <li>✕ Gerçek geleceği bilemez</li>
            <li>✕ Kesin tarih söylemez</li>
            <li>✕ Sağlık, hukuk, yatırım konularında yönlendirme yapmaz</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/read"
          className="inline-block rounded-xl border border-gold/60 bg-gradient-to-b from-gold/25 to-gold/5 px-8 py-3.5 font-display text-sm tracking-[0.18em] text-gold-pale"
        >
          DENEYİMİ BAŞLAT
        </Link>
      </div>
    </div>
  );
}
