import Link from 'next/link';
import { getCategories } from '@/lib/db/content';
import QuestionStarter from '@/components/home/QuestionStarter';
import HomeAnalytics from '@/components/home/HomeAnalytics';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    glyph: '✍',
    title: 'Sorunu yaz',
    text: 'Aklındaki soruyu kendi cümlelerinle yaz. Kategori otomatik belirlenir.',
  },
  {
    glyph: '☾',
    title: 'Sistem sana sorular sorsun',
    text: 'Her cevabın sıradaki soruyu değiştirir. Herkes aynı soruları görmez.',
  },
  {
    glyph: '◈',
    title: 'Sembolleri seç',
    text: 'İçinden gelen üç sembolü seç; yorum motoruna girdi olur.',
  },
  {
    glyph: '🃏',
    title: 'Kartları çek',
    text: 'Kapalı desteden sen seç; kartların yönü ve anlamı hesaplanır.',
  },
  {
    glyph: '✦',
    title: 'Yorumun oluşsun',
    text: 'Cevapların + numeroloji + tarot + astroloji + semboller birleşir.',
  },
];

export default function HomePage() {
  const categories = getCategories();

  return (
    <div className="animate-fade-in">
      <HomeAnalytics />

      {/* ---------------------------------------------------------- HERO */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-16 text-center sm:px-6 sm:pt-24">
        <p className="animate-fade-in font-display text-[11px] tracking-widest2 text-gold/80 sm:text-xs">
          İNTERAKTİF KEHANET MOTORU
        </p>
        <h1 className="mt-6 animate-fade-up font-display text-4xl leading-[1.15] text-mist sm:text-6xl">
          BİR SORUN VARSA,
          <br />
          <span className="text-gold">CEVABI HEMEN VERME.</span>
        </h1>
        <p className="mt-5 animate-fade-up font-display text-lg italic text-amethyst-soft sm:text-2xl">
          Önce doğru soruları soralım.
        </p>
        <p className="mt-6 max-w-2xl animate-fade-up text-sm leading-relaxed text-ash sm:text-base">
          Hayatındaki bir soruyu yaz. Sistem sana sorular sorsun, verdiğin
          cevaplardan farklı yöntemleri bir araya getirerek sana özel bir yorum
          oluştursun.
        </p>

        <div className="mt-10 w-full max-w-2xl">
          <QuestionStarter />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/how-it-works"
            className="rounded-xl border border-amethyst/40 px-5 py-2.5 text-sm text-amethyst-soft transition-colors hover:border-amethyst hover:bg-amethyst/10"
          >
            Nasıl Çalışıyor?
          </Link>
          <Link
            href="/questions"
            className="rounded-xl border border-gold/25 px-5 py-2.5 text-sm text-gold-pale/90 transition-colors hover:border-gold/60 hover:bg-gold/5"
          >
            Konulara Göz At
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------- ADIMLAR */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="gold-rule font-display text-sm tracking-[0.3em]">
          <span>YOLCULUK</span>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="card-hover rounded-2xl border border-gold/10 bg-veil/50 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl text-gold/90">{s.glyph}</span>
                <span className="font-display text-xs text-gold/40">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-base text-mist">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-ash">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- KATEGORİLER */}
      <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <div className="gold-rule font-display text-sm tracking-[0.3em]">
          <span>NE SORMAK İSTERSİN?</span>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/questions?k=${c.id}`}
              className="card-hover group rounded-2xl border border-gold/10 bg-veil/40 p-4 sm:p-5"
            >
              <span className="text-xl text-gold/90 transition-transform duration-500 group-hover:scale-110">
                {c.glyph}
              </span>
              <div className="mt-3 font-display text-sm text-mist sm:text-base">{c.name}</div>
              <p className="mt-1 hidden text-[11px] leading-relaxed text-ash/80 sm:block">
                {c.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- GÜVEN NOTU */}
      <section className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
        <div className="rounded-2xl border border-amethyst/20 bg-veil/30 p-6 sm:p-8">
          <h2 className="font-display text-lg text-amethyst-soft">
            Rastgele bir fal değil, bir hesaplama
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ash">
            Burada yapay zekâ yok. Sonuçlar; verdiğin cevapların puanlanması,
            isim ve doğum tarihi hesapları, 22 Büyük Arcana kartının anlam
            veritabanı, burç tabloları, sembol eşleştirmeleri ve yüzlerce yorum
            parçasının kurallara göre birleştirilmesiyle oluşur. Aynı cevaplar
            aynı oturumda aynı sonucu verir — çünkü bu bir motor, bir kâhin
            performansı değil.
          </p>
        </div>
      </section>
    </div>
  );
}
